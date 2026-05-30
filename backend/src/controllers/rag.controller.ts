import { Request, Response } from "express";

import {
  uploadDocument,
  askQuestion,
} from "../services/rag.service";

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
      authReq.user.id,
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