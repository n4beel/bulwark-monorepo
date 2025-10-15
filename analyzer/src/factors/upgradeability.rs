use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{visit::Visit, Expr, ItemFn, Path};

/// Metrics for upgradeability and governance control patterns
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct UpgradeabilityMetrics {
    // Upgradeability detection
    pub total_upgradeable_programs: u32,
    pub upgradeable_loader_usage: u32,
    pub anchor_upgradeable_patterns: u32,
    pub program_upgrade_calls: u32,

    // Authority patterns
    pub single_key_authorities: u32,
    pub multisig_authorities: u32,
    pub governance_authorities: u32,
    pub timelocked_authorities: u32,
    pub unknown_authorities: u32,
    pub total_upgrade_authorities: u32,

    // Governance integration
    pub governance_program_calls: u32,
    pub timelock_detection: u32,
    pub upgrade_delay_patterns: u32,
    pub governance_voting_patterns: u32,

    // Control mechanisms
    pub upgrade_control_functions: u32,
    pub authority_transfer_functions: u32,
    pub emergency_upgrade_functions: u32,
    pub upgrade_pause_functions: u32,

    // Detailed pattern breakdown
    pub upgradeability_pattern_breakdown: HashMap<String, u32>,

    // Risk assessment
    pub upgradeability_risk_score: f64,
    pub governance_maturity_score: f64,
    pub upgrade_control_score: f64,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl UpgradeabilityMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalUpgradeablePrograms": self.total_upgradeable_programs,
            "upgradeableLoaderUsage": self.upgradeable_loader_usage,
            "anchorUpgradeablePatterns": self.anchor_upgradeable_patterns,
            "programUpgradeCalls": self.program_upgrade_calls,
            "singleKeyAuthorities": self.single_key_authorities,
            "multisigAuthorities": self.multisig_authorities,
            "governanceAuthorities": self.governance_authorities,
            "timelockedAuthorities": self.timelocked_authorities,
            "unknownAuthorities": self.unknown_authorities,
            "totalUpgradeAuthorities": self.total_upgrade_authorities,
            "governanceProgramCalls": self.governance_program_calls,
            "timelockDetection": self.timelock_detection,
            "upgradeDelayPatterns": self.upgrade_delay_patterns,
            "governanceVotingPatterns": self.governance_voting_patterns,
            "upgradeControlFunctions": self.upgrade_control_functions,
            "authorityTransferFunctions": self.authority_transfer_functions,
            "emergencyUpgradeFunctions": self.emergency_upgrade_functions,
            "upgradePauseFunctions": self.upgrade_pause_functions,
            "upgradeabilityPatternBreakdown": self.upgradeability_pattern_breakdown,
            "upgradeabilityRiskScore": self.upgradeability_risk_score,
            "governanceMaturityScore": self.governance_maturity_score,
            "upgradeControlScore": self.upgrade_control_score,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped
        })
    }
}

/// Visitor for detecting upgradeability and governance patterns
#[derive(Debug)]
struct UpgradeabilityVisitor {
    current_file_path: String,

    // Pattern counters
    upgradeable_loader_usage: u32,
    anchor_upgradeable_patterns: u32,
    program_upgrade_calls: u32,

    // Authority detection
    single_key_authorities: u32,
    multisig_authorities: u32,
    governance_authorities: u32,
    timelocked_authorities: u32,
    unknown_authorities: u32,

    // Governance integration
    governance_program_calls: u32,
    timelock_detection: u32,
    upgrade_delay_patterns: u32,
    governance_voting_patterns: u32,

    // Control mechanisms
    upgrade_control_functions: u32,
    authority_transfer_functions: u32,
    emergency_upgrade_functions: u32,
    upgrade_pause_functions: u32,

    // Pattern tracking
    upgradeability_pattern_counts: HashMap<String, u32>,
}

impl UpgradeabilityVisitor {
    fn new() -> Self {
        Self {
            current_file_path: String::new(),
            upgradeable_loader_usage: 0,
            anchor_upgradeable_patterns: 0,
            program_upgrade_calls: 0,
            single_key_authorities: 0,
            multisig_authorities: 0,
            governance_authorities: 0,
            timelocked_authorities: 0,
            unknown_authorities: 0,
            governance_program_calls: 0,
            timelock_detection: 0,
            upgrade_delay_patterns: 0,
            governance_voting_patterns: 0,
            upgrade_control_functions: 0,
            authority_transfer_functions: 0,
            emergency_upgrade_functions: 0,
            upgrade_pause_functions: 0,
            upgradeability_pattern_counts: HashMap::new(),
        }
    }

    /// Record an upgradeability pattern
    fn record_pattern(&mut self, pattern: &str) {
        *self
            .upgradeability_pattern_counts
            .entry(pattern.to_string())
            .or_insert(0) += 1;
    }

    /// Check if a path represents upgradeable loader usage
    fn is_upgradeable_loader(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "upgradeable_loader"
                    | "BPFLoaderUpgradeable"
                    | "deploy_program"
                    | "upgrade_program"
                    | "set_upgrade_authority"
            )
        } else {
            false
        }
    }

    /// Check if a path represents governance program
    fn is_governance_program(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "governance"
                    | "spl_governance"
                    | "governance_program"
                    | "create_proposal"
                    | "cast_vote"
                    | "execute_proposal"
            )
        } else {
            false
        }
    }

    /// Check if a method call is upgrade-related
    fn is_upgrade_method(&self, method_name: &str) -> bool {
        matches!(
            method_name,
            "upgrade"
                | "set_upgrade_authority"
                | "transfer_upgrade_authority"
                | "deploy"
                | "upgrade_program"
                | "set_authority"
        )
    }

    /// Check if a method call is governance-related
    fn is_governance_method(&self, method_name: &str) -> bool {
        matches!(
            method_name,
            "create_proposal"
                | "cast_vote"
                | "execute_proposal"
                | "cancel_proposal"
                | "finalize_vote"
                | "withdraw_vote"
        )
    }

    /// Check if a method call is timelock-related
    fn is_timelock_method(&self, method_name: &str) -> bool {
        matches!(
            method_name,
            "set_delay"
                | "execute_delayed"
                | "cancel_delayed"
                | "queue_transaction"
                | "execute_transaction"
                | "cancel_transaction"
        )
    }

    /// Check if a function name indicates upgrade control
    fn is_upgrade_control_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "upgrade_program"
                | "set_upgrade_authority"
                | "transfer_upgrade_authority"
                | "pause_upgrades"
                | "resume_upgrades"
                | "emergency_upgrade"
                | "governance_upgrade"
        )
    }

    /// Check if a function name indicates authority transfer
    fn is_authority_transfer_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "transfer_authority"
                | "set_authority"
                | "change_authority"
                | "delegate_authority"
                | "revoke_authority"
        )
    }

    /// Check if a function name indicates emergency upgrade
    fn is_emergency_upgrade_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "emergency_upgrade"
                | "emergency_pause"
                | "emergency_stop"
                | "force_upgrade"
                | "immediate_upgrade"
        )
    }

    /// Check if a function name indicates upgrade pause
    fn is_upgrade_pause_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "pause_upgrades"
                | "resume_upgrades"
                | "freeze_upgrades"
                | "disable_upgrades"
                | "enable_upgrades"
        )
    }

    /// Analyze authority type from context
    fn analyze_authority_type(&mut self, context: &str) {
        if context.contains("multisig") || context.contains("multi_sig") {
            self.multisig_authorities += 1;
            self.record_pattern("multisig_authority");
        } else if context.contains("governance") || context.contains("spl_governance") {
            self.governance_authorities += 1;
            self.record_pattern("governance_authority");
        } else if context.contains("timelock") || context.contains("delay") {
            self.timelocked_authorities += 1;
            self.record_pattern("timelocked_authority");
        } else if context.contains("single")
            || context.contains("owner")
            || context.contains("admin")
        {
            self.single_key_authorities += 1;
            self.record_pattern("single_key_authority");
        } else {
            self.unknown_authorities += 1;
            self.record_pattern("unknown_authority");
        }
    }
}

impl<'ast> Visit<'ast> for UpgradeabilityVisitor {
    fn visit_expr(&mut self, node: &'ast Expr) {
        match node {
            Expr::Call(call_expr) => {
                if let Expr::Path(path_expr) = &*call_expr.func {
                    // Check for upgradeable loader usage
                    if self.is_upgradeable_loader(&path_expr.path) {
                        self.upgradeable_loader_usage += 1;
                        self.record_pattern("upgradeable_loader");
                    }

                    // Check for governance program calls
                    if self.is_governance_program(&path_expr.path) {
                        self.governance_program_calls += 1;
                        self.record_pattern("governance_program");
                    }
                }
            }
            Expr::MethodCall(method_call) => {
                let method_name = method_call.method.to_string();

                // Check for upgrade-related methods
                if self.is_upgrade_method(&method_name) {
                    self.program_upgrade_calls += 1;
                    self.record_pattern(&format!("upgrade_method_{}", method_name));
                }

                // Check for governance-related methods
                if self.is_governance_method(&method_name) {
                    self.governance_voting_patterns += 1;
                    self.record_pattern(&format!("governance_method_{}", method_name));
                }

                // Check for timelock-related methods
                if self.is_timelock_method(&method_name) {
                    self.timelock_detection += 1;
                    self.upgrade_delay_patterns += 1;
                    self.record_pattern(&format!("timelock_method_{}", method_name));
                }
            }
            _ => {}
        }

        // Continue visiting expression
        syn::visit::visit_expr(self, node);
    }

    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let func_name = node.sig.ident.to_string();

        // Check for upgrade control functions
        if self.is_upgrade_control_function(&func_name) {
            self.upgrade_control_functions += 1;
            self.record_pattern(&format!("upgrade_control_{}", func_name));
        }

        // Check for authority transfer functions
        if self.is_authority_transfer_function(&func_name) {
            self.authority_transfer_functions += 1;
            self.record_pattern(&format!("authority_transfer_{}", func_name));
        }

        // Check for emergency upgrade functions
        if self.is_emergency_upgrade_function(&func_name) {
            self.emergency_upgrade_functions += 1;
            self.record_pattern(&format!("emergency_upgrade_{}", func_name));
        }

        // Check for upgrade pause functions
        if self.is_upgrade_pause_function(&func_name) {
            self.upgrade_pause_functions += 1;
            self.record_pattern(&format!("upgrade_pause_{}", func_name));
        }

        // Analyze function body for authority patterns
        let func_content = quote::quote!(#node).to_string();
        self.analyze_authority_type(&func_content);

        // Continue visiting function body
        syn::visit::visit_item_fn(self, node);
    }
}

/// Calculate upgradeability metrics for workspace
pub fn calculate_workspace_upgradeability(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<UpgradeabilityMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 UPGRADEABILITY DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = UpgradeabilityMetrics::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            log::warn!(
                "🔍 UPGRADEABILITY DEBUG: File does not exist: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!(
                "🔍 UPGRADEABILITY DEBUG: Skipping non-Rust file: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        log::info!("🔍 UPGRADEABILITY DEBUG: Analyzing file: {:?}", full_path);

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = UpgradeabilityVisitor::new();
        visitor.current_file_path = file_path.to_string();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.upgradeable_loader_usage += visitor.upgradeable_loader_usage;
        metrics.anchor_upgradeable_patterns += visitor.anchor_upgradeable_patterns;
        metrics.program_upgrade_calls += visitor.program_upgrade_calls;
        metrics.single_key_authorities += visitor.single_key_authorities;
        metrics.multisig_authorities += visitor.multisig_authorities;
        metrics.governance_authorities += visitor.governance_authorities;
        metrics.timelocked_authorities += visitor.timelocked_authorities;
        metrics.unknown_authorities += visitor.unknown_authorities;
        metrics.governance_program_calls += visitor.governance_program_calls;
        metrics.timelock_detection += visitor.timelock_detection;
        metrics.upgrade_delay_patterns += visitor.upgrade_delay_patterns;
        metrics.governance_voting_patterns += visitor.governance_voting_patterns;
        metrics.upgrade_control_functions += visitor.upgrade_control_functions;
        metrics.authority_transfer_functions += visitor.authority_transfer_functions;
        metrics.emergency_upgrade_functions += visitor.emergency_upgrade_functions;
        metrics.upgrade_pause_functions += visitor.upgrade_pause_functions;

        // Merge pattern breakdown
        for (pattern, count) in visitor.upgradeability_pattern_counts {
            *metrics
                .upgradeability_pattern_breakdown
                .entry(pattern)
                .or_insert(0) += count;
        }

        files_analyzed += 1;

        log::info!(
            "🔍 UPGRADEABILITY DEBUG: File {} analysis complete - upgradeable loader: {}, governance: {}, timelock: {}, upgrade control: {}",
            file_path,
            visitor.upgradeable_loader_usage,
            visitor.governance_program_calls,
            visitor.timelock_detection,
            visitor.upgrade_control_functions
        );
    }

    // Add file analysis metadata
    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    // Calculate total upgradeable programs (heuristic)
    metrics.total_upgradeable_programs = if metrics.upgradeable_loader_usage > 0 {
        1
    } else {
        0
    };
    metrics.total_upgrade_authorities = metrics.single_key_authorities
        + metrics.multisig_authorities
        + metrics.governance_authorities
        + metrics.timelocked_authorities
        + metrics.unknown_authorities;

    // Calculate risk scores
    // Upgradeability Risk Score (lower is better)
    let single_key_risk = metrics.single_key_authorities as f64 * 10.0; // High risk
    let multisig_risk = metrics.multisig_authorities as f64 * 5.0; // Medium risk
    let governance_risk = metrics.governance_authorities as f64 * 2.0; // Low risk
    let timelocked_risk = metrics.timelocked_authorities as f64 * 1.0; // Very low risk
    let unknown_risk = metrics.unknown_authorities as f64 * 8.0; // High risk
    let emergency_risk = metrics.emergency_upgrade_functions as f64 * 15.0; // Very high risk

    metrics.upgradeability_risk_score = single_key_risk
        + multisig_risk
        + governance_risk
        + timelocked_risk
        + unknown_risk
        + emergency_risk;

    // Governance Maturity Score (higher is better)
    let governance_score = metrics.governance_program_calls as f64 * 3.0;
    let timelock_score = metrics.timelock_detection as f64 * 5.0;
    let voting_score = metrics.governance_voting_patterns as f64 * 2.0;
    let control_score = metrics.upgrade_control_functions as f64 * 1.0;

    metrics.governance_maturity_score =
        governance_score + timelock_score + voting_score + control_score;

    // Upgrade Control Score (higher is better)
    let pause_score = metrics.upgrade_pause_functions as f64 * 3.0;
    let transfer_score = metrics.authority_transfer_functions as f64 * 2.0;
    let control_functions_score = metrics.upgrade_control_functions as f64 * 1.0;

    metrics.upgrade_control_score = pause_score + transfer_score + control_functions_score;

    log::info!(
        "🔍 UPGRADEABILITY DEBUG: Analysis complete - {} files analyzed, {} files skipped, upgradeable programs: {}, risk score: {:.1}, governance maturity: {:.1}, control score: {:.1}",
        files_analyzed,
        files_skipped,
        metrics.total_upgradeable_programs,
        metrics.upgradeability_risk_score,
        metrics.governance_maturity_score,
        metrics.upgrade_control_score
    );

    Ok(metrics)
}
