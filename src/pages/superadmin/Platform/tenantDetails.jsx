import { useState, useEffect, useCallback } from "react";
import {
  Card, Button, Badge, Modal, Form, Input, Select, Drawer,
  Table, Progress, Spin, Divider, Popconfirm, message,
  Dropdown, Empty, Tooltip, Tag,
} from "antd";
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  MoreOutlined, StopOutlined, CheckCircleOutlined, UserOutlined,
  MailOutlined, PhoneOutlined, CalendarOutlined, ClockCircleOutlined,
  DollarOutlined, TeamOutlined, GlobalOutlined, SafetyOutlined,
  CrownOutlined, CodeOutlined, ApartmentOutlined, IdcardOutlined,
  BuildOutlined, LockOutlined, UnlockOutlined, BankOutlined,
  WarningOutlined, ReloadOutlined, PlusOutlined, KeyOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../../../components/Layout/MainLayout";
import { supabase } from "../../../lib/supabase";

const { Option } = Select;

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAN_COLOR = {
  Enterprise: { text: "#7c3aed", bg: "#f5f3ff", darkBg: "#2e1065", border: "#c4b5fd" },
  Pro:        { text: "#3b82f6", bg: "#eff6ff", darkBg: "#1e3a5f", border: "#93c5fd" },
  Starter:    { text: "#10b981", bg: "#ecfdf5", darkBg: "#064e3b", border: "#6ee7b7" },
  Free:       { text: "#6b7280", bg: "#f9fafb", darkBg: "#374151", border: "#d1d5db" },
};

const STATUS_CONFIG = {
  active:    { badge: "success",    label: "Active",    color: "#10b981" },
  trial:     { badge: "processing", label: "Trial",     color: "#3b82f6" },
  past_due:  { badge: "error",      label: "Past Due",  color: "#ef4444" },
  suspended: { badge: "default",    label: "Suspended", color: "#6b7280" },
  inactive:  { badge: "default",    label: "Inactive",  color: "#6b7280" },
};

const ROLE_CONFIG = {
  owner:     { color: "#f59e0b", bg: "#fffbeb", darkBg: "#451a03",  label: "Owner",     icon: <CrownOutlined /> },
  admin:     { color: "#7c3aed", bg: "#f5f3ff", darkBg: "#2e1065",  label: "Admin",     icon: <SafetyOutlined /> },
  manager:   { color: "#0ea5e9", bg: "#f0f9ff", darkBg: "#0c4a6e",  label: "Manager",   icon: <ApartmentOutlined /> },
  hr:        { color: "#ec4899", bg: "#fdf2f8", darkBg: "#500724",  label: "HR",        icon: <TeamOutlined /> },
  developer: { color: "#10b981", bg: "#ecfdf5", darkBg: "#064e3b",  label: "Developer", icon: <CodeOutlined /> },
  member:    { color: "#3b82f6", bg: "#eff6ff", darkBg: "#1e3a5f",  label: "Member",    icon: <UserOutlined /> },
  viewer:    { color: "#6b7280", bg: "#f9fafb", darkBg: "#374151",  label: "Viewer",    icon: <EyeOutlined /> },
};

const SALARY_TYPE_COLOR = {
  fixed:      { color: "#10b981", bg: "#ecfdf5", darkBg: "#064e3b" },
  commission: { color: "#f59e0b", bg: "#fffbeb", darkBg: "#451a03" },
  hybrid:     { color: "#7c3aed", bg: "#f5f3ff", darkBg: "#2e1065" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name, email) => {
  if (name) {
    const parts = name.trim().split(" ").filter(Boolean);
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() || "??";
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const fmtLongDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";

const timeAgo = (d) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000), hrs = Math.floor(mins / 60), days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
};

const fmtCurrency = (n) =>
  n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : "—";

// ─── Smart Avatar ─────────────────────────────────────────────────────────────
const SmartAvatar = ({ src, name, email, size = 36, radius = "10px", fontSize = 13, style = {} }) => {
  const [err, setErr] = useState(false);
  const seed = email || name || "";
  const palette = [
    { bg: "#dbeafe", text: "#1d4ed8" }, { bg: "#ede9fe", text: "#6d28d9" },
    { bg: "#d1fae5", text: "#065f46" }, { bg: "#fef3c7", text: "#92400e" },
    { bg: "#fce7f3", text: "#9d174d" }, { bg: "#e0f2fe", text: "#0369a1" },
  ];
  const darkPalette = [
    { bg: "#1e3a5f", text: "#60a5fa" }, { bg: "#2e1065", text: "#a78bfa" },
    { bg: "#064e3b", text: "#34d399" }, { bg: "#451a03", text: "#fbbf24" },
    { bg: "#4c0519", text: "#f472b6" }, { bg: "#0c4a6e", text: "#38bdf8" },
  ];
  const isDark = document.documentElement.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const colors = (isDark ? darkPalette : palette)[Math.abs(h) % palette.length];

  if (src && !err) {
    return (
      <img src={src} alt={name || "avatar"} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", flexShrink: 0, ...style }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: colors.bg, color: colors.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize, letterSpacing: "0.02em", ...style,
    }}>
      {getInitials(name, email)}
    </div>
  );
};

// ─── Company Logo ─────────────────────────────────────────────────────────────
const CompanyLogo = ({ domain, name, plan, size = 48, radius = "12px", isDark }) => {
  const [err, setErr] = useState(false);
  const pc = PLAN_COLOR[plan] || PLAN_COLOR.Free;
  const src = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;

  if (src && !err) {
    return (
      <img src={src} alt={name} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      background: isDark ? pc.darkBg : pc.bg, color: pc.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, fontSize: Math.max(12, size * 0.38),
      border: `2px solid ${isDark ? pc.text + "30" : pc.border}`,
    }}>
      {name?.slice(0, 2).toUpperCase() || "??"}
    </div>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, mono, tk, last }) => {
  if (!value || value === "—") return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
      borderBottom: last ? "none" : `1px solid ${tk.divider}`,
    }}>
      <span style={{ color: tk.textMuted, fontSize: 13, width: 16, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: tk.textMuted, marginBottom: 1 }}>
          {label}
        </div>
        <div style={{
          fontSize: 13, color: tk.textPri,
          fontFamily: mono ? "monospace" : "inherit",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {value}
        </div>
      </div>
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ label, tk }) => (
  <div style={{
    fontSize: 10, fontWeight: 800, textTransform: "uppercase",
    letterSpacing: "0.1em", color: tk.textMuted, marginBottom: 10,
  }}>
    {label}
  </div>
);

// ─── Stat Tile ────────────────────────────────────────────────────────────────
const StatTile = ({ label, value, color, tk }) => (
  <div style={{
    padding: "12px 14px", borderRadius: 10,
    background: tk.statBg, border: `1px solid ${tk.border}`,
  }}>
    <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: tk.textMuted, marginBottom: 5 }}>
      {label}
    </div>
    <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
  </div>
);

// ─── TenantDetailPage ─────────────────────────────────────────────────────────
const TenantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [tenantForm] = Form.useForm();
  const [userForm]   = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [tenant,      setTenant]      = useState(null);
  const [users,       setUsers]       = useState([]);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [usersLoading,  setUsersLoading]  = useState(true);
  const [saving,      setSaving]      = useState(false);

  const [editTenantOpen, setEditTenantOpen] = useState(false);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [viewUser,       setViewUser]       = useState(null);
  const [editUserOpen,   setEditUserOpen]   = useState(false);
  const [editingUser,    setEditingUser]    = useState(null);

  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const tk = {
    cardBg:    isDarkMode ? "#1e293b" : "#ffffff",
    border:    isDarkMode ? "#334155" : "#e2e8f0",
    divider:   isDarkMode ? "#1e293b" : "#f1f5f9",
    textPri:   isDarkMode ? "#f1f5f9" : "#0f172a",
    textSec:   isDarkMode ? "#94a3b8" : "#475569",
    textMuted: isDarkMode ? "#64748b" : "#94a3b8",
    statBg:    isDarkMode ? "#0f172a" : "#f8fafc",
    heroBg:    isDarkMode
      ? "linear-gradient(135deg,#1e293b 0%,#0f172a 100%)"
      : "linear-gradient(135deg,#f0f9ff 0%,#f8fafc 100%)",
    blue:   "#3b82f6",
    green:  "#10b981",
    amber:  "#f59e0b",
    red:    "#ef4444",
    purple: "#7c3aed",
  };

  // ── Fetch tenant ────────────────────────────────────────────────────────────
  const fetchTenant = useCallback(async () => {
    setTenantLoading(true);
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          id, name, plan, status, mrr, health_score, created_at, updated_at,
          owner_email, owner_name, domain, max_users, notes, storage_gb,
          trial_ends_at, industry, company_size, user_count,
          stripe_customer_id, stripe_subscription_id
        `)
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

  // ── Fetch users of this tenant ──────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, email, full_name, role, phone, contact, job_title, department,
          user_photo, salary_type, salary_amount, base_salary,
          working_hours, suspended, bio, address, cnic, dob, github_username,
          bank_name, bank_account_number, bank_account_name,
          created_at, updated_at
        `)
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

  useEffect(() => { fetchTenant(); fetchUsers(); }, [fetchTenant, fetchUsers]);

  // ── Filtered users ──────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchSearch = !userSearch ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.job_title?.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── Tenant edit ─────────────────────────────────────────────────────────────
  const openEditTenant = () => {
    tenantForm.setFieldsValue({
      name: tenant.name, plan: tenant.plan, status: tenant.status,
      owner_name: tenant.owner_name, owner_email: tenant.owner_email,
      domain: tenant.domain, mrr: tenant.mrr,
      max_users: tenant.max_users, notes: tenant.notes,
    });
    setEditTenantOpen(true);
  };

  const handleSaveTenant = async () => {
    try {
      const values = await tenantForm.validateFields();
      setSaving(true);
      const { error } = await supabase.from("tenants")
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
      const { error } = await supabase.from("tenants")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      messageApi.success(`Tenant ${newStatus}`);
      fetchTenant();
    } catch (err) {
      messageApi.error("Update failed");
    }
  };

  // ── User edit ───────────────────────────────────────────────────────────────
  const openEditUser = (user) => {
    setEditingUser(user);
    userForm.setFieldsValue({
      full_name: user.full_name, email: user.email, role: user.role,
      job_title: user.job_title, department: user.department,
      phone: user.phone, salary_type: user.salary_type,
      salary_amount: user.salary_amount, working_hours: user.working_hours,
    });
    setEditUserOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      const values = await userForm.validateFields();
      setSaving(true);
      const { error } = await supabase.from("profiles")
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
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
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
      const { error } = await supabase.from("profiles")
        .update({ suspended: suspend, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      messageApi.success(suspend ? "User suspended" : "User activated");
      fetchUsers();
      if (viewUser?.id === userId) setViewUser((v) => ({ ...v, suspended: suspend }));
    } catch (err) {
      messageApi.error("Update failed");
    }
  };

  // ── User row menu ───────────────────────────────────────────────────────────
  const userRowMenu = (user) => ({
    items: [
      { key: "view", icon: <EyeOutlined />,  label: "View Profile", onClick: () => { setViewUser(user); setUserDrawerOpen(true); } },
      { key: "edit", icon: <EditOutlined />, label: "Edit",          onClick: (e) => { e.domEvent.stopPropagation(); openEditUser(user); } },
      { type: "divider" },
      user.suspended
        ? { key: "activate", icon: <CheckCircleOutlined />, label: "Activate",       onClick: () => handleUserSuspend(user.id, false) }
        : { key: "suspend",  icon: <StopOutlined />,        label: "Suspend", danger: true, onClick: () => handleUserSuspend(user.id, true) },
      { type: "divider" },
      {
        key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true,
        onClick: () => Modal.confirm({
          title: `Delete "${user.full_name || user.email}"?`,
          content: "This cannot be undone.",
          okText: "Delete", okType: "danger",
          onOk: () => handleDeleteUser(user.id),
        }),
      },
    ],
  });

  // ── User table columns ──────────────────────────────────────────────────────
  const userColumns = [
    {
      title: "User",
      dataIndex: "full_name",
      sorter: (a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || ""),
      render: (name, row) => {
        const src = row.user_photo
          ? (row.user_photo.startsWith("http") ? row.user_photo
            : supabase.storage.from("avatars").getPublicUrl(row.user_photo).data?.publicUrl)
          : null;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <SmartAvatar src={src} name={name} email={row.email} size={36} radius="10px"
                style={{ border: `2px solid ${row.suspended ? tk.red + "50" : tk.green + "50"}` }} />
              <span style={{
                position: "absolute", bottom: -2, right: -2,
                width: 9, height: 9, borderRadius: "50%",
                background: row.suspended ? tk.red : tk.green,
                border: `2px solid ${tk.cardBg}`,
              }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: tk.textPri }}>
                {name || <span style={{ color: tk.textMuted, fontWeight: 400 }}>No name</span>}
              </div>
              <div style={{ fontSize: 11, color: tk.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Position",
      render: (_, row) => (
        <div>
          <div style={{ fontSize: 13, color: tk.textPri, fontWeight: 500 }}>
            {row.job_title || <span style={{ color: tk.textMuted }}>—</span>}
          </div>
          {row.department && <div style={{ fontSize: 11, color: tk.textMuted }}>{row.department}</div>}
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      render: (role) => {
        const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.member;
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
            background: isDarkMode ? cfg.darkBg : cfg.bg, color: cfg.color,
          }}>
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
        suspended
          ? <Badge status="error"   text={<span style={{ fontSize: 12, fontWeight: 500, color: tk.red   }}>Suspended</span>} />
          : <Badge status="success" text={<span style={{ fontSize: 12, fontWeight: 500, color: tk.green }}>Active</span>} />,
    },
    {
      title: "Salary",
      dataIndex: "salary_amount",
      sorter: (a, b) => (a.salary_amount || 0) - (b.salary_amount || 0),
      render: (amount, row) => {
        if (!amount) return <span style={{ color: tk.textMuted }}>—</span>;
        const sc = SALARY_TYPE_COLOR[row.salary_type] || SALARY_TYPE_COLOR.fixed;
        return (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: tk.textPri }}>
              {fmtCurrency(amount)}
            </div>
            {row.salary_type && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 20,
                background: isDarkMode ? sc.darkBg : sc.bg, color: sc.color,
              }}>
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
          <span style={{ fontSize: 12, color: tk.textMuted }}>{fmtDate(date)}</span>
        </Tooltip>
      ),
    },
    {
      title: "",
      width: 44,
      render: (_, row) => (
        <Dropdown menu={userRowMenu(row)} trigger={["click"]} placement="bottomRight">
          <Button type="text" size="small" icon={<MoreOutlined />}
            style={{ color: tk.textMuted }}
            onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  if (tenantLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <div style={{ fontSize: 16, color: "#6b7280", marginBottom: 16 }}>Tenant not found</div>
        <Button onClick={() => navigate("/tenants")}>Back to Tenants</Button>
      </div>
    );
  }

  const pc = PLAN_COLOR[tenant.plan] || PLAN_COLOR.Free;
  const sc = STATUS_CONFIG[tenant.status] || STATUS_CONFIG.inactive;
  const activeUsers = users.filter((u) => !u.suspended).length;
  const suspendedUsers = users.filter((u) => u.suspended).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: tk.textPri }}>
      {contextHolder}

      {/* ── Back nav ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <Button
          type="text" icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/tenants")}
          style={{ color: tk.textMuted, padding: "4px 0", fontWeight: 500 }}
        >
          Back to Tenants
        </Button>
      </div>

      {/* ── Tenant Hero Card ────────────────────────────────────────────── */}
      <Card
        style={{
          background: tk.cardBg, border: `1px solid ${tk.border}`,
          borderRadius: 16, marginBottom: 20, overflow: "hidden",
        }}
        styles={{ body: { padding: 0 } }}
      >
        {/* Hero banner */}
        <div style={{
          background: isDarkMode
            ? `linear-gradient(135deg, ${pc.darkBg} 0%, #1e293b 60%, #0f172a 100%)`
            : `linear-gradient(135deg, ${pc.bg} 0%, #f8fafc 100%)`,
          padding: "28px 28px 24px",
          borderBottom: `1px solid ${tk.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>

            {/* Left: logo + info */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <CompanyLogo
                domain={tenant.domain} name={tenant.name}
                plan={tenant.plan} size={64} radius="16px" isDark={isDarkMode}
              />
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: tk.textPri, lineHeight: 1.2 }}>
                  {tenant.name}
                </h2>
                <div style={{ fontSize: 13, color: tk.textMuted, marginTop: 3 }}>
                  {tenant.domain || tenant.owner_email || "No domain set"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {/* Plan badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20,
                    background: isDarkMode ? pc.darkBg : pc.bg, color: pc.text,
                    border: `1px solid ${isDarkMode ? pc.text + "40" : pc.border}`,
                  }}>
                    {tenant.plan}
                  </span>
                  {/* Status badge */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                    background: `${sc.color}15`, color: sc.color,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, display: "inline-block" }} />
                    {sc.label}
                  </span>
                  {/* Trial ends */}
                  {tenant.trial_ends_at && (
                    <span style={{ fontSize: 11, color: tk.amber, background: `${tk.amber}15`, padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>
                      Trial ends {fmtDate(tenant.trial_ends_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {tenant.status === "active" ? (
                <Popconfirm
                  title="Suspend this tenant?"
                  description="All users will lose access immediately."
                  onConfirm={() => handleTenantStatusChange("suspended")}
                  okText="Suspend" okType="danger"
                >
                  <Button danger icon={<StopOutlined />}>Suspend</Button>
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
              <Button type="primary" icon={<EditOutlined />} onClick={openEditTenant}>
                Edit Tenant
              </Button>
              <Popconfirm
                title={`Delete "${tenant.name}"?`}
                description="This will permanently remove the tenant and all data."
                onConfirm={handleDeleteTenant}
                okText="Delete" okType="danger"
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          </div>
        </div>

        {/* KPI stats row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          borderTop: `1px solid ${tk.border}`,
        }}>
          {[
            { label: "MRR",       value: fmtCurrency(tenant.mrr),                   color: tk.purple },
            { label: "Users",     value: `${users.length}${tenant.max_users ? ` / ${tenant.max_users}` : ""}`, color: tk.blue   },
            { label: "Active",    value: activeUsers,                                 color: tk.green  },
            { label: "Suspended", value: suspendedUsers,                              color: tk.red    },
            { label: "Health",    value: tenant.health_score != null ? `${tenant.health_score}%` : "—", color: tenant.health_score > 70 ? tk.green : tk.red },
            { label: "Storage",   value: tenant.storage_gb != null ? `${tenant.storage_gb} GB` : "—",  color: tk.blue   },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              padding: "16px 20px",
              borderRight: i < arr.length - 1 ? `1px solid ${tk.border}` : "none",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: tk.textMuted, marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: s.color, fontFamily: "monospace" }}>
                {usersLoading && (s.label === "Users" || s.label === "Active" || s.label === "Suspended")
                  ? <Spin size="small" /> : s.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Two-column layout: Tenant info left, Users right ─────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16, alignItems: "start" }}>

        {/* ── Left: Tenant Details ──────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Contact info */}
          <Card style={{ background: tk.cardBg, border: `1px solid ${tk.border}`, borderRadius: 14 }}
            styles={{ body: { padding: "16px 0 4px" } }}>
            <div style={{ padding: "0 16px 10px" }}>
              <SectionHeader label="Contact" tk={tk} />
            </div>
            {[
              { icon: <UserOutlined />,     label: "Owner",   value: tenant.owner_name  },
              { icon: <MailOutlined />,     label: "Email",   value: tenant.owner_email },
              { icon: <GlobalOutlined />,   label: "Domain",  value: tenant.domain      },
              { icon: <CalendarOutlined />, label: "Joined",  value: fmtLongDate(tenant.created_at) },
              { icon: <ClockCircleOutlined />, label: "Updated", value: timeAgo(tenant.updated_at) },
            ].map((r, i, arr) => (
              <InfoRow key={r.label} {...r} tk={tk} last={i === arr.length - 1} />
            ))}
          </Card>

          {/* Company info */}
          <Card style={{ background: tk.cardBg, border: `1px solid ${tk.border}`, borderRadius: 14 }}
            styles={{ body: { padding: "16px 0 4px" } }}>
            <div style={{ padding: "0 16px 10px" }}>
              <SectionHeader label="Company" tk={tk} />
            </div>
            {[
              { icon: <BuildOutlined />,    label: "Industry",     value: tenant.industry     },
              { icon: <TeamOutlined />,     label: "Company Size", value: tenant.company_size },
              { icon: <DollarOutlined />,   label: "MRR",          value: fmtCurrency(tenant.mrr) },
            ].map((r, i, arr) => (
              <InfoRow key={r.label} {...r} tk={tk} last={i === arr.length - 1} />
            ))}
          </Card>

          {/* User capacity */}
          {tenant.max_users && (
            <Card style={{ background: tk.cardBg, border: `1px solid ${tk.border}`, borderRadius: 14 }}
              styles={{ body: { padding: 16 } }}>
              <SectionHeader label="User Capacity" tk={tk} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: tk.textMuted, marginBottom: 8 }}>
                <span>{users.length} of {tenant.max_users} users</span>
                <span style={{ fontWeight: 700 }}>
                  {Math.round((users.length / tenant.max_users) * 100)}%
                </span>
              </div>
              <Progress
                percent={Math.round((users.length / tenant.max_users) * 100)}
                showInfo={false}
                strokeColor={users.length / tenant.max_users > 0.9 ? tk.red : tk.blue}
                trailColor={tk.border}
              />
            </Card>
          )}

          {/* Health */}
          {tenant.health_score != null && (
            <Card style={{ background: tk.cardBg, border: `1px solid ${tk.border}`, borderRadius: 14 }}
              styles={{ body: { padding: 16 } }}>
              <SectionHeader label="Health Score" tk={tk} />
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  border: `4px solid ${tenant.health_score > 90 ? tk.green : tenant.health_score > 70 ? tk.amber : tk.red}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 900, color: tk.textPri,
                }}>
                  {tenant.health_score}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: tenant.health_score > 90 ? tk.green : tenant.health_score > 70 ? tk.amber : tk.red }}>
                    {tenant.health_score > 90 ? "Excellent" : tenant.health_score > 70 ? "Good" : "Needs Attention"}
                  </div>
                  <div style={{ fontSize: 11, color: tk.textMuted }}>Health score</div>
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          {tenant.notes && (
            <Card style={{ background: tk.cardBg, border: `1px solid ${tk.border}`, borderRadius: 14 }}
              styles={{ body: { padding: 16 } }}>
              <SectionHeader label="Notes" tk={tk} />
              <div style={{ fontSize: 13, lineHeight: 1.6, color: tk.textSec }}>{tenant.notes}</div>
            </Card>
          )}

          {/* Billing IDs */}
          {(tenant.stripe_customer_id || tenant.stripe_subscription_id) && (
            <Card style={{ background: tk.cardBg, border: `1px solid ${tk.border}`, borderRadius: 14 }}
              styles={{ body: { padding: 16 } }}>
              <SectionHeader label="Billing" tk={tk} />
              {[
                { label: "Customer ID",     value: tenant.stripe_customer_id },
                { label: "Subscription ID", value: tenant.stripe_subscription_id },
              ].filter((r) => r.value).map((r) => (
                <div key={r.label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: tk.textMuted, marginBottom: 3 }}>
                    {r.label}
                  </div>
                  <Tooltip title="Click to copy">
                    <div
                      style={{
                        fontSize: 11, fontFamily: "monospace", padding: "6px 10px",
                        borderRadius: 8, background: tk.statBg, border: `1px solid ${tk.border}`,
                        color: tk.textSec, cursor: "pointer", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                      onClick={() => { navigator.clipboard.writeText(r.value); messageApi.success(`${r.label} copied`); }}
                    >
                      {r.value}
                    </div>
                  </Tooltip>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* ── Right: Users Table ────────────────────────────────────────── */}
        <Card
          style={{ background: tk.cardBg, border: `1px solid ${tk.border}`, borderRadius: 14 }}
          styles={{ body: { padding: 0 } }}
        >
          {/* Users toolbar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", borderBottom: `1px solid ${tk.divider}`, flexWrap: "wrap", gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `${tk.blue}18`, color: tk.blue,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              }}>
                <TeamOutlined />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: tk.textPri }}>Users</div>
                <div style={{ fontSize: 11, color: tk.textMuted }}>
                  {usersLoading ? "Loading…" : `${users.length} member${users.length !== 1 ? "s" : ""} in this tenant`}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Input
                placeholder="Search users…"
                allowClear
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: 200 }}
                prefix={<UserOutlined style={{ color: tk.textMuted, fontSize: 12 }} />}
                size="small"
              />
              <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 120 }} size="small">
                <Option value="all">All Roles</Option>
                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: v.color, fontSize: 10 }}>{v.icon}</span>
                      {v.label}
                    </span>
                  </Option>
                ))}
              </Select>
              <Tooltip title="Refresh">
                <Button size="small" icon={<ReloadOutlined />} onClick={fetchUsers}
                  style={{ borderColor: tk.border, color: tk.textSec, background: "transparent" }} />
              </Tooltip>
            </div>
          </div>

          {/* Results bar */}
          {!usersLoading && (
            <div style={{
              padding: "6px 20px", borderBottom: `1px solid ${tk.divider}`,
              background: tk.statBg, fontSize: 12, color: tk.textMuted,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span>
                <b style={{ color: tk.textSec }}>{filteredUsers.length}</b> of <b style={{ color: tk.textSec }}>{users.length}</b> users
              </span>
              <div style={{ display: "flex", gap: 14 }}>
                {[
                  { label: "Active",    count: filteredUsers.filter((u) => !u.suspended).length, color: tk.green },
                  { label: "Suspended", count: filteredUsers.filter((u) =>  u.suspended).length, color: tk.red   },
                ].map((s) => (
                  <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                    <b style={{ color: tk.textSec }}>{s.count}</b>&nbsp;{s.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Users table */}
          <Table
            dataSource={filteredUsers}
            columns={userColumns}
            loading={usersLoading}
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"],
              showTotal: (t) => <span style={{ color: tk.textMuted, fontSize: 12 }}>{t} users</span> }}
            onRow={(row) => ({
              onClick: () => { setViewUser(row); setUserDrawerOpen(true); },
              style: { cursor: "pointer" },
            })}
            locale={{
              emptyText: (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <TeamOutlined style={{ fontSize: 32, color: tk.textMuted, marginBottom: 10 }} />
                  <div style={{ color: tk.textMuted, fontSize: 14 }}>No users in this tenant yet</div>
                </div>
              ),
            }}
          />
        </Card>
      </div>

      {/* ── Edit Tenant Modal ─────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CompanyLogo domain={tenant.domain} name={tenant.name} plan={tenant.plan} size={28} radius="7px" isDark={isDarkMode} />
            <span style={{ fontWeight: 700, color: tk.textPri }}>Edit — {tenant.name}</span>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item name="name" label="Company Name" rules={[{ required: true }]}>
              <Input placeholder="Acme Corp" />
            </Form.Item>
            <Form.Item name="domain" label="Domain">
              <Input placeholder="acme.com" />
            </Form.Item>
            <Form.Item name="owner_name" label="Owner Name">
              <Input placeholder="John Smith" />
            </Form.Item>
            <Form.Item name="owner_email" label="Owner Email" rules={[{ type: "email" }]}>
              <Input placeholder="john@acme.com" />
            </Form.Item>
            <Form.Item name="plan" label="Plan" rules={[{ required: true }]}>
              <Select placeholder="Select plan">
                {["Enterprise","Pro","Starter","Free"].map((p) => <Option key={p} value={p}>{p}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select placeholder="Select status">
                {["active","trial","past_due","suspended","inactive"].map((s) => (
                  <Option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</Option>
                ))}
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

      {/* ── Edit User Modal ───────────────────────────────────────────── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {editingUser && (
              <SmartAvatar
                src={editingUser.user_photo?.startsWith("http") ? editingUser.user_photo : null}
                name={editingUser.full_name} email={editingUser.email}
                size={30} radius="8px" fontSize={11}
              />
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tk.textPri }}>Edit User</div>
              {editingUser?.email && <div style={{ fontSize: 11, color: tk.textMuted }}>{editingUser.email}</div>}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item name="full_name" label="Full Name">
              <Input prefix={<UserOutlined style={{ color: tk.textMuted }} />} placeholder="Jane Doe" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
              <Input prefix={<MailOutlined style={{ color: tk.textMuted }} />} placeholder="jane@company.com" />
            </Form.Item>
            <Form.Item name="job_title" label="Job Title">
              <Input prefix={<IdcardOutlined style={{ color: tk.textMuted }} />} placeholder="Developer" />
            </Form.Item>
            <Form.Item name="department" label="Department">
              <Input prefix={<BuildOutlined style={{ color: tk.textMuted }} />} placeholder="Engineering" />
            </Form.Item>
            <Form.Item name="role" label="Role">
              <Select placeholder="Select role">
                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                  <Option key={k} value={k}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: v.color }}>{v.icon}</span>{v.label}
                    </span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input prefix={<PhoneOutlined style={{ color: tk.textMuted }} />} placeholder="+1 234 567 8900" />
            </Form.Item>
            <Form.Item name="salary_type" label="Salary Type">
              <Select placeholder="Select type" allowClear>
                <Option value="fixed">Fixed</Option>
                <Option value="commission">Commission</Option>
                <Option value="hybrid">Hybrid</Option>
              </Select>
            </Form.Item>
            <Form.Item name="salary_amount" label="Salary ($)">
              <Input type="number" min={0} prefix={<DollarOutlined style={{ color: tk.textMuted }} />} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* ── User Detail Drawer ────────────────────────────────────────── */}
      <Drawer
        title={null}
        open={userDrawerOpen}
        onClose={() => setUserDrawerOpen(false)}
        width={460}
        styles={{ body: { padding: 0 }, header: { display: "none" } }}
      >
        {viewUser && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Drawer hero */}
            <div style={{
              background: tk.heroBg, borderBottom: `1px solid ${tk.border}`,
              padding: "24px 24px 20px", flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative" }}>
                    <SmartAvatar
                      src={viewUser.user_photo?.startsWith("http") ? viewUser.user_photo : null}
                      name={viewUser.full_name} email={viewUser.email}
                      size={60} radius="15px" fontSize={20}
                      style={{ border: `3px solid ${viewUser.suspended ? tk.red + "60" : tk.green + "60"}` }}
                    />
                    <span style={{
                      position: "absolute", bottom: -3, right: -3,
                      width: 14, height: 14, borderRadius: "50%",
                      background: viewUser.suspended ? tk.red : tk.green,
                      border: `3px solid ${isDarkMode ? "#1e293b" : "#f0f9ff"}`,
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: tk.textPri, lineHeight: 1.2 }}>
                      {viewUser.full_name || <span style={{ color: tk.textMuted, fontWeight: 400 }}>No name</span>}
                    </div>
                    <div style={{ fontSize: 12, color: tk.textMuted, marginTop: 2 }}>{viewUser.email}</div>
                    {(viewUser.job_title || viewUser.department) && (
                      <div style={{ fontSize: 12, color: tk.textMuted, marginTop: 1 }}>
                        {[viewUser.job_title, viewUser.department].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                        background: viewUser.suspended ? `${tk.red}18` : `${tk.green}18`,
                        color: viewUser.suspended ? tk.red : tk.green,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: viewUser.suspended ? tk.red : tk.green, display: "inline-block" }} />
                        {viewUser.suspended ? "Suspended" : "Active"}
                      </span>
                      {viewUser.role && (() => {
                        const cfg = ROLE_CONFIG[viewUser.role] || ROLE_CONFIG.member;
                        return (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                            background: isDarkMode ? cfg.darkBg : cfg.bg, color: cfg.color,
                          }}>
                            <span style={{ fontSize: 10 }}>{cfg.icon}</span>{cfg.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <Button type="primary" size="small" icon={<EditOutlined />}
                  onClick={() => { setUserDrawerOpen(false); openEditUser(viewUser); }}>
                  Edit
                </Button>
              </div>
            </div>

            {/* Drawer body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Employment */}
                <div>
                  <SectionHeader label="Employment" tk={tk} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Salary",       value: fmtCurrency(viewUser.salary_amount), color: tk.green  },
                      { label: "Base Salary",  value: fmtCurrency(viewUser.base_salary),   color: tk.blue   },
                      { label: "Salary Type",  value: viewUser.salary_type
                          ? viewUser.salary_type.charAt(0).toUpperCase() + viewUser.salary_type.slice(1) : "—", color: tk.amber },
                      { label: "Hours / Week", value: viewUser.working_hours ? `${viewUser.working_hours}h` : "—", color: tk.purple },
                    ].map((item) => (
                      <StatTile key={item.label} {...item} tk={tk} />
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <SectionHeader label="Contact & Personal" tk={tk} />
                  <div style={{ borderRadius: 12, border: `1px solid ${tk.border}`, overflow: "hidden" }}>
                    {[
                      { icon: <MailOutlined />,        label: "Email",         value: viewUser.email },
                      { icon: <PhoneOutlined />,       label: "Phone",         value: viewUser.phone || viewUser.contact },
                      { icon: <CalendarOutlined />,    label: "Date of Birth", value: fmtDate(viewUser.dob) },
                      { icon: <IdcardOutlined />,      label: "CNIC",          value: viewUser.cnic, mono: true },
                      { icon: <CodeOutlined />,        label: "GitHub",        value: viewUser.github_username ? `@${viewUser.github_username}` : null },
                      { icon: <CalendarOutlined />,    label: "Joined",        value: fmtDate(viewUser.created_at) },
                      { icon: <ClockCircleOutlined />, label: "Last Updated",  value: timeAgo(viewUser.updated_at) },
                    ].filter((r) => r.value).map((row, i, arr) => (
                      <InfoRow key={row.label} {...row} tk={tk} last={i === arr.length - 1} />
                    ))}
                  </div>
                </div>

                {/* Bio */}
                {viewUser.bio && (
                  <div>
                    <SectionHeader label="Bio" tk={tk} />
                    <div style={{
                      fontSize: 13, lineHeight: 1.6, padding: "12px 14px", borderRadius: 10,
                      background: tk.statBg, border: `1px solid ${tk.border}`, color: tk.textSec,
                    }}>
                      {viewUser.bio}
                    </div>
                  </div>
                )}

                {/* Bank details */}
                {(viewUser.bank_name || viewUser.bank_account_number) && (
                  <div>
                    <SectionHeader label="Bank Details" tk={tk} />
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      borderRadius: 10, background: tk.statBg, border: `1px solid ${tk.border}`,
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: `${tk.green}15`, color: tk.green,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                      }}>
                        <BankOutlined />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: tk.textPri }}>
                          {viewUser.bank_name || "—"}
                          {viewUser.bank_account_name && (
                            <span style={{ fontWeight: 400, color: tk.textMuted }}> · {viewUser.bank_account_name}</span>
                          )}
                        </div>
                        {viewUser.bank_account_number && (
                          <div style={{ fontSize: 12, fontFamily: "monospace", color: tk.textMuted }}>{viewUser.bank_account_number}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* System IDs */}
                <div>
                  <SectionHeader label="System IDs" tk={tk} />
                  {[{ label: "User ID", value: viewUser.id }].map((r) => (
                    <div key={r.label} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: tk.textMuted, marginBottom: 4 }}>
                        {r.label}
                      </div>
                      <Tooltip title="Click to copy">
                        <div
                          style={{
                            fontSize: 11, fontFamily: "monospace", padding: "7px 10px",
                            borderRadius: 8, background: tk.statBg, border: `1px solid ${tk.border}`,
                            color: tk.textSec, cursor: "pointer", overflow: "hidden",
                            textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}
                          onClick={() => { navigator.clipboard.writeText(r.value); messageApi.success("ID copied"); }}
                        >
                          {r.value}
                        </div>
                      </Tooltip>
                    </div>
                  ))}
                </div>

                <Divider style={{ borderColor: tk.divider, margin: 0 }} />

                {/* Quick actions */}
                <div style={{ paddingBottom: 8 }}>
                  <SectionHeader label="Quick Actions" tk={tk} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {viewUser.suspended ? (
                      <Button block icon={<UnlockOutlined />}
                        style={{ borderColor: tk.green, color: tk.green, height: 38 }}
                        onClick={() => { handleUserSuspend(viewUser.id, false); setUserDrawerOpen(false); }}>
                        Activate User
                      </Button>
                    ) : (
                      <Popconfirm title="Suspend this user?" description="They will lose access immediately."
                        onConfirm={() => { handleUserSuspend(viewUser.id, true); setUserDrawerOpen(false); }}
                        okText="Suspend" okType="danger">
                        <Button danger block icon={<LockOutlined />} style={{ height: 38 }}>Suspend User</Button>
                      </Popconfirm>
                    )}
                    <Popconfirm title="Delete this user?" description="This cannot be undone."
                      onConfirm={() => handleDeleteUser(viewUser.id)}
                      okText="Delete" okType="danger">
                      <Button danger block icon={<DeleteOutlined />} type="text" style={{ height: 38 }}>
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