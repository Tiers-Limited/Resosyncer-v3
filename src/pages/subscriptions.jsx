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
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PLAN_ICON_MAP = {
  Zap: <ThunderboltOutlined />,
  Rocket: <RocketOutlined />,
  Crown: <CrownOutlined />,
  ShieldCheck: <SafetyCertificateOutlined />,
  Star: <StarFilled style={{ fontSize: 14 }} />,
  Sparkles: <ThunderboltOutlined />,
};
const PLAN_FALLBACK = {
  id: "free",
  name: "Free",
  price: 0,
  monthlyPrice: 0,
  yearlyPrice: 0,
  priceLabel: "$0",
  period: "forever",
  periodYearly: "forever",
  tagline: "Try before you commit",
  icon: <ThunderboltOutlined />,
  color: "#64748b",
  features: ["Basic access"],
  limits: { max_users: 5 },
  stripePriceId: null,
  stripeMonthlyPriceId: null,
  stripeYearlyPriceId: null,
};
const EUROPE_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","NO","CH","IS",
  "LI","GB","UK","AL","AD","AM","AZ","BA","BY","GE","GI","IM","JE","XK","MD",
  "MC","ME","MK","RS","SM","TR","UA","VA",
]);

const detectPricingRegion = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.startsWith("Europe/")) return "EUROPE";
  } catch {}
  try {
    const locale = (navigator.language || "").toUpperCase();
    const country = locale.split("-")[1];
    if (country && EUROPE_COUNTRIES.has(country)) return "EUROPE";
  } catch {}
  return "GLOBAL";
};

const formatMoney = (amount, currency = "USD") => {
  const numeric = Number(amount || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: String(currency || "USD").toUpperCase(),
      maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    }).format(numeric);
  } catch {
    return `${currency} ${numeric}`;
  }
};

const buildRegionalMap = (rows) =>
  (rows || []).reduce((acc, r) => {
    const pid = r.plan_id;
    const cycle = String(r.billing_cycle || "monthly").toLowerCase();
    const rawRegion = String(r.region || "GLOBAL").toUpperCase();
    const region =
      rawRegion === "EU"
        ? "EUROPE"
        : rawRegion === "US" || rawRegion === "WORLD"
          ? "GLOBAL"
          : rawRegion;
    if (!acc[pid]) acc[pid] = {};
    if (!acc[pid][cycle]) acc[pid][cycle] = {};
    acc[pid][cycle][region] = r;
    return acc;
  }, {});

const getFeatureText = (feature) => {
  if (typeof feature === "string") return feature.trim();
  if (
    feature &&
    typeof feature === "object" &&
    typeof feature.text === "string"
  ) {
    return feature.text.trim();
  }
  return "";
};

const adaptPlan = (row, regionMap = {}, userRegion = "GLOBAL") => {
  const monthlyPrice = row.monthly_price ?? row.price ?? 0;
  const yearlyPrice =
    row.yearly_price ?? (monthlyPrice > 0 ? Number(monthlyPrice) * 12 : 0);
  const planRegion = regionMap[row.id] || {};
  const monthlyByRegion = planRegion.monthly || {};
  const yearlyByRegion = planRegion.yearly || {};
  const selectedMonthlyRegion =
    monthlyByRegion[userRegion] || monthlyByRegion.GLOBAL || monthlyByRegion.EUROPE;
  const selectedYearlyRegion =
    yearlyByRegion[userRegion] || yearlyByRegion.GLOBAL || yearlyByRegion.EUROPE;
  const regionCurrency = selectedMonthlyRegion?.currency || "USD";
  const yearlyCurrency = selectedYearlyRegion?.currency || regionCurrency;
  const regionPrice =
    selectedMonthlyRegion?.price != null
      ? Number(selectedMonthlyRegion.price)
      : Number(monthlyPrice || 0);
  const yearlyRegionPrice =
    selectedYearlyRegion?.price != null
      ? Number(selectedYearlyRegion.price)
      : Number(yearlyPrice || 0);

  return {
    id: row.id,
    name: row.name,
    price: regionPrice,
    monthlyPrice,
    yearlyPrice,
    priceLabel: formatMoney(regionPrice, regionCurrency),
    period: Number(monthlyPrice) === 0 ? "forever" : "/mo",
    periodYearly: Number(yearlyPrice) === 0 ? "forever" : "/mo billed yearly",
    tagline: row.tagline ?? "",
    icon: PLAN_ICON_MAP[row.icon] ?? <ThunderboltOutlined />,
    color: row.color ?? "#64748b",
    popular: row.popular ?? false,
    contactForPricing: !!row.contact_for_pricing,
    features: Array.isArray(row.features)
      ? row.features
          .map(getFeatureText)
          .filter((f) => f && !/storage/i.test(f))
      : [],
    limits: {
      max_users: row.max_users ?? null,
    },
    stripePriceId:
      selectedMonthlyRegion?.stripe_price_id ??
      row.stripe_monthly_price_id ??
      row.stripe_price_id ??
      null,
    stripeMonthlyPriceId:
      selectedMonthlyRegion?.stripe_price_id ??
      row.stripe_monthly_price_id ??
      row.stripe_price_id ??
      null,
    stripeYearlyPriceId:
      selectedYearlyRegion?.stripe_price_id ??
      row.stripe_yearly_price_id ??
      null,
    monthlyDisplayPrice: regionPrice,
    yearlyDisplayPrice: yearlyRegionPrice,
    yearlyDisplayLabel: formatMoney(yearlyRegionPrice, yearlyCurrency),
    currency: regionCurrency,
    currencyYearly: yearlyCurrency,
  };
};

const planForCycle = (plan, cycle = "monthly") => {
  if (!plan) return plan;
  if (cycle === "yearly") {
    return {
      ...plan,
      billingCycle: "yearly",
      price: Number(plan.yearlyDisplayPrice ?? plan.yearlyPrice ?? plan.price ?? 0),
      priceLabel:
        plan.yearlyDisplayLabel ??
        formatMoney(plan.yearlyPrice ?? plan.price, plan.currencyYearly || plan.currency),
      period: plan.periodYearly || "/mo billed yearly",
      stripePriceId:
        plan.stripeYearlyPriceId || plan.stripeMonthlyPriceId || plan.stripePriceId,
      currency: plan.currencyYearly || plan.currency,
    };
  }
  return {
    ...plan,
    billingCycle: "monthly",
    price: Number(plan.monthlyDisplayPrice ?? plan.monthlyPrice ?? plan.price ?? 0),
    priceLabel: formatMoney(
      plan.monthlyDisplayPrice ?? plan.monthlyPrice ?? plan.price,
      plan.currency || "USD",
    ),
    period: Number(plan.monthlyDisplayPrice ?? plan.monthlyPrice ?? 0) === 0 ? "forever" : "/mo",
    stripePriceId: plan.stripeMonthlyPriceId || plan.stripePriceId,
    currency: plan.currency || "USD",
  };
};

const normalizeBillingCycle = (value) => {
  const raw = String(value || "").toLowerCase();
  if (["yearly", "annual", "annually", "year"].includes(raw)) return "yearly";
  return "monthly";
};

const parseDateValue = (value) => {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "number") {
    const ms = value > 1e12 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric) && String(value).trim() !== "") {
    const ms = numeric > 1e12 ? numeric : numeric * 1000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const addBillingCycle = (date, cycle = "monthly") => {
  if (!date) return null;
  const next = new Date(date);
  if (normalizeBillingCycle(cycle) === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return Number.isNaN(next.getTime()) ? null : next;
};

const formatDate = (dateStr) => {
  const parsed = parseDateValue(dateStr);
  if (!parsed) return "�";
  try {
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "�";
  }
};

const getDaysLeft = (dateStr) => {
  const parsed = parseDateValue(dateStr);
  if (!parsed) return null;
  const diff = parsed - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const getIsDarkTheme = () => {
  if (typeof window === "undefined") return false;
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
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
const NewCardForm = ({ onTokenReady, loading, dark = false }) => {
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
      <div
        className="rounded-xl border px-4 py-3 mb-2"
        style={{
          borderColor: dark ? "#2b2f38" : "#e2e8f0",
          background: dark ? "#1b1c21" : "#f8fafc",
        }}
      >
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "15px",
                color: dark ? "#e5e7eb" : "#1e293b",
                fontFamily: "inherit",
                "::placeholder": { color: dark ? "#6b7280" : "#94a3b8" },
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
const StatCard = ({ icon, label, value, sub, color = "#6366f1", dark = false }) => (
  <div
    className="rounded-2xl p-5 flex items-center gap-4"
    style={{
      background: dark ? "#16171b" : "#fff",
      border: `1.5px solid ${dark ? "#2b2f38" : "#e2e8f0"}`,
    }}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
      style={{ background: `${color}15`, color }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div
        className="text-xs mb-0.5"
        style={{ color: dark ? "#9ca3af" : "#94a3b8" }}
      >
        {label}
      </div>
      <div
        className="font-bold text-lg leading-tight truncate"
        style={{ color: dark ? "#f3f4f6" : "#0f172a" }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="text-xs mt-0.5"
          style={{ color: dark ? "#9ca3af" : "#94a3b8" }}
        >
          {sub}
        </div>
      )}
    </div>
  </div>
);

// ─── Plan card ────────────────────────────────────────────────────────────────
const PlanCard = ({
  plan,
  currentPlanName,
  currentPlanCycle = "monthly",
  onSelect,
  isDowngrade,
  dark = false,
}) => {
  const nameMatches = plan.name.toLowerCase() === currentPlanName?.toLowerCase();
  const cycleMatches =
    normalizeBillingCycle(plan.billingCycle) ===
    normalizeBillingCycle(currentPlanCycle);
  const isCurrent = nameMatches && (Number(plan.price || 0) === 0 || cycleMatches);
  return (
    <div
      onClick={() => {
        if (isCurrent) return;
        if (plan.contactForPricing) {
          window.location.href = "mailto:sales@resosyncer.com";
          return;
        }
        onSelect(plan);
      }}
      className="relative flex flex-col rounded-2xl transition-all duration-200"
      style={{
        background: isCurrent
          ? dark
            ? "rgba(16,185,129,0.16)"
            : "#f0fdf4"
          : plan.popular
            ? dark
              ? "rgba(139,92,246,0.14)"
              : "#faf5ff"
            : dark
              ? "#16171b"
              : "#fff",
        border: isCurrent
          ? "2px solid #10b981"
          : plan.popular
            ? "2px solid #8b5cf6"
            : `1.5px solid ${dark ? "#2b2f38" : "#e2e8f0"}`,
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
            <div
              className="font-bold text-sm"
              style={{ color: dark ? "#f3f4f6" : "#0f172a" }}
            >
              {plan.name}
            </div>
            <div className="text-xs" style={{ color: dark ? "#9ca3af" : "#94a3b8" }}>
              {plan.tagline}
            </div>
          </div>
        </div>
        <div className="mb-3">
          {plan.contactForPricing ? (
            <span
              className="text-3xl font-black"
              style={{ color: dark ? "#f3f4f6" : "#0f172a" }}
            >
              Contact Us
            </span>
          ) : (
            <>
              <span
                className="text-3xl font-black"
                style={{ color: dark ? "#f3f4f6" : "#0f172a" }}
              >
                {plan.priceLabel}
              </span>
              <span className="text-xs ml-1" style={{ color: dark ? "#9ca3af" : "#94a3b8" }}>
                {plan.period}
              </span>
            </>
          )}
        </div>
        <div
          className="h-px mb-3"
          style={{ background: dark ? "#2b2f38" : "#f1f5f9" }}
        />
        <ul className="flex flex-col gap-1.5 flex-1 mb-4">
          {plan.features.slice(0, 4).map((f, idx) => (
            <li
              key={`${f}-${idx}`}
              className="flex items-center gap-2 text-xs"
              style={{ color: dark ? "#d1d5db" : "#475569" }}
            >
              <CheckOutlined style={{ color: plan.color, fontSize: 9 }} />
              {f}
            </li>
          ))}
          {plan.features.length > 4 && (
            <li className="text-xs" style={{ color: dark ? "#9ca3af" : "#94a3b8" }}>
              +{plan.features.length - 4} more
            </li>
          )}
        </ul>
        {isCurrent ? (
          <div
            className="w-full py-2.5 rounded-xl text-xs font-bold text-center"
            style={{
              background: dark ? "rgba(16,185,129,0.15)" : "#ecfdf5",
              color: "#10b981",
            }}
          >
            Active Plan
          </div>
        ) : plan.contactForPricing ? (
          <div
            className="w-full py-2.5 rounded-xl text-xs font-bold text-center"
            style={{
              background: `${plan.color}12`,
              color: plan.color,
              border: `1.5px solid ${plan.color}30`,
            }}
          >
            Contact Us
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
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(getIsDarkTheme);
  const [tenant, setTenant] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [reactivateModal, setReactivateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [actionLoading, setActionLoading] = useState(false);
  const [autoRenewLoading, setAutoRenewLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [liveUserCount, setLiveUserCount] = useState(null);

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

  useEffect(() => {
    fetchPlans();
    if (user?.id || profile?.tenant_id) {
      fetchTenant();
    }
    setTimeout(() => setMounted(true), 30);
  }, [user?.id, profile?.tenant_id]);

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const userRegion = detectPricingRegion();
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      const planIds = (data || []).map((p) => p.id).filter(Boolean);
      let regionMap = {};
      if (planIds.length) {
        const { data: regionRows, error: regionErr } = await supabase
          .from("plan_region_prices")
          .select("plan_id, billing_cycle, region, currency, price, stripe_price_id")
          .in("plan_id", planIds);
        if (!regionErr) regionMap = buildRegionalMap(regionRows);
      }
      const nextPlans = (data || [])
        .map((row) => adaptPlan(row, regionMap, userRegion))
        .sort((a, b) => {
          const aUsers =
            a?.limits?.max_users == null
              ? Number.MAX_SAFE_INTEGER
              : Number(a.limits.max_users);
          const bUsers =
            b?.limits?.max_users == null
              ? Number.MAX_SAFE_INTEGER
              : Number(b.limits.max_users);
          if (aUsers !== bUsers) return aUsers - bUsers;
          return Number(a.monthlyPrice || 0) - Number(b.monthlyPrice || 0);
        });
      setPlans(nextPlans);
    } catch (error) {
      console.error("Failed to load plans:", error);
      message.error("Failed to load plans.");
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchTenant = async () => {
    setLoadingTenant(true);
    try {
      let tenantData = null;
      let resolvedProfile = profile || null;

      if (!resolvedProfile && user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        resolvedProfile = profileData;
      }

      if (resolvedProfile?.tenant_id) {
        const { data, error } = await supabase
          .from("tenants")
          .select("*")
          .eq("id", resolvedProfile?.tenant_id)
          .maybeSingle();
        if (error) throw error;
        tenantData = data;
      }

      if (!tenantData) {
        throw new Error("Tenant subscription not found for this admin.");
      }

      setTenant(tenantData);
      fetchLiveUserCount(tenantData.id);
    } catch (error) {
      console.error("Failed to load subscription info:", error);
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

  const currentPlanBase =
    plans.find((p) => p.name.toLowerCase() === tenant?.plan?.toLowerCase()) ||
    PLAN_FALLBACK;
  const inferTenantBillingCycle = () => {
    const explicitCycle =
      tenant?.billing_cycle || tenant?.plan_interval || tenant?.subscription_interval;
    if (explicitCycle) return normalizeBillingCycle(explicitCycle);

    if (tenant?.stripe_price_id) {
      if (tenant.stripe_price_id === currentPlanBase?.stripeYearlyPriceId) return "yearly";
      if (tenant.stripe_price_id === currentPlanBase?.stripeMonthlyPriceId) return "monthly";
    }

    const mrr = Number(tenant?.mrr);
    const monthly = Number(currentPlanBase?.monthlyDisplayPrice ?? currentPlanBase?.monthlyPrice);
    const yearly = Number(currentPlanBase?.yearlyDisplayPrice ?? currentPlanBase?.yearlyPrice);
    if (!Number.isNaN(mrr) && !Number.isNaN(monthly) && !Number.isNaN(yearly)) {
      const distMonthly = Math.abs(mrr - monthly);
      const distYearly = Math.abs(mrr - yearly);
      return distYearly < distMonthly ? "yearly" : "monthly";
    }
    return "monthly";
  };
  const currentBillingCycle = inferTenantBillingCycle();
  const currentPlan = planForCycle(currentPlanBase, currentBillingCycle);
  const getPlanIndex = (name) =>
    plans.findIndex((p) => p.name.toLowerCase() === name?.toLowerCase());
  const isDowngrade =
    getPlanIndex(selectedPlan?.name) < getPlanIndex(tenant?.plan);
  const hasStripe = !!tenant?.stripe_customer_id;
  const hasStripeSubscription = !!tenant?.stripe_subscription_id;
  const currentCycleLabel =
    currentBillingCycle === "yearly" ? "Yearly" : "Monthly";

  // ── Dates ───────────────────────────────────────────────────────────────────
  // tenant.current_period_end should be stored as ISO string from Stripe webhook
  const periodEnd =
    tenant?.current_period_end ??
    tenant?.subscription_end_date ??
    tenant?.subscription_end ??
    tenant?.renewal_date ??
    tenant?.next_billing_date ??
    tenant?.trial_ends_at ??
    null;
  const renewalEstimateBase =
    tenant?.current_period_start ??
    tenant?.subscription_start_date ??
    tenant?.subscription_started_at ??
    tenant?.trial_ends_at ??
    tenant?.updated_at ??
    tenant?.created_at ??
    null;
  const estimatedPeriodEnd = addBillingCycle(
    parseDateValue(renewalEstimateBase),
    currentBillingCycle,
  );
  const periodEndDate = parseDateValue(periodEnd);
  const displayPeriodEnd = parseDateValue(periodEnd) || estimatedPeriodEnd;
  const daysLeft = getDaysLeft(displayPeriodEnd);
  const isPeriodEndInPast =
    !!periodEndDate && periodEndDate.getTime() < Date.now();
  const isCancelled = tenant?.status === "cancelled";
  const tenantStatus = String(tenant?.status || "").toLowerCase();
  const isPlanOverride = tenant?.plan_override === true;
  const autoRenew = tenant?.auto_renew !== false; // default true if not set
  const isCancellationScheduled =
    !isPlanOverride &&
    (isCancelled ||
    (currentPlan.price > 0 &&
      !autoRenew &&
      !!displayPeriodEnd &&
      (daysLeft === null || daysLeft > 0)));
  const canReactivate =
    !isPlanOverride &&
    hasStripeSubscription &&
    (isCancellationScheduled ||
      ["cancelled", "expired", "inactive", "suspended", "past_due", "unpaid"].includes(tenantStatus));

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get("action");
    if (!action) return;

    if (action === "upgrade") {
      openChangePlanModal();
      navigate("/subscription", { replace: true });
      return;
    }

    if (action === "reactivate") {
      if (!isPlanOverride && hasStripeSubscription) {
        setReactivateModal(true);
      } else {
        message.info("Reactivation is unavailable for this workspace. Please choose a plan to continue.");
        openChangePlanModal();
      }
      navigate("/subscription", { replace: true });
    }
  }, [location.search, navigate, isPlanOverride, hasStripeSubscription]);

  const openChangePlanModal = () => {
    setBillingCycle(currentBillingCycle);
    setSelectedPlan(null);
    setUpgradeModal(true);
  };

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
      const knownEnd =
        periodEnd ??
        data?.current_period_end ??
        data?.subscription_end_date ??
        tenant?.current_period_end ??
        tenant?.subscription_end_date ??
        tenant?.subscription_end ??
        null;
      const baseSyncPayload = {
        auto_renew: false,
        ...(knownEnd ? { subscription_end_date: knownEnd } : {}),
        updated_at: new Date().toISOString(),
      };
      let syncedTenant = null;
      let tenantSyncError = null;

      // Try preferred status first.
      ({
        data: syncedTenant,
        error: tenantSyncError,
      } = await supabase
        .from("tenants")
        .update({
          ...baseSyncPayload,
          status: "cancelled",
        })
        .eq("id", tenant.id)
        .select("id, status, auto_renew, subscription_end_date, current_period_end")
        .maybeSingle());

      // Fallback: some workspaces still enforce tenants_status_check without "cancelled".
      if (tenantSyncError) {
        console.warn(
          "Tenant status 'cancelled' rejected, falling back to auto_renew/subscription_end sync:",
          tenantSyncError,
        );
        ({
          data: syncedTenant,
          error: tenantSyncError,
        } = await supabase
          .from("tenants")
          .update(baseSyncPayload)
          .eq("id", tenant.id)
          .select("id, status, auto_renew, subscription_end_date, current_period_end")
          .maybeSingle());
      }

      if (tenantSyncError) {
        console.error("Failed to persist cancellation on tenant row:", tenantSyncError);
        setTenant((prev) => ({
          ...(prev || {}),
          auto_renew: false,
          ...(knownEnd ? { subscription_end_date: knownEnd } : {}),
          status: prev?.status || "active",
        }));
        message.info(
          "Cancellation is confirmed in Stripe. Local DB status will sync automatically.",
        );
      } else if (syncedTenant) {
        setTenant((prev) => ({ ...(prev || {}), ...syncedTenant }));
      }
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
      await fetchTenant();
      window.location.reload();
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

  if (loadingTenant || plansLoading)
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
        style={{ background: dark ? "#101114" : "transparent" }}
      >
        <div className="text-center">
          <ReloadOutlined
            spin
            className="text-3xl mb-3"
            style={{ color: dark ? "#9ca3af" : "#94a3b8" }}
          />
          <p className="text-sm" style={{ color: dark ? "#9ca3af" : "#94a3b8" }}>
            Loading subscription...
          </p>
        </div>
      </div>
    );

  return (
    <div
      className={`min-h-screen p-6 sm:p-10 ${dark ? "sub-dark" : ""}`}
      style={{
        background: dark ? "#141416" : "#f8fafc",
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Instrument Sans', system-ui, sans-serif; }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .sub-modal .ant-modal-content { border-radius: 20px !important; }
        .sub-dark .bg-white { background-color: #16171b !important; }
        .sub-dark .bg-slate-50 { background-color: #1b1c21 !important; }
        .sub-dark .bg-slate-100 { background-color: #252830 !important; }
        .sub-dark .border-slate-100,
        .sub-dark .border-slate-200 { border-color: #2b2f38 !important; }
        .sub-dark .text-slate-900,
        .sub-dark .text-slate-800,
        .sub-dark .text-slate-700 { color: #f3f4f6 !important; }
        .sub-dark .text-slate-600,
        .sub-dark .text-slate-500 { color: #d1d5db !important; }
        .sub-dark .text-slate-400 { color: #9ca3af !important; }
        .sub-dark-modal .ant-modal-content {
          background: #16171b !important;
          border: 1.5px solid #2b2f38 !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45) !important;
        }
        .sub-dark-modal .ant-modal-header { background: transparent !important; }
        .sub-dark-modal .ant-modal-title { color: #f3f4f6 !important; }
        .sub-dark-modal .ant-modal-close { color: #9ca3af !important; }
        .sub-dark-modal .ant-modal-close:hover { color: #f3f4f6 !important; }
        .sub-dark-modal .ant-modal-body { color: #d1d5db !important; }
        .sub-dark-modal .bg-white { background-color: #16171b !important; }
        .sub-dark-modal .bg-slate-50 { background-color: #1b1c21 !important; }
        .sub-dark-modal .bg-slate-100 { background-color: #252830 !important; }
        .sub-dark-modal .border-slate-100,
        .sub-dark-modal .border-slate-200 { border-color: #2b2f38 !important; }
        .sub-dark-modal .text-slate-900,
        .sub-dark-modal .text-slate-800,
        .sub-dark-modal .text-slate-700 { color: #f3f4f6 !important; }
        .sub-dark-modal .text-slate-600,
        .sub-dark-modal .text-slate-500 { color: #d1d5db !important; }
        .sub-dark-modal .text-slate-400 { color: #9ca3af !important; }
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
        {isCancellationScheduled && (
          <div
            className="mb-6 rounded-2xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
            style={{
              background: dark
                ? "linear-gradient(135deg, rgba(127,29,29,0.26), rgba(69,10,10,0.2))"
                : "#fef2f2",
              border: `1.5px solid ${dark ? "#7f1d1d" : "#fca5a5"}`,
              boxShadow: dark ? "0 10px 24px rgba(0,0,0,0.25)" : "none",
            }}
          >
            <div className="flex items-center gap-3">
              <ExclamationCircleOutlined
                className="text-xl"
                style={{ color: dark ? "#f87171" : "#ef4444" }}
              />
              <div>
                <div
                  className="font-bold text-sm"
                  style={{ color: dark ? "#fecaca" : "#b91c1c" }}
                >
                  Subscription cancelled
                </div>
                <div className="text-xs" style={{ color: dark ? "#fca5a5" : "#ef4444" }}>
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
                  style={
                    dark
                      ? {
                          background: "rgba(16,185,129,0.12)",
                          borderColor: "#10b981",
                          color: "#34d399",
                        }
                      : undefined
                  }
                >
                  Reactivate
                </Button>
              )}
              <Button
                onClick={openChangePlanModal}
                type="primary"
                className="!rounded-xl !font-semibold !border-0"
                style={
                  dark
                    ? {
                        background: "#111827",
                        border: "1px solid #334155",
                        color: "#e5e7eb",
                      }
                    : { background: "#0f172a" }
                }
              >
                Change Plan
              </Button>
            </div>
          </div>
        )}

        {/* ── Auto-renew warning banner (if disabled but not cancelled) ──────── */}
        {!isCancellationScheduled && !autoRenew && currentPlan.price > 0 && (
          <div
            className="mb-6 rounded-2xl px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
            style={{
              background: dark
                ? "linear-gradient(135deg, rgba(120,53,15,0.25), rgba(69,26,3,0.2))"
                : "#fffbeb",
              border: `1.5px solid ${dark ? "#92400e" : "#fcd34d"}`,
              boxShadow: dark ? "0 10px 24px rgba(0,0,0,0.2)" : "none",
            }}
          >
            <div className="flex items-center gap-3">
              <SyncOutlined
                className="text-xl"
                style={{ color: dark ? "#fbbf24" : "#f59e0b" }}
              />
              <div>
                <div
                  className="font-bold text-sm"
                  style={{ color: dark ? "#fde68a" : "#b45309" }}
                >
                  Auto-renew is off
                </div>
                <div className="text-xs" style={{ color: dark ? "#fcd34d" : "#d97706" }}>
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
              style={
                dark
                  ? {
                      background: "rgba(251,191,36,0.12)",
                      borderColor: "#f59e0b",
                      color: "#fcd34d",
                    }
                  : undefined
              }
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
                ? `${currentPlan.priceLabel} ${currentPlan.period}`
                : "No charge"
            }
            color={currentPlan.color}
            dark={dark}
          />
          <StatCard
            icon={<TeamOutlined />}
            label="Team Members"
            value={seatLabel}
            sub="seats used"
            color="#3b82f6"
            dark={dark}
          />
          <StatCard
            icon={<CalendarOutlined />}
            label="Renewal"
            value={
              isPlanOverride
                ? "Free Granted"
                : displayPeriodEnd
                  ? formatDate(displayPeriodEnd)
                  : currentPlan.price > 0
                    ? "Not available"
                    : "-"
            }
            sub={
              isPlanOverride
                ? "plan override active"
                : isCancellationScheduled
                  ? "access end date"
                  : periodEnd
                    ? "next billing date"
                    : displayPeriodEnd
                      ? "estimated next billing date"
                      : "next billing date"
            }
            color="#10b981"
            dark={dark}
          />
          <StatCard
            icon={<CreditCardOutlined />}
            label="Monthly Cost"
            value={isPlanOverride ? "Free Granted" : `$${tenant?.mrr ?? 0}`}
            sub={
              isPlanOverride
                ? "no billing while override is active"
                : currentBillingCycle === "yearly"
                  ? "billed yearly"
                  : "billed monthly"
            }
            color="#f59e0b"
            dark={dark}
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
                    color={
                      isCancellationScheduled
                        ? "red"
                        : autoRenew
                          ? "green"
                          : "orange"
                    }
                    className="!rounded-full !text-[10px] !font-bold !uppercase"
                  >
                    {isCancellationScheduled
                      ? "cancelled"
                      : autoRenew
                        ? "active"
                        : ""}
                  </Tag>
                </div>
                <div className="text-slate-400 text-sm mt-0.5">
                  {currentPlan.tagline}
                  {currentPlan.price > 0 && (
                    <span className="ml-2 font-semibold text-slate-600">
                      · {currentPlan.priceLabel} {currentPlan.period}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Auto-renew toggle — shown only on paid, non-cancelled plans */}
              {currentPlan.price > 0 && !isCancellationScheduled && (
                <Tooltip
                  title={
                    autoRenew
                      ? `Auto-renew is ON — your plan renews automatically each ${
                          currentBillingCycle === "yearly" ? "year" : "month"
                        }`
                      : "Auto-renew is OFF — your plan will not renew"
                  }
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
                    style={{
                      background: dark ? "#1b1c21" : "#f8fafc",
                      border: `1.5px solid ${dark ? "#2b2f38" : "#e2e8f0"}`,
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

              {!isCancellationScheduled && (
                <>
                  <Button
                    onClick={openChangePlanModal}
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

              {canReactivate && (
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
              {currentPlan.features.map((f, idx) => (
                <span
                  key={`${f}-${idx}`}
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
            style={{ border: `1.5px solid ${dark ? "#2b2f38" : "#e2e8f0"}` }}
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
                  value: isPlanOverride
                    ? "Free Granted"
                    : currentPlan.price > 0
                      ? currentCycleLabel
                      : "N/A",
                },
                {
                  label: "Auto-renew",
                  value: isPlanOverride
                    ? "Free Granted"
                    : currentPlan.price > 0
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
                  label: isCancellationScheduled
                    ? "Access until"
                    : autoRenew
                      ? "Next renewal"
                      : "Plan expires",
                  value: isPlanOverride
                    ? "Free Granted"
                    : periodEnd
                      ? formatDate(periodEnd)
                      : currentPlan.price > 0
                        ? displayPeriodEnd
                          ? formatDate(displayPeriodEnd)
                          : `Auto-renews ${currentBillingCycle}`
                        : "—",
                  highlight:
                    !isPlanOverride && periodEnd && daysLeft !== null && daysLeft <= 7
                      ? "red"
                      : null,
                  sub:
                    !isPlanOverride && periodEnd && daysLeft !== null
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
                              : dark
                                ? "#e5e7eb"
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
            style={{ border: `1.5px solid ${dark ? "#2b2f38" : "#e2e8f0"}` }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="font-bold text-slate-900 text-sm">
                Usage Overview
              </div>
              <InfoCircleOutlined className="text-slate-400" />
            </div>
            <div className="space-y-5">
              {/* Seats */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Team seats</span>
                  <span
                    className="font-semibold"
                    style={{
                      color: seatDanger ? "#ef4444" : dark ? "#e5e7eb" : "#1e293b",
                    }}
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
        className={`sub-modal ${dark ? "sub-dark-modal" : ""}`}
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
            <div className="flex items-center justify-center mb-4">
              <div
                className="inline-flex rounded-xl p-1"
                style={{
                  background: dark ? "#1b1c21" : "#f1f5f9",
                  border: `1px solid ${dark ? "#2b2f38" : "#e2e8f0"}`,
                }}
              >
                {[
                  { key: "monthly", label: "Monthly" },
                  { key: "yearly", label: "Yearly" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setBillingCycle(opt.key);
                      setSelectedPlan(null);
                    }}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background:
                        billingCycle === opt.key ? "#0f172a" : "transparent",
                      color: billingCycle === opt.key ? "#fff" : "#64748b",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-2 mb-5">
              {plans.map((plan) => {
                const planView = planForCycle(plan, billingCycle);
                const ci = getPlanIndex(tenant?.plan);
                const pi = getPlanIndex(plan.name);
                return (
                  <PlanCard
                    key={plan.id}
                    plan={planView}
                    currentPlanName={tenant?.plan}
                    currentPlanCycle={currentBillingCycle}
                    onSelect={setSelectedPlan}
                    isDowngrade={pi < ci}
                    dark={dark}
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
                style={{
                  background: dark ? "#1b1c21" : "#f8fafc",
                  border: `1.5px solid ${dark ? "#2b2f38" : "#e2e8f0"}`,
                }}
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
                      label: "New plan cost",
                      value:
                        selectedPlan.price === 0
                          ? "Free"
                          : `${selectedPlan.priceLabel} ${selectedPlan.period}`,
                      green: selectedPlan.price < currentPlan.price,
                    },
                    {
                      label: "Max users",
                      value:
                        selectedPlan.limits.max_users != null
                          ? `${selectedPlan.limits.max_users} seats`
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
                        style={{
                          color: r.green ? "#10b981" : dark ? "#e5e7eb" : "#1e293b",
                        }}
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
                        : `Your saved payment method will be charged ${selectedPlan.priceLabel} ${selectedPlan.period}, prorated for the current period.`}
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
                      dark={dark}
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
        className={`sub-modal ${dark ? "sub-dark-modal" : ""}`}
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
        className={`sub-modal ${dark ? "sub-dark-modal" : ""}`}
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
                  {isPeriodEndInPast
                    ? "Next charge date is syncing from Stripe"
                    : `Next charge: ${formatDate(periodEnd)}`}
                </div>
                <div className="text-[10px] text-emerald-600">
                  {isPeriodEndInPast
                    ? "Your subscription was reactivated. Refreshing billing cycle details..."
                    : `${currentPlan.priceLabel} ${currentPlan.period} · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} until renewal`}
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



