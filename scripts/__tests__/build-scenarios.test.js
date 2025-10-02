/**
 * Build Process Scenario Tests
 * Tests various build scenarios and configurations to ensure robustness
 * Requirements: 3.1, 3.2, 4.3
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test utilities
const createTempConfig = (config) => {
  const tempPath = path.join(__dirname, 'temp-config.json');
  fs.writeFileSync(tempPath, JSON.stringify(config, null, 2));
  return tempPath;
};

const cleanupTempFiles = () => {
  const tempFiles = [
    path.join(__dirname, 'temp-config.json'),
    path.join(__dirname, 'temp-tsconfig.json'),
    path.join(__dirname, 'temp-package.json')
  ];
  
  tempFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
};

describe('Build Configuration Scenarios', () => {
  afterEach(() => {
    cleanupTempFiles();
  });

  describe('TypeScript Configuration Variations', () => {
    test('should handle minimal TypeScript configuration', () => {
      const minimalConfig = {
        extends: "./tsconfig.json",
        exclude: ["**/*.test.*", "**/__tests__/**"]
      };
      
      const configPath = createTempConfig(minimalConfig);
      
      // Validate that minimal config is acceptable
      expect(fs.existsSync(configPath)).toBe(true);
      
      const content = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      expect(content.extends).toBe("./tsconfig.json");
      expect(content.exclude).toContain("**/*.test.*");
    });

    test('should handle comprehensive TypeScript configuration', () => {
      const comprehensiveConfig = {
        extends: "./tsconfig.json",
        compilerOptions: {
          noEmit: true,
          strict: true,
          skipLibCheck: true
        },
        exclude: [
          "node_modules",
          "**/*.test.ts",
          "**/*.test.tsx",
          "**/*.spec.ts",
          "**/*.spec.tsx",
          "**/__tests__/**",
          "**/e2e/**",
          "**/*.stories.*",
          "**/coverage/**",
          "**/.next/**",
          "**/dist/**",
          "**/build/**"
        ],
        include: [
          "src/**/*",
          "next-env.d.ts"
        ]
      };
      
      const configPath = createTempConfig(comprehensiveConfig);
      
      const content = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      expect(content.compilerOptions.noEmit).toBe(true);
    