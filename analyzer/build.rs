//! Build script to automatically install sol-azy CLI tool
//!
//! This script runs during `cargo build` and ensures sol-azy is installed
//! so that SAST features are available.

use std::process::Command;
use std::env;

// Pin sol-azy version for consistency
// Update this when upgrading to a new version
// Check sol-azy releases: https://github.com/fuzzinglabs/sol-azy/releases
const SOLAZY_VERSION: &str = "0.1.0"; // TODO: Update when upgrading

fn main() {
    // Skip installation if explicitly disabled (useful for CI/CD)
    if env::var("SKIP_SOLAZY_INSTALL").is_ok() {
        println!("cargo:warning=SKIP_SOLAZY_INSTALL set, skipping sol-azy installation");
        return;
    }

    // Allow version override for testing
    let version_to_install = env::var("SOLAZY_VERSION_OVERRIDE")
        .unwrap_or_else(|_| SOLAZY_VERSION.to_string());

    // Check if sol-azy is already installed
    let solazy_path = env::var("SOLAZY_PATH").unwrap_or_else(|_| "sol-azy".to_string());
    let solazy_check = Command::new(&solazy_path)
        .arg("--version")
        .output();
    
    if solazy_check.is_err() {
        println!("cargo:warning=sol-azy not found, installing version {}...", version_to_install);
        println!("cargo:warning=This may take a few minutes on first build...");
        
        let install_result = Command::new("cargo")
            .args(&["install", "sol-azy", "--version", &version_to_install])
            .status();
        
        match install_result {
            Ok(status) if status.success() => {
                println!("cargo:warning=sol-azy v{} installed successfully", version_to_install);
            }
            Ok(_) => {
                println!("cargo:warning=Failed to install sol-azy v{}. SAST features will be disabled.", version_to_install);
                println!("cargo:warning=To enable SAST, manually install: cargo install sol-azy --version {}", version_to_install);
            }
            Err(e) => {
                println!("cargo:warning=Error installing sol-azy v{}: {}. SAST features will be disabled.", version_to_install, e);
                println!("cargo:warning=To enable SAST, manually install: cargo install sol-azy --version {}", version_to_install);
            }
        }
    } else {
        // Check version compatibility
        if let Ok(output) = solazy_check {
            if let Ok(version_str) = String::from_utf8(output.stdout) {
                let installed_version = version_str.trim();
                println!("cargo:warning=sol-azy already installed: {}", installed_version);
                
                // Warn if version doesn't match (but don't fail build)
                if !installed_version.contains(&version_to_install) {
                    println!("cargo:warning=Version mismatch: installed={}, required={}", installed_version, version_to_install);
                    println!("cargo:warning=Consider updating: cargo install sol-azy --version {} --force", version_to_install);
                }
            }
        }
    }
}
