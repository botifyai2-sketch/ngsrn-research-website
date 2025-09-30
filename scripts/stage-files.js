#!/usr/bin/env node

/**
 * File Staging Script for GitHub Upload
 * Stages all appropriate project files while respecting .gitignore
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FileStagingManager {
  constructor() {
    this.projectRoot = process.cwd();
    this.gitignorePath = path.join(this.projectRoot, '.gitignore');
  }

  /**
   * Stage all appropriate files while respecting .gitignore
   */
  async stageFiles() {
    try {
      console.log('🔍 Checking repository status...');
      
      // First, add the updated .gitignore file
      this.executeGitCommand('git add .gitignore');
      console.log('✅ Staged .gitignore file');

      // Add all files, respecting .gitignore patterns
      console.log('📁 Staging all appropriate project files...');
      this.executeGitCommand('git add .');
      
      // Get the status after staging
      const status = this.getRepositoryStatus();
      console.log('📊 Repository status after staging:');
      console.log(status);

      return this.validateStagedFiles();
    } catch (error) {
      console.error('❌ Error during file staging:', error.message);
      throw error;
    }
  }

  /**
   * Execute Git command with error handling
   */
  executeGitCommand(command) {
    try {
      const result = execSync(command, { 
        cwd: this.projectRoot, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return result.trim();
    } catch (error) {
      throw new Error(`Git command failed: ${command}\n${error.message}`);
    }
  }

  /**
   * Get current repository status
   */
  getRepositoryStatus() {
    try {
      return this.executeGitCommand('git status --porcelain');
    } catch (error) {
      throw new Error(`Failed to get repository status: ${error.message}`);
    }
  }

  /**
   * Validate staged files and ensure sensitive files are excluded
   */
  validateStagedFiles() {
    try {
      console.log('🔍 Validating staged files...');
      
      // Get list of staged files
      const stagedFiles = this.executeGitCommand('git diff --cached --name-only');
      const stagedFilesList = stagedFiles.split('\n').filter(file => file.trim());
      
      console.log(`📋 Found ${stagedFilesList.length} staged files`);
      
      // Check for sensitive files that shouldn't be staged
      const sensitivePatterns = [
        /\.env$/,
        /\.env\.local$/,
        /\.env\.production$/,
        /\.env\.staging$/,
        /\.env\.development$/,
        /\.env\.test$/,
        /\.env\..*\.local$/,
        /node_modules\//,
        /\.next\//,
        /\.cache\//,
        /\.log$/,
        /\.db$/,
        /\.sqlite$/
      ];

      const problematicFiles = stagedFilesList.filter(file => 
        sensitivePatterns.some(pattern => pattern.test(file))
      );

      if (problematicFiles.length > 0) {
        console.warn('⚠️  Warning: Found potentially sensitive files staged:');
        problematicFiles.forEach(file => console.warn(`   - ${file}`));
        
        // Unstage sensitive files
        problematicFiles.forEach(file => {
          try {
            this.executeGitCommand(`git reset HEAD "${file}"`);
            console.log(`🔒 Unstaged sensitive file: ${file}`);
          } catch (error) {
            console.warn(`⚠️  Could not unstage ${file}: ${error.message}`);
          }
        });
      }

      // Get final staged files count
      const finalStagedFiles = this.executeGitCommand('git diff --cached --name-only');
      const finalCount = finalStagedFiles.split('\n').filter(file => file.trim()).length;
      
      console.log(`✅ Validation complete. ${finalCount} files ready for commit`);
      
      return {
        stagedCount: finalCount,
        stagedFiles: finalStagedFiles.split('\n').filter(file => file.trim()),
        excludedFiles: problematicFiles
      };
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  /**
   * Create descriptive initial commit message
   */
  createCommitMessage() {
    const timestamp = new Date().toISOString().split('T')[0];
    return `Initial commit: NGSRN Research Website

- Complete Next.js research website implementation
- Comprehensive CMS with article and media management
- Advanced search functionality with AI integration
- SEO optimization and accessibility compliance
- Performance monitoring and analytics integration
- Responsive design with modern UI components
- Database integration with Prisma ORM
- Testing suite with Jest and Playwright
- Deployment configuration for Vercel

Date: ${timestamp}`;
  }

  /**
   * Execute initial commit with proper Git configuration
   */
  async createInitialCommit() {
    try {
      console.log('📝 Creating initial commit...');
      
      // Verify we have staged files
      const stagedFiles = this.executeGitCommand('git diff --cached --name-only');
      if (!stagedFiles.trim()) {
        throw new Error('No files staged for commit');
      }

      // Create commit with descriptive message
      const commitMessage = this.createCommitMessage();
      this.executeGitCommand(`git commit -m "${commitMessage}"`);
      
      console.log('✅ Initial commit created successfully');
      
      // Get commit hash for validation
      const commitHash = this.executeGitCommand('git rev-parse HEAD');
      console.log(`📋 Commit hash: ${commitHash}`);
      
      return {
        commitHash,
        message: commitMessage
      };
    } catch (error) {
      throw new Error(`Failed to create initial commit: ${error.message}`);
    }
  }

  /**
   * Validate commit creation and file inclusion
   */
  async validateCommit() {
    try {
      console.log('🔍 Validating commit creation...');
      
      // Check if we have commits
      const commitCount = this.executeGitCommand('git rev-list --count HEAD');
      if (parseInt(commitCount) === 0) {
        throw new Error('No commits found in repository');
      }

      // Get commit details
      const commitInfo = this.executeGitCommand('git show --stat HEAD');
      console.log('📊 Commit details:');
      console.log(commitInfo);

      // Get list of files in the commit
      const committedFiles = this.executeGitCommand('git diff-tree --no-commit-id --name-only -r HEAD');
      const fileCount = committedFiles.split('\n').filter(file => file.trim()).length;
      
      console.log(`✅ Commit validation successful. ${fileCount} files included in commit`);
      
      return {
        commitExists: true,
        fileCount,
        committedFiles: committedFiles.split('\n').filter(file => file.trim())
      };
    } catch (error) {
      throw new Error(`Commit validation failed: ${error.message}`);
    }
  }

  /**
   * Main execution function
   */
  async execute() {
    try {
      console.log('🚀 Starting file staging and commit process...\n');
      
      // Step 1: Stage files
      const stagingResult = await this.stageFiles();
      console.log(`\n📁 Staging completed: ${stagingResult.stagedCount} files staged\n`);
      
      // Step 2: Create initial commit
      const commitResult = await this.createInitialCommit();
      console.log(`\n📝 Commit created: ${commitResult.commitHash}\n`);
      
      // Step 3: Validate commit
      const validationResult = await this.validateCommit();
      console.log(`\n✅ Process completed successfully!`);
      console.log(`📊 Summary:`);
      console.log(`   - Files staged: ${stagingResult.stagedCount}`);
      console.log(`   - Files committed: ${validationResult.fileCount}`);
      console.log(`   - Commit hash: ${commitResult.commitHash.substring(0, 8)}`);
      
      if (stagingResult.excludedFiles.length > 0) {
        console.log(`   - Excluded sensitive files: ${stagingResult.excludedFiles.length}`);
      }
      
      return {
        success: true,
        staging: stagingResult,
        commit: commitResult,
        validation: validationResult
      };
    } catch (error) {
      console.error('\n❌ Process failed:', error.message);
      throw error;
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const manager = new FileStagingManager();
  manager.execute()
    .then(() => {
      console.log('\n🎉 File staging and commit process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Process failed:', error.message);
      process.exit(1);
    });
}

module.exports = FileStagingManager;