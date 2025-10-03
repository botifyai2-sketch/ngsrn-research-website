# Deployment Migration Guide

## Overview

This guide provides step-by-step instructions for migrating between different deployment configurations of the NGSRN website, including upgrading from simple to full deployment and downgrading when needed.

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Simple to Full Migration](#simple-to-full-migration)
3. [Full to Simple Migration](#full-to-simple-migration)
4. [Partial Feature Migration](#partial-feature-migration)
5. [Data Migration](#data-migration)
6. [Rollback Procedures](#rollback-procedures)
7. [Testing and Validation](#testing-and-validation)

## Migration Overview

### Deployment Phases

#### Simple Deployment
- **Features**: Static pages, basic navigation, optional analytics
- **Dependencies**: Minimal (no database required)
- **Use Case**: Initial deployment, demonstration, testing

#### Full Deployment
- **Features**: CMS, authentication, search, AI, media management
- **Dependencies**: Database, external APIs, storage services
- **Use Case**: Production with content management needs

### Migration Types

1. **Forward Migration**: Simple → Full (adding features)
2. **Backward Migration**: Full → Simple (removing features)
3. **Partial Migration**: Selective feature enabling/disabling
4. **Emergency Migration**: Quick rollback for issues

## Simple to Full Migration

### Prerequisites

Before starting the migration, ensure you have:

- [ ] Database provider account (Supabase recommended)
- [ ] Required API keys (Google AI, AWS, etc.)
- [ ] Backup of current deployment
- [ ] Access to Vercel dashboard

### Step 1: Prepare External Services

#### Set Up Database (Supabase)

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com
   # Create new project
   # Note project URL and API keys
   ```

2. **Get Connection Strings**
   - Go to Settings → Database
   - Copy `Connection string` (for DATABASE_URL)
   - Copy `Direct connection` (for DIRECT_URL)

#### Generate Authentication Secret

```bash
# Generate secure secret (32+ characters)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Optional: Set Up Additional Services

```bash
# Google AI (for AI features)
# Visit https://makersuite.google.com
# Create API key

# AWS S3 (for media storage)
# Create IAM user with S3 permissions
# Generate access keys

# Redis (for caching)
# Set up Redis provider
# Get connection string
```

### Step 2: Backup Current Deployment

```bash
# Create deployment backup
vercel ls > deployment-backup-$(date +%Y%m%d).txt

# Backup environment variables
vercel env ls > env-backup-$(date +%Y%m%d).txt

# Create git tag for current state
git tag simple-deployment-backup-$(date +%Y%m%d)
git push origin --tags
```

### Step 3: Prepare Full Environment Configuration

```bash
# Generate full deployment configuration
npm run env:prepare:full

# This creates .env.full with all required variables
```

### Step 4: Update Environment Variables in Vercel

#### Required Variables

Add these variables in Vercel Dashboard (Settings → Environment Variables):

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | From Supabase |
| `DIRECT_URL` | `postgresql://user:pass@host:5432/db` | From Supabase |
| `NEXTAUTH_SECRET` | `your-32-character-secret` | Generated secret |

#### Feature Flags (Update Existing)

| Variable | New Value | Previous Value |
|----------|-----------|----------------|
| `NEXT_PUBLIC_ENABLE_CMS` | `"true"` | `"false"` |
| `NEXT_PUBLIC_ENABLE_AUTH` | `"true"` | `"false"` |
| `NEXT_PUBLIC_ENABLE_SEARCH` | `"true"` | `"false"` |
| `NEXT_PUBLIC_ENABLE_AI` | `"true"` | `"false"` |
| `NEXT_PUBLIC_ENABLE_MEDIA` | `"true"` | `"false"` |

#### Optional Variables (Add as needed)

| Variable | Value | Required For |
|----------|-------|--------------|
| `GEMINI_API_KEY` | `AIzaSyC...` | AI features |
| `AWS_ACCESS_KEY_ID` | `AKIAIOSFODNN7EXAMPLE` | Media storage |
| `AWS_SECRET_ACCESS_KEY` | `wJalrXUtnFEMI/K7MDENG...` | Media storage |
| `AWS_S3_BUCKET` | `ngsrn-media-bucket` | Media storage |

### Step 5: Database Setup

```bash
# Pull new environment variables locally
vercel env pull .env.local

# Run database migrations
npx prisma migrate deploy

# Seed database with initial data
npx prisma db seed

# Verify database connection
npm run db:test-connection
```

### Step 6: Deploy Full Configuration

```bash
# Validate environment before deployment
npm run env:validate full

# Test build locally
npm run build

# Deploy to production
vercel --prod

# Or use deployment script
npm run deploy:full
```

### Step 7: Post-Migration Verification

```bash
# Check deployment status
vercel ls

# Verify all features are working
npm run test:features

# Check application health
curl https://your-app.vercel.app/api/monitoring/health
```

#### Feature Testing Checklist

- [ ] Website loads correctly
- [ ] User authentication works
- [ ] CMS dashboard is accessible
- [ ] Search functionality works
- [ ] AI features respond (if enabled)
- [ ] Media uploads work (if configured)

### Step 8: Data Migration (If Applicable)

If you have existing content to migrate:

```bash
# Export existing data
npm run data:export

# Import to new database
npm run data:import [export-file]

# Verify data integrity
npm run data:verify
```

## Full to Simple Migration

### When to Use

- Reducing complexity for maintenance
- Troubleshooting deployment issues
- Temporary rollback during problems
- Cost optimization

### Step 1: Backup Full Deployment

```bash
# Backup database
npm run db:backup

# Backup environment configuration
vercel env ls > full-env-backup-$(date +%Y%m%d).txt

# Create git tag
git tag full-deployment-backup-$(date +%Y%m%d)
git push origin --tags
```

### Step 2: Export Important Data

```bash
# Export user data
npm run data:export:users

# Export content data
npm run data:export:content

# Export media files
npm run data:export:media
```

### Step 3: Update Environment Variables

#### Update Feature Flags

| Variable | New Value | Previous Value |
|----------|-----------|----------------|
| `NEXT_PUBLIC_ENABLE_CMS` | `"false"` | `"true"` |
| `NEXT_PUBLIC_ENABLE_AUTH` | `"false"` | `"true"` |
| `NEXT_PUBLIC_ENABLE_SEARCH` | `"false"` | `"true"` |
| `NEXT_PUBLIC_ENABLE_AI` | `"false"` | `"true"` |
| `NEXT_PUBLIC_ENABLE_MEDIA` | `"false"` | `"true"` |

#### Remove Optional Variables

Remove these variables from Vercel dashboard:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `GEMINI_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`

### Step 4: Deploy Simple Configuration

```bash
# Prepare simple environment
npm run env:prepare:simple

# Validate configuration
npm run env:validate simple

# Deploy
vercel --prod
```

### Step 5: Verify Simple Deployment

- [ ] Website loads correctly
- [ ] Navigation works
- [ ] Static pages render properly
- [ ] No database-dependent features are accessible

## Partial Feature Migration

### Selective Feature Enabling

You can enable features individually instead of all at once:

#### Enable Only CMS and Authentication

```bash
vercel env add NEXT_PUBLIC_ENABLE_CMS "true" production
vercel env add NEXT_PUBLIC_ENABLE_AUTH "true" production
vercel env add DATABASE_URL "your-database-url" production
vercel env add NEXTAUTH_SECRET "your-secret" production
vercel --prod
```

#### Enable Only Search

```bash
vercel env add NEXT_PUBLIC_ENABLE_SEARCH "true" production
vercel env add DATABASE_URL "your-database-url" production
# Or use Elasticsearch
vercel env add ELASTICSEARCH_URL "your-elasticsearch-url" production
vercel --prod
```

#### Enable Only AI Features

```bash
vercel env add NEXT_PUBLIC_ENABLE_AI "true" production
vercel env add GEMINI_API_KEY "your-api-key" production
vercel --prod
```

### Feature Dependency Matrix

| Feature | Dependencies | Required Variables |
|---------|--------------|-------------------|
| CMS | Authentication, Database | `DATABASE_URL`, `NEXTAUTH_SECRET` |
| Authentication | Database | `DATABASE_URL`, `NEXTAUTH_SECRET` |
| Search | Database OR Elasticsearch | `DATABASE_URL` OR `ELASTICSEARCH_URL` |
| AI | None | `GEMINI_API_KEY` |
| Media | Storage Service | `AWS_*` OR alternative storage |

## Data Migration

### Export Data from Full Deployment

```bash
# Export all data
npm run data:export:all

# Export specific data types
npm run data:export:users
npm run data:export:articles
npm run data:export:media
npm run data:export:settings
```

### Import Data to New Deployment

```bash
# Import all data
npm run data:import:all [backup-directory]

# Import specific data types
npm run data:import:users [users-backup.json]
npm run data:import:articles [articles-backup.json]
```

### Data Transformation

When migrating between different database schemas:

```bash
# Transform data format
npm run data:transform [input-file] [output-file]

# Validate transformed data
npm run data:validate [data-file]
```

## Rollback Procedures

### Emergency Rollback

If migration fails and you need to quickly restore service:

```bash
# Rollback to previous deployment
vercel rollback [previous-deployment-url]

# Or restore from git tag
git checkout [backup-tag]
vercel --prod
```

### Planned Rollback

For a controlled rollback with data preservation:

```bash
# 1. Export current data
npm run data:export:all

# 2. Restore previous environment variables
# Use backup file: env-backup-YYYYMMDD.txt

# 3. Restore previous deployment
git checkout [backup-tag]
vercel --prod

# 4. Import preserved data (if compatible)
npm run data:import:all [backup-directory]
```

### Database Rollback

```bash
# Restore database from backup
npm run db:restore [backup-file]

# Or reset to clean state
npx prisma migrate reset
npx prisma db seed
```

## Testing and Validation

### Pre-Migration Testing

```bash
# Test current deployment
npm run test:e2e

# Validate environment
npm run env:validate

# Check dependencies
npm audit
```

### Post-Migration Testing

```bash
# Validate new environment
npm run env:validate [phase]

# Test all features
npm run test:features

# Run integration tests
npm run test:integration

# Performance testing
npm run test:performance
```

### Automated Migration Testing

```bash
# Test migration process in staging
npm run migration:test:simple-to-full

# Test rollback process
npm run migration:test:rollback

# Validate data integrity
npm run migration:test:data-integrity
```

## Migration Scripts

### Automated Migration Script

```bash
#!/bin/bash
# migrate-to-full.sh

echo "Starting migration from simple to full deployment..."

# Backup current state
echo "Creating backup..."
vercel env ls > env-backup-$(date +%Y%m%d).txt
git tag simple-backup-$(date +%Y%m%d)

# Prepare environment
echo "Preparing full environment..."
npm run env:prepare:full

# Prompt for required values
read -p "Enter DATABASE_URL: " DATABASE_URL
read -p "Enter NEXTAUTH_SECRET: " NEXTAUTH_SECRET

# Set environment variables
echo "Setting environment variables..."
vercel env add DATABASE_URL "$DATABASE_URL" production
vercel env add NEXTAUTH_SECRET "$NEXTAUTH_SECRET" production

# Update feature flags
vercel env add NEXT_PUBLIC_ENABLE_CMS "true" production
vercel env add NEXT_PUBLIC_ENABLE_AUTH "true" production
vercel env add NEXT_PUBLIC_ENABLE_SEARCH "true" production

# Deploy
echo "Deploying..."
vercel --prod

echo "Migration complete!"
```

### Rollback Script

```bash
#!/bin/bash
# rollback-to-simple.sh

echo "Rolling back to simple deployment..."

# Set feature flags to false
vercel env add NEXT_PUBLIC_ENABLE_CMS "false" production
vercel env add NEXT_PUBLIC_ENABLE_AUTH "false" production
vercel env add NEXT_PUBLIC_ENABLE_SEARCH "false" production
vercel env add NEXT_PUBLIC_ENABLE_AI "false" production
vercel env add NEXT_PUBLIC_ENABLE_MEDIA "false" production

# Remove database variables
vercel env rm DATABASE_URL production
vercel env rm DIRECT_URL production
vercel env rm NEXTAUTH_SECRET production

# Deploy
vercel --prod

echo "Rollback complete!"
```

## Best Practices

### Migration Planning

1. **Test in Staging First**
   - Always test migration process in staging environment
   - Validate all features work correctly
   - Test rollback procedures

2. **Backup Everything**
   - Database backups
   - Environment variable backups
   - Code state (git tags)
   - Media files

3. **Gradual Migration**
   - Enable features one at a time
   - Test each feature before enabling the next
   - Monitor performance and errors

### Monitoring During Migration

```bash
# Monitor deployment logs
vercel logs --follow

# Check application health
curl https://your-app.vercel.app/api/monitoring/health

# Monitor performance
npm run performance:monitor
```

### Communication

1. **Notify Users**
   - Inform users of planned maintenance
   - Provide estimated downtime
   - Set up status page if needed

2. **Document Changes**
   - Record migration steps taken
   - Note any issues encountered
   - Update deployment documentation

## Troubleshooting Migration Issues

### Common Migration Problems

1. **Database Connection Failures**
   ```bash
   # Test connection
   npm run db:test-connection
   
   # Check firewall settings
   # Verify connection string format
   ```

2. **Environment Variable Conflicts**
   ```bash
   # Clear conflicting variables
   vercel env rm [VARIABLE_NAME] production
   
   # Validate configuration
   npm run env:validate
   ```

3. **Build Failures After Migration**
   ```bash
   # Check for missing dependencies
   npm install
   
   # Validate TypeScript
   npx tsc --noEmit
   ```

### Recovery Procedures

If migration fails:

1. **Immediate Recovery**
   ```bash
   # Rollback to previous deployment
   vercel rollback [previous-url]
   ```

2. **Full Recovery**
   ```bash
   # Restore from backup
   git checkout [backup-tag]
   # Restore environment variables from backup
   # Redeploy
   vercel --prod
   ```

## Support and Resources

### Getting Help

- Check deployment logs: `vercel logs [deployment-url]`
- Validate environment: `npm run env:validate`
- Review troubleshooting guide: `DEPLOYMENT_TROUBLESHOOTING.md`
- Test locally: `vercel dev`

### Documentation References

- [Environment Variables Documentation](./ENVIRONMENT_VARIABLES.md)
- [Vercel Setup Guide](./VERCEL_ENVIRONMENT_SETUP.md)
- [Deployment Troubleshooting](./DEPLOYMENT_TROUBLESHOOTING.md)
- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)