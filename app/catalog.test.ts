import { findBookIndexBySlug } from './catalog';

describe('findBookIndexBySlug', () => {
  it('should find the exact match of an existing book by its slug', () => {
    const index = findBookIndexBySlug('think-like-a-monk');
    expect(index).toBeGreaterThanOrEqual(0);
  });

  it('should find a match with uppercase letters', () => {
    const index = findBookIndexBySlug('THINK-LIKE-A-MONK');
    expect(index).toBeGreaterThanOrEqual(0);
  });

  it('should find a match with extra spaces', () => {
    const index = findBookIndexBySlug('  think-like-a-monk  ');
    expect(index).toBeGreaterThanOrEqual(0);
  });

  it('should find a match with URI-encoded characters', () => {
    const index = findBookIndexBySlug('think-like-a%2Dmonk');
    expect(index).toBeGreaterThanOrEqual(0);
  });

  it('should return -1 for non-existent books', () => {
    const index = findBookIndexBySlug('non-existent-book');
    expect(index).toBe(-1);
  });

  it('should return -1 for empty inputs', () => {
    const index = findBookIndexBySlug('');
    expect(index).toBe(-1);
  });
});
