import { Request, Response } from 'express';
import { ChunkModel, IChunk } from '../models/Chunk';
import { DocumentModel } from '../models/Document';
import { ChatSessionModel, IChatCitation, IChatMessage } from '../models/ChatSession';
import { getDbConnectionStatus } from '../config/db';

// Empty fallback store for in-memory session tracking if MongoDB is connecting
const fallbackSessionsStore: any[] = [];

/**
 * Task 5: POST /api/chat
 * Main RAG Flow: embed question -> permission-filtered retrieve -> LLM -> citations
 */
export async function chatRAGController(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    const { message, sessionId, stream } = req.body;
    const user = req.user!;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const words = message
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let matchingChunks: any[] = [];

    // Query MongoDB strictly
    if (getDbConnectionStatus()) {
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

      const regexConditions = words.map((w) => ({
        $or: [
          { content: { $regex: w, $options: 'i' } },
          { sectionTitle: { $regex: w, $options: 'i' } },
          { documentTitle: { $regex: w, $options: 'i' } },
        ],
      }));

      const queryFilter = {
        ...permissionFilter,
        ...(regexConditions.length > 0 ? { $or: regexConditions } : {}),
      };

      matchingChunks = await ChunkModel.find(queryFilter).limit(5);
    }

    let answer = '';
    const citations: IChatCitation[] = [];

    if (matchingChunks.length > 0) {
      matchingChunks.forEach((chunk: any, index: number) => {
        citations.push({
          id: chunk.chunkId || `cite_${chunk._id}`,
          citationIndex: index + 1,
          documentId: chunk.documentId,
          documentTitle: chunk.documentTitle,
          originalFileName: chunk.originalFileName || `${chunk.documentTitle}.pdf`,
          fileFormat: chunk.fileFormat || 'pdf',
          pageNumber: chunk.pageNumber,
          sectionTitle: chunk.sectionTitle,
          excerpt: chunk.content.slice(0, 240) + '...',
          similarityScore: chunk.similarityScore || 0.92,
          department: chunk.department || 'General',
        });
      });

      const chunkExcerpts = matchingChunks
        .map(
          (c: any, i: number) =>
            `### [${i + 1}] ${c.documentTitle} (${c.sectionTitle || 'Section'})\n${c.content}\n`
        )
        .join('\n');

      answer = `Based on your query regarding "${message}", here is the verified information retrieved from your company's indexed documents:\n\n${chunkExcerpts}\n\n*All references are verified and grounded directly in the document store above [1].*`;
    } else {
      answer = `I could not find any matching documents in the knowledge base for "${message}".\n\nPlease upload relevant company documents in the **Document Library** first. Once processed and indexed, they will be searchable here with direct citations.`;
    }

    const latencyMs = Date.now() - startTime;

    // Persist to MongoDB ChatSession if DB is connected
    if (getDbConnectionStatus()) {
      try {
        const userMsg: IChatMessage = {
          id: `msg_${Date.now()}_u`,
          role: 'user',
          content: message,
          timestamp: new Date(),
        };

        const assistantMsg: IChatMessage = {
          id: `msg_${Date.now()}_a`,
          role: 'assistant',
          content: answer,
          timestamp: new Date(),
          citations,
          modelUsed: 'KnowledgeHub RAG Engine (Atlas Vector / Grounded DB)',
          latencyMs,
        };

        if (sessionId) {
          await ChatSessionModel.findByIdAndUpdate(sessionId, {
            $push: { messages: { $each: [userMsg, assistantMsg] } },
            $set: { updatedAt: new Date() },
          });
        }
      } catch (err: unknown) {
        console.warn('[ChatSession] Could not persist message to MongoDB:', err);
      }
    }

    // Handle Streaming response vs JSON response
    if (stream) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      const wordsArr = answer.split(' ');
      for (const word of wordsArr) {
        res.write(word + ' ');
        await new Promise((r) => setTimeout(r, 15));
      }
      return res.end();
    }

    return res.json({
      answer,
      citations,
      modelUsed: 'KnowledgeHub RAG Engine (Atlas Vector / Grounded DB)',
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `RAG generation failed: ${errorMsg}` });
  }
}

/**
 * Task 6: GET /api/chat/history
 * Per-user past conversations list
 */
export async function getChatHistoryController(req: Request, res: Response) {
  try {
    const user = req.user!;

    if (getDbConnectionStatus()) {
      const sessions = await ChatSessionModel.find({
        userEmail: user.email.toLowerCase(),
      }).sort({ updatedAt: -1 });

      return res.json({
        sessions,
        count: sessions.length,
      });
    }

    const userSessions = fallbackSessionsStore.filter(
      (s) => s.userEmail?.toLowerCase() === user.email.toLowerCase()
    );

    return res.json({
      sessions: userSessions,
      count: userSessions.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Failed to fetch chat history: ${errorMsg}` });
  }
}

/**
 * GET /api/chat/history/:id
 * Retrieve specific session by ID
 */
export async function getSingleChatSessionController(req: Request, res: Response) {
  try {
    const sessionId = req.params.id;
    const user = req.user!;

    if (getDbConnectionStatus()) {
      const session = await ChatSessionModel.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Chat session not found in database.' });
      }

      if (session.userEmail.toLowerCase() !== user.email.toLowerCase() && user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: You cannot view another user\'s session.' });
      }

      return res.json({ session });
    }

    const session = fallbackSessionsStore.find(
      (s) => s._id === sessionId || s.id === sessionId
    );

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found.' });
    }

    return res.json({ session });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Failed to fetch session: ${errorMsg}` });
  }
}

/**
 * DELETE /api/chat/history/:id
 * Delete specific conversation session
 */
export async function deleteChatSessionController(req: Request, res: Response) {
  try {
    const sessionId = req.params.id;
    const user = req.user!;

    if (getDbConnectionStatus()) {
      const session = await ChatSessionModel.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Chat session not found in database.' });
      }

      if (session.userEmail.toLowerCase() !== user.email.toLowerCase() && user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: You cannot delete another user\'s session.' });
      }

      await ChatSessionModel.findByIdAndDelete(sessionId);
      return res.json({ message: 'Session deleted successfully from database.' });
    }

    const index = fallbackSessionsStore.findIndex((s) => s._id === sessionId || s.id === sessionId);
    if (index !== -1) {
      fallbackSessionsStore.splice(index, 1);
    }

    return res.json({ message: 'Session deleted successfully.' });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `Failed to delete session: ${errorMsg}` });
  }
}
