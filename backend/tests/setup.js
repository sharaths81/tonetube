import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, '../temp');

// Mock setup before running any tests
beforeAll(() => {
  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
});

afterAll(() => {
  // Clean up any test artifacts
  try {
    const files = fs.readdirSync(TEMP_DIR);
    for (const file of files) {
      if (file !== 'metadata.json') {
        const filePath = path.join(TEMP_DIR, file);
        const stat = fs.statSync(filePath);
        // Only delete files, keep directory structure
        if (stat.isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    }
  } catch (err) {
    // Ignore cleanup errors in tests
  }
});
