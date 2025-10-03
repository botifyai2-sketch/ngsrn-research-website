#!/usr/bin/env node

/**
 * Simple test for Environment File Manager CLI
 * Tests basic functionality to verify the implementation works
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Environment File Manager CLI\n');

const tests = [
  {
    name: 'List Files',
    command: 'node scripts/env-file-manager.js list',
    expectSuccess: true
  },
  {
    name: 'Validate Files',
    command: 'node scripts/env-file-manager.js validate',
    expectSuccess: true
  },
  {
    name: 'Show Priority',
    command: 'node scripts/env-file-manager.js priority',
    expectSuccess: true
  },
  {
    name: 'Check Conflicts',
    command: 'node scripts/env-file-manager.js check-conflicts',
    expectSuccess: true
  },
  {
    name: 'Create Backup',
    command: 'node scripts/env-file-manager.js backup "Test backup"',
    expectSuccess: true
  },
  {
    name: 'List Backups',
    command: 'node scripts/env-file-manager.js list-backups',
    expectSuccess: true
  },
  {
    name: 'Generate Simple Template',
    command: 'node scripts/env-file-manager.js generate simple .env.test-simple',
    expectSuccess: true
  },
  {
    name: 'Generate Full Template',
    command: 'node scripts/env-file-manager.js generate full .env.test-full',
    expectSuccess: true
  },
  {
    name: 'Generate Local Template',
    command: 'node scripts/env-file-manager.js generate local .env.test-local-2',
    expectSuccess: true
  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    console.log(`🔍 Testing: ${test.name}`);
    
    const output = execSync(test.command, { 
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (test.expectSuccess) {
      console.log(`✅ ${test.name}: PASSED`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: Expected failure but succeeded`);
      failed++;
    }
    
  } catch (error) {
    if (!test.expectSuccess) {
      console.log(`✅ ${test.name}: PASSED (expected failure)`);
      passed++;
    } else {
      console.log(`❌ ${test.name}: FAILED`);
      console.log(`   Error: ${error.message.split('\n')[0]}`);
      failed++;
    }
  }
}

// Test file generation results
console.log('\n📁 Checking generated files...');

const generatedFiles = [
  '.env.test-simple',
  '.env.test-full', 
  '.env.test-local-2'
];

for (const file of generatedFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ Generated file exists: ${file}`);
    
    // Check content
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('NEXT_PUBLIC_BASE_URL') && content.includes('NEXT_PUBLIC_SITE_NAME')) {
      console.log(`✅ Generated file has expected content: ${file}`);
      passed++;
    } else {
      console.log(`❌ Generated file missing expected content: ${file}`);
      failed++;
    }
  } else {
    console.log(`❌ Generated file missing: ${file}`);
    failed++;
  }
}

// Test backup directory
console.log('\n📦 Checking backup functionality...');

const backupDir = '.env-backups';
if (fs.existsSync(backupDir)) {
  const backups = fs.readdirSync(backupDir);
  if (backups.length > 0) {
    console.log(`✅ Backup directory exists with ${backups.length} backup(s)`);
    passed++;
  } else {
    console.log(`❌ Backup directory exists but is empty`);
    failed++;
  }
} else {
  console.log(`❌ Backup directory not created`);
  failed++;
}

// Summary
console.log('\n📊 Test Results Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Environment File Manager is working correctly.');
  process.exit(0);
} else {
  console.log('\n💥 Some tests failed. Please check the implementation.');
  process.exit(1);
}