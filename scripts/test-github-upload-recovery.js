#!/usr/bin/env node

/**
 * Test Script for GitHub Upload Error Recovery and Rollback Mechanisms
 * Tests various error scenarios and recovery capabilities
 */

const GitHubUploadRecovery = require('./github-upload-recovery');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubUploadRecoveryTester {
  constructor(testPath = './test-recovery') {
    this.testPath = path.resolve(testPath);
    this.recovery = new GitHubUploadRecovery(this.testPath);
    this.testResults = [];
  }

  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    try {
      // Create test directory
      if (fs.existsSync(this.testPath)) {
        if (process.platform === 'win32') {
          execSync(`rmdir /s /q "${this.testPath}"`);
        } else {
          execSync(`rm -rf "${this.testPath}"`);
        }
      }
      
      fs.mkdirSync(this.testPath, { recursive: true });
      
      // Create some test files
      fs.writeFileSync(path.join(this.testPath, 'README.md'), '# Test Repository\n\nThis is a test repository for recovery testing.');
      fs.writeFileSync(path.join(this.testPath, 'package.json'), JSON.stringify({
        name: 'test-recovery',
        version: '1.0.0',
        description: 'Test repository for recovery mechanisms'
      }, null, 2));
      
      console.log('✅ Test environment setup completed');
      return true;
    } catch (error) {
      console.error('❌ Failed to setup test environment:', error.message);
      return false;
    }
  }

  /**
   * Cleanup test environment
   */
  async cleanupTestEnvironment() {
    console.log('🧹 Cleaning up test environment...');
    
    try {
      if (fs.existsSync(this.testPath)) {
        if (process.platform === 'win32') {
          execSync(`rmdir /s /q "${this.testPath}"`);
        } else {
          execSync(`rm -rf "${this.testPath}"`);
        }
      }
      
      console.log('✅ Test environment cleanup completed');
      return true;
    } catch (error) {
      console.error('❌ Failed to cleanup test environment:', error.message);
      return false;
    }
  }

  /**
   * Run a test case and record results
   */
  async runTestCase(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    console.log('-'.repeat(50));
    
    const startTime = Date.now();
    let result;
    
    try {
      result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        success: result.success,
        duration,
        details: result.details || null,
        error: result.error || null
      });
      
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} ${testName} (${duration}ms)`);
      
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name: testName,
        success: false,
        duration,
        error: error.message
      });
      
      console.log(`❌ FAILED ${testName} (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Git state saving and restoration
   */
  async testGitStateSaveRestore() {
    return await this.runTestCase('Git State Save/Restore', async () => {
      try {
        // Initialize Git repository
        execSync('git init', { cwd: this.testPath, stdio: 'pipe' });
        execSync('git config user.name "Test User"', { cwd: this.testPath, stdio: 'pipe' });
        execSync('git config user.email "test@example.com"', { cwd: this.testPath, stdio: 'pipe' });
        execSync('git add .', { cwd: this.testPath, stdio: 'pipe' });
        execSync('git commit -m "Initial commit"', { cwd: this.testPath, stdio: 'pipe' });
        
        // Save Git state
        const savedState = await this.recovery.saveGitState('test-operation');
        
        if (!savedState.hasGitRepo) {
          return { success: false, error: 'Failed to detect Git repository' };
        }
        
        // Make some changes
        execSync('git config user.name "Modified User"', { cwd: this.testPath, stdio: 'pipe' });
        fs.writeFileSync(path.join(this.testPath, 'test.txt'), 'Test file');
        execSync('git add test.txt', { cwd: this.testPath, stdio: 'pipe' });
        execSync('git commit -m "Test commit"', { cwd: this.testPath, stdio: 'pipe' });
        
        // Restore Git state
        const restoreResult = await this.recovery.restoreGitState('test-operation');
        
        if (!restoreResult.success) {
          return { success: false, error: 'Failed to restore Git state' };
        }
        
        // Verify restoration
        const currentUser = execSync('git config user.name', { cwd: this.testPath, encoding: 'utf8' }).trim();
        
        if (currentUser !== 'Test User') {
          return { success: false, error: `User not restored correctly: ${currentUser}` };
        }
        
        return { 
          success: true, 
          details: 'Git state saved and restored successfully' 
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Test Git initialization rollback
   */
  async testGitInitRollback() {
    return await this.runTestCase('Git Initialization Rollback', async () => {
      try {
        // Initialize Git repository
        execSync('git init', { cwd: this.testPath, stdio: 'pipe' });
        
        // Save state (no Git repo originally)
        await this.recovery.saveGitState('git-init-test');
        
        // Verify Git directory exists
        const gitDir = path.join(this.testPath, '.git');
        if (!fs.existsSync(gitDir)) {
          return { success: false, error: 'Git directory not found after init' };
        }
        
        // Rollback Git initialization
        const rollbackResult = await this.recovery.rollbackGitInitialization('git-init-test');
        
        if (!rollbackResult.success) {
          return { success: false, error: 'Rollback failed' };
        }
        
        // Verify Git directory is removed
        if (fs.existsSync(gitDir)) {
          return { success: false, error: 'Git directory still exists after rollback' };
        }
        
        return { 
          success: true, 
          details: 'Git initialization rolled back successfully' 
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Test partial upload cleanup
   */
  async testPartialUploadCleanup() {
    return await this.runTestCase('Partial Upload Cleanup', async () => {
      try {
        // Initialize Git repository
        execSync('git init', { cwd: this.testPath, stdio: 'pipe' });
        execSync('git config user.name "Test User"', { cwd: this.testPath, stdio: 'pipe' });
        execSync('git config user.email "test@example.com"', { cwd: this.testPath, stdio: 'pipe' });
        execSync('git add .', { cwd: this.testPath, stdio: 'pipe' });
        execSync('git commit -m "Initial commit"', { cwd: this.testPath, stdio: 'pipe' });
        
        // Save state
        await this.recovery.saveGitState('upload-test');
        
        // Simulate partial upload state by creating merge files
        const mergeHeadPath = path.join(this.testPath, '.git', 'MERGE_HEAD');
        const mergeMsgPath = path.join(this.testPath, '.git', 'MERGE_MSG');
        
        fs.writeFileSync(mergeHeadPath, 'abc123def456');
        fs.writeFileSync(mergeMsgPath, 'Merge commit message');
        
        // Set credential helper (to be cleaned up)
        execSync('git config credential.helper store', { cwd: this.testPath, stdio: 'pipe' });
        
        // Perform cleanup
        const cleanupResult = await this.recovery.cleanupPartialUpload('upload-test');
        
        if (!cleanupResult.success) {
          return { success: false, error: 'Cleanup failed' };
        }
        
        // Verify cleanup
        if (fs.existsSync(mergeHeadPath) || fs.existsSync(mergeMsgPath)) {
          return { success: false, error: 'Merge files not cleaned up' };
        }
        
        return { 
          success: true, 
          details: `Cleanup completed with ${cleanupResult.actionsPerformed.length} actions` 
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Test error analysis and recovery suggestions
   */
  async testErrorAnalysis() {
    return await this.runTestCase('Error Analysis and Recovery Suggestions', async () => {
      try {
        const testErrors = [
          { message: 'Authentication failed', expectedType: 'authentication_failed' },
          { message: 'Connection timeout', expectedType: 'network_failure' },
          { message: 'Repository not found', expectedType: 'repository_not_found' },
          { message: 'Merge conflict detected', expectedType: 'merge_conflict' },
          { message: 'File too large for upload', expectedType: 'large_file_error' }
        ];
        
        let successCount = 0;
        
        for (const testError of testErrors) {
          const analysisResult = await this.recovery.analyzeAndRecover(
            new Error(testError.message), 
            'error-analysis-test'
          );
          
          if (analysisResult.success && analysisResult.errorType === testError.expectedType) {
            successCount++;
          }
        }
        
        if (successCount === testErrors.length) {
          return { 
            success: true, 
            details: `All ${testErrors.length} error types analyzed correctly` 
          };
        } else {
          return { 
            success: false, 
            error: `Only ${successCount}/${testErrors.length} error types analyzed correctly` 
          };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Test recovery log functionality
   */
  async testRecoveryLog() {
    return await this.runTestCase('Recovery Log Functionality', async () => {
      try {
        // Perform some operations to generate log entries
        await this.recovery.saveGitState('log-test');
        await this.recovery.cleanupPartialUpload('log-test');
        
        // Save recovery log
        const logPath = this.recovery.saveRecoveryLog('test-recovery-log.json');
        
        if (!logPath || !fs.existsSync(logPath)) {
          return { success: false, error: 'Recovery log not saved' };
        }
        
        // Verify log content
        const logContent = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        
        if (!logContent.recoveryLog || logContent.recoveryLog.length === 0) {
          return { success: false, error: 'Recovery log is empty' };
        }
        
        // Get recovery status
        const status = this.recovery.getRecoveryStatus();
        
        if (status.totalOperations === 0) {
          return { success: false, error: 'Recovery status shows no operations' };
        }
        
        return { 
          success: true, 
          details: `Log saved with ${status.totalOperations} operations` 
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Run all recovery tests
   */
  async runAllTests() {
    console.log('🚀 Starting GitHub Upload Recovery Tests');
    console.log('='.repeat(70));
    
    // Setup test environment
    const setupSuccess = await this.setupTestEnvironment();
    if (!setupSuccess) {
      console.error('❌ Failed to setup test environment, aborting tests');
      return false;
    }
    
    try {
      // Run all test cases
      await this.testGitStateSaveRestore();
      await this.testGitInitRollback();
      await this.testPartialUploadCleanup();
      await this.testErrorAnalysis();
      await this.testRecoveryLog();
      
      // Display test summary
      this.displayTestSummary();
      
      return this.getOverallTestResult();
    } finally {
      // Cleanup test environment
      await this.cleanupTestEnvironment();
    }
  }

  /**
   * Display test summary
   */
  displayTestSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(test => test.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, test) => sum + test.duration, 0);
    
    console.log(`\n📈 Overall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ❌`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`   Total Duration: ${totalDuration}ms`);
    
    console.log(`\n📋 Test Details:`);
    this.testResults.forEach((test, index) => {
      const status = test.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${test.name} (${test.duration}ms)`);
      if (test.error) {
        console.log(`      Error: ${test.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(70));
  }

  /**
   * Get overall test result
   */
  getOverallTestResult() {
    const failedTests = this.testResults.filter(test => !test.success);
    return failedTests.length === 0;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
GitHub Upload Recovery Test Script

Usage: node test-github-upload-recovery.js [options]

Options:
  --test-path <path>     Specify test directory path (default: ./test-recovery)
  --help                Show this help message

Examples:
  node test-github-upload-recovery.js
  node test-github-upload-recovery.js --test-path ./my-test-dir
    `);
    process.exit(0);
  }

  async function main() {
    let testPath = './test-recovery';
    
    // Parse options
    const testPathIndex = args.indexOf('--test-path');
    if (testPathIndex !== -1) {
      testPath = args[testPathIndex + 1];
    }
    
    const tester = new GitHubUploadRecoveryTester(testPath);
    
    try {
      const success = await tester.runAllTests();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  main().catch((error) => {
    console.error('❌ Fatal test error:', error.message);
    process.exit(1);
  });
}

module.exports = GitHubUploadRecoveryTester;