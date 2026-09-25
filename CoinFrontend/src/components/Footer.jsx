import React from "react";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div style={styles.brand}>
          Campus<span style={{ color: "#34d399" }}>Coin</span>
        </div>
        <p style={styles.copy}>
          A simple way for students to manage money and build better habits.
        </p>
        <span style={styles.year}>© {new Date().getFullYear()} CampusCoin</span>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: "#101b2e",
    color: "#d4dce7",
    padding: "25px clamp(18px, 5vw, 70px)",
    marginTop: 35,
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  brand: {
    color: "#ffffff",
    fontWeight: 900,
    fontSize: 17,
  },
  copy: {
    margin: 0,
    color: "#aab6c7",
    fontSize: 13,
  },
  year: {
    color: "#aab6c7",
    fontSize: 12,
  },
};