use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::BinOp;
use syn::{visit::Visit, Expr, ExprBinary, ExprCall, ExprMethodCall, ItemFn, Path};

/// Metrics for privileged roles and admin actions in Anchor handlers
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct PrivilegedRolesMetrics {
    // Handler statistics
    pub total_privileged_handlers: u32,
    pub total_admin_actions: u32,

    // Context classification
    pub handler_admin_actions: u32,
    pub utility_admin_actions: u32,
    pub state_admin_actions: u32,
    pub test_admin_actions: u32,

    // Admin action breakdown
    pub admin_action_breakdown: HashMap<String, u32>,

    // Authority patterns
    pub owner_authority_handlers: u32,
    pub admin_authority_handlers: u32,
    pub multi_sig_handlers: u32,
    pub time_locked_handlers: u32,
    pub emergency_handlers: u32,

    // State mutation patterns
    pub state_mutation_handlers: u32,
    pub config_update_handlers: u32,
    pub fee_update_handlers: u32,
    pub parameter_update_handlers: u32,
    pub upgrade_control_handlers: u32,
    pub pause_unpause_handlers: u32,

    // Impact assessment
    pub high_impact_actions: u32,
    pub medium_impact_actions: u32,
    pub low_impact_actions: u32,

    // Complexity metrics
    pub privileged_complexity_score: f64,
    pub multi_authority_handlers: u32,
    pub complex_admin_handlers: u32,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl PrivilegedRolesMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalPrivilegedHandlers": self.total_privileged_handlers,
            "totalAdminActions": self.total_admin_actions,
            "handlerAdminActions": self.handler_admin_actions,
            "utilityAdminActions": self.utility_admin_actions,
            "stateAdminActions": self.state_admin_actions,
            "testAdminActions": self.test_admin_actions,
            "adminActionBreakdown": self.admin_action_breakdown,
            "ownerAuthorityHandlers": self.owner_authority_handlers,
            "adminAuthorityHandlers": self.admin_authority_handlers,
            "multiSigHandlers": self.multi_sig_handlers,
            "timeLockedHandlers": self.time_locked_handlers,
            "emergencyHandlers": self.emergency_handlers,
            "stateMutationHandlers": self.state_mutation_handlers,
            "configUpdateHandlers": self.config_update_handlers,
            "feeUpdateHandlers": self.fee_update_handlers,
            "parameterUpdateHandlers": self.parameter_update_handlers,
            "upgradeControlHandlers": self.upgrade_control_handlers,
            "pauseUnpauseHandlers": self.pause_unpause_handlers,
            "highImpactActions": self.high_impact_actions,
            "mediumImpactActions": self.medium_impact_actions,
            "lowImpactActions": self.low_impact_actions,
            "privilegedComplexityScore": self.privileged_complexity_score,
            "multiAuthorityHandlers": self.multi_authority_handlers,
            "complexAdminHandlers": self.complex_admin_handlers,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped
        })
    }
}

/// Information about a handler with privileged operations
#[derive(Debug)]
struct PrivilegedHandlerInfo {
    name: String,
    admin_actions: Vec<String>,
    authority_patterns: Vec<String>,
    state_mutations: Vec<String>,
    impact_level: String,
    has_multiple_authorities: bool,
}

/// Visitor for detecting privileged roles and admin actions in Anchor handlers
#[derive(Debug)]
struct PrivilegedRolesVisitor {
    handlers: Vec<PrivilegedHandlerInfo>,
    current_file_path: String,
    current_handler: Option<String>,
    admin_action_counts: HashMap<String, u32>,
    total_admin_actions: u32,

    // Context classification counters
    handler_admin_actions: u32,
    utility_admin_actions: u32,
    state_admin_actions: u32,
    test_admin_actions: u32,

    owner_authority_handlers: u32,
    admin_authority_handlers: u32,
    multi_sig_handlers: u32,
    time_locked_handlers: u32,
    emergency_handlers: u32,
    state_mutation_handlers: u32,
    config_update_handlers: u32,
    fee_update_handlers: u32,
    parameter_update_handlers: u32,
    upgrade_control_handlers: u32,
    pause_unpause_handlers: u32,
    high_impact_actions: u32,
    medium_impact_actions: u32,
    low_impact_actions: u32,
    multi_authority_handlers: u32,
    complex_admin_handlers: u32,
}

impl PrivilegedRolesVisitor {
    fn new() -> Self {
        Self {
            handlers: Vec::new(),
            current_file_path: String::new(),
            current_handler: None,
            admin_action_counts: HashMap::new(),
            total_admin_actions: 0,
            handler_admin_actions: 0,
            utility_admin_actions: 0,
            state_admin_actions: 0,
            test_admin_actions: 0,
            owner_authority_handlers: 0,
            admin_authority_handlers: 0,
            multi_sig_handlers: 0,
            time_locked_handlers: 0,
            emergency_handlers: 0,
            state_mutation_handlers: 0,
            config_update_handlers: 0,
            fee_update_handlers: 0,
            parameter_update_handlers: 0,
            upgrade_control_handlers: 0,
            pause_unpause_handlers: 0,
            high_impact_actions: 0,
            medium_impact_actions: 0,
            low_impact_actions: 0,
            multi_authority_handlers: 0,
            complex_admin_handlers: 0,
        }
    }

    /// Check if a function name suggests admin actions
    fn is_admin_action(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("set_")
            || name_lower.contains("update_")
            || name_lower.contains("change_")
            || name_lower.contains("configure_")
            || name_lower.contains("admin_")
            || name_lower.contains("owner_")
            || name_lower.contains("upgrade")
            || name_lower.contains("pause")
            || name_lower.contains("unpause")
            || name_lower.contains("emergency")
            || name_lower.contains("freeze")
            || name_lower.contains("unfreeze")
            || name_lower.contains("migrate")
            || name_lower.contains("initialize")
            || name_lower.contains("close")
    }

    /// Check if a function name suggests state mutations
    fn is_state_mutation(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("set_")
            || name_lower.contains("update_")
            || name_lower.contains("change_")
            || name_lower.contains("modify_")
            || name_lower.contains("mutate_")
            || name_lower.contains("write_")
            || name_lower.contains("store_")
            || name_lower.contains("save_")
    }

    /// Check if a function name suggests configuration updates
    fn is_config_update(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("config")
            || name_lower.contains("setting")
            || name_lower.contains("parameter")
            || name_lower.contains("option")
            || name_lower.contains("preference")
    }

    /// Check if a function name suggests fee updates
    fn is_fee_update(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("fee")
            || name_lower.contains("commission")
            || name_lower.contains("rate")
            || name_lower.contains("cost")
            || name_lower.contains("charge")
    }

    /// Check if a function name suggests parameter updates
    fn is_parameter_update(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("parameter")
            || name_lower.contains("threshold")
            || name_lower.contains("limit")
            || name_lower.contains("bound")
            || name_lower.contains("constraint")
    }

    /// Check if a function name suggests upgrade control
    fn is_upgrade_control(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("upgrade")
            || name_lower.contains("migrate")
            || name_lower.contains("deploy")
            || name_lower.contains("version")
    }

    /// Check if a function name suggests pause/unpause operations
    fn is_pause_unpause(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("pause")
            || name_lower.contains("unpause")
            || name_lower.contains("freeze")
            || name_lower.contains("unfreeze")
            || name_lower.contains("halt")
            || name_lower.contains("resume")
    }

    /// Check if a function name suggests emergency actions
    fn is_emergency_action(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("emergency")
            || name_lower.contains("panic")
            || name_lower.contains("kill")
            || name_lower.contains("shutdown")
            || name_lower.contains("rescue")
    }

    /// Check if a function name suggests owner authority
    fn is_owner_authority(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("owner")
            || name_lower.contains("master")
            || name_lower.contains("super")
            || name_lower.contains("root")
    }

    /// Check if a function name suggests admin authority
    fn is_admin_authority(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("admin")
            || name_lower.contains("manager")
            || name_lower.contains("operator")
            || name_lower.contains("controller")
    }

    /// Check if a function name suggests multi-sig operations
    fn is_multi_sig(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("multisig")
            || name_lower.contains("multi_sig")
            || name_lower.contains("consensus")
            || name_lower.contains("approval")
    }

    /// Check if a function name suggests time-locked operations
    fn is_time_locked(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("timelock")
            || name_lower.contains("time_lock")
            || name_lower.contains("delay")
            || name_lower.contains("schedule")
    }

    /// Get impact level for an admin action
    fn get_impact_level(&self, name: &str) -> &'static str {
        let name_lower = name.to_lowercase();
        if name_lower.contains("upgrade")
            || name_lower.contains("pause")
            || name_lower.contains("emergency")
            || name_lower.contains("freeze")
            || name_lower.contains("kill")
        {
            "high"
        } else if name_lower.contains("set_")
            || name_lower.contains("update_")
            || name_lower.contains("change_")
            || name_lower.contains("configure_")
        {
            "medium"
        } else {
            "low"
        }
    }

    /// Classify admin action by file context
    fn classify_admin_action_context(&self) -> &'static str {
        if self.current_file_path.contains("instructions/") {
            "handler"
        } else if self.current_file_path.contains("utils/") {
            "utility"
        } else if self.current_file_path.contains("state/")
            || self.current_file_path.ends_with("state.rs")
        {
            "state"
        } else if self.current_file_path.contains("tests/") {
            "test"
        } else {
            "other"
        }
    }

    /// Record an admin action with context classification
    fn record_admin_action(&mut self, action_type: &str, impact_level: &str) {
        self.total_admin_actions += 1;
        *self
            .admin_action_counts
            .entry(action_type.to_string())
            .or_insert(0) += 1;

        // Classify by context
        match self.classify_admin_action_context() {
            "handler" => self.handler_admin_actions += 1,
            "utility" => self.utility_admin_actions += 1,
            "state" => self.state_admin_actions += 1,
            "test" => self.test_admin_actions += 1,
            _ => self.utility_admin_actions += 1, // Default to utility for other contexts
        }

        match impact_level {
            "high" => self.high_impact_actions += 1,
            "medium" => self.medium_impact_actions += 1,
            "low" => self.low_impact_actions += 1,
            _ => self.low_impact_actions += 1,
        }
    }

    /// Helper method to check if parameter is Context<...>
    fn has_context_parameter(&self, input: &syn::FnArg) -> bool {
        if let syn::FnArg::Typed(pat_type) = input {
            if let syn::Type::Path(type_path) = &*pat_type.ty {
                if let Some(segment) = type_path.path.segments.last() {
                    let type_name = segment.ident.to_string();
                    return type_name.starts_with("Context");
                }
            }
        }
        false
    }
}

impl<'ast> Visit<'ast> for PrivilegedRolesVisitor {
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        // Check if this is an Anchor instruction handler
        let is_instruction = node
            .attrs
            .iter()
            .any(|attr| attr.path().is_ident("instruction"));

        let is_anchor_handler = if is_instruction {
            true
        } else {
            // TEMPORARILY RELAXED FOR TESTING - analyze all public functions with admin patterns
            matches!(node.vis, syn::Visibility::Public(_))
                && (node.sig.ident.to_string().starts_with("handle_")
                    || node.sig.ident.to_string().starts_with("ix_")
                    || node.sig.ident.to_string().contains("admin")
                    || node.sig.ident.to_string().contains("owner")
                    || node.sig.ident.to_string().contains("set_")
                    || node.sig.ident.to_string().contains("update_")
                    || node.sig.ident.to_string().contains("change_")
                    || node.sig.ident.to_string().contains("configure_"))
        };

        if is_anchor_handler {
            let handler_name = node.sig.ident.to_string();
            log::info!(
                "🔍 PRIVILEGED ROLES DEBUG: Found Anchor instruction handler: {}",
                handler_name
            );

            self.current_handler = Some(handler_name.clone());
            let handler_start_actions = self.total_admin_actions;
            let mut admin_actions = Vec::new();
            let mut authority_patterns = Vec::new();
            let mut state_mutations = Vec::new();
            let mut has_multiple_authorities = false;

            // Analyze function name for admin patterns
            if self.is_admin_action(&handler_name) {
                admin_actions.push("admin_action".to_string());
                self.record_admin_action("admin_action", self.get_impact_level(&handler_name));
            }

            if self.is_state_mutation(&handler_name) {
                state_mutations.push("state_mutation".to_string());
                self.state_mutation_handlers += 1;
            }

            if self.is_config_update(&handler_name) {
                admin_actions.push("config_update".to_string());
                self.config_update_handlers += 1;
                self.record_admin_action("config_update", "medium");
            }

            if self.is_fee_update(&handler_name) {
                admin_actions.push("fee_update".to_string());
                self.fee_update_handlers += 1;
                self.record_admin_action("fee_update", "high");
            }

            if self.is_parameter_update(&handler_name) {
                admin_actions.push("parameter_update".to_string());
                self.parameter_update_handlers += 1;
                self.record_admin_action("parameter_update", "medium");
            }

            if self.is_upgrade_control(&handler_name) {
                admin_actions.push("upgrade_control".to_string());
                self.upgrade_control_handlers += 1;
                self.record_admin_action("upgrade_control", "high");
            }

            if self.is_pause_unpause(&handler_name) {
                admin_actions.push("pause_unpause".to_string());
                self.pause_unpause_handlers += 1;
                self.record_admin_action("pause_unpause", "high");
            }

            if self.is_emergency_action(&handler_name) {
                admin_actions.push("emergency_action".to_string());
                self.emergency_handlers += 1;
                self.record_admin_action("emergency_action", "high");
            }

            // Check authority patterns
            if self.is_owner_authority(&handler_name) {
                authority_patterns.push("owner_authority".to_string());
                self.owner_authority_handlers += 1;
            }

            if self.is_admin_authority(&handler_name) {
                authority_patterns.push("admin_authority".to_string());
                self.admin_authority_handlers += 1;
            }

            if self.is_multi_sig(&handler_name) {
                authority_patterns.push("multi_sig".to_string());
                self.multi_sig_handlers += 1;
            }

            if self.is_time_locked(&handler_name) {
                authority_patterns.push("time_locked".to_string());
                self.time_locked_handlers += 1;
            }

            // Check for multiple authorities
            if authority_patterns.len() > 1 {
                has_multiple_authorities = true;
                self.multi_authority_handlers += 1;
            }

            // Check for complex admin handlers
            if admin_actions.len() > 2 {
                self.complex_admin_handlers += 1;
            }

            // Visit the function body for additional analysis
            syn::visit::visit_item_fn(self, node);

            // Record handler statistics
            let action_count = self.total_admin_actions - handler_start_actions;
            if action_count > 0 || !admin_actions.is_empty() {
                let impact_level = self.get_impact_level(&handler_name).to_string();
                self.handlers.push(PrivilegedHandlerInfo {
                    name: handler_name,
                    admin_actions,
                    authority_patterns,
                    state_mutations,
                    impact_level,
                    has_multiple_authorities,
                });
            }

            self.current_handler = None;
        } else {
            // Continue visiting for non-handler functions
            syn::visit::visit_item_fn(self, node);
        }
    }

    fn visit_expr_method_call(&mut self, node: &'ast ExprMethodCall) {
        let method_name = node.method.to_string();

        // Check for admin-related method calls
        if method_name.contains("set_")
            || method_name.contains("update_")
            || method_name.contains("change_")
        {
            self.record_admin_action(&format!("method_{}", method_name), "medium");
        }

        // Continue visiting
        syn::visit::visit_expr_method_call(self, node);
    }

    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let Expr::Path(path_expr) = &*node.func {
            if let Some(segment) = path_expr.path.segments.last() {
                let func_name = segment.ident.to_string();

                // Check for admin-related function calls
                if func_name.contains("set_")
                    || func_name.contains("update_")
                    || func_name.contains("change_")
                {
                    self.record_admin_action(&format!("func_{}", func_name), "medium");
                }
            }
        }

        // Continue visiting
        syn::visit::visit_expr_call(self, node);
    }
}

/// Calculate privileged roles and admin action metrics for workspace
pub fn calculate_workspace_privileged_roles(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<PrivilegedRolesMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 PRIVILEGED ROLES DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = PrivilegedRolesMetrics::default();
    let mut visitor = PrivilegedRolesVisitor::new();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    // Analyze each selected file
    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);
        if !full_path.exists() {
            log::warn!(
                "🔍 PRIVILEGED ROLES DEBUG: File does not exist: {:?}",
                full_path
            );
            continue;
        }

        // TEMPORARILY REMOVED FILE FILTERING FOR TESTING
        // For Privileged Roles factor, analyze ALL files to see the difference
        let file_path_str = file_path.to_string();
        // let is_relevant_for_privileged_roles = file_path_str.contains("instructions/")
        //     || file_path_str.contains("ix_")
        //     || file_path_str.ends_with("lib.rs")
        //     || file_path_str.ends_with("state.rs")
        //     || file_path_str.ends_with("error.rs");

        // if !is_relevant_for_privileged_roles {
        //     log::info!(
        //         "🔍 PRIVILEGED ROLES DEBUG: Skipping non-instruction file for privileged roles analysis: {:?}",
        //         full_path
        //     );
        //     files_skipped += 1;
        //     continue;
        // }

        log::info!("🔍 PRIVILEGED ROLES DEBUG: Analyzing file: {:?}", full_path);

        match std::fs::read_to_string(&full_path) {
            Ok(content) => {
                log::info!(
                    "🔍 PRIVILEGED ROLES DEBUG: Successfully read file, content length: {}",
                    content.len()
                );

                // Set the current file path for the visitor
                visitor.current_file_path = file_path.to_string();
                files_analyzed += 1;

                match syn::parse_file(&content) {
                    Ok(ast) => {
                        log::info!("🔍 PRIVILEGED ROLES DEBUG: Successfully parsed AST");
                        visitor.visit_file(&ast);
                    }
                    Err(e) => {
                        log::warn!(
                            "🔍 PRIVILEGED ROLES DEBUG: Failed to parse AST for {:?}: {}",
                            full_path,
                            e
                        );
                    }
                }
            }
            Err(e) => {
                log::warn!(
                    "🔍 PRIVILEGED ROLES DEBUG: Failed to read file {:?}: {}",
                    full_path,
                    e
                );
            }
        }
    }

    // Add file analysis metadata
    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    // Calculate final metrics
    metrics.total_privileged_handlers = visitor.handlers.len() as u32;
    metrics.total_admin_actions = visitor.total_admin_actions;
    metrics.handler_admin_actions = visitor.handler_admin_actions;
    metrics.utility_admin_actions = visitor.utility_admin_actions;
    metrics.state_admin_actions = visitor.state_admin_actions;
    metrics.test_admin_actions = visitor.test_admin_actions;
    metrics.admin_action_breakdown = visitor.admin_action_counts;
    metrics.owner_authority_handlers = visitor.owner_authority_handlers;
    metrics.admin_authority_handlers = visitor.admin_authority_handlers;
    metrics.multi_sig_handlers = visitor.multi_sig_handlers;
    metrics.time_locked_handlers = visitor.time_locked_handlers;
    metrics.emergency_handlers = visitor.emergency_handlers;
    metrics.state_mutation_handlers = visitor.state_mutation_handlers;
    metrics.config_update_handlers = visitor.config_update_handlers;
    metrics.fee_update_handlers = visitor.fee_update_handlers;
    metrics.parameter_update_handlers = visitor.parameter_update_handlers;
    metrics.upgrade_control_handlers = visitor.upgrade_control_handlers;
    metrics.pause_unpause_handlers = visitor.pause_unpause_handlers;
    metrics.high_impact_actions = visitor.high_impact_actions;
    metrics.medium_impact_actions = visitor.medium_impact_actions;
    metrics.low_impact_actions = visitor.low_impact_actions;
    metrics.multi_authority_handlers = visitor.multi_authority_handlers;
    metrics.complex_admin_handlers = visitor.complex_admin_handlers;

    // Calculate complexity score (weighted by impact)
    let high_impact_weight = 3.0;
    let medium_impact_weight = 2.0;
    let low_impact_weight = 1.0;

    metrics.privileged_complexity_score = (visitor.high_impact_actions as f64 * high_impact_weight)
        + (visitor.medium_impact_actions as f64 * medium_impact_weight)
        + (visitor.low_impact_actions as f64 * low_impact_weight);

    log::info!(
        "🔍 PRIVILEGED ROLES DEBUG: Analysis complete. Found {} handlers with {} total admin actions",
        metrics.total_privileged_handlers,
        metrics.total_admin_actions
    );

    Ok(metrics)
}
