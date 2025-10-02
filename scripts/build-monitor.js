#!/usr/bin/env node

/**
 * Build Monitoring and Health Check System
 * Monitors build success rates, detects configuration drift, and provides health alerts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildMonitor {
  constructor() {
    this.monitoringDir = path.join(__dirname, '..', '.monitoring');
    this.buildHistoryFile = path.join(this.monitoringDir, 'build-history.json');
    this.configSnapshotFile = path.join(this.monitoringDir, 'config-snapshot.json');
    this.alertsFile = path.join(this.monitoringDir, 'alerts.json');
    
    this.ensureMonitoringDirectory();
  }

  ensureMonitoringDirectory() {
    if (!fs.existsSync(this.monitoringDir)) {
      fs.mkdirSync(this.monitoringDir, { recursive: true });
    }
  }

  /**
   * Record a build attempt and its outcome
   */
  recordBuildAttempt(buildResult) {
    const buildRecord = {
      timestamp: new Date().toISOString(),
      success: buildResult.success,
      duration: buildResult.duration,
      phase: buildResult.phase || 'unknown',
      errors: buildResult.errors || [],
      warnings: buildResult.warnings || [],
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        ci: !!process.env.CI,
        vercel: !!process.env.VERCEL
      },
      configuration: this.captureCurrentConfiguration(),
      metrics: buildResult.metrics || {}
    };

    const history = this.loadBuildHistory();
    history.builds.push(buildRecord);
    
    // Keep only last 100 builds to prevent file from growing too large
    if (history.builds.length > 100) {
      history.builds = history.builds.slice(-100);
    }

    history.lastUpdated = new Date().toISOString();
    this.saveBuildHistory(history);

    // Update statistics
    this.updateBuildStatistics(history);
    
    // Check for alerts
    this.checkForAlerts(buildRecord, history);

    return buildRecord;
  }

  /**
   * Capture current configuration for drift detection
   */
  captureCurrentConfiguration() {
    const config = {
      timestamp: new Date().toISOString(),
      packageJson: this.getPackageJsonHash(),
      tsConfig: this.getTsConfigHash(),
      tsConfigBuild: this.getTsConfigBuildHash(),
      nextConfig: this.getNextConfigHash(),
      envVars: this.getEnvironmentVariablesSnapshot(),
      dependencies: this.getDependenciesSnapshot()
    };

    return config;
  }

  /**
   * Detect configuration drift since last successful build
   */
  detectConfigurationDrift() {
    const history = this.loadBuildHistory();
    const lastSuccessfulBuild = history.builds
      .slice()
      .reverse()
      .find(build => build.success);

    if (!lastSuccessfulBuild) {
      return {
        hasDrift: false,
        reason: 'No previous successful build found'
      };
    }

    const currentConfig = this.captureCurrentConfiguration();
    const lastConfig = lastSuccessfulBuild.configuration;

    const driftDetection = {
      hasDrift: false,
      changes: [],
      severity: 'low'
    };

    // Check for configuration changes
    const configChecks = [
      {
        name: 'package.json',
        current: currentConfig.packageJson,
        previous: lastConfig.packageJson,
        severity: 'high'
      },
      {
        name: 'tsconfig.json',
        current: currentConfig.tsConfig,
        previous: lastConfig.tsConfig,
        severity: 'medium'
      },
      {
        name: 'tsconfig.build.json',
        current: currentConfig.tsConfigBuild,
        previous: lastConfig.tsConfigBuild,
        severity: 'high'
      },
      {
        name: 'next.config.ts',
        current: currentConfig.nextConfig,
        previous: lastConfig.nextConfig,
        severity: 'medium'
      }
    ];

    configChecks.forEach(check => {
      if (check.current !== check.previous) {
        driftDetection.hasDrift = true;
        driftDetection.changes.push({
          file: check.name,
          severity: check.severity,
          message: `${check.name} has been modified since last successful build`
        });

        if (check.severity === 'high' && driftDetection.severity !== 'high') {
          driftDetection.severity = 'high';
        } else if (check.severity === 'medium' && driftDetection.severity === 'low') {
          driftDetection.severity = 'medium';
        }
      }
    });

    // Check for dependency changes
    const depChanges = this.detectDependencyChanges(
      currentConfig.dependencies,
      lastConfig.dependencies
    );

    if (depChanges.length > 0) {
      driftDetection.hasDrift = true;
      driftDetection.changes.push(...depChanges);
      if (driftDetection.severity === 'low') {
        driftDetection.severity = 'medium';
      }
    }

    // Check for environment variable changes
    const envChanges = this.detectEnvironmentChanges(
      currentConfig.envVars,
      lastConfig.envVars
    );

    if (envChanges.length > 0) {
      driftDetection.hasDrift = true;
      driftDetection.changes.push(...envChanges);
    }

    return driftDetection;
  }

  /**
   * Generate build health report
   */
  generateHealthReport() {
    const history = this.loadBuildHistory();
    const stats = this.calculateBuildStatistics(history);
    const drift = this.detectConfigurationDrift();
    const alerts = this.loadAlerts();

    const report = {
      timestamp: new Date().toISOString(),
      overall: this.calculateOverallHealth(stats, drift, alerts),
      buildSuccess: {
        rate: stats.successRate,
        trend: stats.trend,
        recentFailures: stats.recentFailures
      },
      configurationDrift: drift,
      activeAlerts: alerts.active || [],
      recommendations: this.generateRecommendations(stats, drift, alerts),
      metrics: {
        totalBuilds: stats.totalBuilds,
        averageDuration: stats.averageDuration,
        failurePatterns: stats.failurePatterns
      }
    };

    return report;
  }

  /**
   * Check for conditions that should trigger alerts
   */
  checkForAlerts(buildRecord, history) {
    const alerts = this.loadAlerts();
    const newAlerts = [];

    // Alert: Multiple consecutive failures
    const recentBuilds = history.builds.slice(-5);
    const recentFailures = recentBuilds.filter(build => !build.success);
    
    if (recentFailures.length >= 3) {
      newAlerts.push({
        id: `consecutive-failures-${Date.now()}`,
        type: 'consecutive_failures',
        severity: 'high',
        message: `${recentFailures.length} consecutive build failures detected`,
        timestamp: new Date().toISOString(),
        data: {
          failureCount: recentFailures.length,
          errors: recentFailures.map(build => build.errors).flat()
        }
      });
    }

    // Alert: Build duration significantly increased
    const successfulBuilds = history.builds.filter(build => build.success && build.duration);
    if (successfulBuilds.length >= 5) {
      const recentDurations = successfulBuilds.slice(-3).map(build => build.duration);
      const historicalDurations = successfulBuilds.slice(-10, -3).map(build => build.duration);
      
      if (historicalDurations.length > 0) {
        const recentAvg = recentDurations.reduce((a, b) => a + b, 0) / recentDurations.length;
        const historicalAvg = historicalDurations.reduce((a, b) => a + b, 0) / historicalDurations.length;
        
        if (recentAvg > historicalAvg * 1.5) {
          newAlerts.push({
            id: `slow-build-${Date.now()}`,
            type: 'performance_degradation',
            severity: 'medium',
            message: `Build duration increased by ${Math.round(((recentAvg - historicalAvg) / historicalAvg) * 100)}%`,
            timestamp: new Date().toISOString(),
            data: {
              recentAverage: recentAvg,
              historicalAverage: historicalAvg,
              increase: recentAvg - historicalAvg
            }
          });
        }
      }
    }

    // Alert: Configuration drift detected
    const drift = this.detectConfigurationDrift();
    if (drift.hasDrift && drift.severity === 'high') {
      newAlerts.push({
        id: `config-drift-${Date.now()}`,
        type: 'configuration_drift',
        severity: 'medium',
        message: 'High-impact configuration changes detected',
        timestamp: new Date().toISOString(),
        data: {
          changes: drift.changes,
          severity: drift.severity
        }
      });
    }

    // Alert: New error patterns
    if (!buildRecord.success && buildRecord.errors.length > 0) {
      const errorPatterns = this.analyzeErrorPatterns(history);
      const newPatterns = errorPatterns.filter(pattern => pattern.isNew);
      
      if (newPatterns.length > 0) {
        newAlerts.push({
          id: `new-error-pattern-${Date.now()}`,
          type: 'new_error_pattern',
          severity: 'medium',
          message: `New error patterns detected: ${newPatterns.map(p => p.pattern).join(', ')}`,
          timestamp: new Date().toISOString(),
          data: {
            patterns: newPatterns
          }
        });
      }
    }

    // Add new alerts and save
    if (newAlerts.length > 0) {
      alerts.active = alerts.active || [];
      alerts.active.push(...newAlerts);
      
      // Auto-resolve old alerts (older than 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      alerts.active = alerts.active.filter(alert => 
        new Date(alert.timestamp) > sevenDaysAgo
      );
      
      this.saveAlerts(alerts);
      
      // Log alerts to console
      newAlerts.forEach(alert => {
        const emoji = alert.severity === 'high' ? '🚨' : alert.severity === 'medium' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} BUILD ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
      });
    }
  }

  /**
   * Analyze error patterns to detect new issues
   */
  analyzeErrorPatterns(history) {
    const allErrors = history.builds
      .filter(build => !build.success)
      .flatMap(build => build.errors || []);

    const errorPatterns = new Map();
    
    allErrors.forEach(error => {
      // Extract error pattern (remove specific details like line numbers, file paths)
      const pattern = this.extractErrorPattern(error);
      
      if (!errorPatterns.has(pattern)) {
        errorPatterns.set(pattern, {
          pattern,
          count: 0,
          firstSeen: null,
          lastSeen: null,
          examples: []
        });
      }
      
      const patternData = errorPatterns.get(pattern);
      patternData.count++;
      patternData.lastSeen = new Date().toISOString();
      
      if (!patternData.firstSeen) {
        patternData.firstSeen = new Date().toISOString();
      }
      
      if (patternData.examples.length < 3) {
        patternData.examples.push(error);
      }
    });

    // Determine which patterns are new (first seen in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return Array.from(errorPatterns.values()).map(pattern => ({
      ...pattern,
      isNew: new Date(pattern.firstSeen) > oneDayAgo
    }));
  }

  /**
   * Extract a generalized pattern from an error message
   */
  extractErrorPattern(error) {
    if (typeof error === 'string') {
      return error
        .replace(/:\d+:\d+/g, ':XX:XX') // Remove line:column numbers
        .replace(/\/[^\/\s]+\.(ts|tsx|js|jsx)/g, '/FILE.$1') // Generalize file paths
        .replace(/\d+/g, 'N') // Replace numbers with N
        .replace(/['"`][^'"`]*['"`]/g, '"STRING"'); // Replace string literals
    }
    
    if (error.message) {
      return this.extractErrorPattern(error.message);
    }
    
    return 'Unknown error pattern';
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealth(stats, drift, alerts) {
    let score = 100;
    let status = 'healthy';
    const issues = [];

    // Reduce score based on success rate
    if (stats.successRate < 0.9) {
      const reduction = (0.9 - stats.successRate) * 100;
      score -= reduction;
      issues.push(`Low success rate: ${Math.round(stats.successRate * 100)}%`);
    }

    // Reduce score for configuration drift
    if (drift.hasDrift) {
      const reduction = drift.severity === 'high' ? 20 : drift.severity === 'medium' ? 10 : 5;
      score -= reduction;
      issues.push(`Configuration drift detected (${drift.severity} severity)`);
    }

    // Reduce score for active alerts
    const highSeverityAlerts = (alerts.active || []).filter(alert => alert.severity === 'high');
    const mediumSeverityAlerts = (alerts.active || []).filter(alert => alert.severity === 'medium');
    
    score -= highSeverityAlerts.length * 15;
    score -= mediumSeverityAlerts.length * 5;
    
    if (highSeverityAlerts.length > 0) {
      issues.push(`${highSeverityAlerts.length} high-severity alerts`);
    }
    if (mediumSeverityAlerts.length > 0) {
      issues.push(`${mediumSeverityAlerts.length} medium-severity alerts`);
    }

    // Determine status based on score
    if (score >= 90) {
      status = 'healthy';
    } else if (score >= 70) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return {
      score: Math.max(0, Math.round(score)),
      status,
      issues
    };
  }

  /**
   * Generate recommendations based on current state
   */
  generateRecommendations(stats, drift, alerts) {
    const recommendations = [];

    // Success rate recommendations
    if (stats.successRate < 0.8) {
      recommendations.push({
        type: 'success_rate',
        priority: 'high',
        message: 'Build success rate is below 80%. Review recent failures and fix recurring issues.',
        actions: [
          'Run automated fix: npm run build:validate:auto-fix',
          'Review error patterns in build history',
          'Check for configuration drift'
        ]
      });
    }

    // Configuration drift recommendations
    if (drift.hasDrift) {
      const highImpactChanges = drift.changes.filter(change => change.severity === 'high');
      if (highImpactChanges.length > 0) {
        recommendations.push({
          type: 'configuration',
          priority: 'high',
          message: 'High-impact configuration changes detected. Validate build configuration.',
          actions: [
            'Run configuration validation: npm run validate:typescript-config',
            'Test build with current configuration',
            'Review changes: ' + highImpactChanges.map(c => c.file).join(', ')
          ]
        });
      }
    }

    // Performance recommendations
    if (stats.averageDuration > 300000) { // 5 minutes
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Build duration is longer than expected. Consider optimization.',
        actions: [
          'Analyze bundle size: npm run build:analyze',
          'Check for unnecessary dependencies',
          'Review TypeScript configuration for performance'
        ]
      });
    }

    // Alert-based recommendations
    const consecutiveFailureAlerts = (alerts.active || []).filter(alert => 
      alert.type === 'consecutive_failures'
    );
    
    if (consecutiveFailureAlerts.length > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: 'Multiple consecutive build failures detected. Immediate attention required.',
        actions: [
          'Run automated diagnostics: npm run deploy:health-check',
          'Check environment configuration',
          'Review recent code changes'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get current build health status
   */
  getBuildHealthStatus() {
    const history = this.loadBuildHistory();
    const stats = this.calculateBuildStatistics(history);
    const drift = this.detectConfigurationDrift();
    const alerts = this.loadAlerts();
    
    const health = this.calculateOverallHealth(stats, drift, alerts);
    
    return {
      status: health.status,
      score: health.score,
      issues: health.issues,
      metrics: {
        totalBuilds: stats.totalBuilds,
        successRate: stats.successRate,
        lastBuild: history.builds.length > 0 ? history.builds[0].timestamp : null
      },
      configurationDrift: drift,
      activeAlerts: (alerts.active || []).length,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Get current configuration for drift detection
   */
  getCurrentConfiguration() {
    return this.captureCurrentConfiguration();
  }

  /**
   * Get configuration hash for comparison
   */
  getCurrentConfigHash() {
    const config = this.getCurrentConfiguration();
    return this.simpleHash(JSON.stringify(config));
  }

  /**
   * Load metrics (alias for loadBuildHistory for compatibility)
   */
  loadMetrics() {
    return this.loadBuildHistory();
  }

  /**
   * Save metrics (alias for saveBuildHistory for compatibility)
   */
  saveMetrics(metrics) {
    return this.saveBuildHistory(metrics);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    const alerts = this.loadAlerts();
    return alerts.active || [];
  }

  /**
   * Get recent alerts within specified days
   */
  getRecentAlerts(days) {
    const alerts = this.loadAlerts();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const allAlerts = [...(alerts.active || []), ...(alerts.resolved || [])];
    return allAlerts.filter(alert => 
      new Date(alert.timestamp) > cutoff
    );
  }

  /**
   * Check build health alerts based on metrics
   */
  checkBuildHealthAlerts(metrics) {
    // This method should work with the existing checkForAlerts method
    const latestBuild = metrics.builds && metrics.builds.length > 0 ? metrics.builds[0] : null;
    if (!latestBuild) return [];
    
    return this.checkForAlerts(latestBuild, metrics);
  }

  /**
   * Save baseline configuration for drift detection
   */
  saveBaselineConfiguration(config) {
    const configFile = path.join(this.monitoringDir, 'baseline-config.json');
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  }

  /**
   * Get baseline configuration
   */
  getBaselineConfiguration() {
    const configFile = path.join(this.monitoringDir, 'baseline-config.json');
    if (!fs.existsSync(configFile)) return null;
    
    try {
      return JSON.parse(fs.readFileSync(configFile, 'utf8'));
    } catch (error) {
      return null;
    }
  }

  // Utility methods for file operations and calculations
  loadBuildHistory() {
    if (!fs.existsSync(this.buildHistoryFile)) {
      return {
        builds: [],
        statistics: {},
        lastUpdated: new Date().toISOString()
      };
    }
    
    try {
      return JSON.parse(fs.readFileSync(this.buildHistoryFile, 'utf8'));
    } catch (error) {
      console.warn('Failed to load build history, starting fresh:', error.message);
      return {
        builds: [],
        statistics: {},
        lastUpdated: new Date().toISOString()
      };
    }
  }

  saveBuildHistory(history) {
    fs.writeFileSync(this.buildHistoryFile, JSON.stringify(history, null, 2));
  }

  loadAlerts() {
    if (!fs.existsSync(this.alertsFile)) {
      return { active: [], resolved: [] };
    }
    
    try {
      return JSON.parse(fs.readFileSync(this.alertsFile, 'utf8'));
    } catch (error) {
      console.warn('Failed to load alerts, starting fresh:', error.message);
      return { active: [], resolved: [] };
    }
  }

  saveAlerts(alerts) {
    fs.writeFileSync(this.alertsFile, JSON.stringify(alerts, null, 2));
  }

  calculateBuildStatistics(history) {
    const builds = history.builds || [];
    const totalBuilds = builds.length;
    
    if (totalBuilds === 0) {
      return {
        totalBuilds: 0,
        successRate: 0,
        averageDuration: 0,
        trend: 'unknown',
        recentFailures: 0,
        failurePatterns: []
      };
    }

    const successfulBuilds = builds.filter(build => build.success);
    const successRate = successfulBuilds.length / totalBuilds;
    
    const buildsWithDuration = builds.filter(build => build.duration);
    const averageDuration = buildsWithDuration.length > 0
      ? buildsWithDuration.reduce((sum, build) => sum + build.duration, 0) / buildsWithDuration.length
      : 0;

    // Calculate trend (last 10 vs previous 10)
    const recentBuilds = builds.slice(-10);
    const previousBuilds = builds.slice(-20, -10);
    
    let trend = 'stable';
    if (recentBuilds.length >= 5 && previousBuilds.length >= 5) {
      const recentSuccessRate = recentBuilds.filter(b => b.success).length / recentBuilds.length;
      const previousSuccessRate = previousBuilds.filter(b => b.success).length / previousBuilds.length;
      
      if (recentSuccessRate > previousSuccessRate + 0.1) {
        trend = 'improving';
      } else if (recentSuccessRate < previousSuccessRate - 0.1) {
        trend = 'declining';
      }
    }

    const recentFailures = builds.slice(-5).filter(build => !build.success).length;
    const failurePatterns = this.analyzeErrorPatterns(history);

    return {
      totalBuilds,
      successRate,
      averageDuration,
      trend,
      recentFailures,
      failurePatterns
    };
  }

  updateBuildStatistics(history) {
    history.statistics = this.calculateBuildStatistics(history);
  }

  // Configuration snapshot methods
  getPackageJsonHash() {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packageJsonPath)) return null;
    
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    return this.simpleHash(content);
  }

  getTsConfigHash() {
    const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
    if (!fs.existsSync(tsConfigPath)) return null;
    
    const content = fs.readFileSync(tsConfigPath, 'utf8');
    return this.simpleHash(content);
  }

  getTsConfigBuildHash() {
    const tsConfigBuildPath = path.join(__dirname, '..', 'tsconfig.build.json');
    if (!fs.existsSync(tsConfigBuildPath)) return null;
    
    const content = fs.readFileSync(tsConfigBuildPath, 'utf8');
    return this.simpleHash(content);
  }

  getNextConfigHash() {
    const nextConfigPath = path.join(__dirname, '..', 'next.config.ts');
    if (!fs.existsSync(nextConfigPath)) return null;
    
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    return this.simpleHash(content);
  }

  getEnvironmentVariablesSnapshot() {
    const relevantEnvVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_BASE_URL',
      'NEXT_PUBLIC_SITE_NAME',
      'NEXT_PUBLIC_ENABLE_CMS',
      'NEXT_PUBLIC_ENABLE_AUTH',
      'NEXT_PUBLIC_ENABLE_SEARCH',
      'NEXT_PUBLIC_ENABLE_AI',
      'NEXT_PUBLIC_ENABLE_MEDIA'
    ];

    const snapshot = {};
    relevantEnvVars.forEach(varName => {
      snapshot[varName] = process.env[varName] || null;
    });

    return this.simpleHash(JSON.stringify(snapshot));
  }

  getDependenciesSnapshot() {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packageJsonPath)) return null;
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {}
      };
      return this.simpleHash(JSON.stringify(deps));
    } catch (error) {
      return null;
    }
  }

  detectDependencyChanges(currentDeps, previousDeps) {
    if (!currentDeps || !previousDeps) return [];
    
    const changes = [];
    
    if (currentDeps !== previousDeps) {
      changes.push({
        file: 'dependencies',
        severity: 'medium',
        message: 'Package dependencies have been modified'
      });
    }
    
    return changes;
  }

  detectEnvironmentChanges(currentEnv, previousEnv) {
    if (!currentEnv || !previousEnv) return [];
    
    const changes = [];
    
    if (currentEnv !== previousEnv) {
      changes.push({
        file: 'environment variables',
        severity: 'low',
        message: 'Environment variables have been modified'
      });
    }
    
    return changes;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }
}

module.exports = BuildMonitor;

// Also export as default for ES6 compatibility
module.exports.default = BuildMonitor;

// CLI interface
if (require.main === module) {
  const monitor = new BuildMonitor();
  const command = process.argv[2];

  switch (command) {
    case 'status':
    case 'health':
      console.log('🏥 Build Health Status');
      console.log('======================');
      const status = monitor.getBuildHealthStatus();
      console.log(JSON.stringify(status, null, 2));
      break;

    case 'report':
      console.log('📊 Build Health Report');
      console.log('======================');
      const report = monitor.generateHealthReport();
      console.log(JSON.stringify(report, null, 2));
      break;

    case 'drift':
      console.log('🔍 Configuration Drift Detection');
      console.log('================================');
      const drift = monitor.detectConfigurationDrift();
      console.log(JSON.stringify(drift, null, 2));
      break;

    case 'record':
      const success = process.argv[3] === 'true';
      const duration = parseInt(process.argv[4]) || 0;
      const phase = process.argv[5] || 'unknown';
      
      const result = monitor.recordBuildAttempt(success, duration, [], phase);
      console.log('📝 Build attempt recorded:');
      console.log(JSON.stringify(result, null, 2));
      break;

    default:
      console.log('Build Monitor CLI');
      console.log('Usage:');
      console.log('  node scripts/build-monitor.js status    # Show current build health status');
      console.log('  node scripts/build-monitor.js report    # Generate comprehensive health report');
      console.log('  node scripts/build-monitor.js drift     # Check configuration drift');
      console.log('  node scripts/build-monitor.js record <success> <duration> <phase>');
      break;
  }
}