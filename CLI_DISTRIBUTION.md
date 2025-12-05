# Bulwark CLI Distribution Pipeline

This document explains the distribution pipeline for the Bulwark CLI tool.

## What Was Created

### 1. GitHub Actions Release Workflow (`.github/workflows/release.yml`)

Automatically builds and releases the CLI when you create a Git tag:

- **Triggers**: When you push a tag like `v1.0.0`, `v0.2.0`, etc.
- **Builds for**:
  - Linux (x86_64)
  - macOS Intel (x86_64)
  - macOS Apple Silicon (ARM64)
- **Outputs**: 
  - Release binaries (`.tar.gz` archives)
  - SHA256 checksums
  - Release notes

### 2. Installation Script (`install.sh`)

A user-friendly installation script that:
- Detects the user's platform
- Downloads the latest release
- Verifies checksums
- Installs the binary to `/usr/local/bin` or `~/.local/bin`

### 3. Documentation

- **README.md**: Added CLI installation section
- **RELEASE.md**: Guide for creating releases
- **CLI_DISTRIBUTION.md**: This file

## How to Create a Release

### Step 1: Update Version

Edit `analyzer/Cargo.toml`:
```toml
[package]
version = "0.2.0"  # Update this
```

### Step 2: Commit Changes

```bash
git add analyzer/Cargo.toml
git commit -m "Bump version to 0.2.0"
git push
```

### Step 3: Create and Push Tag

```bash
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
```

### Step 4: Wait for Workflow

The GitHub Actions workflow will automatically:
1. Build binaries for all platforms (~10-15 minutes)
2. Create a GitHub release
3. Upload binaries and checksums
4. Generate release notes

Check progress at: `https://github.com/YOUR_USERNAME/bulwark-monorepo/actions`

## How Users Install

### Option 1: One-Liner (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/n4beel/bulwark-monorepo/main/install.sh | bash
```

### Option 2: Manual Download

1. Visit: https://github.com/n4beel/bulwark-monorepo/releases
2. Download the archive for their platform
3. Extract and install:
   ```bash
   tar xzf bulwark-*.tar.gz
   sudo mv bulwark /usr/local/bin/
   ```

### Option 3: Using the Install Script

```bash
# Download the script
curl -O https://raw.githubusercontent.com/n4beel/bulwark-monorepo/main/install.sh

# Make it executable
chmod +x install.sh

# Run it
./install.sh
```

## Configuration

### GitHub Secrets

Set up the following secret in your repository:

1. Go to: Settings → Secrets and variables → Actions
2. Add secret: `CLI_API_KEY`
3. Value: Your CLI API key (optional, but recommended for production builds)

### Repository Name

Update the repository name in:
- `install.sh` (line 4): Change `n4beel/bulwark-monorepo` to your repo
- `.github/workflows/release.yml` (in release notes section)

## Testing the Pipeline

### Test Locally

```bash
# Build for your platform
cd analyzer
cargo build --release --bin bulwark

# Test the binary
./target/release/bulwark --help
```

### Test Release (Dry Run)

1. Create a test tag: `git tag -a v0.0.1-test -m "Test release"`
2. Push it: `git push origin v0.0.1-test`
3. Monitor the workflow in GitHub Actions
4. Delete the tag if needed: `git tag -d v0.0.1-test && git push origin --delete v0.0.1-test`

## Release Checklist

Before creating a release:

- [ ] Update version in `analyzer/Cargo.toml`
- [ ] Test the CLI locally (`cargo build --release --bin bulwark`)
- [ ] Update CHANGELOG.md (if you have one)
- [ ] Commit and push changes
- [ ] Create and push tag
- [ ] Monitor GitHub Actions workflow
- [ ] Verify release assets are uploaded
- [ ] Test installation from the release page

## Troubleshooting

### Workflow Fails

- Check GitHub Actions logs
- Verify `CLI_API_KEY` secret is set (if needed)
- Ensure Rust toolchain is available

### Binaries Not Created

- Check workflow logs for build errors
- Verify all platforms built successfully
- Check artifact uploads

### Users Can't Install

- Verify release is published (not draft)
- Check download URLs are correct
- Ensure binaries are attached to release
- Test the install script yourself

## Next Steps

1. **Set up GitHub Secret**: Add `CLI_API_KEY` to repository secrets
2. **Update Repository Name**: Change `n4beel/bulwark-monorepo` to your actual repo
3. **Create First Release**: Follow the steps above to create `v0.2.0` or similar
4. **Share Installation Link**: Users can install with the one-liner command

## Example Release Workflow

```bash
# 1. Update version
vim analyzer/Cargo.toml  # Change version to 0.2.0

# 2. Commit
git add analyzer/Cargo.toml
git commit -m "Release v0.2.0"
git push

# 3. Create tag
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0

# 4. Monitor (in browser)
# Go to: https://github.com/YOUR_USERNAME/bulwark-monorepo/actions

# 5. Verify release
# Go to: https://github.com/YOUR_USERNAME/bulwark-monorepo/releases
```

That's it! The workflow handles everything else automatically.

