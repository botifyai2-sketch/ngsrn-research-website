/**
 * Complete GitHub Upload with Verification and Status Reporting
 * Integrates push functionality with comprehensive verification and reporting
 */

const GitHubPushHandler = require('./github-push');
const GitHubUploadVerifier = require('./github-upload-verification');
const GitHubUploadRecovery = require('./github-upload-recovery');
const path = require('path');

class CompleteGitHubUpload {
  constructor(projectPath = '.') {
    this.projectPath = path.resolve(projectPath);
    this.pushHandler = new GitHubPushHandler(projectPath);
    this.verifier = new GitHubUploadVerifier(projectPath);
    this.recovery = new GitHubUploadRecovery(projectPath);
  }

  /**
   * Execute complete upload process with verification and reporting
   */
  async executeCompleteUpload(options = {}) {
    const {
      branch = null,
      remoteName = 'origin',
      setUpstream = true,
      force = false,
      skipVerification = false,
      saveReport = true
    } = options;

    console.log('🚀 Starting complete GitHub upload process...\n');
    console.log('=' .repeat(60));

    const uploadResult = {
      success: false,
      pushResult: null,
      verificationResult: null,
      report: null,
      timestamp: new Date().toISOString(),
      duration: null,
      recoveryResult: null
    };

    const startTime = Date.now();
    const operationName = `upload-${Date.now()}`;

    try {
      // Save Git state before starting upload
      console.log('💾 Saving current Git state for recovery...');
      await this.recovery.saveGitState(operationName);
      console.log('✅ Git state saved successfully\n');
      // Step 1: Execute push to GitHub
      console.log('📤 Step 1: Pushing to GitHub repository...\n');
      
      const pushResult = await this.pushHandler.pushToRepository({
        branch,
        remoteName,
        setUpstream,
        force
      });

      uploadResult.pushResult = pushResult;

      if (!pushResult.success) {
        console.error('\n❌ Push failed - aborting upload process');
        uploadResult.duration = Date.now() - startTime;
        return uploadResult;
      }

      console.log('\n✅ Push completed successfully!');
      console.log('-'.repeat(40));

      // Step 2: Verify upload and generate report
      if (!skipVerification) {
        console.log('\n🔍 Step 2: Verifying upload and generating status report...\n');
        
        // Wait a moment for remote to update
        await this.sleep(2000);
        
        const verificationReport = await this.verifier.executeVerificationAndReporting();
        uploadResult.verificationResult = verificationReport.verification;
        uploadResult.report = verificationReport;

        if (saveReport) {
          const reportFilename = `complete-upload-report-${Date.now()}.json`;
          this.verifier.saveReportToFile(verificationReport, reportFilename);
        }
      } else {
        console.log('\n⏭️  Step 2: Skipping verification (as requested)');
      }

      uploadResult.success = true;
      uploadResult.duration = Date.now() - startTime;

      // Final summary
      this.displayFinalSummary(uploadResult);

      return uploadResult;
    } catch (error) {
      console.error('\n❌ Complete upload process failed:', error.message);
      uploadResult.error = error.message;
      uploadResult.duration = Date.now() - startTime;

      // Perform error recovery and analysis
      console.log('\n🔧 Initiating error recovery...');
      try {
        const recoveryResult = await this.recovery.analyzeAndRecover(error, operationName);
        uploadResult.recoveryResult = recoveryResult;
        
        if (recoveryResult.success) {
          console.log('✅ Error recovery completed successfully');
        } else {
          console.log('⚠️  Error recovery encountered issues');
        }
      } catch (recoveryError) {
        console.error('❌ Error recovery failed:', recoveryError.message);
        uploadResult.recoveryError = recoveryError.message;
      }

      return uploadResult;
    }
  }

  /**
   * Display final summary of the complete upload process
   */
  displayFinalSummary(uploadResult) {
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 COMPLETE UPLOAD SUMMARY');
    console.log('=' .repeat(60));

    // Overall status
    const statusIcon = uploadResult.success ? '✅' : '❌';
    const statusText = uploadResult.success ? 'SUCCESS' : 'FAILED';
    console.log(`${statusIcon} Overall Status: ${statusText}`);
    
    // Duration
    const durationSeconds = uploadResult.duration ? (uploadResult.duration / 1000).toFixed(1) : 'Unknown';
    console.log(`⏱️  Total Duration: ${durationSeconds}s`);
    console.log(`📅 Completed: ${new Date(uploadResult.timestamp).toLocaleString()}`);
    console.log('');

    // Push results
    if (uploadResult.pushResult) {
      console.log('📤 Push Results:');
      console.log(`   Status: ${uploadResult.pushResult.success ? '✅ Success' : '❌ Failed'}`);
      console.log(`   Branch: ${uploadResult.pushResult.branch || 'Unknown'}`);
      console.log(`   Remote: ${uploadResult.pushResult.remote || 'Unknown'}`);
      if (uploadResult.pushResult.attempt) {
        console.log(`   Attempts: ${uploadResult.pushResult.attempt}`);
      }
      console.log('');
    }

    // Verification results
    if (uploadResult.verificationResult) {
      console.log('🔍 Verification Results:');
      console.log(`   Status: ${uploadResult.verificationResult.success ? '✅ Verified' : '❌ Failed'}`);
      console.log(`   Files Uploaded: ${uploadResult.verificationResult.filesUploaded || 0}`);
      console.log(`   Repository URL: ${uploadResult.verificationResult.repositoryUrl || 'Unknown'}`);
      console.log(`   Commit Hash: ${uploadResult.verificationResult.commitHash?.substring(0, 8) || 'Unknown'}`);
      
      if (uploadResult.verificationResult.warnings.length > 0) {
        console.log(`   Warnings: ${uploadResult.verificationResult.warnings.length}`);
      }
      
      if (uploadResult.verificationResult.errors.length > 0) {
        console.log(`   Errors: ${uploadResult.verificationResult.errors.length}`);
      }
      console.log('');
    }

    // Repository access
    if (uploadResult.report && uploadResult.report.accessInfo) {
      const accessInfo = uploadResult.report.accessInfo;
      console.log('🌐 Repository Access:');
      console.log(`   Accessible: ${accessInfo.accessible ? '✅ Yes' : '❌ No'}`);
      if (accessInfo.responseTime) {
        console.log(`   Response Time: ${accessInfo.responseTime}ms`);
      }
      console.log('');
    }

    // Next steps
    if (uploadResult.success) {
      console.log('🚀 Next Steps:');
      console.log('   • Your code is now available on GitHub');
      if (uploadResult.verificationResult?.repositoryUrl) {
        console.log(`   • Repository URL: ${uploadResult.verificationResult.repositoryUrl}`);
      }
      console.log('   • Consider setting up CI/CD pipelines');
      console.log('   • Configure branch protection rules if needed');
      console.log('   • Add collaborators and set up team access');
    } else {
      console.log('🔧 Troubleshooting:');
      console.log('   • Review error messages above');
      console.log('   • Check your GitHub credentials and permissions');
      console.log('   • Ensure stable internet connection');
      console.log('   • Verify repository URL and access rights');
    }

    console.log('=' .repeat(60));
  }

  /**
   * Quick upload with default settings
   */
  async quickUpload(branch = null) {
    return await this.executeCompleteUpload({
      branch,
      setUpstream: true,
      skipVerification: false,
      saveReport: true
    });
  }

  /**
   * Upload with verification disabled (faster)
   */
  async fastUpload(branch = null) {
    return await this.executeCompleteUpload({
      branch,
      setUpstream: true,
      skipVerification: true,
      saveReport: false
    });
  }

  /**
   * Upload with comprehensive verification and reporting
   */
  async comprehensiveUpload(branch = null) {
    return await this.executeCompleteUpload({
      branch,
      setUpstream: true,
      skipVerification: false,
      saveReport: true
    });
  }

  /**
   * Force upload (use with caution)
   */
  async forceUpload(branch = null) {
    console.warn('⚠️  WARNING: Force upload will overwrite remote history');
    console.warn('   This should only be used when you are certain about the changes\n');
    
    return await this.executeCompleteUpload({
      branch,
      setUpstream: false,
      force: true,
      skipVerification: false,
      saveReport: true
    });
  }

  /**
   * Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Pre-upload checks and recommendations
   */
  async performPreUploadChecks() {
    console.log('🔍 Performing pre-upload checks...\n');
    
    const checks = {
      gitRepository: false,
      remoteConfigured: false,
      uncommittedChanges: false,
      unpushedCommits: false,
      repositoryUrl: null,
      currentBranch: null,
      recommendations: []
    };

    try {
      // Check if Git repository
      checks.gitRepository = this.pushHandler.isGitRepository();
      console.log(`   Git repository: ${checks.gitRepository ? '✅' : '❌'}`);

      if (!checks.gitRepository) {
        checks.recommendations.push('Initialize Git repository: git init');
        return checks;
      }

      // Check remote configuration
      checks.remoteConfigured = this.pushHandler.checkRemoteExists('origin');
      console.log(`   Remote configured: ${checks.remoteConfigured ? '✅' : '❌'}`);

      if (!checks.remoteConfigured) {
        checks.recommendations.push('Add remote repository: git remote add origin <repository-url>');
      } else {
        checks.repositoryUrl = this.pushHandler.getRemoteUrl('origin');
        console.log(`   Repository URL: ${checks.repositoryUrl}`);
      }

      // Check current branch
      checks.currentBranch = this.pushHandler.getCurrentBranch();
      console.log(`   Current branch: ${checks.currentBranch}`);

      // Check for uncommitted changes
      checks.uncommittedChanges = this.pushHandler.hasUncommittedChanges();
      console.log(`   Uncommitted changes: ${checks.uncommittedChanges ? '⚠️  Yes' : '✅ No'}`);

      if (checks.uncommittedChanges) {
        checks.recommendations.push('Commit changes: git add . && git commit -m "Your message"');
      }

      // Check for unpushed commits
      const unpushedCommits = this.verifier.getUnpushedCommits();
      checks.unpushedCommits = unpushedCommits.length > 0;
      console.log(`   Unpushed commits: ${unpushedCommits.length}`);

      // Generate recommendations
      if (checks.gitRepository && checks.remoteConfigured && !checks.uncommittedChanges) {
        checks.recommendations.push('Repository is ready for upload');
      }

      console.log('\n✅ Pre-upload checks completed');
      
      if (checks.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        checks.recommendations.forEach(rec => {
          console.log(`   • ${rec}`);
        });
      }

      return checks;
    } catch (error) {
      console.error('❌ Pre-upload checks failed:', error.message);
      checks.error = error.message;
      return checks;
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Complete GitHub Upload with Verification and Status Reporting

Usage: node github-upload-complete.js [command] [options]

Commands:
  upload                  Complete upload with verification (default)
  quick                   Quick upload with default settings
  fast                    Fast upload without verification
  comprehensive           Upload with comprehensive verification
  force                   Force upload (use with caution)
  check                   Run pre-upload checks only

Options:
  --branch <name>         Branch to upload (default: current branch)
  --remote <name>         Remote name (default: "origin")
  --no-upstream          Don't set upstream tracking
  --no-verification      Skip upload verification
  --no-report            Don't save report to file
  --project-path <path>   Specify project path (default: current directory)
  --help                 Show this help message

Examples:
  node github-upload-complete.js upload
  node github-upload-complete.js quick --branch main
  node github-upload-complete.js comprehensive
  node github-upload-complete.js check
  node github-upload-complete.js upload --no-verification
    `);
    process.exit(0);
  }

  async function main() {
    const command = args[0] || 'upload';
    const options = {};
    let projectPath = '.';

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
        case '--no-verification':
          options.skipVerification = true;
          break;
        case '--no-report':
          options.saveReport = false;
          break;
        case '--project-path':
          projectPath = args[++i];
          break;
      }
    }

    const uploader = new CompleteGitHubUpload(projectPath);

    try {
      let result;
      
      switch (command) {
        case 'upload':
          result = await uploader.executeCompleteUpload(options);
          break;
        case 'quick':
          result = await uploader.quickUpload(options.branch);
          break;
        case 'fast':
          result = await uploader.fastUpload(options.branch);
          break;
        case 'comprehensive':
          result = await uploader.comprehensiveUpload(options.branch);
          break;
        case 'force':
          result = await uploader.forceUpload(options.branch);
          break;
        case 'check':
          const checks = await uploader.performPreUploadChecks();
          process.exit(checks.gitRepository && checks.remoteConfigured ? 0 : 1);
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

module.exports = CompleteGitHubUpload;