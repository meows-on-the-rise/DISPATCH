import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../../store/authStore";
import { useSocket } from "../../hooks/useSocket";
import { Avatar, BalanceBadge, IconBtn, StarRating } from "../../components/shared";

export default function PassengerDashboard() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuthStore();
  useSocket(); // establishes connection

  useEffect(() => { refreshUser(); }, []);

  const balance = Number(user?.wallet?.balance ?? 0);

  const icons = [
    {
      emoji: "💳",
      label: "Wallet",
      path: "/passenger/wallet",
      disabled: false,
    },
    {
      emoji: "📋",
      label: "Activity",
      path: "/passenger/activity",
      disabled: false,
    },
    {
      emoji: "📊",
      label: "My Stats",
      path: "/passenger/stats",
      disabled: false,
    },
    {
      emoji: "🚕",
      label: "Request Ride",
      path: "/passenger/request",
      disabled: balance <= 0,
    },
  ];

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="nav-header">
        {/* Avatar → Edit Profile */}
        <button
          onClick={() => navigate("/passenger/profile")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
        >
          <Avatar src={user?.avatarUrl} name={user?.fullName ?? "?"} size={46} />
          <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>Profile</span>
        </button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>
            DISPATCH
          </div>
          {user && <StarRating value={user.rating} count={user.reviewCount} />}
        </div>

        <BalanceBadge amount={balance} />
      </div>

      {/* Greeting */}
      <div className="px-4" style={{ paddingTop: 4, paddingBottom: 20 }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Good to see you,</p>
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 2 }}>
          {user?.fullName?.split(" ")[0] ?? "Rider"} 👋
        </h2>
      </div>

      {/* Icon grid */}
      <div className="px-4 flex-1">
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}>
          {icons.map(({ emoji, label, path, disabled }) => (
            <IconBtn
              key={label}
              icon={<span style={{ fontSize: 24 }}>{emoji}</span>}
              label={label}
              onClick={() => !disabled && navigate(path)}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Quick stats strip */}
        <div className="card flex gap-3" style={{ padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--teal)" }}>
              M {balance.toFixed(2)}
            </div>
            <div className="text-xs text-muted">Dispatch Cash</div>
          </div>
          <div style={{ width: 1, background: "var(--border-subtle)" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--purple-light)" }}>
              {user?.reviewCount ?? 0}
            </div>
            <div className="text-xs text-muted">Trips Taken</div>
          </div>
          <div style={{ width: 1, background: "var(--border-subtle)" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--warning)" }}>
              {user?.rating?.toFixed(1) ?? "5.0"}
            </div>
            <div className="text-xs text-muted">Rating</div>
          </div>
        </div>

        {/* Book a ride CTA */}
        <button
          className="btn btn-primary"
          onClick={() => navigate("/passenger/request")}
          disabled={balance <= 0}
          style={{ marginBottom: 12 }}
        >
          {balance <= 0 ? "⚠️ Top up to request a ride" : "🚕  Request a Ride"}
        </button>
        {balance <= 0 && (
          <button className="btn btn-ghost" onClick={() => navigate("/passenger/wallet")}>
            Top Up Wallet
          </button>
        )}
      </div>

      {/* Logout */}
      <div className="px-4" style={{ paddingBottom: 24 }}>
        <button
          onClick={() => { logout(); navigate("/"); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 13, width: "100%", padding: "8px 0" }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
