import { useState, useEffect, useMemo } from "react";
import {
  Button,
  message,
  Modal,
  Drawer,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Upload,
  Avatar,
} from "antd";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Ban,
  CheckCircle2,
  Upload as UploadIcon,
  Search,
  Users,
  Clock,
  Mail,
  Phone,
  Building2,
  LayoutGrid,
  List,
  X,
  Star,
  Briefcase,
  Globe,
  MapPin,
  Languages,
  DollarSign,
  Calendar,
  UserCheck,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";

const { TextArea } = Input;
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/* ------------------------ Email sender -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
const sendEmail = async ({ to, subject, body, companyName }) => {
  try {
    if (!EMAIL_API) {
      console.error("Email API URL is not configured");
      return { success: false, error: "Missing email API URL" };
    }
    const res = await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html: body, companyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Email send failed:", data);
      return { success: false, error: data };
    }
    console.log("Email sent:", data.messageId);
    return { success: true, data };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err.message };
  }
};

/* ------------------------ Constants ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */

// No pre-defined bank list - free text input worldwide
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "EUR", name: "Euro" },
  { code: "GBP", symbol: "GBP", name: "British Pound" },
  { code: "PKR", symbol: "Rs", name: "Pakistani Rupee" },
  { code: "INR", symbol: "Rs", name: "Indian Rupee" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "SAR", symbol: "SAR", name: "Saudi Riyal" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "JPY", symbol: "JPY", name: "Japanese Yen" },
  { code: "CNY", symbol: "CNY", name: "Chinese Yuan" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "BDT", symbol: "Tk", name: "Bangladeshi Taka" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
  { code: "NPR", symbol: "Rs", name: "Nepalese Rupee" },
  { code: "QAR", symbol: "QAR", name: "Qatari Riyal" },
  { code: "KWD", symbol: "KWD", name: "Kuwaiti Dinar" },
  { code: "BHD", symbol: "BHD", name: "Bahraini Dinar" },
  { code: "OMR", symbol: "OMR", name: "Omani Rial" },
  { code: "JOD", symbol: "JD", name: "Jordanian Dinar" },
  { code: "EGP", symbol: "EGP", name: "Egyptian Pound" },
  { code: "NGN", symbol: "NGN", name: "Nigerian Naira" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "GHS", name: "Ghanaian Cedi" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "COP", symbol: "$", name: "Colombian Peso" },
  { code: "ARS", symbol: "$", name: "Argentine Peso" },
  { code: "CLP", symbol: "$", name: "Chilean Peso" },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "PLN", symbol: "PLN", name: "Polish Zloty" },
  { code: "CZK", symbol: "CZK", name: "Czech Koruna" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "TRY", symbol: "TRY", name: "Turkish Lira" },
  { code: "RUB", symbol: "RUB", name: "Russian Ruble" },
  { code: "UAH", symbol: "UAH", name: "Ukrainian Hryvnia" },
  { code: "THB", symbol: "THB", name: "Thai Baht" },
  { code: "VND", symbol: "VND", name: "Vietnamese Dong" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "PHP", name: "Philippine Peso" },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "KRW", symbol: "KRW", name: "South Korean Won" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "OTHER", symbol: "", name: "Other (specify)" },
];

const TIMEZONES = [
  "UTC-12:00",
  "UTC-11:00",
  "UTC-10:00",
  "UTC-09:00",
  "UTC-08:00 (PST)",
  "UTC-07:00 (MST)",
  "UTC-06:00 (CST)",
  "UTC-05:00 (EST)",
  "UTC-04:00 (AST)",
  "UTC-03:00",
  "UTC+00:00 (GMT/UTC)",
  "UTC+01:00 (CET)",
  "UTC+02:00 (EET)",
  "UTC+03:00 (MSK)",
  "UTC+04:00 (GST)",
  "UTC+05:00 (PKT)",
  "UTC+05:30 (IST)",
  "UTC+06:00",
  "UTC+07:00 (WIB)",
  "UTC+08:00 (SGT/CST)",
  "UTC+09:00 (JST)",
  "UTC+10:00 (AEST)",
  "UTC+12:00 (NZST)",
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-Time" },
  { value: "part_time", label: "Part-Time" },
  { value: "contract", label: "Contract" },
  { value: "freelancer", label: "Freelancer" },
  { value: "intern", label: "Intern" },
];

const LANGUAGES = [
  "English",
  "Urdu",
  "Arabic",
  "French",
  "German",
  "Spanish",
  "Chinese (Mandarin)",
  "Hindi",
  "Portuguese",
  "Russian",
  "Japanese",
  "Korean",
  "Turkish",
  "Italian",
  "Dutch",
  "Persian",
  "Bengali",
  "Punjabi",
  "Swahili",
  "Malay",
  "Indonesian",
  "Thai",
  "Vietnamese",
  "Polish",
  "Ukrainian",
  "Romanian",
  "Greek",
  "Czech",
  "Hungarian",
  "Swedish",
];

const SKILL_OPTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Vue",
  "Angular",
  "Node.js",
  "Python",
  "Django",
  "FastAPI",
  "PHP",
  "Laravel",
  "Java",
  "Spring",
  "C#",
  ".NET",
  "Go",
  "Ruby",
  "Rails",
  "Swift",
  "Kotlin",
  "Flutter",
  "React Native",
  "DevOps",
  "AWS",
  "GCP",
  "Azure",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "REST",
  "UI/UX Design",
  "Figma",
  "Project Management",
  "Scrum",
  "Agile",
  "Data Analysis",
  "Machine Learning",
  "AI/ML",
  "Cybersecurity",
  "QA/Testing",
  "SEO",
  "Digital Marketing",
];

const ROLE_COLORS = {
  employee: { bg: "#e8f4fd", text: "#1677ff", border: "#bae0ff" },
  project_manager: { bg: "#f6ffed", text: "#389e0d", border: "#b7eb8f" },
};
const ROLE_COLORS_DARK = {
  employee: {
    bg: "rgba(59,130,246,0.16)",
    text: "#93c5fd",
    border: "rgba(147,197,253,0.38)",
  },
  project_manager: {
    bg: "rgba(34,197,94,0.16)",
    text: "#86efac",
    border: "rgba(134,239,172,0.38)",
  },
};

const AVATAR_PALETTE = [
  "#1677ff",
  "#52c41a",
  "#fa8c16",
  "#eb2f96",
  "#722ed1",
  "#13c2c2",
  "#f5222d",
  "#2f54eb",
  "#faad14",
  "#08979c",
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const getAvatarColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/* ------------------------ CSS ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

.ep {
  font-family:'DM Sans',-apple-system,sans-serif;
  --ep-bg:#f8fafc;
  --ep-card:#ffffff;
  --ep-card2:#fafafa;
  --ep-border:#ebebeb;
  --ep-border-soft:#f3f3f3;
  --ep-text:#0a0a0a;
  --ep-sub:#6a6a6a;
  --ep-muted:#9a9a9a;
  --ep-muted-2:#b0b0b0;
  --ep-hover:#fafafa;
  --ep-pill-bg:#f5f5f5;
  --ep-skill-bg:#f0f5ff;
  --ep-skill-text:#2563eb;
  --ep-skel-base:#f0f0f0;
  --ep-skel-shine:#e8e8e8;
  --ep-empty:#d0d0d0;
}
.ep.dark {
  --ep-bg:#141416;
  --ep-card:#1a1b1f;
  --ep-card2:#17181c;
  --ep-border:#2a2b31;
  --ep-border-soft:#383a43;
  --ep-text:#f3f4f6;
  --ep-sub:#d1d5db;
  --ep-muted:#9ca3af;
  --ep-muted-2:#9ca3af;
  --ep-hover:#202127;
  --ep-pill-bg:#202127;
  --ep-skill-bg:#1f2f46;
  --ep-skill-text:#93c5fd;
  --ep-skel-base:#202127;
  --ep-skel-shine:#2a2b31;
  --ep-empty:#6b7280;
}
.ep-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; gap:12px; flex-wrap:wrap; }
.ep-title  { font-size:24px; font-weight:700; color:var(--ep-text); margin:0; letter-spacing:-.4px; }
.ep-sub    { font-size:13px; color:var(--ep-muted); margin:3px 0 0; }

/* Stats */
.ep-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
@media(max-width:640px){ .ep-stats{grid-template-columns:repeat(2,1fr);} }
.ep-stat { background:var(--ep-card); border:1px solid var(--ep-border); border-radius:14px; padding:16px 18px; }
.ep-stat-n { font-size:30px; font-weight:700; line-height:1; }
.ep-stat-l { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--ep-muted); font-weight:600; margin-top:5px; display:flex; align-items:center; gap:5px; }
.ep-dot    { width:7px; height:7px; border-radius:50%; flex-shrink:0; }

/* Toolbar */
.ep-toolbar { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; align-items:center; }
.ep-search-wrap { position:relative; flex:1; min-width:200px; max-width:320px; }
.ep-search-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#c0c0c0; pointer-events:none; }
.ep-search-wrap input { width:100%; padding:8px 12px 8px 34px; border:1px solid var(--ep-border); border-radius:10px; background:var(--ep-card2); font-size:13px; font-family:inherit; outline:none; color:var(--ep-text); transition:border-color .15s,background .15s; box-sizing:border-box; }
.ep-search-wrap input:focus { border-color:#1677ff; background:var(--ep-card); }
.ep-count { font-size:12px; color:#b0b0b0; margin-left:4px; }
.ep-view-toggle { display:flex; align-items:center; gap:2px; background:var(--ep-pill-bg); border-radius:9px; padding:3px; margin-left:auto; }
.ep-vbtn { border:none; background:transparent; cursor:pointer; width:30px; height:30px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--ep-muted); transition:all .15s; }
.ep-vbtn.active { background:var(--ep-card); color:var(--ep-text); box-shadow:0 1px 4px rgba(0,0,0,.1); }
.ep-vbtn:hover:not(.active) { color:#555; }
@media(max-width:768px){
  .ep-header{margin-bottom:18px;}
  .ep-title{font-size:22px;}
  .ep-sub{font-size:12px;}
  .ep-toolbar{align-items:stretch;}
  .ep-search-wrap{min-width:100%; max-width:none;}
  .ep-count{width:100%; margin-left:0; order:4;}
  .ep-view-toggle{margin-left:0;}
  .ep-grid{grid-template-columns:1fr;}
  .ep-card-top,.ep-card-body{padding-left:14px; padding-right:14px;}
  .ep-actions{padding:10px 12px; flex-wrap:wrap; justify-content:stretch;}
  .ep-btn{flex:1 1 calc(50% - 4px); justify-content:center;}
  .ep-table-wrap{overflow:hidden;}
  .ep-table-scroll{-webkit-overflow-scrolling:touch;}
  .ep-table{min-width:860px;}
}

/* Cards */
.ep-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:14px; }
.ep-card { background:var(--ep-card); border:1px solid var(--ep-border); border-radius:16px; overflow:hidden; transition:box-shadow .2s,transform .18s; }
.ep-card:hover { box-shadow:0 10px 32px rgba(0,0,0,.09); transform:translateY(-2px); }
.ep-card-top { padding:18px 18px 0; display:flex; align-items:flex-start; gap:13px; }
.ep-av-wrap { position:relative; flex-shrink:0; }
.ep-status-pip { position:absolute; bottom:-1px; right:-1px; width:11px; height:11px; border-radius:50%; border:2.5px solid var(--ep-card); }
.ep-card-meta { flex:1; min-width:0; }
.ep-card-name { font-size:14px; font-weight:700; color:var(--ep-text); margin:0 0 5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ep-role-pill { display:inline-flex; align-items:center; padding:2px 9px; border-radius:20px; font-size:10px; font-weight:700; letter-spacing:.4px; text-transform:uppercase; border:1px solid; }
.ep-card-body { padding:14px 18px; display:flex; flex-direction:column; gap:7px; }
.ep-row { display:flex; align-items:center; gap:7px; font-size:12.5px; color:var(--ep-sub); }
.ep-row .lc { color:#c8c8c8; flex-shrink:0; }
.ep-row span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ep-salary-badge { display:inline-block; background:var(--ep-pill-bg); border-radius:6px; padding:1px 7px; font-size:10.5px; font-weight:700; color:var(--ep-sub); text-transform:uppercase; letter-spacing:.3px; border:1px solid transparent; }
.ep-skill-tag { background:var(--ep-skill-bg); color:var(--ep-skill-text); border-radius:5px; padding:1px 7px; font-size:10.5px; font-weight:600; border:1px solid transparent; }
.ep.dark .ep-salary-badge { border-color:var(--ep-border-soft); color:#d1d5db; }
.ep.dark .ep-skill-tag { border-color:#2f4a6d; color:#bfdbfe; }
.ep-sep { height:1px; background:var(--ep-border-soft); margin:0 18px; }
.ep-actions { padding:10px 14px; display:flex; gap:2px; justify-content:flex-end; }
.ep-btn { border:none; background:transparent; cursor:pointer; padding:5px 9px; border-radius:7px; font-size:11.5px; font-weight:600; display:flex; align-items:center; gap:4px; color:#7a7a7a; transition:all .14s; font-family:inherit; }
.ep-btn:hover          { background:#f3f3f3; color:#222; }
.ep-btn.view:hover     { background:#e6f4ff; color:#1677ff; }
.ep-btn.edit:hover     { background:#fff7e6; color:#d46b08; }
.ep-btn.suspend:hover  { background:#fff2e8; color:#d4380d; }
.ep-btn.activate:hover { background:#f6ffed; color:#389e0d; }
.ep-btn.del:hover      { background:#fff1f0; color:#cf1322; }

/* Empty */
.ep-empty { text-align:center; padding:72px 20px; }
.ep-empty-ico  { margin-bottom:14px; display:flex; justify-content:center; }
.ep-empty-text { font-size:15px; font-weight:600; color:var(--ep-sub); }
.ep-empty-hint { font-size:12.5px; color:var(--ep-muted-2); margin-top:5px; }

/* Buttons */
.ep-add-btn { background:#1e40af !important; border-color:#1e40af !important; border-radius:10px !important; font-weight:700 !important; font-family:'DM Sans',sans-serif !important; height:38px !important; padding:0 18px !important; }
.ep.dark .ep-add-btn { background:#e2e8f0 !important; border-color:#e2e8f0 !important; color:#111111 !important; }
.ep.dark .ep-add-btn:hover { background:#cbd5e1 !important; border-color:#cbd5e1 !important; color:#111111 !important; }
.ep.dark .ant-select-selector {
  background:var(--ep-card2) !important;
  border-color:var(--ep-border) !important;
  color:var(--ep-text) !important;
}
.ep.dark .ant-select-selection-placeholder,
.ep.dark .ant-select-arrow { color:var(--ep-muted) !important; }

/* Drawer section label */
.ds-sec { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.8px; color:#c0c0c0; margin:22px 0 10px; padding-bottom:8px; border-bottom:1px solid #f0f0f0; }

/* Skeleton shimmer */
@keyframes shimmer {
  0%   { background-position:-800px 0; }
  100% { background-position: 800px 0; }
}
.skel {
  background: linear-gradient(90deg,var(--ep-skel-base) 25%,var(--ep-skel-shine) 50%,var(--ep-skel-base) 75%);
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: 8px;
}
.ep-skel-card { background:var(--ep-card); border:1px solid var(--ep-border); border-radius:16px; padding:18px; }
.ep-skel-row  { display:flex; align-items:center; gap:12px; margin-bottom:16px; }

/* Table */
.ep-table-wrap { background:var(--ep-card); border:1px solid var(--ep-border); border-radius:16px; overflow:hidden; }
.ep-table-scroll { width:100%; overflow-x:auto; overflow-y:hidden; }
.ep-table { width:100%; min-width:960px; border-collapse:collapse; font-size:13px; }
.ep-table thead tr { border-bottom:1px solid var(--ep-border-soft); }
.ep-table thead th { padding:11px 16px; text-align:left; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--ep-muted-2); white-space:nowrap; background:var(--ep-card2); }
.ep-table tbody tr { border-bottom:1px solid var(--ep-border-soft); transition:background .12s; }
.ep-table tbody tr:last-child { border-bottom:none; }
.ep-table tbody tr:hover { background:var(--ep-hover); }
.ep-table td { padding:12px 16px; color:var(--ep-sub); vertical-align:middle; }
.ep-table-name { display:flex; align-items:center; gap:10px; }
.ep-table-name-text { font-weight:600; color:var(--ep-text); font-size:13.5px; cursor:pointer; }
.ep-table-name-text:hover { color:#1677ff; }
.ep-table-email { color:var(--ep-sub); font-size:12.5px; }

/* Bank input hint */
.bank-hint { font-size:11.5px; color:#b0b0b0; margin-top:4px; display:flex; align-items:center; gap:4px; }

.ep-dark-drawer .ant-drawer-content,
.ep-dark-drawer .ant-drawer-header,
.ep-dark-drawer .ant-drawer-body {
  background:#1a1b1f !important;
  color:#f3f4f6 !important;
  border-color:#2a2b31 !important;
}
.ep-dark-drawer .ant-drawer-title { color:#f3f4f6 !important; }
.ep-dark-drawer .ant-drawer-close { color:#9ca3af !important; }
.ep-dark-drawer .ant-form-item-label > label,
.ep-dark-drawer .ds-sec { color:#9ca3af !important; }
.ep-dark-drawer .ant-input,
.ep-dark-drawer .ant-input-affix-wrapper,
.ep-dark-drawer .ant-input-number,
.ep-dark-drawer .ant-input-number .ant-input-number-input,
.ep-dark-drawer .ant-select-selector,
.ep-dark-drawer .ant-picker {
  background:#17181c !important;
  border-color:#2a2b31 !important;
  color:#f3f4f6 !important;
}
.ep-dark-drawer .ant-btn-default {
  background:#202127 !important;
  border-color:#2a2b31 !important;
  color:#f3f4f6 !important;
}
.ep-dark-drawer .ant-input::placeholder,
.ep-dark-drawer .ant-input-number .ant-input-number-input::placeholder,
.ep-dark-drawer .ant-input-affix-wrapper input::placeholder {
  color:#9ca3af !important;
}
.ep-dark-drawer .ant-select-selection-placeholder,
.ep-dark-drawer .ant-select-arrow,
.ep-dark-drawer .ant-picker-suffix,
.ep-dark-drawer .ant-picker-clear {
  color:#9ca3af !important;
}

.ep-dark-popup.ant-select-dropdown,
.ep-dark-popup.ant-picker-dropdown .ant-picker-panel-container {
  background:#1a1b1f !important;
  border:1px solid #2a2b31 !important;
}
.ep-dark-popup.ant-select-dropdown .ant-select-item {
  color:#f3f4f6 !important;
}
.ep-dark-popup.ant-select-dropdown .ant-select-item-option-active,
.ep-dark-popup.ant-select-dropdown .ant-select-item-option-selected {
  background:#202127 !important;
}
.ep-dark-popup.ant-picker-dropdown .ant-picker-header,
.ep-dark-popup.ant-picker-dropdown .ant-picker-content th {
  color:#9ca3af !important;
  border-color:#2a2b31 !important;
}
.ep-dark-popup.ant-picker-dropdown .ant-picker-cell-inner {
  color:#f3f4f6 !important;
}
.ep-dark-popup.ant-picker-dropdown .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner {
  background:#1d4ed8 !important;
  color:#f8fafc !important;
}
`;

/* ------------------------ Skeleton components ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
const SkeletonCard = () => (
  <div className="ep-skel-card">
    <div className="ep-skel-row">
      <div
        className="skel"
        style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }}
      />
      <div style={{ flex: 1 }}>
        <div
          className="skel"
          style={{ height: 14, width: "60%", marginBottom: 8 }}
        />
        <div className="skel" style={{ height: 10, width: "35%" }} />
      </div>
    </div>
    <div
      className="skel"
      style={{ height: 11, width: "80%", marginBottom: 8 }}
    />
    <div
      className="skel"
      style={{ height: 11, width: "55%", marginBottom: 8 }}
    />
    <div
      className="skel"
      style={{ height: 11, width: "70%", marginBottom: 16 }}
    />
    <div
      style={{
        height: 1,
        background: "var(--ep-border-soft)",
        margin: "0 -18px 12px",
      }}
    />
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
      {[60, 50, 70, 32].map((w, i) => (
        <div
          key={i}
          className="skel"
          style={{ height: 26, width: w, borderRadius: 7 }}
        />
      ))}
    </div>
  </div>
);

const SkeletonTableRow = () => (
  <tr>
    {[200, 110, 110, 80, 100, 80, 120].map((w, i) => (
      <td key={i} style={{ padding: "14px 16px" }}>
        {i === 0 ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              className="skel"
              style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }}
            />
            <div>
              <div
                className="skel"
                style={{ height: 13, width: 120, marginBottom: 6 }}
              />
              <div className="skel" style={{ height: 11, width: 160 }} />
            </div>
          </div>
        ) : (
          <div className="skel" style={{ height: 13, width: w * 0.7 }} />
        )}
      </td>
    ))}
  </tr>
);

/* ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
const Employees = () => {
  const [dark, setDark] = useState(getIsDarkTheme);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440,
  );
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true); // start true so skeleton shows first
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [currentTenantId, setCurrentTenantId] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("card");
  const [maxUsers, setMaxUsers] = useState(null);
  const [isUserLimitReached, setIsUserLimitReached] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentTenant();
  }, []);

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);
    mediaQuery.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const syncViewport = () => setViewportWidth(window.innerWidth);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  // Refresh employees when tab becomes visible to update limit status
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentTenantId) {
        fetchEmployees(currentTenantId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentTenantId]);

  const fetchCurrentTenant = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("tenant_id, company_name")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      const tid = data?.tenant_id;
      setCurrentTenantId(tid);
      setCompanyName(data?.company_name || "");
      
      // Fetch tenant info for max_users
      const { data: tenantData } = await supabase
        .from("tenants")
        .select("max_users,name")
        .eq("id", tid)
        .single();
      if (!data?.company_name && tenantData?.name) {
        setCompanyName(tenantData.name);
      }
      if (
        tenantData &&
        tenantData.max_users !== null &&
        tenantData.max_users !== undefined
      ) {
        const parsedMax = Number(tenantData.max_users);
        if (!Number.isNaN(parsedMax)) setMaxUsers(parsedMax);
      }
      
      await fetchEmployees(tid);
      fetchTeams(tid);
    } catch {
      message.error("Failed to load tenant");
      setLoading(false);
    }
  };

  const fetchEmployees = async (tid) => {
    if (!tid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, teams(id,name)")
        .eq("tenant_id", tid)
        .in("role", ["employee", "project_manager"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEmployees(data || []);
    } catch {
      message.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (maxUsers === null || maxUsers === undefined) {
      setIsUserLimitReached(false);
      return;
    }
    setIsUserLimitReached(employees.length >= maxUsers);
  }, [employees.length, maxUsers]);

  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1100;
  const twoColGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: isMobile ? "0 0" : "0 16px",
  };
  const listRowGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 180px auto",
    gap: 10,
    marginBottom: 10,
    alignItems: "start",
  };

  const fetchTeams = async (tid) => {
    if (!tid) return;
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("tenant_id", tid)
        .order("name");
      if (error) throw error;
      setTeams(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEmployee = async (values) => {
    if (!currentTenantId) {
      message.error("Tenant not loaded");
      return;
    }
    // Check user limit when creating new employee
    if (
      !editingEmployee &&
      maxUsers !== null &&
      maxUsers !== undefined &&
      employees.length >= maxUsers
    ) {
      message.error(
        `You've reached the maximum of ${maxUsers} user${maxUsers !== 1 ? "s" : ""} allowed on your current plan. Please upgrade to add more users.`,
      );
      return;
    }
    setLoading(true);
    try {
      // Resolve currency: if OTHER selected, use custom_currency field
      const resolvedCurrency =
        values.currency === "OTHER" ? values.custom_currency : values.currency;
      const normalizeLineItems = (items = []) =>
        (items || [])
          .map((item) => ({
            label: String(item?.label || "").trim(),
            amount: Number(item?.amount || 0),
          }))
          .filter((item) => item.label && item.amount >= 0);
      const allowanceItems = normalizeLineItems(values.allowance_items);
      const taxDeductionItems = normalizeLineItems(values.tax_deduction_items);
      const totalAllowances = allowanceItems.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );
      const totalTaxDeductions = taxDeductionItems.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      );

      const payload = {
        full_name: values.full_name,
        job_title: values.job_title,
        role: values.role || "employee",
        contact: values.contact,
        cnic: values.cnic,
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
        address: values.address,
        github_username: values.github_username,
        team_id: values.team_id,
        salary_type: values.salary_type,
        salary_amount:
          values.salary_type === "fixed" ? values.salary_amount : null,
        base_salary:
          values.salary_type === "base_commission" ? values.base_salary : null,
        commission_rate:
          values.salary_type === "base_commission"
            ? values.commission_rate
            : null,
        allowances: totalAllowances,
        tax_deductions: totalTaxDeductions,
        allowance_items: allowanceItems,
        tax_deduction_items: taxDeductionItems,
        // Bank: free-text field (worldwide)
        bank_account_name: values.bank_account_name,
        bank_account_number: values.bank_account_number,
        bank_name: values.bank_name,
        working_hours: values.working_hours ?? null,
        // International fields
        employment_type: values.employment_type,
        currency: resolvedCurrency,
        timezone: values.timezone,
        languages: values.languages,
        skills: values.skills,
        nationality: values.nationality,
        emergency_contact_name: values.emergency_contact_name,
        emergency_contact_phone: values.emergency_contact_phone,
        linkedin_url: values.linkedin_url,
        portfolio_url: values.portfolio_url,
        experience_years: values.experience_years,
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", editingEmployee.id)
          .eq("tenant_id", currentTenantId);
        if (error) throw error;
        message.success("Employee updated");
      } else {
        const {
          data: { session: adminSessionBeforeCreate },
        } = await supabase.auth.getSession();
        const pwd =
          Math.random().toString(36).slice(-8) +
          Math.random().toString(36).slice(-8).toUpperCase();
        const { data: authData, error: signUpError } =
          await supabase.auth.signUp({
            email: values.email,
            password: pwd,
            options: { emailRedirectTo: `${window.location.origin}/signin` },
          });
        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("Failed to create user");
        if (
          adminSessionBeforeCreate?.access_token &&
          adminSessionBeforeCreate?.refresh_token
        ) {
          const { error: restoreSessionError } = await supabase.auth.setSession({
            access_token: adminSessionBeforeCreate.access_token,
            refresh_token: adminSessionBeforeCreate.refresh_token,
          });
          if (restoreSessionError) {
            console.error("Failed to restore admin session:", restoreSessionError);
          }
        }
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            ...payload,
            id: authData.user.id,
            email: values.email,
            tenant_id: currentTenantId,
          },
        ]);
        if (profileError) throw profileError;
        message.success("Employee created");
        
        const appName =
          companyName ||
          import.meta.env.VITE_COMPANY_NAME ||
          import.meta.env.VITE_APP_NAME ||
          "Your Company";
        const loginUrl = `${window.location.origin}/signin`;
        const safeName = escapeHtml(values.full_name || "there");
        const safeEmail = escapeHtml(values.email);
        const safePassword = escapeHtml(pwd);

        const credentialsHtml = `
          <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;font-size:14px;">
            <p style="margin:0 0 14px;">Hello ${safeName},</p>
            <p style="margin:0 0 14px;">
              Your account has been created for ${escapeHtml(appName)}. Use the credentials below to sign in.
            </p>
            <p style="margin:0 0 6px;"><strong>Email:</strong> ${safeEmail}</p>
            <p style="margin:0 0 14px;"><strong>Temporary Password:</strong> ${safePassword}</p>
            <p style="margin:0 0 14px;">
              <strong>Login URL:</strong>
              <a href="${loginUrl}" style="color:#2563eb;text-decoration:none;"> ${loginUrl}</a>
            </p>
            <p style="margin:0 0 14px;">
              For security, please change your password after your first login.
            </p>
            <p style="margin:0;">This is an automated email from ${escapeHtml(appName)}.</p>
          </div>
        `;

        sendEmail({
          to: values.email,
          subject: `${appName} account credentials`,
          body: credentialsHtml,
          companyName: appName,
        }).catch(console.error);
      }
      closeDrawer();
      fetchEmployees(currentTenantId);
    } catch (e) {
      message.error(editingEmployee ? "Failed to update" : "Failed to create");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setProfilePicUrl(emp.user_photo);
    // Check if stored currency matches a known code
    const knownCurrency = CURRENCIES.find(
      (c) => c.code === emp.currency && c.code !== "OTHER",
    );
    form.setFieldsValue({
      ...emp,
      dob: emp.dob ? dayjs(emp.dob) : null,
      allowance_items:
        Array.isArray(emp.allowance_items) && emp.allowance_items.length > 0
          ? emp.allowance_items
          : emp.allowances
            ? [{ label: "General Allowance", amount: Number(emp.allowances) }]
            : [],
      tax_deduction_items:
        Array.isArray(emp.tax_deduction_items) &&
        emp.tax_deduction_items.length > 0
          ? emp.tax_deduction_items
          : emp.tax_deductions
            ? [{ label: "Tax Deduction", amount: Number(emp.tax_deductions) }]
            : [],
      currency: knownCurrency
        ? emp.currency
        : emp.currency
          ? "OTHER"
          : undefined,
      custom_currency: knownCurrency ? "" : emp.currency,
    });
    setDrawerVisible(true);
  };

  const handleUploadProfilePicture = async (file) => {
    if (!editingEmployee) {
      message.warning("Save the employee first");
      return false;
    }
    setUploading(true);
    try {
      if (profilePicUrl) {
        const oldPath = profilePicUrl.split("/").pop();
        await supabase.storage
          .from("profile-pictures")
          .remove([`${editingEmployee.id}/${oldPath}`]);
      }
      const filePath = `${editingEmployee.id}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ user_photo: data.publicUrl })
        .eq("id", editingEmployee.id);
      if (updateError) throw updateError;
      setProfilePicUrl(data.publicUrl);
      message.success("Photo updated");
      fetchEmployees(currentTenantId);
    } catch {
      message.error("Upload failed");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleSuspendToggle = async (id, current) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ suspended: !current })
        .eq("id", id)
        .eq("tenant_id", currentTenantId);
      if (error) throw error;
      message.success(`Employee ${!current ? "suspended" : "activated"}`);
      fetchEmployees(currentTenantId);
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!currentTenantId) {
      message.error("Tenant not loaded. Please refresh and try again.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id)
        .eq("tenant_id", currentTenantId)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("No employee record was deleted");
      }
      message.success("Employee deleted");
      await fetchEmployees(currentTenantId);
    } catch (e) {
      console.error("Delete failed:", e);
      message.error(
        "Delete failed. You may not have permission, or this employee no longer exists.",
      );
    }
  };

  const showDeleteConfirm = (employee) =>
    Modal.confirm({
      title: "Delete Employee",
      icon: <AlertCircle size={16} color={dark ? "#fca5a5" : "#cf1322"} />,
      content: `Permanently remove ${employee.full_name}?`,
      okType: "danger",
      centered: true,
      okButtonProps: {
        style: dark
          ? {
              background: "#ef4444",
              borderColor: "#ef4444",
              color: "#ffffff",
            }
          : undefined,
      },
      cancelButtonProps: {
        style: dark
          ? {
              background: "#202127",
              borderColor: "#2a2b31",
              color: "#f3f4f6",
            }
          : undefined,
      },
      styles: dark
        ? {
            content: {
              background: "#1a1b1f",
              border: "1px solid #2a2b31",
            },
            header: { background: "#1a1b1f" },
            body: { color: "#f3f4f6" },
            footer: { background: "#1a1b1f" },
          }
        : undefined,
      onOk: () => handleDelete(employee.id),
    });

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingEmployee(null);
    setProfilePicUrl(null);
    form.resetFields();
  };

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => !e.suspended).length,
      suspended: employees.filter((e) => e.suspended).length,
      managers: employees.filter((e) => e.role === "project_manager").length,
    }),
    [employees],
  );

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        const q = search.toLowerCase();
        const mSearch =
          !q ||
          e.full_name?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.job_title?.toLowerCase().includes(q) ||
          e.teams?.name?.toLowerCase().includes(q);
        const mRole = filterRole === "all" || e.role === filterRole;
        const mStatus =
          filterStatus === "all" ||
          (filterStatus === "active" ? !e.suspended : e.suspended);
        return mSearch && mRole && mStatus;
      }),
    [employees, search, filterRole, filterStatus],
  );

  /* ---------------- Employee Card ---------------- */
  const EmployeeCard = ({ emp }) => {
    const rc = dark
      ? ROLE_COLORS_DARK[emp.role] || ROLE_COLORS_DARK.employee
      : ROLE_COLORS[emp.role] || ROLE_COLORS.employee;
    return (
      <div className="ep-card">
        <div className="ep-card-top">
          <div className="ep-av-wrap">
            {emp.user_photo ? (
              <Avatar
                size={52}
                src={emp.user_photo}
                style={{ borderRadius: 12 }}
              />
            ) : (
              <Avatar
                size={52}
                style={{
                  borderRadius: 12,
                  background: getAvatarColor(emp.full_name || ""),
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {getInitials(emp.full_name)}
              </Avatar>
            )}
            <span
              className="ep-status-pip"
              style={{ background: emp.suspended ? "#ff4d4f" : "#52c41a" }}
            />
          </div>
          <div className="ep-card-meta">
            <p className="ep-card-name">{emp.full_name || "N/A"}</p>
            <span
              className="ep-role-pill"
              style={{
                background: rc.bg,
                color: rc.text,
                borderColor: rc.border,
              }}
            >
              {emp.role === "project_manager" ? "Project Manager" : "Employee"}
            </span>
          </div>
        </div>

        <div className="ep-card-body">
          <div className="ep-row">
            <Mail size={12} className="lc" />
            <span title={emp.email}>{emp.email || "N/A"}</span>
          </div>
          {emp.contact && (
            <div className="ep-row">
              <Phone size={12} className="lc" />
              <span>{emp.contact}</span>
            </div>
          )}
          <div className="ep-row">
            <Users size={12} className="lc" />
            <span>{emp.teams?.name || "No team"}</span>
          </div>
          {emp.timezone && (
            <div className="ep-row">
              <Globe size={12} className="lc" />
              <span>{emp.timezone}</span>
            </div>
          )}
          {emp.working_hours != null && (
            <div className="ep-row">
              <Clock size={12} className="lc" />
              <span>{emp.working_hours} hrs / day</span>
            </div>
          )}
          {emp.job_title && (
            <div className="ep-row">
              <Briefcase size={12} className="lc" />
              <span>{emp.job_title}</span>
            </div>
          )}
          {emp.employment_type && (
            <div className="ep-row">
              <Briefcase size={12} className="lc" />
              <span className="ep-salary-badge">
                {EMPLOYMENT_TYPES.find((t) => t.value === emp.employment_type)
                  ?.label || emp.employment_type}
              </span>
            </div>
          )}
          {emp.skills?.length > 0 && (
            <div className="ep-row" style={{ flexWrap: "wrap", gap: 4 }}>
              {emp.skills.slice(0, 3).map((s) => (
                <span key={s} className="ep-skill-tag">
                  {s}
                </span>
              ))}
              {emp.skills.length > 3 && (
                <span style={{ color: "var(--ep-muted)", fontSize: 10.5 }}>
                  +{emp.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="ep-sep" />
        <div className="ep-actions">
          <button
            className="ep-btn view"
            onClick={() => navigate(`/employees/${emp.id}`)}
          >
            <Eye size={12} /> View
          </button>
          <button
            className="ep-btn edit"
            onClick={() => handleEditEmployee(emp)}
          >
            <Pencil size={12} /> Edit
          </button>
          <button
            className={`ep-btn ${emp.suspended ? "activate" : "suspend"}`}
            onClick={() => handleSuspendToggle(emp.id, emp.suspended)}
          >
            {emp.suspended ? (
              <>
                <CheckCircle2 size={12} /> Activate
              </>
            ) : (
              <>
                <Ban size={12} /> Suspend
              </>
            )}
          </button>
          <button
            className="ep-btn del"
            onClick={() => showDeleteConfirm(emp)}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  /* --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- RENDER ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
  return (
    <div
      className={`ep${dark ? " dark" : ""}`}
      style={{
        background: "var(--ep-bg)",
        minHeight: "100vh",
        color: "var(--ep-text)",
        padding: isMobile ? "12px" : "16px",
        boxSizing: "border-box",
      }}
    >
      {/* ---------------- User Limit Alert -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
      {isUserLimitReached &&
        maxUsers !== null &&
        maxUsers !== undefined && (
        <div
          style={{
            background: dark
              ? "rgba(239, 68, 68, 0.12)"
              : "rgba(239, 68, 68, 0.05)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            padding: isMobile ? "12px 14px" : "12px 20px",
            borderRadius: 10,
            margin: 0,
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <AlertCircle size={18} color="#ef4444" strokeWidth={2} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#ef4444",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              User Limit Reached
            </div>
            <div
              style={{
                fontSize: 12,
                color: dark ? "#fca5a5" : "#dc2626",
                marginTop: 2,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              You have reached the maximum of {maxUsers} user{maxUsers !== 1 ? "s" : ""} allowed on your current plan.
            </div>
          </div>
          <button
            onClick={() => navigate("/subscription")}
            style={{
              padding: "6px 14px",
              borderRadius: 7,
              border: "1px solid #ef4444",
              background: "transparent",
              color: "#ef4444",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              width: isMobile ? "100%" : "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Upgrade
          </button>
        </div>
      )}

      <style>{CSS}</style>

      {/* Header */}
      <div className="ep-header">
        <div>
          <h1 className="ep-title">Employees</h1>
          <p className="ep-sub">Manage your team across the organisation</p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            width: isMobile ? "100%" : "auto",
            flexWrap: isMobile ? "wrap" : "nowrap",
          }}
        >
            {!isUserLimitReached && (
              <Button
                type="primary"
              icon={<Plus size={14} />}
              className="ep-add-btn"
              onClick={() => setDrawerVisible(true)}
              block={isMobile}
            >
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="ep-stats">
        {[
          {
            n: stats.total,
            label: "Total",
            color: "var(--ep-text)",
            dot: "var(--ep-muted-2)",
          },
          {
            n: stats.active,
            label: "Active",
            color: "#389e0d",
            dot: "#52c41a",
          },
          {
            n: stats.suspended,
            label: "Suspended",
            color: "#cf1322",
            dot: "#ff4d4f",
          },
          {
            n: stats.managers,
            label: "Managers",
            color: "#1677ff",
            dot: "#1677ff",
          },
        ].map((s) => (
          <div className="ep-stat" key={s.label}>
            <div className="ep-stat-n" style={{ color: s.color }}>
              {s.n}
            </div>
            <div className="ep-stat-l">
              <span className="ep-dot" style={{ background: s.dot }} />
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="ep-toolbar">
        <div className="ep-search-wrap">
          <Search size={13} className="ep-search-icon" />
          <input
            placeholder="Search name, email or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterRole}
          onChange={setFilterRole}
          classNames={dark ? { popup: { root: "ep-dark-popup" } } : undefined}
          style={{ width: isMobile ? "100%" : 158 }}
          options={[
            { label: "All Roles", value: "all" },
            { label: "Employee", value: "employee" },
            { label: "Project Manager", value: "project_manager" },
          ]}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          classNames={dark ? { popup: { root: "ep-dark-popup" } } : undefined}
          style={{ width: isMobile ? "100%" : 140 }}
          options={[
            { label: "All Status", value: "all" },
            { label: "Active", value: "active" },
            { label: "Suspended", value: "suspended" },
          ]}
        />
        <span className="ep-count">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
        <div className="ep-view-toggle">
          <button
            className={`ep-vbtn ${viewMode === "card" ? "active" : ""}`}
            onClick={() => setViewMode("card")}
            title="Card view"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            className={`ep-vbtn ${viewMode === "table" ? "active" : ""}`}
            onClick={() => setViewMode("table")}
            title="Table view"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Content: skeleton - empty - data (never show empty while loading) */}
      {loading ? (
        /* ---------------- Skeleton ---------------- */
        viewMode === "card" ? (
          <div className="ep-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="ep-table-wrap">
            <div className="ep-table-scroll">
              <table className="ep-table">
                <thead>
                  <tr>
                    {[
                      "Employee",
                      "Team",
                      "Designation",
                      "Type",
                      "Skills",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonTableRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : filtered.length === 0 ? (
        /* ---------------- Empty state ---------------- */
        <div className="ep-empty">
          <div className="ep-empty-ico">
            <Users size={44} color="var(--ep-empty)" strokeWidth={1.5} />
          </div>
          <div className="ep-empty-text">
            {search || filterRole !== "all" || filterStatus !== "all"
              ? "No employees match your filters"
              : "No employees yet"}
          </div>
          <div className="ep-empty-hint">
            {!(search || filterRole !== "all" || filterStatus !== "all") &&
              'Click "Add Employee" to get started'}
          </div>
        </div>
      ) : viewMode === "card" ? (
        /* ---------------- Card grid ---------------- */
        <div className="ep-grid">
          {filtered.map((emp) => (
            <EmployeeCard key={emp.id} emp={emp} />
          ))}
        </div>
      ) : (
        /* ---------------- Table ---------------- */
        <div className="ep-table-wrap">
          <div className="ep-table-scroll">
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Team</th>
                  <th>Designation</th>
                  <th>Type</th>
                  <th>Skills</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => {
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="ep-table-name">
                          <div className="ep-av-wrap" style={{ flexShrink: 0 }}>
                            {emp.user_photo ? (
                              <Avatar
                                size={36}
                                src={emp.user_photo}
                                style={{ borderRadius: 8 }}
                              />
                            ) : (
                              <Avatar
                                size={36}
                                style={{
                                  borderRadius: 8,
                                  background: getAvatarColor(emp.full_name || ""),
                                  fontSize: 13,
                                  fontWeight: 700,
                                }}
                              >
                                {getInitials(emp.full_name)}
                              </Avatar>
                            )}
                            <span
                              className="ep-status-pip"
                              style={{
                                background: emp.suspended ? "#ff4d4f" : "#52c41a",
                                width: 9,
                                height: 9,
                              }}
                            />
                          </div>
                          <div>
                            <div
                              className="ep-table-name-text"
                              onClick={() => navigate(`/employees/${emp.id}`)}
                            >
                              {emp.full_name || "N/A"}
                            </div>
                            <div className="ep-table-email">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--ep-sub)" }}>
                        {emp.teams?.name || (
                          <span style={{ color: "var(--ep-empty)" }}>N/A</span>
                        )}
                      </td>
                      <td style={{ color: "var(--ep-sub)" }}>
                        {emp.job_title || (
                          <span style={{ color: "var(--ep-empty)" }}>N/A</span>
                        )}
                      </td>
                      <td>
                        {emp.employment_type ? (
                          <span className="ep-salary-badge">
                            {EMPLOYMENT_TYPES.find(
                              (t) => t.value === emp.employment_type,
                            )?.label || emp.employment_type}
                          </span>
                        ) : (
                          <span style={{ color: "var(--ep-empty)" }}>N/A</span>
                        )}
                      </td>
                      <td>
                        <div
                          style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                        >
                          {(emp.skills || []).slice(0, 2).map((s) => (
                            <span key={s} className="ep-skill-tag">
                              {s}
                            </span>
                          ))}
                          {(emp.skills || []).length > 2 && (
                            <span style={{ color: "var(--ep-muted)", fontSize: 10.5 }}>
                              +{emp.skills.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            background: emp.suspended
                              ? dark
                                ? "rgba(239,68,68,0.16)"
                                : "#fff1f0"
                              : dark
                                ? "rgba(34,197,94,0.16)"
                                : "#f6ffed",
                            color: emp.suspended
                              ? dark
                                ? "#fca5a5"
                                : "#cf1322"
                              : dark
                                ? "#86efac"
                                : "#389e0d",
                            border: `1px solid ${
                              emp.suspended
                                ? dark
                                  ? "rgba(239,68,68,0.35)"
                                  : "#ffccc7"
                                : dark
                                  ? "rgba(34,197,94,0.35)"
                                  : "#b7eb8f"
                            }`,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: emp.suspended ? "#ff4d4f" : "#52c41a",
                              display: "inline-block",
                            }}
                          />
                          {emp.suspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 2 }}>
                          <button
                            className="ep-btn view"
                            onClick={() => navigate(`/employees/${emp.id}`)}
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            className="ep-btn edit"
                            onClick={() => handleEditEmployee(emp)}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            className={`ep-btn ${emp.suspended ? "activate" : "suspend"}`}
                            onClick={() =>
                              handleSuspendToggle(emp.id, emp.suspended)
                            }
                            title={emp.suspended ? "Activate" : "Suspend"}
                          >
                            {emp.suspended ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <Ban size={12} />
                            )}
                          </button>
                          <button
                            className="ep-btn del"
                            onClick={() => showDeleteConfirm(emp)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------ Drawer -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
      <Drawer
        title={
          <span
            style={{
              fontFamily: "DM Sans,sans-serif",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {editingEmployee ? "Edit Employee" : "New Employee"}
          </span>
        }
        placement="right"
        open={drawerVisible}
        rootClassName={dark ? "ep-dark-drawer" : undefined}
        onClose={closeDrawer}
        size={isMobile ? "default" : "large"}
        extra={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button onClick={closeDrawer} block={isMobile}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={() => form.submit()}
              block={isMobile}
              style={{
                background: dark ? "#e2e8f0" : "#0a0a0a",
                borderColor: dark ? "#e2e8f0" : "#0a0a0a",
                color: dark ? "#111111" : "#ffffff",
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              {editingEmployee ? "Update" : "Create"}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleAddEmployee}>
          {/* Avatar */}
          {editingEmployee && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <div style={{ textAlign: "center" }}>
                {profilePicUrl ? (
                  <Avatar
                    size={88}
                    src={profilePicUrl}
                    style={{ borderRadius: 16 }}
                  />
                ) : (
                  <Avatar
                    size={88}
                    style={{
                      borderRadius: 16,
                      background: getAvatarColor(
                        editingEmployee?.full_name || "",
                      ),
                      fontSize: 28,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(editingEmployee?.full_name)}
                  </Avatar>
                )}
                <div style={{ marginTop: 10 }}>
                  <Upload
                    beforeUpload={handleUploadProfilePicture}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button
                      icon={<UploadIcon size={13} />}
                      loading={uploading}
                      size="small"
                    >
                      Upload Photo
                    </Button>
                  </Upload>
                </div>
              </div>
            </div>
          )}

          {/* Personal */}
          <p className="ds-sec">Personal Info</p>
          <div
            style={twoColGrid}
          >
            <Form.Item
              name="full_name"
              label="Full Name"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Jane Doe" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true }, { type: "email" }]}
            >
              <Input
                placeholder="jane@company.com"
                disabled={!!editingEmployee}
              />
            </Form.Item>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true }]}
              initialValue="employee"
            >
              <Select classNames={dark ? { popup: { root: "ep-dark-popup" } } : undefined}>
                <Select.Option value="employee">Employee</Select.Option>
                <Select.Option value="project_manager">
                  Project Manager
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="nationality" label="Nationality / Country">
              <Input placeholder="e.g. Pakistani, American" />
            </Form.Item>
            <Form.Item name="contact" label="Contact">
              <Input placeholder="+1 555 000 0000" />
            </Form.Item>
            <Form.Item name="cnic" label="National ID / Passport">
              <Input placeholder="ID or passport number" />
            </Form.Item>
            <Form.Item name="dob" label="Date of Birth">
              <DatePicker
                classNames={dark ? { popup: { root: "ep-dark-popup" } } : undefined}
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item name="languages" label="Languages Spoken">
              <Select
                mode="multiple"
                placeholder="Select languages"
                allowClear
                classNames={dark ? { popup: { root: "ep-dark-popup" } } : undefined}
              >
                {LANGUAGES.map((l) => (
                  <Select.Option key={l} value={l}>
                    {l}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="address" label="Address">
            <TextArea rows={2} placeholder="Street, City, Country" />
          </Form.Item>

          {/* Emergency Contact */}
          <p className="ds-sec">Emergency Contact</p>
          <div
            style={twoColGrid}
          >
            <Form.Item name="emergency_contact_name" label="Contact Name">
              <Input placeholder="Full name" />
            </Form.Item>
            <Form.Item name="emergency_contact_phone" label="Contact Phone">
              <Input placeholder="+1 555 000 0000" />
            </Form.Item>
          </div>

          {/* Work */}
          <p className="ds-sec">Work Details</p>
          <div
            style={twoColGrid}
          >
            <Form.Item name="employment_type" label="Employment Type">
              <Select
                placeholder="Select type"
                classNames={dark ? { popup: { root: "ep-dark-popup" } } : undefined}
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <Select.Option key={t.value} value={t.value}>
                    {t.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="job_title" label="Designation">
              <Input placeholder="e.g. Senior Frontend Developer" />
            </Form.Item>
            <Form.Item name="timezone" label="Timezone">
              <Select
                placeholder="Select timezone"
                showSearch
                classNames={dark ? { popup: { root: "ep-dark-popup" } } : undefined}
              >
                {TIMEZONES.map((tz) => (
                  <Select.Option key={tz} value={tz}>
                    {tz}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="github_username" label="GitHub Username">
              <Input placeholder="username" prefix="@" />
            </Form.Item>
            <Form.Item name="linkedin_url" label="LinkedIn Profile">
              <Input placeholder="linkedin.com/in/username" />
            </Form.Item>
            <Form.Item name="portfolio_url" label="Portfolio / Website">
              <Input placeholder="https://yoursite.com" />
            </Form.Item>
            <Form.Item name="experience_years" label="Years of Experience">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={60}
                placeholder="5"
                addonAfter="yrs"
              />
            </Form.Item>
            <Form.Item name="team_id" label="Team">
              <Select
                placeholder="Select team"
                allowClear
                classNames={dark ? { popup: { root: "ep-dark-popup" } } : undefined}
              >
                {teams.map((t) => (
                  <Select.Option key={t.id} value={t.id}>
                    {t.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="working_hours" label="Working Hours / Day">
              <InputNumber
                style={{ width: "100%" }}
                placeholder="8"
                min={1}
                max={24}
                precision={1}
                addonAfter="hrs"
              />
            </Form.Item>
          </div>

          <Form.Item name="skills" label="Skills">
            <Select
              mode="multiple"
              placeholder="Add skills..."
              allowClear
              showSearch
              classNames={dark ? { popup: { root: "ep-dark-popup" } } : undefined}
            >
              {SKILL_OPTIONS.map((s) => (
                <Select.Option key={s} value={s}>
                  {s}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Salary */}
          <p className="ds-sec">Compensation</p>
          <div
            style={twoColGrid}
          >
            {/* Currency with "Other" option */}
            <Form.Item name="currency" label="Salary Currency">
              <Select
                placeholder="Select currency"
                showSearch
                classNames={dark ? { popup: { root: "ep-dark-popup" } } : undefined}
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {CURRENCIES.map((c) => (
                  <Select.Option key={c.code} value={c.code}>
                    {c.code === "OTHER"
                      ? "Other (type manually)"
                       : `${c.symbol} ${c.code} - ${c.name}`}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Show custom currency input when OTHER is selected */}
            <Form.Item
              noStyle
              shouldUpdate={(p, c) => p.currency !== c.currency}
            >
              {({ getFieldValue }) =>
                getFieldValue("currency") === "OTHER" ? (
                  <Form.Item
                    name="custom_currency"
                    label="Currency Code / Name"
                    rules={[
                      { required: true, message: "Please enter a currency" },
                    ]}
                  >
                    <Input placeholder="e.g. BTC, USDT, XOF..." />
                  </Form.Item>
                ) : (
                  <div />
                )
              }
            </Form.Item>

            <Form.Item name="salary_type" label="Salary Type">
              <Select
                placeholder="Select type"
                classNames={dark ? { popup: { root: "ep-dark-popup" } } : undefined}
              >
                <Select.Option value="fixed">Fixed</Select.Option>
                <Select.Option value="base_commission">
                  Base + Commission
                </Select.Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            noStyle
            shouldUpdate={(p, c) => p.salary_type !== c.salary_type}
          >
            {({ getFieldValue }) => {
              const t = getFieldValue("salary_type");
              if (t === "fixed")
                return (
                  <Form.Item name="salary_amount" label="Salary Amount">
                    <InputNumber
                      style={{ width: "100%" }}
                      min={0}
                      placeholder="50000"
                    />
                  </Form.Item>
                );
              if (t === "base_commission")
                return (
                  <div
                    style={{
                      ...twoColGrid,
                    }}
                  >
                    <Form.Item name="base_salary" label="Base Salary">
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        placeholder="30000"
                      />
                    </Form.Item>
                    <Form.Item
                      name="commission_rate"
                      label="Commission Rate (%)"
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        max={100}
                        placeholder="10"
                      />
                    </Form.Item>
                  </div>
                );
              return null;
            }}
          </Form.Item>

          {/* Bank - free text, worldwide */}
          <p className="ds-sec">Allowances</p>
          <Form.List name="allowance_items">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <div
                    key={field.key}
                    style={listRowGrid}
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, "label"]}
                      rules={[{ required: true, message: "Enter allowance name" }]}
                    >
                      <Input placeholder="e.g. Travel Allowance" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, "amount"]}
                      rules={[{ required: true, message: "Enter amount" }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        placeholder="0"
                      />
                    </Form.Item>
                    <Button
                      danger
                      onClick={() => remove(field.name)}
                      icon={<X size={13} />}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ label: "", amount: 0 })}
                  icon={<Plus size={14} />}
                >
                  Add Allowance
                </Button>
              </>
            )}
          </Form.List>

          <p className="ds-sec">Tax Deductions</p>
          <Form.List name="tax_deduction_items">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <div
                    key={field.key}
                    style={listRowGrid}
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, "label"]}
                      rules={[{ required: true, message: "Enter deduction name" }]}
                    >
                      <Input placeholder="e.g. Income Tax" />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, "amount"]}
                      rules={[{ required: true, message: "Enter amount" }]}
                    >
                      <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        placeholder="0"
                      />
                    </Form.Item>
                    <Button
                      danger
                      onClick={() => remove(field.name)}
                      icon={<X size={13} />}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ label: "", amount: 0 })}
                  icon={<Plus size={14} />}
                >
                  Add Tax Deduction
                </Button>
              </>
            )}
          </Form.List>

          <p className="ds-sec">Bank Details</p>
          <div
            style={twoColGrid}
          >
            <Form.Item
              name="bank_name"
              label="Bank Name"
              help={
                <span className="bank-hint">
                  <Building2 size={11} />
                  Type any bank name worldwide
                </span>
              }
            >
              <Input placeholder="e.g. HSBC, Chase, Meezan Bank..." />
            </Form.Item>
            <Form.Item name="bank_account_name" label="Account Holder Name">
              <Input placeholder="As on bank records" />
            </Form.Item>
            <Form.Item name="bank_account_number" label="Account / IBAN Number">
              <Input placeholder="IBAN or account number" />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default Employees;


