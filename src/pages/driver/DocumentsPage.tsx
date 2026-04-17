import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { driverApi } from "../../api/client";
import { useToast } from "../../lib/toast";
import { PageHeader } from "../../components/shared";

const DOC_TYPES = [
  { key: "LICENSE",      label: "Driver's License",     emoji: "🪪" },
  { key: "PERMIT",       label: "Driver's Permit",      emoji: "📋" },
  { key: "REGISTRATION", label: "Vehicle Registration", emoji: "🚗" },
] as const;

interface Doc { docType: string; status: string; fileUrl: string; uploadedAt: string; reviewNote?: string; }

const STATUS_COLOR: Record<string, string> = {
  PENDING: "var(--warning)", VERIFIED: "var(--teal)", REJECTED: "var(--danger)",
};

export default function DocumentsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  async function loadDocs() {
    try {
      const { data } = await driverApi.getDocuments();
      setDocs(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadDocs(); }, []);

  async function handleUpload(docType: string, file: File) {
    setUploading(docType);
    try {
      await driverApi.uploadDocument(docType, file);
      toast(`${docType} uploaded — awaiting admin review`, "success");
      await loadDocs();
    } catch { toast("Upload failed", "error"); }
    finally { setUploading(null); }
  }

  const getDoc = (key: string) => docs.find((d) => d.docType === key);
  const verifiedCount = docs.filter((d) => d.status === "VERIFIED").length;

  return (
    <div className="app-shell">
      <PageHeader title="Documents" onBack={() => navigate("/driver")} />

      <div className="scroll-area flex-1 px-4">
        <div className="page-enter flex-col gap-4" style={{ paddingBottom: 32 }}>
          {/* Progress */}
          <div className="card" style={{ padding: "16px 20px" }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Verification Progress</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--teal)" }}>
                {verifiedCount}/3
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "var(--bg-base)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${(verifiedCount / 3) * 100}%`,
                background: verifiedCount === 3 ? "var(--teal)" : "var(--purple)",
                transition: "width 0.5s ease",
              }} />
            </div>
            {verifiedCount < 3 && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                All 3 documents must be verified before you can clock in.
              </p>
            )}
          </div>

          {loading && <div className="flex justify-center" style={{ padding: 24 }}><span className="spinner" /></div>}

          {!loading && DOC_TYPES.map(({ key, label, emoji }) => {
            const doc = getDoc(key);
            const isUploading = uploading === key;

            return (
              <div key={key} className="card-elevated" style={{ padding: 16 }}>
                <div className="flex items-center gap-3" style={{ marginBottom: doc ? 12 : 0 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "var(--r-md)",
                    background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, flexShrink: 0,
                  }}>
                    {emoji}
                  </div>
                  <div className="flex-1">
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15 }}>{label}</div>
                    {doc && (
                      <div style={{ fontSize: 12, color: STATUS_COLOR[doc.status], fontWeight: 600, marginTop: 2 }}>
                        ● {doc.status}
                        {doc.status === "REJECTED" && doc.reviewNote && (
                          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> — {doc.reviewNote}</span>
                        )}
                      </div>
                    )}
                    {!doc && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Not uploaded yet</div>}
                  </div>
                </div>

                {/* Upload button */}
                <label style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "10px 16px", borderRadius: "var(--r-md)",
                  background: doc?.status === "VERIFIED" ? "var(--teal-dim)" : "var(--bg-base)",
                  border: `1px solid ${doc?.status === "VERIFIED" ? "var(--teal)" : "var(--border)"}`,
                  cursor: isUploading ? "wait" : "pointer",
                  fontSize: 13, fontWeight: 600,
                  color: doc?.status === "VERIFIED" ? "var(--teal)" : "var(--text-secondary)",
                }}>
                  {isUploading
                    ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Uploading…</>
                    : doc?.status === "VERIFIED"
                    ? "✓ Verified"
                    : doc
                    ? "🔄 Re-upload"
                    : "⬆️ Upload"}
                  <input
                    type="file" accept="image/*,application/pdf" style={{ display: "none" }}
                    disabled={isUploading || doc?.status === "VERIFIED"}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(key, f);
                    }}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
