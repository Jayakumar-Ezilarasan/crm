import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// Cache configuration
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  maxKeys: 1000, // Maximum number of keys in cache
});

// Cache middleware
export const cacheMiddleware = (duration: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated requests with sensitive data
    if (req.headers.authorization) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store original send method
    const originalSend = res.json;

    // Override send method to cache response
    res.json = function (body: any) {
      // Cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, body, duration);
      }
      return originalSend.call(this, body);
    };

    next();
  };
};

// Cache invalidation middleware
export const invalidateCache = (pattern: string) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => cache.del(key));
    next();
  };
};

// Cache statistics
export const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    hitRate: cache.getStats().hits / (cache.getStats().hits + cache.getStats().misses),
  };
};

// Clear all cache
export const clearCache = () => {
  cache.flushAll();
};

export default cache;
