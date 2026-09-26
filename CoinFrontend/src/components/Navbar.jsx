import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar({ student, onLogout }) {
  const navStyle = ({ isActive }) => ({
    textDecoration: "none",
    color: isActive ? "#34d399" : "#e2e8f0",
    fontSize: 14,
    fontWeight: 700,
    padding: "9px 10px",
    borderRadius: 8,
    background: isActive ? "rgba(52, 211, 153, 0.1)" : "transparent",
  });

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <Link to={student ? "/dashboard" : "/"} style={styles.brand}>
          Campus<span style={{ color: "#34d399" }}>Coin</span>
        </Link>

        <nav style={styles.nav}>
          {student ? (
            <>
              <NavLink to="/dashboard" style={navStyle}>Dashboard</NavLink>
              <NavLink to="/analytics" style={navStyle}>Analytics</NavLink>
              <NavLink to="/savings" style={navStyle}>Savings</NavLink>
              <NavLink to="/tips" style={navStyle}>Tips</NavLink>
              <NavLink to="/profile" style={navStyle}>Profile</NavLink>
              <button type="button" onClick={onLogout} style={styles.logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/" end style={navStyle}>Home</NavLink>
              <NavLink to="/login" style={navStyle}>Login</NavLink>
              <Link to="/register" style={styles.register}>Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: "#101b2e",
    color: "#ffffff",
    width: "100%",
    boxSizing: "border-box",
    padding: "0 clamp(18px, 5vw, 70px)",
    boxShadow: "0 5px 22px rgba(15, 23, 42, 0.12)",
  },
  inner: {
    maxWidth: 1200,
    minHeight: 72,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    padding: "12px 0",
  },
  brand: {
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: "-0.8px",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  register: {
    background: "#34d399",
    color: "#052e1b",
    textDecoration: "none",
    padding: "10px 15px",
    borderRadius: 9,
    fontWeight: 800,
    fontSize: 14,
    marginLeft: 3,
  },
  logout: {
    background: "transparent",
    border: "1px solid #607086",
    color: "#ffffff",
    padding: "9px 13px",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
    marginLeft: 3,
  },
};