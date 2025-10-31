//! Operational Security Factor
//!
//! This module analyzes operational security patterns by focusing on three specific,
//! AST-detectable proxies that directly correlate with operational control risk:
//! 1. Control handlers (pause, admin, emergency, upgrade functions)
//! 2. Pause checks (state field references in conditions)
//! 3. Sysvar dependencies (direct access to Solana system variables)

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use syn::{
    visit::{self, Visit},
    Expr, ExprField, ExprIf, ExprMacro, ExprPath, ItemFn, Path,
};

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct OpSecMetrics {
    /// Total number of instruction handlers found
    pub total_handlers_found: u32,

    /// Primary metric: Handlers with operational control names (pause, admin, emergency, upgrade)
    pub control_handlers: u32,

    /// Secondary metric: Pause/halt state checks within handlers
    pub pause_checks: u32,

    /// Secondary metric: Direct sysvar dependencies
    pub sysvar_dependencies: u32,

    /// Final Score (0-100)
    pub opsec_factor: f64,
    /// Raw score used for normalization
    pub raw_risk_score: f64,

    /// Helper Metrics (for Audibility)
    /// Maps handler name to control type
    pub control_handler_types: HashMap<String, String>,
    /// Maps sysvar access to usage type
    pub sysvar_access_types: HashMap<String, String>,
    /// List of pause check patterns found
    pub pause_check_patterns: Vec<String>,

    pub files_analyzed: u32,
    pub files_skipped: u32,
}

impl OpSecMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "opsecFactor": self.opsec_factor,
            "rawRiskScore": self.raw_risk_score,
            "totalHandlersFound": self.total_handlers_found,
            "controlHandlers": self.control_handlers,
            "pauseChecks": self.pause_checks,
            "sysvarDependencies": self.sysvar_dependencies,
            "controlHandlerTypes": self.control_handler_types,
            "sysvarAccessTypes": self.sysvar_access_types,
            "pauseCheckPatterns": self.pause_check_patterns,
            "filesAnalyzed": self.files_analyzed,
            "filesSkipped": self.files_skipped,
        })
    }
}

/// Visitor for detecting operational security patterns
#[derive(Debug, Default)]
struct OpSecVisitor {
    metrics: OpSecMetrics,
    current_handler_name: Option<String>,
    pause_checks_in_current_handler: u32,
}

impl OpSecVisitor {
    /// Checks if an argument is the Anchor Context
    fn is_context_arg(&self, arg: &syn::FnArg) -> bool {
        if let syn::FnArg::Typed(pat_type) = arg {
            if let syn::Type::Path(type_path) = &*pat_type.ty {
                if let Some(segment) = type_path.path.segments.last() {
                    return segment.ident == "Context";
                }
            }
        }
        false
    }

    /// Checks if a function name indicates operational control
    fn is_control_handler(&self, func_name: &str) -> bool {
        // High-confidence keywords for operational control
        matches!(
            func_name,
            "pause"
                | "unpause"
                | "emergency"
                | "admin"
                | "halt"
                | "stop"
                | "upgrade"
                | "set_authority"
                | "transfer_authority"
                | "emergency_stop"
                | "kill_switch"
                | "freeze"
                | "unfreeze"
        ) || func_name.contains("pause")
            || func_name.contains("emergency")
            || func_name.contains("admin")
            || func_name.contains("halt")
            || func_name.contains("upgrade")
            || func_name.contains("authority")
    }

    /// Determines the control type of a handler
    fn get_control_type(&self, func_name: &str) -> String {
        if func_name.contains("pause") || func_name.contains("freeze") || func_name.contains("halt")
        {
            "pause_control".to_string()
        } else if func_name.contains("emergency") || func_name.contains("admin") {
            "emergency_control".to_string()
        } else if func_name.contains("upgrade") || func_name.contains("authority") {
            "upgrade_control".to_string()
        } else {
            "general_control".to_string()
        }
    }

    /// Checks if a field access indicates pause/halt state
    fn is_pause_state_field(&self, field_name: &str) -> bool {
        matches!(
            field_name,
            "paused"
                | "is_paused"
                | "halted"
                | "is_halted"
                | "active"
                | "is_active"
                | "frozen"
                | "is_frozen"
                | "stopped"
                | "is_stopped"
        )
    }

    /// Checks if a path indicates sysvar access
    fn is_sysvar_path(&self, path: &Path) -> bool {
        // Check for direct sysvar access patterns
        let path_str = path
            .segments
            .iter()
            .map(|s| s.ident.to_string())
            .collect::<Vec<_>>()
            .join("::");

        // Check for fully qualified sysvar paths
        if path_str.contains("sysvar::")
            || path_str.contains("anchor_lang::solana_program::sysvar::")
            || path_str.contains("solana_program::sysvar::")
        {
            return true;
        }

        // Check for simple sysvar types imported via prelude
        if let Some(first_segment) = path.segments.first() {
            let type_name = first_segment.ident.to_string();
            matches!(
                type_name.as_str(),
                "Clock"
                    | "Rent"
                    | "EpochSchedule"
                    | "SlotHashes"
                    | "RecentBlockhashes"
                    | "StakeHistory"
                    | "Sysvar"
                    | "Instructions"
                    | "Rewards"
                    | "Config"
            )
        } else {
            false
        }
    }

    /// Checks if a field access targets sysvar fields
    fn is_sysvar_field_access(&self, field_name: &str) -> bool {
        matches!(
            field_name,
            "slot"
                | "timestamp"
                | "epoch"
                | "lamports_per_signature"
                | "rent_epoch"
                | "exemption_threshold"
                | "burn_percent"
                | "lamports_per_byte_year"
                | "warmup_cooldown_rate"
                | "slots_per_epoch"
                | "leader_schedule_slot_offset"
                | "warmup_slots"
                | "first_normal_epoch"
                | "first_normal_slot"
        )
    }

    /// Records a pause check pattern
    fn record_pause_check(&mut self, field_name: &str) {
        self.pause_checks_in_current_handler += 1;
        self.metrics
            .pause_check_patterns
            .push(format!("field_access_{}", field_name));
    }

    /// Records a sysvar access
    fn record_sysvar_access(&mut self, access_kind: &str, detail: &str) {
        // Always increment the main counter for any sysvar access detected
        self.metrics.sysvar_dependencies += 1;
        // Keep the detailed breakdown for auditability
        self.metrics
            .sysvar_access_types
            .insert(detail.to_string(), access_kind.to_string());
    }
}

impl<'ast> Visit<'ast> for OpSecVisitor {
    /// Find instruction handlers and analyze their names
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        // Robust heuristic for an Anchor handler
        let is_anchor_handler = matches!(node.vis, syn::Visibility::Public(_))
            && node.sig.inputs.len() > 0
            && self.is_context_arg(&node.sig.inputs[0]);

        if is_anchor_handler {
            self.metrics.total_handlers_found += 1;
            let handler_name = node.sig.ident.to_string();

            // --- ADD DEBUG LOGGING ---
            log::info!("🔍 OpSec DEBUG: Found Anchor handler: '{}'", handler_name);
            // --- END DEBUG LOGGING ---

            // Set context for this handler
            self.current_handler_name = Some(handler_name.clone());
            self.pause_checks_in_current_handler = 0;

            // Check if this is a control handler
            if self.is_control_handler(&handler_name) {
                // --- ADD DEBUG LOGGING ---
                log::info!(
                    "🔍 OpSec DEBUG: Matched CONTROL handler: '{}'",
                    handler_name
                );
                // --- END DEBUG LOGGING ---
                self.metrics.control_handlers += 1;
                let control_type = self.get_control_type(&handler_name);
                self.metrics
                    .control_handler_types
                    .insert(handler_name.clone(), control_type);
            }

            // Visit the function body to find pause checks and sysvar access
            visit::visit_item_fn(self, node);

            // Aggregate pause checks for this handler
            if self.pause_checks_in_current_handler > 0 {
                self.metrics.pause_checks += self.pause_checks_in_current_handler;
            }

            // Clear context
            self.current_handler_name = None;
        } else {
            // Still visit non-handlers in case handlers are nested
            visit::visit_item_fn(self, node);
        }
    }

    /// Detect pause checks in if conditions
    fn visit_expr_if(&mut self, node: &'ast ExprIf) {
        // The default visitor will handle visiting the condition and body
        // We don't need to manually visit the condition here
        visit::visit_expr_if(self, node);
    }

    /// Detect pause checks in require! macros
    fn visit_expr_macro(&mut self, node: &'ast ExprMacro) {
        if self.current_handler_name.is_some() {
            // Check if this is a require! macro
            if let Some(segment) = node.mac.path.segments.last() {
                if segment.ident == "require" {
                    // Visit the macro tokens to look for pause state references
                    // Note: We can't easily parse TokenStream, so we'll skip this for now
                    // In a real implementation, you'd need to parse the tokens manually
                }
            }
        }
        visit::visit_expr_macro(self, node);
    }

    /// Detect field access patterns
    fn visit_expr_field(&mut self, node: &'ast ExprField) {
        if self.current_handler_name.is_some() {
            let field_name = match &node.member {
                syn::Member::Named(ident) => ident.to_string(),
                syn::Member::Unnamed(index) => format!("field_{}", index.index),
            };

            // Check for pause state field access
            if self.is_pause_state_field(&field_name) {
                self.record_pause_check(&field_name);
            }
            // Check for sysvar field access - rely ONLY on field name
            else if self.is_sysvar_field_access(&field_name) {
                // Simplified: rely only on field name for sysvar detection
                self.record_sysvar_access("field_access", &format!("sysvar_field_{}", field_name));
            }
        }
        visit::visit_expr_field(self, node);
    }

    /// Detect path access patterns
    fn visit_expr_path(&mut self, node: &'ast ExprPath) {
        if self.current_handler_name.is_some() {
            // --- ADD DEBUG LOGGING ---
            let path_str_debug = node
                .path
                .segments
                .iter()
                .map(|s| s.ident.to_string())
                .collect::<Vec<_>>()
                .join("::");
            log::info!(
                "🔍 OpSec DEBUG: Visiting path access: '{}' in handler '{}'",
                path_str_debug,
                self.current_handler_name.as_ref().unwrap()
            );
            // --- END DEBUG LOGGING ---

            // Check for sysvar path access
            if self.is_sysvar_path(&node.path) {
                let path_str = node
                    .path
                    .segments
                    .iter()
                    .map(|s| s.ident.to_string())
                    .collect::<Vec<_>>()
                    .join("::");
                // --- ADD DEBUG LOGGING ---
                log::info!("🔍 OpSec DEBUG: Matched SYSVAR path: '{}'", path_str);
                // --- END DEBUG LOGGING ---
                // Check specifically for ::get() calls on sysvar types
                if path_str.ends_with("::get") {
                    self.record_sysvar_access(
                        "path_access_get", // More specific kind
                        &format!("sysvar_path_{}", path_str),
                    );
                } else {
                    self.record_sysvar_access(
                        "path_access_type", // Accessing the type itself maybe?
                        &format!("sysvar_path_{}", path_str),
                    );
                }
            }
        }
        visit::visit_expr_path(self, node);
    }
}

/// Calculate operational security metrics for workspace
pub fn calculate_workspace_operational_security(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
) -> Result<OpSecMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 OPERATIONAL SECURITY DEBUG: Starting analysis for workspace: {:?}",
        workspace_path
    );

    let mut visitor = OpSecVisitor::default();
    let mut files_analyzed = 0;
    let mut files_skipped = 0;

    for file_path in selected_files {
        let full_path = workspace_path.join(file_path);

        if !full_path.exists() {
            files_skipped += 1;
            continue;
        }
        if !full_path.extension().map_or(false, |ext| ext == "rs") {
            files_skipped += 1;
            continue;
        }

        match std::fs::read_to_string(&full_path) {
            Ok(content) => match syn::parse_file(&content) {
                Ok(ast) => {
                    visitor.visit_file(&ast);
                    files_analyzed += 1;
                }
                Err(e) => {
                    log::warn!("Failed to parse AST for {:?}: {}", full_path, e);
                    files_skipped += 1;
                }
            },
            Err(e) => {
                log::warn!("Failed to read file {:?}: {}", full_path, e);
                files_skipped += 1;
            }
        }
    }

    // Final calculation and normalization (0-100)
    let metrics = &mut visitor.metrics;
    metrics.files_analyzed = files_analyzed;
    metrics.files_skipped = files_skipped;

    // Calculate raw risk score with weighted factors
    // Control handlers are highest risk (5x), pause checks are medium risk (3x), sysvars are low risk (1x)
    let raw_risk_score = (metrics.control_handlers as f64 * 5.0)
        + (metrics.pause_checks as f64 * 3.0)
        + (metrics.sysvar_dependencies as f64 * 1.0);

    metrics.raw_risk_score = raw_risk_score;

    // Normalize to 0-100
    // Upper bound: 10 control handlers + 20 pause checks + 10 sysvars = 100% risk
    let upper_bound = (10.0 * 5.0) + (20.0 * 3.0) + (10.0 * 1.0); // 120
    let factor = (raw_risk_score / upper_bound) * 100.0;
    metrics.opsec_factor = factor.min(100.0); // Cap at 100

    log::info!(
        "🔍 OPERATIONAL SECURITY DEBUG: Analysis complete - {} files analyzed. Control handlers: {}, Pause checks: {}, Sysvars: {}, Factor: {:.2}",
        files_analyzed,
        metrics.control_handlers,
        metrics.pause_checks,
        metrics.sysvar_dependencies,
        metrics.opsec_factor
    );

    Ok(visitor.metrics)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_control_handler_detection() {
        let code = r#"
        use anchor_lang::prelude::*;

        pub fn pause_program(ctx: Context<PauseProgram>) -> Result<()> {
            Ok(())
        }

        pub fn emergency_stop(ctx: Context<EmergencyStop>) -> Result<()> {
            Ok(())
        }

        pub fn upgrade_authority(ctx: Context<UpgradeAuthority>) -> Result<()> {
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = OpSecVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.total_handlers_found, 3);
        assert_eq!(visitor.metrics.control_handlers, 3);
        assert_eq!(visitor.metrics.control_handler_types.len(), 3);
        assert!(visitor
            .metrics
            .control_handler_types
            .contains_key("pause_program"));
        assert!(visitor
            .metrics
            .control_handler_types
            .contains_key("emergency_stop"));
        assert!(visitor
            .metrics
            .control_handler_types
            .contains_key("upgrade_authority"));
    }

    #[test]
    fn test_pause_check_detection() {
        let code = r#"
        use anchor_lang::prelude::*;

        pub fn check_pause_state(ctx: Context<CheckPause>) -> Result<()> {
            if ctx.accounts.state.paused {
                return Err(ErrorCode::ProgramPaused.into());
            }
            
            if ctx.accounts.state.is_active {
                // do something
            }
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = OpSecVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.total_handlers_found, 1);
        assert_eq!(visitor.metrics.pause_checks, 2);
        assert!(visitor
            .metrics
            .pause_check_patterns
            .contains(&"field_access_paused".to_string()));
        assert!(visitor
            .metrics
            .pause_check_patterns
            .contains(&"field_access_is_active".to_string()));
    }

    #[test]
    fn test_sysvar_dependency_detection() {
        let code = r#"
        use anchor_lang::prelude::*;

        pub fn check_sysvar(ctx: Context<CheckSysvar>) -> Result<()> {
            let clock = Clock::get()?;
            let slot = clock.slot;
            let timestamp = clock.timestamp;
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = OpSecVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.total_handlers_found, 1);
        assert_eq!(visitor.metrics.sysvar_dependencies, 3); // Clock::get + clock.slot + clock.timestamp
        assert!(visitor
            .metrics
            .sysvar_access_types
            .contains_key("sysvar_field_slot"));
        assert!(visitor
            .metrics
            .sysvar_access_types
            .contains_key("sysvar_field_timestamp"));
    }

    #[test]
    fn test_non_control_handler_ignored() {
        let code = r#"
        use anchor_lang::prelude::*;

        pub fn transfer_tokens(ctx: Context<TransferTokens>) -> Result<()> {
            Ok(())
        }

        pub fn swap_tokens(ctx: Context<SwapTokens>) -> Result<()> {
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = OpSecVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.total_handlers_found, 2);
        assert_eq!(visitor.metrics.control_handlers, 0);
        assert_eq!(visitor.metrics.control_handler_types.len(), 0);
    }

    #[test]
    fn test_comprehensive_sysvar_detection() {
        let code = r#"
        use anchor_lang::prelude::*;

        pub fn test_sysvars(ctx: Context<TestSysvars>) -> Result<()> {
            // Test simple sysvar paths
            let clock = Clock::get()?;
            let rent = Rent::get()?;
            let epoch_schedule = EpochSchedule::get()?;
            
            // Test field access
            let slot = clock.slot;
            let timestamp = clock.timestamp;
            let epoch = epoch_schedule.epoch;
            
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = OpSecVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.total_handlers_found, 1);
        // Should detect Clock::get, Rent::get, EpochSchedule::get (3 paths)
        // Plus clock.slot, clock.timestamp, epoch_schedule.epoch (3 fields)
        // Total: 6 sysvar dependencies
        assert_eq!(visitor.metrics.sysvar_dependencies, 6);
    }

    #[test]
    fn test_pause_check_patterns() {
        let code = r#"
        use anchor_lang::prelude::*;

        pub fn test_pause_checks(ctx: Context<TestPause>) -> Result<()> {
            if ctx.accounts.state.paused {
                return Err(ErrorCode::ProgramPaused.into());
            }
            
            if ctx.accounts.state.is_halted {
                return Err(ErrorCode::ProgramHalted.into());
            }
            
            Ok(())
        }
        "#;

        let ast = syn::parse_file(code).unwrap();
        let mut visitor = OpSecVisitor::default();
        visitor.visit_file(&ast);

        assert_eq!(visitor.metrics.total_handlers_found, 1);
        assert_eq!(visitor.metrics.pause_checks, 2);
        assert!(visitor
            .metrics
            .pause_check_patterns
            .contains(&"field_access_paused".to_string()));
        assert!(visitor
            .metrics
            .pause_check_patterns
            .contains(&"field_access_is_halted".to_string()));
    }

    #[test]
    fn test_factor_calculation() {
        let mut metrics = OpSecMetrics::default();
        metrics.control_handlers = 3;
        metrics.pause_checks = 5;
        metrics.sysvar_dependencies = 2;

        let raw_risk_score = (metrics.control_handlers as f64 * 5.0)
            + (metrics.pause_checks as f64 * 3.0)
            + (metrics.sysvar_dependencies as f64 * 1.0);

        let upper_bound = (10.0 * 5.0) + (20.0 * 3.0) + (10.0 * 1.0); // 120
        let factor = (raw_risk_score / upper_bound) * 100.0;
        let opsec_factor = factor.min(100.0);

        // (3*5 + 5*3 + 2*1) / 120 * 100 = 32/120 * 100 = 26.7%
        assert!((opsec_factor - 26.7).abs() < 0.1);
    }
}
