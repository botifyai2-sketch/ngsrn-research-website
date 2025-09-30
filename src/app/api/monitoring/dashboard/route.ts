import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const DashboardQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metric: z.enum(['overview', 'performance', 'errors', 'analytics', 'search', 'ai']).optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = DashboardQuerySchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      metric: searchParams.get('metric') as any || 'overview'
    });

    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();

    let data;

    switch (query.metric) {
      case 'overview':
        data = await getOverviewMetrics(startDate, endDate);
        break;
      case 'performance':
        data = await getPerformanceMetrics(startDate, endDate);
        break;
      case 'errors':
        data = await getErrorMetrics(startDate, endDate);
        break;
      case 'analytics':
        data = await getAnalyticsMetrics(startDate, endDate);
        break;
      case 'search':
        data = await getSearchMetrics(startDate, endDate);
        break;
      case 'ai':
        data = await getAIMetrics(startDate, endDate);
        break;
      default:
        data = await getOverviewMetrics(startDate, endDate);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

async function getOverviewMetrics(startDate: Date, endDate: Date) {
  // In production, these would query the actual database
  // For now, returning mock data structure
  
  return {
    summary: {
      totalUsers: 1250,
      totalPageViews: 8430,
      totalSessions: 2100,
      avgSessionDuration: 245, // seconds
      bounceRate: 0.32
    },
    trends: {
      users: generateTrendData(7, 150, 200),
      pageViews: generateTrendData(7, 800, 1200),
      sessions: generateTrendData(7, 200, 350)
    },
    topPages: [
      { path: '/', views: 2100, title: 'Home' },
      { path: '/research', views: 1800, title: 'Research' },
      { path: '/articles', views: 1200, title: 'Articles' },
      { path: '/search', views: 900, title: 'Search' },
      { path: '/leadership', views: 600, title: 'Leadership' }
    ],
    recentActivity: [
      { type: 'page_view', path: '/research/economics', timestamp: new Date() },
      { type: 'search', query: 'sustainable development', timestamp: new Date() },
      { type: 'ai_interaction', action: 'question', timestamp: new Date() }
    ]
  };
}

async function getPerformanceMetrics(startDate: Date, endDate: Date) {
  return {
    webVitals: {
      lcp: { value: 2.1, rating: 'good', trend: -0.3 },
      fid: { value: 45, rating: 'good', trend: -5 },
      cls: { value: 0.08, rating: 'good', trend: 0.01 },
      fcp: { value: 1.8, rating: 'good', trend: -0.2 },
      ttfb: { value: 320, rating: 'good', trend: -20 }
    },
    pageLoad: {
      average: 2.3,
      p95: 4.1,
      trend: generateTrendData(7, 2.0, 3.0)
    },
    apiPerformance: {
      average: 180,
      p95: 450,
      errorRate: 0.02,
      trend: generateTrendData(7, 150, 250)
    },
    slowestPages: [
      { path: '/search', avgLoadTime: 3.2 },
      { path: '/articles', avgLoadTime: 2.8 },
      { path: '/research', avgLoadTime: 2.5 }
    ]
  };
}

async function getErrorMetrics(startDate: Date, endDate: Date) {
  return {
    summary: {
      totalErrors: 23,
      errorRate: 0.027,
      trend: -0.005
    },
    errorTypes: [
      { type: 'JavaScript Error', count: 12, percentage: 52 },
      { type: 'API Error', count: 7, percentage: 30 },
      { type: 'Network Error', count: 4, percentage: 18 }
    ],
    recentErrors: [
      {
        message: 'TypeError: Cannot read property of undefined',
        count: 5,
        lastSeen: new Date(),
        url: '/search'
      },
      {
        message: 'Failed to fetch /api/articles',
        count: 3,
        lastSeen: new Date(),
        url: '/articles'
      }
    ],
    errorTrend: generateTrendData(7, 0, 10)
  };
}

async function getAnalyticsMetrics(startDate: Date, endDate: Date) {
  return {
    userBehavior: {
      avgPagesPerSession: 3.2,
      avgSessionDuration: 245,
      returnVisitorRate: 0.34
    },
    traffic: {
      organic: 45,
      direct: 30,
      referral: 15,
      social: 10
    },
    devices: {
      desktop: 60,
      mobile: 35,
      tablet: 5
    },
    geography: [
      { country: 'Nigeria', users: 450, percentage: 36 },
      { country: 'Kenya', users: 280, percentage: 22 },
      { country: 'South Africa', users: 200, percentage: 16 },
      { country: 'Ghana', users: 150, percentage: 12 },
      { country: 'Other', users: 170, percentage: 14 }
    ]
  };
}

async function getSearchMetrics(startDate: Date, endDate: Date) {
  return {
    summary: {
      totalSearches: 1840,
      avgResultsPerSearch: 12.3,
      avgSearchDuration: 1.8,
      zeroResultRate: 0.08
    },
    topQueries: [
      { query: 'sustainable development', count: 180, avgResults: 15 },
      { query: 'climate change africa', count: 145, avgResults: 22 },
      { query: 'governance policy', count: 120, avgResults: 18 },
      { query: 'economic development', count: 98, avgResults: 14 },
      { query: 'gender equity', count: 87, avgResults: 11 }
    ],
    searchTrends: generateTrendData(7, 200, 300),
    zeroResultQueries: [
      { query: 'blockchain governance', count: 5 },
      { query: 'quantum computing policy', count: 3 },
      { query: 'space technology africa', count: 2 }
    ]
  };
}

async function getAIMetrics(startDate: Date, endDate: Date) {
  return {
    summary: {
      totalInteractions: 890,
      successRate: 0.94,
      avgResponseTime: 2.1,
      costPerInteraction: 0.003
    },
    interactionTypes: [
      { type: 'question', count: 520, successRate: 0.96 },
      { type: 'summary', count: 280, successRate: 0.92 },
      { type: 'explanation', count: 90, successRate: 0.89 }
    ],
    usageTrends: generateTrendData(7, 80, 150),
    popularTopics: [
      { topic: 'Climate Policy', interactions: 180 },
      { topic: 'Economic Development', interactions: 145 },
      { topic: 'Governance', interactions: 120 },
      { topic: 'Education', interactions: 98 }
    ],
    responseQuality: {
      helpful: 0.87,
      accurate: 0.91,
      relevant: 0.89
    }
  };
}

function generateTrendData(days: number, min: number, max: number) {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: Math.floor(Math.random() * (max - min) + min)
  }));
}