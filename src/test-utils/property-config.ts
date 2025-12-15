import * as fc from 'fast-check';

// Property-based testing configuration
export const PBT_CONFIG = {
  // Minimum 100 iterations as specified in requirements
  numRuns: 100,
  // Timeout for property tests
  timeout: 10000,
  // Seed for reproducible tests (can be overridden)
  seed: 42,
};

// Helper function to create property tests with consistent configuration
export const createPropertyTest = (
  name: string,
  property: fc.IProperty<unknown>,
  options: Partial<typeof PBT_CONFIG> = {}
) => {
  const config = { ...PBT_CONFIG, ...options };

  test(
    name,
    () => {
      fc.assert(property, {
        numRuns: config.numRuns,
        seed: config.seed,
      });
    },
    config.timeout
  );
};

// Validation helpers for property tests
export const validators = {
  isValidUsername: (username: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  },

  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  isValidHashtag: (hashtag: string): boolean => {
    return /^[a-zA-Z0-9_]+$/.test(hashtag) && hashtag.length > 0;
  },

  isValidWalletAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  isValidPostContent: (content: string): boolean => {
    return content.length > 0 && content.length <= 280;
  },

  isValidAirdropStatus: (status: string): boolean => {
    return ['active', 'ended', 'upcoming'].includes(status);
  },

  isValidTheme: (theme: string): boolean => {
    return ['light', 'dark', 'system'].includes(theme);
  },
};
