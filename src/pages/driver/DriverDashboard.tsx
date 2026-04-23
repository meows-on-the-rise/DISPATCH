import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { driverApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useSocket } from "../../hooks/useSocket";
import { useToast } from "../../lib/toast";
import { Avatar, BalanceBadge, IconBtn, Icons, StarRating, Toggle } from "../../components/shared";

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
  const allDocsVerified = (profile?.documents?.filter(d => d.status === "VERIFIED").length ?? 0) >= 3;

  async function handleClock(val: boolean) {
    if (val && !allDocsVerified) {
      toast("Upload and verify all 3 documents first", "error");
      navigate("/driver/documents"); return;
    }
    try {
      await driverApi.toggleClock(); await refreshUser();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed";
      toast(msg, "error");
    }
  }

  const icons = [
    { icon: Icons.wallet,   label: "Earnings",  path: "/driver/wallet" },
    { icon: Icons.activity, label: "Activity",  path: "/driver/activity" },
    { icon: Icons.stats,    label: "Stats",     path: "/driver/stats" },
    { icon: Icons.document, label: "Documents", path: "/driver/documents" },
  ];

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingBottom: 32 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <button onClick={() => navigate("/driver/profile")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar src={user?.avatarUrl} name={user?.fullName ?? "?"} size={40} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Driver</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{user?.username}</div>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <Toggle checked={isClockedIn} onChange={handleClock} />
          </div>
        </div>

        <h2 style={{ color: "#fff", marginBottom: 4 }}>
          {isClockedIn ? "You're online!" : "Ready to Drive?"}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
          {isClockedIn ? "Take ride requests to earn" : "Clock in to start accepting rides"}
        </p>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {/* Verification warning */}
        {!isVerified && (
          <div style={{
            background: "rgba(249,115,22,0.08)", border: "1.5px solid var(--orange)",
            borderRadius: "var(--r-lg)", padding: "14px 16px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ color: "var(--orange)", flexShrink: 0 }}>{Icons.document}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--orange)" }}>Documents required</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Upload and get all 3 documents verified.{" "}
                <span style={{ color: "var(--orange)", fontWeight: 600, cursor: "pointer" }}
                  onClick={() => navigate("/driver/documents")}>Upload now</span>
              </div>
            </div>
          </div>
        )}

        {/* Icon grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
          {icons.map(({ icon, label, path }) => (
            <IconBtn key={label} icon={icon} label={label} onClick={() => navigate(path)} />
          ))}
        </div>

        {/* Stats */}
        <div className="card flex gap-3" style={{ padding: "16px 20px", marginBottom: 20 }}>
          {[
            { label: "Earnings",   value: `M ${balance.toFixed(2)}`, color: "var(--orange)" },
            { label: "Trips",      value: user?.reviewCount ?? 0,    color: "var(--teal)" },
            { label: "Status",     value: isClockedIn ? "Online" : "Offline",
              color: isClockedIn ? "var(--success)" : "var(--text-muted)" },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div style={{ width: 1, background: "var(--border-light)" }} />}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {isClockedIn
          ? <button className="btn btn-primary" onClick={() => navigate("/driver/find")}>Find Passengers</button>
          : <button className="btn btn-dark" onClick={() => handleClock(true)} disabled={!allDocsVerified}
              style={{ opacity: allDocsVerified ? 1 : 0.5 }}>
              {allDocsVerified ? "Clock In to Start" : "Complete verification first"}
            </button>
        }

        <button onClick={async () => {
          if (isClockedIn) {
            try { await driverApi.toggleClock(); } catch {}
          }
          logout();
          navigate("/", { replace: true });
        }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
            fontSize: 13, width: "100%", padding: "16px 0", marginTop: 8,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {Icons.logout} Sign out
        </button>
      </div>
    </div>
  );
}
