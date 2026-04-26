import { useState, useEffect } from "react";
import { Form, Input, Button, Select, message, Spin } from "antd";
import {
  UserOutlined,
  LockOutlined,
  BankOutlined,
  GlobalOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  StarFilled,
  TagOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getData as getCountryData } from "country-list";
import { supabase } from "../lib/supabase";
import { buildRyzentEmail } from "../lib/emailTemplates";

const { Option } = Select;

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;
const NAVY = "#123B78";
const NAVY_DARK = "#0A2D62";
const PRIMARY_BUTTON = "#1e3d9f";
const NAVY_TINT = "#EAF2FF";
const NAVY_BORDER = "#C8D9F4";
const COUNTRY_OPTIONS = getCountryData().map((country) => ({
  label: country.name,
  value: country.code,
}));

// Email sender
const sendEmail = async ({ to, subject, body, companyName }) => {
  try {
    const res = await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html: body, companyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[Email] send failed:", data);
      return { success: false, error: data };
    }
    console.log("[Email] sent:", data.messageId);
    return { success: true, data };
  } catch (err) {
    console.error("[Email] send error:", err);
    return { success: false, error: err.message };
  }
};

// Welcome email builder
const buildWelcomeEmail = ({ ownerName, companyName, plan, email }) => ({
  to: email,
  subject: `Welcome to Ryzent AI - Your ${plan} workspace is ready`,
  companyName: "Ryzent AI",
  body: buildRyzentEmail({
    title: `Welcome, ${ownerName}.`,
    intro: `Your ${plan} workspace for ${companyName} has been successfully activated and is ready for use.`,
    contentHtml: `
      <p style="margin:0 0 12px;font-size:14px;color:#334155;">
        We're excited to have you on board with Ryzent AI. Your workspace has been fully set up to help you streamline project management, team collaboration, and delivery tracking — all in one centralized platform.
      </p>

      <p style="margin:0 0 12px;font-size:14px;color:#334155;">
        To help you get started quickly, here are a few recommended next steps:
      </p>

      <ol style="margin:0 0 16px 18px;padding:0;color:#334155;font-size:14px;line-height:1.7;">
        <li>
          <strong>Invite your team:</strong> Add team members to your workspace and assign appropriate roles to ensure smooth collaboration.
        </li>
        <li>
          <strong>Create your first project:</strong> Set up projects, define tasks, and establish workflows tailored to your business needs.
        </li>
        <li>
          <strong>Manage operations efficiently:</strong> Use dashboards to run standups, schedule meetings, and monitor progress in real-time.
        </li>
        <li>
          <strong>Leverage AI capabilities:</strong> Utilize Ryzent AI features to automate repetitive tasks, generate insights, and improve productivity.
        </li>
      </ol>

      <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#334155;">
        Ryzent AI is designed to simplify your workflow, reduce manual effort, and give you complete visibility over your operations. As you continue using the platform, you'll discover powerful tools that help scale your team’s performance.
      </p>

      <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">
        If you need any assistance during onboarding or have questions about features, our support team is always ready to help you get the most out of your workspace.
      </p>
    `,
    ctaLabel: "Open Ryzent AI",
    ctaHref: `${window.location.origin}/signin`,
    footerHelpHtml:
      'If you have any questions, simply reply to this email or contact us at <a href="mailto:support@ryzent.com" style="color:#334155;">support@ryzent.com</a>.',
  }),
});

// Billing email builder
const buildBillingEmail = ({
  ownerName,
  companyName,
  plan,
  price, // full plan price e.g. 49
  finalPrice, // discounted price e.g. 24.5 (shown in email only)
  promoCode,
  discountLabel,
  discountType,
  email,
  trialDays = 14,
}) => {
  const trialEndDate = new Date(
    Date.now() + trialDays * 86400000,
  ).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const firstChargeDate = trialDays > 0 ? trialEndDate : "Today";
  const dueToday = trialDays > 0 ? "$0.00" : `$${finalPrice ?? price}`;
  const hasDiscount = promoCode && discountLabel && discountType !== "trial";
  const hasTrialBonus = promoCode && discountType === "trial";

  const recurringAmount = price;

  return {
    to: email,
    subject: `Order confirmed - Ryzent AI ${plan} Plan`,
    companyName: "Ryzent AI",
    body: buildRyzentEmail({
      title: "Order Confirmed",
      intro: `Hi ${ownerName}, your ${plan} plan for ${companyName} is now active on Ryzent AI.`,
      contentHtml: `
        <p style="margin:0 0 10px;font-size:14px;color:#334155;">
          ${
            trialDays > 0
              ? `Your free trial is active for ${trialDays} days, giving you full access to all features during this period.`
              : "Your payment has been successfully processed and your subscription is now active."
          }
        </p>

        <p style="margin:0 0 12px;font-size:14px;color:#334155;">
          Below is a summary of your billing details:
        </p>

        <ul style="margin:0 0 16px 18px;padding:0;color:#334155;font-size:14px;line-height:1.7;">
          <li><strong>Plan:</strong> ${plan}</li>
          <li><strong>Standard price:</strong> $${price}/month</li>
          ${hasDiscount ? `<li><strong>Promotional offer (${promoCode}):</strong> ${discountLabel}</li>` : ""}
          ${hasTrialBonus ? `<li><strong>Promotional bonus:</strong> ${discountLabel}</li>` : ""}
          <li><strong>Amount due today:</strong> ${dueToday}</li>
          <li><strong>First charge:</strong> ${
            hasDiscount
              ? `$${finalPrice} (after ${discountLabel})`
              : `$${price}`
          } on ${firstChargeDate}</li>
          <li><strong>Recurring billing:</strong> $${recurringAmount}/month</li>
          <li><strong>Billing cycle:</strong> Monthly</li>
          ${
            trialDays > 0
              ? `<li><strong>Trial ends:</strong> ${trialEndDate}</li>`
              : ""
          }
        </ul>

        <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#334155;">
          You can manage your subscription, update billing details, or review invoices anytime from your dashboard.
        </p>

        <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">
          Thank you for choosing Ryzent AI. We’re committed to helping you streamline operations and scale efficiently.
        </p>
      `,
      ctaLabel: "Go to Dashboard",
      ctaHref: `${window.location.origin}/signin`,
      footerHelpHtml:
        'For any billing-related questions, please contact us at <a href="mailto:billing@ryzent.co" style="color:#334155;">billing@ryzent.co</a>.',
    }),
  };
};

// Promo code validation
async function validatePromoCode(code, planName, planPrice) {
  const normalizedCode = String(code || "").trim();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .ilike("code", normalizedCode)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) return { valid: false, error: "Invalid promo code." };

  if (data.expires_at && new Date(data.expires_at) < new Date())
    return { valid: false, error: "This promo code has expired." };

  if (data.max_uses != null && data.times_used >= data.max_uses)
    return {
      valid: false,
      error: "This promo code has reached its usage limit.",
    };

  if (data.min_plan_price != null && planPrice < data.min_plan_price)
    return {
      valid: false,
      error: `This code requires a plan of at least $${data.min_plan_price}/mo.`,
    };

  const normalizedPlanName = String(planName || "")
    .trim()
    .toLowerCase();
  const applicablePlans = Array.isArray(data.applicable_plans)
    ? data.applicable_plans.map((p) =>
        String(p || "")
          .trim()
          .toLowerCase(),
      )
    : [];
  if (
    applicablePlans.length > 0 &&
    !applicablePlans.includes(normalizedPlanName)
  )
    return {
      valid: false,
      error: `This code is not valid for the ${planName} plan.`,
    };

  return { valid: true, promo: data };
}

// Compute discounted values
function applyDiscount(originalPrice, promo) {
  if (!promo)
    return {
      finalPrice: originalPrice,
      discountLabel: null,
      extraTrialDays: 0,
    };

  if (promo.discount_type === "percent") {
    const discounted = Math.max(
      0,
      originalPrice * (1 - promo.discount_value / 100),
    );
    return {
      finalPrice: Math.round(discounted * 100) / 100,
      discountLabel: `${promo.discount_value}% off`,
      extraTrialDays: 0,
    };
  }
  if (promo.discount_type === "fixed") {
    return {
      finalPrice: Math.max(0, originalPrice - promo.discount_value),
      discountLabel: `$${promo.discount_value} off`,
      extraTrialDays: 0,
    };
  }
  if (promo.discount_type === "trial") {
    return {
      finalPrice: originalPrice,
      discountLabel: `+${promo.discount_value} extra trial days`,
      extraTrialDays: Number(promo.discount_value),
    };
  }
  return { finalPrice: originalPrice, discountLabel: null, extraTrialDays: 0 };
}

async function incrementPromoCodeUsage(promo) {
  if (!promo) return;

  const normalizedCode = String(promo.code || "").trim();
  const promoId = promo.id || null;

  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "increment_promo_code_usage",
    {
      p_code: normalizedCode || null,
      p_id: promoId,
    },
  );
  if (!rpcError && rpcResult === true) return;

  let codeRow = null;
  if (promoId) {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("id, code, times_used")
      .eq("id", promoId)
      .maybeSingle();
    if (error) throw error;
    codeRow = data;
  }

  if (!codeRow && normalizedCode) {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("id, code, times_used")
      .ilike("code", normalizedCode)
      .maybeSingle();
    if (error) throw error;
    codeRow = data;
  }

  if (!codeRow?.id) return;

  const nextUses = Number(codeRow.times_used || 0) + 1;
  const { error: updateError } = await supabase
    .from("promo_codes")
    .update({
      times_used: nextUses,
      updated_at: new Date().toISOString(),
    })
    .eq("id", codeRow.id);
  if (updateError) throw updateError;
}

const normalizeBillingAddressPayload = (formData = {}) => {
  const line1 = String(formData.billing_address_line1 || "").trim();
  const line2 = String(formData.billing_address_line2 || "").trim();
  const city = String(formData.billing_city || "").trim();
  const state = String(formData.billing_state || "").trim();
  const postalCode = String(formData.billing_postal_code || "").trim();
  const country = String(
    formData.billing_country_name || formData.billing_country || "",
  ).trim();

  if (!line1 || !city || !country) return null;

  return {
    line1,
    line2: line2 || null,
    city,
    state: state || null,
    postal_code: postalCode || null,
    country,
  };
};

const resolveTenantIdFromSubscriptionResponse = async (
  subscriptionData,
  userId,
) => {
  const directTenantId =
    subscriptionData?.tenantId ||
    subscriptionData?.tenant_id ||
    subscriptionData?.tenant?.id ||
    subscriptionData?.data?.tenantId ||
    subscriptionData?.data?.tenant_id ||
    null;
  if (directTenantId) return directTenantId;

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw profileError;
  return profileRow?.tenant_id || null;
};

const saveBillingAddressForTenant = async ({
  userId,
  subscriptionData,
  formData,
}) => {
  const billingAddress = normalizeBillingAddressPayload(formData);
  if (!billingAddress) return;

  const tenantId = await resolveTenantIdFromSubscriptionResponse(
    subscriptionData,
    userId,
  );
  if (!tenantId) return;

  const { error } = await supabase.from("tenant_billing_addresses").upsert(
    [
      {
        tenant_id: tenantId,
        ...billingAddress,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "tenant_id" },
  );
  if (error?.code === "PGRST205") {
    // Table not migrated yet in current environment; skip silently.
    return;
  }
  if (error) throw error;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureRegisteredUserProfile = async ({
  userId,
  formData,
  subscriptionData,
}) => {
  if (!userId) return null;

  // Allow backend subscription bootstrap to create the profile first.
  for (let i = 0; i < 8; i += 1) {
    const { data: existingProfile, error } = await supabase
      .from("profiles")
      .select("id, tenant_id, role")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    if (existingProfile?.id) return existingProfile;
    await wait(300);
  }

  // Fallback: ensure a minimal owner profile exists for brand-new workspaces.
  const tenantId = await resolveTenantIdFromSubscriptionResponse(
    subscriptionData,
    userId,
  );

  const { error: upsertError } = await supabase.from("profiles").upsert(
    [
      {
        id: userId,
        email: formData.email,
        full_name: formData.owner_name,
        role: "admin",
        tenant_id: tenantId || null,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "id" },
  );
  if (upsertError) throw upsertError;

  const { data: ensuredProfile, error: ensuredProfileError } = await supabase
    .from("profiles")
    .select("id, tenant_id, role")
    .eq("id", userId)
    .maybeSingle();
  if (ensuredProfileError) throw ensuredProfileError;
  return ensuredProfile || null;
};

// Promo code input widget
function PromoCodeInput({ plan, onApply, onRemove, appliedPromo }) {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setError("");
    const result = await validatePromoCode(code, plan.name, plan.price);
    setChecking(false);
    if (result.valid) {
      onApply(result.promo);
    } else {
      setError(result.error);
    }
  };

  const handleRemove = () => {
    setCode("");
    setError("");
    onRemove();
  };

  if (appliedPromo) {
    const { discountLabel, extraTrialDays, finalPrice } = applyDiscount(
      plan.price,
      appliedPromo,
    );
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f0fdf4",
          border: "1.5px solid #86efac",
          borderRadius: 12,
          padding: "10px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GiftOutlined style={{ color: "#16a34a", fontSize: 16 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
              {appliedPromo.code}
            </div>
            <div style={{ fontSize: 11, color: "#16a34a", marginTop: 1 }}>
              {appliedPromo.discount_type === "trial"
                ? `+${extraTrialDays} extra trial days added`
                : `${discountLabel} applied -> ${formatMoney(finalPrice, plan.currency)}/mo`}
            </div>
          </div>
        </div>
        <button
          onClick={handleRemove}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: 4,
            borderRadius: 6,
          }}
        >
          <CloseCircleOutlined style={{ color: "#16a34a", fontSize: 16 }} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <TagOutlined
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              fontSize: 14,
              zIndex: 1,
            }}
          />
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            placeholder="Enter promo code"
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "monospace",
              letterSpacing: "0.06em",
              border: error ? "1.5px solid #fca5a5" : "1px solid #e2e8f0",
              outline: "none",
              color: "#0f172a",
              background: "#f8fafc",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!code.trim() || checking}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: code.trim() ? NAVY : "#e2e8f0",
            color: code.trim() ? "#fff" : "#94a3b8",
            fontSize: 13,
            fontWeight: 700,
            cursor: code.trim() && !checking ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
            transition: "all 0.15s",
          }}
        >
          {checking ? (
            <Spin
              indicator={
                <LoadingOutlined style={{ fontSize: 13, color: "#fff" }} spin />
              }
            />
          ) : (
            "Apply"
          )}
        </button>
      </div>
      {error && (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 12,
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <CloseCircleOutlined /> {error}
        </p>
      )}
    </div>
  );
}

// Price display in order summary
function PriceDisplay({ plan, appliedPromo }) {
  if (plan.contactForPricing) {
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 18 }}>
          Contact Us
        </div>
      </div>
    );
  }
  if (!appliedPromo || appliedPromo.discount_type === "trial") {
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 18 }}>
          {plan.priceLabel}
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{plan.period}</div>
      </div>
    );
  }
  const { finalPrice } = applyDiscount(plan.price, appliedPromo);
  return (
    <div style={{ textAlign: "right" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "flex-end",
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#94a3b8",
            textDecoration: "line-through",
          }}
        >
          {plan.priceLabel}
        </span>
        <span style={{ fontWeight: 800, color: "#15803d", fontSize: 18 }}>
          {formatMoney(finalPrice, plan.currency)}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>{plan.period}</div>
    </div>
  );
}

// Icon map
const PLAN_ICON_MAP = {
  Zap: <ThunderboltOutlined />,
  Rocket: <RocketOutlined />,
  Crown: <CrownOutlined />,
  ShieldCheck: <SafetyCertificateOutlined />,
  Star: <StarFilled style={{ fontSize: 14 }} />,
  Sparkles: <ThunderboltOutlined />,
};

const EUROPE_COUNTRIES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "NO",
  "CH",
  "IS",
  "LI",
  "GB",
  "UK",
  "AL",
  "AD",
  "AM",
  "AZ",
  "BA",
  "BY",
  "GE",
  "GI",
  "IM",
  "JE",
  "XK",
  "MD",
  "MC",
  "ME",
  "MK",
  "RS",
  "SM",
  "TR",
  "UA",
  "VA",
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

function adaptPlan(row, regionMap = {}, userRegion = "GLOBAL") {
  const monthlyPrice = row.monthly_price ?? row.price ?? 0;
  const yearlyPrice =
    row.yearly_price ?? (monthlyPrice > 0 ? Number(monthlyPrice) * 12 : 0);
  const planRegion = regionMap[row.id] || {};
  const monthlyByRegion = planRegion.monthly || {};
  const yearlyByRegion = planRegion.yearly || {};
  const selectedMonthlyRegion =
    monthlyByRegion[userRegion] ||
    monthlyByRegion.GLOBAL ||
    monthlyByRegion.EUROPE;
  const selectedYearlyRegion =
    yearlyByRegion[userRegion] ||
    yearlyByRegion.GLOBAL ||
    yearlyByRegion.EUROPE;
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
  const isContact = !!row.contact_for_pricing;
  return {
    id: row.id,
    name: row.name,
    price: regionPrice,
    monthlyPrice,
    yearlyPrice,
    priceLabel: row.priceLabel ?? formatMoney(regionPrice, regionCurrency),
    period: row.period ?? (Number(monthlyPrice) === 0 ? "forever" : "/mo"),
    periodYearly: "/yr billed yearly",
    tagline: row.tagline ?? "",
    icon: PLAN_ICON_MAP[row.icon] ?? <ThunderboltOutlined />,
    color: row.color ?? NAVY,
    popular: row.popular ?? false,
    contactForPricing: isContact,
    freeTrialAvailable: row.free_trial_available ?? true,
    trialDays: Number(row.trial_days ?? 14) || 14,
    currency: regionCurrency,
    currencyYearly: yearlyCurrency,
    features: Array.isArray(row.features) ? row.features : [],
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
    cta: isContact
      ? "Contact Us"
      : Number(regionPrice) === 0
        ? "Start for free"
        : `Choose ${row.name}`,
  };
}

function planForCycle(plan, cycle = "monthly") {
  if (!plan) return plan;
  if (plan.contactForPricing) return { ...plan, billingCycle: cycle };
  if (cycle === "yearly") {
    return {
      ...plan,
      billingCycle: "yearly",
      price: Number(
        plan.yearlyDisplayPrice ?? plan.yearlyPrice ?? plan.price ?? 0,
      ),
      priceLabel:
        plan.yearlyDisplayLabel ??
        formatMoney(
          plan.yearlyPrice ?? plan.price,
          plan.currencyYearly || plan.currency,
        ),
      period: plan.periodYearly || "/yr billed yearly",
      stripePriceId:
        plan.stripeYearlyPriceId ||
        plan.stripeMonthlyPriceId ||
        plan.stripePriceId,
      currency: plan.currencyYearly || plan.currency,
      cta: plan.contactForPricing
        ? "Contact Us"
        : Number(plan.yearlyDisplayPrice ?? plan.yearlyPrice ?? 0) === 0
          ? "Start for free"
          : `Choose ${plan.name}`,
    };
  }
  return {
    ...plan,
    billingCycle: "monthly",
    price: Number(
      plan.monthlyDisplayPrice ?? plan.monthlyPrice ?? plan.price ?? 0,
    ),
    priceLabel: formatMoney(
      plan.monthlyDisplayPrice ?? plan.monthlyPrice ?? plan.price,
      plan.currency || "USD",
    ),
    period: "/mo",
    stripePriceId: plan.stripeMonthlyPriceId || plan.stripePriceId,
    currency: plan.currency || "USD",
    cta: plan.contactForPricing
      ? "Contact Us"
      : Number(plan.monthlyDisplayPrice ?? plan.monthlyPrice ?? 0) === 0
        ? "Start for free"
        : `Choose ${plan.name}`,
  };
}

// Step indicator
const StepPill = ({ steps, current }) => (
  <div className="flex items-center gap-1">
    {steps.map((s, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <div key={i} className="flex items-center gap-1">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300"
            style={{
              background: done ? "#10b981" : active ? NAVY : "#e2e8f0",
              color: done ? "#fff" : active ? "#fff" : "#94a3b8",
            }}
          >
            {done ? (
              <CheckOutlined style={{ fontSize: 10 }} />
            ) : (
              <span style={{ fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
            )}
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-6 h-px transition-all duration-500"
              style={{ background: done ? "#10b981" : "#e2e8f0" }}
            />
          )}
        </div>
      );
    })}
  </div>
);

// Stripe card form
const StripeCardForm = ({
  plan,
  formData,
  appliedPromo,
  onSuccess,
  loading,
  setLoading,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const { finalPrice, discountLabel, extraTrialDays } = applyDiscount(
    plan.price,
    appliedPromo,
  );
  const baseTrialDays = plan.freeTrialAvailable
    ? Number(plan.trialDays ?? 14) || 14
    : 0;
  const totalTrialDays = baseTrialDays + (extraTrialDays || 0);
  const showDiscountedPrice =
    appliedPromo &&
    appliedPromo.discount_type !== "trial" &&
    finalPrice !== plan.price;

  const handlePay = async () => {
    if (!stripe || !elements) return;
    const billingAddress = normalizeBillingAddressPayload(formData);
    if (!billingAddress) {
      message.error(
        "Please add billing address details before continuing to payment.",
      );
      return;
    }
    setLoading(true);

    try {
      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.owner_name,
            company_name: formData.company_name,
          },
        },
      });
      if (authError) throw new Error(authError.message);
      const userId = authData.user?.id;
      if (!userId) throw new Error("Failed to create user account");

      // 2. Tokenise card with Stripe
      const cardElement = elements.getElement(CardElement);
      const { paymentMethod, error: pmError } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: formData.owner_name,
            email: formData.email,
            address: {
              line1: formData.billing_address_line1 || undefined,
              line2: formData.billing_address_line2 || undefined,
              city: formData.billing_city || undefined,
              state: formData.billing_state || undefined,
              postal_code: formData.billing_postal_code || undefined,
              country: formData.billing_country || undefined,
            },
          },
        });
      if (pmError) throw new Error(pmError.message);

      // 3. Call edge function
      const { data, error } = await supabase.functions.invoke(
        "create-subscription",
        {
          body: {
            userId,
            email: formData.email,
            name: formData.owner_name,
            paymentMethodId: paymentMethod.id,
            priceId: plan.stripePriceId,
            companyName: formData.company_name,
            domain: formData.domain,
            industry: formData.industry,
            companySize: formData.company_size,
            plan: plan.name,
            maxUsers: plan.limits.max_users,
            // mrr fields
            // baseMrr: always the full plan price (integer) stored in DB
            // finalPrice is only used for display/email, NOT sent as mrr
            baseMrr: plan.price,
            // promo fields
            promoCode: appliedPromo?.code ?? null,
            promoCodeId: appliedPromo?.id ?? null,
            discountType: appliedPromo?.discount_type ?? null, // "percent"|"fixed"|"trial"
            discountValue: appliedPromo?.discount_value ?? null,
            trialDays: totalTrialDays,
            billingAddress,
          },
        },
      );

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      console.log("Subscription created:", data);

      try {
        await saveBillingAddressForTenant({
          userId,
          subscriptionData: data,
          formData,
        });
      } catch (billingErr) {
        console.warn("Failed to save tenant billing address:", billingErr);
      }

      await ensureRegisteredUserProfile({
        userId,
        formData,
        subscriptionData: data,
      });

      if (appliedPromo) {
        try {
          await incrementPromoCodeUsage(appliedPromo);
        } catch (promoErr) {
          console.warn("Failed to update promo code usage:", promoErr);
        }
      }

      // 4. Send emails
      await sendEmail(
        buildWelcomeEmail({
          ownerName: formData.owner_name,
          companyName: formData.company_name,
          plan: plan.name,
          email: formData.email,
        }),
      );

      await sendEmail(
        buildBillingEmail({
          ownerName: formData.owner_name,
          companyName: formData.company_name,
          plan: plan.name,
          price: plan.price, // full price for recurring amount row
          finalPrice, // discounted price for first-charge row
          promoCode: appliedPromo?.code ?? null,
          discountLabel,
          discountType: appliedPromo?.discount_type ?? null,
          email: formData.email,
          trialDays: totalTrialDays,
        }),
      );

      onSuccess(plan.name);
    } catch (err) {
      message.error(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-3">
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
      <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-5">
        <SafetyCertificateOutlined />
        Payments secured by Stripe. We never store card details.
      </p>
      <Button
        block
        size="large"
        loading={loading}
        onClick={handlePay}
        className="!h-12 !text-base !font-semibold !rounded-xl !border-0"
        style={{ background: PRIMARY_BUTTON }}
        type="primary"
      >
        {showDiscountedPrice
          ? `Pay ${formatMoney(finalPrice, plan.currency)} ${plan.period} and start ->`
          : `Pay ${plan.priceLabel} ${plan.period} & Start ->`}
      </Button>
    </div>
  );
};

// Free plan form
const FreePlanForm = ({ formData, onSuccess, loading, setLoading }) => {
  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.owner_name,
            company_name: formData.company_name,
          },
        },
      });
      if (authError) throw new Error(authError.message);
      const userId = authData.user?.id;
      if (!userId) throw new Error("Failed to create user account");

      const { data, error } = await supabase.functions.invoke(
        "create-subscription",
        {
          body: {
            userId,
            email: formData.email,
            name: formData.owner_name,
            companyName: formData.company_name,
            domain: formData.domain,
            industry: formData.industry,
            companySize: formData.company_size,
            plan: "Free",
            maxUsers: 5,
            baseMrr: 0,
            billingAddress: normalizeBillingAddressPayload(formData),
          },
        },
      );
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      try {
        await saveBillingAddressForTenant({
          userId,
          subscriptionData: data,
          formData,
        });
      } catch (billingErr) {
        console.warn("Failed to save tenant billing address:", billingErr);
      }

      await ensureRegisteredUserProfile({
        userId,
        formData,
        subscriptionData: data,
      });

      await sendEmail(
        buildWelcomeEmail({
          ownerName: formData.owner_name,
          companyName: formData.company_name,
          plan: "Free",
          email: formData.email,
        }),
      );

      onSuccess("Free");
    } catch (err) {
      message.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      block
      size="large"
      loading={loading}
      onClick={handleCreate}
      className="!h-12 !text-base !font-semibold !rounded-xl"
      style={{ background: PRIMARY_BUTTON, border: "none", color: "#fff" }}
    >
      Create Free Account
    </Button>
  );
};

// Trust strip
const TrustStrip = () => (
  <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
    {[
      { icon: <SafetyCertificateOutlined />, text: "SSL encrypted" },
      { icon: <CheckCircleFilled />, text: "GDPR compliant" },
      { icon: <LockOutlined />, text: "SOC 2 ready" },
    ].map((t) => (
      <div
        key={t.text}
        className="flex items-center gap-1.5 text-xs text-slate-400"
      >
        {t.icon} {t.text}
      </div>
    ))}
  </div>
);

// Main Register Page
const Register = () => {
  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [accountCheckLoading, setAccountCheckLoading] = useState(false);
  const yearlySavingsPct = (() => {
    const savings = (plans || [])
      .filter((p) => !p.contactForPricing)
      .map((p) => {
        const monthly = Number(p.monthlyDisplayPrice ?? p.monthlyPrice ?? 0);
        const yearly = Number(p.yearlyDisplayPrice ?? p.yearlyPrice ?? 0);
        if (monthly <= 0 || yearly <= 0 || yearly >= monthly) return 0;
        return Math.round(((monthly - yearly) / monthly) * 100);
      })
      .filter((v) => v > 0);
    return savings.length ? Math.max(...savings) : 0;
  })();

  useEffect(() => {
    (async () => {
      try {
        const userRegion = detectPricingRegion();
        const { data, error } = await supabase
          .from("plans")
          .select("*")
          .eq("is_active", true);
        if (error) throw error;
        const planIds = (data ?? []).map((p) => p.id).filter(Boolean);
        let regionMap = {};
        if (planIds.length) {
          const { data: regionRows, error: regionErr } = await supabase
            .from("plan_region_prices")
            .select(
              "plan_id, billing_cycle, region, currency, price, stripe_price_id",
            )
            .in("plan_id", planIds);
          if (!regionErr) {
            regionMap = buildRegionalMap(regionRows);
          }
        }
        setPlans(
          (data ?? [])
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
            }),
        );
      } catch (err) {
        message.error("Failed to load plans: " + err.message);
      } finally {
        setPlansLoading(false);
      }
    })();
  }, []);

  const [companyForm] = Form.useForm();
  const [accountForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setMounted(true), 30);
  }, []);

  const merge = (v) => setFormData((p) => ({ ...p, ...v }));

  const goNext = async (form) => {
    try {
      const v = await form.validateFields();
      merge(v);
      setStep((s) => s + 1);
    } catch {
      // antd shows field errors automatically
    }
  };

  const handleAccountNext = async () => {
    let values;
    try {
      values = await accountForm.validateFields();
    } catch {
      return;
    }

    setAccountCheckLoading(true);
    try {
      const { data: existing, error: lookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", values.email)
        .maybeSingle();

      if (lookupError && lookupError.code !== "PGRST116") {
        throw new Error(lookupError.message);
      }

      if (existing) {
        accountForm.setFields([
          {
            name: "email",
            errors: [
              "An account with this email already exists. Please sign in instead.",
            ],
          },
        ]);
        return;
      }

      merge(values);
      setStep((s) => s + 1);
    } catch (err) {
      message.error(err.message || "Could not verify email. Please try again.");
    } finally {
      setAccountCheckLoading(false);
    }
  };

  const selectPlan = (plan) => {
    const selected = planForCycle(plan, billingCycle);
    if (selected.contactForPricing) return;
    setSelectedPlan(selected);
    setAppliedPromo(null);
    setStep(3);
  };

  const STEPS = ["Company", "Account", "Choose Plan", "Payment"];
  const handlePaidRegistrationSuccess = (registeredPlanName) => {
    const onboardingState = {
      ownerName: formData.owner_name,
      email: formData.email,
      companyName: formData.company_name,
      planName: registeredPlanName || selectedPlan?.name || "Subscription",
      fromSubscriptionPurchase: true,
    };
    sessionStorage.setItem(
      "onboarding_access",
      JSON.stringify(onboardingState),
    );

    navigate("/onboarding", {
      replace: true,
      state: onboardingState,
    });
  };

  const handleFreeRegistrationSuccess = () => {
    navigate("/signin", { replace: true });
  };

  return (
    <div className="min-h-screen register-bg p-0">
      <div className="register-shell">
        <section className="register-left">
          <div
            className={`register-scroll flex-1 flex flex-col items-center px-4 sm:px-6 py-4 overflow-y-auto overflow-x-hidden ${
              step === 0 || step === 1 ? "justify-center" : "justify-start"
            }`}
          >
            {step === 0 && (
              <div
                className="w-full max-w-lg"
                style={{
                  animation: mounted ? "slideUp 0.4s ease both" : "none",
                }}
              >
                <div className="text-left mb-8 mt-6">
                  <h1 className="text-4xl font-semibold text-slate-900 mb-2 tracking-tight">
                    Get Started Now
                  </h1>
                  <p className="text-slate-400 text-base">
                    Set up your space so we can personalise your experience.
                  </p>
                </div>
                <div className="bg-white rounded-3xl shadow-2xl p-8 register-panel">
                  <Form
                    form={companyForm}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                      <Form.Item
                        name="company_name"
                        label={
                          <span className="text-slate-700 font-medium text-sm">
                            Company Name
                          </span>
                        }
                        rules={[{ required: true, message: "Required" }]}
                        className="col-span-2"
                      >
                        <Input
                          prefix={<BankOutlined className="text-slate-400" />}
                          placeholder="Acme Corp"
                          className="!rounded-xl !h-11"
                        />
                      </Form.Item>
                      <Form.Item
                        name="owner_name"
                        label={
                          <span className="text-slate-700 font-medium text-sm">
                            Your Full Name
                          </span>
                        }
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Input
                          prefix={<UserOutlined className="text-slate-400" />}
                          placeholder="John Smith"
                          className="!rounded-xl !h-11"
                        />
                      </Form.Item>
                      <Form.Item
                        name="domain"
                        label={
                          <span className="text-slate-700 font-medium text-sm">
                            Company Domain
                          </span>
                        }
                      >
                        <Input
                          prefix={<GlobalOutlined className="text-slate-400" />}
                          placeholder="acme.com"
                          className="!rounded-xl !h-11"
                        />
                      </Form.Item>
                      <Form.Item
                        name="industry"
                        label={
                          <span className="text-slate-700 font-medium text-sm">
                            Industry
                          </span>
                        }
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Select
                          placeholder="Select industry"
                          style={{ height: 44 }}
                        >
                          {[
                            "Technology",
                            "Healthcare",
                            "Finance",
                            "Education",
                            "Retail",
                            "Manufacturing",
                            "Consulting",
                            "Media",
                            "Real Estate",
                            "Other",
                          ].map((i) => (
                            <Option key={i} value={i}>
                              {i}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        name="company_size"
                        label={
                          <span className="text-slate-700 font-medium text-sm">
                            Team Size
                          </span>
                        }
                        rules={[{ required: true, message: "Required" }]}
                      >
                        <Select
                          placeholder="Select size"
                          style={{ height: 44 }}
                        >
                          {[
                            "1-5",
                            "6-20",
                            "20-50",
                            "51-100",
                            "101-500",
                            "500+",
                          ].map((s) => (
                            <Option key={s} value={s}>
                              {s} people
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  </Form>
                  <Button
                    block
                    size="large"
                    type="primary"
                    onClick={() => goNext(companyForm)}
                    icon={<ArrowRightOutlined />}
                    className="!h-12 !text-base !font-semibold !rounded-xl !border-0"
                    style={{ background: PRIMARY_BUTTON }}
                  >
                    Continue
                  </Button>
                  <p
                    style={{
                      margin: "10px 0 0",
                      textAlign: "center",
                      fontSize: 13,
                      color: "#94a3b8",
                    }}
                  >
                    Have an account?{" "}
                    <Link to="/signin" style={{ color: NAVY, fontWeight: 600 }}>
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* STEP 1 - Account */}
            {step === 1 && (
              <div
                className="w-full max-w-md"
                style={{ animation: "slideUp 0.4s ease both" }}
              >
                <div className="text-left mb-8">
                  <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
                    Create your login
                  </h1>
                  <p className="text-slate-400">
                    These credentials will be your admin access.
                  </p>
                </div>
                <div className="bg-white rounded-3xl shadow-2xl p-8 register-panel">
                  <button
                    onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition-colors"
                  >
                    <ArrowLeftOutlined style={{ fontSize: 11 }} /> Back
                  </button>
                  <Form
                    form={accountForm}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                  >
                    <Form.Item
                      name="email"
                      label={
                        <span className="text-slate-700 font-medium text-sm">
                          Work Email
                        </span>
                      }
                      rules={[
                        { required: true, message: "Required" },
                        { type: "email", message: "Invalid email" },
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined className="text-slate-400" />}
                        placeholder="john@acme.com"
                        className="!rounded-xl !h-11"
                        onChange={() => {
                          accountForm.setFields([
                            { name: "email", errors: [] },
                          ]);
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      label={
                        <span className="text-slate-700 font-medium text-sm">
                          Password
                        </span>
                      }
                      rules={[
                        { required: true, message: "Required" },
                        { min: 8, message: "Minimum 8 characters" },
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="text-slate-400" />}
                        placeholder="Minimum 8 characters"
                        className="!rounded-xl !h-11"
                      />
                    </Form.Item>
                    <Form.Item
                      name="confirm_password"
                      label={
                        <span className="text-slate-700 font-medium text-sm">
                          Confirm Password
                        </span>
                      }
                      dependencies={["password"]}
                      rules={[
                        { required: true, message: "Required" },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("password") === value)
                              return Promise.resolve();
                            return Promise.reject("Passwords do not match");
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="text-slate-400" />}
                        placeholder="Repeat password"
                        className="!rounded-xl !h-11"
                      />
                    </Form.Item>
                  </Form>
                  <Button
                    block
                    size="large"
                    type="primary"
                    loading={accountCheckLoading}
                    onClick={handleAccountNext}
                    className="!h-12 !text-base !font-semibold !rounded-xl !border-0"
                    style={{ background: PRIMARY_BUTTON }}
                  >
                    {accountCheckLoading ? "Checking..." : "Continue to Plans"}
                  </Button>
                  <p
                    style={{
                      margin: "10px 0 0",
                      textAlign: "center",
                      fontSize: 13,
                      color: "#94a3b8",
                    }}
                  >
                    Have an account?{" "}
                    <Link to="/signin" style={{ color: NAVY, fontWeight: 600 }}>
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div
                className="w-full max-w-6xl px-2 sm:px-4"
                style={{ animation: "slideUp 0.4s ease both" }}
              >
                <div className="text-left mt-5 mb-10">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <ArrowLeftOutlined style={{ fontSize: 11 }} /> Back
                  </button>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4 mb-2 tracking-tight">
                    Pick what fits your team
                  </h1>
                </div>

                <div className="flex items-center justify-center mb-6">
                  <div
                    style={{
                      display: "inline-flex",
                      border: "1px solid #e2e8f0",
                      borderRadius: 999,
                      padding: 4,
                      background: "#fff",
                    }}
                  >
                    {[
                      { key: "monthly", label: "Monthly" },
                      {
                        key: "yearly",
                        label:
                          yearlySavingsPct > 0
                            ? `Yearly • Save ${yearlySavingsPct}%`
                            : "Yearly",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setBillingCycle(opt.key)}
                        style={{
                          border: "none",
                          borderRadius: 999,
                          padding: "8px 16px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          background:
                            billingCycle === opt.key
                              ? `linear-gradient(135deg,${NAVY},${NAVY_DARK})`
                              : "transparent",
                          color: billingCycle === opt.key ? "#fff" : "#64748b",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {plansLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        style={{
                          borderRadius: 16,
                          border: "1.5px solid #e2e8f0",
                          background: "#fff",
                          padding: 24,
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              background: "#f1f5f9",
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                height: 14,
                                background: "#f1f5f9",
                                borderRadius: 6,
                                marginBottom: 6,
                              }}
                            />
                            <div
                              style={{
                                height: 11,
                                background: "#f8fafc",
                                borderRadius: 6,
                                width: "70%",
                              }}
                            />
                          </div>
                        </div>
                        <div
                          style={{
                            height: 36,
                            background: "#f1f5f9",
                            borderRadius: 8,
                            width: "60%",
                          }}
                        />
                        <div style={{ height: 1, background: "#f1f5f9" }} />
                        {[1, 2, 3].map((j) => (
                          <div
                            key={j}
                            style={{
                              height: 12,
                              background: "#f8fafc",
                              borderRadius: 6,
                            }}
                          />
                        ))}
                        <div
                          style={{
                            height: 44,
                            background: "#f1f5f9",
                            borderRadius: 12,
                            marginTop: "auto",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : plans.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 0",
                      color: "#94a3b8",
                      fontSize: 14,
                    }}
                  >
                    No plans available right now. Please try again later.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {plans.map((plan, i) => {
                      const planView = planForCycle(plan, billingCycle);
                      const hasTrial =
                        !planView.contactForPricing &&
                        planView.freeTrialAvailable &&
                        Number(planView.trialDays || 0) > 0;
                      return (
                        <div
                          key={plan.id}
                          onClick={() =>
                            !planView.contactForPricing && selectPlan(plan)
                          }
                          className={`relative flex flex-col rounded-2xl group transition-all duration-300 ${
                            planView.contactForPricing
                              ? "hover:shadow-xl"
                              : "cursor-pointer hover:-translate-y-2 hover:shadow-xl"
                          }`}
                          style={{
                            background: planView.popular
                              ? "#F3F8FF"
                              : "#ffffff",
                            border: planView.popular
                              ? `2px solid ${NAVY}`
                              : "1.5px solid #e2e8f0",
                            animation: `slideUp 0.4s ease ${i * 0.07}s both`,
                            boxShadow: planView.popular
                              ? "0 8px 28px rgba(18,59,120,0.16)"
                              : "0 1px 4px rgba(0,0,0,0.04)",
                          }}
                        >
                          {planView.popular && (
                            <div
                              className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1"
                              style={{
                                background: `linear-gradient(90deg,${NAVY},${NAVY_DARK})`,
                              }}
                            >
                              <StarFilled style={{ fontSize: 8 }} /> MOST
                              POPULAR
                            </div>
                          )}
                          <div className="p-6 flex flex-col flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
                                style={{
                                  background: `${planView.color}18`,
                                  color: planView.color,
                                }}
                              >
                                {planView.icon}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-base">
                                  {planView.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {planView.tagline}
                                </div>
                              </div>
                            </div>
                            {hasTrial && (
                              <div
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4 w-fit"
                                style={{
                                  background: "#ecfdf5",
                                  border: "1px solid #a7f3d0",
                                  color: "#047857",
                                }}
                              >
                                <GiftOutlined style={{ fontSize: 11 }} />
                                <span style={{ fontSize: 11, fontWeight: 700 }}>
                                  {planView.trialDays}-day free trial
                                </span>
                              </div>
                            )}
                            <div className="mb-5">
                              {planView.contactForPricing ? (
                                <span className="text-3xl font-black text-slate-900 tracking-tight">
                                  Contact Us
                                </span>
                              ) : (
                                <>
                                  <span className="text-4xl font-black text-slate-900 tracking-tight">
                                    {planView.priceLabel}
                                  </span>
                                  <span className="text-sm text-slate-400 ml-1">
                                    {planView.period}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="mb-4 h-px bg-slate-100" />
                            <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                              {planView.features.map((f) => (
                                <li
                                  key={f.text}
                                  className="flex items-center gap-2.5 text-sm text-slate-600"
                                >
                                  <CheckOutlined
                                    style={{
                                      color: planView.color,
                                      fontSize: 11,
                                    }}
                                  />
                                  {f.text}
                                </li>
                              ))}
                            </ul>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (planView.contactForPricing) {
                                  window.location.href =
                                    "mailto:sales@resosyncer.com";
                                  return;
                                }
                                selectPlan(plan);
                              }}
                              className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200"
                              style={{
                                background: PRIMARY_BUTTON,
                                color: "#fff",
                                border: "none",
                              }}
                            >
                              {planView.cta}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 - Payment */}
            {step === 3 && selectedPlan && (
              <div
                className="w-full max-w-4xl"
                style={{ animation: "slideUp 0.4s ease both" }}
              >
                <div className="text-left mb-8">
                  <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
                    {selectedPlan.price === 0
                      ? "You're almost there"
                      : "Complete your order"}
                  </h1>
                  <p className="text-slate-400">
                    {selectedPlan.price === 0
                      ? "No credit card required. Start free today."
                      : `${selectedPlan.name} plan - ${selectedPlan.priceLabel} ${selectedPlan.period} - ${
                          selectedPlan.freeTrialAvailable
                            ? `${selectedPlan.trialDays || 14}-day free trial`
                            : "no free trial"
                        }`}
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mt-3 transition-colors"
                  >
                    <ArrowLeftOutlined style={{ fontSize: 11 }} /> Change plan
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Order summary */}
                  <div
                    className="lg:col-span-2 rounded-2xl p-6 flex flex-col gap-5"
                    style={{
                      background: "#f8fafc",
                      border: "1.5px solid #e2e8f0",
                    }}
                  >
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-4 text-slate-400">
                        Order Summary
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
                          style={{
                            background: `${selectedPlan.color}15`,
                            color: selectedPlan.color,
                          }}
                        >
                          {selectedPlan.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 text-sm">
                            Ryzent AI {selectedPlan.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {selectedPlan.tagline}
                          </div>
                        </div>
                        <PriceDisplay
                          plan={selectedPlan}
                          appliedPromo={appliedPromo}
                        />
                      </div>

                      {appliedPromo &&
                        (() => {
                          const { discountLabel, extraTrialDays } =
                            applyDiscount(selectedPlan.price, appliedPromo);
                          return (
                            <div
                              style={{
                                background: "#f0fdf4",
                                borderRadius: 10,
                                padding: "8px 12px",
                                marginBottom: 12,
                                border: "1px solid #bbf7d0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  color: "#15803d",
                                  fontWeight: 700,
                                  fontSize: 12,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}
                              >
                                <GiftOutlined /> {appliedPromo.code}
                              </span>
                              <span
                                style={{
                                  color: "#15803d",
                                  fontWeight: 700,
                                  fontSize: 12,
                                }}
                              >
                                {appliedPromo.discount_type === "trial"
                                  ? `+${extraTrialDays}d trial`
                                  : `-${discountLabel}`}
                              </span>
                            </div>
                          );
                        })()}

                      <div className="h-px mb-4 bg-slate-200" />
                      <div className="space-y-2.5">
                        {[
                          { label: "Company", value: formData.company_name },
                          { label: "Admin", value: formData.email },
                          ...(selectedPlan.price > 0
                            ? [
                                {
                                  label: "Trial",
                                  value:
                                    appliedPromo?.discount_type === "trial"
                                      ? `${
                                          (selectedPlan.freeTrialAvailable
                                            ? Number(
                                                selectedPlan.trialDays || 14,
                                              )
                                            : 0) +
                                          Number(
                                            appliedPromo.discount_value || 0,
                                          )
                                        } days free`
                                      : selectedPlan.freeTrialAvailable
                                        ? `${selectedPlan.trialDays || 14} days free`
                                        : "No trial",
                                  green: true,
                                },
                              ]
                            : []),
                        ].map((r) => (
                          <div
                            key={r.label}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-slate-400">{r.label}</span>
                            <span
                              className="font-medium"
                              style={{ color: r.green ? "#10b981" : "#1e293b" }}
                            >
                              {r.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-3 text-slate-400">
                        Included
                      </div>
                      <ul className="space-y-2">
                        {selectedPlan.features.slice(0, 5).map((f) => (
                          <li
                            key={f.text}
                            className="flex items-center gap-2 text-xs text-slate-500"
                          >
                            <CheckOutlined
                              style={{
                                color: selectedPlan.color,
                                fontSize: 10,
                              }}
                            />
                            {f.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Payment form */}
                  <div className="lg:col-span-3 bg-white rounded-2xl shadow-2xl p-8 register-panel">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      {selectedPlan.price === 0
                        ? "Confirm your account"
                        : "Payment details"}
                    </h3>
                    <p className="text-slate-400 text-sm mb-6">
                      {selectedPlan.price === 0
                        ? "Click below to create your free workspace instantly."
                        : `Enter your card details to start your ${
                            selectedPlan.freeTrialAvailable
                              ? `${selectedPlan.trialDays || 14}-day trial`
                              : "subscription"
                          }.`}
                    </p>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 mb-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        Account
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Name</span>
                        <span className="font-medium text-slate-700">
                          {formData.owner_name}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-500">Email</span>
                        <span className="font-medium text-slate-700">
                          {formData.email}
                        </span>
                      </div>
                    </div>

                    {selectedPlan.price > 0 && (
                      <div className="mb-5">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                          Billing Address
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            value={formData.billing_address_line1 || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                billing_address_line1: e.target.value,
                              }))
                            }
                            placeholder="Address line 1"
                            className="!rounded-xl !h-11 sm:!col-span-2"
                          />
                          <Input
                            value={formData.billing_address_line2 || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                billing_address_line2: e.target.value,
                              }))
                            }
                            placeholder="Address line 2 (optional)"
                            className="!rounded-xl !h-11 sm:!col-span-2"
                          />
                          <Input
                            value={formData.billing_city || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                billing_city: e.target.value,
                              }))
                            }
                            placeholder="City"
                            className="!rounded-xl !h-11"
                          />
                          <Input
                            value={formData.billing_state || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                billing_state: e.target.value,
                              }))
                            }
                            placeholder="State / Province"
                            className="!rounded-xl !h-11"
                          />
                          <Input
                            value={formData.billing_postal_code || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                billing_postal_code: e.target.value,
                              }))
                            }
                            placeholder="Postal code"
                            className="!rounded-xl !h-11"
                          />
                          <Select
                            showSearch
                            value={formData.billing_country || undefined}
                            onChange={(value, option) =>
                              setFormData((prev) => ({
                                ...prev,
                                billing_country: value,
                                billing_country_name: option?.label || value,
                              }))
                            }
                            placeholder="Select country"
                            options={COUNTRY_OPTIONS}
                            filterOption={(input, option) =>
                              String(option?.label || "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            className="!rounded-xl"
                            size="large"
                          />
                        </div>
                      </div>
                    )}

                    {selectedPlan.price > 0 && (
                      <div className="mb-5">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                          Promo Code
                        </div>
                        <PromoCodeInput
                          plan={selectedPlan}
                          appliedPromo={appliedPromo}
                          onApply={(promo) => {
                            setAppliedPromo(promo);
                            message.success(`Code "${promo.code}" applied!`);
                          }}
                          onRemove={() => setAppliedPromo(null)}
                        />
                      </div>
                    )}

                    {selectedPlan.price === 0 ? (
                      <FreePlanForm
                        formData={formData}
                        onSuccess={handleFreeRegistrationSuccess}
                        loading={loading}
                        setLoading={setLoading}
                      />
                    ) : (
                      <Elements stripe={stripePromise}>
                        <StripeCardForm
                          plan={selectedPlan}
                          formData={formData}
                          appliedPromo={appliedPromo}
                          onSuccess={handlePaidRegistrationSuccess}
                          loading={loading}
                          setLoading={setLoading}
                        />
                      </Elements>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#94a3b8",
              padding: "10px 0 14px",
            }}
          >
            © Copyright {new Date().getFullYear()} Ryzent AI. All rights
            reserved.
          </div>
        </section>
        <aside className="register-right">
          <p className="register-right-kicker">Ryzent AI</p>
          <h2 className="register-right-title">
            Run Smarter, Grow Faster with Ryzent AI
          </h2>
          <img
            className="register-right-image"
            src="/register.png"
            alt="Ryzent AI dashboard preview"
          />
          <div className="register-logos-wrap" aria-label="Trusted brands">
            <div className="register-logos-track">
              {[
                { src: "/logos/TIERSLimited.png", alt: "TIERS Limited" },
                { src: "/logos/CodeDelirium.png", alt: "Code Delirium" },
                { src: "/logos/ProppaHouse.png", alt: "Proppa House" },
                { src: "/logos/NexenLabz.svg", alt: "NexenLabz" },
                { src: "/logos/TIERSLimited.png", alt: "TIERS Limited" },
                { src: "/logos/CodeDelirium.png", alt: "Code Delirium" },
                { src: "/logos/ProppaHouse.png", alt: "Proppa House" },
                { src: "/logos/NexenLabz.svg", alt: "NexenLabz" },
              ].map((logo, idx) => (
                <div key={`${logo.src}-${idx}`} className="register-logo-item">
                  <img src={logo.src} alt={logo.alt} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Instrument Sans', system-ui, sans-serif; }
        .register-bg {
          background: #ffffff;
          height: 100vh;
          overflow: hidden;
        }
        .register-shell {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 0;
          height: 100vh;
          min-height: 0;
        }
        .register-left {
          background: transparent;
          border-radius: 0;
          border: none;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }
        .register-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .register-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        .register-right {
          border-radius: 24px;
          background: linear-gradient(145deg,#1e40af,#1e3a8a);
          color: #ffffff;
          padding: 76px 68px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          margin: 16px;
        }
        .register-right-kicker {
          margin: 0 0 14px;
          font-size: 12px;
          font-weight: 700;
          opacity: 0.9;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .register-right-title {
          margin: 0;
          font-size: 40px;
          line-height: 1.15;
          max-width: 520px;
          letter-spacing: -0.02em;
        }
        .register-right-subtitle {
          margin: 12px 0 28px;
          color: rgba(255,255,255,.82);
          font-size: 15px;
        }
        .register-right-image {
          width: 84%;
          max-height: 430px;
          border-radius: 16px;
          border: none;
          box-shadow: none;
          object-fit: contain;
          align-self: center;
          margin-top: 10px;
        }
        .register-logos-wrap {
          margin-top: 56px;
          width: 100%;
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
        }
        .register-logos-track {
          display: flex;
          align-items: center;
          gap: 28px;
          width: max-content;
          animation: logosMarquee 20s linear infinite;
        }
        .register-logo-item {
          flex: 0 0 auto;
          min-width: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: .92;
        }
        .register-logo-item img {
          max-height: 24px;
          max-width: 115px;
          width: auto;
          height: auto;
          object-fit: contain;
        }
        @keyframes logosMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .register-panel {
          border: none;
          box-shadow: none;
          background: transparent !important;
          padding: 0 !important;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity:0; transform:scale(0.85); }
          to   { opacity:1; transform:scale(1); }
        }
        .ant-input, .ant-input-affix-wrapper, .ant-input-password, .ant-select-selector {
          border-radius: 12px !important; border-color: #e2e8f0 !important;
        }
        .ant-input:hover, .ant-input-affix-wrapper:hover, .ant-select-selector:hover {
          border-color: #94a3b8 !important;
        }
        .ant-input:focus, .ant-input-affix-wrapper-focused {
          border-color: ${NAVY} !important;
          box-shadow: 0 0 0 3px rgba(18,59,120,0.15) !important;
        }
        .ant-form-item-label > label { font-size: 13px; font-weight: 500; color: #475569; }
        @media (max-width: 1080px) {
          .register-shell {
            grid-template-columns: 1fr;
            height: auto;
            min-height: 100vh;
          }
          .register-right { display: none; }
          .register-left {
            overflow: visible;
          }
          .register-bg {
            height: auto;
            min-height: 100vh;
            overflow: auto;
          }
        }
        @media (max-width: 768px) {
          .register-shell {
            gap: 0;
          }
          .register-left {
            padding: 0 2px;
          }
          .register-bg .text-4xl {
            font-size: 2rem !important;
            line-height: 1.2 !important;
          }
          .register-bg .text-5xl {
            font-size: 2.2rem !important;
            line-height: 1.2 !important;
          }
          .register-bg .register-panel {
            width: 100%;
          }
          .register-bg [class*="max-w-"] {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
