import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { adminApi, userApi } from "../../api/client";
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

export default function AdminPanel() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState<"docs" | "stats" | "reviews">("docs");
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
    // Fetch reviews for all users — we use getUsers then aggregate
    // Fall back to fetching trips which include ratings
    adminApi.getTrips("", "COMPLETED")
      .then(({ data }) => {
        // Extract ratings embedded in trips
        const extracted: Review[] = [];
        for (const trip of data) {
          if (trip.rating != null) {
            extracted.push({
              id: trip.id,
              score: trip.rating,
              review: trip.ratingReview,
              createdAt: trip.updatedAt ?? trip.createdAt,
              reviewer: trip.passenger,
              reviewee: trip.driver,
              trip: { pickupAddress: trip.pickupAddress, dropoffAddress: trip.dropoffAddress },
            });
          }
        }
        setReviews(extracted);
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
          <button onClick={() => { logout(); navigate("/", { replace: true, state: {} }); }} style={{
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

        <div className="tab-switch">
          {(["docs", "stats", "reviews"] as const).map(t => (
            <button key={t} className={`tab-switch-item ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}>
              {t === "docs"
                ? `Docs${docs.length > 0 ? ` (${docs.length})` : ""}`
                : t === "stats" ? "Stats" : "Reviews"}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 20, paddingBottom: 32 }}>
        {loading && <div className="flex justify-center" style={{ padding: 32 }}><span className="spinner" /></div>}

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
                { icon: Icons.user,     label: "Passengers",  value: stats.passengers,     color: "var(--teal)" },
                { icon: Icons.car,      label: "Drivers",     value: stats.drivers,         color: "var(--orange)" },
                { icon: Icons.activity, label: "Total Trips", value: stats.totalTrips,      color: "var(--teal-mid)" },
                { icon: Icons.check,    label: "Completed",   value: stats.completedTrips,  color: "var(--success)" },
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
                  <div className="flex-1">
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.reviewer?.fullName ?? "Passenger"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      → {r.reviewee?.fullName ?? "Driver"}
                    </div>
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
      </div>
    </div>
  );
}
