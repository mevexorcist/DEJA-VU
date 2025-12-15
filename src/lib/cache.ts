// Cache implementation with Redis-like interface
// In production, replace with actual Redis client

interface CacheEntry {
  value: any;
  expiry?: number;
  tags?: string[];
}

class InMemoryCache {
  private store = new Map<string, CacheEntry>();
  private tagIndex = new Map<string, Set<string>>();

  // Get value from cache
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiry && Date.now() > entry.expiry) {
      this.delete(key);
      return null;
    }

    return entry.value;
  }

  // Set value in cache
  set(key: string, value: any, ttlSeconds?: number, tags?: string[]): void {
    const entry: CacheEntry = {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      tags,
    };

    this.store.set(key, entry);

    // Update tag index
    if (tags) {
      tags.forEach((tag) => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      });
    }
  }

  // Delete key from cache
  delete(key: string): boolean {
    const entry = this.store.get(key);

    if (entry?.tags) {
      // Remove from tag index
      entry.tags.forEach((tag) => {
        const tagSet = this.tagIndex.get(tag);
        if (tagSet) {
          tagSet.delete(key);
          if (tagSet.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    }

    return this.store.delete(key);
  }

  // Delete all keys with specific tag
  deleteByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let deletedCount = 0;
    keys.forEach((key) => {
      if (this.delete(key)) {
        deletedCount++;
      }
    });

    return deletedCount;
  }

  // Clear all cache
  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
  }

  // Get cache statistics
  getStats(): { size: number; tags: number } {
    return {
      size: this.store.size,
      tags: this.tagIndex.size,
    };
  }

  // Clean expired entries
  cleanup(): number {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [key, entry] of Array.from(this.store.entries())) {
      if (entry.expiry && now > entry.expiry) {
        this.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

// Cache instance
export const cache = new InMemoryCache();

// Cache key generators
export const CacheKeys = {
  // User-related cache keys
  user: (userId: string) => `user:${userId}`,
  userProfile: (username: string) => `user:profile:${username}`,
  userFollowers: (userId: string) => `user:followers:${userId}`,
  userFollowing: (userId: string) => `user:following:${userId}`,

  // Post-related cache keys
  post: (postId: string) => `post:${postId}`,
  userPosts: (userId: string, page: number) => `user:posts:${userId}:${page}`,
  timeline: (userId: string, page: number) => `timeline:${userId}:${page}`,
  hashtag: (tag: string, page: number) => `hashtag:${tag}:${page}`,
  trending: () => 'trending:hashtags',

  // Airdrop-related cache keys
  airdrop: (airdropId: string) => `airdrop:${airdropId}`,
  airdrops: (page: number, filter?: string) =>
    `airdrops:${page}:${filter || 'all'}`,
  userAirdrops: (userId: string) => `user:airdrops:${userId}`,
  airdropRecommendations: (walletAddress: string) =>
    `airdrop:recommendations:${walletAddress}`,

  // Exchange-related cache keys
  exchangePortfolio: (userId: string) => `exchange:portfolio:${userId}`,
  exchangeStatus: (connectionId: string) => `exchange:status:${connectionId}`,

  // Wallet-related cache keys
  walletPortfolio: (address: string) => `wallet:portfolio:${address}`,
  walletNFTs: (address: string) => `wallet:nfts:${address}`,

  // Notification cache keys
  notifications: (userId: string) => `notifications:${userId}`,
  notificationCount: (userId: string) => `notifications:count:${userId}`,

  // Search cache keys
  userSearch: (query: string) => `search:users:${query}`,
  postSearch: (query: string, page: number) => `search:posts:${query}:${page}`,
};

// Cache tags for invalidation
export const CacheTags = {
  user: (userId: string) => `user:${userId}`,
  post: (postId: string) => `post:${postId}`,
  timeline: (userId: string) => `timeline:${userId}`,
  airdrop: (airdropId: string) => `airdrop:${airdropId}`,
  exchange: (userId: string) => `exchange:${userId}`,
  wallet: (userId: string) => `wallet:${userId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  search: 'search',
};

// Cache utilities
export class CacheManager {
  // Cache with automatic key generation and tagging
  static async cacheUserData<T>(
    userId: string,
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300 // 5 minutes default
  ): Promise<T> {
    const cacheKey = `${CacheKeys.user(userId)}:${key}`;
    const cached = cache.get<T>(cacheKey);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    cache.set(cacheKey, data, ttlSeconds, [CacheTags.user(userId)]);

    return data;
  }

  // Cache timeline data
  static async cacheTimeline<T>(
    userId: string,
    page: number,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60 // 1 minute for timeline
  ): Promise<T> {
    const cacheKey = CacheKeys.timeline(userId, page);
    const cached = cache.get<T>(cacheKey);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    cache.set(cacheKey, data, ttlSeconds, [CacheTags.timeline(userId)]);

    return data;
  }

  // Cache search results
  static async cacheSearch<T>(
    query: string,
    type: 'users' | 'posts',
    page: number = 0,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300 // 5 minutes for search
  ): Promise<T> {
    const cacheKey =
      type === 'users'
        ? CacheKeys.userSearch(query)
        : CacheKeys.postSearch(query, page);

    const cached = cache.get<T>(cacheKey);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    cache.set(cacheKey, data, ttlSeconds, [CacheTags.search]);

    return data;
  }

  // Invalidate user-related cache
  static invalidateUser(userId: string): void {
    cache.deleteByTag(CacheTags.user(userId));
    cache.deleteByTag(CacheTags.timeline(userId));
    cache.deleteByTag(CacheTags.notifications(userId));
  }

  // Invalidate post-related cache
  static invalidatePost(postId: string, authorId: string): void {
    cache.deleteByTag(CacheTags.post(postId));
    cache.deleteByTag(CacheTags.timeline(authorId));
    cache.deleteByTag(CacheTags.search);
  }

  // Invalidate airdrop-related cache
  static invalidateAirdrop(airdropId: string): void {
    cache.deleteByTag(CacheTags.airdrop(airdropId));
    // Invalidate all airdrop listings
    cache.deleteByTag('airdrops');
  }

  // Get cache statistics
  static getStats() {
    return cache.getStats();
  }

  // Manual cleanup of expired entries
  static cleanup(): number {
    return cache.cleanup();
  }
}

// Automatic cleanup every 5 minutes
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(
    () => {
      CacheManager.cleanup();
    },
    5 * 60 * 1000
  );
}
