# GitHub Upload Troubleshooting Guide

This guide provides solutions for common issues encountered during the GitHub upload process for the NGSRN website.

## 🔍 Diagnostic Commands

Before troubleshooting, run these commands to gather information:

```bash
# Check system prerequisites
node --version          # Should be v16+
git --version          # Should be v2.20+

# Check project status
pwd                    # Verify you're in the correct directory
ls -la | grep package.json  # Confirm NGSRN project

# Check Git status
git status             # Repository state
git remote -v          # Remote configurations
git config --list      # Git configuration
```

## 🚨 Common Error Scenarios

### 1. Authentication Errors

#### Error: "Authentication failed"
```
fatal: Authentication failed for 'https://github.com/username/repo.git/'
```

**Causes:**
- Invalid GitHub credentials
- Expired Personal Access Token
- Insufficient token permissions
- Two-factor authentication issues

**Solutions:**

1. **Verify Token Validity:**
   ```bash
   # Test authentication
   node scripts/github-upload-auth.js verify https://github.com/username/repo.git
   ```

2. **Generate New Token:**
   - Go to: https://github.com/settings/tokens
   - Generate new token with `repo` scope
   - Copy token immediately (starts with `ghp_`)

3. **Reconfigure Authentication:**
   ```bash
   # Clear existing credentials
   git config --unset credential.helper
   
   # Set up new authentication
   node scripts/github-upload-auth.js interactive
   ```

4. **Check Token Permissions:**
   - Ensure token has `repo` scope for private repositories
   - For public repositories, `public_repo` scope is sufficient
   - Verify token hasn't expired

#### Error: "Permission denied (publickey)"
```
git@github.com: Permission denied (publickey).
```

**Cause:** SSH key authentication issues

**Solutions:**

1. **Switch to HTTPS:**
   ```bash
   # Remove SSH remote
   git remote remove origin
   
   # Add HTTPS remote
   git remote add origin https://github.com/username/repo.git
   ```

2. **Fix SSH Keys (if preferred):**
   ```bash
   # Generate new SSH key
   ssh-keygen -t ed25519 -C "your-email@example.com"
   
   # Add to SSH agent
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   
   # Add public key to GitHub account
   cat ~/.ssh/id_ed25519.pub
   ```

### 2. Repository Access Issues

#### Error: "Repository not found"
```
fatal: repository 'https://github.com/username/repo.git/' not found
```

**Causes:**
- Repository doesn't exist
- Incorrect repository URL
- No access permissions
- Private repository without proper authentication

**Solutions:**

1. **Verify Repository Exists:**
   - Visit the repository URL in your browser
   - Ensure you have access to the repository

2. **Check Repository URL:**
   ```bash
   # Verify URL format
   echo "https://github.com/username/ngsrn-website.git"
   
   # Update remote URL if incorrect
   git remote set-url origin https://github.com/correct-username/repo.git
   ```

3. **Create Repository:**
   - Go to GitHub and create a new repository
   - Use the exact name expected by your configuration

4. **Check Access Permissions:**
   - Ensure you're a collaborator on the repository
   - For organization repositories, check team permissions

#### Error: "Repository access denied"
```
remote: Permission to username/repo.git denied to other-user.
```

**Cause:** Authenticated as wrong user or insufficient permissions

**Solutions:**

1. **Check Current User:**
   ```bash
   git config user.name
   git config user.email
   ```

2. **Update Git Configuration:**
   ```bash
   git config user.name "Correct Username"
   git config user.email "correct-email@example.com"
   ```

3. **Clear Credential Cache:**
   ```bash
   # Windows
   git config --global --unset credential.helper
   
   # macOS
   git credential-osxkeychain erase
   
   # Linux
   git config --global credential.helper cache --timeout=0
   ```

### 3. Network and Connectivity Issues

#### Error: "Connection timed out"
```
fatal: unable to access 'https://github.com/username/repo.git/': 
Failed to connect to github.com port 443: Connection timed out
```

**Causes:**
- Network connectivity issues
- Firewall blocking connections
- GitHub service outage
- DNS resolution problems

**Solutions:**

1. **Check Internet Connection:**
   ```bash
   ping github.com
   curl -I https://github.com
   ```

2. **Check GitHub Status:**
   - Visit: https://www.githubstatus.com/
   - Check for ongoing incidents

3. **Try Different Network:**
   - Switch to mobile hotspot
   - Try from different location
   - Use VPN if corporate firewall blocks access

4. **DNS Troubleshooting:**
   ```bash
   # Flush DNS cache
   # Windows:
   ipconfig /flushdns
   
   # macOS:
   sudo dscacheutil -flushcache
   
   # Linux:
   sudo systemctl restart systemd-resolved
   ```

#### Error: "SSL certificate problem"
```
fatal: unable to access 'https://github.com/username/repo.git/': 
SSL certificate problem: certificate verify failed
```

**Solutions:**

1. **Update Git:**
   ```bash
   git --version
   # Update to latest version if old
   ```

2. **Update CA Certificates:**
   ```bash
   # Windows (Git Bash)
   git config --global http.sslCAInfo "C:/Program Files/Git/mingw64/ssl/certs/ca-bundle.crt"
   
   # macOS
   brew install ca-certificates
   
   # Linux
   sudo apt-get update && sudo apt-get install ca-certificates
   ```

3. **Temporary Workaround (Not Recommended):**
   ```bash
   git config --global http.sslVerify false
   # Remember to re-enable: git config --global http.sslVerify true
   ```

### 4. File and Repository Issues

#### Error: "File too large"
```
remote: error: File large-file.zip is 123.45 MB; this exceeds GitHub's file size limit of 100.00 MB
```

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
   git add large-file.zip
   git commit -m "Add large file with LFS"
   ```

3. **Add to .gitignore:**
   ```bash
   echo "large-file.zip" >> .gitignore
   git rm --cached large-file.zip
   git commit -m "Remove large file from tracking"
   ```

#### Error: "Non-fast-forward updates"
```
! [rejected] main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/username/repo.git'
```

**Cause:** Remote repository has changes not in local repository

**Solutions:**

1. **Fetch and Merge:**
   ```bash
   git fetch origin
   git merge origin/main
   # Resolve conflicts if any
   git push origin main
   ```

2. **Rebase (Alternative):**
   ```bash
   git fetch origin
   git rebase origin/main
   git push origin main
   ```

3. **Force Push (Use Carefully):**
   ```bash
   git push --force-with-lease origin main
   ```

#### Error: "Working tree has uncommitted changes"
```
error: Your local changes to the following files would be overwritten by merge
```

**Solutions:**

1. **Commit Changes:**
   ```bash
   git add .
   git commit -m "Save local changes"
   ```

2. **Stash Changes:**
   ```bash
   git stash
   # Perform operations
   git stash pop  # Restore changes later
   ```

3. **Discard Changes (Careful):**
   ```bash
   git checkout -- .
   ```

### 5. Script-Specific Issues

#### Error: "Node.js script fails"
```
Error: Cannot find module './github-upload-complete'
```

**Solutions:**

1. **Check Working Directory:**
   ```bash
   pwd
   ls scripts/  # Verify scripts exist
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Check Node.js Version:**
   ```bash
   node --version  # Should be v16+
   ```

4. **Run from Correct Directory:**
   ```bash
   cd ngsrn-website  # Ensure you're in project root
   node scripts/interactive-github-upload.js
   ```

#### Error: "Permission denied on script execution"
```
bash: ./scripts/interactive-github-upload.js: Permission denied
```

**Solutions:**

1. **Make Script Executable:**
   ```bash
   chmod +x scripts/interactive-github-upload.js
   ```

2. **Run with Node:**
   ```bash
   node scripts/interactive-github-upload.js
   ```

## 🔧 Recovery Procedures

### Complete Recovery Process

If upload fails completely:

1. **Check Recovery Status:**
   ```bash
   node scripts/github-upload-recovery.js status
   ```

2. **Rollback Git Initialization:**
   ```bash
   node scripts/github-upload-recovery.js rollback-init
   ```

3. **Clean Up Partial Upload:**
   ```bash
   node scripts/github-upload-recovery.js cleanup --operation upload
   ```

4. **Start Fresh:**
   ```bash
   # Remove Git repository
   rm -rf .git
   
   # Start upload process again
   node scripts/interactive-github-upload.js
   ```

### Partial Recovery

If upload partially succeeds:

1. **Check What Was Uploaded:**
   ```bash
   git log --oneline
   git ls-remote origin
   ```

2. **Continue from Last Good State:**
   ```bash
   git fetch origin
   git reset --hard origin/main
   git push origin main
   ```

### Emergency Reset

If everything is broken:

1. **Backup Important Changes:**
   ```bash
   cp -r . ../ngsrn-website-backup
   ```

2. **Complete Reset:**
   ```bash
   rm -rf .git
   git init
   git branch -M main
   ```

3. **Restore from Backup if Needed:**
   ```bash
   # Copy back important files
   cp ../ngsrn-website-backup/important-file.js .
   ```

## 🔍 Verification Steps

After resolving issues, verify the fix:

### 1. Test Authentication
```bash
node scripts/github-upload-auth.js verify https://github.com/username/repo.git
```

### 2. Test Repository Access
```bash
git ls-remote origin
```

### 3. Test Upload Process
```bash
# Create test file
echo "test" > test-upload.txt
git add test-upload.txt
git commit -m "Test upload"
git push origin main

# Clean up
git rm test-upload.txt
git commit -m "Remove test file"
git push origin main
```

### 4. Verify Complete Upload
```bash
node scripts/github-upload-verification.js https://github.com/username/repo.git
```

## 📞 Getting Additional Help

### Self-Help Resources

1. **Run Diagnostics:**
   ```bash
   node scripts/github-upload-verification.js --diagnose
   ```

2. **Check Logs:**
   ```bash
   # Check upload logs
   ls -la *.log
   cat upload-*.log
   ```

3. **Review Documentation:**
   - [GitHub Upload Guide](./GITHUB_UPLOAD_GUIDE.md)
   - [Authentication Guide](./GITHUB_AUTHENTICATION.md)
   - [Recovery Guide](./GITHUB_UPLOAD_RECOVERY.md)

### External Resources

1. **GitHub Documentation:**
   - https://docs.github.com/en/get-started
   - https://docs.github.com/en/authentication

2. **Git Documentation:**
   - https://git-scm.com/doc
   - https://git-scm.com/book

3. **GitHub Status:**
   - https://www.githubstatus.com/

### When to Seek Help

Contact support if:
- Multiple recovery attempts fail
- Error messages are unclear or undocumented
- System-specific issues persist
- Data loss concerns arise

### Information to Provide

When seeking help, include:
- Operating system and version
- Node.js and Git versions
- Complete error messages
- Steps taken before error occurred
- Recovery attempts made
- Upload logs (sanitized of credentials)

---

## 📋 Prevention Checklist

To avoid future issues:

- [ ] Keep Git and Node.js updated
- [ ] Use Personal Access Tokens with appropriate scopes
- [ ] Set reasonable token expiration dates
- [ ] Regularly test authentication
- [ ] Monitor repository size and file limits
- [ ] Keep backups of important configurations
- [ ] Document custom configurations
- [ ] Test upload process in development environment
- [ ] Monitor GitHub service status during uploads
- [ ] Use stable internet connection for uploads

---

**Remember:** Most upload issues are authentication or network related. Start with the diagnostic commands and work through the solutions systematically.