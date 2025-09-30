#!/usr/bin/env node

/**
 * Deployment Preparation Script
 * Prepares the NGSRN website for Vercel deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import configuration utilities
const { prepareForDeployment, validateEnvironment } = require('./env-config');
const { validateBuildEnvironment } = require('./validate-build');

function createBackup() {
  console.log('📦 Creating deployment backup...');
  
  const backupDir = path.join(__dirname, '..', 'deployment-backup');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }
  
  // Backup critical files
  const filesToBackup = [
    '.env.local',
    '.env.production',
    'src/app/page.tsx',
    'next.config.ts',
    'vercel.json'
  ];
  
  filesToBackup.forEach(file => {
    const sourcePath = path.join(__dirname, '..', file);
    const backupFilePath = path.join(backupPath, file.replace(/[\/\\]/g, '_'));
    
    if (fs.existsSync(sourcePath)) {
      // Ensure backup directory structure exists
      const backupFileDir = path.dirname(backupFilePath);
      if (!fs.existsSync(backupFileDir)) {
        fs.mkdirSync(backupFileDir, { recursive: true });
      }
      
      fs.copyFileSync(sourcePath, backupFilePath);
      console.log(`  ✅ Backed up ${file}`);
    } else {
      console.log(`  ⚠️  Skipped ${file} (not found)`);
    }
  });
  
  console.log(`📁 Backup created at: ${backupPath}`);
  return backupPath;
}

function setupSimpleDeployment() {
  console.log('🔧 Setting up simple deployment configuration...');
  
  // Use the simple page version if it exists
  const simplePage = path.join(__dirname, '..', 'src/app/page.simple.tsx');
  const mainPage = path.join(__dirname, '..', 'src/app/page.tsx');
  
  if (fs.existsSync(simplePage)) {
    fs.copyFileSync(simplePage, mainPage);
    console.log('  ✅ Switched to simple page version');
  }
  
  // Copy simple environment configuration
  const simpleEnv = path.join(__dirname, '..', '.env.vercel.simple');
  const prodEnv = path.join(__dirname, '..', '.env.production');
  
  if (fs.existsSync(simpleEnv)) {
    fs.copyFileSync(simpleEnv, prodEnv);
    console.log('  ✅ Applied simple environment configuration');
  }
  
  console.log('✅ Simple deployment setup complete');
}

function checkVercelConfiguration() {
  console.log('⚙️  Checking Vercel configuration...');
  
  const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
  
  if (!fs.existsSync(vercelConfigPath)) {
    console.warn('⚠️  vercel.json not found. Creating basic configuration...');
    
    const basicVercelConfig = {
      "framework": "nextjs",
      "buildCommand": "npm run build",
      "outputDirectory": ".next",
      "installCommand": "npm install",
      "devCommand": "npm run dev",
      "regions": ["iad1"],
      "functions": {
        "src/app/api/**/*.ts": {
          "maxDuration": 30
        }
      },
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            {
              "key": "X-Frame-Options",
              "value": "DENY"
            },
            {
              "key": "X-Content-Type-Options",
              "value": "nosniff"
            },
            {
              "key": "Referrer-Policy",
              "value": "strict-origin-when-cross-origin"
            }
          ]
        }
      ]
    };
    
    fs.writeFileSync(vercelConfigPath, JSON.stringify(basicVercelConfig, null, 2));
    console.log('  ✅ Created basic vercel.json configuration');
  } else {
    console.log('  ✅ vercel.json found');
  }
}

function runPreDeploymentChecks() {
  console.log('🔍 Running pre-deployment checks...');
  
  try {
    // Check if required tools are installed
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      console.log('  ✅ Vercel CLI is installed');
    } catch (error) {
      console.error('  ❌ Vercel CLI not found. Install with: npm install -g vercel');
      return false;
    }
    
    // Validate build environment
    validateBuildEnvironment();
    
    // Check for common issues
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts.build) {
      console.error('  ❌ Build script not found in package.json');
      return false;
    }
    
    console.log('  ✅ Pre-deployment checks passed');
    return true;
    
  } catch (error) {
    console.error('  ❌ Pre-deployment check failed:', error.message);
    return false;
  }
}

function generateDeploymentInstructions(phase = 'simple') {
  console.log('📋 Generating deployment instructions...');
  
  const instructions = `
# NGSRN Website Deployment Instructions

## Phase: ${phase.toUpperCase()}

### Prerequisites
- Vercel CLI installed: \`npm install -g vercel\`
- Vercel account created and logged in: \`vercel login\`

### Environment Variables
Set these in your Vercel dashboard (Project Settings > Environment Variables):

#### Required Variables:
- NEXT_PUBLIC_BASE_URL: Your Vercel app URL (e.g., https://your-app.vercel.app)
- NEXT_PUBLIC_SITE_NAME: NextGen Sustainable Research Network

#### Feature Flags (for ${phase} deployment):
- NEXT_PUBLIC_ENABLE_CMS: ${phase === 'simple' ? 'false' : 'true'}
- NEXT_PUBLIC_ENABLE_AUTH: ${phase === 'simple' ? 'false' : 'true'}
- NEXT_PUBLIC_ENABLE_SEARCH: ${phase === 'simple' ? 'false' : 'true'}
- NEXT_PUBLIC_ENABLE_AI: ${phase === 'simple' ? 'false' : 'true'}
- NEXT_PUBLIC_ENABLE_MEDIA: ${phase === 'simple' ? 'false' : 'true'}

#### Optional Variables:
- NEXT_PUBLIC_GA_ID: Your Google Analytics 4 measurement ID

${phase === 'full' ? `
#### Additional Variables for Full Deployment:
- DATABASE_URL: Your Supabase database URL
- DIRECT_URL: Your Supabase direct connection URL
- NEXTAUTH_SECRET: Random secret for authentication
- NEXTAUTH_URL: Your app URL (same as NEXT_PUBLIC_BASE_URL)
` : ''}

### Deployment Steps:

1. **Prepare Environment**
   \`\`\`bash
   npm run env:prepare:${phase}
   \`\`\`

2. **Validate Configuration**
   \`\`\`bash
   npm run build:validate
   \`\`\`

3. **Deploy to Vercel**
   \`\`\`bash
   vercel --prod
   \`\`\`

4. **Verify Deployment**
   - Check that your site loads at the Vercel URL
   - Test navigation and core functionality
   - Verify analytics tracking (if configured)

### Troubleshooting:
- If build fails, check environment variables in Vercel dashboard
- For feature-related issues, verify feature flags are set correctly
- Check Vercel function logs for runtime errors

### Next Steps:
${phase === 'simple' ? `
- To enable full features, prepare for full deployment:
  \`npm run env:prepare:full\`
- Set up Supabase database
- Configure authentication
` : `
- Monitor application performance
- Set up monitoring and alerts
- Configure custom domain (optional)
`}

Generated on: ${new Date().toISOString()}
`;

  const instructionsPath = path.join(__dirname, '..', `DEPLOYMENT_INSTRUCTIONS_${phase.toUpperCase()}.md`);
  fs.writeFileSync(instructionsPath, instructions);
  console.log(`  ✅ Instructions saved to: DEPLOYMENT_INSTRUCTIONS_${phase.toUpperCase()}.md`);
  
  return instructionsPath;
}

async function main() {
  const phase = process.argv[2] || 'simple';
  
  if (!['simple', 'full'].includes(phase)) {
    console.error('❌ Invalid phase. Use "simple" or "full"');
    process.exit(1);
  }
  
  console.log('🚀 NGSRN Deployment Preparation');
  console.log('==============================');
  console.log(`Phase: ${phase.toUpperCase()}`);
  console.log('');
  
  try {
    // Create backup
    const backupPath = createBackup();
    
    // Prepare environment configuration
    prepareForDeployment(phase);
    
    // Setup deployment-specific configuration
    if (phase === 'simple') {
      setupSimpleDeployment();
    }
    
    // Check Vercel configuration
    checkVercelConfiguration();
    
    // Run pre-deployment checks
    const checksPass = runPreDeploymentChecks();
    
    if (!checksPass) {
      console.error('❌ Pre-deployment checks failed. Please fix the issues above.');
      process.exit(1);
    }
    
    // Generate deployment instructions
    const instructionsPath = generateDeploymentInstructions(phase);
    
    console.log('');
    console.log('🎉 Deployment preparation complete!');
    console.log('');
    console.log('Next steps:');
    console.log(`1. Review the deployment instructions: ${path.basename(instructionsPath)}`);
    console.log('2. Set environment variables in Vercel dashboard');
    console.log('3. Run: vercel --prod');
    console.log('');
    console.log(`💾 Backup created at: ${path.relative(process.cwd(), backupPath)}`);
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createBackup,
  setupSimpleDeployment,
  checkVercelConfiguration,
  runPreDeploymentChecks,
  generateDeploymentInstructions
};