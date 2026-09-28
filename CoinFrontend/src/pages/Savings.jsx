import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { authAPI, transactionAPI } from "../utils/api";
import { formatRupees, getCurrency } from "../utils/transactions";
import { fireConfetti, fireCelebration } from "../utils/confetti";
import sound from "../utils/audio";

export default function Savings({ student }) {
  const { isDark } = useTheme();
  const S = getStyles(isDark);
  const userId        = student?.user_id || student?._id || student?.id;
  const isValidId     = userId && /^[0-9a-fA-F]{24}$/.test(String(userId));
  const activeCur     = getCurrency();

  const [goalInput,   setGoalInput]   = useState("");
  const [goalAmount,  setGoalAmount]  = useState(Number(student?.monthly_savings_goal || 0));
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState("");

  const [monthlyInc,  setMonthlyInc]  = useState(0);
  const [monthlyExp,  setMonthlyExp]  = useState(0);
  const [totalBal,    setTotalBal]    = useState(0);
  const [lastMonthNet,setLastMonthNet]= useState(0);
  const [monthHistory,setMonthHistory]= useState([]);
  const [loading,     setLoading]     = useState(true);

  const now        = new Date();
  const thisMonth  = now.getMonth();
  const thisYear   = now.getFullYear();
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const txnRes = await transactionAPI.getAll(isValidId ? { user_id: userId } : {});
      const txns   = txnRes?.transactions || [];

      // All-time balance
      let inc = 0, exp = 0;
      txns.forEach((t) => {
        if (t.type === "income")  inc += Number(t.amount || 0);
        if (t.type === "expense") exp += Number(t.amount || 0);
      });
      setTotalBal(inc - exp);

      // This month
      let mInc = 0, mExp = 0;
      let lInc = 0, lExp = 0;
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastYear  = thisMonth === 0 ? thisYear - 1 : thisYear;

      txns.forEach((t) => {
        const d = new Date(t.date || t.created_at);
        const m = d.getMonth(), y = d.getFullYear();
        const amt = Number(t.amount || 0);
        if (y === thisYear && m === thisMonth) {
          if (t.type === "income")  mInc += amt;
          if (t.type === "expense") mExp += amt;
        }
        if (y === lastYear && m === lastMonth) {
          if (t.type === "income")  lInc += amt;
          if (t.type === "expense") lExp += amt;
        }
      });
      setMonthlyInc(mInc);
      setMonthlyExp(mExp);
      setLastMonthNet(lInc - lExp);

      // Last 6 months history
      const history = [];
      for (let i = 5; i >= 0; i--) {
        const d  = new Date(thisYear, thisMonth - i, 1);
        const mi = d.getMonth();
        const yi = d.getFullYear();
        let hInc = 0, hExp = 0;
        txns.forEach((t) => {
          const td = new Date(t.date || t.created_at);
          if (td.getFullYear() === yi && td.getMonth() === mi) {
            if (t.type === "income")  hInc += Number(t.amount || 0);
            if (t.type === "expense") hExp += Number(t.amount || 0);
          }
        });
        history.push({ label: monthNames[mi], net: hInc - hExp, inc: hInc, exp: hExp });
      }
      setMonthHistory(history);
    } catch (err) {
      console.error("Savings load error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setGoalAmount(Number(student?.monthly_savings_goal || 0));
    setGoalInput(String(student?.monthly_savings_goal || ""));
    loadData();
    const h = () => loadData();
    window.addEventListener("campusCoinDataChanged", h);
    return () => window.removeEventListener("campusCoinDataChanged", h);
  }, [loadData, student]);

  async function handleSaveGoal(e) {
    e.preventDefault();
    const val = Number(goalInput);
    if (!val || val < 0) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await authAPI.updateProfile(userId, { monthly_savings_goal: val });
      setGoalAmount(val);
      const stored = JSON.parse(localStorage.getItem("campusCoinCurrentStudent") || "{}");
      stored.monthly_savings_goal = val;
      localStorage.setItem("campusCoinCurrentStudent", JSON.stringify(stored));
      sound.playChime();
      fireConfetti();
      setSaveMsg("Goal saved successfully!");
      setTimeout(() => setSaveMsg(""), 3500);
    } catch (err) {
      setSaveMsg("Could not save goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const monthlyNet     = monthlyInc - monthlyExp;
  const progress       = goalAmount > 0 ? Math.min(100, (monthlyNet / goalAmount) * 100) : 0;
  const remaining      = Math.max(0, goalAmount - monthlyNet);
  const lastMonthDiff  = lastMonthNet !== 0 ? ((monthlyNet - lastMonthNet) / Math.abs(lastMonthNet)) * 100 : null;
  const savingsRate    = monthlyInc > 0 ? ((monthlyNet / monthlyInc) * 100) : 0;

  const maxHistory = Math.max(1, ...monthHistory.map((m) => Math.abs(m.net)));

  if (loading) return (
    <div style={S.center}>
      <div style={S.spinner} />
      <p style={{ color: "#64748b", marginTop: 14, fontSize: 14 }}>Loading savings data…</p>
    </div>
  );

  return (
    <div style={S.page} className="animate-fade-in cc-page">
      <div style={S.headerWrap}>
        <span style={S.eyebrow}>
          <i className="fa-solid fa-piggy-bank" style={{ marginRight: 6 }}></i>
          FINANCIAL DISCIPLINE
        </span>
        <h1 style={S.title}>Savings Goals & Progress</h1>
        <p style={S.subtitle}>Set your monthly savings target and monitor your capital accumulation in real time.</p>
      </div>

      {/* KPI row */}
      <div style={S.kpiGrid} className="cc-kpi-grid">
        <KpiCard isDark={isDark} label="Total Balance"    value={formatRupees(totalBal)}      color="#07845e" iconClass="fa-solid fa-wallet" />
        <KpiCard isDark={isDark} label="This Month Net"   value={formatRupees(monthlyNet)}     color={monthlyNet >= 0 ? "#07845e" : "#ef4444"} iconClass={monthlyNet >= 0 ? "fa-solid fa-arrow-trend-up" : "fa-solid fa-arrow-trend-down"} />
        <KpiCard isDark={isDark} label="Monthly Income"   value={formatRupees(monthlyInc)}     color="#6366f1" iconClass="fa-solid fa-arrow-up" />
        <KpiCard isDark={isDark} label="Monthly Expenses" value={formatRupees(monthlyExp)}     color="#ef4444" iconClass="fa-solid fa-arrow-down" />
        <KpiCard isDark={isDark} label="Savings Rate"     value={`${savingsRate.toFixed(1)}%`} color="#8b5cf6" iconClass="fa-solid fa-percent" />
        {lastMonthDiff !== null && (
          <KpiCard isDark={isDark} label="vs Last Month"
            value={`${lastMonthDiff >= 0 ? "+" : ""}${lastMonthDiff.toFixed(1)}%`}
            color={lastMonthDiff >= 0 ? "#07845e" : "#ef4444"}
            iconClass={lastMonthDiff >= 0 ? "fa-solid fa-arrow-trend-up" : "fa-solid fa-arrow-trend-down"}
          />
        )}
      </div>

      {/* Set / Update Goal */}
      <section style={S.card} className="card-hover">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <i className="fa-solid fa-bullseye" style={{ color: "#6366f1", fontSize: 18 }}></i>
          <h2 style={S.cardTitle}>Monthly Savings Goal</h2>
        </div>
        <p style={S.cardSub}>Define your monthly savings target. Automatically synchronizes with your profile.</p>

        <form onSubmit={handleSaveGoal} style={S.goalForm}>
          <div style={S.goalInputWrap}>
            <span style={S.rsSign}>{activeCur.symbol}</span>
            <input
              style={S.goalInput}
              type="number"
              min="0"
              step="100"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. 5000"
              required
            />
          </div>
          <button style={S.saveBtn} className="btn-glow" type="submit" disabled={saving}>
            <i className="fa-solid fa-check" style={{ marginRight: 6 }}></i>
            {saving ? "Saving…" : goalAmount > 0 ? "Update Target" : "Set Target"}
          </button>
        </form>

        {saveMsg && (
          <div style={{
            marginTop: 14,
            fontSize: 13,
            fontWeight: 600,
            color: saveMsg.includes("success") ? "#07845e" : "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            <i className={`fa-solid ${saveMsg.includes("success") ? "fa-circle-check" : "fa-circle-xmark"}`}></i>
            {saveMsg}
          </div>
        )}
      </section>

      {/* Progress Card */}
      {goalAmount > 0 && (
        <section style={S.card} className="card-hover">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fa-solid fa-chart-line" style={{ color: "#07845e" }}></i>
                <h2 style={S.cardTitle}>Current Month Progress</h2>
              </div>
              <p style={S.cardSub}>{monthNames[thisMonth]} {thisYear}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: progress >= 100 ? "#07845e" : "#6366f1" }}>
                {progress.toFixed(0)}%
              </div>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>of target reached</span>
            </div>
          </div>

          <div style={S.progressTrack}>
            <div style={{
              ...S.progressFill,
              width: `${Math.min(100, progress)}%`,
              background: progress >= 100 ? "#07845e" : progress >= 60 ? "#6366f1" : "#f59e0b",
            }} />
          </div>

          <div style={S.progressMeta}>
            <span>Saved: <strong style={{ color: "#07845e" }}>{formatRupees(Math.max(0, monthlyNet))}</strong></span>
            <span>Target: <strong>{formatRupees(goalAmount)}</strong></span>
          </div>

          {progress >= 100 ? (
            <div style={S.successBanner}>
              <i className="fa-solid fa-circle-check" style={{ marginRight: 8 }}></i>
              Congratulations! You have reached your monthly savings target.
            </div>
          ) : remaining > 0 ? (
            <div style={S.infoBanner}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: 8 }}></i>
              Save <strong>{formatRupees(remaining)}</strong> more this month to achieve your target.
            </div>
          ) : (
            <div style={S.warnBanner}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }}></i>
              Your expenses currently exceed your income this month.
            </div>
          )}
        </section>
      )}

      {/* 6-Month History */}
      <section style={S.card} className="card-hover">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <i className="fa-solid fa-calendar-days" style={{ color: "#64748b" }}></i>
          <h2 style={S.cardTitle}>6-Month Savings History</h2>
        </div>
        <p style={S.cardSub}>Net monthly accumulation (income minus expenses)</p>
        <div style={S.historyGrid}>
          {monthHistory.map((m) => {
            const pct      = Math.abs(m.net) / maxHistory;
            const barH     = Math.max(6, pct * 120);
            const positive = m.net >= 0;
            return (
              <div key={m.label} style={S.histCol}>
                <span style={{ fontSize: 11, fontWeight: 700, color: positive ? "#07845e" : "#ef4444" }}>
                  {formatRupees(Math.abs(m.net))}
                </span>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
                  <div style={{
                    width: "100%",
                    height: barH,
                    background: positive ? "#07845e" : "#ef4444",
                    borderRadius: "6px 6px 0 0",
                    opacity: 0.85,
                    transition: "height 0.4s ease",
                  }} />
                </div>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{m.label}</span>
                {goalAmount > 0 && (
                  <span style={{ fontSize: 11, color: positive && m.net >= goalAmount ? "#07845e" : "transparent" }}>
                    <i className="fa-solid fa-check"></i>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {goalAmount > 0 && (
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 16, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <i className="fa-solid fa-check" style={{ color: "#07845e" }}></i>
            <span>Indicates months where savings goal of {formatRupees(goalAmount)} was achieved</span>
          </p>
        )}
      </section>

      {/* Financial Habits */}
      <section style={S.card} className="card-hover">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <i className="fa-solid fa-lightbulb" style={{ color: "#f59e0b" }}></i>
          <h2 style={S.cardTitle}>Core Financial Principles</h2>
        </div>
        <div style={S.tipsGrid}>
          {[
            { iconClass: "fa-solid fa-wallet", tip: "Pay yourself first: allocate your savings target immediately upon receiving allowance or salary." },
            { iconClass: "fa-solid fa-magnifying-glass-dollar", tip: "Track the largest 3 expense categories. Trimming recurring costs creates the largest delta." },
            { iconClass: "fa-solid fa-clock", tip: "The 24-hour rule: wait a full day before finalizing any unplanned non-essential purchase." },
            { iconClass: "fa-solid fa-calendar-check", tip: "Conduct a 5-minute weekend review to ensure all receipts are accounted for." },
          ].map(({ iconClass, tip }, i) => (
            <div key={i} style={S.tipCard}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255, 255, 255, 0.06)", display: "grid", placeItems: "center", color: "#60a5fa", fontSize: 14, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <i className={iconClass}></i>
              </span>
              <p style={{ margin: 0, fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, color, iconClass, isDark }) {
  return (
    <div style={{
      background: isDark ? "rgba(16, 24, 40, 0.75)" : "#ffffff",
      border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
      backdropFilter: "blur(16px)",
      borderRadius: 14,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      boxShadow: "0 8px 30px rgba(0,0,0,0.25)"
    }} className="card-hover">
      <span style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 10, fontSize: 14, color, background: `${color}20`, border: `1px solid ${color}35` }}>
        <i className={iconClass}></i>
      </span>
      <span style={{ color: isDark ? "#94a3b8" : "#475569", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
      <strong style={{ color, fontSize: 18, letterSpacing: "-0.4px" }}>{value}</strong>
    </div>
  );
}

function getStyles(isDark) {
  return {
  center:  { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  spinner: { width: 38, height: 38, border: "4px solid rgba(255,255,255,0.1)", borderTop: "4px solid #10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  page:    { maxWidth: 1000, margin: "0 auto", padding: "36px 20px 70px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f8fafc" },
  headerWrap: { marginBottom: 24 },
  eyebrow: { display: "inline-flex", alignItems: "center", color: "#10b981", fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 6 },
  title:   { color: isDark ? "#ffffff" : "#0f172a", fontSize: "clamp(24px, 3.5vw, 32px)", margin: "0 0 6px", letterSpacing: "-0.8px", fontWeight: 800 },
  subtitle:{ color: isDark ? "#94a3b8" : "#475569", fontSize: 14, lineHeight: 1.5 },

  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14, marginBottom: 20 },

  card:    { background: isDark ? "rgba(16, 24, 40, 0.75)" : "#ffffff", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(18px)", borderRadius: 16, padding: "24px", marginBottom: 20, boxShadow: "0 10px 32px rgba(0,0,0,0.3)" },
  cardTitle:{ color: isDark ? "#ffffff" : "#0f172a", fontSize: 17, fontWeight: 800, margin: 0 },
  cardSub: { color: isDark ? "#94a3b8" : "#475569", fontSize: 13, margin: "4px 0 18px" },

  goalForm:     { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  goalInputWrap:{ display: "flex", alignItems: "center", border: "1.5px solid rgba(255, 255, 255, 0.12)", borderRadius: 12, overflow: "hidden", background: "rgba(255, 255, 255, 0.05)", flexGrow: 1, maxWidth: 300 },
  rsSign:       { padding: "12px 16px", background: "rgba(255, 255, 255, 0.08)", color: "#10b981", fontSize: 14, fontWeight: 800, borderRight: "1px solid rgba(255, 255, 255, 0.1)" },
  goalInput:    { border: "none", background: "transparent", padding: "12px 14px", fontSize: 15, fontWeight: 700, outline: "none", width: "100%", boxSizing: "border-box", color: isDark ? "#ffffff" : "#0f172a" },
  saveBtn:      { border: "none", borderRadius: 12, padding: "12px 22px", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: 13, display: "inline-flex", alignItems: "center", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" },

  progressTrack:{ height: 14, background: "rgba(255, 255, 255, 0.07)", borderRadius: 20, overflow: "hidden", marginBottom: 12, border: "1px solid rgba(255, 255, 255, 0.05)" },
  progressFill: { height: "100%", borderRadius: 20, transition: "width 0.7s ease" },
  progressMeta: { display: "flex", justifyContent: "space-between", fontSize: 13, color: isDark ? "#94a3b8" : "#475569" },
  successBanner:{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.35)", color: "#34d399", borderRadius: 12, padding: "12px 16px", marginTop: 16, fontSize: 13, display: "flex", alignItems: "center" },
  infoBanner:   { background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.35)", color: "#60a5fa", borderRadius: 12, padding: "12px 16px", marginTop: 16, fontSize: 13, display: "flex", alignItems: "center" },
  warnBanner:   { background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.35)", color: "#fbbf24", borderRadius: 12, padding: "12px 16px", marginTop: 16, fontSize: 13, display: "flex", alignItems: "center" },

  historyGrid:  { display: "flex", gap: 10, alignItems: "flex-end", height: 160, paddingTop: 16 },
  histCol:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" },

  tipsGrid:     { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 },
  tipCard:      { background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", gap: 10 },
  };
}
