import { expect, test, describe, beforeEach, vi } from 'vitest';
import { checkRateLimit, cleanupRateLimitStore } from './rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Reset any state (we can clear via mock timers or run cleanup)
    vi.useFakeTimers();
    cleanupRateLimitStore(); // We'll advance time to ensure clean up if we want, or just rely on a new identifier per test.
  });

  test('should allow the first request', () => {
    const { allowed, remaining } = checkRateLimit('user1', 5, 1000);
    expect(allowed).toBe(true);
    expect(remaining).toBe(4);
  });

  test('should allow subsequent requests up to the limit', () => {
    // 1st
    checkRateLimit('user2', 3, 1000);
    // 2nd
    let res = checkRateLimit('user2', 3, 1000);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(1);

    // 3rd
    res = checkRateLimit('user2', 3, 1000);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(0);
  });

  test('should block requests exceeding the limit', () => {
    const limit = 2;
    // 1st request
    checkRateLimit('user3', limit, 1000);
    // 2nd request
    checkRateLimit('user3', limit, 1000);

    // 3rd request should fail
    const res = checkRateLimit('user3', limit, 1000);
    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
  });

  test('should reset after windowMs', () => {
    const limit = 1;
    const windowMs = 1000;

    // 1st request
    checkRateLimit('user4', limit, windowMs);

    // 2nd request immediately should fail
    let res = checkRateLimit('user4', limit, windowMs);
    expect(res.allowed).toBe(false);

    // advance time
    vi.advanceTimersByTime(windowMs + 1);

    // should be allowed again
    res = checkRateLimit('user4', limit, windowMs);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(0);
  });
});
