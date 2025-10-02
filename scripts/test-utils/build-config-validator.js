/**
 * Build Configuration Validator Utilities
 * Provides detailed validation and testing utilities for build configurations
 */

const fs = require('fs');
const path = require('path');

class BuildConfigValidator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      details: {}
    };
  }

  // Comprehensive TypeScript configuration validation
  validateTypeScriptConfigurations() {
    console.log('🔍 Validating TypeScript configurations...');
    
    const configs = {
      base: this.validateBaseTypeScriptConfig(),
      build: this.validateBuildTypeScriptConfig(),
      compatibility: this.validateConfigCompatibility()
    };

    this.validationResults.details.typescript = configs;
    
    // Aggregate results
    Object.values(configs).forEach(config => {
      if (!config.isValid) {
        this.validationResults.isValid = false;
        this.validationResults.errors.push(...config.errors);
      }
      this.validationResults.warnings.push(...config.warnings);
      this.validationResults.suggestions.push(...config.suggestions);
    });

    return this.validationResults;
  }

  // Validate base TypeScript configuration
  validateBaseTypeScriptConfig() {
    const configPath = path.join(this.projectRoot, 'tsconfig.json');
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      path: configPath
    };

    if (!fs.existsSync(configPath)) {
      result.isValid = false;
      result.errors.push('Base tsconfig.json not found');
      result.suggestions.push('Create tsconfig.json with Next.js configuration');
      return result;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Validate compiler options
      this.validateCompilerOptions(config.compilerOptions, result, 'base');
      
      // Validate includes/excludes
      this.validateIncludeExclude(config, result, 'base');
      
      // Check Next.js specific settings
      this.validateNextJsSettings(config, result);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Failed to parse tsconfig.json: ${error.message}`);
    }

    return result;
  }

  // Validate build TypeScript configuration
  validateBuildTypeScriptConfig() {
    const configPath = path.join(this.projectRoot, 'tsconfig.build.json');
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      path: configPath
    };

    if (!fs.existsSync(configPath)) {
      result.isValid = false;
      result.errors.push('Build tsconfig.build.json not found');
      result.suggestions.push('Create tsconfig.build.json that extends base config and excludes test files');
      return result;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Validate extends property
      if (!config.extends) {
        result.warnings.push('Build config should extend base configuration');
        result.suggestions.push('Add "extends": "./tsconfig.json"');
      }

      // Validate exclusion patterns
      this.validateExclusionPatterns(config.exclude, result);
      
      // Validate build-specific compiler options
      this.validateBuildCompilerOptions(config.compilerOptions, result);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Failed to parse tsconfig.build.json: ${error.message}`);
    }

    return result;
  }

  // Validate configuration compatibility
  validateConfigCompatibility() {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const baseConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');

    if (!fs.existsSync(baseConfigPath) || !fs.existsSync(buildConfigPath)) {
      result.warnings.push('Cannot validate compatibility - missing configuration files');
      return result;
    }

    try {
      const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'));
      const buildConfig = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));

      // Check if build config properly extends base
      if (buildConfig.extends && !buildConfig.extends.includes('tsconfig.json')) {
        result.warnings.push('Build config extends property may not reference base config correctly');
      }

      // Check for conflicting compiler options
      if (baseConfig.compilerOptions && buildConfig.compilerOptions) {
        const conflicts = this.findCompilerOptionConflicts(
          baseConfig.compilerOptions, 
          buildConfig.compilerOptions
        );
        
        if (conflicts.length > 0) {
          result.warnings.push(`Potential compiler option conflicts: ${conflicts.join(', ')}`);
          result.suggestions.push('Review compiler option overrides in build config');
        }
      }

      // Validate that build config excludes what base config includes
      this.validateIncludeExcludeCompatibility(baseConfig, buildConfig, result);

    } catch (error) {
      result.warnings.push(`Could not validate compatibility: ${error.message}`);
    }

    return result;
  }

  // Validate compiler options
  validateCompilerOptions(compilerOptions, result, configType) {
    if (!compilerOptions) {
      result.warnings.push(`No compiler options found in ${configType} config`);
      return;
    }

    // Essential options for Next.js
    const requiredOptions = {
      'jsx': 'preserve',
      'moduleResolution': ['bundler', 'node'],
      'esModuleInterop': true,
      'allowJs': true,
      'strict': true
    };

    Object.entries(requiredOptions).forEach(([option, expectedValue]) => {
      const actualValue = compilerOptions[option];
      
      if (actualValue === undefined) {
        result.warnings.push(`Missing compiler option: ${option}`);
        result.suggestions.push(`Add "${option}": ${JSON.stringify(expectedValue)} to compiler options`);
      } else if (Array.isArray(expectedValue)) {
        if (!expectedValue.includes(actualValue)) {
          result.warnings.push(`Compiler option ${option} should be one of: ${expectedValue.join(', ')}`);
        }
      } else if (actualValue !== expectedValue) {
        result.warnings.push(`Compiler option ${option} should be ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`);
      }
    });

    // Check for problematic options
    const problematicOptions = {
      'noEmit': { 
        expected: true, 
        reason: 'Should be true for type checking without output',
        severity: configType === 'build' ? 'warning' : 'info'
      },
      'skipLibCheck': { 
        expected: true, 
        reason: 'Improves build performance',
        severity: 'info'
      }
    };

    Object.entries(problematicOptions).forEach(([option, config]) => {
      const actualValue = compilerOptions[option];
      if (actualValue !== config.expected && config.severity === 'warning') {
        result.warnings.push(`${option} should be ${config.expected}: ${config.reason}`);
      }
    });
  }

  // Validate include/exclude patterns
  validateIncludeExclude(config, result, configType) {
    if (configType === 'base') {
      // Base config should include source files
      if (!config.include || config.include.length === 0) {
        result.warnings.push('Base config should specify include patterns');
        result.suggestions.push('Add include patterns for TypeScript files');
      }

      // Base config should not exclude too much
      if (config.exclude && config.exclude.length > 2) {
        result.warnings.push('Base config excludes many patterns - ensure development files are included');
      }
    }
  }

  // Validate exclusion patterns for build config
  validateExclusionPatterns(excludePatterns, result) {
    if (!excludePatterns || excludePatterns.length === 0) {
      result.isValid = false;
      result.errors.push('Build config must have exclusion patterns');
      result.suggestions.push('Add exclusion patterns for test files and development-only files');
      return;
    }

    // Required exclusion patterns
    const requiredPatterns = [
      { pattern: 'test', description: 'test files' },
      { pattern: 'spec', description: 'spec files' },
      { pattern: '__tests__', description: 'test directories' }
    ];

    const excludeString = excludePatterns.join(' ').toLowerCase();
    
    requiredPatterns.forEach(({ pattern, description }) => {
      if (!excludeString.includes(pattern)) {
        result.warnings.push(`Missing exclusion pattern for ${description}`);
        result.suggestions.push(`Add pattern to exclude ${description}: **/*.${pattern}.*`);
      }
    });

    // Check for overly broad exclusions
    const broadPatterns = excludePatterns.filter(pattern => 
      pattern === 'src/**' || 
      pattern === '**/*' ||
      (pattern.includes('src/') && !pattern.includes('test') && !pattern.includes('spec'))
    );

    if (broadPatterns.length > 0) {
      result.warnings.push(`Potentially too broad exclusion patterns: ${broadPatterns.join(', ')}`);
      result.suggestions.push('Ensure production code is not excluded');
    }

    // Check for specific problematic exclusions
    const problematicPatterns = excludePatterns.filter(pattern =>
      pattern.includes('src/components') && !pattern.includes('test') ||
      pattern.includes('src/lib') && !pattern.includes('test') ||
      pattern.includes('src/app') && !pattern.includes('test')
    );

    if (problematicPatterns.length > 0) {
      result.warnings.push(`Exclusion patterns may exclude production code: ${problematicPatterns.join(', ')}`);
      result.suggestions.push('Review exclusion patterns to ensure only test/development files are excluded');
    }
  }

  // Validate build-specific compiler options
  validateBuildCompilerOptions(compilerOptions, result) {
    if (!compilerOptions) {
      return; // Build config may not override compiler options
    }

    // Build config should have noEmit: true
    if (compilerOptions.noEmit !== true) {
      result.warnings.push('Build config should set noEmit: true for type checking');
      result.suggestions.push('Add "noEmit": true to build config compiler options');
    }

    // Check for unnecessary overrides
    const unnecessaryOverrides = ['target', 'module', 'lib'];
    const overrides = unnecessaryOverrides.filter(option => 
      compilerOptions.hasOwnProperty(option)
    );

    if (overrides.length > 0) {
      result.warnings.push(`Unnecessary compiler option overrides in build config: ${overrides.join(', ')}`);
      result.suggestions.push('Remove unnecessary overrides - let base config handle these');
    }
  }

  // Validate Next.js specific settings
  validateNextJsSettings(config, result) {
    const compilerOptions = config.compilerOptions || {};

    // Check for Next.js plugin
    if (!compilerOptions.plugins || !compilerOptions.plugins.some(p => p.name === 'next')) {
      result.warnings.push('Next.js TypeScript plugin not configured');
      result.suggestions.push('Add Next.js plugin to compiler options');
    }

    // Check path mapping
    if (!compilerOptions.paths || !compilerOptions.paths['@/*']) {
      result.warnings.push('Path mapping for @/* not configured');
      result.suggestions.push('Add path mapping: "@/*": ["./src/*"]');
    }

    // Check JSX configuration
    if (compilerOptions.jsx !== 'preserve') {
      result.warnings.push('JSX should be "preserve" for Next.js');
      result.suggestions.push('Set "jsx": "preserve" in compiler options');
    }
  }

  // Find compiler option conflicts
  findCompilerOptionConflicts(baseOptions, buildOptions) {
    const conflicts = [];
    
    Object.keys(buildOptions).forEach(option => {
      if (baseOptions[option] !== undefined && baseOptions[option] !== buildOptions[option]) {
        // Some overrides are expected (like noEmit)
        const expectedOverrides = ['noEmit'];
        if (!expectedOverrides.includes(option)) {
          conflicts.push(option);
        }
      }
    });

    return conflicts;
  }

  // Validate include/exclude compatibility
  validateIncludeExcludeCompatibility(baseConfig, buildConfig, result) {
    const baseIncludes = baseConfig.include || [];
    const buildExcludes = buildConfig.exclude || [];

    // Check if build config excludes files that base config includes
    const potentialConflicts = baseIncludes.filter(includePattern => {
      return buildExcludes.some(excludePattern => {
        // Simple pattern matching - could be more sophisticated
        return includePattern.includes('**') && excludePattern.includes('**') &&
               includePattern.replace('**', '') === excludePattern.replace('**', '');
      });
    });

    if (potentialConflicts.length > 0) {
      result.warnings.push(`Potential include/exclude conflicts: ${potentialConflicts.join(', ')}`);
      result.suggestions.push('Review include/exclude patterns for conflicts');
    }
  }

  // Test exclusion pattern effectiveness
  testExclusionPatternEffectiveness(testFilePaths) {
    const buildConfigPath = path.join(this.projectRoot, 'tsconfig.build.json');
    
    if (!fs.existsSync(buildConfigPath)) {
      return {
        isValid: false,
        errors: ['Build config not found'],
        excludedFiles: [],
        includedFiles: testFilePaths
      };
    }

    try {
      const config = JSON.parse(fs.readFileSync(buildConfigPath, 'utf8'));
      const excludePatterns = config.exclude || [];

      const excludedFiles = [];
      const includedFiles = [];

      testFilePaths.forEach(filePath => {
        const isExcluded = this.isFileExcluded(filePath, excludePatterns);
        
        if (isExcluded) {
          excludedFiles.push(filePath);
        } else {
          includedFiles.push(filePath);
        }
      });

      return {
        isValid: true,
        errors: [],
        excludedFiles,
        includedFiles,
        effectiveness: excludedFiles.length / testFilePaths.length
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to test exclusion patterns: ${error.message}`],
        excludedFiles: [],
        includedFiles: testFilePaths
      };
    }
  }

  // Check if a file would be excluded by patterns
  isFileExcluded(filePath, excludePatterns) {
    return excludePatterns.some(pattern => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\./g, '\\.')
        .replace(/\//g, '[/\\\\]'); // Handle both forward and back slashes

      const regex = new RegExp(`^${regexPattern}$`);
      
      // Normalize file path
      const normalizedPath = filePath.replace(/\\/g, '/');
      
      // Test direct pattern match
      if (regex.test(normalizedPath)) {
        return true;
      }

      // Test common test file patterns
      const isTestFile = normalizedPath.includes('__tests__') || 
                        normalizedPath.includes('.test.') || 
                        normalizedPath.includes('.spec.') ||
                        normalizedPath.includes('integration.test');

      const isTestPattern = pattern.includes('__tests__') || 
                           pattern.includes('*.test.') || 
                           pattern.includes('*.spec.') ||
                           pattern.includes('*test*');

      return isTestFile && isTestPattern;
    });
  }

  // Generate configuration recommendations
  generateRecommendations() {
    const recommendations = {
      critical: [],
      important: [],
      optional: []
    };

    // Analyze current validation results
    this.validationResults.errors.forEach(error => {
      recommendations.critical.push({
        issue: error,
        action: 'Fix immediately - build will fail',
        priority: 'critical'
      });
    });

    this.validationResults.warnings.forEach(warning => {
      if (warning.includes('missing') || warning.includes('not found')) {
        recommendations.important.push({
          issue: warning,
          action: 'Address soon - may cause issues',
          priority: 'important'
        });
      } else {
        recommendations.optional.push({
          issue: warning,
          action: 'Consider improving',
          priority: 'optional'
        });
      }
    });

    return recommendations;
  }

  // Export validation report
  exportReport(outputPath) {
    const report = {
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      validation: this.validationResults,
      recommendations: this.generateRecommendations(),
      summary: {
        isValid: this.validationResults.isValid,
        errorCount: this.validationResults.errors.length,
        warningCount: this.validationResults.warnings.length,
        suggestionCount: this.validationResults.suggestions.length
      }
    };

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      console.log(`📄 Validation report exported to: ${outputPath}`);
    }

    return report;
  }
}

module.exports = BuildConfigValidator;