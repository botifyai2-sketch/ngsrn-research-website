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
      case '--help':
        console.log(`
Git Repository Setup Script

Usage: node git-setup.js [options]

Options:
  --name <name>        Set Git user name (default: "NGSRN Developer")
  --email <email>      Set Git user email (default: "ngsrn@example.com")
  --skip-validation    Skip validation step
  --help              Show this help message

Examples:
  node git-setup.js
  node git-setup.js --name "John Doe" --email "john@example.com"
  node git-setup.js --skip-validation
        `);
        process.exit(0);
        break;
    }
  }

  const manager = new GitRepositoryManager();
  manager.setup(options).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = GitRepositoryManager;