#!/usr/bin/env node

/**
 * Environment Configuration Script for Vercel Deployment
 * Handles simple and full deployment configurations
 */

const fs = require('fs');
const path = require('path');

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

function validateEnvironment(phase = 'simple', env = process.env) {
  console.log(`🔍 Validating ${phase} deployment environment...`);
  
  const config = ENV_CONFIGS[phase];
  if (!config) {
    throw new Error(`Unknown deployment phase: ${phase}`);
  }
  
  const missing = [];
  const warnings = [];
  
  // Check required variables
  config.required.forEach(varName => {
    if (!env[varName]) {
      missing.push(varName);
    }
  });
  
  // Check optional variables
  config.optional.forEach(varName => {
    if (!env[varName]) {
      warnings.push(varName);
    }
  });
  
  // Validate feature flags
  Object.entries(config.features).forEach(([key, expectedValue]) => {
    const actualValue = env[key];
    if (actualValue && actualValue !== expectedValue) {
      console.warn(`⚠️  Feature flag ${key} is set to "${actualValue}" but expected "${expectedValue}" for ${phase} deployment`);
    }
  });
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables for ${phase} deployment:`);
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    return false;
  }
  
  if (warnings.length > 0) {
    console.warn(`⚠️  Optional environment variables not set:`);
    warnings.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
  }
  
  console.log(`✅ Environment validation passed for ${phase} deployment`);
  return true;
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

function prepareForDeployment(phase = 'simple') {
  console.log(`🚀 Preparing for ${phase} deployment...`);
  
  // Generate environment file
  const envFile = generateEnvironmentFile(phase);
  
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
  
  const isValid = validateEnvironment(phase, { ...process.env, ...envVars });
  
  if (!isValid) {
    console.error('❌ Environment validation failed. Please fix the issues above.');
    process.exit(1);
  }
  
  // Check feature flags
  checkFeatureFlags({ ...process.env, ...envVars });
  
  console.log('');
  console.log('🎉 Deployment preparation complete!');
  console.log('');
  console.log('Next steps:');
  console.log(`1. Review the generated environment file: ${envFile}`);
  console.log('2. Update the placeholder values with your actual configuration');
  console.log('3. Set the environment variables in your Vercel dashboard');
  console.log('4. Deploy using: vercel --prod');
  
  return envFile;
}

async function main() {
  const command = process.argv[2];
  const phase = process.argv[3] || 'simple';
  
  try {
    switch (command) {
      case 'validate':
        validateEnvironment(phase);
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
        
      default:
        console.log('NGSRN Environment Configuration Tool');
        console.log('');
        console.log('Usage: node env-config.js [command] [phase]');
        console.log('');
        console.log('Commands:');
        console.log('  validate [simple|full]  - Validate environment variables');
        console.log('  generate [simple|full]  - Generate environment file');
        console.log('  check-flags            - Check feature flag configuration');
        console.log('  secrets                - Generate secure secrets');
        console.log('  prepare [simple|full]  - Prepare for deployment');
        console.log('');
        console.log('Phases:');
        console.log('  simple - Static deployment without database (default)');
        console.log('  full   - Full deployment with all features');
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
  generateEnvironmentFile,
  checkFeatureFlags,
  generateSecrets,
  prepareForDeployment,
  ENV_CONFIGS
};