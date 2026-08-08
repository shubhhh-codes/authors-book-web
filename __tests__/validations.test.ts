import { escapeRegex } from '../lib/validations';

describe('escapeRegex', () => {
  it('escapes special characters', () => {
    const input = 'a.b*c+d?e^f$g{h}i|j[k]l\\m';
    const expected = 'a\\.b\\*c\\+d\\?e\\^f\\$g\\{h\\}i\\|j\\[k\\]l\\\\m';
    expect(escapeRegex(input)).toBe(expected);
  });

  it('leaves strings without special characters unchanged', () => {
    const input = 'hello world 123';
    expect(escapeRegex(input)).toBe(input);
  });

  it('works with empty strings', () => {
    expect(escapeRegex('')).toBe('');
  });
});
