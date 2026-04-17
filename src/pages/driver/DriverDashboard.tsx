import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { driverApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useSocket } from "../../hooks/useSocket";
import { useToast } from "../../lib/toast";
import { Avatar, BalanceBadge, IconBtn, StarRating, Toggle } from "../../components/shared";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser, logout } = useAuthStore();
  useSocket();

  useEffect(() => { refreshUser(); }, []);

  const profile = user?.driverProfile;
  const balance = Number(user?.wallet?.balance ?? 0);
  const isClockedIn = profile?.isClockedIn ?? false;
  const isVerified = profile?.isVerified ?? false;

  const allDocsVerified = (profile?.documents?.filter((d) => d.status === "VERIFIED").length ?? 0) >= 3;

  async function handleClock(val: boolean) {
    if (val && !allDocsVerified) {
      toast("Upload and get all 3 documents verified before clocking in", "error");
      navigate("/driver/documents");
      return;
    }
    try {
      await driverApi.toggleClock();
      await refreshUser();
      toast(val ? "Clocked in — find passengers!" : "Clocked out", val ? "success" : "info");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed";
      toast(msg, "error");
    }
  }

  const icons = [
    { emoji: "💳", label: "Withdraw",    path: "/driver/wallet",    disabled: false },
    { emoji: "📋", label: "Activity",    path: "/driver/activity",  disabled: false },
    { emoji: "📊", label: "My Stats",    path: "/driver/stats",     disabled: false },
    { emoji: "📄", label: "Documents",   path: "/driver/documents", disabled: false },
    ...(isClockedIn
      ? [{ emoji: "🔍", label: "Find Passengers", path: "/driver/find", disabled: false }]
      : []),
  ];

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="nav-header">
        <button
          onClick={() => navigate("/driver/profile")}
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

        {/* Clock toggle + balance stacked */}
        <div className="flex-col items-center gap-2">
          <Toggle
            checked={isClockedIn}
            onChange={handleClock}
            label={isClockedIn ? "Online" : "Offline"}
          />
          <BalanceBadge amount={balance} />
        </div>
      </div>

      {/* Verification warning */}
      {!isVerified && (
        <div style={{
          margin: "0 16px 12px",
          background: "rgba(245,166,35,0.1)", border: "1px solid var(--warning)",
          borderRadius: "var(--r-md)", padding: "12px 16px",
          fontSize: 13, color: "var(--warning)",
        }}>
          ⚠️ Your account is pending document verification.{" "}
          <span style={{ fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/driver/documents")}>
            Upload documents →
          </span>
        </div>
      )}

      {/* Greeting */}
      <div className="px-4" style={{ paddingTop: 4, paddingBottom: 20 }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Ready to drive,</p>
        <h2 style={{ fontFamily: "var(--font-display)", marginTop: 2 }}>
          {user?.fullName?.split(" ")[0] ?? "Driver"} 🚗
        </h2>
      </div>

      {/* Icon grid */}
      <div className="px-4 flex-1">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {icons.map(({ emoji, label, path, disabled }) => (
            <IconBtn key={label} icon={<span style={{ fontSize: 24 }}>{emoji}</span>}
              label={label} onClick={() => navigate(path)} disabled={disabled} />
          ))}
        </div>

        {/* Stats strip */}
        <div className="card flex gap-3" style={{ padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--teal)" }}>
              M {balance.toFixed(2)}
            </div>
            <div className="text-xs text-muted">Earnings</div>
          </div>
          <div style={{ width: 1, background: "var(--border-subtle)" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--purple-light)" }}>
              {user?.reviewCount ?? 0}
            </div>
            <div className="text-xs text-muted">Trips</div>
          </div>
          <div style={{ width: 1, background: "var(--border-subtle)" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22,
              color: isClockedIn ? "var(--teal)" : "var(--text-muted)" }}>
              {isClockedIn ? "●" : "○"}
            </div>
            <div className="text-xs text-muted">{isClockedIn ? "Online" : "Offline"}</div>
          </div>
        </div>

        {isClockedIn ? (
          <button className="btn btn-teal" onClick={() => navigate("/driver/find")}>
            🔍  Find Passengers
          </button>
        ) : (
          <button
            className="btn btn-ghost"
            onClick={() => handleClock(true)}
            disabled={!allDocsVerified}
            style={{ opacity: allDocsVerified ? 1 : 0.4 }}
          >
            {allDocsVerified ? "Clock In to Start Driving" : "Complete document verification first"}
          </button>
        )}
      </div>

      <div className="px-4" style={{ paddingBottom: 24 }}>
        <button onClick={() => { logout(); navigate("/"); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 13, width: "100%", padding: "8px 0" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
