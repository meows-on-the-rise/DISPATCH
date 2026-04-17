import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { walletApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";
import { PageHeader } from "../../components/shared";

const METHODS = ["ECOCASH", "MPESA", "CARD"] as const;
type Method = (typeof METHODS)[number];
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
    (async () => {
      setLoading(true);
      try {
        const [wRes, txRes] = await Promise.all([walletApi.getBalance(), walletApi.getTransactions()]);
        setBalance(Number(wRes.data.balance));
        setTransactions(txRes.data);
      } finally { setLoading(false); }
    })();
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
      toast(`M ${amt.toFixed(2)} withdrawn to ${method}!`, "success");
      setAmount("");
      refreshUser();
      const txRes = await walletApi.getTransactions();
      setTransactions(txRes.data);
    } catch { toast("Withdrawal failed", "error"); }
    finally { setWithdrawing(false); }
  }

  const typeColor = (t: string) => t === "TRIP_EARNING" ? "var(--teal)" : t === "WITHDRAWAL" ? "var(--danger)" : "var(--text-secondary)";

  return (
    <div className="app-shell">
      <PageHeader title="Earnings" onBack={() => navigate("/driver")} />
      <div className="scroll-area flex-1 px-4">
        {/* Balance hero */}
        <div className="card-elevated text-center page-enter" style={{ marginBottom: 20, padding: "28px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Available to Withdraw
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 48, color: "var(--teal)", lineHeight: 1 }}>
            M {balance.toFixed(2)}
          </div>
        </div>

        {/* Withdraw form */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 16 }}>Withdraw Earnings</h3>
          <form onSubmit={handleWithdraw} className="flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {[50, 100, 200].map((v) => (
                <button key={v} type="button" onClick={() => setAmount(String(v))} style={{
                  padding: "6px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--border)",
                  background: amount === String(v) ? "var(--teal-dim)" : "var(--bg-elevated)",
                  color: amount === String(v) ? "var(--teal)" : "var(--text-secondary)",
                  cursor: "pointer", fontSize: 14, fontWeight: 600,
                }}>M {v}</button>
              ))}
            </div>
            <div className="input-wrap">
              <label className="input-label">Amount (M)</label>
              <input className="input" type="number" min="1" step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            <div className="flex gap-2">
              {METHODS.map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)} style={{
                  flex: 1, padding: "10px 8px", borderRadius: "var(--r-md)",
                  border: `1px solid ${method === m ? "var(--teal)" : "var(--border)"}`,
                  background: method === m ? "var(--teal-dim)" : "var(--bg-elevated)",
                  color: method === m ? "var(--teal)" : "var(--text-secondary)",
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                }}>
                  {m === "ECOCASH" ? "💚 EcoCash" : m === "MPESA" ? "📱 M-Pesa" : "💳 Card"}
                </button>
              ))}
            </div>
            <button className="btn btn-teal" type="submit" disabled={withdrawing || !amount}>
              {withdrawing ? <span className="spinner" style={{ width: 20, height: 20 }} /> : "Withdraw"}
            </button>
          </form>
        </div>

        {/* History */}
        <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 12 }}>Earnings History</h3>
        {loading && <div className="flex justify-center" style={{ padding: 20 }}><span className="spinner" /></div>}
        <div className="flex-col gap-2" style={{ paddingBottom: 24 }}>
          {transactions.map((tx) => (
            <div key={tx.id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{tx.type === "TRIP_EARNING" ? "💵" : tx.type === "WITHDRAWAL" ? "🏦" : "💳"}</span>
              <div className="flex-1">
                <div style={{ fontSize: 14, fontWeight: 500 }}>{tx.description ?? tx.type}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {new Date(tx.createdAt).toLocaleString("en-LS", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: typeColor(tx.type) }}>
                {tx.type === "WITHDRAWAL" ? "-" : "+"}M {Number(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
