//! Configuration for the AMM analyzer

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzerConfig {
    /// Root directory to analyze
    pub root_path: PathBuf,

    /// Whether to include test files in analysis
    pub include_tests: bool,

    /// Whether to include benchmark files
    pub include_benches: bool,

    /// Whether to include example files
    pub include_examples: bool,

    /// File patterns to exclude (glob patterns)
    pub exclude_patterns: Vec<String>,

    /// Whether to expand macros before analysis
    pub expand_macros: bool,

    /// Maximum file size to analyze (in bytes)
    pub max_file_size: usize,

    /// Output format configuration
    pub output: OutputConfig,

    /// Analysis depth and features
    pub analysis: AnalysisConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputConfig {
    /// Output format: "json", "yaml", "toml"
    pub format: String,

    /// Whether to pretty-print output
    pub pretty: bool,

    /// Whether to include source code snippets in output
    pub include_snippets: bool,

    /// Whether to include detailed metrics per function
    pub include_function_details: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisConfig {
    /// Enable semantic pattern recognition
    pub semantic_patterns: bool,

    /// Enable complexity scoring
    pub complexity_scoring: bool,

    /// Enable risk assessment
    pub risk_assessment: bool,

    /// Enable performance analysis
    pub performance_analysis: bool,

    /// Custom pattern weights
    pub pattern_weights: PatternWeights,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternWeights {
    /// Weight for checked arithmetic operations
    pub checked_arithmetic: f64,

    /// Weight for mathematical functions
    pub math_functions: f64,

    /// Weight for fixed-point operations
    pub fixed_point: f64,

    /// Weight for unsafe operations
    pub unsafe_operations: f64,

    /// Weight for loop operations
    pub loop_operations: f64,
}

impl Default for AnalyzerConfig {
    fn default() -> Self {
        Self {
            root_path: PathBuf::from("."),
            include_tests: false,
            include_benches: false,
            include_examples: false,
            exclude_patterns: vec![
                "target/**".to_string(),
                "node_modules/**".to_string(),
                ".git/**".to_string(),
            ],
            expand_macros: false,
            max_file_size: 1024 * 1024, // 1MB
            output: OutputConfig::default(),
            analysis: AnalysisConfig::default(),
        }
    }
}

impl Default for OutputConfig {
    fn default() -> Self {
        Self {
            format: "json".to_string(),
            pretty: true,
            include_snippets: false,
            include_function_details: true,
        }
    }
}

impl Default for AnalysisConfig {
    fn default() -> Self {
        Self {
            semantic_patterns: true,
            complexity_scoring: true,
            risk_assessment: true,
            performance_analysis: false,
            pattern_weights: PatternWeights::default(),
        }
    }
}

impl Default for PatternWeights {
    fn default() -> Self {
        Self {
            checked_arithmetic: 1.0,
            math_functions: 1.2,
            fixed_point: 1.5,
            unsafe_operations: 2.0,
            loop_operations: 0.8,
        }
    }
}
