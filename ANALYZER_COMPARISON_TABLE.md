# Quick Reference: Bulwark vs Sol-Azy Coverage Matrix

## Security Checks Coverage

| Security Area | Bulwark Analyzer | Sol-Azy | Notes |
|--------------|------------------|---------|-------|
| **Access Control** |
| Signer checks | ✅ (quantitative) | ✅ (violation detection) | Bulwark scores; Sol-Azy flags missing |
| Owner checks | ✅ (quantitative) | ✅ (violation detection) | Bulwark scores; Sol-Azy flags missing |
| Manual auth checks | ✅ | ❌ | Bulwark counts manual checks |
| Account closes | ✅ (counts) | ✅ (security check) | Bulwark counts; Sol-Azy checks safety |
| **Arithmetic** |
| Division/Modulo | ✅ (high-risk) | ❌ | Bulwark scores by operation type |
| Multiplication | ✅ (medium-risk) | ❌ | Bulwark scores by operation type |
| Checked arithmetic unwrap | ❌ | ✅ | Sol-Azy flags unwrap() on checked ops |
| Saturating math | ❌ | ✅ | Sol-Azy flags saturating operations |
| **CPI (Cross-Program Invocation)** |
| CPI detection | ✅ (comprehensive) | ✅ (validation check) | Bulwark scores complexity; Sol-Azy checks validation |
| Program diversity | ✅ | ❌ | Bulwark measures unique programs |
| Signed vs unsigned | ✅ | ❌ | Bulwark tracks signed ratio |
| Arbitrary CPI | ❌ | ✅ | Sol-Azy flags unvalidated CPIs |
| **PDA (Program Derived Address)** |
| PDA detection | ✅ | ❌ | Bulwark counts PDAs |
| Seed complexity | ✅ | ❌ | Bulwark scores seed complexity |
| Bump canonicalization | ❌ | ✅ | Sol-Azy flags non-canonical bumps |
| PDA sharing | ❌ | ✅ | Sol-Azy flags PDA reuse |
| **Account Management** |
| Account closing | ✅ (counts) | ✅ (security) | Bulwark counts; Sol-Azy checks safety |
| Account reinitialization | ❌ | ✅ | Sol-Azy flags missing protection |
| Account reallocation | ❌ | ✅ | Sol-Azy flags unsafe realloc |
| Account data matching | ❌ | ✅ | Sol-Azy flags unpack without auth |
| Duplicate mutable accounts | ❌ | ✅ | Sol-Azy flags missing constraints |
| **Type Safety** |
| Unsafe code | ✅ (comprehensive) | ❌ | Bulwark scores all unsafe patterns |
| Type cosplay | ❌ | ✅ | Sol-Azy flags try_from_slice issues |
| **System Variables** |
| Sysvar validation | ❌ | ✅ | Sol-Azy flags unvalidated sysvars |
| **Input Validation** |
| Constraint counting | ✅ | ❌ | Bulwark counts and scores constraints |
| Account struct size | ✅ | ❌ | Bulwark measures complexity |
| Numeric parameters | ✅ | ❌ | Bulwark identifies risky handlers |
| **Code Quality** |
| Lines of code | ✅ | ❌ | Bulwark measures LOC |
| Function count | ✅ | ❌ | Bulwark counts functions |
| Cyclomatic complexity | ✅ | ❌ | Bulwark measures complexity |
| Modularity | ✅ | ❌ | Bulwark scores modularity |
| **DeFi Specific** |
| Asset types | ✅ | ❌ | Bulwark analyzes asset complexity |
| Composability | ✅ | ❌ | Bulwark measures composability |
| Invariants & risk params | ✅ | ❌ | Bulwark analyzes constraints |
| **Dependencies** |
| Dependency security | ✅ | ❌ | Bulwark classifies dependencies |
| External integration | ✅ | ❌ | Bulwark analyzes integrations |
| **Error Handling** |
| Error patterns | ✅ | ❌ | Bulwark analyzes error handling |
| **Operational Security** |
| OpSec patterns | ✅ | ❌ | Bulwark analyzes operational security |
| **Upgradeability** |
| Upgrade patterns | ✅ | ❌ | Bulwark analyzes upgradeability |

## Analysis Approach Comparison

| Aspect | Bulwark Analyzer | Sol-Azy |
|--------|------------------|---------|
| **Output Type** | Quantitative scores (0-100) | Qualitative violations |
| **Analysis Depth** | Semantic + AST | AST pattern matching |
| **Call Graph** | ✅ Yes | ❌ No |
| **Handler Detection** | ✅ Yes (Anchor-aware) | ✅ Yes (pattern-based) |
| **Scoring System** | ✅ Weighted factors | ❌ No scoring |
| **Violation Reporting** | ❌ No | ✅ Yes (with severity) |
| **Complexity Metrics** | ✅ Yes | ❌ No |
| **DeFi Patterns** | ✅ Yes | ❌ No |

## Coverage Statistics

- **Bulwark Analyzer**: ~23 analysis factors covering security, complexity, and quality
- **Sol-Azy**: 14 security rules covering specific vulnerabilities
- **Overlap**: ~6 areas (access control, arithmetic, CPI, PDA, account management, type safety)
- **Unique to Bulwark**: ~17 areas (complexity, DeFi patterns, dependencies, etc.)
- **Unique to Sol-Azy**: ~8 areas (sysvar validation, type cosplay, account reinitialization, etc.)

## Recommendation Matrix

| Use Case | Recommended Tool | Why |
|----------|-----------------|-----|
| Comprehensive risk assessment | Bulwark | Quantitative scoring, broad coverage |
| Security audit preparation | Sol-Azy | Specific violation detection |
| Code quality metrics | Bulwark | Complexity and quality factors |
| Vulnerability scanning | Sol-Azy | Focused security rules |
| DeFi contract analysis | Bulwark | DeFi-specific patterns |
| Account security review | Both | Complementary coverage |
| Compliance reporting | Bulwark | Quantitative metrics |
| Bug hunting | Sol-Azy | Specific vulnerability patterns |

