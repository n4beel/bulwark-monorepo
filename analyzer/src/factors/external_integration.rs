use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{visit::Visit, Expr, ItemFn, Path};

/// Metrics for external integration and oracle patterns
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ExternalIntegrationMetrics {
    // Oracle integrations
    pub pyth_oracle_integrations: u32,
    pub switchboard_oracle_integrations: u32,
    pub chainlink_oracle_integrations: u32,
    pub other_oracle_integrations: u32,
    pub total_oracle_integrations: u32,

    // Bridge integrations
    pub wormhole_bridge_integrations: u32,
    pub allbridge_integrations: u32,
    pub other_bridge_integrations: u32,
    pub total_bridge_integrations: u32,

    // DeFi protocol integrations
    pub jupiter_integrations: u32,
    pub raydium_integrations: u32,
    pub orca_integrations: u32,
    pub serum_integrations: u32,
    pub other_defi_integrations: u32,
    pub total_defi_integrations: u32,

    // External program calls
    pub external_cpi_calls: u32,
    pub external_program_references: u32,
    pub cross_program_invocations: u32,

    // Integration patterns
    pub price_feed_integrations: u32,
    pub token_swap_integrations: u32,
    pub lending_integrations: u32,
    pub staking_integrations: u32,
    pub other_integration_patterns: u32,

    // Detailed pattern breakdown
    pub integration_pattern_breakdown: HashMap<String, u32>,

    // Risk assessment
    pub integration_risk_score: f64,
    pub oracle_dependency_score: f64,
    pub external_dependency_score: f64,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl ExternalIntegrationMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "pythOracleIntegrations": self.pyth_oracle_integrations,
            "switchboardOracleIntegrations": self.switchboard_oracle_integrations,
            "chainlinkOracleIntegrations": self.chainlink_oracle_integrations,
            "otherOracleIntegrations": self.other_oracle_integrations,
            "totalOracleIntegrations": self.total_oracle_integrations,
            "wormholeBridgeIntegrations": self.wormhole_bridge_integrations,
            "allbridgeIntegrations": self.allbridge_integrations,
            "otherBridgeIntegrations": self.other_bridge_integrations,
            "totalBridgeIntegrations": self.total_bridge_integrations,
            "jupiterIntegrations": self.jupiter_integrations,
            "raydiumIntegrations": self.raydium_integrations,
            "orcaIntegrations": self.orca_integrations,
            "serumIntegrations": self.serum_integrations,
            "otherDefiIntegrations": self.other_defi_integrations,
            "totalDefiIntegrations": self.total_defi_integrations,
            "externalCpiCalls": self.external_cpi_calls,
            "externalProgramReferences": self.external_program_references,
            "crossProgramInvocations": self.cross_program_invocations,
            "priceFeedIntegrations": self.price_feed_integrations,
            "tokenSwapIntegrations": self.token_swap_integrations,
            "lendingIntegrations": self.lending_integrations,
            "stakingIntegrations": self.staking_integrations,
            "otherIntegrationPatterns": self.other_integration_patterns,
            "integrationPatternBreakdown": self.integration_pattern_breakdown,
            "integrationRiskScore": self.integration_risk_score,
            "oracleDependencyScore": self.oracle_dependency_score,
            "externalDependencyScore": self.external_dependency_score,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped
        })
    }
}

/// Visitor for detecting external integration patterns
#[derive(Debug)]
struct ExternalIntegrationVisitor {
    current_file_path: String,

    // Oracle counters
    pyth_oracle_integrations: u32,
    switchboard_oracle_integrations: u32,
    chainlink_oracle_integrations: u32,
    other_oracle_integrations: u32,

    // Bridge counters
    wormhole_bridge_integrations: u32,
    allbridge_integrations: u32,
    other_bridge_integrations: u32,

    // DeFi counters
    jupiter_integrations: u32,
    raydium_integrations: u32,
    orca_integrations: u32,
    serum_integrations: u32,
    other_defi_integrations: u32,

    // External program counters
    external_cpi_calls: u32,
    external_program_references: u32,
    cross_program_invocations: u32,

    // Integration pattern counters
    price_feed_integrations: u32,
    token_swap_integrations: u32,
    lending_integrations: u32,
    staking_integrations: u32,
    other_integration_patterns: u32,

    // Pattern tracking
    integration_pattern_counts: HashMap<String, u32>,
}

impl ExternalIntegrationVisitor {
    fn new() -> Self {
        Self {
            current_file_path: String::new(),
            pyth_oracle_integrations: 0,
            switchboard_oracle_integrations: 0,
            chainlink_oracle_integrations: 0,
            other_oracle_integrations: 0,
            wormhole_bridge_integrations: 0,
            allbridge_integrations: 0,
            other_bridge_integrations: 0,
            jupiter_integrations: 0,
            raydium_integrations: 0,
            orca_integrations: 0,
            serum_integrations: 0,
            other_defi_integrations: 0,
            external_cpi_calls: 0,
            external_program_references: 0,
            cross_program_invocations: 0,
            price_feed_integrations: 0,
            token_swap_integrations: 0,
            lending_integrations: 0,
            staking_integrations: 0,
            other_integration_patterns: 0,
            integration_pattern_counts: HashMap::new(),
        }
    }

    /// Record an integration pattern
    fn record_pattern(&mut self, pattern: &str) {
        *self
            .integration_pattern_counts
            .entry(pattern.to_string())
            .or_insert(0) += 1;
    }

    /// Check if a path represents Pyth oracle
    fn is_pyth_oracle(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "pyth"
                    | "pyth_solana"
                    | "pyth_price_feed"
                    | "PriceFeed"
                    | "get_price"
                    | "get_latest_price"
                    | "get_price_unchecked"
                    | "get_price_no_older_than"
            )
        } else {
            false
        }
    }

    /// Check if a path represents Switchboard oracle
    fn is_switchboard_oracle(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "switchboard"
                    | "switchboard_v2"
                    | "switchboard_solana"
                    | "switchboard_oracle"
                    | "AggregatorAccountData"
                    | "SwitchboardDecimal"
                    | "get_aggregator"
                    | "get_latest_result"
                    | "get_result"
                    | "check_confidence_interval"
                    | "check_staleness"
            )
        } else {
            false
        }
    }

    /// Check if a path represents Chainlink oracle
    fn is_chainlink_oracle(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "chainlink"
                    | "chainlink_solana"
                    | "chainlink_oracle"
                    | "get_latest_price"
                    | "get_latest_round"
            )
        } else {
            false
        }
    }

    /// Check if a path represents Wormhole bridge
    fn is_wormhole_bridge(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "wormhole" | "wormhole_bridge" | "wormhole_core" | "post_message" | "verify_vaa"
            )
        } else {
            false
        }
    }

    /// Check if a path represents AllBridge
    fn is_allbridge(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "allbridge"
                    | "allbridge_core"
                    | "allbridge_bridge"
                    | "bridge_tokens"
                    | "swap_tokens"
            )
        } else {
            false
        }
    }

    /// Check if a path represents external program
    fn is_external_program(&self, path: &Path) -> bool {
        if let Some(segment) = path.segments.last() {
            let name = segment.ident.to_string();
            matches!(
                name.as_str(),
                "invoke" | "invoke_signed" | "cpi" | "cpi_accounts" | "external_program"
            )
        } else {
            false
        }
    }

    /// Check if a path represents a DeFi protocol integration
    fn is_defi_protocol(&self, path: &Path) -> bool {
        // Check for full path patterns like jupiter::swap, raydium::amm, etc.
        let path_str = path
            .segments
            .iter()
            .map(|seg| seg.ident.to_string())
            .collect::<Vec<_>>()
            .join("::");

        matches!(
            path_str.as_str(),
            "jupiter::swap"
                | "jupiter::quote"
                | "jupiter::route"
                | "raydium::amm"
                | "raydium::swap"
                | "raydium::pool"
                | "orca::swap"
                | "orca::pool"
                | "orca::whirlpool"
                | "serum::dex"
                | "serum::market"
                | "serum::orderbook"
        )
    }

    /// Check if a function name indicates price feed integration
    fn is_price_feed_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "get_price"
                | "get_latest_price"
                | "get_price_feed"
                | "update_price"
                | "fetch_price"
                | "get_oracle_price"
        )
    }

    /// Check if a function name indicates token swap integration
    fn is_token_swap_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "swap"
                | "swap_tokens"
                | "swap_exact_in"
                | "swap_exact_out"
                | "swap_base_in"
                | "swap_base_out"
        )
    }

    /// Check if a function name indicates lending integration
    fn is_lending_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "borrow" | "lend" | "repay" | "liquidate" | "deposit" | "withdraw"
        )
    }

    /// Check if a function name indicates staking integration
    fn is_staking_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "stake" | "unstake" | "claim_rewards" | "delegate" | "undelegate" | "withdraw_stake"
        )
    }
}

impl<'ast> Visit<'ast> for ExternalIntegrationVisitor {
    fn visit_expr(&mut self, node: &'ast Expr) {
        match node {
            Expr::Call(call_expr) => {
                if let Expr::Path(path_expr) = &*call_expr.func {
                    // Check for oracle integrations
                    if self.is_pyth_oracle(&path_expr.path) {
                        self.pyth_oracle_integrations += 1;
                        self.price_feed_integrations += 1;
                        self.record_pattern("pyth_oracle_call");
                    }

                    if self.is_switchboard_oracle(&path_expr.path) {
                        self.switchboard_oracle_integrations += 1;
                        self.price_feed_integrations += 1;
                        self.record_pattern("switchboard_oracle_call");
                    }

                    if self.is_chainlink_oracle(&path_expr.path) {
                        self.chainlink_oracle_integrations += 1;
                        self.price_feed_integrations += 1;
                        self.record_pattern("chainlink_oracle_call");
                    }

                    // Check for bridge integrations
                    if self.is_wormhole_bridge(&path_expr.path) {
                        self.wormhole_bridge_integrations += 1;
                        self.record_pattern("wormhole_bridge_call");
                    }

                    if self.is_allbridge(&path_expr.path) {
                        self.allbridge_integrations += 1;
                        self.record_pattern("allbridge_call");
                    }

                    // Check for DeFi protocol integrations using full path analysis
                    if self.is_defi_protocol(&path_expr.path) {
                        let path_str = path_expr
                            .path
                            .segments
                            .iter()
                            .map(|seg| seg.ident.to_string())
                            .collect::<Vec<_>>()
                            .join("::");

                        if path_str.starts_with("jupiter::") {
                            self.jupiter_integrations += 1;
                            self.token_swap_integrations += 1;
                            self.record_pattern("jupiter_call");
                        } else if path_str.starts_with("raydium::") {
                            self.raydium_integrations += 1;
                            self.token_swap_integrations += 1;
                            self.record_pattern("raydium_call");
                        } else if path_str.starts_with("orca::") {
                            self.orca_integrations += 1;
                            self.token_swap_integrations += 1;
                            self.record_pattern("orca_call");
                        } else if path_str.starts_with("serum::") {
                            self.serum_integrations += 1;
                            self.token_swap_integrations += 1;
                            self.record_pattern("serum_call");
                        }
                    }

                    // Check for external program calls
                    if self.is_external_program(&path_expr.path) {
                        self.external_cpi_calls += 1;
                        self.cross_program_invocations += 1;
                        self.record_pattern("external_program_call");
                    }
                }
            }
            _ => {}
        }

        // Continue visiting expression
        syn::visit::visit_expr(self, node);
    }

    fn visit_expr_method_call(&mut self, node: &'ast syn::ExprMethodCall) {
        let method_name = node.method.to_string();

        // Check for oracle method calls
        if matches!(
            method_name.as_str(),
            "get_result" | "check_confidence_interval" | "check_staleness"
        ) {
            self.switchboard_oracle_integrations += 1;
            self.price_feed_integrations += 1;
            self.record_pattern(&format!("switchboard_method_{}", method_name));
        }

        if matches!(
            method_name.as_str(),
            "get_price" | "get_latest_price" | "get_price_unchecked" | "get_price_no_older_than"
        ) {
            self.pyth_oracle_integrations += 1;
            self.price_feed_integrations += 1;
            self.record_pattern(&format!("pyth_method_{}", method_name));
        }

        // Continue visiting method call
        syn::visit::visit_expr_method_call(self, node);
    }

    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let func_name = node.sig.ident.to_string();

        // Check for price feed functions
        if self.is_price_feed_function(&func_name) {
            self.price_feed_integrations += 1;
            self.record_pattern(&format!("price_feed_{}", func_name));
        }

        // Check for token swap functions
        if self.is_token_swap_function(&func_name) {
            self.token_swap_integrations += 1;
            self.record_pattern(&format!("token_swap_{}", func_name));
        }

        // Check for lending functions
        if self.is_lending_function(&func_name) {
            self.lending_integrations += 1;
            self.record_pattern(&format!("lending_{}", func_name));
        }

        // Check for staking functions
        if self.is_staking_function(&func_name) {
            self.staking_integrations += 1;
            self.record_pattern(&format!("staking_{}", func_name));
        }

        // Continue visiting function body
        syn::visit::visit_item_fn(self, node);
    }

    fn visit_use_tree(&mut self, node: &'ast syn::UseTree) {
        // Check for oracle imports using AST analysis
        match node {
            syn::UseTree::Path(use_path) => {
                let path_str = use_path.ident.to_string();
                if matches!(
                    path_str.as_str(),
                    "switchboard_solana" | "pyth_solana" | "chainlink"
                ) {
                    if path_str == "switchboard_solana" {
                        self.switchboard_oracle_integrations += 1;
                        self.price_feed_integrations += 1;
                        self.record_pattern("switchboard_import");
                    } else if path_str == "pyth_solana" {
                        self.pyth_oracle_integrations += 1;
                        self.price_feed_integrations += 1;
                        self.record_pattern("pyth_import");
                    } else if path_str == "chainlink" {
                        self.chainlink_oracle_integrations += 1;
                        self.price_feed_integrations += 1;
                        self.record_pattern("chainlink_import");
                    }
                }
            }
            syn::UseTree::Name(use_name) => {
                let name_str = use_name.ident.to_string();
                if matches!(
                    name_str.as_str(),
                    "AggregatorAccountData" | "SwitchboardDecimal" | "PriceFeed"
                ) {
                    if matches!(
                        name_str.as_str(),
                        "AggregatorAccountData" | "SwitchboardDecimal"
                    ) {
                        self.switchboard_oracle_integrations += 1;
                        self.price_feed_integrations += 1;
                        self.record_pattern("switchboard_type_import");
                    } else if name_str == "PriceFeed" {
                        self.pyth_oracle_integrations += 1;
                        self.price_feed_integrations += 1;
                        self.record_pattern("pyth_type_import");
                    }
                }
            }
            _ => {}
        }

        // Continue visiting use tree
        syn::visit::visit_use_tree(self, node);
    }
}

/// Calculate external integration metrics for workspace
pub fn calculate_workspace_external_integration(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<ExternalIntegrationMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 EXTERNAL INTEGRATION DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = ExternalIntegrationMetrics::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            log::warn!(
                "🔍 EXTERNAL INTEGRATION DEBUG: File does not exist: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!(
                "🔍 EXTERNAL INTEGRATION DEBUG: Skipping non-Rust file: {:?}",
                full_path
            );
            files_skipped += 1;
            continue;
        }

        log::info!(
            "🔍 EXTERNAL INTEGRATION DEBUG: Analyzing file: {:?}",
            full_path
        );

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = ExternalIntegrationVisitor::new();
        visitor.current_file_path = file_path.to_string();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.pyth_oracle_integrations += visitor.pyth_oracle_integrations;
        metrics.switchboard_oracle_integrations += visitor.switchboard_oracle_integrations;
        metrics.chainlink_oracle_integrations += visitor.chainlink_oracle_integrations;
        metrics.other_oracle_integrations += visitor.other_oracle_integrations;
        metrics.wormhole_bridge_integrations += visitor.wormhole_bridge_integrations;
        metrics.allbridge_integrations += visitor.allbridge_integrations;
        metrics.other_bridge_integrations += visitor.other_bridge_integrations;
        metrics.jupiter_integrations += visitor.jupiter_integrations;
        metrics.raydium_integrations += visitor.raydium_integrations;
        metrics.orca_integrations += visitor.orca_integrations;
        metrics.serum_integrations += visitor.serum_integrations;
        metrics.other_defi_integrations += visitor.other_defi_integrations;
        metrics.external_cpi_calls += visitor.external_cpi_calls;
        metrics.external_program_references += visitor.external_program_references;
        metrics.cross_program_invocations += visitor.cross_program_invocations;
        metrics.price_feed_integrations += visitor.price_feed_integrations;
        metrics.token_swap_integrations += visitor.token_swap_integrations;
        metrics.lending_integrations += visitor.lending_integrations;
        metrics.staking_integrations += visitor.staking_integrations;
        metrics.other_integration_patterns += visitor.other_integration_patterns;

        // Merge pattern breakdown
        for (pattern, count) in visitor.integration_pattern_counts {
            *metrics
                .integration_pattern_breakdown
                .entry(pattern)
                .or_insert(0) += count;
        }

        files_analyzed += 1;

        log::info!(
            "🔍 EXTERNAL INTEGRATION DEBUG: File {} analysis complete - pyth: {}, switchboard: {}, jupiter: {}, raydium: {}, external cpi: {}",
            file_path,
            visitor.pyth_oracle_integrations,
            visitor.switchboard_oracle_integrations,
            visitor.jupiter_integrations,
            visitor.raydium_integrations,
            visitor.external_cpi_calls
        );
    }

    // Add file analysis metadata
    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    // Calculate totals
    metrics.total_oracle_integrations = metrics.pyth_oracle_integrations
        + metrics.switchboard_oracle_integrations
        + metrics.chainlink_oracle_integrations
        + metrics.other_oracle_integrations;

    metrics.total_bridge_integrations = metrics.wormhole_bridge_integrations
        + metrics.allbridge_integrations
        + metrics.other_bridge_integrations;

    metrics.total_defi_integrations = metrics.jupiter_integrations
        + metrics.raydium_integrations
        + metrics.orca_integrations
        + metrics.serum_integrations
        + metrics.other_defi_integrations;

    // Calculate risk scores
    // Oracle Dependency Score (higher is more risky)
    let oracle_risk = metrics.total_oracle_integrations as f64 * 3.0;
    let bridge_risk = metrics.total_bridge_integrations as f64 * 5.0;
    let defi_risk = metrics.total_defi_integrations as f64 * 2.0;
    let cpi_risk = metrics.external_cpi_calls as f64 * 1.5;

    metrics.oracle_dependency_score = oracle_risk;
    metrics.external_dependency_score = bridge_risk + defi_risk + cpi_risk;
    metrics.integration_risk_score = oracle_risk + bridge_risk + defi_risk + cpi_risk;

    log::info!(
        "🔍 EXTERNAL INTEGRATION DEBUG: Analysis complete - {} files analyzed, {} files skipped, oracle integrations: {}, bridge integrations: {}, defi integrations: {}, risk score: {:.1}",
        files_analyzed,
        files_skipped,
        metrics.total_oracle_integrations,
        metrics.total_bridge_integrations,
        metrics.total_defi_integrations,
        metrics.integration_risk_score
    );

    Ok(metrics)
}
