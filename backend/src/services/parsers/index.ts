import path from 'path';
import { parsePdf, ParsedSection } from './pdf.parser';
import { parseDocx } from './docx.parser';
import { parseXlsx } from './xlsx.parser';
import { parsePptx } from './pptx.parser';
import { parseText } from './text.parser';

export { ParsedSection };

export async function parseDocument(filePath: string, fileFormat: string): Promise<ParsedSection[]> {
  const ext = (fileFormat || path.extname(filePath).replace('.', '')).toLowerCase();

  switch (ext) {
    case 'pdf':
      return await parsePdf(filePath);
    case 'docx':
    case 'doc':
      return await parseDocx(filePath);
    case 'xlsx':
    case 'xls':
    case 'csv':
      return await parseXlsx(filePath);
    case 'pptx':
    case 'ppt':
      return await parsePptx(filePath);
    case 'txt':
    case 'md':
    default:
      return await parseText(filePath);
  }
}
