# GitHub Upload Guide for NGSRN Website

This comprehensive guide walks you through uploading your NGSRN research website project to GitHub, including repository initialization, authentication setup, and complete file upload with verification.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Upload Process](#step-by-step-upload-process)
4. [Authentication Setup](#authentication-setup)
5. [Upload Methods](#upload-methods)
6. [Verification and Troubleshooting](#verification-and-troubleshooting)
7. [Security Best Practices](#security-best-practices)
8. [Error Recovery](#error-recovery)
9. [Advanced Configuration](#advanced-configuration)
10. [FAQ](#faq)

## Quick Start

For experienced users who want to upload immediately:

```bash
# Interactive upload (recommended for first-time users)
node scripts/interactive-github-upload.js

# Quick automated upload
node scripts/github-upload-complete.js --repository-url https://github.com/username/ngsrn-website.git
```

## Prerequisites

### Required Software
- ✅ **Node.js** (v16 or higher)
- ✅ **Git** (v2.20 or higher)
- ✅ **GitHub Account** with repository access

### Required Information
- ✅ **GitHub Repository URL** (e.g., `https://github.com/username/ngsrn-website.git`)
- ✅ **GitHub Username**
- ✅ **GitHub Email Address**
- ✅ **GitHub Personal Access Token** (recommended) or password

### Verify Prerequisites

```bash
# Check Node.js version
node --version

# Check Git version
git --version

# Check if you're in the correct directory
ls -la | grep package.json
```

## Step-by-Step Upload Process

### Method 1: Interactive Upload (Recommended)

The interactive method guides you through each step with prompts and validation:

```bash
node scripts/interactive-github-upload.js
```

**What it does:**
1. 🔍 **Repository Check** - Verifies Git repository status
2. 🔐 **Credential Setup** - Securely collects GitHub credentials
3. 🌐 **Repository Validation** - Validates GitHub repository URL
4. ⚙️ **Git Configuration** - Configures Git with your credentials
5. 🔗 **Remote Setup** - Adds GitHub remote repository
6. 📁 **File Staging** - Stages all project files (respecting .gitignore)
7. 💾 **Initial Commit** - Creates initial commit with descriptive message
8. 🚀 **Push to GitHub** - Uploads all files to GitHub
9. ✅ **Verification** - Verifies successful upload
10. 📊 **Report Generation** - Creates upload summary report

### Method 2: Automated Upload

For scripted or repeated uploads:

```bash
# With all parameters
node scripts/github-upload-complete.js \
  --repository-url https://github.com/username/ngsrn-website.git \
  --username your-username \
  --email your-email@example.com \
  --token ghp_your_personal_access_token

# Minimal (will prompt for missing information)
node scripts/github-upload-complete.js --repository-url https://github.com/username/ngsrn-website.git
```

### Method 3: Step-by-Step Manual Process

For users who want full control over each step:

#### Step 1: Initialize Git Repository
```bash
# Initialize Git repository (if not already done)
git init

# Set default branch to main
git branch -M main
```

#### Step 2: Configure Git User
```bash
# Set your Git identity
git config user.name "Your GitHub Username"
git config user.email "your-email@example.com"
```

#### Step 3: Set Up Authentication
```bash
# Configure authentication
node scripts/github-upload-auth.js interactive
```

#### Step 4: Add Remote Repository
```bash
# Add GitHub remote
node scripts/github-remote-setup.js https://github.com/username/ngsrn-website.git
```

#### Step 5: Stage and Commit Files
```bash
# Stage all files (respects .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: NGSRN Research Website"
```

#### Step 6: Push to GitHub
```bash
# Push to GitHub
git push -u origin main
```

#### Step 7: Verify Upload
```bash
# Verify upload success
node scripts/github-upload-verification.js https://github.com/username/ngsrn-website.git
```

## Authentication Setup

### Personal Access Token (Recommended)

Personal Access Tokens provide secure, granular access control:

#### Creating a Personal Access Token

1. **Go to GitHub Settings:**
   - Visit: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"

2. **Configure Token:**
   - **Name:** "NGSRN Website Upload" (or descriptive name)
   - **Expiration:** 90 days (recommended) or custom
   - **Scopes:** Select the following:
     - ✅ `repo` - Full control of private repositories
     - ✅ `workflow` - Update GitHub Action workflows (if needed)

3. **Generate and Copy:**
   - Click "Generate token"
   - **⚠️ Copy immediately** - you won't see it again!
   - Store securely (password manager recommended)

#### Using Personal Access Token

```bash
# Interactive setup with token
node scripts/github-upload-auth.js interactive

# Quick setup with token
node scripts/github-upload-auth.js quick https://github.com/username/repo.git \
  --username your-username \
  --email your-email@example.com \
  --token ghp_your_token_here
```

### Alternative Authentication Methods

#### HTTPS with Username/Password
```bash
# Basic HTTPS authentication (less secure)
node scripts/github-upload-auth.js quick https://github.com/username/repo.git \
  --username your-username \
  --email your-email@example.com
# Will prompt for password during push
```

#### SSH Authentication
```bash
# Set up SSH keys first, then:
node scripts/github-remote-setup.js git@github.com:username/repo.git --no-auth
```

## Upload Methods

### Interactive Upload Features

The interactive upload script (`interactive-github-upload.js`) provides:

- 🔒 **Secure Input** - Hidden password/token input
- ✅ **Validation** - Real-time validation of inputs
- 📊 **Progress Tracking** - Step-by-step progress updates
- 🔄 **Error Recovery** - Automatic error handling and recovery
- 📝 **Detailed Logging** - Comprehensive operation logging

#### Interactive Upload Example Session

```
🚀 NGSRN Website GitHub Upload
================================

📁 Project Path: /path/to/ngsrn-website
🔍 Git Status: Repository initialized ✅

🌐 GitHub Repository Setup
--------------------------
Enter GitHub repository URL: https://github.com/username/ngsrn-website.git
✅ Repository URL validated

🔐 GitHub Authentication
------------------------
Enter GitHub username: your-username
Enter GitHub email: your-email@example.com
Enter Personal Access Token: [hidden input]
✅ Credentials validated

🚀 Upload Process
-----------------
⏳ Configuring Git authentication...
✅ Git authentication configured

⏳ Setting up remote repository...
✅ Remote repository configured

⏳ Staging project files...
✅ 247 files staged for commit

⏳ Creating initial commit...
✅ Initial commit created (abc123f)

⏳ Pushing to GitHub...
✅ Successfully pushed to GitHub

🔍 Verification
---------------
⏳ Verifying upload...
✅ All files uploaded successfully
✅ Repository accessible at: https://github.com/username/ngsrn-website

📊 Upload Summary
-----------------
• Files uploaded: 247
• Commit hash: abc123f
• Repository: https://github.com/username/ngsrn-website
• Branch: main
• Duration: 45.2 seconds

🎉 Upload completed successfully!
```

### Automated Upload Options

#### Complete Upload Script

```bash
# Full automated upload
node scripts/github-upload-complete.js \
  --repository-url https://github.com/username/ngsrn-website.git \
  --username your-username \
  --email your-email@example.com \
  --token ghp_your_token \
  --branch main \
  --commit-message "Initial commit: NGSRN Research Website"
```

#### Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `--repository-url` | GitHub repository URL | Required |
| `--username` | GitHub username | Prompted if missing |
| `--email` | GitHub email | Prompted if missing |
| `--token` | Personal access token | Prompted if missing |
| `--branch` | Target branch name | `main` |
| `--commit-message` | Initial commit message | Auto-generated |
| `--force` | Force push (use carefully) | `false` |
| `--skip-verification` | Skip upload verification | `false` |
| `--no-report` | Skip report generation | `false` |

## Verification and Troubleshooting

### Upload Verification

After upload, the system automatically verifies:

- ✅ **Repository Accessibility** - Can access the GitHub repository
- ✅ **File Count Verification** - All expected files are present
- ✅ **Commit Verification** - Commit was created successfully
- ✅ **Branch Verification** - Correct branch was updated
- ✅ **Remote Verification** - Remote repository is properly configured

#### Manual Verification

```bash
# Verify upload manually
node scripts/github-upload-verification.js https://github.com/username/ngsrn-website.git

# Check repository status
git status
git remote -v
git log --oneline -5
```

### Common Issues and Solutions

#### Authentication Errors

**Problem:** "Authentication failed" or "Permission denied"

**Solutions:**
1. **Verify Credentials:**
   ```bash
   # Test authentication
   node scripts/github-upload-auth.js verify https://github.com/username/repo.git
   ```

2. **Check Token Permissions:**
   - Ensure token has `repo` scope
   - Verify token hasn't expired
   - Generate new token if needed

3. **Verify Repository Access:**
   - Check repository exists
   - Ensure you have write access
   - Verify repository URL is correct

#### Network and Connectivity Issues

**Problem:** Connection timeouts or network errors

**Solutions:**
1. **Check Internet Connection:**
   ```bash
   # Test GitHub connectivity
   ping github.com
   curl -I https://github.com
   ```

2. **Retry with Backoff:**
   ```bash
   # The upload scripts include automatic retry logic
   # Manual retry:
   node scripts/github-upload-complete.js --repository-url [URL] --retry
   ```

3. **Check GitHub Status:**
   - Visit: https://www.githubstatus.com/
   - Try again during off-peak hours

#### Repository Conflicts

**Problem:** "Non-fast-forward" or merge conflicts

**Solutions:**
1. **Fetch and Merge:**
   ```bash
   git fetch origin
   git merge origin/main
   # Resolve conflicts if any
   git push origin main
   ```

2. **Force Push (Use Carefully):**
   ```bash
   git push --force-with-lease origin main
   ```

#### Large File Issues

**Problem:** Files too large for GitHub

**Solutions:**
1. **Identify Large Files:**
   ```bash
   find . -type f -size +100M
   ```

2. **Use Git LFS:**
   ```bash
   git lfs install
   git lfs track "*.zip" "*.tar.gz" "*.pdf"
   git add .gitattributes
   ```

3. **Add to .gitignore:**
   ```bash
   echo "large-file.zip" >> .gitignore
   ```

### Error Recovery

The upload system includes comprehensive error recovery:

#### Automatic Recovery

- **State Saving** - Saves Git state before operations
- **Rollback Capability** - Can undo failed operations
- **Cleanup Mechanisms** - Removes partial changes
- **Retry Logic** - Automatic retry with exponential backoff

#### Manual Recovery

```bash
# Check recovery status
node scripts/github-upload-recovery.js status

# Rollback failed Git initialization
node scripts/github-upload-recovery.js rollback-init

# Cleanup partial upload
node scripts/github-upload-recovery.js cleanup --operation upload

# Restore previous state
node scripts/github-upload-recovery.js restore [operation-name]
```

## Security Best Practices

### Credential Security

#### Do's ✅
- ✅ Use Personal Access Tokens instead of passwords
- ✅ Set token expiration dates (90 days recommended)
- ✅ Use minimal required permissions (`repo` scope)
- ✅ Store tokens in password managers
- ✅ Regenerate tokens periodically
- ✅ Revoke unused tokens immediately

#### Don'ts ❌
- ❌ Never commit tokens to version control
- ❌ Don't share tokens via email or chat
- ❌ Don't use tokens with excessive permissions
- ❌ Don't store tokens in plain text files
- ❌ Don't reuse tokens across multiple projects

### File Security

The upload process automatically excludes sensitive files via `.gitignore`:

```gitignore
# Environment files
.env
.env.local
.env.production
.env.staging

# Dependencies
node_modules/

# Build outputs
.next/
out/
dist/
build/

# Database files
*.db
*.sqlite
*.sqlite3

# Logs and cache
logs/
*.log
.cache/
.npm/

# IDE and OS files
.vscode/
.DS_Store
Thumbs.db
```

#### Verify File Exclusions

```bash
# Check what files will be uploaded
git status
git ls-files

# Check .gitignore effectiveness
git check-ignore -v [filename]
```

### Repository Security

#### Repository Settings
1. **Enable Branch Protection:**
   - Go to repository Settings → Branches
   - Add rule for `main` branch
   - Enable "Require pull request reviews"

2. **Security Alerts:**
   - Enable Dependabot alerts
   - Enable security updates
   - Review security advisories

3. **Access Control:**
   - Review collaborator permissions
   - Use teams for organization repositories
   - Enable two-factor authentication

## Advanced Configuration

### Custom Upload Configuration

Create a configuration file for repeated uploads:

```javascript
// upload-config.js
module.exports = {
  repositoryUrl: 'https://github.com/username/ngsrn-website.git',
  branch: 'main',
  commitMessage: 'Deploy NGSRN Research Website',
  excludePatterns: [
    'custom-exclude-pattern/*',
    '*.temp'
  ],
  uploadOptions: {
    force: false,
    skipVerification: false,
    saveReport: true
  }
};
```

```bash
# Use custom configuration
node scripts/github-upload-complete.js --config upload-config.js
```

### Environment Variables

Set environment variables for automated deployments:

```bash
# Set environment variables
export GITHUB_REPOSITORY_URL="https://github.com/username/ngsrn-website.git"
export GITHUB_USERNAME="your-username"
export GITHUB_EMAIL="your-email@example.com"
export GITHUB_TOKEN="ghp_your_token"

# Run upload with environment variables
node scripts/github-upload-complete.js
```

### CI/CD Integration

#### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Upload to GitHub
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: node scripts/github-upload-complete.js
```

### Webhook Integration

Set up webhooks for deployment notifications:

```javascript
// webhook-config.js
const webhookUrl = 'https://your-webhook-endpoint.com/deploy';

// Add to upload completion
await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'deployment_complete',
    repository: repositoryUrl,
    commit: commitHash,
    timestamp: new Date().toISOString()
  })
});
```

## FAQ

### General Questions

**Q: Do I need to create the GitHub repository first?**
A: Yes, create an empty repository on GitHub before running the upload process.

**Q: Can I upload to an existing repository with files?**
A: Yes, but you may encounter merge conflicts. The system will guide you through resolution.

**Q: What happens if the upload fails partway through?**
A: The recovery system automatically saves state and can rollback or resume operations.

### Authentication Questions

**Q: Should I use a Personal Access Token or password?**
A: Always use Personal Access Tokens. GitHub deprecated password authentication for Git operations.

**Q: What permissions does my token need?**
A: For private repositories: `repo` scope. For public repositories: `public_repo` scope.

**Q: How long should I set token expiration?**
A: 90 days is recommended for active development. Shorter for production systems.

### Technical Questions

**Q: Can I upload large files (>100MB)?**
A: GitHub has a 100MB file limit. Use Git LFS for larger files or exclude them.

**Q: What if I have uncommitted changes?**
A: The system will detect and handle uncommitted changes, offering to commit or stash them.

**Q: Can I change the commit message?**
A: Yes, use `--commit-message "Your message"` or edit during interactive upload.

### Troubleshooting Questions

**Q: Why am I getting "Repository not found" errors?**
A: Check the repository URL, ensure it exists, and verify you have access permissions.

**Q: The upload is very slow. What can I do?**
A: Large repositories take time. Check your internet connection and try during off-peak hours.

**Q: How do I undo a failed upload?**
A: Use the recovery system: `node scripts/github-upload-recovery.js rollback-init`

---

## Additional Resources

- **GitHub Authentication Guide:** [GITHUB_AUTHENTICATION.md](./GITHUB_AUTHENTICATION.md)
- **Remote Setup Guide:** [GITHUB_REMOTE_SETUP.md](./GITHUB_REMOTE_SETUP.md)
- **Error Recovery Guide:** [GITHUB_UPLOAD_RECOVERY.md](./GITHUB_UPLOAD_RECOVERY.md)
- **GitHub Documentation:** https://docs.github.com/en/get-started
- **Git Documentation:** https://git-scm.com/doc

## Support

If you encounter issues not covered in this guide:

1. **Check the error recovery guide** for specific error scenarios
2. **Review the troubleshooting section** for common solutions
3. **Run verification scripts** to diagnose issues
4. **Check GitHub status** for service issues
5. **Consult GitHub documentation** for platform-specific issues

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Compatibility:** Node.js 16+, Git 2.20+