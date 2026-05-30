import { PDFParse } from "pdf-parse";

export async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  const data = await parser.getText();

  return data.text;
}