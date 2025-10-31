//! HTTP Server for AMM Analyzer
//!
//! Provides REST API endpoints for semantic analysis of Rust smart contracts

use amm_analyzer::factors::{
    calculate_workspace_access_control,
    calculate_workspace_arithmetic,
    calculate_workspace_asset_types,
    calculate_workspace_composability,
    calculate_workspace_constraint_density,
    calculate_workspace_cpi_calls,
    calculate_workspace_cyclomatic_complexity,
    calculate_workspace_dependencies,
    calculate_workspace_dos_resource_limits,
    calculate_workspace_error_handling,
    calculate_workspace_external_integration,
    calculate_workspace_input_constraints,
    calculate_workspace_modularity,
    calculate_workspace_operational_security,
    // calculate_workspace_oracle_price_feed, // TODO: Implement oracle_price_feed module
    calculate_workspace_pda_seeds,
    calculate_workspace_privileged_roles, // calculate_workspace_statefulness, // TODO: Implement statefulness module
    calculate_workspace_unsafe_lowlevel,
    calculate_workspace_upgradeability,
    count_total_functions,
    lines_of_code::{analyze_file_tsc, calculate_workspace_tsc},
};
use amm_analyzer::{analyze_repository, AnalyzerConfig};
use axum::{
    extract::Json,
    http::StatusCode,
    response::Json as ResponseJson,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, net::SocketAddr, path::PathBuf};
use tower_http::cors::CorsLayer;

#[derive(Debug, Deserialize)]
struct AnalysisRequest {
    /// Workspace ID (directory name in shared storage)
    workspace_id: String,

    /// Selected files to analyze (relative paths)
    selected_files: Option<Vec<String>>,

    /// Analysis options
    options: Option<AnalysisOptions>,

    /// Solana RPC URL for on-chain analysis (optional)
    rpc_url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct AnalysisOptions {
    include_tests: Option<bool>,
    include_benches: Option<bool>,
    include_examples: Option<bool>,
    expand_macros: Option<bool>,
    max_file_size: Option<usize>,
}

#[derive(Debug, Serialize)]
struct AnalysisResponse {
    success: bool,
    data: Option<serde_json::Value>,
    error: Option<String>,
    metadata: ResponseMetadata,
}

#[derive(Debug, Serialize)]
struct ResponseMetadata {
    analyzer_version: String,
    analysis_engine: String,
    timestamp: String,
    workspace_id: String,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    uptime: String,
}

#[derive(Debug, Deserialize)]
struct TestRequest {
    test_id: String,
    expected_data: String,
}

#[derive(Debug, Serialize)]
struct TestResponse {
    success: bool,
    test_id: String,
    expected_data: String,
    actual_data: Option<String>,
    match_result: bool,
    message: String,
}

#[derive(Debug, Deserialize)]
struct DirectTestRequest {
    test_id: String,
    test_data: String,
}

#[derive(Debug, Serialize)]
struct DirectTestResponse {
    success: bool,
    test_id: String,
    expected_data: String,
    actual_data: Option<String>,
    match_result: bool,
    message: String,
    mode: String,
}

// Augmentation request/response (initial stub)
#[derive(Debug, Deserialize)]
struct AugmentRequest {
    workspace_id: String,
    selected_files: Option<Vec<String>>,
    api_version: Option<String>,
    /// Solana RPC URL for on-chain analysis (optional)
    rpc_url: Option<String>,
}

#[derive(Debug, Serialize)]
struct AugmentResponseMeta {
    api_version: String,
    timestamp: String,
}

#[derive(Debug, Serialize)]
struct AugmentResponse {
    success: bool,
    workspace_id: String,
    overridden: Vec<String>,
    factors: serde_json::Value,
    raw: serde_json::Value,
    meta: AugmentResponseMeta,
}

/// Health check endpoint
async fn health_check() -> ResponseJson<HealthResponse> {
    ResponseJson(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime: "0s".to_string(), // TODO: implement actual uptime
    })
}

/// Test endpoint to verify shared volume communication
async fn test_shared_volume(
    Json(request): Json<TestRequest>,
) -> Result<ResponseJson<TestResponse>, (StatusCode, ResponseJson<TestResponse>)> {
    log::info!(
        "Testing shared volume communication for test_id: {}",
        request.test_id
    );

    // Construct test file path in shared volume
    // NOTE: Default path aligned with NestJS service (see TestService) for local dev.
    // In Railway/production, set SHARED_WORKSPACE_PATH explicitly (e.g. /workspace/shared/workspaces).
    let workspace_path = std::env::var("SHARED_WORKSPACE_PATH")
        .unwrap_or_else(|_| "/tmp/shared/workspaces".to_string());
    let test_file_path = PathBuf::from(workspace_path)
        .join("test")
        .join(format!("{}.txt", request.test_id));

    // Try to read the test file
    match std::fs::read_to_string(&test_file_path) {
        Ok(actual_data) => {
            let actual_data = actual_data.trim().to_string();
            let match_result = actual_data == request.expected_data;

            log::info!(
                "Test file read successfully: {} bytes, match: {}",
                actual_data.len(),
                match_result
            );

            Ok(ResponseJson(TestResponse {
                success: true,
                test_id: request.test_id,
                expected_data: request.expected_data,
                actual_data: Some(actual_data),
                match_result,
                message: if match_result {
                    "Data matches! Shared volume communication successful.".to_string()
                } else {
                    "Data mismatch! Shared volume communication issue.".to_string()
                },
            }))
        }
        Err(e) => {
            log::error!("Failed to read test file {:?}: {}", test_file_path, e);

            Err((
                StatusCode::NOT_FOUND,
                ResponseJson(TestResponse {
                    success: false,
                    test_id: request.test_id,
                    expected_data: request.expected_data,
                    actual_data: None,
                    match_result: false,
                    message: format!("Failed to read test file: {}", e),
                }),
            ))
        }
    }
}

/// Direct test endpoint (no shared filesystem required)
/// Used for platforms where a shared volume between services is unavailable (e.g. Railway multi-service).
async fn test_direct(Json(request): Json<DirectTestRequest>) -> ResponseJson<DirectTestResponse> {
    log::info!(
        "Direct mode test endpoint invoked for test_id: {} (no shared volume)",
        request.test_id
    );

    // In direct mode we simply echo back the provided data. This mirrors the shape
    // of the shared-volume endpoint so the Nest side can consume a uniform response.
    ResponseJson(DirectTestResponse {
        success: true,
        test_id: request.test_id,
        expected_data: request.test_data.clone(),
        actual_data: Some(request.test_data.clone()),
        match_result: true,
        message: "Direct mode success (no shared volume).".to_string(),
        mode: "direct".to_string(),
    })
}

/// Helper function to calculate function metrics for workspace files
fn calculate_workspace_functions(
    workspace_path: &PathBuf,
    selected_files: &[String],
) -> Result<amm_analyzer::factors::function_count::FunctionCountMetrics, Box<dyn std::error::Error>>
{
    use amm_analyzer::factors::function_count::FunctionCountMetrics;

    let mut aggregated_metrics = FunctionCountMetrics::default();

    for file_path in selected_files {
        let full_file_path = workspace_path.join(file_path);

        // Check if the file exists and is a Rust file
        if full_file_path.exists() && full_file_path.is_file() {
            if let Some(extension) = full_file_path.extension() {
                if extension == "rs" {
                    match fs::read_to_string(&full_file_path) {
                        Ok(content) => {
                            if let Ok(metrics) =
                                amm_analyzer::factors::function_count::count_functions(&content)
                            {
                                aggregated_metrics.total_functions += metrics.total_functions;
                                aggregated_metrics.public_functions += metrics.public_functions;
                                aggregated_metrics.private_functions += metrics.private_functions;
                                aggregated_metrics.associated_functions +=
                                    metrics.associated_functions;
                                aggregated_metrics.free_functions += metrics.free_functions;
                            }
                        }
                        Err(_) => {
                            // Skip files that can't be read
                            continue;
                        }
                    }
                }
            }
        }
    }

    // Calculate function factor for the aggregated metrics
    aggregated_metrics.function_factor =
        FunctionCountMetrics::calculate_function_factor(aggregated_metrics.total_functions);

    Ok(aggregated_metrics)
}

/// Augmentation endpoint: calculates actual factor values from workspace files
async fn augment(Json(request): Json<AugmentRequest>) -> ResponseJson<AugmentResponse> {
    let start_time = std::time::Instant::now();
    log::info!(
        "🚀 AUGMENT START: Processing workspace: {} (api_version={:?}) with {} files",
        request.workspace_id,
        request.api_version,
        request.selected_files.as_ref().map_or(0, |f| f.len())
    );

    // Construct workspace path
    let workspace_path = std::env::var("SHARED_WORKSPACE_PATH")
        .unwrap_or_else(|_| "/tmp/shared/workspaces".to_string());
    let full_path = PathBuf::from(workspace_path).join(&request.workspace_id);

    let mut factors_map = serde_json::Map::new();
    let mut computed_factors = Vec::new();
    let mut notes = Vec::new();

    // Calculate actual lines of code from workspace files using TSC metrics
    let selected_files = request.selected_files.as_deref().unwrap_or(&[]);
    match calculate_workspace_tsc(&full_path, selected_files) {
        Ok(tsc_metrics) => {
            // Add totalLinesOfCode (total statements)
            factors_map.insert(
                "totalLinesOfCode".to_string(),
                serde_json::json!(tsc_metrics.total_statements),
            );
            computed_factors.push("totalLinesOfCode".to_string());

            // Add locFactor (normalized 0-100 score)
            factors_map.insert(
                "locFactor".to_string(),
                serde_json::json!(tsc_metrics.loc_factor),
            );
            computed_factors.push("locFactor".to_string());

            // Add all TSC metrics for reference
            factors_map.insert("tscMetrics".to_string(), tsc_metrics.to_json());

            notes.push(format!(
                "Calculated {} statements (LOC) from workspace files, LOC factor: {:.2}",
                tsc_metrics.total_statements, tsc_metrics.loc_factor
            ));
            log::info!(
                "Calculated {} statements (LOC) for workspace {}, LOC factor: {:.2}",
                tsc_metrics.total_statements,
                request.workspace_id,
                tsc_metrics.loc_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate lines of code for workspace {}: {}",
                request.workspace_id,
                e
            );
            // Fallback to reasonable defaults
            factors_map.insert("totalLinesOfCode".to_string(), serde_json::json!(100));
            factors_map.insert("locFactor".to_string(), serde_json::json!(0.0));
            computed_factors.push("totalLinesOfCode".to_string());
            computed_factors.push("locFactor".to_string());
            notes.push(format!("Fallback values used due to error: {}", e));
        }
    }

    // Calculate actual function count from workspace files
    match calculate_workspace_functions(&full_path, selected_files) {
        Ok(function_metrics) => {
            // Add numFunctions (total function count)
            factors_map.insert(
                "numFunctions".to_string(),
                serde_json::json!(function_metrics.total_functions),
            );
            computed_factors.push("numFunctions".to_string());

            // Add functionFactor (normalized 0-100 score)
            factors_map.insert(
                "functionFactor".to_string(),
                serde_json::json!(function_metrics.function_factor),
            );
            computed_factors.push("functionFactor".to_string());

            // Add all function count metrics for reference
            factors_map.insert(
                "functionCountMetrics".to_string(),
                function_metrics.to_json(),
            );

            notes.push(format!(
                "Calculated {} functions from workspace files, function factor: {:.2}",
                function_metrics.total_functions, function_metrics.function_factor
            ));
            log::info!(
                "Calculated {} functions for workspace {}, function factor: {:.2}",
                function_metrics.total_functions,
                request.workspace_id,
                function_metrics.function_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate functions for workspace {}: {}",
                request.workspace_id,
                e
            );
            // Fallback to reasonable defaults
            factors_map.insert("numFunctions".to_string(), serde_json::json!(10));
            factors_map.insert("functionFactor".to_string(), serde_json::json!(0.0));
            computed_factors.push("numFunctions".to_string());
            computed_factors.push("functionFactor".to_string());
            notes.push(format!("Function count fallback used due to error: {}", e));
        }
    }

    // Calculate cyclomatic complexity from workspace files
    match calculate_workspace_cyclomatic_complexity(&full_path, selected_files) {
        Ok(complexity_metrics) => {
            // Add full complexity metrics object
            factors_map.insert("complexity".to_string(), complexity_metrics.to_json());
            computed_factors.push("complexity".to_string());

            // Add complexityFactor as a top-level property for easy access
            factors_map.insert(
                "complexityFactor".to_string(),
                serde_json::json!(complexity_metrics.complexity_factor),
            );
            computed_factors.push("complexityFactor".to_string());

            notes.push(format!(
                "Calculated cyclomatic complexity: avg={:.2}, max={}, functions={}, complexity factor={:.2}",
                complexity_metrics.avg_complexity,
                complexity_metrics.max_complexity,
                complexity_metrics.total_functions,
                complexity_metrics.complexity_factor
            ));
            log::info!(
                "Calculated cyclomatic complexity for workspace {}: avg={:.2}, max={}, functions={}, complexity factor={:.2}",
                request.workspace_id,
                complexity_metrics.avg_complexity,
                complexity_metrics.max_complexity,
                complexity_metrics.total_functions,
                complexity_metrics.complexity_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate cyclomatic complexity for workspace {}: {}",
                request.workspace_id,
                e
            );
            // Return error as requested - no fallback for complexity
            return ResponseJson(AugmentResponse {
                success: false,
                workspace_id: request.workspace_id,
                overridden: Vec::new(),
                factors: serde_json::Value::Object(serde_json::Map::new()),
                raw: serde_json::json!({
                    "error": format!("Cyclomatic complexity calculation failed: {}", e),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }),
                meta: AugmentResponseMeta {
                    api_version: request.api_version.unwrap_or_else(|| "v1".to_string()),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                },
            });
        }
    }

    // Calculate modularity metrics from workspace files
    match calculate_workspace_modularity(&full_path, selected_files) {
        Ok(modularity_metrics) => {
            factors_map.insert("modularity".to_string(), modularity_metrics.to_json());
            computed_factors.push("modularity".to_string());
            notes.push(format!(
                "Calculated modularity metrics: {} files, {} modules, score={:.1}, avg lines/file={:.1}",
                modularity_metrics.total_files,
                modularity_metrics.total_modules,
                modularity_metrics.modularity_score,
                modularity_metrics.avg_lines_per_file
            ));
            log::info!(
                "Calculated modularity for workspace {}: {} files, {} modules, score={:.1}",
                request.workspace_id,
                modularity_metrics.total_files,
                modularity_metrics.total_modules,
                modularity_metrics.modularity_score
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate modularity for workspace {}: {}",
                request.workspace_id,
                e
            );
            // Return error as requested - no fallback for modularity
            return ResponseJson(AugmentResponse {
                success: false,
                workspace_id: request.workspace_id,
                overridden: Vec::new(),
                factors: serde_json::Value::Object(serde_json::Map::new()),
                raw: serde_json::json!({
                    "error": format!("Modularity calculation failed: {}", e),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }),
                meta: AugmentResponseMeta {
                    api_version: request.api_version.unwrap_or_else(|| "v1".to_string()),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                },
            });
        }
    }

    // Calculate access control metrics from workspace files
    log::info!("📊 PROGRESS: Starting access control analysis...");
    match calculate_workspace_access_control(&full_path, selected_files) {
        Ok(access_control_metrics) => {
            factors_map.insert(
                "accessControl".to_string(),
                access_control_metrics.to_json(),
            );
            computed_factors.push("accessControl".to_string());
            notes.push(format!(
                "Analyzed access control: {} total handlers, {} decorators, {} constraints, {} explicit checks, {} distinct patterns",
            access_control_metrics.gated_handler_count,
            access_control_metrics.manual_check_count,
            access_control_metrics.account_close_count,
            access_control_metrics.unique_role_count,
            access_control_metrics.access_control_factor
            ));
            log::info!(
                "Calculated access control for workspace {}: {} gated handlers, {} manual checks, {} account closes, {} unique roles, AC Factor: {:.2}",
                request.workspace_id,
                access_control_metrics.gated_handler_count,
                access_control_metrics.manual_check_count,
                access_control_metrics.account_close_count,
                access_control_metrics.unique_role_count,
                access_control_metrics.access_control_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate access control for workspace {}: {}",
                request.workspace_id,
                e
            );
            // Return error as requested - no fallback for access control
            return ResponseJson(AugmentResponse {
                success: false,
                workspace_id: request.workspace_id,
                overridden: Vec::new(),
                factors: serde_json::Value::Object(serde_json::Map::new()),
                raw: serde_json::json!({
                    "error": format!("Access control calculation failed: {}", e),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }),
                meta: AugmentResponseMeta {
                    api_version: request.api_version.unwrap_or_else(|| "v1".to_string()),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                },
            });
        }
    }

    // Calculate PDA seed metrics from workspace files
    log::info!(
        "🔍 SERVER DEBUG: About to analyze PDA seeds for workspace: {:?}",
        full_path
    );
    match calculate_workspace_pda_seeds(&full_path, selected_files) {
        Ok(pda_metrics) => {
            factors_map.insert("pdaSeeds".to_string(), pda_metrics.to_json());
            computed_factors.push("pdaSeeds".to_string());
            notes.push(format!(
                "Analyzed PDA seeds: {} total accounts, {} complexity score, PDA Factor: {:.2}, {} distinct patterns",
                pda_metrics.total_pda_accounts,
                pda_metrics.total_seed_complexity_score,
                pda_metrics.pda_complexity_factor,
                pda_metrics.distinct_seed_patterns
            ));
            log::info!(
                "Calculated PDA seeds for workspace {}: {} total accounts, {} complexity score, PDA Factor: {:.2}, {} distinct patterns",
                request.workspace_id,
                pda_metrics.total_pda_accounts,
                pda_metrics.total_seed_complexity_score,
                pda_metrics.pda_complexity_factor,
                pda_metrics.distinct_seed_patterns
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate PDA seeds for workspace {}: {}",
                request.workspace_id,
                e
            );
            // Return error as requested - no fallback for PDA seeds
            return ResponseJson(AugmentResponse {
                success: false,
                workspace_id: request.workspace_id,
                overridden: Vec::new(),
                factors: serde_json::Value::Object(serde_json::Map::new()),
                raw: serde_json::json!({
                    "error": format!("PDA seeds calculation failed: {}", e),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }),
                meta: AugmentResponseMeta {
                    api_version: request.api_version.unwrap_or_else(|| "v1".to_string()),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                },
            });
        }
    }

    // Calculate CPI call metrics from workspace files
    log::info!(
        "🔍 SERVER DEBUG: About to analyze CPI calls for workspace: {:?}",
        full_path
    );
    match calculate_workspace_cpi_calls(&full_path, selected_files) {
        Ok(cpi_metrics) => {
            factors_map.insert("cpiCalls".to_string(), cpi_metrics.to_json());
            computed_factors.push("cpiCalls".to_string());
            notes.push(format!(
                "Analyzed CPI calls: {} total ({} signed, {} unsigned), {} unique programs, complexity={:.1}",
                cpi_metrics.total_cpi_calls,
                cpi_metrics.signed_cpi_calls,
                cpi_metrics.unsigned_cpi_calls,
                cpi_metrics.unique_programs,
                cpi_metrics.cpi_factor
            ));
            log::info!(
                "Calculated CPI calls for workspace {}: {} total, {} unique programs, complexity={:.1}",
                request.workspace_id,
                cpi_metrics.total_cpi_calls,
                cpi_metrics.unique_programs,
                cpi_metrics.cpi_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate CPI calls for workspace {}: {}",
                request.workspace_id,
                e
            );
            // Return error as requested - no fallback for CPI calls
            return ResponseJson(AugmentResponse {
                success: false,
                workspace_id: request.workspace_id,
                overridden: Vec::new(),
                factors: serde_json::Value::Object(serde_json::Map::new()),
                raw: serde_json::json!({
                    "error": format!("CPI calls calculation failed: {}", e),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }),
                meta: AugmentResponseMeta {
                    api_version: request.api_version.unwrap_or_else(|| "v1".to_string()),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                },
            });
        }
    }

    // Calculate input/constraint surface metrics
    log::info!(
        "🔍 SERVER DEBUG: About to analyze input constraints for workspace: {:?}",
        full_path
    );
    match calculate_workspace_input_constraints(&full_path, selected_files) {
        Ok(input_constraint_metrics) => {
            factors_map.insert(
                "inputConstraints".to_string(),
                input_constraint_metrics.to_json(),
            );
            computed_factors.push("inputConstraints".to_string());
            notes.push(format!(
                "Analyzed input constraints: {} handlers, avg {:.1} accounts, {} amount handlers, {} constraints",
                input_constraint_metrics.total_handlers_found,
                input_constraint_metrics.avg_accounts_per_handler,
                input_constraint_metrics.total_amount_handlers,
                input_constraint_metrics.total_constraints
            ));
            log::info!(
                "Calculated input constraints for workspace {}: {} handlers, {} constraints",
                request.workspace_id,
                input_constraint_metrics.total_handlers_found,
                input_constraint_metrics.total_constraints
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate input constraints for workspace {}: {}",
                request.workspace_id,
                e
            );
            // Return error as requested - no fallback for input constraints
            return ResponseJson(AugmentResponse {
                success: false,
                workspace_id: request.workspace_id,
                overridden: Vec::new(),
                factors: serde_json::Value::Object(serde_json::Map::new()),
                raw: serde_json::json!({
                    "error": format!("Input constraints calculation failed: {}", e),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }),
                meta: AugmentResponseMeta {
                    api_version: request.api_version.unwrap_or_else(|| "v1".to_string()),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                },
            });
        }
    }

    // Calculate arithmetic operation metrics
    log::info!(
        "🔍 SERVER DEBUG: About to analyze arithmetic operations for workspace: {:?}",
        full_path
    );
    match calculate_workspace_arithmetic(&full_path, selected_files) {
        Ok(arithmetic_metrics) => {
            factors_map.insert(
                "arithmeticOperations".to_string(),
                arithmetic_metrics.to_json(),
            );
            computed_factors.push("arithmeticOperations".to_string());
            notes.push(format!(
                "Analyzed arithmetic operations: {} math handlers, {} high-risk ops, {} medium-risk ops, factor {:.1}",
                arithmetic_metrics.total_math_handlers,
                arithmetic_metrics.high_risk_ops_count,
                arithmetic_metrics.medium_risk_ops_count,
                arithmetic_metrics.arithmetic_factor
            ));
            log::info!(
                "Calculated arithmetic operations for workspace {}: {} math handlers, factor {:.1}",
                request.workspace_id,
                arithmetic_metrics.total_math_handlers,
                arithmetic_metrics.arithmetic_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate arithmetic operations for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("Arithmetic operations analysis failed: {}", e));
        }
    }

    // Calculate asset types metrics
    log::info!("📊 PROGRESS: Starting asset types analysis...");
    match calculate_workspace_asset_types(&full_path, selected_files) {
        Ok(asset_metrics) => {
            factors_map.insert("assetTypes".to_string(), asset_metrics.to_json());
            computed_factors.push("assetTypes".to_string());
            notes.push(format!(
                "Analyzed asset types: {} distinct standards (SPL-Token: {}, SPL-Token-2022: {}, Metaplex: {}, Custom: {}), factor {:.1}",
                asset_metrics.distinct_asset_standards,
                asset_metrics.uses_spl_token,
                asset_metrics.uses_spl_token_2022,
                asset_metrics.uses_metaplex_nft,
                asset_metrics.custom_asset_definitions,
                asset_metrics.asset_types_factor
            ));
            log::info!(
                "Calculated asset types for workspace {}: {} distinct standards, factor {:.1}",
                request.workspace_id,
                asset_metrics.distinct_asset_standards,
                asset_metrics.asset_types_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate asset types for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("Asset types analysis failed: {}", e));
        }
    }

    // Calculate invariants and risk parameters metrics
    log::info!("📊 PROGRESS: Starting invariants and risk parameters analysis...");
    match calculate_workspace_constraint_density(&full_path, selected_files) {
        Ok(invariants_metrics) => {
            factors_map.insert(
                "invariantsAndRiskParams".to_string(),
                invariants_metrics.to_json(),
            );
            computed_factors.push("invariantsAndRiskParams".to_string());
            notes.push(format!(
                "Analyzed constraint density: {} total assertions, {} complexity score, factor {:.1}",
                invariants_metrics.total_assertions,
                invariants_metrics.total_assertion_complexity_score,
                invariants_metrics.constraint_density_factor
            ));
            log::info!(
                "Calculated constraint density for workspace {}: {} total assertions, {} complexity score, factor {:.1}",
                request.workspace_id,
                invariants_metrics.total_assertions,
                invariants_metrics.total_assertion_complexity_score,
                invariants_metrics.constraint_density_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate invariants for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("Invariants analysis failed: {}", e));
        }
    }

    // Calculate oracle and price feed usage metrics
    // TODO: Implement oracle_price_feed module
    /*
    log::info!("📊 PROGRESS: Starting oracle and price feed usage analysis...");
    match calculate_workspace_oracle_price_feed(&full_path, selected_files) {
        Ok(oracle_metrics) => {
            factors_map.insert("oracleAndPriceFeedUsage".to_string(), oracle_metrics.to_json());
            computed_factors.push("oracleAndPriceFeedUsage".to_string());
            notes.push(format!(
                "Analyzed oracle usage: {} oracle programs, {} price feed calls, {} staleness checks, total score {:.1}",
                oracle_metrics.oracle_programs_detected,
                oracle_metrics.price_feed_calls,
                oracle_metrics.staleness_checks,
                oracle_metrics.total_oracle_score
            ));
            log::info!(
                "Calculated oracle usage for workspace {}: {} oracle programs, {} price feed calls, {} staleness checks, total score {:.1}",
                request.workspace_id,
                oracle_metrics.oracle_programs_detected,
                oracle_metrics.price_feed_calls,
                oracle_metrics.staleness_checks,
                oracle_metrics.total_oracle_score
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate oracle usage for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("Oracle usage analysis failed: {}", e));
        }
    }
    */

    // Calculate privileged roles and admin action metrics
    log::info!(
        "🔍 SERVER DEBUG: About to analyze privileged roles for workspace: {:?}",
        full_path
    );
    match calculate_workspace_privileged_roles(&full_path, selected_files) {
        Ok(privileged_roles_metrics) => {
            factors_map.insert(
                "privilegedRoles".to_string(),
                privileged_roles_metrics.to_json(),
            );
            computed_factors.push("privilegedRoles".to_string());
            notes.push(format!(
                "Analyzed access control: {} gated handlers, {} account closes, {} manual checks, AC factor {:.1}",
                privileged_roles_metrics.total_gated_handlers,
                privileged_roles_metrics.total_account_closes,
                privileged_roles_metrics.total_manual_checks,
                privileged_roles_metrics.ac_factor
            ));
            log::info!(
                "Calculated access control for workspace {}: {} handlers, AC factor {:.1}",
                request.workspace_id,
                privileged_roles_metrics.total_handlers_found,
                privileged_roles_metrics.ac_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate privileged roles for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("Privileged roles analysis failed: {}", e));
        }
    }

    // Calculate unsafe and low-level usage metrics
    log::info!(
        "🔍 SERVER DEBUG: About to analyze unsafe/low-level usage for workspace: {:?}",
        full_path
    );
    match calculate_workspace_unsafe_lowlevel(&full_path, selected_files) {
        Ok(unsafe_metrics) => {
            factors_map.insert("unsafeLowLevel".to_string(), unsafe_metrics.to_json());
            computed_factors.push("unsafeLowLevel".to_string());
            notes.push(format!(
                "Analyzed unsafe/low-level usage: {} unsafe blocks, {} unsafe functions, {} transmute usage, {} bytemuck usage, {} ptr operations, complexity score {:.1}",
                unsafe_metrics.total_unsafe_blocks,
                unsafe_metrics.total_unsafe_functions,
                unsafe_metrics.transmute_usage,
                unsafe_metrics.bytemuck_usage,
                unsafe_metrics.ptr_operations,
                unsafe_metrics.unsafe_complexity_score
            ));
            log::info!(
                "Calculated unsafe/low-level usage for workspace {}: {} unsafe blocks, {} unsafe functions, {} transmute, {} bytemuck, complexity {:.1}",
                request.workspace_id,
                unsafe_metrics.total_unsafe_blocks,
                unsafe_metrics.total_unsafe_functions,
                unsafe_metrics.transmute_usage,
                unsafe_metrics.bytemuck_usage,
                unsafe_metrics.unsafe_complexity_score
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate unsafe/low-level usage for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("Unsafe/low-level usage analysis failed: {}", e));
        }
    }

    // Calculate error handling metrics
    log::info!(
        "🔍 SERVER DEBUG: About to analyze error handling for workspace: {:?}",
        full_path
    );
    match calculate_workspace_error_handling(&full_path, selected_files) {
        Ok(error_metrics) => {
            factors_map.insert("errorHandling".to_string(), error_metrics.to_json());
            computed_factors.push("errorHandling".to_string());
            notes.push(format!(
                "Analyzed error handling: {} require macros, {} require_eq macros, {} total invariants, factor {:.1}",
                error_metrics.total_require_macros,
                error_metrics.total_require_eq_macros,
                error_metrics.total_invariants,
                error_metrics.error_handling_factor
            ));
            log::info!(
                "Calculated error handling for workspace {}: {} require, {} require_eq, {} total invariants, factor {:.1}",
                request.workspace_id,
                error_metrics.total_require_macros,
                error_metrics.total_require_eq_macros,
                error_metrics.total_invariants,
                error_metrics.error_handling_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate error handling for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("Error handling analysis failed: {}", e));
        }
    }

    // Calculate upgradeability and governance control metrics (2-phase hybrid analysis)
    log::info!(
        "🔍 SERVER DEBUG: About to analyze upgradeability for workspace: {:?}",
        full_path
    );
    match calculate_workspace_upgradeability(&full_path, selected_files, request.rpc_url.as_deref())
    {
        Ok(upgradeability_metrics) => {
            factors_map.insert(
                "upgradeability".to_string(),
                upgradeability_metrics.to_json(),
            );
            // Add governance factor as top-level property
            factors_map.insert(
                "governanceFactor".to_string(),
                serde_json::Value::Number(
                    serde_json::Number::from_f64(upgradeability_metrics.governance_factor).unwrap(),
                ),
            );
            computed_factors.push("upgradeability".to_string());
            computed_factors.push("governanceFactor".to_string());

            let status_msg = if upgradeability_metrics.on_chain_analysis_performed {
                format!(
                    "Governance analysis complete: Program ID {}, Status: {}, Factor: {:.1}",
                    upgradeability_metrics
                        .program_id
                        .as_deref()
                        .unwrap_or("N/A"),
                    upgradeability_metrics.governance_status,
                    upgradeability_metrics.governance_factor
                )
            } else {
                format!("Governance analysis skipped: Program ID {}, Status: {}, Factor: {:.1} (RPC: {})", 
                    upgradeability_metrics.program_id.as_deref().unwrap_or("N/A"),
                    upgradeability_metrics.governance_status,
                    upgradeability_metrics.governance_factor,
                    if request.rpc_url.is_some() { "provided but failed" } else { "not provided" })
            };

            notes.push(status_msg);
            log::info!(
                "Calculated upgradeability for workspace {}: Program ID: {:?}, Status: {}, Factor: {:.1}, On-chain: {}",
                request.workspace_id,
                upgradeability_metrics.program_id,
                upgradeability_metrics.governance_status,
                upgradeability_metrics.governance_factor,
                upgradeability_metrics.on_chain_analysis_performed
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate upgradeability for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("Upgradeability analysis failed: {}", e));
        }
    }

    // Calculate external integration and oracle metrics
    log::info!(
        "🔍 SERVER DEBUG: About to analyze external integration for workspace: {:?}",
        full_path
    );
    match calculate_workspace_external_integration(&full_path, selected_files) {
        Ok(external_integration_metrics) => {
            factors_map.insert(
                "externalIntegration".to_string(),
                external_integration_metrics.to_json(),
            );
            computed_factors.push("externalIntegration".to_string());
            notes.push(format!(
                    "Analyzed external integration: {} oracle integrations, {} bridge integrations, {} defi integrations, {} external cpi calls, risk score {:.1}",
                    external_integration_metrics.total_oracle_integrations,
                    external_integration_metrics.total_bridge_integrations,
                    external_integration_metrics.total_defi_integrations,
                    external_integration_metrics.external_cpi_calls,
                    external_integration_metrics.integration_risk_score
                ));
            log::info!(
                    "Calculated external integration for workspace {}: {} oracle, {} bridge, {} defi, {} cpi, risk {:.1}",
                    request.workspace_id,
                    external_integration_metrics.total_oracle_integrations,
                    external_integration_metrics.total_bridge_integrations,
                    external_integration_metrics.total_defi_integrations,
                    external_integration_metrics.external_cpi_calls,
                    external_integration_metrics.integration_risk_score
                );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate external integration for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("External integration analysis failed: {}", e));
        }
    }

    // Calculate composability and inter-program complexity metrics
    log::info!("📊 PROGRESS: Starting composability analysis...");
    match calculate_workspace_composability(&full_path, selected_files) {
        Ok(composability_metrics) => {
            factors_map.insert("composability".to_string(), composability_metrics.to_json());
            computed_factors.push("composability".to_string());
            notes.push(format!(
                    "Analyzed composability: {} handlers found, {} multi-CPI handlers, composability factor {:.1}",
                    composability_metrics.total_handlers_found,
                    composability_metrics.multi_cpi_handlers_count,
                    composability_metrics.composability_factor
                ));
            log::info!(
                    "Calculated composability for workspace {}: {} handlers, {} multi-CPI handlers, factor {:.1}",
                    request.workspace_id,
                    composability_metrics.total_handlers_found,
                    composability_metrics.multi_cpi_handlers_count,
                    composability_metrics.composability_factor
                );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate composability for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("Composability analysis failed: {}", e));
        }
    }

    // Calculate statefulness and sequence of operations metrics
    // TODO: Implement statefulness module
    /*
    log::info!(
        "🔍 SERVER DEBUG: About to analyze statefulness for workspace: {:?}",
        full_path
    );
    match calculate_workspace_statefulness(&full_path, selected_files) {
        Ok(statefulness_metrics) => {
            factors_map.insert("statefulness".to_string(), statefulness_metrics.to_json());
            computed_factors.push("statefulness".to_string());
            notes.push(format!(
                "Analyzed statefulness: {} mutable accounts, {} sequence dependencies, {} multi-step workflows, {} race condition risks, complexity score {:.1}",
                statefulness_metrics.mutable_account_patterns,
                statefulness_metrics.sequence_dependency_patterns,
                statefulness_metrics.multi_step_workflow_patterns,
                statefulness_metrics.race_condition_risks,
                statefulness_metrics.statefulness_complexity_score
            ));
            log::info!(
                "Calculated statefulness for workspace {}: {} mutable accounts, {} sequences, {} workflows, {} race conditions, complexity {:.1}",
                request.workspace_id,
                statefulness_metrics.mutable_account_patterns,
                statefulness_metrics.sequence_dependency_patterns,
                statefulness_metrics.multi_step_workflow_patterns,
                statefulness_metrics.race_condition_risks,
                statefulness_metrics.statefulness_complexity_score
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate statefulness for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("Statefulness analysis failed: {}", e));
        }
    }
    */

    // Calculate DOS and resource limits metrics
    log::info!(
        "🔍 SERVER DEBUG: About to analyze DOS resource limits for workspace: {:?}",
        full_path
    );
    match calculate_workspace_dos_resource_limits(&full_path, selected_files) {
        Ok(dos_metrics) => {
            factors_map.insert("dosResourceLimits".to_string(), dos_metrics.to_json());
            computed_factors.push("dosResourceLimits".to_string());
            notes.push(format!(
                "Analyzed DOS resource limits: {} handlers found, {} with vec params, {} with loops, {} dynamic space accounts, resource factor {:.1}",
                dos_metrics.total_handlers_found,
                dos_metrics.handlers_with_vec_params,
                dos_metrics.handlers_with_loops,
                dos_metrics.dynamic_space_accounts,
                dos_metrics.resource_factor
            ));
            log::info!(
                "Calculated DOS resource limits for workspace {}: {} handlers, {} vec params, {} loops, {} dynamic space, factor {:.1}",
                request.workspace_id,
                dos_metrics.total_handlers_found,
                dos_metrics.handlers_with_vec_params,
                dos_metrics.handlers_with_loops,
                dos_metrics.dynamic_space_accounts,
                dos_metrics.resource_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate DOS resource limits for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("DOS resource limits analysis failed: {}", e));
        }
    }

    // Calculate operational security metrics
    log::info!(
        "🔍 SERVER DEBUG: About to analyze operational security for workspace: {:?}",
        full_path
    );
    match calculate_workspace_operational_security(&full_path, selected_files) {
        Ok(operational_metrics) => {
            factors_map.insert(
                "operationalSecurity".to_string(),
                operational_metrics.to_json(),
            );
            computed_factors.push("operationalSecurity".to_string());
            notes.push(format!(
                "Analyzed operational security: {} control handlers, {} pause checks, {} sysvar dependencies, opsec factor {:.1}",
                operational_metrics.control_handlers,
                operational_metrics.pause_checks,
                operational_metrics.sysvar_dependencies,
                operational_metrics.opsec_factor
            ));
            log::info!(
                "Calculated operational security for workspace {}: {} control handlers, {} pause checks, {} sysvar dependencies, opsec factor {:.1}",
                request.workspace_id,
                operational_metrics.control_handlers,
                operational_metrics.pause_checks,
                operational_metrics.sysvar_dependencies,
                operational_metrics.opsec_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate operational security for workspace {}: {}",
                request.workspace_id,
                e
            );
            notes.push(format!("Operational security analysis failed: {}", e));
        }
    }

    // Calculate external dependencies from workspace Cargo.toml
    log::info!(
        "🔍 SERVER DEBUG: About to analyze dependencies for workspace: {:?}",
        full_path
    );
    log::info!("🔍 SERVER DEBUG: Workspace exists: {}", full_path.exists());
    log::info!(
        "🔍 SERVER DEBUG: Workspace is directory: {}",
        full_path.is_dir()
    );
    match calculate_workspace_dependencies(&full_path, selected_files) {
        Ok(dependency_metrics) => {
            factors_map.insert("dependencies".to_string(), dependency_metrics.to_json());
            computed_factors.push("dependencies".to_string());
            notes.push(format!(
                "Analyzed dependencies: {} total (T1:{}, T2:{}, T3:{}, T4:{}), security score={:.1}",
                dependency_metrics.total_dependencies,
                dependency_metrics.tier_1_count,
                dependency_metrics.tier_2_count,
                dependency_metrics.tier_3_count,
                dependency_metrics.tier_4_count,
                dependency_metrics.dependency_factor
            ));
            log::info!(
                "Calculated dependencies for workspace {}: {} total, security score={:.1}",
                request.workspace_id,
                dependency_metrics.total_dependencies,
                dependency_metrics.dependency_factor
            );
        }
        Err(e) => {
            log::error!(
                "Failed to calculate dependencies for workspace {}: {}",
                request.workspace_id,
                e
            );
            // Return error as requested - no fallback for dependencies
            return ResponseJson(AugmentResponse {
                success: false,
                workspace_id: request.workspace_id,
                overridden: Vec::new(),
                factors: serde_json::Value::Object(serde_json::Map::new()),
                raw: serde_json::json!({
                    "error": format!("Dependencies calculation failed: {}", e),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }),
                meta: AugmentResponseMeta {
                    api_version: request.api_version.unwrap_or_else(|| "v1".to_string()),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                },
            });
        }
    }

    // Build raw diagnostic information
    let raw = serde_json::json!({
        "selectedFiles": request.selected_files,
        "computed": computed_factors,
        "notes": notes,
        "workspacePath": full_path.to_string_lossy(),
        "timestamp": chrono::Utc::now().to_rfc3339()
    });

    let elapsed = start_time.elapsed();
    log::info!(
        "✅ AUGMENT COMPLETE: Processed workspace {} in {:.2}s with {} factors: {}",
        request.workspace_id,
        elapsed.as_secs_f64(),
        computed_factors.len(),
        computed_factors.join(", ")
    );

    let response = AugmentResponse {
        success: true,
        workspace_id: request.workspace_id,
        overridden: computed_factors.clone(),
        factors: serde_json::Value::Object(factors_map),
        raw,
        meta: AugmentResponseMeta {
            api_version: request.api_version.unwrap_or_else(|| "v1".to_string()),
            timestamp: chrono::Utc::now().to_rfc3339(),
        },
    };
    ResponseJson(response)
}

/// Simple GET variant for diagnostics to confirm route exists
async fn augment_get() -> ResponseJson<serde_json::Value> {
    ResponseJson(serde_json::json!({
        "route": "/augment",
        "method": "GET",
        "diagnostic": true,
        "example_payload": {"workspace_id":"test","api_version":"v1"}
    }))
}

/// List registered routes (static listing since Axum doesn't expose them directly)
async fn list_routes() -> ResponseJson<serde_json::Value> {
    ResponseJson(serde_json::json!({
        "routes": [
            {"path":"/health","methods":["GET"]},
            {"path":"/analyze","methods":["POST"]},
            {"path":"/augment","methods":["POST","GET"]},
            {"path":"/workspaces","methods":["GET"]},
            {"path":"/test","methods":["POST"]},
            {"path":"/test-direct","methods":["POST"]}
        ]
    }))
}

/// Main analysis endpoint
async fn analyze_workspace(
    Json(request): Json<AnalysisRequest>,
) -> Result<ResponseJson<AnalysisResponse>, (StatusCode, ResponseJson<AnalysisResponse>)> {
    log::info!(
        "Received analysis request for workspace: {}",
        request.workspace_id
    );

    // Construct workspace path (shared volume)
    let workspace_path = std::env::var("SHARED_WORKSPACE_PATH")
        .unwrap_or_else(|_| "/tmp/shared/workspaces".to_string());
    let full_path = PathBuf::from(workspace_path).join(&request.workspace_id);

    // Validate workspace exists
    if !full_path.exists() {
        log::error!("Workspace not found: {:?}", full_path);
        return Err((
            StatusCode::NOT_FOUND,
            ResponseJson(AnalysisResponse {
                success: false,
                data: None,
                error: Some(format!("Workspace '{}' not found", request.workspace_id)),
                metadata: ResponseMetadata {
                    analyzer_version: env!("CARGO_PKG_VERSION").to_string(),
                    analysis_engine: "rust-semantic-analyzer".to_string(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    workspace_id: request.workspace_id.clone(),
                },
            }),
        ));
    }

    // Build analyzer config
    let options = request.options.unwrap_or_default();
    let config = AnalyzerConfig {
        root_path: full_path,
        include_tests: options.include_tests.unwrap_or(false),
        include_benches: options.include_benches.unwrap_or(false),
        include_examples: options.include_examples.unwrap_or(false),
        expand_macros: options.expand_macros.unwrap_or(false),
        max_file_size: options.max_file_size.unwrap_or(1024 * 1024), // 1MB default
        ..Default::default()
    };

    // Perform analysis
    match analyze_repository(config) {
        Ok(report) => {
            log::info!(
                "Analysis completed successfully for workspace: {}",
                request.workspace_id
            );

            Ok(ResponseJson(AnalysisResponse {
                success: true,
                data: Some(serde_json::to_value(report).unwrap()),
                error: None,
                metadata: ResponseMetadata {
                    analyzer_version: env!("CARGO_PKG_VERSION").to_string(),
                    analysis_engine: "rust-semantic-analyzer".to_string(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    workspace_id: request.workspace_id,
                },
            }))
        }
        Err(e) => {
            log::error!(
                "Analysis failed for workspace {}: {}",
                request.workspace_id,
                e
            );

            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                ResponseJson(AnalysisResponse {
                    success: false,
                    data: None,
                    error: Some(e.to_string()),
                    metadata: ResponseMetadata {
                        analyzer_version: env!("CARGO_PKG_VERSION").to_string(),
                        analysis_engine: "rust-semantic-analyzer".to_string(),
                        timestamp: chrono::Utc::now().to_rfc3339(),
                        workspace_id: request.workspace_id,
                    },
                }),
            ))
        }
    }
}

/// List available workspaces (for debugging)
async fn list_workspaces() -> ResponseJson<HashMap<String, Vec<String>>> {
    let workspace_path = std::env::var("SHARED_WORKSPACE_PATH")
        .unwrap_or_else(|_| "/tmp/shared/workspaces".to_string());

    let mut workspaces = HashMap::new();

    if let Ok(entries) = std::fs::read_dir(&workspace_path) {
        for entry in entries.flatten() {
            if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                let workspace_name = entry.file_name().to_string_lossy().to_string();
                let files = list_rust_files(&entry.path());
                workspaces.insert(workspace_name, files);
            }
        }
    }

    ResponseJson(workspaces)
}

/// Helper to list Rust files in a directory
fn list_rust_files(path: &std::path::Path) -> Vec<String> {
    let mut files = Vec::new();

    if let Ok(entries) = walkdir::WalkDir::new(path)
        .into_iter()
        .collect::<Result<Vec<_>, _>>()
    {
        for entry in entries {
            if entry.file_type().is_file() {
                if let Some(ext) = entry.path().extension() {
                    if ext == "rs" {
                        if let Ok(relative_path) = entry.path().strip_prefix(path) {
                            files.push(relative_path.to_string_lossy().to_string());
                        }
                    }
                }
            }
        }
    }

    files
}

impl Default for AnalysisOptions {
    fn default() -> Self {
        Self {
            include_tests: Some(false),
            include_benches: Some(false),
            include_examples: Some(false),
            expand_macros: Some(false),
            max_file_size: Some(1024 * 1024),
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    log::info!(
        "Starting AMM Analyzer HTTP Server v{}",
        env!("CARGO_PKG_VERSION")
    );

    // Build application routes
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/analyze", post(analyze_workspace))
        .route("/augment", post(augment).get(augment_get))
        .route("/workspaces", get(list_workspaces))
        .route("/routes", get(list_routes))
        .route("/test", post(test_shared_volume))
        .route("/test-direct", post(test_direct))
        .layer(CorsLayer::permissive()); // Allow CORS for development

    // Get port from environment or default to 8080
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .unwrap_or(8080);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    log::info!("Server listening on http://{}", addr);
    log::info!(
        "Workspace path: {}",
        std::env::var("SHARED_WORKSPACE_PATH")
            .unwrap_or_else(|_| "/tmp/shared/workspaces".to_string())
    );

    // Start server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
