import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { adminApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";
import { Icons, Avatar, StarRating } from "../../components/shared";

interface Doc {
  id: string; docType: string; status: string; fileUrl: string;
  driverProfile: { user: { fullName: string; userId: string; email: string } };
}
interface Stats {
  passengers: number; drivers: number; totalTrips: number;
  completedTrips: number; totalCommission: number;
}
interface Review {
  id: string; score: number; review?: string; createdAt: string;
  reviewer?: { fullName: string; avatarUrl?: string };
  reviewee?: { fullName: string; avatarUrl?: string };
  trip?: { pickupAddress: string; dropoffAddress: string };
}

// ── Schema viewer ─────────────────────────────────────────────────────────────

const SCHEMA_TABLES = [
  {
    name: "user",
    color: "#0d7a8a",
    description: "Core user accounts for all roles",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "userId", type: "string", note: "e.g. p2026XXXXX" },
      { name: "fullName", type: "string" },
      { name: "username", type: "string", unique: true },
      { name: "email", type: "string", unique: true },
      { name: "phone", type: "string", unique: true },
      { name: "password", type: "string", note: "bcrypt hashed" },
      { name: "dob", type: "datetime" },
      { name: "idNumber", type: "string", unique: true },
      { name: "role", type: "PASSENGER | DRIVER | ADMIN" },
      { name: "avatarUrl", type: "string?" },
      { name: "rating", type: "float", note: "default 5.0" },
      { name: "reviewCount", type: "int" },
      { name: "createdAt", type: "datetime" },
      { name: "updatedAt", type: "datetime" },
    ],
    relations: ["wallet (1:1)", "driver_profile (1:1)", "trip ×2 (1:N)", "rating ×2 (1:N)", "otp_token (1:N)", "refresh_token (1:N)"],
  },
  {
    name: "driver_profile",
    color: "#f97316",
    description: "Driver-specific data and vehicle info",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "userId", type: "uuid", fk: "user.id" },
      { name: "vehicleMake", type: "string?" },
      { name: "vehicleModel", type: "string?" },
      { name: "vehiclePlate", type: "string?" },
      { name: "vehicleColor", type: "string?" },
      { name: "isClockedIn", type: "boolean", note: "default false" },
      { name: "isVerified", type: "boolean", note: "set by admin" },
      { name: "currentLat", type: "float?" },
      { name: "currentLng", type: "float?" },
      { name: "updatedAt", type: "datetime" },
    ],
    relations: ["driver_document (1:N)"],
  },
  {
    name: "driver_document",
    color: "#1a9aaa",
    description: "LICENSE, PERMIT, REGISTRATION uploads",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "driverProfileId", type: "uuid", fk: "driver_profile.id" },
      { name: "docType", type: "LICENSE | PERMIT | REGISTRATION" },
      { name: "fileUrl", type: "string", note: "Cloudinary URL" },
      { name: "status", type: "PENDING | VERIFIED | REJECTED" },
      { name: "uploadedAt", type: "datetime" },
      { name: "reviewedAt", type: "datetime?" },
      { name: "reviewNote", type: "string?" },
    ],
    relations: [],
  },
  {
    name: "trip",
    color: "#16a34a",
    description: "Ride requests and their lifecycle",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "passengerId", type: "uuid", fk: "user.id" },
      { name: "driverId", type: "uuid?", fk: "user.id" },
      { name: "preferredDriverId", type: "uuid?", fk: "user.id", note: "passenger's chosen driver" },
      { name: "status", type: "REQUESTED | DRIVER_ASSIGNED | DRIVER_ARRIVED | IN_PROGRESS | COMPLETED | CANCELLED" },
      { name: "pickupAddress", type: "string" },
      { name: "pickupLat / pickupLng", type: "float" },
      { name: "dropoffAddress", type: "string" },
      { name: "dropoffLat / dropoffLng", type: "float" },
      { name: "seats", type: "int", note: "default 1" },
      { name: "distanceKm", type: "float?" },
      { name: "durationMin", type: "float?" },
      { name: "totalPrice", type: "decimal?" },
      { name: "driverEarning", type: "decimal?", note: "80%" },
      { name: "systemCommission", type: "decimal?", note: "20%" },
      { name: "cancelledBy", type: "string?" },
      { name: "cancelReason", type: "string?" },
      { name: "cancelledAt / startedAt / completedAt", type: "datetime?" },
      { name: "createdAt / updatedAt", type: "datetime" },
    ],
    relations: ["trip_location (1:N)", "rating (1:N)"],
  },
  {
    name: "wallet",
    color: "#7c3aed",
    description: "Dispatch Cash balance per user",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "userId", type: "uuid", fk: "user.id" },
      { name: "balance", type: "decimal", note: "default 0.00" },
      { name: "updatedAt", type: "datetime" },
    ],
    relations: ["wallet_transaction (1:N)"],
  },
  {
    name: "wallet_transaction",
    color: "#9d4edd",
    description: "All money movements",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "walletId", type: "uuid", fk: "wallet.id" },
      { name: "type", type: "DEPOSIT | WITHDRAWAL | TRIP_PAYMENT | TRIP_EARNING | REFUND" },
      { name: "amount", type: "decimal" },
      { name: "description", type: "string?" },
      { name: "tripId", type: "string?" },
      { name: "createdAt", type: "datetime" },
    ],
    relations: [],
  },
  {
    name: "rating",
    color: "#d97706",
    description: "Post-trip ratings between users",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "tripId", type: "uuid", fk: "trip.id" },
      { name: "giverId", type: "uuid", fk: "user.id" },
      { name: "receiverId", type: "uuid", fk: "user.id" },
      { name: "score", type: "int", note: "1–5" },
      { name: "review", type: "string?" },
      { name: "createdAt", type: "datetime" },
    ],
    relations: [],
  },
  {
    name: "trip_location",
    color: "#0891b2",
    description: "GPS breadcrumbs recorded during IN_PROGRESS trips",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "tripId", type: "uuid", fk: "trip.id" },
      { name: "lat / lng", type: "float" },
      { name: "recordedAt", type: "datetime" },
    ],
    relations: [],
  },
  {
    name: "otp_token",
    color: "#dc2626",
    description: "One-time passwords for password reset",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "userId", type: "uuid", fk: "user.id" },
      { name: "token", type: "string" },
      { name: "expiresAt", type: "datetime" },
      { name: "used", type: "boolean" },
      { name: "createdAt", type: "datetime" },
    ],
    relations: [],
  },
  {
    name: "refresh_token",
    color: "#be185d",
    description: "JWT refresh token store",
    fields: [
      { name: "id", type: "uuid", pk: true },
      { name: "userId", type: "uuid", fk: "user.id" },
      { name: "token", type: "string", unique: true },
      { name: "expiresAt", type: "datetime" },
      { name: "createdAt", type: "datetime" },
    ],
    relations: [],
  },
];

function SchemaView() {
  const [expanded, setExpanded] = useState<string | null>("user");

  return (
    <div className="flex-col gap-3">
      {/* System flow summary */}
      <div className="card" style={{ padding: "16px 18px", marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "var(--teal)" }}>
          System Flow
        </div>
        {[
          { step: "1", label: "Register", desc: "User signs up → user row created, wallet created automatically" },
          { step: "2", label: "Driver Setup", desc: "Driver uploads 3 docs → admin verifies → driver_profile.isVerified = true" },
          { step: "3", label: "Ride Request", desc: "Passenger picks driver (optional) → trip created with REQUESTED status" },
          { step: "4", label: "Driver Accepts", desc: "Driver accepts → trip.status = DRIVER_ASSIGNED, passenger notified via socket" },
          { step: "5", label: "Trip Progress", desc: "DRIVER_ARRIVED → IN_PROGRESS → COMPLETED, GPS logged in trip_location" },
          { step: "6", label: "Payment", desc: "On complete: passenger wallet debited, driver wallet credited (80/20 split)" },
          { step: "7", label: "Rating", desc: "Both parties rate each other → rating row created, user.rating recalculated" },
        ].map(({ step, label, desc }) => (
          <div key={step} className="flex gap-3 items-start" style={{ marginBottom: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", background: "var(--teal)",
              color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{step}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-secondary)", marginBottom: 4 }}>
        Database Tables ({SCHEMA_TABLES.length})
      </div>

      {SCHEMA_TABLES.map(table => (
        <div key={table.name} className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Table header */}
          <button
            onClick={() => setExpanded(expanded === table.name ? null : table.name)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
              textAlign: "left", fontFamily: "var(--font)",
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: table.color, flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "monospace", color: table.color }}>
                {table.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{table.description}</div>
            </div>
            <span style={{
              color: "var(--text-muted)", fontSize: 11,
              transform: expanded === table.name ? "rotate(180deg)" : "none",
              transition: "transform 200ms", display: "inline-flex",
            }}>
              {Icons.chevronDown}
            </span>
          </button>

          {/* Expanded fields */}
          {expanded === table.name && (
            <div className="fade-in" style={{ borderTop: "1px solid var(--border-light)", padding: "0 0 12px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface)" }}>
                    {["Field", "Type", "Note"].map(h => (
                      <th key={h} style={{
                        padding: "8px 16px", textAlign: "left", fontSize: 10,
                        fontWeight: 700, color: "var(--text-muted)",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.fields.map((f, i) => (
                    <tr key={f.name} style={{ background: i % 2 === 0 ? "var(--bg-white)" : "var(--bg-surface)" }}>
                      <td style={{ padding: "7px 16px", fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: f.pk ? table.color : "var(--text-primary)" }}>
                        {f.pk && <span style={{ fontSize: 9, background: table.color, color: "#fff", borderRadius: 3, padding: "1px 4px", marginRight: 5 }}>PK</span>}
                        {(f as any).fk && <span style={{ fontSize: 9, background: "var(--teal-dim)", color: "var(--teal)", borderRadius: 3, padding: "1px 4px", marginRight: 5 }}>FK</span>}
                        {(f as any).unique && <span style={{ fontSize: 9, background: "rgba(249,115,22,0.1)", color: "var(--orange)", borderRadius: 3, padding: "1px 4px", marginRight: 5 }}>UQ</span>}
                        {f.name}
                      </td>
                      <td style={{ padding: "7px 16px", fontSize: 11, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                        {f.type}
                      </td>
                      <td style={{ padding: "7px 16px", fontSize: 11, color: "var(--text-muted)" }}>
                        {(f as any).fk ? `→ ${(f as any).fk}` : (f as any).note ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {table.relations.length > 0 && (
                <div style={{ padding: "10px 16px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Relations:</span>
                  {table.relations.map(r => (
                    <span key={r} style={{
                      fontSize: 11, background: "var(--teal-dim)", color: "var(--teal)",
                      borderRadius: "var(--r-pill)", padding: "2px 8px", fontFamily: "monospace",
                    }}>{r}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState<"docs" | "stats" | "reviews" | "schema">("docs");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([adminApi.getPendingDocs(), adminApi.getStats()])
      .then(([d, s]) => { setDocs(d.data); setStats(s.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "reviews" || reviews.length > 0) return;
    setReviewsLoading(true);
    adminApi.getReviews()
      .then(({ data }) => {
        const mapped: Review[] = data.map((r: any) => ({
          id: r.id,
          score: r.score,
          review: r.review,
          createdAt: r.createdAt,
          reviewer: r.giver,
          reviewee: r.receiver,
          trip: r.trip,
        }));
        setReviews(mapped);
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [tab]);

  async function reviewDoc(id: string, status: "VERIFIED" | "REJECTED", note?: string) {
    try {
      await adminApi.reviewDoc(id, status, note);
      setDocs(d => d.filter(x => x.id !== id));
      toast(`Document ${status.toLowerCase()}`, status === "VERIFIED" ? "success" : "error");
    } catch { toast("Action failed", "error"); }
  }

  const shortcuts = [
    { icon: Icons.user,     label: "Users",   sublabel: stats ? `${stats.passengers + stats.drivers} total` : "Manage", color: "var(--teal)",    path: "/admin/users" },
    { icon: Icons.car,      label: "Trips",   sublabel: stats ? `${stats.totalTrips} total` : "Manage",                  color: "var(--orange)",  path: "/admin/trips" },
    { icon: Icons.document, label: "Reports", sublabel: "4 report types",                                                 color: "var(--success)", path: "/admin/reports" },
  ];

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 24 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Administrator</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#fff" }}>{user?.fullName}</div>
          </div>
          <button onClick={() => { logout(); navigate("/", { replace: true }); }} style={{
            background: "rgba(239,68,68,0.2)", border: "none", borderRadius: "var(--r-md)",
            padding: "8px 14px", cursor: "pointer", color: "#fff", fontSize: 13,
            fontWeight: 600, display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font)",
          }}>
            {Icons.logout} Sign out
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {shortcuts.map(({ icon, label, sublabel, color, path }) => (
            <button key={label} onClick={() => navigate(path)} style={{
              background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)",
              borderRadius: "var(--r-lg)", padding: "14px 10px",
              cursor: "pointer", fontFamily: "var(--font)", textAlign: "center",
              color: "#fff", transition: "var(--t)",
            }}>
              <div style={{ color, display: "flex", justifyContent: "center", marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{sublabel}</div>
            </button>
          ))}
        </div>

        <div className="tab-switch" style={{ overflowX: "auto", scrollbarWidth: "none" }}>
          {(["docs", "stats", "reviews", "schema"] as const).map(t => (
            <button key={t} className={`tab-switch-item ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}>
              {t === "docs"
                ? `Docs${docs.length > 0 ? ` (${docs.length})` : ""}`
                : t === "stats" ? "Stats"
                : t === "reviews" ? "Reviews"
                : "System Flow"}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 20, paddingBottom: 32 }}>
        {loading && tab !== "schema" && (
          <div className="flex justify-center" style={{ padding: 32 }}><span className="spinner" /></div>
        )}

        {/* ── Pending documents ── */}
        {!loading && tab === "docs" && (
          <div className="flex-col gap-3">
            {docs.length === 0 ? (
              <div className="card text-center" style={{ padding: 48 }}>
                <div style={{ color: "var(--success)", display: "flex", justifyContent: "center", marginBottom: 12 }}>{Icons.check}</div>
                <div style={{ fontWeight: 600 }}>All caught up!</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>No pending documents</div>
              </div>
            ) : docs.map(doc => (
              <div key={doc.id} className="card" style={{ padding: 18 }}>
                <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{doc.driverProfile.user.fullName}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {doc.driverProfile.user.userId} · {doc.driverProfile.user.email}
                    </div>
                  </div>
                  <span className="badge badge-orange">{doc.docType}</span>
                </div>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: "block", height: 120, borderRadius: "var(--r-md)",
                  background: "var(--bg-input)", overflow: "hidden", marginBottom: 14,
                  border: "1.5px solid var(--border)",
                }}>
                  {doc.fileUrl.match(/\.(jpg|jpeg|png|webp)/i)
                    ? <img src={doc.fileUrl} alt={doc.docType} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div className="flex-col items-center justify-center" style={{ height: "100%", gap: 8, display: "flex" }}>
                        <span style={{ color: "var(--teal)" }}>{Icons.document}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>View PDF</span>
                      </div>
                  }
                </a>
                <div className="flex gap-2">
                  <button className="btn btn-primary" style={{ flex: 1, background: "var(--success)", boxShadow: "none" }}
                    onClick={() => reviewDoc(doc.id, "VERIFIED")}>Verify</button>
                  <button className="btn btn-outline" style={{ flex: 1, borderColor: "var(--danger)", color: "var(--danger)" }}
                    onClick={() => { const n = prompt("Rejection reason:") ?? undefined; reviewDoc(doc.id, "REJECTED", n); }}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Stats ── */}
        {!loading && tab === "stats" && stats && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {[
                { icon: Icons.user,     label: "Passengers",  value: stats.passengers,    color: "var(--teal)" },
                { icon: Icons.car,      label: "Drivers",     value: stats.drivers,        color: "var(--orange)" },
                { icon: Icons.activity, label: "Total Trips", value: stats.totalTrips,     color: "var(--teal-mid)" },
                { icon: Icons.check,    label: "Completed",   value: stats.completedTrips, color: "var(--success)" },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="card" style={{ padding: "18px 16px", textAlign: "center" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "var(--r-md)",
                    background: `${color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color, margin: "0 auto 10px",
                  }}>{icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 22, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-secondary)", marginBottom: 4 }}>
                Platform Commission
              </div>
              <div style={{ fontWeight: 800, fontSize: 36, color: "var(--orange)" }}>
                M {Number(stats.totalCommission).toFixed(2)}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Total earned (20% of all trips)</div>
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        {!loading && tab === "reviews" && (
          <div className="flex-col gap-3">
            {reviewsLoading && (
              <div className="flex justify-center" style={{ padding: 32 }}><span className="spinner" /></div>
            )}
            {!reviewsLoading && reviews.length === 0 && (
              <div className="card text-center" style={{ padding: 48 }}>
                <div style={{ color: "var(--teal)", display: "flex", justifyContent: "center", marginBottom: 12 }}>{Icons.star}</div>
                <div style={{ fontWeight: 600 }}>No reviews yet</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  Reviews appear here once passengers rate completed trips
                </div>
              </div>
            )}
            {!reviewsLoading && reviews.map(r => (
              <div key={r.id} className="card" style={{ padding: "16px 18px" }}>
                <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
                  <Avatar src={r.reviewer?.avatarUrl} name={r.reviewer?.fullName ?? "?"} size={40} />
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">{r.reviewer?.fullName ?? "Passenger"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>→ {r.reviewee?.fullName ?? "Driver"}</div>
                  </div>
                  <StarRating value={r.score} />
                </div>
                {r.review && (
                  <p style={{
                    fontSize: 13, color: "var(--text-secondary)", margin: 0,
                    paddingTop: 10, borderTop: "1px solid var(--border-light)", lineHeight: 1.5,
                  }}>
                    "{r.review}"
                  </p>
                )}
                {r.trip && (
                  <div style={{
                    marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-light)",
                    fontSize: 11, color: "var(--text-muted)",
                  }}>
                    {r.trip.pickupAddress} → {r.trip.dropoffAddress}
                  </div>
                )}
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                  {new Date(r.createdAt).toLocaleDateString("en-LS", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Schema ── */}
        {tab === "schema" && <SchemaView />}
      </div>
    </div>
  );
}
