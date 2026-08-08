import { getSafeErrorMessage } from '../lib/validations';

describe('getSafeErrorMessage', () => {
  it('returns the exact message when the error is an Error instance and includes "Validation failed"', () => {
    const error = new Error('Validation failed: Some field is required');
    const result = getSafeErrorMessage(error);
    expect(result).toBe('Validation failed: Some field is required');
  });

  it('returns a generic message when the error is an Error instance but does not include "Validation failed"', () => {
    const error = new Error('Database connection failed');
    const result = getSafeErrorMessage(error);
    expect(result).toBe('An unexpected error occurred');
  });

  it('returns a generic message when the error is a string', () => {
    const error = 'Just a string error';
    const result = getSafeErrorMessage(error);
    expect(result).toBe('An unexpected error occurred');
  });

  it('returns a generic message when the error is an object', () => {
    const error = { message: 'Validation failed' }; // Not an instance of Error
    const result = getSafeErrorMessage(error);
    expect(result).toBe('An unexpected error occurred');
  });

  it('returns a generic message when the error is null', () => {
    const error = null;
    const result = getSafeErrorMessage(error);
    expect(result).toBe('An unexpected error occurred');
  });

  it('returns a generic message when the error is undefined', () => {
    const error = undefined;
    const result = getSafeErrorMessage(error);
    expect(result).toBe('An unexpected error occurred');
  });
});
