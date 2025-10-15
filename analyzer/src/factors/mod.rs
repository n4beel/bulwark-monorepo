//! Analysis factors module
//!
//! This module contains individual analysis factor implementations
//! that can be used across the analyzer.

pub mod access_control;
pub mod arithmetic;
pub mod asset_types;
pub mod complexity;
pub mod composability;
pub mod cpi_calls;
pub mod dependencies;
pub mod dos_resource_limits;
pub mod error_handling;
pub mod external_integration;
pub mod function_count;
pub mod input_constraints;
pub mod invariants_risk_params;
pub mod lines_of_code;
pub mod modularity;
pub mod operational_security;
pub mod oracle_price_feed;
pub mod pda_seeds;
pub mod privileged_roles;
pub mod statefulness;
pub mod unsafe_lowlevel;
pub mod upgradeability;

pub use access_control::{calculate_workspace_access_control, AccessControlMetrics};
pub use arithmetic::{calculate_workspace_arithmetic, ArithmeticMetrics};
pub use asset_types::{calculate_workspace_asset_types, AssetTypesMetrics};
pub use complexity::{calculate_workspace_cyclomatic_complexity, ComplexityMetrics};
pub use composability::{calculate_workspace_composability, ComposabilityMetrics};
pub use cpi_calls::{calculate_workspace_cpi_calls, CpiMetrics};
pub use dependencies::{calculate_workspace_dependencies, DependencyMetrics};
pub use dos_resource_limits::{calculate_workspace_dos_resource_limits, DosResourceLimitsMetrics};
pub use error_handling::{calculate_workspace_error_handling, ErrorHandlingMetrics};
pub use external_integration::{
    calculate_workspace_external_integration, ExternalIntegrationMetrics,
};
pub use function_count::{count_functions, count_total_functions, FunctionCountMetrics};
pub use input_constraints::{calculate_workspace_input_constraints, InputConstraintMetrics};
pub use invariants_risk_params::{
    calculate_workspace_invariants_risk_params, InvariantsRiskParamsMetrics,
};
pub use lines_of_code::count_lines_of_code;
pub use modularity::{calculate_workspace_modularity, ModularityMetrics};
pub use operational_security::{
    calculate_workspace_operational_security, OperationalSecurityMetrics,
};
pub use oracle_price_feed::{calculate_workspace_oracle_price_feed, OraclePriceFeedMetrics};
pub use pda_seeds::{calculate_workspace_pda_seeds, PdaMetrics};
pub use privileged_roles::{calculate_workspace_privileged_roles, PrivilegedRolesMetrics};
pub use statefulness::{calculate_workspace_statefulness, StatefulnessMetrics};
pub use unsafe_lowlevel::{calculate_workspace_unsafe_lowlevel, UnsafeLowLevelMetrics};
pub use upgradeability::{calculate_workspace_upgradeability, UpgradeabilityMetrics};
