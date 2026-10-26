import fs from 'fs';
import * as XLSX from 'xlsx';
import { ParsedSection } from './pdf.parser';

export async function parseXlsx(filePath: string): Promise<ParsedSection[]> {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  const sections: ParsedSection[] = [];
  let pageIndex = 1;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert to structured CSV / TSV text
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    if (!csvContent.trim()) continue;

    // Convert to readable text representation
    const rows = csvContent.split('\n').filter((r) => r.trim().length > 0);
    if (rows.length === 0) continue;

    const formattedRows: string[] = [];
    formattedRows.push(`Sheet: ${sheetName}`);
    formattedRows.push(`Total Rows: ${rows.length}`);
    formattedRows.push('--- Data ---');

    for (const row of rows) {
      formattedRows.push(row);
    }

    sections.push({
      pageNumber: pageIndex,
      sectionTitle: `Sheet: ${sheetName}`,
      content: formattedRows.join('\n'),
    });

    pageIndex++;
  }

  return sections.length > 0 ? sections : [{ pageNumber: 1, content: 'Empty Spreadsheet' }];
}
