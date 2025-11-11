use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::{CircuitSource, OffChainCircuitSource};

const COMP_DEF_OFFSET_SHARE_COMMIT_HASH: u32 = comp_def_offset("share_commit_hash");

declare_id!("SGn4NkCwTLFZ46HsKzNaPxobdzXFJ7LHNCea68kiL2u");

#[arcium_program]
pub mod bulwark_storage {
    use super::*;

    /// Stores audit results with transparent pricing and encrypted commit hash.
    ///
    /// This function demonstrates Arcium's encryption capabilities by storing:
    /// - PLAINTEXT: report_id, effort estimates, resources, cost range (USD), score
    /// - ENCRYPTED: commit_hash (encrypted client-side using Arcium's RescueCipher)
    ///
    /// The encrypted commit hash is provided as a 32-byte array that was encrypted
    /// by the client using Arcium's x25519 key exchange and RescueCipher.
    ///
    /// # Arguments
    /// * `report_id` - Unique identifier for this audit report
    /// * `min_days` - Minimum days estimate
    /// * `max_days` - Maximum days estimate
    /// * `min_resources` - Minimum auditors needed
    /// * `max_resources` - Maximum auditors needed
    /// * `min_cost_usd` - Minimum cost estimate in USD
    /// * `max_cost_usd` - Maximum cost estimate in USD
    /// * `score` - Audit score (0-100)
    /// * `encrypted_commit_hash` - Commit hash encrypted using Arcium RescueCipher
    pub fn store_audit_results(
        ctx: Context<StoreAuditResults>,
        report_id: u64,
        min_days: u16,
        max_days: u16,
        min_resources: u8,
        max_resources: u8,
        min_cost_usd: u64,
        max_cost_usd: u64,
        score: u8,
        encrypted_commit_hash: [u8; 32],
    ) -> Result<()> {
        let audit_record = &mut ctx.accounts.audit_record;

        // Store plaintext data (visible on Solscan)
        audit_record.report_id = report_id;
        audit_record.min_days = min_days;
        audit_record.max_days = max_days;
        audit_record.min_resources = min_resources;
        audit_record.max_resources = max_resources;
        audit_record.min_cost_usd = min_cost_usd;
        audit_record.max_cost_usd = max_cost_usd;
        audit_record.score = score;

        // Store encrypted commit hash (protected by Arcium encryption)
        audit_record.encrypted_commit_hash = encrypted_commit_hash;

        emit!(AuditStoredEvent {
            report_id,
            min_cost_usd,
            max_cost_usd,
            score,
        });

        Ok(())
    }

    /// Retrieves audit results by report ID.
    /// Data can be read directly from the PDA account.
    pub fn get_audit_by_id(_ctx: Context<GetAuditById>) -> Result<()> {
        // Client can fetch the account directly
        // Plaintext fields are visible, encrypted commit hash requires decryption
        Ok(())
    }

    /// Initializes the computation definition for the `share_commit_hash` circuit.
    pub fn init_share_commit_hash_comp_def(ctx: Context<InitShareCommitHashCompDef>) -> Result<()> {
        // Circuit stored on GitHub (publicly accessible)
        let circuit_url = "https://raw.githubusercontent.com/n4beel/bulwark-monorepo/refs/heads/main/program/build/share_commit_hash.arcis";

        init_comp_def(
            ctx.accounts,
            true,
            0,
            Some(CircuitSource::OffChain(OffChainCircuitSource {
                source: circuit_url.to_string(),
                hash: [0; 32], // Hash verification not enforced yet
            })),
            None,
        )?;
        Ok(())
    }

    /// Shares two encrypted commit-hash bytes with a receiver by invoking
    /// the `share_commit_hash` circuit. This demonstrates how Arcium MPC can
    /// be used to collaborate on encrypted commit hash data.
    pub fn share_commit_hash_chunk(
        ctx: Context<ShareCommitHashChunk>,
        computation_offset: u64,
        encrypted_upper_byte: [u8; 32],
        encrypted_lower_byte: [u8; 32],
        receiver_pub_key: [u8; 32],
        receiver_nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(receiver_pub_key),
            Argument::PlaintextU128(receiver_nonce),
            Argument::EncryptedU8(encrypted_upper_byte),
            Argument::EncryptedU8(encrypted_lower_byte),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![ShareCommitHashCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    #[arcium_callback(encrypted_ix = "share_commit_hash")]
    pub fn share_commit_hash_callback(
        ctx: Context<ShareCommitHashCallback>,
        output: ComputationOutputs<ShareCommitHashOutput>,
    ) -> Result<()> {
        let field = match output {
            ComputationOutputs::Success(ShareCommitHashOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(CommitHashSharedEvent {
            chunk_ciphertext: field.ciphertexts[0],
            nonce: field.nonce.to_le_bytes(),
        });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(report_id: u64)]
pub struct StoreAuditResults<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + AuditRecord::INIT_SPACE,
        seeds = [b"audit_record", report_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub audit_record: Account<'info, AuditRecord>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(report_id: u64)]
pub struct GetAuditById<'info> {
    #[account(
        seeds = [b"audit_record", report_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub audit_record: Account<'info, AuditRecord>,
}

#[queue_computation_accounts("share_commit_hash", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct ShareCommitHashChunk<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(address = derive_mxe_pda!())]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(mut, address = derive_mempool_pda!())]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(mut, address = derive_execpool_pda!())]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(mut, address = derive_comp_pda!(computation_offset))]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_SHARE_COMMIT_HASH))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(mut, address = derive_cluster_pda!(mxe_account))]
    pub cluster_account: Account<'info, Cluster>,
    #[account(mut, address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS)]
    pub pool_account: Account<'info, FeePool>,
    #[account(address = ARCIUM_CLOCK_ACCOUNT_ADDRESS)]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("share_commit_hash")]
#[derive(Accounts)]
pub struct ShareCommitHashCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_SHARE_COMMIT_HASH))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[init_computation_definition_accounts("share_commit_hash", payer)]
#[derive(Accounts)]
pub struct InitShareCommitHashCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, address = derive_mxe_pda!())]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    /// Can't check it here as it's not initialized yet.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

/// Audit record storage account.
///
/// This account stores both plaintext and encrypted data:
/// - Plaintext fields are visible to anyone on Solscan
/// - Encrypted commit hash can only be decrypted with the private key
#[account]
#[derive(InitSpace)]
pub struct AuditRecord {
    // ═══════════════════════════════════════════════════════════
    // PLAINTEXT - Visible on Solscan (Transparent Pricing)
    // ═══════════════════════════════════════════════════════════
    pub report_id: u64,    // Unique report identifier (8 bytes)
    pub min_days: u16,     // Minimum days estimate (2 bytes)
    pub max_days: u16,     // Maximum days estimate (2 bytes)
    pub min_resources: u8, // Minimum auditors needed (1 byte)
    pub max_resources: u8, // Maximum auditors needed (1 byte)
    pub min_cost_usd: u64, // Minimum cost estimate in USD (8 bytes)
    pub max_cost_usd: u64, // Maximum cost estimate in USD (8 bytes)
    pub score: u8,         // Audit score 0-100 (1 byte)

    // ═══════════════════════════════════════════════════════════
    // ENCRYPTED - Private (Protected by Arcium Encryption)
    // ═══════════════════════════════════════════════════════════
    pub encrypted_commit_hash: [u8; 32], // Encrypted commit hash (32 bytes)
                                         // Total: ~73 bytes per audit record
}

#[event]
pub struct AuditStoredEvent {
    pub report_id: u64,
    pub min_cost_usd: u64,
    pub max_cost_usd: u64,
    pub score: u8,
}

#[event]
pub struct CommitHashSharedEvent {
    pub chunk_ciphertext: [u8; 32],
    pub nonce: [u8; 16],
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid report ID")]
    InvalidReportId,
    #[msg("Invalid score (must be 0-100)")]
    InvalidScore,
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
}
