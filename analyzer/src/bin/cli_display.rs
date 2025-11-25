//! CLI Display Utilities
//!
//! Provides formatted output, receipts, and progress indicators.

use colored::*;
use std::io::{self, Write};

/// Analysis receipt data structure
#[derive(Debug)]
pub struct AnalysisReceipt {
    pub project_name: String,
    pub files_count: usize,
    pub lines_of_code: u64,
    pub complexity_score: f64,
    pub scores: Scores,
    pub audit_effort: AuditEffort,
    pub hotspots: Hotspots,
    pub report_id: Option<String>,
    pub report_url: Option<String>,
    pub receipt_id: Option<String>,
    pub commit_url: Option<String>,
    pub transaction_signature: Option<String>,
    pub encrypted_by_arcium: bool,
}

#[derive(Debug)]
pub struct Scores {
    pub structural: f64,
    pub security: f64,
    pub systemic: f64,
    pub economic: f64,
    pub total: f64,
}

#[derive(Debug)]
pub struct AuditEffort {
    pub lower: AuditEstimate,
    pub upper: AuditEstimate,
}

#[derive(Debug)]
pub struct AuditEstimate {
    pub min_days: u32,
    pub max_days: u32,
    pub resources: u32,
    pub min_cost: u32,
    pub max_cost: u32,
}

#[derive(Debug)]
pub struct Hotspots {
    pub total: usize,
    pub high_risk: usize,
    pub medium_risk: usize,
    pub low_priority: usize,
}

/// Print the analysis receipt with a beautiful box format
pub fn print_receipt(receipt: &AnalysisReceipt) {
    let width = 60;

    println!();
    print_box_top(width);
    print_box_title("BULWARK ANALYSIS COMPLETE", width);
    print_box_separator(width);

    // Project info
    print_box_row("Project", &receipt.project_name, width);
    print_box_row("Files Analyzed", &receipt.files_count.to_string(), width);
    print_box_row(
        "Lines of Code",
        &format_number(receipt.lines_of_code),
        width,
    );

    print_box_separator(width);
    print_box_section_title("COMPLEXITY SCORES", width);

    // Scores with visual indicators
    print_score_row("Structural", receipt.scores.structural, width);
    print_score_row("Security", receipt.scores.security, width);
    print_score_row("Systemic", receipt.scores.systemic, width);
    print_score_row("Economic", receipt.scores.economic, width);
    print_box_empty(width);
    print_total_score_row("Total Score", receipt.scores.total, width);

    print_box_separator(width);
    print_box_section_title("AUDIT EFFORT ESTIMATE", width);

    print_box_row(
        "Time",
        &format!(
            "{}-{} days",
            receipt.audit_effort.lower.min_days, receipt.audit_effort.upper.max_days
        ),
        width,
    );
    print_box_row(
        "Resources",
        &format!(
            "{}-{} auditors",
            receipt.audit_effort.lower.resources, receipt.audit_effort.upper.resources
        ),
        width,
    );
    print_box_row(
        "Cost",
        &format!(
            "${}-${} USD",
            format_number(receipt.audit_effort.lower.min_cost as u64),
            format_number(receipt.audit_effort.upper.max_cost as u64)
        ),
        width,
    );

    print_box_separator(width);
    print_box_section_title("HOTSPOTS", width);

    print_box_row_colored(
        "High Risk",
        &receipt.hotspots.high_risk.to_string(),
        width,
        "red",
    );
    print_box_row_colored(
        "Medium Risk",
        &receipt.hotspots.medium_risk.to_string(),
        width,
        "yellow",
    );
    print_box_row_colored(
        "Low Priority",
        &receipt.hotspots.low_priority.to_string(),
        width,
        "cyan",
    );

    // Store URLs to print after the box (untruncated)
    let mut report_url_full: Option<String> = None;
    let mut transaction_url_full: Option<String> = None;

    if let Some(ref report_id) = receipt.report_id {
        print_box_separator(width);
        print_box_section_title("REPORT DETAILS", width);
        print_box_row("Report ID", report_id, width);

        if let Some(ref url) = receipt.report_url {
            // Show truncated in box, full below
            let short_url = if url.len() > 35 {
                format!("{}...", &url[..32])
            } else {
                url.clone()
            };
            print_box_row("View Report", &short_url, width);
            report_url_full = Some(url.clone());
        }
    }

    if receipt.encrypted_by_arcium {
        print_box_separator(width);
        print_box_section_title("BLOCKCHAIN RECORD", width);

        if let Some(ref tx) = receipt.transaction_signature {
            let short_tx = if tx.len() > 35 {
                format!("{}...", &tx[..32])
            } else {
                tx.clone()
            };
            print_box_row("Transaction", &short_tx, width);
            transaction_url_full = Some(tx.clone());
        }
        print_box_row("Encrypted By", "Arcium Network", width);
    }

    print_box_bottom(width);

    // Print full URLs below the box for easy copying
    if report_url_full.is_some() || transaction_url_full.is_some() {
        println!();
        println!("{}", "Full URLs (click or copy):".dimmed());
        if let Some(url) = report_url_full {
            println!("  {} {}", "Report:".cyan(), url);
        }
        if let Some(url) = transaction_url_full {
            println!("  {} {}", "Transaction:".cyan(), url);
        }
    }

    println!();
}

/// Print a single factor analysis result
pub fn print_factor_result(factor_name: &str, result: &serde_json::Value) {
    println!();
    println!(
        "{}",
        format!("═══ {} ═══", factor_name.to_uppercase())
            .cyan()
            .bold()
    );
    println!();

    // Pretty print the JSON result
    if let Ok(pretty) = serde_json::to_string_pretty(result) {
        // Colorize JSON
        for line in pretty.lines() {
            if line.contains(':') {
                let parts: Vec<&str> = line.splitn(2, ':').collect();
                if parts.len() == 2 {
                    print!("{}", parts[0].blue());
                    print!(":");
                    println!("{}", parts[1]);
                } else {
                    println!("{}", line);
                }
            } else {
                println!("{}", line);
            }
        }
    } else {
        println!("{:?}", result);
    }
    println!();
}

/// Print category analysis results
pub fn print_category_results(category: &str, results: &serde_json::Value) {
    println!();
    let title = format!(" {} ANALYSIS ", category.to_uppercase());
    println!("{}", title.on_blue().white().bold());
    println!();

    if let Some(obj) = results.as_object() {
        for (key, value) in obj {
            let display_name = key.replace('_', " ");
            let display_name = display_name
                .split_whitespace()
                .map(|w| {
                    let mut chars = w.chars();
                    match chars.next() {
                        None => String::new(),
                        Some(c) => c.to_uppercase().chain(chars).collect(),
                    }
                })
                .collect::<Vec<_>>()
                .join(" ");

            if let Some(n) = value.as_f64() {
                println!("  {} {} {:.2}", "▸".cyan(), display_name.white(), n);
            } else if let Some(n) = value.as_i64() {
                println!("  {} {} {}", "▸".cyan(), display_name.white(), n);
            } else if let Some(b) = value.as_bool() {
                println!(
                    "  {} {} {}",
                    "▸".cyan(),
                    display_name.white(),
                    if b { "Yes".green() } else { "No".red() }
                );
            } else if let Some(s) = value.as_str() {
                println!("  {} {} {}", "▸".cyan(), display_name.white(), s);
            } else {
                // Nested object - recurse one level
                if let Some(nested) = value.as_object() {
                    println!("  {} {}", "▸".cyan(), display_name.white().bold());
                    for (k, v) in nested {
                        if let Some(n) = v.as_f64() {
                            println!("      {} {:.2}", k, n);
                        } else if let Some(n) = v.as_i64() {
                            println!("      {} {}", k, n);
                        }
                    }
                }
            }
        }
    }
    println!();
}

/// Print an offline receipt (when server is unreachable)
pub fn print_offline_receipt(receipt: &AnalysisReceipt) {
    let width = 60;

    println!();
    print_box_top(width);
    print_box_title_colored("ANALYSIS COMPLETE (OFFLINE)", width, "yellow");
    print_box_separator(width);

    // Project info
    print_box_row("Project", &receipt.project_name, width);
    print_box_row("Files Analyzed", &receipt.files_count.to_string(), width);
    print_box_row(
        "Lines of Code",
        &format_number(receipt.lines_of_code),
        width,
    );

    print_box_separator(width);
    print_box_section_title("COMPLEXITY SCORES", width);

    print_score_row("Structural", receipt.scores.structural, width);
    print_score_row("Security", receipt.scores.security, width);
    print_score_row("Systemic", receipt.scores.systemic, width);
    print_score_row("Economic", receipt.scores.economic, width);
    print_box_empty(width);
    print_total_score_row("Total Score", receipt.scores.total, width);

    print_box_separator(width);
    print_box_row_colored("Status", "Queued for sync", width, "yellow");
    print_box_row("Sync with", "'bulwark sync'", width);

    print_box_bottom(width);
    println!();

    print_warning("Results queued for submission. Run 'bulwark sync' when online.");
}

// ============ Box Drawing Helpers ============

fn print_box_top(width: usize) {
    println!("╔{}╗", "═".repeat(width - 2));
}

fn print_box_bottom(width: usize) {
    println!("╚{}╝", "═".repeat(width - 2));
}

fn print_box_separator(width: usize) {
    println!("╠{}╣", "═".repeat(width - 2));
}

fn print_box_empty(width: usize) {
    println!("║{}║", " ".repeat(width - 2));
}

fn print_box_title(title: &str, width: usize) {
    let padding = (width - 2 - title.len()) / 2;
    let extra = (width - 2 - title.len()) % 2;
    println!(
        "║{}{}{}║",
        " ".repeat(padding),
        title.cyan().bold(),
        " ".repeat(padding + extra)
    );
}

fn print_box_title_colored(title: &str, width: usize, color: &str) {
    let padding = (width - 2 - title.len()) / 2;
    let extra = (width - 2 - title.len()) % 2;
    let colored_title = match color {
        "yellow" => title.yellow().bold(),
        "red" => title.red().bold(),
        "green" => title.green().bold(),
        _ => title.cyan().bold(),
    };
    println!(
        "║{}{}{}║",
        " ".repeat(padding),
        colored_title,
        " ".repeat(padding + extra)
    );
}

fn print_box_section_title(title: &str, width: usize) {
    let content_width = width - 4; // Account for "║ " and " ║"
    println!(
        "║ {:<width$} ║",
        title.white().bold(),
        width = content_width
    );
}

fn print_box_row(label: &str, value: &str, width: usize) {
    let content_width = width - 4;
    let label_width = 18;
    let value_width = content_width - label_width;

    // Truncate value if too long
    let display_value = if value.len() > value_width {
        format!("{}...", &value[..value_width.saturating_sub(3)])
    } else {
        value.to_string()
    };

    // Build the row without colored formatting for accurate width
    let label_padded = format!("{:<width$}", label, width = label_width);
    let value_padded = format!("{:<width$}", display_value, width = value_width);

    println!("║ {}{} ║", label_padded.dimmed(), value_padded);
}

fn print_box_row_colored(label: &str, value: &str, width: usize, color: &str) {
    let content_width = width - 4;
    let label_width = 18;
    let value_width = content_width - label_width;

    // Pad value first, then colorize to avoid width calculation issues
    let value_padded = format!("{:<width$}", value, width = value_width);
    let colored_value = match color {
        "red" => value_padded.red().to_string(),
        "yellow" => value_padded.yellow().to_string(),
        "green" => value_padded.green().to_string(),
        "cyan" => value_padded.cyan().to_string(),
        _ => value_padded,
    };

    let label_padded = format!("{:<width$}", label, width = label_width);
    println!("║ {}{} ║", label_padded.dimmed(), colored_value);
}

fn print_score_row(label: &str, score: f64, width: usize) {
    let content_width = width - 4;
    let label_width = 18;
    let bar_width = 20;
    let filled = (score / 100.0 * bar_width as f64).round() as usize;

    let bar = format!(
        "[{}{}]",
        "█".repeat(filled.min(bar_width)),
        "░".repeat((bar_width - filled).max(0))
    );

    let colored_bar = if score >= 70.0 {
        bar.green()
    } else if score >= 40.0 {
        bar.yellow()
    } else {
        bar.red()
    };

    let score_str = format!("{:.1}", score);
    // Bar is 22 chars ([...]), score is ~5 chars, need padding to fill remaining space
    let value_width = content_width - label_width;
    let padding = value_width.saturating_sub(22 + 1 + score_str.len());

    let label_padded = format!("{:<width$}", label, width = label_width);
    println!(
        "║ {}{} {}{} ║",
        label_padded.dimmed(),
        colored_bar,
        score_str,
        " ".repeat(padding)
    );
}

fn print_total_score_row(label: &str, score: f64, width: usize) {
    let content_width = width - 4;
    let label_width = 18;
    let value_width = content_width - label_width;

    let score_str = format!("{:.1}/100", score);
    let padding = value_width.saturating_sub(score_str.len());

    let colored_score = if score >= 70.0 {
        score_str.green().bold()
    } else if score >= 40.0 {
        score_str.yellow().bold()
    } else {
        score_str.red().bold()
    };

    let label_padded = format!("{:<width$}", label, width = label_width);
    println!(
        "║ {}{}{} ║",
        label_padded.white().bold(),
        colored_score,
        " ".repeat(padding)
    );
}

fn format_number(n: u64) -> String {
    let s = n.to_string();
    let mut result = String::new();
    for (i, c) in s.chars().rev().enumerate() {
        if i > 0 && i % 3 == 0 {
            result.push(',');
        }
        result.push(c);
    }
    result.chars().rev().collect()
}

// ============ Status Messages ============

pub fn print_success(message: &str) {
    println!("{} {}", "✓".green().bold(), message.green());
}

pub fn print_error(message: &str) {
    println!("{} {}", "✗".red().bold(), message.red());
}

pub fn print_warning(message: &str) {
    println!("{} {}", "⚠".yellow().bold(), message.yellow());
}

pub fn print_info(message: &str) {
    println!("{} {}", "ℹ".blue().bold(), message);
}

// ============ Spinner ============

pub struct Spinner {
    message: String,
    done: bool,
}

impl Spinner {
    pub fn new(message: &str) -> Self {
        print!("{} {} ", "⠋".cyan(), message);
        io::stdout().flush().unwrap();

        Self {
            message: message.to_string(),
            done: false,
        }
    }

    pub fn success(&mut self, message: &str) {
        self.done = true;
        print!(
            "\r{} {} {}\n",
            "✓".green().bold(),
            self.message,
            message.green()
        );
        io::stdout().flush().unwrap();
    }

    pub fn fail(&mut self, message: &str) {
        self.done = true;
        print!(
            "\r{} {} {}\n",
            "✗".red().bold(),
            self.message,
            message.red()
        );
        io::stdout().flush().unwrap();
    }

    pub fn update(&mut self, message: &str) {
        print!("\r{} {} ", "⠋".cyan(), message);
        io::stdout().flush().unwrap();
        self.message = message.to_string();
    }
}

impl Drop for Spinner {
    fn drop(&mut self) {
        if !self.done {
            println!();
        }
    }
}

// ============ Banner ============

pub fn print_banner() {
    println!();
    println!(
        "{}",
        r#"
    ╔════════════════════════════════════════════════════════════════╗
    ║                                                                ║
    ║   ██████╗ ██╗   ██╗██╗     ██╗    ██╗ █████╗ ██████╗ ██╗  ██╗  ║
    ║   ██╔══██╗██║   ██║██║     ██║    ██║██╔══██╗██╔══██╗██║ ██╔╝  ║
    ║   ██████╔╝██║   ██║██║     ██║ █╗ ██║███████║██████╔╝█████╔╝   ║
    ║   ██╔══██╗██║   ██║██║     ██║███╗██║██╔══██║██╔══██╗██╔═██╗   ║
    ║   ██████╔╝╚██████╔╝███████╗╚███╔███╔╝██║  ██║██║  ██║██║  ██╗  ║
    ║   ╚═════╝  ╚═════╝ ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝  ║
    ║                                                                ║
    ║            Smart Contract Security Analysis                    ║
    ╚════════════════════════════════════════════════════════════════╝
    "#
        .cyan()
    );
}
