import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  Modal,
  Input,
  Select,
  Spin,
  Tooltip,
  DatePicker,
  TimePicker,
  message,
} from "antd";
import {
  Video,
  Mic,
  Plus,
  Link2,
  Search,
  Clock,
  Calendar,
  Repeat2,
  Radio,
  CheckCircle2,
  Sparkles,
  Copy,
  X,
  Trash2,
  Zap,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Users,
  MoreHorizontal,
  Bell,
  Settings,
  Play,
  Square,
  Hash,
  AlignLeft,
  Timer,
  Layers,
  Lock,
  ArrowRight,
  Star,
  Shield,
  Cpu,
} from "lucide-react";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useNavigate } from "react-router-dom";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { Option } = Select;
const { TextArea } = Input;

// ─── Groq ─────────────────────────────────────────────────────────────────────
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

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

const sendEmail = async ({ to, subject, body, companyName }) => {
  try {
    const res = await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html: body, companyName }),
    });
    const data = await res.json();
    return res.ok ? { success: true, data } : { success: false, error: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#dbeafe", "#2563eb"],
  ["#dcfce7", "#16a34a"],
  ["#fef3c7", "#d97706"],
  ["#ede9fe", "#7c3aed"],
  ["#ffe4e6", "#e11d48"],
  ["#cffafe", "#0891b2"],
];
function avatarColor(str = "") {
  let h = 0;
  for (let c of str) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function initials(name = "") {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}
function fmtTime(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDateFull(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
function genRoomId() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const seg = () =>
    Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * 26)]).join(
      "",
    );
  return `${seg()}-${seg()}-${seg()}`;
}
function getStatusColor(status) {
  if (status === "live")
    return {
      dot: "#22c55e",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      text: "#15803d",
    };
  if (status === "scheduled")
    return {
      dot: "#3b82f6",
      bg: "#eff6ff",
      border: "#bfdbfe",
      text: "#1d4ed8",
    };
  return { dot: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0", text: "#64748b" };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function UserAvatar({ profile, size = 32 }) {
  const [bg, fg] = avatarColor(profile?.full_name || profile?.email || "");
  if (profile?.user_photo) {
    return (
      <img
        src={profile.user_photo}
        alt={profile.full_name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
        letterSpacing: "-0.02em",
      }}
    >
      {initials(profile?.full_name || profile?.email)}
    </div>
  );
}

// ─── FREE PLAN PAYWALL ────────────────────────────────────────────────────────
function FreePlanPaywall({ navigate }) {
  const features = [
    {
      icon: <Video size={16} />,
      title: "HD Video Meetings",
      desc: "Crystal-clear video calls with up to 100 participants, screen sharing, and virtual backgrounds.",
    },
    {
      icon: <Sparkles size={16} />,
      title: "AI-Powered Summaries",
      desc: "Automatic meeting summaries, action items, decisions, and sentiment analysis powered by Groq AI.",
    },
    {
      icon: <Radio size={16} />,
      title: "Live Meeting Rooms",
      desc: "Instant meeting rooms with unique links. Start, join and manage meetings in real time.",
    },
    {
      icon: <Calendar size={16} />,
      title: "Smart Calendar View",
      desc: "Visual calendar with meeting previews, day agenda, live indicators and month navigation.",
    },
    {
      icon: <Square size={16} />,
      title: "Meeting Recordings",
      desc: "Record and replay meetings. Download recordings and share with attendees who missed it.",
    },
    {
      icon: <Repeat2 size={16} />,
      title: "Recurring Schedules",
      desc: "Set daily, weekly or monthly recurring meetings with smart calendar integrations.",
    },
  ];

  const fakeMeetings = [
    {
      title: "Weekly Team Sync",
      time: "10:00 AM",
      dur: 60,
      people: 8,
      status: "live",
    },
    {
      title: "Product Design Review",
      time: "2:00 PM",
      dur: 45,
      people: 5,
      status: "scheduled",
    },
    {
      title: "Q4 Planning Session",
      time: "4:30 PM",
      dur: 90,
      people: 12,
      status: "scheduled",
    },
    {
      title: "Sprint Retrospective",
      time: "Yesterday",
      dur: 60,
      people: 7,
      status: "ended",
    },
    {
      title: "Client Onboarding Call",
      time: "Mon 11:00",
      dur: 30,
      people: 4,
      status: "ended",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* ── Header — mirrors the real Meetings page header ── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "20px 28px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: 26,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              Meetings
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Schedule · Join · Summarise — all in one place
            </p>
          </div>

          {/* Nav toggle + disabled create button */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              disabled
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 18px",
                background: "#e2e8f0",
                border: "none",
                borderRadius: 9,
                fontWeight: 700,
                fontSize: 13,
                color: "#94a3b8",
                cursor: "not-allowed",
                opacity: 0.6,
              }}
            >
              <Plus size={14} /> New Meeting
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 28px 40px" }}>
        {/* ── Blurred mock KPI strip ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 24,
            filter: "blur(6px)",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.45,
          }}
        >
          {[
            ["#3b82f6", "12", "Upcoming Meetings"],
            ["#8b5cf6", "3", "Live Right Now"],
            ["#f59e0b", "48", "Total Recorded"],
            ["#10b981", "24", "AI Summaries"],
          ].map(([color, val, label]) => (
            <div
              key={label}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
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
                  background: `${color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color,
                }}
              >
                <Calendar size={18} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1,
                  }}
                >
                  {val}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
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

        {/* ── Main paywall card ── */}
        <div
          style={{
            position: "relative",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          {/* Blurred mock calendar grid */}
          <div
            style={{
              filter: "blur(5px)",
              pointerEvents: "none",
              userSelect: "none",
              opacity: 0.3,
              padding: "24px 24px 0",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                marginBottom: 0,
              }}
            >
              {/* Day headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#fff",
                }}
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    style={{
                      padding: "10px 0",
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Calendar rows */}
              {[...Array(3)].map((_, wi) => (
                <div
                  key={wi}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7,1fr)",
                    borderBottom: wi < 2 ? "1px solid #f1f5f9" : "none",
                  }}
                >
                  {[...Array(7)].map((_, di) => (
                    <div
                      key={di}
                      style={{
                        minHeight: 80,
                        padding: "8px 10px",
                        borderLeft: di > 0 ? "1px solid #f8fafc" : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "#f1f5f9",
                          marginBottom: 6,
                        }}
                      />
                      {(wi + di) % 3 === 0 && (
                        <div
                          style={{
                            height: 18,
                            borderRadius: 4,
                            background: "#bfdbfe",
                            marginBottom: 4,
                          }}
                        />
                      )}
                      {(wi + di) % 4 === 0 && (
                        <div
                          style={{
                            height: 18,
                            borderRadius: 4,
                            background: "#bbf7d0",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Gradient bleed over the mock */}
          <div
            style={{
              position: "relative",
              padding: "48px 40px 44px",
              marginTop: -300,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 8%)",
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
                  background:
                    "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
                  border: "1px solid #ddd6fe",
                  borderRadius: 30,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
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
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
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
                  color: "#0f172a",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.15,
                }}
              >
                Run smarter meetings with
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Meetings & Calendar
                </span>
              </h2>
            </div>
            <p
              style={{
                textAlign: "center",
                fontSize: 15,
                color: "#64748b",
                maxWidth: 480,
                margin: "0 auto 36px",
                lineHeight: 1.6,
              }}
            >
              A complete meeting platform — from HD video rooms and smart
              scheduling to AI-generated summaries, recordings, and real-time
              team visibility.
            </p>

            {/* Feature grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginBottom: 36,
                maxWidth: 760,
                margin: "0 auto 36px",
              }}
            >
              {features.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 18px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
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
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3b82f6",
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
                        color: "#0f172a",
                        marginBottom: 3,
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        lineHeight: 1.5,
                      }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* How it works flow */}
            <div
              style={{
                maxWidth: 760,
                margin: "0 auto 36px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "0.07em",
                  marginBottom: 16,
                }}
              >
                HOW IT WORKS
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {[
                  {
                    label: "Schedule",
                    sub: "Pick date, time & guests",
                    color: "#3b82f6",
                    icon: <Calendar size={14} />,
                  },
                  {
                    label: "Join Room",
                    sub: "HD video with one click",
                    color: "#6366f1",
                    icon: <Video size={14} />,
                  },
                  {
                    label: "AI Summary",
                    sub: "Auto notes & action items",
                    color: "#8b5cf6",
                    icon: <Sparkles size={14} />,
                  },
                  {
                    label: "Review",
                    sub: "Replay recording anytime",
                    color: "#10b981",
                    icon: <Square size={14} />,
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
                          background: `${s.color}12`,
                          border: `1.5px solid ${s.color}30`,
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
                          color: "#0f172a",
                          marginBottom: 2,
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
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
                          color: "#d1d5db",
                        }}
                      >
                        <ChevronRight size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sample meetings list */}
            <div
              style={{
                maxWidth: 760,
                margin: "0 auto 36px",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f1f5f9",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}
                >
                  Sample Meetings
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    background: "#e2e8f0",
                    padding: "1px 7px",
                    borderRadius: 5,
                    fontWeight: 600,
                  }}
                >
                  Preview
                </span>
              </div>
              {fakeMeetings.map((m, i) => {
                const c = getStatusColor(m.status);
                return (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "8px 1fr 100px 80px",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 16px",
                      borderBottom:
                        i < fakeMeetings.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                      background: i % 2 === 0 ? "#fff" : "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: c.dot,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                          marginBottom: 2,
                        }}
                      >
                        {m.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <span>{m.time}</span>
                        <span>·</span>
                        <span>{m.dur} min</span>
                        <span>·</span>
                        <span>{m.people} people</span>
                      </div>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: 6,
                          background: c.bg,
                          color: c.text,
                          border: `1px solid ${c.border}`,
                        }}
                      >
                        {m.status === "live"
                          ? "Live"
                          : m.status === "scheduled"
                            ? "Upcoming"
                            : "Ended"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[Video, Sparkles].map((Icon, ii) => (
                        <div
                          key={ii}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                          }}
                        >
                          <Icon size={11} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
                  background:
                    "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)",
                  color: "#fff",
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 15,
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  boxShadow:
                    "0 4px 24px rgba(99,102,241,0.35), 0 1px 3px rgba(0,0,0,0.1)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 32px rgba(99,102,241,0.45), 0 1px 3px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 24px rgba(99,102,241,0.35), 0 1px 3px rgba(0,0,0,0.1)";
                }}
              >
                <Zap size={16} fill="currentColor" />
                Upgrade to unlock Meetings
                <ArrowRight size={16} />
              </a>
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "#94a3b8" }}>
                Upgrade your plan to access the full Meetings module and all Pro
                features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar Grid ────────────────────────────────────────────────────────────
function CalendarView({
  meetings,
  currentMonth,
  onDayClick,
  selectedDay,
  onMeetingClick,
}) {
  const startOfMonth = currentMonth.startOf("month");
  const endOfMonth = currentMonth.endOf("month");
  const startDay = startOfMonth.day();
  const daysInMonth = currentMonth.daysInMonth();
  const today = dayjs();

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getMeetingsForDay = (day) => {
    if (!day) return [];
    const date = currentMonth.date(day);
    return meetings.filter((m) => {
      const md = dayjs(m.meeting_date);
      return (
        md.year() === date.year() &&
        md.month() === date.month() &&
        md.date() === date.date()
      );
    });
  };

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #f1f5f9",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            style={{
              padding: "10px 0",
              textAlign: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div
          key={wi}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            borderBottom: wi < weeks.length - 1 ? "1px solid #f8fafc" : "none",
          }}
        >
          {week.map((day, di) => {
            const dayMeetings = getMeetingsForDay(day);
            const isToday =
              day &&
              today.year() === currentMonth.year() &&
              today.month() === currentMonth.month() &&
              today.date() === day;
            const isSelected = day && selectedDay === day;
            const isWeekend = di === 0 || di === 6;
            const hasLive = dayMeetings.some((m) => m.status === "live");

            return (
              <div
                key={di}
                onClick={() => day && onDayClick(day)}
                style={{
                  minHeight: 96,
                  padding: "8px 10px",
                  cursor: day ? "pointer" : "default",
                  background: isSelected
                    ? "#eff6ff"
                    : isWeekend && day
                      ? "#fafbfc"
                      : "#fff",
                  borderLeft: di > 0 ? "1px solid #f8fafc" : "none",
                  transition: "background 0.15s",
                  position: "relative",
                }}
              >
                {day && (
                  <>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: isToday ? 700 : 500,
                        background: isToday ? "#0f172a" : "transparent",
                        color: isToday
                          ? "#fff"
                          : isWeekend
                            ? "#94a3b8"
                            : "#1e293b",
                        marginBottom: 4,
                      }}
                    >
                      {day}
                    </div>
                    {hasLive && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#22c55e",
                        }}
                      />
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      {dayMeetings.slice(0, 3).map((m) => {
                        const c = getStatusColor(m.status);
                        return (
                          <div
                            key={m.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onMeetingClick(m);
                            }}
                            style={{
                              padding: "2px 6px",
                              borderRadius: 5,
                              fontSize: 10,
                              fontWeight: 600,
                              background: c.bg,
                              color: c.text,
                              border: `1px solid ${c.border}`,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              transition: "opacity 0.1s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.opacity = "0.75")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.opacity = "1")
                            }
                          >
                            {m.status === "live" && "● "}
                            {fmtTime(m.meeting_date)} {m.title}
                          </div>
                        );
                      })}
                      {dayMeetings.length > 3 && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "#94a3b8",
                            fontWeight: 600,
                            paddingLeft: 4,
                          }}
                        >
                          +{dayMeetings.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Meeting Detail Panel ─────────────────────────────────────────────────────
function MeetingDetailPanel({
  meeting,
  profiles,
  onJoin,
  onSummary,
  onCopyLink,
  copiedLink,
  onClose,
  currentUser,
  userId,
  onDelete,
}) {
  if (!meeting) return null;
  const c = getStatusColor(meeting.status);
  const attendeeEmails = meeting.attendee_emails || [];
  const attendeeProfiles = attendeeEmails.map(
    (email) =>
      profiles.find((p) => p.email === email) || {
        id: email,
        email,
        full_name: email,
      },
  );
  let agendaItems = [];
  try {
    agendaItems = JSON.parse(meeting.agenda_items || "[]");
  } catch {}
  const meetingLink =
    meeting.meeting_url ||
    `${window.location.origin}/meet/${meeting.meeting_room_id}`;

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: 380,
        background: "#fff",
        borderLeft: "1px solid #f1f5f9",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.06)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        animation: "slideIn 0.2s ease",
      }}
    >
      <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      <div
        style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f8fafc" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              borderRadius: 999,
              background: c.bg,
              border: `1px solid ${c.border}`,
            }}
          >
            {meeting.status === "live" && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: c.dot,
                  display: "inline-block",
                  animation: "pulse 2s infinite",
                }}
              />
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: c.text,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {meeting.status}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: 4,
              borderRadius: 6,
              display: "flex",
            }}
          >
            <X size={16} />
          </button>
        </div>
        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#0f172a",
            margin: "0 0 6px",
            lineHeight: 1.3,
          }}
        >
          {meeting.title}
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
            color: "#64748b",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={12} />
            {fmtDateFull(meeting.meeting_date)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
            color: "#64748b",
            marginTop: 4,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={12} />
            {fmtTime(meeting.meeting_date)} · {meeting.duration || "—"} min
          </span>
          {meeting.is_recurring && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Repeat2 size={12} />
              {meeting.recurrence_pattern}
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        {meeting.description && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 8,
              }}
            >
              Description
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {meeting.description}
            </p>
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            Participants · {attendeeProfiles.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {attendeeProfiles.map((p, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <UserAvatar profile={p} size={30} />
                <div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}
                  >
                    {p.full_name || p.email}
                  </div>
                  {p.job_title && (
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {p.job_title}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {agendaItems.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 10,
              }}
            >
              Agenda
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {agendaItems.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: "#f8fafc",
                    borderRadius: 10,
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#e0e7ff",
                      color: "#4f46e5",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, fontSize: 12, color: "#374151" }}>
                    {a.text}
                  </div>
                  <div
                    style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}
                  >
                    {a.dur}m
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Meeting Link
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "#f8fafc",
              border: "1px solid #f1f5f9",
              borderRadius: 10,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                color: "#3b82f6",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {meetingLink}
            </span>
            <button
              onClick={() => onCopyLink(meeting)}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                color: copiedLink === meeting.id ? "#22c55e" : "#94a3b8",
                display: "flex",
                padding: 2,
              }}
            >
              {copiedLink === meeting.id ? (
                <CheckCircle2 size={14} />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid #f8fafc",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {(meeting.status === "live" || meeting.status === "scheduled") && (
          <button
            onClick={() => onJoin(meeting)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 0",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background:
                meeting.status === "live"
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              boxShadow:
                meeting.status === "live"
                  ? "0 4px 12px rgba(34,197,94,0.3)"
                  : "0 4px 12px rgba(59,130,246,0.3)",
            }}
          >
            <ExternalLink size={14} />
            {meeting.status === "live" ? "Join Now" : "Start Meeting"}
          </button>
        )}
        {meeting.status === "ended" && (
          <button
            onClick={() => onSummary(meeting)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 0",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
            }}
          >
            <Sparkles size={14} /> AI Summary
          </button>
        )}
        {meeting.has_recording && meeting.recording_url && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => window.open(meeting.recording_url, "_blank")}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "11px 0",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
              }}
            >
              <Play size={14} /> View Recording
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(meeting.recording_url);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${meeting.title.replace(/[^a-zA-Z0-9]/g, "_")}_recording.webm`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                  message.success("Recording downloaded!");
                } catch (error) {
                  message.error("Failed to download recording");
                }
              }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "11px 0",
                borderRadius: 12,
                border: "1px solid #f59e0b",
                cursor: "pointer",
                background: "#fff",
                color: "#d97706",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Square size={14} /> Download
            </button>
          </div>
        )}
        {meeting.created_by === userId && (
          <button
            onClick={() => onDelete(meeting)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 0",
              borderRadius: 12,
              border: "1px solid #ef4444",
              cursor: "pointer",
              background: "#fff",
              color: "#ef4444",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Trash2 size={14} /> Delete Meeting
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Day Agenda List ──────────────────────────────────────────────────────────
function DayAgendaList({
  meetings,
  selectedDay,
  currentMonth,
  profiles,
  onMeetingClick,
  onJoin,
  onCopyLink,
  copiedLink,
}) {
  const filtered = (() => {
    if (!selectedDay) {
      const today = dayjs();
      return meetings
        .filter((m) => dayjs(m.meeting_date).isSameOrAfter(today, "day"))
        .slice(0, 10);
    }
    const date = currentMonth.date(selectedDay);
    return meetings.filter((m) => {
      const md = dayjs(m.meeting_date);
      return (
        md.year() === date.year() &&
        md.month() === date.month() &&
        md.date() === date.date()
      );
    });
  })();

  const label = selectedDay
    ? currentMonth.date(selectedDay).format("ddd, MMM D")
    : "Upcoming";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{ padding: "20px 20px 12px", borderBottom: "1px solid #f8fafc" }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#0f172a",
            marginTop: 2,
          }}
        >
          {filtered.length} {filtered.length === 1 ? "Meeting" : "Meetings"}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#cbd5e1",
            }}
          >
            <Calendar
              size={32}
              style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }}
            />
            <div style={{ fontSize: 13, fontWeight: 500 }}>No meetings</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              Enjoy your free day
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((m) => {
              const c = getStatusColor(m.status);
              const attendeeEmails = m.attendee_emails || [];
              const atProfiles = attendeeEmails.slice(0, 3).map(
                (email) =>
                  profiles.find((p) => p.email === email) || {
                    id: email,
                    email,
                    full_name: email,
                  },
              );
              const meetingLink =
                m.meeting_url ||
                `${window.location.origin}/meet/${m.meeting_room_id}`;
              return (
                <div
                  key={m.id}
                  onClick={() => onMeetingClick(m)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${c.border}`,
                    background: c.bg,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    borderLeft: `3px solid ${c.dot}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                          marginBottom: 3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {m.title}
                        {m.has_recording && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: "#f59e0b",
                              flexShrink: 0,
                            }}
                            title="Recording available"
                          >
                            <Play size={8} style={{ color: "white" }} />
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Clock size={10} />
                          {fmtTime(m.meeting_date)}
                        </span>
                        <span>·</span>
                        <span>{m.duration || "—"} min</span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {atProfiles.map((p, i) => (
                        <div
                          key={i}
                          style={{
                            marginLeft: i > 0 ? -6 : 0,
                            border: "2px solid #fff",
                            borderRadius: "50%",
                            zIndex: atProfiles.length - i,
                          }}
                        >
                          <UserAvatar profile={p} size={22} />
                        </div>
                      ))}
                      {attendeeEmails.length > 3 && (
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "#e2e8f0",
                            border: "2px solid #fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 8,
                            fontWeight: 700,
                            color: "#64748b",
                            marginLeft: -6,
                          }}
                        >
                          +{attendeeEmails.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                    {(m.status === "live" || m.status === "scheduled") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onJoin(m);
                        }}
                        style={{
                          flex: 1,
                          padding: "6px 0",
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                          background:
                            m.status === "live" ? "#22c55e" : "#3b82f6",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <ExternalLink size={10} />
                        {m.status === "live" ? "Join" : "Start"}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard?.writeText(meetingLink);
                        onCopyLink(m);
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        cursor: "pointer",
                        background: "#fff",
                        color: copiedLink === m.id ? "#22c55e" : "#64748b",
                        fontSize: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        fontWeight: 600,
                      }}
                    >
                      {copiedLink === m.id ? (
                        <CheckCircle2 size={10} />
                      ) : (
                        <Copy size={10} />
                      )}
                      {copiedLink === m.id ? "Copied" : "Copy Link"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MeetingsPage() {
  const navigate = useNavigate();

  const [tenantId, setTenantId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("calendar");
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);
  const [search, setSearch] = useState("");

  // ── Plan detection ────────────────────────────────────────────────────────
  // Reads from organizations.plan for the current user's tenant
  const [orgPlan, setOrgPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: dayjs(),
    time: dayjs().add(5, "minute"),
    duration: 60,
    recurrence: "",
    type: "video",
  });
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [agendaItems, setAgendaItems] = useState([
    { id: 1, text: "", dur: 10 },
  ]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const [summaryMeeting, setSummaryMeeting] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const meetingsChannelRef = useRef(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, tenant_id")
          .eq("id", user.id)
          .single();
        setCurrentUser(profile);
        setTenantId(profile?.tenant_id ?? null);

        // ── Fetch org plan ───────────────────────────────────────────────────
        // Reads plan from organizations table for this tenant
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

  useEffect(() => {
    if (!tenantId || !userId) return;
    fetchProfiles();
    fetchMeetings();
    subscribeToMeetings();
    return () => {
      if (meetingsChannelRef.current)
        supabase.removeChannel(meetingsChannelRef.current);
    };
  }, [tenantId, userId]);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, job_title, department, user_photo, role")
      .eq("tenant_id", tenantId)
      .neq("suspended", true)
      .order("full_name");
    setProfiles(data || []);
  };

  const fetchMeetings = async () => {
    const userEmail = currentUser?.email;
    const { data, error } = await supabase
      .from("meetings")
      .select(
        "id, title, description, meeting_date, duration, status, meeting_type, attendee_emails, attendees, agenda_items, is_recurring, recurrence_pattern, meeting_room_id, meeting_url, tenant_id, created_by, transcript, ai_summary, recording_url, has_recording",
      )
      .eq("tenant_id", tenantId)
      .or(`created_by.eq.${userId},attendees.cs.["${userId}"]`)
      .order("meeting_date", { ascending: true });

    if (error) {
      const { data: allData } = await supabase
        .from("meetings")
        .select(
          "id, title, description, meeting_date, duration, status, meeting_type, attendee_emails, attendees, agenda_items, is_recurring, recurrence_pattern, meeting_room_id, meeting_url, tenant_id, created_by, transcript, ai_summary, recording_url, has_recording",
        )
        .eq("tenant_id", tenantId)
        .order("meeting_date", { ascending: true });
      const visible = (allData || []).filter(
        (m) =>
          m.created_by === userId ||
          (m.attendee_emails || []).includes(userEmail) ||
          (() => {
            try {
              return JSON.parse(m.attendees || "[]").includes(userId);
            } catch {
              return false;
            }
          })(),
      );
      setMeetings(visible);
    } else {
      setMeetings(data || []);
    }
    setLoading(false);
  };

  const subscribeToMeetings = () => {
    const ch = supabase
      .channel(`meetings-tenant-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meetings",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => fetchMeetings(),
      )
      .subscribe();
    meetingsChannelRef.current = ch;
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const openMeetingRoom = async (meeting) => {
    if (meeting.status === "scheduled") {
      await supabase
        .from("meetings")
        .update({ status: "live" })
        .eq("id", meeting.id);
    }
    window.open(
      `/meet/${meeting.meeting_room_id}?meetingId=${meeting.id}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const copyMeetingLink = (meeting) => {
    const link =
      meeting.meeting_url ||
      `${window.location.origin}/meet/${meeting.meeting_room_id}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(meeting.id);
    setTimeout(() => setCopiedLink(null), 2500);
    message.success("Link copied!");
  };

  const openCreate = () => {
    // Double-guard: also block here if somehow the button is still shown
    if (isFreePlan) {
      navigate("/subscription");
      return;
    }
    const base = selectedDay ? currentMonth.date(selectedDay) : dayjs();
    setForm({
      title: "",
      description: "",
      date: base,
      time: dayjs().add(30, "minute"),
      duration: 60,
      recurrence: "",
      type: "video",
    });
    setSelectedParticipants([]);
    setAgendaItems([{ id: 1, text: "", dur: 10 }]);
    setParticipantSearch("");
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      message.warning("Please enter a meeting title");
      return;
    }
    setCreating(true);
    try {
      const roomId = genRoomId();
      const dateTime =
        form.date && form.time
          ? form.date
              .hour(form.time.hour())
              .minute(form.time.minute())
              .second(0)
          : dayjs().add(5, "minute");
      const meetingUrl = `${window.location.origin}/meet/${roomId}`;
      const allAttendeeEmails = [
        currentUser?.email,
        ...selectedParticipants.map((p) => p.email),
      ].filter(Boolean);
      const allAttendeeIds = [
        userId,
        ...selectedParticipants.map((p) => p.id),
      ].filter(Boolean);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        meeting_date: dateTime.toISOString(),
        duration: form.duration,
        status: "scheduled",
        meeting_type: form.type,
        attendee_emails: allAttendeeEmails,
        attendees: JSON.stringify(allAttendeeIds),
        agenda_items: JSON.stringify(agendaItems.filter((a) => a.text.trim())),
        created_by: userId,
        tenant_id: tenantId,
        is_recurring: !!form.recurrence,
        recurrence_pattern: form.recurrence || null,
        meeting_room_id: roomId,
        meeting_url: meetingUrl,
      };

      const { data: newMeeting, error } = await supabase
        .from("meetings")
        .insert([payload])
        .select()
        .single();
      if (error) throw error;

      message.success("Meeting created!");
      setMeetings((prev) => [...prev, newMeeting]);
      setShowCreate(false);
      setCurrentMonth(dateTime.startOf("month"));
      setSelectedDay(dateTime.date());
      setSelectedMeeting(newMeeting);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Failed to create meeting");
    } finally {
      setCreating(false);
    }
  };

  const generateAISummary = async (meeting) => {
    setSummaryLoading(true);
    try {
      let chatMessages = [];
      try {
        chatMessages = JSON.parse(meeting.transcript || "[]");
      } catch {}
      let agItems = [];
      try {
        agItems = JSON.parse(meeting.agenda_items || "[]");
      } catch {}
      const attendeeNames = (meeting.attendee_emails || [])
        .map(
          (email) =>
            profiles.find((p) => p.email === email)?.full_name || email,
        )
        .join(", ");

      const contextBlock =
        `Meeting Title: ${meeting.title}\nDuration: ${meeting.duration || "?"} minutes\nParticipants: ${attendeeNames || "Unknown"}\nAgenda: ${agItems.map((a, i) => `${i + 1}. ${a.text} (${a.dur} min)`).join("; ") || "None"}\nChat Log: ${
          Array.isArray(chatMessages) && chatMessages.length
            ? chatMessages
                .filter((m) => !m.isSystem)
                .map((m) => `[${m.sender}]: ${m.text}`)
                .join("\n")
            : "No chat messages"
        }`.trim();

      const systemPrompt = `You are an expert meeting analyst. Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{"summary":"string","actionItems":[{"text":"...","assignee":"...","due":"..."}],"decisions":["..."],"keyTopics":["..."],"risks":["..."],"nextSteps":["..."],"sentiment":{"engagement":75,"positivity":70,"resolution":80}}
SUMMARY FORMAT RULES: The "summary" field must be well-structured plain text. Use simple dashes for bullet points. Keep it clean and readable. Base sentiment on tone and content. Ensure JSON is always valid.`;

      const raw = await groq(systemPrompt, contextBlock);
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      await supabase
        .from("meetings")
        .update({
          ai_summary: parsed.summary,
          transcript: JSON.stringify({ ...parsed, _chatLog: chatMessages }),
        })
        .eq("id", meeting.id);
      setSummaryData(parsed);
    } catch (e) {
      console.error("AI Summary error:", e);
      message.error("Failed to generate AI summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const showSummary = async (meeting) => {
    setSummaryMeeting(meeting);
    setSummaryData(null);
    setSummaryLoading(true);
    try {
      const parsed = JSON.parse(meeting.transcript || "{}");
      if (parsed.summary) {
        setSummaryData(parsed);
        setSummaryLoading(false);
        return;
      }
    } catch {}
    await generateAISummary(meeting);
  };

  const deleteMeeting = async (meeting) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${meeting.title}"? This action cannot be undone.`,
      )
    )
      return;
    try {
      if (meeting.recording_url) {
        try {
          const urlParts = meeting.recording_url.split("/");
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage
            .from("meeting-recordings")
            .remove([`recordings/${meeting.meeting_room_id}/${fileName}`]);
        } catch (storageError) {
          console.warn("Could not delete recording file:", storageError);
        }
      }
      await supabase
        .from("meeting_participants")
        .delete()
        .eq("meeting_id", meeting.id);
      const { error } = await supabase
        .from("meetings")
        .delete()
        .eq("id", meeting.id);
      if (error) throw error;
      message.success("Meeting deleted successfully");
      setSelectedMeeting(null);
    } catch (error) {
      console.error("Error deleting meeting:", error);
      message.error("Failed to delete meeting");
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredMeetings = search
    ? meetings.filter((m) =>
        m.title?.toLowerCase().includes(search.toLowerCase()),
      )
    : meetings;

  const liveMeetings = meetings.filter((m) => m.status === "live");
  const filteredProfiles = profiles.filter(
    (p) =>
      p.id !== userId &&
      !selectedParticipants.find((s) => s.id === p.id) &&
      (p.full_name?.toLowerCase().includes(participantSearch.toLowerCase()) ||
        p.email?.toLowerCase().includes(participantSearch.toLowerCase())),
  );
  const todayMeetings = meetings.filter((m) =>
    dayjs(m.meeting_date).isSame(dayjs(), "day"),
  );

  console.log(orgPlan);

  // ── Plan check ────────────────────────────────────────────────────────────
  // "Free" plan (case-insensitive) blocks the full meetings feature
  const isFreePlan = orgPlan != null && orgPlan.trim().toLowerCase() === "free";

  if (!currentUser || planLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: "#94a3b8", fontSize: 13 }}>
            Loading your workspace…
          </p>
        </div>
      </div>
    );
  }

  // ── FREE PLAN: show paywall instead of full page ──────────────────────────
  if (isFreePlan) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        <FreePlanPaywall navigate={navigate} />
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } } * { box-sizing: border-box; }`}</style>
      </div>
    );
  }

  // ── FULL PAGE (paid plans) ────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #f1f5f9",
          padding: "0 28px",
          height: 60,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg, #0f172a, #0f172a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={16} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              Meetings
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {todayMeetings.length > 0
                ? `${todayMeetings.length} meeting${todayMeetings.length > 1 ? "s" : ""} today`
                : "No meetings today"}
              {liveMeetings.length > 0 && (
                <span
                  style={{ marginLeft: 8, color: "#22c55e", fontWeight: 700 }}
                >
                  ● {liveMeetings.length} live
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ position: "relative", marginLeft: "auto" }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              pointerEvents: "none",
            }}
          />
          <input
            placeholder="Search meetings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: 32,
              paddingRight: 16,
              paddingTop: 7,
              paddingBottom: 7,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              fontSize: 13,
              color: "#374151",
              outline: "none",
              width: 200,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f1f5f9",
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}
        >
          {[
            { key: "calendar", icon: <Layers size={14} /> },
            { key: "list", icon: <AlignLeft size={14} /> },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: view === v.key ? "#fff" : "transparent",
                color: view === v.key ? "#3b82f6" : "#94a3b8",
                boxShadow:
                  view === v.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              {v.icon}
            </button>
          ))}
        </div>
        {currentUser?.role !== "employee" && (
          <button
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #0f172a, #0f172a)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
            }}
          >
            <Plus size={14} /> New Meeting
          </button>
        )}
      </div>

      {/* LIVE BANNER */}
      {liveMeetings.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #dcfce7, #d1fae5)",
            borderBottom: "1px solid #a7f3d0",
            padding: "10px 28px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
              animation: "pulse 2s infinite",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
            {liveMeetings.length} meeting{liveMeetings.length > 1 ? "s" : ""} in
            progress
          </span>
          <div style={{ display: "flex", gap: 8, marginLeft: 4 }}>
            {liveMeetings.slice(0, 3).map((m) => (
              <button
                key={m.id}
                onClick={() => openMeetingRoom(m)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: "1px solid #86efac",
                  background: "#fff",
                  color: "#16a34a",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <ExternalLink size={10} /> {m.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
          }}
        >
          <Spin size="large" />
        </div>
      ) : view === "calendar" ? (
        <div
          style={{
            display: "flex",
            height: "calc(100vh - 60px)",
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <button
                onClick={() => setCurrentMonth((m) => m.subtract(1, "month"))}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#0f172a",
                  flex: 1,
                }}
              >
                {currentMonth.format("MMMM YYYY")}
              </h2>
              <button
                onClick={() => {
                  setCurrentMonth(dayjs());
                  setSelectedDay(dayjs().date());
                }}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#3b82f6",
                }}
              >
                Today
              </button>
              <button
                onClick={() => setCurrentMonth((m) => m.add(1, "month"))}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <CalendarView
              meetings={filteredMeetings}
              currentMonth={currentMonth}
              onDayClick={(day) =>
                setSelectedDay(selectedDay === day ? null : day)
              }
              selectedDay={selectedDay}
              onMeetingClick={(m) => setSelectedMeeting(m)}
            />
          </div>
          <div
            style={{
              width: 300,
              borderLeft: "1px solid #f1f5f9",
              background: "#fff",
              flexShrink: 0,
              overflowY: "auto",
            }}
          >
            <DayAgendaList
              meetings={filteredMeetings}
              selectedDay={selectedDay}
              currentMonth={currentMonth}
              profiles={profiles}
              onMeetingClick={(m) => setSelectedMeeting(m)}
              onJoin={openMeetingRoom}
              onCopyLink={copyMeetingLink}
              copiedLink={copiedLink}
            />
          </div>
        </div>
      ) : (
        <div style={{ margin: "0 auto", padding: "28px 24px" }}>
          {["live", "scheduled", "ended"].map((status) => {
            const group = filteredMeetings.filter((m) => m.status === status);
            if (group.length === 0) return null;
            const labels = {
              live: "Live Now",
              scheduled: "Upcoming",
              ended: "Past Meetings",
            };
            const c = getStatusColor(status);
            return (
              <div key={status} style={{ marginBottom: 32 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c.dot,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {labels[status]}
                  </span>
                  <span
                    style={{
                      padding: "1px 8px",
                      borderRadius: 999,
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      fontSize: 11,
                      fontWeight: 700,
                      color: c.text,
                    }}
                  >
                    {group.length}
                  </span>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {group.map((m) => {
                    const attendeeEmails = m.attendee_emails || [];
                    const atProfiles = attendeeEmails.slice(0, 4).map(
                      (email) =>
                        profiles.find((p) => p.email === email) || {
                          id: email,
                          email,
                          full_name: email,
                        },
                    );
                    let agItems = [];
                    try {
                      agItems = JSON.parse(m.agenda_items || "[]");
                    } catch {}
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMeeting(m)}
                        style={{
                          background: "#fff",
                          borderRadius: 14,
                          border: `1px solid ${status === "live" ? c.border : "#f1f5f9"}`,
                          padding: "16px 20px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          borderLeft: `3px solid ${c.dot}`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 4px 16px rgba(0,0,0,0.06)";
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.transform = "none";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 16,
                          }}
                        >
                          <div
                            style={{
                              textAlign: "center",
                              minWidth: 56,
                              padding: "4px 0",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 800,
                                color: "#0f172a",
                              }}
                            >
                              {fmtTime(m.meeting_date)}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#94a3b8",
                                marginTop: 2,
                              }}
                            >
                              {dayjs(m.meeting_date).format("MMM D")}
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#0f172a",
                                marginBottom: 4,
                              }}
                            >
                              {m.title}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                fontSize: 11,
                                color: "#94a3b8",
                              }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <Clock size={10} />
                                {m.duration || "—"} min
                              </span>
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <Users size={10} />
                                {attendeeEmails.length} people
                              </span>
                              {m.is_recurring && (
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <Repeat2 size={10} />
                                  Recurring
                                </span>
                              )}
                              {agItems.length > 0 && (
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <Hash size={10} />
                                  {agItems.length} agenda items
                                </span>
                              )}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              {atProfiles.map((p, i) => (
                                <div
                                  key={i}
                                  style={{
                                    marginLeft: i > 0 ? -6 : 0,
                                    border: "2px solid #fff",
                                    borderRadius: "50%",
                                  }}
                                >
                                  <UserAvatar profile={p} size={26} />
                                </div>
                              ))}
                              {attendeeEmails.length > 4 && (
                                <div
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "50%",
                                    background: "#f1f5f9",
                                    border: "2px solid #fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: "#64748b",
                                    marginLeft: -6,
                                  }}
                                >
                                  +{attendeeEmails.length - 4}
                                </div>
                              )}
                            </div>
                            {(status === "live" || status === "scheduled") && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openMeetingRoom(m);
                                }}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 8,
                                  border: "none",
                                  cursor: "pointer",
                                  background:
                                    status === "live" ? "#22c55e" : "#3b82f6",
                                  color: "#fff",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  flexShrink: 0,
                                }}
                              >
                                <ExternalLink size={10} />{" "}
                                {status === "live" ? "Join" : "Start"}
                              </button>
                            )}
                            {status === "ended" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showSummary(m);
                                }}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 8,
                                  border: "1px solid #ddd6fe",
                                  cursor: "pointer",
                                  background: "#f5f3ff",
                                  color: "#7c3aed",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  flexShrink: 0,
                                }}
                              >
                                <Sparkles size={10} /> Summary
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filteredMeetings.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                color: "#94a3b8",
              }}
            >
              <Calendar
                size={40}
                style={{
                  margin: "0 auto 16px",
                  display: "block",
                  opacity: 0.3,
                }}
              />
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                No meetings found
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                Create your first meeting to get started
              </div>
            </div>
          )}
        </div>
      )}

      {/* MEETING DETAIL PANEL */}
      {selectedMeeting && (
        <>
          <div
            onClick={() => setSelectedMeeting(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.15)",
              zIndex: 49,
            }}
          />
          <MeetingDetailPanel
            meeting={selectedMeeting}
            profiles={profiles}
            onJoin={openMeetingRoom}
            onSummary={showSummary}
            onCopyLink={copyMeetingLink}
            copiedLink={copiedLink}
            onClose={() => setSelectedMeeting(null)}
            currentUser={currentUser}
            userId={userId}
            onDelete={deleteMeeting}
          />
        </>
      )}

      {/* CREATE MODAL */}
      <Modal
        open={showCreate}
        onCancel={() => setShowCreate(false)}
        footer={null}
        width={580}
        centered
        destroyOnClose
        styles={{ body: { padding: 0 } }}
        closeIcon={<X size={16} style={{ color: "#94a3b8" }} />}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
          }}
        >
          <div
            style={{
              padding: "24px 28px 18px",
              borderBottom: "1px solid #f1f5f9",
              background: "linear-gradient(135deg, #f8fafc, #f0f7ff)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={14} color="#fff" />
              </div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                New Meeting
              </h2>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
              Create a meeting room for your team. You can join immediately
              after creating.
            </p>
          </div>

          <div
            style={{
              overflowY: "auto",
              padding: "10px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              flex: 1,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Title <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <Input
                placeholder="e.g. Sprint Planning · Team Sync · Design Review"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                style={{ borderRadius: 10, fontSize: 14 }}
                size="large"
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Description
              </label>
              <TextArea
                placeholder="What's the purpose of this meeting?"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                autoSize={{ minRows: 2, maxRows: 3 }}
                style={{ borderRadius: 10, fontSize: 13 }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Type
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  {
                    key: "video",
                    label: "Video Call",
                    icon: <Video size={15} />,
                  },
                  {
                    key: "audio",
                    label: "Audio Only",
                    icon: <Mic size={15} />,
                  },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setForm((f) => ({ ...f, type: t.key }))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 0",
                      borderRadius: 10,
                      border: `2px solid ${form.type === t.key ? "#3b82f6" : "#e2e8f0"}`,
                      background: form.type === t.key ? "#eff6ff" : "#f8fafc",
                      color: form.type === t.key ? "#2563eb" : "#64748b",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Participants
              </label>
              <div style={{ position: "relative" }}>
                <Search
                  size={13}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
                <Input
                  placeholder="Search teammates…"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  style={{ borderRadius: 10, paddingLeft: 32 }}
                />
              </div>
              {participantSearch && filteredProfiles.length > 0 && (
                <div
                  style={{
                    marginTop: 6,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    maxHeight: 180,
                    overflowY: "auto",
                  }}
                >
                  {filteredProfiles.slice(0, 8).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedParticipants((prev) => [...prev, p]);
                        setParticipantSearch("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <UserAvatar profile={p} size={30} />
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#1e293b",
                          }}
                        >
                          {p.full_name}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          {p.job_title || p.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedParticipants.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 10,
                  }}
                >
                  {selectedParticipants.map((p, i) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "3px 10px 3px 4px",
                        borderRadius: 999,
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <UserAvatar profile={p} size={20} />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#1d4ed8",
                        }}
                      >
                        {p.full_name}
                      </span>
                      <button
                        onClick={() =>
                          setSelectedParticipants((prev) =>
                            prev.filter((_, j) => j !== i),
                          )
                        }
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "#93c5fd",
                          display: "flex",
                          padding: 0,
                        }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#374151",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Date
                </label>
                <DatePicker
                  value={form.date}
                  onChange={(val) => setForm((f) => ({ ...f, date: val }))}
                  style={{ width: "100%", borderRadius: 10 }}
                  format="MMM D, YYYY"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#374151",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Time
                </label>
                <TimePicker
                  value={form.time}
                  onChange={(val) => setForm((f) => ({ ...f, time: val }))}
                  style={{ width: "100%", borderRadius: 10 }}
                  format="h:mm A"
                  use12Hours
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#374151",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Duration
                </label>
                <Select
                  value={form.duration}
                  onChange={(val) => setForm((f) => ({ ...f, duration: val }))}
                  style={{ width: "100%" }}
                >
                  {[15, 30, 45, 60, 90, 120].map((d) => (
                    <Option key={d} value={d}>
                      {d < 60 ? `${d} min` : `${d / 60} hr${d > 60 ? "s" : ""}`}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Recurrence
              </label>
              <Select
                value={form.recurrence}
                onChange={(val) => setForm((f) => ({ ...f, recurrence: val }))}
                style={{ width: "100%" }}
                placeholder="One-time (no recurrence)"
              >
                <Option value="">One-time</Option>
                <Option value="daily">Daily</Option>
                <Option value="weekly">Weekly</Option>
                <Option value="biweekly">Bi-weekly</Option>
                <Option value="monthly">Monthly</Option>
              </Select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Agenda
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                {agendaItems.map((a, i) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#e0e7ff",
                        color: "#4f46e5",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <input
                      value={a.text}
                      onChange={(e) =>
                        setAgendaItems((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, text: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Agenda item…"
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: 13,
                        color: "#374151",
                      }}
                    />
                    <input
                      type="number"
                      value={a.dur}
                      min={1}
                      onChange={(e) =>
                        setAgendaItems((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, dur: +e.target.value } : x,
                          ),
                        )
                      }
                      style={{
                        width: 44,
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 6,
                        padding: "2px 6px",
                        fontSize: 11,
                        textAlign: "center",
                        outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>min</span>
                    <button
                      onClick={() =>
                        setAgendaItems((prev) => prev.filter((_, j) => j !== i))
                      }
                      style={{
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: "#cbd5e1",
                        display: "flex",
                        padding: 2,
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  setAgendaItems((prev) => [
                    ...prev,
                    { id: Date.now(), text: "", dur: 10 },
                  ])
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                <Plus size={12} /> Add agenda item
              </button>
            </div>
          </div>

          <div
            style={{
              padding: "14px 28px",
              borderTop: "1px solid #f1f5f9",
              background: "#fafafa",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "0 0 12px 12px",
            }}
          >
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
              Meeting link will be generated automatically
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#374151",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 20px",
                  borderRadius: 10,
                  border: "none",
                  cursor: creating ? "not-allowed" : "pointer",
                  background: creating
                    ? "#93c5fd"
                    : "linear-gradient(135deg, #3b82f6, #6366f1)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: creating ? 0.7 : 1,
                  boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                }}
              >
                {creating ? <Spin size="small" /> : <Calendar size={13} />}
                {creating ? "Creating…" : "Create Meeting"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* AI SUMMARY MODAL */}
      <Modal
        open={!!summaryMeeting}
        onCancel={() => {
          setSummaryMeeting(null);
          setSummaryData(null);
        }}
        footer={null}
        width={600}
        centered
        destroyOnClose
        styles={{ body: { padding: 0 } }}
        closeIcon={<X size={16} style={{ color: "#94a3b8" }} />}
      >
        {summaryMeeting && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
            }}
          >
            <div
              style={{
                padding: "24px 28px 18px",
                background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                borderBottom: "1px solid #ddd6fe",
                borderRadius: "12px 12px 0 0",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: "rgba(109,40,217,0.1)",
                  border: "1px solid #c4b5fd",
                  marginBottom: 10,
                }}
              >
                <Sparkles size={11} color="#0f172a" />
                <span
                  style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}
                >
                  AI Summary
                </span>
              </div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#1e1b4b",
                  margin: "0 0 6px",
                }}
              >
                {summaryMeeting.title}
              </h2>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  fontSize: 12,
                  color: "#7c3aed",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} />
                  {summaryMeeting.duration || "—"} min
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Users size={11} />
                  {(summaryMeeting.attendee_emails || []).length} participants
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Calendar size={11} />
                  {dayjs(summaryMeeting.meeting_date).format("MMM D, YYYY")}
                </span>
              </div>
            </div>
            <div style={{ overflowY: "auto", padding: "20px 28px", flex: 1 }}>
              {summaryLoading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: 20,
                    background: "#f5f3ff",
                    border: "1px solid #ddd6fe",
                    borderRadius: 14,
                  }}
                >
                  <Spin />
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#4c1d95",
                      }}
                    >
                      Analyzing meeting…
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#8b5cf6", marginTop: 2 }}
                    >
                      Generating insights with Groq AI
                    </div>
                  </div>
                </div>
              ) : (
                summaryData && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 20,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#7c3aed",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: 8,
                        }}
                      >
                        Summary
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#374151",
                          lineHeight: 1.7,
                          background: "#f9fafb",
                          borderRadius: 12,
                          padding: "14px 16px",
                          margin: 0,
                          border: "1px solid #f1f5f9",
                        }}
                      >
                        {summaryData.summary}
                      </p>
                    </div>
                    {(summaryData.keyTopics || []).length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#7c3aed",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8,
                          }}
                        >
                          Key Topics
                        </div>
                        <div
                          style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
                        >
                          {summaryData.keyTopics.map((t, i) => (
                            <span
                              key={i}
                              style={{
                                padding: "4px 12px",
                                borderRadius: 999,
                                background: "#ede9fe",
                                border: "1px solid #ddd6fe",
                                color: "#6d28d9",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(summaryData.actionItems || []).length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#7c3aed",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8,
                          }}
                        >
                          Action Items
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {summaryData.actionItems.map((a, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                gap: 12,
                                padding: "12px 14px",
                                background: "#fff",
                                border: "1px solid #f1f5f9",
                                borderRadius: 10,
                              }}
                            >
                              <div
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 4,
                                  border: "2px solid #93c5fd",
                                  background: "#eff6ff",
                                  flexShrink: 0,
                                  marginTop: 1,
                                }}
                              />
                              <div>
                                <div style={{ fontSize: 13, color: "#1e293b" }}>
                                  {a.text}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#3b82f6",
                                    marginTop: 3,
                                    fontWeight: 600,
                                  }}
                                >
                                  {a.assignee} · {a.due}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(summaryData.decisions || []).length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#7c3aed",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8,
                          }}
                        >
                          Key Decisions
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {summaryData.decisions.map((d, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                gap: 10,
                                padding: "12px 14px",
                                background: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: 10,
                                borderLeft: "3px solid #22c55e",
                              }}
                            >
                              <CheckCircle2
                                size={14}
                                color="#22c55e"
                                style={{ flexShrink: 0, marginTop: 1 }}
                              />
                              <div style={{ fontSize: 13, color: "#1e293b" }}>
                                {d}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {summaryData.sentiment && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: "#7c3aed",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 8,
                          }}
                        >
                          Meeting Sentiment
                        </div>
                        <div
                          style={{
                            background: "#f9fafb",
                            border: "1px solid #f1f5f9",
                            borderRadius: 12,
                            padding: 16,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          {[
                            [
                              "Engagement",
                              summaryData.sentiment.engagement,
                              "#3b82f6",
                            ],
                            [
                              "Positivity",
                              summaryData.sentiment.positivity,
                              "#22c55e",
                            ],
                            [
                              "Resolution",
                              summaryData.sentiment.resolution,
                              "#f59e0b",
                            ],
                          ].map(([label, val, color]) => (
                            <div
                              key={label}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#64748b",
                                  width: 76,
                                  flexShrink: 0,
                                }}
                              >
                                {label}
                              </span>
                              <div
                                style={{
                                  flex: 1,
                                  height: 6,
                                  background: "#e2e8f0",
                                  borderRadius: 999,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    background: color,
                                    borderRadius: 999,
                                    width: `${val}%`,
                                    transition: "width 1s ease",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#374151",
                                  width: 32,
                                  textAlign: "right",
                                }}
                              >
                                {val}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
            <div
              style={{
                padding: "14px 28px",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: "0 0 12px 12px",
                background: "#fafafa",
              }}
            >
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Powered by Groq AI
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    setSummaryMeeting(null);
                    setSummaryData(null);
                  }}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    color: "#374151",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
                {summaryData && (
                  <button
                    onClick={() => {
                      const text = `Meeting Summary: ${summaryMeeting.title}\n\n${summaryData.summary}\n\nKey Topics: ${(summaryData.keyTopics || []).join(", ")}\n\nAction Items:\n${summaryData.actionItems?.map((a) => `• ${a.text} (${a.assignee}, ${a.due})`).join("\n")}\n\nDecisions:\n${summaryData.decisions?.map((d) => `• ${d}`).join("\n")}`;
                      navigator.clipboard?.writeText(text);
                      message.success("Summary copied!");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Copy size={11} /> Copy Summary
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
      `}</style>
    </div>
  );
}
