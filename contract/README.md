# 🛡️ Bulwark Storage

A confidential storage solution for audit analysis results using Arcium's confidential computing capabilities.

## Overview

Bulwark Storage provides secure, encrypted storage and retrieval of smart contract audit analysis results. It leverages Arcium's confidential computing to ensure that sensitive audit data remains encrypted throughout its entire lifecycle.

## Features

- **Confidential Storage**: Data is encrypted using Arcium's confidential computing
- **Dual Retrieval**: Retrieve results by commit hash or storage ID
- **Efficient Format**: Compact binary data structures for optimal storage
- **Type Safety**: Strongly typed Rust API with comprehensive error handling
- **Async Support**: Full async/await support for high-performance applications

## Data Structure

The storage system handles audit analysis results with the following structure:

```rust
pub struct AuditAnalysisResults {
    pub audit_effort: AuditEffort,
    pub hotspots: Hotspots,
    pub commit_hash: String, // Hex-encoded commit hash
}

pub struct AuditEffort {
    pub time_range: TimeRange,
    pub resource_range: ResourceRange,
    pub total_cost: u64,
}

pub struct Hotspots {
    pub total_count: u32,
    pub high_risk_count: u32,
    pub medium_risk_count: u32,
}
```

## Quick Start

### 1. Add to Your Project

Add Bulwark Storage to your `Cargo.toml`:

```toml
[dependencies]
bulwark-storage = { path = "./bulwark-storage" }
```

### 2. Basic Usage

```rust
use bulwark_storage::{BulwarkStorageClient, AuditAnalysisResults, AuditEffort, TimeRange, ResourceRange, Hotspots};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create a storage client
    let client = BulwarkStorageClient::new();

    // Create audit results
    let results = AuditAnalysisResults {
        audit_effort: AuditEffort {
            time_range: TimeRange {
                minimum_days: 7,
                maximum_days: 14,
            },
            resource_range: ResourceRange {
                minimum_count: 2,
                maximum_count: 4,
            },
            total_cost: 75000,
        },
        hotspots: Hotspots {
            total_count: 23,
            high_risk_count: 5,
            medium_risk_count: 8,
        },
        commit_hash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456".to_string(),
    };

    // Store results
    let store_result = client.store_results(&results).await?;
    println!("Stored with ID: {:?}", store_result.id);

    // Retrieve by commit hash
    let retrieved = client.retrieve_by_commit(&results.commit_hash).await?;
    if let Some(data) = retrieved {
        println!("Retrieved results for commit: {}", data.commit_hash);
    }

    Ok(())
}
```

## API Reference

### BulwarkStorageClient

#### `new() -> BulwarkStorageClient`
Creates a new storage client instance.

#### `store_results(results: &AuditAnalysisResults) -> Result<StorageResult, String>`
Stores audit analysis results and returns a storage result with the assigned ID.

#### `retrieve_by_commit(commit_hash: &str) -> Result<Option<AuditAnalysisResults>, String>`
Retrieves audit results by commit hash.

#### `retrieve_by_id(id: u64) -> Result<Option<AuditAnalysisResults>, String>`
Retrieves audit results by storage ID.

#### `exists_by_commit(commit_hash: &str) -> Result<bool, String>`
Checks if results exist for a given commit hash.

#### `exists_by_id(id: u64) -> Result<bool, String>`
Checks if results exist for a given storage ID.

#### `list_all() -> Result<Vec<(u64, String, u64)>, String>`
Lists all stored results (returns metadata: id, commit_hash, timestamp).

## Integration with MySecurity

To integrate Bulwark Storage with your MySecurity analysis pipeline:

1. **After Analysis Completion**: Store results when your static analysis completes
2. **Result Retrieval**: Retrieve previous results to avoid re-analysis
3. **Audit History**: Maintain a history of all analyzed commits

### Example Integration

```rust
// In your analysis service
use bulwark_storage::{BulwarkStorageClient, AuditAnalysisResults};

pub struct AnalysisService {
    storage_client: BulwarkStorageClient,
}

impl AnalysisService {
    pub async fn analyze_repository(&self, repo_path: &str, commit_hash: &str) -> Result<(), String> {
        // Check if already analyzed
        if self.storage_client.exists_by_commit(commit_hash).await? {
            println!("Repository already analyzed for commit: {}", commit_hash);
            return Ok(());
        }

        // Perform analysis...
        let analysis_results = self.perform_analysis(repo_path).await?;

        // Store results
        let audit_results = AuditAnalysisResults {
            audit_effort: analysis_results.audit_effort,
            hotspots: analysis_results.hotspots,
            commit_hash: commit_hash.to_string(),
        };

        self.storage_client.store_results(&audit_results).await?;
        println!("Analysis results stored for commit: {}", commit_hash);

        Ok(())
    }
}
```

## Development

### Running Tests

```bash
cargo test
```

### Running Examples

```bash
cargo run --example basic_usage
```

### Building

```bash
cargo build --release
```

## Architecture

Bulwark Storage consists of two main components:

1. **Encrypted Instructions** (`encrypted-ixs/`): Arcium confidential computing circuits for secure data operations
2. **Client Library** (`src/`): Rust client library for easy integration

The encrypted instructions handle:
- Secure data storage and retrieval
- Index management for commit hash and ID lookups
- Data encryption/decryption using Arcium's confidential computing

The client library provides:
- Type-safe API for storing and retrieving results
- Error handling and validation
- Async/await support for high performance

## Security

- All data is encrypted using Arcium's confidential computing
- Data remains encrypted at rest, in transit, and during computation
- No plaintext data is ever exposed to the storage system
- Access control is handled by Arcium's permission system

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request# bulwark-contract
