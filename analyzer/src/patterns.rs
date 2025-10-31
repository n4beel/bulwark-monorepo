//! Semantic pattern recognition for AMM and DeFi contracts

use std::collections::HashMap;

/// Semantic pattern detector for AMM-specific code patterns
pub struct PatternDetector {
    /// Known patterns and their descriptions
    patterns: HashMap<String, PatternInfo>,
}

/// Information about a semantic pattern
#[derive(Debug, Clone)]
pub struct PatternInfo {
    /// Human-readable name
    pub name: String,

    /// Description of what this pattern indicates
    pub description: String,

    /// Risk level: "low", "medium", "high", "critical"
    pub risk_level: String,

    /// Keywords that indicate this pattern
    pub keywords: Vec<String>,

    /// Function name patterns that indicate this pattern
    pub function_patterns: Vec<String>,
}

impl PatternDetector {
    /// Create a new pattern detector with default AMM patterns
    pub fn new() -> Self {
        let mut patterns = HashMap::new();

        // Constant Product AMM Pattern
        patterns.insert(
            "constant_product_amm".to_string(),
            PatternInfo {
                name: "Constant Product AMM".to_string(),
                description:
                    "Implements constant product formula (x * y = k) for automated market making"
                        .to_string(),
                risk_level: "medium".to_string(),
                keywords: vec![
                    "constant_product".to_string(),
                    "invariant".to_string(),
                    "k_value".to_string(),
                ],
                function_patterns: vec![
                    "swap_*".to_string(),
                    "*_invariant".to_string(),
                    "calc_*_out".to_string(),
                ],
            },
        );

        // Token Swap Pattern
        patterns.insert(
            "token_swap".to_string(),
            PatternInfo {
                name: "Token Swap".to_string(),
                description: "Handles swapping between different tokens".to_string(),
                risk_level: "medium".to_string(),
                keywords: vec![
                    "swap".to_string(),
                    "exchange".to_string(),
                    "trade".to_string(),
                ],
                function_patterns: vec![
                    "swap_*".to_string(),
                    "exchange_*".to_string(),
                    "*_swap_*".to_string(),
                ],
            },
        );

        // Liquidity Management Pattern
        patterns.insert(
            "liquidity_management".to_string(),
            PatternInfo {
                name: "Liquidity Management".to_string(),
                description: "Manages liquidity pool operations (add/remove liquidity)".to_string(),
                risk_level: "medium".to_string(),
                keywords: vec![
                    "liquidity".to_string(),
                    "pool".to_string(),
                    "lp_token".to_string(),
                ],
                function_patterns: vec![
                    "add_liquidity".to_string(),
                    "remove_liquidity".to_string(),
                    "*_liquidity_*".to_string(),
                ],
            },
        );

        // Price Calculation Pattern
        patterns.insert(
            "price_calculation".to_string(),
            PatternInfo {
                name: "Price Calculation".to_string(),
                description: "Calculates token prices and exchange rates".to_string(),
                risk_level: "high".to_string(),
                keywords: vec![
                    "price".to_string(),
                    "rate".to_string(),
                    "oracle".to_string(),
                ],
                function_patterns: vec![
                    "get_price".to_string(),
                    "calc_*_price".to_string(),
                    "*_rate".to_string(),
                ],
            },
        );

        // Fee Calculation Pattern
        patterns.insert(
            "fee_calculation".to_string(),
            PatternInfo {
                name: "Fee Calculation".to_string(),
                description: "Calculates trading fees and protocol fees".to_string(),
                risk_level: "medium".to_string(),
                keywords: vec![
                    "fee".to_string(),
                    "commission".to_string(),
                    "protocol_fee".to_string(),
                ],
                function_patterns: vec![
                    "calc_*_fee".to_string(),
                    "*_fee_*".to_string(),
                    "apply_fee".to_string(),
                ],
            },
        );

        // Slippage Protection Pattern
        patterns.insert(
            "slippage_protection".to_string(),
            PatternInfo {
                name: "Slippage Protection".to_string(),
                description: "Implements slippage protection mechanisms".to_string(),
                risk_level: "high".to_string(),
                keywords: vec![
                    "slippage".to_string(),
                    "min_amount_out".to_string(),
                    "max_amount_in".to_string(),
                ],
                function_patterns: vec!["check_slippage".to_string(), "*_slippage_*".to_string()],
            },
        );

        // PnL Calculation Pattern
        patterns.insert(
            "pnl_calculation".to_string(),
            PatternInfo {
                name: "PnL Calculation".to_string(),
                description: "Calculates profit and loss for positions".to_string(),
                risk_level: "high".to_string(),
                keywords: vec![
                    "pnl".to_string(),
                    "profit".to_string(),
                    "loss".to_string(),
                    "realized".to_string(),
                ],
                function_patterns: vec![
                    "calc_pnl".to_string(),
                    "*_profit_*".to_string(),
                    "*_pnl_*".to_string(),
                ],
            },
        );

        // Invariant Maintenance Pattern
        patterns.insert(
            "invariant_maintenance".to_string(),
            PatternInfo {
                name: "Invariant Maintenance".to_string(),
                description: "Maintains mathematical invariants in the protocol".to_string(),
                risk_level: "critical".to_string(),
                keywords: vec![
                    "invariant".to_string(),
                    "maintain".to_string(),
                    "validate".to_string(),
                ],
                function_patterns: vec![
                    "*_invariant".to_string(),
                    "validate_*".to_string(),
                    "check_*".to_string(),
                ],
            },
        );

        // Overflow Protection Pattern
        patterns.insert(
            "overflow_protection".to_string(),
            PatternInfo {
                name: "Overflow Protection".to_string(),
                description: "Uses checked arithmetic to prevent overflow attacks".to_string(),
                risk_level: "low".to_string(),
                keywords: vec![
                    "checked_".to_string(),
                    "saturating_".to_string(),
                    "safe_".to_string(),
                ],
                function_patterns: vec!["safe_*".to_string()],
            },
        );

        // Precision Handling Pattern
        patterns.insert(
            "precision_handling".to_string(),
            PatternInfo {
                name: "Precision Handling".to_string(),
                description: "Handles decimal precision and rounding in calculations".to_string(),
                risk_level: "medium".to_string(),
                keywords: vec![
                    "precision".to_string(),
                    "decimal".to_string(),
                    "scale".to_string(),
                    "normalize".to_string(),
                ],
                function_patterns: vec![
                    "normalize_*".to_string(),
                    "*_precision".to_string(),
                    "scale_*".to_string(),
                ],
            },
        );

        Self { patterns }
    }

    /// Detect patterns in a function name
    pub fn detect_in_function_name(&self, function_name: &str) -> Vec<String> {
        let mut detected = Vec::new();
        let name_lower = function_name.to_lowercase();

        for (pattern_id, pattern_info) in &self.patterns {
            // Check function name patterns
            for pattern in &pattern_info.function_patterns {
                if self.matches_pattern(&name_lower, pattern) {
                    detected.push(pattern_id.clone());
                    break;
                }
            }

            // Check keywords in function name
            for keyword in &pattern_info.keywords {
                if name_lower.contains(&keyword.to_lowercase()) {
                    detected.push(pattern_id.clone());
                    break;
                }
            }
        }

        detected
    }

    /// Detect patterns in source code content
    pub fn detect_in_content(&self, content: &str) -> Vec<String> {
        let mut detected = Vec::new();
        let content_lower = content.to_lowercase();

        for (pattern_id, pattern_info) in &self.patterns {
            for keyword in &pattern_info.keywords {
                if content_lower.contains(&keyword.to_lowercase()) {
                    detected.push(pattern_id.clone());
                    break;
                }
            }
        }

        detected
    }

    /// Get information about a pattern
    pub fn get_pattern_info(&self, pattern_id: &str) -> Option<&PatternInfo> {
        self.patterns.get(pattern_id)
    }

    /// Get all known patterns
    pub fn get_all_patterns(&self) -> &HashMap<String, PatternInfo> {
        &self.patterns
    }

    /// Check if a string matches a glob-like pattern
    fn matches_pattern(&self, text: &str, pattern: &str) -> bool {
        if pattern.contains('*') {
            // Simple glob matching
            let parts: Vec<&str> = pattern.split('*').collect();
            if parts.len() == 2 {
                let prefix = parts[0];
                let suffix = parts[1];
                text.starts_with(prefix) && text.ends_with(suffix)
            } else {
                // More complex patterns - simplified implementation
                let pattern_regex = pattern.replace('*', ".*");
                regex::Regex::new(&pattern_regex)
                    .map(|re| re.is_match(text))
                    .unwrap_or(false)
            }
        } else {
            text == pattern
        }
    }
}

impl Default for PatternDetector {
    fn default() -> Self {
        Self::new()
    }
}

/// Risk assessment based on detected patterns
pub struct RiskAssessment;

impl RiskAssessment {
    /// Assess risk level based on detected patterns
    pub fn assess_patterns(
        patterns: &[String],
        detector: &PatternDetector,
    ) -> (String, Vec<String>) {
        let mut risk_score = 0;
        let mut risk_factors = Vec::new();

        for pattern_id in patterns {
            if let Some(pattern_info) = detector.get_pattern_info(pattern_id) {
                match pattern_info.risk_level.as_str() {
                    "low" => risk_score += 1,
                    "medium" => risk_score += 3,
                    "high" => risk_score += 5,
                    "critical" => risk_score += 10,
                    _ => {}
                }

                risk_factors.push(format!(
                    "{}: {}",
                    pattern_info.name, pattern_info.description
                ));
            }
        }

        let risk_level = match risk_score {
            0..=2 => "low",
            3..=8 => "medium",
            9..=15 => "high",
            _ => "critical",
        }
        .to_string();

        (risk_level, risk_factors)
    }
}
