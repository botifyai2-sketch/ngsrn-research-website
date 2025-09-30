import { NextRequest, NextResponse } from 'next/server';
import { safePopularTerms } from '@/lib/search-init';
import { z } from 'zod';

// Validation schema for popular terms parameters
const popularParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

/**
 * GET /api/search/popular
 * Get popular search terms based on article content
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate parameters
    const params = popularParamsSchema.parse({
      limit: searchParams.get('limit'),
    });

    // Get popular terms
    const result = await safePopularTerms(params.limit);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      popularTerms: result.terms,
    });

  } catch (error) {
    console.error('Popular terms API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid parameters',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get popular terms' },
      { status: 500 }
    );
  }
}