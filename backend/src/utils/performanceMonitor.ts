import { Request, Response, NextFunction } from 'express';

// Performance metrics storage
interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: number;
  userAgent?: string;
  ip?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second
  private maxMetrics = 1000; // Keep last 1000 metrics

  // Middleware to monitor request performance
  monitorRequest = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;

    // Override send method to capture response time
    res.send = function (body: any) {
      const responseTime = Date.now() - startTime;
      
      this.recordMetric({
        endpoint: req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        timestamp: new Date(),
        userId: (req as any).user?.id,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });

      return originalSend.call(this, body);
    };

    next();
  };

  // Record performance metric
  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (metric.responseTime > this.slowQueryThreshold) {
      console.warn(`SLOW REQUEST: ${metric.method} ${metric.endpoint} took ${metric.responseTime}ms`);
    }
  }

  // Get performance statistics
  getStats() {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        topEndpoints: [],
      };
    }

    const totalRequests = this.metrics.length;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const slowRequests = this.metrics.filter(m => m.responseTime > this.slowQueryThreshold).length;
    const errorRequests = this.metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorRequests / totalRequests) * 100;

    // Top endpoints by average response time
    const endpointStats = this.metrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = { count: 0, totalTime: 0 };
      }
      acc[key].count++;
      acc[key].totalTime += metric.responseTime;
      return acc;
    }, {} as Record<string, { count: number; totalTime: number }>);

    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.totalTime / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      slowRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      topEndpoints,
    };
  }

  // Get recent metrics
  getRecentMetrics(limit: number = 50) {
    return this.metrics.slice(-limit);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }

  // Set slow query threshold
  setSlowQueryThreshold(threshold: number) {
    this.slowQueryThreshold = threshold;
  }
}

// Database performance monitoring
class DatabasePerformanceMonitor {
  private queryMetrics: Array<{
    query: string;
    duration: number;
    timestamp: Date;
    table?: string;
  }> = [];
  private slowQueryThreshold = 500; // 500ms

  // Monitor database query performance
  monitorQuery = (query: string, duration: number, table?: string) => {
    this.queryMetrics.push({
      query,
      duration,
      timestamp: new Date(),
      table,
    });

    // Keep only last 1000 queries
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`SLOW QUERY: ${query} took ${duration}ms`);
    }
  };

  // Get database performance statistics
  getDatabaseStats() {
    if (this.queryMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        topTables: [],
      };
    }

    const totalQueries = this.queryMetrics.length;
    const averageQueryTime = this.queryMetrics.reduce((sum, q) => sum + q.duration, 0) / totalQueries;
    const slowQueries = this.queryMetrics.filter(q => q.duration > this.slowQueryThreshold).length;

    // Top tables by query count
    const tableStats = this.queryMetrics.reduce((acc, query) => {
      if (query.table) {
        acc[query.table] = (acc[query.table] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topTables = Object.entries(tableStats)
      .map(([table, count]) => ({ table, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime),
      slowQueries,
      topTables,
    };
  }

  // Get slow queries
  getSlowQueries(limit: number = 20) {
    return this.queryMetrics
      .filter(q => q.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Clear query metrics
  clearQueryMetrics() {
    this.queryMetrics = [];
  }
}

// Memory usage monitoring
class MemoryMonitor {
  private memorySnapshots: Array<{
    timestamp: Date;
    heapUsed: number;
    heapTotal: number;
    external: number;
  }> = [];

  // Take memory snapshot
  takeSnapshot() {
    const memUsage = process.memoryUsage();
    this.memorySnapshots.push({
      timestamp: new Date(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
    });

    // Keep only last 100 snapshots
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots = this.memorySnapshots.slice(-100);
    }

    // Log high memory usage
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (heapUsagePercent > 80) {
      console.warn(`HIGH MEMORY USAGE: ${Math.round(heapUsagePercent)}%`);
    }
  }

  // Get memory statistics
  getMemoryStats() {
    if (this.memorySnapshots.length === 0) {
      return {
        currentHeapUsed: 0,
        currentHeapTotal: 0,
        averageHeapUsage: 0,
        peakHeapUsage: 0,
      };
    }

    const current = this.memorySnapshots[this.memorySnapshots.length - 1];
    const averageHeapUsage = this.memorySnapshots.reduce((sum, snap) => 
      sum + (snap.heapUsed / snap.heapTotal), 0) / this.memorySnapshots.length;
    const peakHeapUsage = Math.max(...this.memorySnapshots.map(snap => snap.heapUsed / snap.heapTotal));

    return {
      currentHeapUsed: Math.round(current.heapUsed / 1024 / 1024), // MB
      currentHeapTotal: Math.round(current.heapTotal / 1024 / 1024), // MB
      averageHeapUsage: Math.round(averageHeapUsage * 100),
      peakHeapUsage: Math.round(peakHeapUsage * 100),
    };
  }

  // Start periodic memory monitoring
  startMonitoring(intervalMs: number = 60000) { // Every minute
    setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);
  }
}

// Create instances
export const performanceMonitor = new PerformanceMonitor();
export const databaseMonitor = new DatabasePerformanceMonitor();
export const memoryMonitor = new MemoryMonitor();

// Start memory monitoring
memoryMonitor.startMonitoring();

// Export monitoring middleware
export const performanceMiddleware = performanceMonitor.monitorRequest;

// Export database monitoring function
export const monitorDatabaseQuery = (query: string, duration: number, table?: string) => {
  databaseMonitor.monitorQuery(query, duration, table);
};

// Performance monitoring endpoint
export const getPerformanceStats = () => {
  return {
    api: performanceMonitor.getStats(),
    database: databaseMonitor.getDatabaseStats(),
    memory: memoryMonitor.getMemoryStats(),
  };
};
