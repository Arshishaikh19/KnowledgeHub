import fs from 'fs';
import mammoth from 'mammoth';
import { ParsedSection } from './pdf.parser';

export async function parseDocx(filePath: string): Promise<ParsedSection[]> {
  const dataBuffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer: dataBuffer });
  const rawText = result.value || '';

  if (!rawText.trim()) {
    return [{ pageNumber: 1, content: 'Empty Word document' }];
  }

  // Split into sections by double line breaks or heading-like lines
  const paragraphs = rawText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const sections: ParsedSection[] = [];

  let currentSectionTitle = 'Overview';
  let currentAccumulator: string[] = [];
  let currentEstimatedPage = 1;
  let wordCountInPage = 0;

  for (const paragraph of paragraphs) {
    // Check if this paragraph is a short header (< 80 chars, no terminal punctuation)
    const isHeading = paragraph.length < 80 && !paragraph.endsWith('.') && !paragraph.endsWith(';') && paragraph.length > 3;

    if (isHeading && currentAccumulator.length > 0) {
      sections.push({
        pageNumber: currentEstimatedPage,
        sectionTitle: currentSectionTitle,
        content: currentAccumulator.join('\n\n'),
      });
      currentAccumulator = [];
      currentSectionTitle = paragraph;
    } else {
      currentAccumulator.push(paragraph);
      wordCountInPage += paragraph.split(/\s+/).length;

      // Approximate a new page every ~400 words
      if (wordCountInPage >= 400) {
        currentEstimatedPage++;
        wordCountInPage = 0;
      }
    }
  }

  if (currentAccumulator.length > 0) {
    sections.push({
      pageNumber: currentEstimatedPage,
      sectionTitle: currentSectionTitle,
      content: currentAccumulator.join('\n\n'),
    });
  }

  return sections.length > 0 ? sections : [{ pageNumber: 1, content: rawText.trim() }];
}
