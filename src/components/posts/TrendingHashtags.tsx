'use client';

import { useState, useEffect } from 'react';
import { PostService } from '@/lib/database';

interface TrendingHashtagsProps {
  limit?: number;
  className?: string;
}

export default function TrendingHashtags({
  limit = 10,
  className = '',
}: TrendingHashtagsProps) {
  const [hashtags, setHashtags] = useState<
    Array<{ hashtag: string; post_count: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrendingHashtags = async () => {
      setLoading(true);
      setError(null);

      try {
        const trendingHashtags = await PostService.getTrendingHashtags(limit);
        setHashtags(trendingHashtags);
      } catch (error) {
        console.error('Failed to load trending hashtags:', error);
        setError('Failed to load trending hashtags');
      } finally {
        setLoading(false);
      }
    };

    loadTrendingHashtags();
  }, [limit]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <h2 className="text-lg font-bold mb-3">Trending Hashtags</h2>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <h2 className="text-lg font-bold mb-3">Trending Hashtags</h2>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (hashtags.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <h2 className="text-lg font-bold mb-3">Trending Hashtags</h2>
        <p className="text-gray-500 text-sm">No trending hashtags yet</p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <h2 className="text-lg font-bold mb-3">Trending Hashtags</h2>
      <div className="space-y-2">
        {hashtags.map((item, index) => (
          <a
            key={item.hashtag}
            href={`/hashtag/${item.hashtag}`}
            className="block p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  #{item.hashtag}
                </div>
                <div className="text-sm text-gray-500">
                  {item.post_count} {item.post_count === 1 ? 'post' : 'posts'}
                </div>
              </div>
              <div className="text-sm text-gray-400">#{index + 1}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
