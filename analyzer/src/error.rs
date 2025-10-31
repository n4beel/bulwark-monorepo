//! Error types for the AMM analyzer

use std::path::PathBuf;
use thiserror::Error;

pub type Result<T> = std::result::Result<T, AnalyzerError>;

#[derive(Error, Debug)]
pub enum AnalyzerError {
    #[error("Failed to parse Rust file: {path}")]
    ParseError {
        path: PathBuf,
        #[source]
        source: syn::Error,
    },

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("JSON serialization error: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("Configuration error: {message}")]
    ConfigError { message: String },

    #[error("File not found: {path}")]
    FileNotFound { path: PathBuf },

    #[error("Invalid file extension: {path} (expected .rs)")]
    InvalidFileExtension { path: PathBuf },

    #[error("Analysis failed: {message}")]
    AnalysisError { message: String },

    #[error("Macro expansion failed: {message}")]
    MacroExpansionError { message: String },
}
