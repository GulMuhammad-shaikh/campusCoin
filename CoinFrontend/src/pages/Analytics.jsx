import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { transactionAPI } from "../utils/api";
import { formatRupees } from "../utils/transactions";
import { useTheme } from "../context/ThemeContext";

// ─── Color palette for categories ────────────────────────────────────────────
const CAT_COLORS = [
  "#6366f1", "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6",
  "#f97316", "#06b6d4", "#a855f7", "#84cc16", "#ef4444",
];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function shortRs(v) {
  if (v >= 100000) return `Rs.${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `Rs.${(v / 1000).toFixed(1)}K`;
  return `Rs.${v}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Custom tooltip for column chart ─────────────────────────────────────────
function DayTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tt.box}>
      <strong style={{ fontSize: 13, color: "var(--text-pure)" }}>Day {label}</strong>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.fill, fontSize: 12, marginTop: 4 }}>
          {p.name}: {formatRupees(p.value)}
        </div>
      ))}
    </div>
  );
}

const tt = {
  box: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-glass)",
    borderRadius: 10,
    padding: "10px 14px",
    boxShadow: "var(--shadow-card)",
    fontFamily: "var(--font-heading)",
    color: "var(--text-pure)",
  },
};

// ─── Custom label for Pie / Donut ─────────────────────────────────────────────
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.04) return null; // hide tiny slices
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

// ─── Main Analytics Page ──────────────────────────────────────────────────────
export default function Analytics({ student }) {
  const { isDark } = useTheme();
  const userId = student?.user_id || student?._id || student?.id;

  const tooltipStyle = {
    background: isDark ? "#0c121e" : "#ffffff",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
    borderRadius: 10,
    fontSize: 12,
    color: isDark ? "#ffffff" : "#0f172a",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
  };

  const now = new Date();
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
  const [allTxns, setAllTxns]             = useState([]);
  const [savings, setSavings]             = useState({ goalAmount: 0 });
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [yearlyChartYear, setYearlyChartYear] = useState(now.getFullYear());

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const isValidId = userId && /^[0-9a-fA-F]{24}$/.test(String(userId));
      const params = isValidId ? { user_id: userId } : {};
      const txnRes = await transactionAPI.getAll(params);
      setAllTxns(txnRes?.transactions || []);

      // Try to read savings goal from localStorage (set by Savings page)
      try {
        const sg = JSON.parse(localStorage.getItem("campusCoinSavingsGoal") || "{}");
        setSavings({ goalAmount: Number(sg?.target || sg?.goalAmount || 0) });
      } catch {
        setSavings({ goalAmount: 0 });
      }
    } catch (err) {
      setError("Could not load data. Make sure backend is running.");
      console.error("Analytics API error:", err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("campusCoinDataChanged", handler);
    return () => window.removeEventListener("campusCoinDataChanged", handler);
  }, [loadData]);

  // ── Filter to selected month ──────────────────────────────────────────────
  const monthTxns = useMemo(() =>
    allTxns.filter((t) => {
      const d = new Date(t.date || t.created_at);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    }),
  [allTxns, selectedYear, selectedMonth]);

  // ── 1. Column chart data: actual income & expenses per day ───────────────
  const columnData = useMemo(() => {
    const days = getDaysInMonth(selectedYear, selectedMonth);

    // Group actual transactions by day — no spreading or dividing
    const dailyIncome  = {};
    const dailyExpense = {};
    monthTxns.forEach((t) => {
      const day = new Date(t.date || t.created_at).getDate();
      if (t.type === "income")  dailyIncome[day]  = (dailyIncome[day]  || 0) + Number(t.amount || 0);
      if (t.type === "expense") dailyExpense[day] = (dailyExpense[day] || 0) + Number(t.amount || 0);
    });

    return Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      return {
        day,
        Income:   parseFloat((dailyIncome[day]  || 0).toFixed(2)),
        Expenses: parseFloat((dailyExpense[day] || 0).toFixed(2)),
      };
    });
  }, [monthTxns, selectedYear, selectedMonth]);

  // ── 2. Pie chart: Income%, Expenses%, Savings% ────────────────────────────
  const pieData = useMemo(() => {
    const totalIncome  = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpense = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
    const remaining    = Math.max(0, totalIncome - totalExpense);
    const goalAmt      = savings.goalAmount || 0;

    // Savings goal slice = min(goalAmt, remaining) — can't save more than what's left
    const savingsPart  = Math.min(goalAmt, remaining);
    // Remaining after savings
    const leftover     = Math.max(0, remaining - savingsPart);

    // If income is 0, show only expenses (or empty state)
    const total = totalIncome + totalExpense + goalAmt;
    if (total === 0) return [];

    const pieTotal = totalIncome > 0 ? totalIncome : totalExpense;

    return [
      { name: "Expenses",     value: totalExpense,              color: "#ef4444" },
      { name: "Savings Goal", value: savingsPart,               color: "#3b82f6" },
      { name: "Remaining",    value: Math.max(0, totalIncome - totalExpense - savingsPart), color: "#10b981" },
    ].filter((d) => d.value > 0);
  }, [monthTxns, savings]);

  // ── 3. Donut chart: Expenses by category ─────────────────────────────────
  const donutData = useMemo(() => {
    const catMap = {};
    monthTxns.filter((t) => t.type === "expense").forEach((t) => {
      const cat = t.category_id?.name || t.category || "Other";
      catMap[cat] = (catMap[cat] || 0) + Number(t.amount || 0);
    });
    return Object.entries(catMap)
      .map(([name, value], i) => ({ name, value, color: CAT_COLORS[i % CAT_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [monthTxns]);

  // ── 4. Yearly overview: income & expenses per month ──────────────────────
  const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const yearlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: MONTH_SHORT[i],
      Income:   0,
      Expenses: 0,
    }));
    allTxns.forEach((t) => {
      const d = new Date(t.date || t.created_at);
      if (d.getFullYear() !== yearlyChartYear) return;
      const mi = d.getMonth();
      if (t.type === "income")  months[mi].Income   += Number(t.amount || 0);
      if (t.type === "expense") months[mi].Expenses += Number(t.amount || 0);
    });
    return months.map((m) => ({
      ...m,
      Income:   parseFloat(m.Income.toFixed(2)),
      Expenses: parseFloat(m.Expenses.toFixed(2)),
    }));
  }, [allTxns, yearlyChartYear]);

  // ── Summary totals ────────────────────────────────────────────────────────
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const totalIncome  = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpense = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [monthTxns]);

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  if (loading) return (
    <div style={S.center}>
      <div style={S.spinner} />
      <p style={{ color: "#64748b", marginTop: 14, fontSize: 14 }}>Loading analytics…</p>
    </div>
  );

  return (
    <div style={S.page} className="animate-fade-in cc-page">
      {/* ── Header ── */}
      <div style={S.header} className="cc-header">
        <div>
          <span style={S.eyebrow}>
            <i className="fa-solid fa-chart-pie" style={{ marginRight: 6 }}></i>
            VISUAL ANALYTICS
          </span>
          <h1 style={S.title}>Financial Charts</h1>
          <p style={S.sub}>Visual overview of your income, expenses & savings</p>
        </div>

        {/* Month/Year selector */}
        <div style={S.selectors} className="cc-selectors">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={S.select}
          >
            {monthNames.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={S.select}
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={loadData} style={S.refreshBtn} title="Refresh">
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      </div>

      {error && (
        <div style={S.errorBanner}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
          {error}
          <button onClick={loadData} style={S.retryBtn}>Retry</button>
        </div>
      )}

      {/* ── Summary Pills ── */}
      <div style={S.pills} className="cc-pills">
        <Pill label="Income" value={formatRupees(totalIncome)} color="#10b981" bg="#d1fae5" />
        <Pill label="Expenses" value={formatRupees(totalExpense)} color="#ef4444" bg="#fee2e2" />
        <Pill label="Balance" value={formatRupees(balance)} color={balance >= 0 ? "#6366f1" : "#ef4444"} bg="#ede9fe" />
        <Pill label="Transactions" value={String(monthTxns.length)} color="#f59e0b" bg="#fef3c7" />
      </div>

      {/* ── Chart 1: Daily Income vs Expenses Column Chart ── */}
      <ChartCard
        title={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <i className="fa-solid fa-chart-column" style={{ color: "#07845e" }}></i>
            Daily Income vs Expenses
          </span>
        }
        subtitle={`Each day of ${monthNames[selectedMonth]} ${selectedYear} — actual daily transactions recorded`}
      >
        {columnData.length === 0 || (totalIncome === 0 && totalExpense === 0) ? (
          <EmptyChart msg="No transactions recorded for this month yet." />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={columnData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} label={{ value: "Day", position: "insideBottom", offset: -2, fontSize: 11, fill: "#94a3b8" }} height={38} />
              <YAxis tickFormatter={shortRs} tick={{ fontSize: 11, fill: "#64748b" }} width={70} />
              <Tooltip content={<DayTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Income"   fill="#10b981" radius={[3,3,0,0]} maxBarSize={18} />
              <Bar dataKey="Expenses" fill="#ef4444" radius={[3,3,0,0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── 2 Donut Charts in 1 Horizontal Row ── */}
      <div style={S.twoColChartsRow} className="cc-two-col">
        {/* ── Chart 2: Donut – Income / Expenses / Savings ── */}
        <ChartCard
          style={{ marginBottom: 0 }}
          title={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <i className="fa-solid fa-circle-notch" style={{ color: "#6366f1" }}></i>
              Financial Distribution
            </span>
          }
          subtitle="Breakdown of expenses, savings goal, and balance"
        >
          {pieData.length === 0 ? (
            <EmptyChart msg="No financial data for this month." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderPieLabel}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatRupees(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div style={{ width: "100%" }}>
                {pieData.map((entry) => {
                  const total = pieData.reduce((s, d) => s + d.value, 0);
                  const pct   = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
                  return (
                    <div key={entry.name} style={S.pieLegendRow}>
                      <span style={{ ...S.pieDot, background: entry.color }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{entry.name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{formatRupees(entry.value)} · {pct}%</div>
                      </div>
                    </div>
                  );
                })}
                {savings.goalAmount > 0 && (
                  <div style={{ marginTop: 12, padding: "10px 12px", background: "#eff6ff", borderRadius: 10, fontSize: 12, color: "#1d4ed8" }}>
                    <i className="fa-solid fa-bullseye" style={{ marginRight: 6 }}></i>
                    Savings goal: {formatRupees(savings.goalAmount)}
                    {balance <= 0 && (
                      <div style={{ color: "#ef4444", marginTop: 4 }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 5 }}></i>
                        No remaining income to fund savings goal!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </ChartCard>

        {/* ── Chart 3: Donut – Expenses by Category ── */}
        <ChartCard
          style={{ marginBottom: 0 }}
          title={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <i className="fa-solid fa-chart-pie" style={{ color: "#f59e0b" }}></i>
              Expenses by Category
            </span>
          }
          subtitle="How spending is distributed across categories"
        >
          {donutData.length === 0 ? (
            <EmptyChart msg="No expense transactions recorded this month." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderPieLabel}
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatRupees(v), n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category legend */}
              <div style={{ width: "100%", maxHeight: 220, overflowY: "auto" }}>
                {donutData.map((entry) => {
                  const total = donutData.reduce((s, d) => s + d.value, 0);
                  const pct   = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
                  return (
                    <div key={entry.name} style={S.pieLegendRow}>
                      <span style={{ ...S.pieDot, background: entry.color }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>{entry.name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{formatRupees(entry.value)} · {pct}%</div>
                      </div>
                      {/* mini bar */}
                      <div style={{ width: 70 }}>
                        <div style={{ height: 6, background: "rgba(255, 255, 255, 0.08)", borderRadius: 20, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: entry.color, borderRadius: 20 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Chart 4: Yearly Monthly Overview ── */}
      <ChartCard
        title={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <i className="fa-solid fa-calendar-days" style={{ color: "#10b981" }}></i>
            Yearly Cash Flow
          </span>
        }
        subtitle={`Monthly income vs expenses for ${yearlyChartYear} — full year overview`}
        headerRight={
          <select
            value={yearlyChartYear}
            onChange={(e) => setYearlyChartYear(Number(e.target.value))}
            style={S.select}
          >
            {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        }
      >
        {yearlyData.every((m) => m.Income === 0 && m.Expenses === 0) ? (
          <EmptyChart msg={`No transactions found for ${yearlyChartYear}.`} />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={yearlyData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tickFormatter={shortRs} tick={{ fontSize: 11, fill: "#64748b" }} width={70} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatRupees(v), n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Income"   name="Income"   fill="#10b981" radius={[4,4,0,0]} maxBarSize={36} />
              <Bar dataKey="Expenses" name="Expenses" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, headerRight, style }) {
  return (
    <div style={{ ...S.card, ...style }} className="card-hover">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <h2 style={S.cardTitle}>{title}</h2>
          <p style={S.cardSub}>{subtitle}</p>
        </div>
        {headerRight && <div style={{ flexShrink: 0 }}>{headerRight}</div>}
      </div>
      {children}
    </div>
  );
}

function Pill({ label, value, color, bg }) {
  return (
    <div style={{ ...S.pill, background: bg }} className="card-hover">
      <span style={{ fontSize: 11, color, fontWeight: 700, letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
      <strong style={{ fontSize: 18, color }}>{value}</strong>
    </div>
  );
}

function EmptyChart({ msg }) {
  return (
    <div style={S.empty}>
      <i className="fa-solid fa-inbox" style={{ fontSize: 36, color: "#94a3b8" }}></i>
      <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 10 }}>{msg}</p>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  twoColChartsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
    gap: 20,
    marginBottom: 22,
  },
  page: {
    maxWidth: 1220,
    margin: "0 auto",
    padding: "36px clamp(16px, 3.5vw, 36px) 70px",
    fontFamily: "var(--font-heading)",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "65vh",
    fontFamily: "var(--font-heading)",
  },
  spinner: {
    width: 44,
    height: 44,
    border: "4px solid rgba(255, 255, 255, 0.1)",
    borderTop: "4px solid #10b981",
    borderRadius: "50%",
    animation: "spinSlow 0.9s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 26,
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    color: "#34d399",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    margin: "0 0 6px",
    fontSize: "clamp(26px, 4vw, 36px)",
    color: "#ffffff",
    letterSpacing: "-0.8px",
    fontWeight: 900,
  },
  sub: { margin: 0, color: "#94a3b8", fontSize: 14 },
  selectors: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  select: {
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    padding: "9px 14px",
    fontSize: 13,
    fontFamily: "inherit",
    background: "rgba(16, 24, 40, 0.8)",
    color: "#ffffff",
    cursor: "pointer",
  },
  refreshBtn: {
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    width: 38,
    height: 38,
    borderRadius: 10,
    fontSize: 15,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  errorBanner: {
    background: "rgba(244, 63, 94, 0.15)",
    border: "1px solid rgba(244, 63, 94, 0.3)",
    color: "#fca5a5",
    padding: "12px 18px",
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  retryBtn: {
    background: "#f43f5e",
    border: "none",
    color: "#ffffff",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  pills: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 14,
    marginBottom: 28,
  },
  pill: {
    borderRadius: 16,
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
  },
  card: {
    background: "rgba(16, 24, 40, 0.75)",
    backdropFilter: "blur(18px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: "26px 28px",
    marginBottom: 22,
    boxShadow: "0 20px 45px -12px rgba(0, 0, 0, 0.65)",
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#ffffff",
  },
  cardSub: {
    margin: "6px 0 0",
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 1.5,
  },
  pieLegendRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "9px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  },
  pieDot: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    flexShrink: 0,
  },
  empty: {
    textAlign: "center",
    padding: "50px 20px",
  },
};
