import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { tripApi, driverApi } from "../../api/client";
import { useTripStore, Trip } from "../../store/tripStore";
import { useAuthStore } from "../../store/authStore";
import { useSocket } from "../../hooks/useSocket";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useToast } from "../../lib/toast";
import { Icons, Avatar, StarRating, MapInfoCard } from "../../components/shared";
import DispatchMap from "../../components/map/DispatchMap";

type Phase = "list" | "tracking" | "rating";

export default function FindPassengersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuthStore();
  const { availableTrips, setAvailableTrips, activeTrip, setActiveTrip } = useTripStore();
  const { joinTrip } = useSocket();
  const { coords } = useGeolocation(true);
  const [phase, setPhase] = useState<Phase>("list");
  const [loading, setLoading] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState("");

  useEffect(() => {
    tripApi.getAvailable().then(({ data }) => setAvailableTrips(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!coords || !activeTrip) return;
    const interval = setInterval(() => {
      driverApi.updateLocation(coords.lat, coords.lng, activeTrip.id).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [coords, activeTrip?.id]);

  useEffect(() => {
    if (!activeTrip) return;
    if (activeTrip.status === "COMPLETED") setPhase("rating");
    if (activeTrip.status === "CANCELLED") {
      toast("Passenger cancelled", "error");
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
      toast(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Could not accept",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function markArrived() {
    if (!activeTrip) return;
    await tripApi.arrived(activeTrip.id);
    const { data } = await tripApi.getOne(activeTrip.id);
    setActiveTrip(data);
    toast("Passenger notified", "success");
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
      toast(`M ${Number(data.driverEarning).toFixed(2)} earned!`, "success");
    } catch {
      toast("Could not complete trip", "error");
    } finally {
      setLoading(false);
    }
  }

  async function cancelTrip() {
    if (!activeTrip) return;
    try {
      await tripApi.cancel(activeTrip.id);
      setActiveTrip(null);
      setPhase("list");
      toast("Trip cancelled", "info");
    } catch {
      toast("Cancel failed", "error");
    }
  }

  async function submitRating() {
    if (!activeTrip) return;
    try {
      await tripApi.rate(activeTrip.id, ratingScore, ratingReview);
    } catch {}
    setActiveTrip(null);
    navigate("/driver");
  }

  const mapCenter = coords ?? (activeTrip
  ? { lat: activeTrip.pickupLat, lng: activeTrip.pickupLng }
  : { lat: -29.3167, lng: 27.4833 }); // fallback to Maseru

  return (
    <div className="app-shell">
      {/* ── List phase ── */}
      {phase === "list" && (
        <>
          <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 24 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
              <button className="btn-icon-dark" onClick={() => navigate("/driver")}>{Icons.back}</button>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>Find Passengers</span>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              {availableTrips.length > 0
                ? `${availableTrips.length} ride request${availableTrips.length > 1 ? "s" : ""} nearby`
                : "Waiting for ride requests..."}
            </div>
          </div>

          <div className="scroll-area flex-1 px-5" style={{ paddingTop: 20, paddingBottom: 32 }}>
            {availableTrips.length === 0 && (
              <div className="card text-center" style={{ padding: 48 }}>
                <div style={{ color: "var(--teal)", marginBottom: 16, display: "flex", justifyContent: "center" }}>{Icons.search}</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>No requests right now</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Stay online — new trips appear instantly</div>
                <button
                  className="btn btn-outline"
                  style={{ width: "auto", padding: "10px 24px", margin: "0 auto" }}
                  onClick={() => tripApi.getAvailable().then(({ data }) => setAvailableTrips(data))}
                >
                  Refresh
                </button>
              </div>
            )}
            <div className="flex-col gap-3">
              {availableTrips.map(trip => (
                <div key={trip.id} className="card" style={{ padding: 18 }}>
                  <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
                    <Avatar src={trip.passenger?.avatarUrl} name={trip.passenger?.fullName ?? "P"} size={44} />
                    <div className="flex-1">
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{trip.passenger?.fullName}</div>
                      {trip.passenger && <StarRating value={trip.passenger.rating} />}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: 20, color: "var(--orange)" }}>
                        M {Number(trip.totalPrice).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{trip.distanceKm?.toFixed(1)} km</div>
                    </div>
                  </div>

                  <div style={{
                    background: "var(--bg-input)", borderRadius: "var(--r-md)",
                    padding: "12px 14px", marginBottom: 14,
                  }}>
                    <div className="flex gap-3 items-start">
                      <div className="route-connector" style={{ paddingTop: 3 }}>
                        <div className="route-dot-from" />
                        <div className="route-line-v" style={{ minHeight: 16 }} />
                        <div className="route-dot-to" />
                      </div>
                      <div className="flex-1">
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }} className="truncate">{trip.pickupAddress}</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{trip.dropoffAddress}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="btn btn-primary" style={{ flex: 1 }}
                      onClick={() => accept(trip.id)} disabled={loading}>
                      {loading
                        ? <span className="spinner spinner-dark" style={{ width: 18, height: 18 }} />
                        : "Accept"}
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1, color: "var(--danger)", borderColor: "var(--danger)" }}
                      onClick={() => tripApi.cancel(trip.id).catch(() => {})}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Tracking phase ── */}
      {phase === "tracking" && activeTrip && (
        <>
          <div style={{ height: 320, position: "relative", flexShrink: 0 }}>
            <DispatchMap
              center={mapCenter}
              pickup={{ lat: activeTrip.pickupLat, lng: activeTrip.pickupLng }}
              dropoff={{ lat: activeTrip.dropoffLat, lng: activeTrip.dropoffLng }}
              driverLocation={coords ?? undefined}
              height="100%"
            />
            <div style={{
              position: "absolute", top: 16, left: 16, right: 16,
              zIndex: 999, display: "flex", justifyContent: "space-between",
            }}>
              <button className="map-btn" onClick={() => navigate("/driver")}>{Icons.back}</button>
              {activeTrip.distanceKm && (
                <MapInfoCard distanceM={Math.round(activeTrip.distanceKm * 1000)} timeMin={activeTrip.durationMin} />
              )}
            </div>
          </div>

          <div style={{ background: "var(--bg-base)", borderRadius: "24px 24px 0 0", marginTop: -20, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, margin: "12px auto 0" }} />
            <div className="px-5" style={{ paddingBottom: 28, paddingTop: 16 }}>
              {activeTrip.passenger && (
                <div className="card" style={{ padding: "14px 18px", marginBottom: 14 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: "var(--orange)",
                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10,
                  }}>
                    {activeTrip.status === "DRIVER_ASSIGNED" ? "Heading to pickup" :
                     activeTrip.status === "DRIVER_ARRIVED" ? "Waiting for passenger" :
                     activeTrip.status === "IN_PROGRESS" ? "Trip in progress" : ""}
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar src={activeTrip.passenger.avatarUrl} name={activeTrip.passenger.fullName} size={44} />
                    <div className="flex-1">
                      <div style={{ fontWeight: 700 }}>{activeTrip.passenger.fullName}</div>
                      <StarRating value={activeTrip.passenger.rating} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                background: "var(--bg-input)", borderRadius: "var(--r-md)",
                padding: "12px 14px", marginBottom: 14,
              }}>
                <div className="flex gap-3 items-start">
                  <div className="route-connector" style={{ paddingTop: 3 }}>
                    <div className="route-dot-from" />
                    <div className="route-line-v" style={{ minHeight: 16 }} />
                    <div className="route-dot-to" />
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }} className="truncate">{activeTrip.pickupAddress}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{activeTrip.dropoffAddress}</div>
                  </div>
                </div>
              </div>

              <div className="flex-col gap-2">
                {activeTrip.status === "DRIVER_ASSIGNED" && (
                  <button className="btn btn-primary" onClick={markArrived}>I've Arrived at Pickup</button>
                )}
                {activeTrip.status === "DRIVER_ARRIVED" && (
                  <button className="btn btn-primary" onClick={startTrip}>Start Trip</button>
                )}
                {activeTrip.status === "IN_PROGRESS" && (
                  <button className="btn btn-primary" onClick={endTrip} disabled={loading}>
                    {loading
                      ? <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} />
                      : "End Trip & Collect Payment"}
                  </button>
                )}
                <button
                  className="btn btn-outline"
                  onClick={cancelTrip}
                  style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                >
                  Cancel Trip
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Rating phase ── */}
      {phase === "rating" && activeTrip && (
        <div className="app-shell" style={{ justifyContent: "center", padding: "40px 24px" }}>
          <div className="page-enter flex-col gap-4 text-center items-center">
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(34,197,94,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--success)",
            }}>{Icons.check}</div>
            <h2>Trip Complete!</h2>
            <p style={{ color: "var(--text-muted)" }}>
              You earned <strong style={{ color: "var(--orange)" }}>M {Number(activeTrip.driverEarning).toFixed(2)}</strong>
            </p>
            <div className="divider w-full" />
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Rate your passenger (optional)</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRatingScore(s)} style={{
                  width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: s <= ratingScore ? "var(--orange)" : "var(--bg-input)",
                  color: s <= ratingScore ? "#fff" : "var(--text-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "var(--t)",
                }}>{Icons.star}</button>
              ))}
            </div>
            <input
              className="input w-full"
              value={ratingReview}
              onChange={e => setRatingReview(e.target.value)}
              placeholder="Add a note (optional)"
            />
            <button className="btn btn-primary w-full" onClick={submitRating}>Done</button>
            <button className="btn btn-ghost" onClick={() => { setActiveTrip(null); navigate("/driver"); }}>Skip</button>
          </div>
        </div>
      )}
    </div>
  );
}
