import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import fsSync from 'fs';

// Create uploads directory if it doesn't exist - Use a persistent directory
// For Replit, we should use the .data directory which persists across restarts
const UPLOADS_DIR = path.join(process.cwd(), '.data', 'uploads');

export class FileStorage {
  private static instance: FileStorage;
  
  private constructor() {
    // Initialize uploads directory
    this.ensureUploadsDir();
  }

  static getInstance(): FileStorage {
    if (!FileStorage.instance) {
      FileStorage.instance = new FileStorage();
    }
    return FileStorage.instance;
  }

  private async ensureUploadsDir() {
    try {
      // Create the uploads directory synchronously to ensure it exists
      // before any file operations happen
      if (!fsSync.existsSync(UPLOADS_DIR)) {
        fsSync.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      
      // Create a symlink from /uploads to our persistent storage if it doesn't exist
      const publicUploadsDir = path.join(process.cwd(), 'uploads');
      try {
        await fs.access(publicUploadsDir);
      } catch {
        // If uploads folder doesn't exist in the root, create it
        // or create a symlink to the persistent directory
        try {
          if (fsSync.existsSync(publicUploadsDir)) {
            // If it exists but is not accessible, try to fix permissions
            fsSync.chmodSync(publicUploadsDir, 0o755);
          } else {
            // On Replit, symlinks might not work well - so we'll create a directory
            // and later ensure we serve files from the right location
            fsSync.mkdirSync(publicUploadsDir, { recursive: true });
          }
        } catch (err) {
          console.error('Error creating uploads directory:', err);
        }
      }
    } catch (error) {
      console.error('Error initializing uploads directory:', error);
    }
  }

  async saveFile(file: Buffer, originalName: string): Promise<string> {
    const fileExt = path.extname(originalName);
    const fileName = `${randomBytes(16).toString('hex')}${fileExt}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    // Save to persistent storage
    await fs.writeFile(filePath, file);
    
    // Copy the file to the public uploads directory for easier access
    const publicPath = path.join(process.cwd(), 'uploads', fileName);
    try {
      await fs.copyFile(filePath, publicPath);
    } catch (error) {
      console.error('Error copying file to public directory:', error);
    }
    
    return `/uploads/${fileName}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!filePath.startsWith('/uploads/')) return;
    
    const fileName = path.basename(filePath);
    const persistentPath = path.join(UPLOADS_DIR, fileName);
    const publicPath = path.join(process.cwd(), filePath);
    
    try {
      // Try to delete from both locations
      await fs.unlink(persistentPath).catch(err => 
        console.error('Error deleting from persistent storage:', err));
      await fs.unlink(publicPath).catch(err => 
        console.error('Error deleting from public directory:', err));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  getAbsolutePath(filePath: string): string {
    if (!filePath.startsWith('/uploads/')) throw new Error('Invalid file path');
    
    const fileName = path.basename(filePath);
    // First check if the file exists in the public directory
    const publicPath = path.join(process.cwd(), filePath);
    
    if (fsSync.existsSync(publicPath)) {
      return publicPath;
    }
    
    // If not, use the persistent path
    return path.join(UPLOADS_DIR, fileName);
  }
}

export const fileStorage = FileStorage.getInstance();
