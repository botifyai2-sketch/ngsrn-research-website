#!/usr/bin/env node

/**
 * Git Repository Setup Script
 * 
 * This script handles Git repository initialization and basic configuration
 * for the NGSRN website project according to the GitHub upload requirements.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitRepositoryManager {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.gitPath = path.join(projectPath, '.git');
  }

  /**
   * Check if Git repository is already initialized
   */
  isGitInitialized() {
    return fs.existsSync(this.gitPath);
  }

  /**
   * Initialize Git repository if not already initialized
   */
  initializeRepository() {
    console.log('🔧 Checking Git repository status...');
    
    if (this.isGitInitialized()) {
      console.log('✅ Git repository already initialized');
      return true;
    }

    try {
      console.log('📦 Initializing Git repository...');
      execSync('git init', { 
        cwd: this.projectPath, 
        stdio: 'inherit' 
      });
      
      console.log('✅ Git repository initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Git repository:', error.message);
      return false;
    }
  }

  /**
   * Set default branch name to 'main'
   */
  setDefaultBranch() {
    try {
      console.log('🌿 Setting default branch to "main"...');
      
      // Check current branch
      const currentBranch = execSync('git branch --show-current', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();

      if (currentBranch === 'main') {
        console.log('✅ Default branch already set to "main"');
        return true;
      }

      // Set default branch name for new repositories
      execSync('git config init.defaultBranch main', { 
        cwd: this.projectPath, 
        stdio: 'inherit' 
      });

      // If we're on a different branch, rename it to main
      if (currentBranch && currentBranch !== 'main') {
        execSync(`git branch -m ${currentBranch} main`, { 
          cwd: this.projectPath, 
          stdio: 'inherit' 
        });
        console.log(`✅ Renamed branch "${currentBranch}" to "main"`);
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to set default branch:', error.message);
      return false;
    }
  }

  /**
   * Configure Git with user credentials
   */
  configureUser(name, email) {
    try {
      console.log('👤 Configuring Git user credentials...');
      
      if (!name || !email) {
        // Get current configuration if no credentials provided
        const currentName = this.getCurrentUserName();
        const currentEmail = this.getCurrentUserEmail();
        
        if (currentName && currentEmail) {
          console.log(`✅ Using existing Git configuration: ${currentName} <${currentEmail}>`);
          return true;
        } else {
          console.log('⚠️  No Git user configuration found. Please provide credentials.');
          return false;
        }
      }

      // Set user name and email
      execSync(`git config user.name "${name}"`, { 
        cwd: this.projectPath, 
        stdio: 'inherit' 
      });
      
      execSync(`git config user.email "${email}"`, { 
        cwd: this.projectPath, 
        stdio: 'inherit' 
      });

      console.log(`✅ Git user configured: ${name} <${email}>`);
      return true;
    } catch (error) {
      console.error('❌ Failed to configure Git user:', error.message);
      return false;
    }
  }

  /**
   * Get current Git user name
   */
  getCurrentUserName() {
    try {
      return execSync('git config user.name', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
    } catch {
      return null;
    }
  }

  /**
   * Get current Git user email
   */
  getCurrentUserEmail() {
    try {
      return execSync('git config user.email', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
    } catch {
      return null;
    }
  }

  /**
   * Validate repository structure and configuration
   */
  validateRepository() {
    console.log('🔍 Validating repository structure...');
    
    const validations = [
      {
        name: 'Git repository exists',
        check: () => this.isGitInitialized(),
      },
      {
        name: 'Default branch is "main"',
        check: () => {
          try {
            const branch = execSync('git branch --show-current', { 
              cwd: this.projectPath, 
              encoding: 'utf8' 
            }).trim();
            return branch === 'main';
          } catch {
            return false;
          }
        },
      },
      {
        name: 'User name configured',
        check: () => !!this.getCurrentUserName(),
      },
      {
        name: 'User email configured',
        check: () => !!this.getCurrentUserEmail(),
      },
      {
        name: '.gitignore exists',
        check: () => fs.existsSync(path.join(this.projectPath, '.gitignore')),
      },
    ];

    let allValid = true;
    validations.forEach(validation => {
      const isValid = validation.check();
      const status = isValid ? '✅' : '❌';
      console.log(`${status} ${validation.name}`);
      if (!isValid) allValid = false;
    });

    return allValid;
  }

  /**
   * Get repository status information
   */
  getRepositoryStatus() {
    try {
      const status = {
        initialized: this.isGitInitialized(),
        currentBranch: null,
        userName: this.getCurrentUserName(),
        userEmail: this.getCurrentUserEmail(),
        hasCommits: false,
        hasRemote: false,
      };

      if (status.initialized) {
        try {
          status.currentBranch = execSync('git branch --show-current', { 
            cwd: this.projectPath, 
            encoding: 'utf8' 
          }).trim();
        } catch {
          // No current branch (empty repository)
        }

        try {
          execSync('git log --oneline -1', { 
            cwd: this.projectPath, 
            stdio: 'pipe' 
          });
          status.hasCommits = true;
        } catch {
          // No commits yet
        }

        try {
          const remotes = execSync('git remote', { 
            cwd: this.projectPath, 
            encoding: 'utf8' 
          }).trim();
          status.hasRemote = remotes.length > 0;
        } catch {
          // No remotes configured
        }
      }

      return status;
    } catch (error) {
      console.error('❌ Failed to get repository status:', error.message);
      return null;
    }
  }

  /**
   * Complete setup process
   */
  async setupRepository(credentials = {}) {
    console.log('🚀 Starting Git repository setup...\n');

    const steps = [
      () => this.initializeRepository(),
      () => this.setDefaultBranch(),
      () => this.configureUser(credentials.name, credentials.email),
      () => this.validateRepository(),
    ];

    for (let i = 0; i < steps.length; i++) {
      const success = steps[i]();
      if (!success) {
        console.error(`❌ Setup failed at step ${i + 1}`);
        return false;
      }
      console.log(''); // Add spacing between steps
    }

    console.log('🎉 Git repository setup completed successfully!');
    
    // Display final status
    const status = this.getRepositoryStatus();
    if (status) {
      console.log('\n📊 Repository Status:');
      console.log(`   Branch: ${status.currentBranch || 'No current branch'}`);
      console.log(`   User: ${status.userName || 'Not configured'} <${status.userEmail || 'Not configured'}>`);
      console.log(`   Commits: ${status.hasCommits ? 'Yes' : 'No'}`);
      console.log(`   Remote: ${status.hasRemote ? 'Yes' : 'No'}`);
    }

    return true;
  }
}

// Export for use in other scripts
module.exports = GitRepositoryManager;

// Run setup if called directly
if (require.main === module) {
  const manager = new GitRepositoryManager();
  
  // Parse command line arguments for credentials
  const args = process.argv.slice(2);
  const credentials = {};
  
  for (let i = 0; i < args.length; i += 2) {
    if (args[i] === '--name' && args[i + 1]) {
      credentials.name = args[i + 1];
    } else if (args[i] === '--email' && args[i + 1]) {
      credentials.email = args[i + 1];
    }
  }

  manager.setupRepository(credentials)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}