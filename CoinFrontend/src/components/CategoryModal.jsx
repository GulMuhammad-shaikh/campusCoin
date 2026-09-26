import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import { categoryAPI } from "../utils/api";

/**
 * Curated list of 40 popular student finance categories (25 Expense + 15 Income)
 */
export const PREDEFINED_CATEGORIES = [
  // 25 Expense Categories
  { name: "Food & Dining", type: "expense" },
  { name: "Campus Cafeteria", type: "expense" },
  { name: "Hostel & Rent", type: "expense" },
  { name: "Transport & Metro", type: "expense" },
  { name: "Bus Pass & Rickshaw", type: "expense" },
  { name: "Academics & Textbooks", type: "expense" },
  { name: "Stationery & Photocopy", type: "expense" },
  { name: "Tuition & Coaching Fees", type: "expense" },
  { name: "Exam & Lab Fees", type: "expense" },
  { name: "Electricity & Utilities", type: "expense" },
  { name: "Internet & Wi-Fi", type: "expense" },
  { name: "Mobile Balance & Data", type: "expense" },
  { name: "Groceries & Snacks", type: "expense" },
  { name: "Personal Care & Toiletries", type: "expense" },
  { name: "Clothing & Footwear", type: "expense" },
  { name: "Laundry & Ironing", type: "expense" },
  { name: "Entertainment & Cinema", type: "expense" },
  { name: "Gaming & Streaming", type: "expense" },
  { name: "Gym & Fitness", type: "expense" },
  { name: "Medical & Pharmacy", type: "expense" },
  { name: "Tech & Laptop Accessories", type: "expense" },
  { name: "Semester Project & Hardware", type: "expense" },
  { name: "Gifts & Celebrations", type: "expense" },
  { name: "Travel & Homecoming Trip", type: "expense" },
  { name: "Emergency & Unexpected", type: "expense" },

  // 15 Income Categories
  { name: "Pocket Money & Allowance", type: "income" },
  { name: "Part-time Job", type: "income" },
  { name: "Internship Stipend", type: "income" },
  { name: "Merit Scholarship", type: "income" },
  { name: "Freelancing & Projects", type: "income" },
  { name: "Home Tuition & Tutoring", type: "income" },
  { name: "Graphic Design / Editing", type: "income" },
  { name: "Cash Gifts & Eidi", type: "income" },
  { name: "Selling Used Books & Notes", type: "income" },
  { name: "Campus Ambassador Reward", type: "income" },
  { name: "Hackathon / Competition Prize", type: "income" },
  { name: "Research Assistantship", type: "income" },
  { name: "Online Reselling", type: "income" },
  { name: "Cashback & Discounts", type: "income" },
  { name: "Other Income", type: "income" },
];

export default function CategoryModal({ onClose, onCategoryAdded }) {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [isDefault, setIsDefault] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = Add mode, ID = Edit mode

  // Suggestions search & filter
  const [suggestionSearch, setSuggestionSearch] = useState("");
  const [suggestionFilter, setSuggestionFilter] = useState("all"); // 'all' | 'expense' | 'income'

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch categories from backend
  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryAPI.getAll();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loadCategories]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Set of names already present in database
  const addedNamesSet = useMemo(() => {
    return new Set(categories.map((c) => c.name.toLowerCase().trim()));
  }, [categories]);

  // Filtered 40 suggestions
  const filteredSuggestions = useMemo(() => {
    return PREDEFINED_CATEGORIES.filter((item) => {
      const matchesType =
        suggestionFilter === "all" || item.type === suggestionFilter;
      const matchesSearch = item.name
        .toLowerCase()
        .includes(suggestionSearch.toLowerCase().trim());
      return matchesType && matchesSearch;
    });
  }, [suggestionFilter, suggestionSearch]);

  // Quick-add a category from the 40 suggestions list
  async function handleQuickAdd(suggestion) {
    if (addedNamesSet.has(suggestion.name.toLowerCase().trim())) {
      setMessage(`"${suggestion.name}" is already in your categories list.`);
      setTimeout(() => setMessage(""), 2500);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await categoryAPI.create({
        name: suggestion.name,
        type: suggestion.type,
        is_default: false,
      });

      if (res.success) {
        setMessage(`Added "${suggestion.name}" to categories!`);
        await loadCategories();
        if (typeof onCategoryAdded === "function") {
          onCategoryAdded(res.category);
        }
        setTimeout(() => setMessage(""), 2500);
      }
    } catch (err) {
      setError(err.message || "Failed to add category.");
    } finally {
      setSaving(false);
    }
  }

  // Populate form with suggestion
  function handleSelectSuggestion(suggestion) {
    setName(suggestion.name);
    setType(suggestion.type);
    setEditingId(null);
  }

  // Start editing existing category
  function handleStartEdit(cat) {
    const catId = cat._id || cat.id || cat.category_id;
    setEditingId(catId);
    setName(cat.name);
    setType(cat.type);
    setIsDefault(Boolean(cat.is_default));
    setError("");
    setMessage("");
  }

  // Cancel edit mode
  function handleCancelEdit() {
    setEditingId(null);
    setName("");
    setType("expense");
    setIsDefault(false);
    setError("");
  }

  // Form Submit (Add or Update)
  async function handleFormSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Edit Mode
        const res = await categoryAPI.update(editingId, {
          name: name.trim(),
          type,
          is_default: isDefault,
        });

        if (res.success) {
          setMessage(`Category "${name}" updated successfully!`);
          handleCancelEdit();
          await loadCategories();
          if (typeof onCategoryAdded === "function") onCategoryAdded();
          setTimeout(() => setMessage(""), 3000);
        }
      } else {
        // Add Mode
        const res = await categoryAPI.create({
          name: name.trim(),
          type,
          is_default: isDefault,
        });

        if (res.success) {
          setName("");
          setIsDefault(false);
          setMessage(`Category "${res.category.name}" added successfully!`);
          await loadCategories();
          if (typeof onCategoryAdded === "function") {
            onCategoryAdded(res.category);
          }
          setTimeout(() => setMessage(""), 3000);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  }

  // Delete Category (SweetAlert2 used ONLY for confirmation)
  async function handleDeleteCategory(cat) {
    const catId = cat._id || cat.id || cat.category_id;

    const confirm = await Swal.fire({
      title: `Delete "${cat.name}"?`,
      text: "Are you sure you want to permanently delete this category from the database?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await categoryAPI.delete(catId);
        if (res.success) {
          setCategories((prev) =>
            prev.filter((c) => (c._id || c.id || c.category_id) !== catId)
          );
          if (editingId === catId) handleCancelEdit();
          if (typeof onCategoryAdded === "function") onCategoryAdded();
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: err.message || "Could not delete category.",
        });
      }
    }
  }

  // Toggle Default Status
  async function handleToggleDefault(cat) {
    const catId = cat._id || cat.id || cat.category_id;
    const newStatus = !cat.is_default;
    try {
      const res = await categoryAPI.update(catId, { is_default: newStatus });
      if (res.success) {
        setCategories((prev) =>
          prev.map((c) =>
            (c._id || c.id || c.category_id) === catId
              ? { ...c, is_default: newStatus }
              : c
          )
        );
        if (typeof onCategoryAdded === "function") onCategoryAdded();
      }
    } catch (err) {
      console.error("Could not update default status:", err);
    }
  }

  return (
    <div
      style={styles.backdrop}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.typeTag}>CATEGORIES</span>
            <h2 style={styles.modalTitle}>Manage & Select Categories</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={styles.closeBtn}
            title="Cancel (Esc)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={styles.body}>
          {message && (
            <div style={styles.successBox} role="status">
              ✓ {message}
            </div>
          )}
          {error && (
            <div style={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          {/* ─── Top Split: 40 Quick Suggestions & Custom Form ─── */}
          <div style={styles.gridColumns}>
            {/* Side Card: 40 Category Suggestions */}
            <div style={styles.suggestionCard}>
              <div style={styles.suggestionHeader}>
                <div>
                  <h3 style={styles.sectionTitle}>
                    💡 Quick Suggestions (40)
                  </h3>
                  <p style={styles.sectionSub}>
                    Click any category to quick-add or select
                  </p>
                </div>
              </div>

              {/* Filter Tabs & Search */}
              <div style={styles.filterRow}>
                <div style={styles.tabGroup}>
                  <button
                    type="button"
                    onClick={() => setSuggestionFilter("all")}
                    style={{
                      ...styles.filterTab,
                      background:
                        suggestionFilter === "all" ? "#2563eb" : "#f1f5f9",
                      color:
                        suggestionFilter === "all" ? "#ffffff" : "#475569",
                    }}
                  >
                    All (40)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionFilter("expense")}
                    style={{
                      ...styles.filterTab,
                      background:
                        suggestionFilter === "expense" ? "#ef4444" : "#f1f5f9",
                      color:
                        suggestionFilter === "expense" ? "#ffffff" : "#475569",
                    }}
                  >
                    Expenses (25)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionFilter("income")}
                    style={{
                      ...styles.filterTab,
                      background:
                        suggestionFilter === "income" ? "#07845e" : "#f1f5f9",
                      color:
                        suggestionFilter === "income" ? "#ffffff" : "#475569",
                    }}
                  >
                    Income (15)
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search 40 suggestions..."
                  value={suggestionSearch}
                  onChange={(e) => setSuggestionSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              {/* Suggestions chips container */}
              <div style={styles.chipsScroll}>
                {filteredSuggestions.map((item) => {
                  const isAdded = addedNamesSet.has(
                    item.name.toLowerCase().trim()
                  );
                  const isExpense = item.type === "expense";

                  return (
                    <div
                      key={item.name}
                      style={{
                        ...styles.chip,
                        borderColor: isExpense ? "#fecaca" : "#bbf7d0",
                        background: isAdded ? "#f8fafc" : "#ffffff",
                      }}
                    >
                      <span
                        style={{
                          ...styles.chipDot,
                          background: isExpense ? "#ef4444" : "#07845e",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        style={styles.chipTextBtn}
                        title="Click to fill in form"
                      >
                        {item.name}
                      </button>

                      {isAdded ? (
                        <span style={styles.addedBadge}>Added</span>
                      ) : (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleQuickAdd(item)}
                          style={styles.quickAddBtn}
                          title="1-click add to database"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Side Card: Add / Edit Form */}
            <div style={styles.formCard}>
              <div style={styles.formCardHeader}>
                <h3 style={styles.sectionTitle}>
                  {editingId ? "✏️ Edit Category" : "+ Add / Custom Category"}
                </h3>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    style={styles.cancelEditBtn}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <p style={styles.sectionSub}>
                {editingId
                  ? "Modify category details and save."
                  : "Type a name or choose from suggestions."}
              </p>

              <form onSubmit={handleFormSubmit} style={styles.form}>
                <label style={styles.label}>
                  Category Name
                  <input
                    style={styles.input}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Campus Cafeteria, Tuition"
                    required
                  />
                </label>

                <label style={styles.label}>
                  Type
                  <select
                    style={styles.input}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="expense">Expense (Money Out)</option>
                    <option value="income">Income (Money In)</option>
                  </select>
                </label>

                <label style={styles.label}>
                  <span style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      style={styles.checkbox}
                    />
                    Make this a default category
                  </span>
                  <span style={styles.hint}>
                    Default categories appear automatically in transaction dropdowns.
                  </span>
                </label>

                <div style={styles.actions}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      ...styles.saveBtn,
                      background: saving
                        ? "#aaa"
                        : editingId
                        ? "#0284c7"
                        : "#2563eb",
                    }}
                  >
                    {saving
                      ? "Saving…"
                      : editingId
                      ? "Update Category"
                      : "+ Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ─── Below Card: Added Categories in Database (with Edit, Delete & Default) ─── */}
          <div style={styles.listCard}>
            <div style={styles.listHeader}>
              <div>
                <h3 style={styles.sectionTitle}>
                  📋 Added Categories in Database
                </h3>
                <p style={styles.sectionSub}>
                  Edit name/type, toggle default, or permanently delete categories
                </p>
              </div>
              <span style={styles.counter}>{categories.length} added</span>
            </div>

            {loading ? (
              <p style={{ color: "#64748b", fontSize: 13, padding: "10px 0" }}>
                Loading categories from database…
              </p>
            ) : categories.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: 13, padding: "10px 0" }}>
                No categories in database yet. Add from suggestions above!
              </p>
            ) : (
              <div style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const catId = cat._id || cat.id || cat.category_id;
                  const isExpense = cat.type === "expense";
                  const isDef = Boolean(cat.is_default);
                  const isCurrentEditing = editingId === catId;

                  return (
                    <div
                      key={catId}
                      style={{
                        ...styles.categoryItem,
                        border: isCurrentEditing
                          ? "2px solid #2563eb"
                          : "1px solid #e2e8f0",
                        background: isCurrentEditing ? "#eff6ff" : "#ffffff",
                      }}
                    >
                      <div style={styles.itemTop}>
                        <span
                          style={{
                            ...styles.typeBadge,
                            background: isExpense ? "#fee2e2" : "#dcfce7",
                            color: isExpense ? "#b91c1c" : "#15803d",
                          }}
                        >
                          {cat.type}
                        </span>
                        {isDef && (
                          <span style={styles.defaultBadge}>Default</span>
                        )}
                      </div>

                      <strong style={styles.catName} title={cat.name}>
                        {cat.name}
                      </strong>

                      {/* Action buttons: Edit, Default Toggle, Delete */}
                      <div style={styles.itemActions}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          style={styles.editBtn}
                          title="Edit this category"
                        >
                          ✎ Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleDefault(cat)}
                          style={{
                            ...styles.toggleBtn,
                            background: isDef ? "#f1f5f9" : "#eff6ff",
                            color: isDef ? "#64748b" : "#2563eb",
                          }}
                          title={
                            isDef
                              ? "Remove default status"
                              : "Make default category"
                          }
                        >
                          {isDef ? "Unset Default" : "Make Default"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          style={styles.deleteBtn}
                          title="Delete from database"
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(12, 24, 38, 0.65)",
    backdropFilter: "blur(3px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    overflowY: "auto",
    padding: "20px 14px 40px",
  },
  panel: {
    background: "#ffffff",
    borderRadius: 18,
    width: "100%",
    maxWidth: 980,
    boxShadow: "0 25px 70px rgba(10, 25, 45, 0.22)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Inter, Arial, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px 14px",
    background: "#fcfcfd",
    borderBottom: "2px solid #e2e8f0",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  typeTag: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.2,
    padding: "3px 9px",
    borderRadius: 6,
    textTransform: "uppercase",
    width: "fit-content",
    background: "#eff6ff",
    color: "#2563eb",
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    color: "#17283e",
    fontWeight: 900,
  },
  closeBtn: {
    width: 34,
    height: 34,
    display: "grid",
    placeItems: "center",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#64748b",
    borderRadius: 9,
    fontSize: 15,
    cursor: "pointer",
    fontWeight: 700,
  },
  body: {
    padding: "20px 24px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  successBox: {
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
    padding: "10px 14px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 700,
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "10px 14px",
    borderRadius: 9,
    fontSize: 13,
    fontWeight: 600,
  },
  gridColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
    gap: 16,
  },
  suggestionCard: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  suggestionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterRow: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  tabGroup: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  filterTab: {
    border: "none",
    padding: "5px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    borderRadius: 8,
    padding: "7px 11px",
    fontSize: 12,
    color: "#1e293b",
    outlineColor: "#2563eb",
  },
  chipsScroll: {
    maxHeight: 250,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    paddingRight: 4,
  },
  chip: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "6px 9px",
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
  },
  chipTextBtn: {
    background: "none",
    border: "none",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
    color: "#1e293b",
    cursor: "pointer",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    padding: 0,
  },
  addedBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: "#07845e",
    background: "#dcfce7",
    padding: "2px 6px",
    borderRadius: 4,
    whiteSpace: "nowrap",
  },
  quickAddBtn: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: 5,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  formCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
  },
  formCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelEditBtn: {
    background: "none",
    border: "none",
    color: "#ef4444",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 15,
    color: "#17283e",
    fontWeight: 800,
  },
  sectionSub: {
    margin: "3px 0 12px",
    color: "#8a98a9",
    fontSize: 11,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    color: "#425267",
    fontSize: 12,
    fontWeight: 700,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dce4eb",
    background: "#fbfcfd",
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 13,
    color: "#17283e",
    fontFamily: "inherit",
    outlineColor: "#2563eb",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    color: "#1e293b",
  },
  checkbox: {
    width: 15,
    height: 15,
    accentColor: "#2563eb",
    cursor: "pointer",
  },
  hint: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  actions: {
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 4,
  },
  saveBtn: {
    border: 0,
    borderRadius: 8,
    color: "#ffffff",
    padding: "10px 18px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  cancelBtn: {
    border: "1px solid #dce4eb",
    borderRadius: 8,
    background: "#ffffff",
    color: "#64748b",
    padding: "10px 16px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  listCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  counter: {
    borderRadius: 30,
    background: "#f1f5f9",
    color: "#64748b",
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 800,
  },
  categoryGrid: {
    maxHeight: 280,
    overflowY: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 10,
    padding: "4px 2px",
  },
  categoryItem: {
    borderRadius: 10,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    transition: "all 0.15s ease",
  },
  itemTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: 800,
    padding: "2px 7px",
    borderRadius: 4,
    textTransform: "uppercase",
  },
  defaultBadge: {
    fontSize: 10,
    fontWeight: 800,
    padding: "1px 6px",
    borderRadius: 8,
    background: "#e0f2fe",
    color: "#0369a1",
  },
  catName: {
    fontSize: 13,
    color: "#1e293b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemActions: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    borderTop: "1px solid #f1f5f9",
    paddingTop: 8,
    marginTop: 2,
  },
  editBtn: {
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: 5,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    cursor: "pointer",
    fontWeight: 700,
  },
  toggleBtn: {
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: 5,
    border: "1px solid #cbd5e1",
    cursor: "pointer",
    fontWeight: 700,
  },
  deleteBtn: {
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: 5,
    border: "1px solid #fca5a5",
    background: "#fff1f2",
    color: "#e11d48",
    cursor: "pointer",
    fontWeight: 800,
    marginLeft: "auto",
  },
};
