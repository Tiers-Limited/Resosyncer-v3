import { useState, useEffect, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Avatar,
  DatePicker,
  Select,
  InputNumber,
  Modal,
  Tag,
} from "antd";
import {
  User,
  Lock,
  Mail,
  Briefcase,
  Globe,
  Clock,
  AlertCircle,
  Shield,
  Camera,
  Check,
  DollarSign,
  Building2,
  FileText,
  Download,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import dayjs from "dayjs";

const { TextArea } = Input;
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

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

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const otpEmailHtml = (otp, name) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:460px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <div style="background:#0b1f5e;color:#fff;padding:20px 24px;">
      <h2 style="margin:0;font-size:18px;font-weight:700;">Email verification code</h2>
      <p style="margin:8px 0 0;font-size:13px;opacity:0.9;">Hi ${name}, use this code to enable email 2FA.</p>
    </div>
    <div style="padding:22px 24px;background:#f8fafc;">
      <div style="background:#fff;border:1px dashed #cbd5e1;border-radius:10px;padding:18px;text-align:center;">
        <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#0f172a;font-family:monospace;">${otp}</div>
        <p style="margin:8px 0 0;font-size:12px;color:#64748b;">Expires in 10 minutes</p>
      </div>
    </div>
  </div>
`;

/* ─── Constants ─────────────────────────────────────────────────────── */
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
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

const isDarkModeActive = () => {
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/* ─── CSS ─────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

.ep-prof { font-family:'DM Sans',-apple-system,sans-serif; max-width:960px; }

.ep-prof-header { margin-bottom:28px; }
.ep-prof-title  { font-size:24px; font-weight:700; color:#0a0a0a; margin:0; letter-spacing:-.4px; }
.ep-prof-sub    { font-size:13px; color:#9a9a9a; margin:3px 0 0; }

.ep-hero { background:#fff; border:1px solid #ebebeb; border-radius:20px; padding:28px; margin-bottom:20px; display:flex; align-items:center; gap:24px; flex-wrap:wrap; }
.ep-av-wrap { position:relative; flex-shrink:0; }
.ep-av-upload { position:absolute; bottom:0; right:0; width:28px; height:28px; border-radius:50%; background:#0a0a0a; border:2.5px solid #fff; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .15s; }
.ep-av-upload:hover { background:#333; }
.ep-hero-info { flex:1; min-width:0; }
.ep-hero-name { font-size:20px; font-weight:700; color:#0a0a0a; margin:0 0 3px; }
.ep-hero-role { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; color:#9a9a9a; margin-bottom:10px; }
.ep-hero-chips { display:flex; flex-wrap:wrap; gap:6px; }
.ep-chip { display:inline-flex; align-items:center; gap:5px; background:#f5f5f5; border-radius:7px; padding:4px 10px; font-size:11.5px; font-weight:600; color:#6a6a6a; }
.ep-chip svg { color:#b0b0b0; }

.ep-salary-card { background:linear-gradient(135deg,#0a0a0a 0%,#1e293b 100%); border-radius:16px; padding:20px 24px; color:#fff; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:20px; }
.ep-salary-label { font-size:10.5px; text-transform:uppercase; letter-spacing:.7px; color:#64748b; font-weight:700; margin-bottom:4px; }
.ep-salary-value { font-size:22px; font-weight:700; color:#fff; letter-spacing:-.5px; }
.ep-salary-sub   { font-size:11.5px; color:#64748b; margin-top:2px; }
.ep-salary-badge { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:8px 14px; text-align:right; }

.ep-tabs { display:flex; gap:2px; background:#f5f5f5; border-radius:12px; padding:3px; margin-bottom:20px; width:fit-content; }
.ep-tab  { border:none; background:transparent; cursor:pointer; padding:8px 18px; border-radius:9px; font-size:13px; font-weight:600; color:#9a9a9a; font-family:'DM Sans',sans-serif; transition:all .15s; display:flex; align-items:center; gap:6px; white-space:nowrap; }
.ep-tab.active  { background:#fff; color:#0a0a0a; box-shadow:0 1px 4px rgba(0,0,0,.1); }
.ep-tab:hover:not(.active) { color:#555; }

.ep-sec { background:#fff; border:1px solid #ebebeb; border-radius:16px; padding:24px; margin-bottom:16px; }
.ep-sec-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.7px; color:#b0b0b0; margin:0 0 18px; display:flex; align-items:center; gap:7px; }
.ep-sec-title svg { color:#d0d0d0; }

.ep-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:0 16px; }
@media(max-width:600px){ .ep-grid-2{grid-template-columns:1fr;} }

.ep-save-bar { display:flex; justify-content:flex-end; gap:8px; padding-top:4px; }
.ep-save-btn { background:#0a0a0a !important; border-color:#0a0a0a !important; border-radius:10px !important; font-weight:700 !important; font-family:'DM Sans',sans-serif !important; height:38px !important; display:flex !important; align-items:center !important; gap:6px !important; }
.ep-save-btn:hover { background:#2a2a2a !important; border-color:#2a2a2a !important; }

.ep-pw-card { background:#fff; border:1px solid #ebebeb; border-radius:16px; padding:28px; max-width:460px; }
.ep-pw-note { background:#f9fafb; border:1px solid #f0f0f0; border-radius:10px; padding:12px 14px; font-size:12.5px; color:#6a6a6a; display:flex; align-items:flex-start; gap:8px; margin-bottom:20px; }
.ep-pw-note svg { color:#b0b0b0; flex-shrink:0; margin-top:1px; }

.ep-info-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:13px; }
.ep-info-row:last-child { border-bottom:none; }
.ep-info-label { color:#9a9a9a; font-weight:500; display:flex; align-items:center; gap:6px; }
.ep-info-val   { color:#0a0a0a; font-weight:600; }

.ep-prof .ant-form-item-label > label { font-size:13px; font-weight:600; color:#4a4a4a; font-family:'DM Sans',sans-serif; }
.ep-prof .ant-input, .ep-prof .ant-input-number, .ep-prof .ant-picker,
.ep-prof .ant-select-selector { border-radius:9px !important; font-family:'DM Sans',sans-serif !important; }
.ep-prof .ant-form-item { margin-bottom:14px; }

.ep-prof.dark { color:#e5e7eb; }
.ep-prof.dark .ep-prof-title { color:#f3f4f6; }
.ep-prof.dark .ep-prof-sub { color:#9ca3af; }
.ep-prof.dark .ep-hero,
.ep-prof.dark .ep-sec,
.ep-prof.dark .ep-pw-card {
  background:#1a1b1f;
  border-color:#2a2b31;
}
.ep-prof.dark .ep-hero-name { color:#f3f4f6; }
.ep-prof.dark .ep-hero-role { color:#9ca3af; }
.ep-prof.dark .ep-chip {
  background:#202127;
  color:#d1d5db;
}
.ep-prof.dark .ep-chip svg { color:#9ca3af; }
.ep-prof.dark .ep-tabs {
  background:#202127;
  border:1px solid #2a2b31;
}
.ep-prof.dark .ep-tab { color:#9ca3af; }
.ep-prof.dark .ep-tab.active {
  background:#141416;
  color:#f3f4f6;
  box-shadow:none;
}
.ep-prof.dark .ep-tab:hover:not(.active) { color:#e5e7eb; }
.ep-prof.dark .ep-sec-title { color:#9ca3af; }
.ep-prof.dark .ep-sec-title svg { color:#9ca3af; }
.ep-prof.dark .ep-info-row { border-bottom-color:#2a2b31; }
.ep-prof.dark .ep-info-label { color:#9ca3af; }
.ep-prof.dark .ep-info-val { color:#f3f4f6; }
.ep-prof.dark .ep-pw-note {
  background:#202127;
  border-color:#2a2b31;
  color:#d1d5db;
}
.ep-prof.dark .ep-pw-note svg { color:#9ca3af; }
.ep-prof.dark .ant-form-item-label > label { color:#d1d5db !important; }
.ep-prof.dark .ant-input,
.ep-prof.dark .ant-input-number,
.ep-prof.dark .ant-input-number-input,
.ep-prof.dark .ant-picker,
.ep-prof.dark .ant-input-affix-wrapper,
.ep-prof.dark .ant-select-selector {
  background:#17181c !important;
  border-color:#2a2b31 !important;
  color:#f3f4f6 !important;
}
.ep-prof.dark .ant-input::placeholder,
.ep-prof.dark .ant-input-number-input::placeholder,
.ep-prof.dark .ant-input-affix-wrapper input::placeholder {
  color:#6b7280 !important;
}
.ep-prof.dark .ant-select-selection-placeholder { color:#6b7280 !important; }
.ep-prof.dark .ant-select-arrow,
.ep-prof.dark .ant-picker-suffix,
.ep-prof.dark .ant-picker-input > input,
.ep-prof.dark .ant-input-number-handler-wrap {
  color:#9ca3af !important;
}
.ep-prof.dark .ep-save-btn {
  background:#1d4ed8 !important;
  border-color:#1d4ed8 !important;
}
.ep-prof.dark .ep-save-btn:hover {
  background:#2563eb !important;
  border-color:#2563eb !important;
}
.ep-payslip-card {
  background:#fff;
  border:1px solid #ebebeb;
  border-radius:16px;
  padding:24px;
}
.ep-prof.dark .ep-payslip-card {
  background:#1a1b1f;
  border-color:#2a2b31;
}
.ep-payslip-head {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
  border-bottom:1px solid #ebebeb;
  padding-bottom:16px;
  margin-bottom:20px;
}
.ep-prof.dark .ep-payslip-head { border-bottom-color:#2a2b31; }
.ep-payslip-brand {
  font-size:19px;
  font-weight:800;
  letter-spacing:-.2px;
  color:#111827;
}
.ep-prof.dark .ep-payslip-brand { color:#f3f4f6; }
.ep-payslip-period {
  font-size:12.5px;
  color:#6b7280;
  margin-top:4px;
}
.ep-payslip-slugno {
  margin-top:8px;
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:4px 10px;
  border-radius:999px;
  background:#f3f4f6;
  color:#4b5563;
  font-size:11px;
  font-weight:600;
  border:1px solid #e5e7eb;
}
.ep-prof.dark .ep-payslip-slugno {
  background:#202127;
  color:#9ca3af;
  border-color:#2a2b31;
}
.ep-payslip-grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px 14px;
}
@media(max-width:700px){ .ep-payslip-grid{grid-template-columns:1fr;} }
.ep-payslip-item {
  background:#f8fafc;
  border:1px solid #e5e7eb;
  border-radius:10px;
  padding:12px 14px;
}
.ep-prof.dark .ep-payslip-item {
  background:#202127;
  border-color:#2a2b31;
}
.ep-payslip-label { font-size:11px; color:#6b7280; margin-bottom:3px; }
.ep-prof.dark .ep-payslip-label { color:#9ca3af; }
.ep-payslip-value { font-size:14px; font-weight:600; color:#111827; }
.ep-prof.dark .ep-payslip-value { color:#f3f4f6; }
.ep-payslip-summary {
  margin-top:16px;
  border:1px solid #e5e7eb;
  border-radius:12px;
  overflow:hidden;
}
.ep-prof.dark .ep-payslip-summary { border-color:#2a2b31; }
.ep-payslip-row {
  display:grid;
  grid-template-columns:1fr auto;
  gap:10px;
  align-items:center;
  padding:12px 14px;
  font-size:13px;
  border-bottom:1px solid #eef2f7;
}
.ep-prof.dark .ep-payslip-row { border-bottom-color:#2a2b31; }
.ep-payslip-row:last-child { border-bottom:none; }
.ep-payslip-row span:first-child { color:#6b7280; }
.ep-prof.dark .ep-payslip-row span:first-child { color:#9ca3af; }
.ep-payslip-row span:last-child { color:#111827; font-weight:700; }
.ep-prof.dark .ep-payslip-row span:last-child { color:#f3f4f6; }
.ep-payslip-row.total {
  background:#f9fafb;
}
.ep-prof.dark .ep-payslip-row.total { background:#17181c; }
.ep-payslip-note {
  margin-top:14px;
  font-size:12px;
  color:#6b7280;
  line-height:1.6;
}
.ep-prof.dark .ep-payslip-note { color:#9ca3af; }
.ep-payslip-brand-wrap {
  display:flex;
  align-items:flex-start;
  gap:12px;
}
.ep-payslip-logo {
  width:52px;
  height:52px;
  border-radius:10px;
  border:1px solid #e5e7eb;
  object-fit:cover;
  background:#fff;
}
.ep-prof.dark .ep-payslip-logo {
  border-color:#2a2b31;
  background:#202127;
}
.ep-payslip-logo-fallback {
  width:52px;
  height:52px;
  border-radius:10px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:18px;
  font-weight:800;
  color:#fff;
  background:#1f2937;
}
.ep-payslip-table-wrap {
  margin-top:16px;
  border:1px solid #e5e7eb;
  border-radius:12px;
  overflow:hidden;
}
.ep-prof.dark .ep-payslip-table-wrap { border-color:#2a2b31; }
.ep-payslip-table {
  width:100%;
  border-collapse:collapse;
}
.ep-payslip-table th,
.ep-payslip-table td {
  padding:10px 12px;
  font-size:12.5px;
  border-bottom:1px solid #eef2f7;
}
.ep-prof.dark .ep-payslip-table th,
.ep-prof.dark .ep-payslip-table td {
  border-bottom-color:#2a2b31;
}
.ep-payslip-table th {
  background:#f8fafc;
  color:#6b7280;
  font-weight:700;
  text-align:left;
}
.ep-prof.dark .ep-payslip-table th {
  background:#202127;
  color:#9ca3af;
}
.ep-payslip-table td {
  color:#111827;
}
.ep-prof.dark .ep-payslip-table td {
  color:#f3f4f6;
}
.ep-payslip-table tr:last-child td {
  border-bottom:none;
}
.ep-payslip-table td.amount {
  text-align:right;
  font-variant-numeric: tabular-nums;
}
.ep-payslip-table tr.total td {
  font-weight:700;
  background:#f9fafb;
}
.ep-prof.dark .ep-payslip-table tr.total td {
  background:#17181c;
}
.ep-slip-btn {
  background:#0b1f5e !important;
  border-color:#0b1f5e !important;
  color:#fff !important;
}
.ep-slip-btn:hover {
  background:#102a7a !important;
  border-color:#102a7a !important;
}
.ep-prof.dark .ep-slip-btn {
  background:#ffffff !important;
  border-color:#ffffff !important;
  color:#141416 !important;
}
.ep-prof.dark .ep-slip-btn:hover {
  background:#f3f4f6 !important;
  border-color:#f3f4f6 !important;
}
.ep-2fa-card {
  background:#f8fafc;
  border:1px solid #e5e7eb;
  border-radius:12px;
  padding:14px;
  margin-bottom:12px;
}
.ep-prof.dark .ep-2fa-card {
  background:#202127;
  border-color:#2a2b31;
}
.ep-2fa-title {
  font-size:13px;
  font-weight:700;
  color:#111827;
}
.ep-prof.dark .ep-2fa-title { color:#f3f4f6; }
.ep-2fa-desc {
  font-size:12px;
  color:#6b7280;
  margin-top:2px;
  line-height:1.5;
}
.ep-prof.dark .ep-2fa-desc { color:#9ca3af; }
.ep-2fa-row {
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
}
.ep-2fa-badge {
  margin-left:8px;
  border-radius:999px;
  font-size:10px;
  font-weight:700;
  border:0;
}
`;

/* ─── Salary display helper ─────────────────────────────────────────── */
const SalaryDisplay = ({ profile }) => {
  const cur = profile?.currency || "PKR";
  const sym = CURRENCIES.find((c) => c.code === cur)?.symbol || cur;
  if (profile?.salary_type === "fixed" && profile?.salary_amount) {
    return (
      <div className="ep-salary-card">
        <div>
          <div className="ep-salary-label">Monthly Salary</div>
          <div className="ep-salary-value">
            {sym} {parseFloat(profile.salary_amount).toLocaleString()}
          </div>
          <div className="ep-salary-sub">Fixed • {cur}</div>
        </div>
        <div className="ep-salary-badge">
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>
            TYPE
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            Fixed
          </div>
        </div>
      </div>
    );
  }
  if (profile?.salary_type === "base_commission") {
    return (
      <div className="ep-salary-card">
        <div>
          <div className="ep-salary-label">Base Salary</div>
          <div className="ep-salary-value">
            {sym} {parseFloat(profile.base_salary || 0).toLocaleString()}
          </div>
          <div className="ep-salary-sub">
            + {profile.commission_rate || 0}% commission
          </div>
        </div>
        <div className="ep-salary-badge">
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>
            TYPE
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            Base + Commission
          </div>
        </div>
      </div>
    );
  }
  return null;
};

/* ═══════════════════════════════════════════════════════════════════════ */
const EmployeeProfile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [dark, setDark] = useState(isDarkModeActive());
  const [companyBrand, setCompanyBrand] = useState("Your Company");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [generatingSlip, setGeneratingSlip] = useState(false);
  const [emailOtpEnabled, setEmailOtpEnabled] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetupVisible, setTotpSetupVisible] = useState(false);
  const [emailOtpSetupVisible, setEmailOtpSetupVisible] = useState(false);
  const [totpStep, setTotpStep] = useState(0);
  const [qrData, setQrData] = useState(null);
  const [totpSecret, setTotpSecret] = useState(null);
  const [totpFactorId, setTotpFactorId] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loadingTotp, setLoadingTotp] = useState(false);
  const [loadingEmailOtp, setLoadingEmailOtp] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [storedOtp, setStoredOtp] = useState(null);
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { profile, refreshProfile } = useAuth();

  // ─── This ref holds ALL field values across all tabs at all times ───
  const allValuesRef = useRef({});

  // ─── Seed ref + form when profile loads ────────────────────────────
  useEffect(() => {
    if (!profile) return;

    const knownCurrency = CURRENCIES.find(
      (c) => c.code === profile.currency && c.code !== "OTHER",
    );
    const initialValues = {
      full_name: profile.full_name,
      email: profile.email,
      contact: profile.contact,
      address: profile.address,
      bio: profile.bio,
      cnic: profile.cnic,
      dob: profile.dob ? dayjs(profile.dob) : null,
      nationality: profile.nationality,
      languages: profile.languages || [],
      employment_type: profile.employment_type,
      timezone: profile.timezone,
      github_username: profile.github_username,
      linkedin_url: profile.linkedin_url,
      portfolio_url: profile.portfolio_url,
      experience_years: profile.experience_years,
      working_hours: profile.working_hours,
      skills: profile.skills || [],
      emergency_contact_name: profile.emergency_contact_name,
      emergency_contact_phone: profile.emergency_contact_phone,
      bank_name: profile.bank_name,
      bank_account_number: profile.bank_account_number,
      bank_account_name: profile.bank_account_name,
      currency: knownCurrency
        ? profile.currency
        : profile.currency
          ? "OTHER"
          : undefined,
      custom_currency: knownCurrency ? "" : profile.currency,
    };

    // Store in ref AND set on form
    allValuesRef.current = initialValues;
    form.setFieldsValue(initialValues);
    setProfilePicUrl(profile.user_photo);
  }, [profile, form]);

  useEffect(() => {
    const syncTheme = () => setDark(isDarkModeActive());
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
    const resolveCompanyBrand = async () => {
      if (!profile) return;
      const profileCompany = profile.company_name || "";
      let resolvedName = profileCompany || "Your Company";
      let resolvedLogo = "";

      if (profileCompany) setCompanyBrand(profileCompany);

      if (!profile.tenant_id) {
        setCompanyBrand(resolvedName);
        setCompanyLogoUrl("");
        return;
      }
      try {
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("*")
          .eq("id", profile.tenant_id)
          .single();

        resolvedName = profileCompany || tenantData?.name || "Your Company";
        resolvedLogo =
          tenantData?.logo_url ||
          tenantData?.logo ||
          tenantData?.company_logo ||
          "";

        if (!resolvedLogo) {
          const { data: wsData } = await supabase
            .from("workspace_settings")
            .select("*")
            .eq("tenant_id", profile.tenant_id)
            .maybeSingle();
          resolvedLogo =
            wsData?.logo_url ||
            wsData?.company_logo ||
            wsData?.brand_logo_url ||
            "";
        }

        setCompanyBrand(resolvedName);
        setCompanyLogoUrl(resolvedLogo || "");
      } catch {
        setCompanyBrand(resolvedName);
        setCompanyLogoUrl("");
      }
    };
    resolveCompanyBrand();
  }, [profile]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    const loadTwoFactorStatus = async () => {
      if (!profile?.id) return;
      try {
        const { data } = await supabase
          .from("profiles")
          .select("totp_enabled, email_otp_enabled")
          .eq("id", profile.id)
          .single();
        setTotpEnabled(Boolean(data?.totp_enabled));
        setEmailOtpEnabled(Boolean(data?.email_otp_enabled));
      } catch {
        // no-op
      }
    };
    loadTwoFactorStatus();
  }, [profile?.id]);

  // ─── Sync form → ref on every field change ─────────────────────────
  const handleValuesChange = (_, allCurrentValues) => {
    allValuesRef.current = { ...allValuesRef.current, ...allCurrentValues };
  };

  // ─── When switching tabs: flush current tab's values into ref,
  //     then set ALL values from ref onto the form so the next tab
  //     mounts with its fields already populated ─────────────────────
  const handleTabSwitch = (tabKey) => {
    // Capture whatever is mounted right now before unmounting
    const currentFormValues = form.getFieldsValue();
    allValuesRef.current = { ...allValuesRef.current, ...currentFormValues };

    setActiveTab(tabKey);

    // After state update / re-render, restore full values to form
    setTimeout(() => {
      form.setFieldsValue(allValuesRef.current);
    }, 0);
  };

  // ─── Save: always use ref (complete data) ─────────────────────────
  const handleUpdateProfile = async () => {
    try {
      // Validate only the currently visible fields
      await form.validateFields();
    } catch {
      return;
    }

    // Flush latest visible values into ref before building payload
    const currentFormValues = form.getFieldsValue();
    allValuesRef.current = { ...allValuesRef.current, ...currentFormValues };

    const values = allValuesRef.current;

    setLoading(true);
    try {
      const resolvedCurrency =
        values.currency === "OTHER" ? values.custom_currency : values.currency;

      const updateData = {
        full_name: values.full_name,
        contact: values.contact,
        address: values.address,
        bio: values.bio,
        cnic: values.cnic || null,
        dob: values.dob ? dayjs(values.dob).format("YYYY-MM-DD") : null,
        nationality: values.nationality || null,
        languages: values.languages || [],
        employment_type: values.employment_type || null,
        timezone: values.timezone || null,
        github_username: values.github_username || null,
        linkedin_url: values.linkedin_url || null,
        portfolio_url: values.portfolio_url || null,
        experience_years: values.experience_years || null,
        working_hours: values.working_hours || null,
        skills: values.skills || [],
        emergency_contact_name: values.emergency_contact_name || null,
        emergency_contact_phone: values.emergency_contact_phone || null,
        bank_name: values.bank_name || null,
        bank_account_number: values.bank_account_number || null,
        bank_account_name: values.bank_account_name || null,
        currency: resolvedCurrency || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id);

      if (error) throw error;
      message.success("Profile updated successfully");
      refreshProfile();
    } catch (err) {
      message.error("Failed to update profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.new_password,
      });
      if (error) throw error;
      message.success("Password changed successfully");
      passwordForm.resetFields();
    } catch (err) {
      message.error("Failed to change password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProfilePicture = async (file) => {
    setUploading(true);
    try {
      if (profilePicUrl) {
        const oldPath = profilePicUrl.split("/").pop();
        await supabase.storage
          .from("profile-pictures")
          .remove([`${profile.id}/${oldPath}`]);
      }
      const filePath = `${profile.id}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);
      await supabase
        .from("profiles")
        .update({ user_photo: data.publicUrl })
        .eq("id", profile.id);
      setProfilePicUrl(data.publicUrl);
      message.success("Photo updated");
      refreshProfile();
    } catch {
      message.error("Upload failed");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const roleLabel =
    profile?.role === "project_manager" ? "Project Manager" : "Employee";
  const empType = EMPLOYMENT_TYPES.find(
    (t) => t.value === profile?.employment_type,
  )?.label;

  const TABS = [
    { key: "personal", label: "Personal", icon: <User size={13} /> },
    { key: "work", label: "Work", icon: <Briefcase size={13} /> },
    { key: "emergency", label: "Emergency", icon: <AlertCircle size={13} /> },
    { key: "bank", label: "Banking", icon: <Building2 size={13} /> },
    { key: "payslip", label: "Pay Slip", icon: <FileText size={13} /> },
    { key: "security", label: "Security", icon: <Shield size={13} /> },
    { key: "password", label: "Password", icon: <Shield size={13} /> },
  ];

  const currencyCode = profile?.currency || "PKR";
  const currencySymbol =
    CURRENCIES.find((c) => c.code === currencyCode)?.symbol || currencyCode;
  const baseSalary =
    profile?.salary_type === "fixed"
      ? Number(profile?.salary_amount || 0)
      : Number(profile?.base_salary || 0);
  const allowanceItemsRaw =
    Array.isArray(profile?.allowance_items) && profile.allowance_items.length > 0
      ? profile.allowance_items
      : Number(profile?.allowances || 0) > 0
        ? [{ label: "General Allowance", amount: Number(profile.allowances) }]
        : [];
  const deductionItemsRaw =
    Array.isArray(profile?.tax_deduction_items) &&
    profile.tax_deduction_items.length > 0
      ? profile.tax_deduction_items
      : Number(profile?.tax_deductions || 0) > 0
        ? [{ label: "Tax Deduction", amount: Number(profile.tax_deductions) }]
        : [];
  const allowanceItems = allowanceItemsRaw
    .map((item) => ({
      label: String(item?.label || "").trim() || "Allowance",
      amount: Number(item?.amount || 0),
    }))
    .filter((item) => item.amount >= 0);
  const deductionItems = deductionItemsRaw
    .map((item) => ({
      label: String(item?.label || "").trim() || "Deduction",
      amount: Number(item?.amount || 0),
    }))
    .filter((item) => item.amount >= 0);
  const totalAllowances = allowanceItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const totalDeductions = deductionItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );
  const grossSalary = baseSalary + totalAllowances;
  const netSalary = grossSalary - totalDeductions;
  const lastMonth = dayjs().subtract(1, "month");
  const payrollMonthLabel = lastMonth.format("MMMM YYYY");
  const payrollPeriodLabel = `${lastMonth.startOf("month").format("MMM D, YYYY")} - ${lastMonth.endOf("month").format("MMM D, YYYY")}`;
  const salaryTypeLabel =
    profile?.salary_type === "base_commission" ? "Base + Commission" : "Fixed";
  const totalEarnings = grossSalary;
  const currencyDisplay = `${currencySymbol} ${Number(netSalary || 0).toLocaleString()}`;
  const salarySlipNumber = `PS-${lastMonth.format("YYYYMM")}-${String(
    profile?.id || "EMP",
  )
    .slice(0, 6)
    .toUpperCase()}`;
  const earningsRows = [
    { label: "Base Salary", amount: baseSalary },
    ...allowanceItems,
  ];
  const deductionsRows = [...deductionItems];

  const formatCurrency = (amount = 0) =>
    `${currencySymbol} ${Number(amount || 0).toLocaleString()}`;

  const handleSetupTotp = async () => {
    setLoadingTotp(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error) throw error;
      setTotpFactorId(data.id);
      setQrData(data.totp.qr_code);
      setTotpSecret(data.totp.secret);
      setTotpStep(0);
      setTotpSetupVisible(true);
    } catch (e) {
      message.error("Failed to start authenticator setup");
    } finally {
      setLoadingTotp(false);
    }
  };

  const handleVerifyTotp = async () => {
    setLoadingTotp(true);
    try {
      if (!totpFactorId) throw new Error("Setup expired");
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: totpFactorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;
      await supabase
        .from("profiles")
        .update({ totp_enabled: true })
        .eq("id", profile.id);
      setTotpEnabled(true);
      setTotpSetupVisible(false);
      setVerifyCode("");
      setTotpFactorId(null);
      message.success("Authenticator app enabled");
    } catch {
      message.error("Verification failed");
    } finally {
      setLoadingTotp(false);
    }
  };

  const handleDisableTotp = () => {
    Modal.confirm({
      title: "Disable authenticator app?",
      content: "You will no longer use app-generated codes at login.",
      okText: "Disable",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const factors = await supabase.auth.mfa.listFactors();
          const factor = factors.data?.totp?.[0];
          if (factor) await supabase.auth.mfa.unenroll({ factorId: factor.id });
          await supabase
            .from("profiles")
            .update({ totp_enabled: false })
            .eq("id", profile.id);
          setTotpEnabled(false);
          message.success("Authenticator app disabled");
        } catch {
          message.error("Failed to disable authenticator");
        }
      },
    });
  };

  const sendOtpEmail = async () => {
    const otp = generateOtp();
    const expiry = Date.now() + 10 * 60 * 1000;
    setStoredOtp(otp);
    setOtpExpiry(expiry);
    setEmailOtpCode("");
    setResendCooldown(60);
    const emailRes = await sendEmail({
      to: profile?.email,
      subject: "Your verification code",
      body: otpEmailHtml(otp, profile?.full_name || "there"),
      companyName: companyBrand || "Resosyncer",
    });
    if (!emailRes.success) throw new Error("Email send failed");
  };

  const handleSetupEmailOtp = async () => {
    setLoadingEmailOtp(true);
    try {
      await sendOtpEmail();
      setEmailOtpSetupVisible(true);
      message.success("Verification code sent");
    } catch {
      message.error("Failed to send verification code");
    } finally {
      setLoadingEmailOtp(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (resendCooldown > 0) return;
    setLoadingEmailOtp(true);
    try {
      await sendOtpEmail();
      message.success("New code sent");
    } catch {
      message.error("Failed to resend code");
    } finally {
      setLoadingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setLoadingEmailOtp(true);
    try {
      if (!storedOtp || !otpExpiry) throw new Error("No pending code");
      if (Date.now() > otpExpiry) throw new Error("Code expired");
      if (emailOtpCode !== storedOtp) throw new Error("Invalid code");
      await supabase
        .from("profiles")
        .update({ email_otp_enabled: true })
        .eq("id", profile.id);
      setEmailOtpEnabled(true);
      setEmailOtpSetupVisible(false);
      setEmailOtpCode("");
      setStoredOtp(null);
      message.success("Email OTP enabled");
    } catch (e) {
      if (String(e.message).includes("expired")) {
        message.error("Code expired. Please request a new one.");
      } else if (String(e.message).includes("Invalid")) {
        message.error("Incorrect code");
      } else {
        message.error("Verification failed");
      }
    } finally {
      setLoadingEmailOtp(false);
    }
  };

  const handleDisableEmailOtp = () => {
    Modal.confirm({
      title: "Disable email OTP?",
      content: "You will stop receiving email verification codes at login.",
      okText: "Disable",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await supabase
            .from("profiles")
            .update({ email_otp_enabled: false })
            .eq("id", profile.id);
          setEmailOtpEnabled(false);
          message.success("Email OTP disabled");
        } catch {
          message.error("Failed to disable email OTP");
        }
      },
    });
  };

  const handleGenerateLastMonthSlip = async () => {
    setGeneratingSlip(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const PAGE_W = 595.28;
      const PAGE_H = 841.89;
      const MARGIN = 44;
      const CONTENT_W = PAGE_W - MARGIN * 2;

      const company = companyBrand || "Your Company";
      const employeeName = profile?.full_name || "Employee";
      const employeeEmail = profile?.email || "-";
      const employeeRole =
        profile?.role === "project_manager" ? "Project Manager" : "Employee";
      const pdfCurrencyCode = profile?.currency || "PKR";
      const formatPdfCurrency = (amount = 0) =>
        `${pdfCurrencyCode} ${Number(amount || 0).toLocaleString("en-US")}`;
      const amountText = formatPdfCurrency(netSalary);
      const slipNo = salarySlipNumber;
      const truncateToWidth = (text, maxWidth) => {
        const value = String(text || "-");
        if (doc.getTextWidth(value) <= maxWidth) return value;
        const ellipsis = "...";
        let out = value;
        while (out.length > 0 && doc.getTextWidth(`${out}${ellipsis}`) > maxWidth) {
          out = out.slice(0, -1);
        }
        return `${out}${ellipsis}`;
      };

      const loadImageAsDataUrl = async (url) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext("2d");
              if (!ctx) return reject(new Error("Canvas context unavailable"));
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/png"));
            } catch (err) {
              reject(err);
            }
          };
          img.onerror = reject;
          img.src = url;
        });

      // ── White background ──────────────────────────────────────────
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, PAGE_W, PAGE_H, "F");

      // ── Top navy bar ──────────────────────────────────────────────
      doc.setFillColor(10, 15, 36);
      doc.rect(0, 0, PAGE_W, 4, "F");

      // ── Header ────────────────────────────────────────────────────
      const HEADER_Y = 28;
      const BADGE = 34;

      if (companyLogoUrl) {
        try {
          const logoData = await loadImageAsDataUrl(companyLogoUrl);
          doc.addImage(logoData, "PNG", MARGIN, HEADER_Y, BADGE, BADGE);
        } catch {
          // fallback initials
          doc.setFillColor(10, 15, 36);
          doc.roundedRect(MARGIN, HEADER_Y, BADGE, BADGE, 5, 5, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(255, 255, 255);
          doc.text(
            company.slice(0, 2).toUpperCase(),
            MARGIN + BADGE / 2,
            HEADER_Y + BADGE / 2 + 4,
            { align: "center" },
          );
        }
      } else {
        doc.setFillColor(10, 15, 36);
        doc.roundedRect(MARGIN, HEADER_Y, BADGE, BADGE, 5, 5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(
          company.slice(0, 2).toUpperCase(),
          MARGIN + BADGE / 2,
          HEADER_Y + BADGE / 2 + 4,
          { align: "center" },
        );
      }

      // Company name + doc type
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(10, 15, 36);
      doc.text(company, MARGIN + BADGE + 10, HEADER_Y + 13);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(160, 160, 170);
      doc.text(
        `Salary Slip  ·  ${payrollMonthLabel}`,
        MARGIN + BADGE + 10,
        HEADER_Y + 26,
      );

      // Right meta
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(190, 190, 200);
      doc.text("SLIP NO.", PAGE_W - MARGIN, HEADER_Y + 10, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(10, 15, 36);
      doc.text(`#${slipNo}`, PAGE_W - MARGIN, HEADER_Y + 22, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(190, 190, 200);
      doc.text(dayjs().format("DD MMM YYYY"), PAGE_W - MARGIN, HEADER_Y + 33, {
        align: "right",
      });

      // ── Separator ─────────────────────────────────────────────────
      const sep = (y) => {
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.4);
        doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      };

      let Y = HEADER_Y + BADGE + 12;
      sep(Y);
      Y += 10;

      // ── Info grid (4 columns) ─────────────────────────────────────
      const infoField = (label, value, x, y) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(190, 190, 200);
        doc.text(label.toUpperCase(), x, y);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(10, 15, 36);
        const maxW = CONTENT_W / 4 - 6;
        doc.text(truncateToWidth(value || "-", maxW), x, y + 11);
      };

      const COL = CONTENT_W / 4;
      infoField("Employee", employeeName, MARGIN, Y);
      infoField("Role", employeeRole, MARGIN + COL, Y);
      infoField("Email", employeeEmail, MARGIN + COL * 2, Y);
      infoField("Pay Period", payrollPeriodLabel, MARGIN + COL * 3, Y);

      Y += 24;
      sep(Y);
      Y += 10;

      // ── Table helper ──────────────────────────────────────────────
      const drawTable = (title, rows, startY) => {
        // Section title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(10, 15, 36);
        doc.text(title.toUpperCase(), MARGIN, startY);

        // Column headers
        const CH_Y = startY + 12;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(190, 190, 200);
        doc.text("DESCRIPTION", MARGIN, CH_Y);
        doc.text("AMOUNT", PAGE_W - MARGIN, CH_Y, { align: "right" });
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.4);
        doc.line(MARGIN, CH_Y + 4, PAGE_W - MARGIN, CH_Y + 4);

        let rowY = CH_Y + 14;
        rows.forEach((r) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(68, 68, 80);
          doc.text(r.label, MARGIN, rowY);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(10, 15, 36);
          doc.text(formatPdfCurrency(r.amount), PAGE_W - MARGIN, rowY, {
            align: "right",
          });
          doc.setDrawColor(243, 244, 246);
          doc.setLineWidth(0.3);
          doc.line(MARGIN, rowY + 5, PAGE_W - MARGIN, rowY + 5);
          rowY += 16;
        });

        // Subtotal
        const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(160, 160, 170);
        doc.text(`Total ${title}`, MARGIN, rowY + 6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(10, 15, 36);
        doc.text(formatPdfCurrency(total), PAGE_W - MARGIN, rowY + 6, {
          align: "right",
        });

        return rowY + 16;
      };

      const afterEarnings = drawTable("Earnings", earningsRows, Y);
      Y = afterEarnings + 6;
      sep(Y);
      Y += 10;

      const afterDeductions = drawTable("Deductions", deductionsRows, Y);
      Y = afterDeductions + 6;
      sep(Y);
      Y += 10;

      // ── Net Pay box ───────────────────────────────────────────────
      doc.setDrawColor(10, 15, 36);
      doc.setLineWidth(0.5);
      doc.roundedRect(MARGIN, Y, CONTENT_W, 38, 4, 4, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 170);
      doc.text("Net Pay", MARGIN + 12, Y + 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(190, 190, 200);
      doc.text(payrollPeriodLabel, MARGIN + 12, Y + 26);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(10, 15, 36);
      doc.text(amountText, PAGE_W - MARGIN - 12, Y + 25, { align: "right" });

      // ── Footer ────────────────────────────────────────────────────
      const FOOTER_Y = PAGE_H - 38;
      sep(FOOTER_Y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(190, 190, 200);
      doc.text(
        "System-generated. For payroll queries, contact your admin.",
        MARGIN,
        FOOTER_Y + 12,
      );
      doc.text(
        "Confidential — intended solely for the named employee.",
        MARGIN,
        FOOTER_Y + 22,
      );
      doc.text("Page 1 of 1", PAGE_W - MARGIN, FOOTER_Y + 17, {
        align: "right",
      });

      // ── Bottom navy bar ───────────────────────────────────────────
      doc.setFillColor(10, 15, 36);
      doc.rect(0, PAGE_H - 4, PAGE_W, 4, "F");

      const filename = `salary-slip-${lastMonth.format("YYYY-MM")}.pdf`;
      doc.save(filename);
      message.success("Salary slip generated");
    } catch (err) {
      console.error(err);
      message.error("Unable to generate salary slip");
    } finally {
      setGeneratingSlip(false);
    }
  };

  // ─── Shared save button ─────────────────────────────────────────────
  const SaveBar = () => (
    <div className="ep-save-bar">
      <Button
        type="primary"
        onClick={handleUpdateProfile}
        loading={loading}
        className="ep-save-btn"
        icon={<Check size={13} />}
      >
        Save Changes
      </Button>
    </div>
  );

  return (
    <div
      className={`ep-prof${dark ? " dark" : ""}`}
      style={{
        minHeight: "100%",
        background: dark ? "#141416" : "transparent",
      }}
    >
      <style>{CSS}</style>

      {/* Page header */}
      <div className="ep-prof-header">
        <h1 className="ep-prof-title">My Profile</h1>
        <p className="ep-prof-sub">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Hero */}
      <div className="ep-hero">
        <div className="ep-av-wrap">
          {profilePicUrl ? (
            <Avatar
              size={80}
              src={profilePicUrl}
              style={{ borderRadius: 16 }}
            />
          ) : (
            <Avatar
              size={80}
              style={{
                borderRadius: 16,
                background: getAvatarColor(profile?.full_name || ""),
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {getInitials(profile?.full_name)}
            </Avatar>
          )}
          <Upload
            beforeUpload={handleUploadProfilePicture}
            showUploadList={false}
            accept="image/*"
          >
            <div className="ep-av-upload" title="Change photo">
              <Camera size={12} color="#fff" />
            </div>
          </Upload>
        </div>
        <div className="ep-hero-info">
          <div className="ep-hero-name">{profile?.full_name || "—"}</div>
          <div className="ep-hero-role">{roleLabel}</div>
          <div className="ep-hero-chips">
            {profile?.email && (
              <span className="ep-chip">
                <Mail size={11} />
                {profile.email}
              </span>
            )}
            {empType && (
              <span className="ep-chip">
                <Briefcase size={11} />
                {empType}
              </span>
            )}
            {profile?.timezone && (
              <span className="ep-chip">
                <Globe size={11} />
                {profile.timezone}
              </span>
            )}
            {profile?.working_hours && (
              <span className="ep-chip">
                <Clock size={11} />
                {profile.working_hours}h/day
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Salary (read-only) */}
      {profile?.salary_type && <SalaryDisplay profile={profile} />}

      {/* Tab nav */}
      <div className="ep-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`ep-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => handleTabSwitch(t.key)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Single Form wrapping ALL tabs ─────────────────────────────
           preserveValue keeps unmounted fields' values in the store  */}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        // Do NOT use onFinish here — we call handleUpdateProfile manually
      >
        {/* ── Personal Tab ── */}
        {activeTab === "personal" && (
          <>
            <div className="ep-sec">
              <div className="ep-sec-title">
                <User size={13} />
                Personal Information
              </div>
              <div className="ep-grid-2">
                <Form.Item
                  name="full_name"
                  label="Full Name"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Jane Doe" />
                </Form.Item>
                <Form.Item name="email" label="Email">
                  <Input disabled />
                </Form.Item>
                <Form.Item name="contact" label="Contact Number">
                  <Input placeholder="+1 555 000 0000" />
                </Form.Item>
                <Form.Item name="nationality" label="Nationality / Country">
                  <Input placeholder="e.g. Pakistani, American" />
                </Form.Item>
                <Form.Item name="cnic" label="National ID / Passport">
                  <Input placeholder="ID or passport number" />
                </Form.Item>
                <Form.Item name="dob" label="Date of Birth">
                  <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                </Form.Item>
                <Form.Item
                  name="languages"
                  label="Languages Spoken"
                  style={{ gridColumn: "span 2" }}
                >
                  <Select
                    mode="multiple"
                    placeholder="Select languages"
                    allowClear
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
              <Form.Item name="bio" label="Bio">
                <TextArea rows={3} placeholder="Tell us about yourself…" />
              </Form.Item>
            </div>
            <SaveBar />
          </>
        )}

        {/* ── Work Tab ── */}
        {activeTab === "work" && (
          <>
            <div className="ep-sec">
              <div className="ep-sec-title">
                <Briefcase size={13} />
                Work Details
              </div>
              <div className="ep-grid-2">
                <Form.Item name="employment_type" label="Employment Type">
                  <Select placeholder="Select type" disabled>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <Select.Option key={t.value} value={t.value}>
                        {t.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="timezone" label="Timezone">
                  <Select placeholder="Select timezone" showSearch>
                    {TIMEZONES.map((tz) => (
                      <Select.Option key={tz} value={tz}>
                        {tz}
                      </Select.Option>
                    ))}
                  </Select>
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
                <Form.Item name="working_hours" label="Working Hours / Day">
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    max={24}
                    precision={1}
                    placeholder="8"
                    addonAfter="hrs"
                    readOnly
                  />
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
              </div>
              <Form.Item name="skills" label="Skills">
                <Select
                  mode="multiple"
                  placeholder="Add skills…"
                  allowClear
                  showSearch
                >
                  {SKILL_OPTIONS.map((s) => (
                    <Select.Option key={s} value={s}>
                      {s}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            {(profile?.teams?.name ||
              profile?.job_title ||
              profile?.department) && (
              <div className="ep-sec">
                <div className="ep-sec-title">
                  <Lock size={13} />
                  Assigned by Admin
                </div>
                {profile?.teams?.name && (
                  <div className="ep-info-row">
                    <span className="ep-info-label">
                      <Briefcase size={12} />
                      Team
                    </span>
                    <span className="ep-info-val">{profile.teams.name}</span>
                  </div>
                )}
                {profile?.job_title && (
                  <div className="ep-info-row">
                    <span className="ep-info-label">
                      <Briefcase size={12} />
                      Job Title
                    </span>
                    <span className="ep-info-val">{profile.job_title}</span>
                  </div>
                )}
                {profile?.department && (
                  <div className="ep-info-row">
                    <span className="ep-info-label">
                      <Building2 size={12} />
                      Department
                    </span>
                    <span className="ep-info-val">{profile.department}</span>
                  </div>
                )}
                <p
                  style={{
                    fontSize: 11.5,
                    color: "#b0b0b0",
                    marginTop: 10,
                    marginBottom: 0,
                  }}
                >
                  Contact your admin to update these fields.
                </p>
              </div>
            )}
            <SaveBar />
          </>
        )}

        {/* ── Emergency Tab ── */}
        {activeTab === "emergency" && (
          <>
            <div className="ep-sec">
              <div className="ep-sec-title">
                <AlertCircle size={13} />
                Emergency Contact
              </div>
              <p style={{ fontSize: 13, color: "#9a9a9a", marginBottom: 18 }}>
                This information is only used in case of an emergency and is
                kept confidential.
              </p>
              <div className="ep-grid-2">
                <Form.Item name="emergency_contact_name" label="Contact Name">
                  <Input placeholder="Full name" />
                </Form.Item>
                <Form.Item name="emergency_contact_phone" label="Contact Phone">
                  <Input placeholder="+1 555 000 0000" />
                </Form.Item>
              </div>
            </div>
            <SaveBar />
          </>
        )}

        {/* ── Bank Tab ── */}
        {activeTab === "bank" && (
          <>
            <div className="ep-sec">
              <div className="ep-sec-title">
                <Building2 size={13} />
                Bank Details
              </div>
              <div className="ep-grid-2">
                <Form.Item
                  name="bank_name"
                  label="Bank Name"
                  help={
                    <span style={{ fontSize: 11.5, color: "#b0b0b0" }}>
                      Type any bank name worldwide
                    </span>
                  }
                >
                  <Input placeholder="e.g. HSBC, Chase, Meezan Bank…" />
                </Form.Item>
                <Form.Item name="bank_account_name" label="Account Holder Name">
                  <Input placeholder="As on bank records" />
                </Form.Item>
                <Form.Item
                  name="bank_account_number"
                  label="Account / IBAN Number"
                >
                  <Input placeholder="IBAN or account number" />
                </Form.Item>
              </div>
            </div>

            <div className="ep-sec">
              <div className="ep-sec-title">
                <DollarSign size={13} />
                Preferred Currency
              </div>
              <div className="ep-grid-2">
                <Form.Item name="currency" label="Currency">
                  <Select
                    placeholder="Select currency"
                    disabled
                    showSearch
                    filterOption={(input, option) =>
                      option?.children
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {CURRENCIES.map((c) => (
                      <Select.Option key={c.code} value={c.code}>
                        {c.code === "OTHER"
                          ? "Other (type manually)"
                          : `${c.symbol} ${c.code} — ${c.name}`}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  noStyle
                  shouldUpdate={(p, c) => p.currency !== c.currency}
                >
                  {({ getFieldValue }) =>
                    getFieldValue("currency") === "OTHER" ? (
                      <Form.Item
                        name="custom_currency"
                        label="Currency Code / Name"
                        extra="Currency is managed by admin and is read-only."
                      >
                        <Input disabled />
                      </Form.Item>
                    ) : (
                      <Form.Item
                        label=" "
                        extra="Currency is managed by admin and cannot be changed here."
                      >
                        <Input
                          disabled
                          value={
                            CURRENCIES.find(
                              (c) => c.code === getFieldValue("currency"),
                            )?.name ||
                            getFieldValue("currency") ||
                            "-"
                          }
                        />
                      </Form.Item>
                    )
                  }
                </Form.Item>
              </div>
            </div>
            <SaveBar />
          </>
        )}

        {activeTab === "payslip" && (
          <div className="ep-payslip-card">
            <div className="ep-payslip-head">
              <div className="ep-payslip-brand-wrap">
                {companyLogoUrl ? (
                  <img
                    src={companyLogoUrl}
                    alt={companyBrand}
                    className="ep-payslip-logo"
                  />
                ) : (
                  <div className="ep-payslip-logo-fallback">
                    {(companyBrand || "C").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="ep-payslip-brand">{companyBrand}</div>
                  <div className="ep-payslip-period">
                    Salary Slip for {payrollMonthLabel}
                  </div>
                  <div className="ep-payslip-slugno">
                    Slip #: {salarySlipNumber}
                  </div>
                </div>
              </div>
              <Button
                type="primary"
                className="ep-save-btn ep-slip-btn"
                icon={<Download size={13} />}
                loading={generatingSlip}
                onClick={handleGenerateLastMonthSlip}
              >
                Generate Last Month Slip
              </Button>
            </div>

            <div className="ep-payslip-grid">
              <div className="ep-payslip-item">
                <div className="ep-payslip-label">Employee</div>
                <div className="ep-payslip-value">
                  {profile?.full_name || "-"}
                </div>
              </div>
              <div className="ep-payslip-item">
                <div className="ep-payslip-label">Email</div>
                <div className="ep-payslip-value">{profile?.email || "-"}</div>
              </div>
              <div className="ep-payslip-item">
                <div className="ep-payslip-label">Payroll Period</div>
                <div className="ep-payslip-value">{payrollPeriodLabel}</div>
              </div>
              <div className="ep-payslip-item">
                <div className="ep-payslip-label">Salary Type</div>
                <div className="ep-payslip-value">{salaryTypeLabel}</div>
              </div>
              <div className="ep-payslip-item">
                <div className="ep-payslip-label">Gross Salary</div>
                <div className="ep-payslip-value">
                  {currencySymbol} {Number(grossSalary || 0).toLocaleString()}
                </div>
              </div>
              <div className="ep-payslip-item">
                <div className="ep-payslip-label">Net Salary</div>
                <div className="ep-payslip-value">{currencyDisplay}</div>
              </div>
            </div>

            <div className="ep-payslip-summary">
              <div className="ep-payslip-row">
                <span>Total Earnings</span>
                <span>{formatCurrency(totalEarnings)}</span>
              </div>
              <div className="ep-payslip-row">
                <span>Total Deductions</span>
                <span>{formatCurrency(totalDeductions)}</span>
              </div>
              <div className="ep-payslip-row total">
                <span>Net Pay</span>
                <span>{currencyDisplay}</span>
              </div>
            </div>

            <div className="ep-payslip-table-wrap">
              <table className="ep-payslip-table">
                <thead>
                  <tr>
                    <th>Earnings</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsRows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className="amount">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                  <tr className="total">
                    <td>Total Earnings</td>
                    <td className="amount">{formatCurrency(totalEarnings)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="ep-payslip-table-wrap">
              <table className="ep-payslip-table">
                <thead>
                  <tr>
                    <th>Deductions</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {deductionsRows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className="amount">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                  <tr className="total">
                    <td>Total Deductions</td>
                    <td className="amount">{formatCurrency(totalDeductions)}</td>
                  </tr>
                  <tr className="total">
                    <td>Net Pay</td>
                    <td className="amount">{currencyDisplay}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="ep-payslip-note">
              This salary slip is generated for the previous calendar month with
              your company branding and logo at the top.
            </div>
          </div>
        )}
        {activeTab === "security" && (
          <div className="ep-sec">
            <div className="ep-sec-title">
              <Shield size={13} />
              Two-Factor Authentication
            </div>
            <p
              style={{
                fontSize: 12,
                color: dark ? "#9ca3af" : "#6b7280",
                marginBottom: 16,
              }}
            >
              Add an extra verification step for sign-in using email OTP or an
              authenticator app.
            </p>

            <div className="ep-2fa-card">
              <div className="ep-2fa-row">
                <div>
                  <div className="ep-2fa-title">
                    Email OTP
                    {emailOtpEnabled && (
                      <Tag color="green" className="ep-2fa-badge">
                        Enabled
                      </Tag>
                    )}
                  </div>
                  <div className="ep-2fa-desc">
                    Send a 6-digit verification code to{" "}
                    {profile?.email || "your email"} during sign-in.
                  </div>
                </div>
                {emailOtpEnabled ? (
                  <Button danger size="small" onClick={handleDisableEmailOtp}>
                    Disable
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="small"
                    loading={loadingEmailOtp}
                    onClick={handleSetupEmailOtp}
                    className="ep-slip-btn"
                  >
                    Enable
                  </Button>
                )}
              </div>
            </div>

            <div className="ep-2fa-card">
              <div className="ep-2fa-row">
                <div>
                  <div className="ep-2fa-title">
                    Authenticator App
                    {totpEnabled && (
                      <Tag color="green" className="ep-2fa-badge">
                        Enabled
                      </Tag>
                    )}
                  </div>
                  <div className="ep-2fa-desc">
                    Use Google Authenticator, Authy, or similar apps for
                    time-based verification codes.
                  </div>
                </div>
                {totpEnabled ? (
                  <Button danger size="small" onClick={handleDisableTotp}>
                    Disable
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="small"
                    loading={loadingTotp}
                    onClick={handleSetupTotp}
                    className="ep-slip-btn"
                  >
                    Set Up
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Form>

      <Modal
        title="Set Up Authenticator App"
        open={totpSetupVisible}
        footer={null}
        onCancel={() => {
          setTotpSetupVisible(false);
          setVerifyCode("");
          setTotpStep(0);
          setTotpFactorId(null);
        }}
      >
        {totpStep === 0 ? (
          <div>
            <p style={{ fontSize: 12, color: dark ? "#9ca3af" : "#6b7280" }}>
              Scan this QR code in your authenticator app, then continue.
            </p>
            {qrData ? (
              <div style={{ textAlign: "center", margin: "12px 0" }}>
                <img
                  src={qrData}
                  alt="Authenticator QR"
                  style={{ width: 180, height: 180, borderRadius: 8 }}
                />
              </div>
            ) : null}
            {totpSecret ? (
              <div
                style={{
                  fontSize: 12,
                  marginBottom: 12,
                  color: dark ? "#d1d5db" : "#374151",
                }}
              >
                Manual key: <code>{totpSecret}</code>
              </div>
            ) : null}
            <Button
              type="primary"
              className="ep-slip-btn"
              block
              onClick={() => setTotpStep(1)}
            >
              Continue
            </Button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: dark ? "#9ca3af" : "#6b7280" }}>
              Enter the 6-digit code from your authenticator app.
            </p>
            <Input
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              style={{ textAlign: "center", marginBottom: 12 }}
            />
            <Button
              type="primary"
              className="ep-slip-btn"
              block
              loading={loadingTotp}
              disabled={verifyCode.length !== 6}
              onClick={handleVerifyTotp}
            >
              Verify & Enable
            </Button>
            <Button
              block
              style={{ marginTop: 8 }}
              onClick={() => setTotpStep(0)}
            >
              Back
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        title="Verify Email OTP"
        open={emailOtpSetupVisible}
        footer={null}
        onCancel={() => {
          setEmailOtpSetupVisible(false);
          setEmailOtpCode("");
          setStoredOtp(null);
        }}
      >
        <p style={{ fontSize: 12, color: dark ? "#9ca3af" : "#6b7280" }}>
          A 6-digit code was sent to {profile?.email}. It expires in 10 minutes.
        </p>
        <Input
          maxLength={6}
          value={emailOtpCode}
          onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          style={{ textAlign: "center", marginBottom: 12 }}
        />
        <Button
          type="primary"
          className="ep-slip-btn"
          block
          loading={loadingEmailOtp}
          disabled={emailOtpCode.length !== 6}
          onClick={handleVerifyEmailOtp}
        >
          Verify & Enable
        </Button>
        <Button
          block
          style={{ marginTop: 8 }}
          onClick={handleResendEmailOtp}
          disabled={resendCooldown > 0 || loadingEmailOtp}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
        </Button>
      </Modal>

      {/* ── Password Tab — separate form, no data conflict ── */}
      {activeTab === "password" && (
        <div className="ep-pw-card">
          <div className="ep-pw-note">
            <Shield size={14} />
            <span>
              Choose a strong password at least 8 characters long. You will be
              signed out of other sessions after changing it.
            </span>
          </div>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="new_password"
              label="New Password"
              rules={[
                { required: true, message: "Please enter a new password" },
                { min: 6, message: "At least 6 characters" },
              ]}
            >
              <Input.Password
                placeholder="Enter new password"
                style={{ borderRadius: 9 }}
              />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label="Confirm Password"
              dependencies={["new_password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("new_password") === value)
                      return Promise.resolve();
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Confirm new password"
                style={{ borderRadius: 9 }}
              />
            </Form.Item>
            <div
              className="ep-save-bar"
              style={{ justifyContent: "flex-start", paddingTop: 8 }}
            >
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="ep-save-btn"
                icon={<Lock size={13} />}
              >
                Change Password
              </Button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
