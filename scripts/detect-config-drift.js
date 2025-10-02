#!/usr/bin/env node

/**
 * Configuration Drift Detection Script
 * Proactively detects configuration changes that might affect build stability
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ConfigurationDriftDetector {
  constructor() {
    this.configFiles = [
      'package.json',
      'tsconfig.json',
      'tsconfig.build.json',
      'next.config.ts',
      '.env.local',
      '.env.production',
      'tailwind.config.ts',
      'eslint.config.mjs'
    ];
    
    this.snapshotFile = path.join(__dirname, '..', '.monitoring', 'config-baseline.json');
    this.ensureMonitoringDirectory();
  }

  ensureMonitoringDirectory() {
    const monitoringDir = path.dirname(this.snapshotFile);
    if (!fs.existsSync(monitoringDir)) {
      fs.mkdirSync(monitoringDir, { recursive: true });
    }
  }

  /**
   * Create a baseline snapshot of current configuration
   */
  createBaseline() {
    console.log('📸 Creating configuration baseline...');
    
    const baseline = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      files: {},
      environmentVariables: this.captureEnvironmentVariables(),
      dependencies: this.captureDependencies()
    };

    // Capture file hashes
    this.configFiles.forEach(filename => {
      const filePath = path.join(__dirname, '..', filename);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        baseline.files[filename] = {
          hash: this.calculateHash(content),
          size: content.length,
          lastModified: fs.statSync(filePath).mtime.toISOString()
        };
        console.log(`✅ Captured ${filename}`);
      } else {
        baseline.files[filename] = null;
        console.log(`ℹ️  ${filename} not found`);
      }
    });

    // Save baseline
    fs.writeFileSync(this.snapshotFile, JSON.stringify(baseline, null, 2));
    console.log(`✅ Baseline saved to ${this.snapshotFile}`);
    
    return baseline;
  }

  /**
   * Detect drift from baseline
   */
  detectDrift() {
    console.log('🔍 Detecting configuration drift...');
    
    if (!fs.existsSync(this.snapshotFile)) {
      console.log('ℹ️  No baseline found. Creating new baseline...');
      return this.createBaseline();
    }

    const baseline = JSON.parse(fs.readFileSync(this.snapshotFile, 'utf8'));
    const current = this.captureCurrentState();
    
    const driftReport = {
      timestamp: new Date().toISOString(),
      baselineTimestamp: baseline.timestamp,
      hasDrift: false,
      changes: [],
      severity: 'low',
      recommendations: []
    };

    // Check file changes
    this.configFiles.forEach(filename => {
      const baselineFile = baseline.files[filename];
      const currentFile = current.files[filename];
      
      if (!baselineFile && currentFile) {
        driftReport.hasDrift = true;
        driftReport.changes.push({
          type: 'file_added',
          file: filename,
          severity: this.getFileSeverity(filename),
          message: `New configuration file: ${filename}`,
          details: {
            size: currentFile.size,
            lastModified: currentFile.lastModified
          }
        });
      } else if (baselineFile && !currentFile) {
        driftReport.hasDrift = true;
        driftReport.changes.push({
          type: 'file_removed',
          file: filename,
          severity: this.getFileSeverity(filename),
          message: `Configuration file removed: ${filename}`,
          details: {
            previousSize: baselineFile.size,
            previousModified: baselineFile.lastModified
          }
        });
      } else if (baselineFile && currentFile && baselineFile.hash !== currentFile.hash) {
        driftReport.hasDrift = true;
        
        const changeDetails = this.analyzeFileChange(filename, baselineFile, currentFile);
        
        driftReport.changes.push({
          type: 'file_modified',
          file: filename,
          severity: this.getFileSeverity(filename),
          message: `Configuration file modified: ${filename}`,
          details: {
            ...changeDetails,
            previousHash: baselineFile.hash,
            currentHash: currentFile.hash,
            previousModified: baselineFile.lastModified,
            currentModified: currentFile.lastModified
          }
        });
      }
    });

    // Check dependency changes
    const depChanges = this.compareDependencies(baseline.dependencies, current.dependencies);
    if (depChanges.length > 0) {
      driftReport.hasDrift = true;
      driftReport.changes.push(...depChanges);
    }

    // Check environment variable changes
    const envChanges = this.compareEnvironmentVariables(baseline.environmentVariables, current.environmentVariables);
    if (envChanges.length > 0) {
      driftReport.hasDrift = true;
      driftReport.changes.push(...envChanges);
    }

    // Determine overall severity
    driftReport.severity = this.calculateOverallSeverity(driftReport.changes);
    
    // Generate recommendations
    driftReport.recommendations = this.generateRecommendations(driftReport.changes);

    return driftReport;
  }

  /**
   * Capture current configuration state
   */
  captureCurrentState() {
    const current = {
      timestamp: new Date().toISOString(),
      files: {},
      environmentVariables: this.captureEnvironmentVariables(),
      dependencies: this.captureDependencies()
    };

    this.configFiles.forEach(filename => {
      const filePath = path.join(__dirname, '..', filename);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        current.files[filename] = {
          hash: this.calculateHash(content),
          size: content.length,
          lastModified: fs.statSync(filePath).mtime.toISOString()
        };
      } else {
        current.files[filename] = null;
      }
    });

    return current;
  }

  /**
   * Analyze specific file changes
   */
  analyzeFileChange(filename, baseline, current) {
    const details = {
      sizeChange: current.size - baseline.size,
      sizeChangePercent: Math.round(((current.size - baseline.size) / baseline.size) * 100)
    };

    // File-specific analysis
    if (filename === 'package.json') {
      try {
        const baselineContent = this.getFileContent(filename, baseline.lastModified);
        const currentContent = this.getFileContent(filename, current.lastModified);
        
        if (baselineContent && currentContent) {
          const baselineJson = JSON.parse(baselineContent);
          const currentJson = JSON.parse(currentContent);
          
          details.scriptChanges = this.compareObjects(baselineJson.scripts || {}, currentJson.scripts || {});
          details.dependencyChanges = this.compareObjects(baselineJson.dependencies || {}, currentJson.dependencies || {});
          details.devDependencyChanges = this.compareObjects(baselineJson.devDependencies || {}, currentJson.devDependencies || {});
        }
      } catch (error) {
        details.parseError = error.message;
      }
    }

    return details;
  }

  /**
   * Compare two objects and return differences
   */
  compareObjects(baseline, current) {
    const changes = {
      added: [],
      removed: [],
      modified: []
    };

    // Check for added and modified
    Object.keys(current).forEach(key => {
      if (!(key in baseline)) {
        changes.added.push({ key, value: current[key] });
      } else if (baseline[key] !== current[key]) {
        changes.modified.push({ 
          key, 
          oldValue: baseline[key], 
          newValue: current[key] 
        });
      }
    });

    // Check for removed
    Object.keys(baseline).forEach(key => {
      if (!(key in current)) {
        changes.removed.push({ key, value: baseline[key] });
      }
    });

    return changes;
  }

  /**
   * Compare dependencies
   */
  compareDependencies(baseline, current) {
    const changes = [];
    
    if (baseline !== current) {
      changes.push({
        type: 'dependencies_changed',
        file: 'package.json',
        severity: 'medium',
        message: 'Package dependencies have been modified',
        details: {
          baselineHash: baseline,
          currentHash: current
        }
      });
    }
    
    return changes;
  }

  /**
   * Compare environment variables
   */
  compareEnvironmentVariables(baseline, current) {
    const changes = [];
    
    if (baseline !== current) {
      changes.push({
        type: 'environment_changed',
        file: 'environment variables',
        severity: 'low',
        message: 'Environment variables have been modified',
        details: {
          baselineHash: baseline,
          currentHash: current
        }
      });
    }
    
    return changes;
  }

  /**
   * Get file severity based on impact
   */
  getFileSeverity(filename) {
    const highImpact = ['package.json', 'tsconfig.build.json', 'next.config.ts'];
    const mediumImpact = ['tsconfig.json', 'tailwind.config.ts'];
    
    if (highImpact.includes(filename)) return 'high';
    if (mediumImpact.includes(filename)) return 'medium';
    return 'low';
  }

  /**
   * Calculate overall severity
   */
  calculateOverallSeverity(changes) {
    const severities = changes.map(change => change.severity);
    
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations based on changes
   */
  generateRecommendations(changes) {
    const recommendations = [];
    
    const highImpactChanges = changes.filter(change => change.severity === 'high');
    if (highImpactChanges.length > 0) {
      recommendations.push({
        priority: 'high',
        message: 'High-impact configuration changes detected',
        actions: [
          'Run build validation: npm run build:validate',
          'Test build locally before deployment',
          'Review changes in: ' + highImpactChanges.map(c => c.file).join(', ')
        ]
      });
    }

    const packageJsonChanges = changes.filter(change => change.file === 'package.json');
    if (packageJsonChanges.length > 0) {
      recommendations.push({
        priority: 'medium',
        message: 'Package.json has been modified',
        actions: [
          'Verify all dependencies are properly installed',
          'Check for breaking changes in updated packages',
          'Run tests to ensure compatibility'
        ]
      });
    }

    const tsConfigChanges = changes.filter(change => 
      change.file === 'tsconfig.json' || change.file === 'tsconfig.build.json'
    );
    if (tsConfigChanges.length > 0) {
      recommendations.push({
        priority: 'medium',
        message: 'TypeScript configuration has been modified',
        actions: [
          'Run TypeScript validation: npm run type-check:build',
          'Ensure test files are properly excluded from production build',
          'Verify compiler options are compatible with Next.js'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Utility methods
   */
  calculateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  captureEnvironmentVariables() {
    const relevantVars = [
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
    relevantVars.forEach(varName => {
      snapshot[varName] = process.env[varName] || null;
    });

    return this.calculateHash(JSON.stringify(snapshot));
  }

  captureDependencies() {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packageJsonPath)) return null;
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {}
      };
      return this.calculateHash(JSON.stringify(deps));
    } catch (error) {
      return null;
    }
  }

  getFileContent(filename, timestamp) {
    const filePath = path.join(__dirname, '..', filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return null;
  }

  /**
   * Print drift report
   */
  printDriftReport(report) {
    console.log('');
    console.log('📊 Configuration Drift Report');
    console.log('═'.repeat(35));
    console.log(`Baseline: ${new Date(report.baselineTimestamp).toLocaleString()}`);
    console.log(`Current:  ${new Date(report.timestamp).toLocaleString()}`);
    console.log('');

    if (!report.hasDrift) {
      console.log('✅ No configuration drift detected');
      return;
    }

    console.log(`⚠️  Configuration drift detected (${report.severity.toUpperCase()} severity)`);
    console.log(`📋 ${report.changes.length} changes found:`);
    console.log('');

    // Group changes by severity
    const changesBySeverity = {
      high: report.changes.filter(c => c.severity === 'high'),
      medium: report.changes.filter(c => c.severity === 'medium'),
      low: report.changes.filter(c => c.severity === 'low')
    };

    ['high', 'medium', 'low'].forEach(severity => {
      const changes = changesBySeverity[severity];
      if (changes.length === 0) return;

      const emoji = severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : 'ℹ️';
      console.log(`${emoji} ${severity.toUpperCase()} SEVERITY (${changes.length} changes):`);
      
      changes.forEach(change => {
        console.log(`   • ${change.message}`);
        if (change.details && change.details.sizeChange) {
          const sizeChange = change.details.sizeChange > 0 ? `+${change.details.sizeChange}` : change.details.sizeChange;
          console.log(`     Size change: ${sizeChange} bytes (${change.details.sizeChangePercent}%)`);
        }
      });
      console.log('');
    });

    // Print recommendations
    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach(rec => {
        const emoji = rec.priority === 'high' ? '🚨' : rec.priority === 'medium' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} ${rec.message}`);
        rec.actions.forEach(action => {
          console.log(`   - ${action}`);
        });
        console.log('');
      });
    }
  }
}

async function main() {
  const detector = new ConfigurationDriftDetector();
  const command = process.argv[2];

  switch (command) {
    case 'baseline':
      detector.createBaseline();
      break;

    case 'detect':
    case undefined:
      const report = detector.detectDrift();
      detector.printDriftReport(report);
      
      // Exit with error code if high severity drift is detected
      if (report.severity === 'high') {
        process.exit(1);
      }
      break;

    case 'watch':
      console.log('👀 Watching for configuration changes...');
      console.log('Press Ctrl+C to stop');
      
      setInterval(() => {
        const report = detector.detectDrift();
        if (report.hasDrift) {
          console.log('\n🔔 Configuration change detected!');
          detector.printDriftReport(report);
        }
      }, 30000); // Check every 30 seconds
      break;

    default:
      console.log('Configuration Drift Detector');
      console.log('Usage:');
      console.log('  node scripts/detect-config-drift.js [command]');
      console.log('');
      console.log('Commands:');
      console.log('  baseline  Create a new configuration baseline');
      console.log('  detect    Detect drift from baseline (default)');
      console.log('  watch     Continuously watch for changes');
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Configuration drift detection failed:', error);
    process.exit(1);
  });
}

module.exports = ConfigurationDriftDetector;