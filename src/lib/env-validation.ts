/**
 * Environment Variable Validation for NGSRN Website
 * Validates required environment variables based on deployment phase
 */

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
 * Validates environment variables for the current deployment
 */
export function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Determine deployment phase based on feature flags
  const features = {
    cms: process.env.NEXT_PUBLIC_ENABLE_CMS === 'true',
    auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
    search: process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
    ai: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
    media: process.env.NEXT_PUBLIC_ENABLE_MEDIA === 'true'
  };

  const hasAnyFeature = Object.values(features).some(Boolean);
  const phase: 'simple' | 'full' = hasAnyFeature ? 'full' : 'simple';

  // Validate required variables
  const requiredVars = REQUIRED_VARS[phase];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Validate base URL format
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl && !isValidUrl(baseUrl)) {
    errors.push('NEXT_PUBLIC_BASE_URL must be a valid URL');
  }

  // Validate feature-specific requirements
  if (features.cms && !features.auth) {
    warnings.push('CMS is enabled but authentication is disabled. This may cause security issues.');
  }

  if (features.auth && phase === 'full') {
    if (!process.env.NEXTAUTH_SECRET) {
      errors.push('NEXTAUTH_SECRET is required when authentication is enabled');
    }
    if (!process.env.NEXTAUTH_URL) {
      errors.push('NEXTAUTH_URL is required when authentication is enabled');
    }
  }

  if (features.search && phase === 'full' && !process.env.DATABASE_URL && !process.env.ELASTICSEARCH_URL) {
    warnings.push('Search is enabled but no search backend (database or Elasticsearch) is configured');
  }

  if (features.ai && !process.env.GEMINI_API_KEY) {
    warnings.push('AI features are enabled but GEMINI_API_KEY is not configured');
  }

  // Log validation results
  if (process.env.NODE_ENV !== 'test') {
    console.log(`🔍 Environment validation for ${phase} deployment:`);
    
    if (errors.length > 0) {
      console.error('❌ Validation errors:');
      errors.forEach(error => console.error(`  - ${error}`));
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️  Validation warnings:');
      warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    if (errors.length === 0) {
      console.log('✅ Environment validation passed');
    }
  }

  // Throw error if validation fails
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  // Build configuration object
  const config: EnvironmentConfig = {
    phase,
    baseUrl: baseUrl || 'http://localhost:3000',
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'NextGen Sustainable Research Network',
    features,
    analytics: {
      googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
      hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID
    }
  };

  if (phase === 'full') {
    config.database = {
      url: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL
    };
    config.auth = {
      secret: process.env.NEXTAUTH_SECRET,
      url: process.env.NEXTAUTH_URL
    };
  }

  return config;
}

/**
 * Gets the current environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  try {
    return validateEnvironment();
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
export function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
  const config = getEnvironmentConfig();
  return config.features[feature];
}

/**
 * Gets the deployment phase
 */
export function getDeploymentPhase(): 'simple' | 'full' {
  const config = getEnvironmentConfig();
  return config.phase;
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