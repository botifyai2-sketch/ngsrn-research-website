#!/usr/bin/env node

/**
 * Environment Setup Script
 * Validates and sets up environment variables for different environments
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = {
  development: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'GEMINI_API_KEY'
  ],
  production: [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'GEMINI_API_KEY',
    'REDIS_URL',
    'ELASTICSEARCH_URL',
    'SENTRY_DSN'
  ]
};

function validateEnvironment(env = 'development') {
  console.log(`🔍 Validating ${env} environment...`);
  
  const requiredVars = REQUIRED_VARS[env] || REQUIRED_VARS.development;
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    
    console.log('\n📝 Please set these variables in your environment or .env file');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
}

function generateSecrets() {
  const crypto = require('crypto');
  
  const secrets = {
    NEXTAUTH_SECRET: crypto.randomBytes(32).toString('hex'),
    JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex')
  };
  
  console.log('🔐 Generated secrets (save these securely):');
  Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });
  
  return secrets;
}

function setupDevelopmentEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const examplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    console.log('📋 Copying .env.example to .env...');
    fs.copyFileSync(examplePath, envPath);
    
    // Generate and append secrets
    const secrets = generateSecrets();
    const secretsContent = Object.entries(secrets)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');
    
    fs.appendFileSync(envPath, `\n# Generated secrets\n${secretsContent}\n`);
    
    console.log('✅ Development environment file created');
    console.log('📝 Please update the values in .env with your actual configuration');
  }
}

function checkDatabaseConnection() {
  const { PrismaClient } = require('@prisma/client');
  
  return new Promise(async (resolve, reject) => {
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
      resolve(true);
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      reject(error);
    } finally {
      await prisma.$disconnect();
    }
  });
}

async function main() {
  const command = process.argv[2];
  const environment = process.env.NODE_ENV || 'development';
  
  switch (command) {
    case 'validate':
      validateEnvironment(environment);
      break;
      
    case 'setup':
      setupDevelopmentEnv();
      break;
      
    case 'secrets':
      generateSecrets();
      break;
      
    case 'test-db':
      try {
        await checkDatabaseConnection();
      } catch (error) {
        process.exit(1);
      }
      break;
      
    default:
      console.log('Usage: node setup-env.js [validate|setup|secrets|test-db]');
      console.log('');
      console.log('Commands:');
      console.log('  validate  - Validate required environment variables');
      console.log('  setup     - Set up development environment');
      console.log('  secrets   - Generate secure secrets');
      console.log('  test-db   - Test database connection');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  validateEnvironment,
  generateSecrets,
  setupDevelopmentEnv,
  checkDatabaseConnection
};