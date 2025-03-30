import fs from 'fs';
import path from 'path';

export function initializeUploadDirectory() {
  // Create persistent upload directory
  const persistentUploadDir = path.join(process.cwd(), '.data', 'uploads');
  if (!fs.existsSync(persistentUploadDir)) {
    fs.mkdirSync(persistentUploadDir, { recursive: true });
  }
  
  // Create public upload directory for serving files
  const publicUploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(publicUploadDir)) {
    fs.mkdirSync(publicUploadDir, { recursive: true });
  }
  
  // Copy any existing files from persistent to public dir
  // so they will be available immediately after server restart
  try {
    const files = fs.readdirSync(persistentUploadDir);
    for (const file of files) {
      const sourcePath = path.join(persistentUploadDir, file);
      const targetPath = path.join(publicUploadDir, file);
      
      // Only copy if the file doesn't exist in the public dir
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
    console.log('Initialized upload directories and synchronized files');
  } catch (error) {
    console.error('Error during upload directory initialization:', error);
  }
}
