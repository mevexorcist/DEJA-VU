/**
 * Browser notification utilities for real-time features
 */

export class NotificationManager {
  private static instance: NotificationManager;

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Request permission for browser notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Request permission
    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Show a browser notification
   */
  showNotification(
    title: string,
    options?: NotificationOptions
  ): Notification | null {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'deja-vu-notification',
      requireInteraction: false,
      ...options,
    };

    return new Notification(title, defaultOptions);
  }

  /**
   * Show notification for new post
   */
  showPostNotification(post: any): Notification | null {
    return this.showNotification(`New post from @${post.author.username}`, {
      body:
        post.content.substring(0, 100) +
        (post.content.length > 100 ? '...' : ''),
      tag: `post-${post.id}`,
    });
  }

  /**
   * Show notification for social interaction
   */
  showInteractionNotification(
    type: string,
    username: string
  ): Notification | null {
    const messages = {
      like: `@${username} liked your post`,
      repost: `@${username} reposted your post`,
      reply: `@${username} replied to your post`,
      mention: `@${username} mentioned you in a post`,
      follow: `@${username} started following you`,
    };

    const message =
      messages[type as keyof typeof messages] ||
      `New ${type} from @${username}`;

    return this.showNotification('DEJA-VU', {
      body: message,
      tag: `interaction-${type}`,
    });
  }

  /**
   * Show notification for airdrop reminder
   */
  showAirdropNotification(airdrop: any, timeLeft: string): Notification | null {
    return this.showNotification(`🪂 Airdrop Reminder: ${airdrop.title}`, {
      body: `Deadline approaching in ${timeLeft}`,
      tag: `airdrop-${airdrop.id}`,
      requireInteraction: true,
    });
  }

  /**
   * Show notification for direct message
   */
  showMessageNotification(sender: any, message: string): Notification | null {
    return this.showNotification(`Message from @${sender.username}`, {
      body: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      tag: `message-${sender.id}`,
    });
  }

  /**
   * Show notification for portfolio update
   */
  showPortfolioNotification(
    change: number,
    currency: string = 'USD'
  ): Notification | null {
    const changeText =
      change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
    const emoji = change >= 0 ? '📈' : '📉';

    return this.showNotification(`${emoji} Portfolio Update`, {
      body: `Your portfolio changed by ${changeText} ${currency}`,
      tag: 'portfolio-update',
    });
  }

  /**
   * Check if notifications are supported and enabled
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Check if notifications are granted
   */
  isGranted(): boolean {
    return this.isSupported() && Notification.permission === 'granted';
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }
}

export const notificationManager = NotificationManager.getInstance();
