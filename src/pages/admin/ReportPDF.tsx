import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// ── Theme (matches Dispatch app exactly) ──────────────────────────────────────

const BG_DARK   = "#0d4f5c"; // dark teal header
const BG_BASE   = "#e8f2f3"; // light blue-grey page bg
const BG_WHITE  = "#ffffff"; // card white
const BG_LIGHT  = "#f4fafa"; // alternating row
const TEAL      = "#0d7a8a"; // teal accent
const TEAL_MID  = "#1a9aaa"; // mid teal
const ORANGE    = "#f97316"; // orange accent
const DARK      = "#0d2d35"; // primary text
const MUTED     = "#8fa8ae"; // muted text
const BORDER    = "#ddeef0"; // border color
const SUCCESS   = "#16a34a"; // green
const DANGER    = "#dc2626"; // red

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: BG_BASE,
    padding: 0,
    fontSize: 9,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: BG_DARK,
    padding: "28 36 24",
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerBrand: {
    flexDirection: "column",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
  },
  headerTagline: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 8,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  headerMeta: {
    alignItems: "flex-end",
  },
  headerMetaText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 8,
    marginBottom: 2,
  },
  headerReportName: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
    marginBottom: 12,
  },
  headerDesc: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 9,
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  // ── Summary cards ─────────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: BG_WHITE,
    borderRadius: 10,
    padding: "12 10",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  summaryLabel: {
    fontSize: 7,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textAlign: "center",
  },

  // ── Section title ─────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 10,
    marginTop: 16,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: ORANGE,
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  table: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
  },
  thead: {
    flexDirection: "row",
    backgroundColor: BG_DARK,
  },
  th: {
    flex: 1,
    padding: "9 8",
    color: "rgba(255,255,255,0.85)",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  rowEven: { backgroundColor: BG_WHITE },
  rowOdd:  { backgroundColor: BG_LIGHT },
  td: {
    flex: 1,
    padding: "8 8",
    fontSize: 8,
    color: DARK,
  },
  tdMuted: {
    color: MUTED,
    fontSize: 7,
  },
  noData: {
    padding: "20 0",
    textAlign: "center",
    color: MUTED,
    fontSize: 9,
  },

  // ── Wallet box ────────────────────────────────────────────────────────────
  walletBox: {
    backgroundColor: BG_WHITE,
    borderRadius: 10,
    padding: "14 16",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    borderLeftColor: TEAL,
  },
  walletTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: TEAL,
    marginBottom: 10,
  },
  walletRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  walletLabel: { fontSize: 8, color: MUTED },
  walletValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: DARK },
  walletValueAccent: { fontSize: 9, fontFamily: "Helvetica-Bold", color: TEAL },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 20,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: MUTED,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt     = (n: number) => `M ${Number(n).toFixed(2)}`;
const fmtNum  = (n: number) => Number(n).toLocaleString();
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-LS", {
    day: "numeric", month: "short", year: "numeric",
  });

// ── Shared components ─────────────────────────────────────────────────────────

function Header({
  title,
  description,
  meta,
}: {
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerBrand}>
          <Text style={styles.headerTitle}>DISPATCH</Text>
          <Text style={styles.headerTagline}>Fast, safe, reliable rides across Lesotho</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.headerMetaText}>
            Generated: {new Date().toLocaleString("en-LS")}
          </Text>
          {meta && <Text style={styles.headerMetaText}>{meta}</Text>}
        </View>
      </View>
      <View style={styles.headerDivider} />
      <Text style={styles.headerReportName}>{title}</Text>
      <Text style={styles.headerDesc}>{description}</Text>
    </View>
  );
}

function SummaryRow({
  items,
}: {
  items: { label: string; value: string; color?: string }[];
}) {
  return (
    <View style={styles.summaryRow}>
      {items.map(({ label, value, color }) => (
        <View key={label} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{label}</Text>
          <Text style={[styles.summaryValue, color ? { color } : {}]}>
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Table({
  headers,
  rows,
  widths,
}: {
  headers: string[];
  rows: string[][];
  widths?: number[];
}) {
  return (
    <View style={styles.table}>
      <View style={styles.thead}>
        {headers.map((h, i) => (
          <Text
            key={h}
            style={[styles.th, widths ? { flex: widths[i] } : {}]}
          >
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View
          key={i}
          style={[styles.row, i % 2 === 0 ? styles.rowEven : styles.rowOdd]}
        >
          {row.map((cell, j) => (
            <Text
              key={j}
              style={[styles.td, widths ? { flex: widths[j] } : {}]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
      {rows.length === 0 && (
        <Text style={styles.noData}>No data available</Text>
      )}
    </View>
  );
}

function Footer({ page }: { page: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        DISPATCH — Confidential Report
      </Text>
      <Text style={styles.footerText}>{page}</Text>
    </View>
  );
}

// ── PDF Documents ─────────────────────────────────────────────────────────────

export function TripSummaryPDF({ data }: { data: any }) {
  const rows = (data?.rows ?? []).map((r: any) => [
    `#${r.tripId.slice(-8)}`,
    r.passengerName,
    r.driverName ?? "—",
    r.pickupAddress.slice(0, 22),
    r.dropoffAddress.slice(0, 22),
    `${Number(r.distanceKm).toFixed(1)} km`,
    fmt(r.totalPrice),
    fmt(r.systemCommission),
    r.status.replace(/_/g, " "),
    fmtDate(r.createdAt),
  ]);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header
          title="Trip Summary Report"
          description="All trips with passenger, driver, fare breakdown and status"
          meta={`${data?.count ?? 0} trips total`}
        />
        <View style={styles.body}>
          <SummaryRow
            items={[
              { label: "Total Trips",  value: fmtNum(data?.count ?? 0),                                                        color: DARK   },
              { label: "Showing",      value: `${data?.rows?.length ?? 0} records`,                                            color: TEAL   },
              { label: "Generated At", value: new Date().toLocaleTimeString("en-LS", { hour: "2-digit", minute: "2-digit" }), color: ORANGE },
            ]}
          />
          <Text style={styles.sectionTitle}>Trip Records</Text>
          <Table
            headers={["Trip ID", "Passenger", "Driver", "Pickup", "Dropoff", "Distance", "Total", "Commission", "Status", "Date"]}
            rows={rows}
            widths={[1.2, 1.2, 1.2, 1.5, 1.5, 0.9, 1, 1, 1.2, 1]}
          />
        </View>
        <Footer page={`Trip Summary · ${fmtDate(new Date().toISOString())}`} />
      </Page>
    </Document>
  );
}

export function DriverEarningsPDF({ data }: { data: any }) {
  const rows = (data?.rows ?? []).map((r: any, i: number) => [
    `#${i + 1}`,
    r.fullName,
    r.vehicle ?? "—",
    r.plate ?? "—",
    r.isVerified ? "Verified" : "Pending",
    fmtNum(r.tripsCompleted),
    fmt(r.totalEarned),
    fmt(r.totalFaresGenerated ?? 0),
    fmt(r.walletBalance),
    `${r.totalKm} km`,
    `${Number(r.avgRating).toFixed(1)} ★`,
  ]);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header
          title="Driver Earnings Report"
          description="Per-driver earnings, trips completed, distance and ratings"
          meta={`${data?.count ?? 0} drivers`}
        />
        <View style={styles.body}>
          <SummaryRow
            items={[
              { label: "Total Drivers",   value: fmtNum(data?.count ?? 0),                              color: DARK   },
              { label: "Total Paid Out",  value: fmt(data?.totals?.totalPaidToDrivers ?? 0),             color: ORANGE },
              { label: "Trips Completed", value: fmtNum(data?.totals?.tripsCompleted ?? 0),              color: TEAL   },
            ]}
          />
          <Text style={styles.sectionTitle}>Driver Breakdown</Text>
          <Table
            headers={["#", "Driver", "Vehicle", "Plate", "Status", "Trips", "Earned", "Fares", "Wallet", "Distance", "Rating"]}
            rows={rows}
            widths={[0.4, 1.4, 1.2, 0.9, 0.9, 0.7, 1, 1, 1, 0.9, 0.8]}
          />
        </View>
        <Footer page={`Driver Earnings · ${fmtDate(new Date().toISOString())}`} />
      </Page>
    </Document>
  );
}

export function PassengerActivityPDF({ data }: { data: any }) {
  const rows = (data?.rows ?? []).map((r: any, i: number) => [
    `#${i + 1}`,
    r.fullName,
    r.phone,
    fmtNum(r.totalTrips),
    fmtNum(r.completedTrips),
    fmtNum(r.cancelledTrips),
    fmt(r.totalSpent),
    fmt(r.walletBalance),
    r.avgRatingGiven !== null ? `${r.avgRatingGiven} ★` : "—",
    r.lastTripDate ? fmtDate(r.lastTripDate) : "—",
  ]);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header
          title="Passenger Activity Report"
          description="Per-passenger spend, trip history and wallet balance"
          meta={`${data?.count ?? 0} passengers`}
        />
        <View style={styles.body}>
          <SummaryRow
            items={[
              { label: "Total Passengers", value: fmtNum(data?.count ?? 0),                    color: DARK   },
              { label: "Total Revenue",    value: fmt(data?.totals?.totalRevenue ?? 0),          color: ORANGE },
              { label: "Total Trips",      value: fmtNum(data?.totals?.totalTrips ?? 0),         color: TEAL   },
            ]}
          />
          <Text style={styles.sectionTitle}>Passenger Breakdown</Text>
          <Table
            headers={["#", "Passenger", "Phone", "Trips", "Done", "Cancelled", "Spent", "Wallet", "Avg Rating", "Last Trip"]}
            rows={rows}
            widths={[0.4, 1.4, 1.1, 0.7, 0.7, 0.9, 1, 1, 0.9, 1]}
          />
        </View>
        <Footer page={`Passenger Activity · ${fmtDate(new Date().toISOString())}`} />
      </Page>
    </Document>
  );
}

export function PlatformRevenuePDF({ data }: { data: any }) {
  const rows = (data?.dailyRows ?? []).map((r: any) => [
    fmtDate(r.date),
    fmtNum(r.trips),
    fmtNum(r.completed),
    fmtNum(r.cancelled),
    fmt(r.grossRevenue),
    fmt(r.driverPayouts),
    fmt(r.commission),
    `${Number(r.kmCovered).toFixed(1)} km`,
  ]);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header
          title="Platform Revenue Report"
          description="Daily revenue, payouts, commission and wallet stats"
          meta={`Last ${data?.days ?? 30} days`}
        />
        <View style={styles.body}>
          {/* Top summary */}
          <SummaryRow
            items={[
              { label: "Gross Revenue",  value: fmt(data?.summary?.grossRevenue ?? 0),      color: ORANGE },
              { label: "Commission",     value: fmt(data?.summary?.totalCommission ?? 0),    color: TEAL   },
              { label: "Driver Payouts", value: fmt(data?.summary?.totalDriverPayouts ?? 0), color: TEAL_MID },
              { label: "Avg Trip Value", value: fmt(data?.summary?.avgTripValue ?? 0),       color: DARK   },
            ]}
          />
          <SummaryRow
            items={[
              { label: "Total Trips",  value: fmtNum(data?.summary?.totalTrips ?? 0)                       },
              { label: "Completed",    value: fmtNum(data?.summary?.completedTrips ?? 0),  color: SUCCESS  },
              { label: "km Covered",   value: `${data?.summary?.totalKmCovered ?? 0} km`, color: TEAL_MID },
            ]}
          />

          {/* Wallet box */}
          <View style={styles.walletBox}>
            <Text style={styles.walletTitle}>Wallet Overview</Text>
            <View style={styles.walletRow}>
              <Text style={styles.walletLabel}>Total Deposits</Text>
              <Text style={styles.walletValue}>{fmt(data?.summary?.totalDeposits ?? 0)}</Text>
            </View>
            <View style={styles.walletRow}>
              <Text style={styles.walletLabel}>Total Withdrawals</Text>
              <Text style={styles.walletValue}>{fmt(data?.summary?.totalWithdrawals ?? 0)}</Text>
            </View>
            <View style={styles.walletRow}>
              <Text style={styles.walletLabel}>Platform Wallet Balance</Text>
              <Text style={styles.walletValueAccent}>{fmt(data?.summary?.totalWalletBalance ?? 0)}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          <Table
            headers={["Date", "Trips", "Completed", "Cancelled", "Revenue", "Payouts", "Commission", "Distance"]}
            rows={rows}
            widths={[1.2, 0.8, 1, 0.9, 1.1, 1.1, 1.1, 1]}
          />
        </View>
        <Footer page={`Platform Revenue · ${fmtDate(new Date().toISOString())}`} />
      </Page>
    </Document>
  );
}
