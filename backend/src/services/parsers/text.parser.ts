import fs from 'fs';
import { ParsedSection } from './pdf.parser';

export async function parseText(filePath: string): Promise<ParsedSection[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.trim()) {
    return [{ pageNumber: 1, content: 'Empty text document' }];
  }

  // Split by markdown headers or large paragraph blocks
  const lines = content.split('\n');
  const sections: ParsedSection[] = [];

  let currentSectionTitle = 'Document Body';
  let currentAccumulator: string[] = [];
  let currentEstimatedPage = 1;
  let wordCountInPage = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const isHeading = trimmed.startsWith('#') || (trimmed.length > 0 && trimmed.length < 60 && !trimmed.endsWith('.'));

    if (isHeading && currentAccumulator.length > 0) {
      sections.push({
        pageNumber: currentEstimatedPage,
        sectionTitle: currentSectionTitle,
        content: currentAccumulator.join('\n').trim(),
      });
      currentAccumulator = [];
      currentSectionTitle = trimmed.replace(/^#+\s*/, '');
    } else {
      currentAccumulator.push(line);
      wordCountInPage += line.split(/\s+/).filter(Boolean).length;

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
      content: currentAccumulator.join('\n').trim(),
    });
  }

  return sections.length > 0 ? sections : [{ pageNumber: 1, content: content.trim() }];
}
