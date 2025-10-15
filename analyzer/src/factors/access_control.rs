//! Access-Controlled Handler analysis for Anchor smart contracts
//!
//! This module analyzes Anchor-specific access control patterns to count
//! handlers that are gated by signer/authority checks.

use std::collections::HashSet;
use std::path::PathBuf;
use syn::{visit::Visit, Attribute, Expr, Item};

#[derive(Debug, Clone, Default)]
pub struct AccessControlMetrics {
    /// Total number of access-controlled handlers
    pub total_access_controlled_handlers: usize,

    /// Number of handlers with #[access_control] decorators
    pub access_control_decorators: usize,

    /// Number of handlers with account constraints (has_one, mut, signer, etc.)
    pub account_constraint_handlers: usize,

    /// Number of handlers with explicit authority checks in function body
    pub explicit_authority_checks: usize,

    /// Number of distinct authority/role patterns found
    pub distinct_authority_patterns: usize,

    /// Set of unique authority patterns (for complexity assessment)
    pub authority_patterns: HashSet<String>,
}

impl AccessControlMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalAccessControlledHandlers": self.total_access_controlled_handlers,
            "accessControlDecorators": self.access_control_decorators,
            "accountConstraintHandlers": self.account_constraint_handlers,
            "explicitAuthorityChecks": self.explicit_authority_checks,
            "distinctAuthorityPatterns": self.distinct_authority_patterns,
            "authorityPatterns": self.authority_patterns.iter().collect::<Vec<_>>()
        })
    }
}

/// Calculate access control metrics for workspace files
pub fn calculate_workspace_access_control(
    workspace_path: &PathBuf,
    selected_files: &[String],
) -> Result<AccessControlMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 ACCESS CONTROL DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );
    log::info!(
        "🔍 ACCESS CONTROL DEBUG: Analyzing {} files",
        selected_files.len()
    );

    let mut metrics = AccessControlMetrics::default();
    let mut analyzed_files = 0;

    // Analyze each file
    for file_path in selected_files {
        let full_file_path = workspace_path.join(file_path);

        if full_file_path.exists() && full_file_path.is_file() {
            if let Some(extension) = full_file_path.extension() {
                if extension == "rs" {
                    match std::fs::read_to_string(&full_file_path) {
                        Ok(content) => {
                            match analyze_file_access_control(&content) {
                                Ok(file_metrics) => {
                                    // Merge metrics from this file
                                    metrics.total_access_controlled_handlers +=
                                        file_metrics.total_access_controlled_handlers;
                                    metrics.access_control_decorators +=
                                        file_metrics.access_control_decorators;
                                    metrics.account_constraint_handlers +=
                                        file_metrics.account_constraint_handlers;
                                    metrics.explicit_authority_checks +=
                                        file_metrics.explicit_authority_checks;

                                    // Merge authority patterns
                                    for pattern in file_metrics.authority_patterns {
                                        metrics.authority_patterns.insert(pattern);
                                    }

                                    analyzed_files += 1;

                                    log::debug!(
                                        "🔍 ACCESS CONTROL DEBUG: File {}: {} access-controlled handlers",
                                        file_path,
                                        file_metrics.total_access_controlled_handlers
                                    );
                                }
                                Err(e) => {
                                    log::warn!(
                                        "🔍 ACCESS CONTROL DEBUG: Failed to analyze access control for file {}: {}",
                                        file_path,
                                        e
                                    );
                                }
                            }
                        }
                        Err(e) => {
                            log::warn!(
                                "🔍 ACCESS CONTROL DEBUG: Failed to read file {}: {}",
                                file_path,
                                e
                            );
                        }
                    }
                }
            }
        }
    }

    // Calculate distinct authority patterns
    metrics.distinct_authority_patterns = metrics.authority_patterns.len();

    log::info!(
        "🔍 ACCESS CONTROL DEBUG: Analysis complete: {} files analyzed, {} total access-controlled handlers, {} distinct authority patterns",
        analyzed_files,
        metrics.total_access_controlled_handlers,
        metrics.distinct_authority_patterns
    );

    Ok(metrics)
}

/// Analyze access control patterns in a single file
pub fn analyze_file_access_control(
    content: &str,
) -> Result<AccessControlMetrics, Box<dyn std::error::Error>> {
    // First try AST-based analysis
    let mut metrics = match syn::parse_file(content) {
        Ok(syntax_tree) => {
            let mut visitor = AccessControlVisitor::new();
            visitor.visit_file(&syntax_tree);
            visitor.metrics
        }
        Err(_) => {
            // If AST parsing fails, fall back to string-based analysis
            log::debug!("AST parsing failed, falling back to string-based analysis");
            AccessControlMetrics::default()
        }
    };

    // Add string-based pattern detection for more reliable macro detection
    let string_metrics = analyze_string_patterns(content);

    // Merge the results
    metrics.total_access_controlled_handlers += string_metrics.total_access_controlled_handlers;
    metrics.access_control_decorators += string_metrics.access_control_decorators;
    metrics.account_constraint_handlers += string_metrics.account_constraint_handlers;
    metrics.explicit_authority_checks += string_metrics.explicit_authority_checks;

    for pattern in string_metrics.authority_patterns {
        metrics.authority_patterns.insert(pattern);
    }
    metrics.distinct_authority_patterns = metrics.authority_patterns.len();

    Ok(metrics)
}

/// String-based pattern analysis for more reliable detection
fn analyze_string_patterns(content: &str) -> AccessControlMetrics {
    let mut metrics = AccessControlMetrics::default();
    let lines: Vec<&str> = content.lines().collect();

    // Look for function definitions
    let mut in_function = false;
    let mut current_function_has_access_control = false;
    let mut current_function_has_authority_checks = false;

    for (line_num, line) in lines.iter().enumerate() {
        let line = line.trim();

        // Detect function definitions
        if line.starts_with("pub fn ") || line.starts_with("fn ") {
            // Reset for new function
            in_function = true;
            current_function_has_access_control = false;
            current_function_has_authority_checks = false;

            // Check for access control decorators in function attributes
            // Look at previous lines for attributes
            for i in (0..line_num).rev() {
                let prev_line = lines[i].trim();
                if prev_line.starts_with("#[") {
                    if prev_line.contains("access_control")
                        || prev_line.contains("only_authority")
                        || prev_line.contains("only_owner")
                        || prev_line.contains("require_auth")
                    {
                        metrics.access_control_decorators += 1;
                        current_function_has_access_control = true;
                        metrics
                            .authority_patterns
                            .insert("access_control_decorator".to_string());
                    }

                    if prev_line.contains("has_one")
                        || prev_line.contains("mut")
                        || prev_line.contains("signer")
                        || prev_line.contains("owner")
                        || prev_line.contains("authority")
                        || prev_line.contains("constraint")
                    {
                        metrics.account_constraint_handlers += 1;
                        current_function_has_access_control = true;
                        metrics
                            .authority_patterns
                            .insert("account_constraint".to_string());
                    }
                } else if !prev_line.starts_with("#") && !prev_line.is_empty() {
                    break; // Stop looking for attributes
                }
            }
        }

        // Check for authority checks within functions
        if in_function {
            // Look for macro calls
            if line.contains("check_assert_eq!")
                || line.contains("assert_eq!")
                || line.contains("require!")
            {
                metrics.explicit_authority_checks += 1;
                current_function_has_authority_checks = true;
                metrics
                    .authority_patterns
                    .insert("macro_assertion".to_string());
            }

            // Look for authority check function calls
            if line.contains("require_auth")
                || line.contains("require_authority")
                || line.contains("require_owner")
                || line.contains("require_signer")
                || line.contains("assert_authority")
                || line.contains("assert_owner")
            {
                metrics.explicit_authority_checks += 1;
                current_function_has_authority_checks = true;
                metrics
                    .authority_patterns
                    .insert("authority_function_call".to_string());
            }

            // Look for authority key comparisons
            if (line.contains("authority") && line.contains("AUTHORITY"))
                || (line.contains("owner") && line.contains("OWNER"))
                || (line.contains("admin") && line.contains("ADMIN"))
            {
                metrics.explicit_authority_checks += 1;
                current_function_has_authority_checks = true;
                metrics
                    .authority_patterns
                    .insert("authority_key_comparison".to_string());
            }

            // Check if function ends (next function or end of scope)
            if line == "}" && line_num + 1 < lines.len() {
                let next_line = lines[line_num + 1].trim();
                if next_line.starts_with("pub fn ")
                    || next_line.starts_with("fn ")
                    || next_line.starts_with("}")
                {
                    // Function ended, check if it had access control
                    if current_function_has_access_control || current_function_has_authority_checks
                    {
                        metrics.total_access_controlled_handlers += 1;
                    }
                    in_function = false;
                }
            }
        }
    }

    // Handle case where file ends while in a function
    if in_function && (current_function_has_access_control || current_function_has_authority_checks)
    {
        metrics.total_access_controlled_handlers += 1;
    }

    metrics.distinct_authority_patterns = metrics.authority_patterns.len();
    metrics
}

/// Visitor to analyze access control patterns
struct AccessControlVisitor {
    metrics: AccessControlMetrics,
    current_function: Option<String>,
}

impl AccessControlVisitor {
    fn new() -> Self {
        Self {
            metrics: AccessControlMetrics::default(),
            current_function: None,
        }
    }

    /// Check if an attribute is an access control decorator
    fn is_access_control_attr(&self, attr: &Attribute) -> bool {
        let attr_str = format!("{}", quote::quote! { #attr });

        // Check for Anchor #[access_control] patterns
        attr_str.contains("access_control")
            || attr_str.contains("only_authority")
            || attr_str.contains("only_owner")
            || attr_str.contains("require_auth")
    }

    /// Check if an attribute contains account constraints
    fn has_account_constraints(&self, attr: &Attribute) -> bool {
        let attr_str = format!("{}", quote::quote! { #attr });

        // Check for Anchor account constraint patterns
        attr_str.contains("has_one")
            || attr_str.contains("mut")
            || attr_str.contains("signer")
            || attr_str.contains("owner")
            || attr_str.contains("authority")
            || attr_str.contains("constraint")
    }

    /// Check if an expression is an authority check
    fn is_authority_check(&self, expr: &Expr) -> bool {
        match expr {
            Expr::Call(call_expr) => {
                if let Expr::Path(path_expr) = &*call_expr.func {
                    if let Some(segment) = path_expr.path.segments.last() {
                        let func_name = segment.ident.to_string();

                        // Check for common authority check functions
                        func_name == "require_auth"
                            || func_name == "require_authority"
                            || func_name == "require_owner"
                            || func_name == "require_signer"
                            || func_name == "assert_authority"
                            || func_name == "assert_owner"
                    } else {
                        false
                    }
                } else {
                    false
                }
            }
            Expr::Binary(binary_expr) => {
                // Check for equality checks with authority keys
                if let (Expr::Path(left_path), Expr::Path(right_path)) =
                    (&*binary_expr.left, &*binary_expr.right)
                {
                    let left_str = format!("{}", quote::quote! { #left_path });
                    let right_str = format!("{}", quote::quote! { #right_path });

                    (left_str.contains("authority") && right_str.contains("AUTHORITY"))
                        || (left_str.contains("owner") && right_str.contains("OWNER"))
                        || (left_str.contains("admin") && right_str.contains("ADMIN"))
                } else {
                    false
                }
            }
            _ => false,
        }
    }
}

impl<'ast> Visit<'ast> for AccessControlVisitor {
    fn visit_item(&mut self, item: &'ast Item) {
        match item {
            Item::Fn(item_fn) => {
                let function_name = item_fn.sig.ident.to_string();
                self.current_function = Some(function_name.clone());

                let mut has_access_control = false;
                let mut has_account_constraints = false;

                // Check function attributes for access control patterns
                for attr in &item_fn.attrs {
                    if self.is_access_control_attr(attr) {
                        self.metrics.access_control_decorators += 1;
                        has_access_control = true;
                        log::debug!("🔍 ACCESS CONTROL DEBUG: Found access control decorator in function: {}", function_name);
                    }

                    if self.has_account_constraints(attr) {
                        has_account_constraints = true;
                        log::debug!(
                            "🔍 ACCESS CONTROL DEBUG: Found account constraints in function: {}",
                            function_name
                        );
                    }
                }

                // Visit function body to check for explicit authority checks
                let mut has_explicit_checks = false;
                let mut body_visitor = AuthorityCheckVisitor::new();
                body_visitor.visit_block(&item_fn.block);

                if body_visitor.has_authority_checks {
                    self.metrics.explicit_authority_checks += 1;
                    has_explicit_checks = true;
                    log::debug!(
                        "🔍 ACCESS CONTROL DEBUG: Found explicit authority checks in function: {}",
                        function_name
                    );
                }

                // Add authority patterns found in this function
                for pattern in body_visitor.authority_patterns {
                    self.metrics.authority_patterns.insert(pattern);
                }

                // Count as access-controlled if any pattern is found
                if has_access_control || has_account_constraints || has_explicit_checks {
                    self.metrics.total_access_controlled_handlers += 1;

                    if has_account_constraints {
                        self.metrics.account_constraint_handlers += 1;
                    }
                }

                // Continue visiting the function
                syn::visit::visit_item_fn(self, item_fn);
            }
            _ => {
                // Continue visiting other items
                syn::visit::visit_item(self, item);
            }
        }
    }
}

/// Helper visitor to detect authority checks in function bodies
struct AuthorityCheckVisitor {
    has_authority_checks: bool,
    authority_patterns: HashSet<String>,
}

impl AuthorityCheckVisitor {
    fn new() -> Self {
        Self {
            has_authority_checks: false,
            authority_patterns: HashSet::new(),
        }
    }
}

impl<'ast> Visit<'ast> for AuthorityCheckVisitor {
    fn visit_expr(&mut self, expr: &'ast Expr) {
        match expr {
            Expr::Call(call_expr) => {
                if let Expr::Path(path_expr) = &*call_expr.func {
                    if let Some(segment) = path_expr.path.segments.last() {
                        let func_name = segment.ident.to_string();

                        // Check for Anchor authority check functions
                        if func_name == "require_auth"
                            || func_name == "require_authority"
                            || func_name == "require_owner"
                            || func_name == "require_signer"
                        {
                            self.has_authority_checks = true;
                            self.authority_patterns.insert(func_name.clone());
                        }

                        // Check for native Solana authority check macros
                        if func_name == "check_assert_eq"
                            || func_name == "assert_eq"
                            || func_name == "require"
                        {
                            self.has_authority_checks = true;
                            self.authority_patterns
                                .insert("native_assertion".to_string());
                        }
                    }
                }

                // Check for macro calls (like check_assert_eq!)
                if let Expr::Path(path_expr) = &*call_expr.func {
                    let path_str = format!("{}", quote::quote! { #path_expr });
                    if path_str.contains("check_assert_eq")
                        || path_str.contains("assert_eq")
                        || path_str.contains("require")
                    {
                        self.has_authority_checks = true;
                        self.authority_patterns
                            .insert("macro_assertion".to_string());
                    }
                }
            }
            Expr::Binary(binary_expr) => {
                // Check for authority key comparisons
                if let (Expr::Path(left_path), Expr::Path(right_path)) =
                    (&*binary_expr.left, &*binary_expr.right)
                {
                    let left_str = format!("{}", quote::quote! { #left_path });
                    let right_str = format!("{}", quote::quote! { #right_path });

                    if left_str.contains("authority") && right_str.contains("AUTHORITY") {
                        self.has_authority_checks = true;
                        self.authority_patterns
                            .insert("authority_key_check".to_string());
                    } else if left_str.contains("owner") && right_str.contains("OWNER") {
                        self.has_authority_checks = true;
                        self.authority_patterns
                            .insert("owner_key_check".to_string());
                    }
                }
            }
            Expr::Macro(macro_expr) => {
                // Check for macro calls like check_assert_eq!
                let macro_name = format!("{}", quote::quote! { #macro_expr.mac });
                if macro_name.contains("check_assert_eq")
                    || macro_name.contains("assert_eq")
                    || macro_name.contains("require")
                {
                    self.has_authority_checks = true;
                    self.authority_patterns
                        .insert("macro_assertion".to_string());
                }
            }
            _ => {}
        }

        // Continue visiting nested expressions
        syn::visit::visit_expr(self, expr);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_access_control_decorator() {
        let code = r#"
            #[access_control(only_authority)]
            pub fn admin_function(ctx: Context<AdminAction>) -> Result<()> {
                Ok(())
            }
        "#;

        let result = analyze_file_access_control(code).unwrap();
        assert_eq!(result.total_access_controlled_handlers, 1);
        assert_eq!(result.access_control_decorators, 1);
    }

    #[test]
    fn test_account_constraints() {
        let code = r#"
            #[account(has_one = authority)]
            pub fn restricted_function(ctx: Context<RestrictedAction>) -> Result<()> {
                Ok(())
            }
        "#;

        let result = analyze_file_access_control(code).unwrap();
        assert_eq!(result.total_access_controlled_handlers, 1);
        assert_eq!(result.account_constraint_handlers, 1);
    }

    #[test]
    fn test_explicit_authority_check() {
        let code = r#"
            pub fn check_authority(ctx: Context<CheckAuth>) -> Result<()> {
                require_auth(&ctx.accounts.authority)?;
                Ok(())
            }
        "#;

        let result = analyze_file_access_control(code).unwrap();
        assert_eq!(result.total_access_controlled_handlers, 1);
        assert_eq!(result.explicit_authority_checks, 1);
    }

    #[test]
    fn test_multiple_patterns() {
        let code = r#"
            #[access_control(only_authority)]
            #[account(has_one = owner)]
            pub fn complex_function(ctx: Context<ComplexAction>) -> Result<()> {
                require_auth(&ctx.accounts.authority)?;
                Ok(())
            }
        "#;

        let result = analyze_file_access_control(code).unwrap();
        assert_eq!(result.total_access_controlled_handlers, 1);
        assert_eq!(result.access_control_decorators, 1);
        assert_eq!(result.account_constraint_handlers, 1);
        assert_eq!(result.explicit_authority_checks, 1);
    }
}
