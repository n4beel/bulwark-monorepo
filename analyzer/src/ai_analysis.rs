//! AI Analysis Module for Rust Analyzer
//!
//! Provides OpenAI GPT-4o integration for comprehensive code analysis

use serde::{Deserialize, Serialize};
use serde_json::json;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeMetrics {
    #[serde(rename = "highRiskHotspots")]
    pub high_risk_hotspots: Vec<RiskHotspot>,
    #[serde(rename = "mediumRiskHotspots")]
    pub medium_risk_hotspots: Vec<RiskHotspot>,
    pub recommendations: Vec<String>,
    #[serde(rename = "overallRiskScore")]
    pub overall_risk_score: f64,
    pub findings: Vec<String>,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskHotspot {
    pub file: String,
    pub lines: String,
    #[serde(rename = "riskScore", alias = "risk_score", default = "default_risk_score")]
    pub risk_score: f64,
    pub components: Vec<String>,
}

fn default_risk_score() -> f64 {
    0.5 // Default medium risk if not provided
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentationMetrics {
    #[serde(rename = "codeCommentsScore")]
    pub code_comments_score: f64,
    #[serde(rename = "functionDocumentationScore")]
    pub function_documentation_score: f64,
    #[serde(rename = "readmeQualityScore")]
    pub readme_quality_score: f64,
    #[serde(rename = "securityDocumentationScore")]
    pub security_documentation_score: f64,
    #[serde(rename = "overallClarityScore")]
    pub overall_clarity_score: f64,
    pub findings: Vec<String>,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestingMetrics {
    #[serde(rename = "unitTestCoverage")]
    pub unit_test_coverage: f64,
    #[serde(rename = "integrationTestCoverage")]
    pub integration_test_coverage: f64,
    #[serde(rename = "testQualityScore")]
    pub test_quality_score: f64,
    #[serde(rename = "edgeCaseTestingScore")]
    pub edge_case_testing_score: f64,
    #[serde(rename = "securityTestScore")]
    pub security_test_score: f64,
    #[serde(rename = "overallTestingScore")]
    pub overall_testing_score: f64,
    pub findings: Vec<String>,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinancialLogicMetrics {
    #[serde(rename = "mathematicalComplexityScore")]
    pub mathematical_complexity_score: f64,
    #[serde(rename = "algorithmSophisticationScore")]
    pub algorithm_sophistication_score: f64,
    #[serde(rename = "interestRateComplexityScore")]
    pub interest_rate_complexity_score: f64,
    #[serde(rename = "ammPricingComplexityScore")]
    pub amm_pricing_complexity_score: f64,
    #[serde(rename = "rewardDistributionComplexityScore")]
    pub reward_distribution_complexity_score: f64,
    #[serde(rename = "riskManagementComplexityScore")]
    pub risk_management_complexity_score: f64,
    #[serde(rename = "overallFinancialComplexityScore")]
    pub overall_financial_complexity_score: f64,
    pub findings: Vec<String>,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttackVectorMetrics {
    #[serde(rename = "flashLoanAttackRisk")]
    pub flash_loan_attack_risk: f64,
    #[serde(rename = "sandwichAttackRisk")]
    pub sandwich_attack_risk: f64,
    #[serde(rename = "arbitrageOpportunities")]
    pub arbitrage_opportunities: f64,
    #[serde(rename = "economicExploitRisk")]
    pub economic_exploit_risk: f64,
    #[serde(rename = "overallAttackVectorScore")]
    pub overall_attack_vector_score: f64,
    pub findings: Vec<String>,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValueAtRiskMetrics {
    #[serde(rename = "assetVolumeComplexity")]
    pub asset_volume_complexity: f64,
    #[serde(rename = "liquidityRiskScore")]
    pub liquidity_risk_score: f64,
    #[serde(rename = "marketCapImplications")]
    pub market_cap_implications: f64,
    #[serde(rename = "economicStakesScore")]
    pub economic_stakes_score: f64,
    #[serde(rename = "overallValueAtRiskScore")]
    pub overall_value_at_risk_score: f64,
    pub findings: Vec<String>,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiAnalysisResults {
    #[serde(rename = "codeAnalysis")]
    pub code_analysis: CodeMetrics,
    #[serde(rename = "documentationClarity")]
    pub documentation_clarity: DocumentationMetrics,
    #[serde(rename = "testingCoverage")]
    pub testing_coverage: TestingMetrics,
    #[serde(rename = "financialLogicIntricacy")]
    pub financial_logic_intricacy: FinancialLogicMetrics,
    #[serde(rename = "profitAttackVectors")]
    pub profit_attack_vectors: AttackVectorMetrics,
    #[serde(rename = "valueAtRisk")]
    pub value_at_risk: ValueAtRiskMetrics,
}

#[derive(Debug)]
pub struct CodeFile {
    pub path: String,
    pub content: String,
    pub lines: usize,
    pub size: usize,
    pub is_main: bool,
    pub is_test: bool,
    pub is_instruction: bool,
}

pub struct AiAnalysisService {
    api_key: String,
    client: reqwest::Client,
}

impl AiAnalysisService {
    pub fn new() -> Result<Self, String> {
        let api_key = std::env::var("OPENAI_API_KEY")
            .map_err(|_| "OPENAI_API_KEY environment variable not set")?;

        let client = reqwest::Client::new();

        Ok(Self { api_key, client })
    }

    pub async fn analyze_factors(
        &self,
        workspace_path: &Path,
        rust_analysis_results: &serde_json::Value,
        selected_files: Option<&[String]>,
    ) -> Result<AiAnalysisResults, String> {
        log::info!("Starting comprehensive AI analysis...");

        // Prepare comprehensive context
        let context = self
            .prepare_comprehensive_context(workspace_path, rust_analysis_results, selected_files)
            .await?;

        log::info!(
            "Prepared context: {} files, {} lines of code",
            context.code_files.len(),
            context.total_lines
        );

        // Execute analyses in parallel
        let (
            code_result,
            documentation_result,
            testing_result,
            financial_logic_result,
            attack_vectors_result,
            value_at_risk_result,
        ) = tokio::join!(
            self.analyze_code(&context),
            self.analyze_documentation_clarity(&context),
            self.analyze_testing_coverage(&context),
            self.analyze_financial_logic_intricacy(&context),
            self.analyze_profit_attack_vectors(&context),
            self.analyze_value_at_risk(&context),
        );

        let results = AiAnalysisResults {
            code_analysis: code_result.unwrap_or_else(|e| {
                log::warn!("Code analysis failed: {}", e);
                self.get_default_code_metrics()
            }),
            documentation_clarity: documentation_result.unwrap_or_else(|e| {
                log::warn!("Documentation analysis failed: {}", e);
                self.get_default_documentation_metrics()
            }),
            testing_coverage: testing_result.unwrap_or_else(|e| {
                log::warn!("Testing analysis failed: {}", e);
                self.get_default_testing_metrics()
            }),
            financial_logic_intricacy: financial_logic_result.unwrap_or_else(|e| {
                log::warn!("Financial logic analysis failed: {}", e);
                self.get_default_financial_logic_metrics()
            }),
            profit_attack_vectors: attack_vectors_result.unwrap_or_else(|e| {
                log::warn!("Attack vectors analysis failed: {}", e);
                self.get_default_attack_vector_metrics()
            }),
            value_at_risk: value_at_risk_result.unwrap_or_else(|e| {
                log::warn!("Value at risk analysis failed: {}", e);
                self.get_default_value_at_risk_metrics()
            }),
        };

        log::info!("AI analysis completed successfully");
        Ok(results)
    }

    async fn prepare_comprehensive_context(
        &self,
        workspace_path: &Path,
        rust_analysis_results: &serde_json::Value,
        selected_files: Option<&[String]>,
    ) -> Result<AnalysisContext, String> {
        let files = if let Some(selected) = selected_files {
            selected.to_vec()
        } else {
            self.get_all_rust_files(workspace_path)?
        };

        let mut code_files = Vec::new();
        let mut total_lines = 0;

        // Process files (limit to 15 most important files)
        for file in files.iter().take(15) {
            let file_path = workspace_path.join(file);
            if !file_path.exists() {
                continue;
            }

            match fs::read_to_string(&file_path) {
                Ok(content) => {
                    let lines = content.lines().count();
                    total_lines += lines;

                    code_files.push(CodeFile {
                        path: file.clone(),
                        content,
                        lines,
                        size: file_path.metadata().map(|m| m.len() as usize).unwrap_or(0),
                        is_main: file.contains("main.rs") || file.contains("lib.rs"),
                        is_test: file.contains("test") || file.contains("spec"),
                        is_instruction: file.contains("instruction") || file.contains("handler"),
                    });
                }
                Err(e) => {
                    log::warn!("Failed to read file {}: {}", file, e);
                }
            }
        }

        // Sort files by importance (main files first, then by size)
        code_files.sort_by(|a, b| {
            match (a.is_main, b.is_main) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => b.size.cmp(&a.size),
            }
        });

        Ok(AnalysisContext {
            code_files,
            total_lines,
            rust_analysis_results: rust_analysis_results.clone(),
            workspace_path: workspace_path.to_path_buf(),
            file_count: files.len(),
        })
    }

    fn get_all_rust_files(&self, workspace_path: &Path) -> Result<Vec<String>, String> {
        let mut files = Vec::new();

        for entry in WalkDir::new(workspace_path)
            .into_iter()
            .filter_entry(|e| {
                let name = e.file_name().to_string_lossy();
                !name.starts_with('.')
                    && name != "target"
                    && name != "node_modules"
                    && name != "dist"
                    && name != "build"
            })
        {
            let entry = entry.map_err(|e| format!("Failed to read directory: {}", e))?;
            if entry.file_type().is_file() {
                if let Some(ext) = entry.path().extension() {
                    if ext == "rs" {
                        if let Ok(relative_path) = entry.path().strip_prefix(workspace_path) {
                            files.push(
                                relative_path
                                    .to_string_lossy()
                                    .replace('\\', "/")
                                    .to_string(),
                            );
                        }
                    }
                }
            }
        }

        Ok(files)
    }

    // Analysis methods - will be implemented next
    async fn analyze_code(&self, context: &AnalysisContext) -> Result<CodeMetrics, String> {
        let prompt = self.build_code_prompt(context);
        let system_prompt = self.get_code_system_prompt();

        let response = self
            .call_openai(&system_prompt, &prompt, 2000)
            .await?;

        self.parse_and_validate_response::<CodeMetrics>(&response, "CodeMetrics")
    }

    async fn analyze_documentation_clarity(
        &self,
        context: &AnalysisContext,
    ) -> Result<DocumentationMetrics, String> {
        let prompt = self.build_documentation_prompt(context);
        let system_prompt = self.get_documentation_system_prompt();

        let response = self
            .call_openai(&system_prompt, &prompt, 1500)
            .await?;

        self.parse_and_validate_response::<DocumentationMetrics>(&response, "DocumentationMetrics")
    }

    async fn analyze_testing_coverage(
        &self,
        context: &AnalysisContext,
    ) -> Result<TestingMetrics, String> {
        let prompt = self.build_testing_prompt(context);
        let system_prompt = self.get_testing_system_prompt();

        let response = self
            .call_openai(&system_prompt, &prompt, 1500)
            .await?;

        self.parse_and_validate_response::<TestingMetrics>(&response, "TestingMetrics")
    }

    async fn analyze_financial_logic_intricacy(
        &self,
        context: &AnalysisContext,
    ) -> Result<FinancialLogicMetrics, String> {
        let prompt = self.build_financial_logic_prompt(context);
        let system_prompt = self.get_financial_logic_system_prompt();

        let response = self
            .call_openai(&system_prompt, &prompt, 1500)
            .await?;

        self.parse_and_validate_response::<FinancialLogicMetrics>(&response, "FinancialLogicMetrics")
    }

    async fn analyze_profit_attack_vectors(
        &self,
        context: &AnalysisContext,
    ) -> Result<AttackVectorMetrics, String> {
        let prompt = self.build_attack_vectors_prompt(context);
        let system_prompt = self.get_attack_vectors_system_prompt();

        let response = self
            .call_openai(&system_prompt, &prompt, 1500)
            .await?;

        self.parse_and_validate_response::<AttackVectorMetrics>(&response, "AttackVectorMetrics")
    }

    async fn analyze_value_at_risk(
        &self,
        context: &AnalysisContext,
    ) -> Result<ValueAtRiskMetrics, String> {
        let prompt = self.build_value_at_risk_prompt(context);
        let system_prompt = self.get_value_at_risk_system_prompt();

        let response = self
            .call_openai(&system_prompt, &prompt, 1500)
            .await?;

        self.parse_and_validate_response::<ValueAtRiskMetrics>(&response, "ValueAtRiskMetrics")
    }

    async fn call_openai(
        &self,
        system_prompt: &str,
        user_prompt: &str,
        max_tokens: u16,
    ) -> Result<String, String> {
        let request_body = json!({
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],
            "temperature": 0.1,
            "max_tokens": max_tokens,
            "response_format": {
                "type": "json_object"
            }
        });

        let response = self
            .client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await
            .map_err(|e| format!("OpenAI API request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("OpenAI API error: {} - {}", status, error_text));
        }

        let response_json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

        let content = response_json
            .get("choices")
            .and_then(|c| c.as_array())
            .and_then(|arr| arr.first())
            .and_then(|choice| choice.get("message"))
            .and_then(|msg| msg.get("content"))
            .and_then(|c| c.as_str())
            .ok_or_else(|| "OpenAI API returned empty or invalid content".to_string())?;

        Ok(content.to_string())
    }

    fn parse_and_validate_response<T>(&self, content: &str, expected_type: &str) -> Result<T, String>
    where
        T: for<'de> Deserialize<'de>,
    {
        // Clean the response (remove markdown formatting)
        let cleaned_content = content
            .replace("```json\n", "")
            .replace("```\n", "")
            .replace("```", "")
            .trim()
            .to_string();

        match serde_json::from_str::<T>(&cleaned_content) {
            Ok(parsed) => Ok(parsed),
            Err(e) => {
                // Log the actual response for debugging
                log::warn!(
                    "Failed to parse {} response. Error: {}. Response preview: {}",
                    expected_type,
                    e,
                    cleaned_content.chars().take(500).collect::<String>()
                );
                Err(format!("Failed to parse {} response: {}", expected_type, e))
            }
        }
    }

    // System prompts
    fn get_code_system_prompt(&self) -> String {
        r#"You are an expert smart contract security auditor analyzing Rust code for risk hotspots and security vulnerabilities.

CRITICAL: You must respond ONLY with valid JSON. No explanations, no markdown, no additional text.

Your response must match this exact schema:
{
  "highRiskHotspots": [
    {
      "file": string (relative file path),
      "lines": string (line range like "210-348"),
      "riskScore": number (0-1, where 1 is highest risk),
      "components": string[] (array of risk components like ["pda_derivation", "lamport_math"])
    }
  ],
  "mediumRiskHotspots": [
    {
      "file": string (relative file path),
      "lines": string (line range like "55-144"),
      "riskScore": number (0-1, where 1 is highest risk),
      "components": string[] (array of risk components like ["cpi_signer", "oracle_read"])
    }
  ],
  "recommendations": string[] (array of specific improvement recommendations),
  "overallRiskScore": number (0-100, overall risk assessment),
  "findings": string[] (array of general findings),
  "confidence": number (0-100, confidence in the analysis)
}

Risk Assessment Guidelines:
- HIGH RISK (0.7-1.0): Critical vulnerabilities, complex financial logic, unsafe operations, missing checks
- MEDIUM RISK (0.4-0.69): Potential issues, moderate complexity, some missing validations
- LOW RISK (0.0-0.39): Minor issues, well-implemented code, good practices

Focus on identifying:
1. Complex financial calculations and mathematical operations
2. PDA derivation and account validation logic
3. CPI calls and external integrations
4. Oracle usage and price feed dependencies
5. Unsafe operations and potential overflow/underflow
6. Missing access controls and authorization checks
7. Reentrancy and state manipulation risks
8. Economic attack vectors and MEV opportunities

Always provide specific file paths, line ranges, and detailed component descriptions."#.to_string()
    }

    fn get_documentation_system_prompt(&self) -> String {
        r#"You are an expert smart contract security auditor analyzing Rust code for documentation quality.

CRITICAL: You must respond ONLY with valid JSON. No explanations, no markdown, no additional text.

Your response must match this exact schema:
{
  "codeCommentsScore": number (0-100),
  "functionDocumentationScore": number (0-100),
  "readmeQualityScore": number (0-100),
  "securityDocumentationScore": number (0-100),
  "overallClarityScore": number (0-100),
  "findings": string[],
  "confidence": number (0-100)
}

Scoring Guidelines:
- 90-100: Excellent documentation with comprehensive comments, clear function docs, detailed README
- 70-89: Good documentation with minor gaps
- 50-69: Adequate documentation with some issues
- 30-49: Poor documentation with significant gaps
- 0-29: Very poor or missing documentation

Always provide specific findings that justify your scores."#.to_string()
    }

    fn get_testing_system_prompt(&self) -> String {
        r#"You are an expert smart contract security auditor analyzing Rust code for testing coverage and quality.

CRITICAL: You must respond ONLY with valid JSON. No explanations, no markdown, no additional text.

Your response must match this exact schema:
{
  "unitTestCoverage": number (0-100),
  "integrationTestCoverage": number (0-100),
  "testQualityScore": number (0-100),
  "edgeCaseTestingScore": number (0-100),
  "securityTestScore": number (0-100),
  "overallTestingScore": number (0-100),
  "findings": string[],
  "confidence": number (0-100)
}

Scoring Guidelines:
- 90-100: Comprehensive test suite with unit tests, integration tests, edge cases, and security tests
- 70-89: Good test coverage with minor gaps
- 50-69: Adequate testing with some coverage gaps
- 30-49: Poor testing with significant gaps
- 0-29: Very poor or missing tests

Always provide specific findings that justify your scores."#.to_string()
    }

    fn get_financial_logic_system_prompt(&self) -> String {
        r#"You are an expert smart contract security auditor analyzing Rust code for financial logic complexity.

CRITICAL: You must respond ONLY with valid JSON. No explanations, no markdown, no additional text.

Your response must match this exact schema:
{
  "mathematicalComplexityScore": number (0-100),
  "algorithmSophisticationScore": number (0-100),
  "interestRateComplexityScore": number (0-100),
  "ammPricingComplexityScore": number (0-100),
  "rewardDistributionComplexityScore": number (0-100),
  "riskManagementComplexityScore": number (0-100),
  "overallFinancialComplexityScore": number (0-100),
  "findings": string[],
  "confidence": number (0-100)
}

Scoring Guidelines:
- 90-100: Highly sophisticated financial algorithms with complex mathematical operations
- 70-89: Advanced financial logic with moderate complexity
- 50-69: Standard financial operations with some complexity
- 30-49: Basic financial logic with limited complexity
- 0-29: Simple or minimal financial operations

Always provide specific findings that justify your scores."#.to_string()
    }

    fn get_attack_vectors_system_prompt(&self) -> String {
        r#"You are an expert smart contract security auditor analyzing Rust code for potential profit attack vectors.

CRITICAL: You must respond ONLY with valid JSON. No explanations, no markdown, no additional text.

Your response must match this exact schema:
{
  "flashLoanAttackRisk": number (0-100),
  "sandwichAttackRisk": number (0-100),
  "arbitrageOpportunities": number (0-100),
  "economicExploitRisk": number (0-100),
  "overallAttackVectorScore": number (0-100),
  "findings": string[],
  "confidence": number (0-100)
}

Scoring Guidelines:
- 90-100: High risk of multiple attack vectors with significant profit potential
- 70-89: Moderate risk with some exploitable opportunities
- 50-69: Some attack vectors present but limited impact
- 30-49: Low risk with minimal exploitable opportunities
- 0-29: Very low risk with no significant attack vectors

Always provide specific findings that justify your scores."#.to_string()
    }

    fn get_value_at_risk_system_prompt(&self) -> String {
        r#"You are an expert smart contract security auditor analyzing Rust code for value at risk and asset volume implications.

CRITICAL: You must respond ONLY with valid JSON. No explanations, no markdown, no additional text.

Your response must match this exact schema:
{
  "assetVolumeComplexity": number (0-100),
  "liquidityRiskScore": number (0-100),
  "marketCapImplications": number (0-100),
  "economicStakesScore": number (0-100),
  "overallValueAtRiskScore": number (0-100),
  "findings": string[],
  "confidence": number (0-100)
}

Scoring Guidelines:
- 90-100: High-value protocol with complex asset management and significant economic stakes
- 70-89: Moderate value with some complexity in asset handling
- 50-69: Standard value with basic asset management
- 30-49: Low value with simple asset operations
- 0-29: Minimal value with very basic operations

Always provide specific findings that justify your scores."#.to_string()
    }

    // Prompt builders
    fn build_code_prompt(&self, context: &AnalysisContext) -> String {
        let code_content = self.truncate_code_content(&context.code_files, 12000);
        let rust_context = self.format_rust_analysis_context(&context.rust_analysis_results);
        let main_files_count = context.code_files.iter().filter(|f| f.is_main).count();
        let test_files_count = context.code_files.iter().filter(|f| f.is_test).count();
        
        let complex_functions = context.rust_analysis_results
            .get("complexFunctions")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let cpi_calls = context.rust_analysis_results
            .get("cpiCalls")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let unsafe_ops = context.rust_analysis_results
            .get("unsafeOperations")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");

        format!(r#"Analyze this Rust smart contract for risk hotspots and security vulnerabilities:

CODE CONTEXT:
{}

RUST ANALYSIS CONTEXT:
{}

PROJECT METADATA:
- Total Files: {}
- Total Lines: {}
- Main Files: {}
- Test Files: {}
- Complex Functions: {}
- CPI Calls: {}
- Unsafe Operations: {}

ANALYSIS REQUIREMENTS:
1. Identify HIGH RISK hotspots (0.7-1.0 risk score):
   - Critical vulnerabilities and security flaws
   - Complex financial calculations with potential for errors
   - Unsafe operations and potential overflow/underflow
   - Missing access controls and authorization checks
   - PDA derivation logic with potential vulnerabilities
   - CPI calls with insufficient validation

2. Identify MEDIUM RISK hotspots (0.4-0.69 risk score):
   - Potential issues that need attention
   - Moderate complexity areas that could be simplified
   - Some missing validations or error handling
   - Areas with unclear logic or potential edge cases

3. Provide specific recommendations for improvement:
   - Code refactoring suggestions
   - Security improvements
   - Best practice implementations
   - Architecture improvements

4. Focus on these specific areas:
   - Mathematical operations and financial calculations
   - Account validation and PDA derivation
   - External integrations and CPI calls
   - Oracle usage and price feed dependencies
   - State management and reentrancy risks
   - Economic attack vectors and MEV opportunities

For each hotspot, provide:
- Exact file path (relative to project root)
- Specific line range where the risk is located
- Risk score (0-1 scale)
- Components involved (e.g., ["pda_derivation", "lamport_math", "cpi_signer"])
- Clear justification for the risk assessment

Provide your analysis as JSON following the exact schema specified in the system prompt."#,
            code_content, rust_context, context.file_count, context.total_lines,
            main_files_count, test_files_count, complex_functions, cpi_calls, unsafe_ops)
    }

    fn build_documentation_prompt(&self, context: &AnalysisContext) -> String {
        let code_content = self.truncate_code_content(&context.code_files, 8000);
        let rust_context = self.format_rust_analysis_context(&context.rust_analysis_results);
        let main_files_count = context.code_files.iter().filter(|f| f.is_main).count();
        let test_files_count = context.code_files.iter().filter(|f| f.is_test).count();

        format!(r#"Analyze the documentation quality of this Rust smart contract:

CODE CONTEXT:
{}

RUST ANALYSIS CONTEXT:
{}

PROJECT METADATA:
- Total Files: {}
- Total Lines: {}
- Main Files: {}
- Test Files: {}

ANALYSIS REQUIREMENTS:
1. Evaluate code comment quality and coverage throughout the codebase
2. Assess function documentation completeness, especially for public functions
3. Check for README, specification, or documentation files
4. Look for security documentation, audit reports, or security considerations
5. Consider the complexity context from Rust analysis when evaluating documentation needs
6. Pay special attention to complex financial logic that requires detailed documentation

Provide your analysis as JSON following the exact schema specified in the system prompt."#,
            code_content, rust_context, context.file_count, context.total_lines,
            main_files_count, test_files_count)
    }

    fn build_testing_prompt(&self, context: &AnalysisContext) -> String {
        let code_content = self.truncate_code_content(&context.code_files, 8000);
        let rust_context = self.format_rust_analysis_context(&context.rust_analysis_results);
        let test_files_count = context.code_files.iter().filter(|f| f.is_test).count();
        let main_files_count = context.code_files.iter().filter(|f| f.is_main).count();

        format!(r#"Analyze the testing coverage and quality of this Rust smart contract:

CODE CONTEXT:
{}

RUST ANALYSIS CONTEXT:
{}

PROJECT METADATA:
- Total Files: {}
- Total Lines: {}
- Test Files: {}
- Main Files: {}

ANALYSIS REQUIREMENTS:
1. Evaluate unit test coverage and quality
2. Assess integration test presence and comprehensiveness
3. Check for edge case testing, especially for financial operations
4. Look for security-focused tests and vulnerability testing
5. Consider the complexity context from Rust analysis when evaluating testing needs
6. Pay special attention to testing of complex mathematical operations and financial logic

Provide your analysis as JSON following the exact schema specified in the system prompt."#,
            code_content, rust_context, context.file_count, context.total_lines,
            test_files_count, main_files_count)
    }

    fn build_financial_logic_prompt(&self, context: &AnalysisContext) -> String {
        let code_content = self.truncate_code_content(&context.code_files, 10000);
        let rust_context = self.format_rust_analysis_context(&context.rust_analysis_results);
        let complex_functions = context.rust_analysis_results
            .get("complexFunctions")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");

        format!(r#"Analyze the financial logic intricacy of this Rust smart contract:

CODE CONTEXT:
{}

RUST ANALYSIS CONTEXT:
{}

PROJECT METADATA:
- Total Files: {}
- Total Lines: {}
- Complex Functions: {}

ANALYSIS REQUIREMENTS:
1. Evaluate mathematical complexity of calculations and algorithms
2. Assess sophistication of financial algorithms (AMM curves, interest calculations, etc.)
3. Analyze interest rate calculation complexity and mechanisms
4. Examine AMM pricing curve sophistication and mathematical operations
5. Review reward distribution logic complexity and fairness mechanisms
6. Assess risk management algorithms and their mathematical foundations
7. Consider the context from Rust analysis showing arithmetic operations and mathematical complexity

Focus on identifying sophisticated financial mechanisms that require careful audit attention.

Provide your analysis as JSON following the exact schema specified in the system prompt."#,
            code_content, rust_context, context.file_count, context.total_lines, complex_functions)
    }

    fn build_attack_vectors_prompt(&self, context: &AnalysisContext) -> String {
        let code_content = self.truncate_code_content(&context.code_files, 10000);
        let rust_context = self.format_rust_analysis_context(&context.rust_analysis_results);
        let cpi_calls = context.rust_analysis_results
            .get("cpiCalls")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let external_integrations = context.rust_analysis_results
            .get("externalIntegrations")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");

        format!(r#"Analyze potential profit attack vectors in this Rust smart contract:

CODE CONTEXT:
{}

RUST ANALYSIS CONTEXT:
{}

PROJECT METADATA:
- Total Files: {}
- Total Lines: {}
- CPI Calls: {}
- External Integrations: {}

ANALYSIS REQUIREMENTS:
1. Identify flash loan attack opportunities and MEV vulnerabilities
2. Assess sandwich attack risks in trading/swap mechanisms
3. Look for arbitrage opportunities between different price sources
4. Evaluate economic exploit risks where attackers can profit from protocol design
5. Consider the context from Rust analysis showing external integrations and CPI calls
6. Focus on scenarios where attackers can profit without exploiting code bugs

Look for economic vulnerabilities that could be exploited for profit.

Provide your analysis as JSON following the exact schema specified in the system prompt."#,
            code_content, rust_context, context.file_count, context.total_lines,
            cpi_calls, external_integrations)
    }

    fn build_value_at_risk_prompt(&self, context: &AnalysisContext) -> String {
        let code_content = self.truncate_code_content(&context.code_files, 8000);
        let rust_context = self.format_rust_analysis_context(&context.rust_analysis_results);
        let asset_types = context.rust_analysis_results
            .get("assetTypes")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");

        format!(r#"Analyze the value at risk and asset volume implications of this Rust smart contract:

CODE CONTEXT:
{}

RUST ANALYSIS CONTEXT:
{}

PROJECT METADATA:
- Total Files: {}
- Total Lines: {}
- Asset Types: {}

ANALYSIS REQUIREMENTS:
1. Evaluate asset volume complexity and multi-asset handling
2. Assess liquidity risk and market impact potential
3. Analyze market cap implications and economic scale
4. Review economic stakes and value at risk in the protocol
5. Consider the context from Rust analysis showing asset handling complexity
6. Focus on protocols that could handle significant value or have market impact

Assess the economic scale and potential impact of this protocol.

Provide your analysis as JSON following the exact schema specified in the system prompt."#,
            code_content, rust_context, context.file_count, context.total_lines, asset_types)
    }

    // Helper methods
    fn truncate_code_content(&self, code_files: &[CodeFile], max_tokens: usize) -> String {
        let max_chars = max_tokens * 3; // Conservative: 1 token ≈ 3 characters
        let mut content = String::new();

        for file in code_files {
            let file_content = format!(
                "=== FILE: {} ({} lines) ===\n{}\n\n",
                file.path, file.lines, file.content
            );

            if content.len() + file_content.len() > max_chars {
                content.push_str("\n... [Additional files truncated for token limits] ...\n");
                break;
            }

            content.push_str(&file_content);
        }

        content
    }

    fn format_rust_analysis_context(&self, rust_results: &serde_json::Value) -> String {
        if rust_results.is_null() {
            return "No Rust analysis results available.".to_string();
        }

        let total_loc = rust_results
            .get("totalLinesOfCode")
            .and_then(|v| v.as_u64())
            .map(|v| v.to_string())
            .unwrap_or_else(|| "Unknown".to_string());
        let num_functions = rust_results
            .get("numFunctions")
            .and_then(|v| v.as_u64())
            .map(|v| v.to_string())
            .unwrap_or_else(|| "Unknown".to_string());
        let complex_functions = rust_results
            .get("complexFunctions")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let arithmetic_ops = rust_results
            .get("arithmeticOperations")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let cpi_calls = rust_results
            .get("cpiCalls")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let external_integrations = rust_results
            .get("externalIntegrations")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let oracle_usage = rust_results
            .get("oracleUsage")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let asset_types = rust_results
            .get("assetTypes")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let privileged_roles = rust_results
            .get("privilegedRoles")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let dependencies = rust_results
            .get("dependencies")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let error_handling = rust_results
            .get("errorHandling")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let unsafe_ops = rust_results
            .get("unsafeOperations")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");

        format!(
            r#"
RUST ANALYSIS SUMMARY:
- Total Lines of Code: {}
- Total Functions: {}
- Complex Functions: {}
- Arithmetic Operations: {}
- CPI Calls: {}
- External Integrations: {}
- Oracle Usage: {}
- Asset Types: {}
- Privileged Roles: {}
- Dependencies: {}
- Error Handling: {}
- Unsafe Operations: {}
"#,
            total_loc, num_functions, complex_functions, arithmetic_ops, cpi_calls,
            external_integrations, oracle_usage, asset_types, privileged_roles,
            dependencies, error_handling, unsafe_ops
        )
    }

    // Default responses
    fn get_default_code_metrics(&self) -> CodeMetrics {
        CodeMetrics {
            high_risk_hotspots: vec![],
            medium_risk_hotspots: vec![],
            recommendations: vec!["AI analysis failed - unable to provide recommendations".to_string()],
            overall_risk_score: 50.0,
            findings: vec!["AI analysis failed - using default scores".to_string()],
            confidence: 0.0,
        }
    }

    fn get_default_documentation_metrics(&self) -> DocumentationMetrics {
        DocumentationMetrics {
            code_comments_score: 50.0,
            function_documentation_score: 50.0,
            readme_quality_score: 50.0,
            security_documentation_score: 50.0,
            overall_clarity_score: 50.0,
            findings: vec!["AI analysis failed - using default scores".to_string()],
            confidence: 0.0,
        }
    }

    fn get_default_testing_metrics(&self) -> TestingMetrics {
        TestingMetrics {
            unit_test_coverage: 50.0,
            integration_test_coverage: 50.0,
            test_quality_score: 50.0,
            edge_case_testing_score: 50.0,
            security_test_score: 50.0,
            overall_testing_score: 50.0,
            findings: vec!["AI analysis failed - using default scores".to_string()],
            confidence: 0.0,
        }
    }

    fn get_default_financial_logic_metrics(&self) -> FinancialLogicMetrics {
        FinancialLogicMetrics {
            mathematical_complexity_score: 50.0,
            algorithm_sophistication_score: 50.0,
            interest_rate_complexity_score: 50.0,
            amm_pricing_complexity_score: 50.0,
            reward_distribution_complexity_score: 50.0,
            risk_management_complexity_score: 50.0,
            overall_financial_complexity_score: 50.0,
            findings: vec!["AI analysis failed - using default scores".to_string()],
            confidence: 0.0,
        }
    }

    fn get_default_attack_vector_metrics(&self) -> AttackVectorMetrics {
        AttackVectorMetrics {
            flash_loan_attack_risk: 50.0,
            sandwich_attack_risk: 50.0,
            arbitrage_opportunities: 50.0,
            economic_exploit_risk: 50.0,
            overall_attack_vector_score: 50.0,
            findings: vec!["AI analysis failed - using default scores".to_string()],
            confidence: 0.0,
        }
    }

    fn get_default_value_at_risk_metrics(&self) -> ValueAtRiskMetrics {
        ValueAtRiskMetrics {
            asset_volume_complexity: 50.0,
            liquidity_risk_score: 50.0,
            market_cap_implications: 50.0,
            economic_stakes_score: 50.0,
            overall_value_at_risk_score: 50.0,
            findings: vec!["AI analysis failed - using default scores".to_string()],
            confidence: 0.0,
        }
    }
}

struct AnalysisContext {
    code_files: Vec<CodeFile>,
    total_lines: usize,
    rust_analysis_results: serde_json::Value,
    workspace_path: PathBuf,
    file_count: usize,
}

