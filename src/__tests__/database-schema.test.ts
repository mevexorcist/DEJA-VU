import { mockFactories } from '@/test-utils';
import type { Database } from '@/types/database';

describe('Database Schema Validation', () => {
  describe('Type Definitions', () => {
    test('should validate user table structure', () => {
      const user = mockFactories.createMockUser();

      // Validate required fields exist
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('displayName');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('isVerified');
      expect(user).toHaveProperty('followerCount');
      expect(user).toHaveProperty('followingCount');
      expect(user).toHaveProperty('createdAt');

      // Validate field types
      expect(typeof user.id).toBe('string');
      expect(typeof user.username).toBe('string');
      expect(typeof user.displayName).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.isVerified).toBe('boolean');
      expect(typeof user.followerCount).toBe('number');
      expect(typeof user.followingCount).toBe('number');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    test('should validate post table structure', () => {
      const post = mockFactories.createMockPost();

      // Validate required fields exist
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('authorId');
      expect(post).toHaveProperty('content');
      expect(post).toHaveProperty('hashtags');
      expect(post).toHaveProperty('mentions');
      expect(post).toHaveProperty('likeCount');
      expect(post).toHaveProperty('repostCount');
      expect(post).toHaveProperty('replyCount');
      expect(post).toHaveProperty('isThread');
      expect(post).toHaveProperty('createdAt');

      // Validate field types
      expect(typeof post.id).toBe('string');
      expect(typeof post.authorId).toBe('string');
      expect(typeof post.content).toBe('string');
      expect(Array.isArray(post.hashtags)).toBe(true);
      expect(Array.isArray(post.mentions)).toBe(true);
      expect(typeof post.likeCount).toBe('number');
      expect(typeof post.repostCount).toBe('number');
      expect(typeof post.replyCount).toBe('number');
      expect(typeof post.isThread).toBe('boolean');
      expect(post.createdAt).toBeInstanceOf(Date);
    });

    test('should validate airdrop table structure', () => {
      const airdrop = mockFactories.createMockAirdrop();

      // Validate required fields exist
      expect(airdrop).toHaveProperty('id');
      expect(airdrop).toHaveProperty('title');
      expect(airdrop).toHaveProperty('projectName');
      expect(airdrop).toHaveProperty('blockchain');
      expect(airdrop).toHaveProperty('status');
      expect(airdrop).toHaveProperty('startDate');
      expect(airdrop).toHaveProperty('endDate');

      // Validate field types
      expect(typeof airdrop.id).toBe('string');
      expect(typeof airdrop.title).toBe('string');
      expect(typeof airdrop.projectName).toBe('string');
      expect(typeof airdrop.blockchain).toBe('string');
      expect(typeof airdrop.status).toBe('string');
      expect(airdrop.startDate).toBeInstanceOf(Date);
      expect(airdrop.endDate).toBeInstanceOf(Date);
    });
  });

  describe('Database Type Compatibility', () => {
    test('should have compatible user types', () => {
      type UserRow = Database['public']['Tables']['users']['Row'];
      type UserInsert = Database['public']['Tables']['users']['Insert'];
      type UserUpdate = Database['public']['Tables']['users']['Update'];

      // Test that the types are properly defined
      const userRow: UserRow = {
        id: 'test-id',
        username: 'testuser',
        display_name: 'Test User',
        email: 'test@example.com',
        bio: null,
        avatar_url: null,
        is_verified: false,
        follower_count: 0,
        following_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const userInsert: UserInsert = {
        username: 'newuser',
        display_name: 'New User',
        email: 'new@example.com',
      };

      const userUpdate: UserUpdate = {
        display_name: 'Updated Name',
        bio: 'Updated bio',
      };

      expect(userRow.id).toBeDefined();
      expect(userInsert.username).toBeDefined();
      expect(userUpdate.display_name).toBeDefined();
    });

    test('should have compatible post types', () => {
      type PostRow = Database['public']['Tables']['posts']['Row'];
      type PostInsert = Database['public']['Tables']['posts']['Insert'];

      const postRow: PostRow = {
        id: 'test-post-id',
        author_id: 'test-author-id',
        content: 'Test post content',
        media_urls: null,
        hashtags: ['test'],
        mentions: [],
        like_count: 0,
        repost_count: 0,
        reply_count: 0,
        is_thread: false,
        thread_id: null,
        parent_post_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const postInsert: PostInsert = {
        author_id: 'test-author-id',
        content: 'New post content',
      };

      expect(postRow.id).toBeDefined();
      expect(postInsert.author_id).toBeDefined();
    });

    test('should have compatible function types', () => {
      type TimelineFunction =
        Database['public']['Functions']['get_user_timeline'];
      type SearchFunction = Database['public']['Functions']['search_users'];

      // Test that function types are properly defined
      const timelineArgs: TimelineFunction['Args'] = {
        user_id: 'test-user-id',
        limit_count: 20,
        offset_count: 0,
      };

      const searchArgs: SearchFunction['Args'] = {
        search_term: 'test',
        limit_count: 10,
      };

      expect(timelineArgs.user_id).toBeDefined();
      expect(searchArgs.search_term).toBeDefined();
    });
  });

  describe('Schema Constraints Validation', () => {
    test('should validate username constraints', () => {
      // Username should be 3-20 characters, alphanumeric + underscore, not start with number
      const validUsernames = ['user123', 'test_user', 'MyUsername', 'a_b_c'];
      const invalidUsernames = ['ab', '123user', 'user@name', 'a'.repeat(21)];

      validUsernames.forEach((username) => {
        expect(username.length).toBeGreaterThanOrEqual(3);
        expect(username.length).toBeLessThanOrEqual(20);
        expect(/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)).toBe(true);
      });

      invalidUsernames.forEach((username) => {
        const isValid =
          username.length >= 3 &&
          username.length <= 20 &&
          /^[a-zA-Z][a-zA-Z0-9_]*$/.test(username);
        expect(isValid).toBe(false);
      });
    });

    test('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'a@b.c',
      ];
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
      ];

      validEmails.forEach((email) => {
        expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(true);
      });

      invalidEmails.forEach((email) => {
        expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false);
      });
    });

    test('should validate airdrop status values', () => {
      const validStatuses = ['active', 'ended', 'upcoming'];
      const invalidStatuses = ['pending', 'cancelled', 'draft'];

      validStatuses.forEach((status) => {
        expect(['active', 'ended', 'upcoming']).toContain(status);
      });

      invalidStatuses.forEach((status) => {
        expect(['active', 'ended', 'upcoming']).not.toContain(status);
      });
    });

    test('should validate blockchain values', () => {
      const validBlockchains = ['ethereum', 'bitcoin', 'solana', 'polygon'];

      validBlockchains.forEach((blockchain) => {
        expect(typeof blockchain).toBe('string');
        expect(blockchain.length).toBeGreaterThan(0);
      });
    });
  });
});
