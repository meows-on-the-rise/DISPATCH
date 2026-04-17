import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { walletApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";
import { PageHeader } from "../../components/shared";

const METHODS = ["ECOCASH", "MPESA", "CARD"] as const;
type Method = (typeof METHODS)[number];

interface Transaction {
  id: string; type: string; amount: number; description: string; createdAt: string;
}

export default function PassengerWalletPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshUser } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(Number(user?.wallet?.balance ?? 0));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("ECOCASH");
  const [loading, setLoading] = useState(false);
  const [depositing, setDepositing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [walletRes, txRes] = await Promise.all([walletApi.getBalance(), walletApi.getTransactions()]);
        setBalance(Number(walletRes.data.balance));
        setTransactions(txRes.data);
      } finally { setLoading(false); }
    })();
  }, []);

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast("Enter a valid amount", "error"); return; }
    setDepositing(true);
    try {
      const { data } = await walletApi.deposit(amt, method);
      setBalance(Number(data.balance));
      toast(`M ${amt.toFixed(2)} deposited successfully!`, "success");
      setAmount("");
      refreshUser();
      const txRes = await walletApi.getTransactions();
      setTransactions(txRes.data);
    } catch { toast("Deposit failed", "error"); }
    finally { setDepositing(false); }
  }

  const typeColor = (type: string) => {
    if (type === "DEPOSIT") return "var(--teal)";
    if (type === "TRIP_PAYMENT") return "var(--danger)";
    if (type === "REFUND") return "var(--teal)";
    return "var(--text-secondary)";
  };

  const typeIcon = (type: string) => {
    if (type === "DEPOSIT") return "⬇️";
    if (type === "TRIP_PAYMENT") return "🚕";
    if (type === "REFUND") return "↩️";
    return "💳";
  };

  return (
    <div className="app-shell">
      <PageHeader title="Wallet" onBack={() => navigate("/passenger")} />

      <div className="scroll-area flex-1 px-4">
        {/* Balance hero */}
        <div className="card-elevated text-center page-enter" style={{ marginBottom: 20, padding: "28px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Dispatch Cash Balance
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 48, color: "var(--teal)", lineHeight: 1 }}>
            M {balance.toFixed(2)}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>
            Available for rides
          </div>
        </div>

        {/* Deposit form */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 16 }}>Top Up</h3>
          <form onSubmit={handleDeposit} className="flex-col gap-3">
            {/* Quick amounts */}
            <div className="flex gap-2 flex-wrap">
              {[50, 100, 200, 500].map((v) => (
                <button key={v} type="button" onClick={() => setAmount(String(v))} style={{
                  padding: "6px 14px", borderRadius: "var(--r-pill)", border: "1px solid var(--border)",
                  background: amount === String(v) ? "var(--purple-dim)" : "var(--bg-elevated)",
                  color: amount === String(v) ? "var(--purple-light)" : "var(--text-secondary)",
                  cursor: "pointer", fontSize: 14, fontWeight: 600,
                }}>
                  M {v}
                </button>
              ))}
            </div>

            <div className="input-wrap">
              <label className="input-label">Custom Amount (M)</label>
              <input className="input" type="number" min="1" step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
            </div>

            <div className="input-wrap">
              <label className="input-label">Payment Method</label>
              <div className="flex gap-2">
                {METHODS.map((m) => (
                  <button key={m} type="button" onClick={() => setMethod(m)} style={{
                    flex: 1, padding: "10px 8px", borderRadius: "var(--r-md)",
                    border: `1px solid ${method === m ? "var(--purple)" : "var(--border)"}`,
                    background: method === m ? "var(--purple-dim)" : "var(--bg-elevated)",
                    color: method === m ? "var(--purple-light)" : "var(--text-secondary)",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}>
                    {m === "ECOCASH" ? "💚 EcoCash" : m === "MPESA" ? "📱 M-Pesa" : "💳 Card"}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={depositing || !amount}>
              {depositing ? <span className="spinner" style={{ width: 20, height: 20 }} /> : "Deposit Money"}
            </button>
          </form>
        </div>

        {/* Transaction history */}
        <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 12 }}>Transaction History</h3>
        {loading && <div className="flex justify-center" style={{ padding: 20 }}><span className="spinner" /></div>}
        {!loading && transactions.length === 0 && (
          <p className="text-center text-muted" style={{ padding: 24, fontSize: 14 }}>No transactions yet</p>
        )}
        <div className="flex-col gap-2" style={{ paddingBottom: 24 }}>
          {transactions.map((tx) => (
            <div key={tx.id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{typeIcon(tx.type)}</span>
              <div className="flex-1">
                <div style={{ fontSize: 14, fontWeight: 500 }}>{tx.description ?? tx.type}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {new Date(tx.createdAt).toLocaleDateString("en-LS", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: typeColor(tx.type) }}>
                {tx.type === "TRIP_PAYMENT" ? "-" : "+"}M {Number(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
