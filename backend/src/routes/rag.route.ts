import { Router } from "express";

import {
  uploadController,
  askController,
} from "../controllers/rag.controller";

import { upload } from "../middlewares/upload";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  uploadController
);

router.post(
  "/ask",
  requireAuth,
  askController
);

export default router;