import * as fc from 'fast-check';

describe('Test Setup Verification', () => {
  test('Jest is working', () => {
    expect(true).toBe(true);
  });

  test('fast-check is working', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n === n;
      })
    );
  });

  test('Property test with 100 iterations', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        return typeof str === 'string';
      }),
      { numRuns: 100 }
    );
  });
});
