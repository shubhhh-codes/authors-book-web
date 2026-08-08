import { describe, it, expect } from 'vitest';
import { createMotionLayout, MotionBookSize } from './book-motion';

describe('createMotionLayout', () => {
  it('should create layout for empty books array', () => {
    const layout = createMotionLayout([]);
    expect(layout.shelvedZ).toBe(-0.64);
    expect(layout.presentedZ).toBe(0.4);
    expect(layout.presentedScale).toBe(1.035);
    expect(layout.collisionMargin).toBe(0.035);

    // For empty array, maxShelvedHalfDepth = 0, maxRotationRadius = 0
    // rotationLaneZ = shelvedZ + maxShelvedHalfDepth + maxRotationRadius + collisionMargin
    // rotationLaneZ = -0.64 + 0 + 0 + 0.035 = -0.605
    expect(layout.rotationLaneZ).toBeCloseTo(-0.605);
  });

  it('should calculate correct rotationLaneZ for a single book', () => {
    const books: MotionBookSize[] = [{ width: 0.2, thickness: 0.05 }];
    const layout = createMotionLayout(books);

    const maxShelvedHalfDepth = 0.2 * 0.5; // 0.1
    const maxRotationRadius = Math.hypot(0.2, 0.05) * 0.5 * 1.08; // Math.sqrt(0.04 + 0.0025) * 0.5 * 1.08 = Math.sqrt(0.0425) * 0.54 ≈ 0.206155 * 0.54 ≈ 0.11132
    const expectedRotationLaneZ = -0.64 + 0.1 + maxRotationRadius + 0.035;

    expect(layout.rotationLaneZ).toBeCloseTo(expectedRotationLaneZ);
  });

  it('should correctly apply Math.max over multiple books', () => {
    const books: MotionBookSize[] = [
      { width: 0.1, thickness: 0.02 },
      { width: 0.3, thickness: 0.08 }, // widest and thickest
      { width: 0.2, thickness: 0.04 },
    ];
    const layout = createMotionLayout(books);

    const maxShelvedHalfDepth = 0.3 * 0.5; // 0.15
    const expectedMaxRotationRadius = Math.hypot(0.3, 0.08) * 0.5 * 1.08;
    const expectedRotationLaneZ = -0.64 + maxShelvedHalfDepth + expectedMaxRotationRadius + 0.035;

    expect(layout.rotationLaneZ).toBeCloseTo(expectedRotationLaneZ);
  });

  it('should handle zero-sized books (edge cases)', () => {
    const books: MotionBookSize[] = [
      { width: 0, thickness: 0 },
    ];
    const layout = createMotionLayout(books);

    const maxShelvedHalfDepth = 0;
    const expectedMaxRotationRadius = 0;
    const expectedRotationLaneZ = -0.64 + maxShelvedHalfDepth + expectedMaxRotationRadius + 0.035;

    expect(layout.rotationLaneZ).toBeCloseTo(expectedRotationLaneZ);
  });

  it('should return fixed constants for layout', () => {
    const books: MotionBookSize[] = [
      { width: 0.1, thickness: 0.02 },
    ];
    const layout = createMotionLayout(books);
    expect(layout.shelvedZ).toBe(-0.64);
    expect(layout.presentedZ).toBe(0.4);
    expect(layout.presentedScale).toBe(1.035);
    expect(layout.collisionMargin).toBe(0.035);
  });
});
