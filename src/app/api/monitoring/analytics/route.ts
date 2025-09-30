import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const AnalyticsEventSchema = z.object({
  event: z.string(),
  category: z.string(),
  action: z.string(),
  label: z.string().optional(),
  value: z.number().optional(),
  customDimensions: z.record(z.string(), z.string()).optional(),
  sessionId: z.string(),
  userId: z.string().optional(),
  timestamp: z.string().transform(str => new Date(str)),
  url: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = AnalyticsEventSchema.parse(body);

    // Log analytics event
    console.log('Analytics Event:', {
      event: event.event,
      category: event.category,
      action: event.action,
      label: event.label,
      url: event.url,
      timestamp: event.timestamp
    });

    // Store in database for analysis
    // await prisma.analyticsEvent.create({
    //   data: {
    //     event: event.event,
    //     category: event.category,
    //     action: event.action,
    //     label: event.label,
    //     value: event.value,
    //     customDimensions: event.customDimensions,
    //     sessionId: event.sessionId,
    //     userId: event.userId,
    //     timestamp: event.timestamp,
    //     url: event.url
    //   }
    // });

    // Process specific events
    switch (event.event) {
      case 'search':
        // Track search analytics
        await trackSearchAnalytics(event);
        break;
        
      case 'ai_interaction':
        // Track AI usage
        await trackAIUsage(event);
        break;
        
      case 'page_view':
        // Track page views
        await trackPageView(event);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing analytics event:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics event' },
      { status: 500 }
    );
  }
}

async function trackSearchAnalytics(event: any) {
  // Aggregate search data for insights
  console.log('Search Analytics:', {
    query: event.label,
    results: event.value,
    sessionId: event.sessionId
  });
}

async function trackAIUsage(event: any) {
  // Track AI assistant usage patterns
  console.log('AI Usage:', {
    type: event.action,
    success: event.customDimensions?.success === 'true',
    sessionId: event.sessionId
  });
}

async function trackPageView(event: any) {
  // Track page view patterns
  console.log('Page View:', {
    page: event.label,
    title: event.customDimensions?.page_title,
    referrer: event.customDimensions?.referrer,
    sessionId: event.sessionId
  });
}