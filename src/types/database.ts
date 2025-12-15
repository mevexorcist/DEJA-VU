// Database types for DEJA-VU
// This file defines the complete database schema types

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          email: string;
          bio: string | null;
          avatar_url: string | null;
          is_verified: boolean;
          follower_count: number;
          following_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          display_name: string;
          email: string;
          bio?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          follower_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          email?: string;
          bio?: string | null;
          avatar_url?: string | null;
          is_verified?: boolean;
          follower_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          content: string;
          media_urls: string[] | null;
          hashtags: string[];
          mentions: string[];
          like_count: number;
          repost_count: number;
          reply_count: number;
          is_thread: boolean;
          thread_id: string | null;
          parent_post_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          content: string;
          media_urls?: string[] | null;
          hashtags?: string[];
          mentions?: string[];
          like_count?: number;
          repost_count?: number;
          reply_count?: number;
          is_thread?: boolean;
          thread_id?: string | null;
          parent_post_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          content?: string;
          media_urls?: string[] | null;
          hashtags?: string[];
          mentions?: string[];
          like_count?: number;
          repost_count?: number;
          reply_count?: number;
          is_thread?: boolean;
          thread_id?: string | null;
          parent_post_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          followee_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          followee_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          followee_id?: string;
          created_at?: string;
        };
      };
      airdrops: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          project_name: string;
          logo_url: string | null;
          requirements: Record<string, unknown> | null;
          eligibility_criteria: Record<string, unknown> | null;
          start_date: string | null;
          end_date: string | null;
          status: string;
          estimated_reward: string | null;
          blockchain: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          project_name: string;
          logo_url?: string | null;
          requirements?: Record<string, unknown> | null;
          eligibility_criteria?: Record<string, unknown> | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          estimated_reward?: string | null;
          blockchain?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          project_name?: string;
          logo_url?: string | null;
          requirements?: Record<string, unknown> | null;
          eligibility_criteria?: Record<string, unknown> | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          estimated_reward?: string | null;
          blockchain?: string | null;
          created_at?: string;
        };
      };
      user_airdrops: {
        Row: {
          user_id: string;
          airdrop_id: string;
          status: string;
          completed_requirements: string[];
          bookmarked_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          airdrop_id: string;
          status?: string;
          completed_requirements?: string[];
          bookmarked_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          user_id?: string;
          airdrop_id?: string;
          status?: string;
          completed_requirements?: string[];
          bookmarked_at?: string | null;
          completed_at?: string | null;
        };
      };
      exchange_connections: {
        Row: {
          id: string;
          user_id: string;
          exchange_name: string;
          api_key_hash: string;
          is_active: boolean;
          permissions: string[];
          last_sync_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exchange_name: string;
          api_key_hash: string;
          is_active?: boolean;
          permissions?: string[];
          last_sync_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exchange_name?: string;
          api_key_hash?: string;
          is_active?: boolean;
          permissions?: string[];
          last_sync_at?: string | null;
          created_at?: string;
        };
      };
      wallet_connections: {
        Row: {
          user_id: string;
          address: string;
          blockchain: string;
          is_verified: boolean;
          connected_at: string;
        };
        Insert: {
          user_id: string;
          address: string;
          blockchain: string;
          is_verified?: boolean;
          connected_at?: string;
        };
        Update: {
          user_id?: string;
          address?: string;
          blockchain?: string;
          is_verified?: boolean;
          connected_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          data: Record<string, unknown> | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          data?: Record<string, unknown> | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          data?: Record<string, unknown> | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          participant_1: string;
          participant_2: string;
          is_active: boolean;
          last_activity: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_1: string;
          participant_2: string;
          is_active?: boolean;
          last_activity?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          participant_1?: string;
          participant_2?: string;
          is_active?: boolean;
          last_activity?: string;
          created_at?: string;
        };
      };
      direct_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          media_urls: string[] | null;
          is_read: boolean;
          sent_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          media_urls?: string[] | null;
          is_read?: boolean;
          sent_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          media_urls?: string[] | null;
          is_read?: boolean;
          sent_at?: string;
          read_at?: string | null;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      reposts: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      replies: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          reply_post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          reply_post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          reply_post_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_timeline: {
        Args: {
          user_id: string;
          limit_count?: number;
          offset_count?: number;
        };
        Returns: {
          post_id: string;
          author_id: string;
          author_username: string;
          author_display_name: string;
          author_avatar_url: string | null;
          content: string;
          media_urls: string[] | null;
          hashtags: string[];
          mentions: string[];
          like_count: number;
          repost_count: number;
          reply_count: number;
          is_thread: boolean;
          thread_id: string | null;
          parent_post_id: string | null;
          created_at: string;
          user_liked: boolean;
          user_reposted: boolean;
        }[];
      };
      search_users: {
        Args: {
          search_term: string;
          limit_count?: number;
        };
        Returns: {
          user_id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          is_verified: boolean;
          follower_count: number;
          following_count: number;
        }[];
      };
      get_trending_hashtags: {
        Args: {
          limit_count?: number;
          hours_back?: number;
        };
        Returns: {
          hashtag: string;
          post_count: number;
        }[];
      };
      are_mutual_followers: {
        Args: {
          user1_id: string;
          user2_id: string;
        };
        Returns: boolean;
      };
      get_or_create_conversation: {
        Args: {
          user1_id: string;
          user2_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
