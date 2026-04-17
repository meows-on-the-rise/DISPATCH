import React from "react";
import { useNavigate } from "react-router";
import { Icons } from "../../components/shared";

export default function UserSelectPage() {
  const navigate = useNavigate();
  return (
    <div className="app-shell" style={{ background: "var(--bg-dark)" }}>
      {/* Hero illustration area */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 32px 32px",
      }}>
        <div className="logo-pulse" style={{ marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {Icons.dispatch}
          </div>
        </div>
        <h1 style={{ color: "#fff", textAlign: "center", marginBottom: 12, lineHeight: 1.2 }}>
          DISPATCH
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", fontSize: 14, lineHeight: 1.6 }}>
          Fast, safe, reliable rides across Lesotho
        </p>
      </div>

      {/* Bottom sheet */}
      <div style={{
        background: "var(--bg-base)",
        borderRadius: "28px 28px 0 0",
        padding: "32px 24px 40px",
      }}>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginBottom: 20, fontWeight: 500 }}>
          Continue as
        </p>

        <div className="flex-col gap-3">
          <button
            onClick={() => navigate("/login", { state: { role: "PASSENGER" } })}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "var(--bg-white)", border: "1.5px solid var(--border-light)",
              borderRadius: "var(--r-xl)", padding: "20px 20px",
              cursor: "pointer", textAlign: "left",
              boxShadow: "var(--shadow-sm)", transition: "var(--t)",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--orange)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-light)")}
          >
            <div style={{
              width: 48, height: 48, borderRadius: "var(--r-md)",
              background: "var(--orange-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--orange)", flexShrink: 0,
            }}>
              {Icons.user}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: "var(--text-primary)" }}>Passenger</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Book rides, pay in-app</div>
            </div>
            <span style={{ color: "var(--text-muted)" }}>{Icons.chevronRight}</span>
          </button>

          <button
            onClick={() => navigate("/login", { state: { role: "DRIVER" } })}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "var(--bg-white)", border: "1.5px solid var(--border-light)",
              borderRadius: "var(--r-xl)", padding: "20px 20px",
              cursor: "pointer", textAlign: "left",
              boxShadow: "var(--shadow-sm)", transition: "var(--t)",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--teal-light)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-light)")}
          >
            <div style={{
              width: 48, height: 48, borderRadius: "var(--r-md)",
              background: "var(--teal-dim)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--teal)", flexShrink: 0,
            }}>
              {Icons.car}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: "var(--text-primary)" }}>Driver</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Earn on your schedule</div>
            </div>
            <span style={{ color: "var(--text-muted)" }}>{Icons.chevronRight}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
