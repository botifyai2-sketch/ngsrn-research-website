# Deployment and Monitoring Guide

This document outlines the deployment pipeline, monitoring setup, and operational procedures for the NGSRN Research Website.

## Table of Contents

1. [Deployment Pipeline](#deployment-pipeline)
2. [Environment Configuration](#environment-configuration)
3. [Monitoring and Analytics](#monitoring-and-analytics)
4. [Backup and Recovery](#backup-and-recovery)
5. [Performance Monitoring](#performance-monitoring)
6. [Error Tracking](#error-tracking)
7. [Operational Procedures](#operational-procedures)

## Deployment Pipeline

### Overview

The application uses a CI/CD pipeline with GitHub Actions for automated testing and deployment to Vercel.

### Pipeline Stages

1. **Test Stage**
   - Type checking with TypeScript
   - Linting with ESLint
   - Unit tests with Jest
   - Integration tests
   - Build verification

2. **Preview Deployment** (Pull Requests)
   - Automatic preview deployment for all PRs
   - Environment: Preview/Staging
   - URL: `https://ngsrn-website-<branch>.vercel.app`

3. **Production Deployment** (Main Branch)
   - Automatic deployment on merge to main
   - Environment: Production
   - URL: `https://ngsrn.org`
   - Post-deployment E2E tests
   - Performance monitoring with Lighthouse

### Required Secrets

Configure these secrets in your GitHub repository and Vercel dashboard:

```bash
# Vercel Configuration
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Production Environment
PRODUCTION_URL=https://ngsrn.org
LHCI_GITHUB_APP_TOKEN=your-lighthouse-token
```

## Environment Configuration

### Environment Variables

#### Required for All Environments
```bash
DATABASE_URL=postgresql://username:password@host:5432/database
NEXTAUTH_SECRET=your-nextauth-secret
GEMINI_API_KEY=your-gemini-api-key
```

#### Production Only
```bash
NEXTAUTH_URL=https://ngsrn.org
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=ngsrn-production-media
REDIS_URL=redis://username:password@host:6379
ELASTICSEARCH_URL=https://username:password@host:9200
SENTRY_DSN=your-sentry-dsn
```

#### Analytics and Monitoring
```bash
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
HOTJAR_ID=your-hotjar-id
NEW_RELIC_LICENSE_KEY=your-new-relic-key
```

### Setup Scripts

Use the provided scripts to manage environment configuration:

```bash
# Set up development environment
npm run env:setup

# Validate environment variables
npm run env:validate

# Generate secure secrets
npm run env:secrets

# Test database connection
npm run env:test-db
```

## Monitoring and Analytics

### Analytics Providers

1. **Google Analytics 4**
   - Page views and user behavior
   - Custom events and conversions
   - Real-time monitoring

2. **Hotjar**
   - User session recordings
   - Heatmaps and click tracking
   - User feedback collection

3. **Internal Analytics**
   - Custom event tracking
   - Search analytics
   - AI interaction metrics

### Monitoring Dashboard

Access the monitoring dashboard at `/cms/monitoring` (requires admin access).

Features:
- Real-time metrics overview
- Performance monitoring
- Error tracking
- User behavior analytics
- Search and AI usage statistics

### Key Metrics Tracked

- **Performance**: Web Vitals (LCP, FID, CLS, FCP, TTFB)
- **User Engagement**: Page views, session duration, bounce rate
- **Search**: Query volume, success rate, popular terms
- **AI Assistant**: Interaction count, success rate, response time
- **Errors**: JavaScript errors, API failures, network issues

## Backup and Recovery

### Automated Backups

Backups run automatically on the following schedule:
- **Daily**: 2:00 AM UTC (Database + Media manifest)
- **Weekly**: 3:00 AM UTC Sunday (Full backup)
- **Monthly**: 4:00 AM UTC 1st of month (Full backup + config)

### Manual Backup Commands

```bash
# Create full backup (database + media + config)
npm run backup:full

# Create database backup only
npm run backup:database

# Create media backup manifest
npm run backup:media

# Create configuration backup
npm run backup:config

# List available backups
npm run backup:list

# Clean up old backups (30+ days)
npm run backup:cleanup
```

### Recovery Procedures

```bash
# Restore database from backup
npm run restore:database <backup-key>

# Restore media from backup
npm run restore:media <manifest-key>
```

### Backup Storage

- **Location**: AWS S3 bucket (`ngsrn-backups`)
- **Retention**: 30 days for automated cleanup
- **Encryption**: Server-side encryption enabled
- **Access**: Restricted to backup service account

## Performance Monitoring

### Web Vitals Monitoring

The application automatically tracks Core Web Vitals:

- **LCP (Largest Contentful Paint)**: < 2.5s (Good)
- **FID (First Input Delay)**: < 100ms (Good)
- **CLS (Cumulative Layout Shift)**: < 0.1 (Good)
- **FCP (First Contentful Paint)**: < 1.8s (Good)
- **TTFB (Time to First Byte)**: < 600ms (Good)

### Performance Alerts

Alerts are triggered when:
- Any Web Vital exceeds "Poor" threshold
- Page load time > 5 seconds
- API response time > 2 seconds
- Error rate > 5%

### Optimization Features

- **Image Optimization**: Next.js Image component with WebP conversion
- **Code Splitting**: Automatic route-based splitting
- **Caching**: Redis for API responses, CDN for static assets
- **Service Worker**: Offline functionality and caching
- **Bundle Analysis**: Webpack Bundle Analyzer integration

## Error Tracking

### Error Categories

1. **JavaScript Errors**
   - Runtime errors
   - Unhandled promise rejections
   - Component errors

2. **API Errors**
   - HTTP 4xx/5xx responses
   - Network failures
   - Timeout errors

3. **Performance Issues**
   - Slow page loads
   - Poor Web Vitals
   - Memory leaks

### Error Reporting

Errors are automatically reported to:
- Internal monitoring API (`/api/monitoring/errors`)
- Sentry (if configured)
- Console logs (development only)

### Error Response

1. **Immediate**: Error logged and tracked
2. **Analysis**: Error patterns identified
3. **Alerting**: Critical errors trigger notifications
4. **Resolution**: Fixes deployed via hotfix or regular release

## Operational Procedures

### Deployment Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Backup verified

### Incident Response

1. **Detection**: Monitoring alerts or user reports
2. **Assessment**: Determine severity and impact
3. **Response**: Implement immediate fixes or rollback
4. **Communication**: Update status page and stakeholders
5. **Resolution**: Deploy permanent fix
6. **Post-mortem**: Document lessons learned

### Maintenance Windows

- **Scheduled**: First Sunday of each month, 2:00-4:00 AM UTC
- **Emergency**: As needed with 1-hour notice
- **Database**: Maintenance during low-traffic periods

### Health Checks

The application provides health check endpoints:

- `/api/health`: Basic application health
- `/api/health/database`: Database connectivity
- `/api/health/external`: External service status

### Scaling Considerations

- **Vercel**: Automatic scaling based on traffic
- **Database**: Connection pooling and read replicas
- **CDN**: Global distribution via CloudFront
- **Caching**: Redis cluster for high availability

### Security Monitoring

- **Rate Limiting**: API endpoints protected
- **Authentication**: Session monitoring
- **File Uploads**: Virus scanning and validation
- **Dependencies**: Automated vulnerability scanning

## Support and Troubleshooting

### Common Issues

1. **Slow Performance**
   - Check Web Vitals dashboard
   - Review database query performance
   - Verify CDN cache hit rates

2. **High Error Rates**
   - Check error tracking dashboard
   - Review recent deployments
   - Verify external service status

3. **Search Issues**
   - Check Elasticsearch cluster health
   - Review search analytics
   - Verify index synchronization

### Contact Information

- **Technical Lead**: [technical-lead@ngsrn.org]
- **DevOps**: [devops@ngsrn.org]
- **Emergency**: [emergency@ngsrn.org]

### Documentation

- **API Documentation**: `/api/docs`
- **Component Library**: `/storybook`
- **Database Schema**: `/docs/database`
- **Architecture**: `/docs/architecture`