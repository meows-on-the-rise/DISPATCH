import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

let io: SocketServer;

export function initSocket(httpServer: HttpServer) {
  const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());

  io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.some((o) => origin.startsWith(o))) {
          return callback(null, true);
        }
        callback(new Error(`CORS blocked: ${origin}`));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Auth middleware for socket connections
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        role: string;
        userId: string;
      };
      (socket as Socket & { user: typeof payload }).user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const user = (socket as Socket & { user: { id: string; role: string } }).user;
    const userId = user.id;

    // Each user joins their personal room for targeted events
    socket.join(`user:${userId}`);
    console.log(`[socket] ${user.role} connected: ${userId}`);

    // ── Driver joins an active trip room ──────────────────────────────────
    socket.on("join:trip", (tripId: string) => {
      socket.join(`trip:${tripId}`);
    });

    socket.on("leave:trip", (tripId: string) => {
      socket.leave(`trip:${tripId}`);
    });

    // ── Driver emits GPS location update ─────────────────────────────────
    socket.on(
      "driver:location",
      async (data: { lat: number; lng: number; tripId?: string }) => {
        if (user.role !== "DRIVER") return;

        await prisma.driverProfile
          .update({
            where: { userId },
            data: { currentLat: data.lat, currentLng: data.lng },
          })
          .catch(() => {});

        if (data.tripId) {
          socket.to(`trip:${data.tripId}`).emit("driver:location", {
            lat: data.lat,
            lng: data.lng,
          });

          const trip = await prisma.trip.findUnique({
            where: { id: data.tripId },
            select: { status: true, driverId: true },
          });

          if (
            trip &&
            trip.driverId === userId &&
            trip.status === "IN_PROGRESS"
          ) {
            await prisma.tripLocation
              .create({
                data: { tripId: data.tripId, lat: data.lat, lng: data.lng },
              })
              .catch(() => {});
          }
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${userId}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.IO not initialised");
  return io;
}
