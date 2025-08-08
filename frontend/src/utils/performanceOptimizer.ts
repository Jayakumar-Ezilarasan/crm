// Frontend Performance Optimization Utilities

// Bundle size analyzer
export const analyzeBundleSize = () => {
  const bundleInfo = {
    totalSize: 0,
    chunks: [] as Array<{ name: string; size: number }>,
    largestChunks: [] as Array<{ name: string; size: number }>,
  };

  // Analyze webpack bundle stats if available
  if (typeof window !== 'undefined' && (window as any).__webpack_require__) {
    const webpackStats = (window as any).__webpack_require__.c;
    if (webpackStats) {
      Object.keys(webpackStats).forEach(chunkId => {
        const chunk = webpackStats[chunkId];
        if (chunk && chunk.length) {
          bundleInfo.chunks.push({
            name: chunkId,
            size: chunk.length,
          });
          bundleInfo.totalSize += chunk.length;
        }
      });

      // Sort by size to find largest chunks
      bundleInfo.largestChunks = bundleInfo.chunks
        .sort((a, b) => b.size - a.size)
        .slice(0, 5);
    }
  }

  return bundleInfo;
};

// Memory usage monitoring
export class MemoryMonitor {
  private snapshots: Array<{
    timestamp: Date;
    heapUsed: number;
    heapTotal: number;
    external: number;
  }> = [];

  takeSnapshot() {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memInfo = (performance as any).memory;
      this.snapshots.push({
        timestamp: new Date(),
        heapUsed: memInfo.usedJSHeapSize,
        heapTotal: memInfo.totalJSHeapSize,
        external: memInfo.jsHeapSizeLimit,
      });

      // Keep only last 50 snapshots
      if (this.snapshots.length > 50) {
        this.snapshots = this.snapshots.slice(-50);
      }

      // Log high memory usage
      const usagePercent = (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100;
      if (usagePercent > 80) {
        console.warn(`High memory usage: ${Math.round(usagePercent)}%`);
      }
    }
  }

  getMemoryStats() {
    if (this.snapshots.length === 0) {
      return {
        currentHeapUsed: 0,
        currentHeapTotal: 0,
        averageHeapUsage: 0,
        peakHeapUsage: 0,
      };
    }

    const current = this.snapshots[this.snapshots.length - 1];
    const averageUsage = this.snapshots.reduce((sum, snap) => 
      sum + (snap.heapUsed / snap.heapTotal), 0) / this.snapshots.length;
    const peakUsage = Math.max(...this.snapshots.map(snap => snap.heapUsed / snap.heapTotal));

    return {
      currentHeapUsed: Math.round(current.heapUsed / 1024 / 1024), // MB
      currentHeapTotal: Math.round(current.heapTotal / 1024 / 1024), // MB
      averageHeapUsage: Math.round(averageUsage * 100),
      peakHeapUsage: Math.round(peakUsage * 100),
    };
  }

  startMonitoring(intervalMs: number = 30000) { // Every 30 seconds
    setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);
  }
}

// Component render performance monitoring
export class RenderPerformanceMonitor {
  private renderTimes: Map<string, number[]> = new Map();

  measureRender(componentName: string, renderFn: () => void) {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (!this.renderTimes.has(componentName)) {
      this.renderTimes.set(componentName, []);
    }

    this.renderTimes.get(componentName)!.push(renderTime);

    // Keep only last 100 measurements per component
    const times = this.renderTimes.get(componentName)!;
    if (times.length > 100) {
      times.splice(0, times.length - 100);
    }

    // Log slow renders
    if (renderTime > 16) { // 60fps = 16ms per frame
      console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    return renderTime;
  }

  getComponentStats(componentName: string) {
    const times = this.renderTimes.get(componentName);
    if (!times || times.length === 0) {
      return null;
    }

    const sortedTimes = [...times].sort((a, b) => a - b);
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;

    return {
      componentName,
      averageRenderTime: Math.round(average * 100) / 100,
      minRenderTime: Math.min(...times),
      maxRenderTime: Math.max(...times),
      p95RenderTime: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
      renderCount: times.length,
    };
  }

  getAllStats() {
    const stats = [];
    for (const componentName of this.renderTimes.keys()) {
      const stat = this.getComponentStats(componentName);
      if (stat) {
        stats.push(stat);
      }
    }
    return stats.sort((a, b) => b.averageRenderTime - a.averageRenderTime);
  }
}

// Image optimization utilities
export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private imageCache = new Map<string, HTMLImageElement>();

  static getInstance() {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  // Lazy load image
  lazyLoadImage(src: string, placeholder?: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      // Check cache first
      if (this.imageCache.has(src)) {
        resolve(this.imageCache.get(src)!);
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };

      // Set placeholder if provided
      if (placeholder) {
        img.src = placeholder;
      }

      // Load actual image
      img.src = src;
    });
  }

  // Preload critical images
  preloadImages(urls: string[]) {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Optimize image dimensions
  getOptimizedImageUrl(url: string, width: number, height: number, quality: number = 80) {
    // This would integrate with an image optimization service
    // For now, return the original URL
    return url;
  }

  // Clear image cache
  clearCache() {
    this.imageCache.clear();
  }
}

// Code splitting utilities
export class CodeSplitter {
  private loadedChunks = new Set<string>();

  // Dynamic import with caching
  async loadChunk(chunkName: string, importFn: () => Promise<any>) {
    if (this.loadedChunks.has(chunkName)) {
      return;
    }

    try {
      await importFn();
      this.loadedChunks.add(chunkName);
    } catch (error) {
      console.error(`Failed to load chunk: ${chunkName}`, error);
      throw error;
    }
  }

  // Preload chunk
  preloadChunk(chunkName: string, importFn: () => Promise<any>) {
    if (!this.loadedChunks.has(chunkName)) {
      // Preload in background
      this.loadChunk(chunkName, importFn).catch(() => {
        // Ignore preload errors
      });
    }
  }

  // Get loaded chunks
  getLoadedChunks() {
    return Array.from(this.loadedChunks);
  }
}

// Network performance monitoring
export class NetworkMonitor {
  private requests: Array<{
    url: string;
    method: string;
    startTime: number;
    endTime: number;
    duration: number;
    status: number;
  }> = [];

  monitorRequest(url: string, method: string, startTime: number) {
    return (endTime: number, status: number) => {
      const duration = endTime - startTime;
      this.requests.push({
        url,
        method,
        startTime,
        endTime,
        duration,
        status,
      });

      // Keep only last 100 requests
      if (this.requests.length > 100) {
        this.requests = this.requests.slice(-100);
      }

      // Log slow requests
      if (duration > 1000) {
        console.warn(`Slow network request: ${method} ${url} took ${duration}ms`);
      }
    };
  }

  getNetworkStats() {
    if (this.requests.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
      };
    }

    const successful = this.requests.filter(r => r.status >= 200 && r.status < 400);
    const failed = this.requests.filter(r => r.status >= 400);
    const slowRequests = this.requests.filter(r => r.duration > 1000);

    return {
      totalRequests: this.requests.length,
      averageResponseTime: Math.round(
        this.requests.reduce((sum, r) => sum + r.duration, 0) / this.requests.length
      ),
      slowRequests: slowRequests.length,
      errorRate: (failed.length / this.requests.length) * 100,
    };
  }
}

// Performance optimization hooks
export const usePerformanceOptimization = () => {
  const memoryMonitor = new MemoryMonitor();
  const renderMonitor = new RenderPerformanceMonitor();
  const networkMonitor = new NetworkMonitor();
  const imageOptimizer = ImageOptimizer.getInstance();
  const codeSplitter = new CodeSplitter();

  return {
    memoryMonitor,
    renderMonitor,
    networkMonitor,
    imageOptimizer,
    codeSplitter,
    
    // Start monitoring
    startMonitoring: () => {
      memoryMonitor.startMonitoring();
    },

    // Get performance report
    getPerformanceReport: () => {
      return {
        memory: memoryMonitor.getMemoryStats(),
        renders: renderMonitor.getAllStats(),
        network: networkMonitor.getNetworkStats(),
        bundle: analyzeBundleSize(),
      };
    },
  };
};

// Debounce utility for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }

  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
};

// Performance budget checker
export class PerformanceBudget {
  private budgets = {
    bundleSize: 500 * 1024, // 500KB
    renderTime: 16, // 16ms for 60fps
    networkRequest: 1000, // 1 second
    memoryUsage: 50 * 1024 * 1024, // 50MB
  };

  checkBudget(metric: keyof typeof this.budgets, value: number): boolean {
    return value <= this.budgets[metric];
  }

  setBudget(metric: keyof typeof this.budgets, value: number) {
    this.budgets[metric] = value;
  }

  getBudgets() {
    return { ...this.budgets };
  }
}
