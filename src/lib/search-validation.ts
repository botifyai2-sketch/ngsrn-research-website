/**
 * Search Infrastructure Validation
 * Tests all components of the search system to ensure proper setup
 */

import { prisma } from '@/lib/prisma';
import { searchService } from '@/lib/search';
import { getSearchFilterOptions, getSearchAnalytics } from '@/lib/db/search';

export interface ValidationResult {
  component: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export class SearchInfrastructureValidator {
  private results: ValidationResult[] = [];

  /**
   * Run complete validation of search infrastructure
   */
  async validateAll(): Promise<ValidationResult[]> {
    this.results = [];

    await this.validateDatabaseConnection();
    await this.validateSearchIndex();
    await this.validateSearchService();
    await this.validateFilterOptions();
    await this.validateSearchAnalytics();

    return this.results;
  }

  /**
   * Test database connection and article data
   */
  private async validateDatabaseConnection(): Promise<void> {
    try {
      // Test basic connection
      await prisma.$connect();
      this.addResult('Database Connection', 'success', 'Successfully connected to database');

      // Check for articles
      const articleCount = await prisma.article.count();
      if (articleCount === 0) {
        this.addResult('Article Data', 'warning', 'No articles found in database - search will be empty');
      } else {
        this.addResult('Article Data', 'success', `Found ${articleCount} articles in database`);
      }

      // Check for published articles
      const publishedCount = await prisma.article.count({
        where: { status: 'PUBLISHED' }
      });
      
      if (publishedCount === 0) {
        this.addResult('Published Articles', 'warning', 'No published articles found - search index will be empty');
      } else {
        this.addResult('Published Articles', 'success', `Found ${publishedCount} published articles`);
      }

      // Check for research divisions
      const divisionCount = await prisma.researchDivision.count();
      if (divisionCount === 0) {
        this.addResult('Research Divisions', 'warning', 'No research divisions found');
      } else {
        this.addResult('Research Divisions', 'success', `Found ${divisionCount} research divisions`);
      }

      // Check for authors
      const authorCount = await prisma.author.count();
      if (authorCount === 0) {
        this.addResult('Authors', 'warning', 'No authors found');
      } else {
        this.addResult('Authors', 'success', `Found ${authorCount} authors`);
      }

    } catch (error) {
      this.addResult('Database Connection', 'error', `Database connection failed: ${error}`);
    }
  }

  /**
   * Test search index initialization
   */
  private async validateSearchIndex(): Promise<void> {
    try {
      await searchService.initializeIndex();
      const stats = await searchService.getSearchStats();
      
      if (stats.totalArticles === 0) {
        this.addResult('Search Index', 'warning', 'Search index is empty - no searchable articles');
      } else {
        this.addResult('Search Index', 'success', `Search index initialized with ${stats.totalArticles} articles`, stats);
      }
    } catch (error) {
      this.addResult('Search Index', 'error', `Search index initialization failed: ${error}`);
    }
  }

  /**
   * Test search service functionality
   */
  private async validateSearchService(): Promise<void> {
    try {
      // Test basic search
      const searchResults = await searchService.search('test', { limit: 5 });
      this.addResult('Search Service', 'success', `Search service working - returned ${searchResults.results.length} results`);

      // Test suggestions
      const suggestions = await searchService.getSuggestions('test', 3);
      this.addResult('Search Suggestions', 'success', `Suggestions working - returned ${suggestions.length} suggestions`);

      // Test popular terms
      const popularTerms = await searchService.getPopularTerms(5);
      this.addResult('Popular Terms', 'success', `Popular terms working - returned ${popularTerms.length} terms`);

    } catch (error) {
      this.addResult('Search Service', 'error', `Search service failed: ${error}`);
    }
  }

  /**
   * Test filter options
   */
  private async validateFilterOptions(): Promise<void> {
    try {
      const filterOptions = await getSearchFilterOptions();
      
      this.addResult('Filter Options', 'success', 
        `Filter options loaded - ${filterOptions.divisions.length} divisions, ${filterOptions.authors.length} authors, ${filterOptions.tags.length} tags`,
        {
          divisions: filterOptions.divisions.length,
          authors: filterOptions.authors.length,
          tags: filterOptions.tags.length
        }
      );
    } catch (error) {
      this.addResult('Filter Options', 'error', `Filter options failed: ${error}`);
    }
  }

  /**
   * Test search analytics
   */
  private async validateSearchAnalytics(): Promise<void> {
    try {
      const analytics = await getSearchAnalytics();
      
      this.addResult('Search Analytics', 'success', 
        `Analytics working - ${analytics.totalArticles} total, ${analytics.publishedArticles} published`,
        analytics
      );
    } catch (error) {
      this.addResult('Search Analytics', 'error', `Search analytics failed: ${error}`);
    }
  }

  /**
   * Add validation result
   */
  private addResult(component: string, status: 'success' | 'error' | 'warning', message: string, details?: any): void {
    this.results.push({
      component,
      status,
      message,
      details
    });
  }

  /**
   * Get summary of validation results
   */
  getSummary(): { total: number; success: number; warnings: number; errors: number } {
    return {
      total: this.results.length,
      success: this.results.filter(r => r.status === 'success').length,
      warnings: this.results.filter(r => r.status === 'warning').length,
      errors: this.results.filter(r => r.status === 'error').length
    };
  }

  /**
   * Check if validation passed (no errors)
   */
  isValid(): boolean {
    return this.results.every(r => r.status !== 'error');
  }
}

// Export singleton validator
export const searchValidator = new SearchInfrastructureValidator();

// Utility function for quick validation
export async function validateSearchInfrastructure(): Promise<{
  isValid: boolean;
  results: ValidationResult[];
  summary: { total: number; success: number; warnings: number; errors: number };
}> {
  const results = await searchValidator.validateAll();
  const summary = searchValidator.getSummary();
  const isValid = searchValidator.isValid();

  return {
    isValid,
    results,
    summary
  };
}