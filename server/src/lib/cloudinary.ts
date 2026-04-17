import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ─── helpers ───────────────────────────────────────────────────────────────

type UploadOptions = {
  folder: string;
  allowed_formats: string[];
  resource_type?: "auto" | "image" | "video" | "raw";
  transformation?: object[];
};

const streamUpload = (
  buffer: Buffer,
  options: UploadOptions
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        allowed_formats: options.allowed_formats,
        resource_type: options.resource_type ?? "image",
        transformation: options.transformation,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// ─── multer instances (memory storage — no third-party adapter needed) ─────

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ─── route helpers ─────────────────────────────────────────────────────────

export const handleAvatarUpload = (buffer: Buffer) =>
  streamUpload(buffer, {
    folder: "dispatch/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  });

export const handleDocumentUpload = (buffer: Buffer) =>
  streamUpload(buffer, {
    folder: "dispatch/documents",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    resource_type: "auto",
  });

export { cloudinary };