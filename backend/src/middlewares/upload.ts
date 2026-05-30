import multer from "multer";
import { Request } from "express";
import { isSupportedUpload } from "../rag/text-extractor";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb
  ) => {
    if (isSupportedUpload(file)) {
      cb(null, true);
      return;
    }

    cb(new Error("Unsupported file type"));
  },
});

