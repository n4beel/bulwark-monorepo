//! Input/Constraint Surface Analysis Factor
//!
//! This module analyzes the "input attack surface" of a smart contract by
//! measuring three key, high-risk sub-factors:
//! 1. Account Struct Length (max/avg): The "width" of inputs.
//! 2. Risky Numeric Params: Handlers taking user-controlled numbers.
//! 3. Constraint Count: The total validation logic surface.

use quote::quote;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use syn::{
    parse::{Parse, ParseStream},
    parse_file,
    visit::Visit,
    Expr, ItemFn, ItemStruct, Path, Token,
};

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct InputConstraintMetrics {
    // --- The 4 Sub-Factors (Raw Data) ---
    /// Sub-factor 1: List of all account struct lengths found
    pub account_struct_lengths: Vec<usize>,
    /// Sub-factor 2: Count of handlers taking risky numeric params
    pub total_amount_handlers: u32,
    /// Sub-factor 3: Total number of constraints found
    pub total_constraints: u32,
    /// Sub-factor 3 (Breakdown): Audit data for constraints
    pub constraint_breakdown: HashMap<String, u32>,

    // --- Final Score (0-100) ---
    /// The final normalized risk factor
    pub input_constraint_factor: f64,

    // --- Helper Metrics (for Audibility) ---
    pub total_handlers_found: u32,
    pub max_accounts_per_handler: usize,
    pub avg_accounts_per_handler: f64,
    pub raw_risk_score: f64,
}

impl InputConstraintMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "inputConstraintFactor": self.input_constraint_factor,
            "rawRiskScore": self.raw_risk_score,
            "totalConstraints": self.total_constraints,
            "totalAmountHandlers": self.total_amount_handlers,
            "maxAccountsPerHandler": self.max_accounts_per_handler,
            "avgAccountsPerHandler": self.avg_accounts_per_handler,
            "totalHandlersFound": self.total_handlers_found,
            "accountStructLengths": self.account_struct_lengths,
            "constraintBreakdown": self.constraint_breakdown,
        })
    }
}

/// Helper struct for the custom constraint parser
struct ConstraintParser {
    count: u32,
    breakdown: HashMap<String, u32>,
}

impl Parse for ConstraintParser {
    /// This is a custom AST parser for the *inside* of `#[account(...)]`
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let mut count = 0;
        let mut breakdown = HashMap::new();

        while !input.is_empty() {
            // 1. Parse the key (e.g., `mut`, `has_one`, `token::mint`)
            let key_path: Path = input.parse()?;
            let key = quote!(#key_path).to_string().replace(' ', "");

            // 2. Increment counts
            count += 1;
            *breakdown.entry(key).or_insert(0) += 1;

            // 3. If there is an `=`, parse and discard the value
            if input.peek(Token![=]) {
                let _: Token![=] = input.parse()?; // Consume the =
                let _: Expr = input.parse()?; // Consume the expression
            }

            // 4. If there is a comma, consume it and continue
            if input.peek(Token![,]) {
                let _: Token![,] = input.parse()?;
            }
        }

        Ok(Self { count, breakdown })
    }
}

/// Visitor to implement the Two-Pass strategy
#[derive(Debug, Default)]
struct InputConstraintVisitor {
    // --- Raw Data Collection ---
    account_struct_lengths: Vec<usize>,
    total_constraints: u32,
    constraint_breakdown: HashMap<String, u32>,
    total_amount_handlers: u32,
    total_handlers_found: u32,
}

impl InputConstraintVisitor {
    /// Checks if a type is a risky numeric primitive
    fn is_numeric_type(&self, ty: &syn::Type) -> bool {
        if let syn::Type::Path(type_path) = ty {
            if type_path.path.segments.len() == 1 {
                let ident = type_path.path.segments[0].ident.to_string();
                matches!(
                    ident.as_str(),
                    "u8" | "u16" | "u32" | "u64" | "u128" | "i8" | "i16" | "i32" | "i64" | "i128"
                )
            } else {
                false
            }
        } else {
            false
        }
    }

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
}

impl<'ast> Visit<'ast> for InputConstraintVisitor {
    /// --- Pass 1: Find Instruction Handlers (for Sub-factor 2) ---
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        // A simple, robust heuristic for an Anchor handler:
        // 1. It's public
        // 2. Its *first* argument is `Context<...>`
        let is_anchor_handler = matches!(node.vis, syn::Visibility::Public(_))
            && node.sig.inputs.len() > 0
            && self.is_context_arg(&node.sig.inputs[0]);

        if is_anchor_handler {
            log::info!(
                "🔍 INPUT CONSTRAINTS DEBUG: Found Anchor handler: {}",
                node.sig.ident
            );
            self.total_handlers_found += 1;
            let mut has_numeric_param = false;

            // Iterate all params *except* the first (which is ctx)
            for arg in node.sig.inputs.iter().skip(1) {
                if let syn::FnArg::Typed(pat_type) = arg {
                    if self.is_numeric_type(&pat_type.ty) {
                        has_numeric_param = true;
                    }
                }
            }

            if has_numeric_param {
                self.total_amount_handlers += 1;
            }
        }

        syn::visit::visit_item_fn(self, node);
    }

    /// --- Pass 2: Find Account Structs (for Sub-factors 1 & 4) ---
    fn visit_item_struct(&mut self, node: &'ast ItemStruct) {
        // Check if this is an `#[derive(Accounts)]` struct
        let is_accounts_struct = node.attrs.iter().any(|attr| {
            attr.path().is_ident("derive") && quote!(#attr).to_string().contains("Accounts")
        });

        if is_accounts_struct {
            log::info!(
                "🔍 INPUT CONSTRAINTS DEBUG: Found Accounts struct: {}",
                node.ident
            );
            // --- Found Sub-factor 1: Account Struct Length ---
            let len = node.fields.len();
            if len > 0 {
                self.account_struct_lengths.push(len);
            }

            // --- Find Sub-factor 4: Constraint Count ---
            for field in &node.fields {
                for attr in &field.attrs {
                    if attr.path().is_ident("account") {
                        // Use our custom AST parser to robustly count constraints
                        match attr.parse_args_with(ConstraintParser::parse) {
                            Ok(parsed_constraints) => {
                                self.total_constraints += parsed_constraints.count;
                                for (key, num) in parsed_constraints.breakdown {
                                    *self.constraint_breakdown.entry(key).or_insert(0) += num;
                                }
                            }
                            Err(e) => {
                                log::warn!("Failed to parse #[account] attribute: {}", e);
                            }
                        }
                    }
                }
            }
        }

        syn::visit::visit_item_struct(self, node);
    }
}

/// Main driver function to run the analysis
pub fn calculate_workspace_input_constraints(
    workspace_path: &PathBuf,
    selected_files: &[String],
) -> Result<InputConstraintMetrics, Box<dyn std::error::Error>> {
    log::info!("🔍 INPUT CONSTRAINTS DEBUG: Starting analysis...");

    let mut visitor = InputConstraintVisitor::default();

    // Analyze each selected file
    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);
        if !full_path.exists() || !full_path.is_file() {
            log::warn!("File does not exist or is not a file: {:?}", full_path);
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

    // 1. Get raw metrics from visitor
    let total_constraints = visitor.total_constraints as f64;
    let total_amount_handlers = visitor.total_amount_handlers as f64;
    let max_accounts_len = visitor
        .account_struct_lengths
        .iter()
        .max()
        .cloned()
        .unwrap_or(0) as f64;
    let avg_accounts_len = if !visitor.account_struct_lengths.is_empty() {
        visitor.account_struct_lengths.iter().sum::<usize>() as f64
            / visitor.account_struct_lengths.len() as f64
    } else {
        0.0
    };

    // 2. Calculate the Raw Score using our weights
    let raw_risk_score =
        (total_constraints * 1.0) + (max_accounts_len * 3.0) + (total_amount_handlers * 5.0);

    // 3. Normalize to 0-100
    let upper_bound = 150.0; // Our 100% risk cap
    let factor = (raw_risk_score / upper_bound) * 100.0;
    let final_factor = factor.min(100.0); // Cap at 100

    // 4. Populate the final metrics struct
    let metrics = InputConstraintMetrics {
        account_struct_lengths: visitor.account_struct_lengths,
        total_amount_handlers: visitor.total_amount_handlers,
        total_constraints: visitor.total_constraints,
        constraint_breakdown: visitor.constraint_breakdown,
        input_constraint_factor: final_factor,
        total_handlers_found: visitor.total_handlers_found,
        max_accounts_per_handler: max_accounts_len as usize,
        avg_accounts_per_handler: avg_accounts_len,
        raw_risk_score,
    };

    log::info!(
        "🔍 INPUT CONSTRAINTS DEBUG: Analysis complete. Factor: {:.2}",
        metrics.input_constraint_factor
    );
    Ok(metrics)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_simple_account_struct() {
        let code = r#"
            #[derive(Accounts)]
            pub struct Initialize<'info> {
                #[account(mut)]
                pub user: Signer<'info>,
                #[account(init, payer = user, space = 8 + 32)]
                pub vault: Account<'info, Vault>,
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_input_constraints(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should find 1 account struct with 2 fields
        assert_eq!(result.account_struct_lengths.len(), 1);
        assert_eq!(result.account_struct_lengths[0], 2);
        assert_eq!(result.max_accounts_per_handler, 2);
        assert_eq!(result.avg_accounts_per_handler, 2.0);
    }

    #[test]
    fn test_constraint_counting() {
        let code = r#"
            use anchor_lang::prelude::*;

            #[derive(Accounts)]
            pub struct Transfer<'info> {
                #[account(mut, has_one = owner)]
                pub from: Account<'info, TokenAccount>,
                #[account(mut)]
                pub to: Account<'info, TokenAccount>,
                #[account(signer)]
                pub owner: Signer<'info>,
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_input_constraints(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should find constraints: mut, has_one, owner, mut, signer
        assert!(result.total_constraints >= 5);
        assert!(result.constraint_breakdown.contains_key("mut"));
        assert!(result.constraint_breakdown.contains_key("has_one"));
        assert!(result.constraint_breakdown.contains_key("signer"));
    }

    #[test]
    fn test_numeric_handler_detection() {
        let code = r#"
            use anchor_lang::prelude::*;

            pub fn transfer_amount(ctx: Context<Transfer>, amount: u64) -> Result<()> {
                // Handler with numeric parameter
                Ok(())
            }

            pub fn simple_handler(ctx: Context<Simple>) -> Result<()> {
                // Handler without numeric parameter
                Ok(())
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_input_constraints(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should find 2 handlers, 1 with numeric params
        assert_eq!(result.total_handlers_found, 2);
        assert_eq!(result.total_amount_handlers, 1);
    }

    #[test]
    fn test_factor_calculation() {
        let code = r#"
            use anchor_lang::prelude::*;

            #[derive(Accounts)]
            pub struct Complex<'info> {
                #[account(mut, has_one = owner, constraint = user.key() == owner.key())]
                pub account1: Account<'info, TokenAccount>,
                #[account(mut, signer)]
                pub account2: Account<'info, TokenAccount>,
                #[account(init, payer = user, space = 8 + 32)]
                pub account3: Account<'info, TokenAccount>,
                #[account(mut)]
                pub account4: Account<'info, TokenAccount>,
                #[account(mut)]
                pub account5: Account<'info, TokenAccount>,
            }

            pub fn complex_handler(ctx: Context<Complex>, amount: u64, price: u32) -> Result<()> {
                Ok(())
            }
        "#;

        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test.rs");
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_input_constraints(
            &temp_dir,
            &[test_file.file_name().unwrap().to_string_lossy().to_string()],
        )
        .unwrap();

        // Should have a positive factor
        assert!(result.input_constraint_factor > 0.0);
        assert!(result.input_constraint_factor <= 100.0);

        // Should have raw risk score
        assert!(result.raw_risk_score > 0.0);

        // Should find the account struct
        assert_eq!(result.account_struct_lengths.len(), 1);
        assert_eq!(result.account_struct_lengths[0], 5);

        // Should find the handler with numeric params
        assert_eq!(result.total_handlers_found, 1);
        assert_eq!(result.total_amount_handlers, 1);
    }
}
