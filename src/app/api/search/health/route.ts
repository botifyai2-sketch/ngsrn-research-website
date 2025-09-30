import { NextResponse } from 'next/server';
import { initializeSearchInfrastructure, isSearchInitialized } from '@/lib/search-init';

/**
 * GET /api/search/health
 * Check search infrastructure health and initialize if needed
 */
export async function GET() {
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      initialized: isSearchInitialized(),
      status: 'checking',
      message: '',
      details: {}
    };

    // Try to initialize if not already done
    if (!healthCheck.initialized) {
      const initResult = await initializeSearchInfrastructure();
      healthCheck.initialized = initResult.success;
      healthCheck.status = initResult.success ? 'healthy' : 'error';
      healthCheck.message = initResult.message;
      healthCheck.details = initResult.details || {};
    } else {
      healthCheck.status = 'healthy';
      healthCheck.message = 'Search infrastructure is running';
    }

    return NextResponse.json({
      success: healthCheck.status !== 'error',
      health: healthCheck,
    });

  } catch (error) {
    console.error('Search health check failed:', error);

    return NextResponse.json({
      success: false,
      health: {
        timestamp: new Date().toISOString(),
        initialized: false,
        status: 'error',
        message: `Health check failed: ${error}`,
        details: { error: String(error) }
      },
    }, { status: 500 });
  }
}

/**
 * POST /api/search/health
 * Force re-initialization of search infrastructure
 */
export async function POST() {
  try {
    // Reset and re-initialize
    const { resetSearchInitialization } = await import('@/lib/search-init');
    resetSearchInitialization();
    
    const initResult = await initializeSearchInfrastructure();

    return NextResponse.json({
      success: initResult.success,
      message: initResult.success ? 'Search infrastructure re-initialized successfully' : 'Re-initialization failed',
      details: initResult,
    });

  } catch (error) {
    console.error('Search re-initialization failed:', error);

    return NextResponse.json({
      success: false,
      message: `Re-initialization failed: ${error}`,
      details: { error: String(error) }
    }, { status: 500 });
  }
}