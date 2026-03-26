import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Form,
  Spin,
  Tooltip,
  Popconfirm,
  Progress,
  message,
  Dropdown,
  Divider,
  Avatar,
  Empty,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ApartmentOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  GlobalOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../components/Layout/MainLayout";
import { supabase } from "../../../lib/supabase";

const { Search } = Input;
const { Option } = Select;

const PLAN_OPTIONS = ["Enterprise", "Pro", "Starter", "Free"];
const STATUS_OPTIONS = ["active", "trial", "past_due", "suspended", "inactive"];

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

const STATUS_CONFIG = {
  active: { badge: "success", label: "Active", color: "#10b981" },
  trial: { badge: "processing", label: "Trial", color: "#3b82f6" },
  past_due: { badge: "error", label: "Past Due", color: "#ef4444" },
  suspended: { badge: "default", label: "Suspended", color: "#6b7280" },
  inactive: { badge: "default", label: "Inactive", color: "#6b7280" },
};

// Company logo using favicon API with letter fallback
const CompanyLogo = ({
  domain,
  name,
  plan,
  size = 36,
  radius = "10px",
  isDark,
}) => {
  const [err, setErr] = useState(false);
  const pc = PLAN_COLOR[plan] || PLAN_COLOR.Free;
  const src = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
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
        fontWeight: 800,
        fontSize: Math.max(10, size * 0.38),
        border: `1px solid ${isDark ? pc.text + "30" : pc.border}`,
      }}
    >
      {name?.slice(0, 2).toUpperCase() || "??"}
    </div>
  );
};

const TenantsPage = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [tenants, setTenants] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const tk = {
    cardBg: isDarkMode ? "#1e293b" : "#ffffff",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    divider: isDarkMode ? "#1e293b" : "#f1f5f9",
    textPri: isDarkMode ? "#f1f5f9" : "#0f172a",
    textSec: isDarkMode ? "#94a3b8" : "#475569",
    textMuted: isDarkMode ? "#64748b" : "#94a3b8",
    statBg: isDarkMode ? "#0f172a" : "#f8fafc",
    blue: "#3b82f6",
    green: "#10b981",
    amber: "#f59e0b",
    red: "#ef4444",
    purple: "#7c3aed",
  };

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from("tenants")
        .select(
          `
          id, name, plan, status, mrr, health_score, created_at,
          owner_email, owner_name, domain, max_users, notes,
          profiles(count)
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map((t) => ({
        ...t,
        user_count: t.profiles?.[0]?.count ?? 0,
      }));

      setTenants(normalized);
      setPagination((p) => ({ ...p, total: count || 0 }));
    } catch (err) {
      messageApi.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    let rows = [...tenants];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.owner_email?.toLowerCase().includes(q) ||
          t.domain?.toLowerCase().includes(q),
      );
    }
    if (planFilter !== "all") rows = rows.filter((t) => t.plan === planFilter);
    if (statusFilter !== "all")
      rows = rows.filter((t) => t.status === statusFilter);
    setFiltered(rows);
    setPagination((p) => ({ ...p, current: 1, total: rows.length }));
  }, [tenants, search, planFilter, statusFilter]);

  const kpi = {
    total: tenants.length,
    active: tenants.filter((t) => t.status === "active").length,
    mrr: tenants.reduce((s, t) => s + (t.mrr || 0), 0),
    trial: tenants.filter((t) => t.status === "trial").length,
    past_due: tenants.filter((t) => t.status === "past_due").length,
  };

  const openCreate = () => {
    setEditingTenant(null);
    form.resetFields();
    setModalOpen(true);
  };
  const openEdit = (tenant) => {
    setEditingTenant(tenant);
    form.setFieldsValue({
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
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingTenant) {
        const { error } = await supabase
          .from("tenants")
          .update({ ...values, updated_at: new Date().toISOString() })
          .eq("id", editingTenant.id);
        if (error) throw error;
        messageApi.success("Tenant updated");
      } else {
        const { error } = await supabase
          .from("tenants")
          .insert([{ ...values, created_at: new Date().toISOString() }]);
        if (error) throw error;
        messageApi.success("Tenant created");
      }
      setModalOpen(false);
      fetchTenants();
    } catch (err) {
      if (err?.errorFields) return;
      messageApi.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from("tenants").delete().eq("id", id);
      if (error) throw error;
      messageApi.success("Tenant deleted");
      fetchTenants();
    } catch (err) {
      messageApi.error("Delete failed");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      messageApi.success(`Tenant ${newStatus}`);
      fetchTenants();
    } catch (err) {
      messageApi.error("Update failed");
    }
  };

  const rowMenu = (tenant) => ({
    items: [
      {
        key: "view",
        icon: <EyeOutlined />,
        label: "View Details",
        onClick: () => navigate(`/tenants/${tenant.id}`),
      },
      {
        key: "edit",
        icon: <EditOutlined />,
        label: "Edit",
        onClick: (e) => {
          e.domEvent.stopPropagation();
          openEdit(tenant);
        },
      },
      { type: "divider" },
      tenant.status === "active"
        ? {
            key: "suspend",
            icon: <StopOutlined />,
            label: "Suspend",
            danger: true,
            onClick: () => handleStatusChange(tenant.id, "suspended"),
          }
        : {
            key: "activate",
            icon: <CheckCircleOutlined />,
            label: "Activate",
            onClick: () => handleStatusChange(tenant.id, "active"),
          },
      { type: "divider" },
      {
        key: "delete",
        icon: <DeleteOutlined />,
        label: "Delete",
        danger: true,
        onClick: () =>
          Modal.confirm({
            title: `Delete "${tenant.name}"?`,
            content:
              "This action cannot be undone. All tenant data will be permanently removed.",
            okText: "Delete",
            okType: "danger",
            onOk: () => handleDelete(tenant.id),
          }),
      },
    ],
  });

  const columns = [
    {
      title: "Tenant",
      dataIndex: "name",
      sorter: (a, b) => a.name?.localeCompare(b.name),
      render: (name, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CompanyLogo
            domain={row.domain}
            name={name}
            plan={row.plan}
            size={36}
            isDark={isDarkMode}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: tk.textPri }}>
              {name}
            </div>
            <div style={{ fontSize: 11, color: tk.textMuted }}>
              {row.domain || row.owner_email || "—"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      sorter: (a, b) => a.plan?.localeCompare(b.plan),
      render: (plan) => {
        const pc = PLAN_COLOR[plan] || PLAN_COLOR.Free;
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 20,
              background: isDarkMode ? pc.darkBg : pc.bg,
              color: pc.text,
            }}
          >
            {plan || "—"}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
        return (
          <Badge
            status={cfg.badge}
            text={
              <span style={{ fontSize: 12, fontWeight: 500 }}>{cfg.label}</span>
            }
          />
        );
      },
    },
    {
      title: "MRR",
      dataIndex: "mrr",
      sorter: (a, b) => (a.mrr || 0) - (b.mrr || 0),
      render: (mrr) => (
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "monospace",
            color: tk.textPri,
          }}
        >
          {mrr ? `$${mrr.toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      title: "Users",
      dataIndex: "user_count",
      sorter: (a, b) => (a.user_count || 0) - (b.user_count || 0),
      render: (count, row) => (
        <div>
          <span style={{ fontSize: 13, color: tk.textPri }}>
            {count ?? "—"}
            {row.max_users ? (
              <span style={{ color: tk.textMuted }}>/{row.max_users}</span>
            ) : null}
          </span>
          {count && row.max_users && (
            <Progress
              percent={Math.round((count / row.max_users) * 100)}
              size="small"
              showInfo={false}
              strokeColor={count / row.max_users > 0.9 ? tk.red : tk.blue}
              trailColor={tk.border}
              style={{ marginTop: 3, marginBottom: 0, width: 64 }}
            />
          )}
        </div>
      ),
    },
    {
      title: "Health",
      dataIndex: "health_score",
      sorter: (a, b) => (a.health_score || 0) - (b.health_score || 0),
      render: (score) => {
        if (score == null)
          return <span style={{ color: tk.textMuted }}>—</span>;
        const color = score > 90 ? tk.green : score > 70 ? tk.amber : tk.red;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 52,
                height: 4,
                borderRadius: 2,
                background: tk.border,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${score}%`,
                  height: "100%",
                  background: color,
                  borderRadius: 2,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                color: tk.textMuted,
              }}
            >
              {score}%
            </span>
          </div>
        );
      },
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => (
        <span style={{ fontSize: 12, color: tk.textMuted }}>
          {date
            ? new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      title: "",
      width: 48,
      render: (_, row) => (
        <Dropdown
          menu={rowMenu(row)}
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

  return (
    <div style={{ color: tk.textPri }}>
      {contextHolder}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 2,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${tk.blue}18`,
              color: tk.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
            }}
          >
            <ApartmentOutlined />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: tk.textPri,
                lineHeight: 1.2,
              }}
            >
              Tenants
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: tk.textMuted }}>
              Manage all organizations on the platform
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
              {tenants.length} tenants
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "Total Tenants",
            value: kpi.total,
            icon: <ApartmentOutlined />,
            color: tk.blue,
          },
          {
            label: "Active",
            value: kpi.active,
            icon: <CheckCircleOutlined />,
            color: tk.green,
          },
          {
            label: "Trial",
            value: kpi.trial,
            icon: <CalendarOutlined />,
            color: tk.amber,
          },
          {
            label: "Past Due",
            value: kpi.past_due,
            icon: <WarningOutlined />,
            color: tk.red,
          },
          {
            label: "Total MRR",
            value: `$${kpi.mrr.toLocaleString()}`,
            icon: <DollarOutlined />,
            color: tk.purple,
          },
        ].map((s, i) => (
          <Card
            key={i}
            style={{
              background: tk.cardBg,
              border: `1px solid ${tk.border}`,
              borderRadius: 14,
            }}
            styles={{ body: { padding: "16px 18px" } }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: tk.textMuted,
                    marginBottom: 8,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: tk.textPri,
                    lineHeight: 1,
                  }}
                >
                  {loading ? <Spin size="small" /> : s.value}
                </div>
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${s.color}15`,
                  color: s.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                {s.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card
        style={{
          background: tk.cardBg,
          border: `1px solid ${tk.border}`,
          borderRadius: 14,
        }}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              flexWrap: "wrap",
            }}
          >
            <Search
              placeholder="Search tenants, email, domain…"
              allowClear
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 270 }}
              prefix={
                <SearchOutlined style={{ color: tk.textMuted, fontSize: 13 }} />
              }
            />
            <Select
              value={planFilter}
              onChange={setPlanFilter}
              style={{ width: 130 }}
            >
              <Option value="all">All Plans</Option>
              {PLAN_OPTIONS.map((p) => (
                <Option key={p} value={p}>
                  {p}
                </Option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
            >
              <Option value="all">All Statuses</Option>
              {STATUS_OPTIONS.map((s) => (
                <Option key={s} value={s}>
                  {STATUS_CONFIG[s]?.label || s}
                </Option>
              ))}
            </Select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(search || planFilter !== "all" || statusFilter !== "all") && (
              <Button
                size="small"
                type="text"
                style={{ color: tk.blue, fontSize: 12 }}
                onClick={() => {
                  setSearch("");
                  setPlanFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </Button>
            )}
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchTenants}
                loading={loading}
                style={{
                  borderColor: tk.border,
                  color: tk.textSec,
                  background: "transparent",
                }}
              />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Tenant
            </Button>
          </div>
        </div>

        {/* Results bar */}
        {!loading && (
          <div
            style={{
              padding: "7px 20px",
              borderBottom: `1px solid ${tk.divider}`,
              background: tk.statBg,
              fontSize: 12,
              color: tk.textMuted,
            }}
          >
            Showing <b style={{ color: tk.textSec }}>{filtered.length}</b> of{" "}
            <b style={{ color: tk.textSec }}>{tenants.length}</b> tenants
          </div>
        )}

        {/* Table — row click navigates to detail */}
        <Table
          dataSource={filtered}
          columns={columns}
          loading={loading}
          rowKey="id"
          size="middle"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => (
              <span style={{ color: tk.textMuted, fontSize: 12 }}>
                {total} tenants
              </span>
            ),
            onChange: (page, pageSize) =>
              setPagination((p) => ({ ...p, current: page, pageSize })),
          }}
          onRow={(row) => ({
            onClick: () => navigate(`/tenants/${row.id}`),
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: tk.textMuted }}>No tenants found</span>
                }
              />
            ),
          }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {editingTenant && (
              <CompanyLogo
                domain={editingTenant.domain}
                name={editingTenant.name}
                plan={editingTenant.plan}
                size={28}
                isDark={isDarkMode}
              />
            )}
            <span style={{ color: tk.textPri, fontWeight: 700 }}>
              {editingTenant
                ? `Edit — ${editingTenant.name}`
                : "Add New Tenant"}
            </span>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editingTenant ? "Save Changes" : "Create Tenant"}
        confirmLoading={saving}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
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
              rules={[{ required: true, message: "Required" }]}
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
              rules={[{ type: "email", message: "Invalid email" }]}
            >
              <Input placeholder="john@acme.com" />
            </Form.Item>
            <Form.Item
              name="plan"
              label="Plan"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select plan">
                {PLAN_OPTIONS.map((p) => (
                  <Option key={p} value={p}>
                    {p}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select status">
                {STATUS_OPTIONS.map((s) => (
                  <Option key={s} value={s}>
                    {STATUS_CONFIG[s]?.label || s}
                  </Option>
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
            <Input.TextArea
              rows={3}
              placeholder="Internal notes about this tenant…"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TenantsPage;
