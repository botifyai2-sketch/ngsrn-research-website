#!/usr/bin/env node

/**
 * Create GitHub Repository and Upload Script
 * Creates a new GitHub repository and uploads all project files
 */

const https = require('https');
const { execSync } = require('child_process');
const path = require('path');

class GitHubRepositoryCreator {
  constructor(projectPath = '.') {
    this.projectPath = path.resolve(projectPath);
    this.credentials = null;
  }

  /**
   * Set GitHub credentials
   */
  setCredentials(credentials) {
    this.credentials = credentials;
  }

  /**
   * Create a new GitHub repository
   */
  async createRepository(repoName, options = {}) {
    const {
      description = 'NGSRN Research Website - Next.js application with CMS, search, and AI features',
      isPrivate = false,
      autoInit = false
    } = options;

    console.log(`🏗️  Creating GitHub repository: ${repoName}`);

    const postData = JSON.stringify({
      name: repoName,
      description: description,
      private: isPrivate,
      auto_init: autoInit,
      gitignore_template: 'Node',
      license_template: 'mit'
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        port: 443,
        path: '/user/repos',
        method: 'POST',
        headers: {
          'User-Agent': 'NGSRN-Website-Setup/1.0',
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${this.credentials.token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 30000
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const responseData = JSON.parse(data);
            
            if (res.statusCode === 201) {
              console.log('✅ Repository created successfully');
              console.log(`   Repository URL: ${responseData.html_url}`);
              console.log(`   Clone URL: ${responseData.clone_url}`);
              console.log(`   SSH URL: ${responseData.ssh_url}`);
              
              resolve({
                success: true,
                repository: responseData,
                cloneUrl: responseData.clone_url,
                htmlUrl: responseData.html_url
              });
            } else if (res.statusCode === 422 && responseData.errors) {
              const nameError = responseData.errors.find(e => e.field === 'name');
              if (nameError && nameError.code === 'already_exists') {
                console.log('ℹ️  Repository already exists, proceeding with upload...');
                resolve({
                  success: true,
                  repository: null,
                  cloneUrl: `https://github.com/${this.credentials.username}/${repoName}.git`,
                  htmlUrl: `https://github.com/${this.credentials.username}/${repoName}`,
                  alreadyExists: true
                });
              } else {
                console.error('❌ Repository creation failed:', responseData.message);
                reject(new Error(`Repository creation failed: ${responseData.message}`));
              }
            } else {
              console.error(`❌ Repository creation failed: HTTP ${res.statusCode}`);
              console.error('Response:', data);
              reject(new Error(`HTTP ${res.statusCode}: ${responseData.message || 'Unknown error'}`));
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

      req.write(postData);
      req.end();
    });
  }

  /**
   * Configure Git repository for upload
   */
  configureGitRepository(cloneUrl) {
    console.log('⚙️  Configuring Git repository...');

    try {
      // Configure user identity
      execSync(`git config user.name "${this.credentials.username}"`, { 
        cwd: this.projectPath 
      });
      
      execSync(`git config user.email "${this.credentials.email}"`, { 
        cwd: this.projectPath 
      });

      // Configure remote
      try {
        execSync('git remote remove origin', { 
          cwd: this.projectPath, 
          stdio: 'pipe' 
        });
      } catch (error) {
        // Remote doesn't exist, which is fine
      }

      execSync(`git remote add origin "${cloneUrl}"`, { 
        cwd: this.projectPath 
      });

      console.log('✅ Git repository configured');
      return true;
    } catch (error) {
      console.error('❌ Failed to configure Git repository:', error.message);
      return false;
    }
  }

  /**
   * Commit all changes
   */
  commitChanges(message = 'Initial commit - NGSRN Research Website') {
    console.log('📝 Committing changes...');

    try {
      // Add all files
      execSync('git add .', { 
        cwd: this.projectPath 
      });

      // Check if there are changes to commit
      try {
        const status = execSync('git status --porcelain', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        });

        if (!status.trim()) {
          console.log('ℹ️  No changes to commit');
          return true;
        }
      } catch (error) {
        // Continue with commit attempt
      }

      // Commit changes
      execSync(`git commit -m "${message}"`, { 
        cwd: this.projectPath 
      });

      console.log('✅ Changes committed successfully');
      return true;
    } catch (error) {
      if (error.message.includes('nothing to commit')) {
        console.log('ℹ️  No changes to commit');
        return true;
      }
      console.error('❌ Failed to commit changes:', error.message);
      return false;
    }
  }

  /**
   * Push to GitHub repository
   */
  pushToGitHub(branch = 'main') {
    console.log(`📤 Pushing to GitHub (branch: ${branch})...`);

    try {
      // Set default branch
      execSync(`git branch -M ${branch}`, { 
        cwd: this.projectPath 
      });

      // Push to remote
      execSync(`git push -u origin ${branch}`, { 
        cwd: this.projectPath,
        stdio: 'inherit'
      });

      console.log('✅ Successfully pushed to GitHub');
      return true;
    } catch (error) {
      console.error('❌ Failed to push to GitHub:', error.message);
      return false;
    }
  }

  /**
   * Complete repository creation and upload process
   */
  async createAndUpload(repoName, options = {}) {
    const {
      description,
      isPrivate = false,
      branch = 'main',
      commitMessage = 'Initial commit - NGSRN Research Website'
    } = options;

    console.log('🚀 Starting GitHub repository creation and upload...\n');

    try {
      // Step 1: Create repository
      const createResult = await this.createRepository(repoName, {
        description,
        isPrivate: isPrivate,
        autoInit: false
      });

      if (!createResult.success) {
        throw new Error('Repository creation failed');
      }

      // Step 2: Configure Git repository
      if (!this.configureGitRepository(createResult.cloneUrl)) {
        throw new Error('Git configuration failed');
      }

      // Step 3: Commit changes
      if (!this.commitChanges(commitMessage)) {
        throw new Error('Commit failed');
      }

      // Step 4: Push to GitHub
      if (!this.pushToGitHub(branch)) {
        throw new Error('Push to GitHub failed');
      }

      console.log('\n🎉 Repository creation and upload completed successfully!');
      console.log(`🌐 Repository URL: ${createResult.htmlUrl}`);
      console.log(`📁 Clone URL: ${createResult.cloneUrl}`);

      return {
        success: true,
        repositoryUrl: createResult.htmlUrl,
        cloneUrl: createResult.cloneUrl,
        alreadyExists: createResult.alreadyExists
      };
    } catch (error) {
      console.error('\n❌ Repository creation and upload failed:', error.message);
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
  
  if (args.includes('--help') || args.length < 4) {
    console.log(`
GitHub Repository Creator and Uploader

Usage: node create-and-upload-github.js <repo-name> <username> <email> <token> [options]

Arguments:
  <repo-name>          Name of the repository to create
  <username>           GitHub username
  <email>              GitHub email
  <token>              GitHub personal access token

Options:
  --description <desc> Repository description
  --private           Create private repository (default: public)
  --branch <name>     Branch name (default: main)
  --message <msg>     Commit message
  --help              Show this help message

Examples:
  node create-and-upload-github.js ngsrn-website myuser my@email.com ghp_token
  node create-and-upload-github.js ngsrn-website myuser my@email.com ghp_token --private
  node create-and-upload-github.js ngsrn-website myuser my@email.com ghp_token --description "My website"
    `);
    process.exit(0);
  }

  async function main() {
    const [repoName, username, email, token] = args;
    const options = {};

    // Parse options
    for (let i = 4; i < args.length; i++) {
      switch (args[i]) {
        case '--description':
          options.description = args[++i];
          break;
        case '--private':
          options.isPrivate = true;
          break;
        case '--branch':
          options.branch = args[++i];
          break;
        case '--message':
          options.commitMessage = args[++i];
          break;
      }
    }

    const creator = new GitHubRepositoryCreator();
    creator.setCredentials({ username, email, token });

    const result = await creator.createAndUpload(repoName, options);
    process.exit(result.success ? 0 : 1);
  }

  main().catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = GitHubRepositoryCreator;