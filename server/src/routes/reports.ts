import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// ── REPORT 1: Trip Summary Report ─────────────────────────────────────────────
// Joins: Trip + User (passenger) + User (driver)
// Shows every trip with both parties, fare breakdown, and status

router.get("/trip-summary", async (req, res: Response) => {
  const { from, to, status } = req.query as { from?: string; to?: string; status?: string };

  const trips = await prisma.trip.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to   ? { lte: new Date(to)   } : {}),
            },
          }
        : {}),
    },
    include: {
      passenger: { select: { fullName: true, userId: true, phone: true } },
      driver:    { select: { fullName: true, userId: true } },
      ratings:   { select: { score: true, giverId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = trips.map(t => ({
    tripId:          t.id.slice(0, 8).toUpperCase(),
    passengerName:   t.passenger.fullName,
    passengerId:     t.passenger.userId,
    driverName:      t.driver?.fullName ?? "Unassigned",
    driverId:        t.driver?.userId   ?? "—",
    pickupAddress:   t.pickupAddress,
    dropoffAddress:  t.dropoffAddress,
    distanceKm:      t.distanceKm ?? 0,
    durationMin:     t.durationMin ?? 0,
    totalPrice:      Number(t.totalPrice ?? 0),
    driverEarning:   Number(t.driverEarning ?? 0),
    systemCommission:Number(t.systemCommission ?? 0),
    status:          t.status,
    seats:           t.seats,
    createdAt:       t.createdAt,
    completedAt:     t.completedAt,
    cancelReason:    t.cancelReason,
  }));

  res.json({ report: "Trip Summary", generatedAt: new Date(), count: rows.length, rows });
});

// ── REPORT 2: Driver Earnings Report ─────────────────────────────────────────
// Joins: Trip + User (driver) + DriverProfile + Wallet

router.get("/driver-earnings", async (_req, res: Response) => {
  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    select: {
      id: true,
      userId: true,
      fullName: true,
      phone: true,
      rating: true,
      reviewCount: true,
      wallet: { select: { balance: true } },
      driverProfile: {
        select: {
          isVerified: true,
          isClockedIn: true,
          vehicleMake: true,
          vehicleModel: true,
          vehiclePlate: true,
        },
      },
      driverTrips: {
        where: { status: "COMPLETED" },
        select: {
          id: true,
          totalPrice: true,
          driverEarning: true,
          systemCommission: true,
          distanceKm: true,
          completedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = drivers.map(d => {
    const completed   = d.driverTrips.length;
    const totalEarned = d.driverTrips.reduce((s, t) => s + Number(t.driverEarning ?? 0), 0);
    const totalFares  = d.driverTrips.reduce((s, t) => s + Number(t.totalPrice ?? 0), 0);
    const totalKm     = d.driverTrips.reduce((s, t) => s + (t.distanceKm ?? 0), 0);
    return {
      driverId:     d.userId,
      fullName:     d.fullName,
      phone:        d.phone,
      vehicle:      d.driverProfile
        ? `${d.driverProfile.vehicleMake ?? ""} ${d.driverProfile.vehicleModel ?? ""}`.trim() || "—"
        : "—",
      plate:        d.driverProfile?.vehiclePlate ?? "—",
      isVerified:   d.driverProfile?.isVerified ?? false,
      tripsCompleted: completed,
      totalFaresGenerated: totalFares,
      totalEarned,
      walletBalance: Number(d.wallet?.balance ?? 0),
      totalKm:      Math.round(totalKm * 10) / 10,
      avgRating:    d.rating,
      reviews:      d.reviewCount,
    };
  });

  rows.sort((a, b) => b.totalEarned - a.totalEarned);

  const totals = {
    tripsCompleted:       rows.reduce((s, r) => s + r.tripsCompleted, 0),
    totalFaresGenerated:  rows.reduce((s, r) => s + r.totalFaresGenerated, 0),
    totalPaidToDrivers:   rows.reduce((s, r) => s + r.totalEarned, 0),
  };

  res.json({ report: "Driver Earnings", generatedAt: new Date(), count: rows.length, totals, rows });
});

// ── REPORT 3: Passenger Activity Report ──────────────────────────────────────
// Joins: Trip + User (passenger) + Rating + Wallet

router.get("/passenger-activity", async (_req, res: Response) => {
  const passengers = await prisma.user.findMany({
    where: { role: "PASSENGER" },
    select: {
      id: true,
      userId: true,
      fullName: true,
      phone: true,
      rating: true,
      reviewCount: true,
      createdAt: true,
      wallet: { select: { balance: true } },
      passengerTrips: {
        select: {
          id: true,
          status: true,
          totalPrice: true,
          distanceKm: true,
          createdAt: true,
          completedAt: true,
          driver: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      ratingsGiven: { select: { score: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = passengers.map(p => {
    const completed  = p.passengerTrips.filter(t => t.status === "COMPLETED").length;
    const cancelled  = p.passengerTrips.filter(t => t.status === "CANCELLED").length;
    const totalSpent = p.passengerTrips
      .filter(t => t.status === "COMPLETED")
      .reduce((s, t) => s + Number(t.totalPrice ?? 0), 0);
    const avgGiven   = p.ratingsGiven.length
      ? p.ratingsGiven.reduce((s, r) => s + r.score, 0) / p.ratingsGiven.length
      : null;
    const lastTrip   = p.passengerTrips[0];
    return {
      passengerId:    p.userId,
      fullName:       p.fullName,
      phone:          p.phone,
      memberSince:    p.createdAt,
      totalTrips:     p.passengerTrips.length,
      completedTrips: completed,
      cancelledTrips: cancelled,
      totalSpent,
      walletBalance:  Number(p.wallet?.balance ?? 0),
      avgRatingGiven: avgGiven ? Math.round(avgGiven * 10) / 10 : null,
      ownRating:      p.rating,
      lastTripDate:   lastTrip?.createdAt ?? null,
      lastTripDriver: lastTrip?.driver?.fullName ?? null,
    };
  });

  rows.sort((a, b) => b.totalSpent - a.totalSpent);

  const totals = {
    totalPassengers: rows.length,
    totalRevenue:    rows.reduce((s, r) => s + r.totalSpent, 0),
    totalTrips:      rows.reduce((s, r) => s + r.totalTrips, 0),
  };

  res.json({ report: "Passenger Activity", generatedAt: new Date(), count: rows.length, totals, rows });
});

// ── REPORT 4: Platform Revenue Report ────────────────────────────────────────
// Joins: Trip + WalletTransaction + Wallet
// Daily breakdown of revenue, payouts, and commission

router.get("/platform-revenue", async (req, res: Response) => {
  const { days = "30" } = req.query as { days?: string };
  const since = new Date();
  since.setDate(since.getDate() - Number(days));

  const [trips, transactions, walletStats] = await Promise.all([
    prisma.trip.findMany({
      where: { createdAt: { gte: since } },
      select: {
        status: true,
        totalPrice: true,
        driverEarning: true,
        systemCommission: true,
        createdAt: true,
        completedAt: true,
        distanceKm: true,
        seats: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.walletTransaction.findMany({
      where: { createdAt: { gte: since }, type: { in: ["DEPOSIT", "WITHDRAWAL"] } },
      select: { type: true, amount: true, createdAt: true },
    }),
    prisma.wallet.aggregate({ _sum: { balance: true }, _count: { id: true } }),
  ]);

  // Group trips by day
  const byDay: Record<string, {
    date: string; trips: number; completed: number; cancelled: number;
    grossRevenue: number; driverPayouts: number; commission: number; kmCovered: number;
  }> = {};

  for (const t of trips) {
    const day = t.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { date: day, trips: 0, completed: 0, cancelled: 0, grossRevenue: 0, driverPayouts: 0, commission: 0, kmCovered: 0 };
    byDay[day].trips++;
    if (t.status === "COMPLETED") {
      byDay[day].completed++;
      byDay[day].grossRevenue   += Number(t.totalPrice ?? 0);
      byDay[day].driverPayouts  += Number(t.driverEarning ?? 0);
      byDay[day].commission     += Number(t.systemCommission ?? 0);
      byDay[day].kmCovered      += t.distanceKm ?? 0;
    }
    if (t.status === "CANCELLED") byDay[day].cancelled++;
  }

  const dailyRows = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

  const completedTrips = trips.filter(t => t.status === "COMPLETED");
  const summary = {
    periodDays:         Number(days),
    totalTrips:         trips.length,
    completedTrips:     completedTrips.length,
    cancelledTrips:     trips.filter(t => t.status === "CANCELLED").length,
    grossRevenue:       completedTrips.reduce((s, t) => s + Number(t.totalPrice ?? 0), 0),
    totalDriverPayouts: completedTrips.reduce((s, t) => s + Number(t.driverEarning ?? 0), 0),
    totalCommission:    completedTrips.reduce((s, t) => s + Number(t.systemCommission ?? 0), 0),
    totalDeposits:      transactions.filter(t => t.type === "DEPOSIT").reduce((s, t) => s + Number(t.amount), 0),
    totalWithdrawals:   transactions.filter(t => t.type === "WITHDRAWAL").reduce((s, t) => s + Number(t.amount), 0),
    totalWalletBalance: Number(walletStats._sum.balance ?? 0),
    totalWallets:       walletStats._count.id,
    avgTripValue:       completedTrips.length
      ? completedTrips.reduce((s, t) => s + Number(t.totalPrice ?? 0), 0) / completedTrips.length
      : 0,
    totalKmCovered:     Math.round(completedTrips.reduce((s, t) => s + (t.distanceKm ?? 0), 0) * 10) / 10,
  };

  res.json({ report: "Platform Revenue", generatedAt: new Date(), summary, dailyRows });
});

export default router;
