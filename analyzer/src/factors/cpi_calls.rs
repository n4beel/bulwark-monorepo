//! Cross-Program Invocation (CPI) analysis for Anchor smart contracts
//!
//! This module analyzes Anchor-specific CPI patterns to count cross-program invocations
//! and assess the integration surface and complexity of external program dependencies.

use quote::quote;
use std::collections::HashSet;
use std::path::PathBuf;
use syn::{visit::Visit, Expr};

#[derive(Debug, Clone, Default)]
pub struct CpiMetrics {
    /// Total number of CPI calls detected
    pub total_cpi_calls: usize,

    /// Number of signed CPI calls (with seeds/signatures)
    pub signed_cpi_calls: usize,

    /// Number of unsigned CPI calls (simple program calls)
    pub unsigned_cpi_calls: usize,

    /// Number of unique programs being called
    pub unique_programs: usize,

    /// Set of unique program targets
    pub program_targets: HashSet<String>,

    /// Number of token program CPIs
    pub token_program_cpis: usize,

    /// Number of system program CPIs
    pub system_program_cpis: usize,

    /// Number of associated token program CPIs
    pub associated_token_program_cpis: usize,

    /// Number of other program CPIs
    pub other_program_cpis: usize,

    /// Raw, unbounded complexity score
    pub cpi_complexity_score_raw: f64,

    /// Final Normalized Factor (0-100)
    pub cpi_factor: f64,
}

impl CpiMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalCpiCalls": self.total_cpi_calls,
            "signedCpiCalls": self.signed_cpi_calls,
            "unsignedCpiCalls": self.unsigned_cpi_calls,
            "uniquePrograms": self.unique_programs,
            "programTargets": self.program_targets.iter().collect::<Vec<_>>(),
            "tokenProgramCpis": self.token_program_cpis,
            "systemProgramCpis": self.system_program_cpis,
            "associatedTokenProgramCpis": self.associated_token_program_cpis,
            "otherProgramCpis": self.other_program_cpis,
            "cpiComplexityScoreRaw": self.cpi_complexity_score_raw,
            "cpiFactor": self.cpi_factor
        })
    }

    /// Calculate CPI complexity score based on program diversity and call types
    fn calculate_complexity_score(&mut self) {
        let program_diversity = self.unique_programs as f64;
        let signed_ratio = if self.total_cpi_calls > 0 {
            self.signed_cpi_calls as f64 / self.total_cpi_calls as f64
        } else {
            0.0
        };

        // 1. Calculate the raw, unbounded score
        self.cpi_complexity_score_raw = program_diversity * 2.0 + signed_ratio * 10.0;

        // 2. Define the upper bound for 100% risk
        let upper_bound = 30.0; // 10 unique programs + 100% signed ratio

        // 3. Normalize the raw score to the 0-100 factor
        if self.cpi_complexity_score_raw == 0.0 {
            self.cpi_factor = 0.0;
        } else {
            self.cpi_factor = (self.cpi_complexity_score_raw / upper_bound) * 100.0;
            self.cpi_factor = self.cpi_factor.min(100.0); // Cap at 100
        }
    }
}

/// Calculate CPI metrics for workspace files
pub fn calculate_workspace_cpi_calls(
    workspace_path: &PathBuf,
    selected_files: &[String],
) -> Result<CpiMetrics, Box<dyn std::error::Error>> {
    let mut metrics = CpiMetrics::default();
    let mut analyzed_files = 0;

    log::info!(
        "🔍 CPI CALLS DEBUG: Starting CPI analysis for {} files in workspace: {}",
        selected_files.len(),
        workspace_path.display()
    );

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if full_path.exists() && full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!(
                "🔍 CPI CALLS DEBUG: Analyzing file: {}",
                full_path.display()
            );

            match std::fs::read_to_string(&full_path) {
                Ok(content) => {
                    match analyze_file_cpi_calls(&content) {
                        Ok(file_metrics) => {
                            // Merge metrics from this file
                            metrics.total_cpi_calls += file_metrics.total_cpi_calls;
                            metrics.signed_cpi_calls += file_metrics.signed_cpi_calls;
                            metrics.unsigned_cpi_calls += file_metrics.unsigned_cpi_calls;
                            metrics.token_program_cpis += file_metrics.token_program_cpis;
                            metrics.system_program_cpis += file_metrics.system_program_cpis;
                            metrics.associated_token_program_cpis +=
                                file_metrics.associated_token_program_cpis;
                            metrics.other_program_cpis += file_metrics.other_program_cpis;

                            // Merge program targets
                            for target in file_metrics.program_targets {
                                metrics.program_targets.insert(target);
                            }

                            analyzed_files += 1;

                            log::info!(
                                "🔍 CPI CALLS DEBUG: File {} - {} total CPIs, {} signed, {} unsigned",
                                file_path,
                                file_metrics.total_cpi_calls,
                                file_metrics.signed_cpi_calls,
                                file_metrics.unsigned_cpi_calls
                            );
                        }
                        Err(e) => {
                            log::warn!(
                                "🔍 CPI CALLS DEBUG: Failed to analyze file {}: {}",
                                file_path,
                                e
                            );
                        }
                    }
                }
                Err(e) => {
                    log::warn!(
                        "🔍 CPI CALLS DEBUG: Failed to read file {}: {}",
                        file_path,
                        e
                    );
                }
            }
        }
    }

    // Calculate final metrics
    metrics.unique_programs = metrics.program_targets.len();
    metrics.calculate_complexity_score();

    log::info!(
        "🔍 CPI CALLS DEBUG: Analysis complete: {} files analyzed, {} total CPI calls, {} unique programs",
        analyzed_files,
        metrics.total_cpi_calls,
        metrics.unique_programs
    );

    Ok(metrics)
}

/// Analyze CPI calls in a single file
pub fn analyze_file_cpi_calls(content: &str) -> Result<CpiMetrics, Box<dyn std::error::Error>> {
    // Parse the Rust file using syn
    let syntax_tree: syn::File =
        syn::parse_file(content).map_err(|e| format!("Failed to parse Rust file: {}", e))?;

    let mut visitor = CpiVisitor::new();
    visitor.visit_file(&syntax_tree);

    // Calculate unique programs for single file analysis
    visitor.metrics.unique_programs = visitor.metrics.program_targets.len();
    visitor.metrics.calculate_complexity_score();

    Ok(visitor.metrics)
}

/// Visitor to analyze CPI call patterns
struct CpiVisitor {
    metrics: CpiMetrics,
}

impl CpiVisitor {
    fn new() -> Self {
        Self {
            metrics: CpiMetrics::default(),
        }
    }

    /// Get a clean string path from a function call expression
    fn get_call_path_string(&self, func_expr: &Expr) -> Option<String> {
        if let Expr::Path(expr_path) = func_expr {
            // Converts `anchor_spl::token::transfer` into "anchor_spl::token::transfer"
            let path_str = quote::quote! { #expr_path }.to_string().replace(' ', "");
            return Some(path_str);
        }
        None
    }

    /// Analyze a CPI path to determine if it's a real CPI and categorize it
    fn analyze_cpi_path(&mut self, path_str: &str) -> bool {
        let mut is_cpi = false;

        // 1. Check for native invoke calls (Highest Confidence)
        if path_str.ends_with("::invoke") || path_str == "invoke" {
            is_cpi = true;
            self.metrics.unsigned_cpi_calls += 1;
            self.metrics
                .program_targets
                .insert("native_invoke".to_string());
            self.metrics.other_program_cpis += 1;
        } else if path_str.ends_with("::invoke_signed")
            || path_str.ends_with("::invoke_signed_unchecked")
            || path_str == "invoke_signed"
        {
            is_cpi = true;
            self.metrics.signed_cpi_calls += 1;
            self.metrics
                .program_targets
                .insert("native_invoke".to_string());
            self.metrics.other_program_cpis += 1;
        }
        // 2. Check for SPL Token Program calls
        else if path_str.contains("::token::")
            || path_str.starts_with("token::")
            || self.is_token_program_function(path_str)
        {
            is_cpi = true;
            self.metrics.signed_cpi_calls += 1; // Anchor SPL helpers are signed
            self.metrics
                .program_targets
                .insert("token_program".to_string());
            self.metrics.token_program_cpis += 1;
        }
        // 3. Check for System Program calls
        else if path_str.contains("::system_program::")
            || path_str.starts_with("system_program::")
            || self.is_system_program_function(path_str)
        {
            is_cpi = true;
            self.metrics.signed_cpi_calls += 1; // Assume signed for risk
            self.metrics
                .program_targets
                .insert("system_program".to_string());
            self.metrics.system_program_cpis += 1;
        }
        // 4. Check for Associated Token Program calls
        else if path_str.contains("::associated_token::")
            || path_str.starts_with("associated_token::")
            || self.is_associated_token_program_function(path_str)
        {
            is_cpi = true;
            self.metrics.signed_cpi_calls += 1; // Assume signed for risk
            self.metrics
                .program_targets
                .insert("associated_token_program".to_string());
            self.metrics.associated_token_program_cpis += 1;
        }

        if is_cpi {
            self.metrics.total_cpi_calls += 1;
        }

        is_cpi
    }

    /// Check if a function name is a token program function
    fn is_token_program_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "transfer"
                | "transfer_checked"
                | "mint_to"
                | "mint_to_checked"
                | "burn"
                | "burn_checked"
                | "close_account"
                | "initialize_account"
                | "initialize_account2"
                | "initialize_account3"
                | "initialize_mint"
                | "approve"
                | "approve_checked"
                | "revoke"
                | "freeze_account"
                | "thaw_account"
                | "sync_native"
                | "set_authority"
        )
    }

    /// Check if a function name is a system program function
    fn is_system_program_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "create_account" | "assign" | "allocate" | "transfer_lamports"
        )
    }

    /// Check if a function name is an associated token program function
    fn is_associated_token_program_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "create_associated_token_account" | "get_account_data_size"
        )
    }
}

impl<'ast> Visit<'ast> for CpiVisitor {
    fn visit_expr(&mut self, expr: &'ast Expr) {
        // 1. Only look for function calls
        if let Expr::Call(call) = expr {
            // 2. Get the function being called
            if let Some(path_str) = self.get_call_path_string(&call.func) {
                // 3. Check if this path is a known CPI
                if self.analyze_cpi_path(&path_str) {
                    // 4. If it's a CPI, we count it and *stop* descending.
                    // This prevents double-counting if a CPI is
                    // passed as an argument to another CPI.
                    return;
                }
            }
        }

        // Continue visiting other expressions
        syn::visit::visit_expr(self, expr);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_native_invoke_detection() {
        let code = r#"
            use solana_program::program::invoke;
            use solana_program::program::invoke_signed;

            pub fn test_function() {
                invoke(&instruction, &accounts);
                invoke_signed(&instruction, &accounts, &signers);
            }
        "#;

        let result = analyze_file_cpi_calls(code).unwrap();
        assert_eq!(result.total_cpi_calls, 2);
        assert_eq!(result.unsigned_cpi_calls, 1);
        assert_eq!(result.signed_cpi_calls, 1);
        assert_eq!(result.other_program_cpis, 2);
        assert!(result.program_targets.contains("native_invoke"));
    }

    #[test]
    fn test_anchor_spl_token_cpi_detection() {
        let code = r#"
            use anchor_spl::token;

            pub fn test_function() {
                token::transfer(ctx, amount);
                token::mint_to(ctx, amount);
            }
        "#;

        let result = analyze_file_cpi_calls(code).unwrap();
        assert_eq!(result.total_cpi_calls, 2);
        assert_eq!(result.signed_cpi_calls, 2);
        assert_eq!(result.token_program_cpis, 2);
        assert!(result.program_targets.contains("token_program"));
    }

    #[test]
    fn test_system_program_cpi_detection() {
        let code = r#"
            use anchor_spl::system_program;

            pub fn test_function() {
                system_program::create_account(ctx);
                system_program::assign(ctx);
            }
        "#;

        let result = analyze_file_cpi_calls(code).unwrap();
        assert_eq!(result.total_cpi_calls, 2);
        assert_eq!(result.signed_cpi_calls, 2);
        assert_eq!(result.system_program_cpis, 2);
        assert!(result.program_targets.contains("system_program"));
    }

    #[test]
    fn test_associated_token_program_cpi_detection() {
        let code = r#"
            use anchor_spl::associated_token;

            pub fn test_function() {
                associated_token::create_associated_token_account(ctx);
            }
        "#;

        let result = analyze_file_cpi_calls(code).unwrap();
        assert_eq!(result.total_cpi_calls, 1);
        assert_eq!(result.signed_cpi_calls, 1);
        assert_eq!(result.associated_token_program_cpis, 1);
        assert!(result.program_targets.contains("associated_token_program"));
    }

    #[test]
    fn test_no_false_positives_from_local_methods() {
        let code = r#"
            struct MyStruct {
                value: u64,
            }

            impl MyStruct {
                pub fn transfer(&mut self, amount: u64) {
                    self.value += amount;
                }
                
                pub fn mint_to(&mut self, amount: u64) {
                    self.value += amount;
                }
            }

            pub fn test_function() {
                let mut my_struct = MyStruct { value: 0 };
                my_struct.transfer(100);
                my_struct.mint_to(50);
            }
        "#;

        let result = analyze_file_cpi_calls(code).unwrap();
        // Should NOT detect local method calls as CPIs
        assert_eq!(result.total_cpi_calls, 0);
        assert_eq!(result.signed_cpi_calls, 0);
        assert_eq!(result.unsigned_cpi_calls, 0);
    }

    #[test]
    fn test_mixed_cpi_types() {
        let code = r#"
            use solana_program::program::invoke;
            use anchor_spl::token;
            use anchor_spl::system_program;

            pub fn test_function() {
                invoke(&instruction, &accounts);
                token::transfer(ctx, amount);
                system_program::create_account(ctx);
            }
        "#;

        let result = analyze_file_cpi_calls(code).unwrap();
        assert_eq!(result.total_cpi_calls, 3);
        assert_eq!(result.unsigned_cpi_calls, 1);
        assert_eq!(result.signed_cpi_calls, 2);
        assert_eq!(result.other_program_cpis, 1);
        assert_eq!(result.token_program_cpis, 1);
        assert_eq!(result.system_program_cpis, 1);
        assert_eq!(result.unique_programs, 3);
    }

    #[test]
    fn test_cpi_complexity_score_calculation() {
        let mut metrics = CpiMetrics::default();
        metrics.total_cpi_calls = 5;
        metrics.signed_cpi_calls = 3;
        metrics.unsigned_cpi_calls = 2;
        metrics.unique_programs = 2;
        metrics.program_targets.insert("token_program".to_string());
        metrics.program_targets.insert("system_program".to_string());

        metrics.calculate_complexity_score();

        // Should have a positive raw score
        assert!(metrics.cpi_complexity_score_raw > 0.0);

        // Should have a normalized factor between 0-100
        assert!(metrics.cpi_factor >= 0.0);
        assert!(metrics.cpi_factor <= 100.0);

        // For 2 programs + 60% signed ratio: (2 * 2) + (0.6 * 10) = 4 + 6 = 10
        // Factor: (10 / 30) * 100 = 33.33
        assert!((metrics.cpi_factor - 33.33).abs() < 0.1);
    }
}
