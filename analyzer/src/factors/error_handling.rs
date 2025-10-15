use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{visit::Visit, Expr, ItemFn, Path};

/// Metrics for error handling patterns
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ErrorHandlingMetrics {
    // Total error handling patterns
    pub total_require_macros: u32,
    pub total_require_eq_macros: u32,
    pub total_assert_macros: u32,
    pub total_assert_eq_macros: u32,
    pub total_panic_calls: u32,
    pub total_unwrap_calls: u32,
    pub total_expect_calls: u32,
    pub total_error_propagation: u32,
    pub total_error_handling_operations: u32,

    // Detailed pattern breakdown
    pub error_pattern_breakdown: HashMap<String, u32>,

    // Specific error patterns
    pub anchor_require_patterns: u32,
    pub standard_assert_patterns: u32,
    pub panic_patterns: u32,
    pub unwrap_expect_patterns: u32,
    pub result_handling_patterns: u32,
    pub question_mark_operator: u32,
    pub map_err_calls: u32,
    pub and_then_calls: u32,
    pub or_else_calls: u32,

    // Complexity metrics
    pub error_handling_complexity_score: f64,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl ErrorHandlingMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalRequireMacros": self.total_require_macros,
            "totalRequireEqMacros": self.total_require_eq_macros,
            "totalAssertMacros": self.total_assert_macros,
            "totalAssertEqMacros": self.total_assert_eq_macros,
            "totalPanicCalls": self.total_panic_calls,
            "totalUnwrapCalls": self.total_unwrap_calls,
            "totalExpectCalls": self.total_expect_calls,
            "totalErrorPropagation": self.total_error_propagation,
            "totalErrorHandlingOperations": self.total_error_handling_operations,
            "errorPatternBreakdown": self.error_pattern_breakdown,
            "anchorRequirePatterns": self.anchor_require_patterns,
            "standardAssertPatterns": self.standard_assert_patterns,
            "panicPatterns": self.panic_patterns,
            "unwrapExpectPatterns": self.unwrap_expect_patterns,
            "resultHandlingPatterns": self.result_handling_patterns,
            "questionMarkOperator": self.question_mark_operator,
            "mapErrCalls": self.map_err_calls,
            "andThenCalls": self.and_then_calls,
            "orElseCalls": self.or_else_calls,
            "errorHandlingComplexityScore": self.error_handling_complexity_score,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped
        })
    }
}

/// Visitor for detecting error handling patterns
#[derive(Debug)]
struct ErrorHandlingVisitor {
    current_file_path: String,

    // Pattern counters
    require_macros: u32,
    require_eq_macros: u32,
    assert_macros: u32,
    panic_calls: u32,
    unwrap_calls: u32,
    expect_calls: u32,
    error_propagation: u32,

    // Detailed pattern tracking
    error_pattern_counts: HashMap<String, u32>,
    anchor_require_patterns: u32,
    standard_assert_patterns: u32,
    panic_patterns: u32,
    unwrap_expect_patterns: u32,
    result_handling_patterns: u32,
    question_mark_operator: u32,
    map_err_calls: u32,
    and_then_calls: u32,
    or_else_calls: u32,
}

impl ErrorHandlingVisitor {
    fn new() -> Self {
        Self {
            current_file_path: String::new(),
            require_macros: 0,
            require_eq_macros: 0,
            assert_macros: 0,
            panic_calls: 0,
            unwrap_calls: 0,
            expect_calls: 0,
            error_propagation: 0,
            error_pattern_counts: HashMap::new(),
            anchor_require_patterns: 0,
            standard_assert_patterns: 0,
            panic_patterns: 0,
            unwrap_expect_patterns: 0,
            result_handling_patterns: 0,
            question_mark_operator: 0,
            map_err_calls: 0,
            and_then_calls: 0,
            or_else_calls: 0,
        }
    }

    /// Record an error handling pattern
    fn record_error_pattern(&mut self, pattern: &str) {
        *self
            .error_pattern_counts
            .entry(pattern.to_string())
            .or_insert(0) += 1;
    }

    /// Check if a path represents a require macro
    fn is_require_macro(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            name == "require"
        } else {
            false
        }
    }

    /// Check if a path represents a require_eq macro
    fn is_require_eq_macro(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            name == "require_eq"
        } else {
            false
        }
    }

    /// Check if a path represents an assert macro
    fn is_assert_macro(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(name.as_str(), "assert" | "assert_eq" | "assert_ne")
        } else {
            false
        }
    }

    /// Check if a path represents a panic macro
    fn is_panic_macro(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            name == "panic"
        } else {
            false
        }
    }

    /// Check if a method call is unwrap or expect
    fn is_unwrap_expect_method(&self, method_name: &str) -> bool {
        matches!(
            method_name,
            "unwrap" | "expect" | "unwrap_or" | "unwrap_or_else"
        )
    }

    /// Check if a method call is error propagation
    fn is_error_propagation_method(&self, method_name: &str) -> bool {
        matches!(method_name, "map_err" | "and_then" | "or_else")
    }
}

impl<'ast> Visit<'ast> for ErrorHandlingVisitor {
    fn visit_expr(&mut self, node: &'ast Expr) {
        match node {
            Expr::Call(call_expr) => {
                if let Expr::Path(path_expr) = &*call_expr.func {
                    // Check for require! macro
                    if self.is_require_macro(&path_expr.path) {
                        self.require_macros += 1;
                        self.anchor_require_patterns += 1;
                        self.record_error_pattern("require");
                    }

                    // Check for require_eq! macro
                    if self.is_require_eq_macro(&path_expr.path) {
                        self.require_eq_macros += 1;
                        self.anchor_require_patterns += 1;
                        self.record_error_pattern("require_eq");
                    }

                    // Check for assert! macro
                    if self.is_assert_macro(&path_expr.path) {
                        self.assert_macros += 1;
                        self.standard_assert_patterns += 1;
                        self.record_error_pattern("assert");
                    }

                    // Check for panic! macro
                    if self.is_panic_macro(&path_expr.path) {
                        self.panic_calls += 1;
                        self.panic_patterns += 1;
                        self.record_error_pattern("panic");
                    }
                }
            }
            Expr::MethodCall(method_call) => {
                let method_name = method_call.method.to_string();

                // Check for unwrap/expect patterns
                if self.is_unwrap_expect_method(&method_name) {
                    self.unwrap_expect_patterns += 1;
                    self.record_error_pattern(&format!("method_{}", method_name));

                    match method_name.as_str() {
                        "unwrap" => {
                            self.unwrap_calls += 1;
                            self.record_error_pattern("unwrap");
                        }
                        "expect" => {
                            self.expect_calls += 1;
                            self.record_error_pattern("expect");
                        }
                        _ => {}
                    }
                }

                // Check for error propagation patterns
                if self.is_error_propagation_method(&method_name) {
                    self.error_propagation += 1;
                    self.result_handling_patterns += 1;
                    self.record_error_pattern(&format!("error_prop_{}", method_name));

                    match method_name.as_str() {
                        "map_err" => {
                            self.map_err_calls += 1;
                            self.record_error_pattern("map_err");
                        }
                        "and_then" => {
                            self.and_then_calls += 1;
                            self.record_error_pattern("and_then");
                        }
                        "or_else" => {
                            self.or_else_calls += 1;
                            self.record_error_pattern("or_else");
                        }
                        _ => {}
                    }
                }
            }
            Expr::Try(_try_expr) => {
                // Check for ? operator usage
                self.question_mark_operator += 1;
                self.error_propagation += 1;
                self.result_handling_patterns += 1;
                self.record_error_pattern("question_mark");
            }
            _ => {}
        }

        // Continue visiting expression
        syn::visit::visit_expr(self, node);
    }

    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        // Continue visiting function body
        syn::visit::visit_item_fn(self, node);
    }
}

/// Calculate error handling metrics for workspace
pub fn calculate_workspace_error_handling(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<ErrorHandlingMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 ERROR HANDLING DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = ErrorHandlingMetrics::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            log::warn!(
                "🔍 ERROR HANDLING DEBUG: File does not exist: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!(
                "🔍 ERROR HANDLING DEBUG: Skipping non-Rust file: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        log::info!("🔍 ERROR HANDLING DEBUG: Analyzing file: {:?}", full_path);

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = ErrorHandlingVisitor::new();
        visitor.current_file_path = file_path.to_string();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.total_require_macros += visitor.require_macros;
        metrics.total_require_eq_macros += visitor.require_eq_macros;
        metrics.total_assert_macros += visitor.assert_macros;
        metrics.total_assert_eq_macros += visitor.assert_macros; // assert_eq is counted in assert_macros
        metrics.total_panic_calls += visitor.panic_calls;
        metrics.total_unwrap_calls += visitor.unwrap_calls;
        metrics.total_expect_calls += visitor.expect_calls;
        metrics.total_error_propagation += visitor.error_propagation;
        metrics.anchor_require_patterns += visitor.anchor_require_patterns;
        metrics.standard_assert_patterns += visitor.standard_assert_patterns;
        metrics.panic_patterns += visitor.panic_patterns;
        metrics.unwrap_expect_patterns += visitor.unwrap_expect_patterns;
        metrics.result_handling_patterns += visitor.result_handling_patterns;
        metrics.question_mark_operator += visitor.question_mark_operator;
        metrics.map_err_calls += visitor.map_err_calls;
        metrics.and_then_calls += visitor.and_then_calls;
        metrics.or_else_calls += visitor.or_else_calls;

        // Merge pattern breakdown
        for (pattern, count) in visitor.error_pattern_counts {
            *metrics.error_pattern_breakdown.entry(pattern).or_insert(0) += count;
        }

        files_analyzed += 1;

        log::info!(
            "🔍 ERROR HANDLING DEBUG: File {} analysis complete - require: {}, require_eq: {}, assert: {}, panic: {}, unwrap: {}, expect: {}",
            file_path,
            visitor.require_macros,
            visitor.require_eq_macros,
            visitor.assert_macros,
            visitor.panic_calls,
            visitor.unwrap_calls,
            visitor.expect_calls
        );
    }

    // Add file analysis metadata
    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    // Calculate total error handling operations
    metrics.total_error_handling_operations = metrics.total_require_macros
        + metrics.total_require_eq_macros
        + metrics.total_assert_macros
        + metrics.total_panic_calls
        + metrics.total_unwrap_calls
        + metrics.total_expect_calls
        + metrics.total_error_propagation;

    // Calculate complexity score (simple count-based)
    metrics.error_handling_complexity_score = metrics.total_error_handling_operations as f64;

    log::info!(
        "🔍 ERROR HANDLING DEBUG: Analysis complete - {} files analyzed, {} files skipped, total error operations: {}, complexity score: {:.1}",
        files_analyzed,
        files_skipped,
        metrics.total_error_handling_operations,
        metrics.error_handling_complexity_score
    );

    Ok(metrics)
}
