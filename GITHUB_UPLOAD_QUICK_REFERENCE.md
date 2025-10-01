# GitHub Upload Quick Reference

## 🚀 Quick Commands

### Interactive Upload (Recommended)
```bash
node scripts/interactive-github-upload.js
```

### Automated Upload
```bash
node scripts/github-upload-complete.js --repository-url https://github.com/username/ngsrn-website.git
```

### Manual Step-by-Step
```bash
# 1. Initialize and configure
git init && git branch -M main
git config user.name "Your Name"
git config user.email "your@email.com"

# 2. Set up authentication
node scripts/github-upload-auth.js interactive

# 3. Add remote
node scripts/github-remote-setup.js https://github.com/username/repo.git

# 4. Commit and push
git add . && git commit -m "Initial commit"
git push -u origin main

# 5. Verify
node scripts/github-upload-verification.js https://github.com/username/repo.git
```

## 🔐 Authentication Setup

### Personal Access Token (Recommended)
1. Go to: https://github.com/settings/tokens
2. Generate new token with `repo` scope
3. Copy token (starts with `ghp_`)
4. Use in upload process

### Quick Auth Setup
```bash
node scripts/github-upload-auth.js quick https://github.com/user/repo.git \
  --username myusername \
  --email my@email.com \
  --token ghp_your_token_here
```

## 🔧 Troubleshooting

### Common Issues
| Issue | Solution |
|-------|----------|
| Authentication failed | Check token permissions and expiration |
| Repository not found | Verify URL and repository exists |
| Network timeout | Check connection, retry later |
| Large files | Use Git LFS or add to .gitignore |
| Merge conflicts | Fetch, merge, resolve conflicts |

### Recovery Commands
```bash
# Check status
node scripts/github-upload-recovery.js status

# Rollback failed init
node scripts/github-upload-recovery.js rollback-init

# Cleanup partial upload
node scripts/github-upload-recovery.js cleanup
```

## 📋 Prerequisites Checklist

- [ ] Node.js v16+ installed
- [ ] Git v2.20+ installed
- [ ] GitHub account with repository access
- [ ] Repository created on GitHub
- [ ] Personal Access Token generated
- [ ] In correct project directory

## 🔍 Verification

### Check Upload Success
```bash
# Verify upload
node scripts/github-upload-verification.js https://github.com/username/repo.git

# Check Git status
git status
git remote -v
git log --oneline -5
```

### Manual Verification
1. Visit your GitHub repository
2. Check all files are present
3. Verify commit message and author
4. Test repository clone

## 📊 Upload Options

| Option | Description | Default |
|--------|-------------|---------|
| `--repository-url` | GitHub repository URL | Required |
| `--username` | GitHub username | Prompted |
| `--email` | GitHub email | Prompted |
| `--token` | Personal access token | Prompted |
| `--branch` | Target branch | `main` |
| `--force` | Force push | `false` |
| `--skip-verification` | Skip verification | `false` |

## 🛡️ Security Checklist

- [ ] Using Personal Access Token (not password)
- [ ] Token has minimal required permissions
- [ ] Token expiration set (90 days recommended)
- [ ] Sensitive files excluded via .gitignore
- [ ] No credentials committed to repository
- [ ] Two-factor authentication enabled

## 📁 Files Automatically Excluded

```
.env*                 # Environment files
node_modules/         # Dependencies
.next/               # Build outputs
*.log                # Log files
.DS_Store            # OS files
.vscode/             # IDE files
*.db                 # Database files
```

## 🆘 Emergency Recovery

### If Upload Fails
1. Don't panic - state is saved automatically
2. Check error message for specific guidance
3. Run recovery status: `node scripts/github-upload-recovery.js status`
4. Follow suggested recovery steps
5. Contact support if issues persist

### Reset Everything
```bash
# Nuclear option - start fresh
rm -rf .git
git init
# Follow setup process again
```

## 📞 Getting Help

1. **Read full guide:** [GITHUB_UPLOAD_GUIDE.md](./GITHUB_UPLOAD_GUIDE.md)
2. **Check error recovery:** [GITHUB_UPLOAD_RECOVERY.md](./GITHUB_UPLOAD_RECOVERY.md)
3. **Authentication help:** [GITHUB_AUTHENTICATION.md](./GITHUB_AUTHENTICATION.md)
4. **GitHub docs:** https://docs.github.com/en/get-started
5. **Git docs:** https://git-scm.com/doc

---

**💡 Tip:** For first-time users, always use the interactive upload method for guided setup and validation.