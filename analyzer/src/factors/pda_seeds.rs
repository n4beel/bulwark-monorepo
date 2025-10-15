//! PDA Seed Surface & Ownership analysis for Anchor smart contracts
//!
//! This module analyzes Anchor-specific PDA (Program Derived Address) patterns
//! to count accounts with seeds and assess the complexity of the account graph.

use std::collections::HashSet;
use std::path::PathBuf;
use syn::{visit::Visit, Attribute, Item};

#[derive(Debug, Clone, Default)]
pub struct PdaMetrics {
    /// Total number of PDA accounts with seeds
    pub total_pda_accounts: usize,

    /// Number of PDA accounts with simple (constant) seeds
    pub simple_seed_pdas: usize,

    /// Number of PDA accounts with complex (dynamic) seeds
    pub complex_seed_pdas: usize,

    /// Number of distinct seed patterns found
    pub distinct_seed_patterns: usize,

    /// Set of unique seed patterns (for complexity assessment)
    pub seed_patterns: HashSet<String>,

    /// Number of accounts with multiple seed components
    pub multi_seed_pdas: usize,

    /// Number of accounts with dynamic seed components (variables, function calls)
    pub dynamic_seed_pdas: usize,
}

impl PdaMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalPdaAccounts": self.total_pda_accounts,
            "simpleSeedPdas": self.simple_seed_pdas,
            "complexSeedPdas": self.complex_seed_pdas,
            "distinctSeedPatterns": self.distinct_seed_patterns,
            "seedPatterns": self.seed_patterns.iter().collect::<Vec<_>>(),
            "multiSeedPdas": self.multi_seed_pdas,
            "dynamicSeedPdas": self.dynamic_seed_pdas
        })
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
                                    metrics.simple_seed_pdas += file_metrics.simple_seed_pdas;
                                    metrics.complex_seed_pdas += file_metrics.complex_seed_pdas;
                                    metrics.multi_seed_pdas += file_metrics.multi_seed_pdas;
                                    metrics.dynamic_seed_pdas += file_metrics.dynamic_seed_pdas;

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

    log::info!(
        "🔍 PDA SEEDS DEBUG: Analysis complete: {} files analyzed, {} total PDA accounts, {} distinct seed patterns",
        analyzed_files,
        metrics.total_pda_accounts,
        metrics.distinct_seed_patterns
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

    Ok(visitor.metrics)
}

/// Visitor to analyze PDA seed patterns
struct PdaSeedsVisitor {
    metrics: PdaMetrics,
}

impl PdaSeedsVisitor {
    fn new() -> Self {
        Self {
            metrics: PdaMetrics::default(),
        }
    }

    /// Check if an attribute contains PDA seeds
    fn has_pda_seeds(&self, attr: &Attribute) -> bool {
        let attr_str = format!("{}", quote::quote! { #attr });
        attr_str.contains("seeds") && attr_str.contains("account")
    }

    /// Analyze seeds attribute to determine complexity
    fn analyze_seeds_attribute(&self, attr: &Attribute) -> Option<SeedAnalysis> {
        if !self.has_pda_seeds(attr) {
            return None;
        }

        let attr_str = format!("{}", quote::quote! { #attr });

        // Extract seeds content from the attribute
        if let Some(seeds_start) = attr_str.find("seeds") {
            if let Some(bracket_start) = attr_str[seeds_start..].find('[') {
                let seeds_content = &attr_str[seeds_start + bracket_start..];
                if let Some(bracket_end) = seeds_content.find(']') {
                    let seeds_str = &seeds_content[1..bracket_end];

                    return Some(self.analyze_seeds_string(seeds_str));
                }
            }
        }

        None
    }

    /// Analyze the seeds string to determine complexity
    fn analyze_seeds_string(&self, seeds_str: &str) -> SeedAnalysis {
        let mut seed_count = 0;
        let mut has_dynamic = false;
        let mut has_variables = false;
        let mut has_function_calls = false;

        // Count seed components (split by comma, but be careful with nested structures)
        let components = self.parse_seed_components(seeds_str);
        seed_count = components.len();

        for component in &components {
            let component = component.trim();

            // Check for dynamic patterns
            if component.contains(".key()")
                || component.contains(".to_bytes()")
                || component.contains(".as_ref()")
                || component.contains("&")
            {
                has_dynamic = true;
            }

            // Check for variables (not just string literals)
            if !component.starts_with("b\"") && !component.starts_with("\"") {
                has_variables = true;
            }

            // Check for function calls
            if component.contains("(") && component.contains(")") {
                has_function_calls = true;
            }
        }

        let complexity = if has_dynamic || has_variables || has_function_calls {
            SeedComplexity::Complex
        } else {
            SeedComplexity::Simple
        };

        SeedAnalysis {
            count: seed_count,
            complexity,
            has_dynamic,
            has_variables,
            has_function_calls,
        }
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

#[derive(Debug, Clone)]
enum SeedComplexity {
    Simple,
    Complex,
}

#[derive(Debug, Clone)]
struct SeedAnalysis {
    count: usize,
    complexity: SeedComplexity,
    has_dynamic: bool,
    has_variables: bool,
    has_function_calls: bool,
}

impl<'ast> Visit<'ast> for PdaSeedsVisitor {
    fn visit_item(&mut self, item: &'ast Item) {
        match item {
            Item::Struct(item_struct) => {
                // Check struct fields for PDA seeds
                for field in &item_struct.fields {
                    for attr in &field.attrs {
                        if let Some(seed_analysis) = self.analyze_seeds_attribute(attr) {
                            self.metrics.total_pda_accounts += 1;

                            match seed_analysis.complexity {
                                SeedComplexity::Simple => {
                                    self.metrics.simple_seed_pdas += 1;
                                    self.metrics
                                        .seed_patterns
                                        .insert("simple_seeds".to_string());
                                }
                                SeedComplexity::Complex => {
                                    self.metrics.complex_seed_pdas += 1;
                                    self.metrics
                                        .seed_patterns
                                        .insert("complex_seeds".to_string());
                                }
                            }

                            if seed_analysis.count > 1 {
                                self.metrics.multi_seed_pdas += 1;
                                self.metrics.seed_patterns.insert("multi_seeds".to_string());
                            }

                            if seed_analysis.has_dynamic {
                                self.metrics.dynamic_seed_pdas += 1;
                                self.metrics
                                    .seed_patterns
                                    .insert("dynamic_seeds".to_string());
                            }

                            if seed_analysis.has_variables {
                                self.metrics
                                    .seed_patterns
                                    .insert("variable_seeds".to_string());
                            }

                            if seed_analysis.has_function_calls {
                                self.metrics
                                    .seed_patterns
                                    .insert("function_call_seeds".to_string());
                            }

                            log::debug!(
                                "🔍 PDA SEEDS DEBUG: Found PDA account with {} seeds, complexity: {:?}",
                                seed_analysis.count,
                                seed_analysis.complexity
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
        assert_eq!(result.simple_seed_pdas, 1);
        assert_eq!(result.complex_seed_pdas, 0);
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
        assert_eq!(result.simple_seed_pdas, 0);
        assert_eq!(result.complex_seed_pdas, 1);
        assert_eq!(result.multi_seed_pdas, 1);
        assert_eq!(result.dynamic_seed_pdas, 1);
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
        assert_eq!(result.simple_seed_pdas, 1);
        assert_eq!(result.complex_seed_pdas, 1);
    }
}
