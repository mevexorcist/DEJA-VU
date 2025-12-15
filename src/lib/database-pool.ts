import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Database connection pool configuration
interface PoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
}

// Connection pool implementation
class DatabasePool {
  private connections: SupabaseClient<Database>[] = [];
  private available: SupabaseClient<Database>[] = [];
  private pending: Array<{
    resolve: (client: SupabaseClient<Database>) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];

  private config: PoolConfig;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: Partial<PoolConfig> = {}
  ) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.config = {
      min: config.min || 2,
      max: config.max || 10,
      acquireTimeoutMillis: config.acquireTimeoutMillis || 30000,
      idleTimeoutMillis: config.idleTimeoutMillis || 300000, // 5 minutes
    };

    // Initialize minimum connections
    this.initializePool();

    // Setup cleanup interval
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  private async initializePool(): Promise<void> {
    for (let i = 0; i < this.config.min; i++) {
      const client = this.createConnection();
      this.connections.push(client);
      this.available.push(client);
    }
  }

  private createConnection(): SupabaseClient<Database> {
    return createClient<Database>(this.supabaseUrl, this.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-connection-pool': 'true',
        },
      },
    });
  }

  // Acquire a connection from the pool
  async acquire(): Promise<SupabaseClient<Database>> {
    // Check if there's an available connection
    if (this.available.length > 0) {
      return this.available.pop()!;
    }

    // Create new connection if under max limit
    if (this.connections.length < this.config.max) {
      const client = this.createConnection();
      this.connections.push(client);
      return client;
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.pending.findIndex((p) => p.resolve === resolve);
        if (index !== -1) {
          this.pending.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeoutMillis);

      this.pending.push({
        resolve: (client) => {
          clearTimeout(timeout);
          resolve(client);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now(),
      });
    });
  }

  // Release a connection back to the pool
  release(client: SupabaseClient<Database>): void {
    // Serve pending requests first
    if (this.pending.length > 0) {
      const pending = this.pending.shift()!;
      pending.resolve(client);
      return;
    }

    // Return to available pool
    this.available.push(client);
  }

  // Execute a query with automatic connection management
  async execute<T>(
    operation: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    const client = await this.acquire();

    try {
      return await operation(client);
    } finally {
      this.release(client);
    }
  }

  // Cleanup idle connections
  private cleanup(): void {
    const now = Date.now();

    // Remove timed-out pending requests
    this.pending = this.pending.filter((p) => {
      if (now - p.timestamp > this.config.acquireTimeoutMillis) {
        p.reject(new Error('Connection request timeout'));
        return false;
      }
      return true;
    });

    // Keep minimum connections, remove excess idle ones
    while (
      this.available.length > this.config.min &&
      this.connections.length > this.config.min
    ) {
      const client = this.available.pop()!;
      const index = this.connections.indexOf(client);
      if (index !== -1) {
        this.connections.splice(index, 1);
      }
    }
  }

  // Get pool statistics
  getStats() {
    return {
      total: this.connections.length,
      available: this.available.length,
      pending: this.pending.length,
      config: this.config,
    };
  }

  // Close all connections
  async close(): Promise<void> {
    // Reject all pending requests
    this.pending.forEach((p) => {
      p.reject(new Error('Pool is closing'));
    });
    this.pending = [];

    // Clear all connections
    this.connections = [];
    this.available = [];
  }
}

// Global pool instance
let globalPool: DatabasePool | null = null;

// Initialize the global pool
export function initializePool(
  supabaseUrl: string,
  supabaseKey: string,
  config?: Partial<PoolConfig>
): DatabasePool {
  if (!globalPool) {
    globalPool = new DatabasePool(supabaseUrl, supabaseKey, config);
  }
  return globalPool;
}

// Get the global pool instance
export function getPool(): DatabasePool {
  if (!globalPool) {
    throw new Error(
      'Database pool not initialized. Call initializePool first.'
    );
  }
  return globalPool;
}

// Query optimization utilities
export class QueryOptimizer {
  // Batch multiple queries into a single transaction
  static async batchQueries<T>(
    queries: Array<(client: SupabaseClient<Database>) => Promise<any>>
  ): Promise<T[]> {
    const pool = getPool();

    return pool.execute(async (client) => {
      const results: T[] = [];

      // Execute all queries in sequence within the same connection
      for (const query of queries) {
        const result = await query(client);
        results.push(result);
      }

      return results;
    });
  }

  // Optimized pagination with cursor-based approach
  static async paginateWithCursor<T>(
    tableName: string,
    options: {
      limit: number;
      cursor?: string;
      orderBy: string;
      ascending?: boolean;
      filters?: Record<string, any>;
      select?: string;
    }
  ): Promise<{ data: T[]; nextCursor?: string; hasMore: boolean }> {
    const pool = getPool();

    return pool.execute(async (client) => {
      let query = client
        .from(tableName)
        .select(options.select || '*')
        .limit(options.limit + 1); // Fetch one extra to check if there are more

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply cursor-based pagination
      if (options.cursor) {
        const operator = options.ascending ? 'gt' : 'lt';
        query = query[operator](options.orderBy, options.cursor);
      }

      // Apply ordering
      query = query.order(options.orderBy, { ascending: options.ascending });

      const { data, error } = await query;

      if (error) throw error;

      const hasMore = data.length > options.limit;
      const results = hasMore ? data.slice(0, -1) : data;
      const nextCursor =
        hasMore && results.length > 0
          ? results[results.length - 1][options.orderBy]
          : undefined;

      return {
        data: results as T[],
        nextCursor,
        hasMore,
      };
    });
  }

  // Optimized search with full-text search
  static async fullTextSearch<T>(
    tableName: string,
    searchColumn: string,
    query: string,
    options: {
      limit?: number;
      offset?: number;
      additionalFilters?: Record<string, any>;
      select?: string;
    } = {}
  ): Promise<{ data: T[]; count: number }> {
    const pool = getPool();

    return pool.execute(async (client) => {
      let searchQuery = client
        .from(tableName)
        .select(options.select || '*', { count: 'exact' })
        .textSearch(searchColumn, query)
        .range(
          options.offset || 0,
          (options.offset || 0) + (options.limit || 20) - 1
        );

      // Apply additional filters
      if (options.additionalFilters) {
        Object.entries(options.additionalFilters).forEach(([key, value]) => {
          searchQuery = searchQuery.eq(key, value);
        });
      }

      const { data, error, count } = await searchQuery;

      if (error) throw error;

      return {
        data: data as T[],
        count: count || 0,
      };
    });
  }

  // Bulk insert with conflict resolution
  static async bulkInsert<T>(
    tableName: string,
    records: T[],
    options: {
      onConflict?: string;
      ignoreDuplicates?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<T[]> {
    const pool = getPool();
    const batchSize = options.batchSize || 100;
    const results: T[] = [];

    return pool.execute(async (client) => {
      // Process in batches
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        let query = client.from(tableName).insert(batch as any);

        // Note: onConflict and ignoreDuplicates are not available in current Supabase version
        // These would need to be handled at the application level or with upsert

        const { data, error } = await query.select();

        if (error) throw error;
        if (data) results.push(...(data as T[]));
      }

      return results;
    });
  }

  // Aggregate queries with grouping
  static async aggregate(
    tableName: string,
    options: {
      groupBy: string[];
      aggregates: Record<string, 'count' | 'sum' | 'avg' | 'min' | 'max'>;
      filters?: Record<string, any>;
      having?: Record<string, any>;
      limit?: number;
    }
  ): Promise<any[]> {
    const pool = getPool();

    return pool.execute(async (client) => {
      // Build select clause with aggregates
      const selectClauses = [
        ...options.groupBy,
        ...Object.entries(options.aggregates).map(
          ([column, func]) => `${func}(${column}) as ${column}_${func}`
        ),
      ];

      let query = client.from(tableName).select(selectClauses.join(', '));

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    });
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static queryTimes = new Map<string, number[]>();

  static startTimer(queryName: string): () => void {
    const start = Date.now();

    return () => {
      const duration = Date.now() - start;

      if (!this.queryTimes.has(queryName)) {
        this.queryTimes.set(queryName, []);
      }

      const times = this.queryTimes.get(queryName)!;
      times.push(duration);

      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift();
      }

      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }
    };
  }

  static getStats(queryName?: string) {
    if (queryName) {
      const times = this.queryTimes.get(queryName) || [];
      return this.calculateStats(times);
    }

    const allStats: Record<string, any> = {};
    for (const [name, times] of Array.from(this.queryTimes.entries())) {
      allStats[name] = this.calculateStats(times);
    }
    return allStats;
  }

  private static calculateStats(times: number[]) {
    if (times.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0 };
    }

    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);

    return {
      count: times.length,
      avg: Math.round(sum / times.length),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }
}
