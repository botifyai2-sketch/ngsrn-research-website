#!/usr/bin/env node

/**
 * Environment Configuration Script for Vercel Deployment
 * Handles simple and full deployment configurations
 */

const fs = require('fs');
const path = require('path');

// Detailed environment variable descriptions for better error reporting
const ENV_VARIABLE_DESCRIPTIONS = {
  'NEXT_PUBLIC_BASE_URL': {
    description: 'The base URL of your application (e.g., https://your-app.vercel.app)',
    defaultValue: 'https://your-app.vercel.app',
    vercelAutoProvided: true,
    validationPattern: /^https?:\/\/.+/,
    setupInstructions: 'Set in Vercel dashboard under Environment Variables, or will be auto-generated from VERCEL_URL'
  },
  'NEXT_PUBLIC_SITE_NAME': {
    description: 'The display name of your website',
    defaultValue: 'NextGen Sustainable Research Network',
    vercelAutoProvided: false,
    setupInstructions: 'Set in Vercel dashboard: NEXT_PUBLIC_SITE_NAME = "Your Site Name"'
  },
  'DATABASE_URL': {
    description: 'PostgreSQL database connection string for Prisma',
    vercelAutoProvided: false,
    setupInstructions: 'Set in Vercel dashboard with your database provider connection string'
  },
  'DIRECT_URL': {
    description: 'Direct database connection string for migrations and connection pooling',
    vercelAutoProvided: false,
    setupInstructions: 'Set in Vercel dashboard, usually same as DATABASE_URL for most providers'
  },
  'NEXTAUTH_SECRET': {
    description: 'Secret key for NextAuth.js session encryption',
    vercelAutoProvided: false,
    setupInstructions: 'Generate with: openssl rand -base64 32, then set in Vercel dashboard'
  },
  'NEXTAUTH_URL': {
    description: 'Canonical URL for NextAuth.js callbacks',
    vercelAutoProvided: true,
    setupInstructions: 'Set to your domain URL, or will be auto-generated from VERCEL_URL'
  },
  'NEXT_PUBLIC_GA_ID': {
    description: 'Google Analytics 4 measurement ID (optional)',
    vercelAutoProvided: false,
    setupInstructions: 'Get from Google Analytics dashboard (format: G-XXXXXXXXXX)'
  },
  'GEMINI_API_KEY': {
    description: 'Google Gemini AI API key for AI features (optional)',
    vercelAutoProvided: false,
    setupInstructions: 'Get from Google AI Studio and set in Vercel dashboard'
  },
  'AWS_ACCESS_KEY_ID': {
    description: 'AWS access key for S3 media storage (optional)',
    vercelAutoProvided: false,
    setupInstructions: 'Get from AWS IAM and set in Vercel dashboard'
  },
  'AWS_SECRET_ACCESS_KEY': {
    description: 'AWS secret key for S3 media storage (optional)',
    vercelAutoProvided: false,
    setupInstructions: 'Get from AWS IAM and set in Vercel dashboard'
  },
  'AWS_S3_BUCKET': {
    description: 'AWS S3 bucket name for media storage (optional)',
    vercelAutoProvided: false,
    setupInstructions: 'Create S3 bucket and set bucket name in Vercel dashboard'
  },
  'REDIS_URL': {
    description: 'Redis connection string for caching (optional)',
    vercelAutoProvided: false,
    setupInstructions: 'Get from Redis provider and set in Vercel dashboard'
  },
  'ELASTICSEARCH_URL': {
    description: 'Elasticsearch connection string for search (optional)',
    vercelAutoProvided: false,
    setupInstructions: 'Get from Elasticsearch provider and set in Vercel dashboard'
  }
};

// Vercel auto-provided environment variables that should be recognized
const VERCEL_AUTO_PROVIDED = [
  'VERCEL',
  'VERCEL_URL',
  'VERCEL_ENV',
  'VERCEL_REGION',
  'VERCEL_GIT_COMMIT_SHA',
  'VERCEL_GIT_COMMIT_MESSAGE',
  'VERCEL_GIT_COMMIT_AUTHOR_LOGIN',
  'VERCEL_GIT_COMMIT_AUTHOR_NAME',
  'VERCEL_GIT_PREVIOUS_SHA',
  'VERCEL_GIT_PROVIDER',
  'VERCEL_GIT_REPO_ID',
  'VERCEL_GIT_REPO_OWNER',
  'VERCEL_GIT_REPO_SLUG'
];

// Environment configurations for different deployment phases
const ENV_CONFIGS = {
  simple: {
    description: 'Simple static deployment without database dependencies',
    required: [
      'NEXT_PUBLIC_BASE_URL',
      'NEXT_PUBLIC_SITE_NAME'
    ],
    optional: [
      'NEXT_PUBLIC_GA_ID'
    ],
    features: {
      NEXT_PUBLIC_ENABLE_CMS: 'false',
      NEXT_PUBLIC_ENABLE_AUTH: 'false',
      NEXT_PUBLIC_ENABLE_SEARCH: 'false',
      NEXT_PUBLIC_ENABLE_AI: 'false',
      NEXT_PUBLIC_ENABLE_MEDIA: 'false'
    }
  },
  full: {
    description: 'Full production deployment with all features',
    required: [
      'NEXT_PUBLIC_BASE_URL',
      'NEXT_PUBLIC_SITE_NAME',
      'DATABASE_URL',
      'DIRECT_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ],
    optional: [
      'NEXT_PUBLIC_GA_ID',
      'GEMINI_API_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_S3_BUCKET',
      'REDIS_URL',
      'ELASTICSEARCH_URL'
    ],
    features: {
      NEXT_PUBLIC_ENABLE_CMS: 'true',
      NEXT_PUBLIC_ENABLE_AUTH: 'true',
      NEXT_PUBLIC_ENABLE_SEARCH: 'true',
      NEXT_PUBLIC_ENABLE_AI: 'true',
      NEXT_PUBLIC_ENABLE_MEDIA: 'true'
    }
  }
};

/**
 * Detects if running in Vercel environment with comprehensive context detection
 */
function detectVercelEnvironment(env = process.env) {
  const isVercel = !!(env.VERCEL || env.VERCEL_URL);
  const vercelEnv = env.VERCEL_ENV || 'development';
  const vercelUrl = env.VERCEL_URL;
  
  // Enhanced Vercel context detection
  const vercelContext = {
    isVercel,
    environment: vercelEnv,
    url: vercelUrl,
    region: env.VERCEL_REGION,
    gitProvider: env.VERCEL_GIT_PROVIDER,
    gitRepo: env.VERCEL_GIT_REPO_SLUG,
    gitOwner: env.VERCEL_GIT_REPO_OWNER,
    commitSha: env.VERCEL_GIT_COMMIT_SHA,
    autoProvidedVars: VERCEL_AUTO_PROVIDED.filter(varName => env[varName])
  };
  
  // Determine deployment type based on Vercel environment
  if (isVercel) {
    vercelContext.deploymentType = vercelEnv === 'production' ? 'production' : 
                                  vercelEnv === 'preview' ? 'preview' : 'development';
    
    // Generate expected URLs based on Vercel context
    if (vercelUrl) {
      vercelContext.expectedBaseUrl = `https://${vercelUrl}`;
      vercelContext.expectedAuthUrl = `https://${vercelUrl}`;
    }
    
    // Check for custom domain
    if (vercelUrl && !vercelUrl.includes('.vercel.app')) {
      vercelContext.hasCustomDomain = true;
      vercelContext.customDomain = vercelUrl;
    } else {
      vercelContext.hasCustomDomain = false;
    }
  }
  
  return vercelContext;
}

/**
 * Determines deployment phase based on feature flags
 */
function detectDeploymentPhase(env = process.env) {
  const features = {
    cms: env.NEXT_PUBLIC_ENABLE_CMS === 'true',
    auth: env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
    search: env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
    ai: env.NEXT_PUBLIC_ENABLE_AI === 'true',
    media: env.NEXT_PUBLIC_ENABLE_MEDIA === 'true'
  };
  
  const hasAnyFeature = Object.values(features).some(Boolean);
  return hasAnyFeature ? 'full' : 'simple';
}

/**
 * Enhanced environment validation with Vercel integration and precedence handling
 */
function validateEnvironment(phase = null, env = process.env) {
  // Import enhanced error reporting
  const { EnhancedErrorReporter } = require('./error-reporting');
  const reporter = new EnhancedErrorReporter();
  
  // Auto-detect phase if not provided
  if (!phase) {
    phase = detectDeploymentPhase(env);
  }
  
  console.log(`🔍 Validating ${phase} deployment environment...`);
  
  const config = ENV_CONFIGS[phase];
  if (!config) {
    throw new Error(`Unknown deployment phase: ${phase}. Valid phases: simple, full`);
  }
  
  const vercelInfo = detectVercelEnvironment(env);
  
  console.log(`📋 Deployment phase: ${phase} (${config.description})`);
  
  if (vercelInfo.isVercel) {
    console.log(`🚀 Vercel environment detected: ${vercelInfo.environment} (${vercelInfo.deploymentType})`);
    if (vercelInfo.url) {
      console.log(`🌐 Vercel URL: ${vercelInfo.url}`);
      if (vercelInfo.hasCustomDomain) {
        console.log(`🎯 Custom domain detected: ${vercelInfo.customDomain}`);
      }
    }
    if (vercelInfo.region) {
      console.log(`📍 Vercel region: ${vercelInfo.region}`);
    }
    console.log(`🔧 Auto-provided variables: ${vercelInfo.autoProvidedVars.length}`);
  }
  
  // Check environment variable precedence and conflicts
  const precedenceIssues = checkEnvironmentPrecedence(env, vercelInfo);
  precedenceIssues.forEach(issue => {
    reporter.addError(issue.type, issue.variable, issue.message, issue.context);
  });
  
  // Check required variables with enhanced Vercel-aware error reporting
  config.required.forEach(varName => {
    const varInfo = ENV_VARIABLE_DESCRIPTIONS[varName];
    const isSet = !!env[varName];
    
    if (!isSet) {
      // Check if Vercel can auto-provide this variable
      if (varInfo?.vercelAutoProvided && vercelInfo.isVercel) {
        if (varName === 'NEXT_PUBLIC_BASE_URL' && vercelInfo.expectedBaseUrl) {
          console.log(`ℹ️  ${varName} will be auto-generated from VERCEL_URL: ${vercelInfo.expectedBaseUrl}`);
          return;
        }
        if (varName === 'NEXTAUTH_URL' && vercelInfo.expectedAuthUrl) {
          console.log(`ℹ️  ${varName} will be auto-generated from VERCEL_URL: ${vercelInfo.expectedAuthUrl}`);
          return;
        }
      }
      
      // Variable is missing and not auto-provided
      reporter.addError('MISSING_REQUIRED_VAR', varName, null, {
        description: varInfo?.description,
        defaultValue: varInfo?.defaultValue,
        phase: phase,
        vercelAutoProvided: varInfo?.vercelAutoProvided,
        vercelContext: vercelInfo.isVercel ? vercelInfo : null
      });
    } else {
      // Variable is set, validate format and Vercel compatibility
      if (varInfo?.validationPattern && !varInfo.validationPattern.test(env[varName])) {
        reporter.addError('INVALID_FORMAT', varName, null, {
          expectedFormat: varInfo.validationPattern.toString(),
          currentValue: env[varName].substring(0, 20) + '...' // Truncate for security
        });
      }
      
      // Check for Vercel-specific validation
      if (vercelInfo.isVercel) {
        validateVercelCompatibility(varName, env[varName], vercelInfo, reporter);
      }
    }
  });
  
  // Check optional variables with warnings
  config.optional.forEach(varName => {
    const varInfo = ENV_VARIABLE_DESCRIPTIONS[varName];
    
    if (!env[varName]) {
      reporter.addError('MISSING_OPTIONAL_VAR', varName, null, {
        description: varInfo?.description,
        phase: phase
      });
    }
  });
  
  // Validate feature flags with phase awareness
  Object.entries(config.features).forEach(([key, expectedValue]) => {
    const actualValue = env[key];
    if (actualValue && actualValue !== expectedValue) {
      reporter.addError('FEATURE_CONFLICT', key, null, {
        expectedValue,
        actualValue,
        phase: phase
      });
    }
  });
  
  // Enhanced Vercel-specific validations
  if (vercelInfo.isVercel) {
    validateVercelSpecificConfiguration(env, vercelInfo, reporter, phase);
  }
  
  // Check for security warnings
  if (env.NEXTAUTH_SECRET && env.NEXTAUTH_SECRET.length < 32) {
    reporter.addError('SECURITY_WARNING', 'NEXTAUTH_SECRET', 
      'Authentication secret is too short (should be 32+ characters)', {
        currentLength: env.NEXTAUTH_SECRET.length,
        recommendedLength: 32
      });
  }
  
  // Generate and print comprehensive report
  const report = reporter.printReport(phase, vercelInfo);
  
  // Return validation result in expected format
  const validationResult = {
    isValid: report.summary.isValid,
    errors: reporter.errors,
    warnings: reporter.warnings,
    suggestions: report.quickFixes,
    phase,
    vercelInfo,
    report
  };
  
  if (validationResult.isValid) {
    console.log(`✅ Environment validation passed for ${phase} deployment`);
  }
  
  return validationResult;
}

function generateEnvironmentFile(phase = 'simple', outputPath = null) {
  console.log(`📝 Generating environment file for ${phase} deployment...`);
  
  const config = ENV_CONFIGS[phase];
  const timestamp = new Date().toISOString();
  
  let envContent = `# Environment Configuration for ${config.description}
# Generated on: ${timestamp}
# Phase: ${phase}

# Basic Configuration
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"

# Feature Flags
`;

  // Add feature flags
  Object.entries(config.features).forEach(([key, value]) => {
    envContent += `${key}="${value}"\n`;
  });
  
  if (phase === 'simple') {
    envContent += `
# Google Analytics (optional for simple deployment)
# NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Note: Database and authentication features are disabled for simple deployment
# To enable full features, use the 'full' deployment phase
`;
  } else {
    envContent += `
# Database Configuration
DATABASE_URL="postgresql://username:password@host:5432/ngsrn_production"
DIRECT_URL="postgresql://username:password@host:5432/ngsrn_production"

# Authentication
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Google Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# AI Services (optional)
# GEMINI_API_KEY="your-gemini-api-key"

# AWS Configuration (optional)
# AWS_ACCESS_KEY_ID="your-aws-access-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
# AWS_S3_BUCKET="your-s3-bucket"

# Cache and Search (optional)
# REDIS_URL="redis://username:password@host:6379"
# ELASTICSEARCH_URL="https://username:password@host:9200"
`;
  }
  
  const filePath = outputPath || `.env.${phase}`;
  fs.writeFileSync(filePath, envContent);
  console.log(`✅ Environment file created: ${filePath}`);
  
  return filePath;
}

function checkFeatureFlags(env = process.env) {
  console.log('🏁 Checking feature flag configuration...');
  
  const flags = {
    cms: env.NEXT_PUBLIC_ENABLE_CMS === 'true',
    auth: env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
    search: env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
    ai: env.NEXT_PUBLIC_ENABLE_AI === 'true',
    media: env.NEXT_PUBLIC_ENABLE_MEDIA === 'true'
  };
  
  console.log('Feature flags status:');
  Object.entries(flags).forEach(([feature, enabled]) => {
    const status = enabled ? '✅ Enabled' : '❌ Disabled';
    console.log(`  ${feature.toUpperCase()}: ${status}`);
  });
  
  // Check for potential issues
  if (flags.cms && !flags.auth) {
    console.warn('⚠️  CMS is enabled but authentication is disabled. This may cause issues.');
  }
  
  if (flags.search && !env.ELASTICSEARCH_URL && !env.DATABASE_URL) {
    console.warn('⚠️  Search is enabled but no search backend is configured.');
  }
  
  if (flags.ai && !env.GEMINI_API_KEY) {
    console.warn('⚠️  AI features are enabled but no AI API key is configured.');
  }
  
  return flags;
}

function generateSecrets() {
  const crypto = require('crypto');
  
  const secrets = {
    NEXTAUTH_SECRET: crypto.randomBytes(32).toString('hex'),
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex')
  };
  
  console.log('🔐 Generated secure secrets:');
  console.log('Copy these to your Vercel environment variables:');
  console.log('');
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  console.log('');
  
  return secrets;
}

/**
 * Checks environment variable precedence and identifies conflicts
 */
function checkEnvironmentPrecedence(env, vercelInfo) {
  const issues = [];
  
  if (!vercelInfo.isVercel) {
    return issues; // No precedence issues for local development
  }
  
  // Check for local environment variables that might conflict with Vercel
  const localEnvFiles = ['.env.local', '.env.production', '.env'];
  const localVars = new Set();
  
  localEnvFiles.forEach(envFile => {
    const envPath = path.join(__dirname, '..', envFile);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#][^=]+)=/);
        if (match) {
          localVars.add(match[1].trim());
        }
      });
    }
  });
  
  // Check for variables that should be set in Vercel dashboard instead of local files
  const vercelOnlyVars = [
    'DATABASE_URL',
    'DIRECT_URL', 
    'NEXTAUTH_SECRET',
    'GEMINI_API_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY'
  ];
  
  vercelOnlyVars.forEach(varName => {
    if (localVars.has(varName) && vercelInfo.environment === 'production') {
      issues.push({
        type: 'PRECEDENCE_WARNING',
        variable: varName,
        message: `${varName} should be set in Vercel dashboard for production, not in local files`,
        context: {
          environment: vercelInfo.environment,
          suggestion: `Remove ${varName} from local .env files and set in Vercel dashboard`,
          securityRisk: true
        }
      });
    }
  });
  
  // Check for VERCEL_URL conflicts
  if (env.NEXT_PUBLIC_BASE_URL && vercelInfo.url) {
    const setBaseUrl = env.NEXT_PUBLIC_BASE_URL;
    const expectedBaseUrl = `https://${vercelInfo.url}`;
    
    if (setBaseUrl !== expectedBaseUrl && !setBaseUrl.includes('localhost')) {
      issues.push({
        type: 'VERCEL_URL_CONFLICT',
        variable: 'NEXT_PUBLIC_BASE_URL',
        message: `NEXT_PUBLIC_BASE_URL conflicts with Vercel auto-generated URL`,
        context: {
          setUrl: setBaseUrl,
          vercelUrl: expectedBaseUrl,
          suggestion: 'Remove NEXT_PUBLIC_BASE_URL to use Vercel auto-generated URL, or ensure it matches your custom domain'
        }
      });
    }
  }
  
  return issues;
}

/**
 * Validates Vercel-specific variable compatibility
 */
function validateVercelCompatibility(varName, value, vercelInfo, reporter) {
  switch (varName) {
    case 'NEXT_PUBLIC_BASE_URL':
      // Check if URL matches Vercel context
      if (vercelInfo.url && value) {
        const expectedUrl = `https://${vercelInfo.url}`;
        if (value.includes('localhost') && vercelInfo.environment === 'production') {
          reporter.addError('VERCEL_MISMATCH', varName, 
            'Base URL is set to localhost but deploying to production', {
              environment: vercelInfo.environment,
              currentValue: value,
              expectedValue: expectedUrl,
              suggestion: 'Remove NEXT_PUBLIC_BASE_URL to use Vercel auto-generated URL'
            });
        } else if (value !== expectedUrl && !vercelInfo.hasCustomDomain) {
          reporter.addError('VERCEL_URL_MISMATCH', varName,
            'Base URL does not match Vercel deployment URL', {
              currentValue: value,
              expectedValue: expectedUrl,
              suggestion: 'Update URL to match Vercel deployment or remove to use auto-generated URL'
            });
        }
      }
      break;
      
    case 'NEXTAUTH_URL':
      // Similar validation for NextAuth URL
      if (vercelInfo.url && value) {
        const expectedUrl = `https://${vercelInfo.url}`;
        if (value !== expectedUrl && !vercelInfo.hasCustomDomain) {
          reporter.addError('VERCEL_URL_MISMATCH', varName,
            'NextAuth URL does not match Vercel deployment URL', {
              currentValue: value,
              expectedValue: expectedUrl,
              suggestion: 'Update URL to match Vercel deployment or remove to use auto-generated URL'
            });
        }
      }
      break;
  }
}

/**
 * Validates Vercel-specific configuration requirements
 */
function validateVercelSpecificConfiguration(env, vercelInfo, reporter, phase) {
  // Check for production-specific requirements
  if (vercelInfo.environment === 'production') {
    // Ensure HTTPS is used for production URLs
    const baseUrl = env.NEXT_PUBLIC_BASE_URL;
    if (baseUrl && !baseUrl.startsWith('https://')) {
      reporter.addError('SECURITY_WARNING', 'NEXT_PUBLIC_BASE_URL',
        'Production deployment should use HTTPS', {
          currentValue: baseUrl,
          suggestion: 'Update URL to use https:// protocol'
        });
    }
    
    // Check for development-only configurations in production
    if (env.NODE_ENV === 'development') {
      reporter.addError('ENVIRONMENT_MISMATCH', 'NODE_ENV',
        'NODE_ENV is set to development but deploying to production', {
          environment: vercelInfo.environment,
          suggestion: 'Remove NODE_ENV from environment variables (Vercel sets this automatically)'
        });
    }
  }
  
  // Check for preview deployment considerations
  if (vercelInfo.environment === 'preview') {
    console.log('ℹ️  Preview deployment detected - some validations are relaxed');
    
    // Preview deployments can use different database configurations
    if (phase === 'full' && !env.DATABASE_URL) {
      reporter.addError('PREVIEW_WARNING', 'DATABASE_URL',
        'Preview deployment without database configuration', {
          suggestion: 'Consider setting up preview database or using development configuration'
        });
    }
  }
  
  // Validate Vercel-specific environment variables
  if (vercelInfo.gitProvider && vercelInfo.gitRepo) {
    console.log(`📦 Git integration: ${vercelInfo.gitProvider}/${vercelInfo.gitOwner}/${vercelInfo.gitRepo}`);
    if (vercelInfo.commitSha) {
      console.log(`📝 Commit: ${vercelInfo.commitSha.substring(0, 8)}`);
    }
  }
  
  // Check for region-specific considerations
  if (vercelInfo.region) {
    // Validate database region compatibility if applicable
    if (env.DATABASE_URL && env.DATABASE_URL.includes('amazonaws.com')) {
      const dbRegion = extractAWSRegion(env.DATABASE_URL);
      if (dbRegion && dbRegion !== vercelInfo.region) {
        reporter.addError('PERFORMANCE_WARNING', 'DATABASE_URL',
          'Database region may not match Vercel deployment region', {
            vercelRegion: vercelInfo.region,
            databaseRegion: dbRegion,
            suggestion: 'Consider using a database in the same region for better performance'
          });
      }
    }
  }
}

/**
 * Extracts AWS region from database URL
 */
function extractAWSRegion(databaseUrl) {
  const match = databaseUrl.match(/\.([a-z0-9-]+)\.rds\.amazonaws\.com/);
  return match ? match[1] : null;
}

/**
 * Generates Vercel-specific environment setup instructions
 */
function generateVercelSetupInstructions(phase = 'simple', vercelInfo = null) {
  console.log('📋 Generating Vercel environment setup instructions...');
  
  const config = ENV_CONFIGS[phase];
  const timestamp = new Date().toISOString();
  
  let instructions = `# Vercel Environment Setup Instructions
# Generated on: ${timestamp}
# Phase: ${phase} deployment
# Environment: ${vercelInfo?.environment || 'unknown'}

## Required Environment Variables for Vercel Dashboard

Set these variables in your Vercel project dashboard:
Project Settings → Environment Variables

### Required Variables:
`;

  config.required.forEach(varName => {
    const varInfo = ENV_VARIABLE_DESCRIPTIONS[varName];
    
    // Skip variables that Vercel auto-provides
    if (varInfo?.vercelAutoProvided && vercelInfo?.isVercel) {
      if ((varName === 'NEXT_PUBLIC_BASE_URL' || varName === 'NEXTAUTH_URL') && vercelInfo.url) {
        instructions += `
# ${varName} - Auto-generated by Vercel
# Will be set to: https://${vercelInfo.url}
# Only set manually if using custom domain
`;
        return;
      }
    }
    
    instructions += `
${varName}="${varInfo?.defaultValue || 'your-value-here'}"
# Description: ${varInfo?.description}
# Setup: ${varInfo?.setupInstructions}
`;
  });
  
  if (config.optional.length > 0) {
    instructions += `
### Optional Variables:
`;
    config.optional.forEach(varName => {
      const varInfo = ENV_VARIABLE_DESCRIPTIONS[varName];
      instructions += `
# ${varName}="your-value-here"
# Description: ${varInfo?.description}
# Setup: ${varInfo?.setupInstructions}
`;
    });
  }
  
  instructions += `
### Feature Flags:
`;
  Object.entries(config.features).forEach(([key, value]) => {
    instructions += `${key}="${value}"\n`;
  });
  
  instructions += `
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
`;

  const outputPath = path.join(__dirname, '..', `vercel-setup-${phase}.md`);
  fs.writeFileSync(outputPath, instructions);
  console.log(`✅ Vercel setup instructions created: ${outputPath}`);
  
  return outputPath;
}

function prepareForDeployment(phase = 'simple') {
  console.log(`🚀 Preparing for ${phase} deployment...`);
  
  // Detect Vercel environment
  const vercelInfo = detectVercelEnvironment(process.env);
  
  // Generate environment file
  const envFile = generateEnvironmentFile(phase);
  
  // Generate Vercel-specific setup instructions
  if (vercelInfo.isVercel || process.argv.includes('--vercel')) {
    generateVercelSetupInstructions(phase, vercelInfo);
  }
  
  // Validate environment
  const envVars = {};
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]+)="?([^"]*)"?$/);
      if (match) {
        envVars[match[1]] = match[2];
      }
    });
  }
  
  const validationResult = validateEnvironment(phase, { ...process.env, ...envVars });
  
  if (!validationResult.isValid) {
    console.error('❌ Environment validation failed. Please fix the issues above.');
    process.exit(1);
  }
  
  // Check feature flags
  checkFeatureFlags({ ...process.env, ...envVars });
  
  console.log('');
  console.log('🎉 Deployment preparation complete!');
  console.log('');
  
  if (vercelInfo.isVercel) {
    console.log('Vercel deployment detected:');
    console.log(`1. Environment: ${vercelInfo.environment}`);
    console.log(`2. URL: ${vercelInfo.url || 'Will be generated'}`);
    console.log(`3. Region: ${vercelInfo.region || 'Auto-selected'}`);
    if (vercelInfo.hasCustomDomain) {
      console.log(`4. Custom domain: ${vercelInfo.customDomain}`);
    }
  } else {
    console.log('Next steps for Vercel deployment:');
    console.log(`1. Review the generated environment file: ${envFile}`);
    console.log('2. Update the placeholder values with your actual configuration');
    console.log('3. Set the environment variables in your Vercel dashboard');
    console.log('4. Deploy using: vercel --prod');
  }
  
  return envFile;
}

async function main() {
  const command = process.argv[2];
  const phase = process.argv[3] || null; // Let auto-detection work
  
  try {
    switch (command) {
      case 'validate':
        const result = validateEnvironment(phase);
        if (!result.isValid) {
          process.exit(1);
        }
        break;
        
      case 'generate':
        generateEnvironmentFile(phase);
        break;
        
      case 'check-flags':
        checkFeatureFlags();
        break;
        
      case 'secrets':
        generateSecrets();
        break;
        
      case 'prepare':
        prepareForDeployment(phase);
        break;
        
      case 'vercel-setup':
        const vercelInfo = detectVercelEnvironment();
        generateVercelSetupInstructions(phase || 'simple', vercelInfo);
        break;
        
      default:
        console.log('NGSRN Environment Configuration Tool');
        console.log('');
        console.log('Usage: node env-config.js [command] [phase]');
        console.log('');
        console.log('Commands:');
        console.log('  validate [simple|full]     - Validate environment variables');
        console.log('  generate [simple|full]     - Generate environment file');
        console.log('  check-flags               - Check feature flag configuration');
        console.log('  secrets                   - Generate secure secrets');
        console.log('  prepare [simple|full]     - Prepare for deployment');
        console.log('  vercel-setup [simple|full] - Generate Vercel setup instructions');
        console.log('');
        console.log('Phases:');
        console.log('  simple - Static deployment without database (default)');
        console.log('  full   - Full deployment with all features');
        console.log('');
        console.log('Vercel Integration:');
        console.log('  - Auto-detects Vercel environment (VERCEL_URL, VERCEL_ENV)');
        console.log('  - Handles URL auto-generation from VERCEL_URL');
        console.log('  - Validates environment variable precedence');
        console.log('  - Provides Vercel-specific setup instructions');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  validateEnvironment,
  detectVercelEnvironment,
  detectDeploymentPhase,
  generateEnvironmentFile,
  checkFeatureFlags,
  generateSecrets,
  prepareForDeployment,
  checkEnvironmentPrecedence,
  validateVercelCompatibility,
  validateVercelSpecificConfiguration,
  generateVercelSetupInstructions,
  ENV_CONFIGS,
  ENV_VARIABLE_DESCRIPTIONS,
  VERCEL_AUTO_PROVIDED
};