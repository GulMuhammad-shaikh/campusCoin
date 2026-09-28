import React, { useState, useEffect, useMemo, useCallback } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { transactionAPI } from "../utils/api";
import { formatRupees, getCurrency } from "../utils/transactions";
import { fireConfetti, fireCelebration } from "../utils/confetti";
import { sound } from "../utils/audio";
import { useTheme } from "../context/ThemeContext";

export default function Dashboard({ student, onOpenModal, onViewAll }) {
  const { isDark } = useTheme();
  const S = getStyles(isDark);
  const [summary, setSummary]           = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recent, setRecent]             = useState([]);
  const [allTxns, setAllTxns]           = useState([]);
  const [txnCount, setTxnCount]         = useState(0);
  const [spendingCats, setSpendingCats] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [, setCurrencyKey]              = useState(0);
  const [cardFlipped, setCardFlipped]   = useState(false);

  const name = student?.name || student?.username || "Student";
  const userId = student?.user_id || student?._id || student?.id;
  const activeCur = getCurrency();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const isValidId = userId && /^[0-9a-fA-F]{24}$/.test(String(userId));
      const params = isValidId ? { user_id: userId } : {};

      const [sumRes, txnRes] = await Promise.all([
        transactionAPI.getSummary(params).catch(() => null),
        transactionAPI.getAll(params).catch(() => null),
      ]);

      const txns = txnRes?.transactions || [];
      setAllTxns(txns);

      if (sumRes?.summary) {
        setSummary(sumRes.summary);
      } else {
        let totalIncome = 0, totalExpense = 0;
        txns.forEach((t) => {
          if (t.type === "income")  totalIncome  += Number(t.amount || 0);
          if (t.type === "expense") totalExpense += Number(t.amount || 0);
        });
        setSummary({ totalIncome, totalExpense, balance: totalIncome - totalExpense });
      }

      setTxnCount(txns.length);

      const sorted = [...txns].sort(
        (a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
      );

      setRecent(
        sorted.slice(0, 4).map((t) => ({
          id:          t._id || t.id,
          type:        t.type,
          description: t.description || "",
          category:    t.category_id?.name || t.category || "General",
          amount:      Number(t.amount || 0),
          date:        (t.date || "").slice(0, 10),
        }))
      );

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
    const desc = item.description || item.category || "this transaction";
    if (!window.confirm(`Delete "${desc}"?`)) return;
    try {
      sound.playPop();
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

  // Gamified Financial Health Score & Rank
  const healthScore = useMemo(() => {
    if (allTxns.length === 0) return 72;
    let score = 50;
    if (kpi.thisNet > 0) score += 25;
    if (savingsGoal > 0 && savingsProgress >= 50) score += 15;
    if (recent.length >= 2) score += 10;
    return Math.min(99, Math.max(30, score));
  }, [allTxns, kpi, savingsGoal, savingsProgress, recent]);

  const studentRank = useMemo(() => {
    if (healthScore >= 88) return { title: "Campus Baller 👑", badge: "LEVEL 5 • ELITE", color: "#10b981" };
    if (healthScore >= 75) return { title: "Savvy Scholar 🚀", badge: "LEVEL 4 • PRO", color: "#06b6d4" };
    if (healthScore >= 60) return { title: "Disciplined Saver 🌟", badge: "LEVEL 3 • SOLID", color: "#8b5cf6" };
    return { title: "Budget Apprentice 🌱", badge: "LEVEL 2 • GROWING", color: "#f59e0b" };
  }, [healthScore]);

  const handleCardClick = () => {
    sound.playPop();
    fireConfetti();
    setCardFlipped((prev) => !prev);
  };

  const handleCelebrate = () => {
    sound.playChime();
    fireCelebration();
  };

  if (loading) {
    return (
      <div style={S.center}>
        <div style={S.spinner} />
        <p style={{ color: "#94a3b8", marginTop: 16, fontSize: 15, fontWeight: 600 }}>
          Summoning your student financial overview…
        </p>
      </div>
    );
  }

  return (
    <div style={S.page} className="animate-fade-in cc-page">
      {/* ─── Hero Header & Speed Bar ─── */}
      <div style={S.headerTop} className="cc-header-top">
        <div>
          <div style={S.badgeRow}>
            <span style={S.livePill}>
              <span style={S.liveDot} />
              REAL-TIME CAMPUS VAULT
            </span>
            <span style={{ ...S.rankPill, borderColor: studentRank.color, color: studentRank.color }}>
              {studentRank.badge}
            </span>
          </div>
          <h1 style={S.welcomeTitle}>
            Hey, {name}! <span style={{ fontSize: 24 }}>👋</span>
          </h1>
          <p style={S.welcomeSub}>
            Here is your live financial snapshot, smart card status, and recent activity.
          </p>
        </div>

        {/* Speed Actions */}
        <div style={S.speedActions} className="cc-speed-actions">
          <button
            style={S.addIncomeBtn}
            className="btn-glow"
            onClick={() => {
              sound.playPop();
              onOpenModal("income");
            }}
          >
            <i className="fa-solid fa-plus" style={{ marginRight: 6 }}></i>
            Add Income
          </button>
          <button
            style={S.addExpenseBtn}
            className="btn-glow"
            onClick={() => {
              sound.playPop();
              onOpenModal("expense");
            }}
          >
            <i className="fa-solid fa-minus" style={{ marginRight: 6 }}></i>
            Add Spend
          </button>
          <button
            style={S.addCategoryBtn}
            className="btn-glow"
            onClick={() => {
              sound.playPop();
              onOpenModal("category");
            }}
          >
            <i className="fa-solid fa-tags" style={{ marginRight: 6 }}></i>
            Categories
          </button>
          <button
            style={S.celebrateBtn}
            className="btn-glow"
            onClick={handleCelebrate}
            title="Launch Celebration Confetti!"
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </button>
          <button
            style={S.refreshBtn}
            className="btn-glow"
            onClick={() => {
              sound.playPop();
              loadDashboard();
            }}
            title="Refresh Data"
          >
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      </div>

      {error && (
        <div style={S.errorBanner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
          <button onClick={loadDashboard} style={S.retryBtn}>Retry</button>
        </div>
      )}

      {/* ─── Hero Row: Holographic Virtual Student Debit Card + Gamified Health Score ─── */}
      <div style={S.cardRow} className="cc-card-row">
        {/* Holographic Virtual Student Card */}
        <div
          className="holo-card card-hover"
          style={S.virtualCard}
          onClick={handleCardClick}
          title="Click to celebrate and interact with your virtual campus card!"
        >
          <div style={S.cardTopRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={S.chipIcon}>
                <i className="fa-solid fa-microchip"></i>
              </span>
              <i className="fa-solid fa-wifi" style={{ fontSize: 18, color: "rgba(255,255,255,0.75)" }}></i>
            </div>
            <span style={S.cardBadgeLabel}>
              <i className="fa-solid fa-shield-halved" style={{ marginRight: 5, color: "#34d399" }}></i>
              CAMPUS COIN PLATINUM
            </span>
          </div>

          <div style={S.cardBalanceBlock}>
            <span style={S.cardBalanceCaption}>AVAILABLE BALANCE</span>
            <div style={S.cardBalanceValue}>
              {formatRupees(summary.balance || 0)}
            </div>
            <span style={S.cardCurrencyNote}>
              Active in {activeCur.name} ({activeCur.code})
            </span>
          </div>

          <div style={S.cardBottomRow}>
            <div>
              <span style={S.cardSubCaption}>CARD HOLDER</span>
              <div style={S.cardStudentName}>{name.toUpperCase()}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={S.cardSubCaption}>STUDENT ID</span>
              <div style={S.cardDigits}>•••• {String(student?.user_id || "2026").slice(-4)}</div>
            </div>
          </div>
        </div>

        {/* Gamified Health Score & Streak Widget */}
        <div style={S.healthWidget} className="card-hover">
          <div style={S.healthHeader}>
            <div>
              <span style={S.healthEyebrow}>FINANCIAL HEALTH SCORE</span>
              <h3 style={S.healthTitle}>{studentRank.title}</h3>
            </div>
            <div style={S.scoreCircle}>
              <span style={{ fontSize: 24, fontWeight: 900, color: studentRank.color }}>
                {healthScore}
              </span>
              <span style={{ fontSize: 10, color: isDark ? "#94a3b8" : "#64748b" }}>/100</span>
            </div>
          </div>

          {/* Gamified Badges */}
          <div style={S.streakRow}>
            <div style={S.streakBadge}>
              <i className="fa-solid fa-fire" style={{ color: "#f59e0b", fontSize: 14 }}></i>
              <span>7-Day Active Streak</span>
            </div>
            <div style={S.streakBadge}>
              <i className="fa-solid fa-trophy" style={{ color: "#fbbf24", fontSize: 14 }}></i>
              <span>Budget Master</span>
            </div>
          </div>

          {/* 7-Day Running Balance Trend */}
          <div style={S.sparklineWrap}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 11, color: "#94a3b8" }}>
              <span><i className="fa-solid fa-chart-line" style={{ marginRight: 5, color: "#34d399" }}></i>7-day trend</span>
              <span style={{ color: kpi.trending === "up" ? "#34d399" : "#f43f5e", fontWeight: 700 }}>
                {kpi.netDiff >= 0 ? "+" : ""}{kpi.netDiff.toFixed(1)}% vs last month
              </span>
            </div>
            <ResponsiveContainer width="100%" height={70}>
              <LineChart data={kpi.spark}>
                <Line
                  type="monotone"
                  dataKey="bal"
                  stroke="#34d399"
                  strokeWidth={2.8}
                  dot={false}
                  activeDot={{ r: 5, fill: "#34d399", stroke: isDark ? "#080c14" : "#ffffff", strokeWidth: 2 }}
                />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#0c121e" : "#ffffff",
                    border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: isDark ? "#fff" : "#0f172a",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  }}
                  formatter={(v) => [formatRupees(v), "Balance"]}
                  labelFormatter={(l) => `Date: ${l}`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Savings Goal Progress Banner ─── */}
      {savingsGoal > 0 && (
        <div style={S.savingsBanner} className="card-hover">
          <div style={S.savingsHeaderRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={S.goalIconWrap}>
                <i className="fa-solid fa-bullseye"></i>
              </span>
              <div>
                <strong style={{ fontSize: 14, color: isDark ? "#ffffff" : "#0f172a" }}>
                  Monthly Savings Target: {formatRupees(savingsGoal)}
                </strong>
                <div style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#475569" }}>
                  Saved: <strong style={{ color: "#34d399" }}>{formatRupees(Math.max(0, kpi.thisNet))}</strong> ·
                  Remaining: <strong style={{ color: "#fbbf24" }}>{formatRupees(Math.max(0, savingsGoal - kpi.thisNet))}</strong>
                </div>
              </div>
            </div>

            <span style={{
              ...S.savingsGoalPill,
              background: savingsProgress >= 100 ? "rgba(16, 185, 129, 0.2)" : "rgba(99, 102, 241, 0.2)",
              color: savingsProgress >= 100 ? "#34d399" : "#818cf8",
            }}>
              <i className={`fa-solid ${savingsProgress >= 100 ? "fa-circle-check" : "fa-chart-pie"}`} style={{ marginRight: 6 }}></i>
              {savingsProgress >= 100 ? "Goal Crushed! 🎉" : `${savingsProgress.toFixed(0)}% Saved`}
            </span>
          </div>

          <div style={S.goalTrack}>
            <div
              style={{
                ...S.goalFill,
                width: `${Math.min(100, savingsProgress)}%`,
                background: savingsProgress >= 100
                  ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                  : "linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)",
              }}
            />
          </div>
        </div>
      )}

      {/* ─── 4 Quick KPI Glass Cards ─── */}
      <div style={S.kpiGrid} className="cc-kpi-grid">
        <MetricCard isDark={isDark} S={S} title="Total Inflow"
          amount={formatRupees(summary.totalIncome || 0)}
          color="#10b981"
          icon="fa-solid fa-arrow-trend-up"
          sub="All logged allowances & income"
        />
        <MetricCard isDark={isDark} S={S} title="Total Outflow"
          amount={formatRupees(summary.totalExpense || 0)}
          color="#f43f5e"
          icon="fa-solid fa-arrow-trend-down"
          sub="Campus food, transit & bills"
        />
        <MetricCard isDark={isDark} S={S} title="Total Records"
          amount={String(txnCount)}
          color="#38bdf8"
          icon="fa-solid fa-receipt"
          sub="Synced with database"
        />
        <MetricCard isDark={isDark} S={S} title="Savings Rate"
          amount={summary.totalIncome > 0 ? `${(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100).toFixed(1)}%` : "—"}
          color="#a855f7"
          icon="fa-solid fa-piggy-bank"
          sub="Income retained as savings"
        />
      </div>

      {/* ─── Two Column Layout: Recent Transactions + Spending Breakdown ─── */}
      <div style={S.columns} className="cc-two-col">
        {/* Recent Transactions Panel */}
        <div style={S.glassPanel} className="card-hover">
          <div style={S.panelHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={S.panelIconWrap}>
                <i className="fa-solid fa-clock-rotate-left"></i>
              </span>
              <div>
                <h3 style={S.panelTitle}>Recent Activity</h3>
                <p style={S.panelSubtitle}>Your latest financial records</p>
              </div>
            </div>
            <button
              style={S.quickAddBtn}
              className="btn-glow"
              onClick={() => {
                sound.playPop();
                onOpenModal("income");
              }}
            >
              <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i>
              New
            </button>
          </div>

          {recent.length === 0 ? (
            <div style={S.emptyState}>
              <div style={S.emptyIcon}>
                <i className="fa-solid fa-receipt"></i>
              </div>
              <strong style={{ color: "#ffffff", fontSize: 14 }}>No transactions logged yet</strong>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "6px 0 16px" }}>
                Begin by logging your first campus allowance or expense.
              </p>
              <button
                style={S.addIncomeBtn}
                className="btn-glow"
                onClick={() => onOpenModal("income")}
              >
                Log First Transaction
              </button>
            </div>
          ) : (
            <div style={S.txnList}>
              {recent.map((item) => (
                <div key={item.id} style={S.txnItem}>
                  <div style={S.txnLeft}>
                    <span style={{
                      ...S.txnIconBadge,
                      background: item.type === "income" ? "rgba(16, 185, 129, 0.16)" : "rgba(244, 63, 94, 0.16)",
                      color: item.type === "income" ? "#34d399" : "#f43f5e",
                    }}>
                      <i className={`fa-solid ${item.type === "income" ? "fa-arrow-up" : "fa-arrow-down"}`}></i>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={S.txnName}>{item.description || item.category}</strong>
                      <span style={S.txnCategory}>{item.category} · {item.date}</span>
                    </div>
                  </div>

                  <div style={S.txnRight}>
                    <strong style={{
                      color: item.type === "income" ? "#34d399" : "#f43f5e",
                      fontSize: 14,
                      fontFamily: "var(--font-heading)",
                    }}>
                      {item.type === "income" ? "+" : "−"} {formatRupees(item.amount)}
                    </strong>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        onClick={() => onOpenModal && onOpenModal("edit", item)}
                        style={S.editBtn}
                        className="btn-glow"
                        title="Edit transaction"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        style={S.deleteBtn}
                        className="btn-glow"
                        title="Delete transaction"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button style={S.viewAllHistoryBtn} className="btn-glow" onClick={onViewAll}>
                View all transactions
                <i className="fa-solid fa-arrow-right" style={{ marginLeft: 8 }}></i>
              </button>
            </div>
          )}
        </div>

        {/* Spending Categories Breakdown */}
        <div style={S.glassPanel} className="card-hover">
          <div style={S.panelHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ ...S.panelIconWrap, background: "rgba(245, 158, 11, 0.14)", color: "#f59e0b" }}>
                <i className="fa-solid fa-chart-pie"></i>
              </span>
              <div>
                <h3 style={S.panelTitle}>Spending Distribution</h3>
                <p style={S.panelSubtitle}>Expense breakdown by category</p>
              </div>
            </div>
            {spendingCats.length > 0 && (
              <span style={S.topCategoryBadge}>
                Top: {spendingCats[0]?.name}
              </span>
            )}
          </div>

          {spendingCats.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "30px 10px" }}>
              No expense categories recorded yet. Log your campus meals or transit to see insights!
            </p>
          ) : (
            <div style={S.categoryList}>
              {spendingCats.map((item, i) => {
                const pct = (item.amount / maxCat) * 100;
                const colors = ["#10b981", "#38bdf8", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];
                const color = colors[i % colors.length];

                return (
                  <div key={item.name} style={S.catRow}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: isDark ? "#e2e8f0" : "#0f172a", fontWeight: 600 }}>{item.name}</span>
                      <strong style={{ fontSize: 13, color: isDark ? "#ffffff" : "#0f172a" }}>{formatRupees(item.amount)}</strong>
                    </div>
                    <div style={S.catBarTrack}>
                      <div style={{ ...S.catBarFill, width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, amount, color, icon, sub, isDark, S }) {
  return (
    <div style={S.metricCard} className="card-hover">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={S.metricTitle}>{title}</span>
        <span style={{ ...S.metricIconWrap, color, background: `${color}18` }}>
          <i className={icon}></i>
        </span>
      </div>
      <strong style={{ ...S.metricAmount, color: isDark ? "#ffffff" : "#0f172a" }}>{amount}</strong>
      <span style={S.metricSub}>{sub}</span>
    </div>
  );
}

function getStyles(isDark) {
  return {
  page: {
    maxWidth: 1220,
    margin: "0 auto",
    padding: "32px clamp(16px, 3.5vw, 36px) 70px",
    fontFamily: "var(--font-heading)",
  },
  center: {
    minHeight: "65vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 44,
    height: 44,
    border: "4px solid rgba(255, 255, 255, 0.1)",
    borderTop: "4px solid #10b981",
    borderRadius: "50%",
    animation: "spinSlow 0.9s linear infinite",
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 26,
  },
  badgeRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  livePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(16, 185, 129, 0.12)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#34d399",
    padding: "3px 9px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#34d399",
    boxShadow: "0 0 8px #34d399",
  },
  rankPill: {
    border: "1px solid",
    background: "rgba(255, 255, 255, 0.04)",
    padding: "3px 9px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 800,
  },
  welcomeTitle: {
    margin: "0 0 4px",
    fontSize: "clamp(26px, 4vw, 36px)",
    fontWeight: 900,
    color: isDark ? "#ffffff" : "#0f172a",
    letterSpacing: "-0.8px",
  },
  welcomeSub: {
    margin: 0,
    color: isDark ? "#94a3b8" : "#475569",
    fontSize: 14,
  },
  speedActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  addIncomeBtn: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: isDark ? "#ffffff" : "#0f172a",
    border: "none",
    borderRadius: 12,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 4px 18px rgba(16, 185, 129, 0.35)",
  },
  addExpenseBtn: {
    background: isDark ? "rgba(244, 63, 94, 0.14)" : "#fee2e2",
    color: isDark ? "#fca5a5" : "#e11d48",
    border: isDark ? "1px solid rgba(244, 63, 94, 0.3)" : "1px solid #fca5a5",
    borderRadius: 12,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  addCategoryBtn: {
    background: isDark ? "rgba(99, 102, 241, 0.14)" : "#e0e7ff",
    color: isDark ? "#c7d2fe" : "#4338ca",
    border: isDark ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid #c7d2fe",
    borderRadius: 12,
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  celebrateBtn: {
    background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    color: "#0f172a",
    border: "none",
    borderRadius: 12,
    width: 40,
    height: 40,
    fontSize: 15,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 4px 15px rgba(245, 158, 11, 0.35)",
  },
  refreshBtn: {
    background: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #cbd5e1",
    color: isDark ? "#cbd5e1" : "#334155",
    borderRadius: 12,
    width: 40,
    height: 40,
    fontSize: 14,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
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
  },
  retryBtn: {
    background: "#f43f5e",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },

  /* Virtual Card Row */
  cardRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
    gap: 20,
    marginBottom: 22,
  },
  virtualCard: {
    padding: "26px 28px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: 240,
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chipIcon: {
    color: "#fbbf24",
    fontSize: 28,
  },
  cardBadgeLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1,
    color: "rgba(255, 255, 255, 0.85)",
    background: "rgba(0, 0, 0, 0.3)",
    padding: "4px 10px",
    borderRadius: 20,
  },
  cardBalanceBlock: {
    margin: "18px 0 14px",
  },
  cardBalanceCaption: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: "#a7f3d0",
    display: "block",
    marginBottom: 4,
  },
  cardBalanceValue: {
    fontSize: "clamp(32px, 4.5vw, 44px)",
    fontWeight: 900,
    letterSpacing: "-1px",
    color: isDark ? "#ffffff" : "#0f172a",
    textShadow: "0 2px 12px rgba(0, 0, 0, 0.5)",
  },
  cardCurrencyNote: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
  },
  cardBottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTop: "1px solid rgba(255, 255, 255, 0.12)",
    paddingTop: 12,
  },
  cardSubCaption: {
    fontSize: 9,
    fontWeight: 800,
    color: "rgba(255, 255, 255, 0.5)",
    letterSpacing: 1,
    display: "block",
  },
  cardStudentName: {
    fontSize: 13,
    fontWeight: 800,
    color: isDark ? "#ffffff" : "#0f172a",
    letterSpacing: 0.5,
  },
  cardDigits: {
    fontSize: 13,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    color: "rgba(255, 255, 255, 0.85)",
  },

  /* Health Widget */
  healthWidget: {
    background: isDark ? "rgba(16, 24, 40, 0.75)" : "#ffffff",
    backdropFilter: "blur(18px)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
    borderRadius: 20,
    padding: "24px 26px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: isDark ? "0 20px 45px -12px rgba(0, 0, 0, 0.65)" : "0 10px 30px rgba(0, 0, 0, 0.06)",
  },
  healthHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  healthEyebrow: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: "#38bdf8",
    display: "block",
    marginBottom: 4,
  },
  healthTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: isDark ? "#ffffff" : "#0f172a",
  },
  scoreCircle: {
    display: "flex",
    alignItems: "baseline",
    background: isDark ? "rgba(255, 255, 255, 0.05)" : "#f1f5f9",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #cbd5e1",
    padding: "6px 14px",
    borderRadius: 14,
  },
  streakRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "14px 0",
    flexWrap: "wrap",
  },
  streakBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: isDark ? "rgba(255, 255, 255, 0.04)" : "#f1f5f9",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #cbd5e1",
    padding: "6px 12px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    color: isDark ? "#e2e8f0" : "#0f172a",
  },
  sparklineWrap: {
    background: isDark ? "rgba(0, 0, 0, 0.2)" : "#f8fafc",
    borderRadius: 12,
    padding: "10px 14px",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid #e2e8f0",
  },

  /* Savings Banner */
  savingsBanner: {
    background: isDark ? "rgba(16, 24, 40, 0.75)" : "#ffffff",
    backdropFilter: "blur(18px)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
    borderRadius: 18,
    padding: "18px 24px",
    marginBottom: 22,
    boxShadow: isDark ? "0 15px 35px -10px rgba(0, 0, 0, 0.5)" : "0 10px 30px rgba(0, 0, 0, 0.06)",
  },
  savingsHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  goalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "rgba(99, 102, 241, 0.16)",
    color: "#818cf8",
    display: "grid",
    placeItems: "center",
    fontSize: 16,
  },
  savingsGoalPill: {
    fontSize: 12,
    fontWeight: 800,
    padding: "5px 12px",
    borderRadius: 20,
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  goalTrack: {
    height: 10,
    background: isDark ? "rgba(255, 255, 255, 0.06)" : "#e2e8f0",
    borderRadius: 20,
    overflow: "hidden",
  },
  goalFill: {
    height: "100%",
    borderRadius: 20,
    transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
  },

  /* KPI Grid */
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 22,
  },
  metricCard: {
    background: isDark ? "rgba(16, 24, 40, 0.75)" : "#ffffff",
    backdropFilter: "blur(18px)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
    borderRadius: 16,
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    boxShadow: isDark ? "none" : "0 6px 20px rgba(0, 0, 0, 0.04)",
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: isDark ? "#94a3b8" : "#475569",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    fontSize: 14,
  },
  metricAmount: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: "-0.5px",
  },
  metricSub: {
    fontSize: 11,
    color: "#64748b",
  },

  /* Two Columns Layout */
  columns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
    gap: 20,
  },
  glassPanel: {
    background: isDark ? "rgba(16, 24, 40, 0.75)" : "#ffffff",
    backdropFilter: "blur(18px)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
    borderRadius: 20,
    padding: "24px",
    boxShadow: isDark ? "0 20px 45px -12px rgba(0, 0, 0, 0.65)" : "0 10px 30px rgba(0, 0, 0, 0.06)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  panelIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "rgba(56, 189, 248, 0.14)",
    color: "#38bdf8",
    display: "grid",
    placeItems: "center",
    fontSize: 16,
  },
  panelTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    color: isDark ? "#ffffff" : "#0f172a",
  },
  panelSubtitle: {
    margin: "2px 0 0",
    fontSize: 12,
    color: isDark ? "#94a3b8" : "#475569",
  },
  quickAddBtn: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: isDark ? "#e2e8f0" : "#1e293b",
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "36px 16px",
  },
  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    background: "rgba(255, 255, 255, 0.04)",
    color: isDark ? "#94a3b8" : "#475569",
    fontSize: 22,
    display: "grid",
    placeItems: "center",
    margin: "0 auto 12px",
  },
  txnList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  txnItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    background: isDark ? "rgba(255, 255, 255, 0.02)" : "#f8fafc",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid #f1f5f9",
    borderRadius: 12,
    transition: "background 0.2s ease",
  },
  txnLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  txnIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    fontSize: 13,
    flexShrink: 0,
  },
  txnName: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: isDark ? "#ffffff" : "#0f172a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  txnCategory: {
    display: "block",
    fontSize: 11,
    color: isDark ? "#94a3b8" : "#475569",
  },
  txnRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  },
  editBtn: {
    background: "rgba(56, 189, 248, 0.12)",
    border: "1px solid rgba(56, 189, 248, 0.25)",
    color: "#38bdf8",
    borderRadius: 8,
    width: 28,
    height: 28,
    fontSize: 11,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },
  deleteBtn: {
    background: "rgba(244, 63, 94, 0.12)",
    border: "1px solid rgba(244, 63, 94, 0.25)",
    color: "#f43f5e",
    borderRadius: 8,
    width: 28,
    height: 28,
    fontSize: 11,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },
  viewAllHistoryBtn: {
    background: isDark ? "rgba(255, 255, 255, 0.04)" : "#f0fdf4",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #bbf7d0",
    color: isDark ? "#34d399" : "#15803d",
    borderRadius: 12,
    padding: "12px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  topCategoryBadge: {
    fontSize: 11,
    fontWeight: 800,
    color: "#f59e0b",
    background: "rgba(245, 158, 11, 0.12)",
    border: "1px solid rgba(245, 158, 11, 0.25)",
    padding: "3px 10px",
    borderRadius: 12,
  },
  categoryList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  catRow: {
    display: "flex",
    flexDirection: "column",
  },
  catBarTrack: {
    height: 7,
    background: isDark ? "rgba(255, 255, 255, 0.06)" : "#e2e8f0",
    borderRadius: 20,
    overflow: "hidden",
  },
  catBarFill: {
    height: "100%",
    borderRadius: 20,
    transition: "width 0.6s ease",
  },
  };
}
