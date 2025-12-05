# Release Guide

This guide explains how to create and publish new releases of the Bulwark CLI.

## Prerequisites

1. **GitHub Secrets**: Ensure `CLI_API_KEY` is set in your repository secrets:
   - Go to Settings → Secrets and variables → Actions
   - Add `CLI_API_KEY` with your CLI API key value

2. **Version Number**: Update the version in `analyzer/Cargo.toml` before creating a release.

## Creating a Release

### Option 1: Using GitHub CLI (Recommended)

```bash
# 1. Update version in analyzer/Cargo.toml
# 2. Commit and push changes
git add analyzer/Cargo.toml
git commit -m "Bump version to X.Y.Z"
git push

# 3. Create and push a tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

The GitHub Actions workflow will automatically:
- Build binaries for Linux (x86_64), macOS (Intel), and macOS (Apple Silicon)
- Create a GitHub release
- Upload binaries and checksums
- Generate release notes

### Option 2: Using GitHub Web Interface

1. Go to **Releases** → **Draft a new release**
2. Create a new tag: `vX.Y.Z` (e.g., `v0.2.0`)
3. Fill in release title and description
4. Click **Publish release**

The workflow will build and attach binaries automatically.

### Option 3: Manual Build (For Testing)

```bash
# Build for your current platform
cd analyzer
cargo build --release --bin bulwark

# The binary will be at:
# target/release/bulwark (Linux)
# target/release/bulwark (macOS)
```

## Release Workflow

The `.github/workflows/release.yml` workflow:

1. **Triggers on**: Tags matching `v*` pattern
2. **Builds for**:
   - `x86_64-unknown-linux-gnu` (Linux)
   - `x86_64-apple-darwin` (macOS Intel)
   - `aarch64-apple-darwin` (macOS Apple Silicon)
3. **Creates**: GitHub release with binaries and checksums
4. **Duration**: ~10-15 minutes

## Verifying a Release

After the workflow completes:

1. Check the [Actions tab](https://github.com/n4beel/bulwark-monorepo/actions) for workflow status
2. Visit the [Releases page](https://github.com/n4beel/bulwark-monorepo/releases)
3. Verify binaries are attached
4. Test installation:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/n4beel/bulwark-monorepo/main/install.sh | bash
   ```

## Troubleshooting

### Build Fails

- Check that `CLI_API_KEY` secret is set (optional, but recommended)
- Verify Rust toolchain is available in the workflow
- Check workflow logs for specific errors

### Binaries Not Appearing

- Ensure the workflow completed successfully
- Check that artifacts were uploaded
- Verify the release was created (not draft)

### Wrong Version

- Update `analyzer/Cargo.toml` version
- Create a new tag with the correct version
- Delete the incorrect release if needed

## Versioning

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

Example: `v0.2.1` → `v0.2.2` (patch), `v0.2.1` → `v0.3.0` (minor), `v0.2.1` → `v1.0.0` (major)

