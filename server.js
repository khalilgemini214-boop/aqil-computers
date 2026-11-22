/* Local preview server for the generated web build. Usage: node server.js [port] */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, process.argv[3] || 'dist');
const port = parseInt(process.argv[2] || '4177', 10);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = path.join(root, url === '/' ? 'index.html' : url);
  if (!file.startsWith(root)) { res.writeHead(403).end('Forbidden'); return; }
  fs.stat(file, (err, stat) => {
    if (!err && stat.isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err2, data) => {
      if (err2) {
        fs.readFile(path.join(root, 'index.html'), (err3, fallback) => {
          if (err3) { res.writeHead(404).end('Not found'); return; }
          res.writeHead(200, { 'Content-Type': types['.html'], 'Cache-Control': 'no-store' });
          res.end(fallback);
        });
        return;
      }
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {
        'Content-Type': types[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'Service-Worker-Allowed': '/'
      });
      res.end(data);
    });
  });
}).listen(port, '127.0.0.1', () => console.log('http://127.0.0.1:' + port + '/'));
