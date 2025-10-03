# Environment Documentation Index

## Overview

This index provides a comprehensive guide to all environment variable and deployment documentation for the NGSRN website. Use this as your starting point to find the right documentation for your needs.

## Quick Navigation

### 🚀 Getting Started
- [Environment Setup Guide](./ENVIRONMENT_SETUP.md) - Quick start for deployment
- [Vercel Environment Setup](./VERCEL_ENVIRONMENT_SETUP.md) - Step-by-step Vercel configuration

### 📚 Reference Documentation
- [Environment Variables Documentation](./ENVIRONMENT_VARIABLES.md) - Complete variable reference
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - General deployment instructions

### 🔧 Troubleshooting & Migration
- [Deployment Troubleshooting](./DEPLOYMENT_TROUBLESHOOTING.md) - Common issues and solutions
- [Migration Guide](./DEPLOYMENT_MIGRATION_GUIDE.md) - Upgrade/downgrade between deployment phases

## Documentation Structure

### 1. Environment Variables Documentation
**File**: `ENVIRONMENT_VARIABLES.md`
**Purpose**: Comprehensive reference for all environment variables

**Contents**:
- Complete variable descriptions and formats
- Deployment phase requirements (simple vs full)
- Feature flag configurations
- Vercel integration details
- Security considerations
- Validation and testing procedures

**Use When**:
- Setting up environment variables
- Understanding variable requirements
- Troubleshooting configuration issues
- Planning deployment phases

### 2. Vercel Environment Setup Guide
**File**: `VERCEL_ENVIRONMENT_SETUP.md`
**Purpose**: Step-by-step Vercel configuration instructions

**Contents**:
- Prerequisites and tool installation
- Simple deployment setup (minimal configuration)
- Full deployment setup (complete features)
- Dashboard and CLI configuration methods
- Verification and testing procedures
- Common troubleshooting solutions

**Use When**:
- First-time Vercel deployment
- Adding new environment variables
- Switching between deployment phases
- Troubleshooting Vercel-specific issues

### 3. Environment Setup Guide
**File**: `ENVIRONMENT_SETUP.md`
**Purpose**: General environment configuration guide

**Contents**:
- Quick start instructions
- Deployment phase explanations
- Script references and usage
- Environment variable tables
- Migration procedures between phases
- Security best practices

**Use When**:
- Getting started with the project
- Understanding deployment phases
- Using npm scripts for environment management
- Planning deployment strategy

### 4. Deployment Troubleshooting Guide
**File**: `DEPLOYMENT_TROUBLESHOOTING.md`
**Purpose**: Comprehensive troubleshooting solutions

**Contents**:
- Quick diagnostic commands
- Environment variable issues
- Build and runtime errors
- Database connection problems
- Authentication issues
- Feature-specific problems
- Performance troubleshooting
- Recovery procedures

**Use When**:
- Deployment fails or has errors
- Application not working correctly
- Performance issues
- Need to recover from problems
- Debugging specific features

### 5. Deployment Migration Guide
**File**: `DEPLOYMENT_MIGRATION_GUIDE.md`
**Purpose**: Migration between deployment configurations

**Contents**:
- Simple to full deployment migration
- Full to simple deployment migration
- Partial feature migration
- Data migration procedures
- Rollback procedures
- Testing and validation
- Automated migration scripts

**Use When**:
- Upgrading from simple to full deployment
- Downgrading for troubleshooting
- Enabling/disabling specific features
- Planning deployment changes
- Need to rollback changes

## Usage Scenarios

### Scenario 1: First-Time Deployment

**Goal**: Deploy the website for the first time

**Recommended Path**:
1. Start with [Environment Setup Guide](./ENVIRONMENT_SETUP.md) - Quick Start section
2. Follow [Vercel Environment Setup](./VERCEL_ENVIRONMENT_SETUP.md) - Simple Deployment
3. Reference [Environment Variables Documentation](./ENVIRONMENT_VARIABLES.md) for variable details
4. Use [Deployment Troubleshooting](./DEPLOYMENT_TROUBLESHOOTING.md) if issues arise

**Key Commands**:
```bash
npm run env:prepare:simple
npm run build:validate
npm run deploy:simple
```

### Scenario 2: Upgrading to Full Features

**Goal**: Add CMS, authentication, and advanced features

**Recommended Path**:
1. Review [Migration Guide](./DEPLOYMENT_MIGRATION_GUIDE.md) - Simple to Full Migration
2. Set up external services (database, APIs)
3. Follow [Vercel Environment Setup](./VERCEL_ENVIRONMENT_SETUP.md) - Full Deployment
4. Use [Environment Variables Documentation](./ENVIRONMENT_VARIABLES.md) for reference

**Key Commands**:
```bash
npm run env:prepare:full
npm run env:validate full
npm run deploy:full
```

### Scenario 3: Troubleshooting Issues

**Goal**: Fix deployment or runtime problems

**Recommended Path**:
1. Start with [Deployment Troubleshooting](./DEPLOYMENT_TROUBLESHOOTING.md) - Quick Diagnostics
2. Use specific troubleshooting sections based on error type
3. Reference [Environment Variables Documentation](./ENVIRONMENT_VARIABLES.md) for configuration issues
4. Consider [Migration Guide](./DEPLOYMENT_MIGRATION_GUIDE.md) for rollback if needed

**Key Commands**:
```bash
npm run env:validate
npm run build:validate
vercel logs [deployment-url]
```

### Scenario 4: Adding New Features

**Goal**: Enable specific features (AI, search, media, etc.)

**Recommended Path**:
1. Check [Environment Variables Documentation](./ENVIRONMENT_VARIABLES.md) for feature requirements
2. Use [Migration Guide](./DEPLOYMENT_MIGRATION_GUIDE.md) - Partial Feature Migration
3. Follow [Vercel Environment Setup](./VERCEL_ENVIRONMENT_SETUP.md) for variable configuration
4. Test with [Deployment Troubleshooting](./DEPLOYMENT_TROUBLESHOOTING.md) procedures

### Scenario 5: Emergency Recovery

**Goal**: Quickly restore service after problems

**Recommended Path**:
1. Use [Deployment Troubleshooting](./DEPLOYMENT_TROUBLESHOOTING.md) - Recovery Procedures
2. Consider [Migration Guide](./DEPLOYMENT_MIGRATION_GUIDE.md) - Rollback Procedures
3. Reference [Environment Setup Guide](./ENVIRONMENT_SETUP.md) for quick restoration

**Key Commands**:
```bash
vercel rollback [previous-deployment-url]
npm run env:prepare:simple
```

## Quick Reference

### Essential Commands

```bash
# Environment Management
npm run env:validate                 # Validate current environment
npm run env:prepare:simple          # Prepare simple deployment
npm run env:prepare:full            # Prepare full deployment
npm run env:check-flags             # Check feature flags

# Deployment
npm run deploy:simple               # Deploy simple version
npm run deploy:full                 # Deploy full version
npm run build:validate              # Validate build environment

# Troubleshooting
vercel logs [deployment-url]        # View deployment logs
vercel env ls                       # List environment variables
npm run test:features               # Test application features
```

### Environment Variable Quick Reference

#### Simple Deployment (Minimal)
```bash
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"  # Auto-generated
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"
```

#### Full Deployment (Complete)
```bash
# Basic (same as simple)
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"

# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"
DIRECT_URL="postgresql://user:pass@host:5432/db"

# Authentication
NEXTAUTH_SECRET="your-32-character-secret"
NEXTAUTH_URL="https://your-app.vercel.app"  # Auto-generated

# Feature Flags (all true)
NEXT_PUBLIC_ENABLE_CMS="true"
NEXT_PUBLIC_ENABLE_AUTH="true"
NEXT_PUBLIC_ENABLE_SEARCH="true"
NEXT_PUBLIC_ENABLE_AI="true"
NEXT_PUBLIC_ENABLE_MEDIA="true"

# Optional Services
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
GEMINI_API_KEY="AIzaSyC..."
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG..."
AWS_S3_BUCKET="ngsrn-media-bucket"
```

## File Organization

```
ngsrn-website/
├── ENVIRONMENT_DOCUMENTATION_INDEX.md    # This file - main index
├── ENVIRONMENT_VARIABLES.md              # Complete variable reference
├── VERCEL_ENVIRONMENT_SETUP.md          # Vercel-specific setup guide
├── ENVIRONMENT_SETUP.md                 # General setup guide
├── DEPLOYMENT_TROUBLESHOOTING.md        # Troubleshooting solutions
├── DEPLOYMENT_MIGRATION_GUIDE.md        # Migration procedures
├── DEPLOYMENT_GUIDE.md                  # General deployment guide
├── .env.local.example                   # Local development template
├── .env.production                      # Production configuration
└── scripts/
    ├── env-config.js                    # Environment configuration script
    ├── prepare-deployment.js            # Deployment preparation
    └── validate-build.js                # Build validation
```

## Support and Maintenance

### Keeping Documentation Updated

When making changes to the application:

1. **Update environment variables**: Modify `ENVIRONMENT_VARIABLES.md`
2. **Add new features**: Update feature flag documentation
3. **Change deployment process**: Update setup guides
4. **Add troubleshooting**: Update troubleshooting guide
5. **Update this index**: Keep navigation current

### Version Control

- Tag documentation versions with deployment releases
- Keep backup copies of working configurations
- Document any breaking changes in migration guide

### Getting Help

If you can't find what you need in this documentation:

1. **Check deployment logs**: `vercel logs [deployment-url]`
2. **Validate environment**: `npm run env:validate`
3. **Test locally**: `vercel dev`
4. **Review Vercel documentation**: [vercel.com/docs](https://vercel.com/docs)
5. **Check project repository**: Issues and discussions

## Contributing

To improve this documentation:

1. **Identify gaps**: What information is missing?
2. **Add examples**: Include real-world scenarios
3. **Update procedures**: Keep instructions current
4. **Test instructions**: Verify all commands work
5. **Improve clarity**: Make complex topics easier to understand

### Documentation Standards

- Use clear, step-by-step instructions
- Include command examples with expected output
- Provide troubleshooting for common issues
- Cross-reference related documentation
- Keep examples up-to-date with current configuration