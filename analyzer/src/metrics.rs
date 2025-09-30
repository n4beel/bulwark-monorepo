//! Metrics data structures for analysis results

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Metrics for a single function
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct FunctionMetrics {
    /// Function name
    pub name: String,

    /// Function signature (for disambiguation)
    pub signature: String,

    /// Line range in source file
    pub line_range: (usize, usize),

    /// Raw arithmetic operations
    pub arithmetic: ArithmeticMetrics,

    /// Mathematical function calls
    pub math_functions: MathFunctionMetrics,

    /// Control flow complexity
    pub control_flow: ControlFlowMetrics,

    /// Memory and safety patterns
    pub safety: SafetyMetrics,

    /// Semantic tags (AMM-specific patterns)
    pub semantic_tags: Vec<String>,

    /// Risk indicators
    pub risk_indicators: Vec<String>,

    /// Overall complexity score
    pub complexity_score: f64,
}

/// Raw arithmetic operation counts
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ArithmeticMetrics {
    // Checked operations (safe)
    pub checked_add: u32,
    pub checked_sub: u32,
    pub checked_mul: u32,
    pub checked_div: u32,
    pub checked_rem: u32,
    pub checked_pow: u32,

    // Saturating operations
    pub saturating_add: u32,
    pub saturating_sub: u32,
    pub saturating_mul: u32,

    // Wrapping operations
    pub wrapping_add: u32,
    pub wrapping_sub: u32,
    pub wrapping_mul: u32,
    pub wrapping_div: u32,

    // Raw binary operations
    pub raw_add: u32,
    pub raw_sub: u32,
    pub raw_mul: u32,
    pub raw_div: u32,
    pub raw_rem: u32,

    // Special operations
    pub ceil_div: u32,
    pub integer_sqrt: u32,
    pub bitwise_ops: u32,
}

/// Mathematical function usage
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct MathFunctionMetrics {
    // Basic math functions
    pub sqrt: u32,
    pub pow: u32,
    pub exp: u32,
    pub log: u32,

    // Trigonometric functions
    pub trig_functions: u32,

    // Rounding functions
    pub floor: u32,
    pub ceil: u32,
    pub round: u32,

    // Absolute value
    pub abs: u32,

    // Min/max operations
    pub min_max: u32,
}

/// Control flow complexity metrics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ControlFlowMetrics {
    /// Cyclomatic complexity
    pub cyclomatic_complexity: u32,

    /// Number of decision points
    pub decision_points: u32,

    /// Loop nesting depth
    pub max_loop_depth: u32,

    /// Total number of loops
    pub loop_count: u32,

    /// Conditional nesting depth
    pub max_conditional_depth: u32,

    /// Total conditionals
    pub conditional_count: u32,
}

/// Safety and memory management metrics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SafetyMetrics {
    /// Unsafe blocks count
    pub unsafe_blocks: u32,

    /// Raw pointer usage
    pub raw_pointers: u32,

    /// Unwrap calls (potential panics)
    pub unwrap_calls: u32,

    /// Expect calls
    pub expect_calls: u32,

    /// Panic calls
    pub panic_calls: u32,

    /// Todo/unimplemented calls
    pub todo_calls: u32,
}

/// Metrics for a single file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetrics {
    /// File path
    pub path: PathBuf,

    /// Total lines of code (excluding comments/whitespace)
    pub lines_of_code: u32,

    /// Total functions analyzed
    pub function_count: u32,

    /// Per-function metrics
    pub functions: Vec<FunctionMetrics>,

    /// File-level aggregated metrics
    pub aggregated: AggregatedMetrics,

    /// File-level semantic tags
    pub semantic_tags: Vec<String>,
}

/// Repository-wide metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoMetrics {
    /// Repository root path
    pub root_path: PathBuf,

    /// Total files analyzed
    pub file_count: u32,

    /// Total lines of code
    pub total_lines_of_code: u32,

    /// Total functions analyzed
    pub total_function_count: u32,

    /// Per-file metrics
    pub files: Vec<FileMetrics>,

    /// Repository-wide aggregated metrics
    pub aggregated: AggregatedMetrics,

    /// Top-level semantic patterns found
    pub semantic_patterns: HashMap<String, u32>,

    /// Risk assessment summary
    pub risk_summary: RiskSummary,
}

/// Aggregated metrics (used for files and repo)
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AggregatedMetrics {
    /// Total arithmetic operations
    pub total_arithmetic_ops: u32,

    /// Total mathematical function calls
    pub total_math_functions: u32,

    /// Average cyclomatic complexity
    pub avg_cyclomatic_complexity: f64,

    /// Maximum cyclomatic complexity
    pub max_cyclomatic_complexity: u32,

    /// Total unsafe operations
    pub total_unsafe_ops: u32,

    /// Safety ratio (safe ops / total ops)
    pub safety_ratio: f64,

    /// Overall complexity score
    pub complexity_score: f64,
}

/// Risk assessment summary
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RiskSummary {
    /// Overall risk level: "low", "medium", "high", "critical"
    pub risk_level: String,

    /// Risk factors found
    pub risk_factors: Vec<String>,

    /// Recommendations
    pub recommendations: Vec<String>,

    /// Risk score (0-100)
    pub risk_score: f64,
}

impl ArithmeticMetrics {
    /// Calculate total arithmetic operations
    pub fn total_ops(&self) -> u32 {
        self.checked_add
            + self.checked_sub
            + self.checked_mul
            + self.checked_div
            + self.checked_rem
            + self.checked_pow
            + self.saturating_add
            + self.saturating_sub
            + self.saturating_mul
            + self.wrapping_add
            + self.wrapping_sub
            + self.wrapping_mul
            + self.wrapping_div
            + self.raw_add
            + self.raw_sub
            + self.raw_mul
            + self.raw_div
            + self.raw_rem
            + self.ceil_div
            + self.integer_sqrt
            + self.bitwise_ops
    }

    /// Calculate safe operations ratio
    pub fn safe_ops_ratio(&self) -> f64 {
        let safe_ops = self.checked_add
            + self.checked_sub
            + self.checked_mul
            + self.checked_div
            + self.checked_rem
            + self.checked_pow
            + self.saturating_add
            + self.saturating_sub
            + self.saturating_mul;
        let total = self.total_ops();
        if total == 0 {
            1.0
        } else {
            safe_ops as f64 / total as f64
        }
    }
}

impl MathFunctionMetrics {
    /// Calculate total math function calls
    pub fn total_calls(&self) -> u32 {
        self.sqrt
            + self.pow
            + self.exp
            + self.log
            + self.trig_functions
            + self.floor
            + self.ceil
            + self.round
            + self.abs
            + self.min_max
    }
}
