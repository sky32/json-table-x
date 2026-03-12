const fs = require('fs');
const path = require('path');
const src = path.resolve(__dirname, '..', 'dist', 'json-table-x.min.js');
const dstDir = path.resolve(__dirname, '..', 'demo', 'dist');
const dst = path.join(dstDir, 'json-table-x.min.js');
if (!fs.existsSync(src)) {
  console.error('[copy-dist] source not found:', src);
  process.exit(1);
}
fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, dst);
console.log('[copy-dist] copied to', dst);

