//! Score Calculator Module
//!
//! Calculates complexity scores and audit effort estimates from analysis factors

use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StaticAnalysisScores {
    pub structural: StructuralScores,
    pub security: SecurityScores,
    pub systemic: SystemicScores,
    pub economic: EconomicScores,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StructuralScores {
    #[serde(rename = "total_statement_count")]
    pub total_statement_count: f64,
    #[serde(rename = "number_of_functions/instructions_handlers")]
    pub number_of_functions_instructions_handlers: f64,
    #[serde(rename = "cyclomatic_complexity_&_control_flow")]
    pub cyclomatic_complexity_control_flow: f64,
    #[serde(rename = "modularity_and_files_per_modules_count")]
    pub modularity_and_files_per_modules_count: f64,
    #[serde(rename = "external_dependencies")]
    pub external_dependencies: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityScores {
    #[serde(rename = "access_controlled_handlers")]
    pub access_controlled_handlers: f64,
    #[serde(rename = "PDA_seeds_surface_&_ownership")]
    pub pda_seeds_surface_ownership: f64,
    #[serde(rename = "cross_program_invocation_(CPI)")]
    pub cross_program_invocation_cpi: f64,
    #[serde(rename = "input/constraints_surface")]
    pub input_constraints_surface: f64,
    #[serde(rename = "arithmetic_operations")]
    pub arithmetic_operations: f64,
    #[serde(rename = "priviliged_roles_& _admin_actions")]
    pub priviliged_roles_admin_actions: f64,
    #[serde(rename = "unsafe/low_level_usage")]
    pub unsafe_low_level_usage: f64,
    #[serde(rename = "error_handling_footprint")]
    pub error_handling_footprint: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemicScores {
    #[serde(rename = "upgradability_and_governance_control")]
    pub upgradability_and_governance_control: f64,
    #[serde(rename = "external_integration_&_oracles")]
    pub external_integration_oracles: f64,
    #[serde(rename = "composability_and_inter_program_complexity")]
    pub composability_and_inter_program_complexity: f64,
    #[serde(rename = "denial_of_service_&_resource_limits")]
    pub denial_of_service_resource_limits: f64,
    #[serde(rename = "operational_security_factors")]
    pub operational_security_factors: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EconomicScores {
    #[serde(rename = "number_of_asset_&_asset_types")]
    pub number_of_asset_asset_types: f64,
    #[serde(rename = "invariants_&_risk_parameters")]
    pub invariants_risk_parameters: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalculatedScores {
    pub structural: f64,
    pub security: f64,
    pub systemic: f64,
    pub economic: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEffortReport {
    #[serde(rename = "filesCount")]
    pub files_count: usize,
    #[serde(rename = "lowerAuditEffort")]
    pub lower_audit_effort: AuditEffort,
    #[serde(rename = "upperAuditEffort")]
    pub upper_audit_effort: AuditEffort,
    pub hotspots: Hotspots,
    #[serde(rename = "receiptId")]
    pub receipt_id: String,
    #[serde(rename = "commitUrl")]
    pub commit_url: String,
    #[serde(rename = "hrefUrl")]
    pub href_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEffort {
    #[serde(rename = "timeRange")]
    pub time_range: TimeRange,
    pub resources: u32,
    #[serde(rename = "costRange")]
    pub cost_range: CostRange,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRange {
    #[serde(rename = "minimumDays")]
    pub minimum_days: u32,
    #[serde(rename = "maximumDays")]
    pub maximum_days: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostRange {
    #[serde(rename = "minimumCost")]
    pub minimum_cost: u32,
    #[serde(rename = "maximumCost")]
    pub maximum_cost: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hotspots {
    #[serde(rename = "totalCount")]
    pub total_count: usize,
    #[serde(rename = "highRiskCount")]
    pub high_risk_count: usize,
    #[serde(rename = "mediumRiskCount")]
    pub medium_risk_count: usize,
    #[serde(rename = "lowPriorityCount")]
    pub low_priority_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeMetrics {
    #[serde(rename = "highRiskHotspots")]
    pub high_risk_hotspots: Option<Vec<Value>>,
    #[serde(rename = "mediumRiskHotspots")]
    pub medium_risk_hotspots: Option<Vec<Value>>,
    pub findings: Option<Vec<String>>,
}

pub struct ScoreCalculator;

impl ScoreCalculator {
    /// Calculate total scores from static analysis scores
    pub fn calculate_total_score(
        static_analysis_scores: &StaticAnalysisScores,
        ai_analysis_factors: &CodeMetrics,
        repo_data: &RepoData,
    ) -> (CalculatedScores, AuditEffortReport) {
        // Calculate individual category scores
        let structural_score = static_analysis_scores.structural.total_statement_count * 0.25
            + static_analysis_scores.structural.number_of_functions_instructions_handlers * 0.25
            + static_analysis_scores.structural.cyclomatic_complexity_control_flow * 0.2
            + static_analysis_scores.structural.modularity_and_files_per_modules_count * 0.15
            + static_analysis_scores.structural.external_dependencies * 0.15;

        let security_score = static_analysis_scores.security.access_controlled_handlers * 0.2
            + static_analysis_scores.security.pda_seeds_surface_ownership * 0.15
            + static_analysis_scores.security.cross_program_invocation_cpi * 0.15
            + static_analysis_scores.security.input_constraints_surface * 0.15
            + static_analysis_scores.security.arithmetic_operations * 0.1
            + static_analysis_scores.security.priviliged_roles_admin_actions * 0.1
            + static_analysis_scores.security.unsafe_low_level_usage * 0.1
            + static_analysis_scores.security.error_handling_footprint * 0.05;

        let systemic_score = static_analysis_scores.systemic.upgradability_and_governance_control * 0.2
            + static_analysis_scores.systemic.external_integration_oracles * 0.3
            + static_analysis_scores.systemic.composability_and_inter_program_complexity * 0.2
            + static_analysis_scores.systemic.denial_of_service_resource_limits * 0.15
            + static_analysis_scores.systemic.operational_security_factors * 0.15;

        let economic_score = static_analysis_scores.economic.number_of_asset_asset_types * 0.5
            + static_analysis_scores.economic.invariants_risk_parameters * 0.5;

        let total_score = structural_score * 0.2
            + security_score * 0.3
            + systemic_score * 0.3
            + economic_score * 0.2;

        let scores = CalculatedScores {
            structural: structural_score,
            security: security_score,
            systemic: systemic_score,
            economic: economic_score,
            total: total_score,
        };

        // Calculate audit effort and build report
        let audit_effort = Self::estimated_audit_effort(total_score);
        let hotspots = Self::calculate_hotspots(ai_analysis_factors);

        let report = AuditEffortReport {
            files_count: repo_data.files_count,
            lower_audit_effort: audit_effort.0,
            upper_audit_effort: audit_effort.1,
            hotspots,
            receipt_id: repo_data.receipt_id.clone(),
            commit_url: repo_data.commit_url.clone(),
            href_url: repo_data.href_url.clone(),
        };

        (scores, report)
    }

    /// Calculate hotspots from AI analysis factors
    fn calculate_hotspots(ai_analysis_factors: &CodeMetrics) -> Hotspots {
        let high_risk_count = ai_analysis_factors
            .high_risk_hotspots
            .as_ref()
            .map(|v| v.len())
            .unwrap_or(0);
        let medium_risk_count = ai_analysis_factors
            .medium_risk_hotspots
            .as_ref()
            .map(|v| v.len())
            .unwrap_or(0);
        let low_priority_count = ai_analysis_factors
            .findings
            .as_ref()
            .map(|v| v.len())
            .unwrap_or(0);

        Hotspots {
            total_count: high_risk_count + medium_risk_count + low_priority_count,
            high_risk_count,
            medium_risk_count,
            low_priority_count,
        }
    }

    /// Estimate audit effort based on total score
    fn estimated_audit_effort(total_score: f64) -> (AuditEffort, AuditEffort) {
        // Constants (matching TypeScript implementation)
        const DAYS_PER_WEEK: f64 = 5.0;
        const PHI: f64 = 0.8;
        const AUDITORS_3: f64 = 3.0;
        const SLOPE_ABOVE_MAX: f64 = 1.468429;
        const SLOPE_BELOW_MIN: f64 = 0.627746;
        const MIN_MEDIAN_DAYS: f64 = 1.0;
        const COST_BUDGET_LOW: f64 = 2500.0;
        const COST_BUDGET_HIGH: f64 = 6000.0;

        let data = vec![
            AuditDataPoint {
                median_audit_timeline: 8,
                skewed_audit_timeline: 12.2,
                median_complexity: 16.98,
            },
            AuditDataPoint {
                median_audit_timeline: 15,
                skewed_audit_timeline: 24.6,
                median_complexity: 23.895,
            },
            AuditDataPoint {
                median_audit_timeline: 17,
                skewed_audit_timeline: 28.0,
                median_complexity: 35.01,
            },
            AuditDataPoint {
                median_audit_timeline: 20,
                skewed_audit_timeline: 28.0,
                median_complexity: 43.81,
            },
            AuditDataPoint {
                median_audit_timeline: 30,
                skewed_audit_timeline: 36.0,
                median_complexity: 50.62,
            },
        ];

        // Find lower and upper bounds
        let mut sorted_data = data;
        sorted_data.sort_by(|a, b| {
            a.median_complexity
                .partial_cmp(&b.median_complexity)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        let max_complexity = sorted_data[sorted_data.len() - 1].median_complexity;
        let min_complexity = sorted_data[0].median_complexity;

        let (lower, upper) = if total_score >= max_complexity {
            (
                Some(&sorted_data[sorted_data.len() - 1]),
                None::<&AuditDataPoint>,
            )
        } else if total_score <= min_complexity {
            (None::<&AuditDataPoint>, Some(&sorted_data[0]))
        } else {
            // Find bounds
            let mut lower_bound: Option<&AuditDataPoint> = None;
            let mut upper_bound: Option<&AuditDataPoint> = None;
            for i in 0..sorted_data.len() - 1 {
                if sorted_data[i].median_complexity < total_score
                    && sorted_data[i + 1].median_complexity > total_score
                {
                    lower_bound = Some(&sorted_data[i]);
                    upper_bound = Some(&sorted_data[i + 1]);
                    break;
                }
            }
            (lower_bound, upper_bound)
        };

        // Calculate timeline for 2 auditors
        let (median_days, skewed_days) = match (lower, upper) {
            (Some(l), Some(u)) => {
                let slope = (total_score - l.median_complexity)
                    / (u.median_complexity - l.median_complexity);
                let median = (l.median_audit_timeline as f64
                    + slope * (u.median_audit_timeline - l.median_audit_timeline) as f64)
                    .round() as u32;
                let skewed = (l.skewed_audit_timeline
                    + slope * (u.skewed_audit_timeline - l.skewed_audit_timeline))
                    .round() as u32;
                (median, skewed)
            }
            (Some(l), None) => {
                let median = (l.median_audit_timeline as f64
                    + SLOPE_ABOVE_MAX * (total_score - l.median_complexity))
                    .round() as u32;
                let skewed = median
                    + ((l.skewed_audit_timeline - l.median_audit_timeline as f64).round() as u32);
                (median, skewed)
            }
            (None, Some(u)) => {
                let median = (MIN_MEDIAN_DAYS
                    .max(u.median_audit_timeline as f64
                        - SLOPE_BELOW_MIN * (u.median_complexity - total_score)))
                    .round() as u32;
                let skewed = median
                    + ((u.skewed_audit_timeline - u.median_audit_timeline as f64).round() as u32);
                (median, skewed)
            }
            (None, None) => (8, 12), // Default fallback
        };

        // Timeline calculation for 3 auditors
        let auditor_multiplier = 1.0 - PHI + PHI * (2.0 / AUDITORS_3);
        let median_days_3 = (median_days as f64 * auditor_multiplier).round() as u32;
        let skewed_days_3 = (skewed_days as f64 * auditor_multiplier).round() as u32;

        // Calculate costs
        let calculate_cost = |days: u32, is_low_budget: bool| -> u32 {
            ((days as f64 / DAYS_PER_WEEK)
                * if is_low_budget { COST_BUDGET_LOW } else { COST_BUDGET_HIGH })
                .round() as u32
        };

        let cost_2_low = calculate_cost(median_days, true);
        let cost_2_high = calculate_cost(skewed_days, false);
        let cost_3_low = calculate_cost(median_days_3, true);
        let cost_3_high = calculate_cost(skewed_days_3, false);

        let lower_effort = AuditEffort {
            time_range: TimeRange {
                minimum_days: median_days,
                maximum_days: skewed_days,
            },
            resources: 2,
            cost_range: CostRange {
                minimum_cost: cost_2_low * 2,
                maximum_cost: cost_2_high * 2,
            },
        };

        let upper_effort = AuditEffort {
            time_range: TimeRange {
                minimum_days: median_days_3,
                maximum_days: skewed_days_3,
            },
            resources: 3,
            cost_range: CostRange {
                minimum_cost: cost_3_low * 3,
                maximum_cost: cost_3_high * 3,
            },
        };

        (lower_effort, upper_effort)
    }
}

#[derive(Debug, Clone)]
struct AuditDataPoint {
    median_audit_timeline: u32,
    skewed_audit_timeline: f64,
    median_complexity: f64,
}

#[derive(Debug, Clone)]
pub struct RepoData {
    pub files_count: usize,
    pub receipt_id: String,
    pub commit_url: String,
    pub href_url: String,
}

/// Helper function to extract static analysis scores from Rust factors JSON
pub fn extract_static_analysis_scores(factors: &serde_json::Value) -> StaticAnalysisScores {
    StaticAnalysisScores {
        structural: StructuralScores {
            total_statement_count: factors
                .get("tscMetrics")
                .and_then(|v| v.get("locFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            number_of_functions_instructions_handlers: factors
                .get("functionCountMetrics")
                .and_then(|v| v.get("functionFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            cyclomatic_complexity_control_flow: factors
                .get("complexity")
                .and_then(|v| v.get("complexityFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            modularity_and_files_per_modules_count: factors
                .get("modularity")
                .and_then(|v| v.get("anchorModularityScore"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            external_dependencies: factors
                .get("dependencies")
                .and_then(|v| v.get("dependencyFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
        },
        security: SecurityScores {
            access_controlled_handlers: factors
                .get("accessControl")
                .and_then(|v| v.get("accessControlFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            pda_seeds_surface_ownership: factors
                .get("pdaSeeds")
                .and_then(|v| v.get("pdaComplexityFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            cross_program_invocation_cpi: factors
                .get("cpiCalls")
                .and_then(|v| v.get("cpiFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            input_constraints_surface: factors
                .get("inputConstraints")
                .and_then(|v| v.get("inputConstraintFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            arithmetic_operations: factors
                .get("arithmeticOperations")
                .and_then(|v| v.get("arithmeticFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            priviliged_roles_admin_actions: factors
                .get("privilegedRoles")
                .and_then(|v| v.get("acFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            unsafe_low_level_usage: factors
                .get("unsafeLowLevel")
                .and_then(|v| v.get("unsafeFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            error_handling_footprint: factors
                .get("errorHandling")
                .and_then(|v| v.get("errorHandlingFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
        },
        systemic: SystemicScores {
            upgradability_and_governance_control: factors
                .get("upgradeability")
                .and_then(|v| v.get("governanceFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            external_integration_oracles: factors
                .get("dependencies")
                .and_then(|v| v.get("externalIntegrationFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            composability_and_inter_program_complexity: factors
                .get("composability")
                .and_then(|v| v.get("composabilityFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            denial_of_service_resource_limits: factors
                .get("dosResourceLimits")
                .and_then(|v| v.get("resourceFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            operational_security_factors: factors
                .get("operationalSecurity")
                .and_then(|v| v.get("opsecFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
        },
        economic: EconomicScores {
            number_of_asset_asset_types: factors
                .get("assetTypes")
                .and_then(|v| v.get("assetTypesFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            invariants_risk_parameters: factors
                .get("invariantsAndRiskParams")
                .and_then(|v| v.get("constraintDensityFactor"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
        },
    }
}

