import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  X,
  Loader2,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  BarChart2,
  Repeat,
  Zap,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import {
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { supabase } from "../../../lib/supabase";

const FALLBACK_PLAN_OPTIONS = [
  { value: "Free", label: "Free" },
  { value: "Starter", label: "Starter" },
  { value: "Pro", label: "Pro" },
  { value: "Enterprise", label: "Enterprise" },
];

// --------- Helpers ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
};

const formatDiscount = (type, value) => {
  if (type === "percent") return `${value}% off`;
  if (type === "fixed") return `$${value} off`;
  if (type === "trial") return `+${value} days trial`;
  return "---";
};

const statusOf = (row) => {
  if (!row.is_active) return "inactive";
  if (row.expires_at && dayjs(row.expires_at).isBefore(dayjs()))
    return "expired";
  if (row.max_uses != null && row.times_used >= row.max_uses)
    return "exhausted";
  return "active";
};

const STATUS_STYLES = {
  active: { bg: "#dcfce7", color: "#15803d", label: "Active" },
  inactive: { bg: "#f1f5f9", color: "#64748b", label: "Inactive" },
  expired: { bg: "#fef3c7", color: "#b45309", label: "Expired" },
  exhausted: { bg: "#fee2e2", color: "#b91c1c", label: "Exhausted" },
};

// --------- Stat card ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        border: "1px solid #f1f5f9",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
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
            fontSize: 22,
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#94a3b8",
            marginTop: 2,
            fontWeight: 500,
          }}
        >
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --------- Copy button ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Tooltip title={copied ? "Copied!" : "Copy code"}>
      <button
        onClick={copy}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          background: "#fff",
          cursor: "pointer",
          color: copied ? "#10b981" : "#94a3b8",
          transition: "all 0.15s",
        }}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
      </button>
    </Tooltip>
  );
}

// --------- Main component ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default function AdminPromoCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [planOptions, setPlanOptions] = useState(FALLBACK_PLAN_OPTIONS);
  const [form] = Form.useForm();
  const discountType = Form.useWatch("discount_type", form);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCodes(data || []);
    } catch (e) {
      message.error("Failed to load promo codes: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("name, is_active")
        .order("name", { ascending: true });
      if (error) throw error;

      const rows = (data || []).filter((p) => String(p?.name || "").trim());
      const activeRows = rows.filter((p) => p.is_active !== false);
      const source = activeRows.length > 0 ? activeRows : rows;
      const uniqueNames = [...new Set(source.map((p) => p.name.trim()))];

      if (uniqueNames.length > 0) {
        setPlanOptions(uniqueNames.map((name) => ({ value: name, label: name })));
      } else {
        setPlanOptions(FALLBACK_PLAN_OPTIONS);
      }
    } catch {
      setPlanOptions(FALLBACK_PLAN_OPTIONS);
      message.warning("Could not load plans. Showing default package names.");
    }
  };

  useEffect(() => {
    load();
    loadPlans();
  }, []);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      discount_type: "percent",
      is_active: true,
      code: generateCode(),
    });
    setEditingCode(null);
    setModalVisible(true);
  };

  const openEdit = (record) => {
    form.setFieldsValue({
      ...record,
      expires_at: record.expires_at ? dayjs(record.expires_at) : null,
    });
    setEditingCode(record);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingCode(null);
  };

  const handleSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      const normalizedCode = String(values.code || "").toUpperCase().trim();
      if (!normalizedCode) throw new Error("Promo code is required.");

      const payload = {
        ...values,
        code: normalizedCode,
        applicable_plans:
          Array.isArray(values.applicable_plans) &&
          values.applicable_plans.length > 0
            ? values.applicable_plans
            : null,
        expires_at: values.expires_at ? values.expires_at.toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      if (editingCode) {
        const { error } = await supabase
          .from("promo_codes")
          .update(payload)
          .eq("id", editingCode.id);
        if (error) throw error;
        message.success("Promo code updated!");
      } else {
        const { created_at, updated_at, ...insertPayload } = payload;
        const { error } = await supabase
          .from("promo_codes")
          .insert([{ ...insertPayload, times_used: 0 }]);
        if (error) throw error;
        message.success("Promo code created!");
      }
      closeModal();
      await load();
    } catch (e) {
      message.error(e.message || "Operation failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setCodes(codes.filter((c) => c.id !== id));
      message.success("Promo code deleted");
    } catch {
      message.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (record, is_active) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", record.id);
      if (error) throw error;
      setCodes(
        codes.map((c) => (c.id === record.id ? { ...c, is_active } : c)),
      );
      message.success(`Code ${is_active ? "activated" : "deactivated"}`);
    } catch {
      message.error("Failed to update");
    }
  };

  // Stats
  const active = codes.filter((c) => statusOf(c) === "active").length;
  const totalUses = codes.reduce((s, c) => s + (c.times_used || 0), 0);
  const expiringSoon = codes.filter((c) => {
    if (!c.expires_at || !c.is_active) return false;
    return (
      dayjs(c.expires_at).diff(dayjs(), "day") <= 7 &&
      dayjs(c.expires_at).isAfter(dayjs())
    );
  }).length;

  // Filtered
  const filtered = codes.filter((c) => {
    const matchSearch =
      !search ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || statusOf(c) === filterStatus;
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      width: 180,
      render: (code) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 700,
              background: "#f1f5f9",
              color: "#0f172a",
              padding: "4px 10px",
              borderRadius: 8,
              letterSpacing: "0.08em",
            }}
          >
            {code}
          </span>
          <CopyButton text={code} />
        </div>
      ),
    },
    {
      title: "Discount",
      width: 130,
      render: (_, r) => {
        const icons = {
          percent: <Percent size={12} />,
          fixed: <DollarSign size={12} />,
          trial: <Zap size={12} />,
        };
        const colors = {
          percent: "#6366f1",
          fixed: "#10b981",
          trial: "#f59e0b",
        };
        const color = colors[r.discount_type] || "#64748b";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: color + "15",
                color,
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {icons[r.discount_type]}
              {formatDiscount(r.discount_type, r.discount_value)}
            </span>
          </div>
        );
      },
    },
    {
      title: "Status",
      width: 110,
      render: (_, r) => {
        const s = statusOf(r);
        const style = STATUS_STYLES[s];
        return (
          <span
            style={{
              background: style.bg,
              color: style.color,
              padding: "3px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {style.label}
          </span>
        );
      },
    },
    {
      title: "Uses",
      width: 110,
      render: (_, r) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#475569",
          }}
        >
          <BarChart2 size={13} color="#94a3b8" />
          <span style={{ fontWeight: 600 }}>{r.times_used || 0}</span>
          {r.max_uses != null && (
            <span style={{ color: "#cbd5e1" }}>/ {r.max_uses}</span>
          )}
          {r.max_uses == null && (
            <span style={{ fontSize: 10, color: "#cbd5e1" }}>---</span>
          )}
        </div>
      ),
    },
    {
      title: "Expires",
      width: 130,
      render: (_, r) => {
        if (!r.expires_at)
          return <span style={{ fontSize: 12, color: "#cbd5e1" }}>Never</span>;
        const d = dayjs(r.expires_at);
        const diff = d.diff(dayjs(), "day");
        const expired = d.isBefore(dayjs());
        return (
          <div style={{ fontSize: 12 }}>
            <div
              style={{
                fontWeight: 600,
                color: expired ? "#b91c1c" : diff <= 7 ? "#b45309" : "#0f172a",
              }}
            >
              {d.format("MMM D, YYYY")}
            </div>
            <div style={{ color: "#94a3b8", marginTop: 1 }}>
              {expired
                ? "Expired"
                : diff === 0
                  ? "Expires today"
                  : `${diff}d left`}
            </div>
          </div>
        );
      },
    },
    {
      title: "Plans",
      width: 120,
      render: (_, r) => {
        const plans = r.applicable_plans;
        if (!plans || plans.length === 0)
          return (
            <span style={{ fontSize: 12, color: "#cbd5e1" }}>All plans</span>
          );
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {plans.map((p) => (
              <span
                key={p}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: "#eef2ff",
                  color: "#6366f1",
                  padding: "2px 7px",
                  borderRadius: 20,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: "Active",
      width: 80,
      render: (_, r) => (
        <Switch
          size="small"
          checked={r.is_active}
          onChange={(v) => handleToggle(r, v)}
          style={{ background: r.is_active ? "#10b981" : "#e2e8f0" }}
        />
      ),
    },
    {
      title: "",
      width: 120,
      render: (_, r) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => openEdit(r)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
            }}
          >
            <Pencil size={12} /> Edit
          </button>
          <Popconfirm
            title={<span style={{ fontWeight: 600 }}>Delete "{r.code}"?</span>}
            description="This action cannot be undone."
            onConfirm={() => handleDelete(r.id)}
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
                borderRadius: 8,
                border: "1px solid #fee2e2",
                background: "#fff",
                cursor: "pointer",
                color: "#ef4444",
              }}
            >
              {deletingId === r.id ? (
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
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: 32,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .promo-table .ant-table-thead > tr > th {
          background: #f8fafc !important; color: #64748b !important;
          font-weight: 600 !important; font-size: 12px !important;
          text-transform: uppercase !important; letter-spacing: 0.05em !important;
          border-bottom: 1px solid #f1f5f9 !important; padding: 12px 16px !important;
        }
        .promo-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f8fafc !important;
          padding: 14px 16px !important; vertical-align: middle !important;
        }
        .promo-table .ant-table-tbody > tr:hover > td { background: #fafbff !important; }
        .form-label { font-size: 13px !important; font-weight: 600 !important; color: #374151 !important; }
      `}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: 28,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            Promo Codes
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#94a3b8" }}>
            Create and manage discount codes, trials, and promotions
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #7c3aed)",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(124,58,237,0.35)",
          }}
        >
          <Plus size={16} /> New Code
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={Tag}
          label="Total Codes"
          value={codes.length}
          color="#6366f1"
        />
        <StatCard icon={Check} label="Active" value={active} color="#10b981" />
        <StatCard
          icon={BarChart2}
          label="Total Uses"
          value={totalUses}
          color="#3b82f6"
        />
        <StatCard
          icon={Calendar}
          label="Expiring Soon"
          value={expiringSoon}
          color="#f59e0b"
          sub="within 7 days"
        />
      </div>

      {/* Table card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.05)",
          border: "1px solid #f1f5f9",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search codes or descriptions---"
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                fontSize: 13,
                outline: "none",
                color: "#0f172a",
                background: "#f8fafc",
              }}
            />
          </div>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            size="middle"
            style={{ width: 140 }}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "expired", label: "Expired" },
              { value: "exhausted", label: "Exhausted" },
            ]}
          />
          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>
            {filtered.length} of {codes.length} codes
          </span>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 80,
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Loader2
              size={28}
              color="#7c3aed"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span style={{ color: "#94a3b8", fontSize: 14 }}>
              Loading codes---
            </span>
          </div>
        ) : (
          <Table
            className="promo-table"
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            pagination={{
              pageSize: 15,
              showSizeChanger: false,
              showTotal: (t) => `${t} codes total`,
              style: { padding: "16px", borderTop: "1px solid #f1f5f9" },
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </motion.div>

      {/* Modal */}
      <Modal
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={680}
        style={{ top: 32 }}
        styles={{ body: { padding: 0 } }}
        closable={false}
        modalRender={(modal) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.22 }}
            style={{ borderRadius: 20, overflow: "hidden" }}
          >
            {modal}
          </motion.div>
        )}
      >
        {/* Modal header */}
        <div
          style={{
            padding: "24px 28px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: editingCode
                  ? "#fef3c7"
                  : "linear-gradient(135deg,#7c3aed,#7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {editingCode ? (
                <Pencil size={16} color="#d97706" />
              ) : (
                <Tag size={16} color="#fff" />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
                {editingCode
                  ? `Edit "${editingCode.code}"`
                  : "Create Promo Code"}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                {editingCode
                  ? "Update discount code configuration"
                  : "Set up a new discount or promotional code"}
              </div>
            </div>
          </div>
          <button
            onClick={closeModal}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
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

        {/* Modal body */}
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div
            style={{
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* Code + active */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 14,
                }}
              >
                Code
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 12,
                  alignItems: "end",
                }}
              >
                <Form.Item
                  name="code"
                  label={<span className="form-label">Promo Code</span>}
                  rules={[{ required: true, message: "Required" }]}
                  style={{ margin: 0 }}
                >
                  <Input
                    placeholder="SUMMER25"
                    size="large"
                    style={{
                      borderRadius: 10,
                      fontFamily: "monospace",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                    onChange={(e) =>
                      form.setFieldValue("code", e.target.value.toUpperCase())
                    }
                  />
                </Form.Item>
                <button
                  type="button"
                  onClick={() => form.setFieldValue("code", generateCode())}
                  style={{
                    height: 40,
                    padding: "0 16px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#64748b",
                    whiteSpace: "nowrap",
                  }}
                >
                  Generate
                </button>
                <Form.Item
                  name="is_active"
                  valuePropName="checked"
                  style={{ margin: 0 }}
                  label={<span className="form-label">Active</span>}
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </div>
            </div>

            {/* Description */}
            <Form.Item
              name="description"
              label={<span className="form-label">Description</span>}
              style={{ margin: 0 }}
            >
              <Input
                placeholder="e.g. Summer 2025 campaign, 25% off all plans"
                size="large"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            {/* Discount */}
            <div style={{ height: 1, background: "#f1f5f9" }} />
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 14,
                }}
              >
                Discount
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <Form.Item
                  name="discount_type"
                  label={<span className="form-label">Type</span>}
                  rules={[{ required: true, message: "Required" }]}
                  style={{ margin: 0 }}
                >
                  <Select
                    size="large"
                    style={{ borderRadius: 10 }}
                    options={[
                      { value: "percent", label: "Percentage (% off)" },
                      { value: "fixed", label: "Fixed amount ($ off)" },
                      { value: "trial", label: "Extended trial (extra days)" },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  name="discount_value"
                  label={
                    <span className="form-label">
                      {discountType === "percent"
                        ? "Percentage (%)"
                        : discountType === "fixed"
                          ? "Amount ($)"
                          : "Extra Days"}
                    </span>
                  }
                  rules={[{ required: true, message: "Required" }]}
                  style={{ margin: 0 }}
                >
                  <InputNumber
                    min={0}
                    max={discountType === "percent" ? 100 : undefined}
                    precision={discountType === "fixed" ? 2 : 0}
                    size="large"
                    style={{ width: "100%", borderRadius: 10 }}
                    placeholder={
                      discountType === "percent"
                        ? "25"
                        : discountType === "fixed"
                          ? "10.00"
                          : "14"
                    }
                    addonAfter={
                      discountType === "percent"
                        ? "%"
                        : discountType === "fixed"
                          ? "$"
                          : "days"
                    }
                  />
                </Form.Item>
              </div>
            </div>

            {/* Limits */}
            <div style={{ height: 1, background: "#f1f5f9" }} />
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 14,
                }}
              >
                Limits
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <Form.Item
                  name="max_uses"
                  label={
                    <span
                      className="form-label"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Repeat size={13} /> Max Uses
                    </span>
                  }
                  style={{ margin: 0 }}
                >
                  <InputNumber
                    min={1}
                    placeholder="Blank = unlimited"
                    size="large"
                    style={{ width: "100%", borderRadius: 10 }}
                  />
                </Form.Item>
                <Form.Item
                  name="max_uses_per_user"
                  label={
                    <span
                      className="form-label"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Users size={13} /> Per-User Limit
                    </span>
                  }
                  style={{ margin: 0 }}
                >
                  <InputNumber
                    min={1}
                    placeholder="Blank = unlimited"
                    size="large"
                    style={{ width: "100%", borderRadius: 10 }}
                  />
                </Form.Item>
                <Form.Item
                  name="expires_at"
                  label={
                    <span
                      className="form-label"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Calendar size={13} /> Expiry Date
                    </span>
                  }
                  style={{ margin: 0 }}
                >
                  <DatePicker
                    size="large"
                    style={{ width: "100%", borderRadius: 10 }}
                    disabledDate={(d) => d && d.isBefore(dayjs(), "day")}
                    format="MMM D, YYYY"
                  />
                </Form.Item>
                <Form.Item
                  name="min_plan_price"
                  label={
                    <span
                      className="form-label"
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <DollarSign size={13} /> Min Plan Price ($)
                    </span>
                  }
                  style={{ margin: 0 }}
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    placeholder="No minimum"
                    size="large"
                    style={{ width: "100%", borderRadius: 10 }}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Applicable plans */}
            <div style={{ height: 1, background: "#f1f5f9" }} />
            <Form.Item
              name="applicable_plans"
              label={
                <span className="form-label">
                  Applicable Plans{" "}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                    (blank = all plans)
                  </span>
                </span>
              }
              style={{ margin: 0 }}
            >
              <Select
                mode="multiple"
                size="large"
                placeholder="Select plans or leave blank for all"
                style={{ borderRadius: 10 }}
                options={planOptions}
              />
            </Form.Item>
          </div>

          {/* Modal footer */}
          <div
            style={{
              padding: "16px 28px 24px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={closeModal}
              style={{
                padding: "9px 20px",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#fff",
                cursor: "pointer",
                fontSize: 14,
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
                gap: 8,
                padding: "9px 22px",
                borderRadius: 10,
                border: "none",
                cursor: submitLoading ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg,#7c3aed,#7c3aed)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
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
              {editingCode ? "Save Changes" : "Create Code"}
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

