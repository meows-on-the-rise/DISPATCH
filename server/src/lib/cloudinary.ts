import cloudinaryV1 from "cloudinary";
import multer from "multer";
import { Request } from "express";
import { Readable } from "stream";

const cloudinary = cloudinaryV1.v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Use memory storage — files land in req.file.buffer
// then we stream them to Cloudinary manually
const storage = multer.memoryStorage();

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(_req: Request, file, cb) {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed for avatars"));
  },
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(_req: Request, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only images and PDFs are allowed for documents"));
  },
});

// ── Upload helper — streams a buffer to Cloudinary ────────────────────────────

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "raw" | "auto" = "auto",
  transformation?: object
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...(transformation ? { transformation } : {}),
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

export { cloudinary };
