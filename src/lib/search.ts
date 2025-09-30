import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';
import { prisma } from '@/lib/prisma';
import { ArticleWithRelations, SearchResult, SearchFilters } from '@/types';
import { calculateAdvancedRanking, diversifyResults } from '@/lib/search-ranking';

/**
 * Search service for articles using Fuse.js for fuzzy search
 * This provides a foundation that can be upgraded to Elasticsearch later
 */

export interface SearchableArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  authorNames: string[];
  divisionName: string;
  publishedAt: Date | null;
  slug: string;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
}

class SearchService {
  private fuseIndex: Fuse<SearchableArticle> | null = null;
  private searchableArticles: SearchableArticle[] = [];
  private lastIndexUpdate: Date | null = null;

  /**
   * Initialize or update the search index
   */
  async initializeIndex(): Promise<void> {
    try {
      // Fetch all published articles with relations
      const articles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            lte: new Date(),
          },
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
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });

      // Transform articles to searchable format
      this.searchableArticles = articles.map(article => ({
        id: article.id,
        title: article.title,
        content: article.content,
        summary: article.summary,
        tags: JSON.parse(article.tags || '[]'),
        authorNames: article.authors.map(a => a.author.name),
        divisionName: article.division.name,
        publishedAt: article.publishedAt,
        slug: article.slug,
      }));

      // Configure Fuse.js options for optimal search
      const fuseOptions: IFuseOptions<SearchableArticle> = {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'summary', weight: 0.3 },
          { name: 'content', weight: 0.2 },
          { name: 'tags', weight: 0.05 },
          { name: 'authorNames', weight: 0.03 },
          { name: 'divisionName', weight: 0.02 },
        ],
        threshold: 0.4, // Lower = more strict matching
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 2,
        ignoreLocation: true,
        findAllMatches: true,
      };

      this.fuseIndex = new Fuse(this.searchableArticles, fuseOptions);
      this.lastIndexUpdate = new Date();

      console.log(`Search index initialized with ${this.searchableArticles.length} articles`);
    } catch (error) {
      console.error('Failed to initialize search index:', error);
      throw new Error('Search index initialization failed');
    }
  }

  /**
   * Check if index needs updating (articles modified since last index)
   */
  async shouldUpdateIndex(): Promise<boolean> {
    if (!this.lastIndexUpdate) return true;

    try {
      const recentlyModified = await prisma.article.findFirst({
        where: {
          updatedAt: {
            gt: this.lastIndexUpdate,
          },
          status: 'PUBLISHED',
        },
      });

      return !!recentlyModified;
    } catch (error) {
      console.error('Error checking index freshness:', error);
      return true; // Err on the side of updating
    }
  }

  /**
   * Ensure index is fresh before searching
   */
  async ensureFreshIndex(): Promise<void> {
    if (await this.shouldUpdateIndex()) {
      await this.initializeIndex();
    }
  }

  /**
   * Search articles with query and filters
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    await this.ensureFreshIndex();

    if (!this.fuseIndex) {
      throw new Error('Search index not initialized');
    }

    const { limit = 20, offset = 0, filters } = options;

    // Perform fuzzy search
    let searchResults = this.fuseIndex.search(query);

    // Apply filters
    if (filters) {
      searchResults = this.applyFilters(searchResults, filters);
    }

    // Calculate pagination
    const total = searchResults.length;
    const paginatedResults = searchResults.slice(offset, offset + limit);

    // Convert to SearchResult format
    let results: SearchResult[] = await Promise.all(
      paginatedResults.map(async (result) => {
        const article = await this.getFullArticle(result.item.id);
        return {
          article,
          relevanceScore: 1 - (result.score || 0), // Convert Fuse score to relevance
          highlightedSnippets: this.extractHighlightedSnippets(result),
        };
      })
    );

    // Apply advanced ranking
    results = calculateAdvancedRanking(results, query);
    
    // Diversify results to avoid too many from same division
    results = diversifyResults(results, 3);

    return {
      results,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Apply search filters to results
   */
  private applyFilters(
    results: FuseResult<SearchableArticle>[],
    filters: SearchFilters
  ): FuseResult<SearchableArticle>[] {
    return results.filter(result => {
      const article = result.item;

      // Filter by divisions
      if (filters.divisions.length > 0) {
        if (!filters.divisions.includes(article.divisionName)) {
          return false;
        }
      }

      // Filter by authors
      if (filters.authors.length > 0) {
        const hasMatchingAuthor = article.authorNames.some((name: string) =>
          filters.authors.includes(name)
        );
        if (!hasMatchingAuthor) {
          return false;
        }
      }

      // Filter by tags
      if (filters.tags.length > 0) {
        const hasMatchingTag = article.tags.some((tag: string) =>
          filters.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Filter by date range
      if (article.publishedAt) {
        const publishedDate = new Date(article.publishedAt);
        if (publishedDate < filters.dateRange.start || publishedDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Extract highlighted snippets from search matches
   */
  private extractHighlightedSnippets(result: FuseResult<SearchableArticle>): string[] {
    const snippets: string[] = [];

    if (result.matches) {
      for (const match of result.matches) {
        if (match.value && match.indices) {
          // Extract context around matches
          const text = match.value;
          const contextLength = 100;

          for (const [start, end] of match.indices) {
            const snippetStart = Math.max(0, start - contextLength);
            const snippetEnd = Math.min(text.length, end + contextLength);
            
            let snippet = text.substring(snippetStart, snippetEnd);
            
            // Add ellipsis if truncated
            if (snippetStart > 0) snippet = '...' + snippet;
            if (snippetEnd < text.length) snippet = snippet + '...';

            // Highlight the matched portion
            const matchedText = text.substring(start, end + 1);
            snippet = snippet.replace(matchedText, `<mark>${matchedText}</mark>`);

            snippets.push(snippet);
          }
        }
      }
    }

    return snippets.slice(0, 3); // Limit to 3 snippets per result
  }

  /**
   * Get full article with relations for search result
   */
  private async getFullArticle(articleId: string): Promise<ArticleWithRelations> {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
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

    if (!article) {
      throw new Error(`Article not found: ${articleId}`);
    }

    return article;
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
    await this.ensureFreshIndex();

    if (!this.fuseIndex || partialQuery.length < 2) {
      return [];
    }

    const results = this.fuseIndex.search(partialQuery);
    const suggestions = new Set<string>();

    // Extract unique terms from titles and tags
    results.slice(0, limit * 2).forEach(result => {
      const article = result.item;
      
      // Add title words that start with the query
      const titleWords = article.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.startsWith(partialQuery.toLowerCase()) && word.length > partialQuery.length) {
          suggestions.add(word);
        }
      });

      // Add matching tags
      article.tags.forEach(tag => {
        if (tag.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get popular search terms (based on article tags and titles)
   */
  async getPopularTerms(limit: number = 10): Promise<string[]> {
    await this.ensureFreshIndex();

    const termFrequency = new Map<string, number>();

    this.searchableArticles.forEach(article => {
      // Count tag frequency
      article.tags.forEach(tag => {
        termFrequency.set(tag.toLowerCase(), (termFrequency.get(tag.toLowerCase()) || 0) + 1);
      });

      // Count significant words in titles
      const titleWords = article.title.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !this.isStopWord(word));
      
      titleWords.forEach(word => {
        termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
      });
    });

    // Sort by frequency and return top terms
    return Array.from(termFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([term]) => term);
  }

  /**
   * Simple stop word filter
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);
    return stopWords.has(word.toLowerCase());
  }

  /**
   * Get search analytics/stats
   */
  async getSearchStats(): Promise<{
    totalArticles: number;
    lastIndexUpdate: Date | null;
    indexSize: number;
  }> {
    return {
      totalArticles: this.searchableArticles.length,
      lastIndexUpdate: this.lastIndexUpdate,
      indexSize: this.searchableArticles.length,
    };
  }
}

// Export singleton instance
export const searchService = new SearchService();

// Utility functions for search ranking
export function calculateRelevanceScore(
  query: string,
  article: SearchableArticle,
  fuseScore: number
): number {
  let score = 1 - fuseScore; // Convert Fuse score to relevance

  // Boost score for exact title matches
  if (article.title.toLowerCase().includes(query.toLowerCase())) {
    score += 0.2;
  }

  // Boost score for recent articles
  if (article.publishedAt) {
    const daysSincePublished = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished < 30) {
      score += 0.1;
    } else if (daysSincePublished < 90) {
      score += 0.05;
    }
  }

  // Boost score for articles with matching tags
  const queryWords = query.toLowerCase().split(/\s+/);
  const matchingTags = article.tags.filter(tag =>
    queryWords.some(word => tag.toLowerCase().includes(word))
  );
  score += matchingTags.length * 0.05;

  return Math.min(score, 1); // Cap at 1.0
}