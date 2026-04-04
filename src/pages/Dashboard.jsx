import { useEffect, useState, useCallback } from "react";
import { Modal, Checkbox, Input, DatePicker, Select, Tooltip } from "antd";
const { TextArea } = Input;
import {
  FolderOpen,
  Users,
  UsersRound,
  Bell,
  TrendingUp,
  Zap,
  Clock,
  Play,
  Pause,
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Eye,
  Globe,
  ChevronRight,
  MoreHorizontal,
  Circle,
  X,
  ArrowRight,
  Gift,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import ClientWorldMap from "../components/ClientWorldMap";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
dayjs.extend(relativeTime);
dayjs.extend(isToday);

/* ── Google Fonts ─────────────────────────────────────────────────────────── */
if (!document.getElementById("dash-fonts")) {
  const link = document.createElement("link");
  link.id = "dash-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(link);
}

/* ── CSS ──────────────────────────────────────────────────────────────────── */
if (!document.getElementById("dash-css")) {
  const s = document.createElement("style");
  s.id = "dash-css";
  s.textContent = `
    @keyframes fadeIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes shimmer {
      0%   { background-position: -600px 0; }
      100% { background-position:  600px 0; }
    }
    @keyframes bannerPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
    @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes bannerFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    @keyframes stripeDrift { from{background-position:0 0} to{background-position:60px 60px} }
    @keyframes dotBlink    { 0%,100%{opacity:1} 50%{opacity:0.3} }

    .d-fade  { animation: fadeIn 0.4s ease both; }
    .d-row:hover  { background: var(--d-hover) !important; cursor: pointer; }
    .d-todo:hover { background: var(--d-hover) !important; }
    .d-meet:hover { background: var(--d-hover) !important; }
    .d-emp:hover  { box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important; transform: translateY(-1px); }
    .d-emp { transition: box-shadow 0.2s, transform 0.2s; }
    .d-btn:hover { opacity: 0.85; transform: scale(1.02); }
    .d-btn { transition: opacity 0.15s, transform 0.15s; }
    .d-icon-btn:hover { background: var(--d-hover) !important; }
    .d-icon-btn { transition: background 0.15s; }

    /* ── Skeleton shimmer ── */
    .skel {
      border-radius: 6px;
      background: linear-gradient(
        90deg,
        var(--d-skel-base)  25%,
        var(--d-skel-shine) 50%,
        var(--d-skel-base)  75%
      );
      background-size: 600px 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }

    /* ── Banner ── */
    .d-banner         { animation: slideDown 0.45s ease both; }
    .banner-illo      { animation: bannerFloat 3.5s ease-in-out infinite; }
    .banner-cta:hover { background: rgba(255,255,255,0.22) !important; transform: translateX(2px); }
    .banner-cta       { transition: background 0.15s, transform 0.15s; }
    .banner-close:hover { opacity:0.6; }
    .banner-close     { transition: opacity 0.15s; }

    .d-dark .ant-modal-content,
    .d-dark .ant-modal-header,
    .d-dark .ant-modal-footer {
      background: var(--d-card) !important;
      border-color: var(--d-border) !important;
      color: var(--d-text) !important;
    }
    .d-dark .ant-modal-title {
      color: var(--d-text) !important;
    }
    .d-dark .ant-input,
    .d-dark .ant-input-affix-wrapper,
    .d-dark .ant-select-selector,
    .d-dark .ant-picker,
    .d-dark .ant-input-textarea textarea {
      background: var(--d-card2) !important;
      border-color: var(--d-border) !important;
      color: var(--d-text) !important;
    }
    .d-dark .ant-input::placeholder,
    .d-dark .ant-input-textarea textarea::placeholder,
    .d-dark .ant-select-selection-placeholder,
    .d-dark .ant-select-arrow,
    .d-dark .ant-picker-suffix,
    .d-dark .ant-picker-clear {
      color: var(--d-muted) !important;
    }
    .d-popup-dark.ant-select-dropdown,
    .d-popup-dark.ant-picker-dropdown .ant-picker-panel-container {
      background: var(--d-card) !important;
      border: 1px solid var(--d-border) !important;
    }
    .d-popup-dark.ant-select-dropdown .ant-select-item {
      color: var(--d-text) !important;
    }
    .d-popup-dark.ant-select-dropdown .ant-select-item-option-active,
    .d-popup-dark.ant-select-dropdown .ant-select-item-option-selected {
      background: var(--d-hover) !important;
    }
    .d-popup-dark.ant-picker-dropdown .ant-picker-header,
    .d-popup-dark.ant-picker-dropdown .ant-picker-content th {
      color: var(--d-muted) !important;
      border-color: var(--d-border) !important;
    }
    .d-popup-dark.ant-picker-dropdown .ant-picker-cell-inner {
      color: var(--d-text) !important;
    }
  `;
  document.head.appendChild(s);
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const fmtTime = (s) => {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
const getBreakSeconds = (log, nowMs) => {
  if (!Array.isArray(log?.breaks) || log.breaks.length === 0) return 0;
  return log.breaks.reduce((acc, br) => {
    if (!br?.pause_time) return acc;
    const st = new Date(br.pause_time).getTime();
    if (!Number.isFinite(st)) return acc;
    const en = br.resume_time ? new Date(br.resume_time).getTime() : nowMs;
    if (!Number.isFinite(en) || en <= st) return acc;
    return acc + Math.floor((en - st) / 1000);
  }, 0);
};
const getElapsed = (log) => {
  const nowMs = Date.now();
  if (log.status === "active" || log.status === "break" || log.status === "paused") {
    const startMs = new Date(log.start_time).getTime();
    const derived = Number.isFinite(startMs)
      ? Math.max(
          0,
          Math.floor((nowMs - startMs) / 1000) - getBreakSeconds(log, nowMs),
        )
      : 0;
    if (log.status === "paused") {
      const fromTotal = Math.floor((log.total_hours || 0) * 3600);
      return Math.max(fromTotal, derived);
    }
    return Math.max(
      0,
      Math.floor((nowMs - startMs) / 1000) - getBreakSeconds(log, nowMs),
    );
  }
  return 0;
};
const initials = (name = "") => {
  const p = name.trim().split(" ").filter(Boolean);
  return p.length >= 2
    ? `${p[0][0]}${p[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase() || "??";
};
const avatarBg = (name = "") => {
  const list = [
    "#3b82f6",
    "#8b5cf6",
    "#10b981",
    "#f97316",
    "#ec4899",
    "#06b6d4",
    "#f59e0b",
    "#6366f1",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return list[Math.abs(h) % list.length];
};

/* ── Avatar ───────────────────────────────────────────────────────────────── */
const Ava = ({ name = "", photo, size = 34 }) => {
  const [err, setErr] = useState(false);
  const bg = avatarBg(name);
  if (photo && !err)
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: bg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(9, size * 0.33),
        fontWeight: 700,
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      {initials(name)}
    </div>
  );
};

/* ── Live Timer ───────────────────────────────────────────────────────────── */
const LiveTimer = ({ log }) => {
  const [elapsed, setElapsed] = useState(() => getElapsed(log));
  useEffect(() => {
    setElapsed(getElapsed(log));
  }, [log]);
  useEffect(() => {
    if (log.status !== "active") return;
    const id = setInterval(() => setElapsed(getElapsed(log)), 1000);
    return () => clearInterval(id);
  }, [log]);
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {fmtTime(elapsed)}
    </span>
  );
};

/* ── Pill badge ───────────────────────────────────────────────────────────── */
const Pill = ({ label, color, bg }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 99,
      background: bg,
      color,
      fontFamily: "'DM Sans',sans-serif",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

/* ── Modal field label ────────────────────────────────────────────────────── */
const FL = ({ children, req }) => (
  <div
    style={{
      fontSize: 12,
      fontWeight: 600,
      color: "var(--d-muted)",
      marginBottom: 5,
      fontFamily: "'DM Sans',sans-serif",
    }}
  >
    {children}
    {req && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
  </div>
);

/* ── Small Add Button ─────────────────────────────────────────────────────── */
const AddButton = ({ label, onClick }) => (
  <button
    className="d-btn"
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 5,
      padding: "6px 12px",
      borderRadius: 8,
      background: "var(--d-accent)",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
      fontFamily: "'DM Sans',sans-serif",
    }}
  >
    <Plus size={13} />
    {label}
  </button>
);

/* ── Card shell ───────────────────────────────────────────────────────────── */
const Panel = ({ children, style = {}, className = "" }) => (
  <div
    className={className}
    style={{
      background: "var(--d-card)",
      border: "1px solid var(--d-border)",
      borderRadius: 14,
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
);

/* ── Panel header ─────────────────────────────────────────────────────────── */
const PHead = ({ icon: Icon, title, sub, right, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 18px",
      borderBottom: "1px solid var(--d-border)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Icon size={16} color={color || "var(--d-accent)"} strokeWidth={2} />
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--d-text)",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {title}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "var(--d-muted)", marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
    {right}
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   ── SKELETON COMPONENTS ────────────────────────────────────────────────── */

const Skel = ({ w = "100%", h = 14, radius = 6, style = {} }) => (
  <div
    className="skel"
    style={{
      width: w,
      height: h,
      borderRadius: radius,
      flexShrink: 0,
      ...style,
    }}
  />
);

const KpiSkeleton = () => (
  <div
    style={{
      background: "var(--d-card)",
      border: "1px solid var(--d-border)",
      borderRadius: 12,
      padding: "18px 20px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <Skel w={16} h={16} radius={4} />
    </div>
    <Skel w="55%" h={28} radius={6} style={{ marginBottom: 8 }} />
    <Skel w="65%" h={13} radius={4} style={{ marginBottom: 5 }} />
    <Skel w="45%" h={11} radius={4} />
  </div>
);

const EmpSkeleton = () => (
  <div
    style={{
      padding: "14px 16px",
      borderRadius: 10,
      background: "var(--d-card2)",
      border: "1px solid var(--d-border)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
      }}
    >
      <Skel w={36} h={36} radius={99} />
      <div style={{ flex: 1 }}>
        <Skel w="70%" h={13} radius={4} style={{ marginBottom: 6 }} />
        <Skel w="40%" h={11} radius={4} />
      </div>
    </div>
    <Skel w="50%" h={13} radius={4} style={{ marginBottom: 10 }} />
    <Skel w="100%" h={28} radius={7} />
  </div>
);

const ProjectRowSkeleton = ({ last }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 18px",
      borderBottom: last ? "none" : "1px solid var(--d-border)",
    }}
  >
    <div style={{ flex: 1 }}>
      <Skel w="55%" h={13} radius={4} style={{ marginBottom: 6 }} />
      <Skel w="35%" h={11} radius={4} />
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <Skel w={50} h={11} radius={4} />
      <Skel w={72} h={20} radius={99} />
    </div>
  </div>
);

const TodoSkeleton = () => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      padding: "10px 8px",
      borderRadius: 8,
      marginBottom: 2,
    }}
  >
    <Skel w={16} h={16} radius={4} style={{ marginTop: 2, flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          marginBottom: 5,
        }}
      >
        <Skel w="50%" h={13} radius={4} />
        <Skel w={48} h={18} radius={99} />
      </div>
      <Skel w="30%" h={11} radius={4} />
    </div>
  </div>
);

const MeetingSkeleton = () => (
  <div style={{ padding: "12px 10px", borderRadius: 8, marginBottom: 6 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <Skel w="55%" h={13} radius={4} />
          <Skel w={40} h={18} radius={99} />
        </div>
        <Skel w="45%" h={12} radius={4} style={{ marginBottom: 5 }} />
        <Skel w="65%" h={11} radius={4} />
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════
   ── CARTOON ILLUSTRATIONS ──────────────────────────────────────────────── */

const RocketSVG = () => (
  <svg
    width="110"
    height="100"
    viewBox="0 0 110 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <ellipse cx="55" cy="87" rx="7" ry="11" fill="#FCD34D" opacity="0.9" />
    <ellipse cx="55" cy="90" rx="4" ry="7" fill="#F97316" opacity="0.95" />
    <ellipse cx="49" cy="85" rx="4" ry="8" fill="#FCD34D" opacity="0.7" />
    <ellipse cx="61" cy="85" rx="4" ry="8" fill="#FCD34D" opacity="0.7" />
    <rect
      x="43"
      y="38"
      width="24"
      height="36"
      rx="4"
      fill="#fff"
      opacity="0.95"
    />
    <path d="M43 42 Q55 12 67 42 Z" fill="#f87171" />
    <circle cx="55" cy="52" r="7" fill="#bfdbfe" />
    <circle cx="55" cy="52" r="5" fill="#93c5fd" />
    <circle cx="53" cy="50" r="1.5" fill="#fff" opacity="0.8" />
    <path d="M43 60 L33 74 L43 70 Z" fill="#fb923c" />
    <path d="M67 60 L77 74 L67 70 Z" fill="#fb923c" />
    <circle cx="22" cy="30" r="2" fill="#fde68a" />
    <circle cx="88" cy="22" r="1.5" fill="#fde68a" />
    <circle cx="15" cy="55" r="1.5" fill="#fde68a" opacity="0.7" />
    <circle cx="95" cy="48" r="2" fill="#fde68a" opacity="0.8" />
    <circle cx="30" cy="18" r="1" fill="#fff" opacity="0.6" />
    <circle cx="80" cy="65" r="1" fill="#fff" opacity="0.5" />
    <path
      d="M20 70 L22 66 L24 70 L28 72 L24 74 L22 78 L20 74 L16 72 Z"
      fill="#fde68a"
      opacity="0.8"
    />
    <path
      d="M85 30 L86.5 27 L88 30 L91 31.5 L88 33 L86.5 36 L85 33 L82 31.5 Z"
      fill="#fde68a"
      opacity="0.9"
    />
  </svg>
);

const TeamSVG = () => (
  <svg
    width="120"
    height="100"
    viewBox="0 0 120 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <rect
      x="58"
      y="6"
      width="52"
      height="22"
      rx="8"
      fill="#fff"
      opacity="0.9"
    />
    <path d="M70 28 L66 35 L76 28 Z" fill="#fff" opacity="0.9" />
    <text
      x="84"
      y="21"
      textAnchor="middle"
      fontSize="11"
      fontWeight="700"
      fill="#6d28d9"
      fontFamily="'DM Sans',sans-serif"
    >
      Let's go!
    </text>
    <circle cx="22" cy="38" r="12" fill="#fbbf24" />
    <circle cx="18" cy="35" r="2" fill="#92400e" />
    <circle cx="26" cy="35" r="2" fill="#92400e" />
    <path
      d="M18 43 Q22 47 26 43"
      stroke="#92400e"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <rect x="12" y="52" width="20" height="26" rx="6" fill="#6d28d9" />
    <rect x="8" y="54" width="6" height="18" rx="3" fill="#6d28d9" />
    <rect x="26" y="54" width="6" height="18" rx="3" fill="#6d28d9" />
    <rect x="13" y="76" width="7" height="12" rx="3" fill="#fbbf24" />
    <rect x="24" y="76" width="7" height="12" rx="3" fill="#fbbf24" />
    <circle cx="60" cy="34" r="13" fill="#f9a8d4" />
    <circle cx="55" cy="31" r="2" fill="#9d174d" />
    <circle cx="65" cy="31" r="2" fill="#9d174d" />
    <path
      d="M55 39 Q60 44 65 39"
      stroke="#9d174d"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M47 28 Q60 16 73 28"
      stroke="#92400e"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    <rect x="50" y="48" width="20" height="26" rx="6" fill="#ec4899" />
    <rect x="46" y="50" width="6" height="18" rx="3" fill="#ec4899" />
    <rect x="68" y="50" width="6" height="18" rx="3" fill="#ec4899" />
    <rect x="51" y="72" width="7" height="12" rx="3" fill="#f9a8d4" />
    <rect x="62" y="72" width="7" height="12" rx="3" fill="#f9a8d4" />
    <circle cx="98" cy="38" r="12" fill="#6ee7b7" />
    <circle cx="94" cy="35" r="2" fill="#065f46" />
    <circle cx="102" cy="35" r="2" fill="#065f46" />
    <path
      d="M94 43 Q98 47 102 43"
      stroke="#065f46"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <rect x="88" y="52" width="20" height="26" rx="6" fill="#059669" />
    <rect x="84" y="54" width="6" height="18" rx="3" fill="#059669" />
    <rect x="102" y="54" width="6" height="18" rx="3" fill="#059669" />
    <rect x="89" y="76" width="7" height="12" rx="3" fill="#6ee7b7" />
    <rect x="100" y="76" width="7" height="12" rx="3" fill="#6ee7b7" />
  </svg>
);

const TimeSVG = () => (
  <svg
    width="110"
    height="100"
    viewBox="0 0 110 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <circle cx="52" cy="50" r="38" fill="#fff" opacity="0.15" />
    <circle cx="52" cy="50" r="34" fill="#fff" opacity="0.9" />
    <circle cx="52" cy="50" r="28" fill="#e0f2fe" />
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
      const r1 = i % 3 === 0 ? 21 : 23,
        r2 = 26;
      const rad = ((deg - 90) * Math.PI) / 180;
      return (
        <line
          key={deg}
          x1={52 + r1 * Math.cos(rad)}
          y1={50 + r1 * Math.sin(rad)}
          x2={52 + r2 * Math.cos(rad)}
          y2={50 + r2 * Math.sin(rad)}
          stroke="#0284c7"
          strokeWidth={i % 3 === 0 ? 2 : 1}
          strokeLinecap="round"
        />
      );
    })}
    <line
      x1="52"
      y1="50"
      x2="52"
      y2="34"
      stroke="#0c4a6e"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      x1="52"
      y1="50"
      x2="64"
      y2="44"
      stroke="#0284c7"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="52" cy="50" r="3" fill="#0c4a6e" />
    <circle cx="45" cy="48" r="2" fill="#0c4a6e" />
    <circle cx="59" cy="48" r="2" fill="#0c4a6e" />
    <path
      d="M45 56 Q52 62 59 56"
      stroke="#0c4a6e"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <line
      x1="76"
      y1="22"
      x2="96"
      y2="8"
      stroke="#fbbf24"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <rect x="90" y="4" width="12" height="8" rx="3" fill="#fbbf24" />
    <circle cx="74" cy="18" r="2" fill="#fde68a" />
    <circle cx="82" cy="12" r="1.5" fill="#fde68a" />
    <circle cx="98" cy="20" r="1.5" fill="#fde68a" opacity="0.8" />
    <path
      d="M68 8 L70 4 L72 8 L76 10 L72 12 L70 16 L68 12 L64 10 Z"
      fill="#fde68a"
    />
    <line
      x1="40"
      y1="84"
      x2="36"
      y2="96"
      stroke="#0c4a6e"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <line
      x1="64"
      y1="84"
      x2="68"
      y2="96"
      stroke="#0c4a6e"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <ellipse cx="34" cy="97" rx="5" ry="3" fill="#0c4a6e" />
    <ellipse cx="70" cy="97" rx="5" ry="3" fill="#0c4a6e" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════════
   ── BANNER CONFIG ──────────────────────────────────────────────────────── */
const BANNERS = [
  {
    id: "launch-fast",
    bg: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1e40af 100%)",
    stripeA: "#2563eb",
    stripeB: "#1d4ed8",
    tag: "🚀  What's new",
    tagColor: "#93c5fd",
    title: "Projects just got a turbo boost",
    body: "Smart auto-assignment now matches tasks to the right teammate instantly. No more back-and-forth.",
    cta: "See what's new",
    Illustration: RocketSVG,
  },
  {
    id: "team-power",
    bg: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #312e81 100%)",
    stripeA: "#3730a3",
    stripeB: "#1e3a8a",
    tag: "👥  Team feature",
    tagColor: "#a5b4fc",
    title: "Better together — invite your crew",
    body: "Shared dashboards, live standups, and group meetings. Your whole team in one place.",
    cta: "Add teammates",
    Illustration: TeamSVG,
  },
  {
    id: "time-magic",
    bg: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0c4a6e 100%)",
    stripeA: "#1e40af",
    stripeB: "#075985",
    tag: "⏱  Pro tip",
    tagColor: "#7dd3fc",
    title: "Time tracking that works like magic",
    body: "One-click timers, daily standups, and automatic summaries. Know exactly where every hour goes.",
    cta: "Start tracking",
    Illustration: TimeSVG,
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   ── PRODUCT BANNER (auto-rotating, lucide icons) ───────────────────────── */
const ProductBanner = ({ dark }) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dash-dismissed-banners") || "[]");
    } catch {
      return [];
    }
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const available = BANNERS.filter((b) => !dismissed.includes(b.id));

  /* Auto-rotate every 5 seconds */
  useEffect(() => {
    if (available.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % available.length);
    }, 5000);
    return () => clearInterval(id);
  }, [available.length]);

  const dismiss = (id) => {
    const next = [...dismissed, id];
    localStorage.setItem("dash-dismissed-banners", JSON.stringify(next));
    setDismissed(next);
    setActiveIndex(0);
  };

  if (available.length === 0) return null;

  const safeIndex = activeIndex % available.length;
  const {
    id,
    bg,
    stripeA,
    stripeB,
    tag,
    tagColor,
    title,
    body,
    cta,
    Illustration,
  } = available[safeIndex];

  return (
    <div
      className="d-banner"
      style={{
        marginBottom: 20,
        borderRadius: 16,
        overflow: "hidden",
        background: bg,
        position: "relative",
        isolation: "isolate",
      }}
    >
      {/* Animated diagonal stripe pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            ${stripeA}22 0px, ${stripeA}22 20px,
            transparent 20px, transparent 40px,
            ${stripeB}18 40px, ${stripeB}18 60px,
            transparent 60px, transparent 80px
          )`,
          backgroundSize: "113px 113px",
          animation: "stripeDrift 8s linear infinite",
        }}
      />

      {/* Soft radial glow */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 220,
          height: "100%",
          background: `radial-gradient(ellipse at 80% 50%, ${stripeA}55 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px 28px 24px",
          gap: 12,
        }}
      >
        {/* Text block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 7,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: tagColor,
                fontFamily: "'DM Sans',sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              {tag}
            </span>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: tagColor,
                opacity: 0.7,
                animation: "dotBlink 2s ease-in-out infinite",
                display: "inline-block",
              }}
            />
          </div>

          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: "#fff",
              marginBottom: 5,
              fontFamily: "'DM Sans',sans-serif",
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 12.5,
              color: "rgba(255,255,255,0.68)",
              fontFamily: "'DM Sans',sans-serif",
              lineHeight: 1.55,
              maxWidth: 400,
              marginBottom: 14,
            }}
          >
            {body}
          </div>

          {/* CTA with Lucide ArrowRight */}
          <button
            className="banner-cta"
            style={{
              padding: "7px 16px",
              borderRadius: 9,
              background: "rgba(255,255,255,0.14)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.22)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {cta}
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Illustration + close */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <button
            className="banner-close"
            onClick={() => dismiss(id)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.75)",
              alignSelf: "flex-end",
            }}
          >
            <X size={12} />
          </button>
          <div className="banner-illo">
            <Illustration />
          </div>
        </div>
      </div>

      {/* Progress dots — clickable */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 24,
          display: "flex",
          gap: 5,
        }}
      >
        {available.map((b, i) => (
          <div
            key={b.id}
            onClick={() => setActiveIndex(i)}
            style={{
              width: i === safeIndex ? 16 : 5,
              height: 5,
              borderRadius: 99,
              background: i === safeIndex ? "#fff" : "rgba(255,255,255,0.25)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
};

const BirthdayWidget = ({ tenantId, dark }) => {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setBdLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    const fetchBirthdays = async () => {
      setBdLoading(true);
      try {
        const today = dayjs();
        const currentMonth = today.month() + 1;

        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, user_photo, dob")
          .eq("tenant_id", tenantId)
          .eq("role", "employee")
          .not("dob", "is", null);

        const birthdaysThisMonth = (data || [])
          .filter((p) => {
            const dob = dayjs(p.dob);
            return dob.isValid() && dob.month() + 1 === currentMonth;
          })
          .sort((a, b) => {
            const todayDate = today.date();

            const aDay = dayjs(a.dob).date();
            const bDay = dayjs(b.dob).date();

            const aDiff = aDay >= todayDate ? aDay : aDay + 31;
            const bDiff = bDay >= todayDate ? bDay : bDay + 31;

            return aDiff - bDiff;
          });

        setBirthdays(birthdaysThisMonth);
      } catch (e) {
        console.error(e);
      } finally {
        setBdLoading(false);
      }
    };

    fetchBirthdays();
  }, [tenantId]);

  const todayDay = dayjs().date();
  const monthName = dayjs().format("MMMM");

  return (
    <Panel style={{ height: "100%" }}>
      <PHead
        icon={Gift}
        title="Birthdays This Month"
        color="#ec4899"
        sub={loading ? "Loading…" : `${birthdays.length} in ${monthName}`}
      />
      <div style={{ maxHeight: 320, overflowY: "auto", padding: "10px 14px" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              paddingTop: 4,
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <Skel w={36} h={36} radius={99} />
                <div style={{ flex: 1 }}>
                  <Skel w="60%" h={13} radius={4} style={{ marginBottom: 6 }} />
                  <Skel w="35%" h={11} radius={4} />
                </div>
              </div>
            ))}
          </div>
        ) : birthdays.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "36px 0",
              color: "var(--d-muted)",
              fontSize: 13,
            }}
          >
            No birthdays this month
          </div>
        ) : (
          birthdays.map((p) => {
            const dob = dayjs(p.dob);
            const isToday = dob.date() === todayDay;
            const isPast = dob.date() < todayDay;
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 8px",
                  borderRadius: 9,
                  marginBottom: 4,
                  background: isToday
                    ? dark
                      ? "rgba(236,72,153,0.12)"
                      : "#fdf2f8"
                    : "transparent",
                  border: isToday
                    ? `1px solid ${dark ? "rgba(236,72,153,0.25)" : "#fbcfe8"}`
                    : "1px solid transparent",
                }}
              >
                <Ava name={p.full_name} photo={p.user_photo} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
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
                        fontSize: 13,
                        fontWeight: 600,
                        color:
                          isPast && !isToday
                            ? "var(--d-muted)"
                            : "var(--d-text)",
                      }}
                    >
                      {p.full_name}
                    </span>
                    {isToday && (
                      <Pill
                        label="🎂 Today!"
                        color="#be185d"
                        bg={dark ? "rgba(236,72,153,0.2)" : "#fce7f3"}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--d-muted)",
                      marginTop: 2,
                    }}
                  >
                    {dob.format("MMMM D")}
                    {isToday && " · Happy Birthday! 🎉"}
                  </div>
                </div>
                {isToday && (
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🎈</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
};

const Dashboard = () => {
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem("themeMode") || "system",
  );
  const dark =
    themeMode === "dark" ||
    (themeMode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const sync = () =>
      setThemeMode(localStorage.getItem("themeMode") || "system");
    window.addEventListener("storage", sync);
    const iv = setInterval(sync, 400);
    return () => {
      window.removeEventListener("storage", sync);
      clearInterval(iv);
    };
  }, []);

  useEffect(() => {
    const r = document.documentElement;
    if (dark) {
      r.style.setProperty("--d-bg", "#141416");
      r.style.setProperty("--d-card", "#1a1b1f");
      r.style.setProperty("--d-card2", "#17181c");
      r.style.setProperty("--d-border", "#2a2b31");
      r.style.setProperty("--d-text", "#f3f4f6");
      r.style.setProperty("--d-sub", "#d1d5db");
      r.style.setProperty("--d-muted", "#9ca3af");
      r.style.setProperty("--d-hover", "#202127");
      r.style.setProperty("--d-accent", "#3b82f6");
      r.style.setProperty("--d-skel-base", "#202127");
      r.style.setProperty("--d-skel-shine", "#2a2b31");
    } else {
      r.style.setProperty("--d-bg", "#f8fafc");
      r.style.setProperty("--d-card", "#ffffff");
      r.style.setProperty("--d-card2", "#f8fafc");
      r.style.setProperty("--d-border", "#e8ecf0");
      r.style.setProperty("--d-text", "#0f1923");
      r.style.setProperty("--d-sub", "#64748b");
      r.style.setProperty("--d-muted", "#94a3b8");
      r.style.setProperty("--d-hover", "#f1f5f9");
      r.style.setProperty("--d-accent", "#1e3a8a");
      r.style.setProperty("--d-skel-base", "#e8ecf0");
      r.style.setProperty("--d-skel-shine", "#f1f5f9");
    }
  }, [dark]);

  /* ── state ── */
  const [tenantId, setTenantId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [empLoading, setEmpLoading] = useState(true);
  const [todoLoading, setTodoLoading] = useState(true);
  const [meetLoading, setMeetLoading] = useState(true);

  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalEmployees: 0,
    totalTeams: 0,
    pendingRequests: 0,
    inProgressLeads: 0,
  });
  const [projects, setProjects] = useState([]);
  const [countries, setCountries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [todos, setTodos] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [standupModal, setStandupModal] = useState(false);
  const [standupData, setStandupData] = useState(null);
  const [todoModal, setTodoModal] = useState(false);
  const [meetModal, setMeetModal] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: null,
  });
  const [newMeet, setNewMeet] = useState({
    title: "",
    meeting_date: null,
    description: "",
    email_reminders: [],
    attendee_type: "individual",
    attendee_emails: [],
  });

  /* ── bootstrap ── */
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("id,full_name,email,role,tenant_id,user_photo")
          .eq("id", user.id)
          .single();
        setCurrentUser({ ...user, ...profile });
        setTenantId(profile?.tenant_id ?? null);
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (tenantId === null) return;
    fetchStats();
    fetchEmployees();
    fetchAdmins();
    const iv = setInterval(fetchEmployees, 30000);
    return () => clearInterval(iv);
  }, [tenantId]);

  useEffect(() => {
    if (currentUser?.id && tenantId) {
      fetchTodos();
      fetchMeetings();
    }
  }, [currentUser?.id, tenantId]);

  /* ── fetchers ── */
  const fetchStats = async () => {
    setLoading(true);
    try {
      const tid = tenantId;
      const [pR, eR, tR, rR, lR] = await Promise.all([
        supabase
          .from("projects")
          .select("*", { count: "exact" })
          .eq("tenant_id", tid),
        supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .eq("tenant_id", tid)
          .eq("role", "employee"),
        supabase
          .from("teams")
          .select("*", { count: "exact" })
          .eq("tenant_id", tid),
        supabase
          .from("requests")
          .select("*", { count: "exact" })
          .eq("tenant_id", tid)
          .eq("status", "pending"),
        supabase
          .from("leads")
          .select("*", { count: "exact" })
          .eq("tenant_id", tid)
          .eq("status", "in_progress"),
      ]);
      const active =
        pR.data?.filter((p) => p.status === "in_progress").length || 0;
      setStats({
        totalProjects: pR.count || 0,
        activeProjects: active,
        totalEmployees: eR.count || 0,
        totalTeams: tR.count || 0,
        pendingRequests: rR.count || 0,
        inProgressLeads: lR.count || 0,
      });
      setProjects(
        [...(pR.data || [])]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5),
      );
      const ctry = (pR.data || [])
        .filter((p) => p.client_country)
        .reduce((acc, p) => {
          const ex = acc.find((c) => c.country === p.client_country);
          ex ? ex.count++ : acc.push({ country: p.client_country, count: 1 });
          return acc;
        }, [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setCountries(ctry);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setEmpLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("time_logs")
        .select("*, profiles(full_name,email,user_photo,tenant_id)")
        .eq("date", today)
        .in("status", ["active", "break", "paused"]);
      setEmployees(
        (data || []).filter(
          (l) => !tenantId || l.profiles?.tenant_id === tenantId,
        ),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setEmpLoading(false);
    }
  };

  const fetchAdmins = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("tenant_id", tenantId)
      .eq("role", "admin")
      .order("full_name");
    setAdmins(data || []);
  };

  const fetchTodos = async () => {
    if (!currentUser?.id) return;
    setTodoLoading(true);
    const { data } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true })
      .limit(20);
    setTodos(data || []);
    setTodoLoading(false);
  };

  const fetchMeetings = async () => {
    if (!currentUser?.id) return;
    setMeetLoading(true);
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .eq("user_id", currentUser.id)
      .gte("meeting_date", new Date().toISOString())
      .order("meeting_date", { ascending: true })
      .limit(10);
    setMeetings(
      (data || []).filter(
        (m) =>
          m.attendee_type === "individual" ||
          m.attendee_emails?.includes(currentUser.email),
      ),
    );
    setMeetLoading(false);
  };

  /* ── crud ── */
  const addTodo = async () => {
    if (!newTodo.title.trim()) return;
    await supabase
      .from("todos")
      .insert([
        { ...newTodo, user_id: currentUser.id, created_by: currentUser.id },
      ]);
    setNewTodo({
      title: "",
      description: "",
      priority: "medium",
      due_date: null,
    });
    setTodoModal(false);
    fetchTodos();
  };
  const toggleTodo = async (id, done) => {
    await supabase.from("todos").update({ completed: !done }).eq("id", id);
    fetchTodos();
  };
  const deleteTodo = async (id) => {
    await supabase.from("todos").delete().eq("id", id);
    fetchTodos();
  };
  const addMeeting = async () => {
    if (!newMeet.title || !newMeet.meeting_date) return;
    await supabase
      .from("meetings")
      .insert([
        { ...newMeet, user_id: currentUser.id, created_by: currentUser.id },
      ]);
    setNewMeet({
      title: "",
      meeting_date: null,
      description: "",
      email_reminders: [],
      attendee_type: "individual",
      attendee_emails: [],
    });
    setMeetModal(false);
    fetchMeetings();
  };
  const deleteMeeting = async (id) => {
    await supabase.from("meetings").delete().eq("id", id);
    fetchMeetings();
  };

  /* ── maps ── */
  const STATUS_MAP = {
    not_started: {
      label: "Not Started",
      color: "#94a3b8",
      bg: dark ? "#1e293b" : "#f1f5f9",
    },
    in_progress: {
      label: "In Progress",
      color: "#1e40af",
      bg: dark ? "#1e293b" : "#eff6ff",
    },
    testing: {
      label: "Testing",
      color: "#f59e0b",
      bg: dark ? "#44200a" : "#fffbeb",
    },
    completed: {
      label: "Completed",
      color: "#10b981",
      bg: dark ? "#064e3b" : "#ecfdf5",
    },
  };
  const PRIO_MAP = {
    high: { label: "High", color: "#ef4444", bg: dark ? "#3b0a0a" : "#fef2f2" },
    medium: {
      label: "Medium",
      color: "#f97316",
      bg: dark ? "#3d1a00" : "#fff7ed",
    },
    low: { label: "Low", color: "#10b981", bg: dark ? "#052e16" : "#f0fdf4" },
  };

  /* ── kpi ── */
  const KPI = [
    {
      label: "Projects",
      value: stats.totalProjects,
      icon: FolderOpen,
      sub: `${stats.activeProjects} active`,
    },
    {
      label: "Employees",
      value: stats.totalEmployees,
      icon: Users,
      sub: "total staff",
    },
    {
      label: "Teams",
      value: stats.totalTeams,
      icon: UsersRound,
      sub: "active teams",
    },
    {
      label: "Pending",
      value: stats.pendingRequests,
      icon: Bell,
      sub: "requests",
    },
    {
      label: "Active Leads",
      value: stats.inProgressLeads,
      icon: TrendingUp,
      sub: "in progress",
    },
    {
      label: "Active Projects",
      value: stats.activeProjects,
      icon: Zap,
      sub: "running now",
    },
  ];

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div
      className={dark ? "d-dark" : "d-light"}
      style={{
        fontFamily: "'DM Sans',sans-serif",
        color: "var(--d-text)",
        background: "var(--d-bg)",
        minHeight: "100vh",
      }}
    >
      {/* ── Page title ── */}
      <div
        className="d-fade"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "var(--d-text)",
              letterSpacing: "-0.02em",
            }}
          >
            Dashboard
          </h1>
          <p
            style={{ margin: "3px 0 0", fontSize: 12, color: "var(--d-muted)" }}
          >
            {dayjs().format("dddd, MMMM D, YYYY")}
          </p>
        </div>
      </div>

      {/* ── Product Banner ── */}
      <ProductBanner dark={dark} />

      {/* ── KPI Cards ── */}
      <div
        className="d-fade"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6,1fr)",
          gap: 12,
          marginBottom: 24,
          animationDelay: "60ms",
        }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
          : KPI.map(({ label, value, icon: Icon, sub }, i) => (
              <div
                key={label}
                style={{
                  background: "var(--d-card)",
                  border: "1px solid var(--d-border)",
                  borderRadius: 12,
                  padding: "18px 20px",
                  animationDelay: `${i * 40}ms`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Icon size={16} color="var(--d-muted)" strokeWidth={1.5} />
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 26,
                    fontWeight: 600,
                    color: "var(--d-text)",
                    lineHeight: 1,
                    marginBottom: 5,
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--d-text)",
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 11, color: "var(--d-muted)" }}>
                  {sub}
                </div>
              </div>
            ))}
      </div>

      {/* ── Active Employees ── */}
      <Panel style={{ marginBottom: 20 }} className="d-fade">
        <PHead
          icon={Clock}
          title="Active Right Now"
          color="#10b981"
          sub={
            empLoading
              ? "Loading…"
              : `${employees.length} employee${employees.length !== 1 ? "s" : ""} tracked today`
          }
          right={
            !empLoading && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 99,
                  background: dark ? "#052e16" : "#ecfdf5",
                  color: "#10b981",
                }}
              >
                {employees.filter((e) => e.status === "active").length} online
              </span>
            )
          }
        />
        <div style={{ padding: "16px 18px" }}>
          {empLoading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
                gap: 12,
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <EmpSkeleton key={i} />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "var(--d-muted)",
                fontSize: 13,
              }}
            >
              No employees working right now
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
                gap: 12,
              }}
            >
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="d-emp"
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: "var(--d-card2)",
                    border: "1px solid var(--d-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <Ava
                        name={emp.profiles?.full_name}
                        photo={emp.profiles?.user_photo}
                        size={36}
                      />
                      <span
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background:
                            emp.status === "active" ? "#10b981" : "#f59e0b",
                          border: "2px solid var(--d-card2)",
                          animation:
                            emp.status === "active"
                              ? "pulse 2s infinite"
                              : "none",
                        }}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--d-text)",
                        }}
                      >
                        {emp.profiles?.full_name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 1,
                        }}
                      >
                        {emp.status === "active" ? (
                          <Play size={10} color="#10b981" fill="#10b981" />
                        ) : (
                          <Pause size={10} color="#f59e0b" fill="#f59e0b" />
                        )}
                        <span
                          style={{
                            fontSize: 11,
                            color:
                              emp.status === "active" ? "#10b981" : "#f59e0b",
                          }}
                        >
                          {emp.status === "active" ? "Working" : "Paused"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <LiveTimer log={emp} />
                  {emp.standup_message && (
                    <button
                      onClick={() => {
                        setStandupData(emp);
                        setStandupModal(true);
                      }}
                      style={{
                        marginTop: 10,
                        width: "100%",
                        padding: "6px",
                        borderRadius: 7,
                        border: "1px solid var(--d-border)",
                        background: "transparent",
                        color: "var(--d-accent)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'DM Sans',sans-serif",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                      }}
                    >
                      <Eye size={12} /> View Standup
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>

      {/* ── Projects + Birthday ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <Panel>
          <PHead
            icon={FolderOpen}
            title="Recent Projects"
            sub="5 most recent"
            color="var(--d-accent)"
          />
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <ProjectRowSkeleton key={i} last={i === 4} />
            ))
          ) : projects.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "var(--d-muted)",
                fontSize: 13,
              }}
            >
              No projects yet
            </div>
          ) : (
            projects.map((p, i) => {
              const s = STATUS_MAP[p.status] || STATUS_MAP.not_started;
              return (
                <div
                  key={p.id}
                  className="d-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 18px",
                    borderBottom:
                      i < projects.length - 1
                        ? "1px solid var(--d-border)"
                        : "none",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--d-text)",
                      }}
                    >
                      {p.name}
                    </div>
                    {p.client_name && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--d-muted)",
                          marginTop: 2,
                        }}
                      >
                        {p.client_name}
                      </div>
                    )}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {p.project_type && (
                      <span style={{ fontSize: 11, color: "var(--d-muted)" }}>
                        {p.project_type}
                      </span>
                    )}
                    <Pill label={s.label} color={s.color} bg={s.bg} />
                  </div>
                </div>
              );
            })
          )}
        </Panel>

        <BirthdayWidget tenantId={tenantId} dark={dark} />
      </div>

      {/* ── Todos + Meetings ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Todos */}
        <Panel>
          <PHead
            icon={CheckSquare}
            title="To-Do"
            color="#8b5cf6"
            sub={
              todoLoading
                ? "Loading…"
                : `${todos.filter((t) => !t.completed).length} remaining`
            }
            right={
              <AddButton
                label="Add Task"
                onClick={() => {
                  setNewTodo({
                    title: "",
                    description: "",
                    priority: "medium",
                    due_date: null,
                  });
                  setTodoModal(true);
                }}
              />
            }
          />
          <div
            style={{ maxHeight: 380, overflowY: "auto", padding: "8px 10px" }}
          >
            {todoLoading ? (
              Array.from({ length: 4 }).map((_, i) => <TodoSkeleton key={i} />)
            ) : todos.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "var(--d-muted)",
                  fontSize: 13,
                }}
              >
                No tasks yet
              </div>
            ) : (
              todos.map((t) => {
                const pr = PRIO_MAP[t.priority] || PRIO_MAP.medium;
                const overdue =
                  t.due_date &&
                  !t.completed &&
                  dayjs(t.due_date).isBefore(dayjs(), "day");
                return (
                  <div
                    key={t.id}
                    className="d-todo"
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 8px",
                      borderRadius: 8,
                      marginBottom: 2,
                    }}
                  >
                    <Checkbox
                      checked={t.completed}
                      onChange={() => toggleTodo(t.id, t.completed)}
                      style={{ marginTop: 2 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
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
                            fontSize: 13,
                            fontWeight: t.completed ? 400 : 500,
                            textDecoration: t.completed
                              ? "line-through"
                              : "none",
                            color: t.completed
                              ? "var(--d-muted)"
                              : "var(--d-text)",
                          }}
                        >
                          {t.title}
                        </span>
                        <Pill label={pr.label} color={pr.color} bg={pr.bg} />
                        {overdue && (
                          <Pill
                            label="Overdue"
                            color="#ef4444"
                            bg={dark ? "#3b0a0a" : "#fef2f2"}
                          />
                        )}
                      </div>
                      {t.due_date && (
                        <div
                          style={{
                            fontSize: 11,
                            marginTop: 3,
                            color: "var(--d-muted)",
                          }}
                        >
                          Due {dayjs(t.due_date).format("MMM D, YYYY")}
                        </div>
                      )}
                      {t.description && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--d-muted)",
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.description}
                        </div>
                      )}
                    </div>
                    <button
                      className="d-icon-btn"
                      onClick={() => deleteTodo(t.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "3px",
                        borderRadius: 5,
                        color: "var(--d-muted)",
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </Panel>

        {/* Meetings */}
        <Panel>
          <PHead
            icon={Calendar}
            title="Meetings"
            color="#06b6d4"
            sub={meetLoading ? "Loading…" : `${meetings.length} upcoming`}
            right={
              <AddButton
                label="Schedule"
                onClick={() => {
                  setNewMeet({
                    title: "",
                    meeting_date: null,
                    description: "",
                    email_reminders: [],
                    attendee_type: "individual",
                    attendee_emails: [],
                  });
                  setMeetModal(true);
                }}
              />
            }
          />
          <div
            style={{ maxHeight: 380, overflowY: "auto", padding: "8px 10px" }}
          >
            {meetLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <MeetingSkeleton key={i} />
              ))
            ) : meetings.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "var(--d-muted)",
                  fontSize: 13,
                }}
              >
                No upcoming meetings
              </div>
            ) : (
              meetings.map((m) => {
                const isNow = dayjs(m.meeting_date).isToday();
                const soon = dayjs(m.meeting_date).diff(dayjs(), "hour") < 2;
                return (
                  <div
                    key={m.id}
                    className="d-meet"
                    style={{
                      padding: "12px 10px",
                      borderRadius: 8,
                      marginBottom: 6,
                      background: isNow
                        ? dark
                          ? "rgba(59,130,246,0.07)"
                          : "#f0f9ff"
                        : "transparent",
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
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            flexWrap: "wrap",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--d-text)",
                            }}
                          >
                            {m.title}
                          </span>
                          {isNow && (
                            <Pill
                              label="Today"
                              color="#1e3a8a"
                              bg={dark ? "#1e293b" : "#dbeafe"}
                            />
                          )}
                          {soon && (
                            <Pill
                              label="Soon"
                              color="#ef4444"
                              bg={dark ? "#3b0a0a" : "#fef2f2"}
                            />
                          )}
                          {m.attendee_type === "multiple" && (
                            <Pill
                              label={`${m.attendee_emails?.length || 0} people`}
                              color="var(--d-sub)"
                              bg="var(--d-card2)"
                            />
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                            color: "var(--d-muted)",
                            marginBottom: m.email_reminders?.length ? 6 : 0,
                          }}
                        >
                          <Calendar size={11} />
                          {dayjs(m.meeting_date).format("MMM D, YYYY · h:mm A")}
                        </div>
                        {m.description && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--d-muted)",
                              marginBottom: 4,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {m.description}
                          </div>
                        )}
                        {m.email_reminders?.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: 5,
                              flexWrap: "wrap",
                            }}
                          >
                            {m.email_reminders.map((r, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: "1px 7px",
                                  borderRadius: 99,
                                  background: "var(--d-card2)",
                                  color: "var(--d-muted)",
                                  border: "1px solid var(--d-border)",
                                }}
                              >
                                {r === "30min"
                                  ? "30m"
                                  : r === "1hour"
                                    ? "1h"
                                    : r === "2hours"
                                      ? "2h"
                                      : r === "4hours"
                                        ? "4h"
                                        : r === "8hours"
                                          ? "8h"
                                          : "24h"}{" "}
                                before
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        className="d-icon-btn"
                        onClick={() => deleteMeeting(m.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "3px",
                          borderRadius: 5,
                          color: "var(--d-muted)",
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Panel>
      </div>

      {/* ── World Map ── */}
      <Panel style={{ marginBottom: 20 }}>
        <PHead
          icon={Globe}
          title="Client Locations"
          sub={`${countries.length} countries`}
          color="#10b981"
        />
        <div style={{ padding: "16px 18px" }}>
          {loading ? (
            <Skel w="100%" h={220} radius={10} />
          ) : (
            <ClientWorldMap countries={countries} />
          )}
        </div>
      </Panel>

      {/* ══ MODALS ══ */}

      {/* Standup */}
      <Modal
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {standupData && (
              <Ava
                name={standupData.profiles?.full_name}
                photo={standupData.profiles?.user_photo}
                size={30}
              />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Daily Standup</div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--d-muted)",
                  fontWeight: 400,
                }}
              >
                {standupData?.profiles?.full_name}
              </div>
            </div>
          </div>
        }
        open={standupModal}
        wrapClassName={dark ? "d-dark" : undefined}
        onCancel={() => setStandupModal(false)}
        footer={null}
      >
        {standupData && (
          <div style={{ fontFamily: "'DM Sans',sans-serif", paddingTop: 8 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 14,
              }}
            >
              {[
                { label: "Date", value: standupData.date },
                {
                  label: "Total Hours",
                  value: `${(standupData.total_hours || 0).toFixed(2)}h`,
                },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    background: "var(--d-card2)",
                    border: "1px solid var(--d-border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--d-muted)",
                      marginBottom: 4,
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--d-text)",
                      fontFamily: "'JetBrains Mono',monospace",
                    }}
                  >
                    {r.value}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: "14px",
                borderRadius: 10,
                background: "var(--d-card2)",
                border: "1px solid var(--d-border)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--d-muted)",
                  marginBottom: 8,
                }}
              >
                Message
              </div>
              <p
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "var(--d-sub)",
                }}
              >
                {standupData.standup_message}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Todo */}
      <Modal
        title={
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>
            New Task
          </span>
        }
        open={todoModal}
        wrapClassName={dark ? "d-dark" : undefined}
        onCancel={() => {
          setTodoModal(false);
          setNewTodo({
            title: "",
            description: "",
            priority: "medium",
            due_date: null,
          });
        }}
        onOk={addTodo}
        okText="Add Task"
        width={440}
        destroyOnClose
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            paddingTop: 12,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          <div>
            <FL req>Title</FL>
            <Input
              value={newTodo.title}
              onChange={(e) =>
                setNewTodo({ ...newTodo, title: e.target.value })
              }
              placeholder="What needs to be done?"
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <FL>Priority</FL>
              <Select
                value={newTodo.priority}
                onChange={(v) => setNewTodo({ ...newTodo, priority: v })}
                popupClassName={dark ? "d-popup-dark" : undefined}
                style={{ width: "100%" }}
                options={[
                  { label: "High", value: "high" },
                  { label: "Medium", value: "medium" },
                  { label: "Low", value: "low" },
                ]}
              />
            </div>
            <div>
              <FL>Due Date</FL>
              <DatePicker
                value={newTodo.due_date ? dayjs(newTodo.due_date) : null}
                onChange={(d) =>
                  setNewTodo({
                    ...newTodo,
                    due_date: d ? d.format("YYYY-MM-DD") : null,
                  })
                }
                popupClassName={dark ? "d-popup-dark" : undefined}
                style={{ width: "100%" }}
                format="MMM DD, YYYY"
              />
            </div>
          </div>
          <div>
            <FL>Description</FL>
            <TextArea
              rows={3}
              value={newTodo.description}
              onChange={(e) =>
                setNewTodo({ ...newTodo, description: e.target.value })
              }
              placeholder="Optional notes…"
            />
          </div>
        </div>
      </Modal>

      {/* Add Meeting */}
      <Modal
        title={
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>
            Schedule Meeting
          </span>
        }
        open={meetModal}
        wrapClassName={dark ? "d-dark" : undefined}
        onCancel={() => {
          setMeetModal(false);
          setNewMeet({
            title: "",
            meeting_date: null,
            description: "",
            email_reminders: [],
            attendee_type: "individual",
            attendee_emails: [],
          });
        }}
        onOk={addMeeting}
        okText="Schedule"
        width={480}
        destroyOnClose
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            paddingTop: 12,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          <div>
            <FL req>Title</FL>
            <Input
              value={newMeet.title}
              onChange={(e) =>
                setNewMeet({ ...newMeet, title: e.target.value })
              }
              placeholder="Meeting title"
            />
          </div>
          <div>
            <FL req>Date & Time</FL>
            <DatePicker
              showTime
              value={newMeet.meeting_date ? dayjs(newMeet.meeting_date) : null}
              onChange={(d) =>
                setNewMeet({
                  ...newMeet,
                  meeting_date: d ? d.toISOString() : null,
                })
              }
              popupClassName={dark ? "d-popup-dark" : undefined}
              style={{ width: "100%" }}
              format="MMM DD, YYYY h:mm A"
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div>
              <FL>Attendees</FL>
              <Select
                value={newMeet.attendee_type}
                onChange={(v) =>
                  setNewMeet({
                    ...newMeet,
                    attendee_type: v,
                    attendee_emails:
                      v === "individual"
                        ? []
                        : currentUser?.email
                          ? [currentUser.email]
                      : [],
                  })
                }
                popupClassName={dark ? "d-popup-dark" : undefined}
                style={{ width: "100%" }}
                options={[
                  { label: "Only Me", value: "individual" },
                  { label: "Multiple", value: "multiple" },
                ]}
              />
            </div>
            <div>
              <FL>Reminders</FL>
              <Select
                mode="multiple"
                placeholder="Select times"
                value={newMeet.email_reminders}
                onChange={(v) => setNewMeet({ ...newMeet, email_reminders: v })}
                popupClassName={dark ? "d-popup-dark" : undefined}
                style={{ width: "100%" }}
                options={[
                  { label: "30 min", value: "30min" },
                  { label: "1 hr", value: "1hour" },
                  { label: "2 hrs", value: "2hours" },
                  { label: "4 hrs", value: "4hours" },
                  { label: "8 hrs", value: "8hours" },
                  { label: "24 hrs", value: "24hours" },
                ]}
              />
            </div>
          </div>
          {newMeet.attendee_type === "multiple" && (
            <div>
              <FL>Select Admins</FL>
              <Select
                mode="multiple"
                placeholder="Add admins"
                value={newMeet.attendee_emails.filter(
                  (e) => e !== currentUser?.email,
                )}
                onChange={(v) =>
                  setNewMeet({
                    ...newMeet,
                    attendee_emails: currentUser?.email
                      ? [currentUser.email, ...v]
                      : v,
                  })
                }
                popupClassName={dark ? "d-popup-dark" : undefined}
                style={{ width: "100%" }}
                options={admins
                  .filter((a) => a.email !== currentUser?.email)
                  .map((a) => ({
                    label: `${a.full_name} (${a.email})`,
                    value: a.email,
                  }))}
              />
            </div>
          )}
          <div>
            <FL>Description</FL>
            <TextArea
              rows={3}
              value={newMeet.description}
              onChange={(e) =>
                setNewMeet({ ...newMeet, description: e.target.value })
              }
              placeholder="Agenda or notes…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
