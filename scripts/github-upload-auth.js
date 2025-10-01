#!/usr/bin/env node

/**
 * GitHub Upload Authentication Integration
 * Combines authentication handling with repository setup
 */

const GitHubAuthenticationHandler = require('./github-auth');
const GitHubRemoteManager = require('./github-remote-setup');
const path = require('path');

class GitHubUploadAuthenticator {
  constructor(projectPath = '.') {
    this.projectPath = path.resolve(projectPath);
    this.authHandler = new GitHubAuthenticationHandler(projectPath);
    this.remoteManager = new GitHubRemoteManager(projectPath);
  }

  /**
   * Complete authentication and repository setup
   */
  async setupWithAuthentication(options = {}) {
    const {
      repositoryUrl,
      credentials,
      interactive = false,
      remoteName = 'origin',
      testConnection = true
    } = options;

    console.log('🚀 Starting GitHub Upload Authentication Setup...\n');

    try {
      // Step 1: Setup authentication
      console.log('📋 Step 1: Authentication Setup');
      const authResult = await this.authHandler.setupAuthentication({
        credentials,
        repositoryUrl,
        interactive,
        testConnection
      });

      if (!authResult.success) {
        throw new Error(`Authentication setup failed: ${authResult.error}`);
      }

      // Step 2: Configure remote repository
      console.log('\n📋 Step 2: Remote Repository Configuration');
      const remoteResult = this.remoteManager.setup({
        repositoryUrl,
        remoteName,
        configureAuth: false, // Already configured in step 1
        testConnection
      });

      if (!remoteResult) {
        throw new Error('Remote repository configuration failed');
      }

      // Step 3: Final verification
      console.log('\n📋 Step 3: Final Verification');
      
      // Get authentication status
      const authStatus = this.authHandler.getAuthenticationStatus();
      console.log('✅ Authentication Status:');
      console.log(`   Username: ${authStatus.username}`);
      console.log(`   Email: ${authStatus.email}`);
      console.log(`   Auth Method: ${authStatus.authMethod}`);
      console.log(`   Token Configured: ${authStatus.hasToken ? 'Yes' : 'No'}`);

      // Validate remote configuration
      console.log('✅ Remote Configuration:');
      this.remoteManager.validateRemote(remoteName);

      console.log('\n🎉 GitHub Upload Authentication Setup Complete!');
      console.log('\n💡 Next Steps:');
      console.log('   1. Stage your files: git add .');
      console.log('   2. Create initial commit: git commit -m "Initial commit"');
      console.log(`   3. Push to GitHub: git push -u ${remoteName} main`);

      return {
        success: true,
        authentication: authStatus,
        remote: {
          name: remoteName,
          url: repositoryUrl
        }
      };
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      this.authHandler.handleAuthenticationError(error, 'upload setup');
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Quick setup with minimal prompts
   */
  async quickSetup(repositoryUrl, credentials) {
    console.log('⚡ Quick GitHub Upload Setup...\n');

    if (!repositoryUrl) {
      throw new Error('Repository URL is required for quick setup');
    }

    if (!credentials || !credentials.username || !credentials.email) {
      throw new Error('Username and email are required for quick setup');
    }

    return await this.setupWithAuthentication({
      repositoryUrl,
      credentials,
      interactive: false,
      testConnection: true
    });
  }

  /**
   * Interactive setup with user prompts
   */
  async interactiveSetup(repositoryUrl) {
    console.log('🎯 Interactive GitHub Upload Setup...\n');

    if (!repositoryUrl) {
      console.log('Please provide the GitHub repository URL when prompted.');
    }

    return await this.setupWithAuthentication({
      repositoryUrl,
      interactive: true,
      testConnection: true
    });
  }

  /**
   * Verify current setup status
   */
  async verifySetup(repositoryUrl) {
    console.log('🔍 Verifying GitHub Upload Setup...\n');

    const results = {
      authentication: false,
      remoteConfig: false,
      repositoryAccess: false
    };

    try {
      // Check authentication status
      const authStatus = this.authHandler.getAuthenticationStatus();
      if (authStatus.configured) {
        console.log('✅ Authentication configured');
        results.authentication = true;
      } else {
        console.log('❌ Authentication not configured');
      }

      // Check remote configuration
      if (this.remoteManager.validateRemote('origin')) {
        console.log('✅ Remote repository configured');
        results.remoteConfig = true;
      } else {
        console.log('❌ Remote repository not configured');
      }

      // Test repository access if URL provided
      if (repositoryUrl && authStatus.configured) {
        const repoTest = await this.authHandler.testGitRepositoryAuth(repositoryUrl);
        if (repoTest.success) {
          console.log('✅ Repository access verified');
          results.repositoryAccess = true;
        } else {
          console.log('❌ Repository access failed');
        }
      }

      const allGood = results.authentication && results.remoteConfig;
      
      if (allGood) {
        console.log('\n🎉 Setup verification successful! Ready to upload.');
      } else {
        console.log('\n⚠️  Setup incomplete. Run setup again to fix issues.');
      }

      return {
        success: allGood,
        results
      };
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
GitHub Upload Authentication Setup

Usage: node github-upload-auth.js <command> [options]

Commands:
  setup <repo-url>        Complete setup with repository URL
  quick <repo-url>        Quick setup with command line credentials
  interactive             Interactive setup with prompts
  verify [repo-url]       Verify current setup status

Options:
  --username <username>   GitHub username (for quick setup)
  --email <email>         GitHub email (for quick setup)
  --token <token>         GitHub personal access token (for quick setup)
  --remote-name <name>    Remote name (default: "origin")
  --no-test              Skip connection testing
  --help                 Show this help message

Examples:
  node github-upload-auth.js interactive
  node github-upload-auth.js setup https://github.com/user/repo.git
  node github-upload-auth.js quick https://github.com/user/repo.git --username myuser --email my@email.com --token ghp_xxx
  node github-upload-auth.js verify https://github.com/user/repo.git
    `);
    process.exit(0);
  }

  async function main() {
    const command = args[0];
    const repositoryUrl = args[1];

    const authenticator = new GitHubUploadAuthenticator();

    switch (command) {
      case 'setup':
        if (!repositoryUrl) {
          console.error('❌ Repository URL is required for setup command');
          process.exit(1);
        }
        
        const setupResult = await authenticator.setupWithAuthentication({
          repositoryUrl,
          interactive: true,
          testConnection: !args.includes('--no-test')
        });
        
        process.exit(setupResult.success ? 0 : 1);
        break;

      case 'quick':
        if (!repositoryUrl) {
          console.error('❌ Repository URL is required for quick setup');
          process.exit(1);
        }

        const usernameIndex = args.indexOf('--username');
        const emailIndex = args.indexOf('--email');
        const tokenIndex = args.indexOf('--token');

        if (usernameIndex === -1 || emailIndex === -1) {
          console.error('❌ Username and email are required for quick setup');
          process.exit(1);
        }

        const credentials = {
          username: args[usernameIndex + 1],
          email: args[emailIndex + 1],
          token: tokenIndex !== -1 ? args[tokenIndex + 1] : null
        };

        const quickResult = await authenticator.quickSetup(repositoryUrl, credentials);
        process.exit(quickResult.success ? 0 : 1);
        break;

      case 'interactive':
        const interactiveResult = await authenticator.interactiveSetup(repositoryUrl);
        process.exit(interactiveResult.success ? 0 : 1);
        break;

      case 'verify':
        const verifyResult = await authenticator.verifySetup(repositoryUrl);
        process.exit(verifyResult.success ? 0 : 1);
        break;

      default:
        console.error('❌ Unknown command. Use --help for usage information.');
        process.exit(1);
    }
  }

  main().catch((error) => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = GitHubUploadAuthenticator;