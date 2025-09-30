#!/usr/bin/env node

/**
 * Comprehensive Deployment Validation Script
 * Validates all aspects of the deployment before going live
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import existing validation utilities
const { validateBuildEnvironment, checkCommonIssues } = require('./validate-build');
const { validateEnvironment, checkFeatureFlags } = require('./env-config');

async function runDeploymentValidation(phase = 'simple') {
  console.log('🚀 NGSRN Comprehensive Deployment Validation');
  console.log('===========================================');
  console.log(`Phase: ${phase.toUpperCase()}`);
  console.log('');

  const validationResults = {
    environment: false,
    build: false,
    assets: false,
    configuration: false,
    connectivity: false,
    performance: false,
    security: false
  };

  try {
    // 1. Environment Validation
    console.log('1️⃣  Environment Validation');
    console.log('─'.repeat(30));
    validationResults.environment = await validateEnvironmentConfiguration(phase);
    console.log('');

    // 2. Build Validation
    console.log('2️⃣  Build Validation');
    console.log('─'.repeat(30));
    validationResults.build = await validateBuildConfiguration();
    console.log('');

    // 3. Asset Validation
    console.log('3️⃣  Asset Validation');
    console.log('─'.repeat(30));
    validationResults.assets = await validateRequiredAssets();
    console.log('');

    // 4. Configuration Validation
    console.log('4️⃣  Configuration Validation');
    console.log('─'.repeat(30));
    validationResults.configuration = await validateDeploymentConfiguration(phase);
    console.log('');

    // 5. Connectivity Validation
    console.log('5️⃣  Connectivity Validation');
    console.log('─'.repeat(30));
    validationResults.connectivity = await validateConnectivity(phase);
    console.log('');

    // 6. Performance Validation
    console.log('6️⃣  Performance Validation');
    console.log('─'.repeat(30));
    validationResults.performance = await validatePerformanceConfiguration();
    console.log('');

    // 7. Security Validation
    console.log('7️⃣  Security Validation');
    console.log('─'.repeat(30));
    validationResults.security = await validateSecurityConfiguration();
    console.log('');

    // Summary
    console.log('📊 Validation Summary');
    console.log('─'.repeat(30));
    printValidationSummary(validationResults);

    const allPassed = Object.values(validationResults).every(Boolean);
    
    if (allPassed) {
      console.log('');
      console.log('🎉 All validation checks passed!');
      console.log('✅ Ready for deployment to Vercel');
      console.log('');
      console.log('Next steps:');
      console.log('1. Run: vercel --prod');
      console.log('2. Monitor deployment at: https://vercel.com/dashboard');
      console.log('3. Test the deployed application');
      return true;
    } else {
      console.log('');
      console.error('❌ Some validation checks failed');
      console.error('Please fix the issues above before deploying');
      return false;
    }

  } catch (error) {
    console.error('❌ Validation failed with error:', error.message);
    return false;
  }
}

async function validateEnvironmentConfiguration(phase) {
  try {
    const isValid = validateEnvironment(phase, process.env);
    if (isValid) {
      console.log('✅ Environment variables validated');
      
      // Check feature flags
      const flags = checkFeatureFlags(process.env);
      console.log('✅ Feature flags validated');
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    return false;
  }
}

async function validateBuildConfiguration() {
  try {
    // Check if build directory exists
    const buildDir = path.join(__dirname, '..', '.next');
    if (!fs.existsSync(buildDir)) {
      console.error('❌ Build directory not found. Run "npm run build" first.');
      return false;
    }

    // Validate build environment
    validateBuildEnvironment();
    console.log('✅ Build configuration validated');
    
    return true;
  } catch (error) {
    console.error('❌ Build validation failed:', error.message);
    return false;
  }
}

async function validateRequiredAssets() {
  const requiredAssets = [
    { name: 'favicon.ico', path: 'public/favicon.ico', critical: true },
    { name: 'manifest.json', path: 'public/manifest.json', critical: false },
    { name: 'robots.txt', path: 'public/robots.txt', critical: false }
  ];

  let criticalMissing = 0;
  let totalMissing = 0;

  requiredAssets.forEach(asset => {
    const fullPath = path.join(__dirname, '..', asset.path);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${asset.name}`);
    } else {
      if (asset.critical) {
        console.error(`  ❌ ${asset.name} (critical)`);
        criticalMissing++;
      } else {
        console.warn(`  ⚠️  ${asset.name} (optional)`);
      }
      totalMissing++;
    }
  });

  if (criticalMissing > 0) {
    console.error(`❌ ${criticalMissing} critical assets missing`);
    return false;
  }

  if (totalMissing > 0) {
    console.warn(`⚠️  ${totalMissing} optional assets missing`);
  }

  console.log('✅ Asset validation completed');
  return true;
}

async function validateDeploymentConfiguration(phase) {
  try {
    // Check Vercel configuration
    const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
    if (!fs.existsSync(vercelConfigPath)) {
      console.error('❌ vercel.json not found');
      return false;
    }

    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    console.log('✅ vercel.json found and valid');

    // Check Next.js configuration
    const nextConfigPath = path.join(__dirname, '..', 'next.config.ts');
    if (!fs.existsSync(nextConfigPath)) {
      console.warn('⚠️  next.config.ts not found');
    } else {
      console.log('✅ next.config.ts found');
    }

    // Check package.json scripts
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredScripts = ['build', 'start'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      console.error('❌ Missing required scripts:', missingScripts);
      return false;
    }

    console.log('✅ Package.json scripts validated');
    return true;
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    return false;
  }
}

async function validateConnectivity(phase) {
  let allConnected = true;

  // Database connectivity (if enabled)
  if (process.env.DATABASE_URL && phase === 'full') {
    try {
      console.log('🔍 Testing database connectivity...');
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      allConnected = false;
    }
  } else {
    console.log('ℹ️  Database connectivity check skipped (disabled or simple deployment)');
  }

  // External services
  if (process.env.NEXT_PUBLIC_GA_ID) {
    console.log('✅ Google Analytics configured');
  } else {
    console.log('ℹ️  Google Analytics not configured');
  }

  if (process.env.GEMINI_API_KEY) {
    console.log('✅ AI service configured');
  } else {
    console.log('ℹ️  AI service not configured');
  }

  return allConnected;
}

async function validatePerformanceConfiguration() {
  try {
    // Check Next.js config for performance optimizations
    const nextConfigPath = path.join(__dirname, '..', 'next.config.ts');
    let optimizations = 0;
    let totalChecks = 4;

    if (fs.existsSync(nextConfigPath)) {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
      
      if (nextConfig.includes('compress: true')) {
        console.log('✅ Compression enabled');
        optimizations++;
      } else {
        console.warn('⚠️  Compression not explicitly enabled');
      }
      
      if (nextConfig.includes('images:')) {
        console.log('✅ Image optimization configured');
        optimizations++;
      } else {
        console.warn('⚠️  Image optimization not configured');
      }
      
      if (nextConfig.includes('experimental')) {
        console.log('✅ Experimental features configured');
        optimizations++;
      } else {
        console.log('ℹ️  No experimental features configured');
      }
    } else {
      console.warn('⚠️  next.config.ts not found');
    }

    // Check for bundle analyzer
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.scripts?.['build:analyze']) {
      console.log('✅ Bundle analyzer configured');
      optimizations++;
    } else {
      console.log('ℹ️  Bundle analyzer not configured');
    }

    const percentage = Math.round((optimizations / totalChecks) * 100);
    console.log(`📊 Performance optimizations: ${optimizations}/${totalChecks} (${percentage}%)`);

    return percentage >= 50; // At least 50% of optimizations should be configured
  } catch (error) {
    console.error('❌ Performance validation failed:', error.message);
    return false;
  }
}

async function validateSecurityConfiguration() {
  try {
    const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
    
    if (!fs.existsSync(vercelConfigPath)) {
      console.error('❌ vercel.json not found for security header validation');
      return false;
    }

    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy'
    ];

    let configuredHeaders = 0;

    if (vercelConfig.headers) {
      const headerNames = vercelConfig.headers.flatMap(h => 
        h.headers?.map(header => header.key) || []
      );
      
      requiredHeaders.forEach(header => {
        if (headerNames.includes(header)) {
          console.log(`✅ ${header} configured`);
          configuredHeaders++;
        } else {
          console.warn(`⚠️  ${header} not configured`);
        }
      });
    } else {
      console.warn('⚠️  No security headers configured in vercel.json');
    }

    const percentage = Math.round((configuredHeaders / requiredHeaders.length) * 100);
    console.log(`📊 Security headers: ${configuredHeaders}/${requiredHeaders.length} (${percentage}%)`);

    return percentage >= 66; // At least 2/3 of security headers should be configured
  } catch (error) {
    console.error('❌ Security validation failed:', error.message);
    return false;
  }
}

function printValidationSummary(results) {
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    const checkName = check.charAt(0).toUpperCase() + check.slice(1);
    console.log(`${status} ${checkName}`);
  });

  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  const percentage = Math.round((passedCount / totalCount) * 100);
  
  console.log('');
  console.log(`📊 Overall: ${passedCount}/${totalCount} checks passed (${percentage}%)`);
}

async function main() {
  const phase = process.argv[2] || 'simple';
  
  if (!['simple', 'full'].includes(phase)) {
    console.error('❌ Invalid phase. Use "simple" or "full"');
    process.exit(1);
  }

  const success = await runDeploymentValidation(phase);
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runDeploymentValidation,
  validateEnvironmentConfiguration,
  validateBuildConfiguration,
  validateRequiredAssets,
  validateDeploymentConfiguration,
  validateConnectivity,
  validatePerformanceConfiguration,
  validateSecurityConfiguration
};