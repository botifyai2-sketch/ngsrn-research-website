#!/usr/bin/env node

/**
 * Enhanced Build Validation Script
 * Validates environment configuration before build with automated fix capabilities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import automated fix capabilities
let DeploymentAutoFix;
try {
  DeploymentAutoFix = require('./deployment-auto-fix');
} catch (error) {
  // Auto-fix not available, continue with validation only
  console.log('ℹ️  Automated fix capabilities not available');
}

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

async function validateBuildEnvironment() {
  console.log('🔍 Validating build environment...');
  
  try {
    // Check for automated fix option
    const shouldAutoFix = process.argv.includes('--auto-fix') || process.env.AUTO_FIX_DEPLOYMENT === 'true';
    
    if (shouldAutoFix && DeploymentAutoFix) {
      console.log('🔧 Running automated fixes before validation...');
      const autoFix = new DeploymentAutoFix();
      const fixResult = await autoFix.run();
      
      if (!fixResult) {
        console.error('❌ Automated fixes failed');
        console.error('💡 Please review the errors above and fix manually');
        process.exit(1);
      }
      
      console.log('✅ Automated fixes completed, continuing with validation...\n');
    }
    
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
      console.error('❌ Environment validation failed');
      
      if (DeploymentAutoFix && !shouldAutoFix) {
        console.error('💡 Try running with --auto-fix flag to automatically resolve common issues:');
        console.error('   node scripts/validate-build.js --auto-fix');
      } else {
        console.error('💡 Fix environment configuration before proceeding with build');
      }
      
      process.exit(1);
    }
    
    console.log('✅ Environment validation passed');
    
    // Run enhanced TypeScript validation for production build
    await runTypeScriptValidation();
    
    // Validate build configuration
    await validateBuildConfiguration();
    
    // Check for common issues
    checkCommonIssues(phase, features);
    
    console.log('✅ Build validation passed');
    buildSuccess = true;
    
    // Record successful build
    if (monitor) {
      const duration = Date.now() - startTime;
      monitor.recordBuildAttempt(true, duration, [], phase);
      console.log(`📊 Build metrics recorded (${Math.round(duration / 1000)}s)`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Build validation error:', error.message);
    buildSuccess = false;
    buildErrors.push({
      type: 'validation_error',
      message: error.message,
      stack: error.stack
    });
    
    // Enhanced error context and suggestions
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    console.error('\n💡 Troubleshooting steps:');
    console.error('   1. Run with --auto-fix flag to attempt automatic resolution');
    console.error('   2. Check that all required files exist');
    console.error('   3. Verify environment variables are properly set');
    console.error('   4. Ensure TypeScript configuration is correct');
    console.error('   5. Run individual validation steps to isolate the issue');
    
    if (DeploymentAutoFix) {
      console.error('\n🔧 Automated fix available:');
      console.error('   node scripts/deployment-auto-fix.js');
    }
    
    // Record failed build
    if (monitor) {
      const duration = Date.now() - startTime;
      monitor.recordBuildAttempt(false, duration, buildErrors, phase);
      console.log(`📊 Build failure metrics recorded (${Math.round(duration / 1000)}s)`);
    }
    
    process.exit(1);
  }
}

async function validateBuildConfiguration() {
  console.log('⚙️  Validating build configuration...');
  
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };
  
  // Check package.json build scripts
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Validate required build scripts
    const requiredScripts = {
      'build': 'Main build script',
      'build:validate': 'Build validation script',
      'type-check:build': 'Production TypeScript checking'
    };
    
    for (const [script, description] of Object.entries(requiredScripts)) {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        validation.errors.push(`Missing required script: ${script} (${description})`);
        validation.suggestions.push(`Add "${script}" script to package.json`);
      }
    }
    
    // Check if build script uses production TypeScript checking
    if (packageJson.scripts?.['build:validate']) {
      if (!packageJson.scripts['build:validate'].includes('type-check:build')) {
        validation.warnings.push('build:validate script may not use production TypeScript configuration');
        validation.suggestions.push('Ensure build:validate script runs type-check:build');
      }
    }
  } else {
    validation.errors.push('package.json not found');
  }
  
  // Check Next.js configuration
  const nextConfigPath = path.join(__dirname, '..', 'next.config.ts');
  if (!fs.existsSync(nextConfigPath)) {
    validation.warnings.push('next.config.ts not found');
    validation.suggestions.push('Create next.config.ts for production optimizations');
  }
  
  // Check for build output directory structure
  const buildDir = path.join(__dirname, '..', '.next');
  if (fs.existsSync(buildDir)) {
    console.log('  ✅ Previous build output found');
  } else {
    console.log('  ℹ️  No previous build output (first build)');
  }
  
  // Report validation results
  if (validation.errors.length > 0) {
    console.error('  ❌ Build configuration errors:');
    validation.errors.forEach(error => console.error(`    - ${error}`));
    
    if (validation.suggestions.length > 0) {
      console.log('\n  💡 Suggestions:');
      validation.suggestions.forEach(suggestion => console.log(`    - ${suggestion}`));
    }
    
    throw new Error('Build configuration validation failed');
  }
  
  if (validation.warnings.length > 0) {
    console.warn('  ⚠️  Build configuration warnings:');
    validation.warnings.forEach(warning => console.warn(`    - ${warning}`));
    
    if (validation.suggestions.length > 0) {
      console.log('\n  💡 Suggestions:');
      validation.suggestions.forEach(suggestion => console.log(`    - ${suggestion}`));
    }
  }
  
  console.log('  ✅ Build configuration validation passed');
}

async function runTypeScriptValidation() {
  console.log('🔍 Running TypeScript validation for production build...');
  
  try {
    // Validate TypeScript configuration correctness
    const configValidation = validateTypeScriptConfiguration();
    if (!configValidation.isValid) {
      console.error('❌ TypeScript configuration validation failed:');
      configValidation.errors.forEach(error => console.error(`  - ${error}`));
      
      if (configValidation.suggestions.length > 0) {
        console.log('\n💡 Suggestions to fix configuration issues:');
        configValidation.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
        
        if (DeploymentAutoFix) {
          console.log('\n🔧 Automated fix available:');
          console.log('   node scripts/deployment-auto-fix.js');
          console.log('   or run this script with --auto-fix flag');
        }
      }
      
      process.exit(1);
    }
    
    console.log('  ✅ TypeScript configuration validation passed');
    
    // Run TypeScript type checking with production configuration
    console.log('  📝 Type checking production code (excluding test files)...');
    
    const typeCheckResult = runProductionTypeCheck();
    if (!typeCheckResult.success) {
      console.error('❌ TypeScript type checking failed:');
      
      // Enhanced error reporting
      if (typeCheckResult.errors && typeCheckResult.errors.length > 0) {
        console.error('\n📋 Type checking errors:');
        typeCheckResult.errors.forEach((error, index) => {
          console.error(`\n${index + 1}. ${error.file}:${error.line}:${error.column}`);
          console.error(`   Error: ${error.message}`);
          if (error.code) {
            console.error(`   Code: TS${error.code}`);
          }
        });
      }
      
      console.error('\n💡 Troubleshooting steps:');
      console.error('   1. Run "npm run type-check:build" for detailed error information');
      console.error('   2. Check that all imports are correctly typed');
      console.error('   3. Ensure no test-specific types are used in production code');
      console.error('   4. Verify all dependencies have proper type definitions');
      
      process.exit(1);
    }
    
    console.log('  ✅ TypeScript type checking passed');
    
    // Verify test file exclusion effectiveness
    verifyTestFileExclusion();
    
  } catch (error) {
    console.error('❌ TypeScript validation failed:');
    console.error(error.message);
    
    // Enhanced error context
    if (error.code === 'ENOENT') {
      console.error('\n💡 This error suggests a missing file or command.');
      console.error('   Make sure TypeScript is installed: npm install typescript');
    } else if (error.status === 2) {
      console.error('\n💡 TypeScript compilation failed with errors.');
      console.error('   Run "npm run type-check:build" to see detailed error information.');
    }
    
    process.exit(1);
  }
}

function validateTypeScriptConfiguration() {
  const tsConfigBuildPath = path.join(__dirname, '..', 'tsconfig.build.json');
  const tsConfigBasePath = path.join(__dirname, '..', 'tsconfig.json');
  
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };
  
  // Check if production TypeScript configuration exists
  if (!fs.existsSync(tsConfigBuildPath)) {
    validation.isValid = false;
    validation.errors.push('tsconfig.build.json not found');
    validation.suggestions.push('Create tsconfig.build.json that extends tsconfig.json and excludes test files');
    return validation;
  }
  
  // Check if base configuration exists
  if (!fs.existsSync(tsConfigBasePath)) {
    validation.isValid = false;
    validation.errors.push('tsconfig.json not found');
    validation.suggestions.push('Create base tsconfig.json with proper Next.js configuration');
    return validation;
  }
  
  try {
    // Parse and validate production configuration
    const tsConfigBuild = JSON.parse(fs.readFileSync(tsConfigBuildPath, 'utf8'));
    const tsConfigBase = JSON.parse(fs.readFileSync(tsConfigBasePath, 'utf8'));
    
    // Validate extends property
    if (!tsConfigBuild.extends) {
      validation.warnings.push('tsconfig.build.json does not extend base configuration');
      validation.suggestions.push('Add "extends": "./tsconfig.json" to tsconfig.build.json');
    }
    
    // Validate exclude patterns for test files
    const excludePatterns = tsConfigBuild.exclude || [];
    const requiredTestPatterns = [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/__tests__/**',
      '**/e2e/**'
    ];
    
    const missingPatterns = requiredTestPatterns.filter(pattern => 
      !excludePatterns.some(exclude => 
        exclude === pattern || 
        exclude.includes(pattern.replace('**/', '')) ||
        exclude.includes('*test*')
      )
    );
    
    if (missingPatterns.length > 0) {
      validation.warnings.push(`Missing test exclusion patterns: ${missingPatterns.join(', ')}`);
      validation.suggestions.push('Add missing test file patterns to exclude array in tsconfig.build.json');
    }
    
    // Validate compiler options
    if (tsConfigBuild.compilerOptions) {
      if (tsConfigBuild.compilerOptions.noEmit !== true) {
        validation.warnings.push('noEmit should be true for build validation');
        validation.suggestions.push('Set "noEmit": true in tsconfig.build.json compilerOptions');
      }
    }
    
    // Check for common problematic patterns in exclude
    const problematicPatterns = excludePatterns.filter(pattern => 
      pattern.includes('src/') && !pattern.includes('test') && !pattern.includes('__tests__')
    );
    
    if (problematicPatterns.length > 0) {
      validation.warnings.push(`Potentially problematic exclude patterns: ${problematicPatterns.join(', ')}`);
      validation.suggestions.push('Review exclude patterns to ensure production code is not excluded');
    }
    
    // Validate base configuration has required settings for Next.js
    if (!tsConfigBase.compilerOptions?.jsx) {
      validation.warnings.push('JSX configuration missing in base tsconfig.json');
      validation.suggestions.push('Add "jsx": "preserve" to base tsconfig.json compilerOptions');
    }
    
    if (!tsConfigBase.compilerOptions?.moduleResolution) {
      validation.warnings.push('Module resolution not specified in base tsconfig.json');
      validation.suggestions.push('Add "moduleResolution": "bundler" to base tsconfig.json compilerOptions');
    }
    
  } catch (parseError) {
    validation.isValid = false;
    validation.errors.push(`Failed to parse TypeScript configuration: ${parseError.message}`);
    validation.suggestions.push('Check TypeScript configuration files for syntax errors');
  }
  
  return validation;
}

function runProductionTypeCheck() {
  try {
    const result = execSync('npx tsc --project tsconfig.build.json --noEmit --pretty false', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    return { success: true, output: result };
    
  } catch (error) {
    // Parse TypeScript error output for better reporting
    const errors = parseTypeScriptErrors(error.stdout || error.message);
    
    return {
      success: false,
      errors: errors,
      rawOutput: error.stdout || error.message
    };
  }
}

function parseTypeScriptErrors(output) {
  const errors = [];
  const lines = output.split('\n');
  
  for (const line of lines) {
    // Match TypeScript error format: file(line,column): error TSxxxx: message
    const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+TS(\d+):\s+(.+)$/);
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5]
      });
    }
  }
  
  // If no structured errors found, try to extract file paths and messages
  if (errors.length === 0) {
    const errorLines = lines.filter(line => 
      line.includes('error TS') || 
      line.includes('.ts(') || 
      line.includes('.tsx(')
    );
    
    for (const line of errorLines) {
      if (line.trim()) {
        errors.push({
          file: 'Unknown',
          line: 0,
          column: 0,
          code: '',
          message: line.trim()
        });
      }
    }
  }
  
  return errors;
}

function verifyTestFileExclusion() {
  console.log('  🧪 Verifying test file exclusion effectiveness...');
  
  const tsConfigBuildPath = path.join(__dirname, '..', 'tsconfig.build.json');
  const tsConfigBuild = JSON.parse(fs.readFileSync(tsConfigBuildPath, 'utf8'));
  const excludePatterns = tsConfigBuild.exclude || [];
  
  // Find test files in the project
  const testFiles = findTestFiles(path.join(__dirname, '..', 'src'));
  
  if (testFiles.length === 0) {
    console.log('  ℹ️  No test files found in src directory');
    return;
  }
  
  // Check if test files would be excluded
  const includedTestFiles = testFiles.filter(testFile => {
    const relativePath = path.relative(path.join(__dirname, '..'), testFile);
    // Normalize path separators for cross-platform compatibility
    const normalizedPath = relativePath.replace(/\\/g, '/');
    
    return !excludePatterns.some(pattern => {
      // Normalize pattern separators
      const normalizedPattern = pattern.replace(/\\/g, '/');
      
      // Convert glob pattern to regex for matching
      const regexPattern = normalizedPattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\./g, '\\.')
        .replace(/\//g, '[/\\\\]'); // Handle both forward and back slashes
      
      const regex = new RegExp(`^${regexPattern}$`);
      const matches = regex.test(normalizedPath);
      
      // Also check if the pattern matches common test file patterns
      const isTestFile = normalizedPath.includes('__tests__') || 
                        normalizedPath.includes('.test.') || 
                        normalizedPath.includes('.spec.') ||
                        normalizedPath.includes('integration.test');
      
      // If it's clearly a test file and we have test exclusion patterns, it should be excluded
      if (isTestFile && (
        normalizedPattern.includes('__tests__') || 
        normalizedPattern.includes('*.test.') || 
        normalizedPattern.includes('*.spec.') ||
        normalizedPattern.includes('integration.test')
      )) {
        return true;
      }
      
      return matches;
    });
  });
  
  if (includedTestFiles.length > 0) {
    console.warn('  ⚠️  Some test files may not be properly excluded:');
    includedTestFiles.slice(0, 5).forEach(file => {
      const relativePath = path.relative(path.join(__dirname, '..'), file);
      console.warn(`    - ${relativePath}`);
    });
    
    if (includedTestFiles.length > 5) {
      console.warn(`    ... and ${includedTestFiles.length - 5} more`);
    }
    
    console.warn('  💡 Consider updating exclude patterns in tsconfig.build.json');
    
    // Suggest specific patterns for the unmatched files
    const suggestedPatterns = new Set();
    includedTestFiles.forEach(file => {
      const relativePath = path.relative(path.join(__dirname, '..'), file);
      const normalizedPath = relativePath.replace(/\\/g, '/');
      
      if (normalizedPath.includes('__tests__')) {
        suggestedPatterns.add('**/__tests__/**');
      }
      if (normalizedPath.includes('.test.')) {
        suggestedPatterns.add('**/*.test.*');
      }
      if (normalizedPath.includes('.spec.')) {
        suggestedPatterns.add('**/*.spec.*');
      }
      if (normalizedPath.includes('integration.test')) {
        suggestedPatterns.add('**/*.integration.test.*');
      }
    });
    
    if (suggestedPatterns.size > 0) {
      console.warn('  💡 Suggested additional exclude patterns:');
      suggestedPatterns.forEach(pattern => console.warn(`    - "${pattern}"`));
    }
  } else {
    console.log(`  ✅ All ${testFiles.length} test files properly excluded from production build`);
  }
}

function findTestFiles(dir) {
  const testFiles = [];
  
  if (!fs.existsSync(dir)) {
    return testFiles;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (item === '__tests__' || item === 'e2e') {
        // Add all files in test directories
        const testDirFiles = fs.readdirSync(fullPath)
          .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
          .map(file => path.join(fullPath, file));
        testFiles.push(...testDirFiles);
      } else {
        // Recursively search subdirectories
        testFiles.push(...findTestFiles(fullPath));
      }
    } else if (stat.isFile()) {
      // Check if file is a test file
      if (item.includes('.test.') || item.includes('.spec.') || 
          item.endsWith('.test.ts') || item.endsWith('.test.tsx') ||
          item.endsWith('.spec.ts') || item.endsWith('.spec.tsx')) {
        testFiles.push(fullPath);
      }
    }
  }
  
  return testFiles;
}

function checkCommonIssues(phase, features) {
  console.log('🔧 Checking for common configuration issues...');
  
  // Check base URL format
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl) {
    if (baseUrl.includes('your-app.vercel.app')) {
      console.warn('⚠️  Base URL contains placeholder. This will be updated automatically by Vercel.');
      // Don't fail the build for placeholder URLs during initial deployment
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

async function main() {
  console.log('🚀 NGSRN Enhanced Build Validation');
  console.log('==================================');
  
  // Initialize build monitoring
  let BuildMonitor;
  try {
    BuildMonitor = require('./build-monitor');
  } catch (error) {
    console.log('ℹ️  Build monitoring not available');
  }
  
  const monitor = BuildMonitor ? new BuildMonitor() : null;
  const startTime = Date.now();
  let buildSuccess = false;
  let buildErrors = [];
  
  // Check for help flag
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Usage: node scripts/validate-build.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --auto-fix    Automatically fix common deployment issues before validation');
    console.log('  --monitor     Enable build monitoring and health checks');
    console.log('  --help, -h    Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  AUTO_FIX_DEPLOYMENT=true    Enable automatic fixes (same as --auto-fix)');
    console.log('  ENABLE_BUILD_MONITORING=true Enable build monitoring');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/validate-build.js                 # Run validation only');
    console.log('  node scripts/validate-build.js --auto-fix      # Fix issues then validate');
    console.log('  node scripts/validate-build.js --monitor       # Enable monitoring');
    console.log('  AUTO_FIX_DEPLOYMENT=true npm run build:validate # Auto-fix via environment');
    return;
  }
  
  // Check for configuration drift if monitoring is enabled
  if (monitor && (process.argv.includes('--monitor') || process.env.ENABLE_BUILD_MONITORING === 'true')) {
    console.log('🔍 Checking for configuration drift...');
    const drift = monitor.detectConfigurationDrift();
    
    if (drift.hasDrift) {
      console.log(`⚠️  Configuration drift detected (${drift.severity} severity):`);
      drift.changes.forEach(change => {
        const emoji = change.severity === 'high' ? '🚨' : change.severity === 'medium' ? '⚠️' : 'ℹ️';
        console.log(`  ${emoji} ${change.message}`);
      });
      
      if (drift.severity === 'high') {
        console.log('💡 High-impact changes detected. Consider running validation tests.');
      }
    } else {
      console.log('✅ No configuration drift detected');
    }
    console.log('');
  }
  
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
    
    // Run all validation checks
    await validateBuildEnvironment();
    checkNextConfig();
    checkPackageJson();
    
    const duration = Date.now() - startTime;
    
    console.log('');
    console.log('🎉 All validation checks passed!');
    console.log('Ready for deployment to Vercel.');
    
    // Record successful validation if monitoring is enabled
    if (monitor && (process.argv.includes('--monitor') || process.env.ENABLE_BUILD_MONITORING === 'true')) {
      monitor.recordBuildAttempt({
        success: true,
        duration,
        phase,
        errors: [],
        warnings: [],
        metrics: {
          validationDuration: duration,
          checksPerformed: ['environment', 'typescript', 'configuration', 'assets']
        }
      });
      
      console.log('📊 Build validation recorded in monitoring system');
    }
    
    // Show additional information about automated fixes
    if (DeploymentAutoFix) {
      console.log('');
      console.log('💡 Tip: Use --auto-fix flag to automatically resolve common issues in the future');
    }
    
    // Show monitoring information if available
    if (monitor && (process.argv.includes('--monitor') || process.env.ENABLE_BUILD_MONITORING === 'true')) {
      console.log('');
      console.log('📈 Build Health Summary:');
      const healthReport = monitor.generateHealthReport();
      console.log(`   Overall Health: ${healthReport.overall.status.toUpperCase()} (${healthReport.overall.score}/100)`);
      console.log(`   Success Rate: ${Math.round(healthReport.buildSuccess.rate * 100)}%`);
      console.log(`   Trend: ${healthReport.buildSuccess.trend}`);
      
      if (healthReport.activeAlerts.length > 0) {
        console.log(`   Active Alerts: ${healthReport.activeAlerts.length}`);
      }
      
      if (healthReport.recommendations.length > 0) {
        console.log('');
        console.log('💡 Recommendations:');
        healthReport.recommendations.slice(0, 2).forEach(rec => {
          console.log(`   - ${rec.message}`);
        });
      }
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Record failed validation if monitoring is enabled
    if (monitor && (process.argv.includes('--monitor') || process.env.ENABLE_BUILD_MONITORING === 'true')) {
      const features = {
        cms: process.env.NEXT_PUBLIC_ENABLE_CMS === 'true',
        auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
        search: process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
        ai: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
        media: process.env.NEXT_PUBLIC_ENABLE_MEDIA === 'true'
      };
      
      const hasAnyFeature = Object.values(features).some(Boolean);
      const phase = hasAnyFeature ? 'full' : 'simple';
      
      monitor.recordBuildAttempt({
        success: false,
        duration,
        phase,
        errors: [error.message],
        warnings: [],
        metrics: {
          validationDuration: duration,
          failurePoint: 'validation'
        }
      });
    }
    
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateBuildEnvironment,
  runTypeScriptValidation,
  validateTypeScriptConfiguration,
  runProductionTypeCheck,
  parseTypeScriptErrors,
  verifyTestFileExclusion,
  validateBuildConfiguration,
  checkCommonIssues,
  checkNextConfig,
  checkPackageJson
};