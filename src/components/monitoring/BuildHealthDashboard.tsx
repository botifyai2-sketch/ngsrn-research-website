'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface BuildMetrics {
  totalBuilds: number;
  successRate: number;
  lastBuild: string | null;
}

interface ConfigurationDrift {
  hasDrift: boolean;
  changes: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
  }>;
  severity: 'none' | 'low' | 'medium' | 'high';
}

interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  data?: any;
}

interface BuildHealthStatus {
  status: 'healthy' | 'degraded' | 'at-risk' | 'critical';
  issues: string[];
  metrics: BuildMetrics;
  configurationDrift: ConfigurationDrift;
  activeAlerts: number;
  lastUpdate: string;
  systemChecks?: any;
}

interface BuildHealthReport {
  timestamp: string;
  status: string;
  summary: {
    totalBuilds: number;
    successfulBuilds: number;
    failedBuilds: number;
    successRate: number;
  };
  recentActivity: {
    last24Hours: any[];
    last7Days: any[];
    trends: any;
  };
  configurationDrift: ConfigurationDrift;
  alerts: {
    active: Alert[];
    recent: Alert[];
  };
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high';
    action: string;
    reason: string;
  }>;
}

export default function BuildHealthDashboard() {
  const [healthStatus, setHealthStatus] = useState<BuildHealthStatus | null>(null);
  const [healthReport, setHealthReport] = useState<BuildHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'alerts' | 'drift'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = async () => {
    try {
      setError(null);
      
      // Fetch health status
      const statusResponse = await fetch('/api/monitoring/build-health?action=status');
      if (!statusResponse.ok) {
        throw new Error(`Status fetch failed: ${statusResponse.statusText}`);
      }
      const statusData = await statusResponse.json();
      setHealthStatus(statusData);
      
      // Fetch detailed report
      const reportResponse = await fetch('/api/monitoring/build-health?action=report');
      if (!reportResponse.ok) {
        throw new Error(`Report fetch failed: ${reportResponse.statusText}`);
      }
      const reportData = await reportResponse.json();
      setHealthReport(reportData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch build health data');
      console.error('Build health fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'at-risk': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-600 bg-blue-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const recordTestBuild = async (success: boolean) => {
    try {
      const response = await fetch('/api/monitoring/build-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_build',
          success,
          duration: Math.random() * 60000 + 10000, // Random duration between 10-70 seconds
          phase: 'test',
          errors: success ? [] : [{ type: 'test', message: 'Simulated test failure' }]
        })
      });
      
      if (response.ok) {
        await fetchHealthData(); // Refresh data
      }
    } catch (err) {
      console.error('Failed to record test build:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Build Health Data</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchHealthData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Build Health Dashboard</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
          <button
            onClick={fetchHealthData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Overview */}
      {healthStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={`p-4 border-2 ${getStatusColor(healthStatus.status)}`}>
            <h3 className="font-semibold mb-2">Overall Status</h3>
            <p className="text-2xl font-bold capitalize">{healthStatus.status}</p>
            <p className="text-sm mt-1">Last updated: {formatTimestamp(healthStatus.lastUpdate)}</p>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Success Rate</h3>
            <p className="text-2xl font-bold">{healthStatus.metrics.successRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Total builds: {healthStatus.metrics.totalBuilds}</p>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Active Alerts</h3>
            <p className="text-2xl font-bold">{healthStatus.activeAlerts}</p>
            <p className="text-sm text-gray-600">Monitoring issues</p>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Configuration</h3>
            <p className={`text-sm px-2 py-1 rounded ${
              healthStatus.configurationDrift.hasDrift 
                ? getSeverityColor(healthStatus.configurationDrift.severity)
                : 'text-green-600 bg-green-50'
            }`}>
              {healthStatus.configurationDrift.hasDrift 
                ? `${healthStatus.configurationDrift.severity.toUpperCase()} drift`
                : 'Stable'
              }
            </p>
          </Card>
        </div>
      )}

      {/* Issues Summary */}
      {healthStatus && healthStatus.issues.length > 0 && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <h3 className="font-semibold mb-2 text-yellow-800">Current Issues</h3>
          <ul className="space-y-1">
            {healthStatus.issues.map((issue, index) => (
              <li key={index} className="text-yellow-700">• {issue}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'metrics', label: 'Build Metrics' },
            { key: 'alerts', label: 'Alerts' },
            { key: 'drift', label: 'Configuration Drift' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && healthReport && (
        <div className="space-y-6">
          {/* Build Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Build Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Builds</p>
                <p className="text-2xl font-bold">{healthReport.summary.totalBuilds}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{healthReport.summary.successfulBuilds}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{healthReport.summary.failedBuilds}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{healthReport.summary.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </Card>

          {/* Recommendations */}
          {healthReport.recommendations.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
              <div className="space-y-3">
                {healthReport.recommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded border-l-4 ${
                    rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{rec.action}</p>
                        <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(rec.priority)}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Test Controls */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Test Build Recording</h3>
            <p className="text-sm text-gray-600 mb-4">
              Record test build attempts to see how the monitoring system responds.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => recordTestBuild(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Record Successful Build
              </button>
              <button
                onClick={() => recordTestBuild(false)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Record Failed Build
              </button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'metrics' && healthReport && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Last 24 Hours</h4>
                <p className="text-2xl font-bold">{healthReport.recentActivity.last24Hours.length}</p>
                <p className="text-sm text-gray-600">builds</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Last 7 Days</h4>
                <p className="text-2xl font-bold">{healthReport.recentActivity.last7Days.length}</p>
                <p className="text-sm text-gray-600">builds</p>
              </div>
            </div>
            
            {healthReport.recentActivity.trends && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Trends</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium">Success Rate Trend</p>
                    <p className={`text-lg font-bold ${
                      healthReport.recentActivity.trends.successRate.trend === 'improving' ? 'text-green-600' :
                      healthReport.recentActivity.trends.successRate.trend === 'declining' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {healthReport.recentActivity.trends.successRate.trend}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium">Build Duration Trend</p>
                    <p className={`text-lg font-bold ${
                      healthReport.recentActivity.trends.buildDuration.trend === 'improving' ? 'text-green-600' :
                      healthReport.recentActivity.trends.buildDuration.trend === 'declining' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {healthReport.recentActivity.trends.buildDuration.trend}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'alerts' && healthReport && (
        <div className="space-y-6">
          {/* Active Alerts */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
            {healthReport.alerts.active.length === 0 ? (
              <p className="text-gray-600">No active alerts</p>
            ) : (
              <div className="space-y-3">
                {healthReport.alerts.active.map((alert, index) => (
                  <div key={index} className={`p-4 rounded border-l-4 ${
                    alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                    alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Type: {alert.type} • {formatTimestamp(alert.timestamp)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Alerts */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Alerts (Last 7 Days)</h3>
            {healthReport.alerts.recent.length === 0 ? (
              <p className="text-gray-600">No recent alerts</p>
            ) : (
              <div className="space-y-2">
                {healthReport.alerts.recent.slice(0, 10).map((alert, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-gray-600">{formatTimestamp(alert.timestamp)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'drift' && healthStatus && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configuration Drift Status</h3>
            <div className={`p-4 rounded border-2 ${
              healthStatus.configurationDrift.hasDrift 
                ? getSeverityColor(healthStatus.configurationDrift.severity)
                : 'text-green-600 bg-green-50 border-green-200'
            }`}>
              <p className="font-medium">
                {healthStatus.configurationDrift.hasDrift 
                  ? `Configuration drift detected (${healthStatus.configurationDrift.severity} severity)`
                  : 'No configuration drift detected'
                }
              </p>
            </div>
            
            {healthStatus.configurationDrift.changes.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="font-medium">Detected Changes:</h4>
                {healthStatus.configurationDrift.changes.map((change, index) => (
                  <div key={index} className={`p-3 rounded border-l-4 ${
                    change.severity === 'high' ? 'border-red-500 bg-red-50' :
                    change.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{change.message}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Type: {change.type} • {formatTimestamp(change.timestamp)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(change.severity)}`}>
                        {change.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}