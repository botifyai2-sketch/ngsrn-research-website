# Build Monitoring and Health Checks

This document describes the comprehensive build monitoring and health check system implemented for the NGSRN website deployment.

## Overview

The build monitoring system provides:

- **Build Success Rate Monitoring**: Tracks build attempts and success rates over time
- **Configuration Drift Detection**: Proactively detects changes that might affect build stability
- **Automated Alerts**: Generates alerts for build health issues and performance degradation
- **Health Dashboard**: Web-based dashboard for monitoring build health
- **Automated Fixes**: Integration with automated fix capabilities

## Components

### 1. Build Monitor (`scripts/build-monitor.js`)

Core monitoring system that tracks build attempts and generates health reports.

**Features:**
- Records build attempts with success/failure status
- Tracks build duration and performance metrics
- Detects configuration drift between builds
- Generates alerts for consecutive failures and performance issues
- Provides health scoring and recommendations

**Usage:**
```bash
# Generate health report
npm run monitor:health

# Check configuration drift
npm run monitor:drift

# Record a build attempt
npm run monitor:record true 45000 full
```

### 2. Build Health API (`src/app/api/monitoring/build-health/route.ts`)

REST API endpoint for accessing build health data.

**Endpoints:**
- `GET /api/monitoring/build-health?action=health` - Get health report
- `GET /api/monitoring/build-health?action=history` - Get build history
- `GET /api/monitoring/build-health?action=alerts` - Get active alerts
- `GET /api/monitoring/build-health?action=drift` - Get configuration drift
- `POST /api/monitoring/build-health` - Record build attempt or resolve alerts

### 3. Build Health Dashboard (`src/components/monitoring/BuildHealthDashboard.tsx`)

React component providing a comprehensive dashboard for build health monitoring.

**Features:**
- Real-time health status display
- Build success rate trends
- Configuration drift alerts
- Active alert management
- Actionable recommendations
- Recent build history

**Access:** `/cms/build-monitoring`

### 4. Configuration Drift Detection (`scripts/detect-config-drift.js`)

Proactive detection of configuration changes that might affect build stability.

**Features:**
- Creates configuration baselines
- Detects changes in critical files (package.json, tsconfig.json, etc.)
- Analyzes dependency changes
- Provides severity assessment and recommendations

**Usage:**
```bash
# Create configuration baseline
npm run monitor:config-baseline

# Detect configuration drift
npm run monitor:config-drift

# Watch for changes continuously
npm run monitor:config-watch
```

### 5. Enhanced Build Validation (`scripts/validate-build.js`)

Enhanced build validation with integrated monitoring capabilities.

**Features:**
- Records validation attempts
- Checks for configuration drift before validation
- Provides health summaries after validation
- Integrates with automated fix system

**Usage:**
```bash
# Run validation with monitoring
npm run build:validate --monitor

# Run validation with auto-fix and monitoring
npm run build:validate:auto-fix --monitor
```

### 6. Build Wrapper (`scripts/build-with-monitoring.js`)

Wrapper script that automatically monitors any build process.

**Features:**
- Wraps any build command with monitoring
- Records build attempts automatically
- Performs pre and post-build checks
- Generates health reports after builds

**Usage:**
```bash
# Run build with monitoring
npm run build:with-monitoring

# Or wrap any command
node scripts/build-with-monitoring.js npm run build
```

### 7. Enhanced Health Check (`scripts/health-check.js`)

Comprehensive health check including build monitoring integration.

**Features:**
- Checks build health API endpoints
- Validates monitoring system functionality
- Provides fallback to local monitoring
- Integrates with deployment health checks

## Monitoring Data

### Build Records

Each build attempt is recorded with:
- Timestamp and duration
- Success/failure status
- Build phase (simple/full)
- Errors and warnings
- Environment information
- Configuration snapshot
- Performance metrics

### Configuration Snapshots

Configuration drift detection tracks:
- File hashes for critical configuration files
- Dependency versions
- Environment variable changes
- TypeScript configuration changes

### Alerts

The system generates alerts for:
- Consecutive build failures (3+ failures)
- Performance degradation (50%+ duration increase)
- High-impact configuration changes
- New error patterns

### Health Scoring

Overall health score (0-100) based on:
- Build success rate (weighted 30%)
- Configuration drift severity (up to -20 points)
- Active alerts (high: -15, medium: -5 each)
- Recent failure count

## Configuration

### Environment Variables

- `ENABLE_BUILD_MONITORING=true` - Enable monitoring in build processes
- `AUTO_FIX_DEPLOYMENT=true` - Enable automated fixes

### Monitoring Directory

All monitoring data is stored in `.monitoring/`:
- `build-history.json` - Build attempt records
- `alerts.json` - Active and resolved alerts
- `config-baseline.json` - Configuration baseline for drift detection

## Integration with Existing Systems

### Build Process Integration

The monitoring system integrates with existing build scripts:

```json
{
  "scripts": {
    "build": "npm run build:validate && next build --turbopack",
    "build:validate": "npm run type-check:build && node scripts/validate-build.js",
    "build:monitor": "ENABLE_BUILD_MONITORING=true npm run build:validate --monitor"
  }
}
```

### Vercel Deployment Integration

For Vercel deployments, monitoring can be enabled by:

1. Setting environment variables in Vercel dashboard
2. Using monitored build commands in `vercel.json`
3. Accessing health dashboard at `/cms/build-monitoring`

### CI/CD Integration

The monitoring system can be integrated with CI/CD pipelines:

```yaml
# Example GitHub Actions integration
- name: Build with Monitoring
  run: npm run build:with-monitoring
  env:
    ENABLE_BUILD_MONITORING: true

- name: Check Build Health
  run: npm run monitor:health
```

## Alerts and Notifications

### Alert Types

1. **Consecutive Failures**: 3+ consecutive build failures
2. **Performance Degradation**: 50%+ increase in build duration
3. **Configuration Drift**: High-impact configuration changes
4. **New Error Patterns**: Previously unseen error types

### Alert Management

Alerts can be managed through:
- Web dashboard (`/cms/build-monitoring`)
- API endpoints (`/api/monitoring/build-health`)
- Command line tools (`npm run monitor:health`)

### Auto-Resolution

Alerts are automatically resolved after:
- 7 days for inactive alerts
- Manual resolution through dashboard
- Successful builds that address the underlying issue

## Recommendations System

The monitoring system provides actionable recommendations based on:

### Success Rate Issues
- Run automated fixes
- Review error patterns
- Check configuration drift

### Configuration Drift
- Validate TypeScript configuration
- Test builds with current configuration
- Review specific file changes

### Performance Issues
- Analyze bundle size
- Check for unnecessary dependencies
- Review TypeScript configuration

## Best Practices

### Regular Monitoring

1. **Daily**: Check build health dashboard
2. **Weekly**: Review configuration drift reports
3. **Monthly**: Analyze build trends and patterns

### Proactive Maintenance

1. **Create Baselines**: After major configuration changes
2. **Monitor Drift**: Before important deployments
3. **Review Alerts**: Address high-severity alerts promptly

### Integration Guidelines

1. **Enable Monitoring**: Use `ENABLE_BUILD_MONITORING=true` in production
2. **Use Wrappers**: Prefer `build:with-monitoring` for comprehensive tracking
3. **Check Health**: Include health checks in deployment pipelines

## Troubleshooting

### Common Issues

1. **Monitoring Data Missing**
   - Ensure `.monitoring` directory exists and is writable
   - Check that monitoring is enabled with environment variables

2. **Configuration Drift False Positives**
   - Create new baseline after intentional configuration changes
   - Review drift detection sensitivity settings

3. **API Endpoints Not Working**
   - Verify Next.js API routes are properly deployed
   - Check that monitoring directory exists on server

### Debug Commands

```bash
# Check monitoring system status
npm run monitor:health

# Verify configuration drift detection
npm run monitor:config-drift

# Test build monitoring
ENABLE_BUILD_MONITORING=true npm run build:validate --monitor

# Check health API
curl https://your-app.vercel.app/api/monitoring/build-health?action=health
```

## Future Enhancements

Planned improvements include:

1. **Real-time Notifications**: Slack/email integration for critical alerts
2. **Trend Analysis**: Machine learning for build failure prediction
3. **Performance Benchmarking**: Automated performance regression detection
4. **Integration Testing**: Automated testing of monitoring components
5. **Custom Metrics**: User-defined monitoring metrics and thresholds

## Support

For issues with the build monitoring system:

1. Check the troubleshooting section above
2. Review monitoring logs in `.monitoring/` directory
3. Use debug commands to isolate issues
4. Check API endpoints for connectivity issues

The monitoring system is designed to be resilient and fail gracefully, ensuring that build processes continue to work even if monitoring components encounter issues.