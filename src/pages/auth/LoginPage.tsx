import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { authApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";
import { Icons, PageHeader } from "../../components/shared";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = (location.state as { role?: "PASSENGER" | "DRIVER" })?.role ?? "PASSENGER";
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
      const userRole = data.user.role;
     if (userRole === "ADMIN") {
  navigate("/admin/verify", { state: { from: role } });
} else {
  navigate(userRole === "DRIVER" ? "/driver" : "/passenger");
}
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Login failed";
      toast(msg, "error");
    } finally { setLoading(false); }
  }

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 56 }}>
        <button className="btn-icon-dark" onClick={() => navigate("/")} style={{ marginBottom: 24 }}>
          {Icons.back}
        </button>
        <h2 style={{ color: "#fff", marginBottom: 6 }}>DISPATCH</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>Sign in to access your account</p>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 28 }}>
        <form onSubmit={handleLogin} className="flex-col gap-4 page-enter" style={{ paddingBottom: 32 }}>
          <div className="input-wrap">
            <label className="input-label">Username or Email</label>
            <div className="relative">
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                {Icons.user}
              </span>
              <input className="input" style={{ paddingLeft: 44 }}
                value={identifier} onChange={e => setIdentifier(e.target.value)}
                placeholder="username or email" autoComplete="username" />
            </div>
          </div>

          <div className="input-wrap">
            <label className="input-label">Password</label>
            <div className="relative">
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                {Icons.lock}
              </span>
              <input className="input" style={{ paddingLeft: 44, paddingRight: 44 }}
                type={showPw ? "text" : "password"}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
              }}>
              </button>
            </div>
          </div>

          <div style={{ textAlign: "right", marginTop: -8 }}>
            <span style={{ fontSize: 13, color: "var(--orange)", fontWeight: 600, cursor: "pointer" }}
              onClick={() => navigate("/forgot-password")}>
              Forgot password?
            </span>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} /> : "Sign In"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <span
              style={{ color: "var(--orange)", fontWeight: 600, cursor: "pointer" }}
              onClick={() => navigate(role === "DRIVER" ? "/register?role=DRIVER" : "/register?role=PASSENGER")}
            >
              Register
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
