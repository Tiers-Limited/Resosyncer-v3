export const EMAIL_FONT_FAMILY = "'Georgia', 'Times New Roman', serif";
export const EMAIL_BODY_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const RYZENT_SOCIAL_LINKS = [
  { label: "Website", href: "https://ryzent.co" },
  { label: "LinkedIn", href: "https://lnkd.in/dWqK_R-z" },
  { label: "Facebook", href: "https://facebook.com/sia.ryzent" },
  { label: "Instagram", href: "https://instagram.com/sia.ryzent" },
  { label: "X", href: "https://x.com/siaryzent" },
  { label: "YouTube", href: "https://youtube.com/@siaryzent" },
];

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const SOCIAL_ICONS = {
  Website: "https://img.icons8.com/ios-glyphs/30/ffffff/domain.png",
  LinkedIn: "https://img.icons8.com/ios-filled/30/ffffff/linkedin.png",
  Facebook: "https://img.icons8.com/ios-filled/30/ffffff/facebook-new.png",
  Instagram: "https://img.icons8.com/ios-filled/30/ffffff/instagram-new.png",
  X: "https://img.icons8.com/ios-filled/30/ffffff/twitterx.png",
  YouTube: "https://img.icons8.com/ios-filled/30/ffffff/youtube-play.png",
};

const renderSocialLinks = () =>
  RYZENT_SOCIAL_LINKS.map(
    (item) => {
      const iconUrl = SOCIAL_ICONS[item.label];
      return (
      `<a href="${item.href}" style="display:inline-block;width:30px;height:30px;border-radius:50%;background:#374151;text-decoration:none;vertical-align:middle;text-align:center;line-height:30px;" title="${escapeHtml(item.label)}" aria-label="${escapeHtml(item.label)}">
        ${
          iconUrl
            ? `<img src="${iconUrl}" width="14" height="14" alt="${escapeHtml(item.label)}" style="display:inline-block;vertical-align:middle;border:0;outline:none;text-decoration:none;" />`
            : ""
        }
      </a>`
      );
    },
  ).join(`<span style="display:inline-block;width:8px;"></span>`);

const buildEmailTemplate = ({
  brandName,
  title,
  intro,
  contentHtml = "",
  ctaLabel,
  ctaHref,
  variant = "ryzent",
  footerHelpHtml = "",
}) => {
  const safeBrand = escapeHtml(brandName || "Ryzent AI");
  const safeTitle = escapeHtml(title || "");
  const safeIntro = escapeHtml(intro || "");

  const headerNote =
    variant === "company" ? "Company Update" : "System Notification";

  const ctaHtml =
    ctaLabel && ctaHref
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 0;">
          <tr>
            <td style="background:#111827;border-radius:4px;">
              <a href="${ctaHref}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-family:${EMAIL_BODY_FONT};font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">${escapeHtml(ctaLabel)}</a>
            </td>
          </tr>
        </table>`
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle || safeBrand}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:${EMAIL_BODY_FONT};color:#111827;">

    <!-- Outer wrapper -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:40px 16px;">
      <tr>
        <td align="center">

          <!-- Card -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">

            <!-- Top accent bar -->
            <tr>
              <td style="background:#111827;height:3px;font-size:0;line-height:0;">&nbsp;</td>
            </tr>

            <!-- Header -->
            <tr>
              <td style="background:#ffffff;padding:28px 40px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <span style="font-family:${EMAIL_FONT_FAMILY};font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.02em;">${safeBrand}</span>
                    </td>
                    <td align="right">
                      <span style="font-family:${EMAIL_BODY_FONT};font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;">${headerNote}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;padding:0 40px;">
                <div style="height:1px;background:#f3f4f6;font-size:0;line-height:0;">&nbsp;</div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="background:#ffffff;padding:36px 40px 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

                <h1 style="margin:0 0 16px;font-family:${EMAIL_FONT_FAMILY};font-size:28px;line-height:1.2;color:#111827;font-weight:700;letter-spacing:-0.03em;">${safeTitle}</h1>

                <p style="margin:0 0 20px;font-family:${EMAIL_BODY_FONT};font-size:15px;line-height:1.7;color:#4b5563;">${safeIntro}</p>

                ${contentHtml}
                ${ctaHtml}

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb;padding:24px 40px;border:1px solid #e5e7eb;border-top:none;">

                <p style="margin:0 0 14px;font-family:${EMAIL_BODY_FONT};font-size:12px;line-height:1.7;color:#6b7280;">
                  Powered by <strong style="color:#111827;font-weight:600;">Ryzent AI</strong>.
                  This message is intended solely for the named recipient. If you received it in error, please disregard it.
                </p>

                ${footerHelpHtml
                  ? `<p style="margin:0 0 14px;font-family:${EMAIL_BODY_FONT};font-size:12px;line-height:1.7;color:#6b7280;">${footerHelpHtml}</p>`
                  : ""}

                <p style="margin:0 0 16px;">${renderSocialLinks()}</p>

                <p style="margin:0;font-family:${EMAIL_BODY_FONT};font-size:11px;color:#9ca3af;">&copy; ${new Date().getFullYear()} Ryzent AI. All rights reserved.</p>

              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>

  </body>
</html>`.trim();
};

export const buildRyzentEmail = (config) =>
  buildEmailTemplate({ ...config, variant: "ryzent", brandName: "Ryzent AI" });

export const buildCompanyEmail = ({ companyName, ...config }) =>
  buildEmailTemplate({
    ...config,
    variant: "company",
    brandName: companyName || "Company",
  });

export const buildOtpEmail = ({
  otp,
  name,
  title = "Your verification code",
  intro,
  variant = "ryzent",
  companyName,
}) => {
  const otpCode = escapeHtml(otp);
  const safeName = escapeHtml(name || "there");
  const bodyIntro =
    intro || `Hi ${safeName}, use the code below to verify your identity.`;

  const contentHtml = `
    <!-- Expiry notice -->
    <p style="margin:0 0 16px;font-family:${EMAIL_BODY_FONT};font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#9ca3af;font-weight:600;">
      Expires in 10 minutes
    </p>

    <!-- OTP block -->
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin:0 0 24px;">
      <tr>
        <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:28px 24px;text-align:center;">
          <span style="font-family:'Courier New', Courier, monospace;font-size:42px;font-weight:700;letter-spacing:14px;color:#111827;display:block;line-height:1;">${otpCode}</span>
        </td>
      </tr>
    </table>

    <!-- Safety note -->
    <p style="margin:0;font-family:${EMAIL_BODY_FONT};font-size:13px;line-height:1.7;color:#6b7280;">
      If you didn't request this code, you can safely ignore this email. Your account remains secure.
    </p>
  `;

  if (variant === "company") {
    return buildCompanyEmail({
      companyName,
      title,
      intro: bodyIntro,
      contentHtml,
    });
  }

  return buildRyzentEmail({
    title,
    intro: bodyIntro,
    contentHtml,
  });
};
