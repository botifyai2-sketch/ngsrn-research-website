#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing NGSRN website for simple deployment...\n');

// Step 1: Backup original files
const backupDir = './deployment-backup';
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Backup original page.tsx
if (fs.existsSync('./src/app/page.tsx')) {
  fs.copyFileSync('./src/app/page.tsx', `${backupDir}/page.original.tsx`);
  console.log('✅ Backed up original page.tsx');
}

// Step 2: Replace with simple version
if (fs.existsSync('./src/app/page.simple.tsx')) {
  fs.copyFileSync('./src/app/page.simple.tsx', './src/app/page.tsx');
  console.log('✅ Replaced page.tsx with simple version');
}

// Step 3: Create simple environment variables
const simpleEnv = `# Simple deployment environment variables
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
`;

fs.writeFileSync('.env.production.simple', simpleEnv);
console.log('✅ Created simple production environment file');

// Step 4: Update package.json scripts for simple deployment
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
packageJson.scripts['build:simple'] = 'cp .env.production.simple .env.production && next build';
packageJson.scripts['deploy:simple'] = 'npm run build:simple && vercel --prod';

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with simple deployment scripts');

console.log('\n🎉 Simple deployment preparation complete!');
console.log('\nNext steps:');
console.log('1. Run: npm install -g vercel (if not already installed)');
console.log('2. Run: vercel login (if not already logged in)');
console.log('3. Run: npm run deploy:simple');
console.log('\nThis will deploy a static version of your website without database dependencies.');