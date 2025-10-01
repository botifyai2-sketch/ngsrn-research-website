# GitHub Upload Security Best Practices

This document outlines security best practices for uploading the NGSRN website to GitHub, covering credential management, file security, and repository protection.

## 🔐 Credential Security

### Personal Access Tokens

#### Creating Secure Tokens

1. **Use Minimal Permissions:**
   ```
   ✅ repo (for private repositories)
   ✅ public_repo (for public repositories only)
   ❌ admin:org (unnecessary for uploads)
   ❌ delete_repo (dangerous permission)
   ```

2. **Set Appropriate Expiration:**
   ```
   ✅ 90 days (recommended for active development)
   ✅ 30 days (for temporary access)
   ❌ No expiration (security risk)
   ```

3. **Use Descriptive Names:**
   ```
   ✅ "NGSRN Website Upload - Dev Machine"
   ✅ "CI/CD Pipeline - Production"
   ❌ "token1" or "temp"
   ```

#### Token Management

**Storage:**
```bash
# ✅ Good: Use environment variables
export GITHUB_TOKEN="ghp_your_token_here"

# ✅ Good: Use password managers
# Store in 1Password, LastPass, etc.

# ❌ Bad: Plain text files
echo "ghp_token" > token.txt

# ❌ Bad: In source code
const token = "ghp_your_token_here";
```

**Rotation:**
```bash
# Regular token rotation (every 90 days)
# 1. Generate new token
# 2. Update all systems
# 3. Revoke old token
# 4. Verify functionality
```

**Revocation:**
```bash
# Immediately revoke tokens when:
# - Employee leaves
# - Token potentially compromised
# - No longer needed
# - System decommissioned
```

### Authentication Configuration

#### Git Credential Management

**Secure Configuration:**
```bash
# Use credential helper (recommended)
git config --global credential.helper cache --timeout=3600

# For macOS
git config --global credential.helper osxkeychain

# For Windows
git config --global credential.helper manager-core
```

**Avoid Insecure Practices:**
```bash
# ❌ Don't store credentials in Git config
git config --global user.password "your-password"

# ❌ Don't use .netrc files for GitHub
echo "machine github.com login user password token" > ~/.netrc

# ❌ Don't embed credentials in URLs
git remote add origin https://user:token@github.com/user/repo.git
```

#### Two-Factor Authentication

**Enable 2FA:**
1. Go to GitHub Settings → Security
2. Enable two-factor authentication
3. Use authenticator app (not SMS)
4. Save recovery codes securely

**Impact on Automation:**
- Personal Access Tokens work with 2FA enabled
- SSH keys work with 2FA enabled
- Password authentication requires app passwords

## 🛡️ File Security

### Sensitive File Exclusion

#### Comprehensive .gitignore

The upload process automatically creates a secure .gitignore:

```gitignore
# Environment files (CRITICAL)
.env
.env.local
.env.production
.env.staging
.env.development
.env.test

# API Keys and Secrets
*.key
*.pem
*.p12
*.pfx
secrets.json
config/secrets.yml

# Database files
*.db
*.sqlite
*.sqlite3
database.yml
db_config.json

# Logs (may contain sensitive data)
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Dependencies
node_modules/
vendor/

# Build outputs
.next/
out/
dist/
build/
.vercel/

# Cache directories
.cache/
.parcel-cache/
.npm/
.yarn/
.pnp/

# IDE files (may contain paths/configs)
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Backup files
*.bak
*.backup
*.old
*.orig

# Temporary files
*.tmp
*.temp
temp/
tmp/

# Testing
coverage/
.nyc_output/
test-results/

# Documentation with sensitive info
PRIVATE_NOTES.md
INTERNAL_DOCS.md
```

#### Pre-Upload Validation

**Automated Checks:**
```bash
# The upload scripts automatically check for:
# - Environment files
# - API keys in code
# - Database files
# - Credential files
# - Large files

# Manual validation
node scripts/validate-security.js
```

**Manual Review:**
```bash
# Search for potential secrets
grep -r "password\|secret\|key\|token" --exclude-dir=node_modules .
grep -r "api_key\|apikey\|auth" --exclude-dir=node_modules .

# Check for hardcoded URLs with credentials
grep -r "://.*:.*@" --exclude-dir=node_modules .

# Look for database connection strings
grep -r "mongodb://\|postgres://\|mysql://" --exclude-dir=node_modules .
```

### Code Security

#### Remove Debug Information

```javascript
// ❌ Remove before upload
console.log("Database password:", process.env.DB_PASSWORD);
console.log("API response:", sensitiveData);

// ❌ Remove debug endpoints
app.get('/debug', (req, res) => {
  res.json({ env: process.env });
});

// ✅ Use proper logging
logger.debug("Operation completed", { userId: user.id }); // No sensitive data
```

#### Sanitize Configuration Files

```javascript
// config.example.js (safe to upload)
module.exports = {
  database: {
    host: 'localhost',
    port: 5432,
    name: 'ngsrn_db',
    // Set these in environment variables:
    // DB_USER=your_username
    // DB_PASSWORD=your_password
  },
  api: {
    // Set in environment variables:
    // GEMINI_API_KEY=your_api_key
    // GITHUB_TOKEN=your_token
  }
};

// config.js (excluded by .gitignore)
module.exports = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME || 'ngsrn_db'
  }
};
```

## 🔒 Repository Security

### Repository Settings

#### Access Control

**Private vs Public:**
```
✅ Private: For development and sensitive content
✅ Public: For open-source projects only
❌ Public: With sensitive configuration or data
```

**Collaborator Management:**
```
✅ Minimal necessary access
✅ Regular access reviews
✅ Remove inactive collaborators
❌ Broad admin access
❌ External collaborators without review
```

#### Branch Protection

**Main Branch Protection:**
```yaml
# Settings → Branches → Add rule for 'main'
✅ Require pull request reviews before merging
✅ Dismiss stale PR approvals when new commits are pushed
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
✅ Include administrators in restrictions
❌ Allow force pushes
❌ Allow deletions
```

**Required Status Checks:**
```yaml
✅ CI/CD pipeline passes
✅ Security scans pass
✅ Code quality checks pass
✅ All tests pass
```

### Security Monitoring

#### GitHub Security Features

**Enable Security Alerts:**
1. Go to repository Settings → Security & analysis
2. Enable:
   - ✅ Dependency graph
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates
   - ✅ Secret scanning (if available)
   - ✅ Code scanning (if available)

**Secret Scanning:**
```bash
# GitHub automatically scans for:
# - API keys
# - Tokens
# - Certificates
# - Database connection strings
# - Cloud service credentials
```

#### Audit Logging

**Monitor Repository Activity:**
- Review commit history regularly
- Monitor collaborator changes
- Check access logs
- Review webhook configurations

**Automated Monitoring:**
```javascript
// Example webhook for security monitoring
app.post('/webhook/security', (req, res) => {
  const event = req.body;
  
  // Monitor for suspicious activities
  if (event.action === 'member_added') {
    notifySecurityTeam(`New collaborator added: ${event.member.login}`);
  }
  
  if (event.action === 'repository_vulnerability_alert') {
    notifySecurityTeam(`Security vulnerability detected: ${event.alert.summary}`);
  }
});
```

## 🚨 Incident Response

### Credential Compromise

**Immediate Actions:**
1. **Revoke Compromised Credentials:**
   ```bash
   # Go to GitHub Settings → Developer settings → Personal access tokens
   # Click "Delete" on compromised token
   ```

2. **Generate New Credentials:**
   ```bash
   # Generate new token with minimal permissions
   # Update all systems using the old token
   ```

3. **Audit Repository Access:**
   ```bash
   # Check recent commits for unauthorized changes
   git log --since="1 week ago" --oneline
   
   # Review repository settings
   # Check collaborator list
   # Review webhook configurations
   ```

4. **Notify Stakeholders:**
   ```bash
   # Inform team members
   # Update security documentation
   # Review and improve security practices
   ```

### Sensitive Data Exposure

**If Sensitive Data is Committed:**

1. **Don't Panic - Act Quickly:**
   ```bash
   # Sensitive data in Git history is permanent
   # Even after deletion, it remains in history
   ```

2. **Remove from Latest Commit:**
   ```bash
   # If just committed
   git reset --soft HEAD~1
   git reset HEAD sensitive-file.txt
   echo "sensitive-file.txt" >> .gitignore
   git add .gitignore
   git commit -m "Add sensitive file to gitignore"
   ```

3. **Remove from History (Nuclear Option):**
   ```bash
   # This rewrites history - coordinate with team
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch sensitive-file.txt' \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (dangerous)
   git push --force --all
   ```

4. **Rotate Exposed Credentials:**
   ```bash
   # Change all passwords/tokens exposed
   # Update all systems using those credentials
   # Monitor for unauthorized access
   ```

### Repository Compromise

**Signs of Compromise:**
- Unexpected commits or changes
- New collaborators not authorized
- Modified repository settings
- Unusual webhook configurations
- Security alerts from GitHub

**Response Actions:**
1. **Secure the Repository:**
   ```bash
   # Remove unauthorized collaborators
   # Reset repository settings
   # Review and remove suspicious webhooks
   ```

2. **Audit Changes:**
   ```bash
   # Review all recent commits
   git log --since="1 month ago" --author="suspicious-user"
   
   # Check for malicious code
   grep -r "eval\|exec\|system" --exclude-dir=node_modules .
   ```

3. **Restore from Clean Backup:**
   ```bash
   # If compromise is severe, restore from known good state
   git reset --hard <known-good-commit>
   git push --force origin main
   ```

## 📋 Security Checklist

### Pre-Upload Security Review

- [ ] **Environment Files Excluded**
  - [ ] .env files in .gitignore
  - [ ] No hardcoded credentials in code
  - [ ] Configuration files sanitized

- [ ] **Authentication Security**
  - [ ] Using Personal Access Token (not password)
  - [ ] Token has minimal required permissions
  - [ ] Token expiration set appropriately
  - [ ] Two-factor authentication enabled

- [ ] **File Security**
  - [ ] Sensitive files in .gitignore
  - [ ] No API keys in source code
  - [ ] No database credentials exposed
  - [ ] Debug code removed

- [ ] **Repository Security**
  - [ ] Repository visibility appropriate (private/public)
  - [ ] Branch protection rules configured
  - [ ] Security alerts enabled
  - [ ] Collaborator access reviewed

### Post-Upload Security Verification

- [ ] **Upload Verification**
  - [ ] Only intended files uploaded
  - [ ] No sensitive data in repository
  - [ ] .gitignore working correctly
  - [ ] Repository settings secure

- [ ] **Access Control**
  - [ ] Collaborator list reviewed
  - [ ] Permissions appropriate
  - [ ] No unauthorized access
  - [ ] Audit logs reviewed

- [ ] **Monitoring Setup**
  - [ ] Security alerts configured
  - [ ] Dependency scanning enabled
  - [ ] Webhook monitoring active
  - [ ] Regular security reviews scheduled

## 🔄 Regular Security Maintenance

### Monthly Tasks
- [ ] Review and rotate access tokens
- [ ] Audit repository collaborators
- [ ] Check security alerts and vulnerabilities
- [ ] Review .gitignore effectiveness
- [ ] Update dependencies with security patches

### Quarterly Tasks
- [ ] Comprehensive security audit
- [ ] Review and update security policies
- [ ] Test incident response procedures
- [ ] Security training for team members
- [ ] Evaluate new security tools and practices

### Annual Tasks
- [ ] Complete security assessment
- [ ] Update security documentation
- [ ] Review and update access controls
- [ ] Evaluate security architecture
- [ ] Plan security improvements

---

## 📚 Additional Resources

### GitHub Security Documentation
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Managing Security Vulnerabilities](https://docs.github.com/en/code-security/security-advisories)
- [Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

### Security Tools
- [GitHub Security Advisories](https://github.com/advisories)
- [Dependabot](https://github.com/dependabot)
- [CodeQL](https://codeql.github.com/)
- [Git Secrets](https://github.com/awslabs/git-secrets)

### Security Communities
- [OWASP](https://owasp.org/)
- [GitHub Security Lab](https://securitylab.github.com/)
- [Node.js Security Working Group](https://github.com/nodejs/security-wg)

---

**Remember:** Security is an ongoing process, not a one-time setup. Regular reviews and updates are essential for maintaining a secure repository.