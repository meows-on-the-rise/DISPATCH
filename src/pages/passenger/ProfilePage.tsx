import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { userApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";
import { Icons, Avatar, StarRating } from "../../components/shared";

export default function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "", phone: user?.phone ?? "",
    vehicleMake: user?.driverProfile?.vehicleMake ?? "",
    vehicleModel: user?.driverProfile?.vehicleModel ?? "",
    vehiclePlate: user?.driverProfile?.vehiclePlate ?? "",
    vehicleColor: user?.driverProfile?.vehicleColor ?? "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await userApi.updateProfile(form); await refreshUser(); toast("Profile updated!", "success"); }
    catch { toast("Update failed", "error"); }
    finally { setLoading(false); }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatarLoading(true);
    try { await userApi.uploadAvatar(file); await refreshUser(); toast("Photo updated!", "success"); }
    catch { toast("Upload failed", "error"); }
    finally { setAvatarLoading(false); }
  }

  const backPath = user?.role === "DRIVER" ? "/driver" : "/passenger";

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 36 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
          <button className="btn-icon-dark" onClick={() => navigate(backPath)}>{Icons.back}</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>Edit Profile</span>
        </div>
        {/* Avatar picker */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Avatar src={user?.avatarUrl} name={user?.fullName ?? "?"} size={80} />
            <button onClick={() => fileRef.current?.click()} disabled={avatarLoading} style={{
              position: "absolute", bottom: -2, right: -2,
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--orange)", border: "2px solid var(--bg-dark)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff",
            }}>
              {avatarLoading ? <span className="spinner spinner-dark" style={{ width: 12, height: 12 }} /> : Icons.upload}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>{user?.fullName}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{user?.userId}</div>
          </div>
          {user && <StarRating value={user.rating} count={user.reviewCount} />}
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <form onSubmit={save} className="flex-col gap-3 page-enter">
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Personal Info</div>
            {[
              { key: "fullName", label: "Full Name",    placeholder: "Your full name",    icon: Icons.user },
              { key: "phone",    label: "Phone Number", placeholder: "+266 57 123 456",   icon: Icons.phone },
            ].map(({ key, label, placeholder, icon }) => (
              <div className="input-wrap" key={key} style={{ marginBottom: 12 }}>
                <label className="input-label">{label}</label>
                <div className="relative">
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>{icon}</span>
                  <input className="input" style={{ paddingLeft: 44 }}
                    value={form[key as keyof typeof form]} onChange={set(key)} placeholder={placeholder} />
                </div>
              </div>
            ))}
          </div>

          {user?.role === "DRIVER" && (
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Vehicle Info</div>
              {[
                { key: "vehicleMake",  label: "Make",         placeholder: "Toyota" },
                { key: "vehicleModel", label: "Model",        placeholder: "Corolla" },
                { key: "vehiclePlate", label: "Plate Number", placeholder: "A 1234 LS" },
                { key: "vehicleColor", label: "Color",        placeholder: "White" },
              ].map(({ key, label, placeholder }) => (
                <div className="input-wrap" key={key} style={{ marginBottom: 12 }}>
                  <label className="input-label">{label}</label>
                  <input className="input" value={form[key as keyof typeof form]}
                    onChange={set(key)} placeholder={placeholder} />
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
