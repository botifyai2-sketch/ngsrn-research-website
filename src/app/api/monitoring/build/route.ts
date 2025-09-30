import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const buildValidation = {
      timestamp: new Date().toISOString(),
      build: {
        environment: process.env.NODE_ENV || 'unknown',
        nextVersion: getNextVersion(),
        nodeVersion: process.version,
        buildTime: process.env.BUILD_TIMESTAMP || 'unknown'
      },
      assets: await validateAssets(),
      configuration: await validateConfiguration(),
      dependencies: await validateDependencies(),
      performance: await validatePerformance(),
      security: validateSecurity()
    };

    const hasErrors = checkForErrors(buildValidation);
    const status = hasErrors ? 500 : 200;

    return NextResponse.json(buildValidation, {
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Build validation failed:', error);
    return NextResponse.json(
      {
        error: 'Build validation failed',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getNextVersion(): string {
  try {
    const packageJson = require('../../../../../package.json');
    return packageJson.dependencies?.next || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function validateAssets() {
  const fs = require('fs').promises;
  const path = require('path');

  const criticalAssets = [
    { name: 'favicon.ico', path: 'public/favicon.ico', required: true },
    { name: 'manifest.json', path: 'public/manifest.json', required: false },
    { name: 'robots.txt', path: 'public/robots.txt', required: false },
    { name: 'sitemap.xml', path: 'public/sitemap.xml', required: false }
  ];

  const staticAssets = [
    { name: 'logo', path: 'public/images/logo.png', required: false },
    { name: 'hero-image', path: 'public/images/hero.jpg', required: false }
  ];

  const buildAssets = [
    { name: 'next-build', path: '.next', required: true },
    { name: 'static-files', path: '.next/static', required: true }
  ];

  const results = {
    critical: await checkAssets(criticalAssets),
    static: await checkAssets(staticAssets),
    build: await checkAssets(buildAssets)
  };

  const totalAssets = criticalAssets.length + staticAssets.length + buildAssets.length;
  const presentAssets = results.critical.present + results.static.present + results.build.present;
  const missingCritical = results.critical.missing;

  return {
    total: totalAssets,
    present: presentAssets,
    missing: totalAssets - presentAssets,
    criticalMissing: missingCritical,
    status: missingCritical > 0 ? 'error' : 'ok',
    details: results
  };
}

async function checkAssets(assets: Array<{ name: string; path: string; required: boolean }>) {
  const fs = require('fs').promises;
  const path = require('path');

  let present = 0;
  let missing = 0;
  const details: Record<string, boolean> = {};

  for (const asset of assets) {
    try {
      const fullPath = path.join(process.cwd(), asset.path);
      await fs.access(fullPath);
      details[asset.name] = true;
      present++;
    } catch {
      details[asset.name] = false;
      missing++;
    }
  }

  return { present, missing, details };
}

async function validateConfiguration() {
  const phase = getDeploymentPhase();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  const requiredVars = phase === 'simple' 
    ? ['NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_SITE_NAME']
    : ['NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_SITE_NAME', 'DATABASE_URL', 'NEXTAUTH_SECRET'];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Check for placeholder values
  if (process.env.NEXT_PUBLIC_BASE_URL?.includes('your-app.vercel.app')) {
    warnings.push('NEXT_PUBLIC_BASE_URL contains placeholder value');
  }

  if (process.env.NEXT_PUBLIC_GA_ID?.includes('G-XXXXXXXXXX')) {
    warnings.push('NEXT_PUBLIC_GA_ID contains placeholder value');
  }

  // Validate URL formats
  if (process.env.NEXT_PUBLIC_BASE_URL && !isValidUrl(process.env.NEXT_PUBLIC_BASE_URL)) {
    errors.push('NEXT_PUBLIC_BASE_URL is not a valid URL');
  }

  // Check feature flag consistency
  const features = getFeatureFlags();
  if (features.cms && !features.auth) {
    warnings.push('CMS is enabled but authentication is disabled');
  }

  if (features.search && phase === 'full' && !process.env.DATABASE_URL) {
    warnings.push('Search is enabled but no database is configured');
  }

  return {
    phase,
    errors: errors.length,
    warnings: warnings.length,
    status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok',
    details: {
      errors,
      warnings
    }
  };
}

async function validateDependencies() {
  try {
    const packageJson = require('../../../../../package.json');
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    const criticalDeps = [
      'next',
      'react',
      'react-dom'
    ];

    const missing = criticalDeps.filter(dep => !dependencies[dep]);
    const outdated: string[] = []; // In a real implementation, you'd check for outdated versions

    return {
      total: Object.keys(dependencies).length,
      critical: criticalDeps.length,
      missing: missing.length,
      outdated: outdated.length,
      status: missing.length > 0 ? 'error' : outdated.length > 0 ? 'warning' : 'ok',
      details: {
        missing,
        outdated
      }
    };
  } catch (error) {
    return {
      status: 'error',
      error: 'Failed to validate dependencies'
    };
  }
}

async function validatePerformance() {
  const fs = require('fs').promises;
  const path = require('path');

  const checks = {
    compression: false,
    imageOptimization: false,
    bundleAnalysis: false,
    caching: false
  };

  // Check Next.js config for performance optimizations
  try {
    const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
    const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
    
    if (nextConfig.includes('compress: true')) {
      checks.compression = true;
    }
    
    if (nextConfig.includes('images:')) {
      checks.imageOptimization = true;
    }
    
    if (nextConfig.includes('Cache-Control')) {
      checks.caching = true;
    }
  } catch {
    // Config file not found or not readable
  }

  // Check for bundle analyzer
  try {
    const packageJson = require('../../../../../package.json');
    if (packageJson.scripts?.['build:analyze']) {
      checks.bundleAnalysis = true;
    }
  } catch {
    // Package.json not found
  }

  const optimizations = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    optimizations,
    total,
    percentage: Math.round((optimizations / total) * 100),
    status: optimizations >= total * 0.75 ? 'good' : optimizations >= total * 0.5 ? 'warning' : 'poor',
    details: checks
  };
}

function validateSecurity() {
  const securityHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Content-Security-Policy'
  ];

  // Check Vercel config for security headers
  const fs = require('fs');
  const path = require('path');
  
  let configuredHeaders = 0;
  
  try {
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    
    if (vercelConfig.headers) {
      const headerNames = vercelConfig.headers.flatMap((h: any) => 
        h.headers?.map((header: any) => header.key) || []
      );
      
      configuredHeaders = securityHeaders.filter(header => 
        headerNames.includes(header)
      ).length;
    }
  } catch {
    // Vercel config not found or invalid
  }

  const percentage = Math.round((configuredHeaders / securityHeaders.length) * 100);

  return {
    configured: configuredHeaders,
    total: securityHeaders.length,
    percentage,
    status: percentage >= 75 ? 'good' : percentage >= 50 ? 'warning' : 'poor',
    missing: securityHeaders.length - configuredHeaders
  };
}

function getDeploymentPhase(): 'simple' | 'full' {
  const features = getFeatureFlags();
  const hasAnyFeature = Object.values(features).some(Boolean);
  return hasAnyFeature ? 'full' : 'simple';
}

function getFeatureFlags() {
  return {
    cms: process.env.NEXT_PUBLIC_ENABLE_CMS === 'true',
    auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
    search: process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
    ai: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
    media: process.env.NEXT_PUBLIC_ENABLE_MEDIA === 'true'
  };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function checkForErrors(validation: any): boolean {
  return (
    validation.assets?.status === 'error' ||
    validation.configuration?.status === 'error' ||
    validation.dependencies?.status === 'error'
  );
}