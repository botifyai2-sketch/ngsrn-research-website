#!/usr/bin/env node

/**
 * TypeScript Configuration Generator
 * 
 * This script generates and validates proper TypeScript configurations
 * for development and production environments, ensuring test files
 * are properly excluded from production builds.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TypeScriptConfigGenerator {
  constructor() {
    this.projectRoot = process.cwd();
    this.backups = [];
  }

  /**
   * Main entry point
   */
  async run() {
    const command = process.argv[2] || 'generate';
    
    try {
      switch (command) {
        case 'generate':
          await this.generateConfigurations();
          break;
        case 'validate':
          await this.validateConfigurations();
          break;
        case 'fix':
          await this.fixConfigurations();
          break;
        default:
          this.showUsage();
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  /**
   * Generate TypeScript configurations
   */
  async generateConfigurations() {
    console.log('🔧 Generating TypeScript configurations...\n');

    // Generate main tsconfig.json if it doesn't exist
    await this.generateMainConfig();
    
    // Generate production tsconfig.build.json
    await this.generateBuildConfig();
    
    // Update package.json scripts
    await this.updatePackageScripts();
    
    console.log('\n✅ TypeScript configurations generated successfully!');
    console.log('\n📋 Generated files:');
    console.log('   - tsconfig.json (main configuration)');
    console.log('   - tsconfig.build.json (production configuration)');
    console.log('   - Updated package.json scripts');
    
    console.log('\n🧪 Testing configurations...');
    await this.testConfigurations();
  }

  /**
   * Validate existing TypeScript configurations
   */
  async validateConfigurations() {
    console.log('🔍 Validating TypeScript configurations...\n');

    const issues = [];
    
    // Check main config
    const mainConfigIssues = await this.validateMainConfig();
    issues.push(...mainConfigIssues);
    
    // Check build config
    const buildConfigIssues = await this.validateBuildConfig();
    issues.push(...buildConfigIssues);
    
    // Check package.json scripts
    const scriptIssues = await this.validatePackageScripts();
    issues.push(...scriptIssues);
    
    if (issues.length === 0) {
      console.log('✅ All TypeScript configurations are valid!');
    } else {
      console.log(`❌ Found ${issues.length} configuration issue(s):`);
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      console.log('\n💡 Run: npm run fix:typescript-config to fix these issues');
      process.exit(1);
    }
  }

  /**
   * Fix TypeScript configuration issues
   */
  async fixConfigurations() {
    console.log('🔧 Fixing TypeScript configuration issues...\n');
    
    await this.generateConfigurations();
    
    console.log('\n✅ Configuration issues fixed!');
  }

  /**
   * Generate main tsconfig.json
   */
  async generateMainConfig() {
    const configPath = path.join(this.projectRoot, 'tsconfig.json');
    
    if (fs.existsSync(configPath)) {
      console.log('📝 Main tsconfig.json already exists, checking configuration...');
      
      try {
        const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Check if it needs updates
        const needsUpdate = this.checkMainConfigNeedsUpdate(existingConfig);
        
        if (needsUpdate) {
          // Create backup
          const backupPath = `${configPath}.backup.${Date.now()}`;
          fs.copyFileSync(configPath, backupPath);
          this.backups.push(backupPath);
          
          const updatedConfig = this.mergeMainConfig(existingConfig);
          fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
          console.log('✅ Updated main tsconfig.json');
        } else {
          console.log('✅ Main tsconfig.json is properly configured');
        }
        
      } catch (error) {
        console.log('⚠️  Invalid tsconfig.json, regenerating...');
        await this.createMainConfig(configPath);
      }
    } else {
      console.log('📝 Creating main tsconfig.json...');
      await this.createMainConfig(configPath);
    }
  }

  /**
   * Create main TypeScript configuration
   */
  async createMainConfig(configPath) {
    const mainConfig = {
      compilerOptions: {
        lib: ['dom', 'dom.iterable', 'es6'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [
          {
            name: 'next'
          }
        ],
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*']
        },
        types: ['jest', 'node']
      },
      include: [
        'next-env.d.ts',
        '**/*.ts',
        '**/*.tsx',
        '.next/types/**/*.ts'
      ],
      exclude: ['node_modules']
    };

    fs.writeFileSync(configPath, JSON.stringify(mainConfig, null, 2));
    console.log('✅ Created main tsconfig.json');
  }

  /**
   * Generate production tsconfig.build.json
   */
  async generateBuildConfig() {
    const configPath = path.join(this.projectRoot, 'tsconfig.build.json');
    
    console.log('📝 Creating production tsconfig.build.json...');
    
    if (fs.existsSync(configPath)) {
      // Create backup
      const backupPath = `${configPath}.backup.${Date.now()}`;
      fs.copyFileSync(configPath, backupPath);
      this.backups.push(backupPath);
    }

    const buildConfig = {
      extends: './tsconfig.json',
      compilerOptions: {
        noEmit: true,
        types: ['node'] // Exclude Jest types from production
      },
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
        'lighthouserc.js',
        '**/*.stories.ts',
        '**/*.stories.tsx',
        'scripts/**/*.test.js',
        'scripts/test-*.js'
      ]
    };

    fs.writeFileSync(configPath, JSON.stringify(buildConfig, null, 2));
    console.log('✅ Created production tsconfig.build.json');
  }

  /**
   * Update package.json scripts
   */
  async updatePackageScripts() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log('⚠️  No package.json found, skipping script updates');
      return;
    }

    console.log('📝 Updating package.json scripts...');
    
    // Create backup
    const backupPath = `${packageJsonPath}.backup.${Date.now()}`;
    fs.copyFileSync(packageJsonPath, backupPath);
    this.backups.push(backupPath);

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    // Add or update TypeScript-related scripts
    const scriptsToAdd = {
      'type-check': 'tsc --noEmit',
      'type-check:build': 'tsc --project tsconfig.build.json --noEmit'
    };

    let scriptsAdded = false;
    
    for (const [scriptName, scriptCommand] of Object.entries(scriptsToAdd)) {
      if (!packageJson.scripts[scriptName] || packageJson.scripts[scriptName] !== scriptCommand) {
        packageJson.scripts[scriptName] = scriptCommand;
        scriptsAdded = true;
      }
    }

    // Update build:validate script if it exists
    if (packageJson.scripts['build:validate']) {
      const expectedValidateScript = 'npm run type-check:build && node scripts/validate-build.js';
      if (packageJson.scripts['build:validate'] !== expectedValidateScript) {
        packageJson.scripts['build:validate'] = expectedValidateScript;
        scriptsAdded = true;
      }
    }

    if (scriptsAdded) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Updated package.json scripts');
    } else {
      console.log('✅ Package.json scripts are already up to date');
    }
  }

  /**
   * Check if main config needs updates
   */
  checkMainConfigNeedsUpdate(config) {
    // Check for essential compiler options
    const requiredOptions = {
      moduleResolution: 'bundler',
      jsx: 'preserve',
      strict: true,
      skipLibCheck: true
    };

    for (const [option, value] of Object.entries(requiredOptions)) {
      if (config.compilerOptions?.[option] !== value) {
        return true;
      }
    }

    // Check for Next.js plugin
    const hasNextPlugin = config.compilerOptions?.plugins?.some(
      plugin => plugin.name === 'next'
    );
    
    if (!hasNextPlugin) {
      return true;
    }

    return false;
  }

  /**
   * Merge main config with required settings
   */
  mergeMainConfig(existingConfig) {
    const requiredConfig = {
      compilerOptions: {
        ...existingConfig.compilerOptions,
        moduleResolution: 'bundler',
        jsx: 'preserve',
        strict: true,
        skipLibCheck: true,
        plugins: [
          ...(existingConfig.compilerOptions?.plugins || []),
          { name: 'next' }
        ].filter((plugin, index, arr) => 
          arr.findIndex(p => p.name === plugin.name) === index
        )
      }
    };

    return { ...existingConfig, ...requiredConfig };
  }

  /**
   * Validate main TypeScript configuration
   */
  async validateMainConfig() {
    const issues = [];
    const configPath = path.join(this.projectRoot, 'tsconfig.json');
    
    if (!fs.existsSync(configPath)) {
      issues.push('Missing tsconfig.json');
      return issues;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Check essential compiler options
      if (!config.compilerOptions?.moduleResolution) {
        issues.push('Missing moduleResolution in tsconfig.json');
      }
      
      if (!config.compilerOptions?.jsx) {
        issues.push('Missing jsx setting in tsconfig.json');
      }
      
      // Check for Next.js plugin
      const hasNextPlugin = config.compilerOptions?.plugins?.some(
        plugin => plugin.name === 'next'
      );
      
      if (!hasNextPlugin) {
        issues.push('Missing Next.js plugin in tsconfig.json');
      }
      
    } catch (error) {
      issues.push('Invalid JSON syntax in tsconfig.json');
    }

    return issues;
  }

  /**
   * Validate build TypeScript configuration
   */
  async validateBuildConfig() {
    const issues = [];
    const configPath = path.join(this.projectRoot, 'tsconfig.build.json');
    
    if (!fs.existsSync(configPath)) {
      issues.push('Missing tsconfig.build.json for production builds');
      return issues;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Check if it extends main config
      if (!config.extends) {
        issues.push('tsconfig.build.json should extend main tsconfig.json');
      }
      
      // Check for test file exclusions
      const excludePatterns = config.exclude || [];
      const hasTestExclusions = excludePatterns.some(pattern => 
        pattern.includes('test') || 
        pattern.includes('spec') || 
        pattern.includes('__tests__')
      );
      
      if (!hasTestExclusions) {
        issues.push('tsconfig.build.json does not exclude test files');
      }
      
      // Check Jest types are excluded
      const types = config.compilerOptions?.types || [];
      if (types.includes('jest')) {
        issues.push('tsconfig.build.json includes Jest types (should be excluded from production)');
      }
      
    } catch (error) {
      issues.push('Invalid JSON syntax in tsconfig.build.json');
    }

    return issues;
  }

  /**
   * Validate package.json scripts
   */
  async validatePackageScripts() {
    const issues = [];
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      issues.push('Missing package.json');
      return issues;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};
      
      // Check for essential TypeScript scripts
      if (!scripts['type-check']) {
        issues.push('Missing type-check script in package.json');
      }
      
      if (!scripts['type-check:build']) {
        issues.push('Missing type-check:build script in package.json');
      }
      
      // Check if type-check:build uses production config
      if (scripts['type-check:build'] && !scripts['type-check:build'].includes('tsconfig.build.json')) {
        issues.push('type-check:build script should use tsconfig.build.json');
      }
      
    } catch (error) {
      issues.push('Invalid JSON syntax in package.json');
    }

    return issues;
  }

  /**
   * Test TypeScript configurations
   */
  async testConfigurations() {
    try {
      // Test main configuration
      console.log('🧪 Testing main TypeScript configuration...');
      execSync('npm run type-check', { stdio: 'pipe' });
      console.log('✅ Main TypeScript configuration works');
      
      // Test production configuration
      console.log('🧪 Testing production TypeScript configuration...');
      execSync('npm run type-check:build', { stdio: 'pipe' });
      console.log('✅ Production TypeScript configuration works');
      
    } catch (error) {
      console.log('⚠️  TypeScript compilation has errors, but configurations are generated');
      console.log('   Fix TypeScript errors and run type checking again');
    }
  }

  /**
   * Show usage information
   */
  showUsage() {
    console.log('TypeScript Configuration Generator');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/typescript-config-generator.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  generate   Generate TypeScript configurations (default)');
    console.log('  validate   Validate existing configurations');
    console.log('  fix        Fix configuration issues');
    console.log('');
    console.log('Examples:');
    console.log('  npm run fix:typescript-config');
    console.log('  npm run validate:typescript-config');
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new TypeScriptConfigGenerator();
  generator.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = TypeScriptConfigGenerator;