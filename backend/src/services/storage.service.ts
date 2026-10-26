import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

export interface StorageUploadResult {
  storageKey: string;
  storageProvider: 'local' | 's3' | 'r2';
  url: string;
}

class StorageService {
  private s3Client: S3Client | null = null;
  private localUploadDir: string;

  constructor() {
    this.localUploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }

    if (
      (env.STORAGE_PROVIDER === 's3' || env.STORAGE_PROVIDER === 'r2') &&
      env.AWS_ACCESS_KEY_ID &&
      env.AWS_SECRET_ACCESS_KEY
    ) {
      this.s3Client = new S3Client({
        region: env.AWS_REGION,
        endpoint: env.S3_ENDPOINT, // Cloudflare R2 endpoint if provided
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });
      console.log(`[Storage] Initialized S3-compatible client for bucket: ${env.AWS_BUCKET_NAME}`);
    } else {
      console.log('[Storage] Initialized Local Filesystem Storage driver at:', this.localUploadDir);
    }
  }

  /**
   * Upload binary buffer to S3 / Cloudflare R2 or local disk storage.
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType = 'application/octet-stream'
  ): Promise<StorageUploadResult> {
    const key = `documents/${Date.now()}_${path.basename(fileName)}`;

    if (this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: env.AWS_BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        });

        await this.s3Client.send(command);
        console.log(`[Storage] Uploaded object to S3/R2: ${key}`);

        const url = await this.getPresignedDownloadUrl(key);
        return {
          storageKey: key,
          storageProvider: env.STORAGE_PROVIDER,
          url,
        };
      } catch (err) {
        console.warn('[Storage] S3/R2 upload error, writing to local disk fallback:', err);
      }
    }

    // Local Disk storage
    const localFilePath = path.join(this.localUploadDir, path.basename(key));
    fs.writeFileSync(localFilePath, fileBuffer);
    return {
      storageKey: localFilePath,
      storageProvider: 'local',
      url: `/uploads/${path.basename(localFilePath)}`,
    };
  }

  /**
   * Download binary buffer from storage
   */
  async downloadFile(storageKey: string): Promise<Buffer> {
    if (this.s3Client && !fs.existsSync(storageKey)) {
      const command = new GetObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: storageKey,
      });
      const res = await this.s3Client.send(command);
      const byteArray = await res.Body?.transformToByteArray();
      return Buffer.from(byteArray || []);
    }

    // Read from local filesystem
    return fs.readFileSync(storageKey);
  }

  /**
   * Generate temporary presigned download URL (valid for 1 hour)
   */
  async getPresignedDownloadUrl(storageKey: string, expiresIn = 3600): Promise<string> {
    if (this.s3Client && !storageKey.startsWith('/') && !storageKey.includes(':')) {
      const command = new GetObjectCommand({
        Bucket: env.AWS_BUCKET_NAME,
        Key: storageKey,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    }

    return `/uploads/${path.basename(storageKey)}`;
  }

  /**
   * Delete object from storage
   */
  async deleteFile(storageKey: string): Promise<boolean> {
    if (this.s3Client && !fs.existsSync(storageKey)) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: env.AWS_BUCKET_NAME,
          Key: storageKey,
        });
        await this.s3Client.send(command);
        return true;
      } catch (err) {
        console.warn('[Storage] Failed to delete S3/R2 object:', err);
        return false;
      }
    }

    if (fs.existsSync(storageKey)) {
      fs.unlinkSync(storageKey);
      return true;
    }
    return false;
  }
}

export const storageService = new StorageService();
