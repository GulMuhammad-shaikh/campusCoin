import React, { useState, useEffect } from "react";
import { authAPI } from "../utils/api";
import { CURRENCIES, getCurrencyCode, setCurrencyCode } from "../utils/transactions";

export default function Profile({ student }) {
  const userId = student?.user_id || student?._id || student?.id;

  // Editable profile fields
  const [name,         setName]         = useState(student?.name || "");
  const [academicYear, setAcademicYear] = useState(student?.academic_year || "");
  const [savingsGoal,  setSavingsGoal]  = useState(String(student?.monthly_savings_goal || ""));
  const [saving,       setSaving]       = useState(false);
  const [profileMsg,   setProfileMsg]   = useState("");

  // Currency
  const [currency,     setCurrency]     = useState(getCurrencyCode());

  useEffect(() => {
    setName(student?.name || "");
    setAcademicYear(student?.academic_year || "");
    setSavingsGoal(String(student?.monthly_savings_goal || ""));
  }, [student]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setProfileMsg("");
    try {
      await authAPI.updateProfile(userId, {
        name: name.trim(),
        academic_year: academicYear.trim(),
        monthly_savings_goal: Number(savingsGoal) || 0,
      });
      // Update localStorage so rest of app reflects immediately
      const stored = JSON.parse(localStorage.getItem("campusCoinCurrentStudent") || "{}");
      stored.name                 = name.trim();
      stored.academic_year        = academicYear.trim();
      stored.monthly_savings_goal = Number(savingsGoal) || 0;
      localStorage.setItem("campusCoinCurrentStudent", JSON.stringify(stored));
      window.dispatchEvent(new CustomEvent("campusCoinDataChanged"));
      setProfileMsg("✅ Profile updated successfully.");
    } catch {
      setProfileMsg("❌ Could not save. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setProfileMsg(""), 4000);
    }
  }

  function handleCurrencyChange(code) {
    setCurrency(code);
    setCurrencyCode(code);
    // Force re-render across app
    window.dispatchEvent(new CustomEvent("campusCoinDataChanged"));
  }

  const selectedCur = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate", "Postgraduate", "Other"];

  return (
    <div style={S.page}>
      <span style={S.eyebrow}>YOUR ACCOUNT</span>
      <h1 style={S.title}>Student Profile</h1>
      <p style={S.subtitle}>Manage your account details, preferences, and currency settings.</p>

      <div style={S.grid}>
        {/* ── Left column: Avatar + read-only info ── */}
        <div style={S.leftCol}>
          <div style={S.card}>
            <div style={S.avatar}>
              {(student?.name || "S").charAt(0).toUpperCase()}
            </div>
            <h2 style={S.cardName}>{student?.name || "Student"}</h2>
            <p style={S.cardEmail}>{student?.email || "No email"}</p>
            <div style={S.badge}>{academicYear || "Academic Year not set"}</div>

            <div style={S.divider} />

            <Row label="Monthly Savings Goal" value={
              student?.monthly_savings_goal > 0
                ? `${selectedCur.symbol} ${Number(student?.monthly_savings_goal || 0).toLocaleString()}`
                : "Not set"
            } />
            <Row label="Currency" value={`${selectedCur.symbol}  ${selectedCur.code} — ${selectedCur.name}`} />
            <Row label="Member since" value={
              student?.created_at
                ? new Date(student.created_at).toLocaleDateString("en-PK", { year: "numeric", month: "long" })
                : "—"
            } />
          </div>
        </div>

        {/* ── Right column: edit forms ── */}
        <div style={S.rightCol}>

          {/* Edit Profile */}
          <section style={S.card}>
            <h2 style={S.sectionTitle}>✏️ Edit Profile</h2>
            <p style={S.sectionSub}>Changes are saved to your account on the server.</p>

            <form onSubmit={handleSaveProfile} style={S.form}>
              <Field label="Full Name" required>
                <input
                  style={S.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </Field>

              <Field label="Academic Year">
                <select style={S.input} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                  <option value="">Select year…</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>

              <Field label={`Monthly Savings Goal (${selectedCur.symbol})`}>
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  step="100"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(e.target.value)}
                  placeholder="e.g. 5000"
                />
              </Field>

              <Field label="Email Address">
                <input style={{ ...S.input, background: "#f8fafc", color: "#94a3b8" }} value={student?.email || ""} readOnly />
              </Field>

              <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <button style={S.saveBtn} type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                {profileMsg && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: profileMsg.startsWith("✅") ? "#07845e" : "#ef4444" }}>
                    {profileMsg}
                  </span>
                )}
              </div>
            </form>
          </section>

          {/* Currency Selector */}
          <section style={S.card}>
            <h2 style={S.sectionTitle}>💱 Currency Preference</h2>
            <p style={S.sectionSub}>
              Choose how amounts are displayed across the entire app. Default is Pakistani Rupee (Rs.).
            </p>

            {/* Current selection highlight */}
            <div style={S.currentCurrency}>
              <span style={S.bigSymbol}>{selectedCur.symbol}</span>
              <div>
                <strong style={{ fontSize: 15, color: "#17283e" }}>{selectedCur.name}</strong>
                <span style={{ display: "block", fontSize: 12, color: "#94a3b8" }}>{selectedCur.code} · Currently selected</span>
              </div>
            </div>

            {/* Grid of currencies */}
            <div style={S.currencyGrid}>
              {CURRENCIES.map((cur) => {
                const active = cur.code === currency;
                return (
                  <button
                    key={cur.code}
                    onClick={() => handleCurrencyChange(cur.code)}
                    style={{
                      ...S.curBtn,
                      ...(active ? S.curBtnActive : {}),
                    }}
                    title={cur.name}
                  >
                    <span style={S.curSymbol}>{cur.symbol}</span>
                    <span style={S.curCode}>{cur.code}</span>
                    <span style={S.curName}>{cur.name}</span>
                    {active && <span style={S.checkMark}>✓</span>}
                  </button>
                );
              })}
            </div>

            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 16 }}>
              Currency preference is saved locally in your browser. Amounts on Dashboard, Analytics, Savings, and AI Tips pages will all update instantly.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={S.fieldLabel}>
      <span style={S.labelText}>{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div style={S.detailRow}>
      <span style={S.detailLabel}>{label}</span>
      <span style={S.detailValue}>{value}</span>
    </div>
  );
}

const S = {
  page:    { maxWidth: 1050, margin: "0 auto", padding: "42px 22px 70px", fontFamily: "Inter, Arial, sans-serif" },
  eyebrow: { display: "block", color: "#07845e", fontSize: 11, fontWeight: 900, letterSpacing: 1.4, marginBottom: 6 },
  title:   { color: "#142238", fontSize: "clamp(26px,4vw,32px)", margin: "0 0 6px", letterSpacing: "-1px" },
  subtitle:{ color: "#718096", fontSize: 14, lineHeight: 1.6, marginBottom: 28 },

  grid:    { display: "grid", gridTemplateColumns: "280px 1fr", gap: 22, alignItems: "start" },

  leftCol:  { display: "flex", flexDirection: "column", gap: 18 },
  rightCol: { display: "flex", flexDirection: "column", gap: 18 },

  card: {
    background: "#fff", border: "1px solid #e3e9ef", borderRadius: 18,
    padding: "24px 24px", boxShadow: "0 8px 30px rgba(16,35,55,0.05)",
  },

  avatar: {
    width: 64, height: 64, display: "grid", placeItems: "center",
    borderRadius: 20, background: "linear-gradient(135deg,#07845e,#059669)",
    color: "#fff", fontSize: 28, fontWeight: 900, marginBottom: 14,
  },
  cardName:  { margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#17283e" },
  cardEmail: { margin: "0 0 12px", fontSize: 13, color: "#94a3b8" },
  badge:     { display: "inline-block", background: "#e2f7ef", color: "#07845e", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  divider:   { height: 1, background: "#f1f5f9", margin: "18px 0" },
  detailRow: { display: "flex", flexDirection: "column", gap: 3, padding: "10px 0", borderBottom: "1px solid #f8fafc" },
  detailLabel:{ color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: 0.3 },
  detailValue:{ color: "#17283e", fontSize: 13, fontWeight: 600 },

  sectionTitle: { margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#17283e" },
  sectionSub:   { margin: "0 0 20px", fontSize: 13, color: "#94a3b8" },

  form:      { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 },
  fieldLabel:{ display: "flex", flexDirection: "column", gap: 7 },
  labelText: { fontSize: 12, fontWeight: 700, color: "#526276" },
  input:     { padding: "11px 13px", border: "1.5px solid #dce4eb", borderRadius: 10, fontSize: 14, background: "#fbfcfd", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  saveBtn:   { border: "none", borderRadius: 10, padding: "12px 24px", background: "linear-gradient(135deg,#07845e,#059669)", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", fontSize: 14 },

  currentCurrency: {
    display: "flex", alignItems: "center", gap: 16,
    background: "linear-gradient(135deg,#e2f7ef,#eff6ff)", border: "1.5px solid #a7f3d0",
    borderRadius: 14, padding: "16px 20px", marginBottom: 20,
  },
  bigSymbol: { fontSize: 32, fontWeight: 900, color: "#07845e", minWidth: 40, textAlign: "center" },

  currencyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))",
    gap: 10,
  },
  curBtn: {
    position: "relative", display: "flex", flexDirection: "column", alignItems: "center",
    gap: 3, padding: "12px 8px", border: "1.5px solid #e2e8f0",
    borderRadius: 12, background: "#fff", cursor: "pointer", fontFamily: "inherit",
    transition: "all 0.15s ease",
  },
  curBtnActive: {
    border: "1.5px solid #07845e", background: "#e2f7ef",
    boxShadow: "0 4px 16px rgba(7,132,94,0.15)",
  },
  curSymbol: { fontSize: 18, fontWeight: 900, color: "#17283e" },
  curCode:   { fontSize: 11, fontWeight: 800, color: "#526276" },
  curName:   { fontSize: 9,  color: "#94a3b8", textAlign: "center", lineHeight: 1.3 },
  checkMark: { position: "absolute", top: 6, right: 8, fontSize: 10, color: "#07845e", fontWeight: 900 },

  "@media(max-width:680px)": { grid: { gridTemplateColumns: "1fr" } },
};