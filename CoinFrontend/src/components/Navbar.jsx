import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function Navbar({ student, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("Rs");
  const { theme, toggleTheme, isDark } = useTheme();

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
    color: isActive ? "#10b981" : (isDark ? "#e2e8f0" : "#475569"),
    fontSize: 13,
    fontWeight: isActive ? 700 : 500,
    padding: "8px 14px",
    borderRadius: 10,
    background: isActive
      ? (isDark ? "rgba(52, 211, 153, 0.14)" : "rgba(16, 185, 129, 0.12)")
      : "transparent",
    border: isActive
      ? (isDark ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid rgba(16, 185, 129, 0.25)")
      : "1px solid transparent",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    letterSpacing: "0.2px",
  });

  const studentName = student?.name || student?.username || "Student";
  const initial = studentName.charAt(0).toUpperCase();

  const currentStyles = getStyles(isDark);

  return (
    <header style={currentStyles.header}>
      <div style={currentStyles.inner}>
        {/* Brand / Logo */}
        <Link to={student ? "/dashboard" : "/"} style={currentStyles.brand} onClick={() => setMobileMenuOpen(false)}>
          <span style={currentStyles.logoIcon}>
            <i className="fa-solid fa-coins"></i>
          </span>
          <div style={currentStyles.brandText}>
            Campus<span style={{ color: "#10b981" }}>Coin</span>
          </div>
          <span style={currentStyles.versionBadge}>HUB</span>
        </Link>

        {/* Desktop Navigation */}
        <nav style={currentStyles.desktopNav}>
          {student ? (
            <>
              <NavLink to="/dashboard" style={navLinkStyle}>
                <i className="fa-solid fa-chart-pie" style={currentStyles.linkIcon}></i>
                Dashboard
              </NavLink>
              <NavLink to="/analytics" style={navLinkStyle}>
                <i className="fa-solid fa-chart-line" style={currentStyles.linkIcon}></i>
                Analytics
              </NavLink>
              <NavLink to="/savings" style={navLinkStyle}>
                <i className="fa-solid fa-piggy-bank" style={currentStyles.linkIcon}></i>
                Savings
              </NavLink>
              <NavLink to="/tips" style={navLinkStyle}>
                <i className="fa-solid fa-wand-magic-sparkles" style={currentStyles.linkIcon}></i>
                AI Tips
              </NavLink>
              <NavLink to="/profile" style={navLinkStyle}>
                <i className="fa-solid fa-user-gear" style={currentStyles.linkIcon}></i>
                Profile
              </NavLink>

              <div style={currentStyles.userSection}>
                {/* Currency Badge */}
                <div style={currentStyles.currencyBadge} title="Active Currency">
                  <span style={currentStyles.currencyDot} />
                  <span>{currencySymbol}</span>
                </div>

                {/* Theme Mode Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  style={currentStyles.themeToggleBtn}
                  className="btn-glow"
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  aria-label="Toggle dark or light mode"
                >
                  <span style={currentStyles.themeIconCircle}>
                    <i
                      className={isDark ? "fa-solid fa-moon" : "fa-solid fa-sun"}
                      style={{
                        color: isDark ? "#38bdf8" : "#f59e0b",
                        fontSize: 13,
                        transition: "transform 0.3s ease",
                      }}
                    ></i>
                  </span>
                  <span style={currentStyles.themeToggleText}>
                    {isDark ? "Dark" : "Light"}
                  </span>
                </button>

                {/* User Pill */}
                <Link to="/profile" style={currentStyles.userPill} title="View Profile">
                  <span style={currentStyles.avatarCircle}>{initial}</span>
                  <span style={currentStyles.userName}>{studentName.split(" ")[0]}</span>
                </Link>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  style={currentStyles.logoutBtn}
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
                <i className="fa-solid fa-house" style={currentStyles.linkIcon}></i>
                Home
              </NavLink>
              <NavLink to="/login" style={navLinkStyle}>
                <i className="fa-solid fa-arrow-right-to-bracket" style={currentStyles.linkIcon}></i>
                Login
              </NavLink>
              <Link to="/register" style={currentStyles.registerBtn} className="btn-glow">
                <i className="fa-solid fa-user-plus" style={{ marginRight: 6 }}></i>
                Get Started Free
              </Link>

              {/* Theme Mode Toggle Button for Guests */}
              <button
                type="button"
                onClick={toggleTheme}
                style={currentStyles.themeToggleBtn}
                className="btn-glow"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle dark or light mode"
              >
                <span style={currentStyles.themeIconCircle}>
                  <i
                    className={isDark ? "fa-solid fa-moon" : "fa-solid fa-sun"}
                    style={{
                      color: isDark ? "#38bdf8" : "#f59e0b",
                      fontSize: 13,
                    }}
                  ></i>
                </span>
                <span style={currentStyles.themeToggleText}>
                  {isDark ? "Dark" : "Light"}
                </span>
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          style={currentStyles.mobileToggleBtn}
          aria-label="Toggle navigation menu"
        >
          <i className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"}`}></i>
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div style={currentStyles.mobileDrawer} className="animate-slide-down">
          {student ? (
            <div style={currentStyles.mobileLinks}>
              <div style={currentStyles.mobileUserHeader}>
                <span style={currentStyles.avatarCircle}>{initial}</span>
                <div>
                  <div style={{ fontWeight: 700, color: isDark ? "#ffffff" : "#0f172a", fontSize: 14 }}>{studentName}</div>
                  <div style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }}>
                    Currency: <span style={{ color: "#10b981", fontWeight: 700 }}>{currencySymbol}</span>
                  </div>
                </div>
              </div>

              {/* Mobile Theme Toggle Row */}
              <button
                type="button"
                onClick={toggleTheme}
                style={currentStyles.mobileThemeToggleRow}
                aria-label="Toggle dark or light mode"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={currentStyles.mobileThemeIconWrap}>
                    <i
                      className={isDark ? "fa-solid fa-moon" : "fa-solid fa-sun"}
                      style={{ color: isDark ? "#38bdf8" : "#f59e0b" }}
                    />
                  </span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: isDark ? "#ffffff" : "#0f172a" }}>
                      Theme: {isDark ? "Dark Mode" : "Light Mode"}
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b" }}>
                      Tap to switch to {isDark ? "Light Mode" : "Dark Mode"}
                    </div>
                  </div>
                </div>
                <div style={{
                  ...currentStyles.themeSwitchPill,
                  background: isDark ? "#6366f1" : "#10b981",
                }}>
                  <div style={{
                    ...currentStyles.themeSwitchThumb,
                    transform: isDark ? "translateX(16px)" : "translateX(0px)",
                  }} />
                </div>
              </button>

              <NavLink to="/dashboard" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-chart-pie" style={currentStyles.linkIcon}></i>
                Dashboard
              </NavLink>
              <NavLink to="/analytics" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-chart-line" style={currentStyles.linkIcon}></i>
                Analytics
              </NavLink>
              <NavLink to="/savings" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-piggy-bank" style={currentStyles.linkIcon}></i>
                Savings
              </NavLink>
              <NavLink to="/tips" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-wand-magic-sparkles" style={currentStyles.linkIcon}></i>
                AI Tips
              </NavLink>
              <NavLink to="/profile" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-user-gear" style={currentStyles.linkIcon}></i>
                Profile Settings
              </NavLink>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                style={currentStyles.mobileLogoutBtn}
              >
                <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: 8 }}></i>
                Sign Out
              </button>
            </div>
          ) : (
            <div style={currentStyles.mobileLinks}>
              {/* Mobile Theme Toggle Row for Guests */}
              <button
                type="button"
                onClick={toggleTheme}
                style={currentStyles.mobileThemeToggleRow}
                aria-label="Toggle dark or light mode"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={currentStyles.mobileThemeIconWrap}>
                    <i
                      className={isDark ? "fa-solid fa-moon" : "fa-solid fa-sun"}
                      style={{ color: isDark ? "#38bdf8" : "#f59e0b" }}
                    />
                  </span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: isDark ? "#ffffff" : "#0f172a" }}>
                      Theme: {isDark ? "Dark Mode" : "Light Mode"}
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b" }}>
                      Tap to switch to {isDark ? "Light Mode" : "Dark Mode"}
                    </div>
                  </div>
                </div>
                <div style={{
                  ...currentStyles.themeSwitchPill,
                  background: isDark ? "#6366f1" : "#10b981",
                }}>
                  <div style={{
                    ...currentStyles.themeSwitchThumb,
                    transform: isDark ? "translateX(16px)" : "translateX(0px)",
                  }} />
                </div>
              </button>

              <NavLink to="/" end style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-house" style={currentStyles.linkIcon}></i>
                Home
              </NavLink>
              <NavLink to="/login" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
                <i className="fa-solid fa-arrow-right-to-bracket" style={currentStyles.linkIcon}></i>
                Login
              </NavLink>
              <Link
                to="/register"
                style={currentStyles.registerBtn}
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

function getStyles(isDark) {
  return {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 999,
    width: "100%",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    background: isDark ? "rgba(11, 19, 43, 0.92)" : "rgba(255, 255, 255, 0.88)",
    borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
    boxShadow: isDark ? "0 10px 30px rgba(0, 0, 0, 0.22)" : "0 8px 25px rgba(15, 23, 42, 0.05)",
    transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
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
    color: isDark ? "#ffffff" : "#0f172a",
    fontWeight: 800,
    fontSize: 21,
    letterSpacing: "-0.5px",
    transition: "transform 0.2s ease, color 0.2s ease",
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
    background: "rgba(16, 185, 129, 0.14)",
    color: "#10b981",
    border: "1px solid rgba(16, 185, 129, 0.25)",
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
    marginLeft: 8,
    paddingLeft: 12,
    borderLeft: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
  },
  currencyBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
    borderRadius: 8,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 700,
    color: isDark ? "#e2e8f0" : "#1e293b",
  },
  currencyDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 8px #10b981",
  },
  themeToggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(0, 0, 0, 0.04)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.14)" : "1px solid rgba(0, 0, 0, 0.08)",
    borderRadius: 10,
    padding: "6px 12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  themeIconCircle: {
    display: "grid",
    placeItems: "center",
    width: 20,
    height: 20,
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: 700,
    color: isDark ? "#e2e8f0" : "#334155",
  },
  userPill: {
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.08)",
    borderRadius: 20,
    padding: "4px 12px 4px 4px",
    color: isDark ? "#f8fafc" : "#0f172a",
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
    color: "#ef4444",
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
    background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(0, 0, 0, 0.1)",
    color: isDark ? "#f8fafc" : "#0f172a",
    width: 40,
    height: 40,
    borderRadius: 10,
    fontSize: 18,
    cursor: "pointer",
    placeItems: "center",
  },
  mobileDrawer: {
    background: isDark ? "rgba(11, 19, 43, 0.98)" : "rgba(255, 255, 255, 0.98)",
    borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
    padding: "16px 20px 24px",
    boxShadow: isDark ? "0 20px 40px rgba(0, 0, 0, 0.4)" : "0 20px 40px rgba(15, 23, 42, 0.12)",
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
    background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
    borderRadius: 12,
    marginBottom: 6,
  },
  mobileThemeToggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.08)",
    cursor: "pointer",
    fontFamily: "inherit",
    margin: "4px 0 8px",
    transition: "all 0.2s ease",
  },
  mobileThemeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    background: isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(245, 158, 11, 0.15)",
    fontSize: 14,
  },
  themeSwitchPill: {
    width: 38,
    height: 22,
    borderRadius: 12,
    padding: 2,
    display: "flex",
    alignItems: "center",
    transition: "background 0.3s ease",
  },
  themeSwitchThumb: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#ffffff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  },
  mobileLogoutBtn: {
    marginTop: 8,
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    color: "#ef4444",
    padding: "11px 16px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  }  
}