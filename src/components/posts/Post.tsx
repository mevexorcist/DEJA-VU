'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useRealtimeSocialInteractions } from '@/hooks/useRealtime';
import SocialActions from '@/components/social/SocialActions';

interface PostProps {
  post: {
    id: string;
    author_id: string;
    content: string;
    media_urls: string[] | null;
    hashtags: string[];
    mentions: string[];
    like_count: number;
    repost_count: number;
    reply_count: number;
    is_thread: boolean;
    thread_id: string | null;
    parent_post_id: string | null;
    created_at: string;
    author: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      is_verified: boolean;
    };
    user_liked?: boolean;
    user_reposted?: boolean;
  };
  onReply?: (post: PostProps['post']) => void;
  onDelete?: (postId: string) => void;
  showThread?: boolean;
}

export default function Post({
  post,
  onReply,
  onDelete,
  showThread = true,
}: PostProps) {
  const { user } = useAuth();
  const [interactionCounts, setInteractionCounts] = useState({
    like_count: post.like_count,
    repost_count: post.repost_count,
    reply_count: post.reply_count,
  });

  // Real-time interaction updates
  const { interactions } = useRealtimeSocialInteractions(post.id, (data) => {
    setInteractionCounts(data);
  });

  // Update counts when real-time data changes
  useEffect(() => {
    if (
      interactions.like_count !== 0 ||
      interactions.repost_count !== 0 ||
      interactions.reply_count !== 0
    ) {
      setInteractionCounts(interactions);
    }
  }, [interactions]);

  const formatContent = (
    content: string,
    hashtags: string[],
    mentions: string[]
  ) => {
    let formattedContent = content;

    // Make hashtags clickable
    hashtags.forEach((hashtag) => {
      const hashtagRegex = new RegExp(`#${hashtag}`, 'gi');
      formattedContent = formattedContent.replace(
        hashtagRegex,
        `<a href="/hashtag/${hashtag}" class="text-blue-500 hover:text-blue-600 font-medium">#${hashtag}</a>`
      );
    });

    // Make mentions clickable
    mentions.forEach((mention) => {
      const mentionRegex = new RegExp(`@${mention}`, 'gi');
      formattedContent = formattedContent.replace(
        mentionRegex,
        `<a href="/user/${mention}" class="text-blue-500 hover:text-blue-600 font-medium">@${mention}</a>`
      );
    });

    return formattedContent;
  };

  const handleReply = () => {
    if (onReply) {
      onReply(post);
    }
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.author_id || !onDelete) return;

    if (confirm('Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
  };

  const isOwnPost = user?.id === post.author_id;

  return (
    <article className="border-b border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
      <div className="flex space-x-3">
        {/* Avatar */}
        <a href={`/user/${post.author.username}`} className="flex-shrink-0">
          <img
            src={
              post.author.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.display_name)}&background=random`
            }
            alt={post.author.display_name}
            className="w-12 h-12 rounded-full object-cover"
          />
        </a>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-1">
            <a
              href={`/user/${post.author.username}`}
              className="font-bold text-gray-900 dark:text-white hover:underline"
            >
              {post.author.display_name}
            </a>
            {post.author.is_verified && (
              <span className="text-blue-500">✓</span>
            )}
            <a
              href={`/user/${post.author.username}`}
              className="text-gray-500 hover:underline"
            >
              @{post.author.username}
            </a>
            <span className="text-gray-500">·</span>
            <a
              href={`/post/${post.id}`}
              className="text-gray-500 hover:underline"
            >
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </a>
            {isOwnPost && (
              <>
                <span className="text-gray-500">·</span>
                <button
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Thread indicator */}
          {post.is_thread && showThread && (
            <div className="mb-2">
              <a
                href={`/thread/${post.thread_id}`}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                🧵 Thread
              </a>
            </div>
          )}

          {/* Content */}
          <div className="mb-3">
            <p
              className="text-gray-900 dark:text-white whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: formatContent(
                  post.content,
                  post.hashtags,
                  post.mentions
                ),
              }}
            />
          </div>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mb-3">
              <div
                className={`grid gap-2 rounded-lg overflow-hidden ${
                  post.media_urls.length === 1
                    ? 'grid-cols-1'
                    : post.media_urls.length === 2
                      ? 'grid-cols-2'
                      : post.media_urls.length === 3
                        ? 'grid-cols-2'
                        : 'grid-cols-2'
                }`}
              >
                {post.media_urls.map((url, index) => (
                  <div
                    key={index}
                    className={`${
                      post.media_urls!.length === 3 && index === 0
                        ? 'row-span-2'
                        : ''
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover max-h-80"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <SocialActions
            postId={post.id}
            initialLikeCount={interactionCounts.like_count}
            initialRepostCount={interactionCounts.repost_count}
            initialReplyCount={interactionCounts.reply_count}
            initialUserLiked={post.user_liked}
            initialUserReposted={post.user_reposted}
            onReply={handleReply}
          />
        </div>
      </div>
    </article>
  );
}
