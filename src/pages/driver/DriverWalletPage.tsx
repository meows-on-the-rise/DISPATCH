import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { walletApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";
import { Icons } from "../../components/shared";

const METHODS = ["ECOCASH", "MPESA", "CARD"] as const;
type Method = typeof METHODS[number];
interface Transaction { id: string; type: string; amount: number; description: string; createdAt: string; }

export default function DriverWalletPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(Number(user?.wallet?.balance ?? 0));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("ECOCASH");
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([walletApi.getBalance(), walletApi.getTransactions()])
      .then(([w, tx]) => { setBalance(Number(w.data.balance)); setTransactions(tx.data); })
      .finally(() => setLoading(false));
  }, []);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast("Enter a valid amount", "error"); return; }
    if (amt > balance) { toast("Insufficient balance", "error"); return; }
    setWithdrawing(true);
    try {
      const { data } = await walletApi.withdraw(amt, method);
      setBalance(Number(data.balance));
      toast(`M ${amt.toFixed(2)} withdrawn to ${method}`, "success");
      setAmount(""); refreshUser();
      const tx = await walletApi.getTransactions(); setTransactions(tx.data);
    } catch { toast("Withdrawal failed", "error"); }
    finally { setWithdrawing(false); }
  }

  const isCredit = (t: string) => ["TRIP_EARNING", "DEPOSIT", "REFUND"].includes(t);

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 32 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
          <button className="btn-icon-dark" onClick={() => navigate("/driver")}>{Icons.back}</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>Earnings</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Available to Withdraw
          </div>
          <div style={{ fontWeight: 800, fontSize: 52, color: "#fff", lineHeight: 1 }}>
            M <span style={{ color: "var(--orange)" }}>{balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Withdraw Earnings</div>
          <form onSubmit={handleWithdraw} className="flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {[50, 100, 200].map(v => (
                <button key={v} type="button" onClick={() => setAmount(String(v))} style={{
                  padding: "7px 16px", borderRadius: "var(--r-pill)",
                  border: `1.5px solid ${amount === String(v) ? "var(--teal)" : "var(--border)"}`,
                  background: amount === String(v) ? "var(--teal-dim)" : "var(--bg-input)",
                  color: amount === String(v) ? "var(--teal)" : "var(--text-secondary)",
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}>M {v}</button>
              ))}
            </div>
            <div className="input-wrap">
              <label className="input-label">Amount (M)</label>
              <input className="input" type="number" min="1" step="0.01"
                value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            <div className="flex gap-2">
              {METHODS.map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)} style={{
                  flex: 1, padding: "10px 8px", borderRadius: "var(--r-md)",
                  border: `1.5px solid ${method === m ? "var(--teal)" : "var(--border)"}`,
                  background: method === m ? "var(--teal-dim)" : "var(--bg-input)",
                  color: method === m ? "var(--teal)" : "var(--text-secondary)",
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                }}>{m === "ECOCASH" ? "EcoCash" : m === "MPESA" ? "M-Pesa" : "Card"}</button>
              ))}
            </div>
            <button className="btn btn-dark" type="submit" disabled={withdrawing || !amount}>
              {withdrawing ? <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} /> : "Withdraw"}
            </button>
          </form>
        </div>

        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Earnings History</div>
        {loading && <div className="flex justify-center" style={{ padding: 20 }}><span className="spinner" /></div>}
        <div className="flex-col gap-2">
          {transactions.map(tx => (
            <div key={tx.id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "var(--r-md)",
                background: isCredit(tx.type) ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isCredit(tx.type) ? "var(--success)" : "var(--orange)", flexShrink: 0,
              }}>
                {tx.type === "TRIP_EARNING" ? Icons.car : Icons.wallet}
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 14, fontWeight: 500 }}>{tx.description ?? tx.type.replace(/_/g, " ")}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {new Date(tx.createdAt).toLocaleString("en-LS", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: isCredit(tx.type) ? "var(--success)" : "var(--danger)" }}>
                {isCredit(tx.type) ? "+" : "-"}M {Number(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
