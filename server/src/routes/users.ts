import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { uploadAvatar, uploadBufferToCloudinary } from "../lib/cloudinary.js";

const router = Router();

// ── PATCH /users/profile ──────────────────────────────────────────────────────

router.patch("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  const { fullName, phone, vehicleMake, vehicleModel, vehiclePlate, vehicleColor } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
    },
    select: { id: true, fullName: true, phone: true, avatarUrl: true, role: true },
  });

  if (
    req.user!.role === "DRIVER" &&
    (vehicleMake || vehicleModel || vehiclePlate || vehicleColor)
  ) {
    await prisma.driverProfile.update({
      where: { userId: req.user!.id },
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

router.post(
  "/avatar",
  authenticate,
  uploadAvatar.single("avatar"),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const avatarUrl = await uploadBufferToCloudinary(
      req.file.buffer,
      "dispatch/avatars",
      "image",
      [{ width: 400, height: 400, crop: "fill", gravity: "face" }]
    );

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl },
    });

    res.json({ avatarUrl });
  }
);

// ── GET /users/:id/reviews ────────────────────────────────────────────────────

router.get("/:id/reviews", authenticate, async (req: AuthRequest, res: Response) => {
  const ratings = await prisma.rating.findMany({
    where: { receiverId: String(req.params.id) },
    include: {
      giver: { select: { fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json(ratings);
});

// ── GET /users/stats ──────────────────────────────────────────────────────────

router.get("/stats", authenticate, async (req: AuthRequest, res: Response) => {
  const uid = req.user!.id;
  const role = req.user!.role;

  if (role === "PASSENGER") {
    const [totalTrips, totalSpent, driversSet] = await Promise.all([
      prisma.trip.count({ where: { passengerId: uid, status: "COMPLETED" } }),
      prisma.walletTransaction.aggregate({
        where: { wallet: { userId: uid }, type: "TRIP_PAYMENT" },
        _sum: { amount: true },
      }),
      prisma.trip.findMany({
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
  } else {
    const [totalTrips, totalEarned, distanceResult] = await Promise.all([
      prisma.trip.count({ where: { driverId: uid, status: "COMPLETED" } }),
      prisma.walletTransaction.aggregate({
        where: { wallet: { userId: uid }, type: "TRIP_EARNING" },
        _sum: { amount: true },
      }),
      prisma.trip.aggregate({
        where: { driverId: uid, status: "COMPLETED" },
        _sum: { distanceKm: true },
      }),
    ]);

    const reviews = await prisma.rating.findMany({
      where: { receiverId: uid },
      select: {
        score: true,
        review: true,
        giver: { select: { fullName: true } },
        createdAt: true,
      },
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

export default router;
