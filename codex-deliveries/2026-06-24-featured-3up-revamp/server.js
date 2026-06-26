
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = "C:\\Users\\Administrator\\Documents\\大脉\\codex-deliveries\\2026-06-24-featured-3up-revamp";
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};
http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/preview.html';
  const f = path.join(ROOT, p);
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    const ext = path.extname(f);
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(8765, '127.0.0.1', () => console.log('READY'));
