import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { calculateTripPrice, haversineKm } from "../lib/pricing.js";
import { getIO } from "../socket/io.js";

const router = Router();

// ── POST /trips/estimate ──────────────────────────────────────────────────────
// Get a price estimate before booking

router.post("/estimate", authenticate, async (req: AuthRequest, res: Response) => {
  const { pickupLat, pickupLng, dropoffLat, dropoffLng, durationMin } = req.body;
  if (pickupLat == null || pickupLng == null || dropoffLat == null || dropoffLng == null) {
    res.status(400).json({ error: "Coordinates required" });
    return;
  }
  const distanceKm = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const duration = durationMin ?? distanceKm * 3; // fallback estimate
  const price = calculateTripPrice(distanceKm, duration);
  res.json({ distanceKm: Math.round(distanceKm * 10) / 10, durationMin: Math.round(duration), ...price });
});

// ── POST /trips ───────────────────────────────────────────────────────────────
// Passenger requests a ride

const createTripSchema = z.object({
  pickupAddress: z.string(),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffAddress: z.string(),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
  seats: z.number().int().min(1).max(6).default(1),
  durationMin: z.number().optional(),
});

router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== "PASSENGER") {
    res.status(403).json({ error: "Passengers only" });
    return;
  }

  const parsed = createTripSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng, seats, durationMin } = parsed.data;

  const distanceKm = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const duration = durationMin ?? distanceKm * 3;
  const price = calculateTripPrice(distanceKm, duration);

  // Check wallet balance
  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
  if (!wallet || Number(wallet.balance) < price.totalPrice) {
    res.status(400).json({
      error: "Insufficient Dispatch Cash balance",
      required: price.totalPrice,
      balance: wallet?.balance ?? 0,
    });
    return;
  }

  const trip = await prisma.trip.create({
    data: {
      passengerId: req.user!.id,
      pickupAddress, pickupLat, pickupLng,
      dropoffAddress, dropoffLat, dropoffLng,
      seats,
      distanceKm,
      durationMin: duration,
      totalPrice: price.totalPrice,
      driverEarning: price.driverEarning,
      systemCommission: price.systemCommission,
      status: "REQUESTED",
    },
    include: {
      passenger: { select: { fullName: true, avatarUrl: true, rating: true, userId: true } },
    },
  });

  // Broadcast to nearby clocked-in drivers via Socket.IO
  getIO().emit("new:trip", trip);

  res.status(201).json(trip);
});

// ── GET /trips/available ──────────────────────────────────────────────────────
// Driver: see open trips near their location

router.get("/available", authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== "DRIVER") {
    res.status(403).json({ error: "Drivers only" });
    return;
  }

  const trips = await prisma.trip.findMany({
    where: { status: "REQUESTED", driverId: null },
    include: {
      passenger: { select: { fullName: true, avatarUrl: true, rating: true, userId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  res.json(trips);
});

// ── POST /trips/:id/accept ────────────────────────────────────────────────────

router.post("/:id/accept", authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== "DRIVER") {
    res.status(403).json({ error: "Drivers only" });
    return;
  }

  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip || trip.status !== "REQUESTED") {
    res.status(400).json({ error: "Trip not available" });
    return;
  }

  // Check driver is verified and clocked in
  const driverProfile = await prisma.driverProfile.findUnique({ where: { userId: req.user!.id } });
  if (!driverProfile?.isVerified) {
    res.status(403).json({ error: "Account not verified by admin" });
    return;
  }
  if (!driverProfile.isClockedIn) {
    res.status(403).json({ error: "Clock in before accepting trips" });
    return;
  }

  const updated = await prisma.trip.update({
    where: { id: req.params.id },
    data: { driverId: req.user!.id, status: "DRIVER_ASSIGNED" },
    include: {
      driver: { select: { fullName: true, avatarUrl: true, rating: true, userId: true } },
      passenger: { select: { fullName: true, avatarUrl: true, rating: true, userId: true } },
    },
  });

  // Notify passenger
  getIO().to(`user:${trip.passengerId}`).emit("trip:updated", updated);

  res.json(updated);
});

// ── POST /trips/:id/arrived ───────────────────────────────────────────────────

router.post("/:id/arrived", authenticate, async (req: AuthRequest, res: Response) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip || trip.driverId !== req.user!.id || trip.status !== "DRIVER_ASSIGNED") {
    res.status(400).json({ error: "Invalid action" });
    return;
  }

  const updated = await prisma.trip.update({
    where: { id: req.params.id },
    data: { status: "DRIVER_ARRIVED" },
  });

  getIO().to(`user:${trip.passengerId}`).emit("trip:updated", updated);
  res.json(updated);
});

// ── POST /trips/:id/start ─────────────────────────────────────────────────────

router.post("/:id/start", authenticate, async (req: AuthRequest, res: Response) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip || trip.driverId !== req.user!.id || trip.status !== "DRIVER_ARRIVED") {
    res.status(400).json({ error: "Invalid action" });
    return;
  }

  const updated = await prisma.trip.update({
    where: { id: req.params.id },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });

  getIO().to(`user:${trip.passengerId}`).emit("trip:updated", updated);
  res.json(updated);
});

// ── POST /trips/:id/complete ──────────────────────────────────────────────────

router.post("/:id/complete", authenticate, async (req: AuthRequest, res: Response) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip || trip.driverId !== req.user!.id || trip.status !== "IN_PROGRESS") {
    res.status(400).json({ error: "Invalid action" });
    return;
  }

  const totalPrice = Number(trip.totalPrice);
  const driverEarning = Number(trip.driverEarning);

  // Deduct from passenger, pay driver — all in one transaction
  await prisma.$transaction([
    prisma.trip.update({
      where: { id: trip.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
    prisma.wallet.update({
      where: { userId: trip.passengerId },
      data: {
        balance: { decrement: totalPrice },
        transactions: {
          create: {
            type: "TRIP_PAYMENT",
            amount: totalPrice,
            description: `Trip payment - ${trip.dropoffAddress}`,
            tripId: trip.id,
          },
        },
      },
    }),
    prisma.wallet.update({
      where: { userId: trip.driverId! },
      data: {
        balance: { increment: driverEarning },
        transactions: {
          create: {
            type: "TRIP_EARNING",
            amount: driverEarning,
            description: `Trip earning - ${trip.dropoffAddress}`,
            tripId: trip.id,
          },
        },
      },
    }),
  ]);

  const updated = await prisma.trip.findUnique({
    where: { id: trip.id },
    include: {
      passenger: { select: { fullName: true } },
      driver: { select: { fullName: true } },
    },
  });

  getIO().to(`user:${trip.passengerId}`).emit("trip:updated", updated);
  res.json(updated);
});

// ── POST /trips/:id/cancel ────────────────────────────────────────────────────

router.post("/:id/cancel", authenticate, async (req: AuthRequest, res: Response) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  const isPassenger = trip.passengerId === req.user!.id;
  const isDriver = trip.driverId === req.user!.id;
  if (!isPassenger && !isDriver) {
    res.status(403).json({ error: "Not your trip" });
    return;
  }

  if (!["REQUESTED", "DRIVER_ASSIGNED", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(trip.status)) {
    res.status(400).json({ error: "Trip cannot be cancelled at this stage" });
    return;
  }

  const { reason } = req.body;
  let chargePassenger = false;

  // If trip IN_PROGRESS and driver cancels — charge for distance so far (partial)
  if (trip.status === "IN_PROGRESS" && isDriver) {
    chargePassenger = true;
  }

  const ops: Parameters<typeof prisma.$transaction>[0] = [
    prisma.trip.update({
      where: { id: trip.id },
      data: {
        status: "CANCELLED",
        cancelledBy: req.user!.id,
        cancelReason: reason ?? null,
        cancelledAt: new Date(),
      },
    }),
  ];

  // Partial charge if driver cancels mid-trip
  if (chargePassenger && trip.driverId) {
    const partial = Math.round(Number(trip.totalPrice) * 0.5 * 100) / 100;
    const driverPartial = Math.round(partial * 0.8 * 100) / 100;
    ops.push(
      prisma.wallet.update({
        where: { userId: trip.passengerId },
        data: {
          balance: { decrement: partial },
          transactions: { create: { type: "TRIP_PAYMENT", amount: partial, description: "Partial trip charge (driver cancel)", tripId: trip.id } },
        },
      }),
      prisma.wallet.update({
        where: { userId: trip.driverId },
        data: {
          balance: { increment: driverPartial },
          transactions: { create: { type: "TRIP_EARNING", amount: driverPartial, description: "Partial trip earning (cancelled mid-trip)", tripId: trip.id } },
        },
      })
    );
  }

  await prisma.$transaction(ops as Parameters<typeof prisma.$transaction>[0]);

  const notifyId = isPassenger ? trip.driverId : trip.passengerId;
  if (notifyId) {
    getIO().to(`user:${notifyId}`).emit("trip:cancelled", { tripId: trip.id, by: req.user!.role });
  }

  res.json({ message: "Trip cancelled" });
});

// ── POST /trips/:id/rate ──────────────────────────────────────────────────────

router.post("/:id/rate", authenticate, async (req: AuthRequest, res: Response) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip || trip.status !== "COMPLETED") {
    res.status(400).json({ error: "Can only rate completed trips" });
    return;
  }

  const isPassenger = trip.passengerId === req.user!.id;
  const isDriver = trip.driverId === req.user!.id;
  if (!isPassenger && !isDriver) {
    res.status(403).json({ error: "Not your trip" });
    return;
  }

  const receiverId = isPassenger ? trip.driverId! : trip.passengerId;
  const { score, review } = req.body;
  if (!score || score < 1 || score > 5) {
    res.status(400).json({ error: "Score must be between 1 and 5" });
    return;
  }

  await prisma.rating.create({
    data: { tripId: trip.id, giverId: req.user!.id, receiverId, score, review },
  });

  // Recalculate receiver average rating
  const agg = await prisma.rating.aggregate({
    where: { receiverId },
    _avg: { score: true },
    _count: true,
  });

  await prisma.user.update({
    where: { id: receiverId },
    data: {
      rating: agg._avg.score ?? 5.0,
      reviewCount: agg._count,
    },
  });

  res.json({ message: "Rating submitted" });
});

// ── GET /trips (trip history) ─────────────────────────────────────────────────

router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const uid = req.user!.id;
  const role = req.user!.role;

  const trips = await prisma.trip.findMany({
    where: role === "PASSENGER" ? { passengerId: uid } : { driverId: uid },
    include: {
      passenger: { select: { fullName: true, avatarUrl: true } },
      driver: { select: { fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  res.json(trips);
});

// ── GET /trips/:id ────────────────────────────────────────────────────────────

router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: {
      passenger: { select: { fullName: true, avatarUrl: true, rating: true, phone: true } },
      driver: { select: { fullName: true, avatarUrl: true, rating: true, phone: true, driverProfile: true } },
      ratings: true,
    },
  });

  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  const uid = req.user!.id;
  if (trip.passengerId !== uid && trip.driverId !== uid && req.user!.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(trip);
});

export default router;
