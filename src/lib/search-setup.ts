/**
 * Search Infrastructure Setup
 * Ensures all search components are properly configured and initialized
 */

import { prisma } from '@/lib/prisma';
import { searchService } from '@/lib/search';
import { createSearchIndexes } from '@/lib/db/search';

export interface SetupResult {
  step: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  details?: any;
}

export class SearchInfrastructureSetup {
  private results: SetupResult[] = [];

  /**
   * Run complete setup of search infrastructure
   */
  async setupAll(): Promise<SetupResult[]> {
    this.results = [];

    await this.setupDatabase();
    await this.setupSearchIndexes();
    await this.initializeSearchService();
    await this.validateSetup();

    return this.results;
  }

  /**
   * Ensure database is ready for search
   */
  private async setupDatabase(): Promise<void> {
    try {
      // Test database connection
      await prisma.$connect();
      this.addResult('Database Connection', 'success', 'Database connection established');

      // Check if we have sample data
      const articleCount = await prisma.article.count();
      if (articleCount === 0) {
        this.addResult('Sample Data', 'skipped', 'No articles found - consider running database seed');
      } else {
        this.addResult('Sample Data', 'success', `Found ${articleCount} articles in database`);
      }

    } catch (error) {
      this.addResult('Database Connection', 'error', `Database setup failed: ${error}`);
    }
  }

  /**
   * Create database indexes for search performance
   */
  private async setupSearchIndexes(): Promise<void> {
    try {
      const indexResult = await createSearchIndexes();
      if (indexResult) {
        this.addResult('Database Indexes', 'success', 'Search indexes created successfully');
      } else {
        this.addResult('Database Indexes', 'skipped', 'Search indexes creation skipped (SQLite limitations)');
      }
    } catch (error) {
      this.addResult('Database Indexes', 'error', `Index creation failed: ${error}`);
    }
  }

  /**
   * Initialize search service and build index
   */
  private async initializeSearchService(): Promise<void> {
    try {
      await searchService.initializeIndex();
      const stats = await searchService.getSearchStats();
      
      this.addResult('Search Service', 'success', 
        `Search service initialized with ${stats.totalArticles} articles`,
        stats
      );
    } catch (error) {
      this.addResult('Search Service', 'error', `Search service initialization failed: ${error}`);
    }
  }

  /**
   * Validate the complete setup
   */
  private async validateSetup(): Promise<void> {
    try {
      // Test search functionality
      const testResults = await searchService.search('test', { limit: 1 });
      this.addResult('Search Validation', 'success', 
        `Search functionality validated - test query returned ${testResults.results.length} results`
      );

      // Test suggestions
      const suggestions = await searchService.getSuggestions('test', 1);
      this.addResult('Suggestions Validation', 'success', 
        `Suggestions functionality validated - returned ${suggestions.length} suggestions`
      );

    } catch (error) {
      this.addResult('Search Validation', 'error', `Search validation failed: ${error}`);
    }
  }

  /**
   * Add setup result
   */
  private addResult(step: string, status: 'success' | 'error' | 'skipped', message: string, details?: any): void {
    this.results.push({
      step,
      status,
      message,
      details
    });
  }

  /**
   * Get setup summary
   */
  getSummary(): { total: number; success: number; errors: number; skipped: number } {
    return {
      total: this.results.length,
      success: this.results.filter(r => r.status === 'success').length,
      errors: this.results.filter(r => r.status === 'error').length,
      skipped: this.results.filter(r => r.status === 'skipped').length
    };
  }

  /**
   * Check if setup was successful
   */
  isSuccessful(): boolean {
    return this.results.every(r => r.status !== 'error');
  }
}

// Export singleton setup
export const searchSetup = new SearchInfrastructureSetup();

// Utility function for quick setup
export async function setupSearchInfrastructure(): Promise<{
  isSuccessful: boolean;
  results: SetupResult[];
  summary: { total: number; success: number; errors: number; skipped: number };
}> {
  const results = await searchSetup.setupAll();
  const summary = searchSetup.getSummary();
  const isSuccessful = searchSetup.isSuccessful();

  return {
    isSuccessful,
    results,
    summary
  };
}

/**
 * Quick health check for search infrastructure
 */
export async function checkSearchHealth(): Promise<{
  isHealthy: boolean;
  issues: string[];
  stats: any;
}> {
  const issues: string[] = [];
  let stats: any = {};

  try {
    // Check database connection
    await prisma.$connect();
    
    // Check for articles
    const articleCount = await prisma.article.count();
    if (articleCount === 0) {
      issues.push('No articles in database');
    }

    // Check search service
    const searchStats = await searchService.getSearchStats();
    stats = searchStats;
    
    if (searchStats.totalArticles === 0) {
      issues.push('Search index is empty');
    }

    // Test basic search functionality
    await searchService.search('test', { limit: 1 });

  } catch (error) {
    issues.push(`Search system error: ${error}`);
  }

  return {
    isHealthy: issues.length === 0,
    issues,
    stats
  };
}