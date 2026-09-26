import React, { useState, useEffect, useCallback } from "react";
import { getToday } from "../utils/transactions";
import { getCategories } from "../utils/categoryService";
import { transactionAPI } from "../utils/api";

/**
 * TransactionModal — saves ONLY to backend API.
 * Auto-closes on success. Shows error if backend fails.
 *
 * Props:
 *  - student: current logged-in student object
 *  - type: "income" | "expense"
 *  - onClose: callback — closes modal (Dashboard re-fetches from API)
 *  - onOpenCategoryModal: optional — opens Category modal
 */
export default function TransactionModal({
  student,
  type: propType,
  initialData,
  onClose,
  onSuccess,
  onOpenCategoryModal,
}) {
  const isEdit      = Boolean(initialData);
  const type        = initialData?.type || propType || "income";
  const isIncome    = type === "income";
  const accentColor = isIncome ? "#07845e" : "#c84e4e";
  const lightBg     = isIncome ? "#e2f7ef" : "#fff0f0";

  const defaultFallback = isIncome
    ? ["Pocket Money & Allowance", "Part-time Job", "Internship Stipend", "Merit Scholarship", "Freelancing & Projects", "Other Income"]
    : ["Food & Dining", "Transport", "Hostel & Rent", "Academics & Textbooks", "Entertainment", "Utilities & Internet", "Personal Care"];

  const [categoriesList, setCategoriesList] = useState(defaultFallback);
  const [dbCategories,   setDbCategories]   = useState([]);
  const [description,    setDescription]    = useState(initialData?.description || "");
  const [category,       setCategory]       = useState(initialData?.category || defaultFallback[0]);
  const [amount,         setAmount]         = useState(initialData?.amount !== undefined ? String(initialData.amount) : "");
  const [date,           setDate]           = useState(initialData?.date ? String(initialData.date).slice(0, 10) : getToday());
  const [note,           setNote]           = useState(initialData?.note || "");
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState("");

  // Load categories from backend
  const loadCategories = useCallback(async () => {
    try {
      const dbCats = await getCategories(type);
      if (dbCats && dbCats.length > 0) {
        setDbCategories(dbCats);
        const names = dbCats.map((c) => c.name);
        setCategoriesList(names);
        if (!initialData?.category) {
          setCategory((prev) => (names.includes(prev) ? prev : names[0]));
        }
      }
    } catch {
      // keep fallback list
    }
  }, [type, initialData]);

  useEffect(() => {
    loadCategories();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [loadCategories]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const numericAmount = Number(amount);

    if (!description.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a description and a valid amount greater than zero.");
      return;
    }

    const userId = student?.user_id || student?._id || student?.id;
    if (!userId) {
      setError("User session not found. Please log in again.");
      return;
    }

    // Find category ID if available
    const matched = dbCategories.find(
      (c) => c.name?.toLowerCase() === category?.toLowerCase()
    );
    const category_id = matched?._id || matched?.id || null;

    setSaving(true);
    try {
      if (isEdit) {
        const txnId = initialData._id || initialData.id;
        await transactionAPI.update(txnId, {
          amount:      numericAmount,
          type,
          category,
          category_id,
          description: description.trim(),
          date,
          note:        note.trim(),
        });
      } else {
        // Save to backend API
        await transactionAPI.create({
          user_id:     userId,
          amount:      numericAmount,
          type,
          category,
          category_id,
          description: description.trim(),
          date,
          note:        note.trim(),
        });
      }

      // Dispatch global event so all components update immediately
      window.dispatchEvent(
        new CustomEvent("campusCoinDataChanged", {
          detail: { action: isEdit ? "update" : "create" },
        })
      );

      if (typeof onSuccess === "function") {
        onSuccess();
      }

      onClose(); // close modal
    } catch (err) {
      setError(err?.message || "Could not save to server. Make sure the backend is running.");
      setSaving(false);
    }
  }

  return (
    <div style={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.panel}>

        {/* Header */}
        <div style={{ ...styles.header, borderBottom: `2px solid ${lightBg}` }}>
          <div style={styles.headerLeft}>
            <span style={{ ...styles.typeTag, background: lightBg, color: accentColor }}>
              {isEdit ? "✏️ EDIT TRANSACTION" : isIncome ? "↗ MONEY IN" : "↘ MONEY OUT"}
            </span>
            <h2 style={styles.modalTitle}>
              {isEdit
                ? (isIncome ? "Edit Income" : "Edit Expense")
                : (isIncome ? "Add Income" : "Add Expense")}
            </h2>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn} title="Cancel (Esc)">
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {error && <div style={styles.errorBox} role="alert">{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              {isIncome ? "Source / Description" : "Description / Store"}
              <input
                style={styles.input}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isIncome ? "e.g. Monthly allowance" : "e.g. KFC lunch"}
                required
                autoFocus
              />
            </label>

            <label style={styles.label}>
              <div style={styles.categoryHeader}>
                <span>Category</span>
                {onOpenCategoryModal && (
                  <button type="button" onClick={onOpenCategoryModal} style={styles.manageBtn}>
                    ⚙ Manage / + Add
                  </button>
                )}
              </div>
              <select
                style={styles.input}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                onChange={(e) => setAmount(e.target.value)}
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
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>

            <label style={{ ...styles.label, gridColumn: "1 / -1" }}>
              Note (optional)
              <textarea
                style={{ ...styles.input, minHeight: 70, resize: "vertical" }}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add extra details if needed..."
              />
            </label>

            <div style={styles.actions}>
              <button type="button" onClick={onClose} style={styles.cancelBtn}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ ...styles.saveBtn, background: saving ? "#aaa" : accentColor }}
              >
                {saving
                  ? "Saving…"
                  : isEdit
                  ? "Save changes"
                  : `+ Save ${isIncome ? "income" : "expense"}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(12,24,38,0.65)", backdropFilter: "blur(3px)",
    display: "flex", justifyContent: "center", alignItems: "flex-start",
    overflowY: "auto", padding: "30px 14px 40px",
  },
  panel: {
    background: "#fff", borderRadius: 18, width: "100%", maxWidth: 620,
    boxShadow: "0 25px 70px rgba(10,25,45,0.22)",
    overflow: "hidden", display: "flex", flexDirection: "column",
    fontFamily: "Inter, Arial, sans-serif",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 24px 14px", background: "#fcfcfd",
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: 4 },
  typeTag: {
    display: "inline-block", fontSize: 11, fontWeight: 900, letterSpacing: 1.2,
    padding: "3px 9px", borderRadius: 6, textTransform: "uppercase", width: "fit-content",
  },
  modalTitle: { margin: 0, fontSize: 20, color: "#17283e", fontWeight: 900 },
  closeBtn: {
    width: 34, height: 34, display: "grid", placeItems: "center",
    border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b",
    borderRadius: 9, fontSize: 15, cursor: "pointer", fontWeight: 700,
  },
  body: { padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
    padding: "10px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600,
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
    gap: 15,
  },
  label:  { display: "flex", flexDirection: "column", gap: 7, color: "#425267", fontSize: 13, fontWeight: 700 },
  categoryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  manageBtn: {
    background: "none", border: "none", color: "#2563eb",
    fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "0 2px",
  },
  input: {
    width: "100%", boxSizing: "border-box", border: "1px solid #dce4eb",
    background: "#fbfcfd", borderRadius: 9, padding: "11px 12px",
    fontSize: 14, color: "#17283e", fontFamily: "inherit", outlineColor: "#07845e",
  },
  actions: { gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 },
  saveBtn: {
    border: 0, borderRadius: 9, color: "#fff", padding: "12px 22px",
    fontSize: 13, fontWeight: 800, cursor: "pointer",
  },
  cancelBtn: {
    border: "1px solid #dce4eb", borderRadius: 9, background: "#fff",
    color: "#64748b", padding: "11px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
  },
};
