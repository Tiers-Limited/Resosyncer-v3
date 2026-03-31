import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Drawer,
  Tooltip,
  Badge,
  Dropdown,
  Space,
  Divider,
  Empty,
  message,
  Switch,
  InputNumber,
  Popconfirm,
  Spin,
  Tabs,
} from "antd";
import {
  Plus,
  Copy,
  Eye,
  Trash2,
  User,
  Calendar,
  MoreHorizontal,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  GripVertical,
  Send,
  Download,
  Loader2,
  Palette,
  Link,
  Link2,
  ToggleLeft,
  ToggleRight,
  Clock,
  Lock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Filter,
  Star,
  Zap,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";

const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL || "http://localhost:3001";
const EMAIL_KEY = import.meta.env.VITE_EMAIL_API_KEY || "";

const { Option } = Select;
const { TextArea } = Input;

const STAGES = [
  {
    key: "applied",
    label: "Applied",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    key: "screening",
    label: "Screening",
    color: "#6366f1",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    key: "interview",
    label: "Interview",
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  {
    key: "offer",
    label: "Offer Sent",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  {
    key: "hired",
    label: "Hired",
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    key: "rejected",
    label: "Rejected",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
  },
];

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL / Link" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "file", label: "File Upload" },
  { value: "date", label: "Date" },
];

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Human Resources",
  "Sales",
  "Finance",
  "Operations",
  "Product",
];

const DEFAULT_FIELDS = [
  { id: "df1", type: "text", label: "Full Name", required: true },
  { id: "df2", type: "email", label: "Email Address", required: true },
  { id: "df3", type: "phone", label: "Phone Number", required: true },
  { id: "df4", type: "file", label: "Upload CV / Resume", required: true },
];

const ACCENT_SWATCHES = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#0f172a",
  "#0ea5e9",
  "#14b8a6",
];

const EMAIL_TEMPLATES = [
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "offer", label: "Offer Letter" },
  { value: "rejected", label: "Rejection" },
  { value: "custom", label: "Custom Message" },
];

const DEFAULT_SUBJECTS = {
  shortlisted: (job, co) =>
    `Great news! You've been shortlisted — ${job} at ${co}`,
  interview_scheduled: (job, co) => `Interview Scheduled — ${job} at ${co}`,
  offer: (job, co) => `Job Offer — ${job} at ${co}`,
  rejected: (job, co) => `Your application for ${job} at ${co}`,
  custom: () => "",
};

const PUBLIC_DOMAIN =
  import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin;

const DEFAULT_BRANDING = {
  company_name: "",
  tagline: "",
  logo_url: "",
  accent_color: "#3b82f6",
  sendTrackingLink: true,
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const stageInfo = (key) =>
  STAGES.find((s) => s.key === key) || {
    label: key,
    color: "#94a3b8",
    bg: "#f8fafc",
    border: "#e2e8f0",
  };

const copyLink = (jobId) => {
  navigator.clipboard
    .writeText(`${PUBLIC_DOMAIN}/apply/${jobId}`)
    .then(() => message.success("Link copied!"));
};

const mapJob = (r) => ({
  id: r.id,
  title: r.title,
  department: r.department,
  status: r.status,
  deadline: r.deadline,
  fields: r.fields || [],
  branding: r.branding || null,
  tenantId: r.tenant_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapApplicant = (r) => ({
  id: r.id,
  jobId: r.job_id,
  tenantId: r.tenant_id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  stage: r.stage,
  score: r.score,
  interviewDate: r.interview_date
    ? dayjs(r.interview_date).format("YYYY-MM-DD HH:mm")
    : null,
  notes: r.notes || "",
  answers: r.answers || {},
  cvUrl: r.cv_url,
  appliedAt: r.applied_at ? dayjs(r.applied_at).format("YYYY-MM-DD") : "",
});

const scoreColor = (s) =>
  s >= 80 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444";

const sendTrackingEmail = async ({
  applicantId,
  applicantName,
  applicantEmail,
  jobTitle,
  companyName,
  fromEmail,
  fromName,
}) => {
  const trackingUrl = `${PUBLIC_DOMAIN}/track/${applicantId}`;
  try {
    await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMAIL_KEY}`,
      },
      body: JSON.stringify({
        to: applicantEmail,
        fromName: fromName || companyName || "Recruitment Team",
        fromEmail: fromEmail || import.meta.env.VITE_DEFAULT_FROM_EMAIL || "",
        subject: `Your application for ${jobTitle}${companyName ? ` at ${companyName}` : ""} — Track your status`,
        templateType: "application_received",
        applicantName,
        jobTitle,
        companyName: companyName || "",
        trackingUrl,
      }),
    });
  } catch (err) {
    console.warn("Tracking email failed to send:", err.message);
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   FREE PLAN PAYWALL
══════════════════════════════════════════════════════════════════════════ */
const RecruitmentPaywall = () => {
  const features = [
    {
      icon: <FileText size={16} />,
      title: "Custom Application Forms",
      desc: "Build branded forms with any field type — text, file upload, dropdowns & more",
    },
    {
      icon: <Users size={16} />,
      title: "Visual Hiring Pipeline",
      desc: "Drag-and-drop kanban board to move candidates through Applied → Hired stages",
    },
    {
      icon: <Mail size={16} />,
      title: "Automated Email Templates",
      desc: "Send shortlist, interview invite, offer & rejection emails with one click",
    },
    {
      icon: <Link2 size={16} />,
      title: "Real-time Applicant Tracking",
      desc: "Give candidates a personal tracking link to follow their application live",
    },
    {
      icon: <Star size={16} />,
      title: "Candidate Scoring",
      desc: "Score and rank applicants to surface the best talent at a glance",
    },
    {
      icon: <TrendingUp size={16} />,
      title: "Recruitment Analytics",
      desc: "Track pipeline conversion, time-to-hire and source performance",
    },
  ];

  const mockCandidates = [
    {
      name: "Sarah Chen",
      role: "UI/UX Designer",
      stage: "interview",
      score: 92,
      avatar: "SC",
    },
    {
      name: "Marcus Williams",
      role: "Frontend Engineer",
      stage: "offer",
      score: 88,
      avatar: "MW",
    },
    {
      name: "Priya Patel",
      role: "Product Manager",
      stage: "screening",
      score: 75,
      avatar: "PP",
    },
    {
      name: "James O'Brien",
      role: "UI/UX Designer",
      stage: "applied",
      score: null,
      avatar: "JO",
    },
  ];

  const stageColors = {
    applied: "#3b82f6",
    screening: "#6366f1",
    interview: "#f59e0b",
    offer: "#8b5cf6",
    hired: "#10b981",
  };
  const stageLabels = {
    applied: "Applied",
    screening: "Screening",
    interview: "Interview",
    offer: "Offer Sent",
    hired: "Hired",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header — same as the real page so it feels native */}
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
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              Recruitment
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Build forms · Share links · Track candidates end-to-end
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                background: "#f1f5f9",
                borderRadius: 9,
                padding: 3,
                gap: 2,
              }}
            >
              {[
                { label: "Openings", icon: <FileText size={13} /> },
                { label: "Pipeline", icon: <Users size={13} /> },
              ].map((t) => (
                <button
                  key={t.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "not-allowed",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "transparent",
                    color: "#94a3b8",
                    opacity: 0.6,
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
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
              <Plus size={14} /> New Opening
            </button>
          </div>
        </div>
      </div>

      {/* Blurred mock KPI row */}
      <div style={{ padding: "0 28px", marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            filter: "blur(6px)",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.45,
          }}
        >
          {[
            ["#3b82f6", "3", "Active Openings"],
            ["#8b5cf6", "24", "Total Applicants"],
            ["#f59e0b", "7", "Interviews Scheduled"],
            ["#10b981", "2", "Hired"],
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
                <FileText size={18} />
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
      </div>

      {/* Main paywall hero */}
      <div style={{ padding: "0 28px 40px" }}>
        <div
          style={{
            position: "relative",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          {/* Blurred mock pipeline screenshot */}
          <div
            style={{
              filter: "blur(5px)",
              pointerEvents: "none",
              userSelect: "none",
              opacity: 0.35,
              padding: "24px 24px 0",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                overflowX: "hidden",
                paddingBottom: 20,
              }}
            >
              {["Applied", "Screening", "Interview", "Offer", "Hired"].map(
                (stage, si) => (
                  <div key={stage} style={{ flex: "0 0 180px", minWidth: 180 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {stage}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                          background: Object.values(stageColors)[si],
                          padding: "1px 7px",
                          borderRadius: 20,
                        }}
                      >
                        {[4, 2, 3, 1, 2][si]}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {mockCandidates
                        .slice(0, [2, 1, 2, 1, 1][si])
                        .map((c, ci) => (
                          <div
                            key={ci}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: 10,
                              padding: "11px 13px",
                              borderTop: `3px solid ${Object.values(stageColors)[si]}`,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: 13,
                                color: "#0f172a",
                                marginBottom: 2,
                              }}
                            >
                              {c.name}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>
                              {c.role}
                            </div>
                            {c.score && (
                              <div style={{ marginTop: 6 }}>
                                <div
                                  style={{
                                    height: 3,
                                    borderRadius: 99,
                                    background: "#f1f5f9",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${c.score}%`,
                                      background: scoreColor(c.score),
                                      borderRadius: 99,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Paywall overlay card */}
          <div
            style={{
              position: "relative",
              padding: "48px 40px 44px",
              marginTop: -200,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 8%)",
            }}
          >
            {/* Badge */}
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
                Hire smarter with
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Recruitment Funnels
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
              A complete end-to-end hiring system — from branded application
              forms to pipeline management, automated emails, and real-time
              tracking.
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

            {/* Mini screenshot / workflow illustration */}
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
                    step: "1",
                    label: "Create Opening",
                    sub: "Set job title, department & deadline",
                    color: "#3b82f6",
                    icon: <Plus size={14} />,
                  },
                  {
                    step: "2",
                    label: "Build Form",
                    sub: "Add custom fields & your branding",
                    color: "#6366f1",
                    icon: <FileText size={14} />,
                  },
                  {
                    step: "3",
                    label: "Share Link",
                    sub: "Copy & share your application URL",
                    color: "#8b5cf6",
                    icon: <Link2 size={14} />,
                  },
                  {
                    step: "4",
                    label: "Track Pipeline",
                    sub: "Move candidates through stages",
                    color: "#10b981",
                    icon: <TrendingUp size={14} />,
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

            {/* Sample candidate row */}
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
                  Sample Pipeline
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
              {mockCandidates.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 140px 100px 80px",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderBottom:
                      i < mockCandidates.length - 1
                        ? "1px solid #f1f5f9"
                        : "none",
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#3b82f6",
                        fontWeight: 800,
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      {c.avatar}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {c.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {c.role}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: 6,
                        background: `${stageColors[c.stage]}15`,
                        color: stageColors[c.stage],
                        border: `1px solid ${stageColors[c.stage]}30`,
                      }}
                    >
                      {stageLabels[c.stage]}
                    </span>
                  </div>
                  <div>
                    {c.score ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 99,
                            background: "#f1f5f9",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${c.score}%`,
                              background: scoreColor(c.score),
                              borderRadius: 99,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: scoreColor(c.score),
                          }}
                        >
                          {c.score}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[Eye, Mail].map((Icon, ii) => (
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
                Upgrade to unlock Recruitment
                <ArrowRight size={16} />
              </a>
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "#94a3b8" }}>
                Upgrade your plan to access the full Recruitment module and all
                Pro features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── UI sub-components ───────────────────────────────────────────────────── */
const KpiCard = ({ icon, value, label, color }) => (
  <div
    className="rec-kpi rec-fade"
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
        flexShrink: 0,
      }}
    >
      {icon}
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
        {value}
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
);

const TenantBadge = () => <></>;

const lbl = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#374151",
  marginBottom: 5,
  letterSpacing: "0.02em",
};

/* ── JobBrandingTab ──────────────────────────────────────────────────────── */
const JobBrandingTab = ({ branding, onChange }) => {
  const b = branding || DEFAULT_BRANDING;
  const accent = b.accent_color || "#3b82f6";
  const sendTracking = b.sendTrackingLink !== false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Company Name</label>
            <Input
              value={b.company_name}
              onChange={(e) => onChange({ ...b, company_name: e.target.value })}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label style={lbl}>
              Tagline{" "}
              <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <Input
              value={b.tagline}
              onChange={(e) => onChange({ ...b, tagline: e.target.value })}
              placeholder="e.g. We're building something great"
            />
          </div>
          <div>
            <label style={lbl}>Logo URL</label>
            <Input
              prefix={<Link size={13} color="#94a3b8" />}
              value={b.logo_url}
              onChange={(e) => onChange({ ...b, logo_url: e.target.value })}
              placeholder="https://…/logo.png"
            />
          </div>
          <div>
            <label style={lbl}>Accent Colour</label>
            <Input
              value={b.accent_color}
              onChange={(e) => onChange({ ...b, accent_color: e.target.value })}
              prefix={
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: accent,
                    border: "1px solid #e2e8f0",
                  }}
                />
              }
              placeholder="#3b82f6"
              style={{ marginBottom: 10 }}
            />
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {ACCENT_SWATCHES.map((col) => (
                <div
                  key={col}
                  onClick={() => onChange({ ...b, accent_color: col })}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: col,
                    cursor: "pointer",
                    border:
                      b.accent_color === col
                        ? "3px solid #0f172a"
                        : "2px solid transparent",
                    transition: "border 0.12s",
                    boxShadow:
                      b.accent_color === col ? "0 0 0 1px #fff inset" : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            LIVE PREVIEW
          </div>
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 12,
              padding: "18px 14px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {b.logo_url ? (
                <img
                  src={b.logo_url}
                  alt=""
                  style={{ height: 26, objectFit: "contain", borderRadius: 4 }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {(b.company_name || "A").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div
                  style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}
                >
                  {b.company_name || "Company Name"}
                </div>
                {b.tagline && (
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>
                    {b.tagline}
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: 14,
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  background: `${accent}18`,
                  color: accent,
                  borderRadius: 5,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  marginBottom: 7,
                }}
              >
                Design
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 4,
                }}
              >
                UI/UX Designer
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#f59e0b",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Clock size={10} /> Deadline: Mar 1, 2025
              </div>
              {["Full Name *", "Email Address *", "Resume *"].map((l) => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 3,
                    }}
                  >
                    {l}
                  </div>
                  <div
                    style={{
                      height: 26,
                      borderRadius: 5,
                      border: "1px solid #e2e8f0",
                      background: "#fafafa",
                    }}
                  />
                </div>
              ))}
              <div
                style={{
                  height: 34,
                  borderRadius: 7,
                  background: accent,
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Submit Application
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          padding: "16px 18px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              flexShrink: 0,
              background: sendTracking ? "#eff6ff" : "#f8fafc",
              border: `1px solid ${sendTracking ? "#bfdbfe" : "#e2e8f0"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: sendTracking ? "#3b82f6" : "#94a3b8",
              transition: "all 0.2s",
            }}
          >
            <Link2 size={15} />
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 2,
              }}
            >
              Send tracking link to applicant
            </div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
              When enabled, the confirmation email will include a personal link
              so applicants can track their application status in real time.
            </div>
          </div>
        </div>
        <Switch
          checked={sendTracking}
          onChange={(v) => onChange({ ...b, sendTrackingLink: v })}
          style={{ flexShrink: 0, marginTop: 4 }}
        />
      </div>
    </div>
  );
};

/* ── FormBuilderModal ────────────────────────────────────────────────────── */
const FormBuilderModal = ({ open, job, onClose, onSave, saving }) => {
  const [fields, setFields] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newField, setNewField] = useState({
    type: "text",
    label: "",
    required: false,
    options: "",
  });
  const [activeTab, setActiveTab] = useState("fields");
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  useEffect(() => {
    if (job) {
      setFields(job.fields || []);
      setBranding(job.branding || DEFAULT_BRANDING);
      setActiveTab("fields");
    }
  }, [job]);

  const addField = () => {
    if (!newField.label.trim())
      return message.warning("Field label is required");
    setFields([
      ...fields,
      {
        id: `f${Date.now()}`,
        type: newField.type,
        label: newField.label,
        required: newField.required,
        options:
          newField.type === "select"
            ? newField.options
                .split(",")
                .map((o) => o.trim())
                .filter(Boolean)
            : undefined,
      },
    ]);
    setNewField({ type: "text", label: "", required: false, options: "" });
    setAdding(false);
  };

  const tabItems = [
    {
      key: "fields",
      label: (
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          <FileText size={13} style={{ marginRight: 6 }} />
          Form Fields
        </span>
      ),
      children: (
        <div style={{ paddingTop: 8 }}>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
            Configure the fields candidates will fill in when applying.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 16,
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {fields.length === 0 && (
              <Empty
                description="No fields yet."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
            {fields.map((f, idx) => (
              <div
                key={f.id}
                className="rec-slide"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  background: "#f8fafc",
                  animationDelay: `${idx * 30}ms`,
                }}
              >
                <GripVertical
                  size={14}
                  color="#cbd5e1"
                  style={{ cursor: "grab" }}
                />
                <div style={{ flex: 1 }}>
                  <span
                    style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}
                  >
                    {f.label}
                  </span>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      color: "#94a3b8",
                      background: "#e2e8f0",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {f.type}
                  </span>
                  {f.required && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10,
                        background: "#fef2f2",
                        color: "#ef4444",
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontWeight: 700,
                      }}
                    >
                      Required
                    </span>
                  )}
                  {f.options?.length > 0 && (
                    <span
                      style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}
                    >
                      Options: {f.options.join(", ")}
                    </span>
                  )}
                </div>
                <Popconfirm
                  title="Remove this field?"
                  onConfirm={() =>
                    setFields(fields.filter((x) => x.id !== f.id))
                  }
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    icon={<Trash2 size={13} />}
                    size="small"
                    danger
                  />
                </Popconfirm>
              </div>
            ))}
          </div>
          {adding ? (
            <div
              style={{
                padding: "14px 16px",
                border: "1.5px dashed #3b82f6",
                borderRadius: 12,
                background: "#eff6ff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                <Select
                  value={newField.type}
                  onChange={(v) => setNewField({ ...newField, type: v })}
                  style={{ width: 150 }}
                >
                  {FIELD_TYPES.map((t) => (
                    <Option key={t.value} value={t.value}>
                      {t.label}
                    </Option>
                  ))}
                </Select>
                <Input
                  placeholder="Field label e.g. Portfolio URL"
                  value={newField.label}
                  onChange={(e) =>
                    setNewField({ ...newField, label: e.target.value })
                  }
                  style={{ flex: 1, minWidth: 180 }}
                  onPressEnter={addField}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Switch
                    size="small"
                    checked={newField.required}
                    onChange={(v) => setNewField({ ...newField, required: v })}
                  />
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Required
                  </span>
                </div>
              </div>
              {newField.type === "select" && (
                <Input
                  placeholder="Comma-separated options: Junior, Mid, Senior"
                  value={newField.options}
                  onChange={(e) =>
                    setNewField({ ...newField, options: e.target.value })
                  }
                  style={{ marginBottom: 10 }}
                />
              )}
              <Space>
                <Button
                  type="primary"
                  size="small"
                  onClick={addField}
                  style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
                >
                  Add Field
                </Button>
                <Button size="small" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </Space>
            </div>
          ) : (
            <Button
              icon={<Plus size={13} />}
              onClick={() => setAdding(true)}
              block
              style={{
                borderStyle: "dashed",
                borderRadius: 8,
                height: 38,
                fontWeight: 600,
              }}
            >
              Add Field
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "branding",
      label: (
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          <Palette size={13} style={{ marginRight: 6 }} />
          Branding & Settings
        </span>
      ),
      children: (
        <div style={{ paddingTop: 8 }}>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            Customize how this job's application form appears to candidates, and
            configure email settings.
          </p>
          <JobBrandingTab branding={branding} onChange={setBranding} />
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3b82f6",
              fontSize: 15,
            }}
          >
            <FileText size={15} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Form Builder</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>
              {job?.title}
            </div>
          </div>
        </div>
      }
      onCancel={onClose}
      onOk={() => onSave(fields, branding)}
      okText={saving ? "Saving…" : "Save"}
      confirmLoading={saving}
      width={760}
      okButtonProps={{
        style: {
          background: "#0f172a",
          borderColor: "#0f172a",
          fontWeight: 600,
        },
      }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginTop: 4 }}
      />
    </Modal>
  );
};

/* ── EmailModal ──────────────────────────────────────────────────────────── */
const EmailModal = ({ open, applicant, job, onClose }) => {
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);
  const [template, setTemplate] = useState("custom");
  const branding = job?.branding || DEFAULT_BRANDING;

  useEffect(() => {
    if (!open || !applicant || !job) return;
    const company = branding.company_name || "Our Company";
    const subjectFn = DEFAULT_SUBJECTS[template];
    form.setFieldsValue({
      to: applicant.email,
      fromName: company,
      fromEmail: import.meta.env.VITE_DEFAULT_FROM_EMAIL || "",
      subject: subjectFn ? subjectFn(job.title, company) : "",
      templateType: template,
      applicantName: applicant.name,
      jobTitle: job.title,
      companyName: company,
      logoUrl: branding.logo_url || "",
      interviewDate: applicant.interviewDate?.split(" ")[0] || "",
      interviewTime: applicant.interviewDate?.split(" ")[1] || "",
      interviewFormat: applicant.answers?.__aiInterview?.interviewLink
        ? "Agentic AI interview"
        : "Video Call",
      meetingLink: applicant.answers?.__aiInterview?.interviewLink || "",
      interviewerName: applicant.answers?.__aiInterview?.interviewLink
        ? `${company} AI Interviewer`
        : "",
      salary: "",
      startDate: "",
      offerExpiry: "",
      hrName: "",
      customMessage: "",
      body: "",
    });
  }, [open, applicant, job, template]);

  const handleTemplateChange = (val) => {
    setTemplate(val);
    const company = branding.company_name || "Our Company";
    const subjectFn = DEFAULT_SUBJECTS[val];
    if (subjectFn && job)
      form.setFieldValue("subject", subjectFn(job.title, company));
    form.setFieldValue("templateType", val);
  };

  const send = async () => {
    const values = await form.validateFields();
    setSending(true);
    try {
      const res = await fetch(`${EMAIL_API}/api/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${EMAIL_KEY}`,
        },
        body: JSON.stringify({ ...values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email failed");
      message.success(`Email sent to ${values.to}`);
      onClose();
    } catch (err) {
      message.error("Failed to send: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const showInterview = template === "interview_scheduled";
  const showOffer = template === "offer";
  const showReject = template === "rejected";
  const showCustom = template === "custom";

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3b82f6",
            }}
          >
            <Mail size={15} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Send Email</div>
            {applicant && (
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                to {applicant.name} · {applicant.email}
              </div>
            )}
          </div>
        </div>
      }
      onCancel={onClose}
      onOk={send}
      okText={sending ? "Sending…" : "Send Email"}
      confirmLoading={sending}
      width={580}
      okButtonProps={{
        style: {
          background: "#3b82f6",
          borderColor: "#3b82f6",
          fontWeight: 600,
        },
        icon: <Send size={13} />,
      }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Form.Item
            name="fromName"
            label="From Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="fromEmail"
            label="From Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
        </div>
        <Form.Item
          name="to"
          label="To"
          rules={[{ required: true, type: "email" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="templateType" label="Template">
          <Select onChange={handleTemplateChange} value={template}>
            {EMAIL_TEMPLATES.map((t) => (
              <Option key={t.value} value={t.value}>
                {t.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="applicantName" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="jobTitle" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="companyName" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="logoUrl" hidden>
          <Input />
        </Form.Item>
        {showInterview && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.06em",
                marginBottom: 10,
              }}
            >
              INTERVIEW DETAILS
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <Form.Item
                name="interviewDate"
                label="Date"
                rules={[{ required: true }]}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="Mon, 20 Jan 2025" />
              </Form.Item>
              <Form.Item
                name="interviewTime"
                label="Time"
                rules={[{ required: true }]}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="10:00 AM" />
              </Form.Item>
              <Form.Item
                name="interviewFormat"
                label="Format"
                style={{ marginBottom: 8 }}
              >
                <Select>
                  <Option value="Video Call">Video Call</Option>
                  <Option value="Agentic AI interview">
                    Agentic AI interview
                  </Option>
                  <Option value="Phone Call">Phone Call</Option>
                  <Option value="In Person">In Person</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="interviewerName"
                label="Interviewer"
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="Sarah from HR" />
              </Form.Item>
            </div>
            <Form.Item
              name="meetingLink"
              label="Meeting Link"
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="https://meet.google.com/…" />
            </Form.Item>
          </div>
        )}
        {showOffer && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.06em",
                marginBottom: 10,
              }}
            >
              OFFER DETAILS
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <Form.Item
                name="salary"
                label="Salary"
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="$60,000/year" />
              </Form.Item>
              <Form.Item
                name="startDate"
                label="Start Date"
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="1 Feb 2025" />
              </Form.Item>
              <Form.Item
                name="offerExpiry"
                label="Offer Expires"
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="25 Jan 2025" />
              </Form.Item>
              <Form.Item
                name="hrName"
                label="HR Contact"
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Sarah Ahmed" />
              </Form.Item>
            </div>
          </div>
        )}
        {showReject && (
          <Form.Item
            name="customMessage"
            label="Custom Message (optional)"
            extra="Leave blank for default rejection message."
          >
            <TextArea rows={3} />
          </Form.Item>
        )}
        {showCustom && (
          <Form.Item
            name="body"
            label="Message Body"
            rules={[{ required: true }]}
          >
            <TextArea rows={5} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

/* ── NewJobModal ─────────────────────────────────────────────────────────── */
const NewJobModal = ({ open, onClose, onCreate, saving }) => {
  const [form] = Form.useForm();
  const submit = () => {
    form.validateFields().then((values) => {
      onCreate({
        title: values.title,
        department: values.department,
        deadline: values.deadline?.format("YYYY-MM-DD") || null,
        fields: DEFAULT_FIELDS,
      });
      form.resetFields();
    });
  };
  return (
    <Modal
      open={open}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
            }}
          >
            <Plus size={15} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            Create Job Opening
          </div>
        </div>
      }
      onCancel={onClose}
      onOk={submit}
      okText={saving ? "Creating…" : "Create Opening"}
      confirmLoading={saving}
      okButtonProps={{
        style: {
          background: "#0f172a",
          borderColor: "#0f172a",
          fontWeight: 600,
        },
      }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label={<span style={lbl}>Job Title</span>}
          rules={[{ required: true, message: "Required" }]}
        >
          <Input
            placeholder="e.g. Senior UI/UX Designer"
            style={{ height: 38 }}
          />
        </Form.Item>
        <Form.Item
          name="department"
          label={<span style={lbl}>Department</span>}
          rules={[{ required: true, message: "Required" }]}
        >
          <Select placeholder="Select department" style={{ height: 38 }}>
            {DEPARTMENTS.map((d) => (
              <Option key={d} value={d}>
                {d}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="deadline"
          label={<span style={lbl}>Application Deadline</span>}
        >
          <DatePicker style={{ width: "100%", height: 38 }} />
        </Form.Item>
      </Form>
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: -8 }}>
        Default form fields (name, email, phone, CV) are added automatically.
        Customise in Form Builder.
      </div>
    </Modal>
  );
};


const scoreBg = (s) => (s >= 70 ? "#639922" : s >= 40 ? "#EF9F27" : "#E24B4A");

// ─── constants ──────────────────────────────────────────────────────────────

const TABS = ["Overview", "Application", "AI Insights", "Manage"];

// ─── sub-components ─────────────────────────────────────────────────────────

const StageBadge = ({ stage }) => {
  const info = stageInfo(stage);
  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        background: info.bg,
        color: info.color,
        whiteSpace: "nowrap",
      }}
    >
      {info.label}
    </span>
  );
};

const StatCard = ({ label, value, color }) => (
  <div
    style={{
      background: "#f8fafc",
      borderRadius: 10,
      padding: "10px 12px",
      border: "0.5px solid #e2e8f0",
    }}
  >
    <div
      style={{
        fontSize: 10,
        color: "#94a3b8",
        marginBottom: 5,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        fontWeight: 500,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: color || "#0f172a" }}>
      {value}
    </div>
  </div>
);

const SectionLabel = ({ children }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 600,
      color: "#94a3b8",
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      marginBottom: 8,
    }}
  >
    {children}
  </div>
);

const Card = ({ children, style }) => (
  <div
    style={{
      background: "#fff",
      border: "0.5px solid #e2e8f0",
      borderRadius: 14,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

const AnswerTable = ({ rows, onOpenFile }) => (
  <Card>
    {rows.map((row, i) => (
      <div
        key={row.id}
        style={{
          display: "grid",
          gridTemplateColumns: "130px 1fr",
          borderBottom: i < rows.length - 1 ? "0.5px solid #f1f5f9" : "none",
          background: i % 2 === 0 ? "#fff" : "#fbfdff",
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            fontSize: 11,
            fontWeight: 600,
            color: "#64748b",
            borderRight: "0.5px solid #f1f5f9",
          }}
        >
          {row.label}
        </div>
        <div style={{ padding: "10px 12px" }}>
          <AnswerValue row={row} onOpenFile={onOpenFile} />
        </div>
      </div>
    ))}
  </Card>
);

const AnswerValue = ({ row, onOpenFile }) => {
  const empty =
    row.value === null || row.value === undefined || row.value === "";

  if (row.type === "file") {
    if (empty)
      return (
        <span style={{ fontSize: 12, color: "#cbd5e1" }}>No file uploaded</span>
      );
    return (
      <button
        onClick={() => onOpenFile(row.value)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          color: "#185FA5",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          textDecoration: "underline",
        }}
      >
        <FileText size={12} /> View / Download
      </button>
    );
  }

  if (empty) return <span style={{ fontSize: 12, color: "#cbd5e1" }}>—</span>;

  if (
    row.type === "url" ||
    (typeof row.value === "string" && row.value.startsWith("http"))
  )
    return (
      <a
        href={row.value}
        target="_blank"
        rel="noreferrer"
        style={{ fontSize: 12, color: "#185FA5", wordBreak: "break-all" }}
      >
        {row.value}
      </a>
    );

  return (
    <span style={{ fontSize: 12, color: "#0f172a", wordBreak: "break-word" }}>
      {String(row.value)}
    </span>
  );
};

const TrackingLinkRow = ({ url, label, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      background: "#f8fafc",
      borderRadius: 10,
      border: "0.5px solid #e2e8f0",
      ...style,
    }}
  >
    <span
      style={{
        fontSize: 11,
        color: "#64748b",
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontFamily: "monospace",
      }}
    >
      {url}
    </span>
    <Button
      size="small"
      icon={<Copy size={11} />}
      onClick={() =>
        navigator.clipboard
          .writeText(url)
          .then(() => message.success(`${label || "Link"} copied!`))
      }
      style={{ flexShrink: 0 }}
    >
      Copy
    </Button>
  </div>
);

const InterviewBlock = ({
  applicant,
  interviewDate,
  scheduleMode,
  setScheduleMode,
  setInterviewDate,
  onEmail,
  aiInterview,
}) => (
  <Card style={{ padding: "14px 16px", overflow: "visible" }}>
    {aiInterview?.interviewLink ? (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            background: "#E6F1FB",
            border: "0.5px solid #B5D4F4",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "#185FA5",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <Sparkles size={13} /> AI interview is active
            </span>
            <Button
              size="small"
              icon={<ExternalLink size={12} />}
              style={{ borderRadius: 8 }}
              onClick={() => window.open(aiInterview.interviewLink, "_blank")}
            >
              Open
            </Button>
          </div>
          <TrackingLinkRow
            url={aiInterview.interviewLink}
            label="AI interview link"
            style={{ background: "#fff" }}
          />
        </div>
      </div>
    ) : applicant.interviewDate && !scheduleMode ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "#FAEEDA",
          border: "0.5px solid #FAC775",
          borderRadius: 10,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#854F0B",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Calendar size={13} /> {applicant.interviewDate}
        </span>
        <Button size="small" onClick={() => setScheduleMode(true)}>
          Reschedule
        </Button>
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <DatePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          value={interviewDate}
          onChange={setInterviewDate}
          style={{ width: "100%" }}
          placeholder="Pick date & time"
        />
        {scheduleMode && (
          <Button size="small" onClick={() => setScheduleMode(false)}>
            Cancel
          </Button>
        )}
      </div>
    )}
    {interviewDate && (
      <Button
        block
        icon={<Mail size={13} />}
        onClick={onEmail}
        style={{
          marginTop: 10,
          borderColor: "#185FA5",
          color: "#185FA5",
          fontWeight: 500,
          borderRadius: 10,
        }}
      >
        Send interview invite
      </Button>
    )}
  </Card>
);

// ─── tab panels ─────────────────────────────────────────────────────────────

const OverviewTab = ({
  applicant,
  stage,
  score,
  interviewDate,
  scheduleMode,
  setScheduleMode,
  setInterviewDate,
  notes,
  setNotes,
  onEmail,
  trackingUrl,
}) => {
  const info = stageInfo(stage);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        <StatCard label="Stage" value={info.label} color={info.color} />
        <StatCard label="Applied" value={applicant.appliedAt || "—"} />
        <StatCard
          label="Score"
          value={score != null ? `${score}/100` : "Not set"}
          color={score != null ? scoreColor(score) : "#94a3b8"}
        />
        <StatCard
          label="Interview"
          value={
            applicant.answers?.__aiInterview?.interviewLink
              ? "AI interview"
              : applicant.interviewDate
                ? "Scheduled"
                : "Pending"
          }
          color={
            applicant.answers?.__aiInterview?.interviewLink
              ? "#185FA5"
              : applicant.interviewDate
                ? "#854F0B"
                : "#94a3b8"
          }
        />
      </div>

      <div>
        <SectionLabel>Tracking link</SectionLabel>
        <TrackingLinkRow url={trackingUrl} label="Tracking link" />
      </div>

      <div>
        <SectionLabel>Interview</SectionLabel>
        <InterviewBlock
          applicant={applicant}
          interviewDate={interviewDate}
          scheduleMode={scheduleMode}
          setScheduleMode={setScheduleMode}
          setInterviewDate={setInterviewDate}
          onEmail={onEmail}
          aiInterview={applicant.answers?.__aiInterview || null}
        />
      </div>

      <div>
        <SectionLabel>Internal notes</SectionLabel>
        <TextArea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add private notes about this candidate…"
          style={{ resize: "none", borderRadius: 10, fontSize: 13 }}
        />
      </div>
    </div>
  );
};

const ApplicationTab = ({ answerRows, onOpenFile }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div>
      <SectionLabel>Application details</SectionLabel>
      <AnswerTable rows={answerRows} onOpenFile={onOpenFile} />
    </div>
  </div>
);

const AIInsightsTab = ({ applicant, screening, aiInterview }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {screening ? (
      <Card style={{ padding: "14px 16px", overflow: "visible" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <SectionLabel>AI Screening</SectionLabel>
          <Tag color="blue">
            Confidence {Math.round((screening.confidenceScore || 0) * 100)}%
          </Tag>
        </div>
        <p
          style={{
            fontSize: 13,
            color: "#0f172a",
            lineHeight: 1.7,
            margin: "0 0 10px",
          }}
        >
          {screening.summary}
        </p>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          <Tag color="purple">ATS {screening.atsScore}/100</Tag>
        </div>
        {screening.matchedSkills?.length > 0 && (
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>Matched: </span>
            {screening.matchedSkills.join(", ")}
          </div>
        )}
        {screening.missingSkills?.length > 0 && (
          <div style={{ fontSize: 12, color: "#64748b" }}>
            <span style={{ fontWeight: 600 }}>Missing: </span>
            {screening.missingSkills.join(", ")}
          </div>
        )}
      </Card>
    ) : (
      <Card style={{ padding: "14px 16px" }}>
        <div
          style={{
            fontSize: 13,
            color: "#94a3b8",
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          No AI screening results yet.
        </div>
      </Card>
    )}

    {aiInterview?.interviewLink && (
      <div>
        <SectionLabel>AI interview link</SectionLabel>
        <div
          style={{
            background: "#E6F1FB",
            border: "0.5px solid #B5D4F4",
            borderRadius: 14,
            padding: "14px 16px",
          }}
        >
          <TrackingLinkRow
            url={aiInterview.interviewLink}
            label="AI interview link"
            style={{ background: "#fff" }}
          />
        </div>
      </div>
    )}

    {aiInterview?.transcript?.length > 0 && (
      <Button
        block
        icon={<Eye size={13} />}
        style={{ borderRadius: 10, fontWeight: 500, height: 40 }}
        onClick={() =>
          window.open(`/recruitment/interviews/${applicant.id}`, "_blank")
        }
      >
        View interview transcript
      </Button>
    )}

    {!screening && !aiInterview && (
      <div
        style={{
          fontSize: 12,
          color: "#94a3b8",
          textAlign: "center",
          paddingTop: 8,
        }}
      >
        AI insights will appear here once screening is complete.
      </div>
    )}
  </div>
);

const ManageTab = ({
  stage,
  setStage,
  score,
  setScore,
  applicant,
  interviewDate,
  scheduleMode,
  setScheduleMode,
  setInterviewDate,
  notes,
  setNotes,
  onEmail,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div>
      <SectionLabel>Pipeline stage</SectionLabel>
      <Select value={stage} onChange={setStage} style={{ width: "100%" }}>
        {STAGES.map((s) => (
          <Option key={s.key} value={s.key}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: s.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 500 }}>{s.label}</span>
            </div>
          </Option>
        ))}
      </Select>
    </div>

    <div>
      <SectionLabel>Candidate score (0–100)</SectionLabel>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <InputNumber
          min={0}
          max={100}
          value={score}
          onChange={setScore}
          placeholder="e.g. 85"
          style={{ width: 90 }}
        />
        {score != null && (
          <>
            <div
              style={{
                flex: 1,
                height: 5,
                borderRadius: 999,
                background: "#f1f5f9",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${score}%`,
                  background: scoreBg(score),
                  borderRadius: 999,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: scoreColor(score),
                minWidth: 46,
                textAlign: "right",
              }}
            >
              {score}/100
            </span>
          </>
        )}
      </div>
    </div>

    <div
      style={{
        height: 1,
        background: "#f1f5f9",
        margin: "2px 0",
      }}
    />

    <div>
      <SectionLabel>Interview</SectionLabel>
        <InterviewBlock
          applicant={applicant}
          interviewDate={interviewDate}
          scheduleMode={scheduleMode}
          setScheduleMode={setScheduleMode}
          setInterviewDate={setInterviewDate}
          onEmail={onEmail}
          aiInterview={applicant.answers?.__aiInterview || null}
        />
      </div>

    <div
      style={{
        height: 1,
        background: "#f1f5f9",
        margin: "2px 0",
      }}
    />

    <div>
      <SectionLabel>Internal notes</SectionLabel>
      <TextArea
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add private notes about this candidate…"
        style={{ resize: "none", borderRadius: 10, fontSize: 13 }}
      />
    </div>
  </div>
);

// ─── main component ──────────────────────────────────────────────────────────

const ApplicantDrawer = ({
  open,
  applicant,
  job,
  onClose,
  onUpdate,
  onDelete,
  saving,
  onEmail,
}) => {
  const [stage, setStage] = useState("applied");
  const [notes, setNotes] = useState("");
  const [score, setScore] = useState(null);
  const [interviewDate, setInterviewDate] = useState(null);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    if (applicant) {
      setStage(applicant.stage || "applied");
      setNotes(applicant.notes || "");
      setScore(applicant.score ?? null);
      setInterviewDate(
        applicant.interviewDate ? dayjs(applicant.interviewDate) : null,
      );
      setScheduleMode(false);
      setActiveTab("Overview");
    }
  }, [applicant]);

  if (!applicant) return null;

  const save = () =>
    onUpdate({
      ...applicant,
      stage,
      notes,
      score,
      interviewDate: interviewDate
        ? interviewDate.format("YYYY-MM-DD HH:mm")
        : null,
    });

  const answerRows = useMemo(() => {
    const answers = applicant.answers || {};
    let cvUrlUsed = false;
    if (job?.fields?.length) {
      return job.fields.map((f) => {
        let value = answers[f.id] ?? null;
        if (f.type === "file" && !value && !cvUrlUsed && applicant.cvUrl) {
          value = applicant.cvUrl;
          cvUrlUsed = true;
        }
        return { id: f.id, label: f.label, type: f.type, value };
      });
    }
    return Object.entries(answers).map(([k, v]) => ({
      id: k,
      label: k,
      type:
        typeof v === "string" &&
        v.startsWith("http") &&
        (v.includes(".pdf") ||
          v.includes(".doc") ||
          v.includes("recruitment-cvs"))
          ? "file"
          : "text",
      value: v,
    }));
  }, [applicant, job]);

  const extractStoragePath = (url) => {
    try {
      const m = "/recruitment-cvs/";
      const i = url.indexOf(m);
      return i !== -1 ? url.slice(i + m.length) : null;
    } catch {
      return null;
    }
  };

  const openFile = async (url) => {
    if (!url) return;
    const path = extractStoragePath(url);
    if (path) {
      const { data } = await supabase.storage
        .from("recruitment-cvs")
        .createSignedUrl(path, 3600);
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
        return;
      }
    }
    window.open(url, "_blank");
  };

  const trackingUrl = `${PUBLIC_DOMAIN}/track/${applicant.id}`;
  const screening = applicant.answers?.__aiScreening || null;
  const aiInterview = applicant.answers?.__aiInterview || null;
  const currentStageInfo = stageInfo(stage);

  const tabContent = {
    Overview: (
      <OverviewTab
        applicant={applicant}
        stage={stage}
        score={score}
        interviewDate={interviewDate}
        scheduleMode={scheduleMode}
        setScheduleMode={setScheduleMode}
        setInterviewDate={setInterviewDate}
        notes={notes}
        setNotes={setNotes}
        onEmail={onEmail}
        trackingUrl={trackingUrl}
      />
    ),
    Application: (
      <ApplicationTab answerRows={answerRows} onOpenFile={openFile} />
    ),
    "AI Insights": (
      <AIInsightsTab
        applicant={applicant}
        screening={screening}
        aiInterview={aiInterview}
      />
    ),
    Manage: (
      <ManageTab
        stage={stage}
        setStage={setStage}
        score={score}
        setScore={setScore}
        applicant={applicant}
        interviewDate={interviewDate}
        scheduleMode={scheduleMode}
        setScheduleMode={setScheduleMode}
        setInterviewDate={setInterviewDate}
        notes={notes}
        setNotes={setNotes}
        onEmail={onEmail}
      />
    ),
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={600}
      styles={{
        header: {
          borderBottom: "0.5px solid #f1f5f9",
          paddingBottom: 14,
          background:
            "linear-gradient(180deg, rgba(24,95,165,0.05) 0%, rgba(255,255,255,1) 100%)",
        },
        body: {
          padding: 0,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        },
      }}
      title={
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            minWidth: 0,
            paddingRight: 8,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${currentStageInfo.bg}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: currentStageInfo.color,
              fontWeight: 700,
              fontSize: 17,
              flexShrink: 0,
            }}
          >
            {applicant.name.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
              {applicant.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 3,
                flexWrap: "wrap",
              }}
            >
              <span>{job?.title || "Candidate"}</span>
              <span style={{ color: "#cbd5e1" }}>•</span>
              <span>Applied {applicant.appliedAt}</span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", flexShrink: 0 }}>
            <StageBadge stage={stage} />
          </div>
        </div>
      }
      extra={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "nowrap",
            justifyContent: "flex-end",
          }}
        >
          <Button
            icon={<Mail size={13} />}
            size="middle"
            onClick={onEmail}
            style={{ borderRadius: 10, fontWeight: 600, height: 36 }}
          >
            Email
          </Button>
          <Popconfirm
            title="Delete this application?"
            description="This cannot be undone."
            onConfirm={() => onDelete(applicant.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<Trash2 size={13} />}
              size="middle"
              loading={saving}
              style={{ borderRadius: 10, height: 36 }}
            >
              Delete
            </Button>
          </Popconfirm>
        </div>
      }
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "0.5px solid #f1f5f9",
            padding: "0 24px",
            background: "#fff",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 14px",
                fontSize: 12,
                fontWeight: 500,
                color: activeTab === tab ? "#0f172a" : "#94a3b8",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${activeTab === tab ? "#0f172a" : "transparent"}`,
                marginBottom: -0.5,
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "20px 24px 32px", flex: 1 }}>
          {tabContent[activeTab]}
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(10px)",
          borderTop: "0.5px solid #f1f5f9",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          type="primary"
          onClick={save}
          loading={saving}
          size="middle"
          style={{
            background: "#0f172a",
            borderColor: "#0f172a",
            fontWeight: 700,
            borderRadius: 10,
            height: 40,
            minWidth: 132,
          }}
        >
          Save changes
        </Button>
      </div>
    </Drawer>
  );
};

/* ── StageColumn ─────────────────────────────────────────────────────────── */
const StageColumn = ({ stage, applicants, onView }) => (
  <div
    style={{
      flex: "0 0 280px",
      minWidth: 280,
      background: "#f8fafc",
      border: `1px solid ${stage.border}`,
      borderRadius: 20,
      padding: 14,
      boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: stage.bg,
            border: `1px solid ${stage.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: stage.color,
              display: "inline-block",
            }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "0.01em",
            }}
          >
            {stage.label}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {applicants.length === 1
              ? "1 candidate"
              : `${applicants.length} candidates`}
          </div>
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: stage.color,
          background: "#fff",
          border: `1px solid ${stage.border}`,
          padding: "4px 9px",
          borderRadius: 999,
        }}
      >
        {applicants.length}
      </span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {applicants.length === 0 && (
        <div
          style={{
            border: "1.5px dashed #dbe4ee",
            borderRadius: 16,
            padding: "24px 14px",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: 12,
            background: "rgba(255,255,255,0.7)",
          }}
        >
          No candidates in this stage
        </div>
      )}
      {applicants.map((a, idx) => (
        <div
          key={a.id}
          className="rec-stage-card rec-fade"
          style={{
            background: "#fff",
            border: `1px solid ${stage.border}`,
            borderRadius: 16,
            padding: "14px 14px 12px",
            animationDelay: `${idx * 25}ms`,
            boxShadow: "0 10px 18px rgba(15,23,42,0.05)",
            cursor: "pointer",
          }}
          onClick={() => onView(a)}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 14,
                  color: "#0f172a",
                  marginBottom: 3,
                }}
              >
                {a.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {a.email}
              </div>
            </div>
            {a.score != null && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: scoreColor(a.score),
                  background: `${scoreColor(a.score)}12`,
                  borderRadius: 999,
                  padding: "4px 8px",
                  flexShrink: 0,
                }}
              >
                {a.score}
              </div>
            )}
          </div>
          {a.interviewDate && (
            <div
              style={{
                fontSize: 11,
                color: "#f59e0b",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontWeight: 600,
                padding: "4px 8px",
                borderRadius: 999,
                background: "#fffbeb",
                border: "1px solid #fde68a",
                marginBottom: 9,
              }}
            >
              <Calendar size={10} /> {a.interviewDate}
            </div>
          )}
          {a.score != null && (
            <div style={{ marginTop: 2 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <span style={{ fontSize: 10, color: "#94a3b8" }}>
                  Match score
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: scoreColor(a.score),
                  }}
                >
                  {a.score}%
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  borderRadius: 999,
                  background: "#edf2f7",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${a.score}%`,
                    background: scoreColor(a.score),
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

/* ── JobCard ─────────────────────────────────────────────────────────────── */
const JobCard = ({
  job,
  applicantCount,
  onPipeline,
  onFormBuilder,
  onToggle,
  onDelete,
  onCopyLink,
}) => {
  const brand = job.branding || DEFAULT_BRANDING;
  const accent = brand.accent_color || "#3b82f6";
  const isActive = job.status === "active";

  return (
    <div
      className="rec-job-card rec-fade"
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 4, background: accent }} />
      <div
        style={{
          padding: "16px 18px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 10,
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
                fontWeight: 800,
                fontSize: 15,
                color: "#0f172a",
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              {job.title}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  background: "#f1f5f9",
                  padding: "2px 8px",
                  borderRadius: 5,
                  fontWeight: 600,
                }}
              >
                {job.department}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 5,
                  background: isActive ? "#ecfdf5" : "#f8fafc",
                  color: isActive ? "#10b981" : "#94a3b8",
                  border: `1px solid ${isActive ? "#a7f3d0" : "#e2e8f0"}`,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: isActive ? "#10b981" : "#94a3b8",
                    display: "inline-block",
                  }}
                />
                {isActive ? "Active" : "Closed"}
              </span>
            </div>
          </div>
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "pipeline",
                  icon: <Users size={13} />,
                  label: "View Pipeline",
                  onClick: onPipeline,
                },
                {
                  key: "form",
                  icon: <FileText size={13} />,
                  label: "Edit Form & Branding",
                  onClick: onFormBuilder,
                },
                {
                  key: "copy",
                  icon: <Copy size={13} />,
                  label: "Copy Apply Link",
                  onClick: onCopyLink,
                },
                {
                  key: "toggle",
                  icon: isActive ? (
                    <XCircle size={13} />
                  ) : (
                    <CheckCircle size={13} />
                  ),
                  label: isActive ? "Close Opening" : "Reopen",
                  onClick: onToggle,
                },
                { type: "divider" },
                {
                  key: "delete",
                  icon: <Trash2 size={13} />,
                  label: "Delete",
                  danger: true,
                  onClick: onDelete,
                },
              ],
            }}
          >
            <Button
              type="text"
              icon={<MoreHorizontal size={15} />}
              size="small"
              style={{ color: "#94a3b8" }}
            />
          </Dropdown>
        </div>
        {brand.company_name && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 10px",
              background: "#f8fafc",
              borderRadius: 8,
              border: "1px solid #f1f5f9",
            }}
          >
            {brand.logo_url ? (
              <img
                src={brand.logo_url}
                alt=""
                style={{ height: 18, objectFit: "contain", borderRadius: 3 }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 10,
                  flexShrink: 0,
                }}
              >
                {brand.company_name.charAt(0)}
              </div>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#475569",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {brand.company_name}
            </span>
            {brand.tagline && (
              <span
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                — {brand.tagline}
              </span>
            )}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onPipeline}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 800, color: accent }}>
              {applicantCount}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              applicant{applicantCount !== 1 ? "s" : ""}
            </span>
          </button>
          {job.deadline && (
            <>
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "#e2e8f0",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: dayjs(job.deadline).isBefore(dayjs())
                    ? "#ef4444"
                    : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Clock size={10} /> {job.deadline}
              </span>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 5,
              background:
                brand.sendTrackingLink !== false ? "#eff6ff" : "#f8fafc",
              color: brand.sendTrackingLink !== false ? "#3b82f6" : "#94a3b8",
              border: `1px solid ${brand.sendTrackingLink !== false ? "#bfdbfe" : "#e2e8f0"}`,
            }}
          >
            <Link2 size={9} />
            {brand.sendTrackingLink !== false
              ? "Tracking link on"
              : "Tracking link off"}
          </span>
        </div>
      </div>
      <div
        style={{
          borderTop: "1px solid #f1f5f9",
          padding: "10px 14px",
          display: "flex",
          gap: 8,
          background: "#fafafa",
        }}
      >
        <Button
          size="small"
          icon={<Users size={12} />}
          onClick={onPipeline}
          style={{ flex: 1, fontWeight: 600, fontSize: 12 }}
        >
          Pipeline
        </Button>
        <Button
          size="small"
          icon={<FileText size={12} />}
          onClick={onFormBuilder}
          style={{ flex: 1, fontWeight: 600, fontSize: 12 }}
        >
          Form
        </Button>
        <Tooltip title="Copy apply link">
          <Button size="small" icon={<Copy size={12} />} onClick={onCopyLink} />
        </Tooltip>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════════ */
export function RecruitmentPage({ initialView = "jobs" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState(initialView);
  const [selectedJob, setSelectedJob] = useState(null);
  const [pipelineFilter, setPipelineFilter] = useState(null);

  const [newJobOpen, setNewJobOpen] = useState(false);
  const [formBuilderJob, setFormBuilderJob] = useState(null);
  const [viewApplicant, setViewApplicant] = useState(null);
  const [emailApplicant, setEmailApplicant] = useState(null);
  const [TENANT_ID, setTenantId] = useState(null);
  const [orgPlan, setOrgPlan] = useState(null);

  useEffect(() => {
    setView(location.pathname === "/recruitment/pipeline" ? "pipeline" : "jobs");
  }, [initialView, location.pathname]);

  useEffect(() => {
    const jobId = searchParams.get("job");
    if (!jobId) {
      setSelectedJob(null);
      return;
    }
    const match = jobs.find((job) => String(job.id) === String(jobId));
    setSelectedJob(match || null);
  }, [jobs, searchParams]);

  const openJobsPage = useCallback(() => {
    setSelectedJob(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("job");
      return next;
    });
    navigate("/recruitment");
  }, [navigate, setSearchParams]);

  const openPipelinePage = useCallback(
    (job = null) => {
      if (job) {
        setSelectedJob(job);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("job", job.id);
          return next;
        });
        navigate(`/recruitment/pipeline?job=${job.id}`);
        return;
      }

      navigate("/recruitment/pipeline");
    },
    [navigate, setSearchParams],
  );

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
      }
    };
    init();
  }, []);

  /* ── Fetch ──────────────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: jobRows, error: jobErr },
        { data: appRows, error: appErr },
      ] = await Promise.all([
        supabase
          .from("recruitment_jobs")
          .select("*")
          .eq("tenant_id", TENANT_ID)
          .order("created_at", { ascending: false }),
        supabase
          .from("recruitment_applicants")
          .select("*")
          .eq("tenant_id", TENANT_ID)
          .order("applied_at", { ascending: false }),
      ]);
      if (jobErr) throw jobErr;
      if (appErr) throw appErr;
      setJobs((jobRows || []).map(mapJob));
      setApplicants((appRows || []).map(mapApplicant));
    } catch {
      message.error("Failed to load recruitment data");
    } finally {
      setLoading(false);
    }
  }, [TENANT_ID]);

  useEffect(() => {
    if (orgPlan === null) return; // ← wait until plan is loaded

    if (orgPlan === "Free") {
      setLoading(false);
      return;
    }

    fetchAll();
  }, [fetchAll, orgPlan]);

  /* ── Realtime ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (orgPlan === "Free" || !TENANT_ID) return;
    const ch = supabase
      .channel(`recruitment-realtime-${TENANT_ID}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recruitment_jobs",
          filter: `tenant_id=eq.${TENANT_ID}`,
        },
        (p) => {
          if (p.eventType === "INSERT")
            setJobs((prev) => [mapJob(p.new), ...prev]);
          if (p.eventType === "UPDATE")
            setJobs((prev) =>
              prev.map((j) => (j.id === p.new.id ? mapJob(p.new) : j)),
            );
          if (p.eventType === "DELETE")
            setJobs((prev) => prev.filter((j) => j.id !== p.old.id));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recruitment_applicants",
          filter: `tenant_id=eq.${TENANT_ID}`,
        },
        (p) => {
          if (p.eventType === "INSERT")
            setApplicants((prev) => [mapApplicant(p.new), ...prev]);
          if (p.eventType === "UPDATE")
            setApplicants((prev) =>
              prev.map((a) => (a.id === p.new.id ? mapApplicant(p.new) : a)),
            );
          if (p.eventType === "DELETE")
            setApplicants((prev) => prev.filter((a) => a.id !== p.old.id));
        },
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [TENANT_ID, orgPlan]);

  /* ── CRUD ────────────────────────────────────────────────────────── */
  const createJob = async (values) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("recruitment_jobs").insert([
        {
          tenant_id: TENANT_ID,
          title: values.title,
          department: values.department,
          deadline: values.deadline || null,
          fields: values.fields,
          branding: DEFAULT_BRANDING,
          status: "active",
        },
      ]);
      if (error) throw error;
      setNewJobOpen(false);
      message.success("Job opening created!");
    } catch {
      message.error("Failed to create job opening");
    } finally {
      setSaving(false);
    }
  };

  const saveFormFields = async (fields, branding) => {
    if (!formBuilderJob) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("recruitment_jobs")
        .update({ fields, branding })
        .eq("id", formBuilderJob.id)
        .eq("tenant_id", TENANT_ID);
      if (error) throw error;
      setJobs((prev) =>
        prev.map((j) =>
          j.id === formBuilderJob.id ? { ...j, fields, branding } : j,
        ),
      );
      if (selectedJob?.id === formBuilderJob.id)
        setSelectedJob((prev) => ({ ...prev, fields, branding }));
      setFormBuilderJob(null);
      message.success("Form & branding saved!");
    } catch {
      message.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleJobStatus = async (job) => {
    const newStatus = job.status === "active" ? "closed" : "active";
    try {
      const { error } = await supabase
        .from("recruitment_jobs")
        .update({ status: newStatus })
        .eq("id", job.id)
        .eq("tenant_id", TENANT_ID);
      if (error) throw error;
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)),
      );
    } catch {
      message.error("Failed to update status");
    }
  };

  const deleteJob = async (id) => {
    try {
      const { error } = await supabase
        .from("recruitment_jobs")
        .delete()
        .eq("id", id)
        .eq("tenant_id", TENANT_ID);
      if (error) throw error;
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setApplicants((prev) => prev.filter((a) => a.jobId !== id));
      if (selectedJob?.id === id) {
        openJobsPage();
      }
      message.success("Job opening deleted");
    } catch {
      message.error("Failed to delete");
    }
  };

  const updateApplicant = async (updated) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("recruitment_applicants")
        .update({
          stage: updated.stage,
          notes: updated.notes,
          score: updated.score,
          interview_date: updated.interviewDate
            ? dayjs(updated.interviewDate).toISOString()
            : null,
        })
        .eq("id", updated.id)
        .eq("tenant_id", TENANT_ID);
      if (error) throw error;
      setApplicants((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      );
      setViewApplicant(null);
      message.success("Applicant updated");
    } catch {
      message.error("Failed to update applicant");
    } finally {
      setSaving(false);
    }
  };

  const deleteApplicant = async (id) => {
    try {
      const { error } = await supabase
        .from("recruitment_applicants")
        .delete()
        .eq("id", id)
        .eq("tenant_id", TENANT_ID);
      if (error) throw error;
      setApplicants((prev) => prev.filter((a) => a.id !== id));
      setViewApplicant(null);
      message.success("Application deleted");
    } catch {
      message.error("Failed to delete application");
    }
  };

  /* ── Derived ──────────────────────────────────────────────────────── */
  const jobApplicants = useMemo(() => {
    let list = selectedJob
      ? applicants.filter((a) => a.jobId === selectedJob.id)
      : applicants;
    if (pipelineFilter) list = list.filter((a) => a.stage === pipelineFilter);
    return list;
  }, [applicants, selectedJob, pipelineFilter]);

  const stats = useMemo(
    () => ({
      activeJobs: jobs.filter((j) => j.status === "active").length,
      total: applicants.length,
      scheduled: applicants.filter((a) => a.interviewDate).length,
      hired: applicants.filter((a) => a.stage === "hired").length,
    }),
    [jobs, applicants],
  );
  const selectedJobAccent = selectedJob?.branding?.accent_color || "#0f172a";
  const pipelineStageCounts = useMemo(
    () =>
      STAGES.map((stage) => ({
        ...stage,
        count: jobApplicants.filter((a) => a.stage === stage.key).length,
      })),
    [jobApplicants],
  );

  const drawerJob = useMemo(
    () =>
      viewApplicant
        ? jobs.find((j) => j.id === viewApplicant.jobId) || null
        : null,
    [viewApplicant, jobs],
  );
  const emailJob = useMemo(
    () =>
      emailApplicant
        ? jobs.find((j) => j.id === emailApplicant.jobId) || null
        : null,
    [emailApplicant, jobs],
  );

  /* ── Applicant table columns ──────────────────────────────────────── */
  const applicantColumns = [
    {
      title: "Candidate",
      dataIndex: "name",
      render: (name, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3b82f6",
              fontWeight: 800,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
              {name}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.email}</div>
          </div>
        </div>
      ),
    },
    ...(!selectedJob
      ? [
          {
            title: "Role",
            dataIndex: "jobId",
            render: (id) => {
              const j = jobs.find((j) => j.id === id);
              const accent = j?.branding?.accent_color || "#3b82f6";
              return j ? (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: accent,
                    background: `${accent}12`,
                    padding: "2px 8px",
                    borderRadius: 5,
                  }}
                >
                  {j.title}
                </span>
              ) : (
                "—"
              );
            },
          },
        ]
      : []),
    {
      title: "Stage",
      dataIndex: "stage",
      render: (s) => <StageBadge stage={s} />,
    },
    {
      title: "Score",
      dataIndex: "score",
      render: (s) =>
        s != null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: `${scoreColor(s)}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{ fontSize: 12, fontWeight: 800, color: scoreColor(s) }}
              >
                {s}
              </span>
            </div>
          </div>
        ) : (
          <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>
        ),
    },
    {
      title: "Interview",
      dataIndex: "interviewDate",
      render: (d) =>
        d ? (
          <span
            style={{
              fontSize: 12,
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontWeight: 500,
            }}
          >
            <Calendar size={12} /> {d}
          </span>
        ) : (
          <span style={{ color: "#d1d5db", fontSize: 12 }}>Not scheduled</span>
        ),
    },
    {
      title: "Applied",
      dataIndex: "appliedAt",
      render: (d) => (
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{d}</span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="View application">
            <Button
              icon={<Eye size={13} />}
              size="small"
              onClick={() => setViewApplicant(row)}
            />
          </Tooltip>
          <Tooltip title="Send email">
            <Button
              icon={<Mail size={13} />}
              size="small"
              onClick={() => setEmailApplicant(row)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this application?"
            onConfirm={() => deleteApplicant(row.id)}
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button icon={<Trash2 size={13} />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <Spin
          indicator={
            <Loader2
              style={{
                fontSize: 32,
                color: "#3b82f6",
                animation: "spin 1s linear infinite",
              }}
            />
          }
        />
      </div>
    );

  /* ── FREE PLAN GATE ───────────────────────────────────────────────── */
  if (orgPlan === "Free") {
    return <RecruitmentPaywall />;
  }

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div
        className="rec-fade"
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                Recruitment
              </h1>
              <TenantBadge />
            </div>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Build forms · Share links · Track candidates end-to-end
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                background: "#f1f5f9",
                borderRadius: 9,
                padding: 3,
                gap: 2,
              }}
            >
              {[
                {
                  key: "jobs",
                  label: "Openings",
                  icon: <FileText size={13} />,
                },
                {
                  key: "pipeline",
                  label: "Pipeline",
                  icon: <Users size={13} />,
                },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    if (t.key === "jobs") openJobsPage();
                    else openPipelinePage(selectedJob);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    transition: "all 0.15s",
                    background: view === t.key ? "#0f172a" : "transparent",
                    color: view === t.key ? "#fff" : "#64748b",
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => setNewJobOpen(true)}
              style={{
                background: "#0f172a",
                borderColor: "#0f172a",
                fontWeight: 700,
                height: 38,
                borderRadius: 9,
              }}
            >
              New Opening
            </Button>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 28px 32px" }}>
        {/* KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <KpiCard
            icon={<FileText size={18} />}
            value={stats.activeJobs}
            label="Active Openings"
            color="#3b82f6"
          />
          <KpiCard
            icon={<User size={18} />}
            value={stats.total}
            label="Total Applicants"
            color="#8b5cf6"
          />
          <KpiCard
            icon={<Calendar size={18} />}
            value={stats.scheduled}
            label="Interviews Scheduled"
            color="#f59e0b"
          />
          <KpiCard
            icon={<CheckCircle size={18} />}
            value={stats.hired}
            label="Hired"
            color="#10b981"
          />
        </div>

        {/* Jobs Grid */}
        {view === "jobs" && (
          <div className="rec-fade">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                {jobs.length} Job Opening{jobs.length !== 1 ? "s" : ""}
              </div>
            </div>
            {jobs.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  border: "2px dashed #e2e8f0",
                  borderRadius: 16,
                  padding: "60px 40px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 6,
                  }}
                >
                  No job openings yet
                </div>
                <div
                  style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}
                >
                  Create your first opening and start receiving applications
                </div>
                <Button
                  type="primary"
                  icon={<Plus size={13} />}
                  onClick={() => setNewJobOpen(true)}
                  style={{
                    background: "#0f172a",
                    borderColor: "#0f172a",
                    fontWeight: 600,
                  }}
                >
                  Create Opening
                </Button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                {jobs.map((job, idx) => (
                  <div key={job.id} style={{ animationDelay: `${idx * 40}ms` }}>
                    <JobCard
                      job={job}
                      applicantCount={
                        applicants.filter((a) => a.jobId === job.id).length
                      }
                      onPipeline={() => {
                        openPipelinePage(job);
                      }}
                      onFormBuilder={() => setFormBuilderJob(job)}
                      onToggle={() => toggleJobStatus(job)}
                      onDelete={() => deleteJob(job.id)}
                      onCopyLink={() => copyLink(job.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pipeline View */}
        {view === "pipeline" && (
          <div className="rec-fade">
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
                border: "1px solid #e2e8f0",
                borderRadius: 20,
                padding: 20,
                boxShadow: "0 18px 40px rgba(15,23,42,0.05)",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 18,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 11px",
                      borderRadius: 999,
                      background: `${selectedJobAccent}10`,
                      color: selectedJobAccent,
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 10,
                    }}
                  >
                    <Zap size={14} />
                    Hiring Pipeline
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: "#0f172a",
                      lineHeight: 1.15,
                    }}
                  >
                    {selectedJob ? selectedJob.title : "All Open Roles"}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#64748b",
                      marginTop: 6,
                      maxWidth: 720,
                    }}
                  >
                    Review applicants across every hiring stage, focus on
                    bottlenecks, and move faster from application to hire.
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(110px, 1fr))",
                    gap: 10,
                    minWidth: 330,
                    flex: "1 1 330px",
                    maxWidth: 430,
                  }}
                >
                  {[
                    {
                      label: "Visible Candidates",
                      value: jobApplicants.length,
                      color: "#0f172a",
                    },
                    {
                      label: "Interviews",
                      value: pipelineStageCounts.find(
                        (s) => s.key === "interview",
                      )?.count,
                      color: "#f59e0b",
                    },
                    {
                      label: "Hired",
                      value: pipelineStageCounts.find((s) => s.key === "hired")
                        ?.count,
                      color: "#10b981",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        background: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 16,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          lineHeight: 1,
                          fontWeight: 800,
                          color: item.color,
                        }}
                      >
                        {item.value || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setPipelineFilter(null)}
                    style={{
                      padding: "7px 13px",
                      borderRadius: 999,
                      border: `1px solid ${pipelineFilter === null ? "#0f172a" : "#e2e8f0"}`,
                      background: pipelineFilter === null ? "#0f172a" : "#fff",
                      color: pipelineFilter === null ? "#fff" : "#64748b",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    All
                  </button>
                  {STAGES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() =>
                        setPipelineFilter(
                          pipelineFilter === s.key ? null : s.key,
                        )
                      }
                      style={{
                        padding: "7px 13px",
                        borderRadius: 999,
                        border: `1px solid ${pipelineFilter === s.key ? s.color : "#e2e8f0"}`,
                        background: pipelineFilter === s.key ? s.bg : "#fff",
                        color: pipelineFilter === s.key ? s.color : "#64748b",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {selectedJob && (
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <Button
                      size="middle"
                      icon={<Copy size={12} />}
                      onClick={() => copyLink(selectedJob.id)}
                      style={{ borderRadius: 10, fontWeight: 600 }}
                    >
                      Copy Link
                    </Button>
                    <Button
                      size="middle"
                      icon={<FileText size={12} />}
                      onClick={() => setFormBuilderJob(selectedJob)}
                      style={{ borderRadius: 10, fontWeight: 600 }}
                    >
                      Edit Form
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                overflowX: "auto",
                padding: "6px 4px 12px",
                marginBottom: 14,
              }}
            >
              <div
                style={{ display: "flex", gap: 16, minWidth: "fit-content" }}
              >
                {STAGES.map((stage) => (
                  <StageColumn
                    key={stage.key}
                    stage={stage}
                    applicants={jobApplicants.filter(
                      (a) => a.stage === stage.key,
                    )}
                    onView={setViewApplicant}
                  />
                ))}
              </div>
            </div>
            <div
              style={{
                marginTop: 10,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 18px 36px rgba(15,23,42,0.05)",
              }}
            >
              <div
                style={{
                  padding: "18px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}
                >
                  All Candidates
                </span>
                {selectedJob && (
                  <span
                    style={{
                      fontSize: 11,
                      background:
                        (selectedJob.branding?.accent_color || "#3b82f6") +
                        "15",
                      color: selectedJob.branding?.accent_color || "#3b82f6",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontWeight: 700,
                    }}
                  >
                    {selectedJob.title}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    background: "#f1f5f9",
                    color: "#64748b",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontWeight: 600,
                  }}
                >
                  {jobApplicants.length} total
                </span>
              </div>
              <Table
                className="rec-table"
                dataSource={jobApplicants}
                columns={applicantColumns}
                rowKey="id"
                pagination={{
                  pageSize: 8,
                  size: "small",
                  showTotal: (t) => `${t} candidates`,
                }}
                locale={{
                  emptyText: (
                    <Empty
                      description="No applicants yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals & Drawers */}
      <NewJobModal
        open={newJobOpen}
        onClose={() => setNewJobOpen(false)}
        onCreate={createJob}
        saving={saving}
      />
      {formBuilderJob && (
        <FormBuilderModal
          open={!!formBuilderJob}
          job={formBuilderJob}
          onClose={() => setFormBuilderJob(null)}
          onSave={saveFormFields}
          saving={saving}
        />
      )}
      {viewApplicant && (
        <ApplicantDrawer
          open={!!viewApplicant}
          applicant={viewApplicant}
          job={drawerJob}
          onClose={() => setViewApplicant(null)}
          onUpdate={updateApplicant}
          onDelete={deleteApplicant}
          saving={saving}
          onEmail={() => setEmailApplicant(viewApplicant)}
        />
      )}
      <EmailModal
        open={!!emailApplicant}
        applicant={emailApplicant}
        job={emailJob}
        onClose={() => setEmailApplicant(null)}
      />
    </div>
  );
}

export default function Recruitment() {
  return <RecruitmentPage initialView="jobs" />;
}
