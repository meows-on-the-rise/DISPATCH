import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { driverApi } from "../../api/client";
import { useToast } from "../../lib/toast";
import { Icons } from "../../components/shared";

const DOC_TYPES = [
  { key: "LICENSE",      label: "Driver's License",     desc: "Front and back of your license" },
  { key: "PERMIT",       label: "Driver's Permit",      desc: "Valid operating permit" },
  { key: "REGISTRATION", label: "Vehicle Registration", desc: "Current registration document" },
] as const;

interface Doc { docType: string; status: string; fileUrl: string; reviewNote?: string; }

const STATUS_COLOR: Record<string, string> = {
  PENDING: "var(--warning)", VERIFIED: "var(--success)", REJECTED: "var(--danger)",
};
const STATUS_BG: Record<string, string> = {
  PENDING: "rgba(249,115,22,0.1)", VERIFIED: "rgba(34,197,94,0.1)", REJECTED: "rgba(239,68,68,0.1)",
};

export default function DocumentsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  async function load() {
    try { const { data } = await driverApi.getDocuments(); setDocs(data); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleUpload(docType: string, file: File) {
    setUploading(docType);
    try { await driverApi.uploadDocument(docType, file); toast(`${docType} uploaded`, "success"); await load(); }
    catch { toast("Upload failed", "error"); }
    finally { setUploading(null); }
  }

  const getDoc = (key: string) => docs.find(d => d.docType === key);
  const verifiedCount = docs.filter(d => d.status === "VERIFIED").length;

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 28 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <button className="btn-icon-dark" onClick={() => navigate("/driver")}>{Icons.back}</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>Documents</span>
        </div>
        {/* Progress */}
        <div>
          <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Verification Progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: verifiedCount === 3 ? "var(--success)" : "var(--orange)" }}>
              {verifiedCount}/3 Verified
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3, transition: "width 0.5s ease",
              width: `${(verifiedCount / 3) * 100}%`,
              background: verifiedCount === 3 ? "var(--success)" : "var(--orange)",
            }} />
          </div>
          {verifiedCount < 3 && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
              All 3 documents must be verified before you can clock in
            </p>
          )}
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 20, paddingBottom: 32 }}>
        {loading && <div className="flex justify-center" style={{ padding: 32 }}><span className="spinner" /></div>}
        {!loading && (
          <div className="flex-col gap-3">
            {DOC_TYPES.map(({ key, label, desc }) => {
              const doc = getDoc(key);
              const isUploading = uploading === key;
              return (
                <div key={key} className="card" style={{ padding: 18 }}>
                  <div className="flex items-start gap-3" style={{ marginBottom: doc ? 14 : 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "var(--r-md)", flexShrink: 0,
                      background: doc ? STATUS_BG[doc.status] : "var(--teal-dim)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: doc ? STATUS_COLOR[doc.status] : "var(--teal)",
                    }}>
                      {Icons.document}
                    </div>
                    <div className="flex-1">
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        {doc ? (
                          <span style={{ color: STATUS_COLOR[doc.status], fontWeight: 600 }}>
                            {doc.status}
                            {doc.status === "REJECTED" && doc.reviewNote && ` — ${doc.reviewNote}`}
                          </span>
                        ) : desc}
                      </div>
                    </div>
                    {doc?.status === "VERIFIED" && (
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "rgba(34,197,94,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--success)", flexShrink: 0,
                      }}>
                        {Icons.check}
                      </div>
                    )}
                  </div>

                  {doc?.status !== "VERIFIED" && (
                    <label style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      padding: "11px 16px", borderRadius: "var(--r-md)",
                      background: "var(--bg-input)",
                      border: `1.5px solid ${doc?.status === "REJECTED" ? "var(--danger)" : "var(--border)"}`,
                      cursor: isUploading ? "wait" : "pointer",
                      fontSize: 13, fontWeight: 600,
                      color: doc?.status === "REJECTED" ? "var(--danger)" : "var(--teal)",
                    }}>
                      {isUploading
                        ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Uploading...</>
                        : <>{Icons.upload} {doc ? "Re-upload" : "Upload Document"}</>
                      }
                      <input type="file" accept="image/*,application/pdf" style={{ display: "none" }}
                        disabled={isUploading}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(key, f); }} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
