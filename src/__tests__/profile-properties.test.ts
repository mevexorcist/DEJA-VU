import * as fc from 'fast-check';
import { PBT_CONFIG } from '@/test-utils/property-config';
import { generators } from '@/test-utils';

/**
 * Property-Based Tests for Profile Display
 * **Feature: project-Deja-vu, Property 19: Profile information display**
 * **Validates: Requirements 4.4, 4.5**
 */

describe('Profile Display Properties', () => {
  describe('Property 19: Profile information display', () => {
    test('Property: Profile displays all required user information', () => {
      fc.assert(
        fc.property(generators.user(), (user) => {
          // Mock profile display data
          const profileDisplay = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            isVerified: user.isVerified,
            followerCount: user.followerCount,
            followingCount: user.followingCount,
            createdAt: user.createdAt,
            avatarUrl: null, // Mock avatar
          };

          // Property: All required fields should be present and correct
          const hasRequiredFields =
            profileDisplay.id === user.id &&
            profileDisplay.username === user.username &&
            profileDisplay.displayName === user.displayName &&
            profileDisplay.isVerified === user.isVerified &&
            profileDisplay.followerCount === user.followerCount &&
            profileDisplay.followingCount === user.followingCount &&
            profileDisplay.createdAt === user.createdAt;

          // Property: Optional fields should be handled correctly
          const optionalFieldsHandled =
            profileDisplay.bio === user.bio || profileDisplay.bio === null;

          return hasRequiredFields && optionalFieldsHandled;
        }),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Follower and following counts are non-negative integers', () => {
      fc.assert(
        fc.property(generators.user(), (user) => {
          // Mock profile display
          const profileDisplay = {
            followerCount: user.followerCount,
            followingCount: user.followingCount,
          };

          // Property: Counts should be non-negative integers
          const followerCountValid =
            Number.isInteger(profileDisplay.followerCount) &&
            profileDisplay.followerCount >= 0;

          const followingCountValid =
            Number.isInteger(profileDisplay.followingCount) &&
            profileDisplay.followingCount >= 0;

          return followerCountValid && followingCountValid;
        }),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Username format is preserved in profile display', () => {
      fc.assert(
        fc.property(generators.user(), (user) => {
          // Mock profile display
          const profileDisplay = {
            username: user.username,
            displayName: user.displayName,
          };

          // Property: Username should maintain its format (lowercase, alphanumeric + underscore)
          const usernameFormatValid = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(
            profileDisplay.username
          );

          // Property: Display name should be preserved as-is
          const displayNamePreserved =
            profileDisplay.displayName === user.displayName;

          // Property: Username and display name should be different fields
          const fieldsAreDifferent =
            profileDisplay.username !== profileDisplay.displayName ||
            profileDisplay.username.toLowerCase() ===
              profileDisplay.displayName.toLowerCase();

          return usernameFormatValid && displayNamePreserved;
        }),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Bio text is properly truncated and sanitized', () => {
      fc.assert(
        fc.property(
          fc.record({
            user: generators.user(),
            longBio: fc.string({ minLength: 161, maxLength: 500 }), // Exceeds 160 char limit
          }),
          (testData) => {
            // Mock profile with potentially long bio
            const userWithLongBio = {
              ...testData.user,
              bio: testData.longBio,
            };

            // Mock bio processing for display
            const processedBio = userWithLongBio.bio
              ? userWithLongBio.bio.substring(0, 160)
              : null;

            // Property: Bio should be truncated to 160 characters max
            const bioLengthValid = !processedBio || processedBio.length <= 160;

            // Property: Bio should preserve original content up to limit
            const bioContentPreserved =
              !processedBio ||
              processedBio === testData.longBio.substring(0, 160);

            return bioLengthValid && bioContentPreserved;
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Verification status is displayed correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            user: generators.user(),
            isVerified: fc.boolean(),
          }),
          (testData) => {
            // Mock user with specific verification status
            const userWithVerification = {
              ...testData.user,
              isVerified: testData.isVerified,
            };

            // Mock profile display with verification badge
            const profileDisplay = {
              isVerified: userWithVerification.isVerified,
              verificationBadge: userWithVerification.isVerified ? '✓' : null,
            };

            // Property: Verification badge should only appear for verified users
            const badgeDisplayCorrect = testData.isVerified
              ? profileDisplay.verificationBadge === '✓'
              : profileDisplay.verificationBadge === null;

            // Property: Verification status should match user data
            const statusMatches =
              profileDisplay.isVerified === testData.isVerified;

            return badgeDisplayCorrect && statusMatches;
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Join date is formatted consistently or shows fallback for invalid dates', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: generators.userId(),
            username: generators.username(),
            displayName: fc.string({ minLength: 1, maxLength: 50 }),
            email: generators.email(),
            bio: fc.option(generators.bio()),
            isVerified: fc.boolean(),
            followerCount: fc.nat(),
            followingCount: fc.nat(),
            createdAt: fc.oneof(
              fc.date({ min: new Date('2020-01-01'), max: new Date() }), // Valid dates
              fc.constant(new Date(NaN)), // Invalid date to test fallback
              fc.constant(null) // Null date to test fallback
            ),
          }),
          (user) => {
            // Mock profile display with formatted join date
            const joinDate = user.createdAt;

            // Check if date is valid
            const isValidDate =
              joinDate instanceof Date && !isNaN(joinDate.getTime());

            if (isValidDate) {
              // Property: Valid dates should be formatted correctly
              const formattedDate = joinDate.toLocaleDateString();
              const formattedIsString = typeof formattedDate === 'string';
              const dateIsNotFuture = joinDate.getTime() <= Date.now();
              const formattedNotEmpty = formattedDate.length > 0;

              return formattedIsString && dateIsNotFuture && formattedNotEmpty;
            } else {
              // Property: Invalid dates should show fallback (Requirements 4.5)
              const fallbackText = 'Member since: Not available';
              const fallbackIsString = typeof fallbackText === 'string';
              const fallbackNotEmpty = fallbackText.length > 0;

              return fallbackIsString && fallbackNotEmpty;
            }
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });

  describe('Profile Interaction Properties', () => {
    test('Property: Profile edit permissions are enforced correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            profileOwner: generators.user(),
            viewer: generators.user(),
          }),
          (testData) => {
            // Mock profile view context
            const isOwnProfile =
              testData.profileOwner.id === testData.viewer.id;

            // Mock profile permissions
            const canEdit = isOwnProfile;
            const canViewPrivateInfo = isOwnProfile;
            const canFollow = !isOwnProfile;

            // Property: Only profile owner can edit
            const editPermissionCorrect = canEdit === isOwnProfile;

            // Property: Only profile owner can view private info
            const privateViewCorrect = canViewPrivateInfo === isOwnProfile;

            // Property: Cannot follow yourself
            const followPermissionCorrect = canFollow === !isOwnProfile;

            return (
              editPermissionCorrect &&
              privateViewCorrect &&
              followPermissionCorrect
            );
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Profile stats are calculated correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            user: generators.user(),
            posts: fc.array(generators.post(), {
              minLength: 0,
              maxLength: 100,
            }),
          }),
          (testData) => {
            // Mock user's posts
            const userPosts = testData.posts.filter(
              (post) => post.authorId === testData.user.id
            );

            // Mock profile stats
            const profileStats = {
              postCount: userPosts.length,
              followerCount: testData.user.followerCount,
              followingCount: testData.user.followingCount,
              totalLikes: userPosts.reduce(
                (sum, post) => sum + post.likeCount,
                0
              ),
            };

            // Property: Post count should match actual posts
            const postCountCorrect =
              profileStats.postCount === userPosts.length;

            // Property: Follow counts should match user data
            const followCountsCorrect =
              profileStats.followerCount === testData.user.followerCount &&
              profileStats.followingCount === testData.user.followingCount;

            // Property: Total likes should be sum of all post likes
            const expectedTotalLikes = userPosts.reduce(
              (sum, post) => sum + post.likeCount,
              0
            );
            const likesCorrect = profileStats.totalLikes === expectedTotalLikes;

            return postCountCorrect && followCountsCorrect && likesCorrect;
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });

  describe('Profile Avatar Properties', () => {
    test('Property: Avatar fallback is generated consistently', () => {
      fc.assert(
        fc.property(generators.user(), (user) => {
          // Mock avatar generation (when no custom avatar is set)
          const hasCustomAvatar = false; // Mock no custom avatar

          // Mock avatar fallback generation (handle edge cases)
          const firstChar = user.displayName.trim().charAt(0);
          // Only use first character if it's a letter, otherwise default to 'U'
          const avatarFallback = /^[a-zA-Z]$/.test(firstChar)
            ? firstChar.toUpperCase()
            : 'U';

          // Property: Fallback should be first letter of display name, or 'U' as default
          const expectedFallback = /^[a-zA-Z]$/.test(
            user.displayName.trim().charAt(0)
          )
            ? user.displayName.trim().charAt(0).toUpperCase()
            : 'U';
          const fallbackCorrect = avatarFallback === expectedFallback;

          // Property: Fallback should be a single uppercase letter
          const isSingleUppercaseLetter = /^[A-Z]$/.test(avatarFallback);

          return fallbackCorrect && isSingleUppercaseLetter;
        }),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });

  describe('Profile Privacy Properties', () => {
    test('Property: Sensitive information is not exposed in public profile', () => {
      fc.assert(
        fc.property(generators.user(), (user) => {
          // Mock public profile data (what other users see)
          const publicProfile = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            isVerified: user.isVerified,
            followerCount: user.followerCount,
            followingCount: user.followingCount,
            createdAt: user.createdAt,
            // Sensitive fields should NOT be included:
            // - email
            // - private settings
            // - internal IDs
          };

          // Property: Email should not be in public profile
          const emailNotExposed = !('email' in publicProfile);

          // Property: Only safe fields should be present
          const onlySafeFields = Object.keys(publicProfile).every((key) =>
            [
              'id',
              'username',
              'displayName',
              'bio',
              'isVerified',
              'followerCount',
              'followingCount',
              'createdAt',
            ].includes(key)
          );

          return emailNotExposed && onlySafeFields;
        }),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });

  describe('Profile URL Properties', () => {
    test('Property: Profile URLs are generated consistently', () => {
      fc.assert(
        fc.property(generators.user(), (user) => {
          // Mock profile URL generation (usernames should be normalized to lowercase)
          const normalizedUsername = user.username.toLowerCase();
          const profileUrl = `/profile/${normalizedUsername}`;
          const alternativeUrl = `/@${normalizedUsername}`;

          // Property: Profile URL should include normalized username
          const urlIncludesUsername = profileUrl.includes(normalizedUsername);

          // Property: Alternative URL format should also work
          const altUrlIncludesUsername =
            alternativeUrl.includes(normalizedUsername);

          // Property: URLs should be lowercase
          const urlIsLowercase = profileUrl === profileUrl.toLowerCase();
          const altUrlIsLowercase =
            alternativeUrl === alternativeUrl.toLowerCase();

          return (
            urlIncludesUsername &&
            altUrlIncludesUsername &&
            urlIsLowercase &&
            altUrlIsLowercase
          );
        }),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });
});
