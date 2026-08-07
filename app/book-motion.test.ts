import { describe, it, expect } from 'vitest';
import { clamp01 } from './book-motion';

describe('clamp01', () => {
  it('should return 0 when value is exactly 0', () => {
    expect(clamp01(0)).toBe(0);
  });

  it('should return 1 when value is exactly 1', () => {
    expect(clamp01(1)).toBe(1);
  });

  it('should return 0 when value is negative', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(-100)).toBe(0);
  });

  it('should return 1 when value is greater than 1', () => {
    expect(clamp01(1.5)).toBe(1);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(100)).toBe(1);
  });

  it('should return the value when it is between 0 and 1', () => {
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(0.1)).toBe(0.1);
    expect(clamp01(0.99)).toBe(0.99);
  });
});
