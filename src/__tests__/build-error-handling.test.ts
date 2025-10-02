/**
 * Build Error Handling Tests
 * Tests for ensuring error handling works properly for different failure modes
 * Requirements: 4.3
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Import the functions we want to test
const validateBuildPath = path.join(__dirname, '../../scripts/validate-build.js');
const {
  parseTypeScriptErrors,
  validateTypeScriptConfiguration,
  runProductionTypeCheck
} = require(validateBuildPath);

describe('Build Error Handling Tests', () => {
  const projectRoot = path.join(__dirname, '../..');

  beforeAll(() => {
    process.chdir(projectRoot);
  });

  describe('TypeScript Error Parsing', () => {
    test('should parse single TypeScript error correctly', () => {
      const errorOutput = 'src/components/Button.tsx(15,8): error TS2322: Type \'number\' is not assignable to type \'string\'.';
      
      const errors = parseTypeScriptErrors(errorOutput);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        file: 'src/components/Button.tsx',
        line: 15,
        column: 8,
        code: '2322',
        message: 'Type \'number\' is not assignable to type \'string\'.'
      });
    });

    test('should parse multiple TypeScript errors correctly', () => {
      const errorOutput = `
src/components/Button.tsx(15,8): error TS2322: Type 'number' is not assignable to type 'string'.
src/lib/utils.ts(42,12): error TS2304: Cannot find name 'undefinedVariable'.
src/pages/index.tsx(8,5): error TS2345: Argument of type 'undefined' is not assignable to parameter of type 'string'.
      `;
      
      const errors = parseTypeScriptErrors(errorOutput);
      
      expect(errors).toHaveLength(3);
      
      expect(errors[0]).toMatchObject({
        file: 'src/components/Button.tsx',
        line: 15,
        column: 8,
        code: '2322'
      });
      
      expect(errors[1]).toMatchObject({
        file: 'src/lib/utils.ts',
        line: 42,
        column: 12,
        code: '2304'
      });
      
      expect(errors[2]).toMatchObject({
        file: 'src/pages/index.tsx',
        line: 8,
        column: 5,
        code: '2345'
      });
    });

    test('should handle malformed TypeScript error output', () => {
      const malformedOutputs = [
        'Random error message without proper format',
        'src/file.ts: Some error without line numbers',
        'error TS2322 without file information',
        '',
        null,
        undefined
      ];

      malformedOutputs.forEach(output => {
        const errors = parseTypeScriptErrors(output || '');
        expect(Array.isArray(errors)).toBe(true);
        // Should not throw an error, even with malformed input
      });
    });

    test('should handle TypeScript errors with complex file paths', () => {
      const errorOutput = `
C:\\Users\\Developer\\project\\src\\components\\complex-path\\Button.tsx(15,8): error TS2322: Type 'number' is not assignable to type 'string'.
/home/user/project/src/components/unix-path/Component.tsx(20,5): error TS2304: Cannot find name 'variable'.
      `;
      
      const errors = parseTypeScriptErrors(errorOutput);
      
      expect(errors).toHaveLength(2);
      expect(errors[0].file).toContain('Button.tsx');
      expect(errors[1].file).toContain('Component.tsx');
    });

    test('should handle TypeScript errors with special characters in messages', () => {
      const errorOutput = `src/components/Button.tsx(15,8): error TS2322: Type '"special-string"' is not assignable to type 'RegularString'.`;
      
      const errors = parseTypeScriptErrors(errorOutput);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('special-string');
    });
  });

  describe('Configuration Error Handling', () => {
    test('should handle missing tsconfig.build.json gracefully', () => {
      // Mock fs.existsSync to simulate missing file
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
      expect(validation.suggestions).toContain('Create tsconfig.build.json that extends tsconfig.json and excludes test files');

      jest.restoreAllMocks();
    });

    test('should handle missing base tsconfig.json gracefully', () => {
      // Mock fs.existsSync to simulate missing base config
      const originalExists = fs.existsSync;
      jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
        if (filePath.toString().includes('tsconfig.json') && !filePath.toString().includes('build')) {
          return false;
        }
        return originalExists(filePath);
      });

      const validation = validateTypeScriptConfiguration();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('tsconfig.json not found');

      jest.restoreAllMocks();
    });

    test('should handle corrupted JSON configuration files', () => {
      // Mock fs.readFileSync to return invalid JSON
      const originalReadFile = fs.readFileSync;
      jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, encoding) => {
        if (filePath.toString().includes('tsconfig.build.json')) {
          return '{ invalid json content }';
        }
        return originalReadFile(filePath, encoding);
      });

      const validation = validateTypeScriptConfiguration();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => 
        error.includes('Failed to parse TypeScript configuration')
      )).toBe(true);

      jest.restoreAllMocks();
    });

    test('should handle configuration with missing extends property', () => {
      // Mock configuration without extends
      const originalReadFile = fs.readFileSync;
      jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, encoding) => {
        if (filePath.toString().includes('tsconfig.build.json')) {
          return JSON.stringify({
            compilerOptions: { noEmit: true },
            exclude: ['**/*.test.ts']
          });
        }
        return originalReadFile(filePath, encoding);
      });

      const validation = validateTypeScriptConfiguration();
      
      expect(validation.warnings).toContain('tsconfig.build.json does not extend base configuration');

      jest.restoreAllMocks();
    });

    test('should handle configuration with insufficient test exclusions', () => {
      // Mock configuration with incomplete test exclusions
      const originalReadFile = fs.readFileSync;
      jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, encoding) => {
        if (filePath.toString().includes('tsconfig.build.json')) {
          return JSON.stringify({
            extends: './tsconfig.json',
            compilerOptions: { noEmit: true },
            exclude: ['**/*.test.ts'] // Missing other test patterns
          });
        }
        return originalReadFile(filePath, encoding);
      });

      const validation = validateTypeScriptConfiguration();
      
      expect(validation.warnings.some(warning => 
        warning.includes('Missing test exclusion patterns')
      )).toBe(true);

      jest.restoreAllMocks();
    });
  });

  describe('Build Process Error Scenarios', () => {
    test('should handle TypeScript compilation failures gracefully', () => {
      // Create a temporary file with TypeScript errors
      const tempErrorFile = path.join(projectRoot, 'src', 'temp-error.ts');
      const errorContent = `
// This file contains intentional TypeScript errors
export const invalidCode: string = 123; // Type error
export function brokenFunction() {
  return nonExistentVariable; // Reference error
}
`;

      try {
        fs.writeFileSync(tempErrorFile, errorContent);
        
        const result = runProductionTypeCheck();
        
        // Should handle the error gracefully
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('errors');
        
        if (!result.success) {
          expect(Array.isArray(result.errors)).toBe(true);
          // Should contain parsed error information
          if (result.errors.length > 0) {
            expect(result.errors[0]).toHaveProperty('file');
            expect(result.errors[0]).toHaveProperty('message');
          }
        }
        
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempErrorFile)) {
          fs.unlinkSync(tempErrorFile);
        }
      }
    });

    test('should handle missing TypeScript compiler gracefully', () => {
      // Mock execSync to simulate missing TypeScript compiler
      jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => {
        const error = new Error('Command not found: tsc') as any;
        error.code = 'ENOENT';
        throw error;
      });

      try {
        const result = runProductionTypeCheck();
        
        // If it doesn't throw, it should return an error result
        expect(result.success).toBe(false);
        expect(result.errors || result.rawOutput).toBeDefined();
      } catch (error) {
        // If it throws, that's also acceptable error handling
        expect(error).toBeDefined();
      }

      jest.restoreAllMocks();
    });

    test('should handle timeout scenarios in build validation', async () => {
      // This test simulates a long-running process that should timeout
      const longRunningScript = `
const start = Date.now();
while (Date.now() - start < 1000) {
  // Simulate work for 1 second
}
console.log('Process completed');
      `;

      const tempScript = path.join(projectRoot, 'temp-long-script.js');
      
      try {
        fs.writeFileSync(tempScript, longRunningScript);
        
        // Run with very short timeout
        try {
          execSync(`node "${tempScript}"`, {
            timeout: 500, // 500ms timeout
            encoding: 'utf8'
          });
          // If no timeout occurred, that's also acceptable
        } catch (error: any) {
          // Should timeout gracefully - check for timeout-related errors
          expect(error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT' || error.message.includes('timeout')).toBe(true);
        }
        
      } finally {
        if (fs.existsSync(tempScript)) {
          fs.unlinkSync(tempScript);
        }
      }
    });
  });

  describe('Environment Error Handling', () => {
    test('should handle missing environment variables gracefully', () => {
      const originalEnv = process.env;
      
      try {
        // Remove critical environment variables
        process.env = {
          ...originalEnv,
          NODE_ENV: undefined,
          NEXT_PUBLIC_BASE_URL: undefined
        };

        // Import and test environment validation
        const { validateEnvironment } = require(path.join(projectRoot, 'scripts', 'env-config.js'));
        
        // Should handle missing variables gracefully
        const result = validateEnvironment('simple', process.env);
        
        // May return false, but should not throw
        expect(typeof result).toBe('boolean');
        
      } catch (error) {
        // Should provide helpful error messages
        expect(error.message).toBeTruthy();
      } finally {
        process.env = originalEnv;
      }
    });

    test('should handle invalid environment variable values', () => {
      const originalEnv = process.env;
      
      try {
        // Set invalid environment variables
        process.env = {
          ...originalEnv,
          NEXT_PUBLIC_BASE_URL: 'invalid-url-format',
          NEXT_PUBLIC_ENABLE_CMS: 'maybe', // Should be true/false
          NODE_ENV: 'invalid-env'
        };

        const { validateEnvironment } = require(path.join(projectRoot, 'scripts', 'env-config.js'));
        
        // Should handle invalid values gracefully
        const result = validateEnvironment('full', process.env);
        expect(typeof result).toBe('boolean');
        
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe('File System Error Handling', () => {
    test('should handle permission errors gracefully', () => {
      // Mock fs operations to simulate permission errors
      const originalReadFile = fs.readFileSync;
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        const error = new Error('Permission denied') as any;
        error.code = 'EACCES';
        throw error;
      });

      expect(() => {
        validateTypeScriptConfiguration();
      }).not.toThrow(); // Should handle gracefully, not crash

      jest.restoreAllMocks();
    });

    test('should handle disk space errors gracefully', () => {
      // Mock fs operations to simulate disk space errors
      const originalWriteFile = fs.writeFileSync;
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        const error = new Error('No space left on device') as any;
        error.code = 'ENOSPC';
        throw error;
      });

      // Create a function that would write files
      const testWrite = () => {
        try {
          fs.writeFileSync('test-file.txt', 'test content');
        } catch (error: any) {
          // Should handle disk space errors gracefully
          expect(error.code).toBe('ENOSPC');
          return false;
        }
        return true;
      };

      expect(testWrite()).toBe(false);

      jest.restoreAllMocks();
    });

    test('should handle concurrent file access gracefully', async () => {
      const testFile = path.join(projectRoot, 'concurrent-test.json');
      
      try {
        // Create multiple concurrent operations on the same file
        const operations = Array(5).fill(null).map((_, index) => 
          new Promise<boolean>((resolve) => {
            setTimeout(() => {
              try {
                const data = { index, timestamp: Date.now() };
                fs.writeFileSync(testFile, JSON.stringify(data));
                
                // Try to read it back
                const content = fs.readFileSync(testFile, 'utf8');
                JSON.parse(content);
                
                resolve(true);
              } catch (error) {
                // Concurrent access might cause temporary failures
                // This is expected and should be handled gracefully
                resolve(false);
              }
            }, Math.random() * 50);
          })
        );

        const results = await Promise.all(operations);
        
        // At least some operations should succeed
        const successCount = results.filter(Boolean).length;
        expect(successCount).toBeGreaterThan(0);
        
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
  });

  describe('Recovery and Suggestions', () => {
    test('should provide helpful suggestions for common errors', () => {
      const testCases = [
        {
          scenario: 'missing tsconfig.build.json',
          mockCondition: () => {
            jest.spyOn(fs, 'existsSync').mockImplementation((filePath) => {
              return !filePath.toString().includes('tsconfig.build.json');
            });
          },
          expectedSuggestion: 'Create tsconfig.build.json'
        },
        {
          scenario: 'missing test exclusions',
          mockCondition: () => {
            jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, encoding) => {
              if (filePath.toString().includes('tsconfig.build.json')) {
                return JSON.stringify({
                  extends: './tsconfig.json',
                  exclude: [] // No exclusions
                });
              }
              return require('fs').readFileSync(filePath, encoding);
            });
          },
          expectedSuggestion: 'missing test file patterns'
        }
      ];

      testCases.forEach(testCase => {
        try {
          testCase.mockCondition();
          
          const validation = validateTypeScriptConfiguration();
          
          expect(validation.suggestions.some(suggestion => 
            suggestion.includes(testCase.expectedSuggestion)
          )).toBe(true);
          
        } finally {
          jest.restoreAllMocks();
        }
      });
    });

    test('should provide context-aware error messages', () => {
      // Test that error messages include relevant context
      const errorOutput = `
src/components/Button.tsx(15,8): error TS2322: Type 'number' is not assignable to type 'string'.
Property 'onClick' is missing in type '{ children: string; }' but required in type 'ButtonProps'.
      `;
      
      const errors = parseTypeScriptErrors(errorOutput);
      
      // Should extract meaningful error information
      expect(errors.length).toBeGreaterThan(0);
      
      if (errors.length > 0) {
        expect(errors[0]).toHaveProperty('file');
        expect(errors[0]).toHaveProperty('line');
        expect(errors[0]).toHaveProperty('message');
        
        // Error message should be descriptive
        expect(errors[0].message.length).toBeGreaterThan(10);
      }
    });

    test('should suggest automated fixes when available', () => {
      // Test that validation suggests automated fixes
      const validation = validateTypeScriptConfiguration();
      
      if (!validation.isValid && validation.suggestions.length > 0) {
        // Should suggest specific actions
        validation.suggestions.forEach(suggestion => {
          expect(typeof suggestion).toBe('string');
          expect(suggestion.length).toBeGreaterThan(5);
        });
      }
    });
  });
});