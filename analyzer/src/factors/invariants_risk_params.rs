use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{visit::Visit, BinOp, Expr, ExprBinary, ExprCall, ExprIf, ExprMacro, ItemFn, Path};

/// Metrics for Invariants and Risk Parameters patterns
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct InvariantsRiskParamsMetrics {
    // Anchor-specific invariant assertions
    pub require_assertions: u32,
    pub require_eq_assertions: u32,
    pub assert_assertions: u32,
    pub assert_eq_assertions: u32,
    pub check_assert_eq_patterns: u32,

    // Mathematical constraint patterns
    pub balance_consistency_checks: u32,
    pub supply_validation_checks: u32,
    pub amount_limit_checks: u32,
    pub mathematical_constraints: u32,
    pub equality_constraints: u32,
    pub inequality_constraints: u32,

    // Risk parameter validations
    pub collateral_ratio_checks: u32,
    pub fee_rate_checks: u32,
    pub slippage_checks: u32,
    pub health_factor_checks: u32,
    pub epoch_validations: u32,
    pub time_based_validations: u32,
    pub threshold_validations: u32,
    pub limit_validations: u32,

    // Enforcement mechanisms
    pub constraint_attributes: u32,
    pub validation_functions: u32,
    pub invariant_functions: u32,
    pub risk_parameter_functions: u32,

    // Context classification
    pub handler_invariants: u32,
    pub state_invariants: u32,
    pub utility_invariants: u32,
    pub test_invariants: u32,

    // Detailed pattern breakdown
    pub invariant_pattern_breakdown: HashMap<String, u32>,

    // Scoring
    pub invariant_complexity_score: f64,
    pub risk_parameter_complexity_score: f64,
    pub enforcement_mechanism_score: f64,
    pub total_invariant_score: f64,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl InvariantsRiskParamsMetrics {
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::to_value(self).unwrap_or(serde_json::Value::Null)
    }
}

/// Visitor for analyzing invariants and risk parameters patterns
struct InvariantsRiskParamsVisitor {
    current_file_path: String,

    // Invariant assertion counters
    require_assertions: u32,
    require_eq_assertions: u32,
    assert_assertions: u32,
    assert_eq_assertions: u32,
    check_assert_eq_patterns: u32,

    // Mathematical constraint counters
    balance_consistency_checks: u32,
    supply_validation_checks: u32,
    amount_limit_checks: u32,
    mathematical_constraints: u32,
    equality_constraints: u32,
    inequality_constraints: u32,

    // Risk parameter counters
    collateral_ratio_checks: u32,
    fee_rate_checks: u32,
    slippage_checks: u32,
    health_factor_checks: u32,
    epoch_validations: u32,
    time_based_validations: u32,
    threshold_validations: u32,
    limit_validations: u32,

    // Enforcement mechanism counters
    constraint_attributes: u32,
    validation_functions: u32,
    invariant_functions: u32,
    risk_parameter_functions: u32,

    // Context counters
    handler_invariants: u32,
    state_invariants: u32,
    utility_invariants: u32,
    test_invariants: u32,

    // Pattern tracking
    invariant_pattern_counts: HashMap<String, u32>,
}

impl InvariantsRiskParamsVisitor {
    fn new() -> Self {
        Self {
            current_file_path: String::new(),
            require_assertions: 0,
            require_eq_assertions: 0,
            assert_assertions: 0,
            assert_eq_assertions: 0,
            check_assert_eq_patterns: 0,
            balance_consistency_checks: 0,
            supply_validation_checks: 0,
            amount_limit_checks: 0,
            mathematical_constraints: 0,
            equality_constraints: 0,
            inequality_constraints: 0,
            collateral_ratio_checks: 0,
            fee_rate_checks: 0,
            slippage_checks: 0,
            health_factor_checks: 0,
            epoch_validations: 0,
            time_based_validations: 0,
            threshold_validations: 0,
            limit_validations: 0,
            constraint_attributes: 0,
            validation_functions: 0,
            invariant_functions: 0,
            risk_parameter_functions: 0,
            handler_invariants: 0,
            state_invariants: 0,
            utility_invariants: 0,
            test_invariants: 0,
            invariant_pattern_counts: HashMap::new(),
        }
    }

    /// Record an invariant pattern
    fn record_pattern(&mut self, pattern: &str) {
        *self
            .invariant_pattern_counts
            .entry(pattern.to_string())
            .or_insert(0) += 1;
    }

    /// Check if a function name indicates invariant handling
    fn is_invariant_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "validate_invariant"
                | "check_invariant"
                | "enforce_invariant"
                | "verify_invariant"
                | "validate_balance"
                | "check_balance"
                | "validate_supply"
                | "check_supply"
        ) || func_name.contains("invariant")
            || func_name.contains("validate")
            || func_name.contains("check")
            || func_name.contains("verify")
    }

    /// Check if a function name indicates risk parameter handling
    fn is_risk_parameter_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "validate_collateral_ratio"
                | "check_health_factor"
                | "validate_fee_rate"
                | "check_slippage"
                | "validate_epoch"
                | "check_threshold"
                | "validate_limit"
        ) || func_name.contains("collateral")
            || func_name.contains("health_factor")
            || func_name.contains("fee_rate")
            || func_name.contains("slippage")
            || func_name.contains("epoch")
            || func_name.contains("threshold")
            || func_name.contains("limit")
    }

    /// Check if a function name indicates validation
    fn is_validation_function(&self, func_name: &str) -> bool {
        func_name.starts_with("validate_")
            || func_name.starts_with("check_")
            || func_name.starts_with("verify_")
            || func_name.starts_with("assert_")
    }

    /// Check if a binary expression indicates mathematical constraint
    fn is_mathematical_constraint(&self, op: &BinOp, left: &Expr, right: &Expr) -> bool {
        match op {
            BinOp::Eq(_) | BinOp::Ne(_) => {
                // Check for balance consistency patterns
                let left_str = quote::quote!(#left).to_string();
                let _right_str = quote::quote!(#right).to_string();

                (left_str.contains("deposit") && _right_str.contains("liability"))
                    || (left_str.contains("input") && _right_str.contains("output"))
                    || (left_str.contains("total") && _right_str.contains("sum"))
                    || (left_str.contains("balance") && _right_str.contains("balance"))
            }
            BinOp::Lt(_) | BinOp::Le(_) | BinOp::Gt(_) | BinOp::Ge(_) => {
                // Check for limit and threshold patterns
                let left_str = quote::quote!(#left).to_string();
                let _right_str = quote::quote!(#right).to_string();

                left_str.contains("amount")
                    || left_str.contains("supply")
                    || left_str.contains("ratio")
                    || left_str.contains("rate")
                    || left_str.contains("fee")
                    || left_str.contains("slippage")
                    || left_str.contains("threshold")
                    || left_str.contains("limit")
            }
            _ => false,
        }
    }

    /// Check if a path indicates risk parameter validation
    fn is_risk_parameter_path(&self, path: &Path) -> bool {
        let path_str = quote::quote!(#path).to_string();
        path_str.contains("collateral")
            || path_str.contains("health_factor")
            || path_str.contains("fee_rate")
            || path_str.contains("slippage")
            || path_str.contains("epoch")
            || path_str.contains("threshold")
            || path_str.contains("limit")
            || path_str.contains("ratio")
    }

    /// Classify function context
    fn classify_function_context(&self, func_name: &str) -> &'static str {
        if func_name.contains("test") || func_name.starts_with("test_") {
            "test"
        } else if func_name.contains("handler") || func_name.contains("instruction") {
            "handler"
        } else if func_name.contains("state") || func_name.contains("account") {
            "state"
        } else {
            "utility"
        }
    }
}

impl<'ast> Visit<'ast> for InvariantsRiskParamsVisitor {
    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let Expr::Path(path_expr) = &*node.func {
            let path_str = quote::quote!(#path_expr).to_string();

            // Check for Anchor assertion macros (including macro calls)
            if path_str == "require" {
                self.require_assertions += 1;
                self.record_pattern("require_assertion");
            } else if path_str == "require_eq" {
                self.require_eq_assertions += 1;
                self.record_pattern("require_eq_assertion");
            } else if path_str == "assert" {
                self.assert_assertions += 1;
                self.record_pattern("assert_assertion");
            } else if path_str == "assert_eq" {
                self.assert_eq_assertions += 1;
                self.record_pattern("assert_eq_assertion");
            } else if path_str == "check_assert_eq" {
                self.check_assert_eq_patterns += 1;
                self.record_pattern("check_assert_eq_pattern");
            }

            // Check for risk parameter validation calls
            if self.is_risk_parameter_path(&path_expr.path) {
                self.risk_parameter_functions += 1;
                self.record_pattern(&format!("risk_parameter_call_{}", path_str));
            }
        }

        // Continue visiting call
        syn::visit::visit_expr_call(self, node);
    }

    fn visit_expr_binary(&mut self, node: &'ast ExprBinary) {
        // Check for mathematical constraints
        if self.is_mathematical_constraint(&node.op, &node.left, &node.right) {
            self.mathematical_constraints += 1;
            self.record_pattern("mathematical_constraint");

            match node.op {
                BinOp::Eq(_) | BinOp::Ne(_) => {
                    self.equality_constraints += 1;
                    self.record_pattern("equality_constraint");

                    // Check for specific balance consistency patterns
                    let left_str = quote::quote!(#node.left).to_string();
                    let _right_str = quote::quote!(#node.right).to_string();

                    if (left_str.contains("deposit") && _right_str.contains("liability"))
                        || (left_str.contains("input") && _right_str.contains("output"))
                        || (left_str.contains("total") && _right_str.contains("sum"))
                    {
                        self.balance_consistency_checks += 1;
                        self.record_pattern("balance_consistency_check");
                    }
                }
                BinOp::Lt(_) | BinOp::Le(_) | BinOp::Gt(_) | BinOp::Ge(_) => {
                    self.inequality_constraints += 1;
                    self.record_pattern("inequality_constraint");

                    // Check for specific risk parameter patterns
                    let left_str = quote::quote!(#node.left).to_string();
                    let _right_str = quote::quote!(#node.right).to_string();

                    if left_str.contains("collateral") && left_str.contains("ratio") {
                        self.collateral_ratio_checks += 1;
                        self.record_pattern("collateral_ratio_check");
                    } else if left_str.contains("fee") && left_str.contains("rate") {
                        self.fee_rate_checks += 1;
                        self.record_pattern("fee_rate_check");
                    } else if left_str.contains("slippage") {
                        self.slippage_checks += 1;
                        self.record_pattern("slippage_check");
                    } else if left_str.contains("health_factor") {
                        self.health_factor_checks += 1;
                        self.record_pattern("health_factor_check");
                    } else if left_str.contains("epoch") {
                        self.epoch_validations += 1;
                        self.record_pattern("epoch_validation");
                    } else if left_str.contains("amount") || left_str.contains("supply") {
                        self.amount_limit_checks += 1;
                        self.record_pattern("amount_limit_check");
                    } else if left_str.contains("threshold") {
                        self.threshold_validations += 1;
                        self.record_pattern("threshold_validation");
                    } else if left_str.contains("limit") {
                        self.limit_validations += 1;
                        self.record_pattern("limit_validation");
                    }
                }
                _ => {}
            }
        }

        // Continue visiting binary expression
        syn::visit::visit_expr_binary(self, node);
    }

    fn visit_expr_if(&mut self, node: &'ast ExprIf) {
        // Check for conditional risk parameter validations
        if let Expr::Binary(binary_expr) = &*node.cond {
            if self.is_mathematical_constraint(
                &binary_expr.op,
                &binary_expr.left,
                &binary_expr.right,
            ) {
                self.time_based_validations += 1;
                self.record_pattern("conditional_validation");
            }
        }

        // Continue visiting if expression
        syn::visit::visit_expr_if(self, node);
    }

    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let func_name = node.sig.ident.to_string();
        let context = self.classify_function_context(&func_name);

        // Check for invariant functions
        if self.is_invariant_function(&func_name) {
            self.invariant_functions += 1;
            self.record_pattern(&format!("invariant_function_{}", func_name));

            match context {
                "handler" => self.handler_invariants += 1,
                "state" => self.state_invariants += 1,
                "utility" => self.utility_invariants += 1,
                "test" => self.test_invariants += 1,
                _ => {}
            }
        }

        // Check for risk parameter functions
        if self.is_risk_parameter_function(&func_name) {
            self.risk_parameter_functions += 1;
            self.record_pattern(&format!("risk_parameter_function_{}", func_name));
        }

        // Check for validation functions
        if self.is_validation_function(&func_name) {
            self.validation_functions += 1;
            self.record_pattern(&format!("validation_function_{}", func_name));
        }

        // Continue visiting function body
        syn::visit::visit_item_fn(self, node);
    }

    fn visit_expr_macro(&mut self, node: &'ast ExprMacro) {
        let macro_name = node
            .mac
            .path
            .segments
            .last()
            .map(|s| s.ident.to_string())
            .unwrap_or_default();

        // Check for Anchor assertion macros
        match macro_name.as_str() {
            "require" => {
                self.require_assertions += 1;
                self.record_pattern("require_assertion");
            }
            "require_eq" => {
                self.require_eq_assertions += 1;
                self.record_pattern("require_eq_assertion");
            }
            "assert" => {
                self.assert_assertions += 1;
                self.record_pattern("assert_assertion");
            }
            "assert_eq" => {
                self.assert_eq_assertions += 1;
                self.record_pattern("assert_eq_assertion");
            }
            "check_assert_eq" => {
                self.check_assert_eq_patterns += 1;
                self.record_pattern("check_assert_eq_pattern");
            }
            _ => {}
        }

        // Continue visiting macro
        syn::visit::visit_expr_macro(self, node);
    }
}

/// Calculate invariants and risk parameters metrics for workspace
pub fn calculate_workspace_invariants_risk_params(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<InvariantsRiskParamsMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 INVARIANTS DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = InvariantsRiskParamsMetrics::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            log::warn!("🔍 INVARIANTS DEBUG: File does not exist: {:?}", full_path);
            files_skipped += 1;
            continue;
        }

        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!(
                "🔍 INVARIANTS DEBUG: Skipping non-Rust file: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        log::info!("🔍 INVARIANTS DEBUG: Analyzing file: {:?}", full_path);

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = InvariantsRiskParamsVisitor::new();
        visitor.current_file_path = file_path.to_string();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.require_assertions += visitor.require_assertions;
        metrics.require_eq_assertions += visitor.require_eq_assertions;
        metrics.assert_assertions += visitor.assert_assertions;
        metrics.assert_eq_assertions += visitor.assert_eq_assertions;
        metrics.check_assert_eq_patterns += visitor.check_assert_eq_patterns;

        metrics.balance_consistency_checks += visitor.balance_consistency_checks;
        metrics.supply_validation_checks += visitor.supply_validation_checks;
        metrics.amount_limit_checks += visitor.amount_limit_checks;
        metrics.mathematical_constraints += visitor.mathematical_constraints;
        metrics.equality_constraints += visitor.equality_constraints;
        metrics.inequality_constraints += visitor.inequality_constraints;

        metrics.collateral_ratio_checks += visitor.collateral_ratio_checks;
        metrics.fee_rate_checks += visitor.fee_rate_checks;
        metrics.slippage_checks += visitor.slippage_checks;
        metrics.health_factor_checks += visitor.health_factor_checks;
        metrics.epoch_validations += visitor.epoch_validations;
        metrics.time_based_validations += visitor.time_based_validations;
        metrics.threshold_validations += visitor.threshold_validations;
        metrics.limit_validations += visitor.limit_validations;

        metrics.constraint_attributes += visitor.constraint_attributes;
        metrics.validation_functions += visitor.validation_functions;
        metrics.invariant_functions += visitor.invariant_functions;
        metrics.risk_parameter_functions += visitor.risk_parameter_functions;

        metrics.handler_invariants += visitor.handler_invariants;
        metrics.state_invariants += visitor.state_invariants;
        metrics.utility_invariants += visitor.utility_invariants;
        metrics.test_invariants += visitor.test_invariants;

        // Merge pattern breakdown
        for (pattern, count) in visitor.invariant_pattern_counts {
            *metrics
                .invariant_pattern_breakdown
                .entry(pattern)
                .or_insert(0) += count;
        }

        files_analyzed += 1;
    }

    // Calculate complexity scores
    metrics.invariant_complexity_score = calculate_invariant_complexity_score(&metrics);
    metrics.risk_parameter_complexity_score = calculate_risk_parameter_complexity_score(&metrics);
    metrics.enforcement_mechanism_score = calculate_enforcement_mechanism_score(&metrics);
    metrics.total_invariant_score = metrics.invariant_complexity_score
        + metrics.risk_parameter_complexity_score
        + metrics.enforcement_mechanism_score;

    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    log::info!(
        "🔍 INVARIANTS DEBUG: Analysis complete. Files analyzed: {}, Files skipped: {}",
        files_analyzed,
        files_skipped
    );

    Ok(metrics)
}

/// Calculate invariant complexity score
fn calculate_invariant_complexity_score(metrics: &InvariantsRiskParamsMetrics) -> f64 {
    let mut score = 0.0;

    // Anchor assertion patterns
    score += metrics.require_assertions as f64 * 2.0;
    score += metrics.require_eq_assertions as f64 * 3.0;
    score += metrics.assert_assertions as f64 * 1.0;
    score += metrics.assert_eq_assertions as f64 * 2.0;
    score += metrics.check_assert_eq_patterns as f64 * 2.0;

    // Mathematical constraints
    score += metrics.balance_consistency_checks as f64 * 4.0;
    score += metrics.supply_validation_checks as f64 * 3.0;
    score += metrics.amount_limit_checks as f64 * 2.0;
    score += metrics.mathematical_constraints as f64 * 2.0;
    score += metrics.equality_constraints as f64 * 2.0;
    score += metrics.inequality_constraints as f64 * 1.5;

    score
}

/// Calculate risk parameter complexity score
fn calculate_risk_parameter_complexity_score(metrics: &InvariantsRiskParamsMetrics) -> f64 {
    let mut score = 0.0;

    // Risk parameter validations
    score += metrics.collateral_ratio_checks as f64 * 4.0;
    score += metrics.fee_rate_checks as f64 * 3.0;
    score += metrics.slippage_checks as f64 * 2.0;
    score += metrics.health_factor_checks as f64 * 4.0;
    score += metrics.epoch_validations as f64 * 2.0;
    score += metrics.time_based_validations as f64 * 2.0;
    score += metrics.threshold_validations as f64 * 2.0;
    score += metrics.limit_validations as f64 * 1.5;

    score
}

/// Calculate enforcement mechanism score
fn calculate_enforcement_mechanism_score(metrics: &InvariantsRiskParamsMetrics) -> f64 {
    let mut score = 0.0;

    // Enforcement mechanisms
    score += metrics.constraint_attributes as f64 * 2.0;
    score += metrics.validation_functions as f64 * 3.0;
    score += metrics.invariant_functions as f64 * 4.0;
    score += metrics.risk_parameter_functions as f64 * 3.0;

    // Context classification
    score += metrics.handler_invariants as f64 * 3.0;
    score += metrics.state_invariants as f64 * 2.0;
    score += metrics.utility_invariants as f64 * 1.0;
    score += metrics.test_invariants as f64 * 0.5;

    score
}
