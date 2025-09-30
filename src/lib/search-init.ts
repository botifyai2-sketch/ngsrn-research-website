/**
 * Search Infrastructure Initialization
 * Ensures search system is properly set up and handles initialization errors gracefully
 */

import { prisma } from '@/lib/prisma';

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize search infrastructure with proper error handling
 */
export async function initializeSearchInfrastructure(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  // Return existing initialization if in progress
  if (initializationPromise) {
    try {
      await initializationPromise;
      return { success: true, message: 'Search infrastructure already initialized' };
    } catch (error) {
      return { success: false, message: `Initialization failed: ${error}` };
    }
  }

  // Start initialization
  initializationPromise = performInitialization();

  try {
    await initializationPromise;
    isInitialized = true;
    return { success: true, message: 'Search infrastructure initialized successfully' };
  } catch (error) {
    initializationPromise = null; // Reset so it can be retried
    return { success: false, message: `Initialization failed: ${error}`, details: error };
  }
}

/**
 * Perform the actual initialization steps
 */
async function performInitialization(): Promise<void> {
  try {
    // 1. Test database connection
    await prisma.$connect();
    console.log('✅ Database connection established');

    // 2. Check for required data
    const articleCount = await prisma.article.count({
      where: { status: 'PUBLISHED' }
    });
    
    if (articleCount === 0) {
      console.warn('⚠️ No published articles found - search index will be empty');
    } else {
      console.log(`✅ Found ${articleCount} published articles`);
    }

    // 3. Initialize search service (lazy import to avoid circular dependencies)
    const { searchService } = await import('@/lib/search');
    await searchService.initializeIndex();
    console.log('✅ Search service initialized');

    console.log('🎉 Search infrastructure initialization complete');
  } catch (error) {
    console.error('❌ Search infrastructure initialization failed:', error);
    throw error;
  }
}

/**
 * Check if search infrastructure is initialized
 */
export function isSearchInitialized(): boolean {
  return isInitialized;
}

/**
 * Reset initialization state (for testing)
 */
export function resetSearchInitialization(): void {
  isInitialized = false;
  initializationPromise = null;
}

/**
 * Safe search wrapper that initializes if needed
 */
export async function safeSearch(query: string, options: any = {}): Promise<{
  success: boolean;
  results?: any[];
  total?: number;
  hasMore?: boolean;
  error?: string;
}> {
  try {
    // Ensure initialization
    if (!isInitialized) {
      const initResult = await initializeSearchInfrastructure();
      if (!initResult.success) {
        return { success: false, error: initResult.message };
      }
    }

    // Perform search
    const { searchService } = await import('@/lib/search');
    const searchResults = await searchService.search(query, options);
    
    return {
      success: true,
      results: searchResults.results,
      total: searchResults.total,
      hasMore: searchResults.hasMore
    };
  } catch (error) {
    console.error('Search failed:', error);
    return { success: false, error: `Search failed: ${error}` };
  }
}

/**
 * Safe suggestions wrapper
 */
export async function safeSuggestions(query: string, limit: number = 5): Promise<{
  success: boolean;
  suggestions?: string[];
  error?: string;
}> {
  try {
    if (!isInitialized) {
      const initResult = await initializeSearchInfrastructure();
      if (!initResult.success) {
        return { success: false, error: initResult.message };
      }
    }

    const { searchService } = await import('@/lib/search');
    const suggestions = await searchService.getSuggestions(query, limit);
    
    return { success: true, suggestions };
  } catch (error) {
    console.error('Suggestions failed:', error);
    return { success: false, error: `Suggestions failed: ${error}` };
  }
}

/**
 * Safe popular terms wrapper
 */
export async function safePopularTerms(limit: number = 10): Promise<{
  success: boolean;
  terms?: string[];
  error?: string;
}> {
  try {
    if (!isInitialized) {
      const initResult = await initializeSearchInfrastructure();
      if (!initResult.success) {
        return { success: false, error: initResult.message };
      }
    }

    const { searchService } = await import('@/lib/search');
    const terms = await searchService.getPopularTerms(limit);
    
    return { success: true, terms };
  } catch (error) {
    console.error('Popular terms failed:', error);
    return { success: false, error: `Popular terms failed: ${error}` };
  }
}