// Performance optimization utilities
import { cache, CacheManager } from './cache';
import { Logger } from './error-handler';

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<
    string,
    {
      count: number;
      totalTime: number;
      minTime: number;
      maxTime: number;
      avgTime: number;
    }
  >();

  // Start performance timer
  static startTimer(operation: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);

      // Log slow operations
      if (duration > 1000) {
        // 1 second
        Logger.withContext().warn(`Slow operation: ${operation}`, { duration });
      }
    };
  }

  // Record performance metric
  private static recordMetric(operation: string, duration: number): void {
    const existing = this.metrics.get(operation);

    if (!existing) {
      this.metrics.set(operation, {
        count: 1,
        totalTime: duration,
        minTime: duration,
        maxTime: duration,
        avgTime: duration,
      });
    } else {
      existing.count++;
      existing.totalTime += duration;
      existing.minTime = Math.min(existing.minTime, duration);
      existing.maxTime = Math.max(existing.maxTime, duration);
      existing.avgTime = existing.totalTime / existing.count;
    }
  }

  // Get performance statistics
  static getStats(operation?: string) {
    if (operation) {
      return this.metrics.get(operation);
    }

    const stats: Record<string, any> = {};
    for (const [op, metric] of Array.from(this.metrics.entries())) {
      stats[op] = { ...metric };
    }
    return stats;
  }

  // Clear metrics
  static clearStats(): void {
    this.metrics.clear();
  }
}

// Database query optimization
export class QueryOptimizer {
  // Batch database operations
  static async batchOperations<T>(
    operations: Array<() => Promise<T>>
  ): Promise<T[]> {
    const endTimer = PerformanceMonitor.startTimer('batch_operations');

    try {
      // Execute operations in parallel with concurrency limit
      const results = await Promise.all(operations.map((op) => op()));
      return results;
    } finally {
      endTimer();
    }
  }

  // Optimize pagination queries
  static optimizePagination(
    limit: number,
    offset: number
  ): { limit: number; offset: number; usesCursor: boolean } {
    // Use cursor-based pagination for large offsets
    const usesCursor = offset > 1000;

    // Limit maximum page size
    const optimizedLimit = Math.min(limit, 100);

    return {
      limit: optimizedLimit,
      offset: usesCursor ? 0 : offset,
      usesCursor,
    };
  }

  // Generate optimized SELECT queries
  static optimizeSelect(
    fields: string[],
    tableName: string
  ): { select: string; shouldCache: boolean } {
    // Only select necessary fields
    const optimizedFields = fields.length > 0 ? fields : ['*'];

    // Determine if result should be cached
    const shouldCache =
      optimizedFields.length <= 10 && !optimizedFields.includes('*');

    return {
      select: optimizedFields.join(', '),
      shouldCache,
    };
  }
}

// Memory optimization
export class MemoryOptimizer {
  private static memoryUsage = new Map<string, number>();

  // Monitor memory usage
  static trackMemoryUsage(operation: string): () => void {
    const initialMemory = this.getCurrentMemoryUsage();

    return () => {
      const finalMemory = this.getCurrentMemoryUsage();
      const memoryDelta = finalMemory - initialMemory;

      this.memoryUsage.set(operation, memoryDelta);

      // Log high memory usage
      if (memoryDelta > 50 * 1024 * 1024) {
        // 50MB
        Logger.withContext().warn(`High memory usage: ${operation}`, {
          memoryDelta: `${Math.round(memoryDelta / 1024 / 1024)}MB`,
        });
      }
    };
  }

  // Get current memory usage
  private static getCurrentMemoryUsage(): number {
    // Skip memory usage in Edge Runtime or browser environment
    if (
      typeof window !== 'undefined' ||
      (globalThis as any).EdgeRuntime !== undefined
    ) {
      return 0;
    }

    if (typeof process !== 'undefined' && process.memoryUsage) {
      try {
        return process.memoryUsage().heapUsed;
      } catch (error) {
        return 0;
      }
    }
    return 0;
  }

  // Get memory statistics
  static getMemoryStats() {
    return Object.fromEntries(this.memoryUsage.entries());
  }

  // Clear memory tracking
  static clearMemoryStats(): void {
    this.memoryUsage.clear();
  }

  // Optimize large arrays
  static optimizeArray<T>(array: T[], chunkSize: number = 1000): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    return chunks;
  }
}

// Image optimization
export class ImageOptimizer {
  // Optimize image loading
  static optimizeImageUrl(
    url: string,
    width?: number,
    height?: number,
    quality: number = 80
  ): string {
    if (!url) return url;

    // Add optimization parameters
    const params = new URLSearchParams();

    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    params.set('f', 'webp'); // Use WebP format

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  // Generate responsive image sizes
  static generateResponsiveSizes(baseWidth: number): number[] {
    const sizes = [baseWidth];

    // Generate smaller sizes
    let currentWidth = baseWidth;
    while (currentWidth > 320) {
      currentWidth = Math.floor(currentWidth * 0.75);
      sizes.unshift(currentWidth);
    }

    // Generate larger sizes
    currentWidth = baseWidth;
    while (currentWidth < 2048) {
      currentWidth = Math.floor(currentWidth * 1.5);
      sizes.push(currentWidth);
    }

    return sizes.sort((a, b) => a - b);
  }
}

// Bundle optimization
export class BundleOptimizer {
  // Lazy load components
  static createLazyComponent<T>(
    importFn: () => Promise<{ default: T }>
  ): () => Promise<T> {
    let componentPromise: Promise<T> | null = null;

    return () => {
      if (!componentPromise) {
        componentPromise = importFn().then((module) => module.default);
      }
      return componentPromise;
    };
  }

  // Preload critical resources
  static preloadResource(
    url: string,
    type: 'script' | 'style' | 'image'
  ): void {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;

    switch (type) {
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
      case 'image':
        link.as = 'image';
        break;
    }

    document.head.appendChild(link);
  }

  // Critical CSS inlining
  static inlineCriticalCSS(css: string): void {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}

// Network optimization
export class NetworkOptimizer {
  private static requestCache = new Map<string, Promise<any>>();

  // Deduplicate identical requests
  static async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.requestCache.has(key)) {
      return this.requestCache.get(key)!;
    }

    const promise = requestFn().finally(() => {
      // Remove from cache after completion
      this.requestCache.delete(key);
    });

    this.requestCache.set(key, promise);
    return promise;
  }

  // Implement request retry with exponential backoff
  static async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  // Batch API requests
  static createRequestBatcher<T, R>(
    batchFn: (items: T[]) => Promise<R[]>,
    maxBatchSize: number = 10,
    batchDelay: number = 100
  ) {
    let batch: Array<{
      item: T;
      resolve: (result: R) => void;
      reject: (error: Error) => void;
    }> = [];

    let batchTimeout: NodeJS.Timeout | null = null;

    const processBatch = async () => {
      if (batch.length === 0) return;

      const currentBatch = batch.splice(0, maxBatchSize);
      const items = currentBatch.map((b) => b.item);

      try {
        const results = await batchFn(items);

        currentBatch.forEach((batchItem, index) => {
          batchItem.resolve(results[index]);
        });
      } catch (error) {
        currentBatch.forEach((batchItem) => {
          batchItem.reject(error as Error);
        });
      }

      // Process remaining items
      if (batch.length > 0) {
        batchTimeout = setTimeout(processBatch, batchDelay);
      }
    };

    return (item: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        batch.push({ item, resolve, reject });

        if (batch.length >= maxBatchSize) {
          // Process immediately if batch is full
          if (batchTimeout) {
            clearTimeout(batchTimeout);
            batchTimeout = null;
          }
          processBatch();
        } else if (!batchTimeout) {
          // Schedule batch processing
          batchTimeout = setTimeout(processBatch, batchDelay);
        }
      });
    };
  }
}

// Performance wrapper for functions
export function withPerformanceMonitoring<T extends any[], R>(
  name: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const endTimer = PerformanceMonitor.startTimer(name);
    const endMemoryTracking = MemoryOptimizer.trackMemoryUsage(name);

    try {
      return await fn(...args);
    } finally {
      endTimer();
      endMemoryTracking();
    }
  };
}

// Cache wrapper for expensive operations
export function withCaching<T extends any[], R>(
  keyGenerator: (...args: T) => string,
  ttlSeconds: number = 300
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = keyGenerator(...args);

      // Try to get from cache
      const cached = cache.get<R>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      cache.set(cacheKey, result, ttlSeconds);

      return result;
    };

    return descriptor;
  };
}
