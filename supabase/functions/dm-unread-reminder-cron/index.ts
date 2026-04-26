import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

type MessageRow = {
  id: string;
  tenant_id: string;
  sender_id: string;
  receiver_id: string | null;
  message: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const unreadDmReminderEmail = ({
  receiverName,
  senderName,
  messagePreview,
  dashboardUrl,
  companyName,
}: {
  receiverName: string;
  senderName: string;
  messagePreview: string;
  dashboardUrl: string;
  companyName: string;
}) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Unread message reminder</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding:0 0 28px;text-align:center;">
          <span style="font-size:15px;font-weight:700;color:#18181b;">${companyName || "Resosyncer"}</span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="height:3px;background:#2563eb;">&nbsp;</td></tr>
            <tr><td style="padding:40px 48px 36px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">You have an unread message</h1>
              <p style="margin:0 0 22px;font-size:14px;color:#71717a;line-height:1.6;">
                Hi <strong style="color:#18181b;">${receiverName || "there"}</strong>, you have not read a direct message from
                <strong style="color:#18181b;">${senderName || "a teammate"}</strong> yet.
              </p>
              <div style="padding:12px 14px;border-radius:8px;border:1px solid #e4e4e7;background:#fafafa;color:#3f3f46;font-size:13px;line-height:1.55;margin-bottom:24px;">
                ${String(messagePreview || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}
              </div>
              <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none;">Open Communication</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const emailApiUrl = (Deno.env.get("EMAIL_API_URL") ?? "").replace(/\/+$/, "");
  const companyName = Deno.env.get("COMPANY_NAME") ?? "Ryzent";
  const appBaseUrl = (Deno.env.get("APP_BASE_URL") ?? "https://app.ryzent.com").replace(
    /\/+$/,
    "",
  );

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing Supabase env vars" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  if (!emailApiUrl) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing EMAIL_API_URL secret" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = Date.now();
  const reminderCutoffIso = new Date(now - 5 * 60 * 1000).toISOString();
  const oldestIso = new Date(now - 48 * 60 * 60 * 1000).toISOString();

  const { data: messages, error: msgError } = await admin
    .from("messages")
    .select("id,tenant_id,sender_id,receiver_id,message,created_at")
    .is("channel_id", null)
    .eq("is_read", false)
    .not("receiver_id", "is", null)
    .lte("created_at", reminderCutoffIso)
    .gte("created_at", oldestIso)
    .order("created_at", { ascending: true })
    .limit(300);

  if (msgError) {
    return new Response(
      JSON.stringify({ ok: false, stage: "messages", error: msgError.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  const rows = (messages || []) as MessageRow[];
  if (rows.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, scanned: 0, sent: 0, skipped: 0, repaired: 0 }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  const messageIds = rows.map((m) => m.id);
  const userIds = Array.from(
    new Set(
      rows.flatMap((m) => [m.sender_id, m.receiver_id].filter(Boolean) as string[]),
    ),
  );

  const [{ data: readStatuses }, { data: logRows }, { data: profiles }] =
    await Promise.all([
      admin
        .from("message_read_status")
        .select("message_id,user_id")
        .in("message_id", messageIds),
      admin
        .from("dm_unread_reminder_log")
        .select("message_id,status")
        .in("message_id", messageIds),
      admin.from("profiles").select("id,full_name,email").in("id", userIds),
    ]);

  const readSet = new Set(
    (readStatuses || []).map((r) => `${r.message_id}:${r.user_id}`),
  );
  const sentOrPendingSet = new Set(
    (logRows || [])
      .filter((x) => x.status === "sent" || x.status === "pending")
      .map((x) => x.message_id),
  );
  const profileById = new Map<string, ProfileRow>(
    ((profiles || []) as ProfileRow[]).map((p) => [p.id, p]),
  );

  let sent = 0;
  let skipped = 0;
  let repaired = 0;
  let failed = 0;

  for (const msg of rows) {
    const receiverId = msg.receiver_id;
    if (!receiverId) {
      skipped += 1;
      continue;
    }

    const receiverReadKey = `${msg.id}:${receiverId}`;
    if (readSet.has(receiverReadKey)) {
      await admin.from("messages").update({ is_read: true }).eq("id", msg.id).eq("is_read", false);
      repaired += 1;
      skipped += 1;
      continue;
    }

    if (sentOrPendingSet.has(msg.id)) {
      skipped += 1;
      continue;
    }

    const sender = profileById.get(msg.sender_id);
    const receiver = profileById.get(receiverId);
    const receiverEmail = String(receiver?.email || "").trim();
    if (!receiverEmail) {
      skipped += 1;
      continue;
    }

    const reserve = await admin.from("dm_unread_reminder_log").insert({
      message_id: msg.id,
      tenant_id: msg.tenant_id,
      sender_id: msg.sender_id,
      receiver_id: receiverId,
      receiver_email: receiverEmail,
      status: "pending",
      sent_at: null,
    });
    if (reserve.error) {
      skipped += 1;
      continue;
    }

    const senderName = String(sender?.full_name || "").trim() || "A teammate";
    const receiverName = String(receiver?.full_name || "").trim() || "there";
    const preview = String(msg.message || "You received a direct message.")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);

    const body = unreadDmReminderEmail({
      receiverName,
      senderName,
      messagePreview: preview || "You have an unread direct message.",
      dashboardUrl: `${appBaseUrl}/communication`,
      companyName,
    });

    try {
      const res = await fetch(`${emailApiUrl}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: receiverEmail,
          subject: `Unread message from ${senderName}`,
          html: body,
          companyName,
        }),
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        failed += 1;
        await admin
          .from("dm_unread_reminder_log")
          .update({
            status: "failed",
            error_text: JSON.stringify(payload || { status: res.status }),
            provider_response: payload,
            updated_at: new Date().toISOString(),
          })
          .eq("message_id", msg.id);
        continue;
      }

      sent += 1;
      await admin
        .from("dm_unread_reminder_log")
        .update({
          status: "sent",
          provider_response: payload,
          error_text: null,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("message_id", msg.id);
    } catch (err) {
      failed += 1;
      await admin
        .from("dm_unread_reminder_log")
        .update({
          status: "failed",
          error_text: String(err),
          updated_at: new Date().toISOString(),
        })
        .eq("message_id", msg.id);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      scanned: rows.length,
      sent,
      failed,
      skipped,
      repaired,
    }),
    { headers: { ...cors, "Content-Type": "application/json" } },
  );
});
