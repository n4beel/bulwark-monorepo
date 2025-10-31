//! Error-Handling Footprint (Invariants) Factor
//!
//! This module is "laser-focused" on a single objective: counting the
//! total number of Anchor `require!` and `require_eq!` macros.
//!
//! This count serves as a direct proxy for the "branch surface" and
//! the number of "intended invariants" an auditor must review.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{visit::Visit, Path};

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ErrorHandlingMetrics {
    // --- The 2 Sub-Factors (Raw Data) ---
    pub total_require_macros: u32,
    pub total_require_eq_macros: u32,

    // --- Core Metric ---
    /// The total count of all invariants (require + require_eq)
    pub total_invariants: u32,

    // --- Final Score (0-100) ---
    /// The final normalized risk factor
    pub error_handling_factor: f64,
    /// Raw score used for normalization
    pub raw_risk_score: f64,

    // --- Helper Metrics (for Audibility) ---
    pub error_pattern_breakdown: HashMap<String, u32>,
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl ErrorHandlingMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "errorHandlingFactor": self.error_handling_factor,
            "rawRiskScore": self.raw_risk_score,
            "totalInvariants": self.total_invariants,
            "totalRequireMacros": self.total_require_macros,
            "totalRequireEqMacros": self.total_require_eq_macros,
            "errorPatternBreakdown": self.error_pattern_breakdown,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped
        })
    }
}

/// Visitor for detecting ONLY `require!` and `require_eq!`
#[derive(Debug, Default)]
struct ErrorHandlingVisitor {
    require_macros: u32,
    require_eq_macros: u32,
    error_pattern_counts: HashMap<String, u32>,
}

impl ErrorHandlingVisitor {
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
            segment.ident == "require"
        } else {
            false
        }
    }

    /// Check if a path represents a require_eq macro
    fn is_require_eq_macro(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            segment.ident == "require_eq"
        } else {
            false
        }
    }
}

impl<'ast> Visit<'ast> for ErrorHandlingVisitor {
    // --- THIS IS THE FIX (Part 1) ---
    // Catches statement-level macros: `require!(...);`
    fn visit_stmt_macro(&mut self, node: &'ast syn::StmtMacro) {
        // Check for require! macro
        if self.is_require_macro(&node.mac.path) {
            self.require_macros += 1;
            self.record_error_pattern("require");
        }

        // Check for require_eq! macro
        if self.is_require_eq_macro(&node.mac.path) {
            self.require_eq_macros += 1;
            self.record_error_pattern("require_eq");
        }

        // Continue visiting *inside* the macro's tokens
        syn::visit::visit_stmt_macro(self, node);
    }

    // --- THIS IS THE FIX (Part 2) ---
    // Catches expression-level macros: `let x = require!(...);`
    fn visit_expr_macro(&mut self, node: &'ast syn::ExprMacro) {
        // Check for require! macro
        if self.is_require_macro(&node.mac.path) {
            self.require_macros += 1;
            self.record_error_pattern("require");
        }

        // Check for require_eq! macro
        if self.is_require_eq_macro(&node.mac.path) {
            self.require_eq_macros += 1;
            self.record_error_pattern("require_eq");
        }

        // Continue visiting *inside* the macro's tokens
        syn::visit::visit_expr_macro(self, node);
    }
}

/// Calculate error handling metrics for workspace
pub fn calculate_workspace_error_handling(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<ErrorHandlingMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 ERROR HANDLING DEBUG: Starting 'require' analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = ErrorHandlingMetrics::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            files_skipped += 1;
            continue;
        }
        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            files_skipped += 1;
            continue;
        }

        log::info!("🔍 ERROR HANDLING DEBUG: Analyzing file: {:?}", full_path);

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = ErrorHandlingVisitor::default();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.total_require_macros += visitor.require_macros;
        metrics.total_require_eq_macros += visitor.require_eq_macros;

        // Merge pattern breakdown
        for (pattern, count) in visitor.error_pattern_counts {
            *metrics.error_pattern_breakdown.entry(pattern).or_insert(0) += count;
        }

        files_analyzed += 1;
    }

    // --- Final Calculation and Normalization (0-100) ---
    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;
    metrics.total_invariants = metrics.total_require_macros + metrics.total_require_eq_macros;

    // 1. Calculate the Raw Score (simple count)
    let raw_risk_score = metrics.total_invariants as f64;
    metrics.raw_risk_score = raw_risk_score;

    // 2. Normalize to 0-100
    // We set a high cap. 100 invariants is a 100% complex contract.
    let upper_bound = 100.0;
    let factor = (raw_risk_score / upper_bound) * 100.0;
    metrics.error_handling_factor = factor.min(100.0); // Cap at 100

    log::info!(
        "🔍 ERROR HANDLING DEBUG: Analysis complete - {} files analyzed, {} total invariants. Factor: {:.2}",
        files_analyzed,
        metrics.total_invariants,
        metrics.error_handling_factor
    );

    Ok(metrics)
}
