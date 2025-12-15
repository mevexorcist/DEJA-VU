'use client';

import { useState, useEffect, useCallback } from 'react';
import { PostService } from '@/lib/database';
import Post from './Post';

interface HashtagFeedProps {
  hashtag: string;
}

export default function HashtagFeed({ hashtag }: HashtagFeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const POSTS_PER_PAGE = 20;

  const loadPosts = useCallback(
    async (reset = false) => {
      const currentOffset = reset ? 0 : offset;
      const loadingState = reset ? setLoading : setLoadingMore;

      loadingState(true);
      setError(null);

      try {
        const newPosts = await PostService.searchPostsByHashtag(
          hashtag,
          POSTS_PER_PAGE,
          currentOffset
        );

        if (reset) {
          setPosts(newPosts);
          setOffset(POSTS_PER_PAGE);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
          setOffset((prev) => prev + POSTS_PER_PAGE);
        }

        setHasMore(newPosts.length === POSTS_PER_PAGE);
      } catch (error) {
        console.error('Failed to load hashtag posts:', error);
        setError('Failed to load posts. Please try again.');
      } finally {
        loadingState(false);
      }
    },
    [hashtag, offset]
  );

  // Initial load
  useEffect(() => {
    loadPosts(true);
  }, [hashtag]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 1000 &&
        hasMore &&
        !loadingMore &&
        !loading
      ) {
        loadPosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loading, loadPosts]);

  const handleDeletePost = async (postId: string) => {
    try {
      await PostService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold">#{hashtag}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Posts tagged with #{hashtag}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={() => loadPosts(true)}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && posts.length === 0 && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Loading posts...
          </p>
        </div>
      )}

      {/* Posts */}
      <div>
        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onDelete={handleDeletePost}
            showThread={true}
          />
        ))}
      </div>

      {/* Load More */}
      {loadingMore && (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Loading more posts...
          </p>
        </div>
      )}

      {/* No More Posts */}
      {!hasMore && posts.length > 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No more posts with #{hashtag}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && !error && (
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">No posts found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            No posts have been tagged with #{hashtag} yet.
          </p>
        </div>
      )}
    </div>
  );
}
