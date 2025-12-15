'use client';

import { useState, useEffect } from 'react';
import { PostService } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import Post from './Post';

interface ThreadViewProps {
  threadId: string;
}

export default function ThreadView({ threadId }: ThreadViewProps) {
  const [threadPosts, setThreadPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadThread = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get all posts in the thread
        const { data, error } = await supabase
          .from('posts')
          .select(
            `
            *,
            author:users(*)
          `
          )
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setThreadPosts(data || []);
      } catch (error) {
        console.error('Failed to load thread:', error);
        setError('Failed to load thread. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadThread();
  }, [threadId]);

  const handleDeletePost = async (postId: string) => {
    try {
      await PostService.deletePost(postId);
      setThreadPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Loading thread...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (threadPosts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Thread not found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          This thread may have been deleted or doesn&apos;t exist.
        </p>
      </div>
    );
  }

  const mainPost = threadPosts[0];
  const threadReplies = threadPosts.slice(1);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold">Thread</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {threadPosts.length} {threadPosts.length === 1 ? 'post' : 'posts'} in
          this thread
        </p>
      </div>

      {/* Main post */}
      <div className="border-b-2 border-blue-200 dark:border-blue-800">
        <Post post={mainPost} onDelete={handleDeletePost} showThread={false} />
      </div>

      {/* Thread continuation indicator */}
      {threadReplies.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            🧵 Thread continues below
          </p>
        </div>
      )}

      {/* Thread replies */}
      <div>
        {threadReplies.map((post, index) => (
          <div key={post.id} className="relative">
            {/* Thread line connector */}
            <div className="absolute left-8 top-0 w-0.5 h-full bg-gray-300 dark:bg-gray-600"></div>

            <div className="relative bg-gray-50 dark:bg-gray-900/50">
              <Post
                post={post}
                onDelete={handleDeletePost}
                showThread={false}
              />
            </div>

            {/* Thread part indicator */}
            <div className="px-4 py-1 bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
              Part {index + 2} of {threadPosts.length}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
