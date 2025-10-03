'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { EnvironmentHealthStatus, EnvironmentAlert, EnvironmentDrift } from '@/lib/env-monitoring';

interface EnvironmentMonitoringDashboardProps {
  className?: string;
}

export function EnvironmentMonitoringDashboard({ className }: EnvironmentMonitoringDashboardProps) {
  const [healthStatus, setHealthStatus] = useState<EnvironmentHealthStatus | null>(null);
  const [alerts, setAlerts] = useState<EnvironmentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    loadHealthStatus();
    loadAlerts();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadHealthStatus();
      loadAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadHealthStatus = async () => {
    try {
      const response = await fetch('/api/monitoring/environment?action=health');
      const result = await response.json();
      
      if (result.status === 'success') {
        setHealthStatus(result.data);
        setLastRefresh(new Date());
      } else {
        setError(result.error || 'Failed to load health status');
      }
    } catch (err) {
      setError('Failed to fetch health status');
      console.error('Health status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/monitoring/environment?action=alerts');
      const result = await response.json();
      
      if (result.status === 'success') {
        setAlerts(result.data.alerts);
      }
    } catch (err) {
      console.error('Alerts fetch error:', err);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/monitoring/environment?action=acknowledge-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      
      if (response.ok) {
        loadAlerts(); // Refresh alerts
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/monitoring/environment?action=resolve-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      
      if (response.ok) {
        loadAlerts(); // Refresh alerts
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const takeSnapshot = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/monitoring/environment?action=take-snapshot', {
        method: 'POST'
      });
      
      if (response.ok) {
        loadHealthStatus(); // Refresh health status
      }
    } catch (err) {
      console.error('Failed to take snapshot:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'critical': return 'text-red-800 bg-red-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'critical': return 'text-red-800 bg-red-100';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading && !healthStatus) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !healthStatus) {
    return (
      <div className={`p-6 ${className}`}>
        <Card className="p-6 border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Environment Monitoring Error
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadHealthStatus} variant="outline">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Environment Monitoring
          </h2>
          {lastRefresh && (
            <p className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={takeSnapshot} disabled={loading} variant="outline">
            Take Snapshot
          </Button>
          <Button onClick={loadHealthStatus} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {healthStatus && (
        <>
          {/* Overall Health Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overall Health</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.overall)}`}>
                {healthStatus.overall.toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{healthStatus.score}</div>
                <div className="text-sm text-gray-500">Health Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{healthStatus.issues.missing.length}</div>
                <div className="text-sm text-gray-500">Missing Variables</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{healthStatus.issues.invalid.length}</div>
                <div className="text-sm text-gray-500">Invalid Variables</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{healthStatus.issues.security.length}</div>
                <div className="text-sm text-gray-500">Security Issues</div>
              </div>
            </div>
          </Card>

          {/* Configuration Issues */}
          {(healthStatus.issues.missing.length > 0 || 
            healthStatus.issues.invalid.length > 0 || 
            healthStatus.issues.security.length > 0) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Configuration Issues</h3>
              
              {healthStatus.issues.missing.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-800 mb-2">Missing Required Variables</h4>
                  <div className="space-y-1">
                    {healthStatus.issues.missing.map(variable => (
                      <div key={variable} className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
                        {variable}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {healthStatus.issues.invalid.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Invalid Variables</h4>
                  <div className="space-y-1">
                    {healthStatus.issues.invalid.map(variable => (
                      <div key={variable} className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded">
                        {variable}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {healthStatus.issues.security.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-800 mb-2">Security Issues</h4>
                  <div className="space-y-1">
                    {healthStatus.issues.security.map((issue, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Configuration Drift */}
          {healthStatus.drift.detected && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Configuration Drift</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(healthStatus.drift.severity)}`}>
                  {healthStatus.drift.severity.toUpperCase()}
                </div>
              </div>
              
              <div className="space-y-3">
                {healthStatus.drift.changes.map((change, index) => (
                  <DriftChangeCard key={index} change={change} />
                ))}
              </div>
            </Card>
          )}

          {/* Vercel Integration */}
          {healthStatus.vercel && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Vercel Integration</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  healthStatus.vercel.compatible ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'
                }`}>
                  {healthStatus.vercel.compatible ? 'COMPATIBLE' : 'ISSUES DETECTED'}
                </div>
              </div>
              
              {healthStatus.vercel.issues.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Issues</h4>
                  <div className="space-y-1">
                    {healthStatus.vercel.issues.map((issue, index) => (
                      <div key={index} className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded">
                        {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {healthStatus.vercel.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                  <div className="space-y-1">
                    {healthStatus.vercel.recommendations.map((rec, index) => (
                      <div key={index} className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Active Alerts ({alerts.filter(a => !a.resolvedAt).length})
          </h3>
          
          <div className="space-y-3">
            {alerts.filter(a => !a.resolvedAt).map(alert => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onAcknowledge={acknowledgeAlert}
                onResolve={resolveAlert}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function DriftChangeCard({ change }: { change: EnvironmentDrift }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'added': return '➕';
      case 'removed': return '➖';
      case 'changed': return '🔄';
      default: return '📝';
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon(change.type)}</span>
          <span className="font-medium">{change.variable}</span>
          <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(change.severity)}`}>
            {change.severity.toUpperCase()}
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {new Date(change.detectedAt).toLocaleString()}
        </span>
      </div>
      
      <p className="text-sm text-gray-700 mb-2">{change.impact}</p>
      
      {(change.previousValue || change.currentValue) && (
        <div className="text-xs text-gray-600 mb-2">
          {change.previousValue && (
            <div>Previous: <code className="bg-gray-200 px-1 rounded">{change.previousValue}</code></div>
          )}
          {change.currentValue && (
            <div>Current: <code className="bg-gray-200 px-1 rounded">{change.currentValue}</code></div>
          )}
        </div>
      )}
      
      <div className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
        💡 {change.recommendation}
      </div>
    </div>
  );
}

function AlertCard({ 
  alert, 
  onAcknowledge, 
  onResolve 
}: { 
  alert: EnvironmentAlert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'critical': return 'text-red-800 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
            {alert.severity.toUpperCase()}
          </div>
          <span className="font-medium">{alert.variable}</span>
        </div>
        <span className="text-sm opacity-75">
          {new Date(alert.createdAt).toLocaleString()}
        </span>
      </div>
      
      <h4 className="font-medium mb-1">{alert.message}</h4>
      <p className="text-sm mb-2 opacity-90">{alert.description}</p>
      
      <div className="text-sm mb-3 p-2 bg-white bg-opacity-50 rounded">
        💡 {alert.recommendation}
      </div>
      
      <div className="flex gap-2">
        {!alert.acknowledged && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onAcknowledge(alert.id)}
          >
            Acknowledge
          </Button>
        )}
        <Button 
          size="sm" 
          onClick={() => onResolve(alert.id)}
        >
          Resolve
        </Button>
      </div>
    </div>
  );
}