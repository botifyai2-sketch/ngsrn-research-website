/**
 * Google Gemini API Integration
 * Provides AI-powered content summarization and analysis for search results
 */

import { ArticleWithRelations } from '@/types';

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || 'AIzaSyA2NDxmhhTy-rzS4g3A-KFFgPUHpdSzHPg';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

export interface SummaryOptions {
  maxLength?: number;
  focusAreas?: string[];
  includeKeyPoints?: boolean;
  includeRecommendations?: boolean;
}

export interface SearchSummaryResult {
  summary: string;
  keyPoints: string[];
  relevanceExplanation: string;
  confidence: number;
  cached: boolean;
}

class GeminiService {
  private cache = new Map<string, { result: SearchSummaryResult; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate AI summary for search results
   */
  async generateSearchSummary(
    query: string,
    articles: ArticleWithRelations[],
    options: SummaryOptions = {}
  ): Promise<SearchSummaryResult> {
    const cacheKey = this.getCacheKey(query, articles.map(a => a.id));
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      const prompt = this.buildSearchSummaryPrompt(query, articles, options);
      const response = await this.callGeminiAPI(prompt);
      
      const result = this.parseSearchSummaryResponse(response);
      
      // Cache the result
      this.setCache(cacheKey, result);
      
      return { ...result, cached: false };
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Return fallback summary
      return this.generateFallbackSummary(query, articles);
    }
  }

  /**
   * Generate AI summary for individual article
   */
  async generateArticleSummary(
    article: ArticleWithRelations,
    options: SummaryOptions = {}
  ): Promise<string> {
    const cacheKey = `article-${article.id}-${JSON.stringify(options)}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result.summary;
    }

    try {
      const prompt = this.buildArticleSummaryPrompt(article, options);
      const response = await this.callGeminiAPI(prompt);
      
      const summary = this.parseArticleSummaryResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        result: { summary, keyPoints: [], relevanceExplanation: '', confidence: 0.8, cached: false },
        timestamp: Date.now()
      });
      
      return summary;
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Return fallback summary
      return this.generateFallbackArticleSummary(article);
    }
  }

  /**
   * Explain search relevance using AI
   */
  async explainSearchRelevance(
    query: string,
    article: ArticleWithRelations,
    relevanceScore: number
  ): Promise<string> {
    try {
      const prompt = `
Explain why this research article is relevant to the search query "${query}".

Article Title: ${article.title}
Article Summary: ${article.summary}
Research Division: ${article.division.name}
Authors: ${article.authors.map(a => a.author.name).join(', ')}
Tags: ${JSON.parse(article.tags || '[]').join(', ')}
Relevance Score: ${(relevanceScore * 100).toFixed(0)}%

Provide a brief, clear explanation (2-3 sentences) of why this article matches the search query and what specific aspects make it relevant. Focus on the connection between the query and the article's content, methodology, or findings.
`;

      const response = await this.callGeminiAPI(prompt);
      return this.parseSimpleTextResponse(response);
    } catch (error) {
      console.error('Gemini API error:', error);
      return `This article is relevant to "${query}" based on content analysis and keyword matching.`;
    }
  }

  /**
   * Generate search suggestions using AI
   */
  async generateSearchSuggestions(
    partialQuery: string,
    availableContent: string[]
  ): Promise<string[]> {
    try {
      const prompt = `
Based on the partial search query "${partialQuery}" and the available research content topics below, suggest 5 relevant and specific search terms that would help users find relevant research articles.

Available content topics:
${availableContent.slice(0, 20).join('\n')}

Provide suggestions that are:
1. Specific and actionable
2. Related to sustainable development and African research
3. Likely to return relevant results
4. Progressively more specific than the original query

Return only the suggestions, one per line, without numbering or additional text.
`;

      const response = await this.callGeminiAPI(prompt);
      const suggestions = this.parseSimpleTextResponse(response)
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 5);
      
      return suggestions;
    } catch (error) {
      console.error('Gemini API error:', error);
      return [];
    }
  }

  /**
   * Build search summary prompt
   */
  private buildSearchSummaryPrompt(
    query: string,
    articles: ArticleWithRelations[],
    options: SummaryOptions
  ): string {
    const maxLength = options.maxLength || 200;
    const articlesText = articles.map(article => `
Title: ${article.title}
Division: ${article.division.name}
Authors: ${article.authors.map(a => a.author.name).join(', ')}
Summary: ${article.summary}
Tags: ${JSON.parse(article.tags || '[]').join(', ')}
---`).join('\n');

    return `
You are an AI research assistant specializing in African sustainable development research. Analyze the following search results for the query "${query}" and provide a comprehensive summary.

Search Results:
${articlesText}

Please provide:
1. A concise summary (max ${maxLength} words) of the key themes and findings across these articles
2. 3-5 key points that emerge from this research
3. An explanation of how these results relate to the search query
4. A confidence score (0-1) for the relevance of these results

Format your response as JSON:
{
  "summary": "...",
  "keyPoints": ["...", "...", "..."],
  "relevanceExplanation": "...",
  "confidence": 0.85
}

Focus on sustainable development themes, policy implications, and African contexts where relevant.
`;
  }

  /**
   * Build article summary prompt
   */
  private buildArticleSummaryPrompt(
    article: ArticleWithRelations,
    options: SummaryOptions
  ): string {
    const maxLength = options.maxLength || 150;
    
    return `
Summarize this research article in ${maxLength} words or less, focusing on the key findings, methodology, and policy implications:

Title: ${article.title}
Research Division: ${article.division.name}
Authors: ${article.authors.map(a => a.author.name).join(', ')}
Content: ${article.content.substring(0, 2000)}...
Tags: ${JSON.parse(article.tags || '[]').join(', ')}

Provide a clear, accessible summary that highlights:
1. The main research question or problem addressed
2. Key findings or conclusions
3. Policy or practical implications
4. Relevance to sustainable development in Africa

Keep the language professional but accessible to a general academic audience.
`;
  }

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<GeminiResponse> {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Parse search summary response
   */
  private parseSearchSummaryResponse(response: GeminiResponse): SearchSummaryResult {
    try {
      const text = response.candidates[0]?.content?.parts[0]?.text || '';
      
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(text);
        return {
          summary: parsed.summary || '',
          keyPoints: parsed.keyPoints || [],
          relevanceExplanation: parsed.relevanceExplanation || '',
          confidence: parsed.confidence || 0.7,
          cached: false
        };
      } catch {
        // If JSON parsing fails, extract information from text
        return {
          summary: text.substring(0, 200),
          keyPoints: [],
          relevanceExplanation: 'AI analysis of search results',
          confidence: 0.6,
          cached: false
        };
      }
    } catch (error) {
      throw new Error('Failed to parse Gemini response');
    }
  }

  /**
   * Parse article summary response
   */
  private parseArticleSummaryResponse(response: GeminiResponse): string {
    try {
      const text = response.candidates[0]?.content?.parts[0]?.text || '';
      return text.trim();
    } catch (error) {
      throw new Error('Failed to parse Gemini response');
    }
  }

  /**
   * Parse simple text response
   */
  private parseSimpleTextResponse(response: GeminiResponse): string {
    try {
      return response.candidates[0]?.content?.parts[0]?.text || '';
    } catch (error) {
      throw new Error('Failed to parse Gemini response');
    }
  }

  /**
   * Generate fallback summary when AI is unavailable
   */
  private generateFallbackSummary(
    query: string,
    articles: ArticleWithRelations[]
  ): SearchSummaryResult {
    const divisions = [...new Set(articles.map(a => a.division.name))];
    const authors = [...new Set(articles.flatMap(a => a.authors.map(au => au.author.name)))];
    
    return {
      summary: `Found ${articles.length} research articles related to "${query}" across ${divisions.length} research divisions, authored by ${authors.length} researchers. The results cover various aspects of sustainable development and policy research in African contexts.`,
      keyPoints: [
        `${articles.length} relevant articles found`,
        `Research spans ${divisions.join(', ')} divisions`,
        `Authored by leading researchers in the field`
      ],
      relevanceExplanation: `These articles were selected based on keyword matching and content relevance to "${query}".`,
      confidence: 0.6,
      cached: false
    };
  }

  /**
   * Generate fallback article summary
   */
  private generateFallbackArticleSummary(article: ArticleWithRelations): string {
    return article.summary || `Research article on ${article.title} by ${article.authors.map(a => a.author.name).join(', ')} from the ${article.division.name} division.`;
  }

  /**
   * Cache management
   */
  private getCacheKey(query: string, articleIds: string[]): string {
    return `search-${query}-${articleIds.sort().join(',')}`;
  }

  private getFromCache(key: string): SearchSummaryResult | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }
    return null;
  }

  private setCache(key: string, result: SearchSummaryResult): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.85 // Placeholder - would need to track actual hits/misses
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();

// Utility functions
export async function generateAISummaryForSearch(
  query: string,
  articles: ArticleWithRelations[],
  options?: SummaryOptions
): Promise<SearchSummaryResult> {
  return geminiService.generateSearchSummary(query, articles, options);
}

export async function generateAISummaryForArticle(
  article: ArticleWithRelations,
  options?: SummaryOptions
): Promise<string> {
  return geminiService.generateArticleSummary(article, options);
}

export async function explainRelevance(
  query: string,
  article: ArticleWithRelations,
  relevanceScore: number
): Promise<string> {
  return geminiService.explainSearchRelevance(query, article, relevanceScore);
}

/**
 * Generate content using Gemini API for AI assistant
 */
export async function generateContent(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}