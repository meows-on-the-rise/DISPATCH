import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { adminApi } from "../../api/client";
import { useToast } from "../../lib/toast";
import { Avatar, Icons, PageHeader } from "../../components/shared";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string; userId: string; fullName: string; email: string; phone: string;
  role: "PASSENGER" | "DRIVER" | "ADMIN"; rating: number; reviewCount: number;
  createdAt: string;
  wallet?: { balance: number };
  driverProfile?: { isVerified: boolean; isClockedIn: boolean; vehicleMake?: string; vehicleModel?: string; vehiclePlate?: string };
}

interface FormErrors { fullName?: string; phone?: string; newPassword?: string; }

const ROLES = ["ALL", "PASSENGER", "DRIVER", "ADMIN"] as const;
const TRIP_STATUSES = ["ALL", "REQUESTED", "DRIVER_ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

// ── Field component ───────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="input-wrap" style={{ marginBottom: 14 }}>
      <label className="input-label">{label}</label>
      {children}
      {error && (
        <span style={{ fontSize: 11, color: "var(--danger)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </span>
      )}
    </div>
  );
}

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    PASSENGER: "badge-teal", DRIVER: "badge-orange", ADMIN: "badge-red",
  };
  return <span className={`badge ${map[role] ?? "badge-teal"}`}>{role}</span>;
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditUserModal({
  user, onClose, onSaved,
}: { user: AdminUser; onClose: () => void; onSaved: (u: AdminUser) => void }) {
  const toast = useToast();
  const [fullName,    setFullName]    = useState(user.fullName);
  const [phone,       setPhone]       = useState(user.phone);
  const [role,        setRole]        = useState(user.role);
  const [newPassword, setNewPassword] = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState<FormErrors>({});

  function validate(): boolean {
    const e: FormErrors = {};
    if (!fullName.trim())               e.fullName = "Full name is required";
    else if (fullName.trim().length < 3) e.fullName = "Name must be at least 3 characters";

    if (!phone.trim())                  e.phone = "Phone number is required";
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(phone)) e.phone = "Enter a valid phone number";

    if (newPassword && newPassword.length < 8)
      e.newPassword = "Password must be at least 8 characters";
    if (newPassword && !/[A-Z]/.test(newPassword))
      e.newPassword = "Password needs at least one uppercase letter";
    if (newPassword && !/\d/.test(newPassword))
      e.newPassword = "Password needs at least one number";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const body: any = { fullName: fullName.trim(), phone: phone.trim(), role };
      if (newPassword) body.newPassword = newPassword;
      const { data } = await adminApi.updateUser(user.id, body);
      toast("User updated successfully", "success");
      onSaved({ ...user, ...data });
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Update failed";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(13,45,53,0.7)",
      zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div
        className="page-enter"
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--bg-white)", borderRadius: "var(--r-xl) var(--r-xl) 0 0",
          padding: "24px 20px 36px", width: "100%", maxWidth: 430,
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 99, margin: "0 auto 20px" }} />

        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <Avatar src={null} name={user.fullName} size={44} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user.fullName}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{user.userId} · {user.email}</div>
          </div>
        </div>

        <Field label="Full Name" error={errors.fullName}>
          <input
            className={`input ${errors.fullName ? "input-error" : ""}`}
            value={fullName}
            onChange={e => { setFullName(e.target.value); setErrors(prev => ({ ...prev, fullName: undefined })); }}
            placeholder="Full name"
            style={errors.fullName ? { borderColor: "var(--danger)" } : {}}
          />
        </Field>

        <Field label="Phone Number" error={errors.phone}>
          <input
            className="input"
            value={phone}
            onChange={e => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: undefined })); }}
            placeholder="+266 XXXX XXXX"
            style={errors.phone ? { borderColor: "var(--danger)" } : {}}
          />
        </Field>

        <Field label="Role">
          <select
            className="input"
            value={role}
            onChange={e => setRole(e.target.value as any)}
            style={{ cursor: "pointer" }}
          >
            <option value="PASSENGER">Passenger</option>
            <option value="DRIVER">Driver</option>
            <option value="ADMIN">Admin</option>
          </select>
        </Field>

        <Field label="New Password (leave blank to keep)" error={errors.newPassword}>
          <div style={{ position: "relative" }}>
            <input
              className="input"
              type={showPw ? "text" : "password"}
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setErrors(prev => ({ ...prev, newPassword: undefined })); }}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              style={{ paddingRight: 44, ...(errors.newPassword ? { borderColor: "var(--danger)" } : {}) }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >{showPw ? Icons.eyeOff : Icons.eye}</button>
          </div>
        </Field>

        <div className="flex gap-2" style={{ marginTop: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner spinner-dark" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteModal({ user, onClose, onDeleted }: { user: AdminUser; onClose: () => void; onDeleted: () => void }) {
  const toast = useToast();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const isValid = confirm === user.fullName;

  async function handleDelete() {
    if (!isValid) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(user.id);
      toast("User deleted", "success");
      onDeleted();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(13,45,53,0.7)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div className="card page-enter" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 390, padding: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)", margin: "0 auto 16px" }}>
          {Icons.x}
        </div>
        <h3 style={{ textAlign: "center", marginBottom: 8 }}>Delete User?</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", marginBottom: 20, lineHeight: 1.6 }}>
          This will permanently delete <strong>{user.fullName}</strong> and all their data.
          Type their full name below to confirm.
        </p>
        <input
          className="input"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder={user.fullName}
          style={isValid ? { borderColor: "var(--danger)" } : {}}
        />
        <div className="flex gap-2" style={{ marginTop: 16 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button
            className="btn"
            style={{ flex: 1, background: isValid ? "var(--danger)" : "var(--border)", color: isValid ? "#fff" : "var(--text-muted)", cursor: isValid ? "pointer" : "not-allowed", borderRadius: "var(--r-pill)" }}
            onClick={handleDelete}
            disabled={!isValid || deleting}
          >
            {deleting ? <span className="spinner spinner-dark" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── User row card ─────────────────────────────────────────────────────────────

function UserCard({
  user,
  onEdit,
  onDelete,
}: { user: AdminUser; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card" style={{ padding: 16, marginBottom: 10 }}>
      <div className="flex items-center gap-3" style={{ cursor: "pointer" }} onClick={() => setExpanded(v => !v)}>
        <Avatar src={null} name={user.fullName} size={40} />
        <div className="flex-1 overflow-hidden">
          <div style={{ fontWeight: 700, fontSize: 14 }} className="truncate">{user.fullName}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{user.userId} · {user.email}</div>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge role={user.role} />
          <span style={{ color: "var(--text-muted)", transition: "transform 200ms", display: "inline-flex", transform: expanded ? "rotate(180deg)" : "none" }}>
            {Icons.chevronDown}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="fade-in" style={{ marginTop: 14, paddingTop: 14, borderTop: "1.5px solid var(--border-light)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Phone",   value: user.phone },
              { label: "Balance", value: `M ${Number(user.wallet?.balance ?? 0).toFixed(2)}` },
              { label: "Rating",  value: `${user.rating.toFixed(1)} ★ (${user.reviewCount})` },
              { label: "Joined",  value: new Date(user.createdAt).toLocaleDateString("en-LS", { day: "numeric", month: "short", year: "numeric" }) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          {user.driverProfile && (
            <div style={{ background: "var(--teal-dim)", borderRadius: "var(--r-md)", padding: "10px 12px", marginBottom: 14, fontSize: 12 }}>
              <span style={{ color: "var(--teal)", fontWeight: 600 }}>
                {user.driverProfile.isVerified ? "✓ Verified Driver" : "⏳ Pending Verification"}
              </span>
              {user.driverProfile.vehiclePlate && (
                <span style={{ color: "var(--text-secondary)", marginLeft: 8 }}>· {user.driverProfile.vehiclePlate}</span>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn btn-outline" style={{ flex: 1, padding: "10px 16px" }} onClick={onEdit}>
              {Icons.check} Edit
            </button>
            <button
              className="btn"
              style={{ flex: 1, padding: "10px 16px", background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1.5px solid rgba(239,68,68,0.2)", borderRadius: "var(--r-pill)" }}
              onClick={onDelete}
            >
              {Icons.x} Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UsersFormPage() {
  const navigate = useNavigate();
  const [users,      setUsers]      = useState<AdminUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [delTarget,  setDelTarget]  = useState<AdminUser | null>(null);

  const load = useCallback(async (s = search, r = roleFilter, p = page) => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers(r === "ALL" ? "" : r, p, s);
      setUsers(data.users);
      setTotalPages(data.pages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(search, roleFilter, page); }, [roleFilter, page]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(search, roleFilter, 1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  function handleSaved(updated: AdminUser) {
    setUsers(us => us.map(u => u.id === updated.id ? updated : u));
    setEditTarget(null);
  }

  function handleDeleted() {
    setUsers(us => us.filter(u => u.id !== delTarget?.id));
    setDelTarget(null);
  }

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 20 }}>
        <PageHeader
          title="User Management"
          onBack={() => navigate("/admin")}
          dark
        />

        {/* Search bar */}
        <div style={{ position: "relative", margin: "12px 20px 0" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)" }}>
            {Icons.search}
          </span>
          <input
            className="input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, ID, phone…"
            style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)", color: "#fff", paddingLeft: 44 }}
          />
        </div>

        {/* Role filter tabs */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 20px 0", scrollbarWidth: "none" }}>
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              style={{
                padding: "6px 14px", borderRadius: "var(--r-pill)", border: "none",
                fontFamily: "var(--font)", fontSize: 12, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap",
                background: roleFilter === r ? "var(--orange)" : "rgba(255,255,255,0.12)",
                color: roleFilter === r ? "#fff" : "rgba(255,255,255,0.7)",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 16, paddingBottom: 32 }}>
        {loading && (
          <div className="flex justify-center" style={{ padding: 40 }}>
            <span className="spinner" />
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="card text-center" style={{ padding: 48, marginTop: 16 }}>
            <div style={{ color: "var(--text-muted)", display: "flex", justifyContent: "center", marginBottom: 12 }}>{Icons.user}</div>
            <div style={{ fontWeight: 600 }}>No users found</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Try a different search or filter</div>
          </div>
        )}

        {!loading && users.map(u => (
          <UserCard
            key={u.id}
            user={u}
            onEdit={() => setEditTarget(u)}
            onDelete={() => setDelTarget(u)}
          />
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
            <button
              className="btn btn-outline"
              style={{ width: "auto", padding: "10px 20px" }}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-outline"
              style={{ width: "auto", padding: "10px 20px" }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {editTarget && (
        <EditUserModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
      {delTarget && (
        <DeleteModal
          user={delTarget}
          onClose={() => setDelTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
