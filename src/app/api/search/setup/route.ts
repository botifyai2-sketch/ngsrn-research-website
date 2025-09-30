import { NextResponse } from 'next/server';
import { setupSearchInfrastructure, checkSearchHealth } from '@/lib/search-setup';

/**
 * GET /api/search/setup
 * Check search infrastructure health
 */
export async function GET() {
  try {
    const health = await checkSearchHealth();

    return NextResponse.json({
      success: true,
      health,
    });

  } catch (error) {
    console.error('Search health check error:', error);

    return NextResponse.json(
      { 
        success: false,
        error: 'Health check failed',
        health: {
          isHealthy: false,
          issues: [`Health check system error: ${error}`],
          stats: {}
        }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search/setup
 * Run complete search infrastructure setup
 */
export async function POST() {
  try {
    const setup = await setupSearchInfrastructure();

    return NextResponse.json({
      success: setup.isSuccessful,
      setup: {
        isSuccessful: setup.isSuccessful,
        summary: setup.summary,
        results: setup.results,
      },
    });

  } catch (error) {
    console.error('Search setup error:', error);

    return NextResponse.json(
      { 
        success: false,
        error: 'Search setup failed',
        setup: {
          isSuccessful: false,
          summary: { total: 0, success: 0, errors: 1, skipped: 0 },
          results: [{
            step: 'Setup System',
            status: 'error' as const,
            message: `Setup system failed: ${error}`,
          }],
        },
      },
      { status: 500 }
    );
  }
}