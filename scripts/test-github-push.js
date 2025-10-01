#!/usr/bin/env node

/**
 * Test script for GitHub Push Handler
 * Tests the push functionality with various scenarios
 */

const GitHubPushHandler = require('./github-push');
const path = require('path');

class GitHubPushTester {
  constructor() {
    this.pushHandler = new GitHubPushHandler();
  }

  /**
   * Test basic push functionality
   */
  async testBasicPush() {
    console.log('🧪 Testing basic push functionality...\n');
    
    try {
      const result = await this.pushHandler.pushToRepository({
        skipChecks: false,
        setUpstream: true
      });
      
      if (result.success) {
        console.log('✅ Basic push test passed');
        console.log(`   Branch: ${result.branch}`);
        console.log(`   Remote: ${result.remote}`);
        console.log(`   Attempts: ${result.attempt}`);
      } else {
        console.log('❌ Basic push test failed');
        console.log(`   Error: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Basic push test error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test push with specific branch
   */
  async testBranchPush(branch = 'main') {
    console.log(`🧪 Testing push to specific branch: ${branch}...\n`);
    
    try {
      const result = await this.pushHandler.pushToRepository({
        branch,
        setUpstream: true
      });
      
      if (result.success) {
        console.log(`✅ Branch push test passed for ${branch}`);
      } else {
        console.log(`❌ Branch push test failed for ${branch}`);
        console.log(`   Error: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Branch push test error for ${branch}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test quick push functionality
   */
  async testQuickPush() {
    console.log('🧪 Testing quick push functionality...\n');
    
    try {
      const result = await this.pushHandler.quickPush();
      
      if (result.success) {
        console.log('✅ Quick push test passed');
      } else {
        console.log('❌ Quick push test failed');
        console.log(`   Error: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Quick push test error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test pre-flight checks
   */
  testPreflightChecks() {
    console.log('🧪 Testing pre-flight checks...\n');
    
    const results = {
      gitRepository: false,
      remoteExists: false,
      currentBranch: null,
      remoteUrl: null,
      uncommittedChanges: false
    };
    
    try {
      // Test Git repository check
      results.gitRepository = this.pushHandler.isGitRepository();
      console.log(`   Git repository: ${results.gitRepository ? '✅' : '❌'}`);
      
      // Test remote exists check
      results.remoteExists = this.pushHandler.checkRemoteExists('origin');
      console.log(`   Remote exists: ${results.remoteExists ? '✅' : '❌'}`);
      
      // Test current branch
      results.currentBranch = this.pushHandler.getCurrentBranch();
      console.log(`   Current branch: ${results.currentBranch}`);
      
      // Test remote URL
      results.remoteUrl = this.pushHandler.getRemoteUrl('origin');
      console.log(`   Remote URL: ${results.remoteUrl || 'Not configured'}`);
      
      // Test uncommitted changes
      results.uncommittedChanges = this.pushHandler.hasUncommittedChanges();
      console.log(`   Uncommitted changes: ${results.uncommittedChanges ? '⚠️  Yes' : '✅ No'}`);
      
      console.log('\n✅ Pre-flight checks completed');
      return results;
    } catch (error) {
      console.error('❌ Pre-flight checks error:', error.message);
      return { ...results, error: error.message };
    }
  }

  /**
   * Run comprehensive test suite
   */
  async runTestSuite() {
    console.log('🚀 Starting GitHub Push Handler Test Suite\n');
    console.log('=' .repeat(50));
    
    const testResults = {
      preflightChecks: null,
      basicPush: null,
      branchPush: null,
      quickPush: null
    };
    
    // Test 1: Pre-flight checks
    console.log('\n📋 Test 1: Pre-flight Checks');
    console.log('-'.repeat(30));
    testResults.preflightChecks = this.testPreflightChecks();
    
    // Only proceed with push tests if basic setup is valid
    if (testResults.preflightChecks.gitRepository && testResults.preflightChecks.remoteExists) {
      // Test 2: Basic push
      console.log('\n📤 Test 2: Basic Push');
      console.log('-'.repeat(30));
      testResults.basicPush = await this.testBasicPush();
      
      // Test 3: Branch-specific push
      console.log('\n🌿 Test 3: Branch-Specific Push');
      console.log('-'.repeat(30));
      testResults.branchPush = await this.testBranchPush('main');
      
      // Test 4: Quick push
      console.log('\n⚡ Test 4: Quick Push');
      console.log('-'.repeat(30));
      testResults.quickPush = await this.testQuickPush();
    } else {
      console.log('\n⚠️  Skipping push tests - repository not properly configured');
      console.log('   Please ensure you are in a Git repository with a configured remote');
    }
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('=' .repeat(50));
    
    const passedTests = [];
    const failedTests = [];
    
    if (testResults.preflightChecks && !testResults.preflightChecks.error) {
      passedTests.push('Pre-flight Checks');
    } else {
      failedTests.push('Pre-flight Checks');
    }
    
    if (testResults.basicPush && testResults.basicPush.success) {
      passedTests.push('Basic Push');
    } else if (testResults.basicPush) {
      failedTests.push('Basic Push');
    }
    
    if (testResults.branchPush && testResults.branchPush.success) {
      passedTests.push('Branch Push');
    } else if (testResults.branchPush) {
      failedTests.push('Branch Push');
    }
    
    if (testResults.quickPush && testResults.quickPush.success) {
      passedTests.push('Quick Push');
    } else if (testResults.quickPush) {
      failedTests.push('Quick Push');
    }
    
    console.log(`✅ Passed: ${passedTests.length} tests`);
    if (passedTests.length > 0) {
      passedTests.forEach(test => console.log(`   • ${test}`));
    }
    
    console.log(`❌ Failed: ${failedTests.length} tests`);
    if (failedTests.length > 0) {
      failedTests.forEach(test => console.log(`   • ${test}`));
    }
    
    const totalTests = passedTests.length + failedTests.length;
    const successRate = totalTests > 0 ? Math.round((passedTests.length / totalTests) * 100) : 0;
    
    console.log(`\n📈 Success Rate: ${successRate}%`);
    
    if (successRate === 100) {
      console.log('🎉 All tests passed! GitHub Push Handler is working correctly.');
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
GitHub Push Handler Test Script

Usage: node test-github-push.js [command] [options]

Commands:
  suite                   Run complete test suite (default)
  preflight              Run only pre-flight checks
  basic                  Test basic push functionality
  branch <name>          Test push to specific branch
  quick                  Test quick push functionality

Options:
  --help                 Show this help message

Examples:
  node test-github-push.js suite
  node test-github-push.js preflight
  node test-github-push.js basic
  node test-github-push.js branch main
  node test-github-push.js quick
    `);
    process.exit(0);
  }

  async function main() {
    const command = args[0] || 'suite';
    const tester = new GitHubPushTester();

    try {
      switch (command) {
        case 'suite':
          await tester.runTestSuite();
          break;
        case 'preflight':
          tester.testPreflightChecks();
          break;
        case 'basic':
          await tester.testBasicPush();
          break;
        case 'branch':
          const branch = args[1] || 'main';
          await tester.testBranchPush(branch);
          break;
        case 'quick':
          await tester.testQuickPush();
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

module.exports = GitHubPushTester;