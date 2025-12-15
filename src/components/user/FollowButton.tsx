'use client';

import React from 'react';
import { useFollow } from '@/hooks/useFollow';

interface FollowButtonProps {
  userId: string;
  initialFollowState?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  initialFollowState = false,
  size = 'md',
  variant = 'primary',
  className = '',
  onFollowChange,
}: FollowButtonProps) {
  const { isFollowing, isLoading, error, toggleFollow } = useFollow(
    userId,
    initialFollowState
  );

  React.useEffect(() => {
    onFollowChange?.(isFollowing);
  }, [isFollowing, onFollowChange]);

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const baseClasses = `
    font-medium rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
  `;

  const variantClasses = {
    primary: isFollowing
      ? 'bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-600 dark:bg-gray-600 dark:hover:bg-red-900 dark:text-gray-200 dark:hover:text-red-400 focus:ring-red-500'
      : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: isFollowing
      ? 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600 focus:ring-red-500'
      : 'border border-blue-600 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white focus:ring-blue-500',
  };

  const buttonText = () => {
    if (isLoading) return '...';
    return isFollowing ? 'Unfollow' : 'Follow';
  };

  return (
    <div>
      <button
        onClick={toggleFollow}
        disabled={isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        title={isFollowing ? 'Click to unfollow' : 'Click to follow'}
      >
        {buttonText()}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
