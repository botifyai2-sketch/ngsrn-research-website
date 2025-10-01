#!/usr/bin/env node

/**
 * Test script for Git Repository Setup
 * 
 * This script tests the Git repository initialization and configuration functionality
 */

const GitRepositoryManager = require('./git-repository-setup');
const assert = require('assert');

async function runTests() {
  console.log('🧪 Running Git Repository Setup Tests...\n');

  const manager = new GitRepositoryManager();
  let testsPassed = 0;
  let testsTotal = 0;

  function test(name, testFn) {
    testsTotal++;
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ ${name}`);
        testsPassed++;
      } else {
        console.log(`❌ ${name} - Test returned false`);
      }
    } catch (error) {
      console.log(`❌ ${name} - ${error.message}`);
    }
  }

  // Test 1: Repository initialization check
  test('Repository is initialized', () => {
    return manager.isGitInitialized();
  });

  // Test 2: User configuration check
  test('User name is configured', () => {
    const userName = manager.getCurrentUserName();
    return userName && userName.length > 0;
  });

  // Test 3: User email is configured
  test('User email is configured', () => {
    const userEmail = manager.getCurrentUserEmail();
    return userEmail && userEmail.includes('@');
  });

  // Test 4: Repository status retrieval
  test('Repository status can be retrieved', () => {
    const status = manager.getRepositoryStatus();
    return status && typeof status === 'object';
  });

  // Test 5: Repository validation
  test('Repository validation passes', () => {
    return manager.validateRepository();
  });

  // Test 6: Setup with existing configuration
  test('Setup with existing configuration', async () => {
    const result = await manager.setupRepository();
    return result === true;
  });

  console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All tests passed!');
    return true;
  } else {
    console.log('❌ Some tests failed');
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = runTests;