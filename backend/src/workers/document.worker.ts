import { Job } from 'bullmq';
import { DocumentModel } from '../models/Document';
import { ChunkModel } from '../models/Chunk';
import { parseDocument } from '../services/parsers';
import { chunkSections } from '../services/chunking.service';
import { generateBatchEmbeddings } from '../services/embedding.service';

export interface DocumentParseJobData {
  documentId: string;
  filePath: string;
  fileFormat: string;
  department: string;
}

export async function processDocumentJob(job: Job<DocumentParseJobData>): Promise<{
  success: boolean;
  totalChunks: number;
  documentId: string;
}> {
  const { documentId, filePath, fileFormat } = job.data;
  console.log(`[Worker] Starting ingestion for Document: ${documentId} (Format: ${fileFormat})`);

  // 1. Fetch document from MongoDB
  const doc = await DocumentModel.findById(documentId);
  if (!doc) {
    throw new Error(`Document not found in database: ${documentId}`);
  }

  try {
    // 2. Update status to processing
    doc.status = 'processing';
    doc.statusMessage = 'Extracting document content and metadata...';
    await doc.save();
    await job.updateProgress(15);

    // 3. Multi-Format Text Extraction
    console.log(`[Worker] Parsing content from: ${filePath}`);
    let sections = await parseDocument(filePath, fileFormat);
    const totalExtractedLength = sections.reduce((acc, s) => acc + s.content.length, 0);

    // OCR Fallback: If document has sparse or no extractable text (e.g. scanned PDF or image)
    if (totalExtractedLength < 50) {
      console.log(`[Worker] Sparse text detected (${totalExtractedLength} chars). Triggering Tesseract.js OCR fallback...`);
      doc.statusMessage = 'Running OCR on scanned pages...';
      await doc.save();

      const { performOcr } = await import('../services/ocr.service');
      const ocrResult = await performOcr(filePath);
      if (ocrResult.sections && ocrResult.sections.length > 0 && ocrResult.text.trim().length > 0) {
        sections = ocrResult.sections;
        doc.ocrProcessed = true;
        console.log(`[Worker] ✓ OCR successfully recovered ${ocrResult.text.length} characters`);
      }
    }

    await job.updateProgress(45);

    // 4. Semantic Text Chunking
    console.log(`[Worker] Chunking ${sections.length} sections for Document: ${documentId}`);
    const rawChunks = chunkSections(sections, { targetChunkSize: 600, overlapSize: 100 });

    if (rawChunks.length === 0) {
      rawChunks.push({
        chunkIndex: 0,
        pageNumber: 1,
        sectionTitle: doc.title,
        content: `Document: ${doc.title} (${doc.originalFileName})`,
      });
    }

    await job.updateProgress(65);

    // 5. Generate Vector Embeddings
    console.log(`[Worker] Generating vector embeddings for ${rawChunks.length} chunks...`);
    const chunkContents = rawChunks.map((c) => c.content);
    const embeddings = await generateBatchEmbeddings(chunkContents);
    await job.updateProgress(85);

    // 6. Extract permissions from document for chunk inheritance
    const allowedEmails = doc.permissions.map((p) => p.userEmail);

    // 7. Bulk insert chunks to MongoDB (Task 8: replace/supersede old chunks completely)
    await ChunkModel.deleteMany({ documentId });

    const chunkDocs = rawChunks.map((chunk, idx) => ({
      documentId,
      versionNumber: doc.currentVersion,
      pageNumber: chunk.pageNumber || 1,
      sectionTitle: chunk.sectionTitle || doc.title,
      content: chunk.content,
      embedding: embeddings[idx],
      department: doc.department,
      visibility: doc.visibility,
      allowedUserEmails: allowedEmails,
    }));

    await ChunkModel.insertMany(chunkDocs);

    // 8. Update Document status to ready (Task 8: version tracking & metadata)
    doc.status = 'ready';
    doc.statusMessage = `Processed successfully (v${doc.currentVersion}.0, ${chunkDocs.length} chunks indexed)`;
    doc.totalChunks = chunkDocs.length;
    doc.sampleChunks = chunkDocs.slice(0, 5).map((c, idx) => ({
      chunkId: `chunk_${documentId}_${idx + 1}`,
      pageNumber: c.pageNumber,
      sectionTitle: c.sectionTitle,
      content: c.content,
    }));

    // Update version history chunk count and active flags
    doc.versions.forEach((v) => {
      if (v.versionNumber === doc.currentVersion) {
        v.chunkCount = chunkDocs.length;
        v.isCurrent = true;
      } else {
        v.isCurrent = false;
      }
    });

    await doc.save();
    await job.updateProgress(100);

    console.log(`[Worker] ✓ Successfully indexed ${chunkDocs.length} chunks for Document: ${documentId} (v${doc.currentVersion}.0)`);

    return {
      success: true,
      totalChunks: chunkDocs.length,
      documentId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Worker] ✗ Processing failed for Document ${documentId}:`, errorMsg);

    // Task 7: Update document status to failed with exact reason
    doc.status = 'failed';
    doc.statusMessage = `Ingestion failed: ${errorMsg}`;
    await doc.save();

    throw err;
  }
}
