import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();

  private constructor() {}

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // Subscribe to new posts in timeline
  subscribeToTimeline(
    userId: string,
    onNewPost: (post: any) => void,
    onPostUpdate: (post: any) => void
  ): RealtimeSubscription {
    const channelName = `timeline:${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          onNewPost(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
        },
        (payload) => {
          onPostUpdate(payload.new);
        }
      )
      .subscribe();

    const subscription = {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  // Subscribe to notifications
  subscribeToNotifications(
    userId: string,
    onNewNotification: (notification: any) => void
  ): RealtimeSubscription {
    const channelName = `notifications:${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNewNotification(payload.new);
        }
      )
      .subscribe();

    const subscription = {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  // Subscribe to follower count updates
  subscribeToFollowerUpdates(
    userId: string,
    onFollowerUpdate: (data: {
      follower_count: number;
      following_count: number;
    }) => void
  ): RealtimeSubscription {
    const channelName = `followers:${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const { follower_count, following_count } = payload.new;
          onFollowerUpdate({ follower_count, following_count });
        }
      )
      .subscribe();

    const subscription = {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  // Subscribe to social interactions (likes, reposts, replies)
  subscribeToSocialInteractions(
    postId: string,
    onInteractionUpdate: (data: {
      like_count: number;
      repost_count: number;
      reply_count: number;
    }) => void
  ): RealtimeSubscription {
    const channelName = `interactions:${postId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${postId}`,
        },
        (payload) => {
          const { like_count, repost_count, reply_count } = payload.new;
          onInteractionUpdate({ like_count, repost_count, reply_count });
        }
      )
      .subscribe();

    const subscription = {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  // Subscribe to airdrop updates and reminders
  subscribeToAirdrops(
    userId: string,
    onAirdropUpdate: (airdrop: any) => void,
    onAirdropReminder: (reminder: any) => void
  ): RealtimeSubscription {
    const channelName = `airdrops:${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'airdrops',
        },
        (payload) => {
          onAirdropUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'airdrops',
        },
        (payload) => {
          onAirdropUpdate(payload.new);
        }
      )
      .on('broadcast', { event: 'airdrop_reminder' }, (payload) => {
        if (payload.payload.userId === userId) {
          onAirdropReminder(payload.payload);
        }
      })
      .subscribe();

    const subscription = {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  // Subscribe to portfolio balance updates
  subscribeToPortfolioUpdates(
    userId: string,
    onBalanceUpdate: (portfolio: any) => void
  ): RealtimeSubscription {
    const channelName = `portfolio:${userId}`;

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'portfolio_update' }, (payload) => {
        if (payload.payload.userId === userId) {
          onBalanceUpdate(payload.payload.portfolio);
        }
      })
      .subscribe();

    const subscription = {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  // Subscribe to direct messages
  subscribeToDirectMessages(
    conversationId: string,
    onNewMessage: (message: any) => void,
    onMessageRead: (messageId: string) => void
  ): RealtimeSubscription {
    const channelName = `messages:${conversationId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onNewMessage(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new.is_read && !payload.old.is_read) {
            onMessageRead(payload.new.id);
          }
        }
      )
      .subscribe();

    const subscription = {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.subscriptions.delete(channelName);
      },
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  // Broadcast portfolio update
  async broadcastPortfolioUpdate(
    userId: string,
    portfolio: any
  ): Promise<void> {
    const channel = supabase.channel(`portfolio:${userId}`);
    await channel.send({
      type: 'broadcast',
      event: 'portfolio_update',
      payload: { userId, portfolio },
    });
  }

  // Broadcast airdrop reminder
  async broadcastAirdropReminder(userId: string, airdrop: any): Promise<void> {
    const channel = supabase.channel(`airdrops:${userId}`);
    await channel.send({
      type: 'broadcast',
      event: 'airdrop_reminder',
      payload: { userId, airdrop },
    });
  }

  // Unsubscribe from specific channel
  unsubscribe(channelName: string): void {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  // Get active subscriptions count
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }

  // Check if subscribed to specific channel
  isSubscribed(channelName: string): boolean {
    return this.subscriptions.has(channelName);
  }
}

export const realtimeService = RealtimeService.getInstance();
