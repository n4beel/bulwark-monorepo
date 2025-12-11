#!/bin/bash
# Setup script for Rust Analyzer Server on EC2

set -e

echo "🚀 Setting up Rust Analyzer Server..."

# Configuration
ANALYZER_DIR="${ANALYZER_DIR:-/home/ubuntu/apps/staging/analyzer}"
SERVICE_NAME="rust-server.service"
PORT="${PORT:-8080}"
SHARED_WORKSPACE_PATH="${SHARED_WORKSPACE_PATH:-/tmp/shared/workspaces}"

# Check if analyzer directory exists
if [ ! -d "$ANALYZER_DIR" ]; then
    echo "❌ Analyzer directory not found: $ANALYZER_DIR"
    echo "Please set ANALYZER_DIR environment variable or ensure the analyzer code is cloned to the expected location"
    exit 1
fi

cd "$ANALYZER_DIR"

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Rust/Cargo is not installed. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

echo "📦 Building Rust analyzer server (release mode)..."
cargo build --release

if [ ! -f "target/release/server" ]; then
    echo "❌ Build failed - server binary not found"
    exit 1
fi

echo "✅ Build successful!"

# Create shared workspace directory
echo "📁 Creating shared workspace directory..."
sudo mkdir -p "$SHARED_WORKSPACE_PATH"
sudo chown -R ubuntu:ubuntu "$SHARED_WORKSPACE_PATH"
sudo chmod 755 "$SHARED_WORKSPACE_PATH"

# Create systemd service file
echo "⚙️  Creating systemd service file..."
sudo tee "/etc/systemd/system/$SERVICE_NAME" > /dev/null <<EOF
[Unit]
Description=Bulwark Rust Analyzer HTTP Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$ANALYZER_DIR
Environment="PORT=$PORT"
Environment="SHARED_WORKSPACE_PATH=$SHARED_WORKSPACE_PATH"
Environment="RUST_LOG=info"
ExecStart=$ANALYZER_DIR/target/release/server
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rust-analyzer

# Security settings
NoNewPrivileges=true
PrivateTmp=true

# Resource limits
LimitNOFILE=65536
MemoryLimit=2G

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "🔄 Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable service
echo "✅ Enabling service to start on boot..."
sudo systemctl enable "$SERVICE_NAME"

# Start service
echo "🚀 Starting Rust analyzer server..."
sudo systemctl start "$SERVICE_NAME"

# Wait a moment for service to start
sleep 2

# Check status
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Rust analyzer server is running!"
    echo ""
    echo "📊 Service Status:"
    sudo systemctl status "$SERVICE_NAME" --no-pager -l
    echo ""
    echo "🧪 Testing health endpoint..."
    sleep 1
    if curl -s "http://localhost:$PORT/health" > /dev/null; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed - check logs: sudo journalctl -u $SERVICE_NAME -f"
    fi
else
    echo "❌ Service failed to start. Check logs:"
    echo "   sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

echo ""
echo "📝 Useful commands:"
echo "   Check status:  sudo systemctl status $SERVICE_NAME"
echo "   View logs:     sudo journalctl -u $SERVICE_NAME -f"
echo "   Restart:        sudo systemctl restart $SERVICE_NAME"
echo "   Stop:           sudo systemctl stop $SERVICE_NAME"
echo "   Test health:    curl http://localhost:$PORT/health"

