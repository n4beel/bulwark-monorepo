//! Bulwark CLI - Smart Contract Security Analysis
//!
//! A command-line tool for analyzing Solana/Anchor smart contracts.

use anyhow::Result;
use clap::{Parser, Subcommand, ValueEnum};
use std::io::Write;
use std::path::PathBuf;
use std::time::Instant;

// Import CLI modules from the library
use amm_analyzer::cli::cli_api;
use amm_analyzer::cli::cli_auth;
use amm_analyzer::cli::cli_config::{self, AvailableFactors, CliConfig};
use amm_analyzer::cli::cli_display::{
    self, print_banner, print_error, print_info, print_success, print_warning, Spinner,
};

#[derive(Parser)]
#[command(name = "bulwark")]
#[command(author = "BlockApex")]
#[command(version)]
#[command(about = "Smart contract security analysis for Solana/Anchor programs", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// Enable verbose output
    #[arg(short, long, global = true)]
    verbose: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Authenticate with Bulwark (opens browser for OAuth)
    Login {
        /// Authentication provider (github or google)
        #[arg(short, long, default_value = "github")]
        provider: String,
    },

    /// Sign out of Bulwark
    Logout,

    /// Show current authentication status
    Status,

    /// Analyze a Rust/Anchor project
    Analyze {
        /// Path to the project directory (defaults to current directory)
        #[arg(short, long, default_value = ".")]
        path: PathBuf,

        /// Run analysis locally without syncing to backend
        #[arg(long)]
        local: bool,

        /// Analyze a specific factor only (requires whitelist)
        #[arg(long)]
        factor: Option<String>,

        /// Analyze a category of factors (structural, security, systemic, economic, ai)
        #[arg(long)]
        category: Option<String>,

        /// Output format
        #[arg(short, long, default_value = "text")]
        output: OutputFormat,

        /// Save output to file
        #[arg(long)]
        save: Option<PathBuf>,

        /// Skip AI analysis (AI analysis is enabled by default)
        #[arg(long)]
        no_ai: bool,
    },

    /// List available analysis factors
    Factors,

    /// Sync queued offline analyses with the server
    Sync,

    /// Manage CLI configuration
    Config {
        #[command(subcommand)]
        command: ConfigCommands,
    },
}

#[derive(Subcommand)]
enum ConfigCommands {
    /// View all configuration
    View,
    /// Get a configuration value
    Get { key: String },
    /// Set a configuration value
    Set { key: String, value: String },
    /// Reset configuration to defaults
    Reset,
}

#[derive(Clone, ValueEnum)]
enum OutputFormat {
    Text,
    Json,
    Minimal,
}

#[tokio::main]
async fn main() {
    // Load .env file if present
    let _ = dotenv::dotenv();

    if let Err(e) = run().await {
        print_error(&format!("{}", e));
        std::process::exit(1);
    }
}

async fn run() -> Result<()> {
    let cli = Cli::parse();

    // Initialize logging - suppress all logs unless verbose
    if cli.verbose {
        env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug")).init();
    } else {
        // Set to "error" to suppress debug, info, and warn logs
        env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("error")).init();
    }

    match cli.command {
        Commands::Login { provider } => {
            print_banner();
            cli_auth::login(&provider).await?;
        }

        Commands::Logout => {
            cli_auth::logout()?;
        }

        Commands::Status => {
            cli_auth::status()?;
        }

        Commands::Analyze {
            path,
            local,
            factor,
            category,
            output,
            save,
            no_ai,
        } => {
            // AI is enabled by default, --no-ai disables it
            let include_ai = !no_ai;
            run_analysis(
                path,
                local,
                factor,
                category,
                output,
                save,
                include_ai,
                cli.verbose,
            )
            .await?;
        }

        Commands::Factors => {
            let factors = AvailableFactors::default();
            factors.print_all();
        }

        Commands::Sync => {
            print_info("Checking for queued analyses...");
            cli_api::sync_queued_analyses().await?;
        }

        Commands::Config { command } => {
            handle_config_command(command)?;
        }
    }

    Ok(())
}

async fn run_analysis(
    path: PathBuf,
    local: bool,
    factor: Option<String>,
    category: Option<String>,
    output_format: OutputFormat,
    save: Option<PathBuf>,
    include_ai: bool,
    verbose: bool,
) -> Result<()> {
    let config = CliConfig::load()?;
    let available_factors = AvailableFactors::default();

    // Validate factor/category if specified
    if let Some(ref f) = factor {
        if !available_factors.exists(f) {
            print_error(&format!(
                "Unknown factor: {}. Run 'bulwark factors' to see available factors.",
                f
            ));
            return Ok(());
        }

        // Check if user is whitelisted for single factor analysis
        if !cli_auth::is_whitelisted() {
            print_error("Single factor analysis requires whitelisted access.");
            print_info("Run 'bulwark login' to authenticate.");
            return Ok(());
        }
    }

    if let Some(ref c) = category {
        if available_factors.get_by_category(c).is_none() {
            print_error(&format!(
                "Unknown category: {}. Use: structural, security, systemic, economic, or ai",
                c
            ));
            return Ok(());
        }

        // AI category requires login
        if c.to_lowercase() == "ai" && !cli_auth::is_authenticated() {
            print_error("AI analysis requires authentication.");
            print_info("Run 'bulwark login' to authenticate.");
            return Ok(());
        }
    }

    // Note: AI analysis uses OPENAI_API_KEY from .env file
    // No authentication required for basic AI analysis

    // Resolve and validate path
    let absolute_path = if path.is_absolute() {
        path.clone()
    } else {
        std::env::current_dir()?.join(&path)
    };

    if !absolute_path.exists() {
        print_error(&format!("Path does not exist: {:?}", absolute_path));
        return Ok(());
    }

    // Get project name from directory
    let project_name = absolute_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    print_info(&format!("Analyzing project: {}", project_name));
    print_info(&format!("Path: {:?}", absolute_path));
    println!();

    let start_time = Instant::now();

    // Run the analysis
    let mut spinner = Spinner::new("Running analysis...");

    let analysis_result = run_local_analysis(
        &absolute_path,
        factor.as_deref(),
        category.as_deref(),
        include_ai,
        verbose,
    )
    .await;

    match analysis_result {
        Ok(result) => {
            let duration = start_time.elapsed();
            spinner.success(&format!("Completed in {:.2}s", duration.as_secs_f64()));

            // Extract stats for receipt - try both server format and local analysis format
            let files_count = result
                .get("factors")
                .and_then(|f| f.get("filesAnalyzed"))
                .and_then(|v| v.as_u64())
                // Fallback to local analysis format: repository.file_count
                .or_else(|| {
                    result
                        .get("repository")
                        .and_then(|r| r.get("file_count"))
                        .and_then(|v| v.as_u64())
                })
                .unwrap_or(0) as usize;

            let lines_of_code = result
                .get("factors")
                .and_then(|f| f.get("totalLinesOfCode"))
                .and_then(|v| v.as_u64())
                // Fallback to local analysis format: repository.total_lines_of_code
                .or_else(|| {
                    result
                        .get("repository")
                        .and_then(|r| r.get("total_lines_of_code"))
                        .and_then(|v| v.as_u64())
                })
                .unwrap_or(0);

            // Determine framework
            let framework = detect_framework(&absolute_path);

            // If single factor or category, just display that
            if factor.is_some() || category.is_some() {
                match output_format {
                    OutputFormat::Json => {
                        println!("{}", serde_json::to_string_pretty(&result)?);
                    }
                    OutputFormat::Text => {
                        if let Some(ref cat) = category {
                            if let Some(cat_result) = result.get("factors").and_then(|f| f.get(cat))
                            {
                                cli_display::print_category_results(cat, cat_result);
                            }
                        } else if let Some(ref f) = factor {
                            if let Some(factor_result) =
                                result.get("factors").and_then(|facs| facs.get(f))
                            {
                                cli_display::print_factor_result(f, factor_result);
                            }
                        }
                    }
                    OutputFormat::Minimal => {
                        // Just print the raw value
                        if let Some(v) = result.get("factors") {
                            println!("{}", v);
                        }
                    }
                }

                // Save to file if requested
                if let Some(save_path) = save {
                    std::fs::write(&save_path, serde_json::to_string_pretty(&result)?)?;
                    print_success(&format!("Results saved to {:?}", save_path));
                }

                return Ok(());
            }

            // Full analysis - try to sync with backend unless --local
            if !local {
                let mut sync_spinner = Spinner::new("Syncing with Bulwark...");

                // Check connectivity
                if cli_api::check_server_connectivity().await {
                    match cli_api::submit_analysis(
                        &result,
                        &project_name,
                        &framework,
                        start_time.elapsed().as_millis() as u64,
                        start_time.elapsed().as_millis() as u64,
                    )
                    .await
                    {
                        Ok(response) => {
                            sync_spinner.success("Synced");

                            let receipt = cli_api::build_receipt_from_response(
                                &response,
                                &project_name,
                                files_count,
                                lines_of_code,
                                result.get("calculated_scores"),
                                &config.web_url,
                            );

                            match output_format {
                                OutputFormat::Json => {
                                    println!("{}", serde_json::to_string_pretty(&result)?);
                                }
                                OutputFormat::Minimal => {
                                    if let Some(scores) = result.get("calculated_scores") {
                                        println!("{}", scores);
                                    }
                                }
                                OutputFormat::Text => {
                                    cli_display::print_receipt(&receipt);
                                }
                            }
                        }
                        Err(e) => {
                            sync_spinner.fail(&format!("Sync failed: {}", e));
                            queue_and_show_offline_receipt(
                                &result,
                                &project_name,
                                files_count,
                                lines_of_code,
                                output_format,
                            )?;
                        }
                    }
                } else {
                    sync_spinner.fail("Server unreachable");
                    queue_and_show_offline_receipt(
                        &result,
                        &project_name,
                        files_count,
                        lines_of_code,
                        output_format,
                    )?;
                }
            } else {
                // Local mode - just show results
                match output_format {
                    OutputFormat::Json => {
                        println!("{}", serde_json::to_string_pretty(&result)?);
                    }
                    OutputFormat::Minimal => {
                        if let Some(scores) = result.get("calculated_scores") {
                            println!("{}", scores);
                        }
                    }
                    OutputFormat::Text => {
                        // Build local receipt
                        let receipt =
                            build_local_receipt(&result, &project_name, files_count, lines_of_code);
                        cli_display::print_offline_receipt(&receipt);
                    }
                }
            }

            // Save to file if requested
            if let Some(save_path) = save {
                std::fs::write(&save_path, serde_json::to_string_pretty(&result)?)?;
                print_success(&format!("Results saved to {:?}", save_path));
            }
        }
        Err(e) => {
            spinner.fail(&format!("Analysis failed: {}", e));
        }
    }

    Ok(())
}

async fn run_local_analysis(
    path: &PathBuf,
    _factor: Option<&str>,
    _category: Option<&str>,
    include_ai: bool,
    verbose: bool,
) -> Result<serde_json::Value> {
    use amm_analyzer::factors::{
        access_control::calculate_workspace_access_control,
        arithmetic::calculate_workspace_arithmetic, asset_types::calculate_workspace_asset_types,
        complexity::calculate_workspace_cyclomatic_complexity,
        composability::calculate_workspace_composability, cpi_calls::calculate_workspace_cpi_calls,
        dependencies::calculate_workspace_dependencies,
        dos_resource_limits::calculate_workspace_dos_resource_limits,
        error_handling::calculate_workspace_error_handling,
        external_integration::calculate_workspace_external_integration,
        input_constraints::calculate_workspace_input_constraints,
        invariants_risk_params::calculate_workspace_constraint_density,
        lines_of_code::calculate_workspace_tsc, modularity::calculate_workspace_modularity,
        operational_security::calculate_workspace_operational_security,
        pda_seeds::calculate_workspace_pda_seeds,
        privileged_roles::calculate_workspace_privileged_roles,
        unsafe_lowlevel::calculate_workspace_unsafe_lowlevel,
        upgradeability::calculate_workspace_upgradeability,
    };
    use amm_analyzer::sast;
    use amm_analyzer::score_calculator::{
        extract_static_analysis_scores, CodeMetrics, RepoData, ScoreCalculator,
    };

    // Find all Rust files in the project
    let rust_files = find_rust_files(path)?;
    if rust_files.is_empty() {
        return Err(anyhow::anyhow!("No Rust files found in {:?}", path));
    }

    // Convert to slice of String references as expected by the factor functions
    let rust_files_slice: &[String] = &rust_files;

    if verbose {
        println!("Found {} Rust files to analyze", rust_files.len());
    }

    let mut factors_map = serde_json::Map::new();

    // Total number of factor analyses (excluding function count which is inline)
    const TOTAL_FACTORS: usize = 20;
    let mut current_factor = 0;

    // Helper to update progress
    macro_rules! update_progress {
        () => {
            current_factor += 1;
            if !verbose {
                print!(
                    "\r  Analyzing factors... {}/{} completed",
                    current_factor, TOTAL_FACTORS
                );
                let _ = std::io::stdout().flush();
            }
        };
    }

    // Calculate lines of code / TSC metrics
    update_progress!();
    if let Ok(tsc_metrics) = calculate_workspace_tsc(path, rust_files_slice) {
        factors_map.insert(
            "totalLinesOfCode".to_string(),
            serde_json::json!(tsc_metrics.total_statements),
        );
        factors_map.insert(
            "locFactor".to_string(),
            serde_json::json!(tsc_metrics.loc_factor),
        );
        factors_map.insert("tscMetrics".to_string(), tsc_metrics.to_json());
    }

    // Calculate function count using function_count module
    {
        use amm_analyzer::factors::function_count::FunctionCountMetrics;
        let mut aggregated = FunctionCountMetrics::default();
        for file in &rust_files {
            let file_path = path.join(file);
            if let Ok(content) = std::fs::read_to_string(&file_path) {
                if let Ok(metrics) =
                    amm_analyzer::factors::function_count::count_functions(&content)
                {
                    aggregated.total_functions += metrics.total_functions;
                    aggregated.public_functions += metrics.public_functions;
                    aggregated.private_functions += metrics.private_functions;
                }
            }
        }
        aggregated.function_factor =
            FunctionCountMetrics::calculate_function_factor(aggregated.total_functions);
        factors_map.insert(
            "numFunctions".to_string(),
            serde_json::json!(aggregated.total_functions),
        );
        factors_map.insert(
            "functionFactor".to_string(),
            serde_json::json!(aggregated.function_factor),
        );
        factors_map.insert("functionCountMetrics".to_string(), aggregated.to_json());
    }

    // Calculate cyclomatic complexity
    update_progress!();
    if let Ok(complexity_metrics) =
        calculate_workspace_cyclomatic_complexity(path, rust_files_slice)
    {
        factors_map.insert("complexity".to_string(), complexity_metrics.to_json());
        factors_map.insert(
            "complexityFactor".to_string(),
            serde_json::json!(complexity_metrics.complexity_factor),
        );
    }

    // Calculate modularity
    update_progress!();
    if let Ok(modularity_metrics) = calculate_workspace_modularity(path, rust_files_slice) {
        factors_map.insert("modularity".to_string(), modularity_metrics.to_json());
    }

    // Calculate access control
    update_progress!();
    if let Ok(access_metrics) = calculate_workspace_access_control(path, rust_files_slice) {
        factors_map.insert("accessControl".to_string(), access_metrics.to_json());
    }

    // Calculate PDA seeds
    update_progress!();
    if let Ok(pda_metrics) = calculate_workspace_pda_seeds(path, rust_files_slice) {
        factors_map.insert("pdaSeeds".to_string(), pda_metrics.to_json());
    }

    // Calculate CPI calls
    update_progress!();
    if let Ok(cpi_metrics) = calculate_workspace_cpi_calls(path, rust_files_slice) {
        factors_map.insert("cpiCalls".to_string(), cpi_metrics.to_json());
    }

    // Calculate input constraints
    update_progress!();
    if let Ok(input_metrics) = calculate_workspace_input_constraints(path, rust_files_slice) {
        factors_map.insert("inputConstraints".to_string(), input_metrics.to_json());
    }

    // Calculate arithmetic operations
    update_progress!();
    if let Ok(arith_metrics) = calculate_workspace_arithmetic(path, rust_files_slice) {
        factors_map.insert("arithmeticOperations".to_string(), arith_metrics.to_json());
    }

    // Calculate privileged roles
    update_progress!();
    if let Ok(priv_metrics) = calculate_workspace_privileged_roles(path, rust_files_slice) {
        factors_map.insert("privilegedRoles".to_string(), priv_metrics.to_json());
    }

    // Calculate unsafe/low-level
    update_progress!();
    if let Ok(unsafe_metrics) = calculate_workspace_unsafe_lowlevel(path, rust_files_slice) {
        factors_map.insert("unsafeLowLevel".to_string(), unsafe_metrics.to_json());
    }

    // Calculate error handling
    update_progress!();
    if let Ok(error_metrics) = calculate_workspace_error_handling(path, rust_files_slice) {
        factors_map.insert("errorHandling".to_string(), error_metrics.to_json());
    }

    // Calculate upgradeability (without RPC - offline)
    update_progress!();
    if let Ok(upgrade_metrics) = calculate_workspace_upgradeability(path, rust_files_slice, None) {
        factors_map.insert("upgradeability".to_string(), upgrade_metrics.to_json());
    }

    // Calculate dependencies
    update_progress!();
    if let Ok(dep_metrics) = calculate_workspace_dependencies(path, rust_files_slice) {
        factors_map.insert("dependencies".to_string(), dep_metrics.to_json());
    }

    // Calculate external integration
    update_progress!();
    if let Ok(ext_metrics) = calculate_workspace_external_integration(path, rust_files_slice) {
        factors_map.insert("externalIntegration".to_string(), ext_metrics.to_json());
    }

    // Calculate composability
    update_progress!();
    if let Ok(comp_metrics) = calculate_workspace_composability(path, rust_files_slice) {
        factors_map.insert("composability".to_string(), comp_metrics.to_json());
    }

    // Calculate DoS/resource limits
    update_progress!();
    if let Ok(dos_metrics) = calculate_workspace_dos_resource_limits(path, rust_files_slice) {
        factors_map.insert("dosResourceLimits".to_string(), dos_metrics.to_json());
    }

    // Calculate operational security
    update_progress!();
    if let Ok(opsec_metrics) = calculate_workspace_operational_security(path, rust_files_slice) {
        factors_map.insert("operationalSecurity".to_string(), opsec_metrics.to_json());
    }

    // Calculate asset types
    update_progress!();
    if let Ok(asset_metrics) = calculate_workspace_asset_types(path, rust_files_slice) {
        factors_map.insert("assetTypes".to_string(), asset_metrics.to_json());
    }

    // Calculate invariants and risk params
    update_progress!();
    if let Ok(inv_metrics) = calculate_workspace_constraint_density(path, rust_files_slice) {
        factors_map.insert("invariantsAndRiskParams".to_string(), inv_metrics.to_json());
    }

    // Clear progress line and add newline
    if !verbose {
        print!(
            "\r  Analyzing factors... {}/{} completed\n",
            TOTAL_FACTORS, TOTAL_FACTORS
        );
    }

    // Get total LOC for result
    let total_loc = factors_map
        .get("totalLinesOfCode")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);

    // Calculate scores
    let factors_json = serde_json::Value::Object(factors_map.clone());
    let static_analysis_scores = extract_static_analysis_scores(&factors_json);

    // AI analysis and SAST analysis (run in parallel like /augment endpoint)
    // Only skip AI if explicitly disabled via flag or if OPENAI_API_KEY not set
    println!("🤖 Starting AI and SAST analysis...");

    let (ai_result, sast_result): (
        Result<Option<serde_json::Value>, anyhow::Error>,
        Result<Option<serde_json::Value>, anyhow::Error>,
    ) = tokio::join!(
        async {
            if !include_ai {
                if verbose {
                    println!("AI analysis skipped (--no-ai flag)");
                }
                Ok(None)
            } else {
                match run_ai_analysis(path, &rust_files, verbose).await {
                    Ok(ai) => {
                        println!("✅ AI analysis completed successfully");
                        Ok(Some(ai))
                    }
                    Err(e) => {
                        println!("⚠️  AI analysis skipped: {}", e);
                        Ok(None)
                    }
                }
            }
        },
        async {
            match sast::run_sast_analysis(path, Some(rust_files_slice)).await {
                Ok(result) => {
                    println!("✅ SAST analysis completed successfully");
                    Ok(Some(result.to_json()))
                }
                Err(e) => {
                    println!("⚠️  SAST analysis skipped: {}", e);
                    Ok(None)
                }
            }
        }
    );

    let ai_factors = ai_result.unwrap_or(None);
    let sast_results = sast_result.unwrap_or(None);

    // Extract AI code metrics for score calculation
    let ai_code_metrics = ai_factors
        .as_ref()
        .and_then(|af| af.get("codeAnalysis"))
        .map(|ca| CodeMetrics {
            high_risk_hotspots: ca
                .get("highRiskHotspots")
                .and_then(|v| v.as_array())
                .cloned(),
            medium_risk_hotspots: ca
                .get("mediumRiskHotspots")
                .and_then(|v| v.as_array())
                .cloned(),
            findings: ca.get("findings").and_then(|v| v.as_array()).map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect::<Vec<String>>()
            }),
        })
        .unwrap_or_else(|| CodeMetrics {
            high_risk_hotspots: None,
            medium_risk_hotspots: None,
            findings: None,
        });

    let repo_data = RepoData {
        files_count: rust_files.len(),
        receipt_id: String::new(),
        commit_url: String::new(),
        href_url: String::new(),
    };

    let (calculated_scores, calculated_report) = ScoreCalculator::calculate_total_score(
        &static_analysis_scores,
        &ai_code_metrics,
        &repo_data,
    );

    // Build final result in same format as /augment endpoint
    // Use empty object instead of null for ai_factors to avoid backend errors
    let ai_factors_json = ai_factors.unwrap_or_else(|| serde_json::json!({}));

    let result = serde_json::json!({
        "success": true,
        "factors": factors_json,
        "ai_factors": ai_factors_json,
        "sast_results": sast_results,
        "calculated_scores": calculated_scores,
        "calculated_report": calculated_report,
        "repository": {
            "file_count": rust_files.len(),
            "total_lines_of_code": total_loc,
        }
    });

    Ok(result)
}

/// Find all Rust files in the project directory
fn find_rust_files(path: &PathBuf) -> Result<Vec<String>> {
    let mut rust_files = Vec::new();

    for entry in walkdir::WalkDir::new(path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let file_path = entry.path();

        // Skip target directory and hidden directories
        if file_path
            .components()
            .any(|c| c.as_os_str() == "target" || c.as_os_str().to_string_lossy().starts_with('.'))
        {
            continue;
        }

        if file_path.is_file() && file_path.extension().map_or(false, |e| e == "rs") {
            // Store relative path from the project root
            if let Ok(relative) = file_path.strip_prefix(path) {
                rust_files.push(relative.to_string_lossy().to_string());
            }
        }
    }

    Ok(rust_files)
}

/// Run AI analysis on the code (requires OPENAI_API_KEY)
async fn run_ai_analysis(
    path: &PathBuf,
    rust_files: &[String],
    verbose: bool,
) -> Result<serde_json::Value> {
    use amm_analyzer::ai_analysis::AiAnalysisService;

    // Check if API key is set
    if std::env::var("OPENAI_API_KEY").is_err() {
        return Err(anyhow::anyhow!("OPENAI_API_KEY not set"));
    }

    if verbose {
        println!("Running AI analysis...");
    }

    let service = AiAnalysisService::new()
        .map_err(|e| anyhow::anyhow!("Failed to create AI service: {}", e))?;

    // Create a minimal rust_analysis_results for context
    let rust_analysis_results = serde_json::json!({
        "files_count": rust_files.len(),
    });

    let results = service
        .analyze_factors(path, &rust_analysis_results, Some(rust_files))
        .await
        .map_err(|e| anyhow::anyhow!("AI analysis failed: {}", e))?;

    // Convert to JSON value
    Ok(serde_json::to_value(results)?)
}

fn queue_and_show_offline_receipt(
    result: &serde_json::Value,
    project_name: &str,
    files_count: usize,
    lines_of_code: u64,
    output_format: OutputFormat,
) -> Result<()> {
    // Queue for later
    let mut config = CliConfig::load()?;
    config.queue_analysis(project_name, result.clone())?;

    match output_format {
        OutputFormat::Json => {
            println!("{}", serde_json::to_string_pretty(result)?);
        }
        OutputFormat::Minimal => {
            if let Some(scores) = result.get("calculated_scores") {
                println!("{}", scores);
            }
        }
        OutputFormat::Text => {
            let receipt = build_local_receipt(result, project_name, files_count, lines_of_code);
            cli_display::print_offline_receipt(&receipt);
        }
    }

    Ok(())
}

fn build_local_receipt(
    result: &serde_json::Value,
    project_name: &str,
    files_count: usize,
    lines_of_code: u64,
) -> cli_display::AnalysisReceipt {
    // Try server format first (calculated_scores), then compute from local analysis
    let scores = result.get("calculated_scores");

    let (structural, security, systemic, economic, total) = if let Some(s) = scores {
        (
            s.get("structural").and_then(|v| v.as_f64()).unwrap_or(0.0),
            s.get("security").and_then(|v| v.as_f64()).unwrap_or(0.0),
            s.get("systemic").and_then(|v| v.as_f64()).unwrap_or(0.0),
            s.get("economic").and_then(|v| v.as_f64()).unwrap_or(0.0),
            s.get("total").and_then(|v| v.as_f64()).unwrap_or(0.0),
        )
    } else {
        // Try to compute basic scores from local analysis repository metrics
        let repo = result.get("repository");
        let aggregated = repo.and_then(|r| r.get("aggregated"));

        // Compute a basic structural score from cyclomatic complexity
        let avg_complexity = aggregated
            .and_then(|a| a.get("avg_cyclomatic_complexity"))
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);

        // Simple scoring: higher complexity = higher score (capped at 100)
        let structural = (avg_complexity * 5.0).min(100.0);

        // Compute basic security score from safety ratio (inverted - lower safety = higher risk)
        let safety_ratio = aggregated
            .and_then(|a| a.get("safety_ratio"))
            .and_then(|v| v.as_f64())
            .unwrap_or(1.0);
        let security = ((1.0 - safety_ratio) * 100.0).max(0.0);

        // Basic systemic and economic scores based on code size
        let loc = lines_of_code as f64;
        let systemic = (loc / 100.0).min(100.0); // Simple heuristic
        let economic = (loc / 200.0).min(100.0); // Simple heuristic

        let total = (structural + security + systemic + economic) / 4.0;

        (structural, security, systemic, economic, total)
    };

    cli_display::AnalysisReceipt {
        project_name: project_name.to_string(),
        files_count,
        lines_of_code,
        complexity_score: total,
        scores: cli_display::Scores {
            structural,
            security,
            systemic,
            economic,
            total,
        },
        audit_effort: cli_display::AuditEffort {
            lower: cli_display::AuditEstimate {
                min_days: 7,
                max_days: 14,
                resources: 2,
                min_cost: 5000,
                max_cost: 12000,
            },
            upper: cli_display::AuditEstimate {
                min_days: 14,
                max_days: 28,
                resources: 3,
                min_cost: 12000,
                max_cost: 24000,
            },
        },
        hotspots: cli_display::Hotspots {
            total: 0,
            high_risk: 0,
            medium_risk: 0,
            low_priority: 0,
        },
        report_id: None,
        report_url: None,
        receipt_id: None,
        commit_url: None,
        transaction_signature: None,
        encrypted_by_arcium: false,
    }
}

fn detect_framework(path: &PathBuf) -> String {
    let cargo_toml = path.join("Cargo.toml");
    if cargo_toml.exists() {
        if let Ok(content) = std::fs::read_to_string(&cargo_toml) {
            if content.contains("anchor-lang") {
                return "anchor".to_string();
            }
            if content.contains("solana-program") {
                return "native".to_string();
            }
        }
    }

    // Check for Anchor.toml
    if path.join("Anchor.toml").exists() {
        return "anchor".to_string();
    }

    "unknown".to_string()
}

fn handle_config_command(command: ConfigCommands) -> Result<()> {
    match command {
        ConfigCommands::View => {
            let config = CliConfig::load()?;
            config.display();
        }
        ConfigCommands::Get { key } => {
            let config = CliConfig::load()?;
            if let Some(value) = config.get(&key) {
                println!("{}", value);
            } else {
                print_error(&format!("Unknown config key: {}", key));
            }
        }
        ConfigCommands::Set { key, value } => {
            let mut config = CliConfig::load()?;
            config.set(&key, &value)?;
            print_success(&format!("Set {} = {}", key, value));
        }
        ConfigCommands::Reset => {
            let config = CliConfig::default();
            config.save()?;
            print_success("Configuration reset to defaults");
        }
    }
    Ok(())
}
