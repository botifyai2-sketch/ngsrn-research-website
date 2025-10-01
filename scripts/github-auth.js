#!/usr/bin/env node

/**
 * GitHub Authentication Handler
 * Secure credential handling and authentication for GitHub operations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');

class GitHubAuthenticationHandler {
  constructor(projectPath = '.') {
    this.projectPath = path.resolve(projectPath);
    this.credentials = null;
  }

  /**
   * Accept and validate GitHub credentials
   */
  async acceptCredentials(credentials) {
    console.log('🔐 Validating GitHub credentials...');
    
    // Validate required fields
    if (!credentials.username || !credentials.email) {
      throw new Error('Username and email are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error('Invalid email format');
    }

    // Validate token if provided
    if (credentials.token) {
      if (!credentials.token.startsWith('ghp_') && !credentials.token.startsWith('github_pat_')) {
        console.warn('⚠️  Token format may be invalid. GitHub personal access tokens typically start with "ghp_" or "github_pat_"');
      }
      
      if (credentials.token.length < 20) {
        throw new Error('Token appears to be too short. GitHub tokens are typically 40+ characters');
      }
    }

    this.credentials = {
      username: credentials.username.trim(),
      email: credentials.email.trim(),
      token: credentials.token ? credentials.token.trim() : null,
      authMethod: credentials.token ? 'token' : 'https'
    };

    console.log('✅ Credentials validated successfully');
    console.log(`   Username: ${this.credentials.username}`);
    console.log(`   Email: ${this.credentials.email}`);
    console.log(`   Auth Method: ${this.credentials.authMethod}`);
    
    return this.credentials;
  }

  /**
   * Prompt for credentials interactively
   */
  async promptForCredentials() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => {
      rl.question(prompt, resolve);
    });

    const questionHidden = (prompt) => new Promise((resolve) => {
      process.stdout.write(prompt);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      
      let input = '';
      const onData = (char) => {
        if (char === '\u0003') { // Ctrl+C
          process.exit(1);
        } else if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(input);
        } else if (char === '\u007f') { // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          input += char;
          process.stdout.write('*');
        }
      };
      
      process.stdin.on('data', onData);
    });

    try {
      console.log('🔐 GitHub Credential Setup');
      console.log('Please provide your GitHub credentials:\n');

      const username = await question('GitHub Username: ');
      const email = await question('GitHub Email: ');
      const token = await questionHidden('GitHub Personal Access Token (hidden): ');

      rl.close();

      return await this.acceptCredentials({
        username,
        email,
        token: token || null
      });
    } catch (error) {
      rl.close();
      throw error;
    }
  }

  /**
   * Configure Git authentication for HTTPS operations
   */
  async configureGitAuthentication() {
    if (!this.credentials) {
      throw new Error('Credentials must be set before configuring Git authentication');
    }

    console.log('⚙️  Configuring Git authentication...');

    try {
      // Configure user identity
      execSync(`git config user.name "${this.credentials.username}"`, { 
        cwd: this.projectPath 
      });
      
      execSync(`git config user.email "${this.credentials.email}"`, { 
        cwd: this.projectPath 
      });

      console.log('✅ Git user identity configured');

      // Configure credential helper for HTTPS
      if (this.credentials.authMethod === 'token') {
        // For token-based auth, we'll use credential helper
        execSync('git config credential.helper store', { 
          cwd: this.projectPath 
        });
        
        // Set up credential timeout (1 hour)
        execSync('git config credential.helper "cache --timeout=3600"', { 
          cwd: this.projectPath 
        });
        
        console.log('✅ Git credential helper configured for token authentication');
      } else {
        // For basic HTTPS, configure credential helper
        execSync('git config credential.helper store', { 
          cwd: this.projectPath 
        });
        
        console.log('✅ Git credential helper configured for HTTPS authentication');
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to configure Git authentication:', error.message);
      throw error;
    }
  }

  /**
   * Test authentication against GitHub API
   */
  async testGitHubAuthentication() {
    if (!this.credentials) {
      throw new Error('Credentials must be set before testing authentication');
    }

    console.log('🔍 Testing GitHub API authentication...');

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        port: 443,
        path: '/user',
        method: 'GET',
        headers: {
          'User-Agent': 'NGSRN-Website-Setup/1.0',
          'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 10000
      };

      // Add authentication header if token is available
      if (this.credentials.token) {
        options.headers['Authorization'] = `token ${this.credentials.token}`;
      }

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const userData = JSON.parse(data);
              console.log('✅ GitHub API authentication successful');
              console.log(`   Authenticated as: ${userData.login}`);
              console.log(`   Account type: ${userData.type}`);
              
              // Verify username matches
              if (userData.login.toLowerCase() !== this.credentials.username.toLowerCase()) {
                console.warn(`⚠️  Warning: API username (${userData.login}) differs from provided username (${this.credentials.username})`);
              }
              
              resolve({
                success: true,
                user: userData,
                message: 'Authentication successful'
              });
            } else if (res.statusCode === 401) {
              console.error('❌ GitHub API authentication failed: Invalid credentials');
              resolve({
                success: false,
                error: 'Invalid credentials',
                statusCode: res.statusCode
              });
            } else if (res.statusCode === 403) {
              console.error('❌ GitHub API authentication failed: Access forbidden (rate limited or insufficient permissions)');
              resolve({
                success: false,
                error: 'Access forbidden',
                statusCode: res.statusCode
              });
            } else {
              console.error(`❌ GitHub API authentication failed: HTTP ${res.statusCode}`);
              resolve({
                success: false,
                error: `HTTP ${res.statusCode}`,
                statusCode: res.statusCode
              });
            }
          } catch (parseError) {
            console.error('❌ Failed to parse GitHub API response:', parseError.message);
            reject(parseError);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ GitHub API request failed:', error.message);
        reject(error);
      });

      req.on('timeout', () => {
        console.error('❌ GitHub API request timed out');
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  /**
   * Test Git repository authentication
   */
  async testGitRepositoryAuth(repositoryUrl) {
    if (!repositoryUrl) {
      throw new Error('Repository URL is required for testing Git authentication');
    }

    console.log('🔍 Testing Git repository authentication...');

    try {
      // Test with ls-remote command
      const command = `git ls-remote --exit-code "${repositoryUrl}" HEAD`;
      
      execSync(command, { 
        cwd: this.projectPath, 
        stdio: 'pipe',
        timeout: 15000,
        env: {
          ...process.env,
          GIT_ASKPASS: 'echo', // Prevent interactive password prompts
          GIT_TERMINAL_PROMPT: '0'
        }
      });
      
      console.log('✅ Git repository authentication successful');
      return {
        success: true,
        message: 'Repository access verified'
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      
      if (error.message.includes('Authentication failed')) {
        errorMessage = 'Authentication failed - check credentials';
      } else if (error.message.includes('Repository not found')) {
        errorMessage = 'Repository not found or access denied';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Connection timeout';
      } else if (error.status === 128) {
        errorMessage = 'Git authentication error';
      }
      
      console.error(`❌ Git repository authentication failed: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
        details: error.message
      };
    }
  }

  /**
   * Handle authentication errors with clear messaging
   */
  handleAuthenticationError(error, context = 'authentication') {
    console.error(`\n❌ ${context.charAt(0).toUpperCase() + context.slice(1)} Error:`);
    
    if (error.message.includes('Invalid credentials') || error.message.includes('Authentication failed')) {
      console.error('   • Your GitHub credentials are invalid');
      console.error('   • Please check your username and personal access token');
      console.error('   • Ensure your token has the necessary permissions (repo access)');
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Verify your GitHub username is correct');
      console.error('   2. Generate a new personal access token at: https://github.com/settings/tokens');
      console.error('   3. Ensure the token has "repo" scope for private repositories');
      console.error('   4. Check that the token hasn\'t expired');
    } else if (error.message.includes('Repository not found') || error.message.includes('access denied')) {
      console.error('   • The repository doesn\'t exist or you don\'t have access');
      console.error('   • Check the repository URL is correct');
      console.error('   • Ensure you have push access to the repository');
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Verify the repository URL is correct');
      console.error('   2. Check you have write access to the repository');
      console.error('   3. If it\'s a private repo, ensure your token has repo scope');
    } else if (error.message.includes('rate limit') || error.message.includes('403')) {
      console.error('   • GitHub API rate limit exceeded or access forbidden');
      console.error('   • Wait a few minutes before trying again');
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Wait for rate limit to reset (usually 1 hour)');
      console.error('   2. Use a personal access token for higher rate limits');
    } else if (error.message.includes('timeout') || error.message.includes('network')) {
      console.error('   • Network connection issue');
      console.error('   • Check your internet connection');
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check your internet connection');
      console.error('   2. Try again in a few minutes');
      console.error('   3. Check if GitHub is experiencing issues');
    } else {
      console.error(`   • ${error.message}`);
      console.error('\n💡 General troubleshooting:');
      console.error('   1. Check your GitHub credentials');
      console.error('   2. Verify repository URL and permissions');
      console.error('   3. Ensure stable internet connection');
    }
    
    console.error('\n📚 For more help, visit: https://docs.github.com/en/authentication');
  }

  /**
   * Complete authentication setup process
   */
  async setupAuthentication(options = {}) {
    const {
      credentials,
      repositoryUrl,
      interactive = false,
      testConnection = true
    } = options;

    console.log('🚀 Starting GitHub authentication setup...\n');

    try {
      // Step 1: Get credentials
      if (credentials) {
        await this.acceptCredentials(credentials);
      } else if (interactive) {
        await this.promptForCredentials();
      } else {
        throw new Error('Credentials must be provided or interactive mode enabled');
      }

      // Step 2: Configure Git authentication
      await this.configureGitAuthentication();

      // Step 3: Test GitHub API authentication
      if (testConnection) {
        const apiResult = await this.testGitHubAuthentication();
        if (!apiResult.success) {
          throw new Error(`GitHub API authentication failed: ${apiResult.error}`);
        }
      }

      // Step 4: Test repository authentication (if URL provided)
      if (testConnection && repositoryUrl) {
        const repoResult = await this.testGitRepositoryAuth(repositoryUrl);
        if (!repoResult.success) {
          console.warn(`⚠️  Repository authentication test failed: ${repoResult.error}`);
          console.warn('   This may be normal for new repositories that don\'t exist yet');
        }
      }

      console.log('\n🎉 GitHub authentication setup completed successfully!');
      console.log('✅ Credentials validated and configured');
      console.log('✅ Git authentication configured');
      if (testConnection) {
        console.log('✅ GitHub API access verified');
      }

      return {
        success: true,
        credentials: {
          username: this.credentials.username,
          email: this.credentials.email,
          authMethod: this.credentials.authMethod
        }
      };
    } catch (error) {
      this.handleAuthenticationError(error, 'authentication setup');
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current authentication status
   */
  getAuthenticationStatus() {
    if (!this.credentials) {
      return {
        configured: false,
        message: 'No credentials configured'
      };
    }

    return {
      configured: true,
      username: this.credentials.username,
      email: this.credentials.email,
      authMethod: this.credentials.authMethod,
      hasToken: !!this.credentials.token
    };
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
GitHub Authentication Setup Script

Usage: node github-auth.js [options]

Options:
  --interactive           Prompt for credentials interactively
  --username <username>   GitHub username
  --email <email>         GitHub email
  --token <token>         GitHub personal access token
  --repository <url>      Repository URL for testing
  --no-test              Skip connection testing
  --help                 Show this help message

Examples:
  node github-auth.js --interactive
  node github-auth.js --username myuser --email my@email.com --token ghp_xxx
  node github-auth.js --interactive --repository https://github.com/user/repo.git
    `);
    process.exit(0);
  }

  async function main() {
    const options = {
      interactive: args.includes('--interactive'),
      testConnection: !args.includes('--no-test')
    };

    // Parse credentials from command line
    const usernameIndex = args.indexOf('--username');
    const emailIndex = args.indexOf('--email');
    const tokenIndex = args.indexOf('--token');
    const repositoryIndex = args.indexOf('--repository');

    if (usernameIndex !== -1 && emailIndex !== -1) {
      options.credentials = {
        username: args[usernameIndex + 1],
        email: args[emailIndex + 1],
        token: tokenIndex !== -1 ? args[tokenIndex + 1] : null
      };
    }

    if (repositoryIndex !== -1) {
      options.repositoryUrl = args[repositoryIndex + 1];
    }

    const authHandler = new GitHubAuthenticationHandler();
    const result = await authHandler.setupAuthentication(options);
    
    process.exit(result.success ? 0 : 1);
  }

  main().catch((error) => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = GitHubAuthenticationHandler;