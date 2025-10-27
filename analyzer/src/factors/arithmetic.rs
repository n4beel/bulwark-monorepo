//! Arithmetic Operation Risk Factor
//!
//! This module analyzes the "arithmetic attack surface" of a smart contract.
//! It is "handler-centric," meaning it only counts high-risk arithmetic
//! operations (*, /, %) that occur *inside* a true Anchor instruction handler.

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use syn::{
    parse_file,
    visit::{self, Visit},
    BinOp, Expr, ExprBinary, ExprCall, ExprMethodCall, ItemFn,
};

/// Metrics for high-risk arithmetic operations in Anchor handlers
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ArithmeticMetrics {
    /// Total number of instruction handlers found
    pub total_handlers_found: u32,
    /// Sub-factor 1: Handlers with high/medium-risk math
    pub total_math_handlers: u32,
    /// Sub-factor 2: Total high-risk ops (/, %)
    pub high_risk_ops_count: u32,
    /// Sub-factor 3: Total medium-risk ops (*)
    pub medium_risk_ops_count: u32,

    /// Breakdown of which handlers contain math
    pub math_handlers: Vec<String>,
    /// Breakdown of all ops found
    pub operation_breakdown: HashMap<String, u32>,

    /// Final Normalized Factor (0-100)
    pub arithmetic_factor: f64,
    /// Raw score used for normalization
    pub raw_risk_score: f64,
}

impl ArithmeticMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "arithmeticFactor": self.arithmetic_factor,
            "rawRiskScore": self.raw_risk_score,
            "totalHandlersFound": self.total_handlers_found,
            "totalMathHandlers": self.total_math_handlers,
            "highRiskOpsCount": self.high_risk_ops_count,
            "mediumRiskOpsCount": self.medium_risk_ops_count,
            "mathHandlers": self.math_handlers,
            "operationBreakdown": self.operation_breakdown,
        })
    }
}

/// Pass 1: Visitor to find all mathy functions and their operations
#[derive(Debug, Default)]
struct MathFinderVisitor {
    current_function_name: Option<String>,
    math_ops_by_function: HashMap<String, (u32, u32)>, // (high_risk_ops, medium_risk_ops)
    operation_breakdown: HashMap<String, u32>,
}

/// Pass 2: Visitor to build call graph
#[derive(Debug, Default)]
struct CallGraphVisitor {
    current_function_name: Option<String>,
    call_graph: HashMap<String, HashSet<String>>, // Maps function to functions it calls
}

impl MathFinderVisitor {
    /// Checks if a function/method name is a high-risk operation
    fn is_high_risk_math_fn(&self, name: &str) -> bool {
        matches!(
            name,
            "div"
                | "checked_div"
                | "saturating_div"
                | "wrapping_div"
                | "overflowing_div"
                | "rem"
                | "checked_rem"
                | "saturating_rem"
                | "wrapping_rem"
                | "overflowing_rem"
                | "pow"
                | "checked_pow"
                | "saturating_pow"
                | "wrapping_pow"
                | "overflowing_pow"
        )
    }

    /// Checks if a function/method name is a medium-risk operation
    fn is_medium_risk_math_fn(&self, name: &str) -> bool {
        matches!(
            name,
            "mul" | "checked_mul" | "saturating_mul" | "wrapping_mul" | "overflowing_mul"
        )
    }

    /// Records an operation in the current function
    fn record_op(&mut self, op: &str, risk: &str) {
        if let Some(ref func_name) = self.current_function_name {
            let entry = self
                .math_ops_by_function
                .entry(func_name.clone())
                .or_insert((0, 0));
            *self.operation_breakdown.entry(op.to_string()).or_insert(0) += 1;

            if risk == "high" {
                entry.0 += 1;
            } else if risk == "medium" {
                entry.1 += 1;
            }
        }
    }
}

impl<'ast> Visit<'ast> for MathFinderVisitor {
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        // Set context for this function
        self.current_function_name = Some(node.sig.ident.to_string());

        // Visit the function body
        visit::visit_item_fn(self, node);

        // Clear context
        self.current_function_name = None;
    }

    fn visit_expr_binary(&mut self, node: &'ast ExprBinary) {
        match &node.op {
            BinOp::Div(_) => self.record_op("Div (/)", "high"),
            BinOp::Rem(_) => self.record_op("Rem (%)", "high"),
            BinOp::Mul(_) => self.record_op("Mul (*)", "medium"),
            _ => {
                // Ignored: Add, Sub, Bitwise, etc.
            }
        }
        visit::visit_expr_binary(self, node);
    }

    fn visit_expr_method_call(&mut self, node: &'ast ExprMethodCall) {
        let method_name = node.method.to_string();
        if self.is_high_risk_math_fn(&method_name) {
            self.record_op(&method_name, "high");
        } else if self.is_medium_risk_math_fn(&method_name) {
            self.record_op(&method_name, "medium");
        }
        visit::visit_expr_method_call(self, node);
    }

    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let Expr::Path(expr_path) = &*node.func {
            if let Some(segment) = expr_path.path.segments.last() {
                let func_name = segment.ident.to_string();
                if self.is_high_risk_math_fn(&func_name) {
                    self.record_op(&func_name, "high");
                } else if self.is_medium_risk_math_fn(&func_name) {
                    self.record_op(&func_name, "medium");
                }
            }
        }
        visit::visit_expr_call(self, node);
    }
}

impl CallGraphVisitor {
    /// Extracts function name from a call expression
    fn extract_function_name(&self, node: &ExprCall) -> Option<String> {
        if let Expr::Path(expr_path) = &*node.func {
            if let Some(segment) = expr_path.path.segments.last() {
                return Some(segment.ident.to_string());
            }
        }
        None
    }

    /// Extracts method name from a method call expression
    fn extract_method_name(&self, node: &ExprMethodCall) -> Option<String> {
        Some(node.method.to_string())
    }
}

impl<'ast> Visit<'ast> for CallGraphVisitor {
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        // Set context for this function
        self.current_function_name = Some(node.sig.ident.to_string());

        // Visit the function body
        visit::visit_item_fn(self, node);

        // Clear context
        self.current_function_name = None;
    }

    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let Some(ref caller_name) = self.current_function_name {
            if let Some(called_name) = self.extract_function_name(node) {
                self.call_graph
                    .entry(caller_name.clone())
                    .or_default()
                    .insert(called_name);
            }
        }
        visit::visit_expr_call(self, node);
    }

    fn visit_expr_method_call(&mut self, node: &'ast ExprMethodCall) {
        if let Some(ref caller_name) = self.current_function_name {
            if let Some(called_name) = self.extract_method_name(node) {
                self.call_graph
                    .entry(caller_name.clone())
                    .or_default()
                    .insert(called_name);
            }
        }
        visit::visit_expr_method_call(self, node);
    }
}

/// Performs DFS traversal to find all functions reachable from a starting function
fn find_reachable_functions(
    call_graph: &HashMap<String, HashSet<String>>,
    start_function: &str,
) -> HashSet<String> {
    let mut visited = HashSet::new();
    let mut stack = vec![start_function.to_string()];

    while let Some(current) = stack.pop() {
        if visited.insert(current.clone()) {
            if let Some(callees) = call_graph.get(&current) {
                for callee in callees {
                    if !visited.contains(callee) {
                        stack.push(callee.clone());
                    }
                }
            }
        }
    }

    visited
}

/// Checks if a function is an Anchor handler
fn is_anchor_handler(node: &ItemFn) -> bool {
    // Robust heuristic for an Anchor handler:
    // 1. It's public
    // 2. Its *first* argument is `Context<...>`
    matches!(node.vis, syn::Visibility::Public(_))
        && node.sig.inputs.len() > 0
        && is_context_arg(&node.sig.inputs[0])
}

/// Checks if an argument is the Anchor Context
fn is_context_arg(arg: &syn::FnArg) -> bool {
    if let syn::FnArg::Typed(pat_type) = arg {
        if let syn::Type::Path(type_path) = &*pat_type.ty {
            if let Some(segment) = type_path.path.segments.last() {
                return segment.ident == "Context";
            }
        }
    }
    false
}

/// Main driver function to run the two-pass analysis
pub fn calculate_workspace_arithmetic(
    workspace_path: &PathBuf,
    selected_files: &[String],
) -> Result<ArithmeticMetrics, Box<dyn std::error::Error>> {
    log::info!("🔍 ARITHMETIC DEBUG: Starting two-pass call graph analysis...");

    let mut math_finder = MathFinderVisitor::default();
    let mut call_graph_builder = CallGraphVisitor::default();
    let mut all_handlers = Vec::new();

    // Analyze each selected file
    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);
        if !full_path.exists() || !full_path.is_file() {
            continue;
        }

        match std::fs::read_to_string(&full_path) {
            Ok(content) => match parse_file(&content) {
                Ok(ast) => {
                    // Pass 1: Find all mathy functions
                    math_finder.visit_file(&ast);

                    // Pass 2: Build call graph
                    call_graph_builder.visit_file(&ast);

                    // Also collect all handlers for final analysis
                    for item in &ast.items {
                        if let syn::Item::Fn(func) = item {
                            if is_anchor_handler(func) {
                                all_handlers.push(func.sig.ident.to_string());
                            }
                        }
                    }
                }
                Err(e) => {
                    log::warn!("Failed to parse AST for {:?}: {}", full_path, e);
                }
            },
            Err(e) => {
                log::warn!("Failed to read file {:?}: {}", full_path, e);
            }
        }
    }

    // --- Pass 3: Call Graph Analysis ---
    let mut metrics = ArithmeticMetrics::default();
    metrics.total_handlers_found = all_handlers.len() as u32;

    for handler_name in &all_handlers {
        // Find all functions reachable from this handler
        let reachable_functions =
            find_reachable_functions(&call_graph_builder.call_graph, handler_name);

        let mut handler_has_math = false;
        let mut handler_high_risk_ops = 0;
        let mut handler_medium_risk_ops = 0;

        // Check if any reachable function contains math operations
        for func_name in &reachable_functions {
            if let Some((high_ops, medium_ops)) = math_finder.math_ops_by_function.get(func_name) {
                handler_has_math = true;
                handler_high_risk_ops += high_ops;
                handler_medium_risk_ops += medium_ops;
            }
        }

        if handler_has_math {
            metrics.total_math_handlers += 1;
            metrics.math_handlers.push(handler_name.clone());
            metrics.high_risk_ops_count += handler_high_risk_ops;
            metrics.medium_risk_ops_count += handler_medium_risk_ops;
        }
    }

    // Copy operation breakdown from math finder
    metrics.operation_breakdown = math_finder.operation_breakdown;

    // --- Final Calculation and Normalization (0-100) ---
    // 1. Calculate the Raw Score
    let raw_risk_score = (metrics.total_math_handlers as f64 * 10.0)
        + (metrics.high_risk_ops_count as f64 * 3.0)
        + (metrics.medium_risk_ops_count as f64 * 1.0);

    // 2. Normalize to 0-100
    let upper_bound = 50.0; // Our 100% risk cap
    let factor = (raw_risk_score / upper_bound) * 100.0;

    metrics.arithmetic_factor = factor.min(100.0); // Cap at 100
    metrics.raw_risk_score = raw_risk_score;

    log::info!(
        "🔍 ARITHMETIC DEBUG: Two-pass analysis complete. Found {} handlers, {} math handlers. Factor: {:.2}",
        metrics.total_handlers_found,
        metrics.total_math_handlers,
        metrics.arithmetic_factor
    );

    Ok(metrics)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_high_risk_operations() {
        let code = r#"
            // Mock Anchor types for testing
            struct Context<T> {
                _phantom: std::marker::PhantomData<T>,
            }
            
            struct RiskyHandler;
            
            type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

            pub fn risky_handler(ctx: Context<RiskyHandler>, amount: u64) -> Result<()> {
                let result = amount / 2;  // High risk: division
                let remainder = amount % 3;  // High risk: modulo
                Ok(())
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_high_risk.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_arithmetic(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should find 1 handler with 2 high-risk operations
        assert_eq!(result.total_handlers_found, 1);
        assert_eq!(result.total_math_handlers, 1);
        assert_eq!(result.high_risk_ops_count, 2);
        assert_eq!(result.medium_risk_ops_count, 0);
        assert!(result.arithmetic_factor > 0.0);
    }

    #[test]
    fn test_medium_risk_operations() {
        let code = r#"
            // Mock Anchor types for testing
            struct Context<T> {
                _phantom: std::marker::PhantomData<T>,
            }
            
            struct MediumHandler;
            
            type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

            pub fn medium_handler(ctx: Context<MediumHandler>, amount: u64) -> Result<()> {
                let result = amount * 2;  // Medium risk: multiplication
                Ok(())
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_medium_risk.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_arithmetic(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should find 1 handler with 1 medium-risk operation
        assert_eq!(result.total_handlers_found, 1);
        assert_eq!(result.total_math_handlers, 1);
        assert_eq!(result.high_risk_ops_count, 0);
        assert_eq!(result.medium_risk_ops_count, 1);
        assert!(result.arithmetic_factor > 0.0);
    }

    #[test]
    fn test_safe_operations_ignored() {
        let code = r#"
            // Mock Anchor types for testing
            struct Context<T> {
                _phantom: std::marker::PhantomData<T>,
            }
            
            struct SafeHandler;
            
            type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

            pub fn safe_handler(ctx: Context<SafeHandler>, amount: u64) -> Result<()> {
                let result = amount + 10;  // Low risk: addition (ignored)
                let diff = amount - 5;     // Low risk: subtraction (ignored)
                let shifted = amount << 2; // Low risk: bitwise (ignored)
                Ok(())
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_safe_ops.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_arithmetic(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should find 1 handler but NO math handlers (no high/medium risk ops)
        assert_eq!(result.total_handlers_found, 1);
        assert_eq!(result.total_math_handlers, 0);
        assert_eq!(result.high_risk_ops_count, 0);
        assert_eq!(result.medium_risk_ops_count, 0);
        assert_eq!(result.arithmetic_factor, 0.0);
    }

    #[test]
    fn test_non_handler_functions_ignored() {
        let code = r#"
            // Mock Anchor types for testing
            struct Context<T> {
                _phantom: std::marker::PhantomData<T>,
            }
            
            type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

            // This is NOT a handler (no Context parameter)
            pub fn utility_function(amount: u64) -> u64 {
                amount / 2  // High risk operation, but not in a handler
            }

            // This is NOT a handler (private function)
            fn private_function(amount: u64) -> u64 {
                amount * 3  // Medium risk operation, but not in a handler
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_non_handler.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_arithmetic(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should find NO handlers and NO math handlers
        assert_eq!(result.total_handlers_found, 0);
        assert_eq!(result.total_math_handlers, 0);
        assert_eq!(result.high_risk_ops_count, 0);
        assert_eq!(result.medium_risk_ops_count, 0);
        assert_eq!(result.arithmetic_factor, 0.0);
    }

    #[test]
    fn test_mixed_risk_operations() {
        let code = r#"
            // Mock Anchor types for testing
            struct Context<T> {
                _phantom: std::marker::PhantomData<T>,
            }
            
            struct MixedHandler;
            
            type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

            pub fn mixed_handler(ctx: Context<MixedHandler>, amount: u64) -> Result<()> {
                let result = amount * 2;    // Medium risk: multiplication
                let quotient = amount / 3;  // High risk: division
                let remainder = amount % 4; // High risk: modulo
                Ok(())
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_mixed_risk.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_arithmetic(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should find 1 handler with mixed risk operations
        assert_eq!(result.total_handlers_found, 1);
        assert_eq!(result.total_math_handlers, 1);
        assert_eq!(result.high_risk_ops_count, 2); // division + modulo
        assert_eq!(result.medium_risk_ops_count, 1); // multiplication
        assert!(result.arithmetic_factor > 0.0);
    }

    #[test]
    fn test_factor_calculation() {
        let code = r#"
            // Mock Anchor types for testing
            struct Context<T> {
                _phantom: std::marker::PhantomData<T>,
            }
            
            struct Handler1;
            struct Handler2;
            
            type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

            pub fn handler1(ctx: Context<Handler1>, amount: u64) -> Result<()> {
                let result = amount / 2;  // High risk
                Ok(())
            }

            pub fn handler2(ctx: Context<Handler2>, amount: u64) -> Result<()> {
                let result = amount * 3;  // Medium risk
                Ok(())
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_factor_calc.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_arithmetic(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should have a positive factor
        assert!(result.arithmetic_factor > 0.0);
        assert!(result.arithmetic_factor <= 100.0);

        // Should have raw risk score
        assert!(result.raw_risk_score > 0.0);

        // Should find both handlers
        assert_eq!(result.total_handlers_found, 2);
        assert_eq!(result.total_math_handlers, 2);
        assert_eq!(result.math_handlers.len(), 2);
    }

    #[test]
    fn test_delegated_arithmetic_risk() {
        let code = r#"
            // Mock Anchor types for testing
            struct Context<T> {
                _phantom: std::marker::PhantomData<T>,
            }
            
            struct Swap;
            struct Pool {
                pub x: u64,
                pub y: u64,
            }
            struct SwapResult {
                pub amount_out: u64,
                pub fee: u64,
            }
            
            type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
            
            const FEE_RATE: u64 = 3;
            const FEE_DENOM: u64 = 1000;

            pub fn swap(ctx: Context<Swap>, amount_in: u64) -> Result<()> {
                // Handler delegates to helper function
                let swap_result = internal::calculate_swap_amount(
                    &ctx.accounts.pool, 
                    amount_in
                )?;
                
                // Update accounts...
                Ok(())
            }

            mod internal {
                use super::*;
                
                pub fn calculate_swap_amount(pool: &Pool, amount_in: u64) -> Result<SwapResult> {
                    // All the risky math is here - delegated from handler
                    let fee = amount_in.checked_mul(FEE_RATE)?.checked_div(FEE_DENOM)?;
                    let amount_out = (pool.y * amount_in) / (pool.x + amount_in);
                    
                    Ok(SwapResult { amount_out, fee })
                }
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_delegated.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_arithmetic(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should find 1 handler that delegates to mathy function
        assert_eq!(result.total_handlers_found, 1);
        assert_eq!(result.total_math_handlers, 1);
        assert_eq!(result.math_handlers.len(), 1);
        assert_eq!(result.math_handlers[0], "swap");

        // Should detect the delegated arithmetic operations
        assert!(result.high_risk_ops_count > 0); // Division operations
        assert!(result.medium_risk_ops_count > 0); // Multiplication operations
        assert!(result.arithmetic_factor > 0.0);
    }

    #[test]
    fn test_deep_delegation_chain() {
        let code = r#"
            // Mock Anchor types for testing
            struct Context<T> {
                _phantom: std::marker::PhantomData<T>,
            }
            
            struct ComplexHandler;
            
            type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

            pub fn complex_handler(ctx: Context<ComplexHandler>, amount: u64) -> Result<()> {
                // Handler calls level1, which calls level2, which has the math
                let result = level1::process_amount(amount)?;
                Ok(())
            }

            mod level1 {
                use super::*;
                
                pub fn process_amount(amount: u64) -> Result<u64> {
                    // Calls level2
                    level2::calculate_result(amount)
                }
            }

            mod level2 {
                use super::*;
                
                pub fn calculate_result(amount: u64) -> Result<u64> {
                    // Deep delegation - math is 2 levels deep
                    let result = amount / 2;  // High risk
                    let final_result = result * 3;  // Medium risk
                    Ok(final_result)
                }
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_deep_delegation.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_arithmetic(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should find 1 handler that reaches math through delegation chain
        assert_eq!(result.total_handlers_found, 1);
        assert_eq!(result.total_math_handlers, 1);
        assert_eq!(result.math_handlers.len(), 1);
        assert_eq!(result.math_handlers[0], "complex_handler");

        // Should detect the deep delegated arithmetic operations
        assert!(result.high_risk_ops_count > 0); // Division operation
        assert!(result.medium_risk_ops_count > 0); // Multiplication operation
        assert!(result.arithmetic_factor > 0.0);
    }

    #[test]
    fn test_refactoring_immunity() {
        let code = r#"
            // Mock Anchor types for testing
            struct Context<T> {
                _phantom: std::marker::PhantomData<T>,
            }
            
            struct InlineHandler;
            struct DelegatedHandler;
            
            type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

            // Version 1: Inline arithmetic
            pub fn inline_handler(ctx: Context<InlineHandler>, amount: u64) -> Result<()> {
                let result = amount / 2;  // High risk inline
                Ok(())
            }

            // Version 2: Delegated arithmetic (same logic, different structure)
            pub fn delegated_handler(ctx: Context<DelegatedHandler>, amount: u64) -> Result<()> {
                let result = helper::divide_by_two(amount)?;
                Ok(())
            }

            mod helper {
                use super::*;
                
                pub fn divide_by_two(amount: u64) -> Result<u64> {
                    Ok(amount / 2)  // Same high risk operation, but delegated
                }
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_refactoring.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_arithmetic(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Both handlers should be detected as math handlers
        assert_eq!(result.total_handlers_found, 2);
        assert_eq!(result.total_math_handlers, 2);
        assert_eq!(result.math_handlers.len(), 2);

        // Both should have the same risk score (refactoring immunity)
        assert!(result.high_risk_ops_count >= 2); // At least 2 division operations
        assert!(result.arithmetic_factor > 0.0);
    }
}
