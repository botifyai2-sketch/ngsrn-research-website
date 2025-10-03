# Vercel Environment Setup Instructions
# Generated on: 2025-10-03T05:17:30.230Z
# Phase: simple deployment
# Environment: development

## Required Environment Variables for Vercel Dashboard

Set these variables in your Vercel project dashboard:
Project Settings → Environment Variables

### Required Variables:

NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
# Description: The base URL of your application (e.g., https://your-app.vercel.app)
# Setup: Set in Vercel dashboard under Environment Variables, or will be auto-generated from VERCEL_URL

NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"
# Description: The display name of your website
# Setup: Set in Vercel dashboard: NEXT_PUBLIC_SITE_NAME = "Your Site Name"

### Optional Variables:

# NEXT_PUBLIC_GA_ID="your-value-here"
# Description: Google Analytics 4 measurement ID (optional)
# Setup: Get from Google Analytics dashboard (format: G-XXXXXXXXXX)

### Feature Flags:
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"

## Vercel-Specific Notes:

1. **Auto-provided Variables**: Vercel automatically provides these variables:
   - VERCEL=1
   - VERCEL_URL (your deployment URL)
   - VERCEL_ENV (production/preview/development)
   - VERCEL_REGION (deployment region)

2. **URL Configuration**: 
   - NEXT_PUBLIC_BASE_URL and NEXTAUTH_URL will be auto-generated from VERCEL_URL
   - Only set these manually if using a custom domain

3. **Environment Precedence**:
   - Vercel dashboard variables override local .env files
   - Use Vercel dashboard for production secrets
   - Keep local .env files for development only

4. **Security Best Practices**:
   - Never commit secrets to git
   - Use Vercel dashboard for all sensitive variables
   - Rotate secrets regularly

## Setup Commands:

# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project (run in project directory)
vercel link

# Set environment variables via CLI (alternative to dashboard)
vercel env add NEXT_PUBLIC_SITE_NAME
vercel env add DATABASE_URL
# ... add other variables as needed

# Deploy
vercel --prod

## Troubleshooting:

- Check environment variables: vercel env ls
- View deployment logs: vercel logs [deployment-url]
- Test locally with Vercel: vercel dev
