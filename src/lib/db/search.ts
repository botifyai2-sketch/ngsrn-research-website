import { prisma } from '@/lib/prisma';

/**
 * Database utilities for search functionality
 */

/**
 * Get all searchable articles with optimized queries
 */
export async function getSearchableArticles() {
  return await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date(),
      },
    },
    include: {
      division: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      authors: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              title: true,
              isLeadership: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      },
      mediaFiles: {
        select: {
          mediaFileId: true,
          order: true,
        },
      },
    },
    orderBy: [
      { publishedAt: 'desc' },
      { updatedAt: 'desc' },
    ],
  });
}

/**
 * Get articles modified since a specific date (for index updates)
 */
export async function getArticlesModifiedSince(since: Date) {
  return await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      updatedAt: {
        gt: since,
      },
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

/**
 * Get search filter options (for building filter UI)
 */
export async function getSearchFilterOptions() {
  const [divisions, authors, tags] = await Promise.all([
    // Get all research divisions
    prisma.researchDivision.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            articles: {
              where: {
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),

    // Get all authors with published articles
    prisma.author.findMany({
      where: {
        articles: {
          some: {
            article: {
              status: 'PUBLISHED',
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        title: true,
        isLeadership: true,
        _count: {
          select: {
            articles: {
              where: {
                article: {
                  status: 'PUBLISHED',
                },
              },
            },
          },
        },
      },
      orderBy: [
        { isLeadership: 'desc' },
        { name: 'asc' },
      ],
    }),

    // Get all unique tags from published articles
    prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        tags: {
          not: '[]',
        },
      },
      select: {
        tags: true,
      },
    }),
  ]);

  // Process tags to get unique list with counts
  const tagCounts = new Map<string, number>();
  tags.forEach(article => {
    try {
      const articleTags = JSON.parse(article.tags || '[]') as string[];
      articleTags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    } catch (error) {
      console.warn('Failed to parse tags for article:', error);
    }
  });

  const uniqueTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ name: tag, count }))
    .sort((a, b) => b.count - a.count);

  return {
    divisions: divisions.map(d => ({
      id: d.id,
      name: d.name,
      color: d.color,
      articleCount: d._count.articles,
    })),
    authors: authors.map(a => ({
      id: a.id,
      name: a.name,
      title: a.title,
      isLeadership: a.isLeadership,
      articleCount: a._count.articles,
    })),
    tags: uniqueTags,
  };
}

/**
 * Get search analytics data
 */
export async function getSearchAnalytics() {
  const [totalArticles, publishedArticles, recentArticles] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({
      where: {
        status: 'PUBLISHED',
      },
    }),
    prisma.article.count({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    }),
  ]);

  return {
    totalArticles,
    publishedArticles,
    recentArticles,
    indexableArticles: publishedArticles,
  };
}

/**
 * Create database indexes for better search performance
 */
export async function createSearchIndexes() {
  try {
    // Note: These would be SQL commands in a real PostgreSQL setup
    // For SQLite, we'll use what's available
    
    console.log('Search database indexes would be created here for PostgreSQL');
    console.log('Current setup uses SQLite which has limited full-text search capabilities');
    
    // In PostgreSQL, we would run:
    // CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_search 
    // ON articles USING GIN (to_tsvector('english', title || ' ' || content || ' ' || summary));
    
    // CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_published 
    // ON articles (status, published_at DESC) WHERE status = 'PUBLISHED';
    
    return true;
  } catch (error) {
    console.error('Failed to create search indexes:', error);
    return false;
  }
}