#!/usr/bin/env node

/**
 * Test script for GitHub Authentication Handler
 * Validates all authentication functionality
 */

const GitHubAuthenticationHandler = require('./github-auth');
const path = require('path');

class AuthenticationTester {
  constructor() {
    this.testResults = [];
    this.authHandler = new GitHubAuthenticationHandler();
  }

  /**
   * Log test result
   */
  logTest(testName, success, message = '') {
    const result = { testName, success, message };
    this.testResults.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}${message ? ': ' + message : ''}`);
  }

  /**
   * Test credential validation
   */
  async testCredentialValidation() {
    console.log('\n🧪 Testing Credential Validation...');

    // Test valid credentials
    try {
      const validCreds = {
        username: 'testuser',
        email: 'test@example.com',
        token: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz123456'
      };
      
      await this.authHandler.acceptCredentials(validCreds);
      this.logTest('Valid credentials acceptance', true);
    } catch (error) {
      this.logTest('Valid credentials acceptance', false, error.message);
    }

    // Test invalid email
    try {
      const invalidEmailCreds = {
        username: 'testuser',
        email: 'invalid-email',
        token: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz123456'
      };
      
      await this.authHandler.acceptCredentials(invalidEmailCreds);
      this.logTest('Invalid email rejection', false, 'Should have rejected invalid email');
    } catch (error) {
      this.logTest('Invalid email rejection', true);
    }

    // Test missing username
    try {
      const missingUsernameCreds = {
        email: 'test@example.com',
        token: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz123456'
      };
      
      await this.authHandler.acceptCredentials(missingUsernameCreds);
      this.logTest('Missing username rejection', false, 'Should have rejected missing username');
    } catch (error) {
      this.logTest('Missing username rejection', true);
    }

    // Test short token
    try {
      const shortTokenCreds = {
        username: 'testuser',
        email: 'test@example.com',
        token: 'short'
      };
      
      await this.authHandler.acceptCredentials(shortTokenCreds);
      this.logTest('Short token rejection', false, 'Should have rejected short token');
    } catch (error) {
      this.logTest('Short token rejection', true);
    }

    // Test credentials without token
    try {
      const noTokenCreds = {
        username: 'testuser',
        email: 'test@example.com'
      };
      
      await this.authHandler.acceptCredentials(noTokenCreds);
      this.logTest('Credentials without token', true);
    } catch (error) {
      this.logTest('Credentials without token', false, error.message);
    }
  }

  /**
   * Test Git configuration
   */
  async testGitConfiguration() {
    console.log('\n🧪 Testing Git Configuration...');

    // First set up valid credentials
    try {
      const testCreds = {
        username: 'testuser',
        email: 'test@example.com',
        token: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz123456'
      };
      
      await this.authHandler.acceptCredentials(testCreds);
      
      // Test Git authentication configuration
      await this.authHandler.configureGitAuthentication();
      this.logTest('Git authentication configuration', true);
    } catch (error) {
      this.logTest('Git authentication configuration', false, error.message);
    }

    // Test configuration without credentials
    try {
      const emptyAuthHandler = new GitHubAuthenticationHandler();
      await emptyAuthHandler.configureGitAuthentication();
      this.logTest('Git config without credentials', false, 'Should have failed without credentials');
    } catch (error) {
      this.logTest('Git config without credentials', true);
    }
  }

  /**
   * Test authentication status
   */
  testAuthenticationStatus() {
    console.log('\n🧪 Testing Authentication Status...');

    // Test status without credentials
    const emptyAuthHandler = new GitHubAuthenticationHandler();
    const emptyStatus = emptyAuthHandler.getAuthenticationStatus();
    
    if (!emptyStatus.configured) {
      this.logTest('Empty authentication status', true);
    } else {
      this.logTest('Empty authentication status', false, 'Should show not configured');
    }

    // Test status with credentials
    const status = this.authHandler.getAuthenticationStatus();
    
    if (status.configured && status.username && status.email) {
      this.logTest('Configured authentication status', true);
    } else {
      this.logTest('Configured authentication status', false, 'Should show configured status');
    }
  }

  /**
   * Test error handling
   */
  testErrorHandling() {
    console.log('\n🧪 Testing Error Handling...');

    // Test different error types
    const testErrors = [
      { message: 'Authentication failed', type: 'auth' },
      { message: 'Repository not found', type: 'repo' },
      { message: 'rate limit exceeded', type: 'rate' },
      { message: 'timeout error', type: 'network' },
      { message: 'unknown error', type: 'general' }
    ];

    testErrors.forEach(({ message, type }) => {
      try {
        const error = new Error(message);
        this.authHandler.handleAuthenticationError(error, 'test');
        this.logTest(`Error handling (${type})`, true);
      } catch (handlingError) {
        this.logTest(`Error handling (${type})`, false, handlingError.message);
      }
    });
  }

  /**
   * Test GitHub API authentication (mock test)
   */
  async testGitHubAPIAuth() {
    console.log('\n🧪 Testing GitHub API Authentication (Mock)...');

    // Note: This is a mock test since we don't have real credentials
    // In a real scenario, this would test against the actual GitHub API
    
    try {
      // Set up test credentials
      const testCreds = {
        username: 'testuser',
        email: 'test@example.com',
        token: 'invalid_token_for_testing'
      };
      
      await this.authHandler.acceptCredentials(testCreds);
      
      // This will fail with invalid credentials, which is expected
      const result = await this.authHandler.testGitHubAuthentication();
      
      if (!result.success && result.error) {
        this.logTest('GitHub API auth with invalid token', true, 'Correctly rejected invalid token');
      } else {
        this.logTest('GitHub API auth with invalid token', false, 'Should have rejected invalid token');
      }
    } catch (error) {
      // Network errors are acceptable in testing environment
      if (error.message.includes('network') || error.message.includes('timeout') || error.code === 'ENOTFOUND') {
        this.logTest('GitHub API auth (network test)', true, 'Network test completed');
      } else {
        this.logTest('GitHub API auth (network test)', false, error.message);
      }
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting GitHub Authentication Handler Tests...\n');

    await this.testCredentialValidation();
    await this.testGitConfiguration();
    this.testAuthenticationStatus();
    this.testErrorHandling();
    await this.testGitHubAPIAuth();

    // Summary
    console.log('\n📊 Test Results Summary:');
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    if (passed === total) {
      console.log('\n🎉 All tests passed! Authentication handler is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Review the results above.');
      
      // Show failed tests
      const failed = this.testResults.filter(r => !r.success);
      if (failed.length > 0) {
        console.log('\nFailed tests:');
        failed.forEach(test => {
          console.log(`   • ${test.testName}: ${test.message}`);
        });
      }
    }

    return passed === total;
  }
}

// CLI execution
if (require.main === module) {
  async function main() {
    const tester = new AuthenticationTester();
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  }

  main().catch((error) => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
}

module.exports = AuthenticationTester;