/**
 * Environment File Management System
 * Handles loading, validation, backup, and synchronization of environment files
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface EnvironmentFile {
  name: string;
  path: string;
  priority: number;
  exists: boolean;
  variables: Record<string, string>;
  lastModified?: Date;
  size?: number;
  isValid: boolean;
  errors: string[];
}

export interface EnvironmentFileConfig {
  rootPath: string;
  files: {
    name: string;
    priority: number;
    required?: boolean;
    description: string;
  }[];
}

export interface BackupInfo {
  timestamp: string;
  files: string[];
  path: string;
  description?: string;
}

export interface SyncResult {
  success: boolean;
  synced: string[];
  errors: string[];
  conflicts: string[];
}

/**
 * Default environment file configuration with priority order
 */
const DEFAULT_ENV_CONFIG: EnvironmentFileConfig = {
  rootPath: process.cwd(),
  files: [
    { name: '.env.local', priority: 1, description: 'Local development overrides (highest priority)' },
    { name: '.env.production', priority: 2, description: 'Production environment configuration' },
    { name: '.env.simple', priority: 3, description: 'Simple deployment configuration' },
    { name: '.env', priority: 4, description: 'Default environment configuration' },
    { name: '.env.example', priority: 5, description: 'Example environment template (lowest priority)' }
  ]
};

/**
 * Environment File Manager class
 */
export class EnvironmentFileManager {
  private config: EnvironmentFileConfig;
  private backupDir: string;

  constructor(config?: Partial<EnvironmentFileConfig>) {
    this.config = { ...DEFAULT_ENV_CONFIG, ...config };
    this.backupDir = path.join(this.config.rootPath, '.env-backups');
    this.ensureBackupDirectory();
  }

  /**
   * Load environment files with priority order
   */
  async loadEnvironmentFiles(): Promise<EnvironmentFile[]> {
    const files: EnvironmentFile[] = [];

    for (const fileConfig of this.config.files) {
      const filePath = path.join(this.config.rootPath, fileConfig.name);
      const envFile: EnvironmentFile = {
        name: fileConfig.name,
        path: filePath,
        priority: fileConfig.priority,
        exists: fs.existsSync(filePath),
        variables: {},
        isValid: true,
        errors: []
      };

      if (envFile.exists) {
        try {
          const stats = fs.statSync(filePath);
          envFile.lastModified = stats.mtime;
          envFile.size = stats.size;

          const content = fs.readFileSync(filePath, 'utf8');
          const parseResult = this.parseEnvironmentFile(content, fileConfig.name);
          
          envFile.variables = parseResult.variables;
          envFile.isValid = parseResult.isValid;
          envFile.errors = parseResult.errors;
        } catch (error) {
          envFile.isValid = false;
          envFile.errors.push(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      files.push(envFile);
    }

    return files.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get merged environment variables with priority resolution
   */
  async getMergedEnvironment(): Promise<Record<string, string>> {
    const files = await this.loadEnvironmentFiles();
    const merged: Record<string, string> = {};

    // Apply in reverse priority order (highest priority last)
    for (const file of files.reverse()) {
      if (file.exists && file.isValid) {
        Object.assign(merged, file.variables);
      }
    }

    return merged;
  }

  /**
   * Validate environment file format and content
   */
  validateEnvironmentFile(filePath: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    if (!fs.existsSync(filePath)) {
      result.isValid = false;
      result.errors.push('File does not exist');
      return result;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parseResult = this.parseEnvironmentFile(content, path.basename(filePath));
      
      result.isValid = parseResult.isValid;
      result.errors = parseResult.errors;

      // Additional validation checks
      this.validateEnvironmentContent(parseResult.variables, result);
      
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Create backup of environment files
   */
  async createBackup(description?: string): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
    
    fs.mkdirSync(backupPath, { recursive: true });

    const files = await this.loadEnvironmentFiles();
    const backedUpFiles: string[] = [];

    for (const file of files) {
      if (file.exists) {
        const backupFilePath = path.join(backupPath, file.name);
        fs.copyFileSync(file.path, backupFilePath);
        backedUpFiles.push(file.name);
      }
    }

    // Create backup metadata
    const backupInfo: BackupInfo = {
      timestamp,
      files: backedUpFiles,
      path: backupPath,
      description
    };

    const metadataPath = path.join(backupPath, 'backup-info.json');
    fs.writeFileSync(metadataPath, JSON.stringify(backupInfo, null, 2));

    return backupInfo;
  }

  /**
   * Restore environment files from backup
   */
  async restoreFromBackup(backupTimestamp: string): Promise<{ success: boolean; restored: string[]; errors: string[] }> {
    const result = {
      success: true,
      restored: [] as string[],
      errors: [] as string[]
    };

    const backupPath = path.join(this.backupDir, `backup-${backupTimestamp}`);
    const metadataPath = path.join(backupPath, 'backup-info.json');

    if (!fs.existsSync(backupPath)) {
      result.success = false;
      result.errors.push(`Backup not found: ${backupTimestamp}`);
      return result;
    }

    try {
      let backupInfo: BackupInfo;
      if (fs.existsSync(metadataPath)) {
        backupInfo = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      } else {
        // Fallback: scan directory for files
        const files = fs.readdirSync(backupPath).filter(f => f.startsWith('.env'));
        backupInfo = {
          timestamp: backupTimestamp,
          files,
          path: backupPath
        };
      }

      // Create current backup before restore
      await this.createBackup(`Pre-restore backup before restoring ${backupTimestamp}`);

      // Restore files
      for (const fileName of backupInfo.files) {
        const backupFilePath = path.join(backupPath, fileName);
        const targetPath = path.join(this.config.rootPath, fileName);

        if (fs.existsSync(backupFilePath)) {
          fs.copyFileSync(backupFilePath, targetPath);
          result.restored.push(fileName);
        } else {
          result.errors.push(`Backup file not found: ${fileName}`);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * List available backups
   */
  listBackups(): BackupInfo[] {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const backups: BackupInfo[] = [];
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
            // Create minimal backup info from directory
            const timestamp = entry.replace('backup-', '');
            const files = fs.readdirSync(backupPath).filter(f => f.startsWith('.env'));
            backups.push({
              timestamp,
              files,
              path: backupPath
            });
          }
        } catch (error) {
          console.warn(`Failed to read backup metadata: ${entry}`);
        }
      }
    }

    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Synchronize environment files between local and deployment
   */
  async synchronizeEnvironmentFiles(targetEnv: 'local' | 'production' | 'vercel'): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: [],
      errors: [],
      conflicts: []
    };

    try {
      const files = await this.loadEnvironmentFiles();
      
      switch (targetEnv) {
        case 'local':
          await this.syncToLocal(files, result);
          break;
        case 'production':
          await this.syncToProduction(files, result);
          break;
        case 'vercel':
          await this.syncToVercel(files, result);
          break;
        default:
          result.success = false;
          result.errors.push(`Unknown target environment: ${targetEnv}`);
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Generate environment file from template
   */
  async generateEnvironmentFile(
    template: 'simple' | 'full' | 'local',
    outputPath?: string
  ): Promise<{ success: boolean; path: string; errors: string[] }> {
    const result = {
      success: true,
      path: '',
      errors: [] as string[]
    };

    try {
      const content = this.generateEnvironmentContent(template);
      const filePath = outputPath || path.join(this.config.rootPath, `.env.${template}`);
      
      // Create backup if file exists
      if (fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
      }

      fs.writeFileSync(filePath, content);
      result.path = filePath;

    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to generate file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Parse environment file content
   */
  private parseEnvironmentFile(content: string, fileName: string): {
    variables: Record<string, string>;
    isValid: boolean;
    errors: string[];
  } {
    const result = {
      variables: {} as Record<string, string>,
      isValid: true,
      errors: [] as string[]
    };

    const lines = content.split('\n');
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Match KEY=value or KEY="value"
      const match = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
      
      if (match) {
        const [, key, value] = match;
        
        // Remove quotes if present
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

  /**
   * Validate environment content
   */
  private validateEnvironmentContent(
    variables: Record<string, string>,
    result: { errors: string[]; warnings: string[] }
  ): void {
    // Check for common issues
    for (const [key, value] of Object.entries(variables)) {
      // Check for placeholder values
      if (value.includes('your-') || value.includes('XXXXXXXXXX')) {
        result.warnings.push(`Variable ${key} contains placeholder value: ${value}`);
      }

      // Check for localhost in production URLs
      if (key.includes('URL') && value.includes('localhost') && key.includes('PUBLIC')) {
        result.warnings.push(`Variable ${key} uses localhost URL: ${value}`);
      }

      // Check for empty required variables
      if (!value && this.isRequiredVariable(key)) {
        result.errors.push(`Required variable ${key} is empty`);
      }

      // Validate URL format
      if (key.includes('URL') && value && !this.isValidUrl(value)) {
        result.errors.push(`Variable ${key} is not a valid URL: ${value}`);
      }
    }
  }

  /**
   * Check if variable is required
   */
  private isRequiredVariable(key: string): boolean {
    const requiredVars = [
      'NEXT_PUBLIC_BASE_URL',
      'NEXT_PUBLIC_SITE_NAME',
      'DATABASE_URL',
      'NEXTAUTH_SECRET'
    ];
    return requiredVars.includes(key);
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure backup directory exists
   */
  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Sync to local environment
   */
  private async syncToLocal(files: EnvironmentFile[], result: SyncResult): Promise<void> {
    // Copy production settings to local with appropriate modifications
    const prodFile = files.find(f => f.name === '.env.production');
    const localFile = files.find(f => f.name === '.env.local');

    if (prodFile && prodFile.exists) {
      const localVars = { ...prodFile.variables };
      
      // Modify for local development
      if (localVars.NEXT_PUBLIC_BASE_URL) {
        localVars.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
      }
      if (localVars.NEXTAUTH_URL) {
        localVars.NEXTAUTH_URL = 'http://localhost:3000';
      }

      const content = this.generateContentFromVariables(localVars, 'Local development (synced from production)');
      const localPath = path.join(this.config.rootPath, '.env.local');
      
      fs.writeFileSync(localPath, content);
      result.synced.push('.env.local');
    }
  }

  /**
   * Sync to production environment
   */
  private async syncToProduction(files: EnvironmentFile[], result: SyncResult): Promise<void> {
    // Copy local settings to production with appropriate modifications
    const localFile = files.find(f => f.name === '.env.local');
    
    if (localFile && localFile.exists) {
      const prodVars = { ...localFile.variables };
      
      // Modify for production
      if (prodVars.NEXT_PUBLIC_BASE_URL?.includes('localhost')) {
        prodVars.NEXT_PUBLIC_BASE_URL = 'https://your-app.vercel.app';
      }
      if (prodVars.NEXTAUTH_URL?.includes('localhost')) {
        prodVars.NEXTAUTH_URL = prodVars.NEXT_PUBLIC_BASE_URL || 'https://your-app.vercel.app';
      }

      const content = this.generateContentFromVariables(prodVars, 'Production (synced from local)');
      const prodPath = path.join(this.config.rootPath, '.env.production');
      
      fs.writeFileSync(prodPath, content);
      result.synced.push('.env.production');
    }
  }

  /**
   * Sync to Vercel environment
   */
  private async syncToVercel(files: EnvironmentFile[], result: SyncResult): Promise<void> {
    // This would integrate with Vercel CLI to sync environment variables
    try {
      // Check if Vercel CLI is available
      execSync('vercel --version', { stdio: 'ignore' });
      
      const prodFile = files.find(f => f.name === '.env.production');
      if (prodFile && prodFile.exists) {
        // Note: This is a placeholder for Vercel CLI integration
        // In a real implementation, you would use Vercel's API or CLI
        result.synced.push('vercel-environment');
        console.log('Vercel sync would be implemented here using Vercel CLI or API');
      }
    } catch (error) {
      result.errors.push('Vercel CLI not available for synchronization');
    }
  }

  /**
   * Generate environment content from variables
   */
  private generateContentFromVariables(variables: Record<string, string>, description: string): string {
    const timestamp = new Date().toISOString();
    let content = `# Environment Configuration - ${description}\n`;
    content += `# Generated on: ${timestamp}\n\n`;

    // Group variables by category
    const categories = {
      'Basic Configuration': ['NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_SITE_NAME'],
      'Feature Flags': Object.keys(variables).filter(k => k.startsWith('NEXT_PUBLIC_ENABLE_')),
      'Database': ['DATABASE_URL', 'DIRECT_URL'],
      'Authentication': ['NEXTAUTH_URL', 'NEXTAUTH_SECRET'],
      'Analytics': ['NEXT_PUBLIC_GA_ID', 'NEXT_PUBLIC_HOTJAR_ID'],
      'AI Services': ['GEMINI_API_KEY'],
      'AWS Configuration': ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'],
      'Other': []
    };

    // Add uncategorized variables to 'Other'
    const categorizedKeys = new Set(Object.values(categories).flat());
    for (const key of Object.keys(variables)) {
      if (!categorizedKeys.has(key)) {
        categories.Other.push(key);
      }
    }

    // Generate content by category
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

  /**
   * Generate environment content for template
   */
  private generateEnvironmentContent(template: 'simple' | 'full' | 'local'): string {
    const timestamp = new Date().toISOString();
    
    const templates = {
      simple: `# Environment Configuration for Simple Deployment
# Generated on: ${timestamp}
# Phase: simple

# Basic Configuration
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"

# Feature Flags
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"

# Google Analytics (optional)
# NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
`,

      full: `# Environment Configuration for Full Deployment
# Generated on: ${timestamp}
# Phase: full

# Basic Configuration
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"

# Feature Flags
NEXT_PUBLIC_ENABLE_CMS="true"
NEXT_PUBLIC_ENABLE_AUTH="true"
NEXT_PUBLIC_ENABLE_SEARCH="true"
NEXT_PUBLIC_ENABLE_AI="true"
NEXT_PUBLIC_ENABLE_MEDIA="true"

# Database Configuration
DATABASE_URL="postgresql://username:password@host:5432/ngsrn_production"
DIRECT_URL="postgresql://username:password@host:5432/ngsrn_production"

# Authentication
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Google Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# AI Services (optional)
# GEMINI_API_KEY="your-gemini-api-key"

# AWS Configuration (optional)
# AWS_ACCESS_KEY_ID="your-aws-access-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
# AWS_S3_BUCKET="your-s3-bucket"
`,

      local: `# Environment Configuration for Local Development
# Generated on: ${timestamp}

# Basic Configuration
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"

# Feature Flags (adjust as needed)
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"

# Database (for development)
# DATABASE_URL="postgresql://username:password@localhost:5432/ngsrn_dev"
# DIRECT_URL="postgresql://username:password@localhost:5432/ngsrn_dev"

# Authentication (for development)
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="development-secret-key"

# Google Analytics (optional)
# NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
`
    };

    return templates[template];
  }
}

/**
 * Default instance for easy usage
 */
export const envFileManager = new EnvironmentFileManager();

/**
 * Utility functions for common operations
 */
export async function loadEnvironmentWithPriority(): Promise<Record<string, string>> {
  return envFileManager.getMergedEnvironment();
}

export async function validateAllEnvironmentFiles(): Promise<{
  isValid: boolean;
  files: Array<{ name: string; isValid: boolean; errors: string[]; warnings: string[] }>;
}> {
  const files = await envFileManager.loadEnvironmentFiles();
  const results = files
    .filter(f => f.exists)
    .map(f => ({
      name: f.name,
      isValid: f.isValid,
      errors: f.errors,
      warnings: [] as string[]
    }));

  return {
    isValid: results.every(r => r.isValid),
    files: results
  };
}

export async function createEnvironmentBackup(description?: string): Promise<BackupInfo> {
  return envFileManager.createBackup(description);
}

export async function restoreEnvironmentBackup(timestamp: string): Promise<{
  success: boolean;
  restored: string[];
  errors: string[];
}> {
  return envFileManager.restoreFromBackup(timestamp);
}