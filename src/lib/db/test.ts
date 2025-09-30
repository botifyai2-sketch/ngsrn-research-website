// Simple test to verify database setup
import { prisma } from '@/lib/prisma'
import { getAllDivisions } from './divisions'
import { getLeadershipTeam } from './authors'

export async function testDatabaseSetup() {
  try {
    console.log('🧪 Testing database setup...')
    
    // Test divisions
    const divisions = await getAllDivisions()
    console.log(`✅ Found ${divisions.length} research divisions`)
    
    // Test leadership team
    const leadership = await getLeadershipTeam()
    console.log(`✅ Found ${leadership.length} leadership members`)
    
    // Test database connection
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)
    
    console.log('🎉 Database setup test completed successfully!')
    return true
  } catch (error) {
    console.error('❌ Database setup test failed:', error)
    return false
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testDatabaseSetup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}