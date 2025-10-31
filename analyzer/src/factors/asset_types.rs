//! Asset Types Factor
//!
//! This module analyzes asset standards by focusing on identifying distinct asset
//! standards (SPL-Token, SPL-Token-2022, Metaplex NFT, Custom) via reliable
//! AST-based type and import detection.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{visit::Visit, ExprCall, ItemEnum, ItemStruct, Type, UseTree};

/// Metrics for Asset Types Factor
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct AssetTypesMetrics {
    /// Flags indicating presence of standards
    pub uses_spl_token: bool,
    pub uses_spl_token_2022: bool,
    pub uses_metaplex_nft: bool,
    pub custom_asset_definitions: u32, // Count of user-defined 'Asset' structs/enums

    /// Final Score (0-100) based on variety
    pub distinct_asset_standards: u32,
    pub asset_types_factor: f64,

    /// Auditability Helpers
    pub detected_standard_indicators: HashMap<String, Vec<String>>, // e.g., {"SPL_TOKEN": ["token::Mint", "spl_token import"]}
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl AssetTypesMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "assetTypesFactor": self.asset_types_factor,
            "distinctAssetStandards": self.distinct_asset_standards,
            "usesSplToken": self.uses_spl_token,
            "usesSplToken2022": self.uses_spl_token_2022,
            "usesMetaplexNft": self.uses_metaplex_nft,
            "customAssetDefinitions": self.custom_asset_definitions,
            "detectedStandardIndicators": self.detected_standard_indicators,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped,
        })
    }
}

/// Visitor for detecting asset standards via AST analysis
struct AssetTypesVisitor {
    metrics: AssetTypesMetrics,
}

impl AssetTypesVisitor {
    fn new() -> Self {
        Self {
            metrics: AssetTypesMetrics::default(),
        }
    }

    /// Record a standard indicator for auditability
    fn record_standard_indicator(&mut self, standard: &str, indicator: &str) {
        self.metrics
            .detected_standard_indicators
            .entry(standard.to_string())
            .or_insert_with(Vec::new)
            .push(indicator.to_string());
    }

    /// Build the full path from a use tree
    fn build_use_path(&self, node: &UseTree) -> String {
        match node {
            UseTree::Path(path_tree) => {
                let mut path = path_tree.ident.to_string();
                let sub_path = self.build_use_path(&path_tree.tree);
                if !sub_path.is_empty() {
                    path.push_str("::");
                    path.push_str(&sub_path);
                }
                path
            }
            UseTree::Name(name_tree) => name_tree.ident.to_string(),
            UseTree::Group(group_tree) => {
                // For groups, we'll just return the first item for simplicity
                if let Some(first) = group_tree.items.first() {
                    self.build_use_path(first)
                } else {
                    String::new()
                }
            }
            _ => String::new(),
        }
    }

    /// Check if a path indicates SPL Token usage
    fn is_spl_token_path(&self, path_str: &str) -> bool {
        path_str.contains("spl_token::")
            || path_str.contains("anchor_spl::token::")
            || path_str.contains("token::Mint")
            || path_str.contains("token::TokenAccount")
            || path_str.contains("token::TokenProgram")
    }

    /// Check if a path indicates SPL Token 2022 usage
    fn is_spl_token_2022_path(&self, path_str: &str) -> bool {
        path_str.contains("spl_token_2022::")
            || path_str.contains("token_2022::")
            || path_str.contains("token_2022::Mint")
            || path_str.contains("token_2022::TokenAccount")
    }

    /// Check if a path indicates Metaplex NFT usage
    fn is_metaplex_nft_path(&self, path_str: &str) -> bool {
        path_str.contains("metaplex::")
            || path_str.contains("mpl_token_metadata::")
            || path_str.contains("mpl_token_metadata")
            || path_str.contains("metaplex_token_metadata")
    }

    /// Check if a type path indicates asset standard usage
    fn analyze_type_path(&mut self, type_path: &syn::TypePath) {
        let path_str = type_path
            .path
            .segments
            .iter()
            .map(|s| s.ident.to_string())
            .collect::<Vec<_>>()
            .join("::");

        if self.is_spl_token_path(&path_str) && !self.metrics.uses_spl_token {
            self.metrics.uses_spl_token = true;
            self.record_standard_indicator("SPL_TOKEN", &path_str);
        }

        if self.is_spl_token_2022_path(&path_str) && !self.metrics.uses_spl_token_2022 {
            self.metrics.uses_spl_token_2022 = true;
            self.record_standard_indicator("SPL_TOKEN_2022", &path_str);
        }

        if self.is_metaplex_nft_path(&path_str) && !self.metrics.uses_metaplex_nft {
            self.metrics.uses_metaplex_nft = true;
            self.record_standard_indicator("METAPLEX_NFT", &path_str);
        }
    }
}

impl<'ast> Visit<'ast> for AssetTypesVisitor {
    /// Detect asset standards via use statements
    fn visit_use_tree(&mut self, node: &'ast UseTree) {
        // Build the full path by traversing the use tree
        let path_str = self.build_use_path(node);
        if !path_str.is_empty() {
            // Check for SPL Token 2022 imports (check this first to avoid false positives)
            if (path_str.contains("spl_token_2022") || path_str.contains("token_2022"))
                && !self.metrics.uses_spl_token_2022
            {
                self.metrics.uses_spl_token_2022 = true;
                self.record_standard_indicator("SPL_TOKEN_2022", &format!("import: {}", path_str));
            }
            // Check for SPL Token imports (only if not already detected as Token 2022)
            else if (path_str.contains("spl_token") || path_str.contains("anchor_spl::token"))
                && !self.metrics.uses_spl_token
            {
                self.metrics.uses_spl_token = true;
                self.record_standard_indicator("SPL_TOKEN", &format!("import: {}", path_str));
            }

            // Check for Metaplex NFT imports
            if (path_str.contains("metaplex") || path_str.contains("mpl_token_metadata"))
                && !self.metrics.uses_metaplex_nft
            {
                self.metrics.uses_metaplex_nft = true;
                self.record_standard_indicator("METAPLEX_NFT", &format!("import: {}", path_str));
            }
        }

        // Continue visiting
        syn::visit::visit_use_tree(self, node);
    }

    /// Detect asset standards via struct definitions
    fn visit_item_struct(&mut self, node: &'ast ItemStruct) {
        let struct_name = node.ident.to_string();

        // Check for custom asset definitions
        if struct_name == "Asset" || struct_name.contains("Asset") {
            self.metrics.custom_asset_definitions += 1;
            self.record_standard_indicator("CUSTOM_ASSET", &format!("struct: {}", struct_name));
        }

        // Analyze struct fields for asset standard types
        for field in &node.fields {
            let syn::Field { ty, .. } = field;
            if let Type::Path(type_path) = ty {
                self.analyze_type_path(type_path);
            }
        }

        // Continue visiting
        syn::visit::visit_item_struct(self, node);
    }

    /// Detect asset standards via enum definitions
    fn visit_item_enum(&mut self, node: &'ast ItemEnum) {
        let enum_name = node.ident.to_string();

        // Check for custom asset type definitions
        if enum_name == "AssetType" || enum_name.contains("Asset") {
            self.metrics.custom_asset_definitions += 1;
            self.record_standard_indicator("CUSTOM_ASSET", &format!("enum: {}", enum_name));
        }

        // Continue visiting
        syn::visit::visit_item_enum(self, node);
    }

    /// Detect asset standards via function calls (CPIs)
    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let syn::Expr::Path(path_expr) = &*node.func {
            let path_str = path_expr
                .path
                .segments
                .iter()
                .map(|s| s.ident.to_string())
                .collect::<Vec<_>>()
                .join("::");

            // Check for SPL Token CPI calls
            if self.is_spl_token_path(&path_str) && !self.metrics.uses_spl_token {
                self.metrics.uses_spl_token = true;
                self.record_standard_indicator("SPL_TOKEN", &format!("cpi: {}", path_str));
            }

            // Check for SPL Token 2022 CPI calls
            if self.is_spl_token_2022_path(&path_str) && !self.metrics.uses_spl_token_2022 {
                self.metrics.uses_spl_token_2022 = true;
                self.record_standard_indicator("SPL_TOKEN_2022", &format!("cpi: {}", path_str));
            }

            // Check for Metaplex NFT CPI calls
            if self.is_metaplex_nft_path(&path_str) && !self.metrics.uses_metaplex_nft {
                self.metrics.uses_metaplex_nft = true;
                self.record_standard_indicator("METAPLEX_NFT", &format!("cpi: {}", path_str));
            }
        }

        // Continue visiting
        syn::visit::visit_expr_call(self, node);
    }
}

/// Calculate asset types metrics for workspace
pub fn calculate_workspace_asset_types(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<AssetTypesMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 ASSET TYPES DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut visitor = AssetTypesVisitor::new();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            log::warn!("🔍 ASSET TYPES DEBUG: File does not exist: {:?}", full_path);
            files_skipped += 1;
            continue;
        }

        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!(
                "🔍 ASSET TYPES DEBUG: Skipping non-Rust file: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        log::info!("🔍 ASSET TYPES DEBUG: Analyzing file: {:?}", full_path);

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

    // Calculate final metrics
    let mut metrics = visitor.metrics;
    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    // Count distinct asset standards
    metrics.distinct_asset_standards = metrics.uses_spl_token as u32
        + metrics.uses_spl_token_2022 as u32
        + metrics.uses_metaplex_nft as u32
        + if metrics.custom_asset_definitions > 0 {
            1
        } else {
            0
        };

    // Calculate final factor (0-100) based on variety
    // 0 standards = 0%, 1 = 25%, 2 = 50%, 3 = 75%, 4 = 100%
    metrics.asset_types_factor = match metrics.distinct_asset_standards {
        0 => 0.0,
        1 => 25.0,
        2 => 50.0,
        3 => 75.0,
        4 => 100.0,
        _ => 100.0, // Cap at 100%
    };

    log::info!(
        "🔍 ASSET TYPES DEBUG: Analysis complete. Files analyzed: {}, Files skipped: {}",
        files_analyzed,
        files_skipped
    );

    Ok(metrics)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spl_token_detection() {
        let code = r#"
        use anchor_spl::token::{Mint, TokenAccount};
        
        pub fn transfer_tokens(ctx: Context<TransferTokens>) -> Result<()> {
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = AssetTypesVisitor::new();
        visitor.visit_file(&ast);

        // Calculate final metrics
        visitor.metrics.distinct_asset_standards = visitor.metrics.uses_spl_token as u32
            + visitor.metrics.uses_spl_token_2022 as u32
            + visitor.metrics.uses_metaplex_nft as u32
            + if visitor.metrics.custom_asset_definitions > 0 {
                1
            } else {
                0
            };

        // Calculate final factor (0-100) based on variety
        visitor.metrics.asset_types_factor = match visitor.metrics.distinct_asset_standards {
            0 => 0.0,
            1 => 25.0,
            2 => 50.0,
            3 => 75.0,
            4 => 100.0,
            _ => 100.0, // Cap at 100%
        };

        assert!(visitor.metrics.uses_spl_token);
        assert_eq!(visitor.metrics.distinct_asset_standards, 1);
        assert_eq!(visitor.metrics.asset_types_factor, 25.0);
    }

    #[test]
    fn test_spl_token_2022_detection() {
        let code = r#"
        use spl_token_2022::token_2022::Mint;
        
        pub fn mint_tokens(ctx: Context<MintTokens>) -> Result<()> {
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = AssetTypesVisitor::new();
        visitor.visit_file(&ast);

        // Calculate final metrics
        visitor.metrics.distinct_asset_standards = visitor.metrics.uses_spl_token as u32
            + visitor.metrics.uses_spl_token_2022 as u32
            + visitor.metrics.uses_metaplex_nft as u32
            + if visitor.metrics.custom_asset_definitions > 0 {
                1
            } else {
                0
            };

        // Calculate final factor (0-100) based on variety
        visitor.metrics.asset_types_factor = match visitor.metrics.distinct_asset_standards {
            0 => 0.0,
            1 => 25.0,
            2 => 50.0,
            3 => 75.0,
            4 => 100.0,
            _ => 100.0, // Cap at 100%
        };

        assert!(visitor.metrics.uses_spl_token_2022);
        assert_eq!(visitor.metrics.distinct_asset_standards, 1);
        assert_eq!(visitor.metrics.asset_types_factor, 25.0);
    }

    #[test]
    fn test_metaplex_nft_detection() {
        let code = r#"
        use mpl_token_metadata::state::Metadata;
        
        pub fn create_nft(ctx: Context<CreateNft>) -> Result<()> {
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = AssetTypesVisitor::new();
        visitor.visit_file(&ast);

        // Calculate final metrics
        visitor.metrics.distinct_asset_standards = visitor.metrics.uses_spl_token as u32
            + visitor.metrics.uses_spl_token_2022 as u32
            + visitor.metrics.uses_metaplex_nft as u32
            + if visitor.metrics.custom_asset_definitions > 0 {
                1
            } else {
                0
            };

        // Calculate final factor (0-100) based on variety
        visitor.metrics.asset_types_factor = match visitor.metrics.distinct_asset_standards {
            0 => 0.0,
            1 => 25.0,
            2 => 50.0,
            3 => 75.0,
            4 => 100.0,
            _ => 100.0, // Cap at 100%
        };

        assert!(visitor.metrics.uses_metaplex_nft);
        assert_eq!(visitor.metrics.distinct_asset_standards, 1);
        assert_eq!(visitor.metrics.asset_types_factor, 25.0);
    }

    #[test]
    fn test_custom_asset_detection() {
        let code = r#"
        pub struct Asset {
            pub id: u64,
            pub value: u64,
        }
        
        pub enum AssetType {
            Token,
            Nft,
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = AssetTypesVisitor::new();
        visitor.visit_file(&ast);

        // Calculate final metrics
        visitor.metrics.distinct_asset_standards = visitor.metrics.uses_spl_token as u32
            + visitor.metrics.uses_spl_token_2022 as u32
            + visitor.metrics.uses_metaplex_nft as u32
            + if visitor.metrics.custom_asset_definitions > 0 {
                1
            } else {
                0
            };

        // Calculate final factor (0-100) based on variety
        visitor.metrics.asset_types_factor = match visitor.metrics.distinct_asset_standards {
            0 => 0.0,
            1 => 25.0,
            2 => 50.0,
            3 => 75.0,
            4 => 100.0,
            _ => 100.0, // Cap at 100%
        };

        assert_eq!(visitor.metrics.custom_asset_definitions, 2);
        assert_eq!(visitor.metrics.distinct_asset_standards, 1);
        assert_eq!(visitor.metrics.asset_types_factor, 25.0);
    }

    #[test]
    fn test_multiple_standards() {
        let code = r#"
        use anchor_spl::token::Mint;
        use spl_token_2022::token_2022::Mint as Mint2022;
        use mpl_token_metadata::state::Metadata;
        
        pub struct CustomAsset {
            pub id: u64,
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = AssetTypesVisitor::new();
        visitor.visit_file(&ast);

        // Calculate final metrics
        visitor.metrics.distinct_asset_standards = visitor.metrics.uses_spl_token as u32
            + visitor.metrics.uses_spl_token_2022 as u32
            + visitor.metrics.uses_metaplex_nft as u32
            + if visitor.metrics.custom_asset_definitions > 0 {
                1
            } else {
                0
            };

        // Calculate final factor (0-100) based on variety
        visitor.metrics.asset_types_factor = match visitor.metrics.distinct_asset_standards {
            0 => 0.0,
            1 => 25.0,
            2 => 50.0,
            3 => 75.0,
            4 => 100.0,
            _ => 100.0, // Cap at 100%
        };

        assert!(visitor.metrics.uses_spl_token);
        assert!(visitor.metrics.uses_spl_token_2022);
        assert!(visitor.metrics.uses_metaplex_nft);
        assert_eq!(visitor.metrics.custom_asset_definitions, 1);
        assert_eq!(visitor.metrics.distinct_asset_standards, 4);
        assert_eq!(visitor.metrics.asset_types_factor, 100.0);
    }

    #[test]
    fn test_no_asset_standards() {
        let code = r#"
        pub fn regular_function(ctx: Context<RegularFunction>) -> Result<()> {
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = AssetTypesVisitor::new();
        visitor.visit_file(&ast);

        // Calculate final metrics
        visitor.metrics.distinct_asset_standards = visitor.metrics.uses_spl_token as u32
            + visitor.metrics.uses_spl_token_2022 as u32
            + visitor.metrics.uses_metaplex_nft as u32
            + if visitor.metrics.custom_asset_definitions > 0 {
                1
            } else {
                0
            };

        // Calculate final factor (0-100) based on variety
        visitor.metrics.asset_types_factor = match visitor.metrics.distinct_asset_standards {
            0 => 0.0,
            1 => 25.0,
            2 => 50.0,
            3 => 75.0,
            4 => 100.0,
            _ => 100.0, // Cap at 100%
        };

        assert!(!visitor.metrics.uses_spl_token);
        assert!(!visitor.metrics.uses_spl_token_2022);
        assert!(!visitor.metrics.uses_metaplex_nft);
        assert_eq!(visitor.metrics.custom_asset_definitions, 0);
        assert_eq!(visitor.metrics.distinct_asset_standards, 0);
        assert_eq!(visitor.metrics.asset_types_factor, 0.0);
    }
}
