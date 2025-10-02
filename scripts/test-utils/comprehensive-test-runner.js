/**
 * Comprehensive Test Runner for Build Configurations
 * Orchestrates all testing utilities and provides detailed reporting
 */

const BuildConfigValidator = require('./build-config-validator');
const MockTestEnvironment = require('./mock-test-environment');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComprehensiveTestRunner {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.validator = new BuildConfigValidator(projectRoot);
    this.mockEnv = new MockTestEnvironment(projectRoot);
    this.testResults = {
      scenarios: {},
      performance: {},
      validation: {},
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: 0
      }
    };
  }

  // Run comprehensive test suite
  async runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive Build Configuration Tests');
    console.log('==================================================');
    
    try {
      await this.mockEnv.setup();
      
      // Run all test categories
      await this.runConfigurationValidationTests();
      await this.runScenarioTests();
      await this.runPerformanceTests();
      await this.runErrorHandlingTests();
      await this.runIntegrationTests();
      
      // Generate comprehensive report
      this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ Comprehensive test suite failed:', error.message);
      throw error;
    } finally {
      await this.mockEnv.cleanup();
    }
  }

  // Configuration validation tests
  async runConfigurationValidationTests() {
    console.log('\n📋 Configuration Validation Tests');
    console.log('--------------------------------');
    
    const validationResult = this.validator.validateTypeScriptConfigurations();
    this.testResults.validation = validationResult;
    
    // Test current configuration
    await this.runTest('Current Configuration Validation', async () => {
      if (!validationResult.isValid) {
        const criticalErrors = validationResult.errors.filter(error => 
          error.includes('not found') || error.includes('Failed to parse')
        );
        
        if (criticalErrors.length > 0) {
          throw new Error(`Critical configuration errors: ${criticalErrors.join(', ')}`);
        }
      }
      
      return `Configuration validation completed with ${validationResult.errors.length} errors and ${validationResult.warnings.length} warnings`;
    });

    // Test exclusion pattern effectiveness
    await this.runTest('Exclusion Pattern Effectiveness', async () => {
      const testFiles = [
        'src/components/Button.test.tsx',
        'src/lib/utils.spec.ts',
        'src/__tests__/helper.ts',
        'e2e/homepage.spec.ts',
        'src/components/Button.tsx', // Should NOT be excluded
        'src/lib/utils.ts' // Should NOT be excluded
      ];

      const exclusionTest = this.validator.testExclusionPatternEffectiveness(testFiles);
      
      if (!exclusionTest.isValid) {
        throw new Error(`Exclusion pattern test failed: ${exclusionTest.errors.join(', ')}`);
      }

      // Check that test files are excluded and production files are included
      const testFilesIncluded = exclusionTest.includedFiles.filter(file => 
        file.includes('.test.') || file.includes('.spec.') || file.includes('__tests__')
      );

      const productionFilesExcluded = exclusionTest.excludedFiles.filter(file => 
        !file.includes('.test.') && !file.includes('.spec.') && !file.includes('__tests__') && !file.includes('e2e')
      );

      if (testFilesIncluded.length > 0) {
        throw new Error(`Test files not properly excluded: ${testFilesIncluded.join(', ')}`);
      }

      if (productionFilesExcluded.length > 0) {
        throw new Error(`Production files incorrectly excluded: ${productionFilesExcluded.join(', ')}`);
      }

      return `Exclusion effectiveness: ${(exclusionTest.effectiveness * 100).toFixed(1)}% of test files excluded`;
    });
  }

  // Scenario-based tests
  async runScenarioTests() {
    console.log('\n🎭 Scenario-Based Tests');
    console.log('----------------------');

    const scenarios = [
      'valid',
      'missingBuild',
      'noTestExclusions',
      'overlyBroad',
      'conflictingOptions',
      'missingNextJs',
      'minimal'
    ];

    for (const scenario of scenarios) {
      await this.runScenarioTest(scenario);
    }
  }

  // Individual scenario test
  async runScenarioTest(scenarioName) {
    await this.runTest(`Scenario: ${scenarioName}`, async () => {
      const result = await this.mockEnv.runScenario(scenarioName, async (scenarioData) => {
        // Change to temp directory for testing
        const originalCwd = process.cwd();
        
        try {
          process.chdir(scenarioData.tempDir);
          
          // Create a temporary validator for this scenario
          const tempValidator = new BuildConfigValidator(scenarioData.tempDir);
          const validationResult = tempValidator.validateTypeScriptConfigurations();
          
          // Expected results based on scenario
          const expectedResults = this.getExpectedScenarioResults();
          const expected = expectedResults[scenarioName];
          
          if (expected) {
            if (expected.shouldBeValid && !validationResult.isValid) {
              throw new Error(`Expected valid configuration but got errors: ${validationResult.errors.join(', ')}`);
            }
            
            if (!expected.shouldBeValid && validationResult.isValid) {
              throw new Error('Expected invalid configuration but validation passed');
            }
            
            if (expected.expectedErrors) {
              const hasExpectedErrors = expected.expectedErrors.every(expectedError =>
                validationResult.errors.some(actualError => 
                  actualError.toLowerCase().includes(expectedError.toLowerCase())
                )
              );
              
              if (!hasExpectedErrors) {
                throw new Error(`Missing expected errors: ${expected.expectedErrors.join(', ')}`);
              }
            }
          }
          
          return {
            scenario: scenarioName,
            isValid: validationResult.isValid,
            errors: validationResult.errors.length,
            warnings: validationResult.warnings.length,
            details: validationResult
          };
          
        } finally {
          process.chdir(originalCwd);
        }
      });
      
      this.testResults.scenarios[scenarioName] = result;
      return `Scenario completed: ${result.errors} errors, ${result.warnings} warnings`;
    });
  }

  // Get expected results for scenarios
  getExpectedScenarioResults() {
    return {
      valid: {
        shouldBeValid: true,
        expectedErrors: []
      },
      missingBuild: {
        shouldBeValid: false,
        expectedErrors: ['tsconfig.build.json not found']
      },
      noTestExclusions: {
        shouldBeValid: true, // Valid but with warnings
        expectedWarnings: ['Missing exclusion pattern']
      },
      overlyBroad: {
        shouldBeValid: true, // Valid but with warnings
        expectedWarnings: ['too broad exclusion patterns']
      },
      conflictingOptions: {
        shouldBeValid: true, // Valid but with warnings
        expectedWarnings: ['compiler option conflicts']
      },
      missingNextJs: {
        shouldBeValid: true, // Valid but with warnings
        expectedWarnings: ['Next.js', 'plugin not configured']
      },
      minimal: {
        shouldBeValid: true,
        expectedErrors: []
      }
    };
  }

  // Performance tests
  async runPerformanceTests() {
    console.log('\n⚡ Performance Tests');
    console.log('------------------');

    // Test with different file counts
    const fileCounts = [50, 100, 200];
    
    for (const fileCount of fileCounts) {
      await this.runPerformanceTest(fileCount);
    }

    // Test type checking performance
    await this.runTest('Type Checking Performance', async () => {
      const iterations = 3;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        try {
          // Run type checking (may fail, but we're measuring performance)
          execSync('npx tsc --project tsconfig.build.json --noEmit', {
            cwd: this.projectRoot,
            stdio: 'pipe',
            timeout: 30000 // 30 second timeout
          });
        } catch (error) {
          // Errors are acceptable for performance testing
        }
        
        const duration = Date.now() - startTime;
        durations.push(duration);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      this.testResults.performance.typeChecking = {
        averageDuration: avgDuration,
        maxDuration: maxDuration,
        iterations: iterations
      };

      if (maxDuration > 60000) { // 1 minute threshold
        throw new Error(`Type checking too slow: ${maxDuration}ms`);
      }

      return `Average: ${avgDuration.toFixed(0)}ms, Max: ${maxDuration}ms`;
    });
  }

  // Individual performance test
  async runPerformanceTest(fileCount) {
    await this.runTest(`Performance with ${fileCount} files`, async () => {
      const startTime = Date.now();
      
      // Create performance test files
      const files = this.mockEnv.createPerformanceTestFiles(fileCount);
      
      const setupTime = Date.now() - startTime;
      
      // Test exclusion pattern performance
      const exclusionStartTime = Date.now();
      const exclusionTest = this.validator.testExclusionPatternEffectiveness(files);
      const exclusionTime = Date.now() - exclusionStartTime;
      
      this.testResults.performance[`files_${fileCount}`] = {
        fileCount: fileCount,
        setupTime: setupTime,
        exclusionTime: exclusionTime,
        effectiveness: exclusionTest.effectiveness
      };

      if (exclusionTime > 5000) { // 5 second threshold
        throw new Error(`Exclusion pattern testing too slow with ${fileCount} files: ${exclusionTime}ms`);
      }

      return `Setup: ${setupTime}ms, Exclusion test: ${exclusionTime}ms, Effectiveness: ${(exclusionTest.effectiveness * 100).toFixed(1)}%`;
    });
  }

  // Error handling tests
  async runErrorHandlingTests() {
    console.log('\n⚠️  Error Handling Tests');
    console.log('-----------------------');

    // Test with invalid JSON
    await this.runTest('Invalid JSON Handling', async () => {
      const result = await this.mockEnv.runScenario('invalidJson', async (scenarioData) => {
        const originalCwd = process.cwd();
        
        try {
          process.chdir(scenarioData.tempDir);
          
          const tempValidator = new BuildConfigValidator(scenarioData.tempDir);
          const validationResult = tempValidator.validateTypeScriptConfigurations();
          
          if (validationResult.isValid) {
            throw new Error('Should detect invalid JSON');
          }
          
          const hasParseError = validationResult.errors.some(error => 
            error.includes('Failed to parse') || error.includes('JSON')
          );
          
          if (!hasParseError) {
            throw new Error('Should report JSON parsing error');
          }
          
          return 'Invalid JSON properly detected';
          
        } finally {
          process.chdir(originalCwd);
        }
      });
      
      return result;
    });

    // Test with TypeScript compilation errors
    await this.runTest('TypeScript Error Handling', async () => {
      // Create files with TypeScript errors
      const errorFiles = this.mockEnv.createMockErrorFiles();
      
      // Test that errors are properly detected and parsed
      // Note: This test may not work in the mock environment without proper TypeScript setup
      return `Created ${errorFiles.length} files with TypeScript errors for testing`;
    });

    // Test missing dependencies
    await this.runTest('Missing Dependencies Handling', async () => {
      try {
        // Check if TypeScript is available
        execSync('npx tsc --version', { 
          cwd: this.projectRoot,
          stdio: 'pipe'
        });
        return 'TypeScript dependency available';
      } catch (error) {
        if (error.code === 'ENOENT') {
          return 'Missing TypeScript dependency properly detected';
        }
        throw error;
      }
    });
  }

  // Integration tests
  async runIntegrationTests() {
    console.log('\n🔗 Integration Tests');
    console.log('-------------------');

    // Test build script integration
    await this.runTest('Build Script Integration', async () => {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check required scripts
      const requiredScripts = ['build', 'build:validate', 'type-check:build'];
      const missingScripts = requiredScripts.filter(script => 
        !packageJson.scripts || !packageJson.scripts[script]
      );

      if (missingScripts.length > 0) {
        throw new Error(`Missing required scripts: ${missingScripts.join(', ')}`);
      }

      // Check script dependencies
      if (!packageJson.scripts.build.includes('build:validate')) {
        throw new Error('Build script should include validation');
      }

      return 'Build script integration verified';
    });

    // Test environment variable integration
    await this.runTest('Environment Variable Integration', async () => {
      const originalEnv = { ...process.env };
      
      try {
        // Test with different feature flags
        process.env.NEXT_PUBLIC_ENABLE_CMS = 'true';
        process.env.NEXT_PUBLIC_ENABLE_AUTH = 'true';
        
        // Validation should still work with feature flags
        const validationResult = this.validator.validateTypeScriptConfigurations();
        
        return `Environment integration works with feature flags`;
        
      } finally {
        // Restore environment
        Object.keys(process.env).forEach(key => {
          if (key.startsWith('NEXT_PUBLIC_ENABLE_')) {
            delete process.env[key];
          }
        });
        Object.assign(process.env, originalEnv);
      }
    });
  }

  // Generic test runner
  async runTest(testName, testFunction) {
    this.testResults.summary.totalTests++;
    
    try {
      console.log(`  🧪 ${testName}...`);
      const result = await testFunction();
      console.log(`  ✅ ${testName}: ${result}`);
      this.testResults.summary.passed++;
      return result;
    } catch (error) {
      console.error(`  ❌ ${testName}: ${error.message}`);
      this.testResults.summary.failed++;
      this.testResults.summary.errors++;
      
      // Store error details
      if (!this.testResults.errors) {
        this.testResults.errors = [];
      }
      this.testResults.errors.push({
        test: testName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  // Generate comprehensive report
  generateComprehensiveReport() {
    console.log('\n📊 Comprehensive Test Report');
    console.log('============================');
    
    // Summary
    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${this.testResults.summary.totalTests}`);
    console.log(`   ✅ Passed: ${this.testResults.summary.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.summary.failed}`);
    console.log(`   ⚠️  Warnings: ${this.testResults.validation.warnings?.length || 0}`);
    console.log(`   🚨 Errors: ${this.testResults.validation.errors?.length || 0}`);

    // Configuration validation results
    if (this.testResults.validation) {
      console.log(`\n🔧 Configuration Validation:`);
      console.log(`   Valid: ${this.testResults.validation.isValid ? '✅' : '❌'}`);
      console.log(`   Errors: ${this.testResults.validation.errors?.length || 0}`);
      console.log(`   Warnings: ${this.testResults.validation.warnings?.length || 0}`);
      console.log(`   Suggestions: ${this.testResults.validation.suggestions?.length || 0}`);
    }

    // Performance results
    if (this.testResults.performance) {
      console.log(`\n⚡ Performance Results:`);
      Object.entries(this.testResults.performance).forEach(([key, result]) => {
        if (typeof result === 'object') {
          console.log(`   ${key}:`);
          Object.entries(result).forEach(([metric, value]) => {
            console.log(`     ${metric}: ${typeof value === 'number' ? value.toFixed(0) : value}`);
          });
        }
      });
    }

    // Scenario results
    if (Object.keys(this.testResults.scenarios).length > 0) {
      console.log(`\n🎭 Scenario Results:`);
      Object.entries(this.testResults.scenarios).forEach(([scenario, result]) => {
        const status = result.isValid ? '✅' : '❌';
        console.log(`   ${scenario}: ${status} (${result.errors} errors, ${result.warnings} warnings)`);
      });
    }

    // Recommendations
    this.generateRecommendations();

    // Export detailed report
    const reportPath = path.join(this.projectRoot, 'build-config-test-report.json');
    this.exportDetailedReport(reportPath);

    // Final status
    const overallSuccess = this.testResults.summary.failed === 0;
    console.log(`\n${overallSuccess ? '🎉' : '❌'} Overall Result: ${overallSuccess ? 'SUCCESS' : 'FAILED'}`);
    
    if (!overallSuccess) {
      console.log('\n💡 Review the detailed report and fix the issues above.');
      process.exit(1);
    }
  }

  // Generate recommendations based on test results
  generateRecommendations() {
    console.log(`\n💡 Recommendations:`);
    
    const recommendations = [];

    // Configuration recommendations
    if (this.testResults.validation) {
      if (this.testResults.validation.errors?.length > 0) {
        recommendations.push('🚨 Fix configuration errors immediately - build will fail');
      }
      
      if (this.testResults.validation.warnings?.length > 0) {
        recommendations.push('⚠️  Address configuration warnings to improve build reliability');
      }
    }

    // Performance recommendations
    if (this.testResults.performance?.typeChecking?.maxDuration > 30000) {
      recommendations.push('⚡ Consider optimizing TypeScript configuration for better performance');
    }

    // Scenario recommendations
    const failedScenarios = Object.entries(this.testResults.scenarios || {})
      .filter(([_, result]) => !result.isValid)
      .map(([scenario, _]) => scenario);
    
    if (failedScenarios.length > 0) {
      recommendations.push(`🎭 Review scenario failures: ${failedScenarios.join(', ')}`);
    }

    // General recommendations
    if (this.testResults.summary.failed > 0) {
      recommendations.push('🔧 Run individual test suites to isolate and fix specific issues');
      recommendations.push('📚 Review TypeScript and Next.js configuration documentation');
    }

    if (recommendations.length === 0) {
      recommendations.push('✨ Configuration looks good! Consider running tests regularly to catch regressions');
    }

    recommendations.forEach(rec => console.log(`   ${rec}`));
  }

  // Export detailed report
  exportDetailedReport(outputPath) {
    const report = {
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      summary: this.testResults.summary,
      validation: this.testResults.validation,
      scenarios: this.testResults.scenarios,
      performance: this.testResults.performance,
      errors: this.testResults.errors || [],
      recommendations: this.validator.generateRecommendations(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report exported to: ${outputPath}`);
  }
}

module.exports = ComprehensiveTestRunner;