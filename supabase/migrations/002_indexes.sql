-- DEJA-VU Database Indexes for Performance Optimization
-- This migration creates all necessary indexes for optimal query performance

-- Timeline queries
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Social features
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_followee ON follows(followee_id);

-- Search and hashtags
CREATE INDEX idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX idx_posts_mentions ON posts USING GIN(mentions);

-- Airdrop queries
CREATE INDEX idx_airdrops_status_end_date ON airdrops(status, end_date);
CREATE INDEX idx_user_airdrops_user_status ON user_airdrops(user_id, status);

-- Direct messaging queries
CREATE INDEX idx_conversations_participants ON conversations(participant_1, participant_2);
CREATE INDEX idx_conversations_activity ON conversations(last_activity DESC);
CREATE INDEX idx_direct_messages_conversation ON direct_messages(conversation_id, sent_at DESC);
CREATE INDEX idx_direct_messages_unread ON direct_messages(conversation_id, is_read) WHERE is_read = FALSE;

-- Social interaction indexes
CREATE INDEX idx_likes_user_post ON likes(user_id, post_id);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_reposts_user_post ON reposts(user_id, post_id);
CREATE INDEX idx_reposts_post ON reposts(post_id);
CREATE INDEX idx_replies_post ON replies(post_id);
CREATE INDEX idx_replies_user ON replies(user_id);

-- Notification indexes
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Exchange and wallet indexes
CREATE INDEX idx_exchange_connections_user ON exchange_connections(user_id);
CREATE INDEX idx_wallet_connections_user ON wallet_connections(user_id);
CREATE INDEX idx_wallet_connections_address ON wallet_connections(address);

-- Username and email search indexes
CREATE INDEX idx_users_username_trgm ON users USING GIN(username gin_trgm_ops);
CREATE INDEX idx_users_display_name_trgm ON users USING GIN(display_name gin_trgm_ops);