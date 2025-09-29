/* Create a demo user with a known password and output the email only. */
const http = require('http');

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = { hostname: 'localhost', port: 3000, path, method, headers: {} };
    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(chunks || '{}') }); }
        catch (e) { resolve({ statusCode: res.statusCode, body: { raw: chunks, parseError: e.message } }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const email = `demo.web.${Date.now()}@example.com`;
  const password = 'BrainVaultDemo!1';
  try {
    const reg = await request('POST', '/api/auth/register', { username: 'WebDemo', email, password });
    if (reg.statusCode >= 400) {
      console.log(JSON.stringify({ error: 'register_failed', details: reg.body }));
      process.exit(1);
    }
    const login = await request('POST', '/api/auth/login', { email, password });
    if (login.statusCode >= 400) {
      console.log(JSON.stringify({ error: 'login_failed', details: login.body }));
      process.exit(1);
    }
    console.log(JSON.stringify({ email }));
  } catch (e) {
    console.log(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
})();
