#!/usr/bin/env node

/**
 * Environment File Management CLI
 * Command-line interface for managing environment files with priority, validation, backup, and sync
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// JavaScript fallback implementation
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
          result.errors.push('Vercel sync not implemented in fallback mode');
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

    const categories = {
      'Basic Configuration': ['NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_SITE_NAME'],
      'Feature Flags': Object.keys(variables).filter(k => k.startsWith('NEXT_PUBLIC_ENABLE_')),
      'Database': ['DATABASE_URL', 'DIRECT_URL'],
      'Authentication': ['NEXTAUTH_URL', 'NEXTAUTH_SECRET'],
      'Analytics': ['NEXT_PUBLIC_GA_ID', 'NEXT_PUBLIC_HOTJAR_ID'],
      'Other': []
    };

    const categorizedKeys = new Set(Object.values(categories).flat());
    for (const key of Object.keys(variables)) {
      if (!categorizedKeys.has(key)) {
        categories.Other.push(key);
      }
    }

    for (const [category, keys] of Object.entries(categories)) {
      const categoryVars = keys.filter(key => variables[key] !== undefined);
      if (categoryVars.length > 0) {
        content += `# ${category}\n`;
        for (const key of categoryVars) {
          content += `${key}="${variables[key]}"\n`;
        }
        content += '\n';
      }
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

// Use the appropriate implementation
let EnvironmentFileManager;
try {
  // Try to import the compiled version
  const { EnvironmentFileManager: Manager } = require('../src/lib/env-file-manager');
  EnvironmentFileManager = Manager;
} catch (error) {
  // Fallback: use the JavaScript implementation
  console.log('⚠️  TypeScript module not available, using JavaScript fallback');
  EnvironmentFileManager = EnvironmentFileManagerFallback;
}

/**
 * CLI Commands
 */
class EnvironmentFileCLI {
  constructor() {
    this.manager = new EnvironmentFileManager();
  }

  async run() {
    const command = process.argv[2];
    const args = process.argv.slice(3);

    try {
      switch (command) {
        case 'list':
          await this.listFiles();
          break;
        case 'validate':
          await this.validateFiles(args[0]);
          break;
        case 'merge':
          await this.showMergedEnvironment();
          break;
        case 'backup':
          await this.createBackup(args[0]);
          break;
        case 'restore':
          await this.restoreBackup(args[0]);
          break;
        case 'list-backups':
          await this.listBackups();
          break;
        case 'sync':
          await this.syncEnvironment(args[0]);
          break;
        case 'generate':
          await this.generateFile(args[0], args[1]);
          break;
        case 'priority':
          await this.showPriority();
          break;
        case 'check-conflicts':
          await this.checkConflicts();
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  async listFiles() {
    console.log('📋 Environment Files Status:\n');
    
    const files = await this.manager.loadEnvironmentFiles();
    
    for (const file of files) {
      const status = file.exists ? '✅' : '❌';
      const priority = `Priority: ${file.priority}`;
      const size = file.size ? `(${Math.round(file.size / 1024)}KB)` : '';
      const modified = file.lastModified ? `Modified: ${file.lastModified.toLocaleDateString()}` : '';
      const errors = file.errors.length > 0 ? `⚠️  ${file.errors.length} errors` : '';
      
      console.log(`${status} ${file.name} - ${priority} ${size}`);
      if (file.exists) {
        console.log(`   ${modified}`);
        console.log(`   Variables: ${Object.keys(file.variables).length}`);
        if (errors) {
          console.log(`   ${errors}`);
        }
      }
      console.log('');
    }
  }

  async validateFiles(fileName) {
    if (fileName) {
      // Validate specific file
      console.log(`🔍 Validating ${fileName}...\n`);
      
      const filePath = path.join(process.cwd(), fileName);
      const result = this.manager.validateEnvironmentFile(filePath);
      
      if (result.isValid) {
        console.log('✅ File is valid');
      } else {
        console.log('❌ File has errors:');
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
      
      if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
    } else {
      // Validate all files
      console.log('🔍 Validating all environment files...\n');
      
      const files = await this.manager.loadEnvironmentFiles();
      let hasErrors = false;
      
      for (const file of files) {
        if (file.exists) {
          const status = file.isValid ? '✅' : '❌';
          console.log(`${status} ${file.name}`);
          
          if (!file.isValid) {
            hasErrors = true;
            file.errors.forEach(error => console.log(`   - ${error}`));
          }
        }
      }
      
      if (hasErrors) {
        console.log('\n💡 Run with specific file name to see detailed validation');
        process.exit(1);
      } else {
        console.log('\n✅ All files are valid');
      }
    }
  }

  async showMergedEnvironment() {
    console.log('🔀 Merged Environment Variables (with priority):\n');
    
    const merged = await this.manager.getMergedEnvironment();
    const files = await this.manager.loadEnvironmentFiles();
    
    // Show which file each variable comes from
    const variableSources = {};
    
    for (const file of files.reverse()) { // Reverse to show highest priority first
      if (file.exists && file.isValid) {
        for (const [key, value] of Object.entries(file.variables)) {
          if (!variableSources[key]) {
            variableSources[key] = file.name;
          }
        }
      }
    }
    
    const sortedKeys = Object.keys(merged).sort();
    
    for (const key of sortedKeys) {
      const value = merged[key];
      const source = variableSources[key] || 'unknown';
      const displayValue = value.length > 50 ? value.substring(0, 47) + '...' : value;
      
      console.log(`${key}="${displayValue}"`);
      console.log(`   Source: ${source}\n`);
    }
    
    console.log(`Total variables: ${sortedKeys.length}`);
  }

  async createBackup(description) {
    console.log('💾 Creating environment files backup...\n');
    
    const backupInfo = await this.manager.createBackup(description);
    
    console.log('✅ Backup created successfully:');
    console.log(`   Timestamp: ${backupInfo.timestamp}`);
    console.log(`   Path: ${backupInfo.path}`);
    console.log(`   Files: ${backupInfo.files.join(', ')}`);
    if (backupInfo.description) {
      console.log(`   Description: ${backupInfo.description}`);
    }
  }

  async restoreBackup(timestamp) {
    if (!timestamp) {
      console.log('❌ Please provide backup timestamp');
      console.log('💡 Use "list-backups" to see available backups');
      return;
    }
    
    console.log(`🔄 Restoring backup: ${timestamp}...\n`);
    
    const result = await this.manager.restoreFromBackup(timestamp);
    
    if (result.success) {
      console.log('✅ Backup restored successfully:');
      console.log(`   Restored files: ${result.restored.join(', ')}`);
    } else {
      console.log('❌ Restore failed:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors during restore:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
  }

  async listBackups() {
    console.log('📦 Available Backups:\n');
    
    const backups = this.manager.listBackups();
    
    if (backups.length === 0) {
      console.log('No backups found');
      return;
    }
    
    for (const backup of backups) {
      const date = new Date(backup.timestamp).toLocaleString();
      console.log(`📅 ${backup.timestamp}`);
      console.log(`   Date: ${date}`);
      console.log(`   Files: ${backup.files.join(', ')}`);
      if (backup.description) {
        console.log(`   Description: ${backup.description}`);
      }
      console.log('');
    }
    
    console.log(`Total backups: ${backups.length}`);
  }

  async syncEnvironment(target) {
    if (!target) {
      console.log('❌ Please specify sync target: local, production, or vercel');
      return;
    }
    
    if (!['local', 'production', 'vercel'].includes(target)) {
      console.log('❌ Invalid sync target. Use: local, production, or vercel');
      return;
    }
    
    console.log(`🔄 Synchronizing environment to ${target}...\n`);
    
    const result = await this.manager.synchronizeEnvironmentFiles(target);
    
    if (result.success) {
      console.log('✅ Synchronization completed:');
      if (result.synced.length > 0) {
        console.log(`   Synced: ${result.synced.join(', ')}`);
      }
    } else {
      console.log('❌ Synchronization failed');
    }
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (result.conflicts.length > 0) {
      console.log('\n⚠️  Conflicts detected:');
      result.conflicts.forEach(conflict => console.log(`   - ${conflict}`));
    }
  }

  async generateFile(template, outputPath) {
    if (!template) {
      console.log('❌ Please specify template: simple, full, or local');
      return;
    }
    
    if (!['simple', 'full', 'local'].includes(template)) {
      console.log('❌ Invalid template. Use: simple, full, or local');
      return;
    }
    
    console.log(`📝 Generating ${template} environment file...\n`);
    
    const result = await this.manager.generateEnvironmentFile(template, outputPath);
    
    if (result.success) {
      console.log('✅ Environment file generated:');
      console.log(`   Path: ${result.path}`);
      console.log('   Remember to update placeholder values with your actual configuration');
    } else {
      console.log('❌ Generation failed:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
  }

  async showPriority() {
    console.log('📊 Environment File Priority Order:\n');
    
    const files = await this.manager.loadEnvironmentFiles();
    
    console.log('Priority order (1 = highest priority):');
    for (const file of files) {
      const status = file.exists ? '✅' : '❌';
      const description = this.getFileDescription(file.name);
      
      console.log(`${file.priority}. ${status} ${file.name}`);
      console.log(`   ${description}`);
      if (file.exists) {
        console.log(`   Variables: ${Object.keys(file.variables).length}`);
      }
      console.log('');
    }
    
    console.log('💡 Variables in higher priority files override those in lower priority files');
  }

  async checkConflicts() {
    console.log('🔍 Checking for environment variable conflicts...\n');
    
    const files = await this.manager.loadEnvironmentFiles();
    const conflicts = {};
    const allVariables = {};
    
    // Collect all variables and their sources
    for (const file of files) {
      if (file.exists && file.isValid) {
        for (const [key, value] of Object.entries(file.variables)) {
          if (!allVariables[key]) {
            allVariables[key] = [];
          }
          allVariables[key].push({
            file: file.name,
            value,
            priority: file.priority
          });
        }
      }
    }
    
    // Find conflicts (same variable with different values)
    for (const [key, sources] of Object.entries(allVariables)) {
      if (sources.length > 1) {
        const uniqueValues = [...new Set(sources.map(s => s.value))];
        if (uniqueValues.length > 1) {
          conflicts[key] = sources;
        }
      }
    }
    
    if (Object.keys(conflicts).length === 0) {
      console.log('✅ No conflicts found');
      return;
    }
    
    console.log('⚠️  Variable conflicts detected:\n');
    
    for (const [key, sources] of Object.entries(conflicts)) {
      console.log(`🔥 ${key}:`);
      
      // Sort by priority
      sources.sort((a, b) => a.priority - b.priority);
      
      for (const source of sources) {
        const winner = source.priority === sources[0].priority ? '👑' : '  ';
        const displayValue = source.value.length > 40 ? source.value.substring(0, 37) + '...' : source.value;
        
        console.log(`   ${winner} ${source.file} (priority ${source.priority}): "${displayValue}"`);
      }
      
      console.log(`   → Final value: "${sources[0].value}"\n`);
    }
    
    console.log(`Total conflicts: ${Object.keys(conflicts).length}`);
    console.log('💡 Higher priority files (lower numbers) take precedence');
  }

  getFileDescription(fileName) {
    const descriptions = {
      '.env.local': 'Local development overrides (highest priority)',
      '.env.production': 'Production environment configuration',
      '.env.simple': 'Simple deployment configuration',
      '.env': 'Default environment configuration',
      '.env.example': 'Example environment template (lowest priority)'
    };
    
    return descriptions[fileName] || 'Environment configuration file';
  }

  showHelp() {
    console.log('🛠️  Environment File Manager CLI\n');
    console.log('Usage: node scripts/env-file-manager.js <command> [options]\n');
    console.log('Commands:');
    console.log('  list                    - List all environment files and their status');
    console.log('  validate [file]         - Validate environment file(s)');
    console.log('  merge                   - Show merged environment variables with sources');
    console.log('  priority                - Show file priority order');
    console.log('  check-conflicts         - Check for variable conflicts between files');
    console.log('  backup [description]    - Create backup of all environment files');
    console.log('  restore <timestamp>     - Restore from backup');
    console.log('  list-backups           - List available backups');
    console.log('  sync <target>          - Sync environment (local|production|vercel)');
    console.log('  generate <template>    - Generate environment file (simple|full|local)');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/env-file-manager.js list');
    console.log('  node scripts/env-file-manager.js validate .env.local');
    console.log('  node scripts/env-file-manager.js backup "Before deployment"');
    console.log('  node scripts/env-file-manager.js sync production');
    console.log('  node scripts/env-file-manager.js generate simple');
    console.log('');
    console.log('File Priority Order (1 = highest):');
    console.log('  1. .env.local           (local development overrides)');
    console.log('  2. .env.production      (production configuration)');
    console.log('  3. .env.simple          (simple deployment)');
    console.log('  4. .env                 (default configuration)');
    console.log('  5. .env.example         (template/example)');
  }
}

// Export fallback for require
module.exports = EnvironmentFileManagerFallback;

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new EnvironmentFileCLI();
  cli.run().catch(error => {
    console.error('❌ CLI Error:', error.message);
    process.exit(1);
  });
}