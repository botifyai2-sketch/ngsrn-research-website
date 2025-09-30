'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardData {
  summary?: {
    totalUsers: number;
    totalPageViews: number;
    totalSessions: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  trends?: {
    users: Array<{ date: string; value: number }>;
    pageViews: Array<{ date: string; value: number }>;
    sessions: Array<{ date: string; value: number }>;
  };
  topPages?: Array<{ path: string; views: number; title: string }>;
  recentActivity?: Array<{ type: string; path?: string; query?: string; action?: string; timestamp: Date }>;
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMetric, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const response = await fetch(
        `/api/monitoring/dashboard?metric=${selectedMetric}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatPercentage = (decimal: number) => {
    return (decimal * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
        
        <div className="flex gap-4">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="overview">Overview</option>
            <option value="performance">Performance</option>
            <option value="errors">Errors</option>
            <option value="analytics">Analytics</option>
            <option value="search">Search</option>
            <option value="ai">AI Assistant</option>
          </select>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {selectedMetric === 'overview' && data.summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.summary.totalUsers)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Page Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.summary.totalPageViews)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.summary.totalSessions)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(data.summary.avgSessionDuration)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(data.summary.bounceRate)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.topPages && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.topPages.map((page, index) => (
                      <div key={page.path} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{page.title}</div>
                          <div className="text-sm text-gray-600">{page.path}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatNumber(page.views)}</div>
                          <div className="text-sm text-gray-600">views</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {data.recentActivity && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recentActivity.slice(0, 10).map((activity, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium capitalize">{activity.type.replace('_', ' ')}</span>
                          {activity.path && <span className="text-gray-600"> - {activity.path}</span>}
                          {activity.query && <span className="text-gray-600"> - "{activity.query}"</span>}
                          {activity.action && <span className="text-gray-600"> - {activity.action}</span>}
                        </div>
                        <div className="text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {selectedMetric !== 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              {selectedMetric} metrics will be displayed here when data is available.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}