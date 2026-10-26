import dotenv from 'dotenv';
dotenv.config();

import { Worker, Job } from 'bullmq';
import { connectDB } from './config/db';
import { redisConnection } from './config/redis';
import { processDocumentJob, DocumentParseJobData } from './workers/document.worker';

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

async function startWorker() {
  console.log('====================================================');
  console.log('🚀 KnowledgeHub Background Worker Starting Up...');
  console.log('====================================================');

  // 1. Connect to MongoDB
  await connectDB();

  // 2. Initialize BullMQ Worker
  const worker = new Worker<DocumentParseJobData>(
    'document-parsing',
    async (job: Job<DocumentParseJobData>) => {
      return await processDocumentJob(job);
    },
    {
      connection: redisConnection,
      concurrency: WORKER_CONCURRENCY,
    }
  );

  worker.on('active', (job) => {
    console.log(`[Worker] Job ${job.id} active for Document ${job.data.documentId}`);
  });

  worker.on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed. Chunks: ${result.totalChunks}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed for Document ${job?.data?.documentId}: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.warn(`[Worker] Worker error notification: ${err.message}`);
  });

  console.log(`[Worker] ✓ Worker listening on queue 'document-parsing' (Concurrency: ${WORKER_CONCURRENCY})`);

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Worker] Received ${signal}. Closing worker gracefully...`);
    await worker.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startWorker().catch((err) => {
  console.error('[Worker] Fatal error during worker startup:', err);
  process.exit(1);
});
