'use client';

import React, { useState, useEffect } from 'react';
import { AirdropService } from '../../lib/airdrop';
import { useRealtimeAirdrops } from '../../hooks/useRealtime';
import type { AirdropFeedItem, AirdropFilters } from '../../types/airdrop';
import AirdropCard from './AirdropCard';
import AirdropSearch from './AirdropSearch';

interface AirdropFeedProps {
  userId?: string;
  showBookmarkedOnly?: boolean;
  className?: string;
}

const AirdropFeed: React.FC<AirdropFeedProps> = ({
  userId,
  showBookmarkedOnly = false,
  className = '',
}) => {
  const [airdrops, setAirdrops] = useState<AirdropFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AirdropFilters>({
    status: 'active',
  });
  const [newAirdropAvailable, setNewAirdropAvailable] = useState(false);
  const [reminderNotifications, setReminderNotifications] = useState<any[]>([]);

  // Real-time airdrop updates
  const { isConnected, reminders } = useRealtimeAirdrops(
    userId || '',
    (newAirdrop) => {
      // Add new airdrop to the feed if it matches current filters
      if (!showBookmarkedOnly) {
        setNewAirdropAvailable(true);
      }
    },
    (reminder) => {
      setReminderNotifications((prev) => [...prev, reminder]);
      // Show browser notification for airdrop reminders
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Airdrop Reminder: ${reminder.airdrop.title}`, {
          body: `Deadline approaching in ${reminder.timeLeft}`,
          icon: '/favicon.ico',
        });
      }
    }
  );

  const loadAirdrops = async () => {
    try {
      setLoading(true);
      setError(null);

      let fetchedAirdrops: AirdropFeedItem[];

      if (showBookmarkedOnly && userId) {
        fetchedAirdrops = await AirdropService.getUserAirdrops(userId, filters);
      } else {
        fetchedAirdrops = await AirdropService.getAirdrops(filters);
      }

      setAirdrops(fetchedAirdrops);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load airdrops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAirdrops();
  }, [filters, showBookmarkedOnly, userId]);

  const refreshFeed = () => {
    loadAirdrops();
    setNewAirdropAvailable(false);
  };

  const dismissReminder = (reminderId: string) => {
    setReminderNotifications((prev) =>
      prev.filter((reminder) => reminder.id !== reminderId)
    );
  };

  const handleBookmarkToggle = async (
    airdropId: string,
    isBookmarked: boolean
  ) => {
    if (!userId) return;

    try {
      if (isBookmarked) {
        await AirdropService.removeBookmark(userId, airdropId);
      } else {
        await AirdropService.bookmarkAirdrop(userId, airdropId);
      }

      // Update local state
      setAirdrops((prev) =>
        prev.map((airdrop) =>
          airdrop.id === airdropId
            ? { ...airdrop, is_bookmarked: !isBookmarked }
            : airdrop
        )
      );
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleFiltersChange = (newFilters: AirdropFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">Error loading airdrops</div>
        <div className="text-gray-600 mb-4">{error}</div>
        <button
          onClick={loadAirdrops}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Real-time Status */}
      {isConnected && (
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 dark:text-green-400">
              Live airdrop updates active
            </span>
          </div>
          {newAirdropAvailable && (
            <button
              onClick={refreshFeed}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              New airdrops available - Refresh
            </button>
          )}
        </div>
      )}

      {/* Reminder Notifications */}
      {reminderNotifications.length > 0 && (
        <div className="space-y-2">
          {reminderNotifications.map((reminder, index) => (
            <div
              key={index}
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-yellow-800 dark:text-yellow-200">
                  🪂 Airdrop Reminder
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  {reminder.airdrop.title} - Deadline approaching!
                </div>
              </div>
              <button
                onClick={() => dismissReminder(reminder.id)}
                className="text-yellow-600 hover:text-yellow-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <AirdropSearch
        filters={filters}
        onFiltersChange={handleFiltersChange}
        showBookmarkedToggle={!!userId}
        showBookmarkedOnly={showBookmarkedOnly}
      />

      {/* Airdrop List */}
      <div className="space-y-4">
        {airdrops.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">
              {showBookmarkedOnly
                ? 'No bookmarked airdrops found'
                : 'No airdrops found'}
            </div>
            <div className="text-gray-400">
              {showBookmarkedOnly
                ? 'Start bookmarking airdrops to see them here'
                : 'Try adjusting your filters or check back later'}
            </div>
          </div>
        ) : (
          airdrops.map((airdrop) => (
            <AirdropCard
              key={airdrop.id}
              airdrop={airdrop}
              userId={userId}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))
        )}
      </div>

      {/* Load More Button (for future pagination) */}
      {airdrops.length > 0 && (
        <div className="text-center py-4">
          <button
            className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-full hover:border-gray-400 transition-colors"
            onClick={refreshFeed}
          >
            Refresh Feed
          </button>
        </div>
      )}
    </div>
  );
};

export default AirdropFeed;
