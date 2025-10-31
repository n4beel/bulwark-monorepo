use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

// Constants for our audit storage instructions
const COMP_DEF_OFFSET_STORE_AUDIT_RESULTS: u32 = comp_def_offset("store_audit_results");
const COMP_DEF_OFFSET_RETRIEVE_BY_COMMIT: u32 = comp_def_offset("retrieve_by_commit");

declare_id!("25kmZvexST8MZ1pbUbHECzapos78v2SMmySnxsSYr3vE");

#[arcium_program]
pub mod bulwark_storage {
    use super::*;

    // Initialize computation definitions for our instructions
    pub fn init_audit_storage_comp_defs(ctx: Context<InitAuditStorageCompDefs>) -> Result<()> {
        init_comp_def(ctx.accounts, true, 0, None, None)?;
        Ok(())
    }

    // Store audit results
    pub fn store_audit_results(
        ctx: Context<StoreAuditResults>,
        computation_offset: u64,
        audit_data: [u8; 32], // Encrypted audit results
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::EncryptedU8(audit_data),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![StoreAuditResultsCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    // Retrieve audit results by commit hash
    pub fn retrieve_by_commit(
        ctx: Context<RetrieveByCommit>,
        computation_offset: u64,
        commit_hash: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;
        let args = vec![
            Argument::ArcisPubkey(pub_key),
            Argument::PlaintextU128(nonce),
            Argument::PlaintextU8(commit_hash[0]),
        ];

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![RetrieveByCommitCallback::callback_ix(&[])],
        )?;

        Ok(())
    }

    // Callbacks for each operation
    #[arcium_callback(encrypted_ix = "store_audit_results")]
    pub fn store_audit_results_callback(
        ctx: Context<StoreAuditResultsCallback>,
        output: ComputationOutputs<StoreAuditResultsOutput>,
    ) -> Result<()> {
        let _o = match output {
            ComputationOutputs::Success(StoreAuditResultsOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(AuditStoredEvent {
            success: true,
            id: 0,
            message: [0u8; 64],
        });
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "retrieve_by_commit")]
    pub fn retrieve_by_commit_callback(
        ctx: Context<RetrieveByCommitCallback>,
        output: ComputationOutputs<RetrieveByCommitOutput>,
    ) -> Result<()> {
        let _o = match output {
            ComputationOutputs::Success(RetrieveByCommitOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(AuditRetrievedEvent {
            id: 0,
            commit_hash: [0u8; 32],
            timestamp: 0,
        });
        Ok(())
    }
}

// Account structures for each operation
#[queue_computation_accounts("store_audit_results", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct StoreAuditResults<'info> {
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
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_STORE_AUDIT_RESULTS))]
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

#[queue_computation_accounts("retrieve_by_commit", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct RetrieveByCommit<'info> {
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
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_RETRIEVE_BY_COMMIT))]
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

// Callback account structures
#[callback_accounts("store_audit_results")]
#[derive(Accounts)]
pub struct StoreAuditResultsCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_STORE_AUDIT_RESULTS))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[callback_accounts("retrieve_by_commit")]
#[derive(Accounts)]
pub struct RetrieveByCommitCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(address = derive_comp_def_pda!(COMP_DEF_OFFSET_RETRIEVE_BY_COMMIT))]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

// Initialization account structure
#[init_computation_definition_accounts("store_audit_results", payer)]
#[derive(Accounts)]
pub struct InitAuditStorageCompDefs<'info> {
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

// Events
#[event]
pub struct AuditStoredEvent {
    pub success: bool,
    pub id: u64,
    pub message: [u8; 64],
}

#[event]
pub struct AuditRetrievedEvent {
    pub id: u64,
    pub commit_hash: [u8; 32],
    pub timestamp: u64,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
}