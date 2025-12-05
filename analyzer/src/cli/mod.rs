//! CLI module for the Bulwark static analysis tool
//! 
//! This module contains all the CLI-related functionality including:
//! - Authentication (login, logout, status)
//! - API communication with the backend
//! - Configuration management
//! - Display utilities and formatting

pub mod cli_api;
pub mod cli_auth;
pub mod cli_config;
pub mod cli_display;

// Re-export commonly used items
pub use cli_api::*;
pub use cli_auth::{login, logout, status, is_authenticated, is_whitelisted};
pub use cli_config::{CliConfig, UserConfig, QueuedAnalysis};
pub use cli_display::{
    print_banner, print_info, print_success, print_warning, print_error,
    print_receipt, print_offline_receipt, print_factor_result,
    print_category_results, AnalysisReceipt, Scores, AuditEffort, AuditEstimate, Hotspots, Spinner,
};

