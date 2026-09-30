export const LOGIN_URL = 'https://apphub.lumenore.com/appsapi/secure/login-build';

// JWT expiry is only a cache hint; Lumenore validates the token on every request.
function cacheUntil(token, now) {
  let exp;
  try {
    exp = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).exp;
  } catch { /* Unknown token format: use a short cache lifetime. */ }
  if (Number.isFinite(exp)) {
    if (exp * 1000 <= now) throw new Error('Expired token');
    return exp * 1000 - 30000;
  }
  return now + 60000;
}

export function createTokenProvider(config, fetchImpl = fetch, now = Date.now) {
  let cached;
  let pending;
  let retryAfter = 0;
  const hasLogin = Boolean(config.email || config.password || config.tenantUuid);
  return {
    async getToken() {
      if (!hasLogin) {
        if (config.token) return config.token;
        throw new Error('Lumenore credentials are not configured.');
      }
      if (!config.email || !config.password || !config.tenantUuid) {
        throw new Error('Set LUMENORE_EMAIL, LUMENORE_PASSWORD and LUMENORE_TENANT_UUID on the server.');
      }
      if (cached && now() < cached.until) return cached.token;
      if (pending) return pending;
      if (now() < retryAfter) throw new Error('Lumenore login failed. Check server credentials and retry after 30 seconds.');
      pending = (async () => {
        try {
          const response = await fetchImpl(LOGIN_URL, {
            method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ email: config.email, password: config.password, tenantUuid: config.tenantUuid }),
          });
          if (!response.ok) throw new Error('Login rejected');
          const body = await response.json();
          if (typeof body?.token !== 'string' || !body.token.trim() || /\s/.test(body.token)) throw new Error('Missing token');
          cached = { token: body.token, until: cacheUntil(body.token, now()) };
          return cached.token;
        } catch {
          cached = undefined;
          retryAfter = now() + 30000;
          // Never expose upstream responses or credentials to the browser/logs.
          throw new Error('Lumenore login failed. Check server credentials, tenant and connection; retry after 30 seconds.');
        }
      })();
      try { return await pending; } finally { pending = undefined; }
    },
    invalidate(token) {
      if (cached?.token === token) cached = undefined;
    },
  };
}
