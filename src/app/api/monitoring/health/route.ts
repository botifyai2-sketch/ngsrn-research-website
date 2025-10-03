import { NextRequest, NextResponse } from 'next/server';
import { envMonitoring } from '@/lib/env-monitoring';

export async function GET(_request: NextRequest) {
  try {
    const healthCheck: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '1.0.0',
      deployment: {
        phase: getDeploymentPhase(),
        vercel: {
          region: process.env.VERCEL_REGION || 'unknown',
          url: process.env.VERCEL_URL || 'unknown'
        }
      },
      checks: {
        server: 'ok',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          status: getMemoryStatus()
        },
        environment: await checkEnvironmentVariables(),
        features: checkFeatureFlags(),
        environmentMonitoring: await checkEnvironmentMonitoring()
      }
    };

    // Add database check if enabled
    if (process.env.DATABASE_URL) {
      try {
        // Simple database connectivity check
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$queryRaw`SELECT 1`;
        await prisma.$disconnect();
        healthCheck.checks.database = 'ok';
      } catch (error) {
        healthCheck.checks.database = 'error';
        healthCheck.status = 'degraded';
        console.error('Database health check failed:', error);
      }
    } else {
      healthCheck.checks.database = 'disabled';
    }

    // Add external service checks
    healthCheck.checks.external = await checkExternalServices();

    // Determine overall status
    const hasErrors = Object.values(healthCheck.checks).some(check => 
      typeof check === 'string' ? check === 'error' : 
      typeof check === 'object' && check !== null ? (check as any).status === 'error' : false
    );

    if (hasErrors) {
      healthCheck.status = 'degraded';
    }

    const status = healthCheck.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { 
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
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

function getMemoryStatus(): 'ok' | 'warning' | 'error' {
  const memoryUsage = process.memoryUsage();
  const usedMB = memoryUsage.heapUsed / 1024 / 1024;
  const totalMB = memoryUsage.heapTotal / 1024 / 1024;
  const usagePercent = (usedMB / totalMB) * 100;

  if (usagePercent > 90) return 'error';
  if (usagePercent > 75) return 'warning';
  return 'ok';
}

async function checkEnvironmentVariables(): Promise<{ status: string; missing?: string[]; warnings?: string[] }> {
  const phase = getDeploymentPhase();
  const missing: string[] = [];
  const warnings: string[] = [];

  // Required variables based on phase
  const requiredVars = phase === 'simple' 
    ? ['NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_SITE_NAME']
    : ['NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_SITE_NAME', 'DATABASE_URL', 'NEXTAUTH_SECRET'];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check for placeholder values
  if (process.env.NEXT_PUBLIC_BASE_URL?.includes('your-app.vercel.app')) {
    warnings.push('NEXT_PUBLIC_BASE_URL contains placeholder value');
  }

  if (process.env.NEXT_PUBLIC_GA_ID?.includes('G-XXXXXXXXXX')) {
    warnings.push('NEXT_PUBLIC_GA_ID contains placeholder value');
  }

  const result: { status: string; missing?: string[]; warnings?: string[] } = {
    status: missing.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok'
  };

  if (missing.length > 0) result.missing = missing;
  if (warnings.length > 0) result.warnings = warnings;

  return result;
}

function checkFeatureFlags(): Record<string, boolean> {
  return {
    cms: process.env.NEXT_PUBLIC_ENABLE_CMS === 'true',
    auth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
    search: process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
    ai: process.env.NEXT_PUBLIC_ENABLE_AI === 'true',
    media: process.env.NEXT_PUBLIC_ENABLE_MEDIA === 'true',
    analytics: !!process.env.NEXT_PUBLIC_GA_ID
  };
}

async function checkExternalServices(): Promise<Record<string, string>> {
  const services: Record<string, string> = {};

  // Check Google Analytics
  if (process.env.NEXT_PUBLIC_GA_ID) {
    services.analytics = 'configured';
  } else {
    services.analytics = 'disabled';
  }

  // Check AI service
  if (process.env.GEMINI_API_KEY) {
    services.ai = 'configured';
  } else {
    services.ai = 'disabled';
  }

  // Check AWS S3 (for media)
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    services.storage = 'configured';
  } else {
    services.storage = 'disabled';
  }

  return services;
}

async function checkEnvironmentMonitoring(): Promise<{ status: string; score?: number; alerts?: number; drift?: boolean }> {
  try {
    const healthStatus = await envMonitoring.generateHealthStatus();
    const activeAlerts = healthStatus.alerts.filter(a => !a.resolvedAt);
    
    return {
      status: healthStatus.overall,
      score: healthStatus.score,
      alerts: activeAlerts.length,
      drift: healthStatus.drift.detected
    };
  } catch (error) {
    console.error('Environment monitoring check failed:', error);
    return {
      status: 'error'
    };
  }
}