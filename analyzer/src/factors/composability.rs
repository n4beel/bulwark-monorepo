//! Composability and Inter-Program Complexity Factor
//!
//! This module analyzes the complexity arising from instruction handlers
//! orchestrating multiple Cross-Program Invocations (CPIs) within a
//! single transaction. It replaces the old name-based checks with a
//! focused AST analysis of actual CPI calls within handlers.

use quote::quote;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{
    parse_file,
    visit::{self, Visit},
    Expr, ItemFn, Path,
};

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ComposabilityMetrics {
    /// Total number of instruction handlers found
    pub total_handlers_found: u32,
    /// Sub-factor: Count of handlers making > 1 CPI call
    pub multi_cpi_handlers_count: u32,

    /// Final Score (0-100)
    pub composability_factor: f64,
    /// Raw score used for normalization
    pub raw_risk_score: f64,

    /// Helper Metrics (for Audibility)
    /// Maps handler name to the number of CPIs it makes
    pub handler_cpi_counts: HashMap<String, u32>,
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl ComposabilityMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "composabilityFactor": self.composability_factor,
            "rawRiskScore": self.raw_risk_score,
            "totalHandlersFound": self.total_handlers_found,
            "multiCpiHandlersCount": self.multi_cpi_handlers_count,
            "handlerCpiCounts": self.handler_cpi_counts,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped,
        })
    }
}

/// Visitor for detecting handlers with multiple CPIs
#[derive(Debug, Default)]
struct ComposabilityVisitor {
    metrics: ComposabilityMetrics,
    current_handler_name: Option<String>,
    cpi_calls_in_current_handler: u32,
}

impl ComposabilityVisitor {
    /// Checks if an argument is the Anchor Context
    fn is_context_arg(&self, arg: &syn::FnArg) -> bool {
        if let syn::FnArg::Typed(pat_type) = arg {
            if let syn::Type::Path(type_path) = &*pat_type.ty {
                if let Some(segment) = type_path.path.segments.last() {
                    return segment.ident == "Context";
                }
            }
        }
        false
    }

    /// Get a clean string path from a function call or macro path
    fn get_call_path_string(&self, path: &Path) -> Option<String> {
        // Converts `anchor_spl::token::transfer` into "anchor_spl::token::transfer"
        let path_str = quote!(#path).to_string().replace(' ', "");
        Some(path_str)
    }

    /// Analyze a path to determine if it's a known CPI call
    fn is_cpi_path(&self, path_str: &str) -> bool {
        // Native invoke (covers invoke, invoke_signed, etc.)
        if path_str.ends_with("::invoke")
            || path_str == "invoke"
            || path_str.ends_with("::invoke_signed")
            || path_str.ends_with("::invoke_signed_unchecked")
            || path_str == "invoke_signed"
        {
            return true;
        }
        // SPL Helpers (covers token::transfer, system_program::create_account, etc.)
        if path_str.contains("::token::")
            || path_str.starts_with("token::")
            || path_str.contains("::system_program::")
            || path_str.starts_with("system_program::")
            || path_str.contains("::associated_token::")
            || path_str.starts_with("associated_token::")
            || path_str.contains("::spl_token::")
        // Handle direct spl_token usage
        {
            return true;
        }

        false
    }
}

impl<'ast> Visit<'ast> for ComposabilityVisitor {
    /// --- Find Instruction Handlers ---
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        // Robust heuristic for an Anchor handler
        let is_anchor_handler = matches!(node.vis, syn::Visibility::Public(_))
            && node.sig.inputs.len() > 0
            && self.is_context_arg(&node.sig.inputs[0]);

        if is_anchor_handler {
            self.metrics.total_handlers_found += 1;
            let handler_name = node.sig.ident.to_string();

            // --- Set Context for this Handler ---
            self.current_handler_name = Some(handler_name.clone());
            self.cpi_calls_in_current_handler = 0;

            // Visit the function body to count CPIs within it
            visit::visit_item_fn(self, node);

            // --- Aggregate Results for this Handler ---
            if self.cpi_calls_in_current_handler > 0 {
                self.metrics
                    .handler_cpi_counts
                    .insert(handler_name.clone(), self.cpi_calls_in_current_handler);
            }
            if self.cpi_calls_in_current_handler > 1 {
                self.metrics.multi_cpi_handlers_count += 1;
                log::info!(
                    "🔍 COMPOSABILITY DEBUG: Handler '{}' has {} CPI calls (>1)",
                    handler_name,
                    self.cpi_calls_in_current_handler
                );
            }

            // --- Clear Context ---
            self.current_handler_name = None;
        } else {
            // Still visit non-handlers in case handlers are nested
            visit::visit_item_fn(self, node);
        }
    }

    /// --- Find CPI Calls (Only count if inside a handler) ---
    /// Catches CPIs via function calls (e.g., anchor_spl::token::transfer)
    fn visit_expr_call(&mut self, node: &'ast syn::ExprCall) {
        if self.current_handler_name.is_some() {
            if let Expr::Path(path_expr) = &*node.func {
                if let Some(path_str) = self.get_call_path_string(&path_expr.path) {
                    if self.is_cpi_path(&path_str) {
                        self.cpi_calls_in_current_handler += 1;
                    }
                }
            }
        }
        // Always continue visiting
        visit::visit_expr_call(self, node);
    }

    /// Catches CPIs via invoke/invoke_signed macros (less common in Anchor)
    fn visit_expr_macro(&mut self, node: &'ast syn::ExprMacro) {
        if self.current_handler_name.is_some() {
            if let Some(path_str) = self.get_call_path_string(&node.mac.path) {
                // Check specifically for invoke/invoke_signed macros
                if path_str == "invoke"
                    || path_str.ends_with("::invoke")
                    || path_str == "invoke_signed"
                    || path_str.ends_with("::invoke_signed")
                {
                    self.cpi_calls_in_current_handler += 1;
                }
            }
        }
        // Always continue visiting
        visit::visit_expr_macro(self, node);
    }
}

/// Calculate composability metrics for workspace
pub fn calculate_workspace_composability(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<ComposabilityMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 COMPOSABILITY DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut visitor = ComposabilityVisitor::default();
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

        match std::fs::read_to_string(&full_path) {
            Ok(content) => match parse_file(&content) {
                Ok(ast) => {
                    visitor.visit_file(&ast);
                    files_analyzed += 1;
                }
                Err(e) => {
                    log::warn!("Failed to parse AST for {:?}: {}", full_path, e);
                    files_skipped += 1;
                }
            },
            Err(e) => {
                log::warn!("Failed to read file {:?}: {}", full_path, e);
                files_skipped += 1;
            }
        }
    }

    // --- Final Calculation and Normalization (0-100) ---
    let metrics = &mut visitor.metrics;
    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    // 1. Calculate the Raw Score (Based only on handlers with >1 CPI)
    let raw_risk_score = metrics.multi_cpi_handlers_count as f64;
    metrics.raw_risk_score = raw_risk_score;

    // 2. Normalize to 0-100
    // Upper bound: 10 handlers performing multi-CPI actions = 100% risk
    let upper_bound = 10.0;
    let factor = (raw_risk_score / upper_bound) * 100.0;
    metrics.composability_factor = factor.min(100.0); // Cap at 100

    log::info!(
        "🔍 COMPOSABILITY DEBUG: Analysis complete - {} files analyzed. Found {} handlers with >1 CPI. Factor: {:.2}",
        files_analyzed,
        metrics.multi_cpi_handlers_count,
        metrics.composability_factor
    );

    Ok(visitor.metrics)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_single_cpi_handler() {
        let code = r#"
        use anchor_lang::prelude::*;

        pub fn single_cpi_handler(ctx: Context<SingleCpi>) -> Result<()> {
            anchor_spl::token::transfer(ctx.accounts.transfer_ctx(), 100)?;
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = ComposabilityVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.total_handlers_found, 1);
        assert_eq!(visitor.metrics.multi_cpi_handlers_count, 0); // Only 1 CPI
        assert_eq!(
            visitor.metrics.handler_cpi_counts.get("single_cpi_handler"),
            Some(&1)
        );
    }

    #[test]
    fn test_multi_cpi_handler() {
        let code = r#"
        use anchor_lang::prelude::*;

        pub fn multi_cpi_handler(ctx: Context<MultiCpi>) -> Result<()> {
            anchor_spl::token::transfer(ctx.accounts.transfer_ctx(), 100)?;
            anchor_spl::system_program::create_account(ctx.accounts.create_ctx())?;
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = ComposabilityVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.total_handlers_found, 1);
        assert_eq!(visitor.metrics.multi_cpi_handlers_count, 1); // 2 CPIs > 1
        assert_eq!(
            visitor.metrics.handler_cpi_counts.get("multi_cpi_handler"),
            Some(&2)
        );
    }

    #[test]
    fn test_non_handler_function() {
        let code = r#"
        fn helper_function() {
            anchor_spl::token::transfer(ctx.accounts.transfer_ctx(), 100)?;
            anchor_spl::system_program::create_account(ctx.accounts.create_ctx())?;
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = ComposabilityVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.total_handlers_found, 0);
        assert_eq!(visitor.metrics.multi_cpi_handlers_count, 0);
    }

    #[test]
    fn test_factor_calculation() {
        let mut metrics = ComposabilityMetrics::default();
        metrics.multi_cpi_handlers_count = 3;

        let raw_risk_score = metrics.multi_cpi_handlers_count as f64;
        let upper_bound = 10.0;
        let factor = (raw_risk_score / upper_bound) * 100.0;
        let composability_factor = factor.min(100.0);

        assert_eq!(composability_factor, 30.0); // 3/10 * 100 = 30%
    }
}
