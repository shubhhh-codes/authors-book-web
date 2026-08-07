import { describe, it, expect } from 'vitest';
import { getClientIp } from './rateLimit';

describe('getClientIp', () => {
  it('should return the first IP from x-forwarded-for header when there are multiple IPs', () => {
    const request = new Request('http://localhost', {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 127.0.0.1'
      })
    });

    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.1');
  });

  it('should return the IP from x-forwarded-for header when there is a single IP', () => {
    const request = new Request('http://localhost', {
      headers: new Headers({
        'x-forwarded-for': '10.0.0.1'
      })
    });

    const ip = getClientIp(request);
    expect(ip).toBe('10.0.0.1');
  });

  it('should return the IP from x-real-ip header when x-forwarded-for is missing', () => {
    const request = new Request('http://localhost', {
      headers: new Headers({
        'x-real-ip': '172.16.0.1'
      })
    });

    const ip = getClientIp(request);
    expect(ip).toBe('172.16.0.1');
  });

  it('should return "unknown" when neither x-forwarded-for nor x-real-ip headers are present', () => {
    const request = new Request('http://localhost', {
      headers: new Headers()
    });

    const ip = getClientIp(request);
    expect(ip).toBe('unknown');
  });

  it('should prefer x-forwarded-for over x-real-ip when both are present', () => {
    const request = new Request('http://localhost', {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '172.16.0.1'
      })
    });

    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.1');
  });
});
