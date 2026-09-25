import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.copy}>
          <span style={styles.pill}>YOUR STUDENT MONEY COMPANION</span>
          <h1 style={styles.title}>
            Take control of your money.
            <span style={styles.green}> One step at a time.</span>
          </h1>
          <p style={styles.description}>
            Track your income, organize daily spending, and stay focused on
            your savings goals—all in one simple place.
          </p>

          <div style={styles.buttons}>
            <Link to="/register" style={styles.primaryButton}>
              Create free account <span>→</span>
            </Link>
            <Link to="/login" style={styles.secondaryButton}>
              Sign in
            </Link>
          </div>

          <p style={styles.smallNote}>
            Made for student life. Simple to start, easy to maintain.
          </p>
        </div>

        <div style={styles.preview}>
          <div style={styles.previewTop}>
            <div>
              <span style={styles.previewLabel}>SAMPLE BALANCE</span>
              <div style={styles.previewBalance}>Rs. 24,500</div>
            </div>
            <span style={styles.demoBadge}>Demo preview</span>
          </div>

          <div style={styles.previewStats}>
            <div style={styles.previewStat}>
              <span style={styles.iconGreen}>↗</span>
              <span style={styles.statLabel}>Income</span>
              <strong>Rs. 35,000</strong>
            </div>
            <div style={styles.previewStat}>
              <span style={styles.iconRed}>↘</span>
              <span style={styles.statLabel}>Expenses</span>
              <strong>Rs. 10,500</strong>
            </div>
          </div>

          <div style={styles.budgetHeader}>
            <div>
              <strong style={{ fontSize: 13 }}>Monthly budget</strong>
              <span style={styles.budgetSub}>Example spending overview</span>
            </div>
            <strong style={{ fontSize: 13 }}>70%</strong>
          </div>
          <div style={styles.track}>
            <div style={styles.fill} />
          </div>
          <div style={styles.previewFoot}>
            <span>Food & essentials</span>
            <span>See your own records after signing in</span>
          </div>
        </div>
      </section>

      <section style={styles.features}>
        <div style={styles.sectionHeading}>
          <span style={styles.pill}>EVERYTHING IN ONE PLACE</span>
          <h2>Build better money habits</h2>
          <p>Keep everyday finances organized without complicated tools.</p>
        </div>

        <div style={styles.featureGrid}>
          {features.map((feature) => (
            <div key={feature.title} style={styles.featureCard}>
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
    icon: "↗",
    title: "Track income",
    text: "Record salary, commission, bonus, allowance, and other money received.",
  },
  {
    icon: "↘",
    title: "Organize expenses",
    text: "Categorize purchases like food, transport, academics, and bills.",
  },
  {
    icon: "◎",
    title: "Watch your balance",
    text: "See how your recorded income and expenses affect your available balance.",
  },
];

const styles = {
  page: {
    color: "#17283e",
    fontFamily: "Inter, Arial, sans-serif",
  },
  hero: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "clamp(55px, 8vw, 105px) 22px 70px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
    alignItems: "center",
    gap: "clamp(35px, 6vw, 80px)",
  },
  copy: {
    maxWidth: 590,
  },
  pill: {
    display: "inline-block",
    background: "#e2f7ef",
    color: "#087a55",
    padding: "8px 12px",
    borderRadius: 30,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.1,
  },
  title: {
    fontSize: "clamp(39px, 5.4vw, 67px)",
    lineHeight: 1.06,
    letterSpacing: "-2.8px",
    color: "#142238",
    margin: "23px 0 18px",
  },
  green: {
    color: "#07845e",
  },
  description: {
    color: "#66768a",
    fontSize: 16,
    lineHeight: 1.8,
    maxWidth: 520,
    margin: "0 0 25px",
  },
  buttons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 13,
    background: "#07845e",
    color: "#ffffff",
    textDecoration: "none",
    padding: "15px 19px",
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14,
    boxShadow: "0 10px 20px rgba(7, 132, 94, 0.16)",
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#17283e",
    textDecoration: "none",
    padding: "15px 20px",
    border: "1px solid #dce5eb",
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14,
  },
  smallNote: {
    color: "#8a98a9",
    fontSize: 12,
    marginTop: 17,
  },
  preview: {
    background: "#ffffff",
    border: "1px solid #e0e8ed",
    borderRadius: 22,
    padding: "clamp(20px, 3vw, 29px)",
    boxShadow: "0 25px 65px rgba(22, 44, 61, 0.08)",
    maxWidth: 520,
    width: "100%",
    boxSizing: "border-box",
    justifySelf: "center",
  },
  previewTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 23,
  },
  previewLabel: {
    display: "block",
    color: "#8290a2",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: 900,
    marginBottom: 8,
  },
  previewBalance: {
    color: "#142238",
    fontSize: 29,
    fontWeight: 900,
    letterSpacing: -0.7,
  },
  demoBadge: {
    background: "#f1f5f9",
    color: "#64748b",
    padding: "7px 10px",
    borderRadius: 20,
    fontSize: 10,
    whiteSpace: "nowrap",
  },
  previewStats: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 24,
  },
  previewStat: {
    border: "1px solid #e4ebf0",
    borderRadius: 13,
    padding: 13,
    display: "flex",
    flexDirection: "column",
    gap: 7,
    fontSize: 13,
  },
  iconGreen: {
    background: "#e2f7ef",
    color: "#07845e",
    borderRadius: 8,
    padding: 7,
    width: 18,
    textAlign: "center",
    fontWeight: 900,
  },
  iconRed: {
    background: "#fff0f0",
    color: "#c84e4e",
    borderRadius: 8,
    padding: 7,
    width: 18,
    textAlign: "center",
    fontWeight: 900,
  },
  statLabel: {
    color: "#718096",
    fontSize: 11,
  },
  budgetHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  budgetSub: {
    display: "block",
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 4,
  },
  track: {
    width: "100%",
    height: 8,
    background: "#edf1f5",
    borderRadius: 20,
    overflow: "hidden",
  },
  fill: {
    width: "70%",
    height: "100%",
    borderRadius: 20,
    background: "#07845e",
  },
  previewFoot: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    color: "#8794a5",
    fontSize: 10,
    marginTop: 13,
  },
  features: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "15px 22px 75px",
  },
  sectionHeading: {
    textAlign: "center",
    marginBottom: 30,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  featureCard: {
    background: "#ffffff",
    border: "1px solid #e3e9ef",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 10px 30px rgba(16, 35, 55, 0.035)",
  },
  featureIcon: {
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    borderRadius: 12,
    background: "#e2f7ef",
    color: "#07845e",
    fontSize: 21,
    fontWeight: 900,
  },
  featureTitle: {
    color: "#17283e",
    fontSize: 16,
    margin: "16px 0 8px",
  },
  featureText: {
    color: "#718096",
    fontSize: 13,
    lineHeight: 1.7,
    margin: 0,
  },
};