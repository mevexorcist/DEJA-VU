-- DEJA-VU Row Level Security (RLS) Policies
-- This migration implements security policies to protect user data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE airdrops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_airdrops ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all public profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts table policies
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- Follows table policies
CREATE POLICY "Follow relationships are viewable by everyone" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Airdrops table policies
CREATE POLICY "Airdrops are viewable by everyone" ON airdrops
  FOR SELECT USING (true);

-- User airdrops policies
CREATE POLICY "Users can view their own airdrop interactions" ON user_airdrops
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own airdrop interactions" ON user_airdrops
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own airdrop interactions" ON user_airdrops
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own airdrop interactions" ON user_airdrops
  FOR DELETE USING (auth.uid() = user_id);

-- Exchange connections policies
CREATE POLICY "Users can view their own exchange connections" ON exchange_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own exchange connections" ON exchange_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exchange connections" ON exchange_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exchange connections" ON exchange_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Wallet connections policies
CREATE POLICY "Users can view their own wallet connections" ON wallet_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wallet connections" ON wallet_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet connections" ON wallet_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallet connections" ON wallet_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view conversations they participate in" ON conversations
  FOR SELECT USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update conversations they participate in" ON conversations
  FOR UPDATE USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Direct messages policies
CREATE POLICY "Users can view messages in their conversations" ON direct_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = direct_messages.conversation_id 
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON direct_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = direct_messages.conversation_id 
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON direct_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Social interactions policies
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Reposts are viewable by everyone" ON reposts
  FOR SELECT USING (true);

CREATE POLICY "Users can repost" ON reposts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unrepost" ON reposts
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Replies are viewable by everyone" ON replies
  FOR SELECT USING (true);

CREATE POLICY "Users can reply to posts" ON replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);