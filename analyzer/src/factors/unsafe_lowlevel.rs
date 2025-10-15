use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{visit::Visit, Expr, ExprUnsafe, ForeignItem, Item, ItemFn, ItemImpl, ItemTrait, Path};

/// Metrics for unsafe and low-level code usage
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct UnsafeLowLevelMetrics {
    // Total unsafe usage
    pub total_unsafe_blocks: u32,
    pub total_unsafe_functions: u32,
    pub total_unsafe_impls: u32,
    pub total_unsafe_traits: u32,
    pub total_ffi_functions: u32,
    pub total_raw_pointers: u32,
    pub total_unsafe_operations: u32,

    // Detailed pattern breakdown
    pub unsafe_pattern_breakdown: HashMap<String, u32>,

    // Specific unsafe patterns
    pub transmute_usage: u32,
    pub zero_copy_patterns: u32,
    pub manual_memory_ops: u32,
    pub pointer_arithmetic: u32,
    pub ffi_calls: u32,
    pub bytemuck_usage: u32,
    pub mem_transmute: u32,
    pub mem_zeroed: u32,
    pub ptr_operations: u32,
    pub libc_usage: u32,

    // Complexity metrics
    pub unsafe_complexity_score: f64,
    pub nested_unsafe_blocks: u32,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl UnsafeLowLevelMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "totalUnsafeBlocks": self.total_unsafe_blocks,
            "totalUnsafeFunctions": self.total_unsafe_functions,
            "totalUnsafeImpls": self.total_unsafe_impls,
            "totalUnsafeTraits": self.total_unsafe_traits,
            "totalFfiFunctions": self.total_ffi_functions,
            "totalRawPointers": self.total_raw_pointers,
            "totalUnsafeOperations": self.total_unsafe_operations,
            "unsafePatternBreakdown": self.unsafe_pattern_breakdown,
            "transmuteUsage": self.transmute_usage,
            "zeroCopyPatterns": self.zero_copy_patterns,
            "manualMemoryOps": self.manual_memory_ops,
            "pointerArithmetic": self.pointer_arithmetic,
            "ffiCalls": self.ffi_calls,
            "bytemuckUsage": self.bytemuck_usage,
            "memTransmute": self.mem_transmute,
            "memZeroed": self.mem_zeroed,
            "ptrOperations": self.ptr_operations,
            "libcUsage": self.libc_usage,
            "unsafeComplexityScore": self.unsafe_complexity_score,
            "nestedUnsafeBlocks": self.nested_unsafe_blocks,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped
        })
    }
}

/// Information about unsafe usage in a file
#[derive(Debug)]
struct UnsafeUsageInfo {
    unsafe_blocks: u32,
    unsafe_functions: u32,
    ffi_functions: u32,
    raw_pointers: u32,
    transmute_usage: u32,
    zero_copy_patterns: u32,
    manual_memory_ops: u32,
    pointer_arithmetic: u32,
    ffi_calls: u32,
}

/// Visitor for detecting unsafe and low-level code patterns
#[derive(Debug)]
struct UnsafeLowLevelVisitor {
    current_file_path: String,
    unsafe_blocks: u32,
    unsafe_functions: u32,
    unsafe_impls: u32,
    unsafe_traits: u32,
    ffi_functions: u32,
    raw_pointers: u32,

    // Detailed pattern counters
    unsafe_pattern_counts: HashMap<String, u32>,
    transmute_usage: u32,
    zero_copy_patterns: u32,
    manual_memory_ops: u32,
    pointer_arithmetic: u32,
    ffi_calls: u32,
    bytemuck_usage: u32,
    mem_transmute: u32,
    mem_zeroed: u32,
    ptr_operations: u32,
    libc_usage: u32,
    nested_unsafe_blocks: u32,
    unsafe_depth: u32,
}

impl UnsafeLowLevelVisitor {
    fn new() -> Self {
        Self {
            current_file_path: String::new(),
            unsafe_blocks: 0,
            unsafe_functions: 0,
            unsafe_impls: 0,
            unsafe_traits: 0,
            ffi_functions: 0,
            raw_pointers: 0,
            unsafe_pattern_counts: HashMap::new(),
            transmute_usage: 0,
            zero_copy_patterns: 0,
            manual_memory_ops: 0,
            pointer_arithmetic: 0,
            ffi_calls: 0,
            bytemuck_usage: 0,
            mem_transmute: 0,
            mem_zeroed: 0,
            ptr_operations: 0,
            libc_usage: 0,
            nested_unsafe_blocks: 0,
            unsafe_depth: 0,
        }
    }

    /// Record an unsafe operation pattern
    fn record_unsafe_operation(&mut self, pattern: &str) {
        *self
            .unsafe_pattern_counts
            .entry(pattern.to_string())
            .or_insert(0) += 1;
    }

    /// Check if a path represents bytemuck usage (common in Anchor)
    fn is_bytemuck_pattern(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.first() {
            let name = segment.ident.to_string();
            name == "bytemuck"
        } else {
            false
        }
    }

    /// Check if a path represents mem::transmute usage
    fn is_mem_transmute(&self, path: &Path) -> bool {
        if path.segments.len() >= 2 {
            let first = &path.segments[0].ident.to_string();
            let second = &path.segments[1].ident.to_string();
            first == "mem" && second == "transmute"
        } else {
            false
        }
    }

    /// Check if a path represents mem::zeroed usage
    fn is_mem_zeroed(&self, path: &Path) -> bool {
        if path.segments.len() >= 2 {
            let first = &path.segments[0].ident.to_string();
            let second = &path.segments[1].ident.to_string();
            first == "mem" && second == "zeroed"
        } else {
            false
        }
    }

    /// Check if a path represents ptr operations
    fn is_ptr_operation(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.first() {
            let name = segment.ident.to_string();
            name == "ptr"
        } else {
            false
        }
    }

    /// Check if a path represents libc usage
    fn is_libc_usage(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.first() {
            let name = segment.ident.to_string();
            name == "libc"
        } else {
            false
        }
    }
}

impl<'ast> Visit<'ast> for UnsafeLowLevelVisitor {
    fn visit_item(&mut self, node: &'ast Item) {
        // Continue visiting all items
        syn::visit::visit_item(self, node);
    }

    fn visit_expr_unsafe(&mut self, node: &'ast ExprUnsafe) {
        self.unsafe_blocks += 1;
        if self.unsafe_depth > 0 {
            self.nested_unsafe_blocks += 1;
        }
        self.unsafe_depth += 1;
        self.record_unsafe_operation("unsafe_expr");

        // Continue visiting the unsafe expression content
        syn::visit::visit_expr_unsafe(self, node);

        self.unsafe_depth -= 1;
    }

    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        // Check if function is marked as unsafe
        if node.sig.unsafety.is_some() {
            self.unsafe_functions += 1;
            self.record_unsafe_operation("unsafe_function");
        }

        // Continue visiting function body
        syn::visit::visit_item_fn(self, node);
    }

    fn visit_item_impl(&mut self, node: &'ast ItemImpl) {
        // Check if impl is marked as unsafe
        if node.unsafety.is_some() {
            self.unsafe_impls += 1;
            self.record_unsafe_operation("unsafe_impl");
        }

        // Continue visiting impl content
        syn::visit::visit_item_impl(self, node);
    }

    fn visit_item_trait(&mut self, node: &'ast ItemTrait) {
        // Check if trait is marked as unsafe
        if node.unsafety.is_some() {
            self.unsafe_traits += 1;
            self.record_unsafe_operation("unsafe_trait");
        }

        // Continue visiting trait content
        syn::visit::visit_item_trait(self, node);
    }

    fn visit_foreign_item(&mut self, node: &'ast ForeignItem) {
        match node {
            ForeignItem::Fn(_foreign_fn) => {
                self.ffi_functions += 1;
                self.record_unsafe_operation("ffi_function");
            }
            _ => {}
        }

        // Continue visiting foreign item content
        syn::visit::visit_foreign_item(self, node);
    }

    fn visit_expr(&mut self, node: &'ast Expr) {
        match node {
            Expr::Path(path_expr) => {
                // Check for Anchor-specific unsafe patterns

                // Check for bytemuck usage (common in Anchor for zero-copy)
                if self.is_bytemuck_pattern(&path_expr.path) {
                    self.bytemuck_usage += 1;
                    self.record_unsafe_operation("bytemuck");
                }

                // Check for mem::transmute
                if self.is_mem_transmute(&path_expr.path) {
                    self.mem_transmute += 1;
                    self.record_unsafe_operation("mem_transmute");
                }

                // Check for mem::zeroed
                if self.is_mem_zeroed(&path_expr.path) {
                    self.mem_zeroed += 1;
                    self.record_unsafe_operation("mem_zeroed");
                }

                // Check for ptr operations
                if self.is_ptr_operation(&path_expr.path) {
                    self.ptr_operations += 1;
                    self.record_unsafe_operation("ptr_operation");
                }

                // Check for libc usage
                if self.is_libc_usage(&path_expr.path) {
                    self.libc_usage += 1;
                    self.record_unsafe_operation("libc");
                }

                // Check for direct transmute usage
                if let Some(segment) = path_expr.path.segments.last() {
                    let name = segment.ident.to_string();
                    if name == "transmute" {
                        self.transmute_usage += 1;
                        self.record_unsafe_operation("transmute");
                    }
                }
            }
            _ => {}
        }

        // Continue visiting expression
        syn::visit::visit_expr(self, node);
    }

    fn visit_type(&mut self, node: &'ast syn::Type) {
        match node {
            syn::Type::Ptr(ptr_type) => {
                self.raw_pointers += 1;
                self.record_unsafe_operation("raw_pointer");
            }
            _ => {}
        }

        // Continue visiting type
        syn::visit::visit_type(self, node);
    }
}

/// Calculate unsafe and low-level usage metrics for workspace
pub fn calculate_workspace_unsafe_lowlevel(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<UnsafeLowLevelMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 UNSAFE LOW-LEVEL DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = UnsafeLowLevelMetrics::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            log::warn!(
                "🔍 UNSAFE LOW-LEVEL DEBUG: File does not exist: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!(
                "🔍 UNSAFE LOW-LEVEL DEBUG: Skipping non-Rust file: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        log::info!("🔍 UNSAFE LOW-LEVEL DEBUG: Analyzing file: {:?}", full_path);

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = UnsafeLowLevelVisitor::new();
        visitor.current_file_path = file_path.to_string();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.total_unsafe_blocks += visitor.unsafe_blocks;
        metrics.total_unsafe_functions += visitor.unsafe_functions;
        metrics.total_unsafe_impls += visitor.unsafe_impls;
        metrics.total_unsafe_traits += visitor.unsafe_traits;
        metrics.total_ffi_functions += visitor.ffi_functions;
        metrics.total_raw_pointers += visitor.raw_pointers;
        metrics.transmute_usage += visitor.transmute_usage;
        metrics.zero_copy_patterns += visitor.zero_copy_patterns;
        metrics.manual_memory_ops += visitor.manual_memory_ops;
        metrics.pointer_arithmetic += visitor.pointer_arithmetic;
        metrics.ffi_calls += visitor.ffi_calls;
        metrics.bytemuck_usage += visitor.bytemuck_usage;
        metrics.mem_transmute += visitor.mem_transmute;
        metrics.mem_zeroed += visitor.mem_zeroed;
        metrics.ptr_operations += visitor.ptr_operations;
        metrics.libc_usage += visitor.libc_usage;
        metrics.nested_unsafe_blocks += visitor.nested_unsafe_blocks;

        // Merge pattern breakdown
        for (pattern, count) in visitor.unsafe_pattern_counts {
            *metrics.unsafe_pattern_breakdown.entry(pattern).or_insert(0) += count;
        }

        files_analyzed += 1;

        log::info!(
            "🔍 UNSAFE LOW-LEVEL DEBUG: File {} analysis complete - unsafe blocks: {}, unsafe functions: {}, ffi functions: {}, raw pointers: {}",
            file_path,
            visitor.unsafe_blocks,
            visitor.unsafe_functions,
            visitor.ffi_functions,
            visitor.raw_pointers
        );
    }

    // Add file analysis metadata
    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    // Calculate total unsafe operations
    metrics.total_unsafe_operations = metrics.total_unsafe_blocks
        + metrics.total_unsafe_functions
        + metrics.total_unsafe_impls
        + metrics.total_unsafe_traits
        + metrics.total_ffi_functions
        + metrics.total_raw_pointers
        + metrics.transmute_usage
        + metrics.bytemuck_usage
        + metrics.mem_transmute
        + metrics.mem_zeroed
        + metrics.ptr_operations
        + metrics.libc_usage;

    // Calculate complexity score (weighted by unsafe operations)
    let unsafe_weight = 2.0;
    let transmute_weight = 3.0;
    let bytemuck_weight = 1.5;
    let ptr_weight = 2.5;

    metrics.unsafe_complexity_score = (metrics.total_unsafe_blocks as f64 * unsafe_weight)
        + (metrics.transmute_usage as f64 * transmute_weight)
        + (metrics.bytemuck_usage as f64 * bytemuck_weight)
        + (metrics.ptr_operations as f64 * ptr_weight);

    log::info!(
        "🔍 UNSAFE LOW-LEVEL DEBUG: Analysis complete - {} files analyzed, {} files skipped, total unsafe operations: {}, complexity score: {:.1}",
        files_analyzed,
        files_skipped,
        metrics.total_unsafe_operations,
        metrics.unsafe_complexity_score
    );

    Ok(metrics)
}
