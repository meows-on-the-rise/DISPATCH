"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const cloudinary_js_1 = require("../lib/cloudinary.js");
const io_js_1 = require("../socket/io.js");
const router = (0, express_1.Router)();
const DOC_TYPES = ["LICENSE", "PERMIT", "REGISTRATION"];
// ── POST /drivers/clock ───────────────────────────────────────────────────────
router.post("/clock", auth_js_1.authenticate, async (req, res) => {
    if (req.user.role !== "DRIVER") {
        res.status(403).json({ error: "Drivers only" });
        return;
    }
    const profile = await prisma_js_1.prisma.driverProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) {
        res.status(404).json({ error: "Driver profile not found" });
        return;
    }
    // Cannot clock in unless all 3 documents are VERIFIED
    if (!profile.isClockedIn) {
        const verifiedDocs = await prisma_js_1.prisma.driverDocument.count({
            where: { driverProfileId: profile.id, status: "VERIFIED" },
        });
        if (verifiedDocs < 3) {
            res.status(403).json({
                error: "All 3 documents (license, permit, registration) must be verified before clocking in",
                verifiedCount: verifiedDocs,
            });
            return;
        }
    }
    const updated = await prisma_js_1.prisma.driverProfile.update({
        where: { id: profile.id },
        data: { isClockedIn: !profile.isClockedIn },
    });
    res.json({ isClockedIn: updated.isClockedIn });
});
// ── PUT /drivers/location ─────────────────────────────────────────────────────
// Driver pushes their GPS position (called every few seconds from the app)
router.put("/location", auth_js_1.authenticate, async (req, res) => {
    if (req.user.role !== "DRIVER") {
        res.status(403).json({ error: "Drivers only" });
        return;
    }
    const { lat, lng, tripId } = req.body;
    if (lat == null || lng == null) {
        res.status(400).json({ error: "lat and lng required" });
        return;
    }
    await prisma_js_1.prisma.driverProfile.update({
        where: { userId: req.user.id },
        data: { currentLat: lat, currentLng: lng },
    });
    // If in an active trip, record location snapshot and broadcast to passenger
    if (tripId) {
        const trip = await prisma_js_1.prisma.trip.findUnique({ where: { id: tripId } });
        if (trip && trip.driverId === req.user.id && trip.status === "IN_PROGRESS") {
            await prisma_js_1.prisma.tripLocation.create({ data: { tripId, lat, lng } });
            (0, io_js_1.getIO)().to(`trip:${tripId}`).emit("driver:location", { lat, lng });
        }
        else if (trip && trip.driverId === req.user.id && trip.status === "DRIVER_ASSIGNED") {
            // Driver en route to pickup — push to passenger too
            (0, io_js_1.getIO)().to(`trip:${tripId}`).emit("driver:location", { lat, lng });
        }
    }
    res.json({ ok: true });
});
// ── POST /drivers/documents/:docType ─────────────────────────────────────────
router.post("/documents/:docType", auth_js_1.authenticate, cloudinary_js_1.uploadDocument.single("file"), async (req, res) => {
    if (req.user.role !== "DRIVER") {
        res.status(403).json({ error: "Drivers only" });
        return;
    }
    const docType = req.params.docType.toUpperCase();
    if (!DOC_TYPES.includes(docType)) {
        res.status(400).json({ error: `docType must be one of ${DOC_TYPES.join(", ")}` });
        return;
    }
    if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }
    const { secure_url: fileUrl } = await (0, cloudinary_js_1.handleDocumentUpload)(req.file.buffer);
    const profile = await prisma_js_1.prisma.driverProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) {
        res.status(404).json({ error: "Driver profile not found" });
        return;
    }
    const doc = await prisma_js_1.prisma.driverDocument.upsert({
        where: { driverProfileId_docType: { driverProfileId: profile.id, docType } },
        update: { fileUrl, status: "PENDING", reviewedAt: null, reviewNote: null },
        create: { driverProfileId: profile.id, docType, fileUrl, status: "PENDING" },
    });
    res.json(doc);
});
// ── GET /drivers/documents ────────────────────────────────────────────────────
router.get("/documents", auth_js_1.authenticate, async (req, res) => {
    if (req.user.role !== "DRIVER") {
        res.status(403).json({ error: "Drivers only" });
        return;
    }
    const profile = await prisma_js_1.prisma.driverProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) {
        res.json([]);
        return;
    }
    const docs = await prisma_js_1.prisma.driverDocument.findMany({ where: { driverProfileId: profile.id } });
    res.json(docs);
});
exports.default = router;
//# sourceMappingURL=drivers.js.map