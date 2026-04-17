import React, { useState } from "react";
import { useNavigate } from "react-router";
import { authApi } from "../../api/client";
import { useToast } from "../../lib/toast";
import { Icons } from "../../components/shared";

type Step = "email" | "otp" | "done";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await authApi.forgotPassword(email); setStep("otp"); toast("Code sent to your email", "success"); }
    catch { toast("Failed to send code", "error"); }
    finally { setLoading(false); }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    setLoading(true);
    try { await authApi.resetPassword(email, otp, newPassword); setStep("done"); }
    catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Invalid code";
      toast(msg, "error");
    } finally { setLoading(false); }
  }

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48 }}>
        <button className="btn-icon-dark" onClick={() => navigate("/login")} style={{ marginBottom: 24 }}>
          {Icons.back}
        </button>
        <h2 style={{ color: "#fff", marginBottom: 6 }}>
          {step === "email" ? "Reset Password" : step === "otp" ? "Enter Code" : "All Done!"}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
          {step === "email" ? "We'll send a 6-digit code to your email"
            : step === "otp" ? `Code sent to ${email}`
            : "Your password has been updated"}
        </p>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 28 }}>
        {step === "email" && (
          <form onSubmit={sendOtp} className="flex-col gap-4 page-enter" style={{ paddingBottom: 32 }}>
            <div className="input-wrap">
              <label className="input-label">Email Address</label>
              <div className="relative">
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                  {Icons.mail}
                </span>
                <input className="input" style={{ paddingLeft: 44 }} type="email"
                  value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} /> : "Send Code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={resetPassword} className="flex-col gap-4 page-enter" style={{ paddingBottom: 32 }}>
            <div className="input-wrap">
              <label className="input-label">6-Digit Code</label>
              <input className="input" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="483921" maxLength={6}
                style={{ fontSize: 28, letterSpacing: 14, textAlign: "center", fontWeight: 700 }} required />
            </div>
            <div className="input-wrap">
              <label className="input-label">New Password</label>
              <div className="relative">
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                  {Icons.lock}
                </span>
                <input className="input" style={{ paddingLeft: 44 }} type="password"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters" required />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading || otp.length < 6}>
              {loading ? <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} /> : "Reset Password"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setStep("email")}>Back</button>
          </form>
        )}

        {step === "done" && (
          <div className="page-enter flex-col gap-4 items-center text-center" style={{ paddingTop: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(34,197,94,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--success)", marginBottom: 8,
            }}>
              {Icons.check}
            </div>
            <h2>Password Reset!</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Sign in with your new password.</p>
            <button className="btn btn-primary w-full" onClick={() => navigate("/login")}>Go to Sign In</button>
          </div>
        )}
      </div>
    </div>
  );
}
