import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { tripApi, walletApi } from "../../api/client";
import { PageHeader } from "../../components/shared";
import { Trip } from "../../store/tripStore";

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Completed", CANCELLED: "Cancelled", IN_PROGRESS: "In Progress",
  REQUESTED: "Requested", DRIVER_ASSIGNED: "Driver Assigned", DRIVER_ARRIVED: "Driver Arrived",
};
const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "var(--teal)", CANCELLED: "var(--danger)", IN_PROGRESS: "var(--purple-light)",
  REQUESTED: "var(--warning)", DRIVER_ASSIGNED: "var(--warning)", DRIVER_ARRIVED: "var(--warning)",
};

interface Transaction { id: string; type: string; amount: number; description: string; createdAt: string; }

export default function ActivityPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"trips" | "payments">("trips");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [tripsRes, txRes] = await Promise.all([tripApi.getHistory(), walletApi.getTransactions()]);
        setTrips(tripsRes.data);
        setTransactions(txRes.data);
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="app-shell">
      <PageHeader title="Activity" onBack={() => navigate("/passenger")} />

      {/* Tab switcher */}
      <div className="flex px-4" style={{ gap: 0, marginBottom: 16 }}>
        {(["trips", "payments"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "10px 0", background: "none", border: "none",
            borderBottom: `2px solid ${tab === t ? "var(--purple)" : "var(--border-subtle)"}`,
            color: tab === t ? "var(--purple-light)" : "var(--text-muted)",
            fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, cursor: "pointer",
            transition: "var(--transition)",
          }}>
            {t === "trips" ? "🚕 Trip Logs" : "💳 Payment Logs"}
          </button>
        ))}
      </div>

      <div className="scroll-area flex-1 px-4">
        {loading && <div className="flex justify-center" style={{ padding: 32 }}><span className="spinner" /></div>}

        {/* Trip logs */}
        {!loading && tab === "trips" && (
          <div className="flex-col gap-3" style={{ paddingBottom: 24 }}>
            {trips.length === 0 && <p className="text-center text-muted" style={{ padding: 32, fontSize: 14 }}>No trips yet</p>}
            {trips.map((trip) => (
              <div key={trip.id} className="card" style={{ padding: "16px" }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: STATUS_COLOR[trip.status] ?? "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {STATUS_LABEL[trip.status] ?? trip.status}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {new Date(trip.createdAt).toLocaleDateString("en-LS", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>
                  📍 {trip.pickupAddress}
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  🏁 {trip.dropoffAddress}
                </div>
                {trip.totalPrice && (
                  <div className="flex justify-between items-center" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {trip.distanceKm?.toFixed(1)} km · {Math.round(trip.durationMin ?? 0)} min
                    </span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--teal)", fontSize: 16 }}>
                      M {Number(trip.totalPrice).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Payment logs */}
        {!loading && tab === "payments" && (
          <div className="flex-col gap-2" style={{ paddingBottom: 24 }}>
            {transactions.length === 0 && <p className="text-center text-muted" style={{ padding: 32, fontSize: 14 }}>No payments yet</p>}
            {transactions.map((tx) => (
              <div key={tx.id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>
                  {tx.type === "DEPOSIT" ? "⬇️" : tx.type === "TRIP_PAYMENT" ? "🚕" : "↩️"}
                </span>
                <div className="flex-1">
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{tx.description ?? tx.type}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {new Date(tx.createdAt).toLocaleString("en-LS", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <span style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15,
                  color: tx.type === "TRIP_PAYMENT" ? "var(--danger)" : "var(--teal)",
                }}>
                  {tx.type === "TRIP_PAYMENT" ? "-" : "+"}M {Number(tx.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
