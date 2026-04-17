import React, { useState } from "react";
import { useNavigate } from "react-router";
import { authApi } from "../../api/client";
import { useToast } from "../../lib/toast";

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
    try {
      await authApi.forgotPassword(email);
      setStep("otp");
      toast("OTP sent to your email", "success");
    } catch { toast("Failed to send OTP", "error"); }
    finally { setLoading(false); }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(email, otp, newPassword);
      setStep("done");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Invalid OTP";
      toast(msg, "error");
    } finally { setLoading(false); }
  }

  return (
    <div className="app-shell" style={{ justifyContent: "center", padding: "40px 24px" }}>
      <button className="map-btn" onClick={() => navigate("/login")} style={{ position: "absolute", top: 20, left: 20 }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </button>

      <div className="page-enter flex-col gap-5 w-full" style={{ maxWidth: 360, margin: "0 auto" }}>
        {step === "email" && (
          <>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 6 }}>Forgot Password</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Enter your email to receive a 6-digit reset code.
              </p>
            </div>
            <form onSubmit={sendOtp} className="flex-col gap-4">
              <div className="input-wrap">
                <label className="input-label">Email Address</label>
                <input className="input" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : "Send Code"}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 6 }}>Enter Code</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Check <strong style={{ color: "var(--teal)" }}>{email}</strong> for your 6-digit code.
              </p>
            </div>
            <form onSubmit={resetPassword} className="flex-col gap-4">
              <div className="input-wrap">
                <label className="input-label">6-Digit Code</label>
                <input
                  className="input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="483921"
                  style={{ fontSize: 28, letterSpacing: 14, fontFamily: "var(--font-display)", textAlign: "center" }}
                  maxLength={6}
                  required
                />
              </div>
              <div className="input-wrap">
                <label className="input-label">New Password</label>
                <input className="input" type="password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" required />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading || otp.length < 6}>
                {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : "Reset Password"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setStep("email")}>
                Back
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center flex-col gap-4 items-center">
            <div style={{ fontSize: 64, marginBottom: 8 }}>✅</div>
            <h2 style={{ fontFamily: "var(--font-display)" }}>Password Reset!</h2>
            <p style={{ color: "var(--text-secondary)" }}>Your password has been updated. Sign in with your new password.</p>
            <button className="btn btn-primary" onClick={() => navigate("/login")}>Go to Login</button>
          </div>
        )}
      </div>
    </div>
  );
}
