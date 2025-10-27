//! Denial of Service and Resource Limits Factor
//!
//! This module analyzes the risk of resource exhaustion attacks by focusing on
//! three specific, AST-detectable patterns that directly correlate with DoS vectors:
//! 1. Handlers taking Vec<T> parameters (direct CU exhaustion via user input)
//! 2. Handlers containing loops (CU amplification)
//! 3. Dynamic space calculations in account definitions (memory exhaustion)

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{
    parse::{Parse, ParseStream, Result as SynResult},
    visit::{self, Visit},
    Expr, ExprForLoop, ExprLoop, ExprWhile, ItemFn, ItemStruct, Token,
};

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct DosResourceLimitsMetrics {
    /// Total number of instruction handlers found
    pub total_handlers_found: u32,

    /// Primary metric: Handlers taking Vec<T> or &[T] parameters (excluding Context)
    pub handlers_with_vec_params: u32,

    /// Secondary metric: Handlers containing any loop (for, while, loop)
    pub handlers_with_loops: u32,

    /// Secondary metric: Account structs with dynamic space calculations
    pub dynamic_space_accounts: u32,

    /// Maximum constant space allocation found
    pub max_constant_space: u64,

    /// Final Score (0-100)
    pub resource_factor: f64,
    /// Raw score used for normalization
    pub raw_risk_score: f64,

    /// Helper Metrics (for Audibility)
    /// Maps handler name to vec param count
    pub handler_vec_param_counts: HashMap<String, u32>,
    /// Maps handler name to loop count
    pub handler_loop_counts: HashMap<String, u32>,
    /// Maps account name to space calculation type
    pub account_space_types: HashMap<String, String>,

    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl DosResourceLimitsMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "resourceFactor": self.resource_factor,
            "rawRiskScore": self.raw_risk_score,
            "totalHandlersFound": self.total_handlers_found,
            "handlersWithVecParams": self.handlers_with_vec_params,
            "handlersWithLoops": self.handlers_with_loops,
            "dynamicSpaceAccounts": self.dynamic_space_accounts,
            "maxConstantSpace": self.max_constant_space,
            "handlerVecParamCounts": self.handler_vec_param_counts,
            "handlerLoopCounts": self.handler_loop_counts,
            "accountSpaceTypes": self.account_space_types,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped,
        })
    }
}

/// Custom parser for space attributes in account definitions
struct SpaceParser {
    space_expr: Option<Expr>,
}

impl Parse for SpaceParser {
    fn parse(input: ParseStream) -> SynResult<Self> {
        let mut space_expr = None;

        while !input.is_empty() {
            // --- FIX 1: Parse Path instead of Ident ---
            let key_path: syn::Path = input.parse()?;
            let key = key_path.segments.last().unwrap().ident.to_string();

            if key == "space" {
                // Found space, parse its value
                let _: Token![=] = input.parse()?;
                space_expr = Some(input.parse()?);
            } else {
                // --- FIX 2: Handle other attributes robustly ---
                // Check if an equals sign follows this key
                if input.peek(Token![=]) {
                    // It's a key = value attribute (like payer=user, seeds=[...])
                    let _: Token![=] = input.parse()?; // Consume =
                    let _: Expr = input.parse()?; // Consume the value expression
                } else {
                    // It's a standalone flag attribute (like init, mut, signer)
                    // We already parsed the key, do nothing else.
                }
            }

            // Consume comma if present
            if input.peek(Token![,]) {
                let _: Token![,] = input.parse()?;
            }
        }

        Ok(SpaceParser { space_expr })
    }
}

/// Visitor for detecting resource exhaustion patterns
#[derive(Debug, Default)]
struct DosResourceLimitsVisitor {
    metrics: DosResourceLimitsMetrics,
    current_handler_name: Option<String>,
    vec_params_in_current_handler: u32,
    loops_in_current_handler: u32,
}

impl DosResourceLimitsVisitor {
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

    /// Checks if a type is Vec<T> or &[T]
    fn is_vec_or_slice_type(&self, ty: &syn::Type) -> bool {
        match ty {
            syn::Type::Path(type_path) => {
                if let Some(segment) = type_path.path.segments.last() {
                    let type_name = segment.ident.to_string();
                    return type_name == "Vec";
                }
            }
            syn::Type::Reference(type_ref) => {
                if let syn::Type::Slice(_) = &*type_ref.elem {
                    return true;
                }
            }
            _ => {}
        }
        false
    }

    /// Analyzes a space expression to determine if it's dynamic or constant
    fn analyze_space_expression(&mut self, expr: &Expr, account_name: &str) {
        match expr {
            Expr::Lit(syn::ExprLit {
                lit: syn::Lit::Int(lit_int),
                ..
            }) => {
                // Constant space allocation
                if let Ok(space_value) = lit_int.base10_parse::<u64>() {
                    if space_value > self.metrics.max_constant_space {
                        self.metrics.max_constant_space = space_value;
                    }
                    self.metrics.account_space_types.insert(
                        account_name.to_string(),
                        format!("constant_{}", space_value),
                    );
                }
            }
            Expr::Binary(syn::ExprBinary { .. }) => {
                // Check if it's simple math on literals (still constant)
                if let Some(constant_value) = self.evaluate_constant_math_expression(expr) {
                    // It's constant math - treat as constant
                    if constant_value > self.metrics.max_constant_space {
                        self.metrics.max_constant_space = constant_value;
                    }
                    self.metrics.account_space_types.insert(
                        account_name.to_string(),
                        format!("constant_math_{}", constant_value),
                    );
                } else {
                    // It's dynamic math
                    self.metrics.dynamic_space_accounts += 1;
                    self.metrics
                        .account_space_types
                        .insert(account_name.to_string(), "dynamic_math".to_string());
                }
            }
            Expr::Path(_) => {
                // Variable reference - definitely dynamic
                self.metrics.dynamic_space_accounts += 1;
                self.metrics
                    .account_space_types
                    .insert(account_name.to_string(), "dynamic_variable".to_string());
            }
            _ => {
                // Any other expression - treat as dynamic
                self.metrics.dynamic_space_accounts += 1;
                self.metrics
                    .account_space_types
                    .insert(account_name.to_string(), "dynamic_complex".to_string());
            }
        }
    }

    /// Evaluates a binary expression if it's simple math on literals
    fn evaluate_constant_math_expression(&self, expr: &Expr) -> Option<u64> {
        if let Expr::Binary(bin_expr) = expr {
            // Check if both sides are literals
            let left_value = if let Expr::Lit(syn::ExprLit {
                lit: syn::Lit::Int(lit_int),
                ..
            }) = &*bin_expr.left
            {
                lit_int.base10_parse::<u64>().ok()
            } else {
                None
            };

            let right_value = if let Expr::Lit(syn::ExprLit {
                lit: syn::Lit::Int(lit_int),
                ..
            }) = &*bin_expr.right
            {
                lit_int.base10_parse::<u64>().ok()
            } else {
                None
            };

            if let (Some(left), Some(right)) = (left_value, right_value) {
                match bin_expr.op {
                    syn::BinOp::Add(_) => Some(left + right),
                    syn::BinOp::Sub(_) => Some(left.saturating_sub(right)),
                    syn::BinOp::Mul(_) => Some(left * right),
                    _ => None,
                }
            } else {
                None
            }
        } else {
            None
        }
    }
}

impl<'ast> Visit<'ast> for DosResourceLimitsVisitor {
    /// Find instruction handlers and analyze their parameters
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        // Robust heuristic for an Anchor handler
        let is_anchor_handler = matches!(node.vis, syn::Visibility::Public(_))
            && node.sig.inputs.len() > 0
            && self.is_context_arg(&node.sig.inputs[0]);

        if is_anchor_handler {
            self.metrics.total_handlers_found += 1;
            let handler_name = node.sig.ident.to_string();

            // Set context for this handler
            self.current_handler_name = Some(handler_name.clone());
            self.vec_params_in_current_handler = 0;
            self.loops_in_current_handler = 0;

            // Count Vec/Slice parameters (excluding Context)
            for (i, arg) in node.sig.inputs.iter().enumerate() {
                if i == 0 {
                    continue; // Skip Context parameter
                }

                if let syn::FnArg::Typed(pat_type) = arg {
                    if self.is_vec_or_slice_type(&pat_type.ty) {
                        self.vec_params_in_current_handler += 1;
                    }
                }
            }

            // Visit the function body to count loops
            visit::visit_item_fn(self, node);

            // Aggregate results for this handler
            if self.vec_params_in_current_handler > 0 {
                self.metrics.handlers_with_vec_params += 1;
                self.metrics
                    .handler_vec_param_counts
                    .insert(handler_name.clone(), self.vec_params_in_current_handler);
            }

            if self.loops_in_current_handler > 0 {
                self.metrics.handlers_with_loops += 1;
                self.metrics
                    .handler_loop_counts
                    .insert(handler_name.clone(), self.loops_in_current_handler);
            }

            // Clear context
            self.current_handler_name = None;
        } else {
            // Still visit non-handlers in case handlers are nested
            visit::visit_item_fn(self, node);
        }
    }

    /// Count loops within handlers
    fn visit_expr_loop(&mut self, node: &'ast ExprLoop) {
        if self.current_handler_name.is_some() {
            self.loops_in_current_handler += 1;
        }
        visit::visit_expr_loop(self, node);
    }

    fn visit_expr_while(&mut self, node: &'ast ExprWhile) {
        if self.current_handler_name.is_some() {
            self.loops_in_current_handler += 1;
        }
        visit::visit_expr_while(self, node);
    }

    fn visit_expr_for_loop(&mut self, node: &'ast ExprForLoop) {
        if self.current_handler_name.is_some() {
            self.loops_in_current_handler += 1;
        }
        visit::visit_expr_for_loop(self, node);
    }

    /// Analyze account structs for space calculations
    fn visit_item_struct(&mut self, node: &'ast ItemStruct) {
        // Check if this is an account struct (has #[derive(Accounts)])
        let is_account_struct = node.attrs.iter().any(|attr| {
            let attr_str = quote::quote!(#attr).to_string();
            attr_str.contains("derive") && attr_str.contains("Accounts")
        });

        if is_account_struct {
            let struct_name = node.ident.to_string();

            // Analyze each field for space attributes
            for field in &node.fields {
                for attr in &field.attrs {
                    let attr_str = quote::quote!(#attr).to_string();
                    if attr_str.contains("account") && attr_str.contains("space") {
                        // Parse the space attribute
                        if let Ok(space_parser) = attr.parse_args_with(SpaceParser::parse) {
                            if let Some(space_expr) = space_parser.space_expr {
                                self.analyze_space_expression(&space_expr, &struct_name);
                            }
                        }
                    }
                }
            }
        }

        visit::visit_item_struct(self, node);
    }
}

/// Calculate DOS resource limits metrics for workspace
pub fn calculate_workspace_dos_resource_limits(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<DosResourceLimitsMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 DOS RESOURCE LIMITS DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut visitor = DosResourceLimitsVisitor::default();
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
            Ok(content) => match syn::parse_file(&content) {
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

    // Final calculation and normalization (0-100)
    let metrics = &mut visitor.metrics;
    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    // Calculate raw risk score with weighted factors
    // Vec params are highest risk (10x), loops are medium risk (5x), dynamic space is low risk (2x)
    let raw_risk_score = (metrics.handlers_with_vec_params as f64 * 10.0)
        + (metrics.handlers_with_loops as f64 * 5.0)
        + (metrics.dynamic_space_accounts as f64 * 2.0);

    metrics.raw_risk_score = raw_risk_score;

    // Normalize to 0-100
    // Upper bound: 5 vec handlers + 10 loop handlers + 5 dynamic space = 100% risk
    let upper_bound = (5.0 * 10.0) + (10.0 * 5.0) + (5.0 * 2.0); // 110
    let factor = (raw_risk_score / upper_bound) * 100.0;
    metrics.resource_factor = factor.min(100.0); // Cap at 100

    log::info!(
        "🔍 DOS RESOURCE LIMITS DEBUG: Analysis complete - {} files analyzed. Vec handlers: {}, Loop handlers: {}, Dynamic space: {}, Factor: {:.2}",
        files_analyzed,
        metrics.handlers_with_vec_params,
        metrics.handlers_with_loops,
        metrics.dynamic_space_accounts,
        metrics.resource_factor
    );

    Ok(visitor.metrics)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vec_param_handler() {
        let code = r#"
        use anchor_lang::prelude::*;

        pub fn vec_handler(ctx: Context<VecHandler>, items: Vec<u64>) -> Result<()> {
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = DosResourceLimitsVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.total_handlers_found, 1);
        assert_eq!(visitor.metrics.handlers_with_vec_params, 1);
        assert_eq!(
            visitor.metrics.handler_vec_param_counts.get("vec_handler"),
            Some(&1)
        );
    }

    #[test]
    fn test_loop_handler() {
        let code = r#"
        use anchor_lang::prelude::*;

        pub fn loop_handler(ctx: Context<LoopHandler>) -> Result<()> {
            for i in 0..10 {
                // do something
            }
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = DosResourceLimitsVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.total_handlers_found, 1);
        assert_eq!(visitor.metrics.handlers_with_loops, 1);
        assert_eq!(
            visitor.metrics.handler_loop_counts.get("loop_handler"),
            Some(&1)
        );
    }

    #[test]
    fn test_dynamic_space_account() {
        let code = r#"
        use anchor_lang::prelude::*;

        #[derive(Accounts)]
        pub struct DynamicSpace<'info> {
            #[account(space = 8 + user_data.len())]
            pub data_account: Account<'info, DataAccount>,
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = DosResourceLimitsVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.dynamic_space_accounts, 1);
        assert!(visitor
            .metrics
            .account_space_types
            .contains_key("DynamicSpace"));
    }

    #[test]
    fn test_constant_math_space_account() {
        let code = r#"
        use anchor_lang::prelude::*;

        #[derive(Accounts)]
        pub struct ConstantMathSpace<'info> {
            #[account(space = 8 + 10240)]
            pub data_account: Account<'info, DataAccount>,
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = DosResourceLimitsVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.dynamic_space_accounts, 0);
        assert_eq!(visitor.metrics.max_constant_space, 10248); // 8 + 10240
        assert!(visitor
            .metrics
            .account_space_types
            .contains_key("ConstantMathSpace"));
    }

    #[test]
    fn test_factor_calculation() {
        let mut metrics = DosResourceLimitsMetrics::default();
        metrics.handlers_with_vec_params = 2;
        metrics.handlers_with_loops = 3;
        metrics.dynamic_space_accounts = 1;

        let raw_risk_score = (metrics.handlers_with_vec_params as f64 * 10.0)
            + (metrics.handlers_with_loops as f64 * 5.0)
            + (metrics.dynamic_space_accounts as f64 * 2.0);

        let upper_bound = (5.0 * 10.0) + (10.0 * 5.0) + (5.0 * 2.0); // 110
        let factor = (raw_risk_score / upper_bound) * 100.0;
        let resource_factor = factor.min(100.0);

        // (2*10 + 3*5 + 1*2) / 110 * 100 = 37/110 * 100 = 33.6%
        assert!((resource_factor - 33.6).abs() < 0.1);
    }
}
