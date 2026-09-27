import React, { useState, useEffect, useCallback, useMemo } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { transactionAPI } from "../utils/api";
import { formatRupees } from "../utils/transactions";

export default function Dashboard({ student, onOpenModal, onViewAll }) {
  const name   = student?.name || student?.fullName || "Student";
  const userId = student?.user_id || student?._id || student?.id;

  const [loading,      setLoading]      = useState(true);
  const [summary,      setSummary]      = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [allTxns,      setAllTxns]      = useState([]);
  const [recent,       setRecent]       = useState([]);
  const [spendingCats, setSpendingCats] = useState([]);
  const [txnCount,     setTxnCount]     = useState(0);
  const [error,        setError]        = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const isValidId = userId && /^[0-9a-fA-F]{24}$/.test(String(userId));
      const params    = isValidId ? { user_id: userId } : {};

      const [sumRes, txnRes] = await Promise.all([
        transactionAPI.getSummary(isValidId ? userId : null),
        transactionAPI.getAll(params),
      ]);

      if (sumRes?.summary) setSummary(sumRes.summary);

      const txns = txnRes?.transactions || [];
      setAllTxns(txns);
      setTxnCount(txns.length);

      setRecent(txns.slice(0, 5).map((t) => ({
        id:          t._id || t.id,
        type:        t.type,
        description: t.description || "",
        category:    t.category_id?.name || t.category || "General",
        amount:      Number(t.amount || 0),
        date:        (t.date || "").slice(0, 10),
      })));

      const catMap = {};
      txns.filter((t) => t.type === "expense").forEach((t) => {
        const cat = t.category_id?.name || t.category || "Other";
        catMap[cat] = (catMap[cat] || 0) + Number(t.amount || 0);
      });
      setSpendingCats(
        Object.entries(catMap)
          .map(([n, a]) => ({ name: n, amount: a }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 7)
      );
    } catch (err) {
      setError("Could not load data. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboard();
    const h = () => loadDashboard();
    window.addEventListener("campusCoinDataChanged", h);
    return () => window.removeEventListener("campusCoinDataChanged", h);
  }, [loadDashboard]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.description}"?`)) return;
    try {
      await transactionAPI.delete(item.id);
      window.dispatchEvent(new CustomEvent("campusCoinDataChanged", { detail: { action: "delete" } }));
      await loadDashboard();
    } catch (err) {
      alert("Could not delete: " + (err?.message || err));
    }
  };

  // ── KPI calculations ────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const now       = new Date();
    const thisMonth = now.getMonth();
    const thisYear  = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear  = thisMonth === 0 ? thisYear - 1 : thisYear;

    let thisInc = 0, thisExp = 0, lastInc = 0, lastExp = 0;
    allTxns.forEach((t) => {
      const d = new Date(t.date || t.created_at);
      const m = d.getMonth(), y = d.getFullYear();
      const amt = Number(t.amount || 0);
      if (y === thisYear && m === thisMonth) {
        if (t.type === "income")  thisInc += amt;
        if (t.type === "expense") thisExp += amt;
      }
      if (y === lastYear && m === lastMonth) {
        if (t.type === "income")  lastInc += amt;
        if (t.type === "expense") lastExp += amt;
      }
    });

    const thisNet  = thisInc - thisExp;
    const lastNet  = lastInc - lastExp;
    const netDiff  = lastNet !== 0 ? ((thisNet - lastNet) / Math.abs(lastNet)) * 100 : 0;
    const trending = thisNet >= lastNet ? "up" : "down";

    // Last 7 days running balance for sparkline
    const spark = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      let bal = 0;
      allTxns.forEach((t) => {
        const td = (t.date || t.created_at || "").slice(0, 10);
        if (td <= dayStr) bal += t.type === "income" ? Number(t.amount) : -Number(t.amount);
      });
      spark.push({ day: dayStr.slice(5), bal });
    }

    return { thisInc, thisExp, thisNet, lastNet, netDiff, trending, spark };
  }, [allTxns]);

  // Savings goal from student profile
  const savingsGoal = Number(student?.monthly_savings_goal || 0);
  const savingsProgress = savingsGoal > 0 ? Math.min(100, (kpi.thisNet / savingsGoal) * 100) : 0;

  const maxCat = Math.max(1, ...spendingCats.map((c) => c.amount));

  if (loading) return (
    <div style={S.center}>
      <div style={S.spinner} />
      <p style={{ color: "#64748b", marginTop: 14, fontSize: 14 }}>Loading your financial data…</p>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.heading}>
        <div>
          <span style={S.eyebrow}>STUDENT FINANCE OVERVIEW</span>
          <h1 style={S.title}>Welcome back, {name}</h1>
          <p style={S.subtitle}>Here's what's happening with your money.</p>
        </div>
        <div style={S.actions}>
          <button style={S.addIncome}    onClick={() => onOpenModal("income")}>+ Add Income</button>
          <button style={S.addExpense}   onClick={() => onOpenModal("expense")}>+ Add Expense</button>
          <span   style={S.divider} />
          <button style={S.addCategory} onClick={() => onOpenModal("category")}>+ Categories</button>
          <button style={S.refreshBtn}  onClick={loadDashboard} title="Refresh">↺</button>
        </div>
      </div>

      {error && (
        <div style={S.errorBanner}>
          ⚠ {error}
          <button onClick={loadDashboard} style={S.retryBtn}>Retry</button>
        </div>
      )}

      {/* ── Enhanced Balance Card ───────────────────────────────────────────── */}
      <section style={S.balanceCard}>
        {/* Left: balance + KPIs */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={S.balanceLabel}>Available Balance</span>
          <div style={S.balanceAmount}>{formatRupees(summary.balance || 0)}</div>
          <span style={S.balanceHint}>Total income minus all recorded expenses</span>

          {/* KPI row */}
          <div style={S.kpiRow}>
            <KpiBadge
              label="This Month"
              value={formatRupees(Math.abs(kpi.thisNet))}
              positive={kpi.thisNet >= 0}
            />
            <KpiBadge
              label="vs Last Month"
              value={`${kpi.netDiff >= 0 ? "+" : ""}${kpi.netDiff.toFixed(1)}%`}
              positive={kpi.trending === "up"}
            />
            <KpiBadge
              label="Monthly Income"
              value={formatRupees(kpi.thisInc)}
              positive={true}
              neutral
            />
            <KpiBadge
              label="Monthly Spend"
              value={formatRupees(kpi.thisExp)}
              positive={false}
              neutral
            />
          </div>
        </div>

        {/* Right: sparkline */}
        <div style={S.sparkWrap}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
            7-day balance trend
          </div>
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={kpi.spark}>
              <Line
                type="monotone"
                dataKey="bal"
                stroke="#34d399"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#34d399" }}
              />
              <Tooltip
                contentStyle={{ background: "#1e3a4a", border: "none", borderRadius: 8, fontSize: 11, color: "#fff" }}
                formatter={(v) => [formatRupees(v), "Balance"]}
                labelFormatter={(l) => `Date: ${l}`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Savings goal banner — only if goal is set */}
      {savingsGoal > 0 && (
        <div style={S.savingsBanner}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#17283e" }}>
              🎯 Monthly Savings Goal: {formatRupees(savingsGoal)}
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: savingsProgress >= 100 ? "#07845e" : "#6366f1" }}>
              {savingsProgress >= 100 ? "✅ Goal reached!" : `${savingsProgress.toFixed(0)}% saved`}
            </span>
          </div>
          <div style={S.goalTrack}>
            <div style={{ ...S.goalFill, width: `${Math.min(100, savingsProgress)}%`, background: savingsProgress >= 100 ? "#07845e" : "#6366f1" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#718096" }}>
            <span>Saved this month: {formatRupees(Math.max(0, kpi.thisNet))}</span>
            <span>Remaining: {formatRupees(Math.max(0, savingsGoal - kpi.thisNet))}</span>
          </div>
        </div>
      )}

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <section style={S.stats}>
        <StatCard title="Total Income"   amount={formatRupees(summary.totalIncome || 0)}  color="#07845e" icon="↗" />
        <StatCard title="Total Expenses" amount={formatRupees(summary.totalExpense || 0)} color="#c84e4e" icon="↘" />
        <StatCard title="Transactions"   amount={String(txnCount)}                         color="#4e66c8" icon="▤" />
        <StatCard
          title="Savings Rate"
          amount={summary.totalIncome > 0 ? `${(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100).toFixed(1)}%` : "—"}
          color="#8b5cf6"
          icon="💰"
        />
      </section>

      {/* ── Columns ─────────────────────────────────────────────────────────── */}
      <section style={S.columns}>
        {/* Recent Transactions */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <div>
              <h2 style={S.panelTitle}>Recent Transactions</h2>
              <p style={S.panelSub}>Your latest activity</p>
            </div>
            <button style={S.textBtn} onClick={() => onOpenModal("income")}>Add record</button>
          </div>

          {recent.length === 0 ? (
            <div style={S.empty}>
              <div style={S.emptyIcon}>＋</div>
              <strong>No transactions yet</strong>
              <p style={{ fontSize: 13, color: "#718096", margin: "6px 0 16px" }}>
                Start by adding your first income or expense.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button style={S.addIncome}  onClick={() => onOpenModal("income")}>Add Income</button>
                <button style={S.addExpense} onClick={() => onOpenModal("expense")}>Add Expense</button>
              </div>
            </div>
          ) : (
            <>
              {recent.map((item) => (
                <div key={item.id} style={S.txnRow}>
                  <div style={S.txnLeft}>
                    <span style={{ ...S.txnIcon, background: item.type === "income" ? "#e2f7ef" : "#fff0f0", color: item.type === "income" ? "#07845e" : "#c84e4e" }}>
                      {item.type === "income" ? "↗" : "↘"}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={S.txnName}>{item.description || item.category}</strong>
                      <span style={S.txnMeta}>{item.category} · {item.date}</span>
                    </div>
                  </div>
                  <div style={S.txnRight}>
                    <strong style={{ color: item.type === "income" ? "#07845e" : "#c84e4e", fontSize: 13, whiteSpace: "nowrap" }}>
                      {item.type === "income" ? "+" : "−"} {formatRupees(item.amount)}
                    </strong>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => handleDelete(item)} style={S.iconDeleteBtn} title="Delete">✕</button>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: 14, textAlign: "center" }}>
                <button style={S.viewAllBtn} onClick={onViewAll}>View all transactions →</button>
              </div>
            </>
          )}
        </div>

        {/* Spending by Category */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <div>
              <h2 style={S.panelTitle}>Spending Categories</h2>
              <p style={S.panelSub}>Your expenses by category</p>
            </div>
            {spendingCats.length > 0 && (
              <span style={{ fontSize: 12, color: "#8b5cf6", fontWeight: 700 }}>
                Top: {spendingCats[0]?.name}
              </span>
            )}
          </div>

          {spendingCats.length === 0 ? (
            <p style={{ color: "#8a98a9", fontSize: 13, lineHeight: 1.7, padding: "18px 0" }}>
              Add an expense to see your spending breakdown.
            </p>
          ) : (
            spendingCats.map((item, i) => {
              const pct = (item.amount / maxCat) * 100;
              const colors = ["#07845e","#6366f1","#f59e0b","#ec4899","#14b8a6","#8b5cf6","#ef4444"];
              return (
                <div key={item.name} style={{ margin: "16px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#526276", fontWeight: 600 }}>{item.name}</span>
                    <strong style={{ fontSize: 12, color: "#17283e" }}>{formatRupees(item.amount)}</strong>
                  </div>
                  <div style={{ height: 7, background: "#edf1f5", borderRadius: 20, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: colors[i % colors.length], borderRadius: 20, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function KpiBadge({ label, value, positive, neutral }) {
  const color  = neutral ? "rgba(255,255,255,0.75)" : positive ? "#34d399" : "#f87171";
  const bg     = neutral ? "rgba(255,255,255,0.08)"  : positive ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)";
  const prefix = neutral ? "" : positive ? "↑ " : "↓ ";
  return (
    <div style={{ background: bg, borderRadius: 10, padding: "7px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color }}>{prefix}{value}</span>
    </div>
  );
}

function StatCard({ title, amount, color, icon }) {
  return (
    <div style={S.statCard}>
      <span style={{ width: 35, height: 35, display: "grid", placeItems: "center", borderRadius: 10, fontSize: 19, fontWeight: 900, color, background: `${color}16` }}>
        {icon}
      </span>
      <span style={{ color: "#718096", fontSize: 12 }}>{title}</span>
      <strong style={{ color: "#17283e", fontSize: 20 }}>{amount}</strong>
    </div>
  );
}

const S = {
  center:  { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: "Inter, Arial, sans-serif" },
  spinner: { width: 40, height: 40, border: "4px solid #e2e8f0", borderTop: "4px solid #07845e", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  page:    { maxWidth: 1120, margin: "0 auto", padding: "42px 22px 60px", fontFamily: "Inter, Arial, sans-serif" },
  heading: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18, marginBottom: 22 },
  eyebrow: { display: "block", color: "#07845e", fontSize: 11, fontWeight: 900, letterSpacing: 1.4, marginBottom: 6 },
  title:   { margin: "0 0 6px", fontSize: "clamp(26px,4vw,36px)", color: "#142238", letterSpacing: "-1px" },
  subtitle:{ margin: 0, color: "#718096", fontSize: 14 },
  actions: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 },
  addIncome:   { border: "none", cursor: "pointer", background: "#07845e", color: "#fff", padding: "11px 15px", borderRadius: 9, fontSize: 13, fontWeight: 800, fontFamily: "inherit" },
  addExpense:  { cursor: "pointer", background: "#fff", color: "#bd4848", border: "1px solid #f0caca", padding: "11px 15px", borderRadius: 9, fontSize: 13, fontWeight: 800, fontFamily: "inherit" },
  divider:     { display: "inline-block", width: "1.5px", height: 26, background: "#cbd5e1", margin: "0 3px" },
  addCategory: { cursor: "pointer", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "10px 15px", borderRadius: 9, fontSize: 13, fontWeight: 800, fontFamily: "inherit" },
  refreshBtn:  { cursor: "pointer", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", width: 36, height: 36, borderRadius: 9, fontSize: 18, fontFamily: "inherit", display: "grid", placeItems: "center" },
  errorBanner: { background: "#fef3cd", border: "1px solid #fcd34d", color: "#92400e", padding: "11px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  retryBtn:    { background: "#fbbf24", border: "none", color: "#78350f", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer" },

  // Balance card
  balanceCard: { display: "flex", alignItems: "flex-start", gap: 28, padding: "26px 28px", background: "linear-gradient(120deg,#102d36,#087a5a)", borderRadius: 18, color: "#fff", marginBottom: 16, boxShadow: "0 15px 35px rgba(8,92,69,0.18)", flexWrap: "wrap" },
  balanceLabel: { color: "#c4e7dc", fontSize: 13 },
  balanceAmount:{ display: "block", fontSize: "clamp(30px,4vw,42px)", fontWeight: 900, margin: "6px 0 4px", letterSpacing: "-1px" },
  balanceHint:  { color: "#c4e7dc", fontSize: 11 },
  kpiRow:       { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 },
  sparkWrap:    { flexShrink: 0, width: 200, minWidth: 150 },

  // Savings
  savingsBanner: { background: "#fff", border: "1.5px solid #c4b5fd", borderRadius: 14, padding: "16px 20px", marginBottom: 16, boxShadow: "0 4px 16px rgba(99,102,241,0.08)" },
  goalTrack:     { height: 8, background: "#ede9fe", borderRadius: 20, overflow: "hidden" },
  goalFill:      { height: "100%", borderRadius: 20, transition: "width 0.6s ease" },

  // Stats
  stats:   { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 18 },
  statCard:{ background: "#fff", border: "1px solid #e3e9ef", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 8 },

  // Columns
  columns: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: 18 },
  panel:   { background: "#fff", border: "1px solid #e3e9ef", borderRadius: 16, padding: 22, minWidth: 0, boxShadow: "0 8px 30px rgba(16,35,55,0.04)" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 },
  panelTitle:  { margin: 0, fontSize: 17, fontWeight: 800, color: "#17283e" },
  panelSub:    { margin: "4px 0 0", color: "#8a98a9", fontSize: 12 },
  textBtn:     { background: "none", border: "none", color: "#07845e", fontWeight: 800, fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "inherit" },
  empty:       { textAlign: "center", padding: "25px 10px", color: "#718096" },
  emptyIcon:   { display: "grid", placeItems: "center", width: 42, height: 42, margin: "0 auto 12px", borderRadius: 12, background: "#e2f7ef", color: "#07845e", fontSize: 22 },
  txnRow:      { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #edf1f5" },
  txnLeft:     { display: "flex", alignItems: "center", gap: 11, minWidth: 0 },
  txnRight:    { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  txnIcon:     { flex: "0 0 36px", width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 10, fontWeight: 900, fontSize: 18 },
  txnName:     { display: "block", color: "#293b50", fontSize: 13, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  txnMeta:     { display: "block", color: "#8a98a9", fontSize: 11 },
  iconDeleteBtn:{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#e11d48", borderRadius: 6, width: 26, height: 26, fontSize: 12, fontWeight: 700, display: "grid", placeItems: "center", cursor: "pointer", padding: 0 },
  viewAllBtn:  { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#2563eb", borderRadius: 9, padding: "10px 22px", fontSize: 13, fontWeight: 800, cursor: "pointer", width: "100%", fontFamily: "inherit" },
};