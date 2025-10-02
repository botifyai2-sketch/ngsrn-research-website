#!/usr/bin/env node

/**
 * Test Script for Build Monitoring System
 * Tests all aspects of the build monitoring and health check functionality
 */

const BuildMonitor = require('./build-monitor');
const fs = require('fs');
const path = require('path');

class BuildMonitoringTest {
  constructor() {
    this.monitor = new BuildMonitor();
    this.testResults = [];
    this.testStartTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  recordTest(testName, success, details = '') {
    this.testResults.push({
      name: testName,
      success,
      details,
      timestamp: new Date().toISOString()
    });
    
    this.log(`Test: ${testName} - ${success ? 'PASSED' : 'FAILED'}${details ? ` (${details})` : ''}`, success ? 'success' : 'error');
  }

  async testBasicFunctionality() {
    this.log('Testing basic build monitoring functionality...');
    
    try {
      // Test 1: Record successful build
      const successfulBuild = this.monitor.recordBuildAttempt(true, 45000, [], 'test');
      this.recordTest('Record Successful Build', !!successfulBuild, `Duration: ${successfulBuild.duration}ms`);
      
      // Test 2: Record failed build
      const failedBuild = this.monitor.recordBuildAttempt(false, 30000, [
        { type: 'typescript', message: 'Type error in component' },
        { type: 'lint', message: 'ESLint errors found' }
      ], 'test');
      this.recordTest('Record Failed Build', !!failedBuild, `Errors: ${failedBuild.errors.length}`);
      
      // Test 3: Get health status
      const healthStatus = this.monitor.getBuildHealthStatus();
      this.recordTest('Get Health Status', !!healthStatus && typeof healthStatus.status === 'string', `Status: ${healthStatus?.status}`);
      
      // Test 4: Generate health report
      const healthReport = this.monitor.generateHealthReport();
      this.recordTest('Generate Health Report', !!healthReport && !!healthReport.summary, `Total builds: ${healthReport?.summary?.totalBuilds}`);
      
    } catch (error) {
      this.recordTest('Basic Functionality', false, error.message);
    }
  }

  async testConfigurationDrift() {
    this.log('Testing configuration drift detection...');
    
    try {
      // Test 1: Get current configuration
      const currentConfig = this.monitor.getCurrentConfiguration();
      this.recordTest('Get Current Configuration', !!currentConfig && !!currentConfig.timestamp, `Node version: ${currentConfig?.nodeVersion}`);
      
      // Test 2: Detect drift (should be none initially)
      const drift = this.monitor.detectConfigurationDrift();
      this.recordTest('Detect Configuration Drift', typeof drift.hasDrift === 'boolean', `Has drift: ${drift.hasDrift}`);
      
      // Test 3: Configuration hashing
      const configHash = this.monitor.getCurrentConfigHash();
      this.recordTest('Configuration Hashing', typeof configHash === 'string' && configHash.length > 0, `Hash length: ${configHash?.length}`);
      
    } catch (error) {
      this.recordTest('Configuration Drift Detection', false, error.message);
    }
  }

  async testAlertSystem() {
    this.log('Testing alert system...');
    
    try {
      // Create multiple failed builds to trigger alerts
      for (let i = 0; i < 5; i++) {
        this.monitor.recordBuildAttempt(false, 20000 + (i * 1000), [
          { type: 'build', message: `Test failure ${i + 1}` }
        ], 'test');
      }
      
      // Test 1: Check for alerts
      const metrics = this.monitor.loadMetrics();
      const alerts = this.monitor.checkBuildHealthAlerts(metrics);
      this.recordTest('Generate Alerts', Array.isArray(alerts), `Generated ${alerts?.length || 0} alerts`);
      
      // Test 2: Get active alerts
      const activeAlerts = this.monitor.getActiveAlerts();
      this.recordTest('Get Active Alerts', Array.isArray(activeAlerts), `Active alerts: ${activeAlerts?.length || 0}`);
      
      // Test 3: Get recent alerts
      const recentAlerts = this.monitor.getRecentAlerts(7);
      this.recordTest('Get Recent Alerts', Array.isArray(recentAlerts), `Recent alerts: ${recentAlerts?.length || 0}`);
      
    } catch (error) {
      this.recordTest('Alert System', false, error.message);
    }
  }

  async testMetricsCalculation() {
    this.log('Testing metrics calculation...');
    
    try {
      // Add a mix of successful and failed builds
      const buildResults = [
        { success: true, duration: 45000 },
        { success: true, duration: 50000 },
        { success: false, duration: 25000 },
        { success: true, duration: 48000 },
        { success: false, duration: 30000 },
        { success: true, duration: 52000 }
      ];
      
      buildResults.forEach((build, index) => {
        this.monitor.recordBuildAttempt(build.success, build.duration, 
          build.success ? [] : [{ type: 'test', message: `Test error ${index}` }], 'test');
      });
      
      // Test metrics calculation
      const healthStatus = this.monitor.getBuildHealthStatus();
      const expectedSuccessRate = (buildResults.filter(b => b.success).length / buildResults.length) * 100;
      
      this.recordTest('Success Rate Calculation', 
        Math.abs(healthStatus.metrics.successRate - expectedSuccessRate) < 1, 
        `Expected: ${expectedSuccessRate.toFixed(1)}%, Got: ${healthStatus.metrics.successRate.toFixed(1)}%`);
      
      // Test build count
      this.recordTest('Build Count Tracking', 
        healthStatus.metrics.totalBuilds >= buildResults.length,
        `Total builds: ${healthStatus.metrics.totalBuilds}`);
      
    } catch (error) {
      this.recordTest('Metrics Calculation', false, error.message);
    }
  }

  async testFileOperations() {
    this.log('Testing file operations...');
    
    try {
      // Test 1: Monitoring directory creation
      const monitoringDir = path.join(__dirname, '..', '.monitoring');
      this.recordTest('Monitoring Directory Exists', fs.existsSync(monitoringDir), `Path: ${monitoringDir}`);
      
      // Test 2: Metrics file creation
      const metricsFile = path.join(monitoringDir, 'build-metrics.json');
      this.recordTest('Metrics File Exists', fs.existsSync(metricsFile), `Path: ${metricsFile}`);
      
      // Test 3: Metrics file is valid JSON
      try {
        const metricsContent = fs.readFileSync(metricsFile, 'utf8');
        const metrics = JSON.parse(metricsContent);
        this.recordTest('Metrics File Valid JSON', !!metrics && typeof metrics === 'object', `Keys: ${Object.keys(metrics).join(', ')}`);
      } catch (parseError) {
        this.recordTest('Metrics File Valid JSON', false, parseError.message);
      }
      
      // Test 4: Configuration file operations
      const configFile = path.join(monitoringDir, 'build-config.json');
      const testConfig = { test: true, timestamp: new Date().toISOString() };
      this.monitor.saveBaselineConfiguration(testConfig);
      
      const loadedConfig = this.monitor.getBaselineConfiguration();
      this.recordTest('Configuration File Operations', 
        loadedConfig && loadedConfig.test === true,
        `Config loaded: ${!!loadedConfig}`);
      
    } catch (error) {
      this.recordTest('File Operations', false, error.message);
    }
  }

  async testErrorHandling() {
    this.log('Testing error handling...');
    
    try {
      // Test 1: Invalid build data
      try {
        this.monitor.recordBuildAttempt(null, 'invalid', [], 'test');
        this.recordTest('Invalid Build Data Handling', false, 'Should have thrown error');
      } catch (error) {
        this.recordTest('Invalid Build Data Handling', true, 'Properly rejected invalid data');
      }
      
      // Test 2: Missing files handling
      const originalLoadMetrics = this.monitor.loadMetrics;
      this.monitor.loadMetrics = () => { throw new Error('File not found'); };
      
      try {
        const healthStatus = this.monitor.getBuildHealthStatus();
        this.recordTest('Missing Files Handling', true, 'Gracefully handled missing files');
      } catch (error) {
        this.recordTest('Missing Files Handling', false, `Failed to handle missing files: ${error.message}`);
      } finally {
        this.monitor.loadMetrics = originalLoadMetrics;
      }
      
    } catch (error) {
      this.recordTest('Error Handling', false, error.message);
    }
  }

  async testPerformance() {
    this.log('Testing performance...');
    
    try {
      // Test 1: Large number of build records
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        this.monitor.recordBuildAttempt(
          Math.random() > 0.2, // 80% success rate
          Math.random() * 60000 + 10000, // 10-70 second builds
          Math.random() > 0.8 ? [{ type: 'test', message: 'Random error' }] : [],
          'performance-test'
        );
      }
      const recordingTime = Date.now() - startTime;
      
      this.recordTest('Bulk Build Recording Performance', 
        recordingTime < 5000, // Should complete in under 5 seconds
        `Time: ${recordingTime}ms for 100 records`);
      
      // Test 2: Health status calculation performance
      const healthStartTime = Date.now();
      const healthStatus = this.monitor.getBuildHealthStatus();
      const healthTime = Date.now() - healthStartTime;
      
      this.recordTest('Health Status Calculation Performance',
        healthTime < 1000, // Should complete in under 1 second
        `Time: ${healthTime}ms`);
      
      // Test 3: Configuration drift detection performance
      const driftStartTime = Date.now();
      const drift = this.monitor.detectConfigurationDrift();
      const driftTime = Date.now() - driftStartTime;
      
      this.recordTest('Configuration Drift Detection Performance',
        driftTime < 2000, // Should complete in under 2 seconds
        `Time: ${driftTime}ms`);
      
    } catch (error) {
      this.recordTest('Performance Testing', false, error.message);
    }
  }

  generateTestReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(test => test.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;
    const totalTime = Date.now() - this.testStartTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('BUILD MONITORING TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Total Time: ${Math.round(totalTime / 1000)}s`);
    console.log('='.repeat(60));
    
    if (failedTests > 0) {
      console.log('\nFAILED TESTS:');
      this.testResults.filter(test => !test.success).forEach(test => {
        console.log(`❌ ${test.name}: ${test.details}`);
      });
    }
    
    console.log('\nTEST SUMMARY:');
    this.testResults.forEach(test => {
      const status = test.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}${test.details ? ` - ${test.details}` : ''}`);
    });
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate,
      totalTime,
      results: this.testResults
    };
  }

  async runAllTests() {
    this.log('Starting comprehensive build monitoring tests...');
    
    try {
      await this.testBasicFunctionality();
      await this.testConfigurationDrift();
      await this.testAlertSystem();
      await this.testMetricsCalculation();
      await this.testFileOperations();
      await this.testErrorHandling();
      await this.testPerformance();
      
      const report = this.generateTestReport();
      
      if (report.failedTests === 0) {
        this.log('All tests passed! Build monitoring system is working correctly.', 'success');
        process.exit(0);
      } else {
        this.log(`${report.failedTests} tests failed. Please review the issues above.`, 'error');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`Test suite failed with error: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const testSuite = new BuildMonitoringTest();
  
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Usage: node scripts/test-build-monitoring.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h    Show this help message');
    console.log('');
    console.log('This script runs comprehensive tests for the build monitoring system:');
    console.log('  - Basic functionality (recording builds, health status)');
    console.log('  - Configuration drift detection');
    console.log('  - Alert system');
    console.log('  - Metrics calculation');
    console.log('  - File operations');
    console.log('  - Error handling');
    console.log('  - Performance testing');
    process.exit(0);
  }
  
  testSuite.runAllTests().catch(error => {
    console.error('Fatal error in test suite:', error);
    process.exit(1);
  });
}

module.exports = BuildMonitoringTest;