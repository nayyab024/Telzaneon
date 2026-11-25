const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const port = Number(process.env.PORT || 4879);
const host = process.env.HOST || '127.0.0.1';
// Where form submissions are stored, one JSON object per line.
const dataDir = path.resolve(process.env.TELZA_DATA_DIR || path.join(root, 'data'));
// Optional: every submission is also POSTed here as JSON (Zapier, Make, Slack, n8n, a CRM...).
const webhook = process.env.TELZA_WEBHOOK_URL || '';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg'
};
const routes = {
  '/': '/index.html', '/book': '/book.html', '/demo': '/demo.html',
  // Product pages, at the same addresses as the reference site.
  '/fillo': '/fillo.html', '/ai-voice-agents': '/ai-voice-agent.html', '/inbound-ai-voice-agents': '/inbound-calling.html',
  '/outbound-ai-calling': '/outbound-calling.html', '/whatsapp-automation': '/whatsapp-automation.html',
  '/ecommerce-ai-chatbot': '/ecommerce-ai-chatbot.html', '/ai-automation': '/ai-automation.html',
  // Industry pages.
  '/industries/healthcare': '/industries/healthcare.html', '/industries/real-estate': '/industries/real-estate.html',
  '/industries/ecommerce': '/industries/ecommerce.html', '/industries/finance': '/industries/finance.html',
  '/industries/hospitality': '/industries/hospitality.html', '/industries/logistics': '/industries/logistics.html'
};
// Never serve server-side files or stored submissions.
const privatePaths = [/^\/data\//, /^\/server\.cjs$/, /^\/package(-lock)?\.json$/, /^\/\.git/, /^\/node_modules\//];
const security = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), geolocation=()'
};

/* ---------- Forms ---------- */
const clean = (value, max = 300) => (typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : '');
const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
const isPhone = value => value.replace(/\D/g, '').length >= 7;

const forms = {
  booking(body) {
    const entry = {
      name: clean(body.name, 120), email: clean(body.email, 200), phone: clean(body.phone, 40),
      company: clean(body.company, 160), website: clean(body.website, 200), volume: clean(body.volume, 40),
      interests: Array.isArray(body.interests) ? body.interests.map(x => clean(x, 60)).filter(Boolean).slice(0, 20) : [],
      date: clean(body.date, 10), time: clean(body.time, 5), timezone: clean(body.timezone, 64),
      meeting: clean(body.meeting, 40), message: clean(body.message, 2000), page: clean(body.page, 300)
    };
    const errors = [];
    if (entry.name.length < 2) errors.push('name');
    if (!isEmail(entry.email)) errors.push('email');
    if (!isPhone(entry.phone)) errors.push('phone');
    if (!entry.interests.length) errors.push('interests');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) errors.push('date');
    if (!/^\d{2}:\d{2}$/.test(entry.time)) errors.push('time');
    if (body.consent !== true) errors.push('consent');
    return { entry, errors };
  },
  'demo-request'(body) {
    const entry = {
      type: clean(body.type, 40) || 'voice-outbound', name: clean(body.name, 120), phone: clean(body.phone, 40),
      email: clean(body.email, 200), useCase: clean(body.useCase, 80), page: clean(body.page, 300)
    };
    const errors = [];
    if (entry.name.length < 2) errors.push('name');
    if (!isPhone(entry.phone)) errors.push('phone');
    if (!isEmail(entry.email)) errors.push('email');
    if (body.consent !== true) errors.push('consent');
    return { entry, errors };
  }
};

// A small per-address limit keeps the forms from being flooded.
const hits = new Map();
function limited(ip) {
  const now = Date.now(), recent = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 8;
}

function json(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { ...security, 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(text), 'Cache-Control': 'no-store' });
  res.end(text);
}

function readBody(req, limit = 32 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', chunk => { size += chunk.length; if (size > limit) { reject(Object.assign(new Error('Too large'), { status: 413 })); req.destroy(); } else chunks.push(chunk); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function forward(record) {
  if (!webhook) return;
  try {
    const response = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record), signal: AbortSignal.timeout(8000) });
    if (!response.ok) console.error(`Webhook responded ${response.status} for ${record.id}`);
  } catch (error) {
    console.error(`Webhook failed for ${record.id}: ${error.message}`);
  }
}

async function handleForm(req, res, kind) {
  if (!(req.headers['content-type'] || '').includes('application/json')) return json(res, 415, { ok: false, error: 'json-required' });
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  if (limited(ip)) return json(res, 429, { ok: false, error: 'too-many-requests' });
  let body;
  try { body = JSON.parse(await readBody(req)); } catch (error) { return json(res, error.status || 400, { ok: false, error: 'invalid-body' }); }
  if (!body || typeof body !== 'object') return json(res, 400, { ok: false, error: 'invalid-body' });
  // Bots fill the hidden field. Pretend success; store nothing.
  if (clean(body.company_site)) return json(res, 200, { ok: true });
  const { entry, errors } = forms[kind](body);
  if (errors.length) return json(res, 422, { ok: false, error: 'invalid-fields', fields: errors });
  const record = { id: crypto.randomUUID(), form: kind, receivedAt: new Date().toISOString(), ...entry, userAgent: clean(req.headers['user-agent'], 300) };
  try {
    await fs.promises.mkdir(dataDir, { recursive: true });
    await fs.promises.appendFile(path.join(dataDir, 'submissions.ndjson'), JSON.stringify(record) + '\n', 'utf8');
  } catch (error) {
    console.error('Could not store submission:', error.message);
    if (!webhook) return json(res, 500, { ok: false, error: 'storage' });
  }
  console.log(`New ${kind} ${record.id} from ${entry.email || entry.phone}`);
  await forward(record);
  json(res, 200, { ok: true, id: record.id });
}

/* ---------- Static files ---------- */
function serveStatic(req, res, pathname) {
  const target = path.resolve(root, '.' + (routes[pathname] || pathname));
  const relative = '/' + path.relative(root, target).split(path.sep).join('/');
  const type = types[path.extname(target)];
  if (!target.startsWith(root + path.sep) || !type || privatePaths.some(p => p.test(relative))) return notFound(res);
  fs.stat(target, (error, stat) => {
    if (error || !stat.isFile()) return notFound(res);
    res.writeHead(200, { ...security, 'Content-Type': type, 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(target);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  });
}
function notFound(res) {
  res.writeHead(404, { ...security, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found — Telza AI</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#050916;color:#f0f4fc;font:16px/1.6 Inter,Arial,sans-serif;text-align:center"><div><p style="color:#5de4f1;letter-spacing:.16em;font-size:12px">404</p><h1 style="font-weight:450;letter-spacing:-.04em">This page doesn’t exist.</h1><p><a style="color:#83b9ff" href="/">Back to Telza</a></p></div>');
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }
  const api = pathname.match(/^\/api\/(booking|demo-request)\/?$/);
  if (api) {
    if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }); res.end(); return; }
    handleForm(req, res, api[1]).catch(error => { console.error(error); if (!res.headersSent) json(res, 500, { ok: false, error: 'server' }); });
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }
  // "/fillo/" → "/fillo", so the page's relative asset paths keep working.
  if (pathname.length > 1 && pathname.endsWith('/') && routes[pathname.slice(0, -1)]) {
    res.writeHead(301, { ...security, Location: pathname.slice(0, -1) });
    res.end();
    return;
  }
  serveStatic(req, res, pathname);
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is in use. Stop the existing server and run npm start again.`
    : error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.log(`Telza website: http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`);
  console.log(webhook ? 'Form submissions: stored in data/ and sent to TELZA_WEBHOOK_URL.' : 'Form submissions: stored in data/submissions.ndjson. Set TELZA_WEBHOOK_URL to forward them.');
});
