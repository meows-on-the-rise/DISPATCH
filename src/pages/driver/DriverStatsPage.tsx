import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { userApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { Icons, PageHeader, StarRating } from "../../components/shared";

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
          <div style={{ color: "var(--teal)", display: "flex", justifyContent: "center", marginBottom: 8 }}>
            {Icons.car}
          </div>
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
                { icon: Icons.car,      label: "Trips Completed", value: stats.totalTrips,                            color: "var(--teal)" },
                { icon: Icons.wallet,   label: "Total Earned",    value: `M ${Number(stats.totalEarned).toFixed(2)}`, color: "var(--orange)" },
                { icon: Icons.location, label: "Distance Driven", value: `${Number(stats.totalDistanceKm).toFixed(0)} km`, color: "var(--teal-mid)" },
                { icon: Icons.star,     label: "Avg. Rating",     value: user?.rating.toFixed(1) ?? "5.0",            color: "var(--success)" },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="card" style={{ padding: "20px 16px", textAlign: "center" }}>
                  <div style={{ color, display: "flex", justifyContent: "center", marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
