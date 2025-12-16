//! Build script to check for sol-azy CLI tool
//!
//! This script runs during `cargo build` and checks if sol-azy is available.
//! Note: sol-azy must be built from source (not available on crates.io).
//! Installation should be handled during deployment or manually.

use std::env;
use std::process::Command;

fn main() {
    // Skip check if explicitly disabled (useful for CI/CD)
    if env::var("SKIP_SOLAZY_INSTALL").is_ok() {
        println!("cargo:warning=SKIP_SOLAZY_INSTALL set, skipping sol-azy check");
        return;
    }

    // Check if sol-azy is already installed
    let solazy_path = env::var("SOLAZY_PATH").unwrap_or_else(|_| "sol-azy".to_string());
    let solazy_check = Command::new(&solazy_path).arg("--version").output();

    match solazy_check {
        Ok(output) => {
            if let Ok(version_str) = String::from_utf8(output.stdout) {
                let installed_version = version_str.trim();
                println!("cargo:warning=sol-azy found: {}", installed_version);
                println!("cargo:warning=SAST features will be available");
            }
        }
        Err(_) => {
            println!("cargo:warning=sol-azy not found in PATH. SAST features will be disabled.");
            println!("cargo:warning=To enable SAST, build sol-azy from source:");
            println!("cargo:warning=  git clone https://github.com/FuzzingLabs/sol-azy");
            println!("cargo:warning=  cd sol-azy && cargo build --release");
            println!("cargo:warning=  cp target/release/sol-azy ~/.cargo/bin/");
            println!("cargo:warning=The deployment workflow will handle this automatically.");
        }
    }
}
