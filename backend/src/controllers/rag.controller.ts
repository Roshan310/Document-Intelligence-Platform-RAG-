import { Request, Response } from "express";

import {
  uploadDocument,
  askQuestion,
  streamQuestionAnswer,
} from "../services/rag.service";
import { listUploadedDocuments } from "../repositories/document.repo";

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    role: "admin" | "user";
  };
};

export async function uploadController(
  req: Request,
  res: Response
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const file = req.file;
    const user = authReq.user;

    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const result = await uploadDocument(file, user.id);

    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";

    res.status(400).json({
      message,
    });
  }
}

export async function listDocumentsController(
  req: Request,
  res: Response
) {
  try {
    const documents = await listUploadedDocuments();

    return res.json({
      documents: documents.map((document) => ({
        id: document.id,
        filename: document.filename,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        userId: document.userId,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load documents";

    res.status(500).json({
      message,
    });
  }
}

export async function askController(
  req: Request,
  res: Response
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const { question, documentId } = req.body;

    if (!authReq.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const normalizedDocumentId =
      documentId !== undefined && documentId !== null
        ? Number(documentId)
        : undefined;

    const answer = await askQuestion(
      question,
      Number.isFinite(normalizedDocumentId)
        ? normalizedDocumentId
        : undefined
    );

    res.json({
      answer,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Question failed";

    res.status(400).json({
      message,
    });
  }
}

function writeSseEvent(
  res: Response,
  event: string,
  data: unknown
) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export async function askStreamController(
  req: Request,
  res: Response
) {
  const authReq = req as AuthenticatedRequest;
  const { question, documentId } = req.body;

  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const normalizedDocumentId =
    documentId !== undefined && documentId !== null
      ? Number(documentId)
      : undefined;

  try {
    const answerStream = await streamQuestionAnswer(
      question,
      Number.isFinite(normalizedDocumentId)
        ? normalizedDocumentId
        : undefined
    );

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    writeSseEvent(res, "start", { ok: true });

    for await (const chunk of answerStream) {
      writeSseEvent(res, "chunk", { delta: chunk });
    }

    writeSseEvent(res, "done", { ok: true });
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Question failed";

    if (!res.headersSent) {
      const status = message === "Question is required" || message === "No relevant context found for this question"
        ? 400
        : 500;

      return res.status(status).json({
        message,
      });
    }

    writeSseEvent(res, "error", { message });
    res.end();
  }
}