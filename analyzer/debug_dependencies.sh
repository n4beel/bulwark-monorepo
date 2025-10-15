#!/bin/bash

# Debug script for dependencies analysis
echo "🔍 Debugging Dependencies Analysis"
echo "=================================="

# Set environment variables for logging
export RUST_LOG=info

# Test with the Raydium contract
echo "Testing with Raydium contract..."
echo "Workspace path: /home/n4beel/Desktop/raydium-amm-master"

# Check if the workspace exists
if [ -d "/home/n4beel/Desktop/raydium-amm-master" ]; then
    echo "✅ Workspace exists"
    
    # List contents
    echo "📁 Workspace contents:"
    ls -la /home/n4beel/Desktop/raydium-amm-master/
    
    echo ""
    echo "📁 Program directory contents:"
    ls -la /home/n4beel/Desktop/raydium-amm-master/program/ 2>/dev/null || echo "❌ No program directory"
    
    echo ""
    echo "📄 Cargo.toml files:"
    find /home/n4beel/Desktop/raydium-amm-master -name "Cargo.toml" -type f
    
else
    echo "❌ Workspace does not exist"
fi

echo ""
echo "🚀 Running dependencies analysis with verbose logging..."
echo "========================================================"

# Run the test with verbose logging
cd /home/n4beel/Desktop/Projects/MySecurity/rust-analyzer
RUST_LOG=info cargo run --bin cli analyze --path /home/n4beel/Desktop/raydium-amm-master --verbose 2>&1 | grep -E "(DEPENDENCIES DEBUG|Dependencies analysis|Total dependencies|Tier.*dependencies)"
