# Environment Variable Troubleshooting Guide

This guide provides comprehensive troubleshooting steps for common environment variable issues in the NGSRN website deployment.

## Table of Contents

- [Quick Diagnosis](#quick-diagnosis)
- [Common Issues](#common-issues)
- [Variable-Specific Guides](#variable-specific-guides)
- [Vercel Setup Instructions](#vercel-setup-instructions)
- [Local Development Setup](#local-development-setup)
- [Security Best Practices](#security-best-practices)
- [Advanced Troubleshooting](#advanced-troubleshooting)

## Quick Diagnosis

### Running Validation

```bash
# Validate current environment
node scripts/env-config.js validate

# Validate specific deployment phase
node scripts/env-config.js validate simple
node scripts/env-config.js validate full

# Run with auto-fix
node scripts/validate-build.js --auto-fix
```

### Common Error Messages

| Error Message | Cause | Quick Fix |
|---------------|-------|-----------|
| `Missing required environment variable: NEXT_PUBLIC_SITE_NAME` | Site name not configured | `export NEXT_PUBLIC_SITE_NAME="Your Site Name"` |
| `NEXT_PUBLIC_BASE_URL must be a valid URL` | Invalid URL format | Use full URL with protocol: `https://yourdomain.com` |
| `NEXTAUTH_SECRET is required when authentication is enabled` | Missing auth secret | Generate with: `openssl rand -base64 32` |
| `Database connection failed` | Invalid DATABASE_URL | Check connection string format |

## Common Issues

### 1. Missing NEXT_PUBLIC_SITE_NAME

**Symptoms:**
- Build fails with "Missing required environment variable: NEXT_PUBLIC_SITE_NAME"
- Site displays default placeholder name

**Solutions:**

#### For Local Development:
```bash
# Add to .env.local
echo 'NEXT_PUBLIC_SITE_NAME="Your Research Website"' >> .env.local
```

#### For Vercel Deployment:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to Settings > Environment Variables
4. Add new variable:
   - **Name:** `NEXT_PUBLIC_SITE_NAME`
   - **Value:** `Your Research Website`
   - **Environments:** Production, Preview, Development

#### Using Vercel CLI:
```bash
vercel env add NEXT_PUBLIC_SITE_NAME
# Follow prompts to set value and environments
```

### 2. Invalid Base URL Configuration

**Symptoms:**
- Links don't work correctly
- Authentication redirects fail
- API calls use wrong domain

**Solutions:**

#### For Local Development:
```bash
# .env.local
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

#### For Vercel Deployment:
- **Option 1:** Let Vercel auto-generate (recommended)
  - Don't set NEXT_PUBLIC_BASE_URL
  - Vercel will use VERCEL_URL automatically

- **Option 2:** Set custom domain
  ```
  NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
  ```

**Validation:**
- Must include protocol (`http://` or `https://`)
- No trailing slash
- Use HTTPS for production

### 3. Database Connection Issues

**Symptoms:**
- "Database connection failed" errors
- Prisma client initialization errors
- 500 errors on database operations

**Solutions:**

#### Check Connection String Format:
```
postgresql://username:password@host:port/database?sslmode=require
```

#### Common Providers:

**Vercel Postgres:**
```bash
# Install Vercel Postgres
vercel postgres create

# Get connection string
vercel env pull .env.local
```

**Supabase:**
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings > Database
3. Copy connection string
4. Add to Vercel environment variables

**PlanetScale:**
1. Create database at [planetscale.com](https://planetscale.com)
2. Create connection string
3. Use format: `mysql://username:password@host/database?sslaccept=strict`

### 4. Authentication Secret Issues

**Symptoms:**
- NextAuth errors
- Session creation failures
- "Invalid secret" warnings

**Solutions:**

#### Generate Secure Secret:
```bash
# Using OpenSSL (Linux/Mac)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Online generator
# Visit: https://generate-secret.vercel.app/32
```

#### Set in Environment:
```bash
# Local development
echo 'NEXTAUTH_SECRET="your-generated-secret"' >> .env.local

# Vercel deployment
vercel env add NEXTAUTH_SECRET
```

**Security Notes:**
- Must be at least 32 characters
- Keep secret secure
- Use different secrets for different environments
- Never commit to version control

## Variable-Specific Guides

### NEXT_PUBLIC_SITE_NAME
- **Purpose:** Display name for your website
- **Required:** Yes (all deployments)
- **Format:** Plain text string
- **Example:** `"NextGen Research Network"`
- **Troubleshooting:** Check for special characters that might break parsing

### NEXT_PUBLIC_BASE_URL
- **Purpose:** Canonical URL for your application
- **Required:** Yes (all deployments)
- **Format:** Full URL with protocol
- **Example:** `"https://research.example.com"`
- **Vercel:** Often auto-provided via VERCEL_URL
- **Troubleshooting:** 
  - Ensure protocol is included
  - No trailing slash
  - Use HTTPS for production

### DATABASE_URL
- **Purpose:** Primary database connection
- **Required:** Full deployment only
- **Format:** Database connection string
- **Example:** `"postgresql://user:pass@host:5432/db"`
- **Troubleshooting:**
  - Test connection with database client
  - Check firewall settings
  - Verify SSL requirements

### DIRECT_URL
- **Purpose:** Direct database connection (bypasses connection pooling)
- **Required:** Full deployment only
- **Format:** Database connection string
- **Example:** Same as DATABASE_URL for most providers
- **Troubleshooting:** Usually same as DATABASE_URL unless using connection pooling

### NEXTAUTH_SECRET
- **Purpose:** Encryption key for NextAuth.js sessions
- **Required:** Full deployment with authentication
- **Format:** Base64 encoded string (32+ characters)
- **Security:** Highly sensitive - never expose
- **Troubleshooting:**
  - Regenerate if compromised
  - Ensure sufficient length
  - Different for each environment

### NEXTAUTH_URL
- **Purpose:** Canonical URL for authentication callbacks
- **Required:** Full deployment with authentication
- **Format:** Full URL with protocol
- **Example:** Same as NEXT_PUBLIC_BASE_URL
- **Vercel:** Often auto-provided
- **Troubleshooting:** Must match your domain exactly

### GEMINI_API_KEY
- **Purpose:** Google Gemini AI API access
- **Required:** Only if AI features enabled
- **Format:** API key starting with "AI"
- **Security:** Sensitive - never expose in client code
- **Troubleshooting:**
  - Verify API key is active
  - Check quota limits
  - Test with simple API call

## Vercel Setup Instructions

### Using Vercel Dashboard

1. **Access Environment Variables:**
   - Log in to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings tab
   - Click "Environment Variables" in sidebar

2. **Add New Variable:**
   - Click "Add New"
   - Enter variable name (e.g., `NEXT_PUBLIC_SITE_NAME`)
   - Enter variable value
   - Select environments:
     - **Production:** Live deployments
     - **Preview:** Pull request deployments
     - **Development:** Local development (optional)

3. **Security Settings:**
   - Mark sensitive variables as "Sensitive"
   - This hides values in the dashboard
   - Recommended for API keys and secrets

4. **Apply Changes:**
   - Click "Save"
   - Redeploy your application
   - Changes take effect on next deployment

### Using Vercel CLI

1. **Setup CLI:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link your project
   vercel link
   ```

2. **Manage Variables:**
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

3. **Bulk Import:**
   ```bash
   # Create .env file with variables
   echo "NEXT_PUBLIC_SITE_NAME=My Site" > .env.production
   echo "DATABASE_URL=postgresql://..." >> .env.production
   
   # Import to Vercel
   vercel env add < .env.production
   ```

### Environment-Specific Configuration

#### Production Environment
- Use secure, production-ready values
- Enable all necessary features
- Use HTTPS URLs
- Set strong secrets

#### Preview Environment
- Can use same values as production
- Useful for testing before deployment
- May use staging databases

#### Development Environment
- Use local development values
- Can use localhost URLs
- May use different database

## Local Development Setup

### Creating .env.local File

```bash
# Create environment file
touch .env.local

# Add basic configuration
cat << EOF > .env.local
# Basic Configuration
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="My Research Site (Dev)"

# Feature Flags (for simple deployment)
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"

# Optional: Analytics
# NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
EOF
```

### Full Development Setup

```bash
# For full feature development
cat << EOF > .env.local
# Basic Configuration
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="My Research Site (Dev)"

# Feature Flags (for full deployment)
NEXT_PUBLIC_ENABLE_CMS="true"
NEXT_PUBLIC_ENABLE_AUTH="true"
NEXT_PUBLIC_ENABLE_SEARCH="true"
NEXT_PUBLIC_ENABLE_AI="true"
NEXT_PUBLIC_ENABLE_MEDIA="true"

# Database (use local PostgreSQL or cloud)
DATABASE_URL="postgresql://postgres:password@localhost:5432/ngsrn_dev"
DIRECT_URL="postgresql://postgres:password@localhost:5432/ngsrn_dev"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# Optional Services
# GEMINI_API_KEY="your-api-key"
# AWS_ACCESS_KEY_ID="your-access-key"
# AWS_SECRET_ACCESS_KEY="your-secret-key"
# AWS_S3_BUCKET="your-bucket"
EOF
```

### Loading Environment Variables

```bash
# Verify variables are loaded
node -e "console.log(process.env.NEXT_PUBLIC_SITE_NAME)"

# Check all NEXT_PUBLIC variables
env | grep NEXT_PUBLIC

# Validate environment
npm run validate:env
```

## Security Best Practices

### Sensitive Variables
- **Never commit to version control**
- **Use different values per environment**
- **Rotate secrets regularly**
- **Mark as sensitive in Vercel dashboard**

### Variable Naming
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Keep server-side secrets without prefix
- Use consistent naming conventions
- Document all variables

### Access Control
- Limit who can view/edit environment variables
- Use Vercel team permissions
- Audit variable access regularly
- Monitor for unauthorized changes

### Validation
- Validate variable formats
- Check for placeholder values
- Test with actual values
- Monitor for configuration drift

## Advanced Troubleshooting

### Debug Environment Loading

```bash
# Check Next.js environment loading
node -e "
const { loadEnvConfig } = require('@next/env');
const projectDir = process.cwd();
loadEnvConfig(projectDir);
console.log('Loaded environment variables:');
Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .forEach(key => console.log(\`\${key}=\${process.env[key]}\`));
"
```

### Test Database Connection

```bash
# Test PostgreSQL connection
node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database error:', err.message))
  .finally(() => client.end());
"
```

### Validate API Keys

```bash
# Test Gemini API key
node -e "
const fetch = require('node-fetch');
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log('❌ GEMINI_API_KEY not set');
  process.exit(1);
}
console.log('✅ GEMINI_API_KEY is set');
console.log('Format check:', apiKey.startsWith('AI') ? '✅' : '❌');
"
```

### Environment Diff Tool

```bash
# Compare local vs Vercel environment
vercel env pull .env.vercel
diff .env.local .env.vercel
```

### Common File Locations

- **Local development:** `.env.local`
- **Production values:** Vercel dashboard
- **Backup/template:** `.env.example`
- **Validation script:** `scripts/env-config.js`
- **Build validation:** `scripts/validate-build.js`

### Getting Help

1. **Check validation output:** Run `node scripts/env-config.js validate`
2. **Review this guide:** Look for your specific error message
3. **Check Vercel docs:** [Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
4. **Test locally first:** Ensure variables work in development
5. **Use auto-fix:** Run `node scripts/validate-build.js --auto-fix`

### Emergency Recovery

If your deployment is completely broken:

1. **Reset to simple deployment:**
   ```bash
   # Set minimal required variables
   vercel env add NEXT_PUBLIC_SITE_NAME production
   vercel env add NEXT_PUBLIC_BASE_URL production
   
   # Disable all features
   vercel env add NEXT_PUBLIC_ENABLE_CMS false production
   vercel env add NEXT_PUBLIC_ENABLE_AUTH false production
   vercel env add NEXT_PUBLIC_ENABLE_SEARCH false production
   vercel env add NEXT_PUBLIC_ENABLE_AI false production
   vercel env add NEXT_PUBLIC_ENABLE_MEDIA false production
   ```

2. **Redeploy:**
   ```bash
   vercel --prod
   ```

3. **Gradually re-enable features** once basic deployment works.