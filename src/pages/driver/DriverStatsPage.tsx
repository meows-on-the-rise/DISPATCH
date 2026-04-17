import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { userApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { PageHeader, StarRating } from "../../components/shared";

interface Stats {
  totalTrips: number; totalEarned: number; totalDistanceKm: number;
  recentReviews: Array<{ score: number; review?: string; giver: { fullName: string }; createdAt: string }>;
}

export default function DriverStatsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getStats().then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <PageHeader title="My Stats" onBack={() => navigate("/driver")} />
      <div className="scroll-area flex-1 px-4">
        <div className="card-elevated text-center page-enter" style={{ marginBottom: 20, padding: "28px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🚗</div>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 4 }}>{user?.fullName}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>ID: {user?.userId}</p>
          {user && <StarRating value={user.rating} count={user.reviewCount} />}
          {user?.driverProfile && (
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 8 }}>
              {user.driverProfile.vehicleMake} {user.driverProfile.vehicleModel} · {user.driverProfile.vehiclePlate}
            </p>
          )}
        </div>

        {loading && <div className="flex justify-center" style={{ padding: 32 }}><span className="spinner" /></div>}

        {!loading && stats && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { emoji: "🚕", label: "Trips Completed", value: stats.totalTrips, color: "var(--purple-light)" },
                { emoji: "💵", label: "Total Earned", value: `M ${Number(stats.totalEarned).toFixed(2)}`, color: "var(--teal)" },
                { emoji: "📍", label: "Distance Driven", value: `${Number(stats.totalDistanceKm).toFixed(0)} km`, color: "var(--warning)" },
                { emoji: "⭐", label: "Avg. Rating", value: user?.rating.toFixed(1) ?? "5.0", color: "#f5a623" },
              ].map(({ emoji, label, value, color }) => (
                <div key={label} className="card" style={{ padding: "20px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Recent reviews */}
            {stats.recentReviews.length > 0 && (
              <>
                <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 12 }}>Recent Reviews</h3>
                <div className="flex-col gap-3" style={{ paddingBottom: 24 }}>
                  {stats.recentReviews.map((r, i) => (
                    <div key={i} className="card" style={{ padding: "14px 16px" }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{r.giver.fullName}</span>
                        <span className="stars" style={{ fontSize: 14 }}>{"★".repeat(r.score)}{"☆".repeat(5 - r.score)}</span>
                      </div>
                      {r.review && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.review}</p>}
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        {new Date(r.createdAt).toLocaleDateString("en-LS", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
