import { useState, useEffect } from "react";
import { Button, Modal, message, Tag, Switch, Tooltip } from "antd";
import {
  CrownOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  CheckOutlined,
  ArrowUpOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  DatabaseOutlined,
  StarFilled,
  InfoCircleOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleFilled,
  CreditCardOutlined,
  SyncOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { supabase } from "../lib/supabase";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "$0",
    period: "forever",
    tagline: "Try before you commit",
    icon: <ThunderboltOutlined />,
    color: "#64748b",
    features: [
      "Up to 5 employees",
      "Basic project tracking",
      "1 GB storage",
      "Email support",
    ],
    limits: { max_users: 5, storage_gb: 1 },
    stripePriceId: null,
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    priceLabel: "$49",
    period: "/mo",
    tagline: "Perfect for small teams",
    icon: <RocketOutlined />,
    color: "#3b82f6",
    features: [
      "Up to 25 employees",
      "Full project management",
      "10 GB storage",
      "Priority email support",
      "Attendance & standups",
      "Document management",
    ],
    limits: { max_users: 25, storage_gb: 10 },
    stripePriceId: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID,
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    priceLabel: "$149",
    period: "/mo",
    tagline: "For growing businesses",
    icon: <CrownOutlined />,
    color: "#8b5cf6",
    popular: true,
    features: [
      "Up to 100 employees",
      "Advanced analytics",
      "50 GB storage",
      "Priority chat support",
      "Full HR suite",
      "Contract builder",
      "Recruitment module",
      "Custom roles",
    ],
    limits: { max_users: 100, storage_gb: 50 },
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 399,
    priceLabel: "$399",
    period: "/mo",
    tagline: "For large organisations",
    icon: <SafetyCertificateOutlined />,
    color: "#10b981",
    features: [
      "Unlimited employees",
      "Dedicated account manager",
      "Unlimited storage",
      "24/7 phone & chat",
      "Everything in Pro",
      "SSO / SAML",
      "Custom integrations",
      "SLA guarantee",
    ],
    limits: { max_users: null, storage_gb: null },
    stripePriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID,
  },
];

const STORAGE_MAP = [
  {
    bucket: "attachments",
    sources: [
      { table: "tickets", column: null },
      { table: "ticket_attachments", column: "storage_path" },
    ],
  },
  {
    bucket: "meeting_recordings",
    sources: [{ table: "meetings", column: "recording_url" }],
  },
  {
    bucket: "recruitment-cvs",
    sources: [{ table: "recruitment_applicants", column: "cv_url" }],
  },
  {
    bucket: "training_materials",
    sources: [{ table: "training_materials", column: "file_path" }],
  },
  {
    bucket: "chat-files",
    sources: [{ table: "messages", column: "file_url" }],
  },
  {
    bucket: "documents",
    sources: [{ table: "documents", column: "file_url" }],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const extractPath = (urlOrPath) => {
  if (!urlOrPath) return null;
  try {
    const url = new URL(urlOrPath);
    const parts = url.pathname.split("/");
    const bucketIndex = parts.findIndex((p) => p === "public");
    return bucketIndex !== -1
      ? parts.slice(bucketIndex + 2).join("/")
      : urlOrPath;
  } catch {
    return urlOrPath;
  }
};

const calculateStorageUsed = async (tenantId) => {
  const results = await Promise.all(
    STORAGE_MAP.map(async ({ bucket, sources }) => {
      let totalBytes = 0;
      let fileCount = 0;
      for (const { table, column } of sources) {
        if (!column) continue;
        const { data, error } = await supabase
          .from(table)
          .select(column)
          .eq("tenant_id", tenantId);
        if (error || !data) continue;
        fileCount += data.length;
        await Promise.all(
          data.map(async (row) => {
            const path = extractPath(row[column]);
            if (!path) return;
            const folder = path.split("/").slice(0, -1).join("/");
            const filename = path.split("/").pop();
            const { data: files } = await supabase.storage
              .from(bucket)
              .list(folder, { limit: 1, search: filename });
            if (files && files.length > 0) {
              const file = files[0];
              totalBytes +=
                file.metadata?.size ?? file.metadata?.contentLength ?? 0;
            }
          }),
        );
      }
      return { bucket, bytes: totalBytes, fileCount };
    }),
  );
  const totalBytes = results.reduce((sum, r) => sum + r.bytes, 0);
  return { totalBytes, breakdown: results };
};

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 MB";
  const gb = bytes / 1_073_741_824;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1_048_576;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

const getDaysLeft = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ─── Parse edge-function errors robustly ─────────────────────────────────────
const parseEdgeFnError = async (error, fallback = "Operation failed.") => {
  if (!error) return fallback;
  // Supabase wraps HTTP error bodies in error.context
  try {
    if (typeof error.context?.json === "function") {
      const parsed = await error.context.json();
      if (parsed?.error) return parsed.error;
      if (parsed?.message) return parsed.message;
    }
  } catch {
    /* ignore */
  }
  return error.message || fallback;
};

// ─── Stripe card form ─────────────────────────────────────────────────────────
const NewCardForm = ({ onTokenReady, loading }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleGetToken = async () => {
    if (!stripe || !elements) return;
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardElement),
    });
    if (error) {
      message.error(error.message);
      return;
    }
    onTokenReady(paymentMethod.id);
  };

  return (
    <div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-2">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "15px",
                color: "#1e293b",
                fontFamily: "inherit",
                "::placeholder": { color: "#94a3b8" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>
      <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-4">
        <SafetyCertificateOutlined /> Payments secured by Stripe.
      </p>
      <Button
        block
        size="large"
        onClick={handleGetToken}
        loading={loading}
        className="!h-11 !font-semibold !rounded-xl !border-0"
        style={{ background: "#0f172a", color: "#fff" }}
      >
        Confirm Upgrade
      </Button>
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = "#6366f1" }) => (
  <div
    className="bg-white rounded-2xl p-5 flex items-center gap-4"
    style={{ border: "1.5px solid #e2e8f0" }}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
      style={{ background: `${color}15`, color }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-xs text-slate-400 mb-0.5">{label}</div>
      <div className="font-bold text-slate-900 text-lg leading-tight truncate">
        {value}
      </div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

// ─── Plan card ────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, currentPlanName, onSelect, isDowngrade }) => {
  const isCurrent = plan.name.toLowerCase() === currentPlanName?.toLowerCase();
  return (
    <div
      onClick={() => !isCurrent && onSelect(plan)}
      className="relative flex flex-col rounded-2xl transition-all duration-200"
      style={{
        background: isCurrent ? "#f0fdf4" : plan.popular ? "#faf5ff" : "#fff",
        border: isCurrent
          ? "2px solid #10b981"
          : plan.popular
            ? "2px solid #8b5cf6"
            : "1.5px solid #e2e8f0",
        cursor: isCurrent ? "default" : "pointer",
      }}
    >
      {isCurrent && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1"
          style={{ background: "#10b981" }}
        >
          <CheckCircleFilled style={{ fontSize: 8 }} /> CURRENT
        </div>
      )}
      {plan.popular && !isCurrent && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1"
          style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }}
        >
          <StarFilled style={{ fontSize: 8 }} /> POPULAR
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${plan.color}18`, color: plan.color }}
          >
            {plan.icon}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">{plan.name}</div>
            <div className="text-xs text-slate-400">{plan.tagline}</div>
          </div>
        </div>
        <div className="mb-3">
          <span className="text-3xl font-black text-slate-900">
            {plan.priceLabel}
          </span>
          <span className="text-xs text-slate-400 ml-1">{plan.period}</span>
        </div>
        <div className="h-px bg-slate-100 mb-3" />
        <ul className="flex flex-col gap-1.5 flex-1 mb-4">
          {plan.features.slice(0, 4).map((f) => (
            <li
              key={f}
              className="flex items-center gap-2 text-xs text-slate-600"
            >
              <CheckOutlined style={{ color: plan.color, fontSize: 9 }} />
              {f}
            </li>
          ))}
          {plan.features.length > 4 && (
            <li className="text-xs text-slate-400">
              +{plan.features.length - 4} more
            </li>
          )}
        </ul>
        {isCurrent ? (
          <div className="w-full py-2.5 rounded-xl text-xs font-bold text-center bg-emerald-50 text-emerald-600">
            ✓ Active Plan
          </div>
        ) : (
          <div
            className="w-full py-2.5 rounded-xl text-xs font-bold text-center"
            style={{
              background: plan.popular
                ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                : `${plan.color}12`,
              color: plan.popular ? "#fff" : plan.color,
              border: plan.popular ? "none" : `1.5px solid ${plan.color}30`,
            }}
          >
            {isDowngrade ? "Downgrade" : "Upgrade"} to {plan.name}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const SubscriptionManagement = () => {
  const [tenant, setTenant] = useState(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [storageData, setStorageData] = useState(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [reactivateModal, setReactivateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [autoRenewLoading, setAutoRenewLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [liveUserCount, setLiveUserCount] = useState(null);

  useEffect(() => {
    fetchTenant();
    setTimeout(() => setMounted(true), 30);
  }, []);

  const fetchTenant = async () => {
    setLoadingTenant(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("owner_id", user.id)
        .single();
      if (error) throw error;
      setTenant(data);
      fetchLiveUserCount(data.id);
      fetchStorage(data.id);
    } catch {
      message.error("Failed to load subscription info.");
    } finally {
      setLoadingTenant(false);
    }
  };

  const fetchLiveUserCount = async (tenantId) => {
    try {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);
      if (!error && count !== null) {
        setLiveUserCount(count);
        return;
      }
      const { count: count2, error: error2 } = await supabase
        .from("tenant_users")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);
      if (!error2 && count2 !== null) setLiveUserCount(count2);
    } catch (err) {
      console.error("Failed to fetch live user count:", err);
    }
  };

  const fetchStorage = async (tenantId) => {
    setLoadingStorage(true);
    try {
      const result = await calculateStorageUsed(tenantId);
      setStorageData(result);
    } catch (err) {
      console.error("Storage calc error:", err);
    } finally {
      setLoadingStorage(false);
    }
  };

  const currentPlan =
    PLANS.find((p) => p.name.toLowerCase() === tenant?.plan?.toLowerCase()) ||
    PLANS[0];
  const getPlanIndex = (name) =>
    PLANS.findIndex((p) => p.name.toLowerCase() === name?.toLowerCase());
  const isDowngrade =
    getPlanIndex(selectedPlan?.name) < getPlanIndex(tenant?.plan);
  const hasStripe = !!tenant?.stripe_customer_id;

  // ── Dates ───────────────────────────────────────────────────────────────────
  // tenant.current_period_end should be stored as ISO string from Stripe webhook
  const periodEnd =
    tenant?.current_period_end || tenant?.subscription_end_date || null;
  const daysLeft = getDaysLeft(periodEnd);
  const isCancelled = tenant?.status === "cancelled";
  const autoRenew = tenant?.auto_renew !== false; // default true if not set

  // ── Seat display ────────────────────────────────────────────────────────────
  const unlimitedSeats =
    tenant?.max_users == null && currentPlan.limits.max_users === null;
  const seatUsed = liveUserCount ?? tenant?.user_count ?? 0;
  const seatMax = unlimitedSeats
    ? null
    : (tenant?.max_users ?? currentPlan.limits.max_users ?? 5);
  const seatLabel = unlimitedSeats
    ? `${seatUsed} / Unlimited`
    : `${seatUsed} / ${seatMax}`;
  const seatPercent = unlimitedSeats
    ? 0
    : Math.min(100, (seatUsed / (seatMax || 1)) * 100);
  const seatDanger = !unlimitedSeats && seatPercent > 80;

  // ── Storage display ─────────────────────────────────────────────────────────
  const unlimitedStorage =
    tenant?.storage_gb == null && currentPlan.limits.storage_gb === null;
  const storageUsedBytes = storageData?.totalBytes ?? 0;
  const storageUsedGB = storageUsedBytes / 1_073_741_824;
  const storageLimitGB = unlimitedStorage
    ? null
    : (tenant?.storage_gb ?? currentPlan.limits.storage_gb ?? 1);
  const storagePercent = unlimitedStorage
    ? 0
    : Math.min(100, (storageUsedGB / (storageLimitGB || 1)) * 100);
  const storageDanger = !unlimitedStorage && storagePercent > 80;
  const storageLabel = unlimitedStorage
    ? `${formatBytes(storageUsedBytes)} / Unlimited`
    : `${formatBytes(storageUsedBytes)} / ${storageLimitGB} GB`;

  // ── Upgrade / Downgrade ─────────────────────────────────────────────────────
  const handleUpgrade = async (paymentMethodId) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "change-subscription",
        {
          body: {
            tenantId: tenant.id,
            newPriceId: selectedPlan.stripePriceId,
            newPlan: selectedPlan.name,
            maxUsers: selectedPlan.limits.max_users,
            storageGb: selectedPlan.limits.storage_gb,
            mrr: selectedPlan.price,
            ...(paymentMethodId && { paymentMethodId }),
          },
        },
      );
      if (error)
        throw new Error(
          await parseEdgeFnError(error, "Failed to change plan."),
        );
      if (data?.error) throw new Error(data.error);
      message.success(`Successfully changed to ${selectedPlan.name} plan!`);
      setUpgradeModal(false);
      setSelectedPlan(null);
      fetchTenant();
    } catch (err) {
      message.error(err.message || "Failed to change plan.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Cancel ──────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "cancel-subscription",
        { body: { tenantId: tenant.id } },
      );
      if (error)
        throw new Error(await parseEdgeFnError(error, "Failed to cancel."));
      if (data?.error) throw new Error(data.error);
      message.success(
        "Subscription cancelled. Access continues until the billing period ends.",
      );
      setCancelModal(false);
      fetchTenant();
    } catch (err) {
      message.error(err.message || "Failed to cancel. Contact support.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reactivate (during active billing period) ───────────────────────────────
  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      // Calls Stripe: subscriptions.update({ cancel_at_period_end: false })
      const { data, error } = await supabase.functions.invoke(
        "reactivate-subscription",
        { body: { tenantId: tenant.id } },
      );
      if (error)
        throw new Error(await parseEdgeFnError(error, "Failed to reactivate."));
      if (data?.error) throw new Error(data.error);
      message.success("Subscription reactivated! Auto-renew is back on.");
      setReactivateModal(false);
      fetchTenant();
    } catch (err) {
      message.error(err.message || "Failed to reactivate. Contact support.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Auto-renew toggle ───────────────────────────────────────────────────────
  const handleAutoRenewToggle = async (checked) => {
    setAutoRenewLoading(true);
    try {
      // Calls Stripe: subscriptions.update({ cancel_at_period_end: !checked })
      const { data, error } = await supabase.functions.invoke(
        "toggle-auto-renew",
        { body: { tenantId: tenant.id, autoRenew: checked } },
      );
      if (error)
        throw new Error(
          await parseEdgeFnError(error, "Failed to update auto-renew."),
        );
      if (data?.error) throw new Error(data.error);
      message.success(
        checked
          ? "Auto-renew enabled. Your plan will renew automatically."
          : "Auto-renew disabled. Your plan will end on the billing date.",
      );
      // Optimistically update local state
      setTenant((prev) => ({ ...prev, auto_renew: checked }));
    } catch (err) {
      message.error(err.message || "Failed to update auto-renew.");
    } finally {
      setAutoRenewLoading(false);
    }
  };

  if (loadingTenant)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ReloadOutlined spin className="text-3xl text-slate-400 mb-3" />
          <p className="text-slate-400 text-sm">Loading subscription…</p>
        </div>
      </div>
    );

  return (
    <div
      className="min-h-screen p-6 sm:p-10"
      style={{
        background: "#f8fafc",
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Instrument Sans', system-ui, sans-serif; }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .sub-modal .ant-modal-content { border-radius: 20px !important; }
      `}</style>

      <div className="mx-auto">
        {/* Header */}
        <div
          className="mb-8"
          style={{ animation: mounted ? "slideUp 0.4s ease both" : "none" }}
        >
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
            Subscription & Billing
          </h1>
          <p className="text-slate-400 text-base">
            Manage your plan, usage, and billing.
          </p>
        </div>

        {/* ── Cancelled banner ──────────────────────────────────────────────── */}
        {isCancelled && (
          <div
            className="mb-6 rounded-2xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
            style={{ background: "#fef2f2", border: "1.5px solid #fca5a5" }}
          >
            <div className="flex items-center gap-3">
              <ExclamationCircleOutlined className="text-red-500 text-xl" />
              <div>
                <div className="font-bold text-red-700 text-sm">
                  Subscription cancelled
                </div>
                <div className="text-red-500 text-xs">
                  {periodEnd
                    ? `Your workspace remains active until ${formatDate(periodEnd)}${
                        daysLeft !== null
                          ? ` (${daysLeft} day${daysLeft !== 1 ? "s" : ""} left)`
                          : ""
                      }.`
                    : "Your workspace remains active until the end of the current billing period."}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Reactivate during billing period */}
              {periodEnd && daysLeft !== null && daysLeft > 0 && (
                <Button
                  onClick={() => setReactivateModal(true)}
                  icon={<PlayCircleOutlined />}
                  className="!rounded-xl !font-semibold !border-emerald-400 !text-emerald-600"
                >
                  Reactivate
                </Button>
              )}
              <Button
                onClick={() => setUpgradeModal(true)}
                type="primary"
                className="!rounded-xl !font-semibold !border-0"
                style={{ background: "#0f172a" }}
              >
                Change Plan
              </Button>
            </div>
          </div>
        )}

        {/* ── Auto-renew warning banner (if disabled but not cancelled) ──────── */}
        {!isCancelled && !autoRenew && currentPlan.price > 0 && (
          <div
            className="mb-6 rounded-2xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
            style={{ background: "#fffbeb", border: "1.5px solid #fcd34d" }}
          >
            <div className="flex items-center gap-3">
              <SyncOutlined className="text-amber-500 text-xl" />
              <div>
                <div className="font-bold text-amber-700 text-sm">
                  Auto-renew is off
                </div>
                <div className="text-amber-600 text-xs">
                  Your plan will expire on {formatDate(periodEnd)}
                  {daysLeft !== null
                    ? ` (${daysLeft} day${daysLeft !== 1 ? "s" : ""} left)`
                    : ""}
                  . Turn on auto-renew to avoid interruption.
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleAutoRenewToggle(true)}
              loading={autoRenewLoading}
              className="!rounded-xl !font-semibold !border-amber-400 !text-amber-700"
            >
              Enable Auto-Renew
            </Button>
          </div>
        )}

        {/* Stats row */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          style={{ animation: "slideUp 0.4s ease 0.08s both" }}
        >
          <StatCard
            icon={currentPlan.icon}
            label="Current Plan"
            value={tenant?.plan || "Free"}
            sub={
              currentPlan.price > 0
                ? `${currentPlan.priceLabel}/mo`
                : "No charge"
            }
            color={currentPlan.color}
          />
          <StatCard
            icon={<TeamOutlined />}
            label="Team Members"
            value={seatLabel}
            sub="seats used"
            color="#3b82f6"
          />
          <StatCard
            icon={<DatabaseOutlined />}
            label="Storage Used"
            value={
              loadingStorage ? "Calculating…" : formatBytes(storageUsedBytes)
            }
            sub={
              unlimitedStorage
                ? "Unlimited plan"
                : `of ${storageLimitGB} GB limit`
            }
            color="#10b981"
          />
          <StatCard
            icon={<CreditCardOutlined />}
            label="Monthly Cost"
            value={`$${tenant?.mrr ?? 0}`}
            sub="billed monthly"
            color="#f59e0b"
          />
        </div>

        {/* Current plan card */}
        <div
          className="bg-white rounded-2xl p-6 mb-6"
          style={{
            border: `2px solid ${currentPlan.color}40`,
            animation: "slideUp 0.4s ease 0.12s both",
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{
                  background: `${currentPlan.color}15`,
                  color: currentPlan.color,
                }}
              >
                {currentPlan.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl font-bold text-slate-900">
                    {tenant?.plan} Plan
                  </span>
                  <Tag
                    color={isCancelled ? "red" : autoRenew ? "green" : "orange"}
                    className="!rounded-full !text-[10px] !font-bold !uppercase"
                  >
                    {isCancelled
                      ? "cancelled"
                      : autoRenew
                        ? "active"
                        : "expires soon"}
                  </Tag>
                </div>
                <div className="text-slate-400 text-sm mt-0.5">
                  {currentPlan.tagline}
                  {currentPlan.price > 0 && (
                    <span className="ml-2 font-semibold text-slate-600">
                      · {currentPlan.priceLabel}/mo
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Auto-renew toggle — shown only on paid, non-cancelled plans */}
              {currentPlan.price > 0 && !isCancelled && (
                <Tooltip
                  title={
                    autoRenew
                      ? "Auto-renew is ON — your plan renews automatically each month"
                      : "Auto-renew is OFF — your plan will not renew"
                  }
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
                    style={{
                      background: "#f8fafc",
                      border: "1.5px solid #e2e8f0",
                    }}
                  >
                    <SyncOutlined
                      style={{ color: autoRenew ? "#10b981" : "#94a3b8" }}
                    />
                    <span className="text-slate-600 text-xs">Auto-renew</span>
                    <Switch
                      size="small"
                      checked={autoRenew}
                      loading={autoRenewLoading}
                      onChange={handleAutoRenewToggle}
                      style={{ background: autoRenew ? "#10b981" : "#cbd5e1" }}
                    />
                  </div>
                </Tooltip>
              )}

              {!isCancelled && (
                <>
                  <Button
                    onClick={() => setUpgradeModal(true)}
                    icon={<ArrowUpOutlined />}
                    className="!rounded-xl !font-semibold !border-slate-200"
                  >
                    Change Plan
                  </Button>
                  {currentPlan.price > 0 && (
                    <Button
                      onClick={() => setCancelModal(true)}
                      icon={<CloseCircleOutlined />}
                      danger
                      className="!rounded-xl !font-semibold"
                    >
                      Cancel Plan
                    </Button>
                  )}
                </>
              )}

              {isCancelled &&
                periodEnd &&
                daysLeft !== null &&
                daysLeft > 0 && (
                  <Button
                    onClick={() => setReactivateModal(true)}
                    icon={<PlayCircleOutlined />}
                    type="primary"
                    className="!rounded-xl !font-semibold !border-0"
                    style={{ background: "#10b981" }}
                  >
                    Reactivate
                  </Button>
                )}
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              What's included
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {currentPlan.features.map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-1.5 text-sm text-slate-600"
                >
                  <CheckOutlined
                    style={{ color: currentPlan.color, fontSize: 10 }}
                  />
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Billing info + Usage */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          style={{ animation: "slideUp 0.4s ease 0.16s both" }}
        >
          {/* Billing details */}
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1.5px solid #e2e8f0" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-slate-900 text-sm">
                Billing Details
              </div>
              <CalendarOutlined className="text-slate-400" />
            </div>
            <div className="space-y-3">
              {[
                { label: "Company", value: tenant?.name },
                { label: "Owner", value: tenant?.owner_name },
                { label: "Email", value: tenant?.owner_email },
                {
                  label: "Billing cycle",
                  value: currentPlan.price > 0 ? "Monthly" : "N/A",
                },
                {
                  label: "Auto-renew",
                  value:
                    currentPlan.price > 0
                      ? autoRenew
                        ? "Enabled"
                        : "Disabled"
                      : "N/A",
                  highlight:
                    currentPlan.price > 0
                      ? autoRenew
                        ? "green"
                        : "red"
                      : null,
                },
                {
                  label: isCancelled
                    ? "Access until"
                    : autoRenew
                      ? "Next renewal"
                      : "Plan expires",
                  value: periodEnd
                    ? formatDate(periodEnd)
                    : currentPlan.price > 0
                      ? "Auto-renews monthly"
                      : "—",
                  highlight:
                    periodEnd && daysLeft !== null && daysLeft <= 7
                      ? "red"
                      : null,
                  sub:
                    periodEnd && daysLeft !== null
                      ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`
                      : null,
                },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex justify-between text-sm items-start"
                >
                  <span className="text-slate-400">{r.label}</span>
                  <div className="text-right">
                    <span
                      className="font-medium text-right max-w-[220px] truncate block"
                      style={{
                        color:
                          r.highlight === "green"
                            ? "#10b981"
                            : r.highlight === "red"
                              ? "#ef4444"
                              : "#334155",
                      }}
                    >
                      {r.value || "—"}
                    </span>
                    {r.sub && (
                      <span className="text-[10px] text-slate-400">
                        {r.sub}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage overview */}
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1.5px solid #e2e8f0" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="font-bold text-slate-900 text-sm">
                Usage Overview
              </div>
              <div className="flex items-center gap-2">
                {loadingStorage && (
                  <ReloadOutlined spin className="text-slate-400 text-xs" />
                )}
                <InfoCircleOutlined className="text-slate-400" />
              </div>
            </div>
            <div className="space-y-5">
              {/* Seats */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Team seats</span>
                  <span
                    className="font-semibold"
                    style={{ color: seatDanger ? "#ef4444" : "#1e293b" }}
                  >
                    {seatLabel}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  {unlimitedSeats ? (
                    <div
                      className="h-full w-full rounded-full"
                      style={{ background: `${currentPlan.color}25` }}
                    />
                  ) : (
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${seatPercent}%`,
                        background: seatDanger ? "#ef4444" : currentPlan.color,
                      }}
                    />
                  )}
                </div>
                {unlimitedSeats && (
                  <div className="text-[10px] text-slate-400 mt-1">
                    Unlimited seats included in Enterprise
                  </div>
                )}
                {seatDanger && (
                  <div className="text-[10px] text-red-500 mt-1">
                    Approaching seat limit — consider upgrading
                  </div>
                )}
              </div>

              {/* Storage */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Storage</span>
                  <span
                    className="font-semibold"
                    style={{ color: storageDanger ? "#ef4444" : "#1e293b" }}
                  >
                    {loadingStorage ? "Calculating…" : storageLabel}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  {unlimitedStorage ? (
                    <div
                      className="h-full w-full rounded-full"
                      style={{ background: `${currentPlan.color}25` }}
                    />
                  ) : (
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${storagePercent}%`,
                        background: storageDanger
                          ? "#ef4444"
                          : currentPlan.color,
                      }}
                    />
                  )}
                </div>
                {unlimitedStorage && (
                  <div className="text-[10px] text-slate-400 mt-1">
                    Unlimited storage included in Enterprise
                  </div>
                )}
                {storageDanger && (
                  <div className="text-[10px] text-red-500 mt-1">
                    Approaching storage limit — consider upgrading
                  </div>
                )}
              </div>

              {/* Per-bucket breakdown */}
              {!loadingStorage &&
                storageData?.breakdown?.some((b) => b.bytes > 0) && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Storage breakdown
                    </div>
                    <div className="space-y-1.5">
                      {storageData.breakdown
                        .filter((b) => b.bytes > 0)
                        .sort((a, b) => b.bytes - a.bytes)
                        .map((b) => {
                          const labelMap = {
                            attachments: "Tickets",
                            meeting_recordings: "Meetings",
                            "recruitment-cvs": "Recruitment",
                            training_materials: "Training",
                            "chat-files": "Chat",
                            documents: "Documents",
                          };
                          return (
                            <div
                              key={b.bucket}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-slate-500">
                                {labelMap[b.bucket] || b.bucket}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-[10px]">
                                  {b.fileCount} file
                                  {b.fileCount !== 1 ? "s" : ""}
                                </span>
                                <span className="font-medium text-slate-700">
                                  {formatBytes(b.bytes)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

              {!loadingStorage &&
                storageData &&
                storageData.totalBytes === 0 && (
                  <div className="text-[10px] text-slate-400 italic">
                    No files found in storage buckets for this workspace.
                  </div>
                )}

              {tenant?.stripe_customer_id && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <SafetyCertificateOutlined /> Stripe ID:{" "}
                    <code className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 text-[10px]">
                      {tenant.stripe_customer_id}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Change Plan Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={upgradeModal}
        onCancel={() => {
          setUpgradeModal(false);
          setSelectedPlan(null);
        }}
        footer={null}
        width={880}
        centered
        className="sub-modal"
        title={
          <div>
            <div className="font-bold text-slate-900 text-lg">
              {selectedPlan
                ? `Switch to ${selectedPlan.name}`
                : "Choose a plan"}
            </div>
            <div className="text-slate-400 text-sm font-normal">
              {selectedPlan
                ? "Review and confirm your plan change."
                : "Select a plan to upgrade or downgrade."}
            </div>
          </div>
        }
      >
        {!selectedPlan ? (
          <div className="pt-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-2 mb-5">
              {PLANS.map((plan) => {
                const ci = getPlanIndex(tenant?.plan);
                const pi = getPlanIndex(plan.name);
                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    currentPlanName={tenant?.plan}
                    onSelect={setSelectedPlan}
                    isDowngrade={pi < ci}
                  />
                );
              })}
            </div>
            <p className="text-center text-slate-400 text-xs">
              Changes take effect immediately. Cancel anytime.
            </p>
          </div>
        ) : (
          <div className="pt-2">
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-sm text-slate-400 hover:text-slate-600 mb-5 flex items-center gap-1"
            >
              ← Back to plans
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Summary */}
              <div
                className="rounded-2xl p-5"
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}
              >
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  Change Summary
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="flex-1 rounded-xl p-3 text-center"
                    style={{
                      background: `${currentPlan.color}10`,
                      border: `1px solid ${currentPlan.color}25`,
                    }}
                  >
                    <div style={{ color: currentPlan.color }}>
                      {currentPlan.icon}
                    </div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {currentPlan.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {currentPlan.priceLabel}
                    </div>
                  </div>
                  <ArrowUpOutlined className="text-slate-400 flex-shrink-0" />
                  <div
                    className="flex-1 rounded-xl p-3 text-center"
                    style={{
                      background: `${selectedPlan.color}10`,
                      border: `2px solid ${selectedPlan.color}50`,
                    }}
                  >
                    <div style={{ color: selectedPlan.color }}>
                      {selectedPlan.icon}
                    </div>
                    <div className="font-bold text-slate-800 text-sm mt-1">
                      {selectedPlan.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {selectedPlan.priceLabel}
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    {
                      label: "New monthly cost",
                      value:
                        selectedPlan.price === 0
                          ? "Free"
                          : `${selectedPlan.priceLabel}/mo`,
                      green: selectedPlan.price < currentPlan.price,
                    },
                    {
                      label: "Max users",
                      value:
                        selectedPlan.limits.max_users != null
                          ? `${selectedPlan.limits.max_users} seats`
                          : "Unlimited",
                    },
                    {
                      label: "Storage",
                      value:
                        selectedPlan.limits.storage_gb != null
                          ? `${selectedPlan.limits.storage_gb} GB`
                          : "Unlimited",
                    },
                    { label: "Effective", value: "Immediately" },
                    {
                      label: "Next billing date",
                      value: periodEnd ? formatDate(periodEnd) : "—",
                    },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between text-sm">
                      <span className="text-slate-400">{r.label}</span>
                      <span
                        className="font-semibold"
                        style={{ color: r.green ? "#10b981" : "#1e293b" }}
                      >
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
                {isDowngrade && (
                  <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                    <ExclamationCircleOutlined className="mr-1.5" />
                    Downgrading reduces your seat limit to{" "}
                    {selectedPlan.limits.max_users ?? "unlimited"}. Ensure your
                    team size fits.
                  </div>
                )}
              </div>

              {/* Confirm / payment */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  {selectedPlan.price === 0 || hasStripe
                    ? "Confirm"
                    : "Payment Details"}
                </div>
                {selectedPlan.price === 0 || hasStripe ? (
                  <div>
                    <p className="text-sm text-slate-500 mb-5">
                      {selectedPlan.price === 0
                        ? "Switching to Free will cancel your Stripe subscription at the end of the current billing period."
                        : `Your saved payment method will be charged ${selectedPlan.priceLabel}/mo, prorated for the current period.`}
                    </p>
                    <Button
                      block
                      size="large"
                      loading={actionLoading}
                      onClick={() => handleUpgrade()}
                      className="!h-11 !font-semibold !rounded-xl !border-0"
                      style={{ background: selectedPlan.color, color: "#fff" }}
                    >
                      {isDowngrade ? "Confirm Downgrade" : "Confirm Upgrade"} →
                    </Button>
                  </div>
                ) : (
                  <Elements stripe={stripePromise}>
                    <NewCardForm
                      onTokenReady={(pmId) => handleUpgrade(pmId)}
                      loading={actionLoading}
                    />
                  </Elements>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Cancel Modal ──────────────────────────────────────────────────────── */}
      <Modal
        open={cancelModal}
        onCancel={() => setCancelModal(false)}
        footer={null}
        width={460}
        centered
        className="sub-modal"
        title={
          <div className="flex items-center gap-2 text-red-600">
            <ExclamationCircleOutlined />
            <span className="font-bold">Cancel Subscription</span>
          </div>
        }
      >
        <div className="py-2">
          <p className="text-slate-600 text-sm mb-4">
            Are you sure you want to cancel your <strong>{tenant?.plan}</strong>{" "}
            subscription? You'll keep full access until the end of the current
            billing period.
          </p>

          {periodEnd && (
            <div
              className="rounded-xl p-3 mb-4 flex items-center gap-3"
              style={{ background: "#f0fdf4", border: "1px solid #86efac" }}
            >
              <CalendarOutlined className="text-emerald-500 text-lg flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-emerald-700">
                  Access until {formatDate(periodEnd)}
                </div>
                <div className="text-[10px] text-emerald-600">
                  {daysLeft !== null
                    ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} of access remaining after cancellation`
                    : "Full access through the billing period"}
                </div>
              </div>
            </div>
          )}

          <div
            className="rounded-xl p-4 mb-5 text-sm space-y-2"
            style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}
          >
            {[
              "Access continues until billing period ends",
              "No refunds for unused time",
              "Data retained for 30 days after cancellation",
              "You can reactivate anytime before expiry",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2 text-red-600">
                <CloseCircleOutlined style={{ fontSize: 11 }} />
                {t}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              block
              onClick={() => setCancelModal(false)}
              className="!rounded-xl !font-semibold"
            >
              Keep Subscription
            </Button>
            <Button
              block
              danger
              loading={actionLoading}
              onClick={handleCancel}
              className="!rounded-xl !font-semibold"
            >
              Yes, Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Reactivate Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={reactivateModal}
        onCancel={() => setReactivateModal(false)}
        footer={null}
        width={440}
        centered
        className="sub-modal"
        title={
          <div className="flex items-center gap-2 text-emerald-600">
            <PlayCircleOutlined />
            <span className="font-bold">Reactivate Subscription</span>
          </div>
        }
      >
        <div className="py-2">
          <p className="text-slate-600 text-sm mb-4">
            Welcome back! Reactivating your <strong>{tenant?.plan}</strong> plan
            will re-enable auto-renewal. You won't be charged until your next
            billing date.
          </p>

          {periodEnd && (
            <div
              className="rounded-xl p-3 mb-4 flex items-center gap-3"
              style={{ background: "#f0fdf4", border: "1px solid #86efac" }}
            >
              <CalendarOutlined className="text-emerald-500 text-lg flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-emerald-700">
                  Next charge: {formatDate(periodEnd)}
                </div>
                <div className="text-[10px] text-emerald-600">
                  {currentPlan.priceLabel}/mo · {daysLeft} day
                  {daysLeft !== 1 ? "s" : ""} until renewal
                </div>
              </div>
            </div>
          )}

          <div
            className="rounded-xl p-4 mb-5 text-sm space-y-2"
            style={{ background: "#f0fdf4", border: "1px solid #86efac" }}
          >
            {[
              `Your ${tenant?.plan} plan benefits restore immediately`,
              "Auto-renew will be re-enabled",
              "No extra charges — billing continues as normal",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2 text-emerald-700">
                <CheckCircleFilled style={{ fontSize: 11 }} />
                {t}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              block
              onClick={() => setReactivateModal(false)}
              className="!rounded-xl !font-semibold"
            >
              Not Now
            </Button>
            <Button
              block
              loading={actionLoading}
              onClick={handleReactivate}
              className="!rounded-xl !font-semibold !border-0"
              style={{ background: "#10b981", color: "#fff" }}
            >
              Reactivate Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionManagement;
