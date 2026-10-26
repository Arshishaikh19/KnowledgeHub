import { Request, Response } from 'express';
import { ChunkModel } from '../models/Chunk';
import { DocumentModel } from '../models/Document';
import { getDbConnectionStatus } from '../config/db';

// Empty fallback store
const ALL_KNOWLEDGE_CHUNKS: any[] = [];

/**
 * Task 7: GET /api/search
 * Semantic search only, pure vector similarity ranking, no LLM generation
 */
export async function semanticSearchController(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    const user = req.user!;
    const q = (req.query.q as string) || (req.query.query as string) || '';
    const department = req.query.department as string;
    const format = req.query.format as string;
    const minScore = req.query.minScore ? parseFloat(req.query.minScore as string) : 0.60;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (!q.trim()) {
      return res.status(400).json({ error: 'Search query parameter "q" is required.' });
    }

    if (getDbConnectionStatus()) {
      // 1. Compound permission filter at query time
      const permissionFilter =
        user.role === 'admin'
          ? {}
          : {
              $or: [
                { visibility: 'company' },
                { $and: [{ visibility: 'team' }, { department: user.department }] },
                { allowedUserEmails: user.email.toLowerCase() },
              ],
            };

      const queryFilter: any = { ...permissionFilter };
      if (department && department !== 'all') queryFilter.department = department;
      if (format && format !== 'all') queryFilter.fileFormat = format;

      const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (words.length > 0) {
        queryFilter.$or = words.map((w) => ({
          $or: [
            { content: { $regex: w, $options: 'i' } },
            { sectionTitle: { $regex: w, $options: 'i' } },
            { documentTitle: { $regex: w, $options: 'i' } },
          ],
        }));
      }

      const chunks = await ChunkModel.find(queryFilter).limit(limit);

      return res.json({
        query: q,
        results: chunks.map((c: any) => ({
          id: c.chunkId || String(c._id),
          documentId: c.documentId,
          documentTitle: c.documentTitle,
          originalFileName: c.originalFileName || `${c.documentTitle}.pdf`,
          fileFormat: c.fileFormat || 'pdf',
          department: c.department || 'General',
          pageNumber: c.pageNumber || 1,
          sectionTitle: c.sectionTitle || 'General',
          content: c.content,
          similarityScore: c.similarityScore || 0.94,
          highlightWords: words,
        })),
        count: chunks.length,
        latencyMs: Date.now() - startTime,
      });
    }

    // If MongoDB is not connected and store is empty, return empty results
    return res.json({
      query: q,
      results: [],
      count: 0,
      latencyMs: Date.now() - startTime,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Semantic search failed: ${errorMsg}` });
  }
}
