#!/usr/bin/env node

/**
 * Environment Configuration Monitoring CLI
 * Provides command-line interface for environment monitoring and alerting
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class EnvironmentMonitoringCLI {
  constructor() {
    this.baseUrl = process.env.MONITORING_BASE_URL || 'http://localhost:3000';
    this.alertThresholds = {
      healthScore: 70,
      maxMissingVars: 0,
      maxSecurityIssues: 0,
      maxCriticalDrift: 0
    };
  }

  async run() {
    const command = process.argv[2];
    const options = this.parseOptions(process.argv.slice(3));

    try {
      switch (command) {
        case 'health':
          await this.checkHealth(options);
          break;
        
        case 'drift':
          await this.checkDrift(options);
          break;
        
        case 'alerts':
          await this.checkAlerts(options);
          break;
        
        case 'monitor':
          await this.runContinuousMonitoring(options);
          break;
        
        case 'snapshot':
          await this.takeSnapshot(options);
          break;
        
        case 'validate':
          await this.validateConfiguration(options);
          break;
        
        default:
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Monitoring command failed:', error.message);
      process.exit(1);
    }
  }

  async checkHealth(options = {}) {
    console.log('🏥 Environment Health Check');
    console.log('═'.repeat(50));

    try {
      const healthData = await this.makeRequest('/api/monitoring/environment?action=health');
      
      if (!healthData.data) {
        throw new Error('No health data received');
      }

      const health = healthData.data;
      
      // Display overall status
      const statusIcon = this.getStatusIcon(health.overall);
      console.log(`\n${statusIcon} Overall Status: ${health.overall.toUpperCase()}`);
      console.log(`📊 Health Score: ${health.score}/100`);
      console.log(`⏰ Last Checked: ${new Date(health.lastChecked).toLocaleString()}`);

      // Display issues summary
      console.log('\n📋 Issues Summary:');
      console.log(`   Missing Variables: ${health.issues.missing.length}`);
      console.log(`   Invalid Variables: ${health.issues.invalid.length}`);
      console.log(`   Security Issues: ${health.issues.security.length}`);
      console.log(`   Warnings: ${health.issues.warnings.length}`);

      // Display detailed issues
      if (health.issues.missing.length > 0) {
        console.log('\n❌ Missing Required Variables:');
        health.issues.missing.forEach(variable => {
          console.log(`   • ${variable}`);
        });
      }

      if (health.issues.invalid.length > 0) {
        console.log('\n⚠️  Invalid Variables:');
        health.issues.invalid.forEach(variable => {
          console.log(`   • ${variable}`);
        });
      }

      if (health.issues.security.length > 0) {
        console.log('\n🔒 Security Issues:');
        health.issues.security.forEach(issue => {
          console.log(`   • ${issue}`);
        });
      }

      // Display drift information
      if (health.drift.detected) {
        console.log(`\n🔄 Configuration Drift: ${health.drift.severity.toUpperCase()}`);
        console.log(`   Changes Detected: ${health.drift.changes.length}`);
        
        if (options.verbose) {
          health.drift.changes.forEach(change => {
            console.log(`   • ${change.variable} (${change.type}): ${change.impact}`);
          });
        }
      }

      // Display Vercel compatibility
      if (health.vercel) {
        const vercelIcon = health.vercel.compatible ? '✅' : '⚠️';
        console.log(`\n${vercelIcon} Vercel Compatibility: ${health.vercel.compatible ? 'Compatible' : 'Issues Detected'}`);
        
        if (health.vercel.issues.length > 0) {
          console.log('   Issues:');
          health.vercel.issues.forEach(issue => {
            console.log(`   • ${issue}`);
          });
        }
      }

      // Display active alerts
      if (health.alerts.length > 0) {
        console.log(`\n🚨 Active Alerts: ${health.alerts.length}`);
        
        if (options.verbose) {
          health.alerts.slice(0, 5).forEach(alert => {
            const severityIcon = this.getSeverityIcon(alert.severity);
            console.log(`   ${severityIcon} ${alert.variable}: ${alert.message}`);
          });
        }
      }

      // Check against thresholds for CI/CD
      if (options.ci) {
        const passed = this.checkThresholds(health);
        if (!passed) {
          console.log('\n❌ Health check failed CI/CD thresholds');
          process.exit(1);
        } else {
          console.log('\n✅ Health check passed CI/CD thresholds');
        }
      }

      // Output JSON for automation
      if (options.json) {
        console.log('\n' + JSON.stringify(health, null, 2));
      }

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    }
  }

  async checkDrift(options = {}) {
    console.log('🔄 Configuration Drift Check');
    console.log('═'.repeat(50));

    try {
      const driftData = await this.makeRequest('/api/monitoring/environment?action=drift');
      
      if (!driftData.data) {
        throw new Error('No drift data received');
      }

      const drift = driftData.data;
      
      if (!drift.detected) {
        console.log('✅ No configuration drift detected');
        return;
      }

      console.log(`\n⚠️  Configuration drift detected: ${drift.changes.length} changes`);
      console.log(`📸 Snapshot: ${new Date(drift.snapshot.timestamp).toLocaleString()}`);
      console.log(`🔍 Checksum: ${drift.snapshot.checksum}`);

      // Group changes by severity
      const changesBySeverity = drift.changes.reduce((acc, change) => {
        if (!acc[change.severity]) acc[change.severity] = [];
        acc[change.severity].push(change);
        return acc;
      }, {});

      // Display changes by severity
      ['critical', 'high', 'medium', 'low'].forEach(severity => {
        if (changesBySeverity[severity]) {
          const severityIcon = this.getSeverityIcon(severity);
          console.log(`\n${severityIcon} ${severity.toUpperCase()} Severity Changes:`);
          
          changesBySeverity[severity].forEach(change => {
            console.log(`   • ${change.variable} (${change.type})`);
            console.log(`     Impact: ${change.impact}`);
            console.log(`     Recommendation: ${change.recommendation}`);
            
            if (change.previousValue && change.currentValue) {
              console.log(`     Previous: ${change.previousValue}`);
              console.log(`     Current: ${change.currentValue}`);
            }
            console.log('');
          });
        }
      });

      // Output JSON for automation
      if (options.json) {
        console.log(JSON.stringify(drift, null, 2));
      }

      // Exit with error code if critical drift detected
      if (changesBySeverity.critical && options.ci) {
        console.log('❌ Critical configuration drift detected');
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Drift check failed:', error.message);
      process.exit(1);
    }
  }

  async checkAlerts(options = {}) {
    console.log('🚨 Environment Alerts Check');
    console.log('═'.repeat(50));

    try {
      let url = '/api/monitoring/environment?action=alerts';
      
      // Add filters
      if (options.severity) url += `&severity=${options.severity}`;
      if (options.type) url += `&type=${options.type}`;
      if (options.resolved !== undefined) url += `&resolved=${options.resolved}`;

      const alertsData = await this.makeRequest(url);
      
      if (!alertsData.data) {
        throw new Error('No alerts data received');
      }

      const { alerts, total, active } = alertsData.data;
      
      console.log(`\n📊 Alerts Summary:`);
      console.log(`   Total Alerts: ${total}`);
      console.log(`   Active Alerts: ${active}`);
      console.log(`   Resolved Alerts: ${total - active}`);

      if (alerts.length === 0) {
        console.log('\n✅ No alerts found');
        return;
      }

      // Group alerts by severity
      const alertsBySeverity = alerts.reduce((acc, alert) => {
        if (!acc[alert.severity]) acc[alert.severity] = [];
        acc[alert.severity].push(alert);
        return acc;
      }, {});

      // Display alerts by severity
      ['critical', 'error', 'warning', 'info'].forEach(severity => {
        if (alertsBySeverity[severity]) {
          const severityIcon = this.getSeverityIcon(severity);
          console.log(`\n${severityIcon} ${severity.toUpperCase()} Alerts:`);
          
          alertsBySeverity[severity].forEach(alert => {
            const status = alert.resolvedAt ? '✅ Resolved' : 
                          alert.acknowledged ? '👁️ Acknowledged' : '🔴 Active';
            
            console.log(`   • ${alert.variable}: ${alert.message}`);
            console.log(`     Status: ${status}`);
            console.log(`     Created: ${new Date(alert.createdAt).toLocaleString()}`);
            
            if (alert.resolvedAt) {
              console.log(`     Resolved: ${new Date(alert.resolvedAt).toLocaleString()}`);
            }
            
            if (options.verbose) {
              console.log(`     Description: ${alert.description}`);
              console.log(`     Recommendation: ${alert.recommendation}`);
            }
            console.log('');
          });
        }
      });

      // Output JSON for automation
      if (options.json) {
        console.log(JSON.stringify(alertsData.data, null, 2));
      }

      // Exit with error code if critical alerts exist
      if (alertsBySeverity.critical && options.ci) {
        const activeCritical = alertsBySeverity.critical.filter(a => !a.resolvedAt);
        if (activeCritical.length > 0) {
          console.log(`❌ ${activeCritical.length} active critical alerts found`);
          process.exit(1);
        }
      }

    } catch (error) {
      console.error('❌ Alerts check failed:', error.message);
      process.exit(1);
    }
  }

  async runContinuousMonitoring(options = {}) {
    const interval = options.interval || 300; // 5 minutes default
    
    console.log('🔄 Starting Continuous Environment Monitoring');
    console.log('═'.repeat(50));
    console.log(`📊 Check Interval: ${interval} seconds`);
    console.log(`🎯 Base URL: ${this.baseUrl}`);
    console.log('');

    let checkCount = 0;

    const runCheck = async () => {
      checkCount++;
      const timestamp = new Date().toLocaleString();
      
      console.log(`\n[${timestamp}] Check #${checkCount}`);
      console.log('─'.repeat(30));

      try {
        // Quick health check
        const healthData = await this.makeRequest('/api/monitoring/environment?action=health');
        const health = healthData.data;
        
        const statusIcon = this.getStatusIcon(health.overall);
        console.log(`${statusIcon} Status: ${health.overall.toUpperCase()} (Score: ${health.score})`);
        
        // Check for issues
        const totalIssues = health.issues.missing.length + 
                           health.issues.invalid.length + 
                           health.issues.security.length;
        
        if (totalIssues > 0) {
          console.log(`⚠️  Issues: ${totalIssues} (Missing: ${health.issues.missing.length}, Invalid: ${health.issues.invalid.length}, Security: ${health.issues.security.length})`);
        }
        
        // Check for drift
        if (health.drift.detected) {
          console.log(`🔄 Drift: ${health.drift.severity.toUpperCase()} (${health.drift.changes.length} changes)`);
        }
        
        // Check for alerts
        const activeAlerts = health.alerts.filter(a => !a.resolvedAt);
        if (activeAlerts.length > 0) {
          console.log(`🚨 Active Alerts: ${activeAlerts.length}`);
          
          // Show critical alerts
          const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
          if (criticalAlerts.length > 0) {
            console.log(`   🔴 Critical: ${criticalAlerts.length}`);
            criticalAlerts.forEach(alert => {
              console.log(`      • ${alert.variable}: ${alert.message}`);
            });
          }
        }

        // Send notifications if configured
        if (options.webhook && (totalIssues > 0 || health.drift.detected || activeAlerts.length > 0)) {
          await this.sendWebhookNotification(options.webhook, health);
        }

      } catch (error) {
        console.log(`❌ Check failed: ${error.message}`);
      }
    };

    // Run initial check
    await runCheck();

    // Set up interval
    const intervalId = setInterval(runCheck, interval * 1000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping continuous monitoring...');
      clearInterval(intervalId);
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n🛑 Stopping continuous monitoring...');
      clearInterval(intervalId);
      process.exit(0);
    });
  }

  async takeSnapshot(options = {}) {
    console.log('📸 Taking Environment Snapshot');
    console.log('═'.repeat(50));

    try {
      const snapshotData = await this.makeRequest('/api/monitoring/environment?action=take-snapshot', 'POST');
      
      if (!snapshotData.data) {
        throw new Error('No snapshot data received');
      }

      const snapshot = snapshotData.data;
      
      console.log('✅ Snapshot taken successfully');
      console.log(`📅 Timestamp: ${new Date(snapshot.timestamp).toLocaleString()}`);
      console.log(`📦 Phase: ${snapshot.phase}`);
      console.log(`🔍 Checksum: ${snapshot.checksum}`);
      console.log(`📊 Variables: ${snapshot.variableCount}`);

      // Output JSON for automation
      if (options.json) {
        console.log('\n' + JSON.stringify(snapshot, null, 2));
      }

    } catch (error) {
      console.error('❌ Snapshot failed:', error.message);
      process.exit(1);
    }
  }

  async validateConfiguration(options = {}) {
    console.log('✅ Environment Configuration Validation');
    console.log('═'.repeat(50));

    try {
      // Use the existing env-config.js validation
      const { spawn } = require('child_process');
      const envConfigPath = path.join(__dirname, 'env-config.js');
      
      const validation = spawn('node', [envConfigPath, 'validate'], {
        stdio: 'pipe',
        env: process.env
      });

      let output = '';
      let errorOutput = '';

      validation.stdout.on('data', (data) => {
        output += data.toString();
      });

      validation.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      validation.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Environment validation passed');
          console.log(output);
        } else {
          console.log('❌ Environment validation failed');
          console.log(output);
          console.error(errorOutput);
          
          if (options.ci) {
            process.exit(1);
          }
        }
      });

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  // Helper methods

  parseOptions(args) {
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const key = arg.substring(2);
        const nextArg = args[i + 1];
        
        if (nextArg && !nextArg.startsWith('--')) {
          options[key] = nextArg;
          i++; // Skip next arg
        } else {
          options[key] = true;
        }
      }
    }
    
    return options;
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Environment-Monitoring-CLI/1.0'
        }
      };

      const req = client.request(url, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
            }
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  async sendWebhookNotification(webhookUrl, healthData) {
    try {
      const payload = {
        text: `Environment monitoring alert`,
        attachments: [{
          color: this.getSlackColor(healthData.overall),
          title: `Environment Health: ${healthData.overall.toUpperCase()}`,
          fields: [
            {
              title: 'Health Score',
              value: `${healthData.score}/100`,
              short: true
            },
            {
              title: 'Issues',
              value: `Missing: ${healthData.issues.missing.length}, Security: ${healthData.issues.security.length}`,
              short: true
            }
          ],
          timestamp: new Date().toISOString()
        }]
      };

      await this.makeRequest(webhookUrl, 'POST', payload);
      console.log('📤 Webhook notification sent');
    } catch (error) {
      console.error('❌ Webhook notification failed:', error.message);
    }
  }

  checkThresholds(health) {
    return health.score >= this.alertThresholds.healthScore &&
           health.issues.missing.length <= this.alertThresholds.maxMissingVars &&
           health.issues.security.length <= this.alertThresholds.maxSecurityIssues &&
           health.drift.changes.filter(c => c.severity === 'critical').length <= this.alertThresholds.maxCriticalDrift;
  }

  getStatusIcon(status) {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🔴';
      default: return '❓';
    }
  }

  getSeverityIcon(severity) {
    switch (severity) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🔴';
      case 'low': return '🔵';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      default: return '❓';
    }
  }

  getSlackColor(status) {
    switch (status) {
      case 'healthy': return 'good';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      case 'critical': return 'danger';
      default: return '#808080';
    }
  }

  showHelp() {
    console.log(`
Environment Configuration Monitoring CLI

Usage: node env-monitoring.js <command> [options]

Commands:
  health      Check environment health status
  drift       Check for configuration drift
  alerts      Check environment alerts
  monitor     Run continuous monitoring
  snapshot    Take environment snapshot
  validate    Validate environment configuration

Options:
  --verbose   Show detailed output
  --json      Output JSON format
  --ci        Exit with error code on failures (for CI/CD)
  --interval  Monitoring interval in seconds (default: 300)
  --webhook   Webhook URL for notifications
  --severity  Filter alerts by severity (info|warning|error|critical)
  --type      Filter alerts by type
  --resolved  Filter by resolved status (true|false)

Examples:
  node env-monitoring.js health --verbose
  node env-monitoring.js drift --json
  node env-monitoring.js alerts --severity critical
  node env-monitoring.js monitor --interval 60 --webhook https://hooks.slack.com/...
  node env-monitoring.js health --ci  # For CI/CD pipelines

Environment Variables:
  MONITORING_BASE_URL  Base URL for monitoring API (default: http://localhost:3000)
`);
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new EnvironmentMonitoringCLI();
  cli.run().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}

module.exports = EnvironmentMonitoringCLI;