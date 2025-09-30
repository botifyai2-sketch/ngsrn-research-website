# Environment Configuration Guide

This guide explains how to configure environment variables for the NGSRN website deployment.

## Quick Start

### Simple Deployment (Recommended for first deployment)

1. **Prepare environment configuration:**
   ```bash
   npm run env:prepare:simple
   ```

2. **Validate configuration:**
   ```bash
   npm run build:validate
   ```

3. **Deploy to Vercel:**
   ```bash
   npm run deploy:simple
   ```

### Full Deployment (With database and advanced features)

1. **Prepare environment configuration:**
   ```bash
   npm run env:prepare:full
   ```

2. **Set up database and services** (see Full Deployment section below)

3. **Deploy to Vercel:**
   ```bash
   npm run deploy:full
   ```

## Environment Variables

### Required Variables (All Deployments)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_BASE_URL` | Your application URL | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_SITE_NAME` | Site name for branding | `NextGen Sustainable Research Network` |

### Feature Flags

Control which features are enabled in your deployment:

| Variable | Simple | Full | Description |
|----------|--------|------|-------------|
| `NEXT_PUBLIC_ENABLE_CMS` | `false` | `true` | Content Management System |
| `NEXT_PUBLIC_ENABLE_AUTH` | `false` | `true` | User Authentication |
| `NEXT_PUBLIC_ENABLE_SEARCH` | `false` | `true` | Search Functionality |
| `NEXT_PUBLIC_ENABLE_AI` | `false` | `true` | AI Assistant Features |
| `NEXT_PUBLIC_ENABLE_MEDIA` | `false` | `true` | Media Upload/Management |

### Optional Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 Measurement ID | Analytics tracking |

### Full Deployment Variables

Required only when feature flags are enabled:

| Variable | Description | Required For |
|----------|-------------|--------------|
| `DATABASE_URL` | Supabase database connection | CMS, Auth, Search |
| `DIRECT_URL` | Supabase direct connection | Database operations |
| `NEXTAUTH_SECRET` | Authentication secret key | User authentication |
| `NEXTAUTH_URL` | Authentication callback URL | User authentication |
| `GEMINI_API_KEY` | Google Gemini API key | AI features |
| `AWS_ACCESS_KEY_ID` | AWS access key | Media storage |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Media storage |
| `AWS_S3_BUCKET` | S3 bucket name | Media storage |

## Deployment Phases

### Phase 1: Simple Deployment

- **Purpose:** Get the website online quickly without complex dependencies
- **Features:** Static pages, basic navigation, optional analytics
- **Requirements:** Minimal environment variables
- **Ideal for:** Initial deployment, testing, demonstration

**What's included:**
- ✅ Static pages and navigation
- ✅ Responsive design
- ✅ SEO optimization
- ✅ Performance optimization
- ✅ Google Analytics (optional)

**What's disabled:**
- ❌ Content Management System
- ❌ User Authentication
- ❌ Search functionality
- ❌ AI features
- ❌ Media uploads

### Phase 2: Full Deployment

- **Purpose:** Enable all features with database and external services
- **Features:** Complete CMS, authentication, search, AI, media management
- **Requirements:** Database setup, API keys, external services
- **Ideal for:** Production use with content management needs

## Scripts Reference

### Environment Management

```bash
# Generate environment configuration
npm run env:config                    # Show help
npm run env:prepare:simple           # Prepare simple deployment
npm run env:prepare:full             # Prepare full deployment
npm run env:check-flags              # Check current feature flags

# Validation
npm run build:validate               # Validate build environment
npm run env:validate                 # Validate environment variables

# Deployment preparation
npm run deploy:prepare:simple        # Prepare simple deployment
npm run deploy:prepare:full          # Prepare full deployment
```

### Build and Deploy

```bash
# Build
npm run build                        # Standard build with validation
npm run build:simple                 # Build for simple deployment

# Deploy
npm run deploy:simple                # Deploy simple version
npm run deploy:full                  # Deploy full version
```

## Setting Environment Variables in Vercel

1. **Via Vercel Dashboard:**
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add each variable with appropriate values
   - Set environment to "Production"

2. **Via Vercel CLI:**
   ```bash
   vercel env add NEXT_PUBLIC_BASE_URL production
   vercel env add NEXT_PUBLIC_SITE_NAME production
   # ... add other variables
   ```

3. **From Environment File:**
   ```bash
   # After generating .env.simple or .env.full
   vercel env pull .env.production
   ```

## Troubleshooting

### Common Issues

1. **Build fails with missing environment variables:**
   - Run `npm run build:validate` to identify missing variables
   - Ensure all required variables are set in Vercel dashboard

2. **Features not working after deployment:**
   - Check feature flags are set correctly
   - Verify dependent services (database, APIs) are configured

3. **Analytics not tracking:**
   - Verify `NEXT_PUBLIC_GA_ID` is set correctly
   - Check Google Analytics configuration

### Validation Commands

```bash
# Check environment configuration
npm run env:check-flags

# Validate build environment
npm run build:validate

# Test specific deployment phase
NEXT_PUBLIC_ENABLE_CMS=false npm run build:validate
```

## Migration Between Phases

### From Simple to Full Deployment

1. **Prepare full environment:**
   ```bash
   npm run env:prepare:full
   ```

2. **Set up external services:**
   - Create Supabase database
   - Configure authentication
   - Set up API keys

3. **Update environment variables in Vercel**

4. **Deploy:**
   ```bash
   npm run deploy:full
   ```

### From Full to Simple Deployment

1. **Prepare simple environment:**
   ```bash
   npm run env:prepare:simple
   ```

2. **Update environment variables in Vercel**

3. **Deploy:**
   ```bash
   npm run deploy:simple
   ```

## Security Best Practices

1. **Never commit sensitive environment variables to git**
2. **Use strong, unique secrets for production**
3. **Regularly rotate API keys and secrets**
4. **Use Vercel's environment variable encryption**
5. **Limit API key permissions to minimum required**

## Support

For deployment issues:
1. Check the generated deployment instructions
2. Review Vercel build logs
3. Validate environment configuration
4. Test locally with production environment variables