//! HTTP Server for AMM Analyzer
//!
//! Provides REST API endpoints for semantic analysis of Rust smart contracts

use amm_analyzer::{analyze_repository, AnalyzerConfig};
use axum::{
    extract::{Json, Query},
    http::StatusCode,
    response::Json as ResponseJson,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, net::SocketAddr, path::PathBuf};
use tower_http::cors::CorsLayer;

#[derive(Debug, Deserialize)]
struct AnalysisRequest {
    /// Workspace ID (directory name in shared storage)
    workspace_id: String,

    /// Selected files to analyze (relative paths)
    selected_files: Option<Vec<String>>,

    /// Analysis options
    options: Option<AnalysisOptions>,
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
        .route("/workspaces", get(list_workspaces))
        .route("/test", post(test_shared_volume))
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
