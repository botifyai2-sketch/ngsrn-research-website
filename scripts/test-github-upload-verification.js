/**
 * Test script for GitHub Upload Verification
 * Tests the verification and status reporting functionality
 */

const GitHubUploadVerifier = require('./github-upload-verification');
const path = require('path');

class GitHubUploadVerificationTester {
  constructor() {
    this.verifier = new GitHubUploadVerifier();
  }

  /**
   * Test upload verification functionality
   */
  async testUploadVerification() {
    console.log('🧪 Testing upload verification...\n');
    
    try {
      const verification = await this.verifier.verifyUpload();
      
      console.log('✅ Upload verification test completed');
      console.log(`   Success: ${verification.success}`);
      console.log(`   Repository URL: ${verification.repositoryUrl || 'Not configured'}`);
      console.log(`   Commit Hash: ${verification.commitHash || 'Not found'}`);
      console.log(`   Files Uploaded: ${verification.filesUploaded}`);
      console.log(`   Total Files: ${verification.totalFiles}`);
      console.log(`   Warnings: ${verification.warnings.length}`);
      console.log(`   Errors: ${verification.errors.length}`);
      
      if (verification.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        verification.warnings.forEach(warning => {
          console.log(`   • ${warning}`);
        });
      }
      
      if (verification.errors.length > 0) {
        console.log('\n❌ Errors:');
        verification.errors.forEach(error => {
          console.log(`   • ${error}`);
        });
      }
      
      return verification;
    } catch (error) {
      console.error('❌ Upload verification test error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test upload summary generation
   */
  async testUploadSummary() {
    console.log('🧪 Testing upload summary generation...\n');
    
    try {
      const verification = await this.verifier.verifyUpload();
      const summary = this.verifier.generateUploadSummary(verification);
      
      console.log('✅ Upload summary test completed');
      console.log(`   Status: ${summary.status}`);
      console.log(`   Repository URL: ${summary.repository.url || 'Not configured'}`);
      console.log(`   Branch: ${summary.repository.branch || 'Unknown'}`);
      console.log(`   Commit Hash: ${summary.commit.shortHash || 'Unknown'}`);
      console.log(`   Files Uploaded: ${summary.files.uploaded}`);
      console.log(`   Upload Percentage: ${summary.files.uploadPercentage}%`);
      
      return summary;
    } catch (error) {
      console.error('❌ Upload summary test error:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Test repository access confirmation
   */
  async testRepositoryAccess() {
    console.log('🧪 Testing repository access confirmation...\n');
    
    try {
      const repositoryUrl = this.verifier.getRepositoryUrl();
      
      if (!repositoryUrl) {
        console.log('⚠️  No repository URL configured - skipping access test');
        return { skipped: true, reason: 'No repository URL' };
      }
      
      const accessInfo = await this.verifier.confirmRepositoryAccess(repositoryUrl);
      
      console.log('✅ Repository access test completed');
      console.log(`   URL: ${accessInfo.url}`);
      console.log(`   Accessible: ${accessInfo.accessible}`);
      console.log(`   Response Time: ${accessInfo.responseTime || 'N/A'}ms`);
      console.log(`   Branches: ${accessInfo.branches.length}`);
      console.log(`   Tags: ${accessInfo.tags.length}`);
      
      if (accessInfo.branches.length > 0) {
        console.log(`   Remote Branches: ${accessInfo.branches.slice(0, 3).join(', ')}${accessInfo.branches.length > 3 ? '...' : ''}`);
      }
      
      return accessInfo;
    } catch (error) {
      console.error('❌ Repository access test error:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Test completion report generation
   */
  async testCompletionReport() {
    console.log('🧪 Testing completion report generation...\n');
    
    try {
      const verification = await this.verifier.verifyUpload();
      const summary = this.verifier.generateUploadSummary(verification);
      const accessInfo = await this.verifier.confirmRepositoryAccess(verification.repositoryUrl);
      const report = this.verifier.createCompletionReport(verification, summary, accessInfo);
      
      console.log('✅ Completion report test completed');
      console.log(`   Report ID: ${report.reportId}`);
      console.log(`   Timestamp: ${report.timestamp}`);
      console.log(`   Project Path: ${path.basename(report.projectPath)}`);
      console.log(`   Verification Success: ${report.verification.success}`);
      console.log(`   Recommendations: ${report.recommendations.length}`);
      console.log(`   Next Steps: ${report.nextSteps.length}`);
      
      return report;
    } catch (error) {
      console.error('❌ Completion report test error:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Test helper methods
   */
  testHelperMethods() {
    console.log('🧪 Testing helper methods...\n');
    
    const results = {
      isGitRepository: false,
      repositoryUrl: null,
      latestCommitHash: null,
      branchInfo: null,
      lastCommitInfo: null,
      fileCounts: null,
      hasUncommittedChanges: false,
      unpushedCommits: []
    };
    
    try {
      // Test Git repository check
      results.isGitRepository = this.verifier.isGitRepository();
      console.log(`   Git repository: ${results.isGitRepository ? '✅' : '❌'}`);
      
      // Test repository URL
      results.repositoryUrl = this.verifier.getRepositoryUrl();
      console.log(`   Repository URL: ${results.repositoryUrl || 'Not configured'}`);
      
      // Test latest commit hash
      results.latestCommitHash = this.verifier.getLatestCommitHash();
      console.log(`   Latest commit: ${results.latestCommitHash ? results.latestCommitHash.substring(0, 8) : 'Not found'}`);
      
      // Test branch info
      results.branchInfo = this.verifier.getBranchInfo();
      console.log(`   Current branch: ${results.branchInfo?.current || 'Unknown'}`);
      console.log(`   Upstream: ${results.branchInfo?.upstream || 'Not set'}`);
      
      // Test last commit info
      results.lastCommitInfo = this.verifier.getLastCommitInfo();
      console.log(`   Last commit message: ${results.lastCommitInfo?.message || 'Not found'}`);
      
      // Test file counts
      results.fileCounts = this.verifier.getFileCounts();
      console.log(`   Tracked files: ${results.fileCounts.tracked}`);
      console.log(`   Total files: ${results.fileCounts.total}`);
      
      // Test uncommitted changes
      results.hasUncommittedChanges = this.verifier.hasUncommittedChanges();
      console.log(`   Uncommitted changes: ${results.hasUncommittedChanges ? '⚠️  Yes' : '✅ No'}`);
      
      // Test unpushed commits
      results.unpushedCommits = this.verifier.getUnpushedCommits();
      console.log(`   Unpushed commits: ${results.unpushedCommits.length}`);
      
      console.log('\n✅ Helper methods test completed');
      return results;
    } catch (error) {
      console.error('❌ Helper methods test error:', error.message);
      return { ...results, error: error.message };
    }
  }

  /**
   * Test full verification and reporting process
   */
  async testFullProcess() {
    console.log('🧪 Testing full verification and reporting process...\n');
    
    try {
      const report = await this.verifier.executeVerificationAndReporting();
      
      console.log('\n✅ Full process test completed');
      console.log(`   Overall success: ${report.verification.success}`);
      console.log(`   Report generated: ${report.reportId}`);
      
      return report;
    } catch (error) {
      console.error('❌ Full process test error:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runTestSuite() {
    console.log('🚀 Starting GitHub Upload Verification Test Suite\n');
    console.log('=' .repeat(60));
    
    const testResults = {
      helperMethods: null,
      uploadVerification: null,
      uploadSummary: null,
      repositoryAccess: null,
      completionReport: null,
      fullProcess: null
    };
    
    // Test 1: Helper methods
    console.log('\n🔧 Test 1: Helper Methods');
    console.log('-'.repeat(30));
    testResults.helperMethods = this.testHelperMethods();
    
    // Only proceed with advanced tests if basic setup is valid
    if (testResults.helperMethods.isGitRepository) {
      // Test 2: Upload verification
      console.log('\n🔍 Test 2: Upload Verification');
      console.log('-'.repeat(30));
      testResults.uploadVerification = await this.testUploadVerification();
      
      // Test 3: Upload summary
      console.log('\n📊 Test 3: Upload Summary');
      console.log('-'.repeat(30));
      testResults.uploadSummary = await this.testUploadSummary();
      
      // Test 4: Repository access
      console.log('\n🌐 Test 4: Repository Access');
      console.log('-'.repeat(30));
      testResults.repositoryAccess = await this.testRepositoryAccess();
      
      // Test 5: Completion report
      console.log('\n📋 Test 5: Completion Report');
      console.log('-'.repeat(30));
      testResults.completionReport = await this.testCompletionReport();
      
      // Test 6: Full process
      console.log('\n🚀 Test 6: Full Process');
      console.log('-'.repeat(30));
      testResults.fullProcess = await this.testFullProcess();
    } else {
      console.log('\n⚠️  Skipping advanced tests - not in a Git repository');
      console.log('   Please run this test from within a Git repository');
    }
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('=' .repeat(60));
    
    const passedTests = [];
    const failedTests = [];
    const skippedTests = [];
    
    // Evaluate test results
    if (testResults.helperMethods && !testResults.helperMethods.error) {
      passedTests.push('Helper Methods');
    } else {
      failedTests.push('Helper Methods');
    }
    
    if (testResults.uploadVerification) {
      if (testResults.uploadVerification.success !== false && !testResults.uploadVerification.error) {
        passedTests.push('Upload Verification');
      } else {
        failedTests.push('Upload Verification');
      }
    } else {
      skippedTests.push('Upload Verification');
    }
    
    if (testResults.uploadSummary && !testResults.uploadSummary.error) {
      passedTests.push('Upload Summary');
    } else if (testResults.uploadSummary) {
      failedTests.push('Upload Summary');
    } else {
      skippedTests.push('Upload Summary');
    }
    
    if (testResults.repositoryAccess) {
      if (testResults.repositoryAccess.skipped) {
        skippedTests.push('Repository Access');
      } else if (!testResults.repositoryAccess.error) {
        passedTests.push('Repository Access');
      } else {
        failedTests.push('Repository Access');
      }
    } else {
      skippedTests.push('Repository Access');
    }
    
    if (testResults.completionReport && !testResults.completionReport.error) {
      passedTests.push('Completion Report');
    } else if (testResults.completionReport) {
      failedTests.push('Completion Report');
    } else {
      skippedTests.push('Completion Report');
    }
    
    if (testResults.fullProcess && !testResults.fullProcess.error) {
      passedTests.push('Full Process');
    } else if (testResults.fullProcess) {
      failedTests.push('Full Process');
    } else {
      skippedTests.push('Full Process');
    }
    
    console.log(`✅ Passed: ${passedTests.length} tests`);
    if (passedTests.length > 0) {
      passedTests.forEach(test => console.log(`   • ${test}`));
    }
    
    console.log(`❌ Failed: ${failedTests.length} tests`);
    if (failedTests.length > 0) {
      failedTests.forEach(test => console.log(`   • ${test}`));
    }
    
    console.log(`⏭️  Skipped: ${skippedTests.length} tests`);
    if (skippedTests.length > 0) {
      skippedTests.forEach(test => console.log(`   • ${test}`));
    }
    
    const totalTests = passedTests.length + failedTests.length;
    const successRate = totalTests > 0 ? Math.round((passedTests.length / totalTests) * 100) : 0;
    
    console.log(`\n📈 Success Rate: ${successRate}% (${passedTests.length}/${totalTests})`);
    
    if (successRate === 100) {
      console.log('🎉 All tests passed! GitHub Upload Verification is working correctly.');
    } else if (successRate >= 75) {
      console.log('⚠️  Most tests passed. Check failed tests for issues.');
    } else {
      console.log('❌ Multiple tests failed. Please review configuration and setup.');
    }
    
    return testResults;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
GitHub Upload Verification Test Script

Usage: node test-github-upload-verification.js [command] [options]

Commands:
  suite                   Run complete test suite (default)
  helpers                 Test helper methods only
  verify                  Test upload verification only
  summary                 Test upload summary only
  access                  Test repository access only
  report                  Test completion report only
  full                    Test full process only

Options:
  --help                 Show this help message

Examples:
  node test-github-upload-verification.js suite
  node test-github-upload-verification.js helpers
  node test-github-upload-verification.js verify
  node test-github-upload-verification.js full
    `);
    process.exit(0);
  }

  async function main() {
    const command = args[0] || 'suite';
    const tester = new GitHubUploadVerificationTester();

    try {
      switch (command) {
        case 'suite':
          await tester.runTestSuite();
          break;
        case 'helpers':
          tester.testHelperMethods();
          break;
        case 'verify':
          await tester.testUploadVerification();
          break;
        case 'summary':
          await tester.testUploadSummary();
          break;
        case 'access':
          await tester.testRepositoryAccess();
          break;
        case 'report':
          await tester.testCompletionReport();
          break;
        case 'full':
          await tester.testFullProcess();
          break;
        default:
          console.error('❌ Unknown command. Use --help for usage information.');
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Test execution error:', error.message);
      process.exit(1);
    }
  }

  main().catch((error) => {
    console.error('❌ Fatal test error:', error.message);
    process.exit(1);
  });
}

module.exports = GitHubUploadVerificationTester;