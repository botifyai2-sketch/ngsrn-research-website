import { NextRequest, NextResponse } from 'next/server';
import { envMonitoring } from '@/lib/env-monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'health';

    switch (action) {
      case 'health':
        return await handleHealthCheck();
      
      case 'drift':
        return await handleDriftCheck();
      
      case 'alerts':
        return await handleAlertsCheck(searchParams);
      
      case 'snapshot':
        return await handleSnapshotCheck();
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Valid actions: health, drift, alerts, snapshot' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Environment monitoring API error:', error);
    return NextResponse.json(
      {
        error: 'Environment monitoring failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'acknowledge-alert':
        return await handleAcknowledgeAlert(request);
      
      case 'resolve-alert':
        return await handleResolveAlert(request);
      
      case 'take-snapshot':
        return await handleTakeSnapshot();
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Valid actions: acknowledge-alert, resolve-alert, take-snapshot' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Environment monitoring POST error:', error);
    return NextResponse.json(
      {
        error: 'Environment monitoring operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleHealthCheck() {
  const healthStatus = await envMonitoring.generateHealthStatus();
  
  return NextResponse.json({
    status: 'success',
    data: healthStatus,
    timestamp: new Date().toISOString()
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

async function handleDriftCheck() {
  // Take a new snapshot and detect drift
  const snapshot = await envMonitoring.takeSnapshot();
  const drift = envMonitoring.detectDrift(snapshot);
  
  return NextResponse.json({
    status: 'success',
    data: {
      detected: drift.length > 0,
      changes: drift,
      snapshot: {
        timestamp: snapshot.timestamp,
        phase: snapshot.phase,
        checksum: snapshot.checksum
      }
    },
    timestamp: new Date().toISOString()
  });
}

async function handleAlertsCheck(searchParams: URLSearchParams) {
  const severity = searchParams.get('severity') as any;
  const type = searchParams.get('type') as any;
  const resolved = searchParams.get('resolved');
  
  const filter: any = {};
  if (severity) filter.severity = severity;
  if (type) filter.type = type;
  if (resolved !== null) filter.resolved = resolved === 'true';
  
  const alerts = envMonitoring.getAlerts(filter);
  
  return NextResponse.json({
    status: 'success',
    data: {
      alerts,
      total: alerts.length,
      active: alerts.filter(a => !a.resolvedAt).length
    },
    timestamp: new Date().toISOString()
  });
}

async function handleSnapshotCheck() {
  const snapshot = await envMonitoring.takeSnapshot();
  
  // Remove sensitive variable values from response
  const sanitizedSnapshot = {
    ...snapshot,
    variables: Object.keys(snapshot.variables).reduce((acc, key) => {
      if (key.startsWith('NEXT_PUBLIC_')) {
        acc[key] = snapshot.variables[key];
      } else {
        acc[key] = snapshot.variables[key].startsWith('[REDACTED:') 
          ? snapshot.variables[key] 
          : '[REDACTED]';
      }
      return acc;
    }, {} as Record<string, string>)
  };
  
  return NextResponse.json({
    status: 'success',
    data: sanitizedSnapshot,
    timestamp: new Date().toISOString()
  });
}

async function handleAcknowledgeAlert(request: NextRequest) {
  const body = await request.json();
  const { alertId } = body;
  
  if (!alertId) {
    return NextResponse.json(
      { error: 'Alert ID is required' },
      { status: 400 }
    );
  }
  
  const success = envMonitoring.acknowledgeAlert(alertId);
  
  if (success) {
    return NextResponse.json({
      status: 'success',
      message: 'Alert acknowledged successfully'
    });
  } else {
    return NextResponse.json(
      { error: 'Alert not found' },
      { status: 404 }
    );
  }
}

async function handleResolveAlert(request: NextRequest) {
  const body = await request.json();
  const { alertId } = body;
  
  if (!alertId) {
    return NextResponse.json(
      { error: 'Alert ID is required' },
      { status: 400 }
    );
  }
  
  const success = envMonitoring.resolveAlert(alertId);
  
  if (success) {
    return NextResponse.json({
      status: 'success',
      message: 'Alert resolved successfully'
    });
  } else {
    return NextResponse.json(
      { error: 'Alert not found' },
      { status: 404 }
    );
  }
}

async function handleTakeSnapshot() {
  const snapshot = await envMonitoring.takeSnapshot();
  
  return NextResponse.json({
    status: 'success',
    data: {
      timestamp: snapshot.timestamp,
      phase: snapshot.phase,
      checksum: snapshot.checksum,
      variableCount: Object.keys(snapshot.variables).length
    },
    message: 'Snapshot taken successfully'
  });
}