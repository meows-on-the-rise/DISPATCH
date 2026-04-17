import React, { useState } from "react";
import { useNavigate } from "react-router";
import { authApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const toast = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) return;
    setLoading(true);
    try {
      const { data } = await authApi.login(identifier, password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      const role = data.user.role;
      navigate(role === "DRIVER" ? "/driver" : role === "ADMIN" ? "/admin" : "/passenger");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Login failed";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell" style={{ justifyContent: "center", padding: "40px 24px" }}>
      {/* Back */}
      <button
        className="map-btn"
        onClick={() => navigate("/")}
        style={{ position: "absolute", top: 20, left: 20 }}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </button>

      <div className="page-enter flex-col gap-5 w-full" style={{ maxWidth: 360, margin: "0 auto" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 6 }}>Welcome back</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Sign in to your Dispatch account</p>
        </div>

        <form onSubmit={handleLogin} className="flex-col gap-4">
          <div className="input-wrap">
            <label className="input-label">Username or Email</label>
            <div className="input-icon relative">
              <span className="icon">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                className="input"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="username or email"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="input-wrap">
            <label className="input-label">Password</label>
            <div className="input-icon relative">
              <span className="icon">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                className="input"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                }}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {showPw
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  }
                </svg>
              </button>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{ fontSize: 13, color: "var(--purple-light)", cursor: "pointer" }}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot password?
            </span>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : "Sign In"}
          </button>
        </form>

        <p className="text-center" style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Don't have an account?{" "}
          <span
            style={{ color: "var(--purple-light)", cursor: "pointer", fontWeight: 600 }}
            onClick={() => navigate("/")}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
