"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const io_js_1 = require("./socket/io.js");
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const users_js_1 = __importDefault(require("./routes/users.js"));
const wallet_js_1 = __importDefault(require("./routes/wallet.js"));
const trips_js_1 = __importDefault(require("./routes/trips.js"));
const drivers_js_1 = __importDefault(require("./routes/drivers.js"));
const admin_js_1 = __importDefault(require("./routes/admin.js"));
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const httpServer = http_1.default.createServer(app);
// ── Global middleware ─────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL ?? "*",
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// General rate limiter
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
}));
// Stricter limiter on auth routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Too many requests, please try again later" },
});
// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/auth", authLimiter, auth_js_1.default);
app.use("/users", users_js_1.default);
app.use("/wallet", wallet_js_1.default);
app.use("/trips", trips_js_1.default);
app.use("/drivers", drivers_js_1.default);
app.use("/admin", admin_js_1.default);
// ── 404 & Error handlers ──────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});
// ── Socket.IO ─────────────────────────────────────────────────────────────────
(0, io_js_1.initSocket)(httpServer);
// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3000);
httpServer.listen(PORT, () => {
    console.log(`🚀 Dispatch server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map