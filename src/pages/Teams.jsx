import { useState, useEffect, useMemo } from "react";
import { Button, message, Modal, Form, Input, Select, Avatar, Drawer } from "antd";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Eye,
  FolderOpen,
  GitBranch,
  Building2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const { TextArea } = Input;

/* ---------------- helpers ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
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

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const PROJECT_TERMINAL_STATUSES = new Set(["completed", "on_hold"]);
const ADMIN_ROLES = new Set(["admin", "superadmin", "super_admin"]);
const PROJECT_STATUS_LABELS = {
  not_started: "Not Started",
  planning: "Planning",
  in_progress: "In Progress",
  testing: "Testing",
  revision: "Revision",
  completed: "Completed",
  on_hold: "On Hold",
};
const PROJECT_STATUS_COLORS = {
  not_started: "#64748b",
  planning: "#8b5cf6",
  in_progress: "#2563eb",
  testing: "#0891b2",
  revision: "#d97706",
  completed: "#16a34a",
  on_hold: "#dc2626",
};

/* ---------------- MemberAvatar ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
const MemberAvatar = ({ member, size = 24, radius = 8 }) =>
  member.user_photo ? (
    <img
      src={member.user_photo}
      alt={member.full_name}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        background: getColor(member.full_name || ""),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#fff",
      }}
    >
      {getInit(member.full_name)}
    </div>
  );

/* ---------------- CSS ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Mulish:wght@400;500;600&display=swap');

.tm { font-family:'Mulish',-apple-system,sans-serif; }

.tm-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; gap:12px; flex-wrap:wrap; }
.tm-title  { font-family:'Sora',sans-serif; font-size:26px; font-weight:700; color:#0d0d0d; margin:0; letter-spacing:-.5px; }
.tm-sub    { font-size:13px; color:#9a9a9a; margin:4px 0 0; }

.tm-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:26px; }
@media(max-width:560px){.tm-stats{grid-template-columns:1fr 1fr;}}
.tm-stat  { background:#fff; border-radius:16px; padding:18px 20px; box-shadow:0 2px 12px rgba(0,0,0,.06); }
.tm-stat-n { font-family:'Sora',sans-serif; font-size:32px; font-weight:700; line-height:1; }
.tm-stat-l { font-size:10.5px; text-transform:uppercase; letter-spacing:.6px; color:#a0a0a0; font-weight:600; margin-top:5px; }

.tm-toolbar { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; align-items:center; }
.tm-tabs { display:flex; gap:8px; margin-bottom:16px; }
.tm-tab {
  border:1px solid #e7e7e7;
  background:#fff;
  color:#5f5f5f;
  border-radius:10px;
  padding:7px 12px;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
  font-family:inherit;
}
.tm-tab.active {
  border-color:#3453B7;
  color:#3453B7;
  background:#eef2ff;
}
.tm-search  { position:relative; flex:1; min-width:200px; max-width:320px; }
.tm-search-icon { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#c8c8c8; pointer-events:none; }
.tm-search input { width:100%; padding:8px 12px 8px 34px; border:none; border-radius:10px; background:#f5f5f5; font-size:13px; font-family:inherit; outline:none; color:#0d0d0d; transition:background .15s,box-shadow .15s; }
.tm-search input:focus { background:#fff; box-shadow:0 0 0 3px rgba(59,91,219,.12); }
.tm-count { font-size:12px; color:#b8b8b8; margin-left:4px; }

.tm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(310px,1fr)); gap:16px; }

.tm-card { background:#fff; border-radius:18px; overflow:hidden; transition:box-shadow .2s,transform .18s; display:flex; flex-direction:column; box-shadow:0 2px 12px rgba(0,0,0,.06); }
.tm-card:hover { box-shadow:0 12px 32px rgba(0,0,0,.11); transform:translateY(-2px); }

.tm-card-body  { padding:22px 22px 16px; flex:1; }
.tm-card-top   { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; gap:10px; }
.tm-card-name  { font-family:'Sora',sans-serif; font-size:15.5px; font-weight:700; color:#0d0d0d; margin:0 0 5px; }
.tm-card-desc  { font-size:12.5px; color:#8a8a8a; line-height:1.55; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.tm-count-pill { background:#f3f3f3; border-radius:8px; padding:4px 10px; font-size:11px; font-weight:700; color:#6a6a6a; white-space:nowrap; display:flex; align-items:center; gap:4px; flex-shrink:0; }
.tm-count-pills { display:flex; align-items:center; gap:6px; flex-shrink:0; }

.tm-members       { margin-top:16px; }
.tm-members-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; color:#c8c8c8; margin-bottom:9px; }
.tm-chips         { display:flex; flex-wrap:wrap; gap:6px; }
.tm-chip          { display:inline-flex; align-items:center; gap:6px; background:#f7f7f7; border-radius:20px; padding:3px 10px 3px 4px; }
.tm-chip-name     { font-size:12px; font-weight:600; color:#3a3a3a; }
.tm-chip-role     { font-size:10px; color:#b0b0b0; }
.tm-no-members    { font-size:12.5px; color:#d0d0d0; font-style:italic; }
.tm-show-more     { border:none; background:#efefef; border-radius:20px; padding:3px 11px; font-size:11px; font-weight:700; color:#7a7a7a; cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-family:inherit; transition:background .13s; }
.tm-show-more:hover { background:#e4e4e4; }

.tm-card-date { font-size:11px; color:#d0d0d0; margin-top:12px; display:flex; align-items:center; gap:5px; }

.tm-card-footer { padding:10px 16px; display:flex; gap:2px; justify-content:flex-end; background:#fafafa; }
.tm-btn { border:none; background:transparent; cursor:pointer; padding:6px 11px; border-radius:8px; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:5px; color:#7a7a7a; transition:all .13s; font-family:inherit; }
.tm-btn:hover       { background:#f0f0f0; color:#222; }
.tm-btn.edit:hover  { background:#fff7e0; color:#d46b08; }
.tm-btn.del:hover   { background:#fff1f0; color:#cf1322; }

.tm-empty      { text-align:center; padding:72px 20px; }
.tm-empty-ico  { font-size:44px; margin-bottom:14px; display:flex; justify-content:center; align-items:center; }
.tm-empty-text { font-size:15px; font-weight:600; color:#5a5a5a; }
.tm-empty-hint { font-size:12.5px; color:#b8b8b8; margin-top:5px; }

.tm-add-btn { background:#3453B7 !important; border-color:#3453B7 !important; border-radius:10px !important; font-family:'Sora',sans-serif !important; font-weight:600 !important; height:38px !important; padding:0 18px !important; box-shadow:none !important; }
.tm-add-btn:hover { background:#2f469d !important; border-color:#2f469d !important; }

/* skeleton */
@keyframes tm-sweep { to { background-position:-200% 0; } }
.tm-sk { background:#fff; border-radius:18px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 2px 12px rgba(0,0,0,.06); }
.tm-sk-body { padding:22px; flex:1; }
.tm-sk-line { border-radius:6px; background:linear-gradient(90deg,#f2f2f2 25%,#e8e8e8 50%,#f2f2f2 75%); background-size:200% 100%; animation:tm-sweep 1.5s ease-in-out infinite; }
.tm-sk-chips { display:flex; gap:6px; margin-top:14px; }
.tm-sk-chip  { height:28px; border-radius:20px; background:linear-gradient(90deg,#f2f2f2 25%,#e8e8e8 50%,#f2f2f2 75%); background-size:200% 100%; animation:tm-sweep 1.5s ease-in-out infinite; }
.tm-sk-footer { padding:12px 16px; display:flex; justify-content:flex-end; gap:8px; background:#fafafa; }
.tm-sk-btn { height:30px; border-radius:8px; background:linear-gradient(90deg,#f2f2f2 25%,#e8e8e8 50%,#f2f2f2 75%); background-size:200% 100%; animation:tm-sweep 1.5s ease-in-out infinite; }

.tm-modal-sec { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.7px; color:#c8c8c8; margin:18px 0 10px; padding-bottom:7px; border-bottom:1px solid #f5f5f5; }

.tm-org {
  background:#fff;
  border-radius:18px;
  box-shadow:0 2px 12px rgba(0,0,0,.06);
  padding:18px 18px 16px;
  margin-bottom:18px;
}
.tm-org-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
.tm-org-title { display:flex; align-items:center; gap:8px; font-family:'Sora',sans-serif; font-size:14px; font-weight:700; color:#151515; }
.tm-org-sub { font-size:12px; color:#9a9a9a; }
.tm-org-chart { position:relative; }
.tm-org-center { display:flex; justify-content:center; }
.tm-org-node {
  width:min(340px,100%);
  border:1px solid #e7e7e7;
  background:#fff;
  border-radius:14px;
  box-shadow:0 2px 8px rgba(0,0,0,.04);
  padding:12px;
}
.tm-org-node.company { width:min(380px,100%); }
.tm-org-node + .tm-org-node-gap { height:14px; }
.tm-org-company-row { display:flex; align-items:center; gap:10px; }
.tm-org-company-logo {
  width:44px; height:44px; border-radius:10px; object-fit:cover; flex-shrink:0;
  border:1px solid #ececec;
}
.tm-org-company-fallback {
  width:44px; height:44px; border-radius:10px; flex-shrink:0;
  background:#eef2ff; color:#4f46e5; display:flex; align-items:center; justify-content:center;
}
.tm-org-company-name { font-size:14px; font-weight:700; color:#181818; line-height:1.2; }
.tm-org-company-meta { font-size:11px; color:#9aa0aa; margin-top:2px; }
.tm-org-label { font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#9ca3af; margin-bottom:8px; }
.tm-org-exec-list { display:flex; flex-direction:column; gap:6px; }
.tm-org-vline { width:2px; height:20px; background:#d7dbe3; margin:0 auto; }
.tm-org-hline-wrap { position:relative; padding-top:18px; margin-top:2px; }
.tm-org-hline { height:2px; background:#d7dbe3; width:100%; border-radius:2px; }
.tm-org-vdrop { width:2px; height:16px; background:#d7dbe3; margin:0 auto; }
.tm-org-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:10px; margin-top:4px; }
.tm-org-team { border:1px solid #efefef; border-radius:12px; padding:11px 12px; background:#fcfcfc; }
.tm-org-team-top { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; }
.tm-org-team-name { font-size:13px; font-weight:700; color:#1f1f1f; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tm-org-count { font-size:10px; font-weight:700; color:#6b7280; background:#eef2ff; border-radius:999px; padding:3px 8px; }
.tm-org-members { display:flex; flex-direction:column; gap:6px; }
.tm-org-member { display:flex; align-items:center; gap:8px; border-radius:10px; padding:6px 7px; background:#fff; }
.tm-org-member-name { font-size:12px; font-weight:600; color:#2f2f2f; line-height:1.2; }
.tm-org-member-role { font-size:10px; color:#9ca3af; line-height:1.2; }
.tm-org-empty { font-size:11px; color:#b0b0b0; font-style:italic; }

.tm-drawer-head { margin-bottom:14px; }
.tm-drawer-name { font-family:'Sora',sans-serif; font-size:20px; font-weight:700; color:#101010; margin:0 0 5px; }
.tm-drawer-desc { font-size:12px; color:#8a8a8a; line-height:1.55; margin:0; }
.tm-drawer-sec { margin-top:16px; }
.tm-drawer-sec-title { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.7px; color:#a3a3a3; margin-bottom:9px; }
.tm-proj-list { display:flex; flex-direction:column; gap:10px; }
.tm-proj-item { border:1px solid #efefef; border-radius:12px; background:#fff; padding:12px; }
.tm-proj-top { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
.tm-proj-name { font-size:13px; font-weight:700; color:#161616; margin:0; }
.tm-proj-chip { font-size:10px; font-weight:700; border-radius:999px; padding:3px 8px; border:1px solid currentColor; white-space:nowrap; background:#fff; }
.tm-proj-meta { margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; }
.tm-proj-meta-item { font-size:11px; color:#7a7a7a; background:#f6f6f6; border-radius:8px; padding:3px 7px; }
.tm-proj-empty { border:1px dashed #e5e7eb; border-radius:12px; padding:14px; font-size:12px; color:#9ca3af; background:#fafafa; }

.tm.dark { background:#141416; min-height:100vh; color:#f3f4f6; }
.tm.dark .tm-title { color:#e8edf5; }
.tm.dark .tm-sub,.tm.dark .tm-count,.tm.dark .tm-card-desc,.tm.dark .tm-chip-role,.tm.dark .tm-card-date,.tm.dark .tm-stat-l,.tm.dark .tm-members-label { color:#9ca3af; }
.tm.dark .tm-stat,.tm.dark .tm-card,.tm.dark .tm-sk { background:#1a1b1f; box-shadow:0 2px 12px rgba(0,0,0,.28); }
.tm.dark .tm-tab { background:#1a1b1f; border-color:#2a2b31; color:#9ca3af; }
.tm.dark .tm-tab.active { background:#1e293b; border-color:#3453B7; color:#c7d2fe; }
.tm.dark .tm-search input { background:#17181c; color:#f3f4f6; }
.tm.dark .tm-search input:focus { background:#1a1b1f; box-shadow:0 0 0 3px rgba(59,91,219,.22); }
.tm.dark .tm-count-pill,.tm.dark .tm-show-more { background:#202127; color:#d1d5db; }
.tm.dark .tm-chip { background:#202127; }
.tm.dark .tm-chip-name { color:#f3f4f6; }
.tm.dark .tm-no-members,.tm.dark .tm-empty-hint { color:#9ca3af; }
.tm.dark .tm-empty-text { color:#d1d5db; }
.tm.dark .tm-card-name { color:#f3f4f6; }
.tm.dark .tm-card-footer,.tm.dark .tm-sk-footer { background:#17181c; }
.tm.dark .tm-btn { color:#9ca3af; }
.tm.dark .tm-btn:hover { background:#202127; color:#f3f4f6; }
.tm.dark .tm-btn.edit:hover { background:#3f2d0e; color:#facc15; }
.tm.dark .tm-btn.del:hover { background:#3b1010; color:#fca5a5; }
.tm.dark .tm-add-btn { background:#e2e8f0 !important; border-color:#e2e8f0 !important; color:#111111 !important; }
.tm.dark .tm-add-btn:hover { background:#cbd5e1 !important; border-color:#cbd5e1 !important; }
.tm.dark .tm-sk-line,.tm.dark .tm-sk-chip,.tm.dark .tm-sk-btn { background:linear-gradient(90deg,#202127 25%,#2a2b31 50%,#202127 75%); background-size:200% 100%; }
.tm.dark .tm-org { background:#1a1b1f; box-shadow:0 2px 12px rgba(0,0,0,.28); }
.tm.dark .tm-org-title { color:#e8edf5; }
.tm.dark .tm-org-sub { color:#9ca3af; }
.tm.dark .tm-org-node { background:#17181c; border-color:#2a2b31; box-shadow:none; }
.tm.dark .tm-org-company-name { color:#f3f4f6; }
.tm.dark .tm-org-company-meta { color:#9ca3af; }
.tm.dark .tm-org-company-logo { border-color:#2a2b31; }
.tm.dark .tm-org-company-fallback { background:#1e293b; color:#bfdbfe; }
.tm.dark .tm-org-vline,.tm.dark .tm-org-hline,.tm.dark .tm-org-vdrop { background:#3a3d46; }
.tm.dark .tm-org-team { background:#17181c; border-color:#2a2b31; }
.tm.dark .tm-org-team-name,.tm.dark .tm-org-member-name,.tm.dark .tm-drawer-name,.tm.dark .tm-proj-name { color:#f3f4f6; }
.tm.dark .tm-org-count { color:#c7d2fe; background:#1e293b; }
.tm.dark .tm-org-member { background:#202127; }
.tm.dark .tm-org-member-role,.tm.dark .tm-org-empty,.tm.dark .tm-drawer-desc,.tm.dark .tm-drawer-sec-title,.tm.dark .tm-proj-meta-item,.tm.dark .tm-proj-empty { color:#9ca3af; }
.tm.dark .tm-proj-item { background:#17181c; border-color:#2a2b31; }
.tm.dark .tm-proj-chip { background:#17181c; }
.tm.dark .tm-proj-meta-item { background:#202127; }
.tm.dark .tm-proj-empty { background:#17181c; border-color:#2a2b31; }

.tm-dark-modal .ant-modal-content,
.tm-dark-modal .ant-modal-header {
  background:#1a1b1f !important;
  border-color:#2a2b31 !important;
}
.tm-dark-modal .ant-modal-title { color:#f3f4f6 !important; }
.tm-dark-modal .ant-form-item-label > label,
.tm-dark-modal .tm-modal-sec { color:#9ca3af !important; }
.tm-dark-modal .ant-input,
.tm-dark-modal .ant-input-affix-wrapper,
.tm-dark-modal .ant-select-selector {
  background:#17181c !important;
  border-color:#2a2b31 !important;
  color:#f3f4f6 !important;
}
.tm-dark-modal .ant-input::placeholder { color:#9ca3af !important; }
.tm-dark-modal .ant-select-selection-placeholder,
.tm-dark-modal .ant-select-arrow { color:#9ca3af !important; }

.tm-dark-popup.ant-select-dropdown {
  background:#1a1b1f !important;
  border:1px solid #2a2b31 !important;
}
.tm-dark-popup .ant-select-item { color:#f3f4f6 !important; }
.tm-dark-popup .ant-select-item-option-active,
.tm-dark-popup .ant-select-item-option-selected {
  background:#202127 !important;
}

.tm-dark-drawer .ant-drawer-content,
.tm-dark-drawer .ant-drawer-header,
.tm-dark-drawer .ant-drawer-body {
  background:#1a1b1f !important;
  border-color:#2a2b31 !important;
}
.tm-dark-drawer .ant-drawer-title,
.tm-dark-drawer .ant-drawer-close { color:#f3f4f6 !important; }
.tm-dark-drawer .tm-drawer-name,
.tm-dark-drawer .tm-proj-name { color:#f3f4f6 !important; }
.tm-dark-drawer .tm-drawer-desc,
.tm-dark-drawer .tm-drawer-sec-title,
.tm-dark-drawer .tm-proj-meta-item,
.tm-dark-drawer .tm-proj-empty { color:#9ca3af !important; }
.tm-dark-drawer .tm-proj-item {
  background:#17181c !important;
  border-color:#2a2b31 !important;
}
.tm-dark-drawer .tm-proj-chip { background:#17181c !important; }
.tm-dark-drawer .tm-proj-meta-item { background:#202127 !important; }
.tm-dark-drawer .tm-proj-empty {
  background:#17181c !important;
  border-color:#2a2b31 !important;
}
`;

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
const Teams = () => {
  const [dark, setDark] = useState(getIsDarkTheme);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [teamProjectCounts, setTeamProjectCounts] = useState({});
  const [teamProjects, setTeamProjects] = useState({});
  const [teamDrawer, setTeamDrawer] = useState({ open: false, team: null });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [currentTenantId, setCurrentTenantId] = useState(null);
  const [search, setSearch] = useState("");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [activeTab, setActiveTab] = useState("teams");
  const [form] = Form.useForm();
  const { profile } = useAuth();
  const isAdmin = ADMIN_ROLES.has(String(profile?.role || "").toLowerCase());

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

  const fetchCurrentTenant = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("tenant_id, company_name, user_photo")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      const tid = data?.tenant_id;
      setCurrentTenantId(tid);
      setCompanyName(data?.company_name || profile?.company_name || "Organization");
      setCompanyLogo(
        profile?.company_logo_url ||
          profile?.logo_url ||
          profile?.company_logo ||
          data?.user_photo ||
          profile?.user_photo ||
          "",
      );
      fetchTeams(tid);
      fetchEmployees(tid);
      fetchOrgMembers(tid);
    } catch {
      message.error("Failed to load tenant");
    }
  };

  const fetchTeams = async (tid) => {
    if (!tid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*, profiles:profiles(id,full_name,email,role,user_photo,job_title)")
        .eq("tenant_id", tid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const teamsData = data || [];
      setTeams(teamsData);

      const teamIds = teamsData.map((t) => t.id).filter(Boolean);
      if (!teamIds.length) {
        setTeamProjectCounts({});
        setTeamProjects({});
      } else {
        const { data: projectData, error: projectErr } = await supabase
          .from("projects")
          .select(
            "id, name, team_id, status, start_date, end_date, priority, project_type",
          )
          .eq("tenant_id", tid)
          .in("team_id", teamIds);
        if (projectErr) throw projectErr;

        const counts = teamIds.reduce((acc, id) => {
          acc[id] = { total: 0, ongoing: 0 };
          return acc;
        }, {});
        const projectsByTeam = teamIds.reduce((acc, id) => {
          acc[id] = [];
          return acc;
        }, {});

        (projectData || []).forEach((p) => {
          const teamId = p.team_id;
          if (!teamId || !counts[teamId]) return;
          counts[teamId].total += 1;
          const st = String(p.status || "").toLowerCase();
          if (!PROJECT_TERMINAL_STATUSES.has(st)) counts[teamId].ongoing += 1;
          if (projectsByTeam[teamId]) projectsByTeam[teamId].push(p);
        });

        setTeamProjectCounts(counts);
        setTeamProjects(projectsByTeam);
      }
    } catch {
      message.error("Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (tid) => {
    if (!tid) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,role,user_photo,job_title")
        .eq("tenant_id", tid)
        .in("role", ["employee", "project_manager"]);
      if (error) throw error;
      setEmployees(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrgMembers = async (tid) => {
    if (!tid) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,role,user_photo,job_title,team_id")
        .eq("tenant_id", tid);
      if (error) throw error;
      setOrgMembers(data || []);
    } catch (e) {
      console.error(e);
      setOrgMembers([]);
    }
  };

  const handleSave = async (values) => {
    if (!currentTenantId) {
      message.error("Tenant not loaded");
      return;
    }
    setLoading(true);
    try {
      if (editingTeam) {
        const { error: teamErr } = await supabase
          .from("teams")
          .update({ name: values.name, description: values.description })
          .eq("id", editingTeam.id)
          .eq("tenant_id", currentTenantId);
        if (teamErr) throw teamErr;
        await supabase
          .from("profiles")
          .update({ team_id: null })
          .eq("team_id", editingTeam.id);
        if (values.members?.length) {
          const { error: memErr } = await supabase
            .from("profiles")
            .update({ team_id: editingTeam.id })
            .in("id", values.members);
          if (memErr) throw memErr;
        }
        message.success("Team updated");
      } else {
        const { data: teamData, error: teamErr } = await supabase
          .from("teams")
          .insert([
            {
              name: values.name,
              description: values.description,
              created_by: profile?.id,
              tenant_id: currentTenantId,
            },
          ])
          .select()
          .single();
        if (teamErr) throw teamErr;
        if (values.members?.length) {
          const { error: memErr } = await supabase
            .from("profiles")
            .update({ team_id: teamData.id })
            .in("id", values.members);
          if (memErr) throw memErr;
        }
        message.success("Team created");
      }
      closeModal();
      fetchTeams(currentTenantId);
    } catch (e) {
      message.error(editingTeam ? "Failed to update" : "Failed to create");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    form.setFieldsValue({
      name: team.name,
      description: team.description,
      members: team.profiles?.map((p) => p.id) || [],
    });
    setModalVisible(true);
  };

  const handleDelete = async (teamId, teamName) => {
    try {
      await supabase
        .from("profiles")
        .update({ team_id: null })
        .eq("team_id", teamId);
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId)
        .eq("tenant_id", currentTenantId);
      if (error) throw error;
      message.success("Team deleted");
      fetchTeams(currentTenantId);
    } catch {
      message.error("Delete failed");
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTeam(null);
    form.resetFields();
  };

  const stats = useMemo(
    () => ({
      total: teams.length,
      members: teams.reduce((s, t) => s + (t.profiles?.length || 0), 0),
      empty: teams.filter((t) => !t.profiles?.length).length,
      ongoingProjects: Object.values(teamProjectCounts).reduce(
        (sum, c) => sum + (c.ongoing || 0),
        0,
      ),
    }),
    [teams, teamProjectCounts],
  );

  const filtered = useMemo(
    () =>
      teams.filter(
        (t) =>
          !search ||
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    [teams, search],
  );

  const orgStructure = useMemo(() => {
    const teamNodes = teams.map((team) => ({
      id: team.id,
      name: team.name,
      members: (team.profiles || [])
        .slice()
        .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")),
    }));
    const assignedIds = new Set(
      teamNodes.flatMap((t) => t.members.map((m) => m.id)),
    );
    const unassigned = employees
      .filter((e) => !assignedIds.has(e.id))
      .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    const executive = (orgMembers || [])
      .filter((m) =>
        ["admin", "superadmin", "super_admin"].includes(
          String(m.role || "").toLowerCase(),
        ),
      )
      .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    return { teamNodes, unassigned, executive };
  }, [teams, employees, orgMembers]);

  const openTeamDrawer = (team) => setTeamDrawer({ open: true, team });

  /* ---------------- TeamCard ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
  const TeamCard = ({ team }) => {
    const members = team.profiles || [];
    const isOpen = expandedTeam === team.id;
    const visible = isOpen ? members : members.slice(0, 4);
    const projectStats = teamProjectCounts[team.id] || { total: 0, ongoing: 0 };

    return (
      <div className="tm-card">
        <div className="tm-card-body">
          <div className="tm-card-top">
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="tm-card-name">{team.name}</p>
              {team.description ? (
                <p className="tm-card-desc">{team.description}</p>
              ) : (
                <p
                  className="tm-card-desc"
                  style={{ color: "#d8d8d8", fontStyle: "italic" }}
                >
                  No description
                </p>
              )}
            </div>
            <div className="tm-count-pills">
              <span className="tm-count-pill">
                <Users size={11} strokeWidth={2.5} />
                {members.length}
              </span>
              <button
                className="tm-count-pill"
                style={{ border: "none", cursor: "pointer" }}
                title={`${projectStats.total} total projects`}
                onClick={() => openTeamDrawer(team)}
              >
                <Briefcase size={11} strokeWidth={2.5} />
                {projectStats.ongoing} ongoing
              </button>
            </div>
          </div>

          {/* Members */}
          <div className="tm-members">
            <div className="tm-members-label">Members</div>
            {members.length === 0 ? (
              <span className="tm-no-members">No members assigned yet</span>
            ) : (
              <div className="tm-chips">
                {visible.map((m) => (
                  <div key={m.id} className="tm-chip">
                    <MemberAvatar member={m} size={22} radius={6} />
                    <span className="tm-chip-name">{m.full_name}</span>
                    {(m.job_title || m.role === "project_manager") && (
                      <span className="tm-chip-role">
                        {m.job_title || "PM"}
                      </span>
                    )}
                  </div>
                ))}
                {!isOpen && members.length > 4 && (
                  <button
                    className="tm-show-more"
                    onClick={() => setExpandedTeam(team.id)}
                  >
                    +{members.length - 4} more <ChevronDown size={11} />
                  </button>
                )}
                {isOpen && members.length > 4 && (
                  <button
                    className="tm-show-more"
                    onClick={() => setExpandedTeam(null)}
                  >
                    Show less <ChevronUp size={11} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="tm-card-date">
            <CalendarDays size={11} strokeWidth={2} />
            {new Date(team.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        <div className="tm-card-footer">
          <button className="tm-btn" onClick={() => openTeamDrawer(team)}>
            <Eye size={13} strokeWidth={2.2} /> Open
          </button>
          <button className="tm-btn edit" onClick={() => handleEdit(team)}>
            <Pencil size={13} strokeWidth={2.2} /> Edit
          </button>
          <button
            className="tm-btn del"
            onClick={() =>
              Modal.confirm({
                title: "Delete Team",
                content: `Remove "${team.name}"? Members will be unassigned.`,
                okButtonProps: {
                  style: {
                    background: dark ? "#e2e8f0" : "#3453B7",
                    borderColor: dark ? "#e2e8f0" : "#3453B7",
                    color: dark ? "#111111" : "#ffffff",
                  },
                },
                cancelButtonProps: {
                  style: {
                    color: dark ? "#e2e8f0" : "#3453B7",
                    borderColor: dark ? "#e2e8f0" : "#3453B7",
                  },
                },
                onOk: () => handleDelete(team.id, team.name),
              })
            }
          >
            <Trash2 size={13} strokeWidth={2.2} /> Delete
          </button>
        </div>
      </div>
    );
  };

  /* ---------------- SkeletonCard -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
  const SkeletonCard = ({ i }) => (
    <div className="tm-sk">
      <div className="tm-sk-body">
        <div
          className="tm-sk-line"
          style={{ height: 17, width: "52%", marginBottom: 10 }}
        />
        <div
          className="tm-sk-line"
          style={{ height: 12, width: "88%", marginBottom: 6 }}
        />
        <div
          className="tm-sk-line"
          style={{ height: 12, width: "68%", marginBottom: 18 }}
        />
        <div
          className="tm-sk-line"
          style={{ height: 9, width: 56, marginBottom: 10 }}
        />
        <div className="tm-sk-chips">
          <div className="tm-sk-chip" style={{ width: 100 + (i % 3) * 22 }} />
          <div className="tm-sk-chip" style={{ width: 86 }} />
          {i % 2 === 0 && <div className="tm-sk-chip" style={{ width: 104 }} />}
        </div>
        <div
          className="tm-sk-line"
          style={{ height: 9, width: 110, marginTop: 14 }}
        />
      </div>
      <div className="tm-sk-footer">
        <div className="tm-sk-btn" style={{ width: 62 }} />
        <div className="tm-sk-btn" style={{ width: 72 }} />
      </div>
    </div>
  );

  /* ------------------------------------------------------------------------------------------------------------------------------ RENDER -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */
  return (
    <div className={`tm${dark ? " dark" : ""}`}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="tm-header">
        <div>
          <h1 className="tm-title">Teams</h1>
          <p className="tm-sub">Organise your workforce into focused groups</p>
        </div>
        <button
          className="tm-add-btn"
          onClick={() => setModalVisible(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: dark ? "#e2e8f0" : "#3453B7",
            color: dark ? "#111111" : "#fff",
            border: "none",
            borderRadius: 10,
            height: 38,
            padding: "0 18px",
            fontFamily: "Sora,sans-serif",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            transition: "background .15s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = dark ? "#cbd5e1" : "#2f469d")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = dark ? "#e2e8f0" : "#3453B7")
          }
        >
          <Plus size={15} strokeWidth={2.5} /> Create Team
        </button>
      </div>

      {/* Stats */}
      <div className="tm-stats">
        {[
          {
            n: stats.total,
            label: "Total Teams",
            color: dark ? "#e8edf5" : "#0d0d0d",
          },
          { n: stats.members, label: "Total Members", color: "#3453B7" },
          { n: stats.ongoingProjects, label: "Ongoing Projects", color: "#0ca678" },
          { n: stats.empty, label: "Empty Teams", color: "#e67700" },
        ].map((s) => (
          <div className="tm-stat" key={s.label}>
            <div className="tm-stat-n" style={{ color: s.color }}>
              {s.n}
            </div>
            <div className="tm-stat-l">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="tm-tabs">
        <button
          className={`tm-tab${activeTab === "teams" ? " active" : ""}`}
          onClick={() => setActiveTab("teams")}
        >
          Teams
        </button>
        {isAdmin && (
          <button
            className={`tm-tab${activeTab === "structure" ? " active" : ""}`}
            onClick={() => setActiveTab("structure")}
          >
            Company Structure
          </button>
        )}
      </div>

      {activeTab === "teams" && (
        <div className="tm-toolbar">
          <div className="tm-search">
            <Search size={14} className="tm-search-icon" strokeWidth={2} />
            <input
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="tm-count">
            {filtered.length} team{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {isAdmin && activeTab === "structure" && (
        <div className="tm-org">
          <div className="tm-org-head">
            <div className="tm-org-title">
              <GitBranch size={15} strokeWidth={2.1} />
              Team / Organization Structure
            </div>
            <div className="tm-org-sub">
              {orgStructure.teamNodes.length} teams,{" "}
              {orgStructure.teamNodes.reduce((sum, t) => sum + t.members.length, 0)} assigned members
            </div>
          </div>
          <div className="tm-org-chart">
            <div className="tm-org-center">
              <div className="tm-org-node company">
                <div className="tm-org-label">Organization</div>
                <div className="tm-org-company-row">
                  {companyLogo ? (
                    <img src={companyLogo} alt={companyName} className="tm-org-company-logo" />
                  ) : (
                    <div className="tm-org-company-fallback">
                      <Building2 size={18} strokeWidth={2.1} />
                    </div>
                  )}
                  <div>
                    <div className="tm-org-company-name">{companyName || "Organization"}</div>
                    <div className="tm-org-company-meta">Company Node</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tm-org-vline" />
            <div className="tm-org-center">
              <div className="tm-org-node">
                <div className="tm-org-label">Executive Team</div>
                {orgStructure.executive.length ? (
                  <div className="tm-org-exec-list">
                    {orgStructure.executive.map((m) => (
                      <div key={m.id} className="tm-org-member">
                        <MemberAvatar member={m} size={24} radius={7} />
                        <div>
                          <div className="tm-org-member-name">{m.full_name}</div>
                          <div className="tm-org-member-role">
                            {m.job_title || "Executive"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tm-org-empty">No executive profiles found</div>
                )}
              </div>
            </div>
            <div className="tm-org-hline-wrap">
              <div className="tm-org-hline" />
              <div className="tm-org-vdrop" />
            </div>
            <div className="tm-org-grid">
              {orgStructure.teamNodes.map((teamNode) => (
                <div key={teamNode.id} className="tm-org-team">
                  <div className="tm-org-team-top">
                    <div className="tm-org-team-name">{teamNode.name}</div>
                    <span className="tm-org-count">{teamNode.members.length}</span>
                  </div>
                  {teamNode.members.length ? (
                    <div className="tm-org-members">
                      {teamNode.members.map((m) => (
                        <div key={m.id} className="tm-org-member">
                          <MemberAvatar member={m} size={24} radius={7} />
                          <div>
                            <div className="tm-org-member-name">{m.full_name}</div>
                            <div className="tm-org-member-role">
                              {m.job_title || (m.role === "project_manager" ? "Project Manager" : "Employee")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="tm-org-empty">No members in this team</div>
                  )}
                </div>
              ))}
              {orgStructure.unassigned.length > 0 && (
                <div className="tm-org-team">
                  <div className="tm-org-team-top">
                    <div className="tm-org-team-name">Unassigned</div>
                    <span className="tm-org-count">{orgStructure.unassigned.length}</span>
                  </div>
                  <div className="tm-org-members">
                    {orgStructure.unassigned.map((m) => (
                      <div key={m.id} className="tm-org-member">
                        <MemberAvatar member={m} size={24} radius={7} />
                        <div>
                          <div className="tm-org-member-name">{m.full_name}</div>
                          <div className="tm-org-member-role">
                            {m.job_title || (m.role === "project_manager" ? "Project Manager" : "Employee")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {activeTab === "teams" && loading ? (
        <div className="tm-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} i={i} />
          ))}
        </div>
      ) : activeTab === "teams" && filtered.length === 0 ? (
        <div className="tm-empty">
          <div className="tm-empty-ico">
            <Users size={40} strokeWidth={2} color={dark ? "#6b7280" : "#c0c0c0"} />
          </div>
          <div className="tm-empty-text">
            {search ? "No teams match your search" : "No teams yet"}
          </div>
          <div className="tm-empty-hint">
            {!search && 'Click "Create Team" to get started'}
          </div>
        </div>
      ) : activeTab === "teams" ? (
        <div className="tm-grid">
          {filtered.map((t) => (
            <TeamCard key={t.id} team={t} />
          ))}
        </div>
      ) : null}

      {!isAdmin && activeTab === "structure" ? (
        <div className="tm-empty">
          <div className="tm-empty-text">Only admins can view company structure</div>
        </div>
      ) : null}

      {/* Modal */}
      <Modal
        title={
          <span
            style={{
              fontFamily: "Sora,sans-serif",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {editingTeam ? "Edit Team" : "Create New Team"}
          </span>
        }
        open={modalVisible}
        wrapClassName={dark ? "tm-dark-modal" : undefined}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={560}
        okText={editingTeam ? "Update" : "Create"}
        okButtonProps={{
          style: {
            background: dark ? "#e2e8f0" : "#3453B7",
            borderColor: dark ? "#e2e8f0" : "#3453B7",
            color: dark ? "#111111" : "#ffffff",
            borderRadius: 8,
            fontWeight: 600,
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          style={{ marginTop: 8 }}
        >
          <p className="tm-modal-sec">Team Info</p>
          <Form.Item
            name="name"
            label="Team Name"
            rules={[{ required: true, message: "Please enter a team name" }]}
          >
            <Input placeholder="e.g. Frontend Squad" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="What does this team work on?" />
          </Form.Item>

          <p className="tm-modal-sec">Members</p>
          <Form.Item name="members" label="Assign Members">
            <Select
              mode="multiple"
              placeholder="Search and select employees..."
              showSearch
              optionFilterProp="label"
              popupClassName={dark ? "tm-dark-popup" : undefined}
              style={{ width: "100%" }}
              options={employees.map((e) => ({
                label: `${e.full_name} - ${e.job_title || (e.role === "project_manager" ? "PM" : "Employee")}`,
                value: e.id,
              }))}
              optionRender={(opt) => {
                const emp = employees.find((e) => e.id === opt.value);
                if (!emp) return opt.label;
                return (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 9 }}
                  >
                    <MemberAvatar member={emp} size={28} radius={8} />
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: dark ? "#e8edf5" : "#0d0d0d",
                        }}
                      >
                        {emp.full_name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: dark ? "#9ca3af" : "#9a9a9a" }}
                      >
                        {emp.job_title ||
                          (emp.role === "project_manager"
                            ? "Project Manager"
                            : "Employee")}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        open={teamDrawer.open}
        onClose={() => setTeamDrawer({ open: false, team: null })}
        title="Team Details"
        width={480}
        rootClassName={dark ? "tm-dark-drawer" : undefined}
      >
        {teamDrawer.team && (
          <>
            <div className="tm-drawer-head">
              <h3 className="tm-drawer-name">{teamDrawer.team.name}</h3>
              <p className="tm-drawer-desc">
                {teamDrawer.team.description || "No description for this team."}
              </p>
            </div>

            <div className="tm-drawer-sec">
              <div className="tm-drawer-sec-title">Projects</div>
              {(teamProjects[teamDrawer.team.id] || []).length ? (
                <div className="tm-proj-list">
                  {(teamProjects[teamDrawer.team.id] || [])
                    .slice()
                    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                    .map((project) => {
                      const statusKey = String(project.status || "not_started").toLowerCase();
                      const statusColor = PROJECT_STATUS_COLORS[statusKey] || PROJECT_STATUS_COLORS.not_started;
                      const statusLabel = PROJECT_STATUS_LABELS[statusKey] || "Not Started";
                      return (
                        <div key={project.id} className="tm-proj-item">
                          <div className="tm-proj-top">
                            <p className="tm-proj-name">{project.name || "Untitled Project"}</p>
                            <span className="tm-proj-chip" style={{ color: statusColor }}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="tm-proj-meta">
                            <span className="tm-proj-meta-item">
                              {project.project_type ? `Type: ${project.project_type}` : "Type: N/A"}
                            </span>
                            <span className="tm-proj-meta-item">
                              {project.priority ? `Priority: ${project.priority}` : "Priority: N/A"}
                            </span>
                            <span className="tm-proj-meta-item">
                              Start: {project.start_date || "N/A"}
                            </span>
                            <span className="tm-proj-meta-item">
                              End: {project.end_date || "N/A"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="tm-proj-empty">
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <FolderOpen size={14} strokeWidth={2.1} />
                    No projects linked to this team yet.
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default Teams;
