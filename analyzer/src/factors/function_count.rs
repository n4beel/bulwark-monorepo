//! Function Count Analysis Factor
//!
//! This module provides functionality to count functions in Rust files
//! using AST parsing for accurate detection of different function types.

use syn::{File as SynFile, ImplItem, Item, ItemFn, Visibility};

/// Comprehensive function count metrics
#[derive(Debug, Clone, Default)]
pub struct FunctionCountMetrics {
    /// Total number of functions (all types)
    pub total_functions: usize,

    /// Public functions (pub fn)
    pub public_functions: usize,

    /// Private functions (no pub modifier)
    pub private_functions: usize,

    /// Associated functions (functions in impl blocks)
    pub associated_functions: usize,

    /// Free functions (top-level functions, not in impl blocks)
    pub free_functions: usize,

    /// Function Factor (0-100) based on total functions
    /// 0 = 5 functions or less, 100 = 300 functions or more
    pub function_factor: f64,
}

impl FunctionCountMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalFunctions": self.total_functions,
            "publicFunctions": self.public_functions,
            "privateFunctions": self.private_functions,
            "associatedFunctions": self.associated_functions,
            "freeFunctions": self.free_functions,
            "functionFactor": self.function_factor,
        })
    }

    /// Calculate Function Factor based on total functions
    /// 0 = 5 functions or less, 100 = 300 functions or more
    /// Linear mapping between 5 and 300
    pub fn calculate_function_factor(total_functions: usize) -> f64 {
        if total_functions <= 5 {
            return 0.0;
        }
        if total_functions >= 300 {
            return 100.0;
        }
        // Linear mapping between 5 and 300
        let factor = ((total_functions - 5) as f64 / (300 - 5) as f64) * 100.0;
        (factor * 100.0).round() / 100.0 // Round to 2 decimal places
    }
}

/// Count functions in Rust source code using AST parsing
///
/// This function provides comprehensive function counting that handles:
/// - All function visibility levels (pub, pub(crate), private)
/// - Associated functions vs free functions
/// - Multiline function signatures and generic functions
///
/// # Arguments
/// * `content` - The Rust source code content as a string
///
/// # Returns
/// * `Result<FunctionCountMetrics, String>` - Detailed function count metrics or parse error
pub fn count_functions(content: &str) -> Result<FunctionCountMetrics, String> {
    // Parse the Rust code into AST
    let syntax_tree: SynFile =
        syn::parse_file(content).map_err(|e| format!("Failed to parse Rust code: {}", e))?;

    let mut metrics = FunctionCountMetrics::default();

    // Traverse the AST and count functions
    count_functions_in_items(&syntax_tree.items, &mut metrics, false);

    // Calculate function factor
    metrics.function_factor =
        FunctionCountMetrics::calculate_function_factor(metrics.total_functions);

    Ok(metrics)
}

/// Recursively count functions in AST items
fn count_functions_in_items(
    items: &[Item],
    metrics: &mut FunctionCountMetrics,
    in_impl_block: bool,
) {
    for item in items {
        match item {
            // Standalone function definition
            Item::Fn(func) => {
                count_single_function(func, metrics, in_impl_block);
            }

            // Implementation block (impl Struct { ... })
            Item::Impl(impl_block) => {
                for impl_item in &impl_block.items {
                    if let ImplItem::Fn(method) = impl_item {
                        // Convert method to function-like structure for counting
                        count_method_function(&method.sig, &method.vis, metrics);
                    }
                }
            }

            // Module (mod name { ... }) - recursively search
            Item::Mod(module) => {
                if let Some((_, items)) = &module.content {
                    count_functions_in_items(items, metrics, in_impl_block);
                }
            }

            // Trait definitions can contain default method implementations
            Item::Trait(trait_item) => {
                for trait_item in &trait_item.items {
                    if let syn::TraitItem::Fn(method) = trait_item {
                        if method.default.is_some() {
                            // Count trait methods with default implementations
                            count_method_function(
                                &method.sig,
                                &syn::Visibility::Inherited,
                                metrics,
                            );
                        }
                    }
                }
            }

            _ => {} // Skip other item types (structs, enums, etc.)
        }
    }
}

/// Count a single function and update metrics
fn count_single_function(func: &ItemFn, metrics: &mut FunctionCountMetrics, in_impl_block: bool) {
    // Increment total count
    metrics.total_functions += 1;

    // Count by location
    if in_impl_block {
        metrics.associated_functions += 1;
    } else {
        metrics.free_functions += 1;
    }

    // Analyze function signature
    analyze_function_signature(&func.sig, &func.vis, metrics);
}

/// Count a method function and update metrics  
fn count_method_function(
    sig: &syn::Signature,
    vis: &Visibility,
    metrics: &mut FunctionCountMetrics,
) {
    // Increment total count
    metrics.total_functions += 1;
    metrics.associated_functions += 1;

    // Analyze function signature
    analyze_function_signature(sig, vis, metrics);
}

/// Analyze function signature for various attributes
fn analyze_function_signature(
    sig: &syn::Signature,
    vis: &Visibility,
    metrics: &mut FunctionCountMetrics,
) {
    // Count by visibility
    match vis {
        Visibility::Public(_) => metrics.public_functions += 1,
        Visibility::Restricted(restricted) => {
            // Check if it's pub(crate) which we consider public
            if restricted.path.is_ident("crate") {
                metrics.public_functions += 1;
            } else {
                metrics.private_functions += 1;
            }
        }
        Visibility::Inherited => metrics.private_functions += 1,
    }
}

/// Simple function count for backward compatibility with existing code
///
/// Returns just the total function count as a usize for easy integration
/// with existing analysis pipeline.
///
/// # Arguments
/// * `content` - The Rust source code content as a string
///
/// # Returns
/// * `usize` - Total number of functions, or 0 if parsing fails
pub fn count_total_functions(content: &str) -> usize {
    match count_functions(content) {
        Ok(metrics) => metrics.total_functions,
        Err(_) => 0, // Fallback to 0 if parsing fails
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_functions() {
        let content = r#"
            fn private_function() {}
            
            pub fn public_function() {}
            
            pub(crate) fn crate_function() {}
        "#;

        let metrics = count_functions(content).unwrap();
        assert_eq!(metrics.total_functions, 3);
        assert_eq!(metrics.public_functions, 2); // pub + pub(crate)
        assert_eq!(metrics.private_functions, 1);
        assert_eq!(metrics.free_functions, 3);
        assert_eq!(metrics.associated_functions, 0);
    }

    #[test]
    fn test_impl_block_functions() {
        let content = r#"
            struct MyStruct;
            
            impl MyStruct {
                pub fn public_method(&self) {}
                
                fn private_method(&self) {}
                
                pub fn associated_function() {}
            }
        "#;

        let metrics = count_functions(content).unwrap();
        assert_eq!(metrics.total_functions, 3);
        assert_eq!(metrics.public_functions, 2);
        assert_eq!(metrics.private_functions, 1);
        assert_eq!(metrics.associated_functions, 3);
        assert_eq!(metrics.free_functions, 0);
    }

    #[test]
    fn test_complex_solana_contract() {
        let content = r#"
            use anchor_lang::prelude::*;
            
            declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");
            
            #[program]
            pub mod my_program {
                use super::*;
                
                pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
                    Ok(())
                }
                
                pub fn update_data(ctx: Context<UpdateData>, data: u64) -> Result<()> {
                    Ok(())
                }
                
                fn internal_helper() -> u64 {
                    42
                }
            }
            
            #[derive(Accounts)]
            pub struct Initialize {}
            
            #[derive(Accounts)]  
            pub struct UpdateData {}
            
            impl Initialize {
                pub fn validate(&self) -> bool {
                    true
                }
            }
        "#;

        let metrics = count_functions(content).unwrap();
        assert_eq!(metrics.total_functions, 4); // initialize, update_data, internal_helper, validate
        assert_eq!(metrics.public_functions, 3);
        assert_eq!(metrics.private_functions, 1);
    }

    #[test]
    fn test_count_total_functions_simple() {
        let content = r#"
            fn function1() {}
            pub fn function2() {}
        "#;

        assert_eq!(count_total_functions(content), 2);
    }

    #[test]
    fn test_function_factor_calculation() {
        // Test edge cases and linear mapping

        // Test functions <= 5 (should be 0)
        let content_small = r#"
            fn function1() {}
            fn function2() {}
        "#;
        let result_small = count_functions(content_small).unwrap();
        assert_eq!(result_small.function_factor, 0.0);

        // Test functions between 5 and 300 (should be linear)
        // For example, 152.5 functions should be ~50
        // (152.5 - 5) / (300 - 5) * 100 = 147.5 / 295 * 100 = 50
        let factor_mid = FunctionCountMetrics::calculate_function_factor(152);
        // 152 gives us (152-5)/(300-5)*100 = 147/295*100 = 49.83
        assert!((factor_mid - 49.83).abs() < 0.1);

        // Test functions >= 300 (should be 100)
        let factor_large = FunctionCountMetrics::calculate_function_factor(500);
        assert_eq!(factor_large, 100.0);

        // Test exact boundaries
        let factor_5 = FunctionCountMetrics::calculate_function_factor(5);
        assert_eq!(factor_5, 0.0);

        let factor_300 = FunctionCountMetrics::calculate_function_factor(300);
        assert_eq!(factor_300, 100.0);

        // Test linear mapping at 1/4 point (78.75 ~= 79)
        // (79 - 5) / (300 - 5) * 100 = 74 / 295 * 100 = 25.08
        let factor_quarter = FunctionCountMetrics::calculate_function_factor(79);
        assert!((factor_quarter - 25.08).abs() < 0.1);
    }
}
