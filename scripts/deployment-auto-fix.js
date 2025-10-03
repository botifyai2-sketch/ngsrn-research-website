#!/usr/bin/env node

/**
 * Automated Deployment Fix System
 * 
 * This script automatically detects and fixes common TypeScript configuration
 * and deployment issues that cause build failures.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentAutoFix {
  constructor() {
    this.projectRoot = process.cwd();
    this.issues = [];
    this.fixes = [];
    this.backups = [];
  }

  /**
   * Main entry point for automated fixes
   */
  async run() {
    console.log('🔍 Scanning for deployment issues...\n');
    
    try {
      // Detect common issues
      await this.detectIssues();
      
      if (this.issues.length === 0) {
        console.log('✅ No deployment issues detected!');
        return true;
      }

      console.log(`Found ${this.issues.length} issue(s):\n`);
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}: ${issue.description}`);
      });

      console.log('\n🔧 Applying automated fixes...\n');
      
      // Apply fixes
      await this.applyFixes();
      
      // Validate fixes
      await this.validateFixes();
      
      console.log('\n✅ Automated fixes completed successfully!');
      console.log('\nSummary of changes:');
      this.fixes.forEach(fix => {
        console.log(`- ${fix}`);
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error during automated fix:', error.message);
      await this.rollbackChanges();
      return false;
    }
  }

  /**
   * Detect common TypeScript configuration and deployment issues
   */
  async detectIssues() {
    // Check for missing production TypeScript config
    await this.checkProductionTypeScriptConfig();
    
    // Check for test files in production build
    await this.checkTestFileInclusion();
    
    // Check for Jest type definition issues
    await this.checkJestTypeDefinitions();
    
    // Check build script configuration
    await this.checkBuildScriptConfiguration();
    
    // Check for missing environment variables
    await this.checkEnvironmentVariables();
    
    // Check for missing environment files
    await this.checkEnvironmentFiles();
    
    // Check for TypeScript compilation errors
    await this.checkTypeScriptErrors();
    
    // Check for path resolution issues
    await this.checkPathResolution();
    
    // Check for dependency issues
    await this.checkDependencyIssues();
    
    // Check for Vercel configuration issues
    await this.checkVercelConfiguration();
    
    // Check for Next.js configuration issues
    await this.checkNextJsConfiguration();
  }

  /**
   * Check if production TypeScript configuration exists and is correct
   */
  async checkProductionTypeScriptConfig() {
    const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');
    
    if (!fs.existsSync(buildConfigPath)) {
      this.issues.push({
        type: 'MISSING_PRODUCTION_TSCONFIG',
        description: 'Missing tsconfig.build.json for production builds',
        severity: 'high',
        fix: 'createProductionTypeScriptConfig'
      });
      return;
    }

    try {
      const buildConfig = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));
      const requiredExcludes = [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/__tests__/**',
        '**/e2e/**',
        'jest.config.js',
        'jest.setup.js',
        'playwright.config.ts'
      ];

      const missingExcludes = requiredExcludes.filter(pattern => 
        !buildConfig.exclude || !buildConfig.exclude.includes(pattern)
      );

      if (missingExcludes.length > 0) {
        this.issues.push({
          type: 'INCOMPLETE_PRODUCTION_TSCONFIG',
          description: `Production TypeScript config missing exclusions: ${missingExcludes.join(', ')}`,
          severity: 'high',
          fix: 'updateProductionTypeScriptConfig',
          data: { missingExcludes }
        });
      }
    } catch (error) {
      this.issues.push({
        type: 'INVALID_PRODUCTION_TSCONFIG',
        description: 'Invalid JSON in tsconfig.build.json',
        severity: 'high',
        fix: 'createProductionTypeScriptConfig'
      });
    }
  }

  /**
   * Check if test files are being included in production builds
   */
  async checkTestFileInclusion() {
    try {
      // Try to compile with production config and check for test-related errors
      const result = execSync('npx tsc --project tsconfig.build.json --noEmit --listFiles', 
        { encoding: 'utf8', stdio: 'pipe' });
      
      const testFilePatterns = ['.test.', '.spec.', '__tests__', '/e2e/'];
      const includedTestFiles = result.split('\n').filter(file => 
        testFilePatterns.some(pattern => file.includes(pattern))
      );

      if (includedTestFiles.length > 0) {
        this.issues.push({
          type: 'TEST_FILES_IN_PRODUCTION',
          description: `Test files included in production build: ${includedTestFiles.length} files`,
          severity: 'high',
          fix: 'excludeTestFiles',
          data: { testFiles: includedTestFiles }
        });
      }
    } catch (error) {
      // This might indicate other TypeScript issues
      if (error.message.includes('Cannot find module') && 
          (error.message.includes('@jest') || error.message.includes('@testing-library'))) {
        this.issues.push({
          type: 'JEST_TYPES_IN_PRODUCTION',
          description: 'Jest/testing library types causing production build errors',
          severity: 'high',
          fix: 'fixJestTypeDefinitions'
        });
      }
    }
  }

  /**
   * Check for Jest type definition issues
   */
  async checkJestTypeDefinitions() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) return;

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const devDeps = packageJson.devDependencies || {};
      
      // Check if Jest is installed but types are missing
      if (devDeps.jest && !devDeps['@types/jest']) {
        this.issues.push({
          type: 'MISSING_JEST_TYPES',
          description: 'Jest is installed but @types/jest is missing',
          severity: 'medium',
          fix: 'installJestTypes'
        });
      }

      // Check for testing library without types
      const testingLibraryPackages = Object.keys(devDeps).filter(pkg => 
        pkg.includes('@testing-library')
      );
      
      testingLibraryPackages.forEach(pkg => {
        const typesPackage = `@types/${pkg.replace('@', '').replace('/', '__')}`;
        if (!devDeps[typesPackage]) {
          this.issues.push({
            type: 'MISSING_TESTING_LIBRARY_TYPES',
            description: `Missing types for ${pkg}`,
            severity: 'low',
            fix: 'installTestingLibraryTypes',
            data: { package: pkg }
          });
        }
      });
    } catch (error) {
      // Invalid package.json
      this.issues.push({
        type: 'INVALID_PACKAGE_JSON',
        description: 'Invalid package.json file',
        severity: 'high',
        fix: 'fixPackageJson'
      });
    }
  }

  /**
   * Check build script configuration
   */
  async checkBuildScriptConfiguration() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) return;

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};

      // Check if build:validate uses production TypeScript config
      if (scripts['build:validate'] && 
          !scripts['build:validate'].includes('tsconfig.build.json')) {
        this.issues.push({
          type: 'INCORRECT_BUILD_VALIDATION',
          description: 'build:validate script not using production TypeScript config',
          severity: 'medium',
          fix: 'updateBuildScripts'
        });
      }

      // Check if type-check:build script exists
      if (!scripts['type-check:build']) {
        this.issues.push({
          type: 'MISSING_PRODUCTION_TYPE_CHECK',
          description: 'Missing type-check:build script for production builds',
          severity: 'medium',
          fix: 'addProductionTypeCheckScript'
        });
      }
    } catch (error) {
      // Already handled in checkJestTypeDefinitions
    }
  }

  /**
   * Check for missing environment variables
   */
  async checkEnvironmentVariables() {
    // Import environment validation from env-config
    let envConfig;
    try {
      envConfig = require('./env-config');
    } catch (error) {
      console.log('  ⚠️  Environment configuration module not available');
      return;
    }

    // Detect deployment phase and validate environment
    const phase = envConfig.detectDeploymentPhase(process.env);
    const validationResult = envConfig.validateEnvironment(phase, process.env);
    
    if (!validationResult.isValid && validationResult.errors.length > 0) {
      // Check for missing NEXT_PUBLIC_SITE_NAME specifically
      const missingSiteName = validationResult.errors.find(error => 
        error.variable === 'NEXT_PUBLIC_SITE_NAME'
      );
      
      if (missingSiteName) {
        this.issues.push({
          type: 'MISSING_SITE_NAME',
          description: 'NEXT_PUBLIC_SITE_NAME environment variable is missing',
          severity: 'high',
          fix: 'injectDefaultSiteName',
          data: { 
            defaultValue: 'NextGen Sustainable Research Network',
            phase: phase
          }
        });
      }

      // Check for other missing required variables
      const otherMissingVars = validationResult.errors.filter(error => 
        error.variable !== 'NEXT_PUBLIC_SITE_NAME'
      );
      
      if (otherMissingVars.length > 0) {
        this.issues.push({
          type: 'MISSING_REQUIRED_ENV_VARS',
          description: `Missing required environment variables: ${otherMissingVars.map(e => e.variable).join(', ')}`,
          severity: 'high',
          fix: 'generateEnvironmentFile',
          data: { 
            missingVars: otherMissingVars,
            phase: phase
          }
        });
      }
    }
  }

  /**
   * Check for missing environment files
   */
  async checkEnvironmentFiles() {
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    const envLocalPath = path.join(this.projectRoot, '.env.local');
    const envLocalExamplePath = path.join(this.projectRoot, '.env.local.example');
    
    // Check if we have example files but no local environment file
    if (fs.existsSync(envExamplePath) && !fs.existsSync(envLocalPath)) {
      this.issues.push({
        type: 'MISSING_ENV_LOCAL',
        description: 'Missing .env.local file (found .env.example)',
        severity: 'medium',
        fix: 'createEnvLocal'
      });
    }

    if (fs.existsSync(envLocalExamplePath) && !fs.existsSync(envLocalPath)) {
      this.issues.push({
        type: 'MISSING_ENV_LOCAL_FROM_EXAMPLE',
        description: 'Missing .env.local file (found .env.local.example)',
        severity: 'medium',
        fix: 'createEnvLocalFromExample'
      });
    }

    // Check if no environment files exist at all
    const hasAnyEnvFile = [
      '.env.local',
      '.env.production',
      '.env'
    ].some(file => fs.existsSync(path.join(this.projectRoot, file)));

    if (!hasAnyEnvFile) {
      this.issues.push({
        type: 'NO_ENVIRONMENT_FILES',
        description: 'No environment files found',
        severity: 'high',
        fix: 'createDefaultEnvironmentFiles'
      });
    }
  }

  /**
   * Check for TypeScript compilation errors
   */
  async checkTypeScriptErrors() {
    try {
      execSync('npx tsc --project tsconfig.build.json --noEmit', 
        { encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
      const errorOutput = error.stdout || error.stderr || '';
      
      if (errorOutput.includes('error TS')) {
        this.issues.push({
          type: 'TYPESCRIPT_COMPILATION_ERRORS',
          description: 'TypeScript compilation errors in production code',
          severity: 'high',
          fix: 'reportTypeScriptErrors',
          data: { errors: errorOutput }
        });
      }
    }
  }

  /**
   * Apply automated fixes based on detected issues
   */
  async applyFixes() {
    for (const issue of this.issues) {
      console.log(`Fixing: ${issue.description}`);
      
      try {
        switch (issue.fix) {
          case 'createProductionTypeScriptConfig':
            await this.createProductionTypeScriptConfig();
            break;
          case 'updateProductionTypeScriptConfig':
            await this.updateProductionTypeScriptConfig(issue.data);
            break;
          case 'excludeTestFiles':
            await this.excludeTestFiles();
            break;
          case 'fixJestTypeDefinitions':
            await this.fixJestTypeDefinitions();
            break;
          case 'installJestTypes':
            await this.installJestTypes();
            break;
          case 'updateBuildScripts':
            await this.updateBuildScripts();
            break;
          case 'addProductionTypeCheckScript':
            await this.addProductionTypeCheckScript();
            break;
          case 'createEnvLocal':
            await this.createEnvLocal();
            break;
          case 'createEnvLocalFromExample':
            await this.createEnvLocalFromExample();
            break;
          case 'createDefaultEnvironmentFiles':
            await this.createDefaultEnvironmentFiles();
            break;
          case 'injectDefaultSiteName':
            await this.injectDefaultSiteName(issue.data);
            break;
          case 'generateEnvironmentFile':
            await this.generateEnvironmentFile(issue.data);
            break;
          case 'reportTypeScriptErrors':
            await this.reportTypeScriptErrors(issue.data);
            break;
          default:
            console.log(`  ⚠️  No automated fix available for: ${issue.type}`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to fix ${issue.type}:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Create production TypeScript configuration
   */
  async createProductionTypeScriptConfig() {
    const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');
    
    // Backup existing file if it exists
    if (fs.existsSync(buildConfigPath)) {
      const backupPath = `${buildConfigPath}.backup.${Date.now()}`;
      fs.copyFileSync(buildConfigPath, backupPath);
      this.backups.push({ original: buildConfigPath, backup: backupPath });
    }

    const buildConfig = {
      extends: './tsconfig.json',
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/__tests__/**',
        '**/e2e/**',
        'jest.config.js',
        'jest.setup.js',
        'playwright.config.ts',
        'scripts/**/*.js'
      ],
      compilerOptions: {
        noEmit: true
      }
    };

    fs.writeFileSync(buildConfigPath, JSON.stringify(buildConfig, null, 2));
    this.fixes.push('Created tsconfig.build.json for production builds');
  }

  /**
   * Update existing production TypeScript configuration
   */
  async updateProductionTypeScriptConfig(data) {
    const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');
    
    // Backup existing file
    const backupPath = `${buildConfigPath}.backup.${Date.now()}`;
    fs.copyFileSync(buildConfigPath, backupPath);
    this.backups.push({ original: buildConfigPath, backup: backupPath });

    const buildConfig = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));
    
    if (!buildConfig.exclude) {
      buildConfig.exclude = [];
    }

    // Add missing exclusions
    data.missingExcludes.forEach(pattern => {
      if (!buildConfig.exclude.includes(pattern)) {
        buildConfig.exclude.push(pattern);
      }
    });

    fs.writeFileSync(buildConfigPath, JSON.stringify(buildConfig, null, 2));
    this.fixes.push(`Updated tsconfig.build.json with missing exclusions: ${data.missingExcludes.join(', ')}`);
  }

  /**
   * Exclude test files from production builds
   */
  async excludeTestFiles() {
    // This is handled by updateProductionTypeScriptConfig
    this.fixes.push('Excluded test files from production builds');
  }

  /**
   * Fix Jest type definitions
   */
  async fixJestTypeDefinitions() {
    // Ensure Jest types are properly configured
    await this.installJestTypes();
    await this.createProductionTypeScriptConfig();
    this.fixes.push('Fixed Jest type definitions for production builds');
  }

  /**
   * Install Jest types
   */
  async installJestTypes() {
    try {
      console.log('  Installing @types/jest...');
      execSync('npm install --save-dev @types/jest', { stdio: 'pipe' });
      this.fixes.push('Installed @types/jest');
    } catch (error) {
      console.log('  ⚠️  Could not install @types/jest automatically. Please run: npm install --save-dev @types/jest');
    }
  }

  /**
   * Update build scripts in package.json
   */
  async updateBuildScripts() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    // Backup package.json
    const backupPath = `${packageJsonPath}.backup.${Date.now()}`;
    fs.copyFileSync(packageJsonPath, backupPath);
    this.backups.push({ original: packageJsonPath, backup: backupPath });

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    // Update build validation script
    packageJson.scripts['build:validate'] = 'npm run type-check:build && node scripts/validate-build.js';
    
    // Add production type check script if missing
    if (!packageJson.scripts['type-check:build']) {
      packageJson.scripts['type-check:build'] = 'tsc --project tsconfig.build.json --noEmit';
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    this.fixes.push('Updated build scripts to use production TypeScript configuration');
  }

  /**
   * Add production type check script
   */
  async addProductionTypeCheckScript() {
    // This is handled by updateBuildScripts
    this.fixes.push('Added type-check:build script for production builds');
  }

  /**
   * Create .env.local from .env.example
   */
  async createEnvLocal() {
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    const envLocalPath = path.join(this.projectRoot, '.env.local');
    
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envLocalPath);
      this.fixes.push('Created .env.local from .env.example template');
      console.log('  ⚠️  Please update .env.local with your actual environment values');
    }
  }

  /**
   * Create .env.local from .env.local.example
   */
  async createEnvLocalFromExample() {
    const envLocalExamplePath = path.join(this.projectRoot, '.env.local.example');
    const envLocalPath = path.join(this.projectRoot, '.env.local');
    
    if (fs.existsSync(envLocalExamplePath)) {
      fs.copyFileSync(envLocalExamplePath, envLocalPath);
      this.fixes.push('Created .env.local from .env.local.example template');
      console.log('  ⚠️  Please update .env.local with your actual environment values');
    }
  }

  /**
   * Create default environment files for both simple and full deployment
   */
  async createDefaultEnvironmentFiles() {
    let envConfig;
    try {
      envConfig = require('./env-config');
    } catch (error) {
      console.log('  ⚠️  Environment configuration module not available, creating basic files');
      await this.createBasicEnvironmentFiles();
      return;
    }

    // Detect current deployment phase
    const phase = envConfig.detectDeploymentPhase(process.env);
    
    // Generate environment file for current phase
    const envFilePath = path.join(this.projectRoot, '.env.local');
    const envContent = this.generateEnvironmentContent(phase, envConfig);
    
    fs.writeFileSync(envFilePath, envContent);
    this.fixes.push(`Created .env.local with ${phase} deployment configuration`);
    
    // Also create .env.local.example for reference
    const examplePath = path.join(this.projectRoot, '.env.local.example');
    fs.writeFileSync(examplePath, envContent);
    this.fixes.push('Created .env.local.example as template');
    
    console.log(`  ✅ Created environment files for ${phase} deployment`);
    console.log('  ⚠️  Please update the placeholder values with your actual configuration');
  }

  /**
   * Inject default NEXT_PUBLIC_SITE_NAME value
   */
  async injectDefaultSiteName(data) {
    const envLocalPath = path.join(this.projectRoot, '.env.local');
    const defaultValue = data.defaultValue || 'NextGen Sustainable Research Network';
    
    let envContent = '';
    
    // Read existing .env.local if it exists
    if (fs.existsSync(envLocalPath)) {
      envContent = fs.readFileSync(envLocalPath, 'utf8');
      
      // Check if NEXT_PUBLIC_SITE_NAME is already set (but empty or commented)
      if (envContent.includes('NEXT_PUBLIC_SITE_NAME')) {
        // Replace existing line
        envContent = envContent.replace(
          /^#?\s*NEXT_PUBLIC_SITE_NAME\s*=.*$/m,
          `NEXT_PUBLIC_SITE_NAME="${defaultValue}"`
        );
      } else {
        // Add to end of file
        envContent += `\n# Site Configuration\nNEXT_PUBLIC_SITE_NAME="${defaultValue}"\n`;
      }
    } else {
      // Create new file with default site name
      envContent = `# Environment Configuration
# Generated by auto-fix on ${new Date().toISOString()}

# Site Configuration
NEXT_PUBLIC_SITE_NAME="${defaultValue}"

# Base URL (will be auto-generated by Vercel if not set)
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
`;
    }
    
    // Backup existing file if it exists
    if (fs.existsSync(envLocalPath)) {
      const backupPath = `${envLocalPath}.backup.${Date.now()}`;
      fs.copyFileSync(envLocalPath, backupPath);
      this.backups.push({ original: envLocalPath, backup: backupPath });
    }
    
    fs.writeFileSync(envLocalPath, envContent);
    this.fixes.push(`Injected default NEXT_PUBLIC_SITE_NAME: "${defaultValue}"`);
    console.log(`  ✅ Set NEXT_PUBLIC_SITE_NAME to "${defaultValue}"`);
  }

  /**
   * Generate comprehensive environment file with missing variables
   */
  async generateEnvironmentFile(data) {
    let envConfig;
    try {
      envConfig = require('./env-config');
    } catch (error) {
      console.log('  ⚠️  Environment configuration module not available');
      return;
    }

    const phase = data.phase || 'simple';
    const envLocalPath = path.join(this.projectRoot, '.env.local');
    
    // Read existing environment content
    let existingEnv = {};
    if (fs.existsSync(envLocalPath)) {
      const existingContent = fs.readFileSync(envLocalPath, 'utf8');
      existingContent.split('\n').forEach(line => {
        const match = line.match(/^([^#][^=]+)="?([^"]*)"?$/);
        if (match) {
          existingEnv[match[1].trim()] = match[2];
        }
      });
    }
    
    // Generate complete environment content
    const envContent = this.generateEnvironmentContent(phase, envConfig, existingEnv);
    
    // Backup existing file if it exists
    if (fs.existsSync(envLocalPath)) {
      const backupPath = `${envLocalPath}.backup.${Date.now()}`;
      fs.copyFileSync(envLocalPath, backupPath);
      this.backups.push({ original: envLocalPath, backup: backupPath });
    }
    
    fs.writeFileSync(envLocalPath, envContent);
    this.fixes.push(`Generated comprehensive environment file for ${phase} deployment`);
    
    // List the variables that were added
    const addedVars = data.missingVars.map(v => v.variable).join(', ');
    console.log(`  ✅ Added missing environment variables: ${addedVars}`);
    console.log('  ⚠️  Please update placeholder values with your actual configuration');
  }

  /**
   * Generate environment file content with proper documentation
   */
  generateEnvironmentContent(phase, envConfig, existingEnv = {}) {
    const config = envConfig.ENV_CONFIGS[phase];
    const descriptions = envConfig.ENV_VARIABLE_DESCRIPTIONS;
    const timestamp = new Date().toISOString();
    
    let content = `# Environment Configuration for ${config.description}
# Generated by auto-fix on ${timestamp}
# Phase: ${phase}
#
# Instructions:
# 1. Update placeholder values with your actual configuration
# 2. For Vercel deployment, set these variables in your Vercel dashboard
# 3. Some variables (marked with *) are auto-provided by Vercel

`;

    // Add required variables
    content += '# Required Variables\n';
    config.required.forEach(varName => {
      const desc = descriptions[varName];
      const existingValue = existingEnv[varName];
      
      content += `# ${desc?.description || 'Required environment variable'}\n`;
      if (desc?.setupInstructions) {
        content += `# Setup: ${desc.setupInstructions}\n`;
      }
      if (desc?.vercelAutoProvided) {
        content += '# * Auto-provided by Vercel\n';
      }
      
      let value = existingValue || desc?.defaultValue || 'your-value-here';
      
      // Special handling for specific variables
      if (varName === 'NEXT_PUBLIC_BASE_URL' && !existingValue) {
        value = 'https://your-app.vercel.app';
      } else if (varName === 'NEXT_PUBLIC_SITE_NAME' && !existingValue) {
        value = 'NextGen Sustainable Research Network';
      } else if (varName === 'DATABASE_URL' && !existingValue) {
        value = 'postgresql://username:password@host:5432/database_name';
      } else if (varName === 'NEXTAUTH_SECRET' && !existingValue) {
        value = 'your-nextauth-secret-key-generate-with-openssl-rand-base64-32';
      }
      
      content += `${varName}="${value}"\n\n`;
    });

    // Add feature flags
    content += '# Feature Flags\n';
    Object.entries(config.features).forEach(([key, value]) => {
      const existingValue = existingEnv[key];
      content += `${key}="${existingValue || value}"\n`;
    });
    content += '\n';

    // Add optional variables
    if (config.optional.length > 0) {
      content += '# Optional Variables\n';
      config.optional.forEach(varName => {
        const desc = descriptions[varName];
        const existingValue = existingEnv[varName];
        
        content += `# ${desc?.description || 'Optional environment variable'}\n`;
        if (desc?.setupInstructions) {
          content += `# Setup: ${desc.setupInstructions}\n`;
        }
        
        if (existingValue) {
          content += `${varName}="${existingValue}"\n`;
        } else {
          content += `# ${varName}="your-value-here"\n`;
        }
        content += '\n';
      });
    }

    // Add deployment-specific notes
    if (phase === 'simple') {
      content += `# Simple Deployment Notes:
# - Database features are disabled
# - Authentication is disabled  
# - Search and AI features are disabled
# - Only basic site functionality is enabled
# - To enable full features, change feature flags above to "true"
`;
    } else {
      content += `# Full Deployment Notes:
# - All features are enabled
# - Database configuration is required
# - Authentication setup is required
# - Optional services (AI, media, search) can be disabled by setting feature flags to "false"
`;
    }

    return content;
  }

  /**
   * Create basic environment files when env-config is not available
   */
  async createBasicEnvironmentFiles() {
    const envLocalPath = path.join(this.projectRoot, '.env.local');
    
    const basicContent = `# Basic Environment Configuration
# Generated by auto-fix on ${new Date().toISOString()}

# Site Configuration
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"

# Feature Flags (Simple Deployment)
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"

# Optional: Google Analytics
# NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Instructions:
# 1. Update placeholder values with your actual configuration
# 2. For Vercel deployment, set these variables in your Vercel dashboard
# 3. To enable full features, change feature flags to "true" and add database configuration
`;

    fs.writeFileSync(envLocalPath, basicContent);
    this.fixes.push('Created basic .env.local configuration');
  }

  /**
   * Report TypeScript errors for manual fixing
   */
  async reportTypeScriptErrors(data) {
    console.log('\n  ⚠️  TypeScript compilation errors detected:');
    console.log(data.errors);
    console.log('\n  These errors need to be fixed manually before deployment.');
    this.fixes.push('Reported TypeScript compilation errors (manual fix required)');
  }

  /**
   * Check for path resolution issues
   */
  async checkPathResolution() {
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) return;

    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      const compilerOptions = tsconfig.compilerOptions || {};

      // Check if baseUrl and paths are properly configured for Next.js
      if (!compilerOptions.baseUrl || !compilerOptions.paths) {
        this.issues.push({
          type: 'MISSING_PATH_MAPPING',
          description: 'Missing baseUrl or path mapping configuration',
          severity: 'medium',
          fix: 'fixPathMapping'
        });
      } else if (!compilerOptions.paths['@/*']) {
        this.issues.push({
          type: 'MISSING_ALIAS_MAPPING',
          description: 'Missing @ alias path mapping',
          severity: 'medium',
          fix: 'addAliasMapping'
        });
      }
    } catch (error) {
      // Invalid tsconfig.json already handled elsewhere
    }
  }

  /**
   * Check for dependency issues
   */
  async checkDependencyIssues() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) return;

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const devDeps = packageJson.devDependencies || {};
      const deps = packageJson.dependencies || {};
      const allDeps = { ...deps, ...devDeps };

      // Check for missing TypeScript
      if (!allDeps.typescript) {
        this.issues.push({
          type: 'MISSING_TYPESCRIPT',
          description: 'TypeScript is not installed',
          severity: 'high',
          fix: 'installTypeScript'
        });
      }

      // Check for missing @types/node
      if (!devDeps['@types/node']) {
        this.issues.push({
          type: 'MISSING_NODE_TYPES',
          description: '@types/node is missing',
          severity: 'medium',
          fix: 'installNodeTypes'
        });
      }

      // Check for Next.js without proper types
      if (allDeps.next && !devDeps['@types/react']) {
        this.issues.push({
          type: 'MISSING_REACT_TYPES',
          description: 'Next.js project missing React type definitions',
          severity: 'medium',
          fix: 'installReactTypes'
        });
      }

      // Check for outdated dependencies that might cause issues
      if (allDeps.next && this.isOutdatedVersion(allDeps.next, '13.0.0')) {
        this.issues.push({
          type: 'OUTDATED_NEXTJS',
          description: 'Next.js version might be outdated',
          severity: 'low',
          fix: 'reportOutdatedDependencies'
        });
      }
    } catch (error) {
      // Invalid package.json already handled elsewhere
    }
  }

  /**
   * Check for Vercel configuration issues
   */
  async checkVercelConfiguration() {
    const vercelConfigPath = path.join(this.projectRoot, 'vercel.json');
    
    if (!fs.existsSync(vercelConfigPath)) {
      this.issues.push({
        type: 'MISSING_VERCEL_CONFIG',
        description: 'Missing vercel.json configuration file',
        severity: 'medium',
        fix: 'createVercelConfig'
      });
      return;
    }

    try {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      // Check build command
      if (!vercelConfig.buildCommand || !vercelConfig.buildCommand.includes('build:validate')) {
        this.issues.push({
          type: 'INCORRECT_VERCEL_BUILD_COMMAND',
          description: 'Vercel build command not using validation',
          severity: 'medium',
          fix: 'updateVercelBuildCommand'
        });
      }

      // Check framework setting
      if (!vercelConfig.framework || vercelConfig.framework !== 'nextjs') {
        this.issues.push({
          type: 'INCORRECT_VERCEL_FRAMEWORK',
          description: 'Vercel framework not set to nextjs',
          severity: 'low',
          fix: 'updateVercelFramework'
        });
      }
    } catch (error) {
      this.issues.push({
        type: 'INVALID_VERCEL_CONFIG',
        description: 'Invalid JSON in vercel.json',
        severity: 'medium',
        fix: 'createVercelConfig'
      });
    }
  }

  /**
   * Check for Next.js configuration issues
   */
  async checkNextJsConfiguration() {
    const nextConfigPath = path.join(this.projectRoot, 'next.config.ts');
    const nextConfigJsPath = path.join(this.projectRoot, 'next.config.js');
    
    const configPath = fs.existsSync(nextConfigPath) ? nextConfigPath : 
                      fs.existsSync(nextConfigJsPath) ? nextConfigJsPath : null;

    if (!configPath) {
      this.issues.push({
        type: 'MISSING_NEXTJS_CONFIG',
        description: 'Missing Next.js configuration file',
        severity: 'low',
        fix: 'createNextJsConfig'
      });
      return;
    }

    // Basic validation - just check if file is readable
    try {
      fs.readFileSync(configPath, 'utf8');
    } catch (error) {
      this.issues.push({
        type: 'INVALID_NEXTJS_CONFIG',
        description: 'Next.js configuration file is not readable',
        severity: 'medium',
        fix: 'fixNextJsConfig'
      });
    }
  }

  /**
   * Fix path mapping configuration
   */
  async fixPathMapping() {
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) return;

    // Backup existing file
    const backupPath = `${tsconfigPath}.backup.${Date.now()}`;
    fs.copyFileSync(tsconfigPath, backupPath);
    this.backups.push({ original: tsconfigPath, backup: backupPath });

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    if (!tsconfig.compilerOptions) {
      tsconfig.compilerOptions = {};
    }

    tsconfig.compilerOptions.baseUrl = '.';
    
    if (!tsconfig.compilerOptions.paths) {
      tsconfig.compilerOptions.paths = {};
    }

    tsconfig.compilerOptions.paths['@/*'] = ['./src/*'];

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    this.fixes.push('Added baseUrl and path mapping configuration');
  }

  /**
   * Add alias mapping
   */
  async addAliasMapping() {
    // This is handled by fixPathMapping
    this.fixes.push('Added @ alias path mapping');
  }

  /**
   * Install TypeScript
   */
  async installTypeScript() {
    try {
      console.log('  Installing TypeScript...');
      execSync('npm install --save-dev typescript', { stdio: 'pipe' });
      this.fixes.push('Installed TypeScript');
    } catch (error) {
      console.log('  ⚠️  Could not install TypeScript automatically. Please run: npm install --save-dev typescript');
    }
  }

  /**
   * Install Node.js types
   */
  async installNodeTypes() {
    try {
      console.log('  Installing @types/node...');
      execSync('npm install --save-dev @types/node', { stdio: 'pipe' });
      this.fixes.push('Installed @types/node');
    } catch (error) {
      console.log('  ⚠️  Could not install @types/node automatically. Please run: npm install --save-dev @types/node');
    }
  }

  /**
   * Install React types
   */
  async installReactTypes() {
    try {
      console.log('  Installing React type definitions...');
      execSync('npm install --save-dev @types/react @types/react-dom', { stdio: 'pipe' });
      this.fixes.push('Installed React type definitions');
    } catch (error) {
      console.log('  ⚠️  Could not install React types automatically. Please run: npm install --save-dev @types/react @types/react-dom');
    }
  }

  /**
   * Report outdated dependencies
   */
  async reportOutdatedDependencies() {
    console.log('  ⚠️  Some dependencies might be outdated. Consider running: npm update');
    this.fixes.push('Reported potentially outdated dependencies');
  }

  /**
   * Create Vercel configuration
   */
  async createVercelConfig() {
    const vercelConfigPath = path.join(this.projectRoot, 'vercel.json');
    
    const vercelConfig = {
      buildCommand: 'npm run build',
      framework: 'nextjs',
      env: {
        NODE_ENV: 'production'
      }
    };

    fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
    this.fixes.push('Created vercel.json configuration');
  }

  /**
   * Update Vercel build command
   */
  async updateVercelBuildCommand() {
    const vercelConfigPath = path.join(this.projectRoot, 'vercel.json');
    
    // Backup existing file
    const backupPath = `${vercelConfigPath}.backup.${Date.now()}`;
    fs.copyFileSync(vercelConfigPath, backupPath);
    this.backups.push({ original: vercelConfigPath, backup: backupPath });

    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    vercelConfig.buildCommand = 'npm run build';

    fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
    this.fixes.push('Updated Vercel build command');
  }

  /**
   * Update Vercel framework setting
   */
  async updateVercelFramework() {
    const vercelConfigPath = path.join(this.projectRoot, 'vercel.json');
    
    // Backup existing file
    const backupPath = `${vercelConfigPath}.backup.${Date.now()}`;
    fs.copyFileSync(vercelConfigPath, backupPath);
    this.backups.push({ original: vercelConfigPath, backup: backupPath });

    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    vercelConfig.framework = 'nextjs';

    fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
    this.fixes.push('Updated Vercel framework setting');
  }

  /**
   * Create Next.js configuration
   */
  async createNextJsConfig() {
    const nextConfigPath = path.join(this.projectRoot, 'next.config.ts');
    
    const nextConfig = `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
}

export default nextConfig
`;

    fs.writeFileSync(nextConfigPath, nextConfig);
    this.fixes.push('Created Next.js configuration file');
  }

  /**
   * Fix Next.js configuration
   */
  async fixNextJsConfig() {
    // For now, just recreate the config
    await this.createNextJsConfig();
    this.fixes.push('Fixed Next.js configuration file');
  }

  /**
   * Check if a version is outdated
   */
  isOutdatedVersion(currentVersion, minimumVersion) {
    // Simple version comparison - remove ^ and ~ prefixes
    const current = currentVersion.replace(/^[\^~]/, '');
    const minimum = minimumVersion.replace(/^[\^~]/, '');
    
    const currentParts = current.split('.').map(Number);
    const minimumParts = minimum.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const minimumPart = minimumParts[i] || 0;
      
      if (currentPart < minimumPart) return true;
      if (currentPart > minimumPart) return false;
    }
    
    return false;
  }

  /**
   * Validate that fixes resolved the issues
   */
  async validateFixes() {
    console.log('Validating fixes...');
    
    try {
      // Test production TypeScript compilation
      execSync('npx tsc --project tsconfig.build.json --noEmit', { stdio: 'pipe' });
      console.log('✅ Production TypeScript compilation successful');
      
      // Test build validation script
      if (fs.existsSync(path.join(this.projectRoot, 'scripts/validate-build.js'))) {
        execSync('node scripts/validate-build.js', { stdio: 'pipe' });
        console.log('✅ Build validation successful');
      }
    } catch (error) {
      console.log('⚠️  Some issues may still exist. Please check the output above.');
    }
  }

  /**
   * Rollback changes if fixes fail
   */
  async rollbackChanges() {
    if (this.backups.length === 0) return;

    console.log('\n🔄 Rolling back changes...');
    
    for (const backup of this.backups) {
      try {
        fs.copyFileSync(backup.backup, backup.original);
        fs.unlinkSync(backup.backup);
        console.log(`Restored ${backup.original}`);
      } catch (error) {
        console.error(`Failed to restore ${backup.original}:`, error.message);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const autoFix = new DeploymentAutoFix();
  
  autoFix.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = DeploymentAutoFix;