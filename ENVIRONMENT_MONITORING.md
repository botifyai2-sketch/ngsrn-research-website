# Environment Configuration Monitoring

This document describes the comprehensive environment configuration monitoring system that provides drift detection, health checks, proactive monitoring, and alerting for environment variables.

## Overview

The Environment Configuration Monitoring system helps ensure that your application's environment variables are properly configured, secure, and consistent across deployments. It provides:

- **Real-time Health Monitoring**: Continuous monitoring of environment variable status
- **Configuration Drift Detection**: Automatic detection of changes in environment configuration
- **Proactive Alerting**: Alerts for missing, invalid, or insecure environment variables
- **Vercel Integration**: Specialized monitoring for Vercel deployment environments
- **Security Scanning**: Detection of weak secrets and security misconfigurations

## Features

### 1. Environment Health Monitoring

The system continuously monitors the health of your environment configuration:

- **Health Score**: 0-100 score based on configuration completeness and security
- **Missing Variables**: Detection of required environment variables that are not set
- **Invalid Formats**: Validation of environment variable formats (URLs, secrets, etc.)
- **Security Issues**: Detection of weak secrets, placeholder values, and security risks
- **Feature Compatibility**: Validation of feature flag consistency

### 2. Configuration Drift Detection

Automatic detection of changes in environment configuration:

- **Snapshot Comparison**: Compares current configuration with previous snapshots
- **Change Classification**: Categorizes changes as added, removed, or modified
- **Severity Assessment**: Assigns severity levels (low, medium, high, critical) to changes
- **Impact Analysis**: Provides impact assessment and recommendations for each change

### 3. Proactive Alerting

Intelligent alerting system for environment issues:

- **Alert Types**: Missing variables, invalid formats, security risks, configuration drift
- **Severity Levels**: Info, warning, error, critical
- **Alert Management**: Acknowledge and resolve alerts through dashboard or API
- **Notification Integration**: Webhook support for Slack, Discord, and other services

### 4. Vercel Integration

Specialized monitoring for Vercel deployments:

- **Auto-provided Variables**: Recognition of Vercel auto-generated environment variables
- **URL Validation**: Validation of base URLs against Vercel deployment URLs
- **Environment Context**: Detection of production, preview, and development environments
- **Custom Domain Support**: Handling of custom domains and URL configurations

## Components

### Core Library (`src/lib/env-monitoring.ts`)

The main monitoring service that provides:

```typescript
import { envMonitoring } from '@/lib/env-monitoring';

// Take a snapshot of current environment
const snapshot = await envMonitoring.takeSnapshot();

// Generate comprehensive health status
const health = await envMonitoring.generateHealthStatus();

// Detect configuration drift
const drift = envMonitoring.detectDrift();

// Create and manage alerts
const alert = envMonitoring.createAlert({
  type: 'missing_variable',
  severity: 'error',
  variable: 'DATABASE_URL',
  message: 'Database URL is missing',
  description: 'The application requires a database connection',
  recommendation: 'Set DATABASE_URL in your environment variables'
});
```

### API Endpoints (`src/app/api/monitoring/environment/route.ts`)

RESTful API for environment monitoring:

```bash
# Get health status
GET /api/monitoring/environment?action=health

# Check for drift
GET /api/monitoring/environment?action=drift

# Get alerts
GET /api/monitoring/environment?action=alerts&severity=critical

# Take snapshot
POST /api/monitoring/environment?action=take-snapshot

# Acknowledge alert
POST /api/monitoring/environment?action=acknowledge-alert
```

### Dashboard Component (`src/components/monitoring/EnvironmentMonitoringDashboard.tsx`)

React component for visualizing monitoring data:

```tsx
import { EnvironmentMonitoringDashboard } from '@/components/monitoring/EnvironmentMonitoringDashboard';

export default function MonitoringPage() {
  return <EnvironmentMonitoringDashboard />;
}
```

### CLI Tool (`scripts/env-monitoring.js`)

Command-line interface for monitoring operations:

```bash
# Check environment health
node scripts/env-monitoring.js health --verbose

# Check for configuration drift
node scripts/env-monitoring.js drift --json

# View active alerts
node scripts/env-monitoring.js alerts --severity critical

# Run continuous monitoring
node scripts/env-monitoring.js monitor --interval 300 --webhook https://hooks.slack.com/...

# Take environment snapshot
node scripts/env-monitoring.js snapshot

# Validate configuration
node scripts/env-monitoring.js validate --ci
```

## Usage

### 1. Basic Health Check

```bash
# Check current environment health
node scripts/env-monitoring.js health

# Output:
# 🏥 Environment Health Check
# ═══════════════════════════════════════════════════════
# 
# ✅ Overall Status: HEALTHY
# 📊 Health Score: 95/100
# ⏰ Last Checked: 12/3/2024, 2:30:15 PM
# 
# 📋 Issues Summary:
#    Missing Variables: 0
#    Invalid Variables: 0
#    Security Issues: 0
#    Warnings: 1
```

### 2. Configuration Drift Detection

```bash
# Check for configuration drift
node scripts/env-monitoring.js drift --verbose

# Output:
# 🔄 Configuration Drift Check
# ═══════════════════════════════════════════════════════
# 
# ⚠️  Configuration drift detected: 2 changes
# 📸 Snapshot: 12/3/2024, 2:30:15 PM
# 🔍 Checksum: a1b2c3d4
# 
# 🟡 MEDIUM Severity Changes:
#    • NEXT_PUBLIC_GA_ID (added)
#      Impact: New environment variable NEXT_PUBLIC_GA_ID was added
#      Recommendation: Verify that NEXT_PUBLIC_GA_ID is properly configured
```

### 3. Alert Management

```bash
# View active alerts
node scripts/env-monitoring.js alerts

# View critical alerts only
node scripts/env-monitoring.js alerts --severity critical

# View resolved alerts
node scripts/env-monitoring.js alerts --resolved true
```

### 4. Continuous Monitoring

```bash
# Run continuous monitoring with 5-minute intervals
node scripts/env-monitoring.js monitor --interval 300

# Run with webhook notifications
node scripts/env-monitoring.js monitor --webhook https://hooks.slack.com/services/...

# Output:
# 🔄 Starting Continuous Environment Monitoring
# ═══════════════════════════════════════════════════════
# 📊 Check Interval: 300 seconds
# 🎯 Base URL: https://your-app.vercel.app
# 
# [12/3/2024, 2:30:15 PM] Check #1
# ──────────────────────────────────
# ✅ Status: HEALTHY (Score: 95)
```

### 5. CI/CD Integration

```bash
# Use in CI/CD pipelines with error exit codes
node scripts/env-monitoring.js health --ci

# Validate configuration in CI/CD
node scripts/env-monitoring.js validate --ci

# Check for critical issues
node scripts/env-monitoring.js alerts --severity critical --ci
```

## Dashboard Usage

### Accessing the Dashboard

1. Navigate to `/cms/environment-monitoring` in your application
2. The dashboard provides real-time monitoring information
3. Auto-refreshes every 30 seconds

### Dashboard Features

- **Overall Health Status**: Visual indicator of environment health
- **Health Score**: Numerical score (0-100) with breakdown
- **Configuration Issues**: List of missing, invalid, and security issues
- **Configuration Drift**: Visual representation of detected changes
- **Vercel Integration Status**: Compatibility and recommendations
- **Active Alerts**: Management interface for alerts

### Alert Management

- **Acknowledge Alerts**: Mark alerts as seen but not resolved
- **Resolve Alerts**: Mark alerts as fixed and resolved
- **Filter Alerts**: Filter by severity, type, or resolution status

## API Reference

### Health Check Endpoint

```http
GET /api/monitoring/environment?action=health
```

Response:
```json
{
  "status": "success",
  "data": {
    "overall": "healthy",
    "score": 95,
    "lastChecked": "2024-12-03T14:30:15.000Z",
    "issues": {
      "missing": [],
      "invalid": [],
      "warnings": ["NEXT_PUBLIC_GA_ID contains placeholder value"],
      "security": []
    },
    "drift": {
      "detected": false,
      "severity": "none",
      "changes": []
    },
    "vercel": {
      "compatible": true,
      "issues": [],
      "recommendations": []
    },
    "alerts": []
  }
}
```

### Drift Check Endpoint

```http
GET /api/monitoring/environment?action=drift
```

Response:
```json
{
  "status": "success",
  "data": {
    "detected": true,
    "changes": [
      {
        "variable": "NEXT_PUBLIC_GA_ID",
        "type": "added",
        "currentValue": "G-XXXXXXXXXX",
        "severity": "medium",
        "impact": "New environment variable NEXT_PUBLIC_GA_ID was added",
        "recommendation": "Verify that NEXT_PUBLIC_GA_ID is properly configured",
        "detectedAt": "2024-12-03T14:30:15.000Z"
      }
    ],
    "snapshot": {
      "timestamp": "2024-12-03T14:30:15.000Z",
      "phase": "full",
      "checksum": "a1b2c3d4"
    }
  }
}
```

### Alerts Endpoint

```http
GET /api/monitoring/environment?action=alerts&severity=critical
```

Response:
```json
{
  "status": "success",
  "data": {
    "alerts": [
      {
        "id": "alert_1701615015000_abc123",
        "type": "missing_variable",
        "severity": "error",
        "variable": "DATABASE_URL",
        "message": "Missing required environment variable: DATABASE_URL",
        "description": "The required environment variable DATABASE_URL is not set",
        "recommendation": "Set DATABASE_URL in your environment configuration",
        "createdAt": "2024-12-03T14:30:15.000Z",
        "acknowledged": false
      }
    ],
    "total": 1,
    "active": 1
  }
}
```

## GitHub Actions Integration

The system includes automated monitoring through GitHub Actions:

### Workflow Triggers

- **Deployment Events**: Automatically monitors after deployments
- **Scheduled Runs**: Runs every 6 hours for proactive monitoring
- **Manual Triggers**: On-demand monitoring with configurable parameters

### Workflow Features

- **Multi-environment Support**: Production, preview, and development monitoring
- **Comprehensive Checks**: Health, drift, alerts, and security scanning
- **Artifact Storage**: Saves monitoring reports for historical analysis
- **Slack Integration**: Sends notifications on failures or scheduled runs
- **Security Scanning**: Checks for hardcoded secrets and weak configurations

### Usage Examples

```yaml
# Manual trigger with specific environment
name: Monitor Production Environment
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to monitor'
        required: true
        default: 'production'
      check_type:
        description: 'Type of check'
        required: true
        default: 'full'
```

## Configuration

### Environment Variables

```bash
# Base URL for monitoring API
MONITORING_BASE_URL=https://your-app.vercel.app

# Webhook URL for notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Alert thresholds (optional)
MONITORING_HEALTH_THRESHOLD=70
MONITORING_MAX_MISSING_VARS=0
MONITORING_MAX_SECURITY_ISSUES=0
```

### Alert Thresholds

Customize alert thresholds in the CLI:

```javascript
// In scripts/env-monitoring.js
this.alertThresholds = {
  healthScore: 70,        // Minimum health score
  maxMissingVars: 0,      // Maximum missing variables
  maxSecurityIssues: 0,   // Maximum security issues
  maxCriticalDrift: 0     // Maximum critical drift changes
};
```

## Security Considerations

### Sensitive Data Handling

- **Variable Redaction**: Sensitive variables are redacted in snapshots and logs
- **Secure Storage**: Snapshots store only metadata for sensitive variables
- **API Security**: Monitoring APIs don't expose sensitive variable values
- **Audit Logging**: All monitoring activities are logged for security auditing

### Security Checks

The system performs various security checks:

- **Weak Secrets**: Detects secrets shorter than recommended length
- **Placeholder Values**: Identifies placeholder values in production
- **Hardcoded Secrets**: Scans for hardcoded secrets in source code
- **Environment Leaks**: Checks for potential environment variable leaks

## Troubleshooting

### Common Issues

1. **Monitoring API Not Responding**
   ```bash
   # Check if the application is running
   curl https://your-app.vercel.app/api/monitoring/health
   
   # Verify base URL configuration
   echo $MONITORING_BASE_URL
   ```

2. **False Positive Drift Detection**
   ```bash
   # Take a new baseline snapshot
   node scripts/env-monitoring.js snapshot
   
   # Check drift with verbose output
   node scripts/env-monitoring.js drift --verbose
   ```

3. **Missing Environment Variables**
   ```bash
   # Validate current configuration
   node scripts/env-monitoring.js validate
   
   # Check specific deployment phase
   node scripts/env-config.js validate simple
   ```

4. **Webhook Notifications Not Working**
   ```bash
   # Test webhook URL manually
   curl -X POST -H "Content-Type: application/json" \
     -d '{"text":"Test notification"}' \
     $SLACK_WEBHOOK_URL
   ```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
export DEBUG=env-monitoring:*

# Run monitoring with debug output
node scripts/env-monitoring.js health --verbose
```

## Best Practices

### 1. Regular Monitoring

- Set up scheduled monitoring every 6 hours
- Monitor after each deployment
- Use continuous monitoring for critical environments

### 2. Alert Management

- Acknowledge alerts promptly to avoid notification spam
- Resolve alerts only after fixing the underlying issue
- Review resolved alerts periodically for patterns

### 3. Security

- Rotate secrets regularly and monitor for weak secrets
- Use environment-specific configurations
- Avoid hardcoding sensitive values in source code

### 4. CI/CD Integration

- Include environment validation in deployment pipelines
- Use monitoring checks as deployment gates
- Store monitoring reports as build artifacts

### 5. Documentation

- Document all environment variables and their purposes
- Maintain environment setup guides
- Keep monitoring thresholds updated

## Support

For issues or questions about environment monitoring:

1. Check the troubleshooting section above
2. Review the monitoring dashboard for detailed error information
3. Check GitHub Actions workflow logs for CI/CD issues
4. Consult the main project documentation

## Related Documentation

- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- [Environment Troubleshooting Guide](./ENVIRONMENT_TROUBLESHOOTING_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)