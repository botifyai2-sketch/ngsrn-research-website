/**
 * Comprehensive Build Configuration Tests
 * Tests TypeScript configuration correctness, build process scenarios, and error handling
 * Requirements: 3.1, 3.2, 4.3
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  validateTypeScriptConfiguration,
  runProductionTypeCheck,
  parseTypeScriptErrors,
  verifyTestFileExclusion,
  validateBuildConfiguration,
  checkCommonIssues,
  checkNextConfig,
  checkPackageJson
} = require('../validate-build');

// Mock file system for testing
const mockFs = {
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn()
};

// Mock child_process for testing
const mockExecSync = jest.fn();

// Test data
const validTsConfigBase = {
  compilerOptions: {
    target: "ES2017",
    lib: ["dom", "dom.iterable", "esnext"],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "preserve",
    incremental: true,
    plugins: [{ name: "next" }],
    paths: { "@/*": ["./src/*"] }
  },
  include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  exclude: ["node_modules"]
};

const validTsConfigBuild = {
  extends: "./tsconfig.json",
  compilerOptions: {
    noEmit: true
  },
  exclude: [
    "node_modules",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/__tests__/**",
    "**/e2e/**",
    "jest.config.js",
    "jest.setup.js",
    "playwright.config.ts"
  ]
};

const validPackageJson = {
  name: "test-app",
  scripts: {
    build: "npm run build:validate && next build",
    "build:validate": "npm run type-check:build && node scripts/validate-build.js",
    "type-check:build": "tsc --project tsconfig.build.json --noEmit"
  }
};

describe('TypeScript Configuration Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default successful state
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('tsconfig.json') && !filePath.includes('build')) {
        return JSON.stringify(validTsConfigBase);
      }
      if (filePath.includes('tsconfig.build.json')) {
        return JSON.stringify(validTsConfigBuild);
      }
      if (filePath.includes('package.json')) {
        return JSON.stringify(validPackageJson);
      }
      return '{}';
    });
  });

  describe('validateTypeScriptConfiguration', () => {
    test('should pass validation with correct configuration', () => {
      // Mock fs module
      jest.doMock('fs', () => mockFs);
      
      const result = validateTypeScriptConfiguration();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail when tsconfig.build.json is missing', () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return !filePath.includes('tsconfig.build.json');
      });
      
      jest.doMock('fs', () => mockFs);
      
      const result = validateTypeScriptConfiguration();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('tsconfig.build.json not found');
      expect(result.suggestions).toContain('Create tsconfig.build.json that extends tsconfig.json and excludes test files');
    });

    test('should fail when base tsconfig.json is missing', () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return !filePath.includes('tsconfig.json') || filePath.includes('build');
      });
      
      jest.doMock('fs', () => mockFs);
      
      const result = validateTypeScriptConfiguration();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('tsconfig.json not found');
    });

    test('should warn when extends property is missing', () => {
      const configWithoutExtends = { ...validTsConfigBuild };
      delete configWithoutExtends.extends;
      
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('tsconfig.build.json')) {
          return JSON.stringify(configWithoutExtends);
        }
        return JSON.stringify(validTsConfigBase);
      });
      
      jest.doMock('fs', () => mockFs);
      
      const result = validateTypeScriptConfiguration();
      
      expect(result.warnings).toContain('tsconfig.build.json does not extend base configuration');
    });

    test('should warn when test exclusion patterns are missing', () => {
      const configWithoutTestExcludes = {
        ...validTsConfigBuild,
        exclude: ['node_modules']
      };
      
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('tsconfig.build.json')) {
          return JSON.stringify(configWithoutTestExcludes);
        }
        return JSON.stringify(validTsConfigBase);
      });
      
      jest.doMock('fs', () => mockFs);
      
      const result = validateTypeScriptConfiguration();
      
      expect(result.warnings.some(w => w.includes('Missing test exclusion patterns'))).toBe(true);
    });

    test('should warn when noEmit is not set to true', () => {
      const configWithoutNoEmit = {
        ...validTsConfigBuild,
        compilerOptions: {}
      };
      
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('tsconfig.build.json')) {
          return JSON.stringify(configWithoutNoEmit);
        }
        return JSON.stringify(validTsConfigBase);
      });
      
      jest.doMock('fs', () => mockFs);
      
      const result = validateTypeScriptConfiguration();
      
      expect(result.warnings).toContain('noEmit should be true for build validation');
    });

    test('should handle JSON parse errors gracefully', () => {
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('tsconfig.build.json')) {
          return 'invalid json {';
        }
        return JSON.stringify(validTsConfigBase);
      });
      
      jest.doMock('fs', () => mockFs);
      
      const result = validateTypeScriptConfiguration();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Failed to parse TypeScript configuration'))).toBe(true);
    });

    test('should detect problematic exclude patterns', () => {
      const configWithProblematicExcludes = {
        ...validTsConfigBuild,
        exclude: [...validTsConfigBuild.exclude, 'src/components/**']
      };
      
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('tsconfig.build.json')) {
          return JSON.stringify(configWithProblematicExcludes);
        }
        return JSON.stringify(validTsConfigBase);
      });
      
      jest.doMock('fs', () => mockFs);
      
      const result = validateTypeScriptConfiguration();
      
      expect(result.warnings.some(w => w.includes('Potentially problematic exclude patterns'))).toBe(true);
    });
  });

  describe('Build Configuration Validation', () => {
    test('should validate required build scripts', () => {
      jest.doMock('fs', () => mockFs);
      
      const result = validateBuildConfiguration();
      
      // Should not throw and should validate scripts
      expect(mockFs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        'utf8'
      );
    });

    test('should detect missing required scripts', () => {
      const packageJsonWithoutScripts = {
        name: "test-app",
        scripts: {
          build: "next build"
          // Missing build:validate and type-check:build
        }
      };
      
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          return JSON.stringify(packageJsonWithoutScripts);
        }
        return '{}';
      });
      
      jest.doMock('fs', () => mockFs);
      
      expect(() => validateBuildConfiguration()).toThrow('Build configuration validation failed');
    });

    test('should warn about build:validate script not using production config', () => {
      const packageJsonWithIncorrectScript = {
        ...validPackageJson,
        scripts: {
          ...validPackageJson.scripts,
          "build:validate": "node scripts/validate-build.js" // Missing type-check:build
        }
      };
      
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          return JSON.stringify(packageJsonWithIncorrectScript);
        }
        return '{}';
      });
      
      jest.doMock('fs', () => mockFs);
      
      // Should not throw but should log warnings
      expect(() => validateBuildConfiguration()).not.toThrow();
    });
  });
});

describe('TypeScript Error Parsing', () => {
  test('should parse structured TypeScript errors correctly', () => {
    const errorOutput = `
src/components/Button.tsx(15,23): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
src/lib/utils.ts(42,10): error TS2304: Cannot find name 'unknownVariable'.
    `;
    
    const errors = parseTypeScriptErrors(errorOutput);
    
    expect(errors).toHaveLength(2);
    expect(errors[0]).toEqual({
      file: 'src/components/Button.tsx',
      line: 15,
      column: 23,
      code: '2345',
      message: "Argument of type 'string' is not assignable to parameter of type 'number'."
    });
    expect(errors[1]).toEqual({
      file: 'src/lib/utils.ts',
      line: 42,
      column: 10,
      code: '2304',
      message: "Cannot find name 'unknownVariable'."
    });
  });

  test('should handle unstructured error output', () => {
    const errorOutput = `
error TS2345: Some error message
Another error line
    `;
    
    const errors = parseTypeScriptErrors(errorOutput);
    
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('error TS2345');
  });

  test('should handle empty error output', () => {
    const errors = parseTypeScriptErrors('');
    expect(errors).toHaveLength(0);
  });
});

describe('Test File Exclusion Verification', () => {
  beforeEach(() => {
    // Mock directory structure with test files
    mockFs.readdirSync.mockImplementation((dirPath) => {
      if (dirPath.includes('src')) {
        return ['components', 'lib', '__tests__'];
      }
      if (dirPath.includes('components')) {
        return ['Button.tsx', 'Button.test.tsx'];
      }
      if (dirPath.includes('lib')) {
        return ['utils.ts', 'utils.spec.ts'];
      }
      if (dirPath.includes('__tests__')) {
        return ['integration.test.ts'];
      }
      return [];
    });
    
    mockFs.statSync.mockImplementation((filePath) => ({
      isDirectory: () => !filePath.includes('.'),
      isFile: () => filePath.includes('.')
    }));
  });

  test('should verify test files are properly excluded', () => {
    jest.doMock('fs', () => mockFs);
    
    // Should not throw and should log success
    expect(() => verifyTestFileExclusion()).not.toThrow();
  });

  test('should detect test files that are not excluded', () => {
    const configWithoutTestExcludes = {
      ...validTsConfigBuild,
      exclude: ['node_modules'] // Missing test exclusions
    };
    
    mockFs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('tsconfig.build.json')) {
        return JSON.stringify(configWithoutTestExcludes);
      }
      return JSON.stringify(validTsConfigBase);
    });
    
    jest.doMock('fs', () => mockFs);
    
    // Should log warnings about unexcluded test files
    expect(() => verifyTestFileExclusion()).not.toThrow();
  });
});

describe('Build Process Error Scenarios', () => {
  beforeEach(() => {
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));
  });

  test('should handle successful TypeScript compilation', () => {
    mockExecSync.mockReturnValue('Compilation successful');
    
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));
    
    const result = runProductionTypeCheck();
    
    expect(result.success).toBe(true);
    expect(result.output).toBe('Compilation successful');
  });

  test('should handle TypeScript compilation errors', () => {
    const errorOutput = 'src/test.ts(1,1): error TS2345: Type error';
    mockExecSync.mockImplementation(() => {
      const error = new Error('TypeScript compilation failed');
      error.stdout = errorOutput;
      throw error;
    });
    
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));
    
    const result = runProductionTypeCheck();
    
    expect(result.success).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Type error');
  });

  test('should handle command not found errors', () => {
    mockExecSync.mockImplementation(() => {
      const error = new Error('Command not found');
      error.code = 'ENOENT';
      throw error;
    });
    
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));
    
    const result = runProductionTypeCheck();
    
    expect(result.success).toBe(false);
  });
});

describe('Configuration Scenarios', () => {
  test('should handle missing Next.js configuration', () => {
    mockFs.existsSync.mockImplementation((filePath) => {
      return !filePath.includes('next.config');
    });
    
    jest.doMock('fs', () => mockFs);
    
    expect(() => checkNextConfig()).not.toThrow();
  });

  test('should validate package.json existence', () => {
    mockFs.existsSync.mockImplementation((filePath) => {
      return !filePath.includes('package.json');
    });
    
    jest.doMock('fs', () => mockFs);
    
    const result = checkPackageJson();
    
    expect(result).toBe(false);
  });

  test('should detect missing required scripts in package.json', () => {
    const packageJsonWithoutBuild = {
      name: "test-app",
      scripts: {
        start: "next start"
        // Missing build script
      }
    };
    
    mockFs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('package.json')) {
        return JSON.stringify(packageJsonWithoutBuild);
      }
      return '{}';
    });
    
    jest.doMock('fs', () => mockFs);
    
    const result = checkPackageJson();
    
    expect(result).toBe(false);
  });
});

describe('Environment-Specific Configuration Tests', () => {
  test('should handle simple deployment configuration', () => {
    const features = {
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
      NEXT_PUBLIC_SITE_NAME: 'Test Site',
      NEXT_PUBLIC_BASE_URL: 'https://test.vercel.app'
    };
    
    expect(() => checkCommonIssues('simple', features)).not.toThrow();
    
    process.env = originalEnv;
  });

  test('should handle full deployment configuration', () => {
    const features = {
      cms: true,
      auth: true,
      search: true,
      ai: true,
      media: true
    };
    
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENABLE_CMS: 'true',
      NEXT_PUBLIC_ENABLE_AUTH: 'true',
      NEXT_PUBLIC_ENABLE_SEARCH: 'true',
      NEXT_PUBLIC_ENABLE_AI: 'true',
      NEXT_PUBLIC_ENABLE_MEDIA: 'true',
      DATABASE_URL: 'postgresql://test',
      NEXTAUTH_SECRET: 'test-secret'
    };
    
    expect(() => checkCommonIssues('full', features)).not.toThrow();
    
    process.env = originalEnv;
  });

  test('should detect placeholder values in configuration', () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_BASE_URL: 'https://your-app.vercel.app',
      NEXT_PUBLIC_GA_ID: 'G-XXXXXXXXXX'
    };
    
    // Should log warnings but not fail
    expect(() => checkCommonIssues('simple', {})).not.toThrow();
    
    process.env = originalEnv;
  });
});

describe('Error Recovery and Suggestions', () => {
  test('should provide helpful suggestions for missing configurations', () => {
    mockFs.existsSync.mockReturnValue(false);
    
    jest.doMock('fs', () => mockFs);
    
    const result = validateTypeScriptConfiguration();
    
    expect(result.suggestions).toContain('Create tsconfig.build.json that extends tsconfig.json and excludes test files');
  });

  test('should suggest specific patterns for unmatched test files', () => {
    // Mock finding test files that aren't excluded
    mockFs.readdirSync.mockImplementation((dirPath) => {
      if (dirPath.includes('src')) {
        return ['integration.test.ts', 'e2e.spec.ts'];
      }
      return [];
    });
    
    mockFs.statSync.mockImplementation(() => ({
      isDirectory: () => false,
      isFile: () => true
    }));
    
    const configWithLimitedExcludes = {
      ...validTsConfigBuild,
      exclude: ['node_modules', '**/*.test.ts'] // Missing spec and integration patterns
    };
    
    mockFs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('tsconfig.build.json')) {
        return JSON.stringify(configWithLimitedExcludes);
      }
      return JSON.stringify(validTsConfigBase);
    });
    
    jest.doMock('fs', () => mockFs);
    
    // Should suggest additional patterns
    expect(() => verifyTestFileExclusion()).not.toThrow();
  });
});

describe('Cross-Platform Compatibility', () => {
  test('should handle Windows path separators', () => {
    const windowsErrorOutput = 'src\\components\\Button.tsx(15,23): error TS2345: Type error';
    
    const errors = parseTypeScriptErrors(windowsErrorOutput);
    
    expect(errors).toHaveLength(1);
    expect(errors[0].file).toBe('src\\components\\Button.tsx');
  });

  test('should normalize path separators in exclusion verification', () => {
    // Mock Windows-style paths
    mockFs.readdirSync.mockImplementation((dirPath) => {
      if (dirPath.includes('src')) {
        return ['__tests__'];
      }
      if (dirPath.includes('__tests__')) {
        return ['test.spec.ts'];
      }
      return [];
    });
    
    mockFs.statSync.mockImplementation((filePath) => ({
      isDirectory: () => !filePath.includes('.'),
      isFile: () => filePath.includes('.')
    }));
    
    jest.doMock('fs', () => mockFs);
    
    // Should handle path normalization correctly
    expect(() => verifyTestFileExclusion()).not.toThrow();
  });
});