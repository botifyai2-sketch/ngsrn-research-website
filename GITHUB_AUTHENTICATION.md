# GitHub Authentication Setup

This document describes the secure credential handling and authentication system for uploading the NGSRN website to GitHub.

## Overview

The GitHub authentication system provides secure credential management, validation, and configuration for GitHub operations. It supports multiple authentication methods and includes comprehensive error handling.

## Features

- ✅ **Secure Credential Validation**: Validates GitHub credentials before use
- ✅ **Multiple Auth Methods**: Supports HTTPS with tokens and basic authentication
- ✅ **Git Configuration**: Automatically configures Git with user credentials
- ✅ **GitHub API Testing**: Verifies authentication against GitHub API
- ✅ **Repository Access Testing**: Tests access to specific repositories
- ✅ **Comprehensive Error Handling**: Clear error messages with troubleshooting steps
- ✅ **Interactive and Programmatic Modes**: Supports both CLI and script usage

## Authentication Methods

### 1. Personal Access Token (Recommended)

The most secure method using GitHub Personal Access Tokens:

```bash
# Interactive setup
node scripts/github-upload-auth.js interactive

# Quick setup with token
node scripts/github-upload-auth.js quick https://github.com/user/repo.git \
  --username myusername \
  --email my@email.com \
  --token ghp_your_token_here
```

### 2. HTTPS Authentication

Basic HTTPS authentication (less secure):

```bash
# Setup without token (will prompt for credentials when pushing)
node scripts/github-upload-auth.js quick https://github.com/user/repo.git \
  --username myusername \
  --email my@email.com
```

## Usage

### Interactive Setup

The easiest way to set up authentication:

```bash
node scripts/github-upload-auth.js interactive
```

This will:
1. Prompt for your GitHub username
2. Prompt for your GitHub email
3. Securely prompt for your Personal Access Token (hidden input)
4. Validate all credentials
5. Configure Git authentication
6. Test GitHub API access
7. Set up remote repository connection

### Quick Setup

For automated or script-based setup:

```bash
node scripts/github-upload-auth.js quick https://github.com/user/repo.git \
  --username myusername \
  --email my@email.com \
  --token ghp_your_token_here
```

### Verification

Check your current authentication status:

```bash
node scripts/github-upload-auth.js verify https://github.com/user/repo.git
```

This will verify:
- Authentication configuration
- Remote repository configuration
- Repository access permissions

## Personal Access Token Setup

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name (e.g., "NGSRN Website Upload")
4. Select appropriate expiration (90 days recommended)
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows) - if needed
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again)

## Security Best Practices

### Token Security
- ✅ Never commit tokens to version control
- ✅ Use tokens with minimal required permissions
- ✅ Set reasonable expiration dates
- ✅ Regenerate tokens periodically
- ✅ Revoke unused tokens

### Credential Storage
- ✅ Credentials are not stored in plain text
- ✅ Git credential helper is configured securely
- ✅ Tokens are validated before use
- ✅ Interactive mode hides token input

## Error Handling

The system provides detailed error messages and troubleshooting steps for common issues:

### Authentication Errors
- Invalid credentials
- Expired tokens
- Insufficient permissions
- Rate limiting

### Repository Errors
- Repository not found
- Access denied
- Invalid repository URL
- Network connectivity issues

### Example Error Output
```
❌ Authentication Error:
   • Your GitHub credentials are invalid
   • Please check your username and personal access token
   • Ensure your token has the necessary permissions (repo access)

💡 Troubleshooting:
   1. Verify your GitHub username is correct
   2. Generate a new personal access token at: https://github.com/settings/tokens
   3. Ensure the token has "repo" scope for private repositories
   4. Check that the token hasn't expired
```

## API Reference

### GitHubAuthenticationHandler

Main authentication class with the following methods:

#### `acceptCredentials(credentials)`
Validates and accepts GitHub credentials.

```javascript
const credentials = {
  username: 'myusername',
  email: 'my@email.com',
  token: 'ghp_your_token_here' // optional
};

await authHandler.acceptCredentials(credentials);
```

#### `configureGitAuthentication()`
Configures Git with the provided credentials.

```javascript
await authHandler.configureGitAuthentication();
```

#### `testGitHubAuthentication()`
Tests authentication against GitHub API.

```javascript
const result = await authHandler.testGitHubAuthentication();
console.log(result.success); // true/false
```

#### `testGitRepositoryAuth(repositoryUrl)`
Tests access to a specific repository.

```javascript
const result = await authHandler.testGitRepositoryAuth('https://github.com/user/repo.git');
console.log(result.success); // true/false
```

#### `getAuthenticationStatus()`
Returns current authentication status.

```javascript
const status = authHandler.getAuthenticationStatus();
console.log(status.configured); // true/false
```

### GitHubUploadAuthenticator

Integration class that combines authentication with repository setup:

#### `setupWithAuthentication(options)`
Complete setup with authentication and remote configuration.

```javascript
const result = await authenticator.setupWithAuthentication({
  repositoryUrl: 'https://github.com/user/repo.git',
  credentials: { username, email, token },
  interactive: false,
  testConnection: true
});
```

## Testing

Run the authentication tests to verify functionality:

```bash
# Run all authentication tests
node scripts/test-github-auth.js
```

This will test:
- Credential validation
- Git configuration
- Authentication status
- Error handling
- GitHub API integration (mock)

## Integration with Upload Process

The authentication system integrates with the complete GitHub upload process:

1. **Authentication Setup** (this system)
2. **Repository Initialization** (git init, .gitignore)
3. **File Staging** (git add)
4. **Initial Commit** (git commit)
5. **Push to GitHub** (git push)

## Troubleshooting

### Common Issues

#### "Authentication failed"
- Check username and token are correct
- Ensure token has `repo` scope
- Verify token hasn't expired

#### "Repository not found"
- Check repository URL is correct
- Ensure you have access to the repository
- For private repos, ensure token has `repo` scope

#### "Rate limit exceeded"
- Wait for rate limit to reset (usually 1 hour)
- Use personal access token for higher limits

#### "Network timeout"
- Check internet connection
- Try again in a few minutes
- Check GitHub status page

### Getting Help

1. Run verification: `node scripts/github-upload-auth.js verify`
2. Check error messages for specific troubleshooting steps
3. Visit GitHub documentation: https://docs.github.com/en/authentication
4. Check GitHub status: https://www.githubstatus.com/

## Examples

### Complete Upload Process

```bash
# 1. Set up authentication
node scripts/github-upload-auth.js interactive

# 2. Initialize repository (if not done)
git init
git branch -M main

# 3. Stage files
git add .

# 4. Create initial commit
git commit -m "Initial commit"

# 5. Push to GitHub
git push -u origin main
```

### Automated Setup

```bash
#!/bin/bash
# Automated setup script

REPO_URL="https://github.com/user/repo.git"
USERNAME="myusername"
EMAIL="my@email.com"
TOKEN="ghp_your_token_here"

# Setup authentication
node scripts/github-upload-auth.js quick "$REPO_URL" \
  --username "$USERNAME" \
  --email "$EMAIL" \
  --token "$TOKEN"

# Verify setup
node scripts/github-upload-auth.js verify "$REPO_URL"
```

This authentication system ensures secure, reliable, and user-friendly GitHub integration for the NGSRN website upload process.