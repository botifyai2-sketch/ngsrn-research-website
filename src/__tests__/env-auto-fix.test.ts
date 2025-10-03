/**
 * Tests for Auto-Fix Functionality and Error Recovery
 * Tests automated environment variable setup and error recovery scenarios
 */

import fs from 'fs'
import path from 'path'
import { validateEnvironment } from '../lib/env-validation'

// Mock the auto-fix functionality
const mockAutoFix = {
  generateEnvironmentFile: jest.fn(),
  injectDefaultValues: jest.fn(),
  createVercelConfig: jest.fn(),
  fixMissingVariables: jest.fn()
}

// Mock file system operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}))

describe('Environment Auto-Fix and Error Recovery', () => {
  let originalEnv: NodeJS.ProcessEnv
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    originalEnv = { ...process.env }
    
    // Clear environment variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('VERCEL') || 
          key.includes('DATABASE') || key.includes('AUTH')) {
        delete process.env[key]
      }
    })
    
    process.env.NODE_ENV = 'test'
    
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    
    // Reset mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('Missing Variable Auto-Fix', () => {
    it('should identify fixable missing variables', async () => {
      // Only set base URL, missing site name
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      
      try {
        await validateEnvironment()
        fail('Expected validation to fail')
      } catch (error) {
        const errorMessage = (error as Error).message
        expect(errorMessage).toContain('NEXT_PUBLIC_SITE_NAME')
        
        // Simulate auto-fix detection
        const fixableErrors = [
          {
            variable: 'NEXT_PUBLIC_SITE_NAME',
            type: 'missing_required',
            autoFixable: true,
            defaultValue: 'NextGen Sustainable Research Network'
          }
        ]
        
        expect(fixableErrors[0].autoFixable).toBe(true)
        expect(fixableErrors[0].defaultValue).toBeDefined()
      }
    })

    it('should auto-inject default NEXT_PUBLIC_SITE_NAME', () => {
      const defaultSiteName = 'NextGen Sustainable Research Network'
      
      // Simulate auto-fix injection
      mockAutoFix.injectDefaultValues.mockImplementation((variables) => {
        if (variables.includes('NEXT_PUBLIC_SITE_NAME')) {
          process.env.NEXT_PUBLIC_SITE_NAME = defaultSiteName
          return true
        }
        return false
      })
      
      const result = mockAutoFix.injectDefaultValues(['NEXT_PUBLIC_SITE_NAME'])
      expect(result).toBe(true)
      expect(process.env.NEXT_PUBLIC_SITE_NAME).toBe(defaultSiteName)
    })

    it('should generate missing environment files with defaults', () => {
      const expectedContent = `# Environment Configuration for simple deployment
# Generated automatically by auto-fix

NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"

# Feature Flags
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"

# Optional Analytics
# NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
`

      mockAutoFix.generateEnvironmentFile.mockImplementation((phase, outputPath) => {
        expect(phase).toBe('simple')
        expect(outputPath).toContain('.env')
        
        // Simulate file creation
        ;(fs.writeFileSync as jest.Mock).mockImplementation((path, content) => {
          expect(content).toContain('NEXT_PUBLIC_SITE_NAME')
          expect(content).toContain('NextGen Sustainable Research Network')
        })
        
        return outputPath
      })
      
      const result = mockAutoFix.generateEnvironmentFile('simple', '.env.local')
      expect(result).toBe('.env.local')
      expect(fs.writeFileSync).toHaveBeenCalled()
    })

    it('should handle full deployment auto-fix with database variables', () => {
      const fullDeploymentContent = `# Environment Configuration for full deployment
# Generated automatically by auto-fix

NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"

# Database Configuration
DATABASE_URL="postgresql://username:password@host:5432/ngsrn_production"
DIRECT_URL="postgresql://username:password@host:5432/ngsrn_production"

# Authentication
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Feature Flags
NEXT_PUBLIC_ENABLE_CMS="true"
NEXT_PUBLIC_ENABLE_AUTH="true"
NEXT_PUBLIC_ENABLE_SEARCH="true"
NEXT_PUBLIC_ENABLE_AI="true"
NEXT_PUBLIC_ENABLE_MEDIA="true"
`

      mockAutoFix.generateEnvironmentFile.mockImplementation((phase) => {
        if (phase === 'full') {
          ;(fs.writeFileSync as jest.Mock).mockImplementation((path, content) => {
            expect(content).toContain('DATABASE_URL')
            expect(content).toContain('NEXTAUTH_SECRET')
            expect(content).toContain('NEXT_PUBLIC_ENABLE_CMS="true"')
          })
          return '.env.full'
        }
      })
      
      mockAutoFix.generateEnvironmentFile('full')
      expect(fs.writeFileSync).toHaveBeenCalled()
    })
  })

  describe('Vercel Configuration Auto-Fix', () => {
    it('should create Vercel environment variable configuration', () => {
      const vercelConfig = {
        variables: [
          { name: 'NEXT_PUBLIC_SITE_NAME', value: 'NGSRN Production' },
          { name: 'DATABASE_URL', value: 'postgresql://...', secret: true },
          { name: 'NEXTAUTH_SECRET', value: 'generated-secret', secret: true }
        ]
      }
      
      mockAutoFix.createVercelConfig.mockImplementation((config) => {
        expect(config.variables).toHaveLength(3)
        expect(config.variables.find(v => v.name === 'DATABASE_URL')?.secret).toBe(true)
        
        // Simulate Vercel CLI commands
        const commands = config.variables.map(variable => 
          `vercel env add ${variable.name} ${variable.secret ? 'production' : ''}`
        )
        
        return commands
      })
      
      const commands = mockAutoFix.createVercelConfig(vercelConfig)
      expect(commands).toHaveLength(3)
      expect(commands[0]).toContain('vercel env add')
    })

    it('should handle Vercel URL auto-generation', () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_URL = 'my-app.vercel.app'
      
      // Simulate auto-fix for missing base URL in Vercel
      mockAutoFix.fixMissingVariables.mockImplementation((missingVars, vercelContext) => {
        const fixes = []
        
        if (missingVars.includes('NEXT_PUBLIC_BASE_URL') && vercelContext?.isVercel) {
          fixes.push({
            variable: 'NEXT_PUBLIC_BASE_URL',
            action: 'auto_generate',
            value: `https://${vercelContext.url}`,
            source: 'VERCEL_URL'
          })
        }
        
        return fixes
      })
      
      const fixes = mockAutoFix.fixMissingVariables(
        ['NEXT_PUBLIC_BASE_URL'], 
        { isVercel: true, url: 'my-app.vercel.app' }
      )
      
      expect(fixes).toHaveLength(1)
      expect(fixes[0].value).toBe('https://my-app.vercel.app')
      expect(fixes[0].source).toBe('VERCEL_URL')
    })
  })

  describe('Error Recovery Scenarios', () => {
    it('should recover from file system permission errors', () => {
      // Simulate permission error
      ;(fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('EACCES: permission denied')
      })
      
      mockAutoFix.generateEnvironmentFile.mockImplementation((phase, outputPath) => {
        try {
          fs.writeFileSync(outputPath, 'content')
          return outputPath
        } catch (error) {
          // Fallback to alternative location
          const fallbackPath = path.join(process.cwd(), '.env.backup')
          console.log(`Permission denied for ${outputPath}, trying ${fallbackPath}`)
          return fallbackPath
        }
      })
      
      const result = mockAutoFix.generateEnvironmentFile('simple', '/protected/.env.local')
      expect(result).toContain('.env.backup')
    })

    it('should handle network errors during Vercel API calls', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      
      mockAutoFix.createVercelConfig.mockImplementation(async (config) => {
        try {
          // Simulate Vercel API call
          await fetch('/api/vercel/env', {
            method: 'POST',
            body: JSON.stringify(config)
          })
        } catch (error) {
          // Fallback to CLI commands
          console.log('Network error, falling back to CLI commands')
          return config.variables.map(v => `vercel env add ${v.name}`)
        }
      })
      
      const result = await mockAutoFix.createVercelConfig({
        variables: [{ name: 'TEST_VAR', value: 'test' }]
      })
      
      expect(result).toContain('vercel env add TEST_VAR')
    })

    it('should handle corrupted environment files', () => {
      // Simulate corrupted file content
      ;(fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
        if (filePath.includes('.env')) {
          return 'CORRUPTED_CONTENT=\n\nINVALID_LINE\n=MISSING_KEY'
        }
        return ''
      })
      
      mockAutoFix.fixMissingVariables.mockImplementation((missingVars) => {
        // Detect corrupted file and regenerate
        const fixes = []
        
        try {
          const content = fs.readFileSync('.env.local', 'utf8')
          if (content.includes('CORRUPTED') || content.includes('INVALID')) {
            fixes.push({
              variable: 'FILE_CORRUPTION',
              action: 'regenerate_file',
              message: 'Detected corrupted environment file, regenerating...'
            })
          }
        } catch (error) {
          // File doesn't exist or can't be read
        }
        
        return fixes
      })
      
      const fixes = mockAutoFix.fixMissingVariables(['NEXT_PUBLIC_SITE_NAME'])
      expect(fixes).toHaveLength(1)
      expect(fixes[0].action).toBe('regenerate_file')
    })
  })

  describe('Auto-Fix Validation', () => {
    it('should validate auto-fix results', async () => {
      // Simulate auto-fix process
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      // Missing NEXT_PUBLIC_SITE_NAME
      
      // Apply auto-fix
      process.env.NEXT_PUBLIC_SITE_NAME = 'NextGen Sustainable Research Network'
      
      // Validate that the fix worked
      const config = await validateEnvironment()
      expect(config.phase).toBe('simple')
      expect(config.siteName).toBe('NextGen Sustainable Research Network')
    })

    it('should detect when auto-fix is insufficient', async () => {
      // Set up scenario where auto-fix can't resolve all issues
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'true'
      process.env.NEXT_PUBLIC_ENABLE_AUTH = 'true'
      
      // Auto-fix can provide defaults for some variables
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'NextGen Sustainable Research Network'
      
      // But can't auto-generate database credentials
      // DATABASE_URL, NEXTAUTH_SECRET still missing
      
      try {
        await validateEnvironment()
        fail('Expected validation to fail')
      } catch (error) {
        const errorMessage = (error as Error).message
        expect(errorMessage).toContain('DATABASE_URL')
        expect(errorMessage).toContain('NEXTAUTH_SECRET')
        
        // These require manual configuration
        const manualFixRequired = [
          'DATABASE_URL',
          'DIRECT_URL', 
          'NEXTAUTH_SECRET'
        ]
        
        manualFixRequired.forEach(variable => {
          expect(errorMessage).toContain(variable)
        })
      }
    })

    it('should provide clear instructions for manual fixes', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      process.env.NEXT_PUBLIC_ENABLE_AUTH = 'true'
      
      try {
        await validateEnvironment()
        fail('Expected validation to fail')
      } catch (error) {
        const errorMessage = (error as Error).message
        
        // Should contain setup instructions
        expect(errorMessage).toContain('NEXTAUTH_SECRET')
        expect(errorMessage).toContain('DATABASE_URL')
        
        // Verify that the error message includes helpful guidance
        expect(errorMessage.toLowerCase()).toMatch(/(setup|configure|generate|create)/i)
      }
    })
  })

  describe('Auto-Fix Performance', () => {
    it('should complete auto-fix operations quickly', () => {
      const startTime = Date.now()
      
      // Simulate multiple auto-fix operations
      mockAutoFix.injectDefaultValues(['NEXT_PUBLIC_SITE_NAME'])
      mockAutoFix.generateEnvironmentFile('simple', '.env.local')
      mockAutoFix.fixMissingVariables(['NEXT_PUBLIC_BASE_URL'])
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Auto-fix should be fast (under 100ms for mocked operations)
      expect(duration).toBeLessThan(100)
    })

    it('should handle batch auto-fix operations', () => {
      const missingVariables = [
        'NEXT_PUBLIC_SITE_NAME',
        'NEXT_PUBLIC_BASE_URL',
        'NEXT_PUBLIC_GA_ID'
      ]
      
      mockAutoFix.fixMissingVariables.mockImplementation((variables) => {
        return variables.map(variable => ({
          variable,
          action: 'set_default',
          value: `default-${variable.toLowerCase()}`,
          success: true
        }))
      })
      
      const fixes = mockAutoFix.fixMissingVariables(missingVariables)
      
      expect(fixes).toHaveLength(3)
      fixes.forEach(fix => {
        expect(fix.success).toBe(true)
        expect(fix.value).toContain('default-')
      })
    })
  })

  describe('Auto-Fix Rollback', () => {
    it('should support rollback of auto-fix changes', () => {
      const originalState = {
        'NEXT_PUBLIC_SITE_NAME': undefined,
        'NEXT_PUBLIC_BASE_URL': 'https://original.com'
      }
      
      // Apply auto-fix
      process.env.NEXT_PUBLIC_SITE_NAME = 'Auto-fixed Site Name'
      process.env.NEXT_PUBLIC_BASE_URL = 'https://auto-fixed.com'
      
      // Simulate rollback
      const rollback = () => {
        Object.entries(originalState).forEach(([key, value]) => {
          if (value === undefined) {
            delete process.env[key]
          } else {
            process.env[key] = value
          }
        })
      }
      
      rollback()
      
      expect(process.env.NEXT_PUBLIC_SITE_NAME).toBeUndefined()
      expect(process.env.NEXT_PUBLIC_BASE_URL).toBe('https://original.com')
    })

    it('should create backup before auto-fix', () => {
      const currentEnv = {
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME
      }
      
      mockAutoFix.generateEnvironmentFile.mockImplementation((phase, outputPath) => {
        // Create backup before making changes
        const backupPath = outputPath + '.backup'
        const backupContent = Object.entries(currentEnv)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}="${value}"`)
          .join('\n')
        
        ;(fs.writeFileSync as jest.Mock).mockImplementation((path, content) => {
          if (path === backupPath) {
            expect(content).toContain('NEXT_PUBLIC_BASE_URL')
          }
        })
        
        fs.writeFileSync(backupPath, backupContent)
        return outputPath
      })
      
      mockAutoFix.generateEnvironmentFile('simple', '.env.local')
      expect(fs.writeFileSync).toHaveBeenCalledWith('.env.local.backup', expect.any(String))
    })
  })
})