import React, { useState, useEffect, useCallback, useMemo } from "react";
import { transactionAPI, categoryAPI } from "../utils/api";
import { getTransactions, formatRupees } from "../utils/transactions";
import TransactionModal from "../components/TransactionModal";
import sound from "../utils/audio";

/**
 * TransactionsPage
 *
 * Full transaction history with:
 *  - Filter by type: All / Income / Expense
 *  - Filter by category (from backend categories list)
 *  - Month selector: Previous Month / Current Month / Custom Date Range
 *  - Search by description
 *
 * Props:
 *  - student: logged-in student object
 *  - onClose: function to go back (called from modal or parent)
 */
export default function TransactionsPage({ student, onClose }) {
  // ─── Filter State ───────────────────────────────────────────────
  const todayDate = new Date();
  const currentMonthStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}`;
  const prevDate = new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const [filterType,       setFilterType]       = useState("all");       // 'all' | 'income' | 'expense'
  const [filterCategory,   setFilterCategory]   = useState("all");       // 'all' | category name
  const [dateMode,         setDateMode]         = useState("current");   // 'current' | 'previous' | 'range'
  const [startDate,        setStartDate]        = useState("");
  const [endDate,          setEndDate]          = useState("");
  const [searchQuery,      setSearchQuery]      = useState("");

  // ─── Data State ─────────────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [modalConfig,  setModalConfig]  = useState(null); // null | { type?: string, initialData?: object }

  // Fetch categories list for dropdown
  useEffect(() => {
    async function fetchCats() {
      try {
        const data = await categoryAPI.getAll();
        setCategories(data.categories || []);
      } catch (err) {
        console.warn("Could not load categories:", err?.message);
      }
    }
    fetchCats();
  }, []);

  // Fetch transactions based on filters
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const userId = student?.user_id || student?._id || student?.id;
      const isValidId = userId && /^[0-9a-fA-F]{24}$/.test(String(userId));
      const params = {};
      if (isValidId) params.user_id = userId;
      if (filterType !== "all") params.type = filterType;
      if (filterCategory !== "all") params.category_name = filterCategory;

      if (dateMode === "current") {
        params.month = currentMonthStr;
      } else if (dateMode === "previous") {
        params.month = prevMonthStr;
      } else if (dateMode === "range") {
        if (startDate) params.startDate = startDate;
        if (endDate)   params.endDate   = endDate;
      }

      const res = await transactionAPI.getAll(params);
      const apiTxns = (res.transactions || []).map((t) => ({
        id:          t._id || t.id,
        _id:         t._id || t.id,
        type:        t.type,
        description: t.description || "",
        category:    t.category_id?.name || t.category || "—",
        category_id: t.category_id?._id || t.category_id || null,
        amount:      Number(t.amount || 0),
        date:        (t.date || "").slice(0, 10),
      }));

      setTransactions(apiTxns);
    } catch (err) {
      // Fall back to localStorage if backend not available
      console.warn("API unavailable, using localStorage:", err?.message);
      const local = getTransactions(student);
      setTransactions(applyLocalFilters(local));
      setError("Showing offline data — backend unreachable");
    } finally {
      setLoading(false);
    }
  }, [student, filterType, filterCategory, dateMode, startDate, endDate, currentMonthStr, prevMonthStr]);

  useEffect(() => {
    fetchTransactions();

    const handleDataChanged = () => {
      fetchTransactions();
    };
    window.addEventListener("campusCoinDataChanged", handleDataChanged);
    return () => {
      window.removeEventListener("campusCoinDataChanged", handleDataChanged);
    };
  }, [fetchTransactions]);

  const handleDelete = async (item) => {
    const desc = item.description || item.category || "this transaction";
    if (!window.confirm(`Delete "${desc}"?`)) return;
    try {
      await transactionAPI.delete(item.id);
      window.dispatchEvent(
        new CustomEvent("campusCoinDataChanged", {
          detail: { action: "delete" },
        })
      );
      await fetchTransactions();
    } catch (err) {
      alert("Failed to delete transaction: " + (err?.message || err));
    }
  };

  // Local filter fallback (when backend is unavailable)
  function applyLocalFilters(txns) {
    return txns.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (dateMode === "current") {
        return (t.date || "").startsWith(currentMonthStr);
      } else if (dateMode === "previous") {
        return (t.date || "").startsWith(prevMonthStr);
      } else if (dateMode === "range") {
        if (startDate && t.date < startDate) return false;
        if (endDate   && t.date > endDate)   return false;
      }
      return true;
    });
  }

  // Client-side search on top of API results
  const displayTxns = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        String(t.amount).includes(q)
    );
  }, [transactions, searchQuery]);

  // Totals
  const totals = useMemo(() => {
    const income   = displayTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = displayTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [displayTxns]);

  // Build unique category names from fetched transactions for dropdown
  const categoryOptions = useMemo(() => {
    const names = new Set();
    if (categories.length > 0) {
      categories.forEach((c) => names.add(c.name));
    } else {
      transactions.forEach((t) => t.category && names.add(t.category));
    }
    return Array.from(names).sort();
  }, [categories, transactions]);

  const monthLabel = (m) => {
    const [y, mo] = m.split("-");
    return new Date(y, mo - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div style={styles.page} className="animate-fade-in">
      {/* ── Top Header ── */}
      <div style={styles.topBar}>
        <div>
          <span style={styles.eyebrow}>
            <i className="fa-solid fa-receipt" style={{ marginRight: 6 }}></i>
            TRANSACTION HISTORY
          </span>
          <h1 style={styles.title}>All Transactions</h1>
          <p style={styles.subtitle}>Filter, search, and review every income and expense record.</p>
        </div>
        {onClose && (
          <button style={styles.backBtn} className="btn-glow" onClick={onClose} title="Back to Dashboard">
            <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }}></i>
            Back to Dashboard
          </button>
        )}
      </div>

      {/* ── Summary Totals ── */}
      <div style={styles.summaryRow}>
        <div style={{ ...styles.sumCard, borderTop: "3px solid #07845e" }} className="card-hover">
          <span style={styles.sumLabel}>
            <i className="fa-solid fa-arrow-up" style={{ color: "#07845e", marginRight: 5 }}></i>
            Income
          </span>
          <strong style={{ ...styles.sumAmount, color: "#07845e" }}>{formatRupees(totals.income)}</strong>
        </div>
        <div style={{ ...styles.sumCard, borderTop: "3px solid #c84e4e" }} className="card-hover">
          <span style={styles.sumLabel}>
            <i className="fa-solid fa-arrow-down" style={{ color: "#c84e4e", marginRight: 5 }}></i>
            Expenses
          </span>
          <strong style={{ ...styles.sumAmount, color: "#c84e4e" }}>{formatRupees(totals.expenses)}</strong>
        </div>
        <div style={{ ...styles.sumCard, borderTop: "3px solid #2563eb" }} className="card-hover">
          <span style={styles.sumLabel}>
            <i className="fa-solid fa-scale-balanced" style={{ color: "#2563eb", marginRight: 5 }}></i>
            Balance
          </span>
          <strong style={{ ...styles.sumAmount, color: totals.balance >= 0 ? "#07845e" : "#c84e4e" }}>
            {formatRupees(totals.balance)}
          </strong>
        </div>
        <div style={{ ...styles.sumCard, borderTop: "3px solid #7c3aed" }} className="card-hover">
          <span style={styles.sumLabel}>
            <i className="fa-solid fa-list-check" style={{ color: "#7c3aed", marginRight: 5 }}></i>
            Records shown
          </span>
          <strong style={{ ...styles.sumAmount, color: "#7c3aed" }}>{displayTxns.length}</strong>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={styles.filterCard}>
        {/* Row 1: Type + Category + Search */}
        <div style={styles.filterRow}>
          {/* Type Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Type</label>
            <div style={styles.typeGroup}>
              {["all", "income", "expense"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { sound.playPop(); setFilterType(t); }}
                  style={{
                    ...styles.typeBtn,
                    background:
                      filterType === t
                        ? t === "income"   ? "#10b981"
                        : t === "expense"  ? "#ef4444"
                        : "#6366f1"
                        : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${filterType === t ? "transparent" : "rgba(255, 255, 255, 0.08)"}`,
                    color: filterType === t ? "#ffffff" : "#94a3b8",
                  }}
                >
                  {t === "all" ? (
                    "All"
                  ) : t === "income" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <i className="fa-solid fa-arrow-up"></i>
                      Income
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <i className="fa-solid fa-arrow-down"></i>
                      Expenses
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Category</label>
            <select
              style={styles.select}
              value={filterCategory}
              onChange={(e) => { sound.playPop(); setFilterCategory(e.target.value); }}
            >
              <option value="all">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div style={{ ...styles.filterGroup, flex: 2 }}>
            <label style={styles.filterLabel}>Search</label>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search by description, category, amount…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Row 2: Date Mode */}
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date Period</label>
            <div style={styles.typeGroup}>
              <button
                type="button"
                onClick={() => { sound.playPop(); setDateMode("previous"); }}
                style={{
                  ...styles.typeBtn,
                  background: dateMode === "previous" ? "#64748b" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${dateMode === "previous" ? "transparent" : "rgba(255, 255, 255, 0.08)"}`,
                  color: dateMode === "previous" ? "#fff" : "#94a3b8",
                }}
              >
                {monthLabel(prevMonthStr)}
              </button>
              <button
                type="button"
                onClick={() => { sound.playPop(); setDateMode("current"); }}
                style={{
                  ...styles.typeBtn,
                  background: dateMode === "current" ? "#6366f1" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${dateMode === "current" ? "transparent" : "rgba(255, 255, 255, 0.08)"}`,
                  color: dateMode === "current" ? "#fff" : "#94a3b8",
                }}
              >
                {monthLabel(currentMonthStr)} (Current)
              </button>
              <button
                type="button"
                onClick={() => { sound.playPop(); setDateMode("range"); }}
                style={{
                  ...styles.typeBtn,
                  background: dateMode === "range" ? "#06b6d4" : "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${dateMode === "range" ? "transparent" : "rgba(255, 255, 255, 0.08)"}`,
                  color: dateMode === "range" ? "#fff" : "#94a3b8",
                }}
              >
                <i className="fa-solid fa-calendar-days" style={{ marginRight: 6 }}></i>
                Date Range
              </button>
            </div>
          </div>

          {/* Range Date Pickers (only when range mode) */}
          {dateMode === "range" && (
            <>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>From</label>
                <input
                  style={styles.dateInput}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>To</label>
                <input
                  style={styles.dateInput}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Transactions Table ── */}
      <div style={styles.tableCard} className="card-hover">
        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        {loading ? (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <p style={{ color: "#64748b", marginTop: 12 }}>Loading transactions…</p>
          </div>
        ) : displayTxns.length === 0 ? (
          <div style={styles.emptyWrap}>
            <div style={styles.emptyIcon}>
              <i className="fa-solid fa-inbox"></i>
            </div>
            <strong>No transactions found</strong>
            <p style={{ color: "#8a98a9", fontSize: 13, marginTop: 6 }}>
              Try changing the filters or add your first transaction.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Date</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Amount</th>
                  <th style={{ ...styles.th, textAlign: "center", width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayTxns.map((item, idx) => (
                  <tr key={item.id} style={idx % 2 === 0 ? {} : { background: "#fafbfc" }}>
                    <td style={{ ...styles.td, color: "#94a3b8", width: 36 }}>
                      {idx + 1}
                    </td>
                    <td style={styles.td}>
                      <strong style={{ color: "#1e293b", fontSize: 13 }}>{item.description || item.category}</strong>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.catBadge,
                        background: item.type === "income" ? "#dcfce7" : "#fee2e2",
                        color:      item.type === "income" ? "#15803d" : "#b91c1c",
                      }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.typeBadge,
                        background: item.type === "income" ? "#e2f7ef" : "#fff0f0",
                        color:      item.type === "income" ? "#07845e" : "#c84e4e",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}>
                        <i className={`fa-solid ${item.type === "income" ? "fa-arrow-up" : "fa-arrow-down"}`}></i>
                        {item.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: "#64748b", fontSize: 12 }}>
                      {item.date}
                    </td>
                    <td style={{ ...styles.td, textAlign: "right", whiteSpace: "nowrap", fontWeight: 800, color: item.type === "income" ? "#07845e" : "#c84e4e" }}>
                      {item.type === "income" ? "+" : "−"} {formatRupees(item.amount)}
                    </td>
                    <td style={{ ...styles.td, textAlign: "center", whiteSpace: "nowrap" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <button
                          onClick={() => setModalConfig({ type: item.type, initialData: item })}
                          style={styles.iconEditBtn}
                          title="Edit transaction"
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          style={styles.iconDeleteBtn}
                          title="Delete transaction"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Update Modal */}
      {modalConfig && (
        <TransactionModal
          student={student}
          type={modalConfig.type || modalConfig.initialData?.type || "expense"}
          initialData={modalConfig.initialData}
          onClose={() => setModalConfig(null)}
          onSuccess={() => {
            setModalConfig(null);
            fetchTransactions();
          }}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "36px 22px 60px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: "#f8fafc",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 22,
  },
  eyebrow: { display: "block", color: "#10b981", fontSize: 11, fontWeight: 900, letterSpacing: 1.4, marginBottom: 6 },
  title: { margin: "0 0 6px", fontSize: "clamp(24px, 3.5vw, 34px)", color: "#ffffff", letterSpacing: "-0.8px", fontWeight: 800 },
  subtitle: { margin: 0, color: "#94a3b8", fontSize: 13 },
  backBtn: {
    background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#60a5fa",
    borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 800,
    cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  sumCard: {
    background: "rgba(16, 24, 40, 0.75)", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(16px)", borderRadius: 14,
    padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6,
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  },
  sumLabel:  { fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 },
  sumAmount: { fontSize: 20, fontWeight: 900 },
  filterCard: {
    background: "rgba(16, 24, 40, 0.75)", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(18px)", borderRadius: 16,
    padding: "20px 22px", marginBottom: 18, display: "flex",
    flexDirection: "column", gap: 14, boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 14,
    alignItems: "flex-end",
  },
  filterGroup: { display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 140 },
  filterLabel: { fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 },
  typeGroup: { display: "flex", gap: 6, flexWrap: "wrap" },
  typeBtn: {
    border: "none", borderRadius: 8, padding: "8px 14px",
    fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
    transition: "all 0.15s ease",
  },
  select: {
    width: "100%", boxSizing: "border-box", border: "1px solid rgba(255, 255, 255, 0.12)",
    background: "#141d30", borderRadius: 10, padding: "10px 12px",
    fontSize: 13, color: "#ffffff", fontFamily: "inherit", outline: "none",
  },
  searchInput: {
    width: "100%", boxSizing: "border-box", border: "1px solid rgba(255, 255, 255, 0.12)",
    background: "rgba(255, 255, 255, 0.05)", borderRadius: 10, padding: "10px 12px",
    fontSize: 13, color: "#ffffff", fontFamily: "inherit", outline: "none",
  },
  dateInput: {
    width: "100%", boxSizing: "border-box", border: "1px solid rgba(255, 255, 255, 0.12)",
    background: "rgba(255, 255, 255, 0.05)", borderRadius: 10, padding: "10px 12px",
    fontSize: 13, color: "#ffffff", fontFamily: "inherit", outline: "none",
  },
  tableCard: {
    background: "rgba(16, 24, 40, 0.75)", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(18px)", borderRadius: 16,
    padding: "6px 0", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", overflow: "hidden",
  },
  errorBox: {
    background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#fbbf24",
    padding: "10px 16px", margin: "10px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
  },
  loadingWrap: { textAlign: "center", padding: "50px 20px" },
  spinner: {
    width: 36, height: 36, border: "4px solid rgba(255, 255, 255, 0.1)",
    borderTop: "4px solid #10b981", borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 0.8s linear infinite",
  },
  emptyWrap: { textAlign: "center", padding: "50px 20px", color: "#94a3b8" },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  table: {
    width: "100%", minWidth: 640, borderCollapse: "collapse",
    fontSize: 13, textAlign: "left",
  },
  th: {
    color: "#94a3b8", fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase",
    padding: "13px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", fontWeight: 800,
    background: "rgba(255, 255, 255, 0.02)",
  },
  td: { padding: "14px 16px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", verticalAlign: "middle", color: "#cbd5e1" },
  catBadge: {
    display: "inline-block", padding: "4px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
  },
  typeBadge: {
    display: "inline-block", padding: "3px 9px", borderRadius: 6,
    fontSize: 11, fontWeight: 800, whiteSpace: "nowrap",
  },
  iconEditBtn: {
    background: "rgba(99, 102, 241, 0.15)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    color: "#818cf8",
    borderRadius: 8,
    width: 30,
    height: 30,
    fontSize: 11,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    padding: 0,
    transition: "all 0.15s ease",
  },
  iconDeleteBtn: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#f87171",
    borderRadius: 8,
    width: 30,
    height: 30,
    fontSize: 11,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    padding: 0,
    transition: "all 0.15s ease",
  },
};
