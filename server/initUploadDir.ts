import fs from 'fs';
import path from 'path';

export function initializeUploadDirectory() {
  const uploadDir = path.join(process.cwd(), '.data', 'uploads');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}
