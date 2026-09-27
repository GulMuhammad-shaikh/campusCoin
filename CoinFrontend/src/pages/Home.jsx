import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={styles.page}>
      {/* ─── Hero Section ─── */}
      <section style={styles.hero}>
        <div style={styles.copy} className="animate-slide-up">
          <div style={styles.badgeWrapper}>
            <span style={styles.pill}>
              <i className="fa-solid fa-graduation-cap" style={{ marginRight: 6 }}></i>
              THE STUDENT WEALTH COMPANION
            </span>
          </div>

          <h1 style={styles.title}>
            Master your student money.
            <span className="gradient-text"> Build lasting habits.</span>
          </h1>

          <p style={styles.description}>
            Effortlessly log income, categorize daily campus spending, and watch your savings goals grow — all in one modern, interactive dashboard.
          </p>

          <div style={styles.buttons}>
            <Link to="/register" style={styles.primaryButton} className="btn-glow">
              Get Started Free
              <i className="fa-solid fa-arrow-right" style={{ fontSize: 13, marginLeft: 4 }}></i>
            </Link>
            <Link to="/login" style={styles.secondaryButton} className="btn-glow">
              <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginRight: 6 }}></i>
              Sign In
            </Link>
          </div>

          <div style={styles.socialProof}>
            <div style={styles.proofAvatars}>
              <span style={{ ...styles.proofDot, background: "#10b981" }}>A</span>
              <span style={{ ...styles.proofDot, background: "#3b82f6" }}>K</span>
              <span style={{ ...styles.proofDot, background: "#8b5cf6" }}>S</span>
            </div>
            <span style={styles.smallNote}>
              Over 2,500+ student transactions logged with zero hidden fees.
            </span>
          </div>
        </div>

        {/* Floating Preview Card */}
        <div style={styles.preview} className="animate-float card-hover glass-panel">
          <div style={styles.previewTop}>
            <div>
              <span style={styles.previewLabel}>LIVE CAMPUS BALANCE</span>
              <div style={styles.previewBalance}>Rs. 24,500</div>
            </div>
            <span style={styles.demoBadge}>
              <i className="fa-solid fa-chart-line" style={{ marginRight: 5, color: "#10b981" }}></i>
              Live Preview
            </span>
          </div>

          <div style={styles.previewStats}>
            <div style={styles.previewStat}>
              <span style={styles.iconGreen}>
                <i className="fa-solid fa-arrow-trend-up"></i>
              </span>
              <span style={styles.statLabel}>Monthly In</span>
              <strong>Rs. 35,000</strong>
            </div>
            <div style={styles.previewStat}>
              <span style={styles.iconRed}>
                <i className="fa-solid fa-arrow-trend-down"></i>
              </span>
              <span style={styles.statLabel}>Expenses Out</span>
              <strong>Rs. 10,500</strong>
            </div>
          </div>

          <div style={styles.budgetHeader}>
            <div>
              <strong style={{ fontSize: 13, color: "#0f172a" }}>Semester Savings Goal</strong>
              <span style={styles.budgetSub}>Campus semester cushion fund</span>
            </div>
            <strong style={{ fontSize: 13, color: "#10b981" }}>70% achieved</strong>
          </div>

          <div style={styles.track}>
            <div style={styles.fill} />
          </div>

          <div style={styles.previewFoot}>
            <span>
              <i className="fa-solid fa-check-double" style={{ color: "#10b981", marginRight: 4 }}></i>
              Food & Campus Essentials
            </span>
            <span>Syncs in real-time</span>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section style={styles.features}>
        <div style={styles.sectionHeading} className="animate-slide-up">
          <span style={styles.pill}>
            <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 6 }}></i>
            POWERFUL FEATURES
          </span>
          <h2 style={styles.headingTitle}>Designed for Campus Life</h2>
          <p style={styles.headingSub}>Everything you need to keep everyday finances clean and organized.</p>
        </div>

        <div style={styles.featureGrid}>
          {features.map((feature) => (
            <div key={feature.title} style={styles.featureCard} className="card-hover">
              <div style={styles.featureIcon}>{feature.icon}</div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureText}>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    icon: <i className="fa-solid fa-arrow-trend-up" style={{ color: "#10b981", fontSize: 20 }}></i>,
    title: "Income & Allowances",
    text: "Log allowances, stipends, freelance gigs, and gifts with customizable categories and live records.",
  },
  {
    icon: <i className="fa-solid fa-arrow-trend-down" style={{ color: "#ef4444", fontSize: 20 }}></i>,
    title: "Categorized Spending",
    text: "Categorize campus cafeteria meals, transit, textbooks, and hostel dues with zero friction.",
  },
  {
    icon: <i className="fa-solid fa-circle-notch" style={{ color: "#6366f1", fontSize: 20 }}></i>,
    title: "Dual Donut Analytics",
    text: "Visualize your entire cashflow breakdown in clean side-by-side donut charts with percentage share.",
  },
  {
    icon: <i className="fa-solid fa-robot" style={{ color: "#a855f7", fontSize: 20 }}></i>,
    title: "AI Budget Coaching",
    text: "Get AI-generated personalized budgeting tips and spending audits directly from your transaction history.",
  },
  {
    icon: <i className="fa-solid fa-bullseye" style={{ color: "#06b6d4", fontSize: 20 }}></i>,
    title: "Target Savings Goals",
    text: "Set progressive targets for laptops, semester exams, or emergency funds with real-time visual progress.",
  },
  {
    icon: <i className="fa-solid fa-coins" style={{ color: "#f59e0b", fontSize: 20 }}></i>,
    title: "Multi-Currency Support",
    text: "Choose from 20 world currencies including Pakistani Rupee, US Dollar, Euro, Dirham, and Pound.",
  },
];

const styles = {
  page: {
    color: "#0f172a",
    fontFamily: "var(--font-sans)",
  },
  hero: {
    maxWidth: 1220,
    margin: "0 auto",
    padding: "clamp(45px, 7vw, 95px) 24px 60px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))",
    alignItems: "center",
    gap: "clamp(35px, 6vw, 75px)",
  },
  copy: {
    maxWidth: 580,
  },
  badgeWrapper: {
    marginBottom: 16,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    background: "#ecfdf5",
    color: "#059669",
    border: "1px solid #a7f3d0",
    padding: "6px 14px",
    borderRadius: 30,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.8px",
  },
  title: {
    fontSize: "clamp(38px, 5.2vw, 62px)",
    lineHeight: 1.08,
    letterSpacing: "-1.8px",
    color: "#0f172a",
    margin: "0 0 20px",
    fontWeight: 900,
    fontFamily: "var(--font-heading)",
  },
  description: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 1.7,
    maxWidth: 510,
    margin: "0 0 28px",
  },
  buttons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#ffffff",
    textDecoration: "none",
    padding: "14px 24px",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)",
    transition: "all 0.25s ease",
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    background: "#ffffff",
    color: "#0f172a",
    textDecoration: "none",
    padding: "14px 22px",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
    transition: "all 0.25s ease",
  },
  socialProof: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 26,
    paddingTop: 18,
    borderTop: "1px solid #e2e8f0",
  },
  proofAvatars: {
    display: "flex",
    alignItems: "center",
  },
  proofDot: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 800,
    display: "grid",
    placeItems: "center",
    marginLeft: -6,
    border: "2px solid #ffffff",
  },
  smallNote: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 500,
  },
  preview: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 24,
    padding: "clamp(22px, 3.5vw, 32px)",
    boxShadow: "0 25px 60px rgba(15, 23, 42, 0.08)",
    maxWidth: 500,
    width: "100%",
    boxSizing: "border-box",
    justifySelf: "center",
  },
  previewTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  previewLabel: {
    display: "block",
    color: "#64748b",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: 800,
    marginBottom: 6,
  },
  previewBalance: {
    color: "#0f172a",
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: "-1px",
    fontFamily: "var(--font-heading)",
  },
  demoBadge: {
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  previewStats: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 22,
  },
  previewStat: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "#f8fafc",
  },
  iconGreen: {
    width: 26,
    height: 26,
    borderRadius: 8,
    background: "#dcfce7",
    color: "#166534",
    display: "grid",
    placeItems: "center",
    fontSize: 12,
  },
  iconRed: {
    width: 26,
    height: 26,
    borderRadius: 8,
    background: "#fee2e2",
    color: "#991b1b",
    display: "grid",
    placeItems: "center",
    fontSize: 12,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
  },
  budgetHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  budgetSub: {
    display: "block",
    fontSize: 11,
    color: "#94a3b8",
  },
  track: {
    height: 9,
    borderRadius: 20,
    background: "#e2e8f0",
    overflow: "hidden",
    marginBottom: 16,
  },
  fill: {
    width: "70%",
    height: "100%",
    background: "linear-gradient(90deg, #10b981 0%, #06b6d4 100%)",
    borderRadius: 20,
  },
  previewFoot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 11,
    color: "#64748b",
    paddingTop: 10,
    borderTop: "1px solid #f1f5f9",
  },
  features: {
    maxWidth: 1220,
    margin: "0 auto",
    padding: "40px 24px 80px",
  },
  sectionHeading: {
    textAlign: "center",
    marginBottom: 44,
  },
  headingTitle: {
    fontSize: "clamp(26px, 3.8vw, 36px)",
    color: "#0f172a",
    margin: "14px 0 8px",
    fontWeight: 800,
    letterSpacing: "-0.8px",
    fontFamily: "var(--font-heading)",
  },
  headingSub: {
    margin: 0,
    fontSize: 15,
    color: "#64748b",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: 20,
  },
  featureCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: "26px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    display: "grid",
    placeItems: "center",
    marginBottom: 4,
  },
  featureTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
  },
  featureText: {
    margin: 0,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.6,
  },
};