import React, { useState, useEffect, useCallback } from "react";
import { transactionAPI } from "../utils/api";
import { formatRupees } from "../utils/transactions";

export default function Dashboard({ student, onOpenModal, onViewAll }) {
  const name = student?.name || student?.fullName || "Student";
  const userId = student?.user_id || student?._id || student?.id;

  const [loading,      setLoading]      = useState(true);
  const [summary,      setSummary]      = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recent,       setRecent]       = useState([]);
  const [spendingCats, setSpendingCats] = useState([]);
  const [txnCount,     setTxnCount]     = useState(0);
  const [error,        setError]        = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Validate if userId is a 24-character hex ObjectId
      const isValidId = userId && /^[0-9a-fA-F]{24}$/.test(String(userId));
      const params = isValidId ? { user_id: userId } : {};

      // Fetch summary (income, expense, balance totals) strictly from API
      const sumRes = await transactionAPI.getSummary(isValidId ? userId : null);
      if (sumRes?.summary) {
        setSummary(sumRes.summary);
      }

      // Fetch transactions strictly from API
      const txnRes = await transactionAPI.getAll(params);
      const txns = txnRes?.transactions || [];
      setTxnCount(txns.length);

      // Recent 5 (already sorted newest first by API)
      setRecent(
        txns.slice(0, 5).map((t) => ({
          id:          t._id || t.id,
          type:        t.type,
          description: t.description || "",
          category:    t.category_id?.name || t.category || "General",
          amount:      Number(t.amount || 0),
          date:        (t.date || "").slice(0, 10),
        }))
      );

      // Spending categories (expenses grouped strictly from API data)
      const catMap = {};
      txns
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const catName = t.category_id?.name || t.category || "Other";
          catMap[catName] = (catMap[catName] || 0) + Number(t.amount || 0);
        });

      const sorted = Object.entries(catMap)
        .map(([n, a]) => ({ name: n, amount: a }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 7);
      setSpendingCats(sorted);
    } catch (err) {
      setError("Could not load data from server. Make sure backend is running.");
      console.error("Dashboard API error:", err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load on mount + reload whenever campusCoinDataChanged is dispatched
  useEffect(() => {
    loadDashboard();

    const handleDataChanged = () => {
      loadDashboard();
    };
    window.addEventListener("campusCoinDataChanged", handleDataChanged);
    return () => {
      window.removeEventListener("campusCoinDataChanged", handleDataChanged);
    };
  }, [loadDashboard]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.description}"?`)) return;
    try {
      await transactionAPI.delete(item.id);
      window.dispatchEvent(
        new CustomEvent("campusCoinDataChanged", {
          detail: { action: "delete" },
        })
      );
      await loadDashboard();
    } catch (err) {
      alert("Could not delete transaction: " + (err?.message || err));
    }
  };

  const maxCat = Math.max(1, ...spendingCats.map((c) => c.amount));

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner} />
        <p style={{ color: "#64748b", marginTop: 14, fontSize: 14 }}>
          Loading your financial data…
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.heading}>
        <div>
          <span style={styles.eyebrow}>STUDENT FINANCE OVERVIEW</span>
          <h1 style={styles.title}>Welcome back, {name}</h1>
          <p style={styles.subtitle}>Here's what's happening with your money.</p>
        </div>
        <div style={styles.actions}>
          <button style={styles.addIncome}  onClick={() => onOpenModal("income")}>
            + Add income
          </button>
          <button style={styles.addExpense} onClick={() => onOpenModal("expense")}>
            + Add expense
          </button>
          <span style={styles.divider} aria-hidden="true" />
          <button style={styles.addCategory} onClick={() => onOpenModal("category")}>
            + Manage Categories
          </button>
          <button style={styles.refreshBtn} onClick={loadDashboard} title="Refresh data">
            ↺
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={styles.errorBanner}>
          ⚠ {error}
          <button onClick={loadDashboard} style={styles.retryBtn}>Retry</button>
        </div>
      )}

      {/* ── Balance Banner ── */}
      <section style={styles.balance}>
        <div>
          <span style={styles.balanceLabel}>Available balance</span>
          <div style={styles.balanceAmount}>
            {formatRupees(summary.balance || 0)}
          </div>
          <span style={styles.balanceHint}>Income minus recorded expenses</span>
        </div>
        <div style={styles.balanceSymbol}>₨</div>
      </section>

      {/* ── Stats Cards ── */}
      <section style={styles.stats}>
        <Stat
          title="Total income"
          amount={formatRupees(summary.totalIncome || 0)}
          color="#07845e"
          symbol="↗"
        />
        <Stat
          title="Total expenses"
          amount={formatRupees(summary.totalExpense || 0)}
          color="#c84e4e"
          symbol="↘"
        />
        <Stat
          title="Transactions"
          amount={String(txnCount)}
          color="#4e66c8"
          symbol="▤"
        />
      </section>

      {/* ── Columns ── */}
      <section style={styles.columns}>
        {/* Recent Transactions */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Recent transactions</h2>
              <p style={styles.panelSub}>Your latest saved activity</p>
            </div>
            <button style={styles.addRecordBtn} onClick={() => onOpenModal("income")}>
              Add record
            </button>
          </div>

          {recent.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>＋</div>
              <strong>No transactions yet</strong>
              <p style={{ fontSize: 13, color: "#718096" }}>
                Start by adding your first income or expense.
              </p>
              <div style={styles.emptyButtons}>
                <button style={styles.addIncome}  onClick={() => onOpenModal("income")}>
                  Add income
                </button>
                <button style={styles.addExpense} onClick={() => onOpenModal("expense")}>
                  Add expense
                </button>
              </div>
            </div>
          ) : (
            <>
              {recent.map((item) => (
                <div key={item.id} style={styles.txnRow}>
                  <div style={styles.txnLeft}>
                    <span style={{
                      ...styles.txnIcon,
                      background: item.type === "income" ? "#e2f7ef" : "#fff0f0",
                      color:      item.type === "income" ? "#07845e" : "#c84e4e",
                    }}>
                      {item.type === "income" ? "↗" : "↘"}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={styles.txnName}>{item.description}</strong>
                      <span style={styles.txnMeta}>
                        {item.category} · {item.date}
                      </span>
                    </div>
                  </div>
                  <div style={styles.txnRight}>
                    <strong style={{
                      color:      item.type === "income" ? "#07845e" : "#c84e4e",
                      fontSize:   12,
                      whiteSpace: "nowrap",
                    }}>
                      {item.type === "income" ? "+" : "−"} {formatRupees(item.amount)}
                    </strong>
                    <div style={styles.rowActions}>
                      <button
                        type="button"
                        onClick={() => onOpenModal && onOpenModal("edit", item)}
                        style={styles.iconEditBtn}
                        title="Edit transaction"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        style={styles.iconDeleteBtn}
                        title="Delete transaction"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* View All Transactions */}
              <div style={styles.viewAllWrap}>
                <button style={styles.viewAllBtn} onClick={onViewAll}>
                  View all transactions →
                </button>
              </div>
            </>
          )}
        </div>

        {/* Spending by Category */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Spending categories</h2>
              <p style={styles.panelSub}>Your expenses grouped by category</p>
            </div>
          </div>

          {spendingCats.length === 0 ? (
            <p style={styles.noCategories}>
              Add an expense to see which categories your money is going toward.
            </p>
          ) : (
            spendingCats.map((item) => (
              <div key={item.name} style={styles.catItem}>
                <div style={styles.catRow}>
                  <span style={{ fontSize: 12, color: "#526276" }}>{item.name}</span>
                  <strong style={{ fontSize: 12, color: "#17283e" }}>
                    {formatRupees(item.amount)}
                  </strong>
                </div>
                <div style={styles.barTrack}>
                  <div
                    style={{
                      ...styles.bar,
                      width: `${(item.amount / maxCat) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ title, amount, color, symbol }) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statIcon, color, background: `${color}16` }}>
        {symbol}
      </span>
      <span style={styles.statTitle}>{title}</span>
      <strong style={styles.statAmount}>{amount}</strong>
    </div>
  );
}

const styles = {
  loadingPage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    fontFamily: "Inter, Arial, sans-serif",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #07845e",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  page: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "42px 22px 60px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  heading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 23,
  },
  eyebrow: {
    display: "block",
    color: "#07845e",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    margin: "0 0 6px",
    fontSize: "clamp(26px, 4vw, 36px)",
    color: "#142238",
    letterSpacing: "-1px",
  },
  subtitle: { margin: 0, color: "#718096", fontSize: 14 },
  actions: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  addIncome: {
    border: "none",
    cursor: "pointer",
    background: "#07845e",
    color: "#fff",
    padding: "11px 15px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 800,
    fontFamily: "inherit",
  },
  addExpense: {
    cursor: "pointer",
    background: "#fff",
    color: "#bd4848",
    border: "1px solid #f0caca",
    padding: "11px 15px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 800,
    fontFamily: "inherit",
  },
  divider: {
    display: "inline-block",
    width: "1.5px",
    height: 26,
    background: "#cbd5e1",
    margin: "0 3px",
  },
  addCategory: {
    cursor: "pointer",
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    padding: "10px 15px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 800,
    fontFamily: "inherit",
  },
  refreshBtn: {
    cursor: "pointer",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    width: 36,
    height: 36,
    borderRadius: 9,
    fontSize: 18,
    fontFamily: "inherit",
    display: "grid",
    placeItems: "center",
  },
  errorBanner: {
    background: "#fef3cd",
    border: "1px solid #fcd34d",
    color: "#92400e",
    padding: "11px 16px",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  retryBtn: {
    background: "#fbbf24",
    border: "none",
    color: "#78350f",
    borderRadius: 7,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  balance: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    padding: "25px 28px",
    background: "linear-gradient(120deg, #102d36, #087a5a)",
    borderRadius: 17,
    color: "#fff",
    marginBottom: 18,
    boxShadow: "0 15px 35px rgba(8,92,69,0.14)",
  },
  balanceLabel:  { color: "#c4e7dc", fontSize: 13 },
  balanceAmount: { fontSize: "clamp(29px, 4vw, 39px)", fontWeight: 900, margin: "7px 0" },
  balanceHint:   { color: "#c4e7dc", fontSize: 11 },
  balanceSymbol: {
    width: 54, height: 54, display: "grid", placeItems: "center",
    borderRadius: 15, background: "rgba(255,255,255,0.14)", fontSize: 27, fontWeight: 900,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 15,
    marginBottom: 18,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e3e9ef",
    borderRadius: 14,
    padding: 19,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  statIcon:   { width: 35, height: 35, display: "grid", placeItems: "center", borderRadius: 10, fontSize: 19, fontWeight: 900 },
  statTitle:  { color: "#718096", fontSize: 12 },
  statAmount: { color: "#17283e", fontSize: 21 },
  columns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: 18,
  },
  panel: {
    background: "#fff",
    border: "1px solid #e3e9ef",
    borderRadius: 16,
    padding: 22,
    minWidth: 0,
    boxShadow: "0 12px 35px rgba(16,35,55,0.035)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  panelTitle:  { margin: 0, fontSize: 17, color: "#17283e" },
  panelSub:    { margin: "5px 0 0", color: "#8a98a9", fontSize: 12 },
  addRecordBtn: {
    background: "none", border: "none", color: "#07845e", fontWeight: 800,
    fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "inherit",
  },
  empty: { textAlign: "center", padding: "25px 10px", color: "#718096" },
  emptyIcon: {
    display: "grid", placeItems: "center", width: 42, height: 42,
    margin: "0 auto 12px", borderRadius: 12, background: "#e2f7ef", color: "#07845e", fontSize: 22,
  },
  emptyButtons: {
    display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 9, marginTop: 17,
  },
  txnRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    gap: 12, padding: "13px 0", borderBottom: "1px solid #edf1f5",
  },
  txnLeft:    { display: "flex", alignItems: "center", gap: 11, minWidth: 0 },
  txnRight:   { display: "flex", alignItems: "center", gap: 12, flexShrink: 0 },
  rowActions: { display: "flex", alignItems: "center", gap: 4 },
  iconEditBtn: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#2563eb",
    borderRadius: 6,
    width: 26,
    height: 26,
    fontSize: 12,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    padding: 0,
    transition: "all 0.15s ease",
  },
  iconDeleteBtn: {
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#e11d48",
    borderRadius: 6,
    width: 26,
    height: 26,
    fontSize: 12,
    fontWeight: 700,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    padding: 0,
    transition: "all 0.15s ease",
  },
  txnIcon: {
    flex: "0 0 36px", width: 36, height: 36, display: "grid",
    placeItems: "center", borderRadius: 10, fontWeight: 900, fontSize: 18,
  },
  txnName: {
    display: "block", color: "#293b50", fontSize: 13, marginBottom: 4,
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  txnMeta: { display: "block", color: "#8a98a9", fontSize: 11 },
  viewAllWrap: { paddingTop: 14, textAlign: "center" },
  viewAllBtn: {
    background: "#f8fafc", border: "1px solid #e2e8f0", color: "#2563eb",
    borderRadius: 9, padding: "10px 22px", fontSize: 13, fontWeight: 800,
    cursor: "pointer", width: "100%", fontFamily: "inherit",
  },
  noCategories: { color: "#8a98a9", fontSize: 13, lineHeight: 1.7, padding: "18px 0" },
  catItem: { margin: "19px 0" },
  catRow: {
    display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8,
  },
  barTrack: { height: 7, background: "#edf1f5", borderRadius: 20, overflow: "hidden" },
  bar:      { height: "100%", background: "#07845e", borderRadius: 20 },
};