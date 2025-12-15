# DEJA-VU Testing Framework

This directory contains the comprehensive testing setup for the DEJA-VU project, including unit tests, property-based tests, and integration tests.

## Testing Stack

- **Jest**: Primary testing framework with Next.js integration
- **React Testing Library**: For component testing
- **fast-check**: Property-based testing library
- **@testing-library/jest-dom**: Additional Jest matchers for DOM testing

## Test Structure

### Test Files

- `setup.test.ts` - Basic setup verification tests
- `property-testing.test.ts` - Property-based testing framework validation
- `mock-factories.test.ts` - Mock factory validation tests
- `supabase-integration.test.ts` - Supabase client integration tests

### Test Utilities (`src/test-utils/`)

- `index.ts` - Main test utilities, generators, and mock factories
- `property-config.ts` - Property-based testing configuration and validators

## Property-Based Testing

The project uses fast-check for property-based testing with the following configuration:

- **Minimum iterations**: 100 (as specified in requirements)
- **Timeout**: 10 seconds per test
- **Reproducible**: Uses seed for consistent test runs

### Generators Available

- User data generators (id, username, email, etc.)
- Post content generators (content, hashtags, mentions)
- Airdrop data generators (title, project, blockchain)
- Wallet and exchange data generators
- Theme and UI preference generators

### Validators

- Username validation (3-20 alphanumeric + underscore)
- Email validation (standard email format)
- Hashtag validation (alphanumeric + underscore)
- Wallet address validation (Ethereum format)
- Post content validation (1-280 characters)
- Airdrop status validation (active/ended/upcoming)
- Theme validation (light/dark/system)

## Mock Factories

Pre-configured mock objects for testing:

- `createMockUser()` - Creates realistic user objects
- `createMockPost()` - Creates realistic post objects
- `createMockAirdrop()` - Creates realistic airdrop objects

All mock factories support overrides for customization.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only property-based tests
npm run test:property
```

## Test Coverage

The testing framework provides comprehensive coverage for:

- ✅ Test utilities and generators (91% coverage)
- ✅ Property-based testing configuration (100% coverage)
- ✅ Mock factories validation
- ✅ Supabase client integration
- ✅ Basic framework setup

## Property-Based Test Examples

```typescript
// Example property test
test('Property: Username validation', () => {
  fc.assert(
    fc.property(fc.stringMatching(/^[a-zA-Z0-9_]{3,20}$/), (validUsername) => {
      return validators.isValidUsername(validUsername);
    }),
    { numRuns: 100 }
  );
});
```

## Integration with DEJA-VU Features

This testing framework is designed to support all 28 correctness properties defined in the design document:

1. **Social Features**: Post creation, timeline display, follow system
2. **Airdrop System**: Feed updates, bookmarking, deadline reminders
3. **Exchange Integration**: API connections, portfolio display, error handling
4. **Wallet Integration**: Signature verification, balance display, NFT collections
5. **UI/UX Features**: Theme persistence, infinite scroll, responsive design

## Next Steps

As implementation progresses, this testing framework will be extended with:

- Component-specific property tests
- API endpoint integration tests
- Real-time feature tests
- Database operation tests
- Authentication flow tests

Each feature implementation should include corresponding property-based tests that validate the correctness properties defined in the design document.
