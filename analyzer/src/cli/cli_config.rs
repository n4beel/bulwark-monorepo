//! CLI Configuration Management
//!
//! Handles persistent configuration stored in ~/.bulwark/config.toml

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

/// User information stored after authentication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserConfig {
    pub id: String,
    pub email: Option<String>,
    pub name: Option<String>,
    pub whitelisted: bool,
}

/// Queued analysis for later submission
/// Note: analysis_data is stored as a JSON string because TOML can't handle complex nested structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueuedAnalysis {
    pub id: String,
    pub project_name: String,
    pub created_at: String,
    /// JSON string of the analysis data (serialized separately because TOML has limits)
    pub analysis_data_json: String,
}

impl QueuedAnalysis {
    /// Create a new queued analysis, serializing the data to JSON string
    pub fn new(id: String, project_name: String, data: serde_json::Value) -> Self {
        Self {
            id,
            project_name,
            created_at: chrono::Utc::now().to_rfc3339(),
            analysis_data_json: serde_json::to_string(&data).unwrap_or_default(),
        }
    }

    /// Get the analysis data as a JSON value
    pub fn get_analysis_data(&self) -> Option<serde_json::Value> {
        serde_json::from_str(&self.analysis_data_json).ok()
    }
}

/// Main CLI configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CliConfig {
    /// Backend API URL
    #[serde(default = "default_api_url")]
    pub api_url: String,

    /// Base URL for web interface
    #[serde(default = "default_web_url")]
    pub web_url: String,

    /// Stored auth token
    #[serde(default)]
    pub auth_token: Option<String>,

    /// User info from last login
    #[serde(default)]
    pub user: Option<UserConfig>,

    /// Analyses queued for later submission
    #[serde(default)]
    pub queued_analyses: Vec<QueuedAnalysis>,

    /// Default output format (json, text, minimal)
    #[serde(default = "default_output_format")]
    pub output_format: String,

    /// Enable verbose logging by default
    #[serde(default)]
    pub verbose: bool,
}

fn default_api_url() -> String {
    "https://api.blockapex.online".to_string()
}

fn default_web_url() -> String {
    "https://bulwark.blockapex.io".to_string()
}

fn default_output_format() -> String {
    "text".to_string()
}

impl Default for CliConfig {
    fn default() -> Self {
        Self {
            api_url: default_api_url(),
            web_url: default_web_url(),
            auth_token: None,
            user: None,
            queued_analyses: Vec::new(),
            output_format: default_output_format(),
            verbose: false,
        }
    }
}

impl CliConfig {
    /// Load config from file or return default
    /// If parsing fails (e.g., format changed), backs up old config and returns default
    pub fn load() -> Result<Self> {
        let config_path = Self::get_config_path()?;

        if !config_path.exists() {
            return Ok(Self::default());
        }

        let content = std::fs::read_to_string(&config_path)
            .context(format!("Failed to read config file: {:?}", config_path))?;

        match toml::from_str(&content) {
            Ok(config) => Ok(config),
            Err(e) => {
                // Config format changed or corrupted - backup and reset
                let backup_path = config_path.with_extension("toml.bak");
                let _ = std::fs::rename(&config_path, &backup_path);
                eprintln!(
                    "⚠️  Config format changed. Old config backed up to {:?}",
                    backup_path
                );
                eprintln!("   You may need to login again with 'bulwark login'");
                log::warn!("Config parse error: {}. Reset to defaults.", e);
                Ok(Self::default())
            }
        }
    }

    /// Save config to file
    pub fn save(&self) -> Result<()> {
        let config_path = Self::get_config_path()?;
        let parent = config_path
            .parent()
            .context("Failed to get config directory")?;

        std::fs::create_dir_all(parent).context("Failed to create config directory")?;

        let content = toml::to_string_pretty(self).context("Failed to serialize config")?;

        std::fs::write(&config_path, content).context("Failed to write config file")?;

        Ok(())
    }

    /// Get config file path (~/.bulwark/config.toml)
    pub fn get_config_path() -> Result<PathBuf> {
        let home = dirs::home_dir().context("Could not find home directory")?;
        Ok(home.join(".bulwark").join("config.toml"))
    }

    /// Get data directory (~/.bulwark/)
    pub fn get_data_dir() -> Result<PathBuf> {
        let home = dirs::home_dir().context("Could not find home directory")?;
        let dir = home.join(".bulwark");
        std::fs::create_dir_all(&dir)?;
        Ok(dir)
    }

    /// Queue an analysis for later submission
    pub fn queue_analysis(
        &mut self,
        project_name: &str,
        data: serde_json::Value,
    ) -> Result<String> {
        let id = Uuid::new_v4().to_string();

        self.queued_analyses.push(QueuedAnalysis::new(
            id.clone(),
            project_name.to_string(),
            data,
        ));

        self.save()?;
        Ok(id)
    }

    /// Remove a queued analysis by ID
    pub fn remove_queued(&mut self, id: &str) -> Result<()> {
        self.queued_analyses.retain(|a| a.id != id);
        self.save()
    }

    /// Clear all queued analyses
    pub fn clear_queue(&mut self) -> Result<()> {
        self.queued_analyses.clear();
        self.save()
    }

    /// Set a config value by key
    pub fn set(&mut self, key: &str, value: &str) -> Result<()> {
        match key {
            "api_url" => self.api_url = value.to_string(),
            "web_url" => self.web_url = value.to_string(),
            "output_format" => {
                if !["json", "text", "minimal"].contains(&value) {
                    return Err(anyhow::anyhow!(
                        "Invalid output format. Use: json, text, or minimal"
                    ));
                }
                self.output_format = value.to_string();
            }
            "verbose" => {
                self.verbose = value.parse().context("Invalid boolean value for verbose")?;
            }
            _ => return Err(anyhow::anyhow!("Unknown config key: {}", key)),
        }
        self.save()
    }

    /// Get a config value by key
    pub fn get(&self, key: &str) -> Option<String> {
        match key {
            "api_url" => Some(self.api_url.clone()),
            "web_url" => Some(self.web_url.clone()),
            "output_format" => Some(self.output_format.clone()),
            "verbose" => Some(self.verbose.to_string()),
            "user_id" => self.user.as_ref().map(|u| u.id.clone()),
            "email" => self.user.as_ref().and_then(|u| u.email.clone()),
            "whitelisted" => self.user.as_ref().map(|u| u.whitelisted.to_string()),
            _ => None,
        }
    }

    /// Display all config values
    pub fn display(&self) {
        println!("Bulwark CLI Configuration");
        println!("==========================");
        println!();
        println!("API URL:        {}", self.api_url);
        println!("Web URL:        {}", self.web_url);
        println!("Output Format:  {}", self.output_format);
        println!("Verbose:        {}", self.verbose);
        println!();

        if let Some(ref user) = self.user {
            println!("Logged in User:");
            if let Some(ref name) = user.name {
                println!("  Name:         {}", name);
            }
            if let Some(ref email) = user.email {
                println!("  Email:        {}", email);
            }
            println!("  User ID:      {}", user.id);
            println!("  Whitelisted:  {}", user.whitelisted);
        } else {
            println!("Not logged in");
        }

        println!();
        println!("Queued Analyses: {}", self.queued_analyses.len());

        if let Ok(path) = Self::get_config_path() {
            println!();
            println!("Config file:    {:?}", path);
        }
    }
}

/// Available analysis factors
#[derive(Debug, Clone)]
pub struct AvailableFactors {
    pub structural: Vec<&'static str>,
    pub security: Vec<&'static str>,
    pub systemic: Vec<&'static str>,
    pub economic: Vec<&'static str>,
    pub ai: Vec<&'static str>,
}

impl Default for AvailableFactors {
    fn default() -> Self {
        Self {
            structural: vec![
                "lines_of_code",
                "functions",
                "complexity",
                "modularity",
                "dependencies",
            ],
            security: vec![
                "access_control",
                "pda_seeds",
                "cpi_calls",
                "input_constraints",
                "arithmetic",
                "privileged_roles",
                "unsafe_lowlevel",
                "error_handling",
            ],
            systemic: vec![
                "upgradeability",
                "external_integration",
                "composability",
                "dos_resource_limits",
                "operational_security",
            ],
            economic: vec!["asset_types", "invariants_risk_params"],
            ai: vec![
                "code_analysis",
                "documentation_clarity",
                "testing_coverage",
                "financial_logic",
                "attack_vectors",
                "value_at_risk",
            ],
        }
    }
}

impl AvailableFactors {
    /// Get factor category
    pub fn get_category(&self, factor: &str) -> Option<&'static str> {
        if self.structural.contains(&factor) {
            Some("structural")
        } else if self.security.contains(&factor) {
            Some("security")
        } else if self.systemic.contains(&factor) {
            Some("systemic")
        } else if self.economic.contains(&factor) {
            Some("economic")
        } else if self.ai.contains(&factor) {
            Some("ai")
        } else {
            None
        }
    }

    /// Get all factors in a category
    pub fn get_by_category(&self, category: &str) -> Option<&Vec<&'static str>> {
        match category.to_lowercase().as_str() {
            "structural" => Some(&self.structural),
            "security" => Some(&self.security),
            "systemic" => Some(&self.systemic),
            "economic" => Some(&self.economic),
            "ai" => Some(&self.ai),
            _ => None,
        }
    }

    /// List all available factors
    pub fn all(&self) -> Vec<&'static str> {
        let mut all = Vec::new();
        all.extend(self.structural.iter());
        all.extend(self.security.iter());
        all.extend(self.systemic.iter());
        all.extend(self.economic.iter());
        all.extend(self.ai.iter());
        all
    }

    /// Check if a factor exists
    pub fn exists(&self, factor: &str) -> bool {
        self.get_category(factor).is_some()
    }

    /// Print available factors organized by category
    pub fn print_all(&self) {
        println!("Available Analysis Factors");
        println!("==========================");
        println!();

        println!("Structural:");
        for f in &self.structural {
            println!("  - {}", f);
        }
        println!();

        println!("Security:");
        for f in &self.security {
            println!("  - {}", f);
        }
        println!();

        println!("Systemic:");
        for f in &self.systemic {
            println!("  - {}", f);
        }
        println!();

        println!("Economic:");
        for f in &self.economic {
            println!("  - {}", f);
        }
        println!();

        println!("AI (requires login):");
        for f in &self.ai {
            println!("  - {}", f);
        }
    }
}
