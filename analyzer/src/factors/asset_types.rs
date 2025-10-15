use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use syn::{visit::Visit, Expr, ExprCall, ItemEnum, ItemFn, ItemStruct, LitStr, UseTree};

/// Metrics for Asset Types and Asset Handling patterns
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct AssetTypesMetrics {
    // Token Asset Types
    pub spl_token_usage: u32,
    pub spl_token_2022_usage: u32,
    pub token_account_patterns: u32,
    pub mint_patterns: u32,
    pub token_transfer_patterns: u32,
    pub token_mint_patterns: u32,
    pub token_burn_patterns: u32,
    pub associated_token_patterns: u32,

    // NFT Asset Types
    pub nft_handling_patterns: u32,
    pub metadata_patterns: u32,
    pub collection_patterns: u32,
    pub nft_mint_patterns: u32,
    pub nft_transfer_patterns: u32,
    pub nft_burn_patterns: u32,

    // Generic Asset Types
    pub generic_asset_handling: u32,
    pub multi_asset_operations: u32,
    pub asset_validation_functions: u32,
    pub asset_enum_definitions: u32,
    pub asset_struct_definitions: u32,

    // External Dependencies
    pub external_asset_dependencies: u32,
    pub token_program_dependencies: u32,
    pub nft_program_dependencies: u32,
    pub metadata_program_dependencies: u32,

    // Asset Function Patterns
    pub asset_specific_functions: u32,
    pub asset_creation_functions: u32,
    pub asset_destruction_functions: u32,
    pub asset_query_functions: u32,
    pub asset_update_functions: u32,

    // Unique Asset Counts
    pub unique_asset_types: u32,
    pub unique_token_types: u32,
    pub unique_nft_types: u32,
    pub unique_generic_asset_types: u32,

    // Detailed pattern breakdown (excluding string literals to avoid false positives)
    pub asset_pattern_breakdown: HashMap<String, u32>,

    // Scoring
    pub asset_complexity_score: f64,
    pub asset_diversity_score: f64,
    pub asset_handling_complexity: f64,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl AssetTypesMetrics {
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::to_value(self).unwrap_or(serde_json::Value::Null)
    }
}

/// Visitor for analyzing asset types and asset handling patterns
struct AssetTypesVisitor {
    current_file_path: String,

    // Token counters
    spl_token_usage: u32,
    spl_token_2022_usage: u32,
    token_account_patterns: u32,
    mint_patterns: u32,
    token_transfer_patterns: u32,
    token_mint_patterns: u32,
    token_burn_patterns: u32,
    associated_token_patterns: u32,

    // NFT counters
    nft_handling_patterns: u32,
    metadata_patterns: u32,
    collection_patterns: u32,
    nft_mint_patterns: u32,
    nft_transfer_patterns: u32,
    nft_burn_patterns: u32,

    // Generic asset counters
    generic_asset_handling: u32,
    multi_asset_operations: u32,
    asset_validation_functions: u32,
    asset_enum_definitions: u32,
    asset_struct_definitions: u32,

    // External dependency counters
    external_asset_dependencies: u32,
    token_program_dependencies: u32,
    nft_program_dependencies: u32,
    metadata_program_dependencies: u32,

    // Asset function counters
    asset_specific_functions: u32,
    asset_creation_functions: u32,
    asset_destruction_functions: u32,
    asset_query_functions: u32,
    asset_update_functions: u32,

    // Pattern tracking
    asset_pattern_counts: HashMap<String, u32>,
    unique_asset_types: HashSet<String>,
    unique_token_types: HashSet<String>,
    unique_nft_types: HashSet<String>,
    unique_generic_asset_types: HashSet<String>,
}

impl AssetTypesVisitor {
    fn new() -> Self {
        Self {
            current_file_path: String::new(),
            spl_token_usage: 0,
            spl_token_2022_usage: 0,
            token_account_patterns: 0,
            mint_patterns: 0,
            token_transfer_patterns: 0,
            token_mint_patterns: 0,
            token_burn_patterns: 0,
            associated_token_patterns: 0,
            nft_handling_patterns: 0,
            metadata_patterns: 0,
            collection_patterns: 0,
            nft_mint_patterns: 0,
            nft_transfer_patterns: 0,
            nft_burn_patterns: 0,
            generic_asset_handling: 0,
            multi_asset_operations: 0,
            asset_validation_functions: 0,
            asset_enum_definitions: 0,
            asset_struct_definitions: 0,
            external_asset_dependencies: 0,
            token_program_dependencies: 0,
            nft_program_dependencies: 0,
            metadata_program_dependencies: 0,
            asset_specific_functions: 0,
            asset_creation_functions: 0,
            asset_destruction_functions: 0,
            asset_query_functions: 0,
            asset_update_functions: 0,
            asset_pattern_counts: HashMap::new(),
            unique_asset_types: HashSet::new(),
            unique_token_types: HashSet::new(),
            unique_nft_types: HashSet::new(),
            unique_generic_asset_types: HashSet::new(),
        }
    }

    /// Record an asset pattern
    fn record_pattern(&mut self, pattern: &str) {
        *self
            .asset_pattern_counts
            .entry(pattern.to_string())
            .or_insert(0) += 1;
    }

    /// Check if a function name indicates token asset handling
    fn is_token_asset_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "mint"
                | "burn"
                | "transfer"
                | "transfer_from"
                | "approve"
                | "create_mint"
                | "create_token_account"
                | "initialize_mint"
                | "initialize_account"
                | "mint_to"
                | "burn_from"
                | "close_account"
                | "freeze_account"
                | "thaw_account"
        ) || func_name.contains("token")
            || func_name.contains("mint")
            || func_name.contains("transfer")
            || func_name.contains("burn")
            || func_name.contains("approve")
    }

    /// Check if a function name indicates NFT asset handling
    fn is_nft_asset_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "create_nft"
                | "mint_nft"
                | "burn_nft"
                | "transfer_nft"
                | "update_metadata"
                | "create_collection"
                | "update_collection"
        ) || func_name.contains("nft")
            || func_name.contains("metadata")
            || func_name.contains("collection")
    }

    /// Check if a function name indicates generic asset handling
    fn is_generic_asset_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "handle_asset"
                | "process_asset"
                | "validate_asset"
                | "check_asset"
                | "create_asset"
                | "destroy_asset"
                | "update_asset"
                | "query_asset"
        ) || func_name.contains("asset")
            || func_name.contains("multi_asset")
            || func_name.contains("asset_type")
    }

    /// Check if a struct name indicates asset definition
    fn is_asset_struct(&self, struct_name: &str) -> bool {
        matches!(
            struct_name,
            "TokenAccount"
                | "Mint"
                | "TokenProgram"
                | "NftAccount"
                | "MetadataAccount"
                | "CollectionAccount"
                | "Asset"
                | "AssetType"
                | "AssetInfo"
        ) || struct_name.contains("Token")
            || struct_name.contains("Mint")
            || struct_name.contains("Nft")
            || struct_name.contains("Metadata")
            || struct_name.contains("Collection")
            || struct_name.contains("Asset")
    }

    /// Check if an enum name indicates asset type definition
    fn is_asset_enum(&self, enum_name: &str) -> bool {
        matches!(
            enum_name,
            "AssetType" | "TokenType" | "NftType" | "CollectionType"
        ) || enum_name.contains("Asset")
            || enum_name.contains("Token")
            || enum_name.contains("Nft")
            || enum_name.contains("Collection")
    }
}

impl<'ast> Visit<'ast> for AssetTypesVisitor {
    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let Expr::Path(path_expr) = &*node.func {
            let path_str = quote::quote!(#path_expr).to_string();

            // Check for token-related calls
            if path_str.contains("mint")
                || path_str.contains("burn")
                || path_str.contains("transfer")
            {
                self.token_transfer_patterns += 1;
                self.record_pattern("token_call");
            }

            // Check for NFT-related calls
            if path_str.contains("nft")
                || path_str.contains("metadata")
                || path_str.contains("collection")
            {
                self.nft_handling_patterns += 1;
                self.record_pattern("nft_call");
            }

            // Check for asset-related calls
            if path_str.contains("asset") {
                self.generic_asset_handling += 1;
                self.record_pattern("asset_call");
            }
        }

        // Continue visiting call
        syn::visit::visit_expr_call(self, node);
    }

    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let func_name = node.sig.ident.to_string();

        // Check for token asset functions
        if self.is_token_asset_function(&func_name) {
            self.asset_specific_functions += 1;
            self.unique_token_types.insert(func_name.clone());
            self.record_pattern(&format!("token_function_{}", func_name));

            if func_name.contains("create") || func_name.contains("mint") {
                self.asset_creation_functions += 1;
            } else if func_name.contains("burn") || func_name.contains("destroy") {
                self.asset_destruction_functions += 1;
            } else if func_name.contains("query") || func_name.contains("get") {
                self.asset_query_functions += 1;
            } else if func_name.contains("update") || func_name.contains("modify") {
                self.asset_update_functions += 1;
            }
        }

        // Check for NFT asset functions
        if self.is_nft_asset_function(&func_name) {
            self.asset_specific_functions += 1;
            self.unique_nft_types.insert(func_name.clone());
            self.record_pattern(&format!("nft_function_{}", func_name));

            if func_name.contains("create") || func_name.contains("mint") {
                self.asset_creation_functions += 1;
            } else if func_name.contains("burn") || func_name.contains("destroy") {
                self.asset_destruction_functions += 1;
            } else if func_name.contains("query") || func_name.contains("get") {
                self.asset_query_functions += 1;
            } else if func_name.contains("update") || func_name.contains("modify") {
                self.asset_update_functions += 1;
            }
        }

        // Check for generic asset functions
        if self.is_generic_asset_function(&func_name) {
            self.asset_specific_functions += 1;
            self.unique_generic_asset_types.insert(func_name.clone());
            self.record_pattern(&format!("generic_asset_function_{}", func_name));

            if func_name.contains("multi") {
                self.multi_asset_operations += 1;
            }
            if func_name.contains("validate") || func_name.contains("check") {
                self.asset_validation_functions += 1;
            }
        }

        // Continue visiting function body
        syn::visit::visit_item_fn(self, node);
    }

    fn visit_item_struct(&mut self, node: &'ast ItemStruct) {
        let struct_name = node.ident.to_string();

        if self.is_asset_struct(&struct_name) {
            self.asset_struct_definitions += 1;
            self.unique_asset_types.insert(struct_name.clone());
            self.record_pattern(&format!("asset_struct_{}", struct_name));

            if struct_name.contains("Token") {
                self.unique_token_types.insert(struct_name.clone());
            } else if struct_name.contains("Nft") || struct_name.contains("Metadata") {
                self.unique_nft_types.insert(struct_name.clone());
            } else if struct_name.contains("Asset") {
                self.unique_generic_asset_types.insert(struct_name.clone());
            }
        }

        // Continue visiting struct
        syn::visit::visit_item_struct(self, node);
    }

    fn visit_item_enum(&mut self, node: &'ast ItemEnum) {
        let enum_name = node.ident.to_string();

        if self.is_asset_enum(&enum_name) {
            self.asset_enum_definitions += 1;
            self.unique_asset_types.insert(enum_name.clone());
            self.record_pattern(&format!("asset_enum_{}", enum_name));

            if enum_name.contains("Token") {
                self.unique_token_types.insert(enum_name.clone());
            } else if enum_name.contains("Nft") {
                self.unique_nft_types.insert(enum_name.clone());
            } else if enum_name.contains("Asset") {
                self.unique_generic_asset_types.insert(enum_name.clone());
            }
        }

        // Continue visiting enum
        syn::visit::visit_item_enum(self, node);
    }

    fn visit_use_tree(&mut self, node: &'ast UseTree) {
        match node {
            UseTree::Path(path_tree) => {
                let path_str = quote::quote!(#path_tree).to_string();

                // Check for SPL Token dependencies
                if path_str.contains("spl_token") {
                    self.spl_token_usage += 1;
                    self.token_program_dependencies += 1;
                    self.external_asset_dependencies += 1;
                    self.record_pattern("spl_token_import");
                }

                // Check for SPL Token 2022 dependencies
                if path_str.contains("spl_token_2022") || path_str.contains("token_2022") {
                    self.spl_token_2022_usage += 1;
                    self.token_program_dependencies += 1;
                    self.external_asset_dependencies += 1;
                    self.record_pattern("spl_token_2022_import");
                }

                // Check for NFT/Metadata dependencies
                if path_str.contains("metaplex")
                    || path_str.contains("nft")
                    || path_str.contains("metadata")
                {
                    self.nft_handling_patterns += 1;
                    self.nft_program_dependencies += 1;
                    self.external_asset_dependencies += 1;
                    self.record_pattern("nft_import");
                }

                // Check for asset program dependencies
                if path_str.contains("token_program")
                    || path_str.contains("associated_token_program")
                {
                    self.token_program_dependencies += 1;
                    self.external_asset_dependencies += 1;
                    self.record_pattern("token_program_import");
                }

                if path_str.contains("metadata_program") {
                    self.metadata_program_dependencies += 1;
                    self.external_asset_dependencies += 1;
                    self.record_pattern("metadata_program_import");
                }
            }
            UseTree::Name(name_tree) => {
                let name_str = name_tree.ident.to_string();

                // Check for asset-related imports
                if matches!(
                    name_str.as_str(),
                    "TokenAccount"
                        | "Mint"
                        | "TokenProgram"
                        | "NftAccount"
                        | "MetadataAccount"
                        | "Asset"
                ) {
                    self.record_pattern(&format!("asset_import_{}", name_str));
                }
            }
            _ => {}
        }

        // Continue visiting use tree
        syn::visit::visit_use_tree(self, node);
    }

    fn visit_lit_str(&mut self, node: &'ast LitStr) {
        // Skip string literal analysis to avoid false positives from documentation comments
        // Focus on AST-based code structure analysis instead
        syn::visit::visit_lit_str(self, node);
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

    let mut metrics = AssetTypesMetrics::default();
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

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = AssetTypesVisitor::new();
        visitor.current_file_path = file_path.to_string();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.spl_token_usage += visitor.spl_token_usage;
        metrics.spl_token_2022_usage += visitor.spl_token_2022_usage;
        metrics.token_account_patterns += visitor.token_account_patterns;
        metrics.mint_patterns += visitor.mint_patterns;
        metrics.token_transfer_patterns += visitor.token_transfer_patterns;
        metrics.token_mint_patterns += visitor.token_mint_patterns;
        metrics.token_burn_patterns += visitor.token_burn_patterns;
        metrics.associated_token_patterns += visitor.associated_token_patterns;
        metrics.nft_handling_patterns += visitor.nft_handling_patterns;
        metrics.metadata_patterns += visitor.metadata_patterns;
        metrics.collection_patterns += visitor.collection_patterns;
        metrics.nft_mint_patterns += visitor.nft_mint_patterns;
        metrics.nft_transfer_patterns += visitor.nft_transfer_patterns;
        metrics.nft_burn_patterns += visitor.nft_burn_patterns;
        metrics.generic_asset_handling += visitor.generic_asset_handling;
        metrics.multi_asset_operations += visitor.multi_asset_operations;
        metrics.asset_validation_functions += visitor.asset_validation_functions;
        metrics.asset_enum_definitions += visitor.asset_enum_definitions;
        metrics.asset_struct_definitions += visitor.asset_struct_definitions;
        metrics.external_asset_dependencies += visitor.external_asset_dependencies;
        metrics.token_program_dependencies += visitor.token_program_dependencies;
        metrics.nft_program_dependencies += visitor.nft_program_dependencies;
        metrics.metadata_program_dependencies += visitor.metadata_program_dependencies;
        metrics.asset_specific_functions += visitor.asset_specific_functions;
        metrics.asset_creation_functions += visitor.asset_creation_functions;
        metrics.asset_destruction_functions += visitor.asset_destruction_functions;
        metrics.asset_query_functions += visitor.asset_query_functions;
        metrics.asset_update_functions += visitor.asset_update_functions;

        // Merge pattern breakdown
        for (pattern, count) in visitor.asset_pattern_counts {
            *metrics.asset_pattern_breakdown.entry(pattern).or_insert(0) += count;
        }

        // Merge unique asset types
        for _asset_type in visitor.unique_asset_types {
            metrics.unique_asset_types += 1;
        }
        for _token_type in visitor.unique_token_types {
            metrics.unique_token_types += 1;
        }
        for _nft_type in visitor.unique_nft_types {
            metrics.unique_nft_types += 1;
        }
        for _generic_asset_type in visitor.unique_generic_asset_types {
            metrics.unique_generic_asset_types += 1;
        }

        files_analyzed += 1;
    }

    // Calculate complexity scores
    metrics.asset_complexity_score = calculate_asset_complexity_score(&metrics);
    metrics.asset_diversity_score = calculate_asset_diversity_score(&metrics);
    metrics.asset_handling_complexity = calculate_asset_handling_complexity(&metrics);

    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    log::info!(
        "🔍 ASSET TYPES DEBUG: Analysis complete. Files analyzed: {}, Files skipped: {}",
        files_analyzed,
        files_skipped
    );

    Ok(metrics)
}

/// Calculate asset complexity score
fn calculate_asset_complexity_score(metrics: &AssetTypesMetrics) -> f64 {
    let mut score = 0.0;

    // Token asset complexity
    score += metrics.spl_token_usage as f64;
    score += metrics.spl_token_2022_usage as f64;
    score += metrics.token_account_patterns as f64;
    score += metrics.mint_patterns as f64;
    score += metrics.token_transfer_patterns as f64;
    score += metrics.token_mint_patterns as f64;
    score += metrics.token_burn_patterns as f64;
    score += metrics.associated_token_patterns as f64;

    // NFT asset complexity
    score += metrics.nft_handling_patterns as f64;
    score += metrics.metadata_patterns as f64;
    score += metrics.collection_patterns as f64;
    score += metrics.nft_mint_patterns as f64;
    score += metrics.nft_transfer_patterns as f64;
    score += metrics.nft_burn_patterns as f64;

    // Generic asset complexity
    score += metrics.generic_asset_handling as f64;
    score += metrics.multi_asset_operations as f64;
    score += metrics.asset_validation_functions as f64;
    score += metrics.asset_enum_definitions as f64;
    score += metrics.asset_struct_definitions as f64;

    // External dependency complexity
    score += metrics.external_asset_dependencies as f64;
    score += metrics.token_program_dependencies as f64;
    score += metrics.nft_program_dependencies as f64;
    score += metrics.metadata_program_dependencies as f64;

    // Asset function complexity
    score += metrics.asset_specific_functions as f64;
    score += metrics.asset_creation_functions as f64;
    score += metrics.asset_destruction_functions as f64;
    score += metrics.asset_query_functions as f64;
    score += metrics.asset_update_functions as f64;

    score
}

/// Calculate asset diversity score
fn calculate_asset_diversity_score(metrics: &AssetTypesMetrics) -> f64 {
    let mut score = 0.0;

    // Unique asset type diversity
    score += metrics.unique_asset_types as f64 * 2.0;
    score += metrics.unique_token_types as f64;
    score += metrics.unique_nft_types as f64;
    score += metrics.unique_generic_asset_types as f64;

    // Asset type variety
    if metrics.spl_token_usage > 0 {
        score += 1.0;
    }
    if metrics.spl_token_2022_usage > 0 {
        score += 1.0;
    }
    if metrics.nft_handling_patterns > 0 {
        score += 1.0;
    }
    if metrics.generic_asset_handling > 0 {
        score += 1.0;
    }

    score
}

/// Calculate asset handling complexity
fn calculate_asset_handling_complexity(metrics: &AssetTypesMetrics) -> f64 {
    let mut score = 0.0;

    // Asset operation complexity
    score += metrics.asset_creation_functions as f64;
    score += metrics.asset_destruction_functions as f64;
    score += metrics.asset_query_functions as f64;
    score += metrics.asset_update_functions as f64;

    // Multi-asset handling complexity
    score += metrics.multi_asset_operations as f64 * 2.0;
    score += metrics.asset_validation_functions as f64;

    // External integration complexity
    score += metrics.external_asset_dependencies as f64;

    score
}
