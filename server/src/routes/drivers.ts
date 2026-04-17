import { Router, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { uploadDocument, uploadBufferToCloudinary } from "../lib/cloudinary.js";
import { getIO } from "../socket/io.js";

const router = Router();

const DOC_TYPES = ["LICENSE", "PERMIT", "REGISTRATION"] as const;

// ── POST /drivers/clock ───────────────────────────────────────────────────────

router.post("/clock", authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== "DRIVER") {
    res.status(403).json({ error: "Drivers only" });
    return;
  }

  const profile = await prisma.driverProfile.findUnique({
    where: { userId: req.user!.id },
  });
  if (!profile) {
    res.status(404).json({ error: "Driver profile not found" });
    return;
  }

  // Cannot clock in unless all 3 documents are VERIFIED
  if (!profile.isClockedIn) {
    const verifiedDocs = await prisma.driverDocument.count({
      where: { driverProfileId: profile.id, status: "VERIFIED" },
    });
    if (verifiedDocs < 3) {
      res.status(403).json({
        error:
          "All 3 documents (license, permit, registration) must be verified before clocking in",
        verifiedCount: verifiedDocs,
      });
      return;
    }
  }

  const updated = await prisma.driverProfile.update({
    where: { id: profile.id },
    data: { isClockedIn: !profile.isClockedIn },
  });

  res.json({ isClockedIn: updated.isClockedIn });
});

// ── PUT /drivers/location ─────────────────────────────────────────────────────

router.put("/location", authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== "DRIVER") {
    res.status(403).json({ error: "Drivers only" });
    return;
  }

  const { lat, lng, tripId } = req.body;
  if (lat == null || lng == null) {
    res.status(400).json({ error: "lat and lng required" });
    return;
  }

  await prisma.driverProfile.update({
    where: { userId: req.user!.id },
    data: { currentLat: lat, currentLng: lng },
  });

  if (tripId) {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (
      trip &&
      trip.driverId === req.user!.id &&
      ["IN_PROGRESS", "DRIVER_ASSIGNED", "DRIVER_ARRIVED"].includes(trip.status)
    ) {
      if (trip.status === "IN_PROGRESS") {
        await prisma.tripLocation.create({ data: { tripId, lat, lng } });
      }
      getIO().to(`trip:${tripId}`).emit("driver:location", { lat, lng });
    }
  }

  res.json({ ok: true });
});

// ── POST /drivers/documents/:docType ─────────────────────────────────────────

router.post(
  "/documents/:docType",
  authenticate,
  uploadDocument.single("file"),
  async (req: AuthRequest, res: Response) => {
    if (req.user!.role !== "DRIVER") {
      res.status(403).json({ error: "Drivers only" });
      return;
    }

    const docType = req.params.docType.toUpperCase();
    if (!DOC_TYPES.includes(docType as (typeof DOC_TYPES)[number])) {
      res.status(400).json({
        error: `docType must be one of ${DOC_TYPES.join(", ")}`,
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const profile = await prisma.driverProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!profile) {
      res.status(404).json({ error: "Driver profile not found" });
      return;
    }

    // Upload buffer to Cloudinary
    const fileUrl = await uploadBufferToCloudinary(
      req.file.buffer,
      "dispatch/documents",
      "auto"
    );

    const doc = await prisma.driverDocument.upsert({
      where: {
        driverProfileId_docType: {
          driverProfileId: profile.id,
          docType,
        },
      },
      update: {
        fileUrl,
        status: "PENDING",
        reviewedAt: null,
        reviewNote: null,
      },
      create: {
        driverProfileId: profile.id,
        docType,
        fileUrl,
        status: "PENDING",
      },
    });

    res.json(doc);
  }
);

// ── GET /drivers/documents ────────────────────────────────────────────────────

router.get("/documents", authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== "DRIVER") {
    res.status(403).json({ error: "Drivers only" });
    return;
  }

  const profile = await prisma.driverProfile.findUnique({
    where: { userId: req.user!.id },
  });
  if (!profile) {
    res.json([]);
    return;
  }

  const docs = await prisma.driverDocument.findMany({
    where: { driverProfileId: profile.id },
  });
  res.json(docs);
});

export default router;
