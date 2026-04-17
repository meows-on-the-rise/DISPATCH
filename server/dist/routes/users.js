"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const cloudinary_js_1 = require("../lib/cloudinary.js");
const router = (0, express_1.Router)();
// ── PATCH /users/profile ──────────────────────────────────────────────────────
router.patch("/profile", auth_js_1.authenticate, async (req, res) => {
    const { fullName, phone, vehicleMake, vehicleModel, vehiclePlate, vehicleColor } = req.body;
    const user = await prisma_js_1.prisma.user.update({
        where: { id: req.user.id },
        data: { ...(fullName && { fullName }), ...(phone && { phone }) },
        select: { id: true, fullName: true, phone: true, avatarUrl: true, role: true },
    });
    if (req.user.role === "DRIVER" && (vehicleMake || vehicleModel || vehiclePlate || vehicleColor)) {
        await prisma_js_1.prisma.driverProfile.update({
            where: { userId: req.user.id },
            data: {
                ...(vehicleMake && { vehicleMake }),
                ...(vehicleModel && { vehicleModel }),
                ...(vehiclePlate && { vehiclePlate }),
                ...(vehicleColor && { vehicleColor }),
            },
        });
    }
    res.json(user);
});
// ── POST /users/avatar ────────────────────────────────────────────────────────
router.post("/avatar", auth_js_1.authenticate, cloudinary_js_1.uploadAvatar.single("avatar"), async (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }
    const { secure_url } = await (0, cloudinary_js_1.handleAvatarUpload)(req.file.buffer);
    await prisma_js_1.prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl: secure_url },
    });
    res.json({ avatarUrl: secure_url });
});
// ── GET /users/:id/reviews ────────────────────────────────────────────────────
router.get("/:id/reviews", auth_js_1.authenticate, async (req, res) => {
    const ratings = await prisma_js_1.prisma.rating.findMany({
        where: { receiverId: req.params.id },
        include: { giver: { select: { fullName: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
    });
    res.json(ratings);
});
// ── GET /users/:id/stats ──────────────────────────────────────────────────────
router.get("/stats", auth_js_1.authenticate, async (req, res) => {
    const uid = req.user.id;
    const role = req.user.role;
    if (role === "PASSENGER") {
        const [totalTrips, totalSpent, driversSet] = await Promise.all([
            prisma_js_1.prisma.trip.count({ where: { passengerId: uid, status: "COMPLETED" } }),
            prisma_js_1.prisma.walletTransaction.aggregate({
                where: { wallet: { userId: uid }, type: "TRIP_PAYMENT" },
                _sum: { amount: true },
            }),
            prisma_js_1.prisma.trip.findMany({
                where: { passengerId: uid, status: "COMPLETED", driverId: { not: null } },
                select: { driverId: true },
                distinct: ["driverId"],
            }),
        ]);
        res.json({
            totalTrips,
            totalSpent: totalSpent._sum.amount ?? 0,
            uniqueDrivers: driversSet.length,
        });
    }
    else {
        const [totalTrips, totalEarned, distanceResult] = await Promise.all([
            prisma_js_1.prisma.trip.count({ where: { driverId: uid, status: "COMPLETED" } }),
            prisma_js_1.prisma.walletTransaction.aggregate({
                where: { wallet: { userId: uid }, type: "TRIP_EARNING" },
                _sum: { amount: true },
            }),
            prisma_js_1.prisma.trip.aggregate({
                where: { driverId: uid, status: "COMPLETED" },
                _sum: { distanceKm: true },
            }),
        ]);
        const reviews = await prisma_js_1.prisma.rating.findMany({
            where: { receiverId: uid },
            select: { score: true, review: true, giver: { select: { fullName: true } }, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
        res.json({
            totalTrips,
            totalEarned: totalEarned._sum.amount ?? 0,
            totalDistanceKm: distanceResult._sum.distanceKm ?? 0,
            recentReviews: reviews,
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map