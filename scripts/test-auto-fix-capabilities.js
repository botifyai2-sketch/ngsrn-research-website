#!/usr/bin/env node

/**
 * Test Script for Automated Fix Capabilities
 * 
 * This script tests all the automated fix capabilities to ensure they work correctly.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoFixCapabilitiesTest {
  constructor() {
    this.projectRoot = process.cwd();
    this.testResults = [];
  }

  /**
   * Run all tests
   */
  async run() {
    console.log('🧪 Testing Automated Fix Capabilities\n');
    
    try {
      await this.testDiagnosticScript();
      await this.testAutoFixScript();
      await this.testTypeScriptConfigGenerator();
      await this.testTroubleshootingGuide();
      
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test diagnostic script
   */
  async testDiagnosticScript() {
    console.log('🔍 Testing diagnostic script...');
    
    try {
      // Test diagnostic script execution
      const result = execSync('node scripts/diagnose-deployment.js', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      this.testResults.push({
        test: 'Diagnostic Script Execution',
        status: 'PASS',
        details: 'Script executed successfully'
      });
      
    } catch (error) {
      // Diagnostic script may exit with non-zero code if issues are found
      if (error.stdout && error.stdout.includes('DEPLOYMENT DIAGNOSTIC REPORT')) {
        this.testResults.push({
          test: 'Diagnostic Script Execution',
          status: 'PASS',
          details: 'Script executed and generated report'
        });
      } else {
        this.testResults.push({
          test: 'Diagnostic Script Execution',
          status: 'FAIL',
          details: error.message
        });
      }
    }
    
    // Test diagnostic script exists and is readable
    const diagnosticPath = path.join(this.projectRoot, 'scripts', 'diagnose-deployment.js');
    if (fs.existsSync(diagnosticPath)) {
      this.testResults.push({
        test: 'Diagnostic Script File',
        status: 'PASS',
        details: 'File exists and is accessible'
      });
    } else {
      this.testResults.push({
        test: 'Diagnostic Script File',
        status: 'FAIL',
        details: 'File not found'
      });
    }
  }

  /**
   * Test auto-fix script
   */
  async testAutoFixScript() {
    console.log('🔧 Testing auto-fix script...');
    
    try {
      // Test auto-fix script execution
      const result = execSync('node scripts/auto-fix-deployment.js', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      this.testResults.push({
        test: 'Auto-Fix Script Execution',
        status: 'PASS',
        details: 'Script executed successfully'
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'Auto-Fix Script Execution',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test auto-fix script exists and is readable
    const autoFixPath = path.join(this.projectRoot, 'scripts', 'auto-fix-deployment.js');
    if (fs.existsSync(autoFixPath)) {
      this.testResults.push({
        test: 'Auto-Fix Script File',
        status: 'PASS',
        details: 'File exists and is accessible'
      });
    } else {
      this.testResults.push({
        test: 'Auto-Fix Script File',
        status: 'FAIL',
        details: 'File not found'
      });
    }
  }

  /**
   * Test TypeScript configuration generator
   */
  async testTypeScriptConfigGenerator() {
    console.log('📝 Testing TypeScript configuration generator...');
    
    try {
      // Test validation command
      const result = execSync('node scripts/typescript-config-generator.js validate', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      this.testResults.push({
        test: 'TypeScript Config Generator Validation',
        status: 'PASS',
        details: 'Validation executed successfully'
      });
      
    } catch (error) {
      this.testResults.push({
        test: 'TypeScript Config Generator Validation',
        status: 'FAIL',
        details: error.message
      });
    }
    
    // Test generator script exists
    const generatorPath = path.join(this.projectRoot, 'scripts', 'typescript-config-generator.js');
    if (fs.existsSync(generatorPath)) {
      this.testResults.push({
        test: 'TypeScript Config Generator File',
        status: 'PASS',
        details: 'File exists and is accessible'
      });
    } else {
      this.testResults.push({
        test: 'TypeScript Config Generator File',
        status: 'FAIL',
        details: 'File not found'
      });
    }
  }

  /**
   * Test troubleshooting guide
   */
  async testTroubleshootingGuide() {
    console.log('📚 Testing troubleshooting guide...');
    
    // Test troubleshooting guide exists
    const guidePath = path.join(this.projectRoot, 'DEPLOYMENT_TROUBLESHOOTING_GUIDE.md');
    if (fs.existsSync(guidePath)) {
      this.testResults.push({
        test: 'Troubleshooting Guide File',
        status: 'PASS',
        details: 'File exists and is accessible'
      });
      
      // Test guide content
      const content = fs.readFileSync(guidePath, 'utf8');
      
      const requiredSections = [
        'Quick Fix',
        'Common Issues and Solutions',
        'TypeScript Compilation Errors',
        'Diagnostic Commands',
        'Prevention Best Practices'
      ];
      
      const missingSections = requiredSections.filter(section => 
        !content.includes(section)
      );
      
      if (missingSections.length === 0) {
        this.testResults.push({
          test: 'Troubleshooting Guide Content',
          status: 'PASS',
          details: 'All required sections present'
        });
      } else {
        this.testResults.push({
          test: 'Troubleshooting Guide Content',
          status: 'FAIL',
          details: `Missing sections: ${missingSections.join(', ')}`
        });
      }
      
    } else {
      this.testResults.push({
        test: 'Troubleshooting Guide File',
        status: 'FAIL',
        details: 'File not found'
      });
    }
  }

  /**
   * Test package.json scripts integration
   */
  async testPackageScriptsIntegration() {
    console.log('📦 Testing package.json scripts integration...');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.testResults.push({
        test: 'Package.json Scripts Integration',
        status: 'FAIL',
        details: 'package.json not found'
      });
      return;
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};
      
      const requiredScripts = [
        'auto-fix',
        'diagnose',
        'fix:typescript-config',
        'validate:typescript-config'
      ];
      
      const missingScripts = requiredScripts.filter(script => !scripts[script]);
      
      if (missingScripts.length === 0) {
        this.testResults.push({
          test: 'Package.json Scripts Integration',
          status: 'PASS',
          details: 'All required scripts present'
        });
      } else {
        this.testResults.push({
          test: 'Package.json Scripts Integration',
          status: 'FAIL',
          details: `Missing scripts: ${missingScripts.join(', ')}`
        });
      }
      
    } catch (error) {
      this.testResults.push({
        test: 'Package.json Scripts Integration',
        status: 'FAIL',
        details: 'Invalid package.json syntax'
      });
    }
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 AUTOMATED FIX CAPABILITIES TEST REPORT');
    console.log('='.repeat(60));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (failedTests > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach((result, index) => {
          console.log(`\n   ${index + 1}. ${result.test}`);
          console.log(`      Details: ${result.details}`);
        });
    }
    
    console.log(`\n✅ Passed Tests:`);
    this.testResults
      .filter(r => r.status === 'PASS')
      .forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.test}`);
      });
    
    console.log('\n🚀 Automated Fix Capabilities Status:');
    
    if (failedTests === 0) {
      console.log('   ✅ All automated fix capabilities are working correctly!');
      console.log('   🎯 Ready for deployment troubleshooting automation');
    } else {
      console.log(`   ⚠️  ${failedTests} issue(s) need attention`);
      console.log('   🔧 Fix the failed tests before using automated capabilities');
    }
    
    console.log('\n📚 Available Commands:');
    console.log('   npm run auto-fix        - Automatically fix deployment issues');
    console.log('   npm run diagnose        - Diagnose deployment configuration');
    console.log('   npm run fix:typescript-config - Generate TypeScript configs');
    console.log('   npm run validate:typescript-config - Validate TypeScript configs');
    
    console.log('='.repeat(60));
    
    // Exit with appropriate code
    if (failedTests > 0) {
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new AutoFixCapabilitiesTest();
  tester.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = AutoFixCapabilitiesTest;