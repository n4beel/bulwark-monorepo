//! Output formatting and JSON structures

use crate::metrics::RepoMetrics;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Main analysis report structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisReport {
    /// Report metadata
    pub metadata: ReportMetadata,

    /// Repository metrics
    pub repository: RepoMetrics,

    /// Summary statistics
    pub summary: SummaryStats,
}

/// Report metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportMetadata {
    /// Analyzer version
    pub version: String,

    /// Analysis timestamp
    pub timestamp: String,

    /// Configuration used for analysis
    pub config_summary: ConfigSummary,

    /// Analysis duration in milliseconds
    pub duration_ms: u64,
}

/// Configuration summary for the report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfigSummary {
    /// Whether tests were included
    pub included_tests: bool,

    /// Whether macros were expanded
    pub expanded_macros: bool,

    /// Maximum file size analyzed
    pub max_file_size: usize,

    /// Number of excluded patterns
    pub exclude_pattern_count: usize,
}

/// High-level summary statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryStats {
    /// Total complexity operations found
    pub total_complexity_operations: u32,

    /// Breakdown by operation type
    pub operation_breakdown: OperationBreakdown,

    /// Top semantic patterns found
    pub top_semantic_patterns: Vec<PatternCount>,

    /// Files with highest complexity
    pub highest_complexity_files: Vec<FileComplexity>,

    /// Functions with highest complexity
    pub highest_complexity_functions: Vec<FunctionComplexity>,

    /// Key insights and recommendations
    pub insights: Vec<String>,
}

/// Breakdown of operations by type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationBreakdown {
    /// Checked arithmetic operations
    pub checked_arithmetic: u32,

    /// Mathematical functions
    pub math_functions: u32,

    /// Raw arithmetic operations
    pub raw_arithmetic: u32,

    /// Control flow operations
    pub control_flow: u32,

    /// Unsafe operations
    pub unsafe_operations: u32,
}

/// Pattern count for semantic analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternCount {
    /// Pattern name
    pub pattern: String,

    /// Count of occurrences
    pub count: u32,

    /// Description of what this pattern indicates
    pub description: String,
}

/// File complexity summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileComplexity {
    /// File path
    pub path: String,

    /// Complexity score
    pub complexity_score: f64,

    /// Number of functions
    pub function_count: u32,

    /// Lines of code
    pub lines_of_code: u32,
}

/// Function complexity summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionComplexity {
    /// Function name
    pub name: String,

    /// File path
    pub file_path: String,

    /// Complexity score
    pub complexity_score: f64,

    /// Cyclomatic complexity
    pub cyclomatic_complexity: u32,

    /// Total operations
    pub total_operations: u32,
}

/// JSON output utility
pub struct JsonOutput;

impl JsonOutput {
    /// Format report as pretty JSON
    pub fn pretty(report: &AnalysisReport) -> serde_json::Result<String> {
        serde_json::to_string_pretty(report)
    }

    /// Format report as compact JSON
    pub fn compact(report: &AnalysisReport) -> serde_json::Result<String> {
        serde_json::to_string(report)
    }
}

impl AnalysisReport {
    /// Create a new analysis report
    pub fn new(repository: RepoMetrics) -> Self {
        let start_time = std::time::SystemTime::now();

        // Generate summary statistics
        let summary = Self::generate_summary(&repository);

        let metadata = ReportMetadata {
            version: env!("CARGO_PKG_VERSION").to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            config_summary: ConfigSummary {
                included_tests: false, // TODO: get from actual config
                expanded_macros: false,
                max_file_size: 1024 * 1024,
                exclude_pattern_count: 3,
            },
            duration_ms: start_time.elapsed().unwrap_or_default().as_millis() as u64,
        };

        Self {
            metadata,
            repository,
            summary,
        }
    }

    /// Generate summary statistics from repository metrics
    fn generate_summary(repo: &RepoMetrics) -> SummaryStats {
        let mut operation_breakdown = OperationBreakdown {
            checked_arithmetic: 0,
            math_functions: 0,
            raw_arithmetic: 0,
            control_flow: 0,
            unsafe_operations: 0,
        };

        let mut file_complexities = Vec::new();
        let mut function_complexities = Vec::new();

        // Aggregate data from all files
        for file in &repo.files {
            // File complexity
            file_complexities.push(FileComplexity {
                path: file.path.to_string_lossy().to_string(),
                complexity_score: file.aggregated.complexity_score,
                function_count: file.function_count,
                lines_of_code: file.lines_of_code,
            });

            // Function complexities and operation breakdown
            for func in &file.functions {
                function_complexities.push(FunctionComplexity {
                    name: func.name.clone(),
                    file_path: file.path.to_string_lossy().to_string(),
                    complexity_score: func.complexity_score,
                    cyclomatic_complexity: func.control_flow.cyclomatic_complexity,
                    total_operations: func.arithmetic.total_ops()
                        + func.math_functions.total_calls(),
                });

                // Update operation breakdown
                operation_breakdown.checked_arithmetic += func.arithmetic.checked_add
                    + func.arithmetic.checked_sub
                    + func.arithmetic.checked_mul
                    + func.arithmetic.checked_div;

                operation_breakdown.math_functions += func.math_functions.total_calls();

                operation_breakdown.raw_arithmetic += func.arithmetic.raw_add
                    + func.arithmetic.raw_sub
                    + func.arithmetic.raw_mul
                    + func.arithmetic.raw_div;

                operation_breakdown.control_flow += func.control_flow.cyclomatic_complexity;

                operation_breakdown.unsafe_operations +=
                    func.safety.unsafe_blocks + func.safety.unwrap_calls + func.safety.panic_calls;
            }
        }

        // Sort by complexity and take top 10
        file_complexities
            .sort_by(|a, b| b.complexity_score.partial_cmp(&a.complexity_score).unwrap());
        file_complexities.truncate(10);

        function_complexities
            .sort_by(|a, b| b.complexity_score.partial_cmp(&a.complexity_score).unwrap());
        function_complexities.truncate(10);

        // Generate semantic patterns (placeholder)
        let top_semantic_patterns = vec![
            PatternCount {
                pattern: "token_swap".to_string(),
                count: 5,
                description: "Functions that handle token swapping operations".to_string(),
            },
            PatternCount {
                pattern: "liquidity_management".to_string(),
                count: 3,
                description: "Functions that manage liquidity pools".to_string(),
            },
        ];

        // Generate insights
        let mut insights = Vec::new();

        if repo.aggregated.safety_ratio < 0.8 {
            insights.push(
                "Consider increasing the use of checked arithmetic operations for better safety"
                    .to_string(),
            );
        }

        if repo.aggregated.avg_cyclomatic_complexity > 10.0 {
            insights.push(
                "Some functions have high cyclomatic complexity - consider refactoring".to_string(),
            );
        }

        if operation_breakdown.unsafe_operations > 20 {
            insights.push("High number of potentially unsafe operations detected".to_string());
        }

        let total_complexity_operations = operation_breakdown.checked_arithmetic
            + operation_breakdown.math_functions
            + operation_breakdown.raw_arithmetic;

        SummaryStats {
            total_complexity_operations,
            operation_breakdown,
            top_semantic_patterns,
            highest_complexity_files: file_complexities,
            highest_complexity_functions: function_complexities,
            insights,
        }
    }
}

// Add chrono dependency for timestamps
// This would go in Cargo.toml: chrono = { version = "0.4", features = ["serde"] }
