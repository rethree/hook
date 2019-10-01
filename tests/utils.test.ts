import { isString, merge } from '../lib/utils';

test('isString properly detects strings', () => {
  const x = isString('a');
  expect(x).toBe(true);
});

test('isString properly detects non-strings', () => {
  const x = isString(42);
  expect(x).toBe(false);
});

test('isString properly detects non-strings', () => {
  const x = isString(42);
  expect(x).toBe(false);
});

test('merge accumulutes unreleted properties', () => {
  const x = { a: 42 };
  const y = merge(x, { b: 9001 });

  expect(y).toEqual({ a: 42, b: 9001 });
});

test('merge overrides clashing properties, from right to left', () => {
  const x = { a: 42 };
  const y = merge(x, { a: 9001 });

  expect(y).toEqual({ a: 9001 });
});

test('merge retains nested references', () => {
  const x = { a: 42, b: { a: 9001 } };
  const y = merge(x, { a: 9001 });

  expect(y).toEqual({ a: 9001, b: { a: 9001 } });
  expect(x.b).toBe(y.b);
});
