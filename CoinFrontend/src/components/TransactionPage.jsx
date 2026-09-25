import React, { useState, useEffect, useCallback } from "react";
import {
  getTransactions,
  saveTransactions,
  formatRupees,
  getToday,
} from "../utils/transactions";
import { getCategories, openCategoryManagerModal } from "../utils/categoryService";

export default function TransactionPage({ student, type }) {
  const isIncome = type === "income";
  const defaultFallbackCategories = isIncome
    ? ["Salary", "Commission", "Bonus", "Allowance", "Part-time Job", "Scholarship", "Freelance", "Other Income"]
    : ["Food & Dining", "Transport", "Hostel & Rent", "Academics & Books", "Entertainment", "Utilities & Internet", "Personal Care"];

  const [transactions, setTransactions] = useState(() => getTransactions(student));
  const [categoriesList, setCategoriesList] = useState(defaultFallbackCategories);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(defaultFallbackCategories[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getToday());
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      const dbCategories = await getCategories(type);
      if (dbCategories && dbCategories.length > 0) {
        const names = dbCategories.map((c) => c.name);
        setCategoriesList(names);
        setCategory((prev) => (names.includes(prev) ? prev : names[0]));
      }
    } catch (err) {
      console.error("Could not fetch categories:", err);
    }
  }, [type]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const records = transactions.filter((item) => item.type === type);
  const total = records.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  function handleSubmit(event) {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("Please enter a description and an amount greater than zero.");
      return;
    }

    const newRecord = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      description: description.trim(),
      category,
      amount: numericAmount,
      date,
      note: note.trim(),
    };

    const updated = [newRecord, ...transactions];
    setTransactions(updated);
    saveTransactions(student, updated);

    setDescription("");
    setCategory(categories[0]);
    setAmount("");
    setDate(getToday());
    setNote("");
    setMessage(`${isIncome ? "Income" : "Expense"} saved successfully!`);
    window.setTimeout(() => setMessage(""), 3000);
  }

  function handleDelete(id) {
    const updated = transactions.filter((item) => item.id !== id);
    setTransactions(updated);
    saveTransactions(student, updated);
  }

  return (
    <div style={styles.page}>
      <div style={styles.heading}>
        <div>
          <span style={{ ...styles.eyebrow, color: isIncome ? "#07845e" : "#c84e4e" }}>
            {isIncome ? "MONEY IN" : "MONEY OUT"}
          </span>
          <h1 style={styles.title}>{isIncome ? "Track your income" : "Track your expenses"}</h1>
          <p style={styles.subtitle}>
            {isIncome
              ? "Record salary, commission, bonus, and other money you receive."
              : "Record your purchases and assign each one to a spending category."}
          </p>
        </div>

        <div style={{
          ...styles.totalCard,
          background: isIncome ? "#e2f7ef" : "#fff0f0",
          borderColor: isIncome ? "#c5ecdb" : "#f5d4d4",
        }}>
          <span style={styles.totalLabel}>Total {isIncome ? "income" : "expenses"}</span>
          <strong style={{ ...styles.totalValue, color: isIncome ? "#07845e" : "#c84e4e" }}>
            {formatRupees(total)}
          </strong>
        </div>
      </div>

      {message && (
        <div style={styles.message} role="status">
          <span>✓</span> {message}
        </div>
      )}

      <section style={styles.card}>
        <div style={styles.cardHeading}>
          <div>
            <h2 style={styles.cardTitle}>Add new {isIncome ? "income" : "expense"}</h2>
            <p style={styles.cardSub}>Fill in the details below to save a record.</p>
          </div>
          <div style={{
            ...styles.cardIcon,
            background: isIncome ? "#e2f7ef" : "#fff0f0",
            color: isIncome ? "#07845e" : "#c84e4e",
          }}>
            {isIncome ? "↗" : "↘"}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            {isIncome ? "Source / Description" : "Description / Store"}
            <input
              style={styles.input}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={isIncome ? "e.g. Monthly salary" : "e.g. KFC lunch"}
              required
            />
          </label>

          <label style={styles.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
              <span>Category</span>
              <button
                type="button"
                onClick={() => openCategoryManagerModal(() => loadCategories())}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "0 2px",
                }}
              >
                ⚙ Manage / + Add Category
              </button>
            </div>
            <select
              style={styles.input}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categoriesList.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Amount (Rs.)
            <input
              style={styles.input}
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g. 1500"
              required
            />
          </label>

          <label style={styles.label}>
            Date
            <input
              style={styles.input}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>

          <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
            Note (optional)
            <textarea
              style={{ ...styles.input, minHeight: 85, resize: "vertical" }}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add extra details if needed..."
            />
          </label>

          <button
            type="submit"
            style={{
              ...styles.submit,
              background: isIncome ? "#07845e" : "#c84e4e",
            }}
          >
            + Save {isIncome ? "income" : "expense"}
          </button>
        </form>
      </section>

      <section style={styles.card}>
        <div style={styles.historyHeading}>
          <div>
            <h2 style={styles.cardTitle}>{isIncome ? "Income history" : "Expense history"}</h2>
            <p style={styles.cardSub}>Your saved records appear here.</p>
          </div>
          <span style={styles.counter}>{records.length} records</span>
        </div>

        {records.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>{isIncome ? "↗" : "↘"}</div>
            <strong>No {isIncome ? "income" : "expenses"} recorded yet</strong>
            <p>When you save a record, it will show up here.</p>
          </div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <strong style={{ color: "#26384d" }}>{item.description}</strong>
                      {item.note && <small style={styles.note}>{item.note}</small>}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.categoryBadge,
                        background: isIncome ? "#e2f7ef" : "#fff0f0",
                        color: isIncome ? "#07845e" : "#bd4848",
                      }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={styles.td}>{item.date}</td>
                    <td style={{
                      ...styles.td,
                      color: isIncome ? "#07845e" : "#c84e4e",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}>
                      {isIncome ? "+" : "−"} {formatRupees(item.amount)}
                    </td>
                    <td style={styles.td}>
                      <button type="button" onClick={() => handleDelete(item.id)} style={styles.delete}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "42px 22px 65px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  heading: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 25,
  },
  eyebrow: {
    display: "block",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: {
    color: "#142238",
    fontSize: "clamp(28px, 4vw, 38px)",
    letterSpacing: "-1.2px",
    margin: 0,
  },
  subtitle: {
    color: "#718096",
    lineHeight: 1.6,
    margin: "9px 0 0",
    fontSize: 14,
  },
  totalCard: {
    border: "1px solid",
    borderRadius: 14,
    padding: "17px 20px",
    minWidth: 210,
  },
  totalLabel: {
    display: "block",
    color: "#718096",
    fontSize: 12,
    marginBottom: 7,
  },
  totalValue: {
    fontSize: 25,
  },
  message: {
    background: "#dcfce7",
    color: "#166534",
    padding: "12px 15px",
    borderRadius: 10,
    marginBottom: 18,
    fontWeight: 700,
    fontSize: 13,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e3e9ef",
    borderRadius: 17,
    padding: "clamp(18px, 3vw, 25px)",
    marginBottom: 22,
    boxShadow: "0 12px 35px rgba(16, 35, 55, 0.04)",
  },
  cardHeading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },
  cardTitle: {
    margin: 0,
    fontSize: 18,
    color: "#17283e",
  },
  cardSub: {
    margin: "6px 0 0",
    color: "#8a98a9",
    fontSize: 12,
  },
  cardIcon: {
    display: "grid",
    placeItems: "center",
    width: 40,
    height: 40,
    borderRadius: 12,
    fontWeight: 900,
    fontSize: 21,
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 215px), 1fr))",
    gap: 17,
    marginTop: 22,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    color: "#425267",
    fontSize: 13,
    fontWeight: 700,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dce4eb",
    background: "#fbfcfd",
    borderRadius: 9,
    padding: "12px 13px",
    fontSize: 14,
    color: "#17283e",
    fontFamily: "inherit",
    outlineColor: "#07845e",
  },
  submit: {
    justifySelf: "start",
    border: 0,
    borderRadius: 9,
    color: "#ffffff",
    padding: "12px 18px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  historyHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  counter: {
    borderRadius: 30,
    background: "#f1f5f9",
    color: "#64748b",
    padding: "6px 11px",
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  empty: {
    textAlign: "center",
    padding: "38px 12px",
    color: "#718096",
  },
  emptyIcon: {
    display: "grid",
    placeItems: "center",
    width: 43,
    height: 43,
    margin: "0 auto 12px",
    borderRadius: 13,
    background: "#e2f7ef",
    color: "#07845e",
    fontSize: 22,
    fontWeight: 900,
  },
  table: {
    width: "100%",
    minWidth: 620,
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: 13,
  },
  th: {
    color: "#718096",
    fontSize: 10,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    padding: "12px 10px",
    borderBottom: "1px solid #e9eef3",
  },
  td: {
    padding: "14px 10px",
    borderBottom: "1px solid #edf1f5",
    color: "#536477",
    verticalAlign: "middle",
  },
  note: {
    display: "block",
    color: "#8a98a9",
    marginTop: 5,
  },
  categoryBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: 30,
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  delete: {
    border: "1px solid #f4caca",
    background: "#fff7f7",
    color: "#c24141",
    borderRadius: 7,
    padding: "7px 10px",
    fontWeight: 700,
    cursor: "pointer",
  },
};