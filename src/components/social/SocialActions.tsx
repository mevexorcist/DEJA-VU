'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InteractionService } from '@/lib/database';

interface SocialActionsProps {
  postId: string;
  initialLikeCount: number;
  initialRepostCount: number;
  initialReplyCount: number;
  initialUserLiked?: boolean;
  initialUserReposted?: boolean;
  onReply?: () => void;
  className?: string;
}

export default function SocialActions({
  postId,
  initialLikeCount,
  initialRepostCount,
  initialReplyCount,
  initialUserLiked = false,
  initialUserReposted = false,
  onReply,
  className = '',
}: SocialActionsProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(initialUserLiked);
  const [isReposted, setIsReposted] = useState(initialUserReposted);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [repostCount, setRepostCount] = useState(initialRepostCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      if (isLiked) {
        await InteractionService.unlikePost(user.id, postId);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await InteractionService.likePost(user.id, postId);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepost = async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      if (isReposted) {
        await InteractionService.unrepost(user.id, postId);
        setIsReposted(false);
        setRepostCount((prev) => prev - 1);
      } else {
        await InteractionService.repost(user.id, postId);
        setIsReposted(true);
        setRepostCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to toggle repost:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = () => {
    if (onReply) {
      onReply();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'DEJA-VU Post',
        url: `${window.location.origin}/post/${postId}`,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    }
  };

  return (
    <div className={`flex items-center justify-between max-w-md ${className}`}>
      {/* Reply Button */}
      <button
        onClick={handleReply}
        disabled={!user}
        className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 disabled:cursor-not-allowed group transition-colors"
        title="Reply"
      >
        <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <span className="text-sm">{initialReplyCount}</span>
      </button>

      {/* Repost Button */}
      <button
        onClick={handleRepost}
        disabled={!user || isLoading}
        className={`flex items-center space-x-2 hover:text-green-500 disabled:cursor-not-allowed group transition-colors ${
          isReposted ? 'text-green-500' : 'text-gray-500'
        }`}
        title={isReposted ? 'Undo repost' : 'Repost'}
      >
        <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <span className="text-sm">{repostCount}</span>
      </button>

      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={!user || isLoading}
        className={`flex items-center space-x-2 hover:text-red-500 disabled:cursor-not-allowed group transition-colors ${
          isLiked ? 'text-red-500' : 'text-gray-500'
        }`}
        title={isLiked ? 'Unlike' : 'Like'}
      >
        <div className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
          <svg
            className="w-5 h-5"
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <span className="text-sm">{likeCount}</span>
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        disabled={!user}
        className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 disabled:cursor-not-allowed group transition-colors"
        title="Share"
      >
        <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
            />
          </svg>
        </div>
      </button>
    </div>
  );
}
