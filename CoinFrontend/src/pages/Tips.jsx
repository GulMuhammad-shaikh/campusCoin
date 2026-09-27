import React, { useState, useEffect, useCallback } from "react";
import { transactionAPI } from "../utils/api";
import { formatRupees } from "../utils/transactions";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const STATIC_TIPS = [
  { icon: "📅", title: "Plan a weekly budget", body: "Decide how much you can spend on food, transport, study needs, and personal items each week." },
  { icon: "⚡", title: "Log instantly", body: "Add a transaction the moment you spend. Delayed logging leads to forgotten entries and inaccurate records." },
  { icon: "🎯", title: "Set a realistic savings goal", body: "Start small — even Rs. 500/month builds a strong habit. Increase the target as your income grows." },
  { icon: "🔍", title: "Review your top category", body: "Check which category takes the biggest share each month and ask yourself if it matches your priorities." },
  { icon: "🔁", title: "Track recurring charges", body: "Subscriptions and monthly bills are easy to forget. Log them once as recurring so they never slip through." },
  { icon: "📊", title: "Use the analytics page", body: "Visit the Analytics tab regularly to spot patterns in your income and expenses across weeks and months." },
];

function buildPrompt(summary, categories, studentName) {
  const catLines = categories.length
    ? categories.map((c) => `  - ${c.name}: Rs.${c.amount.toLocaleString()}`).join("\n")
    : "  No expense categories recorded yet.";

  return `You are a friendly financial advisor for a university student named ${studentName || "a student"} in Pakistan who uses a budgeting app called CampusCoin.

Their current financial snapshot:
- Total Income:  Rs.${(summary.totalIncome || 0).toLocaleString()}
- Total Expenses: Rs.${(summary.totalExpense || 0).toLocaleString()}
- Balance:        Rs.${(summary.balance || 0).toLocaleString()}

Top spending categories this month:
${catLines}

Based on this real data, generate exactly 4 personalized, actionable saving tips. 
Rules:
- Each tip must be specific to their actual numbers above (mention category names or amounts where relevant)
- Use simple, friendly language suitable for a student
- Format your response as JSON array only, no extra text:
[
  {"title": "tip title here", "body": "detailed tip body here (2-3 sentences)"},
  ...
]`;
}

export default function AiTips({ student }) {
  const name = student?.name || student?.fullName || "Student";
  const userId = student?.user_id || student?._id || student?.id;

  const [aiTips, setAiTips]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [summary, setSummary]       = useState(null);
  const [categories, setCategories] = useState([]);
  const [pinned, setPinned]         = useState(() => {
    try { return JSON.parse(localStorage.getItem("campusCoinPinnedTips") || "[]"); }
    catch { return []; }
  });
  const [lastGenerated, setLastGenerated] = useState(null);

  const loadFinancialData = useCallback(async () => {
    try {
      const isValidId = userId && /^[0-9a-fA-F]{24}$/.test(String(userId));
      const [sumRes, txnRes] = await Promise.all([
        transactionAPI.getSummary(isValidId ? userId : null),
        transactionAPI.getAll(isValidId ? { user_id: userId } : {}),
      ]);

      const sum = sumRes?.summary || { totalIncome: 0, totalExpense: 0, balance: 0 };
      setSummary(sum);

      const txns = txnRes?.transactions || [];
      const catMap = {};
      txns.filter((t) => t.type === "expense").forEach((t) => {
        const cat = t.category_id?.name || t.category || "Other";
        catMap[cat] = (catMap[cat] || 0) + Number(t.amount || 0);
      });
      const sorted = Object.entries(catMap)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      setCategories(sorted);
      return { sum, cats: sorted };
    } catch {
      return null;
    }
  }, [userId]);

  const generateAiTips = useCallback(async () => {
    if (!GEMINI_KEY) {
      setError("Gemini API key not set. Add VITE_GEMINI_KEY to your .env file.");
      return;
    }
    setLoading(true);
    setError("");

    const data = await loadFinancialData();
    if (!data) {
      setError("Could not load your financial data. Make sure the backend is running.");
      setLoading(false);
      return;
    }

    try {
      const prompt = buildPrompt(data.sum, data.cats, name);
      const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
        }),
      });

      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      const match = rawText.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Could not parse tips from AI response.");

      const parsed = JSON.parse(match[0]);
      setAiTips(parsed);
      setLastGenerated(new Date().toLocaleTimeString());
    } catch (err) {
      setError("AI tips generation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [loadFinancialData, name]);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  function togglePin(title) {
    setPinned((prev) => {
      const next = prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title];
      localStorage.setItem("campusCoinPinnedTips", JSON.stringify(next));
      return next;
    });
  }

  const ICONS = ["💡", "📌", "🎯", "💰"];

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <span style={S.eyebrow}>SMART MONEY HABITS</span>
          <h1 style={S.title}>AI Tips</h1>
          <p style={S.subtitle}>
            Personalized saving advice powered by Google Gemini, based on your actual spending data.
          </p>
        </div>
        <button onClick={generateAiTips} disabled={loading} style={S.genBtn}>
          {loading ? "Generating…" : "✨ Generate My Tips"}
        </button>
      </div>

      {/* Summary bar */}
      {summary && (
        <div style={S.summaryBar}>
          <SumCard label="Income"   value={formatRupees(summary.totalIncome)}  color="#10b981" />
          <SumCard label="Expenses" value={formatRupees(summary.totalExpense)} color="#ef4444" />
          <SumCard label="Balance"  value={formatRupees(summary.balance)}      color={summary.balance >= 0 ? "#6366f1" : "#ef4444"} />
        </div>
      )}

      {error && <div style={S.errorBox}>⚠ {error}</div>}

      {/* AI Tips */}
      {(aiTips.length > 0 || loading) && (
        <section style={S.section}>
          <div style={S.sectionHead}>
            <div>
              <h2 style={S.sectionTitle}>✨ Personalized AI Tips</h2>
              {lastGenerated && <p style={S.sectionSub}>Generated at {lastGenerated} based on your transactions</p>}
            </div>
          </div>

          {loading ? (
            <div style={S.loadingBox}>
              <div style={S.spinner} />
              <p style={{ color: "#64748b", marginTop: 14, fontSize: 14 }}>
                Gemini is analyzing your spending…
              </p>
            </div>
          ) : (
            <div style={S.grid}>
              {aiTips.map((tip, i) => (
                <TipCard
                  key={i}
                  icon={ICONS[i] || "💡"}
                  title={tip.title}
                  body={tip.body}
                  pinned={pinned.includes(tip.title)}
                  onPin={() => togglePin(tip.title)}
                  ai
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* No key state */}
      {!GEMINI_KEY && aiTips.length === 0 && !loading && (
        <div style={S.setupBox}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
          <h3 style={{ margin: "0 0 8px", color: "#17283e" }}>Set Up Your Free AI Key</h3>
          <p style={{ color: "#718096", fontSize: 13, lineHeight: 1.7, maxWidth: 420 }}>
            Get a free Google Gemini API key from{" "}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: "#6366f1" }}>
              aistudio.google.com
            </a>{" "}
            — no credit card required. Then add it to your frontend <code>.env</code> file:
          </p>
          <code style={S.codeBlock}>VITE_GEMINI_KEY=your_key_here</code>
          <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 10 }}>Free tier: 15 requests/minute · No cost</p>
        </div>
      )}

      {/* Static General Tips */}
      <section style={S.section}>
        <div style={S.sectionHead}>
          <div>
            <h2 style={S.sectionTitle}>📚 General Budgeting Tips</h2>
            <p style={S.sectionSub}>Timeless habits every student should build</p>
          </div>
        </div>
        <div style={S.grid}>
          {STATIC_TIPS.map((tip, i) => (
            <TipCard
              key={i}
              icon={tip.icon}
              title={tip.title}
              body={tip.body}
              pinned={pinned.includes(tip.title)}
              onPin={() => togglePin(tip.title)}
            />
          ))}
        </div>
      </section>

      {/* Pinned Tips */}
      {pinned.length > 0 && (
        <section style={S.section}>
          <div style={S.sectionHead}>
            <div>
              <h2 style={S.sectionTitle}>📌 Pinned Tips</h2>
              <p style={S.sectionSub}>Tips you saved for quick reference</p>
            </div>
            <button onClick={() => { setPinned([]); localStorage.removeItem("campusCoinPinnedTips"); }} style={S.clearBtn}>
              Clear all
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {pinned.map((t) => (
              <div key={t} style={S.pinnedTag}>
                📌 {t}
                <button onClick={() => togglePin(t)} style={S.removePin}>✕</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TipCard({ icon, title, body, pinned, onPin, ai }) {
  return (
    <article style={{ ...S.card, ...(pinned ? S.cardPinned : {}), ...(ai ? S.cardAi : {}) }}>
      <div style={S.cardTop}>
        <span style={S.icon}>{icon}</span>
        {ai && <span style={S.aiBadge}>AI</span>}
        <button onClick={onPin} style={{ ...S.pinBtn, color: pinned ? "#6366f1" : "#cbd5e1" }} title={pinned ? "Unpin" : "Pin"}>
          {pinned ? "📌" : "🔗"}
        </button>
      </div>
      <h2 style={S.cardTitle}>{title}</h2>
      <p style={S.cardBody}>{body}</p>
    </article>
  );
}

function SumCard({ label, value, color }) {
  return (
    <div style={{ ...S.sumCard, borderTop: `3px solid ${color}` }}>
      <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
      <strong style={{ fontSize: 18, color }}>{value}</strong>
    </div>
  );
}

const S = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "42px 22px 70px", fontFamily: "Inter, Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 18, marginBottom: 28 },
  eyebrow: { display: "block", color: "#07845e", fontSize: 11, fontWeight: 900, letterSpacing: 1.4, marginBottom: 6 },
  title: { margin: "0 0 6px", fontSize: "clamp(26px,4vw,34px)", color: "#142238", letterSpacing: "-1px" },
  subtitle: { margin: 0, color: "#718096", fontSize: 14, lineHeight: 1.6 },
  genBtn: {
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff", border: "none", borderRadius: 12,
    padding: "13px 22px", fontSize: 14, fontWeight: 800,
    cursor: "pointer", flexShrink: 0, fontFamily: "inherit",
    boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
  },
  summaryBar: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 28 },
  sumCard: { background: "#fff", border: "1px solid #e3e9ef", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 13 },
  section: { marginBottom: 36 },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 },
  sectionTitle: { margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#17283e" },
  sectionSub: { margin: 0, fontSize: 12, color: "#94a3b8" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 },
  card: { background: "#fff", border: "1px solid #e3e9ef", borderRadius: 16, padding: 22, boxShadow: "0 4px 20px rgba(16,35,55,0.04)", transition: "box-shadow 0.2s" },
  cardPinned: { border: "1.5px solid #6366f1", boxShadow: "0 4px 24px rgba(99,102,241,0.12)" },
  cardAi: { background: "linear-gradient(135deg,#faf5ff,#eff6ff)", border: "1.5px solid #c4b5fd" },
  cardTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 },
  icon: { fontSize: 22 },
  aiBadge: { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 10, fontWeight: 900, padding: "2px 7px", borderRadius: 20, letterSpacing: 1 },
  pinBtn: { marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0 },
  cardTitle: { margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#17283e" },
  cardBody: { margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.7 },
  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", padding: "50px 20px" },
  spinner: { width: 36, height: 36, border: "3px solid #e2e8f0", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  setupBox: { background: "linear-gradient(135deg,#faf5ff,#eff6ff)", border: "1.5px solid #c4b5fd", borderRadius: 18, padding: "40px 32px", textAlign: "center", marginBottom: 36 },
  codeBlock: { display: "block", background: "#1e1b4b", color: "#a5b4fc", padding: "12px 20px", borderRadius: 10, fontSize: 13, marginTop: 16, fontFamily: "monospace" },
  clearBtn: { background: "none", border: "1px solid #e2e8f0", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
  pinnedTag: { background: "#ede9fe", color: "#6366f1", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 },
  removePin: { background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, padding: 0 },
};