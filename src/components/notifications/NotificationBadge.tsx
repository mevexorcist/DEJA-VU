'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/lib/database';

interface NotificationBadgeProps {
  className?: string;
  showCount?: boolean;
}

export default function NotificationBadge({
  className = '',
  showCount = true,
}: NotificationBadgeProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();

      // Poll for updates every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      const count = await NotificationService.getUnreadNotificationCount(
        user.id
      );
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  if (!user || unreadCount === 0) return null;

  return (
    <span className={`bg-red-500 text-white text-xs rounded-full ${className}`}>
      {showCount ? (
        <span className="px-2 py-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : (
        <span className="block w-2 h-2"></span>
      )}
    </span>
  );
}
