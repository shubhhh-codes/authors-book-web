process.env.NEXTAUTH_SECRET = 'test-secret-for-jest';

import { timingSafeEqualStrings } from '../../lib/adminAuth';

describe('timingSafeEqualStrings', () => {
  it('should return true for identical strings', () => {
    expect(timingSafeEqualStrings('secret', 'secret')).toBe(true);
  });

  it('should return true for empty strings', () => {
    expect(timingSafeEqualStrings('', '')).toBe(true);
  });

  it('should return false for different strings of the same length', () => {
    expect(timingSafeEqualStrings('hello', 'world')).toBe(false);
  });

  it('should return false for strings with the same prefix but different lengths', () => {
    expect(timingSafeEqualStrings('test', 'testing')).toBe(false);
  });

  it('should return false for strings differing by only one character', () => {
    expect(timingSafeEqualStrings('password123', 'passwerd123')).toBe(false);
  });

  it('should handle non-ASCII characters correctly (match)', () => {
    expect(timingSafeEqualStrings('pásswörd', 'pásswörd')).toBe(true);
  });

  it('should handle non-ASCII characters correctly (mismatch)', () => {
    expect(timingSafeEqualStrings('pásswörd', 'passwörd')).toBe(false);
  });
});
