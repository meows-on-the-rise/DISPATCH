import React, { ReactNode } from "react";

// ── SVG Icon library — no emojis ─────────────────────────────────────────────

export const Icons = {
  back: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
  ),
  menu: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  ),
  more: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
    </svg>
  ),
  location: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a9 9 0 0 1 9 9c0 6-9 13-9 13S3 17 3 11a9 9 0 0 1 9-9z"/><circle cx="12" cy="11" r="3"/>
    </svg>
  ),
  destination: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
    </svg>
  ),
  swap: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
    </svg>
  ),
  wallet: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M20 12v4H6a2 2 0 0 0 0 4h14v-4"/><path d="M20 12H16a2 2 0 0 0 0 4h4"/>
    </svg>
  ),
  activity: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  stats: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  car: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/><path d="M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/><path d="M5 12h14"/>
    </svg>
  ),
  document: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  search: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  user: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  lock: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  eye: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  eyeOff: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  mail: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  phone: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  clock: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  check: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  chevronDown: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  star: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  upload: (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  logout: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  dispatch: (
    <svg viewBox="0 0 680 680" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect x="140" y="140" width="400" height="400" rx="90" fill="#0d4f5c"/>
      <circle cx="340" cy="340" r="130" fill="#0a3d48"/>
      <rect x="220" y="330" width="240" height="80" rx="14" fill="#f97316"/>
      <path d="M270 330 Q285 280 340 270 Q395 280 410 330 Z" fill="#f97316"/>
      <path d="M285 330 Q295 292 340 284 Q385 292 395 330 Z" fill="#0a3d48" opacity="0.5"/>
      <circle cx="275" cy="415" r="32" fill="#0a3d48"/>
      <circle cx="275" cy="415" r="18" fill="#1a6b7a"/>
      <circle cx="405" cy="415" r="32" fill="#0a3d48"/>
      <circle cx="405" cy="415" r="18" fill="#1a6b7a"/>
      <rect x="452" y="348" width="18" height="12" rx="4" fill="#fff" opacity="0.8"/>
      <rect x="210" y="348" width="18" height="12" rx="4" fill="#ff6b00" opacity="0.9"/>
    </svg>
  ),
};

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ src, name, size = 44 }: { src?: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {src
        ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontWeight: 700, color: "var(--teal)" }}>{initials}</span>
      }
    </div>
  );
}

// ── StarRating ────────────────────────────────────────────────────────────────
export function StarRating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <span className="stars flex gap-1">
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ color: i <= Math.round(value) ? "var(--orange)" : "var(--border)", fontSize: 13 }}>
            {Icons.star}
          </span>
        ))}
      </span>
      <span className="text-muted" style={{ fontSize: 12 }}>
        {value.toFixed(1)}{count !== undefined && ` (${count})`}
      </span>
    </span>
  );
}

// ── LocationCard ──────────────────────────────────────────────────────────────
export function LocationCard({
  pickup, dropoff, distanceKm, durationMin, children,
}: { pickup: string; dropoff: string; distanceKm?: number; durationMin?: number; children?: ReactNode }) {
  return (
    <div className="card page-enter" style={{ padding: "18px 20px" }}>
      <div className="flex gap-3 items-start">
        <div className="route-connector" style={{ paddingTop: 4 }}>
          <div className="route-dot-from" />
          <div className="route-line-v" style={{ minHeight: 32 }} />
          <div className="route-dot-to" />
        </div>
        <div className="flex-1 flex-col" style={{ gap: 0, minWidth: 0, overflow: "hidden" }}>
          <div style={{ marginBottom: 16 }}>
            <div className="location-name truncate">{pickup}</div>
            <div className="location-sub">Pickup Point</div>
          </div>
          {(distanceKm || durationMin) && (
            <div className="flex gap-4 text-xs text-muted" style={{ marginBottom: 12 }}>
              {distanceKm && (
                <span className="flex items-center gap-1">
                  <span style={{ color: "var(--teal)" }}>{Icons.location}</span>
                  {distanceKm.toFixed(1)} km
                </span>
              )}
              {durationMin && (
                <span className="flex items-center gap-1">
                  <span style={{ color: "var(--teal)" }}>{Icons.clock}</span>
                  ~{Math.round(durationMin)} min
                </span>
              )}
            </div>
          )}
          <div>
            <div className="location-name truncate">{dropoff}</div>
            <div className="location-sub">Drop-off Point</div>
          </div>
        </div>
      </div>
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}

// ── DriverCard ────────────────────────────────────────────────────────────────
export function DriverCard({
  fullName, rating, vehicleModel, vehiclePlate, avatarUrl, status,
}: { fullName: string; rating: number; vehicleModel?: string; vehiclePlate?: string; avatarUrl?: string; status?: string }) {
  return (
    <div className="driver-card page-enter">
      {status && <div className="status-tag">{status}</div>}
      <div className="flex items-center justify-between gap-3">
        <Avatar src={avatarUrl} name={fullName} size={52} />
        <div className="flex-1">
          <div style={{ fontWeight: 700, fontSize: 16 }}>{fullName}</div>
          {vehicleModel && <div className="text-sm text-muted">{vehicleModel}</div>}
          {vehiclePlate && (
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--teal)", letterSpacing: "0.05em", marginTop: 2 }}>
              {vehiclePlate}
            </div>
          )}
        </div>
        <StarRating value={rating} />
      </div>
    </div>
  );
}

// ── MapInfoCard ───────────────────────────────────────────────────────────────
export function MapInfoCard({ distanceM, timeMin }: { distanceM?: number; timeMin?: number }) {
  return (
    <div className="map-info-card">
      {distanceM != null && (
        <div className="distance">
          {distanceM < 1000 ? distanceM : (distanceM / 1000).toFixed(1)}
          <span>{distanceM < 1000 ? "m" : "km"}</span>
        </div>
      )}
      {timeMin != null && <div className="eta">{timeMin.toFixed(0)} min</div>}
      <span className="tag">Fastest route</span>
    </div>
  );
}

// ── IconBtn ───────────────────────────────────────────────────────────────────
export function IconBtn({ icon, label, onClick, disabled }: { icon: ReactNode; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button className="icon-btn" onClick={onClick} disabled={disabled}
      style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
      <div className="icon-btn-box">{icon}</div>
      <span className="icon-btn-label">{label}</span>
    </button>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="toggle-wrap" style={{ cursor: "pointer" }}>
      <span className="toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-track" />
        <span className="toggle-thumb" />
      </span>
      {label && <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>}
    </label>
  );
}

// ── BalanceBadge ──────────────────────────────────────────────────────────────
export function BalanceBadge({ amount }: { amount: number }) {
  return (
    <div className="balance-badge">
      <span className="label">Balance</span>
      <span className="amount">M {Number(amount).toFixed(2)}</span>
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, onBack, right, dark }: { title: string; onBack?: () => void; right?: ReactNode; dark?: boolean }) {
  const cls = dark ? "page-header-dark" : "page-header";
  const btnCls = dark ? "btn-icon-dark" : "map-btn";
  const titleColor = dark ? "#fff" : "var(--text-primary)";
  return (
    <div className={cls}>
      {onBack
        ? <button className={btnCls} onClick={onBack}>{Icons.back}</button>
        : <div style={{ width: 44 }} />}
      <span style={{ fontWeight: 700, fontSize: 17, color: titleColor }}>{title}</span>
      {right ?? <div style={{ width: 44 }} />}
    </div>
  );
}

// ── TicketCard ────────────────────────────────────────────────────────────────
export function TicketCard({
  from, to, price, distance, duration, status, date,
}: { from: string; to: string; price?: number; distance?: number; duration?: number; status?: string; date?: string }) {
  const statusColor: Record<string, string> = {
    COMPLETED: "var(--success)", CANCELLED: "var(--danger)",
    IN_PROGRESS: "var(--orange)", REQUESTED: "var(--teal)", DRIVER_ASSIGNED: "var(--teal)",
  };
  return (
    <div className="ticket-card shadow-md">
      <div className="ticket-top">
        <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
          {status && (
            <span className="badge" style={{
              background: `${statusColor[status] ?? "var(--teal)"}18`,
              color: statusColor[status] ?? "var(--teal)",
            }}>
              {status.replace("_", " ")}
            </span>
          )}
          {date && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{date}</span>}
        </div>
        <div className="flex gap-3 items-start">
          <div className="route-connector" style={{ paddingTop: 4 }}>
            <div className="route-dot-from" />
            <div className="route-line-v" style={{ minHeight: 24 }} />
            <div className="route-dot-to" />
          </div>
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }} className="truncate">{from}</div>
            <div style={{ fontWeight: 700, fontSize: 15 }} className="truncate">{to}</div>
          </div>
        </div>
      </div>
      <div className="ticket-divider">
        <div className="ticket-dot left" />
        <div className="ticket-divider-line" />
        <div className="ticket-dot right" />
      </div>
      <div className="ticket-bottom flex justify-between items-center">
        <div className="flex gap-4 text-xs text-muted">
          {distance && <span>{distance.toFixed(1)} km</span>}
          {duration && <span>~{Math.round(duration)} min</span>}
        </div>
        {price && (
          <span style={{ fontWeight: 700, fontSize: 18, color: "var(--orange)" }}>
            M {Number(price).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
