import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'ngsrn-media';
const USE_S3 = process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID;

// Local storage will be handled in API routes where fs is available

/**
 * Upload file to S3 (server-side only)
 */
export async function uploadToS3(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  if (USE_S3) {
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `media/${filename}`,
      Body: buffer,
      ContentType: contentType,
      ContentDisposition: 'inline',
    });

    await s3Client.send(command);
    
    // Return S3 URL
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/media/${filename}`;
  } else {
    // Return local URL for development
    return `/uploads/${filename}`;
  }
}

/**
 * Delete file from S3 (server-side only)
 */
export async function deleteFromS3(filename: string): Promise<void> {
  if (USE_S3) {
    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `media/${filename}`,
    });

    await s3Client.send(command);
  }
  // Local file deletion will be handled in API routes
}

/**
 * Generate presigned URL for secure file access
 */
export async function getPresignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
  if (!USE_S3) {
    // For local development, return direct URL
    return `/uploads/${filename}`;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `media/${filename}`,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Validate file type and size
 */
export function validateFile(file: File, allowedTypes: string[], maxSize: number): string | null {
  // Check file size
  if (file.size > maxSize) {
    return `File size exceeds maximum limit of ${formatFileSize(maxSize)}`;
  }

  // Check file type
  const isAllowed = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });

  if (!isAllowed) {
    return `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`;
  }

  return null;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate optimized image variants (for future implementation)
 */
export async function generateImageVariants(buffer: Buffer, filename: string, contentType: string): Promise<{
  original: string;
  thumbnail?: string;
  medium?: string;
  large?: string;
}> {
  // For now, just return the original
  // In the future, this could generate different sizes using Sharp or similar
  const originalUrl = await uploadToS3(buffer, filename, contentType);
  
  return {
    original: originalUrl,
    // thumbnail: await generateThumbnail(buffer, filename),
    // medium: await generateMediumSize(buffer, filename),
    // large: await generateLargeSize(buffer, filename),
  };
}

/**
 * Get file metadata
 */
export function getFileMetadata(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified),
  };
}

/**
 * Supported file types configuration
 */
export const SUPPORTED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  videos: ['video/mp4', 'video/webm', 'video/ogg'],
  documents: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  all: ['image/*', 'video/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 50 * 1024 * 1024, // 50MB
  default: 50 * 1024 * 1024, // 50MB
};