import { Request, Response } from "express";

import {
  uploadDocument,
  askQuestion,
  streamQuestionAnswer,
} from "../services/rag.service";
import {
  createEmptyConversation,
  deleteConversation,
  ensureConversationAccess,
  getConversation,
  listConversations,
  saveQuestionAnswer,
} from "../services/chat.service";
import {
  deleteUploadedDocument,
  listUploadedDocuments,
} from "../repositories/document.repo";

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    role: "admin" | "user";
  };
};

function normalizeOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalizedValue = Number(value);
  return Number.isFinite(normalizedValue) ? normalizedValue : undefined;
}

function getRequiredUser(req: Request) {
  return (req as AuthenticatedRequest).user;
}

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

export async function deleteDocumentController(
  req: Request,
  res: Response
) {
  try {
    const documentId = Number(req.params?.id);

    if (!Number.isFinite(documentId)) {
      return res.status(400).json({
        message: "Valid document id is required",
      });
    }

    const deletedDocument = await deleteUploadedDocument(documentId);

    if (!deletedDocument) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    return res.json({
      message: "Document deleted",
      document: {
        id: deletedDocument.id,
        filename: deletedDocument.filename,
        mimeType: deletedDocument.mimeType,
        sizeBytes: deletedDocument.sizeBytes,
        userId: deletedDocument.userId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";

    res.status(500).json({
      message,
    });
  }
}

export async function listChatConversationsController(
  req: Request,
  res: Response
) {
  try {
    const user = getRequiredUser(req);

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const conversations = await listConversations(user.id);

    return res.json({
      conversations,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load chat history";

    return res.status(500).json({
      message,
    });
  }
}

export async function getChatConversationController(
  req: Request,
  res: Response
) {
  try {
    const user = getRequiredUser(req);
    const conversationId = Number(req.params?.id);

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isFinite(conversationId)) {
      return res.status(400).json({
        message: "Valid conversation id is required",
      });
    }

    const conversation = await getConversation(user.id, conversationId);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.json({
      conversation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load conversation";

    return res.status(500).json({
      message,
    });
  }
}

export async function createChatConversationController(
  req: Request,
  res: Response
) {
  try {
    const user = getRequiredUser(req);
    const { title, subtitle, documentId } = req.body;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const conversation = await createEmptyConversation(user.id, {
      title: typeof title === "string" && title.trim() ? title.trim() : undefined,
      subtitle: typeof subtitle === "string" ? subtitle.trim() : null,
      documentId: normalizeOptionalNumber(documentId) ?? null,
    });

    return res.status(201).json({
      conversation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create conversation";

    return res.status(400).json({
      message,
    });
  }
}

export async function deleteChatConversationController(
  req: Request,
  res: Response
) {
  try {
    const user = getRequiredUser(req);
    const conversationId = Number(req.params?.id);

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isFinite(conversationId)) {
      return res.status(400).json({
        message: "Valid conversation id is required",
      });
    }

    const deletedConversation = await deleteConversation(user.id, conversationId);

    if (!deletedConversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.json({
      message: "Conversation deleted",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete conversation";

    return res.status(500).json({
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
    const { question, documentId, conversationId } = req.body;

    if (!authReq.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const normalizedDocumentId = normalizeOptionalNumber(documentId);
    const normalizedConversationId = normalizeOptionalNumber(conversationId);

    await ensureConversationAccess(authReq.user.id, normalizedConversationId);

    const answer = await askQuestion(
      question,
      normalizedDocumentId
    );

    const savedChat = await saveQuestionAnswer(
      authReq.user.id,
      {
        conversationId: normalizedConversationId,
        question,
        answer,
        documentId: normalizedDocumentId ?? null,
      }
    );

    res.json({
      answer,
      conversation: savedChat.conversation,
      messages: savedChat.messages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Question failed";
    const status = message === "Conversation not found" ? 404 : 400;

    res.status(status).json({
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
  const { question, documentId, conversationId } = req.body;

  if (!authReq.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const normalizedDocumentId = normalizeOptionalNumber(documentId);
  const normalizedConversationId = normalizeOptionalNumber(conversationId);

  try {
    await ensureConversationAccess(authReq.user.id, normalizedConversationId);

    const answerStream = await streamQuestionAnswer(
      question,
      normalizedDocumentId
    );
    let answer = "";

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    writeSseEvent(res, "start", { ok: true });

    for await (const chunk of answerStream) {
      answer += chunk;
      writeSseEvent(res, "chunk", { delta: chunk });
    }

    const savedChat = await saveQuestionAnswer(
      authReq.user.id,
      {
        conversationId: normalizedConversationId,
        question,
        answer,
        documentId: normalizedDocumentId ?? null,
      }
    );

    writeSseEvent(res, "saved", savedChat);
    writeSseEvent(res, "done", { ok: true });
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Question failed";

    if (!res.headersSent) {
      const status = message === "Conversation not found"
        ? 404
        : message === "Question is required" || message === "No relevant context found for this question"
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
