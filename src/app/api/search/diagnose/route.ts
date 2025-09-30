import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/search/diagnose
 * Diagnose search infrastructure issues
 */
export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: [],
    errors: [],
    warnings: []
  };

  try {
    // 1. Test database connection
    try {
      await prisma.$connect();
      diagnostics.checks.push({
        name: 'Database Connection',
        status: 'success',
        message: 'Database connection successful'
      });
    } catch (error) {
      diagnostics.checks.push({
        name: 'Database Connection',
        status: 'error',
        message: `Database connection failed: ${error}`
      });
      diagnostics.errors.push(`Database connection: ${error}`);
    }

    // 2. Check for articles
    try {
      const articleCount = await prisma.article.count();
      const publishedCount = await prisma.article.count({
        where: { status: 'PUBLISHED' }
      });

      diagnostics.checks.push({
        name: 'Article Data',
        status: articleCount > 0 ? 'success' : 'warning',
        message: `Found ${articleCount} total articles, ${publishedCount} published`,
        data: { total: articleCount, published: publishedCount }
      });

      if (articleCount === 0) {
        diagnostics.warnings.push('No articles found in database');
      }
      if (publishedCount === 0) {
        diagnostics.warnings.push('No published articles found');
      }
    } catch (error) {
      diagnostics.checks.push({
        name: 'Article Data',
        status: 'error',
        message: `Failed to query articles: ${error}`
      });
      diagnostics.errors.push(`Article query: ${error}`);
    }

    // 3. Check research divisions
    try {
      const divisionCount = await prisma.researchDivision.count();
      diagnostics.checks.push({
        name: 'Research Divisions',
        status: divisionCount > 0 ? 'success' : 'warning',
        message: `Found ${divisionCount} research divisions`,
        data: { count: divisionCount }
      });

      if (divisionCount === 0) {
        diagnostics.warnings.push('No research divisions found');
      }
    } catch (error) {
      diagnostics.checks.push({
        name: 'Research Divisions',
        status: 'error',
        message: `Failed to query divisions: ${error}`
      });
      diagnostics.errors.push(`Division query: ${error}`);
    }

    // 4. Check authors
    try {
      const authorCount = await prisma.author.count();
      diagnostics.checks.push({
        name: 'Authors',
        status: authorCount > 0 ? 'success' : 'warning',
        message: `Found ${authorCount} authors`,
        data: { count: authorCount }
      });

      if (authorCount === 0) {
        diagnostics.warnings.push('No authors found');
      }
    } catch (error) {
      diagnostics.checks.push({
        name: 'Authors',
        status: 'error',
        message: `Failed to query authors: ${error}`
      });
      diagnostics.errors.push(`Author query: ${error}`);
    }

    // 5. Test search service import
    try {
      const { searchService } = await import('@/lib/search');
      diagnostics.checks.push({
        name: 'Search Service Import',
        status: 'success',
        message: 'Search service imported successfully'
      });

      // 6. Test search service initialization
      try {
        await searchService.initializeIndex();
        const stats = await searchService.getSearchStats();
        
        diagnostics.checks.push({
          name: 'Search Service Initialization',
          status: stats.totalArticles > 0 ? 'success' : 'warning',
          message: `Search index initialized with ${stats.totalArticles} articles`,
          data: stats
        });

        if (stats.totalArticles === 0) {
          diagnostics.warnings.push('Search index is empty');
        }
      } catch (error) {
        diagnostics.checks.push({
          name: 'Search Service Initialization',
          status: 'error',
          message: `Search initialization failed: ${error}`
        });
        diagnostics.errors.push(`Search initialization: ${error}`);
      }

      // 7. Test basic search functionality
      try {
        const testResults = await searchService.search('test', { limit: 1 });
        diagnostics.checks.push({
          name: 'Search Functionality',
          status: 'success',
          message: `Search test completed - returned ${testResults.results.length} results`,
          data: { resultCount: testResults.results.length, total: testResults.total }
        });
      } catch (error) {
        diagnostics.checks.push({
          name: 'Search Functionality',
          status: 'error',
          message: `Search test failed: ${error}`
        });
        diagnostics.errors.push(`Search test: ${error}`);
      }

    } catch (error) {
      diagnostics.checks.push({
        name: 'Search Service Import',
        status: 'error',
        message: `Failed to import search service: ${error}`
      });
      diagnostics.errors.push(`Search service import: ${error}`);
    }

    // 8. Test API endpoints
    try {
      // Test filter options
      const { getSearchFilterOptions } = await import('@/lib/db/search');
      const filterOptions = await getSearchFilterOptions();
      
      diagnostics.checks.push({
        name: 'Filter Options',
        status: 'success',
        message: `Filter options loaded - ${filterOptions.divisions.length} divisions, ${filterOptions.authors.length} authors, ${filterOptions.tags.length} tags`,
        data: {
          divisions: filterOptions.divisions.length,
          authors: filterOptions.authors.length,
          tags: filterOptions.tags.length
        }
      });
    } catch (error) {
      diagnostics.checks.push({
        name: 'Filter Options',
        status: 'error',
        message: `Filter options failed: ${error}`
      });
      diagnostics.errors.push(`Filter options: ${error}`);
    }

    // Summary
    diagnostics.summary = {
      totalChecks: diagnostics.checks.length,
      successful: diagnostics.checks.filter((c: any) => c.status === 'success').length,
      warnings: diagnostics.checks.filter((c: any) => c.status === 'warning').length,
      errors: diagnostics.checks.filter((c: any) => c.status === 'error').length,
      overallStatus: diagnostics.errors.length === 0 ? 
        (diagnostics.warnings.length === 0 ? 'healthy' : 'warning') : 'error'
    };

    return NextResponse.json({
      success: true,
      diagnostics
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Diagnostic failed: ${error}`,
      diagnostics: {
        ...diagnostics,
        summary: {
          totalChecks: 0,
          successful: 0,
          warnings: 0,
          errors: 1,
          overallStatus: 'error'
        }
      }
    }, { status: 500 });
  }
}