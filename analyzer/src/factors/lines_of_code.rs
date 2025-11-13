//! Total Statement Count (TSC) Analysis Factor
//!
//! This module provides AST-based functionality to count Total Statement Count (TSC)
//! in Rust files by analyzing all syn::Stmt nodes within functions.
//!
//! This approach is superior to Source Lines of Code (SLOC) because:
//! - It's 100% AST-based and robust against formatting/whitespace
//! - It cannot be gamed with empty lines or comment manipulation
//! - It provides a more accurate measure of "work being done"
//! - It's consistent with other AST-based factors (CC, AC, etc.)

use std::collections::HashMap;
use std::path::PathBuf;
use syn::{visit::Visit, Block, ImplItemFn, ItemFn, Stmt};

#[derive(Debug, Clone, Default)]
pub struct TscMetrics {
    /// Total Statement Count across all functions
    pub total_statements: usize,

    /// Number of functions analyzed
    pub total_functions: usize,

    /// Average statements per function
    pub avg_statements_per_function: f64,

    /// Maximum statements in a single function
    pub max_statements_per_function: usize,

    /// Statement count distribution by function
    pub function_statement_counts: HashMap<String, usize>,

    /// LOC Factor (0-100) based on total statements
    /// 0 = 500 LOC or less, 100 = 10,000 LOC or more
    pub loc_factor: f64,
}

impl TscMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalStatements": self.total_statements,
            "totalFunctions": self.total_functions,
            "avgStatementsPerFunction": self.avg_statements_per_function,
            "maxStatementsPerFunction": self.max_statements_per_function,
            "functionStatementCounts": self.function_statement_counts,
            "locFactor": self.loc_factor,
        })
    }

    /// Calculate LOC Factor based on total statements
    /// 0 = 500 LOC or less, 100 = 10,000 LOC or more
    /// Linear mapping between 500 and 10,000
    fn calculate_loc_factor(total_statements: usize) -> f64 {
        if total_statements <= 500 {
            return 0.0;
        }
        if total_statements >= 10000 {
            return 100.0;
        }
        // Linear mapping between 500 and 10,000
        let factor = ((total_statements - 500) as f64 / (10000 - 500) as f64) * 100.0;
        (factor * 100.0).round() / 100.0 // Round to 2 decimal places
    }
}

/// Calculate Total Statement Count for workspace files
pub fn calculate_workspace_tsc(
    workspace_path: &PathBuf,
    selected_files: &[String],
) -> Result<TscMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 TSC DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );
    log::info!("🔍 TSC DEBUG: Analyzing {} files", selected_files.len());

    let mut metrics = TscMetrics::default();
    let mut analyzed_files = 0;

    // Analyze each file
    for file_path in selected_files {
        let full_file_path = workspace_path.join(file_path);

        if full_file_path.exists() && full_file_path.is_file() {
            if let Some(extension) = full_file_path.extension() {
                if extension == "rs" {
                    match std::fs::read_to_string(&full_file_path) {
                        Ok(content) => {
                            match analyze_file_tsc(&content) {
                                Ok(file_metrics) => {
                                    // Merge metrics from this file
                                    metrics.total_statements += file_metrics.total_statements;
                                    metrics.total_functions += file_metrics.total_functions;

                                    // Update max statements
                                    if file_metrics.max_statements_per_function
                                        > metrics.max_statements_per_function
                                    {
                                        metrics.max_statements_per_function =
                                            file_metrics.max_statements_per_function;
                                    }

                                    // Merge function statement counts
                                    for (func_name, count) in file_metrics.function_statement_counts
                                    {
                                        metrics.function_statement_counts.insert(func_name, count);
                                    }

                                    analyzed_files += 1;

                                    log::debug!(
                                        "🔍 TSC DEBUG: File {}: {} statements, {} functions",
                                        file_path,
                                        file_metrics.total_statements,
                                        file_metrics.total_functions
                                    );
                                }
                                Err(e) => {
                                    log::warn!(
                                        "🔍 TSC DEBUG: Failed to analyze TSC for file {}: {}",
                                        file_path,
                                        e
                                    );
                                }
                            }
                        }
                        Err(e) => {
                            log::warn!("🔍 TSC DEBUG: Failed to read file {}: {}", file_path, e);
                        }
                    }
                }
            }
        }
    }

    // Calculate average statements per function
    if metrics.total_functions > 0 {
        metrics.avg_statements_per_function =
            metrics.total_statements as f64 / metrics.total_functions as f64;
    }

    // Calculate LOC Factor
    metrics.loc_factor = TscMetrics::calculate_loc_factor(metrics.total_statements);

    log::info!(
        "🔍 TSC DEBUG: Analysis complete: {} files analyzed, {} total statements, {} total functions, avg: {:.2} statements/function, LOC factor: {:.2}",
        analyzed_files,
        metrics.total_statements,
        metrics.total_functions,
        metrics.avg_statements_per_function,
        metrics.loc_factor
    );

    Ok(metrics)
}

/// Analyze Total Statement Count in a single file
pub fn analyze_file_tsc(content: &str) -> Result<TscMetrics, Box<dyn std::error::Error>> {
    // Parse the Rust file using syn
    // TODO: don't pass content, pass the file path instead.
    let syntax_tree: syn::File =
        syn::parse_file(content).map_err(|e| format!("Failed to parse Rust file: {}", e))?;

    let mut visitor = TscVisitor::new();
    visitor.visit_file(&syntax_tree);

    // Calculate average statements per function
    if visitor.metrics.total_functions > 0 {
        visitor.metrics.avg_statements_per_function =
            visitor.metrics.total_statements as f64 / visitor.metrics.total_functions as f64;
    }

    // Calculate LOC Factor
    visitor.metrics.loc_factor = TscMetrics::calculate_loc_factor(visitor.metrics.total_statements);

    Ok(visitor.metrics)
}

/// Visitor to analyze Total Statement Count using full AST approach
struct TscVisitor {
    metrics: TscMetrics,
    current_function: Option<String>,
    current_function_statement_count: usize,
}

impl TscVisitor {
    fn new() -> Self {
        Self {
            metrics: TscMetrics::default(),
            current_function: None,
            current_function_statement_count: 0,
        }
    }
}

impl<'ast> Visit<'ast> for TscVisitor {
    fn visit_item_fn(&mut self, item_fn: &'ast ItemFn) {
        // Get function name
        let func_name = item_fn.sig.ident.to_string();

        println!("🔍 TSC DEBUG: Found function '{}'", func_name);

        // Set current function context
        self.current_function = Some(func_name.clone());
        self.current_function_statement_count = 0;

        // *** THE FIX: Call the default visitor to recursively visit all nodes ***
        // This will automatically call `visit_stmt` for every statement.
        syn::visit::visit_item_fn(self, item_fn);

        // Update metrics with the count for this function
        self.metrics.total_statements += self.current_function_statement_count;
        self.metrics.total_functions += 1;
        self.metrics
            .function_statement_counts
            .insert(func_name.clone(), self.current_function_statement_count);

        // Update max statements
        if self.current_function_statement_count > self.metrics.max_statements_per_function {
            self.metrics.max_statements_per_function = self.current_function_statement_count;
        }

        log::debug!(
            "🔍 TSC DEBUG: Function '{}' has {} statements",
            func_name,
            self.current_function_statement_count
        );

        // Clear function context
        self.current_function = None;
        self.current_function_statement_count = 0;
    }

    fn visit_stmt(&mut self, stmt: &'ast Stmt) {
        // Only count statements if we're inside a function
        if self.current_function.is_some() {
            self.current_function_statement_count += 1;
            println!(
                "🔍 TSC DEBUG: Found statement in function '{}': {:?}",
                self.current_function.as_ref().unwrap(),
                stmt
            );
        }

        // Continue visiting nested statements
        syn::visit::visit_stmt(self, stmt);
    }

    fn visit_impl_item_fn(&mut self, item_fn: &'ast ImplItemFn) {
        // Get function name
        let func_name = item_fn.sig.ident.to_string();

        // Set current function context
        self.current_function = Some(func_name.clone());
        self.current_function_statement_count = 0;

        // *** THE FIX: Call the default visitor to recursively visit all nodes ***
        syn::visit::visit_impl_item_fn(self, item_fn);

        // Update metrics with the count for this function
        self.metrics.total_statements += self.current_function_statement_count;
        self.metrics.total_functions += 1;
        self.metrics
            .function_statement_counts
            .insert(func_name.clone(), self.current_function_statement_count);

        // Update max statements
        if self.current_function_statement_count > self.metrics.max_statements_per_function {
            self.metrics.max_statements_per_function = self.current_function_statement_count;
        }

        log::debug!(
            "🔍 TSC DEBUG: Method '{}' has {} statements",
            func_name,
            self.current_function_statement_count
        );

        // Clear function context
        self.current_function = None;
        self.current_function_statement_count = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_content() {
        let result = analyze_file_tsc("").unwrap();
        assert_eq!(result.total_statements, 0);
        assert_eq!(result.total_functions, 0);
    }

    #[test]
    fn test_simple_function() {
        let content = r#"
fn main() {
    let x = 5;
    let y = 10;
    println!("Hello, world!");
}
        "#;
        let result = analyze_file_tsc(content).unwrap();
        assert_eq!(result.total_statements, 3); // 3 statements in main
        assert_eq!(result.total_functions, 1);
        assert_eq!(result.avg_statements_per_function, 3.0);
        assert_eq!(result.max_statements_per_function, 3);
    }

    #[test]
    fn test_multiple_functions() {
        let content = r#"
fn simple_function() {
    let x = 5;
}

fn complex_function() {
    let a = 1;
    let b = 2;
    let c = a + b;
    if c > 3 {
        println!("Large sum");
    }
}
        "#;
        let result = analyze_file_tsc(content).unwrap();
        assert_eq!(result.total_statements, 7); // 1 + 5 statements
        assert_eq!(result.total_functions, 2);
        assert_eq!(result.avg_statements_per_function, 3.5);
        assert_eq!(result.max_statements_per_function, 5);
    }

    #[test]
    fn test_nested_blocks() {
        let content = r#"
fn nested_function() {
    let x = 5;
    if x > 0 {
        let y = 10;
        if y > 5 {
            let z = 15;
        }
    }
}
        "#;
        let result = analyze_file_tsc(content).unwrap();
        assert_eq!(result.total_statements, 5); // 1 + 1 + 1 + 1 + 1 statements
        assert_eq!(result.total_functions, 1);
        assert_eq!(result.max_statements_per_function, 5);
    }

    #[test]
    fn test_impl_methods() {
        let content = r#"
struct MyStruct;

impl MyStruct {
    fn method_one() {
        let x = 1;
        let y = 2;
    }
    
    fn method_two() {
        let a = 3;
    }
}
        "#;
        let result = analyze_file_tsc(content).unwrap();
        assert_eq!(result.total_statements, 5); // 2 + 1 statements
        assert_eq!(result.total_functions, 2);
        assert_eq!(result.avg_statements_per_function, 2.5);
        assert_eq!(result.max_statements_per_function, 2);
    }

    #[test]
    fn test_comments_and_formatting() {
        let content = r#"
// This is a comment
fn main() {
    /* Multi-line
       comment */
    let x = 5; // Inline comment
    let y = 10;
    
    // Another comment
    println!("Hello");
}
        "#;
        let result = analyze_file_tsc(content).unwrap();
        // Comments and formatting don't affect statement count
        assert_eq!(result.total_statements, 3); // Only the 3 statements
        assert_eq!(result.total_functions, 1);
    }

    #[test]
    fn test_string_literals_with_comment_markers() {
        let content = r#"
fn url_function() {
    let url = "http://example.com"; // This won't break AST parsing
    let comment = "/* This is just a string, not a comment */";
    let path = "// This is also just a string";
}
        "#;
        let result = analyze_file_tsc(content).unwrap();
        // String literals with comment markers don't affect statement count
        assert_eq!(result.total_statements, 3); // Only the 3 statements
        assert_eq!(result.total_functions, 1);
    }

    #[test]
    fn test_function_statement_counts() {
        let content = r#"
fn short_function() {
    let x = 1;
}

fn long_function() {
    let a = 1;
    let b = 2;
    let c = 3;
    let d = 4;
    let e = 5;
}
        "#;
        let result = analyze_file_tsc(content).unwrap();
        assert_eq!(result.total_statements, 8); // 1 + 5 statements
        assert_eq!(result.total_functions, 2);

        // Check function-specific counts
        assert_eq!(
            result.function_statement_counts.get("short_function"),
            Some(&1)
        );
        assert_eq!(
            result.function_statement_counts.get("long_function"),
            Some(&5)
        );
    }

    #[test]
    fn test_loc_factor_calculation() {
        // Test edge cases and linear mapping

        // Test LOC <= 500 (should be 0)
        let content_small = r#"
fn small_function() {
    let x = 1;
}
        "#;
        let result_small = analyze_file_tsc(content_small).unwrap();
        assert_eq!(result_small.loc_factor, 0.0);

        // Test LOC between 500 and 10,000 (should be linear)
        // For example, 5,250 statements should be ~50
        // (5250 - 500) / (10000 - 500) * 100 = 4750 / 9500 * 100 = 50
        let factor_mid = TscMetrics::calculate_loc_factor(5250);
        assert_eq!(factor_mid, 50.0);

        // Test LOC >= 10,000 (should be 100)
        let factor_large = TscMetrics::calculate_loc_factor(15000);
        assert_eq!(factor_large, 100.0);

        // Test exact boundaries
        let factor_500 = TscMetrics::calculate_loc_factor(500);
        assert_eq!(factor_500, 0.0);

        let factor_10000 = TscMetrics::calculate_loc_factor(10000);
        assert_eq!(factor_10000, 100.0);

        // Test linear mapping at 1/4 point (2,875)
        // (2875 - 500) / (10000 - 500) * 100 = 2375 / 9500 * 100 = 25
        let factor_quarter = TscMetrics::calculate_loc_factor(2875);
        assert_eq!(factor_quarter, 25.0);
    }
}
