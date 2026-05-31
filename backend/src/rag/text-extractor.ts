import path from "path";
import { extractPdfText } from "./pdf";
import { extractDocxText } from "./docx";

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const SUPPORTED_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".txt",
]);

const getFileType = (file: Express.Multer.File) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension === ".docx") {
    return "docx";
  }

  if (extension === ".txt") {
    return "txt";
  }

  if (
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }

  if (file.mimetype === "text/plain") {
    return "txt";
  }

  return "pdf";
};

export async function extractTextFromFile(
  file: Express.Multer.File
) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    SUPPORTED_MIME_TYPES.has(file.mimetype) ||
    SUPPORTED_EXTENSIONS.has(extension)
  ) {
    const fileType = getFileType(file);

    if (fileType === "docx") {
      return extractDocxText(file.buffer);
    }

    if (fileType === "txt") {
      return file.buffer.toString("utf8");
    }

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