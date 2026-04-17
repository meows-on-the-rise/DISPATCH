import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { userApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";
import { PageHeader, Avatar, StarRating } from "../../components/shared";

export default function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    phone: user?.phone ?? "",
    vehicleMake: user?.driverProfile?.vehicleMake ?? "",
    vehicleModel: user?.driverProfile?.vehicleModel ?? "",
    vehiclePlate: user?.driverProfile?.vehiclePlate ?? "",
    vehicleColor: user?.driverProfile?.vehicleColor ?? "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await userApi.updateProfile(form);
      await refreshUser();
      toast("Profile updated!", "success");
    } catch { toast("Update failed", "error"); }
    finally { setLoading(false); }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      await userApi.uploadAvatar(file);
      await refreshUser();
      toast("Photo updated!", "success");
    } catch { toast("Upload failed", "error"); }
    finally { setAvatarLoading(false); }
  }

  const backPath = user?.role === "DRIVER" ? "/driver" : "/passenger";

  return (
    <div className="app-shell">
      <PageHeader title="Edit Profile" onBack={() => navigate(backPath)} />

      <div className="scroll-area flex-1 px-4">
        <div className="page-enter flex-col gap-4" style={{ paddingBottom: 32 }}>
          {/* Avatar picker */}
          <div className="flex-col items-center gap-3" style={{ paddingTop: 8, paddingBottom: 4 }}>
            <div style={{ position: "relative" }}>
              <Avatar src={user?.avatarUrl} name={user?.fullName ?? "?"} size={80} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarLoading}
                style={{
                  position: "absolute", bottom: -4, right: -4,
                  width: 28, height: 28, borderRadius: "50%",
                  background: "var(--purple)", border: "2px solid var(--bg-base)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 14,
                }}
              >
                {avatarLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "✏️"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
            </div>
            <div className="text-center">
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>{user?.fullName}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{user?.userId}</div>
              {user && <StarRating value={user.rating} count={user.reviewCount} />}
            </div>
          </div>

          <form onSubmit={save} className="flex-col gap-3">
            <div className="input-wrap">
              <label className="input-label">Full Name</label>
              <input className="input" value={form.fullName} onChange={set("fullName")} placeholder="Your full name" />
            </div>
            <div className="input-wrap">
              <label className="input-label">Phone Number</label>
              <input className="input" type="tel" value={form.phone} onChange={set("phone")} placeholder="+266 57 123 456" />
            </div>

            {user?.role === "DRIVER" && (
              <>
                <div className="divider" />
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15 }}>Vehicle Info</h3>
                {[
                  { key: "vehicleMake", label: "Make", placeholder: "Toyota" },
                  { key: "vehicleModel", label: "Model", placeholder: "Corolla" },
                  { key: "vehiclePlate", label: "Plate Number", placeholder: "A 1234 LS" },
                  { key: "vehicleColor", label: "Color", placeholder: "White" },
                ].map(({ key, label, placeholder }) => (
                  <div className="input-wrap" key={key}>
                    <label className="input-label">{label}</label>
                    <input className="input" value={form[key as keyof typeof form]} onChange={set(key)} placeholder={placeholder} />
                  </div>
                ))}
              </>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
