'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PostService, NotificationService } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

interface PostCreatorProps {
  onPostCreated?: (post: Database['public']['Tables']['posts']['Row']) => void;
  placeholder?: string;
  maxLength?: number;
  threadId?: string;
  parentPostId?: string;
}

export default function PostCreator({
  onPostCreated,
  placeholder = "What's happening?",
  maxLength = 280,
  threadId,
  parentPostId,
}: PostCreatorProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract hashtags from content
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w\u00c0-\u024f\u1e00-\u1eff]+/gi;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map((tag) => tag.toLowerCase().slice(1)) : [];
  };

  // Extract mentions from content
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@[\w\u00c0-\u024f\u1e00-\u1eff]+/gi;
    const matches = text.match(mentionRegex);
    return matches
      ? matches.map((mention) => mention.toLowerCase().slice(1))
      : [];
  };

  // Check if content exceeds limit and needs threading
  const needsThreading = (text: string): boolean => {
    return text.length > maxLength;
  };

  // Split content into thread parts
  const splitIntoThreads = (text: string): string[] => {
    if (text.length <= maxLength) return [text];

    const parts: string[] = [];
    let remaining = text;
    let partNumber = 1;

    while (remaining.length > 0) {
      let cutPoint = maxLength;

      // Try to cut at a natural break point (space, punctuation)
      if (remaining.length > maxLength) {
        const lastSpace = remaining.lastIndexOf(' ', maxLength);
        const lastPunctuation = Math.max(
          remaining.lastIndexOf('.', maxLength),
          remaining.lastIndexOf('!', maxLength),
          remaining.lastIndexOf('?', maxLength),
          remaining.lastIndexOf('\n', maxLength)
        );

        cutPoint = Math.max(lastSpace, lastPunctuation);
        if (cutPoint <= maxLength * 0.5) {
          cutPoint = maxLength; // Force cut if no good break point
        }
      } else {
        cutPoint = remaining.length;
      }

      let part = remaining.slice(0, cutPoint).trim();

      // Add thread numbering for multi-part posts
      if (needsThreading(text)) {
        const totalParts = Math.ceil(text.length / maxLength);
        part = `${part} (${partNumber}/${totalParts})`;
      }

      parts.push(part);
      remaining = remaining.slice(cutPoint).trim();
      partNumber++;
    }

    return parts;
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit

      return (isImage || isVideo) && isValidSize;
    });

    setMediaFiles((prev) => [...prev, ...validFiles].slice(0, 4)); // Max 4 files
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (files: File[]): Promise<string[]> => {
    // This would integrate with your media storage service (Supabase Storage, etc.)
    // For now, return mock URLs
    return files.map(
      (file, index) => `https://example.com/media/${Date.now()}_${index}`
    );
  };

  const createNotificationsForMentions = async (
    mentions: string[],
    postId: string
  ) => {
    if (!user?.profile || mentions.length === 0) return;

    try {
      // Get user IDs for mentioned usernames
      const mentionPromises = mentions.map(async (username) => {
        try {
          const { data: mentionedUser } = await supabase
            .from('users')
            .select('id, username')
            .eq('username', username)
            .single();

          if (mentionedUser && mentionedUser.id !== user.id) {
            await NotificationService.createNotification({
              user_id: mentionedUser.id,
              type: 'mention',
              title: 'New mention',
              message: `@${user.profile?.username} mentioned you in a post`,
              data: {
                post_id: postId,
                mentioned_by: user.id,
                mentioned_by_username: user.profile?.username,
              },
            });
          }
        } catch (error) {
          console.error(`Failed to notify user ${username}:`, error);
        }
      });

      await Promise.allSettled(mentionPromises);
    } catch (error) {
      console.error('Failed to create mention notifications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || isPosting) return;

    setIsPosting(true);
    setError(null);

    try {
      const hashtags = extractHashtags(content);
      const mentions = extractMentions(content);
      const mediaUrls =
        mediaFiles.length > 0 ? await uploadMedia(mediaFiles) : null;

      // Check if we need to create a thread
      const isThread = needsThreading(content);
      const threadParts = splitIntoThreads(content);

      const createdPosts: Database['public']['Tables']['posts']['Row'][] = [];
      let currentThreadId = threadId;

      // Create posts (either single post or thread)
      for (let i = 0; i < threadParts.length; i++) {
        const isFirstPost = i === 0;
        const partHashtags = isFirstPost
          ? hashtags
          : extractHashtags(threadParts[i]);
        const partMentions = isFirstPost
          ? mentions
          : extractMentions(threadParts[i]);

        const postData: Database['public']['Tables']['posts']['Insert'] = {
          author_id: user.id,
          content: threadParts[i],
          hashtags: partHashtags,
          mentions: partMentions,
          media_urls: isFirstPost ? mediaUrls : null, // Only first post gets media
          is_thread: isThread,
          thread_id: currentThreadId,
          parent_post_id: parentPostId,
        };

        const createdPost = await PostService.createPost(postData);
        createdPosts.push(createdPost);

        // Set thread_id for subsequent posts
        if (isFirstPost && isThread) {
          currentThreadId = createdPost.id;
          // Update the first post to reference itself as thread_id
          await PostService.updatePost(createdPost.id, {
            thread_id: createdPost.id,
          });
        }

        // Create notifications for mentions in each part
        await createNotificationsForMentions(partMentions, createdPost.id);
      }

      // Reset form
      setContent('');
      setMediaFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onPostCreated) {
        createdPosts.forEach((post) => onPostCreated(post));
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const remainingChars = maxLength - content.length;
  const isOverLimit = remainingChars < 0;
  const willCreateThread = needsThreading(content);

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please log in to create posts.
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-3">
          <img
            src={
              user.profile?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile?.display_name || 'User')}&background=random`
            }
            alt={user.profile?.display_name || 'User'}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full p-3 text-lg border-none resize-none focus:outline-none bg-transparent placeholder-gray-500"
              rows={3}
              disabled={isPosting}
            />

            {/* Media preview */}
            {mediaFiles.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-opacity-70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPosting || mediaFiles.length >= 4}
              className="text-blue-500 hover:text-blue-600 disabled:text-gray-400"
            >
              📷 Media
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {willCreateThread && (
              <span className="text-sm text-blue-500">
                Will create thread ({Math.ceil(content.length / maxLength)}{' '}
                parts)
              </span>
            )}
            <span
              className={`text-sm ${isOverLimit ? 'text-red-500' : remainingChars < 20 ? 'text-yellow-500' : 'text-gray-500'}`}
            >
              {remainingChars}
            </span>
            <button
              type="submit"
              disabled={!content.trim() || isPosting}
              className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
