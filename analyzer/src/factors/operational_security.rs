use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{visit::Visit, Attribute, Expr, ExprCall, ItemFn, ItemStruct, Lit, LitStr, Path};

/// Metrics for Operational Security patterns
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct OperationalSecurityMetrics {
    // Pause/Kill-switch Mechanisms
    pub pause_functions: u32,
    pub unpause_functions: u32,
    pub emergency_stop_functions: u32,
    pub kill_switch_functions: u32,
    pub pause_state_fields: u32,
    pub emergency_mode_fields: u32,
    pub halt_state_fields: u32,
    pub pause_authority_patterns: u32,

    // Admin Emergency Controls
    pub emergency_admin_functions: u32,
    pub emergency_override_functions: u32,
    pub emergency_fund_withdrawal: u32,
    pub admin_parameter_override: u32,
    pub emergency_config_changes: u32,
    pub emergency_authority_transfers: u32,
    pub emergency_pause_authority: u32,

    // Network Parameter Dependencies
    pub hardcoded_cluster_addresses: u32,
    pub network_specific_constants: u32,
    pub rpc_endpoint_dependencies: u32,
    pub cluster_specific_behavior: u32,
    pub mainnet_specific_code: u32,
    pub devnet_specific_code: u32,
    pub testnet_specific_code: u32,

    // Upgrade Mechanisms
    pub program_upgrade_functions: u32,
    pub authority_transfer_functions: u32,
    pub upgrade_authority_patterns: u32,
    pub program_data_modifications: u32,
    pub upgradeable_loader_usage: u32,
    pub emergency_upgrade_functions: u32,

    // Circuit Breakers and Rate Limiting
    pub rate_limiting_functions: u32,
    pub circuit_breaker_patterns: u32,
    pub threshold_based_controls: u32,
    pub max_amount_limits: u32,
    pub time_based_restrictions: u32,
    pub frequency_limits: u32,
    pub slippage_protection: u32,

    // Operational Security Patterns
    pub operational_security_patterns: u32,
    pub safety_mechanisms: u32,
    pub emergency_procedures: u32,
    pub fail_safe_patterns: u32,

    // Detailed pattern breakdown
    pub operational_pattern_breakdown: HashMap<String, u32>,

    // Scoring
    pub operational_security_score: f64,
    pub pause_mechanism_score: f64,
    pub emergency_control_score: f64,
    pub network_dependency_score: f64,
    pub upgrade_mechanism_score: f64,
    pub circuit_breaker_score: f64,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl OperationalSecurityMetrics {
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::to_value(self).unwrap_or(serde_json::Value::Null)
    }
}

/// Visitor for analyzing operational security patterns
struct OperationalSecurityVisitor {
    current_file_path: String,

    // Pause/Kill-switch counters
    pause_functions: u32,
    unpause_functions: u32,
    emergency_stop_functions: u32,
    kill_switch_functions: u32,
    pause_state_fields: u32,
    emergency_mode_fields: u32,
    halt_state_fields: u32,
    pause_authority_patterns: u32,

    // Admin emergency counters
    emergency_admin_functions: u32,
    emergency_override_functions: u32,
    emergency_fund_withdrawal: u32,
    admin_parameter_override: u32,
    emergency_config_changes: u32,
    emergency_authority_transfers: u32,
    emergency_pause_authority: u32,

    // Network dependency counters
    hardcoded_cluster_addresses: u32,
    network_specific_constants: u32,
    rpc_endpoint_dependencies: u32,
    cluster_specific_behavior: u32,
    mainnet_specific_code: u32,
    devnet_specific_code: u32,
    testnet_specific_code: u32,

    // Upgrade mechanism counters
    program_upgrade_functions: u32,
    authority_transfer_functions: u32,
    upgrade_authority_patterns: u32,
    program_data_modifications: u32,
    upgradeable_loader_usage: u32,
    emergency_upgrade_functions: u32,

    // Circuit breaker counters
    rate_limiting_functions: u32,
    circuit_breaker_patterns: u32,
    threshold_based_controls: u32,
    max_amount_limits: u32,
    time_based_restrictions: u32,
    frequency_limits: u32,
    slippage_protection: u32,

    // Operational security counters
    operational_security_patterns: u32,
    safety_mechanisms: u32,
    emergency_procedures: u32,
    fail_safe_patterns: u32,

    // Pattern tracking
    operational_pattern_counts: HashMap<String, u32>,
}

impl OperationalSecurityVisitor {
    fn new() -> Self {
        Self {
            current_file_path: String::new(),
            pause_functions: 0,
            unpause_functions: 0,
            emergency_stop_functions: 0,
            kill_switch_functions: 0,
            pause_state_fields: 0,
            emergency_mode_fields: 0,
            halt_state_fields: 0,
            pause_authority_patterns: 0,
            emergency_admin_functions: 0,
            emergency_override_functions: 0,
            emergency_fund_withdrawal: 0,
            admin_parameter_override: 0,
            emergency_config_changes: 0,
            emergency_authority_transfers: 0,
            emergency_pause_authority: 0,
            hardcoded_cluster_addresses: 0,
            network_specific_constants: 0,
            rpc_endpoint_dependencies: 0,
            cluster_specific_behavior: 0,
            mainnet_specific_code: 0,
            devnet_specific_code: 0,
            testnet_specific_code: 0,
            program_upgrade_functions: 0,
            authority_transfer_functions: 0,
            upgrade_authority_patterns: 0,
            program_data_modifications: 0,
            upgradeable_loader_usage: 0,
            emergency_upgrade_functions: 0,
            rate_limiting_functions: 0,
            circuit_breaker_patterns: 0,
            threshold_based_controls: 0,
            max_amount_limits: 0,
            time_based_restrictions: 0,
            frequency_limits: 0,
            slippage_protection: 0,
            operational_security_patterns: 0,
            safety_mechanisms: 0,
            emergency_procedures: 0,
            fail_safe_patterns: 0,
            operational_pattern_counts: HashMap::new(),
        }
    }

    /// Record an operational security pattern
    fn record_pattern(&mut self, pattern: &str) {
        *self
            .operational_pattern_counts
            .entry(pattern.to_string())
            .or_insert(0) += 1;
    }

    /// Check if a function name indicates pause mechanisms
    fn is_pause_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "pause"
                | "unpause"
                | "emergency_stop"
                | "kill_switch"
                | "halt"
                | "resume"
                | "stop"
                | "start"
                | "freeze"
                | "unfreeze"
        ) || func_name.contains("pause")
            || func_name.contains("emergency")
            || func_name.contains("kill")
            || func_name.contains("halt")
            || func_name.contains("freeze")
    }

    /// Check if a function name indicates emergency admin controls
    fn is_emergency_admin_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "emergency_withdraw"
                | "emergency_drain"
                | "emergency_rescue"
                | "emergency_override"
                | "admin_override"
                | "emergency_config"
                | "emergency_update"
                | "emergency_set"
                | "emergency_transfer"
                | "emergency_close"
        ) || func_name.contains("emergency")
            || func_name.contains("admin_override")
            || func_name.contains("emergency_")
    }

    /// Check if a function name indicates upgrade mechanisms
    fn is_upgrade_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "upgrade"
                | "transfer_authority"
                | "set_authority"
                | "change_authority"
                | "update_authority"
                | "emergency_upgrade"
                | "program_upgrade"
                | "authority_transfer"
        ) || func_name.contains("upgrade")
            || func_name.contains("authority")
            || func_name.contains("transfer")
    }

    /// Check if a function name indicates circuit breakers
    fn is_circuit_breaker_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "rate_limit"
                | "circuit_breaker"
                | "max_amount"
                | "threshold"
                | "slippage"
                | "time_limit"
                | "frequency_limit"
                | "cooldown"
                | "cool_down"
        ) || func_name.contains("rate_limit")
            || func_name.contains("circuit_breaker")
            || func_name.contains("max_amount")
            || func_name.contains("threshold")
            || func_name.contains("slippage")
            || func_name.contains("time_limit")
            || func_name.contains("frequency")
            || func_name.contains("cooldown")
    }

    /// Check if a field name indicates pause state
    fn is_pause_state_field(&self, field_name: &str) -> bool {
        matches!(
            field_name,
            "is_paused"
                | "paused"
                | "emergency_mode"
                | "halted"
                | "frozen"
                | "stopped"
                | "emergency_stop"
                | "kill_switch"
                | "pause_authority"
        ) || field_name.contains("pause")
            || field_name.contains("emergency")
            || field_name.contains("halt")
            || field_name.contains("freeze")
            || field_name.contains("stop")
    }

    /// Check if a string literal indicates network dependencies
    fn is_network_dependency(&self, literal: &str) -> bool {
        matches!(
            literal,
            "mainnet"
                | "devnet"
                | "testnet"
                | "localhost"
                | "127.0.0.1"
                | "api.mainnet-beta.solana.com"
                | "api.devnet.solana.com"
                | "api.testnet.solana.com"
        ) || literal.contains("mainnet")
            || literal.contains("devnet")
            || literal.contains("testnet")
            || literal.contains("localhost")
            || literal.contains("127.0.0.1")
            || literal.contains("solana.com")
    }

    /// Check if an attribute indicates pause authority
    fn is_pause_authority_attribute(&self, attr: &Attribute) -> bool {
        let attr_str = quote::quote!(#attr).to_string();
        attr_str.contains("pause") && attr_str.contains("authority")
    }

    /// Check if an attribute indicates emergency controls
    fn is_emergency_attribute(&self, attr: &Attribute) -> bool {
        let attr_str = quote::quote!(#attr).to_string();
        attr_str.contains("emergency") || attr_str.contains("admin")
    }

    /// Check if a path indicates upgrade mechanisms
    fn is_upgrade_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "upgrade" | "transfer_authority" | "set_authority" | "change_authority"
            )
        } else {
            false
        }
    }

    /// Check if a path indicates circuit breaker patterns
    fn is_circuit_breaker_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "rate_limit" | "circuit_breaker" | "max_amount" | "threshold" | "slippage"
            )
        } else {
            false
        }
    }
}

impl<'ast> Visit<'ast> for OperationalSecurityVisitor {
    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let Expr::Path(path_expr) = &*node.func {
            // Check for upgrade mechanisms
            if self.is_upgrade_pattern(&path_expr.path) {
                self.program_upgrade_functions += 1;
                self.record_pattern("upgrade_function_call");
            }

            // Check for circuit breaker patterns
            if self.is_circuit_breaker_pattern(&path_expr.path) {
                self.circuit_breaker_patterns += 1;
                self.record_pattern("circuit_breaker_call");
            }
        }

        // Continue visiting call
        syn::visit::visit_expr_call(self, node);
    }

    fn visit_expr_method_call(&mut self, node: &'ast syn::ExprMethodCall) {
        let method_name = node.method.to_string();

        // Check for pause mechanisms
        if matches!(
            method_name.as_str(),
            "pause"
                | "unpause"
                | "emergency_stop"
                | "kill_switch"
                | "halt"
                | "resume"
                | "freeze"
                | "unfreeze"
        ) {
            self.pause_functions += 1;
            self.record_pattern(&format!("pause_method_{}", method_name));
        }

        // Check for emergency admin controls
        if matches!(
            method_name.as_str(),
            "emergency_withdraw"
                | "emergency_drain"
                | "emergency_rescue"
                | "emergency_override"
                | "admin_override"
        ) {
            self.emergency_admin_functions += 1;
            self.record_pattern(&format!("emergency_method_{}", method_name));
        }

        // Check for upgrade mechanisms
        if matches!(
            method_name.as_str(),
            "upgrade"
                | "transfer_authority"
                | "set_authority"
                | "change_authority"
                | "update_authority"
        ) {
            self.program_upgrade_functions += 1;
            self.record_pattern(&format!("upgrade_method_{}", method_name));
        }

        // Check for circuit breaker patterns
        if matches!(
            method_name.as_str(),
            "rate_limit"
                | "circuit_breaker"
                | "max_amount"
                | "threshold"
                | "slippage"
                | "time_limit"
                | "frequency_limit"
        ) {
            self.circuit_breaker_patterns += 1;
            self.record_pattern(&format!("circuit_breaker_method_{}", method_name));
        }

        // Continue visiting method call
        syn::visit::visit_expr_method_call(self, node);
    }

    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let func_name = node.sig.ident.to_string();

        // Check for pause mechanisms
        if self.is_pause_function(&func_name) {
            if func_name.contains("pause") && !func_name.contains("unpause") {
                self.pause_functions += 1;
            } else if func_name.contains("unpause") {
                self.unpause_functions += 1;
            } else if func_name.contains("emergency") {
                self.emergency_stop_functions += 1;
            } else if func_name.contains("kill") {
                self.kill_switch_functions += 1;
            }
            self.record_pattern(&format!("pause_function_{}", func_name));
        }

        // Check for emergency admin controls
        if self.is_emergency_admin_function(&func_name) {
            if func_name.contains("withdraw") || func_name.contains("drain") {
                self.emergency_fund_withdrawal += 1;
            } else if func_name.contains("override") {
                self.emergency_override_functions += 1;
            } else if func_name.contains("config") {
                self.emergency_config_changes += 1;
            } else if func_name.contains("authority") {
                self.emergency_authority_transfers += 1;
            }
            self.emergency_admin_functions += 1;
            self.record_pattern(&format!("emergency_function_{}", func_name));
        }

        // Check for upgrade mechanisms
        if self.is_upgrade_function(&func_name) {
            if func_name.contains("authority") {
                self.authority_transfer_functions += 1;
            } else if func_name.contains("upgrade") {
                self.program_upgrade_functions += 1;
            }
            self.record_pattern(&format!("upgrade_function_{}", func_name));
        }

        // Check for circuit breaker patterns
        if self.is_circuit_breaker_function(&func_name) {
            if func_name.contains("rate") {
                self.rate_limiting_functions += 1;
            } else if func_name.contains("max") {
                self.max_amount_limits += 1;
            } else if func_name.contains("threshold") {
                self.threshold_based_controls += 1;
            } else if func_name.contains("time") {
                self.time_based_restrictions += 1;
            } else if func_name.contains("frequency") {
                self.frequency_limits += 1;
            } else if func_name.contains("slippage") {
                self.slippage_protection += 1;
            }
            self.circuit_breaker_patterns += 1;
            self.record_pattern(&format!("circuit_breaker_function_{}", func_name));
        }

        // Check for operational security patterns
        if func_name.contains("safety")
            || func_name.contains("fail_safe")
            || func_name.contains("emergency")
        {
            self.safety_mechanisms += 1;
            self.record_pattern(&format!("safety_function_{}", func_name));
        }

        // Continue visiting function body
        syn::visit::visit_item_fn(self, node);
    }

    fn visit_item_struct(&mut self, node: &'ast ItemStruct) {
        // Check struct fields for pause state
        for field in &node.fields {
            if let Some(ident) = &field.ident {
                let field_name = ident.to_string();
                if self.is_pause_state_field(&field_name) {
                    if field_name.contains("pause") {
                        self.pause_state_fields += 1;
                    } else if field_name.contains("emergency") {
                        self.emergency_mode_fields += 1;
                    } else if field_name.contains("halt") {
                        self.halt_state_fields += 1;
                    }
                    self.record_pattern(&format!("pause_state_field_{}", field_name));
                }
            }
        }

        // Check struct attributes for pause authority
        for attr in &node.attrs {
            if self.is_pause_authority_attribute(attr) {
                self.pause_authority_patterns += 1;
                self.record_pattern("pause_authority_attribute");
            }
            if self.is_emergency_attribute(attr) {
                self.emergency_pause_authority += 1;
                self.record_pattern("emergency_attribute");
            }
        }

        // Continue visiting struct
        syn::visit::visit_item_struct(self, node);
    }

    fn visit_lit_str(&mut self, node: &'ast LitStr) {
        let value = node.value();

        // Check for network dependencies
        if self.is_network_dependency(&value) {
            if value.contains("mainnet") {
                self.mainnet_specific_code += 1;
            } else if value.contains("devnet") {
                self.devnet_specific_code += 1;
            } else if value.contains("testnet") {
                self.testnet_specific_code += 1;
            }
            self.hardcoded_cluster_addresses += 1;
            self.record_pattern(&format!("network_dependency_{}", value));
        }

        // Continue visiting string literal
        syn::visit::visit_lit_str(self, node);
    }

    fn visit_lit(&mut self, node: &'ast Lit) {
        // Check for network-specific constants
        if let Lit::Str(lit_str) = node {
            let value = lit_str.value();
            if self.is_network_dependency(&value) {
                self.network_specific_constants += 1;
                self.record_pattern(&format!("network_constant_{}", value));
            }
        }

        // Continue visiting literal
        syn::visit::visit_lit(self, node);
    }
}

/// Calculate operational security metrics for workspace
pub fn calculate_workspace_operational_security(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<OperationalSecurityMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 OPERATIONAL SECURITY DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = OperationalSecurityMetrics::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            log::warn!(
                "🔍 OPERATIONAL SECURITY DEBUG: File does not exist: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!(
                "🔍 OPERATIONAL SECURITY DEBUG: Skipping non-Rust file: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        log::info!(
            "🔍 OPERATIONAL SECURITY DEBUG: Analyzing file: {:?}",
            full_path
        );

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = OperationalSecurityVisitor::new();
        visitor.current_file_path = file_path.to_string();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.pause_functions += visitor.pause_functions;
        metrics.unpause_functions += visitor.unpause_functions;
        metrics.emergency_stop_functions += visitor.emergency_stop_functions;
        metrics.kill_switch_functions += visitor.kill_switch_functions;
        metrics.pause_state_fields += visitor.pause_state_fields;
        metrics.emergency_mode_fields += visitor.emergency_mode_fields;
        metrics.halt_state_fields += visitor.halt_state_fields;
        metrics.pause_authority_patterns += visitor.pause_authority_patterns;
        metrics.emergency_admin_functions += visitor.emergency_admin_functions;
        metrics.emergency_override_functions += visitor.emergency_override_functions;
        metrics.emergency_fund_withdrawal += visitor.emergency_fund_withdrawal;
        metrics.admin_parameter_override += visitor.admin_parameter_override;
        metrics.emergency_config_changes += visitor.emergency_config_changes;
        metrics.emergency_authority_transfers += visitor.emergency_authority_transfers;
        metrics.emergency_pause_authority += visitor.emergency_pause_authority;
        metrics.hardcoded_cluster_addresses += visitor.hardcoded_cluster_addresses;
        metrics.network_specific_constants += visitor.network_specific_constants;
        metrics.rpc_endpoint_dependencies += visitor.rpc_endpoint_dependencies;
        metrics.cluster_specific_behavior += visitor.cluster_specific_behavior;
        metrics.mainnet_specific_code += visitor.mainnet_specific_code;
        metrics.devnet_specific_code += visitor.devnet_specific_code;
        metrics.testnet_specific_code += visitor.testnet_specific_code;
        metrics.program_upgrade_functions += visitor.program_upgrade_functions;
        metrics.authority_transfer_functions += visitor.authority_transfer_functions;
        metrics.upgrade_authority_patterns += visitor.upgrade_authority_patterns;
        metrics.program_data_modifications += visitor.program_data_modifications;
        metrics.upgradeable_loader_usage += visitor.upgradeable_loader_usage;
        metrics.emergency_upgrade_functions += visitor.emergency_upgrade_functions;
        metrics.rate_limiting_functions += visitor.rate_limiting_functions;
        metrics.circuit_breaker_patterns += visitor.circuit_breaker_patterns;
        metrics.threshold_based_controls += visitor.threshold_based_controls;
        metrics.max_amount_limits += visitor.max_amount_limits;
        metrics.time_based_restrictions += visitor.time_based_restrictions;
        metrics.frequency_limits += visitor.frequency_limits;
        metrics.slippage_protection += visitor.slippage_protection;
        metrics.operational_security_patterns += visitor.operational_security_patterns;
        metrics.safety_mechanisms += visitor.safety_mechanisms;
        metrics.emergency_procedures += visitor.emergency_procedures;
        metrics.fail_safe_patterns += visitor.fail_safe_patterns;

        // Merge pattern breakdown
        for (pattern, count) in visitor.operational_pattern_counts {
            *metrics
                .operational_pattern_breakdown
                .entry(pattern)
                .or_insert(0) += count;
        }

        files_analyzed += 1;
    }

    // Calculate weighted complexity scores
    metrics.operational_security_score = calculate_operational_security_score(&metrics);
    metrics.pause_mechanism_score = calculate_pause_mechanism_score(&metrics);
    metrics.emergency_control_score = calculate_emergency_control_score(&metrics);
    metrics.network_dependency_score = calculate_network_dependency_score(&metrics);
    metrics.upgrade_mechanism_score = calculate_upgrade_mechanism_score(&metrics);
    metrics.circuit_breaker_score = calculate_circuit_breaker_score(&metrics);

    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    log::info!(
        "🔍 OPERATIONAL SECURITY DEBUG: Analysis complete. Files analyzed: {}, Files skipped: {}",
        files_analyzed,
        files_skipped
    );

    Ok(metrics)
}

/// Calculate operational security score with weighted patterns
fn calculate_operational_security_score(metrics: &OperationalSecurityMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk patterns (6x weight - critical operational security)
    score += metrics.emergency_fund_withdrawal as f64 * 6.0;
    score += metrics.emergency_override_functions as f64 * 6.0;
    score += metrics.emergency_upgrade_functions as f64 * 6.0;
    score += metrics.kill_switch_functions as f64 * 6.0;

    // Medium-high risk patterns (5x weight - significant operational control)
    score += metrics.emergency_admin_functions as f64 * 5.0;
    score += metrics.emergency_authority_transfers as f64 * 5.0;
    score += metrics.emergency_config_changes as f64 * 5.0;
    score += metrics.program_upgrade_functions as f64 * 5.0;
    score += metrics.authority_transfer_functions as f64 * 5.0;

    // Medium risk patterns (4x weight - moderate operational control)
    score += metrics.pause_functions as f64 * 4.0;
    score += metrics.unpause_functions as f64 * 4.0;
    score += metrics.emergency_stop_functions as f64 * 4.0;
    score += metrics.pause_authority_patterns as f64 * 4.0;
    score += metrics.circuit_breaker_patterns as f64 * 4.0;
    score += metrics.threshold_based_controls as f64 * 4.0;

    // Lower risk patterns (3x weight - potential operational control)
    score += metrics.pause_state_fields as f64 * 3.0;
    score += metrics.emergency_mode_fields as f64 * 3.0;
    score += metrics.halt_state_fields as f64 * 3.0;
    score += metrics.rate_limiting_functions as f64 * 3.0;
    score += metrics.max_amount_limits as f64 * 3.0;
    score += metrics.time_based_restrictions as f64 * 3.0;

    // Low risk patterns (2x weight - minimal operational control)
    score += metrics.frequency_limits as f64 * 2.0;
    score += metrics.slippage_protection as f64 * 2.0;
    score += metrics.safety_mechanisms as f64 * 2.0;
    score += metrics.emergency_procedures as f64 * 2.0;
    score += metrics.fail_safe_patterns as f64 * 2.0;

    // Network dependency patterns (1x weight - informational)
    score += metrics.hardcoded_cluster_addresses as f64 * 1.0;
    score += metrics.network_specific_constants as f64 * 1.0;
    score += metrics.mainnet_specific_code as f64 * 1.0;
    score += metrics.devnet_specific_code as f64 * 1.0;
    score += metrics.testnet_specific_code as f64 * 1.0;

    score
}

/// Calculate pause mechanism score
fn calculate_pause_mechanism_score(metrics: &OperationalSecurityMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk pause patterns
    score += metrics.kill_switch_functions as f64 * 6.0;
    score += metrics.emergency_stop_functions as f64 * 5.0;
    score += metrics.pause_functions as f64 * 4.0;
    score += metrics.unpause_functions as f64 * 4.0;
    score += metrics.pause_authority_patterns as f64 * 4.0;

    // Medium-risk pause patterns
    score += metrics.pause_state_fields as f64 * 3.0;
    score += metrics.emergency_mode_fields as f64 * 3.0;
    score += metrics.halt_state_fields as f64 * 3.0;

    score
}

/// Calculate emergency control score
fn calculate_emergency_control_score(metrics: &OperationalSecurityMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk emergency patterns
    score += metrics.emergency_fund_withdrawal as f64 * 6.0;
    score += metrics.emergency_override_functions as f64 * 6.0;
    score += metrics.emergency_authority_transfers as f64 * 5.0;
    score += metrics.emergency_config_changes as f64 * 5.0;

    // Medium-risk emergency patterns
    score += metrics.emergency_admin_functions as f64 * 4.0;
    score += metrics.emergency_pause_authority as f64 * 3.0;

    score
}

/// Calculate network dependency score
fn calculate_network_dependency_score(metrics: &OperationalSecurityMetrics) -> f64 {
    let mut score = 0.0;

    // Network dependency patterns
    score += metrics.hardcoded_cluster_addresses as f64 * 3.0;
    score += metrics.network_specific_constants as f64 * 2.0;
    score += metrics.rpc_endpoint_dependencies as f64 * 2.0;
    score += metrics.cluster_specific_behavior as f64 * 2.0;
    score += metrics.mainnet_specific_code as f64 * 1.0;
    score += metrics.devnet_specific_code as f64 * 1.0;
    score += metrics.testnet_specific_code as f64 * 1.0;

    score
}

/// Calculate upgrade mechanism score
fn calculate_upgrade_mechanism_score(metrics: &OperationalSecurityMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk upgrade patterns
    score += metrics.emergency_upgrade_functions as f64 * 6.0;
    score += metrics.program_upgrade_functions as f64 * 5.0;
    score += metrics.authority_transfer_functions as f64 * 5.0;

    // Medium-risk upgrade patterns
    score += metrics.upgrade_authority_patterns as f64 * 4.0;
    score += metrics.program_data_modifications as f64 * 3.0;
    score += metrics.upgradeable_loader_usage as f64 * 3.0;

    score
}

/// Calculate circuit breaker score
fn calculate_circuit_breaker_score(metrics: &OperationalSecurityMetrics) -> f64 {
    let mut score = 0.0;

    // Circuit breaker patterns
    score += metrics.circuit_breaker_patterns as f64 * 4.0;
    score += metrics.threshold_based_controls as f64 * 4.0;
    score += metrics.rate_limiting_functions as f64 * 3.0;
    score += metrics.max_amount_limits as f64 * 3.0;
    score += metrics.time_based_restrictions as f64 * 3.0;
    score += metrics.frequency_limits as f64 * 2.0;
    score += metrics.slippage_protection as f64 * 2.0;

    score
}
