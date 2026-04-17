"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const mailer_js_1 = require("../lib/mailer.js");
const pricing_js_1 = require("../lib/pricing.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// ── Schemas ──────────────────────────────────────────────────────────────────
const registerSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2),
    username: zod_1.z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().min(8),
    password: zod_1.z.string().min(8),
    dob: zod_1.z.string(), // ISO date string
    idNumber: zod_1.z.string().min(6),
    role: zod_1.z.enum(["PASSENGER", "DRIVER"]),
});
const loginSchema = zod_1.z.object({
    identifier: zod_1.z.string(), // username or email
    password: zod_1.z.string(),
});
// ── Helpers ───────────────────────────────────────────────────────────────────
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
    });
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
    });
}
// ── POST /auth/register ───────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { fullName, username, email, phone, password, dob, idNumber, role } = parsed.data;
    // Check uniqueness
    const existing = await prisma_js_1.prisma.user.findFirst({
        where: { OR: [{ email }, { username }, { phone }, { idNumber }] },
    });
    if (existing) {
        res.status(409).json({ error: "Email, username, phone, or ID number already in use" });
        return;
    }
    const hash = await bcryptjs_1.default.hash(password, 12);
    let userId = (0, pricing_js_1.generateUserId)(role);
    // Ensure userId uniqueness (extremely rare collision, but safe)
    while (await prisma_js_1.prisma.user.findUnique({ where: { userId } })) {
        userId = (0, pricing_js_1.generateUserId)(role);
    }
    const user = await prisma_js_1.prisma.user.create({
        data: {
            userId,
            fullName,
            username,
            email,
            phone,
            password: hash,
            dob: new Date(dob),
            idNumber,
            role,
            wallet: { create: { balance: 0 } },
            ...(role === "DRIVER"
                ? { driverProfile: { create: {} } }
                : {}),
        },
        select: {
            id: true, userId: true, fullName: true, email: true, role: true,
            avatarUrl: true, rating: true, wallet: { select: { balance: true } },
        },
    });
    // Send welcome email (non-blocking)
    (0, mailer_js_1.sendWelcomeEmail)(email, fullName, userId).catch(console.error);
    const accessToken = signAccessToken({ id: user.id, role, userId: user.userId });
    const refreshToken = signRefreshToken({ id: user.id });
    await prisma_js_1.prisma.refreshToken.create({
        data: {
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
    res.status(201).json({ user, accessToken, refreshToken });
});
// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { identifier, password } = parsed.data;
    const user = await prisma_js_1.prisma.user.findFirst({
        where: { OR: [{ email: identifier }, { username: identifier }] },
        include: {
            wallet: { select: { balance: true } },
            driverProfile: { select: { isClockedIn: true, isVerified: true, documents: true } },
        },
    });
    if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }
    const accessToken = signAccessToken({
        id: user.id,
        role: user.role,
        userId: user.userId,
    });
    const refreshToken = signRefreshToken({ id: user.id });
    await prisma_js_1.prisma.refreshToken.create({
        data: {
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
    const { password: _pw, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
});
// ── POST /auth/refresh ────────────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(401).json({ error: "Refresh token required" });
        return;
    }
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    }
    catch {
        res.status(401).json({ error: "Invalid refresh token" });
        return;
    }
    const stored = await prisma_js_1.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
        res.status(401).json({ error: "Refresh token expired or revoked" });
        return;
    }
    const user = await prisma_js_1.prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
    }
    // Rotate refresh token
    await prisma_js_1.prisma.refreshToken.delete({ where: { token: refreshToken } });
    const newRefresh = signRefreshToken({ id: user.id });
    await prisma_js_1.prisma.refreshToken.create({
        data: {
            userId: user.id,
            token: newRefresh,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });
    const accessToken = signAccessToken({
        id: user.id,
        role: user.role,
        userId: user.userId,
    });
    res.json({ accessToken, refreshToken: newRefresh });
});
// ── POST /auth/logout ─────────────────────────────────────────────────────────
router.post("/logout", async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await prisma_js_1.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: "Logged out" });
});
// ── POST /auth/forgot-password ────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ error: "Email required" });
        return;
    }
    const user = await prisma_js_1.prisma.user.findUnique({ where: { email } });
    // Always respond 200 to prevent email enumeration
    if (!user) {
        res.json({ message: "If that email exists, an OTP has been sent." });
        return;
    }
    // Invalidate old OTPs
    await prisma_js_1.prisma.otpToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
    });
    const otp = generateOtp();
    await prisma_js_1.prisma.otpToken.create({
        data: {
            userId: user.id,
            token: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
        },
    });
    (0, mailer_js_1.sendOtpEmail)(email, otp, user.fullName).catch(console.error);
    res.json({ message: "If that email exists, an OTP has been sent." });
});
// ── POST /auth/reset-password ─────────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        res.status(400).json({ error: "email, otp, and newPassword required" });
        return;
    }
    if (newPassword.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
    }
    const user = await prisma_js_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(400).json({ error: "Invalid request" });
        return;
    }
    const token = await prisma_js_1.prisma.otpToken.findFirst({
        where: {
            userId: user.id,
            token: otp,
            used: false,
            expiresAt: { gt: new Date() },
        },
    });
    if (!token) {
        res.status(400).json({ error: "Invalid or expired OTP" });
        return;
    }
    const hash = await bcryptjs_1.default.hash(newPassword, 12);
    await prisma_js_1.prisma.user.update({ where: { id: user.id }, data: { password: hash } });
    await prisma_js_1.prisma.otpToken.update({ where: { id: token.id }, data: { used: true } });
    // Revoke all refresh tokens on password change
    await prisma_js_1.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    res.json({ message: "Password reset successful" });
});
// ── GET /auth/me ──────────────────────────────────────────────────────────────
router.get("/me", auth_js_1.authenticate, async (req, res) => {
    const user = await prisma_js_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true, userId: true, fullName: true, username: true,
            email: true, phone: true, role: true, avatarUrl: true,
            rating: true, reviewCount: true, createdAt: true,
            wallet: { select: { balance: true } },
            driverProfile: {
                select: {
                    isClockedIn: true, isVerified: true,
                    vehicleMake: true, vehicleModel: true,
                    vehiclePlate: true, vehicleColor: true,
                    documents: { select: { docType: true, status: true, fileUrl: true } },
                },
            },
        },
    });
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    res.json(user);
});
exports.default = router;
//# sourceMappingURL=auth.js.map