import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { tripApi, walletApi, userApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { Icons, TicketCard, StarRating, Avatar } from "../../components/shared";
import { Trip } from "../../store/tripStore";

interface Transaction {
  id: string; type: string; amount: number; description: string; createdAt: string;
}

interface Review {
  id: string;
  score: number;
  review?: string;
  createdAt: string;
  reviewer?: { fullName: string; avatarUrl?: string };
  reviewee?: { fullName: string; avatarUrl?: string };
}

export default function ActivityPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"trips" | "payments" | "reviews">("trips");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const backPath = location.pathname.startsWith("/driver") ? "/driver" : "/passenger";

  useEffect(() => {
    setLoading(true);
    const requests: Promise<unknown>[] = [
      tripApi.getHistory(),
      walletApi.getTransactions(),
    ];
    if (user?.id) requests.push(userApi.getReviews(user.id));

    Promise.all(requests)
      .then(([t, tx, rv]) => {
        setTrips((t as { data: Trip[] }).data);
        setTransactions((tx as { data: Transaction[] }).data);
        if (rv) setReviews((rv as { data: Review[] }).data);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 24 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <button className="btn-icon-dark" onClick={() => navigate(backPath)}>{Icons.back}</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>Activity</span>
        </div>
        <div className="tab-switch">
          {(["trips", "payments", "reviews"] as const).map(t => (
            <button key={t} className={`tab-switch-item ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}>
              {t === "trips" ? "Trips" : t === "payments" ? "Payments" : "Reviews"}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 20, paddingBottom: 32 }}>
        {loading && (
          <div className="flex justify-center" style={{ padding: 32 }}>
            <span className="spinner" />
          </div>
        )}

        {/* ── Trip logs ── */}
        {!loading && tab === "trips" && (
          <div className="flex-col gap-3">
            {trips.length === 0 ? (
              <div className="card text-center" style={{ padding: 40 }}>
                <div style={{ color: "var(--teal)", marginBottom: 12 }}>{Icons.car}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>No trips yet</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Your trip history will appear here</div>
              </div>
            ) : trips.map(trip => (
              <TicketCard key={trip.id}
                from={trip.pickupAddress} to={trip.dropoffAddress}
                price={trip.totalPrice ? Number(trip.totalPrice) : undefined}
                distance={trip.distanceKm} duration={trip.durationMin}
                status={trip.status}
                date={new Date(trip.createdAt).toLocaleDateString("en-LS", { day: "numeric", month: "short" })} />
            ))}
          </div>
        )}

        {/* ── Payment logs ── */}
        {!loading && tab === "payments" && (
          <div className="flex-col gap-2">
            {transactions.length === 0 ? (
              <div className="card text-center" style={{ padding: 40 }}>
                <div style={{ color: "var(--teal)", marginBottom: 12 }}>{Icons.wallet}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>No transactions yet</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Your payment history will appear here</div>
              </div>
            ) : transactions.map(tx => {
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

        {/* ── Reviews ── */}
        {!loading && tab === "reviews" && (
          <div className="flex-col gap-3">
            {reviews.length === 0 ? (
              <div className="card text-center" style={{ padding: 40 }}>
                <div style={{ color: "var(--teal)", marginBottom: 12 }}>{Icons.star}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>No reviews yet</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Reviews from your trips will appear here</div>
              </div>
            ) : reviews.map(r => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: { id: string; score: number; review?: string; createdAt: string; reviewer?: { fullName: string; avatarUrl?: string } } }) {
  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      <div className="flex items-center gap-3" style={{ marginBottom: review.review ? 10 : 0 }}>
        <Avatar
          src={review.reviewer?.avatarUrl}
          name={review.reviewer?.fullName ?? "?"}
          size={40}
        />
        <div className="flex-1">
          <div style={{ fontWeight: 600, fontSize: 14 }}>{review.reviewer?.fullName ?? "Anonymous"}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {new Date(review.createdAt).toLocaleDateString("en-LS", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
        <StarRating value={review.score} />
      </div>
      {review.review && (
        <p style={{
          fontSize: 13, color: "var(--text-secondary)", margin: 0,
          paddingTop: 10, borderTop: "1px solid var(--border-light)",
          lineHeight: 1.5,
        }}>
          "{review.review}"
        </p>
      )}
    </div>
  );
}
