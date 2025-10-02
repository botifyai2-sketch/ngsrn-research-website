#!/usr/bin/env node

/**
 * Build Script with Integrated Monitoring
 * Wraps the standard build process with comprehensive monitoring and health checks
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Import build monitor
let BuildMonitor;
try {
  BuildMonitor = require('./build-monitor');
} catch (error) {
  console.error('❌ Build monitoring not available:', error.message);
  process.exit(1);
}

class MonitoredBuildProcess {
  constructor() {
    this.monitor = new BuildMonitor();
    this.startTime = Date.now();
    this.buildPhase = this.detectBuildPhase();
    this.buildErrors = [];
    this.buildWarnings = [];
  }

  detectBuildPhase() {
    const features = {
      cms: process.env.NEXT_PUBLIC_ENABLE_CMS === 'true',
      auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
      search: process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
      ai: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
      media: process.env.NEXT_PUBLIC_ENABLE_MEDIA === 'true'
    };
    
    const hasAnyFeature = Object.values(features).some(Boolean);
    return hasAnyFeature ? 'full' : 'simple';
  }

  async runPreBuildChecks() {
    console.log('🔍 Running pre-build health checks...');
    
    try {
      // Check for configuration drift
      const drift = this.monitor.detectConfigurationDrift();
      if (drift.hasDrift) {
        console.log(`⚠️  Configuration drift detected (${drift.severity} severity):`);
        drift.changes.forEach(change => {
          const emoji = change.severity === 'high' ? '🚨' : change.severity === 'medium' ? '⚠️' : 'ℹ️';
          console.log(`  ${emoji} ${change.message}`);
        });
        
        if (drift.severity === 'high') {
          console.log('💡 High-impact changes detected. Proceeding with caution...');
        }
      }
      
      // Check build health status
      const healthStatus = this.monitor.getBuildHealthStatus();
      if (healthStatus.status === 'critical') {
        console.warn('⚠️  Build system is in critical state. Recent builds may be unstable.');
        console.warn('   Consider investigating recent failures before proceeding.');
      }
      
      // Check for active alerts
      const activeAlerts = this.monitor.getActiveAlerts();
      if (activeAlerts.length > 0) {
        console.log(`📢 ${activeAlerts.length} active build alerts:`);
        activeAlerts.slice(0, 3).forEach(alert => {
          console.log(`  • ${alert.message} (${alert.severity})`);
        });
      }
      
      console.log('✅ Pre-build checks completed');
      return true;
      
    } catch (error) {
      console.error('❌ Pre-build checks failed:', error.message);
      this.buildErrors.push({
        type: 'pre_build_check',
        message: error.message,
        phase: 'pre-build'
      });
      return false;
    }
  }

  async runBuildValidation() {
    console.log('🔧 Running build validation...');
    
    try {
      // Run the enhanced build validation
      execSync('node scripts/validate-build.js', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      
      console.log('✅ Build validation passed');
      return true;
      
    } catch (error) {
      console.error('❌ Build validation failed');
      this.buildErrors.push({
        type: 'build_validation',
        message: 'Build validation failed',
        details: error.message,
        phase: 'validation'
      });
      return false;
    }
  }

  async runActualBuild() {
    console.log('🏗️  Running Next.js build...');
    
    try {
      const buildStartTime = Date.now();
      
      // Run the actual Next.js build
      execSync('npm run build', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      
      const buildDuration = Date.now() - buildStartTime;
      console.log(`✅ Build completed successfully (${Math.round(buildDuration / 1000)}s)`);
      
      return { success: true, duration: buildDuration };
      
    } catch (error) {
      console.error('❌ Build failed');
      this.buildErrors.push({
        type: 'build_execution',
        message: 'Next.js build failed',
        details: error.message,
        phase: 'build'
      });
      return { success: false, duration: Date.now() - this.startTime };
    }
  }

  async runPostBuildChecks() {
    console.log('🔍 Running post-build checks...');
    
    try {
      // Check build output
      const buildDir = path.join(__dirname, '..', '.next');
      if (!fs.existsSync(buildDir)) {
        throw new Error('Build output directory not found');
      }
      
      // Check for build manifest
      const buildManifest = path.join(buildDir, 'build-manifest.json');
      if (!fs.existsSync(buildManifest)) {
        this.buildWarnings.push({
          type: 'build_output',
          message: 'Build manifest not found',
          phase: 'post-build'
        });
      }
      
      // Check static assets
      const staticDir = path.join(buildDir, 'static');
      if (!fs.existsSync(staticDir)) {
        this.buildWarnings.push({
          type: 'build_output',
          message: 'Static assets directory not found',
          phase: 'post-build'
        });
      }
      
      console.log('✅ Post-build checks completed');
      return true;
      
    } catch (error) {
      console.error('❌ Post-build checks failed:', error.message);
      this.buildErrors.push({
        type: 'post_build_check',
        message: error.message,
        phase: 'post-build'
      });
      return false;
    }
  }

  recordBuildResult(success, duration) {
    try {
      const allErrors = [...this.buildErrors];
      if (this.buildWarnings.length > 0) {
        console.log(`⚠️  Build completed with ${this.buildWarnings.length} warnings`);
        this.buildWarnings.forEach(warning => {
          console.log(`  • ${warning.message}`);
        });
      }
      
      const buildRecord = this.monitor.recordBuildAttempt(
        success,
        duration,
        allErrors,
        this.buildPhase
      );
      
      console.log(`📊 Build metrics recorded:`);
      console.log(`   Duration: ${Math.round(duration / 1000)}s`);
      console.log(`   Phase: ${this.buildPhase}`);
      console.log(`   Errors: ${allErrors.length}`);
      console.log(`   Warnings: ${this.buildWarnings.length}`);
      
      // Check if this build triggered any new alerts
      const newAlerts = this.monitor.checkBuildHealthAlerts(this.monitor.loadMetrics());
      if (newAlerts.length > 0) {
        console.log(`🚨 ${newAlerts.length} new alerts generated:`);
        newAlerts.forEach(alert => {
          console.log(`   • ${alert.message} (${alert.severity})`);
        });
      }
      
      return buildRecord;
      
    } catch (error) {
      console.error('❌ Failed to record build metrics:', error.message);
    }
  }

  generateBuildSummary(success, duration) {
    const summary = {
      success,
      duration: Math.round(duration / 1000),
      phase: this.buildPhase,
      errors: this.buildErrors.length,
      warnings: this.buildWarnings.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n📋 Build Summary:');
    console.log('================');
    console.log(`Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Duration: ${summary.duration}s`);
    console.log(`Phase: ${summary.phase}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Warnings: ${summary.warnings}`);
    
    if (this.buildErrors.length > 0) {
      console.log('\n❌ Errors:');
      this.buildErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.phase}] ${error.message}`);
      });
    }
    
    if (this.buildWarnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.buildWarnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. [${warning.phase}] ${warning.message}`);
      });
    }
    
    // Show health status
    const healthStatus = this.monitor.getBuildHealthStatus();
    console.log(`\n🏥 Build Health: ${healthStatus.status.toUpperCase()}`);
    console.log(`   Success Rate: ${healthStatus.metrics.successRate.toFixed(1)}%`);
    console.log(`   Total Builds: ${healthStatus.metrics.totalBuilds}`);
    
    return summary;
  }

  async run() {
    console.log('🚀 Starting monitored build process...');
    console.log(`📋 Build phase: ${this.buildPhase}`);
    console.log(`🕐 Started at: ${new Date().toISOString()}\n`);
    
    let overallSuccess = true;
    
    try {
      // Pre-build checks
      const preBuildOk = await this.runPreBuildChecks();
      if (!preBuildOk && process.env.STRICT_BUILD_CHECKS === 'true') {
        throw new Error('Pre-build checks failed and strict mode is enabled');
      }
      
      // Build validation
      const validationOk = await this.runBuildValidation();
      if (!validationOk) {
        overallSuccess = false;
        throw new Error('Build validation failed');
      }
      
      // Actual build
      const buildResult = await this.runActualBuild();
      if (!buildResult.success) {
        overallSuccess = false;
        throw new Error('Build execution failed');
      }
      
      // Post-build checks
      const postBuildOk = await this.runPostBuildChecks();
      if (!postBuildOk && process.env.STRICT_BUILD_CHECKS === 'true') {
        overallSuccess = false;
        throw new Error('Post-build checks failed and strict mode is enabled');
      }
      
      const totalDuration = Date.now() - this.startTime;
      
      // Record results
      this.recordBuildResult(overallSuccess, totalDuration);
      
      // Generate summary
      this.generateBuildSummary(overallSuccess, totalDuration);
      
      if (overallSuccess) {
        console.log('\n🎉 Build completed successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Build completed with issues. Check the summary above.');
        process.exit(1);
      }
      
    } catch (error) {
      const totalDuration = Date.now() - this.startTime;
      overallSuccess = false;
      
      console.error(`\n❌ Build process failed: ${error.message}`);
      
      // Record failure
      this.recordBuildResult(false, totalDuration);
      
      // Generate summary
      this.generateBuildSummary(false, totalDuration);
      
      console.log('\n💡 Troubleshooting suggestions:');
      console.log('   1. Check the error details above');
      console.log('   2. Run individual build steps to isolate the issue');
      console.log('   3. Check build health dashboard for patterns');
      console.log('   4. Review recent configuration changes');
      
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const buildProcess = new MonitoredBuildProcess();
  
  // Handle command line arguments
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Usage: node scripts/build-with-monitoring.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h    Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  STRICT_BUILD_CHECKS=true    Fail build on any check failures');
    console.log('  NODE_ENV=production         Set production build mode');
    console.log('');
    console.log('This script runs a comprehensive build process with monitoring:');
    console.log('  1. Pre-build health checks and configuration drift detection');
    console.log('  2. Build validation (environment, TypeScript, etc.)');
    console.log('  3. Next.js build execution');
    console.log('  4. Post-build verification');
    console.log('  5. Metrics recording and health status updates');
    process.exit(0);
  }
  
  // Run the monitored build process
  buildProcess.run().catch(error => {
    console.error('Fatal error in build process:', error);
    process.exit(1);
  });
}

module.exports = MonitoredBuildProcess;