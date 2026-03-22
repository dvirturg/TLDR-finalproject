import fs from "fs";
import path from "path";
import multer from "multer";
import { NextFunction, Request, Response } from "express";

export const POST_IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const uploadsDir = path.resolve(__dirname, "..", "..", "public", "uploads", "posts");

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname) || ".bin";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `post-${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: POST_IMAGE_MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const uploadPostImage = (req: Request, res: Response, next: NextFunction) => {
  upload.single("image")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "Image file is too large" });
        return;
      }
      res.status(400).json({ message: err.message });
      return;
    }

    if (err instanceof Error) {
      res.status(400).json({ message: err.message });
      return;
    }

    res.status(500).json({ message: "Error uploading image" });
  });
};
