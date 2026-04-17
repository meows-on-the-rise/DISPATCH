import React from "react";
import { useNavigate } from "react-router";

export default function UserSelectPage() {
  const navigate = useNavigate();

  return (
    <div className="app-shell" style={{ justifyContent: "center", padding: "40px 24px" }}>
      {/* Logo */}
      <div className="text-center mb-4" style={{ marginBottom: 48 }}>
        <div className="logo-pulse" style={{ marginBottom: 16 }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="36" fill="var(--purple-dim)" />
            <path d="M22 48 L36 18 L50 48" stroke="var(--purple-light)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M26 40 L46 40" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em", marginBottom: 8 }}>
          DISPATCH
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          Your ride, on your terms
        </p>
      </div>

      {/* Selection cards */}
      <div className="flex-col gap-4 w-full page-enter">
        <button
          onClick={() => navigate("/register?role=PASSENGER")}
          style={{
            background: "var(--bg-elevated)",
            border: "2px solid var(--border)",
            borderRadius: "var(--r-xl)",
            padding: "28px 24px",
            cursor: "pointer",
            textAlign: "left",
            transition: "var(--transition)",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--purple)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <div style={{
            width: 56, height: 56, borderRadius: "var(--r-md)",
            background: "var(--purple-dim)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, flexShrink: 0,
          }}>
            🧍
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>
              I'm a Passenger
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
              Book rides, track drivers, pay in-app
            </div>
          </div>
          <svg style={{ marginLeft: "auto", color: "var(--purple-light)" }} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <button
          onClick={() => navigate("/register?role=DRIVER")}
          style={{
            background: "var(--bg-elevated)",
            border: "2px solid var(--border)",
            borderRadius: "var(--r-xl)",
            padding: "28px 24px",
            cursor: "pointer",
            textAlign: "left",
            transition: "var(--transition)",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--teal)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <div style={{
            width: 56, height: 56, borderRadius: "var(--r-md)",
            background: "var(--teal-dim)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, flexShrink: 0,
          }}>
            🚗
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>
              I'm a Driver
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
              Accept trips, earn on your schedule
            </div>
          </div>
          <svg style={{ marginLeft: "auto", color: "var(--teal)" }} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Login link */}
      <p className="text-center mt-4" style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 32 }}>
        Already have an account?{" "}
        <span
          style={{ color: "var(--purple-light)", cursor: "pointer", fontWeight: 600 }}
          onClick={() => navigate("/login")}
        >
          Sign in
        </span>
      </p>
    </div>
  );
}
