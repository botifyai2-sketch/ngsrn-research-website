import { NextRequest, NextResponse } from 'next/server';
import { safeSearch } from '@/lib/search-init';
import { SearchFilters } from '@/types';
import { z } from 'zod';

// Validation schema for search parameters
const searchParamsSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  filters: z.string().optional(),
});

const filtersSchema = z.object({
  divisions: z.array(z.string()).optional().default([]),
  authors: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  dateRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  }).optional().default({
    start: new Date('2020-01-01'),
    end: new Date(),
  }),
});

/**
 * GET /api/search
 * Search articles with query and optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate search parameters
    const params = searchParamsSchema.parse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      filters: searchParams.get('filters'),
    });

    // Parse filters if provided
    let filters: SearchFilters | undefined;
    if (params.filters) {
      try {
        const parsedFilters = JSON.parse(params.filters);
        filters = filtersSchema.parse(parsedFilters);
      } catch {
        return NextResponse.json(
          { error: 'Invalid filters format' },
          { status: 400 }
        );
      }
    }

    // Perform search
    const searchResults = await safeSearch(params.q, {
      limit: params.limit,
      offset: params.offset,
      filters,
    });

    if (!searchResults.success) {
      return NextResponse.json(
        { error: searchResults.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      query: params.q,
      results: searchResults.results,
      total: searchResults.total,
      hasMore: searchResults.hasMore,
    });

  } catch (error) {
    console.error('Search API error:', error);

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
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search
 * Advanced search with complex filters in request body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const searchRequestSchema = z.object({
      query: z.string().min(1, 'Query is required'),
      limit: z.number().min(1).max(100).optional().default(20),
      offset: z.number().min(0).optional().default(0),
      filters: filtersSchema.optional(),
    });

    const params = searchRequestSchema.parse(body);

    // Perform search
    const searchResults = await safeSearch(params.query, {
      limit: params.limit,
      offset: params.offset,
      filters: params.filters,
    });

    if (!searchResults.success) {
      return NextResponse.json(
        { error: searchResults.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      query: params.query,
      results: searchResults.results,
      total: searchResults.total,
      hasMore: searchResults.hasMore,
    });

  } catch (error) {
    console.error('Search API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request body',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}