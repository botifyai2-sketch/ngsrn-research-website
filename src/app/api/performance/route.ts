import { NextRequest, NextResponse } from 'next/server';
import { cache, cacheKeys } from '@/lib/cache';

// GET /api/performance - Get performance metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');

    if (metric) {
      // Get specific metric
      const data = await cache.get(cacheKeys.seoMetadata(`performance:${metric}`));
      return NextResponse.json({ metric, data });
    }

    // Get all performance metrics (in a real app, you'd store these properly)
    const metrics = {
      cache: {
        status: 'operational',
        hitRate: 0.85, // This would be calculated from actual data
      },
      api: {
        averageResponseTime: 120, // ms
        errorRate: 0.02, // 2%
      },
      images: {
        optimizationRate: 0.95,
        averageLoadTime: 800, // ms
      },
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

// POST /api/performance - Record performance metric
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metric, value, timestamp } = body;

    if (!metric || value === undefined) {
      return NextResponse.json(
        { error: 'Metric name and value are required' },
        { status: 400 }
      );
    }

    // Store metric (in production, you'd use a proper time-series database)
    const key = cacheKeys.seoMetadata(`performance:${metric}`);
    const existingData = (await cache.get(key) as any[]) || [];
    
    const newData = [
      ...existingData.slice(-99), // Keep last 100 entries
      {
        value,
        timestamp: timestamp || Date.now(),
      },
    ];

    await cache.set(key, newData, 3600); // 1 hour TTL

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording performance metric:', error);
    return NextResponse.json(
      { error: 'Failed to record performance metric' },
      { status: 500 }
    );
  }
}