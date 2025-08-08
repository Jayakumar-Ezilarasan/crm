import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

// Cache for API responses
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Optimized query hook with caching
export const useOptimizedQuery = <T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
  } = {}
) => {
  const { ttl = CACHE_TTL, enabled = true, refetchOnWindowFocus = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      
      // Cache the result
      queryCache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [key, queryFn, ttl]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      const cached = queryCache.get(key);
      if (cached && Date.now() - cached.timestamp > cached.ttl) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, fetchData, refetchOnWindowFocus]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  const refetch = useCallback(() => {
    queryCache.delete(key);
    fetchData();
  }, [key, fetchData]);

  return { data, loading, error, refetch };
};

// Optimized customers hook
export const useCustomersOptimized = (page: number = 1, search?: string) => {
  const { user } = useAuth();
  
  const queryFn = useCallback(async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
    });
    
    if (search) {
      params.append('search', search);
    }
    
    if (user?.role === 'user') {
      params.append('owner_id', user.id.toString());
    }
    
    const response = await api.get(`/api/customers?${params}`);
    return response.data.data;
  }, [page, search, user]);

  return useOptimizedQuery(
    `customers:${page}:${search}:${user?.id}`,
    queryFn,
    { ttl: 2 * 60 * 1000 } // 2 minutes for customers
  );
};

// Optimized tasks hook
export const useTasksOptimized = (page: number = 1, completed?: boolean) => {
  const { user } = useAuth();
  
  const queryFn = useCallback(async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
    });
    
    if (completed !== undefined) {
      params.append('completed', completed.toString());
    }
    
    if (user?.role === 'user') {
      params.append('user_id', user.id.toString());
    }
    
    const response = await api.get(`/api/tasks?${params}`);
    return response.data.data;
  }, [page, completed, user]);

  return useOptimizedQuery(
    `tasks:${page}:${completed}:${user?.id}`,
    queryFn,
    { ttl: 1 * 60 * 1000 } // 1 minute for tasks
  );
};

// Optimized dashboard stats hook
export const useDashboardStatsOptimized = () => {
  const { user } = useAuth();
  
  const queryFn = useCallback(async () => {
    const response = await api.get('/api/dashboard/stats');
    return response.data.data;
  }, []);

  return useOptimizedQuery(
    `dashboard:stats:${user?.id}`,
    queryFn,
    { ttl: 5 * 60 * 1000 } // 5 minutes for dashboard stats
  );
};

// Optimized search hook
export const useSearchOptimized = (query: string) => {
  const { user } = useAuth();
  
  const queryFn = useCallback(async () => {
    if (!query.trim()) return { customers: [], tasks: [], leads: [] };
    
    const response = await api.get(`/api/search?q=${encodeURIComponent(query)}`);
    return response.data.data;
  }, [query]);

  return useOptimizedQuery(
    `search:${query}:${user?.id}`,
    queryFn,
    { ttl: 10 * 60 * 1000, refetchOnWindowFocus: false } // 10 minutes for search results
  );
};

// Cache management utilities
export const clearQueryCache = () => {
  queryCache.clear();
};

export const invalidateCache = (pattern: string) => {
  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  }
};

// Memory leak prevention
export const useCleanupOnUnmount = (cleanupFn: () => void) => {
  useEffect(() => {
    return cleanupFn;
  }, [cleanupFn]);
};

// Debounced search hook
export const useDebouncedSearch = (delay: number = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return { searchTerm, setSearchTerm, debouncedTerm };
};

// Optimized pagination hook
export const usePagination = (initialPage: number = 1, initialLimit: number = 20) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const resetPagination = useCallback(() => {
    setPage(1);
  }, []);

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  return {
    page,
    limit,
    setPage,
    setLimit,
    resetPagination,
    nextPage,
    prevPage,
    goToPage,
  };
};
