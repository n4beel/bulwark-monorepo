//! Access-Controlled Complexity (AC) Factor
//!
//! This module analyzes the "Access Control" surface of a smart contract.
//! It replaces the old, fragile name-based checks with a robust AST analysis
//! that finds three key risk-factors:
//! 1. Gated Handlers (Good): Handlers using Anchor auth constraints.
//! 2. Account Closes (High Risk): Handlers that close accounts.
//! 3. Manual Checks (Highest Risk): Handlers that manually check signers.

use quote::quote;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use syn::{
    parse::{Parse, ParseStream},
    parse_file,
    visit::{self, Visit},
    BinOp, Expr, ExprBinary, ExprField, ExprMethodCall, ItemFn, ItemStruct, Path, Token,
};

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct PrivilegedRolesMetrics {
    // --- The 3 Sub-Factors (Raw Data) ---
    /// Sub-factor 1: Handlers using Anchor auth constraints (signer, has_one)
    pub total_gated_handlers: u32,
    /// Sub-factor 2: Handlers that close an account
    pub total_account_closes: u32,
    /// Sub-factor 3: Handlers that use manual `if key != ...` checks
    pub total_manual_checks: u32,

    // --- Final Score (0-100) ---
    /// The final normalized risk factor
    pub ac_factor: f64,

    // --- Helper Metrics (for Audibility) ---
    pub total_handlers_found: u32,
    pub handlers_with_manual_checks: HashSet<String>,
    pub handlers_with_closes: HashSet<String>,
    pub raw_risk_score: f64,
}

impl PrivilegedRolesMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "acFactor": self.ac_factor,
            "rawRiskScore": self.raw_risk_score,
            "totalGatedHandlers": self.total_gated_handlers,
            "totalAccountCloses": self.total_account_closes,
            "totalManualChecks": self.total_manual_checks,
            "totalHandlersFound": self.total_handlers_found,
            "handlersWithManualChecks": self.handlers_with_manual_checks,
            "handlersWithCloses": self.handlers_with_closes,
        })
    }
}

/// Helper struct for the custom constraint parser
#[derive(Debug, Default)]
struct ConstraintParserStats {
    has_close: bool,
    auth_constraint_count: u32,
}

impl Parse for ConstraintParserStats {
    /// This is a custom AST parser for the *inside* of `#[account(...)]`
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let mut stats = Self::default();

        while !input.is_empty() {
            let key_path: Path = input.parse()?;
            let key = key_path.segments.last().unwrap().ident.to_string();

            // Check for the keys we care about
            match key.as_str() {
                "close" => stats.has_close = true,
                "signer" | "has_one" | "owner" | "constraint" => {
                    stats.auth_constraint_count += 1;
                }
                _ => {} // Ignore other keys like mut, init, seeds, etc.
            }

            // If there is an `=`, parse and discard the value
            if input.peek(Token![=]) {
                let _: Token![=] = input.parse()?;
                let _: Expr = input.parse()?;
            }

            // If there is a comma, consume it and continue
            if input.peek(Token![,]) {
                let _: Token![,] = input.parse()?;
            }
        }
        Ok(stats)
    }
}

/// Visitor to implement the Two-Pass strategy
#[derive(Debug, Default)]
struct AcVisitor {
    metrics: PrivilegedRolesMetrics,
    // We store stats for each Account Struct to link to its handler
    struct_stats: HashMap<String, ConstraintParserStats>,
    // State for visiting function bodies
    current_handler_name: Option<String>,
    manual_checks_in_handler: u32,
}

impl AcVisitor {
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

    /// Gets the name of the struct from a `Context<StructName>`
    fn get_context_struct_name(&self, arg: &syn::FnArg) -> Option<String> {
        if let syn::FnArg::Typed(pat_type) = arg {
            if let syn::Type::Path(type_path) = &*pat_type.ty {
                if let Some(segment) = type_path.path.segments.last() {
                    if segment.ident == "Context" {
                        if let syn::PathArguments::AngleBracketed(args) = &segment.arguments {
                            if let Some(syn::GenericArgument::Type(syn::Type::Path(ty))) =
                                args.args.first()
                            {
                                return ty.path.segments.last().map(|s| s.ident.to_string());
                            }
                        }
                    }
                }
            }
        }
        None
    }

    /// Checks if an expression is a `...key()` or `...key`
    fn is_key_access(&self, expr: &Expr) -> bool {
        match expr {
            Expr::MethodCall(ExprMethodCall { method, .. }) => method == "key",
            Expr::Field(ExprField { member, .. }) => {
                if let syn::Member::Named(ident) = member {
                    ident == "key"
                } else {
                    false
                }
            }
            _ => false,
        }
    }
}

impl<'ast> Visit<'ast> for AcVisitor {
    /// --- Pass 1: Find Account Structs (for Sub-factors 1 & 2) ---
    fn visit_item_struct(&mut self, node: &'ast ItemStruct) {
        let is_accounts_struct = node.attrs.iter().any(|attr| {
            attr.path().is_ident("derive") && quote!(#attr).to_string().contains("Accounts")
        });

        if is_accounts_struct {
            let struct_name = node.ident.to_string();
            let mut struct_stats = ConstraintParserStats::default();

            for field in &node.fields {
                for attr in &field.attrs {
                    if attr.path().is_ident("account") {
                        if let Ok(parsed_stats) = attr.parse_args_with(ConstraintParserStats::parse)
                        {
                            if parsed_stats.has_close {
                                struct_stats.has_close = true;
                            }
                            struct_stats.auth_constraint_count +=
                                parsed_stats.auth_constraint_count;
                        }
                    }
                }
            }
            self.struct_stats.insert(struct_name, struct_stats);
        }
        // We don't need to visit inside the struct
    }

    /// --- Pass 2: Find Handlers & Manual Checks (Sub-factor 3) ---
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let is_anchor_handler = matches!(node.vis, syn::Visibility::Public(_))
            && node.sig.inputs.len() > 0
            && self.is_context_arg(&node.sig.inputs[0]);

        if is_anchor_handler {
            self.metrics.total_handlers_found += 1;
            let handler_name = node.sig.ident.to_string();

            // --- Check Gated Handlers & Closes (from Pass 1 data) ---
            if let Some(struct_name) = self.get_context_struct_name(&node.sig.inputs[0]) {
                if let Some(stats) = self.struct_stats.get(&struct_name) {
                    if stats.auth_constraint_count > 0 {
                        self.metrics.total_gated_handlers += 1;
                    }
                    if stats.has_close {
                        self.metrics.total_account_closes += 1;
                        self.metrics
                            .handlers_with_closes
                            .insert(handler_name.clone());
                    }
                }
            }

            // --- Find Manual Checks (Sub-factor 3) ---
            self.current_handler_name = Some(handler_name.clone());
            self.manual_checks_in_handler = 0;

            // Visit the function body
            visit::visit_item_fn(self, node);

            // Aggregate manual check results
            if self.manual_checks_in_handler > 0 {
                self.metrics.total_manual_checks += self.manual_checks_in_handler;
                self.metrics
                    .handlers_with_manual_checks
                    .insert(handler_name);
            }

            // Clear context
            self.current_handler_name = None;
        } else {
            visit::visit_item_fn(self, node);
        }
    }

    /// --- Find Manual Checks: `if ...key() != ...key` ---
    fn visit_expr_binary(&mut self, node: &'ast ExprBinary) {
        // Only check inside a handler
        if self.current_handler_name.is_some() {
            // Look for `!=`
            if matches!(node.op, BinOp::Ne(_)) {
                // Check if left or right side is a `.key` or `.key()`
                if self.is_key_access(&node.left) || self.is_key_access(&node.right) {
                    log::warn!(
                        "🔍 AC DEBUG: Found potential manual check in handler '{}': {}",
                        self.current_handler_name.as_ref().unwrap(),
                        quote!(#node)
                    );
                    self.manual_checks_in_handler += 1;
                }
            }
        }
        visit::visit_expr_binary(self, node);
    }
}

/// Main driver function to run the analysis
pub fn calculate_workspace_privileged_roles(
    workspace_path: &PathBuf,
    selected_files: &[String],
) -> Result<PrivilegedRolesMetrics, Box<dyn std::error::Error>> {
    log::info!("🔍 ACCESS CONTROL DEBUG: Starting analysis...");

    let mut visitor = AcVisitor::default();

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);
        if !full_path.exists() || !full_path.is_file() {
            continue;
        }

        match std::fs::read_to_string(&full_path) {
            Ok(content) => match parse_file(&content) {
                Ok(ast) => {
                    visitor.visit_file(&ast);
                }
                Err(e) => {
                    log::warn!("Failed to parse AST for {:?}: {}", full_path, e);
                }
            },
            Err(e) => {
                log::warn!("Failed to read file {:?}: {}", full_path, e);
            }
        }
    }

    // --- Final Calculation and Normalization (0-100) ---
    let metrics = &mut visitor.metrics;

    // 1. Calculate the Raw Score (from summary: 5x penalty for anti-patterns)
    let raw_risk_score = (metrics.total_gated_handlers as f64 * 1.0)
        + (metrics.total_manual_checks as f64 * 5.0)
        + (metrics.total_account_closes as f64 * 5.0);

    // 2. Normalize to 0-100
    let upper_bound = 50.0; // 10 manual checks, or 10 closes, or a mix = 100% risk
    let factor = (raw_risk_score / upper_bound) * 100.0;

    metrics.ac_factor = factor.min(100.0); // Cap at 100
    metrics.raw_risk_score = raw_risk_score;

    log::info!(
        "🔍 ACCESS CONTROL DEBUG: Analysis complete. Factor: {:.2}",
        metrics.ac_factor
    );

    Ok(visitor.metrics)
}
