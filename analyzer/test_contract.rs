// Test Rust contract for the analyzer
use anchor_lang::prelude::*;

pub fn swap_token_amount_base_in(amount_in: u64, reserve_in: u64, reserve_out: u64) -> Result<u64> {
    let amount_in_with_fee = amount_in.checked_mul(997)?;
    let numerator = amount_in_with_fee.checked_mul(reserve_out)?;
    let denominator = reserve_in
        .checked_mul(1000)?
        .checked_add(amount_in_with_fee)?;
    let amount_out = numerator.checked_div(denominator)?;

    Ok(amount_out)
}

pub fn calculate_liquidity(x: u64, y: u64) -> Result<u64> {
    let product = x.checked_mul(y)?;
    let liquidity = product.integer_sqrt();
    Ok(liquidity)
}

pub fn unsafe_calculation(a: u32, b: u32) -> u32 {
    a * b + 100 // Raw arithmetic - should be flagged as risky
}

pub fn complex_math_function(input: f64) -> f64 {
    let result = input.sqrt() * 2.0;
    result.pow(1.5) + input.ln()
}
