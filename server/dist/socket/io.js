"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../lib/prisma.js");
let io;
function initSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL ?? "*",
            methods: ["GET", "POST"],
        },
    });
    // Auth middleware for socket connections
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            next(new Error("Authentication required"));
            return;
        }
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.user = payload;
            next();
        }
        catch {
            next(new Error("Invalid token"));
        }
    });
    io.on("connection", async (socket) => {
        const user = socket.user;
        const userId = user.id;
        // Each user joins their personal room for targeted events
        socket.join(`user:${userId}`);
        console.log(`[socket] ${user.role} connected: ${userId}`);
        // ── Driver joins an active trip room ──────────────────────────────────
        socket.on("join:trip", (tripId) => {
            socket.join(`trip:${tripId}`);
        });
        socket.on("leave:trip", (tripId) => {
            socket.leave(`trip:${tripId}`);
        });
        // ── Driver emits GPS location update ─────────────────────────────────
        // (This is the Socket path — REST /drivers/location path also exists)
        socket.on("driver:location", async (data) => {
            if (user.role !== "DRIVER")
                return;
            await prisma_js_1.prisma.driverProfile
                .update({
                where: { userId },
                data: { currentLat: data.lat, currentLng: data.lng },
            })
                .catch(() => { });
            if (data.tripId) {
                // Forward to all clients watching this trip
                socket.to(`trip:${data.tripId}`).emit("driver:location", {
                    lat: data.lat,
                    lng: data.lng,
                });
                // Record snapshot if trip is in progress
                const trip = await prisma_js_1.prisma.trip.findUnique({
                    where: { id: data.tripId },
                    select: { status: true, driverId: true },
                });
                if (trip &&
                    trip.driverId === userId &&
                    trip.status === "IN_PROGRESS") {
                    await prisma_js_1.prisma.tripLocation
                        .create({
                        data: { tripId: data.tripId, lat: data.lat, lng: data.lng },
                    })
                        .catch(() => { });
                }
            }
        });
        socket.on("disconnect", () => {
            console.log(`[socket] disconnected: ${userId}`);
        });
    });
    return io;
}
function getIO() {
    if (!io)
        throw new Error("Socket.IO not initialised");
    return io;
}
//# sourceMappingURL=io.js.map