import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicWebUrl } from './validation.ts';
test('imports accept webpages and public AI chat share URLs', () => {
  assert.equal(publicWebUrl('https://www.energy.gov/solar'), 'https://www.energy.gov/solar');
  assert.equal(publicWebUrl('https://chatgpt.com/share/example'), 'https://chatgpt.com/share/example');
});
test('imports reject private network URLs, credentials and non-web protocols', () => {
  for (const url of ['http://127.0.0.1', 'http://169.254.169.254', 'http://localhost', 'http://private.internal', 'http://[::1]', 'https://user:password@example.com', 'javascript:alert(1)']) assert.throws(() => publicWebUrl(url));
});