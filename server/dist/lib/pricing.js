"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTripPrice = calculateTripPrice;
exports.haversineKm = haversineKm;
exports.generateUserId = generateUserId;
function calculateTripPrice(distanceKm, durationMin) {
    const BASE_FARE = Number(process.env.BASE_FARE ?? 15);
    const RATE_PER_KM = Number(process.env.RATE_PER_KM ?? 8);
    const RATE_PER_MIN = Number(process.env.RATE_PER_MIN ?? 1.5);
    const DRIVER_CUT = Number(process.env.DRIVER_CUT_PERCENT ?? 80) / 100;
    const baseFare = BASE_FARE;
    const distanceCharge = distanceKm * RATE_PER_KM;
    const timeCharge = durationMin * RATE_PER_MIN;
    const totalPrice = Math.round((baseFare + distanceCharge + timeCharge) * 100) / 100;
    const driverEarning = Math.round(totalPrice * DRIVER_CUT * 100) / 100;
    const systemCommission = Math.round((totalPrice - driverEarning) * 100) / 100;
    return { baseFare, distanceCharge, timeCharge, totalPrice, driverEarning, systemCommission };
}
// Haversine formula — straight-line distance between two GPS coords in km
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// Generate human-readable user ID
function generateUserId(role) {
    const prefix = role === "DRIVER" ? "d" : "p";
    const year = new Date().getFullYear();
    const digits = Math.floor(10000 + Math.random() * 90000); // 5 digits
    return `${prefix}${year}${digits}`;
}
//# sourceMappingURL=pricing.js.map