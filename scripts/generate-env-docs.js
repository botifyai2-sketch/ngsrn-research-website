#!/usr/bin/env node

/**
 * Environment Variable Documentation Generator
 * Generates comprehensive documentation for all environment variables
 */

const fs = require('fs');
const path = require('path');
const { ENV_CONFIGS, ENV_VARIABLE_DESCRIPTIONS } = require('./env-config');
const { TROUBLESHOOTING_GUIDES } = require('./error-reporting');

/**
 * Generate comprehensive environment variable documentation
 */
function generateEnvironmentDocumentation() {
  const timestamp = new Date().toISOString();
  
  let documentation = `# Environment Variables Documentation

*Generated on: ${timestamp}*

This document provides comprehensive information about all environment variables used in the NGSRN website.

## Table of Contents

- [Overview](#overview)
- [Deployment Phases](#deployment-phases)
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Feature Flags](#feature-flags)
- [Security Considerations](#security-considerations)
- [Setup Instructions](#setup-instructions)
- [Troubleshooting](#troubleshooting)

## Overview

The NGSRN website uses environment variables to configure different aspects of the application, from basic settings like site name to complex integrations like database connections and AI services.

### Variable Types

- **NEXT_PUBLIC_*** - Client-side variables (exposed to browser)
- **Server-only** - Backend variables (never exposed to client)
- **Required** - Must be set for deployment to work
- **Optional** - Enhance functionality but not required

### Deployment Phases

The application supports two deployment phases:

1. **Simple Deployment** - Static site with minimal features
2. **Full Deployment** - Complete application with all features

## Deployment Phases

`;

  // Document each deployment phase
  Object.entries(ENV_CONFIGS).forEach(([phase, config]) => {
    documentation += `### ${phase.charAt(0).toUpperCase() + phase.slice(1)} Deployment

**Description:** ${config.description}

**Required Variables:**
`;
    config.required.forEach(varName => {
      const varInfo = ENV_VARIABLE_DESCRIPTIONS[varName];
      documentation += `- \`${varName}\` - ${varInfo?.description || 'No description available'}\n`;
    });

    documentation += `
**Optional Variables:**
`;
    config.optional.forEach(varName => {
      const varInfo = ENV_VARIABLE_DESCRIPTIONS[varName];
      documentation += `- \`${varName}\` - ${varInfo?.description || 'No description available'}\n`;
    });

    documentation += `
**Feature Flags:**
`;
    Object.entries(config.features).forEach(([flag, value]) => {
      documentation += `- \`${flag}\` = \`"${value}"\`\n`;
    });

    documentation += '\n';
  });

  documentation += `## Required Variables

These variables must be set for the application to function properly.

`;

  // Document all required variables
  const allRequired = [...new Set([...ENV_CONFIGS.simple.required, ...ENV_CONFIGS.full.required])];
  
  allRequired.forEach(varName => {
    const varInfo = ENV_VARIABLE_DESCRIPTIONS[varName];
    const guide = TROUBLESHOOTING_GUIDES[varName];
    
    documentation += `### ${varName}

**Description:** ${varInfo?.description || 'No description available'}

**Required for:** ${ENV_CONFIGS.simple.required.includes(varName) ? 'Simple, ' : ''}${ENV_CONFIGS.full.required.includes(varName) ? 'Full' : ''}

**Format:** ${varInfo?.validationPattern ? varInfo.validationPattern.toString() : 'String'}

**Default Value:** ${varInfo?.defaultValue ? `\`"${varInfo.defaultValue}"\`` : 'None'}

**Vercel Auto-Provided:** ${varInfo?.vercelAutoProvided ? 'Yes' : 'No'}

**Setup Instructions:** ${varInfo?.setupInstructions || 'Set this variable in your environment'}

`;

    if (guide) {
      documentation += `**Detailed Setup:**
`;
      guide.steps.forEach((step, index) => {
        documentation += `${index + 1}. ${step}\n`;
      });
      
      if (guide.vercelInstructions) {
        documentation += `
**Vercel Setup:**
- Dashboard: ${guide.vercelInstructions.dashboard}
- CLI: \`${guide.vercelInstructions.cli}\`
`;
      }
      
      if (guide.localSetup) {
        documentation += `
**Local Setup:** ${guide.localSetup}
`;
      }
      
      if (guide.validation) {
        documentation += `
**Validation:** ${guide.validation}
`;
      }
      
      if (guide.security) {
        documentation += `
**Security Note:** ${guide.security}
`;
      }
    }

    documentation += '\n---\n\n';
  });

  documentation += `## Optional Variables

These variables enable additional features but are not required for basic functionality.

`;

  // Document all optional variables
  const allOptional = [...new Set([...ENV_CONFIGS.simple.optional, ...ENV_CONFIGS.full.optional])];
  
  allOptional.forEach(varName => {
    const varInfo = ENV_VARIABLE_DESCRIPTIONS[varName];
    const guide = TROUBLESHOOTING_GUIDES[varName];
    
    documentation += `### ${varName}

**Description:** ${varInfo?.description || 'No description available'}

**Enables:** ${getFeatureDescription(varName)}

**Format:** ${varInfo?.validationPattern ? varInfo.validationPattern.toString() : 'String'}

**Setup Instructions:** ${varInfo?.setupInstructions || 'Set this variable to enable additional features'}

`;

    if (guide && guide.providers) {
      documentation += `**Recommended Providers:**
`;
      guide.providers.forEach(provider => {
        documentation += `- [${provider.name}](${provider.url})\n`;
      });
      documentation += '\n';
    }

    documentation += '---\n\n';
  });

  documentation += `## Feature Flags

Feature flags control which parts of the application are enabled.

| Flag | Simple Deployment | Full Deployment | Description |
|------|-------------------|-----------------|-------------|
`;

  const featureDescriptions = {
    NEXT_PUBLIC_ENABLE_CMS: 'Content Management System for creating and editing articles',
    NEXT_PUBLIC_ENABLE_AUTH: 'User authentication and authorization system',
    NEXT_PUBLIC_ENABLE_SEARCH: 'Advanced search functionality with filters',
    NEXT_PUBLIC_ENABLE_AI: 'AI-powered features like content assistance',
    NEXT_PUBLIC_ENABLE_MEDIA: 'Media upload and management system'
  };

  Object.keys(featureDescriptions).forEach(flag => {
    const simpleValue = ENV_CONFIGS.simple.features[flag] || 'false';
    const fullValue = ENV_CONFIGS.full.features[flag] || 'false';
    const description = featureDescriptions[flag];
    
    documentation += `| \`${flag}\` | \`"${simpleValue}"\` | \`"${fullValue}"\` | ${description} |\n`;
  });

  documentation += `
## Security Considerations

### Sensitive Variables

The following variables contain sensitive information and should be handled with care:

- **NEXTAUTH_SECRET** - Authentication encryption key
- **DATABASE_URL** - Database connection string with credentials
- **DIRECT_URL** - Direct database connection string
- **GEMINI_API_KEY** - AI service API key
- **AWS_ACCESS_KEY_ID** - AWS access credentials
- **AWS_SECRET_ACCESS_KEY** - AWS secret credentials

### Best Practices

1. **Never commit sensitive variables to version control**
2. **Use different values for different environments**
3. **Mark sensitive variables as "Sensitive" in Vercel dashboard**
4. **Rotate secrets regularly**
5. **Use strong, randomly generated secrets**
6. **Limit access to environment variables**

### Variable Validation

All environment variables are validated during build time:

\`\`\`bash
# Validate current environment
node scripts/env-config.js validate

# Validate specific phase
node scripts/env-config.js validate simple
node scripts/env-config.js validate full
\`\`\`

## Setup Instructions

### Local Development

1. **Create environment file:**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. **Edit variables:**
   \`\`\`bash
   # Basic setup for simple deployment
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   NEXT_PUBLIC_SITE_NAME="My Research Site (Dev)"
   
   # Feature flags
   NEXT_PUBLIC_ENABLE_CMS="false"
   NEXT_PUBLIC_ENABLE_AUTH="false"
   NEXT_PUBLIC_ENABLE_SEARCH="false"
   NEXT_PUBLIC_ENABLE_AI="false"
   NEXT_PUBLIC_ENABLE_MEDIA="false"
   \`\`\`

3. **Validate setup:**
   \`\`\`bash
   npm run validate:env
   \`\`\`

### Vercel Deployment

#### Using Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to Settings > Environment Variables
4. Add each required variable for your deployment phase
5. Mark sensitive variables as "Sensitive"
6. Deploy your application

#### Using CLI

\`\`\`bash
# Install and setup Vercel CLI
npm i -g vercel
vercel login
vercel link

# Add variables interactively
vercel env add NEXT_PUBLIC_SITE_NAME
vercel env add NEXT_PUBLIC_BASE_URL

# For full deployment, add additional variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET

# Deploy
vercel --prod
\`\`\`

### Automated Setup

Use the provided scripts for automated setup:

\`\`\`bash
# Generate environment file for simple deployment
node scripts/env-config.js generate simple

# Generate environment file for full deployment
node scripts/env-config.js generate full

# Prepare for deployment with validation
node scripts/env-config.js prepare simple
\`\`\`

## Troubleshooting

### Common Issues

1. **Missing required variables** - Check the error message and add the missing variable
2. **Invalid format** - Ensure URLs include protocol, secrets are long enough
3. **Vercel auto-provided conflicts** - Remove manual variables that Vercel provides automatically
4. **Feature flag mismatches** - Ensure feature flags match your deployment phase

### Validation Tools

\`\`\`bash
# Comprehensive validation
node scripts/validate-build.js

# Auto-fix common issues
node scripts/validate-build.js --auto-fix

# Check specific variable
node -e "console.log(process.env.NEXT_PUBLIC_SITE_NAME)"
\`\`\`

### Getting Help

1. **Check validation output** for specific error messages
2. **Review troubleshooting guide** at \`ENVIRONMENT_TROUBLESHOOTING_GUIDE.md\`
3. **Use auto-fix tools** when available
4. **Test locally first** before deploying to Vercel

### Emergency Recovery

If deployment is broken, reset to minimal configuration:

\`\`\`bash
# Set only required variables for simple deployment
vercel env add NEXT_PUBLIC_SITE_NAME production
vercel env add NEXT_PUBLIC_BASE_URL production

# Disable all features
vercel env add NEXT_PUBLIC_ENABLE_CMS false production
vercel env add NEXT_PUBLIC_ENABLE_AUTH false production
vercel env add NEXT_PUBLIC_ENABLE_SEARCH false production
vercel env add NEXT_PUBLIC_ENABLE_AI false production
vercel env add NEXT_PUBLIC_ENABLE_MEDIA false production

# Redeploy
vercel --prod
\`\`\`

---

*This documentation is automatically generated. For the most up-to-date information, run:*
\`\`\`bash
node scripts/generate-env-docs.js
\`\`\`
`;

  return documentation;
}

/**
 * Get feature description for optional variables
 */
function getFeatureDescription(varName) {
  const descriptions = {
    'NEXT_PUBLIC_GA_ID': 'Google Analytics tracking',
    'GEMINI_API_KEY': 'AI-powered content assistance',
    'AWS_ACCESS_KEY_ID': 'AWS S3 media storage',
    'AWS_SECRET_ACCESS_KEY': 'AWS S3 media storage',
    'AWS_S3_BUCKET': 'AWS S3 media storage',
    'REDIS_URL': 'Caching and session storage',
    'ELASTICSEARCH_URL': 'Advanced search functionality'
  };
  
  return descriptions[varName] || 'Additional functionality';
}

/**
 * Generate environment variable reference card
 */
function generateQuickReference() {
  const quickRef = `# Environment Variables Quick Reference

## Simple Deployment (Static Site)

### Required
\`\`\`bash
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
NEXT_PUBLIC_SITE_NAME="Your Site Name"
\`\`\`

### Feature Flags
\`\`\`bash
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"
\`\`\`

## Full Deployment (Complete Application)

### Required
\`\`\`bash
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
NEXT_PUBLIC_SITE_NAME="Your Site Name"
DATABASE_URL="postgresql://user:pass@host:5432/db"
DIRECT_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://yourdomain.com"
\`\`\`

### Feature Flags
\`\`\`bash
NEXT_PUBLIC_ENABLE_CMS="true"
NEXT_PUBLIC_ENABLE_AUTH="true"
NEXT_PUBLIC_ENABLE_SEARCH="true"
NEXT_PUBLIC_ENABLE_AI="true"
NEXT_PUBLIC_ENABLE_MEDIA="true"
\`\`\`

### Optional
\`\`\`bash
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
GEMINI_API_KEY="your-api-key"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket"
REDIS_URL="redis://host:6379"
ELASTICSEARCH_URL="https://host:9200"
\`\`\`

## Validation Commands

\`\`\`bash
# Validate environment
node scripts/env-config.js validate

# Auto-fix issues
node scripts/validate-build.js --auto-fix

# Generate environment file
node scripts/env-config.js generate simple
\`\`\`
`;

  return quickRef;
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2] || 'full';
  
  try {
    switch (command) {
      case 'full':
        console.log('📝 Generating comprehensive environment documentation...');
        const fullDocs = generateEnvironmentDocumentation();
        fs.writeFileSync('ENVIRONMENT_VARIABLES.md', fullDocs);
        console.log('✅ Documentation generated: ENVIRONMENT_VARIABLES.md');
        break;
        
      case 'quick':
        console.log('📝 Generating quick reference...');
        const quickRef = generateQuickReference();
        fs.writeFileSync('ENVIRONMENT_QUICK_REFERENCE.md', quickRef);
        console.log('✅ Quick reference generated: ENVIRONMENT_QUICK_REFERENCE.md');
        break;
        
      case 'both':
        console.log('📝 Generating both documentation files...');
        const docs = generateEnvironmentDocumentation();
        const ref = generateQuickReference();
        fs.writeFileSync('ENVIRONMENT_VARIABLES.md', docs);
        fs.writeFileSync('ENVIRONMENT_QUICK_REFERENCE.md', ref);
        console.log('✅ Documentation generated:');
        console.log('   - ENVIRONMENT_VARIABLES.md');
        console.log('   - ENVIRONMENT_QUICK_REFERENCE.md');
        break;
        
      default:
        console.log('Environment Variable Documentation Generator');
        console.log('');
        console.log('Usage: node generate-env-docs.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  full  - Generate comprehensive documentation (default)');
        console.log('  quick - Generate quick reference card');
        console.log('  both  - Generate both documentation files');
    }
  } catch (error) {
    console.error('❌ Error generating documentation:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateEnvironmentDocumentation,
  generateQuickReference
};