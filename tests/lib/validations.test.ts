import { test, describe } from 'node:test';
import assert from 'node:assert';
import { errorResponse, successResponse } from '../../lib/validations.ts';

describe('Response Helpers', () => {
  describe('errorResponse', () => {
    test('returns default status 400 with provided message', async () => {
      const res = errorResponse('Bad Request');
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.deepStrictEqual(json, { error: 'Bad Request' });
    });

    test('returns provided custom status code', async () => {
      const res = errorResponse('Not Found', 404);
      assert.strictEqual(res.status, 404);
      const json = await res.json();
      assert.deepStrictEqual(json, { error: 'Not Found' });
    });

    test('returns 500 when status is explicitly set to 500', async () => {
      const res = errorResponse('Server Error', 500);
      assert.strictEqual(res.status, 500);
      const json = await res.json();
      assert.deepStrictEqual(json, { error: 'Server Error' });
    });
  });

  describe('successResponse', () => {
    test('returns default status 200 with data', async () => {
      const data = { id: 1, name: 'Test' };
      const res = successResponse(data);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.deepStrictEqual(json, data);
    });

    test('returns provided custom status code', async () => {
      const data = { id: 1, name: 'Created' };
      const res = successResponse(data, 201);
      assert.strictEqual(res.status, 201);
      const json = await res.json();
      assert.deepStrictEqual(json, data);
    });
  });
});
