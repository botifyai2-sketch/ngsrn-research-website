#!/usr/bin/env node

/**
 * Build Validation Script
 * Validates environment configuration before build
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
function loadEnvFiles() {
  const envFiles = ['.env.local', '.env.production', '.env'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, '..', envFile);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#][^=]+)="?([^"]*)"?$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2];
        }
      });
    }
  }
}

// Load environment files before importing config
loadEnvFiles();

// Import the environment validation
const { validateEnvironment, ENV_CONFIGS } = require('./env-config');

function validateBuildEnvironment() {
  console.log('🔍 Validating build environment...');
  
  try {
    // Determine deployment phase
    const features = {
      cms: process.env.NEXT_PUBLIC_ENABLE_CMS === 'true',
      auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
      search: process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
      ai: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
      media: process.env.NEXT_PUBLIC_ENABLE_MEDIA === 'true'
    };
    
    const hasAnyFeature = Object.values(features).some(Boolean);
    const phase = hasAnyFeature ? 'full' : 'simple';
    
    console.log(`📋 Detected deployment phase: ${phase}`);
    console.log(`📝 ${ENV_CONFIGS[phase].description}`);
    
    // Validate environment variables
    const isValid = validateEnvironment(phase, process.env);
    
    if (!isValid) {
      console.error('❌ Build validation failed');
      process.exit(1);
    }
    
    // Check for common issues
    checkCommonIssues(phase, features);
    
    console.log('✅ Build validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Build validation error:', error.message);
    process.exit(1);
  }
}

function checkCommonIssues(phase, features) {
  console.log('🔧 Checking for common configuration issues...');
  
  // Check base URL format
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl) {
    if (baseUrl.includes('your-app.vercel.app')) {
      console.warn('⚠️  Base URL contains placeholder. Update NEXT_PUBLIC_BASE_URL with your actual Vercel URL.');
    }
    
    if (!baseUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  Base URL should use HTTPS in production.');
    }
  }
  
  // Check site name
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME;
  if (!siteName || siteName.includes('NextGen Sustainable Research Network')) {
    console.log('ℹ️  Using default site name. You can customize it with NEXT_PUBLIC_SITE_NAME.');
  }
  
  // Phase-specific checks
  if (phase === 'simple') {
    console.log('📦 Simple deployment configuration:');
    console.log('  - Database features: disabled');
    console.log('  - Authentication: disabled');
    console.log('  - Search: disabled');
    console.log('  - AI features: disabled');
    console.log('  - Media upload: disabled');
    
    // Check if any database-related env vars are set (might indicate misconfiguration)
    const dbVars = ['DATABASE_URL', 'DIRECT_URL', 'NEXTAUTH_SECRET'];
    const setDbVars = dbVars.filter(varName => process.env[varName]);
    if (setDbVars.length > 0) {
      console.warn('⚠️  Database-related environment variables are set but features are disabled:');
      setDbVars.forEach(varName => console.warn(`     - ${varName}`));
      console.warn('     This is normal for simple deployment, but verify this is intentional.');
    }
  } else {
    console.log('🚀 Full deployment configuration:');
    Object.entries(features).forEach(([feature, enabled]) => {
      const status = enabled ? '✅ enabled' : '❌ disabled';
      console.log(`  - ${feature.toUpperCase()}: ${status}`);
    });
  }
  
  // Check analytics configuration
  if (process.env.NEXT_PUBLIC_GA_ID) {
    if (process.env.NEXT_PUBLIC_GA_ID.includes('G-XXXXXXXXXX')) {
      console.warn('⚠️  Google Analytics ID contains placeholder. Update with your actual GA4 measurement ID.');
    } else {
      console.log('✅ Google Analytics configured');
    }
  } else {
    console.log('ℹ️  Google Analytics not configured (optional)');
  }
  
  // Check for required assets
  checkRequiredAssets();
  
  // Check build output
  checkBuildOutput();
}

function checkRequiredAssets() {
  console.log('📁 Checking required assets...');
  
  const requiredAssets = [
    { name: 'favicon.ico', path: path.join(__dirname, '..', 'public', 'favicon.ico') },
    { name: 'manifest.json', path: path.join(__dirname, '..', 'public', 'manifest.json') }
  ];
  
  const optionalAssets = [
    { name: 'robots.txt', path: path.join(__dirname, '..', 'public', 'robots.txt') },
    { name: 'sitemap.xml', path: path.join(__dirname, '..', 'public', 'sitemap.xml') }
  ];
  
  requiredAssets.forEach(asset => {
    if (fs.existsSync(asset.path)) {
      console.log(`  ✅ ${asset.name} found`);
    } else {
      console.error(`  ❌ ${asset.name} missing (required)`);
    }
  });
  
  optionalAssets.forEach(asset => {
    if (fs.existsSync(asset.path)) {
      console.log(`  ✅ ${asset.name} found`);
    } else {
      console.log(`  ℹ️  ${asset.name} not found (optional)`);
    }
  });
}

function checkBuildOutput() {
  console.log('🏗️  Checking build output...');
  
  const buildDir = path.join(__dirname, '..', '.next');
  const staticDir = path.join(buildDir, 'static');
  
  if (fs.existsSync(buildDir)) {
    console.log('  ✅ .next directory found');
    
    if (fs.existsSync(staticDir)) {
      console.log('  ✅ Static assets directory found');
      
      // Check for critical build files
      const buildManifest = path.join(buildDir, 'build-manifest.json');
      if (fs.existsSync(buildManifest)) {
        console.log('  ✅ Build manifest found');
      } else {
        console.warn('  ⚠️  Build manifest not found');
      }
    } else {
      console.warn('  ⚠️  Static assets directory not found');
    }
  } else {
    console.error('  ❌ .next directory not found. Run "npm run build" first.');
  }
}

function checkNextConfig() {
  console.log('⚙️  Checking Next.js configuration...');
  
  const nextConfigPath = path.join(__dirname, '..', 'next.config.ts');
  if (!fs.existsSync(nextConfigPath)) {
    console.warn('⚠️  next.config.ts not found');
    return;
  }
  
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check for common configuration issues
  if (!nextConfig.includes('images:')) {
    console.warn('⚠️  Image optimization configuration not found in next.config.ts');
  }
  
  if (!nextConfig.includes('compress: true')) {
    console.warn('⚠️  Compression not enabled in next.config.ts');
  }
  
  console.log('✅ Next.js configuration check complete');
}

function checkPackageJson() {
  console.log('📦 Checking package.json configuration...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check for required scripts
  const requiredScripts = ['build', 'start'];
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length > 0) {
    console.error('❌ Missing required scripts in package.json:', missingScripts);
    return false;
  }
  
  // Check for build optimization scripts
  if (!packageJson.scripts['build:analyze']) {
    console.log('ℹ️  Bundle analyzer script not found (optional)');
  }
  
  console.log('✅ Package.json configuration check complete');
  return true;
}

function main() {
  console.log('🚀 NGSRN Build Validation');
  console.log('========================');
  
  try {
    // Run all validation checks
    validateBuildEnvironment();
    checkNextConfig();
    checkPackageJson();
    
    console.log('');
    console.log('🎉 All validation checks passed!');
    console.log('Ready for deployment to Vercel.');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateBuildEnvironment,
  checkCommonIssues,
  checkNextConfig,
  checkPackageJson
};