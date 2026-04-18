import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { userApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { Icons, Avatar, StarRating } from "../../components/shared";

interface PassengerStats { totalTrips: number; totalSpent: number; uniqueDrivers: number; }
interface DriverStats {
  totalTrips: number; totalEarned: number; totalDistanceKm: number;
  recentReviews: Array<{ score: number; review?: string; giver: { fullName: string }; createdAt: string }>;
}

export default function StatsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isDriver = user?.role === "DRIVER";
  const [stats, setStats] = useState<PassengerStats | DriverStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getStats().then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  const backPath = isDriver ? "/driver" : "/passenger";

  const passengerCards = stats && !isDriver ? [
    { icon: Icons.car,      label: "Trips Taken",       value: (stats as PassengerStats).totalTrips, color: "var(--teal)" },
    { icon: Icons.wallet,   label: "Total Spent",        value: `M ${Number((stats as PassengerStats).totalSpent).toFixed(2)}`, color: "var(--danger)" },
    { icon: Icons.user,     label: "Drivers Ridden With",value: (stats as PassengerStats).uniqueDrivers, color: "var(--orange)" },
    ...(((stats as PassengerStats).totalTrips > 0) ? [{
      icon: Icons.stats, label: "Avg per Trip",
      value: `M ${(Number((stats as PassengerStats).totalSpent) / (stats as PassengerStats).totalTrips).toFixed(2)}`,
      color: "var(--teal-mid)",
    }] : []),
  ] : [];

  const driverCards = stats && isDriver ? [
    { icon: Icons.car,      label: "Trips Completed",  value: (stats as DriverStats).totalTrips,     color: "var(--teal)" },
    { icon: Icons.wallet,   label: "Total Earned",      value: `M ${Number((stats as DriverStats).totalEarned).toFixed(2)}`,  color: "var(--success)" },
    { icon: Icons.location, label: "Distance Driven",   value: `${Number((stats as DriverStats).totalDistanceKm).toFixed(0)} km`, color: "var(--orange)" },
    { icon: Icons.star,     label: "Rating",            value: user?.rating?.toFixed(1) ?? "5.0",     color: "#f97316" },
  ] : [];

  const cards = isDriver ? driverCards : passengerCards;

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 32 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
          <button className="btn-icon-dark" onClick={() => navigate(backPath)}>{Icons.back}</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>My Stats</span>
        </div>
        {/* Profile summary */}
        <div className="flex items-center gap-4">
          <Avatar src={user?.avatarUrl} name={user?.fullName ?? "?"} size={56} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>{user?.fullName}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{user?.userId}</div>
            {user && <StarRating value={user.rating} count={user.reviewCount} />}
          </div>
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 24, paddingBottom: 32 }}>
        {loading && <div className="flex justify-center" style={{ padding: 32 }}><span className="spinner" /></div>}

        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            {cards.map(({ icon, label, value, color }) => (
              <div key={label} className="card" style={{ padding: "20px 16px", textAlign: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "var(--r-md)",
                  background: `${color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color, margin: "0 auto 10px",
                }}>{icon}</div>
                <div style={{ fontWeight: 800, fontSize: 20, color }}>{value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Driver reviews */}
        {isDriver && stats && (stats as DriverStats).recentReviews?.length > 0 && (
          <>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Recent Reviews</div>
            <div className="flex-col gap-3">
              {(stats as DriverStats).recentReviews.map((r, i) => (
                <div key={i} className="card" style={{ padding: "14px 16px" }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.giver.fullName}</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ color: s <= r.score ? "var(--orange)" : "var(--border)", fontSize: 13 }}>
                          {Icons.star}
                        </span>
                      ))}
                    </div>
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
      </div>
    </div>
  );
}
