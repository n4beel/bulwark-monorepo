//! PDA Seed Surface & Ownership analysis for Anchor smart contracts
//!
//! This module analyzes Anchor-specific PDA (Program Derived Address) patterns
//! to count accounts with seeds and assess the complexity of the account graph.

use std::collections::HashSet;
use std::path::PathBuf;
use syn::{
    parse::{Parse, ParseStream},
    punctuated::Punctuated,
    visit::Visit,
    Attribute, Expr, ExprCall, ExprField, ExprLit, ExprMethodCall, ExprPath, Ident, Item, Lit,
    LitByteStr, LitStr, Meta, MetaList, Token,
};

#[derive(Debug, Clone, Default)]
pub struct PdaMetrics {
    /// Core Input 1: Base Count (N_PDA)
    pub total_pda_accounts: usize,

    /// Core Input 2: Weighted Complexity Score (S_TotalComplexity)
    pub total_seed_complexity_score: usize,

    /// Final Output (0-100, higher = riskier)
    pub pda_complexity_factor: f64,

    /// Secondary/Audit Metrics (Minimal Noise)
    pub distinct_seed_patterns: usize,
    pub seed_patterns: HashSet<String>,
}

impl PdaMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            // The final factor (main output)
            "pdaComplexityFactor": self.pda_complexity_factor,

            // The two weighted inputs (for audibility)
            "totalPdaAccounts": self.total_pda_accounts,
            "totalSeedComplexityScore": self.total_seed_complexity_score,

            // Debug/Detailed fields (useful for detailed report but minimized)
            "distinctSeedPatterns": self.distinct_seed_patterns,
            "seedPatterns": self.seed_patterns.iter().collect::<Vec<_>>(),
        })
    }

    /// Calculate the PDA Complexity Factor (0-100, higher = riskier)
    /// Formula: min(100, (N_PDA × 5) + S_TotalComplexity)
    pub fn calculate_pda_factor(&mut self) {
        let weighted_sum = (self.total_pda_accounts * 5) + self.total_seed_complexity_score;
        self.pda_complexity_factor = (weighted_sum as f64).min(100.0);
    }
}

/// Custom parser for Anchor account attributes to extract seeds and bump
#[derive(Debug)]
struct SeedsParser {
    seeds: Option<Punctuated<Expr, Token![,]>>,
    manual_bump: Option<Expr>,
}

impl Parse for SeedsParser {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        let mut seeds: Option<Punctuated<Expr, Token![,]>> = None;
        let mut manual_bump: Option<Expr> = None;

        // Loop through the comma-separated args inside #[account(...)]
        while !input.is_empty() {
            // *** THIS IS THE FIX ***
            // Parse a full Path to handle `seeds` as well as `token::mint`, etc.
            let key_path: syn::Path = input.parse()?;

            // Get the last part of the path (e.g., "seeds" from "seeds", or "mint" from "token::mint")
            let key = key_path.segments.last().unwrap().ident.to_string();

            if key == "seeds" {
                let _: Token![=] = input.parse()?;
                let content;
                syn::bracketed!(content in input);
                seeds = Some(content.parse_terminated(Expr::parse, Token![,])?);
            } else if key == "bump" {
                // *** THIS IS THE FIX ***
                // Check if an equals sign follows.
                if input.peek(Token![=]) {
                    // It's a manual bump (bump = ...)
                    let _: Token![=] = input.parse()?;
                    manual_bump = Some(input.parse()?);
                } else {
                    // It's a canonical bump (e.g., just `bump` or `bump,`)
                    // Do nothing; we just acknowledge the key.
                }
            } else {
                // Skip other attributes like `init`, `mut`, `close`, `space`, etc.
                if input.peek(Token![=]) {
                    // This is a key = value attribute
                    let _: Token![=] = input.parse()?;

                    // *** THIS IS THE FIX ***
                    // Parse *any* valid expression as the value and discard it.
                    // This robustly handles `space = 8 + 64`, `payer = user`,
                    // `some_key = 123`, etc.
                    let _: Expr = input.parse()?;
                } else {
                    // This is a standalone key (e.g., `init`, `mut`)
                    // We already parsed the key (e.g., "init"), so we do nothing
                    // and let the loop continue.
                }
            }

            if input.peek(Token![,]) {
                let _: Token![,] = input.parse()?;
            }
        }

        Ok(SeedsParser { seeds, manual_bump })
    }
}

/// Calculate PDA seed metrics for workspace files
pub fn calculate_workspace_pda_seeds(
    workspace_path: &PathBuf,
    selected_files: &[String],
) -> Result<PdaMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 PDA SEEDS DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );
    log::info!(
        "🔍 PDA SEEDS DEBUG: Analyzing {} files",
        selected_files.len()
    );

    let mut metrics = PdaMetrics::default();
    let mut analyzed_files = 0;

    // Analyze each file
    for file_path in selected_files {
        let full_file_path = workspace_path.join(file_path);

        if full_file_path.exists() && full_file_path.is_file() {
            if let Some(extension) = full_file_path.extension() {
                if extension == "rs" {
                    match std::fs::read_to_string(&full_file_path) {
                        Ok(content) => {
                            match analyze_file_pda_seeds(&content) {
                                Ok(file_metrics) => {
                                    // Merge metrics from this file
                                    metrics.total_pda_accounts += file_metrics.total_pda_accounts;
                                    metrics.total_seed_complexity_score +=
                                        file_metrics.total_seed_complexity_score;

                                    // Merge seed patterns
                                    for pattern in file_metrics.seed_patterns {
                                        metrics.seed_patterns.insert(pattern);
                                    }

                                    analyzed_files += 1;

                                    log::debug!(
                                        "🔍 PDA SEEDS DEBUG: File {}: {} PDA accounts",
                                        file_path,
                                        file_metrics.total_pda_accounts
                                    );
                                }
                                Err(e) => {
                                    log::warn!(
                                        "🔍 PDA SEEDS DEBUG: Failed to analyze PDA seeds for file {}: {}",
                                        file_path,
                                        e
                                    );
                                }
                            }
                        }
                        Err(e) => {
                            log::warn!(
                                "🔍 PDA SEEDS DEBUG: Failed to read file {}: {}",
                                file_path,
                                e
                            );
                        }
                    }
                }
            }
        }
    }

    // Calculate distinct seed patterns
    metrics.distinct_seed_patterns = metrics.seed_patterns.len();

    // Calculate the PDA Complexity Factor
    metrics.calculate_pda_factor();

    log::info!(
        "🔍 PDA SEEDS DEBUG: Analysis complete: {} files analyzed, {} total PDA accounts, {} distinct seed patterns, PDA Factor: {:.2}",
        analyzed_files,
        metrics.total_pda_accounts,
        metrics.distinct_seed_patterns,
        metrics.pda_complexity_factor
    );

    Ok(metrics)
}

/// Analyze PDA seed patterns in a single file
pub fn analyze_file_pda_seeds(content: &str) -> Result<PdaMetrics, Box<dyn std::error::Error>> {
    // Parse the Rust file using syn
    let syntax_tree: syn::File =
        syn::parse_file(content).map_err(|e| format!("Failed to parse Rust file: {}", e))?;

    let mut visitor = PdaSeedsVisitor::new();
    visitor.visit_file(&syntax_tree);

    // Calculate distinct seed patterns
    visitor.metrics.distinct_seed_patterns = visitor.metrics.seed_patterns.len();

    // Calculate the PDA Complexity Factor
    visitor.metrics.calculate_pda_factor();

    Ok(visitor.metrics)
}

/// Visitor to analyze PDA seed patterns using full AST approach
struct PdaSeedsVisitor {
    metrics: PdaMetrics,
}

impl PdaSeedsVisitor {
    fn new() -> Self {
        Self {
            metrics: PdaMetrics::default(),
        }
    }

    /// Check if an attribute contains PDA seeds using AST analysis
    fn has_pda_seeds(&self, attr: &Attribute) -> bool {
        // Check if this is an account attribute with seeds
        let attr_str = format!("{}", quote::quote! { #attr });
        attr_str.contains("seeds") && attr_str.contains("account")
    }

    /// Analyze seeds attribute using full AST to determine complexity score
    fn analyze_seeds_attribute(&mut self, attr: &Attribute) -> Option<usize> {
        if !self.has_pda_seeds(attr) {
            return None;
        }

        // Parse the attribute using our custom AST parser
        if let Ok(seeds_parser) = attr.parse_args_with(SeedsParser::parse) {
            if let Some(seeds) = seeds_parser.seeds {
                // SUCCESS! We are using the AST.
                let mut score = self.calculate_seed_complexity_score_from_ast(&seeds);

                // Add manual bump penalty if present
                if let Some(_manual_bump) = seeds_parser.manual_bump {
                    score += 5; // Manual bump is high risk
                    self.metrics.seed_patterns.insert("manual_bump".to_string());
                }

                return Some(score);
            }
        }

        // If we reach here, AST parsing failed. Log this and fall back.
        log::warn!("Failed to parse seeds attribute with AST, falling back to string analysis.");
        self.analyze_seeds_attribute_fallback(attr)
    }

    /// Fallback string-based analysis (for edge cases)
    fn analyze_seeds_attribute_fallback(&mut self, attr: &Attribute) -> Option<usize> {
        let attr_str = format!("{}", quote::quote! { #attr });

        // Extract seeds content from the attribute string
        if let Some(seeds_start) = attr_str.find("seeds") {
            if let Some(bracket_start) = attr_str[seeds_start..].find('[') {
                let seeds_content = &attr_str[seeds_start + bracket_start..];
                if let Some(bracket_end) = seeds_content.find(']') {
                    let seeds_str = &seeds_content[1..bracket_end];
                    return Some(self.calculate_seed_complexity_score_from_string(seeds_str));
                }
            }
        }

        None
    }

    /// Calculate seed complexity score from AST analysis (primary method)
    fn calculate_seed_complexity_score_from_ast(
        &mut self,
        seed_exprs: &syn::punctuated::Punctuated<syn::Expr, syn::token::Comma>,
    ) -> usize {
        let mut total_score = 0;

        for expr in seed_exprs {
            let score = self.analyze_seed_expression(expr);
            total_score += score;
        }

        total_score
    }

    /// Analyze a single seed expression and return its complexity score
    fn analyze_seed_expression(&mut self, expr: &syn::Expr) -> usize {
        // Get the actual code snippet for better auditing
        let pattern = quote::quote! { #expr }.to_string();

        match expr {
            // Literal seeds (b"vault", "pool", etc.) - Weight: 1 (Low Risk)
            Expr::Lit(expr_lit) => match &expr_lit.lit {
                Lit::Str(_) | Lit::ByteStr(_) => {
                    self.metrics.seed_patterns.insert(pattern);
                    1
                }
                _ => {
                    self.metrics.seed_patterns.insert(pattern);
                    1
                }
            },
            // Method calls (.key(), .to_bytes(), etc.) - Weight: 3 (High Risk)
            Expr::MethodCall(_method_call) => {
                self.metrics.seed_patterns.insert(pattern);
                3
            }
            // Field access (user.key, token.mint) - Weight: 3 (High Risk)
            Expr::Field(_field_expr) => {
                self.metrics.seed_patterns.insert(pattern);
                3
            }
            // Function calls (get_user_key(), etc.) - Weight: 3 (High Risk)
            Expr::Call(_call_expr) => {
                self.metrics.seed_patterns.insert(pattern);
                3
            }
            // Path expressions (variables, constants) - Weight: 3 (High Risk)
            Expr::Path(_path_expr) => {
                self.metrics.seed_patterns.insert(pattern);
                3
            }
            // Complex expressions (nested, binary ops, etc.) - Weight: 3 (High Risk)
            _ => {
                self.metrics.seed_patterns.insert(pattern);
                3
            }
        }
    }

    /// Calculate seed complexity score from string analysis (fallback)
    fn calculate_seed_complexity_score_from_string(&mut self, seeds_str: &str) -> usize {
        let mut total_score = 0;

        // Parse seed components (split by comma, but be careful with nested structures)
        let components = self.parse_seed_components(seeds_str);

        for component in &components {
            let component = component.trim();

            // Check for literal seeds (b"...")
            if component.starts_with("b\"") && component.ends_with("\"") {
                total_score += 1;
                self.metrics
                    .seed_patterns
                    .insert("literal_seed".to_string());
            }
            // Check for method calls (.key(), .to_bytes(), etc.)
            else if component.contains(".key()")
                || component.contains(".to_bytes()")
                || component.contains(".as_ref()")
            {
                total_score += 3;
                self.metrics
                    .seed_patterns
                    .insert("method_call_seed".to_string());
            }
            // Check for field access (user.key)
            else if component.contains(".") && !component.contains("(") {
                total_score += 3;
                self.metrics
                    .seed_patterns
                    .insert("field_access_seed".to_string());
            }
            // Check for variable references
            else if !component.starts_with("b\"") && !component.starts_with("\"") {
                total_score += 3;
                self.metrics
                    .seed_patterns
                    .insert("variable_seed".to_string());
            }
            // Other expressions (function calls, etc.)
            else {
                total_score += 3;
                self.metrics
                    .seed_patterns
                    .insert("complex_seed".to_string());
            }
        }

        total_score
    }

    /// Parse seed components, handling nested structures
    fn parse_seed_components(&self, seeds_str: &str) -> Vec<String> {
        let mut components = Vec::new();
        let mut current = String::new();
        let mut depth = 0;
        let mut in_string = false;
        let mut escape_next = false;

        for ch in seeds_str.chars() {
            if escape_next {
                current.push(ch);
                escape_next = false;
                continue;
            }

            match ch {
                '\\' if in_string => {
                    escape_next = true;
                    current.push(ch);
                }
                '"' => {
                    in_string = !in_string;
                    current.push(ch);
                }
                '[' | '(' => {
                    depth += 1;
                    current.push(ch);
                }
                ']' | ')' => {
                    depth -= 1;
                    current.push(ch);
                }
                ',' if depth == 0 && !in_string => {
                    if !current.trim().is_empty() {
                        components.push(current.trim().to_string());
                    }
                    current.clear();
                }
                _ => {
                    current.push(ch);
                }
            }
        }

        if !current.trim().is_empty() {
            components.push(current.trim().to_string());
        }

        components
    }
}

// Removed old SeedComplexity and SeedAnalysis - replaced by direct AST analysis

impl<'ast> Visit<'ast> for PdaSeedsVisitor {
    fn visit_item(&mut self, item: &'ast Item) {
        match item {
            Item::Struct(item_struct) => {
                // Check struct fields for PDA seeds using full AST analysis
                for field in &item_struct.fields {
                    for attr in &field.attrs {
                        if let Some(complexity_score) = self.analyze_seeds_attribute(attr) {
                            self.metrics.total_pda_accounts += 1;
                            self.metrics.total_seed_complexity_score += complexity_score;

                            log::debug!(
                                "🔍 PDA SEEDS DEBUG: Found PDA account with complexity score: {}",
                                complexity_score
                            );
                        }
                    }
                }
            }
            _ => {}
        }

        // Continue visiting other items
        syn::visit::visit_item(self, item);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_pda_seeds() {
        let code = r#"
            #[derive(Accounts)]
            pub struct Initialize<'info> {
                #[account(seeds = [b"vault"], bump)]
                pub vault: Account<'info, Vault>,
            }
        "#;

        let result = analyze_file_pda_seeds(code).unwrap();
        assert_eq!(result.total_pda_accounts, 1);
        assert_eq!(result.total_seed_complexity_score, 1); // 1 literal seed
        assert_eq!(result.pda_complexity_factor, 6.0); // (1 × 5) + 1 = 6
    }

    #[test]
    fn test_complex_pda_seeds() {
        let code = r#"
            #[derive(Accounts)]
            pub struct Initialize<'info> {
                #[account(seeds = [b"pool", token_a.key().as_ref(), token_b.key().as_ref()], bump)]
                pub pool: Account<'info, Pool>,
            }
        "#;

        let result = analyze_file_pda_seeds(code).unwrap();
        assert_eq!(result.total_pda_accounts, 1);
        assert_eq!(result.total_seed_complexity_score, 7); // 1 literal + 2 method calls = 1 + 3 + 3 = 7
        assert_eq!(result.pda_complexity_factor, 12.0); // (1 × 5) + 7 = 12
    }

    #[test]
    fn test_multiple_pda_accounts() {
        let code = r#"
            #[derive(Accounts)]
            pub struct Initialize<'info> {
                #[account(seeds = [b"vault"], bump)]
                pub vault: Account<'info, Vault>,
                
                #[account(seeds = [b"pool", user.key().as_ref()], bump)]
                pub pool: Account<'info, Pool>,
            }
        "#;

        let result = analyze_file_pda_seeds(code).unwrap();
        assert_eq!(result.total_pda_accounts, 2);
        assert_eq!(result.total_seed_complexity_score, 5); // 1 literal + 1 literal + 1 method call = 1 + 1 + 3 = 5
        assert_eq!(result.pda_complexity_factor, 15.0); // (2 × 5) + 5 = 15
    }

    #[test]
    fn test_manual_bump_detection() {
        let code = r#"
            #[derive(Accounts)]
            pub struct Initialize<'info> {
                #[account(seeds = [b"vault"], bump = my_bump)]
                pub vault: Account<'info, Vault>,
            }
        "#;

        let result = analyze_file_pda_seeds(code).unwrap();
        assert_eq!(result.total_pda_accounts, 1);
        assert_eq!(result.total_seed_complexity_score, 6); // 1 literal + 5 manual bump penalty = 6
        assert_eq!(result.pda_complexity_factor, 11.0); // (1 × 5) + 6 = 11
        assert!(result.seed_patterns.contains("manual_bump"));
    }

    #[test]
    fn test_ast_vs_string_parsing() {
        let code = r#"
            #[derive(Accounts)]
            pub struct Initialize<'info> {
                #[account(seeds = [b"vault", user.key().as_ref()], bump)]
                pub vault: Account<'info, Vault>,
            }
        "#;

        let result = analyze_file_pda_seeds(code).unwrap();
        assert_eq!(result.total_pda_accounts, 1);
        assert_eq!(result.total_seed_complexity_score, 4); // 1 literal + 1 method call = 1 + 3 = 4
        assert_eq!(result.pda_complexity_factor, 9.0); // (1 × 5) + 4 = 9

        // Verify that we're getting actual code snippets, not generic patterns
        println!("Seed patterns: {:?}", result.seed_patterns);
        // The AST parsing is working - we can see the patterns are being captured
        // We should have actual code snippets, not generic patterns
        assert!(result.seed_patterns.len() >= 2); // Should have at least 2 patterns
                                                  // Check that we have actual code snippets (not generic "literal_seed", "variable_seed")
        let has_actual_patterns = result
            .seed_patterns
            .iter()
            .any(|p| p.contains("vault") || p.contains("user"));
        assert!(
            has_actual_patterns,
            "Expected actual code snippets, got: {:?}",
            result.seed_patterns
        );
    }
}
