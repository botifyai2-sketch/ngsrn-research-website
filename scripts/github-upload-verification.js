/**
 * GitHub Upload Verification and Status Reporting
 * Verifies successful file upload to GitHub repository and generates comprehensive status reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubUploadVerifier {
  constructor(projectPath = '.') {
    this.projectPath = path.resolve(projectPath);
    this.warnings = [];
    this.errors = [];
  }

  /**
   * Verify successful file upload to GitHub repository
   */
  async verifyUpload() {
    console.log('🔍 Verifying successful upload to GitHub repository...\n');
    
    const verification = {
      success: false,
      repositoryUrl: null,
      commitHash: null,
      filesUploaded: 0,
      totalFiles: 0,
      remoteStatus: null,
      branchInfo: null,
      lastCommit: null,
      warnings: [],
      errors: []
    };

    try {
      // Check if we're in a Git repository
      if (!this.isGitRepository()) {
        verification.errors.push('Not in a Git repository');
        return verification;
      }

      // Get repository information
      verification.repositoryUrl = this.getRepositoryUrl();
      verification.commitHash = this.getLatestCommitHash();
      verification.branchInfo = this.getBranchInfo();
      verification.lastCommit = this.getLastCommitInfo();

      // Verify remote connection
      const remoteStatus = await this.verifyRemoteConnection();
      verification.remoteStatus = remoteStatus;

      if (!remoteStatus.connected) {
        verification.errors.push('Cannot connect to remote repository');
        return verification;
      }

      // Count files in repository
      const fileCounts = this.getFileCounts();
      verification.filesUploaded = fileCounts.tracked;
      verification.totalFiles = fileCounts.total;

      // Verify latest commit is pushed
      const pushStatus = await this.verifyLatestCommitPushed();
      if (!pushStatus.pushed) {
        verification.errors.push('Latest commit not found on remote repository');
        verification.warnings.push('Local commits may not be synchronized with remote');
      }

      // Check for any uncommitted changes
      if (this.hasUncommittedChanges()) {
        verification.warnings.push('Repository has uncommitted changes');
      }

      // Check for unpushed commits
      const unpushedCommits = this.getUnpushedCommits();
      if (unpushedCommits.length > 0) {
        verification.warnings.push(`${unpushedCommits.length} local commits not pushed to remote`);
      }

      verification.success = verification.errors.length === 0;
      verification.warnings = this.warnings;
      verification.errors = this.errors;

      return verification;
    } catch (error) {
      verification.errors.push(`Verification failed: ${error.message}`);
      return verification;
    }
  }

  /**
   * Generate upload summary with file count and commit details
   */
  generateUploadSummary(verification) {
    console.log('📊 Generating upload summary...\n');
    
    const summary = {
      timestamp: new Date().toISOString(),
      status: verification.success ? 'SUCCESS' : 'FAILED',
      repository: {
        url: verification.repositoryUrl,
        branch: verification.branchInfo?.current,
        remoteTracking: verification.branchInfo?.upstream
      },
      commit: {
        hash: verification.commitHash,
        shortHash: verification.commitHash?.substring(0, 8),
        message: verification.lastCommit?.message,
        author: verification.lastCommit?.author,
        date: verification.lastCommit?.date
      },
      files: {
        uploaded: verification.filesUploaded,
        total: verification.totalFiles,
        uploadPercentage: verification.totalFiles > 0 
          ? Math.round((verification.filesUploaded / verification.totalFiles) * 100) 
          : 0
      },
      statistics: this.generateStatistics(),
      warnings: verification.warnings,
      errors: verification.errors
    };

    return summary;
  }

  /**
   * Provide repository URL and access confirmation
   */
  async confirmRepositoryAccess(repositoryUrl) {
    console.log('🌐 Confirming repository access...\n');
    
    const accessInfo = {
      url: repositoryUrl,
      accessible: false,
      responseTime: null,
      lastChecked: new Date().toISOString(),
      branches: [],
      tags: [],
      remoteCommits: 0
    };

    try {
      const startTime = Date.now();
      
      // Test remote connection
      const remoteInfo = await this.getRemoteRepositoryInfo();
      accessInfo.accessible = remoteInfo.success;
      accessInfo.responseTime = Date.now() - startTime;
      
      if (remoteInfo.success) {
        accessInfo.branches = remoteInfo.branches || [];
        accessInfo.tags = remoteInfo.tags || [];
        accessInfo.remoteCommits = remoteInfo.commitCount || 0;
      }

      return accessInfo;
    } catch (error) {
      accessInfo.error = error.message;
      return accessInfo;
    }
  }

  /**
   * Create completion status report with any warnings
   */
  createCompletionReport(verification, summary, accessInfo) {
    console.log('📋 Creating completion status report...\n');
    
    const report = {
      reportId: this.generateReportId(),
      timestamp: new Date().toISOString(),
      projectPath: this.projectPath,
      verification,
      summary,
      accessInfo,
      recommendations: this.generateRecommendations(verification, summary),
      nextSteps: this.generateNextSteps(verification, summary)
    };

    return report;
  }

  /**
   * Display formatted status report
   */
  displayStatusReport(report) {
    console.log('=' .repeat(60));
    console.log('📊 GITHUB UPLOAD STATUS REPORT');
    console.log('=' .repeat(60));
    
    // Header information
    console.log(`Report ID: ${report.reportId}`);
    console.log(`Generated: ${new Date(report.timestamp).toLocaleString()}`);
    console.log(`Project: ${path.basename(report.projectPath)}`);
    console.log('');

    // Overall status
    const statusIcon = report.verification.success ? '✅' : '❌';
    const statusText = report.verification.success ? 'SUCCESS' : 'FAILED';
    console.log(`${statusIcon} Overall Status: ${statusText}`);
    console.log('');

    // Repository information
    console.log('🏛️  Repository Information:');
    console.log(`   URL: ${report.summary.repository.url || 'Not configured'}`);
    console.log(`   Branch: ${report.summary.repository.branch || 'Unknown'}`);
    console.log(`   Remote Tracking: ${report.summary.repository.remoteTracking || 'Not set'}`);
    console.log('');

    // Commit information
    console.log('📝 Latest Commit:');
    console.log(`   Hash: ${report.summary.commit.hash || 'Unknown'}`);
    console.log(`   Message: ${report.summary.commit.message || 'No message'}`);
    console.log(`   Author: ${report.summary.commit.author || 'Unknown'}`);
    console.log(`   Date: ${report.summary.commit.date || 'Unknown'}`);
    console.log('');

    // File statistics
    console.log('📁 File Statistics:');
    console.log(`   Files Uploaded: ${report.summary.files.uploaded}`);
    console.log(`   Total Files: ${report.summary.files.total}`);
    console.log(`   Upload Coverage: ${report.summary.files.uploadPercentage}%`);
    console.log('');

    // Repository statistics
    if (report.summary.statistics) {
      console.log('📈 Repository Statistics:');
      console.log(`   Total Commits: ${report.summary.statistics.totalCommits || 0}`);
      console.log(`   Contributors: ${report.summary.statistics.contributors || 0}`);
      console.log(`   Branches: ${report.summary.statistics.branches || 0}`);
      console.log(`   Repository Size: ${report.summary.statistics.repositorySize || 'Unknown'}`);
      console.log('');
    }

    // Access confirmation
    console.log('🌐 Repository Access:');
    const accessIcon = report.accessInfo.accessible ? '✅' : '❌';
    console.log(`   ${accessIcon} Accessible: ${report.accessInfo.accessible ? 'Yes' : 'No'}`);
    if (report.accessInfo.responseTime) {
      console.log(`   Response Time: ${report.accessInfo.responseTime}ms`);
    }
    if (report.accessInfo.branches.length > 0) {
      console.log(`   Remote Branches: ${report.accessInfo.branches.join(', ')}`);
    }
    console.log('');

    // Warnings
    if (report.verification.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      report.verification.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
      console.log('');
    }

    // Errors
    if (report.verification.errors.length > 0) {
      console.log('❌ Errors:');
      report.verification.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
      console.log('');
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
      console.log('');
    }

    // Next steps
    if (report.nextSteps.length > 0) {
      console.log('🚀 Next Steps:');
      report.nextSteps.forEach(step => {
        console.log(`   • ${step}`);
      });
      console.log('');
    }

    console.log('=' .repeat(60));
    
    // Final summary
    if (report.verification.success) {
      console.log('🎉 Upload verification completed successfully!');
      console.log(`📍 Repository URL: ${report.summary.repository.url}`);
    } else {
      console.log('❌ Upload verification failed. Please review errors and try again.');
    }
    
    console.log('=' .repeat(60));
  }

  // Helper methods

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

  getRepositoryUrl() {
    try {
      return execSync('git remote get-url origin', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
    } catch (error) {
      return null;
    }
  }

  getLatestCommitHash() {
    try {
      return execSync('git rev-parse HEAD', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
    } catch (error) {
      return null;
    }
  }

  getBranchInfo() {
    try {
      const current = execSync('git branch --show-current', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      
      let upstream = null;
      try {
        upstream = execSync('git rev-parse --abbrev-ref @{upstream}', { 
          cwd: this.projectPath, 
          encoding: 'utf8' 
        }).trim();
      } catch (e) {
        // No upstream configured
      }
      
      return { current, upstream };
    } catch (error) {
      return null;
    }
  }

  getLastCommitInfo() {
    try {
      const message = execSync('git log -1 --pretty=format:"%s"', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim().replace(/"/g, '');
      
      const author = execSync('git log -1 --pretty=format:"%an <%ae>"', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim().replace(/"/g, '');
      
      const date = execSync('git log -1 --pretty=format:"%ai"', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim().replace(/"/g, '');
      
      return { message, author, date };
    } catch (error) {
      return null;
    }
  }

  async verifyRemoteConnection() {
    try {
      execSync('git ls-remote origin HEAD', { 
        cwd: this.projectPath, 
        stdio: 'pipe',
        timeout: 10000 // 10 second timeout
      });
      return { connected: true };
    } catch (error) {
      return { 
        connected: false, 
        error: error.message 
      };
    }
  }

  getFileCounts() {
    try {
      // Get tracked files
      const trackedFiles = execSync('git ls-files', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim().split('\n').filter(line => line.length > 0);
      
      // Get all files (excluding .git directory)
      const allFiles = this.getAllFiles(this.projectPath)
        .filter(file => !file.includes('.git/'));
      
      return {
        tracked: trackedFiles.length,
        total: allFiles.length
      };
    } catch (error) {
      return { tracked: 0, total: 0 };
    }
  }

  getAllFiles(dir, files = []) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && item !== '.git') {
          this.getAllFiles(fullPath, files);
        } else if (stat.isFile()) {
          files.push(path.relative(this.projectPath, fullPath));
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
    
    return files;
  }

  async verifyLatestCommitPushed() {
    try {
      const localCommit = this.getLatestCommitHash();
      const remoteCommit = execSync('git rev-parse origin/HEAD', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      
      return {
        pushed: localCommit === remoteCommit,
        localCommit,
        remoteCommit
      };
    } catch (error) {
      return { pushed: false, error: error.message };
    }
  }

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

  getUnpushedCommits() {
    try {
      const commits = execSync('git log origin/HEAD..HEAD --oneline', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      
      return commits ? commits.split('\n').filter(line => line.length > 0) : [];
    } catch (error) {
      return [];
    }
  }

  async getRemoteRepositoryInfo() {
    try {
      // Get remote branches
      const branches = execSync('git ls-remote --heads origin', { 
        cwd: this.projectPath, 
        encoding: 'utf8',
        timeout: 10000
      }).trim().split('\n')
        .map(line => line.split('\t')[1])
        .map(ref => ref.replace('refs/heads/', ''))
        .filter(branch => branch);

      // Get remote tags
      const tags = execSync('git ls-remote --tags origin', { 
        cwd: this.projectPath, 
        encoding: 'utf8',
        timeout: 10000
      }).trim().split('\n')
        .map(line => line.split('\t')[1])
        .map(ref => ref.replace('refs/tags/', ''))
        .filter(tag => tag && !tag.includes('^{}'));

      return {
        success: true,
        branches,
        tags,
        commitCount: branches.length > 0 ? 1 : 0 // Simplified count
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  generateStatistics() {
    try {
      const totalCommits = execSync('git rev-list --count HEAD', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim();
      
      const contributors = execSync('git shortlog -sn --all', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim().split('\n').length;
      
      const branches = execSync('git branch -r', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim().split('\n').length;
      
      const repositorySize = execSync('du -sh .git', { 
        cwd: this.projectPath, 
        encoding: 'utf8' 
      }).trim().split('\t')[0];
      
      return {
        totalCommits: parseInt(totalCommits),
        contributors,
        branches,
        repositorySize
      };
    } catch (error) {
      return null;
    }
  }

  generateRecommendations(verification, summary) {
    const recommendations = [];
    
    if (verification.warnings.includes('Repository has uncommitted changes')) {
      recommendations.push('Commit and push any remaining changes to keep repository synchronized');
    }
    
    if (verification.warnings.some(w => w.includes('local commits not pushed'))) {
      recommendations.push('Push local commits to remote repository to ensure all changes are backed up');
    }
    
    if (summary.files.uploadPercentage < 100) {
      recommendations.push('Review .gitignore file to ensure all necessary files are being tracked');
    }
    
    if (!summary.repository.remoteTracking) {
      recommendations.push('Set up upstream tracking for your branch: git branch --set-upstream-to=origin/main');
    }
    
    return recommendations;
  }

  generateNextSteps(verification, summary) {
    const nextSteps = [];
    
    if (verification.success) {
      nextSteps.push('Repository successfully uploaded and verified');
      nextSteps.push('You can now access your code at: ' + summary.repository.url);
      nextSteps.push('Consider setting up continuous integration/deployment if needed');
    } else {
      nextSteps.push('Review and resolve any errors listed above');
      nextSteps.push('Ensure proper Git configuration and remote setup');
      nextSteps.push('Retry the upload process after fixing issues');
    }
    
    return nextSteps;
  }

  generateReportId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `upload-verification-${timestamp}-${random}`;
  }

  /**
   * Save report to file
   */
  saveReportToFile(report, filename = null) {
    const reportFilename = filename || `upload-report-${Date.now()}.json`;
    const reportPath = path.join(this.projectPath, reportFilename);
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved to: ${reportPath}`);
      return reportPath;
    } catch (error) {
      console.error('❌ Failed to save report:', error.message);
      return null;
    }
  }

  /**
   * Execute complete verification and reporting process
   */
  async executeVerificationAndReporting() {
    console.log('🚀 Starting GitHub upload verification and status reporting...\n');
    
    try {
      // Step 1: Verify upload
      const verification = await this.verifyUpload();
      
      // Step 2: Generate summary
      const summary = this.generateUploadSummary(verification);
      
      // Step 3: Confirm repository access
      const accessInfo = await this.confirmRepositoryAccess(verification.repositoryUrl);
      
      // Step 4: Create completion report
      const report = this.createCompletionReport(verification, summary, accessInfo);
      
      // Step 5: Display status report
      this.displayStatusReport(report);
      
      // Step 6: Save report to file
      this.saveReportToFile(report);
      
      return report;
    } catch (error) {
      console.error('❌ Verification and reporting failed:', error.message);
      throw error;
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
GitHub Upload Verification and Status Reporting

Usage: node github-upload-verification.js [command] [options]

Commands:
  verify                  Run complete verification and reporting (default)
  check                   Quick verification check only
  summary                 Generate upload summary only
  access                  Check repository access only
  report                  Generate and display full report

Options:
  --save-report          Save report to JSON file
  --project-path <path>  Specify project path (default: current directory)
  --help                 Show this help message

Examples:
  node github-upload-verification.js verify
  node github-upload-verification.js check
  node github-upload-verification.js verify --save-report
  node github-upload-verification.js verify --project-path /path/to/project
    `);
    process.exit(0);
  }

  async function main() {
    const command = args[0] || 'verify';
    let projectPath = '.';
    
    // Parse options
    for (let i = 1; i < args.length; i++) {
      switch (args[i]) {
        case '--project-path':
          projectPath = args[++i];
          break;
      }
    }

    const verifier = new GitHubUploadVerifier(projectPath);

    try {
      switch (command) {
        case 'verify':
          const report = await verifier.executeVerificationAndReporting();
          process.exit(report.verification.success ? 0 : 1);
          break;
        case 'check':
          const verification = await verifier.verifyUpload();
          console.log(verification.success ? '✅ Verification passed' : '❌ Verification failed');
          process.exit(verification.success ? 0 : 1);
          break;
        case 'summary':
          const verificationForSummary = await verifier.verifyUpload();
          const summary = verifier.generateUploadSummary(verificationForSummary);
          console.log(JSON.stringify(summary, null, 2));
          break;
        case 'access':
          const repoUrl = verifier.getRepositoryUrl();
          const accessInfo = await verifier.confirmRepositoryAccess(repoUrl);
          console.log(JSON.stringify(accessInfo, null, 2));
          break;
        case 'report':
          await verifier.executeVerificationAndReporting();
          break;
        default:
          console.error('❌ Unknown command. Use --help for usage information.');
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Execution error:', error.message);
      process.exit(1);
    }
  }

  main().catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = GitHubUploadVerifier;