import React, { useState, useEffect, useCallback, useMemo } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { transactionAPI } from "../utils/api";
import { formatRupees, getCurrency } from "../utils/transactions";

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
  const [, setCurrencyKey] = useState(0);

  const activeCur = getCurrency();

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

      setRecent(txns.slice(0, 4).map((t) => ({
        id:          t._id || t.id,
        _id:         t._id || t.id,
        type:        t.type,
        description: t.description || "",
        category:    t.category_id?.name || t.category || "General",
        category_id: t.category_id?._id || t.category_id || null,
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
    const h  = () => loadDashboard();
    const hc = () => setCurrencyKey((k) => k + 1);
    window.addEventListener("campusCoinDataChanged", h);
    window.addEventListener("campusCoinCurrencyChanged", hc);
    return () => {
      window.removeEventListener("campusCoinDataChanged", h);
      window.removeEventListener("campusCoinCurrencyChanged", hc);
    };
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

  // KPI calculations
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

    // 7 days running balance for sparkline
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

  const savingsGoal = Number(student?.monthly_savings_goal || 0);
  const savingsProgress = savingsGoal > 0 ? Math.min(100, (kpi.thisNet / savingsGoal) * 100) : 0;
  const maxCat = Math.max(1, ...spendingCats.map((c) => c.amount));

  if (loading) return (
    <div style={S.center}>
      <div style={S.spinner} />
      <p style={{ color: "#64748b", marginTop: 14, fontSize: 14 }}>Loading financial overview…</p>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.heading}>
        <div>
          <span style={S.eyebrow}>
            <i className="fa-solid fa-graduation-cap" style={{ marginRight: 6 }}></i>
            STUDENT FINANCIAL OVERVIEW
          </span>
          <h1 style={S.title}>Welcome back, {name}</h1>
          <p style={S.subtitle}>Here is your current financial status and recent activity.</p>
        </div>
        <div style={S.actions}>
          <button style={S.addIncome} onClick={() => onOpenModal("income")}>
            <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>
            Add Income
          </button>
          <button style={S.addExpense} onClick={() => onOpenModal("expense")}>
            <i className="fa-solid fa-minus" style={{ marginRight: 6 }}></i>
            Add Expense
          </button>
          <span style={S.divider} />
          <button style={S.addCategory} onClick={() => onOpenModal("category")}>
            <i className="fa-solid fa-tags" style={{ marginRight: 6 }}></i>
            Categories
          </button>
          <button style={S.refreshBtn} onClick={loadDashboard} title="Refresh Data">
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      </div>

      {error && (
        <div style={S.errorBanner}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
          <button onClick={loadDashboard} style={S.retryBtn}>Retry</button>
        </div>
      )}

      {/* Main Balance Card */}
      <section style={S.balanceCard}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <span style={S.balanceLabel}>
            <i className="fa-solid fa-wallet" style={{ marginRight: 6 }}></i>
            Available Balance
          </span>
          <div style={S.balanceAmount}>{formatRupees(summary.balance || 0)}</div>
          <span style={S.balanceHint}>Total recorded income minus expenses</span>

          {/* KPI badges */}
          <div style={S.kpiRow}>
            <KpiBadge
              label="This Month"
              value={formatRupees(Math.abs(kpi.thisNet))}
              icon={kpi.thisNet >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}
              positive={kpi.thisNet >= 0}
            />
            <KpiBadge
              label="vs Last Month"
              value={`${kpi.netDiff >= 0 ? "+" : ""}${kpi.netDiff.toFixed(1)}%`}
              icon={kpi.trending === "up" ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}
              positive={kpi.trending === "up"}
            />
            <KpiBadge
              label="Monthly Income"
              value={formatRupees(kpi.thisInc)}
              icon="fa-arrow-up"
              positive={true}
              neutral
            />
            <KpiBadge
              label="Monthly Spend"
              value={formatRupees(kpi.thisExp)}
              icon="fa-arrow-down"
              positive={false}
              neutral
            />
          </div>
        </div>

        {/* Sparkline chart */}
        <div style={S.sparkWrap}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="fa-solid fa-chart-line"></i>
            7-day balance trend
          </div>
          <ResponsiveContainer width="100%" height={75}>
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
                contentStyle={{ background: "#0f172a", border: "none", borderRadius: 8, fontSize: 11, color: "#fff" }}
                formatter={(v) => [formatRupees(v), "Balance"]}
                labelFormatter={(l) => `Date: ${l}`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Savings Goal Banner */}
      {savingsGoal > 0 && (
        <div style={S.savingsBanner}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
              <i className="fa-solid fa-bullseye" style={{ color: "#6366f1" }}></i>
              Monthly Savings Goal: {formatRupees(savingsGoal)}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: savingsProgress >= 100 ? "#07845e" : "#6366f1", display: "flex", alignItems: "center", gap: 5 }}>
              <i className={`fa-solid ${savingsProgress >= 100 ? "fa-circle-check" : "fa-chart-pie"}`}></i>
              {savingsProgress >= 100 ? "Goal reached!" : `${savingsProgress.toFixed(0)}% saved`}
            </span>
          </div>
          <div style={S.goalTrack}>
            <div style={{ ...S.goalFill, width: `${Math.min(100, savingsProgress)}%`, background: savingsProgress >= 100 ? "#07845e" : "#6366f1" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "#64748b" }}>
            <span>Saved: {formatRupees(Math.max(0, kpi.thisNet))}</span>
            <span>Remaining: {formatRupees(Math.max(0, savingsGoal - kpi.thisNet))}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <section style={S.stats}>
        <StatCard title="Total Income"   amount={formatRupees(summary.totalIncome || 0)}  color="#07845e" iconClass="fa-solid fa-arrow-trend-up" />
        <StatCard title="Total Expenses" amount={formatRupees(summary.totalExpense || 0)} color="#ef4444" iconClass="fa-solid fa-arrow-trend-down" />
        <StatCard title="Transactions"   amount={String(txnCount)}                         color="#3b82f6" iconClass="fa-solid fa-receipt" />
        <StatCard
          title="Savings Rate"
          amount={summary.totalIncome > 0 ? `${(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100).toFixed(1)}%` : "—"}
          color="#8b5cf6"
          iconClass="fa-solid fa-piggy-bank"
        />
      </section>

      {/* Columns: Recent Transactions + Spending by Category */}
      <section style={S.columns}>
        {/* Recent Transactions */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="fa-solid fa-clock-rotate-left" style={{ color: "#64748b" }}></i>
              <div>
                <h2 style={S.panelTitle}>Recent Transactions</h2>
                <p style={S.panelSub}>Latest financial entries</p>
              </div>
            </div>
            <button style={S.textBtn} onClick={() => onOpenModal("income")}>
              <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i>
              Add Record
            </button>
          </div>

          {recent.length === 0 ? (
            <div style={S.empty}>
              <div style={S.emptyIcon}>
                <i className="fa-solid fa-receipt"></i>
              </div>
              <strong>No transactions recorded yet</strong>
              <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 16px" }}>
                Begin by logging your first income or expense transaction.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button style={S.addIncome} onClick={() => onOpenModal("income")}>Add Income</button>
                <button style={S.addExpense} onClick={() => onOpenModal("expense")}>Add Expense</button>
              </div>
            </div>
          ) : (
            <>
              {recent.map((item) => (
                <div key={item.id} style={S.txnRow}>
                  <div style={S.txnLeft}>
                    <span style={{
                      ...S.txnIcon,
                      background: item.type === "income" ? "#ecfdf5" : "#fef2f2",
                      color:      item.type === "income" ? "#07845e" : "#ef4444",
                    }}>
                      <i className={`fa-solid ${item.type === "income" ? "fa-arrow-up" : "fa-arrow-down"}`}></i>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={S.txnName}>{item.description || item.category}</strong>
                      <span style={S.txnMeta}>{item.category} · {item.date}</span>
                    </div>
                  </div>
                  <div style={S.txnRight}>
                    <strong style={{ color: item.type === "income" ? "#07845e" : "#ef4444", fontSize: 13, whiteSpace: "nowrap" }}>
                      {item.type === "income" ? "+" : "−"} {formatRupees(item.amount)}
                    </strong>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <button
                        onClick={() => onOpenModal && onOpenModal("edit", item)}
                        style={S.iconEditBtn}
                        title="Edit transaction"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        style={S.iconDeleteBtn}
                        title="Delete transaction"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: 14, textAlign: "center" }}>
                <button style={S.viewAllBtn} onClick={onViewAll}>
                  View all transactions
                  <i className="fa-solid fa-arrow-right" style={{ marginLeft: 6 }}></i>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Spending by Category */}
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="fa-solid fa-chart-pie" style={{ color: "#64748b" }}></i>
              <div>
                <h2 style={S.panelTitle}>Spending Categories</h2>
                <p style={S.panelSub}>Expense distribution by category</p>
              </div>
            </div>
            {spendingCats.length > 0 && (
              <span style={{ fontSize: 12, color: "#8b5cf6", fontWeight: 700 }}>
                Top: {spendingCats[0]?.name}
              </span>
            )}
          </div>

          {spendingCats.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, padding: "18px 0" }}>
              Add an expense to view your category spending breakdown.
            </p>
          ) : (
            spendingCats.map((item, i) => {
              const pct = (item.amount / maxCat) * 100;
              const colors = ["#07845e","#6366f1","#f59e0b","#ec4899","#14b8a6","#8b5cf6","#ef4444"];
              return (
                <div key={item.name} style={{ margin: "16px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>{item.name}</span>
                    <strong style={{ fontSize: 13, color: "#0f172a" }}>{formatRupees(item.amount)}</strong>
                  </div>
                  <div style={{ height: 7, background: "#f1f5f9", borderRadius: 20, overflow: "hidden" }}>
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

function KpiBadge({ label, value, icon, positive, neutral }) {
  const color = neutral ? "rgba(255,255,255,0.8)" : positive ? "#34d399" : "#f87171";
  const bg    = neutral ? "rgba(255,255,255,0.08)" : positive ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)";
  return (
    <div style={{ background: bg, borderRadius: 9, padding: "6px 11px", display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: 0.4 }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color, display: "flex", alignItems: "center", gap: 5 }}>
        {icon && <i className={`fa-solid ${icon}`} style={{ fontSize: 10 }}></i>}
        {value}
      </span>
    </div>
  );
}

function StatCard({ title, amount, color, iconClass }) {
  return (
    <div style={S.statCard}>
      <span style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 10, fontSize: 15, color, background: `${color}15` }}>
        <i className={iconClass}></i>
      </span>
      <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>{title}</span>
      <strong style={{ color: "#0f172a", fontSize: 20, fontWeight: 800 }}>{amount}</strong>
    </div>
  );
}

const S = {
  center:  { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: "'Inter', sans-serif" },
  spinner: { width: 40, height: 40, border: "4px solid #e2e8f0", borderTop: "4px solid #07845e", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  page:    { maxWidth: 1140, margin: "0 auto", padding: "36px 20px 60px", fontFamily: "'Inter', Arial, sans-serif" },
  heading: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18, marginBottom: 24 },
  eyebrow: { display: "inline-flex", alignItems: "center", color: "#07845e", fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 6 },
  title:   { margin: "0 0 6px", fontSize: "clamp(24px, 3.5vw, 34px)", color: "#0f172a", letterSpacing: "-0.8px", fontWeight: 800 },
  subtitle:{ margin: 0, color: "#64748b", fontSize: 14 },
  actions: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 },
  addIncome:   { border: "none", cursor: "pointer", background: "#07845e", color: "#fff", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "inline-flex", alignItems: "center" },
  addExpense:  { cursor: "pointer", background: "#fff", color: "#b91c1c", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "inline-flex", alignItems: "center" },
  divider:     { display: "inline-block", width: "1px", height: 24, background: "#cbd5e1", margin: "0 2px" },
  addCategory: { cursor: "pointer", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "inline-flex", alignItems: "center" },
  refreshBtn:  { cursor: "pointer", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", width: 38, height: 38, borderRadius: 8, fontSize: 14, fontFamily: "inherit", display: "grid", placeItems: "center" },
  errorBanner: { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  retryBtn:    { background: "#fee2e2", border: "none", color: "#991b1b", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" },

  balanceCard: { display: "flex", alignItems: "flex-start", gap: 24, padding: "26px 28px", background: "linear-gradient(135deg, #0f172a, #134e4a)", borderRadius: 18, color: "#fff", marginBottom: 16, boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)", flexWrap: "wrap" },
  balanceLabel: { color: "#a7f3d0", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center" },
  balanceAmount:{ display: "block", fontSize: "clamp(30px, 4vw, 40px)", fontWeight: 900, margin: "6px 0 4px", letterSpacing: "-1px" },
  balanceHint:  { color: "#94a3b8", fontSize: 12 },
  kpiRow:       { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 },
  sparkWrap:    { flexShrink: 0, width: 220, minWidth: 160 },

  savingsBanner: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 20px", marginBottom: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.03)" },
  goalTrack:     { height: 8, background: "#f1f5f9", borderRadius: 20, overflow: "hidden" },
  goalFill:      { height: "100%", borderRadius: 20, transition: "width 0.6s ease" },

  stats:   { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 18 },
  statCard:{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 2px 10px rgba(0,0,0,0.02)" },

  columns: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 18 },
  panel:   { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 22, minWidth: 0, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14 },
  panelTitle:  { margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" },
  panelSub:    { margin: "2px 0 0", color: "#64748b", fontSize: 12 },
  textBtn:     { background: "none", border: "none", color: "#07845e", fontWeight: 700, fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "inherit", display: "inline-flex", alignItems: "center" },
  empty:       { textAlign: "center", padding: "30px 10px", color: "#64748b" },
  emptyIcon:   { display: "grid", placeItems: "center", width: 44, height: 44, margin: "0 auto 12px", borderRadius: 12, background: "#f1f5f9", color: "#64748b", fontSize: 18 },
  txnRow:      { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f1f5f9" },
  txnLeft:     { display: "flex", alignItems: "center", gap: 11, minWidth: 0 },
  txnRight:    { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  txnIcon:     { flex: "0 0 34px", width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, fontSize: 13 },
  txnName:     { display: "block", color: "#1e293b", fontSize: 13, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  txnMeta:     { display: "block", color: "#94a3b8", fontSize: 11 },
  iconEditBtn:  { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", borderRadius: 6, width: 28, height: 28, fontSize: 11, display: "grid", placeItems: "center", cursor: "pointer", padding: 0 },
  iconDeleteBtn:{ background: "#fef2f2", border: "1px solid #fecaca", color: "#ef4444", borderRadius: 6, width: 28, height: 28, fontSize: 11, display: "grid", placeItems: "center", cursor: "pointer", padding: 0 },
  viewAllBtn:  { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#2563eb", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%", fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center" },
};