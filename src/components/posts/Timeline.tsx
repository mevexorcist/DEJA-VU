'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PostService } from '@/lib/database';
import { useRealtimeTimeline } from '@/hooks/useRealtime';
import Post from './Post';
import PostCreator from './PostCreator';

interface TimelineProps {
  userId?: string; // If provided, shows user's posts only
  showPostCreator?: boolean;
}

export default function Timeline({
  userId,
  showPostCreator = true,
}: TimelineProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [newPostsAvailable, setNewPostsAvailable] = useState(0);

  const POSTS_PER_PAGE = 20;

  // Real-time timeline updates
  const { isConnected } = useRealtimeTimeline(
    user?.id || '',
    (newPost) => {
      // Only add to timeline if it's from a followed user or own post
      if (!userId) {
        setNewPostsAvailable((prev) => prev + 1);
      }
    },
    (updatedPost) => {
      // Update existing post in timeline
      setPosts((prev) =>
        prev.map((post) =>
          post.id === updatedPost.id ? { ...post, ...updatedPost } : post
        )
      );
    }
  );

  const loadPosts = useCallback(
    async (reset = false) => {
      if (!user) return;

      const currentOffset = reset ? 0 : offset;
      const loadingState = reset ? setLoading : setLoadingMore;

      loadingState(true);
      setError(null);

      try {
        let newPosts;

        if (userId) {
          // Load specific user's posts
          newPosts = await PostService.getUserPosts(
            userId,
            POSTS_PER_PAGE,
            currentOffset
          );
        } else {
          // Load timeline (posts from followed users)
          newPosts = await PostService.getUserTimeline(
            user.id,
            POSTS_PER_PAGE,
            currentOffset
          );
        }

        if (reset) {
          setPosts(newPosts);
          setOffset(POSTS_PER_PAGE);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
          setOffset((prev) => prev + POSTS_PER_PAGE);
        }

        setHasMore(newPosts.length === POSTS_PER_PAGE);
      } catch (error) {
        console.error('Failed to load posts:', error);
        setError('Failed to load posts. Please try again.');
      } finally {
        loadingState(false);
      }
    },
    [user, userId, offset]
  );

  // Initial load
  useEffect(() => {
    if (user) {
      loadPosts(true);
    }
  }, [user, userId]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 1000 && // Load when 1000px from bottom
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

  const handlePostCreated = (newPost: any) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleReply = (post: any) => {
    setReplyingTo(post);
  };

  const handleReplyCreated = (replyPost: any) => {
    // Add reply to the timeline
    setPosts((prev) => [replyPost, ...prev]);
    setReplyingTo(null);

    // Update reply count for the original post
    setPosts((prev) =>
      prev.map((p) =>
        p.id === replyingTo?.id ? { ...p, reply_count: p.reply_count + 1 } : p
      )
    );
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await PostService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const refreshTimeline = () => {
    loadPosts(true);
    setNewPostsAvailable(0);
  };

  const loadNewPosts = () => {
    loadPosts(true);
    setNewPostsAvailable(0);
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Welcome to DEJA-VU</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please log in to see your timeline and create posts.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{userId ? 'Posts' : 'Home'}</h1>
        <div className="flex items-center gap-2">
          {isConnected && (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </span>
          )}
          <button
            onClick={refreshTimeline}
            className="text-blue-500 hover:text-blue-600"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* New Posts Available Banner */}
      {newPostsAvailable > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700 p-3 text-center">
          <button
            onClick={loadNewPosts}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
          >
            {newPostsAvailable} new post{newPostsAvailable > 1 ? 's' : ''}{' '}
            available - Click to load
          </button>
        </div>
      )}

      {/* Post Creator */}
      {showPostCreator && !userId && (
        <PostCreator onPostCreated={handlePostCreated} />
      )}

      {/* Reply Creator */}
      {replyingTo && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Replying to @{replyingTo.author.username}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg">
              <PostCreator
                onPostCreated={handleReplyCreated}
                placeholder="Post your reply"
                parentPostId={replyingTo.id}
              />
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel reply
            </button>
          </div>
        </div>
      )}

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
            onReply={handleReply}
            onDelete={handleDeletePost}
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
          <p>You&apos;ve reached the end of the timeline</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && !error && (
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {userId
              ? "This user hasn't posted anything yet."
              : 'Follow some users to see their posts in your timeline.'}
          </p>
          {!userId && (
            <a
              href="/explore"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              Discover users to follow
            </a>
          )}
        </div>
      )}
    </div>
  );
}
