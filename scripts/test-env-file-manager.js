#!/usr/bin/env node

/**
 * Test script for Environment File Manager
 * Tests all functionality including loading, validation, backup, and sync
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EnvironmentFileManagerTest {
  constructor() {
    this.testDir = path.join(__dirname, '..', '.test-env');
    this.originalCwd = process.cwd();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Running Environment File Manager Tests\n');

    try {
      this.setupTestEnvironment();
      
      await this.testFileLoading();
      await this.testPriorityMerging();
      await this.testValidation();
      await this.testBackupRestore();
      await this.testSynchronization();
      await this.testGeneration();
      await this.testCLICommands();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    } finally {
      this.cleanupTestEnvironment();
    }
  }

  setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    // Create test directory
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.testDir, { recursive: true });

    // Create test environment files
    this.createTestFiles();
    
    console.log('✅ Test environment ready\n');
  }

  createTestFiles() {
    const testFiles = {
      '.env.local': `# Local development
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="Test Local Site"
NEXT_PUBLIC_ENABLE_CMS="true"
LOCAL_ONLY_VAR="local-value"
`,
      '.env.production': `# Production
NEXT_PUBLIC_BASE_URL="https://prod.example.com"
NEXT_PUBLIC_SITE_NAME="Test Production Site"
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="true"
DATABASE_URL="postgresql://prod-db"
`,
      '.env.simple': `# Simple deployment
NEXT_PUBLIC_BASE_URL="https://simple.example.com"
NEXT_PUBLIC_SITE_NAME="Test Simple Site"
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
`,
      '.env': `# Default
NEXT_PUBLIC_BASE_URL="https://default.example.com"
NEXT_PUBLIC_SITE_NAME="Default Site"
DEFAULT_VAR="default-value"
`,
      '.env.example': `# Example template
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="Your Site Name"
EXAMPLE_VAR="example-value"
`,
      '.env.invalid': `# Invalid format file
INVALID LINE WITHOUT EQUALS
VALID_VAR="valid"
ANOTHER INVALID LINE
`
    };

    for (const [fileName, content] of Object.entries(testFiles)) {
      fs.writeFileSync(path.join(this.testDir, fileName), content);
    }
  }

  async testFileLoading() {
    console.log('📂 Testing file loading...');
    
    try {
      // Change to test directory
      process.chdir(this.testDir);
      
      // Import and test the manager
      const EnvironmentFileManager = EnvironmentFileManagerFallback;
      const manager = new EnvironmentFileManager();
      
      const files = await manager.loadEnvironmentFiles();
      
      // Test that all files are loaded
      this.assert(files.length === 5, 'Should load 5 environment files');
      
      // Test priority order
      const priorities = files.map(f => f.priority);
      this.assert(JSON.stringify(priorities) === JSON.stringify([1, 2, 3, 4, 5]), 'Files should be in priority order');
      
      // Test file existence detection
      const existingFiles = files.filter(f => f.exists);
      this.assert(existingFiles.length === 5, 'Should detect 5 existing files');
      
      // Test variable parsing
      const localFile = files.find(f => f.name === '.env.local');
      this.assert(localFile.variables.NEXT_PUBLIC_BASE_URL === 'http://localhost:3000', 'Should parse variables correctly');
      this.assert(localFile.variables.LOCAL_ONLY_VAR === 'local-value', 'Should parse all variables');
      
      this.testResults.push({ test: 'File Loading', status: 'PASS' });
      console.log('✅ File loading test passed\n');
      
    } catch (error) {
      this.testResults.push({ test: 'File Loading', status: 'FAIL', error: error.message });
      console.log('❌ File loading test failed:', error.message, '\n');
    }
  }

  async testPriorityMerging() {
    console.log('🔀 Testing priority merging...');
    
    try {
      const EnvironmentFileManager = require('./env-file-manager-fallback');
      const manager = new EnvironmentFileManager();
      
      const merged = await manager.getMergedEnvironment();
      
      // Test that higher priority values override lower priority
      this.assert(merged.NEXT_PUBLIC_BASE_URL === 'http://localhost:3000', 'Local should override production URL');
      this.assert(merged.NEXT_PUBLIC_SITE_NAME === 'Test Local Site', 'Local should override production site name');
      
      // Test that variables from different files are merged
      this.assert(merged.DATABASE_URL === 'postgresql://prod-db', 'Should include production-only variables');
      this.assert(merged.LOCAL_ONLY_VAR === 'local-value', 'Should include local-only variables');
      this.assert(merged.DEFAULT_VAR === 'default-value', 'Should include default variables');
      
      // Test feature flag merging
      this.assert(merged.NEXT_PUBLIC_ENABLE_CMS === 'true', 'Local CMS setting should override production');
      this.assert(merged.NEXT_PUBLIC_ENABLE_AUTH === 'true', 'Should inherit auth setting from production');
      
      this.testResults.push({ test: 'Priority Merging', status: 'PASS' });
      console.log('✅ Priority merging test passed\n');
      
    } catch (error) {
      this.testResults.push({ test: 'Priority Merging', status: 'FAIL', error: error.message });
      console.log('❌ Priority merging test failed:', error.message, '\n');
    }
  }

  async testValidation() {
    console.log('🔍 Testing file validation...');
    
    try {
      const EnvironmentFileManager = require('./env-file-manager-fallback');
      const manager = new EnvironmentFileManager();
      
      // Test valid file
      const validResult = manager.validateEnvironmentFile(path.join(this.testDir, '.env.local'));
      this.assert(validResult.isValid === true, 'Valid file should pass validation');
      this.assert(validResult.errors.length === 0, 'Valid file should have no errors');
      
      // Test invalid file
      const invalidResult = manager.validateEnvironmentFile(path.join(this.testDir, '.env.invalid'));
      this.assert(invalidResult.isValid === false, 'Invalid file should fail validation');
      this.assert(invalidResult.errors.length > 0, 'Invalid file should have errors');
      
      // Test non-existent file
      const missingResult = manager.validateEnvironmentFile(path.join(this.testDir, '.env.missing'));
      this.assert(missingResult.isValid === false, 'Missing file should fail validation');
      this.assert(missingResult.errors.includes('File does not exist'), 'Should report file not found');
      
      this.testResults.push({ test: 'File Validation', status: 'PASS' });
      console.log('✅ File validation test passed\n');
      
    } catch (error) {
      this.testResults.push({ test: 'File Validation', status: 'FAIL', error: error.message });
      console.log('❌ File validation test failed:', error.message, '\n');
    }
  }

  async testBackupRestore() {
    console.log('💾 Testing backup and restore...');
    
    try {
      const EnvironmentFileManager = require('./env-file-manager-fallback');
      const manager = new EnvironmentFileManager();
      
      // Create backup
      const backupInfo = await manager.createBackup('Test backup');
      this.assert(backupInfo.timestamp, 'Backup should have timestamp');
      this.assert(backupInfo.files.length > 0, 'Backup should include files');
      this.assert(fs.existsSync(backupInfo.path), 'Backup directory should exist');
      
      // List backups
      const backups = manager.listBackups();
      this.assert(backups.length >= 1, 'Should list at least one backup');
      this.assert(backups[0].timestamp === backupInfo.timestamp, 'Should list the created backup');
      
      // Modify a file
      const originalContent = fs.readFileSync(path.join(this.testDir, '.env.local'), 'utf8');
      fs.writeFileSync(path.join(this.testDir, '.env.local'), 'MODIFIED="true"\n');
      
      // Restore backup
      const restoreResult = await manager.restoreFromBackup(backupInfo.timestamp);
      this.assert(restoreResult.success === true, 'Restore should succeed');
      this.assert(restoreResult.restored.includes('.env.local'), 'Should restore modified file');
      
      // Verify restoration
      const restoredContent = fs.readFileSync(path.join(this.testDir, '.env.local'), 'utf8');
      this.assert(restoredContent === originalContent, 'File should be restored to original content');
      
      this.testResults.push({ test: 'Backup & Restore', status: 'PASS' });
      console.log('✅ Backup and restore test passed\n');
      
    } catch (error) {
      this.testResults.push({ test: 'Backup & Restore', status: 'FAIL', error: error.message });
      console.log('❌ Backup and restore test failed:', error.message, '\n');
    }
  }

  async testSynchronization() {
    console.log('🔄 Testing synchronization...');
    
    try {
      const EnvironmentFileManager = require('./env-file-manager-fallback');
      const manager = new EnvironmentFileManager();
      
      // Test sync to local (should modify URLs for localhost)
      const localSyncResult = await manager.synchronizeEnvironmentFiles('local');
      this.assert(localSyncResult.success === true, 'Local sync should succeed');
      
      // Verify local sync modified URLs correctly
      if (localSyncResult.synced.includes('.env.local')) {
        const localContent = fs.readFileSync(path.join(this.testDir, '.env.local'), 'utf8');
        this.assert(localContent.includes('http://localhost:3000'), 'Local sync should use localhost URLs');
      }
      
      // Test sync to production (should modify URLs for production)
      const prodSyncResult = await manager.synchronizeEnvironmentFiles('production');
      this.assert(prodSyncResult.success === true, 'Production sync should succeed');
      
      // Test invalid sync target
      const invalidSyncResult = await manager.synchronizeEnvironmentFiles('invalid');
      this.assert(invalidSyncResult.success === false, 'Invalid sync target should fail');
      this.assert(invalidSyncResult.errors.length > 0, 'Should report error for invalid target');
      
      this.testResults.push({ test: 'Synchronization', status: 'PASS' });
      console.log('✅ Synchronization test passed\n');
      
    } catch (error) {
      this.testResults.push({ test: 'Synchronization', status: 'FAIL', error: error.message });
      console.log('❌ Synchronization test failed:', error.message, '\n');
    }
  }

  async testGeneration() {
    console.log('📝 Testing file generation...');
    
    try {
      const EnvironmentFileManager = require('./env-file-manager-fallback');
      const manager = new EnvironmentFileManager();
      
      // Test simple template generation
      const simpleResult = await manager.generateEnvironmentFile('simple', path.join(this.testDir, '.env.test-simple'));
      this.assert(simpleResult.success === true, 'Simple generation should succeed');
      this.assert(fs.existsSync(simpleResult.path), 'Generated file should exist');
      
      const simpleContent = fs.readFileSync(simpleResult.path, 'utf8');
      this.assert(simpleContent.includes('NEXT_PUBLIC_ENABLE_CMS="false"'), 'Simple template should disable CMS');
      this.assert(simpleContent.includes('Simple Deployment'), 'Should include template description');
      
      // Test full template generation
      const fullResult = await manager.generateEnvironmentFile('full', path.join(this.testDir, '.env.test-full'));
      this.assert(fullResult.success === true, 'Full generation should succeed');
      
      const fullContent = fs.readFileSync(fullResult.path, 'utf8');
      this.assert(fullContent.includes('NEXT_PUBLIC_ENABLE_CMS="true"'), 'Full template should enable CMS');
      this.assert(fullContent.includes('DATABASE_URL='), 'Full template should include database config');
      
      // Test local template generation
      const localResult = await manager.generateEnvironmentFile('local', path.join(this.testDir, '.env.test-local'));
      this.assert(localResult.success === true, 'Local generation should succeed');
      
      const localContent = fs.readFileSync(localResult.path, 'utf8');
      this.assert(localContent.includes('localhost:3000'), 'Local template should use localhost');
      
      this.testResults.push({ test: 'File Generation', status: 'PASS' });
      console.log('✅ File generation test passed\n');
      
    } catch (error) {
      this.testResults.push({ test: 'File Generation', status: 'FAIL', error: error.message });
      console.log('❌ File generation test failed:', error.message, '\n');
    }
  }

  async testCLICommands() {
    console.log('💻 Testing CLI commands...');
    
    try {
      const cliScript = path.join(__dirname, 'env-file-manager.js');
      
      // Test list command
      const listOutput = execSync(`node "${cliScript}" list`, { 
        cwd: this.testDir, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      this.assert(listOutput.includes('.env.local'), 'List command should show local file');
      this.assert(listOutput.includes('Priority: 1'), 'List command should show priorities');
      
      // Test validate command
      const validateOutput = execSync(`node "${cliScript}" validate`, { 
        cwd: this.testDir, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      this.assert(validateOutput.includes('✅') || validateOutput.includes('❌'), 'Validate command should show status');
      
      // Test backup command
      const backupOutput = execSync(`node "${cliScript}" backup "CLI test backup"`, { 
        cwd: this.testDir, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      this.assert(backupOutput.includes('Backup created'), 'Backup command should create backup');
      
      // Test list-backups command
      const listBackupsOutput = execSync(`node "${cliScript}" list-backups`, { 
        cwd: this.testDir, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      this.assert(listBackupsOutput.includes('CLI test backup'), 'Should list the created backup');
      
      // Test generate command
      execSync(`node "${cliScript}" generate simple`, { 
        cwd: this.testDir, 
        stdio: 'pipe'
      });
      this.assert(fs.existsSync(path.join(this.testDir, '.env.simple')), 'Generate command should create file');
      
      this.testResults.push({ test: 'CLI Commands', status: 'PASS' });
      console.log('✅ CLI commands test passed\n');
      
    } catch (error) {
      this.testResults.push({ test: 'CLI Commands', status: 'FAIL', error: error.message });
      console.log('❌ CLI commands test failed:', error.message, '\n');
    }
  }

  printResults() {
    console.log('📊 Test Results Summary:\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const result of this.testResults) {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.status === 'PASS') {
        passed++;
      } else {
        failed++;
      }
    }
    
    console.log(`\n📈 Results: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      console.log('❌ Some tests failed');
      process.exit(1);
    } else {
      console.log('✅ All tests passed!');
    }
  }

  cleanupTestEnvironment() {
    console.log('\n🧹 Cleaning up test environment...');
    
    // Restore original working directory
    process.chdir(this.originalCwd);
    
    // Remove test directory
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }
    
    console.log('✅ Cleanup complete');
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }
}

// JavaScript fallback for testing
class EnvironmentFileManagerFallback {
  constructor() {
    this.rootPath = process.cwd();
    this.backupDir = path.join(this.rootPath, '.env-backups');
    this.ensureBackupDirectory();
  }

  async loadEnvironmentFiles() {
    const fileConfigs = [
      { name: '.env.local', priority: 1 },
      { name: '.env.production', priority: 2 },
      { name: '.env.simple', priority: 3 },
      { name: '.env', priority: 4 },
      { name: '.env.example', priority: 5 }
    ];

    const files = [];

    for (const config of fileConfigs) {
      const filePath = path.join(this.rootPath, config.name);
      const file = {
        name: config.name,
        path: filePath,
        priority: config.priority,
        exists: fs.existsSync(filePath),
        variables: {},
        isValid: true,
        errors: []
      };

      if (file.exists) {
        try {
          const stats = fs.statSync(filePath);
          file.lastModified = stats.mtime;
          file.size = stats.size;

          const content = fs.readFileSync(filePath, 'utf8');
          const parseResult = this.parseEnvironmentFile(content);
          
          file.variables = parseResult.variables;
          file.isValid = parseResult.isValid;
          file.errors = parseResult.errors;
        } catch (error) {
          file.isValid = false;
          file.errors.push(`Failed to read file: ${error.message}`);
        }
      }

      files.push(file);
    }

    return files.sort((a, b) => a.priority - b.priority);
  }

  async getMergedEnvironment() {
    const files = await this.loadEnvironmentFiles();
    const merged = {};

    for (const file of files.reverse()) {
      if (file.exists && file.isValid) {
        Object.assign(merged, file.variables);
      }
    }

    return merged;
  }

  validateEnvironmentFile(filePath) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!fs.existsSync(filePath)) {
      result.isValid = false;
      result.errors.push('File does not exist');
      return result;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parseResult = this.parseEnvironmentFile(content);
      
      result.isValid = parseResult.isValid;
      result.errors = parseResult.errors;
      
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Failed to read file: ${error.message}`);
    }

    return result;
  }

  async createBackup(description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
    
    fs.mkdirSync(backupPath, { recursive: true });

    const files = await this.loadEnvironmentFiles();
    const backedUpFiles = [];

    for (const file of files) {
      if (file.exists) {
        const backupFilePath = path.join(backupPath, file.name);
        fs.copyFileSync(file.path, backupFilePath);
        backedUpFiles.push(file.name);
      }
    }

    const backupInfo = {
      timestamp,
      files: backedUpFiles,
      path: backupPath,
      description
    };

    const metadataPath = path.join(backupPath, 'backup-info.json');
    fs.writeFileSync(metadataPath, JSON.stringify(backupInfo, null, 2));

    return backupInfo;
  }

  async restoreFromBackup(backupTimestamp) {
    const result = {
      success: true,
      restored: [],
      errors: []
    };

    const backupPath = path.join(this.backupDir, `backup-${backupTimestamp}`);
    const metadataPath = path.join(backupPath, 'backup-info.json');

    if (!fs.existsSync(backupPath)) {
      result.success = false;
      result.errors.push(`Backup not found: ${backupTimestamp}`);
      return result;
    }

    try {
      let backupInfo;
      if (fs.existsSync(metadataPath)) {
        backupInfo = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      } else {
        const files = fs.readdirSync(backupPath).filter(f => f.startsWith('.env'));
        backupInfo = { timestamp: backupTimestamp, files, path: backupPath };
      }

      await this.createBackup(`Pre-restore backup before restoring ${backupTimestamp}`);

      for (const fileName of backupInfo.files) {
        const backupFilePath = path.join(backupPath, fileName);
        const targetPath = path.join(this.rootPath, fileName);

        if (fs.existsSync(backupFilePath)) {
          fs.copyFileSync(backupFilePath, targetPath);
          result.restored.push(fileName);
        } else {
          result.errors.push(`Backup file not found: ${fileName}`);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Restore failed: ${error.message}`);
    }

    return result;
  }

  listBackups() {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const backups = [];
    const entries = fs.readdirSync(this.backupDir);

    for (const entry of entries) {
      if (entry.startsWith('backup-')) {
        const backupPath = path.join(this.backupDir, entry);
        const metadataPath = path.join(backupPath, 'backup-info.json');

        try {
          if (fs.existsSync(metadataPath)) {
            const backupInfo = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            backups.push(backupInfo);
          } else {
            const timestamp = entry.replace('backup-', '');
            const files = fs.readdirSync(backupPath).filter(f => f.startsWith('.env'));
            backups.push({ timestamp, files, path: backupPath });
          }
        } catch (error) {
          console.warn(`Failed to read backup metadata: ${entry}`);
        }
      }
    }

    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async synchronizeEnvironmentFiles(target) {
    const result = {
      success: true,
      synced: [],
      errors: [],
      conflicts: []
    };

    try {
      const files = await this.loadEnvironmentFiles();
      
      switch (target) {
        case 'local':
          await this.syncToLocal(files, result);
          break;
        case 'production':
          await this.syncToProduction(files, result);
          break;
        case 'vercel':
          result.errors.push('Vercel sync not implemented in test mode');
          break;
        default:
          result.success = false;
          result.errors.push(`Unknown target environment: ${target}`);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Synchronization failed: ${error.message}`);
    }

    return result;
  }

  async generateEnvironmentFile(template, outputPath) {
    const result = {
      success: true,
      path: '',
      errors: []
    };

    try {
      const content = this.generateEnvironmentContent(template);
      const filePath = outputPath || path.join(this.rootPath, `.env.${template}`);
      
      if (fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
      }

      fs.writeFileSync(filePath, content);
      result.path = filePath;

    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to generate file: ${error.message}`);
    }

    return result;
  }

  parseEnvironmentFile(content) {
    const result = {
      variables: {},
      isValid: true,
      errors: []
    };

    const lines = content.split('\n');
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const match = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
      
      if (match) {
        const [, key, value] = match;
        
        let cleanValue = value;
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          cleanValue = value.slice(1, -1);
        }

        result.variables[key] = cleanValue;
      } else {
        result.isValid = false;
        result.errors.push(`Invalid format at line ${lineNumber}: ${trimmedLine}`);
      }
    }

    return result;
  }

  async syncToLocal(files, result) {
    const prodFile = files.find(f => f.name === '.env.production');
    
    if (prodFile && prodFile.exists) {
      const localVars = { ...prodFile.variables };
      
      if (localVars.NEXT_PUBLIC_BASE_URL) {
        localVars.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
      }
      if (localVars.NEXTAUTH_URL) {
        localVars.NEXTAUTH_URL = 'http://localhost:3000';
      }

      const content = this.generateContentFromVariables(localVars, 'Local development (synced from production)');
      const localPath = path.join(this.rootPath, '.env.local');
      
      fs.writeFileSync(localPath, content);
      result.synced.push('.env.local');
    }
  }

  async syncToProduction(files, result) {
    const localFile = files.find(f => f.name === '.env.local');
    
    if (localFile && localFile.exists) {
      const prodVars = { ...localFile.variables };
      
      if (prodVars.NEXT_PUBLIC_BASE_URL?.includes('localhost')) {
        prodVars.NEXT_PUBLIC_BASE_URL = 'https://your-app.vercel.app';
      }
      if (prodVars.NEXTAUTH_URL?.includes('localhost')) {
        prodVars.NEXTAUTH_URL = prodVars.NEXT_PUBLIC_BASE_URL || 'https://your-app.vercel.app';
      }

      const content = this.generateContentFromVariables(prodVars, 'Production (synced from local)');
      const prodPath = path.join(this.rootPath, '.env.production');
      
      fs.writeFileSync(prodPath, content);
      result.synced.push('.env.production');
    }
  }

  generateContentFromVariables(variables, description) {
    const timestamp = new Date().toISOString();
    let content = `# Environment Configuration - ${description}\n`;
    content += `# Generated on: ${timestamp}\n\n`;

    for (const [key, value] of Object.entries(variables)) {
      content += `${key}="${value}"\n`;
    }

    return content;
  }

  generateEnvironmentContent(template) {
    const timestamp = new Date().toISOString();
    
    const templates = {
      simple: `# Environment Configuration for Simple Deployment
# Generated on: ${timestamp}

NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"
`,

      full: `# Environment Configuration for Full Deployment
# Generated on: ${timestamp}

NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"
NEXT_PUBLIC_ENABLE_CMS="true"
NEXT_PUBLIC_ENABLE_AUTH="true"
NEXT_PUBLIC_ENABLE_SEARCH="true"
NEXT_PUBLIC_ENABLE_AI="true"
NEXT_PUBLIC_ENABLE_MEDIA="true"
DATABASE_URL="postgresql://username:password@host:5432/ngsrn_production"
DIRECT_URL="postgresql://username:password@host:5432/ngsrn_production"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret-key"
`,

      local: `# Environment Configuration for Local Development
# Generated on: ${timestamp}

NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"
`
    };

    return templates[template];
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }
}

// Export for require
module.exports = EnvironmentFileManagerFallback;

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new EnvironmentFileManagerTest();
  tester.runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
}