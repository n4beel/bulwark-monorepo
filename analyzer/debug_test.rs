use anchor_lang::prelude::*;

pub fn risky_handler(ctx: Context<RiskyHandler>, amount: u64) -> Result<()> {
    let result = amount / 2;  // High risk: division
    let remainder = amount % 3;  // High risk: modulo
    Ok(())
}
