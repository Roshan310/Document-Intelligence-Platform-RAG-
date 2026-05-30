import path from "path";
import { extractPdfText } from "./pdf";

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
]);

const SUPPORTED_EXTENSIONS = new Set([
  ".pdf",
]);

export async function extractTextFromFile(
  file: Express.Multer.File
) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    SUPPORTED_MIME_TYPES.has(file.mimetype) ||
    SUPPORTED_EXTENSIONS.has(extension)
  ) {
    return extractPdfText(file.buffer);
  }

  throw new Error(
    `Unsupported file type: ${file.mimetype || extension || "unknown"}`
  );
}

export function isSupportedUpload(file: Express.Multer.File) {
  const extension = path.extname(file.originalname).toLowerCase();

  return (
    SUPPORTED_MIME_TYPES.has(file.mimetype) ||
    SUPPORTED_EXTENSIONS.has(extension)
  );
}