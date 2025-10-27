//! External dependencies analysis for Rust projects
//!
//! This module analyzes Cargo.toml dependencies and classifies them by security tier
//! to assess the overall dependency risk profile of the codebase.

use std::collections::HashSet;
use std::path::PathBuf;
use toml::Value;

#[derive(Debug, Clone)]
pub struct DependencyMetrics {
    pub total_dependencies: usize,
    pub tier_1_count: usize,              // Solana official (safest)
    pub tier_1_5_count: usize,            // Oracles & Bridges (integration risk)
    pub tier_2_count: usize,              // Security/crypto crates
    pub tier_3_count: usize,              // Popular ecosystem
    pub tier_4_count: usize,              // Unknown/custom (riskiest)
    pub dependency_factor: f64,           // Original 4-tier factor (0-100, higher = riskier)
    pub external_integration_factor: f64, // New T1.5 factor (0-100, higher = riskier)
    pub tier_1_crates: Vec<String>,
    pub tier_1_5_crates: Vec<String>, // Oracles & Bridges
    pub tier_2_crates: Vec<String>,
    pub tier_3_crates: Vec<String>,
    pub tier_4_crates: Vec<String>,
}

impl DependencyMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalDependencies": self.total_dependencies,
            "tier1Dependencies": self.tier_1_count,
            "tier1_5Dependencies": self.tier_1_5_count,
            "tier2Dependencies": self.tier_2_count,
            "tier3Dependencies": self.tier_3_count,
            "tier4Dependencies": self.tier_4_count,
            "dependencyFactor": self.dependency_factor,
            "externalIntegrationFactor": self.external_integration_factor,
            "tier1Crates": self.tier_1_crates,
            "tier1_5Crates": self.tier_1_5_crates,
            "tier2Crates": self.tier_2_crates,
            "tier3Crates": self.tier_3_crates,
            "tier4Crates": self.tier_4_crates
        })
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum DependencyTier {
    Tier1,   // Solana official (weight: 0.1)
    Tier1_5, // Oracles & Bridges (weight: 0.2)
    Tier2,   // Security/crypto (weight: 0.3)
    Tier3,   // Popular ecosystem (weight: 0.5)
    Tier4,   // Unknown/custom (weight: 1.0)
}

pub struct DependencyClassifier {
    solana_official: HashSet<String>,
    oracles_and_bridges: HashSet<String>,
    crypto_security: HashSet<String>,
    rust_ecosystem: HashSet<String>,
}

impl DependencyClassifier {
    pub fn new() -> Self {
        let solana_official = [
            // Core Solana
            "solana-program",
            "solana-sdk",
            "solana-client",
            "solana-cli-config",
            "solana-logger",
            "solana-version",
            "solana-clap-utils",
            // Anchor Framework
            "anchor-lang",
            "anchor-spl",
            "anchor-client",
            "anchor-syn",
            // SPL Libraries
            "spl-token",
            "spl-associated-token-account",
            "spl-token-2022",
            "spl-governance",
            "spl-memo",
            "spl-name-service",
            // Metaplex
            "mpl-token-metadata",
            "mpl-candy-machine",
            "mpl-auction-house",
            "mpl-bubblegum",
            "mpl-token-auth-rules",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect();

        let crypto_security = [
            // Hash functions
            "sha2",
            "sha3",
            "blake2",
            "blake3",
            "md5",
            "sha1",
            // Cryptographic signatures
            "ed25519-dalek",
            "curve25519-dalek",
            "secp256k1",
            "k256",
            "p256",
            "p384",
            "ecdsa",
            "rsa",
            // Random number generation
            "rand",
            "rand_core",
            "rand_chacha",
            "getrandom",
            // Cryptographic utilities
            "subtle",
            "zeroize",
            "constant_time_eq",
            "crypto-bigint",
            // Encoding/Decoding
            "base64",
            "hex",
            "bs58",
            "bech32",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect();

        let rust_ecosystem = [
            // Serialization
            "serde",
            "serde_json",
            "serde_yaml",
            "toml",
            "bincode",
            // Async runtime
            "tokio",
            "async-trait",
            "futures",
            "futures-util",
            // Error handling
            "thiserror",
            "anyhow",
            "eyre",
            "miette",
            // CLI utilities
            "clap",
            "structopt",
            "env_logger",
            "log",
            "tracing",
            // Data structures
            "indexmap",
            "smallvec",
            "bytes",
            "uuid",
            "chrono",
            // Network/HTTP
            "reqwest",
            "hyper",
            "axum",
            "warp",
            "tower",
            // Parsing
            "nom",
            "pest",
            "regex",
            "lazy_static",
            "once_cell",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect();

        // --- ADD ORACLES & BRIDGES LIST ---
        let oracles_and_bridges = [
            // Oracles
            "pyth-sdk-solana",
            "pyth-solana-receiver",
            "switchboard-solana",
            "switchboard-v2",
            // Bridges
            "wormhole-sdk",
            "wormhole-anchor-sdk",
            "wormhole-solana",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect();

        Self {
            solana_official,
            oracles_and_bridges,
            crypto_security,
            rust_ecosystem,
        }
    }

    pub fn classify(&self, crate_name: &str) -> DependencyTier {
        // 1. Check exact matches in curated lists first (high confidence)
        // --- CHECK T1.5 FIRST (HIGHEST PRIORITY) ---
        if self.oracles_and_bridges.contains(crate_name) {
            return DependencyTier::Tier1_5;
        }

        if self.solana_official.contains(crate_name) {
            return DependencyTier::Tier1;
        }

        if self.crypto_security.contains(crate_name) {
            return DependencyTier::Tier2;
        }

        if self.rust_ecosystem.contains(crate_name) {
            return DependencyTier::Tier3;
        }

        // 2. Pattern matching for Oracles & Bridges
        if crate_name.starts_with("pyth-")
            || crate_name.starts_with("switchboard-")
            || crate_name.starts_with("wormhole-")
        {
            return DependencyTier::Tier1_5;
        }

        // 3. Pattern matching for Solana ecosystem
        if crate_name.starts_with("anchor-")
            || crate_name.starts_with("spl-")
            || crate_name.starts_with("solana-")
            || crate_name.starts_with("mpl-")
        {
            return DependencyTier::Tier1;
        }

        // 4. Pattern matching for crypto crates
        if self.is_crypto_pattern(crate_name) {
            return DependencyTier::Tier2;
        }

        // 5. Pattern matching for common Rust patterns
        if self.is_rust_ecosystem_pattern(crate_name) {
            return DependencyTier::Tier3;
        }

        // 6. Default to unknown/custom
        DependencyTier::Tier4
    }

    fn is_crypto_pattern(&self, name: &str) -> bool {
        name.contains("crypto")
            || name.contains("hash")
            || name.contains("sign")
            || name.ends_with("-dalek")
            || name.starts_with("sha")
            || name.starts_with("blake")
            || name.contains("cipher")
            || name.contains("digest")
            || name.contains("aead")
            || name.contains("hmac")
    }

    fn is_rust_ecosystem_pattern(&self, name: &str) -> bool {
        name.starts_with("serde_")
            || name.starts_with("tokio-")
            || name.starts_with("tracing-")
            || name.starts_with("tower-")
            || name.contains("proc-macro")
            || name.ends_with("-derive")
    }
}

impl Default for DependencyMetrics {
    fn default() -> Self {
        Self {
            total_dependencies: 0,
            tier_1_count: 0,
            tier_1_5_count: 0,
            tier_2_count: 0,
            tier_3_count: 0,
            tier_4_count: 0,
            dependency_factor: 0.0,           // No dependencies = no risk
            external_integration_factor: 0.0, // No integrations = no risk
            tier_1_crates: Vec::new(),
            tier_1_5_crates: Vec::new(),
            tier_2_crates: Vec::new(),
            tier_3_crates: Vec::new(),
            tier_4_crates: Vec::new(),
        }
    }
}

impl DependencyMetrics {
    pub fn calculate_score(&mut self) {
        self.total_dependencies =
            self.tier_1_count + self.tier_2_count + self.tier_3_count + self.tier_4_count;

        if self.total_dependencies == 0 {
            self.dependency_factor = 0.0; // No dependencies = no risk
            return;
        }

        // 1. Calculate the Weighted Risk Score (0.0 to 1.0)
        let total = self.total_dependencies as f64;
        let weighted_risk_sum = self.tier_1_count as f64 * 0.1 +  // Solana official (very safe)
            self.tier_2_count as f64 * 0.3 +  // Security crates (safe)
            self.tier_3_count as f64 * 0.5 +  // Popular ecosystem (moderate)
            self.tier_4_count as f64 * 1.0; // Unknown/custom (risky)

        let base_risk_score_0_1 = weighted_risk_sum / total;

        // 2. Scale to 0-100 (Higher is riskier)
        self.dependency_factor = base_risk_score_0_1 * 100.0;

        // 3. Ensure bounds (already handled by the calculation but good practice)
        self.dependency_factor = self.dependency_factor.max(0.0).min(100.0);
    }

    /// Calculates the "External Integration" factor (0-100)
    /// This factor is based *only* on the count of T1.5 dependencies.
    /// We'll set a low upper bound: 3+ integrations is 100% risk.
    pub fn calculate_integration_factor(&mut self) {
        let raw_score = self.tier_1_5_count as f64;
        let upper_bound = 3.0;

        if raw_score == 0.0 {
            self.external_integration_factor = 0.0;
        } else {
            let factor = (raw_score / upper_bound) * 100.0;
            self.external_integration_factor = factor.min(100.0); // Cap at 100
        }
    }

    pub fn add_dependency(&mut self, crate_name: String, tier: DependencyTier) {
        match tier {
            DependencyTier::Tier1 => {
                self.tier_1_count += 1;
                self.tier_1_crates.push(crate_name);
            }
            DependencyTier::Tier1_5 => {
                self.tier_1_5_count += 1;
                self.tier_1_5_crates.push(crate_name);
            }
            DependencyTier::Tier2 => {
                self.tier_2_count += 1;
                self.tier_2_crates.push(crate_name);
            }
            DependencyTier::Tier3 => {
                self.tier_3_count += 1;
                self.tier_3_crates.push(crate_name);
            }
            DependencyTier::Tier4 => {
                self.tier_4_count += 1;
                self.tier_4_crates.push(crate_name);
            }
        }
    }
}

/// Collect all local crate names from workspace members and package names
fn collect_local_crates(
    cargo_toml_paths: &[PathBuf],
) -> Result<HashSet<String>, Box<dyn std::error::Error>> {
    let mut local_crates = HashSet::new();

    for cargo_toml_path in cargo_toml_paths {
        let cargo_content = std::fs::read_to_string(cargo_toml_path)
            .map_err(|e| format!("Failed to read Cargo.toml {:?}: {}", cargo_toml_path, e))?;

        let cargo_toml: Value = toml::from_str(&cargo_content)
            .map_err(|e| format!("Failed to parse Cargo.toml {:?}: {}", cargo_toml_path, e))?;

        // Check if this is a workspace root (has [workspace] section)
        let is_workspace_root = cargo_toml.get("workspace").is_some();

        if is_workspace_root {
            log::debug!("Collecting workspace members from: {:?}", cargo_toml_path);

            // Extract workspace members from [workspace.members]
            if let Some(workspace) = cargo_toml.get("workspace").and_then(|w| w.as_table()) {
                if let Some(members) = workspace.get("members").and_then(|m| m.as_array()) {
                    for member in members {
                        if let Some(member_str) = member.as_str() {
                            // Extract package name from member path
                            let member_path = PathBuf::from(member_str);
                            if let Some(package_name) =
                                member_path.file_name().and_then(|n| n.to_str())
                            {
                                local_crates.insert(package_name.to_string());
                                log::debug!("Found workspace member: {}", package_name);
                            }
                        }
                    }
                }
            }
        }

        // Collect package name from this Cargo.toml (if it's a package)
        if let Some(package) = cargo_toml.get("package").and_then(|v| v.as_table()) {
            if let Some(name) = package.get("name").and_then(|v| v.as_str()) {
                local_crates.insert(name.to_string());
                log::debug!("Found package name: {}", name);
            }
        }
    }

    log::info!(
        "Collected {} local crates: {:?}",
        local_crates.len(),
        local_crates
    );
    Ok(local_crates)
}

/// Process a dependency table and filter out local dependencies
fn process_dependency_table(
    deps_table: &toml::Table,
    local_crates: &HashSet<String>,
    workspace_dependencies: &std::collections::HashMap<String, String>,
    classifier: &DependencyClassifier,
    metrics: &mut DependencyMetrics,
) {
    for (name, dep_value) in deps_table {
        let name_str = name.clone();

        // Check if this is a workspace dependency
        if let Some(dep_table) = dep_value.as_table() {
            if dep_table.contains_key("workspace") {
                // This is a workspace dependency, resolve it
                if let Some(workspace_dep_name) = workspace_dependencies.get(&name_str) {
                    log::debug!(
                        "Resolved workspace dependency '{}' -> '{}'",
                        name_str,
                        workspace_dep_name
                    );

                    // Check if the resolved dependency is local
                    if local_crates.contains(workspace_dep_name) {
                        log::debug!(
                            "Ignoring local workspace dependency: {} -> {}",
                            name_str,
                            workspace_dep_name
                        );
                        continue;
                    }

                    // Classify the resolved external dependency
                    let tier = classifier.classify(workspace_dep_name);
                    log::debug!(
                        "Classified workspace dependency '{}' as {:?}",
                        workspace_dep_name,
                        tier
                    );
                    metrics.add_dependency(workspace_dep_name.clone(), tier);
                } else {
                    log::debug!(
                        "Workspace dependency '{}' not found in workspace root",
                        name_str
                    );
                    // Treat as external if not found in workspace
                    if !local_crates.contains(&name_str) {
                        let tier = classifier.classify(&name_str);
                        log::debug!(
                            "Classified unresolved workspace dependency '{}' as {:?}",
                            name_str,
                            tier
                        );
                        metrics.add_dependency(name_str, tier);
                    } else {
                        log::debug!("Ignoring local crate dependency: {}", name_str);
                    }
                }
                continue;
            }

            // Check if this is a path dependency (local)
            if dep_table.contains_key("path") {
                log::debug!("Ignoring local path dependency: {}", name_str);
                continue;
            }
        }

        // Check if the dependency name itself is a known local crate
        if local_crates.contains(&name_str) {
            log::debug!("Ignoring local crate dependency: {}", name_str);
            continue;
        }

        // Must be an external dependency - classify it
        let tier = classifier.classify(&name_str);
        log::debug!(
            "Classified external dependency '{}' as {:?}",
            name_str,
            tier
        );
        metrics.add_dependency(name_str, tier);
    }
}

/// Recursively find Cargo.toml files with depth limit
fn find_cargo_toml_recursive(
    dir: &PathBuf,
    cargo_toml_paths: &mut Vec<PathBuf>,
    current_depth: usize,
    max_depth: usize,
    found_any: &mut bool,
) -> Result<(), Box<dyn std::error::Error>> {
    if current_depth >= max_depth {
        return Ok(());
    }

    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                // Skip common non-Rust directories
                let dir_name = path.file_name().unwrap_or_default().to_string_lossy();
                if dir_name.starts_with('.')
                    || dir_name == "target"
                    || dir_name == "node_modules"
                    || dir_name == "dist"
                    || dir_name == "build"
                {
                    continue;
                }

                // Recursively search subdirectories
                find_cargo_toml_recursive(
                    &path,
                    cargo_toml_paths,
                    current_depth + 1,
                    max_depth,
                    found_any,
                )?;
            } else if path.file_name().unwrap_or_default() == "Cargo.toml" {
                log::info!(
                    "🔍 DEPENDENCIES DEBUG: Found Cargo.toml via recursive search: {:?}",
                    path
                );
                cargo_toml_paths.push(path);
                *found_any = true;
            }
        }
    }
    Ok(())
}

/// Calculate external dependencies metrics for workspace
pub fn calculate_workspace_dependencies(
    workspace_path: &PathBuf,
    _selected_files: &[String], // We analyze Cargo.toml instead of individual files
) -> Result<DependencyMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 DEPENDENCIES DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );
    log::info!(
        "🔍 DEPENDENCIES DEBUG: Workspace exists: {}",
        workspace_path.exists()
    );
    log::info!(
        "🔍 DEPENDENCIES DEBUG: Workspace is directory: {}",
        workspace_path.is_dir()
    );

    let classifier = DependencyClassifier::new();
    let mut metrics = DependencyMetrics::default();

    // First, try to find Cargo.toml files in the workspace
    let mut cargo_toml_paths = Vec::new();

    // Check root Cargo.toml
    let root_cargo_toml = workspace_path.join("Cargo.toml");
    log::info!(
        "🔍 DEPENDENCIES DEBUG: Checking root Cargo.toml: {:?}",
        root_cargo_toml
    );
    log::info!(
        "🔍 DEPENDENCIES DEBUG: Root Cargo.toml exists: {}",
        root_cargo_toml.exists()
    );
    if root_cargo_toml.exists() {
        cargo_toml_paths.push(root_cargo_toml);
    }

    // Check for workspace members (common patterns in smart contract projects)
    let common_member_dirs = [
        "program",
        "programs",
        "src",
        "crates",
        "packages",
        "contracts",
        "solana-programs",
        "anchor-programs",
        "lib",
        "bin",
        "apps",
        "services",
    ];
    for member_dir in &common_member_dirs {
        let member_cargo_toml = workspace_path.join(member_dir).join("Cargo.toml");
        log::info!(
            "🔍 DEPENDENCIES DEBUG: Checking {}/Cargo.toml: {:?}",
            member_dir,
            member_cargo_toml
        );
        log::info!(
            "🔍 DEPENDENCIES DEBUG: {}/Cargo.toml exists: {}",
            member_dir,
            member_cargo_toml.exists()
        );
        if member_cargo_toml.exists() {
            cargo_toml_paths.push(member_cargo_toml);
        }

        // Special handling for programs/ directory - check subdirectories
        if member_dir == &"programs" {
            let programs_dir = workspace_path.join("programs");
            if programs_dir.exists() {
                log::info!(
                    "🔍 DEPENDENCIES DEBUG: Found programs directory, checking subdirectories"
                );
                if let Ok(program_entries) = std::fs::read_dir(&programs_dir) {
                    for program_entry in program_entries.flatten() {
                        let program_path = program_entry.path();
                        if program_path.is_dir() {
                            let program_cargo = program_path.join("Cargo.toml");
                            if program_cargo.exists() {
                                log::info!(
                                    "🔍 DEPENDENCIES DEBUG: Found program Cargo.toml: {:?}",
                                    program_cargo
                                );
                                cargo_toml_paths.push(program_cargo);
                            }
                        }
                    }
                }
            }
        }
    }

    // Check for programs/*/Cargo.toml pattern (common in Anchor projects)
    let programs_dir = workspace_path.join("programs");
    if programs_dir.exists() && programs_dir.is_dir() {
        log::info!("🔍 DEPENDENCIES DEBUG: Found programs directory, checking for subdirectories");
        if let Ok(entries) = std::fs::read_dir(&programs_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let program_cargo_toml = path.join("Cargo.toml");
                    log::info!(
                        "🔍 DEPENDENCIES DEBUG: Checking programs/{}/Cargo.toml: {:?}",
                        path.file_name().unwrap_or_default().to_string_lossy(),
                        program_cargo_toml
                    );
                    log::info!(
                        "🔍 DEPENDENCIES DEBUG: programs/{}/Cargo.toml exists: {}",
                        path.file_name().unwrap_or_default().to_string_lossy(),
                        program_cargo_toml.exists()
                    );
                    if program_cargo_toml.exists() {
                        cargo_toml_paths.push(program_cargo_toml);
                    }
                }
            }
        }
    }

    // List all files in workspace for debugging and check for nested projects
    if let Ok(entries) = std::fs::read_dir(workspace_path) {
        log::info!("🔍 DEPENDENCIES DEBUG: Contents of workspace directory:");
        for entry in entries.flatten() {
            let path = entry.path();
            let is_dir = path.is_dir();
            log::info!(
                "🔍 DEPENDENCIES DEBUG:   {}: {:?}",
                if is_dir { "DIR" } else { "FILE" },
                path.file_name().unwrap_or_default()
            );

            // Check for nested project structure (common when extracting zips)
            if is_dir {
                let dir_name = path.file_name().unwrap_or_default().to_string_lossy();
                log::info!(
                    "🔍 DEPENDENCIES DEBUG: Checking nested directory: {}",
                    dir_name
                );

                // Check if this subdirectory contains Cargo.toml files
                let nested_root_cargo = path.join("Cargo.toml");
                if nested_root_cargo.exists() {
                    log::info!(
                        "🔍 DEPENDENCIES DEBUG: Found nested root Cargo.toml: {:?}",
                        nested_root_cargo
                    );
                    cargo_toml_paths.push(nested_root_cargo);
                }

                // Check for nested member directories
                for member_dir in &common_member_dirs {
                    let nested_member_cargo = path.join(member_dir).join("Cargo.toml");
                    if nested_member_cargo.exists() {
                        log::info!(
                            "🔍 DEPENDENCIES DEBUG: Found nested {}/Cargo.toml: {:?}",
                            member_dir,
                            nested_member_cargo
                        );
                        cargo_toml_paths.push(nested_member_cargo);
                    }

                    // Special handling for nested programs/ directory
                    if member_dir == &"programs" {
                        let nested_programs_dir = path.join("programs");
                        if nested_programs_dir.exists() {
                            log::info!("🔍 DEPENDENCIES DEBUG: Found nested programs directory, checking subdirectories");
                            if let Ok(program_entries) = std::fs::read_dir(&nested_programs_dir) {
                                for program_entry in program_entries.flatten() {
                                    let program_path = program_entry.path();
                                    if program_path.is_dir() {
                                        let program_cargo = program_path.join("Cargo.toml");
                                        if program_cargo.exists() {
                                            log::info!("🔍 DEPENDENCIES DEBUG: Found nested program Cargo.toml: {:?}", program_cargo);
                                            cargo_toml_paths.push(program_cargo);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // If no Cargo.toml found, try recursive search as fallback
    if cargo_toml_paths.is_empty() {
        log::warn!(
            "🔍 DEPENDENCIES DEBUG: No Cargo.toml files found in common locations, trying recursive search"
        );

        // Recursive search for Cargo.toml files (with depth limit to avoid infinite recursion)
        let mut found_any = false;
        if let Err(e) =
            find_cargo_toml_recursive(workspace_path, &mut cargo_toml_paths, 0, 3, &mut found_any)
        {
            log::warn!("🔍 DEPENDENCIES DEBUG: Recursive search failed: {}", e);
        }

        if !found_any {
            log::warn!(
                "🔍 DEPENDENCIES DEBUG: No Cargo.toml files found anywhere in workspace: {:?}",
                workspace_path
            );
            log::warn!("🔍 DEPENDENCIES DEBUG: Returning empty metrics (score = 100.0)");
            return Ok(metrics); // Return empty metrics (score = 100.0)
        }
    }

    log::info!(
        "Found {} Cargo.toml files to analyze",
        cargo_toml_paths.len()
    );

    // PASS 1: Collect all local crate names
    let local_crates = collect_local_crates(&cargo_toml_paths)?;

    // Extract dependencies from all found Cargo.toml files
    let mut workspace_dependencies = std::collections::HashMap::new();

    // First pass: collect workspace dependencies from workspace root
    for cargo_toml_path in &cargo_toml_paths {
        let cargo_content = std::fs::read_to_string(cargo_toml_path)
            .map_err(|e| format!("Failed to read Cargo.toml {:?}: {}", cargo_toml_path, e))?;

        let cargo_toml: Value = toml::from_str(&cargo_content)
            .map_err(|e| format!("Failed to parse Cargo.toml {:?}: {}", cargo_toml_path, e))?;

        // Check if this is a workspace root (has [workspace] section)
        let is_workspace_root = cargo_toml.get("workspace").is_some();

        if is_workspace_root {
            log::debug!(
                "Collecting workspace dependencies from: {:?}",
                cargo_toml_path
            );

            // Extract workspace dependencies
            if let Some(workspace_deps) = cargo_toml
                .get("workspace")
                .and_then(|w| w.get("dependencies"))
                .and_then(|v| v.as_table())
            {
                for (name, _) in workspace_deps {
                    workspace_dependencies.insert(name.clone(), name.clone());
                    log::debug!("Found workspace dependency: {}", name);
                }
            }
        }
    }

    // PASS 2 & 3: Analyze dependencies with local filtering
    for cargo_toml_path in &cargo_toml_paths {
        log::debug!("Analyzing Cargo.toml: {:?}", cargo_toml_path);

        // Parse Cargo.toml
        let cargo_content = std::fs::read_to_string(cargo_toml_path)
            .map_err(|e| format!("Failed to read Cargo.toml {:?}: {}", cargo_toml_path, e))?;

        let cargo_toml: Value = toml::from_str(&cargo_content)
            .map_err(|e| format!("Failed to parse Cargo.toml {:?}: {}", cargo_toml_path, e))?;

        // Check if this is a workspace root (has [workspace] section)
        let is_workspace_root = cargo_toml.get("workspace").is_some();

        if is_workspace_root {
            log::debug!("Skipping workspace root Cargo.toml dependencies (already collected workspace deps)");
            continue;
        }

        // Process regular dependencies
        if let Some(deps) = cargo_toml.get("dependencies").and_then(|v| v.as_table()) {
            process_dependency_table(
                deps,
                &local_crates,
                &workspace_dependencies,
                &classifier,
                &mut metrics,
            );
        }

        // Process dev dependencies
        if let Some(dev_deps) = cargo_toml
            .get("dev-dependencies")
            .and_then(|v| v.as_table())
        {
            process_dependency_table(
                dev_deps,
                &local_crates,
                &workspace_dependencies,
                &classifier,
                &mut metrics,
            );
        }

        // Process build dependencies
        if let Some(build_deps) = cargo_toml
            .get("build-dependencies")
            .and_then(|v| v.as_table())
        {
            process_dependency_table(
                build_deps,
                &local_crates,
                &workspace_dependencies,
                &classifier,
                &mut metrics,
            );
        }
    }

    // Calculate final scores
    metrics.calculate_score(); // Calculates the original dependencyFactor
    metrics.calculate_integration_factor(); // Calculates the new externalIntegrationFactor

    log::info!(
        "Dependencies analysis complete: {} total, T1: {}, T1.5: {}, T2: {}, T3: {}, T4: {}, DepFactor: {:.1}, IntFactor: {:.1}",
        metrics.total_dependencies,
        metrics.tier_1_count,
        metrics.tier_1_5_count,
        metrics.tier_2_count,
        metrics.tier_3_count,
        metrics.tier_4_count,
        metrics.dependency_factor,
        metrics.external_integration_factor
    );

    Ok(metrics)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dependency_classification() {
        let classifier = DependencyClassifier::new();

        // Test Tier 1 (Solana official)
        assert_eq!(classifier.classify("anchor-lang"), DependencyTier::Tier1);
        assert_eq!(classifier.classify("spl-token"), DependencyTier::Tier1);
        assert_eq!(classifier.classify("solana-program"), DependencyTier::Tier1);
        assert_eq!(
            classifier.classify("anchor-custom-extension"),
            DependencyTier::Tier1
        ); // Pattern match

        // Test Tier 2 (Crypto/Security)
        assert_eq!(classifier.classify("sha2"), DependencyTier::Tier2);
        assert_eq!(classifier.classify("ed25519-dalek"), DependencyTier::Tier2);
        assert_eq!(
            classifier.classify("custom-crypto-lib"),
            DependencyTier::Tier2
        ); // Pattern match

        // Test Tier 3 (Popular ecosystem)
        assert_eq!(classifier.classify("serde"), DependencyTier::Tier3);
        assert_eq!(classifier.classify("tokio"), DependencyTier::Tier3);
        assert_eq!(classifier.classify("serde_custom"), DependencyTier::Tier3); // Pattern match

        // Test Tier 4 (Unknown)
        assert_eq!(classifier.classify("unknown-crate"), DependencyTier::Tier4);
        assert_eq!(
            classifier.classify("custom-business-logic"),
            DependencyTier::Tier4
        );
    }

    #[test]
    fn test_metrics_calculation() {
        let mut metrics = DependencyMetrics::default();

        // Add some dependencies
        metrics.add_dependency("anchor-lang".to_string(), DependencyTier::Tier1);
        metrics.add_dependency("serde".to_string(), DependencyTier::Tier3);
        metrics.add_dependency("unknown-crate".to_string(), DependencyTier::Tier4);

        metrics.calculate_score();

        assert_eq!(metrics.total_dependencies, 3);
        assert_eq!(metrics.tier_1_count, 1);
        assert_eq!(metrics.tier_3_count, 1);
        assert_eq!(metrics.tier_4_count, 1);
        assert!(metrics.dependency_factor > 0.0);
        assert!(metrics.dependency_factor <= 100.0);
    }

    #[test]
    fn test_empty_dependencies() {
        let mut metrics = DependencyMetrics::default();
        metrics.calculate_score();

        assert_eq!(metrics.total_dependencies, 0);
        assert_eq!(metrics.dependency_factor, 0.0); // No risk for no dependencies
    }

    #[test]
    fn test_all_solana_dependencies() {
        let mut metrics = DependencyMetrics::default();

        metrics.add_dependency("anchor-lang".to_string(), DependencyTier::Tier1);
        metrics.add_dependency("spl-token".to_string(), DependencyTier::Tier1);
        metrics.add_dependency("solana-program".to_string(), DependencyTier::Tier1);

        metrics.calculate_score();

        // With 3 Tier 1 dependencies: (3 * 0.1) / 3 * 100 = 10.0
        assert!((metrics.dependency_factor - 10.0).abs() < 0.01); // Should get very low risk (all Tier 1)
    }

    #[test]
    fn test_local_crate_collection() {
        // Test that local crates are properly identified
        let classifier = DependencyClassifier::new();

        // Test that local crates are filtered out
        let mut local_crates = HashSet::new();
        local_crates.insert("program_a".to_string());
        local_crates.insert("program_b".to_string());
        local_crates.insert("shared".to_string());

        let mut metrics = DependencyMetrics::default();
        let workspace_deps = std::collections::HashMap::new();

        // Simulate processing a dependency table with local and external deps
        let mut deps_table = toml::Table::new();

        // Local path dependency
        let mut local_dep = toml::Table::new();
        local_dep.insert(
            "path".to_string(),
            toml::Value::String("../shared".to_string()),
        );
        deps_table.insert("shared".to_string(), toml::Value::Table(local_dep));

        // External dependency
        deps_table.insert(
            "anchor-lang".to_string(),
            toml::Value::String("0.29.0".to_string()),
        );

        // Local crate name dependency
        deps_table.insert(
            "program_a".to_string(),
            toml::Value::String("0.1.0".to_string()),
        );

        process_dependency_table(
            &deps_table,
            &local_crates,
            &workspace_deps,
            &classifier,
            &mut metrics,
        );

        // Should only have anchor-lang classified, not shared or program_a
        assert_eq!(metrics.tier_1_count, 1); // Only anchor-lang
        assert_eq!(metrics.tier_4_count, 0); // No unknown dependencies
    }

    #[test]
    fn test_workspace_dependency_resolution() {
        let classifier = DependencyClassifier::new();
        let mut local_crates = HashSet::new();
        local_crates.insert("shared".to_string());

        let mut workspace_deps = std::collections::HashMap::new();
        workspace_deps.insert("shared".to_string(), "anchor-lang".to_string());

        let mut metrics = DependencyMetrics::default();

        let mut deps_table = toml::Table::new();

        // Workspace dependency that resolves to external crate
        let mut workspace_dep = toml::Table::new();
        workspace_dep.insert("workspace".to_string(), toml::Value::Boolean(true));
        deps_table.insert("shared".to_string(), toml::Value::Table(workspace_dep));

        process_dependency_table(
            &deps_table,
            &local_crates,
            &workspace_deps,
            &classifier,
            &mut metrics,
        );

        // Should classify the resolved external dependency
        assert_eq!(metrics.tier_1_count, 1); // anchor-lang
    }
}
