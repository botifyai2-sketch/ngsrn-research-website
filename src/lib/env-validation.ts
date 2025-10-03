/**
 * Environment Variable Validation for NGSRN Website
 * Validates required environment variables based on deployment phase with Vercel integration
 */

import { envFileManager, loadEnvironmentWithPriority } from './env-file-manager';

export interface VercelContext {
  isVercel: boolean;
  environment: string;
  url?: string;
  region?: string;
  deploymentType?: 'production' | 'preview' | 'development';
  hasCustomDomain?: boolean;
  customDomain?: string;
  expectedBaseUrl?: string;
  expectedAuthUrl?: string;
  autoProvidedVars: string[];
}

export interface EnvironmentConfig {
  phase: 'simple' | 'full';
  baseUrl: string;
  siteName: string;
  features: {
    cms: boolean;
    auth: boolean;
    search: boolean;
    ai: boolean;
    media: boolean;
  };
  analytics?: {
    googleAnalyticsId?: string;
    hotjarId?: string;
  };
  database?: {
    url?: string;
    directUrl?: string;
  };
  auth?: {
    secret?: string;
    url?: string;
  };
  vercelContext?: VercelContext;
}

export interface ValidationError {
  variable: string;
  type: 'missing_required' | 'invalid_format' | 'feature_config' | 'security_warning';
  message: string;
  description: string;
  setupInstructions: string;
  severity: 'error' | 'warning';
}

/**
 * Required environment variables for each deployment phase
 */
const REQUIRED_VARS = {
  simple: [
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_SITE_NAME'
  ],
  full: [
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_SITE_NAME',
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]
} as const;

/**
 * Feature flag environment variables
 */
const FEATURE_FLAGS = [
  'NEXT_PUBLIC_ENABLE_CMS',
  'NEXT_PUBLIC_ENABLE_AUTH',
  'NEXT_PUBLIC_ENABLE_SEARCH',
  'NEXT_PUBLIC_ENABLE_AI',
  'NEXT_PUBLIC_ENABLE_MEDIA'
] as const;

/**
 * Detects Vercel deployment context
 */
export function detectVercelContext(): VercelContext {
  const isVercel = !!(process.env.VERCEL || process.env.VERCEL_URL);
  const vercelEnv = process.env.VERCEL_ENV || 'development';
  const vercelUrl = process.env.VERCEL_URL;
  
  const context: VercelContext = {
    isVercel,
    environment: vercelEnv,
    url: vercelUrl,
    region: process.env.VERCEL_REGION,
    autoProvidedVars: []
  };
  
  if (isVercel) {
    context.deploymentType = vercelEnv === 'production' ? 'production' : 
                            vercelEnv === 'preview' ? 'preview' : 'development';
    
    if (vercelUrl) {
      context.expectedBaseUrl = `https://${vercelUrl}`;
      context.expectedAuthUrl = `https://${vercelUrl}`;
      context.hasCustomDomain = !vercelUrl.includes('.vercel.app');
      if (context.hasCustomDomain) {
        context.customDomain = vercelUrl;
      }
    }
    
    // List of Vercel auto-provided variables
    const vercelAutoVars = [
      'VERCEL', 'VERCEL_URL', 'VERCEL_ENV', 'VERCEL_REGION',
      'VERCEL_GIT_COMMIT_SHA', 'VERCEL_GIT_COMMIT_MESSAGE',
      'VERCEL_GIT_COMMIT_AUTHOR_LOGIN', 'VERCEL_GIT_COMMIT_AUTHOR_NAME',
      'VERCEL_GIT_PREVIOUS_SHA', 'VERCEL_GIT_PROVIDER',
      'VERCEL_GIT_REPO_ID', 'VERCEL_GIT_REPO_OWNER', 'VERCEL_GIT_REPO_SLUG'
    ];
    
    context.autoProvidedVars = vercelAutoVars.filter(varName => process.env[varName]);
  }
  
  return context;
}

/**
 * Validates environment variables for the current deployment with Vercel integration
 */
export async function validateEnvironment(): Promise<EnvironmentConfig> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Load environment variables with priority
  const priorityEnv = await loadEnvironmentWithPriority();
  
  // Merge with process.env (process.env takes precedence for runtime variables)
  const env = { ...priorityEnv, ...process.env };

  // Detect Vercel context
  const vercelContext = detectVercelContext();

  // Determine deployment phase based on feature flags
  const features = {
    cms: env.NEXT_PUBLIC_ENABLE_CMS === 'true',
    auth: env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
    search: env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
    ai: env.NEXT_PUBLIC_ENABLE_AI === 'true',
    media: env.NEXT_PUBLIC_ENABLE_MEDIA === 'true'
  };

  const hasAnyFeature = Object.values(features).some(Boolean);
  const phase: 'simple' | 'full' = hasAnyFeature ? 'full' : 'simple';

  // Validate required variables with Vercel-aware error information
  const requiredVars = REQUIRED_VARS[phase];
  requiredVars.forEach(varName => {
    if (!env[varName]) {
      // Check if Vercel can auto-provide this variable
      const canAutoProvide = (varName === 'NEXT_PUBLIC_BASE_URL' || varName === 'NEXTAUTH_URL') && 
                            vercelContext.isVercel && vercelContext.expectedBaseUrl;
      
      if (canAutoProvide) {
        // Variable will be auto-provided by Vercel
        if (env.NODE_ENV !== 'test') {
          console.log(`ℹ️  ${varName} will be auto-generated from VERCEL_URL: ${vercelContext.expectedBaseUrl}`);
        }
        return;
      }
      
      errors.push({
        variable: varName,
        type: 'missing_required',
        message: `Missing required environment variable: ${varName}`,
        description: getVariableDescription(varName),
        setupInstructions: getSetupInstructions(varName, vercelContext),
        severity: 'error'
      });
    }
  });

  // Validate base URL format with Vercel integration
  const baseUrl = env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl && !isValidUrl(baseUrl)) {
    errors.push({
      variable: 'NEXT_PUBLIC_BASE_URL',
      type: 'invalid_format',
      message: 'NEXT_PUBLIC_BASE_URL must be a valid URL',
      description: 'The base URL must include protocol (http:// or https://) and be properly formatted',
      setupInstructions: 'Use format: https://yourdomain.com (no trailing slash)',
      severity: 'error'
    });
  } else if (baseUrl && vercelContext.isVercel) {
    // Validate Vercel URL compatibility
    if (baseUrl.includes('localhost') && vercelContext.environment === 'production') {
      warnings.push({
        variable: 'NEXT_PUBLIC_BASE_URL',
        type: 'invalid_format',
        message: 'Base URL is set to localhost but deploying to production',
        description: 'Production deployments should not use localhost URLs',
        setupInstructions: 'Remove NEXT_PUBLIC_BASE_URL to use Vercel auto-generated URL or set to production domain',
        severity: 'warning'
      });
    } else if (vercelContext.expectedBaseUrl && baseUrl !== vercelContext.expectedBaseUrl && !vercelContext.hasCustomDomain) {
      warnings.push({
        variable: 'NEXT_PUBLIC_BASE_URL',
        type: 'invalid_format',
        message: 'Base URL does not match Vercel deployment URL',
        description: `Expected: ${vercelContext.expectedBaseUrl}, Got: ${baseUrl}`,
        setupInstructions: 'Update URL to match Vercel deployment or remove to use auto-generated URL',
        severity: 'warning'
      });
    }
  }

  // Validate feature-specific requirements with detailed warnings
  if (features.cms && !features.auth) {
    warnings.push({
      variable: 'NEXT_PUBLIC_ENABLE_AUTH',
      type: 'security_warning',
      message: 'CMS is enabled but authentication is disabled',
      description: 'This may cause security issues as CMS content could be publicly editable',
      setupInstructions: 'Set NEXT_PUBLIC_ENABLE_AUTH="true" or disable CMS with NEXT_PUBLIC_ENABLE_CMS="false"',
      severity: 'warning'
    });
  }

  if (features.auth && phase === 'full') {
    if (!env.NEXTAUTH_SECRET) {
      errors.push({
        variable: 'NEXTAUTH_SECRET',
        type: 'missing_required',
        message: 'NEXTAUTH_SECRET is required when authentication is enabled',
        description: 'A secure secret key for encrypting authentication sessions',
        setupInstructions: 'Generate with: openssl rand -base64 32, then set in environment variables',
        severity: 'error'
      });
    } else if (env.NEXTAUTH_SECRET.length < 32) {
      warnings.push({
        variable: 'NEXTAUTH_SECRET',
        type: 'security_warning',
        message: 'NEXTAUTH_SECRET is too short for secure authentication',
        description: 'Authentication secret should be at least 32 characters for security',
        setupInstructions: 'Generate a longer secret with: openssl rand -base64 32',
        severity: 'warning'
      });
    }
    
    if (!env.NEXTAUTH_URL) {
      errors.push({
        variable: 'NEXTAUTH_URL',
        type: 'missing_required',
        message: 'NEXTAUTH_URL is required when authentication is enabled',
        description: 'The canonical URL for authentication callbacks and redirects',
        setupInstructions: 'Set to your domain URL (same as NEXT_PUBLIC_BASE_URL)',
        severity: 'error'
      });
    }
  }

  if (features.search && phase === 'full' && !env.DATABASE_URL && !env.ELASTICSEARCH_URL) {
    warnings.push({
      variable: 'DATABASE_URL',
      type: 'feature_config',
      message: 'Search is enabled but no search backend is configured',
      description: 'Search functionality requires either a database or Elasticsearch connection',
      setupInstructions: 'Set DATABASE_URL for database search or ELASTICSEARCH_URL for Elasticsearch',
      severity: 'warning'
    });
  }

  if (features.ai && !env.GEMINI_API_KEY) {
    warnings.push({
      variable: 'GEMINI_API_KEY',
      type: 'feature_config',
      message: 'AI features are enabled but GEMINI_API_KEY is not configured',
      description: 'AI-powered features require a Google Gemini API key',
      setupInstructions: 'Get API key from Google AI Studio and set GEMINI_API_KEY',
      severity: 'warning'
    });
  }

  // Log validation results with enhanced formatting
  if (env.NODE_ENV !== 'test') {
    console.log(`🔍 Environment validation for ${phase} deployment:`);
    
    if (errors.length > 0) {
      console.error('❌ Validation errors:');
      errors.forEach(error => {
        console.error(`\n  Variable: ${error.variable}`);
        console.error(`  Issue: ${error.message}`);
        console.error(`  Description: ${error.description}`);
        console.error(`  Setup: ${error.setupInstructions}`);
      });
      
      console.error('\n💡 For detailed troubleshooting, see: ENVIRONMENT_TROUBLESHOOTING_GUIDE.md');
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️  Validation warnings:');
      warnings.forEach(warning => {
        console.warn(`\n  Variable: ${warning.variable}`);
        console.warn(`  Issue: ${warning.message}`);
        console.warn(`  Description: ${warning.description}`);
        console.warn(`  Setup: ${warning.setupInstructions}`);
      });
    }
    
    if (errors.length === 0) {
      console.log('✅ Environment validation passed');
    }
  }

  // Throw error if validation fails
  if (errors.length > 0) {
    const errorMessages = errors.map(e => `${e.variable}: ${e.message}`);
    throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}\n\nSee ENVIRONMENT_TROUBLESHOOTING_GUIDE.md for detailed setup instructions.`);
  }

  // Build configuration object with Vercel context
  const config: EnvironmentConfig = {
    phase,
    baseUrl: baseUrl || vercelContext.expectedBaseUrl || 'http://localhost:3000',
    siteName: env.NEXT_PUBLIC_SITE_NAME || 'NextGen Sustainable Research Network',
    features,
    analytics: {
      googleAnalyticsId: env.NEXT_PUBLIC_GA_ID,
      hotjarId: env.NEXT_PUBLIC_HOTJAR_ID
    },
    vercelContext
  };

  if (phase === 'full') {
    config.database = {
      url: env.DATABASE_URL,
      directUrl: env.DIRECT_URL
    };
    config.auth = {
      secret: env.NEXTAUTH_SECRET,
      url: env.NEXTAUTH_URL || vercelContext.expectedAuthUrl
    };
  }

  return config;
}

/**
 * Gets the current environment configuration
 */
export async function getEnvironmentConfig(): Promise<EnvironmentConfig> {
  try {
    return await validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    // Return minimal safe configuration
    return {
      phase: 'simple',
      baseUrl: 'http://localhost:3000',
      siteName: 'NextGen Sustainable Research Network',
      features: {
        cms: false,
        auth: false,
        search: false,
        ai: false,
        media: false
      }
    };
  }
}

/**
 * Checks if a feature is enabled
 */
export async function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): Promise<boolean> {
  const config = await getEnvironmentConfig();
  return config.features[feature];
}

/**
 * Gets the deployment phase
 */
export async function getDeploymentPhase(): Promise<'simple' | 'full'> {
  const config = await getEnvironmentConfig();
  return config.phase;
}

/**
 * Get detailed description for environment variables
 */
function getVariableDescription(varName: string): string {
  const descriptions: Record<string, string> = {
    'NEXT_PUBLIC_BASE_URL': 'The base URL of your application (e.g., https://your-app.vercel.app)',
    'NEXT_PUBLIC_SITE_NAME': 'The display name of your website',
    'DATABASE_URL': 'PostgreSQL database connection string for Prisma',
    'DIRECT_URL': 'Direct database connection string for migrations and connection pooling',
    'NEXTAUTH_SECRET': 'Secret key for NextAuth.js session encryption',
    'NEXTAUTH_URL': 'Canonical URL for NextAuth.js callbacks',
    'GEMINI_API_KEY': 'Google Gemini AI API key for AI features',
    'NEXT_PUBLIC_GA_ID': 'Google Analytics 4 measurement ID'
  };
  
  return descriptions[varName] || `Configuration for ${varName}`;
}

/**
 * Get setup instructions for environment variables with Vercel context
 */
function getSetupInstructions(varName: string, vercelContext?: VercelContext): string {
  const baseInstructions: Record<string, string> = {
    'NEXT_PUBLIC_BASE_URL': 'Set to your domain URL with protocol (https://yourdomain.com)',
    'NEXT_PUBLIC_SITE_NAME': 'Set to your website name (e.g., "My Research Website")',
    'DATABASE_URL': 'Get from your PostgreSQL provider (Vercel Postgres, Supabase, etc.)',
    'DIRECT_URL': 'Usually same as DATABASE_URL unless using connection pooling',
    'NEXTAUTH_SECRET': 'Generate with: openssl rand -base64 32',
    'NEXTAUTH_URL': 'Set to same value as NEXT_PUBLIC_BASE_URL',
    'GEMINI_API_KEY': 'Get from Google AI Studio (https://aistudio.google.com/)',
    'NEXT_PUBLIC_GA_ID': 'Get from Google Analytics dashboard (format: G-XXXXXXXXXX)'
  };
  
  let instruction = baseInstructions[varName] || `Set ${varName} in your environment variables`;
  
  // Add Vercel-specific instructions
  if (vercelContext?.isVercel) {
    if (varName === 'NEXT_PUBLIC_BASE_URL' && vercelContext.expectedBaseUrl) {
      instruction += ` (Vercel will auto-generate: ${vercelContext.expectedBaseUrl})`;
    } else if (varName === 'NEXTAUTH_URL' && vercelContext.expectedAuthUrl) {
      instruction += ` (Vercel will auto-generate: ${vercelContext.expectedAuthUrl})`;
    }
    instruction += '. Set in Vercel dashboard under Project Settings > Environment Variables';
  }
  
  return instruction;
}

/**
 * Validates URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Runtime environment check for client-side code
 */
export function checkClientEnvironment(): void {
  if (typeof window === 'undefined') return;

  const requiredClientVars = [
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_SITE_NAME'
  ];

  const missing = requiredClientVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Missing client-side environment variables:', missing);
  }
}

// Export types for use in other modules
export type DeploymentPhase = 'simple' | 'full';
export type FeatureFlag = keyof EnvironmentConfig['features'];