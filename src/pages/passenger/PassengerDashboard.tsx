import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../store/authStore";
import { useSocket } from "../../hooks/useSocket";
import { Avatar, BalanceBadge, IconBtn, Icons, StarRating, TicketCard } from "../../components/shared";
import { useTripStore } from "../../store/tripStore";
import { tripApi } from "../../api/client";

export default function PassengerDashboard() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuthStore();
  const { availableTrips, setAvailableTrips } = useTripStore();
  useSocket();

  useEffect(() => {
    refreshUser();
    tripApi.getHistory().then(({ data }) => setAvailableTrips(data)).catch(() => {});
  }, []);

  const balance = Number(user?.wallet?.balance ?? 0);
  const recentTrips = availableTrips.slice(0, 3);

  const icons = [
    { icon: Icons.wallet,   label: "Wallet",      path: "/passenger/wallet",   disabled: false },
    { icon: Icons.activity, label: "Activity",    path: "/passenger/activity", disabled: false },
    { icon: Icons.stats,    label: "Stats",       path: "/passenger/stats",    disabled: false },
  ];

  return (
    <div className="app-shell">
      {/* Dark teal header — "Find your ride" */}
      <div className="header-dark" style={{ paddingBottom: 32 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <button onClick={() => navigate("/passenger/profile")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar src={user?.avatarUrl} name={user?.fullName ?? "?"} size={40} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Good day,</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{user?.fullName?.split(" ")[0]}</div>
            </div>
          </button>
          <BalanceBadge amount={balance} />
        </div>

        <h2 style={{ color: "#fff", marginBottom: 4 }}>Where to?</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 20 }}>Be on your way in a jiffy!</p>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 26, paddingBottom: 26 }}>
        {/* Icon grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 28 }}>
          {icons.map(({ icon, label, path, disabled }) => (
            <IconBtn key={label} icon={icon} label={label}
              onClick={() => !disabled && navigate(path)} disabled={disabled} />
          ))}
        </div>

        {/* Stats strip */}
        <div className="card flex gap-3" style={{ padding: "16px 20px", marginBottom: 24 }}>
          {[
            { label: "Trips",    value: user?.reviewCount ?? 0,   color: "var(--teal)" },
            { label: "Rating",   value: user?.rating?.toFixed(1) ?? "5.0", color: "var(--teal-mid)" },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div style={{ width: 1, background: "var(--border-light)" }} />}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* CTA */}
        <button className="btn btn-primary" onClick={() => navigate("/passenger/request")}
          style={{ marginBottom: 12 }}>
          Request a Ride
        </button>
        {balance <= 0 && (
          <button className="btn btn-outline" onClick={() => navigate("/passenger/wallet")}>
            Top Up Wallet
          </button>
        )}

        {/* Recent trips */}
        {recentTrips.length > 0 && (
          <>
            <div className="flex justify-between items-center" style={{ margin: "24px 0 12px" }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Recent Trips</span>
              <span style={{ fontSize: 13, color: "var(--orange)", fontWeight: 600, cursor: "pointer" }}
                onClick={() => navigate("/passenger/activity")}>See all</span>
            </div>
            <div className="flex-col gap-3">
              {recentTrips.map(t => (
                <TicketCard key={t.id}
                  from={t.pickupAddress} to={t.dropoffAddress}
                  price={t.totalPrice ? Number(t.totalPrice) : undefined}
                  distance={t.distanceKm} duration={t.durationMin}
                  status={t.status}
                  date={new Date(t.createdAt).toLocaleDateString("en-LS", { day: "numeric", month: "short" })} />
              ))}
            </div>
          </>
        )}

        <button onClick={() => { logout(); navigate("/"); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
            fontSize: 13, width: "100%", padding: "16px 0", marginTop: 8, display: "flex",
            alignItems: "center", justifyContent: "center", gap: 8 }}>
          {Icons.logout} Sign out
        </button>
      </div>
    </div>
  );
}
