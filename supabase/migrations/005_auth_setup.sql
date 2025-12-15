-- DEJA-VU Authentication Setup
-- This migration sets up authentication-related functions and triggers

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, username, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check if users are mutual followers
CREATE OR REPLACE FUNCTION are_mutual_followers(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = user1_id AND followee_id = user2_id
  ) AND EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = user2_id AND followee_id = user1_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  participant1 UUID;
  participant2 UUID;
BEGIN
  -- Ensure consistent ordering (smaller UUID first)
  IF user1_id < user2_id THEN
    participant1 := user1_id;
    participant2 := user2_id;
  ELSE
    participant1 := user2_id;
    participant2 := user1_id;
  END IF;
  
  -- Check if users are mutual followers
  IF NOT are_mutual_followers(user1_id, user2_id) THEN
    RAISE EXCEPTION 'Users must be mutual followers to start a conversation';
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM conversations
  WHERE participant_1 = participant1 AND participant_2 = participant2;
  
  -- Create new conversation if it doesn't exist
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1, participant_2)
    VALUES (participant1, participant2)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user timeline (posts from followed users)
CREATE OR REPLACE FUNCTION get_user_timeline(user_id UUID, limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
  post_id UUID,
  author_id UUID,
  author_username VARCHAR(50),
  author_display_name VARCHAR(100),
  author_avatar_url TEXT,
  content TEXT,
  media_urls TEXT[],
  hashtags TEXT[],
  mentions TEXT[],
  like_count INTEGER,
  repost_count INTEGER,
  reply_count INTEGER,
  is_thread BOOLEAN,
  thread_id UUID,
  parent_post_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  user_liked BOOLEAN,
  user_reposted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.author_id,
    u.username,
    u.display_name,
    u.avatar_url,
    p.content,
    p.media_urls,
    p.hashtags,
    p.mentions,
    p.like_count,
    p.repost_count,
    p.reply_count,
    p.is_thread,
    p.thread_id,
    p.parent_post_id,
    p.created_at,
    EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = user_id) AS user_liked,
    EXISTS(SELECT 1 FROM reposts r WHERE r.post_id = p.id AND r.user_id = user_id) AS user_reposted
  FROM posts p
  JOIN users u ON p.author_id = u.id
  WHERE p.author_id IN (
    SELECT followee_id FROM follows WHERE follower_id = user_id
    UNION
    SELECT user_id -- Include user's own posts
  )
  ORDER BY p.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to search users
CREATE OR REPLACE FUNCTION search_users(search_term TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  username VARCHAR(50),
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN,
  follower_count INTEGER,
  following_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.bio,
    u.is_verified,
    u.follower_count,
    u.following_count
  FROM users u
  WHERE 
    u.username ILIKE '%' || search_term || '%' OR
    u.display_name ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE 
      WHEN u.username ILIKE search_term || '%' THEN 1
      WHEN u.display_name ILIKE search_term || '%' THEN 2
      ELSE 3
    END,
    u.follower_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending hashtags
CREATE OR REPLACE FUNCTION get_trending_hashtags(limit_count INTEGER DEFAULT 10, hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
  hashtag TEXT,
  post_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(p.hashtags) as hashtag,
    COUNT(*) as post_count
  FROM posts p
  WHERE p.created_at > NOW() - INTERVAL '1 hour' * hours_back
  GROUP BY unnest(p.hashtags)
  ORDER BY post_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;