export interface PriceBreakdown {
    baseFare: number;
    distanceCharge: number;
    timeCharge: number;
    totalPrice: number;
    driverEarning: number;
    systemCommission: number;
}
export declare function calculateTripPrice(distanceKm: number, durationMin: number): PriceBreakdown;
export declare function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number;
export declare function generateUserId(role: "DRIVER" | "PASSENGER"): string;
//# sourceMappingURL=pricing.d.ts.map