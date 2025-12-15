import { supabase } from './supabase';
import type { Database } from '@/types/database';

type Tables = Database['public']['Tables'];
// type Functions = Database['public']['Functions']; // Unused for now

// User operations
export class UserService {
  static async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error) throw error;
    return data;
  }

  static async searchUsers(searchTerm: string, limit = 10) {
    const { data, error } = await supabase.rpc('search_users', {
      search_term: searchTerm,
      limit_count: limit,
    });

    if (error) throw error;
    return data;
  }

  static async updateUser(id: string, updates: Tables['users']['Update']) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Follow operations
export class FollowService {
  static async followUser(followerId: string, followeeId: string) {
    const { data, error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, followee_id: followeeId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async unfollowUser(followerId: string, followeeId: string) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId);

    if (error) throw error;
  }

  static async getFollowers(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('follows')
      .select(
        `
        follower_id,
        created_at,
        follower:users!follows_follower_id_fkey(*)
      `
      )
      .eq('followee_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async getFollowing(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('follows')
      .select(
        `
        followee_id,
        created_at,
        followee:users!follows_followee_id_fkey(*)
      `
      )
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async isFollowing(followerId: string, followeeId: string) {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  static async areMutualFollowers(user1Id: string, user2Id: string) {
    const { data, error } = await supabase.rpc('are_mutual_followers', {
      user1_id: user1Id,
      user2_id: user2Id,
    });

    if (error) throw error;
    return data;
  }
}

// Post operations
export class PostService {
  static async createPost(post: Tables['posts']['Insert']) {
    // Validate content is not empty or whitespace-only
    if (!post.content || post.content.trim() === '') {
      throw new Error(
        'Post content cannot be empty or contain only whitespace'
      );
    }

    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select(
        `
        *,
        author:users(*)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  static async getPost(id: string) {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        author:users(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserTimeline(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase.rpc('get_user_timeline', {
      user_id: userId,
      limit_count: limit,
      offset_count: offset,
    });

    if (error) throw error;
    return data;
  }

  static async getUserPosts(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        author:users(*)
      `
      )
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async updatePost(id: string, updates: Tables['posts']['Update']) {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        author:users(*)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePost(id: string) {
    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) throw error;
  }

  static async searchPostsByHashtag(hashtag: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        author:users(*)
      `
      )
      .contains('hashtags', [hashtag.toLowerCase()])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async getTrendingHashtags(limit = 10, hoursBack = 24) {
    const { data, error } = await supabase.rpc('get_trending_hashtags', {
      limit_count: limit,
      hours_back: hoursBack,
    });

    if (error) throw error;
    return data;
  }
}

// Social interaction operations
export class InteractionService {
  static async likePost(userId: string, postId: string) {
    const { data, error } = await supabase
      .from('likes')
      .insert({ user_id: userId, post_id: postId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async unlikePost(userId: string, postId: string) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) throw error;
  }

  static async repost(userId: string, postId: string) {
    const { data, error } = await supabase
      .from('reposts')
      .insert({ user_id: userId, post_id: postId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async unrepost(userId: string, postId: string) {
    const { error } = await supabase
      .from('reposts')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);

    if (error) throw error;
  }

  static async replyToPost(
    userId: string,
    postId: string,
    replyPostId: string
  ) {
    const { data, error } = await supabase
      .from('replies')
      .insert({ user_id: userId, post_id: postId, reply_post_id: replyPostId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPostLikes(postId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('likes')
      .select(
        `
        *,
        user:users(*)
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async getPostReposts(postId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('reposts')
      .select(
        `
        *,
        user:users(*)
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async getPostReplies(postId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('replies')
      .select(
        `
        *,
        user:users(*),
        reply_post:posts(*, author:users(*))
      `
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }
}

// Notification operations
export class NotificationService {
  static async getUserNotifications(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async getUnreadNotificationCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  static async markNotificationAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  static async markAllNotificationsAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  static async createNotification(
    notification: Tables['notifications']['Insert']
  ) {
    // Validate and set default values for empty/whitespace-only content (Requirements 4.6, 7.1, 7.4)
    const processedNotification = {
      ...notification,
      title:
        !notification.title || notification.title.trim() === ''
          ? 'New notification'
          : notification.title.trim(),
      message:
        !notification.message || notification.message.trim() === ''
          ? 'You have a new notification'
          : notification.message.trim(),
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(processedNotification)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// Direct message operations
export class MessageService {
  static async getOrCreateConversation(user1Id: string, user2Id: string) {
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      user1_id: user1Id,
      user2_id: user2Id,
    });

    if (error) throw error;
    return data;
  }

  static async getUserConversations(userId: string, limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('conversations')
      .select(
        `
        *,
        participant1:users!conversations_participant_1_fkey(*),
        participant2:users!conversations_participant_2_fkey(*)
      `
      )
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order('last_activity', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }

  static async getConversationMessages(
    conversationId: string,
    limit = 50,
    offset = 0
  ) {
    const { data, error } = await supabase
      .from('direct_messages')
      .select(
        `
        *,
        sender:users(*)
      `
      )
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data?.reverse(); // Return in chronological order
  }

  static async sendMessage(message: Tables['direct_messages']['Insert']) {
    const { data, error } = await supabase
      .from('direct_messages')
      .insert(message)
      .select(
        `
        *,
        sender:users(*)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  static async markMessageAsRead(messageId: string) {
    const { error } = await supabase
      .from('direct_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
  }

  static async getUnreadMessageCount(userId: string) {
    // First get conversation IDs for the user
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

    if (convError) throw convError;

    if (!conversations || conversations.length === 0) {
      return 0;
    }

    const conversationIds = conversations.map((c) => c.id);

    const { count, error } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .eq('is_read', false)
      .in('conversation_id', conversationIds);

    if (error) throw error;
    return count || 0;
  }
}
