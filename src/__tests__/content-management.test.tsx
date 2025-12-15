/**
 * Unit tests for content management system components
 * Tests the core functionality of post creation, timeline, hashtags, mentions, and threads
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  PostCreator,
  Post,
  Timeline,
  HashtagFeed,
  TrendingHashtags,
} from '@/components/posts';
import { AuthProvider } from '@/contexts/AuthContext';
import { mockFactories } from '@/test-utils';

// Mock the realtime hooks
jest.mock('@/hooks/useRealtime', () => ({
  useRealtimeTimeline: jest.fn(() => ({
    isConnected: true,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
  useRealtimeSocialInteractions: jest.fn(() => ({
    interactions: { like_count: 0, repost_count: 0, reply_count: 0 },
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
  useRealtimeNotifications: jest.fn(() => ({
    notifications: [],
    unreadCount: 0,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
}));

// Mock the database services
jest.mock('@/lib/database', () => ({
  PostService: {
    createPost: jest.fn(),
    getPost: jest.fn(),
    getUserTimeline: jest.fn(),
    searchPostsByHashtag: jest.fn(),
    getTrendingHashtags: jest.fn(),
    deletePost: jest.fn(),
  },
  NotificationService: {
    createNotification: jest.fn(),
  },
  InteractionService: {
    likePost: jest.fn(),
    unlikePost: jest.fn(),
    repost: jest.fn(),
    unrepost: jest.fn(),
  },
}));

// Mock the auth context
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  profile: {
    id: 'user-123',
    username: 'testuser',
    display_name: 'Test User',
    email: 'test@example.com',
    bio: 'Test bio',
    avatar_url: null,
    is_verified: false,
    follower_count: 0,
    following_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    profile: mockUser.profile,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

describe('Content Management System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PostCreator Component', () => {
    test('renders post creation form', () => {
      render(<PostCreator />);

      expect(
        screen.getByPlaceholderText("What's happening?")
      ).toBeInTheDocument();
      expect(screen.getByText('Post')).toBeInTheDocument();
      expect(screen.getByText('📷 Media')).toBeInTheDocument();
    });

    test('shows character count', () => {
      render(<PostCreator />);

      const textarea = screen.getByPlaceholderText("What's happening?");
      fireEvent.change(textarea, { target: { value: 'Hello world' } });

      expect(screen.getByText('269')).toBeInTheDocument(); // 280 - 11 chars
    });

    test('disables post button when content is empty', () => {
      render(<PostCreator />);

      const postButton = screen.getByText('Post');
      expect(postButton).toBeDisabled();
    });

    test('enables post button when content is provided', () => {
      render(<PostCreator />);

      const textarea = screen.getByPlaceholderText("What's happening?");
      const postButton = screen.getByText('Post');

      fireEvent.change(textarea, { target: { value: 'Hello world' } });
      expect(postButton).not.toBeDisabled();
    });

    test('shows thread indicator for long content', () => {
      render(<PostCreator />);

      const textarea = screen.getByPlaceholderText("What's happening?");
      const longContent = 'A'.repeat(300);

      fireEvent.change(textarea, { target: { value: longContent } });
      expect(screen.getByText(/Will create thread/)).toBeInTheDocument();
    });
  });

  describe('Post Component', () => {
    const mockPost = {
      id: 'post-123',
      author_id: 'user-123',
      content: 'Test post content #hashtag @mention',
      media_urls: null,
      hashtags: ['hashtag'],
      mentions: ['mention'],
      like_count: 5,
      repost_count: 2,
      reply_count: 1,
      is_thread: false,
      thread_id: null,
      parent_post_id: null,
      created_at: new Date().toISOString(),
      author: {
        id: 'user-123',
        username: 'testuser',
        display_name: 'Test User',
        avatar_url: null,
        is_verified: false,
      },
      user_liked: false,
      user_reposted: false,
    };

    test('renders post content', () => {
      render(<Post post={mockPost} />);

      expect(screen.getByText(/Test post content/)).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
    });

    test('renders interaction buttons', () => {
      render(<Post post={mockPost} />);

      expect(screen.getByText('1')).toBeInTheDocument(); // reply count
      expect(screen.getByText('2')).toBeInTheDocument(); // repost count
      expect(screen.getByText('5')).toBeInTheDocument(); // like count
    });

    test('shows thread indicator for thread posts', () => {
      const threadPost = {
        ...mockPost,
        is_thread: true,
        thread_id: 'thread-123',
      };
      render(<Post post={threadPost} />);

      expect(screen.getByText('🧵 Thread')).toBeInTheDocument();
    });

    test('shows delete button for own posts', () => {
      render(<Post post={mockPost} />);

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  describe('Timeline Component', () => {
    test('renders timeline header', () => {
      render(<Timeline />);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('🔄 Refresh')).toBeInTheDocument();
    });

    test('shows post creator by default', () => {
      render(<Timeline />);

      expect(
        screen.getByPlaceholderText("What's happening?")
      ).toBeInTheDocument();
    });

    test('hides post creator for user timeline', () => {
      render(<Timeline userId="user-123" />);

      expect(
        screen.queryByPlaceholderText("What's happening?")
      ).not.toBeInTheDocument();
      expect(screen.getByText('Posts')).toBeInTheDocument();
    });
  });

  describe('HashtagFeed Component', () => {
    test('renders hashtag feed header', () => {
      render(<HashtagFeed hashtag="test" />);

      expect(screen.getByText('#test')).toBeInTheDocument();
      expect(screen.getByText('Posts tagged with #test')).toBeInTheDocument();
    });
  });

  describe('TrendingHashtags Component', () => {
    test('renders trending hashtags header', () => {
      render(<TrendingHashtags />);

      expect(screen.getByText('Trending Hashtags')).toBeInTheDocument();
    });
  });

  describe('Content Processing Functions', () => {
    test('extracts hashtags correctly', () => {
      const extractHashtags = (text: string): string[] => {
        const hashtagRegex = /#[\w\u00c0-\u024f\u1e00-\u1eff]+/gi;
        const matches = text.match(hashtagRegex);
        return matches ? matches.map((tag) => tag.toLowerCase().slice(1)) : [];
      };

      expect(extractHashtags('Hello #world #test')).toEqual(['world', 'test']);
      expect(extractHashtags('No hashtags here')).toEqual([]);
      expect(extractHashtags('#single')).toEqual(['single']);
      expect(extractHashtags('#UPPERCASE #lowercase')).toEqual([
        'uppercase',
        'lowercase',
      ]);
    });

    test('extracts mentions correctly', () => {
      const extractMentions = (text: string): string[] => {
        const mentionRegex = /@[\w\u00c0-\u024f\u1e00-\u1eff]+/gi;
        const matches = text.match(mentionRegex);
        return matches
          ? matches.map((mention) => mention.toLowerCase().slice(1))
          : [];
      };

      expect(extractMentions('Hello @user1 @user2')).toEqual([
        'user1',
        'user2',
      ]);
      expect(extractMentions('No mentions here')).toEqual([]);
      expect(extractMentions('@single')).toEqual(['single']);
      expect(extractMentions('@UPPERCASE @lowercase')).toEqual([
        'uppercase',
        'lowercase',
      ]);
    });

    test('splits long content into threads', () => {
      const splitIntoThreads = (
        text: string,
        maxLength: number = 280
      ): string[] => {
        if (text.length <= maxLength) return [text];

        const parts: string[] = [];
        let remaining = text;
        let partNumber = 1;

        while (remaining.length > 0) {
          let cutPoint = maxLength;

          if (remaining.length > maxLength) {
            const lastSpace = remaining.lastIndexOf(' ', maxLength);
            if (lastSpace > maxLength * 0.5) {
              cutPoint = lastSpace;
            }
          } else {
            cutPoint = remaining.length;
          }

          let part = remaining.slice(0, cutPoint).trim();

          if (text.length > maxLength) {
            const totalParts = Math.ceil(text.length / maxLength);
            part = `${part} (${partNumber}/${totalParts})`;
          }

          parts.push(part);
          remaining = remaining.slice(cutPoint).trim();
          partNumber++;
        }

        return parts;
      };

      const shortText = 'Short text';
      expect(splitIntoThreads(shortText)).toEqual([shortText]);

      const longText = 'A'.repeat(500);
      const parts = splitIntoThreads(longText);
      expect(parts.length).toBeGreaterThan(1);
      parts.forEach((part) => {
        expect(part.length).toBeLessThanOrEqual(300); // Including thread numbering
      });
    });

    test('validates media file constraints', () => {
      const validateMediaFiles = (files: File[]): boolean => {
        if (files.length > 4) return false; // Max 4 files

        return files.every((file) => {
          const isValidType =
            file.type.startsWith('image/') || file.type.startsWith('video/');
          const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
          return isValidType && isValidSize;
        });
      };

      // Mock files
      const validImageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const validVideoFile = new File([''], 'test.mp4', { type: 'video/mp4' });
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      expect(validateMediaFiles([validImageFile, validVideoFile])).toBe(true);
      expect(
        validateMediaFiles([validImageFile, validVideoFile, invalidFile])
      ).toBe(false);
      expect(validateMediaFiles([largeFile])).toBe(false);
      expect(
        validateMediaFiles([
          validImageFile,
          validImageFile,
          validImageFile,
          validImageFile,
          validImageFile,
        ])
      ).toBe(false);
    });
  });
});
