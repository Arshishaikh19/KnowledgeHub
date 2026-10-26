import { ParsedSection } from './parsers';

export interface ChunkResult {
  chunkIndex: number;
  pageNumber?: number;
  sectionTitle?: string;
  content: string;
}

export interface ChunkOptions {
  targetChunkSize?: number; // Target characters per chunk (default: 600)
  overlapSize?: number;     // Overlap characters between chunks (default: 100)
}

export function chunkSections(
  sections: ParsedSection[],
  options: ChunkOptions = {}
): ChunkResult[] {
  const targetSize = options.targetChunkSize || 600;
  const overlap = options.overlapSize || 100;

  const chunks: ChunkResult[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const text = section.content.trim();
    if (!text) continue;

    // If section is small enough, keep as single chunk
    if (text.length <= targetSize) {
      chunks.push({
        chunkIndex: chunkIndex++,
        pageNumber: section.pageNumber,
        sectionTitle: section.sectionTitle,
        content: text,
      });
      continue;
    }

    // Split large section using sentence/paragraph boundaries
    const sentences = text.split(/(?<=[.?!:\n])\s+/);
    let currentChunkText = '';

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;

      if ((currentChunkText + ' ' + sentence).length <= targetSize) {
        currentChunkText = currentChunkText ? `${currentChunkText} ${sentence}` : sentence;
      } else {
        if (currentChunkText) {
          chunks.push({
            chunkIndex: chunkIndex++,
            pageNumber: section.pageNumber,
            sectionTitle: section.sectionTitle,
            content: currentChunkText.trim(),
          });
        }

        // Calculate overlap from previous chunk
        if (overlap > 0 && currentChunkText.length > overlap) {
          const overlapWords = currentChunkText.slice(-overlap).split(/\s+/).slice(1).join(' ');
          currentChunkText = overlapWords ? `${overlapWords} ${sentence}` : sentence;
        } else {
          currentChunkText = sentence;
        }
      }
    }

    if (currentChunkText.trim()) {
      chunks.push({
        chunkIndex: chunkIndex++,
        pageNumber: section.pageNumber,
        sectionTitle: section.sectionTitle,
        content: currentChunkText.trim(),
      });
    }
  }

  return chunks;
}
