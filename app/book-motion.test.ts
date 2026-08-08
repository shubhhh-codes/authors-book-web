import { bookFootprintsOverlap, BookFootprint } from './book-motion';

describe('bookFootprintsOverlap', () => {
  const defaultBook: BookFootprint = {
    id: '1',
    x: 0,
    z: 0,
    yaw: 0,
    scale: 1,
    width: 2,
    thickness: 1,
  };

  it('returns false when left and right have the same id', () => {
    const left = { ...defaultBook };
    const right = { ...defaultBook };
    expect(bookFootprintsOverlap(left, right, 0)).toBe(false);
  });

  it('returns true when footprints are at the exact same position', () => {
    const right = { ...defaultBook, id: '2' };
    expect(bookFootprintsOverlap(defaultBook, right, 0)).toBe(true);
  });

  it('returns false when footprints are separated on the X axis without overlap', () => {
    const right = { ...defaultBook, id: '2', x: 3 };
    expect(bookFootprintsOverlap(defaultBook, right, 0)).toBe(false);
  });

  it('returns true when footprints overlap on the X axis', () => {
    const right = { ...defaultBook, id: '2', x: 1.5 };
    expect(bookFootprintsOverlap(defaultBook, right, 0)).toBe(true);
  });

  it('returns false when footprints are separated on the Z axis without overlap', () => {
    const right = { ...defaultBook, id: '2', z: 2 };
    expect(bookFootprintsOverlap(defaultBook, right, 0)).toBe(false);
  });

  it('returns true when footprints overlap on the Z axis', () => {
    const right = { ...defaultBook, id: '2', z: 0.8 };
    expect(bookFootprintsOverlap(defaultBook, right, 0)).toBe(true);
  });

  it('handles the margin parameter correctly (non-overlapping becomes overlapping)', () => {
    const right = { ...defaultBook, id: '2', x: 2.5 };
    expect(bookFootprintsOverlap(defaultBook, right, 0)).toBe(false);
    expect(bookFootprintsOverlap(defaultBook, right, 0.6)).toBe(true);
  });

  it('handles scaled books correctly', () => {
    const right = { ...defaultBook, id: '2', x: 3 };
    expect(bookFootprintsOverlap(defaultBook, right, 0)).toBe(false);

    const scaledLeft = { ...defaultBook, scale: 2 };
    const scaledRight = { ...right, scale: 2 };
    expect(bookFootprintsOverlap(scaledLeft, scaledRight, 0)).toBe(true);
  });

  it('handles rotation (yaw) applying SAT (Separating Axis Theorem) - overlapping', () => {
    const right = { ...defaultBook, id: '2', x: 1, z: 1, yaw: Math.PI / 4 };
    expect(bookFootprintsOverlap(defaultBook, right, 0)).toBe(true);
  });

  it('handles rotation (yaw) applying SAT - non-overlapping', () => {
    const right = { ...defaultBook, id: '2', x: 5, z: 5, yaw: Math.PI / 4 };
    expect(bookFootprintsOverlap(defaultBook, right, 0)).toBe(false);
  });
});
