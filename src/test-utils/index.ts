import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import * as fc from 'fast-check';

// Custom render function for testing with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };

// Property-based testing utilities with fast-check
export const testProperty = (
  name: string,
  property: fc.IProperty<unknown>,
  options: { numRuns?: number } = {}
) => {
  const { numRuns = 100 } = options;

  test(name, () => {
    fc.assert(property, { numRuns });
  });
};

// Common generators for DEJA-VU domain
export const generators = {
  // User generators
  userId: () => fc.uuid(),
  username: () => fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/),
  displayName: () => fc.string({ minLength: 1, maxLength: 50 }),
  email: () => fc.emailAddress(),
  bio: () => fc.string({ maxLength: 160 }),

  // Post generators
  postId: () => fc.uuid(),
  postContent: () => fc.string({ minLength: 1, maxLength: 280 }),
  hashtag: () => fc.stringMatching(/^[a-zA-Z0-9_]+$/),
  hashtags: () => fc.array(generators.hashtag(), { maxLength: 10 }),
  mentions: () => fc.array(generators.username(), { maxLength: 10 }),

  // Airdrop generators
  airdropId: () => fc.uuid(),
  airdropTitle: () => fc.string({ minLength: 5, maxLength: 100 }),
  projectName: () => fc.string({ minLength: 2, maxLength: 50 }),
  blockchain: () => fc.constantFrom('ethereum', 'bitcoin', 'solana', 'polygon'),

  // Wallet generators
  walletAddress: () =>
    fc
      .string({ minLength: 40, maxLength: 42 })
      .map((s) => '0x' + s.replace(/[^0-9a-f]/gi, '0').toLowerCase()),

  // Exchange generators
  exchangeName: () => fc.constantFrom('binance', 'coinbase', 'kraken', 'bybit'),
  exchangeCredentials: () =>
    fc.record({
      apiKey: fc.string({ minLength: 32, maxLength: 64 }),
      apiSecret: fc.string({ minLength: 32, maxLength: 64 }),
      passphrase: fc.option(fc.string({ minLength: 8, maxLength: 32 })),
    }),
  exchangeConnection: () =>
    fc.record({
      id: generators.userId(),
      userId: generators.userId(),
      exchangeName: generators.exchangeName(),
      apiKeyHash: fc.string({ minLength: 64, maxLength: 128 }),
      isActive: fc.boolean(),
      permissions: fc.array(
        fc.constantFrom('spot', 'futures', 'margin', 'read', 'trade'),
        { minLength: 1, maxLength: 3 }
      ),
      lastSyncAt: fc.option(generators.pastDate()),
      connectionStatus: fc.constantFrom(
        'connected',
        'error',
        'disconnected',
        'reconnecting'
      ),
      errorCount: fc.integer({ min: 0, max: 10 }),
      createdAt: generators.pastDate(),
    }),
  exchangeAsset: () =>
    fc.record({
      symbol: fc.constantFrom(
        'BTC',
        'ETH',
        'BNB',
        'ADA',
        'SOL',
        'DOT',
        'LINK',
        'UNI'
      ),
      name: fc.string({ minLength: 3, maxLength: 20 }),
      balance: fc.float({ min: 0, max: 1000 }),
      availableBalance: fc.float({ min: 0, max: 1000 }),
      lockedBalance: fc.float({ min: 0, max: 100 }),
      value: fc.float({ min: 0, max: 100000 }),
      change24h: fc.float({ min: -50, max: 50 }),
      price: fc.float({ min: 0.01, max: 100000 }),
    }),
  exchangePortfolio: () =>
    fc.record({
      exchangeName: generators.exchangeName(),
      totalValue: fc.float({ min: 0, max: 1000000 }),
      currency: fc.constantFrom('USD', 'BTC', 'ETH'),
      assets: fc.array(generators.exchangeAsset(), {
        minLength: 0,
        maxLength: 10,
      }),
      lastUpdatedAt: generators.pastDate(),
    }),

  // Theme generators
  theme: () => fc.constantFrom('light', 'dark', 'system'),

  // Date generators
  pastDate: () => fc.date({ max: new Date() }),
  futureDate: () => fc.date({ min: new Date() }),

  // Common data structures
  user: () =>
    fc.record({
      id: generators.userId(),
      username: generators.username(),
      displayName: generators.displayName(),
      email: generators.email(),
      bio: fc.option(generators.bio()),
      isVerified: fc.boolean(),
      followerCount: fc.nat(),
      followingCount: fc.nat(),
      createdAt: generators.pastDate(),
    }),

  post: () =>
    fc.record({
      id: generators.postId(),
      authorId: generators.userId(),
      content: generators.postContent(),
      hashtags: generators.hashtags(),
      mentions: generators.mentions(),
      likeCount: fc.nat(),
      repostCount: fc.nat(),
      replyCount: fc.nat(),
      isThread: fc.boolean(),
      createdAt: generators.pastDate(),
    }),

  airdrop: () =>
    fc.record({
      id: generators.airdropId(),
      title: generators.airdropTitle(),
      projectName: generators.projectName(),
      blockchain: generators.blockchain(),
      startDate: generators.pastDate(),
      endDate: generators.futureDate(),
      status: fc.constantFrom('active', 'ended', 'upcoming'),
    }),
};

// Mock factories for testing
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  bio: 'Test bio',
  isVerified: false,
  followerCount: 0,
  followingCount: 0,
  createdAt: new Date(),
  ...overrides,
});

export const createMockPost = (overrides = {}) => ({
  id: 'post-123',
  authorId: 'user-123',
  content: 'Test post content',
  hashtags: ['test'],
  mentions: [],
  likeCount: 0,
  repostCount: 0,
  replyCount: 0,
  isThread: false,
  createdAt: new Date(),
  ...overrides,
});

export const createMockAirdrop = (overrides = {}) => ({
  id: 'airdrop-123',
  title: 'Test Airdrop',
  projectName: 'Test Project',
  blockchain: 'ethereum',
  startDate: new Date(),
  endDate: new Date(Date.now() + 86400000), // 1 day from now
  status: 'active' as const,
  ...overrides,
});

export const mockFactories = {
  createMockUser,
  createMockPost,
  createMockAirdrop,
};
