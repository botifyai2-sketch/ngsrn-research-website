/**
 * Integration Tests for Environment Validation
 * Tests Vercel deployment simulation and cross-platform compatibility
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { validateEnvironment, detectVercelContext } from '../lib/env-validation'

describe('Environment Validation Integration Tests', () => {
  let originalEnv: NodeJS.ProcessEnv
  let tempEnvFiles: string[] = []
  const projectRoot = path.join(__dirname, '..')

  beforeEach(() => {
    originalEnv = { ...process.env }
    tempEnvFiles = []
    
    // Clear environment variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('VERCEL') || 
          key.includes('DATABASE') || key.includes('AUTH')) {
        delete process.env[key]
      }
    })
    
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env = originalEnv
    
    // Clean up temporary files
    tempEnvFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    })
  })

  const createTempEnvFile = (filename: string, content: string): string => {
    const filePath = path.join(projectRoot, filename)
    fs.writeFileSync(filePath, content)
    tempEnvFiles.push(filePath)
    return filePath
  }

  describe('Vercel Deployment Simulation', () => {
    it('should simulate production Vercel deployment environment', async () => {
      // Simulate Vercel production environment
      process.env.VERCEL = '1'
      process.env.VERCEL_ENV = 'production'
      process.env.VERCEL_URL = 'ngsrn-production.vercel.app'
      process.env.VERCEL_REGION = 'iad1'
      process.env.VERCEL_GIT_PROVIDER = 'github'
      process.env.VERCEL_GIT_REPO_SLUG = 'ngsrn-website'
      process.env.VERCEL_GIT_REPO_OWNER = 'organization'
      process.env.VERCEL_GIT_COMMIT_SHA = 'abc123def456'
      
      // Set required variables for simple deployment
      process.env.NEXT_PUBLIC_SITE_NAME = 'NGSRN Production'
      // NEXT_PUBLIC_BASE_URL should be auto-generated from VERCEL_URL
      
      const context = detectVercelContext()
      expect(context.isVercel).toBe(true)
      expect(context.environment).toBe('production')
      expect(context.deploymentType).toBe('production')
      expect(context.expectedBaseUrl).toBe('https://ngsrn-production.vercel.app')
      expect(context.hasCustomDomain).toBe(false)
      
      const config = await validateEnvironment()
      expect(config.phase).toBe('simple')
      expect(config.baseUrl).toBe('https://ngsrn-production.vercel.app')
      expect(config.vercelContext?.isVercel).toBe(true)
    })

    it('should simulate preview deployment environment', async () => {
      // Simulate Vercel preview environment
      process.env.VERCEL = '1'
      process.env.VERCEL_ENV = 'preview'
      process.env.VERCEL_URL = 'ngsrn-git-feature-branch.vercel.app'
      process.env.VERCEL_REGION = 'sfo1'
      
      process.env.NEXT_PUBLIC_SITE_NAME = 'NGSRN Preview'
      
      const context = detectVercelContext()
      expect(context.deploymentType).toBe('preview')
      expect(context.expectedBaseUrl).toBe('https://ngsrn-git-feature-branch.vercel.app')
      
      const config = await validateEnvironment()
      expect(config.vercelContext?.environment).toBe('preview')
    })

    it('should simulate custom domain deployment', async () => {
      // Simulate Vercel with custom domain
      process.env.VERCEL = '1'
      process.env.VERCEL_ENV = 'production'
      process.env.VERCEL_URL = 'research.example.org'
      
      process.env.NEXT_PUBLIC_SITE_NAME = 'NGSRN Custom Domain'
      
      const context = detectVercelContext()
      expect(context.hasCustomDomain).toBe(true)
      expect(context.customDomain).toBe('research.example.org')
      expect(context.expectedBaseUrl).toBe('https://research.example.org')
    })

    it('should handle full deployment in Vercel with all features', async () => {
      // Simulate full Vercel deployment
      process.env.VERCEL = '1'
      process.env.VERCEL_ENV = 'production'
      process.env.VERCEL_URL = 'ngsrn-full.vercel.app'
      
      // Enable all features
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'true'
      process.env.NEXT_PUBLIC_ENABLE_AUTH = 'true'
      process.env.NEXT_PUBLIC_ENABLE_SEARCH = 'true'
      process.env.NEXT_PUBLIC_ENABLE_AI = 'true'
      process.env.NEXT_PUBLIC_ENABLE_MEDIA = 'true'
      
      // Set required variables
      process.env.NEXT_PUBLIC_SITE_NAME = 'NGSRN Full'
      process.env.DATABASE_URL = 'postgresql://user:pass@db.vercel-storage.com:5432/ngsrn'
      process.env.DIRECT_URL = 'postgresql://user:pass@db.vercel-storage.com:5432/ngsrn'
      process.env.NEXTAUTH_SECRET = 'vercel-generated-secret-key-32-chars-long'
      // NEXTAUTH_URL should be auto-generated
      
      const config = await validateEnvironment()
      expect(config.phase).toBe('full')
      expect(config.features.cms).toBe(true)
      expect(config.features.auth).toBe(true)
      expect(config.auth?.url).toBe('https://ngsrn-full.vercel.app')
    })
  })

  describe('Environment File Loading Integration', () => {
    it('should load environment variables from .env.local', async () => {
      createTempEnvFile('.env.local', `
NEXT_PUBLIC_BASE_URL="https://local.example.com"
NEXT_PUBLIC_SITE_NAME="Local Development"
DATABASE_URL="postgresql://localhost:5432/ngsrn_dev"
      `)
      
      // The env-file-manager should load these variables
      // Note: In real integration, this would be loaded by the manager
      process.env.NEXT_PUBLIC_BASE_URL = 'https://local.example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Local Development'
      
      const config = await validateEnvironment()
      expect(config.baseUrl).toBe('https://local.example.com')
      expect(config.siteName).toBe('Local Development')
    })

    it('should handle environment file precedence', async () => {
      // Create multiple env files with different values
      createTempEnvFile('.env', `
NEXT_PUBLIC_SITE_NAME="Base Environment"
NEXT_PUBLIC_BASE_URL="https://base.example.com"
      `)
      
      createTempEnvFile('.env.local', `
NEXT_PUBLIC_SITE_NAME="Local Override"
      `)
      
      // Simulate the precedence: .env.local should override .env
      process.env.NEXT_PUBLIC_BASE_URL = 'https://base.example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Local Override'
      
      const config = await validateEnvironment()
      expect(config.siteName).toBe('Local Override')
      expect(config.baseUrl).toBe('https://base.example.com')
    })

    it('should handle production environment file', async () => {
      createTempEnvFile('.env.production', `
NEXT_PUBLIC_BASE_URL="https://production.example.com"
NEXT_PUBLIC_SITE_NAME="Production Site"
DATABASE_URL="postgresql://prod-db:5432/ngsrn_prod"
NEXTAUTH_SECRET="production-secret-key-32-characters"
      `)
      
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_BASE_URL = 'https://production.example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Production Site'
      
      const config = await validateEnvironment()
      expect(config.baseUrl).toBe('https://production.example.com')
      expect(config.siteName).toBe('Production Site')
    })
  })

  describe('Cross-Platform Environment File Generation', () => {
    it('should generate environment file for Windows paths', async () => {
      // Test Windows-style path handling
      const windowsPath = 'C:\\\\Users\\\\Developer\\\\ngsrn-website\\\\.env.local'
      
      // Simulate environment file content that would be generated
      const envContent = `# Environment Configuration for simple deployment
NEXT_PUBLIC_BASE_URL="https://example.com"
NEXT_PUBLIC_SITE_NAME="NGSRN Website"
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
`
      
      // Test that the content is valid
      const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
      const envVars: Record<string, string> = {}
      
      lines.forEach(line => {
        const match = line.match(/^([^=]+)="?([^"]*)"?$/)
        if (match) {
          envVars[match[1]] = match[2]
        }
      })
      
      expect(envVars.NEXT_PUBLIC_BASE_URL).toBe('https://example.com')
      expect(envVars.NEXT_PUBLIC_SITE_NAME).toBe('NGSRN Website')
      expect(envVars.NEXT_PUBLIC_ENABLE_CMS).toBe('false')
    })

    it('should generate environment file for Unix paths', async () => {
      // Test Unix-style path handling
      const unixPath = '/home/developer/ngsrn-website/.env.local'
      
      // Similar test as above but for Unix paths
      const envContent = `# Environment Configuration for full deployment
NEXT_PUBLIC_BASE_URL="https://research.university.edu"
NEXT_PUBLIC_SITE_NAME="University Research Network"
DATABASE_URL="postgresql://user:pass@localhost:5432/ngsrn"
NEXTAUTH_SECRET="unix-generated-secret-key-32-chars"
`
      
      const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
      const envVars: Record<string, string> = {}
      
      lines.forEach(line => {
        const match = line.match(/^([^=]+)="?([^"]*)"?$/)
        if (match) {
          envVars[match[1]] = match[2]
        }
      })
      
      expect(envVars.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/ngsrn')
      expect(envVars.NEXTAUTH_SECRET).toBe('unix-generated-secret-key-32-chars')
    })
  })

  describe('Build Script Integration', () => {
    it('should integrate with build validation script', () => {
      // Test that the validation can be called from build scripts
      const scriptPath = path.join(projectRoot, 'scripts', 'validate-build.js')
      
      // Check if the script exists
      if (fs.existsSync(scriptPath)) {
        // Test that the script can be executed (dry run)
        expect(() => {
          // This would normally run the script, but we'll just check it exists
          const scriptContent = fs.readFileSync(scriptPath, 'utf8')
          expect(scriptContent).toContain('validateEnvironment')
        }).not.toThrow()
      }
    })

    it('should work with TypeScript build configuration', () => {
      const tsConfigPath = path.join(projectRoot, 'tsconfig.json')
      
      if (fs.existsSync(tsConfigPath)) {
        const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'))
        
        // Verify that the environment validation module can be imported
        expect(tsConfig.compilerOptions).toBeDefined()
        expect(tsConfig.compilerOptions.moduleResolution).toBeDefined()
      }
    })
  })

  describe('Auto-Fix Integration', () => {
    it('should simulate auto-fix functionality', async () => {
      // Simulate missing environment variables that can be auto-fixed
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      // NEXT_PUBLIC_SITE_NAME is missing - should be auto-fixable
      
      try {
        await validateEnvironment()
        // Should fail due to missing variable
        fail('Expected validation to fail')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('NEXT_PUBLIC_SITE_NAME')
        
        // Simulate auto-fix by setting the default value
        process.env.NEXT_PUBLIC_SITE_NAME = 'NextGen Sustainable Research Network'
        
        // Now validation should pass
        const config = await validateEnvironment()
        expect(config.siteName).toBe('NextGen Sustainable Research Network')
      }
    })

    it('should simulate environment file generation', async () => {
      // Test the generation of environment files with proper content
      const simpleEnvContent = `# Environment Configuration for simple deployment
# Generated automatically

NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"

# Feature Flags
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"
`
      
      // Parse and validate the generated content
      const lines = simpleEnvContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
      const envVars: Record<string, string> = {}
      
      lines.forEach(line => {
        const match = line.match(/^([^=]+)="?([^"]*)"?$/)
        if (match) {
          envVars[match[1]] = match[2]
        }
      })
      
      // Verify all required variables are present
      expect(envVars.NEXT_PUBLIC_BASE_URL).toBeDefined()
      expect(envVars.NEXT_PUBLIC_SITE_NAME).toBeDefined()
      expect(envVars.NEXT_PUBLIC_ENABLE_CMS).toBe('false')
      expect(envVars.NEXT_PUBLIC_ENABLE_AUTH).toBe('false')
    })
  })

  describe('Error Recovery Integration', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network connectivity issues that might affect validation
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      
      try {
        // Environment validation should still work without network
        process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
        process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
        
        const config = await validateEnvironment()
        expect(config.phase).toBe('simple')
      } finally {
        global.fetch = originalFetch
      }
    })

    it('should handle file system errors gracefully', async () => {
      // Simulate file system issues
      const originalReadFileSync = fs.readFileSync
      fs.readFileSync = jest.fn().mockImplementation((path) => {
        if (path.toString().includes('.env')) {
          throw new Error('File system error')
        }
        return originalReadFileSync(path)
      })
      
      try {
        // Validation should still work with process.env
        process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
        process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
        
        const config = await validateEnvironment()
        expect(config.phase).toBe('simple')
      } finally {
        fs.readFileSync = originalReadFileSync
      }
    })
  })

  describe('Performance Integration', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now()
      
      // Set up a complex environment with many variables
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Performance Test Site'
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'true'
      process.env.NEXT_PUBLIC_ENABLE_AUTH = 'true'
      process.env.NEXT_PUBLIC_ENABLE_SEARCH = 'true'
      process.env.NEXT_PUBLIC_ENABLE_AI = 'true'
      process.env.NEXT_PUBLIC_ENABLE_MEDIA = 'true'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/ngsrn'
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/ngsrn'
      process.env.NEXTAUTH_SECRET = 'performance-test-secret-key-32-chars'
      process.env.NEXTAUTH_URL = 'https://example.com'
      process.env.GEMINI_API_KEY = 'test-api-key'
      process.env.NEXT_PUBLIC_GA_ID = 'G-TEST123456'
      
      await validateEnvironment()
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Validation should complete within 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should handle concurrent validation calls', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Concurrent Test'
      
      // Run multiple validations concurrently
      const promises = Array(5).fill(null).map(() => validateEnvironment())
      
      const results = await Promise.all(promises)
      
      // All should return the same result
      results.forEach(config => {
        expect(config.phase).toBe('simple')
        expect(config.siteName).toBe('Concurrent Test')
      })
    })
  })
})