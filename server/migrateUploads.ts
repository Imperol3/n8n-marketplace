import fs from 'fs';
import path from 'path';

// Define constant paths for our upload directories
export const PERSISTENT_UPLOAD_DIR = path.join(process.cwd(), '.data', 'uploads');
export const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * Migrate uploads between storage locations and ensure data integrity
 */
export function migrateUploads() {
  console.log('Starting file system migration check...');
  
  // Ensure both directories exist
  ensureDirectories();
  
  try {
    // Get list of files from both locations
    const persistentFiles = getFilesFromDirectory(PERSISTENT_UPLOAD_DIR);
    const publicFiles = getFilesFromDirectory(PUBLIC_UPLOAD_DIR);
    
    // Find files that exist in one location but not the other
    const missingInPublic = persistentFiles.filter(file => !publicFiles.includes(file));
    const missingInPersistent = publicFiles.filter(file => !persistentFiles.includes(file));
    
    console.log(`Found ${persistentFiles.length} files in persistent storage`);
    console.log(`Found ${publicFiles.length} files in public directory`);
    console.log(`Missing ${missingInPublic.length} files in public directory`);
    console.log(`Missing ${missingInPersistent.length} files in persistent storage`);
    
    // Copy missing files to ensure both locations have all files
    copyMissingFiles(missingInPublic, PERSISTENT_UPLOAD_DIR, PUBLIC_UPLOAD_DIR);
    copyMissingFiles(missingInPersistent, PUBLIC_UPLOAD_DIR, PERSISTENT_UPLOAD_DIR);
    
    // Verify files match in both locations (check sizes)
    verifyFileIntegrity(persistentFiles);
    
    console.log('File system migration completed successfully');
  } catch (error) {
    console.error('Error during file migration:', error);
  }
}

/**
 * Ensure both upload directories exist
 */
function ensureDirectories() {
  // Create persistent upload directory
  if (!fs.existsSync(PERSISTENT_UPLOAD_DIR)) {
    console.log(`Creating persistent directory: ${PERSISTENT_UPLOAD_DIR}`);
    fs.mkdirSync(PERSISTENT_UPLOAD_DIR, { recursive: true });
  }
  
  // Create public upload directory
  if (!fs.existsSync(PUBLIC_UPLOAD_DIR)) {
    console.log(`Creating public directory: ${PUBLIC_UPLOAD_DIR}`);
    fs.mkdirSync(PUBLIC_UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Get list of files from a directory
 */
function getFilesFromDirectory(directory: string): string[] {
  try {
    return fs.readdirSync(directory);
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
    return [];
  }
}

/**
 * Copy missing files from source to target directory
 */
function copyMissingFiles(files: string[], sourceDir: string, targetDir: string) {
  for (const file of files) {
    try {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      // Check if source file exists
      if (!fs.existsSync(sourcePath)) {
        console.error(`Source file does not exist: ${sourcePath}`);
        continue;
      }
      
      // Copy file
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`Copied file: ${file} from ${sourceDir} to ${targetDir}`);
    } catch (error) {
      console.error(`Error copying file ${file}:`, error);
    }
  }
}

/**
 * Verify file integrity by comparing files in both locations
 */
function verifyFileIntegrity(files: string[]) {
  const inconsistentFiles = [];
  
  for (const file of files) {
    try {
      const persistentPath = path.join(PERSISTENT_UPLOAD_DIR, file);
      const publicPath = path.join(PUBLIC_UPLOAD_DIR, file);
      
      // Skip if either file doesn't exist
      if (!fs.existsSync(persistentPath) || !fs.existsSync(publicPath)) {
        continue;
      }
      
      // Compare file sizes
      const persistentStats = fs.statSync(persistentPath);
      const publicStats = fs.statSync(publicPath);
      
      if (persistentStats.size !== publicStats.size) {
        inconsistentFiles.push(file);
        console.warn(`File size mismatch for ${file}: persistent=${persistentStats.size}, public=${publicStats.size}`);
        
        // Repair by copying from persistent to public
        fs.copyFileSync(persistentPath, publicPath);
        console.log(`Repaired inconsistent file: ${file}`);
      }
    } catch (error) {
      console.error(`Error verifying file ${file}:`, error);
    }
  }
  
  if (inconsistentFiles.length > 0) {
    console.log(`Repaired ${inconsistentFiles.length} inconsistent files`);
  } else {
    console.log('All files verified with matching sizes');
  }
}

/**
 * Remove orphaned files that aren't referenced in the database
 * This function should be called separately and requires database access
 */
export async function cleanupOrphanedFiles(
  getReferencedFiles: () => Promise<string[]>
) {
  try {
    // Get all files in the system
    const persistentFiles = getFilesFromDirectory(PERSISTENT_UPLOAD_DIR);
    
    // Get files referenced in the database
    const referencedFiles = await getReferencedFiles();
    const referencedFilenames = referencedFiles.map(file => path.basename(file));
    
    // Find orphaned files
    const orphanedFiles = persistentFiles.filter(file => !referencedFilenames.includes(file));
    
    console.log(`Found ${orphanedFiles.length} orphaned files not referenced in the database`);
    
    // Don't delete orphaned files automatically - just report them for now
    if (orphanedFiles.length > 0) {
      console.log('Orphaned files:');
      orphanedFiles.forEach(file => console.log(` - ${file}`));
    }
  } catch (error) {
    console.error('Error cleaning up orphaned files:', error);
  }
}