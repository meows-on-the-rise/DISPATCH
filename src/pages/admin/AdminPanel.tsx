import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { adminApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";
import { PageHeader } from "../../components/shared";

interface Doc {
  id: string; docType: string; status: string; fileUrl: string;
  driverProfile: { user: { fullName: string; userId: string; email: string } };
}
interface Stats { passengers: number; drivers: number; totalTrips: number; completedTrips: number; totalCommission: number; }

export default function AdminPanel() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState<"docs" | "stats">("docs");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [docsRes, statsRes] = await Promise.all([adminApi.getPendingDocs(), adminApi.getStats()]);
        setDocs(docsRes.data);
        setStats(statsRes.data);
      } finally { setLoading(false); }
    })();
  }, []);

  async function reviewDoc(id: string, status: "VERIFIED" | "REJECTED", note?: string) {
    try {
      await adminApi.reviewDoc(id, status, note);
      setDocs((d) => d.filter((x) => x.id !== id));
      toast(`Document ${status.toLowerCase()}`, status === "VERIFIED" ? "success" : "error");
    } catch { toast("Action failed", "error"); }
  }

  return (
    <div className="app-shell">
      <PageHeader
        title="Admin Panel"
        right={
          <button onClick={() => { logout(); navigate("/"); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 13 }}>
            Sign out
          </button>
        }
      />

      <div style={{ padding: "0 16px 12px" }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Welcome, {user?.fullName}</p>
      </div>

      {/* Tabs */}
      <div className="flex px-4" style={{ gap: 0, marginBottom: 16 }}>
        {(["docs", "stats"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "10px 0", background: "none", border: "none",
            borderBottom: `2px solid ${tab === t ? "var(--purple)" : "var(--border-subtle)"}`,
            color: tab === t ? "var(--purple-light)" : "var(--text-muted)",
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>
            {t === "docs" ? `📄 Pending Docs ${docs.length > 0 ? `(${docs.length})` : ""}` : "📊 Stats"}
          </button>
        ))}
      </div>

      <div className="scroll-area flex-1 px-4">
        {loading && <div className="flex justify-center" style={{ padding: 32 }}><span className="spinner" /></div>}

        {/* Pending documents */}
        {!loading && tab === "docs" && (
          <div className="flex-col gap-3" style={{ paddingBottom: 24 }}>
            {docs.length === 0 && (
              <p className="text-center text-muted" style={{ padding: 32, fontSize: 14 }}>
                ✅ No pending documents
              </p>
            )}
            {docs.map((doc) => (
              <div key={doc.id} className="card-elevated" style={{ padding: 16 }}>
                <div className="flex justify-between items-start" style={{ marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
                      {doc.driverProfile.user.fullName}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {doc.driverProfile.user.userId} · {doc.driverProfile.user.email}
                    </div>
                  </div>
                  <span className="badge badge-warn">{doc.docType}</span>
                </div>

                {/* Doc preview */}
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: "block", height: 120, borderRadius: "var(--r-md)",
                  background: "var(--bg-base)", overflow: "hidden", marginBottom: 12,
                  border: "1px solid var(--border)",
                }}>
                  {doc.fileUrl.match(/\.(jpg|jpeg|png|webp)/i) ? (
                    <img src={doc.fileUrl} alt={doc.docType} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div className="flex-col items-center justify-center" style={{ height: "100%", gap: 8 }}>
                      <span style={{ fontSize: 32 }}>📄</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>View PDF</span>
                    </div>
                  )}
                </a>

                <div className="flex gap-2">
                  <button className="btn btn-teal" style={{ flex: 1 }}
                    onClick={() => reviewDoc(doc.id, "VERIFIED")}>
                    ✓ Verify
                  </button>
                  <button className="btn btn-ghost" style={{ flex: 1, color: "var(--danger)", borderColor: "var(--danger)" }}
                    onClick={() => {
                      const note = prompt("Rejection reason (optional):") ?? undefined;
                      reviewDoc(doc.id, "REJECTED", note);
                    }}>
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && tab === "stats" && stats && (
          <div style={{ paddingBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { emoji: "🧍", label: "Passengers",    value: stats.passengers,    color: "var(--purple-light)" },
                { emoji: "🚗", label: "Drivers",       value: stats.drivers,       color: "var(--teal)" },
                { emoji: "🚕", label: "Total Trips",   value: stats.totalTrips,    color: "var(--warning)" },
                { emoji: "✅", label: "Completed",     value: stats.completedTrips, color: "var(--teal)" },
              ].map(({ emoji, label, value, color }) => (
                <div key={label} className="card" style={{ padding: "20px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
                </div>
              ))}
              <div className="card" style={{ gridColumn: "1 / -1", padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--teal)" }}>
                  M {Number(stats.totalCommission).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Platform Commission Earned</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
