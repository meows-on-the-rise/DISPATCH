import { create } from "zustand";

export interface Trip {
  id: string;
  passengerId: string;
  driverId?: string;
  status: TripStatus;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  seats: number;
  distanceKm?: number;
  durationMin?: number;
  totalPrice?: number;
  driverEarning?: number;
  systemCommission?: number;
  createdAt: string;
  passenger?: { fullName: string; avatarUrl?: string; rating: number; userId: string };
  driver?: {
    fullName: string; avatarUrl?: string; rating: number; userId: string;
    driverProfile?: { vehicleMake?: string; vehicleModel?: string; vehiclePlate?: string; vehicleColor?: string };
  };
}

export type TripStatus =
  | "REQUESTED" | "DRIVER_ASSIGNED" | "DRIVER_ARRIVED"
  | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface TripState {
  activeTrip: Trip | null;
  driverLocation: { lat: number; lng: number } | null;
  availableTrips: Trip[];
  estimate: PriceEstimate | null;

  setActiveTrip: (trip: Trip | null) => void;
  setDriverLocation: (loc: { lat: number; lng: number } | null) => void;
  setAvailableTrips: (trips: Trip[]) => void;
  addAvailableTrip: (trip: Trip) => void;
  removeAvailableTrip: (id: string) => void;
  setEstimate: (e: PriceEstimate | null) => void;
}

export interface PriceEstimate {
  distanceKm: number;
  durationMin: number;
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  totalPrice: number;
  driverEarning: number;
  systemCommission: number;
}

export const useTripStore = create<TripState>((set) => ({
  activeTrip: null,
  driverLocation: null,
  availableTrips: [],
  estimate: null,

  setActiveTrip: (trip) => set({ activeTrip: trip }),
  setDriverLocation: (loc) => set({ driverLocation: loc }),
  setAvailableTrips: (trips) => set({ availableTrips: trips }),
  addAvailableTrip: (trip) =>
    set((s) => ({
      availableTrips: s.availableTrips.some((t) => t.id === trip.id)
        ? s.availableTrips
        : [trip, ...s.availableTrips],
    })),
  removeAvailableTrip: (id) =>
    set((s) => ({ availableTrips: s.availableTrips.filter((t) => t.id !== id) })),
  setEstimate: (e) => set({ estimate: e }),
}));
