# Bulwark Rust Analyzer

> **Comprehensive semantic static analysis for Solana/Anchor smart contracts**

[![Rust](https://img.shields.io/badge/rust-1.70%2B-orange.svg)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-green.svg)](Cargo.toml)

A production-ready static analysis tool that provides deep security and complexity analysis for Rust-based Solana smart contracts, with a focus on DeFi/AMM patterns.

## 🌟 Features

- **23 Analysis Factors** covering security, complexity, and risk
- **Dual Operation Modes:** CLI and HTTP Server
- **Solana/Anchor Specific:** Deep understanding of Solana ecosystem patterns
- **4-Tier Dependency Security Classification**
- **Real AST Analysis:** Leverages Rust's `syn` crate for accurate code analysis
- **Production Ready:** Comprehensive error handling, logging, and monitoring
- **Extensible Architecture:** Easy to add custom analysis factors

## 📊 Analysis Factors

### Core Metrics
- Lines of Code
- Function Count
- Cyclomatic Complexity
- Modularity Score

### Security Analysis
- Access Control Patterns
- PDA Seed Complexity
- CPI Call Analysis
- Input Validation
- Privileged Roles
- Unsafe/Low-Level Operations
- Error Handling Patterns

### DeFi/AMM Specific
- Arithmetic Safety
- Invariants & Risk Parameters
- Oracle/Price Feed Integration
- Asset Type Complexity
- Composability Patterns
- Statefulness Analysis

### Risk Assessment
- Dependency Security Tiers
- External Integration Risk
- DOS & Resource Limits
- Upgradeability Governance
- Operational Security

## 🚀 Quick Start

### Prerequisites

- Rust 1.70+ (Edition 2021)
- Cargo

### Installation

```bash
# Clone and build
git clone <repository-url>
cd rust-analyzer
cargo build --release
```

### CLI Usage

```bash
# Analyze entire repository
cargo run --bin cli -- analyze --path /path/to/solana/contract --pretty

# Analyze single file
cargo run --bin cli -- file src/lib.rs

# Save output to file
cargo run --bin cli -- analyze --path . --output report.json
```

### Server Usage

```bash
# Start HTTP server (default port 8080)
cargo run --bin server

# With custom configuration
PORT=3000 SHARED_WORKSPACE_PATH=/workspace cargo run --bin server
```

### API Examples

```bash
# Health check
curl http://localhost:8080/health

# Full analysis
curl -X POST http://localhost:8080/augment \
  -H "Content-Type: application/json" \
  -d '{"workspace_id":"my-contract","api_version":"v1"}'

# List workspaces
curl http://localhost:8080/workspaces
```

## 📖 Documentation

- **[Comprehensive Analysis](COMPREHENSIVE_ANALYSIS.md)** - Complete system analysis (19 sections, 8,500+ words)
- **[Architecture Overview](ARCHITECTURE_OVERVIEW.md)** - Visual diagrams and system architecture
- **[Developer Guide](DEVELOPER_GUIDE.md)** - How to extend and contribute

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Entry Points                         │
│  ┌─────────────┐              ┌──────────────────┐     │
│  │ CLI Binary  │              │  HTTP Server     │     │
│  │ (analyze,   │              │  (Axum/Tokio)    │     │
│  │  file)      │              │  7 endpoints     │     │
│  └──────┬──────┘              └────────┬─────────┘     │
│         └──────────────┬────────────────┘               │
│                        ▼                                │
│              ┌──────────────────┐                       │
│              │ Analyzer Engine  │                       │
│              │  • File discovery│                       │
│              │  • AST parsing   │                       │
│              │  • Visitor pattern                       │
│              └────────┬─────────┘                       │
│                       ▼                                 │
│         ┌─────────────────────────┐                     │
│         │  23 Factor Analyzers    │                     │
│         │  (Modular & Extensible) │                     │
│         └────────┬────────────────┘                     │
│                  ▼                                      │
│         ┌────────────────────┐                          │
│         │ Metrics & Reports  │                          │
│         │  • Risk scores     │                          │
│         │  • Recommendations │                          │
│         │  • JSON output     │                          │
│         └────────────────────┘                          │
└─────────────────────────────────────────────────────────┘
```

## 🔬 Example Output

```json
{
  "success": true,
  "workspace_id": "my-amm-contract",
  "factors": {
    "totalLinesOfCode": 5420,
    "numFunctions": 127,
    "complexity": {
      "avgComplexity": 4.2,
      "maxComplexity": 18,
      "totalFunctions": 127
    },
    "accessControl": {
      "totalAccessControlledHandlers": 24,
      "accessControlDecorators": 18,
      "explicitAuthorityChecks": 12,
      "distinctAuthorityPatterns": 5
    },
    "pdaSeeds": {
      "totalPdaAccounts": 8,
      "simpleSeedPdas": 3,
      "complexSeedPdas": 5,
      "distinctSeedPatterns": 4
    },
    "arithmeticOperations": {
      "totalArithmeticOperations": 156,
      "highRiskOperations": 12,
      "lowRiskOperations": 144,
      "arithmeticComplexityScore": 48.5
    },
    "dependencies": {
      "totalDependencies": 28,
      "tier1Dependencies": 12,
      "tier2Dependencies": 10,
      "tier3Dependencies": 5,
      "tier4Dependencies": 1,
      "dependencySecurityScore": 82.3
    }
    // ... 18 more factors
  },
  "meta": {
    "api_version": "v1",
    "timestamp": "2025-10-20T12:00:00Z"
  }
}
```

## 🧪 Testing

```bash
# Run all tests
cargo test

# Run specific test
cargo test access_control

# Run with verbose output
cargo test -- --nocapture

# Run integration tests
./test_comprehensive_coverage
./test_server_simulation
```

## 🛠️ Development

### Adding a New Factor

1. Create `src/factors/my_factor.rs`
2. Implement `calculate_workspace_my_factor()` function
3. Add to `src/factors/mod.rs` exports
4. Integrate in `src/bin/server.rs`
5. Add tests in `test_my_factor.rs`
6. Update documentation

See [Developer Guide](DEVELOPER_GUIDE.md) for detailed instructions.

### Code Quality

```bash
# Format code
cargo fmt

# Lint code
cargo clippy --all-targets --all-features

# Check for issues
cargo check
```

## 🌐 Integration

This analyzer is part of the larger **Bulwark** ecosystem:

```
User → NestJS Server → Rust Analyzer → AI Model (Python)
         ↓                  ↓               ↓
      Upload           Analysis        Predictions
      Extract          23 Factors      Risk Scores
      Manage           JSON Output     Cost Est.
```

## 📈 Performance

**Typical Analysis Times:**
- Small contract (1K LOC): ~100ms
- Medium contract (10K LOC): ~1-2s
- Large contract (100K LOC): ~10-20s

**Resource Usage:**
- Memory: 50-500MB (depending on project size)
- CPU: Single-threaded (parallel processing planned)

## 🔐 Security Features

- **Tier-based Dependency Classification:** Solana Official → Security/Crypto → Popular → Unknown
- **Pattern Recognition:** Detects 50+ security-relevant patterns
- **Risk Scoring:** Weighted risk calculations across all factors
- **Actionable Recommendations:** Context-aware security suggestions

## 🗺️ Roadmap

- [ ] Implement line number tracking
- [ ] Add caching layer for incremental analysis
- [ ] Parallel file processing
- [ ] Real-time WebSocket updates
- [ ] Visual reporting dashboard
- [ ] IDE integration (VS Code extension)
- [ ] Historical trend analysis
- [ ] Custom rule engine

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please read the [Developer Guide](DEVELOPER_GUIDE.md) before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Review existing documentation
- Check test files for usage examples

## 🏆 Acknowledgments

- Built with [syn](https://github.com/dtolnay/syn) for Rust AST parsing
- Powered by [Axum](https://github.com/tokio-rs/axum) for HTTP server
- Inspired by the Solana/Anchor ecosystem

---

**Built with ❤️ for the Solana security community**

**Version:** 0.1.0 | **Last Updated:** October 20, 2025
