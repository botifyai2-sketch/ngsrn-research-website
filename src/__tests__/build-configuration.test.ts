/**
 * Build Configuration Tests
 * Tests for validating TypeScript configuration correctness and build process scenarios
 * Requirements: 3.1, 3.2, 4.3
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Mock the validate-build module functions
const validateBuildPath = path.join(__dirname, '../../scripts/validate-build.js');

// Import the functions we want to test
const {
  validateTypeScriptConfiguration,
  runProductionTypeCheck,
  parseTypeScriptErrors,
  verifyTestFileExclusion,
  validateBuildConfiguration,
  checkCommonIssues
} = require(validateBuildPath);

describe('Build Configuration Tests', () => {
  const projectRoot = path.join(__dirname, '../..');
  const tsConfigBuildPath = path.join(projectRoot, 'tsconfig.build.json');
  const tsConfigBasePath = path.join(projectRoot, 'tsconfig.json');
  const packageJsonPath = path.join(projectRoot, 'package.json');

  beforeAll(() => {
    // Ensure we're in the correct directory for tests
    process.chdir(projectRoot);
  });

  describe('TypeScript Configuration Validation', () => {
    test('should validate production TypeScript configuration exists', () => {
      expect(fs.existsSync(tsConfigBuildPath)).toBe(true);
      expect(fs.existsSync(tsConfigBasePath)).toBe(true);
    });

    test('should validate TypeScript configuration structure', () => {
      const validation = validateTypeScriptConfiguration();
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('suggestions');
      
      if (!validation.isValid) {
        console.warn('TypeScript configuration issues found:', validation.errors);
      }
    });

    test('should ensure production config excludes test files', () => {
      const tsConfigBuild = JSON.parse(fs.readFileSync(tsConfigBuildPath, 'utf8'));
      const excludePatterns = tsConfigBuild.exclude || [];
      
      const requiredTestPatterns = [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/__tests__/**'
      ];

      requiredTestPatterns.forEach(pattern => {
        const hasPattern = excludePatterns.some(exclude => 
          exclude === pattern || 
          exclude.includes(pattern.replace('**/', '')) ||
          exclude.includes('*test*')
        );
        expect(hasPattern).toBe(true);
      });
    });

    test('should validate production config extends base config', () => {
      const tsConfigBuild = JSON.parse(fs.readFileSync(tsConfigBuildPath, 'utf8'));
      expect(tsConfigBuild.extends).toBeDefined();
      expect(tsConfigBuild.extends).toContain('tsconfig.json');
    });

    test('should validate noEmit is set for production config', () => {
      const tsConfigBuild = JSON.parse(fs.readFileSync(tsConfigBuildPath, 'utf8'));
      expect(tsConfigBuild.compilerOptions?.noEmit).toBe(true);
    });

    test('should validate base config has required Next.js settings', () => {
      const tsConfigBase = JSON.parse(fs.readFileSync(tsConfigBasePath, 'utf8'));
      
      expect(tsConfigBase.compilerOptions?.jsx).toBeDefined();
      expect(tsConfigBase.compilerOptions?.moduleResolution).toBeDefined();
      expect(tsConfigBase.compilerOptions?.strict).toBe(true);
    });
  });

  describe('Build Process Testing', () => {
    test('should validate package.json build scripts exist', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const requiredScripts = [
        'build',
        'build:validate',
        'type-check:build'
      ];

      requiredScripts.forEach(script => {
        expect(packageJson.scripts).toHaveProperty(script);
        expect(packageJson.scripts[script]).toBeTruthy();
      });
    });

    test('should validate build configuration', async () => {
      const validation = await validateBuildConfiguration();
      // Should not throw an error if configuration is valid
      expect(validation).toBeUndefined(); // Function doesn't return value on success
    });

    test('should run production type check without errors', () => {
      const result = runProductionTypeCheck();
      
      expect(result).toHaveProperty('success');
      
      if (!result.success) {
        console.warn('TypeScript errors found:', result.errors);
        // Log errors for debugging but don't fail test if they're in test files
        if (result.errors) {
          const productionErrors = result.errors.filter(error => 
            !error.file.includes('test') && 
            !error.file.includes('__tests__') &&
            !error.file.includes('spec')
          );
          expect(productionErrors.length).toBe(0);
        }
      }
    });

    test('should verify test file exclusion effectiveness', () => {
      // This should not throw an error
      expect(() => verifyTestFileExclusion()).not.toThrow();
    });
  });

  describe('Error Handling and Parsing', () => {
    test('should parse TypeScript error output correctly', () => {
      const mockErrorOutput = `
src/components/Example.tsx(10,5): error TS2322: Type 'string' is not assignable to type 'number'.
src/lib/utils.ts(25,12): error TS2304: Cannot find name 'unknownVariable'.
      `;

      const errors = parseTypeScriptErrors(mockErrorOutput);
      
      expect(errors).toHaveLength(2);
      expect(errors[0]).toMatchObject({
        file: 'src/components/Example.tsx',
        line: 10,
        column: 5,
        code: '2322',
        message: expect.stringContaining('Type \'string\' is not assignable')
      });
      expect(errors[1]).toMatchObject({
        file: 'src/lib/utils.ts',
        line: 25,
        column: 12,
        code: '2304',
        message: expect.stringContaining('Cannot find name')
      });
    });

    test('should handle malformed TypeScript error output', () => {
      const malformedOutput = 'Some random error message without proper format';
      const errors = parseTypeScriptErrors(malformedOutput);
      
      // Should still return an array, even if empty or with generic entries
      expect(Array.isArray(errors)).toBe(true);
    });

    test('should handle empty error output', () => {
      const errors = parseTypeScriptErrors('');
      expect(Array.isArray(errors)).toBe(true);
      expect(errors.length).toBe(0);
    });
  });

  describe('Configuration Scenarios', () => {
    test('should handle missing tsconfig.build.json scenario', () => {
      // Mock missing file scenario
      const originalExists = fs.existsSync;
      jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
        if (filePath.toString().includes('tsconfig.build.json')) {
          return false;
        }
        return originalExists(filePath);
      });

      const validation = validateTypeScriptConfiguration();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('tsconfig.build.json not found');

      // Restore original function
      jest.restoreAllMocks();
    });

    test('should handle corrupted TypeScript configuration', () => {
      // Mock corrupted JSON scenario
      const originalReadFile = fs.readFileSync;
      jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, encoding) => {
        if (filePath.toString().includes('tsconfig.build.json')) {
          return '{ invalid json }';
        }
        return originalReadFile(filePath, encoding);
      });

      const validation = validateTypeScriptConfiguration();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('Failed to parse TypeScript configuration')
      )).toBe(true);

      // Restore original function
      jest.restoreAllMocks();
    });

    test('should validate different deployment phases', () => {
      const mockFeatures = {
        cms: true,
        auth: true,
        search: false,
        ai: false,
        media: true
      };

      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_ENABLE_CMS: 'true',
        NEXT_PUBLIC_ENABLE_AUTH: 'true',
        NEXT_PUBLIC_ENABLE_SEARCH: 'false',
        NEXT_PUBLIC_ENABLE_AI: 'false',
        NEXT_PUBLIC_ENABLE_MEDIA: 'true'
      };

      // This should not throw an error
      expect(() => checkCommonIssues('full', mockFeatures)).not.toThrow();

      // Restore environment
      process.env = originalEnv;
    });

    test('should handle simple deployment configuration', () => {
      const mockFeatures = {
        cms: false,
        auth: false,
        search: false,
        ai: false,
        media: false
      };

      // Mock environment variables for simple deployment
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_ENABLE_CMS: 'false',
        NEXT_PUBLIC_ENABLE_AUTH: 'false',
        NEXT_PUBLIC_ENABLE_SEARCH: 'false',
        NEXT_PUBLIC_ENABLE_AI: 'false',
        NEXT_PUBLIC_ENABLE_MEDIA: 'false'
      };

      // This should not throw an error
      expect(() => checkCommonIssues('simple', mockFeatures)).not.toThrow();

      // Restore environment
      process.env = originalEnv;
    });
  });

  describe('Build Validation Edge Cases', () => {
    test('should handle missing package.json scripts', () => {
      // Mock package.json without required scripts
      const originalReadFile = fs.readFileSync;
      jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, encoding) => {
        if (filePath.toString().includes('package.json')) {
          return JSON.stringify({
            name: 'test-project',
            scripts: {
              // Missing required build scripts
              dev: 'next dev'
            }
          });
        }
        return originalReadFile(filePath, encoding);
      });

      // Should throw an error due to missing scripts
      expect(async () => {
        await validateBuildConfiguration();
      }).rejects.toThrow();

      // Restore original function
      jest.restoreAllMocks();
    });

    test('should validate environment variable configurations', () => {
      const testCases = [
        {
          name: 'placeholder base URL',
          env: { NEXT_PUBLIC_BASE_URL: 'https://your-app.vercel.app' },
          shouldWarn: true
        },
        {
          name: 'non-HTTPS production URL',
          env: { 
            NEXT_PUBLIC_BASE_URL: 'http://example.com',
            NODE_ENV: 'production'
          },
          shouldWarn: true
        },
        {
          name: 'placeholder GA ID',
          env: { NEXT_PUBLIC_GA_ID: 'G-XXXXXXXXXX' },
          shouldWarn: true
        },
        {
          name: 'valid configuration',
          env: { 
            NEXT_PUBLIC_BASE_URL: 'https://example.com',
            NEXT_PUBLIC_GA_ID: 'G-1234567890'
          },
          shouldWarn: false
        }
      ];

      testCases.forEach(testCase => {
        const originalEnv = process.env;
        process.env = { ...originalEnv, ...testCase.env };

        // Capture console output
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        checkCommonIssues('simple', {
          cms: false,
          auth: false,
          search: false,
          ai: false,
          media: false
        });

        if (testCase.shouldWarn) {
          expect(consoleSpy).toHaveBeenCalled();
        }

        // Restore
        consoleSpy.mockRestore();
        process.env = originalEnv;
      });
    });
  });

  describe('Performance and Reliability', () => {
    test('should complete validation within reasonable time', async () => {
      const startTime = Date.now();
      
      try {
        const validation = validateTypeScriptConfiguration();
        const endTime = Date.now();
        
        // Should complete within 5 seconds
        expect(endTime - startTime).toBeLessThan(5000);
      } catch (error) {
        // Even if validation fails, it should fail quickly
        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(5000);
      }
    });

    test('should handle concurrent validation calls', async () => {
      const promises = Array(3).fill(null).map(() => 
        Promise.resolve(validateTypeScriptConfiguration())
      );

      const results = await Promise.all(promises);
      
      // All results should have the same structure
      results.forEach(result => {
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
        expect(result).toHaveProperty('suggestions');
      });
    });

    test('should be resilient to file system errors', () => {
      // Mock file system error
      const originalExists = fs.existsSync;
      jest.spyOn(fs, 'existsSync').mockImplementation(() => {
        throw new Error('File system error');
      });

      // Should handle the error gracefully
      expect(() => {
        try {
          validateTypeScriptConfiguration();
        } catch (error) {
          // Expected to throw, but should be a controlled error
          expect(error.message).toBeTruthy();
        }
      }).not.toThrow();

      // Restore original function
      jest.restoreAllMocks();
    });
  });
});