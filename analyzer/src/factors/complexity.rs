//! Enhanced cyclomatic complexity calculation using syn
//!
//! This module provides functions to calculate cyclomatic complexity metrics
//! for Rust source files using syn AST parsing, with special focus on
//! Solana/Anchor smart contract patterns.

use std::path::PathBuf;
use syn::{visit::Visit, Expr, File, ImplItemFn, Item, ItemFn, Meta, MetaList, Stmt, Visibility};

#[derive(Debug, Clone)]
pub struct ComplexityMetrics {
    pub avg_complexity: f64,
    pub max_complexity: u32,
    pub total_functions: usize,
    pub avg_cognitive_complexity: f64,
    pub max_cognitive_complexity: u32,
    pub anchor_instruction_handlers: usize,
    pub avg_anchor_constraint_complexity: f64,
    pub max_anchor_constraint_complexity: u32,
}

impl ComplexityMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "avgCyclomaticComplexity": self.avg_complexity,
            "maxCyclomaticComplexity": self.max_complexity,
            "totalFunctions": self.total_functions,
            "avgCognitiveComplexity": self.avg_cognitive_complexity,
            "maxCognitiveComplexity": self.max_cognitive_complexity,
            "anchorInstructionHandlers": self.anchor_instruction_handlers,
            "avgAnchorConstraintComplexity": self.avg_anchor_constraint_complexity,
            "maxAnchorConstraintComplexity": self.max_anchor_constraint_complexity
        })
    }
}

/// Calculate cyclomatic complexity for workspace files
pub fn calculate_workspace_cyclomatic_complexity(
    workspace_path: &PathBuf,
    selected_files: &[String],
) -> Result<ComplexityMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "Calculating cyclomatic complexity for {} files in workspace: {:?}",
        selected_files.len(),
        workspace_path
    );

    let mut total_functions = 0;
    let mut complexity_sum = 0;
    let mut max_complexity = 0;
    let mut cognitive_complexity_sum = 0;
    let mut max_cognitive_complexity = 0;
    let mut anchor_instruction_handlers = 0;
    let mut anchor_constraint_complexity_sum = 0;
    let mut max_anchor_constraint_complexity = 0;
    let mut analyzed_files = 0;

    for file_path in selected_files {
        let full_file_path = workspace_path.join(file_path);

        // Check if the file exists and is a Rust file
        if full_file_path.exists() && full_file_path.is_file() {
            if let Some(extension) = full_file_path.extension() {
                if extension == "rs" {
                    match std::fs::read_to_string(&full_file_path) {
                        Ok(content) => {
                            match analyze_file_complexity(&content) {
                                Ok(file_metrics) => {
                                    total_functions += file_metrics.total_functions;
                                    complexity_sum += (file_metrics.avg_complexity
                                        * file_metrics.total_functions as f64)
                                        as u32;
                                    max_complexity =
                                        max_complexity.max(file_metrics.max_complexity);
                                    cognitive_complexity_sum += (file_metrics
                                        .avg_cognitive_complexity
                                        * file_metrics.total_functions as f64)
                                        as u32;
                                    max_cognitive_complexity = max_cognitive_complexity
                                        .max(file_metrics.max_cognitive_complexity);
                                    anchor_instruction_handlers +=
                                        file_metrics.anchor_instruction_handlers;
                                    anchor_constraint_complexity_sum += (file_metrics
                                        .avg_anchor_constraint_complexity
                                        * file_metrics.anchor_instruction_handlers as f64)
                                        as u32;
                                    max_anchor_constraint_complexity =
                                        max_anchor_constraint_complexity
                                            .max(file_metrics.max_anchor_constraint_complexity);
                                    analyzed_files += 1;

                                    log::debug!(
                                        "File {}: {} functions, avg complexity: {:.2}, max complexity: {}",
                                        file_path,
                                        file_metrics.total_functions,
                                        file_metrics.avg_complexity,
                                        file_metrics.max_complexity
                                    );
                                }
                                Err(e) => {
                                    log::warn!(
                                        "Failed to analyze complexity for file {}: {}",
                                        file_path,
                                        e
                                    );
                                    // Continue with other files instead of failing completely
                                }
                            }
                        }
                        Err(e) => {
                            log::warn!("Failed to read file {}: {}", file_path, e);
                            // Continue with other files
                        }
                    }
                }
            }
        }
    }

    if analyzed_files == 0 {
        return Err("No files were successfully analyzed for cyclomatic complexity".into());
    }

    let avg_complexity = if total_functions > 0 {
        complexity_sum as f64 / total_functions as f64
    } else {
        0.0
    };

    let avg_cognitive_complexity = if total_functions > 0 {
        cognitive_complexity_sum as f64 / total_functions as f64
    } else {
        0.0
    };

    let avg_anchor_constraint_complexity = if anchor_instruction_handlers > 0 {
        anchor_constraint_complexity_sum as f64 / anchor_instruction_handlers as f64
    } else {
        0.0
    };

    let result = ComplexityMetrics {
        avg_complexity,
        max_complexity,
        total_functions,
        avg_cognitive_complexity,
        max_cognitive_complexity,
        anchor_instruction_handlers,
        avg_anchor_constraint_complexity,
        max_anchor_constraint_complexity,
    };

    log::info!(
        "Cyclomatic complexity analysis complete: {} files analyzed, {} total functions, avg complexity: {:.2}, max complexity: {}",
        analyzed_files,
        total_functions,
        avg_complexity,
        max_complexity
    );

    Ok(result)
}

/// Analyze cyclomatic complexity for a single file
fn analyze_file_complexity(content: &str) -> Result<ComplexityMetrics, Box<dyn std::error::Error>> {
    // Parse the Rust file using syn
    let syntax_tree: File =
        syn::parse_file(content).map_err(|e| format!("Failed to parse Rust file: {}", e))?;

    let mut complexity_visitor = ComplexityVisitor::new();
    complexity_visitor.visit_file(&syntax_tree);

    let function_count = complexity_visitor.function_complexities.len();
    let max_complexity = complexity_visitor
        .function_complexities
        .iter()
        .max()
        .copied()
        .unwrap_or(0);

    let max_cognitive_complexity = complexity_visitor
        .cognitive_complexities
        .iter()
        .max()
        .copied()
        .unwrap_or(0);

    let anchor_instruction_handlers = complexity_visitor.anchor_instruction_handlers;
    let max_anchor_constraint_complexity = complexity_visitor
        .anchor_constraint_complexities
        .iter()
        .max()
        .copied()
        .unwrap_or(0);

    let avg_complexity = if function_count > 0 {
        complexity_visitor.function_complexities.iter().sum::<u32>() as f64 / function_count as f64
    } else {
        0.0
    };

    let avg_cognitive_complexity = if function_count > 0 {
        complexity_visitor
            .cognitive_complexities
            .iter()
            .sum::<u32>() as f64
            / function_count as f64
    } else {
        0.0
    };

    let avg_anchor_constraint_complexity = if anchor_instruction_handlers > 0 {
        complexity_visitor
            .anchor_constraint_complexities
            .iter()
            .sum::<u32>() as f64
            / anchor_instruction_handlers as f64
    } else {
        0.0
    };

    Ok(ComplexityMetrics {
        avg_complexity,
        max_complexity,
        total_functions: function_count,
        avg_cognitive_complexity,
        max_cognitive_complexity,
        anchor_instruction_handlers,
        avg_anchor_constraint_complexity,
        max_anchor_constraint_complexity,
    })
}

/// Enhanced visitor to calculate cyclomatic complexity for functions
struct ComplexityVisitor {
    function_complexities: Vec<u32>,
    cognitive_complexities: Vec<u32>,
    anchor_constraint_complexities: Vec<u32>,
    current_complexity: u32,
    current_cognitive_complexity: u32,
    current_nesting_depth: u32,
    max_nesting_depth: u32,
    anchor_instruction_handlers: usize,
    current_anchor_constraint_complexity: u32,
}

impl ComplexityVisitor {
    fn new() -> Self {
        Self {
            function_complexities: Vec::new(),
            cognitive_complexities: Vec::new(),
            anchor_constraint_complexities: Vec::new(),
            current_complexity: 0,
            current_cognitive_complexity: 0,
            current_nesting_depth: 0,
            max_nesting_depth: 0,
            anchor_instruction_handlers: 0,
            current_anchor_constraint_complexity: 0,
        }
    }

    /// Check if a function is an Anchor instruction handler
    fn is_anchor_instruction_handler(&self, item_fn: &ItemFn) -> bool {
        // Check if function is public (instruction handlers are typically public)
        if !matches!(item_fn.vis, Visibility::Public(_)) {
            return false;
        }

        // Check for Anchor-specific attributes
        for attr in &item_fn.attrs {
            if let Ok(meta) = attr.parse_args::<Meta>() {
                if let Meta::Path(path) = meta {
                    if path.is_ident("instruction") || path.is_ident("handler") {
                        return true;
                    }
                }
            }
        }

        // Check function name patterns common in Anchor programs
        let name = item_fn.sig.ident.to_string();
        // Common Anchor instruction patterns
        if name.ends_with("_handler")
            || name.starts_with("initialize")
            || name.starts_with("update")
            || name.starts_with("transfer")
            || name.starts_with("swap")
            || name.starts_with("deposit")
            || name.starts_with("withdraw")
        {
            return true;
        }

        // Check if function takes a Context parameter (common in Anchor)
        if self.has_context_parameter(&item_fn.sig) {
            return true;
        }

        false
    }

    /// Analyze Anchor account constraints for complexity
    fn analyze_anchor_constraints(&mut self, item_fn: &ItemFn) {
        let mut constraint_count = 0;

        // Look for #[derive(Accounts)] structs in the function's context
        // This is a simplified analysis - in practice, you'd need to track
        // the relationship between instruction handlers and their account structs
        for attr in &item_fn.attrs {
            if let Ok(meta) = attr.parse_args::<Meta>() {
                if let Meta::List(meta_list) = meta {
                    if meta_list.path.is_ident("account") {
                        // Count constraints within #[account(...)] attributes
                        constraint_count += self.count_constraints_in_meta_list(&meta_list);
                    }
                }
            }
        }

        self.current_anchor_constraint_complexity = constraint_count;
    }

    /// Count constraints within a meta list (simplified)
    fn count_constraints_in_meta_list(&self, _meta_list: &MetaList) -> u32 {
        // Simplified constraint counting - in a real implementation,
        // you'd parse the tokens within the meta list to count actual constraints
        // For now, we'll return a basic count based on the presence of account attributes
        1
    }

    /// Check if an impl method is an Anchor instruction handler
    fn is_anchor_instruction_handler_method(&self, item_fn: &ImplItemFn) -> bool {
        // Check if method is public (instruction handlers are typically public)
        if !matches!(item_fn.vis, Visibility::Public(_)) {
            return false;
        }

        // Check for Anchor-specific attributes
        for attr in &item_fn.attrs {
            if let Ok(meta) = attr.parse_args::<Meta>() {
                if let Meta::Path(path) = meta {
                    if path.is_ident("instruction") || path.is_ident("handler") {
                        return true;
                    }
                }
            }
        }

        // Check method name patterns common in Anchor programs
        let name = item_fn.sig.ident.to_string();
        // Common Anchor instruction patterns for methods
        if name.ends_with("_handler")
            || name.starts_with("initialize")
            || name.starts_with("update")
            || name.starts_with("transfer")
            || name.starts_with("swap")
            || name.starts_with("deposit")
            || name.starts_with("withdraw")
            || name == "validate" // Common validation method
            || name == "execute"
        // Common execution method
        {
            return true;
        }

        // Check if method takes a Context parameter (common in Anchor)
        if self.has_context_parameter(&item_fn.sig) {
            return true;
        }

        false
    }

    /// Analyze Anchor account constraints for impl methods
    fn analyze_anchor_constraints_method(&mut self, item_fn: &ImplItemFn) {
        let mut constraint_count = 0;

        // Look for #[derive(Accounts)] structs in the method's context
        for attr in &item_fn.attrs {
            if let Ok(meta) = attr.parse_args::<Meta>() {
                if let Meta::List(meta_list) = meta {
                    if meta_list.path.is_ident("account") {
                        // Count constraints within #[account(...)] attributes
                        constraint_count += self.count_constraints_in_meta_list(&meta_list);
                    }
                }
            }
        }

        self.current_anchor_constraint_complexity = constraint_count;
    }

    /// Check if a function signature has a Context parameter (Anchor pattern)
    fn has_context_parameter(&self, sig: &syn::Signature) -> bool {
        for input in &sig.inputs {
            if let syn::FnArg::Typed(pat_type) = input {
                if let syn::Type::Path(type_path) = &*pat_type.ty {
                    if let Some(segment) = type_path.path.segments.last() {
                        if segment.ident.to_string().starts_with("Context") {
                            return true;
                        }
                    }
                }
            }
        }
        false
    }
}

impl<'ast> Visit<'ast> for ComplexityVisitor {
    fn visit_item(&mut self, item: &'ast Item) {
        match item {
            Item::Fn(item_fn) => {
                // Start new function analysis
                self.current_complexity = 1; // Base complexity
                self.current_cognitive_complexity = 0;
                self.current_nesting_depth = 0;
                self.max_nesting_depth = 0;
                self.current_anchor_constraint_complexity = 0;

                // Check if this is an Anchor instruction handler
                let is_anchor_handler = self.is_anchor_instruction_handler(item_fn);
                if is_anchor_handler {
                    self.anchor_instruction_handlers += 1;
                    self.analyze_anchor_constraints(item_fn);
                }

                self.visit_item_fn(item_fn);

                // Store function metrics
                self.function_complexities.push(self.current_complexity);
                self.cognitive_complexities.push(self.max_nesting_depth);

                if is_anchor_handler {
                    self.anchor_constraint_complexities
                        .push(self.current_anchor_constraint_complexity);
                }
            }
            _ => {
                // Continue visiting other items
                syn::visit::visit_item(self, item);
            }
        }
    }

    fn visit_expr(&mut self, expr: &'ast Expr) {
        match expr {
            // Control flow constructs that increase complexity
            Expr::If(if_expr) => {
                self.current_complexity += 1;
                self.current_nesting_depth += 1;
                self.max_nesting_depth = self.max_nesting_depth.max(self.current_nesting_depth);

                // Visit the if condition and then block
                self.visit_expr(&if_expr.cond);
                self.visit_block(&if_expr.then_branch);

                // Handle else block if present
                if let Some(else_expr) = &if_expr.else_branch {
                    self.visit_expr(&else_expr.1);
                }

                self.current_nesting_depth -= 1;
                return; // Don't call visit_expr again to avoid double counting
            }
            Expr::While(while_expr) => {
                self.current_complexity += 1;
                self.current_nesting_depth += 1;
                self.max_nesting_depth = self.max_nesting_depth.max(self.current_nesting_depth);

                self.visit_expr(&while_expr.cond);
                self.visit_block(&while_expr.body);

                self.current_nesting_depth -= 1;
                return;
            }
            Expr::ForLoop(for_loop) => {
                self.current_complexity += 1;
                self.current_nesting_depth += 1;
                self.max_nesting_depth = self.max_nesting_depth.max(self.current_nesting_depth);

                self.visit_pat(&for_loop.pat);
                self.visit_expr(&for_loop.expr);
                self.visit_block(&for_loop.body);

                self.current_nesting_depth -= 1;
                return;
            }
            Expr::Loop(loop_expr) => {
                self.current_complexity += 1;
                self.current_nesting_depth += 1;
                self.max_nesting_depth = self.max_nesting_depth.max(self.current_nesting_depth);

                self.visit_block(&loop_expr.body);

                self.current_nesting_depth -= 1;
                return;
            }
            Expr::Match(match_expr) => {
                // CORRECTED: A match with N arms adds N-1 complexity (N paths, N-1 decision points)
                let num_arms = match_expr.arms.len() as u32;
                if num_arms > 0 {
                    self.current_complexity += num_arms - 1;
                }

                self.current_nesting_depth += 1;
                self.max_nesting_depth = self.max_nesting_depth.max(self.current_nesting_depth);

                self.visit_expr(&match_expr.expr);
                for arm in &match_expr.arms {
                    // Count match guards as additional decision points
                    if let Some(guard) = &arm.guard {
                        self.current_complexity += 1;
                        self.visit_expr(&guard.1);
                    }
                    self.visit_pat(&arm.pat);
                    self.visit_expr(&arm.body);
                }

                self.current_nesting_depth -= 1;
                return;
            }
            // Note: IfLet and WhileLet are handled as regular expressions in syn 2.0
            // They will be caught by the general visit_expr call at the end
            Expr::Binary(binary_expr) => {
                // Logical operators add complexity
                match binary_expr.op {
                    syn::BinOp::And(_) | syn::BinOp::Or(_) => {
                        self.current_complexity += 1;
                    }
                    _ => {}
                }
            }
            Expr::Try(_) => {
                // ? operator adds complexity
                self.current_complexity += 1;
            }
            _ => {}
        }

        // Continue visiting nested expressions
        syn::visit::visit_expr(self, expr);
    }

    fn visit_stmt(&mut self, stmt: &'ast Stmt) {
        match stmt {
            Stmt::Expr(expr, _) => {
                // Handle expressions in statements
                self.visit_expr(expr);
            }
            _ => {
                // Continue visiting other statements
                syn::visit::visit_stmt(self, stmt);
            }
        }
    }

    /// Handle methods inside impl blocks - this was the missing piece!
    fn visit_impl_item_fn(&mut self, item_fn: &'ast ImplItemFn) {
        // Start new method analysis
        self.current_complexity = 1; // Base complexity
        self.current_cognitive_complexity = 0;
        self.current_nesting_depth = 0;
        self.max_nesting_depth = 0;
        self.current_anchor_constraint_complexity = 0;

        // Check if this is an Anchor instruction handler (methods can be handlers too)
        let is_anchor_handler = self.is_anchor_instruction_handler_method(item_fn);
        if is_anchor_handler {
            self.anchor_instruction_handlers += 1;
            self.analyze_anchor_constraints_method(item_fn);
        }

        // Visit the method body to calculate complexity
        self.visit_block(&item_fn.block);

        // Store method metrics
        self.function_complexities.push(self.current_complexity);
        self.cognitive_complexities.push(self.max_nesting_depth);

        if is_anchor_handler {
            self.anchor_constraint_complexities
                .push(self.current_anchor_constraint_complexity);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_function_complexity() {
        let code = r#"
            fn simple_function() {
                println!("Hello, world!");
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 1);
        assert_eq!(result.max_complexity, 1); // Simple function should have complexity 1
        assert_eq!(result.avg_complexity, 1.0);
    }

    #[test]
    fn test_complex_function_complexity() {
        let code = r#"
            fn complex_function(x: i32) -> i32 {
                if x > 0 {
                    if x > 10 {
                        return x * 2;
                    } else {
                        return x + 1;
                    }
                } else if x < 0 {
                    return x - 1;
                } else {
                    return 0;
                }
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 1);
        assert!(result.max_complexity > 1); // Should have higher complexity due to multiple branches
        assert!(result.avg_complexity > 1.0);
    }

    #[test]
    fn test_match_expression_complexity() {
        let code = r#"
            fn match_function(x: Option<i32>) -> i32 {
                match x {
                    Some(val) => val,
                    None => 0,
                }
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 1);
        assert_eq!(result.max_complexity, 2); // 1 base + (2 arms - 1) = 2
    }

    #[test]
    fn test_match_with_three_arms_complexity() {
        let code = r#"
            fn match_three_arms(x: i32) -> i32 {
                match x {
                    1 => 10,
                    2 => 20,
                    _ => 0,
                }
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 1);
        assert_eq!(result.max_complexity, 3); // 1 base + (3 arms - 1) = 3
    }

    #[test]
    fn test_match_with_guards_complexity() {
        let code = r#"
            fn match_with_guards(x: i32) -> i32 {
                match x {
                    n if n > 10 => n * 2,
                    n if n > 5 => n + 1,
                    _ => 0,
                }
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 1);
        assert_eq!(result.max_complexity, 5); // 1 base + (3 arms - 1) + 2 guards = 5
    }

    #[test]
    fn test_cognitive_complexity_nesting() {
        let code = r#"
            fn nested_function(x: i32, y: i32) -> i32 {
                if x > 0 {
                    if y > 0 {
                        if x > y {
                            return x;
                        } else {
                            return y;
                        }
                    } else {
                        return 0;
                    }
                } else {
                    return -1;
                }
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 1);
        assert_eq!(result.max_complexity, 4); // 1 base + 3 if statements = 4
        assert_eq!(result.max_cognitive_complexity, 3); // Maximum nesting depth
    }

    #[test]
    fn test_anchor_instruction_handler_detection() {
        let code = r#"
            pub fn initialize_handler(ctx: Context<Initialize>) -> Result<()> {
                // This should be detected as an Anchor instruction handler
                Ok(())
            }

            fn helper_function() {
                // This should not be detected as an instruction handler
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 2);
        assert_eq!(result.anchor_instruction_handlers, 1);
    }

    #[test]
    fn test_multiple_functions() {
        let code = r#"
            fn simple() {
                println!("simple");
            }

            fn complex(x: i32) -> i32 {
                if x > 0 {
                    x + 1
                } else {
                    x - 1
                }
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 2);
        assert_eq!(result.max_complexity, 2); // complex function has complexity 2
        assert_eq!(result.avg_complexity, 1.5); // (1 + 2) / 2 = 1.5
    }

    #[test]
    fn test_impl_block_methods() {
        let code = r#"
            struct MyStruct;

            impl MyStruct {
                pub fn simple_method(&self) {
                    println!("simple");
                }

                pub fn complex_method(&self, x: i32) -> i32 {
                    if x > 0 {
                        if x > 10 {
                            x * 2
                        } else {
                            x + 1
                        }
                    } else {
                        x - 1
                    }
                }

                fn private_method(&self) -> bool {
                    true
                }
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 3); // All three methods should be counted
        assert_eq!(result.max_complexity, 3); // complex_method has complexity 3 (1 base + 2 if statements - the nested if doesn't add extra complexity)
        assert!(result.avg_complexity > 1.0); // Should be higher due to complex method
    }

    #[test]
    fn test_anchor_impl_methods() {
        let code = r#"
            use anchor_lang::prelude::*;

            #[derive(Accounts)]
            pub struct Initialize {}

            impl Initialize {
                pub fn validate(&self) -> bool {
                    if self.check_condition() {
                        true
                    } else {
                        false
                    }
                }

                pub fn execute(&self, ctx: Context<Initialize>) -> Result<()> {
                    match self.validate() {
                        true => Ok(()),
                        false => Err(ProgramError::InvalidAccountData.into()),
                    }
                }

                fn check_condition(&self) -> bool {
                    true
                }
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 3); // validate, execute, check_condition
        assert_eq!(result.anchor_instruction_handlers, 2); // validate and execute should be detected
        assert_eq!(result.max_complexity, 2); // Should have complexity from if/match statements (max is 2)
    }

    #[test]
    fn test_mixed_functions_and_impl_methods() {
        let code = r#"
            fn free_function() {
                println!("free function");
            }

            struct MyStruct;

            impl MyStruct {
                pub fn method1(&self) {
                    if true {
                        println!("method1");
                    }
                }

                fn method2(&self) -> i32 {
                    42
                }
            }

            fn another_free_function(x: i32) -> i32 {
                match x {
                    1 => 10,
                    2 => 20,
                    _ => 0,
                }
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 4); // 2 free functions + 2 methods
        assert_eq!(result.max_complexity, 3); // match expression: 1 base + (3 arms - 1) = 3
        assert!(result.avg_complexity > 1.0); // Should include complexity from if and match
    }

    #[test]
    fn test_context_parameter_detection() {
        let code = r#"
            use anchor_lang::prelude::*;

            #[derive(Accounts)]
            pub struct MyContext {}

            pub fn anchor_handler(ctx: Context<MyContext>) -> Result<()> {
                Ok(())
            }

            impl MyContext {
                pub fn validate(&self, ctx: Context<MyContext>) -> bool {
                    true
                }
            }
        "#;

        let result = analyze_file_complexity(code).unwrap();
        assert_eq!(result.total_functions, 2); // anchor_handler + validate
        assert_eq!(result.anchor_instruction_handlers, 2); // Both should be detected due to Context parameter
    }
}
