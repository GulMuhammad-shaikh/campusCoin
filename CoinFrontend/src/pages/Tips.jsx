import React from "react";

const tips = [
  ["Plan a weekly budget", "Decide how much you can spend on food, transport, study needs, and personal items."],
  ["Record purchases right away", "Adding a transaction as soon as you spend helps keep your records accurate."],
  ["Set a realistic savings target", "Start with a manageable amount and increase it when your budget allows."],
  ["Review spending categories", "Check which categories take the largest share of your recorded expenses."],
];

export default function Tips() {
  return (
    <div style={styles.page}>
      <span style={styles.kicker}>SMART MONEY HABITS</span>
      <h1 style={styles.title}>Budgeting tips</h1>
      <p style={styles.subtitle}>Small habits can make it easier to understand where your money goes.</p>

      <div style={styles.grid}>
        {tips.map(([title, description], index) => (
          <article key={title} style={styles.card}>
            <span style={styles.number}>0{index + 1}</span>
            <h2 style={styles.heading}>{title}</h2>
            <p style={styles.text}>{description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1050, margin: "0 auto", padding: "42px 22px 65px", fontFamily: "Inter, Arial, sans-serif" },
  kicker: { color: "#07845e", fontSize: 11, fontWeight: 900, letterSpacing: 1.4 },
  title: { color: "#142238", fontSize: 34, margin: "9px 0" },
  subtitle: { color: "#718096", fontSize: 13, lineHeight: 1.7, marginBottom: 25 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 },
  card: { background: "#fff", border: "1px solid #e3e9ef", borderRadius: 16, padding: 23, boxShadow: "0 12px 35px rgba(16, 35, 55, 0.04)" },
  number: { color: "#07845e", fontSize: 12, fontWeight: 900, background: "#e2f7ef", padding: "7px 10px", borderRadius: 8 },
  heading: { color: "#17283e", fontSize: 17, margin: "19px 0 9px" },
  text: { color: "#718096", fontSize: 13, lineHeight: 1.7, margin: 0 },
};