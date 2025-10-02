# Automated Fix Quick Reference

This document provides a quick reference for using the automated deployment fix system.

## Quick Commands

```bash
# Fix all common deployment issues automatically
npm run fix:deployment

# Generate proper TypeScript configurations
npm run fix:typescript-config

# Validate existing TypeScript configurations
npm run validate:typescript-config

# Run build validation with automatic fixes
npm run build:validate:auto-fix

# Test the automated fix system
node scripts/test-deployment-auto-fix.js
```

## Common Issues and Fixes

### 1. TypeScript Build Errors

**Issue:** Test files causing production build failures
```bash
error TS2307: Cannot find module '@jest/globals'
```

**Fix:**
```bash
npm run fix:deployment
# or
node scripts/deployment-auto-fix.js
```

**What it does:**
- Creates `tsconfig.build.json` that excludes test files
- Updates build scripts to use production configuration
- Fixes Jest type definition issues

### 2. Missing TypeScript Configuration

**Issue:** No production TypeScript configuration

**Fix:**
```bash
npm run fix:typescript-config
# or
node scripts/typescript-config-generator.js generate
```

**What it creates:**
- `tsconfig.json` (base configuration)
- `tsconfig.build.json` (production configuration)
- `tsconfig.test.json` (test configuration, if tests exist)

### 3. Build Script Issues

**Issue:** Incorrect or missing build scripts

**Fix:** Automated fix updates `package.json` with:
```json
{
  "scripts": {
    "type-check:build": "tsc --project tsconfig.build.json --noEmit",
    "build:validate": "npm run type-check:build && node scripts/validate-build.js"
  }
}
```

### 4. Environment Configuration

**Issue:** Missing `.env.local` file

**Fix:** Automatically creates `.env.local` from `.env.example` if available

## Integration with Build Process

### Automatic Fixes During Build

Add to your build process:
```bash
# Enable auto-fix during build validation
AUTO_FIX_DEPLOYMENT=true npm run build:validate

# Or use the specific script
npm run build:validate:auto-fix
```

### CI/CD Integration

Add to your GitHub Actions workflow:
```yaml
- name: Run automated fixes
  run: npm run fix:deployment

- name: Validate build
  run: npm run build:validate
```

## Troubleshooting

### If Automated Fixes Fail

1. **Check the error output** for specific issues
2. **Run individual fix commands**:
   ```bash
   node scripts/typescript-config-generator.js generate
   node scripts/deployment-auto-fix.js
   ```
3. **Validate configurations**:
   ```bash
   npm run validate:typescript-config
   npm run type-check:build
   ```

### Manual Override

If you need to customize the generated configurations:

1. **Run the generator first**:
   ```bash
   npm run fix:typescript-config
   ```

2. **Edit the generated files** as needed:
   - `tsconfig.build.json` - Production build configuration
   - `package.json` scripts - Build and validation scripts

3. **Test your changes**:
   ```bash
   npm run type-check:build
   npm run build:validate
   ```

## Configuration Files

### Generated TypeScript Configurations

**`tsconfig.build.json`** (Production):
```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/__tests__/**",
    "**/e2e/**",
    "jest.config.js",
    "jest.setup.js",
    "playwright.config.ts"
  ],
  "compilerOptions": {
    "noEmit": true
  }
}
```

**`tsconfig.test.json`** (Testing):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest", "node"],
    "noEmit": true
  },
  "include": [
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/__tests__/**"
  ]
}
```

### Updated Package.json Scripts

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:build": "tsc --project tsconfig.build.json --noEmit",
    "type-check:test": "tsc --project tsconfig.test.json --noEmit",
    "build:validate": "npm run type-check:build && node scripts/validate-build.js",
    "fix:deployment": "node scripts/deployment-auto-fix.js",
    "fix:typescript-config": "node scripts/typescript-config-generator.js generate"
  }
}
```

## Validation and Testing

### Test the Fix System

```bash
# Run comprehensive tests
node scripts/test-deployment-auto-fix.js

# Check specific configurations
npm run validate:typescript-config

# Test build process
npm run build:validate
```

### Verify Fixes Work

```bash
# 1. Test TypeScript compilation
npm run type-check:build

# 2. Test full build process
npm run build

# 3. Check for test file exclusion
npx tsc --project tsconfig.build.json --listFiles | grep -E '\.(test|spec)\.'
# Should return no results
```

## Best Practices

### 1. Run Fixes Before Deployment

Always run automated fixes before deploying:
```bash
npm run fix:deployment
npm run build:validate
npm run build
```

### 2. Commit Generated Configurations

Add generated files to version control:
```bash
git add tsconfig.build.json tsconfig.test.json package.json
git commit -m "Add automated deployment fix configurations"
```

### 3. Regular Validation

Periodically validate your configuration:
```bash
npm run validate:typescript-config
```

### 4. Monitor Build Health

Set up monitoring for build failures and run fixes automatically:
```bash
# In CI/CD pipeline
if ! npm run build:validate; then
  npm run fix:deployment
  npm run build:validate
fi
```

## Support and Troubleshooting

### Common Error Messages

| Error | Solution |
|-------|----------|
| `Cannot find module '@jest/globals'` | Run `npm run fix:deployment` |
| `tsconfig.build.json not found` | Run `npm run fix:typescript-config` |
| `Missing required script: type-check:build` | Run `npm run fix:deployment` |
| `Test files included in production build` | Run `npm run fix:deployment` |

### Getting Help

1. **Check the troubleshooting guide**: `DEPLOYMENT_TROUBLESHOOTING_GUIDE.md`
2. **Run diagnostic commands**:
   ```bash
   npm run type-check:build
   node scripts/validate-build.js --help
   ```
3. **Test the fix system**:
   ```bash
   node scripts/test-deployment-auto-fix.js
   ```

### Emergency Recovery

If fixes break your configuration:
```bash
# Restore from git
git checkout HEAD -- tsconfig.json tsconfig.build.json package.json

# Or restore from backup (if available)
ls *.backup.*
cp tsconfig.json.backup.* tsconfig.json
```

Remember: The automated fix system creates backups of modified files, so you can always restore if needed.