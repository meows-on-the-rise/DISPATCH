"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// ── GET /wallet ───────────────────────────────────────────────────────────────
router.get("/", auth_js_1.authenticate, async (req, res) => {
    const wallet = await prisma_js_1.prisma.wallet.findUnique({
        where: { userId: req.user.id },
        select: { balance: true },
    });
    res.json(wallet ?? { balance: 0 });
});
// ── GET /wallet/transactions ──────────────────────────────────────────────────
router.get("/transactions", auth_js_1.authenticate, async (req, res) => {
    const wallet = await prisma_js_1.prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet) {
        res.json([]);
        return;
    }
    const transactions = await prisma_js_1.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    res.json(transactions);
});
// ── POST /wallet/deposit ──────────────────────────────────────────────────────
const depositSchema = zod_1.z.object({
    amount: zod_1.z.number().positive().max(10000),
    method: zod_1.z.enum(["CARD", "ECOCASH", "MPESA"]),
    reference: zod_1.z.string().optional(),
});
router.post("/deposit", auth_js_1.authenticate, async (req, res) => {
    const parsed = depositSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { amount, method } = parsed.data;
    // In production: integrate payment gateway (Stripe, Flutterwave, etc.)
    // here we trust the request (demo). Add payment verification before going live.
    const wallet = await prisma_js_1.prisma.wallet.update({
        where: { userId: req.user.id },
        data: {
            balance: { increment: amount },
            transactions: {
                create: {
                    type: "DEPOSIT",
                    amount,
                    description: `Deposit via ${method}`,
                },
            },
        },
        select: { balance: true },
    });
    res.json({ balance: wallet.balance, deposited: amount });
});
// ── POST /wallet/withdraw ──────────────────────────────────────────────────────
const withdrawSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    method: zod_1.z.enum(["CARD", "ECOCASH", "MPESA"]),
});
router.post("/withdraw", auth_js_1.authenticate, async (req, res) => {
    if (req.user.role !== "DRIVER") {
        res.status(403).json({ error: "Only drivers can withdraw" });
        return;
    }
    const parsed = withdrawSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { amount, method } = parsed.data;
    const wallet = await prisma_js_1.prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet || Number(wallet.balance) < amount) {
        res.status(400).json({ error: "Insufficient balance" });
        return;
    }
    const updated = await prisma_js_1.prisma.wallet.update({
        where: { userId: req.user.id },
        data: {
            balance: { decrement: amount },
            transactions: {
                create: {
                    type: "WITHDRAWAL",
                    amount,
                    description: `Withdrawal to ${method}`,
                },
            },
        },
        select: { balance: true },
    });
    res.json({ balance: updated.balance, withdrawn: amount });
});
exports.default = router;
//# sourceMappingURL=wallet.js.map