import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useRef,
} from "react";
import {
  Button,
  message,
  Select,
  Input,
  Avatar,
  Drawer,
  DatePicker,
  Tag,
  Skeleton,
  Badge,
  Modal,
  Spin,
  Tooltip,
} from "antd";
const { TextArea } = Input;
import {
  Plus,
  Search,
  User,
  Folder,
  X,
  Archive,
  Trash2,
  LayoutGrid,
  List,
  GanttChart,
  ChevronLeft,
  ChevronRight,
  Users,
  Eye,
  MoreHorizontal,
  ArrowUpRight,
  Sparkles,
  Brain,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";
import debounce from "lodash.debounce";
import CountrySelect from "../components/CountrySelect";
import IconPicker from "../components/IconPicker";
import * as flags from "country-flag-icons/react/3x2";

/* ── ENV ─────────────────────────────────────────────────────────────────── */
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

/* ── Groq helper ─────────────────────────────────────────────────────────── */
const groq = async (systemPrompt, userContent) => {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.25,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error("Groq failed");
  const data = await res.json();
  return data.choices[0].message.content.trim();
};

/* ── Email helper ────────────────────────────────────────────────────────── */
const sendEmail = async ({ to, subject, body, companyName }) => {
  try {
    const res = await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html: body, companyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Email failed:", data);
      return { success: false, error: data };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Email error:", err);
    return { success: false, error: err.message };
  }
};

/* ── Fonts ──────────────────────────────────────────────────────────────── */
if (!document.getElementById("proj-fonts")) {
  const l = document.createElement("link");
  l.id = "proj-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
}

/* ── CSS ────────────────────────────────────────────────────────────────── */
if (!document.getElementById("proj-css")) {
  const s = document.createElement("style");
  s.id = "proj-css";
  s.textContent = `
    @keyframes pFadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pPulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    @keyframes pSpin { to{transform:rotate(360deg)} }
    @keyframes pGlow { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0)} 50%{box-shadow:0 0 0 6px rgba(139,92,246,0.15)} }
    .p-fade { animation: pFadeUp 0.35s ease both; }
    .p-tr:hover { background: var(--p-hover) !important; }
    .p-tr { transition: background 0.12s; }
    .p-kan:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important; transform: translateY(-1px); }
    .p-kan { transition: box-shadow 0.18s, transform 0.18s; }
    .p-seg-item { transition: background 0.15s, color 0.15s; }
    .p-btn-ghost:hover { background: var(--p-hover) !important; }
    .p-btn-ghost { transition: background 0.15s; }
    .p-gantt-bar:hover { filter: brightness(1.1); }
    .p-gantt-bar { transition: filter 0.15s; }
    .p-row-gantt:hover { background: var(--p-hover) !important; }
    .p-ai-card { transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s; }
    .p-ai-card:hover { box-shadow: 0 4px 20px rgba(139,92,246,0.15) !important; transform: translateY(-1px); border-color: rgba(139,92,246,0.4) !important; }
    .p-ai-card.selected { border-color: #8b5cf6 !important; background: rgba(139,92,246,0.06) !important; }
    .p-spin { animation: pSpin 0.8s linear infinite; }
    .p-ai-glow { animation: pGlow 2s ease-in-out infinite; }
    .p-upload-zone { transition: border-color 0.15s, background 0.15s; }
    .p-upload-zone:hover { border-color: #8b5cf6 !important; background: rgba(139,92,246,0.04) !important; }
  `;
  document.head.appendChild(s);
}

/* ── Theme context ───────────────────────────────────────────────────────── */
const ThemeCtx = createContext();
const useTheme = () => useContext(ThemeCtx);

/* ── Status config ───────────────────────────────────────────────────────── */
const ST = {
  not_started: {
    label: "Not Started",
    color: "#64748b",
    bg: { l: "#f1f5f9", d: "#1e293b" },
  },
  planning: {
    label: "Planning",
    color: "#8b5cf6",
    bg: { l: "#f5f3ff", d: "#2e1065" },
  },
  in_progress: {
    label: "In Progress",
    color: "#1e40af",
    bg: { l: "#dbeafe", d: "#1e3a5f" },
  },
  testing: {
    label: "Testing",
    color: "#0891b2",
    bg: { l: "#ecfeff", d: "#0c4a6e" },
  },
  revision: {
    label: "Revision",
    color: "#d97706",
    bg: { l: "#fffbeb", d: "#451a03" },
  },
  completed: {
    label: "Completed",
    color: "#16a34a",
    bg: { l: "#dcfce7", d: "#052e16" },
  },
  on_hold: {
    label: "On Hold",
    color: "#dc2626",
    bg: { l: "#fef2f2", d: "#3b0a0a" },
  },
};

const StatusChip = ({ status, isDark, sm }) => {
  const s = ST[status] || ST.not_started;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: sm ? 10 : 11,
        fontWeight: 700,
        padding: sm ? "2px 7px" : "3px 9px",
        borderRadius: 99,
        background: isDark ? s.bg.d : s.bg.l,
        color: s.color,
        whiteSpace: "nowrap",
        fontFamily: "'DM Sans',sans-serif",
        letterSpacing: "0.02em",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: s.color,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
};

/* ── Flag renderer ───────────────────────────────────────────────────────── */
const FlagIcon = ({ value, size = 20 }) => {
  if (!value) return null;
  if (value.startsWith("FLAG:")) {
    const code = value.replace("FLAG:", "");
    const F = flags[code];
    return F ? (
      <F style={{ width: size, height: Math.round(size * 0.75) }} />
    ) : null;
  }
  return <span style={{ fontSize: size }}>{value}</span>;
};

/* ── Tiny avatar stack ───────────────────────────────────────────────────── */
const AvaStack = ({ people = [], max = 3 }) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    {people.slice(0, max).map((p, i) => (
      <div
        key={p?.id || i}
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "2px solid var(--p-card)",
          marginLeft: i === 0 ? 0 : -6,
          overflow: "hidden",
          background: "#e2e8f0",
          flexShrink: 0,
        }}
      >
        {p?.user_photo ? (
          <img
            src={p.user_photo}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {p?.full_name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
      </div>
    ))}
    {people.length > max && (
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "2px solid var(--p-card)",
          marginLeft: -6,
          background: "var(--p-hover)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          fontWeight: 700,
          color: "var(--p-muted)",
        }}
      >
        +{people.length - max}
      </div>
    )}
  </div>
);

/* ── AI Suggest Panel ────────────────────────────────────────────────────── */
const AISuggestPanel = ({
  employees,
  allProjects,
  projectName,
  projectRequirements,
  isDark,
  onSelect,
  currentAssignees,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ran, setRan] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setRan(true);
    try {
      const empContext = employees.map((emp) => {
        const activeProjects = allProjects.filter(
          (p) =>
            p.assignees?.some((a) => a.id === emp.id) &&
            !["completed", "on_hold"].includes(p.status),
        );
        return {
          id: emp.id,
          name: emp.full_name,
          skills: emp.skills || [],
          department: emp.department || null,
          experience_years: emp.experience_years || 0,
          employment_type: emp.employment_type,
          timezone: emp.timezone,
          working_hours: emp.working_hours,
          activeProjects: activeProjects.map((p) => ({
            name: p.name,
            status: p.status,
            end_date: p.end_date,
          })),
          projectCount: activeProjects.length,
        };
      });

      const systemPrompt = `You are an expert project staffing AI. Your job is to suggest the BEST employees for a project based on strict relevance rules.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "suggestions": [
    {
      "id": "<employee_id>",
      "score": <0-100>,
      "reason": "<1-2 sentence reason>",
      "workload": "<low|medium|high>",
      "role_fit": "<specific role they'd fill e.g. Frontend Developer, Backend Developer, DevOps, Designer>"
    }
  ]
}

STRICT RULES — violating any of these is a failure:

RULE 1 — DOMAIN MATCH (most important):
- Analyse the project type from its name and requirements (web, mobile, data, AI/ML, design, DevOps, QA, etc.)
- Only suggest employees whose skills directly match the project domain
- Web project → suggest HTML/CSS/JS/React/Vue/Angular/Node/PHP/Laravel people ONLY
- Mobile project → suggest iOS/Swift/Android/Kotlin/React Native/Flutter people ONLY  
- Data/AI project → suggest Python/ML/TensorFlow/SQL/Data Science people ONLY
- DevOps project → suggest Docker/Kubernetes/CI-CD/AWS/GCP/Azure people ONLY
- Design project → suggest Figma/UI/UX/Adobe people ONLY
- Backend-only project → do NOT suggest pure frontend devs
- Frontend-only project → do NOT suggest pure backend devs
- If an employee's skills have ZERO overlap with the project domain, their score must be 0 and they must be EXCLUDED

RULE 2 — PROJECT SCALE / TEAM COMPOSITION:
- For large/complex projects (multiple features, long timeline, broad requirements), suggest a BALANCED TEAM covering different roles:
  e.g. for a full-stack web app: 1-2 frontend devs + 1-2 backend devs + 1 QA + 1 DevOps if available
- For small/focused projects, suggest 2-3 specialists in that one area
- Prioritise employees who fill a GAP in the team — don't suggest 4 frontend devs if backend is already covered
- Label each suggestion with their specific role_fit

RULE 3 — AVAILABILITY / WORKLOAD:
- workload: low = 0-1 active projects, medium = 2-3, high = 4+
- Prefer employees with low/medium workload
- If an employee has 4+ active projects, only include them if they are the only viable match for a critical role

RULE 4 — EXPERIENCE:
- Match experience level to project complexity
- Don't suggest a 1-year junior as the sole developer on a complex enterprise project
- Senior employees (5+ years) should be prioritised for architecture/lead roles

Return 3-6 suggestions maximum. Sort by score descending. Be concise in reasons (max 20 words).`;

      const userContent = `Project Name: "${projectName}"
Project Requirements: ${projectRequirements || "No requirements provided — infer from project name"}

Available Employees (only suggest from this list):
${JSON.stringify(empContext, null, 2)}`;

      const raw = await groq(systemPrompt, userContent);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      // Filter out any 0-score results the AI may have included anyway
      const hydrated = (parsed.suggestions || [])
        .filter((s) => s.score > 0)
        .map((s) => ({
          ...s,
          employee: employees.find((e) => e.id === s.id),
        }))
        .filter((s) => s.employee);

      setSuggestions(hydrated);
    } catch (err) {
      console.error("AI suggest error:", err);
      setError("AI suggestion failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const workloadColor = { low: "#16a34a", medium: "#d97706", high: "#dc2626" };
  const workloadBg = {
    low: isDark ? "#052e16" : "#dcfce7",
    medium: isDark ? "#451a03" : "#fffbeb",
    high: isDark ? "#3b0a0a" : "#fef2f2",
  };

  if (!ran) {
    return (
      <div
        style={{
          border: `1px dashed ${isDark ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.25)"}`,
          borderRadius: 12,
          padding: "20px 16px",
          textAlign: "center",
          background: isDark
            ? "rgba(139,92,246,0.04)"
            : "rgba(139,92,246,0.02)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: isDark
              ? "rgba(139,92,246,0.15)"
              : "rgba(139,92,246,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 10px",
          }}
        >
          <Brain size={18} color="#8b5cf6" />
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--p-text)",
            marginBottom: 4,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          AI Employee Matching
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--p-muted)",
            marginBottom: 14,
            fontFamily: "'DM Sans',sans-serif",
            lineHeight: 1.5,
          }}
        >
          Analyses skills, workload & availability to suggest the best fit
          employees
        </div>
        <button
          onClick={run}
          className="p-ai-glow"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 18px",
            borderRadius: 9,
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: "0 2px 10px rgba(109,40,217,0.3)",
          }}
        >
          <Sparkles size={13} /> Suggest Employees
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          border: `1px solid ${isDark ? "rgba(139,92,246,0.2)" : "rgba(139,92,246,0.15)"}`,
          borderRadius: 12,
          padding: "24px 16px",
          textAlign: "center",
          background: isDark
            ? "rgba(139,92,246,0.04)"
            : "rgba(139,92,246,0.02)",
        }}
      >
        <Loader2
          size={24}
          color="#8b5cf6"
          className="p-spin"
          style={{ marginBottom: 10 }}
        />
        <div
          style={{
            fontSize: 13,
            color: "var(--p-muted)",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Analysing team skills &amp; workload…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 12,
          padding: "16px",
          background: isDark ? "rgba(220,38,38,0.06)" : "#fef2f2",
        }}
      >
        <div
          style={{
            fontSize: 12.5,
            color: "#dc2626",
            marginBottom: 10,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {error}
        </div>
        <button
          onClick={run}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#dc2626",
            background: "none",
            border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: 7,
            padding: "5px 12px",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={13} color="#8b5cf6" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#8b5cf6",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            AI Suggestions
          </span>
        </div>
        <button
          onClick={run}
          style={{
            fontSize: 11,
            color: "var(--p-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 600,
          }}
        >
          Refresh
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {suggestions.map((s) => {
          const isSelected = currentAssignees.includes(s.id);
          const activeCount = allProjects.filter(
            (p) =>
              p.assignees?.some((a) => a.id === s.id) &&
              !["completed", "on_hold"].includes(p.status),
          ).length;
          return (
            <div
              key={s.id}
              className={`p-ai-card${isSelected ? " selected" : ""}`}
              style={{
                border: `1px solid ${isSelected ? "#8b5cf6" : "var(--p-border)"}`,
                borderRadius: 10,
                padding: "12px 14px",
                background: isSelected
                  ? isDark
                    ? "rgba(139,92,246,0.08)"
                    : "rgba(139,92,246,0.04)"
                  : "var(--p-card2)",
                cursor: "pointer",
              }}
              onClick={() => onSelect(s.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Avatar */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    overflow: "hidden",
                    background: "#e2e8f0",
                    flexShrink: 0,
                  }}
                >
                  {s.employee.user_photo ? (
                    <img
                      src={s.employee.user_photo}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      alt=""
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {s.employee.full_name?.[0]}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--p-text)",
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      {s.employee.full_name}
                    </span>
                    {/* Score badge */}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background:
                          s.score >= 80
                            ? isDark
                              ? "rgba(22,163,74,0.15)"
                              : "#dcfce7"
                            : s.score >= 60
                              ? isDark
                                ? "rgba(217,119,6,0.15)"
                                : "#fffbeb"
                              : isDark
                                ? "rgba(100,116,139,0.15)"
                                : "#f1f5f9",
                        color:
                          s.score >= 80
                            ? "#16a34a"
                            : s.score >= 60
                              ? "#d97706"
                              : "#64748b",
                        padding: "1px 6px",
                        borderRadius: 99,
                        fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >
                      {s.score}%
                    </span>
                    {/* Workload */}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 99,
                        background: workloadBg[s.workload] || workloadBg.medium,
                        color:
                          workloadColor[s.workload] || workloadColor.medium,
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      {s.workload} load
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--p-muted)",
                      fontFamily: "'DM Sans',sans-serif",
                      lineHeight: 1.4,
                    }}
                  >
                    {s.reason}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginTop: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    {(s.employee.skills || []).slice(0, 3).map((sk) => (
                      <span
                        key={sk}
                        style={{
                          fontSize: 9.5,
                          fontWeight: 600,
                          background: isDark
                            ? "rgba(30,64,175,0.15)"
                            : "#dbeafe",
                          color: isDark ? "#93c5fd" : "#1e40af",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                    <span
                      style={{
                        fontSize: 9.5,
                        color: "var(--p-muted)",
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      {activeCount} active project{activeCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                {/* Check */}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    flexShrink: 0,
                    border: `2px solid ${isSelected ? "#8b5cf6" : "var(--p-border)"}`,
                    background: isSelected ? "#8b5cf6" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  {isSelected && <CheckCircle2 size={12} color="#fff" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
const Projects = () => {
  const [dark, setDark] = useState(() => {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue("--d-card")
      .trim();
    return v.startsWith("#1") || v.startsWith("#0");
  });
  useEffect(() => {
    const iv = setInterval(() => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--d-card")
        .trim();
      setDark(v.startsWith("#1") || v.startsWith("#0"));
    }, 400);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const r = document.documentElement;
    if (dark) {
      r.style.setProperty("--p-bg", "#0a0f1e");
      r.style.setProperty("--p-card", "#111827");
      r.style.setProperty("--p-card2", "#0d1220");
      r.style.setProperty("--p-border", "#1e2a3e");
      r.style.setProperty("--p-text", "#e8edf5");
      r.style.setProperty("--p-sub", "#7a8aaa");
      r.style.setProperty("--p-muted", "#3d4f68");
      r.style.setProperty("--p-hover", "#161f30");
      r.style.setProperty("--p-accent", "#1e40af");
      r.style.setProperty("--p-thead", "#0d1220");
    } else {
      r.style.setProperty("--p-bg", "#f8fafc");
      r.style.setProperty("--p-card", "#ffffff");
      r.style.setProperty("--p-card2", "#f1f5f9");
      r.style.setProperty("--p-border", "#e2e8f0");
      r.style.setProperty("--p-text", "#0f172a");
      r.style.setProperty("--p-sub", "#475569");
      r.style.setProperty("--p-muted", "#94a3b8");
      r.style.setProperty("--p-hover", "#f1f5f9");
      r.style.setProperty("--p-accent", "#1e40af");
      r.style.setProperty("--p-thead", "#f8fafc");
    }
  }, [dark]);

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  // ── FIX 1: start loading=true so skeleton shows immediately ──
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [viewMode, setViewMode] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [teams, setTeams] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentTenantId, setCurrentTenantId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    initTenant();
  }, []);

  const initTenant = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();
      const tid = profile?.tenant_id;
      setCurrentTenantId(tid);
      // Kick off all fetches; fetchProjects manages loading state
      await Promise.all([
        fetchProjects(tid),
        fetchTeams(tid),
        fetchProjectManagers(tid),
        fetchEmployees(tid),
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (currentTenantId) fetchProjects(currentTenantId);
  }, [showArchived]);

  useEffect(() => {
    let f = [...projects];
    if (searchText)
      f = f.filter(
        (p) =>
          p.name.toLowerCase().includes(searchText.toLowerCase()) ||
          p.client_name?.toLowerCase().includes(searchText.toLowerCase()),
      );
    if (statusFilter.length)
      f = f.filter((p) => statusFilter.includes(p.status));
    setFilteredProjects(f);
  }, [projects, searchText, statusFilter]);

  const fetchProjects = async (tid) => {
    if (!tid) return;
    setLoading(true); 
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "*, teams(id,name), project_manager:project_manager_id(id,full_name,user_photo)",
        )
        .eq("tenant_id", tid)
        .eq("is_archived", showArchived)
        .order("created_at", { ascending: false })
        .order("position", { ascending: true });
      if (error) throw error;
      const withAssignees = await Promise.all(
        (data || []).map(async (p) => {
          const { data: a } = await supabase
            .from("project_assignees")
            .select("profiles:employee_id(id,full_name,user_photo)")
            .eq("project_id", p.id);
          return { ...p, assignees: a?.map((x) => x.profiles) || [] };
        }),
      );
      setProjects(withAssignees);
    } catch (e) {
      message.error("Failed to fetch projects");
    } finally {
      setLoading(false); // only set false after fetch completes
    }
  };

  const fetchTeams = async (tid) => {
    if (!tid) return;
    const { data } = await supabase
      .from("teams")
      .select("id,name")
      .eq("tenant_id", tid)
      .order("name");
    setTeams(data || []);
  };
  const fetchProjectManagers = async (tid) => {
    if (!tid) return;
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,email,user_photo")
      .eq("tenant_id", tid)
      .eq("role", "project_manager")
      .order("full_name");
    setProjectManagers(data || []);
  };
  const fetchEmployees = async (tid) => {
    if (!tid) return;
    const { data } = await supabase
      .from("profiles")
      .select(
        "id,full_name,email,user_photo,skills,experience_years,employment_type,timezone,working_hours",
      )
      .eq("tenant_id", tid)
      .eq("role", "employee")
      .neq("suspended", true)
      .order("full_name");
    setEmployees(data || []);
  };

  const debouncedUpdate = useCallback(
    debounce(async (id, field, value) => {
      const { error } = await supabase
        .from("projects")
        .update({ [field]: value })
        .eq("id", id);
      if (error) message.error("Failed to update");
    }, 800),
    [],
  );

  const handleInlineEdit = (id, field, value) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
    debouncedUpdate(id, field, value);
  };

  const handleAssigneeChange = async (projectId, employeeIds) => {
    try {
      await supabase
        .from("project_assignees")
        .delete()
        .eq("project_id", projectId);
      if (employeeIds?.length) {
        await supabase.from("project_assignees").insert(
          employeeIds.map((eid) => ({
            project_id: projectId,
            employee_id: eid,
          })),
        );
      }
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                assignees: employees.filter((e) => employeeIds.includes(e.id)),
              }
            : p,
        ),
      );
      message.success("Assignees updated");
    } catch {
      message.error("Failed to update assignees");
    }
  };

  const handleArchive = (id) =>
    Modal.confirm({
      title: "Archive Project",
      content: "Hidden from main view, restorable later.",
      okText: "Archive",
      onOk: async () => {
        await supabase
          .from("projects")
          .update({ is_archived: true })
          .eq("id", id);
        message.success("Archived");
        setDrawerVisible(false);
        fetchProjects(currentTenantId);
      },
    });

  const handleUnarchive = async (id) => {
    await supabase.from("projects").update({ is_archived: false }).eq("id", id);
    message.success("Restored");
    setDrawerVisible(false);
    fetchProjects(currentTenantId);
  };

  const handleDelete = (id) =>
    Modal.confirm({
      title: "Delete Project",
      content: "Permanently deleted. Cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        await supabase.from("projects").delete().eq("id", id);
        message.success("Deleted");
        setDrawerVisible(false);
        fetchProjects(currentTenantId);
      },
    });

  const handleDragStart = (e, i) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", i);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = async (e, dropI) => {
    e.preventDefault();
    const dragI = parseInt(e.dataTransfer.getData("text/html"));
    if (dragI === dropI) return;
    const arr = [...filteredProjects];
    const [item] = arr.splice(dragI, 1);
    arr.splice(dropI, 0, item);
    setFilteredProjects(arr);
    setProjects(arr);
    try {
      for (let i = 0; i < arr.length; i++)
        await supabase
          .from("projects")
          .update({ position: i })
          .eq("id", arr[i].id);
    } catch {
      fetchProjects(currentTenantId);
    }
  };

  /* ── Skeleton rows ──────────────────────────────────────────────────── */
  const TableSkeleton = () => (
    <div style={{ padding: 0 }}>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 16px",
            borderBottom: "1px solid var(--p-border)",
            animationDelay: `${i * 60}ms`,
          }}
          className="p-fade"
        >
          <Skeleton.Button
            active
            size="small"
            style={{ width: 28, height: 28, borderRadius: 7 }}
          />
          <Skeleton.Input active size="small" style={{ width: 200 }} />
          <Skeleton.Input active size="small" style={{ width: 120 }} />
          <Skeleton.Input active size="small" style={{ width: 160 }} />
          <Skeleton.Input active size="small" style={{ width: 90 }} />
          <Skeleton.Input active size="small" style={{ width: 100 }} />
          <Skeleton.Input active size="small" style={{ width: 80 }} />
          <Skeleton.Input active size="small" style={{ width: 80 }} />
        </div>
      ))}
    </div>
  );

  /* ── Kanban ─────────────────────────────────────────────────────────── */
  const KanbanView = () => {
    const cols = [
      { key: "not_started", color: "#64748b" },
      { key: "planning", color: "#8b5cf6" },
      { key: "in_progress", color: "#1e40af" },
      { key: "testing", color: "#0891b2" },
      { key: "revision", color: "#d97706" },
      { key: "completed", color: "#16a34a" },
      { key: "on_hold", color: "#dc2626" },
    ];
    const onDragStart = (e, p) => {
      e.dataTransfer.setData("projectId", p.id);
      e.dataTransfer.setData("status", p.status);
    };
    const onDragOver = (e) => e.preventDefault();
    const onDrop = async (e, newStatus) => {
      const id = e.dataTransfer.getData("projectId");
      const cur = e.dataTransfer.getData("status");
      if (cur === newStatus) return;
      await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", id);
      message.success("Status updated");
      fetchProjects(currentTenantId);
    };

    if (loading)
      return (
        <div
          style={{
            display: "flex",
            gap: 14,
            padding: "20px 24px",
            overflowX: "auto",
          }}
        >
          {cols.map((c) => (
            <div key={c.key} style={{ flexShrink: 0, width: 300 }}>
              <Skeleton.Input
                active
                size="small"
                style={{ width: 160, marginBottom: 12 }}
              />
              {[1, 2, 3].map((i) => (
                <Skeleton.Button
                  key={i}
                  active
                  block
                  style={{ height: 90, borderRadius: 10, marginBottom: 8 }}
                />
              ))}
            </div>
          ))}
        </div>
      );

    return (
      <div
        style={{
          display: "flex",
          gap: 14,
          padding: "20px 24px",
          overflowX: "auto",
          background: "var(--p-bg)",
          minHeight: "calc(100vh - 200px)",
        }}
      >
        {cols.map((col) => {
          const colProjects = filteredProjects.filter(
            (p) => p.status === col.key,
          );
          const s = ST[col.key];
          return (
            <div
              key={col.key}
              style={{ flexShrink: 0, width: 300 }}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.key)}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  padding: "0 4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: col.color,
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--p-sub)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono',monospace",
                    color: "var(--p-muted)",
                    background: "var(--p-card)",
                    padding: "1px 7px",
                    borderRadius: 99,
                    border: "1px solid var(--p-border)",
                  }}
                >
                  {colProjects.length}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  minHeight: 120,
                }}
              >
                {colProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-kan"
                    draggable
                    onDragStart={(e) => onDragStart(e, project)}
                    onClick={() => {
                      setEditingProject(project);
                      setDrawerVisible(true);
                    }}
                    style={{
                      background: "var(--p-card)",
                      borderRadius: 10,
                      border: "1px solid var(--p-border)",
                      borderLeft: `3px solid ${col.color}`,
                      padding: "14px 14px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      {project.country_flag && (
                        <FlagIcon value={project.country_flag} size={16} />
                      )}
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--p-text)",
                          lineHeight: 1.35,
                          fontFamily: "'DM Sans',sans-serif",
                          flex: 1,
                        }}
                      >
                        {project.name}
                      </div>
                    </div>
                    {project.client_name && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--p-muted)",
                          marginBottom: 10,
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                      >
                        {project.client_name}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      {project.project_manager && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              overflow: "hidden",
                              background: "#e2e8f0",
                              flexShrink: 0,
                            }}
                          >
                            {project.project_manager.user_photo ? (
                              <img
                                src={project.project_manager.user_photo}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                alt=""
                              />
                            ) : (
                              <div
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  background: "#94a3b8",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 8,
                                  fontWeight: 700,
                                  color: "#fff",
                                }}
                              >
                                {project.project_manager.full_name?.[0]}
                              </div>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--p-sub)",
                              fontFamily: "'DM Sans',sans-serif",
                            }}
                          >
                            {project.project_manager.full_name}
                          </span>
                        </div>
                      )}
                      {project.assignees?.length > 0 && (
                        <AvaStack people={project.assignees} max={3} />
                      )}
                    </div>
                    {(project.start_date || project.end_date) && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        {project.start_date && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--p-muted)",
                              fontFamily: "'JetBrains Mono',monospace",
                            }}
                          >
                            {dayjs(project.start_date).format("MMM D")}
                          </span>
                        )}
                        {project.end_date && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--p-muted)",
                              fontFamily: "'JetBrains Mono',monospace",
                            }}
                          >
                            → {dayjs(project.end_date).format("MMM D")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setDrawerVisible(true);
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 0",
                    borderRadius: 8,
                    border: "1px dashed var(--p-border)",
                    background: "transparent",
                    color: "var(--p-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = col.color;
                    e.currentTarget.style.color = col.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--p-border)";
                    e.currentTarget.style.color = "var(--p-muted)";
                  }}
                >
                  <Plus size={12} /> New project
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Gantt ──────────────────────────────────────────────────────────── */
  const GanttView = () => {
    const [month, setMonth] = useState(dayjs());
    const daysCount = month.daysInMonth();
    const days = Array.from({ length: daysCount }, (_, i) =>
      month.startOf("month").add(i, "day"),
    );
    const groups = Object.keys(ST)
      .map((key) => ({
        key,
        ...ST[key],
        projects: filteredProjects.filter((p) => p.status === key),
      }))
      .filter((g) => g.projects.length > 0);
    const getPos = (p) => {
      if (!p.start_date || !p.end_date) return null;
      const ms = month.startOf("month"),
        me = month.endOf("month");
      const s = dayjs(p.start_date),
        e = dayjs(p.end_date);
      if (e.isBefore(ms) || s.isAfter(me)) return null;
      return {
        left: s.isBefore(ms) ? 0 : s.date() - 1,
        right: e.isAfter(me) ? daysCount - 1 : e.date() - 1,
      };
    };
    const today = dayjs().date() - 1;
    const DAY_W = 36;

    if (loading)
      return (
        <div style={{ display: "flex", height: "calc(100vh - 200px)" }}>
          <div
            style={{
              width: 280,
              borderRight: "1px solid var(--p-border)",
              padding: 16,
              background: "var(--p-card)",
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton.Input
                key={i}
                active
                size="small"
                block
                style={{ marginBottom: 10 }}
              />
            ))}
          </div>
          <div style={{ flex: 1, padding: 16 }}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        </div>
      );

    return (
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 200px)",
          background: "var(--p-bg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 280,
            borderRight: "1px solid var(--p-border)",
            display: "flex",
            flexDirection: "column",
            background: "var(--p-card)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--p-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              className="p-btn-ghost"
              onClick={() => setMonth((m) => m.subtract(1, "month"))}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 6px",
                borderRadius: 6,
                color: "var(--p-sub)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--p-text)",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {month.format("MMMM YYYY")}
            </span>
            <button
              className="p-btn-ghost"
              onClick={() => setMonth((m) => m.add(1, "month"))}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 6px",
                borderRadius: 6,
                color: "var(--p-sub)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {groups.map((g) => (
              <div key={g.key}>
                <div
                  style={{
                    padding: "8px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--p-thead)",
                    borderBottom: "1px solid var(--p-border)",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: g.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--p-sub)",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {g.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--p-muted)",
                      fontFamily: "'JetBrains Mono',monospace",
                      marginLeft: "auto",
                    }}
                  >
                    {g.projects.length}
                  </span>
                </div>
                {g.projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-row-gantt"
                    onClick={() => {
                      setEditingProject(p);
                      setDrawerVisible(true);
                    }}
                    style={{
                      padding: "10px 18px",
                      borderBottom: "1px solid var(--p-border)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {p.country_flag && (
                      <FlagIcon value={p.country_flag} size={14} />
                    )}
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--p-text)",
                        fontFamily: "'DM Sans',sans-serif",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}>
          <div
            style={{
              display: "flex",
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "var(--p-thead)",
              borderBottom: "1px solid var(--p-border)",
            }}
          >
            {days.map((d, i) => (
              <div
                key={i}
                style={{
                  flexShrink: 0,
                  width: DAY_W,
                  textAlign: "center",
                  padding: "10px 0",
                  borderRight: "1px solid var(--p-border)",
                  background:
                    i === today
                      ? dark
                        ? "rgba(30,64,175,0.2)"
                        : "rgba(30,64,175,0.06)"
                      : "transparent",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: i === today ? "var(--p-accent)" : "var(--p-muted)",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontWeight: i === today ? 700 : 400,
                  }}
                >
                  {d.format("D")}
                </div>
                <div
                  style={{
                    fontSize: 8,
                    color: "var(--p-muted)",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {d.format("dd")}
                </div>
              </div>
            ))}
          </div>
          {groups.map((g) => (
            <div key={g.key}>
              <div
                style={{
                  height: 34,
                  background: "var(--p-thead)",
                  borderBottom: "1px solid var(--p-border)",
                  display: "flex",
                }}
              >
                {days.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      flexShrink: 0,
                      width: DAY_W,
                      borderRight: "1px solid var(--p-border)",
                      background:
                        i === today
                          ? dark
                            ? "rgba(30,64,175,0.12)"
                            : "rgba(30,64,175,0.04)"
                          : "transparent",
                    }}
                  />
                ))}
              </div>
              {g.projects.map((p) => {
                const pos = getPos(p);
                return (
                  <div
                    key={p.id}
                    style={{
                      position: "relative",
                      height: 40,
                      borderBottom: "1px solid var(--p-border)",
                      display: "flex",
                    }}
                  >
                    {days.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          flexShrink: 0,
                          width: DAY_W,
                          borderRight: "1px solid var(--p-border)",
                          background:
                            i === today
                              ? dark
                                ? "rgba(30,64,175,0.08)"
                                : "rgba(30,64,175,0.03)"
                              : "transparent",
                        }}
                      />
                    ))}
                    {pos && (
                      <div
                        className="p-gantt-bar"
                        onClick={() => {
                          setEditingProject(p);
                          setDrawerVisible(true);
                        }}
                        style={{
                          position: "absolute",
                          height: 26,
                          top: 7,
                          left: pos.left * DAY_W + 2,
                          width: (pos.right - pos.left + 1) * DAY_W - 4,
                          background: g.color,
                          borderRadius: 5,
                          display: "flex",
                          alignItems: "center",
                          paddingLeft: 8,
                          cursor: "pointer",
                          overflow: "hidden",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "#fff",
                            fontWeight: 600,
                            fontFamily: "'DM Sans',sans-serif",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.name}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const VIEW_OPTS = [
    { key: "all", icon: <List size={13} />, label: "Table" },
    { key: "status", icon: <LayoutGrid size={13} />, label: "Board" },
    { key: "gantt", icon: <GanttChart size={13} />, label: "Timeline" },
  ];

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <ThemeCtx.Provider value={{ isDark: dark }}>
      <div
        style={{
          fontFamily: "'DM Sans',sans-serif",
          background: "var(--p-bg)",
          minHeight: "100vh",
          color: "var(--p-text)",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "18px 28px 16px",
            borderBottom: "1px solid var(--p-border)",
            background: "var(--p-card)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: dark
                    ? "rgba(30,64,175,0.2)"
                    : "rgba(30,64,175,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Folder size={15} color="var(--p-accent)" strokeWidth={2} />
              </div>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--p-text)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.1,
                  }}
                >
                  Projects
                </h1>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--p-muted)",
                    marginTop: 1,
                  }}
                >
                  {loading
                    ? "Loading…"
                    : `${filteredProjects.length} ${showArchived ? "archived" : "active"} project${filteredProjects.length !== 1 ? "s" : ""}`}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className="p-btn-ghost"
                onClick={() => setShowArchived(!showArchived)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--p-border)",
                  background: showArchived
                    ? dark
                      ? "rgba(30,64,175,0.15)"
                      : "rgba(30,64,175,0.06)"
                    : "transparent",
                  color: showArchived ? "var(--p-accent)" : "var(--p-sub)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <Archive size={13} />
                {showArchived ? "Active" : "Archived"}
              </button>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setDrawerVisible(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 16px",
                  borderRadius: 9,
                  background: "var(--p-accent)",
                  color: "#fff",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  transition: "opacity 0.15s",
                  boxShadow: "0 2px 8px rgba(30,64,175,0.3)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Plus size={14} /> New Project
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                background: "var(--p-card2)",
                borderRadius: 9,
                padding: 3,
                border: "1px solid var(--p-border)",
              }}
            >
              {VIEW_OPTS.map((v) => (
                <button
                  key={v.key}
                  className="p-seg-item"
                  onClick={() => setViewMode(v.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    background:
                      viewMode === v.key ? "var(--p-card)" : "transparent",
                    color:
                      viewMode === v.key ? "var(--p-text)" : "var(--p-muted)",
                    fontSize: 12,
                    fontWeight: viewMode === v.key ? 700 : 500,
                    fontFamily: "'DM Sans',sans-serif",
                    boxShadow:
                      viewMode === v.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={13}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--p-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search projects…"
                  style={{
                    padding: "7px 12px 7px 30px",
                    borderRadius: 8,
                    fontSize: 12,
                    border: "1px solid var(--p-border)",
                    background: "var(--p-card)",
                    color: "var(--p-text)",
                    outline: "none",
                    width: 220,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                />
              </div>
              <Select
                mode="multiple"
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter status"
                size="middle"
                maxTagCount="responsive"
                style={{ width: 200, fontFamily: "'DM Sans',sans-serif" }}
                options={Object.entries(ST).map(([k, v]) => ({
                  label: v.label,
                  value: k,
                }))}
              />
            </div>
          </div>
        </div>

        {/* ── Views ──────────────────────────────────────────────────── */}
        {viewMode === "status" && <KanbanView />}
        {viewMode === "gantt" && <GanttView />}

        {viewMode === "all" && (
          <div style={{ height: "calc(100vh - 200px)", overflowY: "auto" }}>
            {/* ── FIX 1: Show skeleton while loading, empty state only when done ── */}
            {loading ? (
              <TableSkeleton />
            ) : filteredProjects.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 300,
                  color: "var(--p-muted)",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <Folder size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div style={{ fontSize: 14 }}>No projects found</div>
                {searchText && (
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Try adjusting your search
                  </div>
                )}
              </div>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "var(--p-thead)",
                      position: "sticky",
                      top: 0,
                      zIndex: 5,
                    }}
                  >
                    {[
                      { label: "", w: "3%" },
                      { label: "Project", w: "19%" },
                      { label: "Manager", w: "11%" },
                      { label: "Assignees", w: "18%" },
                      { label: "Status", w: "11%" },
                      { label: "Client", w: "10%" },
                      { label: "Remarks", w: "14%" },
                      { label: "Start", w: "7%" },
                      { label: "End", w: "7%" },
                    ].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          width: h.w,
                          padding: "10px 16px",
                          textAlign: "left",
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "var(--p-muted)",
                          borderBottom: "1px solid var(--p-border)",
                        }}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project, idx) => (
                    <tr
                      key={project.id}
                      className="p-tr p-fade"
                      style={{
                        borderBottom: "1px solid var(--p-border)",
                        animationDelay: `${idx * 25}ms`,
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx)}
                    >
                      <td style={{ padding: "11px 8px 11px 16px", width: 36 }}>
                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setDrawerVisible(true);
                          }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            border: "1px solid var(--p-border)",
                            background: "var(--p-card2)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--p-muted)",
                            transition: "border-color 0.15s, color 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--p-accent)";
                            e.currentTarget.style.color = "var(--p-accent)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                              "var(--p-border)";
                            e.currentTarget.style.color = "var(--p-muted)";
                          }}
                          title="View details"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                      <td
                        style={{ padding: "11px 16px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <IconPicker
                            value={project.country_flag}
                            onChange={(v) =>
                              handleInlineEdit(project.id, "country_flag", v)
                            }
                            onRemove={() =>
                              handleInlineEdit(project.id, "country_flag", null)
                            }
                          />
                          <Input
                            value={project.name}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleInlineEdit(
                                project.id,
                                "name",
                                e.target.value,
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            bordered={false}
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: "var(--p-text)",
                              padding: "2px 4px",
                              cursor: "text",
                              fontFamily: "'DM Sans',sans-serif",
                            }}
                          />
                        </div>
                      </td>
                      <td
                        style={{ padding: "11px 16px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={project.project_manager_id}
                          onChange={(v) =>
                            handleInlineEdit(
                              project.id,
                              "project_manager_id",
                              v,
                            )
                          }
                          bordered={false}
                          suffixIcon={null}
                          style={{
                            width: "100%",
                            marginLeft: -8,
                            fontSize: 12,
                          }}
                          options={[
                            { label: "—", value: null },
                            ...projectManagers.map((pm) => ({
                              label: (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 18,
                                      height: 18,
                                      borderRadius: "50%",
                                      overflow: "hidden",
                                      background: "#e2e8f0",
                                      flexShrink: 0,
                                    }}
                                  >
                                    {pm.user_photo ? (
                                      <img
                                        src={pm.user_photo}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                        alt=""
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          background: "#94a3b8",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: 7,
                                          fontWeight: 700,
                                          color: "#fff",
                                        }}
                                      >
                                        {pm.full_name?.[0]}
                                      </div>
                                    )}
                                  </div>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: "var(--p-sub)",
                                      fontFamily: "'DM Sans',sans-serif",
                                    }}
                                  >
                                    {pm.full_name}
                                  </span>
                                </div>
                              ),
                              value: pm.id,
                            })),
                          ]}
                        />
                      </td>
                      <td
                        style={{ padding: "11px 16px", minWidth: 200 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          mode="multiple"
                          value={project.assignees?.map((a) => a.id) || []}
                          onChange={(v) => handleAssigneeChange(project.id, v)}
                          bordered={false}
                          suffixIcon={null}
                          placeholder={
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--p-muted)",
                                fontFamily: "'DM Sans',sans-serif",
                              }}
                            >
                              Assign…
                            </span>
                          }
                          style={{ width: "100%", marginLeft: -8 }}
                          tagRender={({ value, closable, onClose }) => {
                            const person = employees.find(
                              (e) => e.id === value,
                            );
                            if (!person) return null;
                            return (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "2px 6px 2px 3px",
                                  margin: "2px 3px 2px 0",
                                  borderRadius: 99,
                                  border: "1px solid var(--p-border)",
                                  background: "var(--p-card2)",
                                  fontSize: 11,
                                  color: "var(--p-text)",
                                  fontFamily: "'DM Sans',sans-serif",
                                  fontWeight: 500,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <div
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    flexShrink: 0,
                                  }}
                                >
                                  {person.user_photo ? (
                                    <img
                                      src={person.user_photo}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                      alt=""
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        background: "#94a3b8",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 7,
                                        fontWeight: 700,
                                        color: "#fff",
                                      }}
                                    >
                                      {person.full_name?.[0]}
                                    </div>
                                  )}
                                </div>
                                {person.full_name}
                                {closable && (
                                  <span
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClose();
                                    }}
                                    style={{
                                      cursor: "pointer",
                                      color: "var(--p-muted)",
                                      fontSize: 11,
                                      lineHeight: 1,
                                      marginLeft: 2,
                                    }}
                                  >
                                    ×
                                  </span>
                                )}
                              </span>
                            );
                          }}
                          options={employees.map((e) => ({
                            label: (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    overflow: "hidden",
                                    background: "#e2e8f0",
                                    flexShrink: 0,
                                  }}
                                >
                                  {e.user_photo ? (
                                    <img
                                      src={e.user_photo}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                      alt=""
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        background: "#94a3b8",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 8,
                                        fontWeight: 700,
                                        color: "#fff",
                                      }}
                                    >
                                      {e.full_name?.[0]}
                                    </div>
                                  )}
                                </div>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontFamily: "'DM Sans',sans-serif",
                                  }}
                                >
                                  {e.full_name}
                                </span>
                              </div>
                            ),
                            value: e.id,
                          }))}
                        />
                      </td>
                      <td
                        style={{ padding: "11px 16px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={project.status}
                          onChange={(v) =>
                            handleInlineEdit(project.id, "status", v)
                          }
                          bordered={false}
                          suffixIcon={null}
                          style={{ marginLeft: -8, minWidth: 130 }}
                          dropdownMatchSelectWidth={false}
                          options={Object.entries(ST).map(([k]) => ({
                            label: <StatusChip status={k} isDark={dark} sm />,
                            value: k,
                          }))}
                        />
                      </td>
                      <td
                        style={{ padding: "11px 16px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Input
                          value={project.client_name || ""}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleInlineEdit(
                              project.id,
                              "client_name",
                              e.target.value,
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          bordered={false}
                          placeholder="—"
                          style={{
                            fontSize: 12,
                            color: "var(--p-sub)",
                            padding: "2px 4px",
                            cursor: "text",
                            fontFamily: "'DM Sans',sans-serif",
                          }}
                        />
                      </td>
                      <td
                        style={{ padding: "11px 16px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TextArea
                          value={project.remarks || ""}
                          onChange={(e) => {
                            e.stopPropagation();
                            setProjects((prev) =>
                              prev.map((p) =>
                                p.id === project.id
                                  ? { ...p, remarks: e.target.value }
                                  : p,
                              ),
                            );
                            debouncedUpdate(
                              project.id,
                              "remarks",
                              e.target.value,
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          bordered={false}
                          placeholder="—"
                          autoSize={{ minRows: 1, maxRows: 2 }}
                          style={{
                            fontSize: 12,
                            color: "var(--p-sub)",
                            padding: "2px 4px",
                            cursor: "text",
                            fontFamily: "'DM Sans',sans-serif",
                          }}
                        />
                      </td>
                      <td
                        style={{ padding: "11px 16px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DatePicker
                          value={
                            project.start_date
                              ? dayjs(project.start_date)
                              : null
                          }
                          onChange={(d) =>
                            handleInlineEdit(
                              project.id,
                              "start_date",
                              d ? d.format("YYYY-MM-DD") : null,
                            )
                          }
                          bordered={false}
                          suffixIcon={null}
                          format="MMM D, YY"
                          placeholder="—"
                          style={{
                            marginLeft: -8,
                            fontSize: 11,
                            fontFamily: "'JetBrains Mono',monospace",
                            color: "var(--p-sub)",
                          }}
                        />
                      </td>
                      <td
                        style={{ padding: "11px 16px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DatePicker
                          value={
                            project.end_date ? dayjs(project.end_date) : null
                          }
                          onChange={(d) =>
                            handleInlineEdit(
                              project.id,
                              "end_date",
                              d ? d.format("YYYY-MM-DD") : null,
                            )
                          }
                          bordered={false}
                          suffixIcon={null}
                          format="MMM D, YY"
                          placeholder="—"
                          style={{
                            marginLeft: -8,
                            fontSize: 11,
                            fontFamily: "'JetBrains Mono',monospace",
                            color: "var(--p-sub)",
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Drawer ────────────────────────────────────────────────── */}
        <Drawer
          title={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {editingProject?.country_flag && (
                  <FlagIcon value={editingProject.country_flag} size={20} />
                )}
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--p-text)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {editingProject ? editingProject.name : "New Project"}
                </span>
              </div>
              {editingProject && (
                <div style={{ display: "flex", gap: 6 }}>
                  {showArchived ? (
                    <button
                      onClick={() => handleUnarchive(editingProject.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 10px",
                        borderRadius: 7,
                        border: "1px solid var(--p-border)",
                        background: "transparent",
                        color: "var(--p-accent)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      <Archive size={12} /> Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchive(editingProject.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 10px",
                        borderRadius: 7,
                        border: "1px solid var(--p-border)",
                        background: "transparent",
                        color: "var(--p-sub)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      <Archive size={12} /> Archive
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(editingProject.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "5px 10px",
                      borderRadius: 7,
                      border: "1px solid #fca5a5",
                      background: dark ? "#3b0a0a" : "#fef2f2",
                      color: "#dc2626",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          }
          placement="right"
          onClose={() => {
            setDrawerVisible(false);
            setEditingProject(null);
            fetchProjects(currentTenantId);
          }}
          open={drawerVisible}
          width={620}
          destroyOnClose
          closeIcon={<X size={16} color="var(--p-muted)" />}
          styles={{
            body: { padding: 0, background: "var(--p-card)" },
            header: {
              background: "var(--p-card)",
              borderBottom: "1px solid var(--p-border)",
            },
          }}
        >
          <ProjectForm
            key={editingProject?.id ?? "new"}
            project={editingProject}
            teams={teams}
            projectManagers={projectManagers}
            employees={employees}
            allProjects={projects}
            tenantId={currentTenantId}
            isDark={dark}
            onClose={() => {
              setDrawerVisible(false);
              setEditingProject(null);
              fetchProjects(currentTenantId);
            }}
          />
        </Drawer>
      </div>
    </ThemeCtx.Provider>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
const ProjectForm = ({
  project,
  teams,
  projectManagers,
  employees,
  allProjects,
  tenantId,
  isDark,
  onClose,
}) => {
  const [form, setForm] = useState({
    name: project?.name || "",
    project_type: project?.project_type || "single",
    status: project?.status || "planning",
    team_id: project?.team_id || null,
    project_manager_id: project?.project_manager_id || null,
    client_name: project?.client_name || "",
    client_email: project?.client_email || "",
    client_phone: project?.client_phone || "",
    client_country: project?.client_country || "",
    country_flag: project?.country_flag || null,
    github_repo: project?.github_repo || "",
    figma_link: project?.figma_link || "",
    start_date: project?.start_date || null,
    end_date: project?.end_date || null,
    remarks: project?.remarks || "",
    requirements: project?.requirements || "",
  });
  const [assignees, setAssignees] = useState(
    project?.assignees?.map((a) => a.id) || [],
  );
  const [prevAssignees] = useState(project?.assignees?.map((a) => a.id) || []);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState("general");
  const [existingClients, setExistingClients] = useState([]);
  const [clientMode, setClientMode] = useState(
    project?.client_name ? "existing" : "new",
  );
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!tenantId) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from("projects")
          .select("client_name, client_email, client_phone, client_country")
          .eq("tenant_id", tenantId)
          .not("client_name", "is", null)
          .neq("client_name", "")
          .order("client_name");
        if (!data) return;
        const seen = new Map();
        data.forEach((r) => {
          const key = r.client_name.trim().toLowerCase();
          if (!seen.has(key)) {
            seen.set(key, {
              name: r.client_name,
              email: r.client_email || "",
              phone: r.client_phone || "",
              country: r.client_country || "",
            });
          } else {
            const existing = seen.get(key);
            const score = (c) =>
              (c.email ? 1 : 0) + (c.phone ? 1 : 0) + (c.country ? 1 : 0);
            if (score(r) > score(existing))
              seen.set(key, {
                name: r.client_name,
                email: r.client_email || "",
                phone: r.client_phone || "",
                country: r.client_country || "",
              });
          }
        });
        setExistingClients(
          Array.from(seen.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      } catch (e) {
        console.error("Failed to load clients", e);
      }
    };
    load();
  }, [tenantId]);

  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-uploaded
    e.target.value = "";

    setUploadingDoc(true);
    try {
      let text = "";

      // ── Plain text / Markdown ──────────────────────────────────────
      if (file.type === "text/plain" || file.name.endsWith(".md")) {
        text = await file.text();

        // ── PDF ────────────────────────────────────────────────────────
      } else if (
        file.type === "application/pdf" ||
        file.name.endsWith(".pdf")
      ) {
        const pdfjsLib = await import("pdfjs-dist");
        // Point worker to the bundled worker file
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map((item) => item.str).join(" "));
        }
        text = pages.join("\n\n");

        // ── DOCX ───────────────────────────────────────────────────────
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;

        // ── DOC (old Word) ─────────────────────────────────────────────
      } else if (
        file.type === "application/msword" ||
        file.name.endsWith(".doc")
      ) {
        // mammoth has limited .doc support but worth trying
        try {
          const mammoth = await import("mammoth");
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } catch {
          message.warning(
            ".doc format has limited support. Try saving as .docx for best results.",
          );
          text = `[From file: ${file.name}]\n`;
        }
      } else {
        message.error(
          "Unsupported file type. Please upload PDF, DOCX, DOC, TXT, or MD.",
        );
        return;
      }

      const trimmed = text.replace(/\s+/g, " ").trim().slice(0, 5000);
      if (!trimmed) {
        message.warning(
          "No readable text found in file. The document may be scanned/image-based.",
        );
        return;
      }
      set("requirements", trimmed);
      message.success(
        `Extracted ${trimmed.length.toLocaleString()} characters from ${file.name}`,
      );
    } catch (err) {
      console.error("File parse error:", err);
      message.error(
        "Failed to read file. Please try a different format or paste manually.",
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  /* ── Email helper: send to newly added assignees ──────────────────── */
  const notifyNewAssignees = async (projectId, projectName, newIds) => {
    const added = newIds.filter((id) => !prevAssignees.includes(id));
    if (!added.length) return;

    const { data: tenantData } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", added[0])
      .single()
      .catch(() => ({ data: null }));

    await Promise.allSettled(
      added.map(async (empId) => {
        const emp = employees.find((e) => e.id === empId);
        if (!emp?.email) return;
        const html = `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
            <div style="background:#1e40af;border-radius:10px;padding:24px;margin-bottom:24px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:20px;letter-spacing:-0.5px;">You've been assigned to a project 🎉</h1>
            </div>
            <p style="color:#0f172a;font-size:15px;margin:0 0 8px;">Hi <strong>${emp.full_name}</strong>,</p>
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
              You have been assigned to the project <strong style="color:#1e40af;">${projectName}</strong>.
              Please log in to the portal to view the project details and get started.
            </p>
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:24px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:4px;">Project</div>
              <div style="font-size:15px;font-weight:700;color:#0f172a;">${projectName}</div>
              ${form.start_date ? `<div style="font-size:12px;color:#64748b;margin-top:6px;">Start: ${dayjs(form.start_date).format("MMMM D, YYYY")}</div>` : ""}
              ${form.end_date ? `<div style="font-size:12px;color:#64748b;">Deadline: ${dayjs(form.end_date).format("MMMM D, YYYY")}</div>` : ""}
            </div>
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">This is an automated notification. Please do not reply.</p>
          </div>
        `;
        await sendEmail({
          to: emp.email,
          subject: `You've been assigned to "${projectName}"`,
          body: html,
          companyName: "Your Company",
        });
      }),
    );
  };

  const save = async () => {
    if (!form.name.trim()) {
      message.error("Project name required");
      return;
    }
    setSaving(true);
    try {
      let pid = project?.id;
      if (project) {
        const { error } = await supabase
          .from("projects")
          .update(form)
          .eq("id", project.id);
        if (error) throw error;
      } else {
        const { data: np, error } = await supabase
          .from("projects")
          .insert([{ ...form, tenant_id: tenantId }])
          .select()
          .single();
        if (error) throw error;
        pid = np.id;
      }
      if (project)
        await supabase.from("project_assignees").delete().eq("project_id", pid);
      if (assignees.length) {
        const { error } = await supabase
          .from("project_assignees")
          .insert(
            assignees.map((eid) => ({ project_id: pid, employee_id: eid })),
          );
        if (error) throw error;
      }

      // Send email to newly assigned employees
      notifyNewAssignees(pid, form.name, assignees).catch(console.error);

      message.success(project ? "Project updated" : "Project created");
      onClose();
    } catch (e) {
      message.error("Failed to save project");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  /* Toggle an AI-suggested employee in/out of assignees */
  const toggleSuggested = (empId) => {
    setAssignees((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId],
    );
  };

  const LBL = ({ children, req }) => (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--p-muted)",
        marginBottom: 6,
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      {children}
      {req && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
    </div>
  );

  const FIELD = { marginBottom: 18 };
  const inputStyle = {
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'DM Sans',sans-serif",
    background: "var(--p-card2)",
    borderColor: "var(--p-border)",
    color: "var(--p-text)",
  };

  const TABS = [
    { key: "general", label: "General" },
    { key: "client", label: "Client" },
    {
      key: "ai",
      label: "AI Match",
      icon: <Sparkles size={11} color="#8b5cf6" />,
    },
    { key: "details", label: "Details" },
  ];

  return (
    <div
      style={{
        fontFamily: "'DM Sans',sans-serif",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Tab nav */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--p-border)",
          padding: "0 24px",
          background: "var(--p-card)",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSection(t.key)}
            style={{
              padding: "12px 16px 10px",
              border: "none",
              background: "transparent",
              fontSize: 13,
              fontWeight: section === t.key ? 700 : 500,
              color:
                section === t.key
                  ? t.key === "ai"
                    ? "#8b5cf6"
                    : "var(--p-accent)"
                  : "var(--p-muted)",
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              borderBottom:
                section === t.key
                  ? `2px solid ${t.key === "ai" ? "#8b5cf6" : "var(--p-accent)"}`
                  : "2px solid transparent",
              transition: "color 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Form body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {/* ── General ── */}
        {section === "general" && (
          <div>
            <div style={FIELD}>
              <LBL req>Project Name</LBL>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Acme Website Redesign"
                size="large"
                style={inputStyle}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 18,
              }}
            >
              <div>
                <LBL>Type</LBL>
                <Select
                  value={form.project_type}
                  onChange={(v) => set("project_type", v)}
                  size="large"
                  style={{ width: "100%" }}
                  options={[
                    { label: "Single", value: "single" },
                    { label: "Milestone", value: "milestone" },
                  ]}
                />
              </div>
              <div>
                <LBL>Status</LBL>
                <Select
                  value={form.status}
                  onChange={(v) => set("status", v)}
                  size="large"
                  style={{ width: "100%" }}
                  options={Object.entries(ST).map(([k, v]) => ({
                    label: <StatusChip status={k} isDark={isDark} />,
                    value: k,
                  }))}
                />
              </div>
            </div>
            <div style={FIELD}>
              <LBL>Project Manager</LBL>
              <Select
                value={form.project_manager_id}
                onChange={(v) => set("project_manager_id", v)}
                size="large"
                style={{ width: "100%" }}
                placeholder="Select manager"
                options={projectManagers.map((pm) => ({
                  label: (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          overflow: "hidden",
                          background: "#e2e8f0",
                        }}
                      >
                        {pm.user_photo ? (
                          <img
                            src={pm.user_photo}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            alt=""
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: "#94a3b8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            {pm.full_name?.[0]}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                      >
                        {pm.full_name}
                      </span>
                    </div>
                  ),
                  value: pm.id,
                }))}
              />
            </div>
            <div style={FIELD}>
              <LBL>Assignees</LBL>
              <Select
                mode="multiple"
                value={assignees}
                onChange={setAssignees}
                size="large"
                style={{ width: "100%" }}
                placeholder="Assign employees"
                maxTagCount="responsive"
                options={employees.map((e) => ({
                  label: (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          overflow: "hidden",
                          background: "#e2e8f0",
                        }}
                      >
                        {e.user_photo ? (
                          <img
                            src={e.user_photo}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            alt=""
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: "#94a3b8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            {e.full_name?.[0]}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 13 }}>{e.full_name}</span>
                    </div>
                  ),
                  value: e.id,
                }))}
              />
              {/* Quick hint to go to AI tab */}
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <button
                  onClick={() => setSection("ai")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11.5,
                    color: "#8b5cf6",
                    fontWeight: 700,
                    fontFamily: "'DM Sans',sans-serif",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Sparkles size={11} /> Use AI to suggest employees
                </button>
              </div>
            </div>
            <div style={FIELD}>
              <LBL>Team</LBL>
              <Select
                value={form.team_id}
                onChange={(v) => set("team_id", v)}
                size="large"
                style={{ width: "100%" }}
                placeholder="Assign to team"
                options={teams.map((t) => ({ label: t.name, value: t.id }))}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 18,
              }}
            >
              <div>
                <LBL>Start Date</LBL>
                <DatePicker
                  value={form.start_date ? dayjs(form.start_date) : null}
                  onChange={(d) =>
                    set("start_date", d ? d.format("YYYY-MM-DD") : null)
                  }
                  size="large"
                  format="MMM D, YYYY"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <LBL>End Date</LBL>
                <DatePicker
                  value={form.end_date ? dayjs(form.end_date) : null}
                  onChange={(d) =>
                    set("end_date", d ? d.format("YYYY-MM-DD") : null)
                  }
                  size="large"
                  format="MMM D, YYYY"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── AI Match Tab ── */}
        {section === "ai" && (
          <div>
            {/* Requirements input */}
            <div style={FIELD}>
              <LBL>Project Requirements</LBL>
              <div style={{ position: "relative" }}>
                <TextArea
                  value={form.requirements}
                  onChange={(e) => set("requirements", e.target.value)}
                  placeholder="Describe what the project needs — tech stack, skills, domain expertise, timeline constraints…&#10;&#10;e.g. React + Node.js full-stack app, needs someone with fintech experience and available for 3 months starting next week."
                  rows={5}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>
              {/* File upload */}
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md,.pdf,.doc,.docx"
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="p-upload-zone"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px dashed var(--p-border)",
                    background: "transparent",
                    color: uploadingDoc ? "#8b5cf6" : "var(--p-muted)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: uploadingDoc ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                    opacity: uploadingDoc ? 0.8 : 1,
                  }}
                >
                  {uploadingDoc ? (
                    <>
                      <Loader2 size={11} className="p-spin" /> Extracting text…
                    </>
                  ) : (
                    <>
                      <Upload size={11} /> Upload doc (PDF, DOCX, TXT, MD)
                    </>
                  )}
                </button>
                {form.requirements && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--p-muted)",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {form.requirements.length} chars
                  </span>
                )}
              </div>
            </div>

            {/* AI Suggestions */}
            <AISuggestPanel
              employees={employees}
              allProjects={allProjects}
              projectName={form.name || "Untitled Project"}
              projectRequirements={form.requirements}
              isDark={isDark}
              onSelect={toggleSuggested}
              currentAssignees={assignees}
            />

            {/* Current selection summary */}
            {assignees.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: isDark
                    ? "rgba(30,64,175,0.08)"
                    : "rgba(30,64,175,0.04)",
                  border: "1px solid var(--p-border)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--p-muted)",
                    marginBottom: 8,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  Currently selected ({assignees.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {assignees.map((id) => {
                    const emp = employees.find((e) => e.id === id);
                    if (!emp) return null;
                    return (
                      <span
                        key={id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "3px 8px 3px 4px",
                          borderRadius: 99,
                          border: "1px solid var(--p-border)",
                          background: "var(--p-card)",
                          fontSize: 12,
                          color: "var(--p-text)",
                          fontFamily: "'DM Sans',sans-serif",
                          fontWeight: 500,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {emp.user_photo ? (
                            <img
                              src={emp.user_photo}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              alt=""
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                background: "#94a3b8",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 8,
                                fontWeight: 700,
                                color: "#fff",
                              }}
                            >
                              {emp.full_name?.[0]}
                            </div>
                          )}
                        </div>
                        {emp.full_name}
                        <span
                          onClick={() =>
                            setAssignees((prev) => prev.filter((i) => i !== id))
                          }
                          style={{
                            cursor: "pointer",
                            color: "var(--p-muted)",
                            fontSize: 13,
                            lineHeight: 1,
                            marginLeft: 1,
                          }}
                        >
                          ×
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Client ── */}
        {section === "client" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                {
                  key: "existing",
                  label: `From existing${existingClients.length ? ` (${existingClients.length})` : ""}`,
                },
                { key: "new", label: "New client" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setClientMode(opt.key);
                    if (opt.key === "new") set("client_name", "");
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'DM Sans',sans-serif",
                    border: `1px solid ${clientMode === opt.key ? "var(--p-accent)" : "var(--p-border)"}`,
                    background:
                      clientMode === opt.key
                        ? isDark
                          ? "rgba(30,64,175,0.18)"
                          : "rgba(30,64,175,0.07)"
                        : "transparent",
                    color:
                      clientMode === opt.key
                        ? "var(--p-accent)"
                        : "var(--p-muted)",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {clientMode === "existing" && (
              <div>
                {existingClients.length === 0 ? (
                  <div
                    style={{
                      padding: "24px 16px",
                      borderRadius: 10,
                      textAlign: "center",
                      border: "1px dashed var(--p-border)",
                      color: "var(--p-muted)",
                      fontSize: 13,
                      fontFamily: "'DM Sans',sans-serif",
                      marginBottom: 18,
                    }}
                  >
                    No previous clients found.
                    <button
                      onClick={() => setClientMode("new")}
                      style={{
                        display: "block",
                        margin: "8px auto 0",
                        color: "var(--p-accent)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      Add a new client →
                    </button>
                  </div>
                ) : (
                  <div style={FIELD}>
                    <LBL>Select Client</LBL>
                    <Select
                      showSearch
                      value={form.client_name || undefined}
                      placeholder="Search or pick a client…"
                      size="large"
                      style={{ width: "100%" }}
                      filterOption={(input, option) =>
                        option?.label
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      onChange={(val) => {
                        const client = existingClients.find(
                          (c) => c.name === val,
                        );
                        if (client) {
                          set("client_name", client.name);
                          set("client_email", client.email);
                          set("client_phone", client.phone);
                          set("client_country", client.country);
                        }
                      }}
                      optionLabelProp="label"
                      options={existingClients.map((c) => ({
                        label: c.name,
                        value: c.name,
                        client: c,
                      }))}
                      optionRender={(opt) => {
                        const c = opt.data.client;
                        return (
                          <div style={{ padding: "6px 0" }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--p-text)",
                                fontFamily: "'DM Sans',sans-serif",
                              }}
                            >
                              {c.name}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 12,
                                marginTop: 3,
                                flexWrap: "wrap",
                              }}
                            >
                              {c.email && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "var(--p-muted)",
                                    fontFamily: "'DM Sans',sans-serif",
                                  }}
                                >
                                  ✉ {c.email}
                                </span>
                              )}
                              {c.phone && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "var(--p-muted)",
                                    fontFamily: "'DM Sans',sans-serif",
                                  }}
                                >
                                  ☎ {c.phone}
                                </span>
                              )}
                              {c.country && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "var(--p-muted)",
                                    fontFamily: "'DM Sans',sans-serif",
                                  }}
                                >
                                  📍 {c.country}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />
                  </div>
                )}
                {form.client_name && (
                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      marginBottom: 18,
                      background: isDark
                        ? "rgba(30,64,175,0.1)"
                        : "rgba(30,64,175,0.05)",
                      border: `1px solid ${isDark ? "rgba(30,64,175,0.3)" : "rgba(30,64,175,0.2)"}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--p-accent)",
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                      >
                        Auto-filled
                      </span>
                      <button
                        onClick={() => {
                          set("client_name", "");
                          set("client_email", "");
                          set("client_phone", "");
                          set("client_country", "");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--p-muted)",
                          fontSize: 12,
                          fontFamily: "'DM Sans',sans-serif",
                        }}
                      >
                        Clear
                      </button>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                      }}
                    >
                      {[
                        { label: "Name", value: form.client_name },
                        { label: "Email", value: form.client_email },
                        { label: "Phone", value: form.client_phone },
                        { label: "Country", value: form.client_country },
                      ]
                        .filter((r) => r.value)
                        .map((r) => (
                          <div key={r.label}>
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "var(--p-muted)",
                                marginBottom: 2,
                                fontFamily: "'DM Sans',sans-serif",
                              }}
                            >
                              {r.label}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--p-text)",
                                fontFamily: "'DM Sans',sans-serif",
                                fontWeight: 500,
                              }}
                            >
                              {r.value}
                            </div>
                          </div>
                        ))}
                    </div>
                    <button
                      onClick={() => setClientMode("new")}
                      style={{
                        marginTop: 12,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--p-accent)",
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "'DM Sans',sans-serif",
                        padding: 0,
                      }}
                    >
                      Edit manually →
                    </button>
                  </div>
                )}
              </div>
            )}
            {clientMode === "new" && (
              <div>
                <div style={FIELD}>
                  <div style={FIELD}>
                    <LBL>Client Name</LBL>
                    <Input
                      value={form.client_name}
                      onChange={(e) => set("client_name", e.target.value)}
                      placeholder="Enter client name…"
                      size="large"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={FIELD}>
                  <LBL>Client Email</LBL>
                  <Input
                    value={form.client_email}
                    onChange={(e) => set("client_email", e.target.value)}
                    placeholder="client@example.com"
                    size="large"
                    style={inputStyle}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <LBL>Phone</LBL>
                    <Input
                      value={form.client_phone}
                      onChange={(e) => set("client_phone", e.target.value)}
                      placeholder="+1 234 567 8900"
                      size="large"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <LBL>Country</LBL>
                    <CountrySelect
                      value={form.client_country}
                      onChange={(v) => set("client_country", v)}
                      placeholder="Select country"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Details ── */}
        {section === "details" && (
          <div>
            <div style={FIELD}>
              <LBL>Figma Link</LBL>
              <Input
                value={form.figma_link}
                onChange={(e) => set("figma_link", e.target.value)}
                placeholder="https://figma.com/…"
                size="large"
                style={inputStyle}
              />
            </div>
            <div style={FIELD}>
              <LBL>GitHub Repository</LBL>
              <Input
                value={form.github_repo}
                onChange={(e) => set("github_repo", e.target.value)}
                placeholder="https://github.com/…"
                size="large"
                style={inputStyle}
              />
            </div>
            <div style={FIELD}>
              <LBL>Remarks</LBL>
              <TextArea
                value={form.remarks}
                onChange={(e) => set("remarks", e.target.value)}
                placeholder="Internal notes…"
                rows={4}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--p-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--p-card)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {assignees.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Mail size={12} color="var(--p-muted)" />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--p-muted)",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {assignees.filter((id) => !prevAssignees.includes(id)).length >
                0
                  ? `Email will be sent to ${assignees.filter((id) => !prevAssignees.includes(id)).length} new assignee(s)`
                  : "No new assignees"}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px",
              borderRadius: 9,
              border: "1px solid var(--p-border)",
              background: "transparent",
              color: "var(--p-sub)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "9px 22px",
              borderRadius: 9,
              border: "none",
              background: "var(--p-accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans',sans-serif",
              opacity: saving ? 0.7 : 1,
              boxShadow: "0 2px 8px rgba(30,64,175,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {saving ? (
              <>
                <Loader2 size={13} className="p-spin" /> Saving…
              </>
            ) : (
              <>{project ? "Update Project" : "Create Project"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Projects;
