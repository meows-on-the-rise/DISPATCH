import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { userApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { PageHeader, StarRating } from "../../components/shared";

interface Stats { totalTrips: number; totalSpent: number; uniqueDrivers: number; }

export default function PassengerStatsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getStats().then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { emoji: "🚕", label: "Trips Taken",          value: stats.totalTrips,                  color: "var(--purple-light)" },
        { emoji: "💸", label: "Money Spent",           value: `M ${Number(stats.totalSpent).toFixed(2)}`, color: "var(--danger)" },
        { emoji: "🧑‍✈️", label: "Drivers Ridden With", value: stats.uniqueDrivers,                color: "var(--teal)" },
      ]
    : [];

  return (
    <div className="app-shell">
      <PageHeader title="My Stats" onBack={() => navigate("/passenger")} />

      <div className="scroll-area flex-1 px-4">
        {/* Profile summary */}
        <div className="card-elevated text-center page-enter" style={{ marginBottom: 20, padding: "28px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {user?.avatarUrl ? <img src={user.avatarUrl} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--purple)" }} alt="" /> : "👤"}
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 4 }}>{user?.fullName}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>ID: {user?.userId}</p>
          {user && <StarRating value={user.rating} count={user.reviewCount} />}
        </div>

        {loading && <div className="flex justify-center" style={{ padding: 32 }}><span className="spinner" /></div>}

        {/* Stat cards */}
        {!loading && stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {cards.map(({ emoji, label, value, color }) => (
              <div key={label} className="card" style={{ padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color }}>{value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
            {/* Full-width avg spend card */}
            {stats.totalTrips > 0 && (
              <div className="card" style={{ gridColumn: "1 / -1", padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--warning)" }}>
                  M {(Number(stats.totalSpent) / stats.totalTrips).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Average per Trip</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
