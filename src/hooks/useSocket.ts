import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { BASE_URL } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useTripStore, Trip } from "../store/tripStore";

let socket: Socket | null = null;

export function useSocket() {
  const { accessToken, user } = useAuthStore();
  const {
    setActiveTrip, setDriverLocation,
    addAvailableTrip, removeAvailableTrip,
  } = useTripStore();
  const joined = useRef<string | null>(null);

  useEffect(() => {
    if (!accessToken || !user) return;

    // Create singleton socket
    if (!socket || !socket.connected) {
      socket = io(BASE_URL, {
        auth: { token: accessToken },
        reconnection: true,
        reconnectionDelay: 1000,
      });
    }

    socket.on("connect", () => console.log("[socket] connected"));
    socket.on("disconnect", () => console.log("[socket] disconnected"));

    // ── Passenger events ──────────────────────────────────────────────────
    socket.on("trip:updated", (trip: Trip) => {
  const prev = useTripStore.getState().activeTrip;
  setActiveTrip(trip);
  // Notify passenger when driver arrives
  if (
    trip.status === "DRIVER_ARRIVED" &&
    prev?.status === "DRIVER_ASSIGNED"
  ) {
    // Import and use toast
    const event = new CustomEvent("dispatch:toast", {
      detail: { message: "Your driver has arrived!", type: "success" }
    });
    window.dispatchEvent(event);
  }
});
    });

    socket.on("trip:cancelled", ({ tripId }: { tripId: string; by: string }) => {
      const active = useTripStore.getState().activeTrip;
      if (active?.id === tripId) setActiveTrip(null);
    });

    socket.on("driver:location", (loc: { lat: number; lng: number }) => {
      setDriverLocation(loc);
    });

    // ── Driver events ─────────────────────────────────────────────────────
    socket.on("new:trip", (trip: Trip) => {
      if (user.role === "DRIVER") addAvailableTrip(trip);
    });

    return () => {
      socket?.off("trip:updated");
      socket?.off("trip:cancelled");
      socket?.off("driver:location");
      socket?.off("new:trip");
    };
  }, [accessToken, user]);

  const joinTrip = (tripId: string) => {
    if (joined.current === tripId) return;
    socket?.emit("join:trip", tripId);
    joined.current = tripId;
  };

  const leaveTrip = (tripId: string) => {
    socket?.emit("leave:trip", tripId);
    if (joined.current === tripId) joined.current = null;
    removeAvailableTrip(tripId);
  };

  const emitLocation = (lat: number, lng: number, tripId?: string) => {
    socket?.emit("driver:location", { lat, lng, tripId });
  };

  return { joinTrip, leaveTrip, emitLocation, socket };
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
