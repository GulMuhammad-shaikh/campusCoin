import React, { useState, useEffect, useRef } from "react";
import { getCurrency, formatRupees } from "../utils/transactions";
import { transactionAPI } from "../utils/api";
import sound from "../utils/audio";
import { useTheme } from "../context/ThemeContext";

const DEFAULT_GEMINI_B64 = "QVEuQWI4Uk42SkFaLTNFNnJJclpEd2JIa1ZkYVpQV1RhNnhmeTBpSXlxc1BVZkpBMW5hcGc=";
const GEMINI_KEY = (
  import.meta.env.VITE_GEMINI_KEY ||
  (typeof atob === "function" ? atob(DEFAULT_GEMINI_B64) : "")
).trim();

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    text: "Hi there! 👋 I'm your **CampusCoin AI Assistant**. Ask me anything about how the website works, your current balance, savings goals, or tips to budget smarter!",
  },
];

const SUGGESTIONS = [
  "💳 What is my live balance?",
  "🏆 How does the health score work?",
  "🎯 How do I set a savings target?",
  "💱 How do I switch currency?",
  "📊 Where are my analytics charts?",
  "➕ How do I add or delete transactions?",
];

export default function AiChatbot({ student }) {
  const { isDark } = useTheme();
  const styles = getStyles(isDark);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [financialSnapshot, setFinancialSnapshot] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeCur = getCurrency();
  const studentName = student?.name || student?.fullName || "Student";
  const userId = student?.user_id || student?._id || student?.id;

  // Load student financial snapshot for personalized contextual answers
  useEffect(() => {
    async function fetchContext() {
      if (!userId) return;
      try {
        const isValidId = /^[0-9a-fA-F]{24}$/.test(String(userId));
        const res = await transactionAPI.getSummary(isValidId ? userId : null);
        if (res?.summary) {
          setFinancialSnapshot(res.summary);
        }
      } catch {
        // Fallback silently if offline
      }
    }
    fetchContext();

    const onDataChanged = () => fetchContext();
    window.addEventListener("campusCoinDataChanged", onDataChanged);
    return () => window.removeEventListener("campusCoinDataChanged", onDataChanged);
  }, [userId]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  function toggleChat() {
    sound.playPop();
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }

  function handleClear() {
    sound.playPop();
    setMessages(INITIAL_MESSAGES);
  }

  // Fallback intelligent local knowledge base if Gemini API is unreachable
  function getLocalFallbackAnswer(question) {
    const q = question.toLowerCase();

    const balStr = financialSnapshot
      ? `${activeCur.symbol} ${(financialSnapshot.balance || 0).toLocaleString()}`
      : "visible on your Dashboard";
    const incStr = financialSnapshot
      ? `${activeCur.symbol} ${(financialSnapshot.totalIncome || 0).toLocaleString()}`
      : "recorded in Income";
    const expStr = financialSnapshot
      ? `${activeCur.symbol} ${(financialSnapshot.totalExpense || 0).toLocaleString()}`
      : "recorded in Expenses";

    if (q.includes("balance") || q.includes("money") || q.includes("kitna") || q.includes("paisa")) {
      return `💳 **Your Financial Overview:**\n- **Available Balance:** ${balStr}\n- **Total Income:** ${incStr}\n- **Total Expenses:** ${expStr}\n\nYou can also click your **3D Holographic Card** on the Dashboard for a live balance celebration!`;
    }

    if (q.includes("health") || q.includes("score") || q.includes("streak") || q.includes("rank")) {
      return `🏆 **Financial Health Score & Streaks:**\n- Your health score evaluates your savings rate, income vs expense ratio, and consistent daily logging.\n- Scores range from 0 to 100 with ranks: **Budget Apprentice 🎯**, **Smart Saver 💡**, **Savvy Scholar 🚀**, and **Campus Baller 👑**.\n- Maintain an active 7-day logging streak to boost your score!`;
    }

    if (q.includes("saving") || q.includes("goal") || q.includes("target")) {
      return `🎯 **How to Set Savings Goals:**\n1. Navigate to the **Savings** page from the top navigation bar.\n2. In the **Monthly Savings Goal** card, enter your target amount (e.g. 5,000).\n3. Click **Set Target** or **Update Target**.\n4. Your progress bar and 6-month accumulation graph update in real-time!`;
    }

    if (q.includes("currency") || q.includes("symbol") || q.includes("rupee") || q.includes("dollar")) {
      return `💱 **How to Change Currency:**\n1. Click your name or avatar in the top right to open **Profile & Settings**.\n2. Under **Select Display Currency**, choose from 20+ world currencies (RS, $, €, £, AED, INR, CAD, etc.).\n3. Click **Save Changes** — your entire app, cards, charts, and tables update instantly!`;
    }

    if (q.includes("delete") || q.includes("remove") || q.includes("edit") || q.includes("update") || q.includes("transaction")) {
      return `➕ **Managing Transactions:**\n- **Add:** Click **+ Add Income** or **- Add Spend** from the Dashboard or navigation bar.\n- **Edit / Update:** Click the blue pencil icon next to any transaction on the Dashboard or All Transactions page.\n- **Delete:** Click the red trash bin icon next to any transaction to delete it immediately.\n- **Description is optional**; only valid amount and category are required.`;
    }

    if (q.includes("analytic") || q.includes("chart") || q.includes("graph") || q.includes("donut")) {
      return `📊 **Analytics & Charts:**\n- Visit the **Analytics** page to view:\n  1. **6-Month Cashflow Trajectory** bar chart.\n  2. **Category Donut Breakdown** for income vs expenses.\n  3. **Spending Velocity KPI Metrics** showing your biggest single expense and average spend per transaction.`;
    }

    if (q.includes("tip") || q.includes("advice") || q.includes("ai")) {
      return `💡 **AI Financial Tips:**\n- Go to the **Tips** page in the top menu.\n- Click **Generate Tailored Tips** to have our AI analyze your actual expense categories and formulate 4 actionable student budgeting rules.\n- You can **Pin 📌** your favorite tips for fast reference!`;
    }

    return `CampusCoin is your all-in-one student financial companion! You can:\n- Log **Income & Expenses** with optional descriptions.\n- Manage **Categories** for campus food, books, transport, etc.\n- View your **3D Holographic Student Card** & **Gamified Health Score**.\n- Track **Monthly Savings Goals**.\n- Switch between **20+ Currencies** in Profile settings.\n\nWhat specific part of CampusCoin can I help you with?`;
  }

  async function handleSend(e) {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || isTyping) return;

    sound.playPop();

    const userMsg = { role: "user", text: query };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    // Build context-aware prompt for Gemini
    const systemPrompt = `You are "CampusCoin AI Assistant", an enthusiastic, friendly, and expert financial chatbot embedded inside the "CampusCoin" student budgeting web application.

Current Student Profile:
- Name: ${studentName}
- Active Currency: ${activeCur.name} (${activeCur.code}, symbol: "${activeCur.symbol}")
- Logged-in: ${Boolean(userId)}
${
  financialSnapshot
    ? `- Financial Snapshot: Balance: ${activeCur.symbol} ${(financialSnapshot.balance || 0).toLocaleString()}, Monthly Income: ${activeCur.symbol} ${(financialSnapshot.totalIncome || 0).toLocaleString()}, Monthly Expenses: ${activeCur.symbol} ${(financialSnapshot.totalExpense || 0).toLocaleString()}`
    : "- Financial Snapshot: User is navigating the platform"
}

Comprehensive Knowledge About CampusCoin Website:
1. **Dashboard:**
   - 3D Holographic Student Debit Card with interactive sheen, EMV chip, contactless icon, and live balance. Clicking card fires celebratory confetti.
   - Gamified Financial Health Score (0-100) with ranks (Budget Apprentice 🎯, Smart Saver 💡, Savvy Scholar 🚀, Campus Baller 👑) and 7-day streak tracker.
   - Quick launcher speed bar (+ Add Income, - Add Spend, Categories, Celebrate, Refresh).
   - 4 KPI metric cards (Available Balance, Total Income, Total Expenses, Monthly Net).
   - Recent transactions table with inline update (pencil) and delete (trash bin) actions.
   - Category spending donut distribution.
2. **Transactions Page (/transactions):**
   - Full history table with filters by type (All, Income, Expense), dynamic category selector, date selector (Current month, Previous month, Custom Date Range), and search input.
3. **Savings Page (/savings):**
   - Monthly savings target setting and progress bar with milestone celebration banners.
   - 6-month historical net accumulation graph.
   - Core student financial discipline tips.
4. **Analytics Page (/analytics):**
   - 6-Month Income vs Expense cashflow trajectory bar chart.
   - Category donut charts for both income and expenses.
   - Spending velocity metrics (top single transaction, average transaction size, financial health rating).
5. **AI Tips Page (/tips):**
   - Real-time Gemini AI customized financial recommendations analyzing user's actual top spending categories.
   - Pinning and unpinning system for actionable advice.
6. **Profile Page (/profile):**
   - Edit student full name, academic year (1st Year, 2nd Year, etc.), monthly savings goal.
   - Currency switcher supporting 20+ world currencies (RS, USD, EUR, GBP, AED, INR, CAD, AUD, etc.) that updates the whole website instantly.
7. **Rules:**
   - Description on transactions is strictly optional; note field has been removed to keep it clean.
   - Respond concisely in friendly, professional markdown with emojis and bullet points where helpful.
   - Answer the user's question directly about their money or the website features.`;

    try {
      const historyContext = nextMessages
        .slice(-6)
        .map((m) => `${m.role === "user" ? "Student" : "Assistant"}: ${m.text}`)
        .join("\n\n");

      const prompt = `${systemPrompt}\n\nRecent Conversation:\n${historyContext}\n\nStudent: ${query}\nAssistant:`;

      const targetUrl = `${GEMINI_URL}?key=${encodeURIComponent(GEMINI_KEY)}`;
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
        }),
      });

      if (!res.ok) throw new Error(`Gemini responded with status ${res.status}`);

      const data = await res.json();
      const botResponse =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        getLocalFallbackAnswer(query);

      setMessages((prev) => [...prev, { role: "assistant", text: botResponse }]);
      sound.playChime();
    } catch {
      // Fallback to local intelligent knowledge engine
      const localAnswer = getLocalFallbackAnswer(query);
      setMessages((prev) => [...prev, { role: "assistant", text: localAnswer }]);
      sound.playChime();
    } finally {
      setIsTyping(false);
    }
  }

  function handleSuggestionClick(sug) {
    const cleanText = sug.replace(/^[^\w\s]+\s*/, "");
    setInput(cleanText);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }

  return (
    <>
      {/* ── Floating Action Trigger Button ── */}
      <button
        onClick={toggleChat}
        style={styles.floatingButton}
        className="btn-glow"
        aria-label="Open CampusCoin AI Assistant"
        title="Open CampusCoin AI Assistant"
      >
        <span style={styles.buttonPulse} />
        {isOpen ? (
          <i className="fa-solid fa-xmark" style={{ fontSize: 20 }}></i>
        ) : (
          <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 20 }}></i>
        )}
        {!isOpen && (
          <span style={styles.floatingBadge}>
            <span style={styles.onlineDot} />
            AI Assistant
          </span>
        )}
      </button>

      {/* ── Chat Window Modal / Panel ── */}
      {isOpen && (
        <aside style={styles.chatPanel} className="chatbot-panel animate-scale-in" aria-label="CampusCoin AI Chat">
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.avatar}>
                <i className="fa-solid fa-robot"></i>
                <span style={styles.avatarStatus} />
              </div>
              <div>
                <h3 style={styles.headerTitle}>CampusCoin AI</h3>
                <span style={styles.headerSub}>Live Financial & Website Guide</span>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button
                onClick={handleClear}
                style={styles.headerIconBtn}
                title="Reset conversation"
              >
                <i className="fa-solid fa-arrows-rotate"></i>
              </button>
              <button
                onClick={toggleChat}
                style={styles.headerIconBtn}
                title="Minimize chat"
              >
                <i className="fa-solid fa-chevron-down"></i>
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div style={styles.suggestionsWrap}>
            <div style={styles.suggestionsScroll}>
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  style={styles.suggestionChip}
                  onClick={() => handleSuggestionClick(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Body */}
          <div style={styles.messagesContainer}>
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  style={{
                    ...styles.messageRow,
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  {!isUser && (
                    <div style={styles.botIconMini}>
                      <i className="fa-solid fa-sparkles"></i>
                    </div>
                  )}
                  <div
                    className={isUser ? "chatbot-user-bubble" : "chatbot-bot-bubble"}
                    style={{
                      ...styles.messageBubble,
                      ...(isUser ? styles.userBubble : styles.botBubble),
                    }}
                  >
                    <div style={styles.messageText}>
                      {m.text.split("\n").map((line, lineIdx) => (
                        <p key={lineIdx} style={{ margin: "3px 0", lineHeight: 1.55 }}>
                          {formatMarkdownLine(line, isDark, isUser)}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
                <div style={styles.botIconMini}>
                  <i className="fa-solid fa-sparkles"></i>
                </div>
                <div style={{ ...styles.messageBubble, ...styles.botBubble, padding: "12px 18px" }}>
                  <div style={styles.typingIndicator}>
                    <span style={{ ...styles.typingDot, animationDelay: "0ms" }} />
                    <span style={{ ...styles.typingDot, animationDelay: "180ms" }} />
                    <span style={{ ...styles.typingDot, animationDelay: "360ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} style={styles.inputArea}>
            <input
              ref={inputRef}
              type="text"
              className="chatbot-input"
              style={styles.input}
              placeholder="Ask about website, balance, budget..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              style={{
                ...styles.sendBtn,
                opacity: input.trim() && !isTyping ? 1 : 0.45,
                cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
              }}
              title="Send message"
            >
              <i className="fa-solid fa-arrow-up"></i>
            </button>
          </form>
        </aside>
      )}
    </>
  );
}

// Lightweight inline renderer for bold markdown **text**
function formatMarkdownLine(text, isDark, isUser) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldColor = isUser ? "#ffffff" : (isDark ? "#ffffff" : "#0f172a");
      return (
        <strong key={i} style={{ color: boldColor, fontWeight: 800 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function getStyles(isDark) {
  return {
  floatingButton: {
    position: "fixed",
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #10b981 0%, #6366f1 100%)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4), 0 0 20px rgba(99, 102, 241, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 9999,
    transition: "all 0.25s ease",
  },
  buttonPulse: {
    position: "absolute",
    inset: -3,
    borderRadius: "50%",
    border: "2px solid rgba(16, 185, 129, 0.6)",
    animation: "ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
    pointerEvents: "none",
  },
  floatingBadge: {
    position: "absolute",
    right: 68,
    background: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.96)",
    backdropFilter: "blur(12px)",
    color: isDark ? "#ffffff" : "#0f172a",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.1)",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
    boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(15, 23, 42, 0.12)",
    display: "flex",
    alignItems: "center",
    gap: 6,
    pointerEvents: "none",
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 8px #10b981",
  },
  chatPanel: {
    position: "fixed",
    bottom: 94,
    right: 24,
    width: "min(390px, calc(100vw - 32px))",
    height: "min(560px, calc(100vh - 120px))",
    background: isDark ? "rgba(13, 20, 36, 0.96)" : "#ffffff",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0, 0, 0, 0.12)",
    borderRadius: 20,
    boxShadow: isDark
      ? "0 25px 60px rgba(0, 0, 0, 0.55), 0 0 40px rgba(99, 102, 241, 0.15)"
      : "0 20px 50px rgba(15, 23, 42, 0.16), 0 0 30px rgba(16, 185, 129, 0.08)",
    display: "flex",
    flexDirection: "column",
    zIndex: 9998,
    overflow: "hidden",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  header: {
    padding: "14px 18px",
    background: isDark ? "rgba(255, 255, 255, 0.04)" : "#f8fafc",
    borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #10b981, #6366f1)",
    color: "#ffffff",
    display: "grid",
    placeItems: "center",
    fontSize: 15,
  },
  avatarStatus: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "#10b981",
    border: isDark ? "2px solid #0d1424" : "2px solid #ffffff",
  },
  headerTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    color: isDark ? "#ffffff" : "#0f172a",
    letterSpacing: "-0.2px",
  },
  headerSub: {
    fontSize: 11,
    color: isDark ? "#94a3b8" : "#64748b",
  },
  headerActions: {
    display: "flex",
    gap: 4,
  },
  headerIconBtn: {
    background: isDark ? "none" : "rgba(0, 0, 0, 0.04)",
    border: "none",
    color: isDark ? "#94a3b8" : "#64748b",
    width: 30,
    height: 30,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    fontSize: 13,
    transition: "all 0.15s ease",
  },
  suggestionsWrap: {
    padding: "8px 12px",
    background: isDark ? "rgba(0, 0, 0, 0.2)" : "#f1f5f9",
    borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid #e2e8f0",
    overflowX: "auto",
  },
  suggestionsScroll: {
    display: "flex",
    gap: 6,
    whiteSpace: "nowrap",
  },
  suggestionChip: {
    background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #cbd5e1",
    color: isDark ? "#cbd5e1" : "#1e293b",
    borderRadius: 14,
    padding: "5px 11px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
    boxShadow: isDark ? "none" : "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  messagesContainer: {
    flex: 1,
    padding: "16px 14px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: isDark ? "transparent" : "#f8fafc",
  },
  messageRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
  },
  botIconMini: {
    width: 24,
    height: 24,
    borderRadius: 6,
    background: isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(16, 185, 129, 0.15)",
    color: isDark ? "#818cf8" : "#059669",
    display: "grid",
    placeItems: "center",
    fontSize: 10,
    flexShrink: 0,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: "82%",
    padding: "10px 14px",
    borderRadius: 14,
    fontSize: 13,
    wordBreak: "break-word",
  },
  userBubble: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    borderTopRightRadius: 4,
    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
  },
  botBubble: {
    background: isDark ? "rgba(255, 255, 255, 0.06)" : "#ffffff",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.09)" : "1px solid #e2e8f0",
    color: isDark ? "#e2e8f0" : "#0f172a",
    borderTopLeftRadius: 4,
    boxShadow: isDark ? "none" : "0 2px 8px rgba(15, 23, 42, 0.05)",
  },
  messageText: {
    fontSize: 13,
    color: isDark ? "#e2e8f0" : "#0f172a",
  },
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    height: 14,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: isDark ? "#a5b4fc" : "#10b981",
    display: "inline-block",
    animation: "typingPulse 1.2s infinite ease-in-out",
  },
  inputArea: {
    padding: "12px 14px",
    background: isDark ? "rgba(255, 255, 255, 0.04)" : "#ffffff",
    borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    background: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "11px 14px",
    color: isDark ? "#ffffff" : "#0f172a",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#ffffff",
    border: "none",
    display: "grid",
    placeItems: "center",
    fontSize: 13,
    transition: "all 0.15s ease",
  },
  };
}