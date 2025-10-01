#!/usr/bin/env node

/**
 * Interactive GitHub Upload Script
 * Provides a command-line interface for uploading the NGSRN website to GitHub
 * with secure credential prompting, repository URL validation, and step-by-step progress updates
 */

const readline = require('readline');
const path = require('path');
const { URL } = require('url');
const GitHubAuthenticationHandler = require('./github-auth');
const CompleteGitHubUpload = require('./github-upload-complete');
const GitHubUploadRecovery = require('./github-upload-recovery');

class InteractiveGitHubUpload {
  constructor(projectPath = '.') {
    this.projectPath = path.resolve(projectPath);
    this.authHandler = new GitHubAuthenticationHandler(projectPath);
    this.uploader = new CompleteGitHubUpload(projectPath);
    this.recovery = new GitHubUploadRecovery(projectPath);
    this.rl = null;
    this.config = {
      credentials: null,
      repositoryUrl: null,
      branch: 'main',
      skipVerification: false
    };
  }

  /**
   * Initialize readline interface
   */
  initializeInterface() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Close readline interface
   */
  closeInterface() {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  /**
   * Ask a question and return the answer
   */
  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  /**
   * Ask a question with hidden input (for passwords/tokens)
   */
  async questionHidden(prompt) {
    return new Promise((resolve) => {
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
  }

  /**
   * Display welcome message and introduction
   */
  displayWelcome() {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 NGSRN Website - Interactive GitHub Upload');
    console.log('='.repeat(70));
    console.log('');
    console.log('This tool will help you upload your NGSRN website to GitHub.');
    console.log('We\'ll guide you through the process step by step.');
    console.log('');
    console.log('What this tool will do:');
    console.log('  ✅ Collect your GitHub credentials securely');
    console.log('  ✅ Validate repository URL and access');
    console.log('  ✅ Initialize Git repository if needed');
    console.log('  ✅ Configure authentication and remotes');
    console.log('  ✅ Upload all project files to GitHub');
    console.log('  ✅ Verify successful upload');
    console.log('  ✅ Provide detailed status report');
    console.log('');
    console.log('📋 Prerequisites:');
    console.log('  • GitHub account with repository access');
    console.log('  • Personal Access Token (recommended)');
    console.log('  • Stable internet connection');
    console.log('');
  }

  /**
   * Collect GitHub credentials from user
   */
  async collectCredentials() {
    console.log('🔐 Step 1: GitHub Credentials');
    console.log('-'.repeat(40));
    console.log('');
    console.log('Please provide your GitHub credentials:');
    console.log('');

    // Username
    let username = '';
    while (!username.trim()) {
      username = await this.question('GitHub Username: ');
      if (!username.trim()) {
        console.log('❌ Username is required. Please try again.');
      }
    }

    // Email
    let email = '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    while (!email.trim() || !emailRegex.test(email.trim())) {
      email = await this.question('GitHub Email: ');
      if (!email.trim()) {
        console.log('❌ Email is required. Please try again.');
      } else if (!emailRegex.test(email.trim())) {
        console.log('❌ Invalid email format. Please try again.');
      }
    }

    // Personal Access Token
    console.log('');
    console.log('💡 Personal Access Token (PAT) is recommended for secure authentication.');
    console.log('   You can create one at: https://github.com/settings/tokens');
    console.log('   Required scopes: "repo" (for repository access)');
    console.log('');
    
    const useToken = await this.question('Do you have a Personal Access Token? (y/n): ');
    
    let token = null;
    if (useToken.toLowerCase().startsWith('y')) {
      while (true) {
        token = await this.questionHidden('Personal Access Token (hidden): ');
        if (!token.trim()) {
          console.log('❌ Token cannot be empty. Please try again.');
          continue;
        }
        
        if (token.length < 20) {
          console.log('⚠️  Token seems short. GitHub tokens are typically 40+ characters.');
          const confirm = await this.question('Continue anyway? (y/n): ');
          if (!confirm.toLowerCase().startsWith('y')) {
            continue;
          }
        }
        
        break;
      }
    } else {
      console.log('');
      console.log('⚠️  Without a Personal Access Token, you may encounter authentication issues.');
      console.log('   Consider creating one for better security and reliability.');
    }

    this.config.credentials = {
      username: username.trim(),
      email: email.trim(),
      token: token ? token.trim() : null
    };

    console.log('');
    console.log('✅ Credentials collected successfully');
    console.log(`   Username: ${this.config.credentials.username}`);
    console.log(`   Email: ${this.config.credentials.email}`);
    console.log(`   Token: ${this.config.credentials.token ? 'Provided' : 'Not provided'}`);
  }

  /**
   * Validate repository URL format
   */
  validateRepositoryUrl(url) {
    try {
      const parsedUrl = new URL(url);
      
      // Check if it's HTTPS protocol
      if (parsedUrl.protocol !== 'https:') {
        return {
          valid: false,
          error: 'URL must use HTTPS protocol'
        };
      }
      
      // Check if it's a GitHub URL
      if (!parsedUrl.hostname.includes('github.com')) {
        return {
          valid: false,
          error: 'URL must be a GitHub repository URL'
        };
      }
      
      // Check URL format
      const pathParts = parsedUrl.pathname.split('/').filter(part => part);
      if (pathParts.length < 2) {
        return {
          valid: false,
          error: 'Invalid repository URL format. Expected: https://github.com/username/repository'
        };
      }
      
      // Extract owner and repo
      const owner = pathParts[0];
      const repo = pathParts[1].replace('.git', '');
      
      return {
        valid: true,
        owner,
        repo,
        normalizedUrl: `https://github.com/${owner}/${repo}.git`
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL format'
      };
    }
  }

  /**
   * Collect and validate repository URL
   */
  async collectRepositoryUrl() {
    console.log('\n📁 Step 2: Repository Configuration');
    console.log('-'.repeat(40));
    console.log('');
    console.log('Please provide your GitHub repository URL:');
    console.log('');
    console.log('Examples:');
    console.log('  • https://github.com/username/ngsrn-website');
    console.log('  • https://github.com/username/ngsrn-website.git');
    console.log('');

    let repositoryUrl = '';
    while (true) {
      repositoryUrl = await this.question('Repository URL: ');
      
      if (!repositoryUrl.trim()) {
        console.log('❌ Repository URL is required. Please try again.');
        continue;
      }

      const validation = this.validateRepositoryUrl(repositoryUrl.trim());
      
      if (!validation.valid) {
        console.log(`❌ ${validation.error}. Please try again.`);
        continue;
      }

      // Display parsed information
      console.log('');
      console.log('📋 Repository Information:');
      console.log(`   Owner: ${validation.owner}`);
      console.log(`   Repository: ${validation.repo}`);
      console.log(`   URL: ${validation.normalizedUrl}`);
      console.log('');

      const confirm = await this.question('Is this correct? (y/n): ');
      if (confirm.toLowerCase().startsWith('y')) {
        this.config.repositoryUrl = validation.normalizedUrl;
        break;
      }
    }

    console.log('✅ Repository URL configured successfully');
  }

  /**
   * Collect additional configuration options
   */
  async collectAdditionalOptions() {
    console.log('\n⚙️  Step 3: Upload Configuration');
    console.log('-'.repeat(40));
    console.log('');

    // Branch selection
    const currentBranch = this.uploader.pushHandler.getCurrentBranch();
    console.log(`Current branch: ${currentBranch}`);
    
    const changeBranch = await this.question(`Upload to branch "${currentBranch}"? (y/n): `);
    if (!changeBranch.toLowerCase().startsWith('y')) {
      const newBranch = await this.question('Enter branch name: ');
      if (newBranch.trim()) {
        this.config.branch = newBranch.trim();
      }
    } else {
      this.config.branch = currentBranch;
    }

    // Verification options
    console.log('');
    const skipVerification = await this.question('Skip upload verification for faster upload? (y/n): ');
    this.config.skipVerification = skipVerification.toLowerCase().startsWith('y');

    console.log('');
    console.log('📋 Upload Configuration:');
    console.log(`   Branch: ${this.config.branch}`);
    console.log(`   Verification: ${this.config.skipVerification ? 'Disabled' : 'Enabled'}`);
    console.log('');
  }

  /**
   * Display configuration summary and get final confirmation
   */
  async confirmConfiguration() {
    console.log('📋 Step 4: Configuration Summary');
    console.log('-'.repeat(40));
    console.log('');
    console.log('Please review your configuration:');
    console.log('');
    console.log('🔐 Credentials:');
    console.log(`   Username: ${this.config.credentials.username}`);
    console.log(`   Email: ${this.config.credentials.email}`);
    console.log(`   Token: ${this.config.credentials.token ? '✅ Provided' : '❌ Not provided'}`);
    console.log('');
    console.log('📁 Repository:');
    console.log(`   URL: ${this.config.repositoryUrl}`);
    console.log(`   Branch: ${this.config.branch}`);
    console.log('');
    console.log('⚙️  Options:');
    console.log(`   Verification: ${this.config.skipVerification ? 'Disabled' : 'Enabled'}`);
    console.log('');

    const confirm = await this.question('Proceed with upload? (y/n): ');
    return confirm.toLowerCase().startsWith('y');
  }

  /**
   * Execute the upload process with step-by-step progress updates
   */
  async executeUpload() {
    console.log('\n🚀 Step 5: Executing Upload');
    console.log('-'.repeat(40));
    console.log('');

    try {
      // Step 5.1: Setup authentication
      console.log('🔐 5.1 Setting up GitHub authentication...');
      const authResult = await this.authHandler.setupAuthentication({
        credentials: this.config.credentials,
        repositoryUrl: this.config.repositoryUrl,
        testConnection: true
      });

      if (!authResult.success) {
        throw new Error(`Authentication setup failed: ${authResult.error}`);
      }
      console.log('✅ Authentication configured successfully');

      // Step 5.2: Configure remote repository
      console.log('\n📡 5.2 Configuring remote repository...');
      
      // Check if remote exists, add if not
      if (!this.uploader.pushHandler.checkRemoteExists('origin')) {
        const { execSync } = require('child_process');
        execSync(`git remote add origin "${this.config.repositoryUrl}"`, {
          cwd: this.projectPath
        });
        console.log('✅ Remote repository added');
      } else {
        // Update existing remote
        const { execSync } = require('child_process');
        execSync(`git remote set-url origin "${this.config.repositoryUrl}"`, {
          cwd: this.projectPath
        });
        console.log('✅ Remote repository updated');
      }

      // Step 5.3: Execute complete upload
      console.log('\n📤 5.3 Uploading to GitHub...');
      console.log('    This may take a few minutes depending on project size...');
      
      const uploadResult = await this.uploader.executeCompleteUpload({
        branch: this.config.branch,
        remoteName: 'origin',
        setUpstream: true,
        skipVerification: this.config.skipVerification,
        saveReport: true
      });

      return uploadResult;
    } catch (error) {
      console.error(`\n❌ Upload failed: ${error.message}`);
      
      // Perform error recovery
      console.log('\n🔧 Attempting error recovery...');
      try {
        const recoveryResult = await this.recovery.analyzeAndRecover(error, 'interactive-upload');
        return {
          success: false,
          error: error.message,
          recoveryResult
        };
      } catch (recoveryError) {
        console.error('❌ Error recovery failed:', recoveryError.message);
        return {
          success: false,
          error: error.message,
          recoveryError: recoveryError.message
        };
      }
    }
  }

  /**
   * Display final results and next steps
   */
  displayResults(uploadResult) {
    console.log('\n' + '='.repeat(70));
    
    if (uploadResult.success) {
      console.log('🎉 UPLOAD COMPLETED SUCCESSFULLY!');
      console.log('='.repeat(70));
      console.log('');
      console.log('✅ Your NGSRN website has been uploaded to GitHub');
      
      if (uploadResult.verificationResult?.repositoryUrl) {
        console.log(`🌐 Repository URL: ${uploadResult.verificationResult.repositoryUrl}`);
      }
      
      if (uploadResult.verificationResult?.commitHash) {
        console.log(`📝 Commit Hash: ${uploadResult.verificationResult.commitHash.substring(0, 8)}`);
      }
      
      if (uploadResult.verificationResult?.filesUploaded) {
        console.log(`📁 Files Uploaded: ${uploadResult.verificationResult.filesUploaded}`);
      }
      
      console.log('');
      console.log('🚀 Next Steps:');
      console.log('  • Visit your repository on GitHub to verify the upload');
      console.log('  • Set up branch protection rules if needed');
      console.log('  • Configure CI/CD pipelines for automated deployment');
      console.log('  • Add collaborators and set up team access');
      console.log('  • Consider setting up GitHub Pages for hosting');
      console.log('');
      console.log('📚 Useful Links:');
      console.log('  • GitHub Docs: https://docs.github.com');
      console.log('  • Vercel Deployment: https://vercel.com/docs');
      console.log('  • Next.js Deployment: https://nextjs.org/docs/deployment');
    } else {
      console.log('❌ UPLOAD FAILED');
      console.log('='.repeat(70));
      console.log('');
      console.log('The upload process encountered an error:');
      console.log(`   ${uploadResult.error || 'Unknown error'}`);
      console.log('');
      console.log('🔧 Troubleshooting Steps:');
      console.log('  1. Check your internet connection');
      console.log('  2. Verify your GitHub credentials and permissions');
      console.log('  3. Ensure the repository URL is correct');
      console.log('  4. Check if the repository exists and you have write access');
      console.log('  5. Try running the script again');
      console.log('');
      console.log('📞 Need Help?');
      console.log('  • Check GitHub status: https://www.githubstatus.com/');
      console.log('  • Review GitHub documentation: https://docs.github.com');
      console.log('  • Contact your system administrator if in an organization');
    }
    
    console.log('='.repeat(70));
  }

  /**
   * Main interactive upload process
   */
  async runInteractiveUpload() {
    try {
      this.initializeInterface();
      
      // Welcome and introduction
      this.displayWelcome();
      
      const proceed = await this.question('Ready to start? (y/n): ');
      if (!proceed.toLowerCase().startsWith('y')) {
        console.log('Upload cancelled by user.');
        return;
      }

      // Step 1: Collect credentials
      await this.collectCredentials();

      // Step 2: Collect repository URL
      await this.collectRepositoryUrl();

      // Step 3: Additional options
      await this.collectAdditionalOptions();

      // Step 4: Confirm configuration
      const confirmed = await this.confirmConfiguration();
      if (!confirmed) {
        console.log('\nUpload cancelled by user.');
        return;
      }

      // Step 5: Execute upload
      const uploadResult = await this.executeUpload();

      // Display results
      this.displayResults(uploadResult);

      return uploadResult;
    } catch (error) {
      console.error('\n❌ Unexpected error:', error.message);
      console.error('Please try again or contact support if the issue persists.');
      return { success: false, error: error.message };
    } finally {
      this.closeInterface();
    }
  }

  /**
   * Quick upload with minimal prompts (for experienced users)
   */
  async runQuickUpload(options = {}) {
    try {
      this.initializeInterface();
      
      console.log('\n🚀 Quick GitHub Upload');
      console.log('='.repeat(40));
      
      // Use provided options or prompt for essentials
      if (!options.credentials) {
        console.log('\n🔐 GitHub Credentials Required');
        await this.collectCredentials();
      } else {
        this.config.credentials = options.credentials;
      }

      if (!options.repositoryUrl) {
        console.log('\n📁 Repository URL Required');
        await this.collectRepositoryUrl();
      } else {
        this.config.repositoryUrl = options.repositoryUrl;
      }

      // Use defaults for other options
      this.config.branch = options.branch || 'main';
      this.config.skipVerification = options.skipVerification || false;

      console.log('\n📋 Quick Upload Configuration:');
      console.log(`   Repository: ${this.config.repositoryUrl}`);
      console.log(`   Branch: ${this.config.branch}`);
      console.log(`   Username: ${this.config.credentials.username}`);

      const confirm = await this.question('\nProceed with quick upload? (y/n): ');
      if (!confirm.toLowerCase().startsWith('y')) {
        console.log('Upload cancelled.');
        return;
      }

      const uploadResult = await this.executeUpload();
      this.displayResults(uploadResult);

      return uploadResult;
    } catch (error) {
      console.error('\n❌ Quick upload failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      this.closeInterface();
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Interactive GitHub Upload Script

Usage: node interactive-github-upload.js [command] [options]

Commands:
  interactive             Full interactive upload with step-by-step guidance (default)
  quick                   Quick upload with minimal prompts
  
Options:
  --username <username>   GitHub username (for quick mode)
  --email <email>         GitHub email (for quick mode)
  --token <token>         GitHub personal access token (for quick mode)
  --repository <url>      Repository URL (for quick mode)
  --branch <name>         Branch name (default: main)
  --no-verification      Skip upload verification
  --project-path <path>   Specify project path (default: current directory)
  --help                 Show this help message

Examples:
  node interactive-github-upload.js
  node interactive-github-upload.js interactive
  node interactive-github-upload.js quick --repository https://github.com/user/repo.git
  node interactive-github-upload.js quick --username myuser --email my@email.com --token ghp_xxx
    `);
    process.exit(0);
  }

  async function main() {
    const command = args[0] || 'interactive';
    let projectPath = '.';
    const options = {};

    // Parse options
    for (let i = 1; i < args.length; i++) {
      switch (args[i]) {
        case '--username':
          options.credentials = options.credentials || {};
          options.credentials.username = args[++i];
          break;
        case '--email':
          options.credentials = options.credentials || {};
          options.credentials.email = args[++i];
          break;
        case '--token':
          options.credentials = options.credentials || {};
          options.credentials.token = args[++i];
          break;
        case '--repository':
          options.repositoryUrl = args[++i];
          break;
        case '--branch':
          options.branch = args[++i];
          break;
        case '--no-verification':
          options.skipVerification = true;
          break;
        case '--project-path':
          projectPath = args[++i];
          break;
      }
    }

    const uploader = new InteractiveGitHubUpload(projectPath);

    try {
      let result;
      
      switch (command) {
        case 'interactive':
          result = await uploader.runInteractiveUpload();
          break;
        case 'quick':
          result = await uploader.runQuickUpload(options);
          break;
        default:
          console.error('❌ Unknown command. Use --help for usage information.');
          process.exit(1);
      }
      
      process.exit(result && result.success ? 0 : 1);
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

module.exports = InteractiveGitHubUpload;