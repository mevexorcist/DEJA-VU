import * as fc from 'fast-check';
import {
  createPropertyTest,
  PBT_CONFIG,
  validators,
} from '@/test-utils/property-config';
import { generators, testProperty } from '@/test-utils';

describe('Property-Based Testing Framework', () => {
  describe('Configuration', () => {
    test('PBT_CONFIG has correct minimum iterations', () => {
      expect(PBT_CONFIG.numRuns).toBeGreaterThanOrEqual(100);
    });

    test('PBT_CONFIG has reasonable timeout', () => {
      expect(PBT_CONFIG.timeout).toBeGreaterThan(0);
    });
  });

  describe('Validators', () => {
    test('Property: Username validation', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-zA-Z0-9_]{3,20}$/),
          (validUsername) => {
            return validators.isValidUsername(validUsername);
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Email validation', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (validEmail) => {
          return validators.isValidEmail(validEmail);
        }),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Hashtag validation', () => {
      fc.assert(
        fc.property(fc.stringMatching(/^[a-zA-Z0-9_]+$/), (validHashtag) => {
          return validators.isValidHashtag(validHashtag);
        }),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Wallet address validation', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^0x[a-fA-F0-9]{40}$/),
          (validAddress) => {
            return validators.isValidWalletAddress(validAddress);
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Post content validation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 280 }),
          (validContent) => {
            return validators.isValidPostContent(validContent);
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Airdrop status validation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('active', 'ended', 'upcoming'),
          (validStatus) => {
            return validators.isValidAirdropStatus(validStatus);
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Theme validation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark', 'system'),
          (validTheme) => {
            return validators.isValidTheme(validTheme);
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });

  describe('Generators', () => {
    test('Property: User generator produces valid users', () => {
      fc.assert(
        fc.property(generators.user(), (user) => {
          return (
            typeof user.id === 'string' &&
            validators.isValidUsername(user.username) &&
            validators.isValidEmail(user.email) &&
            typeof user.displayName === 'string' &&
            typeof user.isVerified === 'boolean' &&
            typeof user.followerCount === 'number' &&
            typeof user.followingCount === 'number' &&
            user.followerCount >= 0 &&
            user.followingCount >= 0
          );
        }),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Post generator produces valid posts', () => {
      fc.assert(
        fc.property(generators.post(), (post) => {
          return (
            typeof post.id === 'string' &&
            typeof post.authorId === 'string' &&
            validators.isValidPostContent(post.content) &&
            Array.isArray(post.hashtags) &&
            Array.isArray(post.mentions) &&
            typeof post.likeCount === 'number' &&
            typeof post.repostCount === 'number' &&
            typeof post.replyCount === 'number' &&
            typeof post.isThread === 'boolean' &&
            post.likeCount >= 0 &&
            post.repostCount >= 0 &&
            post.replyCount >= 0
          );
        }),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Airdrop generator produces valid airdrops', () => {
      fc.assert(
        fc.property(generators.airdrop(), (airdrop) => {
          return (
            typeof airdrop.id === 'string' &&
            typeof airdrop.title === 'string' &&
            typeof airdrop.projectName === 'string' &&
            validators.isValidAirdropStatus(airdrop.status) &&
            airdrop.title.length >= 5 &&
            airdrop.projectName.length >= 2 &&
            airdrop.startDate instanceof Date &&
            airdrop.endDate instanceof Date
          );
        }),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });

  describe('createPropertyTest helper', () => {
    createPropertyTest(
      'Property: createPropertyTest works correctly',
      fc.property(fc.integer(), (n) => n === n),
      { numRuns: 50 } // Override default for this test
    );
  });

  describe('testProperty helper', () => {
    testProperty(
      'Property: testProperty helper works',
      fc.property(fc.string(), (str) => typeof str === 'string'),
      { numRuns: 50 }
    );
  });
});
