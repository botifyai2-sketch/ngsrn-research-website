import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    
    // Initialize build monitor
    const BuildMonitor = await import('../../../../../scripts/build-monitor.js');
    const monitor = new BuildMonitor.default();
    
    switch (action) {
      case 'status':
        return handleHealthStatus(monitor);
      case 'report':
        return handleHealthReport(monitor);
      case 'drift':
        return handleConfigurationDrift(monitor);
      case 'alerts':
        return handleActiveAlerts(monitor);
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, report, drift, or alerts' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Build health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Build health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    // Initialize build monitor
    const BuildMonitor = await import('../../../../../scripts/build-monitor.js');
    const monitor = new BuildMonitor.default();
    
    switch (action) {
      case 'record_build':
        return handleRecordBuild(monitor, data);
      case 'update_baseline':
        return handleUpdateBaseline(monitor);
      case 'resolve_alert':
        return handleResolveAlert(monitor, data);
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: record_build, update_baseline, or resolve_alert' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Build health action failed:', error);
    return NextResponse.json(
      {
        error: 'Build health action failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleHealthStatus(monitor: any) {
  const healthStatus = monitor.getBuildHealthStatus();
  
  // Add additional system checks
  const systemChecks = await performSystemChecks();
  
  const response = {
    ...healthStatus,
    systemChecks,
    timestamp: new Date().toISOString()
  };
  
  const httpStatus = healthStatus.status === 'critical' ? 503 : 
                   healthStatus.status === 'degraded' ? 206 : 200;
  
  return NextResponse.json(response, { 
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

async function handleHealthReport(monitor: any) {
  const report = monitor.generateHealthReport();
  
  return NextResponse.json(report, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

async function handleConfigurationDrift(monitor: any) {
  const drift = monitor.detectConfigurationDrift();
  
  return NextResponse.json({
    configurationDrift: drift,
    timestamp: new Date().toISOString()
  });
}

async function handleActiveAlerts(monitor: any) {
  const activeAlerts = monitor.getActiveAlerts();
  const recentAlerts = monitor.getRecentAlerts(7);
  
  return NextResponse.json({
    active: activeAlerts,
    recent: recentAlerts,
    summary: {
      activeCount: activeAlerts.length,
      criticalCount: activeAlerts.filter((alert: any) => alert.severity === 'critical').length,
      recentCount: recentAlerts.length
    },
    timestamp: new Date().toISOString()
  });
}

async function handleRecordBuild(monitor: any, data: any) {
  const { success, duration, errors = [], phase = 'unknown' } = data;
  
  if (typeof success !== 'boolean') {
    return NextResponse.json(
      { error: 'success field is required and must be boolean' },
      { status: 400 }
    );
  }
  
  const buildRecord = monitor.recordBuildAttempt(success, duration, errors, phase);
  
  return NextResponse.json({
    message: 'Build attempt recorded successfully',
    buildRecord,
    timestamp: new Date().toISOString()
  });
}

async function handleUpdateBaseline(monitor: any) {
  const currentConfig = monitor.getCurrentConfiguration();
  monitor.saveBaselineConfiguration(currentConfig);
  
  return NextResponse.json({
    message: 'Configuration baseline updated successfully',
    timestamp: new Date().toISOString()
  });
}

async function handleResolveAlert(monitor: any, data: any) {
  const { alertId } = data;
  
  if (!alertId) {
    return NextResponse.json(
      { error: 'alertId is required' },
      { status: 400 }
    );
  }
  
  // This would need to be implemented in the BuildMonitor class
  return NextResponse.json({
    message: 'Alert resolution not yet implemented',
    alertId,
    timestamp: new Date().toISOString()
  });
}

async function performSystemChecks() {
  const checks: Record<string, any> = {};
  
  try {
    // Check Node.js version
    checks.nodeVersion = {
      version: process.version,
      status: 'ok'
    };
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const usedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    
    checks.memory = {
      used: usedMB,
      total: totalMB,
      percentage: Math.round((usedMB / totalMB) * 100),
      status: usedMB > totalMB * 0.9 ? 'warning' : 'ok'
    };
    
    // Check disk space (if possible)
    try {
      const stats = fs.statSync(process.cwd());
      checks.filesystem = {
        accessible: true,
        status: 'ok'
      };
    } catch (error) {
      checks.filesystem = {
        accessible: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Check build tools availability
    checks.buildTools = await checkBuildTools();
    
    // Check environment configuration
    checks.environment = checkEnvironmentHealth();
    
  } catch (error) {
    checks.systemError = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown system error'
    };
  }
  
  return checks;
}

async function checkBuildTools() {
  const tools = {
    npm: false,
    node: false,
    typescript: false,
    next: false
  };
  
  try {
    // Check npm
    execSync('npm --version', { stdio: 'pipe' });
    tools.npm = true;
  } catch (error) {
    // npm not available
  }
  
  try {
    // Check TypeScript
    execSync('npx tsc --version', { stdio: 'pipe' });
    tools.typescript = true;
  } catch (error) {
    // TypeScript not available
  }
  
  try {
    // Check Next.js
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      tools.next = !!(packageJson.dependencies?.next || packageJson.devDependencies?.next);
    }
  } catch (error) {
    // Next.js check failed
  }
  
  tools.node = true; // If we're running, Node.js is available
  
  const allToolsAvailable = Object.values(tools).every(Boolean);
  
  return {
    tools,
    status: allToolsAvailable ? 'ok' : 'warning',
    available: Object.entries(tools).filter(([, available]) => available).map(([tool]) => tool),
    missing: Object.entries(tools).filter(([, available]) => !available).map(([tool]) => tool)
  };
}

function checkEnvironmentHealth() {
  const requiredVars = [
    'NODE_ENV',
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_SITE_NAME'
  ];
  
  const optionalVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_GA_ID',
    'GEMINI_API_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  const present = requiredVars.filter(varName => !!process.env[varName]);
  const optionalPresent = optionalVars.filter(varName => !!process.env[varName]);
  
  return {
    status: missing.length === 0 ? 'ok' : 'error',
    required: {
      present: present.length,
      missing: missing.length,
      missingVars: missing
    },
    optional: {
      present: optionalPresent.length,
      total: optionalVars.length,
      presentVars: optionalPresent
    }
  };
}