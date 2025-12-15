import { mockFactories } from '@/test-utils';
import { validators } from '@/test-utils/property-config';

describe('Mock Factories', () => {
  describe('createMockUser', () => {
    test('creates valid user with default values', () => {
      const user = mockFactories.createMockUser();

      expect(user.id).toBe('user-123');
      expect(user.username).toBe('testuser');
      expect(user.displayName).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.bio).toBe('Test bio');
      expect(user.isVerified).toBe(false);
      expect(user.followerCount).toBe(0);
      expect(user.followingCount).toBe(0);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    test('allows overriding default values', () => {
      const overrides = {
        username: 'customuser',
        isVerified: true,
        followerCount: 100,
      };

      const user = mockFactories.createMockUser(overrides);

      expect(user.username).toBe('customuser');
      expect(user.isVerified).toBe(true);
      expect(user.followerCount).toBe(100);
      // Other values should remain default
      expect(user.id).toBe('user-123');
      expect(user.displayName).toBe('Test User');
    });

    test('creates user with valid username', () => {
      const user = mockFactories.createMockUser();
      expect(validators.isValidUsername(user.username)).toBe(true);
    });

    test('creates user with valid email', () => {
      const user = mockFactories.createMockUser();
      expect(validators.isValidEmail(user.email)).toBe(true);
    });
  });

  describe('createMockPost', () => {
    test('creates valid post with default values', () => {
      const post = mockFactories.createMockPost();

      expect(post.id).toBe('post-123');
      expect(post.authorId).toBe('user-123');
      expect(post.content).toBe('Test post content');
      expect(post.hashtags).toEqual(['test']);
      expect(post.mentions).toEqual([]);
      expect(post.likeCount).toBe(0);
      expect(post.repostCount).toBe(0);
      expect(post.replyCount).toBe(0);
      expect(post.isThread).toBe(false);
      expect(post.createdAt).toBeInstanceOf(Date);
    });

    test('allows overriding default values', () => {
      const overrides = {
        content: 'Custom post content',
        likeCount: 50,
        hashtags: ['crypto', 'defi'],
      };

      const post = mockFactories.createMockPost(overrides);

      expect(post.content).toBe('Custom post content');
      expect(post.likeCount).toBe(50);
      expect(post.hashtags).toEqual(['crypto', 'defi']);
      // Other values should remain default
      expect(post.id).toBe('post-123');
      expect(post.authorId).toBe('user-123');
    });

    test('creates post with valid content', () => {
      const post = mockFactories.createMockPost();
      expect(validators.isValidPostContent(post.content)).toBe(true);
    });
  });

  describe('createMockAirdrop', () => {
    test('creates valid airdrop with default values', () => {
      const airdrop = mockFactories.createMockAirdrop();

      expect(airdrop.id).toBe('airdrop-123');
      expect(airdrop.title).toBe('Test Airdrop');
      expect(airdrop.projectName).toBe('Test Project');
      expect(airdrop.blockchain).toBe('ethereum');
      expect(airdrop.status).toBe('active');
      expect(airdrop.startDate).toBeInstanceOf(Date);
      expect(airdrop.endDate).toBeInstanceOf(Date);
    });

    test('allows overriding default values', () => {
      const overrides = {
        title: 'Custom Airdrop',
        blockchain: 'solana',
        status: 'upcoming' as const,
      };

      const airdrop = mockFactories.createMockAirdrop(overrides);

      expect(airdrop.title).toBe('Custom Airdrop');
      expect(airdrop.blockchain).toBe('solana');
      expect(airdrop.status).toBe('upcoming');
      // Other values should remain default
      expect(airdrop.id).toBe('airdrop-123');
      expect(airdrop.projectName).toBe('Test Project');
    });

    test('creates airdrop with valid status', () => {
      const airdrop = mockFactories.createMockAirdrop();
      expect(validators.isValidAirdropStatus(airdrop.status)).toBe(true);
    });

    test('end date is after start date', () => {
      const airdrop = mockFactories.createMockAirdrop();
      expect(airdrop.endDate.getTime()).toBeGreaterThan(
        airdrop.startDate.getTime()
      );
    });
  });
});
