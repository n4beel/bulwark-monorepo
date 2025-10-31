//! AMM Analyzer - Semantic Static Analysis for Solana/Anchor Smart Contracts
//!
//! This crate provides high-fidelity static analysis for Rust-based smart contracts,
//! particularly focusing on DeFi/AMM patterns in Solana and Anchor frameworks.

pub mod analysis;
pub mod config;
pub mod error;
pub mod factors;
pub mod metrics;
pub mod output;
pub mod patterns;
pub mod visitor;

pub use analysis::AnalyzerEngine;
pub use config::AnalyzerConfig;
pub use error::{AnalyzerError, Result};
pub use metrics::{FileMetrics, FunctionMetrics, RepoMetrics};
pub use output::{AnalysisReport, JsonOutput};

/// Main entry point for analyzing a repository
pub fn analyze_repository(config: AnalyzerConfig) -> Result<AnalysisReport> {
    let engine = AnalyzerEngine::new(config)?;
    engine.analyze()
}

/// Analyze a single file (useful for testing)
pub fn analyze_file<P: AsRef<std::path::Path>>(path: P) -> Result<FileMetrics> {
    let engine = AnalyzerEngine::from_file(path)?;
    engine.analyze_single_file()
}
