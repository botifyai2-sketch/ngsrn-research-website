/**
 * Mock Test Environment Setup
 * Creates temporary configurations and files for testing build scenarios
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class MockTestEnvironment {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.tempDir = path.join(os.tmpdir(), 'build-config-test-env');
    this.mockFiles = new Map();
    this.originalFiles = new Map();
  }

  // Setup mock environment
  async setup() {
    // Create temp directory
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    console.log(`🔧 Mock test environment created at: ${this.tempDir}`);
  }

  // Create mock TypeScript configuration files
  createMockTypeScriptConfigs(scenario) {
    const configs = this.getConfigScenarios()[scenario];
    
    if (!configs) {
      throw new Error(`Unknown scenario: ${scenario}`);
    }

    // Create mock tsconfig.json
    if (configs.base) {
      const baseConfigPath = path.join(this.tempDir, 'tsconfig.json');
      fs.writeFileSync(baseConfigPath, JSON.stringify(configs.base, null, 2));
      this.mockFiles.set('tsconfig.json', baseConfigPath);
    }

    // Create mock tsconfig.build.json
    if (configs.build) {
      const buildConfigPath = path.join(this.tempDir, 'tsconfig.build.json');
      fs.writeFileSync(buildConfigPath, JSON.stringify(configs.build, null, 2));
      this.mockFiles.set('tsconfig.build.json', buildConfigPath);
    }

    return {
      baseConfig: this.mockFiles.get('tsconfig.json'),
      buildConfig: this.mockFiles.get('tsconfig.build.json')
    };
  }

  // Get predefined configuration scenarios
  getConfigScenarios() {
    return {
      // Valid production-ready configuration
      valid: {
        base: {
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
        },
        build: {
          extends: "./tsconfig.json",
          compilerOptions: { noEmit: true },
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
        }
      },

      // Missing build configuration
      missingBuild: {
        base: {
          compilerOptions: {
            target: "ES2017",
            lib: ["dom", "esnext"],
            allowJs: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            jsx: "preserve"
          },
          include: ["**/*.ts", "**/*.tsx"],
          exclude: ["node_modules"]
        }
        // No build config - should trigger error
      },

      // Invalid JSON syntax
      invalidJson: {
        base: `{
          "compilerOptions": {
            "target": "ES2017",
            "jsx": "preserve"
          },
          "include": ["**/*.ts"]
          // Missing comma - invalid JSON
        }`,
        build: {
          extends: "./tsconfig.json",
          exclude: ["**/*.test.*"]
        }
      },

      // Missing test exclusions
      noTestExclusions: {
        base: {
          compilerOptions: {
            target: "ES2017",
            jsx: "preserve",
            moduleResolution: "bundler"
          },
          include: ["**/*.ts", "**/*.tsx"]
        },
        build: {
          extends: "./tsconfig.json",
          exclude: ["node_modules"] // Missing test exclusions
        }
      },

      // Overly broad exclusions
      overlyBroad: {
        base: {
          compilerOptions: {
            target: "ES2017",
            jsx: "preserve"
          },
          include: ["**/*.ts", "**/*.tsx"]
        },
        build: {
          extends: "./tsconfig.json",
          exclude: [
            "src/**", // Too broad - excludes all source code
            "**/*.test.*"
          ]
        }
      },

      // Conflicting compiler options
      conflictingOptions: {
        base: {
          compilerOptions: {
            target: "ES2017",
            jsx: "preserve",
            strict: true,
            moduleResolution: "bundler"
          }
        },
        build: {
          extends: "./tsconfig.json",
          compilerOptions: {
            target: "ES2015", // Conflicts with base
            jsx: "react", // Conflicts with base
            strict: false // Conflicts with base
          },
          exclude: ["**/*.test.*"]
        }
      },

      // Missing Next.js configuration
      missingNextJs: {
        base: {
          compilerOptions: {
            target: "ES2017",
            lib: ["dom", "esnext"],
            allowJs: true,
            strict: true
            // Missing Next.js specific options
          },
          include: ["**/*.ts", "**/*.tsx"]
        },
        build: {
          extends: "./tsconfig.json",
          exclude: ["**/*.test.*"]
        }
      },

      // Minimal valid configuration
      minimal: {
        base: {
          compilerOptions: {
            jsx: "preserve",
            moduleResolution: "bundler",
            esModuleInterop: true,
            allowJs: true
          },
          include: ["**/*.ts", "**/*.tsx"]
        },
        build: {
          extends: "./tsconfig.json",
          exclude: ["**/*.test.*", "**/*.spec.*"]
        }
      }
    };
  }

  // Create mock test files
  createMockTestFiles() {
    const testFiles = [
      {
        path: 'src/components/Button.test.tsx',
        content: `
import { render } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Test</Button>);
  });
});`
      },
      {
        path: 'src/lib/utils.spec.ts',
        content: `
import { formatDate } from './utils';

describe('utils', () => {
  it('formats date correctly', () => {
    expect(formatDate(new Date())).toBeDefined();
  });
});`
      },
      {
        path: 'src/__tests__/helper.ts',
        content: `
export const mockData = {
  user: { id: 1, name: 'Test User' }
};`
      },
      {
        path: 'e2e/homepage.spec.ts',
        content: `
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Home/);
});`
      },
      {
        path: 'src/components/Button.tsx',
        content: `
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button({ children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}`
      },
      {
        path: 'src/lib/utils.ts',
        content: `
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}`
      }
    ];

    testFiles.forEach(file => {
      const fullPath = path.join(this.tempDir, file.path);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, file.content);
      this.mockFiles.set(file.path, fullPath);
    });

    return testFiles.map(file => file.path);
  }

  // Create mock package.json
  createMockPackageJson(scenario = 'valid') {
    const packageJsons = {
      valid: {
        name: "test-project",
        version: "1.0.0",
        scripts: {
          build: "npm run build:validate && next build",
          "build:validate": "npm run type-check:build && node scripts/validate-build.js",
          "type-check": "tsc --noEmit",
          "type-check:build": "tsc --project tsconfig.build.json --noEmit"
        },
        dependencies: {
          next: "^15.0.0",
          react: "^19.0.0",
          typescript: "^5.0.0"
        }
      },
      missingScripts: {
        name: "test-project",
        version: "1.0.0",
        scripts: {
          build: "next build"
          // Missing build:validate and type-check:build
        },
        dependencies: {
          next: "^15.0.0",
          react: "^19.0.0"
        }
      },
      invalidBuildScript: {
        name: "test-project",
        version: "1.0.0",
        scripts: {
          build: "next build", // Missing validation step
          "build:validate": "echo 'no validation'",
          "type-check:build": "tsc --noEmit" // Wrong config
        }
      }
    };

    const packageJson = packageJsons[scenario] || packageJsons.valid;
    const packageJsonPath = path.join(this.tempDir, 'package.json');
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    this.mockFiles.set('package.json', packageJsonPath);
    
    return packageJsonPath;
  }

  // Create mock files with TypeScript errors
  createMockErrorFiles() {
    const errorFiles = [
      {
        path: 'src/components/ErrorComponent.tsx',
        content: `
// This file contains intentional TypeScript errors
import React from 'react';

interface Props {
  title: string;
  count: number;
}

export default function ErrorComponent({ title, count }: Props) {
  // Error: string is not assignable to number
  const result: number = title;
  
  // Error: undefined variable
  console.log(undefinedVariable);
  
  // Error: missing return type annotation
  const badFunction = (x) => {
    return x.nonExistentProperty;
  };
  
  return <div>{title} - {count}</div>;
}`
      },
      {
        path: 'src/lib/errorUtils.ts',
        content: `
// More TypeScript errors
export function processData(data: string[]): number {
  // Error: string[] is not assignable to number
  return data;
}

// Error: missing type annotations
export const badVariable = someUndefinedFunction();

// Error: incorrect interface usage
interface User {
  id: number;
  name: string;
}

export function createUser(): User {
  // Error: missing required properties
  return { id: "not a number" };
}`
      }
    ];

    errorFiles.forEach(file => {
      const fullPath = path.join(this.tempDir, file.path);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, file.content);
      this.mockFiles.set(file.path, fullPath);
    });

    return errorFiles.map(file => file.path);
  }

  // Temporarily replace project files with mock files
  async replaceProjectFiles(filesToReplace) {
    for (const fileName of filesToReplace) {
      const projectFilePath = path.join(this.projectRoot, fileName);
      const mockFilePath = this.mockFiles.get(fileName);
      
      if (!mockFilePath) {
        throw new Error(`Mock file not found: ${fileName}`);
      }

      // Backup original file if it exists
      if (fs.existsSync(projectFilePath)) {
        const backupPath = projectFilePath + '.backup';
        fs.copyFileSync(projectFilePath, backupPath);
        this.originalFiles.set(fileName, backupPath);
      }

      // Copy mock file to project location
      fs.copyFileSync(mockFilePath, projectFilePath);
    }
  }

  // Restore original project files
  async restoreProjectFiles() {
    for (const [fileName, backupPath] of this.originalFiles) {
      const projectFilePath = path.join(this.projectRoot, fileName);
      
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, projectFilePath);
        fs.unlinkSync(backupPath);
      } else {
        // File didn't exist originally, remove it
        if (fs.existsSync(projectFilePath)) {
          fs.unlinkSync(projectFilePath);
        }
      }
    }
    
    this.originalFiles.clear();
  }

  // Get list of created mock files
  getMockFiles() {
    return Array.from(this.mockFiles.keys());
  }

  // Get mock file path
  getMockFilePath(fileName) {
    return this.mockFiles.get(fileName);
  }

  // Test scenario runner
  async runScenario(scenarioName, testFunction) {
    console.log(`🎭 Running scenario: ${scenarioName}`);
    
    try {
      // Setup scenario
      const configs = this.createMockTypeScriptConfigs(scenarioName);
      const testFiles = this.createMockTestFiles();
      const packageJson = this.createMockPackageJson();
      
      // Replace project files temporarily
      const filesToReplace = ['tsconfig.json', 'tsconfig.build.json', 'package.json'];
      await this.replaceProjectFiles(filesToReplace);
      
      // Run test function
      const result = await testFunction({
        configs,
        testFiles,
        packageJson,
        tempDir: this.tempDir
      });
      
      console.log(`✅ Scenario ${scenarioName} completed`);
      return result;
      
    } catch (error) {
      console.error(`❌ Scenario ${scenarioName} failed: ${error.message}`);
      throw error;
    } finally {
      // Always restore original files
      await this.restoreProjectFiles();
    }
  }

  // Cleanup mock environment
  async cleanup() {
    // Restore any replaced files
    await this.restoreProjectFiles();
    
    // Remove temp directory
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
    
    this.mockFiles.clear();
    console.log('🧹 Mock test environment cleaned up');
  }

  // Create performance test files
  createPerformanceTestFiles(fileCount = 100) {
    const files = [];
    
    for (let i = 0; i < fileCount; i++) {
      const isTestFile = i % 3 === 0; // Every 3rd file is a test file
      const fileName = isTestFile 
        ? `src/components/Component${i}.test.tsx`
        : `src/components/Component${i}.tsx`;
      
      const content = isTestFile 
        ? `
import { render } from '@testing-library/react';
import Component${i} from './Component${i}';

describe('Component${i}', () => {
  it('renders', () => {
    render(<Component${i} />);
  });
});`
        : `
import React from 'react';

interface Component${i}Props {
  id: number;
  name: string;
}

export default function Component${i}({ id, name }: Component${i}Props) {
  return <div data-testid="component-${i}">{name} - {id}</div>;
}`;

      const fullPath = path.join(this.tempDir, fileName);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content);
      files.push(fileName);
    }
    
    return files;
  }
}

module.exports = MockTestEnvironment;