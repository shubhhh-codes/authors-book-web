import { describe, it, expect } from 'vitest';
import { getClientIp } from './rateLimit';

describe('getClientIp', () => {
  it('should parse x-forwarded-for with a single IP', () => {
    const request = new Request('http://localhost', {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.195'
      })
    });
    expect(getClientIp(request)).toBe('203.0.113.195');
  });

  it('should parse x-forwarded-for with multiple IPs and return the first one', () => {
    const request = new Request('http://localhost', {
      headers: new Headers({
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178'
      })
    });
    expect(getClientIp(request)).toBe('203.0.113.195');
  });

  it('should parse x-forwarded-for with multiple IPs and spaces', () => {
    const request = new Request('http://localhost', {
      headers: new Headers({
        'x-forwarded-for': '  203.0.113.195 , 70.41.3.18  '
      })
    });
    expect(getClientIp(request)).toBe('203.0.113.195');
  });

  it('should fallback to x-real-ip if x-forwarded-for is missing', () => {
    const request = new Request('http://localhost', {
      headers: new Headers({
        'x-real-ip': '70.41.3.18'
      })
    });
    expect(getClientIp(request)).toBe('70.41.3.18');
  });

  it('should return "unknown" if no IP headers are present', () => {
    const request = new Request('http://localhost');
    expect(getClientIp(request)).toBe('unknown');
  });
});
