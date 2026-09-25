import React from "react";

export default function Profile({ student }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.avatar}>
          {(student?.name || "S").charAt(0).toUpperCase()}
        </div>
        <span style={styles.kicker}>YOUR ACCOUNT</span>
        <h1 style={styles.title}>Student profile</h1>
        <p style={styles.subtitle}>Your account details are shown below.</p>

        <div style={styles.detail}>
          <span style={styles.label}>Full name</span>
          <strong>{student?.name || student?.fullName || "Student"}</strong>
        </div>
        <div style={styles.detail}>
          <span style={styles.label}>Email address</span>
          <strong>{student?.email || "No email available"}</strong>
        </div>
        <p style={styles.notice}>
          This is a local demo profile. Account data is stored in this browser.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 850,
    margin: "0 auto",
    padding: "45px 22px 70px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e3e9ef",
    borderRadius: 18,
    padding: "30px clamp(20px, 5vw, 40px)",
    boxShadow: "0 15px 45px rgba(16, 35, 55, 0.05)",
  },
  avatar: {
    width: 58,
    height: 58,
    display: "grid",
    placeItems: "center",
    borderRadius: 18,
    background: "#e2f7ef",
    color: "#07845e",
    fontSize: 24,
    fontWeight: 900,
    marginBottom: 18,
  },
  kicker: {
    color: "#07845e",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.4,
  },
  title: {
    color: "#142238",
    fontSize: 29,
    margin: "8px 0",
  },
  subtitle: {
    color: "#718096",
    fontSize: 13,
    marginBottom: 25,
  },
  detail: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    padding: "15px 0",
    borderTop: "1px solid #edf1f5",
    color: "#17283e",
    fontSize: 14,
  },
  label: {
    color: "#8a98a9",
    fontSize: 12,
  },
  notice: {
    color: "#718096",
    fontSize: 12,
    lineHeight: 1.6,
    background: "#f5f8f7",
    padding: 13,
    borderRadius: 9,
    marginTop: 20,
  },
};