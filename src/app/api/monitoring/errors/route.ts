import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ErrorReportSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  url: z.string(),
  lineNumber: z.number().optional(),
  columnNumber: z.number().optional(),
  userAgent: z.string(),
  timestamp: z.string().transform(str => new Date(str)),
  userId: z.string().optional(),
  sessionId: z.string(),
  additionalData: z.record(z.string(), z.any()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const errorReport = ErrorReportSchema.parse(body);

    // Log error to console (in production, this would go to a logging service)
    console.error('Client Error Report:', {
      message: errorReport.message,
      url: errorReport.url,
      timestamp: errorReport.timestamp,
      sessionId: errorReport.sessionId,
      userId: errorReport.userId,
      stack: errorReport.stack
    });

    // In production, send to error tracking service (Sentry, Bugsnag, etc.)
    if (process.env.SENTRY_DSN) {
      // Example Sentry integration
      // Sentry.captureException(new Error(errorReport.message), {
      //   tags: {
      //     sessionId: errorReport.sessionId,
      //     userId: errorReport.userId
      //   },
      //   extra: errorReport.additionalData
      // });
    }

    // Store in database for analysis
    // await prisma.errorLog.create({
    //   data: {
    //     message: errorReport.message,
    //     stack: errorReport.stack,
    //     url: errorReport.url,
    //     lineNumber: errorReport.lineNumber,
    //     columnNumber: errorReport.columnNumber,
    //     userAgent: errorReport.userAgent,
    //     timestamp: errorReport.timestamp,
    //     userId: errorReport.userId,
    //     sessionId: errorReport.sessionId,
    //     additionalData: errorReport.additionalData
    //   }
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing error report:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}