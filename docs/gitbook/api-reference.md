# API Reference

## Overview

DEJA-VU menggunakan Supabase sebagai backend, yang menyediakan REST API dan Realtime subscriptions.

## Authentication

### Sign Up

```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current User

```typescript
const { data: { user } } = await supabase.auth.getUser();
```

## Users

### Get User Profile

```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

### Update Profile

```typescript
const { data, error } = await supabase
  .from('users')
  .update({
    display_name: 'New Name',
    bio: 'Updated bio',
  })
  .eq('id', userId);
```

### Search Users

```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .ilike('username', `%${searchTerm}%`)
  .limit(10);
```

## Posts

### Create Post

```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({
    user_id: userId,
    content: 'Hello World!',
  })
  .select()
  .single();
```

### Get Feed

```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    user:users(id, username, display_name, avatar_url)
  `)
  .order('created_at', { ascending: false })
  .limit(20);
```

### Like Post

```typescript
const { data, error } = await supabase
  .from('post_likes')
  .insert({
    post_id: postId,
    user_id: userId,
  });

// Update likes count
await supabase.rpc('increment_likes', { post_id: postId });
```

### Delete Post

```typescript
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
  .eq('user_id', userId); // Ensure user owns the post
```

## Direct Messages

### Send Message

```typescript
const { data, error } = await supabase
  .from('direct_messages')
  .insert({
    sender_id: senderId,
    recipient_id: recipientId,
    content: 'Hello!',
  })
  .select()
  .single();
```

### Get Conversations

```typescript
const { data, error } = await supabase
  .from('direct_messages')
  .select(`
    *,
    sender:users!sender_id(id, username, avatar_url),
    recipient:users!recipient_id(id, username, avatar_url)
  `)
  .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
  .order('created_at', { ascending: false });
```

### Mark as Read

```typescript
const { error } = await supabase
  .from('direct_messages')
  .update({ read: true })
  .eq('id', messageId)
  .eq('recipient_id', userId);
```

## Airdrops

### Get Airdrops

```typescript
const { data, error } = await supabase
  .from('airdrops')
  .select('*')
  .eq('status', 'active')
  .order('deadline', { ascending: true });
```

### Get Airdrop Details

```typescript
const { data, error } = await supabase
  .from('airdrops')
  .select(`
    *,
    tasks:airdrop_tasks(*)
  `)
  .eq('id', airdropId)
  .single();
```

## Realtime Subscriptions

### Subscribe to New Posts

```typescript
const channel = supabase
  .channel('posts')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'posts',
    },
    (payload) => {
      console.log('New post:', payload.new);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

### Subscribe to Messages

```typescript
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'direct_messages',
      filter: `recipient_id=eq.${userId}`,
    },
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();
```

## Error Handling

```typescript
try {
  const { data, error } = await supabase
    .from('posts')
    .select('*');

  if (error) {
    throw error;
  }

  return data;
} catch (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
}
```

## Rate Limits

- **Anonymous**: 100 requests/minute
- **Authenticated**: 1000 requests/minute
- **Realtime**: 100 concurrent connections

## Response Format

All API responses follow this format:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: {
    message: string;
    code: string;
  } | null;
}
```
