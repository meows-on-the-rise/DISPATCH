import React, { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router";
import { tripApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useTripStore, Trip } from "../../store/tripStore";
import { useSocket } from "../../hooks/useSocket";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useToast } from "../../lib/toast";
import { LocationCard, DriverCard, MapInfoCard, PageHeader } from "../../components/shared";

const DispatchMap = lazy(() => import("../../components/map/DispatchMap"));

type Phase = "input" | "estimate" | "selecting" | "tracking" | "rating";

export default function RequestRidePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuthStore();
  const { activeTrip, setActiveTrip, driverLocation, estimate, setEstimate } = useTripStore();
  const { joinTrip } = useSocket();
  const { coords } = useGeolocation();

  const [phase, setPhase] = useState<Phase>("input");
  const [pickupAddr, setPickupAddr] = useState("");
  const [dropoffAddr, setDropoffAddr] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Trip[]>([]);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState("");

  // Restore active trip on mount
  useEffect(() => {
    if (activeTrip && activeTrip.status !== "COMPLETED" && activeTrip.status !== "CANCELLED") {
      setPhase("tracking");
      joinTrip(activeTrip.id);
    }
  }, []);

  // React to trip status changes
  useEffect(() => {
    if (!activeTrip) return;
    if (activeTrip.status === "COMPLETED") setPhase("rating");
    if (activeTrip.status === "CANCELLED") {
      toast("Trip was cancelled", "error");
      setActiveTrip(null);
      setPhase("input");
    }
  }, [activeTrip?.status]);

  // Use device coords as default pickup
  useEffect(() => {
    if (coords && !pickupCoords) {
      setPickupCoords(coords);
      setPickupAddr("My Location");
    }
  }, [coords]);

  async function getEstimate() {
    if (!pickupCoords || !dropoffCoords) {
      toast("Set pickup and drop-off points on the map", "error");
      return;
    }
    setLoading(true);
    try {
      const { data } = await tripApi.estimate({
        pickupLat: pickupCoords.lat, pickupLng: pickupCoords.lng,
        dropoffLat: dropoffCoords.lat, dropoffLng: dropoffCoords.lng,
      });
      setEstimate(data);
      setPhase("estimate");
    } catch { toast("Could not calculate price", "error"); }
    finally { setLoading(false); }
  }

  async function bookRide() {
    if (!pickupCoords || !dropoffCoords || !estimate) return;
    const balance = Number(user?.wallet?.balance ?? 0);
    if (balance < estimate.totalPrice) {
      toast(`Insufficient balance. Need M ${estimate.totalPrice.toFixed(2)}`, "error");
      return;
    }
    setLoading(true);
    try {
      const { data: trip } = await tripApi.create({
        pickupAddress: pickupAddr || "Pickup",
        pickupLat: pickupCoords.lat, pickupLng: pickupCoords.lng,
        dropoffAddress: dropoffAddr || "Drop-off",
        dropoffLat: dropoffCoords.lat, dropoffLng: dropoffCoords.lng,
        seats,
      });
      setActiveTrip(trip);
      joinTrip(trip.id);
      setPhase("selecting");
      // Poll for driver acceptance
      const interval = setInterval(async () => {
        const { data } = await tripApi.getOne(trip.id);
        setActiveTrip(data);
        if (data.status !== "REQUESTED") {
          clearInterval(interval);
          setPhase("tracking");
          // Load nearby drivers list
          const { data: avail } = await tripApi.getAvailable();
          setDrivers(avail);
        }
      }, 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Booking failed";
      toast(msg, "error");
    } finally { setLoading(false); }
  }

  async function cancelTrip() {
    if (!activeTrip) return;
    try {
      await tripApi.cancel(activeTrip.id);
      setActiveTrip(null);
      setPhase("input");
      toast("Trip cancelled", "info");
    } catch { toast("Could not cancel trip", "error"); }
  }

  async function submitRating() {
    if (!activeTrip) return;
    try {
      await tripApi.rate(activeTrip.id, ratingScore, ratingReview);
      toast("Thanks for your feedback!", "success");
    } catch { /* optional */ }
    setActiveTrip(null);
    refreshUser();
    navigate("/passenger");
  }

  const mapCenter = pickupCoords ?? (coords ? { lat: coords.lat, lng: coords.lng } : { lat: -29.3167, lng: 27.4833 });

  return (
    <div className="app-shell">
      {/* Map fills most of the screen */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Suspense fallback={<div style={{ flex: 1, background: "var(--bg-base)" }} />}>
          <DispatchMap
            center={mapCenter}
            pickup={pickupCoords ?? undefined}
            dropoff={dropoffCoords ?? undefined}
            driverLocation={driverLocation}
            height="100%"
            onMapClick={(latlng) => {
              if (!pickupCoords) { setPickupCoords(latlng); setPickupAddr(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`); }
              else if (!dropoffCoords) { setDropoffCoords(latlng); setDropoffAddr(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`); }
            }}
          />
        </Suspense>

        {/* Top overlay buttons */}
        <div style={{ position: "absolute", top: 16, left: 16, right: 16, zIndex: 999, display: "flex", justifyContent: "space-between" }}>
          <button className="map-btn" onClick={() => navigate("/passenger")}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          {phase === "tracking" && driverLocation && estimate && (
            <MapInfoCard distanceM={Math.round(estimate.distanceKm * 1000)} timeMin={estimate.durationMin} />
          )}
          <button className="map-btn" onClick={() => setPickupCoords(coords)}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom sheet — changes by phase */}
      <div style={{ flexShrink: 0, padding: "0 16px 24px", background: "var(--bg-base)" }}>

        {/* ── Input phase ── */}
        {phase === "input" && (
          <div className="page-enter flex-col gap-3" style={{ paddingTop: 16 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>
              Tap the map to set pickup, then drop-off
            </p>
            <div className="input-wrap">
              <label className="input-label">Pickup</label>
              <input className="input" value={pickupAddr}
                onChange={(e) => setPickupAddr(e.target.value)} placeholder="Tap map or type address" />
            </div>
            <div className="input-wrap">
              <label className="input-label">Drop-off</label>
              <input className="input" value={dropoffAddr}
                onChange={(e) => setDropoffAddr(e.target.value)} placeholder="Where to?" />
            </div>
            <div className="flex items-center gap-3">
              <label className="input-label" style={{ whiteSpace: "nowrap" }}>Seats</label>
              {[1, 2, 3, 4].map((n) => (
                <button key={n} onClick={() => setSeats(n)} style={{
                  width: 36, height: 36, borderRadius: "var(--r-sm)",
                  background: seats === n ? "var(--purple)" : "var(--bg-elevated)",
                  border: `1px solid ${seats === n ? "var(--purple)" : "var(--border)"}`,
                  color: seats === n ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-display)",
                }}>
                  {n}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary"
              onClick={getEstimate}
              disabled={loading || !pickupCoords || !dropoffCoords}
            >
              {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : "Get Price"}
            </button>
          </div>
        )}

        {/* ── Estimate phase ── */}
        {phase === "estimate" && estimate && (
          <div className="page-enter flex-col gap-3" style={{ paddingTop: 16 }}>
            <LocationCard
              pickup={pickupAddr} dropoff={dropoffAddr}
              distanceKm={estimate.distanceKm} durationMin={estimate.durationMin}
            />
            {/* Price breakdown */}
            <div className="card" style={{ padding: "14px 18px" }}>
              <div className="flex justify-between text-sm" style={{ marginBottom: 6 }}>
                <span className="text-muted">Base fare</span>
                <span>M {estimate.baseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ marginBottom: 6 }}>
                <span className="text-muted">Distance ({estimate.distanceKm.toFixed(1)} km)</span>
                <span>M {estimate.distanceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ marginBottom: 8 }}>
                <span className="text-muted">Time (~{Math.round(estimate.durationMin)} min)</span>
                <span>M {estimate.timeCharge.toFixed(2)}</span>
              </div>
              <div className="divider" />
              <div className="flex justify-between">
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Total</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: "var(--teal)" }}>
                  M {estimate.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={bookRide} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : "Book a Ride"}
            </button>
            <button className="btn btn-ghost" onClick={() => { setPhase("input"); setEstimate(null); }}>
              Back
            </button>
          </div>
        )}

        {/* ── Selecting driver phase ── */}
        {phase === "selecting" && (
          <div className="page-enter flex-col gap-3" style={{ paddingTop: 16 }}>
            <div className="flex items-center gap-3">
              <span className="spinner" />
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Finding you a driver</div>
                <div className="text-sm text-muted">Nearby drivers are being notified…</div>
              </div>
            </div>
            {activeTrip && (
              <LocationCard pickup={activeTrip.pickupAddress} dropoff={activeTrip.dropoffAddress}
                distanceKm={activeTrip.distanceKm} durationMin={activeTrip.durationMin} />
            )}
            <button className="btn btn-ghost" onClick={cancelTrip} style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              Cancel Trip
            </button>
          </div>
        )}

        {/* ── Tracking phase ── */}
        {phase === "tracking" && activeTrip && (
          <div className="page-enter flex-col gap-3" style={{ paddingTop: 16 }}>
            {activeTrip.driver && (
              <DriverCard
                fullName={activeTrip.driver.fullName}
                rating={activeTrip.driver.rating}
                vehicleModel={activeTrip.driver.driverProfile?.vehicleModel}
                vehiclePlate={activeTrip.driver.driverProfile?.vehiclePlate}
                avatarUrl={activeTrip.driver.avatarUrl}
                status={
                  activeTrip.status === "DRIVER_ASSIGNED" ? "Driver on the way" :
                  activeTrip.status === "DRIVER_ARRIVED" ? "Driver has arrived! 🎉" :
                  activeTrip.status === "IN_PROGRESS" ? "Trip in progress 🚕" : ""
                }
              />
            )}
            <LocationCard pickup={activeTrip.pickupAddress} dropoff={activeTrip.dropoffAddress}
              distanceKm={activeTrip.distanceKm} durationMin={activeTrip.durationMin} />
            {activeTrip.status !== "IN_PROGRESS" && (
              <button className="btn btn-ghost" onClick={cancelTrip}
                style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
                Cancel Trip
              </button>
            )}
          </div>
        )}

        {/* ── Rating phase ── */}
        {phase === "rating" && activeTrip && (
          <div className="page-enter flex-col gap-4" style={{ paddingTop: 16 }}>
            <div className="text-center">
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
              <h3 style={{ fontFamily: "var(--font-display)" }}>Trip Complete!</h3>
              <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                You paid <strong style={{ color: "var(--teal)" }}>M {Number(activeTrip.totalPrice).toFixed(2)}</strong>
              </p>
            </div>
            {activeTrip.driver && (
              <div style={{ textAlign: "center" }}>
                <p className="text-sm text-muted" style={{ marginBottom: 8 }}>Rate your driver</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRatingScore(s)} style={{
                      fontSize: 32, background: "none", border: "none", cursor: "pointer",
                      filter: s <= ratingScore ? "none" : "grayscale(1) opacity(0.4)",
                    }}>⭐</button>
                  ))}
                </div>
              </div>
            )}
            <div className="input-wrap">
              <label className="input-label">Review (optional)</label>
              <input className="input" value={ratingReview}
                onChange={(e) => setRatingReview(e.target.value)} placeholder="Great driver!" />
            </div>
            <button className="btn btn-primary" onClick={submitRating}>Done</button>
            <button className="btn btn-ghost" onClick={() => { setActiveTrip(null); navigate("/passenger"); }}>
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
