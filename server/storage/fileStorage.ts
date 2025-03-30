import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import fsSync from 'fs';
import { 
  PERSISTENT_UPLOAD_DIR, 
  PUBLIC_UPLOAD_DIR 
} from '../migrateUploads';

// Create a logger for file operations with timestamps
const fileLogger = {
  log: (message: string) => {
    console.log(`[FileStorage] ${new Date().toISOString()} - ${message}`);
  },
  error: (message: string, error?: any) => {
    console.error(`[FileStorage] ${new Date().toISOString()} - ERROR: ${message}`, error || '');
  },
  info: (message: string) => {
    console.info(`[FileStorage] ${new Date().toISOString()} - INFO: ${message}`);
  }
};

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
      if (!fsSync.existsSync(PERSISTENT_UPLOAD_DIR)) {
        fsSync.mkdirSync(PERSISTENT_UPLOAD_DIR, { recursive: true });
        fileLogger.info(`Created persistent upload directory: ${PERSISTENT_UPLOAD_DIR}`);
      }
      
      // Create public uploads directory
      const publicUploadsDir = PUBLIC_UPLOAD_DIR;
      try {
        await fs.access(publicUploadsDir);
      } catch {
        // If uploads folder doesn't exist in the root, create it
        try {
          if (fsSync.existsSync(publicUploadsDir)) {
            // If it exists but is not accessible, try to fix permissions
            fsSync.chmodSync(publicUploadsDir, 0o755);
            fileLogger.info(`Fixed permissions on public upload directory: ${publicUploadsDir}`);
          } else {
            // Create public directory
            fsSync.mkdirSync(publicUploadsDir, { recursive: true });
            fileLogger.info(`Created public upload directory: ${publicUploadsDir}`);
          }
        } catch (err) {
          fileLogger.error('Error creating uploads directory:', err);
        }
      }
    } catch (error) {
      fileLogger.error('Error initializing uploads directory:', error);
    }
  }

  /**
   * Save a file to both persistent and public storage
   */
  async saveFile(file: Buffer, originalName: string): Promise<string> {
    try {
      // Generate a unique filename
      const fileExt = path.extname(originalName);
      const sanitizedName = path.basename(originalName, fileExt)
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-{2,}/g, '-')
        .toLowerCase();
      const uniqueId = randomBytes(8).toString('hex');
      const fileName = `${Date.now()}-${uniqueId}-${sanitizedName}${fileExt}`;
      
      // Create paths
      const persistentPath = path.join(PERSISTENT_UPLOAD_DIR, fileName);
      const publicPath = path.join(PUBLIC_UPLOAD_DIR, fileName);
      
      // Save to persistent storage first
      await fs.writeFile(persistentPath, file);
      fileLogger.info(`Saved file to persistent storage: ${fileName}`);
      
      // Copy the file to the public uploads directory
      try {
        await fs.copyFile(persistentPath, publicPath);
        fileLogger.info(`Copied file to public directory: ${fileName}`);
      } catch (error) {
        fileLogger.error(`Error copying file to public directory: ${fileName}`, error);
        
        // If copy fails, try again with synchronous method
        try {
          fsSync.copyFileSync(persistentPath, publicPath);
          fileLogger.info(`Retry successful: Copied file to public directory with sync method: ${fileName}`);
        } catch (syncError) {
          fileLogger.error(`Sync copy also failed for file: ${fileName}`, syncError);
        }
      }
      
      return `/uploads/${fileName}`;
    } catch (error) {
      fileLogger.error(`Failed to save file: ${originalName}`, error);
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a file from both persistent and public storage
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!filePath || !filePath.startsWith('/uploads/')) {
      fileLogger.error(`Invalid file path for deletion: ${filePath}`);
      return;
    }
    
    try {
      const fileName = path.basename(filePath);
      const persistentPath = path.join(PERSISTENT_UPLOAD_DIR, fileName);
      const publicPath = path.join(PUBLIC_UPLOAD_DIR, fileName);
      
      // Check if files exist before attempting deletion
      const persistentExists = fsSync.existsSync(persistentPath);
      const publicExists = fsSync.existsSync(publicPath);
      
      // Delete from persistent storage
      if (persistentExists) {
        await fs.unlink(persistentPath);
        fileLogger.info(`Deleted file from persistent storage: ${fileName}`);
      } else {
        fileLogger.info(`File not found in persistent storage: ${fileName}`);
      }
      
      // Delete from public directory
      if (publicExists) {
        await fs.unlink(publicPath);
        fileLogger.info(`Deleted file from public directory: ${fileName}`);
      } else {
        fileLogger.info(`File not found in public directory: ${fileName}`);
      }
    } catch (error) {
      fileLogger.error(`Error deleting file: ${filePath}`, error);
    }
  }

  /**
   * Get the absolute path to a file, checking both locations
   */
  getAbsolutePath(filePath: string): string {
    if (!filePath || !filePath.startsWith('/uploads/')) {
      fileLogger.error(`Invalid file path requested: ${filePath}`);
      throw new Error('Invalid file path');
    }
    
    try {
      const fileName = path.basename(filePath);
      
      // First check if the file exists in the public directory
      const publicPath = path.join(PUBLIC_UPLOAD_DIR, fileName);
      if (fsSync.existsSync(publicPath)) {
        return publicPath;
      }
      
      // If not, check the persistent directory
      const persistentPath = path.join(PERSISTENT_UPLOAD_DIR, fileName);
      if (fsSync.existsSync(persistentPath)) {
        // If it exists in persistent but not public, copy it to public for future use
        try {
          fsSync.copyFileSync(persistentPath, publicPath);
          fileLogger.info(`Auto-copied missing file to public directory: ${fileName}`);
        } catch (error) {
          fileLogger.error(`Failed to copy file to public directory: ${fileName}`, error);
        }
        return persistentPath;
      }
      
      // If file doesn't exist in either location, throw an error
      fileLogger.error(`File not found in any location: ${fileName}`);
      throw new Error(`File not found: ${fileName}`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('File not found:')) {
        throw error;
      }
      fileLogger.error(`Error getting absolute path: ${filePath}`, error);
      throw new Error(`Error accessing file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * List all files in storage
   */
  listFiles(): string[] {
    try {
      // Get files from persistent storage as the source of truth
      return fsSync.readdirSync(PERSISTENT_UPLOAD_DIR);
    } catch (error) {
      fileLogger.error('Error listing files', error);
      return [];
    }
  }
  
  /**
   * Get file information
   */
  getFileInfo(fileName: string): { size: number; created: Date } | null {
    try {
      const filePath = path.join(PERSISTENT_UPLOAD_DIR, fileName);
      
      if (!fsSync.existsSync(filePath)) {
        return null;
      }
      
      const stats = fsSync.statSync(filePath);
      return {
        size: stats.size,
        created: stats.birthtime
      };
    } catch (error) {
      fileLogger.error(`Error getting file info: ${fileName}`, error);
      return null;
    }
  }
}

export const fileStorage = FileStorage.getInstance();
