// uso: node scripts/lh-summary.mjs <url> [mobile|desktop] [runs]
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, preset = 'mobile', runsArg = '3'] = process.argv.slice(2);
if (!url) { console.error('Uso: node scripts/lh-summary.mjs <url> [mobile|desktop] [runs]'); process.exit(1); }
const dir = mkdtempSync(join(tmpdir(), 'lh-'));
const rows = [];
for (let i = 0; i < Number(runsArg); i++) {
  const out = join(dir, `r${i}.json`);
  const args = ['lighthouse', url, '--output=json', `--output-path=${out}`,
    '--only-categories=performance', '--quiet', '--chrome-flags=--headless=new'];
  if (preset === 'desktop') args.push('--preset=desktop');
  execFileSync('npx', args, { stdio: 'ignore', shell: process.platform === 'win32' });
  const j = JSON.parse(readFileSync(out, 'utf8'));
  const a = j.audits;
  const reqs = a['network-requests']?.details?.items ?? [];
  rows.push({
    score: Math.round(j.categories.performance.score * 100),
    fcp: Math.round(a['first-contentful-paint'].numericValue),
    lcp: Math.round(a['largest-contentful-paint'].numericValue),
    tbt: Math.round(a['total-blocking-time'].numericValue),
    cls: +a['cumulative-layout-shift'].numericValue.toFixed(3),
    si: Math.round(a['speed-index'].numericValue),
    mainMs: Math.round(a['mainthread-work-breakdown']?.numericValue ?? 0),
    three: reqs.some((r) => /three-.*\.js/.test(r.url)),
  });
}
rows.sort((x, y) => x.score - y.score);
console.table(rows);
console.log('MEDIANA:', rows[Math.floor(rows.length / 2)]);
rmSync(dir, { recursive: true, force: true });
