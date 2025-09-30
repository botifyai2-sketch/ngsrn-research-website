#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

const testSuites = {
  unit: {
    command: 'npm',
    args: ['run', 'test:unit'],
    description: 'Running unit tests...',
  },
  integration: {
    command: 'npm',
    args: ['run', 'test:integration'],
    description: 'Running integration tests...',
  },
  e2e: {
    command: 'npm',
    args: ['run', 'test:e2e'],
    description: 'Running end-to-end tests...',
  },
  accessibility: {
    command: 'npm',
    args: ['run', 'test:accessibility'],
    description: 'Running accessibility tests...',
  },
  performance: {
    command: 'npm',
    args: ['run', 'test:performance'],
    description: 'Running performance tests...',
  },
}

async function runTest(testType) {
  const suite = testSuites[testType]
  if (!suite) {
    console.error(`Unknown test type: ${testType}`)
    process.exit(1)
  }

  console.log(`\n🧪 ${suite.description}`)
  console.log('=' .repeat(50))

  return new Promise((resolve, reject) => {
    const child = spawn(suite.command, suite.args, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testType} tests passed`)
        resolve()
      } else {
        console.log(`❌ ${testType} tests failed`)
        reject(new Error(`${testType} tests failed with code ${code}`))
      }
    })

    child.on('error', (error) => {
      console.error(`Failed to start ${testType} tests:`, error)
      reject(error)
    })
  })
}

async function runAllTests() {
  const testOrder = ['unit', 'integration', 'accessibility', 'e2e', 'performance']
  const results = {
    passed: [],
    failed: [],
  }

  console.log('🚀 Starting comprehensive test suite...')
  console.log(`Running ${testOrder.length} test suites in sequence\n`)

  for (const testType of testOrder) {
    try {
      await runTest(testType)
      results.passed.push(testType)
    } catch (error) {
      results.failed.push(testType)
      
      // Continue with other tests even if one fails
      console.log(`⚠️  Continuing with remaining tests...\n`)
    }
  }

  // Print summary
  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST SUITE SUMMARY')
  console.log('=' .repeat(60))
  
  if (results.passed.length > 0) {
    console.log(`✅ Passed (${results.passed.length}): ${results.passed.join(', ')}`)
  }
  
  if (results.failed.length > 0) {
    console.log(`❌ Failed (${results.failed.length}): ${results.failed.join(', ')}`)
  }
  
  console.log(`\n📈 Overall: ${results.passed.length}/${testOrder.length} test suites passed`)
  
  if (results.failed.length > 0) {
    console.log('\n💡 To run individual test suites:')
    results.failed.forEach(testType => {
      console.log(`   npm run test:${testType}`)
    })
    process.exit(1)
  } else {
    console.log('\n🎉 All tests passed!')
    process.exit(0)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const testType = args[0]

if (testType && testType !== 'all') {
  if (testSuites[testType]) {
    runTest(testType).catch(() => process.exit(1))
  } else {
    console.error(`Unknown test type: ${testType}`)
    console.log('Available test types:', Object.keys(testSuites).join(', '))
    process.exit(1)
  }
} else {
  runAllTests()
}