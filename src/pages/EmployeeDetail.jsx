import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message } from "antd";
import {
  ArrowLeft,
  User,
  Building2,
  Banknote,
  Briefcase,
  Ticket,
  Mail,
  Phone,
  CreditCard,
  CalendarDays,
  MapPin,
  Github,
  Clock,
  TrendingUp,
  AlertCircle,
  Globe,
  Star,
  Languages,
  Linkedin,
  Link,
  FileText,
  UserCheck,
  Shield,
} from "lucide-react";
import { supabase } from "../lib/supabase";

/* ── helpers ─────────────────────────────────────────── */
const PALETTE = [
  "#3b5bdb",
  "#0ca678",
  "#e67700",
  "#c2255c",
  "#7048e8",
  "#1098ad",
  "#d9480f",
  "#2f9e44",
];
const getColor = (str = "") => {
  let h = 0;
  for (const c of str) h = c.charCodeAt(0) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
};
const getInit = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";
const fmtCurrency = (n, currency = "PKR") =>
  `${currency} ${(n || 0).toLocaleString()}`;

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const STATUS_PROJECT = {
  not_started: { label: "Not Started", color: "#9a9a9a", bg: "#f5f5f5" },
  in_progress: { label: "In Progress", color: "#1677ff", bg: "#e6f4ff" },
  testing: { label: "Testing", color: "#d46b08", bg: "#fff7e6" },
  completed: { label: "Completed", color: "#389e0d", bg: "#f6ffed" },
};
const STATUS_TICKET = {
  open: { label: "Open", color: "#1677ff", bg: "#e6f4ff" },
  in_progress: { label: "In Progress", color: "#d46b08", bg: "#fff7e6" },
  completed: { label: "Completed", color: "#389e0d", bg: "#f6ffed" },
  closed: { label: "Closed", color: "#9a9a9a", bg: "#f5f5f5" },
};
const PRIORITY = {
  low: { label: "Low", color: "#9a9a9a", bg: "#f5f5f5" },
  medium: { label: "Medium", color: "#1677ff", bg: "#e6f4ff" },
  high: { label: "High", color: "#d46b08", bg: "#fff7e6" },
  urgent: { label: "Urgent", color: "#cf1322", bg: "#fff1f0" },
};
const EMPLOYMENT_TYPE_LABEL = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  freelancer: "Freelancer",
  intern: "Intern",
};

const hexToRgb = (hex) => {
  const raw = (hex || "").replace("#", "").trim();
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const Pill = ({ label, color, bg, dark = false }) => {
  const rgb = hexToRgb(color);
  const darkBg = rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},0.18)` : "rgba(255,255,255,0.08)";
  const darkBorder = rgb ? `1px solid rgba(${rgb.r},${rgb.g},${rgb.b},0.42)` : "1px solid rgba(255,255,255,0.2)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        color,
        background: dark ? darkBg : bg,
        border: dark ? darkBorder : "1px solid transparent",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
};

const TagChip = ({ label }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      background: "var(--ed-tag-bg)",
      color: "var(--ed-tag-text)",
      border: "1px solid var(--ed-tag-border)",
      borderRadius: 6,
      padding: "2px 9px",
      fontSize: 11.5,
      fontWeight: 600,
      marginRight: 5,
      marginBottom: 5,
    }}
  >
    {label}
  </span>
);

/* ── CSS ──────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Mulish:wght@400;500;600&display=swap');

.ed {
  font-family:'Mulish',-apple-system,sans-serif;
  --ed-bg:#f8fafc;
  --ed-card:#ffffff;
  --ed-card2:#fafafa;
  --ed-border:#f3f3f3;
  --ed-text:#0d0d0d;
  --ed-sub:#4a4a4a;
  --ed-muted:#9a9a9a;
  --ed-muted-2:#c0c0c0;
  --ed-hover:#fafafa;
  --ed-tab:#f5f5f5;
  --ed-tab-active:#ffffff;
  --ed-tag-bg:#f4f5f7;
  --ed-tag-text:#4a4a4a;
  --ed-tag-border:#eceef2;
  color:var(--ed-text);
}
.ed.dark {
  --ed-bg:#141416;
  --ed-card:#141416;
  --ed-card2:#1b1b1f;
  --ed-border:#2a2a31;
  --ed-text:#e8edf5;
  --ed-sub:#c3cad5;
  --ed-muted:#8a94a5;
  --ed-muted-2:#6a7488;
  --ed-hover:#1f2025;
  --ed-tab:#1b1b1f;
  --ed-tab-active:#141416;
  --ed-tag-bg:#23242a;
  --ed-tag-text:#e8edf5;
  --ed-tag-border:#343742;
}

.ed-back { display:inline-flex; align-items:center; gap:6px; border:none; background:transparent; cursor:pointer; font-family:inherit; font-size:13px; font-weight:600; color:var(--ed-muted); padding:0; margin-bottom:20px; transition:color .14s; }
.ed-back:hover { color:var(--ed-text); }

.ed-hero { background:var(--ed-card); border-radius:20px; box-shadow:0 2px 16px rgba(0,0,0,.07); padding:28px 32px; display:flex; align-items:center; gap:24px; margin-bottom:20px; flex-wrap:wrap; }
.ed-hero-av { position:relative; flex-shrink:0; }
.ed-hero-av img,.ed-hero-av-fallback { width:80px; height:80px; border-radius:20px; object-fit:cover; }
.ed-hero-av-fallback { display:flex; align-items:center; justify-content:center; font-family:'Sora',sans-serif; font-size:28px; font-weight:700; color:#fff; }
.ed-hero-status { position:absolute; bottom:-2px; right:-2px; width:14px; height:14px; border-radius:50%; border:2.5px solid var(--ed-card); }
.ed-hero-info { flex:1; min-width:0; }
.ed-hero-name { font-family:'Sora',sans-serif; font-size:22px; font-weight:700; margin:0 0 6px; }
.ed-hero-meta { display:flex; flex-wrap:wrap; gap:14px; margin-top:8px; }
.ed-hero-meta-item { display:flex; align-items:center; gap:5px; font-size:12.5px; color:var(--ed-muted); }
.ed-hero-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; }

.ed-tabs { display:flex; gap:2px; margin-bottom:20px; background:var(--ed-tab); border-radius:12px; padding:4px; width:fit-content; flex-wrap:wrap; }
.ed-tab { border:none; background:transparent; cursor:pointer; padding:8px 18px; border-radius:9px; font-size:13px; font-weight:600; color:var(--ed-muted); font-family:inherit; transition:all .15s; display:flex; align-items:center; gap:6px; white-space:nowrap; }
.ed-tab.active { background:var(--ed-tab-active); color:var(--ed-text); box-shadow:0 1px 6px rgba(0,0,0,.1); }
.ed-tab:hover:not(.active) { color:var(--ed-sub); }

.ed-card { background:var(--ed-card); border-radius:18px; box-shadow:0 2px 12px rgba(0,0,0,.06); margin-bottom:16px; overflow:hidden; }
.ed-card-head { padding:18px 24px 0; display:flex; align-items:center; gap:8px; }
.ed-card-head-icon { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ed-card-head-title { font-family:'Sora',sans-serif; font-size:14px; font-weight:700; }
.ed-card-body { padding:16px 24px 20px; }

.ed-info-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }
.ed-info-item { }
.ed-info-label { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--ed-muted-2); margin-bottom:5px; }
.ed-info-value { font-size:13.5px; font-weight:600; color:var(--ed-text); display:flex; align-items:center; gap:6px; }
.ed-info-value a { color:#3b5bdb; text-decoration:none; }
.ed-info-value a:hover { text-decoration:underline; }
.ed-info-value.muted { color:var(--ed-muted); font-weight:400; font-style:italic; }

.ed-divider { border:none; border-top:1px solid var(--ed-border); margin:16px 0; }

.ed-bio { font-size:13.5px; color:var(--ed-sub); line-height:1.65; background:var(--ed-card2); border-radius:10px; padding:12px 14px; margin-top:4px; }

.ed-table { width:100%; border-collapse:collapse; font-size:13px; }
.ed-table thead tr { border-bottom:1px solid var(--ed-border); }
.ed-table thead th { padding:10px 14px; text-align:left; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--ed-muted-2); white-space:nowrap; }
.ed-table tbody tr { border-bottom:1px solid var(--ed-border); transition:background .12s; }
.ed-table tbody tr:last-child { border-bottom:none; }
.ed-table tbody tr:hover { background:var(--ed-hover); }
.ed-table td { padding:12px 14px; vertical-align:middle; color:var(--ed-sub); }
.ed-table-empty { text-align:center; padding:40px; color:var(--ed-muted-2); font-style:italic; font-size:13px; }

.ed-salary-box { background:linear-gradient(135deg,#0d0d0d 0%,#2a2a2a 100%); border-radius:16px; padding:20px 24px; color:#fff; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:16px; }
.ed-salary-label { font-size:11px; text-transform:uppercase; letter-spacing:.6px; color:rgba(255,255,255,.5); margin-bottom:4px; }
.ed-salary-value { font-family:'Sora',sans-serif; font-size:26px; font-weight:700; }
.ed-salary-sub   { font-size:12px; color:rgba(255,255,255,.5); margin-top:2px; }

@keyframes ed-sweep { to { background-position:-200% 0; } }
.ed-sk { background:linear-gradient(90deg,#f2f2f2 25%,#e8e8e8 50%,#f2f2f2 75%); background-size:200% 100%; animation:ed-sweep 1.5s ease-in-out infinite; border-radius:8px; }
.ed.dark .ed-sk { background:linear-gradient(90deg,#1b273d 25%,#23324d 50%,#1b273d 75%); background-size:200% 100%; }
.ed-sk-card { background:var(--ed-card); border-radius:18px; box-shadow:0 2px 12px rgba(0,0,0,.06); padding:24px; margin-bottom:16px; }
`;

/* ════════════════════════════════════════════════════════ */
const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("details");
  const [dark, setDark] = useState(getIsDarkTheme);

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    syncTheme();
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
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: emp, error: e1 } = await supabase
        .from("profiles")
        .select("*, teams(id,name)")
        .eq("id", id)
        .single();
      if (e1) throw e1;
      setEmployee(emp);

      const { data: proj, error: e2 } = await supabase
        .from("project_assignees")
        .select(
          "project_id,created_at,projects(id,name,status,start_date,end_date)",
        )
        .eq("employee_id", id);
      if (e2) throw e2;
      setProjects(proj || []);

      const { data: tix, error: e3 } = await supabase
        .from("tickets")
        .select("*")
        .eq("assigned_to", id)
        .order("created_at", { ascending: false });
      if (e3) throw e3;
      setTickets(tix || []);

    } catch (err) {
      message.error("Failed to fetch employee details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Skeleton ──────────────────────────────────────── */
  if (loading)
    return (
      <div
        className={`ed${dark ? " dark" : ""}`}
        style={{ background: "var(--ed-bg)", minHeight: "100vh" }}
      >
        <style>{CSS}</style>
        <div
          className="ed-sk"
          style={{ height: 16, width: 120, marginBottom: 20 }}
        />
        <div
          style={{
            background: "var(--ed-card)",
            borderRadius: 20,
            boxShadow: "0 2px 16px rgba(0,0,0,.07)",
            padding: "28px 32px",
            marginBottom: 20,
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div
            className="ed-sk"
            style={{ width: 80, height: 80, borderRadius: 20, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="ed-sk"
              style={{ height: 22, width: "40%", marginBottom: 10 }}
            />
            <div
              className="ed-sk"
              style={{ height: 14, width: "28%", marginBottom: 8 }}
            />
            <div style={{ display: "flex", gap: 14 }}>
              {[140, 110, 90].map((w, i) => (
                <div
                  key={i}
                  className="ed-sk"
                  style={{ height: 12, width: w }}
                />
              ))}
            </div>
          </div>
        </div>
        <div
          className="ed-sk"
          style={{ height: 44, width: 480, borderRadius: 12, marginBottom: 20 }}
        />
        {[1, 2, 3].map((i) => (
          <div key={i} className="ed-sk-card">
            <div
              className="ed-sk"
              style={{ height: 14, width: "30%", marginBottom: 18 }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 16,
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j}>
                  <div
                    className="ed-sk"
                    style={{ height: 10, width: "60%", marginBottom: 6 }}
                  />
                  <div className="ed-sk" style={{ height: 14, width: "80%" }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );

  if (!employee)
    return (
      <div
        className={`ed${dark ? " dark" : ""}`}
        style={{ background: "var(--ed-bg)", minHeight: "100vh" }}
      >
        <style>{CSS}</style>
        <button className="ed-back" onClick={() => navigate("/employees")}>
          <ArrowLeft size={15} /> Back to Employees
        </button>
        <div
          style={{
            background: "var(--ed-card)",
            borderRadius: 18,
            boxShadow: "0 2px 12px rgba(0,0,0,.06)",
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <AlertCircle size={40} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ed-text)" }}>
            Employee not found
          </p>
        </div>
      </div>
    );

  const avatarColor = getColor(employee.full_name || "");
  const currency = employee.currency || "PKR";
  const salaryBase =
    employee.salary_type === "base_commission"
      ? Number(employee.base_salary || 0)
      : Number(employee.salary_amount || 0);
  const allowanceItems = Array.isArray(employee.allowance_items)
    ? employee.allowance_items
    : [];
  const deductionItems = Array.isArray(employee.tax_deduction_items)
    ? employee.tax_deduction_items
    : [];
  const allowanceTotal =
    allowanceItems.length > 0
      ? allowanceItems.reduce((sum, row) => sum + Number(row?.amount || 0), 0)
      : Number(employee.allowances || 0);
  const deductionTotal =
    deductionItems.length > 0
      ? deductionItems.reduce((sum, row) => sum + Number(row?.amount || 0), 0)
      : Number(employee.tax_deductions || 0);
  const finalSalary = salaryBase + allowanceTotal - deductionTotal;

  /* ── Info item helper ──────────────────────────────── */
  const InfoItem = ({ label, value, icon: Icon, link, span1, span2 }) => (
    <div
      className="ed-info-item"
      style={
        span1 ? { gridColumn: "1 / -1" } : span2 ? { gridColumn: "span 2" } : {}
      }
    >
      <div className="ed-info-label">{label}</div>
      <div className={`ed-info-value${!value ? " muted" : ""}`}>
        {Icon && <Icon size={13} color="var(--ed-muted-2)" strokeWidth={2} />}
        {link && value ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        ) : (
          value || "—"
        )}
      </div>
    </div>
  );

  /* ── Tags item helper ──────────────────────────────── */
  const TagsItem = ({ label, items }) => (
    <div className="ed-info-item" style={{ gridColumn: "1 / -1" }}>
      <div className="ed-info-label">{label}</div>
      {items && items.length > 0 ? (
        <div style={{ marginTop: 4 }}>
          {items.map((t) => (
            <TagChip key={t} label={t} />
          ))}
        </div>
      ) : (
        <div className="ed-info-value muted">—</div>
      )}
    </div>
  );

  /* ── Section card helper ───────────────────────────── */
  const SectionCard = ({ icon: Icon, iconColor, iconBg, title, children }) => (
    <div className="ed-card">
      <div className="ed-card-head">
        <div className="ed-card-head-icon" style={{ background: iconBg }}>
          <Icon size={15} color={iconColor} strokeWidth={2.2} />
        </div>
        <span className="ed-card-head-title">{title}</span>
      </div>
      <div className="ed-card-body">{children}</div>
    </div>
  );

  /* ── TABS ──────────────────────────────────────────── */
  const TABS = [
    { key: "details", label: "Details", icon: User },
    {
      key: "projects",
      label: "Projects",
      icon: Briefcase,
      count: projects.length,
    },
    {
      key: "tickets",
      label: "Work History",
      icon: Ticket,
      count: tickets.length,
    },
  ];

  /* ────────────────────────────── RENDER ──────────────── */
  return (
    <div
      className={`ed${dark ? " dark" : ""}`}
      style={{ background: "var(--ed-bg)", minHeight: "100vh" }}
    >
      <style>{CSS}</style>

      {/* Back */}
      <button className="ed-back" onClick={() => navigate("/employees")}>
        <ArrowLeft size={15} strokeWidth={2.5} /> Back to Employees
      </button>

      {/* Hero card */}
      <div className="ed-hero">
        <div className="ed-hero-av">
          {employee.user_photo ? (
            <img
              src={employee.user_photo}
              alt={employee.full_name}
              style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              className="ed-hero-av-fallback"
              style={{ background: avatarColor }}
            >
              {getInit(employee.full_name)}
            </div>
          )}
          <span
            className="ed-hero-status"
            style={{ background: employee.suspended ? "#ff4d4f" : "#52c41a" }}
          />
        </div>

        <div className="ed-hero-info">
          <h1 className="ed-hero-name">{employee.full_name}</h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Pill
              label={
                employee.role === "project_manager"
                  ? "Project Manager"
                  : "Employee"
              }
              color={
                employee.role === "project_manager" ? "#1677ff" : "#389e0d"
              }
              bg={employee.role === "project_manager" ? "#e6f4ff" : "#f6ffed"}
              dark={dark}
            />
            <Pill
              label={employee.suspended ? "Suspended" : "Active"}
              color={employee.suspended ? "#cf1322" : "#389e0d"}
              bg={employee.suspended ? "#fff1f0" : "#f6ffed"}
              dark={dark}
            />
            {employee.employment_type && (
              <Pill
                label={
                  EMPLOYMENT_TYPE_LABEL[employee.employment_type] ||
                  employee.employment_type
                }
                color="#7048e8"
                bg="#f3f0ff"
                dark={dark}
              />
            )}
            {employee.teams?.name && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12.5,
                  color: "var(--ed-muted)",
                }}
              >
                <Building2 size={12} strokeWidth={2} /> {employee.teams.name}
              </span>
            )}
          </div>
          <div className="ed-hero-meta">
            {employee.email && (
              <span className="ed-hero-meta-item">
                <Mail size={12} strokeWidth={2} />
                {employee.email}
              </span>
            )}
            {employee.contact && (
              <span className="ed-hero-meta-item">
                <Phone size={12} strokeWidth={2} />
                {employee.contact}
              </span>
            )}
            {employee.working_hours && (
              <span className="ed-hero-meta-item">
                <Clock size={12} strokeWidth={2} />
                {employee.working_hours} hrs/day
              </span>
            )}
            {employee.timezone && (
              <span className="ed-hero-meta-item">
                <Globe size={12} strokeWidth={2} />
                {employee.timezone}
              </span>
            )}
            {employee.job_title && (
              <span className="ed-hero-meta-item">
                <Briefcase size={12} strokeWidth={2} />
                {employee.job_title}
              </span>
            )}
          </div>
        </div>

        <div className="ed-hero-right">
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 10.5,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "var(--ed-muted-2)",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Member since
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {fmt(employee.created_at)}
            </div>
          </div>
          {employee.github_username && (
            <a
              href={`https://github.com/${employee.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12.5,
                color: "var(--ed-muted)",
                textDecoration: "none",
              }}
            >
              <Github size={14} strokeWidth={2} /> {employee.github_username}
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="ed-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`ed-tab${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={13} strokeWidth={2.2} />
            {t.label}
            {t.count !== undefined && (
              <span
                style={{
                  background: tab === t.key ? "var(--ed-border)" : "var(--ed-tab)",
                  borderRadius: 20,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--ed-muted)",
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── DETAILS TAB ─────────────────────────────── */}
      {tab === "details" && (
        <>
          {/* Personal */}
          <SectionCard
            icon={User}
            iconColor={dark ? "#93c5fd" : "#3b5bdb"}
            iconBg={dark ? "rgba(59,130,246,0.16)" : "#eef2ff"}
            title="Personal Information"
          >
            <div className="ed-info-grid">
              <InfoItem label="Full Name" value={employee.full_name} />
              <InfoItem label="Email" value={employee.email} icon={Mail} />
              <InfoItem label="Contact" value={employee.contact} icon={Phone} />
              <InfoItem
                label="CNIC / Passport"
                value={employee.cnic}
                icon={CreditCard}
              />
              <InfoItem
                label="Date of Birth"
                value={fmt(employee.dob)}
                icon={CalendarDays}
              />
              <InfoItem
                label="Nationality"
                value={employee.nationality}
                icon={Globe}
              />
              <InfoItem
                label="Address"
                value={employee.address}
                icon={MapPin}
                span1
              />
              {employee.bio && (
                <div className="ed-info-item" style={{ gridColumn: "1 / -1" }}>
                  <div className="ed-info-label">Bio</div>
                  <div className="ed-bio">{employee.bio}</div>
                </div>
              )}
              <TagsItem label="Languages Spoken" items={employee.languages} />
            </div>
          </SectionCard>

          {/* Work & Online */}
          <SectionCard
            icon={Briefcase}
            iconColor={dark ? "#86efac" : "#0ca678"}
            iconBg={dark ? "rgba(34,197,94,0.16)" : "#e6faf3"}
            title="Work & Professional"
          >
            <div className="ed-info-grid">
              <InfoItem
                label="Team"
                value={employee.teams?.name}
                icon={Building2}
              />
              <InfoItem
                label="Employment Type"
                value={
                  employee.employment_type
                    ? EMPLOYMENT_TYPE_LABEL[employee.employment_type] ||
                      employee.employment_type
                    : null
                }
                icon={UserCheck}
              />
              <InfoItem
                label="Timezone"
                value={employee.timezone}
                icon={Globe}
              />
              <InfoItem
                label="Working Hours"
                value={
                  employee.working_hours
                    ? `${employee.working_hours} hrs / day`
                    : null
                }
                icon={Clock}
              />
              <InfoItem
                label="Experience"
                value={
                  employee.experience_years != null
                    ? `${employee.experience_years} years`
                    : null
                }
                icon={Star}
              />
              <InfoItem
                label="GitHub"
                value={employee.github_username}
                link={
                  employee.github_username
                    ? `https://github.com/${employee.github_username}`
                    : null
                }
                icon={Github}
              />
              <InfoItem
                label="LinkedIn"
                value={employee.linkedin_url ? "View Profile" : null}
                link={employee.linkedin_url}
                icon={Linkedin}
              />
              <InfoItem
                label="Portfolio / Website"
                value={employee.portfolio_url ? "Visit Site" : null}
                link={employee.portfolio_url}
                icon={Link}
              />
            </div>
            {employee.skills && employee.skills.length > 0 && (
              <>
                <hr className="ed-divider" />
                <TagsItem label="Skills" items={employee.skills} />
              </>
            )}
          </SectionCard>

          {/* Emergency Contact */}
          {(employee.emergency_contact_name ||
            employee.emergency_contact_phone) && (
            <SectionCard
              icon={Shield}
              iconColor={dark ? "#f9a8d4" : "#c2255c"}
              iconBg={dark ? "rgba(236,72,153,0.16)" : "#fff0f6"}
              title="Emergency Contact"
            >
              <div className="ed-info-grid">
                <InfoItem
                  label="Contact Name"
                  value={employee.emergency_contact_name}
                  icon={User}
                />
                <InfoItem
                  label="Contact Phone"
                  value={employee.emergency_contact_phone}
                  icon={Phone}
                />
              </div>
            </SectionCard>
          )}

          {/* Salary */}
          <SectionCard
            icon={Banknote}
            iconColor={dark ? "#fdba74" : "#e67700"}
            iconBg={dark ? "rgba(245,158,11,0.16)" : "#fff4e5"}
            title="Salary Information"
          >
            <div className="ed-salary-box">
              <div>
                <div className="ed-salary-label">Final Salary</div>
                <div className="ed-salary-value">
                  {fmtCurrency(finalSalary, currency)}
                </div>
                <div className="ed-salary-sub">{currency}</div>
              </div>
            </div>
            <div className="ed-info-grid">
              <InfoItem
                label="Base Salary"
                value={fmtCurrency(salaryBase, currency)}
                icon={Banknote}
              />
              <InfoItem
                label="Total Allowances"
                value={fmtCurrency(allowanceTotal, currency)}
                icon={TrendingUp}
              />
              <InfoItem
                label="Total Deductions"
                value={fmtCurrency(deductionTotal, currency)}
                icon={AlertCircle}
              />
              <InfoItem
                label="Salary Type"
                value={
                  employee.salary_type
                    ? employee.salary_type
                        .replace("_", " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())
                    : null
                }
                icon={TrendingUp}
              />
              <InfoItem
                label="Preferred Currency"
                value={currency}
                icon={Banknote}
              />
            </div>
            {allowanceItems.length > 0 && (
              <>
                <hr className="ed-divider" />
                <table className="ed-table">
                  <thead>
                    <tr>
                      <th>Allowance</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allowanceItems.map((row, idx) => (
                      <tr key={`allow-${idx}`}>
                        <td>{row?.label || "—"}</td>
                        <td>{fmtCurrency(Number(row?.amount || 0), currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {deductionItems.length > 0 && (
              <>
                <hr className="ed-divider" />
                <table className="ed-table">
                  <thead>
                    <tr>
                      <th>Deduction</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductionItems.map((row, idx) => (
                      <tr key={`ded-${idx}`}>
                        <td>{row?.label || "—"}</td>
                        <td>{fmtCurrency(Number(row?.amount || 0), currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </SectionCard>

          {/* Bank Details */}
          <SectionCard
            icon={Banknote}
            iconColor={dark ? "#c4b5fd" : "#7048e8"}
            iconBg={dark ? "rgba(139,92,246,0.16)" : "#f3f0ff"}
            title="Bank Details"
          >
            <div className="ed-info-grid">
              <InfoItem
                label="Account Holder"
                value={employee.bank_account_name}
              />
              <InfoItem
                label="Account Number"
                value={employee.bank_account_number}
              />
              <InfoItem label="Bank Name" value={employee.bank_name} span1 />
            </div>
          </SectionCard>
        </>
      )}

      {/* ── PROJECTS TAB ────────────────────────────── */}
      {tab === "projects" && (
        <div className="ed-card">
          <div className="ed-card-body" style={{ padding: 0 }}>
            {projects.length === 0 ? (
              <div className="ed-table-empty">No projects assigned yet</div>
            ) : (
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const s =
                      STATUS_PROJECT[p.projects?.status] ||
                      STATUS_PROJECT.not_started;
                    return (
                      <tr key={p.project_id}>
                        <td style={{ fontWeight: 600, color: "var(--ed-text)" }}>
                          {p.projects?.name || "—"}
                        </td>
                        <td>
                          <Pill label={s.label} color={s.color} bg={s.bg} dark={dark} />
                        </td>
                        <td>{fmt(p.projects?.start_date)}</td>
                        <td>{fmt(p.projects?.end_date)}</td>
                        <td style={{ color: "var(--ed-muted)" }}>
                          {fmt(p.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TICKETS TAB ─────────────────────────────── */}
      {tab === "tickets" && (
        <div className="ed-card">
          <div className="ed-card-body" style={{ padding: 0 }}>
            {tickets.length === 0 ? (
              <div className="ed-table-empty">No work history found</div>
            ) : (
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const s = STATUS_TICKET[t.status] || STATUS_TICKET.open;
                    const p = PRIORITY[t.priority] || PRIORITY.low;
                    return (
                      <tr key={t.id}>
                        <td
                          style={{
                            fontWeight: 600,
                            color: "var(--ed-text)",
                            maxWidth: 280,
                          }}
                        >
                          {t.title}
                        </td>
                        <td>
                          <Pill label={s.label} color={s.color} bg={s.bg} dark={dark} />
                        </td>
                        <td>
                          <Pill label={p.label} color={p.color} bg={p.bg} dark={dark} />
                        </td>
                        <td style={{ color: "var(--ed-muted)" }}>
                          {fmt(t.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeDetail;
