"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate);
router.use((0, auth_js_1.requireRole)("ADMIN"));
// ── GET /admin/documents/pending ──────────────────────────────────────────────
router.get("/documents/pending", async (_req, res) => {
    const docs = await prisma_js_1.prisma.driverDocument.findMany({
        where: { status: "PENDING" },
        include: {
            driverProfile: {
                include: { user: { select: { fullName: true, userId: true, email: true } } },
            },
        },
        orderBy: { uploadedAt: "asc" },
    });
    res.json(docs);
});
// ── PATCH /admin/documents/:id ────────────────────────────────────────────────
router.patch("/documents/:id", async (req, res) => {
    const { status, reviewNote } = req.body;
    if (!["VERIFIED", "REJECTED"].includes(status)) {
        res.status(400).json({ error: "status must be VERIFIED or REJECTED" });
        return;
    }
    const doc = await prisma_js_1.prisma.driverDocument.update({
        where: { id: req.params.id },
        data: { status, reviewNote, reviewedAt: new Date() },
    });
    // If all 3 docs verified, mark driver as verified
    const verifiedCount = await prisma_js_1.prisma.driverDocument.count({
        where: { driverProfileId: doc.driverProfileId, status: "VERIFIED" },
    });
    if (verifiedCount >= 3) {
        await prisma_js_1.prisma.driverProfile.update({
            where: { id: doc.driverProfileId },
            data: { isVerified: true },
        });
    }
    else {
        await prisma_js_1.prisma.driverProfile.update({
            where: { id: doc.driverProfileId },
            data: { isVerified: false },
        });
    }
    res.json(doc);
});
// ── GET /admin/users ──────────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
    const { role, page = "1" } = req.query;
    const take = 20;
    const skip = (Number(page) - 1) * take;
    const [users, total] = await Promise.all([
        prisma_js_1.prisma.user.findMany({
            where: role ? { role: role } : undefined,
            select: {
                id: true, userId: true, fullName: true, email: true, phone: true,
                role: true, rating: true, reviewCount: true, createdAt: true,
                wallet: { select: { balance: true } },
                driverProfile: { select: { isVerified: true, isClockedIn: true } },
            },
            orderBy: { createdAt: "desc" },
            take,
            skip,
        }),
        prisma_js_1.prisma.user.count({ where: role ? { role: role } : undefined }),
    ]);
    res.json({ users, total, page: Number(page), pages: Math.ceil(total / take) });
});
// ── GET /admin/trips ──────────────────────────────────────────────────────────
router.get("/trips", async (_req, res) => {
    const trips = await prisma_js_1.prisma.trip.findMany({
        include: {
            passenger: { select: { fullName: true, userId: true } },
            driver: { select: { fullName: true, userId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    res.json(trips);
});
// ── GET /admin/stats ──────────────────────────────────────────────────────────
router.get("/stats", async (_req, res) => {
    const [passengers, drivers, totalTrips, completedTrips, commission] = await Promise.all([
        prisma_js_1.prisma.user.count({ where: { role: "PASSENGER" } }),
        prisma_js_1.prisma.user.count({ where: { role: "DRIVER" } }),
        prisma_js_1.prisma.trip.count(),
        prisma_js_1.prisma.trip.count({ where: { status: "COMPLETED" } }),
        prisma_js_1.prisma.trip.aggregate({
            where: { status: "COMPLETED" },
            _sum: { systemCommission: true },
        }),
    ]);
    res.json({
        passengers,
        drivers,
        totalTrips,
        completedTrips,
        totalCommission: commission._sum.systemCommission ?? 0,
    });
});
exports.default = router;
//# sourceMappingURL=admin.js.map