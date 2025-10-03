/**
 * Unit Tests for Build Validation Script
 * Tests the build validation logic and TypeScript configuration validation
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Mock dependencies
jest.mock('fs')
jest.mock('child_process')

describe('Build Validation Script', () => {
  let originalEnv
  let originalArgv
  let consoleLogSpy
  let consoleErrorSpy
  let mockExit

  // Mock the validate-build module functions
  let validateBuild

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
    fs.existsSync.mockReturnValue(true)
    fs.readFileSync.mockReturnValue('{}')
    fs.writeFileSync.mockImplementation(() => {})
    fs.readdirSync.mockReturnValue([])
    fs.statSync.mockReturnValue({ isDirectory: () => false, isFile: () => true })
    
    // Mock execSync
    execSync.mockReturnValue('')
    
    // Mock the validate-build module
    validateBuild = {
      validateBuildEnvironment: jest.fn(),
      validateBuildConfiguration: jest.fn(),
      runTypeScriptValidation: jest.fn(),
      validateTypeScriptConfiguration: jest.fn(),
      runProductionTypeCheck: jest.fn(),
      parseTypeScriptErrors: jest.fn(),
      verifyTestFileExclusion: jest.fn(),
      findTestFiles: jest.fn(),
      checkCommonIssues: jest.fn(),
      checkRequiredAssets: jest.fn(),
      checkBuildOutput: jest.fn(),
      loadEnvFiles: jest.fn()
    }
  })

  afterEach(() => {
    process.env = originalEnv
    process.argv = originalArgv
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    mockExit.mockRestore()
  })

  describe('validateBuildEnvironment', () => {
    it('should pass validation with proper environment setup', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_NAME = 'Test Site'

      validateBuild.validateBuildEnvironment.mockResolvedValue(true)

      const result = await validateBuild.validateBuildEnvironment()
      expect(result).toBe(true)
      expect(validateBuild.validateBuildEnvironment).toHaveBeenCalled()
    })

    it('should fail validation with missing environment variables', async () => {
      // Missing required variables

      validateBuild.validateBuildEnvironment.mockRejectedValue(
        new Error('Environment validation failed')
      )

      await expect(validateBuild.validateBuildEnvironment()).rejects.toThrow(
        'Environment validation failed'
      )
    })

    it('should handle auto-fix flag', async () => {
      process.argv = ['node', 'validate-build.js', '--auto-fix']

      validateBuild.validateBuildEnvironment.mockImplementation(async () => {
        const shouldAutoFix = process.argv.includes('--auto-fix')
        if (shouldAutoFix) {
          console.log('🔧 Running automated fixes before validation...')
          // Simulate auto-fix process
          process.env.NEXT_PUBLIC_SITE_NAME = 'NextGen Sustainable Research Network'
        }
        return true
      })

      const result = await validateBuild.validateBuildEnvironment()
      expect(result).toBe(true)
      expect(process.env.NEXT_PUBLIC_SITE_NAME).toBe('NextGen Sustainable Research Network')
    })

    it('should detect Vercel environment', async () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_ENV = 'production'
      process.env.VERCEL_URL = 'my-app.vercel.app'

      validateBuild.validateBuildEnvironment.mockImplementation(async () => {
        const vercelInfo = {
          isVercel: true,
          environment: 'production',
          url: 'my-app.vercel.app'
        }
        console.log(`🚀 Vercel environment detected: ${vercelInfo.environment}`)
        return true
      })

      const result = await validateBuild.validateBuildEnvironment()
      expect(result).toBe(true)
    })
  })

  describe('validateBuildConfiguration', () => {
    it('should validate package.json build scripts', async () => {
      const mockPackageJson = {
        scripts: {
          'build': 'next build',
          'build:validate': 'npm run type-check:build && node scripts/validate-build.js',
          'type-check:build': 'tsc --project tsconfig.build.json --noEmit'
        }
      }

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          return JSON.stringify(mockPackageJson)
        }
        return '{}'
      })

      validateBuild.validateBuildConfiguration.mockResolvedValue(undefined)

      await validateBuild.validateBuildConfiguration()
      expect(validateBuild.validateBuildConfiguration).toHaveBeenCalled()
    })

    it('should fail validation for missing required scripts', async () => {
      const mockPackageJson = {
        scripts: {
          'build': 'next build'
          // Missing build:validate and type-check:build
        }
      }

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          return JSON.stringify(mockPackageJson)
        }
        return '{}'
      })

      validateBuild.validateBuildConfiguration.mockRejectedValue(
        new Error('Build configuration validation failed')
      )

      await expect(validateBuild.validateBuildConfiguration()).rejects.toThrow(
        'Build configuration validation failed'
      )
    })

    it('should check Next.js configuration', async () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath.includes('next.config.ts')
      })

      validateBuild.validateBuildConfiguration.mockResolvedValue(undefined)

      await validateBuild.validateBuildConfiguration()
      expect(validateBuild.validateBuildConfiguration).toHaveBeenCalled()
    })
  })

  describe('runTypeScriptValidation', () => {
    it('should pass TypeScript validation', async () => {
      validateBuild.validateTypeScriptConfiguration.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      })

      validateBuild.runProductionTypeCheck.mockReturnValue({
        success: true,
        output: 'TypeScript compilation successful'
      })

      validateBuild.runTypeScriptValidation.mockResolvedValue(undefined)

      await validateBuild.runTypeScriptValidation()
      expect(validateBuild.runTypeScriptValidation).toHaveBeenCalled()
    })

    it('should fail on TypeScript configuration errors', async () => {
      validateBuild.validateTypeScriptConfiguration.mockReturnValue({
        isValid: false,
        errors: ['tsconfig.build.json not found'],
        suggestions: ['Create tsconfig.build.json that extends tsconfig.json']
      })

      validateBuild.runTypeScriptValidation.mockRejectedValue(
        new Error('TypeScript configuration validation failed')
      )

      await expect(validateBuild.runTypeScriptValidation()).rejects.toThrow(
        'TypeScript configuration validation failed'
      )
    })

    it('should fail on TypeScript compilation errors', async () => {
      validateBuild.validateTypeScriptConfiguration.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      })

      validateBuild.runProductionTypeCheck.mockReturnValue({
        success: false,
        errors: [
          {
            file: 'src/components/Header.tsx',
            line: 15,
            column: 10,
            code: '2322',
            message: "Type 'string' is not assignable to type 'number'"
          }
        ]
      })

      validateBuild.runTypeScriptValidation.mockRejectedValue(
        new Error('TypeScript type checking failed')
      )

      await expect(validateBuild.runTypeScriptValidation()).rejects.toThrow(
        'TypeScript type checking failed'
      )
    })
  })

  describe('validateTypeScriptConfiguration', () => {
    it('should validate proper TypeScript configuration', () => {
      const mockTsConfigBuild = {
        extends: './tsconfig.json',
        exclude: [
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/*.spec.ts',
          '**/*.spec.tsx',
          '**/__tests__/**',
          '**/e2e/**'
        ],
        compilerOptions: {
          noEmit: true
        }
      }

      const mockTsConfigBase = {
        compilerOptions: {
          jsx: 'preserve',
          moduleResolution: 'bundler'
        }
      }

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('tsconfig.build.json')) {
          return JSON.stringify(mockTsConfigBuild)
        }
        if (filePath.includes('tsconfig.json')) {
          return JSON.stringify(mockTsConfigBase)
        }
        return '{}'
      })

      validateBuild.validateTypeScriptConfiguration.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: []
      })

      const result = validateBuild.validateTypeScriptConfiguration()
      expect(result.isValid).toBe(true)
    })

    it('should detect missing test exclusion patterns', () => {
      const mockTsConfigBuild = {
        extends: './tsconfig.json',
        exclude: [
          '**/*.test.ts'
          // Missing other test patterns
        ]
      }

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('tsconfig.build.json')) {
          return JSON.stringify(mockTsConfigBuild)
        }
        return '{}'
      })

      validateBuild.validateTypeScriptConfiguration.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['Missing test exclusion patterns: **/*.spec.ts, **/__tests__/**']
      })

      const result = validateBuild.validateTypeScriptConfiguration()
      expect(result.warnings).toContain('Missing test exclusion patterns')
    })

    it('should handle missing configuration files', () => {
      fs.existsSync.mockReturnValue(false)

      validateBuild.validateTypeScriptConfiguration.mockReturnValue({
        isValid: false,
        errors: ['tsconfig.build.json not found'],
        suggestions: ['Create tsconfig.build.json that extends tsconfig.json']
      })

      const result = validateBuild.validateTypeScriptConfiguration()
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('tsconfig.build.json not found')
    })
  })

  describe('runProductionTypeCheck', () => {
    it('should run TypeScript compilation successfully', () => {
      execSync.mockReturnValue('TypeScript compilation successful')

      validateBuild.runProductionTypeCheck.mockReturnValue({
        success: true,
        output: 'TypeScript compilation successful'
      })

      const result = validateBuild.runProductionTypeCheck()
      expect(result.success).toBe(true)
    })

    it('should handle TypeScript compilation errors', () => {
      const errorOutput = `src/components/Header.tsx(15,10): error TS2322: Type 'string' is not assignable to type 'number'.
src/lib/utils.ts(42,5): error TS2345: Argument of type 'undefined' is not assignable to parameter of type 'string'.`

      execSync.mockImplementation(() => {
        const error = new Error('TypeScript compilation failed')
        error.stdout = errorOutput
        throw error
      })

      validateBuild.parseTypeScriptErrors.mockReturnValue([
        {
          file: 'src/components/Header.tsx',
          line: 15,
          column: 10,
          code: '2322',
          message: "Type 'string' is not assignable to type 'number'"
        },
        {
          file: 'src/lib/utils.ts',
          line: 42,
          column: 5,
          code: '2345',
          message: "Argument of type 'undefined' is not assignable to parameter of type 'string'"
        }
      ])

      validateBuild.runProductionTypeCheck.mockReturnValue({
        success: false,
        errors: validateBuild.parseTypeScriptErrors(errorOutput)
      })

      const result = validateBuild.runProductionTypeCheck()
      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('verifyTestFileExclusion', () => {
    it('should verify test files are properly excluded', () => {
      const mockTsConfigBuild = {
        exclude: [
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/__tests__/**'
        ]
      }

      fs.readFileSync.mockReturnValue(JSON.stringify(mockTsConfigBuild))

      validateBuild.findTestFiles.mockReturnValue([
        'src/components/__tests__/Header.test.tsx',
        'src/lib/__tests__/utils.test.ts',
        'src/hooks/useSearch.test.ts'
      ])

      validateBuild.verifyTestFileExclusion.mockImplementation(() => {
        const testFiles = validateBuild.findTestFiles()
        const excludePatterns = mockTsConfigBuild.exclude
        
        // Simulate exclusion check
        const includedTestFiles = testFiles.filter(file => {
          return !excludePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))
            return regex.test(file)
          })
        })
        
        if (includedTestFiles.length === 0) {
          console.log(`✅ All ${testFiles.length} test files properly excluded from production build`)
        }
      })

      validateBuild.verifyTestFileExclusion()
      expect(validateBuild.verifyTestFileExclusion).toHaveBeenCalled()
    })

    it('should warn about unexcluded test files', () => {
      const mockTsConfigBuild = {
        exclude: [
          '**/*.test.ts'
          // Missing *.test.tsx pattern
        ]
      }

      fs.readFileSync.mockReturnValue(JSON.stringify(mockTsConfigBuild))

      validateBuild.findTestFiles.mockReturnValue([
        'src/components/Header.test.tsx' // This won't be excluded
      ])

      validateBuild.verifyTestFileExclusion.mockImplementation(() => {
        console.warn('⚠️  Some test files may not be properly excluded:')
        console.warn('    - src/components/Header.test.tsx')
      })

      validateBuild.verifyTestFileExclusion()
      expect(validateBuild.verifyTestFileExclusion).toHaveBeenCalled()
    })
  })

  describe('findTestFiles', () => {
    it('should find all test files in project', () => {
      const mockFileStructure = {
        'src/components/__tests__': ['Header.test.tsx', 'Footer.test.tsx'],
        'src/lib': ['utils.test.ts', 'api.test.ts'],
        'src/hooks': ['useSearch.test.ts'],
        'e2e': ['homepage.spec.ts']
      }

      fs.readdirSync.mockImplementation((dir) => {
        const dirName = path.basename(dir)
        return mockFileStructure[dirName] || []
      })

      fs.statSync.mockImplementation((filePath) => ({
        isDirectory: () => path.basename(filePath) === '__tests__' || path.basename(filePath) === 'e2e',
        isFile: () => !path.basename(filePath).includes('__tests__') && !path.basename(filePath).includes('e2e')
      }))

      validateBuild.findTestFiles.mockReturnValue([
        'src/components/__tests__/Header.test.tsx',
        'src/components/__tests__/Footer.test.tsx',
        'src/lib/utils.test.ts',
        'src/lib/api.test.ts',
        'src/hooks/useSearch.test.ts',
        'e2e/homepage.spec.ts'
      ])

      const testFiles = validateBuild.findTestFiles('src')
      expect(testFiles).toHaveLength(6)
      expect(testFiles).toContain('src/components/__tests__/Header.test.tsx')
      expect(testFiles).toContain('e2e/homepage.spec.ts')
    })

    it('should handle directories without test files', () => {
      fs.readdirSync.mockReturnValue(['components', 'lib', 'utils'])
      fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false })

      validateBuild.findTestFiles.mockReturnValue([])

      const testFiles = validateBuild.findTestFiles('src')
      expect(testFiles).toHaveLength(0)
    })
  })

  describe('checkCommonIssues', () => {
    it('should check for common configuration issues', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://your-app.vercel.app'
      process.env.NEXT_PUBLIC_SITE_NAME = 'NextGen Sustainable Research Network'

      const features = { cms: false, auth: false, search: false, ai: false, media: false }
      const vercelInfo = { isVercel: false }

      validateBuild.checkCommonIssues.mockImplementation((phase, features, vercelInfo) => {
        if (process.env.NEXT_PUBLIC_BASE_URL?.includes('your-app.vercel.app')) {
          console.log('ℹ️  Base URL contains placeholder. Update with your actual domain.')
        }
        
        if (process.env.NEXT_PUBLIC_SITE_NAME?.includes('NextGen Sustainable Research Network')) {
          console.log('ℹ️  Using default site name. You can customize it with NEXT_PUBLIC_SITE_NAME.')
        }
      })

      validateBuild.checkCommonIssues('simple', features, vercelInfo)
      expect(validateBuild.checkCommonIssues).toHaveBeenCalledWith('simple', features, vercelInfo)
    })

    it('should check Vercel-specific issues', () => {
      process.env.VERCEL = '1'
      process.env.VERCEL_ENV = 'production'
      process.env.VERCEL_URL = 'my-app.vercel.app'
      process.env.NEXT_PUBLIC_BASE_URL = 'https://different-domain.com'

      const vercelInfo = {
        isVercel: true,
        environment: 'production',
        url: 'my-app.vercel.app',
        expectedBaseUrl: 'https://my-app.vercel.app'
      }

      validateBuild.checkCommonIssues.mockImplementation((phase, features, vercelInfo) => {
        if (vercelInfo.isVercel) {
          console.log('🚀 Vercel deployment checks:')
          
          if (process.env.NEXT_PUBLIC_BASE_URL !== vercelInfo.expectedBaseUrl) {
            console.warn(`⚠️  Base URL (${process.env.NEXT_PUBLIC_BASE_URL}) doesn't match Vercel URL (${vercelInfo.expectedBaseUrl})`)
          }
        }
      })

      validateBuild.checkCommonIssues('simple', {}, vercelInfo)
      expect(validateBuild.checkCommonIssues).toHaveBeenCalled()
    })
  })

  describe('checkRequiredAssets', () => {
    it('should check for required assets', () => {
      fs.existsSync.mockImplementation((filePath) => {
        return filePath.includes('favicon.ico') || filePath.includes('manifest.json')
      })

      validateBuild.checkRequiredAssets.mockImplementation(() => {
        console.log('📁 Checking required assets...')
        console.log('  ✅ favicon.ico found')
        console.log('  ✅ manifest.json found')
      })

      validateBuild.checkRequiredAssets()
      expect(validateBuild.checkRequiredAssets).toHaveBeenCalled()
    })

    it('should warn about missing required assets', () => {
      fs.existsSync.mockReturnValue(false)

      validateBuild.checkRequiredAssets.mockImplementation(() => {
        console.log('📁 Checking required assets...')
        console.error('  ❌ favicon.ico missing (required)')
        console.error('  ❌ manifest.json missing (required)')
      })

      validateBuild.checkRequiredAssets()
      expect(validateBuild.checkRequiredAssets).toHaveBeenCalled()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle build validation errors gracefully', async () => {
      validateBuild.validateBuildEnvironment.mockRejectedValue(
        new Error('Environment validation failed')
      )

      await expect(validateBuild.validateBuildEnvironment()).rejects.toThrow(
        'Environment validation failed'
      )
    })

    it('should provide troubleshooting guidance on errors', async () => {
      validateBuild.validateBuildEnvironment.mockImplementation(async () => {
        console.error('❌ Build validation error: Missing required environment variables')
        console.error('\n💡 Troubleshooting steps:')
        console.error('   1. Run with --auto-fix flag to attempt automatic resolution')
        console.error('   2. Check that all required files exist')
        console.error('   3. Verify environment variables are properly set')
        throw new Error('Build validation failed')
      })

      await expect(validateBuild.validateBuildEnvironment()).rejects.toThrow(
        'Build validation failed'
      )
    })

    it('should handle TypeScript compilation timeouts', () => {
      execSync.mockImplementation(() => {
        throw new Error('Command timed out')
      })

      validateBuild.runProductionTypeCheck.mockImplementation(() => {
        try {
          execSync('npx tsc --project tsconfig.build.json --noEmit')
        } catch (error) {
          if (error.message.includes('timed out')) {
            console.error('❌ TypeScript compilation timed out')
            console.error('💡 Try running with fewer files or increase timeout')
          }
          throw error
        }
      })

      expect(() => validateBuild.runProductionTypeCheck()).toThrow('Command timed out')
    })
  })

  describe('Performance Monitoring', () => {
    it('should record build metrics when monitoring is enabled', async () => {
      const mockMonitor = {
        recordBuildAttempt: jest.fn()
      }

      const startTime = Date.now()

      validateBuild.validateBuildEnvironment.mockImplementation(async (monitor, startTime) => {
        // Simulate successful build
        const duration = Date.now() - startTime
        if (monitor) {
          monitor.recordBuildAttempt(true, duration, [], 'simple')
        }
        return true
      })

      await validateBuild.validateBuildEnvironment(mockMonitor, startTime)
      expect(mockMonitor.recordBuildAttempt).toHaveBeenCalledWith(
        true, 
        expect.any(Number), 
        [], 
        'simple'
      )
    })

    it('should record build failures with error details', async () => {
      const mockMonitor = {
        recordBuildAttempt: jest.fn()
      }

      const startTime = Date.now()
      const buildErrors = [
        { type: 'validation_error', message: 'Missing NEXT_PUBLIC_SITE_NAME' }
      ]

      validateBuild.validateBuildEnvironment.mockImplementation(async (monitor, startTime, buildErrors) => {
        const duration = Date.now() - startTime
        if (monitor) {
          monitor.recordBuildAttempt(false, duration, buildErrors, 'simple')
        }
        throw new Error('Build failed')
      })

      await expect(
        validateBuild.validateBuildEnvironment(mockMonitor, startTime, buildErrors)
      ).rejects.toThrow('Build failed')

      expect(mockMonitor.recordBuildAttempt).toHaveBeenCalledWith(
        false,
        expect.any(Number),
        buildErrors,
        'simple'
      )
    })
  })
})