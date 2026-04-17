"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requireVerifiedDriver = requireVerifiedDriver;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../lib/prisma.js");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "No token provided" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        next();
    };
}
async function requireVerifiedDriver(req, res, next) {
    if (!req.user || req.user.role !== "DRIVER") {
        res.status(403).json({ error: "Driver account required" });
        return;
    }
    const profile = await prisma_js_1.prisma.driverProfile.findUnique({
        where: { userId: req.user.id },
    });
    if (!profile?.isVerified) {
        res.status(403).json({ error: "Driver not verified by admin yet" });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map