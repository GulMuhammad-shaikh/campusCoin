import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Footer() {
  const { theme, toggleTheme, isDark } = useTheme();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const styles = getStyles(isDark);

  return (
    <footer style={styles.footer}>
      {/* Top Ambient Glow Line */}
      <div style={styles.glowLine} />

      <div style={styles.inner}>
        {/* Brand & Mission Column */}
        <div style={styles.brandCol}>
          <div style={styles.brand}>
            <span style={styles.logoIcon}>
              <i className="fa-solid fa-coins"></i>
            </span>
            <div style={styles.brandText}>
              Campus<span style={{ color: "#10b981" }}>Coin</span>
            </div>
          </div>
          <p style={styles.mission}>
            The smart financial companion built exclusively for university and college students. Master budgeting, track spending, and crush your savings goals.
          </p>
          <div style={styles.badgeRow}>
            <span style={styles.securityBadge}>
              <i className="fa-solid fa-shield-halved" style={{ marginRight: 6, color: "#10b981" }}></i>
              Student-Safe & Private
            </span>
            <span style={styles.securityBadge}>
              <i className="fa-solid fa-bolt" style={{ marginRight: 6, color: "#f59e0b" }}></i>
              AI-Powered Insights
            </span>
          </div>
        </div>

        {/* Quick Links Column */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Platform</h4>
          <ul style={styles.linkList}>
            <li>
              <Link to="/dashboard" style={styles.link}>
                <i className="fa-solid fa-angle-right" style={styles.linkArrow}></i>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/analytics" style={styles.link}>
                <i className="fa-solid fa-angle-right" style={styles.linkArrow}></i>
                Visual Analytics
              </Link>
            </li>
            <li>
              <Link to="/savings" style={styles.link}>
                <i className="fa-solid fa-angle-right" style={styles.linkArrow}></i>
                Savings Targets
              </Link>
            </li>
            <li>
              <Link to="/tips" style={styles.link}>
                <i className="fa-solid fa-angle-right" style={styles.linkArrow}></i>
                Smart AI Tips
              </Link>
            </li>
            <li>
              <Link to="/profile" style={styles.link}>
                <i className="fa-solid fa-angle-right" style={styles.linkArrow}></i>
                Multi-Currency Profile
              </Link>
            </li>
          </ul>
        </div>

        {/* Highlights / Values Column */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Key Highlights</h4>
          <div style={styles.highlightCard}>
            <div style={styles.highlightTitle}>
              <i className="fa-solid fa-chart-pie" style={{ color: "#0284c7", marginRight: 8 }}></i>
              Dual Donut Charts
            </div>
            <p style={styles.highlightText}>
              Categorized insights and real-time income vs. expense breakdowns.
            </p>
          </div>
          <div style={styles.highlightCard}>
            <div style={styles.highlightTitle}>
              <i className="fa-solid fa-robot" style={{ color: "#a855f7", marginRight: 8 }}></i>
              Gemini AI Integration
            </div>
            <p style={styles.highlightText}>
              Personalized budget coaching generated directly from your live spending data.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Bar */}
      <div style={styles.bottomBar}>
        <div style={styles.bottomInner}>
          <span style={styles.copy}>
            © {new Date().getFullYear()} CampusCoin. All rights reserved. Built for students worldwide.
          </span>

          <div style={styles.bottomRight}>
            {/* Quick theme selector button in footer */}
            <button
              type="button"
              onClick={toggleTheme}
              style={styles.themeToggleBtn}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle dark or light mode"
            >
              <i
                className={isDark ? "fa-solid fa-moon" : "fa-solid fa-sun"}
                style={{ color: isDark ? "#38bdf8" : "#f59e0b", marginRight: 6 }}
              />
              <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
            </button>

            <span style={styles.statusIndicator}>
              <span style={styles.statusDot} />
              API Systems Active
            </span>
            <button
              type="button"
              onClick={scrollToTop}
              style={styles.backToTopBtn}
              title="Back to top"
              aria-label="Back to top"
            >
              <i className="fa-solid fa-arrow-up"></i>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

const getStyles = (isDark) => ({
  footer: {
    position: "relative",
    background: isDark
      ? "linear-gradient(180deg, #0b132b 0%, #070d19 100%)"
      : "linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)",
    color: isDark ? "#cbd5e1" : "#64748b",
    marginTop: "auto",
    fontFamily: "var(--font-heading)",
    borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
    transition: "background 0.25s ease, border-color 0.25s ease, color 0.25s ease",
  },
  glowLine: {
    height: 1,
    width: "100%",
    background: "linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.6) 50%, transparent 100%)",
  },
  inner: {
    maxWidth: 1220,
    margin: "0 auto",
    padding: "50px clamp(18px, 4vw, 36px) 40px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: "clamp(30px, 4vw, 50px)",
  },
  brandCol: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    maxWidth: 420,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: isDark ? "#ffffff" : "#0f172a",
    fontWeight: 800,
    fontSize: 22,
    letterSpacing: "-0.5px",
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
    display: "grid",
    placeItems: "center",
    color: "#ffffff",
    fontSize: 16,
    boxShadow: "0 0 15px rgba(16, 185, 129, 0.35)",
  },
  brandText: {
    fontFamily: "var(--font-heading)",
  },
  mission: {
    margin: 0,
    fontSize: 13,
    color: isDark ? "#94a3b8" : "#64748b",
    lineHeight: 1.6,
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  securityBadge: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 11,
    fontWeight: 600,
    color: isDark ? "#e2e8f0" : "#334155",
    background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.08)",
    padding: "4px 10px",
    borderRadius: 20,
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  colTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 800,
    color: isDark ? "#ffffff" : "#0f172a",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  linkList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  link: {
    textDecoration: "none",
    color: isDark ? "#94a3b8" : "#64748b",
    fontSize: 13,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "color 0.2s ease, transform 0.2s ease",
  },
  linkArrow: {
    fontSize: 10,
    color: "#10b981",
    opacity: 0.8,
  },
  highlightCard: {
    background: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.07)" : "1px solid rgba(0, 0, 0, 0.07)",
    borderRadius: 12,
    padding: "12px 14px",
    boxShadow: isDark ? "none" : "0 2px 8px rgba(15, 23, 42, 0.04)",
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: isDark ? "#ffffff" : "#0f172a",
    marginBottom: 4,
    display: "flex",
    alignItems: "center",
  },
  highlightText: {
    margin: 0,
    fontSize: 12,
    color: isDark ? "#94a3b8" : "#64748b",
    lineHeight: 1.5,
  },
  bottomBar: {
    borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
    background: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
    padding: "16px clamp(18px, 4vw, 36px)",
  },
  bottomInner: {
    maxWidth: 1220,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  copy: {
    fontSize: 12,
    color: isDark ? "#64748b" : "#94a3b8",
  },
  bottomRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  themeToggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    background: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 700,
    color: isDark ? "#e2e8f0" : "#334155",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  statusIndicator: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    color: "#10b981",
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    padding: "3px 9px",
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 8px #10b981",
  },
  backToTopBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
    color: isDark ? "#e2e8f0" : "#334155",
    fontSize: 12,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    transition: "all 0.2s ease",
  },
});