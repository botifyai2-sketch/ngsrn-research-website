/**
 * Unit Tests for Environment Validation
 * Tests environment variable validation logic with various missing variable scenarios
 */

import {
  validateEnvironment,
  detectVercelContext,
  getEnvironmentConfig,
  isFeatureEnabled,
  getDeploymentPhase,
  checkClientEnvironment,
  type VercelContext,
  type EnvironmentConfig,
  type ValidationError
} from '../env-validation'

// Mock the env-file-manager module
jest.mock('../env-file-manager', () => ({
  loadEnvironmentWithPriority: jest.fn().mockResolvedValue({}),
  envFileManager: {
    loadWithPriority: jest.fn().mockResolvedValue({})
  }
}))

describe('Environment Validation', () => {
  let originalEnv: NodeJS.ProcessEnv
  let consoleLogSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    originalEnv = { ...process.env }
    // Clear all environment variables for clean testing
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('VERCEL') || 
          key.includes('DATABASE') || key.includes('AUTH')) {
        delete process.env[key]
      }
    })
    
    // Set NODE_ENV to test to suppress console output
    process.env.NODE_ENV = 'test'
    
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    process.env = originalEnv
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('detectVercelContext', () => {
    it('should detect non-Vercel environment', () => {
      const context = detectVercelContext()
      
      expect(context.isVercel).toBe(false)
      expect(context.environment).toBe('development')
      expect(context.autoProvidedVars).toEqual([])
    })

    it('should detect Vercel environment with VERCEL flag', () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_ENV = 'production'
      process.env.VERCEL_URL = 'my-app.vercel.app'
      process.env.VERCEL_REGION = 'iad1'
      
      const context = detectVercelContext()
      
      expect(context.isVercel).toBe(true)
      expect(context.environment).toBe('production')
      expect(context.deploymentType).toBe('production')
      expect(context.url).toBe('my-app.vercel.app')
      expect(context.expectedBaseUrl).toBe('https://my-app.vercel.app')
      expect(context.hasCustomDomain).toBe(false)
      expect(context.autoProvidedVars).toContain('VERCEL')
    })

    it('should detect custom domain in Vercel', () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_URL = 'example.com'
      
      const context = detectVercelContext()
      
      expect(context.hasCustomDomain).toBe(true)
      expect(context.customDomain).toBe('example.com')
    })

    it('should detect preview deployment', () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_ENV = 'preview'
      
      const context = detectVercelContext()
      
      expect(context.deploymentType).toBe('preview')
    })
  })

  describe('validateEnvironment - Simple Deployment', () => {
    beforeEach(() => {
      // Set up simple deployment (no features enabled)
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'false'
      process.env.NEXT_PUBLIC_ENABLE_AUTH = 'false'
      process.env.NEXT_PUBLIC_ENABLE_SEARCH = 'false'
      process.env.NEXT_PUBLIC_ENABLE_AI = 'false'
      process.env.NEXT_PUBLIC_ENABLE_MEDIA = 'false'
    })

    it('should pass validation with all required variables for simple deployment', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      
      const config = await validateEnvironment()
      
      expect(config.phase).toBe('simple')
      expect(config.baseUrl).toBe('https://example.com')
      expect(config.siteName).toBe('Test Site')
      expect(config.features.cms).toBe(false)
      expect(config.features.auth).toBe(false)
    })

    it('should fail validation when NEXT_PUBLIC_SITE_NAME is missing', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      // NEXT_PUBLIC_SITE_NAME is missing
      
      await expect(validateEnvironment()).rejects.toThrow(/NEXT_PUBLIC_SITE_NAME/)
    })

    it('should fail validation when NEXT_PUBLIC_BASE_URL is missing (non-Vercel)', async () => {
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      // NEXT_PUBLIC_BASE_URL is missing and not in Vercel
      
      await expect(validateEnvironment()).rejects.toThrow(/NEXT_PUBLIC_BASE_URL/)
    })

    it('should pass validation when NEXT_PUBLIC_BASE_URL is missing but in Vercel', async () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_URL = 'my-app.vercel.app'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      // NEXT_PUBLIC_BASE_URL is missing but Vercel will auto-provide
      
      const config = await validateEnvironment()
      
      expect(config.phase).toBe('simple')
      expect(config.baseUrl).toBe('https://my-app.vercel.app')
    })

    it('should fail validation with invalid URL format', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'invalid-url'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      
      await expect(validateEnvironment()).rejects.toThrow(/valid URL/)
    })

    it('should warn about localhost URL in production Vercel deployment', async () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_ENV = 'production'
      process.env.VERCEL_URL = 'my-app.vercel.app'
      process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      
      // Should not throw but should log warnings
      const config = await validateEnvironment()
      expect(config.phase).toBe('simple')
    })
  })

  describe('validateEnvironment - Full Deployment', () => {
    beforeEach(() => {
      // Set up full deployment (features enabled)
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'true'
      process.env.NEXT_PUBLIC_ENABLE_AUTH = 'true'
      process.env.NEXT_PUBLIC_ENABLE_SEARCH = 'true'
      process.env.NEXT_PUBLIC_ENABLE_AI = 'true'
      process.env.NEXT_PUBLIC_ENABLE_MEDIA = 'true'
    })

    it('should pass validation with all required variables for full deployment', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-secure'
      process.env.NEXTAUTH_URL = 'https://example.com'
      
      const config = await validateEnvironment()
      
      expect(config.phase).toBe('full')
      expect(config.features.cms).toBe(true)
      expect(config.features.auth).toBe(true)
      expect(config.database?.url).toBe('postgresql://user:pass@localhost:5432/db')
      expect(config.auth?.secret).toBe('a-very-long-secret-key-that-is-secure')
    })

    it('should fail validation when DATABASE_URL is missing', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-secure'
      process.env.NEXTAUTH_URL = 'https://example.com'
      // DATABASE_URL and DIRECT_URL are missing
      
      await expect(validateEnvironment()).rejects.toThrow(/DATABASE_URL/)
    })

    it('should fail validation when NEXTAUTH_SECRET is missing', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_URL = 'https://example.com'
      // NEXTAUTH_SECRET is missing
      
      await expect(validateEnvironment()).rejects.toThrow(/NEXTAUTH_SECRET/)
    })

    it('should warn about short NEXTAUTH_SECRET', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_SECRET = 'short' // Too short
      process.env.NEXTAUTH_URL = 'https://example.com'
      
      // Should not throw but should log warnings
      const config = await validateEnvironment()
      expect(config.phase).toBe('full')
    })

    it('should warn about CMS enabled without auth', async () => {
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'true'
      process.env.NEXT_PUBLIC_ENABLE_AUTH = 'false' // Auth disabled but CMS enabled
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      
      // Should not throw but should log warnings
      const config = await validateEnvironment()
      expect(config.features.cms).toBe(true)
      expect(config.features.auth).toBe(false)
    })

    it('should warn about AI features without API key', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-secure'
      process.env.NEXTAUTH_URL = 'https://example.com'
      // GEMINI_API_KEY is missing but AI is enabled
      
      // Should not throw but should log warnings
      const config = await validateEnvironment()
      expect(config.features.ai).toBe(true)
    })
  })

  describe('Vercel Integration Validation', () => {
    it('should validate URL mismatch in Vercel deployment', async () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_URL = 'my-app.vercel.app'
      process.env.NEXT_PUBLIC_BASE_URL = 'https://different-domain.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      
      // Should not throw but should log warnings about URL mismatch
      const config = await validateEnvironment()
      expect(config.vercelContext?.isVercel).toBe(true)
    })

    it('should handle NEXTAUTH_URL auto-generation in Vercel', async () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_URL = 'my-app.vercel.app'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      process.env.NEXT_PUBLIC_ENABLE_AUTH = 'true'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-secure'
      // NEXTAUTH_URL is missing but should be auto-generated
      
      const config = await validateEnvironment()
      expect(config.auth?.url).toBe('https://my-app.vercel.app')
    })
  })

  describe('getEnvironmentConfig', () => {
    it('should return safe configuration on validation failure', async () => {
      // No environment variables set - should fail validation but return safe config
      const config = await getEnvironmentConfig()
      
      expect(config.phase).toBe('simple')
      expect(config.baseUrl).toBe('http://localhost:3000')
      expect(config.siteName).toBe('NextGen Sustainable Research Network')
      expect(config.features.cms).toBe(false)
    })

    it('should return actual configuration on validation success', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      
      const config = await getEnvironmentConfig()
      
      expect(config.phase).toBe('simple')
      expect(config.baseUrl).toBe('https://example.com')
      expect(config.siteName).toBe('Test Site')
    })
  })

  describe('isFeatureEnabled', () => {
    it('should return false for disabled features', async () => {
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'false'
      
      const isEnabled = await isFeatureEnabled('cms')
      expect(isEnabled).toBe(false)
    })

    it('should return true for enabled features', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'true'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-secure'
      process.env.NEXTAUTH_URL = 'https://example.com'
      
      const isEnabled = await isFeatureEnabled('cms')
      expect(isEnabled).toBe(true)
    })
  })

  describe('getDeploymentPhase', () => {
    it('should return simple for no features enabled', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      
      const phase = await getDeploymentPhase()
      expect(phase).toBe('simple')
    })

    it('should return full for any feature enabled', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      process.env.NEXT_PUBLIC_ENABLE_CMS = 'true'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.DIRECT_URL = 'postgresql://user:pass@localhost:5432/db'
      process.env.NEXTAUTH_SECRET = 'a-very-long-secret-key-that-is-secure'
      process.env.NEXTAUTH_URL = 'https://example.com'
      
      const phase = await getDeploymentPhase()
      expect(phase).toBe('full')
    })
  })

  describe('checkClientEnvironment', () => {
    let windowSpy: jest.SpyInstance

    beforeEach(() => {
      windowSpy = jest.spyOn(global, 'window', 'get')
    })

    afterEach(() => {
      windowSpy.mockRestore()
    })

    it('should not run on server side', () => {
      windowSpy.mockImplementation(() => undefined)
      
      // Should not throw or log anything
      expect(() => checkClientEnvironment()).not.toThrow()
    })

    it('should warn about missing client variables in development', () => {
      windowSpy.mockImplementation(() => ({}))
      process.env.NODE_ENV = 'development'
      
      checkClientEnvironment()
      
      // Should log warnings about missing variables
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should not warn in production', () => {
      windowSpy.mockImplementation(() => ({}))
      process.env.NODE_ENV = 'production'
      
      checkClientEnvironment()
      
      // Should not log warnings in production
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed environment variables gracefully', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'not-a-url'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      
      await expect(validateEnvironment()).rejects.toThrow()
    })

    it('should handle missing feature flag values', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      // Feature flags are undefined (not explicitly set to false)
      
      const config = await validateEnvironment()
      expect(config.phase).toBe('simple')
      expect(config.features.cms).toBe(false)
    })

    it('should handle empty string environment variables', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = ''
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      
      await expect(validateEnvironment()).rejects.toThrow()
    })

    it('should handle whitespace-only environment variables', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = '   '
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'
      
      await expect(validateEnvironment()).rejects.toThrow()
    })
  })
})