import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, '../src/data/cv.snapshot.json');

const API_URL = process.env.API_URL || process.env.VITE_API_URL;

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidCvDocument(value) {
  if (value === null) {
    return true;
  }
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.url === 'string' &&
    typeof value.fileName === 'string'
  );
}

export function isValidCvState(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    'es' in value &&
    'en' in value &&
    isValidCvDocument(value.es) &&
    isValidCvDocument(value.en)
  );
}

export async function fetchCvWithRetry(
  url,
  attempts = 3,
  retryDelayMs = 10000,
  timeoutMs = 30000,
  injectedDelay = delay,
) {
  let lastError = 'UNKNOWN';

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[Attempt ${attempt}] Fetching CV...`);
      const response = await fetch(`${url}/api/cv`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!isValidCvState(data)) {
        throw new Error('Invalid data format: expected { es, en }');
      }

      console.log(`[Attempt ${attempt}] Success.`);
      return { action: 'UPDATE', data };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error.message;
      console.warn(`[Attempt ${attempt}] Failed: ${error.message}`);
      if (attempt < attempts) {
        console.log(`Waiting ${retryDelayMs}ms before next attempt...`);
        await injectedDelay(retryDelayMs);
      }
    }
  }

  console.warn(`Exhausted ${attempts} attempts.`);
  return { action: 'KEEP_EXISTING', reason: lastError };
}

async function main() {
  if (!API_URL) {
    console.log('API_URL not set. Skipping CV snapshot update.');
    return;
  }

  console.log(`Fetching CV snapshot from ${API_URL}...`);
  try {
    const result = await fetchCvWithRetry(API_URL);

    if (result.action === 'UPDATE') {
      await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(result.data, null, 2), 'utf-8');
      console.log('CV snapshot updated successfully.');
    } else {
      console.warn(`Keeping existing CV snapshot. Reason: ${result.reason}`);
      process.exit(0);
    }
  } catch (error) {
    console.warn(`Unexpected error: ${error.message}`);
    console.warn('Keeping existing CV snapshot.');
    process.exit(0);
  }
}

if (process.argv[1] === __filename) {
  main();
}
