use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::BinOp;
use syn::{visit::Visit, Expr, ExprBinary, ExprCall, ExprMethodCall, ItemFn, Path};

/// Metrics for arithmetic operations in Anchor handlers
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ArithmeticMetrics {
    // Handler statistics
    pub total_math_handlers: u32,
    pub total_arithmetic_operations: u32,

    // Context classification
    pub handler_arithmetic_operations: u32,
    pub utility_arithmetic_operations: u32,
    pub state_arithmetic_operations: u32,
    pub math_arithmetic_operations: u32,
    pub test_arithmetic_operations: u32,

    // Operation breakdown
    pub operation_breakdown: HashMap<String, u32>,

    // Risk assessment
    pub high_risk_operations: u32,
    pub medium_risk_operations: u32,
    pub low_risk_operations: u32,

    // Context-specific operations
    pub balance_price_operations: u32,
    pub token_operations: u32,
    pub fee_operations: u32,

    // Complexity metrics
    pub arithmetic_complexity_score: f64,
    pub nested_operations: u32,
    pub compound_expressions: u32,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl ArithmeticMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalMathHandlers": self.total_math_handlers,
            "totalArithmeticOperations": self.total_arithmetic_operations,
            "handlerArithmeticOperations": self.handler_arithmetic_operations,
            "utilityArithmeticOperations": self.utility_arithmetic_operations,
            "stateArithmeticOperations": self.state_arithmetic_operations,
            "mathArithmeticOperations": self.math_arithmetic_operations,
            "testArithmeticOperations": self.test_arithmetic_operations,
            "operationBreakdown": self.operation_breakdown,
            "highRiskOperations": self.high_risk_operations,
            "mediumRiskOperations": self.medium_risk_operations,
            "lowRiskOperations": self.low_risk_operations,
            "balancePriceOperations": self.balance_price_operations,
            "tokenOperations": self.token_operations,
            "feeOperations": self.fee_operations,
            "arithmeticComplexityScore": self.arithmetic_complexity_score,
            "nestedOperations": self.nested_operations,
            "compoundExpressions": self.compound_expressions,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped
        })
    }
}

/// Information about a handler with arithmetic operations
#[derive(Debug)]
struct HandlerArithmeticInfo {
    name: String,
    operation_count: u32,
    high_risk_count: u32,
    balance_price_count: u32,
    has_nested_operations: bool,
}

/// Visitor for detecting arithmetic operations in Anchor handlers
#[derive(Debug)]
struct ArithmeticVisitor {
    handlers: Vec<HandlerArithmeticInfo>,
    current_file_path: String,
    current_handler: Option<String>,
    operation_counts: HashMap<String, u32>,
    total_operations: u32,

    // Context classification counters
    handler_arithmetic_operations: u32,
    utility_arithmetic_operations: u32,
    state_arithmetic_operations: u32,
    math_arithmetic_operations: u32,
    test_arithmetic_operations: u32,

    high_risk_operations: u32,
    medium_risk_operations: u32,
    low_risk_operations: u32,
    balance_price_operations: u32,
    token_operations: u32,
    fee_operations: u32,
    nested_operations: u32,
    compound_expressions: u32,
    in_arithmetic_context: bool,
    arithmetic_depth: u32,
}

impl ArithmeticVisitor {
    fn new() -> Self {
        Self {
            handlers: Vec::new(),
            current_file_path: String::new(),
            current_handler: None,
            operation_counts: HashMap::new(),
            total_operations: 0,
            handler_arithmetic_operations: 0,
            utility_arithmetic_operations: 0,
            state_arithmetic_operations: 0,
            math_arithmetic_operations: 0,
            test_arithmetic_operations: 0,
            high_risk_operations: 0,
            medium_risk_operations: 0,
            low_risk_operations: 0,
            balance_price_operations: 0,
            token_operations: 0,
            fee_operations: 0,
            nested_operations: 0,
            compound_expressions: 0,
            in_arithmetic_context: false,
            arithmetic_depth: 0,
        }
    }

    /// Check if a variable name suggests balance/price context
    fn is_balance_price_context(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("amount")
            || name_lower.contains("balance")
            || name_lower.contains("price")
            || name_lower.contains("rate")
            || name_lower.contains("fee")
            || name_lower.contains("leverage")
            || name_lower.contains("ratio")
            || name_lower.contains("value")
            || name_lower.contains("cost")
            || name_lower.contains("total")
            || name_lower.contains("sum")
            || name_lower.contains("diff")
            || name_lower.contains("delta")
    }

    /// Check if a variable name suggests token context
    fn is_token_context(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("token")
            || name_lower.contains("mint")
            || name_lower.contains("burn")
            || name_lower.contains("supply")
            || name_lower.contains("deposit")
            || name_lower.contains("withdraw")
    }

    /// Check if a variable name suggests fee context
    fn is_fee_context(&self, name: &str) -> bool {
        let name_lower = name.to_lowercase();
        name_lower.contains("fee")
            || name_lower.contains("commission")
            || name_lower.contains("charge")
            || name_lower.contains("tax")
    }

    /// Get risk level for an arithmetic operation
    fn get_operation_risk(&self, op: &BinOp) -> &'static str {
        match op {
            BinOp::Div(_) | BinOp::Rem(_) => "high", // Division and modulo are high risk
            BinOp::Mul(_) => "medium",               // Multiplication is medium risk
            BinOp::Add(_) | BinOp::Sub(_) => "low",  // Addition and subtraction are low risk
            _ => "low",
        }
    }

    /// Get risk level for a method call
    fn get_method_risk(&self, method_name: &str) -> &'static str {
        let method_lower = method_name.to_lowercase();
        if method_lower.contains("pow") || method_lower.contains("exp") {
            "high"
        } else if method_lower.contains("mul")
            || method_lower.contains("div")
            || method_lower.contains("rem")
        {
            "medium"
        } else if method_lower.contains("add") || method_lower.contains("sub") {
            "low"
        } else {
            "low"
        }
    }

    /// Helper method to get expression name (simplified)
    fn get_expr_name(&self, expr: &Expr) -> String {
        match expr {
            Expr::Path(path_expr) => {
                if let Some(segment) = path_expr.path.segments.last() {
                    segment.ident.to_string()
                } else {
                    "unknown".to_string()
                }
            }
            Expr::Field(field_expr) => {
                if let Expr::Path(path_expr) = &*field_expr.base {
                    if let Some(segment) = path_expr.path.segments.last() {
                        format!("{}.{:?}", segment.ident, field_expr.member)
                    } else {
                        format!("{:?}", field_expr.member)
                    }
                } else {
                    format!("{:?}", field_expr.member)
                }
            }
            _ => "unknown".to_string(),
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

    /// Check if a function call is arithmetic-related
    fn is_arithmetic_function(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let func_name = segment.ident.to_string().to_lowercase();
            func_name.contains("pow")
                || func_name.contains("sqrt")
                || func_name.contains("log")
                || func_name.contains("exp")
                || func_name.contains("abs")
                || func_name.contains("min")
                || func_name.contains("max")
                || func_name.contains("checked_add")
                || func_name.contains("checked_mul")
                || func_name.contains("checked_div")
                || func_name.contains("saturating_add")
                || func_name.contains("saturating_mul")
                || func_name.contains("wrapping_add")
                || func_name.contains("wrapping_mul")
        } else {
            false
        }
    }
    /// Classify arithmetic operation by file context
    fn classify_arithmetic_context(&self) -> &'static str {
        if self.current_file_path.contains("instructions/") {
            "handler"
        } else if self.current_file_path.contains("utils/") {
            "utility"
        } else if self.current_file_path.contains("state/")
            || self.current_file_path.ends_with("state.rs")
        {
            "state"
        } else if self.current_file_path.contains("math/")
            || self.current_file_path.contains("curve.rs")
        {
            "math"
        } else if self.current_file_path.contains("tests/") {
            "test"
        } else {
            "other"
        }
    }

    /// Record an arithmetic operation with context classification
    fn record_operation(&mut self, op_type: &str, risk_level: &str, context: &str) {
        self.total_operations += 1;
        *self
            .operation_counts
            .entry(op_type.to_string())
            .or_insert(0) += 1;

        // Classify by file context
        match self.classify_arithmetic_context() {
            "handler" => self.handler_arithmetic_operations += 1,
            "utility" => self.utility_arithmetic_operations += 1,
            "state" => self.state_arithmetic_operations += 1,
            "math" => self.math_arithmetic_operations += 1,
            "test" => self.test_arithmetic_operations += 1,
            _ => self.utility_arithmetic_operations += 1, // Default to utility for other contexts
        }

        match risk_level {
            "high" => self.high_risk_operations += 1,
            "medium" => self.medium_risk_operations += 1,
            "low" => self.low_risk_operations += 1,
            _ => self.low_risk_operations += 1,
        }

        match context {
            "balance_price" => self.balance_price_operations += 1,
            "token" => self.token_operations += 1,
            "fee" => self.fee_operations += 1,
            _ => {}
        }

        if self.arithmetic_depth > 1 {
            self.nested_operations += 1;
        }
    }
}

impl<'ast> Visit<'ast> for ArithmeticVisitor {
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        // Check if this is an Anchor instruction handler
        let is_instruction = node
            .attrs
            .iter()
            .any(|attr| attr.path().is_ident("instruction"));

        let is_anchor_handler = if is_instruction {
            true
        } else {
            // TEMPORARILY RELAXED FOR TESTING - analyze all public functions with arithmetic patterns
            matches!(node.vis, syn::Visibility::Public(_))
                && (node.sig.ident.to_string().starts_with("handle_")
                    || node.sig.ident.to_string().starts_with("ix_")
                    || node.sig.ident.to_string().contains("update")
                    || node.sig.ident.to_string().contains("calculate")
                    || node.sig.ident.to_string().contains("compute")
                    || node.sig.ident.to_string().contains("math")
                    || node.sig.ident.to_string().contains("safe_"))
        };

        if is_anchor_handler {
            log::info!(
                "🔍 ARITHMETIC DEBUG: Found Anchor instruction handler: {}",
                node.sig.ident
            );

            self.current_handler = Some(node.sig.ident.to_string());
            let handler_start_operations = self.total_operations;
            let handler_start_high_risk = self.high_risk_operations;
            let handler_start_balance_price = self.balance_price_operations;

            // Visit the function body
            syn::visit::visit_item_fn(self, node);

            // Record handler statistics
            let operation_count = self.total_operations - handler_start_operations;
            let high_risk_count = self.high_risk_operations - handler_start_high_risk;
            let balance_price_count = self.balance_price_operations - handler_start_balance_price;

            if operation_count > 0 {
                self.handlers.push(HandlerArithmeticInfo {
                    name: self.current_handler.clone().unwrap_or_default(),
                    operation_count,
                    high_risk_count,
                    balance_price_count,
                    has_nested_operations: self.nested_operations > 0,
                });
            }

            self.current_handler = None;
        } else {
            // Continue visiting for non-handler functions
            syn::visit::visit_item_fn(self, node);
        }
    }

    fn visit_expr_binary(&mut self, node: &'ast ExprBinary) {
        let op = &node.op;
        let op_type = match op {
            BinOp::Add(_) => "add",
            BinOp::Sub(_) => "sub",
            BinOp::Mul(_) => "mul",
            BinOp::Div(_) => "div",
            BinOp::Rem(_) => "rem",
            BinOp::BitXor(_) => "bit_xor",
            BinOp::BitAnd(_) => "bit_and",
            BinOp::BitOr(_) => "bit_or",
            BinOp::Shl(_) => "shl",
            BinOp::Shr(_) => "shr",
            _ => "other",
        };

        let risk_level = self.get_operation_risk(op);

        // Check context from variable names
        let context = if self.is_balance_price_context(&self.get_expr_name(&node.left))
            || self.is_balance_price_context(&self.get_expr_name(&node.right))
        {
            "balance_price"
        } else if self.is_token_context(&self.get_expr_name(&node.left))
            || self.is_token_context(&self.get_expr_name(&node.right))
        {
            "token"
        } else if self.is_fee_context(&self.get_expr_name(&node.left))
            || self.is_fee_context(&self.get_expr_name(&node.right))
        {
            "fee"
        } else {
            "general"
        };

        self.record_operation(op_type, risk_level, context);

        // Continue visiting
        syn::visit::visit_expr_binary(self, node);
    }

    fn visit_expr_method_call(&mut self, node: &'ast ExprMethodCall) {
        let method_name = node.method.to_string();
        let risk_level = self.get_method_risk(&method_name);

        // Check if this is an arithmetic method
        if method_name.contains("add")
            || method_name.contains("sub")
            || method_name.contains("mul")
            || method_name.contains("div")
            || method_name.contains("rem")
            || method_name.contains("pow")
        {
            let context = if self.is_balance_price_context(&method_name) {
                "balance_price"
            } else if self.is_token_context(&method_name) {
                "token"
            } else if self.is_fee_context(&method_name) {
                "fee"
            } else {
                "general"
            };

            self.record_operation(&format!("method_{}", method_name), risk_level, context);
        }

        // Continue visiting
        syn::visit::visit_expr_method_call(self, node);
    }

    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let Expr::Path(path_expr) = &*node.func {
            if self.is_arithmetic_function(&path_expr.path) {
                let func_name = if let Some(segment) = path_expr.path.segments.last() {
                    segment.ident.to_string()
                } else {
                    "unknown".to_string()
                };

                let risk_level = if func_name.contains("pow") || func_name.contains("exp") {
                    "high"
                } else if func_name.contains("mul") || func_name.contains("div") {
                    "medium"
                } else {
                    "low"
                };

                self.record_operation(&format!("func_{}", func_name), risk_level, "general");
            }
        }

        // Continue visiting
        syn::visit::visit_expr_call(self, node);
    }
}

/// Calculate arithmetic operation metrics for workspace
pub fn calculate_workspace_arithmetic(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<ArithmeticMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 ARITHMETIC DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = ArithmeticMetrics::default();
    let mut visitor = ArithmeticVisitor::new();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    // Analyze each selected file
    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);
        if !full_path.exists() {
            log::warn!("🔍 ARITHMETIC DEBUG: File does not exist: {:?}", full_path);
            continue;
        }

        // TEMPORARILY REMOVED FILE FILTERING FOR TESTING
        // For Arithmetic Operation factor, analyze ALL files to see the difference
        let file_path_str = file_path.to_string();
        // let is_relevant_for_arithmetic = file_path_str.contains("instructions/")
        //     || file_path_str.contains("ix_")
        //     || file_path_str.ends_with("lib.rs")
        //     || file_path_str.ends_with("state.rs")
        //     || file_path_str.ends_with("error.rs");

        // if !is_relevant_for_arithmetic {
        //     log::info!(
        //         "🔍 ARITHMETIC DEBUG: Skipping non-instruction file for arithmetic analysis: {:?}",
        //         full_path
        //     );
        //     files_skipped += 1;
        //     continue;
        // }

        log::info!("🔍 ARITHMETIC DEBUG: Analyzing file: {:?}", full_path);

        match std::fs::read_to_string(&full_path) {
            Ok(content) => {
                log::info!(
                    "🔍 ARITHMETIC DEBUG: Successfully read file, content length: {}",
                    content.len()
                );

                // Set the current file path for the visitor
                visitor.current_file_path = file_path.to_string();
                files_analyzed += 1;

                match syn::parse_file(&content) {
                    Ok(ast) => {
                        log::info!("🔍 ARITHMETIC DEBUG: Successfully parsed AST");
                        visitor.visit_file(&ast);
                    }
                    Err(e) => {
                        log::warn!(
                            "🔍 ARITHMETIC DEBUG: Failed to parse AST for {:?}: {}",
                            full_path,
                            e
                        );
                    }
                }
            }
            Err(e) => {
                log::warn!(
                    "🔍 ARITHMETIC DEBUG: Failed to read file {:?}: {}",
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
    metrics.total_math_handlers = visitor.handlers.len() as u32;
    metrics.total_arithmetic_operations = visitor.total_operations;
    metrics.handler_arithmetic_operations = visitor.handler_arithmetic_operations;
    metrics.utility_arithmetic_operations = visitor.utility_arithmetic_operations;
    metrics.state_arithmetic_operations = visitor.state_arithmetic_operations;
    metrics.math_arithmetic_operations = visitor.math_arithmetic_operations;
    metrics.test_arithmetic_operations = visitor.test_arithmetic_operations;
    metrics.operation_breakdown = visitor.operation_counts;
    metrics.high_risk_operations = visitor.high_risk_operations;
    metrics.medium_risk_operations = visitor.medium_risk_operations;
    metrics.low_risk_operations = visitor.low_risk_operations;
    metrics.balance_price_operations = visitor.balance_price_operations;
    metrics.token_operations = visitor.token_operations;
    metrics.fee_operations = visitor.fee_operations;
    metrics.nested_operations = visitor.nested_operations;
    metrics.compound_expressions = visitor.compound_expressions;

    // Calculate complexity score (weighted by risk)
    let high_risk_weight = 3.0;
    let medium_risk_weight = 2.0;
    let low_risk_weight = 1.0;

    metrics.arithmetic_complexity_score = (visitor.high_risk_operations as f64 * high_risk_weight)
        + (visitor.medium_risk_operations as f64 * medium_risk_weight)
        + (visitor.low_risk_operations as f64 * low_risk_weight);

    log::info!(
        "🔍 ARITHMETIC DEBUG: Analysis complete. Found {} handlers with {} total operations",
        metrics.total_math_handlers,
        metrics.total_arithmetic_operations
    );

    Ok(metrics)
}
