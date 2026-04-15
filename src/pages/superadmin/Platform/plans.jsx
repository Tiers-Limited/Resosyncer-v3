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
  Tabs,
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
import { useTheme } from "../../../components/Layout/MainLayout";

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

const ICON_MAP = {
  Zap,
  Rocket,
  Crown,
  ShieldCheck,
  Star,
  Sparkles,
};

const getMonthlyPrice = (plan) => {
  if (plan.monthly_price != null) return Number(plan.monthly_price) || 0;
  if (plan.price != null) return Number(plan.price) || 0;
  return 0;
};

const getYearlyMonthlyRate = (plan) => {
  if (plan.yearly_price != null) return Number(plan.yearly_price) || 0;
  const monthly = getMonthlyPrice(plan);
  return monthly > 0 ? monthly : 0;
};

const PRICING_REGIONS = [
  { key: "EUROPE", label: "Europe", defaultCurrency: "EUR" },
  { key: "GLOBAL", label: "Global", defaultCurrency: "USD" },
];

const BILLING_CYCLES = [
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

const normalizeRegionKey = (value) => {
  const raw = String(value || "").trim().toUpperCase();
  if (raw === "EUROPE" || raw === "EU") return "EUROPE";
  if (raw === "GLOBAL" || raw === "WORLD" || raw === "US") return "GLOBAL";
  return null;
};

const buildDefaultRegionalPricing = (monthly = 0, yearly = 0) => ({
  monthly: {
    EUROPE: { currency: "EUR", price: Number(monthly) || 0, stripe_price_id: null },
    GLOBAL: { currency: "USD", price: Number(monthly) || 0, stripe_price_id: null },
  },
  yearly: {
    EUROPE: { currency: "EUR", price: Number(yearly) || 0, stripe_price_id: null },
    GLOBAL: { currency: "USD", price: Number(yearly) || 0, stripe_price_id: null },
  },
});

const toRegionalPricingForm = (rows, fallbackMonthly, fallbackYearly) => {
  const out = buildDefaultRegionalPricing(fallbackMonthly, fallbackYearly);
  (rows || []).forEach((row) => {
    const cycle = String(row?.billing_cycle || "monthly").toLowerCase();
    if (!BILLING_CYCLES.some((c) => c.key === cycle)) return;
    const region = normalizeRegionKey(row?.region);
    if (!region) return;
    const defCurrency = PRICING_REGIONS.find((r) => r.key === region)?.defaultCurrency || "USD";
    out[cycle][region] = {
      currency: String(row?.currency || defCurrency).trim().toUpperCase() || defCurrency,
      price: Number(row?.price ?? 0) || 0,
      stripe_price_id: row?.stripe_price_id || null,
    };
  });
  return out;
};

// Stat Card
function StatCard({ icon: Icon, label, value, color, tk }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: tk.cardBg,
        borderRadius: "16px",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: tk.cardShadow,
        border: `1px solid ${tk.border}`,
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
            color: tk.textPri,
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "13px",
            color: tk.textMuted,
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

// Plan Row Badge
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
  const { isDarkMode } = useTheme();
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
      const { data, error } = await supabase.from("plans").select("*");
      if (error) throw error;
      const basePlans = (data || []).sort(
        (a, b) => getMonthlyPrice(a) - getMonthlyPrice(b),
      );

      const ids = basePlans.map((p) => p.id).filter(Boolean);
      if (!ids.length) {
        setPlans(basePlans);
        return;
      }

      const { data: regionRows, error: regionError } = await supabase
        .from("plan_region_prices")
        .select("*")
        .in("plan_id", ids);
      if (regionError) {
        const missingRegionTable =
          regionError.code === "42P01" ||
          String(regionError.message || "")
            .toLowerCase()
            .includes("could not find the table 'public.plan_region_prices'") ||
          String(regionError.message || "")
            .toLowerCase()
            .includes("schema cache");
        if (missingRegionTable) {
          setPlans(basePlans);
          message.warning(
            "Regional pricing table is missing. Run the SQL migration to enable region prices.",
          );
          return;
        }
        throw regionError;
      }

      const byPlanId = (regionRows || []).reduce((acc, row) => {
        if (!acc[row.plan_id]) acc[row.plan_id] = [];
        acc[row.plan_id].push({
          region: row.region,
          currency: row.currency,
          price: row.price,
          billing_cycle: row.billing_cycle,
          stripe_price_id: row.stripe_price_id,
        });
        return acc;
      }, {});

      setPlans(
        basePlans.map((p) => ({
          ...p,
          regional_prices: byPlanId[p.id] || [],
          regional_pricing: toRegionalPricingForm(
            byPlanId[p.id] || [],
            getMonthlyPrice(p),
            getYearlyMonthlyRate(p),
          ),
        })),
      );
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

  const normalizeRegionPrices = (pricing) => {
    const source = pricing || {};
    const rows = [];
    BILLING_CYCLES.forEach(({ key: cycleKey }) => {
      PRICING_REGIONS.forEach((regionCfg) => {
        const bucket = source?.[cycleKey]?.[regionCfg.key] || {};
        rows.push({
          plan_id: null,
          billing_cycle: cycleKey,
          region: regionCfg.key,
          currency:
            String(bucket.currency || regionCfg.defaultCurrency).trim().toUpperCase() ||
            regionCfg.defaultCurrency,
          price: Number(bucket.price ?? 0) || 0,
          stripe_price_id: bucket.stripe_price_id ? String(bucket.stripe_price_id).trim() : null,
        });
      });
    });
    return rows;
  };

  const syncRegionPrices = async (planId, pricing) => {
    const normalized = normalizeRegionPrices(pricing);
    const { error: deleteError } = await supabase
      .from("plan_region_prices")
      .delete()
      .eq("plan_id", planId);
    if (deleteError) {
      if (deleteError.code === "42P01") {
        throw new Error(
          "Missing table public.plan_region_prices. Run migrations and reload schema cache.",
        );
      }
      throw deleteError;
    }

    if (!normalized.length) return;

    const payload = normalized.map((r) => ({ ...r, plan_id: planId }));
    const { error: insertError } = await supabase
      .from("plan_region_prices")
      .insert(payload);
    if (insertError) {
      if (insertError.code === "42P01") {
        throw new Error(
          "Missing table public.plan_region_prices. Run migrations and reload schema cache.",
        );
      }
      throw insertError;
    }
  };

  const handleCreateOrUpdate = async (values) => {
    try {
      setSubmitLoading(true);
      const regionalPricing =
        values.regional_pricing || buildDefaultRegionalPricing(0, 0);
      const normalizedMonthly = Number(
        regionalPricing?.monthly?.GLOBAL?.price ??
          regionalPricing?.monthly?.EUROPE?.price ??
          values.monthly_price ??
          values.price ??
          0,
      );
      const normalizedYearly = Number(
        regionalPricing?.yearly?.GLOBAL?.price ??
          regionalPricing?.yearly?.EUROPE?.price ??
          values.yearly_price ??
          (normalizedMonthly > 0 ? normalizedMonthly : 0),
      );
      const { regional_pricing, ...restValues } = values;
      delete restValues.monthly_price;
      delete restValues.yearly_price;
      delete restValues.stripe_monthly_price_id;
      delete restValues.stripe_yearly_price_id;
      delete restValues.stripe_price_id;
      const monthlyStripeId = regionalPricing?.monthly?.GLOBAL?.stripe_price_id || null;
      const planData = {
        ...restValues,
        monthly_price: normalizedMonthly,
        yearly_price: normalizedYearly,
        // Backward compatibility for pages still reading legacy field.
        stripe_price_id: monthlyStripeId,
        contact_for_pricing: !!values.contact_for_pricing,
        free_trial_available: !!values.free_trial_available,
        trial_days: Math.max(0, Number(values.trial_days ?? 14) || 0),
        features: parseFeatures(values.features),
        updated_at: new Date().toISOString(),
      };
      const { updated_at, ...insertData } = planData;
      const isMissingColumnError = (err, column) =>
        String(err?.message || "")
          .toLowerCase()
          .includes(`could not find the '${String(column).toLowerCase()}' column`);

      if (editingPlan?.id) {
        let { error } = await supabase
          .from("plans")
          .update(planData)
          .eq("id", editingPlan.id);
        if (error && isMissingColumnError(error, "contact_for_pricing")) {
          const { contact_for_pricing, ...fallbackData } = planData;
          ({ error } = await supabase
            .from("plans")
            .update(fallbackData)
            .eq("id", editingPlan.id));
          if (!error) {
            message.warning(
              "Saved without Contact Package flag. Run migrations to enable this field.",
            );
          }
        }
        if (error) throw error;
        await syncRegionPrices(editingPlan.id, regionalPricing);
        message.success("Plan updated!");
      } else {
        let { data: createdPlan, error } = await supabase
          .from("plans")
          .insert([insertData])
          .select("id")
          .single();
        if (error && isMissingColumnError(error, "contact_for_pricing")) {
          const { contact_for_pricing, ...fallbackInsert } = insertData;
          ({ data: createdPlan, error } = await supabase
            .from("plans")
            .insert([fallbackInsert])
            .select("id")
            .single());
          if (!error) {
            message.warning(
              "Saved without Contact Package flag. Run migrations to enable this field.",
            );
          }
        }
        if (error) throw error;
        await syncRegionPrices(createdPlan.id, regionalPricing);
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
      monthly_price: getMonthlyPrice(record),
      yearly_price: getYearlyMonthlyRate(record),
      contact_for_pricing: !!record.contact_for_pricing,
      free_trial_available: !!record.free_trial_available,
      trial_days: Number(record.trial_days ?? 14) || 14,
      regional_pricing: toRegionalPricingForm(
        Array.isArray(record.regional_prices) ? record.regional_prices : [],
        getMonthlyPrice(record),
        getYearlyMonthlyRate(record),
      ),
      features: formatFeatures(record.features),
    });
    setEditingPlan(record);
    setModalVisible(true);
  };

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      monthly_price: 0,
      yearly_price: 0,
      contact_for_pricing: false,
      free_trial_available: true,
      trial_days: 14,
      popular: false,
      regional_pricing: buildDefaultRegionalPricing(0, 0),
    });
    setEditingPlan(null);
    setModalVisible(true);
  };

  const activePlans = plans.filter((p) => p.is_active).length;
  const popularPlan = plans.find((p) => p.popular);
  const tk = isDarkMode
    ? {
        pageBg: "#141416",
        cardBg: "#1a1b1f",
        cardBgAlt: "#17181c",
        border: "#2a2b31",
        divider: "#24262d",
        textPri: "#f3f4f6",
        textSec: "#cbd5e1",
        textMuted: "#94a3b8",
        rowHover: "#1f2128",
        cardShadow:
          "0 1px 0 rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.35)",
      }
    : {
        pageBg: "#f6f8fc",
        cardBg: "#ffffff",
        cardBgAlt: "#f8fafc",
        border: "#edf1f7",
        divider: "#f1f5f9",
        textPri: "#0f172a",
        textSec: "#475569",
        textMuted: "#94a3b8",
        rowHover: "#fafbff",
        cardShadow: "0 1px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(15,23,42,0.06)",
      };

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
                style={{ fontWeight: 600, fontSize: "14px", color: tk.textPri }}
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
                style={{ fontSize: "12px", color: tk.textMuted, marginTop: "2px" }}
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
        record.contact_for_pricing ? (
          <AntTag color="blue" style={{ borderRadius: 999 }}>
            Contact
          </AntTag>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ fontSize: "13px", color: tk.textPri, fontWeight: 600 }}>
              ${getMonthlyPrice(record)} <span style={{ color: tk.textMuted }}>/mo</span>
            </div>
            <div style={{ fontSize: "13px", color: tk.textPri, fontWeight: 600 }}>
              ${getYearlyMonthlyRate(record)}{" "}
              <span style={{ color: tk.textMuted }}>/mo billed yearly</span>
            </div>
          </div>
        )
      ),
      width: 150,
    },
    {
      title: "Free Trial",
      dataIndex: "free_trial_available",
      render: (freeTrialAvailable, record) =>
        freeTrialAvailable ? (
          <AntTag color="green" style={{ borderRadius: 999 }}>
            {`${Number(record?.trial_days ?? 14) || 14} days`}
          </AntTag>
        ) : (
          <AntTag color="default" style={{ borderRadius: 999 }}>
            No
          </AntTag>
        ),
      width: 110,
    },
    {
      title: "Regional Pricing",
      render: (_, record) => {
        const pricing = toRegionalPricingForm(
          record.regional_prices || [],
          getMonthlyPrice(record),
          getYearlyMonthlyRate(record),
        );
        const monthly = pricing.monthly || {};
        const yearly = pricing.yearly || {};
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ fontSize: "12px", color: tk.textSec }}>
              Monthly: Europe {monthly.EUROPE?.currency} {monthly.EUROPE?.price}, Global{" "}
              {monthly.GLOBAL?.currency} {monthly.GLOBAL?.price}
            </span>
            <span style={{ fontSize: "12px", color: tk.textSec }}>
              Yearly: Europe {yearly.EUROPE?.currency} {yearly.EUROPE?.price}, Global{" "}
              {yearly.GLOBAL?.currency} {yearly.GLOBAL?.price}
            </span>
          </div>
        );
      },
      width: 280,
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
              color: tk.textSec,
            }}
          >
            <Users size={13} color={tk.textMuted} />
            {record.max_users != null
              ? `${record.max_users} users`
              : "Unlimited users"}
          </div>
        </div>
      ),
      width: 150,
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
              color: active ? "#059669" : tk.textMuted,
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
                color: tk.textSec,
              }}
            >
              <Check size={11} color="#10b981" strokeWidth={2.5} />
              {feature.text}
            </div>
          ))}
          {(record.features?.length || 0) > 3 && (
            <div
              style={{ fontSize: "11px", color: tk.textMuted, marginTop: "2px" }}
            >
              +{record.features.length - 3} more features
            </div>
          )}
        </div>
      ),
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
              border: `1px solid ${tk.border}`,
              background: tk.cardBgAlt,
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              color: tk.textSec,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tk.rowHover;
              e.currentTarget.style.borderColor = tk.textMuted;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = tk.cardBgAlt;
              e.currentTarget.style.borderColor = tk.border;
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
                border: `1px solid ${isDarkMode ? "#7f1d1d" : "#fee2e2"}`,
                background: tk.cardBgAlt,
                cursor: "pointer",
                color: "#ef4444",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDarkMode ? "#2a1517" : "#fef2f2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = tk.cardBgAlt;
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
      className={`plans-root ${isDarkMode ? "plans-root-dark" : "plans-root-light"}`}
      style={{
        minHeight: "100vh",
        background: tk.pageBg,
        padding: "32px",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .plans-table .ant-table { background: transparent; }
        .plans-table .ant-table-thead > tr > th {
          background: ${isDarkMode ? "#1a1b1f" : "#f8fafc"} !important;
          color: ${isDarkMode ? "#94a3b8" : "#64748b"} !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid ${isDarkMode ? "#2a2b31" : "#f1f5f9"} !important;
          padding: 12px 16px !important;
        }
        .plans-table .ant-table-tbody > tr > td {
          color: ${isDarkMode ? "#e5e7eb" : "#334155"} !important;
          background: ${isDarkMode ? "#17181c" : "#ffffff"} !important;
          border-bottom: 1px solid ${isDarkMode ? "#25262d" : "#f8fafc"} !important;
          padding: 14px 16px !important;
          vertical-align: middle !important;
        }
        .plans-table .ant-table-tbody > tr:hover > td {
          background: ${isDarkMode ? "#1f2128" : "#fafbff"} !important;
        }
        .plans-table .ant-table-wrapper {
          border-radius: 0 !important;
        }
        .form-label {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: ${isDarkMode ? "#e2e8f0" : "#374151"} !important;
        }
        .plans-root-dark .ant-modal-content { background: #1a1b1f !important; color: #e5e7eb !important; }
        .plans-root-dark .ant-input,
        .plans-root-dark .ant-input-number,
        .plans-root-dark .ant-input-affix-wrapper,
        .plans-root-dark .ant-input-number-input,
        .plans-root-dark .ant-select-selector,
        .plans-root-dark .ant-input-textarea textarea {
          background: #141416 !important;
          border-color: #2a2b31 !important;
          color: #e5e7eb !important;
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
                color: tk.textPri,
              }}
            >
              Subscription Plans
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: tk.textMuted,
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
            background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
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
          tk={tk}
        />
        <StatCard
          icon={CheckCircle2}
          label="Active Plans"
          value={activePlans}
          color="#10b981"
          tk={tk}
        />
        <StatCard
          icon={XCircle}
          label="Inactive"
          value={plans.length - activePlans}
          color="#f59e0b"
          tk={tk}
        />
        <StatCard
          icon={TrendingUp}
          label="Featured Plan"
          value={popularPlan?.name || "-"}
          color="#ec4899"
          tk={tk}
        />
      </div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          background: tk.cardBg,
          borderRadius: "20px",
          boxShadow: tk.cardShadow,
          border: `1px solid ${tk.border}`,
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
            <span style={{ color: tk.textMuted, fontSize: "14px" }}>
              Loading plans
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
              style: { padding: "16px 16px", borderTop: `1px solid ${tk.divider}` },
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
            borderBottom: `1px solid ${tk.divider}`,
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
                style={{ fontWeight: 700, fontSize: "16px", color: tk.textPri }}
              >
                {editingPlan ? `Edit "${editingPlan.name}"` : "Create New Plan"}
              </div>
              <div style={{ fontSize: "12px", color: tk.textMuted }}>
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
              border: `1px solid ${tk.border}`,
              background: tk.cardBgAlt,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tk.textMuted,
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
                  color: tk.textMuted,
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
                  gridTemplateColumns: "1fr 1fr 140px 160px",
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
                  name="contact_for_pricing"
                  label={<span className="form-label">Contact Package</span>}
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
                <Form.Item
                  name="free_trial_available"
                  label={<span className="form-label">Free Trial</span>}
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
                <Form.Item
                  name="trial_days"
                  label={<span className="form-label">Trial Days</span>}
                  rules={[{ required: true, message: "Required" }]}
                  style={{ margin: 0 }}
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    size="large"
                    style={{ width: "100%", borderRadius: "10px" }}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Section: Pricing */}
            <div
              style={{
                height: "1px",
                background: tk.divider,
                margin: "4px 0 20px",
              }}
            />
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: tk.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "14px",
                }}
              >
                Pricing by Billing Cycle
              </div>
              <Tabs
                defaultActiveKey="monthly"
                items={BILLING_CYCLES.map((cycle) => ({
                  key: cycle.key,
                  label: cycle.label,
                  children: (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {PRICING_REGIONS.map((regionCfg) => (
                        <div
                          key={`${cycle.key}-${regionCfg.key}`}
                          style={{
                            border: `1px solid ${tk.border}`,
                            borderRadius: 12,
                            padding: 12,
                            background: tk.cardBgAlt,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: tk.textSec,
                              marginBottom: 10,
                            }}
                          >
                            {regionCfg.label}
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "120px 1fr 1fr",
                              gap: 10,
                            }}
                          >
                            <Form.Item
                              name={["regional_pricing", cycle.key, regionCfg.key, "currency"]}
                              label={<span className="form-label">Currency</span>}
                              style={{ margin: 0 }}
                            >
                              <Input
                                maxLength={8}
                                size="large"
                                placeholder={regionCfg.defaultCurrency}
                                style={{ borderRadius: 10 }}
                              />
                            </Form.Item>
                            <Form.Item
                              name={["regional_pricing", cycle.key, regionCfg.key, "price"]}
                              label={<span className="form-label">Price</span>}
                              rules={[{ required: true, message: "Required" }]}
                              style={{ margin: 0 }}
                            >
                              <InputNumber
                                min={0}
                                precision={2}
                                size="large"
                                style={{ width: "100%", borderRadius: 10 }}
                              />
                            </Form.Item>
                            <Form.Item
                              name={[
                                "regional_pricing",
                                cycle.key,
                                regionCfg.key,
                                "stripe_price_id",
                              ]}
                              label={<span className="form-label">Stripe Price ID</span>}
                              style={{ margin: 0 }}
                            >
                              <Input
                                size="large"
                                placeholder="price_xxxxxxxxxxxxx"
                                prefix={<CreditCard size={14} color={tk.textMuted} />}
                                style={{ borderRadius: 10 }}
                              />
                            </Form.Item>
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                }))}
              />
            </div>

            {/* Section: Appearance */}
            <div
              style={{
                height: "1px",
                background: tk.divider,
                margin: "4px 0 20px",
              }}
            />
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: tk.textMuted,
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
                background: tk.divider,
                margin: "4px 0 20px",
              }}
            />
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: tk.textMuted,
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
                  gridTemplateColumns: "1fr",
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
              </div>
            </div>

            {/* Section: Features */}
            <div
              style={{
                height: "1px",
                background: tk.divider,
                margin: "4px 0 20px",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: tk.textMuted,
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
                    <span style={{ color: tk.textMuted, fontWeight: 400 }}>
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
              borderTop: `1px solid ${tk.divider}`,
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
                border: `1px solid ${tk.border}`,
                background: tk.cardBgAlt,
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                color: tk.textSec,
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
