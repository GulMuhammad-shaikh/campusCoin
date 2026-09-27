import React, { useState, useEffect } from "react";
import { authAPI } from "../utils/api";
import { CURRENCIES, getCurrencyCode, setCurrencyCode, getCurrency } from "../utils/transactions";
import { fireConfetti } from "../utils/confetti";
import sound from "../utils/audio";
import { useTheme } from "../context/ThemeContext";

export default function Profile({ student }) {
  const userId = student?.user_id || student?._id || student?.id;
  const { theme, setTheme, isDark } = useTheme();

  // Editable profile fields
  const [name,         setName]         = useState(student?.name || "");
  const [academicYear, setAcademicYear] = useState(student?.academic_year || "");
  const [savingsGoal,  setSavingsGoal]  = useState(String(student?.monthly_savings_goal || ""));
  const [currency,     setCurrency]     = useState(getCurrencyCode());
  const [saving,       setSaving]       = useState(false);
  const [profileMsg,   setProfileMsg]   = useState("");

  useEffect(() => {
    setName(student?.name || "");
    setAcademicYear(student?.academic_year || "");
    setSavingsGoal(String(student?.monthly_savings_goal || ""));
    setCurrency(getCurrencyCode());
  }, [student]);

  function handleCurrencySelect(newCode) {
    sound.playPop();
    setCurrency(newCode);
    setCurrencyCode(newCode);
    window.dispatchEvent(new CustomEvent("campusCoinCurrencyChanged", { detail: newCode }));
  }

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

      // Save currency choice
      setCurrencyCode(currency);

      // Update localStorage so navbar, dashboard, and rest of app update immediately
      const stored = JSON.parse(localStorage.getItem("campusCoinCurrentStudent") || "{}");
      stored.name                 = name.trim();
      stored.academic_year        = academicYear.trim();
      stored.monthly_savings_goal = Number(savingsGoal) || 0;
      localStorage.setItem("campusCoinCurrentStudent", JSON.stringify(stored));

      window.dispatchEvent(new CustomEvent("campusCoinDataChanged"));
      window.dispatchEvent(new CustomEvent("campusCoinCurrencyChanged", { detail: currency }));

      sound.playChime();
      fireConfetti();
      setProfileMsg("Profile updated successfully!");
    } catch {
      setProfileMsg("Could not save profile. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setProfileMsg(""), 4000);
    }
  }

  const activeCur = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate", "Postgraduate", "Other"];

  return (
    <div style={S.page} className="animate-fade-in">
      <div style={S.headerWrap}>
        <span style={S.eyebrow}>
          <i className="fa-solid fa-id-badge" style={{ marginRight: 6 }}></i>
          ACCOUNT MANAGEMENT
        </span>
        <h1 style={S.title}>Student Profile & Settings</h1>
        <p style={S.subtitle}>
          Manage your personal details, academic standing, and currency display preferences.
        </p>
      </div>

      <div style={S.layout}>
        {/* Left Column: Account Card */}
        <aside style={S.sideCard} className="card-hover">
          <div style={S.avatar}>
            <i className="fa-solid fa-user-graduate"></i>
          </div>
          <h2 style={S.cardName}>{student?.name || "Student"}</h2>
          <p style={S.cardEmail}>
            <i className="fa-regular fa-envelope" style={{ marginRight: 6 }}></i>
            {student?.email || "No email"}
          </p>

          <div style={S.curBadge}>
            <i className="fa-solid fa-coins" style={{ marginRight: 6, color: "#07845e" }}></i>
            <span>Active: <strong>{activeCur.code} ({activeCur.symbol})</strong></span>
          </div>

          <div style={S.divider} />

          <div style={S.infoList}>
            <div style={S.infoRow}>
              <span style={S.infoLabel}>Academic Standing</span>
              <strong style={S.infoVal}>{academicYear || "Not specified"}</strong>
            </div>

            <div style={S.infoRow}>
              <span style={S.infoLabel}>Monthly Savings Goal</span>
              <strong style={S.infoVal}>
                {student?.monthly_savings_goal > 0
                  ? `${activeCur.symbol} ${Number(student?.monthly_savings_goal).toLocaleString()}`
                  : "Not configured"}
              </strong>
            </div>

            <div style={S.infoRow}>
              <span style={S.infoLabel}>Currency Locale</span>
              <strong style={S.infoVal}>{activeCur.name} ({activeCur.locale})</strong>
            </div>

            <div style={S.infoRow}>
              <span style={S.infoLabel}>Account Status</span>
              <span style={{ color: "#07845e", fontWeight: 700, fontSize: 13 }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: 5 }}></i>
                Active
              </span>
            </div>
          </div>
        </aside>

        {/* Right Column: Edit Profile Form with Dropdown Currency Selector */}
        <main style={S.mainFormCard} className="card-hover">
          <div style={S.formHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={S.formIcon}>
                <i className="fa-solid fa-sliders"></i>
              </span>
              <div>
                <h2 style={S.sectionTitle}>Profile & Preferences</h2>
                <p style={S.sectionSub}>Update your personal information and default currency.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={S.form}>
            {/* Full Name */}
            <div style={S.field}>
              <label style={S.label}>
                <i className="fa-regular fa-user" style={{ marginRight: 6, color: "#64748b" }}></i>
                Full Name
              </label>
              <input
                style={S.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Currency Dropdown Selector */}
            <div style={S.field}>
              <label style={S.label}>
                <i className="fa-solid fa-money-bill-transfer" style={{ marginRight: 6, color: "#07845e" }}></i>
                Select Display Currency
              </label>
              <div style={S.selectWrap}>
                <select
                  style={S.select}
                  value={currency}
                  onChange={(e) => handleCurrencySelect(e.target.value)}
                >
                  {CURRENCIES.map((cur) => (
                    <option key={cur.code} value={cur.code}>
                      {cur.code} - {cur.name} ({cur.symbol})
                    </option>
                  ))}
                </select>
                <span style={S.selectArrow}>
                  <i className="fa-solid fa-chevron-down"></i>
                </span>
              </div>
              <span style={S.fieldHint}>
                Current Symbol: <strong>{activeCur.symbol}</strong> ({activeCur.name}) - applied app-wide instantly
              </span>
            </div>

            {/* Academic Year */}
            <div style={S.field}>
              <label style={S.label}>
                <i className="fa-solid fa-graduation-cap" style={{ marginRight: 6, color: "#64748b" }}></i>
                Academic Year
              </label>
              <div style={S.selectWrap}>
                <select
                  style={S.select}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  <option value="">Select academic year...</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span style={S.selectArrow}>
                  <i className="fa-solid fa-chevron-down"></i>
                </span>
              </div>
            </div>

            {/* Monthly Savings Goal */}
            <div style={S.field}>
              <label style={S.label}>
                <i className="fa-solid fa-bullseye" style={{ marginRight: 6, color: "#64748b" }}></i>
                Monthly Savings Goal ({activeCur.symbol})
              </label>
              <input
                style={S.input}
                type="number"
                min="0"
                step="100"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                placeholder="e.g. 5000"
              />
            </div>

            {/* Email (Read only) */}
            <div style={{ ...S.field, gridColumn: "1 / -1" }}>
              <label style={S.label}>
                <i className="fa-regular fa-envelope" style={{ marginRight: 6, color: "#64748b" }}></i>
                Registered Email Address
              </label>
              <input
                style={{ ...S.input, background: isDark ? "rgba(255, 255, 255, 0.03)" : "#f1f5f9", color: isDark ? "#94a3b8" : "#64748b", cursor: "not-allowed", border: "1.5px solid var(--border-glass)" }}
                value={student?.email || ""}
                readOnly
              />
            </div>

            {/* Appearance Theme Selector */}
            <div style={{ ...S.field, gridColumn: "1 / -1", marginTop: 4 }}>
              <label style={S.label}>
                <i className="fa-solid fa-circle-half-stroke" style={{ marginRight: 6, color: "#10b981" }}></i>
                Theme Appearance
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: !isDark ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#ecfdf5") : (isDark ? "rgba(255, 255, 255, 0.04)" : "#f8fafc"),
                    border: !isDark ? "2px solid #10b981" : "1px solid var(--border-glass)",
                    color: !isDark ? (isDark ? "#ffffff" : "#047857") : (isDark ? "#94a3b8" : "#64748b"),
                    transition: "all 0.2s ease",
                  }}
                >
                  <i className="fa-solid fa-sun" style={{ fontSize: 20, color: "#f59e0b" }}></i>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: !isDark ? "#0f172a" : (isDark ? "#cbd5e1" : "#64748b") }}>
                      Light Mode
                    </div>
                    <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>Default on website open</div>
                  </div>
                  {!isDark && <i className="fa-solid fa-circle-check" style={{ marginLeft: "auto", color: "#10b981" }}></i>}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: isDark ? "rgba(99, 102, 241, 0.2)" : (isDark ? "rgba(255, 255, 255, 0.04)" : "#f8fafc"),
                    border: isDark ? "2px solid #6366f1" : "1px solid var(--border-glass)",
                    color: isDark ? "#ffffff" : "#64748b",
                    transition: "all 0.2s ease",
                  }}
                >
                  <i className="fa-solid fa-moon" style={{ fontSize: 20, color: "#38bdf8" }}></i>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: isDark ? "#ffffff" : "#0f172a" }}>
                      Dark Mode
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#a5b4fc" : "#64748b" }}>Fintech dark theme</div>
                  </div>
                  {isDark && <i className="fa-solid fa-circle-check" style={{ marginLeft: "auto", color: "#6366f1" }}></i>}
                </button>
              </div>
            </div>

            {/* Submit & Messages */}
            <div style={S.actionRow}>
              <button style={S.saveBtn} className="btn-glow" type="submit" disabled={saving}>
                <i className="fa-solid fa-floppy-disk" style={{ marginRight: 8 }}></i>
                {saving ? "Saving Changes…" : "Save Changes"}
              </button>

              {profileMsg && (
                <div style={{
                  ...S.msgBox,
                  background: profileMsg.includes("success") ? "#ecfdf5" : "#fef2f2",
                  color:      profileMsg.includes("success") ? "#047857" : "#b91c1c",
                  borderColor: profileMsg.includes("success") ? "#a7f3d0" : "#fecaca",
                }}>
                  <i className={`fa-solid ${profileMsg.includes("success") ? "fa-circle-check" : "fa-triangle-exclamation"}`} style={{ marginRight: 6 }}></i>
                  {profileMsg}
                </div>
              )}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

const S = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "36px 20px 70px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: "#f8fafc",
  },
  headerWrap: {
    marginBottom: 28,
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    color: "#10b981",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    margin: "0 0 6px",
    fontSize: "clamp(24px, 3.5vw, 32px)",
    color: "#ffffff",
    fontWeight: 800,
    letterSpacing: "-0.6px",
  },
  subtitle: {
    margin: 0,
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 1.5,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
    gap: 24,
    alignItems: "start",
  },
  sideCard: {
    background: "rgba(16, 24, 40, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(18px)",
    borderRadius: 16,
    padding: "26px 22px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    textAlign: "center",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontSize: 26,
    margin: "0 auto 14px",
    boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
  },
  cardName: {
    margin: "0 0 4px",
    fontSize: 20,
    fontWeight: 800,
    color: "#ffffff",
  },
  cardEmail: {
    margin: "0 0 14px",
    fontSize: 13,
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  curBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(16, 185, 129, 0.15)",
    color: "#34d399",
    border: "1px solid rgba(16, 185, 129, 0.35)",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 12,
  },
  divider: {
    height: 1,
    background: "rgba(255, 255, 255, 0.08)",
    margin: "20px 0 16px",
  },
  infoList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    textAlign: "left",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    fontSize: 13,
  },
  infoLabel: {
    color: "#94a3b8",
  },
  infoVal: {
    color: "#ffffff",
    fontWeight: 600,
  },
  mainFormCard: {
    background: "rgba(16, 24, 40, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(18px)",
    borderRadius: 16,
    padding: "26px 26px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  formHeader: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  formIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: "rgba(255, 255, 255, 0.06)",
    color: "#60a5fa",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "grid",
    placeItems: "center",
    fontSize: 15,
  },
  sectionTitle: {
    margin: "0 0 2px",
    fontSize: 18,
    fontWeight: 800,
    color: "#ffffff",
  },
  sectionSub: {
    margin: 0,
    fontSize: 13,
    color: "#94a3b8",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 18,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: "#cbd5e1",
    display: "flex",
    alignItems: "center",
  },
  input: {
    padding: "12px 14px",
    border: "1.5px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    fontSize: 14,
    color: "#ffffff",
    background: "rgba(255, 255, 255, 0.05)",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    width: "100%",
    transition: "border-color 0.15s ease",
  },
  selectWrap: {
    position: "relative",
    width: "100%",
  },
  select: {
    padding: "12px 36px 12px 14px",
    border: "1.5px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    fontSize: 14,
    color: "#ffffff",
    background: "#141d30",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    width: "100%",
    appearance: "none",
    cursor: "pointer",
  },
  selectArrow: {
    position: "absolute",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#94a3b8",
    fontSize: 12,
  },
  fieldHint: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  actionRow: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 8,
  },
  saveBtn: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    border: "none",
    padding: "12px 24px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 4px 16px rgba(16, 185, 129, 0.35)",
    fontFamily: "inherit",
  },
  msgBox: {
    padding: "10px 14px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 600,
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
  },
};