import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

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
      await fs.access(UPLOADS_DIR);
    } catch {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
    }
  }

  async saveFile(file: Buffer, originalName: string): Promise<string> {
    const fileExt = path.extname(originalName);
    const fileName = `${randomBytes(16).toString('hex')}${fileExt}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    await fs.writeFile(filePath, file);
    return `/uploads/${fileName}`;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!filePath.startsWith('/uploads/')) return;
    
    const absolutePath = path.join(process.cwd(), filePath);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  getAbsolutePath(filePath: string): string {
    if (!filePath.startsWith('/uploads/')) throw new Error('Invalid file path');
    return path.join(process.cwd(), filePath);
  }
}

export const fileStorage = FileStorage.getInstance();
