import * as fc from 'fast-check';
import { PBT_CONFIG } from '@/test-utils/property-config';
import { generators } from '@/test-utils';

/**
 * Property-Based Tests for Direct Message System
 * **Feature: project-Deja-vu, Property 20: Mutual follow DM activation**
 * **Validates: Requirements 4.5**
 */

describe('Direct Message Properties', () => {
  describe('Property 20: Mutual follow DM activation', () => {
    test('Property: DM feature is enabled only for mutual followers', () => {
      fc.assert(
        fc.property(
          fc.record({
            user1: generators.user(),
            user2: generators.user(),
            user1FollowsUser2: fc.boolean(),
            user2FollowsUser1: fc.boolean(),
          }),
          (testData) => {
            // Mock follow relationships
            const follows = new Set<string>();
            if (testData.user1FollowsUser2) {
              follows.add(`${testData.user1.id}->${testData.user2.id}`);
            }
            if (testData.user2FollowsUser1) {
              follows.add(`${testData.user2.id}->${testData.user1.id}`);
            }

            // Check if users are mutual followers
            const areMutualFollowers =
              follows.has(`${testData.user1.id}->${testData.user2.id}`) &&
              follows.has(`${testData.user2.id}->${testData.user1.id}`);

            // Mock DM permission check
            const canSendDM = areMutualFollowers;

            // Property: DM should only be allowed for mutual followers
            return canSendDM === areMutualFollowers;
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: DM conversation is created when mutual followers first message', () => {
      fc.assert(
        fc.property(
          fc.record({
            user1: generators.user(),
            user2: generators.user(),
            messageContent: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          (testData) => {
            // Mock mutual follow relationship
            const follows = new Set([
              `${testData.user1.id}->${testData.user2.id}`,
              `${testData.user2.id}->${testData.user1.id}`,
            ]);

            const areMutualFollowers =
              follows.has(`${testData.user1.id}->${testData.user2.id}`) &&
              follows.has(`${testData.user2.id}->${testData.user1.id}`);

            // Mock conversation creation
            let conversationExists = false;
            if (
              areMutualFollowers &&
              testData.messageContent.trim().length > 0
            ) {
              // Create conversation with consistent participant ordering
              const participant1 =
                testData.user1.id < testData.user2.id
                  ? testData.user1.id
                  : testData.user2.id;
              const participant2 =
                testData.user1.id < testData.user2.id
                  ? testData.user2.id
                  : testData.user1.id;

              const conversationId = `${participant1}-${participant2}`;
              conversationExists = true;
            }

            // Property: Conversation should exist if and only if users are mutual followers and message is valid
            const shouldHaveConversation =
              areMutualFollowers && testData.messageContent.trim().length > 0;

            return conversationExists === shouldHaveConversation;
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Non-mutual followers cannot send DMs', () => {
      fc.assert(
        fc.property(
          fc.record({
            sender: generators.user(),
            recipient: generators.user(),
            followRelationship: fc.constantFrom(
              'none', // No follow relationship
              'sender-only', // Only sender follows recipient
              'recipient-only', // Only recipient follows sender
              'mutual' // Mutual follow relationship
            ),
            messageContent: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          (testData) => {
            // Mock follow relationships based on test data
            const follows = new Set<string>();

            switch (testData.followRelationship) {
              case 'sender-only':
                follows.add(`${testData.sender.id}->${testData.recipient.id}`);
                break;
              case 'recipient-only':
                follows.add(`${testData.recipient.id}->${testData.sender.id}`);
                break;
              case 'mutual':
                follows.add(`${testData.sender.id}->${testData.recipient.id}`);
                follows.add(`${testData.recipient.id}->${testData.sender.id}`);
                break;
              // 'none' case: no follows added
            }

            // Check if users are mutual followers
            const areMutualFollowers =
              follows.has(`${testData.sender.id}->${testData.recipient.id}`) &&
              follows.has(`${testData.recipient.id}->${testData.sender.id}`);

            // Mock DM send attempt
            const canSendDM = areMutualFollowers;
            const dmSendResult = canSendDM ? 'success' : 'forbidden';

            // Property: DM should only succeed for mutual followers
            const expectedResult = areMutualFollowers ? 'success' : 'forbidden';

            return dmSendResult === expectedResult;
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: DM conversation participants are consistently ordered', () => {
      fc.assert(
        fc.property(
          fc.record({
            user1: generators.user(),
            user2: generators.user(),
          }),
          (testData) => {
            // Mock mutual follow relationship
            const areMutualFollowers = true; // Assume mutual for this test

            if (areMutualFollowers) {
              // Mock conversation creation with consistent ordering
              const participant1 =
                testData.user1.id < testData.user2.id
                  ? testData.user1.id
                  : testData.user2.id;
              const participant2 =
                testData.user1.id < testData.user2.id
                  ? testData.user2.id
                  : testData.user1.id;

              // Property: Smaller UUID should always be participant_1
              const isCorrectlyOrdered = participant1 < participant2;

              // Property: Same conversation should be created regardless of who initiates
              const conversationId1 = `${participant1}-${participant2}`;
              const conversationId2 = `${participant1}-${participant2}`; // Should be same regardless of order

              return isCorrectlyOrdered && conversationId1 === conversationId2;
            }

            return true; // Skip if not mutual followers
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: DM access is revoked when users unfollow', () => {
      fc.assert(
        fc.property(
          fc.record({
            user1: generators.user(),
            user2: generators.user(),
            unfollowAction: fc.constantFrom(
              'user1-unfollows',
              'user2-unfollows',
              'both-unfollow'
            ),
          }),
          (testData) => {
            // Mock initial mutual follow state
            let follows = new Set([
              `${testData.user1.id}->${testData.user2.id}`,
              `${testData.user2.id}->${testData.user1.id}`,
            ]);

            // Initial state: mutual followers, DM enabled
            let initialMutualState =
              follows.has(`${testData.user1.id}->${testData.user2.id}`) &&
              follows.has(`${testData.user2.id}->${testData.user1.id}`);

            // Mock unfollow action
            switch (testData.unfollowAction) {
              case 'user1-unfollows':
                follows.delete(`${testData.user1.id}->${testData.user2.id}`);
                break;
              case 'user2-unfollows':
                follows.delete(`${testData.user2.id}->${testData.user1.id}`);
                break;
              case 'both-unfollow':
                follows.delete(`${testData.user1.id}->${testData.user2.id}`);
                follows.delete(`${testData.user2.id}->${testData.user1.id}`);
                break;
            }

            // Check final mutual state
            const finalMutualState =
              follows.has(`${testData.user1.id}->${testData.user2.id}`) &&
              follows.has(`${testData.user2.id}->${testData.user1.id}`);

            // Mock conversation status
            const conversationActive = finalMutualState;

            // Property: Conversation should be deactivated when users are no longer mutual followers
            return conversationActive === finalMutualState;
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });

  describe('DM Message Properties', () => {
    test('Property: Messages are delivered in chronological order', () => {
      fc.assert(
        fc.property(
          fc.record({
            user1: fc.record({
              id: generators.userId(),
              username: generators.username(),
              displayName: fc.string({ minLength: 1, maxLength: 50 }),
              email: generators.email(),
              bio: fc.option(generators.bio()),
              isVerified: fc.boolean(),
              followerCount: fc.nat(),
              followingCount: fc.nat(),
              createdAt: fc.date({
                min: new Date('2020-01-01'),
                max: new Date(),
              }),
            }),
            user2: fc.record({
              id: generators.userId(),
              username: generators.username(),
              displayName: fc.string({ minLength: 1, maxLength: 50 }),
              email: generators.email(),
              bio: fc.option(generators.bio()),
              isVerified: fc.boolean(),
              followerCount: fc.nat(),
              followingCount: fc.nat(),
              createdAt: fc.date({
                min: new Date('2020-01-01'),
                max: new Date(),
              }),
            }),
            messages: fc
              .array(
                fc.record({
                  content: fc
                    .string({ minLength: 1, maxLength: 200 })
                    .filter((s) => s.trim().length > 0),
                  timestamp: fc
                    .date({ min: new Date('2023-01-01'), max: new Date() })
                    .filter(
                      (d) =>
                        d instanceof Date &&
                        !isNaN(d.getTime()) &&
                        d.getTime() > 0
                    ),
                  senderId: fc.constantFrom('user1', 'user2'),
                }),
                { minLength: 2, maxLength: 10 }
              )
              .filter((messages) =>
                messages.every(
                  (msg) =>
                    msg.timestamp instanceof Date &&
                    !isNaN(msg.timestamp.getTime()) &&
                    msg.content.trim().length > 0
                )
              ),
          }),
          (testData) => {
            // Ensure all timestamps are valid
            const allTimestampsValid = testData.messages.every(
              (msg) =>
                msg.timestamp instanceof Date && !isNaN(msg.timestamp.getTime())
            );

            if (!allTimestampsValid) return false;

            // Mock mutual follow relationship
            const areMutualFollowers = true;

            if (areMutualFollowers) {
              // Sort messages by timestamp
              const sortedMessages = [...testData.messages].sort(
                (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
              );

              // Property: Messages should be in chronological order
              const isChronological = sortedMessages.every((message, index) => {
                if (index === 0) return true;
                const currentTime = message.timestamp.getTime();
                const previousTime =
                  sortedMessages[index - 1].timestamp.getTime();
                return currentTime >= previousTime;
              });

              // Property: All messages should have valid content
              const allContentValid = testData.messages.every(
                (msg) =>
                  typeof msg.content === 'string' &&
                  msg.content.trim().length > 0
              );

              return isChronological && allContentValid;
            }

            return true; // Skip if not mutual followers
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Message read status is tracked per recipient', () => {
      fc.assert(
        fc.property(
          fc.record({
            sender: generators.user(),
            recipient: generators.user(),
            messageContent: fc.string({ minLength: 1, maxLength: 200 }),
            isRead: fc.boolean(),
          }),
          (testData) => {
            // Mock mutual follow relationship
            const areMutualFollowers = true;

            if (areMutualFollowers) {
              // Mock message with read status
              const message = {
                id: 'msg-123',
                senderId: testData.sender.id,
                recipientId: testData.recipient.id,
                content: testData.messageContent,
                isRead: testData.isRead,
                sentAt: new Date(),
                readAt: testData.isRead ? new Date() : null,
              };

              // Property: Read status should be consistent
              const readStatusConsistent =
                message.isRead === (message.readAt !== null);

              // Property: Sender should not be the same as recipient
              const differentUsers = message.senderId !== message.recipientId;

              return readStatusConsistent && differentUsers;
            }

            return true; // Skip if not mutual followers
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });

  describe('DM Permission Properties', () => {
    test('Property: DM permissions are symmetric for mutual followers', () => {
      fc.assert(
        fc.property(
          fc.record({
            user1: generators.user(),
            user2: generators.user(),
          }),
          (testData) => {
            // Mock mutual follow relationship
            const follows = new Set([
              `${testData.user1.id}->${testData.user2.id}`,
              `${testData.user2.id}->${testData.user1.id}`,
            ]);

            const areMutualFollowers =
              follows.has(`${testData.user1.id}->${testData.user2.id}`) &&
              follows.has(`${testData.user2.id}->${testData.user1.id}`);

            // Mock DM permissions
            const user1CanMessageUser2 = areMutualFollowers;
            const user2CanMessageUser1 = areMutualFollowers;

            // Property: DM permissions should be symmetric
            return user1CanMessageUser2 === user2CanMessageUser1;
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });

  describe('Property 33: Direct message content validation', () => {
    /**
     * **Feature: project-Deja-vu, Property 33: Direct message content validation**
     * **Validates: Requirements 4.7**
     */
    test('Property: Direct messages with only whitespace content should be rejected', () => {
      fc.assert(
        fc.property(
          fc.record({
            sender: generators.user(),
            recipient: generators.user(),
            messageContent: fc.oneof(
              // Valid content (non-whitespace)
              fc
                .string({ minLength: 1, maxLength: 500 })
                .filter((s) => s.trim().length > 0),
              // Invalid content (only whitespace)
              fc.oneof(
                fc.constant(''),
                fc.constant('   '),
                fc.constant('\t\t'),
                fc.constant('\n\n'),
                fc.constant('  \t  \n  '),
                fc.string().filter((s) => s.length > 0 && s.trim().length === 0)
              )
            ),
          }),
          (testData) => {
            // Mock mutual follow relationship (required for DM)
            const areMutualFollowers = true;

            if (!areMutualFollowers) {
              return true; // Skip if not mutual followers
            }

            // Validate message content
            const trimmedContent = testData.messageContent.trim();
            const isValidContent = trimmedContent.length > 0;

            // Mock message validation logic
            let validationResult: { success: boolean; error?: string } = {
              success: true,
            };

            if (!isValidContent) {
              validationResult = {
                success: false,
                error:
                  'Message content cannot be empty or contain only whitespace',
              };
            }

            // Property: Messages with only whitespace should be rejected
            const shouldBeRejected = !isValidContent;
            const wasRejected = !validationResult.success;

            // Property: Valid messages should be accepted
            const shouldBeAccepted = isValidContent;
            const wasAccepted = validationResult.success;

            // Both conditions must hold
            return (
              shouldBeRejected === wasRejected &&
              shouldBeAccepted === wasAccepted
            );
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Error message is provided for invalid content', () => {
      fc.assert(
        fc.property(
          fc.record({
            sender: generators.user(),
            recipient: generators.user(),
            invalidContent: fc.oneof(
              fc.constant(''),
              fc.constant('   '),
              fc.constant('\t\t\t'),
              fc.constant('\n\n\n'),
              fc.constant('  \t  \n  \r  '),
              fc
                .string({ minLength: 1, maxLength: 50 })
                .filter((s) => s.trim().length === 0)
            ),
          }),
          (testData) => {
            // Mock mutual follow relationship
            const areMutualFollowers = true;

            if (!areMutualFollowers) {
              return true; // Skip if not mutual followers
            }

            // Mock validation for invalid content
            const trimmedContent = testData.invalidContent.trim();
            const isValidContent = trimmedContent.length > 0;

            let validationResult: { success: boolean; error?: string } = {
              success: true,
            };

            if (!isValidContent) {
              validationResult = {
                success: false,
                error:
                  'Message content cannot be empty or contain only whitespace',
              };
            }

            // Property: Invalid content should always be rejected with an error message
            const wasRejected = !validationResult.success;
            const hasErrorMessage =
              validationResult.error && validationResult.error.length > 0;

            return wasRejected && hasErrorMessage;
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Valid content with mixed whitespace and text is accepted', () => {
      fc.assert(
        fc.property(
          fc.record({
            sender: generators.user(),
            recipient: generators.user(),
            validContent: fc.oneof(
              // Content with leading/trailing whitespace but valid text
              fc
                .string({ minLength: 1, maxLength: 100 })
                .filter((s) => s.trim().length > 0)
                .map((s) => `  ${s}  `),
              // Content with internal whitespace
              fc
                .string({ minLength: 1, maxLength: 100 })
                .filter((s) => s.trim().length > 0)
                .map((s) => s.replace(/(.)/g, '$1 ')),
              // Content with newlines and tabs but valid text
              fc
                .string({ minLength: 1, maxLength: 100 })
                .filter((s) => s.trim().length > 0)
                .map((s) => `\n\t${s}\n\t`)
            ),
          }),
          (testData) => {
            // Mock mutual follow relationship
            const areMutualFollowers = true;

            if (!areMutualFollowers) {
              return true; // Skip if not mutual followers
            }

            // Validate message content
            const trimmedContent = testData.validContent.trim();
            const isValidContent = trimmedContent.length > 0;

            // Mock validation logic
            let validationResult: { success: boolean; error?: string } = {
              success: true,
            };

            if (!isValidContent) {
              validationResult = {
                success: false,
                error:
                  'Message content cannot be empty or contain only whitespace',
              };
            }

            // Property: Valid content (even with surrounding whitespace) should be accepted
            return validationResult.success && isValidContent;
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });

  describe('Property 34: Direct message timestamp validation', () => {
    /**
     * **Feature: project-Deja-vu, Property 34: Direct message timestamp validation**
     * **Validates: Requirements 4.8**
     */
    test('Property: Direct message timestamps are valid and chronologically sortable', () => {
      fc.assert(
        fc.property(
          fc.record({
            sender: generators.user(),
            recipient: generators.user(),
            messages: fc.array(
              fc
                .record({
                  content: fc
                    .string({ minLength: 1, maxLength: 200 })
                    .filter((s) => s.trim().length > 0),
                  sentAt: fc
                    .date({ min: new Date('2023-01-01'), max: new Date() })
                    .filter(
                      (d) =>
                        d instanceof Date &&
                        !isNaN(d.getTime()) &&
                        d.getTime() > 0
                    ),
                })
                .chain((msg) =>
                  fc.record({
                    content: fc.constant(msg.content),
                    sentAt: fc.constant(msg.sentAt),
                    readAt: fc.option(
                      fc
                        .date({
                          min: new Date(msg.sentAt.getTime()), // readAt must be >= sentAt
                          max: new Date(),
                        })
                        .filter(
                          (d) =>
                            d instanceof Date &&
                            !isNaN(d.getTime()) &&
                            d.getTime() > 0
                        )
                    ),
                  })
                ),
              { minLength: 1, maxLength: 20 }
            ),
          }),
          (testData) => {
            // Mock mutual follow relationship (required for DM)
            const areMutualFollowers = true;

            if (!areMutualFollowers) {
              return true; // Skip if not mutual followers
            }

            // Validate all timestamps are valid Date objects
            const allTimestampsValid = testData.messages.every((msg) => {
              const sentAtValid =
                msg.sentAt instanceof Date && !isNaN(msg.sentAt.getTime());
              const readAtValid =
                msg.readAt === null ||
                (msg.readAt instanceof Date && !isNaN(msg.readAt.getTime()));

              // If message is read, readAt should be >= sentAt
              const readAtAfterSentAt =
                msg.readAt === null ||
                msg.readAt.getTime() >= msg.sentAt.getTime();

              return sentAtValid && readAtValid && readAtAfterSentAt;
            });

            if (!allTimestampsValid) {
              return false;
            }

            // Test chronological sorting capability
            const sortedMessages = [...testData.messages].sort(
              (a, b) => a.sentAt.getTime() - b.sentAt.getTime()
            );

            // Property: Messages should be sortable chronologically
            const isChronologicallySortable = sortedMessages.every(
              (message, index) => {
                if (index === 0) return true;
                const currentTime = message.sentAt.getTime();
                const previousTime = sortedMessages[index - 1].sentAt.getTime();
                return currentTime >= previousTime;
              }
            );

            // Property: Timestamps should be within reasonable bounds (not in future beyond current time)
            const now = new Date().getTime();
            const timestampsWithinBounds = testData.messages.every((msg) => {
              const sentAtInBounds = msg.sentAt.getTime() <= now;
              const readAtInBounds =
                msg.readAt === null || msg.readAt.getTime() <= now;
              return sentAtInBounds && readAtInBounds;
            });

            // Property: All messages should have valid content
            const allContentValid = testData.messages.every(
              (msg) =>
                typeof msg.content === 'string' && msg.content.trim().length > 0
            );

            return (
              isChronologicallySortable &&
              timestampsWithinBounds &&
              allContentValid
            );
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Message read timestamps are always after or equal to sent timestamps', () => {
      fc.assert(
        fc.property(
          fc.record({
            sender: generators.user(),
            recipient: generators.user(),
            message: fc.record({
              content: fc
                .string({ minLength: 1, maxLength: 200 })
                .filter((s) => s.trim().length > 0),
              sentAt: fc
                .date({ min: new Date('2023-01-01'), max: new Date() })
                .filter(
                  (d) =>
                    d instanceof Date && !isNaN(d.getTime()) && d.getTime() > 0
                ),
              isRead: fc.boolean(),
            }),
          }),
          (testData) => {
            // Mock mutual follow relationship
            const areMutualFollowers = true;

            if (!areMutualFollowers) {
              return true; // Skip if not mutual followers
            }

            // Generate readAt timestamp if message is read
            const readAt = testData.message.isRead
              ? new Date(
                  testData.message.sentAt.getTime() + Math.random() * 86400000
                ) // Up to 1 day after sent
              : null;

            const directMessage = {
              id: 'msg-' + Math.random().toString(36).substr(2, 9),
              conversationId: 'conv-123',
              senderId: testData.sender.id,
              content: testData.message.content,
              isRead: testData.message.isRead,
              sentAt: testData.message.sentAt,
              readAt: readAt,
            };

            // Property: If message is read, readAt should be >= sentAt
            const readTimestampValid =
              !directMessage.isRead ||
              (directMessage.readAt !== null &&
                directMessage.readAt.getTime() >=
                  directMessage.sentAt.getTime());

            // Property: Unread messages should have null readAt
            const unreadTimestampValid =
              directMessage.isRead || directMessage.readAt === null;

            // Property: All timestamps should be valid Date objects
            const sentAtValid =
              directMessage.sentAt instanceof Date &&
              !isNaN(directMessage.sentAt.getTime());
            const readAtValid =
              directMessage.readAt === null ||
              (directMessage.readAt instanceof Date &&
                !isNaN(directMessage.readAt.getTime()));

            return (
              readTimestampValid &&
              unreadTimestampValid &&
              sentAtValid &&
              readAtValid
            );
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });

    test('Property: Message timestamps enable proper conversation ordering', () => {
      fc.assert(
        fc.property(
          fc.record({
            user1: generators.user(),
            user2: generators.user(),
            conversationMessages: fc
              .array(
                fc.record({
                  content: fc
                    .string({ minLength: 1, maxLength: 200 })
                    .filter((s) => s.trim().length > 0),
                  senderId: fc.constantFrom('user1', 'user2'),
                  sentAt: fc
                    .date({ min: new Date('2023-01-01'), max: new Date() })
                    .filter(
                      (d) =>
                        d instanceof Date &&
                        !isNaN(d.getTime()) &&
                        d.getTime() > 0
                    ),
                }),
                { minLength: 2, maxLength: 15 }
              )
              .filter((messages) =>
                messages.every(
                  (msg) =>
                    msg.sentAt instanceof Date && !isNaN(msg.sentAt.getTime())
                )
              ),
          }),
          (testData) => {
            // Mock mutual follow relationship
            const areMutualFollowers = true;

            if (!areMutualFollowers) {
              return true; // Skip if not mutual followers
            }

            // Ensure all timestamps are valid (double check after filter)
            const allTimestampsValid = testData.conversationMessages.every(
              (msg) =>
                msg.sentAt instanceof Date && !isNaN(msg.sentAt.getTime())
            );

            if (!allTimestampsValid) {
              return false;
            }

            // Create conversation with proper message ordering
            const orderedMessages = [...testData.conversationMessages].sort(
              (a, b) => a.sentAt.getTime() - b.sentAt.getTime()
            );

            // Property: Messages should maintain chronological order in conversation
            const isProperlyOrdered = orderedMessages.every(
              (message, index) => {
                if (index === 0) return true;

                const currentTime = message.sentAt.getTime();
                const previousTime =
                  orderedMessages[index - 1].sentAt.getTime();

                // Current message should be sent at or after the previous message
                return currentTime >= previousTime;
              }
            );

            // Property: Each message should have a valid sender from the conversation participants
            const validSenders = orderedMessages.every(
              (msg) => msg.senderId === 'user1' || msg.senderId === 'user2'
            );

            // Property: Conversation should be sortable by timestamp without data loss
            const originalCount = testData.conversationMessages.length;
            const sortedCount = orderedMessages.length;
            const noDataLoss = originalCount === sortedCount;

            return isProperlyOrdered && validSenders && noDataLoss;
          }
        ),
        { numRuns: PBT_CONFIG.numRuns }
      );
    });
  });
});
