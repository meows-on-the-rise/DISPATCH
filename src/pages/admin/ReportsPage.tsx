import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { adminApi } from "../../api/client";
import { Icons, PageHeader } from "../../components/shared";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  TripSummaryPDF,
  DriverEarningsPDF,
  PassengerActivityPDF,
  PlatformRevenuePDF,
} from "./ReportPDF";

// ── Types ─────────────────────────────────────────────────────────────────────

type ReportKey =
  | "trip-summary"
  | "driver-earnings"
  | "passenger-activity"
  | "platform-revenue";

interface ReportMeta {
  key: ReportKey;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const REPORTS: ReportMeta[] = [
  {
    key: "trip-summary",
    title: "Trip Summary",
    description: "All trips with passenger, driver, fare breakdown and status",
    icon: Icons.car,
    color: "var(--teal)",
  },
  {
    key: "driver-earnings",
    title: "Driver Earnings",
    description: "Per-driver earnings, trips completed, distance and ratings",
    icon: Icons.wallet,
    color: "var(--orange)",
  },
  {
    key: "passenger-activity",
    title: "Passenger Activity",
    description: "Per-passenger spend, trip history and wallet balance",
    icon: Icons.user,
    color: "var(--teal-mid)",
  },
  {
    key: "platform-revenue",
    title: "Platform Revenue",
    description: "Daily revenue, payouts, commission and wallet stats",
    icon: Icons.stats,
    color: "var(--success)",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return `M ${Number(n).toFixed(decimals)}`;
}
function fmtNum(n: number) {
  return Number(n).toLocaleString();
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-LS", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "badge-green",
    CANCELLED: "badge-red",
    IN_PROGRESS: "badge-orange",
    REQUESTED: "badge-teal",
    DRIVER_ASSIGNED: "badge-teal",
  };
  return (
    <span className={`badge ${map[status] ?? "badge-teal"}`} style={{ fontSize: 10 }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Stat summary card ─────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  color = "var(--teal)",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-white)",
        borderRadius: "var(--r-lg)",
        padding: "14px 16px",
        boxShadow: "var(--shadow-sm)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontWeight: 800, fontSize: 18, color }}>{value}</div>
    </div>
  );
}

// ── Table component ───────────────────────────────────────────────────────────

function ReportTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div style={{ overflowX: "auto", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--bg-white)", minWidth: 600 }}>
        <thead>
          <tr style={{ background: "var(--bg-dark)" }}>
            {headers.map((h) => (
              <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "var(--bg-white)" : "var(--bg-surface)", borderBottom: "1px solid var(--border-light)" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "11px 14px", fontSize: 13, verticalAlign: "middle", whiteSpace: "nowrap" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── PDF + Print action bar ────────────────────────────────────────────────────

function ReportActions({
  pdfDocument,
  fileName,
  onPrint,
}: {
  pdfDocument: React.ReactElement;
  fileName: string;
  onPrint: () => void;
}) {
  return (
    <div className="flex gap-2" style={{ marginBottom: 16 }}>
      <PDFDownloadLink document={pdfDocument} fileName={fileName}>
        {({ loading: pdfLoading }) => (
          <button className="btn btn-outline" style={{ flex: 1 }} disabled={pdfLoading}>
            {pdfLoading ? <span className="spinner" /> : <>{Icons.document} Download PDF</>}
          </button>
        )}
      </PDFDownloadLink>
      <button
        className="btn"
        onClick={onPrint}
        style={{ flex: 1, background: "rgba(13,122,138,0.1)", color: "var(--teal)", border: "1.5px solid rgba(13,122,138,0.2)", borderRadius: "var(--r-pill)" }}
      >
        {Icons.document} Print
      </button>
    </div>
  );
}

// ── Filter constants ──────────────────────────────────────────────────────────

const TRIP_STATUSES = ["", "REQUESTED", "DRIVER_ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const PERIOD_OPTIONS = [7, 14, 30, 60, 90];

// ── Report panels ─────────────────────────────────────────────────────────────

function TripSummaryReport({ onPrint }: { onPrint: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function generate() {
    setLoading(true);
    try {
      const { data: d } = await adminApi.getReportTripSummary({
        status: statusFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  const rows = (data?.rows ?? []).map((r: any) => [
    <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>#{r.tripId}</span>,
    r.passengerName,
    r.driverName ?? "—",
    <span className="truncate" style={{ maxWidth: 160, display: "inline-block" }}>{r.pickupAddress}</span>,
    <span className="truncate" style={{ maxWidth: 160, display: "inline-block" }}>{r.dropoffAddress}</span>,
    `${r.distanceKm.toFixed(1)} km`,
    fmt(r.totalPrice),
    <span style={{ color: "var(--teal)", fontWeight: 600 }}>{fmt(r.systemCommission)}</span>,
    <StatusBadge status={r.status} />,
    fmtDate(r.createdAt),
  ]);

  return (
    <div>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Filters</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div className="input-wrap">
            <label className="input-label">Status</label>
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {TRIP_STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div className="input-wrap">
            <label className="input-label">From Date</label>
            <input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
        </div>
        <div className="input-wrap" style={{ marginBottom: 12 }}>
          <label className="input-label">To Date</label>
          <input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? <span className="spinner spinner-dark" /> : <>{Icons.search} Generate Report</>}
        </button>
      </div>

      {data && (
        <div className="fade-in">
          <ReportActions
            pdfDocument={<TripSummaryPDF data={data} />}
            fileName={`dispatch-trip-summary-${new Date().toISOString().slice(0, 10)}.pdf`}
            onPrint={onPrint}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <SummaryCard label="Total Trips" value={fmtNum(data.count)} />
            <SummaryCard label="Generated" value={new Date(data.generatedAt).toLocaleTimeString("en-LS", { hour: "2-digit", minute: "2-digit" })} color="var(--orange)" />
            <SummaryCard label="Showing" value={`${data.rows.length} trips`} color="var(--teal-mid)" />
          </div>
          <ReportTable
            headers={["Trip ID", "Passenger", "Driver", "Pickup", "Dropoff", "Distance", "Total", "Commission", "Status", "Date"]}
            rows={rows}
          />
        </div>
      )}
    </div>
  );
}

function DriverEarningsReport({ onPrint }: { onPrint: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const { data: d } = await adminApi.getReportDriverEarnings();
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  const rows = (data?.rows ?? []).map((r: any, i: number) => [
    <span style={{ fontWeight: 700, color: "var(--orange)", fontSize: 12 }}>#{i + 1}</span>,
    <div>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.fullName}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.driverId}</div>
    </div>,
    r.vehicle,
    r.plate,
    r.isVerified
      ? <span className="badge badge-green" style={{ fontSize: 10 }}>Verified</span>
      : <span className="badge badge-red" style={{ fontSize: 10 }}>Pending</span>,
    fmtNum(r.tripsCompleted),
    <span style={{ fontWeight: 700, color: "var(--orange)" }}>{fmt(r.totalEarned)}</span>,
    fmt(r.totalFaresGenerated),
    fmt(r.walletBalance),
    `${r.totalKm} km`,
    `${r.avgRating.toFixed(1)} ★`,
  ]);

  return (
    <div>
      <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={generate} disabled={loading}>
        {loading ? <span className="spinner spinner-dark" /> : <>{Icons.stats} Generate Report</>}
      </button>

      {data && (
        <div className="fade-in">
          <ReportActions
            pdfDocument={<DriverEarningsPDF data={data} />}
            fileName={`dispatch-driver-earnings-${new Date().toISOString().slice(0, 10)}.pdf`}
            onPrint={onPrint}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <SummaryCard label="Total Drivers" value={fmtNum(data.count)} />
            <SummaryCard label="Total Paid Out" value={fmt(data.totals.totalPaidToDrivers)} color="var(--orange)" />
            <SummaryCard label="Trips Done" value={fmtNum(data.totals.tripsCompleted)} color="var(--success)" />
          </div>
          <ReportTable
            headers={["#", "Driver", "Vehicle", "Plate", "Status", "Trips", "Earned", "Fares", "Wallet", "Distance", "Rating"]}
            rows={rows}
          />
        </div>
      )}
    </div>
  );
}

function PassengerActivityReport({ onPrint }: { onPrint: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const { data: d } = await adminApi.getReportPassengerActivity();
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  const rows = (data?.rows ?? []).map((r: any, i: number) => [
    <span style={{ fontWeight: 700, color: "var(--teal-mid)", fontSize: 12 }}>#{i + 1}</span>,
    <div>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.fullName}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.passengerId}</div>
    </div>,
    r.phone,
    fmtNum(r.totalTrips),
    <span style={{ color: "var(--success)", fontWeight: 600 }}>{fmtNum(r.completedTrips)}</span>,
    <span style={{ color: "var(--danger)" }}>{fmtNum(r.cancelledTrips)}</span>,
    <span style={{ fontWeight: 700, color: "var(--orange)" }}>{fmt(r.totalSpent)}</span>,
    fmt(r.walletBalance),
    r.avgRatingGiven !== null ? `${r.avgRatingGiven} ★` : "—",
    r.lastTripDate ? fmtDate(r.lastTripDate) : "—",
  ]);

  return (
    <div>
      <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={generate} disabled={loading}>
        {loading ? <span className="spinner spinner-dark" /> : <>{Icons.user} Generate Report</>}
      </button>

      {data && (
        <div className="fade-in">
          <ReportActions
            pdfDocument={<PassengerActivityPDF data={data} />}
            fileName={`dispatch-passenger-activity-${new Date().toISOString().slice(0, 10)}.pdf`}
            onPrint={onPrint}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <SummaryCard label="Total Passengers" value={fmtNum(data.count)} />
            <SummaryCard label="Total Revenue" value={fmt(data.totals.totalRevenue)} color="var(--orange)" />
            <SummaryCard label="Total Trips" value={fmtNum(data.totals.totalTrips)} color="var(--teal-mid)" />
          </div>
          <ReportTable
            headers={["#", "Passenger", "Phone", "Trips", "Done", "Cancelled", "Spent", "Wallet", "Avg Rating", "Last Trip"]}
            rows={rows}
          />
        </div>
      )}
    </div>
  );
}

function PlatformRevenueReport({ onPrint }: { onPrint: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);

  async function generate() {
    setLoading(true);
    try {
      const { data: d } = await adminApi.getReportPlatformRevenue(days);
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  const dailyRows = (data?.dailyRows ?? []).map((r: any) => [
    fmtDate(r.date),
    fmtNum(r.trips),
    <span style={{ color: "var(--success)", fontWeight: 600 }}>{fmtNum(r.completed)}</span>,
    <span style={{ color: "var(--danger)" }}>{fmtNum(r.cancelled)}</span>,
    fmt(r.grossRevenue),
    fmt(r.driverPayouts),
    <span style={{ fontWeight: 700, color: "var(--teal)" }}>{fmt(r.commission)}</span>,
    `${r.kmCovered.toFixed(1)} km`,
  ]);

  return (
    <div>
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="input-wrap" style={{ marginBottom: 12 }}>
          <label className="input-label">Period</label>
          <select className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {PERIOD_OPTIONS.map((d) => (
              <option key={d} value={d}>Last {d} days</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>
          {loading ? <span className="spinner spinner-dark" /> : <>{Icons.stats} Generate Report</>}
        </button>
      </div>

      {data && (
        <div className="fade-in">
          <ReportActions
            pdfDocument={<PlatformRevenuePDF data={data} />}
            fileName={`dispatch-platform-revenue-${new Date().toISOString().slice(0, 10)}.pdf`}
            onPrint={onPrint}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <SummaryCard label="Gross Revenue" value={fmt(data.summary.grossRevenue)} color="var(--orange)" />
            <SummaryCard label="Commission" value={fmt(data.summary.totalCommission)} color="var(--teal)" />
            <SummaryCard label="Driver Payouts" value={fmt(data.summary.totalDriverPayouts)} color="var(--teal-mid)" />
            <SummaryCard label="Avg Trip Value" value={fmt(data.summary.avgTripValue)} color="var(--success)" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <SummaryCard label="Total Trips" value={fmtNum(data.summary.totalTrips)} />
            <SummaryCard label="Completed" value={fmtNum(data.summary.completedTrips)} color="var(--success)" />
            <SummaryCard label="km Covered" value={`${data.summary.totalKmCovered} km`} color="var(--teal-mid)" />
          </div>

          <div style={{ background: "var(--teal-dim)", borderRadius: "var(--r-lg)", padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--teal)", marginBottom: 8 }}>Wallet Overview</div>
            <div className="flex justify-between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total Deposits</span>
              <span style={{ fontWeight: 600 }}>{fmt(data.summary.totalDeposits)}</span>
            </div>
            <div className="flex justify-between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Total Withdrawals</span>
              <span style={{ fontWeight: 600 }}>{fmt(data.summary.totalWithdrawals)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Platform Wallet Balance</span>
              <span style={{ fontWeight: 700, color: "var(--teal)" }}>{fmt(data.summary.totalWalletBalance)}</span>
            </div>
          </div>

          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Daily Breakdown</div>
          <ReportTable
            headers={["Date", "Trips", "Completed", "Cancelled", "Revenue", "Payouts", "Commission", "Distance"]}
            rows={dailyRows}
          />
        </div>
      )}
    </div>
  );
}

// ── Main reports page ─────────────────────────────────────────────────────────

export default function ReportsPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<ReportKey | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const activeReport = REPORTS.find((r) => r.key === active);

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>DISPATCH — ${activeReport?.title ?? "Report"}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Helvetica, Arial, sans-serif; background: #e8f2f3; color: #0d2d35; font-size: 12px; }
            .header { background: #0d4f5c; padding: 28px 36px 24px; margin-bottom: 20px; }
            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
            .header-brand .title { color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 2px; }
            .header-brand .tagline { color: rgba(255,255,255,0.5); font-size: 10px; margin-top: 4px; }
            .header-meta { text-align: right; }
            .header-meta p { color: rgba(255,255,255,0.5); font-size: 10px; margin-bottom: 2px; }
            .header-divider { border-bottom: 1px solid rgba(255,255,255,0.15); margin-bottom: 12px; }
            .header-report { color: #fff; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
            .header-desc { color: rgba(255,255,255,0.65); font-size: 11px; }
            .body { padding: 0 24px 32px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #ddeef0; margin-top: 8px; }
            thead tr { background: #0d4f5c; }
            th { padding: 9px 8px; color: rgba(255,255,255,0.85); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; text-align: left; }
            td { padding: 8px 8px; font-size: 10px; color: #0d2d35; border-bottom: 1px solid #ddeef0; }
            tr:nth-child(even) td { background: #f4fafa; }
            tr:nth-child(odd) td { background: #fff; }
            .footer { margin: 24px 24px 0; padding-top: 8px; border-top: 1px solid #ddeef0; display: flex; justify-content: space-between; font-size: 9px; color: #8fa8ae; }
            .report-actions, .btn, .input-wrap, .input-label, select, input { display: none !important; }
            .card { background: #fff; border-radius: 10px; padding: 16px; border: 1px solid #ddeef0; margin-bottom: 16px; }
            @media print { body { background: #e8f2f3; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-top">
              <div class="header-brand">
                <div class="title">DISPATCH</div>
                <div class="tagline">Fast, safe, reliable rides across Lesotho</div>
              </div>
              <div class="header-meta">
                <p>Generated: ${new Date().toLocaleString("en-LS")}</p>
              </div>
            </div>
            <div class="header-divider"></div>
            <div class="header-report">${activeReport?.title ?? "Report"}</div>
            <div class="header-desc">${activeReport?.description ?? ""}</div>
          </div>
          <div class="body">
            ${content.innerHTML}
          </div>
          <div class="footer">
            <span>DISPATCH — Confidential Report</span>
            <span>${activeReport?.title ?? ""} · ${new Date().toLocaleDateString("en-LS")}</span>
          </div>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  }

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 20 }}>
        <PageHeader
          title="Reports"
          onBack={active ? () => setActive(null) : () => navigate("/admin")}
          dark
          right={
            active ? (
              <button
                onClick={handlePrint}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "var(--r-md)", padding: "8px 14px", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "var(--font)", display: "flex", alignItems: "center", gap: 6 }}
              >
                {Icons.document} Print
              </button>
            ) : undefined
          }
        />
        {active && (
          <div style={{ padding: "0 20px" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
              {activeReport?.description}
            </div>
          </div>
        )}
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 20, paddingBottom: 40 }}>
        {!active && (
          <div className="flex-col gap-3">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Select a Report</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
              All reports draw data from multiple tables. Use the Print or Download PDF button after generating.
            </div>
            {REPORTS.map((r, i) => (
              <button
                key={r.key}
                onClick={() => setActive(r.key)}
                className="card"
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", border: "none", cursor: "pointer", textAlign: "left", width: "100%", animation: `slideUp ${200 + i * 60}ms cubic-bezier(0.4,0,0.2,1) both` }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "var(--r-lg)", background: `${r.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: r.color, flexShrink: 0 }}>
                  {r.icon}
                </div>
                <div className="flex-1">
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{r.title} Report</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{r.description}</div>
                </div>
                <span style={{ color: "var(--text-muted)" }}>{Icons.chevronRight}</span>
              </button>
            ))}
          </div>
        )}

        {active && (
          <div ref={printRef} className="fade-in">
            {active === "trip-summary" && <TripSummaryReport onPrint={handlePrint} />}
            {active === "driver-earnings" && <DriverEarningsReport onPrint={handlePrint} />}
            {active === "passenger-activity" && <PassengerActivityReport onPrint={handlePrint} />}
            {active === "platform-revenue" && <PlatformRevenueReport onPrint={handlePrint} />}
          </div>
        )}
      </div>
    </div>
  );
}
