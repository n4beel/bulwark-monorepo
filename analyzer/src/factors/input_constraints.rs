use quote::quote;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use syn::{parse_file, visit::Visit, Attribute, Expr, ExprPath, ItemFn, ItemStruct, Meta};

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct InputConstraintMetrics {
    // Account statistics
    pub avg_accounts_per_handler: f64,
    pub p95_accounts_per_handler: f64,
    pub max_accounts_per_handler: u32,
    pub total_handlers: u32,

    // Numeric parameters
    pub handlers_with_numeric_params: u32,
    pub total_numeric_params: u32,

    // Vector parameters
    pub handlers_with_vector_params: u32,
    pub total_vector_params: u32,

    // Constraints
    pub total_constraints: u32,
    pub constraint_breakdown: HashMap<String, u32>,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl InputConstraintMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "avgAccountsPerHandler": self.avg_accounts_per_handler,
            "p95AccountsPerHandler": self.p95_accounts_per_handler,
            "maxAccountsPerHandler": self.max_accounts_per_handler,
            "totalHandlers": self.total_handlers,
            "handlersWithNumericParams": self.handlers_with_numeric_params,
            "totalNumericParams": self.total_numeric_params,
            "handlersWithVectorParams": self.handlers_with_vector_params,
            "totalVectorParams": self.total_vector_params,
            "totalConstraints": self.total_constraints,
            "constraintBreakdown": self.constraint_breakdown,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped
        })
    }
}

/// Calculate input/constraint surface metrics for workspace
pub fn calculate_workspace_input_constraints(
    workspace_path: &PathBuf,
    selected_files: &[String],
) -> Result<InputConstraintMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 INPUT CONSTRAINTS DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = InputConstraintMetrics::default();
    let mut all_account_counts = Vec::new();
    let mut visitor = InputConstraintVisitor::new();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    // Analyze each selected file
    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);
        if !full_path.exists() {
            log::warn!(
                "🔍 INPUT CONSTRAINTS DEBUG: File does not exist: {:?}",
                full_path
            );
            continue;
        }

        // For Input/Constraint Surface factor, only analyze files that are clearly instruction files
        // This ensures accurate results while allowing other factors to use all user-selected files
        let file_path_str = file_path.to_string();
        let is_relevant_for_input_constraints = file_path_str.contains("instructions/")
            || file_path_str.contains("ix_")
            || file_path_str.ends_with("lib.rs")
            || file_path_str.ends_with("state.rs")
            || file_path_str.ends_with("error.rs");

        if !is_relevant_for_input_constraints {
            log::info!(
                "🔍 INPUT CONSTRAINTS DEBUG: Skipping non-instruction file for input constraints analysis: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        log::info!(
            "🔍 INPUT CONSTRAINTS DEBUG: Analyzing file: {:?}",
            full_path
        );

        match std::fs::read_to_string(&full_path) {
            Ok(content) => {
                log::info!(
                    "🔍 INPUT CONSTRAINTS DEBUG: Successfully read file, content length: {}",
                    content.len()
                );

                // Set the current file path for the visitor
                visitor.current_file_path = file_path.to_string();
                files_analyzed += 1;
                match parse_file(&content) {
                    Ok(ast) => {
                        log::info!("🔍 INPUT CONSTRAINTS DEBUG: Successfully parsed AST");
                        visitor.visit_file(&ast);

                        // Extract metrics from visitor
                        for handler_info in &visitor.handlers {
                            all_account_counts.push(handler_info.account_count);

                            if handler_info.has_numeric_params {
                                metrics.handlers_with_numeric_params += 1;
                            }
                            metrics.total_numeric_params += handler_info.numeric_param_count;

                            if handler_info.has_vector_params {
                                metrics.handlers_with_vector_params += 1;
                            }
                            metrics.total_vector_params += handler_info.vector_param_count;
                        }

                        // Add constraints from visitor
                        for (constraint_type, count) in &visitor.constraints {
                            *metrics
                                .constraint_breakdown
                                .entry(constraint_type.clone())
                                .or_insert(0) += count;
                            metrics.total_constraints += count;
                        }
                    }
                    Err(e) => {
                        log::warn!(
                            "🔍 INPUT CONSTRAINTS DEBUG: Failed to parse AST for {:?}: {}",
                            full_path,
                            e
                        );
                    }
                }
            }
            Err(e) => {
                log::warn!(
                    "🔍 INPUT CONSTRAINTS DEBUG: Failed to read file {:?}: {}",
                    full_path,
                    e
                );
            }
        }
    }

    // Add file analysis metadata
    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    // Calculate account statistics
    metrics.total_handlers = all_account_counts.len() as u32;
    if !all_account_counts.is_empty() {
        all_account_counts.sort();

        // Calculate average
        let sum: u32 = all_account_counts.iter().sum();
        metrics.avg_accounts_per_handler = sum as f64 / all_account_counts.len() as f64;

        // Calculate p95 (95th percentile)
        let p95_index = ((all_account_counts.len() as f64) * 0.95).ceil() as usize - 1;
        metrics.p95_accounts_per_handler =
            all_account_counts[p95_index.min(all_account_counts.len() - 1)] as f64;

        // Calculate max
        metrics.max_accounts_per_handler = *all_account_counts.last().unwrap_or(&0);
    }

    log::info!(
        "🔍 INPUT CONSTRAINTS DEBUG: Analysis complete: {} handlers, {} constraints",
        metrics.total_handlers,
        metrics.total_constraints
    );

    Ok(metrics)
}

#[derive(Debug)]
struct HandlerInfo {
    account_count: u32,
    has_numeric_params: bool,
    numeric_param_count: u32,
    has_vector_params: bool,
    vector_param_count: u32,
}

#[derive(Debug)]
struct InputConstraintVisitor {
    handlers: Vec<HandlerInfo>,
    constraints: HashMap<String, u32>,
    current_file_path: String,
}

impl InputConstraintVisitor {
    fn new() -> Self {
        Self {
            handlers: Vec::new(),
            constraints: HashMap::new(),
            current_file_path: String::new(),
        }
    }

    fn is_numeric_type(&self, ty: &syn::Type) -> bool {
        match ty {
            syn::Type::Path(type_path) => {
                if let Some(segment) = type_path.path.segments.last() {
                    match segment.ident.to_string().as_str() {
                        "u8" | "u16" | "u32" | "u64" | "u128" | "usize" | "i8" | "i16" | "i32"
                        | "i64" | "i128" | "isize" | "f32" | "f64" => true,
                        _ => false,
                    }
                } else {
                    false
                }
            }
            _ => false,
        }
    }

    fn is_vector_type(&self, ty: &syn::Type) -> bool {
        match ty {
            syn::Type::Path(type_path) => {
                if let Some(segment) = type_path.path.segments.last() {
                    match segment.ident.to_string().as_str() {
                        "Vec" | "Slice" => true,
                        _ => false,
                    }
                } else {
                    false
                }
            }
            syn::Type::Array(_) => true,
            syn::Type::Slice(_) => true,
            _ => false,
        }
    }

    fn has_context_parameter(&self, input: &syn::FnArg) -> bool {
        if let syn::FnArg::Typed(pat_type) = input {
            if let syn::Type::Path(type_path) = &*pat_type.ty {
                if let Some(segment) = type_path.path.segments.last() {
                    if segment.ident == "Context" {
                        return true;
                    }
                }
            }
        }
        false
    }

    fn count_anchor_constraints(&mut self, attrs: &[Attribute]) {
        // Only count constraints from instruction files to avoid over-counting
        if !self.current_file_path.contains("instructions/") {
            return;
        }

        for attr in attrs {
            if attr.path().is_ident("account") {
                // Parse the account attribute content
                let attr_str = quote::quote!(#attr).to_string();

                // Count constraints more precisely - only count each constraint type once per attribute
                let mut found_constraints = std::collections::HashSet::new();

                // Check for specific constraint patterns
                if attr_str.contains("has_one") {
                    found_constraints.insert("has_one");
                }
                if attr_str.contains("owner") {
                    found_constraints.insert("owner");
                }
                if attr_str.contains("seeds") {
                    found_constraints.insert("seeds");
                }
                if attr_str.contains("bump") {
                    found_constraints.insert("bump");
                }
                if attr_str.contains("mint") {
                    found_constraints.insert("mint");
                }
                if attr_str.contains("authority") {
                    found_constraints.insert("authority");
                }
                if attr_str.contains("signer") {
                    found_constraints.insert("signer");
                }
                if attr_str.contains("mut") {
                    found_constraints.insert("mut");
                }
                if attr_str.contains("init") {
                    found_constraints.insert("init");
                }
                if attr_str.contains("close") {
                    found_constraints.insert("close");
                }
                if attr_str.contains("space") {
                    found_constraints.insert("space");
                }
                if attr_str.contains("payer") {
                    found_constraints.insert("payer");
                }
                if attr_str.contains("constraint") {
                    found_constraints.insert("constraint");
                }
                if attr_str.contains("==") {
                    found_constraints.insert("equality_constraint");
                }

                // Count each unique constraint type only once per attribute
                for constraint_type in found_constraints {
                    *self
                        .constraints
                        .entry(constraint_type.to_string())
                        .or_insert(0) += 1;
                }
            }
        }
    }
}

impl<'ast> Visit<'ast> for InputConstraintVisitor {
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        log::info!(
            "🔍 INPUT CONSTRAINTS DEBUG: Found function: {}",
            node.sig.ident
        );
        log::info!(
            "🔍 INPUT CONSTRAINTS DEBUG: Function visibility: {:?}",
            node.vis
        );
        log::info!(
            "🔍 INPUT CONSTRAINTS DEBUG: Function inputs: {}",
            node.sig.inputs.len()
        );
        // Check if this is an Anchor instruction handler
        // Anchor handlers typically:
        // 1. Have #[instruction] attribute, OR
        // 2. Are public functions with Context<SomeAccountsStruct> as first parameter
        let is_instruction = node
            .attrs
            .iter()
            .any(|attr| attr.path().is_ident("instruction"));

        let is_anchor_handler = if is_instruction {
            true
        } else {
            // Only count functions that are clearly Anchor instruction handlers
            // Must be public AND have Context<...> AND have a very specific naming pattern
            // AND must be in instruction files (not utility functions)
            // AND must have exactly 2 parameters (Context + instruction data)
            matches!(node.vis, syn::Visibility::Public(_))
                && node.sig.inputs.len() == 2  // Context + instruction data
                && self.has_context_parameter(&node.sig.inputs[0])
                && (node.sig.ident.to_string().starts_with("handle_") 
                    || node.sig.ident.to_string().starts_with("ix_"))
                && self.current_file_path.contains("instructions/")
        };

        if is_anchor_handler {
            log::info!(
                "🔍 INPUT CONSTRAINTS DEBUG: Found Anchor instruction handler: {}",
                node.sig.ident
            );

            let mut account_count = 0;
            let mut numeric_param_count = 0;
            let mut vector_param_count = 0;
            let mut has_numeric_params = false;
            let mut has_vector_params = false;

            // Count function parameters (excluding self and context)
            for input in &node.sig.inputs {
                if let syn::FnArg::Typed(pat_type) = input {
                    if let syn::Pat::Ident(pat_ident) = &*pat_type.pat {
                        let param_name = pat_ident.ident.to_string();

                        // Skip common Anchor context parameters
                        if param_name == "ctx"
                            || param_name == "accounts"
                            || param_name == "program_id"
                        {
                            continue;
                        }

                        // Count numeric parameters
                        if self.is_numeric_type(&pat_type.ty) {
                            numeric_param_count += 1;
                            has_numeric_params = true;
                            log::info!(
                                "🔍 INPUT CONSTRAINTS DEBUG: Found numeric param: {} in handler {}",
                                param_name,
                                node.sig.ident
                            );
                        }

                        // Count vector parameters
                        if self.is_vector_type(&pat_type.ty) {
                            vector_param_count += 1;
                            has_vector_params = true;
                            log::info!(
                                "🔍 INPUT CONSTRAINTS DEBUG: Found vector param: {} in handler {}",
                                param_name,
                                node.sig.ident
                            );
                        }
                    }
                }
            }

            // Count accounts from context parameter (typically first parameter)
            // In Anchor, the Context<AccountsStruct> contains all the accounts
            // We'll estimate based on the function parameters and use a reasonable default
            if let Some(first_input) = node.sig.inputs.first() {
                if self.has_context_parameter(first_input) {
                    // Estimate account count based on function complexity
                    // Most Anchor handlers have 5-15 accounts
                    account_count = 8; // Reasonable default for most handlers

                    // Adjust based on number of parameters (more params often means more accounts)
                    if node.sig.inputs.len() > 2 {
                        account_count += 2;
                    }
                }
            }

            self.handlers.push(HandlerInfo {
                account_count,
                has_numeric_params,
                numeric_param_count,
                has_vector_params,
                vector_param_count,
            });
        }

        // Continue visiting
        syn::visit::visit_item_fn(self, node);
    }

    fn visit_item_struct(&mut self, node: &'ast ItemStruct) {
        // Check if this is an Anchor Accounts struct
        let is_accounts_struct = node.attrs.iter().any(|attr| {
            attr.path().is_ident("derive") && quote::quote!(#attr).to_string().contains("Accounts")
        });

        if is_accounts_struct {
            log::info!(
                "🔍 INPUT CONSTRAINTS DEBUG: Found Anchor Accounts struct: {}",
                node.ident
            );

            // Count constraints in the struct fields
            for field in &node.fields {
                self.count_anchor_constraints(&field.attrs);
            }
        }

        // Continue visiting
        syn::visit::visit_item_struct(self, node);
    }
}
