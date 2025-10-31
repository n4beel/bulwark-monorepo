//! MySecurity Integration Example
//! 
//! This example shows how to integrate Bulwark Storage with your MySecurity
//! analysis pipeline to store and retrieve audit results.

use bulwark_storage::{BulwarkStorageClient, AuditAnalysisResults};
use bulwark_storage::client::{AuditEffort, TimeRange, ResourceRange, Hotspots};

/// Example of how to integrate with your MySecurity analysis service
pub struct MySecurityAnalysisService {
    storage_client: BulwarkStorageClient,
}

impl MySecurityAnalysisService {
    pub fn new() -> Self {
        Self {
            storage_client: BulwarkStorageClient::new(),
        }
    }

    /// Analyze a repository and store results
    pub async fn analyze_repository(&self, repo_path: &str, commit_hash: &str) -> Result<u64, String> {
        println!("🔍 Analyzing repository: {}", repo_path);
        println!("📝 Commit hash: {}", commit_hash);

        // Check if already analyzed
        if self.storage_client.exists_by_commit(commit_hash).await? {
            println!("✅ Repository already analyzed for this commit");
            
            // Retrieve existing results
            if let Some(existing_results) = self.storage_client.retrieve_by_commit(commit_hash).await? {
                println!("📊 Retrieved existing analysis results");
                println!("   Time range: {} - {} days", 
                    existing_results.audit_effort.time_range.minimum_days,
                    existing_results.audit_effort.time_range.maximum_days
                );
                println!("   Total cost: ${}", existing_results.audit_effort.total_cost);
                return Ok(0); // Return 0 to indicate no new analysis needed
            }
        }

        // Perform analysis (simulated)
        let analysis_results = self.perform_analysis(repo_path).await?;

        // Convert to storage format
        let audit_results = AuditAnalysisResults {
            audit_effort: AuditEffort {
                time_range: TimeRange {
                    minimum_days: analysis_results.min_days,
                    maximum_days: analysis_results.max_days,
                },
                resource_range: ResourceRange {
                    minimum_count: analysis_results.min_resources,
                    maximum_count: analysis_results.max_resources,
                },
                total_cost: analysis_results.total_cost,
            },
            hotspots: Hotspots {
                total_count: analysis_results.total_hotspots,
                high_risk_count: analysis_results.high_risk_hotspots,
                medium_risk_count: analysis_results.medium_risk_hotspots,
            },
            commit_hash: commit_hash.to_string(),
        };

        // Store results
        let storage_result = self.storage_client.store_results(&audit_results).await?;
        
        if storage_result.success {
            println!("✅ Analysis results stored successfully!");
            println!("   Storage ID: {:?}", storage_result.id);
            println!("   Message: {}", storage_result.message);
            
            // Return the storage ID
            Ok(storage_result.id.unwrap_or(0))
        } else {
            Err(format!("Failed to store results: {}", storage_result.message))
        }
    }

    /// Simulate analysis process (replace with your actual analysis logic)
    async fn perform_analysis(&self, _repo_path: &str) -> Result<AnalysisResults, String> {
        // Simulate analysis delay
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        // Simulate analysis results
        Ok(AnalysisResults {
            min_days: 5,
            max_days: 12,
            min_resources: 2,
            max_resources: 4,
            total_cost: 45000,
            total_hotspots: 18,
            high_risk_hotspots: 4,
            medium_risk_hotspots: 6,
        })
    }

    /// Get analysis history for a repository
    pub async fn get_analysis_history(&self) -> Result<Vec<(u64, String, u64)>, String> {
        self.storage_client.list_all().await
    }

    /// Retrieve specific analysis by ID
    pub async fn get_analysis_by_id(&self, id: u64) -> Result<Option<AuditAnalysisResults>, String> {
        self.storage_client.retrieve_by_id(id).await
    }
}

/// Internal analysis results structure (your existing format)
#[derive(Debug)]
struct AnalysisResults {
    min_days: u32,
    max_days: u32,
    min_resources: u32,
    max_resources: u32,
    total_cost: u64,
    total_hotspots: u32,
    high_risk_hotspots: u32,
    medium_risk_hotspots: u32,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🛡️  MySecurity + Bulwark Storage Integration");
    println!("============================================\n");

    // Create analysis service
    let analysis_service = MySecurityAnalysisService::new();

    // Simulate analyzing a repository
    let repo_path = "/path/to/smart-contract-repo";
    let commit_hash = "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456";

    println!("🚀 Starting analysis workflow...\n");

    // First analysis
    println!("--- First Analysis ---");
    let storage_id = analysis_service.analyze_repository(repo_path, commit_hash).await?;
    println!("Storage ID: {}\n", storage_id);

    // Second analysis (should retrieve from cache)
    println!("--- Second Analysis (Cache Check) ---");
    let storage_id_2 = analysis_service.analyze_repository(repo_path, commit_hash).await?;
    println!("Storage ID: {}\n", storage_id_2);

    // Get analysis history
    println!("--- Analysis History ---");
    let history = analysis_service.get_analysis_history().await?;
    if history.is_empty() {
        println!("ℹ️  No analysis history found (expected in current implementation)");
    } else {
        println!("📋 Found {} analyses:", history.len());
        for (id, commit, timestamp) in history {
            println!("   ID: {}, Commit: {}, Timestamp: {}", id, commit, timestamp);
        }
    }

    println!("\n🎉 Integration example completed!");
    println!("\nTo integrate with your MySecurity server:");
    println!("1. Add bulwark-storage as a dependency");
    println!("2. Initialize BulwarkStorageClient in your service");
    println!("3. Store results after analysis completion");
    println!("4. Check for existing results before starting new analysis");

    Ok(())
}
