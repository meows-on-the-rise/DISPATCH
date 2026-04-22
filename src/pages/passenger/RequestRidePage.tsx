import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { tripApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useTripStore, Trip } from "../../store/tripStore";
import { useSocket } from "../../hooks/useSocket";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useToast } from "../../lib/toast";
import { Icons, LocationCard, DriverCard, MapInfoCard } from "../../components/shared";
import DispatchMap from "../../components/map/DispatchMap";

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
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState("");
  const [settingPoint, setSettingPoint] = useState<"pickup" | "dropoff">("pickup");
  // Snapshot the completed trip so rating screen has data even after activeTrip is cleared
  const [completedTrip, setCompletedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    if (activeTrip && !["COMPLETED", "CANCELLED"].includes(activeTrip.status)) {
      setPhase("tracking");
      joinTrip(activeTrip.id);
    }
  }, []);

  useEffect(() => {
    if (!activeTrip) return;
    if (activeTrip.status === "COMPLETED") {
      setCompletedTrip(activeTrip); // save before it gets cleared
      setPhase("rating");
    }
    if (activeTrip.status === "CANCELLED") {
      toast("Trip was cancelled", "error");
      setActiveTrip(null);
      setPhase("input");
    }
  }, [activeTrip?.status]);

  useEffect(() => {
    if (coords && !pickupCoords) {
      setPickupCoords(coords);
      setPickupAddr("My Location");
    }
  }, [coords]);

  async function searchAddress(query: string, type: "pickup" | "dropoff") {
    if (!query.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ls`
      );
      const data = await res.json();
      if (data.length === 0) { toast("Address not found", "error"); return; }
      const { lat, lon, display_name } = data[0];
      const c = { lat: parseFloat(lat), lng: parseFloat(lon) };
      if (type === "pickup") { setPickupCoords(c); setPickupAddr(display_name); }
      else { setDropoffCoords(c); setDropoffAddr(display_name); }
    } catch { toast("Search failed", "error"); }
  }

  async function getEstimate() {
    if (!pickupCoords || !dropoffCoords) { toast("Set both locations on the map", "error"); return; }
    setLoading(true);
    try {
      const { data } = await tripApi.estimate({
        pickupLat: pickupCoords.lat, pickupLng: pickupCoords.lng,
        dropoffLat: dropoffCoords.lat, dropoffLng: dropoffCoords.lng,
      });
      setEstimate(data); setPhase("estimate");
    } catch { toast("Could not calculate price", "error"); }
    finally { setLoading(false); }
  }

  async function bookRide() {
    if (!pickupCoords || !dropoffCoords || !estimate) return;
    const balance = Number(user?.wallet?.balance ?? 0);
    if (balance < estimate.totalPrice) {
      toast(`Need M ${estimate.totalPrice.toFixed(2)} — top up your wallet`, "error"); return;
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
      setActiveTrip(trip); joinTrip(trip.id); setPhase("selecting");
      const interval = setInterval(async () => {
        const { data } = await tripApi.getOne(trip.id);
        setActiveTrip(data);
        if (data.status !== "REQUESTED") { clearInterval(interval); setPhase("tracking"); }
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
      setActiveTrip(null); setPhase("input");
      toast("Trip cancelled", "info");
    } catch { toast("Could not cancel", "error"); }
  }

  async function submitRating() {
    const trip = completedTrip ?? activeTrip;
    if (!trip) return;
    try { await tripApi.rate(trip.id, ratingScore, ratingReview); } catch {}
    setActiveTrip(null);
    setCompletedTrip(null);
    refreshUser();
    navigate("/passenger");
  }

  const mapCenter = pickupCoords ?? (coords ?? { lat: -29.3167, lng: 27.4833 });
  const ratingTrip = completedTrip ?? activeTrip;

  // ── Rating phase — shown fullscreen, no map ──────────────────────────────
  if (phase === "rating" && ratingTrip) {
    return (
      <div className="app-shell" style={{ justifyContent: "center", padding: "40px 24px" }}>
        <div className="page-enter flex-col gap-4 text-center items-center" style={{ width: "100%" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(34,197,94,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--success)",
          }}>
            {Icons.check}
          </div>
          <div>
            <h2 style={{ marginBottom: 6 }}>Trip Complete!</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              You paid{" "}
              <strong style={{ color: "var(--orange)" }}>
                M {Number(ratingTrip.totalPrice ?? 0).toFixed(2)}
              </strong>
            </p>
          </div>
          <div className="divider w-full" />
          {ratingTrip.driver && (
            <div style={{ width: "100%" }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                Rate your driver
              </p>
              <div className="flex justify-center gap-3" style={{ marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setRatingScore(s)} style={{
                    width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: s <= ratingScore ? "var(--orange)" : "var(--bg-input)",
                    color: s <= ratingScore ? "#fff" : "var(--text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "var(--t)",
                  }}>
                    {Icons.star}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="input-wrap w-full">
            <input
              className="input"
              value={ratingReview}
              onChange={e => setRatingReview(e.target.value)}
              placeholder="Leave a review (optional)"
            />
          </div>
          <button className="btn btn-primary w-full" onClick={submitRating}>Submit & Done</button>
          <button className="btn btn-ghost" onClick={() => {
            setActiveTrip(null); setCompletedTrip(null); navigate("/passenger");
          }}>Skip</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Map fills top portion */}
      <div style={{ height: 320, position: "relative", flexShrink: 0 }}>
        <DispatchMap
          center={mapCenter}
          pickup={pickupCoords ?? undefined}
          dropoff={dropoffCoords ?? undefined}
          driverLocation={driverLocation}
          height="100%"
          onMapClick={(latlng) => {
            if (settingPoint === "pickup") {
              setPickupCoords(latlng);
              setPickupAddr(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
              setSettingPoint("dropoff");
            } else {
              setDropoffCoords(latlng);
              setDropoffAddr(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
            }
          }}
        />

        {/* Map overlay controls */}
        <div style={{
          position: "absolute", top: 16, left: 16, right: 16, zIndex: 999,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <button className="map-btn" onClick={() => navigate("/passenger")}>{Icons.back}</button>
          {phase === "tracking" && driverLocation && estimate && (
            <MapInfoCard
              distanceM={Math.round((estimate.distanceKm ?? 0) * 1000)}
              timeMin={estimate.durationMin ?? undefined}
            />
          )}
          <button className="map-btn" onClick={() => {
            if (coords) { setPickupCoords(coords); setPickupAddr("My Location"); }
          }}>
            {Icons.destination}
          </button>
        </div>

        {phase === "input" && (
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            background: "var(--bg-dark)", borderRadius: "var(--r-pill)",
            padding: "6px 16px", zIndex: 999,
          }}>
            <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>
              Tap map to set {settingPoint === "pickup" ? "pickup" : "drop-off"}
            </span>
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div style={{ background: "var(--bg-base)", borderRadius: "24px 24px 0 0", flexShrink: 0, marginTop: -20 }}>
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, margin: "12px auto 0" }} />

        <div className="px-5" style={{ paddingBottom: 28, paddingTop: 16 }}>

          {/* ── Input phase ── */}
          {phase === "input" && (
            <div className="flex-col gap-4 page-enter">
              <div className="input-group">
                <div className="input-row">
                  <div className="input-dot-from" />
                  <input
                    value={pickupAddr}
                    onChange={e => setPickupAddr(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && searchAddress(pickupAddr, "pickup")}
                    placeholder="Pickup location"
                    style={{ minWidth: 0, flex: 1 }}
                  />
                  <button type="button" onClick={() => searchAddress(pickupAddr, "pickup")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--teal)", padding: "0 4px", flexShrink: 0 }}>
                  {Icons.search}
                </button>
                  <button className="input-swap" style={{ flexShrink: 0 }} onClick={() => {
                    const tmp = pickupCoords; setPickupCoords(dropoffCoords); setDropoffCoords(tmp);
                    const ta = pickupAddr; setPickupAddr(dropoffAddr); setDropoffAddr(ta);
                  }}>{Icons.swap}</button>
                </div>
                <div className="input-row">
                  <div className="input-dot-to" />
                  <input
                    value={dropoffAddr}
                    onChange={e => setDropoffAddr(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && searchAddress(dropoffAddr, "dropoff")}
                    placeholder="Where to?"
                    style={{ minWidth: 0, flex: 1 }}
                  />
                  <button type="button" onClick={() => searchAddress(dropoffAddr, "dropoff")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--teal)", padding: "0 8px" }}>
                    {Icons.search}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500, flexShrink: 0 }}>Seats</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <button key={n} onClick={() => setSeats(n)} style={{
                      width: 36, height: 36, borderRadius: "var(--r-md)",
                      background: seats === n ? "var(--orange)" : "var(--bg-white)",
                      border: `1.5px solid ${seats === n ? "var(--orange)" : "var(--border)"}`,
                      color: seats === n ? "#fff" : "var(--text-secondary)",
                      cursor: "pointer", fontWeight: 700, fontFamily: "var(--font)", fontSize: 14,
                      boxShadow: "var(--shadow-sm)",
                    }}>{n}</button>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" onClick={getEstimate}
                disabled={loading || !pickupCoords || !dropoffCoords}>
                {loading ? <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} /> : "Get Price"}
              </button>
            </div>
          )}

          {/* ── Estimate phase ── */}
          {phase === "estimate" && estimate && (
            <div className="flex-col gap-4 page-enter">
              <LocationCard pickup={pickupAddr} dropoff={dropoffAddr}
                distanceKm={estimate.distanceKm} durationMin={estimate.durationMin} />
              <div className="card" style={{ padding: "16px 20px" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Price Breakdown</div>
                {[
                  { label: "Base fare", value: estimate.baseFare },
                  { label: `Distance (${estimate.distanceKm.toFixed(1)} km)`, value: estimate.distanceCharge },
                  { label: `Time (~${Math.round(estimate.durationMin)} min)`, value: estimate.timeCharge },
                ].map(row => (
                  <div key={row.label} className="flex justify-between" style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>M {row.value.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: "var(--border-light)", margin: "10px 0" }} />
                <div className="flex justify-between items-center">
                  <span style={{ fontWeight: 700 }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: 22, color: "var(--orange)" }}>
                    M {estimate.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <button className="btn btn-primary" onClick={bookRide} disabled={loading}>
                {loading ? <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} /> : "Book a Ride"}
              </button>
              <button className="btn btn-outline" onClick={() => { setPhase("input"); setEstimate(null); }}>Back</button>
            </div>
          )}

          {/* ── Selecting driver ── */}
          {phase === "selecting" && (
            <div className="flex-col gap-4 page-enter">
              <div className="flex items-center gap-3">
                <span className="spinner" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Finding your driver</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Nearby drivers are being notified</div>
                </div>
              </div>
              {activeTrip && (
                <LocationCard pickup={activeTrip.pickupAddress} dropoff={activeTrip.dropoffAddress}
                  distanceKm={activeTrip.distanceKm} durationMin={activeTrip.durationMin} />
              )}
              <button className="btn btn-outline" onClick={cancelTrip}
                style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>Cancel Trip</button>
            </div>
          )}

          {/* ── Tracking ── */}
          {phase === "tracking" && activeTrip && (
            <div className="flex-col gap-3 page-enter">
              {activeTrip.driver && (
                <DriverCard
                  fullName={activeTrip.driver.fullName}
                  rating={activeTrip.driver.rating}
                  vehicleModel={activeTrip.driver.driverProfile?.vehicleModel}
                  vehiclePlate={activeTrip.driver.driverProfile?.vehiclePlate}
                  avatarUrl={activeTrip.driver.avatarUrl}
                  status={
                    activeTrip.status === "DRIVER_ASSIGNED" ? "Driver on the way" :
                    activeTrip.status === "DRIVER_ARRIVED" ? "Driver has arrived" :
                    activeTrip.status === "IN_PROGRESS" ? "Trip in progress" : ""
                  }
                />
              )}
              <LocationCard pickup={activeTrip.pickupAddress} dropoff={activeTrip.dropoffAddress}
                distanceKm={activeTrip.distanceKm} durationMin={activeTrip.durationMin} />
              {activeTrip.status !== "IN_PROGRESS" && (
                <button className="btn btn-outline" onClick={cancelTrip}
                  style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>Cancel Trip</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
