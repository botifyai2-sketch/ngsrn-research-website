#!/usr/bin/env node

/**
 * Simple GitHub Remote Repository Configuration Script
 * Handles adding and configuring GitHub remotes with robust error handling
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubRemoteManager {
  constructor(projectPath = '.') {
    this.projectPath = path.resolve(projectPath);
  }

  /**
   * Check if we're in a Git repository
   */
  isGitRepository() {
    try {
      execSync('git rev-parse --git-dir', { 
        cwd: this.projectPath, 
        stdio: 'pipe' 
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add or update remote repository
   */
  configureRemote(remoteName, repositoryUrl) {
    console.log(`🌐 Configuring remote '${remoteName}' with URL: ${repositoryUrl}`);
    
    if (!this.isGitRepository()) {
      console.error('❌ Not a Git repository. Please initialize Git first.');
      return false;
    }

    try {
      // Check if remote already exists
      let remoteExists = false;
      try {
        execSync(`git remote get-url ${remoteName}`, { 
          cwd: this.projectPath, 
          stdio: 'pipe' 
        });
        remoteExists = true;
      } catch (error) {
        // Remote doesn't exist, which is fine
      }

      if (remoteExists) {
        console.log(`🔄 Updating existing remote '${remoteName}'`);
        execSync(`git remote set-url ${remoteName} ${repositoryUrl}`, { 
          cwd: this.projectPath 
        });
      } else {
        console.log(`➕ Adding new remote '${remoteName}'`);
        execSync(`git remote add ${remoteName} ${repositoryUrl}`, { 
          cwd: this.projectPath 
        });
      }

      console.log(`✅ Remote '${remoteName}' configured successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to configure remote '${remoteName}':`, error.message);
      return false;
    }
  }

  /**
   * Configure HTTPS authentication with credential helper
   */
  configureHTTPSAuth() {
    console.log('🔐 Configuring HTTPS authentication...');
    
    try {
      // Set credential helper to store credentials
      execSync('git config credential.helper store', { 
        cwd: this.projectPath 
      });
      console.log('✅ Credential helper configured for HTTPS authentication');
      return true;
    } catch (error) {
      console.error('❌ Failed to configure authentication:', error.message);
      return false;
    }
  }

  /**
   * Test remote connection (basic check)
   */
  testRemoteConnection(remoteName) {
    console.log(`🔍 Testing connection to remote '${remoteName}'...`);
    
    try {
      // Get remote URL first
      const remoteUrl = execSync(`git remote get-url ${remoteName}`, { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      
      console.log(`📡 Remote URL: ${remoteUrl}`);

      // Try a simple ls-remote command with timeout
      execSync(`git ls-remote --exit-code ${remoteName} HEAD`, { 
        cwd: this.projectPath, 
        stdio: 'pipe',
        timeout: 15000 // 15 second timeout
      });
      
      console.log('✅ Remote connection test successful');
      return true;
    } catch (error) {
      if (error.code === 'ETIMEDOUT') {
        console.log('⚠️  Connection test timed out - this may be normal');
      } else if (error.message.includes('Authentication failed')) {
        console.log('⚠️  Authentication required - please ensure credentials are configured');
      } else {
        console.log('⚠️  Connection test failed - this may be normal for new repositories');
      }
      console.log('💡 Remote is configured but connection could not be verified');
      return false;
    }
  }

  /**
   * Validate remote configuration
   */
  validateRemote(remoteName) {
    console.log(`🔍 Validating remote '${remoteName}' configuration...`);
    
    try {
      const remoteUrl = execSync(`git remote get-url ${remoteName}`, { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      
      console.log(`✅ Remote '${remoteName}' is configured`);
      console.log(`   URL: ${remoteUrl}`);
      
      // Check if it's a valid GitHub URL
      const isGitHubUrl = remoteUrl.includes('github.com');
      const isHTTPS = remoteUrl.startsWith('https://');
      const isSSH = remoteUrl.startsWith('git@');
      
      if (isGitHubUrl) {
        console.log('✅ Valid GitHub URL detected');
      } else {
        console.log('⚠️  URL does not appear to be a GitHub repository');
      }
      
      if (isHTTPS) {
        console.log('✅ Using HTTPS authentication');
      } else if (isSSH) {
        console.log('✅ Using SSH authentication');
      } else {
        console.log('⚠️  Unknown authentication method');
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Remote '${remoteName}' is not configured:`, error.message);
      return false;
    }
  }

  /**
   * List all configured remotes
   */
  listRemotes() {
    console.log('📋 Configured remotes:');
    
    try {
      const remotes = execSync('git remote -v', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      
      if (remotes) {
        console.log(remotes);
      } else {
        console.log('   No remotes configured');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to list remotes:', error.message);
      return false;
    }
  }

  /**
   * Complete setup process
   */
  setup(options = {}) {
    const {
      repositoryUrl,
      remoteName = 'origin',
      configureAuth = true,
      testConnection = false
    } = options;

    console.log('🚀 Starting GitHub remote configuration...\n');

    if (!repositoryUrl) {
      console.error('❌ Repository URL is required');
      return false;
    }

    let success = true;

    // Step 1: Configure remote
    if (!this.configureRemote(remoteName, repositoryUrl)) {
      success = false;
    }

    // Step 2: Configure authentication (if requested)
    if (success && configureAuth && repositoryUrl.startsWith('https://')) {
      if (!this.configureHTTPSAuth()) {
        console.log('⚠️  Authentication configuration failed, but remote is still configured');
      }
    }

    // Step 3: Validate configuration
    if (success) {
      this.validateRemote(remoteName);
    }

    // Step 4: Test connection (if requested)
    if (success && testConnection) {
      this.testRemoteConnection(remoteName);
    }

    // Step 5: Show all remotes
    console.log('');
    this.listRemotes();

    if (success) {
      console.log('\n🎉 GitHub remote configuration completed!');
      console.log(`📡 Remote '${remoteName}' is ready to use`);
      console.log('\n💡 Next steps:');
      console.log('   - Add and commit your files: git add . && git commit -m "Initial commit"');
      console.log(`   - Push to remote: git push -u ${remoteName} main`);
    } else {
      console.log('\n❌ GitHub remote configuration failed');
    }

    return success;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.length === 0) {
    console.log(`
GitHub Remote Setup Script

Usage: node github-remote-setup.js <repository-url> [options]

Arguments:
  <repository-url>     GitHub repository URL (required)

Options:
  --remote-name <name> Remote name (default: "origin")
  --no-auth           Skip authentication configuration
  --test-connection   Test remote connection after setup
  --help              Show this help message

Examples:
  node github-remote-setup.js https://github.com/user/repo.git
  node github-remote-setup.js https://github.com/user/repo.git --remote-name upstream
  node github-remote-setup.js https://github.com/user/repo.git --test-connection
    `);
    process.exit(0);
  }

  const repositoryUrl = args[0];
  const options = { repositoryUrl };

  // Parse options
  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--remote-name':
        options.remoteName = args[++i];
        break;
      case '--no-auth':
        options.configureAuth = false;
        break;
      case '--test-connection':
        options.testConnection = true;
        break;
    }
  }

  const manager = new GitHubRemoteManager();
  const success = manager.setup(options);
  process.exit(success ? 0 : 1);
}

module.exports = GitHubRemoteManager;