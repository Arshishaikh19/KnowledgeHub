import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  
  // Database & Cache
  MONGODB_URI: z.string().default('mongodb://localhost:27017/knowledgehub'),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform((val) => parseInt(val, 10)),
  REDIS_PASSWORD: z.string().optional(),
  
  // Authentication
  JWT_SECRET: z.string().default('knowledgehub_super_secret_jwt_key_2026'),
  
  // Storage Provider (S3 / Cloudflare R2 / Local)
  STORAGE_PROVIDER: z.enum(['local', 's3', 'r2']).default('local'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_BUCKET_NAME: z.string().default('knowledgehub-raw-documents'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(), // Cloudflare R2 endpoint URL: https://<account_id>.r2.cloudflarestorage.com
  
  // LLM & Embeddings
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  WORKER_CONCURRENCY: z.string().default('5').transform((val) => parseInt(val, 10)),
});

export type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig;

export function validateEnv(): EnvConfig {
  if (validatedEnv) return validatedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ FATAL: Environment variable validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  - [${issue.path.join('.')}] ${issue.message}`);
    });
    throw new Error('Environment configuration validation failed.');
  }

  validatedEnv = result.data;

  // Print startup configuration summary
  console.log('----------------------------------------------------');
  console.log('⚙️  KnowledgeHub Boot Configuration:');
  console.log(`  • Environment:       ${validatedEnv.NODE_ENV}`);
  console.log(`  • Port:              ${validatedEnv.PORT}`);
  console.log(`  • MongoDB URI:       ${validatedEnv.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`  • Redis Target:      ${validatedEnv.REDIS_URL || `${validatedEnv.REDIS_HOST}:${validatedEnv.REDIS_PORT}`}`);
  console.log(`  • Storage Provider:  ${validatedEnv.STORAGE_PROVIDER.toUpperCase()}`);
  console.log(`  • LLM Engine:        ${validatedEnv.OPENAI_API_KEY ? 'OpenAI' : validatedEnv.GEMINI_API_KEY ? 'Gemini' : 'Deterministic Subword Engine'}`);
  console.log('----------------------------------------------------');

  return validatedEnv;
}

export const env = validateEnv();
