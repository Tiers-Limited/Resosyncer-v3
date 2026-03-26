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

/* ─── Constants ──────────────────────────────────────────────────────── */

// No pre-defined bank list — free text input worldwide
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
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
  { code: "NPR", symbol: "₨", name: "Nepalese Rupee" },
  { code: "QAR", symbol: "﷼", name: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "BHD", symbol: ".د.ب", name: "Bahraini Dinar" },
  { code: "OMR", symbol: "﷼", name: "Omani Rial" },
  { code: "JOD", symbol: "JD", name: "Jordanian Dinar" },
  { code: "EGP", symbol: "£", name: "Egyptian Pound" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "COP", symbol: "$", name: "Colombian Peso" },
  { code: "ARS", symbol: "$", name: "Argentine Peso" },
  { code: "CLP", symbol: "$", name: "Chilean Peso" },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "PLN", symbol: "zł", name: "Polish Złoty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
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

/* ─── CSS ─────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

.ep { font-family:'DM Sans',-apple-system,sans-serif; }
.ep-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; gap:12px; flex-wrap:wrap; }
.ep-title  { font-size:24px; font-weight:700; color:#0a0a0a; margin:0; letter-spacing:-.4px; }
.ep-sub    { font-size:13px; color:#9a9a9a; margin:3px 0 0; }

/* Stats */
.ep-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
@media(max-width:640px){ .ep-stats{grid-template-columns:repeat(2,1fr);} }
.ep-stat { background:#fff; border:1px solid #ebebeb; border-radius:14px; padding:16px 18px; }
.ep-stat-n { font-size:30px; font-weight:700; line-height:1; }
.ep-stat-l { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:#9a9a9a; font-weight:600; margin-top:5px; display:flex; align-items:center; gap:5px; }
.ep-dot    { width:7px; height:7px; border-radius:50%; flex-shrink:0; }

/* Toolbar */
.ep-toolbar { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; align-items:center; }
.ep-search-wrap { position:relative; flex:1; min-width:200px; max-width:320px; }
.ep-search-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#c0c0c0; pointer-events:none; }
.ep-search-wrap input { width:100%; padding:8px 12px 8px 34px; border:1px solid #ebebeb; border-radius:10px; background:#fafafa; font-size:13px; font-family:inherit; outline:none; color:#0a0a0a; transition:border-color .15s,background .15s; box-sizing:border-box; }
.ep-search-wrap input:focus { border-color:#1677ff; background:#fff; }
.ep-count { font-size:12px; color:#b0b0b0; margin-left:4px; }
.ep-view-toggle { display:flex; align-items:center; gap:2px; background:#f5f5f5; border-radius:9px; padding:3px; margin-left:auto; }
.ep-vbtn { border:none; background:transparent; cursor:pointer; width:30px; height:30px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#9a9a9a; transition:all .15s; }
.ep-vbtn.active { background:#fff; color:#0a0a0a; box-shadow:0 1px 4px rgba(0,0,0,.1); }
.ep-vbtn:hover:not(.active) { color:#555; }

/* Cards */
.ep-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(290px,1fr)); gap:14px; }
.ep-card { background:#fff; border:1px solid #ebebeb; border-radius:16px; overflow:hidden; transition:box-shadow .2s,transform .18s; }
.ep-card:hover { box-shadow:0 10px 32px rgba(0,0,0,.09); transform:translateY(-2px); }
.ep-card-top { padding:18px 18px 0; display:flex; align-items:flex-start; gap:13px; }
.ep-av-wrap { position:relative; flex-shrink:0; }
.ep-status-pip { position:absolute; bottom:-1px; right:-1px; width:11px; height:11px; border-radius:50%; border:2.5px solid #fff; }
.ep-card-meta { flex:1; min-width:0; }
.ep-card-name { font-size:14px; font-weight:700; color:#0a0a0a; margin:0 0 5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ep-role-pill { display:inline-flex; align-items:center; padding:2px 9px; border-radius:20px; font-size:10px; font-weight:700; letter-spacing:.4px; text-transform:uppercase; border:1px solid; }
.ep-card-body { padding:14px 18px; display:flex; flex-direction:column; gap:7px; }
.ep-row { display:flex; align-items:center; gap:7px; font-size:12.5px; color:#6a6a6a; }
.ep-row .lc { color:#c8c8c8; flex-shrink:0; }
.ep-row span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ep-salary-badge { display:inline-block; background:#f5f5f5; border-radius:6px; padding:1px 7px; font-size:10.5px; font-weight:700; color:#7a7a7a; text-transform:uppercase; letter-spacing:.3px; }
.ep-sep { height:1px; background:#f3f3f3; margin:0 18px; }
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
.ep-empty-text { font-size:15px; font-weight:600; color:#5a5a5a; }
.ep-empty-hint { font-size:12.5px; color:#b0b0b0; margin-top:5px; }

/* Buttons */
.ep-add-btn { background:#0a0a0a !important; border-color:#0a0a0a !important; border-radius:10px !important; font-weight:700 !important; font-family:'DM Sans',sans-serif !important; height:38px !important; padding:0 18px !important; }
.ep-add-btn:hover { background:#303030 !important; border-color:#303030 !important; }

/* Drawer section label */
.ds-sec { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.8px; color:#c0c0c0; margin:22px 0 10px; padding-bottom:8px; border-bottom:1px solid #f0f0f0; }

/* Credentials */
.cred-box { background:#fafafa; border:1px solid #ebebeb; border-radius:12px; overflow:hidden; margin-top:14px; }
.cred-row { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-bottom:1px solid #f3f3f3; font-size:13px; }
.cred-row:last-child { border-bottom:none; }
.cred-label { color:#9a9a9a; font-weight:500; }
.cred-val   { color:#0a0a0a; font-weight:700; font-family:monospace; font-size:12.5px; }

/* Skeleton shimmer */
@keyframes shimmer {
  0%   { background-position:-800px 0; }
  100% { background-position: 800px 0; }
}
.skel {
  background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: 8px;
}
.ep-skel-card { background:#fff; border:1px solid #ebebeb; border-radius:16px; padding:18px; }
.ep-skel-row  { display:flex; align-items:center; gap:12px; margin-bottom:16px; }

/* Table */
.ep-table-wrap { background:#fff; border:1px solid #ebebeb; border-radius:16px; overflow:hidden; }
.ep-table { width:100%; border-collapse:collapse; font-size:13px; }
.ep-table thead tr { border-bottom:1px solid #f0f0f0; }
.ep-table thead th { padding:11px 16px; text-align:left; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#b0b0b0; white-space:nowrap; background:#fafafa; }
.ep-table tbody tr { border-bottom:1px solid #f7f7f7; transition:background .12s; }
.ep-table tbody tr:last-child { border-bottom:none; }
.ep-table tbody tr:hover { background:#fafafa; }
.ep-table td { padding:12px 16px; color:#3a3a3a; vertical-align:middle; }
.ep-table-name { display:flex; align-items:center; gap:10px; }
.ep-table-name-text { font-weight:600; color:#0a0a0a; font-size:13.5px; cursor:pointer; }
.ep-table-name-text:hover { color:#1677ff; }
.ep-table-email { color:#7a7a7a; font-size:12.5px; }

/* Bank input hint */
.bank-hint { font-size:11.5px; color:#b0b0b0; margin-top:4px; display:flex; align-items:center; gap:4px; }
`;

/* ─── Skeleton components ──────────────────────────────────────────── */
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
    <div style={{ height: 1, background: "#f3f3f3", margin: "0 -18px 12px" }} />
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
    {[200, 100, 80, 100, 80, 120].map((w, i) => (
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

/* ═══════════════════════════════════════════════════════════════════════ */
const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true); // start true so skeleton shows first
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [credentialsModal, setCredentialsModal] = useState(false);
  const [newUserCredentials, setNewUserCredentials] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [currentTenantId, setCurrentTenantId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("card");
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentTenant();
  }, []);

  const fetchCurrentTenant = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      const tid = data?.tenant_id;
      setCurrentTenantId(tid);
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
    setLoading(true);
    try {
      // Resolve currency: if OTHER selected, use custom_currency field
      const resolvedCurrency =
        values.currency === "OTHER" ? values.custom_currency : values.currency;

      const payload = {
        full_name: values.full_name,
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
        const { error: profileError } = await supabase.from("profiles").insert([
          {
            ...payload,
            id: authData.user.id,
            email: values.email,
            tenant_id: currentTenantId,
          },
        ]);
        if (profileError) throw profileError;
        setNewUserCredentials({
          email: values.email,
          password: pwd,
          name: values.full_name,
          role: values.role || "employee",
        });
        setCredentialsModal(true);
        message.success("Employee created");
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
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id)
        .eq("tenant_id", currentTenantId);
      if (error) throw error;
      message.success("Employee deleted");
      fetchEmployees(currentTenantId);
    } catch {
      message.error("Delete failed");
    }
  };

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
          e.teams?.name?.toLowerCase().includes(q);
        const mRole = filterRole === "all" || e.role === filterRole;
        const mStatus =
          filterStatus === "all" ||
          (filterStatus === "active" ? !e.suspended : e.suspended);
        return mSearch && mRole && mStatus;
      }),
    [employees, search, filterRole, filterStatus],
  );

  /* ── Employee Card ── */
  const EmployeeCard = ({ emp }) => {
    const rc = ROLE_COLORS[emp.role] || ROLE_COLORS.employee;
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
            <p className="ep-card-name">{emp.full_name || "—"}</p>
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
            <span title={emp.email}>{emp.email || "—"}</span>
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
                <span
                  key={s}
                  style={{
                    background: "#f0f5ff",
                    color: "#2563eb",
                    borderRadius: 5,
                    padding: "1px 7px",
                    fontSize: 10.5,
                    fontWeight: 600,
                  }}
                >
                  {s}
                </span>
              ))}
              {emp.skills.length > 3 && (
                <span style={{ color: "#9a9a9a", fontSize: 10.5 }}>
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
            onClick={() =>
              Modal.confirm({
                title: "Delete Employee",
                content: `Permanently remove ${emp.full_name}?`,
                okType: "danger",
                onOk: () => handleDelete(emp.id),
              })
            }
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════ RENDER ══════════════════════════════════ */
  return (
    <div className="ep">
      <style>{CSS}</style>

      {/* Header */}
      <div className="ep-header">
        <div>
          <h1 className="ep-title">Employees</h1>
          <p className="ep-sub">Manage your team across the organisation</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={14} />}
          className="ep-add-btn"
          onClick={() => setDrawerVisible(true)}
        >
          Add Employee
        </Button>
      </div>

      {/* Stats */}
      <div className="ep-stats">
        {[
          { n: stats.total, label: "Total", color: "#0a0a0a", dot: "#c0c0c0" },
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
            placeholder="Search name, email or team…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterRole}
          onChange={setFilterRole}
          style={{ width: 158 }}
          options={[
            { label: "All Roles", value: "all" },
            { label: "Employee", value: "employee" },
            { label: "Project Manager", value: "project_manager" },
          ]}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 140 }}
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

      {/* Content: skeleton → empty → data (never show empty while loading) */}
      {loading ? (
        /* ── Skeleton ── */
        viewMode === "card" ? (
          <div className="ep-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="ep-table-wrap">
            <table className="ep-table">
              <thead>
                <tr>
                  {[
                    "Employee",
                    "Team",
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
        )
      ) : filtered.length === 0 ? (
        /* ── Empty state ── */
        <div className="ep-empty">
          <div className="ep-empty-ico">
            <Users size={44} color="#d0d0d0" strokeWidth={1.5} />
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
        /* ── Card grid ── */
        <div className="ep-grid">
          {filtered.map((emp) => (
            <EmployeeCard key={emp.id} emp={emp} />
          ))}
        </div>
      ) : (
        /* ── Table ── */
        <div className="ep-table-wrap">
          <table className="ep-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Team</th>
                <th>Type</th>
                <th>Skills</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const rc = ROLE_COLORS[emp.role] || ROLE_COLORS.employee;
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
                            {emp.full_name || "—"}
                          </div>
                          <div className="ep-table-email">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#6a6a6a" }}>
                      {emp.teams?.name || (
                        <span style={{ color: "#d0d0d0" }}>—</span>
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
                        <span style={{ color: "#d0d0d0" }}>—</span>
                      )}
                    </td>
                    <td>
                      <div
                        style={{ display: "flex", gap: 4, flexWrap: "wrap" }}
                      >
                        {(emp.skills || []).slice(0, 2).map((s) => (
                          <span
                            key={s}
                            style={{
                              background: "#f0f5ff",
                              color: "#2563eb",
                              borderRadius: 5,
                              padding: "1px 6px",
                              fontSize: 10.5,
                              fontWeight: 600,
                            }}
                          >
                            {s}
                          </span>
                        ))}
                        {(emp.skills || []).length > 2 && (
                          <span style={{ color: "#9a9a9a", fontSize: 10.5 }}>
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
                          background: emp.suspended ? "#fff1f0" : "#f6ffed",
                          color: emp.suspended ? "#cf1322" : "#389e0d",
                          border: `1px solid ${emp.suspended ? "#ffccc7" : "#b7eb8f"}`,
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
                          onClick={() =>
                            Modal.confirm({
                              title: "Delete Employee",
                              content: `Permanently remove ${emp.full_name}?`,
                              okType: "danger",
                              onOk: () => handleDelete(emp.id),
                            })
                          }
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
      )}

      {/* ─── Drawer ──────────────────────────────────────────────────── */}
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
        onClose={closeDrawer}
        width={700}
        extra={
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={closeDrawer}>Cancel</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={() => form.submit()}
              style={{
                background: "#0a0a0a",
                borderColor: "#0a0a0a",
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
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 16px",
            }}
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
              <Select>
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
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="languages" label="Languages Spoken">
              <Select mode="multiple" placeholder="Select languages" allowClear>
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
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 16px",
            }}
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
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 16px",
            }}
          >
            <Form.Item name="employment_type" label="Employment Type">
              <Select placeholder="Select type">
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
              <Select placeholder="Select team" allowClear>
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

          {/* Salary */}
          <p className="ds-sec">Compensation</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 16px",
            }}
          >
            {/* Currency with "Other" option */}
            <Form.Item name="currency" label="Salary Currency">
              <Select
                placeholder="Select currency"
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
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
                    <Input placeholder="e.g. BTC, USDT, XOF…" />
                  </Form.Item>
                ) : (
                  <div />
                )
              }
            </Form.Item>

            <Form.Item name="salary_type" label="Salary Type">
              <Select placeholder="Select type">
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
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0 16px",
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

          {/* Bank — free text, worldwide */}
          <p className="ds-sec">Bank Details</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0 16px",
            }}
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
              <Input placeholder="e.g. HSBC, Chase, Meezan Bank…" />
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

      {/* ─── Credentials Modal ───────────────────────────────────────── */}
      <Modal
        title={
          <span style={{ fontFamily: "DM Sans,sans-serif", fontWeight: 700 }}>
            Account Created 🎉
          </span>
        }
        open={credentialsModal}
        onCancel={() => {
          setCredentialsModal(false);
          setNewUserCredentials(null);
        }}
        footer={[
          <Button
            key="ok"
            type="primary"
            style={{
              background: "#0a0a0a",
              borderColor: "#0a0a0a",
              borderRadius: 8,
              fontWeight: 600,
            }}
            onClick={() => {
              setCredentialsModal(false);
              setNewUserCredentials(null);
            }}
          >
            Done
          </Button>,
        ]}
      >
        <p style={{ color: "#52c41a", fontWeight: 600, marginBottom: 2 }}>
          {newUserCredentials?.role === "project_manager"
            ? "Project Manager"
            : "Employee"}{" "}
          account is ready!
        </p>
        <p style={{ fontSize: 12.5, color: "#9a9a9a", marginBottom: 0 }}>
          Share these credentials securely. The user can update their password
          after signing in.
        </p>
        <div className="cred-box">
          {[
            { label: "Name", value: newUserCredentials?.name },
            { label: "Email", value: newUserCredentials?.email },
            { label: "Password", value: newUserCredentials?.password },
          ].map((r) => (
            <div className="cred-row" key={r.label}>
              <span className="cred-label">{r.label}</span>
              <span className="cred-val">{r.value}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Employees;
