import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, '../src/data/projects.snapshot.json');

const API_URL = process.env.API_URL || process.env.VITE_API_URL;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchProjectsWithRetry(url, retries = 3, timeoutMs = 15000) {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${url}/api/projects`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Basic validation
      if (!Array.isArray(data) || (data.length > 0 && (!data[0].id || !data[0].slug))) {
        throw new Error('Invalid data format received from API');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`Attempt ${i + 1} failed: ${error.message}`);
      if (i === retries - 1) throw error;
      await delay(2000 * (i + 1)); // Backoff
    }
  }
}

async function main() {
  if (!API_URL) {
    console.log('API_URL not set. Skipping project snapshot update.');
    return;
  }

  console.log(`Fetching project snapshot from ${API_URL}...`);
  try {
    const data = await fetchProjectsWithRetry(API_URL);
    await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Project snapshot updated successfully.');
  } catch (error) {
    console.warn(`Failed to update project snapshot: ${error.message}`);
    console.warn('Keeping existing snapshot.');
    // Exit code 0 to not break the build
    process.exit(0);
  }
}

// Only run main if called directly (not imported in tests)
if (process.argv[1] === __filename) {
  main();
}
