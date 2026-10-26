import mongoose from 'mongoose';

let isDbConnected = false;

export async function connectDB(): Promise<boolean> {
  const defaultUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/knowledgehub';
  const uri = defaultUri.replace('localhost', '127.0.0.1');

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isDbConnected = true;
    console.log(`[MongoDB] ✅ Successfully connected to database: ${uri}`);

    // Ensure Atlas Vector Search index on chunks collection
    try {
      const { ensureAtlasVectorSearchIndex } = await import('./vector-index');
      await ensureAtlasVectorSearchIndex();
    } catch {
      // Non-blocking index registration
    }

    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[MongoDB] Database connection failed (${errorMsg}). Running in resilient fallback mode.`);
    isDbConnected = false;
    return false;
  }
}

export function getDbConnectionStatus(): boolean {
  return isDbConnected;
}
