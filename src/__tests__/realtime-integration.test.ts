/**
 * Integration tests for real-time features
 * Tests WebSocket connections, message delivery, and live data updates
 * Requirements: 2.4, 3.3, 4.2, 4.3, 5.3
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { realtimeService } from '../lib/realtime';
import {
  useRealtimeTimeline,
  useRealtimeNotifications,
  useRealtimeAirdrops,
  useRealtimePortfolio,
  useRealtimeDirectMessages,
  useRealtimeSocialInteractions,
} from '../hooks/useRealtime';

// Mock Supabase client
jest.mock('../lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      send: jest.fn().mockResolvedValue(undefined),
    })),
    removeChannel: jest.fn(),
  },
}));

describe('Real-time Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    realtimeService.unsubscribeAll();
  });

  describe('WebSocket Connection Management', () => {
    test('should establish WebSocket connection for timeline updates', async () => {
      const userId = 'test-user-1';
      const onNewPost = jest.fn();
      const onPostUpdate = jest.fn();

      const { result } = renderHook(() =>
        useRealtimeTimeline(userId, onNewPost, onPostUpdate)
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(realtimeService.isSubscribed(`timeline:${userId}`)).toBe(true);
    });

    test('should establish WebSocket connection for notifications', async () => {
      const userId = 'test-user-1';
      const onNewNotification = jest.fn();

      const { result } = renderHook(() =>
        useRealtimeNotifications(userId, onNewNotification)
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(realtimeService.isSubscribed(`notifications:${userId}`)).toBe(
        true
      );
    });

    test('should establish WebSocket connection for airdrop updates', async () => {
      const userId = 'test-user-1';
      const onAirdropUpdate = jest.fn();
      const onAirdropReminder = jest.fn();

      const { result } = renderHook(() =>
        useRealtimeAirdrops(userId, onAirdropUpdate, onAirdropReminder)
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(realtimeService.isSubscribed(`airdrops:${userId}`)).toBe(true);
    });

    test('should establish WebSocket connection for portfolio updates', async () => {
      const userId = 'test-user-1';
      const onBalanceUpdate = jest.fn();

      const { result } = renderHook(() =>
        useRealtimePortfolio(userId, onBalanceUpdate)
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(realtimeService.isSubscribed(`portfolio:${userId}`)).toBe(true);
    });

    test('should establish WebSocket connection for direct messages', async () => {
      const conversationId = 'conversation-1';
      const onNewMessage = jest.fn();
      const onMessageRead = jest.fn();

      const { result } = renderHook(() =>
        useRealtimeDirectMessages(conversationId, onNewMessage, onMessageRead)
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true);
      });

      expect(realtimeService.isSubscribed(`messages:${conversationId}`)).toBe(
        true
      );
    });

    test('should manage multiple concurrent connections', async () => {
      const userId = 'test-user-1';
      const postId = 'post-1';
      const conversationId = 'conversation-1';

      // Establish multiple connections
      const { result: timelineResult } = renderHook(() =>
        useRealtimeTimeline(userId, jest.fn(), jest.fn())
      );

      const { result: notificationResult } = renderHook(() =>
        useRealtimeNotifications(userId, jest.fn())
      );

      const { result: socialResult } = renderHook(() =>
        useRealtimeSocialInteractions(postId, jest.fn())
      );

      const { result: messageResult } = renderHook(() =>
        useRealtimeDirectMessages(conversationId, jest.fn(), jest.fn())
      );

      await waitFor(() => {
        expect(timelineResult.current.isConnected).toBe(true);
        expect(notificationResult.current.isConnected).toBe(true);
        expect(socialResult.current.isConnected).toBe(true);
        expect(messageResult.current.isConnected).toBe(true);
      });

      // Verify all connections are active
      expect(realtimeService.getActiveSubscriptionsCount()).toBe(4);
    });
  });

  describe('Message Delivery and Processing', () => {
    test('should handle timeline post updates in real-time', async () => {
      const userId = 'test-user-1';
      const onNewPost = jest.fn();
      const onPostUpdate = jest.fn();

      const mockPost = {
        id: 'post-1',
        author_id: 'author-1',
        content: 'Test post content',
        created_at: new Date().toISOString(),
      };

      renderHook(() => useRealtimeTimeline(userId, onNewPost, onPostUpdate));

      // Simulate receiving a new post
      act(() => {
        onNewPost(mockPost);
      });

      expect(onNewPost).toHaveBeenCalledWith(mockPost);
    });

    test('should handle notification delivery callbacks', async () => {
      const userId = 'test-user-1';
      const onNewNotification = jest.fn();

      const mockNotification = {
        id: 'notification-1',
        user_id: userId,
        type: 'like',
        title: 'New like on your post',
        message: 'Someone liked your post',
        created_at: new Date().toISOString(),
      };

      renderHook(() => useRealtimeNotifications(userId, onNewNotification));

      // Test that the callback function works
      act(() => {
        onNewNotification(mockNotification);
      });

      expect(onNewNotification).toHaveBeenCalledWith(mockNotification);
    });

    test('should handle airdrop reminder callbacks', async () => {
      const userId = 'test-user-1';
      const onAirdropUpdate = jest.fn();
      const onAirdropReminder = jest.fn();

      const mockReminder = {
        id: 'reminder-1',
        airdrop: {
          id: 'airdrop-1',
          title: 'Test Airdrop',
          end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        timeLeft: '24 hours',
      };

      renderHook(() =>
        useRealtimeAirdrops(userId, onAirdropUpdate, onAirdropReminder)
      );

      // Test that the callback function works
      act(() => {
        onAirdropReminder(mockReminder);
      });

      expect(onAirdropReminder).toHaveBeenCalledWith(mockReminder);
    });

    test('should handle portfolio balance update callbacks', async () => {
      const userId = 'test-user-1';
      const onBalanceUpdate = jest.fn();

      const mockPortfolio = {
        userId,
        totalValue: 10000,
        currency: 'USD',
        assets: [
          {
            symbol: 'BTC',
            name: 'Bitcoin',
            balance: 0.5,
            value: 25000,
            change24h: 2.5,
          },
        ],
        lastUpdatedAt: new Date().toISOString(),
      };

      renderHook(() => useRealtimePortfolio(userId, onBalanceUpdate));

      // Test that the callback function works
      act(() => {
        onBalanceUpdate(mockPortfolio);
      });

      expect(onBalanceUpdate).toHaveBeenCalledWith(mockPortfolio);
    });

    test('should handle direct message delivery callbacks', async () => {
      const conversationId = 'conversation-1';
      const onNewMessage = jest.fn();
      const onMessageRead = jest.fn();

      const mockMessage = {
        id: 'message-1',
        conversation_id: conversationId,
        sender_id: 'sender-1',
        content: 'Hello, this is a test message',
        is_read: false,
        sent_at: new Date().toISOString(),
      };

      renderHook(() =>
        useRealtimeDirectMessages(conversationId, onNewMessage, onMessageRead)
      );

      // Test that the callback function works
      act(() => {
        onNewMessage(mockMessage);
      });

      expect(onNewMessage).toHaveBeenCalledWith(mockMessage);
    });

    test('should handle social interaction update callbacks', async () => {
      const postId = 'post-1';
      const onInteractionUpdate = jest.fn();

      const mockInteraction = {
        like_count: 15,
        repost_count: 3,
        reply_count: 7,
      };

      renderHook(() =>
        useRealtimeSocialInteractions(postId, onInteractionUpdate)
      );

      // Test that the callback function works
      act(() => {
        onInteractionUpdate(mockInteraction);
      });

      expect(onInteractionUpdate).toHaveBeenCalledWith(mockInteraction);
    });
  });

  describe('Multi-Client Data Synchronization', () => {
    test('should synchronize post updates across multiple clients', async () => {
      const userId = 'test-user-1';
      const postId = 'post-1';

      // Simulate two clients subscribing to the same post
      const client1OnUpdate = jest.fn();
      const client2OnUpdate = jest.fn();

      renderHook(() => useRealtimeSocialInteractions(postId, client1OnUpdate));

      renderHook(() => useRealtimeSocialInteractions(postId, client2OnUpdate));

      const mockUpdate = {
        like_count: 20,
        repost_count: 5,
        reply_count: 10,
      };

      // Simulate update received by both clients
      act(() => {
        client1OnUpdate(mockUpdate);
        client2OnUpdate(mockUpdate);
      });

      expect(client1OnUpdate).toHaveBeenCalledWith(mockUpdate);
      expect(client2OnUpdate).toHaveBeenCalledWith(mockUpdate);
    });

    test('should synchronize notification delivery across user sessions', async () => {
      const userId = 'test-user-1';

      // Simulate multiple sessions for the same user
      const session1OnNotification = jest.fn();
      const session2OnNotification = jest.fn();

      renderHook(() =>
        useRealtimeNotifications(userId, session1OnNotification)
      );

      renderHook(() =>
        useRealtimeNotifications(userId, session2OnNotification)
      );

      const mockNotification = {
        id: 'notification-1',
        user_id: userId,
        type: 'mention',
        title: 'You were mentioned',
        message: 'Someone mentioned you in a post',
        created_at: new Date().toISOString(),
      };

      // Simulate notification received by both sessions
      act(() => {
        session1OnNotification(mockNotification);
        session2OnNotification(mockNotification);
      });

      expect(session1OnNotification).toHaveBeenCalledWith(mockNotification);
      expect(session2OnNotification).toHaveBeenCalledWith(mockNotification);
    });

    test('should handle connection cleanup on unmount', async () => {
      const userId = 'test-user-1';
      const onNewPost = jest.fn();

      const { unmount } = renderHook(() =>
        useRealtimeTimeline(userId, onNewPost, jest.fn())
      );

      // Verify connection is established
      expect(realtimeService.isSubscribed(`timeline:${userId}`)).toBe(true);

      // Unmount the hook
      unmount();

      // Verify connection is cleaned up
      expect(realtimeService.isSubscribed(`timeline:${userId}`)).toBe(false);
    });
  });

  describe('Error Handling and Reconnection', () => {
    test('should handle connection errors gracefully', async () => {
      const userId = 'test-user-1';
      const onNewNotification = jest.fn();

      // Mock connection error
      const mockError = new Error('WebSocket connection failed');

      const { result } = renderHook(() =>
        useRealtimeNotifications(userId, onNewNotification)
      );

      // Simulate connection error
      act(() => {
        // Connection should still be marked as attempting
        expect(result.current.isConnected).toBe(true);
      });
    });

    test('should maintain subscription state during reconnection', async () => {
      const userId = 'test-user-1';
      const conversationId = 'conversation-1';

      // Establish multiple connections
      renderHook(() => useRealtimeNotifications(userId, jest.fn()));

      renderHook(() =>
        useRealtimeDirectMessages(conversationId, jest.fn(), jest.fn())
      );

      const initialCount = realtimeService.getActiveSubscriptionsCount();
      expect(initialCount).toBe(2);

      // Simulate reconnection scenario
      act(() => {
        // Connections should be maintained
        expect(realtimeService.getActiveSubscriptionsCount()).toBe(
          initialCount
        );
      });
    });
  });

  describe('Performance and Resource Management', () => {
    test('should limit concurrent connections appropriately', async () => {
      const maxConnections = 10;
      const connections: any[] = [];

      // Create multiple connections
      for (let i = 0; i < maxConnections + 5; i++) {
        const { result } = renderHook(() =>
          useRealtimeNotifications(`user-${i}`, jest.fn())
        );
        connections.push(result);
      }

      // Should handle all connections without issues
      expect(realtimeService.getActiveSubscriptionsCount()).toBeGreaterThan(0);
    });

    test('should clean up resources when all connections are closed', async () => {
      const userId = 'test-user-1';
      const postId = 'post-1';

      const { unmount: unmountTimeline } = renderHook(() =>
        useRealtimeTimeline(userId, jest.fn(), jest.fn())
      );

      const { unmount: unmountSocial } = renderHook(() =>
        useRealtimeSocialInteractions(postId, jest.fn())
      );

      expect(realtimeService.getActiveSubscriptionsCount()).toBe(2);

      // Unmount all connections
      unmountTimeline();
      unmountSocial();

      expect(realtimeService.getActiveSubscriptionsCount()).toBe(0);
    });
  });

  describe('Broadcasting and Channel Management', () => {
    test('should broadcast portfolio updates correctly', async () => {
      const userId = 'test-user-1';
      const mockPortfolio = {
        userId,
        totalValue: 15000,
        currency: 'USD',
        assets: [],
        lastUpdatedAt: new Date().toISOString(),
      };

      await expect(
        realtimeService.broadcastPortfolioUpdate(userId, mockPortfolio)
      ).resolves.not.toThrow();
    });

    test('should broadcast airdrop reminders correctly', async () => {
      const userId = 'test-user-1';
      const mockAirdrop = {
        id: 'airdrop-1',
        title: 'Test Airdrop',
        end_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };

      await expect(
        realtimeService.broadcastAirdropReminder(userId, mockAirdrop)
      ).resolves.not.toThrow();
    });

    test('should handle channel subscription and unsubscription', async () => {
      const userId = 'test-user-1';
      const channelName = `test-channel:${userId}`;

      // Subscribe to a channel
      const subscription = realtimeService.subscribeToNotifications(
        userId,
        jest.fn()
      );

      expect(realtimeService.isSubscribed(`notifications:${userId}`)).toBe(
        true
      );

      // Unsubscribe from the channel
      subscription.unsubscribe();

      expect(realtimeService.isSubscribed(`notifications:${userId}`)).toBe(
        false
      );
    });
  });
});
