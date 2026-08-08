import { z } from 'zod';
import { parseRequestBody } from '../lib/validations';

describe('parseRequestBody', () => {
  it('should parse valid body', async () => {
    const request = {
      json: async () => ({ name: 'test' })
    } as Request;
    const schema = z.object({ name: z.string() });
    const result = await parseRequestBody(request, schema);
    expect(result).toEqual({ name: 'test' });
  });

  it('should throw validation error on invalid body', async () => {
    const request = {
      json: async () => ({ name: 123 })
    } as Request;
    const schema = z.object({ name: z.string() });

    await expect(parseRequestBody(request, schema)).rejects.toThrow('Validation failed: name: Expected string, received number');
  });

  it('should throw original error if json fails', async () => {
    const request = {
      json: async () => { throw new Error('Network error'); }
    } as Request;
    const schema = z.object({ name: z.string() });

    await expect(parseRequestBody(request, schema)).rejects.toThrow('Network error');
  });
});
