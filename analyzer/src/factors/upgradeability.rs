use serde::{Deserialize, Serialize};
use syn::{visit::Visit, Item, ItemMacro, LitStr};

/// Metrics for upgradeability and governance control patterns
#[derive(Debug, Default, Serialize, Deserialize, Clone)]
pub struct UpgradeabilityMetrics {
    /// Program ID extracted from declare_id! macro
    pub program_id: Option<String>,

    /// Governance status determined from on-chain analysis
    /// Possible values: "no_data", "immutable", "locked", "single_wallet", "governance"
    pub governance_status: String,

    /// Governance complexity factor (0-100)
    /// Based on governance mechanism complexity and attack surface
    pub governance_factor: f64,

    /// Raw complexity score before normalization
    pub raw_governance_score: f64,

    /// Whether on-chain analysis was performed
    pub on_chain_analysis_performed: bool,

    /// Error message if on-chain analysis failed
    pub on_chain_analysis_error: Option<String>,
}

impl UpgradeabilityMetrics {
    /// Convert to structured JSON object
    pub fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "programId": self.program_id,
            "governanceStatus": self.governance_status,
            "governanceFactor": self.governance_factor,
            "rawGovernanceScore": self.raw_governance_score,
            "onChainAnalysisPerformed": self.on_chain_analysis_performed,
            "onChainAnalysisError": self.on_chain_analysis_error,
        })
    }

    /// Calculate governance factor based on status
    /// Returns complexity score based on governance mechanism
    pub fn calculate_governance_factor(status: &str) -> f64 {
        match status {
            "no_data" => 0.0,               // No Program ID found
            "immutable" | "locked" => 50.0, // Simple, fixed state
            "single_wallet" => 75.0,        // Adds single attack vector
            "governance" => 100.0,          // Highest complexity
            _ => 0.0,                       // Unknown status
        }
    }
}

/// Phase 1: Visitor to extract Program ID from declare_id! macro
#[derive(Debug, Default)]
struct ProgramIdVisitor {
    /// The extracted program ID (base58 string)
    pub program_id: Option<String>,
}

impl ProgramIdVisitor {
    // No helper methods needed - we use syn's parse_body directly
}

impl<'ast> Visit<'ast> for ProgramIdVisitor {
    fn visit_item_macro(&mut self, node: &'ast ItemMacro) {
        // 1. Check if it's the declare_id! macro
        if node.mac.path.is_ident("declare_id") {
            // 2. Robustly parse the macro's content as a String Literal using AST-First approach
            if let Ok(lit) = node.mac.parse_body::<LitStr>() {
                // 3. Get the value from the literal
                let program_id = lit.value();
                log::info!("🔍 Found Program ID via declare_id!: {}", program_id);
                self.program_id = Some(program_id);
            } else {
                // Optional: Log if the macro is found but parsing fails
                log::warn!(
                    "Found `declare_id!` macro, but failed to parse its content as a string literal."
                );
            }
        }

        // Continue visiting (in case there are nested macros)
        syn::visit::visit_item_macro(self, node);
    }
}

/// Phase 2: Analyze on-chain governance status via RPC
/// Returns governance status: "immutable", "locked", "single_wallet", or "governance"
fn analyze_on_chain(
    program_id_str: &str,
    rpc_url: &str,
) -> Result<String, Box<dyn std::error::Error>> {
    use solana_client::rpc_client::RpcClient;
    use solana_sdk::pubkey::Pubkey;
    use std::str::FromStr;

    log::info!(
        "🔍 GOVERNANCE: Starting on-chain analysis for program: {}",
        program_id_str
    );

    let program_id =
        Pubkey::from_str(program_id_str).map_err(|e| format!("Invalid Program ID: {}", e))?;

    let client = RpcClient::new(rpc_url.to_string());

    // Step 1: Derive ProgramData PDA
    let (program_data_address, _bump) = Pubkey::find_program_address(
        &[program_id.as_ref()],
        &solana_sdk::bpf_loader_upgradeable::id(),
    );

    log::info!("🔍 GOVERNANCE: ProgramData PDA: {}", program_data_address);

    // Step 2: Fetch ProgramData account
    let program_data_account = client
        .get_account(&program_data_address)
        .map_err(|e| format!("Failed to fetch ProgramData account: {}", e))?;

    // Step 3: Deserialize and check authority
    // The ProgramData account structure (first 45 bytes):
    // - 4 bytes: account type (should be 3 for ProgramData)
    // - 8 bytes: slot
    // - 32 bytes: upgrade_authority (optional Pubkey)
    // - 1 byte: option flag for upgrade_authority

    if program_data_account.data.len() < 45 {
        return Err("ProgramData account is too small".into());
    }

    // Check if upgrade authority exists (byte at index 44)
    let has_authority = program_data_account.data[44] == 1;

    if !has_authority {
        log::info!("🔍 GOVERNANCE: Program is IMMUTABLE (no upgrade authority)");
        return Ok("immutable".to_string());
    }

    // Extract upgrade authority Pubkey (bytes 12-44)
    let authority_bytes: [u8; 32] = program_data_account.data[12..44]
        .try_into()
        .map_err(|_| "Failed to extract authority pubkey")?;
    let authority_pubkey = Pubkey::new_from_array(authority_bytes);

    log::info!("🔍 GOVERNANCE: Upgrade authority: {}", authority_pubkey);

    // Step 4: Fetch authority account to determine type
    match client.get_account(&authority_pubkey) {
        Ok(authority_account) => {
            // Check if authority is owned by System Program (single wallet)
            if authority_account.owner == solana_sdk::system_program::id() {
                log::info!("🔍 GOVERNANCE: Authority is SINGLE_WALLET (owned by System Program)");
                Ok("single_wallet".to_string())
            } else {
                // Owned by another program = governance contract
                log::info!(
                    "🔍 GOVERNANCE: Authority is GOVERNANCE (owned by program: {})",
                    authority_account.owner
                );
                Ok("governance".to_string())
            }
        }
        Err(_) => {
            // Authority account doesn't exist or is empty = locked
            log::info!("🔍 GOVERNANCE: Authority account doesn't exist - program is LOCKED");
            Ok("locked".to_string())
        }
    }
}

/// Calculate upgradeability metrics for workspace
///
/// This performs a 2-phase hybrid analysis:
/// Phase 1: AST analysis to find Program ID from declare_id! macro
/// Phase 2: On-chain RPC analysis to determine governance status
pub fn calculate_workspace_upgradeability(
    workspace_path: &std::path::PathBuf,
    selected_files: &[String],
    rpc_url: Option<&str>,
) -> Result<UpgradeabilityMetrics, Box<dyn std::error::Error>> {
    log::info!(
        "🔍 UPGRADEABILITY: Starting 2-phase governance analysis for workspace: {:?}",
        workspace_path
    );

    let mut metrics = UpgradeabilityMetrics::default();

    // ===== Phase 1: AST Analysis to Find Program ID =====
    log::info!("🔍 UPGRADEABILITY: Phase 1 - Searching for Program ID in all selected files");

    let mut visitor = ProgramIdVisitor::default();

    // Iterate through ALL selected files (no filtering by name)
    for file_path_str in selected_files {
        let file_path = workspace_path.join(file_path_str);

        // Skip non-Rust files
        if !file_path.extension().map_or(false, |ext| ext == "rs") {
            continue;
        }

        if !file_path.exists() {
            log::warn!("🔍 UPGRADEABILITY: File does not exist: {:?}", file_path);
            continue;
        }

        log::debug!("🔍 UPGRADEABILITY: Analyzing file: {:?}", file_path);

        // Parse the file and run the visitor
        match std::fs::read_to_string(&file_path) {
            Ok(content) => {
                if let Ok(syntax_tree) = syn::parse_file(&content) {
                    visitor.visit_file(&syntax_tree);

                    // If we found a Program ID, we can stop searching
                    if visitor.program_id.is_some() {
                        log::info!(
                            "🔍 UPGRADEABILITY: Found declare_id! in file: {:?}",
                            file_path
                        );
                        break;
                    }
                }
            }
            Err(e) => {
                log::warn!(
                    "🔍 UPGRADEABILITY: Failed to read file {:?}: {}",
                    file_path,
                    e
                );
            }
        }
    }

    // Check if we found a Program ID
    if visitor.program_id.is_none() {
        log::warn!("🔍 UPGRADEABILITY: No declare_id! macro found in any selected files");
        metrics.governance_status = "no_data".to_string();
        metrics.governance_factor = UpgradeabilityMetrics::calculate_governance_factor("no_data");
        return Ok(metrics);
    }

    let program_id = visitor.program_id.clone().unwrap();
    metrics.program_id = Some(program_id.clone());
    log::info!(
        "🔍 UPGRADEABILITY: Phase 1 Complete - Found Program ID: {}",
        program_id
    );

    // ===== Phase 2: On-Chain RPC Analysis =====
    if let Some(rpc_endpoint) = rpc_url {
        log::info!("🔍 UPGRADEABILITY: Phase 2 - Analyzing on-chain governance via RPC");

        match analyze_on_chain(&program_id, rpc_endpoint) {
            Ok(status) => {
                log::info!(
                    "🔍 UPGRADEABILITY: On-chain analysis complete - Status: {}",
                    status
                );
                metrics.governance_status = status.clone();
                metrics.governance_factor =
                    UpgradeabilityMetrics::calculate_governance_factor(&status);
                metrics.raw_governance_score = metrics.governance_factor; // Same as factor for this model
                metrics.on_chain_analysis_performed = true;
            }
            Err(e) => {
                log::error!("🔍 UPGRADEABILITY: On-chain analysis failed: {}", e);
                metrics.governance_status = "error".to_string();
                metrics.on_chain_analysis_error = Some(e.to_string());
                metrics.on_chain_analysis_performed = false;
                // Fallback to safe default
                metrics.governance_factor = 0.0;
            }
        }
    } else {
        log::warn!("🔍 UPGRADEABILITY: No RPC URL provided - skipping on-chain analysis");
        metrics.governance_status = "rpc_not_available".to_string();
        metrics.on_chain_analysis_performed = false;
        metrics.governance_factor = 0.0;
    }

    log::info!(
        "🔍 UPGRADEABILITY: Analysis complete - Program ID: {:?}, Status: {}, Factor: {:.1}",
        metrics.program_id,
        metrics.governance_status,
        metrics.governance_factor
    );

    Ok(metrics)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_program_id_extraction() {
        let code = r#"
            use anchor_lang::prelude::*;

            declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

            #[program]
            pub mod my_program {
                use super::*;
                
                pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
                    Ok(())
                }
            }
        "#;

        let syntax_tree = syn::parse_file(code).unwrap();
        let mut visitor = ProgramIdVisitor::default();
        visitor.visit_file(&syntax_tree);

        assert_eq!(
            visitor.program_id,
            Some("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".to_string())
        );
    }

    #[test]
    fn test_no_program_id() {
        let code = r#"
            use anchor_lang::prelude::*;

            pub fn some_function() {}
        "#;

        let syntax_tree = syn::parse_file(code).unwrap();
        let mut visitor = ProgramIdVisitor::default();
        visitor.visit_file(&syntax_tree);

        assert_eq!(visitor.program_id, None);
    }

    #[test]
    fn test_program_id_extraction_with_spaces() {
        // Test robustness with various formatting (spaces, tabs, etc.)
        let code = r#"
            use anchor_lang::prelude::*;

            declare_id!(  "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"  );

            #[program]
            pub mod my_program {
                use super::*;
            }
        "#;

        let syntax_tree = syn::parse_file(code).unwrap();
        let mut visitor = ProgramIdVisitor::default();
        visitor.visit_file(&syntax_tree);

        // Should still correctly extract the ID despite the spaces
        assert_eq!(
            visitor.program_id,
            Some("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".to_string())
        );
    }

    #[test]
    fn test_program_id_extraction_multiline() {
        // Test robustness with multiline formatting
        let code = r#"
            use anchor_lang::prelude::*;

            declare_id!(
                "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
            );

            #[program]
            pub mod my_program {}
        "#;

        let syntax_tree = syn::parse_file(code).unwrap();
        let mut visitor = ProgramIdVisitor::default();
        visitor.visit_file(&syntax_tree);

        // Should handle multiline formatting correctly
        assert_eq!(
            visitor.program_id,
            Some("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".to_string())
        );
    }

    #[test]
    fn test_governance_factor_calculation() {
        // Test all governance statuses
        assert_eq!(
            UpgradeabilityMetrics::calculate_governance_factor("no_data"),
            0.0
        );
        assert_eq!(
            UpgradeabilityMetrics::calculate_governance_factor("immutable"),
            50.0
        );
        assert_eq!(
            UpgradeabilityMetrics::calculate_governance_factor("locked"),
            50.0
        );
        assert_eq!(
            UpgradeabilityMetrics::calculate_governance_factor("single_wallet"),
            75.0
        );
        assert_eq!(
            UpgradeabilityMetrics::calculate_governance_factor("governance"),
            100.0
        );
        assert_eq!(
            UpgradeabilityMetrics::calculate_governance_factor("unknown"),
            0.0
        );
    }

    #[test]
    fn test_no_lib_rs() {
        let temp_dir = std::env::temp_dir();
        let workspace_dir = temp_dir.join("test_no_lib_rs");
        std::fs::create_dir_all(&workspace_dir).unwrap();

        let result =
            calculate_workspace_upgradeability(&workspace_dir, &["src/main.rs".to_string()], None)
                .unwrap();

        assert_eq!(result.governance_status, "no_data");
        assert_eq!(result.governance_factor, 0.0);
        assert_eq!(result.program_id, None);
    }

    #[test]
    fn test_lib_rs_without_declare_id() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("test_no_declare_id.rs");

        let code = r#"
            pub fn some_function() {}
        "#;
        std::fs::write(&test_file, code).unwrap();

        let result = calculate_workspace_upgradeability(
            &temp_dir,
            &["test_no_declare_id.rs".to_string()],
            None,
        )
        .unwrap();

        // Even though file exists, it's not lib.rs
        assert_eq!(result.governance_status, "no_data");
        assert_eq!(result.governance_factor, 0.0);
    }

    #[test]
    fn test_workspace_with_lib_rs_and_declare_id() {
        let temp_dir = std::env::temp_dir();
        let lib_rs = temp_dir.join("lib.rs");

        let code = r#"
            use anchor_lang::prelude::*;

            declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

            #[program]
            pub mod my_program {
                use super::*;
                
                pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
                    Ok(())
                }
            }
        "#;
        std::fs::write(&lib_rs, code).unwrap();

        let result = calculate_workspace_upgradeability(
            &temp_dir,
            &["lib.rs".to_string()],
            None, // No RPC URL
        )
        .unwrap();

        // Should find Program ID but not perform on-chain analysis
        assert_eq!(
            result.program_id,
            Some("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS".to_string())
        );
        assert_eq!(result.governance_status, "rpc_not_available");
        assert_eq!(result.on_chain_analysis_performed, false);
        assert_eq!(result.governance_factor, 0.0);
    }
}
