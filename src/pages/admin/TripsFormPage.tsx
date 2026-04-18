import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { adminApi } from "../../api/client";
import { useToast } from "../../lib/toast";
import { Icons, PageHeader } from "../../components/shared";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminTrip {
  id: string;
  passengerId: string;
  driverId?: string;
  passenger: { fullName: string; userId: string };
  driver?: { fullName: string; userId: string };
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm?: number;
  durationMin?: number;
  totalPrice?: number;
  driverEarning?: number;
  systemCommission?: number;
  seats: number;
  createdAt: string;
  completedAt?: string;
  cancelReason?: string;
}

const STATUSES = ["ALL", "REQUESTED", "DRIVER_ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

const STATUS_COLORS: Record<string, string> = {
  COMPLETED:       "var(--success)",
  CANCELLED:       "var(--danger)",
  IN_PROGRESS:     "var(--orange)",
  REQUESTED:       "var(--teal)",
  DRIVER_ASSIGNED: "var(--teal-mid)",
  DRIVER_EN_ROUTE: "var(--teal-mid)",
  DRIVER_ARRIVED:  "var(--orange)",
};

// ── Cancel modal ──────────────────────────────────────────────────────────────

function CancelModal({
  trip, onClose, onCancelled,
}: { trip: AdminTrip; onClose: () => void; onCancelled: (id: string) => void }) {
  const toast = useToast();
  const [reason,    setReason]    = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [error,     setError]     = useState("");

  async function handle() {
    if (!reason.trim()) { setError("Please provide a cancellation reason"); return; }
    if (reason.trim().length < 5) { setError("Reason must be at least 5 characters"); return; }
    setCancelling(true);
    try {
      await adminApi.cancelTrip(trip.id, reason.trim());
      toast("Trip cancelled", "success");
      onCancelled(trip.id);
    } catch (err: any) {
      toast(err?.response?.data?.error ?? "Failed to cancel trip", "error");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(13,45,53,0.7)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div className="card page-enter" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 390, padding: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "rgba(249,115,22,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--orange)", margin: "0 auto 16px" }}>
          {Icons.x}
        </div>
        <h3 style={{ textAlign: "center", marginBottom: 6 }}>Cancel Trip</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>
          Trip from <strong>{trip.passenger.fullName}</strong>
          {trip.driver && <> · Driver: <strong>{trip.driver.fullName}</strong></>}
        </p>

        <div className="input-wrap" style={{ marginBottom: 16 }}>
          <label className="input-label">Cancellation Reason</label>
          <textarea
            className="input"
            value={reason}
            onChange={e => { setReason(e.target.value); setError(""); }}
            placeholder="Enter the reason for cancellation…"
            rows={3}
            style={{ resize: "vertical", ...(error ? { borderColor: "var(--danger)" } : {}) }}
          />
          {error && (
            <span style={{ fontSize: 11, color: "var(--danger)", marginTop: 2 }}>{error}</span>
          )}
        </div>

        <div className="flex gap-2">
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Back</button>
          <button
            className="btn"
            style={{ flex: 1, background: "var(--danger)", color: "#fff", borderRadius: "var(--r-pill)", border: "none" }}
            onClick={handle}
            disabled={cancelling}
          >
            {cancelling ? <span className="spinner spinner-dark" /> : "Cancel Trip"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Trip detail card ──────────────────────────────────────────────────────────

function EditTripModal({
  trip, onClose, onSaved,
}: { trip: AdminTrip; onClose: () => void; onSaved: (t: AdminTrip) => void }) {
  const toast = useToast();
  const [pickupAddress,  setPickupAddress]  = useState(trip.pickupAddress);
  const [dropoffAddress, setDropoffAddress] = useState(trip.dropoffAddress);
  const [seats,          setSeats]          = useState(trip.seats);
  const [status,         setStatus]         = useState(trip.status);
  const [saving,         setSaving]         = useState(false);
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!pickupAddress.trim())  e.pickup  = "Pickup address is required";
    if (!dropoffAddress.trim()) e.dropoff = "Dropoff address is required";
    if (seats < 1 || seats > 8) e.seats   = "Seats must be between 1 and 8";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data } = await adminApi.updateTrip(trip.id, {
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
        seats,
        status,
      });
      toast("Trip updated", "success");
      onSaved({ ...trip, ...data });
    } catch (err: any) {
      toast(err?.response?.data?.error ?? "Update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(13,45,53,0.7)",
      zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div className="page-enter" onClick={e => e.stopPropagation()} style={{
        background: "var(--bg-white)", borderRadius: "var(--r-xl) var(--r-xl) 0 0",
        padding: "24px 20px 36px", width: "100%", maxWidth: 430,
      }}>
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 99, margin: "0 auto 20px" }} />
        
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Edit Trip</div>

        {/* Pickup */}
        <div className="input-wrap" style={{ marginBottom: 14 }}>
          <label className="input-label">Pickup Address</label>
          <input
            className="input"
            value={pickupAddress}
            onChange={e => { setPickupAddress(e.target.value); setErrors(p => ({ ...p, pickup: "" })); }}
            placeholder="Pickup address"
            style={errors.pickup ? { borderColor: "var(--danger)" } : {}}
          />
          {errors.pickup && <span style={{ fontSize: 11, color: "var(--danger)" }}>{errors.pickup}</span>}
        </div>

        {/* Dropoff */}
        <div className="input-wrap" style={{ marginBottom: 14 }}>
          <label className="input-label">Dropoff Address</label>
          <input
            className="input"
            value={dropoffAddress}
            onChange={e => { setDropoffAddress(e.target.value); setErrors(p => ({ ...p, dropoff: "" })); }}
            placeholder="Dropoff address"
            style={errors.dropoff ? { borderColor: "var(--danger)" } : {}}
          />
          {errors.dropoff && <span style={{ fontSize: 11, color: "var(--danger)" }}>{errors.dropoff}</span>}
        </div>

        {/* Seats */}
        <div className="input-wrap" style={{ marginBottom: 14 }}>
          <label className="input-label">Seats</label>
          <input
            className="input"
            type="number"
            min={1}
            max={8}
            value={seats}
            onChange={e => { setSeats(Number(e.target.value)); setErrors(p => ({ ...p, seats: "" })); }}
            style={errors.seats ? { borderColor: "var(--danger)" } : {}}
          />
          {errors.seats && <span style={{ fontSize: 11, color: "var(--danger)" }}>{errors.seats}</span>}
        </div>

        {/* Status */}
        <div className="input-wrap" style={{ marginBottom: 20 }}>
          <label className="input-label">Status</label>
          <select
            className="input"
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{ cursor: "pointer" }}
          >
            {["REQUESTED", "DRIVER_ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner spinner-dark" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, onCancel, onEdit }: { trip: AdminTrip; onCancel: () => void; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLORS[trip.status] ?? "var(--teal)";
  const canCancel = !["COMPLETED", "CANCELLED"].includes(trip.status);

  return (
    <div className="card" style={{ padding: 16, marginBottom: 10 }}>
      {/* Header row */}
      <div className="flex items-center gap-3" style={{ cursor: "pointer" }} onClick={() => setExpanded(v => !v)}>
        <div style={{
          width: 40, height: 40, borderRadius: "var(--r-md)",
          background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0,
        }}>{Icons.car}</div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }} className="truncate">{trip.passenger.fullName}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>→</span>
            <span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-secondary)" }} className="truncate">
              {trip.driver?.fullName ?? "No driver"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }} className="truncate">
            {trip.pickupAddress}
          </div>
        </div>
        <div className="flex-col items-center gap-1" style={{ flexShrink: 0 }}>
          <span className="badge" style={{ background: `${color}18`, color, fontSize: 10 }}>
            {trip.status.replace(/_/g, " ")}
          </span>
          <span style={{ color: "var(--text-muted)", transition: "transform 200ms", display: "inline-flex", transform: expanded ? "rotate(180deg)" : "none" }}>
            {Icons.chevronDown}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="fade-in" style={{ marginTop: 14, paddingTop: 14, borderTop: "1.5px solid var(--border-light)" }}>
          {/* Route */}
          <div style={{ background: "var(--bg-base)", borderRadius: "var(--r-md)", padding: "12px 14px", marginBottom: 12 }}>
            <div className="flex gap-2 items-start">
              <div className="flex-col items-center gap-1" style={{ paddingTop: 4 }}>
                <div className="route-dot-from" />
                <div className="route-line-v" style={{ minHeight: 20 }} />
                <div className="route-dot-to" />
              </div>
              <div className="flex-1">
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16 }}>{trip.pickupAddress}</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{trip.dropoffAddress}</div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[
              { label: "Distance", value: trip.distanceKm ? `${trip.distanceKm.toFixed(1)} km` : "—" },
              { label: "Duration", value: trip.durationMin ? `${Math.round(trip.durationMin)} min` : "—" },
              { label: "Seats",    value: trip.seats ?? 1 },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "var(--bg-base)", borderRadius: "var(--r-md)", padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Fare breakdown */}
          {trip.totalPrice && (
            <div style={{ background: "var(--orange-light)", borderRadius: "var(--r-md)", padding: "12px 14px", marginBottom: 12 }}>
              <div className="flex justify-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total Fare</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--orange)" }}>M {Number(trip.totalPrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Driver (80%)</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>M {Number(trip.driverEarning ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Platform (20%)</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--teal)" }}>M {Number(trip.systemCommission ?? 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex justify-between" style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Created: {new Date(trip.createdAt).toLocaleString("en-LS", { dateStyle: "medium", timeStyle: "short" })}
            </span>
            {trip.completedAt && (
              <span style={{ fontSize: 11, color: "var(--success)" }}>
                Completed: {new Date(trip.completedAt).toLocaleString("en-LS", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            )}
          </div>

          {trip.cancelReason && (
            <div style={{ background: "rgba(239,68,68,0.08)", borderRadius: "var(--r-md)", padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "var(--danger)" }}>
              Cancelled: {trip.cancelReason}
            </div>
          )}
          <div className="flex gap-2">
            <button
              className="btn btn-outline"
              style={{ flex: 1 }}
              onClick={onEdit}
            >
              {Icons.check} Edit
            </button>
            {canCancel && (
              <button
                className="btn"
                style={{ flex: 1, background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1.5px solid rgba(239,68,68,0.2)", borderRadius: "var(--r-pill)" }}
                onClick={onCancel}
              >
                {Icons.x} Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TripsFormPage() {
  const navigate   = useNavigate();
  const [trips,    setTrips]    = useState<AdminTrip[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("ALL");
  const [cancelTarget, setCancelTarget] = useState<AdminTrip | null>(null);
  const [editTarget, setEditTarget] = useState<AdminTrip | null>(null);

function handleSaved(updated: AdminTrip) {
  setTrips(ts => ts.map(t => t.id === updated.id ? updated : t));
  setEditTarget(null);
}

  const load = useCallback(async (s = search, f = filter) => {
    setLoading(true);
    try {
      const { data } = await adminApi.getTrips(s, f === "ALL" ? "" : f);
      setTrips(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load("", filter); }, [filter]);

  useEffect(() => {
    const t = setTimeout(() => load(search, filter), 400);
    return () => clearTimeout(t);
  }, [search]);

  function handleCancelled(id: string) {
    setTrips(ts => ts.map(t => t.id === id ? { ...t, status: "CANCELLED" } : t));
    setCancelTarget(null);
  }

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "ALL" ? trips.length : trips.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 20 }}>
        <PageHeader title="Trip Management" onBack={() => navigate("/admin")} dark />

        {/* Search */}
        <div style={{ position: "relative", margin: "12px 20px 0" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)" }}>
            {Icons.search}
          </span>
          <input
            className="input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search passenger, driver, address…"
            style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)", color: "#fff", paddingLeft: 44 }}
          />
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 20px 0", scrollbarWidth: "none" }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "6px 12px", borderRadius: "var(--r-pill)", border: "none",
                fontFamily: "var(--font)", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                background: filter === s ? "var(--orange)" : "rgba(255,255,255,0.12)",
                color: filter === s ? "#fff" : "rgba(255,255,255,0.7)",
              }}
            >
              {s.replace(/_/g, " ")}
              {!search && counts[s] > 0 && <span style={{ marginLeft: 4, opacity: 0.8 }}>({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 16, paddingBottom: 32 }}>
        {loading && <div className="flex justify-center" style={{ padding: 40 }}><span className="spinner" /></div>}

        {!loading && trips.length === 0 && (
          <div className="card text-center" style={{ padding: 48, marginTop: 16 }}>
            <div style={{ color: "var(--text-muted)", display: "flex", justifyContent: "center", marginBottom: 12 }}>{Icons.car}</div>
            <div style={{ fontWeight: 600 }}>No trips found</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Try a different search or filter</div>
          </div>
        )}

        {!loading && trips.map(t => (
        <TripCard key={t.id} trip={t} onCancel={() => setCancelTarget(t)} onEdit={() => setEditTarget(t)} />
        ))}
      </div>

      {cancelTarget && (
        <CancelModal trip={cancelTarget} onClose={() => setCancelTarget(null)} onCancelled={handleCancelled} />
      )}

      {editTarget && (
      <EditTripModal trip={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
