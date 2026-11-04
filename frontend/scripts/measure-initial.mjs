import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const read = (f) => readFileSync(`dist/assets/${f}`);
const html = readFileSync('dist/index.html', 'utf8');
const entry = html.match(/<script type="module"[^>]*src="\/assets\/([^"]+)"/)[1];
const preloads = [...html.matchAll(/rel="modulepreload"[^>]*href="\/assets\/([^"]+)"/g)].map((m) => m[1]);
const boot = [...read(entry).toString('utf8').matchAll(/import\("\.\/((?:App|AppProviders)-[^"]+\.js)"\)/g)].map((m) => m[1]);

const seen = new Set();
const walk = (file) => {
  if (seen.has(file)) return;
  seen.add(file);
  for (const m of read(file).toString('utf8').matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)) walk(m[1]);
};
[entry, ...preloads, ...boot].forEach(walk);

const rows = [...seen].map((file) => ({ file, gzip: gzipSync(read(file)).length }));
console.table(rows);
console.log('TOTAL pre-render gzip:', rows.reduce((sum, row) => sum + row.gzip, 0));
