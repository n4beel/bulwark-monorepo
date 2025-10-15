//! Cross-Program Invocation (CPI) analysis for Anchor smart contracts
//!
//! This module analyzes Anchor-specific CPI patterns to count cross-program invocations
//! and assess the integration surface and complexity of external program dependencies.

use std::collections::HashSet;
use std::path::PathBuf;
use syn::{visit::Visit, Expr, ExprCall, ExprMethodCall};

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

    /// CPI complexity score (based on program diversity and call types)
    pub cpi_complexity_score: f64,
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
            "cpiComplexityScore": self.cpi_complexity_score
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

        // Higher complexity for more programs and more signed calls
        self.cpi_complexity_score = program_diversity * 2.0 + signed_ratio * 10.0;
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

    /// Check if an expression is a CPI call
    fn is_cpi_call(&self, expr: &Expr) -> bool {
        match expr {
            Expr::MethodCall(method_call) => {
                // Check for Anchor program method calls
                self.is_anchor_program_call(method_call)
            }
            Expr::Call(call) => {
                // Check for direct invoke calls
                self.is_invoke_call(call)
            }
            _ => false,
        }
    }

    /// Check if a method call is an Anchor program CPI
    fn is_anchor_program_call(&self, method_call: &ExprMethodCall) -> bool {
        let method_name = method_call.method.to_string();

        // Common Anchor program methods that indicate CPIs
        let cpi_methods = [
            "transfer",
            "transfer_checked",
            "mint_to",
            "mint_to_checked",
            "burn",
            "burn_checked",
            "close_account",
            "initialize_account",
            "initialize_account2",
            "initialize_account3",
            "initialize_mint",
            "create_account",
            "assign",
            "allocate",
            "transfer_lamports",
            "create_associated_token_account",
            "sync_native",
            "set_authority",
            "approve",
            "approve_checked",
            "revoke",
            "freeze_account",
            "thaw_account",
            "sync_native",
            "get_account_data_size",
        ];

        cpi_methods.contains(&method_name.as_str())
    }

    /// Check if a call expression is a direct invoke call
    fn is_invoke_call(&self, call: &ExprCall) -> bool {
        if let Expr::Path(path) = &*call.func {
            if let Some(ident) = path.path.get_ident() {
                let func_name = ident.to_string();
                return matches!(
                    func_name.as_str(),
                    "invoke" | "invoke_signed" | "invoke_signed_unchecked"
                );
            }
        }
        false
    }

    /// Analyze a CPI call to determine its type and target program
    fn analyze_cpi_call(&mut self, expr: &Expr) {
        self.metrics.total_cpi_calls += 1;

        match expr {
            Expr::MethodCall(method_call) => {
                self.analyze_method_cpi(method_call);
            }
            Expr::Call(call) => {
                self.analyze_invoke_call(call);
            }
            _ => {}
        }
    }

    /// Analyze a method-based CPI call
    fn analyze_method_cpi(&mut self, method_call: &ExprMethodCall) {
        // Determine if this is a signed CPI (most Anchor CPIs are signed)
        let is_signed = self.is_signed_cpi_call(method_call);

        if is_signed {
            self.metrics.signed_cpi_calls += 1;
        } else {
            self.metrics.unsigned_cpi_calls += 1;
        }

        // Determine program type based on method and context
        let program_type = self.determine_program_type(method_call);
        match program_type {
            ProgramType::Token => self.metrics.token_program_cpis += 1,
            ProgramType::System => self.metrics.system_program_cpis += 1,
            ProgramType::AssociatedToken => self.metrics.associated_token_program_cpis += 1,
            ProgramType::Other => self.metrics.other_program_cpis += 1,
        }

        // Add program target
        self.metrics
            .program_targets
            .insert(program_type.to_string());
    }

    /// Analyze a direct invoke call
    fn analyze_invoke_call(&mut self, call: &ExprCall) {
        if let Expr::Path(path) = &*call.func {
            if let Some(ident) = path.path.get_ident() {
                let func_name = ident.to_string();

                match func_name.as_str() {
                    "invoke" => {
                        self.metrics.unsigned_cpi_calls += 1;
                        self.metrics.other_program_cpis += 1;
                    }
                    "invoke_signed" | "invoke_signed_unchecked" => {
                        self.metrics.signed_cpi_calls += 1;
                        self.metrics.other_program_cpis += 1;
                    }
                    _ => {}
                }

                self.metrics
                    .program_targets
                    .insert("native_invoke".to_string());
            }
        }
    }

    /// Determine if a CPI call is signed (has seeds/signatures)
    fn is_signed_cpi_call(&self, method_call: &ExprMethodCall) -> bool {
        // Most Anchor program method calls are signed CPIs
        // We can also check for specific patterns in the arguments
        method_call.args.len() > 0
    }

    /// Determine the program type based on method call context
    fn determine_program_type(&self, method_call: &ExprMethodCall) -> ProgramType {
        let method_name = method_call.method.to_string();

        // Token program methods
        if matches!(
            method_name.as_str(),
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
        ) {
            return ProgramType::Token;
        }

        // System program methods
        if matches!(
            method_name.as_str(),
            "create_account" | "assign" | "allocate" | "transfer_lamports"
        ) {
            return ProgramType::System;
        }

        // Associated token program methods
        if matches!(
            method_name.as_str(),
            "create_associated_token_account" | "get_account_data_size"
        ) {
            return ProgramType::AssociatedToken;
        }

        ProgramType::Other
    }
}

impl<'ast> Visit<'ast> for CpiVisitor {
    fn visit_expr(&mut self, expr: &'ast Expr) {
        if self.is_cpi_call(expr) {
            self.analyze_cpi_call(expr);
        }

        // Continue visiting other expressions
        syn::visit::visit_expr(self, expr);
    }
}

#[derive(Debug, Clone)]
enum ProgramType {
    Token,
    System,
    AssociatedToken,
    Other,
}

impl ProgramType {
    fn to_string(&self) -> String {
        match self {
            ProgramType::Token => "token_program".to_string(),
            ProgramType::System => "system_program".to_string(),
            ProgramType::AssociatedToken => "associated_token_program".to_string(),
            ProgramType::Other => "other_program".to_string(),
        }
    }
}
