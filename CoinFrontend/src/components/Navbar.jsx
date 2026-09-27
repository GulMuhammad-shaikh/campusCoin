import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar({ student, onLogout }) {
  const navStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#34d399" : "#cbd5e1",
    fontSize: 14,
    fontWeight: 600,
    padding: "8px 12px",
    borderRadius: 8,
    background: isActive ? "rgba(52, 211, 153, 0.12)" : "transparent",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    transition: "all 0.15s ease",
  });

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link to={student ? "/dashboard" : "/"} style={styles.brand}>
          <i className="fa-solid fa-coins" style={{ color: "#34d399", marginRight: 8 }}></i>
          Campus<span style={{ color: "#34d399" }}>Coin</span>
        </Link>

        <nav style={styles.nav}>
          {student ? (
            <>
              <NavLink to="/dashboard" style={navStyle}>
                <i className="fa-solid fa-chart-pie" style={{ fontSize: 13 }}></i>
                Dashboard
              </NavLink>
              <NavLink to="/analytics" style={navStyle}>
                <i className="fa-solid fa-chart-line" style={{ fontSize: 13 }}></i>
                Analytics
              </NavLink>
              <NavLink to="/savings" style={navStyle}>
                <i className="fa-solid fa-piggy-bank" style={{ fontSize: 13 }}></i>
                Savings
              </NavLink>
              <NavLink to="/tips" style={navStyle}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 13 }}></i>
                AI Tips
              </NavLink>
              <NavLink to="/profile" style={navStyle}>
                <i className="fa-solid fa-user-gear" style={{ fontSize: 13 }}></i>
                Profile
              </NavLink>
              <button type="button" onClick={onLogout} style={styles.logout}>
                <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: 6 }}></i>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/" end style={navStyle}>
                <i className="fa-solid fa-house" style={{ fontSize: 13 }}></i>
                Home
              </NavLink>
              <NavLink to="/login" style={navStyle}>
                <i className="fa-solid fa-arrow-right-to-bracket" style={{ fontSize: 13 }}></i>
                Login
              </NavLink>
              <Link to="/register" style={styles.register}>
                <i className="fa-solid fa-user-plus" style={{ marginRight: 6 }}></i>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: "#0f172a",
    color: "#ffffff",
    width: "100%",
    boxSizing: "border-box",
    padding: "0 clamp(16px, 4vw, 50px)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  inner: {
    maxWidth: 1200,
    minHeight: 68,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    padding: "10px 0",
  },
  brand: {
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.5px",
    display: "flex",
    alignItems: "center",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  register: {
    background: "#34d399",
    color: "#052e1b",
    textDecoration: "none",
    padding: "8px 14px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    marginLeft: 4,
    display: "inline-flex",
    alignItems: "center",
  },
  logout: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#e2e8f0",
    padding: "8px 12px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    marginLeft: 4,
    display: "inline-flex",
    alignItems: "center",
    fontFamily: "inherit",
    transition: "all 0.15s ease",
  },
};