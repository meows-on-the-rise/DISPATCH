import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { tripApi, walletApi } from "../../api/client";
import { Icons, TicketCard } from "../../components/shared";
import { Trip } from "../../store/tripStore";

interface Transaction { id: string; type: string; amount: number; description: string; createdAt: string; }

export default function ActivityPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"trips" | "payments">("trips");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([tripApi.getHistory(), walletApi.getTransactions()])
      .then(([t, tx]) => { setTrips(t.data); setTransactions(tx.data); })
      .finally(() => setLoading(false));
  }, []);

  const backPath = location.pathname.startsWith("/driver") ? "/driver" : "/passenger";

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 24 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <button className="btn-icon-dark" onClick={() => navigate(backPath)}>{Icons.back}</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>Activity</span>
        </div>
        {/* Tab switch */}
        <div className="tab-switch">
          {(["trips", "payments"] as const).map(t => (
            <button key={t} className={`tab-switch-item ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}>
              {t === "trips" ? "Trip Logs" : "Payment Logs"}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 20, paddingBottom: 32 }}>
        {loading && <div className="flex justify-center" style={{ padding: 32 }}><span className="spinner" /></div>}

        {/* Trip logs */}
        {!loading && tab === "trips" && (
          <div className="flex-col gap-3">
            {trips.length === 0 && (
              <div className="card text-center" style={{ padding: 40 }}>
                <div style={{ color: "var(--teal)", marginBottom: 12 }}>{Icons.car}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>No trips yet</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Your trip history will appear here</div>
              </div>
            )}
            {trips.map(trip => (
              <TicketCard key={trip.id}
                from={trip.pickupAddress} to={trip.dropoffAddress}
                price={trip.totalPrice ? Number(trip.totalPrice) : undefined}
                distance={trip.distanceKm} duration={trip.durationMin}
                status={trip.status}
                date={new Date(trip.createdAt).toLocaleDateString("en-LS", { day: "numeric", month: "short" })} />
            ))}
          </div>
        )}

        {/* Payment logs */}
        {!loading && tab === "payments" && (
          <div className="flex-col gap-2">
            {transactions.length === 0 && (
              <div className="card text-center" style={{ padding: 40 }}>
                <div style={{ color: "var(--teal)", marginBottom: 12 }}>{Icons.wallet}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>No transactions yet</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Your payment history will appear here</div>
              </div>
            )}
            {transactions.map(tx => {
              const isCredit = ["DEPOSIT", "TRIP_EARNING", "REFUND"].includes(tx.type);
              return (
                <div key={tx.id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "var(--r-md)",
                    background: isCredit ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isCredit ? "var(--success)" : "var(--orange)", flexShrink: 0,
                  }}>
                    {tx.type === "TRIP_PAYMENT" || tx.type === "TRIP_EARNING" ? Icons.car : Icons.wallet}
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{tx.description ?? tx.type.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {new Date(tx.createdAt).toLocaleString("en-LS", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: isCredit ? "var(--success)" : "var(--danger)" }}>
                    {isCredit ? "+" : "-"}M {Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
