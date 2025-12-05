# Static Analysis Tools Comparison: Bulwark vs Sol-Azy

## Executive Summary

This document compares two static analysis tools for Solana smart contracts:
- **Bulwark Analyzer** (this project): A comprehensive semantic static analysis tool with 23 analysis factors
- **Sol-Azy**: A rule-based static analysis tool with 14 specific security rules

## Architecture Comparison

### Bulwark Analyzer
- **Approach**: Semantic analysis with weighted risk factors
- **Output**: Normalized risk scores (0-100) for multiple factors
- **Analysis Type**: Quantitative metrics and complexity scoring
- **Language**: Rust (using `syn` crate for AST parsing)
- **Focus**: DeFi/AMM patterns, comprehensive security assessment

### Sol-Azy
- **Approach**: Rule-based pattern matching
- **Output**: Specific violation reports with severity levels
- **Analysis Type**: Qualitative security rule violations
- **Language**: Starlark (Python-like) rules on AST
- **Focus**: Specific security vulnerabilities

## Detailed Rule/Check Comparison

### 1. Access Control & Authorization

#### Bulwark Analyzer
**Factor**: `access_control.rs` / `privileged_roles.rs`
- **Checks**:
  - Gated handlers (with `signer` or `has_one` constraints)
  - Manual authority checks (explicit `if` or `require!` checks)
  - Account close operations
  - Unique role counting
- **Output**: Access Control Factor (0-100)
- **Weighting**: Gated handlers ×4, Manual checks ×2, Closes ×2, Role penalty

#### Sol-Azy
**Rules**: 
- `missing_signer_check.star`: Detects missing `is_signer` checks in Accounts structs
- `missing_owner_check.star`: Detects missing `owner` field validation
- **Output**: Specific violation locations with severity

**Similarities**:
- Both check for signer/authority validation
- Both identify manual vs. declarative access control

**Differences**:
- Bulwark provides quantitative scoring; Sol-Azy flags specific violations
- Bulwark counts all patterns; Sol-Azy flags missing patterns
- Bulwark includes account close analysis; Sol-Azy focuses on missing checks

---

### 2. Arithmetic Operations

#### Bulwark Analyzer
**Factor**: `arithmetic.rs`
- **Checks**:
  - High-risk operations (division `/`, modulo `%`)
  - Medium-risk operations (multiplication `*`)
  - Handler-centric analysis (only counts ops in Anchor handlers or reachable functions)
  - Call graph analysis to find delegated arithmetic
- **Output**: Arithmetic Factor (0-100)
- **Weighting**: Math handlers ×10, High-risk ops ×3, Medium-risk ops ×1

#### Sol-Azy
**Rules**:
- `checked_arithm_unwrap.star`: Detects `unwrap()` on checked arithmetic operations
- `saturating_math_usage.star`: Flags use of saturating math operations
- **Output**: Specific violation locations

**Similarities**:
- Both identify risky arithmetic operations
- Both recognize checked arithmetic patterns

**Differences**:
- Bulwark focuses on operation types (div/mod/mul) and handler context
- Sol-Azy focuses on error handling (unwrap) and saturation patterns
- Bulwark uses call graph analysis; Sol-Azy uses pattern matching
- Bulwark provides quantitative risk; Sol-Azy flags specific issues

---

### 3. Cross-Program Invocations (CPI)

#### Bulwark Analyzer
**Factor**: `cpi_calls.rs`
- **Checks**:
  - Total CPI calls
  - Signed vs unsigned CPIs
  - Unique program targets
  - Token program, System program, Associated token program CPIs
- **Output**: CPI Factor (0-100) based on program diversity and signed ratio
- **Weighting**: Program diversity ×2, Signed ratio ×10

#### Sol-Azy
**Rule**: `arbitrary_cpi.star`
- **Checks**: Unvalidated CPI calls (invoke without program validation)
- **Output**: Specific violation locations
- **Focus**: Security validation of CPI targets

**Similarities**:
- Both analyze CPI usage
- Both recognize invoke/invoke_signed patterns

**Differences**:
- Bulwark provides quantitative complexity scoring
- Sol-Azy flags unvalidated/arbitrary CPIs specifically
- Bulwark categorizes by program type; Sol-Azy checks validation

---

### 4. PDA (Program Derived Address) Analysis

#### Bulwark Analyzer
**Factor**: `pda_seeds.rs`
- **Checks**:
  - Total PDA accounts
  - Seed complexity scoring (literal seeds = 1, method calls/fields = 3)
  - Manual bump detection (penalty +5)
  - Distinct seed patterns
- **Output**: PDA Complexity Factor (0-100)
- **Weighting**: PDA count ×5 + seed complexity score

#### Sol-Azy
**Rules**:
- `missing_bump_seed_canonicalization.star`: Detects non-canonical bump seed usage
- `pda_sharing.star`: Detects PDA reuse across authority domains
- **Output**: Specific violation locations

**Similarities**:
- Both analyze PDA patterns
- Both check bump seed handling

**Differences**:
- Bulwark provides quantitative complexity scoring
- Sol-Azy flags specific security issues (canonicalization, sharing)
- Bulwark analyzes seed complexity; Sol-Azy checks correctness

---

### 5. Account Management

#### Bulwark Analyzer
**Factor**: `access_control.rs` (account closes)
- **Checks**: Account close operations (counts `close =` constraints)
- **Output**: Included in Access Control Factor

#### Sol-Azy
**Rules**:
- `closing_accounts.star`: Detects insecure account closing (lamports manipulation)
- `account_reinitialization.star`: Detects missing reinitialization protection
- `account_data_reallocation.star`: Detects unsafe `realloc` usage
- `account_data_matching.star`: Detects unpacking without authorization checks
- **Output**: Specific violation locations

**Similarities**:
- Both recognize account closing operations

**Differences**:
- Bulwark counts closes; Sol-Azy checks security of closing
- Sol-Azy has more specific account security rules
- Bulwark includes closes in access control; Sol-Azy has dedicated rules

---

### 6. Type Safety & Deserialization

#### Bulwark Analyzer
**Factor**: `unsafe_lowlevel.rs`
- **Checks**:
  - Unsafe blocks, functions, impls, traits
  - FFI functions
  - Raw pointers
  - Transmute usage
  - Bytemuck usage
  - Memory operations (mem::transmute, mem::zeroed)
- **Output**: Unsafe Factor (0-100)

#### Sol-Azy
**Rule**: `type_cosplay.star`
- **Checks**: Use of `try_from_slice` without discriminator checks
- **Output**: Specific violation locations

**Similarities**:
- Both identify unsafe deserialization patterns

**Differences**:
- Bulwark provides comprehensive unsafe code analysis
- Sol-Azy focuses specifically on type cosplay vulnerability
- Bulwark covers broader unsafe patterns; Sol-Azy targets specific attack vector

---

### 7. Input Validation & Constraints

#### Bulwark Analyzer
**Factor**: `input_constraints.rs`
- **Checks**:
  - Account struct lengths (max/avg)
  - Handlers with risky numeric parameters
  - Total constraint count
  - Constraint breakdown by type
- **Output**: Input Constraint Factor (0-100)
- **Weighting**: Constraints ×1, Max accounts ×3, Amount handlers ×5

#### Sol-Azy
**Rule**: `duplicate_mutable_accounts.star`
- **Checks**: Multiple mutable accounts without differentiation constraints
- **Output**: Specific violation locations

**Similarities**:
- Both analyze account constraints

**Differences**:
- Bulwark provides quantitative complexity scoring
- Sol-Azy flags specific constraint issues
- Bulwark analyzes constraint density; Sol-Azy checks constraint correctness

---

### 8. System Variables

#### Bulwark Analyzer
**Factor**: Not explicitly covered (may be in external_integration.rs)

#### Sol-Azy
**Rule**: `unvalidated_sysvar_accounts.star`
- **Checks**: Sysvar usage without validation (clock, epoch_schedule, instructions, rent)
- **Output**: Specific violation locations

**Differences**:
- Sol-Azy has dedicated sysvar validation rule
- Bulwark doesn't explicitly check sysvar validation

---

## Coverage Summary

### Bulwark Analyzer - 23 Analysis Factors
1. Lines of Code
2. Function Count
3. Cyclomatic Complexity
4. Modularity
5. Access Control
6. Arithmetic Operations
7. Asset Types
8. Composability
9. CPI Calls
10. Dependencies
11. DOS & Resource Limits
12. Error Handling
13. External Integration
14. Input Constraints
15. Invariants & Risk Parameters
16. PDA Seeds
17. Privileged Roles
18. Unsafe/Low-Level Operations
19. Upgradeability
20. Operational Security
21. (Oracle Price Feed - TODO)
22. (Statefulness - TODO)

### Sol-Azy - 14 Security Rules
1. Missing Signer Check
2. Missing Owner Check
3. Missing Bump Seed Canonicalization
4. Raw Unwrapping Checked Arithmetic
5. Arbitrary CPI
6. Closing Accounts Insecurely
7. PDA Sharing
8. Saturating Math Usage
9. Account Reinitialization
10. Type Cosplay
11. Unvalidated Sysvar Accounts
12. Duplicate Mutable Accounts
13. Account Data Matching
14. Account Data Reallocation

## Key Differences

### Analysis Philosophy

**Bulwark Analyzer**:
- **Quantitative**: Provides risk scores (0-100) for each factor
- **Comprehensive**: Covers 23 different aspects of code quality and security
- **DeFi-Focused**: Optimized for DeFi/AMM patterns
- **Complexity Scoring**: Measures complexity, not just violations
- **Call Graph Analysis**: Understands function call relationships

**Sol-Azy**:
- **Qualitative**: Flags specific security violations
- **Rule-Based**: Each rule targets a specific vulnerability
- **Security-Focused**: Focuses on security issues, not complexity
- **Pattern Matching**: Uses AST pattern matching for violations
- **Actionable**: Provides specific locations and descriptions

### Strengths

**Bulwark Analyzer**:
- Comprehensive coverage of code quality metrics
- Quantitative risk assessment
- Handler-centric analysis (understands Anchor patterns)
- Call graph analysis for delegated operations
- Normalized scoring for comparison

**Sol-Azy**:
- Specific security vulnerability detection
- Clear violation reporting
- Focused on actionable security issues
- Good coverage of account management vulnerabilities
- Sysvar validation checks

### Gaps & Opportunities

**Bulwark Analyzer Missing**:
- Explicit sysvar validation checks
- Type cosplay detection
- Account reinitialization protection
- Account data reallocation safety
- Duplicate mutable account checks
- Specific unwrap() on checked arithmetic detection

**Sol-Azy Missing**:
- Quantitative risk scoring
- Complexity metrics
- DeFi-specific patterns
- Call graph analysis
- Comprehensive unsafe code analysis
- Dependency security analysis

## Recommendations

### For Bulwark Analyzer
Consider adding rules similar to Sol-Azy for:
1. **Sysvar Validation**: Check for unvalidated sysvar accounts
2. **Type Cosplay**: Detect `try_from_slice` without discriminator checks
3. **Account Reinitialization**: Detect missing reinitialization protection
4. **Account Data Reallocation**: Check unsafe `realloc` usage
5. **Duplicate Mutable Accounts**: Verify differentiation constraints
6. **Checked Arithmetic Unwrap**: Flag `unwrap()` on checked arithmetic

### For Sol-Azy
Consider adding analysis similar to Bulwark for:
1. **Quantitative Scoring**: Provide risk scores for violations
2. **Call Graph Analysis**: Understand delegated operations
3. **Complexity Metrics**: Measure code complexity
4. **Dependency Analysis**: Check dependency security
5. **DeFi Patterns**: Recognize DeFi-specific patterns

## Conclusion

Both tools serve different purposes:
- **Bulwark Analyzer** is better for comprehensive risk assessment and complexity analysis
- **Sol-Azy** is better for specific security vulnerability detection

They complement each other well and could be used together for a complete security analysis workflow.

