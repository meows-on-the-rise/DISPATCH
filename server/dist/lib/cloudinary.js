"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.handleDocumentUpload = exports.handleAvatarUpload = exports.uploadDocument = exports.uploadAvatar = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const multer_1 = __importDefault(require("multer"));
const stream_1 = require("stream");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const streamUpload = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({
            folder: options.folder,
            allowed_formats: options.allowed_formats,
            resource_type: options.resource_type ?? "image",
            transformation: options.transformation,
        }, (error, result) => {
            if (error || !result)
                return reject(error ?? new Error("Upload failed"));
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
        });
        stream_1.Readable.from(buffer).pipe(stream);
    });
};
// ─── multer instances (memory storage — no third-party adapter needed) ─────
exports.uploadAvatar = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
exports.uploadDocument = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
// ─── route helpers ─────────────────────────────────────────────────────────
const handleAvatarUpload = (buffer) => streamUpload(buffer, {
    folder: "dispatch/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
});
exports.handleAvatarUpload = handleAvatarUpload;
const handleDocumentUpload = (buffer) => streamUpload(buffer, {
    folder: "dispatch/documents",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    resource_type: "auto",
});
exports.handleDocumentUpload = handleDocumentUpload;
//# sourceMappingURL=cloudinary.js.map