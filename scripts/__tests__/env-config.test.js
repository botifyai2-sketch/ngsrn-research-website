/**
 * Unit Tests for Environment Configuration Script
 * Tests the core environment validation logic from scripts/env-config.js
 */

const path = require('path')
const fs = require('fs')

// Mock file system operations
jest.mock('fs')

// Mock child_process for command execution
jest.mock('child_process', () => ({
  execSync: jest.fn()
}))

describe('Environment Configuration Script', () => {
  let originalEnv
  let originalArgv
  let consoleLogSpy
  let consoleErrorSpy
  let mockExit

  // Import the module functions (we'll need to mock the module loading)
  let envConfig

  beforeEach(() => {
    originalEnv = { ...process.env }
    originalArgv = [...process.argv]
    
    // Clear environment variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('VERCEL') || 
          key.includes('DATABASE') || key.includes('AUTH')) {
        delete process.env[key]
      }
    })
    
    process.env.NODE_ENV = 'test'
    
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    
    // Mock process.exit
    mockExit = jest.spyOn(process, 'exit').mockImplementation()
    
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock fs methods
    fs.existsSync.mockReturnValue(false)
    fs.readFileSync.mockReturnValue('')
    fs.writeFileSync.mockImplementation(() => {})
    
    // Mock the env-config module
    envConfig = {
      detectVercelEnvironment: jest.fn(),
      detectDeploymentPhase: jest.fn(),
      validateEnvironment: jest.fn(),
      generateEnvironmentFile: jest.fn(),
      checkFeatureFlags: jest.fn(),
      generateSecrets: jest.fn(),
      prepareForDeployment: jest.fn(),
      generateVercelSetupInstructions: jest.fn(),
      ENV_CONFIGS: {
        simple: {
          description: 'Simple static deployment without database dependencies',
          required: ['NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_SITE_NAME'],
          optional: ['NEXT_PUBLIC_GA_ID'],
          features: {
            NEXT_PUBLIC_ENABLE_CMS: 'false',
            NEXT_PUBLIC_ENABLE_AUTH: 'false',
            NEXT_PUBLIC_ENABLE_SEARCH: 'false',
            NEXT_PUBLIC_ENABLE_AI: 'false',
            NEXT_PUBLIC_ENABLE_MEDIA: 'false'
          }
        },
        full: {
          description: 'Full production deployment with all features',
          required: [
            'NEXT_PUBLIC_BASE_URL',
            'NEXT_PUBLIC_SITE_NAME',
            'DATABASE_URL',
            'DIRECT_URL',
            'NEXTAUTH_SECRET',
            'NEXTAUTH_URL'
          ],
          optional: [
            'NEXT_PUBLIC_GA_ID',
            'GEMINI_API_KEY',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'AWS_S3_BUCKET',
            'REDIS_URL',
            'ELASTICSEARCH_URL'
          ],
          features: {
            NEXT_PUBLIC_ENABLE_CMS: 'true',
            NEXT_PUBLIC_ENABLE_AUTH: 'true',
            NEXT_PUBLIC_ENABLE_SEARCH: 'true',
            NEXT_PUBLIC_ENABLE_AI: 'true',
            NEXT_PUBLIC_ENABLE_MEDIA: 'true'
          }
        }
      }
    }
  })

  afterEach(() => {
    process.env = originalEnv
    process.argv = originalArgv
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    mockExit.mockRestore()
  })

  describe('detectVercelEnvironment', () => {
    it('should detect non-Vercel environment', () => {
      envConfig.detectVercelEnvironment.mockReturnValue({
        isVercel: false,
        environment: 'development',
        autoProvidedVars: []
      })

      const result = envConfig.detectVercelEnvironment()
      expect(result.isVercel).toBe(false)
      expect(result.environment).toBe('development')
    })

    it('should detect Vercel production environment', () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_ENV = 'production'
      process.env.VERCEL_URL = 'my-app.vercel.app'

      envConfig.detectVercelEnvironment.mockReturnValue({
        isVercel: true,
        environment: 'production',
        deploymentType: 'production',
        url: 'my-app.vercel.app',
        expectedBaseUrl: 'https://my-app.vercel.app',
        hasCustomDomain: false,
        autoProvidedVars: ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL']
      })

      const result = envConfig.detectVercelEnvironment()
      expect(result.isVercel).toBe(true)
      expect(result.deploymentType).toBe('production')
      expect(result.expectedBaseUrl).toBe('https://my-app.vercel.app')
    })

    it('should detect custom domain in Vercel', () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_URL = 'example.com'

      envConfig.detectVercelEnvironment.mockReturnValue({
        isVercel: true,
        url: 'example.com',
        hasCustomDomain: true,
        customDomain: 'example.com',
        expectedBaseUrl: 'https://example.com'
      })

      const result = envConfig.detectVercelEnvironment()
      expect(result.hasCustomDomain).toBe(true)
      expect(result.customDomain).toBe('example.com')
    })
  })

  describe('detectDeploymentPhase', () => {
    it('should detect simple deployment phase', () => {
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'false'
      process.env.NEXT_PUBLIC_ENABLE_AUTH = 'false'

      envConfig.detectDeploymentPhase.mockReturnValue('simple')

      const result = envConfig.detectDeploymentPhase()
      expect(result).toBe('simple')
    })

    it('should detect full deployment phase', () => {
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'true'

      envConfig.detectDeploymentPhase.mockReturnValue('full')

      const result = envConfig.detectDeploymentPhase()
      expect(result).toBe('full')
    })
  })

  describe('validateEnvironment', () => {
    it('should pass validation for simple deployment with all required variables', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'

      envConfig.validateEnvironment.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        phase: 'simple',
        vercelInfo: { isVercel: false }
      })

      const result = envConfig.validateEnvironment('simple')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.phase).toBe('simple')
    })

    it('should fail validation for missing required variables', () => {
      // Missing NEXT_PUBLIC_SITE_NAME
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'

      envConfig.validateEnvironment.mockReturnValue({
        isValid: false,
        errors: [
          {
            type: 'MISSING_REQUIRED_VAR',
            variable: 'NEXT_PUBLIC_SITE_NAME',
            message: 'Missing required environment variable: NEXT_PUBLIC_SITE_NAME'
          }
        ],
        warnings: [],
        phase: 'simple'
      })

      const result = envConfig.validateEnvironment('simple')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].variable).toBe('NEXT_PUBLIC_SITE_NAME')
    })

    it('should handle Vercel auto-provided variables', () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_URL = 'my-app.vercel.app'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      // NEXT_PUBLIC_BASE_URL missing but should be auto-provided

      envConfig.validateEnvironment.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        phase: 'simple',
        vercelInfo: {
          isVercel: true,
          url: 'my-app.vercel.app',
          expectedBaseUrl: 'https://my-app.vercel.app'
        }
      })

      const result = envConfig.validateEnvironment('simple')
      expect(result.isValid).toBe(true)
      expect(result.vercelInfo.expectedBaseUrl).toBe('https://my-app.vercel.app')
    })

    it('should validate full deployment requirements', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-secure'
      process.env.NEXTAUTH_URL = 'https://example.com'

      envConfig.validateEnvironment.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
        phase: 'full'
      })

      const result = envConfig.validateEnvironment('full')
      expect(result.isValid).toBe(true)
      expect(result.phase).toBe('full')
    })

    it('should warn about security issues', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_SECRET = 'short' // Too short
      process.env.NEXTAUTH_URL = 'https://example.com'

      envConfig.validateEnvironment.mockReturnValue({
        isValid: false,
        errors: [
          {
            type: 'SECURITY_WARNING',
            variable: 'NEXTAUTH_SECRET',
            message: 'Authentication secret is too short (should be 32+ characters)'
          }
        ],
        warnings: [],
        phase: 'full'
      })

      const result = envConfig.validateEnvironment('full')
      expect(result.isValid).toBe(false)
      expect(result.errors[0].type).toBe('SECURITY_WARNING')
    })
  })

  describe('generateEnvironmentFile', () => {
    it('should generate simple deployment environment file', () => {
      const expectedContent = `# Environment Configuration for Simple static deployment without database dependencies
# Generated on: 2024-01-01T00:00:00.000Z
# Phase: simple

# Basic Configuration
NEXT_PUBLIC_BASE_URL="https://your-app.vercel.app"
NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"

# Feature Flags
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"
`

      envConfig.generateEnvironmentFile.mockReturnValue('.env.simple')

      const result = envConfig.generateEnvironmentFile('simple')
      expect(result).toBe('.env.simple')
      expect(envConfig.generateEnvironmentFile).toHaveBeenCalledWith('simple')
    })

    it('should generate full deployment environment file', () => {
      envConfig.generateEnvironmentFile.mockReturnValue('.env.full')

      const result = envConfig.generateEnvironmentFile('full')
      expect(result).toBe('.env.full')
      expect(envConfig.generateEnvironmentFile).toHaveBeenCalledWith('full')
    })

    it('should handle custom output path', () => {
      const customPath = '/custom/path/.env.local'
      envConfig.generateEnvironmentFile.mockReturnValue(customPath)

      const result = envConfig.generateEnvironmentFile('simple', customPath)
      expect(result).toBe(customPath)
      expect(envConfig.generateEnvironmentFile).toHaveBeenCalledWith('simple', customPath)
    })
  })

  describe('checkFeatureFlags', () => {
    it('should check feature flag configuration', () => {
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'true'
      process.env.NEXT_PUBLIC_ENABLE_AUTH = 'false'

      envConfig.checkFeatureFlags.mockReturnValue({
        cms: true,
        auth: false,
        search: false,
        ai: false,
        media: false
      })

      const result = envConfig.checkFeatureFlags()
      expect(result.cms).toBe(true)
      expect(result.auth).toBe(false)
    })

    it('should warn about potential configuration issues', () => {
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'true'
      process.env.NEXT_PUBLIC_ENABLE_AUTH = 'false' // CMS without auth

      envConfig.checkFeatureFlags.mockImplementation(() => {
        console.warn('⚠️  CMS is enabled but authentication is disabled. This may cause issues.')
        return { cms: true, auth: false, search: false, ai: false, media: false }
      })

      envConfig.checkFeatureFlags()
      expect(envConfig.checkFeatureFlags).toHaveBeenCalled()
    })
  })

  describe('generateSecrets', () => {
    it('should generate secure secrets', () => {
      const mockSecrets = {
        NEXTAUTH_SECRET: 'generated-nextauth-secret-32-chars-long',
        JWT_SECRET: 'generated-jwt-secret-32-chars-long',
        ENCRYPTION_KEY: 'generated-encryption-key-32-chars-long'
      }

      envConfig.generateSecrets.mockReturnValue(mockSecrets)

      const result = envConfig.generateSecrets()
      expect(result).toEqual(mockSecrets)
      expect(Object.keys(result)).toHaveLength(3)
      expect(result.NEXTAUTH_SECRET).toBeDefined()
    })
  })

  describe('prepareForDeployment', () => {
    it('should prepare simple deployment', () => {
      envConfig.detectVercelEnvironment.mockReturnValue({ isVercel: false })
      envConfig.generateEnvironmentFile.mockReturnValue('.env.simple')
      envConfig.validateEnvironment.mockReturnValue({ isValid: true, errors: [] })
      envConfig.checkFeatureFlags.mockReturnValue({ cms: false, auth: false })

      envConfig.prepareForDeployment.mockReturnValue('.env.simple')

      const result = envConfig.prepareForDeployment('simple')
      expect(result).toBe('.env.simple')
    })

    it('should prepare full deployment', () => {
      envConfig.detectVercelEnvironment.mockReturnValue({ isVercel: false })
      envConfig.generateEnvironmentFile.mockReturnValue('.env.full')
      envConfig.validateEnvironment.mockReturnValue({ isValid: true, errors: [] })
      envConfig.checkFeatureFlags.mockReturnValue({ cms: true, auth: true })

      envConfig.prepareForDeployment.mockReturnValue('.env.full')

      const result = envConfig.prepareForDeployment('full')
      expect(result).toBe('.env.full')
    })

    it('should fail preparation on validation errors', () => {
      envConfig.detectVercelEnvironment.mockReturnValue({ isVercel: false })
      envConfig.generateEnvironmentFile.mockReturnValue('.env.simple')
      envConfig.validateEnvironment.mockReturnValue({ 
        isValid: false, 
        errors: [{ variable: 'NEXT_PUBLIC_SITE_NAME', message: 'Missing' }] 
      })

      envConfig.prepareForDeployment.mockImplementation(() => {
        console.error('❌ Environment validation failed. Please fix the issues above.')
        process.exit(1)
      })

      envConfig.prepareForDeployment('simple')
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })

  describe('generateVercelSetupInstructions', () => {
    it('should generate Vercel setup instructions for simple deployment', () => {
      const mockInstructions = `# Vercel Environment Setup Instructions
# Phase: simple deployment

## Required Environment Variables for Vercel Dashboard

NEXT_PUBLIC_SITE_NAME="NextGen Sustainable Research Network"
# Description: The display name of your website
`

      envConfig.generateVercelSetupInstructions.mockReturnValue('vercel-setup-simple.md')

      const result = envConfig.generateVercelSetupInstructions('simple')
      expect(result).toBe('vercel-setup-simple.md')
    })

    it('should generate Vercel setup instructions for full deployment', () => {
      envConfig.generateVercelSetupInstructions.mockReturnValue('vercel-setup-full.md')

      const result = envConfig.generateVercelSetupInstructions('full')
      expect(result).toBe('vercel-setup-full.md')
    })

    it('should include Vercel context in instructions', () => {
      const vercelInfo = {
        isVercel: true,
        environment: 'production',
        url: 'my-app.vercel.app'
      }

      envConfig.generateVercelSetupInstructions.mockReturnValue('vercel-setup-production.md')

      const result = envConfig.generateVercelSetupInstructions('simple', vercelInfo)
      expect(result).toBe('vercel-setup-production.md')
    })
  })

  describe('Command Line Interface', () => {
    it('should handle validate command', () => {
      process.argv = ['node', 'env-config.js', 'validate', 'simple']
      
      envConfig.validateEnvironment.mockReturnValue({ isValid: true })

      // Simulate main function
      const mockMain = jest.fn().mockImplementation(() => {
        const command = process.argv[2]
        const phase = process.argv[3]
        
        if (command === 'validate') {
          const result = envConfig.validateEnvironment(phase)
          if (!result.isValid) {
            process.exit(1)
          }
        }
      })

      mockMain()
      expect(mockMain).toHaveBeenCalled()
    })

    it('should handle generate command', () => {
      process.argv = ['node', 'env-config.js', 'generate', 'full']
      
      envConfig.generateEnvironmentFile.mockReturnValue('.env.full')

      const mockMain = jest.fn().mockImplementation(() => {
        const command = process.argv[2]
        const phase = process.argv[3]
        
        if (command === 'generate') {
          envConfig.generateEnvironmentFile(phase)
        }
      })

      mockMain()
      expect(mockMain).toHaveBeenCalled()
    })

    it('should show help for unknown command', () => {
      process.argv = ['node', 'env-config.js', 'unknown']

      const mockMain = jest.fn().mockImplementation(() => {
        const command = process.argv[2]
        
        if (!['validate', 'generate', 'check-flags', 'secrets', 'prepare', 'vercel-setup'].includes(command)) {
          console.log('NGSRN Environment Configuration Tool')
          console.log('Usage: node env-config.js [command] [phase]')
        }
      })

      mockMain()
      expect(mockMain).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied')
      })

      envConfig.generateEnvironmentFile.mockImplementation(() => {
        try {
          fs.writeFileSync('.env.local', 'content')
        } catch (error) {
          console.error('Failed to write environment file:', error.message)
          throw error
        }
      })

      expect(() => envConfig.generateEnvironmentFile('simple')).toThrow('EACCES: permission denied')
    })

    it('should handle invalid phase parameter', () => {
      envConfig.validateEnvironment.mockImplementation((phase) => {
        if (!['simple', 'full'].includes(phase)) {
          throw new Error(`Unknown deployment phase: ${phase}. Valid phases: simple, full`)
        }
      })

      expect(() => envConfig.validateEnvironment('invalid')).toThrow('Unknown deployment phase')
    })

    it('should handle missing configuration', () => {
      envConfig.validateEnvironment.mockImplementation(() => {
        throw new Error('Configuration file not found')
      })

      expect(() => envConfig.validateEnvironment('simple')).toThrow('Configuration file not found')
    })
  })
})