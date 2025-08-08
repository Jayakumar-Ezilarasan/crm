# Performance Optimization Guide

## 🚀 Overview

This document outlines the comprehensive performance optimization strategies implemented in the CRM application, covering both frontend and backend optimizations.

## 📊 Performance Metrics

### Target Performance Goals
- **Frontend Bundle Size**: < 500KB gzipped
- **API Response Time**: < 200ms for most endpoints
- **Database Query Time**: < 100ms for common queries
- **Time to Interactive**: < 3 seconds
- **Lighthouse Score**: > 90 for all categories

## 🔧 Backend Optimizations

### 1. Database Query Optimization

#### Connection Pooling
```typescript
// backend/src/config/database.ts
const prisma = new PrismaClient({
  __internal: {
    engine: {
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
      queryTimeout: 30000,
    },
  },
});
```

#### Optimized Query Patterns
- **Eager Loading**: Use `include` to fetch related data in single queries
- **Pagination**: Implement cursor-based pagination for large datasets
- **Selective Fields**: Only fetch required fields using `select`
- **Indexed Queries**: All common query patterns are indexed

#### Database Indexes
```sql
-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Task indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- Composite indexes for common patterns
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed);
```

### 2. API Response Caching

#### Cache Middleware
```typescript
// backend/src/middlewares/cache.ts
export const cacheMiddleware = (duration: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Cache GET requests for 5 minutes
    const key = `cache:${req.originalUrl}`;
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      return res.json(cachedResponse);
    }
    
    // Cache successful responses
    res.json = function (body: any) {
      if (res.statusCode === 200) {
        cache.set(key, body, duration);
      }
      return originalSend.call(this, body);
    };
  };
};
```

#### Cache Invalidation
```typescript
// Invalidate cache when data changes
export const invalidateCache = (pattern: string) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  matchingKeys.forEach(key => cache.del(key));
};
```

### 3. Performance Monitoring

#### Request Monitoring
```typescript
// backend/src/utils/performanceMonitor.ts
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.send = function (body: any) {
    const responseTime = Date.now() - startTime;
    
    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`SLOW REQUEST: ${req.method} ${req.path} took ${responseTime}ms`);
    }
    
    return originalSend.call(this, body);
  };
};
```

#### Database Query Monitoring
```typescript
export const monitorDatabaseQuery = (query: string, duration: number, table?: string) => {
  if (duration > 500) {
    console.warn(`SLOW QUERY: ${query} took ${duration}ms`);
  }
};
```

## 🎯 Frontend Optimizations

### 1. Bundle Size Optimization

#### Code Splitting
```typescript
// frontend/vite.config.ts
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom', 'react-router-dom'],
      ui: ['@headlessui/react', '@heroicons/react'],
      utils: ['axios', 'jwt-decode'],
    },
  },
},
```

#### Tree Shaking
- Use ES6 imports for better tree shaking
- Configure Vite to remove unused code
- Use dynamic imports for route-based code splitting

### 2. React Performance Optimization

#### React.memo Implementation
```typescript
// frontend/src/components/optimized/OptimizedDataTable.tsx
const OptimizedTableRow = React.memo<{
  row: any;
  columns: any[];
  onRowClick?: (row: any) => void;
  renderCell: (value: any, column: any) => React.ReactNode;
}>(({ row, columns, onRowClick, renderCell }) => {
  // Component implementation
});
```

#### useMemo and useCallback
```typescript
// frontend/src/hooks/useOptimizedQueries.ts
const sortedData = useMemo(() => {
  if (!sortKey) return data;
  
  return [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    return String(aVal).localeCompare(String(bVal));
  });
}, [data, sortKey, sortAsc]);

const handleSort = useCallback((key: keyof T) => {
  if (sortKey === key) {
    setSortAsc(!sortAsc);
  } else {
    setSortKey(key);
    setSortAsc(true);
  }
}, [sortKey, sortAsc]);
```

### 3. Data Fetching Optimization

#### Optimized Query Hooks
```typescript
// frontend/src/hooks/useOptimizedQueries.ts
export const useOptimizedQuery = <T>(
  key: string,
  queryFn: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refetchOnWindowFocus?: boolean;
  } = {}
) => {
  // Implementation with caching and error handling
};
```

#### Cache Management
```typescript
const queryCache = new Map<string, { 
  data: any; 
  timestamp: number; 
  ttl: number 
}>();

// Cache invalidation
export const invalidateCache = (pattern: string) => {
  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  }
};
```

### 4. Service Worker for Caching

#### Static Asset Caching
```javascript
// frontend/public/sw.js
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES);
    })
  );
});
```

#### API Response Caching
```javascript
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Network error', { status: 503 });
  }
}
```

## 🧪 Performance Testing

### 1. Backend Performance Tests

#### Load Testing Script
```javascript
// backend/scripts/performance-test.js
const testScenarios = [
  {
    name: 'Dashboard Stats',
    endpoint: '/api/dashboard/stats',
    method: 'GET',
    requiresAuth: true,
  },
  // More scenarios...
];

async function runLoadTest(scenario, authToken, metrics) {
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const result = await testRequest(scenario, authToken, metrics);
    // Collect metrics
  }
}
```

#### Running Performance Tests
```bash
# Run performance tests
npm run performance:test

# Run database performance tests
npm run performance:db

# Monitor performance in real-time
npm run performance:monitor
```

### 2. Frontend Performance Tests

#### Lighthouse Audits
```bash
# Run Lighthouse audit
npm run performance:audit

# Generate performance report
npm run performance:test
```

#### Bundle Analysis
```bash
# Analyze bundle size
npm run analyze

# Check bundle composition
npm run build -- --analyze
```

## 📈 Monitoring and Analytics

### 1. Performance Metrics Collection

#### Backend Metrics
- Request response times
- Database query performance
- Memory usage
- Error rates
- Cache hit rates

#### Frontend Metrics
- Bundle size
- Time to interactive
- First contentful paint
- Largest contentful paint
- Cumulative layout shift

### 2. Real-time Monitoring

#### Performance Dashboard
```typescript
// Get performance statistics
export const getPerformanceStats = () => {
  return {
    api: performanceMonitor.getStats(),
    database: databaseMonitor.getDatabaseStats(),
    memory: memoryMonitor.getMemoryStats(),
  };
};
```

#### Alerting
- Slow request alerts (> 1 second)
- High memory usage alerts (> 80%)
- Database query timeouts
- Cache miss rate increases

## 🔧 Optimization Tools

### 1. Database Optimization

#### Index Analysis
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT schemaname, tablename, indexname 
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;
```

#### Query Analysis
```sql
-- Enable query logging
SET log_statement = 'all';
SET log_min_duration_statement = 1000;

-- Analyze slow queries
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements 
ORDER BY mean_time DESC;
```

### 2. Frontend Optimization

#### Bundle Analysis
```bash
# Install bundle analyzer
npm install --save-dev vite-bundle-analyzer

# Analyze bundle
npm run analyze
```

#### Performance Profiling
```typescript
// Memory profiling
const memoryMonitor = new MemoryMonitor();
memoryMonitor.startMonitoring();

// Component render profiling
const renderMonitor = new RenderPerformanceMonitor();
renderMonitor.measureRender('ComponentName', () => {
  // Component render logic
});
```

## 🚀 Deployment Optimizations

### 1. Production Build Optimization

#### Backend
```bash
# Optimize TypeScript compilation
npm run build

# Enable compression
npm install compression

# Configure caching headers
app.use(compression());
app.use(express.static('public', {
  maxAge: '1y',
  etag: true,
}));
```

#### Frontend
```bash
# Optimize build
npm run build

# Enable gzip compression
# Configure CDN for static assets
# Enable HTTP/2 server push
```

### 2. CDN Configuration

#### Static Asset Optimization
- Configure CDN for static assets
- Enable HTTP/2 server push
- Set appropriate cache headers
- Use image optimization services

#### API Caching
- Configure CDN for API responses
- Set cache headers for GET requests
- Implement cache invalidation strategies

## 📋 Performance Checklist

### Backend Checklist
- [ ] Database indexes created and optimized
- [ ] Connection pooling configured
- [ ] API response caching implemented
- [ ] Performance monitoring enabled
- [ ] Rate limiting configured
- [ ] Compression enabled
- [ ] Error handling optimized

### Frontend Checklist
- [ ] Code splitting implemented
- [ ] Bundle size optimized
- [ ] React.memo used for expensive components
- [ ] useMemo and useCallback implemented
- [ ] Service worker configured
- [ ] Image optimization implemented
- [ ] Performance monitoring enabled

### Database Checklist
- [ ] Indexes created for common queries
- [ ] Query optimization implemented
- [ ] Connection pooling configured
- [ ] Performance monitoring enabled
- [ ] Regular maintenance scheduled

## 🔍 Troubleshooting

### Common Performance Issues

#### Slow API Responses
1. Check database query performance
2. Verify indexes are being used
3. Monitor connection pool usage
4. Check for N+1 query problems

#### Large Bundle Size
1. Analyze bundle composition
2. Remove unused dependencies
3. Implement code splitting
4. Optimize imports

#### Memory Leaks
1. Monitor memory usage
2. Check for event listener leaks
3. Verify cleanup in useEffect
4. Profile component renders

### Performance Debugging

#### Backend Debugging
```bash
# Monitor database queries
npm run db:studio

# Check performance metrics
curl http://localhost:4000/api/performance/stats

# Run load tests
npm run performance:test
```

#### Frontend Debugging
```bash
# Analyze bundle
npm run analyze

# Run Lighthouse audit
npm run performance:audit

# Check performance in dev tools
# - Network tab for request timing
# - Performance tab for render analysis
# - Memory tab for memory usage
```

## 📚 Additional Resources

### Performance Tools
- **Backend**: Clinic.js, Autocannon, Artillery
- **Frontend**: Lighthouse, WebPageTest, Bundle Analyzer
- **Database**: pg_stat_statements, pgBadger, pgAdmin

### Best Practices
- Regular performance audits
- Continuous monitoring
- Performance budgets
- A/B testing for optimizations
- User experience metrics

### Monitoring Tools
- Application Performance Monitoring (APM)
- Real User Monitoring (RUM)
- Synthetic monitoring
- Error tracking and alerting

This comprehensive performance optimization guide ensures the CRM application delivers optimal performance across all aspects of the system.
