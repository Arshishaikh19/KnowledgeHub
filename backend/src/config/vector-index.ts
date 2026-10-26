import mongoose from 'mongoose';
import { EMBEDDING_DIMENSION } from '../services/embedding.service';

/**
 * MongoDB Atlas Vector Search Index Definition
 * Collection: 'chunks'
 * Index Name: 'vector_index'
 */
export const ATLAS_VECTOR_SEARCH_INDEX_SPEC = {
  name: 'vector_index',
  type: 'vectorSearch',
  definition: {
    fields: [
      {
        type: 'vector',
        path: 'embedding',
        numDimensions: EMBEDDING_DIMENSION, // 384 dimensions
        similarity: 'cosine',
      },
      {
        type: 'filter',
        path: 'department',
      },
      {
        type: 'filter',
        path: 'visibility',
      },
      {
        type: 'filter',
        path: 'allowedUserEmails',
      },
      {
        type: 'filter',
        path: 'documentId',
      },
    ],
  },
};

/**
 * Programmatically create or ensure the Atlas Vector Search index on MongoDB Atlas cluster.
 */
export async function ensureAtlasVectorSearchIndex(): Promise<boolean> {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.warn('[Atlas Vector Search] Database connection not ready.');
      return false;
    }

    const collection = db.collection('chunks');

    // Check if createSearchIndex is supported on this MongoDB instance (Atlas clusters)
    if (typeof (collection as any).createSearchIndex === 'function') {
      try {
        console.log('[Atlas Vector Search] Registering Vector Search index on chunks collection...');
        await (collection as any).createSearchIndex({
          name: ATLAS_VECTOR_SEARCH_INDEX_SPEC.name,
          type: ATLAS_VECTOR_SEARCH_INDEX_SPEC.type,
          definition: ATLAS_VECTOR_SEARCH_INDEX_SPEC.definition,
        });
        console.log('[Atlas Vector Search] ✓ Vector Search index registered successfully.');
        return true;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        // If index already exists or running on local Mongo without Atlas extension
        if (errorMsg.includes('already exists')) {
          console.log('[Atlas Vector Search] ✓ Vector Search index already exists.');
          return true;
        }
        console.warn(`[Atlas Vector Search] Notice: ${errorMsg} (Using query-level vector pipeline)`);
        return false;
      }
    } else {
      console.log('[Atlas Vector Search] Local MongoDB detected. Using high-speed in-memory vector pipeline.');
      return true;
    }
  } catch (err) {
    console.warn('[Atlas Vector Search] Could not register search index:', err);
    return false;
  }
}

/**
 * Build MongoDB Atlas $vectorSearch aggregation stage with compound pre-filtering
 */
export function buildAtlasVectorSearchStage(params: {
  queryVector: number[];
  path?: string;
  numCandidates?: number;
  limit?: number;
  filter?: Record<string, any>;
}) {
  return {
    $vectorSearch: {
      index: 'vector_index',
      path: params.path || 'embedding',
      queryVector: params.queryVector,
      numCandidates: params.numCandidates || 100,
      limit: params.limit || 10,
      filter: params.filter || {},
    },
  };
}
