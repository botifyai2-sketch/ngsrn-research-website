#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Restoring NGSRN website to full version...\n');

const backupDir = './deployment-backup';

// Step 1: Restore original page.tsx
if (fs.existsSync(`${backupDir}/page.original.tsx`)) {
  fs.copyFileSync(`${backupDir}/page.original.tsx`, './src/app/page.tsx');
  console.log('✅ Restored original page.tsx');
} else {
  console.log('⚠️  No backup found for page.tsx');
}

// Step 2: Restore original package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
delete packageJson.scripts['build:simple'];
delete packageJson.scripts['deploy:simple'];

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Restored original package.json');

console.log('\n🎉 Full version restoration complete!');
console.log('\nYour website is now ready for full deployment with database and all features.');