import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Zap,
  Rocket,
  Crown,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Star,
  Users,
  HardDrive,
  CreditCard,
  Sparkles,
  MoreHorizontal,
  ChevronRight,
  X,
  Check,
  Loader2,
  TrendingUp,
  Tag,
  LayoutGrid,
  FolderKanban,
} from "lucide-react";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Tag as AntTag,
  Space,
  message,
  Card,
  Row,
  Col,
  Divider,
  Typography,
  Badge,
  Spin,
  Popconfirm,
} from "antd";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";

const { Text } = Typography;

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const ICON_OPTIONS = [
  { value: "Zap", label: "Zap", Component: Zap },
  { value: "Rocket", label: "Rocket", Component: Rocket },
  { value: "Crown", label: "Crown", Component: Crown },
  { value: "ShieldCheck", label: "Shield", Component: ShieldCheck },
  { value: "Star", label: "Star", Component: Star },
  { value: "Sparkles", label: "Sparkles", Component: Sparkles },
];

const PERIOD_OPTIONS = [
  { value: "forever", label: "Forever (Free)" },
  { value: "/mo", label: "Per Month" },
];

const ICON_MAP = {
  Zap,
  Rocket,
  Crown,
  ShieldCheck,
  Star,
  Sparkles,
};

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        border: "1px solid #f1f5f9",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          background: color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={color} />
      </div>
      <div>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "13px",
            color: "#94a3b8",
            marginTop: "2px",
            fontWeight: 500,
          }}
        >
          {label}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Plan Row Badge ─────────────────────────────────────────────────────────
function PlanIconBadge({ iconKey, color }) {
  const Icon = ICON_MAP[iconKey] || Zap;
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "10px",
        background: (color || "#6366f1") + "18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: `1.5px solid ${color || "#6366f1"}30`,
      }}
    >
      <Icon size={18} color={color || "#6366f1"} strokeWidth={2} />
    </div>
  );
}

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price", { ascending: true });
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      message.error("Failed to load plans: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const parseFeatures = (value) => {
    if (!value) return [];
    return value
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
  };

  const formatFeatures = (features) => {
    if (!features || !Array.isArray(features)) return "";
    return features.map((f) => f.text).join("\n");
  };

  const handleCreateOrUpdate = async (values) => {
    try {
      setSubmitLoading(true);
      const planData = {
        ...values,
        features: parseFeatures(values.features),
        updated_at: new Date().toISOString(),
      };
      const { updated_at, ...insertData } = planData;

      if (editingPlan?.id) {
        const { error } = await supabase
          .from("plans")
          .update(planData)
          .eq("id", editingPlan.id);
        if (error) throw error;
        message.success("Plan updated!");
      } else {
        const { error } = await supabase.from("plans").insert([insertData]);
        if (error) throw error;
        message.success("Plan created!");
      }

      setModalVisible(false);
      form.resetFields();
      setEditingPlan(null);
      await loadPlans();
    } catch (error) {
      message.error("Operation failed: " + (error.message || "Unknown error"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (record, active) => {
    try {
      const { error } = await supabase
        .from("plans")
        .update({ is_active: active, updated_at: new Date().toISOString() })
        .eq("id", record.id);
      if (error) throw error;
      setPlans(
        plans.map((p) =>
          p.id === record.id ? { ...p, is_active: active } : p,
        ),
      );
      message.success(`Plan ${active ? "activated" : "deactivated"}`);
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
      setPlans(plans.filter((p) => p.id !== id));
      message.success("Plan deleted");
    } catch {
      message.error("Failed to delete plan");
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (record) => {
    form.setFieldsValue({
      ...record,
      features: formatFeatures(record.features),
    });
    setEditingPlan(record);
    setModalVisible(true);
  };

  const openCreate = () => {
    form.resetFields();
    setEditingPlan(null);
    setModalVisible(true);
  };

  const activePlans = plans.filter((p) => p.is_active).length;
  const popularPlan = plans.find((p) => p.popular);

  const columns = [
    {
      title: "Plan",
      dataIndex: "name",
      render: (name, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <PlanIconBadge iconKey={record.icon} color={record.color} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}
              >
                {name}
              </span>
              {record.popular && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    background: "#fef3c7",
                    color: "#d97706",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    border: "1px solid #fde68a",
                    letterSpacing: "0.05em",
                  }}
                >
                  POPULAR
                </span>
              )}
            </div>
            {record.tagline && (
              <div
                style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}
              >
                {record.tagline}
              </div>
            )}
          </div>
        </div>
      ),
      width: 260,
    },
    {
      title: "Price",
      render: (_, record) => (
        <div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
            {record.priceLabel ||
              (record.price === 0 ? "$0" : `$${record.price}`)}
          </span>
          <span
            style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "4px" }}
          >
            {record.period === "forever" ? "forever" : "/mo"}
          </span>
        </div>
      ),
      width: 130,
    },
    {
      title: "Limits",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#475569",
            }}
          >
            <Users size={13} color="#94a3b8" />
            {record.max_users != null
              ? `${record.max_users} users`
              : "Unlimited users"}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#475569",
            }}
          >
            <FolderKanban size={13} color="#94a3b8" />
            {record.max_projects != null
              ? `${record.max_projects} projects`
              : "Unlimited projects"}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              color: "#475569",
            }}
          >
            <HardDrive size={13} color="#94a3b8" />
            {record.storage_gb != null
              ? `${record.storage_gb} GB`
              : "Unlimited storage"}
          </div>
        </div>
      ),
      width: 160,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      render: (active, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Switch
            size="small"
            checked={active}
            onChange={(val) => handleToggleActive(record, val)}
            style={{ background: active ? "#10b981" : "#e2e8f0" }}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: active ? "#059669" : "#94a3b8",
            }}
          >
            {active ? "Active" : "Inactive"}
          </span>
        </div>
      ),
      width: 120,
    },
    {
      title: "Features",
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {(record.features || []).slice(0, 3).map((feature, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "#475569",
              }}
            >
              <Check size={11} color="#10b981" strokeWidth={2.5} />
              {feature.text}
            </div>
          ))}
          {(record.features?.length || 0) > 3 && (
            <div
              style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}
            >
              +{record.features.length - 3} more features
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Stripe ID",
      dataIndex: "stripe_price_id",
      render: (id) =>
        id ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <CreditCard size={13} color="#6366f1" />
            <span
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                background: "#eef2ff",
                color: "#4f46e5",
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              {id.slice(0, 12)}…
            </span>
          </div>
        ) : (
          <span style={{ fontSize: "12px", color: "#cbd5e1" }}>—</span>
        ),
      width: 150,
    },
    {
      title: "",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => openEdit(record)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              color: "#475569",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            <Pencil size={12} />
            Edit
          </button>
          <Popconfirm
            title={
              <span style={{ fontWeight: 600 }}>Delete "{record.name}"?</span>
            }
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <button
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: "8px",
                border: "1px solid #fee2e2",
                background: "#fff",
                cursor: "pointer",
                color: "#ef4444",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fef2f2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
              }}
            >
              {deletingId === record.id ? (
                <Loader2
                  size={13}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Trash2 size={13} />
              )}
            </button>
          </Popconfirm>
        </div>
      ),
      width: 140,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "32px",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .plans-table .ant-table { background: transparent; }
        .plans-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 12px 16px !important;
        }
        .plans-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f8fafc !important;
          padding: 14px 16px !important;
          vertical-align: middle !important;
        }
        .plans-table .ant-table-tbody > tr:hover > td {
          background: #fafbff !important;
        }
        .plans-table .ant-table-wrapper {
          border-radius: 0 !important;
        }
        .form-label {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #374151 !important;
        }
      `}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          marginBottom: "28px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Subscription Plans
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#94a3b8"
            }}
          >
            Manage pricing tiers, features, and billing configuration
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #7c3aed, #7c3aed)",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
          }}
        >
          <Plus size={16} />
          New Plan
        </motion.button>
      </motion.div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <StatCard
          icon={LayoutGrid}
          label="Total Plans"
          value={plans.length}
          color="#6366f1"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Plans"
          value={activePlans}
          color="#10b981"
        />
        <StatCard
          icon={XCircle}
          label="Inactive"
          value={plans.length - activePlans}
          color="#f59e0b"
        />
        <StatCard
          icon={TrendingUp}
          label="Featured Plan"
          value={popularPlan?.name || "—"}
          color="#ec4899"
        />
      </div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.05)",
          border: "1px solid #f1f5f9",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <Loader2
              size={28}
              color="#6366f1"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span style={{ color: "#94a3b8", fontSize: "14px" }}>
              Loading plans…
            </span>
          </div>
        ) : (
          <Table
            className="plans-table"
            columns={columns}
            dataSource={plans}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `${total} plans total`,
              style: { padding: "16px 16px", borderTop: "1px solid #f1f5f9" },
            }}
            scroll={{ x: 1100 }}
          />
        )}
      </motion.div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingPlan(null);
        }}
        footer={null}
        width={760}
        style={{ top: 32 }}
        styles={{ body: { padding: "0" } }}
        closable={false}
        modalRender={(modal) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25 }}
            style={{ borderRadius: "20px", overflow: "hidden" }}
          >
            {modal}
          </motion.div>
        )}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "24px 28px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: editingPlan
                  ? "#fef3c7"
                  : "linear-gradient(135deg, #7c3aed, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {editingPlan ? (
                <Pencil size={16} color="#d97706" />
              ) : (
                <Plus size={16} color="#fff" />
              )}
            </div>
            <div>
              <div
                style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}
              >
                {editingPlan ? `Edit "${editingPlan.name}"` : "Create New Plan"}
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                {editingPlan
                  ? "Update plan details and configuration"
                  : "Set up a new subscription tier"}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setModalVisible(false);
              form.resetFields();
              setEditingPlan(null);
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
          <div
            style={{
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: "0px",
            }}
          >
            {/* Section: Basic Info */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "14px",
                }}
              >
                Basic Information
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px 150px",
                  gap: "12px",
                }}
              >
                <Form.Item
                  name="name"
                  label={<span className="form-label">Plan Name</span>}
                  rules={[{ required: true, message: "Required" }]}
                  style={{ margin: 0 }}
                >
                  <Input
                    placeholder="e.g. Starter, Pro, Enterprise"
                    size="large"
                    style={{ borderRadius: "10px" }}
                  />
                </Form.Item>
                <Form.Item
                  name="price"
                  label={<span className="form-label">Price ($)</span>}
                  rules={[{ required: true, message: "Required" }]}
                  style={{ margin: 0 }}
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: "100%", borderRadius: "10px" }}
                    size="large"
                  />
                </Form.Item>
                <Form.Item
                  name="period"
                  label={<span className="form-label">Billing</span>}
                  style={{ margin: 0 }}
                >
                  <Select
                    size="large"
                    options={PERIOD_OPTIONS}
                    style={{ borderRadius: "10px" }}
                  />
                </Form.Item>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <Form.Item
                  name="tagline"
                  label={<span className="form-label">Tagline</span>}
                  style={{ margin: 0 }}
                >
                  <Input
                    placeholder="Perfect for small teams"
                    size="large"
                    style={{ borderRadius: "10px" }}
                  />
                </Form.Item>
                <Form.Item
                  name="stripe_price_id"
                  label={<span className="form-label">Stripe Price ID</span>}
                  style={{ margin: 0 }}
                >
                  <Input
                    placeholder="price_xxxxxxxxxxxxx"
                    size="large"
                    prefix={<CreditCard size={14} color="#94a3b8" />}
                    style={{ borderRadius: "10px" }}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Section: Appearance */}
            <div
              style={{
                height: "1px",
                background: "#f1f5f9",
                margin: "4px 0 20px",
              }}
            />
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "14px",
                }}
              >
                Appearance
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 120px",
                  gap: "12px",
                  alignItems: "end",
                }}
              >
                <Form.Item
                  name="icon"
                  label={<span className="form-label">Icon</span>}
                  style={{ margin: 0 }}
                >
                  <Select size="large" style={{ borderRadius: "10px" }}>
                    {ICON_OPTIONS.map(({ value, label, Component }) => (
                      <Select.Option key={value} value={value}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Component size={15} color="#6366f1" />
                          <span>{label}</span>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="color"
                  label={<span className="form-label">Color</span>}
                  style={{ margin: 0 }}
                >
                  <Input
                    type="color"
                    style={{
                      height: "40px",
                      borderRadius: "10px",
                      padding: "4px 6px",
                    }}
                  />
                </Form.Item>
                <Form.Item
                  name="popular"
                  label={<span className="form-label">Featured Plan</span>}
                  valuePropName="checked"
                  style={{ margin: 0 }}
                >
                  <Switch
                    checkedChildren={
                      <span style={{ fontSize: "11px" }}>Yes</span>
                    }
                    unCheckedChildren={
                      <span style={{ fontSize: "11px" }}>No</span>
                    }
                  />
                </Form.Item>
              </div>
            </div>

            {/* Section: Limits */}
            <div
              style={{
                height: "1px",
                background: "#f1f5f9",
                margin: "4px 0 20px",
              }}
            />
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "14px",
                }}
              >
                Usage Limits
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                }}
              >
                <Form.Item
                  name="max_users"
                  label={
                    <span
                      className="form-label"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Users size={13} /> Max Users
                    </span>
                  }
                  style={{ margin: 0 }}
                >
                  <InputNumber
                    min={0}
                    placeholder="Blank = unlimited"
                    style={{ width: "100%", borderRadius: "10px" }}
                    size="large"
                  />
                </Form.Item>
                <Form.Item
                  name="max_projects"
                  label={
                    <span
                      className="form-label"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <FolderKanban size={13} /> Max Projects
                    </span>
                  }
                  style={{ margin: 0 }}
                >
                  <InputNumber
                    min={0}
                    placeholder="Blank = unlimited"
                    style={{ width: "100%", borderRadius: "10px" }}
                    size="large"
                  />
                </Form.Item>
                <Form.Item
                  name="storage_gb"
                  label={
                    <span
                      className="form-label"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <HardDrive size={13} /> Storage (GB)
                    </span>
                  }
                  style={{ margin: 0 }}
                >
                  <InputNumber
                    min={0}
                    placeholder="Blank = unlimited"
                    style={{ width: "100%", borderRadius: "10px" }}
                    size="large"
                  />
                </Form.Item>
              </div>
            </div>

            {/* Section: Features */}
            <div
              style={{
                height: "1px",
                background: "#f1f5f9",
                margin: "4px 0 20px",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "14px",
                }}
              >
                Features
              </div>
              <Form.Item
                name="features"
                label={
                  <span className="form-label">
                    Feature List{" "}
                    <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                      (one per line)
                    </span>
                  </span>
                }
                rules={[
                  { required: true, message: "Add at least one feature" },
                ]}
                style={{ margin: 0 }}
              >
                <Input.TextArea
                  rows={5}
                  placeholder={
                    "Up to 25 employees\nFull project management\n10 GB storage\nPriority email support"
                  }
                  style={{
                    borderRadius: "10px",
                    fontFamily: "inherit",
                    resize: "none",
                  }}
                />
              </Form.Item>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: "16px 28px 24px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setModalVisible(false);
                form.resetFields();
                setEditingPlan(null);
              }}
              style={{
                padding: "9px 20px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                color: "#64748b",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={() => form.submit()}
              disabled={submitLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 22px",
                borderRadius: "10px",
                border: "none",
                cursor: submitLoading ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, #7c3aed, #7c3aed)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                opacity: submitLoading ? 0.7 : 1,
              }}
            >
              {submitLoading ? (
                <Loader2
                  size={15}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Check size={15} />
              )}
              {editingPlan ? "Save Changes" : "Create Plan"}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
