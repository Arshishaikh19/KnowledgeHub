import path from 'path';
import fs from 'fs';

export const UPLOAD_DIRECTORY = path.resolve(process.env.UPLOAD_DIR || './uploads');

export function initStorage() {
  if (!fs.existsSync(UPLOAD_DIRECTORY)) {
    fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
    console.log(`[Storage] Initialized storage directory: ${UPLOAD_DIRECTORY}`);
  }
}

export function getFilePath(fileName: string): string {
  return path.join(UPLOAD_DIRECTORY, fileName);
}
