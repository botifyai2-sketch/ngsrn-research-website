# Vercel Deployment Guide for NGSRN Website

This guide provides comprehensive instructions for deploying the NGSRN website to Vercel with proper environment variable configuration and automatic URL handling.

## Overview

The NGSRN website supports two deployment phases:
- **Simple**: Static deployment without database features
- **Full**: Complete deployment with database, authentication, and all features

Vercel provides automatic environment variable handling for URLs and deployment context.

## Quick Start

### 1. Prerequisites

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to project directory
cd ngsrn-website
```

### 2. Link Project

```bash
# Link to existing Vercel project or create new one
vercel link
```

### 3. Configure Environment Variables

Choose your deployment phase and follow the corresponding setup:

#### Simple Deployment (Static Site)

```bash
# Set required variables
vercel env add NEXT_PUBLIC_SITE_NAME
# Enter: "Your Research Website Name"

# Optional: Add Google Analytics
vercel env add NEXT_PUBLIC_GA_ID
# Enter: "G-XXXXXXXXXX"
```

#### Full Deployment (With Database)

```bash
# Required variables
vercel env add NEXT_PUBLIC_SITE_NAME
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Optional variables
vercel env add NEXT_PUBLIC_GA_ID
vercel env add GEMINI_API_KEY
vercel env add AWS_ACCESS_KEY_ID
vercel env add AWS_SECRET_ACCESS_KEY
vercel env add AWS_S3_BUCKET
```

### 4. Deploy

```bash
# Deploy to production
vercel --prod
```

## Detailed Configuration

### Environment Variable Reference

#### Auto-Provided by Vercel

These variables are automatically set by Vercel and don't need manual configuration:

- `VERCEL=1` - Indicates Vercel environment
- `VERCEL_URL` - Deployment URL (e.g., `your-app-abc123.vercel.app`)
- `VERCEL_ENV` - Environment type (`production`, `preview`, `development`)
- `VERCEL_REGION` - Deployment region (e.g., `iad1`)
- `VERCEL_GIT_*` - Git integration variables

#### Auto-Generated URLs

The following URLs are automatically generated from `VERCEL_URL` if not explicitly set:

- `NEXT_PUBLIC_BASE_URL` → `https://${VERCEL_URL}`
- `NEXTAUTH_URL` → `https://${VERCEL_URL}`

**Note**: Only set these manually if using a custom domain.

#### Required Variables by Phase

##### Simple Deployment

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SITE_NAME` | Website display name | `"My Research Website"` | ✅ |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | `"G-XXXXXXXXXX"` | ❌ |

##### Full Deployment

All simple deployment variables plus:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` | ✅ |
| `DIRECT_URL` | Direct database connection | `postgresql://...` | ✅ |
| `NEXTAUTH_SECRET` | Authentication secret | `openssl rand -base64 32` | ✅ |
| `GEMINI_API_KEY` | Google AI API key | `AIza...` | ❌ |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | `AKIA...` | ❌ |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | `...` | ❌ |
| `AWS_S3_BUCKET` | S3 bucket name | `my-media-bucket` | ❌ |

### Setting Environment Variables

#### Method 1: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter variable name and value
6. Select environments (Production, Preview, Development)
7. Click **Save**

#### Method 2: Vercel CLI

```bash
# Add variable interactively
vercel env add VARIABLE_NAME

# Add for specific environment
vercel env add VARIABLE_NAME production

# List all variables
vercel env ls

# Remove variable
vercel env rm VARIABLE_NAME

# Pull variables to local file
vercel env pull .env.local
```

#### Method 3: Bulk Import

Create a `.env.production` file and import:

```bash
# Create environment file
cat > .env.production << 'EOF'
NEXT_PUBLIC_SITE_NAME="My Research Website"
DATABASE_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_SECRET="your-secret-here"
EOF

# Import to Vercel (requires manual confirmation for each variable)
vercel env add < .env.production
```

### Database Setup

#### Option 1: Vercel Postgres (Recommended)

```bash
# Create Vercel Postgres database
vercel postgres create

# Get connection strings
vercel postgres connect
```

The connection strings will be automatically added to your environment variables.

#### Option 2: External Database Provider

Popular options:
- [Supabase](https://supabase.com/) - PostgreSQL with additional features
- [PlanetScale](https://planetscale.com/) - MySQL-compatible serverless database
- [Railway](https://railway.app/) - PostgreSQL hosting
- [Neon](https://neon.tech/) - Serverless PostgreSQL

After creating your database:

1. Copy the connection string
2. Set `DATABASE_URL` in Vercel dashboard
3. Set `DIRECT_URL` (usually same as `DATABASE_URL`)

### Authentication Setup

#### Generate Secure Secret

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or use online generator
curl -s https://generate-secret.vercel.app/32
```

#### Configure NextAuth

The `NEXTAUTH_URL` will be automatically set to your Vercel deployment URL. Only set manually if using a custom domain.

### Custom Domain Setup

#### 1. Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

#### 2. Update Environment Variables

```bash
# Set custom URLs
vercel env add NEXT_PUBLIC_BASE_URL production
# Enter: https://yourdomain.com

vercel env add NEXTAUTH_URL production  
# Enter: https://yourdomain.com
```

### Feature Configuration

#### Enable/Disable Features

Set these feature flags based on your deployment needs:

```bash
# Simple deployment (all disabled)
vercel env add NEXT_PUBLIC_ENABLE_CMS false
vercel env add NEXT_PUBLIC_ENABLE_AUTH false
vercel env add NEXT_PUBLIC_ENABLE_SEARCH false
vercel env add NEXT_PUBLIC_ENABLE_AI false
vercel env add NEXT_PUBLIC_ENABLE_MEDIA false

# Full deployment (all enabled)
vercel env add NEXT_PUBLIC_ENABLE_CMS true
vercel env add NEXT_PUBLIC_ENABLE_AUTH true
vercel env add NEXT_PUBLIC_ENABLE_SEARCH true
vercel env add NEXT_PUBLIC_ENABLE_AI true
vercel env add NEXT_PUBLIC_ENABLE_MEDIA true
```

## Deployment Workflows

### Production Deployment

```bash
# Validate environment before deployment
npm run build:validate

# Deploy to production
vercel --prod

# Monitor deployment
vercel logs --follow
```

### Preview Deployments

Preview deployments are automatically created for:
- Pull requests
- Pushes to non-main branches

```bash
# Manual preview deployment
vercel

# Deploy specific branch
vercel --target preview
```

### Development Testing

```bash
# Test locally with Vercel environment
vercel dev

# Pull production environment for local testing
vercel env pull .env.local
npm run dev
```

## Validation and Troubleshooting

### Environment Validation

```bash
# Validate current environment
npm run env:validate

# Generate environment setup files
npm run env:generate

# Check Vercel-specific configuration
npm run env:vercel-setup
```

### Common Issues

#### 1. Missing Environment Variables

**Error**: `Missing required environment variable: NEXT_PUBLIC_SITE_NAME`

**Solution**:
```bash
vercel env add NEXT_PUBLIC_SITE_NAME
# Enter your site name
```

#### 2. URL Mismatch

**Error**: `Base URL does not match Vercel deployment URL`

**Solution**: Remove manual URL configuration to use auto-generated URLs:
```bash
vercel env rm NEXT_PUBLIC_BASE_URL
vercel env rm NEXTAUTH_URL
```

#### 3. Database Connection Issues

**Error**: `Database connection failed`

**Solutions**:
- Verify `DATABASE_URL` is correctly set
- Check database server is accessible from Vercel
- Ensure connection string includes all required parameters
- Test connection locally: `npm run db:test`

#### 4. Authentication Issues

**Error**: `NextAuth configuration error`

**Solutions**:
- Verify `NEXTAUTH_SECRET` is set and secure (32+ characters)
- Ensure `NEXTAUTH_URL` matches your deployment URL
- Check that authentication is enabled: `NEXT_PUBLIC_ENABLE_AUTH=true`

### Debug Commands

```bash
# Check environment variables
vercel env ls

# View deployment logs
vercel logs [deployment-url]

# Test build locally
npm run build

# Validate TypeScript
npm run type-check

# Run health checks
npm run health-check
```

## Security Best Practices

### Environment Variable Security

1. **Never commit secrets to git**
   - Use `.env.local` for local development only
   - Add `.env*` to `.gitignore`

2. **Use Vercel dashboard for production secrets**
   - Mark sensitive variables as "Sensitive" in dashboard
   - Rotate secrets regularly

3. **Principle of least privilege**
   - Only set variables needed for each environment
   - Use different values for development/production

### Database Security

1. **Use connection pooling** for production databases
2. **Enable SSL** for database connections
3. **Restrict database access** to Vercel IP ranges when possible
4. **Regular backups** and monitoring

### API Key Management

1. **Rotate API keys** regularly
2. **Monitor API usage** for unusual activity
3. **Use environment-specific keys** when available
4. **Implement rate limiting** in your application

## Performance Optimization

### Vercel-Specific Optimizations

1. **Edge Functions**: Use for geographically distributed logic
2. **Image Optimization**: Leverage Vercel's automatic image optimization
3. **Caching**: Configure appropriate cache headers
4. **Bundle Analysis**: Monitor bundle size with Vercel analytics

### Database Optimization

1. **Choose nearby regions**: Deploy database in same region as Vercel functions
2. **Connection pooling**: Use services like PgBouncer for PostgreSQL
3. **Read replicas**: For high-traffic applications
4. **Query optimization**: Monitor and optimize slow queries

## Monitoring and Analytics

### Built-in Vercel Analytics

```bash
# Enable Vercel Analytics
vercel env add NEXT_PUBLIC_VERCEL_ANALYTICS true
```

### Custom Analytics

```bash
# Google Analytics
vercel env add NEXT_PUBLIC_GA_ID "G-XXXXXXXXXX"

# Custom monitoring
vercel env add MONITORING_ENDPOINT "https://your-monitoring-service.com"
```

### Health Checks

The application includes built-in health check endpoints:
- `/api/monitoring/health` - Basic health check
- `/api/monitoring/dashboard` - Detailed system status

## Support and Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)

### Community
- [Vercel Discord](https://vercel.com/discord)
- [Next.js Discussions](https://github.com/vercel/next.js/discussions)

### Project-Specific Help
- Check `DEPLOYMENT_GUIDE.md` for general deployment information
- Review `ENVIRONMENT_SETUP.md` for detailed environment configuration
- See `TROUBLESHOOTING.md` for common issues and solutions

---

**Last Updated**: Generated automatically by environment configuration tool
**Version**: Compatible with Next.js 14+ and Vercel CLI 32+