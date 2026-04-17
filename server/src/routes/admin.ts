import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

// ── GET /admin/documents/pending ──────────────────────────────────────────────

router.get("/documents/pending", async (_req, res: Response) => {
  const docs = await prisma.driverDocument.findMany({
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

router.patch("/documents/:id", async (req: AuthRequest, res: Response) => {
  const { status, reviewNote } = req.body;
  if (!["VERIFIED", "REJECTED"].includes(status)) {
    res.status(400).json({ error: "status must be VERIFIED or REJECTED" });
    return;
  }

  const doc = await prisma.driverDocument.update({
    where: { id: req.params.id },
    data: { status, reviewNote, reviewedAt: new Date() },
  });

  // If all 3 docs verified, mark driver as verified
  const verifiedCount = await prisma.driverDocument.count({
    where: { driverProfileId: doc.driverProfileId, status: "VERIFIED" },
  });
  if (verifiedCount >= 3) {
    await prisma.driverProfile.update({
      where: { id: doc.driverProfileId },
      data: { isVerified: true },
    });
  } else {
    await prisma.driverProfile.update({
      where: { id: doc.driverProfileId },
      data: { isVerified: false },
    });
  }

  res.json(doc);
});

// ── GET /admin/users ──────────────────────────────────────────────────────────

router.get("/users", async (req: AuthRequest, res: Response) => {
  const { role, page = "1" } = req.query as { role?: string; page?: string };
  const take = 20;
  const skip = (Number(page) - 1) * take;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: role ? { role: role as "PASSENGER" | "DRIVER" | "ADMIN" } : undefined,
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
    prisma.user.count({ where: role ? { role: role as "PASSENGER" | "DRIVER" | "ADMIN" } : undefined }),
  ]);

  res.json({ users, total, page: Number(page), pages: Math.ceil(total / take) });
});

// ── GET /admin/trips ──────────────────────────────────────────────────────────

router.get("/trips", async (_req, res: Response) => {
  const trips = await prisma.trip.findMany({
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

router.get("/stats", async (_req, res: Response) => {
  const [passengers, drivers, totalTrips, completedTrips, commission] = await Promise.all([
    prisma.user.count({ where: { role: "PASSENGER" } }),
    prisma.user.count({ where: { role: "DRIVER" } }),
    prisma.trip.count(),
    prisma.trip.count({ where: { status: "COMPLETED" } }),
    prisma.trip.aggregate({
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

export default router;
