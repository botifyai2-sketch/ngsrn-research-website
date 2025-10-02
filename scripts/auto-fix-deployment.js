#!/usr/bin/env node

/**
 * Automated Deployment Fix Script
 * 
 * This script automatically detects and fixes common TypeScript configuration
 * issues that cause deployment failures, particularly with Vercel builds.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentAutoFixer {
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
    console.log('🔍 Scanning for deployment configuration issues...\n');
    
    try {
      await this.detectIssues();
      
      if (this.issues.length === 0) {
        console.log('✅ No deployment issues detected. Your configuration looks good!');
        return;
      }

      console.log(`\n🔧 Found ${this.issues.length} issue(s) that can be automatically fixed:`);
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.description}`);
      });

      console.log('\n🚀 Applying automated fixes...\n');
      await this.applyFixes();
      
      console.log('\n✅ Automated fixes completed successfully!');
      console.log('\n📋 Summary of changes:');
      this.fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });

      if (this.backups.length > 0) {
        console.log('\n💾 Backup files created:');
        this.backups.forEach(backup => {
          console.log(`   - ${backup}`);
        });
      }

      console.log('\n🧪 Running validation...');
      await this.validateFixes();
      
    } catch (error) {
      console.error('❌ Error during automated fix process:', error.message);
      await this.rollbackChanges();
      process.exit(1);
    }
  }

  /**
   * Detect common deployment configuration issues
   */
  async detectIssues() {
    // Check for missing production TypeScript configuration
    await this.checkProductionTsConfig();
    
    // Check for test files in production build
    await this.checkTestFileInclusion();
    
    // Check build scripts configuration
    await this.checkBuildScripts();
    
    // Check for Jest type conflicts
    await this.checkJestTypeConflicts();
    
    // Check environment configuration
    await this.checkEnvironmentConfig();
  }

  /**
   * Check if production TypeScript configuration exists and is properly configured
   */
  async checkProductionTsConfig() {
    const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');
    
    if (!fs.existsSync(buildConfigPath)) {
      this.issues.push({
        type: 'missing_build_config',
        description: 'Missing production TypeScript configuration (tsconfig.build.json)',
        severity: 'high',
        fix: this.createProductionTsConfig.bind(this)
      });
      return;
    }

    // Check if existing config properly excludes test files
    try {
      const buildConfig = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));
      const hasTestExclusions = buildConfig.exclude && 
        buildConfig.exclude.some(pattern => 
          pattern.includes('test') || 
          pattern.includes('spec') || 
          pattern.includes('__tests__')
        );

      if (!hasTestExclusions) {
        this.issues.push({
          type: 'incomplete_build_config',
          description: 'Production TypeScript config does not exclude test files',
          severity: 'high',
          fix: this.updateProductionTsConfig.bind(this)
        });
      }
    } catch (error) {
      this.issues.push({
        type: 'invalid_build_config',
        description: 'Production TypeScript configuration is invalid JSON',
        severity: 'high',
        fix: this.createProductionTsConfig.bind(this)
      });
    }
  }

  /**
   * Check if test files are being included in production builds
   */
  async checkTestFileInclusion() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const buildScript = packageJson.scripts?.build;
      const typeCheckScript = packageJson.scripts?.['type-check:build'];

      if (!typeCheckScript) {
        this.issues.push({
          type: 'missing_build_type_check',
          description: 'Missing production-specific type checking script',
          severity: 'medium',
          fix: this.addBuildTypeCheckScript.bind(this)
        });
      }

      if (buildScript && !buildScript.includes('build:validate')) {
        this.issues.push({
          type: 'missing_build_validation',
          description: 'Build script does not include validation step',
          severity: 'medium',
          fix: this.updateBuildScript.bind(this)
        });
      }
    } catch (error) {
      console.warn('Warning: Could not parse package.json');
    }
  }

  /**
   * Check build scripts configuration
   */
  async checkBuildScripts() {
    const validateBuildPath = path.join(this.projectRoot, 'scripts', 'validate-build.js');
    
    if (!fs.existsSync(validateBuildPath)) {
      this.issues.push({
        type: 'missing_build_validator',
        description: 'Missing build validation script',
        severity: 'medium',
        fix: this.createBuildValidator.bind(this)
      });
      return;
    }

    // Check if validator uses production TypeScript config
    try {
      const validatorContent = fs.readFileSync(validateBuildPath, 'utf8');
      if (!validatorContent.includes('tsconfig.build.json')) {
        this.issues.push({
          type: 'validator_wrong_config',
          description: 'Build validator not using production TypeScript configuration',
          severity: 'medium',
          fix: this.updateBuildValidator.bind(this)
        });
      }
    } catch (error) {
      console.warn('Warning: Could not read build validator script');
    }
  }

  /**
   * Check for Jest type definition conflicts
   */
  async checkJestTypeConflicts() {
    const mainTsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    
    if (!fs.existsSync(mainTsConfigPath)) {
      return;
    }

    try {
      const tsConfig = JSON.parse(fs.readFileSync(mainTsConfigPath, 'utf8'));
      const types = tsConfig.compilerOptions?.types;
      
      if (types && types.includes('jest') && !fs.existsSync(path.join(this.projectRoot, 'tsconfig.build.json'))) {
        this.issues.push({
          type: 'jest_type_conflict',
          description: 'Jest types included in main config without production override',
          severity: 'high',
          fix: this.resolveJestTypeConflict.bind(this)
        });
      }
    } catch (error) {
      console.warn('Warning: Could not parse main tsconfig.json');
    }
  }

  /**
   * Check environment configuration
   */
  async checkEnvironmentConfig() {
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    const envLocalPath = path.join(this.projectRoot, '.env.local');
    
    if (fs.existsSync(envExamplePath) && !fs.existsSync(envLocalPath)) {
      this.issues.push({
        type: 'missing_env_local',
        description: 'Missing .env.local file (copy from .env.example)',
        severity: 'low',
        fix: this.createEnvLocal.bind(this)
      });
    }
  }

  /**
   * Apply all detected fixes
   */
  async applyFixes() {
    for (const issue of this.issues) {
      try {
        await issue.fix();
      } catch (error) {
        console.error(`Failed to fix ${issue.type}:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Create production TypeScript configuration
   */
  async createProductionTsConfig() {
    const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');
    
    const productionConfig = {
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
        '**/*.stories.ts',
        '**/*.stories.tsx'
      ],
      compilerOptions: {
        noEmit: true
      }
    };

    fs.writeFileSync(buildConfigPath, JSON.stringify(productionConfig, null, 2));
    this.fixes.push('Created tsconfig.build.json for production builds');
  }

  /**
   * Update existing production TypeScript configuration
   */
  async updateProductionTsConfig() {
    const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');
    
    // Create backup
    const backupPath = `${buildConfigPath}.backup.${Date.now()}`;
    fs.copyFileSync(buildConfigPath, backupPath);
    this.backups.push(backupPath);

    const existingConfig = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));
    
    const testExclusions = [
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

    existingConfig.exclude = [...new Set([...(existingConfig.exclude || []), ...testExclusions])];
    
    fs.writeFileSync(buildConfigPath, JSON.stringify(existingConfig, null, 2));
    this.fixes.push('Updated tsconfig.build.json to exclude test files');
  }

  /**
   * Add production-specific type checking script
   */
  async addBuildTypeCheckScript() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    // Create backup
    const backupPath = `${packageJsonPath}.backup.${Date.now()}`;
    fs.copyFileSync(packageJsonPath, backupPath);
    this.backups.push(backupPath);

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    packageJson.scripts['type-check:build'] = 'tsc --project tsconfig.build.json --noEmit';
    
    if (!packageJson.scripts['build:validate']) {
      packageJson.scripts['build:validate'] = 'npm run type-check:build && node scripts/validate-build.js';
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    this.fixes.push('Added type-check:build script to package.json');
  }

  /**
   * Update build script to include validation
   */
  async updateBuildScript() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    // Create backup
    const backupPath = `${packageJsonPath}.backup.${Date.now()}`;
    fs.copyFileSync(packageJsonPath, backupPath);
    this.backups.push(backupPath);

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.scripts?.build && !packageJson.scripts.build.includes('build:validate')) {
      const currentBuild = packageJson.scripts.build;
      packageJson.scripts.build = `npm run build:validate && ${currentBuild.replace(/^npm run build:validate &&\s*/, '')}`;
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      this.fixes.push('Updated build script to include validation');
    }
  }

  /**
   * Create build validation script
   */
  async createBuildValidator() {
    const scriptsDir = path.join(this.projectRoot, 'scripts');
    const validatorPath = path.join(scriptsDir, 'validate-build.js');
    
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    const validatorContent = `#!/usr/bin/env node

/**
 * Build Validation Script
 * Validates TypeScript configuration and build readiness
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function validateBuild() {
  console.log('🔍 Validating build configuration...');
  
  try {
    // Check if production TypeScript config exists
    const buildConfigPath = path.join(process.cwd(), 'tsconfig.build.json');
    if (!fs.existsSync(buildConfigPath)) {
      throw new Error('Missing tsconfig.build.json - run npm run auto-fix to create it');
    }

    // Validate TypeScript compilation with production config
    console.log('📝 Type checking production code...');
    execSync('npm run type-check:build', { stdio: 'inherit' });
    
    console.log('✅ Build validation passed!');
    
  } catch (error) {
    console.error('❌ Build validation failed:', error.message);
    console.log('\\n💡 Try running: npm run auto-fix');
    process.exit(1);
  }
}

validateBuild();
`;

    fs.writeFileSync(validatorPath, validatorContent);
    fs.chmodSync(validatorPath, '755');
    this.fixes.push('Created build validation script');
  }

  /**
   * Update build validator to use production config
   */
  async updateBuildValidator() {
    const validatorPath = path.join(this.projectRoot, 'scripts', 'validate-build.js');
    
    // Create backup
    const backupPath = `${validatorPath}.backup.${Date.now()}`;
    fs.copyFileSync(validatorPath, backupPath);
    this.backups.push(backupPath);

    let content = fs.readFileSync(validatorPath, 'utf8');
    
    // Replace any tsc commands to use production config
    content = content.replace(
      /tsc\s+--noEmit/g,
      'tsc --project tsconfig.build.json --noEmit'
    );
    
    fs.writeFileSync(validatorPath, content);
    this.fixes.push('Updated build validator to use production TypeScript config');
  }

  /**
   * Resolve Jest type definition conflicts
   */
  async resolveJestTypeConflict() {
    await this.createProductionTsConfig();
    this.fixes.push('Resolved Jest type conflicts by creating production config');
  }

  /**
   * Create .env.local from .env.example
   */
  async createEnvLocal() {
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    const envLocalPath = path.join(this.projectRoot, '.env.local');
    
    fs.copyFileSync(envExamplePath, envLocalPath);
    this.fixes.push('Created .env.local from .env.example');
  }

  /**
   * Validate that fixes resolved the issues
   */
  async validateFixes() {
    try {
      // Test TypeScript compilation
      if (fs.existsSync(path.join(this.projectRoot, 'tsconfig.build.json'))) {
        execSync('npm run type-check:build', { stdio: 'pipe' });
        console.log('✅ Production TypeScript compilation successful');
      }
      
      console.log('✅ All fixes validated successfully');
      
    } catch (error) {
      console.warn('⚠️  Some validation checks failed, but fixes were applied');
      console.log('   You may need to resolve remaining issues manually');
    }
  }

  /**
   * Rollback changes if something goes wrong
   */
  async rollbackChanges() {
    if (this.backups.length === 0) {
      return;
    }

    console.log('🔄 Rolling back changes...');
    
    for (const backupPath of this.backups) {
      try {
        const originalPath = backupPath.replace(/\.backup\.\d+$/, '');
        fs.copyFileSync(backupPath, originalPath);
        fs.unlinkSync(backupPath);
      } catch (error) {
        console.error(`Failed to rollback ${backupPath}:`, error.message);
      }
    }
    
    console.log('✅ Changes rolled back');
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new DeploymentAutoFixer();
  fixer.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = DeploymentAutoFixer;