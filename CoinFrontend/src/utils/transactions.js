const STUDENT_KEY = "campusCoinCurrentStudent";

export function getTransactions(student) {
  try {
    const account = student?.email || student?.id || "guest";
    const key = `campusCoinTransactions:${String(account).toLowerCase()}`;
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export function saveTransactions(student, transactions) {
  const account = student?.email || student?.id || "guest";
  const key = `campusCoinTransactions:${String(account).toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify(transactions));
}

export function formatRupees(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;
}

export function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}