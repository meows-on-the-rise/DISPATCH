import React, { ReactNode } from "react";

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({
  src, name, size = 44,
}: { src?: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--purple-light)" }}>
          {initials}
        </span>
      )}
    </div>
  );
}

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <span className="stars">{"★".repeat(Math.round(value))}{"☆".repeat(5 - Math.round(value))}</span>
      <span style={{ color: "var(--text-secondary)" }}>
        {value.toFixed(1)}{count !== undefined && ` (${count})`}
      </span>
    </span>
  );
}

// ── LocationCard — matches the bottom sheet in the reference ─────────────────
export function LocationCard({
  pickup, dropoff, distanceKm, durationMin, children,
}: {
  pickup: string; dropoff: string;
  distanceKm?: number; durationMin?: number;
  children?: ReactNode;
}) {
  return (
    <div className="card-elevated page-enter">
      {/* Pickup row */}
      <div className="location-row">
        <div className="location-dot pickup" />
        <div className="flex-1">
          <div className="location-name truncate">{pickup}</div>
          <div className="location-sub">Pickup Point</div>
        </div>
      </div>

      {/* Connector with trip meta */}
      <div style={{ display: "flex", gap: 12, marginLeft: 6, margin: "8px 0 8px 6px" }}>
        <div className="route-line" style={{ minHeight: 28 }} />
        {(distanceKm || durationMin) && (
          <div className="flex items-center gap-3 text-sm text-muted" style={{ paddingTop: 4 }}>
            {distanceKm && (
              <span className="flex items-center gap-1">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2a9 9 0 0 1 9 9c0 6-9 13-9 13S3 17 3 11a9 9 0 0 1 9-9z" />
                  <circle cx="12" cy="11" r="3" />
                </svg>
                {distanceKm.toFixed(1)} km
              </span>
            )}
            {durationMin && (
              <span className="flex items-center gap-1">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                ~{Math.round(durationMin)} min
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dropoff row */}
      <div className="location-row">
        <div className="location-dot dropoff" />
        <div className="flex-1">
          <div className="location-name truncate">{dropoff}</div>
          <div className="location-sub">Drop-off Point</div>
        </div>
      </div>

      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}

// ── DriverCard — the "Driver on the way" card from right screen ──────────────
export function DriverCard({
  fullName, rating, vehicleModel, vehiclePlate, avatarUrl, status,
}: {
  fullName: string; rating: number; vehicleModel?: string;
  vehiclePlate?: string; avatarUrl?: string; status?: string;
}) {
  return (
    <div className="driver-card page-enter">
      {status && <div className="on-way">{status}</div>}
      <div className="flex items-center justify-between gap-3">
        <Avatar src={avatarUrl} name={fullName} size={52} />
        <div className="flex-1">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{fullName}</div>
          {vehicleModel && <div className="text-sm text-muted">{vehicleModel}</div>}
          {vehiclePlate && (
            <div className="text-sm" style={{ color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.05em" }}>
              {vehiclePlate}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <StarRating value={rating} />
        </div>
      </div>
    </div>
  );
}

// ── MapInfoCard — purple box showing distance + ETA ───────────────────────────
export function MapInfoCard({ distanceM, timeMin }: { distanceM?: number; timeMin?: number }) {
  return (
    <div className="map-info-card" style={{ minWidth: 130 }}>
      {distanceM != null && (
        <div className="distance">{distanceM < 1000 ? distanceM : (distanceM / 1000).toFixed(1)}<span>{distanceM < 1000 ? "m" : "km"}</span></div>
      )}
      {timeMin != null && <div className="time">{timeMin.toFixed(1)} minutes</div>}
      <div className="fastest">Fastest route</div>
    </div>
  );
}

// ── IconBtn — rounded rect icon + label (dashboard icons) ────────────────────
export function IconBtn({
  icon, label, onClick, disabled,
}: { icon: ReactNode; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      className="icon-btn"
      onClick={onClick}
      disabled={disabled}
      style={{ background: "none", border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1 }}
    >
      <div className="icon-btn-box">{icon}</div>
      <span className="icon-btn-label">{label}</span>
    </button>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="toggle-wrap" style={{ cursor: "pointer" }}>
      <span className="toggle">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-track" />
        <span className="toggle-thumb" />
      </span>
      {label && <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{label}</span>}
    </label>
  );
}

// ── BalanceBadge ──────────────────────────────────────────────────────────────
export function BalanceBadge({ amount }: { amount: number }) {
  return (
    <div style={{
      background: "var(--purple-dim)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-md)",
      padding: "6px 14px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
    }}>
      <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Balance</span>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--teal)" }}>
        M {Number(amount).toFixed(2)}
      </span>
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({
  title, onBack, right,
}: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="nav-header">
      {onBack ? (
        <button className="map-btn" onClick={onBack}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
      ) : <div style={{ width: 44 }} />}
      <h3 style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
      {right ?? <div style={{ width: 44 }} />}
    </div>
  );
}
