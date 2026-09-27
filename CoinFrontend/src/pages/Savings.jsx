import React, { useState, useEffect, useCallback } from "react";
import { authAPI, transactionAPI } from "../utils/api";
import { formatRupees } from "../utils/transactions";

export default function Savings({ student }) {
  const userId        = student?.user_id || student?._id || student?.id;
  const isValidId     = userId && /^[0-9a-fA-F]{24}$/.test(String(userId));

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
      // Update localStorage so dashboard reflects immediately
      const stored = JSON.parse(localStorage.getItem("campusCoinCurrentStudent") || "{}");
      stored.monthly_savings_goal = val;
      localStorage.setItem("campusCoinCurrentStudent", JSON.stringify(stored));
      setSaveMsg("✅ Goal saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveMsg("❌ Could not save goal. Try again.");
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
    <div style={S.page}>
      <span style={S.eyebrow}>PLAN AHEAD</span>
      <h1 style={S.title}>Savings Goals</h1>
      <p style={S.subtitle}>Set your monthly savings target and track your progress in real time.</p>

      {/* ── Top KPI row ── */}
      <div style={S.kpiGrid}>
        <KpiCard label="Total Balance"     value={formatRupees(totalBal)}       color="#07845e" icon="💰" />
        <KpiCard label="This Month Net"    value={formatRupees(monthlyNet)}      color={monthlyNet >= 0 ? "#07845e" : "#ef4444"} icon={monthlyNet >= 0 ? "↑" : "↓"} />
        <KpiCard label="Monthly Income"    value={formatRupees(monthlyInc)}      color="#6366f1" icon="↗" />
        <KpiCard label="Monthly Expenses"  value={formatRupees(monthlyExp)}      color="#ef4444" icon="↘" />
        <KpiCard label="Savings Rate"      value={`${savingsRate.toFixed(1)}%`}  color="#8b5cf6" icon="%" />
        {lastMonthDiff !== null && (
          <KpiCard
            label="vs Last Month"
            value={`${lastMonthDiff >= 0 ? "+" : ""}${lastMonthDiff.toFixed(1)}%`}
            color={lastMonthDiff >= 0 ? "#07845e" : "#ef4444"}
            icon={lastMonthDiff >= 0 ? "↑" : "↓"}
          />
        )}
      </div>

      {/* ── Set / Update Goal ── */}
      <section style={S.card}>
        <h2 style={S.cardTitle}>🎯 Monthly Savings Goal</h2>
        <p style={S.cardSub}>How much do you want to save this month? Synced with your account.</p>
        <form onSubmit={handleSaveGoal} style={S.goalForm}>
          <div style={S.goalInputWrap}>
            <span style={S.rsSign}>Rs.</span>
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
          <button style={S.saveBtn} type="submit" disabled={saving}>
            {saving ? "Saving…" : goalAmount > 0 ? "Update Goal" : "Set Goal"}
          </button>
        </form>
        {saveMsg && <p style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: saveMsg.startsWith("✅") ? "#07845e" : "#ef4444" }}>{saveMsg}</p>}
      </section>

      {/* ── Progress Card ── */}
      {goalAmount > 0 && (
        <section style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={S.cardTitle}>This Month's Progress</h2>
              <p style={S.cardSub}>{monthNames[thisMonth]} {thisYear}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: progress >= 100 ? "#07845e" : "#6366f1" }}>
                {progress.toFixed(0)}%
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>of goal</span>
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
            <span>Goal: <strong>{formatRupees(goalAmount)}</strong></span>
          </div>

          {progress >= 100 ? (
            <div style={S.successBanner}>🎉 You've reached your savings goal this month! Great work.</div>
          ) : remaining > 0 ? (
            <div style={S.infoBanner}>💡 Save <strong>{formatRupees(remaining)}</strong> more to reach your goal.</div>
          ) : (
            <div style={S.warnBanner}>⚠ Your expenses exceed your income this month. Try to reduce spending.</div>
          )}
        </section>
      )}

      {/* ── 6-Month History ── */}
      <section style={S.card}>
        <h2 style={S.cardTitle}>📅 6-Month Savings History</h2>
        <p style={S.cardSub}>Net savings (income − expenses) per month</p>
        <div style={S.historyGrid}>
          {monthHistory.map((m) => {
            const pct       = Math.abs(m.net) / maxHistory;
            const barH      = Math.max(4, pct * 120);
            const positive  = m.net >= 0;
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
                  <span style={{ fontSize: 10, color: positive && m.net >= goalAmount ? "#07845e" : "#94a3b8" }}>
                    {positive && m.net >= goalAmount ? "✅" : ""}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {goalAmount > 0 && (
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 16, textAlign: "center" }}>
            ✅ = Month where savings goal of {formatRupees(goalAmount)} was reached
          </p>
        )}
      </section>

      {/* ── Tips ── */}
      <section style={S.card}>
        <h2 style={S.cardTitle}>💡 Saving Tips</h2>
        <div style={S.tipsGrid}>
          {[
            { icon: "🎯", tip: "Automate your savings — decide on a fixed amount to \"pay yourself first\" each month." },
            { icon: "📊", tip: "Track your top 3 expense categories. Small reductions there create the biggest impact." },
            { icon: "☕", tip: "The '24-hour rule': wait a day before any non-essential purchase over Rs. 1,000." },
            { icon: "📅", tip: "Review your expenses every Sunday to catch surprises before they compound." },
          ].map(({ icon, tip }, i) => (
            <div key={i} style={S.tipCard}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <p style={{ margin: 0, fontSize: 13, color: "#526276", lineHeight: 1.7 }}>{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, color, icon }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e3e9ef", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 4px 16px rgba(16,35,55,0.04)" }}>
      <span style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 9, fontSize: 16, fontWeight: 900, color, background: `${color}16` }}>{icon}</span>
      <span style={{ color: "#718096", fontSize: 11, fontWeight: 600, letterSpacing: 0.3 }}>{label.toUpperCase()}</span>
      <strong style={{ color, fontSize: 18, letterSpacing: "-0.5px" }}>{value}</strong>
    </div>
  );
}

const S = {
  center:  { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: "Inter, Arial, sans-serif" },
  spinner: { width: 38, height: 38, border: "4px solid #e2e8f0", borderTop: "4px solid #07845e", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  page:    { maxWidth: 960, margin: "0 auto", padding: "42px 22px 70px", fontFamily: "Inter, Arial, sans-serif" },
  eyebrow: { display: "block", color: "#07845e", fontSize: 11, fontWeight: 900, letterSpacing: 1.4, marginBottom: 6 },
  title:   { color: "#142238", fontSize: "clamp(26px,4vw,34px)", margin: "0 0 6px", letterSpacing: "-1px" },
  subtitle:{ color: "#718096", fontSize: 14, lineHeight: 1.6, marginBottom: 28 },

  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 14, marginBottom: 24 },

  card:    { background: "#fff", border: "1px solid #e3e9ef", borderRadius: 17, padding: "24px", marginBottom: 20, boxShadow: "0 8px 30px rgba(16,35,55,0.04)" },
  cardTitle:{ color: "#17283e", fontSize: 18, fontWeight: 800, margin: "0 0 4px" },
  cardSub: { color: "#94a3b8", fontSize: 13, margin: "0 0 20px" },

  goalForm:     { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  goalInputWrap:{ display: "flex", alignItems: "center", border: "1.5px solid #dce4eb", borderRadius: 10, overflow: "hidden", background: "#fbfcfd", flexGrow: 1, maxWidth: 280 },
  rsSign:       { padding: "12px 14px", background: "#f1f5f9", color: "#6b7280", fontSize: 14, fontWeight: 700, borderRight: "1px solid #dce4eb" },
  goalInput:    { border: "none", background: "transparent", padding: "12px 14px", fontSize: 16, fontWeight: 700, outline: "none", width: "100%" },
  saveBtn:      { border: "none", borderRadius: 10, padding: "13px 22px", background: "linear-gradient(135deg,#07845e,#059669)", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: 14 },

  progressTrack:{ height: 14, background: "#f1f5f9", borderRadius: 20, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", borderRadius: 20, transition: "width 0.7s ease" },
  progressMeta: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" },
  successBanner:{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", borderRadius: 10, padding: "12px 16px", marginTop: 16, fontSize: 13 },
  infoBanner:   { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", borderRadius: 10, padding: "12px 16px", marginTop: 16, fontSize: 13 },
  warnBanner:   { background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: 10, padding: "12px 16px", marginTop: 16, fontSize: 13 },

  historyGrid:  { display: "flex", gap: 10, alignItems: "flex-end", height: 160, paddingTop: 20 },
  histCol:      { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" },

  tipsGrid:     { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 },
  tipCard:      { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", gap: 10 },
};