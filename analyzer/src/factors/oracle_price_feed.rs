use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{
    visit::Visit, BinOp, Expr, ExprBinary, ExprCall, ExprIf, ItemEnum, ItemFn, ItemStruct, Path,
    UseTree,
};

/// Metrics for Oracle and Price Feed Usage patterns
#[derive(Debug, Default, Serialize, Deserialize)]
pub struct OraclePriceFeedMetrics {
    // Oracle program integrations
    pub oracle_programs_detected: u32,
    pub pyth_integrations: u32,
    pub switchboard_integrations: u32,
    pub chainlink_integrations: u32,
    pub custom_oracle_integrations: u32,
    pub external_price_sources: u32,

    // Price feed usage patterns
    pub price_feed_calls: u32,
    pub time_weighted_average_calls: u32,
    pub price_fetching_functions: u32,
    pub oracle_query_functions: u32,
    pub price_aggregation_functions: u32,

    // Oracle validation patterns
    pub staleness_checks: u32,
    pub confidence_interval_checks: u32,
    pub price_validation_checks: u32,
    pub price_range_checks: u32,
    pub oracle_status_checks: u32,
    pub timestamp_validation_checks: u32,

    // Oracle account and configuration types
    pub oracle_account_types: u32,
    pub price_feed_types: u32,
    pub oracle_configuration_types: u32,
    pub oracle_data_structures: u32,

    // Context classification
    pub handler_oracle_usage: u32,
    pub state_oracle_usage: u32,
    pub utility_oracle_usage: u32,
    pub test_oracle_usage: u32,

    // Detailed pattern breakdown
    pub oracle_pattern_breakdown: HashMap<String, u32>,

    // Scoring
    pub oracle_complexity_score: f64,
    pub price_feed_complexity_score: f64,
    pub validation_mechanism_score: f64,
    pub total_oracle_score: f64,

    // File analysis metadata
    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl OraclePriceFeedMetrics {
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::to_value(self).unwrap_or(serde_json::Value::Null)
    }
}

/// Visitor for analyzing oracle and price feed usage patterns
struct OraclePriceFeedVisitor {
    current_file_path: String,

    // Oracle program counters
    oracle_programs_detected: u32,
    pyth_integrations: u32,
    switchboard_integrations: u32,
    chainlink_integrations: u32,
    custom_oracle_integrations: u32,
    external_price_sources: u32,

    // Price feed usage counters
    price_feed_calls: u32,
    time_weighted_average_calls: u32,
    price_fetching_functions: u32,
    oracle_query_functions: u32,
    price_aggregation_functions: u32,

    // Oracle validation counters
    staleness_checks: u32,
    confidence_interval_checks: u32,
    price_validation_checks: u32,
    price_range_checks: u32,
    oracle_status_checks: u32,
    timestamp_validation_checks: u32,

    // Oracle type counters
    oracle_account_types: u32,
    price_feed_types: u32,
    oracle_configuration_types: u32,
    oracle_data_structures: u32,

    // Context counters
    handler_oracle_usage: u32,
    state_oracle_usage: u32,
    utility_oracle_usage: u32,
    test_oracle_usage: u32,

    // Pattern tracking
    oracle_pattern_counts: HashMap<String, u32>,
}

impl OraclePriceFeedVisitor {
    fn new() -> Self {
        Self {
            current_file_path: String::new(),
            oracle_programs_detected: 0,
            pyth_integrations: 0,
            switchboard_integrations: 0,
            chainlink_integrations: 0,
            custom_oracle_integrations: 0,
            external_price_sources: 0,
            price_feed_calls: 0,
            time_weighted_average_calls: 0,
            price_fetching_functions: 0,
            oracle_query_functions: 0,
            price_aggregation_functions: 0,
            staleness_checks: 0,
            confidence_interval_checks: 0,
            price_validation_checks: 0,
            price_range_checks: 0,
            oracle_status_checks: 0,
            timestamp_validation_checks: 0,
            oracle_account_types: 0,
            price_feed_types: 0,
            oracle_configuration_types: 0,
            oracle_data_structures: 0,
            handler_oracle_usage: 0,
            state_oracle_usage: 0,
            utility_oracle_usage: 0,
            test_oracle_usage: 0,
            oracle_pattern_counts: HashMap::new(),
        }
    }

    /// Record an oracle pattern
    fn record_pattern(&mut self, pattern: &str) {
        *self
            .oracle_pattern_counts
            .entry(pattern.to_string())
            .or_insert(0) += 1;
    }

    /// Check if a path indicates oracle program usage
    fn is_oracle_program_path(&self, path: &Path) -> bool {
        let path_str = quote::quote!(#path).to_string();
        path_str.contains("pyth")
            || path_str.contains("switchboard")
            || path_str.contains("chainlink")
            || path_str.contains("oracle")
            || path_str.contains("price_feed")
            || path_str.contains("aggregator")
    }

    /// Check if a path indicates Pyth oracle usage
    fn is_pyth_oracle_path(&self, path: &Path) -> bool {
        let path_str = quote::quote!(#path).to_string();
        path_str.contains("pyth_solana_receiver")
            || path_str.contains("pyth_price_feed")
            || path_str.contains("pyth::")
            || path_str.contains("pyth_solana")
    }

    /// Check if a path indicates Switchboard oracle usage
    fn is_switchboard_oracle_path(&self, path: &Path) -> bool {
        let path_str = quote::quote!(#path).to_string();
        path_str.contains("switchboard_v2")
            || path_str.contains("switchboard_oracle")
            || path_str.contains("switchboard::")
            || path_str.contains("switchboard_solana")
    }

    /// Check if a path indicates Chainlink oracle usage
    fn is_chainlink_oracle_path(&self, path: &Path) -> bool {
        let path_str = quote::quote!(#path).to_string();
        path_str.contains("chainlink_solana")
            || path_str.contains("chainlink::")
            || path_str.contains("chainlink_oracle")
    }

    /// Check if a function name indicates external price feed usage (not internal price math)
    fn is_price_feed_function(&self, func_name: &str) -> bool {
        // First check for explicit external oracle functions
        let is_external_oracle = matches!(
            func_name,
            "get_price"
                | "get_latest_price"
                | "get_price_feed"
                | "fetch_price"
                | "get_latest_result"
                | "get_aggregator_result"
                | "get_oracle_price"
                | "get_twap"
                | "get_ema_price"
                | "get_time_weighted_average"
                | "calculate_twap"
                | "get_price_data"
                | "get_price_info"
                | "read_oracle"
                | "load_price"
        );

        // Check for oracle-specific patterns (not internal price math)
        let is_oracle_pattern = (func_name.contains("oracle")
            && !self.is_internal_price_math(func_name))
            || (func_name.contains("feed") && !self.is_internal_price_math(func_name))
            || (func_name.contains("twap") && !self.is_internal_price_math(func_name))
            || (func_name.contains("ema") && !self.is_internal_price_math(func_name));

        is_external_oracle || is_oracle_pattern
    }

    /// Check if a function is internal price math (not external oracle usage)
    fn is_internal_price_math(&self, func_name: &str) -> bool {
        // Internal AMM price calculation patterns
        func_name.contains("sqrt_price")
            || func_name.contains("tick_index")
            || func_name.contains("bin_id")
            || func_name.contains("amount_a")
            || func_name.contains("amount_b")
            || func_name.contains("liquidity")
            || func_name.contains("rounding")
            || func_name.contains("from_input")
            || func_name.contains("from_amount")
            || func_name.contains("price_to_")
            || func_name.contains("_to_price")
            || func_name.contains("price_limit")
            || func_name.contains("price_target")
            || func_name.contains("price_diff")
            || func_name.contains("price_approximation")
            || func_name.contains("price_order")
            || func_name.contains("invert_price")
            || func_name.contains("mid_sqrt_price")
            || func_name.contains("bounded_sqrt_price")
            || func_name.contains("swap_ends_at")
            || func_name.contains("swap_starts_from")
            || func_name.contains("hit_max_sqrt_price")
            || func_name.contains("hit_min_sqrt_price")
            || func_name.contains("exceeds_tick_range")
            || func_name.contains("skip_range")
            || func_name.contains("cross_full_range")
            || func_name.contains("from_max_sqrt_price")
            || func_name.contains("from_min_sqrt_price")
            || func_name.contains("to_max_sqrt_price")
            || func_name.contains("to_min_sqrt_price")
            || func_name.contains("at_current_tick")
            || func_name.contains("at_max_tick")
            || func_name.contains("at_min_tick")
            || func_name.contains("over_current_tick")
            || func_name.contains("under_current_tick")
            || func_name.contains("over_max_tick")
            || func_name.contains("under_min_tick")
            || func_name.contains("explicit_max")
            || func_name.contains("explicit_min")
            || func_name.contains("stop_limit")
            || func_name.contains("with_last_init_tick")
            || func_name.contains("map_to_min")
            || func_name.contains("map_to_max")
            || func_name.contains("exact_in")
            || func_name.contains("exact_out")
            || func_name.contains("single_test")
            || func_name.contains("test_")
            // Whirlpools-specific internal oracle patterns
            || func_name.contains("adaptive_fee")
            || func_name.contains("trade_enabled")
            || func_name.contains("oracle_account_initialized")
            || func_name.contains("is_oracle_account_initialized")
            || func_name.contains("get_adaptive_fee_info")
            || func_name.contains("is_trade_enabled")
            || func_name.contains("new_with_initialized_oracle_account")
            || func_name.contains("new_with_uninitialized_oracle_account")
            || func_name.contains("accrued_tokens_ok_closed_position_ticks_remain_initialized")
            // Account parsing and utility functions
            || func_name.contains("parse_remaining_accounts")
            || func_name.contains("remaining_accounts")
            || func_name.contains("account_info")
            || func_name.contains("account_mock")
            || func_name.contains("mock")
            || func_name.contains("test_utils")
            || func_name.contains("utils")
    }

    /// Check if a function name indicates oracle validation
    fn is_oracle_validation_function(&self, func_name: &str) -> bool {
        matches!(
            func_name,
            "validate_price"
                | "check_price_staleness"
                | "validate_oracle_price"
                | "check_price_confidence"
                | "validate_price_range"
                | "check_oracle_status"
                | "validate_timestamp"
                | "check_price_age"
        ) || func_name.contains("validate_price")
            || func_name.contains("check_staleness")
            || func_name.contains("validate_oracle")
            || func_name.contains("check_confidence")
            || func_name.contains("validate_timestamp")
    }

    /// Check if a struct name indicates external oracle account type (not internal price math)
    fn is_oracle_account_type(&self, struct_name: &str) -> bool {
        // Check for explicit external oracle account types
        let is_external_oracle = matches!(
            struct_name,
            "PriceFeed"
                | "OracleAccount"
                | "PriceData"
                | "OracleData"
                | "PriceInfo"
                | "OracleInfo"
                | "AggregatorAccount"
                | "SwitchboardAccount"
                | "PythAccount"
                | "ChainlinkAccount"
                | "StubOracle"
                | "PriceCache"
                | "CachePricesLog"
        );

        // Check for oracle patterns but exclude internal price math structures
        let is_oracle_pattern = (struct_name.contains("Oracle")
            && !self.is_internal_price_struct(struct_name))
            || (struct_name.contains("Price") && !self.is_internal_price_struct(struct_name))
            || (struct_name.contains("Feed") && !self.is_internal_price_struct(struct_name))
            || (struct_name.contains("Aggregator") && !self.is_internal_price_struct(struct_name));

        is_external_oracle || is_oracle_pattern
    }

    /// Check if a struct is internal price math (not external oracle)
    fn is_internal_price_struct(&self, struct_name: &str) -> bool {
        // Internal AMM price calculation structures
        struct_name.contains("SqrtPrice")
            || struct_name.contains("Tick")
            || struct_name.contains("Bin")
            || struct_name.contains("Liquidity")
            || struct_name.contains("Amount")
            || struct_name.contains("Swap")
            || struct_name.contains("Pool")
            || struct_name.contains("Position")
            || struct_name.contains("Whirlpool")
            || struct_name.contains("AdaptiveFee")
            || struct_name.contains("FeeRate")
            || struct_name.contains("Volatility")
            || struct_name.contains("Accumulator")
            || struct_name.contains("Constants")
            || struct_name.contains("Variables")
            || struct_name.contains("Config")
            || struct_name.contains("State")
            || struct_name.contains("Data")
            || struct_name.contains("Info")
            || struct_name.contains("Log")
            || struct_name.contains("Event")
            || struct_name.contains("Instruction")
            || struct_name.contains("Context")
            || struct_name.contains("Accounts")
            || struct_name.contains("Builder")
            || struct_name.contains("Cpi")
            || struct_name.contains("Mock")
            || struct_name.contains("Test")
            // Whirlpools-specific internal oracle structures
            || struct_name == "Oracle" // Whirlpools' internal adaptive fee oracle
            || struct_name == "OracleAccessor" // Whirlpools' oracle accessor
            || struct_name == "OracleFacade" // Non-existent but being detected
            || struct_name == "OracleFilter" // Non-existent but being detected
            || struct_name.contains("OracleAccessor")
            || struct_name.contains("OracleFacade")
            || struct_name.contains("OracleFilter")
            || struct_name.contains("AdaptiveFee")
            || struct_name.contains("TradeEnable")
            || struct_name.contains("AccountInfo")
            || struct_name.contains("RemainingAccounts")
            || struct_name.contains("ParsedRemainingAccounts")
    }

    /// Check if a binary expression indicates external oracle validation (not internal price math)
    fn is_oracle_validation_pattern(&self, op: &BinOp, left: &Expr, right: &Expr) -> bool {
        let left_str = quote::quote!(#left).to_string();
        let right_str = quote::quote!(#right).to_string();

        // Skip internal price math validation patterns
        if self.is_internal_price_validation(&left_str, &right_str) {
            return false;
        }

        match op {
            BinOp::Gt(_) | BinOp::Ge(_) | BinOp::Lt(_) | BinOp::Le(_) => {
                // Check for external oracle staleness patterns
                (left_str.contains("timestamp")
                    && (right_str.contains("stale") || right_str.contains("max_age")))
                    || (left_str.contains("current_time") && right_str.contains("oracle_timestamp"))
                    || (left_str.contains("oracle_age") && right_str.contains("max"))
                    || (left_str.contains("confidence") && right_str.contains("min_confidence"))
                    || (left_str.contains("oracle_price") && right_str.contains("min"))
                    || (left_str.contains("oracle_price") && right_str.contains("max"))
                    || (left_str.contains("price_feed") && right_str.contains("threshold"))
            }
            BinOp::Eq(_) | BinOp::Ne(_) => {
                // Check for external oracle status validation patterns
                (left_str.contains("oracle_status") || left_str.contains("feed_status"))
                    || (left_str.contains("trading") && right_str.contains("enabled"))
            }
            _ => false,
        }
    }

    /// Check if validation is internal price math (not external oracle validation)
    fn is_internal_price_validation(&self, left_str: &str, right_str: &str) -> bool {
        // Internal AMM price validation patterns
        left_str.contains("sqrt_price")
            || left_str.contains("tick")
            || left_str.contains("bin")
            || left_str.contains("liquidity")
            || left_str.contains("amount")
            || left_str.contains("swap")
            || left_str.contains("pool")
            || left_str.contains("position")
            || left_str.contains("whirlpool")
            || left_str.contains("adaptive_fee")
            || left_str.contains("fee_rate")
            || left_str.contains("volatility")
            || left_str.contains("accumulator")
            || right_str.contains("sqrt_price")
            || right_str.contains("tick")
            || right_str.contains("bin")
            || right_str.contains("liquidity")
            || right_str.contains("amount")
            || right_str.contains("swap")
            || right_str.contains("pool")
            || right_str.contains("position")
            || right_str.contains("whirlpool")
            || right_str.contains("adaptive_fee")
            || right_str.contains("fee_rate")
            || right_str.contains("volatility")
            || right_str.contains("accumulator")
    }

    /// Check if a path indicates external oracle time-weighted average usage (not internal price math)
    fn is_twap_function_path(&self, path: &Path) -> bool {
        let path_str = quote::quote!(#path).to_string();

        // Check for external oracle TWAP patterns
        let is_external_twap = path_str.contains("oracle_twap")
            || path_str.contains("price_feed_twap")
            || path_str.contains("external_twap")
            || path_str.contains("oracle_ema")
            || path_str.contains("price_feed_ema")
            || path_str.contains("external_ema")
            || path_str.contains("oracle_time_weighted")
            || path_str.contains("price_feed_time_weighted")
            || path_str.contains("external_time_weighted")
            || path_str.contains("oracle_moving_average")
            || path_str.contains("price_feed_moving_average")
            || path_str.contains("external_moving_average");

        // Check for general TWAP patterns but exclude internal price math
        let is_general_twap = (path_str.contains("twap") && !self.is_internal_twap_path(&path_str))
            || (path_str.contains("ema") && !self.is_internal_twap_path(&path_str))
            || (path_str.contains("time_weighted") && !self.is_internal_twap_path(&path_str))
            || (path_str.contains("moving_average") && !self.is_internal_twap_path(&path_str));

        is_external_twap || is_general_twap
    }

    /// Check if a TWAP path is internal price math (not external oracle)
    fn is_internal_twap_path(&self, path_str: &str) -> bool {
        // Internal AMM TWAP calculation patterns
        path_str.contains("sqrt_price")
            || path_str.contains("tick")
            || path_str.contains("bin")
            || path_str.contains("liquidity")
            || path_str.contains("amount")
            || path_str.contains("swap")
            || path_str.contains("pool")
            || path_str.contains("position")
            || path_str.contains("whirlpool")
            || path_str.contains("adaptive_fee")
            || path_str.contains("fee_rate")
            || path_str.contains("volatility")
            || path_str.contains("accumulator")
            || path_str.contains("price_limit")
            || path_str.contains("price_target")
            || path_str.contains("price_diff")
            || path_str.contains("price_approximation")
            || path_str.contains("price_order")
            || path_str.contains("invert_price")
            || path_str.contains("mid_sqrt_price")
            || path_str.contains("bounded_sqrt_price")
            || path_str.contains("swap_ends_at")
            || path_str.contains("swap_starts_from")
            || path_str.contains("hit_max_sqrt_price")
            || path_str.contains("hit_min_sqrt_price")
            || path_str.contains("exceeds_tick_range")
            || path_str.contains("skip_range")
            || path_str.contains("cross_full_range")
            || path_str.contains("from_max_sqrt_price")
            || path_str.contains("from_min_sqrt_price")
            || path_str.contains("to_max_sqrt_price")
            || path_str.contains("to_min_sqrt_price")
            || path_str.contains("at_current_tick")
            || path_str.contains("at_max_tick")
            || path_str.contains("at_min_tick")
            || path_str.contains("over_current_tick")
            || path_str.contains("under_current_tick")
            || path_str.contains("over_max_tick")
            || path_str.contains("under_min_tick")
            || path_str.contains("explicit_max")
            || path_str.contains("explicit_min")
            || path_str.contains("stop_limit")
            || path_str.contains("with_last_init_tick")
            || path_str.contains("map_to_min")
            || path_str.contains("map_to_max")
            || path_str.contains("exact_in")
            || path_str.contains("exact_out")
            || path_str.contains("single_test")
            || path_str.contains("test_")
            // Account parsing and utility functions (not TWAP)
            || path_str.contains("parse_remaining_accounts")
            || path_str.contains("remaining_accounts")
            || path_str.contains("account_info")
            || path_str.contains("account_mock")
            || path_str.contains("mock")
            || path_str.contains("test_utils")
            || path_str.contains("utils")
            || path_str.contains("ParsedRemainingAccounts")
            || path_str.contains("default")
            || path_str.contains("Default")
    }

    /// Check if a function name is a known false positive (doesn't exist in codebase)
    fn is_known_false_positive_function(&self, func_name: &str) -> bool {
        // Functions that don't exist but are being detected
        matches!(
            func_name,
            "fetch_oracle"
                | "fetch_all_oracle"
                | "fetch_all_maybe_oracle"
                | "fetch_all_oracle_with_filter"
                | "fetch_maybe_oracle"
                | "get_oracle_address"
                | "test_oracle"
                | "OracleFacade"
                | "OracleFilter"
        ) || func_name.contains("fetch_oracle")
            || func_name.contains("fetch_all_oracle")
            || func_name.contains("fetch_maybe_oracle")
            || func_name.contains("get_oracle_address")
            || func_name.contains("test_oracle")
            || func_name.contains("OracleFacade")
            || func_name.contains("OracleFilter")
    }

    /// Classify function context
    fn classify_function_context(&self, func_name: &str) -> &'static str {
        if func_name.contains("test") || func_name.starts_with("test_") {
            "test"
        } else if func_name.contains("handler") || func_name.contains("instruction") {
            "handler"
        } else if func_name.contains("state") || func_name.contains("account") {
            "state"
        } else {
            "utility"
        }
    }
}

impl<'ast> Visit<'ast> for OraclePriceFeedVisitor {
    fn visit_use_tree(&mut self, node: &'ast UseTree) {
        // Check for oracle program imports
        let use_str = quote::quote!(#node).to_string();

        if use_str.contains("pyth") {
            self.pyth_integrations += 1;
            self.oracle_programs_detected += 1;
            self.external_price_sources += 1;
            self.record_pattern("pyth_import");
        } else if use_str.contains("switchboard") {
            self.switchboard_integrations += 1;
            self.oracle_programs_detected += 1;
            self.external_price_sources += 1;
            self.record_pattern("switchboard_import");
        } else if use_str.contains("chainlink") {
            self.chainlink_integrations += 1;
            self.oracle_programs_detected += 1;
            self.external_price_sources += 1;
            self.record_pattern("chainlink_import");
        } else if use_str.contains("oracle") || use_str.contains("price_feed") {
            self.custom_oracle_integrations += 1;
            self.oracle_programs_detected += 1;
            self.external_price_sources += 1;
            self.record_pattern("custom_oracle_import");
        }

        // Continue visiting use tree
        syn::visit::visit_use_tree(self, node);
    }

    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let Expr::Path(path_expr) = &*node.func {
            let path_str = quote::quote!(#path_expr).to_string();

            // Check for oracle program calls
            if self.is_pyth_oracle_path(&path_expr.path) {
                self.pyth_integrations += 1;
                self.price_feed_calls += 1;
                self.record_pattern(&format!("pyth_call_{}", path_str));
            } else if self.is_switchboard_oracle_path(&path_expr.path) {
                self.switchboard_integrations += 1;
                self.price_feed_calls += 1;
                self.record_pattern(&format!("switchboard_call_{}", path_str));
            } else if self.is_chainlink_oracle_path(&path_expr.path) {
                self.chainlink_integrations += 1;
                self.price_feed_calls += 1;
                self.record_pattern(&format!("chainlink_call_{}", path_str));
            } else if self.is_oracle_program_path(&path_expr.path) {
                self.custom_oracle_integrations += 1;
                self.price_feed_calls += 1;
                self.record_pattern(&format!("oracle_call_{}", path_str));
            }

            // Check for time-weighted average calls
            if self.is_twap_function_path(&path_expr.path) {
                self.time_weighted_average_calls += 1;
                self.record_pattern(&format!("twap_call_{}", path_str));
            }
        }

        // Continue visiting call
        syn::visit::visit_expr_call(self, node);
    }

    fn visit_expr_binary(&mut self, node: &'ast ExprBinary) {
        // Check for oracle validation patterns
        if self.is_oracle_validation_pattern(&node.op, &node.left, &node.right) {
            let left_str = quote::quote!(#node.left).to_string();
            let right_str = quote::quote!(#node.right).to_string();

            // Check for specific validation patterns
            if left_str.contains("timestamp") || right_str.contains("stale") {
                self.staleness_checks += 1;
                self.record_pattern("staleness_check");
            } else if left_str.contains("confidence") || right_str.contains("confidence") {
                self.confidence_interval_checks += 1;
                self.record_pattern("confidence_check");
            } else if left_str.contains("price")
                && (right_str.contains("min") || right_str.contains("max"))
            {
                self.price_range_checks += 1;
                self.record_pattern("price_range_check");
            } else if left_str.contains("status") || right_str.contains("trading") {
                self.oracle_status_checks += 1;
                self.record_pattern("oracle_status_check");
            } else if left_str.contains("timestamp") || right_str.contains("timestamp") {
                self.timestamp_validation_checks += 1;
                self.record_pattern("timestamp_validation");
            } else {
                self.price_validation_checks += 1;
                self.record_pattern("price_validation");
            }
        }

        // Continue visiting binary expression
        syn::visit::visit_expr_binary(self, node);
    }

    fn visit_expr_if(&mut self, node: &'ast ExprIf) {
        // Check for conditional oracle validation
        if let Expr::Binary(binary_expr) = &*node.cond {
            if self.is_oracle_validation_pattern(
                &binary_expr.op,
                &binary_expr.left,
                &binary_expr.right,
            ) {
                self.price_validation_checks += 1;
                self.record_pattern("conditional_oracle_validation");
            }
        }

        // Continue visiting if expression
        syn::visit::visit_expr_if(self, node);
    }

    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let func_name = node.sig.ident.to_string();
        let context = self.classify_function_context(&func_name);

        // Skip known false positive functions
        if self.is_known_false_positive_function(&func_name) {
            syn::visit::visit_item_fn(self, node);
            return;
        }

        // Check for price feed functions
        if self.is_price_feed_function(&func_name) {
            self.price_fetching_functions += 1;
            self.record_pattern(&format!("price_feed_function_{}", func_name));

            match context {
                "handler" => self.handler_oracle_usage += 1,
                "state" => self.state_oracle_usage += 1,
                "utility" => self.utility_oracle_usage += 1,
                "test" => self.test_oracle_usage += 1,
                _ => {}
            }
        }

        // Check for oracle validation functions
        if self.is_oracle_validation_function(&func_name) {
            self.oracle_query_functions += 1;
            self.record_pattern(&format!("oracle_validation_function_{}", func_name));
        }

        // Check for aggregation functions
        if func_name.contains("aggregate")
            || func_name.contains("combine")
            || func_name.contains("merge")
        {
            self.price_aggregation_functions += 1;
            self.record_pattern(&format!("aggregation_function_{}", func_name));
        }

        // Continue visiting function body
        syn::visit::visit_item_fn(self, node);
    }

    fn visit_item_struct(&mut self, node: &'ast ItemStruct) {
        let struct_name = node.ident.to_string();

        // Check for oracle account types
        if self.is_oracle_account_type(&struct_name) {
            self.oracle_account_types += 1;
            self.oracle_data_structures += 1;
            self.record_pattern(&format!("oracle_struct_{}", struct_name));
        }

        // Check for price feed types
        if struct_name.contains("Price") || struct_name.contains("Feed") {
            self.price_feed_types += 1;
            self.oracle_data_structures += 1;
            self.record_pattern(&format!("price_feed_struct_{}", struct_name));
        }

        // Check for oracle configuration types
        if struct_name.contains("OracleConfig") || struct_name.contains("PriceConfig") {
            self.oracle_configuration_types += 1;
            self.oracle_data_structures += 1;
            self.record_pattern(&format!("oracle_config_struct_{}", struct_name));
        }

        // Continue visiting struct
        syn::visit::visit_item_struct(self, node);
    }

    fn visit_item_enum(&mut self, node: &'ast ItemEnum) {
        let enum_name = node.ident.to_string();

        // Check for oracle-related enums
        if enum_name.contains("Oracle") || enum_name.contains("Price") || enum_name.contains("Feed")
        {
            self.oracle_data_structures += 1;
            self.record_pattern(&format!("oracle_enum_{}", enum_name));
        }

        // Continue visiting enum
        syn::visit::visit_item_enum(self, node);
    }
}

/// Calculate oracle and price feed usage metrics for workspace
pub fn calculate_workspace_oracle_price_feed(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<OraclePriceFeedMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 ORACLE DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = OraclePriceFeedMetrics::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            log::warn!("🔍 ORACLE DEBUG: File does not exist: {:?}", full_path);
            files_skipped += 1;
            continue;
        }

        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            log::info!("🔍 ORACLE DEBUG: Skipping non-Rust file: {:?}", full_path);
            files_skipped += 1;
            continue;
        }

        log::info!("🔍 ORACLE DEBUG: Analyzing file: {:?}", full_path);

        let content = std::fs::read_to_string(&full_path)?;
        let syntax_tree = syn::parse_file(&content)?;

        let mut visitor = OraclePriceFeedVisitor::new();
        visitor.current_file_path = file_path.to_string();
        visitor.visit_file(&syntax_tree);

        // Accumulate metrics from this visitor
        metrics.oracle_programs_detected += visitor.oracle_programs_detected;
        metrics.pyth_integrations += visitor.pyth_integrations;
        metrics.switchboard_integrations += visitor.switchboard_integrations;
        metrics.chainlink_integrations += visitor.chainlink_integrations;
        metrics.custom_oracle_integrations += visitor.custom_oracle_integrations;
        metrics.external_price_sources += visitor.external_price_sources;

        metrics.price_feed_calls += visitor.price_feed_calls;
        metrics.time_weighted_average_calls += visitor.time_weighted_average_calls;
        metrics.price_fetching_functions += visitor.price_fetching_functions;
        metrics.oracle_query_functions += visitor.oracle_query_functions;
        metrics.price_aggregation_functions += visitor.price_aggregation_functions;

        metrics.staleness_checks += visitor.staleness_checks;
        metrics.confidence_interval_checks += visitor.confidence_interval_checks;
        metrics.price_validation_checks += visitor.price_validation_checks;
        metrics.price_range_checks += visitor.price_range_checks;
        metrics.oracle_status_checks += visitor.oracle_status_checks;
        metrics.timestamp_validation_checks += visitor.timestamp_validation_checks;

        metrics.oracle_account_types += visitor.oracle_account_types;
        metrics.price_feed_types += visitor.price_feed_types;
        metrics.oracle_configuration_types += visitor.oracle_configuration_types;
        metrics.oracle_data_structures += visitor.oracle_data_structures;

        metrics.handler_oracle_usage += visitor.handler_oracle_usage;
        metrics.state_oracle_usage += visitor.state_oracle_usage;
        metrics.utility_oracle_usage += visitor.utility_oracle_usage;
        metrics.test_oracle_usage += visitor.test_oracle_usage;

        // Merge pattern breakdown
        for (pattern, count) in visitor.oracle_pattern_counts {
            *metrics.oracle_pattern_breakdown.entry(pattern).or_insert(0) += count;
        }

        files_analyzed += 1;
    }

    // Calculate complexity scores
    metrics.oracle_complexity_score = calculate_oracle_complexity_score(&metrics);
    metrics.price_feed_complexity_score = calculate_price_feed_complexity_score(&metrics);
    metrics.validation_mechanism_score = calculate_validation_mechanism_score(&metrics);
    metrics.total_oracle_score = metrics.oracle_complexity_score
        + metrics.price_feed_complexity_score
        + metrics.validation_mechanism_score;

    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    log::info!(
        "🔍 ORACLE DEBUG: Analysis complete. Files analyzed: {}, Files skipped: {}",
        files_analyzed,
        files_skipped
    );

    Ok(metrics)
}

/// Calculate oracle complexity score
fn calculate_oracle_complexity_score(metrics: &OraclePriceFeedMetrics) -> f64 {
    let mut score = 0.0;

    // Oracle program integrations (weighted by type)
    score += metrics.pyth_integrations as f64 * 1.0;
    score += metrics.switchboard_integrations as f64 * 1.0;
    score += metrics.chainlink_integrations as f64 * 1.0;
    score += metrics.custom_oracle_integrations as f64 * 1.5; // Higher risk for custom oracles

    // External price sources
    score += metrics.external_price_sources as f64 * 2.0;

    // Oracle account and configuration types
    score += metrics.oracle_account_types as f64 * 1.5;
    score += metrics.price_feed_types as f64 * 1.0;
    score += metrics.oracle_configuration_types as f64 * 2.0;
    score += metrics.oracle_data_structures as f64 * 1.0;

    score
}

/// Calculate price feed complexity score
fn calculate_price_feed_complexity_score(metrics: &OraclePriceFeedMetrics) -> f64 {
    let mut score = 0.0;

    // Price feed usage patterns
    score += metrics.price_feed_calls as f64 * 2.0;
    score += metrics.time_weighted_average_calls as f64 * 3.0; // Higher complexity for TWAP
    score += metrics.price_fetching_functions as f64 * 2.5;
    score += metrics.oracle_query_functions as f64 * 2.0;
    score += metrics.price_aggregation_functions as f64 * 3.5; // Highest complexity for aggregation

    score
}

/// Calculate validation mechanism score
fn calculate_validation_mechanism_score(metrics: &OraclePriceFeedMetrics) -> f64 {
    let mut score = 0.0;

    // Oracle validation patterns
    score += metrics.staleness_checks as f64 * 4.0; // Critical for security
    score += metrics.confidence_interval_checks as f64 * 3.5;
    score += metrics.price_validation_checks as f64 * 3.0;
    score += metrics.price_range_checks as f64 * 2.5;
    score += metrics.oracle_status_checks as f64 * 3.0;
    score += metrics.timestamp_validation_checks as f64 * 3.5;

    // Context classification (weighted by importance)
    score += metrics.handler_oracle_usage as f64 * 3.0; // Most critical in handlers
    score += metrics.state_oracle_usage as f64 * 2.0;
    score += metrics.utility_oracle_usage as f64 * 1.5;
    score += metrics.test_oracle_usage as f64 * 0.5; // Lower weight for tests

    score
}
