import { Router } from "express";

import {
  uploadController,
  listDocumentsController,
  deleteDocumentController,
  listChatConversationsController,
  getChatConversationController,
  createChatConversationController,
  deleteChatConversationController,
  askController,
  askStreamController,
} from "../controllers/rag.controller";

import { upload } from "../middlewares/upload";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.get(
  "/documents",
  requireAuth,
  listDocumentsController
);

router.delete(
  "/documents/:id",
  requireAuth,
  requireRole("admin"),
  deleteDocumentController
);

router.get(
  "/chats",
  requireAuth,
  listChatConversationsController
);

router.post(
  "/chats",
  requireAuth,
  createChatConversationController
);

router.get(
  "/chats/:id",
  requireAuth,
  getChatConversationController
);

router.delete(
  "/chats/:id",
  requireAuth,
  deleteChatConversationController
);

router.post(
  "/upload",
  requireAuth,
  requireRole("admin"),
  upload.single("file"),
  uploadController
);

router.post(
  "/ask",
  requireAuth,
  askController
);

router.post(
  "/ask/stream",
  requireAuth,
  askStreamController
);

export default router;
