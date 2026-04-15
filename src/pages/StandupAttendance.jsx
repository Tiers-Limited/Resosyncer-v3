import { useState, useEffect } from "react";
import {
  Table, Button, DatePicker, Modal, Tag, Avatar, Space,
  Typography, Tooltip, Radio, Empty, Row, Col, message,
  Input, Spin, Divider, Badge, Progress,
} from "antd";
import {
  CheckOutlined, CloseOutlined, ClockCircleOutlined,
  SaveOutlined, FileTextOutlined, EditOutlined,
  CheckCircleFilled, TeamOutlined, ArrowLeftOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  Lock,
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
import { supabase } from "../lib/supabase";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ── Constants ──────────────────────────────────────────────────────────────
const ATTENDANCE_STATUS = {
  present: { label: "Present", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: <CheckOutlined /> },
  absent:  { label: "Absent",  color: "#e11d48", bg: "#fff1f2", border: "#fecdd3", icon: <CloseOutlined /> },
  late:    { label: "Late",    color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: <ClockCircleOutlined /> },
};

const PROJECT_STATUS_TAG = {
  active:       { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", dot: "#059669" },
  "in progress":{ color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", dot: "#2563eb" },
  planning:     { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", dot: "#7c3aed" },
  review:       { color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "#d97706" },
};

const EXCLUDED_STATUSES = ["completed", "on hold"];
const AVATAR_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6"];

const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

function StarterStandupAttendancePaywall({ dark = false }) {
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
                marginTop:15
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
                  Locked Feature
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
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 24px",
                  background: "var(--bg-card-alt)",
                  color: "var(--text-primary)",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  border: "1px solid var(--border)",
                }}
              >
                <Lock size={15} />
                Ask your company owner to upgrade
              </div>
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                Standups are available on Growth, Pro, and Enterprise plans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StandupAttendance() {
  const [dark, setDark] = useState(getIsDarkTheme);
  const [currentUser, setCurrentUser]         = useState(null);
  const [selectedDate, setSelectedDate]       = useState(dayjs());
  const [orgPlan, setOrgPlan]                 = useState(null);
  const [planLoading, setPlanLoading]         = useState(true);

  // Projects list view
  const [projects, setProjects]               = useState([]);
  const [projectSessions, setProjectSessions] = useState({}); // { project_id: session }
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Mark attendance view
  const [activeProject, setActiveProject]     = useState(null); // project object
  const [employees, setEmployees]             = useState([]);
  const [attendance, setAttendance]           = useState({});
  const [summary, setSummary]                 = useState("");
  const [existingSessionId, setExistingSessionId] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingSession, setLoadingSession]   = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [summaryOpen, setSummaryOpen]         = useState(false);

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", syncTheme);
    media.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      media.removeEventListener("change", syncTheme);
    };
  }, []);

  // Auth + org plan
  useEffect(() => {
    const init = async () => {
      setPlanLoading(true);
      const { data } = await supabase.auth.getUser();
      const user = data?.user ?? null;
      setCurrentUser(user);

      if (!user?.id) {
        setOrgPlan(null);
        setPlanLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) {
        setOrgPlan(null);
        setPlanLoading(false);
        return;
      }

      const { data: tenant } = await supabase
        .from("tenants")
        .select("plan")
        .eq("id", profile.tenant_id)
        .single();

      setOrgPlan(tenant?.plan ?? null);
      setPlanLoading(false);
    };
    init();
  }, []);

  // Load PM's active projects
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, client_name, country_flag, priority, start_date, end_date")
        .eq("project_manager_id", currentUser.id)
        .eq("is_archived", false)
        .neq("status","on_hold")
        .neq("status","completed")
        .neq("status","planning")
        .order("position");
      if (error) { message.error("Failed to load projects"); }
      else {
        const filtered = (data ?? []).filter(
          (p) => !EXCLUDED_STATUSES.includes((p.status ?? "").toLowerCase())
        );
        setProjects(filtered);
      }
      setLoadingProjects(false);
    };
    load();
  }, [currentUser]);

  // Load today's sessions for all projects (to show status in table)
  useEffect(() => {
    if (!projects.length || !selectedDate) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("standup_sessions")
        .select("id, project_id, attendance, summary, date")
        .in("project_id", projects.map((p) => p.id))
        .eq("date", selectedDate.format("YYYY-MM-DD"));
      if (!error && data) {
        const map = {};
        data.forEach((s) => { map[s.project_id] = s; });
        setProjectSessions(map);
      }
    };
    load();
  }, [projects, selectedDate, saving]);

  // Open Mark view for a project
  const openMarkView = async (project) => {
    setActiveProject(project);
    setLoadingEmployees(true);
    setLoadingSession(true);

    // Load employees
    const { data: assignees } = await supabase
      .from("project_assignees")
      .select("employee_id")
      .eq("project_id", project.id);

    const ids = (assignees ?? []).map((a) => a.employee_id);
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, job_title, department, user_photo, email")
        .in("id", ids)
        .eq("suspended", false);
      setEmployees(profiles ?? []);
    } else {
      setEmployees([]);
    }
    setLoadingEmployees(false);

    // Load existing session
    const existing = projectSessions[project.id];
    if (existing) {
      setAttendance(existing.attendance ?? {});
      setSummary(existing.summary ?? "");
      setExistingSessionId(existing.id);
    } else {
      setAttendance({});
      setSummary("");
      setExistingSessionId(null);
    }
    setLoadingSession(false);
  };

  const closeMarkView = () => {
    setActiveProject(null);
    setEmployees([]);
    setAttendance({});
    setSummary("");
    setExistingSessionId(null);
  };

  // Save / update session
  const handleSave = async () => {
    const unmarked = employees.filter((e) => !attendance[e.id]);
    if (unmarked.length)
      return message.warning(`Mark attendance for all ${unmarked.length} remaining member(s).`);

    setSaving(true);
    const payload = {
      project_id: activeProject.id,
      date: selectedDate.format("YYYY-MM-DD"),
      attendance,
      summary,
      created_by: currentUser?.id,
    };
    let error;
    if (existingSessionId) {
      ({ error } = await supabase.from("standup_sessions").update(payload).eq("id", existingSessionId));
    } else {
      const { data, error: ie } = await supabase.from("standup_sessions").insert(payload).select().single();
      error = ie;
      if (data) setExistingSessionId(data.id);
    }
    if (error) message.error("Save failed: " + error.message);
    else { message.success("Session saved!"); }
    setSaving(false);
  };

  // Derived stats for mark view
  const stats = {
    present:  employees.filter((e) => attendance[e.id] === "present").length,
    absent:   employees.filter((e) => attendance[e.id] === "absent").length,
    late:     employees.filter((e) => attendance[e.id] === "late").length,
    unmarked: employees.filter((e) => !attendance[e.id]).length,
  };
  const markedCount = employees.length - stats.unmarked;
  const progress = employees.length ? Math.round((markedCount / employees.length) * 100) : 0;
  const normalizedPlan = (orgPlan ?? "").trim().toLowerCase();
  const isStarterPlan = normalizedPlan.includes("starter");

  // ── Projects table columns ─────────────────────────────────────────────
  const projectColumns = [
    {
      title: "Project",
      key: "project",
      render: (_, rec) => (
        <Space size={10}>
          <div>
            <Text strong style={{ fontSize: 14, color: "var(--sa-text-primary)", display: "block", lineHeight: 1.3 }}>
              {rec.name}
            </Text>
            <Text style={{ fontSize: 12, color: "var(--sa-text-muted)" }}>{rec.client_name || "—"}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const key = (status || "").toLowerCase();
        const cfg = PROJECT_STATUS_TAG[key] || { color: "var(--sa-text-secondary)", bg: "var(--sa-bg-subtle)", border: "var(--sa-border)", dot: "var(--sa-text-secondary)" };
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "3px 10px", borderRadius: 20,
            border: `1px solid ${cfg.border}`, background: cfg.bg,
            fontSize: 12, fontWeight: 600, color: cfg.color,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
            {capitalize(status)}
          </span>
        );
      },
    },
    {
      title: `Standup (${selectedDate.format("MMM DD")})`,
      key: "standup",
      width: 180,
      render: (_, rec) => {
        const session = projectSessions[rec.id];
        if (!session) {
          return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--sa-text-muted)", fontWeight: 500 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--sa-border)", display: "inline-block" }} />
              Not marked
            </span>
          );
        }
        const att = session.attendance ?? {};
        const p = Object.values(att).filter((v) => v === "present").length;
        const a = Object.values(att).filter((v) => v === "absent").length;
        const l = Object.values(att).filter((v) => v === "late").length;
        return (
          <Space size={6}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{p}P</span>
            <span style={{ color: "var(--sa-border)", fontSize: 10 }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#e11d48" }}>{a}A</span>
            <span style={{ color: "var(--sa-border)", fontSize: 10 }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>{l}L</span>
            {session.summary && (
              <Tooltip title="Has summary">
                <FileTextOutlined style={{ color: "#d97706", fontSize: 12 }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 130,
      render: (_, rec) => {
        const session = projectSessions[rec.id];
        const marked = !!session;
        return (
          <Button
            onClick={() => openMarkView(rec)}
            icon={marked ? <EditOutlined /> : <CheckCircleFilled />}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              height: 34,
              paddingInline: 16,
              border: marked ? "1.5px solid var(--sa-border)" : "none",
              background: marked ? "var(--sa-bg-card)" : (dark ? "#334155" : "#0f172a"),
              color: marked ? "var(--sa-text-secondary)" : "#fff",
              boxShadow: marked || dark ? "none" : "0 2px 8px rgba(15,23,42,0.18)",
              transition: "all 0.15s",
            }}
          >
            {marked ? "Edit" : "Mark"}
          </Button>
        );
      },
    },
  ];

  // ── Attendance table columns ───────────────────────────────────────────
  const attendanceColumns = [
    {
      title: "Member",
      key: "member",
      render: (_, rec, i) => (
        <Space size={10}>
          <Avatar
            size={34}
            src={rec.user_photo}
            style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], fontWeight: 700, fontSize: 12, flexShrink: 0 }}
          >
            {!rec.user_photo && getInitials(rec.full_name)}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 13, color: "var(--sa-text-primary)", display: "block", lineHeight: 1.3 }}>{rec.full_name}</Text>
            <Text style={{ fontSize: 12, color: "var(--sa-text-muted)" }}>{rec.job_title || rec.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: (
        <Space size={6}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Attendance</span>
          <span style={{ color: "var(--sa-border)" }}>·</span>
          {Object.entries(ATTENDANCE_STATUS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => {
                const all = {};
                employees.forEach((e) => (all[e.id] = key));
                setAttendance(all);
              }}
              style={{
                padding: "2px 10px", borderRadius: 20, cursor: "pointer",
                border: `1px solid ${cfg.border}`, background: cfg.bg,
                color: cfg.color, fontSize: 11, fontWeight: 600,
                transition: "opacity 0.15s",
              }}
            >
              All {cfg.label}
            </button>
          ))}
        </Space>
      ),
      key: "status",
      render: (_, rec) => (
        <Radio.Group
          value={attendance[rec.id] ?? null}
          onChange={(e) => setAttendance((prev) => ({ ...prev, [rec.id]: e.target.value }))}
          style={{ display: "flex", gap: 6 }}
        >
          {Object.entries(ATTENDANCE_STATUS).map(([key, cfg]) => {
            const active = attendance[rec.id] === key;
            return (
              <Radio.Button
                key={key}
                value={key}
                style={{
                  borderRadius: 8, height: 32, lineHeight: "30px",
                  paddingInline: 14, fontSize: 12, fontWeight: 600,
                  border: active ? `1.5px solid ${cfg.color}` : "1.5px solid var(--sa-border)",
                  background: active ? cfg.bg : "var(--sa-bg-subtle)",
                  color: active ? cfg.color : "var(--sa-text-muted)",
                  boxShadow: "none", transition: "all 0.15s",
                }}
              >
                <Space size={4}>{cfg.icon}{cfg.label}</Space>
              </Radio.Button>
            );
          })}
        </Radio.Group>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  if (planLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: dark ? "#141416" : "#f8fafc",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (isStarterPlan) {
    return <StarterStandupAttendancePaywall dark={dark} />;
  }

  return (
    <div className={`sa-root${dark ? " dark" : ""}`} style={{ minHeight: "100vh", fontFamily: "'Outfit', sans-serif", background: "var(--sa-bg-page)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        .sa-root {
          --sa-bg-page: #f8fafc;
          --sa-bg-card: #ffffff;
          --sa-bg-subtle: #f8fafc;
          --sa-bg-muted: #f1f5f9;
          --sa-border: #e2e8f0;
          --sa-border-soft: #f1f5f9;
          --sa-text-primary: #0f172a;
          --sa-text-secondary: #64748b;
          --sa-text-muted: #94a3b8;
        }
        .sa-root.dark {
          --sa-bg-page: #141416;
          --sa-bg-card: #1a1b1f;
          --sa-bg-subtle: #17181c;
          --sa-bg-muted: #202127;
          --sa-border: #2a2b31;
          --sa-border-soft: #242428;
          --sa-text-primary: #f3f4f6;
          --sa-text-secondary: #cbd5e1;
          --sa-text-muted: #9ca3af;
        }
        .sa-root * { font-family: 'Outfit', sans-serif !important; }
        .sa-root .ant-radio-button-wrapper::before { display: none !important; }
        .sa-root .ant-table { background: transparent !important; }
        .sa-root .ant-table-thead > tr > th {
          background: var(--sa-bg-subtle) !important; color: var(--sa-text-muted) !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase; letter-spacing: 0.06em;
          border-bottom: 1px solid var(--sa-border-soft) !important;
          padding: 10px 16px !important;
        }
        .sa-root .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--sa-border-soft) !important;
          padding: 12px 16px !important;
          background: var(--sa-bg-card) !important;
        }
        .sa-root .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .sa-root .ant-table-tbody > tr:hover > td { background: var(--sa-bg-subtle) !important; }
        .sa-root .ant-table-wrapper .ant-table { border-radius: 0 !important; }
        .sa-root .ant-select-selector,
        .sa-root .ant-picker,
        .sa-root .ant-input,
        .sa-root .ant-modal-content,
        .sa-root .ant-modal-header {
          border-color: var(--sa-border) !important;
          background: var(--sa-bg-card) !important;
          color: var(--sa-text-primary) !important;
        }
        .sa-root .ant-select-selection-item,
        .sa-root .ant-select-selection-placeholder,
        .sa-root .ant-picker-input > input,
        .sa-root .ant-picker-suffix,
        .sa-root .ant-modal-title,
        .sa-root .ant-typography,
        .sa-root .ant-empty-description,
        .sa-root .ant-modal-close-x {
          color: var(--sa-text-primary) !important;
        }
        .sa-root .back-btn:hover { background: var(--sa-bg-muted) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{padding: "0 40px" }}>
        <div style={{margin: "0 auto" }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 16px", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {activeProject && (
                <button
                  className="back-btn"
                  onClick={closeMarkView}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid var(--sa-border)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "var(--sa-text-secondary)", fontSize: 13, fontWeight: 600, transition: "background 0.15s" }}
                >
                  <ArrowLeftOutlined style={{ fontSize: 12 }} /> Back
                </button>
              )}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--sa-text-primary)" }} />
                  <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--sa-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {activeProject ? `${activeProject.name} · Standup` : "Standup Attendance"}
                  </Text>
                </div>
                <Title level={4} style={{ margin: 0, color: "var(--sa-text-primary)", fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2, marginTop: 2 }}>
                  {activeProject
                    ? `Mark Attendance · ${selectedDate.format("MMM DD, YYYY")}`
                    : `${selectedDate.format("dddd, MMMM DD YYYY")}`
                  }
                </Title>
              </div>
            </div>

            <Space wrap>
              <DatePicker
                value={selectedDate}
                onChange={(d) => { if (d) setSelectedDate(d); }}
                disabledDate={(d) => d && d > dayjs().endOf("day")}
                format="MMM DD, YYYY"
                style={{ width: 155 }}
                allowClear={false}
                suffixIcon={<CalendarOutlined style={{ color: "var(--sa-text-muted)" }} />}
              />
              {activeProject && (
                <>
                  <Button
                    icon={<FileTextOutlined />}
                    onClick={() => setSummaryOpen(true)}
                    style={{
                      borderRadius: 8, height: 36,
                      border: summary ? "1.5px solid #6366f1" : "1.5px solid var(--sa-border)",
                      color: summary ? "#6366f1" : "var(--sa-text-secondary)",
                      fontWeight: 600, background: "var(--sa-bg-card)",
                    }}
                  >
                    {summary ? "Edit Summary" : "Add Summary"}
                  </Button>
                  <Button
                    type="primary" icon={<SaveOutlined />}
                    loading={saving} onClick={handleSave}
                    style={{ borderRadius: 8, height: 36, background: dark ? "#334155" : "#0f172a", border: "none", fontWeight: 700, boxShadow: dark ? "none" : "0 2px 8px rgba(15,23,42,0.2)" }}
                  >
                    {existingSessionId ? "Update" : "Save Session"}
                  </Button>
                </>
              )}
            </Space>
          </div>

          {/* Sub stats bar — only in mark view */}
          {activeProject && (
            <div style={{ display: "flex", gap: 0, borderTop: "1px solid var(--sa-border-soft)", paddingBottom: 0 }}>
              {[
                { key: "present",  label: "Present",  color: "#059669" },
                { key: "absent",   label: "Absent",   color: "#e11d48" },
                { key: "late",     label: "Late",     color: "#d97706" },
                { key: "unmarked", label: "Unmarked", color: "#94a3b8" },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ padding: "12px 24px 12px 0", display: "flex", alignItems: "baseline", gap: 6 }}>
                  <Text style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{stats[key]}</Text>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--sa-text-muted)" }}>{label}</Text>
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0" }}>
                <Progress
                  percent={progress}
                  size="small"
                  style={{ width: 120, margin: 0 }}
                  strokeColor={dark ? "#cbd5e1" : "#0f172a"}
                  trailColor={dark ? "#2a2b31" : "#f1f5f9"}
                  showInfo={false}
                />
                <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--sa-text-primary)" }}>{markedCount}/{employees.length} marked</Text>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{margin: "0 auto", padding: "28px 40px" }}>

        {/* ── Projects table view ── */}
        {!activeProject && (
          <>
            {/* Summary chips */}
            {!loadingProjects && projects.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Total Projects", value: projects.length, color: "var(--sa-text-primary)", bg: "var(--sa-bg-subtle)", border: "var(--sa-border)" },
                  { label: "Marked Today",   value: Object.keys(projectSessions).length, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
                  { label: "Pending",        value: projects.length - Object.keys(projectSessions).length, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                ].map(({ label, value, color, bg, border }) => (
                  <div key={label} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${border}`, background: bg, display: "flex", alignItems: "baseline", gap: 8 }}>
                    <Text style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--sa-text-muted)" }}>{label}</Text>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: "var(--sa-bg-card)", borderRadius: 14, border: "1px solid var(--sa-border-soft)", overflow: "hidden", boxShadow: dark ? "none" : "0 1px 4px rgba(15,23,42,0.04)" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--sa-border-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space>
                  <TeamOutlined style={{ color: "var(--sa-text-muted)" }} />
                  <Text strong style={{ fontSize: 14, color: "var(--sa-text-primary)" }}>Active Projects</Text>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--sa-text-secondary)", background: "var(--sa-bg-muted)", borderRadius: 20, padding: "1px 10px" }}>
                    {projects.length}
                  </span>
                </Space>
                <Text style={{ fontSize: 12, color: "var(--sa-text-muted)" }}>
                  Excluding Completed &amp; On Hold
                </Text>
              </div>

              {loadingProjects ? (
                <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
              ) : projects.length === 0 ? (
                <Empty description={<Text type="secondary">No active projects found for today</Text>} style={{ padding: 64 }} />
              ) : (
                <Table
                  dataSource={projects}
                  columns={projectColumns}
                  rowKey="id"
                  pagination={false}
                  rowClassName="project-row"
                  style={{ borderRadius: 0 }}
                  onRow={(rec) => ({ style: { cursor: "default" } })}
                />
              )}
            </div>
          </>
        )}

        {/* ── Mark attendance view ── */}
        {activeProject && (
          <>
            <div style={{ background: "var(--sa-bg-card)", borderRadius: 14, border: "1px solid var(--sa-border-soft)", overflow: "hidden", boxShadow: dark ? "none" : "0 1px 4px rgba(15,23,42,0.04)" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--sa-border-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
                  <Text strong style={{ fontSize: 14, color: "var(--sa-text-primary)" }}>{activeProject.name}</Text>
                  {existingSessionId && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 20, padding: "1px 10px" }}>
                      ✓ Saved
                    </span>
                  )}
                </Space>
                <Text style={{ fontSize: 12, color: "var(--sa-text-muted)" }}>{employees.length} team members</Text>
              </div>

              {loadingEmployees || loadingSession ? (
                <div style={{ textAlign: "center", padding: 64 }}><Spin /></div>
              ) : employees.length === 0 ? (
                <Empty description="No team members assigned to this project" style={{ padding: 64 }} />
              ) : (
                <Table
                  dataSource={employees}
                  columns={attendanceColumns}
                  rowKey="id"
                  pagination={false}
                  style={{ borderRadius: 0 }}
                />
              )}

              {/* Summary preview strip */}
              {summary && (
                <div style={{ padding: "14px 20px", background: "#fffbeb", borderTop: "1px solid #fde68a", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <FileTextOutlined style={{ color: "#d97706", marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: "#92400e", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Summary
                    </Text>
                    <Text style={{ fontSize: 13, color: "#78350f", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{summary}</Text>
                  </div>
                  <Button type="text" icon={<EditOutlined />} size="small" onClick={() => setSummaryOpen(true)} style={{ color: "#d97706", flexShrink: 0 }} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Summary modal ── */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: "#6366f1" }} />
            <Text strong style={{ fontSize: 15 }}>Standup Summary</Text>
          </Space>
        }
        open={summaryOpen}
        onCancel={() => setSummaryOpen(false)}
        onOk={() => setSummaryOpen(false)}
        okText="Done"
        okButtonProps={{ style: { background: dark ? "#334155" : "#0f172a", border: "none", borderRadius: 8, fontWeight: 700 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={560}
      >
        <Divider style={{ marginTop: 0 }} />
        <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 12, lineHeight: 1.7 }}>
          Capture blockers, decisions, and action items from today's standup.
        </Text>
        <TextArea
          rows={9}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={"• What did the team complete yesterday?\n• What is everyone working on today?\n• Any blockers or dependencies?\n• Key decisions made..."}
          style={{ borderRadius: 10, fontSize: 13, lineHeight: 1.8, resize: "none", border: "1.5px solid var(--sa-border)", background: "var(--sa-bg-card)", color: "var(--sa-text-primary)" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{summary.length} chars</Text>
        </div>
      </Modal>
    </div>
  );
}


