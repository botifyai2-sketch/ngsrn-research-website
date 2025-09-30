# Deployment Scripts and Validation

This document describes the comprehensive deployment validation system for the NGSRN website, including scripts for environment preparation, build validation, and health monitoring.

## Overview

The deployment validation system consists of several components:

1. **Environment Configuration** - Validates and prepares environment variables
2. **Build Validation** - Ensures the application builds correctly with all required assets
3. **Deployment Preparation** - Prepares the application for deployment to Vercel
4. **Health Monitoring** - Provides endpoints and scripts for monitoring deployment status
5. **Comprehensive Validation** - Runs all validation checks before deployment

## Scripts

### 1. Environment Configuration (`scripts/env-config.js`)

Manages environment variables for different deployment phases.

```bash
# Validate environment for simple deployment
npm run env:prepare:simple

# Validate environment for full deployment
npm run env:prepare:full

# Check feature flags
npm run env:check-flags

# Generate secure secrets
node scripts/env-config.js secrets
```

**Features:**
- Validates required environment variables based on deployment phase
- Generates environment files with proper feature flags
- Checks for placeholder values and common misconfigurations
- Generates secure secrets for authentication

### 2. Build Validation (`scripts/validate-build.js`)

Validates the build environment and configuration.

```bash
# Validate build environment
npm run build:validate
```

**Features:**
- Validates environment variables for the current deployment phase
- Checks for required assets (favicon, manifest, etc.)
- Validates Next.js and Vercel configuration
- Checks build output and static assets

### 3. Deployment Preparation (`scripts/prepare-deployment.js`)

Prepares the application for deployment to Vercel.

```bash
# Prepare for simple deployment
npm run deploy:prepare:simple

# Prepare for full deployment
npm run deploy:prepare:full
```

**Features:**
- Creates deployment backups
- Sets up deployment-specific configuration
- Validates Vercel configuration
- Runs pre-deployment checks
- Generates deployment instructions

### 4. Comprehensive Validation (`scripts/deployment-validation.js`)

Runs all validation checks before deployment.

```bash
# Validate simple deployment
npm run deploy:validate:simple

# Validate full deployment
npm run deploy:validate:full
```

**Features:**
- Environment validation
- Build validation
- Asset validation
- Configuration validation
- Connectivity validation
- Performance validation
- Security validation

### 5. Health Check (`scripts/health-check.js`)

Performs health checks on deployed applications.

```bash
# Check health of deployed application
npm run deploy:health-check https://your-app.vercel.app
```

**Features:**
- Basic connectivity check
- Health endpoint validation
- Deployment status verification
- Build validation confirmation

## Monitoring Endpoints

### Health Check Endpoint

**URL:** `/api/monitoring/health`

Provides comprehensive health information including:
- Server status and uptime
- Memory usage
- Database connectivity (if enabled)
- Environment validation
- Feature flag status
- External service status

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "deployment": {
    "phase": "simple",
    "vercel": {
      "region": "iad1",
      "url": "your-app.vercel.app"
    }
  },
  "checks": {
    "server": "ok",
    "memory": {
      "used": 45,
      "total": 128,
      "status": "ok"
    },
    "database": "disabled",
    "environment": {
      "status": "ok"
    },
    "features": {
      "cms": false,
      "auth": false,
      "search": false,
      "ai": false,
      "media": false,
      "analytics": true
    }
  }
}
```

### Deployment Status Endpoint

**URL:** `/api/monitoring/deployment`

Provides detailed deployment information including:
- Deployment phase and environment
- Vercel deployment details
- Build information
- Configuration status
- Feature status
- Asset validation
- Connectivity checks

### Build Validation Endpoint

**URL:** `/api/monitoring/build`

Provides build validation information including:
- Asset validation
- Configuration validation
- Dependency validation
- Performance optimization status
- Security configuration status

## Deployment Phases

### Simple Deployment

For static deployment without database dependencies:

```bash
# Prepare and deploy
npm run deploy:simple
```

**Features Enabled:**
- Static pages
- Basic analytics (optional)
- No database features
- No authentication
- No search functionality

**Required Environment Variables:**
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SITE_NAME`

### Full Deployment

For complete deployment with all features:

```bash
# Prepare and deploy
npm run deploy:full
```

**Features Enabled:**
- All CMS functionality
- User authentication
- Search functionality
- AI features
- Media upload
- Analytics

**Required Environment Variables:**
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SITE_NAME`
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Validation Checks

### 1. Environment Validation
- ✅ Required variables present
- ✅ Valid URL formats
- ✅ No placeholder values
- ✅ Feature flag consistency

### 2. Build Validation
- ✅ Build directory exists
- ✅ Static assets present
- ✅ Build manifest valid
- ✅ Configuration files present

### 3. Asset Validation
- ✅ Critical assets (favicon, manifest)
- ✅ Optional assets (robots.txt, sitemap.xml)
- ✅ Build output files
- ✅ Static resource files

### 4. Configuration Validation
- ✅ Vercel configuration valid
- ✅ Next.js configuration present
- ✅ Package.json scripts complete
- ✅ Feature flags consistent

### 5. Connectivity Validation
- ✅ Database connection (if enabled)
- ✅ External service configuration
- ✅ API endpoint accessibility

### 6. Performance Validation
- ✅ Compression enabled
- ✅ Image optimization configured
- ✅ Bundle analysis available
- ✅ Caching strategies implemented

### 7. Security Validation
- ✅ Security headers configured
- ✅ HTTPS enforcement
- ✅ Content security policies
- ✅ Frame protection

## Usage Examples

### Complete Deployment Workflow

```bash
# 1. Prepare environment
npm run env:prepare:simple

# 2. Validate build
npm run build:validate

# 3. Run comprehensive validation
npm run deploy:validate:simple

# 4. Deploy to Vercel
vercel --prod

# 5. Verify deployment health
npm run deploy:health-check https://your-app.vercel.app
```

### Troubleshooting Failed Validations

```bash
# Check specific validation areas
npm run env:validate
npm run build:validate
npm run deploy:validate:simple

# Check feature flags
npm run env:check-flags

# Generate new secrets if needed
node scripts/env-config.js secrets
```

### Monitoring Deployed Application

```bash
# Quick health check
curl https://your-app.vercel.app/api/monitoring/health

# Detailed deployment status
curl https://your-app.vercel.app/api/monitoring/deployment

# Build validation status
curl https://your-app.vercel.app/api/monitoring/build
```

## Error Handling

The validation system provides detailed error messages and suggestions for common issues:

- **Missing Environment Variables**: Lists required variables with examples
- **Invalid Configuration**: Identifies specific configuration problems
- **Asset Issues**: Reports missing or invalid assets
- **Connectivity Problems**: Provides connection troubleshooting information
- **Performance Issues**: Suggests optimization improvements
- **Security Concerns**: Recommends security enhancements

## Integration with CI/CD

The validation scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Validate Deployment
  run: npm run deploy:validate:simple

- name: Deploy to Vercel
  run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}

- name: Health Check
  run: npm run deploy:health-check ${{ env.DEPLOYMENT_URL }}
```

## Best Practices

1. **Always validate before deploying** - Run validation scripts before every deployment
2. **Monitor health endpoints** - Set up monitoring for the health endpoints
3. **Use appropriate deployment phase** - Choose simple or full based on your needs
4. **Keep environment variables secure** - Never commit secrets to version control
5. **Test after deployment** - Always run health checks after deployment
6. **Monitor performance** - Use the performance validation to optimize your application
7. **Review security settings** - Regularly check security validation results

## Support

For issues with deployment validation:

1. Check the validation output for specific error messages
2. Review the environment variable requirements
3. Ensure all required assets are present
4. Verify Vercel and Next.js configuration
5. Test connectivity to external services
6. Review the deployment logs in Vercel dashboard