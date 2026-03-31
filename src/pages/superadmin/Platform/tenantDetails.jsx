import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Badge,
  Modal,
  Form,
  Input,
  Select,
  Drawer,
  Table,
  Progress,
  Spin,
  Divider,
  Popconfirm,
  message,
  Dropdown,
  Empty,
  Tooltip,
  Tag,
  Switch,
  DatePicker,
  InputNumber,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  StopOutlined,
  CheckCircleOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  GlobalOutlined,
  SafetyOutlined,
  CrownOutlined,
  CodeOutlined,
  ApartmentOutlined,
  IdcardOutlined,
  BuildOutlined,
  LockOutlined,
  UnlockOutlined,
  BankOutlined,
  WarningOutlined,
  ReloadOutlined,
  PlusOutlined,
  KeyOutlined,
  GiftOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  StarOutlined,
  CloseCircleOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  CreditCardOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../../../components/Layout/MainLayout";
import { supabase } from "../../../lib/supabase";
import dayjs from "dayjs";

const { Option } = Select;

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAN_COLOR = {
  Enterprise: {
    text: "#7c3aed",
    bg: "#f5f3ff",
    darkBg: "#2e1065",
    border: "#c4b5fd",
  },
  Pro: { text: "#3b82f6", bg: "#eff6ff", darkBg: "#1e3a5f", border: "#93c5fd" },
  Starter: {
    text: "#10b981",
    bg: "#ecfdf5",
    darkBg: "#064e3b",
    border: "#6ee7b7",
  },
  Free: {
    text: "#6b7280",
    bg: "#f9fafb",
    darkBg: "#374151",
    border: "#d1d5db",
  },
};

const PLAN_FEATURES = {
  Enterprise: [
    "Unlimited employees",
    "Dedicated account manager",
    "Unlimited storage",
    "24/7 phone & chat support",
    "SSO / SAML",
    "Custom integrations",
    "SLA guarantee",
  ],
  Pro: [
    "Up to 100 employees",
    "Advanced analytics",
    "50 GB storage",
    "Priority chat support",
    "Full HR suite",
    "Contract builder",
    "Recruitment module",
  ],
  Starter: [
    "Up to 25 employees",
    "Full project management",
    "10 GB storage",
    "Priority email support",
    "Attendance & standups",
  ],
  Free: [
    "Up to 5 employees",
    "Basic project tracking",
    "1 GB storage",
    "Email support",
  ],
};

const PLAN_LIMITS = {
  Enterprise: { max_users: null, storage_gb: null, mrr: 399 },
  Pro: { max_users: 100, storage_gb: 50, mrr: 149 },
  Starter: { max_users: 25, storage_gb: 10, mrr: 49 },
  Free: { max_users: 5, storage_gb: 1, mrr: 0 },
};

const STATUS_CONFIG = {
  active: { badge: "success", label: "Active", color: "#10b981" },
  trial: { badge: "processing", label: "Trial", color: "#3b82f6" },
  past_due: { badge: "error", label: "Past Due", color: "#ef4444" },
  suspended: { badge: "default", label: "Suspended", color: "#6b7280" },
  inactive: { badge: "default", label: "Inactive", color: "#6b7280" },
};

const ROLE_CONFIG = {
  owner: {
    color: "#f59e0b",
    bg: "#fffbeb",
    darkBg: "#451a03",
    label: "Owner",
    icon: <CrownOutlined />,
  },
  admin: {
    color: "#7c3aed",
    bg: "#f5f3ff",
    darkBg: "#2e1065",
    label: "Admin",
    icon: <SafetyOutlined />,
  },
  manager: {
    color: "#0ea5e9",
    bg: "#f0f9ff",
    darkBg: "#0c4a6e",
    label: "Manager",
    icon: <ApartmentOutlined />,
  },
  hr: {
    color: "#ec4899",
    bg: "#fdf2f8",
    darkBg: "#500724",
    label: "HR",
    icon: <TeamOutlined />,
  },
  developer: {
    color: "#10b981",
    bg: "#ecfdf5",
    darkBg: "#064e3b",
    label: "Developer",
    icon: <CodeOutlined />,
  },
  member: {
    color: "#3b82f6",
    bg: "#eff6ff",
    darkBg: "#1e3a5f",
    label: "Member",
    icon: <UserOutlined />,
  },
  viewer: {
    color: "#6b7280",
    bg: "#f9fafb",
    darkBg: "#374151",
    label: "Viewer",
    icon: <EyeOutlined />,
  },
};

const SALARY_TYPE_COLOR = {
  fixed: { color: "#10b981", bg: "#ecfdf5", darkBg: "#064e3b" },
  commission: { color: "#f59e0b", bg: "#fffbeb", darkBg: "#451a03" },
  hybrid: { color: "#7c3aed", bg: "#f5f3ff", darkBg: "#2e1065" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name, email) => {
  if (name) {
    const parts = name.trim().split(" ").filter(Boolean);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() || "??";
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const fmtLongDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const timeAgo = (d) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000),
    hrs = Math.floor(mins / 60),
    days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
};

const fmtCurrency = (n, currency = "USD") => {
  if (n == null) return "—";
  try {
    const safeCurrency = (currency || "USD").trim().toUpperCase();
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch (err) {
    return `${currency} ${n.toLocaleString()}`;
  }
};

const getDaysLeft = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const STORAGE_MAP = [
  {
    bucket: "attachments",
    sources: [
      { table: "tickets", column: null },
      { table: "ticket_attachments", column: "storage_path" },
    ],
  },
  {
    bucket: "meeting_recordings",
    sources: [{ table: "meetings", column: "recording_url" }],
  },
  {
    bucket: "recruitment-cvs",
    sources: [{ table: "recruitment_applicants", column: "cv_url" }],
  },
  {
    bucket: "training_materials",
    sources: [{ table: "training_materials", column: "file_path" }],
  },
  {
    bucket: "chat-files",
    sources: [{ table: "messages", column: "file_url" }],
  },
  {
    bucket: "documents",
    sources: [{ table: "documents", column: "file_url" }],
  },
];

const extractPath = (urlOrPath) => {
  if (!urlOrPath) return null;
  try {
    const url = new URL(urlOrPath);
    const parts = url.pathname.split("/");
    const bucketIndex = parts.findIndex((p) => p === "public");
    return bucketIndex !== -1
      ? parts.slice(bucketIndex + 2).join("/")
      : urlOrPath;
  } catch {
    return urlOrPath;
  }
};

// ─── Smart Avatar ─────────────────────────────────────────────────────────────
const SmartAvatar = ({
  src,
  name,
  email,
  size = 36,
  radius = "10px",
  fontSize = 13,
  style = {},
}) => {
  const [err, setErr] = useState(false);
  const seed = email || name || "";
  const palette = [
    { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#ede9fe", text: "#6d28d9" },
    { bg: "#d1fae5", text: "#065f46" },
    { bg: "#fef3c7", text: "#92400e" },
    { bg: "#fce7f3", text: "#9d174d" },
    { bg: "#e0f2fe", text: "#0369a1" },
  ];
  const darkPalette = [
    { bg: "#1e3a5f", text: "#60a5fa" },
    { bg: "#2e1065", text: "#a78bfa" },
    { bg: "#064e3b", text: "#34d399" },
    { bg: "#451a03", text: "#fbbf24" },
    { bg: "#4c0519", text: "#f472b6" },
    { bg: "#0c4a6e", text: "#38bdf8" },
  ];
  const isDark =
    document.documentElement.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const colors = (isDark ? darkPalette : palette)[Math.abs(h) % palette.length];

  if (src && !err) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        background: colors.bg,
        color: colors.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize,
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      {getInitials(name, email)}
    </div>
  );
};

// ─── Company Logo ─────────────────────────────────────────────────────────────
const CompanyLogo = ({
  domain,
  name,
  plan,
  size = 48,
  radius = "12px",
  isDark,
}) => {
  const [err, setErr] = useState(false);
  const pc = PLAN_COLOR[plan] || PLAN_COLOR.Free;
  const src = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    : null;

  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
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
        borderRadius: radius,
        flexShrink: 0,
        background: isDark ? pc.darkBg : pc.bg,
        color: pc.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: Math.max(12, size * 0.38),
        border: `2px solid ${isDark ? pc.text + "30" : pc.border}`,
      }}
    >
      {name?.slice(0, 2).toUpperCase() || "??"}
    </div>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, mono, tk, last }) => {
  if (!value || value === "—") return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderBottom: last ? "none" : `1px solid ${tk.divider}`,
      }}
    >
      <span
        style={{ color: tk.textMuted, fontSize: 13, width: 16, flexShrink: 0 }}
      >
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: tk.textMuted,
            marginBottom: 1,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 13,
            color: tk.textPri,
            fontFamily: mono ? "monospace" : "inherit",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ label, tk, action }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: 10,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: tk.textMuted,
      marginBottom: 10,
    }}
  >
    <span>{label}</span>
    {action}
  </div>
);

// ─── Stat Tile ────────────────────────────────────────────────────────────────
const StatTile = ({ label, value, color, tk }) => (
  <div
    style={{
      padding: "12px 14px",
      borderRadius: 10,
      background: tk.statBg,
      border: `1px solid ${tk.border}`,
    }}
  >
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: tk.textMuted,
        marginBottom: 5,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
  </div>
);

// ─── Billing & Discount Card ──────────────────────────────────────────────────
const BillingCard = ({ tenant, isDarkMode, tk }) => {
  const disc =
    tenant.base_mrr > 0 &&
    tenant.mrr > 0 &&
    Number(tenant.mrr) < Number(tenant.base_mrr);
  const discPct =
    tenant.base_mrr > 0
      ? Math.round((1 - Number(tenant.mrr) / Number(tenant.base_mrr)) * 100)
      : 0;
  const discAmt =
    tenant.base_mrr > 0
      ? (Number(tenant.base_mrr) - Number(tenant.mrr)).toFixed(2)
      : 0;
  const isTrialing =
    tenant.trial_ends_at && new Date(tenant.trial_ends_at) > new Date();
  const trialDays = isTrialing
    ? Math.max(
        0,
        Math.ceil((new Date(tenant.trial_ends_at) - Date.now()) / 86400000),
      )
    : 0;

  const BRow = ({ label, value, accent, mono, sub }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: `1px solid ${tk.divider}`,
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: tk.textMuted }}>{label}</div>
        {sub && (
          <div style={{ fontSize: 10, color: tk.textMuted, marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: accent ?? tk.textPri,
          fontFamily: mono ? "monospace" : "inherit",
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <Card
      style={{
        background: tk.cardBg,
        border: `1px solid ${tk.border}`,
        borderRadius: 14,
      }}
      styles={{ body: { padding: "16px 16px 8px" } }}
    >
      <SectionHeader label="Billing & Discount" tk={tk} />

      {/* MRR summary strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: disc ? "1fr 1fr 1fr" : "1fr 1fr",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {[
          {
            label: "Current MRR",
            value: fmtCurrency(tenant.mrr),
            color: disc ? "#15803d" : tk.purple,
            sub: disc ? "discounted" : "full price",
          },
          {
            label: "Base MRR",
            value: fmtCurrency(tenant.base_mrr),
            color: tk.textSec,
            sub: "plan list price",
          },
          ...(disc
            ? [
                {
                  label: "Revenue Lost",
                  value: `-$${discAmt}`,
                  color: tk.red,
                  sub: "per month",
                },
              ]
            : []),
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: tk.statBg,
              border: `1px solid ${tk.border}`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: tk.textMuted,
                marginBottom: 4,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: s.color,
                fontFamily: "monospace",
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: tk.textMuted, marginTop: 1 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Discount badge */}
      {disc && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderRadius: 10,
            marginBottom: 14,
            background: isDarkMode ? "#064e3b" : "#f0fdf4",
            border: `1px solid ${isDarkMode ? "#065f46" : "#bbf7d0"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GiftOutlined style={{ color: "#16a34a", fontSize: 16 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                Promo discount active
              </div>
              <div style={{ fontSize: 11, color: "#16a34a" }}>
                First invoice only — reverts to {fmtCurrency(tenant.base_mrr)}
                /mo after
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#15803d",
                background: "#dcfce7",
                padding: "3px 10px",
                borderRadius: 20,
                border: "1px solid #86efac",
              }}
            >
              −{discPct}%
            </div>
            <div style={{ fontSize: 10, color: "#16a34a", marginTop: 2 }}>
              −${discAmt}/mo
            </div>
          </div>
        </div>
      )}

      {/* Trial badge */}
      {isTrialing && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderRadius: 10,
            marginBottom: 14,
            background: isDarkMode ? "#1e3a5f" : "#eff6ff",
            border: `1px solid ${isDarkMode ? "#1d4ed8" : "#bfdbfe"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClockCircleOutlined style={{ color: "#3b82f6", fontSize: 16 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>
                Free trial active
              </div>
              <div style={{ fontSize: 11, color: "#3b82f6" }}>
                No charge until trial ends
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#1d4ed8",
              background: "#dbeafe",
              padding: "3px 10px",
              borderRadius: 20,
              border: "1px solid #93c5fd",
            }}
          >
            {trialDays}d left
          </div>
        </div>
      )}

      {/* Billing rows */}
      <BRow
        label="Trial ends"
        value={
          tenant.trial_ends_at ? fmtDate(tenant.trial_ends_at) : "No trial"
        }
        accent={isTrialing ? tk.blue : tk.textMuted}
      />
      <BRow
        label="Next billing date"
        value={fmtDate(tenant.current_period_end)}
        sub={tenant.auto_renew ? "Auto-renews" : "Will not renew"}
      />
      <BRow
        label="Billing status"
        value={tenant.auto_renew ? "Auto-renew on" : "Auto-renew off"}
        accent={tenant.auto_renew ? tk.green : tk.amber}
      />
      <BRow
        label="Stripe price ID"
        value={tenant.stripe_price_id ?? "—"}
        mono
        accent={tk.textMuted}
      />

      {/* Due today / recurring summary */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 14px",
          borderRadius: 10,
          marginTop: 14,
          marginBottom: 8,
          background: tk.statBg,
          border: `1px solid ${tk.border}`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: tk.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            {isTrialing ? "Due at trial end" : "Recurring charge"}
          </div>
          <div style={{ fontSize: 10, color: tk.textMuted, marginTop: 2 }}>
            {disc
              ? `First payment: ${fmtCurrency(tenant.mrr)} → then ${fmtCurrency(tenant.base_mrr)}/mo`
              : `${fmtCurrency(tenant.mrr)}/mo ongoing`}
          </div>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: tenant.plan_override ? tk.green : tk.purple,
            fontFamily: "monospace",
          }}
        >
          {tenant.plan_override
            ? "$0"
            : isTrialing
              ? "$0 now"
              : fmtCurrency(tenant.mrr)}
        </div>
      </div>
    </Card>
  );
};

// ─── Subscription Details Card ────────────────────────────────────────────────
const SubscriptionCard = ({
  tenant,
  isDarkMode,
  tk,
  onGrantOverride,
  onRevokeOverride,
  onRefresh,
}) => {
  const plan = tenant?.plan || "Free";
  const pc = PLAN_COLOR[plan] || PLAN_COLOR.Free;
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.Free;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.Free;

  const hasOverride = tenant?.plan_override === true;
  const overridePlan = tenant?.override_plan || plan;
  const overrideExpiry = tenant?.override_expires_at;
  const daysLeft = getDaysLeft(overrideExpiry);
  const isExpired = overrideExpiry && daysLeft === 0;
  const autoRenew = tenant?.auto_renew !== false;
  const isCancelled = tenant?.status === "cancelled";
  const periodEnd = tenant?.current_period_end;

  const displayPlan = hasOverride ? overridePlan : plan;
  const dpc = PLAN_COLOR[displayPlan] || PLAN_COLOR.Free;

  return (
    <Card
      style={{
        background: tk.cardBg,
        border: `1px solid ${tk.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Header */}
      <div
        style={{
          background: isDarkMode
            ? `linear-gradient(135deg, ${dpc.darkBg} 0%, #1e293b 100%)`
            : `linear-gradient(135deg, ${dpc.bg} 0%, #f8fafc 100%)`,
          padding: "16px 18px",
          borderBottom: `1px solid ${tk.border}`,
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
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isDarkMode ? `${dpc.text}20` : `${dpc.text}18`,
                color: dpc.text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              {displayPlan === "Enterprise" ? (
                <CrownOutlined />
              ) : displayPlan === "Pro" ? (
                <RocketOutlined />
              ) : displayPlan === "Starter" ? (
                <ThunderboltOutlined />
              ) : (
                <StarOutlined />
              )}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{ fontSize: 15, fontWeight: 800, color: tk.textPri }}
                >
                  {displayPlan} Plan
                </span>
                {hasOverride && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: "linear-gradient(90deg,#f59e0b,#ef4444)",
                      color: "#fff",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                      display: "inline-block",
                    }}
                  >
                    FREE
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: tk.textMuted, marginTop: 2 }}>
                {hasOverride
                  ? "Complimentary access — no charge"
                  : `${fmtCurrency(limits.mrr)}/mo`}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Tooltip title="Refresh">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                style={{
                  border: `1px solid ${tk.border}`,
                  color: tk.textMuted,
                  background: "transparent",
                }}
              />
            </Tooltip>
            {hasOverride ? (
              <Popconfirm
                title="Revoke free override?"
                description="The tenant will revert to their actual billing plan."
                onConfirm={onRevokeOverride}
                okText="Revoke"
                okType="danger"
              >
                <Button size="small" danger icon={<CloseCircleOutlined />}>
                  Revoke
                </Button>
              </Popconfirm>
            ) : (
              <Button
                size="small"
                icon={<GiftOutlined />}
                onClick={onGrantOverride}
                style={{
                  background: "linear-gradient(90deg,#7c3aed,#3b82f6)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                }}
              >
                Grant Free
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Override warning / expiry banner */}
      {hasOverride && (
        <div
          style={{
            padding: "10px 18px",
            background: isExpired ? `${tk.red}10` : `#f59e0b10`,
            borderBottom: `1px solid ${isExpired ? tk.red + "30" : "#f59e0b30"}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {isExpired ? (
            <ExclamationCircleOutlined
              style={{ color: tk.red, flexShrink: 0 }}
            />
          ) : (
            <GiftOutlined style={{ color: "#f59e0b", flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isExpired ? tk.red : "#92400e",
              }}
            >
              {isExpired
                ? "Override expired"
                : overrideExpiry
                  ? `Override expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
                  : "Permanent free override"}
            </div>
            {overrideExpiry && (
              <div style={{ fontSize: 11, color: tk.textMuted }}>
                {isExpired
                  ? `Expired on ${fmtDate(overrideExpiry)}`
                  : `Until ${fmtDate(overrideExpiry)}`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status row */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: `1px solid ${tk.divider}`,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 20,
              background: isCancelled ? `${tk.red}12` : `${tk.green}12`,
              color: isCancelled ? tk.red : tk.green,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: isCancelled ? tk.red : tk.green,
                display: "inline-block",
              }}
            />
            {isCancelled ? "Cancelled" : "Active"}
          </span>
          {!hasOverride && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 20,
                background: autoRenew ? `${tk.blue}12` : `#f59e0b12`,
                color: autoRenew ? tk.blue : "#f59e0b",
              }}
            >
              <SyncOutlined style={{ fontSize: 9 }} />
              {autoRenew ? "Auto-renew on" : "Auto-renew off"}
            </span>
          )}
          {!hasOverride && limits.mrr > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 20,
                background: `${tk.purple}12`,
                color: tk.purple,
              }}
            >
              <CreditCardOutlined style={{ fontSize: 9 }} />
              {fmtCurrency(tenant?.mrr || limits.mrr)}/mo
            </span>
          )}
          {hasOverride && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 20,
                background: "#10b98112",
                color: "#10b981",
              }}
            >
              <CheckOutlined style={{ fontSize: 9 }} />
              $0 / complimentary
            </span>
          )}
        </div>
      </div>

      {/* Billing dates */}
      {(periodEnd || tenant?.trial_ends_at) && !hasOverride && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            padding: "12px 18px",
            gap: 12,
            borderBottom: `1px solid ${tk.divider}`,
          }}
        >
          {periodEnd && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: tk.textMuted,
                  marginBottom: 4,
                }}
              >
                {isCancelled
                  ? "Access Until"
                  : autoRenew
                    ? "Next Renewal"
                    : "Expires"}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: tk.textPri }}>
                {fmtDate(periodEnd)}
              </div>
              {getDaysLeft(periodEnd) !== null && (
                <div
                  style={{
                    fontSize: 10,
                    color: getDaysLeft(periodEnd) <= 7 ? tk.red : tk.textMuted,
                  }}
                >
                  {getDaysLeft(periodEnd)} days left
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Plan limits */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderBottom: `1px solid ${tk.divider}`,
        }}
      >
        {[
          {
            label: "Max Users",
            value: limits.max_users == null ? "∞ Unlimited" : limits.max_users,
            color: tk.blue,
          },
          {
            label: "Storage",
            value:
              limits.storage_gb == null
                ? "∞ Unlimited"
                : `${limits.storage_gb} GB`,
            color: tk.green,
          },
          {
            label: "Base Price",
            value: hasOverride ? "Free" : fmtCurrency(limits.mrr) + "/mo",
            color: hasOverride ? tk.green : tk.purple,
          },
        ].map((s, i, arr) => (
          <div
            key={s.label}
            style={{
              padding: "12px 14px",
              textAlign: "center",
              borderRight:
                i < arr.length - 1 ? `1px solid ${tk.divider}` : "none",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: tk.textMuted,
                marginBottom: 5,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Included features */}
      <div style={{ padding: "14px 18px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: tk.textMuted,
            marginBottom: 10,
          }}
        >
          Included Features
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "7px 12px" }}>
          {features.map((f) => (
            <span
              key={f}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: tk.textSec,
              }}
            >
              <CheckOutlined style={{ color: dpc.text, fontSize: 9 }} />
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Stripe IDs */}
      {(tenant?.stripe_customer_id || tenant?.stripe_subscription_id) && (
        <div
          style={{
            padding: "12px 18px",
            borderTop: `1px solid ${tk.divider}`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: tk.textMuted,
              marginBottom: 8,
            }}
          >
            Stripe
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { label: "Customer", value: tenant.stripe_customer_id },
              { label: "Sub", value: tenant.stripe_subscription_id },
            ]
              .filter((r) => r.value)
              .map((r) => (
                <div
                  key={r.label}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: tk.textMuted,
                      width: 52,
                      flexShrink: 0,
                    }}
                  >
                    {r.label}
                  </span>
                  <Tooltip title="Click to copy">
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText(r.value);
                        message.success(`${r.label} ID copied`);
                      }}
                      style={{
                        flex: 1,
                        fontSize: 10,
                        fontFamily: "monospace",
                        padding: "4px 8px",
                        borderRadius: 6,
                        background: tk.statBg,
                        border: `1px solid ${tk.border}`,
                        color: tk.textSec,
                        cursor: "pointer",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.value}
                    </div>
                  </Tooltip>
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// ─── Grant Override Modal ─────────────────────────────────────────────────────
const GrantOverrideModal = ({
  open,
  onClose,
  onConfirm,
  currentPlan,
  saving,
  isDarkMode,
  tk,
}) => {
  const [form] = Form.useForm();
  const [selectedPlan, setSelectedPlan] = useState("Enterprise");

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onConfirm({
        override_plan: values.override_plan,
        override_expires_at: values.override_expires_at
          ? values.override_expires_at.toISOString()
          : null,
        override_reason: values.override_reason || null,
        override_custom_max_users: values.override_custom_max_users || null,
        override_custom_storage_gb: values.override_custom_storage_gb || null,
      });
    } catch {}
  };

  const plan = selectedPlan;
  const pc = PLAN_COLOR[plan] || PLAN_COLOR.Free;
  const features = PLAN_FEATURES[plan] || [];

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 14,
            }}
          >
            <GiftOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              Grant Free Plan Override
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>
              Give this tenant premium access at no charge
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      okText="Grant Access"
      confirmLoading={saving}
      width={560}
      destroyOnClose
      okButtonProps={{
        style: {
          background: "linear-gradient(90deg,#7c3aed,#3b82f6)",
          border: "none",
          fontWeight: 700,
        },
      }}
    >
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            marginBottom: 20,
            background: isDarkMode ? "#2e1065" : "#f5f3ff",
            border: "1px solid #c4b5fd",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <InfoCircleOutlined
            style={{ color: "#7c3aed", marginTop: 2, flexShrink: 0 }}
          />
          <div
            style={{
              fontSize: 12,
              color: isDarkMode ? "#c4b5fd" : "#5b21b6",
              lineHeight: 1.6,
            }}
          >
            This grants the tenant full access to the selected plan{" "}
            <strong>at $0 cost</strong>. Their MRR will be set to 0 and Stripe
            billing will not be affected — this is an internal override tracked
            in your database only.
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{ override_plan: "Enterprise" }}
        >
          <Form.Item
            name="override_plan"
            label="Plan to Grant"
            rules={[{ required: true }]}
          >
            <Select onChange={setSelectedPlan} size="large">
              {["Enterprise", "Pro", "Starter"].map((p) => {
                const c = PLAN_COLOR[p];
                return (
                  <Option key={p} value={p}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: c.text,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: 700 }}>{p}</span>
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>
                        (normally {fmtCurrency(PLAN_LIMITS[p].mrr)}/mo)
                      </span>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              marginBottom: 16,
              background: isDarkMode ? pc.darkBg : pc.bg,
              border: `1px solid ${isDarkMode ? pc.text + "30" : pc.border}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: pc.text,
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {plan} includes
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 14px" }}>
              {features.map((f) => (
                <span
                  key={f}
                  style={{
                    fontSize: 11,
                    color: isDarkMode ? "#cbd5e1" : "#475569",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <CheckOutlined style={{ color: pc.text, fontSize: 9 }} />
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 16px",
            }}
          >
            <Form.Item
              name="override_custom_max_users"
              label={
                <span>
                  Custom Max Users{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                    (optional)
                  </span>
                </span>
              }
            >
              <InputNumber
                min={1}
                max={10000}
                style={{ width: "100%" }}
                placeholder={`Default: ${PLAN_LIMITS[plan]?.max_users ?? "Unlimited"}`}
              />
            </Form.Item>

            <Form.Item
              name="override_custom_storage_gb"
              label={
                <span>
                  Custom Storage GB{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                    (optional)
                  </span>
                </span>
              }
            >
              <InputNumber
                min={1}
                max={10000}
                style={{ width: "100%" }}
                placeholder={`Default: ${PLAN_LIMITS[plan]?.storage_gb ?? "Unlimited"}`}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="override_expires_at"
            label={
              <span>
                Expiry Date{" "}
                <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                  (leave blank for permanent)
                </span>
              </span>
            }
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(d) => d && d < dayjs().startOf("day")}
              placeholder="Never expires"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="override_reason"
            label={
              <span>
                Reason{" "}
                <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                  (internal note)
                </span>
              </span>
            }
          >
            <Input.TextArea
              rows={2}
              placeholder="e.g. Partnership deal, beta tester, investor demo..."
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

// ─── TenantDetailPage ─────────────────────────────────────────────────────────
const TenantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [tenantForm] = Form.useForm();
  const [userForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [tenant, setTenant] = useState(null);
  const [users, setUsers] = useState([]);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [overrideSaving, setOverrideSaving] = useState(false);

  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [grantOverrideOpen, setGrantOverrideOpen] = useState(false);
  const [storageData, setStorageData] = useState();
  const [loadingStorage, setLoadingStorage] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const tk = {
    cardBg: isDarkMode ? "#1e293b" : "#ffffff",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    divider: isDarkMode ? "#1e293b" : "#f1f5f9",
    textPri: isDarkMode ? "#f1f5f9" : "#0f172a",
    textSec: isDarkMode ? "#94a3b8" : "#475569",
    textMuted: isDarkMode ? "#64748b" : "#94a3b8",
    statBg: isDarkMode ? "#0f172a" : "#f8fafc",
    heroBg: isDarkMode
      ? "linear-gradient(135deg,#1e293b 0%,#0f172a 100%)"
      : "linear-gradient(135deg,#f0f9ff 0%,#f8fafc 100%)",
    blue: "#3b82f6",
    green: "#10b981",
    amber: "#f59e0b",
    red: "#ef4444",
    purple: "#7c3aed",
  };

  // ── Fetch tenant ────────────────────────────────────────────────────────────
  const fetchTenant = useCallback(async () => {
    setTenantLoading(true);
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select(
          `
          id, name, plan, status, mrr, base_mrr, health_score, created_at, updated_at,
          owner_email, owner_name, domain, max_users, notes, storage_gb,
          trial_ends_at, industry, company_size, user_count,
          stripe_customer_id, stripe_subscription_id, stripe_price_id,
          auto_renew, current_period_end,
          plan_override, override_plan, override_expires_at,
          override_reason, override_custom_max_users, override_custom_storage_gb
        `,
        )
        .eq("id", id)
        .single();
      if (error) throw error;
      setTenant(data);
    } catch (err) {
      messageApi.error("Failed to load tenant");
    } finally {
      setTenantLoading(false);
    }
  }, [id]);

  // ── Fetch users ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id, email, full_name, role, phone, contact, job_title, department,
          user_photo, salary_type, salary_amount, base_salary, currency,
          working_hours, suspended, bio, address, cnic, dob, github_username,
          bank_name, bank_account_number, bank_account_name,
          created_at, updated_at
        `,
        )
        .eq("tenant_id", id)
        .not("role", "eq", "superadmin")
        .not("role", "eq", "super_admin")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      messageApi.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [id]);

  const calculateStorageUsed = useCallback(async (tenantId) => {
    const results = await Promise.all(
      STORAGE_MAP.map(async ({ bucket, sources }) => {
        let totalBytes = 0;
        let fileCount = 0;
        for (const { table, column } of sources) {
          if (!column) continue;
          const { data, error } = await supabase
            .from(table)
            .select(column)
            .eq("tenant_id", tenantId);
          if (error || !data) continue;
          fileCount += data.length;
          await Promise.all(
            data.map(async (row) => {
              const path = extractPath(row[column]);
              if (!path) return;
              const folder = path.split("/").slice(0, -1).join("/");
              const filename = path.split("/").pop();
              const { data: files } = await supabase.storage
                .from(bucket)
                .list(folder, { limit: 1, search: filename });
              if (files && files.length > 0) {
                const file = files[0];
                totalBytes +=
                  file.metadata?.size ?? file.metadata?.contentLength ?? 0;
              }
            }),
          );
        }
        return { bucket, bytes: totalBytes, fileCount };
      }),
    );
    const totalBytes = results.reduce((sum, r) => sum + r.bytes, 0);
    return { totalBytes, breakdown: results };
  }, []);

  const fetchStorage = useCallback(async () => {
    setLoadingStorage(true);
    try {
      const result = await calculateStorageUsed(id);
      setStorageData(result);
    } catch (err) {
      console.error("Storage calc error:", err);
    } finally {
      setLoadingStorage(false);
    }
  }, [id, calculateStorageUsed]);

  useEffect(() => {
    fetchTenant();
    fetchUsers();
    fetchStorage();
  }, [fetchTenant, fetchUsers, fetchStorage]);

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchSearch =
      !userSearch ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.job_title?.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── Tenant edit ─────────────────────────────────────────────────────────────
  const openEditTenant = () => {
    tenantForm.setFieldsValue({
      name: tenant.name,
      plan: tenant.plan,
      status: tenant.status,
      owner_name: tenant.owner_name,
      owner_email: tenant.owner_email,
      domain: tenant.domain,
      mrr: tenant.mrr,
      max_users: tenant.max_users,
      notes: tenant.notes,
    });
    setEditTenantOpen(true);
  };

  const handleSaveTenant = async () => {
    try {
      const values = await tenantForm.validateFields();
      setSaving(true);
      const { error } = await supabase
        .from("tenants")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      messageApi.success("Tenant updated");
      setEditTenantOpen(false);
      fetchTenant();
    } catch (err) {
      if (err?.errorFields) return;
      messageApi.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTenant = async () => {
    try {
      const { error } = await supabase.from("tenants").delete().eq("id", id);
      if (error) throw error;
      messageApi.success("Tenant deleted");
      navigate("/tenants");
    } catch (err) {
      messageApi.error("Delete failed");
    }
  };

  const handleTenantStatusChange = async (newStatus) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      messageApi.success(`Tenant ${newStatus}`);
      fetchTenant();
    } catch (err) {
      messageApi.error("Update failed");
    }
  };

  // ── Grant / Revoke override ─────────────────────────────────────────────────
  const handleGrantOverride = async (values) => {
    setOverrideSaving(true);
    try {
      const limits =
        PLAN_LIMITS[values.override_plan] || PLAN_LIMITS.Enterprise;
      const { error } = await supabase
        .from("tenants")
        .update({
          plan_override: true,
          override_plan: values.override_plan,
          override_expires_at: values.override_expires_at || null,
          override_reason: values.override_reason || null,
          override_custom_max_users: values.override_custom_max_users || null,
          override_custom_storage_gb: values.override_custom_storage_gb || null,
          plan: values.override_plan,
          max_users: values.override_custom_max_users || limits.max_users,
          storage_gb: values.override_custom_storage_gb || limits.storage_gb,
          mrr: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      messageApi.success(
        `✓ Granted free ${values.override_plan} access to ${tenant.name}`,
      );
      setGrantOverrideOpen(false);
      fetchTenant();
    } catch (err) {
      messageApi.error(err.message || "Failed to grant override");
    } finally {
      setOverrideSaving(false);
    }
  };

  const handleRevokeOverride = async () => {
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          plan_override: false,
          override_plan: null,
          override_expires_at: null,
          override_reason: null,
          override_custom_max_users: null,
          override_custom_storage_gb: null,
          plan: tenant.stripe_subscription_id ? tenant.plan : "Free",
          max_users:
            PLAN_LIMITS[tenant.stripe_subscription_id ? tenant.plan : "Free"]
              .max_users,
          storage_gb:
            PLAN_LIMITS[tenant.stripe_subscription_id ? tenant.plan : "Free"]
              .storage_gb,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      messageApi.success("Override revoked — tenant reverted to billing plan");
      fetchTenant();
    } catch (err) {
      messageApi.error(err.message || "Failed to revoke override");
    }
  };

  // ── User edit / delete / suspend ────────────────────────────────────────────
  const openEditUser = (user) => {
    setEditingUser(user);
    userForm.setFieldsValue({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      job_title: user.job_title,
      department: user.department,
      phone: user.phone,
      salary_type: user.salary_type,
      salary_amount: user.salary_amount,
      working_hours: user.working_hours,
    });
    setEditUserOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      const values = await userForm.validateFields();
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", editingUser.id);
      if (error) throw error;
      messageApi.success("User updated");
      setEditUserOpen(false);
      fetchUsers();
    } catch (err) {
      if (err?.errorFields) return;
      messageApi.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (error) throw error;
      messageApi.success("User deleted");
      setUserDrawerOpen(false);
      fetchUsers();
      fetchTenant();
    } catch (err) {
      messageApi.error("Delete failed");
    }
  };

  const handleUserSuspend = async (userId, suspend) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ suspended: suspend, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      messageApi.success(suspend ? "User suspended" : "User activated");
      fetchUsers();
      if (viewUser?.id === userId)
        setViewUser((v) => ({ ...v, suspended: suspend }));
    } catch (err) {
      messageApi.error("Update failed");
    }
  };

  const userRowMenu = (user) => ({
    items: [
      {
        key: "view",
        icon: <EyeOutlined />,
        label: "View Profile",
        onClick: () => {
          setViewUser(user);
          setUserDrawerOpen(true);
        },
      },
      {
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit",
        onClick: (e) => {
          e.domEvent.stopPropagation();
          openEditUser(user);
        },
      },
      { type: "divider" },
      user.suspended
        ? {
            key: "activate",
            icon: <CheckCircleOutlined />,
            label: "Activate",
            onClick: () => handleUserSuspend(user.id, false),
          }
        : {
            key: "suspend",
            icon: <StopOutlined />,
            label: "Suspend",
            danger: true,
            onClick: () => handleUserSuspend(user.id, true),
          },
      { type: "divider" },
      {
        key: "delete",
        icon: <DeleteOutlined />,
        label: "Delete",
        danger: true,
        onClick: () =>
          Modal.confirm({
            title: `Delete "${user.full_name || user.email}"?`,
            content: "This cannot be undone.",
            okText: "Delete",
            okType: "danger",
            onOk: () => handleDeleteUser(user.id),
          }),
      },
    ],
  });

  const userColumns = [
    {
      title: "User",
      dataIndex: "full_name",
      sorter: (a, b) =>
        (a.full_name || a.email || "").localeCompare(
          b.full_name || b.email || "",
        ),
      render: (name, row) => {
        const src = row.user_photo
          ? row.user_photo.startsWith("http")
            ? row.user_photo
            : supabase.storage.from("avatars").getPublicUrl(row.user_photo).data
                ?.publicUrl
          : null;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <SmartAvatar
                src={src}
                name={name}
                email={row.email}
                size={36}
                radius="10px"
                style={{
                  border: `2px solid ${row.suspended ? tk.red + "50" : tk.green + "50"}`,
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: row.suspended ? tk.red : tk.green,
                  border: `2px solid ${tk.cardBg}`,
                }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: tk.textPri }}>
                {name || (
                  <span style={{ color: tk.textMuted, fontWeight: 400 }}>
                    No name
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: tk.textMuted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (role) => {
        const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.member;
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 20,
              background: isDarkMode ? cfg.darkBg : cfg.bg,
              color: cfg.color,
            }}
          >
            <span style={{ fontSize: 10 }}>{cfg.icon}</span>
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "suspended",
      render: (suspended) =>
        suspended ? (
          <Badge
            status="error"
            text={
              <span style={{ fontSize: 12, fontWeight: 500, color: tk.red }}>
                Suspended
              </span>
            }
          />
        ) : (
          <Badge
            status="success"
            text={
              <span style={{ fontSize: 12, fontWeight: 500, color: tk.green }}>
                Active
              </span>
            }
          />
        ),
    },
    {
      title: "Salary",
      dataIndex: "salary_amount",
      sorter: (a, b) => (a.salary_amount || 0) - (b.salary_amount || 0),
      render: (amount, row) => {
        if (!amount) return <span style={{ color: tk.textMuted }}>—</span>;
        const sc =
          SALARY_TYPE_COLOR[row.salary_type] || SALARY_TYPE_COLOR.fixed;
        const currency = (row.currency || "USD").toUpperCase();
        return (
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "monospace",
                color: tk.textPri,
              }}
            >
              {fmtCurrency(amount, currency)}
            </div>
            {row.salary_type && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: 20,
                  background: isDarkMode ? sc.darkBg : sc.bg,
                  color: sc.color,
                }}
              >
                {row.salary_type}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => (
        <Tooltip title={timeAgo(date)}>
          <span style={{ fontSize: 12, color: tk.textMuted }}>
            {fmtDate(date)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "",
      width: 44,
      render: (_, row) => (
        <Dropdown
          menu={userRowMenu(row)}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            style={{ color: tk.textMuted }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  if (tenantLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 16, color: "#6b7280", marginBottom: 16 }}>
          Tenant not found
        </div>
        <Button onClick={() => navigate("/tenants")}>Back to Tenants</Button>
      </div>
    );
  }

  const pc = PLAN_COLOR[tenant.plan] || PLAN_COLOR.Free;
  const sc = STATUS_CONFIG[tenant.status] || STATUS_CONFIG.inactive;
  const activeUsers = users.filter((u) => !u.suspended).length;
  const suspendedUsers = users.filter((u) => u.suspended).length;

  return (
    <div style={{ color: tk.textPri }}>
      {contextHolder}

      {/* ── Back nav ───────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/tenants")}
          style={{ color: tk.textMuted, padding: "4px 0", fontWeight: 500 }}
        >
          Back to Tenants
        </Button>
      </div>

      {/* ── Tenant Hero Card ──────────────────────────────────────────────── */}
      <Card
        style={{
          background: tk.cardBg,
          border: `1px solid ${tk.border}`,
          borderRadius: 16,
          marginBottom: 20,
          overflow: "hidden",
        }}
        styles={{ body: { padding: 0 } }}
      >
        {/* Hero banner */}
        <div
          style={{
            background: isDarkMode
              ? `linear-gradient(135deg, ${pc.darkBg} 0%, #1e293b 60%, #0f172a 100%)`
              : `linear-gradient(135deg, ${pc.bg} 0%, #f8fafc 100%)`,
            padding: "28px 28px 24px",
            borderBottom: `1px solid ${tk.border}`,
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
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <CompanyLogo
                domain={tenant.domain}
                name={tenant.name}
                plan={tenant.plan}
                size={64}
                radius="16px"
                isDark={isDarkMode}
              />
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 900,
                    color: tk.textPri,
                    lineHeight: 1.2,
                  }}
                >
                  {tenant.name}
                </h2>
                <div
                  style={{ fontSize: 13, color: tk.textMuted, marginTop: 3 }}
                >
                  {tenant.domain || tenant.owner_email || "No domain set"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "4px 12px",
                      borderRadius: 20,
                      background: isDarkMode ? pc.darkBg : pc.bg,
                      color: pc.text,
                      border: `1px solid ${isDarkMode ? pc.text + "40" : pc.border}`,
                    }}
                  >
                    {tenant.plan}
                  </span>
                  {tenant.plan_override && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "4px 12px",
                        borderRadius: 20,
                        background:
                          "linear-gradient(90deg,#f59e0b22,#ef444422)",
                        color: "#f59e0b",
                        border: "1px solid #f59e0b40",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <GiftOutlined style={{ fontSize: 9 }} /> Free Override
                    </span>
                  )}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: `${sc.color}15`,
                      color: sc.color,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: sc.color,
                        display: "inline-block",
                      }}
                    />
                    {sc.label}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {tenant.status === "active" ? (
                <Popconfirm
                  title="Suspend this tenant?"
                  description="All users will lose access immediately."
                  onConfirm={() => handleTenantStatusChange("suspended")}
                  okText="Suspend"
                  okType="danger"
                >
                  <Button danger icon={<StopOutlined />}>
                    Suspend
                  </Button>
                </Popconfirm>
              ) : (
                <Button
                  icon={<CheckCircleOutlined />}
                  style={{ borderColor: tk.green, color: tk.green }}
                  onClick={() => handleTenantStatusChange("active")}
                >
                  Activate
                </Button>
              )}
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={openEditTenant}
              >
                Edit Tenant
              </Button>
              <Popconfirm
                title={`Delete "${tenant.name}"?`}
                description="This will permanently remove the tenant and all data."
                onConfirm={handleDeleteTenant}
                okText="Delete"
                okType="danger"
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          </div>
        </div>

        {/* KPI stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            borderTop: `1px solid ${tk.border}`,
          }}
        >
          {[
            {
              label: "MRR",
              value: tenant.plan_override
                ? "$0 (Override)"
                : fmtCurrency(tenant.mrr),
              color: tenant.plan_override ? tk.green : tk.purple,
            },
            {
              label: "Users",
              value: `${users.length}${tenant.max_users ? ` / ${tenant.max_users}` : ""}`,
              color: tk.blue,
            },
            { label: "Active", value: activeUsers, color: tk.green },
            { label: "Suspended", value: suspendedUsers, color: tk.red },
            {
              label: "Health",
              value:
                tenant.health_score != null ? `${tenant.health_score}%` : "—",
              color: tenant.health_score > 70 ? tk.green : tk.red,
            },
            {
              label: "Storage",
              value: loadingStorage
                ? "…"
                : storageData
                  ? storageData.totalBytes >= 1073741824
                    ? `${(storageData.totalBytes / 1073741824).toFixed(2)} GB`
                    : storageData.totalBytes >= 1048576
                      ? `${(storageData.totalBytes / 1048576).toFixed(1)} MB`
                      : `${(storageData.totalBytes / 1024).toFixed(0)} KB`
                  : tenant.storage_gb != null
                    ? `${tenant.storage_gb} GB`
                    : "—",
              color: tk.blue,
            },
          ].map((s, i, arr) => (
            <div
              key={s.label}
              style={{
                padding: "16px 20px",
                borderRight:
                  i < arr.length - 1 ? `1px solid ${tk.border}` : "none",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: tk.textMuted,
                  marginBottom: 6,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: s.color,
                  fontFamily: "monospace",
                }}
              >
                {usersLoading &&
                (s.label === "Users" ||
                  s.label === "Active" ||
                  s.label === "Suspended") ? (
                  <Spin size="small" />
                ) : (
                  s.value
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* ── Left column ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* ── SUBSCRIPTION CARD ──────────────────────────────────────────── */}
          <SubscriptionCard
            tenant={tenant}
            isDarkMode={isDarkMode}
            tk={tk}
            onGrantOverride={() => setGrantOverrideOpen(true)}
            onRevokeOverride={handleRevokeOverride}
            onRefresh={fetchTenant}
          />

          {/* ── BILLING & DISCOUNT CARD ────────────────────────────────────── */}
          <BillingCard tenant={tenant} isDarkMode={isDarkMode} tk={tk} />

          {/* Override reason display (if active) */}
          {tenant.plan_override && tenant.override_reason && (
            <Card
              style={{
                background: tk.cardBg,
                border: `1px solid #f59e0b40`,
                borderRadius: 14,
              }}
              styles={{ body: { padding: 14 } }}
            >
              <div
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <GiftOutlined
                  style={{ color: "#f59e0b", marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: tk.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    Override Reason
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: tk.textSec,
                      lineHeight: 1.5,
                    }}
                  >
                    {tenant.override_reason}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Contact info */}
          <Card
            style={{
              background: tk.cardBg,
              border: `1px solid ${tk.border}`,
              borderRadius: 14,
            }}
            styles={{ body: { padding: "16px 0 4px" } }}
          >
            <div style={{ padding: "0 16px 10px" }}>
              <SectionHeader label="Contact" tk={tk} />
            </div>
            {[
              {
                icon: <UserOutlined />,
                label: "Owner",
                value: tenant.owner_name,
              },
              {
                icon: <MailOutlined />,
                label: "Email",
                value: tenant.owner_email,
              },
              {
                icon: <GlobalOutlined />,
                label: "Domain",
                value: tenant.domain,
              },
              {
                icon: <CalendarOutlined />,
                label: "Joined",
                value: fmtLongDate(tenant.created_at),
              },
              {
                icon: <ClockCircleOutlined />,
                label: "Updated",
                value: timeAgo(tenant.updated_at),
              },
            ].map((r, i, arr) => (
              <InfoRow
                key={r.label}
                {...r}
                tk={tk}
                last={i === arr.length - 1}
              />
            ))}
          </Card>

          {/* Company info */}
          <Card
            style={{
              background: tk.cardBg,
              border: `1px solid ${tk.border}`,
              borderRadius: 14,
            }}
            styles={{ body: { padding: "16px 0 4px" } }}
          >
            <div style={{ padding: "0 16px 10px" }}>
              <SectionHeader label="Company" tk={tk} />
            </div>
            {[
              {
                icon: <BuildOutlined />,
                label: "Industry",
                value: tenant.industry,
              },
              {
                icon: <TeamOutlined />,
                label: "Company Size",
                value: tenant.company_size,
              },
              {
                icon: <DollarOutlined />,
                label: "MRR",
                value: fmtCurrency(tenant.mrr),
              },
            ].map((r, i, arr) => (
              <InfoRow
                key={r.label}
                {...r}
                tk={tk}
                last={i === arr.length - 1}
              />
            ))}
          </Card>

          {/* User capacity */}
          {tenant.max_users && (
            <Card
              style={{
                background: tk.cardBg,
                border: `1px solid ${tk.border}`,
                borderRadius: 14,
              }}
              styles={{ body: { padding: 16 } }}
            >
              <SectionHeader label="User Capacity" tk={tk} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: tk.textMuted,
                  marginBottom: 8,
                }}
              >
                <span>
                  {users.length} of {tenant.max_users} users
                </span>
                <span style={{ fontWeight: 700 }}>
                  {Math.round((users.length / tenant.max_users) * 100)}%
                </span>
              </div>
              <Progress
                percent={Math.round((users.length / tenant.max_users) * 100)}
                showInfo={false}
                strokeColor={
                  users.length / tenant.max_users > 0.9 ? tk.red : tk.blue
                }
                trailColor={tk.border}
              />
            </Card>
          )}

          {/* Health */}
          {tenant.health_score != null && (
            <Card
              style={{
                background: tk.cardBg,
                border: `1px solid ${tk.border}`,
                borderRadius: 14,
              }}
              styles={{ body: { padding: 16 } }}
            >
              <SectionHeader label="Health Score" tk={tk} />
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: `4px solid ${
                      tenant.health_score > 90
                        ? tk.green
                        : tenant.health_score > 70
                          ? tk.amber
                          : tk.red
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 900,
                    color: tk.textPri,
                  }}
                >
                  {tenant.health_score}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color:
                        tenant.health_score > 90
                          ? tk.green
                          : tenant.health_score > 70
                            ? tk.amber
                            : tk.red,
                    }}
                  >
                    {tenant.health_score > 90
                      ? "Excellent"
                      : tenant.health_score > 70
                        ? "Good"
                        : "Needs Attention"}
                  </div>
                  <div style={{ fontSize: 11, color: tk.textMuted }}>
                    Health score
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          {tenant.notes && (
            <Card
              style={{
                background: tk.cardBg,
                border: `1px solid ${tk.border}`,
                borderRadius: 14,
              }}
              styles={{ body: { padding: 16 } }}
            >
              <SectionHeader label="Notes" tk={tk} />
              <div style={{ fontSize: 13, lineHeight: 1.6, color: tk.textSec }}>
                {tenant.notes}
              </div>
            </Card>
          )}
        </div>

        {/* ── Right: Users Table ──────────────────────────────────────────── */}
        <Card
          style={{
            background: tk.cardBg,
            border: `1px solid ${tk.border}`,
            borderRadius: 14,
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: `1px solid ${tk.divider}`,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `${tk.blue}18`,
                  color: tk.blue,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                <TeamOutlined />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: tk.textPri,
                  }}
                >
                  Users
                </div>
                <div style={{ fontSize: 11, color: tk.textMuted }}>
                  {usersLoading
                    ? "Loading…"
                    : `${users.length} member${users.length !== 1 ? "s" : ""} in this tenant`}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Input
                placeholder="Search users…"
                allowClear
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: 200 }}
                prefix={
                  <UserOutlined style={{ color: tk.textMuted, fontSize: 12 }} />
                }
                size="small"
              />
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="all">All Roles</Option>
                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ color: v.color, fontSize: 10 }}>
                        {v.icon}
                      </span>
                      {v.label}
                    </span>
                  </Option>
                ))}
              </Select>
              <Tooltip title="Refresh">
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={fetchUsers}
                  style={{
                    borderColor: tk.border,
                    color: tk.textSec,
                    background: "transparent",
                  }}
                />
              </Tooltip>
            </div>
          </div>

          {!usersLoading && (
            <div
              style={{
                padding: "6px 20px",
                borderBottom: `1px solid ${tk.divider}`,
                background: tk.statBg,
                fontSize: 12,
                color: tk.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                <b style={{ color: tk.textSec }}>{filteredUsers.length}</b> of{" "}
                <b style={{ color: tk.textSec }}>{users.length}</b> users
              </span>
              <div style={{ display: "flex", gap: 14 }}>
                {[
                  {
                    label: "Active",
                    count: filteredUsers.filter((u) => !u.suspended).length,
                    color: tk.green,
                  },
                  {
                    label: "Suspended",
                    count: filteredUsers.filter((u) => u.suspended).length,
                    color: tk.red,
                  },
                ].map((s) => (
                  <span
                    key={s.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: s.color,
                        display: "inline-block",
                      }}
                    />
                    <b style={{ color: tk.textSec }}>{s.count}</b>&nbsp;
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Table
            dataSource={filteredUsers}
            columns={userColumns}
            loading={usersLoading}
            rowKey="id"
            size="middle"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              showTotal: (t) => (
                <span style={{ color: tk.textMuted, fontSize: 12 }}>
                  {t} users
                </span>
              ),
            }}
            onRow={(row) => ({
              onClick: () => {
                setViewUser(row);
                setUserDrawerOpen(true);
              },
              style: { cursor: "pointer" },
            })}
            locale={{
              emptyText: (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <TeamOutlined
                    style={{
                      fontSize: 32,
                      color: tk.textMuted,
                      marginBottom: 10,
                    }}
                  />
                  <div style={{ color: tk.textMuted, fontSize: 14 }}>
                    No users in this tenant yet
                  </div>
                </div>
              ),
            }}
          />
        </Card>
      </div>

      {/* ── Edit Tenant Modal ─────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CompanyLogo
              domain={tenant.domain}
              name={tenant.name}
              plan={tenant.plan}
              size={28}
              radius="7px"
              isDark={isDarkMode}
            />
            <span style={{ fontWeight: 700, color: tk.textPri }}>
              Edit — {tenant.name}
            </span>
          </div>
        }
        open={editTenantOpen}
        onCancel={() => setEditTenantOpen(false)}
        onOk={handleSaveTenant}
        okText="Save Changes"
        confirmLoading={saving}
        width={560}
        destroyOnClose
      >
        <Form form={tenantForm} layout="vertical" style={{ marginTop: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 16px",
            }}
          >
            <Form.Item
              name="name"
              label="Company Name"
              rules={[{ required: true }]}
            >
              <Input placeholder="Acme Corp" />
            </Form.Item>
            <Form.Item name="domain" label="Domain">
              <Input placeholder="acme.com" />
            </Form.Item>
            <Form.Item name="owner_name" label="Owner Name">
              <Input placeholder="John Smith" />
            </Form.Item>
            <Form.Item
              name="owner_email"
              label="Owner Email"
              rules={[{ type: "email" }]}
            >
              <Input placeholder="john@acme.com" />
            </Form.Item>
            <Form.Item name="plan" label="Plan" rules={[{ required: true }]}>
              <Select placeholder="Select plan">
                {["Enterprise", "Pro", "Starter", "Free"].map((p) => (
                  <Option key={p} value={p}>
                    {p}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select status">
                {["active", "trial", "past_due", "suspended", "inactive"].map(
                  (s) => (
                    <Option key={s} value={s}>
                      {STATUS_CONFIG[s]?.label || s}
                    </Option>
                  ),
                )}
              </Select>
            </Form.Item>
            <Form.Item name="mrr" label="MRR ($)">
              <Input type="number" min={0} placeholder="0" />
            </Form.Item>
            <Form.Item name="max_users" label="Max Users">
              <Input type="number" min={1} placeholder="Unlimited" />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Internal notes…" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Edit User Modal ───────────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {editingUser && (
              <SmartAvatar
                src={
                  editingUser.user_photo?.startsWith("http")
                    ? editingUser.user_photo
                    : null
                }
                name={editingUser.full_name}
                email={editingUser.email}
                size={30}
                radius="8px"
                fontSize={11}
              />
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tk.textPri }}>
                Edit User
              </div>
              {editingUser?.email && (
                <div style={{ fontSize: 11, color: tk.textMuted }}>
                  {editingUser.email}
                </div>
              )}
            </div>
          </div>
        }
        open={editUserOpen}
        onCancel={() => setEditUserOpen(false)}
        onOk={handleSaveUser}
        okText="Save Changes"
        confirmLoading={saving}
        width={520}
        destroyOnClose
      >
        <Form form={userForm} layout="vertical" style={{ marginTop: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 16px",
            }}
          >
            <Form.Item name="full_name" label="Full Name">
              <Input
                prefix={<UserOutlined style={{ color: tk.textMuted }} />}
                placeholder="Jane Doe"
              />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
              <Input
                prefix={<MailOutlined style={{ color: tk.textMuted }} />}
                placeholder="jane@company.com"
              />
            </Form.Item>
            <Form.Item name="job_title" label="Job Title">
              <Input
                prefix={<IdcardOutlined style={{ color: tk.textMuted }} />}
                placeholder="Developer"
              />
            </Form.Item>
            <Form.Item name="department" label="Department">
              <Input
                prefix={<BuildOutlined style={{ color: tk.textMuted }} />}
                placeholder="Engineering"
              />
            </Form.Item>
            <Form.Item name="role" label="Role">
              <Select placeholder="Select role">
                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ color: v.color }}>{v.icon}</span>
                      {v.label}
                    </span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input
                prefix={<PhoneOutlined style={{ color: tk.textMuted }} />}
                placeholder="+1 234 567 8900"
              />
            </Form.Item>
            <Form.Item name="salary_type" label="Salary Type">
              <Select placeholder="Select type" allowClear>
                <Option value="fixed">Fixed</Option>
                <Option value="commission">Commission</Option>
                <Option value="hybrid">Hybrid</Option>
              </Select>
            </Form.Item>
            <Form.Item name="salary_amount" label="Salary">
              <Input
                type="number"
                min={0}
                prefix={<DollarOutlined style={{ color: tk.textMuted }} />}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* ── Grant Override Modal ──────────────────────────────────────────── */}
      <GrantOverrideModal
        open={grantOverrideOpen}
        onClose={() => setGrantOverrideOpen(false)}
        onConfirm={handleGrantOverride}
        currentPlan={tenant.plan}
        saving={overrideSaving}
        isDarkMode={isDarkMode}
        tk={tk}
      />

      {/* ── User Detail Drawer ────────────────────────────────────────────── */}
      <Drawer
        title={null}
        open={userDrawerOpen}
        onClose={() => setUserDrawerOpen(false)}
        width={460}
        styles={{ body: { padding: 0 }, header: { display: "none" } }}
      >
        {viewUser && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <div
              style={{
                background: tk.heroBg,
                borderBottom: `1px solid ${tk.border}`,
                padding: "24px 24px 20px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative" }}>
                    <SmartAvatar
                      src={
                        viewUser.user_photo?.startsWith("http")
                          ? viewUser.user_photo
                          : null
                      }
                      name={viewUser.full_name}
                      email={viewUser.email}
                      size={60}
                      radius="15px"
                      fontSize={20}
                      style={{
                        border: `3px solid ${viewUser.suspended ? tk.red + "60" : tk.green + "60"}`,
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: -3,
                        right: -3,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: viewUser.suspended ? tk.red : tk.green,
                        border: `3px solid ${isDarkMode ? "#1e293b" : "#f0f9ff"}`,
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: tk.textPri,
                        lineHeight: 1.2,
                      }}
                    >
                      {viewUser.full_name || (
                        <span style={{ color: tk.textMuted, fontWeight: 400 }}>
                          No name
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: tk.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {viewUser.email}
                    </div>
                    {(viewUser.job_title || viewUser.department) && (
                      <div
                        style={{
                          fontSize: 12,
                          color: tk.textMuted,
                          marginTop: 1,
                        }}
                      >
                        {[viewUser.job_title, viewUser.department]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        marginTop: 9,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: viewUser.suspended
                            ? `${tk.red}18`
                            : `${tk.green}18`,
                          color: viewUser.suspended ? tk.red : tk.green,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: viewUser.suspended ? tk.red : tk.green,
                            display: "inline-block",
                          }}
                        />
                        {viewUser.suspended ? "Suspended" : "Active"}
                      </span>
                      {viewUser.role &&
                        (() => {
                          const cfg =
                            ROLE_CONFIG[viewUser.role] || ROLE_CONFIG.member;
                          return (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: 20,
                                background: isDarkMode ? cfg.darkBg : cfg.bg,
                                color: cfg.color,
                              }}
                            >
                              <span style={{ fontSize: 10 }}>{cfg.icon}</span>
                              {cfg.label}
                            </span>
                          );
                        })()}
                    </div>
                  </div>
                </div>
                <Button
                  type="primary"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setUserDrawerOpen(false);
                    openEditUser(viewUser);
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                <div>
                  <SectionHeader label="Employment" tk={tk} />
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    {[
                      {
                        label: "Salary",
                        value: fmtCurrency(
                          viewUser.salary_amount,
                          viewUser.currency,
                        ),
                        color: tk.green,
                      },
                      {
                        label: "Salary Type",
                        value: viewUser.salary_type
                          ? viewUser.salary_type.charAt(0).toUpperCase() +
                            viewUser.salary_type.slice(1)
                          : "—",
                        color: tk.amber,
                      },
                      {
                        label: "Hours / Week",
                        value: viewUser.working_hours
                          ? `${viewUser.working_hours}h`
                          : "—",
                        color: tk.purple,
                      },
                    ].map((item) => (
                      <StatTile key={item.label} {...item} tk={tk} />
                    ))}
                  </div>
                </div>

                <div>
                  <SectionHeader label="Contact & Personal" tk={tk} />
                  <div
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${tk.border}`,
                      overflow: "hidden",
                    }}
                  >
                    {[
                      {
                        icon: <MailOutlined />,
                        label: "Email",
                        value: viewUser.email,
                      },
                      {
                        icon: <PhoneOutlined />,
                        label: "Phone",
                        value: viewUser.phone || viewUser.contact,
                      },
                      {
                        icon: <CalendarOutlined />,
                        label: "Date of Birth",
                        value: fmtDate(viewUser.dob),
                      },
                      {
                        icon: <IdcardOutlined />,
                        label: "CNIC",
                        value: viewUser.cnic,
                        mono: true,
                      },
                      {
                        icon: <CodeOutlined />,
                        label: "GitHub",
                        value: viewUser.github_username
                          ? `@${viewUser.github_username}`
                          : null,
                      },
                      {
                        icon: <CalendarOutlined />,
                        label: "Joined",
                        value: fmtDate(viewUser.created_at),
                      },
                      {
                        icon: <ClockCircleOutlined />,
                        label: "Last Updated",
                        value: timeAgo(viewUser.updated_at),
                      },
                    ]
                      .filter((r) => r.value)
                      .map((row, i, arr) => (
                        <InfoRow
                          key={row.label}
                          {...row}
                          tk={tk}
                          last={i === arr.length - 1}
                        />
                      ))}
                  </div>
                </div>

                {viewUser.bio && (
                  <div>
                    <SectionHeader label="Bio" tk={tk} />
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: tk.statBg,
                        border: `1px solid ${tk.border}`,
                        color: tk.textSec,
                      }}
                    >
                      {viewUser.bio}
                    </div>
                  </div>
                )}

                {(viewUser.bank_name || viewUser.bank_account_number) && (
                  <div>
                    <SectionHeader label="Bank Details" tk={tk} />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: tk.statBg,
                        border: `1px solid ${tk.border}`,
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          flexShrink: 0,
                          background: `${tk.green}15`,
                          color: tk.green,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                        }}
                      >
                        <BankOutlined />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: tk.textPri,
                          }}
                        >
                          {viewUser.bank_name || "—"}
                          {viewUser.bank_account_name && (
                            <span
                              style={{
                                fontWeight: 400,
                                color: tk.textMuted,
                              }}
                            >
                              {" "}
                              · {viewUser.bank_account_name}
                            </span>
                          )}
                        </div>
                        {viewUser.bank_account_number && (
                          <div
                            style={{
                              fontSize: 12,
                              fontFamily: "monospace",
                              color: tk.textMuted,
                            }}
                          >
                            {viewUser.bank_account_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <SectionHeader label="System IDs" tk={tk} />
                  <Tooltip title="Click to copy">
                    <div
                      style={{
                        fontSize: 11,
                        fontFamily: "monospace",
                        padding: "7px 10px",
                        borderRadius: 8,
                        background: tk.statBg,
                        border: `1px solid ${tk.border}`,
                        color: tk.textSec,
                        cursor: "pointer",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(viewUser.id);
                        messageApi.success("ID copied");
                      }}
                    >
                      {viewUser.id}
                    </div>
                  </Tooltip>
                </div>

                <Divider style={{ borderColor: tk.divider, margin: 0 }} />

                <div style={{ paddingBottom: 8 }}>
                  <SectionHeader label="Quick Actions" tk={tk} />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {viewUser.suspended ? (
                      <Button
                        block
                        icon={<UnlockOutlined />}
                        style={{
                          borderColor: tk.green,
                          color: tk.green,
                          height: 38,
                        }}
                        onClick={() => {
                          handleUserSuspend(viewUser.id, false);
                          setUserDrawerOpen(false);
                        }}
                      >
                        Activate User
                      </Button>
                    ) : (
                      <Popconfirm
                        title="Suspend this user?"
                        description="They will lose access immediately."
                        onConfirm={() => {
                          handleUserSuspend(viewUser.id, true);
                          setUserDrawerOpen(false);
                        }}
                        okText="Suspend"
                        okType="danger"
                      >
                        <Button
                          danger
                          block
                          icon={<LockOutlined />}
                          style={{ height: 38 }}
                        >
                          Suspend User
                        </Button>
                      </Popconfirm>
                    )}
                    <Popconfirm
                      title="Delete this user?"
                      description="This cannot be undone."
                      onConfirm={() => handleDeleteUser(viewUser.id)}
                      okText="Delete"
                      okType="danger"
                    >
                      <Button
                        danger
                        block
                        icon={<DeleteOutlined />}
                        type="text"
                        style={{ height: 38 }}
                      >
                        Delete User
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TenantDetailPage;
