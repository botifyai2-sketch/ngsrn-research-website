# Deployment Troubleshooting Guide

This guide provides comprehensive troubleshooting steps for common deployment issues, particularly with Vercel builds and TypeScript configuration problems.

## Quick Fix

For most common deployment issues, run the automated fix script:

```bash
npm run auto-fix
```

This will automatically detect and fix common TypeScript configuration issues that cause deployment failures.

## Common Issues and Solutions

### 1. TypeScript Compilation Errors in Production Build

**Symptoms:**
- Build fails with TypeScript errors
- Errors mention Jest, testing libraries, or test files
- Build command exits with code 1

**Root Cause:**
Test files are being included in production TypeScript compilation, causing type errors because Jest and testing library types aren't available in production.

**Solution:**

1. **Automatic Fix:**
   ```bash
   npm run auto-fix
   ```

2. **Manual Fix:**
   
   Create `tsconfig.build.json`:
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

   Update `package.json` scripts:
   ```json
   {
     "scripts": {
       "type-check:build": "tsc --project tsconfig.build.json --noEmit",
       "build:validate": "npm run type-check:build && node scripts/validate-build.js",
       "build": "npm run build:validate && next build --turbopack"
     }
   }
   ```

### 2. Missing Build Validation

**Symptoms:**
- Deployment succeeds locally but fails on Vercel
- No pre-build validation running
- TypeScript errors not caught before deployment

**Solution:**

1. **Automatic Fix:**
   ```bash
   npm run auto-fix
   ```

2. **Manual Fix:**
   
   Create `scripts/validate-build.js`:
   ```javascript
   #!/usr/bin/env node
   
   const { execSync } = require('child_process');
   const fs = require('fs');
   const path = require('path');
   
   async function validateBuild() {
     console.log('🔍 Validating build configuration...');
     
     try {
       // Check if production TypeScript config exists
       const buildConfigPath = path.join(process.cwd(), 'tsconfig.build.json');
       if (!fs.existsSync(buildConfigPath)) {
         throw new Error('Missing tsconfig.build.json');
       }
   
       // Validate TypeScript compilation
       console.log('📝 Type checking production code...');
       execSync('npm run type-check:build', { stdio: 'inherit' });
       
       console.log('✅ Build validation passed!');
       
     } catch (error) {
       console.error('❌ Build validation failed:', error.message);
       process.exit(1);
     }
   }
   
   validateBuild();
   ```

### 3. Jest Type Definition Conflicts

**Symptoms:**
- TypeScript errors about Jest types not found
- `@types/jest` related compilation errors
- Test files causing production build failures

**Solution:**

1. **Ensure Jest types are only available in development:**
   
   In `tsconfig.json` (development):
   ```json
   {
     "compilerOptions": {
       "types": ["jest", "node"]
     }
   }
   ```

   In `tsconfig.build.json` (production):
   ```json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "types": ["node"]
     },
     "exclude": ["**/*.test.*", "**/__tests__/**"]
   }
   ```

### 4. Environment Variable Issues

**Symptoms:**
- Build fails due to missing environment variables
- Runtime errors about undefined environment variables

**Solution:**

1. **Check environment variable configuration:**
   ```bash
   # Ensure .env.local exists
   cp .env.example .env.local
   
   # Edit .env.local with your values
   ```

2. **Validate required environment variables:**
   ```javascript
   // In your validation script
   const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET'];
   
   for (const envVar of requiredEnvVars) {
     if (!process.env[envVar]) {
       throw new Error(`Missing required environment variable: ${envVar}`);
     }
   }
   ```

### 5. Next.js Configuration Issues

**Symptoms:**
- Build fails during Next.js compilation
- Asset loading issues
- Module resolution errors

**Solution:**

1. **Check `next.config.ts` configuration:**
   ```typescript
   import type { NextConfig } from 'next';
   
   const nextConfig: NextConfig = {
     experimental: {
       turbo: {
         rules: {
           '*.svg': {
             loaders: ['@svgr/webpack'],
             as: '*.js',
           },
         },
       },
     },
     images: {
       domains: ['localhost'],
     },
   };
   
   export default nextConfig;
   ```

### 6. Dependency Issues

**Symptoms:**
- Module not found errors
- Version conflicts
- Missing peer dependencies

**Solution:**

1. **Clean and reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check for peer dependency warnings:**
   ```bash
   npm ls
   ```

3. **Update dependencies:**
   ```bash
   npm update
   ```

## Diagnostic Commands

### Check TypeScript Configuration

```bash
# Check main TypeScript config
npx tsc --showConfig

# Check production TypeScript config
npx tsc --project tsconfig.build.json --showConfig

# Type check production code only
npm run type-check:build
```

### Validate Build Process

```bash
# Run full build validation
npm run build:validate

# Test production build locally
npm run build

# Check for common issues
npm run auto-fix
```

### Environment Validation

```bash
# Check environment variables
node -e "console.log(process.env)" | grep -E "(DATABASE|NEXT|AUTH)"

# Validate environment setup
node scripts/validate-env.js
```

## Prevention Best Practices

### 1. Separate Development and Production Configurations

- Use `tsconfig.build.json` for production builds
- Keep test files excluded from production compilation
- Maintain separate environment configurations

### 2. Implement Pre-Deployment Validation

- Always run `build:validate` before deployment
- Include TypeScript type checking in CI/CD pipeline
- Test builds locally before pushing

### 3. Monitor Build Health

- Set up build monitoring and alerts
- Track build success rates
- Monitor for configuration drift

### 4. Use Automated Fixes

- Run `npm run auto-fix` regularly
- Include automated fixes in CI/CD pipeline
- Keep troubleshooting scripts updated

## Advanced Troubleshooting

### Debug TypeScript Compilation

```bash
# Enable verbose TypeScript logging
npx tsc --project tsconfig.build.json --listFiles --noEmit

# Check which files are being compiled
npx tsc --project tsconfig.build.json --listFilesOnly
```

### Debug Next.js Build

```bash
# Enable Next.js debug mode
DEBUG=* npm run build

# Check Next.js configuration
npx next info
```

### Debug Environment Issues

```bash
# Check all environment variables
printenv | grep -E "(NODE|NEXT|DATABASE)"

# Validate environment file syntax
node -e "require('dotenv').config(); console.log('✅ Environment file is valid')"
```

## Getting Help

If you're still experiencing issues after following this guide:

1. **Run the automated diagnostic:**
   ```bash
   npm run auto-fix
   ```

2. **Check the build logs carefully** for specific error messages

3. **Verify your configuration** matches the examples in this guide

4. **Test locally** before deploying to ensure the issue is reproducible

5. **Check Vercel deployment logs** for additional context

## Script Integration

Add these scripts to your `package.json` for easy troubleshooting:

```json
{
  "scripts": {
    "auto-fix": "node scripts/auto-fix-deployment.js",
    "diagnose": "node scripts/diagnose-deployment.js",
    "type-check:build": "tsc --project tsconfig.build.json --noEmit",
    "build:validate": "npm run type-check:build && node scripts/validate-build.js",
    "build": "npm run build:validate && next build --turbopack"
  }
}
```

This comprehensive approach ensures that deployment issues are caught early and resolved automatically whenever possible.