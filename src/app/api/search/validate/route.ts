import { NextResponse } from 'next/server';
import { validateSearchInfrastructure } from '@/lib/search-validation';

/**
 * GET /api/search/validate
 * Validate search infrastructure setup and health
 */
export async function GET() {
  try {
    const validation = await validateSearchInfrastructure();

    return NextResponse.json({
      success: true,
      validation: {
        isValid: validation.isValid,
        summary: validation.summary,
        results: validation.results,
      },
    });

  } catch (error) {
    console.error('Search validation error:', error);

    return NextResponse.json(
      { 
        success: false,
        error: 'Search validation failed',
        validation: {
          isValid: false,
          summary: { total: 0, success: 0, warnings: 0, errors: 1 },
          results: [{
            component: 'Validation System',
            status: 'error' as const,
            message: `Validation system failed: ${error}`,
          }],
        },
      },
      { status: 500 }
    );
  }
}