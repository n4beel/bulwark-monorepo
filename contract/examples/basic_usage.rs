//! Basic usage example for Bulwark Storage
//! 
//! This example demonstrates how to store and retrieve audit analysis results
//! using the Bulwark Storage client.

use bulwark_storage::{BulwarkStorageClient, AuditAnalysisResults};
use bulwark_storage::client::{AuditEffort, TimeRange, ResourceRange, Hotspots};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🛡️  Bulwark Storage - Basic Usage Example");
    println!("==========================================\n");

    // Create a new storage client
    let client = BulwarkStorageClient::new();
    println!("✅ Created Bulwark Storage client");

    // Create sample audit analysis results
    let audit_results = AuditAnalysisResults {
        audit_effort: AuditEffort {
            time_range: TimeRange {
                minimum_days: 7,
                maximum_days: 14,
            },
            resource_range: ResourceRange {
                minimum_count: 2,
                maximum_count: 4,
            },
            total_cost: 75000, // $75,000
        },
        hotspots: Hotspots {
            total_count: 23,
            high_risk_count: 5,
            medium_risk_count: 8,
        },
        commit_hash: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456".to_string(),
    };

    println!("📊 Sample audit results:");
    println!("   Time range: {} - {} days", 
        audit_results.audit_effort.time_range.minimum_days,
        audit_results.audit_effort.time_range.maximum_days
    );
    println!("   Resources: {} - {} people", 
        audit_results.audit_effort.resource_range.minimum_count,
        audit_results.audit_effort.resource_range.maximum_count
    );
    println!("   Total cost: ${}", audit_results.audit_effort.total_cost);
    println!("   Hotspots: {} total ({} high risk, {} medium risk)", 
        audit_results.hotspots.total_count,
        audit_results.hotspots.high_risk_count,
        audit_results.hotspots.medium_risk_count
    );
    println!("   Commit hash: {}", audit_results.commit_hash);
    println!();

    // Store the results
    println!("💾 Storing audit results...");
    match client.store_results(&audit_results).await {
        Ok(result) => {
            if result.success {
                println!("✅ Successfully stored results!");
                println!("   Storage ID: {:?}", result.id);
                println!("   Message: {}", result.message);
            } else {
                println!("❌ Failed to store results: {}", result.message);
            }
        }
        Err(e) => {
            println!("❌ Error storing results: {}", e);
        }
    }
    println!();

    // Check if results exist by commit hash
    println!("🔍 Checking if results exist by commit hash...");
    match client.exists_by_commit(&audit_results.commit_hash).await {
        Ok(exists) => {
            if exists {
                println!("✅ Results found for commit hash");
            } else {
                println!("❌ No results found for commit hash");
            }
        }
        Err(e) => {
            println!("❌ Error checking existence: {}", e);
        }
    }
    println!();

    // Try to retrieve results by commit hash
    println!("📥 Attempting to retrieve results by commit hash...");
    match client.retrieve_by_commit(&audit_results.commit_hash).await {
        Ok(Some(retrieved_results)) => {
            println!("✅ Successfully retrieved results!");
            println!("   Retrieved commit hash: {}", retrieved_results.commit_hash);
        }
        Ok(None) => {
            println!("ℹ️  No results found (this is expected in the current implementation)");
        }
        Err(e) => {
            println!("❌ Error retrieving results: {}", e);
        }
    }
    println!();

    // List all stored results
    println!("📋 Listing all stored results...");
    match client.list_all().await {
        Ok(results) => {
            if results.is_empty() {
                println!("ℹ️  No results stored (this is expected in the current implementation)");
            } else {
                println!("✅ Found {} stored results:", results.len());
                for (id, commit_hash, timestamp) in results {
                    println!("   ID: {}, Commit: {}, Timestamp: {}", id, commit_hash, timestamp);
                }
            }
        }
        Err(e) => {
            println!("❌ Error listing results: {}", e);
        }
    }

    println!("\n🎉 Example completed!");
    println!("\nNote: This is a demonstration of the API structure.");
    println!("In a real implementation, the data would be encrypted and stored");
    println!("using Arcium's confidential computing capabilities.");

    Ok(())
}
