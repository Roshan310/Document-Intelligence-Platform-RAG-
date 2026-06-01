import { Document } from "../models/document.model";
import { Chunk } from "../models/chunk.model";

import { extractTextFromFile } from "../rag/text-extractor";
import { chunkText } from "../rag/chunking";
import { createEmbedding, formatEmbedding } from "../rag/embedding";

import { searchSimilarChunks } from "../repositories/rag.repository";

import { generateAnswer, generateAnswerStream } from "../rag/generation";

export async function uploadDocument(
  file: Express.Multer.File,
  userId: number
) {
  const text = await extractTextFromFile(file);

  if (!text.trim()) {
    throw new Error("No extractable text found in document");
  }

  const chunks = chunkText(text);
  console.log("CHUNKS", chunks);

  if (chunks.length === 0) {
    throw new Error("Document did not produce any chunks");
  }

  const document = await Document.create({
    filename: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    userId,
  });

  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk, "document");

    await Chunk.create({
      content: chunk,
      embedding: formatEmbedding(embedding),
      documentId: document.id,
    });
  }

  return {
    message: "Document uploaded",
    documentId: document.id,
    chunkCount: chunks.length,
  };
}

export async function askQuestion(
  question: string,
  documentId?: number
) {
  if (!question.trim()) {
    throw new Error("Question is required");
  }

  const questionEmbedding =
    await createEmbedding(question, "query");

  const results: any =
    await searchSimilarChunks(questionEmbedding, {
      documentId,
    });

  const context = results
    .map((item: any) => `${item.filename}: ${item.content}`)
    .join("\n\n");

  if (!context.trim()) {
    throw new Error("No relevant context found for this question");
  }

  const answer = await generateAnswer(
    question,
    context
  );

  return answer;
}

export async function streamQuestionAnswer(
  question: string,
  documentId?: number
) {
  if (!question.trim()) {
    throw new Error("Question is required");
  }

  const questionEmbedding =
    await createEmbedding(question, "query");

  const results: any =
    await searchSimilarChunks(questionEmbedding, {
      documentId,
    });

  const context = results
    .map((item: any) => `${item.filename}: ${item.content}`)
    .join("\n\n");

  if (!context.trim()) {
    throw new Error("No relevant context found for this question");
  }

  return generateAnswerStream(question, context);
}