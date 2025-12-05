# 🚀 Quick Start: Create Your First Release

Everything is configured and ready! Here's how to create your first release.

## ✅ What's Already Set Up

- ✅ GitHub Actions release workflow (`.github/workflows/release.yml`)
- ✅ Installation script (`install.sh`)
- ✅ Repository URL configured: `n4beel/bulwark-monorepo`
- ✅ CLI_API_KEY secret added to GitHub
- ✅ Documentation updated

## 📦 Create Your First Release

### Step 1: Update Version (Optional)

If you want to release v0.2.0 instead of v0.1.0:

```bash
# Edit analyzer/Cargo.toml
# Change: version = "0.1.0"
# To:     version = "0.2.0"
```

### Step 2: Commit Any Changes

```bash
git add .
git commit -m "Prepare for release v0.1.0"
git push
```

### Step 3: Create and Push Tag

```bash
# Create annotated tag
git tag -a v0.1.0 -m "Release v0.1.0 - Initial CLI release"

# Push tag to trigger workflow
git push origin v0.1.0
```

### Step 4: Monitor the Workflow

1. Go to: https://github.com/n4beel/bulwark-monorepo/actions
2. You'll see "Release CLI" workflow running
3. Wait ~10-15 minutes for builds to complete
4. The workflow will automatically:
   - Build binaries for Linux, macOS Intel, and macOS Apple Silicon
   - Create a GitHub release
   - Upload binaries and checksums

### Step 5: Verify Release

1. Go to: https://github.com/n4beel/bulwark-monorepo/releases
2. You should see v0.1.0 release with:
   - Release notes
   - 3 binary archives (.tar.gz)
   - 3 checksum files (.sha256)

## 🎯 Test Installation

Once the release is published, test it:

```bash
# One-liner installation
curl -fsSL https://raw.githubusercontent.com/n4beel/bulwark-monorepo/main/install.sh | bash

# Or manually
curl -L https://github.com/n4beel/bulwark-monorepo/releases/download/v0.1.0/bulwark-0.1.0-x86_64-unknown-linux-gnu.tar.gz | tar xz
sudo mv bulwark /usr/local/bin/
bulwark --help
```

## 📝 What Happens Automatically

When you push a tag:

1. **GitHub Actions triggers** the release workflow
2. **Builds binaries** for 3 platforms:
   - `x86_64-unknown-linux-gnu` (Linux)
   - `x86_64-apple-darwin` (macOS Intel)
   - `aarch64-apple-darwin` (macOS Apple Silicon)
3. **Strips binaries** to reduce size
4. **Creates archives** (.tar.gz) with checksums
5. **Creates GitHub release** with:
   - Release notes
   - Download links
   - Installation instructions
6. **Uploads all assets** to the release

## 🔗 Share Installation Link

Users can install with:

```bash
curl -fsSL https://raw.githubusercontent.com/n4beel/bulwark-monorepo/main/install.sh | bash
```

Or share the releases page:
https://github.com/n4beel/bulwark-monorepo/releases

## 🐛 Troubleshooting

### Workflow Fails

- Check Actions tab for error logs
- Verify `CLI_API_KEY` secret is set (Settings → Secrets → Actions)
- Ensure Rust toolchain is available

### Binaries Not Created

- Check workflow logs for build errors
- Verify all platforms built successfully
- Check artifact uploads

### Release Not Created

- Ensure workflow completed successfully
- Check that artifacts were uploaded
- Verify release was created (not draft)

## 📚 Next Steps

After your first release:

1. **Test installation** on different platforms
2. **Update documentation** if needed
3. **Share the install link** with users
4. **Monitor feedback** and create patches (v0.1.1, etc.)

## 🎉 You're Ready!

Just run these commands to create your first release:

```bash
git tag -a v0.1.0 -m "Release v0.1.0 - Initial CLI release"
git push origin v0.1.0
```

Then watch the magic happen at:
https://github.com/n4beel/bulwark-monorepo/actions

