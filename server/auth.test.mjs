import test from 'node:test';
import assert from 'node:assert/strict';
import { createTokenProvider, LOGIN_URL } from './auth.mjs';
import { createVendor } from './lumenore.mjs';

const credentials = { email: 'example@example.com', password: ' test#password ', tenantUuid: 'test-tenant' };
const jwt = exp => `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`;

test('login sends exact credentials, shares concurrent requests and renews before expiry', async () => {
  let time = 1000000;
  let calls = 0;
  const auth = createTokenProvider(credentials, async (url, options) => {
    calls++;
    assert.equal(url, LOGIN_URL);
    assert.equal(options.redirect, 'error');
    assert.deepEqual(JSON.parse(options.body), credentials);
    return Response.json({ token: jwt(time / 1000 + 120) });
  }, () => time);
  const tokens = await Promise.all([auth.getToken(), auth.getToken()]);
  assert.equal(tokens[0], tokens[1]);
  assert.equal(calls, 1);
  await auth.getToken();
  assert.equal(calls, 1);
  time += 91000;
  assert.notEqual(await auth.getToken(), tokens[0]);
  assert.equal(calls, 2);
});

test('missing/partial credentials block login; manual token is an explicit fallback', async () => {
  const noFetch = () => assert.fail('No network call expected');
  await assert.rejects(createTokenProvider({}, noFetch).getToken());
  await assert.rejects(createTokenProvider({ email: 'x', token: 'old' }, noFetch).getToken());
  assert.equal(await createTokenProvider({ token: 'manual' }, noFetch).getToken(), 'manual');
});

test('failed, invalid and expired login responses block writes, redact errors and throttle retries', async () => {
  for (const makeResponse of [
    () => new Response('secret upstream detail', { status: 401 }),
    () => Response.json({ tenant: {} }),
    () => Response.json({ token: jwt(1) }),
    () => Response.json({ token: ' ' }),
    () => { throw new Error('secret upstream detail'); },
  ]) {
    let calls = 0;
    const auth = createTokenProvider(credentials, async () => { calls++; return makeResponse(); });
    const result = await createVendor({ name: 'Example' }, { auth }, () => assert.fail('No write after login failure'));
    assert.equal(result.status, 503);
    assert.equal(result.body.uncertain, false);
    await assert.rejects(auth.getToken(), error => !error.message.includes('secret upstream detail'));
    assert.equal(calls, 1);
  }
});

test('401 invalidates cached login for next submission without replaying the write', async () => {
  let logins = 0;
  let writes = 0;
  const auth = createTokenProvider(credentials, async () => Response.json({ token: `token-${++logins}` }));
  const result = await createVendor({ name: 'Example' }, { auth }, async (url, options) => {
    writes++;
    assert.equal(options.headers.Authorization, 'Bearer token-1');
    return new Response('', { status: 401 });
  });
  assert.equal(result.body.uncertain, true);
  assert.equal(writes, 1);
  assert.equal(await auth.getToken(), 'token-2');
});

test('ambiguous workflow failures never trigger another login or insert', async () => {
  let logins = 0;
  let writes = 0;
  const auth = createTokenProvider(credentials, async () => { logins++; return Response.json({ token: 'cached' }); });
  const result = await createVendor({ name: 'Example' }, { auth }, async () => { writes++; throw new Error('timeout'); });
  assert.equal(result.body.uncertain, true);
  assert.equal(await auth.getToken(), 'cached');
  assert.equal(logins, 1);
  assert.equal(writes, 1);
});
