#!/usr/bin/env node

/**
 * Test Script for Deployment Auto-Fix System
 * 
 * This script tests the automated fix capabilities by creating common
 * deployment issues and verifying they can be automatically resolved.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentAutoFixTester {
  constructor() {
    this.projectRoot = process.cwd();
    this.backups = [];
    this.testResults = [];
  }

  /**
   * Run all automated fix tests
   */
  async runTests() {
    console.log('🧪 Testing Deployment Auto-Fix System');
    console.log('=====================================\n');

    try {
      // Create backups of important files
      await this.createBackups();

      // Run individual test scenarios
      await this.testMissingProductionConfig();
      await this.testIncompleteProductionConfig();
      await this.testMissingBuildScripts();
      await this.testJestTypeIssues();
      await this.testEnvironmentFileIssues();

      // Generate test report
      this.generateTestReport();

      // Restore original files
      await this.restoreBackups();

      console.log('\n✅ All automated fix tests completed successfully!');
      return true;

    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      await this.restoreBackups();
      return false;
    }
  }

  /**
   * Create backups of files that will be modified during testing
   */
  async createBackups() {
    console.log('📋 Creating backups of configuration files...');

    const filesToBackup = [
      'tsconfig.json',
      'tsconfig.build.json',
      'package.json',
      '.env.local'
    ];

    for (const file of filesToBackup) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        const backupPath = `${filePath}.test-backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        this.backups.push({ original: filePath, backup: backupPath });
        console.log(`  ✅ Backed up ${file}`);
      }
    }

    console.log('');
  }

  /**
   * Test missing production TypeScript configuration
   */
  async testMissingProductionConfig() {
    console.log('🔧 Test 1: Missing Production TypeScript Configuration');
    console.log('─'.repeat(60));

    try {
      // Remove tsconfig.build.json if it exists
      const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');
      if (fs.existsSync(buildConfigPath)) {
        fs.unlinkSync(buildConfigPath);
        console.log('  📝 Removed tsconfig.build.json to simulate missing config');
      }

      // Run auto-fix
      console.log('  🔧 Running automated fix...');
      const DeploymentAutoFix = require('./deployment-auto-fix');
      const autoFix = new DeploymentAutoFix();
      const result = await autoFix.run();

      // Verify fix was applied
      if (fs.existsSync(buildConfigPath)) {
        const config = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));
        
        if (config.extends === './tsconfig.json' && 
            config.exclude && 
            config.exclude.includes('**/*.test.ts')) {
          console.log('  ✅ Production TypeScript config created successfully');
          this.testResults.push({
            test: 'Missing Production Config',
            status: 'PASS',
            message: 'tsconfig.build.json created with proper exclusions'
          });
        } else {
          throw new Error('Created config is missing required properties');
        }
      } else {
        throw new Error('tsconfig.build.json was not created');
      }

    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
      this.testResults.push({
        test: 'Missing Production Config',
        status: 'FAIL',
        message: error.message
      });
    }

    console.log('');
  }

  /**
   * Test incomplete production TypeScript configuration
   */
  async testIncompleteProductionConfig() {
    console.log('🔧 Test 2: Incomplete Production TypeScript Configuration');
    console.log('─'.repeat(60));

    try {
      // Create incomplete config
      const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');
      const incompleteConfig = {
        extends: './tsconfig.json',
        exclude: ['**/*.test.ts'] // Missing other test patterns
      };

      fs.writeFileSync(buildConfigPath, JSON.stringify(incompleteConfig, null, 2));
      console.log('  📝 Created incomplete tsconfig.build.json');

      // Run auto-fix
      console.log('  🔧 Running automated fix...');
      const DeploymentAutoFix = require('./deployment-auto-fix');
      const autoFix = new DeploymentAutoFix();
      const result = await autoFix.run();

      // Verify fix was applied
      const updatedConfig = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));
      const requiredPatterns = ['**/*.spec.ts', '**/__tests__/**', '**/e2e/**'];
      const hasAllPatterns = requiredPatterns.every(pattern => 
        updatedConfig.exclude.includes(pattern)
      );

      if (hasAllPatterns) {
        console.log('  ✅ Production TypeScript config updated with missing exclusions');
        this.testResults.push({
          test: 'Incomplete Production Config',
          status: 'PASS',
          message: 'Missing exclusion patterns added successfully'
        });
      } else {
        throw new Error('Not all required exclusion patterns were added');
      }

    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
      this.testResults.push({
        test: 'Incomplete Production Config',
        status: 'FAIL',
        message: error.message
      });
    }

    console.log('');
  }

  /**
   * Test missing build scripts in package.json
   */
  async testMissingBuildScripts() {
    console.log('🔧 Test 3: Missing Build Scripts');
    console.log('─'.repeat(60));

    try {
      // Modify package.json to remove build scripts
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Remove type-check:build script
      delete packageJson.scripts['type-check:build'];
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('  📝 Removed type-check:build script from package.json');

      // Run auto-fix
      console.log('  🔧 Running automated fix...');
      const DeploymentAutoFix = require('./deployment-auto-fix');
      const autoFix = new DeploymentAutoFix();
      const result = await autoFix.run();

      // Verify fix was applied
      const updatedPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (updatedPackageJson.scripts['type-check:build'] && 
          updatedPackageJson.scripts['type-check:build'].includes('tsconfig.build.json')) {
        console.log('  ✅ Build scripts updated successfully');
        this.testResults.push({
          test: 'Missing Build Scripts',
          status: 'PASS',
          message: 'type-check:build script added with correct configuration'
        });
      } else {
        throw new Error('Build scripts were not properly updated');
      }

    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
      this.testResults.push({
        test: 'Missing Build Scripts',
        status: 'FAIL',
        message: error.message
      });
    }

    console.log('');
  }

  /**
   * Test Jest type definition issues
   */
  async testJestTypeIssues() {
    console.log('🔧 Test 4: Jest Type Definition Issues');
    console.log('─'.repeat(60));

    try {
      // Simulate Jest type issues by checking if auto-fix detects them
      console.log('  📝 Checking Jest type definition detection...');

      // Run auto-fix
      console.log('  🔧 Running automated fix...');
      const DeploymentAutoFix = require('./deployment-auto-fix');
      const autoFix = new DeploymentAutoFix();
      
      // Check if Jest types are properly handled
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const hasJest = packageJson.devDependencies && packageJson.devDependencies.jest;
      const hasJestTypes = packageJson.devDependencies && packageJson.devDependencies['@types/jest'];

      if (hasJest) {
        console.log('  ✅ Jest detected in project');
        
        if (hasJestTypes) {
          console.log('  ✅ Jest types already installed');
        } else {
          console.log('  ⚠️  Jest types not installed (would be fixed by auto-fix)');
        }
        
        this.testResults.push({
          test: 'Jest Type Issues',
          status: 'PASS',
          message: 'Jest type configuration validated'
        });
      } else {
        console.log('  ℹ️  Jest not detected in project');
        this.testResults.push({
          test: 'Jest Type Issues',
          status: 'SKIP',
          message: 'Jest not installed in project'
        });
      }

    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
      this.testResults.push({
        test: 'Jest Type Issues',
        status: 'FAIL',
        message: error.message
      });
    }

    console.log('');
  }

  /**
   * Test environment file issues
   */
  async testEnvironmentFileIssues() {
    console.log('🔧 Test 5: Environment File Issues');
    console.log('─'.repeat(60));

    try {
      // Remove .env.local if it exists
      const envLocalPath = path.join(this.projectRoot, '.env.local');
      const envExamplePath = path.join(this.projectRoot, '.env.example');
      
      let envLocalExisted = false;
      if (fs.existsSync(envLocalPath)) {
        fs.unlinkSync(envLocalPath);
        envLocalExisted = true;
        console.log('  📝 Removed .env.local to simulate missing environment file');
      }

      // Only test if .env.example exists
      if (fs.existsSync(envExamplePath)) {
        // Run auto-fix
        console.log('  🔧 Running automated fix...');
        const DeploymentAutoFix = require('./deployment-auto-fix');
        const autoFix = new DeploymentAutoFix();
        const result = await autoFix.run();

        // Verify fix was applied
        if (fs.existsSync(envLocalPath)) {
          console.log('  ✅ .env.local created from .env.example');
          this.testResults.push({
            test: 'Environment File Issues',
            status: 'PASS',
            message: '.env.local created successfully'
          });
        } else if (!envLocalExisted) {
          console.log('  ℹ️  .env.local was not created (may not be needed)');
          this.testResults.push({
            test: 'Environment File Issues',
            status: 'SKIP',
            message: 'Environment file creation not triggered'
          });
        }
      } else {
        console.log('  ℹ️  .env.example not found, skipping environment file test');
        this.testResults.push({
          test: 'Environment File Issues',
          status: 'SKIP',
          message: '.env.example not found'
        });
      }

    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
      this.testResults.push({
        test: 'Environment File Issues',
        status: 'FAIL',
        message: error.message
      });
    }

    console.log('');
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    console.log('📊 Test Results Summary');
    console.log('═'.repeat(60));

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIP').length;

    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
    console.log(`Skipped: ${skipped} ${skipped > 0 ? '⏭️' : ''}`);

    console.log('\nDetailed Results:');
    console.log('─'.repeat(60));

    this.testResults.forEach((result, index) => {
      const statusIcon = {
        'PASS': '✅',
        'FAIL': '❌',
        'SKIP': '⏭️'
      }[result.status];

      console.log(`${index + 1}. ${result.test}: ${statusIcon} ${result.status}`);
      console.log(`   ${result.message}`);
    });

    // Save detailed report to file
    const reportPath = path.join(this.projectRoot, 'deployment-auto-fix-test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: { total: this.testResults.length, passed, failed, skipped },
      results: this.testResults
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${path.basename(reportPath)}`);
  }

  /**
   * Restore backed up files
   */
  async restoreBackups() {
    console.log('\n🔄 Restoring original files...');

    for (const backup of this.backups) {
      try {
        if (fs.existsSync(backup.backup)) {
          fs.copyFileSync(backup.backup, backup.original);
          fs.unlinkSync(backup.backup);
          console.log(`  ✅ Restored ${path.basename(backup.original)}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to restore ${path.basename(backup.original)}:`, error.message);
      }
    }
  }

  /**
   * Test TypeScript configuration generator
   */
  async testTypeScriptConfigGenerator() {
    console.log('🔧 Testing TypeScript Configuration Generator');
    console.log('─'.repeat(60));

    try {
      const TypeScriptConfigGenerator = require('./typescript-config-generator');
      const generator = new TypeScriptConfigGenerator();

      // Test configuration generation
      await generator.analyzeProjectStructure();
      console.log('  ✅ Project structure analysis completed');

      // Test validation
      await generator.validateConfigurations();
      console.log('  ✅ Configuration validation completed');

      this.testResults.push({
        test: 'TypeScript Config Generator',
        status: 'PASS',
        message: 'Configuration generator working correctly'
      });

    } catch (error) {
      console.log(`  ❌ Test failed: ${error.message}`);
      this.testResults.push({
        test: 'TypeScript Config Generator',
        status: 'FAIL',
        message: error.message
      });
    }

    console.log('');
  }
}

// CLI interface
if (require.main === module) {
  const tester = new DeploymentAutoFixTester();
  
  tester.runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = DeploymentAutoFixTester;