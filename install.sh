#!/bin/bash
# Bulwark CLI Installation Script

set -e

REPO="n4beel/bulwark-monorepo"  # Update this to your actual GitHub repo
LATEST_VERSION=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/' | sed 's/^v//')

if [ -z "$LATEST_VERSION" ]; then
    echo "❌ Failed to fetch latest version. Please check your internet connection."
    exit 1
fi

echo "📦 Installing Bulwark CLI v${LATEST_VERSION}..."

# Detect platform
OS="$(uname -s)"
ARCH="$(uname -m)"

case "${OS}" in
    Linux*)
        if [ "${ARCH}" = "x86_64" ]; then
            TARGET="x86_64-unknown-linux-gnu"
        else
            echo "❌ Unsupported architecture: ${ARCH}"
            echo "   Supported: x86_64"
            exit 1
        fi
        ;;
    Darwin*)
        if [ "${ARCH}" = "arm64" ]; then
            TARGET="aarch64-apple-darwin"
        elif [ "${ARCH}" = "x86_64" ]; then
            TARGET="x86_64-apple-darwin"
        else
            echo "❌ Unsupported architecture: ${ARCH}"
            echo "   Supported: x86_64, arm64"
            exit 1
        fi
        ;;
    *)
        echo "❌ Unsupported OS: ${OS}"
        echo "   Supported: Linux, macOS"
        exit 1
        ;;
esac

ARCHIVE_NAME="bulwark-${LATEST_VERSION}-${TARGET}.tar.gz"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/v${LATEST_VERSION}/${ARCHIVE_NAME}"

echo "📥 Downloading from ${DOWNLOAD_URL}..."

# Create temporary directory
TMP_DIR=$(mktemp -d)
trap "rm -rf ${TMP_DIR}" EXIT

# Download and extract
cd "${TMP_DIR}"
curl -L -o "${ARCHIVE_NAME}" "${DOWNLOAD_URL}"

# Verify checksum if available (optional - won't fail installation)
CHECKSUM_URL="https://github.com/${REPO}/releases/download/v${LATEST_VERSION}/${ARCHIVE_NAME}.sha256"
CHECKSUM_FILE="${ARCHIVE_NAME}.sha256"
if curl -f -s -o "${CHECKSUM_FILE}" "${CHECKSUM_URL}" 2>/dev/null && [ -s "${CHECKSUM_FILE}" ]; then
    echo "🔍 Verifying checksum..."
    # Extract expected checksum (first field before space, remove any trailing whitespace)
    EXPECTED_CHECKSUM=$(awk '{print $1}' "${CHECKSUM_FILE}" | tr -d '\n\r \t')
    # Calculate actual checksum of downloaded file
    DOWNLOADED_CHECKSUM=$(sha256sum "${ARCHIVE_NAME}" 2>/dev/null | awk '{print $1}')
    
    if [ -n "${DOWNLOADED_CHECKSUM}" ] && [ -n "${EXPECTED_CHECKSUM}" ]; then
        if [ "${DOWNLOADED_CHECKSUM}" = "${EXPECTED_CHECKSUM}" ]; then
            echo "✅ Checksum verified"
        else
            echo "⚠️  Checksum mismatch (continuing anyway)"
            echo "   Expected: ${EXPECTED_CHECKSUM}"
            echo "   Got:      ${DOWNLOADED_CHECKSUM}"
            echo "   Installation will continue, but file integrity could not be verified."
        fi
    else
        echo "⚠️  Could not verify checksum (skipping verification)"
    fi
else
    echo "⚠️  Checksum file not available (skipping verification)"
fi

# Extract
tar xzf "${ARCHIVE_NAME}"

# Determine install location
if [ -w "/usr/local/bin" ]; then
    INSTALL_DIR="/usr/local/bin"
elif [ -w "${HOME}/.local/bin" ]; then
    INSTALL_DIR="${HOME}/.local/bin"
    mkdir -p "${INSTALL_DIR}"
else
    INSTALL_DIR="${HOME}/bin"
    mkdir -p "${INSTALL_DIR}"
fi

# Install
echo "📦 Installing to ${INSTALL_DIR}..."
cp bulwark "${INSTALL_DIR}/"
chmod +x "${INSTALL_DIR}/bulwark"

# Verify installation
if command -v bulwark &> /dev/null; then
    echo "✅ Bulwark CLI installed successfully!"
    echo ""
    echo "Run 'bulwark --help' to get started."
    echo ""
    echo "Quick start:"
    echo "  bulwark login          # Authenticate"
    echo "  bulwark analyze <path> # Analyze a project"
else
    echo "⚠️  Installation complete, but 'bulwark' command not found in PATH."
    echo "   Please add ${INSTALL_DIR} to your PATH:"
    echo ""
    echo "   export PATH=\"\${PATH}:${INSTALL_DIR}\""
    echo ""
    echo "   Add this to your ~/.bashrc or ~/.zshrc to make it permanent."
fi

