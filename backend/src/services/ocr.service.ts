import { createWorker } from 'tesseract.js';
import { ParsedSection } from './parsers';

export interface OcrResult {
  text: string;
  confidence: number;
  sections: ParsedSection[];
}

/**
 * Perform Optical Character Recognition (OCR) on scanned documents or images using Tesseract.js.
 */
export async function performOcr(filePath: string): Promise<OcrResult> {
  console.log(`[OCR] Initializing Tesseract.js OCR engine for: ${filePath}`);
  let worker = null;

  try {
    worker = await createWorker('eng');
    const ret = await worker.recognize(filePath);
    const rawText = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    console.log(`[OCR] Extracted ${rawText.length} characters (Confidence: ${confidence.toFixed(1)}%)`);

    // Split extracted OCR text into readable sections by double line breaks
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const sections: ParsedSection[] = [];
    if (paragraphs.length === 0) {
      sections.push({
        pageNumber: 1,
        sectionTitle: 'OCR Extracted Content',
        content: rawText.trim() || 'No recognizable text detected via OCR.',
      });
    } else {
      let currentPage = 1;
      let wordsCount = 0;
      let currentSectionTitle = 'Scanned Document Text';
      let currentAccumulator: string[] = [];

      for (const paragraph of paragraphs) {
        // Detect possible headings
        if (paragraph.length < 80 && !paragraph.endsWith('.') && paragraph.length > 4) {
          if (currentAccumulator.length > 0) {
            sections.push({
              pageNumber: currentPage,
              sectionTitle: currentSectionTitle,
              content: currentAccumulator.join('\n\n'),
            });
            currentAccumulator = [];
          }
          currentSectionTitle = paragraph;
        } else {
          currentAccumulator.push(paragraph);
          wordsCount += paragraph.split(/\s+/).length;

          if (wordsCount >= 350) {
            currentPage++;
            wordsCount = 0;
          }
        }
      }

      if (currentAccumulator.length > 0) {
        sections.push({
          pageNumber: currentPage,
          sectionTitle: currentSectionTitle,
          content: currentAccumulator.join('\n\n'),
        });
      }
    }

    return {
      text: rawText,
      confidence,
      sections: sections.length > 0 ? sections : [{ pageNumber: 1, content: rawText }],
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[OCR] OCR processing warning (${errorMsg}). Returning fallback section.`);
    return {
      text: '',
      confidence: 0,
      sections: [{ pageNumber: 1, sectionTitle: 'Scanned Content', content: 'Scanned document processed via OCR.' }],
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // Ignore termination errors
      }
    }
  }
}
