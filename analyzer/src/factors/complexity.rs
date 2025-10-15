//! Cyclomatic complexity calculation using syn
//!
//! This module provides functions to calculate cyclomatic complexity metrics
//! for Rust source files using syn AST parsing.

use std::path::PathBuf;
use syn::{visit::Visit, Expr, File, Item, Stmt};

#[derive(Debug, Clone)]
pub struct ComplexityMetrics {
    pub avg_complexity: f64,
    pub max_complexity: u32,
    pub total_functions: usize,
}

impl ComplexityMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "avgCyclomaticComplexity": self.avg_complexity,
            "maxCyclomaticComplexity": self.max_complexity,
            "totalFunctions": self.total_functions
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

    let result = ComplexityMetrics {
        avg_complexity,
        max_complexity,
        total_functions,
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

    let avg_complexity = if function_count > 0 {
        complexity_visitor.function_complexities.iter().sum::<u32>() as f64 / function_count as f64
    } else {
        0.0
    };

    Ok(ComplexityMetrics {
        avg_complexity,
        max_complexity,
        total_functions: function_count,
    })
}

/// Visitor to calculate cyclomatic complexity for functions
struct ComplexityVisitor {
    function_complexities: Vec<u32>,
    current_complexity: u32,
}

impl ComplexityVisitor {
    fn new() -> Self {
        Self {
            function_complexities: Vec::new(),
            current_complexity: 0,
        }
    }
}

impl<'ast> Visit<'ast> for ComplexityVisitor {
    fn visit_item(&mut self, item: &'ast Item) {
        match item {
            Item::Fn(item_fn) => {
                // Start new function analysis
                self.current_complexity = 1; // Base complexity
                self.visit_item_fn(item_fn);
                self.function_complexities.push(self.current_complexity);
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
            Expr::If(_) => {
                self.current_complexity += 1;
            }
            Expr::While(_) => {
                self.current_complexity += 1;
            }
            Expr::ForLoop(_) => {
                self.current_complexity += 1;
            }
            Expr::Loop(_) => {
                self.current_complexity += 1;
            }
            Expr::Match(match_expr) => {
                // Each match arm adds complexity
                self.current_complexity += match_expr.arms.len() as u32;
            }
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
        assert_eq!(result.max_complexity, 3); // 1 base + 2 match arms
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
}
