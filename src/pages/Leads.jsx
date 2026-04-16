import { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  message,
  Select,
  Input,
  Avatar,
  Drawer,
  Modal,
  Popover,
  Switch,
  TimePicker,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  GlobalOutlined,
  CloseOutlined,
  DeleteOutlined,
  InboxOutlined,
  EyeOutlined,
  RiseOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  SyncOutlined,
  FireOutlined,
  SettingOutlined,
  BellOutlined,
} from "@ant-design/icons";
import {
  Globe,
  Users,
  Smartphone,
  Phone,
  Mail,
  Briefcase,
  Monitor,
  MessageCircle,
  ClipboardList,
  Sparkles,
  Copy,
  Check,
  Lock,
  ArrowRight,
  Zap,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const { TextArea } = Input;

// ------ Env ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

// ------ Groq ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
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

// ------ Email ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
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

const followupEmailTemplate = ({
  leadName,
  message,
  senderName,
  companyName,
  dashboardUrl,
}) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Follow-up Reminder</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">
        <tr><td style="padding:0 0 24px;">
          <span style="font-size:14px;font-weight:700;color:#111827;letter-spacing:-0.2px;">${companyName || "Resosyncer"}</span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:6px;border:1px solid #e5e7eb;padding:36px 40px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Follow-up Reminder</p>
          <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">${leadName}</h2>
          <div style="height:1px;background:#f3f4f6;margin:0 0 20px;"></div>
          <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-line;">${message}</p>
          <div style="height:1px;background:#f3f4f6;margin:0 0 24px;"></div>
          <a href="${dashboardUrl}" style="display:inline-block;background:#111827;color:#ffffff;font-size:13px;font-weight:600;padding:10px 22px;border-radius:5px;text-decoration:none;">View Lead</a>
        </td></tr>
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Sent by ${senderName} -- ${companyName || "Resosyncer"}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ------ Config ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const AVAILABLE_ICONS = [
  "----",
  "----",
  "----",
  "----",
  "----",
  "----",
  "----",
  "----",
  "----",
  "-------",
  "----",
  "----",
  "-------",
  "------",
  "-------",
  "----",
  "----",
  "----",
  "----",
  "----",
  "----",
  "----",
  "----",
  "----",
  "-------",
  "----",
  "----",
  "------",
  "----",
  "----",
  "---",
  "----",
  "----",
  "---",
  "----",
  "----",
  "----",
  "----",
  "----",
  "----",
  "----",
  "------",
  "----",
  "------",
  "----",
  "----",
  "----",
  "----",
  "----",
  "----",
];

const STATUS_CFG = {
  in_progress: {
    label: "In Progress",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    darkBg: "#1e3a5f",
    darkBorder: "#2563eb",
    darkColor: "#60a5fa",
    icon: <SyncOutlined style={{ fontSize: 10 }} />,
  },
  closed: {
    label: "Closed",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    darkBg: "#064e3b",
    darkBorder: "#059669",
    darkColor: "#34d399",
    icon: <CheckCircleFilled style={{ fontSize: 10 }} />,
  },
  not_closed: {
    label: "Not Closed",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
    darkBg: "#1e293b",
    darkBorder: "#475569",
    darkColor: "#94a3b8",
    icon: <CloseCircleFilled style={{ fontSize: 10 }} />,
  },
};

const SOURCE_CFG = {
  website: { label: "Website", icon: <Globe size={13} /> },
  referral: { label: "Referral", icon: <Users size={13} /> },
  social_media: { label: "Social Media", icon: <Smartphone size={13} /> },
  cold_call: { label: "Cold Call", icon: <Phone size={13} /> },
  email: { label: "Email", icon: <Mail size={13} /> },
  fiverr: { label: "Fiverr", icon: <Briefcase size={13} /> },
  upwork: { label: "Upwork", icon: <Monitor size={13} /> },
  whatsapp: { label: "WhatsApp", icon: <MessageCircle size={13} /> },
  other: { label: "Other", icon: <ClipboardList size={13} /> },
};

const pctColor = (v) => (v >= 75 ? "#059669" : v >= 40 ? "#d97706" : "#e11d48");
const pctBg = (v) => (v >= 75 ? "#ecfdf5" : v >= 40 ? "#fffbeb" : "#fff1f2");
const pctBord = (v) => (v >= 75 ? "#a7f3d0" : v >= 40 ? "#fde68a" : "#fecdd3");
const pctDarkBg = (v) =>
  v >= 75 ? "#064e3b" : v >= 40 ? "#451a03" : "#4c0519";
const pctDarkBd = (v) =>
  v >= 75 ? "#059669" : v >= 40 ? "#d97706" : "#e11d48";

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const normalizePlanTier = (planName) => {
  const value = String(planName || "").trim().toLowerCase();
  if (value.includes("free") || value.includes("starter")) return "starter";
  if (value.includes("growth")) return "growth";
  if (value.includes("pro")) return "pro";
  if (value.includes("enterprise")) return "enterprise";
  return "unknown";
};

const LeadsStarterPaywall = ({ dark = false }) => {
  const colors = dark
    ? {
        page: "#141416",
        header: "#1a1b1f",
        panel: "#1a1b1f",
        panelAlt: "#17181c",
        panelMuted: "#202127",
        border: "#2a2b31",
        text: "#f3f4f6",
        textMuted: "#9ca3af",
        textSubtle: "#818897",
        overlay: "linear-gradient(180deg, rgba(20,20,22,0) 0%, #1a1b1f 8%)",
        proBadgeBg:
          "linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%)",
        proBadgeBorder: "#4b4f61",
      }
    : {
        page: "#f8fafc",
        header: "#fff",
        panel: "#fff",
        panelAlt: "#f8fafc",
        panelMuted: "#f1f5f9",
        border: "#e2e8f0",
        text: "#0f172a",
        textMuted: "#64748b",
        textSubtle: "#94a3b8",
        overlay: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 8%)",
        proBadgeBg: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
        proBadgeBorder: "#ddd6fe",
      };

  const features = [
    {
      icon: <Users size={16} />,
      title: "Leads Pipeline",
      desc: "Track prospects, status, follow-ups, close rate, and source in one place.",
    },
    {
      icon: <BellOutlined style={{ fontSize: 16 }} />,
      title: "Smart Follow-up Reminders",
      desc: "Get notified when leads go cold so your team never misses outreach.",
    },
    {
      icon: <Sparkles size={16} />,
      title: "AI Lead Insights (Pro/Enterprise)",
      desc: "Prioritized recommendations and suggested actions to close more deals.",
    },
    {
      icon: <CheckCircleFilled style={{ fontSize: 16 }} />,
      title: "Growth Plan Access",
      desc: "Use Leads fully on Growth with manual workflow and no AI insights.",
    },
    {
      icon: <RiseOutlined style={{ fontSize: 16 }} />,
      title: "Performance Visibility",
      desc: "See hot leads, average close %, and conversion trends across your pipeline.",
    },
    {
      icon: <MessageCircle size={16} />,
      title: "Team Coordination",
      desc: "Capture notes, next steps, and ownership to keep sales activity aligned.",
    },
  ];

  const mockLeads = [
    {
      name: "Brenna New Projects",
      remarks: "Waiting to start",
      followup: "03/14/2026",
      status: { label: "Closed", color: "#10b981" },
      source: "Upwork",
      close: "100%",
      added: "Mar 14, 26",
    },
    {
      name: "Allison $ Websites",
      remarks: "Waiting to start",
      followup: "03/14/2026",
      status: { label: "In Progress", color: "#3b82f6" },
      source: "Upwork",
      close: "100%",
      added: "Mar 14, 26",
    },
    {
      name: "tru_stu",
      remarks: "Waiting for response",
      followup: "02/03/2026",
      status: { label: "In Progress", color: "#3b82f6" },
      source: "Fiverr",
      close: "100%",
      added: "Jan 16, 26",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: colors.page }}>
      <div
        style={{
          background: colors.header,
          borderBottom: `1px solid ${colors.border}`,
          padding: "20px 28px",
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 26,
            fontWeight: 800,
            color: colors.text,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          Leads Pipeline
        </h1>
        <p style={{ margin: 0, color: colors.textMuted, fontSize: 13 }}>
          Starter locked -- Growth manual -- Pro/Enterprise with AI insights
        </p>
      </div>

      <div style={{ padding: "0 28px 40px" }}>
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
            ["#3b82f6", "42", "Active Leads"],
            ["#8b5cf6", "18", "In Progress"],
            ["#10b981", "17", "Closed Deals"],
            ["#f59e0b", "74%", "Avg Close %"],
          ].map(([color, val, label]) => (
            <div
              key={label}
              style={{
                background: colors.panel,
                border: `1px solid ${colors.border}`,
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
                <Users size={18} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: colors.text,
                    lineHeight: 1,
                  }}
                >
                  {val}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: colors.textSubtle,
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
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative" }}>
            <div
              style={{
                filter: "blur(5px)",
                pointerEvents: "none",
                userSelect: "none",
                opacity: 0.3,
                borderBottom: `1px solid ${colors.border}`,
                overflow: "hidden",
                padding: "24px 24px 0",
              }}
            >
              <div
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 1fr",
                    gap: 10,
                    padding: "10px 14px",
                    borderBottom: `1px solid ${colors.border}`,
                    background: colors.panelAlt,
                    color: colors.textSubtle,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>Lead</span>
                  <span>Remarks</span>
                  <span>Last Followup</span>
                  <span>Status</span>
                  <span>Source</span>
                  <span>Close %</span>
                  <span>Added</span>
                </div>
                {mockLeads.map((lead, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 1fr",
                      gap: 10,
                      alignItems: "center",
                      padding: "14px",
                      borderBottom:
                        i < mockLeads.length - 1
                          ? `1px solid ${colors.border}`
                          : "none",
                      fontSize: 13,
                      color: colors.text,
                      background: i % 2 === 0 ? colors.panel : colors.panelAlt,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{lead.name}</span>
                    <span
                      style={{
                        background: colors.panelMuted,
                        borderRadius: 8,
                        padding: "5px 8px",
                        color: colors.textMuted,
                        fontWeight: 600,
                      }}
                    >
                      {lead.remarks}
                    </span>
                    <span>{lead.followup}</span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 20,
                        border: `1px solid ${lead.status.color}50`,
                        color: lead.status.color,
                        background: `${lead.status.color}15`,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 8px",
                        width: "fit-content",
                      }}
                    >
                      {lead.status.label}
                    </span>
                    <span>{lead.source}</span>
                    <span style={{ fontWeight: 700 }}>{lead.close}</span>
                    <span style={{ color: colors.textMuted }}>{lead.added}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 18px",
                background: colors.proBadgeBg,
                border: `1px solid ${colors.proBadgeBorder}`,
                borderRadius: 30,
                backdropFilter: "blur(2px)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.15)",
                whiteSpace: "nowrap",
                marginTop: -80,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Lock size={11} color="#fff" />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Locked Feature
              </span>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              padding: "48px 40px 44px",
              marginTop: -230,
              background: colors.overlay,
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 30,
                  fontWeight: 900,
                  color: colors.text,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.15,
                }}
              >
                Track and close opportunities with
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  a modern Leads pipeline
                </span>
              </h2>
            </div>
            <p
              style={{
                textAlign: "center",
                fontSize: 15,
                color: colors.textMuted,
                maxWidth: 600,
                margin: "0 auto 36px",
                lineHeight: 1.6,
              }}
            >
              Starter plan does not include Leads. Growth unlocks manual lead
              management. Pro and Enterprise unlock full AI insights and AI
              prioritization.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
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
                    background: colors.panelAlt,
                    border: `1px solid ${colors.border}`,
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
                      background: colors.panel,
                      border: `1px solid ${colors.border}`,
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
                        color: colors.text,
                        marginBottom: 3,
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: colors.textMuted,
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
                background: colors.panelAlt,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.textSubtle,
                  letterSpacing: "0.07em",
                  marginBottom: 16,
                }}
              >
                HOW IT WORKS
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {[
                  {
                    label: "Capture Leads",
                    sub: "Save source and details",
                    color: "#3b82f6",
                    icon: <Users size={14} />,
                  },
                  {
                    label: "Manage Follow-ups",
                    sub: "Track deadlines and remarks",
                    color: "#6366f1",
                    icon: <BellOutlined style={{ fontSize: 14 }} />,
                  },
                  {
                    label: "Prioritize Deals",
                    sub: "AI insights in Pro/Enterprise",
                    color: "#8b5cf6",
                    icon: <Sparkles size={14} />,
                  },
                  {
                    label: "Close Faster",
                    sub: "Focus on highest potential",
                    color: "#10b981",
                    icon: <RiseOutlined style={{ fontSize: 14 }} />,
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
                          color: colors.text,
                          marginBottom: 2,
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: colors.textSubtle,
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
                          color: dark ? "#4b5563" : "#d1d5db",
                        }}
                      >
                        <ChevronRight size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

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
                Upgrade to unlock Leads
                <ArrowRight size={16} />
              </a>
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 12,
                  color: colors.textSubtle,
                }}
              >
                Upgrade your plan to access Leads and unlock AI insights on Pro
                and Enterprise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------ CSS Variables approach ---------------------------------------------------------------------------------------------------------------------------------------------------
// All colours come from CSS vars set on .leads-page / .leads-page.dark
const GLOBAL_CSS = `
  /* ------ Light tokens ------ */
  .leads-page,
  .ld-drawer {
    --bg-page:        #f8fafc;
    --bg-card:        #ffffff;
    --bg-subtle:      #f9fafb;
    --bg-muted:       #f1f5f9;
    --bg-hover:       #f8fafc;
    --border:         #f1f5f9;
    --border-strong:  #e2e8f0;
    --text-primary:   #0f172a;
    --text-secondary: #475569;
    --text-muted:     #94a3b8;
    --text-faint:     #cbd5e1;
    --accent:         #0f172a;
    --accent-fg:      #ffffff;
    --danger-bg:      #fff1f2;
    --danger-border:  #fecdd3;
    --danger-text:    #e11d48;
    --ai-bg:          #f8faff;
    --ai-border:      #c7d2fe;
    --ai-text:        #4338ca;
    --ai-num-bg:      #e0e7ff;
    --followup-bg:    #ffffff;
    --input-bg:       #f8fafc;
    --input-focus-bg: #ffffff;
  }

  /* ------ Dark tokens ------ */
  .leads-page.dark,
  .ld-drawer.dark {
    --bg-page:        #141416;
    --bg-card:        #141416;
    --bg-subtle:      #18181c;
    --bg-muted:       #1c1c22;
    --bg-hover:       #18181c;
    --border:         #2a2a31;
    --border-strong:  #34343d;
    --text-primary:   #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted:     #94a3b8;
    --text-faint:     #64748b;
    --accent:         #f1f5f9;
    --accent-fg:      #141416;
    --danger-bg:      #4c0519;
    --danger-border:  #9f1239;
    --danger-text:    #fb7185;
    --ai-bg:          #1b1b24;
    --ai-border:      #3f3f56;
    --ai-text:        #a5b4fc;
    --ai-num-bg:      #2b2b3c;
    --followup-bg:    #18181c;
    --input-bg:       #1c1c22;
    --input-focus-bg: #141416;
  }

  /* ------ Base resets using vars ------ */
  .leads-page { background: var(--bg-page); color: var(--text-primary); }

  /* ------ Ant overrides scoped to .leads-page ------ */
  .leads-page .ant-input,
  .leads-page .ant-input-affix-wrapper,
  .leads-page .ant-select-selector,
  .leads-page textarea.ant-input {
    background: var(--input-bg) !important;
    border-color: var(--border-strong) !important;
    color: var(--text-primary) !important;
  }
  .leads-page .ant-input::placeholder,
  .leads-page textarea.ant-input::placeholder { color: var(--text-muted) !important; }
  .leads-page .ant-input:focus,
  .leads-page .ant-input-affix-wrapper:focus-within {
    background: var(--input-focus-bg) !important;
    border-color: var(--text-primary) !important;
    box-shadow: 0 0 0 3px rgba(15,23,42,0.06) !important;
  }
  .leads-page.dark .ant-input:focus,
  .leads-page.dark .ant-input-affix-wrapper:focus-within {
    box-shadow: 0 0 0 3px rgba(241,245,249,0.06) !important;
  }
  .leads-page .ant-select-selector { border-radius: 10px !important; }
  .leads-page .ant-select-arrow,
  .leads-page .ant-select-clear { color: var(--text-muted) !important; }
  .leads-page .ant-select-dropdown {
    background: var(--bg-card) !important;
    border: 1px solid var(--border-strong) !important;
    border-radius: 10px !important;
  }
  .leads-page .ant-select-item { color: var(--text-primary) !important; }
  .leads-page .ant-select-item-option-active,
  .leads-page .ant-select-item-option-selected { background: var(--bg-muted) !important; }
  .leads-page .ant-select-selection-item { color: var(--text-primary) !important; }

  .leads-page .ant-btn {
    color: var(--text-secondary);
    border-color: var(--border-strong);
    background: var(--bg-card);
  }
  .leads-page .ant-btn:hover {
    border-color: var(--text-primary) !important;
    color: var(--text-primary) !important;
  }

  .leads-page .ant-switch { background: var(--border-strong); }
  .leads-page .ant-switch-checked { background: var(--text-primary) !important; }

  /* Drawer */
  .ld-drawer .ant-drawer-content,
  .ld-drawer .ant-drawer-header,
  .ld-drawer .ant-drawer-body {
    background: var(--bg-card) !important;
    color: var(--text-primary) !important;
  }
  .ld-drawer .ant-drawer-header {
    border-bottom: 1px solid var(--border) !important;
    padding: 20px 26px 16px !important;
  }
  .ld-drawer .ant-drawer-body { padding: 22px 26px !important; }
  .ld-drawer .ant-drawer-title { color: var(--text-primary) !important; }
  .ld-drawer .ant-drawer-close { color: var(--text-muted) !important; }
  .ld-drawer .ant-drawer-close:hover { color: var(--text-primary) !important; }

  /* Modal */
  .ant-modal-content { background: var(--bg-card) !important; color: var(--text-primary) !important; }
  .ant-modal-header { background: var(--bg-card) !important; border-bottom: 1px solid var(--border) !important; }
  .ant-modal-title { color: var(--text-primary) !important; }
  .ant-modal-close { color: var(--text-muted) !important; }

  /* Popover */
  .ant-popover-content .ant-popover-inner { background: var(--bg-card) !important; border: 1px solid var(--border-strong) !important; }
  .ant-popover-content .ant-popover-title { color: var(--text-primary) !important; border-bottom: 1px solid var(--border) !important; }
  .ant-popover-content .ant-popover-inner-content { color: var(--text-primary) !important; }

  /* ------ Component styles ------ */
  @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .fade-up { animation: fadeUp 0.2s ease forwards; }

  .leads-header {
    background: var(--bg-card);
    border-bottom: 1px solid var(--border);
    padding: 20px 32px;
  }
  .leads-title { font-size: 24px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px; margin: 0; }
  .leads-subtitle { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }

  .stat-tile {
    flex: 1 1 110px;
    min-width: 100px;
    padding: 12px 16px;
    border-radius: 12px;
    background: var(--bg-card);
    box-shadow: 0 1px 3px rgba(15,23,42,0.04);
    transition: transform 0.12s, box-shadow 0.12s;
    cursor: default;
  }
  .stat-tile:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(15,23,42,0.08); }
  .leads-page.dark .stat-tile:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.3); }

  .table-wrap {
    background: var(--bg-card);
    border-radius: 16px;
    border: 1px solid var(--border);
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(15,23,42,0.04);
  }
  .leads-page.dark .table-wrap { box-shadow: 0 1px 4px rgba(0,0,0,0.2); }

  .table-head { background: var(--bg-subtle); border-bottom: 1px solid var(--border); }
  .table-head th {
    padding: 10px 14px;
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    white-space: nowrap;
  }

  .lead-row { transition: background 0.1s; }
  .lead-row:hover td { background: var(--bg-hover); }
  .lead-row td { vertical-align: middle; border-bottom: 1px solid var(--border); }
  .lead-row:last-child td { border-bottom: none; }

  /* Ghost inputs --- no border, blends into table */
  .ghost-input .ant-input {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 4px 6px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    color: var(--text-primary) !important;
    border-radius: 6px !important;
    transition: background 0.1s;
  }
  .ghost-input .ant-input:hover,
  .ghost-input .ant-input:focus { background: var(--bg-muted) !important; }
  .ghost-input .ant-input-affix-wrapper {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 4px 6px !important;
    border-radius: 6px !important;
    transition: background 0.1s;
  }
  .ghost-input .ant-input-affix-wrapper:hover,
  .ghost-input .ant-input-affix-wrapper:focus-within { background: var(--bg-muted) !important; }
  .ghost-input .ant-input-affix-wrapper .ant-input {
    background: transparent !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    color: var(--text-primary) !important;
  }

  .ghost-textarea {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 4px 6px !important;
    font-size: 12px !important;
    color: var(--text-secondary) !important;
    border-radius: 6px !important;
    resize: none !important;
    transition: background 0.1s;
  }
  .ghost-textarea:hover, .ghost-textarea:focus { background: var(--bg-muted) !important; }

  .ghost-select .ant-select-selector {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .ghost-select:hover .ant-select-selector { background: var(--bg-muted) !important; border-radius: 6px !important; }
  .ghost-select .ant-select-selection-item { color: var(--text-primary) !important; }

  /* Styled form inputs inside drawer */
  .form-field .ant-input,
  .form-field textarea.ant-input,
  .form-field .ant-input-affix-wrapper {
    border-radius: 9px !important;
    border: 1.5px solid var(--border-strong) !important;
    background: var(--input-bg) !important;
    color: var(--text-primary) !important;
    font-size: 13px !important;
    transition: all 0.15s;
  }
  .form-field .ant-input:focus,
  .form-field textarea.ant-input:focus,
  .form-field .ant-input-affix-wrapper:focus-within {
    border-color: var(--text-primary) !important;
    background: var(--input-focus-bg) !important;
    box-shadow: 0 0 0 3px rgba(15,23,42,0.05) !important;
  }
  .leads-page.dark .form-field .ant-input:focus,
  .leads-page.dark .form-field .ant-input-affix-wrapper:focus-within {
    box-shadow: 0 0 0 3px rgba(241,245,249,0.05) !important;
  }

  .form-select .ant-select-selector {
    border-radius: 9px !important;
    border: 1.5px solid var(--border-strong) !important;
    background: var(--input-bg) !important;
    height: auto !important;
    padding: 7px 12px !important;
  }

  .search-wrap .ant-input-affix-wrapper {
    border-radius: 10px !important;
    border: 1.5px solid var(--border-strong) !important;
    background: var(--bg-card) !important;
    padding: 8px 14px !important;
    font-size: 13px !important;
  }
  .search-wrap .ant-input-affix-wrapper .ant-input { background: transparent !important; color: var(--text-primary) !important; }
  .search-wrap .ant-input-affix-wrapper:focus-within {
    border-color: var(--text-primary) !important;
    box-shadow: 0 0 0 3px rgba(15,23,42,0.05) !important;
  }

  .filter-sel .ant-select-selector {
    border-radius: 10px !important;
    border: 1.5px solid var(--border-strong) !important;
    background: var(--bg-card) !important;
    height: auto !important;
    padding: 7px 12px !important;
  }

  /* Percent bar */
  .pct-bar { height: 3px; background: var(--bg-muted); border-radius: 99px; margin-top: 3px; overflow: hidden; }
  .pct-fill { height: 100%; border-radius: 99px; transition: width 0.4s ease; }

  /* Eye / delete action buttons */
  .row-action-btn {
    border-radius: 7px;
    border: 1px solid var(--border-strong);
    background: var(--bg-card);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    transition: all 0.1s;
  }
  .row-action-btn:hover { background: var(--text-primary); color: var(--bg-card); border-color: var(--text-primary); }
  .row-action-btn.danger { border-color: transparent; background: transparent; color: var(--text-faint); }
  .row-action-btn.danger:hover { background: var(--danger-bg); color: var(--danger-text); border-color: var(--danger-border); }

  /* Date input in rows */
  .date-input-row {
    border: none;
    background: transparent;
    font-size: 12px;
    cursor: text;
    outline: none;
    border-radius: 6px;
    padding: 3px 6px;
    transition: background 0.1s;
    width: 100%;
    color: var(--text-secondary);
    color-scheme: light;
  }
  .leads-page.dark .date-input-row { color-scheme: dark; }
  .date-input-row:focus { background: var(--bg-muted); }
  .date-input-row::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }

  /* AI panel */
  @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .ai-shimmer { animation: shimmer 1.4s ease infinite; }

  .ai-panel {
    background: var(--ai-bg);
    border: 1.5px solid var(--ai-border);
    border-radius: 12px;
    padding: 16px;
    margin-top: 4px;
  }
  .ai-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 9px;
    border: 1.5px solid var(--ai-border);
    background: var(--bg-card);
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    color: var(--ai-text);
    transition: all 0.15s;
  }
  .ai-action-btn:hover:not(:disabled) { background: var(--ai-text); color: #fff; border-color: var(--ai-text); }
  .leads-page.dark .ai-action-btn:hover:not(:disabled) { background: var(--ai-text); color: var(--bg-page); }
  .ai-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .ai-action-btn.secondary {
    color: var(--text-secondary);
    border-color: var(--border-strong);
    background: var(--bg-subtle);
  }
  .ai-action-btn.secondary:hover:not(:disabled) { background: var(--text-primary); color: var(--bg-card); border-color: var(--text-primary); }

  .followup-box {
    background: var(--followup-bg);
    border: 1.5px solid var(--border-strong);
    border-radius: 10px;
    padding: 14px;
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.75;
    white-space: pre-wrap;
    position: relative;
    margin-top: 10px;
  }
  .copy-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    border: 1px solid var(--border-strong);
    background: var(--bg-subtle);
    border-radius: 7px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.1s;
  }
  .copy-btn:hover { background: var(--text-primary); color: var(--bg-card); border-color: var(--text-primary); }

  .insight-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
  }

  /* Settings drawer */
  .settings-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 18px 0;
    border-bottom: 1px solid var(--border);
  }
  .settings-row:last-child { border-bottom: none; }
  .settings-section-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }
  .settings-action-box {
    border-radius: 10px;
    padding: 14px 16px;
  }

  /* Pagination */
  .pagination-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg-card);
    border-radius: 0 0 16px 16px;
  }
  .page-btn {
    min-width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1.5px solid var(--border-strong);
    background: var(--bg-card);
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    padding: 0 6px;
    transition: all 0.12s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .page-btn:hover:not(:disabled):not(.active) { background: var(--bg-muted); }
  .page-btn.active { background: var(--text-primary); color: var(--bg-card); border-color: var(--text-primary); font-weight: 700; }
  .page-btn:disabled { cursor: not-allowed; color: var(--text-faint); }

  /* icon picker inside popover */
  .icon-pick-btn {
    width: 28px; height: 28px; border-radius: 6px;
    border: none; background: transparent;
    cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .icon-pick-btn:hover { background: var(--bg-muted); }
  .icon-pick-btn.selected { background: var(--bg-muted); }
  .icon-pick-btn.clear {
    border: 1px dashed var(--border-strong) !important;
    color: var(--text-muted);
  }

  /* Lead avatar */
  .lead-avatar {
    width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 17px;
    border: 1.5px solid var(--border-strong);
    transition: border-color 0.1s;
  }
  .lead-avatar:hover { border-color: var(--text-primary); }
`;

// ------ Main Component ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const Leads = () => {
  const { profile } = useAuth();
  const [dark, setDark] = useState(getIsDarkTheme);
  const [tenantId, setTenantId] = useState(null);
  const [orgPlan, setOrgPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const [localEdits, setLocalEdits] = useState({});
  const saveTimers = useRef({});
  const planTier = normalizePlanTier(orgPlan);
  const isStarterPlan = planTier === "starter";
  const leadsAiEnabled = planTier === "pro" || planTier === "enterprise";

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("themeModeChanged", syncTheme);
    mq.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("themeModeChanged", syncTheme);
      mq.removeEventListener("change", syncTheme);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      setPlanLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setPlanLoading(false);
          return;
        }
        const { data: p } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
        const tid = p?.tenant_id ?? null;
        setTenantId(tid);
        if (tid) {
          const { data: org } = await supabase
            .from("tenants")
            .select("plan")
            .eq("id", tid)
            .single();
          setOrgPlan(org?.plan ?? null);
        } else {
          setOrgPlan(null);
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
    if (tenantId && !isStarterPlan) fetchLeads();
  }, [tenantId, showArchived, isStarterPlan]);

  useEffect(() => {
    const merged = leads.map((l) => ({ ...l, ...(localEdits[l.id] || {}) }));
    let res = [...merged];
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.remarks?.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all")
      res = res.filter((l) => l.status === statusFilter);
    setFiltered(res);
    setCurrentPage(1);
  }, [leads, localEdits, search, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_archived", showArchived)
        .order("closing_percentage", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeads(data || []);
      setLocalEdits({});
    } catch {
      message.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  const handleInlineEdit = (id, field, value) => {
    setLocalEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
    const key = `${id}__${field}`;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      const { error } = await supabase
        .from("leads")
        .update({ [field]: value })
        .eq("id", id);
      if (error) {
        message.error("Failed to save");
        setLocalEdits((prev) => {
          const next = { ...prev };
          if (next[id]) {
            delete next[id][field];
            if (!Object.keys(next[id]).length) delete next[id];
          }
          return next;
        });
      }
    }, 300);
  };

  const handleArchive = async (id, archive) => {
    if (archive) {
      Modal.confirm({
        title: "Archive Lead",
        content: "Hidden from main view but can be restored.",
        okText: "Archive",
        onOk: async () => {
          await supabase
            .from("leads")
            .update({ is_archived: true })
            .eq("id", id);
          message.success("Archived");
          setDrawerOpen(false);
          fetchLeads();
        },
      });
    } else {
      await supabase.from("leads").update({ is_archived: false }).eq("id", id);
      message.success("Restored");
      setDrawerOpen(false);
      fetchLeads();
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Lead",
      content: "This is permanent and cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        await supabase.from("leads").delete().eq("id", id);
        message.success("Deleted");
        setDrawerOpen(false);
        fetchLeads();
      },
    });
  };

  const getVal = (lead, field) =>
    localEdits[lead.id]?.[field] !== undefined
      ? localEdits[lead.id][field]
      : lead[field];

  const stats = {
    total: filtered.length,
    inProgress: filtered.filter((l) => l.status === "in_progress").length,
    closed: filtered.filter((l) => l.status === "closed").length,
    avgPct: filtered.length
      ? Math.round(
          filtered.reduce((s, l) => s + (l.closing_percentage || 0), 0) /
            filtered.length,
        )
      : 0,
    hot: filtered.filter((l) => (l.closing_percentage || 0) >= 75).length,
  };

  // Stat tile colour tokens --- use dark-aware values
  const statTiles = [
    {
      label: "Total",
      value: stats.total,
      colorVar: "var(--text-primary)",
      borderVar: "var(--border-strong)",
      icon: <GlobalOutlined />,
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      colorVar: dark
        ? STATUS_CFG.in_progress.darkColor
        : STATUS_CFG.in_progress.color,
      borderVar: dark
        ? STATUS_CFG.in_progress.darkBorder
        : STATUS_CFG.in_progress.border,
      bgVar: dark ? STATUS_CFG.in_progress.darkBg : STATUS_CFG.in_progress.bg,
      icon: <SyncOutlined />,
    },
    {
      label: "Closed",
      value: stats.closed,
      colorVar: dark ? STATUS_CFG.closed.darkColor : STATUS_CFG.closed.color,
      borderVar: dark ? STATUS_CFG.closed.darkBorder : STATUS_CFG.closed.border,
      bgVar: dark ? STATUS_CFG.closed.darkBg : STATUS_CFG.closed.bg,
      icon: <CheckCircleFilled />,
    },
    {
      label: "Hot Leads",
      value: stats.hot,
      colorVar: dark ? "#fb7185" : "#dc2626",
      borderVar: dark ? "#9f1239" : "#fecdd3",
      bgVar: dark ? "#4c0519" : "#fff1f2",
      icon: <FireOutlined />,
    },
    {
      label: "Avg Close %",
      value: `${stats.avgPct}%`,
      colorVar: pctColor(stats.avgPct),
      borderVar: dark ? pctDarkBd(stats.avgPct) : pctBord(stats.avgPct),
      bgVar: dark ? pctDarkBg(stats.avgPct) : pctBg(stats.avgPct),
      icon: <RiseOutlined />,
    },
  ];

  const statusBadge = (status) => {
    const cfg = STATUS_CFG[status] || STATUS_CFG.not_closed;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 9px",
          borderRadius: 20,
          border: `1px solid ${dark ? cfg.darkBorder : cfg.border}`,
          background: dark ? cfg.darkBg : cfg.bg,
          fontSize: 11,
          fontWeight: 700,
          color: dark ? cfg.darkColor : cfg.color,
        }}
      >
        {cfg.icon} {cfg.label}
      </span>
    );
  };

  const pctBadgeProps = (pct) => ({
    color: pctColor(pct),
    bg: dark ? pctDarkBg(pct) : pctBg(pct),
    border: dark ? pctDarkBd(pct) : pctBord(pct),
  });

  if (planLoading) {
    return (
      <div
        className={`leads-page${dark ? " dark" : ""}`}
        style={{ minHeight: "100vh", background: "var(--bg-page)" }}
      >
        <style>{GLOBAL_CSS}</style>
        <div style={{ height: "100%" }} />
      </div>
    );
  }

  if (isStarterPlan) {
    return <LeadsStarterPaywall dark={dark} />;
  }

  return (
    <div
      className={`leads-page${dark ? " dark" : ""}`}
      style={{ minHeight: "100vh" }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <div className="leads-header">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 18,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 3,
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
              <span className="leads-subtitle">Sales</span>
            </div>
            <h1 className="leads-title">Leads Pipeline</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {profile?.role === "admin" && (
              <Button
                icon={<SettingOutlined />}
                onClick={() => setSettingsOpen(true)}
                style={{
                  height: 38,
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Settings
              </Button>
            )}
            <Button
              icon={<InboxOutlined />}
              onClick={() => setShowArchived(!showArchived)}
              style={{
                height: 38,
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 13,
                background: showArchived
                  ? "var(--text-primary)"
                  : "var(--bg-card)",
                color: showArchived
                  ? "var(--bg-card)"
                  : "var(--text-secondary)",
                border: `1.5px solid ${showArchived ? "var(--text-primary)" : "var(--border-strong)"}`,
              }}
            >
              {showArchived ? "Active" : "Archived"}
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingLead(null);
                setDrawerOpen(true);
              }}
              style={{
                height: 38,
                paddingInline: 20,
                borderRadius: 10,
                background: "var(--text-primary)",
                border: "none",
                color: "var(--bg-card)",
                fontWeight: 700,
                fontSize: 13,
                boxShadow: "0 4px 14px rgba(15,23,42,0.22)",
              }}
            >
              New Lead
            </Button>
          </div>
        </div>

        {/* Stat tiles */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {statTiles.map(
            ({ label, value, colorVar, borderVar, bgVar, icon }) => (
              <div
                key={label}
                className="stat-tile"
                style={{
                  border: `1px solid ${borderVar}`,
                  background: bgVar || "var(--bg-card)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: colorVar, fontSize: 11 }}>{icon}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: colorVar,
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
              </div>
            ),
          )}
        </div>

        {/* Search + filter */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <Input
              prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
              placeholder="Search leads---"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>
          <Select
            className="filter-sel"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 168 }}
            options={[
              { label: "All Statuses", value: "all" },
              { label: "--- In Progress", value: "in_progress" },
              { label: "--- Closed", value: "closed" },
              { label: "--- Not Closed", value: "not_closed" },
            ]}
          />
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: "20px 32px" }}>
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 28 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "var(--bg-muted)",
                      border: "1px solid var(--border)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        height: 12,
                        width: "55%",
                        borderRadius: 6,
                        background: "var(--bg-muted)",
                        border: "1px solid var(--border)",
                        marginBottom: 8,
                      }}
                    />
                    <div
                      style={{
                        height: 10,
                        width: "35%",
                        borderRadius: 6,
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <GlobalOutlined
                style={{
                  fontSize: 30,
                  color: "var(--text-faint)",
                  display: "block",
                  margin: "0 auto 10px",
                }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
                No leads found
              </span>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead className="table-head">
                  <tr>
                    {[
                      "",
                      "Lead",
                      "Remarks",
                      "Last Followup",
                      "Status",
                      "Source",
                      "Close %",
                      "Added",
                      "",
                    ].map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice(
                      (currentPage - 1) * PAGE_SIZE,
                      currentPage * PAGE_SIZE,
                    )
                    .map((lead, idx) => {
                      const sc =
                        STATUS_CFG[getVal(lead, "status")] ||
                        STATUS_CFG.not_closed;
                      const src =
                        SOURCE_CFG[getVal(lead, "source")] || SOURCE_CFG.other;
                      const pct = getVal(lead, "closing_percentage") || 0;
                      const pb = pctBadgeProps(pct);

                      return (
                        <tr
                          key={lead.id}
                          className="lead-row fade-up"
                          style={{ animationDelay: `${idx * 0.025}s` }}
                        >
                          {/* Eye */}
                          <td
                            style={{ padding: "10px 8px 10px 14px", width: 36 }}
                          >
                            <button
                              className="row-action-btn"
                              style={{ width: 28, height: 28 }}
                              onClick={() => {
                                setEditingLead(lead);
                                setDrawerOpen(true);
                              }}
                            >
                              <EyeOutlined style={{ fontSize: 11 }} />
                            </button>
                          </td>

                          {/* Lead name */}
                          <td style={{ padding: "10px 14px", minWidth: 190 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                              }}
                            >
                              <Popover
                                trigger="click"
                                title={
                                  <span
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "var(--text-primary)",
                                    }}
                                  >
                                    Pick Icon
                                  </span>
                                }
                                content={
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(8,1fr)",
                                      gap: 4,
                                      width: 252,
                                    }}
                                  >
                                    {AVAILABLE_ICONS.map((ic) => (
                                      <button
                                        key={ic}
                                        className={`icon-pick-btn${getVal(lead, "icon") === ic ? " selected" : ""}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleInlineEdit(lead.id, "icon", ic);
                                        }}
                                      >
                                        {ic}
                                      </button>
                                    ))}
                                    <button
                                      className="icon-pick-btn clear"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInlineEdit(lead.id, "icon", "");
                                      }}
                                    >
                                      <CloseOutlined style={{ fontSize: 9 }} />
                                    </button>
                                  </div>
                                }
                              >
                                <div
                                  className="lead-avatar"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    background: getVal(lead, "icon")
                                      ? "var(--bg-muted)"
                                      : "linear-gradient(135deg,#0f172a,#334155)",
                                  }}
                                >
                                  {getVal(lead, "icon") ? (
                                    getVal(lead, "icon")
                                  ) : (
                                    <UserOutlined
                                      style={{ fontSize: 13, color: "#fff" }}
                                    />
                                  )}
                                </div>
                              </Popover>
                              <div className="ghost-input" style={{ flex: 1 }}>
                                <Input
                                  value={getVal(lead, "name") || ""}
                                  onChange={(e) =>
                                    handleInlineEdit(
                                      lead.id,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  bordered={false}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Remarks */}
                          <td
                            style={{
                              padding: "10px 14px",
                              minWidth: 200,
                              maxWidth: 260,
                            }}
                          >
                            <TextArea
                              className="ghost-textarea"
                              value={getVal(lead, "remarks") || ""}
                              onChange={(e) =>
                                handleInlineEdit(
                                  lead.id,
                                  "remarks",
                                  e.target.value,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Add note---"
                              bordered={false}
                              autoSize={{ minRows: 1, maxRows: 3 }}
                            />
                          </td>

                          {/* Last followup */}
                          <td style={{ padding: "10px 14px", minWidth: 140 }}>
                            <input
                              type="date"
                              className="date-input-row"
                              value={getVal(lead, "last_followup_date") || ""}
                              onChange={(e) =>
                                handleInlineEdit(
                                  lead.id,
                                  "last_followup_date",
                                  e.target.value,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            {getVal(lead, "last_followup_date") && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--text-muted)",
                                  paddingLeft: 6,
                                }}
                              >
                                {dayjs(
                                  getVal(lead, "last_followup_date"),
                                ).fromNow()}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td
                            style={{ padding: "10px 14px", minWidth: 140 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Select
                              className="ghost-select"
                              value={getVal(lead, "status")}
                              onChange={(v) =>
                                handleInlineEdit(lead.id, "status", v)
                              }
                              bordered={false}
                              suffixIcon={null}
                              dropdownStyle={{ borderRadius: 10 }}
                              style={{ width: "100%" }}
                            >
                              {Object.entries(STATUS_CFG).map(([val, cfg]) => (
                                <Select.Option key={val} value={val}>
                                  {statusBadge(val)}
                                </Select.Option>
                              ))}
                            </Select>
                          </td>

                          {/* Source */}
                          <td
                            style={{ padding: "10px 14px", minWidth: 130 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Select
                              className="ghost-select"
                              value={getVal(lead, "source")}
                              onChange={(v) =>
                                handleInlineEdit(lead.id, "source", v)
                              }
                              bordered={false}
                              suffixIcon={null}
                              dropdownStyle={{ borderRadius: 10 }}
                              style={{ width: "100%" }}
                            >
                              {Object.entries(SOURCE_CFG).map(([val, cfg]) => (
                                <Select.Option key={val} value={val}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 7,
                                      color: "var(--text-secondary)",
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      {cfg.icon}
                                    </span>
                                    <span style={{ fontSize: 12 }}>
                                      {cfg.label}
                                    </span>
                                  </span>
                                </Select.Option>
                              ))}
                            </Select>
                          </td>

                          {/* Closing % */}
                          <td
                            style={{ padding: "10px 14px", minWidth: 90 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="ghost-input">
                              <Input
                                type="number"
                                value={pct}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    lead.id,
                                    "closing_percentage",
                                    Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        parseInt(e.target.value) || 0,
                                      ),
                                    ),
                                  )
                                }
                                suffix={
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: "var(--text-muted)",
                                      fontWeight: 700,
                                    }}
                                  >
                                    %
                                  </span>
                                }
                                bordered={false}
                                min={0}
                                max={100}
                                style={{
                                  width: 72,
                                  fontWeight: 700,
                                  color: pb.color,
                                }}
                              />
                            </div>
                            <div
                              className="pct-bar"
                              style={{ width: 64, marginLeft: 6 }}
                            >
                              <div
                                className="pct-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: pb.color,
                                }}
                              />
                            </div>
                          </td>

                          {/* Created */}
                          <td
                            style={{
                              padding: "10px 14px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {dayjs(lead.created_at).format("MMM D, YY")}
                            </span>
                          </td>

                          {/* Delete */}
                          <td style={{ padding: "10px 14px 10px 4px" }}>
                            <button
                              className="row-action-btn danger"
                              style={{ width: 26, height: 26 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(lead.id);
                              }}
                            >
                              <DeleteOutlined style={{ fontSize: 11 }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="pagination-wrap">
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Showing{" "}
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}
              </span>
              {" --- "}
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>
              {" of "}
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                {filtered.length}
              </span>
              {" leads"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                ---
              </button>
              {(() => {
                const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                const pages = [];
                let start = Math.max(1, currentPage - 2);
                let end = Math.min(totalPages, start + 4);
                if (end - start < 4) start = Math.max(1, end - 4);
                if (start > 1) {
                  pages.push(
                    <button
                      key={1}
                      className="page-btn"
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </button>,
                  );
                  if (start > 2)
                    pages.push(
                      <span
                        key="s1"
                        style={{
                          color: "var(--text-faint)",
                          fontSize: 13,
                          padding: "0 2px",
                        }}
                      >
                        ---
                      </span>,
                    );
                }
                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      className={`page-btn${i === currentPage ? " active" : ""}`}
                      onClick={() => setCurrentPage(i)}
                    >
                      {i}
                    </button>,
                  );
                }
                if (end < totalPages) {
                  if (end < totalPages - 1)
                    pages.push(
                      <span
                        key="s2"
                        style={{
                          color: "var(--text-faint)",
                          fontSize: 13,
                          padding: "0 2px",
                        }}
                      >
                        ---
                      </span>,
                    );
                  pages.push(
                    <button
                      key={totalPages}
                      className="page-btn"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </button>,
                  );
                }
                return pages;
              })()}
              <button
                className="page-btn"
                disabled={currentPage >= Math.ceil(filtered.length / PAGE_SIZE)}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{ fontSize: 13, fontWeight: 700 }}
              >
                ---
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Drawer */}
      <Drawer
        className={`ld-drawer${dark ? " dark" : ""}`}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingLead(null);
          fetchLeads();
        }}
        width={480}
        title={
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
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  fontSize: 20,
                  background: editingLead?.icon
                    ? "var(--bg-muted)"
                    : "linear-gradient(135deg,#0f172a,#334155)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {editingLead?.icon || (
                  <GlobalOutlined style={{ fontSize: 16, color: "#fff" }} />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {editingLead ? "Lead Details" : "New Lead"}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {editingLead?.name || "Create Lead"}
                </div>
              </div>
            </div>
            {editingLead && (
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="small"
                  icon={<InboxOutlined />}
                  onClick={() => handleArchive(editingLead.id, !showArchived)}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 12,
                    height: 30,
                  }}
                >
                  {showArchived ? "Restore" : "Archive"}
                </Button>
                <Button
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(editingLead.id)}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 12,
                    height: 30,
                    border: `1px solid var(--danger-border)`,
                    background: "var(--danger-bg)",
                    color: "var(--danger-text)",
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        }
        footer={null}
      >
        <LeadForm
          key={editingLead?.id || "new-lead"}
          lead={editingLead}
          profile={profile}
          tenantId={tenantId}
          dark={dark}
          aiEnabled={leadsAiEnabled}
          onClose={() => {
            setDrawerOpen(false);
            setEditingLead(null);
            fetchLeads();
          }}
        />
      </Drawer>

      {/* Settings Drawer */}
      <Drawer
        className={`ld-drawer${dark ? " dark" : ""}`}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={460}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#0f172a,#334155)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SettingOutlined style={{ fontSize: 16, color: "#fff" }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Leads
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Pipeline Settings
              </div>
            </div>
          </div>
        }
        footer={null}
      >
        <LeadsSettings
          profile={profile}
          tenantId={tenantId}
          leads={leads}
          dark={dark}
          aiEnabled={leadsAiEnabled}
        />
      </Drawer>
    </div>
  );
};

// ------ LeadForm ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const LeadForm = ({ lead, profile, tenantId, dark, onClose, aiEnabled = true }) => {
  const [form, setForm] = useState({
    name: lead?.name || "",
    status: lead?.status || "in_progress",
    source: lead?.source || "website",
    remarks: lead?.remarks || "",
    last_followup_date: lead?.last_followup_date || "",
    icon: lead?.icon || "",
    closing_percentage: lead?.closing_percentage || 0,
  });
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [followupText, setFollowupText] = useState("");
  const [copied, setCopied] = useState(false);
  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleAnalyze = async () => {
    if (!form.name) {
      message.error("Add a lead name first");
      return;
    }
    setAiLoading("analyze");
    setAiInsights(null);
    try {
      const SYSTEM = `You are a sales intelligence assistant. Respond ONLY with valid JSON, no markdown.
Return exactly: {"closing_percentage":<int 0-100>,"status":"in_progress"|"closed"|"not_closed","summary":"<2 sentence max>","actions":["<action 1>","<action 2>","<action 3>"]}`;
      const raw = await groq(
        SYSTEM,
        `Lead: ${form.name}\nSource: ${form.source}\nStatus: ${form.status}\nRemarks: ${form.remarks || "none"}\nLast followup: ${form.last_followup_date || "never"}\nClose %: ${form.closing_percentage}`,
      );
      const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
      set("closing_percentage", json.closing_percentage);
      set("status", json.status);
      setAiInsights({ summary: json.summary, actions: json.actions });
      message.success("AI analysis complete");
    } catch (e) {
      console.error(e);
      message.error("AI analysis failed");
    } finally {
      setAiLoading(null);
    }
  };

  const handleFollowup = async () => {
    if (!form.name) {
      message.error("Add a lead name first");
      return;
    }
    setAiLoading("followup");
    setFollowupText("");
    try {
      const SYSTEM = `You are an expert sales rep. Write a short, warm, professional follow-up message for a lead. Under 120 words. No subject line. No placeholders. Sound human.`;
      const text = await groq(
        SYSTEM,
        `Lead: ${form.name}\nSource: ${form.source}\nStatus: ${form.status}\nRemarks: ${form.remarks || "none"}\nLast followup: ${form.last_followup_date || "never"}\nClose %: ${form.closing_percentage}%`,
      );
      setFollowupText(text);
    } catch (e) {
      console.error(e);
      message.error("Failed to generate follow-up");
    } finally {
      setAiLoading(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(followupText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!form.name) {
      message.error("Lead name is required");
      return;
    }
    setSaving(true);
    try {
      if (lead) {
        const { error } = await supabase
          .from("leads")
          .update(form)
          .eq("id", lead.id);
        if (error) throw error;
        message.success("Lead updated");
      } else {
        const { error } = await supabase
          .from("leads")
          .insert([{ ...form, tenant_id: tenantId, created_by: profile?.id }]);
        if (error) throw error;
        message.success("Lead created");
      }
      onClose();
    } catch {
      message.error("Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  const pct = form.closing_percentage || 0;
  const sc = STATUS_CFG[form.status] || STATUS_CFG.not_closed;
  const pb = {
    color: pctColor(pct),
    bg: dark ? pctDarkBg(pct) : pctBg(pct),
    border: dark ? pctDarkBd(pct) : pctBord(pct),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Name */}
      <div className="form-field">
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 7,
          }}
        >
          Name <span style={{ color: "var(--danger-text)" }}>*</span>
        </label>
        <Input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Acme Corp"
        />
      </div>

      {/* Icon */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 7,
          }}
        >
          Icon
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: "1.5px solid var(--border-strong)",
              background: form.icon
                ? "var(--bg-muted)"
                : "linear-gradient(135deg,#0f172a,#334155)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            {form.icon || (
              <UserOutlined style={{ color: "#fff", fontSize: 18 }} />
            )}
          </div>
          <Popover
            trigger="click"
            title={
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Select Icon
              </span>
            }
            content={
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(8,1fr)",
                  gap: 5,
                  width: 268,
                }}
              >
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    className={`icon-pick-btn${form.icon === ic ? " selected" : ""}`}
                    onClick={() => set("icon", ic)}
                  >
                    {ic}
                  </button>
                ))}
                <button
                  className="icon-pick-btn clear"
                  onClick={() => set("icon", "")}
                >
                  <CloseOutlined style={{ fontSize: 10 }} />
                </button>
              </div>
            }
          >
            <Button
              style={{
                borderRadius: 9,
                fontWeight: 600,
                fontSize: 12,
                height: 34,
              }}
            >
              {form.icon ? "Change Icon" : "Pick Icon"}
            </Button>
          </Popover>
          {form.icon && (
            <button
              onClick={() => set("icon", "")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: 12,
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Status + Source */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="form-select">
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 7,
            }}
          >
            Status
          </label>
          <Select
            value={form.status}
            onChange={(v) => set("status", v)}
            style={{ width: "100%" }}
          >
            {Object.entries(STATUS_CFG).map(([val, cfg]) => (
              <Select.Option key={val} value={val}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontWeight: 600,
                    color: dark ? cfg.darkColor : cfg.color,
                  }}
                >
                  {cfg.icon} {cfg.label}
                </span>
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="form-select">
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 7,
            }}
          >
            Source
          </label>
          <Select
            value={form.source}
            onChange={(v) => set("source", v)}
            style={{ width: "100%" }}
          >
            {Object.entries(SOURCE_CFG).map(([val, cfg]) => (
              <Select.Option key={val} value={val}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    color: "var(--text-secondary)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    {cfg.icon}
                  </span>
                  <span style={{ fontSize: 13 }}>{cfg.label}</span>
                </span>
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Closing % */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 7,
          }}
        >
          Closing Probability
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="form-field" style={{ flex: 1 }}>
            <Input
              type="number"
              min={0}
              max={100}
              value={pct}
              onChange={(e) =>
                set(
                  "closing_percentage",
                  Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                )
              }
              suffix={
                <span style={{ color: pb.color, fontWeight: 700 }}>%</span>
              }
            />
          </div>
          <div style={{ flex: 2 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 11, color: pb.color, fontWeight: 700 }}>
                {pct >= 75 ? "---- Hot" : pct >= 40 ? "---- Warm" : "---- Cold"}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: pb.color }}>
                {pct}%
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "var(--bg-muted)",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: pb.color,
                  borderRadius: 99,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div className="form-field">
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 7,
          }}
        >
          Remarks
        </label>
        <Input.TextArea
          value={form.remarks}
          onChange={(e) => set("remarks", e.target.value)}
          placeholder="Notes, context, next steps---"
          rows={3}
          style={{ resize: "none" }}
        />
      </div>

      {/* Last followup */}
      <div className="form-field">
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 7,
          }}
        >
          Last Followup Date
        </label>
        <Input
          type="date"
          value={form.last_followup_date}
          onChange={(e) => set("last_followup_date", e.target.value)}
        />
        {form.last_followup_date && (
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}
          >
            {dayjs(form.last_followup_date).fromNow()}
          </div>
        )}
      </div>

      {/* AI Panel */}
      {aiEnabled ? (
      <div className="ai-panel">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Sparkles size={14} color="var(--ai-text)" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ai-text)",
                letterSpacing: "0.04em",
              }}
            >
              AI Assistant
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="ai-action-btn"
              onClick={handleAnalyze}
              disabled={!!aiLoading}
            >
              {aiLoading === "analyze" ? (
                <span
                  className="ai-shimmer"
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <Sparkles size={12} /> Analyzing---
                </span>
              ) : (
                <>
                  <Sparkles size={12} /> Analyze Lead
                </>
              )}
            </button>
            <button
              className="ai-action-btn secondary"
              onClick={handleFollowup}
              disabled={!!aiLoading}
            >
              {aiLoading === "followup" ? (
                <span
                  className="ai-shimmer"
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <MessageCircle size={12} /> Writing---
                </span>
              ) : (
                <>
                  <MessageCircle size={12} /> Draft Follow-up
                </>
              )}
            </button>
          </div>
        </div>

        {aiInsights && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--text-primary)",
                lineHeight: 1.65,
              }}
            >
              {aiInsights.summary}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span
                className="insight-chip"
                style={{
                  background: pb.bg,
                  border: `1px solid ${pb.border}`,
                  color: pb.color,
                }}
              >
                <Sparkles size={10} /> {form.closing_percentage}% close
                probability
              </span>
              <span
                className="insight-chip"
                style={{
                  background: dark ? sc.darkBg : sc.bg,
                  border: `1px solid ${dark ? sc.darkBorder : sc.border}`,
                  color: dark ? sc.darkColor : sc.color,
                }}
              >
                {sc.label}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Suggested Next Steps
              </span>
              {aiInsights.actions.map((action, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 9, alignItems: "flex-start" }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "var(--ai-num-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        color: "var(--ai-text)",
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      lineHeight: 1.55,
                    }}
                  >
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {followupText && (
          <div className="followup-box">
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check size={10} /> Copied
                </>
              ) : (
                <>
                  <Copy size={10} /> Copy
                </>
              )}
            </button>
            {followupText}
          </div>
        )}

        {!aiInsights && !followupText && !aiLoading && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            Analyze to get closing probability, status suggestion & next steps ---
            or draft an instant follow-up message.
          </p>
        )}
      </div>
      ) : (
        <div
          className="ai-panel"
          style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}
        >
          AI insights are available on Pro and Enterprise plans.
        </div>
      )}

      {/* Save/Cancel */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          paddingTop: 8,
          borderTop: "1px solid var(--border)",
          marginTop: 4,
        }}
      >
        <Button
          onClick={onClose}
          style={{ borderRadius: 9, height: 38, fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          loading={saving}
          onClick={handleSave}
          style={{
            borderRadius: 9,
            height: 38,
            paddingInline: 24,
            background: "var(--text-primary)",
            border: "none",
            color: "var(--bg-card)",
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(15,23,42,0.2)",
          }}
        >
          {lead ? "Update" : "Create"} Lead
        </Button>
      </div>
    </div>
  );
};

// ------ LeadsSettings ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const LeadsSettings = ({ profile, tenantId, leads, dark, aiEnabled = true }) => {
  const [settings, setSettings] = useState({
    followup_reminders_enabled: false,
    reminder_days_overdue: 7,
    reminder_email: profile?.email || "",
    reminder_include_ai_message: true,
    notify_hot_leads: true,
    hot_lead_threshold: 75,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [runningReminders, setRunningReminders] = useState(false);
  const set = (k, v) => setSettings((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("lead_settings")
          .select("*")
          .eq("tenant_id", tenantId)
          .maybeSingle();
        if (data) setSettings((s) => ({ ...s, ...data }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (tenantId) load();
  }, [tenantId]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("lead_settings")
        .upsert(
          { ...settings, tenant_id: tenantId },
          { onConflict: "tenant_id" },
        );
      if (error) throw error;
      message.success("Settings saved");
    } catch (e) {
      console.error(e);
      message.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!settings.reminder_email) {
      message.error("Enter a recipient email first");
      return;
    }
    setTestSending(true);
    try {
      const testMessage = `This is a test reminder from your Leads Pipeline.\n\nYou have configured follow-up reminders for leads that haven't been contacted in ${settings.reminder_days_overdue} days.\n\nEverything is working correctly.`;
      await sendEmail({
        to: settings.reminder_email,
        subject: "Test: Leads Follow-up Reminder",
        companyName: "Resosyncer",
        body: followupEmailTemplate({
          leadName: "Test Lead",
          message: testMessage,
          senderName: profile?.full_name || "Admin",
          companyName: "Resosyncer",
          dashboardUrl: window.location.origin,
        }),
      });
      message.success("Test email sent");
    } catch (e) {
      message.error("Failed to send test email");
    } finally {
      setTestSending(false);
    }
  };

  const runRemindersNow = async () => {
    if (!settings.reminder_email) {
      message.error("Enter a recipient email first");
      return;
    }
    setRunningReminders(true);
    try {
      const cutoff = dayjs()
        .subtract(settings.reminder_days_overdue, "day")
        .format("YYYY-MM-DD");
      const overdue = leads.filter((l) => {
        if (l.status === "closed" || l.status === "not_closed" || l.is_archived)
          return false;
        if (!l.last_followup_date) return true;
        return l.last_followup_date <= cutoff;
      });
      if (!overdue.length) {
        message.info("No overdue leads found. All up to date!");
        setRunningReminders(false);
        return;
      }

      let toNotify = overdue;
      if (aiEnabled) {
        try {
          const TRIAGE_SYSTEM = `You are a sales prioritization assistant. Given a list of overdue leads, decide which ones genuinely need a follow-up reminder. Skip leads that are clearly dead, very low priority, or where a reminder adds no value. Be selective. Respond ONLY with valid JSON: {"recommend": [<id>, ...]}`;
          const raw = await groq(
            TRIAGE_SYSTEM,
            `Overdue leads:\n${JSON.stringify(
              overdue.map((l) => ({
                id: l.id,
                name: l.name,
                status: l.status,
                closing_percentage: l.closing_percentage || 0,
                remarks: l.remarks || "",
                days_since_followup: l.last_followup_date
                  ? dayjs().diff(dayjs(l.last_followup_date), "day")
                  : null,
              })),
              null,
              2,
            )}`,
          );
          const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
          if (Array.isArray(json.recommend) && json.recommend.length > 0) {
            const recommended = new Set(json.recommend);
            toNotify = overdue.filter((l) => recommended.has(l.id));
          }
        } catch (e) {
          console.warn("AI triage failed, using all overdue leads:", e);
        }
      }

      if (!toNotify.length) {
        message.info(
          `AI reviewed ${overdue.length} overdue lead${overdue.length !== 1 ? "s" : ""} and found none that need attention right now.`,
        );
        setRunningReminders(false);
        return;
      }

      let aiSummary = "";
      if (aiEnabled && settings.reminder_include_ai_message) {
        try {
          const SYSTEM = `You are a sales assistant. Write a brief 2-3 sentence overall summary for a sales rep about their overdue leads that need attention today. Be direct and motivating. No lists, no lead names --- just a high-level nudge.`;
          aiSummary = await groq(
            SYSTEM,
            `${toNotify.length} leads need follow-up out of ${overdue.length} overdue. Top priorities by close %: ${toNotify
              .sort(
                (a, b) =>
                  (b.closing_percentage || 0) - (a.closing_percentage || 0),
              )
              .slice(0, 3)
              .map((l) => `${l.name} (${l.closing_percentage || 0}%)`)
              .join(", ")}`,
          );
        } catch (e) {
          /* skip */
        }
      }

      const digestHtml = buildDigestEmail({
        leads: toNotify,
        totalOverdue: overdue.length,
        aiSummary,
        aiEnabled,
        senderName: profile?.full_name || "Admin",
        companyName: "Resosyncer",
        dashboardUrl: window.location.origin,
        reminderDays: settings.reminder_days_overdue,
      });

      await sendEmail({
        to: settings.reminder_email,
        subject: `Follow-up Digest: ${toNotify.length} lead${toNotify.length !== 1 ? "s" : ""} need attention`,
        companyName: "Resosyncer",
        body: digestHtml,
      });

      const skipped = overdue.length - toNotify.length;
      message.success(
        `Digest sent for ${toNotify.length} lead${toNotify.length !== 1 ? "s" : ""}${skipped > 0 ? ` -- AI skipped ${skipped} low-priority` : ""}`,
      );
    } catch (e) {
      console.error(e);
      message.error("Failed to run reminders");
    } finally {
      setRunningReminders(false);
    }
  };

  const buildDigestEmail = ({
    leads,
    totalOverdue,
    aiSummary,
    aiEnabled,
    senderName,
    companyName,
    dashboardUrl,
    reminderDays,
  }) => {
    const pctLabel = (v) =>
      v >= 75 ? "---- Hot" : v >= 40 ? "---- Warm" : "---- Cold";
    const leadItems = leads
      .sort((a, b) => (b.closing_percentage || 0) - (a.closing_percentage || 0))
      .map((l) => {
        const daysSince = l.last_followup_date
          ? dayjs().diff(dayjs(l.last_followup_date), "day")
          : null;
        const statusLabel = STATUS_CFG[l.status]?.label || l.status;
        const pct = l.closing_percentage || 0;
        return `<tr><td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
            <div>
              <span style="font-size:14px;font-weight:700;color:#0f172a;">${l.icon ? l.icon + " " : ""}${l.name}</span>
              <span style="margin-left:8px;font-size:11px;font-weight:700;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:20px;">${statusLabel}</span>
            </div>
            <span style="font-size:12px;font-weight:700;color:#64748b;">${pctLabel(pct)} -- ${pct}%</span>
          </div>
          ${l.remarks ? `<div style="margin-top:4px;font-size:12px;color:#64748b;line-height:1.5;">${l.remarks}</div>` : ""}
          <div style="margin-top:4px;font-size:11px;color:#94a3b8;">Last contact: ${daysSince !== null ? `${daysSince} days ago` : `<span style='color:#e11d48;font-weight:700;'>Never contacted</span>`}</div>
        </td></tr>`;
      })
      .join("");

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="padding:0 0 20px;"><span style="font-size:13px;font-weight:700;color:#0f172a;">${companyName || "Resosyncer"}</span></td></tr>
      <tr><td style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:28px 32px;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;">Follow-up Digest</p>
        <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;">${leads.length} lead${leads.length !== 1 ? "s" : ""} need attention</h2>
        <p style="margin:0 0 24px;font-size:12px;color:#94a3b8;">${totalOverdue} overdue -- ${leads.length} prioritized ${aiEnabled ? "by AI" : "by rules"} -- ${reminderDays}+ days without contact</p>
        ${aiSummary ? `<div style="background:#f8faff;border:1px solid #e0e7ff;border-radius:8px;padding:14px 16px;margin-bottom:24px;"><p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#4338ca;text-transform:uppercase;letter-spacing:0.06em;">--- AI Summary</p><p style="margin:0;font-size:13px;color:#1e293b;line-height:1.65;">${aiSummary}</p></div>` : ""}
        <table width="100%" cellpadding="0" cellspacing="0"><tbody>${leadItems}</tbody></table>
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9;">
          <span style="font-size:11px;color:#94a3b8;">Sent by ${senderName} -- ${companyName}</span>
        </div>
      </td></tr>
    </table></td></tr>
  </table>
</body></html>`;
  };

  if (loading)
    return (
      <div style={{ padding: 24 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              height: 14,
              width: i % 2 === 0 ? "82%" : "68%",
              borderRadius: 7,
              background: "var(--bg-muted)",
              border: "1px solid var(--border)",
              marginBottom: 10,
            }}
          />
        ))}
      </div>
    );

  const SettingLabel = ({ title, desc }) => (
    <div>
      <div
        style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}
      >
        {title}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
        {desc}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Follow-up Reminders */}
      <div style={{ marginBottom: 8 }}>
        <div className="settings-section-label">Follow-up Reminders</div>

        <div className="settings-row">
          <SettingLabel
            title="Enable Reminders"
            desc="Get notified about leads that haven't been contacted recently"
          />
          <Switch
            checked={settings.followup_reminders_enabled}
            onChange={(v) => set("followup_reminders_enabled", v)}
          />
        </div>

        <div className="settings-row">
          <div style={{ flex: 1, marginRight: 20 }}>
            <SettingLabel
              title="Reminder Email"
              desc="Who receives the reminder emails"
            />
          </div>
          <Input
            value={settings.reminder_email}
            onChange={(e) => set("reminder_email", e.target.value)}
            placeholder="you@company.com"
            style={{
              width: 220,
              borderRadius: 8,
              border: "1.5px solid var(--border-strong)",
              background: "var(--input-bg)",
              color: "var(--text-primary)",
              fontSize: 13,
            }}
          />
        </div>

        <div className="settings-row">
          <div style={{ flex: 1, marginRight: 20 }}>
            <SettingLabel
              title="Remind After"
              desc="Send reminder if no followup within this many days"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Input
              type="number"
              min={1}
              max={90}
              value={settings.reminder_days_overdue}
              onChange={(e) =>
                set(
                  "reminder_days_overdue",
                  Math.max(1, parseInt(e.target.value) || 7),
                )
              }
              style={{
                width: 72,
                borderRadius: 8,
                border: "1.5px solid var(--border-strong)",
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                fontSize: 13,
                textAlign: "center",
              }}
            />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              days
            </span>
          </div>
        </div>

        {aiEnabled && (
        <div className="settings-row">
          <SettingLabel
            title={
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={13} color="var(--ai-text)" /> Include AI
                Suggestions
              </span>
            }
            desc="Attach an AI-generated follow-up suggestion to each reminder"
          />
          <Switch
            checked={settings.reminder_include_ai_message}
            onChange={(v) => set("reminder_include_ai_message", v)}
          />
        </div>
        )}
      </div>

      {/* Hot Lead Alerts */}
      <div style={{ marginBottom: 8 }}>
        <div className="settings-section-label">Hot Lead Alerts</div>

        <div className="settings-row">
          <SettingLabel
            title="Notify on Hot Leads"
            desc="Send an alert when a lead crosses the hot threshold"
          />
          <Switch
            checked={settings.notify_hot_leads}
            onChange={(v) => set("notify_hot_leads", v)}
          />
        </div>

        <div className="settings-row">
          <div style={{ flex: 1, marginRight: 20 }}>
            <SettingLabel
              title="Hot Lead Threshold"
              desc="Leads above this closing % are considered hot ----"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Input
              type="number"
              min={1}
              max={100}
              value={settings.hot_lead_threshold}
              onChange={(e) =>
                set(
                  "hot_lead_threshold",
                  Math.max(1, Math.min(100, parseInt(e.target.value) || 75)),
                )
              }
              style={{
                width: 72,
                borderRadius: 8,
                border: "1.5px solid var(--border-strong)",
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                fontSize: 13,
                textAlign: "center",
              }}
            />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>%</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          paddingTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          className="settings-action-box"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-strong)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 4,
            }}
          >
            Run Reminders Now
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginBottom: 12,
              lineHeight: 1.6,
            }}
          >
            Immediately scan all active leads and send follow-up reminder emails
            for any that are overdue.
            {aiEnabled && settings.reminder_include_ai_message &&
              " Each reminder will include an AI-generated suggestion."}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              loading={runningReminders}
              onClick={runRemindersNow}
              icon={<BellOutlined />}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                height: 36,
                background: "var(--text-primary)",
                border: "none",
                color: "var(--bg-card)",
              }}
            >
              {runningReminders ? "Sending---" : "Run Now"}
            </Button>
            <Button
              loading={testSending}
              onClick={sendTestEmail}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                height: 36,
                border: "1.5px solid var(--border-strong)",
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
              }}
            >
              Send Test Email
            </Button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
          }}
        >
          <Button
            type="primary"
            loading={saving}
            onClick={saveSettings}
            style={{
              borderRadius: 9,
              height: 38,
              paddingInline: 24,
              background: "var(--text-primary)",
              border: "none",
              color: "var(--bg-card)",
              fontWeight: 700,
            }}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Leads;


