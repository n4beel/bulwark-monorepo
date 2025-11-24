//! Modularity analysis for Rust source files
//!
//! This module analyzes code organization, module structure, and dependency patterns
//! to assess the overall modularity and separation of concerns in the codebase.

use std::collections::HashSet;
use std::path::PathBuf;
use syn::{
    visit::Visit, Attribute, File, FnArg, ImplItemFn, Item, ItemFn, ItemMod, ItemUse, Meta,
    Signature, Type, UseTree, Visibility,
};

// Import TSC functionality for AST-based code volume measurement
use crate::factors::lines_of_code::analyze_file_tsc;

/// Anchor file type classification based on location and purpose
#[derive(Debug, Clone, PartialEq)]
enum AnchorFileType {
    LibRouter,   // src/lib.rs
    Instruction, // src/instructions/*.rs
    State,       // src/state/*.rs
    Error,       // src/errors.rs
    Other,       // utils, constants, or unorganized files
}

#[derive(Debug, Clone)]
pub struct ModularityMetrics {
    pub total_files: usize,
    pub total_modules: usize,
    pub avg_lines_per_file: f64,
    pub max_nesting_depth: u32,
    pub total_imports: usize,
    pub external_dependencies: usize,
    pub internal_cross_references: usize,
    pub modularity_score: f64,
    // Anchor-specific modularity metrics
    pub total_instruction_handlers: usize,
    pub files_with_handlers: usize,
    pub instruction_handler_density: f64,
    pub anchor_modularity_score: f64,
    // Architecture-aware metrics
    pub has_instructions_folder: bool,
    pub has_state_folder: bool,
    pub thin_lib_compliance: bool,
    pub separation_compliance: f64,
    pub advanced_anchor_score: f64,
}

impl ModularityMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalFiles": self.total_files,
            "totalModules": self.total_modules,
            "avgLinesPerFile": self.avg_lines_per_file,
            "maxNestingDepth": self.max_nesting_depth,
            "totalImports": self.total_imports,
            "externalDependencies": self.external_dependencies,
            "internalCrossReferences": self.internal_cross_references,
            "modularityScore": self.modularity_score,
            "totalInstructionHandlers": self.total_instruction_handlers,
            "filesWithHandlers": self.files_with_handlers,
            "instructionHandlerDensity": self.instruction_handler_density,
            "anchorModularityScore": self.anchor_modularity_score,
            "hasInstructionsFolder": self.has_instructions_folder,
            "hasStateFolder": self.has_state_folder,
            "thinLibCompliance": self.thin_lib_compliance,
            "separationCompliance": self.separation_compliance,
            "advancedAnchorScore": self.advanced_anchor_score
        })
    }
}

#[derive(Debug, Clone)]
struct FileAnalysis {
    path: String,
    file_type: AnchorFileType, // Classification based on location
    total_statements: usize,   // AST-based Total Statement Count (TSC)
    modules: Vec<ModuleInfo>,
    imports: Vec<ImportInfo>,
    max_depth: u32,
    handler_count: usize, // Count of Anchor instruction handlers in this file
    defines_account_struct: bool, // Detects #[account] structs (State definitions)
}

#[derive(Debug, Clone)]
struct ModuleInfo {
    name: String,
    is_public: bool,
    is_inline: bool,
    nesting_depth: u32,
}

#[derive(Debug, Clone)]
struct ImportInfo {
    path: String,
    is_external: bool,
    is_crate_local: bool,
}

/// Calculate modularity metrics for workspace files
pub fn calculate_workspace_modularity(
    workspace_path: &PathBuf,
    selected_files: &[String],
) -> Result<ModularityMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "Calculating modularity metrics for {} files in workspace: {:?}",
        selected_files.len(),
        workspace_path
    );

    let mut file_analyses = Vec::new();
    let mut total_statements = 0;
    let mut analyzed_files = 0;

    // Analyze each file
    for file_path in selected_files {
        let full_file_path = workspace_path.join(file_path);

        if full_file_path.exists() && full_file_path.is_file() {
            if let Some(extension) = full_file_path.extension() {
                if extension == "rs" {
                    match std::fs::read_to_string(&full_file_path) {
                        Ok(content) => match analyze_file_modularity(file_path, &content) {
                            Ok(file_analysis) => {
                                total_statements += file_analysis.total_statements;
                                file_analyses.push(file_analysis);
                                analyzed_files += 1;

                                log::debug!(
                                    "File {}: {} statements, {} modules, {} imports, max depth: {}",
                                    file_path,
                                    file_analyses.last().unwrap().total_statements,
                                    file_analyses.last().unwrap().modules.len(),
                                    file_analyses.last().unwrap().imports.len(),
                                    file_analyses.last().unwrap().max_depth
                                );
                            }
                            Err(e) => {
                                log::warn!(
                                    "Failed to analyze modularity for file {}: {}",
                                    file_path,
                                    e
                                );
                            }
                        },
                        Err(e) => {
                            log::warn!("Failed to read file {}: {}", file_path, e);
                        }
                    }
                }
            }
        }
    }

    if analyzed_files == 0 {
        return Err("No files were successfully analyzed for modularity".into());
    }

    // Calculate aggregate metrics
    let total_files = analyzed_files;
    let total_modules: usize = file_analyses.iter().map(|f| f.modules.len()).sum();
    let avg_statements_per_file = if total_files > 0 {
        total_statements as f64 / total_files as f64
    } else {
        0.0
    };
    let max_nesting_depth = file_analyses.iter().map(|f| f.max_depth).max().unwrap_or(0);
    let total_imports: usize = file_analyses.iter().map(|f| f.imports.len()).sum();

    // Count external vs internal dependencies
    let mut external_deps = HashSet::new();
    let mut internal_refs = 0;

    for file in &file_analyses {
        for import in &file.imports {
            if import.is_external {
                external_deps.insert(import.path.clone());
            } else if import.is_crate_local {
                internal_refs += 1;
            }
        }
    }

    let external_dependencies = external_deps.len();
    let internal_cross_references = internal_refs;

    // Calculate Anchor-specific metrics
    let mut total_instruction_handlers = 0;
    let mut files_with_handlers = 0;

    for file_analysis in &file_analyses {
        total_instruction_handlers += file_analysis.handler_count;
        if file_analysis.handler_count > 0 {
            files_with_handlers += 1;
        }
    }

    // Calculate Instruction Handler Density (IHD)
    let instruction_handler_density = if files_with_handlers > 0 {
        total_instruction_handlers as f64 / files_with_handlers as f64
    } else {
        0.0
    };

    // Calculate modularity score (0-100)
    let modularity_score = calculate_modularity_score(
        total_files,
        &file_analyses,
        avg_statements_per_file,
        max_nesting_depth,
        internal_cross_references,
    );

    // Calculate Anchor-specific modularity score (density-based)
    let anchor_modularity_score = calculate_anchor_modularity_score(instruction_handler_density);

    // Evaluate architecture compliance
    let arch_card = evaluate_architecture(&file_analyses);

    // Calculate advanced Anchor architecture score
    let advanced_anchor_score =
        calculate_advanced_anchor_score(anchor_modularity_score, &arch_card);

    let result = ModularityMetrics {
        total_files,
        total_modules,
        avg_lines_per_file: avg_statements_per_file, // Using TSC as the code volume metric
        max_nesting_depth,
        total_imports,
        external_dependencies,
        internal_cross_references,
        modularity_score,
        total_instruction_handlers,
        files_with_handlers,
        instruction_handler_density,
        anchor_modularity_score,
        has_instructions_folder: arch_card.has_instructions_folder,
        has_state_folder: arch_card.has_state_folder,
        thin_lib_compliance: arch_card.thin_lib_compliance,
        separation_compliance: arch_card.separation_compliance,
        advanced_anchor_score,
    };

    log::info!(
        "Modularity analysis complete: {} files, {} modules, avg {:.1} statements/file, modularity score: {:.1}, {} handlers in {} files (IHD: {:.2}), anchor modularity: {:.1}, advanced anchor score: {:.1}",
        total_files,
        total_modules,
        avg_statements_per_file,
        modularity_score,
        total_instruction_handlers,
        files_with_handlers,
        instruction_handler_density,
        anchor_modularity_score,
        advanced_anchor_score
    );

    Ok(result)
}

/// Determine file type based on path
fn determine_file_type(path: &str) -> AnchorFileType {
    if path.ends_with("lib.rs") {
        AnchorFileType::LibRouter
    } else if path.contains("instructions/") {
        AnchorFileType::Instruction
    } else if path.contains("state/") {
        AnchorFileType::State
    } else if path.ends_with("errors.rs") {
        AnchorFileType::Error
    } else {
        AnchorFileType::Other
    }
}

/// Check if the file defines Account structs (State definitions)
fn check_for_state_definitions(syntax_tree: &File) -> bool {
    for item in &syntax_tree.items {
        if let Item::Struct(item_struct) = item {
            for attr in &item_struct.attrs {
                // Check for #[account] attribute
                if attr.path().is_ident("account") {
                    return true;
                }
                // Also check for derive(Accounts) pattern
                if let Ok(meta) = attr.parse_args::<Meta>() {
                    match meta {
                        Meta::Path(path) => {
                            if path.is_ident("account") {
                                return true;
                            }
                        }
                        Meta::List(meta_list) => {
                            if meta_list.path.is_ident("derive") {
                                // Check if Accounts is in the derive list
                                let tokens = meta_list.tokens.to_string();
                                if tokens.contains("Accounts") {
                                    return true;
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }
        }
    }
    false
}

/// Analyze modularity for a single file
fn analyze_file_modularity(
    file_path: &str,
    content: &str,
) -> Result<FileAnalysis, Box<dyn std::error::Error>> {
    // Parse the Rust file using syn
    let syntax_tree: File = syn::parse_file(content)
        .map_err(|e| format!("Failed to parse Rust file {}: {}", file_path, e))?;

    // Determine file type based on path
    let file_type = determine_file_type(file_path);

    let mut visitor = ModularityVisitor::new();
    visitor.visit_file(&syntax_tree);

    // Count Anchor instruction handlers
    let mut handler_counter = HandlerCounter::new();
    handler_counter.visit_file(&syntax_tree);

    // Check for state definitions (Account structs)
    let defines_account_struct = check_for_state_definitions(&syntax_tree);

    // Calculate AST-based Total Statement Count (TSC) for robust code volume measurement
    let tsc_metrics = analyze_file_tsc(content).unwrap_or_default();
    let total_statements = tsc_metrics.total_statements;

    Ok(FileAnalysis {
        path: file_path.to_string(),
        file_type,
        total_statements,
        modules: visitor.modules,
        imports: visitor.imports,
        max_depth: visitor.max_nesting_depth,
        handler_count: handler_counter.handler_count,
        defines_account_struct,
    })
}

/// Calculate overall modularity score (0-100)
fn calculate_modularity_score(
    total_files: usize,
    file_analyses: &[FileAnalysis],
    _avg_statements_per_file: f64,
    max_nesting_depth: u32,
    internal_cross_references: usize,
) -> f64 {
    let mut score = 0.0;

    // Component 1: More files = better modularity (0-40 points)
    let file_count_score = if total_files <= 1 {
        0.0
    } else if total_files >= 10 {
        40.0
    } else {
        (total_files as f64 - 1.0) / 9.0 * 40.0
    };

    // Component 2: Balanced file sizes = better organization (0-30 points)
    // Using AST-based Total Statement Count (TSC) for robust code volume measurement
    let balance_score = if file_analyses.len() <= 1 {
        30.0 // Single file gets full points for balance
    } else {
        let sizes: Vec<usize> = file_analyses.iter().map(|f| f.total_statements).collect();
        let mean = sizes.iter().sum::<usize>() as f64 / sizes.len() as f64;
        let variance = sizes
            .iter()
            .map(|&size| (size as f64 - mean).powi(2))
            .sum::<f64>()
            / sizes.len() as f64;
        let coefficient_of_variation = if mean > 0.0 {
            variance.sqrt() / mean
        } else {
            0.0
        };

        // Lower CV = better balance, score inversely related to CV
        let balance_factor = if coefficient_of_variation <= 0.5 {
            1.0
        } else if coefficient_of_variation >= 2.0 {
            0.0
        } else {
            1.0 - (coefficient_of_variation - 0.5) / 1.5
        };

        balance_factor * 30.0
    };

    // Component 3: Fewer cross-dependencies = cleaner architecture (0-30 points)
    let dependency_score = if total_files <= 1 {
        30.0 // Single file has no cross-dependencies
    } else {
        let max_expected_deps = total_files * (total_files - 1); // Theoretical maximum
        let dependency_ratio = internal_cross_references as f64 / max_expected_deps as f64;

        if dependency_ratio <= 0.1 {
            30.0 // Very clean
        } else if dependency_ratio >= 0.5 {
            0.0 // Highly coupled
        } else {
            30.0 * (1.0 - (dependency_ratio - 0.1) / 0.4)
        }
    };

    score = file_count_score + balance_score + dependency_score;

    // Penalty for excessive nesting depth
    if max_nesting_depth > 3 {
        score -= (max_nesting_depth - 3) as f64 * 5.0;
    }

    // Ensure score is within bounds
    score.max(0.0).min(100.0)
}

/// Calculate Anchor-specific modularity score based on Instruction Handler Density
fn calculate_anchor_modularity_score(instruction_handler_density: f64) -> f64 {
    if instruction_handler_density == 0.0 {
        return 0.0; // No handlers found
    }

    // IHD Score Component (0-100 points)
    // Goal: Maximize score when IHD ≈ 1 (one handler per file)
    // Formula: The score is inversely proportional to the IHD, with a sharp penalty for IHD ≥ 2

    if instruction_handler_density <= 1.0 {
        // Perfect or near-perfect separation (IHD ≤ 1)
        100.0
    } else if instruction_handler_density <= 2.0 {
        // Acceptable separation (1 < IHD ≤ 2)
        100.0 - (instruction_handler_density - 1.0) * 50.0
    } else {
        // Poor separation (IHD > 2) - sharp penalty
        let penalty = (instruction_handler_density - 2.0) * 25.0;
        (50.0 - penalty).max(0.0)
    }
}

/// Architecture compliance scorecard
#[derive(Debug, Default)]
struct ArchitectureScoreCard {
    has_instructions_folder: bool,
    has_state_folder: bool,
    thin_lib_compliance: bool,
    separation_compliance: f64, // 0.0 to 1.0
}

/// Evaluate architecture compliance based on Anchor best practices
fn evaluate_architecture(files: &[FileAnalysis]) -> ArchitectureScoreCard {
    let mut card = ArchitectureScoreCard::default();
    let mut valid_separations = 0;
    let mut total_checked = 0;

    for file in files {
        match &file.file_type {
            AnchorFileType::LibRouter => {
                // RULE: lib.rs should be "Thin"
                // It should have 0 handlers (it delegates) or imports instructions
                // It should have low complexity
                if file.handler_count == 0 && file.total_statements < 100 {
                    card.thin_lib_compliance = true;
                }
            }
            AnchorFileType::Instruction => {
                card.has_instructions_folder = true;
                total_checked += 1;

                // RULE: Instruction files should contain Handlers
                // RULE: Instruction files should NOT define global #[account] structs (local DTOs are ok)
                // For now, we check if handlers exist (good practice)
                if file.handler_count > 0 {
                    valid_separations += 1;
                }
            }
            AnchorFileType::State => {
                card.has_state_folder = true;
                total_checked += 1;

                // RULE: State files should define Accounts
                // RULE: State files should NEVER contain Handlers
                if file.defines_account_struct && file.handler_count == 0 {
                    valid_separations += 1;
                } else if file.handler_count > 0 {
                    // Violation: handlers in state files
                    // Don't increment valid_separations, but count as checked
                }
            }
            AnchorFileType::Other => {
                // RULE: If an "Other" file has handlers, it violates architecture
                // (unless it's a flat structure, which is a low score anyway)
                if file.handler_count > 0 {
                    total_checked += 1; // It counts as a check that failed
                }
            }
            AnchorFileType::Error => {
                // Error files are typically fine, no specific rules
            }
        }
    }

    if total_checked > 0 {
        card.separation_compliance = valid_separations as f64 / total_checked as f64;
    } else {
        // If no files were checked, assume perfect compliance (edge case)
        card.separation_compliance = 1.0;
    }

    card
}

/// Calculate advanced Anchor architecture score combining density and compliance
fn calculate_advanced_anchor_score(
    density_score: f64, // Existing density-based metric (0-100)
    arch_card: &ArchitectureScoreCard,
) -> f64 {
    let mut score = 0.0;

    // 1. Base Score: Folder Structure (30%)
    if arch_card.has_instructions_folder {
        score += 15.0;
    }
    if arch_card.has_state_folder {
        score += 15.0;
    }

    // 2. Router Hygiene: Thin Lib (20%)
    if arch_card.thin_lib_compliance {
        score += 20.0;
    }

    // 3. Separation of Concerns (30%)
    // Did they put handlers in instructions/ and state in state/?
    score += arch_card.separation_compliance * 30.0;

    // 4. Code Density (20%)
    // Existing logic: Are individual files clean?
    score += (density_score / 100.0) * 20.0;

    // Ensure score is within bounds
    score.max(0.0).min(100.0)
}

/// Visitor to analyze module structure and imports
struct ModularityVisitor {
    modules: Vec<ModuleInfo>,
    imports: Vec<ImportInfo>,
    current_nesting_depth: u32,
    max_nesting_depth: u32,
}

/// Visitor to count Anchor instruction handlers
struct HandlerCounter {
    pub handler_count: usize,
}

impl HandlerCounter {
    fn new() -> Self {
        Self { handler_count: 0 }
    }

    /// Check if a function is an Anchor instruction handler
    fn is_anchor_instruction_handler(&self, item_fn: &ItemFn) -> bool {
        // Check if function is public (instruction handlers are typically public)
        if !matches!(item_fn.vis, Visibility::Public(_)) {
            return false;
        }

        // Check for Anchor-specific attributes first (most reliable)
        if self.has_anchor_handler_attributes(&item_fn.attrs) {
            return true;
        }

        // Check function name patterns common in Anchor programs
        let name = item_fn.sig.ident.to_string();
        if name.ends_with("_handler")
            || name.starts_with("initialize")
            || name.starts_with("update")
            || name.starts_with("transfer")
            || name.starts_with("swap")
            || name.starts_with("deposit")
            || name.starts_with("withdraw")
            || name == "validate"
            || name == "execute"
        {
            return true;
        }

        // Check if function takes a Context parameter (common in Anchor)
        if self.has_context_parameter(&item_fn.sig) {
            return true;
        }

        false
    }

    /// Check if an impl method is an Anchor instruction handler
    fn is_anchor_instruction_handler_method(&self, item_fn: &ImplItemFn) -> bool {
        // Check if method is public (instruction handlers are typically public)
        if !matches!(item_fn.vis, Visibility::Public(_)) {
            return false;
        }

        // Check for Anchor-specific attributes first (most reliable)
        if self.has_anchor_handler_attributes(&item_fn.attrs) {
            return true;
        }

        // Check method name patterns common in Anchor programs
        let name = item_fn.sig.ident.to_string();
        if name.ends_with("_handler")
            || name.starts_with("initialize")
            || name.starts_with("update")
            || name.starts_with("transfer")
            || name.starts_with("swap")
            || name.starts_with("deposit")
            || name.starts_with("withdraw")
            || name == "validate"
            || name == "execute"
        {
            return true;
        }

        // Check if method takes a Context parameter (common in Anchor)
        if self.has_context_parameter(&item_fn.sig) {
            return true;
        }

        false
    }

    /// Check for Anchor-specific handler attributes
    fn has_anchor_handler_attributes(&self, attrs: &[Attribute]) -> bool {
        for attr in attrs {
            // Check the attribute path directly
            if attr.path().is_ident("instruction")
                || attr.path().is_ident("handler")
                || attr.path().is_ident("anchor_handler")
            {
                return true;
            }

            // Also try parsing as meta for more complex attributes
            if let Ok(meta) = attr.parse_args::<Meta>() {
                match meta {
                    Meta::Path(path) => {
                        if path.is_ident("instruction")
                            || path.is_ident("handler")
                            || path.is_ident("anchor_handler")
                        {
                            return true;
                        }
                    }
                    Meta::List(meta_list) => {
                        if meta_list.path.is_ident("instruction")
                            || meta_list.path.is_ident("handler")
                        {
                            return true;
                        }
                    }
                    Meta::NameValue(_) => {
                        // Handle name-value attributes if needed
                    }
                }
            }
        }
        false
    }

    /// Check if a function signature has a Context parameter (Anchor pattern)
    fn has_context_parameter(&self, sig: &Signature) -> bool {
        for input in &sig.inputs {
            if let FnArg::Typed(pat_type) = input {
                if let Type::Path(type_path) = &*pat_type.ty {
                    // Check for full Anchor Context path (more robust)
                    let path_str = type_path
                        .path
                        .segments
                        .iter()
                        .map(|seg| seg.ident.to_string())
                        .collect::<Vec<_>>()
                        .join("::");

                    // Look for standard Anchor Context patterns
                    if path_str.starts_with("Context<")
                        || path_str.starts_with("anchor_lang::Context<")
                        || path_str.starts_with("anchor_lang::prelude::Context<")
                    {
                        return true;
                    }

                    // Fallback: check if any segment starts with "Context"
                    if type_path
                        .path
                        .segments
                        .iter()
                        .any(|seg| seg.ident.to_string().starts_with("Context"))
                    {
                        return true;
                    }
                }
            }
        }
        false
    }
}

impl<'ast> Visit<'ast> for HandlerCounter {
    fn visit_item(&mut self, item: &'ast Item) {
        match item {
            Item::Fn(item_fn) => {
                if self.is_anchor_instruction_handler(item_fn) {
                    self.handler_count += 1;
                }
            }
            _ => {
                syn::visit::visit_item(self, item);
            }
        }
    }

    fn visit_impl_item_fn(&mut self, item_fn: &'ast ImplItemFn) {
        if self.is_anchor_instruction_handler_method(item_fn) {
            self.handler_count += 1;
        }
        syn::visit::visit_impl_item_fn(self, item_fn);
    }
}

impl ModularityVisitor {
    fn new() -> Self {
        Self {
            modules: Vec::new(),
            imports: Vec::new(),
            current_nesting_depth: 0,
            max_nesting_depth: 0,
        }
    }
}

impl<'ast> Visit<'ast> for ModularityVisitor {
    fn visit_item(&mut self, item: &'ast Item) {
        match item {
            Item::Mod(item_mod) => {
                self.visit_item_mod(item_mod);
            }
            Item::Use(item_use) => {
                self.visit_item_use(item_use);
            }
            _ => {
                syn::visit::visit_item(self, item);
            }
        }
    }

    fn visit_item_mod(&mut self, module: &'ast ItemMod) {
        let is_public = matches!(module.vis, syn::Visibility::Public(_));
        let is_inline = module.content.is_some();

        self.modules.push(ModuleInfo {
            name: module.ident.to_string(),
            is_public,
            is_inline,
            nesting_depth: self.current_nesting_depth,
        });

        // If it's an inline module, visit its contents with increased nesting
        if let Some((_, items)) = &module.content {
            self.current_nesting_depth += 1;
            self.max_nesting_depth = self.max_nesting_depth.max(self.current_nesting_depth);

            for item in items {
                self.visit_item(item);
            }

            self.current_nesting_depth -= 1;
        }
    }

    fn visit_item_use(&mut self, use_item: &'ast ItemUse) {
        self.analyze_use_tree(&use_item.tree);
        syn::visit::visit_item_use(self, use_item);
    }
}

impl ModularityVisitor {
    fn analyze_use_tree(&mut self, tree: &UseTree) {
        match tree {
            UseTree::Path(use_path) => {
                let path_str = use_path.ident.to_string();
                let is_external = !path_str.starts_with("crate")
                    && !path_str.starts_with("self")
                    && !path_str.starts_with("super");
                let is_crate_local = path_str.starts_with("crate") || path_str.starts_with("super");

                self.imports.push(ImportInfo {
                    path: path_str,
                    is_external,
                    is_crate_local,
                });

                self.analyze_use_tree(&use_path.tree);
            }
            UseTree::Name(use_name) => {
                // This is handled by the parent Path case
                let _ = use_name;
            }
            UseTree::Rename(use_rename) => {
                let _ = use_rename;
            }
            UseTree::Glob(_) => {
                // Glob imports like `use module::*`
            }
            UseTree::Group(use_group) => {
                for tree in &use_group.items {
                    self.analyze_use_tree(tree);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_file_modularity() {
        let code = r#"
            use std::collections::HashMap;
            
            fn simple_function() {
                println!("Hello, world!");
            }
        "#;

        let result = analyze_file_modularity("test.rs", code).unwrap();
        assert_eq!(result.modules.len(), 0); // No module declarations
        assert!(result.imports.len() >= 1); // At least one import (may detect multiple due to path parsing)
        assert_eq!(result.max_depth, 0); // No nesting
    }

    #[test]
    fn test_module_with_nesting() {
        let code = r#"
            use crate::utils;
            
            mod outer {
                mod inner {
                    pub fn nested_function() {}
                }
                
                pub use inner::nested_function;
            }
        "#;

        let result = analyze_file_modularity("test.rs", code).unwrap();
        assert_eq!(result.modules.len(), 2); // outer and inner modules
        assert_eq!(result.max_depth, 2); // Two levels of nesting
        assert!(result.imports.len() >= 1); // At least one import
    }

    #[test]
    fn test_modularity_score_calculation() {
        let file_analyses = vec![
            FileAnalysis {
                path: "file1.rs".to_string(),
                file_type: AnchorFileType::Other,
                total_statements: 100,
                modules: vec![],
                imports: vec![],
                max_depth: 0,
                handler_count: 0,
                defines_account_struct: false,
            },
            FileAnalysis {
                path: "file2.rs".to_string(),
                file_type: AnchorFileType::Other,
                total_statements: 120,
                modules: vec![],
                imports: vec![],
                max_depth: 0,
                handler_count: 0,
                defines_account_struct: false,
            },
        ];

        let score = calculate_modularity_score(2, &file_analyses, 110.0, 0, 1);
        assert!(score > 0.0 && score <= 100.0);
    }

    #[test]
    fn test_anchor_instruction_handler_detection() {
        let code = r#"
            use anchor_lang::prelude::*;

            pub fn initialize_handler(ctx: Context<Initialize>) -> Result<()> {
                Ok(())
            }

            pub fn transfer_handler(ctx: Context<Transfer>) -> Result<()> {
                Ok(())
            }

            fn helper_function() {
                // This should not be detected as a handler
            }
        "#;

        let result = analyze_file_modularity("test.rs", code).unwrap();
        assert_eq!(result.handler_count, 2); // initialize_handler and transfer_handler
        assert_eq!(result.file_type, AnchorFileType::Other); // Not in instructions/ folder
    }

    #[test]
    fn test_instruction_handler_density_calculation() {
        // Test perfect separation (IHD = 1.0)
        let score_perfect = calculate_anchor_modularity_score(1.0);
        assert_eq!(score_perfect, 100.0);

        // Test acceptable separation (IHD = 1.5)
        let score_acceptable = calculate_anchor_modularity_score(1.5);
        // IHD = 1.5 should give score = 100.0 - (1.5 - 1.0) * 50.0 = 75.0
        assert_eq!(score_acceptable, 75.0);

        // Test poor separation (IHD = 3.0)
        let score_poor = calculate_anchor_modularity_score(3.0);
        assert!(score_poor < 50.0);

        // Test no handlers (IHD = 0.0)
        let score_none = calculate_anchor_modularity_score(0.0);
        assert_eq!(score_none, 0.0);
    }

    #[test]
    fn test_context_parameter_detection() {
        let code = r#"
            use anchor_lang::prelude::*;

            pub fn handler_with_context(ctx: Context<MyContext>) -> Result<()> {
                Ok(())
            }

            pub fn handler_without_context() -> Result<()> {
                Ok(())
            }
        "#;

        let result = analyze_file_modularity("test.rs", code).unwrap();
        assert_eq!(result.handler_count, 1); // Only the one with Context parameter
    }

    #[test]
    fn test_file_type_determination() {
        assert_eq!(determine_file_type("src/lib.rs"), AnchorFileType::LibRouter);
        assert_eq!(
            determine_file_type("src/instructions/transfer.rs"),
            AnchorFileType::Instruction
        );
        assert_eq!(
            determine_file_type("src/state/token.rs"),
            AnchorFileType::State
        );
        assert_eq!(determine_file_type("src/errors.rs"), AnchorFileType::Error);
        assert_eq!(determine_file_type("src/utils.rs"), AnchorFileType::Other);
    }

    #[test]
    fn test_state_definition_detection() {
        let code = r#"
            use anchor_lang::prelude::*;

            #[account]
            pub struct TokenAccount {
                pub mint: Pubkey,
                pub owner: Pubkey,
                pub amount: u64,
            }

            pub struct RegularStruct {
                pub field: u64,
            }
        "#;

        let result = analyze_file_modularity("src/state/token.rs", code).unwrap();
        assert!(result.defines_account_struct);
        assert_eq!(result.file_type, AnchorFileType::State);
    }

    #[test]
    fn test_architecture_evaluation() {
        let file_analyses = vec![
            FileAnalysis {
                path: "src/lib.rs".to_string(),
                file_type: AnchorFileType::LibRouter,
                total_statements: 50,
                modules: vec![],
                imports: vec![],
                max_depth: 0,
                handler_count: 0,
                defines_account_struct: false,
            },
            FileAnalysis {
                path: "src/instructions/transfer.rs".to_string(),
                file_type: AnchorFileType::Instruction,
                total_statements: 100,
                modules: vec![],
                imports: vec![],
                max_depth: 0,
                handler_count: 1,
                defines_account_struct: false,
            },
            FileAnalysis {
                path: "src/state/token.rs".to_string(),
                file_type: AnchorFileType::State,
                total_statements: 50,
                modules: vec![],
                imports: vec![],
                max_depth: 0,
                handler_count: 0,
                defines_account_struct: true,
            },
        ];

        let arch_card = evaluate_architecture(&file_analyses);
        assert!(arch_card.has_instructions_folder);
        assert!(arch_card.has_state_folder);
        assert!(arch_card.thin_lib_compliance);
        assert!(arch_card.separation_compliance > 0.0);
    }

    #[test]
    fn test_anchor_attribute_detection() {
        let code = r#"
            use anchor_lang::prelude::*;

            #[instruction]
            pub fn attributed_handler(ctx: Context<MyContext>) -> Result<()> {
                Ok(())
            }

            #[handler]
            pub fn handler_attributed() -> Result<()> {
                Ok(())
            }

            pub fn regular_function() -> Result<()> {
                Ok(())
            }
        "#;

        let result = analyze_file_modularity("test.rs", code).unwrap();
        assert_eq!(result.handler_count, 2); // Both attributed functions should be detected
    }

    #[test]
    fn test_improved_context_detection() {
        let code = r#"
            use anchor_lang::prelude::*;

            pub fn standard_context(ctx: Context<Initialize>) -> Result<()> {
                Ok(())
            }

            pub fn full_path_context(ctx: anchor_lang::Context<Transfer>) -> Result<()> {
                Ok(())
            }

            pub fn prelude_context(ctx: anchor_lang::prelude::Context<Update>) -> Result<()> {
                Ok(())
            }

            pub fn non_context(ctx: MyCustomContext) -> Result<()> {
                Ok(())
            }
        "#;

        let result = analyze_file_modularity("test.rs", code).unwrap();
        assert_eq!(result.handler_count, 3); // First three should be detected as handlers
    }
}
