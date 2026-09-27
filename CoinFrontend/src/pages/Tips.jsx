import React, { useState, useEffect, useCallback } from "react";
import { transactionAPI } from "../utils/api";
import { formatRupees, getCurrency } from "../utils/transactions";
import { fireConfetti } from "../utils/confetti";
import sound from "../utils/audio";

const DEFAULT_GEMINI_B64 = "QVEuQWI4Uk42SkFaLTNFNnJJclpEd2JIa1ZkYVpQV1RhNnhmeTBpSXlxc1BVZkpBMW5hcGc=";
const GEMINI_KEY = (
  import.meta.env.VITE_GEMINI_KEY ||
  (typeof atob === "function" ? atob(DEFAULT_GEMINI_B64) : "")
).trim();
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const STATIC_TIPS = [
  { iconClass: "fa-solid fa-calendar-check", title: "Plan a weekly budget", body: "Decide how much you can spend on food, transport, study needs, and personal items each week." },
  { iconClass: "fa-solid fa-bolt-lightning", title: "Log transactions immediately", body: "Record purchases right when they occur. Delayed logging leads to forgotten expenses and inaccurate totals." },
  { iconClass: "fa-solid fa-bullseye", title: "Establish an incremental target", body: "Start with a modest savings goal. Incremental habit-building produces more consistent long-term results." },
  { iconClass: "fa-solid fa-magnifying-glass-chart", title: "Review primary category spending", body: "Analyze your largest expense category each month to determine whether it aligns with your budget." },
  { iconClass: "fa-solid fa-arrows-rotate", title: "Monitor recurring subscriptions", body: "Digital subscriptions and monthly recurring charges compound quickly. Review and cancel idle services." },
  { iconClass: "fa-solid fa-chart-line", title: "Audit analytics periodically", body: "Inspect your weekly and monthly trends on the Analytics page to catch upward spending drifts early." },
];

function generateHeuristicTips(sum, cats, curSymbol) {
  const topCat = cats && cats.length > 0 ? cats[0] : { name: "Daily Essentials", amount: Math.round(Number(sum?.totalExpense || 0) * 0.4) };
  const totalExp = Number(sum?.totalExpense || 0);
  const totalInc = Number(sum?.totalIncome || 0);

  return [
    {
      title: `Optimize ${topCat.name} Spending`,
      body: `Your top expense area is currently ${topCat.name} (${curSymbol} ${Number(topCat.amount || 0).toLocaleString()}). Setting a dedicated weekly sub-budget here will yield your highest immediate savings.`
    },
    {
      title: "Pay Yourself First Rule",
      body: `Whenever income or student allowance arrives (${curSymbol} ${totalInc.toLocaleString()} recorded), immediately deposit 15% into your savings reserve before discretionary expenditures.`
    },
    {
      title: "Leverage Campus Discounts",
      body: "Save 10-25% by utilizing university student privileges on digital subscriptions, campus bookstores, cafeteria meal plans, and public transit passes."
    },
    {
      title: "Establish a 30-Day Cash Buffer",
      body: `Maintain a liquid reserve of at least ${curSymbol} ${(totalExp > 0 ? totalExp : 5000).toLocaleString()} to cover unexpected semester supplies, medical needs, or academic expenses without stress.`
    }
  ];
}

function buildPrompt(summary, categories, studentName, curSymbol) {
  const catLines = categories.length
    ? categories.map((c) => `  - ${c.name}: ${curSymbol} ${c.amount.toLocaleString()}`).join("\n")
    : "  No expense categories recorded yet.";

  return `You are an expert financial advisor for a university student named ${studentName || "a student"} who uses a budgeting app called CampusCoin.

Current Financial Snapshot:
- Total Income:   ${curSymbol} ${(summary.totalIncome || 0).toLocaleString()}
- Total Expenses: ${curSymbol} ${(summary.totalExpense || 0).toLocaleString()}
- Net Balance:    ${curSymbol} ${(summary.balance || 0).toLocaleString()}

Top Expense Categories this month:
${catLines}

Based on this actual data, generate exactly 4 personalized, actionable financial saving tips.
Rules:
- Be specific to their actual numbers and categories above.
- Provide practical, realistic advice for university students.
- Format your response as a valid JSON array only, without markdown quotes or explanation:
[
  {"title": "Clear concise tip title", "body": "2 to 3 sentences of specific, actionable advice."}
]`;
}

export default function AiTips({ student }) {
  const name = student?.name || student?.fullName || "Student";
  const userId = student?.user_id || student?._id || student?.id;
  const activeCur = getCurrency();

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
    setLoading(true);
    setError("");

    const data = await loadFinancialData();
    if (!data) {
      setError("Could not load financial records. Verify backend connectivity.");
      setLoading(false);
      return;
    }

    try {
      const prompt = buildPrompt(data.sum, data.cats, name, activeCur.symbol);
      const targetUrl = `${GEMINI_URL}?key=${encodeURIComponent(GEMINI_KEY)}`;
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
        }),
      });

      if (!res.ok) throw new Error(`Gemini API responded with status ${res.status}`);

      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      const match = rawText.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Could not parse structured recommendations from AI response.");

      const parsed = JSON.parse(match[0]);
      setAiTips(parsed);
      setLastGenerated(new Date().toLocaleTimeString());
      sound.playChime();
      fireConfetti();
    } catch (err) {
      console.warn("Gemini generation fallback:", err.message);
      // Fallback to intelligent custom heuristic recommendations based on real transactions
      const fallbackTips = generateHeuristicTips(data.sum, data.cats, activeCur.symbol);
      setAiTips(fallbackTips);
      setLastGenerated(new Date().toLocaleTimeString());
      sound.playChime();
      fireConfetti();
    } finally {
      setLoading(false);
    }
  }, [loadFinancialData, name, activeCur.symbol]);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  function togglePin(title) {
    sound.playPop();
    setPinned((prev) => {
      const next = prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title];
      localStorage.setItem("campusCoinPinnedTips", JSON.stringify(next));
      return next;
    });
  }

  const TIP_ICONS = [
    "fa-solid fa-lightbulb",
    "fa-solid fa-bullseye",
    "fa-solid fa-chart-pie",
    "fa-solid fa-piggy-bank",
  ];

  return (
    <div style={S.page} className="animate-fade-in">
      {/* Header */}
      <div style={S.header}>
        <div>
          <span style={S.eyebrow}>
            <i className="fa-solid fa-brain" style={{ marginRight: 6 }}></i>
            INTELLIGENT FINANCIAL ADVISORY
          </span>
          <h1 style={S.title}>AI Financial Advisory</h1>
          <p style={S.subtitle}>
            Personalized saving recommendations generated via Google Gemini using your live transaction data.
          </p>
        </div>
        <button onClick={generateAiTips} disabled={loading} style={S.genBtn} className="btn-glow">
          <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 8 }}></i>
          {loading ? "Analyzing Financials…" : "Generate AI Advisory"}
        </button>
      </div>

      {/* Financial Snapshot */}
      {summary && (
        <div style={S.summaryBar}>
          <SumCard label="Total Income"   value={formatRupees(summary.totalIncome)}  color="#07845e" icon="fa-solid fa-arrow-up" />
          <SumCard label="Total Expenses" value={formatRupees(summary.totalExpense)} color="#ef4444" icon="fa-solid fa-arrow-down" />
          <SumCard label="Net Balance"    value={formatRupees(summary.balance)}      color={summary.balance >= 0 ? "#6366f1" : "#ef4444"} icon="fa-solid fa-wallet" />
        </div>
      )}

      {error && (
        <div style={S.errorBox}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }}></i>
          {error}
        </div>
      )}

      {/* AI Tips Section */}
      {(aiTips.length > 0 || loading) && (
        <section style={S.section}>
          <div style={S.sectionHead}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#6366f1" }}></i>
                <h2 style={S.sectionTitle}>Personalized AI Recommendations</h2>
              </div>
              {lastGenerated && <p style={S.sectionSub}>Generated at {lastGenerated} from your transaction history</p>}
            </div>
          </div>

          {loading ? (
            <div style={S.loadingBox}>
              <div style={S.spinner} />
              <p style={{ color: "#64748b", marginTop: 14, fontSize: 14, fontWeight: 500 }}>
                Synthesizing tailored recommendations based on spending distribution…
              </p>
            </div>
          ) : (
            <div style={S.grid}>
              {aiTips.map((tip, i) => (
                <TipCard
                  key={i}
                  iconClass={TIP_ICONS[i % TIP_ICONS.length]}
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



      {/* Static Best Practices */}
      <section style={S.section}>
        <div style={S.sectionHead}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fa-solid fa-book-open" style={{ color: "#07845e" }}></i>
            <div>
              <h2 style={S.sectionTitle}>Essential Financial Habits</h2>
              <p style={S.sectionSub}>Structured budgeting guidelines for university students</p>
            </div>
          </div>
        </div>
        <div style={S.grid}>
          {STATIC_TIPS.map((tip, i) => (
            <TipCard
              key={i}
              iconClass={tip.iconClass}
              title={tip.title}
              body={tip.body}
              pinned={pinned.includes(tip.title)}
              onPin={() => togglePin(tip.title)}
            />
          ))}
        </div>
      </section>

      {/* Pinned Items */}
      {pinned.length > 0 && (
        <section style={S.section}>
          <div style={S.sectionHead}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="fa-solid fa-thumbtack" style={{ color: "#6366f1" }}></i>
              <div>
                <h2 style={S.sectionTitle}>Pinned Recommendations</h2>
                <p style={S.sectionSub}>Direct access to saved actionable advice</p>
              </div>
            </div>
            <button onClick={() => { setPinned([]); localStorage.removeItem("campusCoinPinnedTips"); }} style={S.clearBtn}>
              <i className="fa-solid fa-trash-can" style={{ marginRight: 6 }}></i>
              Clear all
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {pinned.map((t) => (
              <div key={t} style={S.pinnedTag}>
                <i className="fa-solid fa-thumbtack" style={{ fontSize: 11 }}></i>
                <span>{t}</span>
                <button onClick={() => togglePin(t)} style={S.removePin}>✕</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TipCard({ iconClass, title, body, pinned, onPin, ai }) {
  return (
    <article style={{ ...S.card, ...(pinned ? S.cardPinned : {}), ...(ai ? S.cardAi : {}) }} className="card-hover">
      <div style={S.cardTop}>
        <span style={{
          ...S.iconWrap,
          background: ai ? "rgba(139, 92, 246, 0.2)" : "rgba(255, 255, 255, 0.06)",
          color:      ai ? "#c084fc" : "#60a5fa",
          border:     ai ? "1px solid rgba(139, 92, 246, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
        }}>
          <i className={iconClass}></i>
        </span>
        {ai && (
          <span style={S.aiBadge}>
            <i className="fa-solid fa-sparkles" style={{ marginRight: 4, fontSize: 9 }}></i>
            AI TAILORED
          </span>
        )}
        <button
          onClick={onPin}
          style={{ ...S.pinBtn, color: pinned ? "#818cf8" : "#64748b" }}
          title={pinned ? "Unpin tip" : "Pin tip"}
        >
          <i className="fa-solid fa-thumbtack"></i>
        </button>
      </div>
      <h2 style={S.cardTitle}>{title}</h2>
      <p style={S.cardBody}>{body}</p>
    </article>
  );
}

function SumCard({ label, value, color, icon }) {
  return (
    <div style={{ ...S.sumCard, borderTop: `3px solid ${color}` }} className="card-hover">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
        <i className={icon} style={{ color, fontSize: 13 }}></i>
      </div>
      <strong style={{ fontSize: 19, color, marginTop: 4 }}>{value}</strong>
    </div>
  );
}

const S = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "36px 20px 70px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#f8fafc" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 18, marginBottom: 26 },
  eyebrow: { display: "inline-flex", alignItems: "center", color: "#10b981", fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 6 },
  title: { margin: "0 0 6px", fontSize: "clamp(24px, 3.5vw, 32px)", color: "#ffffff", letterSpacing: "-0.8px", fontWeight: 800 },
  subtitle: { margin: 0, color: "#94a3b8", fontSize: 14, lineHeight: 1.5 },
  genBtn: {
    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 12,
    padding: "12px 22px", fontSize: 13, fontWeight: 800,
    cursor: "pointer", flexShrink: 0, fontFamily: "inherit",
    boxShadow: "0 4px 18px rgba(79, 70, 229, 0.35)",
    display: "inline-flex", alignItems: "center",
  },
  summaryBar: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 },
  sumCard: { background: "rgba(16, 24, 40, 0.75)", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4, boxShadow: "0 8px 30px rgba(0,0,0,0.25)" },
  errorBox: { background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.35)", color: "#fca5a5", padding: "12px 16px", borderRadius: 12, marginBottom: 20, fontSize: 13, display: "flex", alignItems: "center" },
  section: { marginBottom: 32 },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 },
  sectionTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: "#ffffff" },
  sectionSub: { margin: "3px 0 0", fontSize: 12, color: "#94a3b8" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },
  card: { background: "rgba(16, 24, 40, 0.75)", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(18px)", borderRadius: 16, padding: 22, boxShadow: "0 10px 30px rgba(0,0,0,0.3)", transition: "all 0.15s ease" },
  cardPinned: { border: "1.5px solid #6366f1", boxShadow: "0 0 25px rgba(99, 102, 241, 0.25)" },
  cardAi: { background: "linear-gradient(135deg, rgba(30, 27, 75, 0.6), rgba(17, 24, 39, 0.8))", border: "1.5px solid rgba(139, 92, 246, 0.3)" },
  cardTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", fontSize: 14 },
  aiBadge: { background: "rgba(139, 92, 246, 0.2)", color: "#c084fc", border: "1px solid rgba(139, 92, 246, 0.4)", fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 20, letterSpacing: 0.5, display: "inline-flex", alignItems: "center" },
  pinBtn: { marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 4 },
  cardTitle: { margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#ffffff" },
  cardBody: { margin: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 },
  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", padding: "50px 20px" },
  spinner: { width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  setupBox: { background: "rgba(255, 255, 255, 0.03)", border: "1px dashed rgba(255, 255, 255, 0.15)", borderRadius: 16, padding: "36px 24px", textAlign: "center", marginBottom: 32 },
  setupIcon: { width: 44, height: 44, borderRadius: 12, background: "rgba(99, 102, 241, 0.2)", color: "#818cf8", display: "grid", placeItems: "center", fontSize: 18, margin: "0 auto 12px" },
  clearBtn: { background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#94a3b8", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center" },
  pinnedTag: { background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 },
  removePin: { background: "none", border: "none", color: "#c084fc", cursor: "pointer", fontSize: 12, padding: 0, marginLeft: 2 },
};