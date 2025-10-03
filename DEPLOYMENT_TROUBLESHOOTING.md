# Deployment Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting solutions for common deployment issues with the NGSRN website on Vercel, organized by deployment phase and error type.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Environment Variable Issues](#environment-variable-issues)
3. [Build Failures](#build-failures)
4. [Runtime Errors](#runtime-errors)
5. [Database Connection Issues](#database-connection-issues)
6. [Authentication Problems](#authentication-problems)
7. [Feature-Specific Issues](#feature-specific-issues)
8. [Performance Issues](#performance-issues)
9. [Recovery Procedures](#recovery-procedures)

## Quick Diagnostics

### Diagnostic Commands

Run these commands to quickly identify issues:

```bash
# Check environment configuration
npm run env:validate

# Validate build environment
npm run build:validate

# Check feature flags
npm run env:check-flags

# Test build locally
npm run build

# Check Vercel deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]
```

### Health Check Script

```bash
# Run comprehensive health check
node scripts/health-check.js

# Check specific deployment phase
node scripts/health-check.js simple
node scripts/health-check.js full
```

## Environment Variable Issues

### Missing Required Variables

#### Error Symptoms
```
❌ Build Error: Environment variable NEXT_PUBLIC_SITE_NAME is not defined
❌ Runtime Error: Cannot read property of undefined
```

#### Diagnosis
```bash
# Check what variables are set
vercel env ls

# Validate environment
npm run env:validate
```

#### Solutions

1. **Add Missing Variable via Dashboard**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add the missing variable with correct value
   - Redeploy: `vercel --prod`

2. **Add Missing Variable via CLI**
   ```bash
   vercel env add NEXT_PUBLIC_SITE_NAME production
   # Enter value when prompted
   vercel --prod
   ```

3. **Bulk Add Variables**
   ```bash
   # Use environment preparation script
   npm run env:prepare:simple  # or :full
   # Then set variables in Vercel dashboard
   ```

### Invalid Variable Format

#### Error Symptoms
```
❌ NEXT_PUBLIC_BASE_URL must be a valid HTTPS URL
❌ Database connection failed: invalid connection string
```

#### Solutions

1. **Fix URL Format**
   ```bash
   # Correct format for base URL
   vercel env add NEXT_PUBLIC_BASE_URL "https://your-app.vercel.app" production
   ```

2. **Fix Database URL Format**
   ```bash
   # Correct PostgreSQL format
   vercel env add DATABASE_URL "postgresql://user:password@host:5432/database" production
   ```

3. **Validate Format Before Setting**
   ```bash
   # Test URL format
   node -e "console.log(new URL('https://your-app.vercel.app'))"
   
   # Test database connection
   npm run db:test-connection
   ```

### Vercel URL Conflicts

#### Error Symptoms
```
❌ NEXT_PUBLIC_BASE_URL conflicts with Vercel auto-generated URL
❌ NextAuth URL mismatch
```

#### Solutions

1. **Remove Manual URL Settings**
   ```bash
   # Let Vercel auto-generate URLs
   vercel env rm NEXT_PUBLIC_BASE_URL production
   vercel env rm NEXTAUTH_URL production
   vercel --prod
   ```

2. **Set Custom Domain**
   ```bash
   # If using custom domain, set it correctly
   vercel env add NEXT_PUBLIC_BASE_URL "https://your-custom-domain.com" production
   vercel env add NEXTAUTH_URL "https://your-custom-domain.com" production
   ```

## Build Failures

### TypeScript Errors

#### Error Symptoms
```
❌ Type error: Property 'xyz' does not exist on type
❌ Build failed due to TypeScript errors
```

#### Solutions

1. **Check Type Definitions**
   ```bash
   # Validate TypeScript configuration
   npx tsc --noEmit
   
   # Check specific file
   npx tsc --noEmit src/path/to/file.ts
   ```

2. **Fix Environment Type Issues**
   ```bash
   # Ensure environment variables are properly typed
   # Check src/lib/env-validation.ts
   npm run build:validate
   ```

### Missing Dependencies

#### Error Symptoms
```
❌ Module not found: Can't resolve 'package-name'
❌ Cannot find module 'xyz'
```

#### Solutions

1. **Install Missing Dependencies**
   ```bash
   # Check package.json for missing dependencies
   npm install
   
   # Or install specific package
   npm install package-name
   ```

2. **Clear Cache and Reinstall**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Remove node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Build Size Issues

#### Error Symptoms
```
❌ Build exceeds maximum size limit
❌ Lambda function too large
```

#### Solutions

1. **Optimize Bundle Size**
   ```bash
   # Analyze bundle size
   npm run build:analyze
   
   # Check for large dependencies
   npx webpack-bundle-analyzer .next/static/chunks/*.js
   ```

2. **Enable Code Splitting**
   ```javascript
   // Use dynamic imports
   const Component = dynamic(() => import('./Component'))
   ```

## Runtime Errors

### 500 Internal Server Error

#### Error Symptoms
```
❌ 500 Internal Server Error
❌ Application error: a server-side exception has occurred
```

#### Diagnosis
```bash
# Check deployment logs
vercel logs [deployment-url] --follow

# Check function logs
vercel logs --scope=functions
```

#### Solutions

1. **Check Environment Variables**
   ```bash
   # Ensure all required variables are set
   npm run env:validate full
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   npm run db:test-connection
   
   # Check database URL format
   echo $DATABASE_URL
   ```

3. **API Route Errors**
   ```bash
   # Check API route implementation
   # Look for unhandled errors in /api routes
   ```

### 404 Not Found

#### Error Symptoms
```
❌ 404 - This page could not be found
❌ API route not found
```

#### Solutions

1. **Check Route Configuration**
   ```bash
   # Verify file structure
   ls -la src/app/
   
   # Check for proper page.tsx files
   find src/app -name "page.tsx"
   ```

2. **Verify API Routes**
   ```bash
   # Check API route structure
   find src/app/api -name "route.ts"
   ```

## Database Connection Issues

### Connection Timeout

#### Error Symptoms
```
❌ Database connection timeout
❌ Connection terminated unexpectedly
```

#### Solutions

1. **Check Database Status**
   ```bash
   # Test connection from local
   npm run db:test-connection
   
   # Check database provider status
   # (Supabase, Railway, etc.)
   ```

2. **Verify Connection String**
   ```bash
   # Ensure DATABASE_URL is correct
   vercel env ls | grep DATABASE_URL
   
   # Test with direct connection
   vercel env add DIRECT_URL "your-direct-connection-string" production
   ```

3. **Check Network Configuration**
   - Ensure database allows connections from Vercel IPs
   - Check firewall settings
   - Verify SSL requirements

### Migration Failures

#### Error Symptoms
```
❌ Migration failed: relation does not exist
❌ Prisma migration error
```

#### Solutions

1. **Run Migrations Manually**
   ```bash
   # Deploy migrations
   npx prisma migrate deploy
   
   # Reset database (development only)
   npx prisma migrate reset
   ```

2. **Check Migration Status**
   ```bash
   # Check migration status
   npx prisma migrate status
   
   # Generate new migration
   npx prisma migrate dev --name init
   ```

## Authentication Problems

### NextAuth Configuration Issues

#### Error Symptoms
```
❌ NextAuth configuration error
❌ Authentication callback failed
```

#### Solutions

1. **Check NextAuth Configuration**
   ```bash
   # Verify NEXTAUTH_SECRET is set
   vercel env ls | grep NEXTAUTH
   
   # Ensure secret is secure (32+ characters)
   openssl rand -base64 32
   ```

2. **Fix Callback URLs**
   ```bash
   # Set correct NEXTAUTH_URL
   vercel env add NEXTAUTH_URL "https://your-app.vercel.app" production
   ```

3. **Check Provider Configuration**
   - Verify OAuth provider settings
   - Check redirect URIs in provider dashboard
   - Ensure client IDs and secrets are correct

## Feature-Specific Issues

### CMS Not Loading

#### Error Symptoms
```
❌ CMS dashboard shows 404
❌ Database operations fail
```

#### Solutions

1. **Check Feature Flags**
   ```bash
   # Ensure CMS is enabled
   vercel env add NEXT_PUBLIC_ENABLE_CMS "true" production
   vercel env add NEXT_PUBLIC_ENABLE_AUTH "true" production
   ```

2. **Verify Database Setup**
   ```bash
   # Check database connection
   npm run db:test-connection
   
   # Run database migrations
   npx prisma migrate deploy
   ```

### Search Not Working

#### Error Symptoms
```
❌ Search returns no results
❌ Search API errors
```

#### Solutions

1. **Check Search Configuration**
   ```bash
   # Ensure search is enabled
   vercel env add NEXT_PUBLIC_ENABLE_SEARCH "true" production
   
   # Check search backend
   npm run search:validate
   ```

2. **Rebuild Search Index**
   ```bash
   # Rebuild search index
   npm run search:reindex
   ```

### AI Features Not Working

#### Error Symptoms
```
❌ AI assistant not responding
❌ Gemini API errors
```

#### Solutions

1. **Check API Key**
   ```bash
   # Verify Gemini API key is set
   vercel env ls | grep GEMINI
   
   # Test API key
   npm run ai:test-connection
   ```

2. **Check Feature Flag**
   ```bash
   vercel env add NEXT_PUBLIC_ENABLE_AI "true" production
   vercel env add GEMINI_API_KEY "your-api-key" production
   ```

## Performance Issues

### Slow Loading Times

#### Diagnosis
```bash
# Run performance audit
npm run lighthouse

# Check bundle size
npm run build:analyze

# Monitor performance
npm run performance:monitor
```

#### Solutions

1. **Optimize Images**
   - Use Next.js Image component
   - Enable image optimization in Vercel
   - Compress images before upload

2. **Enable Caching**
   ```bash
   # Set up Redis caching
   vercel env add REDIS_URL "your-redis-url" production
   ```

3. **Optimize Database Queries**
   - Add database indexes
   - Use connection pooling
   - Implement query optimization

### Memory Issues

#### Error Symptoms
```
❌ Function exceeded memory limit
❌ Out of memory error
```

#### Solutions

1. **Optimize Memory Usage**
   ```javascript
   // Use streaming for large responses
   // Implement pagination
   // Clear unused variables
   ```

2. **Increase Function Memory**
   ```json
   // vercel.json
   {
     "functions": {
       "app/api/**/*.ts": {
         "memory": 1024
       }
     }
   }
   ```

## Recovery Procedures

### Emergency Rollback

```bash
# Rollback to previous deployment
vercel rollback [previous-deployment-url]

# Or redeploy from specific commit
git checkout [previous-commit]
vercel --prod
```

### Reset to Simple Deployment

```bash
# Switch to simple deployment
npm run env:prepare:simple

# Update Vercel environment variables
# Set all feature flags to "false"
vercel env add NEXT_PUBLIC_ENABLE_CMS "false" production
vercel env add NEXT_PUBLIC_ENABLE_AUTH "false" production
vercel env add NEXT_PUBLIC_ENABLE_SEARCH "false" production
vercel env add NEXT_PUBLIC_ENABLE_AI "false" production
vercel env add NEXT_PUBLIC_ENABLE_MEDIA "false" production

# Redeploy
vercel --prod
```

### Database Recovery

```bash
# Backup current database
npm run db:backup

# Restore from backup
npm run db:restore [backup-file]

# Reset database (last resort)
npx prisma migrate reset
npx prisma db seed
```

### Complete Environment Reset

```bash
# Remove all environment variables
vercel env rm --all production

# Regenerate configuration
npm run env:prepare:simple

# Set variables in Vercel dashboard
# Redeploy
vercel --prod
```

## Prevention Best Practices

### Pre-Deployment Checklist

- [ ] Run `npm run build:validate`
- [ ] Test locally with `vercel dev`
- [ ] Check environment variables with `npm run env:validate`
- [ ] Verify feature flags with `npm run env:check-flags`
- [ ] Test database connection
- [ ] Review deployment logs

### Monitoring Setup

```bash
# Set up monitoring
npm run monitoring:setup

# Enable error tracking
vercel env add NEXT_PUBLIC_ENABLE_ERROR_TRACKING "true" production

# Set up performance monitoring
vercel env add NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING "true" production
```

### Backup Procedures

```bash
# Regular database backups
npm run db:backup:schedule

# Environment variable backups
vercel env ls > env-backup-$(date +%Y%m%d).txt

# Code backups
git tag deployment-$(date +%Y%m%d)
git push origin --tags
```

## Getting Additional Help

### Diagnostic Information to Collect

When seeking help, provide:

1. **Deployment Information**
   ```bash
   vercel ls
   vercel logs [deployment-url]
   ```

2. **Environment Configuration**
   ```bash
   npm run env:validate
   vercel env ls
   ```

3. **Build Information**
   ```bash
   npm run build:validate
   cat .next/build-manifest.json
   ```

4. **Error Details**
   - Full error messages
   - Steps to reproduce
   - Expected vs actual behavior

### Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Project Repository**: Check README and issues
- **Deployment Logs**: `vercel logs [deployment-url]`