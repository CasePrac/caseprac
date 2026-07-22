import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmissionUrl } from '../src/ssrf.ts';

test('SSRF Validator - rejects invalid protocols', async () => {
  await assert.rejects(
    async () => {
      await validateSubmissionUrl('ftp://example.com');
    },
    {
      name: 'AppError',
      message: "URL 'ftp://example.com' rejected for security reasons: Only http and https protocols are allowed",
    }
  );
});

test('SSRF Validator - rejects invalid URL strings', async () => {
  await assert.rejects(
    async () => {
      await validateSubmissionUrl('not-a-valid-url');
    },
    {
      name: 'AppError',
    }
  );
});

test('SSRF Validator - allows valid public HTTPS URL', async () => {
  delete process.env.ALLOW_LOCAL_URLS;
  delete process.env.NODE_ENV;

  const result = await validateSubmissionUrl('https://example.com');
  assert.ok(result.url);
  assert.equal(result.url.hostname, 'example.com');
});
