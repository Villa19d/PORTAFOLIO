import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, '../src/data/projects.snapshot.json');

const API_URL = process.env.API_URL || process.env.VITE_API_URL;

export async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchProjectsWithRetry(
  url,
  budgetMs = 90000,
  retryDelayMs = 10000,
  timeoutMs = 20000,
  injectedDelay = delay,
  injectedGetTime = Date.now
) {
  const startTime = injectedGetTime();
  let attempt = 0;

  while (injectedGetTime() - startTime < budgetMs) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[Attempt ${attempt}] Fetching projects...`);
      const response = await fetch(`${url}/api/projects`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Basic validation based on contract
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: Expected an array');
      }

      if (data.length === 0) {
        console.warn(`[Attempt ${attempt}] API returned an empty array.`);
        return { action: 'KEEP_EXISTING', reason: 'EMPTY_ARRAY' };
      }

      // Check min keys on all items
      for (const p of data) {
        if (!p.slug || !p.title?.es || !p.title?.en || !p.techStack || p.imageUrl === undefined || p.repoUrl === undefined) {
           throw new Error('Invalid data format: Missing required project keys');
        }
      }

      console.log(`[Attempt ${attempt}] Success in ${injectedGetTime() - startTime}ms.`);
      return { action: 'UPDATE', data };
    } catch (error) {
      clearTimeout(timeoutId);
      const elapsed = injectedGetTime() - startTime;
      
      console.warn(`[Attempt ${attempt}] Failed after ${elapsed}ms: ${error.message}`);
      
      if (injectedGetTime() - startTime + retryDelayMs >= budgetMs) {
         break;
      }
      
      console.log(`Waiting ${retryDelayMs}ms before next attempt...`);
      await injectedDelay(retryDelayMs);
    }
  }
  
  console.warn(`Exhausted time budget of ${budgetMs}ms.`);
  return { action: 'KEEP_EXISTING', reason: 'BUDGET_EXHAUSTED' };
}

async function main() {
  if (!API_URL) {
    console.log('API_URL not set. Skipping project snapshot update.');
    return;
  }

  console.log(`Fetching project snapshot from ${API_URL}...`);
  try {
    const result = await fetchProjectsWithRetry(API_URL);
    
    if (result.action === 'UPDATE') {
      await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(result.data, null, 2), 'utf-8');
      console.log('Project snapshot updated successfully.');
    } else {
      console.warn(`Keeping existing snapshot. Reason: ${result.reason}`);
      process.exit(0);
    }
  } catch (error) {
    console.warn(`Unexpected error: ${error.message}`);
    console.warn('Keeping existing snapshot.');
    process.exit(0);
  }
}

// Only run main if called directly (not imported in tests)
if (process.argv[1] === __filename) {
  main();
}
