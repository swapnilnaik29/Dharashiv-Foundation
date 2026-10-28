/**
 * Dharashiv Foundation - Local Development Server
 * Zero-dependency native Node.js HTTP server supporting ES modules,
 * proper MIME types, and clean local testing.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // Normalize URL
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  // If root or directory, try index.html
  if (pathname.endsWith('/')) {
    pathname += 'index.html';
  } else if (!path.extname(pathname)) {
    // Check if directory exists
    const fullDirPath = path.join(__dirname, pathname);
    if (fs.existsSync(fullDirPath) && fs.statSync(fullDirPath).isDirectory()) {
      pathname += '/index.html';
    } else if (fs.existsSync(fullDirPath + '.html')) {
      pathname += '.html';
    }
  }

  const filePath = path.normalize(path.join(__dirname, pathname));

  // Security check: ensure path stays within project root
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>404 - Not Found | Dharashiv Foundation</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #FAF8F5; color: #1D1D1F; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: white; padding: 2rem 2.5rem; border-radius: 12px; border: 1px solid #E8E1DA; box-shadow: 0 4px 20px rgba(112,37,7,0.08); text-align: center; max-width: 480px; }
    h1 { color: #A83208; margin-bottom: 0.5rem; }
    p { color: #777783; line-height: 1.5; }
    a { display: inline-block; margin-top: 1rem; padding: 0.6rem 1.2rem; background: #FF7A18; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; }
    a:hover { background: #A83208; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Page Not Found (404)</h1>
    <p>The requested file <code>${pathname}</code> could not be found on the Dharashiv Foundation server.</p>
    <a href="/index.html">Return to Home</a>
  </div>
</body>
</html>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(`  Dharashiv Foundation Web Application Running`);
  console.log(`  Local URL: http://${HOST}:${PORT}`);
  console.log(`  Root:      ${__dirname}`);
  console.log(`=======================================================`);
});
