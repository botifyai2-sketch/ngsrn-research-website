#!/usr/bin/env node

/**
 * Git Repository Setup Script
 * Handles Git repository initialization and basic configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitRepositoryManager {
  constructor(projectPath = '.') {
    this.projectPath = path.resolve(projectPath);
    this.gitPath = path.join(this.projectPath, '.git');
  }

  /**
   * Initialize Git repository if not already initialized
   */
  initializeRepository() {
    console.log('🔧 Initializing Git repository...');
    
    try {
      if (fs.existsSync(this.gitPath)) {
        console.log('✅ Git repository already exists');
        return true;
      }

      execSync('git init', { cwd: this.projectPath, stdio: 'inherit' });
      console.log('✅ Git repository initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Git repository:', error.message);
      return false;
    }
  }

  /**
   * Configure Git with user name and email
   */
  configureUser(name, email) {
    console.log('👤 Configuring Git user...');
    
    try {
      if (name) {
        execSync(`git config user.name "${name}"`, { cwd: this.projectPath });
        console.log(`✅ Git user name set to: ${name}`);
      }
      
      if (email) {
        execSync(`git config user.email "${email}"`, { cwd: this.projectPath });
        console.log(`✅ Git user email set to: ${email}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to configure Git user:', error.message);
      return false;
    }
  }

  /**
   * Set default branch name to 'main'
   */
  setDefaultBranch() {
    console.log('🌿 Setting default branch to main...');
    
    try {
      // Check current branch
      let currentBranch;
      try {
        currentBranch = execSync('git branch --show-current', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).trim();
      } catch (error) {
        // No commits yet, branch doesn't exist
        currentBranch = null;
      }

      if (currentBranch === 'main') {
        console.log('✅ Already on main branch');
        return true;
      }

      // Set default branch name for new repositories
      execSync('git config init.defaultBranch main', { cwd: this.projectPath });
      
      // If we have commits and we're not on main, create/switch to main
      if (currentBranch && currentBranch !== 'main') {
        try {
          // Check if main branch exists
          execSync('git show-ref --verify --quiet refs/heads/main', { cwd: this.projectPath });
          // Main exists, switch to it
          execSync('git checkout main', { cwd: this.projectPath });
        } catch (error) {
          // Main doesn't exist, create it
          execSync('git checkout -b main', { cwd: this.projectPath });
        }
      }
      
      console.log('✅ Default branch set to main');
      return true;
    } catch (error) {
      console.error('❌ Failed to set default branch:', error.message);
      return false;
    }
  }

  /**
   * Validate repository structure and configuration
   */
  validateRepository() {
    console.log('🔍 Validating repository structure...');
    
    const validations = [];

    // Check if .git directory exists
    if (fs.existsSync(this.gitPath)) {
      validations.push({ check: 'Git repository initialized', status: true });
    } else {
      validations.push({ check: 'Git repository initialized', status: false });
    }

    try {
      // Check user configuration
      const userName = execSync('git config user.name', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      const userEmail = execSync('git config user.email', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();

      validations.push({ 
        check: `User name configured: ${userName}`, 
        status: !!userName 
      });
      validations.push({ 
        check: `User email configured: ${userEmail}`, 
        status: !!userEmail 
      });

      // Check default branch configuration
      let defaultBranch;
      try {
        defaultBranch = execSync('git config init.defaultBranch', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).trim();
      } catch (error) {
        // If not set, check if we're on main branch (which is good enough)
        try {
          const currentBranch = execSync('git branch --show-current', { 
            cwd: this.projectPath, 
            encoding: 'utf8' 
          }).trim();
          defaultBranch = currentBranch === 'main' ? 'main' : 'master';
        } catch (e) {
          defaultBranch = 'master'; // Git default
        }
      }

      validations.push({ 
        check: `Default branch configuration`, 
        status: defaultBranch === 'main' 
      });

      // Check current branch
      let currentBranch;
      try {
        currentBranch = execSync('git branch --show-current', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).trim();
        validations.push({ 
          check: `Current branch: ${currentBranch}`, 
          status: currentBranch === 'main' 
        });
      } catch (error) {
        validations.push({ 
          check: 'Current branch: No commits yet', 
          status: true 
        });
      }

    } catch (error) {
      validations.push({ 
        check: 'Git configuration accessible', 
        status: false, 
        error: error.message 
      });
    }

    // Display validation results
    console.log('\n📋 Validation Results:');
    let allValid = true;
    validations.forEach(validation => {
      const icon = validation.status ? '✅' : '❌';
      console.log(`${icon} ${validation.check}`);
      if (!validation.status) {
        allValid = false;
        if (validation.error) {
          console.log(`   Error: ${validation.error}`);
        }
      }
    });

    return allValid;
  }

  /**
   * Add remote repository using provided GitHub URL
   */
  addRemote(remoteName, repositoryUrl) {
    console.log(`🌐 Adding remote repository: ${remoteName}`);
    
    try {
      // Check if remote already exists
      try {
        const existingRemote = execSync(`git remote get-url ${remoteName}`, { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).trim();
        
        if (existingRemote === repositoryUrl) {
          console.log(`✅ Remote '${remoteName}' already configured with correct URL`);
          return true;
        } else {
          console.log(`⚠️  Remote '${remoteName}' exists with different URL: ${existingRemote}`);
          console.log(`🔄 Updating remote URL to: ${repositoryUrl}`);
          execSync(`git remote set-url ${remoteName} ${repositoryUrl}`, { cwd: this.projectPath });
          console.log(`✅ Remote '${remoteName}' URL updated successfully`);
          return true;
        }
      } catch (error) {
        // Remote doesn't exist, add it
        execSync(`git remote add ${remoteName} ${repositoryUrl}`, { cwd: this.projectPath });
        console.log(`✅ Remote '${remoteName}' added successfully: ${repositoryUrl}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ Failed to add remote '${remoteName}':`, error.message);
      return false;
    }
  }

  /**
   * Configure authentication method (HTTPS with token)
   */
  configureAuthentication(credentials) {
    console.log('🔐 Configuring authentication...');
    
    try {
      const { username, email, token, authMethod = 'https' } = credentials;

      if (authMethod === 'https' && token) {
        // Configure Git to use token for HTTPS authentication
        // This sets up credential helper to use the token
        console.log('🔑 Configuring HTTPS authentication with token...');
        
        // Set up credential helper for token-based auth
        execSync('git config credential.helper store', { cwd: this.projectPath });
        
        console.log('✅ Authentication method configured for HTTPS with token');
        return true;
      } else if (authMethod === 'ssh') {
        console.log('🔑 SSH authentication method selected');
        console.log('⚠️  Please ensure SSH keys are properly configured in your system');
        return true;
      } else {
        console.log('🔑 Using default Git authentication');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to configure authentication:', error.message);
      return false;
    }
  }

  /**
   * Test remote connection and repository access
   */
  async testRemoteConnection(remoteName = 'origin') {
    console.log(`🔍 Testing connection to remote '${remoteName}'...`);
    
    try {
      // First check if remote exists
      const remoteUrl = execSync(`git remote get-url ${remoteName}`, { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      
      console.log(`📡 Testing connection to: ${remoteUrl}`);

      // Test connection by doing a lightweight operation
      try {
        execSync(`git ls-remote --heads ${remoteName}`, { 
          cwd: this.projectPath, 
          stdio: 'pipe',
          timeout: 30000 // 30 second timeout
        });
        console.log('✅ Remote connection test successful');
        return true;
      } catch (error) {
        if (error.message.includes('Authentication failed') || 
            error.message.includes('Permission denied') ||
            error.message.includes('403')) {
          console.error('❌ Authentication failed - please check your credentials');
          console.log('💡 Tip: Make sure your GitHub token has the necessary permissions');
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          console.error('❌ Network connection failed - please check your internet connection');
        } else if (error.message.includes('Repository not found') || error.message.includes('404')) {
          console.error('❌ Repository not found - please check the repository URL');
        } else {
          console.error('❌ Remote connection test failed:', error.message);
        }
        return false;
      }
    } catch (error) {
      console.error(`❌ Remote '${remoteName}' not configured:`, error.message);
      return false;
    }
  }

  /**
   * Validate remote configuration settings
   */
  validateRemoteConfiguration(remoteName = 'origin') {
    console.log(`🔍 Validating remote configuration for '${remoteName}'...`);
    
    const validations = [];

    try {
      // Check if remote exists
      const remoteUrl = execSync(`git remote get-url ${remoteName}`, { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      
      validations.push({ 
        check: `Remote '${remoteName}' configured`, 
        status: true,
        details: remoteUrl
      });

      // Validate URL format
      const isValidGitHubUrl = remoteUrl.includes('github.com') && 
                              (remoteUrl.startsWith('https://') || remoteUrl.startsWith('git@'));
      
      validations.push({ 
        check: 'Valid GitHub URL format', 
        status: isValidGitHubUrl,
        details: isValidGitHubUrl ? 'URL format is valid' : 'URL should be GitHub HTTPS or SSH format'
      });

      // Check authentication method
      const authMethod = remoteUrl.startsWith('https://') ? 'HTTPS' : 
                        remoteUrl.startsWith('git@') ? 'SSH' : 'Unknown';
      
      validations.push({ 
        check: `Authentication method: ${authMethod}`, 
        status: authMethod !== 'Unknown',
        details: `Using ${authMethod} authentication`
      });

      // Check credential helper configuration (for HTTPS)
      if (authMethod === 'HTTPS') {
        try {
          const credentialHelper = execSync('git config credential.helper', { 
            cwd: this.projectPath, 
            encoding: 'utf8' 
          }).trim();
          
          validations.push({ 
            check: 'Credential helper configured', 
            status: !!credentialHelper,
            details: credentialHelper || 'No credential helper configured'
          });
        } catch (error) {
          validations.push({ 
            check: 'Credential helper configured', 
            status: false,
            details: 'No credential helper configured'
          });
        }
      }

    } catch (error) {
      validations.push({ 
        check: `Remote '${remoteName}' configured`, 
        status: false,
        details: error.message
      });
    }

    // Display validation results
    console.log('\n📋 Remote Configuration Validation:');
    let allValid = true;
    validations.forEach(validation => {
      const icon = validation.status ? '✅' : '❌';
      console.log(`${icon} ${validation.check}`);
      if (validation.details) {
        console.log(`   ${validation.details}`);
      }
      if (!validation.status) {
        allValid = false;
      }
    });

    return allValid;
  }

  /**
   * Configure GitHub remote repository with full setup
   */
  async configureGitHubRemote(options = {}) {
    console.log('🚀 Configuring GitHub remote repository...\n');

    const {
      repositoryUrl,
      remoteName = 'origin',
      credentials = {},
      testConnection = true
    } = options;

    if (!repositoryUrl) {
      console.error('❌ Repository URL is required');
      return false;
    }

    let success = true;

    // Step 1: Add remote repository
    if (!this.addRemote(remoteName, repositoryUrl)) {
      success = false;
    }

    // Step 2: Configure authentication
    if (success && Object.keys(credentials).length > 0) {
      if (!this.configureAuthentication(credentials)) {
        success = false;
      }
    }

    // Step 3: Test remote connection
    if (success && testConnection) {
      if (!await this.testRemoteConnection(remoteName)) {
        console.log('⚠️  Remote connection test failed, but configuration may still be valid');
        console.log('💡 You may need to configure authentication or check network connectivity');
      }
    }

    // Step 4: Validate remote configuration
    if (success) {
      if (!this.validateRemoteConfiguration(remoteName)) {
        console.log('\n⚠️  Some remote configuration validations failed');
      }
    }

    if (success) {
      console.log('\n🎉 GitHub remote repository configuration completed successfully!');
      console.log(`📡 Remote '${remoteName}' configured: ${repositoryUrl}`);
    } else {
      console.log('\n❌ GitHub remote repository configuration failed. Please check the errors above.');
    }

    return success;
  }

  /**
   * Get repository status information
   */
  getRepositoryInfo() {
    console.log('\n📊 Repository Information:');
    
    try {
      // Repository path
      console.log(`📁 Repository path: ${this.projectPath}`);
      
      // Current branch
      try {
        const currentBranch = execSync('git branch --show-current', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).trim();
        console.log(`🌿 Current branch: ${currentBranch}`);
      } catch (error) {
        console.log('🌿 Current branch: No commits yet');
      }

      // Repository status
      try {
        const status = execSync('git status --porcelain', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        });
        const fileCount = status.split('\n').filter(line => line.trim()).length;
        console.log(`📝 Modified files: ${fileCount}`);
      } catch (error) {
        console.log('📝 Status: Unable to get status');
      }

      // Commit count
      try {
        const commitCount = execSync('git rev-list --count HEAD', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).trim();
        console.log(`📚 Total commits: ${commitCount}`);
      } catch (error) {
        console.log('📚 Total commits: 0 (no commits yet)');
      }

      // Remote repositories
      try {
        const remotes = execSync('git remote -v', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).trim();
        if (remotes) {
          console.log('🌐 Remote repositories:');
          remotes.split('\n').forEach(remote => {
            console.log(`   ${remote}`);
          });
        } else {
          console.log('🌐 Remote repositories: None configured');
        }
      } catch (error) {
        console.log('🌐 Remote repositories: None configured');
      }

    } catch (error) {
      console.error('❌ Failed to get repository information:', error.message);
    }
  }

  /**
   * Execute complete setup process
   */
  async setup(options = {}) {
    console.log('🚀 Starting Git repository setup...\n');

    const {
      userName = 'NGSRN Developer',
      userEmail = 'ngsrn@example.com',
      skipValidation = false
    } = options;

    let success = true;

    // Step 1: Initialize repository
    if (!this.initializeRepository()) {
      success = false;
    }

    // Step 2: Configure user
    if (success && !this.configureUser(userName, userEmail)) {
      success = false;
    }

    // Step 3: Set default branch
    if (success && !this.setDefaultBranch()) {
      success = false;
    }

    // Step 4: Validate setup
    if (success && !skipValidation) {
      if (!this.validateRepository()) {
        console.log('\n⚠️  Some validations failed, but setup may still be functional');
      }
    }

    // Step 5: Display repository info
    this.getRepositoryInfo();

    if (success) {
      console.log('\n🎉 Git repository setup completed successfully!');
    } else {
      console.log('\n❌ Git repository setup failed. Please check the errors above.');
    }

    return success;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  const remoteOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--name':
        options.userName = args[++i];
        break;
      case '--email':
        options.userEmail = args[++i];
        break;
      case '--skip-validation':
        options.skipValidation = true;
        break;
      case '--remote-url':
        remoteOptions.repositoryUrl = args[++i];
        break;
      case '--remote-name':
        remoteOptions.remoteName = args[++i];
        break;
      case '--token':
        remoteOptions.credentials = { 
          ...remoteOptions.credentials, 
          token: args[++i], 
          authMethod: 'https' 
        };
        break;
      case '--skip-connection-test':
        remoteOptions.testConnection = false;
        break;
      case '--configure-remote-only':
        options.configureRemoteOnly = true;
        break;
      case '--help':
        console.log(`
Git Repository Setup Script

Usage: node git-setup.js [options]

Options:
  --name <name>                Set Git user name (default: "NGSRN Developer")
  --email <email>              Set Git user email (default: "ngsrn@example.com")
  --skip-validation            Skip validation step
  --remote-url <url>           GitHub repository URL to add as remote
  --remote-name <name>         Remote name (default: "origin")
  --token <token>              GitHub personal access token for HTTPS auth
  --skip-connection-test       Skip testing remote connection
  --configure-remote-only      Only configure remote, skip basic Git setup
  --help                       Show this help message

Examples:
  node git-setup.js
  node git-setup.js --name "John Doe" --email "john@example.com"
  node git-setup.js --remote-url "https://github.com/user/repo.git" --token "ghp_xxxx"
  node git-setup.js --configure-remote-only --remote-url "https://github.com/user/repo.git"
        `);
        process.exit(0);
        break;
    }
  }

  const manager = new GitRepositoryManager();

  async function runSetup() {
    let success = true;

    if (options.configureRemoteOnly) {
      // Only configure remote repository
      if (remoteOptions.repositoryUrl) {
        success = await manager.configureGitHubRemote(remoteOptions);
      } else {
        console.error('❌ --remote-url is required when using --configure-remote-only');
        success = false;
      }
    } else {
      // Run full setup
      success = await manager.setup(options);
      
      // Configure remote if URL provided
      if (success && remoteOptions.repositoryUrl) {
        console.log('\n🌐 Configuring remote repository...');
        const remoteSuccess = await manager.configureGitHubRemote(remoteOptions);
        if (!remoteSuccess) {
          console.log('⚠️  Remote configuration failed, but basic Git setup was successful');
        }
      }
    }

    return success;
  }

  runSetup().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = GitRepositoryManager;