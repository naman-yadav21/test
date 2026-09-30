import { createServer } from 'node:http';
import { createTokenProvider } from './auth.mjs';
import { createVendor, createBusinessUnit, createDepartment, createBusinessCategory } from './lumenore.mjs';

try { process.loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const config = { auth: createTokenProvider({
  token: process.env.LUMENORE_TOKEN,
  email: process.env.LUMENORE_EMAIL,
  password: process.env.LUMENORE_PASSWORD,
  tenantUuid: process.env.LUMENORE_TENANT_UUID,
}) };
// Local development bridge only. Production requires application authentication.
createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, body) => { res.writeHead(status); res.end(JSON.stringify(body)); };
  const handler = req.url === '/api/vendors' ? createVendor : req.url === '/api/business-units' ? createBusinessUnit : req.url === '/api/departments' ? createDepartment : req.url === '/api/business-categories' ? createBusinessCategory : null;
  if (!handler) return send(404, { message: 'Not found.' });
  if (req.method !== 'POST') return send(405, { message: 'Method not allowed.' });
  const allowedOrigin = process.env.APP_ORIGIN || 'http://localhost:5173';
  if (req.headers.origin && req.headers.origin !== allowedOrigin) return send(403, { message: 'Origin not allowed.' });
  if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { message: 'JSON required.' });
  let raw = '';
  try {
    for await (const chunk of req) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 24000) return send(413, { message: 'Submitted details are too large.' });
    }
    const result = await handler(JSON.parse(raw), config);
    send(result.status, result.body);
  } catch {
    send(400, { message: 'Invalid details. Check the required fields.' });
  }
}).listen(3001, '127.0.0.1', () => console.log('Local vendor API: http://127.0.0.1:3001'));
