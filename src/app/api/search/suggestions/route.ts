import { NextRequest, NextResponse } from 'next/server';
import { safeSuggestions } from '@/lib/search-init';
import { z } from 'zod';

// Validation schema for suggestion parameters
const suggestionParamsSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  limit: z.coerce.number().min(1).max(20).optional().default(5),
});

/**
 * GET /api/search/suggestions
 * Get search suggestions based on partial query
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate parameters
    const params = suggestionParamsSchema.parse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
    });

    // Get suggestions
    const result = await safeSuggestions(params.q, params.limit);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      query: params.q,
      suggestions: result.suggestions,
    });

  } catch (error) {
    console.error('Search suggestions API error:', error);

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
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}