import React, { useState } from "react";

export default function Savings() {
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [goal, setGoal] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    const target = Number(goalAmount);
    const saved = Number(savedAmount);

    if (!goalName.trim() || target <= 0 || saved < 0) return;

    setGoal({ name: goalName.trim(), target, saved });
  }

  const progress = goal
    ? Math.min(100, (goal.saved / goal.target) * 100)
    : 0;

  return (
    <div style={styles.page}>
      <span style={styles.kicker}>PLAN AHEAD</span>
      <h1 style={styles.title}>Savings goals</h1>
      <p style={styles.subtitle}>Set a target and keep track of your progress.</p>

      <section style={styles.card}>
        <h2 style={styles.heading}>Create a savings goal</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Goal name
            <input style={styles.input} value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="e.g. New laptop" required />
          </label>
          <label style={styles.label}>
            Target amount (Rs.)
            <input style={styles.input} type="number" min="1" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} required />
          </label>
          <label style={styles.label}>
            Already saved (Rs.)
            <input style={styles.input} type="number" min="0" value={savedAmount} onChange={(e) => setSavedAmount(e.target.value)} required />
          </label>
          <button style={styles.button} type="submit">Save goal</button>
        </form>
      </section>

      {goal && (
        <section style={styles.card}>
          <div style={styles.goalHeader}>
            <div>
              <h2 style={styles.heading}>{goal.name}</h2>
              <p style={styles.subtitle}>{goal.saved.toLocaleString("en-PK")} saved of Rs. {goal.target.toLocaleString("en-PK")}</p>
            </div>
            <strong style={styles.percent}>{progress.toFixed(0)}%</strong>
          </div>
          <div style={styles.track}>
            <div style={{ ...styles.fill, width: `${progress}%` }} />
          </div>
        </section>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin: "0 auto", padding: "42px 22px 65px", fontFamily: "Inter, Arial, sans-serif" },
  kicker: { color: "#07845e", fontSize: 11, fontWeight: 900, letterSpacing: 1.4 },
  title: { color: "#142238", fontSize: 34, margin: "9px 0" },
  subtitle: { color: "#718096", fontSize: 13, lineHeight: 1.6 },
  card: { background: "#fff", border: "1px solid #e3e9ef", borderRadius: 17, padding: 24, marginTop: 22, boxShadow: "0 12px 35px rgba(16, 35, 55, 0.04)" },
  heading: { color: "#17283e", fontSize: 18, margin: "0 0 8px" },
  form: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", gap: 15, marginTop: 18 },
  label: { display: "flex", flexDirection: "column", gap: 8, color: "#425267", fontSize: 13, fontWeight: 700 },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 13px", border: "1px solid #dce4eb", borderRadius: 9, background: "#fbfcfd", fontSize: 14 },
  button: { alignSelf: "end", border: 0, borderRadius: 9, padding: "12px 17px", background: "#07845e", color: "#fff", fontWeight: 800, cursor: "pointer" },
  goalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15 },
  percent: { color: "#07845e", fontSize: 23 },
  track: { height: 10, background: "#edf1f5", borderRadius: 20, overflow: "hidden", marginTop: 17 },
  fill: { height: "100%", background: "#07845e", borderRadius: 20 },
};