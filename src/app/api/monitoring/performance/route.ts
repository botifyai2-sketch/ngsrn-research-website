import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PerformanceMetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  timestamp: z.string().transform(str => new Date(str)),
  url: z.string(),
  sessionId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const metric = PerformanceMetricSchema.parse(body);

    // Log performance metric
    console.log('Performance Metric:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: metric.url,
      timestamp: metric.timestamp
    });

    // In production, send to performance monitoring service
    if (process.env.NEW_RELIC_LICENSE_KEY) {
      // Example New Relic integration
      // newrelic.recordMetric(`Custom/${metric.name}`, metric.value);
    }

    // Store in database for analysis
    // await prisma.performanceMetric.create({
    //   data: {
    //     name: metric.name,
    //     value: metric.value,
    //     rating: metric.rating,
    //     timestamp: metric.timestamp,
    //     url: metric.url,
    //     sessionId: metric.sessionId
    //   }
    // });

    // Alert on poor performance
    if (metric.rating === 'poor') {
      console.warn(`Poor performance detected: ${metric.name} = ${metric.value}ms on ${metric.url}`);
      
      // In production, send alert to monitoring service
      // await sendSlackAlert(`Performance Alert: ${metric.name} is ${metric.value}ms (poor) on ${metric.url}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing performance metric:', error);
    return NextResponse.json(
      { error: 'Failed to process performance metric' },
      { status: 500 }
    );
  }
}