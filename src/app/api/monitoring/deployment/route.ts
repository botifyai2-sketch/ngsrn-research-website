import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const deploymentStatus = {
      timestamp: new Date().toISOString(),
      deployment: {
        phase: getDeploymentPhase(),
        environment: process.env.NODE_ENV || 'unknown',
        vercel: {
          region: process.env.VERCEL_REGION || 'unknown',
          url: process.env.VERCEL_URL || 'unknown',
          gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
          gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'unknown',
          gitBranch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown'
        }
      },
      build: {
        timestamp: process.env.BUILD_TIMESTAMP || 'unknown',
        nodeVersion: process.version,
        nextVersion: getNextVersion()
      },
      configuration: await getConfigurationStatus(),
      features: getFeatureStatus(),
      assets: await checkAssets(),
      connectivity: await checkConnectivity()
    };

    return NextResponse.json(deploymentStatus, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Deployment status check failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to get deployment status',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getDeploymentPhase(): 'simple' | 'full' | 'unknown' {
  const features = {
    cms: process.env.NEXT_PUBLIC_ENABLE_CMS === 'true',
    auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
    search: process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
    ai: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
    media: process.env.NEXT_PUBLIC_ENABLE_MEDIA === 'true'
  };

  const hasAnyFeature = Object.values(features).some(Boolean);
  return hasAnyFeature ? 'full' : 'simple';
}

function getNextVersion(): string {
  try {
    const packageJson = require('../../../../../package.json');
    return packageJson.dependencies?.next || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function getConfigurationStatus() {
  const phase = getDeploymentPhase();
  const requiredVars = phase === 'simple' 
    ? ['NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_SITE_NAME']
    : ['NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_SITE_NAME', 'DATABASE_URL', 'NEXTAUTH_SECRET'];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  const configured = requiredVars.filter(varName => !!process.env[varName]);

  return {
    phase,
    required: requiredVars.length,
    configured: configured.length,
    missing: missing.length,
    missingVars: missing,
    status: missing.length === 0 ? 'complete' : 'incomplete'
  };
}

function getFeatureStatus() {
  const features = {
    cms: {
      enabled: process.env.NEXT_PUBLIC_ENABLE_CMS === 'true',
      dependencies: ['DATABASE_URL', 'NEXTAUTH_SECRET']
    },
    auth: {
      enabled: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
      dependencies: ['NEXTAUTH_SECRET', 'NEXTAUTH_URL']
    },
    search: {
      enabled: process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
      dependencies: ['DATABASE_URL']
    },
    ai: {
      enabled: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
      dependencies: ['GEMINI_API_KEY']
    },
    media: {
      enabled: process.env.NEXT_PUBLIC_ENABLE_MEDIA === 'true',
      dependencies: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET']
    },
    analytics: {
      enabled: !!process.env.NEXT_PUBLIC_GA_ID,
      dependencies: ['NEXT_PUBLIC_GA_ID']
    }
  };

  const status: Record<string, any> = {};

  Object.entries(features).forEach(([feature, config]) => {
    const missingDeps = config.dependencies.filter(dep => !process.env[dep]);
    status[feature] = {
      enabled: config.enabled,
      configured: config.enabled ? missingDeps.length === 0 : true,
      missingDependencies: config.enabled ? missingDeps : []
    };
  });

  return status;
}

async function checkAssets() {
  const fs = require('fs').promises;
  const path = require('path');

  const assetsToCheck = [
    { name: 'favicon', path: 'public/favicon.ico' },
    { name: 'manifest', path: 'public/manifest.json' },
    { name: 'robots', path: 'public/robots.txt' },
    { name: 'sitemap', path: 'public/sitemap.xml' }
  ];

  const assetStatus: Record<string, boolean> = {};

  for (const asset of assetsToCheck) {
    try {
      const fullPath = path.join(process.cwd(), asset.path);
      await fs.access(fullPath);
      assetStatus[asset.name] = true;
    } catch {
      assetStatus[asset.name] = false;
    }
  }

  return {
    checked: assetsToCheck.length,
    present: Object.values(assetStatus).filter(Boolean).length,
    missing: Object.values(assetStatus).filter(status => !status).length,
    details: assetStatus
  };
}

async function checkConnectivity() {
  const connectivity: Record<string, any> = {};

  // Database connectivity
  if (process.env.DATABASE_URL) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - start;
      await prisma.$disconnect();
      
      connectivity.database = {
        status: 'connected',
        responseTime: duration,
        url: process.env.DATABASE_URL.split('@')[1] || 'hidden'
      };
    } catch (error) {
      connectivity.database = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  } else {
    connectivity.database = { status: 'disabled' };
  }

  // External API connectivity (if AI is enabled)
  if (process.env.GEMINI_API_KEY) {
    connectivity.ai = {
      status: 'configured',
      service: 'Google Gemini'
    };
  } else {
    connectivity.ai = { status: 'disabled' };
  }

  // Storage connectivity (if media is enabled)
  if (process.env.AWS_ACCESS_KEY_ID) {
    connectivity.storage = {
      status: 'configured',
      service: 'AWS S3',
      bucket: process.env.AWS_S3_BUCKET || 'not-configured'
    };
  } else {
    connectivity.storage = { status: 'disabled' };
  }

  return connectivity;
}