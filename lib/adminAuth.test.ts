import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('NEXTAUTH_SECRET', 'test-secret');

import { timingSafeEqualStrings, timingSafePasswordCheck } from './adminAuth';

describe('timingSafeEqualStrings', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeEqualStrings('password123', 'password123')).toBe(true);
  });

  it('returns false for different strings of the same length', () => {
    expect(timingSafeEqualStrings('password123', 'password124')).toBe(false);
  });

  it('returns false for strings of different lengths', () => {
    expect(timingSafeEqualStrings('password123', 'password1234')).toBe(false);
  });

  it('handles empty strings correctly', () => {
    expect(timingSafeEqualStrings('', '')).toBe(true);
  });
});

describe('timingSafePasswordCheck', () => {
  it('returns true when passwords match', () => {
    expect(timingSafePasswordCheck('secretKey', 'secretKey')).toBe(true);
  });

  it('returns false when passwords do not match', () => {
    expect(timingSafePasswordCheck('secretKey', 'wrongKey')).toBe(false);
  });

  it('returns false when input password is empty', () => {
    expect(timingSafePasswordCheck('', 'actualPassword')).toBe(false);
  });

  it('returns false when actual password is empty', () => {
    expect(timingSafePasswordCheck('inputPassword', '')).toBe(false);
  });

  it('returns false when both passwords are empty', () => {
    expect(timingSafePasswordCheck('', '')).toBe(false);
  });

  it('returns false when input password is null', () => {
    // @ts-ignore: Intentionally testing runtime null check
    expect(timingSafePasswordCheck(null, 'actualPassword')).toBe(false);
  });

  it('returns false when actual password is null', () => {
    // @ts-ignore: Intentionally testing runtime null check
    expect(timingSafePasswordCheck('inputPassword', null)).toBe(false);
  });

  it('returns false when input password is undefined', () => {
    // @ts-ignore: Intentionally testing runtime undefined check
    expect(timingSafePasswordCheck(undefined, 'actualPassword')).toBe(false);
  });

  it('returns false when actual password is undefined', () => {
    // @ts-ignore: Intentionally testing runtime undefined check
    expect(timingSafePasswordCheck('inputPassword', undefined)).toBe(false);
  });
});
