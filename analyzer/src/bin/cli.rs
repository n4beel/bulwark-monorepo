//! Command-line interface for the AMM analyzer

use amm_analyzer::{analyze_repository, AnalyzerConfig};
use anyhow::Result;
use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "amm-analyzer")]
#[command(about = "Semantic static analysis for Solana/Anchor smart contracts")]
#[command(version = "0.1.0")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Analyze a repository or directory
    Analyze {
        /// Path to the repository or directory to analyze
        #[arg(short, long, default_value = ".")]
        path: PathBuf,

        /// Output format (json, yaml, toml)
        #[arg(short, long, default_value = "json")]
        format: String,

        /// Pretty print output
        #[arg(long, default_value_t = true)]
        pretty: bool,

        /// Include test files in analysis
        #[arg(long)]
        include_tests: bool,

        /// Include benchmark files
        #[arg(long)]
        include_benches: bool,

        /// Include example files
        #[arg(long)]
        include_examples: bool,

        /// Expand macros before analysis (slower but more accurate)
        #[arg(long)]
        expand_macros: bool,

        /// Maximum file size to analyze in bytes
        #[arg(long, default_value = "1048576")] // 1MB
        max_file_size: usize,

        /// Output file (if not specified, outputs to stdout)
        #[arg(short, long)]
        output: Option<PathBuf>,

        /// Enable verbose logging
        #[arg(short, long)]
        verbose: bool,
    },

    /// Analyze a single file
    File {
        /// Path to the Rust file to analyze
        path: PathBuf,

        /// Output format (json, yaml, toml)
        #[arg(short, long, default_value = "json")]
        format: String,

        /// Pretty print output
        #[arg(long, default_value_t = true)]
        pretty: bool,

        /// Enable verbose logging
        #[arg(short, long)]
        verbose: bool,
    },

    /// Validate configuration file
    Config {
        /// Path to configuration file
        config: PathBuf,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Analyze {
            path,
            format,
            pretty,
            include_tests,
            include_benches,
            include_examples,
            expand_macros,
            max_file_size,
            output,
            verbose,
        } => {
            if verbose {
                env_logger::Builder::from_env(
                    env_logger::Env::default().default_filter_or("debug"),
                )
                .init();
            } else {
                env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
                    .init();
            }

            let config = AnalyzerConfig {
                root_path: path,
                include_tests,
                include_benches,
                include_examples,
                expand_macros,
                max_file_size,
                output: amm_analyzer::config::OutputConfig {
                    format,
                    pretty,
                    include_snippets: false,
                    include_function_details: true,
                },
                ..Default::default()
            };

            log::info!("Starting analysis of repository: {:?}", config.root_path);

            let report = analyze_repository(config)?;

            let output_content = if pretty {
                serde_json::to_string_pretty(&report)?
            } else {
                serde_json::to_string(&report)?
            };

            match output {
                Some(output_path) => {
                    std::fs::write(output_path, output_content)?;
                    log::info!("Analysis complete. Results written to file.");
                }
                None => {
                    println!("{}", output_content);
                }
            }
        }

        Commands::File {
            path,
            format,
            pretty,
            verbose,
        } => {
            if verbose {
                env_logger::Builder::from_env(
                    env_logger::Env::default().default_filter_or("debug"),
                )
                .init();
            } else {
                env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("warn"))
                    .init();
            }

            log::info!("Analyzing single file: {:?}", path);

            let metrics = amm_analyzer::analyze_file(&path)?;

            let output_content = if pretty {
                serde_json::to_string_pretty(&metrics)?
            } else {
                serde_json::to_string(&metrics)?
            };

            println!("{}", output_content);
        }

        Commands::Config { config } => {
            log::info!("Validating configuration file: {:?}", config);

            let content = std::fs::read_to_string(&config)?;
            let _config: AnalyzerConfig = toml::from_str(&content)?;

            println!("Configuration file is valid!");
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use clap::CommandFactory;

    #[test]
    fn verify_cli() {
        Cli::command().debug_assert()
    }
}
