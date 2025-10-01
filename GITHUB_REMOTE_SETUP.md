# GitHub Remote Repository Setup

This document explains how to configure GitHub remote repository connections for the NGSRN website project.

## Quick Start

Use the simplified GitHub remote setup script:

```bash
node scripts/github-remote-setup.js https://github.com/your-username/ngsrn-website.git
```

## Script Features

The `github-remote-setup.js` script provides:

✅ **Add remote repository using provided GitHub URL**
- Automatically detects if remote already exists
- Updates existing remotes or adds new ones
- Supports both HTTPS and SSH URLs

✅ **Configure authentication method (HTTPS with token)**
- Sets up Git credential helper for HTTPS authentication
- Prepares repository for token-based authentication
- Skips auth setup for SSH URLs

✅ **Test remote connection and repository access**
- Optional connection testing with `--test-connection` flag
- Graceful handling of authentication and network issues
- Provides helpful feedback on connection status

✅ **Validate remote configuration settings**
- Verifies remote URL format
- Checks authentication method (HTTPS/SSH)
- Validates GitHub URL format

## Usage Examples

### Basic Setup
```bash
# Add GitHub remote with default settings
node scripts/github-remote-setup.js https://github.com/user/repo.git
```

### Custom Remote Name
```bash
# Use a different remote name
node scripts/github-remote-setup.js https://github.com/user/repo.git --remote-name upstream
```

### Skip Authentication Setup
```bash
# Skip credential helper configuration (useful for SSH)
node scripts/github-remote-setup.js git@github.com:user/repo.git --no-auth
```

### Test Connection
```bash
# Test remote connection after setup
node scripts/github-remote-setup.js https://github.com/user/repo.git --test-connection
```

## Authentication Setup

### HTTPS with Personal Access Token

1. **Generate a GitHub Personal Access Token:**
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate a new token with `repo` permissions
   - Copy the token (starts with `ghp_`)

2. **Configure the remote:**
   ```bash
   node scripts/github-remote-setup.js https://github.com/user/repo.git
   ```

3. **First push will prompt for credentials:**
   ```bash
   git push -u origin main
   # Username: your-github-username
   # Password: your-personal-access-token
   ```

### SSH Authentication

1. **Set up SSH keys** (if not already done):
   ```bash
   ssh-keygen -t ed25519 -C "your-email@example.com"
   # Add the public key to your GitHub account
   ```

2. **Configure the remote:**
   ```bash
   node scripts/github-remote-setup.js git@github.com:user/repo.git --no-auth
   ```

## Troubleshooting

### Common Issues

**"Not a Git repository"**
- Run `git init` first to initialize the repository

**"Authentication failed"**
- Verify your GitHub credentials
- For HTTPS: Use personal access token, not password
- For SSH: Ensure SSH keys are properly configured

**"Connection timeout"**
- Check your internet connection
- GitHub may be temporarily unavailable
- The repository might not exist or be private

**"Repository not found"**
- Verify the repository URL is correct
- Ensure you have access to the repository
- Check if the repository exists on GitHub

### Verification Commands

```bash
# Check configured remotes
git remote -v

# Test connection manually
git ls-remote origin

# Check Git configuration
git config --list | grep credential
```

## Integration with Existing Scripts

The remote configuration integrates with the existing `git-setup.js` script:

```bash
# Full setup with remote configuration
node scripts/git-setup.js --remote-url https://github.com/user/repo.git --token your-token
```

## Next Steps After Setup

1. **Add and commit files:**
   ```bash
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub:**
   ```bash
   git push -u origin main
   ```

3. **Verify on GitHub:**
   - Check that files appear in your GitHub repository
   - Verify branch protection rules if needed
   - Set up any required GitHub Actions workflows