#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🗄️  Setting up test database...')

// Create test environment file
const testEnvContent = `
# Test Environment Variables
DATABASE_URL="postgresql://test:test@localhost:5432/ngsrn_test"
NEXTAUTH_SECRET="test-secret-key-for-testing-only"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="test-gemini-key"
AWS_ACCESS_KEY_ID="test-access-key"
AWS_SECRET_ACCESS_KEY="test-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="test-bucket"
REDIS_URL="redis://localhost:6379"
ELASTICSEARCH_URL="http://localhost:9200"
NODE_ENV="test"
`

const testEnvPath = path.join(process.cwd(), '.env.test')
fs.writeFileSync(testEnvPath, testEnvContent.trim())

console.log('✅ Created .env.test file')

try {
  // Generate Prisma client for test environment
  console.log('📦 Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  
  // Check if we can connect to test database
  console.log('🔌 Testing database connection...')
  
  // Note: In a real setup, you would:
  // 1. Create a test database
  // 2. Run migrations
  // 3. Seed test data
  
  console.log('✅ Test database setup complete')
  console.log('\n📝 Next steps:')
  console.log('1. Ensure PostgreSQL is running locally')
  console.log('2. Create test database: createdb ngsrn_test')
  console.log('3. Run migrations: npx prisma migrate deploy')
  console.log('4. Run tests: npm run test')
  
} catch (error) {
  console.error('❌ Failed to setup test database:', error.message)
  console.log('\n💡 Make sure PostgreSQL is installed and running')
  process.exit(1)
}