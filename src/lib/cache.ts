// In-memory cache implementation with Redis-ready interface
interface CacheItem<T> {
  value: T;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000),
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Redis client (when available)
let redisClient: any = null;

// Initialize Redis client if available
async function initRedis() {
  if (process.env.REDIS_URL && !redisClient) {
    try {
      const { createClient } = await import('redis');
      redisClient = createClient({
        url: process.env.REDIS_URL,
      });
      await redisClient.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.warn('Redis connection failed, falling back to memory cache:', error);
      redisClient = null;
    }
  }
}

// Initialize Redis on startup
if (typeof window === 'undefined') {
  initRedis();
}

// Fallback to memory cache
const memoryCache = new MemoryCache();

// Unified cache interface
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (redisClient) {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      }
      return await memoryCache.get<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    try {
      if (redisClient) {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      } else {
        await memoryCache.set(key, value, ttlSeconds);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (redisClient) {
        await redisClient.del(key);
      } else {
        await memoryCache.del(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      if (redisClient) {
        await redisClient.flushAll();
      } else {
        await memoryCache.clear();
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      if (redisClient) {
        return (await redisClient.exists(key)) === 1;
      }
      return await memoryCache.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },
};

// Cache key generators
export const cacheKeys = {
  article: (id: string) => `article:${id}`,
  articles: (page: number, limit: number) => `articles:${page}:${limit}`,
  author: (id: string) => `author:${id}`,
  authors: () => 'authors:all',
  division: (id: string) => `division:${id}`,
  divisions: () => 'divisions:all',
  search: (query: string, filters: string) => `search:${query}:${filters}`,
  aiSummary: (articleId: string) => `ai:summary:${articleId}`,
  sitemap: () => 'sitemap:xml',
  seoMetadata: (path: string) => `seo:${path}`,
};

// Cache TTL constants (in seconds)
export const cacheTTL = {
  short: 300,      // 5 minutes
  medium: 1800,    // 30 minutes
  long: 3600,      // 1 hour
  day: 86400,      // 24 hours
  week: 604800,    // 7 days
} as const;

// Cached function wrapper
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl = cacheTTL.medium
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Try to get from cache first
    const cached = await cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    await cache.set(key, result, ttl);
    
    return result;
  }) as T;
}