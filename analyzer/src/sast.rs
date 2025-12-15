//! SAST (Static Application Security Testing) module
//!
//! Integrates sol-azy CLI tool for security analysis of Solana programs

use anyhow::{Context, Result};
use serde_json;
use std::path::Path;
use std::process::Command;
use std::time::Instant;

/// Version information for sol-azy
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SolazyVersion {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}

impl SolazyVersion {
    pub fn from_string(version_str: &str) -> Option<Self> {
        // Parse version string like "sol-azy 0.1.0", "sol-azy 0.1", "0.1.0", or "0.1"
        let version_str = version_str.trim();
        let version_part = if version_str.starts_with("sol-azy") {
            version_str.split_whitespace().nth(1)?
        } else {
            version_str
        };

        let parts: Vec<&str> = version_part.split('.').collect();
        // Handle versions with 2 parts (0.1) or 3 parts (0.1.0)
        if parts.len() >= 2 {
            Some(SolazyVersion {
                major: parts[0].parse().ok()?,
                minor: parts[1].parse().ok()?,
                patch: parts.get(2).and_then(|p| p.parse().ok()).unwrap_or(0),
            })
        } else {
            None
        }
    }

    pub fn to_string(&self) -> String {
        format!("{}.{}.{}", self.major, self.minor, self.patch)
    }
}

/// Check if sol-azy is available and return its version
pub fn check_solazy_available() -> Result<Option<SolazyVersion>> {
    let solazy_path = std::env::var("SOLAZY_PATH").unwrap_or_else(|_| "sol-azy".to_string());

    let output = Command::new(&solazy_path)
        .arg("--version")
        .output()
        .context("Failed to execute sol-azy. Is it installed?")?;

    if !output.status.success() {
        return Ok(None);
    }

    let version_str =
        String::from_utf8(output.stdout).context("Failed to parse sol-azy version output")?;

    let version = SolazyVersion::from_string(&version_str);
    Ok(version)
}

/// Check if a version is compatible with our requirements
pub fn is_version_compatible(version: &SolazyVersion) -> bool {
    // Minimum required version: 0.1.0
    version.major >= 0 && (version.major > 0 || version.minor >= 1)
}

/// Run SAST analysis on a workspace
pub async fn run_sast_analysis(
    workspace_path: &Path,
    selected_files: Option<&[String]>,
) -> Result<SastResult> {
    let start_time = Instant::now();
    let solazy_path = std::env::var("SOLAZY_PATH").unwrap_or_else(|_| "sol-azy".to_string());

    // Check if sol-azy is available
    let version = match check_solazy_available() {
        Ok(Some(v)) => {
            if !is_version_compatible(&v) {
                log::warn!("sol-azy version {} may not be compatible", v.to_string());
            }
            Some(v)
        }
        Ok(None) => {
            return Err(anyhow::anyhow!(
                "sol-azy is not installed or not accessible"
            ));
        }
        Err(e) => {
            return Err(e);
        }
    };

    // Check if SAST is enabled
    let enabled = std::env::var("SOLAZY_ENABLED")
        .unwrap_or_else(|_| "true".to_string())
        .parse::<bool>()
        .unwrap_or(true);

    if !enabled {
        return Err(anyhow::anyhow!("SAST is disabled via SOLAZY_ENABLED=false"));
    }

    // Set timeout
    let timeout_secs: u64 = std::env::var("SOLAZY_TIMEOUT_SECONDS")
        .unwrap_or_else(|_| "60".to_string())
        .parse()
        .unwrap_or(60);

    log::info!(
        "Running sol-azy SAST analysis on workspace: {:?}",
        workspace_path
    );

    // Build command - sol-azy sast requires --target-dir
    // --rules-dir is optional (sol-azy uses built-in rules if not provided)
    let mut tokio_cmd = tokio::process::Command::new(&solazy_path);
    tokio_cmd.arg("sast");
    tokio_cmd.arg("--target-dir");
    tokio_cmd.arg(workspace_path);

    // Get rules directory from environment variable (optional)
    // If not set, sol-azy will use its built-in/default rules
    if let Ok(dir) = std::env::var("SOLAZY_RULES_DIR") {
        tokio_cmd.arg("--rules-dir");
        tokio_cmd.arg(&dir);
    } else {
        // Check if workspace has a rules/ directory (optional)
        let workspace_rules = workspace_path.join("rules");
        if workspace_rules.exists() && workspace_rules.is_dir() {
            tokio_cmd.arg("--rules-dir");
            tokio_cmd.arg(workspace_rules.to_string_lossy().as_ref());
        }
        // If no rules directory found, sol-azy will use built-in rules
    }

    // Use --syn-scan-only for faster analysis (recommended in docs)
    // Can be disabled via SOLAZY_FULL_SCAN=true
    let full_scan = std::env::var("SOLAZY_FULL_SCAN")
        .unwrap_or_else(|_| "false".to_string())
        .parse::<bool>()
        .unwrap_or(false);

    if !full_scan {
        tokio_cmd.arg("--syn-scan-only");
    }

    tokio_cmd.current_dir(workspace_path);

    log::debug!(
        "Running sol-azy with target-dir: {:?}, syn-scan-only: {}",
        workspace_path,
        !full_scan
    );

    // Execute command with timeout
    let output = tokio::time::timeout(
        std::time::Duration::from_secs(timeout_secs),
        tokio_cmd.output(),
    )
    .await
    .context("SAST analysis timed out")?
    .context("Failed to execute sol-azy SAST command")?;

    let execution_time_ms = start_time.elapsed().as_millis() as u64;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow::anyhow!("sol-azy SAST failed: {}", stderr));
    }

    let stdout = String::from_utf8(output.stdout).context("Failed to parse sol-azy output")?;

    // Parse output
    let parsed = parse_sast_output(&stdout, version.as_ref())?;

    Ok(SastResult {
        success: true,
        version: version.map(|v| v.to_string()),
        findings: parsed.get("findings").cloned(),
        summary: parsed.get("summary").cloned(),
        raw_output: stdout,
        execution_time_ms,
        error: None,
    })
}

/// Parse SAST output (detects format automatically)
fn parse_sast_output(
    raw_output: &str,
    _version: Option<&SolazyVersion>,
) -> Result<serde_json::Value> {
    // Try to parse as JSON first
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(raw_output) {
        return Ok(json);
    }

    // Parse sol-azy's table format output
    let mut findings = Vec::new();
    let mut summary = serde_json::json!({
        "total_findings": 0,
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
    });

    let lines: Vec<&str> = raw_output.lines().collect();
    let mut in_detailed_section = false;
    let mut current_finding: Option<serde_json::Map<String, serde_json::Value>> = None;

    for line in lines.iter() {
        let line = line.trim();

        // Detect start of detailed findings section
        if line.contains("Detailed findings:") {
            in_detailed_section = true;
            continue;
        }

        // Parse summary table rows (before detailed section)
        if !in_detailed_section
            && line.starts_with('│')
            && !line.starts_with("│ Rule Name")
            && !line.starts_with("├")
            && !line.starts_with("└")
            && !line.starts_with("┌")
        {
            // Parse table row: │ Rule Name │ Severity │ Certainty │ Files │ Total Matches │
            let parts: Vec<&str> = line
                .split('│')
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .collect();
            if parts.len() >= 5 {
                let severity = parts[1].to_lowercase();
                let total_matches: u64 = parts[4].parse().unwrap_or(0);

                if total_matches > 0 {
                    // Count by severity
                    match severity.as_str() {
                        "critical" => {
                            summary["critical"] = serde_json::json!(
                                summary["critical"].as_u64().unwrap_or(0) + total_matches
                            );
                        }
                        "high" => {
                            summary["high"] = serde_json::json!(
                                summary["high"].as_u64().unwrap_or(0) + total_matches
                            );
                        }
                        "medium" => {
                            summary["medium"] = serde_json::json!(
                                summary["medium"].as_u64().unwrap_or(0) + total_matches
                            );
                        }
                        "low" => {
                            summary["low"] = serde_json::json!(
                                summary["low"].as_u64().unwrap_or(0) + total_matches
                            );
                        }
                        _ => {}
                    }
                }
            }
        }

        // Parse detailed findings section
        if in_detailed_section {
            // Start of a new finding block
            if line.starts_with("Name:") {
                // Save previous finding if exists
                if let Some(mut finding) = current_finding.take() {
                    findings.push(serde_json::Value::Object(finding));
                }
                // Start new finding
                current_finding = Some(serde_json::Map::new());
                if let Some(ref mut finding) = current_finding {
                    let name = line.split("|").nth(1).unwrap_or("").trim();
                    finding.insert("name".to_string(), serde_json::json!(name));
                }
            } else if line.starts_with("File:") {
                if let Some(ref mut finding) = current_finding {
                    let file = line.split("|").nth(1).unwrap_or("").trim();
                    finding.insert("file".to_string(), serde_json::json!(file));
                }
            } else if line.starts_with("Version:") {
                if let Some(ref mut finding) = current_finding {
                    let version = line.split("|").nth(1).unwrap_or("").trim();
                    finding.insert("version".to_string(), serde_json::json!(version));
                }
            } else if line.starts_with("Author:") {
                if let Some(ref mut finding) = current_finding {
                    let author = line.split("|").nth(1).unwrap_or("").trim();
                    finding.insert("author".to_string(), serde_json::json!(author));
                }
            } else if line.starts_with("Severity:") {
                if let Some(ref mut finding) = current_finding {
                    let severity = line.split("|").nth(1).unwrap_or("").trim().to_lowercase();
                    finding.insert("severity".to_string(), serde_json::json!(severity));
                }
            } else if line.starts_with("Certainty:") {
                if let Some(ref mut finding) = current_finding {
                    let certainty = line.split("|").nth(1).unwrap_or("").trim().to_lowercase();
                    finding.insert("certainty".to_string(), serde_json::json!(certainty));
                }
            } else if line.starts_with("Description:") {
                if let Some(ref mut finding) = current_finding {
                    let desc = line.split("|").nth(1).unwrap_or("").trim();
                    finding.insert("description".to_string(), serde_json::json!(desc));
                }
            } else if line.starts_with("Matches found:") {
                if let Some(ref mut finding) = current_finding {
                    // Extract number from "Matches found: 1" or "Matches found: | 1 |"
                    let count_str = if line.contains('|') {
                        line.split("|").nth(1).unwrap_or("0").trim()
                    } else {
                        // Format: "Matches found: 1"
                        line.split(':').nth(1).unwrap_or("0").trim()
                    };
                    let count: u64 = count_str.parse().unwrap_or(0);
                    finding.insert("matches_count".to_string(), serde_json::json!(count));

                    // Initialize locations array
                    finding.insert(
                        "locations".to_string(),
                        serde_json::json!(Vec::<String>::new()),
                    );
                }
            } else if !line.is_empty()
                && !line.starts_with("===")
                && line.contains(':')
                && line.contains('.')
            {
                // Parse file location like "./programs/.../file.rs:123:45"
                // These appear after "Matches found:" line
                // Must contain both ':' (for line numbers) and '.' (for file extension)
                if let Some(ref mut finding) = current_finding {
                    if let Some(locations) =
                        finding.get_mut("locations").and_then(|v| v.as_array_mut())
                    {
                        // Convert relative path to absolute if needed (workspace path is already absolute)
                        let location = line.trim();
                        locations.push(serde_json::json!(location));
                    }
                }
            }
        }
    }

    // Add the last finding if any
    if let Some(finding) = current_finding {
        findings.push(serde_json::Value::Object(finding));
    }

    // Calculate total findings
    let total: u64 = summary["critical"].as_u64().unwrap_or(0)
        + summary["high"].as_u64().unwrap_or(0)
        + summary["medium"].as_u64().unwrap_or(0)
        + summary["low"].as_u64().unwrap_or(0);
    summary["total_findings"] = serde_json::json!(total);

    Ok(serde_json::json!({
        "findings": findings,
        "summary": summary,
    }))
}

/// Result of SAST analysis
#[derive(Debug, Clone)]
pub struct SastResult {
    pub success: bool,
    pub version: Option<String>,
    pub findings: Option<serde_json::Value>,
    pub summary: Option<serde_json::Value>,
    pub raw_output: String,
    pub execution_time_ms: u64,
    pub error: Option<String>,
}

impl SastResult {
    /// Convert to JSON value for API responses
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "success": self.success,
            "version": self.version,
            "findings": self.findings,
            "summary": self.summary,
            "execution_time_ms": self.execution_time_ms,
            "error": self.error,
        })
    }
}
