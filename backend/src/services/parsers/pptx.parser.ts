import fs from 'fs';
import JSZip from 'jszip';
import { ParsedSection } from './pdf.parser';

export async function parsePptx(filePath: string): Promise<ParsedSection[]> {
  const fileBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  const slideFiles = Object.keys(zip.files).filter((fileName) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(fileName)
  );

  // Sort slides numerically (slide1, slide2, slide3, ...)
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)![0], 10);
    const numB = parseInt(b.match(/\d+/)![0], 10);
    return numA - numB;
  });

  const sections: ParsedSection[] = [];

  for (let idx = 0; idx < slideFiles.length; idx++) {
    const slidePath = slideFiles[idx];
    const xmlContent = await zip.files[slidePath].async('string');

    // Extract all <a:t>...</a:t> text nodes
    const textMatches = xmlContent.match(/<a:t(?:\s+[^>]*)?>([\s\S]*?)<\/a:t>/gi);
    if (!textMatches || textMatches.length === 0) continue;

    const extractedTextParts = textMatches.map((m) =>
      m.replace(/<a:t(?:\s+[^>]*)?>/i, '').replace(/<\/a:t>/i, '').trim()
    ).filter(Boolean);

    if (extractedTextParts.length === 0) continue;

    const slideTitle = extractedTextParts[0] || `Slide ${idx + 1}`;
    const slideBody = extractedTextParts.slice(1).join('\n• ');

    const fullContent = `Slide Title: ${slideTitle}\n${slideBody ? `• ${slideBody}` : ''}`;

    sections.push({
      pageNumber: idx + 1,
      sectionTitle: slideTitle,
      content: fullContent,
    });
  }

  return sections.length > 0 ? sections : [{ pageNumber: 1, content: 'Empty Presentation' }];
}
