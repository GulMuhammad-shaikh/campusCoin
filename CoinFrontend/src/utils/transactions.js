const CURRENCY_KEY = "campusCoinCurrency";

export const CURRENCIES = [
  { code: "PKR", symbol: "Rs.", name: "Pakistani Rupee",   locale: "en-PK" },
  { code: "USD", symbol: "$",   name: "US Dollar",         locale: "en-US" },
  { code: "EUR", symbol: "€",   name: "Euro",              locale: "de-DE" },
  { code: "GBP", symbol: "£",   name: "British Pound",     locale: "en-GB" },
  { code: "INR", symbol: "₹",   name: "Indian Rupee",      locale: "en-IN" },
  { code: "AED", symbol: "AED", name: "UAE Dirham",        locale: "ar-AE" },
  { code: "SAR", symbol: "SR",  name: "Saudi Riyal",       locale: "ar-SA" },
  { code: "CAD", symbol: "C$",  name: "Canadian Dollar",   locale: "en-CA" },
  { code: "AUD", symbol: "A$",  name: "Australian Dollar", locale: "en-AU" },
  { code: "JPY", symbol: "¥",   name: "Japanese Yen",      locale: "ja-JP" },
  { code: "CNY", symbol: "¥",   name: "Chinese Yuan",      locale: "zh-CN" },
  { code: "TRY", symbol: "₺",   name: "Turkish Lira",      locale: "tr-TR" },
  { code: "EGP", symbol: "E£",  name: "Egyptian Pound",    locale: "ar-EG" },
  { code: "BDT", symbol: "৳",   name: "Bangladeshi Taka",  locale: "bn-BD" },
  { code: "LKR", symbol: "₨",   name: "Sri Lankan Rupee",  locale: "si-LK" },
  { code: "MYR", symbol: "RM",  name: "Malaysian Ringgit", locale: "ms-MY" },
  { code: "SGD", symbol: "S$",  name: "Singapore Dollar",  locale: "en-SG" },
  { code: "KWD", symbol: "KD",  name: "Kuwaiti Dinar",     locale: "ar-KW" },
  { code: "QAR", symbol: "QR",  name: "Qatari Riyal",      locale: "ar-QA" },
  { code: "ZAR", symbol: "R",   name: "South African Rand",locale: "en-ZA" },
];

export function getCurrencyCode() {
  try {
    return localStorage.getItem(CURRENCY_KEY) || "PKR";
  } catch {
    return "PKR";
  }
}

export function setCurrencyCode(code) {
  try {
    localStorage.setItem(CURRENCY_KEY, code);
    window.dispatchEvent(new CustomEvent("campusCoinCurrencyChanged", { detail: code }));
  } catch {}
}

export function getCurrency() {
  const code = getCurrencyCode();
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

export function formatCurrency(value) {
  const cur = getCurrency();
  const num = Number(value || 0);
  const decimals = cur.code === "JPY" ? 0 : 2;
  const formatted = num.toLocaleString(cur.locale, { maximumFractionDigits: decimals });
  return `${cur.symbol} ${formatted}`;
}

// Keep legacy alias so existing code still works
export function formatRupees(value) {
  return formatCurrency(value);
}

const STUDENT_KEY = "campusCoinCurrentStudent";

export function getTransactions(student) {
  try {
    const account = student?.email || student?.id || "guest";
    return JSON.parse(localStorage.getItem(`campusCoinTransactions:${String(account).toLowerCase()}`) || "[]");
  } catch {
    return [];
  }
}

export function saveTransactions(student, transactions) {
  const account = student?.email || student?.id || "guest";
  localStorage.setItem(`campusCoinTransactions:${String(account).toLowerCase()}`, JSON.stringify(transactions));
}

export function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}