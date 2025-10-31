//! Bulwark Storage
//! 
//! A confidential storage solution for audit analysis results using Arcium's
//! confidential computing capabilities.

pub mod client;

// Re-export the main client for easy access
pub use client::{BulwarkStorageClient, AuditAnalysisResults, StorageResult};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let _client = BulwarkStorageClient::new();
        // Basic test to ensure client can be created
        assert!(true);
    }
}
