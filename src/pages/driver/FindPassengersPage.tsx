import React, { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router";
import { tripApi, driverApi } from "../../api/client";
import { useTripStore, Trip } from "../../store/tripStore";
import { useAuthStore } from "../../store/authStore";
import { useSocket } from "../../hooks/useSocket";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useToast } from "../../lib/toast";
import { PageHeader, Avatar, StarRating, LocationCard, DriverCard, MapInfoCard } from "../../components/shared";

const DispatchMap = lazy(() => import("../../components/map/DispatchMap"));

type Phase = "list" | "tracking" | "rating";

export default function FindPassengersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuthStore();
  const { availableTrips, setAvailableTrips, activeTrip, setActiveTrip } = useTripStore();
  const { joinTrip } = useSocket();
  const { coords } = useGeolocation(true); // watch position
  const [phase, setPhase] = useState<Phase>("list");
  const [loading, setLoading] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState("");

  // Emit position to server every 4 seconds when in a trip
  useEffect(() => {
    if (!coords || !activeTrip) return;
    const interval = setInterval(() => {
      driverApi.updateLocation(coords.lat, coords.lng, activeTrip.id).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [coords, activeTrip?.id]);

  // Fetch available trips on mount
  useEffect(() => {
    tripApi.getAvailable().then(({ data }) => setAvailableTrips(data)).catch(() => {});
  }, []);

  // Sync phase with activeTrip
  useEffect(() => {
    if (!activeTrip) return;
    if (activeTrip.status === "COMPLETED") setPhase("rating");
    if (activeTrip.status === "CANCELLED") {
      toast("Passenger cancelled the trip", "error");
      setActiveTrip(null);
      setPhase("list");
    }
    if (["DRIVER_ASSIGNED", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(activeTrip.status)) {
      setPhase("tracking");
    }
  }, [activeTrip?.status]);

  async function accept(tripId: string) {
    setLoading(true);
    try {
      const { data } = await tripApi.accept(tripId);
      setActiveTrip(data);
      joinTrip(tripId);
      setPhase("tracking");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Could not accept trip";
      toast(msg, "error");
    } finally { setLoading(false); }
  }

  async function markArrived() {
    if (!activeTrip) return;
    await tripApi.arrived(activeTrip.id);
    const { data } = await tripApi.getOne(activeTrip.id);
    setActiveTrip(data);
    toast("Passenger notified of your arrival", "success");
  }

  async function startTrip() {
    if (!activeTrip) return;
    await tripApi.start(activeTrip.id);
    const { data } = await tripApi.getOne(activeTrip.id);
    setActiveTrip(data);
  }

  async function endTrip() {
    if (!activeTrip) return;
    setLoading(true);
    try {
      const { data } = await tripApi.complete(activeTrip.id);
      setActiveTrip(data);
      setPhase("rating");
      refreshUser();
      toast(`Trip complete! M ${Number(data.driverEarning).toFixed(2)} earned`, "success");
    } catch { toast("Could not complete trip", "error"); }
    finally { setLoading(false); }
  }

  async function cancelTrip() {
    if (!activeTrip) return;
    try {
      await tripApi.cancel(activeTrip.id);
      toast("Trip cancelled", "info");
      setActiveTrip(null);
      setPhase("list");
    } catch { toast("Cancel failed", "error"); }
  }

  async function submitRating() {
    if (!activeTrip) return;
    try { await tripApi.rate(activeTrip.id, ratingScore, ratingReview); } catch {}
    setActiveTrip(null);
    navigate("/driver");
  }

  const mapCenter = coords ?? (activeTrip ? { lat: activeTrip.pickupLat, lng: activeTrip.pickupLng } : undefined);

  return (
    <div className="app-shell">
      {phase === "list" && (
        <>
          <PageHeader title="Find Passengers" onBack={() => navigate("/driver")} />
          <div className="scroll-area flex-1 px-4">
            {availableTrips.length === 0 && (
              <div className="text-center flex-col items-center gap-3" style={{ paddingTop: 48 }}>
                <div style={{ fontSize: 48 }}>🔍</div>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                  No ride requests right now. Stay online — new requests appear instantly.
                </p>
                <button className="btn btn-ghost" style={{ width: "auto", padding: "10px 24px" }}
                  onClick={() => tripApi.getAvailable().then(({ data }) => setAvailableTrips(data))}>
                  Refresh
                </button>
              </div>
            )}
            <div className="flex-col gap-3" style={{ paddingBottom: 24 }}>
              {availableTrips.map((trip) => (
                <div key={trip.id} className="card-elevated" style={{ padding: 16 }}>
                  {/* Passenger info */}
                  <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                    <Avatar src={trip.passenger?.avatarUrl} name={trip.passenger?.fullName ?? "P"} size={44} />
                    <div className="flex-1">
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
                        {trip.passenger?.fullName}
                      </div>
                      {trip.passenger && <StarRating value={trip.passenger.rating} />}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--teal)" }}>
                        M {Number(trip.totalPrice).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {trip.distanceKm?.toFixed(1)} km
                      </div>
                    </div>
                  </div>
                  <LocationCard pickup={trip.pickupAddress} dropoff={trip.dropoffAddress}
                    distanceKm={trip.distanceKm} durationMin={trip.durationMin} />
                  <div className="flex gap-2" style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }}
                      onClick={() => accept(trip.id)} disabled={loading}>
                      {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : "Accept"}
                    </button>
                    <button className="btn btn-ghost" style={{ flex: 1, color: "var(--danger)", borderColor: "var(--danger)" }}
                      onClick={() => tripApi.cancel(trip.id).catch(() => {})}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {phase === "tracking" && activeTrip && (
        <>
          {/* Map */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <Suspense fallback={<div style={{ flex: 1, background: "var(--bg-base)" }} />}>
              <DispatchMap
                center={mapCenter}
                pickup={{ lat: activeTrip.pickupLat, lng: activeTrip.pickupLng }}
                dropoff={{ lat: activeTrip.dropoffLat, lng: activeTrip.dropoffLng }}
                driverLocation={coords ?? undefined}
                height="100%"
              />
            </Suspense>
            <div style={{ position: "absolute", top: 16, left: 16, right: 16, zIndex: 999, display: "flex", justifyContent: "space-between" }}>
              <button className="map-btn" onClick={() => navigate("/driver")}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </button>
              {activeTrip.distanceKm && (
                <MapInfoCard distanceM={Math.round(activeTrip.distanceKm * 1000)} timeMin={activeTrip.durationMin} />
              )}
            </div>
          </div>

          {/* Bottom sheet */}
          <div style={{ flexShrink: 0, padding: "16px 16px 24px", background: "var(--bg-base)" }}>
            {activeTrip.passenger && (
              <DriverCard
                fullName={activeTrip.passenger.fullName}
                rating={activeTrip.passenger.rating}
                avatarUrl={activeTrip.passenger.avatarUrl}
                status={
                  activeTrip.status === "DRIVER_ASSIGNED" ? "Heading to pickup" :
                  activeTrip.status === "DRIVER_ARRIVED" ? "Waiting for passenger" :
                  activeTrip.status === "IN_PROGRESS" ? "Trip in progress 🚕" : ""
                }
              />
            )}
            <LocationCard pickup={activeTrip.pickupAddress} dropoff={activeTrip.dropoffAddress}
              distanceKm={activeTrip.distanceKm} durationMin={activeTrip.durationMin} />

            <div className="flex-col gap-2" style={{ marginTop: 12 }}>
              {activeTrip.status === "DRIVER_ASSIGNED" && (
                <button className="btn btn-teal" onClick={markArrived}>I've Arrived at Pickup</button>
              )}
              {activeTrip.status === "DRIVER_ARRIVED" && (
                <button className="btn btn-primary" onClick={startTrip}>Start Trip</button>
              )}
              {activeTrip.status === "IN_PROGRESS" && (
                <button className="btn btn-teal" onClick={endTrip} disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : "End Trip & Collect Payment"}
                </button>
              )}
              {activeTrip.status !== "IN_PROGRESS" && (
                <button className="btn btn-ghost" onClick={cancelTrip}
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
                  Cancel Trip
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {phase === "rating" && activeTrip && (
        <div className="app-shell" style={{ justifyContent: "center", padding: "40px 24px" }}>
          <div className="page-enter flex-col gap-4 text-center items-center">
            <div style={{ fontSize: 56 }}>💰</div>
            <h2 style={{ fontFamily: "var(--font-display)" }}>Trip Complete!</h2>
            <p style={{ color: "var(--text-secondary)" }}>
              You earned <strong style={{ color: "var(--teal)" }}>M {Number(activeTrip.driverEarning).toFixed(2)}</strong>
            </p>
            <div className="divider w-full" />
            <p className="text-sm text-muted">Rate your passenger (optional)</p>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setRatingScore(s)} style={{
                  fontSize: 32, background: "none", border: "none", cursor: "pointer",
                  filter: s <= ratingScore ? "none" : "grayscale(1) opacity(0.4)",
                }}>⭐</button>
              ))}
            </div>
            <div className="input-wrap w-full">
              <input className="input" value={ratingReview}
                onChange={(e) => setRatingReview(e.target.value)} placeholder="Great passenger! (optional)" />
            </div>
            <button className="btn btn-primary w-full" onClick={submitRating}>Done</button>
            <button className="btn btn-ghost w-full" onClick={() => { setActiveTrip(null); navigate("/driver"); }}>Skip</button>
          </div>
        </div>
      )}
    </div>
  );
}
