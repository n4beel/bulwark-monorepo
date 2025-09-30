//! Main analysis engine

use crate::{
    config::AnalyzerConfig,
    error::{AnalyzerError, Result},
    metrics::{AggregatedMetrics, FileMetrics, RepoMetrics, RiskSummary},
    output::AnalysisReport,
    visitor::FunctionVisitor,
};
use std::path::{Path, PathBuf};
use syn::File as SynFile;
use walkdir::WalkDir;

pub struct AnalyzerEngine {
    config: AnalyzerConfig,
}

impl AnalyzerEngine {
    pub fn new(config: AnalyzerConfig) -> Result<Self> {
        // Validate configuration
        if !config.root_path.exists() {
            return Err(AnalyzerError::FileNotFound {
                path: config.root_path.clone(),
            });
        }

        Ok(Self { config })
    }

    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let path = path.as_ref();
        if !path.exists() {
            return Err(AnalyzerError::FileNotFound {
                path: path.to_path_buf(),
            });
        }

        let config = AnalyzerConfig {
            root_path: path.to_path_buf(),
            ..Default::default()
        };

        Ok(Self { config })
    }

    pub fn analyze(&self) -> Result<AnalysisReport> {
        log::info!("Starting repository analysis: {:?}", self.config.root_path);

        let rust_files = self.discover_rust_files()?;
        log::info!("Found {} Rust files to analyze", rust_files.len());

        let mut file_metrics = Vec::new();
        let mut total_lines = 0;
        let mut total_functions = 0;

        for file_path in rust_files {
            log::debug!("Analyzing file: {:?}", file_path);

            match self.analyze_file(&file_path) {
                Ok(metrics) => {
                    total_lines += metrics.lines_of_code;
                    total_functions += metrics.function_count;
                    file_metrics.push(metrics);
                }
                Err(e) => {
                    log::warn!("Failed to analyze file {:?}: {}", file_path, e);
                    // Continue with other files
                }
            }
        }

        let aggregated = self.calculate_aggregated_metrics(&file_metrics);
        let risk_summary = self.assess_risk(&aggregated, &file_metrics);

        let repo_metrics = RepoMetrics {
            root_path: self.config.root_path.clone(),
            file_count: file_metrics.len() as u32,
            total_lines_of_code: total_lines,
            total_function_count: total_functions,
            files: file_metrics,
            aggregated,
            semantic_patterns: std::collections::HashMap::new(), // TODO: implement
            risk_summary,
        };

        Ok(AnalysisReport::new(repo_metrics))
    }

    pub fn analyze_single_file(&self) -> Result<FileMetrics> {
        if self.config.root_path.is_file() {
            self.analyze_file(&self.config.root_path)
        } else {
            Err(AnalyzerError::AnalysisError {
                message: "Path is not a file".to_string(),
            })
        }
    }

    fn discover_rust_files(&self) -> Result<Vec<PathBuf>> {
        let mut rust_files = Vec::new();

        for entry in WalkDir::new(&self.config.root_path)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();

            // Skip directories
            if !path.is_file() {
                continue;
            }

            // Check file extension
            if let Some(ext) = path.extension() {
                if ext != "rs" {
                    continue;
                }
            } else {
                continue;
            }

            // Apply filters
            if self.should_skip_file(path) {
                log::debug!("Skipping file: {:?}", path);
                continue;
            }

            // Check file size
            if let Ok(metadata) = path.metadata() {
                if metadata.len() > self.config.max_file_size as u64 {
                    log::warn!("Skipping large file: {:?} ({} bytes)", path, metadata.len());
                    continue;
                }
            }

            rust_files.push(path.to_path_buf());
        }

        Ok(rust_files)
    }

    fn should_skip_file(&self, path: &Path) -> bool {
        let path_str = path.to_string_lossy();

        // Check exclude patterns
        for pattern in &self.config.exclude_patterns {
            if glob::Pattern::new(pattern)
                .map(|p| p.matches(&path_str))
                .unwrap_or(false)
            {
                return true;
            }
        }

        // Check include flags
        if !self.config.include_tests
            && (path_str.contains("/tests/")
                || path_str.contains("test.rs")
                || path_str.ends_with("_test.rs"))
        {
            return true;
        }

        if !self.config.include_benches
            && (path_str.contains("/benches/")
                || path_str.contains("bench.rs")
                || path_str.ends_with("_bench.rs"))
        {
            return true;
        }

        if !self.config.include_examples && path_str.contains("/examples/") {
            return true;
        }

        false
    }

    fn analyze_file(&self, path: &Path) -> Result<FileMetrics> {
        let content = std::fs::read_to_string(path)?;

        // Parse the file
        let syntax_tree: SynFile =
            syn::parse_file(&content).map_err(|e| AnalyzerError::ParseError {
                path: path.to_path_buf(),
                source: e,
            })?;

        // Create visitor and analyze
        let mut visitor = FunctionVisitor::new(&content);
        syn::visit::visit_file(&mut visitor, &syntax_tree);

        // Calculate lines of code (excluding comments and empty lines)
        let lines_of_code = self.count_lines_of_code(&content);

        // Calculate aggregated metrics for this file
        let aggregated = self.calculate_file_aggregated_metrics(&visitor.functions);

        Ok(FileMetrics {
            path: path.to_path_buf(),
            lines_of_code,
            function_count: visitor.functions.len() as u32,
            functions: visitor.functions,
            aggregated,
            semantic_tags: Vec::new(), // TODO: collect from functions
        })
    }

    fn count_lines_of_code(&self, content: &str) -> u32 {
        let mut count = 0;
        let mut in_block_comment = false;

        for line in content.lines() {
            let trimmed = line.trim();

            // Handle block comments
            if trimmed.starts_with("/*") {
                in_block_comment = true;
            }
            if in_block_comment {
                if trimmed.ends_with("*/") {
                    in_block_comment = false;
                }
                continue;
            }

            // Skip empty lines and line comments
            if trimmed.is_empty() || trimmed.starts_with("//") {
                continue;
            }

            count += 1;
        }

        count
    }

    fn calculate_file_aggregated_metrics(
        &self,
        functions: &[crate::metrics::FunctionMetrics],
    ) -> AggregatedMetrics {
        let mut total_arithmetic_ops = 0;
        let mut total_math_functions = 0;
        let mut total_unsafe_ops = 0;
        let mut complexity_sum = 0;
        let mut max_complexity = 0;

        for func in functions {
            total_arithmetic_ops += func.arithmetic.total_ops();
            total_math_functions += func.math_functions.total_calls();
            total_unsafe_ops +=
                func.safety.unsafe_blocks + func.safety.unwrap_calls + func.safety.panic_calls;
            complexity_sum += func.control_flow.cyclomatic_complexity;
            max_complexity = max_complexity.max(func.control_flow.cyclomatic_complexity);
        }

        let avg_complexity = if functions.is_empty() {
            0.0
        } else {
            complexity_sum as f64 / functions.len() as f64
        };

        let safety_ratio = if total_arithmetic_ops == 0 {
            1.0
        } else {
            // Calculate safe operations
            let safe_ops: u32 = functions
                .iter()
                .map(|f| {
                    f.arithmetic.checked_add
                        + f.arithmetic.checked_sub
                        + f.arithmetic.checked_mul
                        + f.arithmetic.checked_div
                        + f.arithmetic.saturating_add
                        + f.arithmetic.saturating_sub
                        + f.arithmetic.saturating_mul
                })
                .sum();
            safe_ops as f64 / total_arithmetic_ops as f64
        };

        AggregatedMetrics {
            total_arithmetic_ops,
            total_math_functions,
            avg_cyclomatic_complexity: avg_complexity,
            max_cyclomatic_complexity: max_complexity,
            total_unsafe_ops,
            safety_ratio,
            complexity_score: avg_complexity
                + (total_arithmetic_ops as f64 * 0.1)
                + (total_math_functions as f64 * 0.2),
        }
    }

    fn calculate_aggregated_metrics(&self, files: &[FileMetrics]) -> AggregatedMetrics {
        let mut total_arithmetic_ops = 0;
        let mut total_math_functions = 0;
        let mut total_unsafe_ops = 0;
        let mut complexity_sum = 0.0;
        let mut max_complexity = 0;
        let mut function_count = 0;

        for file in files {
            total_arithmetic_ops += file.aggregated.total_arithmetic_ops;
            total_math_functions += file.aggregated.total_math_functions;
            total_unsafe_ops += file.aggregated.total_unsafe_ops;
            complexity_sum +=
                file.aggregated.avg_cyclomatic_complexity * file.function_count as f64;
            max_complexity = max_complexity.max(file.aggregated.max_cyclomatic_complexity);
            function_count += file.function_count;
        }

        let avg_complexity = if function_count == 0 {
            0.0
        } else {
            complexity_sum / function_count as f64
        };

        let safety_ratio = if total_arithmetic_ops == 0 {
            1.0
        } else {
            // This is a simplified calculation - in practice you'd want to aggregate properly
            files
                .iter()
                .map(|f| f.aggregated.safety_ratio * f.aggregated.total_arithmetic_ops as f64)
                .sum::<f64>()
                / total_arithmetic_ops as f64
        };

        AggregatedMetrics {
            total_arithmetic_ops,
            total_math_functions,
            avg_cyclomatic_complexity: avg_complexity,
            max_cyclomatic_complexity: max_complexity,
            total_unsafe_ops,
            safety_ratio,
            complexity_score: avg_complexity
                + (total_arithmetic_ops as f64 * 0.1)
                + (total_math_functions as f64 * 0.2),
        }
    }

    fn assess_risk(&self, aggregated: &AggregatedMetrics, _files: &[FileMetrics]) -> RiskSummary {
        let mut risk_factors = Vec::new();
        let mut recommendations = Vec::new();
        let mut risk_score = 0.0;

        // Assess safety ratio
        if aggregated.safety_ratio < 0.8 {
            risk_factors
                .push("Low safety ratio - many unchecked arithmetic operations".to_string());
            recommendations.push("Consider using more checked arithmetic operations".to_string());
            risk_score += 20.0;
        }

        // Assess complexity
        if aggregated.avg_cyclomatic_complexity > 10.0 {
            risk_factors.push("High average cyclomatic complexity".to_string());
            recommendations.push("Consider breaking down complex functions".to_string());
            risk_score += 15.0;
        }

        // Assess unsafe operations
        if aggregated.total_unsafe_ops > 10 {
            risk_factors.push("High number of potentially unsafe operations".to_string());
            recommendations.push("Review unwrap() and panic!() usage".to_string());
            risk_score += 25.0;
        }

        let risk_level = match risk_score {
            0.0..=25.0 => "low",
            25.1..=50.0 => "medium",
            50.1..=75.0 => "high",
            _ => "critical",
        }
        .to_string();

        RiskSummary {
            risk_level,
            risk_factors,
            recommendations,
            risk_score,
        }
    }
}
