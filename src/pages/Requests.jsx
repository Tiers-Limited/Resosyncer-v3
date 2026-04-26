import { useState, useEffect } from "react";
import { Table, Button, message, Modal, Input, Select, DatePicker } from "antd";
import {
  PlusOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  MessageOutlined,
  FileTextOutlined,
  LockOutlined,
  ArrowRightOutlined,
  TeamOutlined,
  BellOutlined,
  BarChartOutlined,
  SyncOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import dayjs from "dayjs";

const { TextArea } = Input;
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

// ------------------------------------------------------ Theme styles (CSS variables) ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const THEME_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  .rq-root {
    /* Backgrounds */
    --bg-page:       #f8fafc;
    --bg-card:       #ffffff;
    --bg-card-alt:   #f9fafb;
    --bg-card-hover: #f8fafc;
    --bg-subtle:     #f1f5f9;
    --bg-input:      #f8fafc;
    --bg-input-focus:#ffffff;

    /* Borders */
    --border:        #e2e8f0;
    --border-subtle: #f1f5f9;
    --border-faint:  #f9fafb;

    /* Text */
    --text-primary:  #0f172a;
    --text-secondary:#1e293b;
    --text-tertiary: #475569;
    --text-muted:    #64748b;
    --text-faint:    #94a3b8;

    /* Semantic status */
    --pending-color:  #d97706; --pending-bg:  #fffbeb; --pending-border:  #fde68a;
    --approved-color: #059669; --approved-bg: #ecfdf5; --approved-border: #a7f3d0;
    --rejected-color: #e11d48; --rejected-bg: #fff1f2; --rejected-border: #fecdd3;

    /* Request type */
    --type-advance-color: #7c3aed; --type-advance-bg: #f5f3ff; --type-advance-border: #ddd6fe;
    --type-leave-color:   #0369a1; --type-leave-bg:   #f0f9ff; --type-leave-border:   #bae6fd;
    --type-other-color:   #475569; --type-other-bg:   #f8fafc; --type-other-border:   #e2e8f0;

    /* Misc */
    --accent:        #6366f1;
    --shadow-card:   0 1px 3px rgba(15,23,42,0.04);
    --shadow-btn:    0 4px 12px rgba(15,23,42,0.25);
  }

  /* ------------------------------ DARK ------------------------------ */
  .rq-root.dark {
    --bg-page:       #141416;
    --bg-card:       #141416;
    --bg-card-alt:   #18181c;
    --bg-card-hover: #18181c;
    --bg-subtle:     #1c1c22;
    --bg-input:      #1c1c22;
    --bg-input-focus:#141416;

    --border:        #2a2a31;
    --border-subtle: #2a2a31;
    --border-faint:  #23232b;

    --text-primary:  #f1f5f9;
    --text-secondary:#e2e8f0;
    --text-tertiary: #cbd5e1;
    --text-muted:    #94a3b8;
    --text-faint:    #64748b;

    --pending-color:  #fbbf24; --pending-bg:  rgba(217,119,6,0.16);  --pending-border:  rgba(251,191,36,0.35);
    --approved-color: #4ade80; --approved-bg: rgba(34,197,94,0.16);  --approved-border: rgba(74,222,128,0.35);
    --rejected-color: #fb7185; --rejected-bg: rgba(225,29,72,0.16);  --rejected-border: rgba(251,113,133,0.35);

    --type-advance-color: #c4b5fd; --type-advance-bg: rgba(124,58,237,0.16); --type-advance-border: rgba(196,181,253,0.35);
    --type-leave-color:   #7dd3fc; --type-leave-bg:   rgba(3,105,161,0.16);  --type-leave-border:   rgba(125,211,252,0.35);
    --type-other-color:   #94a3b8; --type-other-bg:   rgba(148,163,184,0.14);--type-other-border:   rgba(148,163,184,0.28);

    --shadow-card:   0 1px 3px rgba(0,0,0,0.3);
    --shadow-btn:    0 4px 12px rgba(0,0,0,0.4);
  }

  /* ------------------------------------ Font reset ------------------------------------ */
  .rq-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  @keyframes rqShimmer {
    0% { background-position: -500px 0; }
    100% { background-position: 500px 0; }
  }
  .rq-skel {
    background: linear-gradient(
      90deg,
      var(--bg-subtle) 25%,
      var(--border) 50%,
      var(--bg-subtle) 75%
    );
    background-size: 500px 100%;
    animation: rqShimmer 1.2s ease-in-out infinite;
    border-radius: 8px;
    border: 1px solid var(--border-subtle);
  }

  /* ------------------------------------ Table ------------------------------------ */
  .rq-root .req-table .ant-table { background: transparent !important; }
  .rq-root .req-table .ant-table-thead > tr > th {
    background: var(--bg-card-alt) !important;
    color: var(--text-faint) !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid var(--border) !important;
    padding: 11px 16px !important;
  }
  .rq-root .req-table .ant-table-tbody > tr > td {
    background: var(--bg-card) !important;
    border-bottom: 1px solid var(--border-faint) !important;
    padding: 14px 16px !important;
    vertical-align: middle;
  }
  .rq-root .req-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
  .rq-root .req-table .ant-table-tbody > tr:hover > td { background: var(--bg-card-hover) !important; }
  .rq-root .req-table .ant-table-row { cursor: pointer; }
  .rq-root .req-table .ant-table-expanded-row > td {
    background: var(--bg-card-alt) !important;
    padding: 0 !important;
  }
  .rq-root .req-table .ant-pagination-item { border-color: var(--border) !important; background: var(--bg-card) !important; }
  .rq-root .req-table .ant-pagination-item a { color: var(--text-tertiary) !important; }
  .rq-root .req-table .ant-pagination-item-active { border-color: var(--text-primary) !important; }
  .rq-root .req-table .ant-pagination-item-active a { color: var(--text-primary) !important; }
  .rq-root .req-table .ant-pagination-prev button,
  .rq-root .req-table .ant-pagination-next button { color: var(--text-tertiary) !important; border-color: var(--border) !important; background: var(--bg-card) !important; }
  .rq-root .req-table .ant-spin-dot-item { background: var(--accent) !important; }

  /* ------------------------------------ Inputs ------------------------------------ */
  .rq-root .req-input .ant-input,
  .rq-root .req-input textarea,
  .rq-root .req-select .ant-select-selector {
    border-radius: 9px !important;
    border-color: var(--border) !important;
    font-size: 13px !important;
    padding: 9px 13px !important;
    background: var(--bg-input) !important;
    color: var(--text-primary) !important;
    transition: all 0.15s;
  }
  .rq-root .req-input .ant-input:focus,
  .rq-root .req-input textarea:focus {
    border-color: var(--accent) !important;
    background: var(--bg-input-focus) !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.08) !important;
  }
  .rq-root .req-input .ant-input::placeholder,
  .rq-root .req-input textarea::placeholder { color: var(--text-faint) !important; }
  .rq-root .req-select .ant-select-selector { height: auto !important; padding: 6px 13px !important; }
  .rq-root .req-select .ant-select-selection-placeholder { color: var(--text-faint) !important; }
  .rq-root .req-select .ant-select-selection-item { color: var(--text-primary) !important; }
  .rq-root .req-select .ant-select-arrow { color: var(--text-faint) !important; }

  /* ------------------------------------ Modal ------------------------------------ */
  .rq-root .req-modal .ant-modal-content {
    border-radius: 18px !important;
    overflow: hidden;
    padding: 0 !important;
    background: var(--bg-card) !important;
  }
  .rq-root .req-modal .ant-modal-header {
    padding: 22px 28px 18px !important;
    border-bottom: 1px solid var(--border) !important;
    margin: 0 !important;
    background: var(--bg-card) !important;
  }
  .rq-root .req-modal .ant-modal-body  { padding: 24px 28px !important; background: var(--bg-card) !important; }
  .rq-root .req-modal .ant-modal-footer {
    padding: 16px 28px !important;
    border-top: 1px solid var(--border) !important;
    margin: 0 !important;
    background: var(--bg-card) !important;
  }
  .rq-root .req-modal .ant-modal-footer .ant-btn { border-radius: 9px !important; height: 38px !important; font-weight: 600 !important; font-size: 13px !important; }
  .rq-root .req-modal .ant-modal-footer .ant-btn-default { border-color: var(--border) !important; background: var(--bg-card) !important; color: var(--text-primary) !important; }
  .rq-root .req-modal .ant-modal-footer .ant-btn-primary { background: var(--text-primary) !important; border-color: var(--text-primary) !important; color: var(--bg-page) !important; }
  .rq-root .req-modal .ant-modal-close-x { color: var(--text-faint) !important; }
  .rq-root .req-modal .ant-modal-title { color: var(--text-primary) !important; }

  /* ------------------------------------ Stat card hover ------------------------------------ */
  .rq-root .stat-card { transition: transform 0.15s, box-shadow 0.15s; }
  .rq-root .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(15,23,42,0.08) !important; }
`;

// ------------------------------------------------------ Token accessors ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const statusConfig = {
  pending: {
    label: "Pending",
    icon: <ClockCircleOutlined />,
    color: "var(--pending-color)",
    bg: "var(--pending-bg)",
    border: "var(--pending-border)",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircleOutlined />,
    color: "var(--approved-color)",
    bg: "var(--approved-bg)",
    border: "var(--approved-border)",
  },
  rejected: {
    label: "Rejected",
    icon: <CloseCircleOutlined />,
    color: "var(--rejected-color)",
    bg: "var(--rejected-bg)",
    border: "var(--rejected-border)",
  },
};

const typeConfig = {
  advance_salary: {
    label: "Advance Salary",
    color: "var(--type-advance-color)",
    bg: "var(--type-advance-bg)",
    border: "var(--type-advance-border)",
  },
  leave: {
    label: "Leave Request",
    color: "var(--type-leave-color)",
    bg: "var(--type-leave-bg)",
    border: "var(--type-leave-border)",
  },
  other: {
    label: "Other",
    color: "var(--type-other-color)",
    bg: "var(--type-other-bg)",
    border: "var(--type-other-border)",
  },
};

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const normalizePlanTier = (planName) => {
  const value = String(planName || "").trim().toLowerCase();
  if (value.includes("starter")) return "starter";
  if (value.includes("growth")) return "growth";
  if (value.includes("pro")) return "pro";
  if (value.includes("enterprise")) return "enterprise";
  return "unknown";
};

const formatDisplayDate = (date) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(date);
  }
};

const getRequestTypeLabel = (requestType) =>
  typeConfig[requestType]?.label || "Request";

const sendPlainEmail = async ({ to, subject, html, companyName }) => {
  if (!EMAIL_API || !to) return { success: false, error: "EMAIL_API_NOT_CONFIGURED" };
  const safeCompany = String(companyName || "").trim() || "Ryzent";
  try {
    const res = await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html, companyName: safeCompany }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: payload?.error || "EMAIL_SEND_FAILED" };
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || "EMAIL_SEND_FAILED" };
  }
};

const RequestsLockedPaywall = ({ dark = false, planName, role }) => {
  const isNonOwnerRole =
    role === "employee" || role === "project_manager";
  const helperText = isNonOwnerRole
    ? "Ask your company owner to upgrade to unlock Requests"
    : "Upgrade your workspace plan to unlock Requests.";
  const features = [
    {
      icon: <FileTextOutlined />,
      title: "Employee Requests",
      desc: "Handle employee requests in one place with full context and history.",
    },
    {
      icon: <CheckCircleOutlined />,
      title: "Approve or Reject",
      desc: "Review requests quickly and respond with clear decisions.",
    },
    {
      icon: <BellOutlined />,
      title: "Smart Follow-ups",
      desc: "Keep every request moving with status visibility and response trails.",
    },
    {
      icon: <BarChartOutlined />,
      title: "Request Insights",
      desc: "Track pending, approved, and rejected requests across teams.",
    },
    {
      icon: <SyncOutlined />,
      title: "Workflow Consistency",
      desc: "Use a structured process for salary advances, leave, and custom cases.",
    },
    {
      icon: <TeamOutlined />,
      title: "Team Management",
      desc: "Support managers and HR with one shared request workflow.",
    },
  ];

  const mockRequests = [
    {
      name: "Lena Park",
      type: "Leave Request",
      subject: "2 days personal leave",
      status: "Pending",
      statusColor: "#d97706",
      statusBg: "#fffbeb",
      statusBorder: "#fde68a",
      date: "Today",
    },
    {
      name: "James Osei",
      type: "Advance Salary",
      subject: "Emergency expense support",
      status: "Approved",
      statusColor: "#059669",
      statusBg: "#ecfdf5",
      statusBorder: "#a7f3d0",
      date: "Apr 3",
    },
    {
      name: "Sara Malik",
      type: "Other",
      subject: "Flexible schedule request",
      status: "Rejected",
      statusColor: "#e11d48",
      statusBg: "#fff1f2",
      statusBorder: "#fecdd3",
      date: "Apr 2",
    },
  ];

  const sidebarQueues = [
    { name: "All Requests", count: 24, color: "#3b82f6", active: true },
    { name: "Pending Review", count: 7, color: "#f59e0b", active: false },
    { name: "Approved", count: 13, color: "#22c55e", active: false },
    { name: "Rejected", count: 4, color: "#ef4444", active: false },
  ];

  const requestTagStyles = (status = "") => {
    const key = status.toLowerCase();
    if (key === "pending") {
      return dark
        ? {
            color: "#fbbf24",
            background: "rgba(217,119,6,0.16)",
            border: "rgba(251,191,36,0.35)",
          }
        : { color: "#d97706", background: "#fffbeb", border: "#fde68a" };
    }
    if (key === "approved") {
      return dark
        ? {
            color: "#4ade80",
            background: "rgba(34,197,94,0.16)",
            border: "rgba(74,222,128,0.35)",
          }
        : { color: "#059669", background: "#ecfdf5", border: "#a7f3d0" };
    }
    return dark
      ? {
          color: "#fb7185",
          background: "rgba(225,29,72,0.16)",
          border: "rgba(251,113,133,0.35)",
        }
      : { color: "#e11d48", background: "#fff1f2", border: "#fecdd3" };
  };

  return (
    <div
      className={`rq-root${dark ? " dark" : ""}`}
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
              "--accent": "#818cf8",
              "--accent-bg": "rgba(99,102,241,0.18)",
              "--accent-border": "rgba(129,140,248,0.35)",
            }
          : {
              "--accent": "#4f46e5",
              "--accent-bg": "#eef2ff",
              "--accent-border": "#c7d2fe",
            }),
      }}
    >
      <style>{THEME_STYLES}</style>

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
          Requests
        </h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
          Employee requests ---- approvals ---- response history
        </p>
      </div>

      <div style={{ padding: "0 28px 40px" }}>
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
            ["#3b82f6", "24", "Total Requests"],
            ["#f59e0b", "7", "Pending"],
            ["#22c55e", "13", "Approved"],
            ["#ef4444", "4", "Rejected"],
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
                <InboxOutlined style={{ fontSize: 18 }} />
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

        <div
          style={{
            position: "relative",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
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
              <div
                style={{
                  width: 220,
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
                  REQUEST QUEUES
                </div>
                {sidebarQueues.map((s) => (
                  <div
                    key={s.name}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
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
                          color: s.active ? "var(--accent)" : "var(--text-secondary)",
                          flex: 1,
                        }}
                      >
                        {s.name}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        {s.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, padding: "16px 20px", minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    marginBottom: 12,
                  }}
                >
                  Employee Requests
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {mockRequests.map((r) => (
                    <div
                      key={`${r.name}-${r.subject}`}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 12,
                        padding: "12px 14px",
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {r.name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                            {r.name}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.type}</span>
                          <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)" }}>
                            {r.date}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.subject}</div>
                      </div>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 20,
                          border: `1px solid ${r.statusBorder}`,
                          background: r.statusBg,
                          fontSize: 10,
                          fontWeight: 700,
                          color: r.statusColor,
                        }}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              padding: "48px 40px 44px",
              marginTop: -300,
              background: "linear-gradient(180deg, transparent 0%, var(--bg-card) 10%)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
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
                <LockOutlined style={{ color: "var(--accent)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                  Locked Feature
                </span>
              </div>
            </div>

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
                Manage employee requests
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  in one workflow
                </span>
              </h2>
            </div>
            <p
              style={{
                textAlign: "center",
                fontSize: 15,
                color: "var(--text-muted)",
                maxWidth: 520,
                margin: "0 auto 36px",
                lineHeight: 1.6,
              }}
            >
              Your current plan is <strong>{planName || "Starter"}</strong>. Upgrade
              to handle employee requests, approve or reject decisions, and keep a
              full response history in one place.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 12,
                maxWidth: 760,
                margin: "0 auto 36px",
              }}
            >
              {features.map((f) => (
                <div
                  key={f.title}
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
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
                  Sample Requests
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
                    color: dark ? "#fbbf24" : "#d97706",
                    background: dark ? "rgba(217,119,6,0.16)" : "#fffbeb",
                    padding: "2px 9px",
                    borderRadius: 5,
                    border: `1px solid ${dark ? "rgba(251,191,36,0.35)" : "#fde68a"}`,
                  }}
                >
                  1 pending review
                </span>
              </div>
              {mockRequests.map((r, i) => (
                <div
                  key={`${r.name}-${r.subject}-sample`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 1fr auto",
                    gap: 12,
                    padding: "14px 16px",
                    borderBottom:
                      i < mockRequests.length - 1
                        ? "1px solid var(--border-subtle)"
                        : "none",
                    background:
                      i % 2 === 0 ? "var(--bg-card)" : "var(--bg-card-alt)",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {r.name[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {r.name}
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
                        {r.type}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {r.subject}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      {r.date}
                    </div>
                    <span
                      style={{
                        ...requestTagStyles(r.status),
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  margin: "0 0 12px",
                  color: "var(--text-muted)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {helperText}
              </p>
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
              >
                <UsergroupAddOutlined />
                Upgrade to unlock Requests
                <ArrowRightOutlined />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequestsContentSkeleton = ({ isMobile = false }) => {
  const cardStyles = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 14,
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            style={{
              ...cardStyles,
              minWidth: 0,
              padding: "16px 18px",
            }}
          >
            <div
              className="rq-skel"
              style={{ width: 34, height: 34, borderRadius: 10, marginBottom: 10 }}
            />
            <div className="rq-skel" style={{ width: "58%", height: 10, marginBottom: 8 }} />
            <div className="rq-skel" style={{ width: "42%", height: 22 }} />
          </div>
        ))}
      </div>

      <div
        style={{
          ...cardStyles,
          borderRadius: 16,
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-faint)",
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div className="rq-skel" style={{ width: 200, height: 34 }} />
          {!isMobile && <div className="rq-skel" style={{ width: 150, height: 34 }} />}
        </div>
        <div style={{ padding: 16 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              style={{
                marginBottom: n === 5 ? 0 : 14,
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div className="rq-skel" style={{ width: "50%", height: 12, marginBottom: 8 }} />
              <div className="rq-skel" style={{ width: "72%", height: 10, marginBottom: 8 }} />
              <div className="rq-skel" style={{ width: isMobile ? "45%" : "28%", height: 10 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const Requests = () => {
  const [dark, setDark] = useState(getIsDarkTheme);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [responseModal, setResponseModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [orgPlan, setOrgPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [formData, setFormData] = useState({ status: "", response: "" });
  const [createFormData, setCreateFormData] = useState({
    request_type: "",
    subject: "",
    description: "",
    leave_date: "",
  });

  const { profile } = useAuth();
  const senderCompanyName = String(profile?.company_name || "").trim() || "Ryzent";

  // Theme listener
  useEffect(() => {
    const sync = () => setDark(getIsDarkTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("themeModeChanged", sync);
    mq.addEventListener("change", sync);
    return () => {
      window.removeEventListener("themeModeChanged", sync);
      mq.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = viewportWidth <= 768;

  // Auth init
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: p } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
        const nextTenantId = p?.tenant_id ?? null;
        setTenantId(nextTenantId);
        if (nextTenantId) {
          const { data: tenant } = await supabase
            .from("tenants")
            .select("plan")
            .eq("id", nextTenantId)
            .maybeSingle();
          setOrgPlan(tenant?.plan || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setPlanLoading(false);
      }
    })();
  }, []);

  const planTier = normalizePlanTier(orgPlan);
  const isRequestsLocked = planTier === "starter";

  useEffect(() => {
    if (tenantId && !isRequestsLocked) fetchRequests();
  }, [tenantId, isRequestsLocked]);

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      let query = supabase
        .from("requests")
        .select(
          "*, profiles!requests_user_id_fkey (full_name, email, user_photo)",
        )
        .eq("tenant_id", tenantId);
      if (profile?.role === "project_manager")
        query = query.eq("user_id", profile.id);
      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      setRequests(data || []);
    } catch {
      message.error("Failed to fetch requests");
    } finally {
      setRequestsLoading(false);
    }
  };

  const getMainAdminForTenant = async () => {
    if (!tenantId) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,email,created_at")
      .eq("tenant_id", tenantId)
      .eq("role", "admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  };

  const sendRequestCreatedEmailToMainAdmin = async ({ requestRow }) => {
    try {
      const admin = await getMainAdminForTenant();
      if (!admin?.email) return;
      const requestTypeLabel = getRequestTypeLabel(requestRow?.request_type);
      const leaveDateLine =
        requestRow?.request_type === "leave" && requestRow?.leave_date
          ? `<p style="margin:0 0 10px;">Leave date: ${formatDisplayDate(requestRow.leave_date)}</p>`
          : "";
      const subject = `New ${requestTypeLabel} Submitted`;
      const html = `
        <p style="margin:0 0 10px;">Hello ${admin.full_name || "Admin"},</p>
        <p style="margin:0 0 10px;">
          A new ${requestTypeLabel.toLowerCase()} has been submitted by ${profile?.full_name || "an employee"}.
        </p>
        <p style="margin:0 0 10px;">Subject: ${requestRow?.subject || "-"}</p>
        ${leaveDateLine}
        <p style="margin:0 0 10px;">Description: ${requestRow?.description || "-"}</p>
        <p style="margin:0;">Please review this request in the Requests module.</p>
      `;
      await sendPlainEmail({
        to: admin.email,
        subject,
        html,
        companyName: senderCompanyName,
      });
    } catch (err) {
      console.warn("[Requests] Failed to notify main admin:", err?.message || err);
    }
  };

  const sendRequestResponseEmailToEmployee = async ({ requestRow, status, response }) => {
    try {
      const employeeEmail = requestRow?.profiles?.email;
      if (!employeeEmail) return;
      const requestTypeLabel = getRequestTypeLabel(requestRow?.request_type);
      const decisionLabel = status === "approved" ? "Approved" : "Rejected";
      const leaveDateLine =
        requestRow?.request_type === "leave" && requestRow?.leave_date
          ? `<p style="margin:0 0 10px;">Leave date: ${formatDisplayDate(requestRow.leave_date)}</p>`
          : "";
      const subject = `Your ${requestTypeLabel} Has Been ${decisionLabel}`;
      const html = `
        <p style="margin:0 0 10px;">Hello ${requestRow?.profiles?.full_name || "Employee"},</p>
        <p style="margin:0 0 10px;">
          Your ${requestTypeLabel.toLowerCase()} has been ${decisionLabel.toLowerCase()}.
        </p>
        <p style="margin:0 0 10px;">Subject: ${requestRow?.subject || "-"}</p>
        ${leaveDateLine}
        <p style="margin:0 0 10px;">Response: ${response || "-"}</p>
        <p style="margin:0;">Regards,<br/>${profile?.full_name || "Admin Team"}<br/>${senderCompanyName}</p>
      `;
      await sendPlainEmail({
        to: employeeEmail,
        subject,
        html,
        companyName: senderCompanyName,
      });
    } catch (err) {
      console.warn("[Requests] Failed to notify employee:", err?.message || err);
    }
  };

  const handleCreateRequest = async () => {
    if (!profile?.id) {
      message.error("Please wait for profile to load");
      return;
    }
    if (
      !createFormData.request_type ||
      !createFormData.subject ||
      !createFormData.description
    ) {
      message.error("Please fill all required fields");
      return;
    }
    if (createFormData.request_type === "leave" && !createFormData.leave_date) {
      message.error("Please select leave date");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        user_id: profile.id,
        tenant_id: tenantId,
        request_type: createFormData.request_type,
        subject: createFormData.subject,
        description: createFormData.description,
        status: "pending",
        leave_date:
          createFormData.request_type === "leave" && createFormData.leave_date
            ? createFormData.leave_date
            : null,
      };
      const { error } = await supabase
        .from("requests")
        .insert([payload]);
      if (error) throw error;
      message.success("Request submitted successfully");
      await sendRequestCreatedEmailToMainAdmin({ requestRow: payload });
      setCreateModal(false);
      setCreateFormData({
        request_type: "",
        subject: "",
        description: "",
        leave_date: "",
      });
      fetchRequests();
    } catch {
      message.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!formData.status || !formData.response) {
      message.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          status: formData.status,
          response: formData.response,
          responded_by: profile.id,
          responded_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);
      if (error) throw error;
      message.success("Response submitted successfully");
      await sendRequestResponseEmailToEmployee({
        requestRow: selectedRequest,
        status: formData.status,
        response: formData.response,
      });
      setResponseModal(false);
      setFormData({ status: "", response: "" });
      fetchRequests();
    } catch {
      message.error("Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };
  const isProjectManager = profile?.role === "project_manager";

  const formatShortDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // ------------------------------------ Columns ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const employeeColumn = {
    title: "Employee",
    key: "employee",
    render: (_, rec) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {rec.profiles?.user_photo ? (
            <img
              src={rec.profiles.user_photo}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            (rec.profiles?.full_name || "?")[0].toUpperCase()
          )}
        </div>
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            {rec.profiles?.full_name || "-"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
            {rec.profiles?.email || ""}
          </div>
        </div>
      </div>
    ),
  };

  const baseColumns = [
    {
      title: "Type",
      dataIndex: "request_type",
      key: "request_type",
      render: (type) => {
        const cfg = typeConfig[type] || typeConfig.other;
        return (
          <span
            style={{
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: 20,
              border: `1px solid ${cfg.border}`,
              background: cfg.bg,
              fontSize: 11,
              fontWeight: 700,
              color: cfg.color,
              letterSpacing: "0.03em",
            }}
          >
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      render: (text) => (
        <span
          style={{
            fontWeight: 500,
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const cfg = statusConfig[status] || statusConfig.pending;
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 20,
              border: `1px solid ${cfg.border}`,
              background: cfg.bg,
              fontSize: 11,
              fontWeight: 700,
              color: cfg.color,
            }}
          >
            {cfg.icon} {cfg.label}
          </span>
        );
      },
    },
    {
      title: "Leave Date",
      dataIndex: "leave_date",
      key: "leave_date",
      render: (_, rec) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {rec.request_type === "leave" ? formatDisplayDate(rec.leave_date) : "-"}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {formatDisplayDate(date)}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 140,
      render: (_, record) => {
        if (profile?.role === "project_manager") return null;
        if (record.status === "pending") {
          return (
            <Button
              icon={<MessageOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRequest(record);
                setResponseModal(true);
              }}
              style={{
                borderRadius: 8,
                height: 32,
                paddingInline: 14,
                fontWeight: 600,
                fontSize: 12,
                background: "var(--text-primary)",
                border: "none",
                color: "var(--bg-page)",
                boxShadow: "0 2px 6px rgba(15,23,42,0.2)",
              }}
            >
              Respond
            </Button>
          );
        }
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-faint)",
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 10 }} /> Done
          </span>
        );
      },
    },
  ];
  const columns = isProjectManager ? baseColumns : [employeeColumn, ...baseColumns];

  // ------------------------------------ Shared label helper ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const FieldLabel = ({ children, required }) => (
    <label
      style={{
        display: "block",
        marginBottom: 6,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-tertiary)",
      }}
    >
      {children}{" "}
      {required && <span style={{ color: "var(--rejected-color)" }}>*</span>}
    </label>
  );

  if (planLoading) {
    return (
      <div
        className={`rq-root${dark ? " dark" : ""}`}
        style={{
          minHeight: "100vh",
          background: "var(--bg-page)",
          padding: isMobile ? "18px 12px 20px" : "28px 32px",
        }}
      >
        <style>{THEME_STYLES}</style>
        <div style={{ marginBottom: isMobile ? 18 : 28 }}>
          <div
            className="rq-skel"
            style={{ width: isMobile ? 100 : 120, height: 12, marginBottom: 8 }}
          />
          <div
            className="rq-skel"
            style={{ width: isMobile ? 160 : 210, height: isMobile ? 32 : 38 }}
          />
        </div>
        <RequestsContentSkeleton isMobile={isMobile} />
      </div>
    );
  }

  if (isRequestsLocked) {
    return (
      <RequestsLockedPaywall
        dark={dark}
        planName={orgPlan}
        role={profile?.role}
      />
    );
  }

  return (
    <div
      className={`rq-root${dark ? " dark" : ""}`}
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        padding: isMobile ? "18px 12px 20px" : "28px 32px",
      }}
    >
      <style>{THEME_STYLES}</style>

      {/* ------------------------------------ Header ------------------------------------ */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: isMobile ? 18 : 28,
          flexWrap: "wrap",
          gap: isMobile ? 12 : 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: isMobile ? 22 : 26,
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: -0.5,
              lineHeight: 1,
            }}
          >
            Requests
          </h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
            {isProjectManager
              ? "Your requests, approvals, and response history"
              : "Employee requests, approvals, and response history"}
          </p>
        </div>
        {isProjectManager && (
          <Button
            disabled={requestsLoading}
            icon={<PlusOutlined />}
            onClick={() => setCreateModal(true)}
            style={{
              height: 40,
              paddingInline: 20,
              borderRadius: 10,
              background: "var(--text-primary)",
              border: "none",
              color: "var(--bg-page)",
              fontWeight: 700,
              fontSize: 13,
              boxShadow: "var(--shadow-btn)",
              width: isMobile ? "100%" : "auto",
            }}
          >
            New Request
          </Button>
        )}
      </div>

      {requestsLoading ? (
        <RequestsContentSkeleton isMobile={isMobile} />
      ) : (
        <>
      {/* ------------------------------------ Stat Cards ------------------------------------ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Total",
            value: stats.total,
            color: "var(--text-primary)",
            bg: "var(--bg-card-alt)",
            border: "var(--border)",
            icon: <InboxOutlined />,
          },
          {
            label: "Pending",
            value: stats.pending,
            color: statusConfig.pending?.color,
            bg: statusConfig.pending?.bg,
            border: statusConfig.pending?.border,
            icon: <ClockCircleOutlined />,
          },
          {
            label: "Approved",
            value: stats.approved,
            color: statusConfig.approved?.color,
            bg: statusConfig.approved?.bg,
            border: statusConfig.approved?.border,
            icon: <CheckCircleOutlined />,
          },
          {
            label: "Rejected",
            value: stats.rejected,
            color: statusConfig.rejected?.color,
            bg: statusConfig.rejected?.bg,
            border: statusConfig.rejected?.border,
            icon: <CloseCircleOutlined />,
          },
        ].map(({ label, value, color, bg, border, icon }) => (
          <div
            key={label}
            className="stat-card"
            style={{
              minWidth: 0,
              padding: "16px 18px",
              borderRadius: 14,
              border: `1px solid ${border}`,
              background: bg,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span style={{ color, fontSize: 13 }}>{icon}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {label}
              </span>
            </div>
            <div
              style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------ Table card ------------------------------------ */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-faint)",
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileTextOutlined
              style={{ color: "var(--text-faint)", fontSize: 14 }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
              }}
            >
              {isProjectManager ? "My Requests" : "All Requests"}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-muted)",
                background: "var(--bg-subtle)",
                borderRadius: 20,
                padding: "1px 10px",
              }}
            >
              {requests.length}
            </span>
          </div>
          {!isMobile && (
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
              Click a row to expand details
            </span>
          )}
        </div>
        {isMobile ? (
          <div style={{ padding: "10px 10px 12px" }}>
            {requests.length === 0 ? (
              <div
                style={{
                  padding: "22px 12px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                No requests found.
              </div>
            ) : (
              requests.map((record) => {
                const sCfg = statusConfig[record.status] || statusConfig.pending;
                const tCfg = typeConfig[record.request_type] || typeConfig.other;
                const isExpanded = expandedRow === record.id;
                return (
                  <div
                    key={record.id}
                    onClick={() => setExpandedRow(isExpanded ? null : record.id)}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "12px 12px 10px",
                      marginBottom: 10,
                      background: "var(--bg-card-alt)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            lineHeight: 1.3,
                            wordBreak: "break-word",
                          }}
                        >
                          {record.subject}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                          {isProjectManager
                            ? formatShortDate(record.created_at)
                            : `${record.profiles?.full_name || "-"} | ${formatShortDate(record.created_at)}`}
                        </div>
                        {record.request_type === "leave" && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            Leave Date: {formatDisplayDate(record.leave_date)}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 8px",
                          borderRadius: 999,
                          border: `1px solid ${sCfg.border}`,
                          background: sCfg.bg,
                          fontSize: 10,
                          fontWeight: 700,
                          color: sCfg.color,
                          whiteSpace: "nowrap",
                          height: "fit-content",
                        }}
                      >
                        {sCfg.icon} {sCfg.label}
                      </span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 20,
                          border: `1px solid ${tCfg.border}`,
                          background: tCfg.bg,
                          fontSize: 10,
                          fontWeight: 700,
                          color: tCfg.color,
                        }}
                      >
                        {tCfg.label}
                      </span>
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-faint)" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", marginBottom: 5 }}>
                          Description
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                            wordBreak: "break-word",
                          }}
                        >
                          {record.description || "No description provided"}
                        </p>
                        {record.response && (
                          <>
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "var(--text-faint)",
                                marginTop: 8,
                                marginBottom: 5,
                              }}
                            >
                              Response
                            </div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 12,
                                color: "var(--text-secondary)",
                                lineHeight: 1.6,
                                wordBreak: "break-word",
                              }}
                            >
                              {record.response}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    {profile?.role !== "project_manager" && record.status === "pending" && (
                      <Button
                        icon={<MessageOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(record);
                          setResponseModal(true);
                        }}
                        style={{
                          marginTop: 10,
                          width: "100%",
                          borderRadius: 8,
                          height: 34,
                          fontWeight: 600,
                          fontSize: 12,
                          background: "var(--text-primary)",
                          border: "none",
                          color: "var(--bg-page)",
                        }}
                      >
                        Respond
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <Table
            className="req-table"
            columns={columns}
            dataSource={requests}
            rowKey="id"
            onRow={(rec) => ({
              onClick: () =>
                setExpandedRow(expandedRow === rec.id ? null : rec.id),
            })}
            expandable={{
              expandedRowKeys: expandedRow ? [expandedRow] : [],
              showExpandColumn: false,
              expandedRowRender: (record) => {
                const sCfg = statusConfig[record.status] || statusConfig.pending;
                return (
                  <div
                    style={{
                      padding: isProjectManager ? "20px 24px" : "20px 24px 20px 70px",
                      background: "var(--bg-card-alt)",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                      <div style={{ flex: 2, minWidth: 220 }}>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--text-faint)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 6,
                          }}
                        >
                          Description
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            lineHeight: 1.7,
                          }}
                        >
                          {record.description || "No description provided"}
                        </p>
                        {record.request_type === "leave" && (
                          <p
                            style={{
                              margin: "10px 0 0",
                              fontSize: 12,
                              color: "var(--text-muted)",
                            }}
                          >
                            <strong>Leave Date:</strong> {formatDisplayDate(record.leave_date)}
                          </p>
                        )}
                      </div>
                      {record.response && (
                        <div style={{ flex: 2, minWidth: 220 }}>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--text-faint)",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              marginBottom: 6,
                            }}
                          >
                            Response
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              color: "var(--text-secondary)",
                              lineHeight: 1.7,
                            }}
                          >
                            {record.response}
                          </p>
                        </div>
                      )}
                      <div style={{ minWidth: 140 }}>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--text-faint)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 6,
                          }}
                        >
                          Status
                        </div>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 14px",
                            borderRadius: 20,
                            border: `1px solid ${sCfg.border}`,
                            background: sCfg.bg,
                            fontSize: 12,
                            fontWeight: 700,
                            color: sCfg.color,
                          }}
                        >
                          {sCfg.icon} {sCfg.label}
                        </span>
                        {record.request_type === "leave" && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              marginTop: 6,
                            }}
                          >
                            Leave: {formatDisplayDate(record.leave_date)}
                          </div>
                        )}
                        {record.responded_at && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-faint)",
                              marginTop: 6,
                            }}
                          >
                            {new Date(record.responded_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              },
            }}
            pagination={{
              pageSize: 10,
              showTotal: (total) => (
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                  {total} requests
                </span>
              ),
            }}
            style={{ borderRadius: 0 }}
          />
        )}
      </div>
        </>
      )}

      {/* ------------------------------------ Create Modal ------------------------------------ */}
      <Modal
        className="req-modal"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "var(--bg-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlusOutlined
                style={{ color: "var(--text-tertiary)", fontSize: 16 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                New
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Submit a Request
              </div>
            </div>
          </div>
        }
        open={createModal}
        onCancel={() => {
          setCreateModal(false);
          setCreateFormData({
            request_type: "",
            subject: "",
            description: "",
            leave_date: "",
          });
        }}
        onOk={handleCreateRequest}
        confirmLoading={loading}
        okText={
          <span>
            <SendOutlined style={{ marginRight: 6 }} />
            Submit Request
          </span>
        }
        cancelText="Cancel"
        width={isMobile ? "calc(100vw - 20px)" : 500}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="req-select">
            <FieldLabel required>Request Type</FieldLabel>
            <Select
              value={createFormData.request_type || undefined}
              onChange={(v) =>
                setCreateFormData({
                  ...createFormData,
                  request_type: v,
                  leave_date: v === "leave" ? createFormData.leave_date : "",
                })
              }
              placeholder="Select a type..."
              style={{ width: "100%" }}
            >
              <Select.Option value="advance_salary">
                Advance Salary
              </Select.Option>
              <Select.Option value="leave">Leave Request</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </div>
          {createFormData.request_type === "leave" && (
            <div className="req-input">
              <FieldLabel required>Leave Date</FieldLabel>
              <DatePicker
                value={createFormData.leave_date ? dayjs(createFormData.leave_date) : null}
                onChange={(_, dateString) =>
                  setCreateFormData({
                    ...createFormData,
                    leave_date: Array.isArray(dateString) ? dateString[0] : dateString,
                  })
                }
                style={{ width: "100%" }}
                format="YYYY-MM-DD"
                placeholder="Select leave date"
              />
            </div>
          )}
          <div className="req-input">
            <FieldLabel required>Subject</FieldLabel>
            <Input
              value={createFormData.subject}
              onChange={(e) =>
                setCreateFormData({
                  ...createFormData,
                  subject: e.target.value,
                })
              }
              placeholder="Brief subject line..."
            />
          </div>
          <div className="req-input">
            <FieldLabel required>Description</FieldLabel>
            <TextArea
              value={createFormData.description}
              onChange={(e) =>
                setCreateFormData({
                  ...createFormData,
                  description: e.target.value,
                })
              }
              rows={4}
              placeholder="Describe your request in detail..."
              style={{ resize: "none" }}
            />
          </div>
        </div>
      </Modal>

      {/* ------------------------------------ Respond Modal ------------------------------------ */}
      <Modal
        className="req-modal"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "var(--type-leave-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageOutlined
                style={{ color: "var(--type-leave-color)", fontSize: 16 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Review
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Respond to Request
              </div>
            </div>
          </div>
        }
        open={responseModal}
        onCancel={() => {
          setResponseModal(false);
          setFormData({ status: "", response: "" });
        }}
        onOk={handleRespond}
        confirmLoading={loading}
        okText={
          <span>
            <SendOutlined style={{ marginRight: 6 }} />
            Submit Response
          </span>
        }
        cancelText="Cancel"
        width={isMobile ? "calc(100vw - 20px)" : 500}
      >
        {selectedRequest && (
          <div
            style={{
              background: "var(--bg-input)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              padding: "14px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-faint)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Request
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
                marginBottom: 2,
              }}
            >
              {selectedRequest.subject}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {isProjectManager
                ? typeConfig[selectedRequest.request_type]?.label
                : `${selectedRequest.profiles?.full_name} - ${typeConfig[selectedRequest.request_type]?.label}`}
            </div>
            {selectedRequest.request_type === "leave" && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Leave Date: {formatDisplayDate(selectedRequest.leave_date)}
              </div>
            )}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="req-select">
            <FieldLabel required>Decision</FieldLabel>
            <Select
              value={formData.status || undefined}
              onChange={(v) => setFormData({ ...formData, status: v })}
              placeholder="Approve or reject..."
              style={{ width: "100%" }}
            >
              <Select.Option value="approved">
                <span
                  style={{ color: "var(--approved-color)", fontWeight: 600 }}
                >
                  Approve
                </span>
              </Select.Option>
              <Select.Option value="rejected">
                <span
                  style={{ color: "var(--rejected-color)", fontWeight: 600 }}
                >
                  Reject
                </span>
              </Select.Option>
            </Select>
          </div>
          <div className="req-input">
            <FieldLabel required>Response Message</FieldLabel>
            <TextArea
              value={formData.response}
              onChange={(e) =>
                setFormData({ ...formData, response: e.target.value })
              }
              rows={4}
              placeholder="Write your response here..."
              style={{ resize: "none" }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Requests;




