import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// eslint-disable-next-line no-underscore-dangle
const filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const currentDir = dirname(filename);

const WATERMARKS_DIR = join(currentDir, '.watermarks');

/**
 * Get watermark value from local file storage
 * @param {string} key - The watermark key (e.g., 'EContentExtractor')
 * @param {string} account - The account identifier (e.g., 'ADHIYAN')
 * @returns {Promise<string|undefined>} The watermark value or undefined if not found
 */
export async function getWatermark(key, account) {
  const filePath = join(WATERMARKS_DIR, account, `${key}.txt`);
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const value = await fs.readFile(filePath, 'utf-8');
    return value.trim();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

/**
 * Save watermark value to local file storage
 * @param {string} key - The watermark key (e.g., 'EContentExtractor')
 * @param {string} account - The account identifier (e.g., 'ADHIYAN')
 * @param {string} value - The watermark value to save
 * @returns {Promise<void>}
 */
export async function setWatermark(key, account, value) {
  const filePath = join(WATERMARKS_DIR, account, `${key}.txt`);

  // Ensure directory exists
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fs.mkdir(dirname(filePath), { recursive: true });

  // Write to file
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fs.writeFile(filePath, value, 'utf-8');
}
