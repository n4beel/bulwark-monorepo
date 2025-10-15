use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{
    visit::Visit, Attribute, Expr, ExprCall, ExprForLoop, ExprLoop, ExprWhile, ItemFn, ItemStruct,
    Path,
};

/// Metrics for Denial of Service and Resource Limits patterns
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct DosResourceLimitsMetrics {
    // Compute Unit Exhaustion Patterns (Solana: 200k CU per transaction)
    pub unbounded_loops: u32,
    pub bounded_loops: u32,
    pub nested_loops: u32,
    pub recursive_calls: u32,
    pub complex_math_operations: u32,
    pub cryptographic_operations: u32,
    pub string_processing_operations: u32,
    pub array_processing_operations: u32,
    pub cpi_sequences: u32,
    pub large_cpi_sequences: u32,

    // Account Size Limit Patterns (Solana: 10MB max account size)
    pub large_struct_definitions: u32,
    pub dynamic_array_allocations: u32,
    pub large_string_fields: u32,
    pub nested_data_structures: u32,
    pub large_account_initializations: u32,
    pub account_size_risks: u32,

    // Transaction Size Limit Patterns (Solana: 1232 bytes max transaction)
    pub large_instruction_handlers: u32,
    pub many_account_parameters: u32,
    pub complex_account_constraints: u32,
    pub extensive_validation_logic: u32,
    pub large_remaining_accounts: u32,
    pub transaction_size_risks: u32,

    // Memory Exhaustion Patterns
    pub memory_intensive_operations: u32,
    pub potential_memory_leaks: u32,
    pub large_data_allocations: u32,
    pub unbounded_data_structures: u32,
    pub memory_exhaustion_risks: u32,

    // Resource-Heavy Instruction Patterns
    pub high_compute_instructions: u32,
    pub resource_exhaustion_vectors: u32,
    pub dos_attack_vectors: u32,
    pub fee_exhaustion_risks: u32,

    // Detailed pattern breakdown
    pub dos_pattern_breakdown: HashMap<String, u32>,

    // Scoring
    pub dos_complexity_score: f64,
    pub compute_unit_risk_score: f64,
    pub account_size_risk_score: f64,
    pub transaction_size_risk_score: f64,
    pub memory_risk_score: f64,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl DosResourceLimitsMetrics {
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::to_value(self).unwrap_or(serde_json::Value::Null)
    }
}

/// Visitor for analyzing DOS and resource limit patterns
struct DosResourceLimitsVisitor {
    current_file_path: String,

    // Compute unit counters
    unbounded_loops: u32,
    bounded_loops: u32,
    nested_loops: u32,
    recursive_calls: u32,
    complex_math_operations: u32,
    cryptographic_operations: u32,
    string_processing_operations: u32,
    array_processing_operations: u32,
    cpi_sequences: u32,
    large_cpi_sequences: u32,

    // Account size counters
    large_struct_definitions: u32,
    dynamic_array_allocations: u32,
    large_string_fields: u32,
    nested_data_structures: u32,
    large_account_initializations: u32,
    account_size_risks: u32,

    // Transaction size counters
    large_instruction_handlers: u32,
    many_account_parameters: u32,
    complex_account_constraints: u32,
    extensive_validation_logic: u32,
    large_remaining_accounts: u32,
    transaction_size_risks: u32,

    // Memory counters
    memory_intensive_operations: u32,
    potential_memory_leaks: u32,
    large_data_allocations: u32,
    unbounded_data_structures: u32,
    memory_exhaustion_risks: u32,

    // Resource-heavy counters
    high_compute_instructions: u32,
    resource_exhaustion_vectors: u32,
    dos_attack_vectors: u32,
    fee_exhaustion_risks: u32,

    // Pattern tracking
    dos_pattern_counts: HashMap<String, u32>,
    loop_depth: u32,
}

impl DosResourceLimitsVisitor {
    fn new() -> Self {
        Self {
            current_file_path: String::new(),
            unbounded_loops: 0,
            bounded_loops: 0,
            nested_loops: 0,
            recursive_calls: 0,
            complex_math_operations: 0,
            cryptographic_operations: 0,
            string_processing_operations: 0,
            array_processing_operations: 0,
            cpi_sequences: 0,
            large_cpi_sequences: 0,
            large_struct_definitions: 0,
            dynamic_array_allocations: 0,
            large_string_fields: 0,
            nested_data_structures: 0,
            large_account_initializations: 0,
            account_size_risks: 0,
            large_instruction_handlers: 0,
            many_account_parameters: 0,
            complex_account_constraints: 0,
            extensive_validation_logic: 0,
            large_remaining_accounts: 0,
            transaction_size_risks: 0,
            memory_intensive_operations: 0,
            potential_memory_leaks: 0,
            large_data_allocations: 0,
            unbounded_data_structures: 0,
            memory_exhaustion_risks: 0,
            high_compute_instructions: 0,
            resource_exhaustion_vectors: 0,
            dos_attack_vectors: 0,
            fee_exhaustion_risks: 0,
            dos_pattern_counts: HashMap::new(),
            loop_depth: 0,
        }
    }

    /// Record a DOS pattern
    fn record_pattern(&mut self, pattern: &str) {
        *self
            .dos_pattern_counts
            .entry(pattern.to_string())
            .or_insert(0) += 1;
    }

    /// Check if a function name indicates high compute operations
    fn is_high_compute_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "compute"
                | "calculate"
                | "process"
                | "transform"
                | "encrypt"
                | "decrypt"
                | "hash"
                | "verify"
                | "validate"
                | "parse"
                | "serialize"
                | "deserialize"
        ) || func_name.contains("compute")
            || func_name.contains("calculate")
            || func_name.contains("process")
            || func_name.contains("transform")
            || func_name.contains("encrypt")
            || func_name.contains("decrypt")
            || func_name.contains("hash")
            || func_name.contains("verify")
            || func_name.contains("validate")
    }

    /// Check if a function name indicates cryptographic operations
    fn is_cryptographic_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "hash"
                | "sha256"
                | "keccak"
                | "blake2"
                | "ed25519"
                | "secp256k1"
                | "verify"
                | "sign"
                | "encrypt"
                | "decrypt"
                | "derive"
        ) || func_name.contains("hash")
            || func_name.contains("sha256")
            || func_name.contains("keccak")
            || func_name.contains("blake2")
            || func_name.contains("ed25519")
            || func_name.contains("secp256k1")
            || func_name.contains("verify")
            || func_name.contains("sign")
            || func_name.contains("encrypt")
            || func_name.contains("decrypt")
    }

    /// Check if a function name indicates string processing operations
    fn is_string_processing_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "parse"
                | "format"
                | "serialize"
                | "deserialize"
                | "encode"
                | "decode"
                | "convert"
                | "transform"
                | "split"
                | "join"
                | "replace"
                | "substring"
        ) || func_name.contains("parse")
            || func_name.contains("format")
            || func_name.contains("serialize")
            || func_name.contains("deserialize")
            || func_name.contains("encode")
            || func_name.contains("decode")
            || func_name.contains("convert")
            || func_name.contains("transform")
    }

    /// Check if a function name indicates array processing operations
    fn is_array_processing_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "sort"
                | "filter"
                | "map"
                | "reduce"
                | "fold"
                | "iter"
                | "collect"
                | "chunk"
                | "split"
                | "merge"
                | "search"
                | "find"
        ) || func_name.contains("sort")
            || func_name.contains("filter")
            || func_name.contains("map")
            || func_name.contains("reduce")
            || func_name.contains("fold")
            || func_name.contains("iter")
            || func_name.contains("collect")
            || func_name.contains("chunk")
            || func_name.contains("split")
            || func_name.contains("merge")
            || func_name.contains("search")
            || func_name.contains("find")
    }

    /// Check if a function name indicates CPI operations
    fn is_cpi_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "invoke" | "invoke_signed" | "cpi" | "cross_program" | "external_call"
        ) || func_name.contains("invoke")
            || func_name.contains("cpi")
            || func_name.contains("cross_program")
            || func_name.contains("external_call")
    }

    /// Check if a function name indicates recursive patterns
    fn is_recursive_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "recurse" | "recursive" | "traverse" | "walk" | "visit" | "explore"
        ) || func_name.contains("recurse")
            || func_name.contains("recursive")
            || func_name.contains("traverse")
            || func_name.contains("walk")
            || func_name.contains("visit")
            || func_name.contains("explore")
    }

    /// Check if a path represents high compute operations
    fn is_high_compute_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "compute"
                    | "calculate"
                    | "process"
                    | "transform"
                    | "encrypt"
                    | "decrypt"
                    | "hash"
                    | "verify"
                    | "validate"
            )
        } else {
            false
        }
    }

    /// Check if a path represents cryptographic operations
    fn is_cryptographic_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "hash"
                    | "sha256"
                    | "keccak"
                    | "blake2"
                    | "ed25519"
                    | "secp256k1"
                    | "verify"
                    | "sign"
                    | "encrypt"
                    | "decrypt"
            )
        } else {
            false
        }
    }

    /// Check if a path represents CPI operations
    fn is_cpi_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "invoke" | "invoke_signed" | "cpi" | "cross_program" | "external_call"
            )
        } else {
            false
        }
    }

    /// Check if an attribute indicates large account initialization
    fn is_large_account_attribute(&self, attr: &Attribute) -> bool {
        let attr_str = quote::quote!(#attr).to_string();
        attr_str.contains("space") && attr_str.contains("=")
    }

    /// Check if a struct indicates large data structure
    fn is_large_struct(&self, struct_item: &ItemStruct) -> bool {
        // Count fields to estimate size
        let field_count = struct_item.fields.len();
        field_count > 10 // Arbitrary threshold for "large" struct
    }
}

impl<'ast> Visit<'ast> for DosResourceLimitsVisitor {
    fn visit_expr_loop(&mut self, node: &'ast ExprLoop) {
        self.loop_depth += 1;

        // Check for unbounded loops
        if self.loop_depth == 1 {
            self.unbounded_loops += 1;
            self.record_pattern("unbounded_loop");
        } else {
            self.nested_loops += 1;
            self.record_pattern("nested_loop");
        }

        // Continue visiting loop body
        syn::visit::visit_expr_loop(self, node);

        self.loop_depth -= 1;
    }

    fn visit_expr_while(&mut self, node: &'ast ExprWhile) {
        self.loop_depth += 1;

        // Check for potentially unbounded while loops
        if self.loop_depth == 1 {
            self.unbounded_loops += 1;
            self.record_pattern("unbounded_while_loop");
        } else {
            self.nested_loops += 1;
            self.record_pattern("nested_while_loop");
        }

        // Continue visiting while body
        syn::visit::visit_expr_while(self, node);

        self.loop_depth -= 1;
    }

    fn visit_expr_for_loop(&mut self, node: &'ast ExprForLoop) {
        self.loop_depth += 1;

        // Check for bounded for loops
        if self.loop_depth == 1 {
            self.bounded_loops += 1;
            self.record_pattern("bounded_for_loop");
        } else {
            self.nested_loops += 1;
            self.record_pattern("nested_for_loop");
        }

        // Continue visiting for loop body
        syn::visit::visit_expr_for_loop(self, node);

        self.loop_depth -= 1;
    }

    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let Expr::Path(path_expr) = &*node.func {
            // Check for high compute operations
            if self.is_high_compute_pattern(&path_expr.path) {
                self.complex_math_operations += 1;
                self.record_pattern("high_compute_call");
            }

            // Check for cryptographic operations
            if self.is_cryptographic_pattern(&path_expr.path) {
                self.cryptographic_operations += 1;
                self.record_pattern("cryptographic_call");
            }

            // Check for CPI operations
            if self.is_cpi_pattern(&path_expr.path) {
                self.cpi_sequences += 1;
                self.record_pattern("cpi_call");
            }
        }

        // Continue visiting call
        syn::visit::visit_expr_call(self, node);
    }

    fn visit_expr_method_call(&mut self, node: &'ast syn::ExprMethodCall) {
        let method_name = node.method.to_string();

        // Check for string processing operations
        if matches!(
            method_name.as_str(),
            "parse"
                | "format"
                | "serialize"
                | "deserialize"
                | "encode"
                | "decode"
                | "convert"
                | "transform"
                | "split"
                | "join"
                | "replace"
                | "substring"
        ) {
            self.string_processing_operations += 1;
            self.record_pattern(&format!("string_processing_{}", method_name));
        }

        // Check for array processing operations
        if matches!(
            method_name.as_str(),
            "sort"
                | "filter"
                | "map"
                | "reduce"
                | "fold"
                | "iter"
                | "collect"
                | "chunk"
                | "split"
                | "merge"
                | "search"
                | "find"
        ) {
            self.array_processing_operations += 1;
            self.record_pattern(&format!("array_processing_{}", method_name));
        }

        // Check for cryptographic operations
        if matches!(
            method_name.as_str(),
            "hash"
                | "sha256"
                | "keccak"
                | "blake2"
                | "ed25519"
                | "secp256k1"
                | "verify"
                | "sign"
                | "encrypt"
                | "decrypt"
                | "derive"
        ) {
            self.cryptographic_operations += 1;
            self.record_pattern(&format!("cryptographic_{}", method_name));
        }

        // Check for CPI operations
        if matches!(
            method_name.as_str(),
            "invoke" | "invoke_signed" | "cpi" | "cross_program" | "external_call"
        ) {
            self.cpi_sequences += 1;
            self.record_pattern(&format!("cpi_{}", method_name));
        }

        // Continue visiting method call
        syn::visit::visit_expr_method_call(self, node);
    }

    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let func_name = node.sig.ident.to_string();

        // Check for high compute functions
        if self.is_high_compute_function(&func_name) {
            self.complex_math_operations += 1;
            self.record_pattern(&format!("high_compute_function_{}", func_name));
        }

        // Check for cryptographic functions
        if self.is_cryptographic_function(&func_name) {
            self.cryptographic_operations += 1;
            self.record_pattern(&format!("cryptographic_function_{}", func_name));
        }

        // Check for string processing functions
        if self.is_string_processing_function(&func_name) {
            self.string_processing_operations += 1;
            self.record_pattern(&format!("string_processing_function_{}", func_name));
        }

        // Check for array processing functions
        if self.is_array_processing_function(&func_name) {
            self.array_processing_operations += 1;
            self.record_pattern(&format!("array_processing_function_{}", func_name));
        }

        // Check for CPI functions
        if self.is_cpi_function(&func_name) {
            self.cpi_sequences += 1;
            self.record_pattern(&format!("cpi_function_{}", func_name));
        }

        // Check for recursive functions
        if self.is_recursive_function(&func_name) {
            self.recursive_calls += 1;
            self.record_pattern(&format!("recursive_function_{}", func_name));
        }

        // Check for large instruction handlers (many parameters)
        let param_count = node.sig.inputs.len();
        if param_count > 10 {
            self.large_instruction_handlers += 1;
            self.many_account_parameters += 1;
            self.record_pattern(&format!("large_handler_{}", func_name));
        }

        // Check for functions that contain DOS patterns in their names
        if func_name.contains("compute")
            || func_name.contains("process")
            || func_name.contains("calculate")
        {
            self.high_compute_instructions += 1;
            self.record_pattern(&format!("dos_function_{}", func_name));
        }

        // Continue visiting function body
        syn::visit::visit_item_fn(self, node);
    }

    fn visit_item_struct(&mut self, node: &'ast ItemStruct) {
        // Check for large struct definitions
        if self.is_large_struct(node) {
            self.large_struct_definitions += 1;
            self.record_pattern("large_struct_definition");
        }

        // Check for large account initializations
        for attr in &node.attrs {
            if self.is_large_account_attribute(attr) {
                self.large_account_initializations += 1;
                self.record_pattern("large_account_initialization");
            }
        }

        // Check struct name for resource patterns
        let struct_name = node.ident.to_string();
        if struct_name.contains("large")
            || struct_name.contains("big")
            || struct_name.contains("huge")
        {
            self.large_data_allocations += 1;
            self.record_pattern(&format!("large_struct_{}", struct_name));
        }

        // Continue visiting struct
        syn::visit::visit_item_struct(self, node);
    }
}

/// Calculate DOS and resource limits metrics for workspace
pub fn calculate_workspace_dos_resource_limits(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<DosResourceLimitsMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 DOS RESOURCE LIMITS DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = DosResourceLimitsMetrics::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            log::warn!(
                "🔍 DOS RESOURCE LIMITS DEBUG: File does not exist: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!(
                "🔍 DOS RESOURCE LIMITS DEBUG: Skipping non-Rust file: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        log::info!(
            "🔍 DOS RESOURCE LIMITS DEBUG: Analyzing file: {:?}",
            full_path
        );

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = DosResourceLimitsVisitor::new();
        visitor.current_file_path = file_path.to_string();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.unbounded_loops += visitor.unbounded_loops;
        metrics.bounded_loops += visitor.bounded_loops;
        metrics.nested_loops += visitor.nested_loops;
        metrics.recursive_calls += visitor.recursive_calls;
        metrics.complex_math_operations += visitor.complex_math_operations;
        metrics.cryptographic_operations += visitor.cryptographic_operations;
        metrics.string_processing_operations += visitor.string_processing_operations;
        metrics.array_processing_operations += visitor.array_processing_operations;
        metrics.cpi_sequences += visitor.cpi_sequences;
        metrics.large_cpi_sequences += visitor.large_cpi_sequences;
        metrics.large_struct_definitions += visitor.large_struct_definitions;
        metrics.dynamic_array_allocations += visitor.dynamic_array_allocations;
        metrics.large_string_fields += visitor.large_string_fields;
        metrics.nested_data_structures += visitor.nested_data_structures;
        metrics.large_account_initializations += visitor.large_account_initializations;
        metrics.account_size_risks += visitor.account_size_risks;
        metrics.large_instruction_handlers += visitor.large_instruction_handlers;
        metrics.many_account_parameters += visitor.many_account_parameters;
        metrics.complex_account_constraints += visitor.complex_account_constraints;
        metrics.extensive_validation_logic += visitor.extensive_validation_logic;
        metrics.large_remaining_accounts += visitor.large_remaining_accounts;
        metrics.transaction_size_risks += visitor.transaction_size_risks;
        metrics.memory_intensive_operations += visitor.memory_intensive_operations;
        metrics.potential_memory_leaks += visitor.potential_memory_leaks;
        metrics.large_data_allocations += visitor.large_data_allocations;
        metrics.unbounded_data_structures += visitor.unbounded_data_structures;
        metrics.memory_exhaustion_risks += visitor.memory_exhaustion_risks;
        metrics.high_compute_instructions += visitor.high_compute_instructions;
        metrics.resource_exhaustion_vectors += visitor.resource_exhaustion_vectors;
        metrics.dos_attack_vectors += visitor.dos_attack_vectors;
        metrics.fee_exhaustion_risks += visitor.fee_exhaustion_risks;

        // Merge pattern breakdown
        for (pattern, count) in visitor.dos_pattern_counts {
            *metrics.dos_pattern_breakdown.entry(pattern).or_insert(0) += count;
        }

        files_analyzed += 1;
    }

    // Calculate weighted complexity scores
    metrics.dos_complexity_score = calculate_dos_complexity_score(&metrics);
    metrics.compute_unit_risk_score = calculate_compute_unit_risk_score(&metrics);
    metrics.account_size_risk_score = calculate_account_size_risk_score(&metrics);
    metrics.transaction_size_risk_score = calculate_transaction_size_risk_score(&metrics);
    metrics.memory_risk_score = calculate_memory_risk_score(&metrics);

    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    log::info!(
        "🔍 DOS RESOURCE LIMITS DEBUG: Analysis complete. Files analyzed: {}, Files skipped: {}",
        files_analyzed,
        files_skipped
    );

    Ok(metrics)
}

/// Calculate DOS complexity score with weighted patterns
fn calculate_dos_complexity_score(metrics: &DosResourceLimitsMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk patterns (6x weight - critical DOS vectors)
    score += metrics.unbounded_loops as f64 * 6.0;
    score += metrics.recursive_calls as f64 * 6.0;
    score += metrics.large_cpi_sequences as f64 * 6.0;
    score += metrics.dos_attack_vectors as f64 * 6.0;

    // Medium-high risk patterns (5x weight - significant resource usage)
    score += metrics.nested_loops as f64 * 5.0;
    score += metrics.cryptographic_operations as f64 * 5.0;
    score += metrics.complex_math_operations as f64 * 5.0;
    score += metrics.large_account_initializations as f64 * 5.0;
    score += metrics.large_instruction_handlers as f64 * 5.0;

    // Medium risk patterns (4x weight - moderate resource usage)
    score += metrics.bounded_loops as f64 * 4.0;
    score += metrics.string_processing_operations as f64 * 4.0;
    score += metrics.array_processing_operations as f64 * 4.0;
    score += metrics.cpi_sequences as f64 * 4.0;
    score += metrics.large_struct_definitions as f64 * 4.0;
    score += metrics.many_account_parameters as f64 * 4.0;

    // Lower risk patterns (3x weight - potential resource usage)
    score += metrics.dynamic_array_allocations as f64 * 3.0;
    score += metrics.large_string_fields as f64 * 3.0;
    score += metrics.nested_data_structures as f64 * 3.0;
    score += metrics.complex_account_constraints as f64 * 3.0;
    score += metrics.extensive_validation_logic as f64 * 3.0;

    // Low risk patterns (2x weight - minimal resource usage)
    score += metrics.large_remaining_accounts as f64 * 2.0;
    score += metrics.memory_intensive_operations as f64 * 2.0;
    score += metrics.potential_memory_leaks as f64 * 2.0;
    score += metrics.large_data_allocations as f64 * 2.0;
    score += metrics.unbounded_data_structures as f64 * 2.0;

    score
}

/// Calculate compute unit risk score
fn calculate_compute_unit_risk_score(metrics: &DosResourceLimitsMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk compute patterns
    score += metrics.unbounded_loops as f64 * 8.0;
    score += metrics.recursive_calls as f64 * 8.0;
    score += metrics.nested_loops as f64 * 6.0;
    score += metrics.cryptographic_operations as f64 * 6.0;
    score += metrics.complex_math_operations as f64 * 5.0;

    // Medium-risk compute patterns
    score += metrics.bounded_loops as f64 * 4.0;
    score += metrics.string_processing_operations as f64 * 4.0;
    score += metrics.array_processing_operations as f64 * 4.0;
    score += metrics.cpi_sequences as f64 * 4.0;

    // Low-risk compute patterns
    score += metrics.high_compute_instructions as f64 * 2.0;

    score
}

/// Calculate account size risk score
fn calculate_account_size_risk_score(metrics: &DosResourceLimitsMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk account size patterns
    score += metrics.large_account_initializations as f64 * 6.0;
    score += metrics.large_struct_definitions as f64 * 5.0;
    score += metrics.dynamic_array_allocations as f64 * 5.0;

    // Medium-risk account size patterns
    score += metrics.large_string_fields as f64 * 4.0;
    score += metrics.nested_data_structures as f64 * 4.0;

    // Low-risk account size patterns
    score += metrics.account_size_risks as f64 * 2.0;

    score
}

/// Calculate transaction size risk score
fn calculate_transaction_size_risk_score(metrics: &DosResourceLimitsMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk transaction size patterns
    score += metrics.large_instruction_handlers as f64 * 6.0;
    score += metrics.many_account_parameters as f64 * 5.0;
    score += metrics.large_remaining_accounts as f64 * 5.0;

    // Medium-risk transaction size patterns
    score += metrics.complex_account_constraints as f64 * 4.0;
    score += metrics.extensive_validation_logic as f64 * 4.0;

    // Low-risk transaction size patterns
    score += metrics.transaction_size_risks as f64 * 2.0;

    score
}

/// Calculate memory risk score
fn calculate_memory_risk_score(metrics: &DosResourceLimitsMetrics) -> f64 {
    let mut score = 0.0;

    // High-risk memory patterns
    score += metrics.unbounded_data_structures as f64 * 6.0;
    score += metrics.potential_memory_leaks as f64 * 5.0;
    score += metrics.large_data_allocations as f64 * 4.0;

    // Medium-risk memory patterns
    score += metrics.memory_intensive_operations as f64 * 3.0;

    // Low-risk memory patterns
    score += metrics.memory_exhaustion_risks as f64 * 2.0;

    score
}
