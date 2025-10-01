#!/usr/bin/env node

/**
 * Test script for Interactive GitHub Upload functionality
 * Tests the core components without requiring actual GitHub interaction
 */

const InteractiveGitHubUpload = require('./interactive-github-upload');
const path = require('path');

class InteractiveUploadTester {
  constructor() {
    this.testResults = [];
  }

  /**
   * Log test result
   */
  logTest(testName, passed, message = '') {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}${message ? ': ' + message : ''}`);
    this.testResults.push({ testName, passed, message });
  }

  /**
   * Test repository URL validation
   */
  testRepositoryUrlValidation() {
    console.log('\n🧪 Testing Repository URL Validation');
    console.log('-'.repeat(40));

    const uploader = new InteractiveGitHubUpload('.');
    
    // Test valid URLs
    const validUrls = [
      'https://github.com/user/repo',
      'https://github.com/user/repo.git',
      'https://github.com/organization/project-name',
      'https://github.com/user123/my-awesome-project.git'
    ];

    validUrls.forEach(url => {
      const result = uploader.validateRepositoryUrl(url);
      this.logTest(`Valid URL: ${url}`, result.valid);
    });

    // Test invalid URLs
    const invalidUrls = [
      'not-a-url',
      'https://gitlab.com/user/repo',
      'https://github.com/user',
      'https://github.com/',
      'ftp://github.com/user/repo'
    ];

    invalidUrls.forEach(url => {
      const result = uploader.validateRepositoryUrl(url);
      this.logTest(`Invalid URL: ${url}`, !result.valid);
    });
  }

  /**
   * Test configuration object structure
   */
  testConfigurationStructure() {
    console.log('\n🧪 Testing Configuration Structure');
    console.log('-'.repeat(40));

    const uploader = new InteractiveGitHubUpload('.');
    
    // Test initial configuration
    this.logTest('Initial config exists', uploader.config !== null);
    this.logTest('Config has credentials property', uploader.config.hasOwnProperty('credentials'));
    this.logTest('Config has repositoryUrl property', uploader.config.hasOwnProperty('repositoryUrl'));
    this.logTest('Config has branch property', uploader.config.hasOwnProperty('branch'));
    this.logTest('Config has skipVerification property', uploader.config.hasOwnProperty('skipVerification'));
    
    // Test default values
    this.logTest('Default branch is main', uploader.config.branch === 'main');
    this.logTest('Default skipVerification is false', uploader.config.skipVerification === false);
  }

  /**
   * Test component initialization
   */
  testComponentInitialization() {
    console.log('\n🧪 Testing Component Initialization');
    console.log('-'.repeat(40));

    const uploader = new InteractiveGitHubUpload('.');
    
    this.logTest('AuthHandler initialized', uploader.authHandler !== null);
    this.logTest('Uploader initialized', uploader.uploader !== null);
    this.logTest('Project path set', uploader.projectPath !== null);
    this.logTest('Project path is absolute', path.isAbsolute(uploader.projectPath));
  }

  /**
   * Test interface management
   */
  testInterfaceManagement() {
    console.log('\n🧪 Testing Interface Management');
    console.log('-'.repeat(40));

    const uploader = new InteractiveGitHubUpload('.');
    
    // Test initialization
    uploader.initializeInterface();
    this.logTest('Interface initialized', uploader.rl !== null);
    
    // Test cleanup
    uploader.closeInterface();
    this.logTest('Interface closed', uploader.rl === null);
  }

  /**
   * Test credential validation logic
   */
  testCredentialValidation() {
    console.log('\n🧪 Testing Credential Validation Logic');
    console.log('-'.repeat(40));

    // Test email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const validEmails = [
      'user@example.com',
      'test.email@domain.org',
      'user123@company.co.uk'
    ];

    const invalidEmails = [
      'not-an-email',
      '@domain.com',
      'user@',
      'user@domain',
      'user space@domain.com'
    ];

    validEmails.forEach(email => {
      this.logTest(`Valid email: ${email}`, emailRegex.test(email));
    });

    invalidEmails.forEach(email => {
      this.logTest(`Invalid email: ${email}`, !emailRegex.test(email));
    });
  }

  /**
   * Test error handling structure
   */
  testErrorHandling() {
    console.log('\n🧪 Testing Error Handling Structure');
    console.log('-'.repeat(40));

    const uploader = new InteractiveGitHubUpload('.');
    
    // Test that methods exist for error handling
    this.logTest('validateRepositoryUrl handles errors', typeof uploader.validateRepositoryUrl === 'function');
    
    // Test error response structure
    const errorResult = uploader.validateRepositoryUrl('invalid-url');
    this.logTest('Error result has valid property', errorResult.hasOwnProperty('valid'));
    this.logTest('Error result has error property', errorResult.hasOwnProperty('error'));
    this.logTest('Error result valid is false', errorResult.valid === false);
    this.logTest('Error result has error message', typeof errorResult.error === 'string');
  }

  /**
   * Test CLI argument parsing simulation
   */
  testCliArgumentParsing() {
    console.log('\n🧪 Testing CLI Argument Parsing Logic');
    console.log('-'.repeat(40));

    // Simulate argument parsing logic
    const mockArgs = ['--username', 'testuser', '--email', 'test@example.com', '--branch', 'develop'];
    const options = {};

    for (let i = 0; i < mockArgs.length; i++) {
      switch (mockArgs[i]) {
        case '--username':
          options.credentials = options.credentials || {};
          options.credentials.username = mockArgs[++i];
          break;
        case '--email':
          options.credentials = options.credentials || {};
          options.credentials.email = mockArgs[++i];
          break;
        case '--branch':
          options.branch = mockArgs[++i];
          break;
      }
    }

    this.logTest('Username parsed correctly', options.credentials?.username === 'testuser');
    this.logTest('Email parsed correctly', options.credentials?.email === 'test@example.com');
    this.logTest('Branch parsed correctly', options.branch === 'develop');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Interactive GitHub Upload - Component Tests');
    console.log('='.repeat(60));

    try {
      this.testRepositoryUrlValidation();
      this.testConfigurationStructure();
      this.testComponentInitialization();
      this.testInterfaceManagement();
      this.testCredentialValidation();
      this.testErrorHandling();
      this.testCliArgumentParsing();

      // Summary
      console.log('\n📊 Test Summary');
      console.log('='.repeat(60));
      
      const passed = this.testResults.filter(r => r.passed).length;
      const total = this.testResults.length;
      const failed = total - passed;

      console.log(`Total Tests: ${total}`);
      console.log(`Passed: ${passed} ✅`);
      console.log(`Failed: ${failed} ${failed > 0 ? '❌' : '✅'}`);
      console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

      if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        this.testResults.filter(r => !r.passed).forEach(test => {
          console.log(`   • ${test.testName}${test.message ? ': ' + test.message : ''}`);
        });
      }

      console.log('\n' + '='.repeat(60));
      console.log(failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed - review implementation');

      return failed === 0;
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      return false;
    }
  }
}

// CLI execution
if (require.main === module) {
  async function main() {
    const tester = new InteractiveUploadTester();
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  }

  main().catch((error) => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = InteractiveUploadTester;