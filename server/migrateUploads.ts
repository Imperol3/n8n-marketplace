import fs from 'fs';
import path from 'path';

const oldUploadDir = path.join(process.cwd(), 'uploads');
const newUploadDir = path.join(process.cwd(), '.replit', 'uploads');

// Create new directory if it doesn't exist
if (!fs.existsSync(newUploadDir)) {
  fs.mkdirSync(newUploadDir, { recursive: true });
}

// Move files if old directory exists
if (fs.existsSync(oldUploadDir)) {
  const files = fs.readdirSync(oldUploadDir);
  files.forEach(file => {
    const oldPath = path.join(oldUploadDir, file);
    const newPath = path.join(newUploadDir, file);
    if (fs.existsSync(oldPath)) {
      fs.copyFileSync(oldPath, newPath);
    }
  });
}

console.log('Upload directory migration completed');
