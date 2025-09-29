/* Demo check script: registers a demo user, lists problems, submits a solution, fetches feedback. */
const http = require('http');

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {}
    };
    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        try {
          const parsed = chunks ? JSON.parse(chunks) : {};
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: { raw: chunks, parseError: e.message } });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const result = { steps: [] };
  try {
    // Health
    const health = await request('GET', '/health');
    result.health = health.body;
    
    // Register demo user
    const email = 'demo+' + Date.now() + '@example.com';
    const password = Math.random().toString(36).slice(2, 10) + 'Aa!1';
    const reg = await request('POST', '/api/auth/register', { username: 'DemoUser', email, password });
    if (reg.statusCode >= 400) throw new Error('Registration failed: ' + JSON.stringify(reg.body));
    const token = reg.body && reg.body.token;
    if (!token) throw new Error('No token returned from register');
    result.demoEmail = email;

    // List problems
    const probs = await request('GET', '/api/problems?limit=20', null, token);
    if (probs.statusCode >= 400) throw new Error('Problems list failed: ' + JSON.stringify(probs.body));
    result.problemsCount = (probs.body.problems || []).length;

    // Pick a problem and fetch details
    const list = probs.body.problems || [];
    let pid = (list.find(p => p.id === 'OER_MIT_001') || {}).id
           || (list.find(p => p.id === 'OER_OS_003') || {}).id
           || (list[0] && list[0].id);
    if (!pid) throw new Error('No problems available');
    const prob = await request('GET', '/api/problems/' + encodeURIComponent(pid), null, token);
    if (prob.statusCode >= 400) throw new Error('Fetch problem failed: ' + JSON.stringify(prob.body));
    result.usedProblemId = pid;

    // Craft submission (choose a solvable one without sqrt)
    let steps = [];
    let final = null;
    if (pid === 'OER_MIT_001') {
      steps = [{ formula: '(v - u)/t', variables: { u: 0, v: 30, t: 10 }, result: 3 }];
      final = { value: 3 };
    } else if (pid === 'OER_OS_003') {
      steps = [{ formula: 'V/R', variables: { V: 12, R: 4 }, result: 3 }];
      final = { value: 3 };
    } else {
      steps = [{ formula: '1 + 1', variables: {} , result: 2}];
    }

    // Submit
    const submit = await request('POST', '/api/problems/submit', { problemId: pid, steps, finalAnswer: final }, token);
    result.submission = submit.body;

    // Feedback
    const feedback = await request('POST', '/api/feedback', { problem: prob.body.problem, steps, finalAnswer: final }, token);
    result.feedbackItems = (feedback.body.feedback || []).slice(0, 5);

    console.log(JSON.stringify(result));
  } catch (err) {
    console.log(JSON.stringify({ error: err.message, result }));
    process.exit(1);
  }
})();
