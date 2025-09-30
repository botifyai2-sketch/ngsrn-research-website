import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { uploadToS3, deleteFromS3 } from './storage';

// Local storage configuration for development
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const USE_S3 = process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID;

// Ensure local upload directory exists
async function ensureUploadDir() {
  if (!existsSync(LOCAL_UPLOAD_DIR)) {
    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Upload file to S3 or local storage (server-side only)
 */
export async function uploadFile(file: File, filename: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (USE_S3) {
    // Upload to S3
    return await uploadToS3(buffer, filename, file.type);
  } else {
    // Save locally for development
    await ensureUploadDir();
    const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
    await writeFile(filePath, buffer);
    
    // Return local URL
    return `/uploads/${filename}`;
  }
}

/**
 * Delete file from S3 or local storage (server-side only)
 */
export async function deleteFile(filename: string): Promise<void> {
  if (USE_S3) {
    // Delete from S3
    await deleteFromS3(filename);
  } else {
    // Delete from local storage
    const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }
}