import { NextRequest, NextResponse } from 'next/server';
import { generateAISummaryForSearch } from '@/lib/gemini';
import { safeSearch } from '@/lib/search-init';
import { z } from 'zod';

// Validation schema for AI summary parameters
const aiSummaryParamsSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  limit: z.coerce.number().min(1).max(10).optional().default(5),
  maxLength: z.coerce.number().min(50).max(500).optional().default(200),
  includeKeyPoints: z.coerce.boolean().optional().default(true),
});

/**
 * GET /api/search/ai-summary
 * Generate AI-powered summary of search results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate parameters
    const params = aiSummaryParamsSchema.parse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
      maxLength: searchParams.get('maxLength'),
      includeKeyPoints: searchParams.get('includeKeyPoints'),
    });

    // Get search results first
    const searchResults = await safeSearch(params.q, {
      limit: params.limit,
      offset: 0,
    });

    if (!searchResults.success || !searchResults.results || searchResults.results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No search results found to summarize',
      }, { status: 404 });
    }

    // Generate AI summary
    const aiSummary = await generateAISummaryForSearch(
      params.q,
      searchResults.results.map(r => r.article),
      {
        maxLength: params.maxLength,
        includeKeyPoints: params.includeKeyPoints,
      }
    );

    return NextResponse.json({
      success: true,
      query: params.q,
      resultCount: searchResults.results.length,
      aiSummary,
      searchResults: searchResults.results.map(r => ({
        id: r.article.id,
        title: r.article.title,
        relevanceScore: r.relevanceScore,
        division: r.article.division.name,
        authors: r.article.authors.map((a: any) => a.author.name),
      })),
    });

  } catch (error) {
    console.error('AI summary API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid parameters',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate AI summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search/ai-summary
 * Generate AI summary with advanced options
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const aiSummaryRequestSchema = z.object({
      query: z.string().min(1, 'Query is required'),
      articleIds: z.array(z.string()).optional(),
      options: z.object({
        maxLength: z.number().min(50).max(500).optional().default(200),
        focusAreas: z.array(z.string()).optional(),
        includeKeyPoints: z.boolean().optional().default(true),
        includeRecommendations: z.boolean().optional().default(false),
      }).optional().default({
        maxLength: 200,
        includeKeyPoints: true,
        includeRecommendations: false,
      }),
    });

    const params = aiSummaryRequestSchema.parse(body);

    let articles;
    
    if (params.articleIds && params.articleIds.length > 0) {
      // Use specific articles
      const { prisma } = await import('@/lib/prisma');
      const articleData = await prisma.article.findMany({
        where: {
          id: { in: params.articleIds },
          status: 'PUBLISHED',
        },
        include: {
          division: true,
          authors: {
            include: {
              author: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          mediaFiles: {
            include: {
              mediaFile: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
      articles = articleData;
    } else {
      // Get search results
      const searchResults = await safeSearch(params.query, { limit: 5 });
      if (!searchResults.success || !searchResults.results) {
        return NextResponse.json({
          success: false,
          error: 'No search results found to summarize',
        }, { status: 404 });
      }
      articles = searchResults.results.map(r => r.article);
    }

    if (articles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No articles found to summarize',
      }, { status: 404 });
    }

    // Generate AI summary
    const aiSummary = await generateAISummaryForSearch(
      params.query,
      articles,
      params.options
    );

    return NextResponse.json({
      success: true,
      query: params.query,
      articleCount: articles.length,
      aiSummary,
      articles: articles.map(article => ({
        id: article.id,
        title: article.title,
        division: article.division.name,
        authors: article.authors.map((a: any) => a.author.name),
      })),
    });

  } catch (error) {
    console.error('AI summary POST API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid request body',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate AI summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}