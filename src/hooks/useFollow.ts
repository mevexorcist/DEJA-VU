'use client';

import { useState, useCallback } from 'react';
import { FollowService } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

export function useFollow(targetUserId: string, initialFollowState = false) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const follow = useCallback(async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await FollowService.followUser(user.id, targetUserId);
      setIsFollowing(true);
    } catch (err: any) {
      setError(err.message || 'Failed to follow user');
      console.error('Error following user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, targetUserId, isLoading]);

  const unfollow = useCallback(async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await FollowService.unfollowUser(user.id, targetUserId);
      setIsFollowing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to unfollow user');
      console.error('Error unfollowing user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, targetUserId, isLoading]);

  const toggleFollow = useCallback(() => {
    if (isFollowing) {
      unfollow();
    } else {
      follow();
    }
  }, [isFollowing, follow, unfollow]);

  const checkFollowStatus = useCallback(async () => {
    if (!user) return;

    try {
      const followStatus = await FollowService.isFollowing(
        user.id,
        targetUserId
      );
      setIsFollowing(followStatus);
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  }, [user, targetUserId]);

  return {
    isFollowing,
    isLoading,
    error,
    follow,
    unfollow,
    toggleFollow,
    checkFollowStatus,
  };
}
