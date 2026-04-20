import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useToast } from "../../lib/toast";
import { Icons } from "../../components/shared";

const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE;

export default function AdminVerifyPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Already verified this session — skip straight to admin
  useEffect(() => {
    if (sessionStorage.getItem("admin_verified") === "true") {
      navigate("/admin", { replace: true });
    }
  }, []);

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (code === ADMIN_CODE) {
        sessionStorage.setItem("admin_verified", "true"); // set flag
        navigate("/admin");
      } else {
        toast("Invalid admin code", "error");
        setCode("");
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 56 }}>
        <button className="btn-icon-dark" onClick={() => navigate("/")} style={{ marginBottom: 24 }}>
          {Icons.back}
        </button>
        <h2 style={{ color: "#fff", marginBottom: 6 }}>Admin Verification</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
          Enter your super secret admin code to continue
        </p>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 28 }}>
        <form onSubmit={handleVerify} className="flex-col gap-4 page-enter" style={{ paddingBottom: 32 }}>
          <div className="input-wrap">
            <label className="input-label">Admin Code</label>
            <div className="relative">
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                {Icons.lock}
              </span>
              <input
                className="input"
                style={{ paddingLeft: 44 }}
                type="password"
                placeholder="••••••••••••"
                value={code}
                onChange={e => setCode(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} />
              : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
