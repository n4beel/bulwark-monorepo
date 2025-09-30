//! AST visitor for analyzing Rust code

use crate::metrics::{
    ArithmeticMetrics, ControlFlowMetrics, FunctionMetrics, MathFunctionMetrics, SafetyMetrics,
};
use std::collections::HashSet;
use syn::visit::{self, Visit};
use syn::{BinOp, Block, Expr, ExprBinary, ExprCall, ExprMethodCall, ItemFn, Stmt};

/// Main visitor for analyzing function metrics
pub struct FunctionVisitor<'ast> {
    /// Current function being analyzed
    current_function: Option<FunctionMetrics>,

    /// Completed function metrics
    pub functions: Vec<FunctionMetrics>,

    /// Current nesting depth for control flow
    loop_depth: usize,
    conditional_depth: usize,
    max_loop_depth: usize,
    max_conditional_depth: usize,

    /// Source code for line number calculations
    source: &'ast str,

    /// Detected semantic patterns
    semantic_patterns: HashSet<String>,
}

impl<'ast> FunctionVisitor<'ast> {
    pub fn new(source: &'ast str) -> Self {
        Self {
            current_function: None,
            functions: Vec::new(),
            loop_depth: 0,
            conditional_depth: 0,
            max_loop_depth: 0,
            max_conditional_depth: 0,
            source,
            semantic_patterns: HashSet::new(),
        }
    }

    /// Get the line number for a span (simplified - using proc_macro2::Span would be more accurate)
    fn get_line_number(&self, _byte_offset: usize) -> usize {
        // For now, return 1 - in a real implementation, you'd calculate actual line numbers
        // This would require more complex span handling
        1
    }

    /// Detect semantic patterns in function names and content
    fn detect_semantic_patterns(&mut self, name: &str) {
        // AMM-specific patterns
        if name.contains("swap") {
            self.semantic_patterns.insert("token_swap".to_string());
        }
        if name.contains("liquidity") {
            self.semantic_patterns
                .insert("liquidity_management".to_string());
        }
        if name.contains("price") || name.contains("oracle") {
            self.semantic_patterns
                .insert("price_calculation".to_string());
        }
        if name.contains("fee") {
            self.semantic_patterns.insert("fee_calculation".to_string());
        }
        if name.contains("pnl") || name.contains("profit") {
            self.semantic_patterns.insert("pnl_calculation".to_string());
        }
        if name.contains("invariant") {
            self.semantic_patterns
                .insert("invariant_maintenance".to_string());
        }
        if name.contains("slippage") {
            self.semantic_patterns
                .insert("slippage_protection".to_string());
        }
        if name.contains("ceil_div") || name.contains("checked_ceil_div") {
            self.semantic_patterns
                .insert("ceiling_division".to_string());
        }
        if name.contains("sqrt") || name.contains("integer_sqrt") {
            self.semantic_patterns
                .insert("square_root_calculation".to_string());
        }
    }

    /// Calculate cyclomatic complexity for a function
    fn calculate_cyclomatic_complexity(&self, block: &Block) -> u32 {
        let mut complexity = 1; // Base complexity
        let mut visitor = ComplexityVisitor::new();
        visitor.visit_block(block);
        complexity + visitor.decision_points
    }
}

impl<'ast> Visit<'ast> for FunctionVisitor<'ast> {
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let name = node.sig.ident.to_string();
        let signature = format!("{}", quote::quote! { #node.sig });

        // Detect semantic patterns
        self.detect_semantic_patterns(&name);

        // Calculate line range (simplified for now)
        let start_line = 1; // TODO: implement proper line calculation
        let end_line = 1;

        // Initialize function metrics
        self.current_function = Some(FunctionMetrics {
            name: name.clone(),
            signature,
            line_range: (start_line, end_line),
            arithmetic: ArithmeticMetrics::default(),
            math_functions: MathFunctionMetrics::default(),
            control_flow: ControlFlowMetrics::default(),
            safety: SafetyMetrics::default(),
            semantic_tags: Vec::new(),
            risk_indicators: Vec::new(),
            complexity_score: 0.0,
        });

        // Visit the function body
        visit::visit_block(self, &node.block);

        // Calculate final metrics
        if let Some(mut func) = self.current_function.take() {
            func.control_flow.cyclomatic_complexity =
                self.calculate_cyclomatic_complexity(&node.block);
            func.control_flow.max_loop_depth = self.max_loop_depth as u32;
            func.control_flow.max_conditional_depth = self.max_conditional_depth as u32;

            // Add semantic tags
            func.semantic_tags = self.semantic_patterns.iter().cloned().collect();

            // Calculate complexity score (simple heuristic for now)
            func.complexity_score = self.calculate_complexity_score(&func);

            self.functions.push(func);
        }

        // Reset for next function
        self.max_loop_depth = 0;
        self.max_conditional_depth = 0;
        self.semantic_patterns.clear();
    }

    fn visit_expr_method_call(&mut self, node: &'ast ExprMethodCall) {
        if let Some(func) = &mut self.current_function {
            let method_name = node.method.to_string();

            match method_name.as_str() {
                // Checked arithmetic
                "checked_add" => func.arithmetic.checked_add += 1,
                "checked_sub" => func.arithmetic.checked_sub += 1,
                "checked_mul" => func.arithmetic.checked_mul += 1,
                "checked_div" => func.arithmetic.checked_div += 1,
                "checked_rem" => func.arithmetic.checked_rem += 1,
                "checked_pow" => func.arithmetic.checked_pow += 1,

                // Saturating arithmetic
                "saturating_add" => func.arithmetic.saturating_add += 1,
                "saturating_sub" => func.arithmetic.saturating_sub += 1,
                "saturating_mul" => func.arithmetic.saturating_mul += 1,

                // Wrapping arithmetic
                "wrapping_add" => func.arithmetic.wrapping_add += 1,
                "wrapping_sub" => func.arithmetic.wrapping_sub += 1,
                "wrapping_mul" => func.arithmetic.wrapping_mul += 1,
                "wrapping_div" => func.arithmetic.wrapping_div += 1,

                // Special operations
                "checked_ceil_div" => func.arithmetic.ceil_div += 1,
                "integer_sqrt" => func.arithmetic.integer_sqrt += 1,

                // Math functions
                "sqrt" => func.math_functions.sqrt += 1,
                "pow" | "powf" | "powi" => func.math_functions.pow += 1,
                "exp" | "exp2" => func.math_functions.exp += 1,
                "ln" | "log" | "log2" | "log10" => func.math_functions.log += 1,
                "floor" => func.math_functions.floor += 1,
                "ceil" => func.math_functions.ceil += 1,
                "round" => func.math_functions.round += 1,
                "abs" => func.math_functions.abs += 1,
                "min" | "max" => func.math_functions.min_max += 1,

                // Safety concerns
                "unwrap" => func.safety.unwrap_calls += 1,
                "expect" => func.safety.expect_calls += 1,

                // Detect semantic patterns from method names
                name if name.contains("swap") => {
                    self.semantic_patterns.insert("method_swap".to_string());
                }
                name if name.contains("liquidity") => {
                    self.semantic_patterns
                        .insert("method_liquidity".to_string());
                }
                _ => {}
            }
        }

        visit::visit_expr_method_call(self, node);
    }

    fn visit_expr_binary(&mut self, node: &'ast ExprBinary) {
        if let Some(func) = &mut self.current_function {
            match &node.op {
                BinOp::Add(_) => func.arithmetic.raw_add += 1,
                BinOp::Sub(_) => func.arithmetic.raw_sub += 1,
                BinOp::Mul(_) => func.arithmetic.raw_mul += 1,
                BinOp::Div(_) => func.arithmetic.raw_div += 1,
                BinOp::Rem(_) => func.arithmetic.raw_rem += 1,
                BinOp::Shl(_)
                | BinOp::Shr(_)
                | BinOp::BitAnd(_)
                | BinOp::BitOr(_)
                | BinOp::BitXor(_) => func.arithmetic.bitwise_ops += 1,
                _ => {}
            }
        }

        visit::visit_expr_binary(self, node);
    }

    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let Some(func) = &mut self.current_function {
            // Check for panic-related calls
            if let Expr::Path(path) = &*node.func {
                if let Some(segment) = path.path.segments.last() {
                    match segment.ident.to_string().as_str() {
                        "panic" => func.safety.panic_calls += 1,
                        "todo" | "unimplemented" => func.safety.todo_calls += 1,
                        _ => {}
                    }
                }
            }
        }

        visit::visit_expr_call(self, node);
    }

    // Control flow tracking
    fn visit_expr_loop(&mut self, node: &'ast syn::ExprLoop) {
        self.loop_depth += 1;
        self.max_loop_depth = self.max_loop_depth.max(self.loop_depth);

        if let Some(func) = &mut self.current_function {
            func.control_flow.loop_count += 1;
        }

        visit::visit_expr_loop(self, node);
        self.loop_depth -= 1;
    }

    fn visit_expr_while(&mut self, node: &'ast syn::ExprWhile) {
        self.loop_depth += 1;
        self.max_loop_depth = self.max_loop_depth.max(self.loop_depth);

        if let Some(func) = &mut self.current_function {
            func.control_flow.loop_count += 1;
        }

        visit::visit_expr_while(self, node);
        self.loop_depth -= 1;
    }

    fn visit_expr_for_loop(&mut self, node: &'ast syn::ExprForLoop) {
        self.loop_depth += 1;
        self.max_loop_depth = self.max_loop_depth.max(self.loop_depth);

        if let Some(func) = &mut self.current_function {
            func.control_flow.loop_count += 1;
        }

        visit::visit_expr_for_loop(self, node);
        self.loop_depth -= 1;
    }

    fn visit_expr_if(&mut self, node: &'ast syn::ExprIf) {
        self.conditional_depth += 1;
        self.max_conditional_depth = self.max_conditional_depth.max(self.conditional_depth);

        if let Some(func) = &mut self.current_function {
            func.control_flow.conditional_count += 1;
        }

        visit::visit_expr_if(self, node);
        self.conditional_depth -= 1;
    }
}

impl<'ast> FunctionVisitor<'ast> {
    /// Calculate complexity score for a function
    fn calculate_complexity_score(&self, func: &FunctionMetrics) -> f64 {
        let arithmetic_weight = 1.0;
        let math_weight = 1.2;
        let control_flow_weight = 0.8;
        let safety_weight = 2.0;

        let arithmetic_score = func.arithmetic.total_ops() as f64 * arithmetic_weight;
        let math_score = func.math_functions.total_calls() as f64 * math_weight;
        let control_flow_score =
            func.control_flow.cyclomatic_complexity as f64 * control_flow_weight;
        let safety_penalty =
            (func.safety.unwrap_calls + func.safety.panic_calls) as f64 * safety_weight;

        arithmetic_score + math_score + control_flow_score + safety_penalty
    }
}

/// Helper visitor for calculating cyclomatic complexity
struct ComplexityVisitor {
    decision_points: u32,
}

impl ComplexityVisitor {
    fn new() -> Self {
        Self { decision_points: 0 }
    }
}

impl<'ast> Visit<'ast> for ComplexityVisitor {
    fn visit_expr_if(&mut self, node: &'ast syn::ExprIf) {
        self.decision_points += 1;
        visit::visit_expr_if(self, node);
    }

    fn visit_expr_while(&mut self, node: &'ast syn::ExprWhile) {
        self.decision_points += 1;
        visit::visit_expr_while(self, node);
    }

    fn visit_expr_for_loop(&mut self, node: &'ast syn::ExprForLoop) {
        self.decision_points += 1;
        visit::visit_expr_for_loop(self, node);
    }

    fn visit_expr_match(&mut self, node: &'ast syn::ExprMatch) {
        self.decision_points += node.arms.len() as u32;
        visit::visit_expr_match(self, node);
    }

    fn visit_arm(&mut self, node: &'ast syn::Arm) {
        if node.guard.is_some() {
            self.decision_points += 1;
        }
        visit::visit_arm(self, node);
    }
}
