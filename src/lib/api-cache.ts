import { NextRequest, NextResponse } from 'next/server';
import { cache, cacheTTL } from './cache';

export interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: NextRequest) => string;
  skipCache?: (req: NextRequest) => boolean;
  vary?: string[];
}

// Default cache key generator
function defaultKeyGenerator(req: NextRequest): string {
  const url = new URL(req.url);
  return `api:${url.pathname}:${url.search}`;
}

// API route cache wrapper
export function withApiCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CacheOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const {
      ttl = cacheTTL.medium,
      keyGenerator = defaultKeyGenerator,
      skipCache = () => false,
      vary = [],
    } = options;

    // Skip cache for non-GET requests or when skipCache returns true
    if (req.method !== 'GET' || skipCache(req)) {
      return handler(req);
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get cached response
      const cached = await cache.get<{
        status: number;
        headers: Record<string, string>;
        body: any;
      }>(cacheKey);

      if (cached) {
        const response = NextResponse.json(cached.body, {
          status: cached.status,
          headers: {
            ...cached.headers,
            'X-Cache': 'HIT',
            'Cache-Control': `public, max-age=${ttl}`,
          },
        });

        // Add Vary headers
        if (vary.length > 0) {
          response.headers.set('Vary', vary.join(', '));
        }

        return response;
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
    }

    // Execute handler
    const response = await handler(req);

    // Cache successful responses
    if (response.status >= 200 && response.status < 300) {
      try {
        const body = await response.clone().json();
        const headers: Record<string, string> = {};
        
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });

        await cache.set(
          cacheKey,
          {
            status: response.status,
            headers,
            body,
          },
          ttl
        );
      } catch (error) {
        console.error('Cache storage error:', error);
      }
    }

    // Add cache headers
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', `public, max-age=${ttl}`);

    if (vary.length > 0) {
      response.headers.set('Vary', vary.join(', '));
    }

    return response;
  };
}

// Specific cache configurations for different API routes
export const apiCacheConfigs = {
  articles: {
    ttl: cacheTTL.long,
    vary: ['Accept-Language'],
  },
  authors: {
    ttl: cacheTTL.day,
  },
  divisions: {
    ttl: cacheTTL.day,
  },
  search: {
    ttl: cacheTTL.medium,
    keyGenerator: (req: NextRequest) => {
      const url = new URL(req.url);
      const query = url.searchParams.get('q') || '';
      const filters = url.searchParams.get('filters') || '';
      return `search:${query}:${filters}`;
    },
  },
  sitemap: {
    ttl: cacheTTL.day,
  },
} as const;

// Cache invalidation utilities
export const cacheInvalidation = {
  async invalidateArticles() {
    // Invalidate all article-related cache keys
    const patterns = ['articles:', 'article:', 'search:', 'sitemap:'];
    // Note: In production with Redis, you'd use SCAN to find matching keys
    // For now, we'll clear the entire cache when articles change
    await cache.clear();
  },

  async invalidateAuthors() {
    await cache.del('authors:all');
    // Invalidate individual author caches would require tracking
  },

  async invalidateDivisions() {
    await cache.del('divisions:all');
  },

  async invalidateSearch() {
    // In production, you'd want to selectively invalidate search results
    // For now, we'll rely on TTL expiration
  },
};