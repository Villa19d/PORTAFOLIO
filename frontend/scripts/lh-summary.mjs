// uso: node scripts/lh-summary.mjs <url> [mobile|desktop] [runs]
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url, preset = 'mobile', runsArg = '3'] = process.argv.slice(2);
if (!url) { console.error('Uso: node scripts/lh-summary.mjs <url> [mobile|desktop] [runs]'); process.exit(1); }
const dir = mkdtempSync(join(tmpdir(), 'lh-'));
const rows = [];
const details = [];

function originOf(target) {
  try { return new URL(target).origin; } catch { return '?'; }
}

/** Path for same-origin files, host + path for third parties, middle-truncated. */
function shortUrl(target, pageOrigin) {
  let parsed;
  try { parsed = new URL(target); } catch { return String(target).slice(0, 58); }
  const tail = `${parsed.pathname}${parsed.search}`;
  const label = parsed.origin === pageOrigin ? tail : `${parsed.host}${tail}`;
  return label.length > 58 ? `${label.slice(0, 24)}…${label.slice(-32)}` : label;
}

/**
 * LCP element and its phases, when the report carries them.
 * Lighthouse >= 12 moved this to the `lcp-breakdown-insight` (list of a table + a
 * node); older versions exposed `largest-contentful-paint-element`.
 */
function lcpDetails(audits) {
  const sources = [audits['lcp-breakdown-insight'], audits['largest-contentful-paint-element']];
  let element = '';
  let phases = [];
  for (const audit of sources) {
    const items = audit?.details?.items ?? [];
    for (const item of items) {
      if (!element && item?.node) element = item.node.snippet ?? item.node.selector ?? '';
      for (const row of item?.items ?? []) {
        const ms = row?.duration ?? row?.timing;
        if (typeof ms !== 'number') continue;
        phases.push({ fase: row.label ?? row.phase ?? row.subpart ?? '?', ms: Math.round(ms) });
      }
    }
    if (element || phases.length) break;
    phases = [];
  }
  return { element: element.length > 90 ? `${element.slice(0, 90)}…` : element, phases };
}

for (let i = 0; i < Number(runsArg); i++) {
  const out = join(dir, `r${i}.json`);
  const args = ['lighthouse', url, '--output=json', `--output-path=${out}`,
    '--only-categories=performance', '--quiet', '--chrome-flags=--headless=new'];
  if (preset === 'desktop') args.push('--preset=desktop');
  execFileSync('npx', args, { stdio: 'ignore', shell: process.platform === 'win32' });
  const j = JSON.parse(readFileSync(out, 'utf8'));
  const a = j.audits;
  const reqs = a['network-requests']?.details?.items ?? [];
  const pageOrigin = originOf(j.finalDisplayedUrl ?? j.requestedUrl ?? url);
  const transferKb = reqs.reduce((sum, r) => sum + (r.transferSize ?? 0), 0) / 1024;
  const lcp = lcpDetails(a);
  // Lighthouse >= 12 names these networkRequestTime / networkEndTime.
  const startOf = (r) => r.networkRequestTime ?? r.startTime;
  const endOf = (r) => r.networkEndTime ?? r.endTime;
  const late = reqs
    .filter((r) => typeof endOf(r) === 'number')
    .sort((x, y) => endOf(y) - endOf(x))
    .slice(0, 8)
    .map((r) => ({
      peticion: shortUrl(r.url, pageOrigin),
      origen: originOf(r.url) === pageOrigin ? 'mismo' : originOf(r.url),
      kb: +((r.transferSize ?? 0) / 1024).toFixed(1),
      inicio: Math.round(startOf(r) ?? 0),
      fin: Math.round(endOf(r)),
    }));
  rows.push({
    score: Math.round(j.categories.performance.score * 100),
    fcp: Math.round(a['first-contentful-paint'].numericValue),
    lcp: Math.round(a['largest-contentful-paint'].numericValue),
    tbt: Math.round(a['total-blocking-time'].numericValue),
    cls: +a['cumulative-layout-shift'].numericValue.toFixed(3),
    si: Math.round(a['speed-index'].numericValue),
    mainMs: Math.round(a['mainthread-work-breakdown']?.numericValue ?? 0),
    three: reqs.some((r) => /three-.*\.js/.test(r.url)),
    ttfb: Math.round(a['server-response-time']?.numericValue ?? 0),
    reqs: reqs.length,
    kb: Math.round(transferKb),
  });
  details.push({ run: i + 1, lcpElement: lcp.element, lcpPhases: lcp.phases, late });
}
console.log(`URL: ${url} | preset: ${preset} | corridas: ${runsArg}`);
rows.sort((x, y) => x.score - y.score);
console.table(rows);
console.log('MEDIANA:', rows[Math.floor(rows.length / 2)]);
for (const d of details) {
  console.log(`\n=== Corrida ${d.run} ===`);
  console.log(`LCP element: ${d.lcpElement || '(el informe no lo trae)'}`);
  if (d.lcpPhases.length) console.table(d.lcpPhases);
  else console.log('LCP fases: (el informe no las trae)');
  console.log('8 peticiones que terminan más tarde:');
  console.table(d.late);
}
rmSync(dir, { recursive: true, force: true });
