import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getTransactions, formatRupees } from "../utils/transactions";

export default function Dashboard({ student }) {
  const transactions = getTransactions(student);

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const expenses = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const categories = {};
    transactions
      .filter((item) => item.type === "expense")
      .forEach((item) => {
        categories[item.category] =
          (categories[item.category] || 0) + Number(item.amount || 0);
      });

    return {
      income,
      expenses,
      balance: income - expenses,
      categories: Object.entries(categories)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
    };
  }, [transactions]);

  const recent = [...transactions]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5);

  const name = student?.name || student?.fullName || "Student";
  const maxCategory = Math.max(1, ...totals.categories.map((item) => item.amount));

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <div>
          <span style={styles.eyebrow}>STUDENT FINANCE OVERVIEW</span>
          <h1 style={styles.title}>Welcome back, {name}</h1>
          <p style={styles.subtitle}>Here’s what’s happening with your money.</p>
        </div>
        <div style={styles.actions}>
          <Link to="/income" style={styles.addIncome}>+ Add income</Link>
          <Link to="/expenses" style={styles.addExpense}>+ Add expense</Link>
        </div>
      </div>

      <section style={styles.balance}>
        <div>
          <span style={styles.balanceLabel}>Available balance</span>
          <div style={styles.balanceAmount}>{formatRupees(totals.balance)}</div>
          <span style={styles.balanceHint}>Income minus recorded expenses</span>
        </div>
        <div style={styles.balanceSymbol}>₨</div>
      </section>

      <section style={styles.stats}>
        <Stat title="Total income" amount={formatRupees(totals.income)} color="#07845e" symbol="↗" />
        <Stat title="Total expenses" amount={formatRupees(totals.expenses)} color="#c84e4e" symbol="↘" />
        <Stat title="Transactions" amount={String(transactions.length)} color="#4e66c8" symbol="▤" />
      </section>

      <section style={styles.columns}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Recent transactions</h2>
              <p style={styles.panelSub}>Your latest saved activity</p>
            </div>
            <Link to="/income" style={styles.manage}>Add record</Link>
          </div>

          {recent.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>＋</div>
              <strong>No transactions yet</strong>
              <p>Start by adding your first income or expense.</p>
              <div style={styles.emptyButtons}>
                <Link to="/income" style={styles.addIncome}>Add income</Link>
                <Link to="/expenses" style={styles.addExpense}>Add expense</Link>
              </div>
            </div>
          ) : (
            recent.map((item) => (
              <div key={item.id} style={styles.transaction}>
                <div style={styles.transactionLeft}>
                  <span style={{
                    ...styles.transactionIcon,
                    background: item.type === "income" ? "#e2f7ef" : "#fff0f0",
                    color: item.type === "income" ? "#07845e" : "#c84e4e",
                  }}>
                    {item.type === "income" ? "↗" : "↘"}
                  </span>
                  <div>
                    <strong style={styles.transactionName}>{item.description}</strong>
                    <span style={styles.transactionMeta}>{item.category} · {item.date}</span>
                  </div>
                </div>
                <strong style={{
                  color: item.type === "income" ? "#07845e" : "#c84e4e",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}>
                  {item.type === "income" ? "+" : "−"} {formatRupees(item.amount)}
                </strong>
              </div>
            ))
          )}
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Spending categories</h2>
              <p style={styles.panelSub}>Your expenses grouped by category</p>
            </div>
          </div>

          {totals.categories.length === 0 ? (
            <p style={styles.noCategories}>
              Add an expense to see which categories your money is going toward.
            </p>
          ) : (
            totals.categories.slice(0, 7).map((item) => (
              <div key={item.name} style={styles.categoryItem}>
                <div style={styles.categoryHeader}>
                  <span>{item.name}</span>
                  <strong>{formatRupees(item.amount)}</strong>
                </div>
                <div style={styles.barTrack}>
                  <div style={{
                    ...styles.bar,
                    width: `${(item.amount / maxCategory) * 100}%`,
                  }} />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ title, amount, color, symbol }) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statIcon, color, background: `${color}16` }}>{symbol}</span>
      <span style={styles.statTitle}>{title}</span>
      <strong style={styles.statAmount}>{amount}</strong>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "42px 22px 60px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  heading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 23,
  },
  eyebrow: {
    color: "#07845e",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.4,
  },
  title: {
    margin: "8px 0 6px",
    fontSize: "clamp(26px, 4vw, 36px)",
    color: "#142238",
    letterSpacing: "-1px",
  },
  subtitle: {
    margin: 0,
    color: "#718096",
    fontSize: 14,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  addIncome: {
    textDecoration: "none",
    background: "#07845e",
    color: "#ffffff",
    padding: "11px 15px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 800,
  },
  addExpense: {
    textDecoration: "none",
    background: "#ffffff",
    color: "#bd4848",
    border: "1px solid #f0caca",
    padding: "11px 15px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 800,
  },
  balance: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    padding: "25px 28px",
    background: "linear-gradient(120deg, #102d36, #087a5a)",
    borderRadius: 17,
    color: "#ffffff",
    marginBottom: 18,
    boxShadow: "0 15px 35px rgba(8, 92, 69, 0.14)",
  },
  balanceLabel: {
    color: "#c4e7dc",
    fontSize: 13,
  },
  balanceAmount: {
    fontSize: "clamp(29px, 4vw, 39px)",
    fontWeight: 900,
    margin: "7px 0",
  },
  balanceHint: {
    color: "#c4e7dc",
    fontSize: 11,
  },
  balanceSymbol: {
    width: 54,
    height: 54,
    display: "grid",
    placeItems: "center",
    borderRadius: 15,
    background: "rgba(255,255,255,0.14)",
    fontSize: 27,
    fontWeight: 900,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 15,
    marginBottom: 18,
  },
  statCard: {
    background: "#ffffff",
    border: "1px solid #e3e9ef",
    borderRadius: 14,
    padding: 19,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  statIcon: {
    width: 35,
    height: 35,
    display: "grid",
    placeItems: "center",
    borderRadius: 10,
    fontSize: 19,
    fontWeight: 900,
  },
  statTitle: {
    color: "#718096",
    fontSize: 12,
  },
  statAmount: {
    color: "#17283e",
    fontSize: 21,
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: 18,
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #e3e9ef",
    borderRadius: 16,
    padding: 22,
    minWidth: 0,
    boxShadow: "0 12px 35px rgba(16, 35, 55, 0.035)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  panelTitle: {
    margin: 0,
    fontSize: 17,
    color: "#17283e",
  },
  panelSub: {
    margin: "5px 0 0",
    color: "#8a98a9",
    fontSize: 12,
  },
  manage: {
    color: "#07845e",
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 12,
  },
  empty: {
    textAlign: "center",
    padding: "25px 10px",
    color: "#718096",
    fontSize: 13,
  },
  emptyIcon: {
    display: "grid",
    placeItems: "center",
    width: 42,
    height: 42,
    margin: "0 auto 12px",
    borderRadius: 12,
    background: "#e2f7ef",
    color: "#07845e",
    fontSize: 22,
  },
  emptyButtons: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 17,
  },
  transaction: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "13px 0",
    borderBottom: "1px solid #edf1f5",
  },
  transactionLeft: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    minWidth: 0,
  },
  transactionIcon: {
    flex: "0 0 36px",
    width: 36,
    height: 36,
    display: "grid",
    placeItems: "center",
    borderRadius: 10,
    fontWeight: 900,
    fontSize: 18,
  },
  transactionName: {
    display: "block",
    color: "#293b50",
    fontSize: 13,
    marginBottom: 4,
  },
  transactionMeta: {
    display: "block",
    color: "#8a98a9",
    fontSize: 11,
  },
  noCategories: {
    color: "#8a98a9",
    fontSize: 13,
    lineHeight: 1.7,
    padding: "18px 0",
  },
  categoryItem: {
    margin: "19px 0",
  },
  categoryHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 12,
    color: "#526276",
    marginBottom: 8,
  },
  barTrack: {
    height: 7,
    background: "#edf1f5",
    borderRadius: 20,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    background: "#07845e",
    borderRadius: 20,
  },
};