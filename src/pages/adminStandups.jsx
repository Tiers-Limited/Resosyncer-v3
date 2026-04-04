import { useState, useEffect, useMemo } from "react";
import {
  DatePicker,
  Avatar,
  Space,
  Typography,
  Spin,
  Input,
  Empty,
  Tooltip,
  Progress,
  Table,
  Button,
  Select,
  Modal,
  Skeleton,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  MinusOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
  BarChartOutlined,
  TeamOutlined,
  SearchOutlined,
  FolderOutlined,
  RiseOutlined,
  FileTextOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import {
  Lock,
  Star,
  ArrowRight,
  Shield,
  Zap,
  MessageSquare,
  Sparkles,
  Bell,
  Plus,
  ChevronRight,
  BarChart2,
  Repeat2,
  Users,
} from "lucide-react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

dayjs.extend(isoWeek);

const { Title, Text } = Typography;
const { Option } = Select;

// ─── CSS Variables injected as a <style> tag ──────────────────────────────────
// All colours are defined here and consumed via var(--token) everywhere below.
// Switching dark/light = toggling one class on the root wrapper.
const THEME_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

  .sp-root {
    /* ── Background layers ── */
    --bg-page:       #f8fafc;
    --bg-card:       #ffffff;
    --bg-card-alt:   #f9fafb;
    --bg-card-hover: #f8fafc;
    --bg-subtle:     #f1f5f9;
    --bg-muted:      #e2e8f0;

    /* ── Borders ── */
    --border:        #e2e8f0;
    --border-subtle: #f1f5f9;
    --border-faint:  #f9fafb;

    /* ── Text ── */
    --text-primary:  #0f172a;
    --text-secondary:#475569;
    --text-tertiary: #64748b;
    --text-muted:    #94a3b8;
    --text-faint:    #cbd5e1;

    /* ── Semantic status colours (light) ── */
    --present-color: #059669; --present-bg: #ecfdf5; --present-border: #a7f3d0;
    --absent-color:  #e11d48; --absent-bg:  #fff1f2; --absent-border:  #fecdd3;
    --late-color:    #d97706; --late-bg:    #fffbeb; --late-border:    #fde68a;
    --none-color:    #cbd5e1; --none-bg:    #f8fafc; --none-border:    #e2e8f0;

    /* ── Project status colours (light) ── */
    --status-active-color:    #059669; --status-active-bg:    #ecfdf5; --status-active-border:    #a7f3d0;
    --status-progress-color:  #2563eb; --status-progress-bg:  #eff6ff; --status-progress-border:  #bfdbfe;
    --status-planning-color:  #7c3aed; --status-planning-bg:  #f5f3ff; --status-planning-border:  #ddd6fe;
    --status-review-color:    #d97706; --status-review-bg:    #fffbeb; --status-review-border:    #fde68a;
    --status-completed-color: #64748b; --status-completed-bg: #f8fafc; --status-completed-border: #e2e8f0;

    /* ── Accent ── */
    --accent:        #6366f1;
    --accent-bg:     #eef2ff;
    --accent-border: #c7d2fe;

    /* ── Shadows ── */
    --shadow-card:   0 1px 4px rgba(15,23,42,0.06);
    --shadow-btn:    0 2px 8px rgba(15,23,42,0.15);
  }

  /* ══════════════════ DARK OVERRIDES ══════════════════ */
  .sp-root.dark {
    --bg-page:       #0b1220;
    --bg-card:       #111827;
    --bg-card-alt:   #0f172a;
    --bg-card-hover: #0f172a;
    --bg-subtle:     #1f2937;
    --bg-muted:      #334155;

    --border:        #1f2937;
    --border-subtle: #1f2937;
    --border-faint:  #1a2332;

    --text-primary:  #f1f5f9;
    --text-secondary:#cbd5e1;
    --text-tertiary: #94a3b8;
    --text-muted:    #64748b;
    --text-faint:    #334155;

    --present-color: #4ade80; --present-bg: rgba(34,197,94,0.14);  --present-border: rgba(74,222,128,0.3);
    --absent-color:  #fb7185; --absent-bg:  rgba(225,29,72,0.14);  --absent-border:  rgba(251,113,133,0.3);
    --late-color:    #fbbf24; --late-bg:    rgba(217,119,6,0.14);  --late-border:    rgba(251,191,36,0.3);
    --none-color:    #475569; --none-bg:    rgba(71,85,105,0.2);   --none-border:    rgba(71,85,105,0.35);

    --status-active-color:    #4ade80; --status-active-bg:    rgba(34,197,94,0.14);  --status-active-border:    rgba(74,222,128,0.3);
    --status-progress-color:  #93c5fd; --status-progress-bg:  rgba(37,99,235,0.14);  --status-progress-border:  rgba(147,197,253,0.3);
    --status-planning-color:  #c4b5fd; --status-planning-bg:  rgba(124,58,237,0.14); --status-planning-border:  rgba(196,181,253,0.3);
    --status-review-color:    #fbbf24; --status-review-bg:    rgba(217,119,6,0.14);  --status-review-border:    rgba(251,191,36,0.3);
    --status-completed-color: #94a3b8; --status-completed-bg: rgba(148,163,184,0.12);--status-completed-border: rgba(148,163,184,0.25);

    --accent:        #818cf8;
    --accent-bg:     rgba(99,102,241,0.14);
    --accent-border: rgba(129,140,248,0.35);

    --shadow-card:   0 1px 4px rgba(0,0,0,0.35);
    --shadow-btn:    0 2px 8px rgba(0,0,0,0.4);
  }

  /* ── Font reset ── */
  .sp-root * { font-family: 'Outfit', sans-serif !important; box-sizing: border-box; }

  /* ── Ant Design table overrides ── */
  .sp-root .ant-table { background: transparent !important; }
  .sp-root .ant-table-thead > tr > th {
    background: var(--bg-card-alt) !important;
    color: var(--text-muted) !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border) !important;
    padding: 10px 14px !important;
    white-space: nowrap;
  }
  .sp-root .ant-table-tbody > tr > td {
    background: var(--bg-card) !important;
    border-bottom: 1px solid var(--border-faint) !important;
    padding: 13px 14px !important;
  }
  .sp-root .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
  .sp-root .ant-table-tbody > tr:hover > td { background: var(--bg-card-hover) !important; }
  .sp-root .heatmap-table .ant-table-thead > tr > th { padding: 10px 5px !important; }
  .sp-root .heatmap-table .ant-table-tbody > tr > td  { padding: 9px 5px !important; }
  .sp-root .ant-table-cell-fix-left,
  .sp-root .ant-table-cell-fix-right { background: var(--bg-card) !important; }
  .sp-root .ant-table-tbody > tr:hover .ant-table-cell-fix-left,
  .sp-root .ant-table-tbody > tr:hover .ant-table-cell-fix-right { background: var(--bg-card-hover) !important; }
  .sp-root .ant-table-container::before,
  .sp-root .ant-table-container::after { box-shadow: none !important; }
  .sp-root .ant-table-ping-left  .ant-table-cell-fix-left-last::after,
  .sp-root .ant-table-ping-right .ant-table-cell-fix-right-first::after { box-shadow: none !important; }
  .sp-root .ant-table-body { overflow-x: auto !important; }
  .sp-root .ant-table-sticky-scroll { display: none !important; }

  /* ── Ant Design form controls ── */
  .sp-root .ant-picker,
  .sp-root .ant-input,
  .sp-root .ant-select-selector {
    border-radius: 8px !important;
    background: var(--bg-card) !important;
    border-color: var(--border) !important;
    color: var(--text-primary) !important;
  }
  .sp-root .ant-picker-suffix,
  .sp-root .ant-input-prefix { color: var(--text-muted) !important; }
  .sp-root .ant-picker-input > input,
  .sp-root .ant-select-selection-item,
  .sp-root .ant-select-selection-placeholder { color: var(--text-primary) !important; }
  .sp-root .ant-input-clear-icon { color: var(--text-muted) !important; }

  /* ── Ant Design modal ── */
  .sp-root .ant-modal-content { border-radius: 16px !important; overflow: hidden; background: var(--bg-card) !important; }
  .sp-root .ant-modal-header { padding: 20px 24px !important; border-bottom: 1px solid var(--border) !important; background: var(--bg-card) !important; }
  .sp-root .ant-modal-body  { padding: 0 !important; }
  .sp-root .ant-modal-close-x { color: var(--text-muted) !important; }

  /* ── Pagination ── */
  .sp-root .ant-pagination-item,
  .sp-root .ant-pagination-prev,
  .sp-root .ant-pagination-next { border-color: var(--border) !important; background: var(--bg-card) !important; }
  .sp-root .ant-pagination-item a { color: var(--text-secondary) !important; }
  .sp-root .ant-pagination-item-active { border-color: var(--accent) !important; }
  .sp-root .ant-pagination-item-active a { color: var(--accent) !important; }
  .sp-root .ant-pagination-total-text { color: var(--text-muted) !important; }

  /* ── Empty state ── */
  .sp-root .ant-empty-description { color: var(--text-muted) !important; }

  /* ── Skeleton ── */
  .sp-root .ant-skeleton-element .ant-skeleton-input,
  .sp-root .ant-skeleton-element .ant-skeleton-avatar,
  .sp-root .ant-skeleton-element .ant-skeleton-button { background: var(--bg-subtle) !important; }
  .sp-root .ant-skeleton-content .ant-skeleton-title,
  .sp-root .ant-skeleton-content .ant-skeleton-paragraph > li { background: var(--bg-subtle) !important; }

  /* ── Select dropdown (portal) ── */
  .sp-select-dropdown .ant-select-item { color: var(--text-primary) !important; background: var(--bg-card) !important; }
  .sp-select-dropdown .ant-select-item-option-active { background: var(--bg-subtle) !important; }
  .sp-select-dropdown .ant-select-item-option-selected { background: var(--accent-bg) !important; color: var(--accent) !important; }

  /* ── Tooltip ── */
  .sp-root .ant-tooltip-inner { font-family: 'Outfit', sans-serif !important; }
`;

// ─── Token-aware STATUS config (reads CSS vars at runtime via getComputedStyle) ─
// We derive these from CSS variables so they auto-respond to theme class.
const getTokens = (el) => {
  const s = el ? getComputedStyle(el) : { getPropertyValue: () => "" };
  const g = (v) => s.getPropertyValue(v).trim();
  return {
    present: {
      label: "Present",
      color: g("--present-color"),
      bg: g("--present-bg"),
      border: g("--present-border"),
      icon: <CheckOutlined style={{ fontSize: 9 }} />,
    },
    absent: {
      label: "Absent",
      color: g("--absent-color"),
      bg: g("--absent-bg"),
      border: g("--absent-border"),
      icon: <CloseOutlined style={{ fontSize: 9 }} />,
    },
    late: {
      label: "Late",
      color: g("--late-color"),
      bg: g("--late-bg"),
      border: g("--late-border"),
      icon: <ClockCircleOutlined style={{ fontSize: 9 }} />,
    },
    none: {
      label: "No Standup",
      color: g("--none-color"),
      bg: g("--none-bg"),
      border: g("--none-border"),
      icon: <MinusOutlined style={{ fontSize: 9 }} />,
    },
  };
};

const getProjStatusTokens = (el) => {
  const s = el ? getComputedStyle(el) : { getPropertyValue: () => "" };
  const g = (v) => s.getPropertyValue(v).trim();
  return {
    active: {
      color: g("--status-active-color"),
      bg: g("--status-active-bg"),
      border: g("--status-active-border"),
    },
    "in progress": {
      color: g("--status-progress-color"),
      bg: g("--status-progress-bg"),
      border: g("--status-progress-border"),
    },
    planning: {
      color: g("--status-planning-color"),
      bg: g("--status-planning-bg"),
      border: g("--status-planning-border"),
    },
    review: {
      color: g("--status-review-color"),
      bg: g("--status-review-bg"),
      border: g("--status-review-border"),
    },
    completed: {
      color: g("--status-completed-color"),
      bg: g("--status-completed-bg"),
      border: g("--status-completed-border"),
    },
  };
};

const AVATAR_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
];
const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

function getWeekdaysInMonth(year, month) {
  const days = [];
  const start = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const end = start.endOf("month");
  let cur = start;
  while (cur.isBefore(end) || cur.isSame(end, "day")) {
    if (cur.day() !== 0 && cur.day() !== 6) days.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(1, "day");
  }
  return days;
}

const VIEW = { PROJECTS: "projects", PROJECT_DETAIL: "project_detail" };

// ─── Skeleton loaders ──────────────────────────────────────────────────────────
const ProjectListSkeleton = () => (
  <div style={{ padding: 20 }}>
    {Array.from({ length: 5 }).map((_, idx) => (
      <div
        key={idx}
        style={{
          padding: "14px 0",
          borderBottom:
            idx < 4 ? "1px solid var(--border-faint)" : "1px solid transparent",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 1fr 1fr 1fr 1fr 1fr 130px",
            gap: 14,
            alignItems: "center",
          }}
        >
          <Skeleton.Avatar active size={36} shape="circle" />
          <Skeleton.Input active size="small" style={{ width: "80%" }} />
          <Skeleton.Input active size="small" style={{ width: "90%" }} />
          <Skeleton.Input active size="small" style={{ width: "90%" }} />
          <Skeleton.Input active size="small" style={{ width: "90%" }} />
          <Skeleton.Input active size="small" style={{ width: "85%" }} />
          <Skeleton.Button active size="small" style={{ width: 116 }} />
        </div>
      </div>
    ))}
  </div>
);

const ProjectDetailSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    {[1, 2].map((k) => (
      <div
        key={k}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <Skeleton
          active
          paragraph={{
            rows: k === 1 ? 1 : 8,
            width: k === 1 ? ["55%"] : undefined,
          }}
          title={{ width: "30%" }}
        />
      </div>
    ))}
  </div>
);

// ─── Free plan paywall ────────────────────────────────────────────────────────
function FreeStandupPaywall({ navigate, dark = false }) {
  const features = [
    {
      icon: <MessageSquare size={16} />,
      title: "Async Standups",
      desc: "Run daily standups without meetings. Team members answer prompts on their own schedule.",
    },
    {
      icon: <Sparkles size={16} />,
      title: "AI Summaries",
      desc: "Automatically summarize team responses, surface blockers, and highlight key updates.",
    },
    {
      icon: <Bell size={16} />,
      title: "Smart Reminders",
      desc: "Automated nudges so no one misses their standup. Configurable schedule per team.",
    },
    {
      icon: <BarChart2 size={16} />,
      title: "Participation Insights",
      desc: "Track response rates, streaks, and team engagement over time with visual dashboards.",
    },
    {
      icon: <Repeat2 size={16} />,
      title: "Recurring Schedules",
      desc: "Set daily, weekly or custom cadences. Standups run automatically without manual setup.",
    },
    {
      icon: <Users size={16} />,
      title: "Team-wide Visibility",
      desc: "Everyone sees everyone's updates. Break silos and keep the whole org aligned.",
    },
  ];

  const mockStandups = [
    {
      name: "Lena Park",
      role: "Frontend",
      avatar: "LP",
      avatarBg: "rgba(37,99,235,0.15)",
      avatarColor: "#93c5fd",
      time: "9:04 AM",
      yesterday: "Finished the dashboard redesign and pushed for review.",
      today: "Starting on the mobile nav refactor.",
      blockers: null,
    },
    {
      name: "James Osei",
      role: "Backend",
      avatar: "JO",
      avatarBg: "rgba(22,163,74,0.15)",
      avatarColor: "#4ade80",
      time: "9:11 AM",
      yesterday: "Fixed the auth token expiry bug in prod.",
      today: "Writing unit tests for the new payments module.",
      blockers: "Waiting on API docs from Stripe.",
    },
    {
      name: "Sara Malik",
      role: "Design",
      avatar: "SM",
      avatarBg: "rgba(124,58,237,0.15)",
      avatarColor: "#c4b5fd",
      time: "9:18 AM",
      yesterday: "Delivered final specs for onboarding flow.",
      today: "User interviews at 2pm, then iterating on V2 mockups.",
      blockers: null,
    },
  ];

  const sidebarStandups = [
    { name: "Daily Engineering", members: 8, color: "#22c55e", active: true },
    { name: "Design Team", members: 5, color: "#f59e0b", active: false },
    { name: "All Hands", members: 24, color: "#f59e0b", active: false },
    { name: "Product Weekly", members: 11, color: "#94a3b8", active: false },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark ? "#141416" : "var(--bg-page)",
        ...(dark
          ? {
              "--bg-page": "#141416",
              "--bg-card": "#1a1b1f",
              "--bg-card-alt": "#17181c",
              "--bg-card-hover": "#202127",
              "--bg-subtle": "#202127",
              "--bg-muted": "#2a2b31",
              "--border": "#2a2b31",
              "--border-subtle": "#2a2b31",
              "--border-faint": "#242428",
              "--text-primary": "#f3f4f6",
              "--text-secondary": "#d1d5db",
              "--text-tertiary": "#9ca3af",
              "--text-muted": "#6b7280",
              "--text-faint": "#4b5563",
            }
          : {}),
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          padding: "20px 28px",
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 26,
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          Standups
        </h1>
        <p style={{ margin: 0, color: "var(--text-tertiary)", fontSize: 13 }}>
          Async check-ins · AI summaries · Zero extra meetings
        </p>
      </div>

      <div style={{ padding: "0 28px 40px" }}>
        {/* Blurred KPI strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 12,
            marginBottom: 24,
            filter: "blur(6px)",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.45,
          }}
        >
          {[
            ["#3b82f6", "4", "Active Standups"],
            ["#22c55e", "87%", "Response Rate"],
            ["#f59e0b", "14", "Day Streak"],
            ["#8b5cf6", "24", "Team Members"],
          ].map(([color, val, label]) => (
            <div
              key={label}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color,
                }}
              >
                <MessageSquare size={18} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    lineHeight: 1,
                  }}
                >
                  {val}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 3,
                    fontWeight: 500,
                  }}
                >
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paywall card */}
        <div
          style={{
            position: "relative",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          {/* Blurred mock UI */}
          <div
            style={{
              filter: "blur(5px)",
              pointerEvents: "none",
              userSelect: "none",
              opacity: 0.3,
              borderBottom: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex" }}>
              {/* Sidebar */}
              <div
                style={{
                  width: 200,
                  borderRight: "1px solid var(--border-subtle)",
                  padding: "16px 12px",
                  background: "var(--bg-card-alt)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                    paddingLeft: 8,
                  }}
                >
                  ACTIVE STANDUPS
                </div>
                {sidebarStandups.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "9px 10px",
                      borderRadius: 10,
                      marginBottom: 3,
                      background: s.active ? "var(--accent-bg)" : "transparent",
                      border: s.active
                        ? "1px solid var(--accent-border)"
                        : "1px solid transparent",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: s.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: s.active
                            ? "var(--accent)"
                            : "var(--text-secondary)",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.name}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        paddingLeft: 13,
                        marginTop: 1,
                      }}
                    >
                      {s.members} members
                    </div>
                  </div>
                ))}
              </div>
              {/* Main */}
              <div style={{ flex: 1, padding: "16px 20px", minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--text-primary)",
                      }}
                    >
                      Daily Engineering Standup
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-tertiary)",
                        display: "flex",
                        gap: 8,
                        marginTop: 2,
                      }}
                    >
                      <span>Today, Mar 29</span>
                      <span>·</span>
                      <span style={{ color: "#22c55e", fontWeight: 700 }}>
                        ● 6/8 responded
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {mockStandups.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 12,
                        padding: "12px 14px",
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: m.avatarBg,
                          color: m.avatarColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {m.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--text-primary)",
                            }}
                          >
                            {m.name}
                          </span>
                          <span
                            style={{ fontSize: 10, color: "var(--text-muted)" }}
                          >
                            {m.role}
                          </span>
                          <span
                            style={{
                              marginLeft: "auto",
                              fontSize: 10,
                              color: "var(--text-muted)",
                            }}
                          >
                            {m.time}
                          </span>
                        </div>
                        {[
                          {
                            label: "Yesterday",
                            text: m.yesterday,
                            color: "#3b82f6",
                          },
                          { label: "Today", text: m.today, color: "#22c55e" },
                          ...(m.blockers
                            ? [
                                {
                                  label: "Blockers",
                                  text: m.blockers,
                                  color: "#ef4444",
                                },
                              ]
                            : []),
                        ].map((row, j) => (
                          <div key={j} style={{ display: "flex", gap: 6 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: row.color,
                                width: 54,
                                flexShrink: 0,
                              }}
                            >
                              {row.label}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--text-secondary)",
                                lineHeight: 1.5,
                              }}
                            >
                              {row.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gradient overlay */}
          <div
            style={{
              position: "relative",
              padding: "48px 40px 44px",
              marginTop: -400,
              background:
                "linear-gradient(180deg, transparent 0%, var(--bg-card) 8%)",
            }}
          >
            {/* Pro badge */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 14px",
                  background: "var(--accent-bg)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: 30,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Lock size={10} color="#fff" />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Pro Feature
                </span>
              </div>
            </div>

            {/* Headline */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 30,
                  fontWeight: 900,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.15,
                }}
              >
                Ditch status meetings with
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Async Standups
                </span>
              </h2>
            </div>
            <p
              style={{
                textAlign: "center",
                fontSize: 15,
                color: "var(--text-tertiary)",
                maxWidth: 480,
                margin: "0 auto 36px",
                lineHeight: 1.6,
              }}
            >
              A complete async check-in system — from team prompts and smart
              reminders to AI-generated summaries, participation tracking, and
              full org visibility.
            </p>

            {/* Feature grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 12,
                maxWidth: 760,
                margin: "0 auto 36px",
              }}
            >
              {features.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 18px",
                    background: "var(--bg-card-alt)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: 3,
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-tertiary)",
                        lineHeight: 1.5,
                      }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div
              style={{
                maxWidth: 760,
                margin: "0 auto 36px",
                background: "var(--bg-card-alt)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: "0.07em",
                  marginBottom: 16,
                }}
              >
                HOW IT WORKS
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {[
                  {
                    label: "Create Standup",
                    sub: "Set prompts & schedule",
                    color: "#3b82f6",
                    icon: <Plus size={14} />,
                  },
                  {
                    label: "Team Responds",
                    sub: "Async, on their time",
                    color: "#6366f1",
                    icon: <MessageSquare size={14} />,
                  },
                  {
                    label: "AI Summarises",
                    sub: "Blockers surfaced auto",
                    color: "#8b5cf6",
                    icon: <Sparkles size={14} />,
                  },
                  {
                    label: "Stay Aligned",
                    sub: "Full visibility for all",
                    color: "#10b981",
                    icon: <Users size={14} />,
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: `${s.color}18`,
                          border: `1.5px solid ${s.color}35`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: s.color,
                          margin: "0 auto 8px",
                        }}
                      >
                        {s.icon}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginBottom: 2,
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          lineHeight: 1.4,
                        }}
                      >
                        {s.sub}
                      </div>
                    </div>
                    {i < 3 && (
                      <div
                        style={{
                          flexShrink: 0,
                          padding: "0 4px",
                          color: "var(--text-faint)",
                        }}
                      >
                        <ChevronRight size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sample standup table */}
            <div
              style={{
                maxWidth: 760,
                margin: "0 auto 36px",
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--bg-card-alt)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  Sample Standup
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    background: "var(--bg-muted)",
                    padding: "1px 7px",
                    borderRadius: 5,
                    fontWeight: 600,
                  }}
                >
                  Preview
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--present-color)",
                    background: "var(--present-bg)",
                    padding: "2px 9px",
                    borderRadius: 5,
                    border: "1px solid var(--present-border)",
                  }}
                >
                  ● 3/3 responded
                </span>
              </div>
              {mockStandups.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 1fr",
                    gap: 12,
                    padding: "14px 16px",
                    borderBottom:
                      i < mockStandups.length - 1
                        ? "1px solid var(--border-subtle)"
                        : "none",
                    background:
                      i % 2 === 0 ? "var(--bg-card)" : "var(--bg-card-alt)",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: m.avatarBg,
                      color: m.avatarColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {m.avatar}
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {m.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-tertiary)",
                          background: "var(--bg-subtle)",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        {m.role}
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          color: "var(--text-muted)",
                        }}
                      >
                        {m.time}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {[
                        {
                          label: "Yesterday",
                          text: m.yesterday,
                          color: "#3b82f6",
                        },
                        { label: "Today", text: m.today, color: "#22c55e" },
                        ...(m.blockers
                          ? [
                              {
                                label: "Blockers",
                                text: m.blockers,
                                color: "#ef4444",
                              },
                            ]
                          : []),
                      ].map((row, j) => (
                        <div key={j} style={{ display: "flex", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: row.color,
                              width: 58,
                              flexShrink: 0,
                            }}
                          >
                            {row.label}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--text-secondary)",
                              lineHeight: 1.5,
                            }}
                          >
                            {row.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ textAlign: "center" }}>
              <a
                href="/subscription"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 32px",
                  background: "linear-gradient(135deg,#1e40af 0%,#7c3aed 100%)",
                  color: "#fff",
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 15,
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 32px rgba(99,102,241,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 24px rgba(99,102,241,0.35)";
                }}
              >
                <Zap size={16} fill="currentColor" />
                Upgrade to unlock Standups
                <ArrowRight size={16} />
              </a>
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Upgrade your plan to access the full Standups module and all Pro
                features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AdminStandupStats() {
  const navigate = useNavigate();
  const [dark, setDark] = useState(getIsDarkTheme);
  const [rootEl, setRootEl] = useState(null); // ref to the root wrapper

  // Derive CSS-variable-based tokens whenever theme or rootEl changes
  const standupStatusCfg = useMemo(() => getTokens(rootEl), [rootEl, dark]);
  const projectStatusCfg = useMemo(
    () => getProjStatusTokens(rootEl),
    [rootEl, dark],
  );

  const [tenantId, setTenantId] = useState(null);
  const [orgPlan, setOrgPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
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
        setTenantId(profile?.tenant_id ?? null);
        if (profile?.tenant_id) {
          const { data: org } = await supabase
            .from("tenants")
            .select("plan")
            .eq("id", profile.tenant_id)
            .single();
          setOrgPlan(org?.plan ?? null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setPlanLoading(false);
      }
    };
    init();
  }, []);

  const [selectedMonth, setMonth] = useState(dayjs());
  const [view, setView] = useState(VIEW.PROJECTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectSummaries, setProjectSummaries] = useState({});
  const [activeProject, setActiveProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [summaryModal, setSummaryModal] = useState(null);

  // Listen for theme changes
  useEffect(() => {
    const update = () => setDark(getIsDarkTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("themeModeChanged", update);
    mq.addEventListener("change", update);
    return () => {
      window.removeEventListener("themeModeChanged", update);
      mq.removeEventListener("change", update);
    };
  }, []);

  // Re-read CSS variables once rootEl and dark are both settled
  useEffect(() => {
    if (rootEl) {
      /* trigger useMemo re-run */
    }
  }, [rootEl, dark]);

  // ── Load projects ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingProjects(true);
        const { data, error } = await supabase
          .from("projects")
          .select("id,name,status,priority,client_name,project_manager_id")
          .eq("tenant_id", tenantId)
          .eq("is_archived", false)
          .order("name");
        if (!mounted) return;
        if (error) console.error(error.message);
        else setProjects(data ?? []);
      } finally {
        if (mounted) setLoadingProjects(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tenantId]);

  useEffect(() => {
    if (!projects.length || !tenantId) return;
    (async () => {
      const start = selectedMonth.startOf("month").format("YYYY-MM-DD");
      const end = selectedMonth.endOf("month").format("YYYY-MM-DD");
      const { data: sessData } = await supabase
        .from("standup_sessions")
        .select("project_id,date,attendance")
        .in(
          "project_id",
          projects.map((p) => p.id),
        )
        .gte("date", start)
        .lte("date", end);
      const { data: assigneeData } = await supabase
        .from("project_assignees")
        .select("project_id,employee_id")
        .in(
          "project_id",
          projects.map((p) => p.id),
        );
      const teamSizes = {};
      (assigneeData ?? []).forEach((a) => {
        teamSizes[a.project_id] = (teamSizes[a.project_id] || 0) + 1;
      });
      const summaries = {};
      (sessData ?? []).forEach((s) => {
        if (!summaries[s.project_id])
          summaries[s.project_id] = { sessions: 0, p: 0, a: 0, l: 0 };
        summaries[s.project_id].sessions++;
        Object.values(s.attendance ?? {}).forEach((v) => {
          if (v === "present") summaries[s.project_id].p++;
          else if (v === "absent") summaries[s.project_id].a++;
          else if (v === "late") summaries[s.project_id].l++;
        });
      });
      projects.forEach((p) => {
        if (!summaries[p.id])
          summaries[p.id] = { sessions: 0, p: 0, a: 0, l: 0 };
        summaries[p.id].teamSize = teamSizes[p.id] || 0;
      });
      setProjectSummaries(summaries);
    })();
  }, [projects, selectedMonth, tenantId]);

  const openDetail = async (project) => {
    setActiveProject(project);
    setView(VIEW.PROJECT_DETAIL);
    setLoadingDetail(true);
    setEmployees([]);
    setSessions([]);
    const { data: assigneeRows } = await supabase
      .from("project_assignees")
      .select("employee_id")
      .eq("project_id", project.id);
    const ids = (assigneeRows ?? []).map((r) => r.employee_id);
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,job_title,department,user_photo")
        .in("id", ids)
        .eq("tenant_id", tenantId)
        .eq("suspended", false);
      setEmployees(profiles ?? []);
    }
    const start = selectedMonth.startOf("month").format("YYYY-MM-DD");
    const end = selectedMonth.endOf("month").format("YYYY-MM-DD");
    const { data: sess } = await supabase
      .from("standup_sessions")
      .select("id,date,attendance,summary")
      .eq("project_id", project.id)
      .gte("date", start)
      .lte("date", end)
      .order("date");
    setSessions(sess ?? []);
    setLoadingDetail(false);
  };

  const goBack = () => {
    setView(VIEW.PROJECTS);
    setActiveProject(null);
    setEmployees([]);
    setSessions([]);
  };

  const today = dayjs().format("YYYY-MM-DD");
  const weekdays = useMemo(
    () => getWeekdaysInMonth(selectedMonth.year(), selectedMonth.month() + 1),
    [selectedMonth],
  );

  const sessionMap = useMemo(() => {
    const m = {};
    sessions.forEach((s) => {
      m[s.date] = {
        attendance: s.attendance ?? {},
        summary: s.summary || null,
        id: s.id,
      };
    });
    return m;
  }, [sessions]);

  const employeeStats = useMemo(
    () =>
      employees.map((emp) => {
        let present = 0,
          absent = 0,
          late = 0,
          noStandup = 0;
        weekdays.forEach((d) => {
          if (d > today) return;
          const sess = sessionMap[d];
          if (!sess) {
            noStandup++;
            return;
          }
          const s = sess.attendance[emp.id];
          if (s === "present") present++;
          else if (s === "absent") absent++;
          else if (s === "late") late++;
          else noStandup++;
        });
        const marked = present + absent + late;
        return {
          ...emp,
          present,
          absent,
          late,
          noStandup,
          rate: marked > 0 ? Math.round(((present + late) / marked) * 100) : 0,
        };
      }),
    [employees, weekdays, sessionMap, today],
  );

  const sortedStats = useMemo(
    () => [...employeeStats].sort((a, b) => b.rate - a.rate),
    [employeeStats],
  );

  const overall = useMemo(() => {
    let p = 0,
      a = 0,
      l = 0;
    sessions.forEach((s) => {
      Object.values(s.attendance ?? {}).forEach((v) => {
        if (v === "present") p++;
        else if (v === "absent") a++;
        else if (v === "late") l++;
      });
    });
    return {
      totalSessions: sessions.length,
      pastDays: weekdays.filter((d) => d <= today).length,
      p,
      a,
      l,
    };
  }, [sessions, weekdays, today]);

  const weeks = useMemo(() => {
    const g = [];
    let w = [];
    weekdays.forEach((d, i) => {
      w.push(d);
      if (dayjs(d).day() === 5 || i === weekdays.length - 1) {
        g.push(w);
        w = [];
      }
    });
    return g;
  }, [weekdays]);

  const allPastSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.date <= today)
        .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix()),
    [sessions, today],
  );
  const sessionsWithSummary = useMemo(
    () => allPastSessions.filter((s) => s.summary?.trim()),
    [allPastSessions],
  );

  const globalStats = useMemo(() => {
    const totalSessions = Object.values(projectSummaries).reduce(
      (s, c) => s + c.sessions,
      0,
    );
    const totalP = Object.values(projectSummaries).reduce((s, c) => s + c.p, 0);
    const totalA = Object.values(projectSummaries).reduce((s, c) => s + c.a, 0);
    const totalL = Object.values(projectSummaries).reduce((s, c) => s + c.l, 0);
    const marked = totalP + totalA + totalL;
    return {
      totalSessions,
      totalP,
      totalA,
      totalL,
      overallRate:
        marked > 0 ? Math.round(((totalP + totalL) / marked) * 100) : 0,
      projectsWithStandups: Object.values(projectSummaries).filter(
        (c) => c.sessions > 0,
      ).length,
    };
  }, [projectSummaries]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((p) => {
        const matchSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.client_name || "").toLowerCase().includes(search.toLowerCase());
        const matchStatus =
          !statusFilter || (p.status || "").toLowerCase() === statusFilter;
        return matchSearch && matchStatus;
      }),
    [projects, search, statusFilter],
  );

  // ── helpers for colour-coded rate ─────────────────────────────────────────
  const rateColor = (r) =>
    r >= 80
      ? "var(--present-color)"
      : r >= 60
        ? "var(--late-color)"
        : "var(--absent-color)";
  const rateBg = (r) =>
    r >= 80
      ? "var(--present-bg)"
      : r >= 60
        ? "var(--late-bg)"
        : "var(--absent-bg)";
  const rateBd = (r) =>
    r >= 80
      ? "var(--present-border)"
      : r >= 60
        ? "var(--late-border)"
        : "var(--absent-border)";

  // ── Calendar columns ──────────────────────────────────────────────────────
  const calendarColumns = useMemo(
    () => [
      {
        title: (
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Member
          </Text>
        ),
        key: "member",
        fixed: "left",
        width: 230,
        render: (_, rec, i) => (
          <Space size={10} style={{ padding: "2px 0" }}>
            <Avatar
              size={32}
              src={rec.user_photo}
              style={{
                background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {!rec.user_photo && getInitials(rec.full_name)}
            </Avatar>
            <div>
              <Text
                strong
                style={{
                  fontSize: 13,
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  display: "block",
                }}
              >
                {rec.full_name}
              </Text>
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {rec.job_title || rec.department || "—"}
              </Text>
            </div>
          </Space>
        ),
      },
      ...weekdays.map((date) => {
        const d = dayjs(date);
        const isFuture = date > today;
        const isToday = date === today;
        const sessData = sessionMap[date];
        const hasSummary = !!sessData?.summary?.trim();
        return {
          title: (
            <Tooltip
              title={
                hasSummary ? (
                  <div style={{ maxWidth: 260 }}>
                    <div
                      style={{ fontWeight: 700, marginBottom: 4, fontSize: 11 }}
                    >
                      {d.format("dddd, MMM DD")}
                    </div>
                    <div
                      style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.9 }}
                    >
                      {sessData.summary}
                    </div>
                  </div>
                ) : (
                  d.format("dddd, MMM DD")
                )
              }
              mouseEnterDelay={0.3}
            >
              <div
                onClick={
                  hasSummary
                    ? () =>
                        setSummaryModal({
                          date,
                          summary: sessData.summary,
                          attendance: sessData.attendance,
                        })
                    : undefined
                }
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  padding: "4px 2px",
                  borderRadius: 6,
                  background: isToday ? "var(--text-primary)" : "transparent",
                  minWidth: 26,
                  cursor: hasSummary ? "pointer" : "default",
                  position: "relative",
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    lineHeight: 1,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: isToday ? "var(--bg-page)" : "var(--text-muted)",
                  }}
                >
                  {d.format("dd")[0]}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isToday ? 800 : 600,
                    lineHeight: 1,
                    color: isToday ? "var(--bg-page)" : "var(--text-secondary)",
                  }}
                >
                  {d.format("D")}
                </Text>
                {hasSummary && (
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: isToday
                        ? "var(--accent-border)"
                        : "var(--accent)",
                      marginTop: 1,
                    }}
                  />
                )}
              </div>
            </Tooltip>
          ),
          key: date,
          width: 34,
          align: "center",
          render: (_, rec) => {
            if (isFuture)
              return (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: "var(--bg-subtle)",
                    margin: "0 auto",
                  }}
                />
              );
            if (!sessData)
              return (
                <Tooltip title="No standup held">
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border)",
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 8,
                        color: "var(--text-faint)",
                        fontWeight: 700,
                      }}
                    >
                      —
                    </Text>
                  </div>
                </Tooltip>
              );
            const status = sessData.attendance[rec.id];
            const cfg = standupStatusCfg[status] || standupStatusCfg.none;
            return (
              <Tooltip
                title={
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        marginBottom: hasSummary ? 6 : 0,
                      }}
                    >
                      {d.format("MMM DD")} · {cfg.label}
                    </div>
                    {hasSummary && (
                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.85,
                          lineHeight: 1.5,
                          maxWidth: 220,
                        }}
                      >
                        {sessData.summary}
                      </div>
                    )}
                  </div>
                }
                mouseEnterDelay={0.2}
              >
                <div
                  onClick={
                    hasSummary
                      ? () =>
                          setSummaryModal({
                            date,
                            summary: sessData.summary,
                            attendance: sessData.attendance,
                          })
                      : undefined
                  }
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: cfg.color,
                    cursor: hasSummary ? "pointer" : "default",
                  }}
                >
                  {cfg.icon}
                </div>
              </Tooltip>
            );
          },
        };
      }),
      {
        title: (
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Rate
          </Text>
        ),
        key: "rate",
        width: 100,
        fixed: "right",
        align: "center",
        sorter: (a, b) => a.rate - b.rate,
        defaultSortOrder: "descend",
        render: (_, rec) => (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: rateColor(rec.rate),
                lineHeight: 1,
              }}
            >
              {rec.rate}%
            </Text>
            <Progress
              percent={rec.rate}
              size="small"
              showInfo={false}
              strokeColor={rateColor(rec.rate)}
              trailColor="var(--bg-subtle)"
              style={{ width: 58, margin: 0 }}
            />
          </div>
        ),
      },
      {
        title: (
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            P · A · L
          </Text>
        ),
        key: "pal",
        width: 90,
        fixed: "right",
        align: "center",
        render: (_, rec) => (
          <Space size={3}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--present-color)",
              }}
            >
              {rec.present}
            </Text>
            <Text style={{ color: "var(--border)", fontSize: 10 }}>·</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--absent-color)",
              }}
            >
              {rec.absent}
            </Text>
            <Text style={{ color: "var(--border)", fontSize: 10 }}>·</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--late-color)",
              }}
            >
              {rec.late}
            </Text>
          </Space>
        ),
      },
    ],
    [weekdays, sessionMap, today, standupStatusCfg],
  );

  // ── Projects table columns ─────────────────────────────────────────────────
  const projectColumns = [
    {
      title: "Project",
      key: "project",
      render: (_, rec) => (
        <div>
          <Text
            strong
            style={{
              fontSize: 14,
              color: "var(--text-primary)",
              display: "block",
              lineHeight: 1.3,
            }}
          >
            {rec.name}
          </Text>
          {rec.client_name && (
            <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {rec.client_name}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const k = (status || "").toLowerCase();
        const cfg = projectStatusCfg[k] || {
          color: "var(--text-tertiary)",
          bg: "var(--bg-card-alt)",
          border: "var(--border)",
        };
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              borderRadius: 20,
              border: `1px solid ${cfg.border}`,
              background: cfg.bg,
              fontSize: 12,
              fontWeight: 600,
              color: cfg.color,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: cfg.color,
                display: "inline-block",
              }}
            />
            {capitalize(status || "—")}
          </span>
        );
      },
    },
    {
      title: "Team",
      key: "team",
      width: 80,
      align: "center",
      render: (_, rec) => {
        const s = projectSummaries[rec.id];
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              justifyContent: "center",
            }}
          >
            <TeamOutlined
              style={{ color: "var(--text-muted)", fontSize: 12 }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-secondary)",
              }}
            >
              {s?.teamSize ?? 0}
            </Text>
          </div>
        );
      },
    },
    {
      title: `Standups (${selectedMonth.format("MMM YY")})`,
      key: "sessions",
      width: 140,
      align: "center",
      render: (_, rec) => {
        const s = projectSummaries[rec.id];
        const pastDays = weekdays.filter((d) => d <= today).length;
        if (!s || s.sessions === 0)
          return (
            <Text
              style={{
                fontSize: 12,
                color: "var(--text-faint)",
                fontWeight: 600,
              }}
            >
              0 / {pastDays}
            </Text>
          );
        const pct =
          pastDays > 0 ? Math.round((s.sessions / pastDays) * 100) : 0;
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Text
              style={{ fontSize: 13, fontWeight: 700, color: rateColor(pct) }}
            >
              {s.sessions}{" "}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                }}
              >
                / {pastDays}
              </Text>
            </Text>
            <Progress
              percent={pct}
              size="small"
              showInfo={false}
              strokeColor={rateColor(pct)}
              trailColor="var(--bg-subtle)"
              style={{ width: 70, margin: 0 }}
            />
          </div>
        );
      },
      sorter: (a, b) =>
        (projectSummaries[a.id]?.sessions || 0) -
        (projectSummaries[b.id]?.sessions || 0),
    },
    {
      title: "Attendance",
      key: "attendance",
      width: 200,
      render: (_, rec) => {
        const s = projectSummaries[rec.id];
        if (!s || s.sessions === 0)
          return (
            <Text style={{ fontSize: 12, color: "var(--text-faint)" }}>
              No standups
            </Text>
          );
        const marked = s.p + s.a + s.l;
        const rate = marked > 0 ? Math.round(((s.p + s.l) / marked) * 100) : 0;
        return (
          <Space size={8}>
            <Space size={4}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--present-color)",
                }}
              >
                {s.p}P
              </Text>
              <Text style={{ color: "var(--border)" }}>·</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--absent-color)",
                }}
              >
                {s.a}A
              </Text>
              <Text style={{ color: "var(--border)" }}>·</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--late-color)",
                }}
              >
                {s.l}L
              </Text>
            </Space>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: rateColor(rate),
                background: rateBg(rate),
                padding: "1px 8px",
                borderRadius: 20,
              }}
            >
              {rate}%
            </span>
          </Space>
        );
      },
      sorter: (a, b) => {
        const sa = projectSummaries[a.id];
        const sb = projectSummaries[b.id];
        return (
          (sa
            ? Math.round(
                ((sa.p + sa.l) / Math.max(sa.p + sa.a + sa.l, 1)) * 100,
              )
            : 0) -
          (sb
            ? Math.round(
                ((sb.p + sb.l) / Math.max(sb.p + sb.a + sb.l, 1)) * 100,
              )
            : 0)
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 140,
      render: (_, rec) => (
        <Button
          icon={<BarChartOutlined />}
          onClick={() => openDetail(rec)}
          style={{
            borderRadius: 8,
            height: 34,
            paddingInline: 16,
            fontWeight: 600,
            fontSize: 13,
            background: "var(--text-primary)",
            border: "none",
            color: "var(--bg-page)",
            boxShadow: "var(--shadow-btn)",
          }}
        >
          View Stats
        </Button>
      ),
    },
  ];

  const isFreePlan = orgPlan != null && orgPlan.trim().toLowerCase() === "free";

  // ── Loading ────────────────────────────────────────────────────────────────
  if (planLoading) {
    return (
      <div
        className={`sp-root${dark ? " dark" : ""}`}
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-page)",
        }}
      >
        <style>{THEME_STYLES}</style>
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <p
            style={{ marginTop: 16, color: "var(--text-muted)", fontSize: 13 }}
          >
            Loading your workspace…
          </p>
        </div>
      </div>
    );
  }

  // ── Free-plan paywall ──────────────────────────────────────────────────────
  if (isFreePlan) {
    return (
      <div
        ref={setRootEl}
        className={`sp-root${dark ? " dark" : ""}`}
        style={{
          minHeight: "100vh",
          background: dark ? "#141416" : "var(--bg-page)",
        }}
      >
        <style>{THEME_STYLES}</style>
        <FreeStandupPaywall navigate={navigate} dark={dark} />
      </div>
    );
  }

  // ── Full paid view ─────────────────────────────────────────────────────────
  return (
    <div
      ref={setRootEl}
      className={`sp-root${dark ? " dark" : ""}`}
      style={{ minHeight: "100vh", background: "var(--bg-page)" }}
    >
      <style>{THEME_STYLES}</style>

      {/* ── Header ── */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 40px",
          background: "var(--bg-card)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 0",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {view === VIEW.PROJECT_DETAIL && (
              <button
                onClick={goBack}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  cursor: "pointer",
                  color: "var(--text-tertiary)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <ArrowLeftOutlined style={{ fontSize: 11 }} /> Back
              </button>
            )}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 2,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--text-primary)",
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {view === VIEW.PROJECT_DETAIL
                    ? `${activeProject?.name} · Detail`
                    : "Admin · Standup Stats"}
                </Text>
              </div>
              <Title
                level={4}
                style={{
                  margin: 0,
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  color: "var(--text-primary)",
                }}
              >
                {view === VIEW.PROJECT_DETAIL
                  ? `Attendance · ${selectedMonth.format("MMMM YYYY")}`
                  : "Standup Overview"}
              </Title>
            </div>
          </div>
          <Space wrap>
            {view === VIEW.PROJECTS && (
              <>
                <Input
                  placeholder="Search projects…"
                  prefix={
                    <SearchOutlined style={{ color: "var(--text-muted)" }} />
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 200, borderRadius: 8 }}
                  allowClear
                />
                <Select
                  placeholder="All statuses"
                  style={{ width: 150 }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  allowClear
                  popupClassName="sp-select-dropdown"
                >
                  {[
                    "active",
                    "in progress",
                    "planning",
                    "review",
                    "completed",
                  ].map((s) => (
                    <Option key={s} value={s}>
                      {capitalize(s)}
                    </Option>
                  ))}
                </Select>
              </>
            )}
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(d) => {
                if (d) {
                  setMonth(d);
                  if (view === VIEW.PROJECT_DETAIL && activeProject)
                    openDetail(activeProject);
                }
              }}
              disabledDate={(d) => d && d > dayjs().endOf("month")}
              format="MMMM YYYY"
              style={{ width: 155 }}
              allowClear={false}
              suffixIcon={
                <CalendarOutlined style={{ color: "var(--text-muted)" }} />
              }
            />
          </Space>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "28px 40px" }}>
        {/* ════════════ PROJECTS VIEW ════════════ */}
        {view === VIEW.PROJECTS && (
          <>
            {/* Stat cards */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 24,
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  icon: <FolderOutlined />,
                  label: "Total Projects",
                  value: projects.length,
                  sub: `${globalStats.projectsWithStandups} with standups this month`,
                  color: "var(--text-primary)",
                  bg: "var(--bg-card-alt)",
                  border: "var(--border)",
                },
                {
                  icon: <CalendarOutlined />,
                  label: "Total Standups",
                  value: globalStats.totalSessions,
                  sub: selectedMonth.format("MMMM YYYY"),
                  color: "var(--accent)",
                  bg: "var(--accent-bg)",
                  border: "var(--accent-border)",
                },
                {
                  icon: <CheckOutlined />,
                  label: "Total Present",
                  value: globalStats.totalP,
                  sub:
                    globalStats.totalP +
                      globalStats.totalA +
                      globalStats.totalL >
                    0
                      ? `${Math.round((globalStats.totalP / (globalStats.totalP + globalStats.totalA + globalStats.totalL)) * 100)}% of marked`
                      : "No data",
                  color: "var(--present-color)",
                  bg: "var(--present-bg)",
                  border: "var(--present-border)",
                },
                {
                  icon: <CloseOutlined />,
                  label: "Total Absent",
                  value: globalStats.totalA,
                  sub:
                    globalStats.totalP +
                      globalStats.totalA +
                      globalStats.totalL >
                    0
                      ? `${Math.round((globalStats.totalA / (globalStats.totalP + globalStats.totalA + globalStats.totalL)) * 100)}% of marked`
                      : "No data",
                  color: "var(--absent-color)",
                  bg: "var(--absent-bg)",
                  border: "var(--absent-border)",
                },
                {
                  icon: <RiseOutlined />,
                  label: "Overall Attend. Rate",
                  value: `${globalStats.overallRate}%`,
                  sub: "present + late / total marked",
                  color: rateColor(globalStats.overallRate),
                  bg: rateBg(globalStats.overallRate),
                  border: rateBd(globalStats.overallRate),
                },
              ].map(({ icon, label, value, sub, color, bg, border }) => (
                <div
                  key={label}
                  style={{
                    flex: "1 1 150px",
                    minWidth: 140,
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: `1px solid ${border}`,
                    background: bg,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 7,
                    }}
                  >
                    <span style={{ color, fontSize: 12 }}>{icon}</span>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {label}
                    </Text>
                  </div>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color,
                      display: "block",
                      lineHeight: 1,
                      marginBottom: 3,
                    }}
                  >
                    {value}
                  </Text>
                  <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {sub}
                  </Text>
                </div>
              ))}
            </div>

            {/* Projects table */}
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                overflow: "hidden",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-faint)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Space>
                  <FolderOutlined style={{ color: "var(--text-muted)" }} />
                  <Text
                    strong
                    style={{ fontSize: 14, color: "var(--text-primary)" }}
                  >
                    All Projects
                  </Text>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-tertiary)",
                      background: "var(--bg-subtle)",
                      borderRadius: 20,
                      padding: "1px 10px",
                    }}
                  >
                    {filteredProjects.length}
                  </span>
                </Space>
                <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Click "View Stats" to drill into any project
                </Text>
              </div>
              {loadingProjects ? (
                <ProjectListSkeleton />
              ) : filteredProjects.length === 0 ? (
                <Empty
                  description={<Text type="secondary">No projects found</Text>}
                  style={{ padding: 64 }}
                />
              ) : (
                <Table
                  dataSource={filteredProjects}
                  columns={projectColumns}
                  rowKey="id"
                  pagination={{
                    pageSize: 15,
                    showSizeChanger: false,
                    showTotal: (t) => `${t} projects`,
                  }}
                  rowClassName="proj-row"
                  style={{ borderRadius: 0 }}
                />
              )}
            </div>
          </>
        )}

        {/* ════════════ PROJECT DETAIL VIEW ════════════ */}
        {view === VIEW.PROJECT_DETAIL && (
          <>
            {loadingDetail ? (
              <div style={{ paddingTop: 10 }}>
                <ProjectDetailSkeleton />
              </div>
            ) : (
              <>
                {/* Project strip */}
                <div
                  style={{
                    background: "var(--bg-card)",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    padding: "16px 20px",
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 20,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "var(--bg-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FolderOutlined
                        style={{ color: "var(--text-secondary)", fontSize: 18 }}
                      />
                    </div>
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: 15,
                          color: "var(--text-primary)",
                          display: "block",
                          lineHeight: 1.2,
                        }}
                      >
                        {activeProject?.name}
                      </Text>
                      {activeProject?.client_name && (
                        <Text
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          {activeProject.client_name}
                        </Text>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      height: 32,
                      width: 1,
                      background: "var(--border)",
                    }}
                  />
                  {[
                    {
                      label: "Status",
                      value: capitalize(activeProject?.status || "—"),
                      color:
                        projectStatusCfg[
                          (activeProject?.status || "").toLowerCase()
                        ]?.color || "var(--text-tertiary)",
                    },
                    {
                      label: "Team Size",
                      value: `${employees.length} members`,
                    },
                    {
                      label: "Standups Held",
                      value: `${overall.totalSessions} / ${overall.pastDays}`,
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          display: "block",
                          marginBottom: 2,
                        }}
                      >
                        {label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: color || "var(--text-primary)",
                        }}
                      >
                        {value}
                      </Text>
                    </div>
                  ))}
                </div>

                {/* Summary stat cards */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 22,
                    flexWrap: "wrap",
                  }}
                >
                  {(() => {
                    const marked = overall.p + overall.a + overall.l;
                    const pct = (v) =>
                      marked > 0
                        ? `${Math.round((v / marked) * 100)}% of marked`
                        : "No data";
                    const attRate =
                      marked > 0
                        ? Math.round(((overall.p + overall.l) / marked) * 100)
                        : 0;
                    return [
                      {
                        icon: <CalendarOutlined />,
                        label: "Standups Held",
                        value: overall.totalSessions,
                        sub: `of ${overall.pastDays} weekdays`,
                        color: "var(--text-primary)",
                        bg: "var(--bg-card-alt)",
                        border: "var(--border)",
                      },
                      {
                        icon: <CheckOutlined />,
                        label: "Present",
                        value: overall.p,
                        sub: pct(overall.p),
                        color: "var(--present-color)",
                        bg: "var(--present-bg)",
                        border: "var(--present-border)",
                      },
                      {
                        icon: <CloseOutlined />,
                        label: "Absent",
                        value: overall.a,
                        sub: pct(overall.a),
                        color: "var(--absent-color)",
                        bg: "var(--absent-bg)",
                        border: "var(--absent-border)",
                      },
                      {
                        icon: <ClockCircleOutlined />,
                        label: "Late",
                        value: overall.l,
                        sub: pct(overall.l),
                        color: "var(--late-color)",
                        bg: "var(--late-bg)",
                        border: "var(--late-border)",
                      },
                      {
                        icon: <RiseOutlined />,
                        label: "Attend. Rate",
                        value: `${attRate}%`,
                        sub: "team avg (present + late)",
                        color: "#0ea5e9",
                        bg: "rgba(14,165,233,0.1)",
                        border: "rgba(14,165,233,0.25)",
                      },
                    ];
                  })().map(({ icon, label, value, sub, color, bg, border }) => (
                    <div
                      key={label}
                      style={{
                        flex: "1 1 130px",
                        minWidth: 120,
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: `1px solid ${border}`,
                        background: bg,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 7,
                        }}
                      >
                        <span style={{ color, fontSize: 12 }}>{icon}</span>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {label}
                        </Text>
                      </div>
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color,
                          display: "block",
                          lineHeight: 1,
                          marginBottom: 3,
                        }}
                      >
                        {value}
                      </Text>
                      <Text
                        style={{ fontSize: 11, color: "var(--text-muted)" }}
                      >
                        {sub}
                      </Text>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {activeProject?.name} · {selectedMonth.format("MMMM YYYY")}
                  </Text>
                  <div
                    style={{
                      height: 12,
                      width: 1,
                      background: "var(--border)",
                    }}
                  />
                  {Object.entries(standupStatusCfg).map(([key, cfg]) => (
                    <div
                      key={key}
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <div
                        style={{
                          width: 13,
                          height: 13,
                          borderRadius: 3,
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: cfg.color,
                        }}
                      >
                        {cfg.icon}
                      </div>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "var(--text-tertiary)",
                          fontWeight: 500,
                        }}
                      >
                        {cfg.label}
                      </Text>
                    </div>
                  ))}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <div
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: 3,
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border)",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "var(--text-tertiary)",
                        fontWeight: 500,
                      }}
                    >
                      Future
                    </Text>
                  </div>
                  {sessionsWithSummary.length > 0 && (
                    <>
                      <div
                        style={{
                          height: 12,
                          width: 1,
                          background: "var(--border)",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "var(--accent)",
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            color: "var(--text-tertiary)",
                            fontWeight: 500,
                          }}
                        >
                          Has summary — click to read
                        </Text>
                      </div>
                    </>
                  )}
                </div>

                {/* Heatmap */}
                {employees.length === 0 ? (
                  <Empty
                    description="No team members assigned"
                    style={{
                      padding: 64,
                      background: "var(--bg-card)",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      background: "var(--bg-card)",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 20px 0",
                        borderBottom: "1px solid var(--border-faint)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ width: 230, flexShrink: 0 }} />
                      <div
                        style={{
                          display: "flex",
                          flex: 1,
                          overflowX: "auto",
                          paddingBottom: 6,
                        }}
                      >
                        {weeks.map((week, wi) => (
                          <div
                            key={wi}
                            style={{
                              minWidth: week.length * 34,
                              textAlign: "center",
                              padding: "0 2px",
                              borderLeft:
                                wi > 0
                                  ? "1px solid var(--border-subtle)"
                                  : "none",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "var(--text-faint)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                              }}
                            >
                              W{dayjs(week[0]).isoWeek()}
                            </Text>
                          </div>
                        ))}
                      </div>
                      <div style={{ width: 190, flexShrink: 0 }} />
                    </div>
                    <Table
                      className="heatmap-table"
                      dataSource={employeeStats}
                      columns={calendarColumns}
                      rowKey="id"
                      pagination={false}
                      scroll={{ x: "max-content" }}
                      size="small"
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                )}

                {/* Daily summaries timeline */}
                <div style={{ marginTop: 28 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Daily Standup Summaries
                      </Text>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--accent)",
                          background: "var(--accent-bg)",
                          borderRadius: 20,
                          padding: "1px 10px",
                          border: "1px solid var(--accent-border)",
                        }}
                      >
                        {sessionsWithSummary.length} / {allPastSessions.length}{" "}
                        have notes
                      </span>
                    </div>
                    <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {selectedMonth.format("MMMM YYYY")} · most recent first
                    </Text>
                  </div>

                  {allPastSessions.length === 0 ? (
                    <div
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        padding: "48px 24px",
                        textAlign: "center",
                      }}
                    >
                      <MessageOutlined
                        style={{
                          fontSize: 32,
                          color: "var(--border)",
                          display: "block",
                          marginBottom: 10,
                        }}
                      />
                      <Text style={{ color: "var(--text-muted)" }}>
                        No standups recorded this month yet
                      </Text>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: 14,
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                        boxShadow: "var(--shadow-card)",
                      }}
                    >
                      {allPastSessions.map((sess, idx) => {
                        const d = dayjs(sess.date);
                        const isToday = sess.date === today;
                        const hasSumm = !!sess.summary?.trim();
                        const att = sess.attendance ?? {};
                        const pCount = Object.values(att).filter(
                          (v) => v === "present",
                        ).length;
                        const aCount = Object.values(att).filter(
                          (v) => v === "absent",
                        ).length;
                        const lCount = Object.values(att).filter(
                          (v) => v === "late",
                        ).length;
                        const total = pCount + aCount + lCount;
                        const rate =
                          total > 0
                            ? Math.round(((pCount + lCount) / total) * 100)
                            : null;
                        return (
                          <div
                            key={sess.id}
                            style={{
                              display: "flex",
                              borderBottom:
                                idx < allPastSessions.length - 1
                                  ? "1px solid var(--border-faint)"
                                  : "none",
                            }}
                          >
                            {/* Date column */}
                            <div
                              style={{
                                width: 88,
                                flexShrink: 0,
                                padding: "18px 12px",
                                borderRight: "1px solid var(--border-subtle)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                gap: 2,
                                background: isToday
                                  ? "var(--accent-bg)"
                                  : "transparent",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "var(--text-muted)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                }}
                              >
                                {d.format("ddd")}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 24,
                                  fontWeight: 800,
                                  color: isToday
                                    ? "var(--accent)"
                                    : "var(--text-primary)",
                                  lineHeight: 1,
                                }}
                              >
                                {d.format("D")}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: "var(--text-muted)",
                                }}
                              >
                                {d.format("MMM")}
                              </Text>
                              {isToday && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: "var(--accent)",
                                    background: "var(--accent-bg)",
                                    borderRadius: 20,
                                    padding: "1px 6px",
                                    border: "1px solid var(--accent-border)",
                                    marginTop: 3,
                                  }}
                                >
                                  TODAY
                                </span>
                              )}
                            </div>
                            {/* Summary column */}
                            <div
                              style={{
                                flex: 1,
                                padding: "18px 22px",
                                minWidth: 0,
                              }}
                            >
                              {hasSumm ? (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 7,
                                      marginBottom: 9,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        background: "var(--accent)",
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "var(--accent)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                      }}
                                    >
                                      Summary
                                    </Text>
                                  </div>
                                  <Text
                                    style={{
                                      fontSize: 13.5,
                                      color: "var(--text-secondary)",
                                      lineHeight: 1.75,
                                      display: "block",
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {sess.summary}
                                  </Text>
                                </>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    paddingTop: 4,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: "var(--border)",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Text
                                    style={{
                                      fontSize: 13,
                                      color: "var(--text-faint)",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    No summary recorded
                                  </Text>
                                </div>
                              )}
                            </div>
                            {/* Attendance column */}
                            <div
                              style={{
                                width: 130,
                                flexShrink: 0,
                                padding: "18px 16px",
                                borderLeft: "1px solid var(--border-subtle)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                justifyContent: "flex-start",
                                gap: 7,
                              }}
                            >
                              {total > 0 ? (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 5,
                                      flexWrap: "wrap",
                                      justifyContent: "flex-end",
                                    }}
                                  >
                                    {pCount > 0 && (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "var(--present-color)",
                                          background: "var(--present-bg)",
                                          borderRadius: 6,
                                          padding: "2px 7px",
                                        }}
                                      >
                                        {pCount}P
                                      </span>
                                    )}
                                    {aCount > 0 && (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "var(--absent-color)",
                                          background: "var(--absent-bg)",
                                          borderRadius: 6,
                                          padding: "2px 7px",
                                        }}
                                      >
                                        {aCount}A
                                      </span>
                                    )}
                                    {lCount > 0 && (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "var(--late-color)",
                                          background: "var(--late-bg)",
                                          borderRadius: 6,
                                          padding: "2px 7px",
                                        }}
                                      >
                                        {lCount}L
                                      </span>
                                    )}
                                  </div>
                                  {rate !== null && (
                                    <Text
                                      style={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: rateColor(rate),
                                        lineHeight: 1,
                                      }}
                                    >
                                      {rate}%
                                    </Text>
                                  )}
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      color: "var(--text-muted)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    attendance
                                  </Text>
                                </>
                              ) : (
                                <Text
                                  style={{
                                    fontSize: 11,
                                    color: "var(--border)",
                                  }}
                                >
                                  —
                                </Text>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Team breakdown */}
                {sortedStats.length > 0 && (
                  <div style={{ marginTop: 28 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        display: "block",
                        marginBottom: 14,
                      }}
                    >
                      Team Breakdown
                    </Text>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(255px, 1fr))",
                        gap: 12,
                      }}
                    >
                      {sortedStats.map((emp, i) => (
                        <div
                          key={emp.id}
                          style={{
                            background: "var(--bg-card)",
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            padding: "16px 18px",
                            boxShadow: "var(--shadow-card)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: 12,
                            }}
                          >
                            <Space size={10}>
                              <Avatar
                                size={36}
                                src={emp.user_photo}
                                style={{
                                  background:
                                    AVATAR_COLORS[i % AVATAR_COLORS.length],
                                  fontSize: 12,
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {!emp.user_photo && getInitials(emp.full_name)}
                              </Avatar>
                              <div>
                                <Text
                                  strong
                                  style={{
                                    fontSize: 13,
                                    color: "var(--text-primary)",
                                    display: "block",
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {emp.full_name}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 11,
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {emp.job_title || emp.department || "—"}
                                </Text>
                              </div>
                            </Space>
                            <div
                              style={{
                                padding: "3px 10px",
                                borderRadius: 20,
                                border: `1px solid ${rateBd(emp.rate)}`,
                                background: rateBg(emp.rate),
                                flexShrink: 0,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: 800,
                                  color: rateColor(emp.rate),
                                }}
                              >
                                {emp.rate}%
                              </Text>
                            </div>
                          </div>
                          <Progress
                            percent={emp.rate}
                            showInfo={false}
                            strokeColor={rateColor(emp.rate)}
                            trailColor="var(--bg-subtle)"
                            size="small"
                            style={{ marginBottom: 12 }}
                          />
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 1fr",
                              gap: 6,
                            }}
                          >
                            {[
                              {
                                label: "Present",
                                value: emp.present,
                                color: "var(--present-color)",
                                bg: "var(--present-bg)",
                              },
                              {
                                label: "Absent",
                                value: emp.absent,
                                color: "var(--absent-color)",
                                bg: "var(--absent-bg)",
                              },
                              {
                                label: "Late",
                                value: emp.late,
                                color: "var(--late-color)",
                                bg: "var(--late-bg)",
                              },
                            ].map(({ label, value, color, bg }) => (
                              <div
                                key={label}
                                style={{
                                  textAlign: "center",
                                  padding: "8px 4px",
                                  borderRadius: 8,
                                  background: bg,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color,
                                    display: "block",
                                    lineHeight: 1,
                                  }}
                                >
                                  {value}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  {label}
                                </Text>
                              </div>
                            ))}
                          </div>
                          {i === 0 && (
                            <div
                              style={{
                                marginTop: 10,
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                paddingTop: 10,
                                borderTop: "1px solid var(--border-faint)",
                              }}
                            >
                              <TrophyOutlined
                                style={{
                                  color: "var(--late-color)",
                                  fontSize: 12,
                                }}
                              />
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: "var(--late-color)",
                                  fontWeight: 700,
                                }}
                              >
                                Top Attendee this month
                              </Text>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Summary modal */}
      <Modal
        open={!!summaryModal}
        onCancel={() => setSummaryModal(null)}
        footer={null}
        width={520}
        title={
          summaryModal && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--accent-bg)",
                  border: "1px solid var(--accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileTextOutlined
                  style={{ color: "var(--accent)", fontSize: 18 }}
                />
              </div>
              <div>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "block",
                  }}
                >
                  Standup Summary
                </Text>
                <Text
                  strong
                  style={{ fontSize: 15, color: "var(--text-primary)" }}
                >
                  {dayjs(summaryModal.date).format("dddd, MMMM D, YYYY")}
                </Text>
              </div>
            </div>
          )
        }
      >
        {summaryModal && (
          <div style={{ padding: "20px 24px 24px" }}>
            <div
              style={{
                background: "var(--accent-bg)",
                border: "1px solid var(--accent-border)",
                borderRadius: 10,
                padding: "16px 18px",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {summaryModal.summary}
              </Text>
            </div>
            {summaryModal.attendance &&
              Object.keys(summaryModal.attendance).length > 0 && (
                <>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    Attendance
                  </Text>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      {
                        key: "present",
                        label: "Present",
                        color: "var(--present-color)",
                        bg: "var(--present-bg)",
                        border: "var(--present-border)",
                      },
                      {
                        key: "absent",
                        label: "Absent",
                        color: "var(--absent-color)",
                        bg: "var(--absent-bg)",
                        border: "var(--absent-border)",
                      },
                      {
                        key: "late",
                        label: "Late",
                        color: "var(--late-color)",
                        bg: "var(--late-bg)",
                        border: "var(--late-border)",
                      },
                    ].map(({ key, label, color, bg, border }) => {
                      const count = Object.values(
                        summaryModal.attendance,
                      ).filter((v) => v === key).length;
                      return (
                        <div
                          key={key}
                          style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "12px 8px",
                            borderRadius: 10,
                            background: bg,
                            border: `1px solid ${border}`,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 24,
                              fontWeight: 800,
                              color,
                              display: "block",
                              lineHeight: 1,
                            }}
                          >
                            {count}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {label}
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
