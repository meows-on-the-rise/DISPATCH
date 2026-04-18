import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { authApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";
import { Icons } from "../../components/shared";

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
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleRegister(e: React.FormEvent) {
  e.preventDefault();

  // Password
  if (form.password.length < 8) {
    toast("Password must be at least 8 characters", "error"); return;
  }

  // Passwords match
  if (form.password !== form.confirmPassword) {
    toast("Passwords don't match", "error"); return;
  }

  // ID validation — detect if passport or national ID
  const isPassport = /^[A-Z]{2}\d{6}$/.test(form.idNumber);
  const isNationalId = /^\d{12}$/.test(form.idNumber);

  if (!isPassport && !isNationalId) {
    toast("ID must be 12 digits (National ID) or 2 capital letters + 6 digits (Passport)", "error"); return;
  }

  setLoading(true);
  try {
    const { data } = await authApi.register({ ...form, role });
    setAuth(data.user, data.accessToken, data.refreshToken);
    toast(`Welcome, ${data.user.fullName}!`, "success");
    navigate(role === "DRIVER" ? "/driver" : "/passenger");
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Registration failed";
    toast(msg, "error");
  } finally { setLoading(false); }
}

  const fields: Array<{ key: keyof typeof form; label: string; type?: string; placeholder: string; icon: React.ReactNode }> = [
    { key: "fullName",        label: "Full Name",        placeholder: "Thabo Mokoena",     icon: Icons.user },
    { key: "username",        label: "Username",         placeholder: "thabo_m",           icon: Icons.user },
    { key: "email",           label: "Email",            type: "email", placeholder: "thabo@example.com", icon: Icons.mail },
    { key: "phone",           label: "Phone Number",     type: "tel",   placeholder: "+266 57 123 456",   icon: Icons.phone },
    { key: "dob",             label: "Date of Birth",    type: "date",  placeholder: "",                  icon: Icons.clock },
    { key: "idNumber",        label: "National ID",      placeholder: "National ID / Passport",           icon: Icons.document },
    { key: "password",        label: "Password",         type: "password", placeholder: "Min. 8 characters", icon: Icons.lock },
    { key: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "Repeat password",   icon: Icons.lock },
  ];

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48 }}>
        <button className="btn-icon-dark" onClick={() => navigate("/")} style={{ marginBottom: 20 }}>
          {Icons.back}
        </button>
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: "var(--r-md)",
            background: "rgba(249,115,22,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--orange)",
          }}>
            {role === "DRIVER" ? Icons.car : Icons.user}
          </div>
          <div>
            <h3 style={{ color: "#fff" }}>{role === "DRIVER" ? "Driver" : "Passenger"} Registration</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Create your Dispatch account</p>
          </div>
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 24 }}>
        <form onSubmit={handleRegister} className="flex-col gap-3 page-enter" style={{ paddingBottom: 40 }}>
          {fields.map(({ key, label, type = "text", placeholder, icon }) => (
            <div className="input-wrap" key={key}>
              <label className="input-label">{label}</label>
              <div className="relative">
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                  {icon}
                </span>
                <input className="input" style={{ paddingLeft: 44 }}
                  type={type} placeholder={placeholder}
                  value={form[key]} onChange={set(key)} required />
              </div>
            </div>
          ))}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} /> : "Create Account"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <span style={{ color: "var(--orange)", fontWeight: 600, cursor: "pointer" }}
              onClick={() => navigate("/login")}>Sign in</span>
          </p>
        </form>
      </div>
    </div>
  );
}
