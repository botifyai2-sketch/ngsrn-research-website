# Environment File Management System

This document describes the comprehensive environment file management system implemented for the NGSRN website project.

## Overview

The Environment File Management system provides:

- **Priority-based file loading** - Automatically loads and merges environment files based on priority
- **File validation** - Validates environment file format and content
- **Backup and restore** - Creates backups and restores environment configurations
- **Synchronization** - Syncs environment files between local and deployment environments
- **Template generation** - Generates environment files from templates
- **Conflict detection** - Identifies and reports variable conflicts between files

## File Priority Order

Environment files are loaded in the following priority order (1 = highest priority):

1. `.env.local` - Local development overrides (highest priority)
2. `.env.production` - Production environment configuration
3. `.env.simple` - Simple deployment configuration
4. `.env` - Default environment configuration
5. `.env.example` - Example environment template (lowest priority)

Variables in higher priority files override those in lower priority files.

## CLI Usage

### Basic Commands

```bash
# List all environment files and their status
npm run env:file:list

# Validate all environment files
npm run env:file:validate

# Show merged environment variables with sources
npm run env:file:merge

# Show file priority order
npm run env:file:priority

# Check for variable conflicts between files
npm run env:file:conflicts
```

### Backup and Restore

```bash
# Create backup of all environment files
npm run env:file:backup

# Create backup with description
node scripts/env-file-manager.js backup "Before deployment changes"

# List available backups
npm run env:file:list-backups

# Restore from backup (use timestamp from list-backups)
node scripts/env-file-manager.js restore 2025-10-03T05-44-45-472Z
```

### Synchronization

```bash
# Sync environment to local development
npm run env:file:sync:local

# Sync environment to production
npm run env:file:sync:production

# Sync environment to Vercel (requires Vercel CLI)
npm run env:file:sync:vercel
```

### Template Generation

```bash
# Generate simple deployment template
npm run env:file:generate:simple

# Generate full deployment template
npm run env:file:generate:full

# Generate local development template
npm run env:file:generate:local

# Generate to specific file
node scripts/env-file-manager.js generate simple .env.custom
```

## File Structure

### TypeScript Implementation

- `src/lib/env-file-manager.ts` - Main TypeScript implementation
- `src/lib/env-validation.ts` - Enhanced validation with priority loading

### CLI Scripts

- `scripts/env-file-manager.js` - CLI interface with JavaScript fallback
- `scripts/test-env-manager-simple.js` - Simple test suite

### Package.json Scripts

All environment file management commands are available as npm scripts:

```json
{
  "env:file:list": "node scripts/env-file-manager.js list",
  "env:file:validate": "node scripts/env-file-manager.js validate",
  "env:file:merge": "node scripts/env-file-manager.js merge",
  "env:file:priority": "node scripts/env-file-manager.js priority",
  "env:file:conflicts": "node scripts/env-file-manager.js check-conflicts",
  "env:file:backup": "node scripts/env-file-manager.js backup",
  "env:file:restore": "node scripts/env-file-manager.js restore",
  "env:file:list-backups": "node scripts/env-file-manager.js list-backups",
  "env:file:sync:local": "node scripts/env-file-manager.js sync local",
  "env:file:sync:production": "node scripts/env-file-manager.js sync production",
  "env:file:sync:vercel": "node scripts/env-file-manager.js sync vercel",
  "env:file:generate:simple": "node scripts/env-file-manager.js generate simple",
  "env:file:generate:full": "node scripts/env-file-manager.js generate full",
  "env:file:generate:local": "node scripts/env-file-manager.js generate local",
  "env:file:test": "node scripts/test-env-manager-simple.js"
}
```

## Features

### 1. Environment File Loading Priority

The system automatically loads environment files in priority order and merges variables:

```typescript
// Load environment variables with priority
const priorityEnv = await loadEnvironmentWithPriority();

// Merge with process.env (process.env takes precedence for runtime variables)
const env = { ...priorityEnv, ...process.env };
```

### 2. File Format Validation

Validates environment files for:
- Correct KEY=value format
- Valid variable names (A-Z, 0-9, underscore)
- Proper quoting
- URL format validation for URL variables
- Placeholder value detection

### 3. Backup and Restore System

- **Automatic backups** before restore operations
- **Metadata tracking** with timestamps and descriptions
- **Selective restore** of individual files
- **Backup verification** to ensure integrity

### 4. Environment Synchronization

#### Local Sync
Copies production settings to local with modifications:
- Changes URLs to localhost
- Adjusts authentication URLs
- Preserves feature flags

#### Production Sync
Copies local settings to production with modifications:
- Changes localhost URLs to production URLs
- Updates authentication configurations
- Maintains security settings

#### Vercel Sync
Integrates with Vercel CLI to sync environment variables to Vercel dashboard.

### 5. Template Generation

Generates environment files for different deployment phases:

#### Simple Template
- Disables all advanced features
- Basic configuration only
- Suitable for static deployments

#### Full Template
- Enables all features
- Includes database configuration
- Authentication setup
- All optional services

#### Local Template
- Development-friendly settings
- Localhost URLs
- Development secrets

### 6. Conflict Detection

Identifies and reports:
- Variables with different values across files
- Priority resolution
- Final effective values
- Recommendations for resolution

## Integration with Existing Systems

### Environment Validation

The system integrates with the existing environment validation in `src/lib/env-validation.ts`:

```typescript
// Enhanced validation with priority loading
export async function validateEnvironment(): Promise<EnvironmentConfig> {
  // Load environment variables with priority
  const priorityEnv = await loadEnvironmentWithPriority();
  
  // Merge with process.env
  const env = { ...priorityEnv, ...process.env };
  
  // Continue with validation...
}
```

### Build Process

Environment file management is integrated into the build validation process:

```bash
# Build with environment validation
npm run build:validate
```

## Error Handling

The system provides comprehensive error handling:

- **File not found** - Clear error messages with suggestions
- **Invalid format** - Line-by-line error reporting
- **Backup failures** - Automatic rollback and error recovery
- **Sync conflicts** - Conflict detection and resolution guidance

## Security Considerations

- **Secret handling** - Never logs sensitive values
- **Backup security** - Backups are stored locally only
- **Validation warnings** - Alerts for placeholder values and security issues
- **Production safety** - Prevents accidental exposure of development secrets

## Testing

Run the test suite to verify functionality:

```bash
npm run env:file:test
```

The test suite verifies:
- CLI command functionality
- File generation
- Backup creation
- Validation processes
- Error handling

## Troubleshooting

### Common Issues

1. **TypeScript module not available**
   - The system automatically falls back to JavaScript implementation
   - No action required

2. **Backup directory permissions**
   - Ensure write permissions in project directory
   - Check `.env-backups` directory creation

3. **File validation errors**
   - Check environment file format
   - Ensure proper KEY=value syntax
   - Validate variable names (no spaces, special characters)

4. **Sync failures**
   - Verify source files exist
   - Check file permissions
   - Ensure target directories are writable

### Debug Mode

For detailed debugging, examine the CLI output which includes:
- File loading status
- Variable counts
- Priority resolution
- Error details with line numbers

## Best Practices

1. **Regular backups** before major changes
2. **Validate files** after manual edits
3. **Use templates** for new environments
4. **Check conflicts** when merging configurations
5. **Test locally** before production deployment
6. **Document changes** in backup descriptions

## Future Enhancements

Potential improvements for the system:

- **Remote backup storage** (cloud integration)
- **Environment variable encryption** for sensitive data
- **Git integration** for version control
- **Web UI** for easier management
- **Automated sync scheduling**
- **Integration with CI/CD pipelines**
- **Multi-project support**
- **Environment variable templates** with validation schemas

## Requirements Satisfied

This implementation satisfies all requirements from the specification:

✅ **5.1** - Environment file loading priority (local, production, default)  
✅ **5.2** - Validation for environment file format and content  
✅ **5.3** - Backup and restore functionality for environment configurations  
✅ **5.4** - Environment file synchronization between local and deployment  

The system provides a comprehensive solution for managing environment variables across different deployment phases while maintaining security, reliability, and ease of use.