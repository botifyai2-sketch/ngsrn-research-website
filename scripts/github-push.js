/**
 * GitHub Repository Push Handler
 * Handles pushing main branch to remote GitHub repository with comprehensive error handling
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

class GitHubPushHandler {
  constructor(projectPath = '.') {
    this.projectPath = path.resolve(projectPath);
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
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
   * Get current branch name
   */
  getCurrentBranch() {
    try {
      const branch = execSync('git branch --show-current', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      return branch || 'main';
    } catch (error) {
      console.warn('⚠️  Could not determine current branch, defaulting to "main"');
      return 'main';
    }
  }

  /**
   * Check if remote exists
   */
  checkRemoteExists(remoteName = 'origin') {
    try {
      execSync(`git remote get-url ${remoteName}`, { 
        cwd: this.projectPath, 
        stdio: 'pipe' 
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get remote URL
   */
  getRemoteUrl(remoteName = 'origin') {
    try {
      return execSync(`git remote get-url ${remoteName}`, { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if there are uncommitted changes
   */
  hasUncommittedChanges() {
    try {
      const status = execSync('git status --porcelain', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      return status.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }  /**

   * Execute git push with detailed error handling
   */
  async executePush(branch = 'main', remoteName = 'origin', options = {}) {
    const {
      setUpstream = false,
      force = false,
      verbose = true
    } = options;

    return new Promise((resolve, reject) => {
      const args = ['push'];
      
      if (setUpstream) {
        args.push('-u');
      }
      
      if (force) {
        args.push('--force-with-lease');
      }
      
      args.push(remoteName, branch);

      if (verbose) {
        console.log(`🚀 Executing: git ${args.join(' ')}`);
      }

      const child = spawn('git', args, {
        cwd: this.projectPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        if (verbose) {
          process.stdout.write(output);
        }
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        if (verbose) {
          process.stderr.write(output);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            stdout,
            stderr,
            code
          });
        } else {
          reject({
            success: false,
            stdout,
            stderr,
            code,
            command: `git ${args.join(' ')}`
          });
        }
      });

      child.on('error', (error) => {
        reject({
          success: false,
          error: error.message,
          command: `git ${args.join(' ')}`
        });
      });
    });
  }

  /**
   * Handle push conflicts and rejection scenarios
   */
  async handlePushConflict(error, branch, remoteName, attempt) {
    console.log(`\n⚠️  Push conflict detected (attempt ${attempt}):`);
    
    if (error.stderr && error.stderr.includes('non-fast-forward')) {
      console.log('   • Remote branch has commits not in local branch');
      console.log('   • Attempting to fetch and merge...');
      
      try {
        // Fetch latest changes
        console.log('📥 Fetching latest changes...');
        execSync(`git fetch ${remoteName}`, { 
          cwd: this.projectPath,
          stdio: 'inherit'
        });
        
        // Try to merge
        console.log('🔄 Attempting to merge...');
        execSync(`git merge ${remoteName}/${branch}`, { 
          cwd: this.projectPath,
          stdio: 'inherit'
        });
        
        console.log('✅ Merge successful, retrying push...');
        return { shouldRetry: true, action: 'merged' };
      } catch (mergeError) {
        console.error('❌ Merge failed:', mergeError.message);
        console.log('\n💡 Manual intervention required:');
        console.log('   1. Resolve merge conflicts manually');
        console.log('   2. Run: git add . && git commit');
        console.log('   3. Run push again');
        return { shouldRetry: false, action: 'merge_failed' };
      }
    } else if (error.stderr && error.stderr.includes('rejected')) {
      console.log('   • Push was rejected by remote');
      console.log('   • This might be due to branch protection rules');
      return { shouldRetry: false, action: 'rejected' };
    } else if (error.stderr && error.stderr.includes('Authentication failed')) {
      console.log('   • Authentication failed');
      console.log('   • Check your credentials and permissions');
      return { shouldRetry: false, action: 'auth_failed' };
    } else {
      console.log('   • Unknown conflict type');
      return { shouldRetry: attempt < this.maxRetries, action: 'unknown' };
    }
  }

  /**
   * Handle network failures with retry logic
   */
  async handleNetworkFailure(error, attempt) {
    console.log(`\n🌐 Network failure detected (attempt ${attempt}):`);
    
    if (error.stderr && (error.stderr.includes('timeout') || error.stderr.includes('Connection timed out'))) {
      console.log('   • Connection timeout');
    } else if (error.stderr && error.stderr.includes('Could not resolve host')) {
      console.log('   • DNS resolution failed');
    } else if (error.stderr && error.stderr.includes('Connection refused')) {
      console.log('   • Connection refused by server');
    } else {
      console.log('   • Network connectivity issue');
    }
    
    if (attempt < this.maxRetries) {
      const delay = this.retryDelay * attempt;
      console.log(`   • Retrying in ${delay / 1000} seconds...`);
      await this.sleep(delay);
      return true;
    } else {
      console.log('   • Max retries exceeded');
      return false;
    }
  }  /**
   
* Provide detailed error messages for failed operations
   */
  provideDetailedErrorMessage(error) {
    console.error('\n❌ Push operation failed:');
    
    if (error.code) {
      console.error(`   Exit code: ${error.code}`);
    }
    
    if (error.stderr) {
      const stderr = error.stderr.toLowerCase();
      
      if (stderr.includes('authentication failed') || stderr.includes('permission denied')) {
        console.error('\n🔐 Authentication Error:');
        console.error('   • Your GitHub credentials are invalid or insufficient');
        console.error('   • Check your username and personal access token');
        console.error('   • Ensure your token has "repo" scope permissions');
        console.error('\n💡 Solutions:');
        console.error('   1. Verify your GitHub username and email');
        console.error('   2. Generate a new personal access token at: https://github.com/settings/tokens');
        console.error('   3. Ensure the token has "repo" scope for repository access');
        console.error('   4. Run: git config --global credential.helper store');
      } else if (stderr.includes('repository not found') || stderr.includes('does not exist')) {
        console.error('\n📁 Repository Error:');
        console.error('   • The repository doesn\'t exist or you don\'t have access');
        console.error('   • Check the repository URL is correct');
        console.error('\n💡 Solutions:');
        console.error('   1. Verify the repository URL: git remote -v');
        console.error('   2. Ensure the repository exists on GitHub');
        console.error('   3. Check you have write access to the repository');
      } else if (stderr.includes('non-fast-forward') || stderr.includes('rejected')) {
        console.error('\n🔄 Merge Conflict:');
        console.error('   • Remote branch has changes not in your local branch');
        console.error('   • Your push was rejected to prevent data loss');
        console.error('\n💡 Solutions:');
        console.error('   1. Fetch and merge: git fetch origin && git merge origin/main');
        console.error('   2. Resolve any conflicts that arise');
        console.error('   3. Commit the merge: git commit');
        console.error('   4. Try pushing again');
      } else if (stderr.includes('timeout') || stderr.includes('connection')) {
        console.error('\n🌐 Network Error:');
        console.error('   • Network connectivity issue');
        console.error('   • Connection to GitHub failed');
        console.error('\n💡 Solutions:');
        console.error('   1. Check your internet connection');
        console.error('   2. Try again in a few minutes');
        console.error('   3. Check GitHub status: https://www.githubstatus.com/');
      } else {
        console.error('\n❓ Unknown Error:');
        console.error(`   • ${error.stderr}`);
        console.error('\n💡 General troubleshooting:');
        console.error('   1. Check your GitHub credentials and permissions');
        console.error('   2. Verify repository URL and access');
        console.error('   3. Ensure stable internet connection');
        console.error('   4. Check GitHub status for service issues');
      }
    }
    
    console.error('\n📚 For more help, visit:');
    console.error('   • GitHub Docs: https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository');
    console.error('   • Git Troubleshooting: https://git-scm.com/docs/git-push');
  } 
 /**
   * Execute repository push with comprehensive error handling and retry logic
   */
  async pushToRepository(options = {}) {
    const {
      branch = null,
      remoteName = 'origin',
      setUpstream = false,
      force = false,
      skipChecks = false
    } = options;

    console.log('🚀 Starting GitHub repository push...\n');

    // Pre-flight checks
    if (!skipChecks) {
      if (!this.isGitRepository()) {
        throw new Error('Not a Git repository. Please initialize Git first with: git init');
      }

      if (!this.checkRemoteExists(remoteName)) {
        throw new Error(`Remote '${remoteName}' not configured. Please add remote first.`);
      }

      const remoteUrl = this.getRemoteUrl(remoteName);
      console.log(`📡 Remote URL: ${remoteUrl}`);

      if (this.hasUncommittedChanges()) {
        console.warn('⚠️  Warning: You have uncommitted changes');
        console.warn('   Consider committing them first: git add . && git commit -m "Your message"');
      }
    }

    // Determine branch
    const targetBranch = branch || this.getCurrentBranch();
    console.log(`🌿 Target branch: ${targetBranch}`);

    // Execute push with retry logic
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`\n📤 Push attempt ${attempt}/${this.maxRetries}...`);
        
        const result = await this.executePush(targetBranch, remoteName, {
          setUpstream: setUpstream || attempt === 1,
          force,
          verbose: true
        });

        console.log('\n🎉 Push successful!');
        console.log(`✅ Branch '${targetBranch}' pushed to '${remoteName}'`);
        
        if (result.stdout) {
          const lines = result.stdout.split('\n').filter(line => line.trim());
          if (lines.length > 0) {
            console.log('\n📊 Push summary:');
            lines.forEach(line => {
              if (line.trim()) {
                console.log(`   ${line.trim()}`);
              }
            });
          }
        }

        return {
          success: true,
          message: 'Push completed successfully',
          branch: targetBranch,
          remote: remoteName,
          attempt,
          output: result.stdout
        };
      } catch (error) {
        lastError = error;
        console.error(`\n❌ Push attempt ${attempt} failed`);
        
        // Handle different types of errors
        let shouldRetry = false;
        
        if (error.stderr) {
          const stderr = error.stderr.toLowerCase();
          
          // Handle push conflicts
          if (stderr.includes('non-fast-forward') || stderr.includes('rejected')) {
            const conflictResult = await this.handlePushConflict(error, targetBranch, remoteName, attempt);
            shouldRetry = conflictResult.shouldRetry;
            
            if (conflictResult.action === 'merged') {
              continue; // Retry immediately after successful merge
            } else if (conflictResult.action === 'merge_failed') {
              break; // Stop retrying, manual intervention needed
            }
          }
          // Handle network failures
          else if (stderr.includes('timeout') || stderr.includes('connection') || stderr.includes('network')) {
            shouldRetry = await this.handleNetworkFailure(error, attempt);
          }
          // Handle authentication failures (don't retry)
          else if (stderr.includes('authentication') || stderr.includes('permission denied')) {
            console.error('❌ Authentication failed - not retrying');
            break;
          }
          // Handle repository not found (don't retry)
          else if (stderr.includes('repository not found') || stderr.includes('does not exist')) {
            console.error('❌ Repository not found - not retrying');
            break;
          }
          // Unknown error - retry if attempts remaining
          else {
            shouldRetry = attempt < this.maxRetries;
            if (shouldRetry) {
              console.log(`   • Unknown error, retrying in ${this.retryDelay / 1000} seconds...`);
              await this.sleep(this.retryDelay);
            }
          }
        } else {
          // No stderr, might be a different type of error
          shouldRetry = attempt < this.maxRetries;
          if (shouldRetry) {
            await this.sleep(this.retryDelay);
          }
        }
        
        if (!shouldRetry) {
          break;
        }
      }
    }

    // All attempts failed
    this.provideDetailedErrorMessage(lastError);
    
    return {
      success: false,
      error: lastError.stderr || lastError.error || 'Push failed',
      attempts: this.maxRetries,
      branch: targetBranch,
      remote: remoteName
    };
  }

  /**
   * Quick push with default settings
   */
  async quickPush(branch = null) {
    return await this.pushToRepository({
      branch,
      setUpstream: true
    });
  }

  /**
   * Force push with lease (safer than regular force push)
   */
  async forcePush(branch = null) {
    console.warn('⚠️  WARNING: Force push will overwrite remote history');
    console.warn('   This should only be used when you are certain about the changes');
    
    return await this.pushToRepository({
      branch,
      force: true,
      setUpstream: false
    });
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
GitHub Repository Push Script

Usage: node github-push.js [command] [options]

Commands:
  push                    Standard push to remote repository
  quick                   Quick push with upstream setup
  force                   Force push with lease (use with caution)

Options:
  --branch <name>         Branch to push (default: current branch)
  --remote <name>         Remote name (default: "origin")
  --no-upstream          Don't set upstream tracking
  --skip-checks          Skip pre-flight checks
  --help                 Show this help message

Examples:
  node github-push.js push
  node github-push.js quick --branch main
  node github-push.js push --remote upstream --branch feature
  node github-push.js force --branch main
    `);
    process.exit(0);
  }

  async function main() {
    const command = args[0] || 'push';
    const options = {};

    // Parse options
    for (let i = 1; i < args.length; i++) {
      switch (args[i]) {
        case '--branch':
          options.branch = args[++i];
          break;
        case '--remote':
          options.remoteName = args[++i];
          break;
        case '--no-upstream':
          options.setUpstream = false;
          break;
        case '--skip-checks':
          options.skipChecks = true;
          break;
      }
    }

    const pushHandler = new GitHubPushHandler();

    try {
      let result;
      
      switch (command) {
        case 'push':
          result = await pushHandler.pushToRepository(options);
          break;
        case 'quick':
          result = await pushHandler.quickPush(options.branch);
          break;
        case 'force':
          result = await pushHandler.forcePush(options.branch);
          break;
        default:
          console.error('❌ Unknown command. Use --help for usage information.');
          process.exit(1);
      }
      
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error('❌ Unexpected error:', error.message);
      process.exit(1);
    }
  }

  main().catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = GitHubPushHandler;