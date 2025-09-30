import { SearchResult, ArticleWithRelations } from '@/types';

/**
 * Advanced search result processing and ranking algorithms
 */

export interface RankingFactors {
  titleMatch: number;
  contentRelevance: number;
  recency: number;
  authorityScore: number;
  tagRelevance: number;
  readabilityScore: number;
}

export interface RankingWeights {
  titleMatch: number;
  contentRelevance: number;
  recency: number;
  authorityScore: number;
  tagRelevance: number;
  readabilityScore: number;
}

// Default ranking weights
const DEFAULT_WEIGHTS: RankingWeights = {
  titleMatch: 0.3,
  contentRelevance: 0.25,
  recency: 0.15,
  authorityScore: 0.1,
  tagRelevance: 0.1,
  readabilityScore: 0.1,
};

/**
 * Calculate comprehensive ranking score for search results
 */
export function calculateAdvancedRanking(
  results: SearchResult[],
  query: string,
  weights: RankingWeights = DEFAULT_WEIGHTS
): SearchResult[] {
  return results
    .map(result => ({
      ...result,
      relevanceScore: calculateCompositeScore(result, query, weights),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Calculate composite relevance score based on multiple factors
 */
function calculateCompositeScore(
  result: SearchResult,
  query: string,
  weights: RankingWeights
): number {
  const factors = calculateRankingFactors(result.article, query);
  
  return (
    factors.titleMatch * weights.titleMatch +
    factors.contentRelevance * weights.contentRelevance +
    factors.recency * weights.recency +
    factors.authorityScore * weights.authorityScore +
    factors.tagRelevance * weights.tagRelevance +
    factors.readabilityScore * weights.readabilityScore
  );
}

/**
 * Calculate individual ranking factors
 */
function calculateRankingFactors(
  article: ArticleWithRelations,
  query: string
): RankingFactors {
  const queryTerms = normalizeQuery(query);
  
  return {
    titleMatch: calculateTitleMatch(article.title, queryTerms),
    contentRelevance: calculateContentRelevance(article, queryTerms),
    recency: calculateRecencyScore(article.publishedAt),
    authorityScore: calculateAuthorityScore(article),
    tagRelevance: calculateTagRelevance(article.tags, queryTerms),
    readabilityScore: calculateReadabilityScore(article),
  };
}

/**
 * Normalize query for consistent matching
 */
function normalizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2)
    .filter(term => !isStopWord(term));
}

/**
 * Calculate title match score (0-1)
 */
function calculateTitleMatch(title: string, queryTerms: string[]): number {
  const normalizedTitle = title.toLowerCase();
  let score = 0;
  
  queryTerms.forEach(term => {
    if (normalizedTitle.includes(term)) {
      // Exact word match gets higher score
      const wordBoundaryRegex = new RegExp(`\\b${term}\\b`);
      if (wordBoundaryRegex.test(normalizedTitle)) {
        score += 0.8;
      } else {
        score += 0.4;
      }
    }
  });
  
  // Normalize by number of query terms
  return Math.min(score / queryTerms.length, 1);
}

/**
 * Calculate content relevance score (0-1)
 */
function calculateContentRelevance(
  article: ArticleWithRelations,
  queryTerms: string[]
): number {
  const content = (article.content + ' ' + article.summary).toLowerCase();
  const contentWords = content.split(/\s+/);
  
  let matchCount = 0;
  let totalTermFrequency = 0;
  
  queryTerms.forEach(term => {
    const termFrequency = (content.match(new RegExp(term, 'g')) || []).length;
    if (termFrequency > 0) {
      matchCount++;
      totalTermFrequency += termFrequency;
    }
  });
  
  if (matchCount === 0) return 0;
  
  // TF-IDF inspired scoring
  const termCoverage = matchCount / queryTerms.length;
  const termDensity = Math.min(totalTermFrequency / contentWords.length * 100, 1);
  
  return (termCoverage * 0.7) + (termDensity * 0.3);
}

/**
 * Calculate recency score (0-1)
 */
function calculateRecencyScore(publishedAt: Date | null): number {
  if (!publishedAt) return 0;
  
  const now = new Date();
  const daysSincePublished = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Exponential decay over 2 years
  const maxDays = 730; // 2 years
  const decayRate = 0.005;
  
  if (daysSincePublished <= 0) return 1;
  if (daysSincePublished >= maxDays) return 0.1;
  
  return Math.max(0.1, Math.exp(-decayRate * daysSincePublished));
}

/**
 * Calculate authority score based on article and author metrics (0-1)
 */
function calculateAuthorityScore(article: ArticleWithRelations): number {
  let score = 0.5; // Base score
  
  // Leadership authors get higher authority
  const hasLeadershipAuthor = article.authors.some(a => a.author.isLeadership);
  if (hasLeadershipAuthor) {
    score += 0.3;
  }
  
  // Multiple authors can indicate collaborative/peer-reviewed work
  if (article.authors.length > 1) {
    score += 0.1;
  }
  
  // Articles with media/charts might be more comprehensive
  if (article.mediaFiles.length > 0) {
    score += 0.1;
  }
  
  return Math.min(score, 1);
}

/**
 * Calculate tag relevance score (0-1)
 */
function calculateTagRelevance(tags: string, queryTerms: string[]): number {
  const articleTags = JSON.parse(tags || '[]') as string[];
  if (articleTags.length === 0) return 0;
  
  let matchingTags = 0;
  
  queryTerms.forEach(term => {
    const hasMatchingTag = articleTags.some(tag => 
      tag.toLowerCase().includes(term)
    );
    if (hasMatchingTag) {
      matchingTags++;
    }
  });
  
  return matchingTags / queryTerms.length;
}

/**
 * Calculate readability score based on content characteristics (0-1)
 */
function calculateReadabilityScore(article: ArticleWithRelations): number {
  const content = article.content;
  const words = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).length;
  const paragraphs = content.split(/\n\s*\n/).length;
  
  // Optimal ranges for research articles
  const optimalWordCount = 2000; // Target word count
  const optimalSentenceLength = 20; // Words per sentence
  
  // Word count score (bell curve around optimal)
  const wordCountScore = Math.exp(-Math.pow((words - optimalWordCount) / optimalWordCount, 2));
  
  // Sentence length score
  const avgSentenceLength = words / sentences;
  const sentenceLengthScore = Math.exp(-Math.pow((avgSentenceLength - optimalSentenceLength) / optimalSentenceLength, 2));
  
  // Structure score (having good paragraph breaks)
  const structureScore = Math.min(paragraphs / (words / 200), 1); // Roughly 1 paragraph per 200 words
  
  return (wordCountScore * 0.4) + (sentenceLengthScore * 0.3) + (structureScore * 0.3);
}

/**
 * Simple stop word filter
 */
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
    'from', 'up', 'out', 'down', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
  ]);
  return stopWords.has(word.toLowerCase());
}

/**
 * Group search results by research division
 */
export function groupResultsByDivision(results: SearchResult[]): Map<string, SearchResult[]> {
  const grouped = new Map<string, SearchResult[]>();
  
  results.forEach(result => {
    const divisionName = result.article.division.name;
    if (!grouped.has(divisionName)) {
      grouped.set(divisionName, []);
    }
    grouped.get(divisionName)!.push(result);
  });
  
  return grouped;
}

/**
 * Extract key terms from search results for query expansion
 */
export function extractKeyTerms(results: SearchResult[], limit: number = 10): string[] {
  const termFrequency = new Map<string, number>();
  
  results.forEach(result => {
    const article = result.article;
    
    // Extract from tags
    const tags = JSON.parse(article.tags || '[]') as string[];
    tags.forEach(tag => {
      const normalizedTag = tag.toLowerCase();
      termFrequency.set(normalizedTag, (termFrequency.get(normalizedTag) || 0) + 2);
    });
    
    // Extract from title
    const titleWords = article.title.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !isStopWord(word));
    
    titleWords.forEach(word => {
      termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
    });
  });
  
  return Array.from(termFrequency.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([term]) => term);
}

/**
 * Calculate search result diversity to avoid too many similar results
 */
export function diversifyResults(results: SearchResult[], maxPerDivision: number = 3): SearchResult[] {
  const divisionCounts = new Map<string, number>();
  const diversifiedResults: SearchResult[] = [];
  
  for (const result of results) {
    const divisionName = result.article.division.name;
    const currentCount = divisionCounts.get(divisionName) || 0;
    
    if (currentCount < maxPerDivision) {
      diversifiedResults.push(result);
      divisionCounts.set(divisionName, currentCount + 1);
    }
  }
  
  // Add remaining results if we haven't filled the desired count
  const remainingResults = results.filter(r => !diversifiedResults.includes(r));
  diversifiedResults.push(...remainingResults);
  
  return diversifiedResults;
}