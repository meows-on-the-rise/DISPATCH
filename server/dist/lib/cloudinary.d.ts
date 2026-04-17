import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
export declare const uploadAvatar: multer.Multer;
export declare const uploadDocument: multer.Multer;
export declare const handleAvatarUpload: (buffer: Buffer) => Promise<{
    secure_url: string;
    public_id: string;
}>;
export declare const handleDocumentUpload: (buffer: Buffer) => Promise<{
    secure_url: string;
    public_id: string;
}>;
export { cloudinary };
//# sourceMappingURL=cloudinary.d.ts.map