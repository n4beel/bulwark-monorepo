use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{visit::Visit, Attribute, Expr, ItemFn, ItemStruct, Path};

/// Metrics for statefulness and sequence of operations patterns
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct StatefulnessMetrics {
    // State modification patterns
    pub mutable_account_patterns: u32,
    pub state_field_updates: u32,
    pub state_method_calls: u32,
    pub state_initialization_patterns: u32,
    pub state_validation_patterns: u32,

    // Sequence dependency patterns
    pub sequence_dependency_patterns: u32,
    pub multi_step_workflow_patterns: u32,
    pub state_check_patterns: u32,
    pub flag_based_sequences: u32,
    pub counter_based_sequences: u32,
    pub timestamp_based_sequences: u32,

    // Multi-step operation patterns
    pub deposit_redeem_patterns: u32,
    pub order_matching_patterns: u32,
    pub approval_flow_patterns: u32,
    pub escrow_patterns: u32,
    pub vesting_patterns: u32,
    pub staking_patterns: u32,

    // Race condition and partial completion patterns
    pub race_condition_risks: u32,
    pub partial_completion_risks: u32,
    pub concurrent_access_patterns: u32,
    pub state_locking_patterns: u32,
    pub atomic_operation_patterns: u32,

    // State machine patterns
    pub state_machine_patterns: u32,
    pub status_transition_patterns: u32,
    pub state_reset_patterns: u32,
    pub state_pause_patterns: u32,

    // Workflow complexity patterns
    pub complex_workflow_patterns: u32,
    pub conditional_state_patterns: u32,
    pub nested_state_patterns: u32,
    pub recursive_state_patterns: u32,
    pub state_dependency_chains: u32,

    // Detailed pattern breakdown
    pub statefulness_pattern_breakdown: HashMap<String, u32>,

    // Scoring
    pub statefulness_complexity_score: f64,
    pub sequence_risk_score: f64,
    pub race_condition_risk_score: f64,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl StatefulnessMetrics {
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::to_value(self).unwrap_or(serde_json::Value::Null)
    }
}

/// Visitor for analyzing statefulness patterns
struct StatefulnessVisitor {
    current_file_path: String,

    // State modification counters
    mutable_account_patterns: u32,
    state_field_updates: u32,
    state_method_calls: u32,
    state_initialization_patterns: u32,
    state_validation_patterns: u32,

    // Sequence dependency counters
    sequence_dependency_patterns: u32,
    multi_step_workflow_patterns: u32,
    state_check_patterns: u32,
    flag_based_sequences: u32,
    counter_based_sequences: u32,
    timestamp_based_sequences: u32,

    // Multi-step operation counters
    deposit_redeem_patterns: u32,
    order_matching_patterns: u32,
    approval_flow_patterns: u32,
    escrow_patterns: u32,
    vesting_patterns: u32,
    staking_patterns: u32,

    // Race condition counters
    race_condition_risks: u32,
    partial_completion_risks: u32,
    concurrent_access_patterns: u32,
    state_locking_patterns: u32,
    atomic_operation_patterns: u32,

    // State machine counters
    state_machine_patterns: u32,
    status_transition_patterns: u32,
    state_reset_patterns: u32,
    state_pause_patterns: u32,

    // Workflow complexity counters
    complex_workflow_patterns: u32,
    conditional_state_patterns: u32,
    nested_state_patterns: u32,
    recursive_state_patterns: u32,
    state_dependency_chains: u32,

    // Pattern tracking
    statefulness_pattern_counts: HashMap<String, u32>,
}

impl StatefulnessVisitor {
    fn new() -> Self {
        Self {
            current_file_path: String::new(),
            mutable_account_patterns: 0,
            state_field_updates: 0,
            state_method_calls: 0,
            state_initialization_patterns: 0,
            state_validation_patterns: 0,
            sequence_dependency_patterns: 0,
            multi_step_workflow_patterns: 0,
            state_check_patterns: 0,
            flag_based_sequences: 0,
            counter_based_sequences: 0,
            timestamp_based_sequences: 0,
            deposit_redeem_patterns: 0,
            order_matching_patterns: 0,
            approval_flow_patterns: 0,
            escrow_patterns: 0,
            vesting_patterns: 0,
            staking_patterns: 0,
            race_condition_risks: 0,
            partial_completion_risks: 0,
            concurrent_access_patterns: 0,
            state_locking_patterns: 0,
            atomic_operation_patterns: 0,
            state_machine_patterns: 0,
            status_transition_patterns: 0,
            state_reset_patterns: 0,
            state_pause_patterns: 0,
            complex_workflow_patterns: 0,
            conditional_state_patterns: 0,
            nested_state_patterns: 0,
            recursive_state_patterns: 0,
            state_dependency_chains: 0,
            statefulness_pattern_counts: HashMap::new(),
        }
    }

    /// Record a statefulness pattern
    fn record_pattern(&mut self, pattern: &str) {
        *self
            .statefulness_pattern_counts
            .entry(pattern.to_string())
            .or_insert(0) += 1;
    }

    /// Check if a function name indicates state modification patterns
    fn is_state_modification_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "update"
                | "modify"
                | "set"
                | "change"
                | "initialize"
                | "create"
                | "mint"
                | "burn"
                | "transfer"
                | "deposit"
                | "withdraw"
                | "stake"
                | "unstake"
                | "lock"
                | "unlock"
        ) || func_name.contains("update")
            || func_name.contains("modify")
            || func_name.contains("set")
            || func_name.contains("change")
            || func_name.contains("initialize")
    }

    /// Check if a function name indicates sequence dependency patterns
    fn is_sequence_dependency_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "step"
                | "next"
                | "continue"
                | "complete"
                | "finish"
                | "finalize"
                | "commit"
                | "confirm"
                | "approve"
                | "validate"
                | "check"
                | "verify"
        ) || func_name.contains("step")
            || func_name.contains("next")
            || func_name.contains("continue")
            || func_name.contains("complete")
            || func_name.contains("finalize")
            || func_name.contains("approve")
            || func_name.contains("validate")
    }

    /// Check if a function name indicates multi-step workflow patterns
    fn is_workflow_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "deposit"
                | "redeem"
                | "order"
                | "match"
                | "swap"
                | "trade"
                | "execute"
                | "process"
                | "handle"
                | "manage"
        ) || func_name.contains("deposit")
            || func_name.contains("redeem")
            || func_name.contains("order")
            || func_name.contains("match")
            || func_name.contains("swap")
            || func_name.contains("execute")
            || func_name.contains("process")
    }

    /// Check if a function name indicates state machine patterns
    fn is_state_machine_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "transition"
                | "status"
                | "state"
                | "phase"
                | "stage"
                | "mode"
                | "active"
                | "inactive"
                | "pending"
                | "completed"
                | "failed"
        ) || func_name.contains("transition")
            || func_name.contains("status")
            || func_name.contains("state")
            || func_name.contains("phase")
            || func_name.contains("stage")
            || func_name.contains("mode")
    }

    /// Check if a function name indicates race condition patterns
    fn is_race_condition_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "lock"
                | "unlock"
                | "mutex"
                | "semaphore"
                | "atomic"
                | "concurrent"
                | "parallel"
                | "sync"
                | "async"
        ) || func_name.contains("lock")
            || func_name.contains("unlock")
            || func_name.contains("atomic")
            || func_name.contains("concurrent")
            || func_name.contains("sync")
    }

    /// Check if an attribute indicates mutable account pattern
    fn is_mutable_account_attribute(&self, attr: &Attribute) -> bool {
        let attr_str = quote::quote!(#attr).to_string();
        attr_str.contains("mut") || attr_str.contains("mutable")
    }

    /// Check if an attribute indicates state initialization pattern
    fn is_state_initialization_attribute(&self, attr: &Attribute) -> bool {
        let attr_str = quote::quote!(#attr).to_string();
        attr_str.contains("init") || attr_str.contains("initialize")
    }

    /// Check if an attribute indicates state validation pattern
    fn is_state_validation_attribute(&self, attr: &Attribute) -> bool {
        let attr_str = quote::quote!(#attr).to_string();
        attr_str.contains("constraint")
            || attr_str.contains("has_one")
            || attr_str.contains("owner")
    }

    /// Check if a path represents state modification patterns
    fn is_state_modification_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "update"
                    | "modify"
                    | "set"
                    | "change"
                    | "initialize"
                    | "create"
                    | "mint"
                    | "burn"
                    | "transfer"
            )
        } else {
            false
        }
    }

    /// Check if a path represents sequence dependency patterns
    fn is_sequence_dependency_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "step"
                    | "next"
                    | "continue"
                    | "complete"
                    | "finalize"
                    | "commit"
                    | "confirm"
                    | "approve"
                    | "validate"
            )
        } else {
            false
        }
    }

    /// Check if a path represents state machine patterns
    fn is_state_machine_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "transition"
                    | "status"
                    | "state"
                    | "phase"
                    | "stage"
                    | "mode"
                    | "active"
                    | "inactive"
                    | "pending"
            )
        } else {
            false
        }
    }
}

impl<'ast> Visit<'ast> for StatefulnessVisitor {
    fn visit_expr(&mut self, node: &'ast Expr) {
        match node {
            Expr::Call(call_expr) => {
                if let Expr::Path(path_expr) = &*call_expr.func {
                    // Check for state modification patterns
                    if self.is_state_modification_pattern(&path_expr.path) {
                        self.state_field_updates += 1;
                        self.state_method_calls += 1;
                        self.record_pattern("state_modification_call");
                    }

                    // Check for sequence dependency patterns
                    if self.is_sequence_dependency_pattern(&path_expr.path) {
                        self.sequence_dependency_patterns += 1;
                        self.state_check_patterns += 1;
                        self.record_pattern("sequence_dependency_call");
                    }

                    // Check for state machine patterns
                    if self.is_state_machine_pattern(&path_expr.path) {
                        self.state_machine_patterns += 1;
                        self.status_transition_patterns += 1;
                        self.record_pattern("state_machine_call");
                    }
                }
            }
            _ => {}
        }

        // Continue visiting expression
        syn::visit::visit_expr(self, node);
    }

    fn visit_expr_method_call(&mut self, node: &'ast syn::ExprMethodCall) {
        let method_name = node.method.to_string();

        // Check for state modification method calls
        if matches!(
            method_name.as_str(),
            "update"
                | "modify"
                | "set"
                | "change"
                | "initialize"
                | "create"
                | "mint"
                | "burn"
                | "transfer"
        ) {
            self.state_field_updates += 1;
            self.state_method_calls += 1;
            self.record_pattern(&format!("state_method_{}", method_name));
        }

        // Check for sequence dependency method calls
        if matches!(
            method_name.as_str(),
            "step"
                | "next"
                | "continue"
                | "complete"
                | "finalize"
                | "commit"
                | "confirm"
                | "approve"
                | "validate"
        ) {
            self.sequence_dependency_patterns += 1;
            self.state_check_patterns += 1;
            self.record_pattern(&format!("sequence_method_{}", method_name));
        }

        // Check for state machine method calls
        if matches!(
            method_name.as_str(),
            "transition"
                | "status"
                | "state"
                | "phase"
                | "stage"
                | "mode"
                | "active"
                | "inactive"
                | "pending"
        ) {
            self.state_machine_patterns += 1;
            self.status_transition_patterns += 1;
            self.record_pattern(&format!("state_machine_method_{}", method_name));
        }

        // Check for race condition method calls
        if matches!(
            method_name.as_str(),
            "lock" | "unlock" | "atomic" | "concurrent" | "sync" | "async"
        ) {
            self.race_condition_risks += 1;
            self.state_locking_patterns += 1;
            self.record_pattern(&format!("race_condition_method_{}", method_name));
        }

        // Continue visiting method call
        syn::visit::visit_expr_method_call(self, node);
    }

    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let func_name = node.sig.ident.to_string();

        // Check for state modification functions
        if self.is_state_modification_function(&func_name) {
            self.state_field_updates += 1;
            self.state_method_calls += 1;
            self.record_pattern(&format!("state_function_{}", func_name));
        }

        // Check for sequence dependency functions
        if self.is_sequence_dependency_function(&func_name) {
            self.sequence_dependency_patterns += 1;
            self.multi_step_workflow_patterns += 1;
            self.record_pattern(&format!("sequence_function_{}", func_name));
        }

        // Check for workflow functions
        if self.is_workflow_function(&func_name) {
            self.multi_step_workflow_patterns += 1;
            self.complex_workflow_patterns += 1;
            self.record_pattern(&format!("workflow_function_{}", func_name));
        }

        // Check for state machine functions
        if self.is_state_machine_function(&func_name) {
            self.state_machine_patterns += 1;
            self.status_transition_patterns += 1;
            self.record_pattern(&format!("state_machine_function_{}", func_name));
        }

        // Check for race condition functions
        if self.is_race_condition_function(&func_name) {
            self.race_condition_risks += 1;
            self.concurrent_access_patterns += 1;
            self.record_pattern(&format!("race_condition_function_{}", func_name));
        }

        // Check for functions that contain statefulness patterns in their names
        if func_name.contains("state")
            || func_name.contains("sequence")
            || func_name.contains("workflow")
        {
            self.complex_workflow_patterns += 1;
            self.state_dependency_chains += 1;
            self.record_pattern(&format!("statefulness_function_{}", func_name));
        }

        // Continue visiting function body
        syn::visit::visit_item_fn(self, node);
    }

    fn visit_item_struct(&mut self, node: &'ast ItemStruct) {
        // Check for state structs with mutable patterns
        for attr in &node.attrs {
            if self.is_mutable_account_attribute(attr) {
                self.mutable_account_patterns += 1;
                self.record_pattern("mutable_account_struct");
            }

            if self.is_state_initialization_attribute(attr) {
                self.state_initialization_patterns += 1;
                self.record_pattern("state_initialization_struct");
            }

            if self.is_state_validation_attribute(attr) {
                self.state_validation_patterns += 1;
                self.record_pattern("state_validation_struct");
            }
        }

        // Check struct name for state patterns
        let struct_name = node.ident.to_string();
        if struct_name.contains("state") || struct_name.contains("State") {
            self.state_machine_patterns += 1;
            self.record_pattern(&format!("state_struct_{}", struct_name));
        }

        // Continue visiting struct
        syn::visit::visit_item_struct(self, node);
    }
}

/// Calculate statefulness metrics for workspace
pub fn calculate_workspace_statefulness(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<StatefulnessMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 STATEFULNESS DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = StatefulnessMetrics::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            log::warn!(
                "🔍 STATEFULNESS DEBUG: File does not exist: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!(
                "🔍 STATEFULNESS DEBUG: Skipping non-Rust file: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        log::info!("🔍 STATEFULNESS DEBUG: Analyzing file: {:?}", full_path);

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = StatefulnessVisitor::new();
        visitor.current_file_path = file_path.to_string();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.mutable_account_patterns += visitor.mutable_account_patterns;
        metrics.state_field_updates += visitor.state_field_updates;
        metrics.state_method_calls += visitor.state_method_calls;
        metrics.state_initialization_patterns += visitor.state_initialization_patterns;
        metrics.state_validation_patterns += visitor.state_validation_patterns;
        metrics.sequence_dependency_patterns += visitor.sequence_dependency_patterns;
        metrics.multi_step_workflow_patterns += visitor.multi_step_workflow_patterns;
        metrics.state_check_patterns += visitor.state_check_patterns;
        metrics.flag_based_sequences += visitor.flag_based_sequences;
        metrics.counter_based_sequences += visitor.counter_based_sequences;
        metrics.timestamp_based_sequences += visitor.timestamp_based_sequences;
        metrics.deposit_redeem_patterns += visitor.deposit_redeem_patterns;
        metrics.order_matching_patterns += visitor.order_matching_patterns;
        metrics.approval_flow_patterns += visitor.approval_flow_patterns;
        metrics.escrow_patterns += visitor.escrow_patterns;
        metrics.vesting_patterns += visitor.vesting_patterns;
        metrics.staking_patterns += visitor.staking_patterns;
        metrics.race_condition_risks += visitor.race_condition_risks;
        metrics.partial_completion_risks += visitor.partial_completion_risks;
        metrics.concurrent_access_patterns += visitor.concurrent_access_patterns;
        metrics.state_locking_patterns += visitor.state_locking_patterns;
        metrics.atomic_operation_patterns += visitor.atomic_operation_patterns;
        metrics.state_machine_patterns += visitor.state_machine_patterns;
        metrics.status_transition_patterns += visitor.status_transition_patterns;
        metrics.state_reset_patterns += visitor.state_reset_patterns;
        metrics.state_pause_patterns += visitor.state_pause_patterns;
        metrics.complex_workflow_patterns += visitor.complex_workflow_patterns;
        metrics.conditional_state_patterns += visitor.conditional_state_patterns;
        metrics.nested_state_patterns += visitor.nested_state_patterns;
        metrics.recursive_state_patterns += visitor.recursive_state_patterns;
        metrics.state_dependency_chains += visitor.state_dependency_chains;

        // Merge pattern breakdown
        for (pattern, count) in visitor.statefulness_pattern_counts {
            *metrics
                .statefulness_pattern_breakdown
                .entry(pattern)
                .or_insert(0) += count;
        }

        files_analyzed += 1;
    }

    // Calculate weighted complexity scores
    metrics.statefulness_complexity_score = calculate_statefulness_complexity_score(&metrics);
    metrics.sequence_risk_score = calculate_sequence_risk_score(&metrics);
    metrics.race_condition_risk_score = calculate_race_condition_risk_score(&metrics);

    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    log::info!(
        "🔍 STATEFULNESS DEBUG: Analysis complete. Files analyzed: {}, Files skipped: {}",
        files_analyzed,
        files_skipped
    );

    Ok(metrics)
}

/// Calculate statefulness complexity score with weighted patterns
fn calculate_statefulness_complexity_score(metrics: &StatefulnessMetrics) -> f64 {
    let mut score = 0.0;

    // State modification patterns (high weight - core statefulness)
    score += metrics.mutable_account_patterns as f64 * 4.0;
    score += metrics.state_field_updates as f64 * 3.0;
    score += metrics.state_method_calls as f64 * 3.0;
    score += metrics.state_initialization_patterns as f64 * 2.0;
    score += metrics.state_validation_patterns as f64 * 2.0;

    // Sequence dependency patterns (high weight - complex workflows)
    score += metrics.sequence_dependency_patterns as f64 * 5.0;
    score += metrics.multi_step_workflow_patterns as f64 * 4.0;
    score += metrics.state_check_patterns as f64 * 3.0;
    score += metrics.flag_based_sequences as f64 * 3.0;
    score += metrics.counter_based_sequences as f64 * 3.0;
    score += metrics.timestamp_based_sequences as f64 * 4.0;

    // Multi-step operation patterns (medium weight - DeFi workflows)
    score += metrics.deposit_redeem_patterns as f64 * 4.0;
    score += metrics.order_matching_patterns as f64 * 5.0;
    score += metrics.approval_flow_patterns as f64 * 3.0;
    score += metrics.escrow_patterns as f64 * 4.0;
    score += metrics.vesting_patterns as f64 * 3.0;
    score += metrics.staking_patterns as f64 * 3.0;

    // Race condition patterns (high weight - security risks)
    score += metrics.race_condition_risks as f64 * 6.0;
    score += metrics.partial_completion_risks as f64 * 5.0;
    score += metrics.concurrent_access_patterns as f64 * 4.0;
    score += metrics.state_locking_patterns as f64 * 3.0;
    score += metrics.atomic_operation_patterns as f64 * 2.0;

    // State machine patterns (medium weight - complex state management)
    score += metrics.state_machine_patterns as f64 * 4.0;
    score += metrics.status_transition_patterns as f64 * 4.0;
    score += metrics.state_reset_patterns as f64 * 3.0;
    score += metrics.state_pause_patterns as f64 * 3.0;

    // Workflow complexity patterns (low weight - general complexity)
    score += metrics.complex_workflow_patterns as f64 * 2.0;
    score += metrics.conditional_state_patterns as f64 * 2.0;
    score += metrics.nested_state_patterns as f64 * 3.0;
    score += metrics.recursive_state_patterns as f64 * 4.0;
    score += metrics.state_dependency_chains as f64 * 3.0;

    score
}

/// Calculate sequence risk score
fn calculate_sequence_risk_score(metrics: &StatefulnessMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk sequence patterns
    score += metrics.sequence_dependency_patterns as f64 * 6.0;
    score += metrics.multi_step_workflow_patterns as f64 * 5.0;
    score += metrics.order_matching_patterns as f64 * 6.0;
    score += metrics.escrow_patterns as f64 * 5.0;

    // Medium-risk sequence patterns
    score += metrics.deposit_redeem_patterns as f64 * 4.0;
    score += metrics.approval_flow_patterns as f64 * 3.0;
    score += metrics.vesting_patterns as f64 * 3.0;
    score += metrics.staking_patterns as f64 * 3.0;

    // Low-risk sequence patterns
    score += metrics.state_check_patterns as f64 * 2.0;
    score += metrics.flag_based_sequences as f64 * 2.0;
    score += metrics.counter_based_sequences as f64 * 2.0;

    score
}

/// Calculate race condition risk score
fn calculate_race_condition_risk_score(metrics: &StatefulnessMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk race condition patterns
    score += metrics.race_condition_risks as f64 * 8.0;
    score += metrics.partial_completion_risks as f64 * 7.0;
    score += metrics.concurrent_access_patterns as f64 * 6.0;

    // Medium-risk race condition patterns
    score += metrics.state_locking_patterns as f64 * 4.0;
    score += metrics.atomic_operation_patterns as f64 * 3.0;

    // Low-risk race condition patterns
    score += metrics.mutable_account_patterns as f64 * 2.0;
    score += metrics.state_field_updates as f64 * 2.0;

    score
}
