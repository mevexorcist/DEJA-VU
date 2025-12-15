import { useEffect, useRef, useState } from 'react';
import { realtimeService, RealtimeSubscription } from '../lib/realtime';
import { notificationManager } from '../lib/notifications';

// Hook for timeline real-time updates
export function useRealtimeTimeline(
  userId: string,
  onNewPost?: (post: any) => void,
  onPostUpdate?: (post: any) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const handleNewPost = (post: any) => {
      onNewPost?.(post);
    };

    const handlePostUpdate = (post: any) => {
      onPostUpdate?.(post);
    };

    subscriptionRef.current = realtimeService.subscribeToTimeline(
      userId,
      handleNewPost,
      handlePostUpdate
    );

    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [userId, onNewPost, onPostUpdate]);

  return { isConnected };
}

// Hook for notification real-time updates
export function useRealtimeNotifications(
  userId: string,
  onNewNotification?: (notification: any) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const handleNewNotification = (notification: any) => {
      setUnreadCount((prev) => prev + 1);
      onNewNotification?.(notification);

      // Show browser notification
      if (notificationManager.isGranted()) {
        notificationManager.showInteractionNotification(
          notification.type,
          notification.data?.username || 'Someone'
        );
      }
    };

    subscriptionRef.current = realtimeService.subscribeToNotifications(
      userId,
      handleNewNotification
    );

    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [userId, onNewNotification]);

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return { isConnected, unreadCount, markAsRead };
}

// Hook for follower count real-time updates
export function useRealtimeFollowers(
  userId: string,
  onFollowerUpdate?: (data: {
    follower_count: number;
    following_count: number;
  }) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [counts, setCounts] = useState({
    follower_count: 0,
    following_count: 0,
  });

  useEffect(() => {
    if (!userId) return;

    const handleFollowerUpdate = (data: {
      follower_count: number;
      following_count: number;
    }) => {
      setCounts(data);
      onFollowerUpdate?.(data);
    };

    subscriptionRef.current = realtimeService.subscribeToFollowerUpdates(
      userId,
      handleFollowerUpdate
    );

    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [userId, onFollowerUpdate]);

  return { isConnected, counts };
}

// Hook for social interaction real-time updates
export function useRealtimeSocialInteractions(
  postId: string,
  onInteractionUpdate?: (data: {
    like_count: number;
    repost_count: number;
    reply_count: number;
  }) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [interactions, setInteractions] = useState({
    like_count: 0,
    repost_count: 0,
    reply_count: 0,
  });

  useEffect(() => {
    if (!postId) return;

    const handleInteractionUpdate = (data: {
      like_count: number;
      repost_count: number;
      reply_count: number;
    }) => {
      setInteractions(data);
      onInteractionUpdate?.(data);
    };

    subscriptionRef.current = realtimeService.subscribeToSocialInteractions(
      postId,
      handleInteractionUpdate
    );

    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [postId, onInteractionUpdate]);

  return { isConnected, interactions };
}

// Hook for airdrop real-time updates
export function useRealtimeAirdrops(
  userId: string,
  onAirdropUpdate?: (airdrop: any) => void,
  onAirdropReminder?: (reminder: any) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const handleAirdropUpdate = (airdrop: any) => {
      onAirdropUpdate?.(airdrop);
    };

    const handleAirdropReminder = (reminder: any) => {
      setReminders((prev) => [...prev, reminder]);
      onAirdropReminder?.(reminder);

      // Show browser notification for airdrop reminders
      if (notificationManager.isGranted()) {
        notificationManager.showAirdropNotification(
          reminder.airdrop,
          reminder.timeLeft
        );
      }
    };

    subscriptionRef.current = realtimeService.subscribeToAirdrops(
      userId,
      handleAirdropUpdate,
      handleAirdropReminder
    );

    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [userId, onAirdropUpdate, onAirdropReminder]);

  const clearReminders = () => {
    setReminders([]);
  };

  return { isConnected, reminders, clearReminders };
}

// Hook for portfolio real-time updates
export function useRealtimePortfolio(
  userId: string,
  onBalanceUpdate?: (portfolio: any) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [portfolio, setPortfolio] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    const handleBalanceUpdate = (portfolioData: any) => {
      setPortfolio(portfolioData);
      onBalanceUpdate?.(portfolioData);
    };

    subscriptionRef.current = realtimeService.subscribeToPortfolioUpdates(
      userId,
      handleBalanceUpdate
    );

    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [userId, onBalanceUpdate]);

  return { isConnected, portfolio };
}

// Hook for direct message real-time updates
export function useRealtimeDirectMessages(
  conversationId: string,
  onNewMessage?: (message: any) => void,
  onMessageRead?: (messageId: string) => void
) {
  const subscriptionRef = useRef<RealtimeSubscription | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (message: any) => {
      setMessages((prev) => [...prev, message]);
      onNewMessage?.(message);

      // Show browser notification for new messages
      if (notificationManager.isGranted() && message.sender) {
        notificationManager.showMessageNotification(
          message.sender,
          message.content
        );
      }
    };

    const handleMessageRead = (messageId: string) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
      onMessageRead?.(messageId);
    };

    subscriptionRef.current = realtimeService.subscribeToDirectMessages(
      conversationId,
      handleNewMessage,
      handleMessageRead
    );

    setIsConnected(true);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [conversationId, onNewMessage, onMessageRead]);

  return { isConnected, messages };
}

// Hook for managing all real-time connections
export function useRealtimeConnection() {
  const [activeConnections, setActiveConnections] = useState(0);

  useEffect(() => {
    const updateConnectionCount = () => {
      setActiveConnections(realtimeService.getActiveSubscriptionsCount());
    };

    // Update count periodically
    const interval = setInterval(updateConnectionCount, 1000);
    updateConnectionCount(); // Initial count

    return () => {
      clearInterval(interval);
    };
  }, []);

  const disconnectAll = () => {
    realtimeService.unsubscribeAll();
    setActiveConnections(0);
  };

  return { activeConnections, disconnectAll };
}
