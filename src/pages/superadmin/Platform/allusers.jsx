import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Form,
  Drawer,
  Spin,
  Popconfirm,
  message,
  Dropdown,
  Divider,
  Empty,
  Tooltip,
  Avatar,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  MailOutlined,
  LockOutlined,
  UnlockOutlined,
  SafetyOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  BankOutlined,
  CodeOutlined,
  DollarOutlined,
  IdcardOutlined,
  HomeOutlined,
  CrownOutlined,
  BuildOutlined,
  GlobalOutlined,
  FilterOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../components/Layout/MainLayout";
import { supabase } from "../../../lib/supabase";

const { Search } = Input;
const { Option } = Select;

// --------- Constants ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const ROLE_OPTIONS = ["admin", "member", "viewer", "owner", "manager", "hr", "developer"];

const ROLE_CONFIG = {
  owner:     { color: "#f59e0b", bg: "#fffbeb", darkBg: "#451a03",  label: "Owner",     icon: <CrownOutlined /> },
  admin:     { color: "#7c3aed", bg: "#f5f3ff", darkBg: "#2e1065",  label: "Admin",     icon: <SafetyOutlined /> },
  manager:   { color: "#0ea5e9", bg: "#f0f9ff", darkBg: "#0c4a6e",  label: "Manager",   icon: <ApartmentOutlined /> },
  hr:        { color: "#ec4899", bg: "#fdf2f8", darkBg: "#500724",  label: "HR",        icon: <TeamOutlined /> },
  developer: { color: "#10b981", bg: "#ecfdf5", darkBg: "#064e3b",  label: "Developer", icon: <CodeOutlined /> },
  member:    { color: "#3b82f6", bg: "#eff6ff", darkBg: "#1e3a5f",  label: "Member",    icon: <UserOutlined /> },
  viewer:    { color: "#6b7280", bg: "#f9fafb", darkBg: "#374151",  label: "Viewer",    icon: <EyeOutlined /> },
};

const PLAN_COLOR = {
  Enterprise: { text: "#7c3aed", bg: "#f5f3ff", darkBg: "#2e1065", border: "#c4b5fd" },
  Pro:        { text: "#3b82f6", bg: "#eff6ff", darkBg: "#1e3a5f", border: "#93c5fd" },
  Starter:    { text: "#10b981", bg: "#ecfdf5", darkBg: "#064e3b", border: "#6ee7b7" },
  Free:       { text: "#6b7280", bg: "#f9fafb", darkBg: "#374151", border: "#d1d5db" },
};

const SALARY_TYPE_COLOR = {
  fixed:      { color: "#10b981", bg: "#ecfdf5", darkBg: "#064e3b" },
  commission: { color: "#f59e0b", bg: "#fffbeb", darkBg: "#451a03" },
  hybrid:     { color: "#7c3aed", bg: "#f5f3ff", darkBg: "#2e1065" },
};

// --------- Helpers ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const getInitials = (name, email) => {
  if (name) {
    const parts = name.trim().split(" ").filter(Boolean);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() || "??";
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "---";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const fmtDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "---";

const fmtCurrency = (amount) =>
  amount != null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)
    : "---";

// --------- Smart Image component with fallback ------------------------------------------------------------------------------------------------------------------
const SmartAvatar = ({ src, name, email, size = 36, radius = "10px", fontSize = 13, style = {} }) => {
  const [imgErr, setImgErr] = useState(false);
  const initials = getInitials(name, email || name);

  const palette = [
    { bg: "#dbeafe", text: "#1d4ed8" },
    { bg: "#ede9fe", text: "#6d28d9" },
    { bg: "#d1fae5", text: "#065f46" },
    { bg: "#fef3c7", text: "#92400e" },
    { bg: "#fce7f3", text: "#9d174d" },
    { bg: "#e0f2fe", text: "#0369a1" },
    { bg: "#fef9c3", text: "#854d0e" },
    { bg: "#f1f5f9", text: "#334155" },
  ];
  const darkPalette = [
    { bg: "#1e3a5f", text: "#60a5fa" },
    { bg: "#2e1065", text: "#a78bfa" },
    { bg: "#064e3b", text: "#34d399" },
    { bg: "#451a03", text: "#fbbf24" },
    { bg: "#4c0519", text: "#f472b6" },
    { bg: "#0c4a6e", text: "#38bdf8" },
    { bg: "#3b2700", text: "#fb923c" },
    { bg: "#1e293b", text: "#94a3b8" },
  ];

  const seed = (email || name || "");
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const idx = Math.abs(h) % palette.length;

  // Try to detect dark mode from body class or data attribute
  const isDark = document.documentElement.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark";
  const colors = isDark ? darkPalette[idx] : palette[idx];

  if (src && !imgErr) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        onError={() => setImgErr(true)}
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
        background: colors.bg,
        color: colors.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize,
        flexShrink: 0,
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      {initials}
    </div>
  );
};

// --------- Company logo with letter fallback ---------------------------------------------------------------------------------------------------------------------
const CompanyLogo = ({ src, name, size = 24, radius = "6px", plan, isDark }) => {
  const [imgErr, setImgErr] = useState(false);
  const pc = PLAN_COLOR[plan] || PLAN_COLOR.Free;
  const letter = name?.slice(0, 1).toUpperCase() || "?";

  if (src && !imgErr) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgErr(true)}
        style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: isDark ? pc.darkBg : pc.bg,
        color: pc.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: Math.max(9, size * 0.45),
        flexShrink: 0,
        border: `1px solid ${isDark ? pc.text + "30" : pc.border || pc.bg}`,
      }}
    >
      {letter}
    </div>
  );
};

// --------- Stat card ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const StatCard = ({ label, value, sub, icon, color, loading, total, tk }) => (
  <Card
    style={{ background: tk.cardBg, border: `1px solid ${tk.border}`, borderRadius: 14, overflow: "hidden" }}
    styles={{ body: { padding: "18px 20px 14px" } }}
  >
    <div className="flex items-start justify-between mb-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
        style={{ background: `${color}15`, color }}
      >
        {icon}
      </div>
      <div className="text-right">
        <div className="text-2xl font-black leading-none" style={{ color: tk.textPri }}>
          {loading ? <Spin size="small" /> : (typeof value === "number" ? value.toLocaleString() : value)}
        </div>
      </div>
    </div>
    <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: tk.textMuted }}>
      {label}
    </div>
    <div className="text-[11px]" style={{ color: tk.textMuted }}>{sub}</div>
    {typeof value === "number" && total > 0 && (
      <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: `${color}18` }}>
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, (value / total) * 100)}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            borderRadius: 2,
            transition: "width 1s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    )}
  </Card>
);

// --------- All Users Page ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const AllUsersPage = () => {
  const { isDarkMode } = useTheme();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [users,    setUsers]    = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [tenants,  setTenants]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const [search,       setSearch]       = useState("");
  const [tenantFilter, setTenantFilter] = useState("all");
  const [roleFilter,   setRoleFilter]   = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewUser,      setViewUser]      = useState(null);
  const [editingUser,   setEditingUser]   = useState(null);

  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

  // ------ Theme ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const tk = {
    pageBg:       isDarkMode ? "#0f172a" : "#f8fafc",
    cardBg:       isDarkMode ? "#1e293b" : "#ffffff",
    cardBg2:      isDarkMode ? "#0f172a" : "#f8fafc",
    border:       isDarkMode ? "#334155" : "#e2e8f0",
    divider:      isDarkMode ? "#1e293b" : "#f1f5f9",
    textPri:      isDarkMode ? "#f1f5f9" : "#0f172a",
    textSec:      isDarkMode ? "#94a3b8" : "#475569",
    textMuted:    isDarkMode ? "#64748b" : "#94a3b8",
    rowHover:     isDarkMode ? "#1e293b" : "#f8fafc",
    statBg:       isDarkMode ? "#0f172a" : "#f8fafc",
    heroBg:       isDarkMode
      ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
      : "linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)",
    blue:   "#3b82f6",
    purple: "#7c3aed",
    green:  "#10b981",
    amber:  "#f59e0b",
    red:    "#ef4444",
    cyan:   "#06b6d4",
  };

  // ------ Supabase public URL helper ---------------------------------------------------------------------------------------------------------------------------------------
  // Generates a public URL from a storage path or returns the raw URL if already absolute
  const getPublicUrl = (path, bucket = "avatars") => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  };

  // ------ Fetch tenants ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const fetchTenants = useCallback(async () => {
    const { data } = await supabase
      .from("tenants")
      .select("id, name, plan, domain, status, owner_email, industry, company_size")
      .order("name");
    setTenants(data || []);
  }, []);

  // ------ Fetch users --- exclude superadmin role ------------------------------------------------------------------------------------------------------
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          role,
          contact,
          phone,
          job_title,
          department,
          company_name,
          bio,
          address,
          github_username,
          cnic,
          dob,
          profile_picture_url,
          salary_type,
          salary_amount,
          base_salary,
          commission_rate,
          working_hours,
          suspended,
          bank_name,
          bank_account_number,
          bank_account_name,
          created_at,
          updated_at,
          tenant_id,
          tenants (
            id,
            name,
            plan,
            domain,
            status,
            owner_email,
            industry,
            company_size
          )
        `)
        // Exclude superadmin accounts
        .not("role", "eq", "superadmin")
        .not("role", "eq", "super_admin")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Also filter client-side in case of any edge cases
      const clean = (data || []).filter(
        (u) => u.role !== "superadmin" && u.role !== "super_admin"
      );

      setUsers(clean);
      setPagination((p) => ({ ...p, total: clean.length }));
    } catch (err) {
      messageApi.error("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); fetchUsers(); }, [fetchTenants, fetchUsers]);

  // ------ Client-side filter ---------------------------------------------------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    let rows = [...users];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.job_title?.toLowerCase().includes(q) ||
          u.department?.toLowerCase().includes(q) ||
          u.tenants?.name?.toLowerCase().includes(q)
      );
    }
    if (tenantFilter !== "all") rows = rows.filter((u) => u.tenant_id === tenantFilter);
    if (roleFilter   !== "all") rows = rows.filter((u) => u.role === roleFilter);
    if (statusFilter === "active")    rows = rows.filter((u) => !u.suspended);
    if (statusFilter === "suspended") rows = rows.filter((u) =>  u.suspended);

    setFiltered(rows);
    setPagination((p) => ({ ...p, current: 1, total: rows.length }));
  }, [users, search, tenantFilter, roleFilter, statusFilter]);

  const hasFilters = search || tenantFilter !== "all" || roleFilter !== "all" || statusFilter !== "all";

  // ------ KPIs ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const kpi = {
    total:       users.length,
    active:      users.filter((u) => !u.suspended).length,
    suspended:   users.filter((u) =>  u.suspended).length,
    admins:      users.filter((u) => u.role === "admin" || u.role === "owner").length,
    tenantCount: tenants.length,
  };

  // ------ CRUD ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const openEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      full_name: user.full_name, email: user.email, role: user.role,
      job_title: user.job_title, department: user.department,
      phone: user.phone, contact: user.contact, tenant_id: user.tenant_id,
      salary_type: user.salary_type, salary_amount: user.salary_amount,
      working_hours: user.working_hours,
    });
    setEditModalOpen(true);
  };

  const openView = (user) => { setViewUser(user); setDrawerOpen(true); };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", editingUser.id);
      if (error) throw error;
      messageApi.success("User updated");
      setEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      if (err?.errorFields) return;
      messageApi.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      messageApi.success("User deleted");
      setDrawerOpen(false);
      fetchUsers();
    } catch (err) {
      messageApi.error("Delete failed");
    }
  };

  const handleSuspendToggle = async (id, suspend) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ suspended: suspend, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      messageApi.success(suspend ? "User suspended" : "User reactivated");
      fetchUsers();
      if (viewUser?.id === id) setViewUser((v) => ({ ...v, suspended: suspend }));
    } catch (err) {
      messageApi.error("Update failed");
    }
  };

  // ------ Row menu ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const rowMenu = (user) => ({
    items: [
      { key: "view", icon: <EyeOutlined />,  label: "View Profile", onClick: () => openView(user) },
      { key: "edit", icon: <EditOutlined />, label: "Edit",          onClick: () => openEdit(user) },
      { type: "divider" },
      user.suspended
        ? { key: "activate", icon: <CheckCircleOutlined />, label: "Activate",      onClick: () => handleSuspendToggle(user.id, false) }
        : { key: "suspend",  icon: <StopOutlined />,        label: "Suspend", danger: true, onClick: () => handleSuspendToggle(user.id, true) },
      { type: "divider" },
      {
        key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true,
        onClick: () => Modal.confirm({
          title:   `Delete "${user.full_name || user.email}"?`,
          content: "This permanently removes the user and cannot be undone.",
          okText: "Delete", okType: "danger",
          onOk: () => handleDelete(user.id),
        }),
      },
    ],
  });

  // ------ Table columns ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const columns = [
    {
      title: "User",
      dataIndex: "full_name",
      width: 260,
      sorter: (a, b) => (a.full_name || a.email || "").localeCompare(b.full_name || b.email || ""),
      render: (name, row) => (
        <div className="flex items-center gap-3">
          {/* Avatar with status ring */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <SmartAvatar
              src={getPublicUrl(row.user_photo)}
              name={name}
              email={row.email}
              size={38}
              radius="10px"
              fontSize={13}
              style={{
                border: `2px solid ${row.suspended ? tk.red + "50" : tk.green + "50"}`,
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: row.suspended ? tk.red : tk.green,
                border: `2px solid ${tk.cardBg}`,
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: tk.textPri, lineHeight: "18px" }}>
              {name || <span style={{ color: tk.textMuted, fontWeight: 400 }}>No name</span>}
            </div>
            <div style={{ fontSize: 11, color: tk.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Position",
      width: 180,
      render: (_, row) => (
        <div>
          <div style={{ fontSize: 13, color: tk.textPri, fontWeight: 500 }}>
            {row.job_title || <span style={{ color: tk.textMuted }}>---</span>}
          </div>
          {row.department && (
            <div style={{ fontSize: 11, color: tk.textMuted, marginTop: 1 }}>
              {row.department}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tenant",
      width: 200,
      sorter: (a, b) => (a.tenants?.name || "").localeCompare(b.tenants?.name || ""),
      render: (_, row) => {
        const t = row.tenants;
        if (!t) return <span style={{ color: tk.textMuted }}>---</span>;
        const pc = PLAN_COLOR[t.plan] || PLAN_COLOR.Free;

        // Try domain favicon as company logo
        const logoSrc = t.domain
          ? `https://www.google.com/s2/favicons?domain=${t.domain}&sz=64`
          : null;

        return (
          <div className="flex items-center gap-2.5">
            <CompanyLogo
              src={logoSrc}
              name={t.name}
              size={28}
              radius="7px"
              plan={t.plan}
              isDark={isDarkMode}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: tk.textPri, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t.name}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 20,
                  background: isDarkMode ? pc.darkBg : pc.bg,
                  color: pc.text,
                  letterSpacing: "0.02em",
                }}
              >
                {t.plan}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Role",
      dataIndex: "role",
      width: 120,
      sorter: (a, b) => (a.role || "").localeCompare(b.role || ""),
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
              letterSpacing: "0.01em",
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
      width: 100,
      render: (suspended) =>
        suspended ? (
          <Badge
            status="error"
            text={<span style={{ fontSize: 12, fontWeight: 500, color: tk.red }}>Suspended</span>}
          />
        ) : (
          <Badge
            status="success"
            text={<span style={{ fontSize: 12, fontWeight: 500, color: tk.green }}>Active</span>}
          />
        ),
    },
    {
      title: "Salary",
      dataIndex: "salary_amount",
      width: 120,
      sorter: (a, b) => (a.salary_amount || 0) - (b.salary_amount || 0),
      render: (amount, row) => {
        if (!amount) return <span style={{ color: tk.textMuted }}>---</span>;
        const sc = SALARY_TYPE_COLOR[row.salary_type] || SALARY_TYPE_COLOR.fixed;
        return (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: tk.textPri }}>
              {fmtCurrency(amount)}
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
      width: 110,
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
        <Dropdown menu={rowMenu(row)} trigger={["click"]} placement="bottomRight">
          <Button
            type="text" size="small" icon={<MoreOutlined />}
            style={{ color: tk.textMuted }}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  // ------ Render ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  return (
    <div style={{ color: tk.textPri }}>
      {contextHolder}

      {/* ------ Header --------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${tk.blue}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tk.blue,
              fontSize: 17,
            }}
          >
            <UserSwitchOutlined />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: tk.textPri, lineHeight: 1.2 }}>
              All Users
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: tk.textMuted }}>
              Manage users across all tenants
            </p>
          </div>
          {!loading && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 20,
                background: `${tk.blue}15`,
                color: tk.blue,
                marginLeft: 4,
              }}
            >
              {users.length.toLocaleString()} users
            </span>
          )}
        </div>
      </div>

      {/* ------ KPI Cards ------------------------------------------------------------------------------------------------------------------------------------------------------ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Users"   value={kpi.total}       sub="across all tenants"   icon={<TeamOutlined />}        color={tk.blue}   loading={loading} total={kpi.total} tk={tk} />
        <StatCard label="Active"        value={kpi.active}      sub={`${kpi.total ? Math.round((kpi.active/kpi.total)*100) : 0}% of all users`} icon={<CheckCircleOutlined />} color={tk.green}  loading={loading} total={kpi.total} tk={tk} />
        <StatCard label="Suspended"     value={kpi.suspended}   sub="restricted access"    icon={<StopOutlined />}        color={tk.red}    loading={loading} total={kpi.total} tk={tk} />
        <StatCard label="Admins"        value={kpi.admins}      sub="owners & admins"      icon={<SafetyOutlined />}      color={tk.purple} loading={loading} total={kpi.total} tk={tk} />
        <StatCard label="Tenants"       value={kpi.tenantCount} sub="organizations"        icon={<ApartmentOutlined />}   color={tk.amber}  loading={loading} total={Math.max(kpi.tenantCount, 1)} tk={tk} />
      </div>

      {/* ------ Table Card --------------------------------------------------------------------------------------------------------------------------------------------------- */}
      <Card
        style={{ background: tk.cardBg, border: `1px solid ${tk.border}`, borderRadius: 14 }}
        styles={{ body: { padding: 0 } }}
      >
        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px 20px",
            borderBottom: `1px solid ${tk.divider}`,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" }}>
            <Search
              placeholder="Search name, email, job title, tenant---"
              allowClear
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 290 }}
              prefix={<SearchOutlined style={{ color: tk.textMuted, fontSize: 13 }} />}
            />
            <Select
              value={tenantFilter}
              onChange={setTenantFilter}
              style={{ width: 175 }}
              showSearch
              optionFilterProp="children"
              suffixIcon={<ApartmentOutlined style={{ color: tk.textMuted, fontSize: 11 }} />}
            >
              <Option value="all">All Tenants</Option>
              {tenants.map((t) => (
                <Option key={t.id} value={t.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <CompanyLogo
                      src={t.domain ? `https://www.google.com/s2/favicons?domain=${t.domain}&sz=32` : null}
                      name={t.name}
                      size={16}
                      radius="4px"
                      plan={t.plan}
                      isDark={isDarkMode}
                    />
                    {t.name}
                  </div>
                </Option>
              ))}
            </Select>
            <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 130 }}>
              <Option value="all">All Roles</Option>
              {ROLE_OPTIONS.map((r) => (
                <Option key={r} value={r}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: ROLE_CONFIG[r]?.color, fontSize: 11 }}>{ROLE_CONFIG[r]?.icon}</span>
                    {ROLE_CONFIG[r]?.label || r}
                  </span>
                </Option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 135 }}>
              <Option value="all">All Statuses</Option>
              <Option value="active">
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: tk.green, display: "inline-block" }} />
                  Active
                </span>
              </Option>
              <Option value="suspended">
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: tk.red, display: "inline-block" }} />
                  Suspended
                </span>
              </Option>
            </Select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {hasFilters && (
              <Button
                size="small" type="text"
                style={{ color: tk.blue, fontSize: 12 }}
                onClick={() => { setSearch(""); setTenantFilter("all"); setRoleFilter("all"); setStatusFilter("all"); }}
              >
                Clear filters
              </Button>
            )}
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchUsers}
                loading={loading}
                style={{ borderColor: tk.border, color: tk.textSec, background: "transparent" }}
              />
            </Tooltip>
          </div>
        </div>

        {/* Results summary bar */}
        {!loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 20px",
              borderBottom: `1px solid ${tk.divider}`,
              background: tk.statBg,
            }}
          >
            <span style={{ fontSize: 12, color: tk.textMuted }}>
              {hasFilters ? (
                <>
                  <span style={{ color: tk.textSec, fontWeight: 600 }}>{filtered.length}</span> results
                  {" "}of{" "}
                  <span style={{ color: tk.textSec, fontWeight: 600 }}>{users.length}</span> users
                </>
              ) : (
                <>
                  <span style={{ color: tk.textSec, fontWeight: 600 }}>{users.length}</span> users total
                </>
              )}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {[
                { label: "Active",    count: filtered.filter((u) => !u.suspended).length, color: tk.green },
                { label: "Suspended", count: filtered.filter((u) =>  u.suspended).length, color: tk.red   },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                  <span style={{ fontSize: 12, color: tk.textMuted }}>
                    <b style={{ color: tk.textSec }}>{s.count}</b> {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <Table
          dataSource={filtered}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="middle"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ["15", "30", "50", "100"],
            showTotal: (total) => (
              <span style={{ color: tk.textMuted, fontSize: 12 }}>{total} users</span>
            ),
            onChange: (page, pageSize) =>
              setPagination((p) => ({ ...p, current: page, pageSize })),
          }}
          onRow={(row) => ({
            onClick: () => openView(row),
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <UserOutlined style={{ fontSize: 36, color: tk.textMuted, marginBottom: 12 }} />
                <div style={{ color: tk.textMuted, fontSize: 14, marginBottom: 4 }}>No users found</div>
                {hasFilters && (
                  <Button
                    type="link"
                    style={{ color: tk.blue, fontSize: 13, padding: 0 }}
                    onClick={() => { setSearch(""); setTenantFilter("all"); setRoleFilter("all"); setStatusFilter("all"); }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ),
          }}
        />
      </Card>

      {/* ------ Edit Modal ------------------------------------------------------------------------------------------------------------------------------------------------------ */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {editingUser && (
              <SmartAvatar
                src={getPublicUrl(editingUser.profile_picture_url)}
                name={editingUser.full_name}
                email={editingUser.email}
                size={32}
                radius="8px"
                fontSize={11}
              />
            )}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tk.textPri }}>
                Edit User
              </div>
              {editingUser?.email && (
                <div style={{ fontSize: 11, color: tk.textMuted, fontWeight: 400 }}>
                  {editingUser.email}
                </div>
              )}
            </div>
          </div>
        }
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSave}
        okText="Save Changes"
        confirmLoading={saving}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item name="full_name" label="Full Name">
              <Input prefix={<UserOutlined style={{ color: tk.textMuted }} />} placeholder="Jane Doe" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Invalid email" }]}>
              <Input prefix={<MailOutlined style={{ color: tk.textMuted }} />} placeholder="jane@company.com" />
            </Form.Item>
            <Form.Item name="job_title" label="Job Title">
              <Input prefix={<IdcardOutlined style={{ color: tk.textMuted }} />} placeholder="Software Engineer" />
            </Form.Item>
            <Form.Item name="department" label="Department">
              <Input prefix={<BuildOutlined style={{ color: tk.textMuted }} />} placeholder="Engineering" />
            </Form.Item>
            <Form.Item name="role" label="Role">
              <Select placeholder="Select role">
                {ROLE_OPTIONS.map((r) => (
                  <Option key={r} value={r}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ color: ROLE_CONFIG[r]?.color }}>{ROLE_CONFIG[r]?.icon}</span>
                      {ROLE_CONFIG[r]?.label || r}
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
            <Form.Item name="salary_amount" label="Salary Amount ($)">
              <Input type="number" min={0} placeholder="0" prefix={<DollarOutlined style={{ color: tk.textMuted }} />} />
            </Form.Item>
            <Form.Item name="working_hours" label="Hours / Week">
              <Input type="number" min={0} max={168} placeholder="40" />
            </Form.Item>
            <Form.Item name="tenant_id" label="Tenant">
              <Select placeholder="Assign tenant" showSearch optionFilterProp="children" allowClear>
                {tenants.map((t) => (
                  <Option key={t.id} value={t.id}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <CompanyLogo
                        src={t.domain ? `https://www.google.com/s2/favicons?domain=${t.domain}&sz=32` : null}
                        name={t.name}
                        size={16}
                        radius="4px"
                        plan={t.plan}
                        isDark={isDarkMode}
                      />
                      {t.name}
                    </span>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* ------ Detail Drawer --------------------------------------------------------------------------------------------------------------------------------------------- */}
      <Drawer
        title={null}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
        styles={{ body: { padding: 0 }, header: { display: "none" } }}
      >
        {viewUser && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

            {/* ------ Drawer hero --------------------------------------------------------------------------------------------------------------------------------- */}
            <div
              style={{
                background: tk.heroBg,
                borderBottom: `1px solid ${tk.border}`,
                padding: "24px 24px 20px",
                flexShrink: 0,
              }}
            >
              {/* Top row: avatar + name + edit button */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ position: "relative" }}>
                    <SmartAvatar
                      src={getPublicUrl(viewUser.profile_picture_url)}
                      name={viewUser.full_name}
                      email={viewUser.email}
                      size={64}
                      radius="16px"
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
                    <div style={{ fontSize: 18, fontWeight: 800, color: tk.textPri, lineHeight: 1.2 }}>
                      {viewUser.full_name || (
                        <span style={{ color: tk.textMuted, fontWeight: 400, fontSize: 16 }}>No name set</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: tk.textMuted, marginTop: 2 }}>{viewUser.email}</div>
                    {(viewUser.job_title || viewUser.department) && (
                      <div style={{ fontSize: 12, color: tk.textMuted, marginTop: 2 }}>
                        {[viewUser.job_title, viewUser.department].filter(Boolean).join("  --  ")}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  type="primary" size="small" icon={<EditOutlined />}
                  onClick={() => { setDrawerOpen(false); openEdit(viewUser); }}
                >
                  Edit
                </Button>
              </div>

              {/* Status + Role badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: viewUser.suspended ? `${tk.red}18` : `${tk.green}18`,
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

                {viewUser.role && (() => {
                  const cfg = ROLE_CONFIG[viewUser.role] || ROLE_CONFIG.member;
                  return (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 10px",
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

                {viewUser.salary_type && (() => {
                  const sc = SALARY_TYPE_COLOR[viewUser.salary_type] || SALARY_TYPE_COLOR.fixed;
                  return (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: isDarkMode ? sc.darkBg : sc.bg,
                        color: sc.color,
                      }}
                    >
                      {viewUser.salary_type.charAt(0).toUpperCase() + viewUser.salary_type.slice(1)}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* ------ Drawer scrollable body --------------------------------------------------------------------------------------------------- */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Tenant card */}
                {viewUser.tenants && (() => {
                  const t = viewUser.tenants;
                  const pc = PLAN_COLOR[t.plan] || PLAN_COLOR.Free;
                  const logoSrc = t.domain
                    ? `https://www.google.com/s2/favicons?domain=${t.domain}&sz=64`
                    : null;
                  return (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: tk.textMuted, marginBottom: 10 }}>
                        Organization
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "14px 16px",
                          borderRadius: 12,
                          background: tk.statBg,
                          border: `1px solid ${tk.border}`,
                        }}
                      >
                        <CompanyLogo
                          src={logoSrc}
                          name={t.name}
                          size={44}
                          radius="11px"
                          plan={t.plan}
                          isDark={isDarkMode}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: tk.textPri }}>{t.name}</div>
                          <div style={{ fontSize: 12, color: tk.textMuted, marginTop: 2 }}>
                            {t.domain || t.owner_email || "No domain"}
                          </div>
                          {t.industry && (
                            <div style={{ fontSize: 11, color: tk.textMuted, marginTop: 1 }}>{t.industry}</div>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 20,
                              background: isDarkMode ? pc.darkBg : pc.bg,
                              color: pc.text,
                              border: `1px solid ${isDarkMode ? pc.text + "30" : pc.border || pc.bg}`,
                            }}
                          >
                            {t.plan}
                          </span>
                          {t.company_size && (
                            <span style={{ fontSize: 10, color: tk.textMuted }}>{t.company_size}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Employment stats grid */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: tk.textMuted, marginBottom: 10 }}>
                    Employment
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Salary",       value: fmtCurrency(viewUser.salary_amount), color: tk.green  },
                      { label: "Base Salary",  value: fmtCurrency(viewUser.base_salary),   color: tk.blue   },
                      { label: "Commission",   value: viewUser.commission_rate ? `${viewUser.commission_rate}%` : "---", color: tk.amber  },
                      { label: "Hours / Week", value: viewUser.working_hours ? `${viewUser.working_hours}h` : "---", color: tk.purple },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 10,
                          background: tk.statBg,
                          border: `1px solid ${tk.border}`,
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: tk.textMuted, marginBottom: 5 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "monospace", color: item.color }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact info */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: tk.textMuted, marginBottom: 10 }}>
                    Contact & Personal
                  </div>
                  <div
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${tk.border}`,
                      overflow: "hidden",
                    }}
                  >
                    {[
                      { icon: <MailOutlined />,        label: "Email",         value: viewUser.email },
                      { icon: <PhoneOutlined />,       label: "Phone",         value: viewUser.phone || viewUser.contact },
                      { icon: <HomeOutlined />,        label: "Address",       value: viewUser.address },
                      { icon: <CalendarOutlined />,    label: "Date of Birth", value: fmtDate(viewUser.dob) },
                      { icon: <IdcardOutlined />,      label: "CNIC",          value: viewUser.cnic, mono: true },
                      { icon: <CodeOutlined />,        label: "GitHub",        value: viewUser.github_username ? `@${viewUser.github_username}` : null },
                      { icon: <CalendarOutlined />,    label: "Joined",        value: fmtDate(viewUser.created_at) },
                      { icon: <ClockCircleOutlined />, label: "Last Updated",  value: timeAgo(viewUser.updated_at) },
                    ]
                      .filter((r) => r.value && r.value !== "---")
                      .map((row, i, arr) => (
                        <div
                          key={row.label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 14px",
                            borderBottom: i < arr.length - 1 ? `1px solid ${tk.divider}` : "none",
                          }}
                        >
                          <span style={{ color: tk.textMuted, fontSize: 13, width: 16, flexShrink: 0 }}>{row.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: tk.textMuted, marginBottom: 1 }}>
                              {row.label}
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: tk.textPri,
                                fontFamily: row.mono ? "monospace" : "inherit",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.value}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Bio */}
                {viewUser.bio && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: tk.textMuted, marginBottom: 10 }}>
                      Bio
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        borderRadius: 10,
                        padding: "12px 14px",
                        background: tk.statBg,
                        border: `1px solid ${tk.border}`,
                        color: tk.textSec,
                      }}
                    >
                      {viewUser.bio}
                    </div>
                  </div>
                )}

                {/* Bank details */}
                {(viewUser.bank_name || viewUser.bank_account_number) && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: tk.textMuted, marginBottom: 10 }}>
                      Bank Details
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "13px 14px",
                        borderRadius: 10,
                        background: tk.statBg,
                        border: `1px solid ${tk.border}`,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: `${tk.green}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: tk.green,
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        <BankOutlined />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: tk.textPri }}>
                          {viewUser.bank_name || "---"}
                          {viewUser.bank_account_name && (
                            <span style={{ fontWeight: 400, color: tk.textMuted }}> -- {viewUser.bank_account_name}</span>
                          )}
                        </div>
                        {viewUser.bank_account_number && (
                          <div style={{ fontSize: 12, fontFamily: "monospace", color: tk.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {viewUser.bank_account_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* System IDs */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: tk.textMuted, marginBottom: 10 }}>
                    System IDs
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { label: "User ID",   value: viewUser.id },
                      { label: "Tenant ID", value: viewUser.tenant_id },
                    ].filter((r) => r.value).map((r) => (
                      <div key={r.label}>
                        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: tk.textMuted, marginBottom: 3 }}>
                          {r.label}
                        </div>
                        <Tooltip title="Click to copy" placement="left">
                          <div
                            style={{
                              fontSize: 11,
                              fontFamily: "monospace",
                              padding: "7px 10px",
                              borderRadius: 8,
                              background: tk.statBg,
                              border: `1px solid ${tk.border}`,
                              color: tk.textSec,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              navigator.clipboard.writeText(r.value);
                              messageApi.success(`${r.label} copied`);
                            }}
                          >
                            {r.value}
                          </div>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <Divider style={{ borderColor: tk.divider, margin: "0" }} />

                {/* Actions */}
                <div style={{ paddingBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: tk.textMuted, marginBottom: 10 }}>
                    Quick Actions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {viewUser.suspended ? (
                      <Button
                        block icon={<UnlockOutlined />}
                        style={{ borderColor: tk.green, color: tk.green, height: 38 }}
                        onClick={() => { handleSuspendToggle(viewUser.id, false); setDrawerOpen(false); }}
                      >
                        Activate User
                      </Button>
                    ) : (
                      <Popconfirm
                        title="Suspend this user?"
                        description="They will lose access immediately."
                        onConfirm={() => { handleSuspendToggle(viewUser.id, true); setDrawerOpen(false); }}
                        okText="Suspend" okType="danger"
                      >
                        <Button danger block icon={<LockOutlined />} style={{ height: 38 }}>
                          Suspend User
                        </Button>
                      </Popconfirm>
                    )}
                    <Popconfirm
                      title="Delete this user?"
                      description="This permanently removes the user and cannot be undone."
                      onConfirm={() => handleDelete(viewUser.id)}
                      okText="Delete" okType="danger"
                    >
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

export default AllUsersPage;
