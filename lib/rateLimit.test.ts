import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit, cleanupRateLimitStore, getClientIp } from './rateLimit';

// Clear the store between tests
// By simulating time passage and cleanup
describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Move time forward by a large amount and run cleanup to ensure empty store
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    cleanupRateLimitStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('success path: should allow requests within the limit', () => {
    const identifier = 'test-success-ip';
    const limit = 3;

    // First request
    let result = checkRateLimit(identifier, limit);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);

    // Second request
    result = checkRateLimit(identifier, limit);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);

    // Third request
    result = checkRateLimit(identifier, limit);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('should block requests when limit is exceeded', () => {
    const identifier = 'test-exceed-ip';
    const limit = 2;

    checkRateLimit(identifier, limit);
    checkRateLimit(identifier, limit);

    // Third request should be blocked
    const result = checkRateLimit(identifier, limit);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should allow requests again after window expires', () => {
    const identifier = 'test-window-ip';
    const limit = 1;
    const windowMs = 1000;

    // First request
    checkRateLimit(identifier, limit, windowMs);

    // Second request immediately - blocked
    let result = checkRateLimit(identifier, limit, windowMs);
    expect(result.allowed).toBe(false);

    // Fast forward past window
    vi.advanceTimersByTime(1001);

    // Request should be allowed again
    result = checkRateLimit(identifier, limit, windowMs);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('should track different identifiers separately', () => {
    const ip1 = 'ip-1';
    const ip2 = 'ip-2';
    const limit = 1;

    // First IP hits limit
    checkRateLimit(ip1, limit);
    let result1 = checkRateLimit(ip1, limit);
    expect(result1.allowed).toBe(false);

    // Second IP should still be allowed
    let result2 = checkRateLimit(ip2, limit);
    expect(result2.allowed).toBe(true);
  });
});

describe('cleanupRateLimitStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    cleanupRateLimitStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should remove expired entries from store', () => {
    const identifier = 'cleanup-ip';
    const windowMs = 1000;

    // Add entry
    checkRateLimit(identifier, 5, windowMs);

    // Before expiration, cleanup should not affect it
    // But we don't have direct access to store, we can just ensure it still limits

    // Advance time past expiration
    vi.advanceTimersByTime(1001);

    // Mock console.log to avoid noise during tests but we could also check if it gets called if removed > 0
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    cleanupRateLimitStore();

    expect(consoleSpy).toHaveBeenCalledWith('Rate limit cleanup: removed 1 expired entries');
    consoleSpy.mockRestore();
  });
});

describe('getClientIp', () => {
  it('should return x-forwarded-for first IP', () => {
    const req = new Request('http://localhost', {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1'
      })
    });
    expect(getClientIp(req)).toBe('192.168.1.1');
  });

  it('should return x-real-ip if x-forwarded-for is missing', () => {
    const req = new Request('http://localhost', {
      headers: new Headers({
        'x-real-ip': '10.0.0.2'
      })
    });
    expect(getClientIp(req)).toBe('10.0.0.2');
  });

  it('should return unknown if headers are missing', () => {
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('unknown');
  });
});
