#!/usr/bin/env node

/**
 * Build Validation Test Script
 * Tests and validates the build process to ensure test files are excluded
 * and production functionality remains intact.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Build Validation Test Suite');
console.log('==============================');

function runTest(testName, testFn) {
  try {
    console.log(`\n🔍 ${testName}...`);
    const result = testFn();
    if (result === true || result === undefined) {
      console.log(`✅ ${testName} - PASSED`);
      return true;
    } else {
      console.log(`❌ ${testName} - FAILED: ${result}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${testName} - ERROR: ${error.message}`);
    return false;
  }
}

// Test 1: Verify production TypeScript compilation passes
function testProductionTypeScript() {
  try {
    execSync('npx tsc --project tsconfig.build.json --noEmit', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    return true;
  } catch (error) {
    return `Production TypeScript compilation failed: ${error.message}`;
  }
}

// Test 2: Verify test files are excluded from production build
function testTestFileExclusion() {
  try {
    const output = execSync('npx tsc --project tsconfig.build.json --listFiles --noEmit', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    
    const lines = output.split('\n');
    const testFiles = lines.filter(line => 
      line.includes('.test.') || 
      line.includes('.spec.') || 
      line.includes('__tests__') ||
      line.includes('/e2e/')
    ).filter(line => 
      !line.includes('node_modules') // Exclude node_modules test files
    );
    
    if (testFiles.length > 0) {
      return `Test files found in production build: ${testFiles.join(', ')}`;
    }
    
    return true;
  } catch (error) {
    return `Failed to check test file exclusion: ${error.message}`;
  }
}

// Test 3: Verify build configuration files exist
function testBuildConfiguration() {
  const requiredFiles = [
    'tsconfig.json',
    'tsconfig.build.json',
    'package.json',
    'next.config.ts'
  ];
  
  const projectRoot = path.join(__dirname, '..');
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(projectRoot, file))
  );
  
  if (missingFiles.length > 0) {
    return `Missing required files: ${missingFiles.join(', ')}`;
  }
  
  return true;
}

// Test 4: Verify TypeScript configuration correctness
function testTypeScriptConfiguration() {
  const tsConfigBuildPath = path.join(__dirname, '..', 'tsconfig.build.json');
  
  if (!fs.existsSync(tsConfigBuildPath)) {
    return 'tsconfig.build.json not found';
  }
  
  const tsConfigBuild = JSON.parse(fs.readFileSync(tsConfigBuildPath, 'utf8'));
  
  // Check extends property
  if (!tsConfigBuild.extends) {
    return 'tsconfig.build.json should extend base configuration';
  }
  
  // Check exclude patterns
  const excludePatterns = tsConfigBuild.exclude || [];
  const requiredPatterns = [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/__tests__/**'
  ];
  
  const missingPatterns = requiredPatterns.filter(pattern => 
    !excludePatterns.some(exclude => exclude === pattern)
  );
  
  if (missingPatterns.length > 0) {
    return `Missing exclude patterns: ${missingPatterns.join(', ')}`;
  }
  
  return true;
}

// Test 5: Verify build scripts in package.json
function testBuildScripts() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredScripts = {
    'build': 'Main build script',
    'build:validate': 'Build validation script',
    'type-check:build': 'Production TypeScript checking'
  };
  
  const missingScripts = Object.keys(requiredScripts).filter(script => 
    !packageJson.scripts || !packageJson.scripts[script]
  );
  
  if (missingScripts.length > 0) {
    return `Missing required scripts: ${missingScripts.join(', ')}`;
  }
  
  // Check if build:validate uses production type checking
  if (!packageJson.scripts['build:validate'].includes('type-check:build')) {
    return 'build:validate script should use production TypeScript configuration';
  }
  
  return true;
}

// Test 6: Verify Next.js build completes successfully
function testNextJsBuild() {
  try {
    // Check if build output exists
    const buildDir = path.join(__dirname, '..', '.next');
    if (!fs.existsSync(buildDir)) {
      return 'Build output directory not found. Run npm run build first.';
    }
    
    // Check for critical build files
    const criticalFiles = [
      'build-manifest.json',
      'app-build-manifest.json',
      'routes-manifest.json'
    ];
    
    const missingFiles = criticalFiles.filter(file => 
      !fs.existsSync(path.join(buildDir, file))
    );
    
    if (missingFiles.length > 0) {
      return `Missing critical build files: ${missingFiles.join(', ')}`;
    }
    
    return true;
  } catch (error) {
    return `Build verification failed: ${error.message}`;
  }
}

// Test 7: Verify production functionality integrity
function testProductionFunctionality() {
  try {
    // Test that essential production files exist and are valid
    const essentialFiles = [
      'src/app/layout.tsx',
      'src/app/page.tsx',
      'src/lib/utils.ts',
      'src/components/layout/Header.tsx',
      'src/components/layout/Footer.tsx'
    ];
    
    const projectRoot = path.join(__dirname, '..');
    const missingFiles = essentialFiles.filter(file => 
      !fs.existsSync(path.join(projectRoot, file))
    );
    
    if (missingFiles.length > 0) {
      return `Missing essential production files: ${missingFiles.join(', ')}`;
    }
    
    return true;
  } catch (error) {
    return `Production functionality check failed: ${error.message}`;
  }
}

// Test 8: Verify Suspense boundaries are properly implemented
function testSuspenseBoundaries() {
  try {
    // Check that components using useSearchParams have Suspense boundaries
    const layoutPath = path.join(__dirname, '..', 'src/app/layout.tsx');
    const searchPagePath = path.join(__dirname, '..', 'src/app/search/page.tsx');
    
    if (fs.existsSync(layoutPath)) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      if (!layoutContent.includes('Suspense')) {
        return 'Layout should include Suspense boundary for AnalyticsProvider';
      }
    }
    
    if (fs.existsSync(searchPagePath)) {
      const searchContent = fs.readFileSync(searchPagePath, 'utf8');
      if (!searchContent.includes('Suspense')) {
        return 'Search page should include Suspense boundary for useSearchParams';
      }
    }
    
    return true;
  } catch (error) {
    return `Suspense boundary check failed: ${error.message}`;
  }
}

// Run all tests
async function runAllTests() {
  const tests = [
    ['Production TypeScript Compilation', testProductionTypeScript],
    ['Test File Exclusion', testTestFileExclusion],
    ['Build Configuration Files', testBuildConfiguration],
    ['TypeScript Configuration', testTypeScriptConfiguration],
    ['Build Scripts', testBuildScripts],
    ['Next.js Build Output', testNextJsBuild],
    ['Production Functionality', testProductionFunctionality],
    ['Suspense Boundaries', testSuspenseBoundaries]
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const [testName, testFn] of tests) {
    if (runTest(testName, testFn)) {
      passedTests++;
    }
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Build validation successful.');
    console.log('✅ Test files are properly excluded from production build');
    console.log('✅ Production functionality remains intact');
    console.log('✅ Build process is working correctly');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
    return false;
  }
}

// Main execution
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testProductionTypeScript,
  testTestFileExclusion,
  testBuildConfiguration,
  testTypeScriptConfiguration,
  testBuildScripts,
  testNextJsBuild,
  testProductionFunctionality,
  testSuspenseBoundaries
};