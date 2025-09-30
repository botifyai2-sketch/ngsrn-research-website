import { NextResponse } from 'next/server';
import { searchService } from '@/lib/search';

/**
 * GET /api/search/stats
 * Get search index statistics and health information
 */
export async function GET() {
  try {
    // Get search statistics
    const stats = await searchService.getSearchStats();

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        status: 'healthy',
        lastIndexUpdate: stats.lastIndexUpdate?.toISOString() || null,
      },
    });

  } catch (error) {
    console.error('Search stats API error:', error);

    return NextResponse.json(
      { 
        error: 'Failed to get search statistics',
        stats: {
          status: 'unhealthy',
          totalArticles: 0,
          lastIndexUpdate: null,
          indexSize: 0,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search/stats
 * Force refresh of search index
 */
export async function POST() {
  try {
    // Force index refresh
    await searchService.initializeIndex();
    
    // Get updated stats
    const stats = await searchService.getSearchStats();

    return NextResponse.json({
      success: true,
      message: 'Search index refreshed successfully',
      stats: {
        ...stats,
        status: 'healthy',
        lastIndexUpdate: stats.lastIndexUpdate?.toISOString() || null,
      },
    });

  } catch (error) {
    console.error('Search index refresh error:', error);

    return NextResponse.json(
      { error: 'Failed to refresh search index' },
      { status: 500 }
    );
  }
}