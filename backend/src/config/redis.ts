import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';

export const redisConnection = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    })
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop retrying if Redis is not running locally
        }
        return Math.min(times * 500, 2000);
      },
    });

redisConnection.on('error', (err) => {
  // Silent catch to allow graceful fallback when Redis is absent in local dev
});

export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redisConnection.ping();
    console.log(`[Redis] ✓ Connected to Redis at ${env.REDIS_URL || `${env.REDIS_HOST}:${env.REDIS_PORT}`}`);
    return true;
  } catch (err) {
    console.warn(`[Redis] Redis connection inactive (${err instanceof Error ? err.message : String(err)}). Using in-process worker fallback.`);
    return false;
  }
}

export const documentParseQueue = new Queue('document-parsing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export async function enqueueParseJob(data: {
  documentId: string;
  filePath: string;
  fileFormat: string;
  department: string;
}): Promise<boolean> {
  try {
    await documentParseQueue.add('parse-document', data);
    console.log(`[BullMQ] Enqueued parse job for document: ${data.documentId}`);
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[BullMQ] Redis queue notification (${errorMsg}). Triggering asynchronous background ingestion runner...`);

    // Asynchronous background ingestion runner fallback
    setTimeout(async () => {
      try {
        const { processDocumentJob } = await import('../workers/document.worker');
        const mockJob = {
          data,
          updateProgress: async () => {},
        } as any;
        await processDocumentJob(mockJob);
      } catch (workerErr) {
        console.error('[Background Worker Fallback] Error processing document:', workerErr);
      }
    }, 100);

    return true;
  }
}
