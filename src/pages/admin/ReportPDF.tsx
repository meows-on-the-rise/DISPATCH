import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Image,
} from "@react-pdf/renderer";

// ── Theme ─────────────────────────────────────────────────────────────────────

const DARK   = "#0d2d35";
const TEAL   = "#0d7a8a";
const ORANGE = "#f97316";
const MUTED  = "#8fa8ae";
const LIGHT  = "#f4fafa";
const WHITE  = "#ffffff";

const styles = StyleSheet.create({
  page:        { fontFamily: "Helvetica", backgroundColor: WHITE, padding: 0 },
  header:      { backgroundColor: DARK, padding: "24 32 20", marginBottom: 0 },
  headerTitle: { color: WHITE, fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  headerSub:   { color: MUTED, fontSize: 9, marginTop: 4 },
  headerDesc:  { color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 6 },
  body:        { padding: "20 32 32" },

  // Summary cards
  summaryRow:  { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: LIGHT, borderRadius: 8, padding: "10 12", alignItems: "center" },
  summaryLabel:{ fontSize: 8, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  summaryValue:{ fontSize: 15, fontFamily: "Helvetica-Bold", color: DARK },

  // Table
  table:       { borderRadius: 8, overflow: "hidden", marginTop: 8 },
  thead:       { flexDirection: "row", backgroundColor: DARK },
  th:          { flex: 1, padding: "8 10", color: WHITE, fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  row:         { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e8f2f3" },
  rowEven:     { backgroundColor: LIGHT },
  rowOdd:      { backgroundColor: WHITE },
  td:          { flex: 1, padding: "7 10", fontSize: 9, color: DARK },

  sectionTitle:{ fontSize: 12, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 8, marginTop: 16 },
  accent:      { color: ORANGE, fontFamily: "Helvetica-Bold" },
  teal:        { color: TEAL,   fontFamily: "Helvetica-Bold" },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt     = (n: number) => `M ${Number(n).toFixed(2)}`;
const fmtNum  = (n: number) => Number(n).toLocaleString();
const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-LS", { day: "numeric", month: "short", year: "numeric" });

function Header({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>DISPATCH</Text>
      <Text style={styles.headerSub}>Generated: {new Date().toLocaleString("en-LS")}</Text>
      <Text style={styles.headerDesc}>{title} — {description}</Text>
    </View>
  );
}

function SummaryRow({ items }: { items: { label: string; value: string; color?: string }[] }) {
  return (
    <View style={styles.summaryRow}>
      {items.map(({ label, value, color }) => (
        <View key={label} style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{label}</Text>
          <Text style={[styles.summaryValue, color ? { color } : {}]}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <View style={styles.table}>
      <View style={styles.thead}>
        {headers.map(h => <Text key={h} style={styles.th}>{h}</Text>)}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={[styles.row, i % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
          {row.map((cell, j) => <Text key={j} style={styles.td}>{cell}</Text>)}
        </View>
      ))}
      {rows.length === 0 && (
        <View style={styles.row}>
          <Text style={[styles.td, { color: MUTED, textAlign: "center" }]}>No data available</Text>
        </View>
      )}
    </View>
  );
}

// ── PDF Documents ─────────────────────────────────────────────────────────────

export function TripSummaryPDF({ data }: { data: any }) {
  const rows = (data?.rows ?? []).map((r: any) => [
    `#${r.tripId.slice(-8)}`,
    r.passengerName,
    r.driverName ?? "—",
    r.pickupAddress.slice(0, 24),
    r.dropoffAddress.slice(0, 24),
    `${r.distanceKm.toFixed(1)} km`,
    fmt(r.totalPrice),
    fmt(r.systemCommission),
    r.status.replace(/_/g, " "),
    fmtDate(r.createdAt),
  ]);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header title="Trip Summary Report" description={`${data?.count ?? 0} trips`} />
        <View style={styles.body}>
          <SummaryRow items={[
            { label: "Total Trips",  value: fmtNum(data?.count ?? 0) },
            { label: "Showing",      value: `${data?.rows?.length ?? 0} trips`, color: TEAL },
            { label: "Generated",    value: new Date().toLocaleTimeString("en-LS", { hour: "2-digit", minute: "2-digit" }), color: ORANGE },
          ]} />
          <Table
            headers={["Trip ID", "Passenger", "Driver", "Pickup", "Dropoff", "Distance", "Total", "Commission", "Status", "Date"]}
            rows={rows}
          />
        </View>
      </Page>
    </Document>
  );
}

export function DriverEarningsPDF({ data }: { data: any }) {
  const rows = (data?.rows ?? []).map((r: any, i: number) => [
    `#${i + 1}`,
    r.fullName,
    r.vehicle,
    r.plate,
    r.isVerified ? "Verified" : "Pending",
    fmtNum(r.tripsCompleted),
    fmt(r.totalEarned),
    fmt(r.walletBalance),
    `${r.totalKm} km`,
    `${r.avgRating.toFixed(1)} ★`,
  ]);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header title="Driver Earnings Report" description={`${data?.count ?? 0} drivers`} />
        <View style={styles.body}>
          <SummaryRow items={[
            { label: "Total Drivers", value: fmtNum(data?.count ?? 0) },
            { label: "Total Paid Out", value: fmt(data?.totals?.totalPaidToDrivers ?? 0), color: ORANGE },
            { label: "Trips Done", value: fmtNum(data?.totals?.tripsCompleted ?? 0), color: TEAL },
          ]} />
          <Table
            headers={["#", "Driver", "Vehicle", "Plate", "Status", "Trips", "Earned", "Wallet", "Distance", "Rating"]}
            rows={rows}
          />
        </View>
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
        <Header title="Passenger Activity Report" description={`${data?.count ?? 0} passengers`} />
        <View style={styles.body}>
          <SummaryRow items={[
            { label: "Total Passengers", value: fmtNum(data?.count ?? 0) },
            { label: "Total Revenue", value: fmt(data?.totals?.totalRevenue ?? 0), color: ORANGE },
            { label: "Total Trips", value: fmtNum(data?.totals?.totalTrips ?? 0), color: TEAL },
          ]} />
          <Table
            headers={["#", "Passenger", "Phone", "Trips", "Done", "Cancelled", "Spent", "Wallet", "Avg Rating", "Last Trip"]}
            rows={rows}
          />
        </View>
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
    `${r.kmCovered.toFixed(1)} km`,
  ]);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Header title="Platform Revenue Report" description={`Last ${data?.days ?? 30} days`} />
        <View style={styles.body}>
          <SummaryRow items={[
            { label: "Gross Revenue",  value: fmt(data?.summary?.grossRevenue ?? 0),       color: ORANGE },
            { label: "Commission",     value: fmt(data?.summary?.totalCommission ?? 0),     color: TEAL },
            { label: "Driver Payouts", value: fmt(data?.summary?.totalDriverPayouts ?? 0),  color: MUTED },
            { label: "Total Trips",    value: fmtNum(data?.summary?.totalTrips ?? 0) },
          ]} />
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          <Table
            headers={["Date", "Trips", "Completed", "Cancelled", "Revenue", "Payouts", "Commission", "Distance"]}
            rows={rows}
          />
        </View>
      </Page>
    </Document>
  );
}
