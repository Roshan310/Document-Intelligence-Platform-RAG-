import { Router } from "express";

import {
  uploadController,
  listDocumentsController,
  askController,
  askStreamController,
} from "../controllers/rag.controller";

import { upload } from "../middlewares/upload";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

router.get(
  "/documents",
  requireAuth,
  requireRole("admin"),
  listDocumentsController
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