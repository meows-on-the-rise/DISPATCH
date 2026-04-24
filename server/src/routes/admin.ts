import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

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

  const verifiedCount = await prisma.driverDocument.count({
    where: { driverProfileId: doc.driverProfileId, status: "VERIFIED" },
  });
  await prisma.driverProfile.update({
    where: { id: doc.driverProfileId },
    data: { isVerified: verifiedCount >= 3 },
  });

  res.json(doc);
});

// ── GET /admin/users ──────────────────────────────────────────────────────────

router.get("/users", async (req: AuthRequest, res: Response) => {
  const { role, page = "1", search = "" } = req.query as {
    role?: string; page?: string; search?: string;
  };
  const take = 20;
  const skip = (Number(page) - 1) * take;

  const where: any = {
    ...(role ? { role: role as "PASSENGER" | "DRIVER" | "ADMIN" } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email:    { contains: search } },
            { userId:   { contains: search } },
            { phone:    { contains: search } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, userId: true, fullName: true, email: true, phone: true,
        role: true, rating: true, reviewCount: true, createdAt: true,
        wallet: { select: { balance: true } },
        driverProfile: { select: { isVerified: true, isClockedIn: true, vehicleMake: true, vehicleModel: true, vehiclePlate: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: Number(page), pages: Math.ceil(total / take) });
});

// ── GET /admin/users/:id ──────────────────────────────────────────────────────

router.get("/users/:id", async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, userId: true, fullName: true, username: true, email: true,
      phone: true, role: true, rating: true, reviewCount: true, createdAt: true,
      dob: true, idNumber: true, avatarUrl: true,
      wallet: { select: { balance: true } },
      driverProfile: {
        select: {
          isVerified: true, isClockedIn: true,
          vehicleMake: true, vehicleModel: true, vehiclePlate: true, vehicleColor: true,
          documents: { select: { docType: true, status: true, fileUrl: true, uploadedAt: true } },
        },
      },
    },
  });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

// ── PATCH /admin/users/:id ────────────────────────────────────────────────────
// Update user details (admin can change name, phone, role)

router.patch("/users/:id", async (req: AuthRequest, res: Response) => {
  const { fullName, phone, role, newPassword } = req.body;

  // Validate role if provided
  if (role && !["PASSENGER", "DRIVER", "ADMIN"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  const updateData: any = {};
  if (fullName) updateData.fullName = fullName;
  if (phone)    updateData.phone    = phone;
  if (role)     updateData.role     = role;
  if (newPassword) {
    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: {
      id: true, userId: true, fullName: true, email: true, phone: true, role: true,
    },
  });
  res.json(user);
});

// ── DELETE /admin/users/:id ───────────────────────────────────────────────────

router.delete("/users/:id", async (req: AuthRequest, res: Response) => {
  // Prevent deleting self
  if (req.user?.id === req.params.id) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// ── GET /admin/trips ──────────────────────────────────────────────────────────

router.get("/trips", async (req: AuthRequest, res: Response) => {
  const { search = "", status } = req.query as { search?: string; status?: string };

  const trips = await prisma.trip.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(search
        ? {
            OR: [
              { passenger: { fullName: { contains: search } } },
              { driver:    { fullName: { contains: search } } },
              { pickupAddress:  { contains: search } },
              { dropoffAddress: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      passenger: { select: { fullName: true, userId: true } },
      driver:    { select: { fullName: true, userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(trips);
});

// ── PATCH /admin/trips/:id ────────────────────────────────────────────────────
// Admin can cancel a trip or override status

router.patch("/trips/:id", async (req: AuthRequest, res: Response) => {
  const { status, cancelReason, pickupAddress, dropoffAddress, seats } = req.body;

  // If it's a cancel action
  if (status === "CANCELLED") {
    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data: {
        status,
        cancelledBy:  req.user!.id,
        cancelReason: cancelReason ?? "Cancelled by admin",
        cancelledAt:  new Date(),
      },
    });
    res.json(trip);
    return;
  }

  // General edit
  const allowed = ["REQUESTED", "DRIVER_ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  if (status && !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const data: any = {};
  if (pickupAddress)  data.pickupAddress  = pickupAddress;
  if (dropoffAddress) data.dropoffAddress = dropoffAddress;
  if (seats)          data.seats          = Number(seats);
  if (status)         data.status         = status;

  const trip = await prisma.trip.update({
    where: { id: req.params.id },
    data,
  });
  res.json(trip);
});

// ── GET /admin/reviews ───────────────────────────────────────────────────────

router.get("/reviews", async (_req, res: Response) => {
  const ratings = await prisma.rating.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      giver:    { select: { fullName: true, avatarUrl: true, role: true } },
      receiver: { select: { fullName: true, avatarUrl: true, role: true } },
      trip:     { select: { pickupAddress: true, dropoffAddress: true } },
    },
  });
  res.json(ratings);
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
