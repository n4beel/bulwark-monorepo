//! CLI API Communication
//!
//! Handles all communication with the Bulwark backend API.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

use super::cli_config::CliConfig;
use super::cli_display::{print_info, print_success, print_warning, AnalysisReceipt, Spinner};

/// Get CLI API Key from environment variable (set at build time or runtime)
/// Priority: 1. Build-time CLI_API_KEY, 2. Runtime CLI_API_KEY (from .env), 3. Placeholder
fn get_cli_api_key() -> String {
    // Try build-time env first (embedded in binary)
    if let Some(key) = option_env!("CLI_API_KEY") {
        if !key.is_empty() {
            return key.to_string();
        }
    }
    // Then try runtime env (from .env file or shell)
    if let Ok(key) = std::env::var("CLI_API_KEY") {
        if !key.is_empty() {
            return key;
        }
    }
    // Fallback placeholder (will fail auth)
    "bulwark-cli-placeholder".to_string()
}

/// Response from the build-report endpoint
#[derive(Debug, Deserialize)]
pub struct BuildReportResponse {
    pub _id: String,
    pub repository: String,
    pub scores: Option<serde_json::Value>,
    pub report: Option<serde_json::Value>,
}

/// Request payload for building a report
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildReportRequest {
    pub rust_service_response: RustServiceResponse,
    pub metadata: ReportMetadata,
    pub performance_metrics: PerformanceMetrics,
    pub analysis_status: AnalysisStatus,
}

#[derive(Debug, Serialize)]
pub struct RustServiceResponse {
    pub success: bool,
    pub factors: Option<serde_json::Value>,
    pub ai_factors: Option<serde_json::Value>,
    pub sast_results: Option<serde_json::Value>,
    pub calculated_scores: Option<serde_json::Value>,
    pub calculated_report: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportMetadata {
    pub project_name: String,
    pub original_filename: Option<String>,
    pub repository_url: Option<String>,
    pub framework: String,
    pub language: Option<String>,
    pub user_id: Option<String>,
    pub commit_url: Option<String>,
    pub commit_hash: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PerformanceMetrics {
    pub start_time: u64,
    pub end_time: u64,
    pub memory_start: u64,
    pub memory_end: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisStatus {
    pub rust_analysis_success: bool,
    pub rust_analysis_error: Option<String>,
    pub ai_analysis_success: bool,
    pub ai_analysis_error: Option<String>,
}

/// Send analysis results to the backend and get the saved report
pub async fn submit_analysis(
    analysis_result: &serde_json::Value,
    project_name: &str,
    framework: &str,
    start_time: u64,
    end_time: u64,
) -> Result<BuildReportResponse> {
    let config = CliConfig::load()?;

    // Extract the components from the analysis result
    let factors = analysis_result.get("factors").cloned();
    let ai_factors = analysis_result.get("ai_factors").cloned();
    let sast_results = analysis_result.get("sast_results").cloned();
    let calculated_scores = analysis_result.get("calculated_scores").cloned();
    let calculated_report = analysis_result.get("calculated_report").cloned();

    let rust_analysis_success = analysis_result
        .get("success")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let ai_analysis_success = ai_factors.is_some();

    // Build the request
    let request = BuildReportRequest {
        rust_service_response: RustServiceResponse {
            success: rust_analysis_success,
            factors,
            ai_factors,
            sast_results,
            calculated_scores,
            calculated_report,
        },
        metadata: ReportMetadata {
            project_name: project_name.to_string(),
            original_filename: Some(format!("{}.zip", project_name)),
            repository_url: None, // CLI analysis from local directory
            framework: framework.to_string(),
            language: Some("rust".to_string()),
            user_id: config.user.as_ref().map(|u| u.id.clone()),
            commit_url: None,
            commit_hash: get_git_commit_hash(),
        },
        performance_metrics: PerformanceMetrics {
            start_time,
            end_time,
            memory_start: 0,
            memory_end: 0,
        },
        analysis_status: AnalysisStatus {
            rust_analysis_success,
            rust_analysis_error: None,
            ai_analysis_success,
            ai_analysis_error: if !ai_analysis_success {
                Some("AI analysis not performed".to_string())
            } else {
                None
            },
        },
    };

    let client = reqwest::Client::new();

    let mut req_builder = client
        .post(&format!("{}/static-analysis/build-report", config.api_url))
        .header("X-API-Key", get_cli_api_key())
        .header("Content-Type", "application/json");

    // Add auth token if logged in
    if let Some(ref token) = config.auth_token {
        req_builder = req_builder.header("Authorization", format!("Bearer {}", token));
    }

    let response = req_builder
        .json(&request)
        .send()
        .await
        .context("Failed to connect to Bulwark server")?;

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!("Server error ({}): {}", status, error_text));
    }

    let report: BuildReportResponse = response
        .json()
        .await
        .context("Failed to parse server response")?;

    Ok(report)
}

/// Sync all queued offline analyses
pub async fn sync_queued_analyses() -> Result<()> {
    let mut config = CliConfig::load()?;

    if config.queued_analyses.is_empty() {
        print_info("No queued analyses to sync.");
        return Ok(());
    }

    let count = config.queued_analyses.len();
    print_info(&format!("Syncing {} queued analyses...", count));

    let mut synced = 0;
    let mut failed = 0;

    // Clone the queue to iterate
    let queue = config.queued_analyses.clone();

    for analysis in queue {
        let mut spinner = Spinner::new(&format!("Syncing '{}'", analysis.project_name));

        match submit_queued_analysis(&analysis).await {
            Ok(_) => {
                spinner.success("Synced");
                config.remove_queued(&analysis.id)?;
                synced += 1;
            }
            Err(e) => {
                spinner.fail(&format!("Failed: {}", e));
                failed += 1;
            }
        }
    }

    println!();
    if synced > 0 {
        print_success(&format!("{} analyses synced successfully", synced));
    }
    if failed > 0 {
        print_warning(&format!("{} analyses failed to sync", failed));
    }

    Ok(())
}

/// Submit a single queued analysis
async fn submit_queued_analysis(
    analysis: &super::cli_config::QueuedAnalysis,
) -> Result<BuildReportResponse> {
    let config = CliConfig::load()?;

    let client = reqwest::Client::new();

    let mut req_builder = client
        .post(&format!("{}/static-analysis/build-report", config.api_url))
        .header("X-API-Key", get_cli_api_key())
        .header("Content-Type", "application/json");

    if let Some(ref token) = config.auth_token {
        req_builder = req_builder.header("Authorization", format!("Bearer {}", token));
    }

    // Get the analysis data from JSON string storage
    let analysis_data = analysis
        .get_analysis_data()
        .ok_or_else(|| anyhow::anyhow!("Failed to parse queued analysis data"))?;

    let response = req_builder
        .json(&analysis_data)
        .send()
        .await
        .context("Failed to connect to server")?;

    if !response.status().is_success() {
        let error = response.text().await.unwrap_or_default();
        return Err(anyhow::anyhow!("Server error: {}", error));
    }

    response.json().await.context("Failed to parse response")
}

/// Check if the server is reachable
pub async fn check_server_connectivity() -> bool {
    let config = match CliConfig::load() {
        Ok(c) => c,
        Err(_) => return false,
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .unwrap_or_default();

    // Backend health endpoint is POST
    client
        .post(&format!("{}/static-analysis/health", config.api_url))
        .send()
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false)
}

/// Get current git commit hash if in a git repository
fn get_git_commit_hash() -> Option<String> {
    std::process::Command::new("git")
        .args(["rev-parse", "HEAD"])
        .output()
        .ok()
        .and_then(|output| {
            if output.status.success() {
                String::from_utf8(output.stdout)
                    .ok()
                    .map(|s| s.trim().to_string())
            } else {
                None
            }
        })
}

/// Build receipt from API response
pub fn build_receipt_from_response(
    response: &BuildReportResponse,
    project_name: &str,
    files_count: usize,
    lines_of_code: u64,
    local_scores: Option<&serde_json::Value>,
    web_url: &str,
) -> AnalysisReceipt {
    let base_url = web_url;

    // Extract scores from response or use local
    let scores = response.scores.as_ref().or(local_scores);

    let (structural, security, systemic, economic, total) = if let Some(s) = scores {
        (
            s.get("structural").and_then(|v| v.as_f64()).unwrap_or(0.0),
            s.get("security").and_then(|v| v.as_f64()).unwrap_or(0.0),
            s.get("systemic").and_then(|v| v.as_f64()).unwrap_or(0.0),
            s.get("economic").and_then(|v| v.as_f64()).unwrap_or(0.0),
            s.get("total").and_then(|v| v.as_f64()).unwrap_or(0.0),
        )
    } else {
        (0.0, 0.0, 0.0, 0.0, 0.0)
    };

    // Extract audit effort from report
    let report = response.report.as_ref();
    let lower_effort = report
        .and_then(|r| r.get("lowerAuditEffort"))
        .map(|e| super::cli_display::AuditEstimate {
            min_days: e
                .get("timeRange")
                .and_then(|t| t.get("minimumDays"))
                .and_then(|v| v.as_u64())
                .unwrap_or(7) as u32,
            max_days: e
                .get("timeRange")
                .and_then(|t| t.get("maximumDays"))
                .and_then(|v| v.as_u64())
                .unwrap_or(14) as u32,
            resources: e.get("resources").and_then(|v| v.as_u64()).unwrap_or(2) as u32,
            min_cost: e
                .get("costRange")
                .and_then(|t| t.get("minimumCost"))
                .and_then(|v| v.as_u64())
                .unwrap_or(5000) as u32,
            max_cost: e
                .get("costRange")
                .and_then(|t| t.get("maximumCost"))
                .and_then(|v| v.as_u64())
                .unwrap_or(12000) as u32,
        })
        .unwrap_or(super::cli_display::AuditEstimate {
            min_days: 7,
            max_days: 14,
            resources: 2,
            min_cost: 5000,
            max_cost: 12000,
        });

    let upper_effort = report
        .and_then(|r| r.get("upperAuditEffort"))
        .map(|e| super::cli_display::AuditEstimate {
            min_days: e
                .get("timeRange")
                .and_then(|t| t.get("minimumDays"))
                .and_then(|v| v.as_u64())
                .unwrap_or(10) as u32,
            max_days: e
                .get("timeRange")
                .and_then(|t| t.get("maximumDays"))
                .and_then(|v| v.as_u64())
                .unwrap_or(20) as u32,
            resources: e.get("resources").and_then(|v| v.as_u64()).unwrap_or(3) as u32,
            min_cost: e
                .get("costRange")
                .and_then(|t| t.get("minimumCost"))
                .and_then(|v| v.as_u64())
                .unwrap_or(10000) as u32,
            max_cost: e
                .get("costRange")
                .and_then(|t| t.get("maximumCost"))
                .and_then(|v| v.as_u64())
                .unwrap_or(24000) as u32,
        })
        .unwrap_or(super::cli_display::AuditEstimate {
            min_days: 10,
            max_days: 20,
            resources: 3,
            min_cost: 10000,
            max_cost: 24000,
        });

    // Extract hotspots
    let hotspots_data = report.and_then(|r| r.get("hotspots"));
    let hotspots = super::cli_display::Hotspots {
        total: hotspots_data
            .and_then(|h| h.get("totalCount"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as usize,
        high_risk: hotspots_data
            .and_then(|h| h.get("highRiskCount"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as usize,
        medium_risk: hotspots_data
            .and_then(|h| h.get("mediumRiskCount"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as usize,
        low_priority: hotspots_data
            .and_then(|h| h.get("lowPriorityCount"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as usize,
    };

    // Extract receipt ID and transaction
    let receipt_id = report
        .and_then(|r| r.get("receiptId"))
        .and_then(|v| v.as_str())
        .map(String::from);
    let transaction = report
        .and_then(|r| r.get("hrefUrl"))
        .and_then(|v| v.as_str())
        .map(String::from);
    let has_receipt = receipt_id.is_some();
    let commit_url = report
        .and_then(|r| r.get("commitUrl"))
        .and_then(|v| v.as_str())
        .map(String::from);

    AnalysisReceipt {
        project_name: project_name.to_string(),
        files_count,
        lines_of_code,
        complexity_score: total,
        scores: super::cli_display::Scores {
            structural,
            security,
            systemic,
            economic,
            total,
        },
        audit_effort: super::cli_display::AuditEffort {
            lower: lower_effort,
            upper: upper_effort,
        },
        hotspots,
        report_id: Some(response._id.clone()),
        report_url: Some(format!("{}/reports/{}", base_url, response._id)),
        receipt_id,
        commit_url,
        transaction_signature: transaction,
        encrypted_by_arcium: has_receipt,
    }
}
