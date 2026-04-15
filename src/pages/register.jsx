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
import { supabase } from "../lib/supabase";

const { Option } = Select;

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;
const NAVY = "#123B78";
const NAVY_DARK = "#0A2D62";
const NAVY_TINT = "#EAF2FF";
const NAVY_BORDER = "#C8D9F4";

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
  subject: `Welcome to Ryzent - Your ${plan} workspace is ready`,
  companyName,
  body: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Ryzent</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">
          <tr>
            <td style="padding:0 0 28px;text-align:center;">
              <span style="font-size:15px;font-weight:700;letter-spacing:-0.3px;color:#18181b;">Ryzent</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden;">
              <tr><td style="height:3px;background:#18181b;font-size:0;line-height:0;">&nbsp;</td></tr>
              <tr>
                <td style="padding:40px 48px 36px;">
                  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;letter-spacing:-0.5px;line-height:1.3;">Welcome, ${ownerName}.</h1>
                  <p style="margin:0 0 32px;font-size:14px;color:#71717a;line-height:1.6;">Your <strong style="color:#18181b;font-weight:600;">${plan} workspace</strong> for ${companyName} is active and ready to use.</p>
                  <div style="height:1px;background:#f4f4f5;margin:0 0 28px;"></div>
                  <p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;">Get started</p>
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr><td style="padding:0 0 16px;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="width:28px;vertical-align:top;padding-top:1px;"><span style="display:inline-block;width:20px;height:20px;background:#18181b;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:700;color:#ffffff;">1</span></td><td style="padding-left:12px;"><p style="margin:0;font-size:14px;font-weight:600;color:#18181b;line-height:1.4;">Verify your email</p><p style="margin:2px 0 0;font-size:13px;color:#71717a;line-height:1.5;">Confirm your address to secure your account.</p></td></tr></table></td></tr>
                    <tr><td style="padding:0 0 16px;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="width:28px;vertical-align:top;padding-top:1px;"><span style="display:inline-block;width:20px;height:20px;background:#18181b;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:700;color:#ffffff;">2</span></td><td style="padding-left:12px;"><p style="margin:0;font-size:14px;font-weight:600;color:#18181b;line-height:1.4;">Invite your team</p><p style="margin:2px 0 0;font-size:13px;color:#71717a;line-height:1.5;">Go to Settings -> Team Members to add colleagues.</p></td></tr></table></td></tr>
                    <tr><td><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="width:28px;vertical-align:top;padding-top:1px;"><span style="display:inline-block;width:20px;height:20px;background:#18181b;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:700;color:#ffffff;">3</span></td><td style="padding-left:12px;"><p style="margin:0;font-size:14px;font-weight:600;color:#18181b;line-height:1.4;">Create your first project</p><p style="margin:2px 0 0;font-size:13px;color:#71717a;line-height:1.5;">Set up a project and start assigning tasks.</p></td></tr></table></td></tr>
                  </table>
                  <div style="height:1px;background:#f4f4f5;margin:28px 0;"></div>
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td><a href="${window.location.origin}/signin" style="display:inline-block;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none;letter-spacing:-0.1px;">Open Dashboard</a></td></tr></table>
                </td>
              </tr>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;line-height:1.6;">Questions? Reply to this email or write to <a href="mailto:support@Ryzent.com" style="color:#71717a;text-decoration:underline;">support@Ryzent.com</a></p>
              <p style="margin:0;font-size:12px;color:#d4d4d8;">(c) ${new Date().getFullYear()} Ryzent &nbsp;-&nbsp; <a href="${window.location.origin}/unsubscribe" style="color:#d4d4d8;text-decoration:underline;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim(),
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

  // What they pay after trial: discounted price if "forever" coupon, else full price
  // Since we use duration:"once", after first invoice they pay full price
  const recurringAmount = price;

  return {
    to: email,
    subject: `Order confirmed - Ryzent ${plan} Plan`,
    companyName,
    body: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Order Confirmation</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">
        <tr><td style="padding:0 0 28px;text-align:center;"><span style="font-size:15px;font-weight:700;letter-spacing:-0.3px;color:#18181b;">Ryzent</span></td></tr>
        <tr><td style="background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden;">
          <tr><td style="height:3px;background:#18181b;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="padding:40px 48px 36px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;">Order Confirmation</p>
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Your subscription is active.</h1>
            <p style="margin:0 0 32px;font-size:14px;color:#71717a;line-height:1.6;">
              Hi ${ownerName}, the <strong style="color:#18181b;font-weight:600;">${plan} plan</strong> for ${companyName} is now live.
              ${
                trialDays > 0
                  ? `Your free trial runs for <strong style="color:#18181b;">${trialDays} days</strong>. You won't be charged until it ends.`
                  : `Your card has been charged <strong style="color:#18181b;">$${finalPrice ?? price}</strong>.`
              }
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;margin-bottom:28px;">
              <tr style="background:#fafafa;">
                <td style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#a1a1aa;border-bottom:1px solid #e4e4e7;">Description</td>
                <td style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#a1a1aa;border-bottom:1px solid #e4e4e7;text-align:right;">Amount</td>
              </tr>

              <tr>
                <td style="padding:14px 16px;border-bottom:1px solid #f4f4f5;">
                  <p style="margin:0;font-size:14px;font-weight:600;color:#18181b;">Ryzent ${plan} Plan</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#a1a1aa;">Monthly subscription</p>
                </td>
                <td style="padding:14px 16px;border-bottom:1px solid #f4f4f5;text-align:right;vertical-align:top;">
                  <span style="font-size:14px;font-weight:600;color:#18181b;">$${price}</span>
                  <span style="font-size:12px;color:#a1a1aa;">/mo</span>
                </td>
              </tr>

              ${
                hasDiscount
                  ? `
              <tr>
                <td style="padding:14px 16px;border-bottom:1px solid #f4f4f5;">
                  <p style="margin:0;font-size:14px;font-weight:600;color:#059669;">Promo: ${promoCode}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#a1a1aa;">${discountLabel} - applied to first invoice after trial</p>
                </td>
                <td style="padding:14px 16px;border-bottom:1px solid #f4f4f5;text-align:right;vertical-align:top;">
                  <span style="font-size:14px;font-weight:600;color:#059669;">-${discountLabel}</span>
                </td>
              </tr>`
                  : ""
              }

              ${
                hasTrialBonus
                  ? `
              <tr>
                <td style="padding:14px 16px;border-bottom:1px solid #f4f4f5;">
                  <p style="margin:0;font-size:14px;font-weight:600;color:#059669;">Promo: ${promoCode}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#a1a1aa;">${discountLabel}</p>
                </td>
                <td style="padding:14px 16px;border-bottom:1px solid #f4f4f5;text-align:right;vertical-align:top;">
                  <span style="font-size:14px;font-weight:600;color:#059669;">Bonus: ${discountLabel}</span>
                </td>
              </tr>`
                  : ""
              }

              ${
                trialDays > 0
                  ? `
              <tr>
                <td style="padding:14px 16px;border-bottom:1px solid #f4f4f5;">
                  <p style="margin:0;font-size:14px;font-weight:600;color:#18181b;">${trialDays}-day free trial</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#a1a1aa;">No charge during trial period</p>
                </td>
                <td style="padding:14px 16px;border-bottom:1px solid #f4f4f5;text-align:right;vertical-align:top;">
                  <span style="font-size:14px;font-weight:600;color:#18181b;">-$${price}</span>
                </td>
              </tr>`
                  : ""
              }

              <tr style="background:#fafafa;">
                <td style="padding:14px 16px;">
                  <p style="margin:0;font-size:13px;font-weight:700;color:#18181b;">Due today</p>
                </td>
                <td style="padding:14px 16px;text-align:right;">
                  <span style="font-size:16px;font-weight:700;color:#18181b;">${dueToday}</span>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a1a1aa;">Billing schedule</p>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;"><span style="font-size:13px;color:#71717a;">Trial ends</span></td>
                <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;text-align:right;"><span style="font-size:13px;font-weight:600;color:#18181b;">${trialEndDate}</span></td>
              </tr>
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;"><span style="font-size:13px;color:#71717a;">First charge</span></td>
                <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;text-align:right;">
                  <span style="font-size:13px;font-weight:600;color:#18181b;">
                    ${hasDiscount ? `$${finalPrice} (after ${discountLabel})` : `$${price}`}
                    on ${firstChargeDate}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;"><span style="font-size:13px;color:#71717a;">Recurring amount</span></td>
                <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;text-align:right;"><span style="font-size:13px;font-weight:600;color:#18181b;">$${recurringAmount}/mo</span></td>
              </tr>
              <tr>
                <td style="padding:6px 0;"><span style="font-size:13px;color:#71717a;">Billing cycle</span></td>
                <td style="padding:6px 0;text-align:right;"><span style="font-size:13px;font-weight:600;color:#18181b;">Monthly</span></td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr><td><a href="${window.location.origin}/signin" style="display:inline-block;background:#18181b;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none;">Go to Dashboard</a></td></tr>
            </table>
          </td></tr>
        </td></tr>

        <tr><td style="padding:28px 0 0;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;line-height:1.6;">
            To manage your subscription, go to Settings -> Billing in your dashboard.<br/>
            Billing questions? Write to <a href="mailto:billing@Ryzent.com" style="color:#71717a;text-decoration:underline;">billing@Ryzent.com</a>
          </p>
          <p style="margin:0;font-size:12px;color:#d4d4d8;">(c) ${new Date().getFullYear()} Ryzent &nbsp;-&nbsp; <a href="${window.location.origin}/unsubscribe" style="color:#d4d4d8;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
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

  const normalizedPlanName = String(planName || "").trim().toLowerCase();
  const applicablePlans = Array.isArray(data.applicable_plans)
    ? data.applicable_plans.map((p) => String(p || "").trim().toLowerCase())
    : [];
  if (applicablePlans.length > 0 && !applicablePlans.includes(normalizedPlanName))
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
      rawRegion === "EU" ? "EUROPE" : rawRegion === "US" || rawRegion === "WORLD" ? "GLOBAL" : rawRegion;
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
  const isContact = !!row.contact_for_pricing;
  return {
    id: row.id,
    name: row.name,
    price: regionPrice,
    monthlyPrice,
    yearlyPrice,
    priceLabel: row.priceLabel ?? formatMoney(regionPrice, regionCurrency),
    period: row.period ?? (Number(monthlyPrice) === 0 ? "forever" : "/mo"),
    periodYearly: "/mo billed yearly",
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
      price: Number(plan.yearlyDisplayPrice ?? plan.yearlyPrice ?? plan.price ?? 0),
      priceLabel: plan.yearlyDisplayLabel ?? formatMoney(plan.yearlyPrice ?? plan.price, plan.currencyYearly || plan.currency),
      period: plan.periodYearly || "/mo billed yearly",
      stripePriceId: plan.stripeYearlyPriceId || plan.stripeMonthlyPriceId || plan.stripePriceId,
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
    price: Number(plan.monthlyDisplayPrice ?? plan.monthlyPrice ?? plan.price ?? 0),
    priceLabel: formatMoney(plan.monthlyDisplayPrice ?? plan.monthlyPrice ?? plan.price, plan.currency || "USD"),
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
  const baseTrialDays = plan.freeTrialAvailable ? Number(plan.trialDays ?? 14) || 14 : 0;
  const totalTrialDays = baseTrialDays + (extraTrialDays || 0);
  const showDiscountedPrice =
    appliedPromo &&
    appliedPromo.discount_type !== "trial" &&
    finalPrice !== plan.price;

  const handlePay = async () => {
    if (!stripe || !elements) return;
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
          billing_details: { name: formData.owner_name, email: formData.email },
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
          },
        },
      );

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      console.log("Subscription created:", data);

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
        style={{ background: NAVY }}
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
          },
        },
      );
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

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
      style={{ background: NAVY, border: "none", color: "#fff" }}
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
            .select("plan_id, billing_cycle, region, currency, price, stripe_price_id")
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
    <div className="min-h-screen register-bg flex flex-col">
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-slate-900 font-bold text-lg tracking-tight">
            Ryzent
          </span>
        </div>
        <StepPill steps={STEPS} current={step} />
        <div className="text-sm text-slate-400">
          Have an account?{" "}
          <Link to="/signin" className="!text-slate-700 !underline font-medium">
            Sign in
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {step === 0 && (
          <div
            className="w-full max-w-lg"
            style={{ animation: mounted ? "slideUp 0.4s ease both" : "none" }}
          >
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{ background: NAVY_TINT, color: NAVY }}
              >
                Step 1 of 4 - Company Info
              </div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
                Set up your workspace
              </h1>
              <p className="text-slate-400 text-base">
                Tell us about your company so we can personalise your
                experience.
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
                    <Select placeholder="Select size" style={{ height: 44 }}>
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
                style={{ background: NAVY }}
              >
                Continue
              </Button>
            </div>
            <TrustStrip />
          </div>
        )}

        {/* STEP 1 - Account */}
        {step === 1 && (
          <div
            className="w-full max-w-md"
            style={{ animation: "slideUp 0.4s ease both" }}
          >
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{ background: NAVY_TINT, color: NAVY }}
              >
                Step 2 of 4 - Account Setup
              </div>
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
                      accountForm.setFields([{ name: "email", errors: [] }]);
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
                style={{ background: NAVY }}
              >
                {accountCheckLoading ? "Checking..." : "Continue to Plans"}
              </Button>
            </div>
            <TrustStrip />
          </div>
        )}

        {step === 2 && (
          <div
            className="w-full max-w-6xl"
            style={{ animation: "slideUp 0.4s ease both" }}
          >
            <div className="text-center mb-10">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{ background: NAVY_TINT, color: NAVY }}
              >
                Step 3 of 4 - Choose Your Plan
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3 tracking-tight">
                Pick what fits your team
              </h1>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mx-auto mt-4 transition-colors"
              >
                <ArrowLeftOutlined style={{ fontSize: 11 }} /> Back
              </button>
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
                  { key: "yearly", label: "Yearly" },
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {plans.map((plan, i) => {
                  const planView = planForCycle(plan, billingCycle);
                  return (
                  <div
                    key={plan.id}
                    onClick={() => !planView.contactForPricing && selectPlan(plan)}
                    className={`relative flex flex-col rounded-2xl group transition-all duration-300 ${
                      planView.contactForPricing
                        ? "hover:shadow-xl"
                        : "cursor-pointer hover:-translate-y-2 hover:shadow-xl"
                    }`}
                    style={{
                      background: planView.popular ? "#F3F8FF" : "#ffffff",
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
                        <StarFilled style={{ fontSize: 8 }} /> MOST POPULAR
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
                              style={{ color: planView.color, fontSize: 11 }}
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
                            window.location.href = "mailto:sales@resosyncer.com";
                            return;
                          }
                          selectPlan(plan);
                        }}
                        className="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200"
                        style={{
                          background: `linear-gradient(135deg,${NAVY},${NAVY_DARK})`,
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
            <p className="text-center text-slate-400 text-sm mt-8">
              All plans include SSL security, unlimited projects, and real-time
              collaboration. Cancel anytime.
            </p>
          </div>
        )}

        {/* STEP 3 - Payment */}
        {step === 3 && selectedPlan && (
          <div
            className="w-full max-w-4xl"
            style={{ animation: "slideUp 0.4s ease both" }}
          >
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{ background: NAVY_TINT, color: NAVY }}
              >
                Step 4 of 4{" "}
                {selectedPlan.price === 0 ? "Create Account" : "Payment"}
              </div>
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
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mx-auto mt-3 transition-colors"
              >
                <ArrowLeftOutlined style={{ fontSize: 11 }} /> Change plan
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Order summary */}
              <div
                className="lg:col-span-2 rounded-2xl p-6 flex flex-col gap-5"
                style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}
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
                        Ryzent {selectedPlan.name}
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
                      const { discountLabel, extraTrialDays } = applyDiscount(
                        selectedPlan.price,
                        appliedPromo,
                      );
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
                                        ? Number(selectedPlan.trialDays || 14)
                                        : 0) +
                                      Number(appliedPromo.discount_value || 0)
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
                          style={{ color: selectedPlan.color, fontSize: 10 }}
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Instrument Sans', system-ui, sans-serif; }
        .register-bg {
          background:
            radial-gradient(ellipse 70% 50% at 15% 0%, rgba(18,59,120,0.09) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 100%, rgba(10,45,98,0.08) 0%, transparent 55%),
            #f5f9ff;
        }
        .register-bg::before {
          content: ''; position: fixed; inset: 0;
          background-image: radial-gradient(rgba(18,59,120,0.1) 1px, transparent 1px);
          background-size: 28px 28px; pointer-events: none; z-index: 0;
        }
        .register-bg > * { position: relative; z-index: 1; }
        .register-panel {
          border: 1px solid ${NAVY_BORDER};
          box-shadow: 0 18px 45px rgba(10, 45, 98, 0.12);
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
      `}</style>
    </div>
  );
};

export default Register;



