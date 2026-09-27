import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar({ student, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("Rs");

  // Read current currency and listen for updates
  useEffect(() => {
    const updateCurrency = () => {
      try {
        const saved = localStorage.getItem("campusCoinCurrency");
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrencySymbol(parsed.symbol || "Rs");
        }
      } catch {
        setCurrencySymbol("Rs");
      }
    };

    updateCurrency();
    window.addEventListener("campusCoinCurrencyChanged", updateCurrency);
    return () => window.removeEventListener("campusCoinCurrencyChanged", updateCurrency);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navLinkStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#34d399" : "#e2e8f0",
    fontSize: 13,
    fontWeight: isActive ? 700 : 500,
    padding: "8px 14px",
    borderRadius: 10,
    background: isActive ? "rgba(52, 211, 153, 0.14)" : "transparent",
    border: isActive ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid transparent",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    letterSpacing: "0.2px",
  });

  const studentName = student?.name || student?.username || "Student";
  const initial = studentName.charAt(0).toUpperCase();

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        {/* Brand / Logo */}
        <Link to={student ? "/dashboard" : "/"} style={styles.brand} onClick={() => setMobileMenuOpen(false)}>
          <span style={styles.logoIcon}>
            <i className="fa-solid fa-coins"></i>
          </span>
          <div style={styles.brandText}>
            Campus<span style={{ color: "#34d399" }}>Coin</span>
          </div>
          <span style={styles.versionBadge}>HUB</span>
        </Link>

        {/* Desktop Navigation */}
        <nav style={styles.desktopNav}>
          {student ? (
            <>
              <NavLink to="/dashboard" style={navLinkStyle}>
                <i className="fa-solid fa-chart-pie" style={styles.linkIcon}></i>
                Dashboard
              </NavLink>
              <NavLink to="/analytics" style={navLinkStyle}>
                <i className="fa-solid fa-chart-line" style={styles.linkIcon}></i>
                Analytics
              </NavLink>
              <NavLink to="/savings" style={navLinkStyle}>
                <i className="fa-solid fa-piggy-bank" style={styles.linkIcon}></i>
                Savings
              </NavLink>
              <NavLink to="/tips" style={navLinkStyle}>
                <i className="fa-solid fa-wand-magic-sparkles" style={styles.linkIcon}></i>
                AI Tips
              </NavLink>
              <NavLink to="/profile" style={navLinkStyle}>
                <i className="fa-solid fa-user-gear" style={styles.linkIcon}></i>
                Profile
              </NavLink>

              <div style={styles.userSection}>
                {/* Currency Badge */}
                <div style={styles.currencyBadge} title="Active Currency">
                  <span style={styles.currencyDot} />
                  <span>{currencySymbol}</span>
                </div>

                {/* User Pill */}
                <Link to="/profile" style={styles.userPill} title="View Profile">
                  <span style={styles.avatarCircle}>{initial}</span>
                  <span style={styles.userName}>{studentName.split(" ")[0]}</span>
                </Link>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  style={styles.logoutBtn}
                  className="btn-glow"
                  title="Sign out of CampusCoin"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <NavLink to="/" end style={navLinkStyle}>
                <i className="fa-solid fa-house" style={styles.linkIcon}></i>
                Home
              </NavLink>
              <NavLink to="/login" style={navLinkStyle}>
                <i className="fa-solid fa-arrow-right-to-bracket" style={styles.linkIcon}></i>
                Login
              </NavLink>
              <Link to="/register" style={styles.registerBtn} className="btn-glow">
                <i className="fa-solid fa-user-plus" style={{ marginRight: 6 }}></i>
                Get Started Free
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          style={styles.mobileToggleBtn}
          aria-label="Toggle navigation menu"
        >
          <i className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"}`}></i>
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div style={styles.mobileDrawer} className="animate-slide-down">
          {student ? (
            <div style={styles.mobileLinks}>
              <div style={styles.mobileUserHeader}>
                <span style={styles.avatarCircle}>{initial}</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#ffffff", fontSize: 14 }}>{studentName}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    Currency: <span style={{ color: "#34d399", fontWeight: 700 }}>{currencySymbol}</span>
                  </div>
                </div>
              </div>

              <NavLink to="/dashboard" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-chart-pie" style={styles.linkIcon}></i>
                Dashboard
              </NavLink>
              <NavLink to="/analytics" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-chart-line" style={styles.linkIcon}></i>
                Analytics
              </NavLink>
              <NavLink to="/savings" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-piggy-bank" style={styles.linkIcon}></i>
                Savings
              </NavLink>
              <NavLink to="/tips" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-wand-magic-sparkles" style={styles.linkIcon}></i>
                AI Tips
              </NavLink>
              <NavLink to="/profile" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-user-gear" style={styles.linkIcon}></i>
                Profile Settings
              </NavLink>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                style={styles.mobileLogoutBtn}
              >
                <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: 8 }}></i>
                Sign Out
              </button>
            </div>
          ) : (
            <div style={styles.mobileLinks}>
              <NavLink to="/" end style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-house" style={styles.linkIcon}></i>
                Home
              </NavLink>
              <NavLink to="/login" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-arrow-right-to-bracket" style={styles.linkIcon}></i>
                Login
              </NavLink>
              <Link
                to="/register"
                style={styles.registerBtn}
                onClick={() => setMobileMenuOpen(false)}
                className="btn-glow"
              >
                <i className="fa-solid fa-user-plus" style={{ marginRight: 6 }}></i>
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 999,
    width: "100%",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    background: "rgba(11, 19, 43, 0.92)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.22)",
    transition: "all 0.3s ease",
  },
  inner: {
    maxWidth: 1220,
    minHeight: 68,
    margin: "0 auto",
    padding: "0 clamp(16px, 3.5vw, 36px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brand: {
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#ffffff",
    fontWeight: 800,
    fontSize: 21,
    letterSpacing: "-0.5px",
    transition: "transform 0.2s ease",
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
    display: "grid",
    placeItems: "center",
    color: "#ffffff",
    fontSize: 18,
    boxShadow: "0 0 18px rgba(16, 185, 129, 0.45)",
    transition: "transform 0.3s ease",
  },
  brandText: {
    fontFamily: "var(--font-heading)",
  },
  versionBadge: {
    fontSize: 9,
    fontWeight: 800,
    padding: "2px 7px",
    borderRadius: 6,
    background: "rgba(52, 211, 153, 0.14)",
    color: "#34d399",
    border: "1px solid rgba(52, 211, 153, 0.25)",
    letterSpacing: 0.8,
  },
  desktopNav: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  linkIcon: {
    fontSize: 13,
    opacity: 0.85,
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginLeft: 10,
    paddingLeft: 12,
    borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
  },
  currencyBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 700,
    color: "#e2e8f0",
  },
  currencyDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#34d399",
    boxShadow: "0 0 8px #34d399",
  },
  userPill: {
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
    padding: "4px 12px 4px 4px",
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: 600,
    transition: "background 0.2s ease, border-color 0.2s ease",
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    fontWeight: 800,
  },
  userName: {
    maxWidth: 90,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "#fca5a5",
    width: 36,
    height: 36,
    borderRadius: 10,
    fontSize: 13,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    transition: "all 0.2s ease",
  },
  registerBtn: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#ffffff",
    textDecoration: "none",
    padding: "9px 18px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.35)",
    transition: "all 0.25s ease",
  },
  mobileToggleBtn: {
    display: "none",
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#f8fafc",
    width: 40,
    height: 40,
    borderRadius: 10,
    fontSize: 18,
    cursor: "pointer",
    placeItems: "center",
  },
  mobileDrawer: {
    background: "rgba(11, 19, 43, 0.98)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
    padding: "16px 20px 24px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
  },
  mobileLinks: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  mobileUserHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginBottom: 6,
  },
  mobileLogoutBtn: {
    marginTop: 8,
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "#fca5a5",
    padding: "11px 16px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};