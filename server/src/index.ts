import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { initSocket } from "./socket/io.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import walletRoutes from "./routes/wallet.js";
import tripRoutes from "./routes/trips.js";
import driverRoutes from "./routes/drivers.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const httpServer = http.createServer(app);

// ── Global middleware ─────────────────────────────────────────────────────────

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// General rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Stricter limiter on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many requests, please try again later" },
});

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/auth", authLimiter, authRoutes);
app.use("/users", userRoutes);
app.use("/wallet", walletRoutes);
app.use("/trips", tripRoutes);
app.use("/drivers", driverRoutes);
app.use("/admin", adminRoutes);

// ── 404 & Error handlers ──────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// ── Socket.IO ─────────────────────────────────────────────────────────────────

initSocket(httpServer);

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3000);
httpServer.listen(PORT, () => {
  console.log(`🚀 Dispatch server running on port ${PORT}`);
});
