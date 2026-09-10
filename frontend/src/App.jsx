import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const EXAMPLE_QUESTIONS = [
  "What pathways are enriched in Parkinson's disease?",
  "Which genes are linked to Alzheimer's variants?",
  "What drugs target dopamine pathways?",
  "Which brain regions are affected by SNCA variants?",
];

const INTENT_COLORS = {
  disease: { bg: "#1a3a2a", text: "#4ade80", label: "Disease" },
  gene: { bg: "#1a2a3a", text: "#60a5fa", label: "Gene" },
  drug: { bg: "#2a1a3a", text: "#c084fc", label: "Drug" },
};

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#4ade80",
          animation: "pulse 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

function ResultTable({ columns, rows }) {
  if (!columns?.length || !rows?.length) return null;
  return (
    <div style={{ overflowX: "auto", marginTop: 14, borderRadius: 8, border: "1px solid #1e3a28" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#0d1f15" }}>
            {columns.map((col) => (
              <th key={col} style={{ padding: "8px 12px", textAlign: "left", color: "#4ade80", fontFamily: "monospace", fontWeight: 600, borderBottom: "1px solid #1e3a28", whiteSpace: "nowrap" }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "#0a1a10" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "7px 12px", color: "#a7f3c0", fontSize: 12, fontFamily: "monospace", borderBottom: "1px solid #0f2a1a", whiteSpace: "nowrap" }}>
                  {cell ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SQLBlock({ sql }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        background: "none", border: "1px solid #1e3a28", borderRadius: 6,
        color: "#6b8f78", fontSize: 11, cursor: "pointer", padding: "4px 10px",
        fontFamily: "monospace", transition: "all 0.2s"
      }}>
        {open ? "▲ hide SQL" : "▼ show SQL"}
      </button>
      {open && (
        <pre style={{
          marginTop: 8, padding: "12px 14px", background: "#060f09",
          borderRadius: 8, border: "1px solid #1e3a28", color: "#86efac",
          fontSize: 12, overflowX: "auto", fontFamily: "monospace", lineHeight: 1.6
        }}>
          {sql}
        </pre>
      )}
    </div>
  );
}

function Message({ msg }) {
  const intentStyle = INTENT_COLORS[msg.intent] || INTENT_COLORS.disease;
  const isUser = msg.role === "user";

  return (
    <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
      {isUser ? (
        <div style={{
          maxWidth: "72%", background: "#0f2a1a", border: "1px solid #1e3a28",
          borderRadius: "18px 18px 4px 18px", padding: "12px 18px",
          color: "#d1fae5", fontSize: 15, lineHeight: 1.6,
        }}>
          {msg.content}
        </div>
      ) : (
        <div style={{ maxWidth: "90%", width: "100%" }}>
          {msg.loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#4ade80", fontSize: 13 }}>
              <TypingDots />
              <span style={{ fontFamily: "monospace" }}>Reasoning…</span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, #166534, #14532d)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, border: "1px solid #4ade80"
                }}>🧬</div>
                <span style={{ color: "#4ade80", fontFamily: "monospace", fontSize: 12 }}>HealthSANG</span>
                {msg.intent && (
                  <span style={{
                    padding: "2px 8px", borderRadius: 20, fontSize: 10,
                    background: intentStyle.bg, color: intentStyle.text,
                    fontFamily: "monospace", border: `1px solid ${intentStyle.text}40`
                  }}>
                    {intentStyle.label} reasoning
                  </span>
                )}
                {msg.row_count !== undefined && (
                  <span style={{ color: "#6b8f78", fontSize: 11, fontFamily: "monospace" }}>
                    {msg.row_count} rows
                  </span>
                )}
              </div>
              <div style={{
                background: "#080f0b", border: "1px solid #1a3020",
                borderRadius: "4px 18px 18px 18px", padding: "16px 20px",
              }}>
                <p style={{ color: "#d1fae5", fontSize: 14, lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </p>
                {msg.error && (
                  <p style={{ color: "#f87171", fontSize: 13, marginTop: 10, fontFamily: "monospace" }}>
                    ⚠ {msg.error}
                  </p>
                )}
                {msg.sql && <SQLBlock sql={msg.sql} />}
                {msg.columns && msg.rows && (
                  <ResultTable columns={msg.columns} rows={msg.rows} />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: q },
      { role: "assistant", loading: true, content: "" },
    ]);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "API error");

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: data.answer,
          sql: data.sql,
          columns: data.columns,
          rows: data.rows,
          intent: data.intent,
          row_count: data.row_count,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Something went wrong.", error: err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #030a05; font-family: 'Georgia', serif; color: #d1fae5; }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #030a05; }
        ::-webkit-scrollbar-thumb { background: #1a3a28; border-radius: 3px; }
        textarea:focus { outline: none; }
        textarea { resize: none; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ padding: "24px 0 16px", borderBottom: "1px solid #0f2a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #166534, #064e1b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, border: "1px solid #4ade8040"
            }}>🧬</div>
            <div>
              <h1 style={{ fontSize: 20, color: "#4ade80", fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>
                HealthSANG
              </h1>
              <p style={{ fontSize: 11, color: "#6b8f78", fontFamily: "monospace" }}>
                Mechanistic Genomic Explorer · SQLite · Claude
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
          {messages.length === 0 && (
            <div style={{ animation: "fadeIn 0.5s ease" }}>
              <p style={{ color: "#6b8f78", fontSize: 14, marginBottom: 24, fontFamily: "monospace" }}>
                Ask anything about diseases, genes, pathways, and drugs in the HealthSANG database.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} style={{
                    background: "#080f0b", border: "1px solid #1a3020",
                    borderRadius: 10, padding: "12px 14px", textAlign: "left",
                    color: "#a7f3c0", fontSize: 13, cursor: "pointer", lineHeight: 1.4,
                    transition: "all 0.2s", fontFamily: "Georgia, serif"
                  }}
                  onMouseEnter={e => e.target.style.borderColor = "#4ade80"}
                  onMouseLeave={e => e.target.style.borderColor = "#1a3020"}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "16px 0 24px", borderTop: "1px solid #0f2a1a", flexShrink: 0 }}>
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-end",
            background: "#080f0b", border: "1px solid #1a3020",
            borderRadius: 14, padding: "10px 12px",
            focusWithin: { borderColor: "#4ade80" }
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about a disease, gene, pathway, or drug…"
              rows={1}
              style={{
                flex: 1, background: "none", border: "none",
                color: "#d1fae5", fontSize: 14, fontFamily: "Georgia, serif",
                lineHeight: 1.6, maxHeight: 120, overflowY: "auto",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: 9, border: "none",
                background: loading || !input.trim() ? "#1a3020" : "#166534",
                color: loading || !input.trim() ? "#4a6a54" : "#4ade80",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", flexShrink: 0
              }}
            >
              ↑
            </button>
          </div>
          <p style={{ color: "#3a5a48", fontSize: 11, marginTop: 8, textAlign: "center", fontFamily: "monospace" }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
