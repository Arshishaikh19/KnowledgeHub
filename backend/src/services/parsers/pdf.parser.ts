import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface ParsedSection {
  pageNumber?: number;
  sectionTitle?: string;
  content: string;
}

export async function parsePdf(filePath: string): Promise<ParsedSection[]> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await (pdfParse.default || pdfParse)(dataBuffer);

  const rawText = data.text || '';
  if (!rawText.trim()) {
    return [{ pageNumber: 1, content: 'Empty PDF document' }];
  }

  // Split pages by form feed or page delimiters
  const rawPages = rawText.split(/\f|\n\s*Page \d+\s*\n/i);
  const sections: ParsedSection[] = [];

  let currentPage = 1;
  for (const pageContent of rawPages) {
    const trimmed = pageContent.trim();
    if (trimmed.length > 0) {
      const lines = trimmed.split('\n').filter((l: string) => l.trim().length > 0);
      const sectionTitle = lines.length > 0 && lines[0].length < 100 ? lines[0].trim() : undefined;

      sections.push({
        pageNumber: currentPage,
        sectionTitle,
        content: trimmed,
      });
      currentPage++;
    }
  }

  if (sections.length === 0) {
    sections.push({
      pageNumber: 1,
      content: rawText.trim(),
    });
  }

  return sections;
}
