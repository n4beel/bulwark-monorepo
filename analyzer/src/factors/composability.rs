use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{visit::Visit, Expr, ItemFn, Path};

/// Metrics for composability and inter-program complexity patterns
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ComposabilityMetrics {
    // Flash loan patterns
    pub flash_loan_callbacks: u32,
    pub flash_loan_integrations: u32,
    pub flash_loan_borrow_patterns: u32,
    pub flash_loan_repay_patterns: u32,

    // Cross-program flows
    pub cross_program_instruction_sequences: u32,
    pub multi_step_program_flows: u32,
    pub atomic_transaction_dependencies: u32,
    pub cross_program_context_patterns: u32,

    // Callback interfaces
    pub callback_interface_functions: u32,
    pub external_callback_handlers: u32,
    pub program_callback_patterns: u32,
    pub instruction_callback_patterns: u32,

    // DEX integration patterns
    pub dex_integration_patterns: u32,
    pub swap_callback_patterns: u32,
    pub liquidity_provider_patterns: u32,
    pub arbitrage_patterns: u32,

    // Lending protocol patterns
    pub lending_callback_patterns: u32,
    pub collateral_callback_patterns: u32,
    pub liquidation_callback_patterns: u32,
    pub borrowing_callback_patterns: u32,

    // General composability patterns
    pub composable_handlers: u32,
    pub inter_program_dependencies: u32,
    pub multi_program_transaction_patterns: u32,
    pub program_composition_patterns: u32,

    // Account dependency patterns
    pub external_account_dependencies: u32,
    pub cross_program_account_patterns: u32,
    pub program_derived_account_patterns: u32,
    pub shared_account_patterns: u32,

    // Detailed pattern breakdown
    pub composability_pattern_breakdown: HashMap<String, u32>,

    // Scoring
    pub composability_complexity_score: f64,
    pub inter_program_risk_score: f64,
    pub atomic_transaction_risk_score: f64,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl ComposabilityMetrics {
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::to_value(self).unwrap_or(serde_json::Value::Null)
    }
}

/// Visitor for analyzing composability patterns
struct ComposabilityVisitor {
    current_file_path: String,

    // Flash loan counters
    flash_loan_callbacks: u32,
    flash_loan_integrations: u32,
    flash_loan_borrow_patterns: u32,
    flash_loan_repay_patterns: u32,

    // Cross-program flow counters
    cross_program_instruction_sequences: u32,
    multi_step_program_flows: u32,
    atomic_transaction_dependencies: u32,
    cross_program_context_patterns: u32,

    // Callback interface counters
    callback_interface_functions: u32,
    external_callback_handlers: u32,
    program_callback_patterns: u32,
    instruction_callback_patterns: u32,

    // DEX integration counters
    dex_integration_patterns: u32,
    swap_callback_patterns: u32,
    liquidity_provider_patterns: u32,
    arbitrage_patterns: u32,

    // Lending protocol counters
    lending_callback_patterns: u32,
    collateral_callback_patterns: u32,
    liquidation_callback_patterns: u32,
    borrowing_callback_patterns: u32,

    // General composability counters
    composable_handlers: u32,
    inter_program_dependencies: u32,
    multi_program_transaction_patterns: u32,
    program_composition_patterns: u32,

    // Account dependency counters
    external_account_dependencies: u32,
    cross_program_account_patterns: u32,
    program_derived_account_patterns: u32,
    shared_account_patterns: u32,

    // Pattern tracking
    composability_pattern_counts: HashMap<String, u32>,
}

impl ComposabilityVisitor {
    fn new() -> Self {
        Self {
            current_file_path: String::new(),
            flash_loan_callbacks: 0,
            flash_loan_integrations: 0,
            flash_loan_borrow_patterns: 0,
            flash_loan_repay_patterns: 0,
            cross_program_instruction_sequences: 0,
            multi_step_program_flows: 0,
            atomic_transaction_dependencies: 0,
            cross_program_context_patterns: 0,
            callback_interface_functions: 0,
            external_callback_handlers: 0,
            program_callback_patterns: 0,
            instruction_callback_patterns: 0,
            dex_integration_patterns: 0,
            swap_callback_patterns: 0,
            liquidity_provider_patterns: 0,
            arbitrage_patterns: 0,
            lending_callback_patterns: 0,
            collateral_callback_patterns: 0,
            liquidation_callback_patterns: 0,
            borrowing_callback_patterns: 0,
            composable_handlers: 0,
            inter_program_dependencies: 0,
            multi_program_transaction_patterns: 0,
            program_composition_patterns: 0,
            external_account_dependencies: 0,
            cross_program_account_patterns: 0,
            program_derived_account_patterns: 0,
            shared_account_patterns: 0,
            composability_pattern_counts: HashMap::new(),
        }
    }

    /// Record a composability pattern
    fn record_pattern(&mut self, pattern: &str) {
        *self
            .composability_pattern_counts
            .entry(pattern.to_string())
            .or_insert(0) += 1;
    }

    /// Check if a function name indicates flash loan patterns
    fn is_flash_loan_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "flash_loan_callback"
                | "flash_borrow_callback"
                | "flash_repay_callback"
                | "execute_flash_loan"
                | "flash_loan_borrow"
                | "flash_loan_repay"
                | "flash_loan_execute"
                | "callback_after_flash_loan"
        ) || func_name.contains("flash_loan")
            || func_name.contains("flash_borrow")
    }

    /// Check if a function name indicates DEX integration patterns
    fn is_dex_integration_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "swap_callback"
                | "swap_execute"
                | "liquidity_callback"
                | "add_liquidity_callback"
                | "remove_liquidity_callback"
                | "arbitrage_execute"
                | "arbitrage_callback"
                | "dex_swap_callback"
                | "dex_integration"
        ) || func_name.contains("swap")
            || func_name.contains("liquidity")
            || func_name.contains("arbitrage")
    }

    /// Check if a function name indicates lending protocol patterns
    fn is_lending_protocol_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "lending_callback"
                | "borrow_callback"
                | "repay_callback"
                | "collateral_callback"
                | "liquidation_callback"
                | "lending_execute"
                | "borrow_execute"
                | "repay_execute"
                | "collateral_execute"
                | "liquidation_execute"
        ) || func_name.contains("borrow")
            || func_name.contains("lend")
            || func_name.contains("repay")
            || func_name.contains("liquidation")
    }

    /// Check if a function name indicates callback interface patterns
    fn is_callback_interface_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "callback"
                | "execute_callback"
                | "program_callback"
                | "instruction_callback"
                | "external_callback"
                | "cross_program_callback"
                | "atomic_callback"
                | "transaction_callback"
        )
    }

    /// Check if a function name indicates composability patterns
    fn is_composable_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "compose"
                | "composable"
                | "inter_program"
                | "cross_program"
                | "multi_program"
                | "atomic_transaction"
                | "transaction_compose"
                | "program_compose"
        )
    }

    /// Check if a path represents cross-program patterns
    fn is_cross_program_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "cross_program"
                    | "inter_program"
                    | "multi_program"
                    | "atomic_transaction"
                    | "program_compose"
                    | "transaction_compose"
            )
        } else {
            false
        }
    }

    /// Check if a path represents flash loan patterns
    fn is_flash_loan_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "flash_loan" | "flash_borrow" | "flash_repay" | "flash_execute" | "flash_callback"
            )
        } else {
            false
        }
    }

    /// Check if a path represents DEX integration patterns
    fn is_dex_integration_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "swap_callback"
                    | "liquidity_callback"
                    | "arbitrage"
                    | "dex_integration"
                    | "swap_execute"
                    | "liquidity_execute"
            )
        } else {
            false
        }
    }

    /// Check if a path represents lending protocol patterns
    fn is_lending_protocol_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "lending_callback"
                    | "borrow_callback"
                    | "repay_callback"
                    | "collateral_callback"
                    | "liquidation_callback"
                    | "lending_execute"
                    | "borrow_execute"
                    | "repay_execute"
            )
        } else {
            false
        }
    }

    /// Check if a path represents callback interface patterns
    fn is_callback_interface_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "callback"
                    | "execute_callback"
                    | "program_callback"
                    | "instruction_callback"
                    | "external_callback"
                    | "cross_program_callback"
            )
        } else {
            false
        }
    }

    /// Check if a path represents invoke_signed patterns (actual composability)
    fn is_invoke_signed_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "invoke_signed" | "invoke_signed_unchecked" | "invoke_unchecked" | "invoke"
            )
        } else {
            false
        }
    }

    /// Check if a path represents CpiContext patterns (Anchor composability)
    fn is_cpi_context_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "CpiContext" | "CpiContext::new" | "CpiContext::new_with_signer"
            )
        } else {
            false
        }
    }
}

impl<'ast> Visit<'ast> for ComposabilityVisitor {
    fn visit_expr(&mut self, node: &'ast Expr) {
        match node {
            Expr::Call(call_expr) => {
                if let Expr::Path(path_expr) = &*call_expr.func {
                    // Check for flash loan patterns
                    if self.is_flash_loan_pattern(&path_expr.path) {
                        self.flash_loan_integrations += 1;
                        self.flash_loan_callbacks += 1;
                        self.record_pattern("flash_loan_call");
                    }

                    // Check for DEX integration patterns
                    if self.is_dex_integration_pattern(&path_expr.path) {
                        self.dex_integration_patterns += 1;
                        self.swap_callback_patterns += 1;
                        self.record_pattern("dex_integration_call");
                    }

                    // Check for lending protocol patterns
                    if self.is_lending_protocol_pattern(&path_expr.path) {
                        self.lending_callback_patterns += 1;
                        self.borrowing_callback_patterns += 1;
                        self.record_pattern("lending_protocol_call");
                    }

                    // Check for callback interface patterns
                    if self.is_callback_interface_pattern(&path_expr.path) {
                        self.callback_interface_functions += 1;
                        self.external_callback_handlers += 1;
                        self.record_pattern("callback_interface_call");
                    }

                    // Check for cross-program patterns
                    if self.is_cross_program_pattern(&path_expr.path) {
                        self.cross_program_instruction_sequences += 1;
                        self.multi_step_program_flows += 1;
                        self.record_pattern("cross_program_call");
                    }

                    // Check for invoke_signed patterns (actual composability)
                    if self.is_invoke_signed_pattern(&path_expr.path) {
                        self.cross_program_instruction_sequences += 1;
                        self.multi_step_program_flows += 1;
                        self.atomic_transaction_dependencies += 1;
                        self.record_pattern("invoke_signed_call");
                    }

                    // Check for CpiContext patterns (Anchor composability)
                    if self.is_cpi_context_pattern(&path_expr.path) {
                        self.cross_program_context_patterns += 1;
                        self.program_composition_patterns += 1;
                        self.record_pattern("cpi_context_call");
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

        // Check for flash loan method calls
        if matches!(
            method_name.as_str(),
            "flash_loan" | "flash_borrow" | "flash_repay" | "execute_flash_loan"
        ) {
            self.flash_loan_integrations += 1;
            self.flash_loan_callbacks += 1;
            self.record_pattern(&format!("flash_loan_method_{}", method_name));
        }

        // Check for DEX integration method calls
        if matches!(
            method_name.as_str(),
            "swap_callback" | "liquidity_callback" | "arbitrage_execute" | "dex_integration"
        ) {
            self.dex_integration_patterns += 1;
            self.swap_callback_patterns += 1;
            self.record_pattern(&format!("dex_method_{}", method_name));
        }

        // Check for lending protocol method calls
        if matches!(
            method_name.as_str(),
            "lending_callback" | "borrow_callback" | "repay_callback" | "collateral_callback"
        ) {
            self.lending_callback_patterns += 1;
            self.borrowing_callback_patterns += 1;
            self.record_pattern(&format!("lending_method_{}", method_name));
        }

        // Check for callback interface method calls
        if matches!(
            method_name.as_str(),
            "callback" | "execute_callback" | "program_callback" | "instruction_callback"
        ) {
            self.callback_interface_functions += 1;
            self.external_callback_handlers += 1;
            self.record_pattern(&format!("callback_method_{}", method_name));
        }

        // Check for invoke_signed method calls (actual composability)
        if matches!(
            method_name.as_str(),
            "invoke_signed" | "invoke_signed_unchecked" | "invoke_unchecked" | "invoke"
        ) {
            self.cross_program_instruction_sequences += 1;
            self.multi_step_program_flows += 1;
            self.atomic_transaction_dependencies += 1;
            self.record_pattern(&format!("invoke_method_{}", method_name));
        }

        // Check for CpiContext method calls (Anchor composability)
        if matches!(method_name.as_str(), "new" | "new_with_signer") {
            // Check if this is called on CpiContext
            if let Expr::Path(path_expr) = &*node.receiver {
                if let Some(segment) = path_expr.path.segments.last() {
                    if segment.ident.to_string() == "CpiContext" {
                        self.cross_program_context_patterns += 1;
                        self.program_composition_patterns += 1;
                        self.record_pattern(&format!("cpi_context_method_{}", method_name));
                    }
                }
            }
        }

        // Continue visiting method call
        syn::visit::visit_expr_method_call(self, node);
    }

    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let func_name = node.sig.ident.to_string();

        // Check for flash loan functions
        if self.is_flash_loan_function(&func_name) {
            self.flash_loan_callbacks += 1;
            self.flash_loan_integrations += 1;
            self.record_pattern(&format!("flash_loan_function_{}", func_name));
        }

        // Check for DEX integration functions
        if self.is_dex_integration_function(&func_name) {
            self.dex_integration_patterns += 1;
            self.swap_callback_patterns += 1;
            self.record_pattern(&format!("dex_function_{}", func_name));
        }

        // Check for lending protocol functions
        if self.is_lending_protocol_function(&func_name) {
            self.lending_callback_patterns += 1;
            self.borrowing_callback_patterns += 1;
            self.record_pattern(&format!("lending_function_{}", func_name));
        }

        // Check for callback interface functions
        if self.is_callback_interface_function(&func_name) {
            self.callback_interface_functions += 1;
            self.external_callback_handlers += 1;
            self.record_pattern(&format!("callback_function_{}", func_name));
        }

        // Check for composable functions
        if self.is_composable_function(&func_name) {
            self.composable_handlers += 1;
            self.inter_program_dependencies += 1;
            self.record_pattern(&format!("composable_function_{}", func_name));
        }

        // Check for functions that contain composability patterns in their names
        if func_name.contains("invoke")
            || func_name.contains("cpi")
            || func_name.contains("cross_program")
        {
            self.cross_program_instruction_sequences += 1;
            self.multi_step_program_flows += 1;
            self.record_pattern(&format!("composability_function_{}", func_name));
        }

        // Continue visiting function body
        syn::visit::visit_item_fn(self, node);
    }
}

/// Calculate composability metrics for workspace
pub fn calculate_workspace_composability(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<ComposabilityMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 COMPOSABILITY DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = ComposabilityMetrics::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            log::warn!(
                "🔍 COMPOSABILITY DEBUG: File does not exist: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!(
                "🔍 COMPOSABILITY DEBUG: Skipping non-Rust file: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        log::info!("🔍 COMPOSABILITY DEBUG: Analyzing file: {:?}", full_path);

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = ComposabilityVisitor::new();
        visitor.current_file_path = file_path.to_string();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.flash_loan_callbacks += visitor.flash_loan_callbacks;
        metrics.flash_loan_integrations += visitor.flash_loan_integrations;
        metrics.flash_loan_borrow_patterns += visitor.flash_loan_borrow_patterns;
        metrics.flash_loan_repay_patterns += visitor.flash_loan_repay_patterns;
        metrics.cross_program_instruction_sequences += visitor.cross_program_instruction_sequences;
        metrics.multi_step_program_flows += visitor.multi_step_program_flows;
        metrics.atomic_transaction_dependencies += visitor.atomic_transaction_dependencies;
        metrics.cross_program_context_patterns += visitor.cross_program_context_patterns;
        metrics.callback_interface_functions += visitor.callback_interface_functions;
        metrics.external_callback_handlers += visitor.external_callback_handlers;
        metrics.program_callback_patterns += visitor.program_callback_patterns;
        metrics.instruction_callback_patterns += visitor.instruction_callback_patterns;
        metrics.dex_integration_patterns += visitor.dex_integration_patterns;
        metrics.swap_callback_patterns += visitor.swap_callback_patterns;
        metrics.liquidity_provider_patterns += visitor.liquidity_provider_patterns;
        metrics.arbitrage_patterns += visitor.arbitrage_patterns;
        metrics.lending_callback_patterns += visitor.lending_callback_patterns;
        metrics.collateral_callback_patterns += visitor.collateral_callback_patterns;
        metrics.liquidation_callback_patterns += visitor.liquidation_callback_patterns;
        metrics.borrowing_callback_patterns += visitor.borrowing_callback_patterns;
        metrics.composable_handlers += visitor.composable_handlers;
        metrics.inter_program_dependencies += visitor.inter_program_dependencies;
        metrics.multi_program_transaction_patterns += visitor.multi_program_transaction_patterns;
        metrics.program_composition_patterns += visitor.program_composition_patterns;
        metrics.external_account_dependencies += visitor.external_account_dependencies;
        metrics.cross_program_account_patterns += visitor.cross_program_account_patterns;
        metrics.program_derived_account_patterns += visitor.program_derived_account_patterns;
        metrics.shared_account_patterns += visitor.shared_account_patterns;

        // Merge pattern breakdown
        for (pattern, count) in visitor.composability_pattern_counts {
            *metrics
                .composability_pattern_breakdown
                .entry(pattern)
                .or_insert(0) += count;
        }

        files_analyzed += 1;
    }

    // Calculate weighted complexity scores
    metrics.composability_complexity_score = calculate_composability_complexity_score(&metrics);
    metrics.inter_program_risk_score = calculate_inter_program_risk_score(&metrics);
    metrics.atomic_transaction_risk_score = calculate_atomic_transaction_risk_score(&metrics);

    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    log::info!(
        "🔍 COMPOSABILITY DEBUG: Analysis complete. Files analyzed: {}, Files skipped: {}",
        files_analyzed,
        files_skipped
    );

    Ok(metrics)
}

/// Calculate composability complexity score with weighted patterns
fn calculate_composability_complexity_score(metrics: &ComposabilityMetrics) -> f64 {
    let mut score = 0.0;

    // Flash loan patterns (high weight - complex atomic operations)
    score += metrics.flash_loan_callbacks as f64 * 5.0;
    score += metrics.flash_loan_integrations as f64 * 4.0;
    score += metrics.flash_loan_borrow_patterns as f64 * 3.0;
    score += metrics.flash_loan_repay_patterns as f64 * 3.0;

    // Cross-program flows (high weight - complex inter-program coordination)
    score += metrics.cross_program_instruction_sequences as f64 * 4.0;
    score += metrics.multi_step_program_flows as f64 * 4.0;
    score += metrics.atomic_transaction_dependencies as f64 * 5.0;
    score += metrics.cross_program_context_patterns as f64 * 3.0;

    // Callback interfaces (medium weight - external program integration)
    score += metrics.callback_interface_functions as f64 * 3.0;
    score += metrics.external_callback_handlers as f64 * 3.0;
    score += metrics.program_callback_patterns as f64 * 2.0;
    score += metrics.instruction_callback_patterns as f64 * 2.0;

    // DEX integration patterns (medium weight - DeFi protocol integration)
    score += metrics.dex_integration_patterns as f64 * 3.0;
    score += metrics.swap_callback_patterns as f64 * 3.0;
    score += metrics.liquidity_provider_patterns as f64 * 2.0;
    score += metrics.arbitrage_patterns as f64 * 4.0;

    // Lending protocol patterns (medium weight - DeFi protocol integration)
    score += metrics.lending_callback_patterns as f64 * 3.0;
    score += metrics.collateral_callback_patterns as f64 * 3.0;
    score += metrics.liquidation_callback_patterns as f64 * 4.0;
    score += metrics.borrowing_callback_patterns as f64 * 2.0;

    // General composability patterns (low weight - basic composability)
    score += metrics.composable_handlers as f64 * 2.0;
    score += metrics.inter_program_dependencies as f64 * 2.0;
    score += metrics.multi_program_transaction_patterns as f64 * 3.0;
    score += metrics.program_composition_patterns as f64 * 2.0;

    // Account dependency patterns (low weight - basic account management)
    score += metrics.external_account_dependencies as f64 * 1.0;
    score += metrics.cross_program_account_patterns as f64 * 2.0;
    score += metrics.program_derived_account_patterns as f64 * 1.0;
    score += metrics.shared_account_patterns as f64 * 2.0;

    score
}

/// Calculate inter-program risk score
fn calculate_inter_program_risk_score(metrics: &ComposabilityMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk patterns
    score += metrics.flash_loan_callbacks as f64 * 6.0;
    score += metrics.atomic_transaction_dependencies as f64 * 5.0;
    score += metrics.liquidation_callback_patterns as f64 * 4.0;
    score += metrics.arbitrage_patterns as f64 * 4.0;

    // Medium-risk patterns
    score += metrics.cross_program_instruction_sequences as f64 * 3.0;
    score += metrics.multi_step_program_flows as f64 * 3.0;
    score += metrics.dex_integration_patterns as f64 * 2.0;
    score += metrics.lending_callback_patterns as f64 * 2.0;

    // Low-risk patterns
    score += metrics.callback_interface_functions as f64 * 1.0;
    score += metrics.composable_handlers as f64 * 1.0;

    score
}

/// Calculate atomic transaction risk score
fn calculate_atomic_transaction_risk_score(metrics: &ComposabilityMetrics) -> f64 {
    let mut score = 0.0;

    // Atomic transaction patterns (highest risk)
    score += metrics.atomic_transaction_dependencies as f64 * 8.0;
    score += metrics.flash_loan_callbacks as f64 * 7.0;
    score += metrics.multi_step_program_flows as f64 * 5.0;

    // Cross-program coordination (high risk)
    score += metrics.cross_program_instruction_sequences as f64 * 4.0;
    score += metrics.cross_program_context_patterns as f64 * 3.0;

    // Callback patterns (medium risk)
    score += metrics.callback_interface_functions as f64 * 2.0;
    score += metrics.external_callback_handlers as f64 * 2.0;

    score
}
