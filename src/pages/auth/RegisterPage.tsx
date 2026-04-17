import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { authApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = (params.get("role") ?? "PASSENGER") as "PASSENGER" | "DRIVER";
  const { setAuth } = useAuthStore();
  const toast = useToast();

  const [form, setForm] = useState({
    fullName: "", username: "", email: "", phone: "",
    password: "", confirmPassword: "", dob: "", idNumber: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast("Passwords don't match", "error");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.register({
        fullName: form.fullName, username: form.username,
        email: form.email, phone: form.phone,
        password: form.password, dob: form.dob,
        idNumber: form.idNumber, role,
      });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast(`Welcome, ${data.user.fullName}! Your ID: ${data.user.userId}`, "success");
      navigate(role === "DRIVER" ? "/driver" : "/passenger");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Registration failed";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  const fields: Array<{ key: keyof typeof form; label: string; type?: string; placeholder: string }> = [
    { key: "fullName",        label: "Full Name",       placeholder: "Thabo Mokoena" },
    { key: "username",        label: "Username",        placeholder: "thabo_m" },
    { key: "email",           label: "Email",           type: "email", placeholder: "thabo@example.com" },
    { key: "phone",           label: "Phone Number",    type: "tel", placeholder: "+266 57 123 456" },
    { key: "dob",             label: "Date of Birth",   type: "date", placeholder: "" },
    { key: "idNumber",        label: "ID Number",       placeholder: "National ID or Passport" },
    { key: "password",        label: "Password",        type: "password", placeholder: "Min. 8 characters" },
    { key: "confirmPassword", label: "Confirm Password",type: "password", placeholder: "Repeat password" },
  ];

  return (
    <div className="app-shell">
      {/* Header */}
      <div className="nav-header">
        <button className="map-btn" onClick={() => navigate("/")}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h3 style={{ fontFamily: "var(--font-display)" }}>
          {role === "DRIVER" ? "🚗 Driver" : "🧍 Passenger"} Registration
        </h3>
        <div style={{ width: 44 }} />
      </div>

      <div className="scroll-area flex-1 p-4">
        <div className="page-enter flex-col gap-4" style={{ paddingBottom: 32 }}>
          {/* Role badge */}
          <div className={`badge ${role === "DRIVER" ? "badge-teal" : "badge-purple"}`} style={{ alignSelf: "flex-start" }}>
            {role === "DRIVER" ? "Driver Account" : "Passenger Account"}
          </div>

          <form onSubmit={handleRegister} className="flex-col gap-3">
            {fields.map(({ key, label, type = "text", placeholder }) => (
              <div className="input-wrap" key={key}>
                <label className="input-label">{label}</label>
                <input
                  className="input"
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={set(key)}
                  required
                />
              </div>
            ))}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading
                ? <span className="spinner" style={{ width: 20, height: 20 }} />
                : "Create Account"}
            </button>
          </form>

          <p className="text-center" style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Already have an account?{" "}
            <span
              style={{ color: "var(--purple-light)", cursor: "pointer", fontWeight: 600 }}
              onClick={() => navigate("/login")}
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
