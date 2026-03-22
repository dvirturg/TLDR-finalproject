"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPostImage = exports.POST_IMAGE_MAX_FILE_SIZE = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
exports.POST_IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
]);
const uploadsDir = path_1.default.resolve(__dirname, "..", "..", "public", "uploads", "posts");
fs_1.default.mkdirSync(uploadsDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const extension = path_1.default.extname(file.originalname) || ".bin";
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `post-${uniqueSuffix}${extension}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: exports.POST_IMAGE_MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
            cb(new Error("Only image files are allowed"));
            return;
        }
        cb(null, true);
    },
});
const uploadPostImage = (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (!err) {
            next();
            return;
        }
        if (err instanceof multer_1.default.MulterError) {
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
exports.uploadPostImage = uploadPostImage;
