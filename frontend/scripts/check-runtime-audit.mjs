import fs from 'node:fs/promises';

const [reportPath] = process.argv.slice(2);

if (!reportPath) {
  throw new Error('Usage: node scripts/check-runtime-audit.mjs <npm-audit-json-path>');
}

let report;
try {
  report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
} catch (error) {
  throw new Error(`Could not read a valid npm audit report at ${reportPath}`, { cause: error });
} finally {
  await fs.rm(reportPath, { force: true });
}

const approvedExceptions = new Set(['GHSA-hmx5-qpq5-p643']);
const severityRank = { low: 0, moderate: 1, high: 2, critical: 3 };
const unapproved = [];

for (const [name, vulnerability] of Object.entries(report.vulnerabilities ?? {})) {
  if (severityRank[vulnerability.severity] < severityRank.high) continue;

  const advisoryIds = vulnerability.via
    .filter((item) => typeof item === 'object' && item.url)
    .map((item) => item.url.split('/').at(-1));
  const unapprovedIds = advisoryIds.filter((id) => !approvedExceptions.has(id));

  if (unapprovedIds.length > 0) {
    unapproved.push(`${name}: ${vulnerability.severity} (${unapprovedIds.join(', ')})`);
  } else {
    console.warn(
      `Accepted security exception: ${name} ${vulnerability.severity} (${advisoryIds.join(', ')})`
    );
  }
}

if (unapproved.length > 0) {
  console.error(`Unapproved high/critical runtime advisories:\n${unapproved.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('No unapproved high/critical runtime advisories.');
}
