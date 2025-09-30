import { NextResponse } from 'next/server';
import { getSearchFilterOptions } from '@/lib/db/search';

/**
 * GET /api/search/filters
 * Get available filter options for search interface
 */
export async function GET() {
  try {
    const filterOptions = await getSearchFilterOptions();

    return NextResponse.json({
      success: true,
      filters: filterOptions,
    });

  } catch (error) {
    console.error('Search filters API error:', error);

    return NextResponse.json(
      { error: 'Failed to get filter options' },
      { status: 500 }
    );
  }
}