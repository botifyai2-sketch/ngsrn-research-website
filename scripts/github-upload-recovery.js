#!/usr/bin/env node

/**
 * GitHub Upload Error Recovery and Rollback Mechanisms
 * Provides comprehensive error recovery, rollback capabilities, and recovery suggestions
 * for failed GitHub upload operations
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubUploadRecovery {
  constructor(projectPath = '.') {
    this.projectPath = path.resolve(projectPath);
    this.backupPath = path.join(this.projectPath, '.git-backup');
    this.recoveryLog = [];
    this.operationStates = new Map();
  }

  /**
   * Log recovery operations for debugging
   */
  logOperation(operation, status, details = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      status,
      details,
      projectPath: this.projectPath
    };
    
    this.recoveryLog.push(logEntry);
    
    const statusIcon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
    console.log(`${statusIcon} Recovery: ${operation} - ${status}`);
    
    if (details) {
      console.log(`   Details: ${details}`);
    }
  }

  /**
   * Save current Git state before operations
   */
  async saveGitState(operationName) {
    try {
      console.log(`💾 Saving Git state before ${operationName}...`);
      
      const state = {
        operationName,
        timestamp: new Date().toISOString(),
        hasGitRepo: false,
        currentBranch: null,
        remotes: [],
        uncommittedChanges: false,
        lastCommit: null,
        gitConfig: {}
      };

      // Check if Git repository exists
      try {
        execSync('git rev-parse --git-dir', { 
          cwd: this.projectPath, 
          stdio: 'pipe' 
        });
        state.hasGitRepo = true;
      } catch (error) {
        state.hasGitRepo = false;
        this.operationStates.set(operationName, state);
        this.logOperation(`Save state for ${operationName}`, 'success', 'No Git repository found');
        return state;
      }

      // Get current branch
      try {
        state.currentBranch = execSync('git branch --show-current', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).trim();
      } catch (error) {
        state.currentBranch = null;
      }

      // Get remotes
      try {
        const remotesOutput = execSync('git remote -v', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        });
        state.remotes = remotesOutput.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const parts = line.split('\t');
            return {
              name: parts[0],
              url: parts[1]?.split(' ')[0],
              type: parts[1]?.split(' ')[1]?.replace(/[()]/g, '')
            };
          });
      } catch (error) {
        state.remotes = [];
      }

      // Check for uncommitted changes
      try {
        const status = execSync('git status --porcelain', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).trim();
        state.uncommittedChanges = status.length > 0;
      } catch (error) {
        state.uncommittedChanges = false;
      }

      // Get last commit
      try {
        state.lastCommit = execSync('git rev-parse HEAD', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).trim();
      } catch (error) {
        state.lastCommit = null;
      }

      // Get Git configuration
      try {
        const configOutput = execSync('git config --list --local', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        });
        
        configOutput.split('\n').forEach(line => {
          if (line.includes('=')) {
            const [key, value] = line.split('=', 2);
            state.gitConfig[key] = value;
          }
        });
      } catch (error) {
        state.gitConfig = {};
      }

      // Create backup directory if needed
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
      }

      // Save state to file
      const stateFile = path.join(this.backupPath, `state-${operationName}-${Date.now()}.json`);
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

      this.operationStates.set(operationName, state);
      this.logOperation(`Save state for ${operationName}`, 'success', `State saved to ${stateFile}`);
      
      return state;
    } catch (error) {
      this.logOperation(`Save state for ${operationName}`, 'error', error.message);
      throw new Error(`Failed to save Git state: ${error.message}`);
    }
  }

  /**
   * Rollback failed Git initialization
   */
  async rollbackGitInitialization(operationName = 'git-init') {
    try {
      console.log('🔄 Rolling back Git initialization...');
      
      const savedState = this.operationStates.get(operationName);
      
      if (!savedState) {
        this.logOperation('Rollback Git init', 'warning', 'No saved state found, attempting cleanup anyway');
      }

      // Remove .git directory if it exists
      const gitDir = path.join(this.projectPath, '.git');
      if (fs.existsSync(gitDir)) {
        console.log('   Removing .git directory...');
        
        // Use platform-appropriate command to remove .git directory
        if (process.platform === 'win32') {
          execSync(`rmdir /s /q "${gitDir}"`, { cwd: this.projectPath });
        } else {
          execSync(`rm -rf "${gitDir}"`, { cwd: this.projectPath });
        }
        
        this.logOperation('Remove .git directory', 'success', 'Git directory removed');
      }

      // Remove .gitignore if it was created during the failed operation
      const gitignorePath = path.join(this.projectPath, '.gitignore');
      if (fs.existsSync(gitignorePath) && savedState && !savedState.hasGitRepo) {
        console.log('   Removing .gitignore file...');
        fs.unlinkSync(gitignorePath);
        this.logOperation('Remove .gitignore', 'success', 'Gitignore file removed');
      }

      this.logOperation('Rollback Git initialization', 'success', 'Git initialization rolled back successfully');
      
      return {
        success: true,
        message: 'Git initialization rollback completed',
        actionsPerformed: [
          'Removed .git directory',
          'Cleaned up Git configuration files'
        ]
      };
    } catch (error) {
      this.logOperation('Rollback Git initialization', 'error', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to rollback Git initialization'
      };
    }
  }

  /**
   * Cleanup partial upload failures
   */
  async cleanupPartialUpload(operationName = 'upload') {
    try {
      console.log('🧹 Cleaning up partial upload failure...');
      
      const savedState = this.operationStates.get(operationName);
      const cleanupActions = [];

      // Reset to last known good state if available
      if (savedState && savedState.hasGitRepo && savedState.lastCommit) {
        try {
          console.log('   Resetting to last known commit...');
          execSync(`git reset --hard ${savedState.lastCommit}`, { 
            cwd: this.projectPath,
            stdio: 'pipe'
          });
          cleanupActions.push('Reset to last known commit');
          this.logOperation('Reset to last commit', 'success', savedState.lastCommit);
        } catch (error) {
          this.logOperation('Reset to last commit', 'warning', `Failed: ${error.message}`);
        }
      }

      // Clean up any temporary files
      const tempFiles = [
        '.git/MERGE_HEAD',
        '.git/MERGE_MSG',
        '.git/CHERRY_PICK_HEAD',
        '.git/REVERT_HEAD'
      ];

      tempFiles.forEach(tempFile => {
        const fullPath = path.join(this.projectPath, tempFile);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
            cleanupActions.push(`Removed ${tempFile}`);
            this.logOperation('Remove temp file', 'success', tempFile);
          } catch (error) {
            this.logOperation('Remove temp file', 'warning', `Failed to remove ${tempFile}: ${error.message}`);
          }
        }
      });

      // Reset any partial merge states
      try {
        execSync('git merge --abort', { 
          cwd: this.projectPath,
          stdio: 'pipe'
        });
        cleanupActions.push('Aborted partial merge');
        this.logOperation('Abort merge', 'success', 'Partial merge aborted');
      } catch (error) {
        // This is expected if there's no merge in progress
      }

      // Reset any partial rebase states
      try {
        execSync('git rebase --abort', { 
          cwd: this.projectPath,
          stdio: 'pipe'
        });
        cleanupActions.push('Aborted partial rebase');
        this.logOperation('Abort rebase', 'success', 'Partial rebase aborted');
      } catch (error) {
        // This is expected if there's no rebase in progress
      }

      // Clean up credential cache if authentication failed
      try {
        execSync('git config --unset credential.helper', { 
          cwd: this.projectPath,
          stdio: 'pipe'
        });
        cleanupActions.push('Cleared credential cache');
        this.logOperation('Clear credentials', 'success', 'Credential cache cleared');
      } catch (error) {
        // This is expected if no credential helper was set
      }

      this.logOperation('Cleanup partial upload', 'success', `${cleanupActions.length} cleanup actions performed`);
      
      return {
        success: true,
        message: 'Partial upload cleanup completed',
        actionsPerformed: cleanupActions
      };
    } catch (error) {
      this.logOperation('Cleanup partial upload', 'error', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to cleanup partial upload'
      };
    }
  }

  /**
   * Restore Git state from backup
   */
  async restoreGitState(operationName) {
    try {
      console.log(`🔄 Restoring Git state for ${operationName}...`);
      
      const savedState = this.operationStates.get(operationName);
      
      if (!savedState) {
        throw new Error(`No saved state found for operation: ${operationName}`);
      }

      const restoreActions = [];

      // If there was no Git repo originally, remove it
      if (!savedState.hasGitRepo) {
        await this.rollbackGitInitialization(operationName);
        return {
          success: true,
          message: 'Git state restored (repository removed)',
          actionsPerformed: ['Removed Git repository']
        };
      }

      // Restore branch if different
      if (savedState.currentBranch) {
        try {
          const currentBranch = execSync('git branch --show-current', { 
            cwd: this.projectPath, 
            encoding: 'utf8' 
          }).trim();
          
          if (currentBranch !== savedState.currentBranch) {
            execSync(`git checkout ${savedState.currentBranch}`, { 
              cwd: this.projectPath,
              stdio: 'pipe'
            });
            restoreActions.push(`Restored branch: ${savedState.currentBranch}`);
            this.logOperation('Restore branch', 'success', savedState.currentBranch);
          }
        } catch (error) {
          this.logOperation('Restore branch', 'warning', `Failed: ${error.message}`);
        }
      }

      // Restore remotes
      try {
        // Get current remotes
        const currentRemotes = execSync('git remote', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).split('\n').filter(r => r.trim());

        // Remove remotes that weren't in the original state
        for (const remote of currentRemotes) {
          const wasOriginal = savedState.remotes.some(r => r.name === remote);
          if (!wasOriginal) {
            execSync(`git remote remove ${remote}`, { 
              cwd: this.projectPath,
              stdio: 'pipe'
            });
            restoreActions.push(`Removed remote: ${remote}`);
            this.logOperation('Remove remote', 'success', remote);
          }
        }

        // Add back original remotes
        for (const remote of savedState.remotes) {
          if (remote.type === 'fetch' && !currentRemotes.includes(remote.name)) {
            execSync(`git remote add ${remote.name} "${remote.url}"`, { 
              cwd: this.projectPath,
              stdio: 'pipe'
            });
            restoreActions.push(`Restored remote: ${remote.name}`);
            this.logOperation('Restore remote', 'success', `${remote.name} -> ${remote.url}`);
          }
        }
      } catch (error) {
        this.logOperation('Restore remotes', 'warning', `Failed: ${error.message}`);
      }

      // Restore Git configuration
      try {
        for (const [key, value] of Object.entries(savedState.gitConfig)) {
          execSync(`git config ${key} "${value}"`, { 
            cwd: this.projectPath,
            stdio: 'pipe'
          });
        }
        restoreActions.push('Restored Git configuration');
        this.logOperation('Restore config', 'success', `${Object.keys(savedState.gitConfig).length} config entries`);
      } catch (error) {
        this.logOperation('Restore config', 'warning', `Failed: ${error.message}`);
      }

      this.logOperation('Restore Git state', 'success', `${restoreActions.length} restore actions performed`);
      
      return {
        success: true,
        message: 'Git state restored successfully',
        actionsPerformed: restoreActions
      };
    } catch (error) {
      this.logOperation('Restore Git state', 'error', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to restore Git state'
      };
    }
  }

  /**
   * Generate recovery suggestions for common error scenarios
   */
  generateRecoverySuggestions(errorType, errorDetails = null) {
    const suggestions = {
      title: '',
      description: '',
      immediateActions: [],
      preventionTips: [],
      resources: []
    };

    switch (errorType) {
      case 'authentication_failed':
        suggestions.title = '🔐 Authentication Recovery';
        suggestions.description = 'GitHub authentication failed during upload process';
        suggestions.immediateActions = [
          'Verify your GitHub username and email are correct',
          'Check if your Personal Access Token is valid and not expired',
          'Ensure your token has "repo" scope permissions',
          'Try generating a new Personal Access Token',
          'Clear Git credential cache: git config --global --unset credential.helper'
        ];
        suggestions.preventionTips = [
          'Use Personal Access Tokens instead of passwords',
          'Set token expiration reminders',
          'Store tokens securely (never in code)',
          'Test authentication before large uploads'
        ];
        suggestions.resources = [
          'GitHub Token Creation: https://github.com/settings/tokens',
          'GitHub Authentication Docs: https://docs.github.com/en/authentication'
        ];
        break;

      case 'network_failure':
        suggestions.title = '🌐 Network Recovery';
        suggestions.description = 'Network connectivity issues during upload';
        suggestions.immediateActions = [
          'Check your internet connection stability',
          'Try uploading during off-peak hours',
          'Use a wired connection instead of WiFi if possible',
          'Check GitHub status for service outages',
          'Retry the upload with smaller batch sizes'
        ];
        suggestions.preventionTips = [
          'Ensure stable internet connection before starting',
          'Consider using Git LFS for large files',
          'Monitor network stability during uploads',
          'Have backup upload methods ready'
        ];
        suggestions.resources = [
          'GitHub Status: https://www.githubstatus.com/',
          'Git LFS Documentation: https://git-lfs.github.io/'
        ];
        break;

      case 'repository_not_found':
        suggestions.title = '📁 Repository Access Recovery';
        suggestions.description = 'Repository not found or access denied';
        suggestions.immediateActions = [
          'Verify the repository URL is correct',
          'Check if the repository exists on GitHub',
          'Ensure you have write access to the repository',
          'Create the repository on GitHub if it doesn\'t exist',
          'Check if you\'re using the correct GitHub account'
        ];
        suggestions.preventionTips = [
          'Create repositories before attempting uploads',
          'Verify repository URLs before configuration',
          'Ensure proper access permissions are set',
          'Use organization repositories with proper team access'
        ];
        suggestions.resources = [
          'Create Repository: https://github.com/new',
          'Repository Permissions: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features'
        ];
        break;

      case 'merge_conflict':
        suggestions.title = '🔄 Merge Conflict Recovery';
        suggestions.description = 'Merge conflicts occurred during upload';
        suggestions.immediateActions = [
          'Fetch latest changes: git fetch origin',
          'Merge remote changes: git merge origin/main',
          'Resolve conflicts in affected files',
          'Stage resolved files: git add .',
          'Complete merge: git commit',
          'Retry the upload'
        ];
        suggestions.preventionTips = [
          'Pull latest changes before starting work',
          'Communicate with team about concurrent changes',
          'Use feature branches for development',
          'Regularly sync with remote repository'
        ];
        suggestions.resources = [
          'Resolving Conflicts: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts',
          'Git Merge Documentation: https://git-scm.com/docs/git-merge'
        ];
        break;

      case 'large_file_error':
        suggestions.title = '📦 Large File Recovery';
        suggestions.description = 'Upload failed due to large files';
        suggestions.immediateActions = [
          'Identify large files: git ls-files | xargs ls -la | sort -k5 -rn | head',
          'Remove large files from Git history if needed',
          'Use Git LFS for large files: git lfs track "*.large"',
          'Add large files to .gitignore if not needed',
          'Consider alternative storage for large assets'
        ];
        suggestions.preventionTips = [
          'Use Git LFS for files larger than 100MB',
          'Keep binary assets in separate storage',
          'Regularly audit repository size',
          'Use .gitignore for build artifacts and dependencies'
        ];
        suggestions.resources = [
          'Git LFS: https://git-lfs.github.io/',
          'GitHub File Size Limits: https://docs.github.com/en/repositories/working-with-files/managing-large-files'
        ];
        break;

      case 'git_corruption':
        suggestions.title = '🔧 Git Repository Recovery';
        suggestions.description = 'Git repository corruption detected';
        suggestions.immediateActions = [
          'Check repository integrity: git fsck',
          'Try garbage collection: git gc --prune=now',
          'Restore from backup if available',
          'Clone fresh copy from remote if exists',
          'Recreate repository if necessary'
        ];
        suggestions.preventionTips = [
          'Regular repository backups',
          'Avoid force operations when possible',
          'Monitor disk space and health',
          'Use proper shutdown procedures'
        ];
        suggestions.resources = [
          'Git Recovery: https://git-scm.com/book/en/v2/Git-Internals-Maintenance-and-Data-Recovery',
          'Git Fsck Documentation: https://git-scm.com/docs/git-fsck'
        ];
        break;

      default:
        suggestions.title = '🔧 General Recovery';
        suggestions.description = 'General error recovery guidance';
        suggestions.immediateActions = [
          'Review error messages carefully',
          'Check system logs for additional details',
          'Verify all prerequisites are met',
          'Try the operation again with verbose logging',
          'Contact support if issue persists'
        ];
        suggestions.preventionTips = [
          'Test operations in development environment first',
          'Keep backups of important data',
          'Monitor system resources during operations',
          'Follow best practices for Git operations'
        ];
        suggestions.resources = [
          'Git Documentation: https://git-scm.com/doc',
          'GitHub Support: https://support.github.com/'
        ];
    }

    // Add error-specific details if provided
    if (errorDetails) {
      suggestions.errorDetails = errorDetails;
    }

    return suggestions;
  }

  /**
   * Display recovery suggestions in a user-friendly format
   */
  displayRecoverySuggestions(suggestions) {
    console.log('\n' + '='.repeat(70));
    console.log(suggestions.title);
    console.log('='.repeat(70));
    console.log(`\n📋 ${suggestions.description}\n`);

    if (suggestions.errorDetails) {
      console.log('🔍 Error Details:');
      console.log(`   ${suggestions.errorDetails}\n`);
    }

    console.log('🚨 Immediate Actions:');
    suggestions.immediateActions.forEach((action, index) => {
      console.log(`   ${index + 1}. ${action}`);
    });

    console.log('\n💡 Prevention Tips:');
    suggestions.preventionTips.forEach((tip, index) => {
      console.log(`   • ${tip}`);
    });

    console.log('\n📚 Helpful Resources:');
    suggestions.resources.forEach((resource, index) => {
      console.log(`   • ${resource}`);
    });

    console.log('\n' + '='.repeat(70));
  }

  /**
   * Comprehensive error analysis and recovery
   */
  async analyzeAndRecover(error, operationName = 'upload') {
    try {
      console.log('\n🔍 Analyzing error and determining recovery strategy...');
      
      let errorType = 'unknown';
      let errorDetails = error.message || 'Unknown error';

      // Analyze error type based on error message
      if (error.message) {
        const message = error.message.toLowerCase();
        
        if (message.includes('authentication') || message.includes('permission denied') || message.includes('invalid credentials')) {
          errorType = 'authentication_failed';
        } else if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
          errorType = 'network_failure';
        } else if (message.includes('repository not found') || message.includes('does not exist')) {
          errorType = 'repository_not_found';
        } else if (message.includes('merge') || message.includes('conflict') || message.includes('non-fast-forward')) {
          errorType = 'merge_conflict';
        } else if (message.includes('large file') || message.includes('file too large')) {
          errorType = 'large_file_error';
        } else if (message.includes('corrupt') || message.includes('fsck')) {
          errorType = 'git_corruption';
        }
      }

      this.logOperation('Error analysis', 'success', `Identified as: ${errorType}`);

      // Perform appropriate recovery actions
      const recoveryResults = [];

      // Always try cleanup for partial uploads
      const cleanupResult = await this.cleanupPartialUpload(operationName);
      recoveryResults.push({
        action: 'Cleanup partial upload',
        result: cleanupResult
      });

      // Specific recovery actions based on error type
      switch (errorType) {
        case 'authentication_failed':
          // Clear credential cache
          try {
            execSync('git config --unset credential.helper', { 
              cwd: this.projectPath,
              stdio: 'pipe'
            });
            recoveryResults.push({
              action: 'Clear credential cache',
              result: { success: true, message: 'Credential cache cleared' }
            });
          } catch (err) {
            recoveryResults.push({
              action: 'Clear credential cache',
              result: { success: false, error: err.message }
            });
          }
          break;

        case 'git_corruption':
          // Try Git repository repair
          try {
            execSync('git fsck --full', { 
              cwd: this.projectPath,
              stdio: 'pipe'
            });
            execSync('git gc --prune=now', { 
              cwd: this.projectPath,
              stdio: 'pipe'
            });
            recoveryResults.push({
              action: 'Git repository repair',
              result: { success: true, message: 'Repository integrity check and cleanup completed' }
            });
          } catch (err) {
            recoveryResults.push({
              action: 'Git repository repair',
              result: { success: false, error: err.message }
            });
          }
          break;
      }

      // Generate and display recovery suggestions
      const suggestions = this.generateRecoverySuggestions(errorType, errorDetails);
      this.displayRecoverySuggestions(suggestions);

      this.logOperation('Error recovery', 'success', `${recoveryResults.length} recovery actions attempted`);

      return {
        success: true,
        errorType,
        errorDetails,
        recoveryResults,
        suggestions
      };
    } catch (recoveryError) {
      this.logOperation('Error recovery', 'error', recoveryError.message);
      return {
        success: false,
        error: recoveryError.message,
        originalError: error.message
      };
    }
  }

  /**
   * Save recovery log to file
   */
  saveRecoveryLog(filename = null) {
    try {
      if (!filename) {
        filename = `recovery-log-${Date.now()}.json`;
      }

      const logPath = path.join(this.backupPath, filename);
      
      // Ensure backup directory exists
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
      }

      const logData = {
        timestamp: new Date().toISOString(),
        projectPath: this.projectPath,
        recoveryLog: this.recoveryLog,
        operationStates: Object.fromEntries(this.operationStates)
      };

      fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
      
      console.log(`📝 Recovery log saved to: ${logPath}`);
      return logPath;
    } catch (error) {
      console.error(`❌ Failed to save recovery log: ${error.message}`);
      return null;
    }
  }

  /**
   * Get recovery status summary
   */
  getRecoveryStatus() {
    const successCount = this.recoveryLog.filter(log => log.status === 'success').length;
    const errorCount = this.recoveryLog.filter(log => log.status === 'error').length;
    const warningCount = this.recoveryLog.filter(log => log.status === 'warning').length;

    return {
      totalOperations: this.recoveryLog.length,
      successful: successCount,
      errors: errorCount,
      warnings: warningCount,
      operationStates: this.operationStates.size,
      lastOperation: this.recoveryLog[this.recoveryLog.length - 1] || null
    };
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
GitHub Upload Error Recovery and Rollback Script

Usage: node github-upload-recovery.js [command] [options]

Commands:
  rollback-init           Rollback failed Git initialization
  cleanup                 Cleanup partial upload failures
  restore <operation>     Restore Git state from backup
  analyze <error-type>    Generate recovery suggestions
  status                  Show recovery status

Options:
  --operation <name>      Operation name for state management
  --project-path <path>   Specify project path (default: current directory)
  --save-log             Save recovery log to file
  --help                 Show this help message

Examples:
  node github-upload-recovery.js rollback-init
  node github-upload-recovery.js cleanup --operation upload
  node github-upload-recovery.js restore git-init
  node github-upload-recovery.js analyze authentication_failed
  node github-upload-recovery.js status
    `);
    process.exit(0);
  }

  async function main() {
    const command = args[0] || 'status';
    let projectPath = '.';
    let operationName = 'default';
    let saveLog = false;

    // Parse options
    for (let i = 1; i < args.length; i++) {
      switch (args[i]) {
        case '--operation':
          operationName = args[++i];
          break;
        case '--project-path':
          projectPath = args[++i];
          break;
        case '--save-log':
          saveLog = true;
          break;
      }
    }

    const recovery = new GitHubUploadRecovery(projectPath);

    try {
      let result;
      
      switch (command) {
        case 'rollback-init':
          result = await recovery.rollbackGitInitialization(operationName);
          break;
        case 'cleanup':
          result = await recovery.cleanupPartialUpload(operationName);
          break;
        case 'restore':
          const restoreOperation = args[1] || operationName;
          result = await recovery.restoreGitState(restoreOperation);
          break;
        case 'analyze':
          const errorType = args[1] || 'unknown';
          const suggestions = recovery.generateRecoverySuggestions(errorType);
          recovery.displayRecoverySuggestions(suggestions);
          result = { success: true };
          break;
        case 'status':
          const status = recovery.getRecoveryStatus();
          console.log('\n📊 Recovery Status Summary:');
          console.log(`   Total Operations: ${status.totalOperations}`);
          console.log(`   Successful: ${status.successful}`);
          console.log(`   Errors: ${status.errors}`);
          console.log(`   Warnings: ${status.warnings}`);
          console.log(`   Saved States: ${status.operationStates}`);
          if (status.lastOperation) {
            console.log(`   Last Operation: ${status.lastOperation.operation} (${status.lastOperation.status})`);
          }
          result = { success: true };
          break;
        default:
          console.error('❌ Unknown command. Use --help for usage information.');
          process.exit(1);
      }
      
      if (saveLog) {
        recovery.saveRecoveryLog();
      }
      
      process.exit(result && result.success ? 0 : 1);
    } catch (error) {
      console.error('❌ Recovery operation failed:', error.message);
      
      if (saveLog) {
        recovery.saveRecoveryLog();
      }
      
      process.exit(1);
    }
  }

  main().catch((error) => {
    console.error('❌ Fatal recovery error:', error.message);
    process.exit(1);
  });
}

module.exports = GitHubUploadRecovery;