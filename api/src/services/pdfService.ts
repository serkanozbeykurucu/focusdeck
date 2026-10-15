import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  return (data.text ?? '').trim();
}

export async function extractTextFromTxt(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  return content.trim();
}

export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export async function extractText(filePath: string, mimeType: string, originalName: string): Promise<string> {
  const lower = originalName.toLowerCase();
  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
    return extractTextFromPdf(filePath);
  }
  if (
    mimeType === 'text/plain' ||
    mimeType === 'text/markdown' ||
    lower.endsWith('.txt') ||
    lower.endsWith('.md')
  ) {
    return extractTextFromTxt(filePath);
  }
  throw new Error('Unsupported file type. Upload a PDF or .txt file.');
}
