import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { walletApi } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../lib/toast";
import { Icons, PageHeader } from "../../components/shared";

const METHODS = ["ECOCASH", "MPESA", "CARD"] as const;
type Method = typeof METHODS[number];
interface Transaction { id: string; type: string; amount: number; description: string; createdAt: string; }

const METHOD_LABELS: Record<Method, string> = { ECOCASH: "EcoCash", MPESA: "M-Pesa", CARD: "Card" };

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
    setLoading(true);
    Promise.all([walletApi.getBalance(), walletApi.getTransactions()])
      .then(([w, tx]) => { setBalance(Number(w.data.balance)); setTransactions(tx.data); })
      .finally(() => setLoading(false));
  }, []);

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast("Enter a valid amount", "error"); return; }
    setDepositing(true);
    try {
      const { data } = await walletApi.deposit(amt, method);
      setBalance(Number(data.balance));
      toast(`M ${amt.toFixed(2)} added successfully`, "success");
      setAmount("");
      refreshUser();
      const tx = await walletApi.getTransactions();
      setTransactions(tx.data);
    } catch { toast("Deposit failed", "error"); }
    finally { setDepositing(false); }
  }

  const txColor = (t: string) =>
    t === "DEPOSIT" ? "var(--success)" : t === "TRIP_PAYMENT" ? "var(--danger)" : "var(--text-secondary)";

  const txIcon = (t: string) => {
    if (t === "DEPOSIT") return Icons.wallet;
    if (t === "TRIP_PAYMENT") return Icons.car;
    return Icons.activity;
  };

  return (
    <div className="app-shell">
      <div className="header-dark" style={{ paddingTop: 48, paddingBottom: 32 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
          <button className="btn-icon-dark" onClick={() => navigate("/passenger")}>{Icons.back}</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>Wallet</span>
        </div>
        {/* Balance hero */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Dispatch Cash Balance
          </div>
          <div style={{ fontWeight: 800, fontSize: 52, color: "#fff", lineHeight: 1 }}>
            M <span style={{ color: "var(--orange)" }}>{balance.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>Available for rides</div>
        </div>
      </div>

      <div className="scroll-area flex-1 px-5" style={{ paddingTop: 24, paddingBottom: 32 }}>
        {/* Top-up card */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Top Up</div>
          <form onSubmit={handleDeposit} className="flex-col gap-3">
            {/* Quick amounts */}
            <div className="flex gap-2 flex-wrap">
              {[50, 100, 200, 500].map(v => (
                <button key={v} type="button" onClick={() => setAmount(String(v))} style={{
                  padding: "7px 16px", borderRadius: "var(--r-pill)",
                  border: `1.5px solid ${amount === String(v) ? "var(--orange)" : "var(--border)"}`,
                  background: amount === String(v) ? "var(--orange-light)" : "var(--bg-input)",
                  color: amount === String(v) ? "var(--orange)" : "var(--text-secondary)",
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}>M {v}</button>
              ))}
            </div>

            <div className="input-wrap">
              <label className="input-label">Custom Amount (M)</label>
              <input className="input" type="number" min="1" step="0.01"
                value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" />
            </div>

            <div className="input-wrap">
              <label className="input-label">Payment Method</label>
              <div className="flex gap-2">
                {METHODS.map(m => (
                  <button key={m} type="button" onClick={() => setMethod(m)} style={{
                    flex: 1, padding: "10px 8px", borderRadius: "var(--r-md)",
                    border: `1.5px solid ${method === m ? "var(--orange)" : "var(--border)"}`,
                    background: method === m ? "var(--orange-light)" : "var(--bg-input)",
                    color: method === m ? "var(--orange)" : "var(--text-secondary)",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}>{METHOD_LABELS[m]}</button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={depositing || !amount}>
              {depositing ? <span className="spinner spinner-dark" style={{ width: 20, height: 20 }} /> : "Add Money"}
            </button>
          </form>
        </div>

        {/* Transaction history */}
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Transaction History</div>
        {loading && <div className="flex justify-center" style={{ padding: 20 }}><span className="spinner" /></div>}
        {!loading && transactions.length === 0 && (
          <div className="card text-center" style={{ padding: 32 }}>
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>No transactions yet</div>
          </div>
        )}
        <div className="flex-col gap-2">
          {transactions.map(tx => (
            <div key={tx.id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "var(--r-md)",
                background: tx.type === "DEPOSIT" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: txColor(tx.type), flexShrink: 0,
              }}>
                {txIcon(tx.type)}
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 14, fontWeight: 500 }}>{tx.description ?? tx.type}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {new Date(tx.createdAt).toLocaleDateString("en-LS", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <span style={{ fontWeight: 700, color: txColor(tx.type), fontSize: 15 }}>
                {tx.type === "TRIP_PAYMENT" ? "-" : "+"}M {Number(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
