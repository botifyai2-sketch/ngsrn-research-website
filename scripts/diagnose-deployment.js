#!/usr/bin/env node

/**
 * Deployment Diagnostic Script
 * 
 * This script diagnoses common deployment configuration issues
 * without automatically fixing them, providing detailed reports
 * and recommendations for manual fixes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentDiagnostic {
  constructor() {
    this.projectRoot = process.cwd();
    this.issues = [];
    this.warnings = [];
    this.recommendations = [];
  }

  /**
   * Main diagnostic entry point
   */
  async run() {
    console.log('🔍 Running deployment configuration diagnostic...\n');
    
    try {
      await this.runDiagnostics();
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Error during diagnostic:', error.message);
      process.exit(1);
    }
  }

  /**
   * Run all diagnostic checks
   */
  async runDiagnostics() {
    console.log('📋 Checking TypeScript configuration...');
    await this.checkTypeScriptConfig();
    
    console.log('📋 Checking build scripts...');
    await this.checkBuildScripts();
    
    console.log('📋 Checking environment setup...');
    await this.checkEnvironment();
    
    console.log('📋 Checking dependencies...');
    await this.checkDependencies();
    
    console.log('📋 Checking file structure...');
    await this.checkFileStructure();
    
    console.log('📋 Testing compilation...');
    await this.testCompilation();
  }

  /**
   * Check TypeScript configuration
   */
  async checkTypeScriptConfig() {
    const mainConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');

    // Check main TypeScript config
    if (!fs.existsSync(mainConfigPath)) {
      this.issues.push({
        type: 'critical',
        category: 'TypeScript',
        message: 'Missing tsconfig.json',
        impact: 'Build will fail',
        solution: 'Create a tsconfig.json file with proper configuration'
      });
      return;
    }

    try {
      const mainConfig = JSON.parse(fs.readFileSync(mainConfigPath, 'utf8'));
      
      // Check if Jest types are included
      if (mainConfig.compilerOptions?.types?.includes('jest')) {
        if (!fs.existsSync(buildConfigPath)) {
          this.issues.push({
            type: 'high',
            category: 'TypeScript',
            message: 'Jest types in main config without production override',
            impact: 'Production build will fail due to missing Jest types',
            solution: 'Create tsconfig.build.json that excludes Jest types'
          });
        }
      }

      // Check for proper module resolution
      if (!mainConfig.compilerOptions?.moduleResolution) {
        this.warnings.push({
          category: 'TypeScript',
          message: 'Module resolution not explicitly set',
          recommendation: 'Set moduleResolution to "node" or "bundler"'
        });
      }

    } catch (error) {
      this.issues.push({
        type: 'critical',
        category: 'TypeScript',
        message: 'Invalid tsconfig.json syntax',
        impact: 'TypeScript compilation will fail',
        solution: 'Fix JSON syntax errors in tsconfig.json'
      });
    }

    // Check production TypeScript config
    if (fs.existsSync(buildConfigPath)) {
      try {
        const buildConfig = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));
        
        // Check if it properly excludes test files
        const excludePatterns = buildConfig.exclude || [];
        const hasTestExclusions = excludePatterns.some(pattern => 
          pattern.includes('test') || 
          pattern.includes('spec') || 
          pattern.includes('__tests__')
        );

        if (!hasTestExclusions) {
          this.issues.push({
            type: 'high',
            category: 'TypeScript',
            message: 'Production config does not exclude test files',
            impact: 'Test files will be included in production build',
            solution: 'Add test file exclusion patterns to tsconfig.build.json'
          });
        }

        // Check if it extends main config
        if (!buildConfig.extends) {
          this.warnings.push({
            category: 'TypeScript',
            message: 'Production config does not extend main config',
            recommendation: 'Add "extends": "./tsconfig.json" to inherit base settings'
          });
        }

      } catch (error) {
        this.issues.push({
          type: 'high',
          category: 'TypeScript',
          message: 'Invalid tsconfig.build.json syntax',
          impact: 'Production build type checking will fail',
          solution: 'Fix JSON syntax errors in tsconfig.build.json'
        });
      }
    } else {
      this.recommendations.push({
        category: 'TypeScript',
        message: 'Consider creating tsconfig.build.json for production builds',
        benefit: 'Separates development and production TypeScript configuration'
      });
    }
  }

  /**
   * Check build scripts configuration
   */
  async checkBuildScripts() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.issues.push({
        type: 'critical',
        category: 'Build Scripts',
        message: 'Missing package.json',
        impact: 'Cannot run build commands',
        solution: 'Initialize npm project with package.json'
      });
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};

      // Check for essential scripts
      if (!scripts.build) {
        this.issues.push({
          type: 'high',
          category: 'Build Scripts',
          message: 'Missing build script',
          impact: 'Cannot build the project',
          solution: 'Add build script to package.json'
        });
      }

      if (!scripts['type-check']) {
        this.warnings.push({
          category: 'Build Scripts',
          message: 'Missing type-check script',
          recommendation: 'Add type checking script for development'
        });
      }

      if (!scripts['type-check:build']) {
        this.recommendations.push({
          category: 'Build Scripts',
          message: 'Consider adding production-specific type checking',
          benefit: 'Validates production code separately from development'
        });
      }

      // Check if build includes validation
      if (scripts.build && !scripts.build.includes('validate')) {
        this.recommendations.push({
          category: 'Build Scripts',
          message: 'Build script does not include validation step',
          benefit: 'Pre-build validation catches issues early'
        });
      }

      // Check for build validation script
      const validateBuildPath = path.join(this.projectRoot, 'scripts', 'validate-build.js');
      if (!fs.existsSync(validateBuildPath)) {
        this.recommendations.push({
          category: 'Build Scripts',
          message: 'Consider adding build validation script',
          benefit: 'Automated validation before deployment'
        });
      }

    } catch (error) {
      this.issues.push({
        type: 'critical',
        category: 'Build Scripts',
        message: 'Invalid package.json syntax',
        impact: 'Cannot parse project configuration',
        solution: 'Fix JSON syntax errors in package.json'
      });
    }
  }

  /**
   * Check environment configuration
   */
  async checkEnvironment() {
    const envFiles = [
      '.env',
      '.env.local',
      '.env.example',
      '.env.production'
    ];

    const existingEnvFiles = envFiles.filter(file => 
      fs.existsSync(path.join(this.projectRoot, file))
    );

    if (existingEnvFiles.length === 0) {
      this.warnings.push({
        category: 'Environment',
        message: 'No environment files found',
        recommendation: 'Create .env.example with required variables'
      });
    }

    // Check if .env.example exists but .env.local doesn't
    if (fs.existsSync(path.join(this.projectRoot, '.env.example')) && 
        !fs.existsSync(path.join(this.projectRoot, '.env.local'))) {
      this.warnings.push({
        category: 'Environment',
        message: 'Missing .env.local file',
        recommendation: 'Copy .env.example to .env.local and configure values'
      });
    }

    // Check for common required environment variables
    const commonEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    try {
      require('dotenv').config({ path: path.join(this.projectRoot, '.env.local') });
      
      const missingVars = commonEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        this.warnings.push({
          category: 'Environment',
          message: `Missing common environment variables: ${missingVars.join(', ')}`,
          recommendation: 'Configure required environment variables'
        });
      }
    } catch (error) {
      // .env.local might not exist, which is okay
    }
  }

  /**
   * Check dependencies
   */
  async checkDependencies() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for TypeScript
      const hasTypeScript = packageJson.dependencies?.typescript || 
                           packageJson.devDependencies?.typescript;
      
      if (!hasTypeScript) {
        this.issues.push({
          type: 'high',
          category: 'Dependencies',
          message: 'TypeScript not found in dependencies',
          impact: 'TypeScript compilation will fail',
          solution: 'Install TypeScript: npm install -D typescript'
        });
      }

      // Check for Next.js
      const hasNextJs = packageJson.dependencies?.next;
      
      if (!hasNextJs) {
        this.warnings.push({
          category: 'Dependencies',
          message: 'Next.js not found in dependencies',
          recommendation: 'Ensure Next.js is properly installed'
        });
      }

      // Check for type definitions
      const typePackages = ['@types/node', '@types/react'];
      const missingTypes = typePackages.filter(pkg => 
        !packageJson.dependencies?.[pkg] && !packageJson.devDependencies?.[pkg]
      );

      if (missingTypes.length > 0) {
        this.warnings.push({
          category: 'Dependencies',
          message: `Missing type definitions: ${missingTypes.join(', ')}`,
          recommendation: 'Install missing type packages for better TypeScript support'
        });
      }

    } catch (error) {
      // Already handled in checkBuildScripts
    }
  }

  /**
   * Check file structure
   */
  async checkFileStructure() {
    const importantFiles = [
      'next.config.ts',
      'next.config.js',
      'tailwind.config.ts',
      'tailwind.config.js'
    ];

    const existingConfigFiles = importantFiles.filter(file => 
      fs.existsSync(path.join(this.projectRoot, file))
    );

    if (existingConfigFiles.length === 0) {
      this.warnings.push({
        category: 'File Structure',
        message: 'No Next.js configuration file found',
        recommendation: 'Create next.config.ts for project configuration'
      });
    }

    // Check for src directory structure
    const srcPath = path.join(this.projectRoot, 'src');
    if (fs.existsSync(srcPath)) {
      const appPath = path.join(srcPath, 'app');
      if (!fs.existsSync(appPath)) {
        this.warnings.push({
          category: 'File Structure',
          message: 'Using src directory but missing src/app',
          recommendation: 'Ensure proper Next.js 13+ app directory structure'
        });
      }
    }

    // Check for test files in src
    if (fs.existsSync(srcPath)) {
      const testFiles = this.findTestFiles(srcPath);
      if (testFiles.length > 0) {
        this.recommendations.push({
          category: 'File Structure',
          message: `Found ${testFiles.length} test files in src directory`,
          benefit: 'Ensure test files are properly excluded from production builds'
        });
      }
    }
  }

  /**
   * Test TypeScript compilation
   */
  async testCompilation() {
    try {
      // Test main TypeScript config
      execSync('npx tsc --noEmit --skipLibCheck', { 
        stdio: 'pipe',
        cwd: this.projectRoot 
      });
      
      console.log('✅ Main TypeScript compilation successful');
      
    } catch (error) {
      this.issues.push({
        type: 'high',
        category: 'Compilation',
        message: 'TypeScript compilation failed',
        impact: 'Build will fail with type errors',
        solution: 'Fix TypeScript errors or update configuration'
      });
    }

    // Test production TypeScript config if it exists
    const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');
    if (fs.existsSync(buildConfigPath)) {
      try {
        execSync('npx tsc --project tsconfig.build.json --noEmit --skipLibCheck', { 
          stdio: 'pipe',
          cwd: this.projectRoot 
        });
        
        console.log('✅ Production TypeScript compilation successful');
        
      } catch (error) {
        this.issues.push({
          type: 'high',
          category: 'Compilation',
          message: 'Production TypeScript compilation failed',
          impact: 'Production build will fail',
          solution: 'Fix TypeScript errors in production configuration'
        });
      }
    }
  }

  /**
   * Find test files in a directory
   */
  findTestFiles(dir) {
    const testFiles = [];
    
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          testFiles.push(...this.findTestFiles(fullPath));
        } else if (file.isFile()) {
          if (file.name.includes('.test.') || 
              file.name.includes('.spec.') || 
              fullPath.includes('__tests__')) {
            testFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory might not be readable
    }
    
    return testFiles;
  }

  /**
   * Generate diagnostic report
   */
  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT DIAGNOSTIC REPORT');
    console.log('='.repeat(60));

    // Summary
    const totalIssues = this.issues.length;
    const criticalIssues = this.issues.filter(i => i.type === 'critical').length;
    const highIssues = this.issues.filter(i => i.type === 'high').length;

    console.log(`\n📈 Summary:`);
    console.log(`   Total Issues: ${totalIssues}`);
    console.log(`   Critical: ${criticalIssues}`);
    console.log(`   High Priority: ${highIssues}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log(`   Recommendations: ${this.recommendations.length}`);

    // Critical and High Priority Issues
    if (this.issues.length > 0) {
      console.log(`\n🚨 Issues Found:`);
      
      this.issues.forEach((issue, index) => {
        const priority = issue.type === 'critical' ? '🔴' : '🟡';
        console.log(`\n   ${priority} ${index + 1}. ${issue.message}`);
        console.log(`      Category: ${issue.category}`);
        console.log(`      Impact: ${issue.impact}`);
        console.log(`      Solution: ${issue.solution}`);
      });
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      
      this.warnings.forEach((warning, index) => {
        console.log(`\n   ${index + 1}. ${warning.message}`);
        console.log(`      Category: ${warning.category}`);
        console.log(`      Recommendation: ${warning.recommendation}`);
      });
    }

    // Recommendations
    if (this.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      
      this.recommendations.forEach((rec, index) => {
        console.log(`\n   ${index + 1}. ${rec.message}`);
        console.log(`      Category: ${rec.category}`);
        console.log(`      Benefit: ${rec.benefit}`);
      });
    }

    // Next Steps
    console.log(`\n🚀 Next Steps:`);
    
    if (criticalIssues > 0) {
      console.log(`   1. ❗ Fix ${criticalIssues} critical issue(s) immediately`);
      console.log(`   2. 🔧 Run: npm run auto-fix (for automatic fixes)`);
    } else if (highIssues > 0) {
      console.log(`   1. 🔧 Fix ${highIssues} high priority issue(s)`);
      console.log(`   2. 🔧 Run: npm run auto-fix (for automatic fixes)`);
    } else if (this.warnings.length > 0) {
      console.log(`   1. ✅ No critical issues found!`);
      console.log(`   2. 🔧 Consider addressing warnings for better reliability`);
    } else {
      console.log(`   1. ✅ Configuration looks good!`);
      console.log(`   2. 🚀 Ready for deployment`);
    }

    console.log(`\n📚 For detailed solutions, see: DEPLOYMENT_TROUBLESHOOTING_GUIDE.md`);
    console.log('='.repeat(60));

    // Exit with appropriate code
    if (criticalIssues > 0) {
      process.exit(2);
    } else if (highIssues > 0) {
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const diagnostic = new DeploymentDiagnostic();
  diagnostic.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = DeploymentDiagnostic;