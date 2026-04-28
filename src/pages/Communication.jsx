import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Avatar,
  Modal,
  Drawer,
  Form,
  Select,
  Upload,
  Tooltip,
  Popover,
  Input,
} from "antd";
import {
  Hash,
  Plus,
  Send,
  Paperclip,
  Mic,
  MicOff,
  MessageSquare,
  Settings,
  Users,
  Trash2,
  UserPlus,
  Search,
  Smile,
  CornerUpLeft,
  AtSign,
  X,
  FileText,
  CheckCheck,
  Check,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowLeft,
  ChevronLeft,
  Pencil,
  BarChart2,
  Video,
  PhoneCall,
  MessagesSquare,
  UserCircle2,
  Inbox,
  Lock,
  ArrowRight,
  MessageCircle,
  Phone,
  ThumbsUp,
  Star,
  Shield,
  Zap,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;
const GROQ_API_KEY =
  import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const RYZENT_AI_MENTION_RE = /@ryzent\s*ai\b/i;
const RYZENT_AI_PREFIX = "Ryzent AI:";
const RYZENT_AI_USER = {
  id: "__ryzent_ai__",
  full_name: "Ryzent AI",
  role: "assistant",
  user_photo: "/Ryzent.png",
};

const groq = async (systemPrompt, userContent) => {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.25,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error("Groq failed");
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
};

const formatRyzentReply = (raw = "") => {
  const text = String(raw || "").replace(/\r/g, "").trim();
  if (!text) return "I could not find enough information right now.";
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
};

const getIsDarkTheme = () => {
  const root = document.documentElement;
  const body = document.body;
  const rootTheme = root?.getAttribute("data-theme");
  const bodyTheme = body?.getAttribute("data-theme");

  if (
    root?.classList?.contains("dark") ||
    body?.classList?.contains("dark") ||
    rootTheme === "dark" ||
    bodyTheme === "dark"
  )
    return true;
  if (
    root?.classList?.contains("light") ||
    body?.classList?.contains("light") ||
    rootTheme === "light" ||
    bodyTheme === "light"
  )
    return false;

  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const sendEmail = async ({ to, subject, body, companyName }) => {
  try {
    const res = await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html: body, companyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Email send failed:", data);
      return { success: false, error: data };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err.message };
  }
};

const channelAddedEmail = ({
  memberName,
  channelName,
  addedByName,
  companyName,
  dashboardUrl,
}) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Added to #${channelName}</title></head>
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
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">You've been added to a channel.</h1>
              <p style="margin:0 0 32px;font-size:14px;color:#71717a;line-height:1.6;">
                Hi <strong style="color:#18181b;">${memberName}</strong>, <strong style="color:#18181b;">${addedByName}</strong> has added you to
                <strong style="color:#2563eb;">#${channelName}</strong>.
              </p>
              <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none;">Open Channel</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const channelRemovedEmail = ({
  memberName,
  channelName,
  removedByName,
  companyName,
  dashboardUrl,
}) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="background:#fff;border-radius:8px;border:1px solid #e4e4e7;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="height:3px;background:#ef4444;">&nbsp;</td></tr>
            <tr><td style="padding:40px 48px 36px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">You've been removed from a channel.</h1>
              <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">
                Hi <strong>${memberName}</strong>, <strong>${removedByName}</strong> removed you from <strong style="color:#ef4444;">#${channelName}</strong>.
              </p>
              <a href="${dashboardUrl}" style="display:inline-block;background:#18181b;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:6px;text-decoration:none;">Open Dashboard</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

if (!document.getElementById("comm-fonts")) {
  const l = document.createElement("link");
  l.id = "comm-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}

const commStyleElement =
  document.getElementById("comm-css") || document.createElement("style");
if (!commStyleElement.id) {
  commStyleElement.id = "comm-css";
  document.head.appendChild(commStyleElement);
}
commStyleElement.textContent = `
    .comm * { box-sizing:border-box; font-family:'Plus Jakarta Sans',sans-serif; }
    .comm ::-webkit-scrollbar { width:4px; }
    .comm ::-webkit-scrollbar-track { background:transparent; }
    .comm ::-webkit-scrollbar-thumb { background:#2a2b31; border-radius:99px; }
    .comm-light ::-webkit-scrollbar-thumb { background:#cbd5e1; }

    /* ---------------- Dark sidebar item ---------------- */
    .si { display:flex;align-items:center;gap:7px;padding:4px 9px;border-radius:8px;
      cursor:pointer;transition:all .15s;color:var(--si-color,#9ca3af);font-size:12.5px;font-weight:500;
      user-select:none;margin-bottom:1px; }
    .si:hover { background:var(--si-hover-bg,#1e1f25);color:var(--si-hover-color,#e5e7eb); }
    .si.active { background:var(--si-active-bg,linear-gradient(135deg,#1a2540,#1a1d38));color:var(--si-active-color,#60a5fa);font-weight:600;
      box-shadow:0 1px 3px rgba(37,99,235,.15); }

    /* ---------------- Message rows ---------------- */
    .msg-row { position:relative;padding:3px 20px 3px 64px;transition:background .12s; }
    .msg-row:hover { background:var(--msg-hover-bg,#1a1b20); }
    .msg-row.first { padding-top:14px; }
    .msg-row.mention-hl { background:linear-gradient(90deg,#1a2540,#141820);
      border-left:3px solid #3b82f6;padding-left:61px; }
    @media(max-width:640px){
      .msg-row { padding:3px 10px 3px 48px; }
      .msg-row.first { padding-top:12px; }
      .msg-row.mention-hl { padding-left:45px; }
    }
    .msg-toolbar { display:none;position:absolute;top:-18px;right:12px;z-index:20;
      background:#1e1f25;border:1px solid #2a2b31;border-radius:12px;padding:4px 6px;
      gap:2px;align-items:center;box-shadow:0 8px 24px rgba(0,0,0,.4); }
    .msg-row:hover .msg-toolbar { display:flex; }
    .tb { display:flex;align-items:center;justify-content:center;width:30px;height:30px;
      border-radius:8px;border:none;background:none;cursor:pointer;color:#9ca3af;
      transition:background .1s,color .1s; }
    .tb:hover { background:#2a2b31;color:#e5e7eb; }
    .tb.danger:hover { background:rgba(239,68,68,.15);color:#ef4444; }

    /* ---------------- Reaction pills ---------------- */
    .rpill { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;
      border-radius:99px;background:#1e1f25;border:1.5px solid #2a2b31;
      cursor:pointer;font-size:13px;transition:all .12s; }
    .rpill:hover { border-color:#3b82f6;background:#1a2540;transform:scale(1.05); }
    .rpill.own { background:linear-gradient(135deg,#1a2540,#1a1d38);border-color:#3b82f6; }

    /* ---------------- Reply quote bar ---------------- */
    .rq-bar { background:#1a1b20;border-left:3px solid #3b82f6;border-radius:0 8px 8px 0;
      padding:6px 12px;margin-bottom:6px;font-size:12px;cursor:pointer; }
    .rq-bar:hover { background:#1a2540; }

    /* ---------------- Textarea ---------------- */
    .comm-ta { background:transparent;border:none;outline:none;color:#e5e7eb;
      font-size:15px;resize:none;width:100%;padding:10px 0;line-height:1.6;
      font-family:'Plus Jakarta Sans',sans-serif;max-height:160px;overflow-y:auto; }
    .comm-ta::placeholder { color:#4b5563; }

    /* ---------------- Mention list ---------------- */
    .mlist { background:#1e1f25;border:1px solid #2a2b31;border-radius:12px;padding:6px;
      min-width:220px;max-height:260px;overflow-y:auto;
      box-shadow:0 16px 40px rgba(0,0,0,.5); }
    .mitem { display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;cursor:pointer;transition:background .1s; }
    .mitem:hover,.mitem.active { background:#1a2540; }

    /* ---------------- Presence dots ---------------- */
    .dot-active { background:#22c55e;box-shadow:0 0 0 2px #141416,0 0 0 3px rgba(34,197,94,.25); }
    .dot-break  { background:#f59e0b;box-shadow:0 0 0 2px #141416; }
    .dot-off    { background:#374151;box-shadow:0 0 0 2px #141416; }

    /* ---------------- Animations ---------------- */
    @keyframes msgIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    .msg-in { animation:msgIn .2s ease both; }
    @keyframes toastIn { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes toastOut { from{opacity:1} to{opacity:0;transform:translateY(-8px) scale(.96)} }
    .toast-msg { animation:toastIn .25s cubic-bezier(.34,1.56,.64,1) both; }
    .toast-msg.leaving { animation:toastOut .2s ease forwards; }
    @keyframes badgeAppear { from{transform:scale(0)} to{transform:scale(1)} }
    .unread-badge { animation:badgeAppear .2s cubic-bezier(.34,1.56,.64,1) both; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .spin { animation:spin 1s linear infinite; }

    /* ---------------- Date divider ---------------- */
    .datediv { display:flex;align-items:center;gap:12px;margin:18px 24px 8px;
      color:#4b5563;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase; }
    .datediv::before,.datediv::after { content:'';flex:1;height:1px;background:#1e1f25; }

    /* ---------------- Input wrap ---------------- */
    .input-wrap { background:#1a1b20;border:1.5px solid #2a2b31;border-radius:14px;
      transition:border-color .15s,box-shadow .15s;position:relative;overflow:visible; }
    .input-wrap:focus-within { border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12); }

    /* ---------------- Upload progress bar ---------------- */
    .upload-bar { position:absolute;bottom:0;left:0;right:0;height:3px;
      background:#2a2b31;border-radius:0 0 14px 14px;overflow:hidden; }
    .upload-bar-fill { height:100%;background:linear-gradient(90deg,#2563eb,#4f46e5);transition:width .3s; }

    /* ---------------- Member cards ---------------- */
    .mem-card { display:flex;align-items:center;justify-content:space-between;
      padding:12px 14px;border:1.5px solid #1e1f25;border-radius:12px;
      transition:border-color .15s,background .15s;margin-bottom:8px;background:#18191e; }
    .mem-card:hover { border-color:var(--mem-hover-border,#2a2b31);background:var(--mem-hover-bg,#1e1f25); }

    /* ---------------- Media viewer ---------------- */
    .comm-viewer-portal {
      position:fixed;inset:0;z-index:999999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,.92);
      backdrop-filter:blur(8px);
    }
    @keyframes viewerIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    .comm-viewer-inner { animation:viewerIn .2s cubic-bezier(.34,1.2,.64,1) both; }
    .mv-bar { position:absolute;top:0;left:0;right:0;padding:18px 24px;
      display:flex;align-items:center;justify-content:space-between;
      background:linear-gradient(180deg,rgba(0,0,0,.7) 0%,transparent 100%);
      z-index:2; }
    .mv-btn { display:flex;align-items:center;justify-content:center;width:38px;height:38px;
      border-radius:10px;border:none;background:rgba(255,255,255,.12);color:#fff;
      cursor:pointer;transition:background .15s; }
    .mv-btn:hover { background:rgba(255,255,255,.22); }

    /* ---------------- Edit textarea ---------------- */
    .edit-ta { background:#1a1b20;border:1.5px solid #3b82f6;border-radius:10px;outline:none;
      color:#e5e7eb;font-size:15px;resize:none;width:100%;padding:8px 12px;line-height:1.6;
      font-family:'Plus Jakarta Sans',sans-serif;max-height:200px;overflow-y:auto;
      box-shadow:0 0 0 3px rgba(59,130,246,.1); }

    /* ---------------- Deleted message ---------------- */
    .msg-deleted { font-style:italic;color:#4b5563;font-size:14px;display:flex;align-items:center;gap:6px; }

    /* ---------------- Poll card ---------------- */
    .poll-card { background:#1a1b20;border:1.5px solid #2a2b31;border-radius:14px;padding:16px 18px;max-width:340px;margin-bottom:4px; }

    /* ---------------- Skeleton shimmer ---------------- */
    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    .skeleton {
      background: linear-gradient(90deg, var(--sk1, #e2e8f0) 25%, var(--sk2, #f1f5f9) 50%, var(--sk1, #e2e8f0) 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s ease-in-out infinite;
      border-radius: 6px;
    }
    .skeleton-circle {
      background: linear-gradient(90deg, var(--sk1, #e2e8f0) 25%, var(--sk2, #f1f5f9) 50%, var(--sk1, #e2e8f0) 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s ease-in-out infinite;
      border-radius: 50%;
    }

    /* ---------------- Mobile ---------------- */
    @media(max-width:768px){
      .comm-sidebar { position:fixed!important;left:0;top:0;bottom:0;z-index:50;width:280px!important;
        transform:translateX(-100%);transition:transform .25s cubic-bezier(.4,0,.2,1); }
      .comm-sidebar.open { transform:translateX(0)!important;box-shadow:8px 0 40px rgba(0,0,0,.5); }
      .mob-overlay { display:block!important; }
      .si { font-size:12px; padding:4px 8px; }
    }
    .mob-overlay { display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:40; }
    .dm-tick { display:flex;align-items:center;gap:3px;margin-top:4px;transition:all .2s; }

    /* ---------------- Ant Design dark overrides ---------------- */
    .comm .ant-drawer-content { background:#1a1b20 !important; }
    .comm .ant-drawer-header { background:#1e1f25 !important; border-bottom:1px solid #2a2b31 !important; }
    .comm .ant-modal-content { background:#1a1b20 !important; border:1px solid #2a2b31; }
    .comm .ant-modal-header { background:#1e1f25 !important; border-bottom:1px solid #2a2b31 !important; }
    .comm .ant-modal-title { color:#e5e7eb !important; }
    .comm .ant-form-item-label > label { color:#9ca3af !important; }
    .comm .ant-input { background:#141416 !important; border-color:#2a2b31 !important; color:#e5e7eb !important; }
    .comm .ant-input:focus { border-color:#3b82f6 !important; box-shadow:0 0 0 2px rgba(59,130,246,.15) !important; }
    .comm .ant-input-affix-wrapper { background:#141416 !important; border-color:#2a2b31 !important; color:#e5e7eb !important; }
    .comm .ant-input-affix-wrapper:focus-within { border-color:#3b82f6 !important; }
    .comm .ant-select-selector { background:#141416 !important; border-color:#2a2b31 !important; color:#e5e7eb !important; }
    .comm .ant-select-selection-placeholder { color:#4b5563 !important; }
    .comm .ant-select-dropdown { background:#1e1f25 !important; border:1px solid #2a2b31; }
    .comm .ant-select-item { color:#9ca3af !important; }
    .comm .ant-select-item-option-active { background:#1a2540 !important; color:#60a5fa !important; }
    .comm .ant-select-item-option-selected { background:#1a2540 !important; color:#60a5fa !important; }
    .comm .ant-btn-primary { background:#2563eb !important; border-color:#2563eb !important; }
    .comm .ant-modal-footer .ant-btn-default { background:#1e1f25 !important; border-color:#2a2b31 !important; color:#9ca3af !important; }
    .comm .ant-tooltip-inner { background:#1e1f25 !important; color:#e5e7eb !important; border:1px solid #2a2b31; }

    /* ---------------- Light theme overrides ---------------- */
    .comm-light .si { color:#475569; }
    .comm-light .si:hover { background:#f1f5f9; color:#0f172a; }
    .comm-light .si.active {
      background:linear-gradient(135deg,#e8f0ff,#eef4ff);
      color:#1d4ed8;
      box-shadow:0 1px 3px rgba(37,99,235,.1);
    }
    .comm-light .msg-row:hover { background:#f8fafc; }
    .comm-light .msg-row.mention-hl {
      background:linear-gradient(90deg,#eff6ff,#f8fbff);
      border-left-color:#3b82f6;
    }
    .comm-light .msg-toolbar {
      background:#ffffff;
      border-color:#dbe2ea;
      box-shadow:0 8px 24px rgba(15,23,42,.12);
    }
    .comm-light .tb { color:#64748b; }
    .comm-light .tb:hover { background:#f1f5f9; color:#0f172a; }
    .comm-light .rpill { background:#f8fafc; border-color:#dbe2ea; }
    .comm-light .rpill:hover { background:#eff6ff; border-color:#93c5fd; }
    .comm-light .rpill.own { background:linear-gradient(135deg,#dbeafe,#eff6ff); border-color:#93c5fd; }
    .comm-light .rq-bar { background:#f8fafc; }
    .comm-light .rq-bar:hover { background:#eff6ff; }
    .comm-light .comm-ta { color:#0f172a; }
    .comm-light .comm-ta::placeholder { color:#94a3b8; }
    .comm-light .mlist {
      background:#ffffff;
      border-color:#dbe2ea;
      box-shadow:0 16px 40px rgba(15,23,42,.12);
    }
    .comm-light .mitem:hover,.comm-light .mitem.active { background:#eff6ff; }
    .comm-light .dot-active { box-shadow:0 0 0 2px #ffffff,0 0 0 3px rgba(34,197,94,.25); }
    .comm-light .dot-break  { box-shadow:0 0 0 2px #ffffff; }
    .comm-light .dot-off    { background:#94a3b8; box-shadow:0 0 0 2px #ffffff; }
    .comm-light .datediv { color:#94a3b8; }
    .comm-light .datediv::before,.comm-light .datediv::after { background:#e2e8f0; }
    .comm-light .input-wrap { background:#ffffff; border-color:#dbe2ea; }
    .comm-light .upload-bar { background:#e2e8f0; }
    .comm-light .mem-card { background:#ffffff; border-color:#dbe2ea; }
    .comm-light .mem-card:hover { background:#f8fafc; border-color:#cbd5e1; }
    .comm-light .edit-ta {
      background:#ffffff;
      border-color:#93c5fd;
      color:#0f172a;
      box-shadow:0 0 0 3px rgba(59,130,246,.08);
    }
    .comm-light .msg-deleted { color:#94a3b8; }
    .comm-light .poll-card { background:#ffffff; border-color:#dbe2ea; }
    .comm-light .comm-sidebar.open { box-shadow:8px 0 40px rgba(15,23,42,.16); }
    .comm-light .mob-overlay { background:rgba(15,23,42,.45); }

    .comm-light .ant-drawer-content { background:#ffffff !important; }
    .comm-light .ant-drawer-header { background:#f8fafc !important; border-bottom:1px solid #e2e8f0 !important; }
    .comm-light .ant-modal-content { background:#ffffff !important; border:1px solid #e2e8f0 !important; }
    .comm-light .ant-modal-header { background:#f8fafc !important; border-bottom:1px solid #e2e8f0 !important; }
    .comm-light .ant-modal-title { color:#0f172a !important; }
    .comm-light .ant-form-item-label > label { color:#475569 !important; }
    .comm-light .ant-input,
    .comm-light .ant-input-affix-wrapper,
    .comm-light .ant-select-selector {
      background:#ffffff !important;
      border-color:#dbe2ea !important;
      color:#0f172a !important;
    }
    .comm-light .ant-input:focus,
    .comm-light .ant-input-affix-wrapper:focus-within {
      border-color:#3b82f6 !important;
      box-shadow:0 0 0 2px rgba(59,130,246,.12) !important;
    }
    .comm-light .ant-select-selection-placeholder { color:#94a3b8 !important; }
    .comm-light .ant-select-dropdown { background:#ffffff !important; border:1px solid #dbe2ea !important; }
    .comm-light .ant-select-item { color:#334155 !important; }
    .comm-light .ant-select-item-option-active { background:#eff6ff !important; color:#1d4ed8 !important; }
    .comm-light .ant-select-item-option-selected { background:#dbeafe !important; color:#1d4ed8 !important; }
    .comm-light .ant-modal-footer .ant-btn-default { background:#ffffff !important; border-color:#dbe2ea !important; color:#475569 !important; }
    .comm-light .ant-tooltip-inner { background:#ffffff !important; color:#0f172a !important; border:1px solid #dbe2ea; }
  `;

const QUICK = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];
const ALL_EMOJI = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "😎",
  "🤝",
  "👏",
  "👍",
  "👎",
  "🙏",
  "🎉",
  "🔥",
  "💡",
  "✅",
  "❗",
  "❤️",
  "💬",
  "📌",
  "🚀",
  "💼",
  "🧠",
  "⭐",
  "📈",
  "🛠️",
  "📎",
  "🎯",
  "🧾",
  "📢",
  "🔒",
  "🌟",
];
let toastId = 0;

const DmStatusTick = ({ isRead, receiverOnline }) => {
  if (isRead) {
    return (
      <Tooltip title="Seen" placement="right">
        <div className="dm-tick">
          <CheckCheck size={14} color="#2563eb" strokeWidth={2.5} />
          <span style={{ fontSize: 10, color: "#2563eb", fontWeight: 700 }}>
            Seen
          </span>
        </div>
      </Tooltip>
    );
  }
  if (receiverOnline) {
    return (
      <Tooltip title="Delivered" placement="right">
        <div className="dm-tick">
          <CheckCheck size={14} color="#4b5563" strokeWidth={2} />
          <span style={{ fontSize: 10, color: "#4b5563", fontWeight: 600 }}>
            Delivered
          </span>
        </div>
      </Tooltip>
    );
  }
  return (
    <Tooltip title="Sent" placement="right">
      <div className="dm-tick">
        <Check size={13} color="#374151" strokeWidth={2} />
        <span style={{ fontSize: 10, color: "#374151", fontWeight: 500 }}>
          Sent
        </span>
      </div>
    </Tooltip>
  );
};

const getSkeletonGradient = (dark) =>
  dark
    ? "linear-gradient(90deg, #1d1f24 25%, #252830 50%, #1d1f24 75%)"
    : "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)";

const SkeletonSidebarItem = ({ dark = false }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      marginBottom: 2,
    }}
  >
    <div
      className="skeleton-circle"
      style={{
        width: 28,
        height: 28,
        flexShrink: 0,
        background: getSkeletonGradient(dark),
      }}
    />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
      <div
        className="skeleton"
        style={{
          height: 11,
          width: "65%",
          borderRadius: 4,
          background: getSkeletonGradient(dark),
        }}
      />
      <div
        className="skeleton"
        style={{
          height: 9,
          width: "40%",
          borderRadius: 4,
          background: getSkeletonGradient(dark),
        }}
      />
    </div>
  </div>
);

const SkeletonChannelItem = ({ dark = false }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      marginBottom: 2,
    }}
  >
    <div
      className="skeleton"
      style={{
        width: 14,
        height: 14,
        flexShrink: 0,
        borderRadius: 3,
        background: getSkeletonGradient(dark),
      }}
    />
    <div
      className="skeleton"
      style={{
        height: 11,
        width: "55%",
        borderRadius: 4,
        background: getSkeletonGradient(dark),
      }}
    />
  </div>
);

const SkeletonMessage = ({ wide = false, hasAvatar = true, dark = false }) => (
  <div
    style={{
      padding: "12px 24px 6px 72px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}
  >
    {hasAvatar && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "relative",
        }}
      >
        <div
          className="skeleton-circle"
          style={{
            position: "absolute",
            left: -50,
            width: 36,
            height: 36,
            background: getSkeletonGradient(dark),
          }}
        />
        <div
          className="skeleton"
          style={{
            height: 11,
            width: 80,
            borderRadius: 4,
            background: getSkeletonGradient(dark),
          }}
        />
        <div
          className="skeleton"
          style={{
            height: 9,
            width: 44,
            borderRadius: 4,
            background: getSkeletonGradient(dark),
          }}
        />
      </div>
    )}
    <div
      className="skeleton"
      style={{
        height: 14,
        width: wide ? "72%" : "45%",
        borderRadius: 5,
        background: getSkeletonGradient(dark),
      }}
    />
    {wide && (
      <div
        className="skeleton"
        style={{
          height: 14,
          width: "55%",
          borderRadius: 5,
          background: getSkeletonGradient(dark),
        }}
      />
    )}
  </div>
);

const CommunicationAccessSkeleton = ({ dark = false }) => (
  <div
    className="comm"
    style={{
      height: "calc(100vh - 64px)",
      background: dark ? "#141416" : "#f8fafc",
      padding: 20,
      display: "flex",
      gap: 16,
      "--sk1": dark ? "#1d1f24" : "#e2e8f0",
      "--sk2": dark ? "#252830" : "#f1f5f9",
    }}
  >
    <div
      style={{
        width: 260,
        border: `1.5px solid ${dark ? "#2a2b31" : "#e2e8f0"}`,
        borderRadius: 14,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        className="skeleton"
        style={{ height: 28, width: "72%", background: getSkeletonGradient(dark) }}
      />
      <div
        className="skeleton"
        style={{ height: 34, width: "100%", background: getSkeletonGradient(dark) }}
      />
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonSidebarItem key={i} dark={dark} />
      ))}
    </div>
    <div
      style={{
        flex: 1,
        border: `1.5px solid ${dark ? "#2a2b31" : "#e2e8f0"}`,
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1.5px solid ${dark ? "#2a2b31" : "#e2e8f0"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          className="skeleton"
          style={{ height: 16, width: 180, background: getSkeletonGradient(dark) }}
        />
        <div
          className="skeleton"
          style={{ height: 30, width: 92, background: getSkeletonGradient(dark) }}
        />
      </div>
      <div style={{ flex: 1, paddingTop: 8 }}>
        <SkeletonMessage wide dark={dark} />
        <SkeletonMessage dark={dark} />
        <SkeletonMessage wide={false} hasAvatar={false} dark={dark} />
        <SkeletonMessage wide dark={dark} />
      </div>
      <div
        style={{ padding: 14, borderTop: `1.5px solid ${dark ? "#2a2b31" : "#e2e8f0"}` }}
      >
        <div
          className="skeleton"
          style={{
            height: 48,
            width: "100%",
            background: getSkeletonGradient(dark),
          }}
        />
      </div>
    </div>
  </div>
);

const EmptyState = ({
  icon: Icon,
  title,
  subtitle,
  iconColor = "#4b5563",
  iconBg = "#1e1f25",
}) => (
  <div
    style={{
      padding: "28px 16px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 2,
      }}
    >
      <Icon size={20} color={iconColor} strokeWidth={1.5} />
    </div>
    <div style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af" }}>
      {title}
    </div>
    {subtitle && (
      <div
        style={{
          fontSize: 11.5,
          color: "#4b5563",
          lineHeight: 1.5,
          maxWidth: 180,
        }}
      >
        {subtitle}
      </div>
    )}
  </div>
);

const DM_FALLBACK_BACKGROUNDS = [
  "linear-gradient(135deg, #0f172a, #1e293b)",
  "linear-gradient(135deg, #111827, #1f2937)",
  "linear-gradient(135deg, #172554, #1e3a8a)",
  "linear-gradient(135deg, #312e81, #3730a3)",
  "linear-gradient(135deg, #083344, #0f766e)",
  "linear-gradient(135deg, #3f1d2e, #4c1d95)",
];

const pickDmFallbackBackground = (user) => {
  const seed = String(user?.id || user?.email || user?.full_name || "user");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return DM_FALLBACK_BACKGROUNDS[Math.abs(hash) % DM_FALLBACK_BACKGROUNDS.length];
};

const Ava = ({ user, size = 34, dot, variant = "default" }) => {
  const dc =
    dot === "active"
      ? "dot-active"
      : dot === "break"
        ? "dot-break"
        : dot === "off"
          ? "dot-off"
          : null;
  const isDmVariant = variant === "dm";
  const hasPhoto = Boolean(user?.user_photo);
  const dmRadius = Math.max(9, Math.round(size * 0.32));
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <Avatar
        shape={isDmVariant ? "square" : "circle"}
        src={user?.user_photo}
        size={size}
        style={{
          color: isDmVariant ? "#f8fafc" : "#60a5fa",
          fontSize: size * 0.38,
          fontWeight: 700,
          borderRadius: isDmVariant ? dmRadius : "50%",
          background: !hasPhoto && isDmVariant
            ? pickDmFallbackBackground(user)
            : undefined,
          border: isDmVariant ? "1px solid rgba(255,255,255,0.12)" : "none",
          boxShadow: isDmVariant
            ? "0 2px 8px rgba(2,6,23,0.24)"
            : "none",
        }}
      >
        {!user?.user_photo && (user?.full_name?.[0]?.toUpperCase() || "?")}
      </Avatar>
      {dc && (
        <span
          className={dc}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 7,
            height: 7,
            borderRadius: "50%",
            display: "block",
          }}
        />
      )}
    </div>
  );
};

const tFmt = (ts) => {
  const d = new Date(ts),
    now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" }) +
        " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const seenAtFmt = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const escRe = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const renderText = (text, mentionUsers = []) => {
  if (!text) return null;

  const mentionNames = [...new Set(
    mentionUsers
      .map((u) => (u?.full_name || "").trim())
      .filter(Boolean),
  )].sort((a, b) => b.length - a.length);

  const mentionRegex = mentionNames.length
    ? new RegExp(
        `@(?:${mentionNames.map((n) => escRe(n)).join("|")})(?=\\s|$|[.,!?;:])`,
        "gi",
      )
    : /@[\w]+/g;
  const urlRegex = /https?:\/\/[^\s<>"']+/gi;

  const tokens = [];
  let m;
  while ((m = mentionRegex.exec(text)) !== null) {
    tokens.push({
      type: "mention",
      start: m.index,
      end: m.index + m[0].length,
      value: m[0],
    });
  }
  while ((m = urlRegex.exec(text)) !== null) {
    let rawUrl = m[0];
    let end = m.index + rawUrl.length;
    const trailing = rawUrl.match(/[.,!?;:]+$/);
    if (trailing) {
      rawUrl = rawUrl.slice(0, rawUrl.length - trailing[0].length);
      end -= trailing[0].length;
    }
    if (!rawUrl) continue;
    tokens.push({
      type: "url",
      start: m.index,
      end,
      value: rawUrl,
    });
  }

  tokens.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - a.end;
  });

  const parts = [];
  let lastIndex = 0;
  for (const token of tokens) {
    if (token.start < lastIndex) continue;
    if (token.start > lastIndex) {
      parts.push(text.slice(lastIndex, token.start));
    }

    if (token.type === "mention") {
      parts.push(
        <span
          key={`${token.type}-${token.start}-${token.value}`}
          style={{
            color: "#60a5fa",
            fontWeight: 700,
            background: "rgba(59,130,246,.15)",
            borderRadius: 4,
            padding: "1px 4px",
          }}
        >
          {token.value}
        </span>,
      );
    } else {
      parts.push(
        <a
          key={`${token.type}-${token.start}-${token.value}`}
          href={token.value}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#2563eb",
            fontWeight: 700,
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          {token.value}
        </a>,
      );
    }

    lastIndex = token.end;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
};

const extOf = (name = "") => name.split(".").pop()?.toUpperCase() || "FILE";

/* -------------- MEDIA VIEWER ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
const MediaViewer = ({ item, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const isImg = item.file_type === "image";

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const content = (
    <div className="comm-viewer-portal" onClick={onClose}>
      <div className="mv-bar" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="mv-btn" onClick={onClose}>
            <ChevronLeft size={18} />
          </button>
          <span
            style={{
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              maxWidth: "45vw",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.file_name || "File"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isImg && (
            <>
              <button
                className="mv-btn"
                onClick={() => setZoom((z) => Math.min(z + 0.3, 4))}
              >
                <ZoomIn size={16} />
              </button>
              <button
                className="mv-btn"
                onClick={() => setZoom((z) => Math.max(z - 0.3, 0.4))}
              >
                <ZoomOut size={16} />
              </button>
              <button className="mv-btn" onClick={() => setZoom(1)}>
                <RotateCcw size={15} />
              </button>
            </>
          )}
          {item.file_type !== "video" && (
            <>
              <a
                href={item.file_url}
                download={item.file_name}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <button className="mv-btn">
                  <Download size={16} />
                </button>
              </a>
              <button
                className="mv-btn"
                style={{ background: "rgba(239,68,68,.3)" }}
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {isImg && (
        <div
          className="comm-viewer-inner"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "90vw",
            maxHeight: "86vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={item.file_url}
            alt={item.file_name}
            style={{
              maxWidth: "90vw",
              maxHeight: "86vh",
              objectFit: "contain",
              borderRadius: 16,
              boxShadow: "0 40px 100px rgba(0,0,0,.8)",
              transform: `scale(${zoom})`,
              transition: "transform .2s ease",
              cursor: zoom > 1 ? "grab" : "zoom-in",
              display: "block",
            }}
            onClick={() => setZoom((z) => (z < 2 ? z + 0.5 : 1))}
          />
        </div>
      )}

      {item.file_type === "video" && (
        <div
          className="comm-viewer-inner"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(96vw,1100px)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(0,0,0,.9)",
            background: "#000",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              minHeight: 0,
            }}
          >
            <video
              src={item.file_url}
              controls
              autoPlay
              playsInline
              style={{
                width: "100%",
                maxHeight: "calc(90vh - 64px)",
                display: "block",
                objectFit: "contain",
              }}
            />
          </div>
          <div
            style={{
              padding: "14px 20px",
              background: "rgba(0,0,0,.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backdropFilter: "blur(10px)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Video size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  {item.file_name || "Video"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,.4)",
                    marginTop: 2,
                  }}
                >
                  {extOf(item.file_name)} Video
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a
                href={item.file_url}
                download={item.file_name}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    background: "rgba(255,255,255,.1)",
                    border: "1px solid rgba(255,255,255,.15)",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                  }}
                >
                  <Download size={13} /> Download
                </button>
              </a>
              <button
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(239,68,68,.2)",
                  border: "1px solid rgba(239,68,68,.3)",
                  cursor: "pointer",
                  color: "#fca5a5",
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {item.file_type === "document" && (
        <div
          className="comm-viewer-inner"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(92vw,960px)",
            height: "min(88vh,800px)",
            background: "#1a1b20",
            borderRadius: 20,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 40px 100px rgba(0,0,0,.8)",
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1.5px solid #2a2b31",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#1e1f25",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={18} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#e5e7eb",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.file_name}
              </div>
              <div style={{ fontSize: 11, color: "#4b5563", marginTop: 1 }}>
                {extOf(item.file_name)} Document
              </div>
            </div>
            <a
              href={item.file_url}
              download={item.file_name}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  background: "#2a2b31",
                  border: "1.5px solid #374151",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#e5e7eb",
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              >
                <Download size={13} /> Download
              </button>
            </a>
            <button
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "rgba(239,68,68,.15)",
                border: "1.5px solid rgba(239,68,68,.25)",
                cursor: "pointer",
                color: "#ef4444",
              }}
            >
              <X size={15} />
            </button>
          </div>
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(item.file_url)}&embedded=true`}
            style={{ flex: 1, border: "none", display: "block" }}
            title={item.file_name}
          />
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};

const EmojiPicker = ({ onSelect, dark = false }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 3,
      width: 224,
      padding: 4,
      background: dark ? "#1e1f25" : "#ffffff",
      border: `1px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
      borderRadius: 10,
    }}
  >
    {ALL_EMOJI.map((e) => (
      <button
        key={e}
        onClick={() => onSelect(e)}
        style={{
          background: "none",
          border: "none",
          fontSize: 20,
          cursor: "pointer",
          padding: "4px 5px",
          borderRadius: 8,
          transition: "all .1s",
        }}
        onMouseEnter={(ev) => {
          ev.target.style.background = dark ? "#2a2b31" : "#eef2f7";
          ev.target.style.transform = "scale(1.2)";
        }}
        onMouseLeave={(ev) => {
          ev.target.style.background = "none";
          ev.target.style.transform = "scale(1)";
        }}
      >
        {e}
      </button>
    ))}
  </div>
);

const ReactionViewer = ({ reacts, users, profile, dark = false }) => {
  const [active, setActive] = useState(null);
  const entries = Object.values(reacts);
  const cur = active || entries[0]?.emoji;
  return (
    <div
      style={{
        width: 240,
        padding: "8px",
        background: dark ? "#1e1f25" : "#ffffff",
        border: `1px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
        borderRadius: 10,
      }}
    >
      <div
        style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}
      >
        {entries.map((r) => (
          <button
            key={r.emoji}
            onClick={() => setActive(r.emoji)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 99,
              border: "1.5px solid",
              borderColor: cur === r.emoji ? "#3b82f6" : dark ? "#2a2b31" : "#dbe2ea",
              background: cur === r.emoji ? (dark ? "#1a2540" : "#eff6ff") : dark ? "#1e1f25" : "#f8fafc",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              color: cur === r.emoji ? "#2563eb" : dark ? "#6b7280" : "#64748b",
              transition: "all .12s",
            }}
          >
            <span>{r.emoji}</span>
            <span style={{ fontSize: 11 }}>{r.count}</span>
          </button>
        ))}
      </div>
      {reacts[cur]?.users.map((uid) => {
        const u =
          uid === profile.id ? profile : users.find((x) => x.id === uid);
        return (
          <div
            key={uid}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 8px",
              borderRadius: 8,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = dark ? "#1e1f25" : "#f1f5f9")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
            >
              <Ava user={u} size={26} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: dark ? "#e5e7eb" : "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {uid === profile.id ? "You" : u?.full_name || "Unknown"}
              </span>
            </div>
            <span style={{ fontSize: 18, flexShrink: 0, marginLeft: 10 }}>
              {cur}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const SeenByViewer = ({ entries, users, dark = false }) => {
  const sorted = [...(entries || [])].sort((a, b) => {
    const ta = new Date(a?.read_at || 0).getTime();
    const tb = new Date(b?.read_at || 0).getTime();
    return tb - ta;
  });

  return (
    <div
      style={{
        width: 260,
        maxHeight: 280,
        overflowY: "auto",
        padding: 8,
        background: dark ? "#1e1f25" : "#ffffff",
        border: `1px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
        borderRadius: 10,
      }}
    >
      {sorted.map((entry) => {
        const u = users.find((x) => x.id === entry.user_id);
        return (
          <div
            key={entry.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "6px 8px",
              borderRadius: 8,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = dark ? "#1a1b20" : "#f8fafc")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <Ava user={u} size={24} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: dark ? "#e5e7eb" : "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {u?.full_name || "Someone"}
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                color: dark ? "#9ca3af" : "#64748b",
                flexShrink: 0,
              }}
            >
              {seenAtFmt(entry.read_at) || "Seen"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const Toolbar = ({ msg, isOwn, onReact, onReply, onEdit, onDelete, dark = false }) => (
  <div className="msg-toolbar">
    {QUICK.map((e) => (
      <button
        key={e}
        className="tb"
        style={{ fontSize: 16 }}
        onClick={() => onReact(msg.id, e)}
      >
        {e}
      </button>
    ))}
    <Popover
      content={<EmojiPicker onSelect={(e) => onReact(msg.id, e)} dark={dark} />}
      trigger="click"
      placement="topRight"
    >
      <button className="tb">
        <Smile size={14} />
      </button>
    </Popover>
    <div
      style={{
        width: 1,
        height: 18,
        background: dark ? "#2a2b31" : "#dbe2ea",
        margin: "0 2px",
      }}
    />
    <button className="tb" onClick={() => onReply(msg)}>
      <CornerUpLeft size={14} />
    </button>
    {isOwn && !msg.is_deleted && msg.message && (
      <button className="tb" onClick={() => onEdit(msg)}>
        <Pencil size={13} />
      </button>
    )}
    {isOwn && (
      <button className="tb danger" onClick={() => onDelete(msg.id)}>
        <Trash2 size={13} />
      </button>
    )}
  </div>
);

const PollCard = ({ msg, profile, onVote, dark = false }) => {
  const poll = msg.poll;
  if (!poll || !poll.options) return null;
  const totalVotes = poll.options.reduce(
    (s, o) => s + (o.votes?.length || 0),
    0,
  );
  const myVoteIdx = poll.options.findIndex((o) =>
    (o.votes || []).includes(profile.id),
  );
  const hasVoted = myVoteIdx !== -1;
  const maxVotes = Math.max(
    1,
    ...poll.options.map((o) => o.votes?.length || 0),
  );

  return (
    <div
      style={{
        background: dark ? "#1a1b20" : "#ffffff",
        border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
        borderRadius: 16,
        padding: "18px 20px",
        maxWidth: 360,
        marginBottom: 6,
        boxShadow: dark
          ? "0 2px 12px rgba(0,0,0,.3)"
          : "0 2px 10px rgba(15,23,42,.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "linear-gradient(135deg,#2563eb,#4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BarChart2 size={16} color="#fff" />
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: dark ? "#e5e7eb" : "#0f172a",
              lineHeight: 1.4,
            }}
          >
            {poll.question}
          </div>
          <div
            style={{
              fontSize: 11,
              color: dark ? "#4b5563" : "#64748b",
              marginTop: 2,
            }}
          >
            {poll.closed
              ? "Poll closed"
              : hasVoted
                ? `You voted · ${totalVotes} vote${totalVotes !== 1 ? "s" : ""}`
                : `${totalVotes} vote${totalVotes !== 1 ? "s" : ""} · Tap to vote`}
          </div>
        </div>
      </div>
      <div
        style={{
          height: 1,
          background: dark ? "#2a2b31" : "#e2e8f0",
          margin: "12px 0",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {poll.options.map((opt, i) => {
          const votes = opt.votes?.length || 0;
          const pct =
            totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isMyVote = hasVoted && myVoteIdx === i;
          const isWinner = votes > 0 && votes === maxVotes;
          const canVote = !poll.closed;
          return (
            <div
              key={i}
              onClick={() => canVote && onVote(msg.id, i)}
              style={{
                position: "relative",
                borderRadius: 10,
                overflow: "hidden",
                border: `1.5px solid ${isMyVote ? "#22c55e" : isWinner && hasVoted ? "#22c55e" : dark ? "#2a2b31" : "#dbe2ea"}`,
                background: isMyVote
                  ? (dark ? "#0d2318" : "#ecfdf5")
                  : isWinner && hasVoted
                    ? (dark ? "#0d2318" : "#ecfdf5")
                    : dark
                      ? "#1e1f25"
                      : "#f8fafc",
                cursor: canVote ? "pointer" : "default",
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: isMyVote
                    ? "rgba(34,197,94,.12)"
                    : isWinner && hasVoted
                      ? "rgba(34,197,94,.1)"
                      : dark
                        ? "rgba(255,255,255,.02)"
                        : "rgba(15,23,42,.02)",
                  transition: "width .5s ease",
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    flexShrink: 0,
                    border: `2px solid ${isMyVote ? "#22c55e" : isWinner && hasVoted ? "#22c55e" : dark ? "#374151" : "#94a3b8"}`,
                    background: isMyVote
                      ? "#22c55e"
                      : isWinner && hasVoted
                        ? "#22c55e"
                        : dark
                          ? "#141416"
                          : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isMyVote && (
                    <Check size={10} color="#fff" strokeWidth={3} />
                  )}
                  {!isMyVote && isWinner && hasVoted && (
                    <Check size={10} color="#fff" strokeWidth={3} />
                  )}
                </div>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: isMyVote ? 700 : 500,
                    color: dark ? "#e5e7eb" : "#0f172a",
                  }}
                >
                  {opt.text}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isMyVote
                      ? "#22c55e"
                      : isWinner && hasVoted
                        ? "#22c55e"
                        : dark
                          ? "#4b5563"
                          : "#64748b",
                    minWidth: 32,
                    textAlign: "right",
                  }}
                >
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, color: dark ? "#4b5563" : "#64748b" }}>
          {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
        </span>
        {hasVoted && !poll.closed && (
          <button
            onClick={() => onVote(msg.id, myVoteIdx)}
            style={{
              fontSize: 11,
              color: dark ? "#4b5563" : "#64748b",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Remove vote
          </button>
        )}
      </div>
    </div>
  );
};

const MeetingCard = ({ msg, dark = false }) => {
  const meta = msg.meeting_meta;
  if (!meta) return null;
  const isVideo = meta.type === "video";
  const isLive = meta.status === "live";
  const cardBg = dark ? "#1a1b20" : "#ffffff";
  const cardBorder = dark ? "#2a2b31" : "#dbe2ea";
  const titleColor = dark ? "#e5e7eb" : "#0f172a";
  const subColor = dark ? "#4b5563" : "#64748b";
  const secondaryBtnBg = dark ? "#1e1f25" : "#f8fafc";
  const secondaryBtnText = dark ? "#9ca3af" : "#475569";
  const cardShadow = dark
    ? "0 2px 12px rgba(0,0,0,.3)"
    : "0 8px 24px rgba(15,23,42,.12)";
  const primaryShadow = isVideo
    ? "0 3px 10px rgba(37,99,235,.3)"
    : "0 3px 10px rgba(22,163,74,.28)";

  return (
    <div
      style={{
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        borderRadius: 14,
        padding: "14px 16px",
        maxWidth: 320,
        marginBottom: 4,
        boxShadow: cardShadow,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: isVideo
              ? "linear-gradient(135deg,#2563eb,#4f46e5)"
              : "linear-gradient(135deg,#16a34a,#15803d)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isVideo ? (
            <Video size={17} color="#fff" />
          ) : (
            <PhoneCall size={17} color="#fff" />
          )}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: titleColor }}>
            {meta.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: isLive ? "#22c55e" : subColor,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {isLive && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
            )}
            {isLive ? "Live · Join now" : "Scheduled"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() =>
            window.location.assign(
              `/meet/${meta.room_id}${meta.meeting_id ? `?meetingId=${meta.meeting_id}` : ""}`,
            )
          }
          style={{
            flex: 1,
            padding: "8px 0",
            borderRadius: 9,
            border: "none",
            background: isVideo
              ? "linear-gradient(135deg,#2563eb,#4f46e5)"
              : "linear-gradient(135deg,#16a34a,#15803d)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans',sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            boxShadow: primaryShadow,
          }}
        >
          {isVideo ? <Video size={13} /> : <PhoneCall size={13} />}
          Join {isVideo ? "Video" : "Audio"} Call
        </button>
        <button
          onClick={() =>
            navigator.clipboard?.writeText(
              `${window.location.origin}/meet/${meta.room_id}`,
            )
          }
          style={{
            padding: "8px 12px",
            borderRadius: 9,
            border: `1.5px solid ${cardBorder}`,
            background: secondaryBtnBg,
            color: secondaryBtnText,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans',sans-serif",
          }}
        >
          Copy Link
        </button>
      </div>
    </div>
  );
};

const MsgRow = ({
  msg,
  prev,
  dark,
  profile,
  users,
  presence,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onScrollTo,
  onView,
  onVote,
}) => {
  const isRyzentAiMsg =
    typeof msg.message === "string" && msg.message.startsWith(RYZENT_AI_PREFIX);
  const isOwn = msg.sender_id === profile.id && !isRyzentAiMsg;
  const sender = msg.sender || users.find((u) => u.id === msg.sender_id) || {};
  const displayUser = isRyzentAiMsg ? RYZENT_AI_USER : isOwn ? profile : sender;
  const name = isOwn ? "You" : displayUser.full_name || "Unknown";
  const isFirst =
    !prev ||
    prev.sender_id !== msg.sender_id ||
    new Date(msg.created_at) - new Date(prev.created_at) > 300000;
  const isMention = msg.message?.includes(`@${profile.full_name}`);
  const isOnline = isRyzentAiMsg || (!isOwn && !!presence[msg.sender_id]);
  const dot = isOwn ? null : isOnline ? "active" : "off";

  const isDm = !msg.channel_id;
  const showDmStatus = isOwn && isDm && !msg.is_deleted;
  const receiverOnline = isDm && !!presence[msg.receiver_id];
  const readEntries = (msg.read_by || [])
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "string")
        return { user_id: entry, read_at: null, key: entry };
      const userId = entry.user_id || entry.id || null;
      if (!userId) return null;
      const readAt = entry.read_at || entry.created_at || null;
      return { user_id: userId, read_at: readAt, key: `${userId}:${readAt || ""}` };
    })
    .filter(Boolean);
  const isDmSeen =
    !!msg.is_read ||
    (isDm &&
      !!msg.receiver_id &&
      readEntries.some((r) => r.user_id === msg.receiver_id));

  const [editText, setEditText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const startEdit = (m) => {
    setEditText(m.message || "");
    setIsEditing(true);
  };
  const cancelEdit = () => setIsEditing(false);
  const submitEdit = async () => {
    if (!editText.trim()) return;
    await onEdit(msg.id, editText.trim());
    setIsEditing(false);
  };

  const reacts = (msg.reactions || []).reduce((a, r) => {
    if (!a[r.emoji])
      a[r.emoji] = { emoji: r.emoji, count: 0, users: [], own: false };
    a[r.emoji].count++;
    a[r.emoji].users.push(r.user_id);
    if (r.user_id === profile.id) a[r.emoji].own = true;
    return a;
  }, {});

  return (
    <div
      className={`msg-row msg-in${isFirst ? " first" : ""}${isMention ? " mention-hl" : ""}`}
    >
      <Toolbar
        msg={msg}
        isOwn={isOwn}
        onReact={onReact}
        onReply={onReply}
        onEdit={startEdit}
        onDelete={onDelete}
        dark={dark}
      />
      {isFirst && (
        <div style={{ position: "absolute", left: 16, top: 12 }}>
          <Ava
            user={displayUser}
            size={30}
            dot={dot}
            variant={isDm ? "dm" : "default"}
          />
        </div>
      )}
      {msg.reply_to_snapshot && (
        <div className="rq-bar" onClick={() => onScrollTo(msg.reply_to_id)}>
          <span style={{ fontWeight: 700, color: "#60a5fa", fontSize: 12 }}>
            {msg.reply_to_snapshot.sender_name}{" "}
          </span>
          <span style={{ color: "#4b5563" }}>
            {msg.reply_to_snapshot.message_preview}
          </span>
        </div>
      )}
      {isFirst && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: dark ? "#e5e7eb" : "#0f172a",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {name}
            {isRyzentAiMsg && (
              <span
                title="Verified"
                style={{
                  width: 16,
                  height: 16,
                  background: "#2aa9e0",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 900,
                  lineHeight: 1,
                  clipPath:
                    "polygon(50% 0%,61% 7%,74% 5%,82% 16%,94% 21%,95% 34%,100% 46%,94% 58%,95% 72%,84% 79%,79% 92%,66% 94%,54% 100%,43% 93%,30% 95%,22% 84%,9% 79%,7% 66%,0% 54%,6% 42%,5% 28%,16% 21%,21% 8%,34% 6%,46% 0%)",
                  boxShadow: "0 1px 2px rgba(0,0,0,.2)",
                }}
              >
                <Check size={10} color="#fff" strokeWidth={3} />
              </span>
            )}
          </span>
          <span style={{ fontSize: 11, color: "#374151" }}>
            {tFmt(msg.created_at)}
          </span>
          {isMention && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "#2563eb",
                color: "#fff",
                borderRadius: 4,
                padding: "1px 5px",
              }}
            >
              @ mentioned
            </span>
          )}
          {!isOwn && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: isOnline ? "#16a34a" : "#374151",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: isOnline ? "#22c55e" : "#64748b",
                }}
              />
              {isOnline ? "Online" : "Offline"}
            </span>
          )}
        </div>
      )}
      <div>
        {msg.is_deleted ? (
          <div className="msg-deleted">
            <Trash2 size={13} />
            This message has been deleted.
          </div>
        ) : (
          <>
            {msg.meeting_meta && <MeetingCard msg={msg} dark={dark} />}
            {msg.poll && (
              <PollCard msg={msg} profile={profile} onVote={onVote} dark={dark} />
            )}
            {msg.file_type === "image" && (
              <img
                src={msg.file_url}
                alt="img"
                onClick={() => onView(msg)}
                style={{
                  maxWidth: 320,
                  maxHeight: 240,
                  borderRadius: 12,
                  display: "block",
                  marginBottom: 4,
                  objectFit: "cover",
                  cursor: "pointer",
                  border: "1.5px solid #2a2b31",
                  boxShadow: "0 2px 12px rgba(0,0,0,.4)",
                  transition: "transform .15s",
                }}
                onMouseEnter={(e) => (e.target.style.transform = "scale(1.01)")}
                onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
              />
            )}
            {msg.file_type === "video" && (
              <div style={{ marginBottom: 4, maxWidth: 320 }}>
                <div
                  style={{
                    position: "relative",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1.5px solid #2a2b31",
                    background: "#000",
                    cursor: "pointer",
                    transition: "transform .15s",
                  }}
                  onClick={() => onView(msg)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.01)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <video
                    src={msg.file_url}
                    style={{
                      width: "100%",
                      maxHeight: 200,
                      display: "block",
                      objectFit: "cover",
                    }}
                    preload="metadata"
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,.45)",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 16px rgba(0,0,0,.5)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <div
                        style={{
                          width: 0,
                          height: 0,
                          marginLeft: 4,
                          borderTop: "10px solid transparent",
                          borderBottom: "10px solid transparent",
                          borderLeft: "18px solid #fff",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#4b5563",
                    marginTop: 5,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Video size={11} />
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 260,
                    }}
                  >
                    {msg.file_name}
                  </span>
                  <span
                    style={{
                      color: "#374151",
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <ArrowRight size={11} />
                    Click to play
                  </span>
                </div>
              </div>
            )}
            {msg.file_type === "voice" && (
              <audio
                controls
                style={{
                  height: 38,
                  maxWidth: 280,
                  marginBottom: 4,
                  display: "block",
                }}
              >
                <source src={msg.file_url} type="audio/webm" />
              </audio>
            )}
            {msg.file_type === "document" && (
              <div
                onClick={() => onView(msg)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  background: "#1e1f25",
                  border: "1.5px solid #2a2b31",
                  borderRadius: 12,
                  color: "#9ca3af",
                  marginBottom: 4,
                  maxWidth: 280,
                  cursor: "pointer",
                  transition: "all .15s",
                  boxShadow: "0 1px 4px rgba(0,0,0,.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.background = "#1a2540";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#2a2b31";
                  e.currentTarget.style.background = "#1e1f25";
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={18} color="#fff" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 180,
                      color: "#e5e7eb",
                    }}
                  >
                    {msg.file_name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#4b5563",
                      marginTop: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span>{extOf(msg.file_name)}</span>
                    <ArrowRight size={11} />
                    <span>Click to view</span>
                  </div>
                </div>
              </div>
            )}
            {!msg.poll &&
              !msg.meeting_meta &&
              (isEditing ? (
                <div style={{ marginTop: 4 }}>
                  <textarea
                    className="edit-ta"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitEdit();
                      }
                      if (e.key === "Escape") cancelEdit();
                    }}
                    rows={2}
                    autoFocus
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button
                      onClick={cancelEdit}
                      style={{
                        padding: "5px 14px",
                        borderRadius: 7,
                        border: "1.5px solid #2a2b31",
                        background: "#1e1f25",
                        color: "#9ca3af",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitEdit}
                      style={{
                        padding: "5px 14px",
                        borderRadius: 7,
                        border: "none",
                        background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "#374151", marginTop: 4 }}>
                    Enter to save • Esc to cancel
                  </div>
                </div>
              ) : (
                msg.message && (
                  <div
                    style={{
                      fontSize: 15,
                      color: dark ? "#d1d5db" : "#1e293b",
                      lineHeight: 1.65,
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      marginTop: msg.file_url ? 4 : 0,
                    }}
                  >
                    {renderText(msg.message, [RYZENT_AI_USER, ...users])}
                    {msg.edited_at && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "#374151",
                          fontStyle: "italic",
                          marginLeft: 6,
                        }}
                      >
                        (edited)
                      </span>
                    )}
                  </div>
                )
              ))}
          </>
        )}
      </div>

      {Object.keys(reacts).length > 0 && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}
        >
          {Object.values(reacts).map((r) => (
            <Popover
              key={r.emoji}
              content={
                <ReactionViewer
                  reacts={reacts}
                  users={users}
                  profile={profile}
                  dark={dark}
                />
              }
              title={
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: dark ? "#e5e7eb" : "#0f172a",
                  }}
                >
                  Reactions
                </span>
              }
              trigger="hover"
              placement="top"
            >
              <button
                className={`rpill${r.own ? " own" : ""}`}
                onClick={() => onReact(msg.id, r.emoji)}
              >
                {r.emoji}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: r.own ? "#60a5fa" : "#6b7280",
                  }}
                >
                  {r.count}
                </span>
              </button>
            </Popover>
          ))}
          <Popover
            content={<EmojiPicker onSelect={(e) => onReact(msg.id, e)} dark={dark} />}
            trigger="click"
          >
            <button className="rpill">
              <Smile size={11} color="#4b5563" />
              <span style={{ fontSize: 11, color: "#4b5563" }}>+</span>
            </button>
          </Popover>
        </div>
      )}

      {showDmStatus && (
        <DmStatusTick isRead={isDmSeen} receiverOnline={receiverOnline} />
      )}

      {isOwn && !isDm && !msg.is_deleted && (
        <Popover
          content={
            readEntries.length > 0 ? (
              <SeenByViewer entries={readEntries} users={users} dark={dark} />
            ) : (
              <div
                style={{
                  padding: "8px 10px",
                  fontSize: 12,
                  color: dark ? "#9ca3af" : "#64748b",
                  minWidth: 160,
                }}
              >
                No one has seen this message yet.
              </div>
            )
          }
          title={
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: dark ? "#e5e7eb" : "#0f172a",
              }}
            >
              Seen by
            </span>
          }
          trigger={["hover", "click"]}
          placement="rightTop"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 4,
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex" }}>
              {readEntries.slice(0, 4).map((entry, i) => {
                const u = users.find((x) => x.id === entry.user_id);
                return (
                  <div
                    key={entry.key}
                    style={{ marginLeft: i > 0 ? -6 : 0, zIndex: i }}
                  >
                    <Ava user={u} size={14} />
                  </div>
                );
              })}
            </div>
            <span
              style={{
                fontSize: 10,
                color: "#374151",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <CheckCheck size={12} color="#22c55e" />
              {readEntries.length === 0
                ? "Not seen yet"
                : readEntries.length === 1
                  ? "Seen"
                  : `Seen by ${readEntries.length}`}
            </span>
          </div>
        </Popover>
      )}
    </div>
  );
};

const MentionList = ({ users, query, activeIdx, onSelect, dark = false }) => {
  const list = [RYZENT_AI_USER, ...users]
    .filter((u) => u.full_name?.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);
  if (!list.length) return null;
  return (
    <div
      className="mlist"
      style={{
        position: "absolute",
        bottom: "100%",
        left: 0,
        marginBottom: 8,
        zIndex: 200,
      }}
    >
      {list.map((u, i) => (
        <div
          key={u.id}
          className={`mitem${i === activeIdx ? " active" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(u);
          }}
        >
          <Ava user={u} size={28} />
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: dark ? "#e5e7eb" : "#0f172a",
              }}
            >
              {u.full_name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: dark ? "#4b5563" : "#64748b",
                textTransform: "capitalize",
              }}
            >
              {u.role}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ToastContainer = ({ toasts, onDismiss, onOpen, dark = false }) => {
  if (!toasts.length) return null;
  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 99998,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "flex-end",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-msg${t.leaving ? " leaving" : ""}`}
          onClick={() => {
            onOpen(t);
            onDismiss(t.id);
          }}
          style={{
            background: dark ? "#1e1f25" : "#ffffff",
            borderRadius: 16,
            boxShadow: dark
              ? "0 20px 60px rgba(0,0,0,.5)"
              : "0 16px 42px rgba(15,23,42,.16)",
            border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
            padding: "12px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            minWidth: 300,
            maxWidth: 360,
            cursor: "pointer",
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Ava user={t.sender} size={40} dot="active" />
            {t.isMention && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 18,
                  height: 18,
                  background: "#2563eb",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "#fff",
                  fontWeight: 800,
                  border: `2px solid ${dark ? "#1e1f25" : "#ffffff"}`,
                }}
              >
                @
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: dark ? "#e5e7eb" : "#0f172a",
                }}
              >
                {t.sender?.full_name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: dark ? "#374151" : "#64748b" }}>
                  now
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(t.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: dark ? "#4b5563" : "#94a3b8",
                    display: "flex",
                    padding: 2,
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
            {t.channelName && (
              <div
                style={{
                  fontSize: 11,
                  color: dark ? "#4b5563" : "#64748b",
                  marginBottom: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Hash size={10} />
                {t.channelName}
              </div>
            )}
            <div
              style={{
                fontSize: 13,
                color: dark ? "#6b7280" : "#475569",
                lineHeight: 1.5,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {t.preview}
            </div>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
};

function FreePlanPaywall({ navigate, dark = false }) {
  const colors = dark
    ? {
        page: "#141416",
        panel: "#1a1b20",
        panelBorder: "#2a2b31",
        rowBorder: "#1e1f25",
        block: "#2a2b31",
        blockAlt: "#1e1f25",
        title: "#f9fafb",
        text: "#9ca3af",
        subtle: "#6b7280",
        label: "#6b7280",
        overlay:
          "linear-gradient(to bottom, transparent 0%, rgba(20,20,22,0.6) 60%, rgba(20,20,22,0.97) 100%)",
        pillBg: "rgba(255,255,255,.06)",
        pillBorder: "1px solid rgba(255,255,255,.1)",
      }
    : {
        page: "#f8fafc",
        panel: "#ffffff",
        panelBorder: "#e2e8f0",
        rowBorder: "#edf2f7",
        block: "#e2e8f0",
        blockAlt: "#cbd5e1",
        title: "#0f172a",
        text: "#64748b",
        subtle: "#94a3b8",
        label: "#64748b",
        overlay:
          "linear-gradient(to bottom, transparent 0%, rgba(248,250,252,0.75) 60%, rgba(248,250,252,0.98) 100%)",
        pillBg: "rgba(15,23,42,.04)",
        pillBorder: "1px solid rgba(15,23,42,.1)",
      };

  const features = [
    {
      icon: <MessageCircle size={20} />,
      color: "#3b82f6",
      bg: "rgba(59,130,246,.12)",
      title: "Real-time Chat",
      desc: "Instant messaging with rich text formatting, emojis, mentions, and threaded replies.",
    },
    {
      icon: <Video size={20} />,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,.12)",
      title: "HD Video Calls",
      desc: "Crystal-clear video calls with up to 100 participants, screen sharing, and virtual backgrounds.",
    },
    {
      icon: <Phone size={20} />,
      color: "#22c55e",
      bg: "rgba(34,197,94,.12)",
      title: "Audio Calls",
      desc: "High-quality audio calls with noise cancellation and call recording options.",
    },
    {
      icon: <ThumbsUp size={20} />,
      color: "#f59e0b",
      bg: "rgba(245,158,11,.12)",
      title: "Message Reactions",
      desc: "Quick emoji reactions, custom stickers, and reaction analytics for engagement.",
    },
    {
      icon: <Mic size={20} />,
      color: "#ef4444",
      bg: "rgba(239,68,68,.12)",
      title: "Voice Messages",
      desc: "Send and receive voice messages with transcription and playback controls.",
    },
    {
      icon: <Paperclip size={20} />,
      color: "#0891b2",
      bg: "rgba(8,145,178,.12)",
      title: "Document Sharing",
      desc: "Upload and share documents, images, PDFs with preview and download tracking.",
    },
    {
      icon: <Hash size={20} />,
      color: "#7c3aed",
      bg: "rgba(124,58,237,.12)",
      title: "Communication Channels",
      desc: "Organized channels for teams, projects, and topics with permissions and search.",
    },
  ];

  const fakeConversations = [
    {
      title: "Design Team",
      type: "channel",
      time: "2 min ago",
      messages: 47,
      status: "active",
    },
    {
      title: "Sarah Johnson",
      type: "direct",
      time: "10:00 AM",
      messages: 8,
      status: "typing",
    },
    {
      title: "Product Updates",
      type: "channel",
      time: "Yesterday",
      messages: 23,
      status: "muted",
    },
    {
      title: "John Smith",
      type: "direct",
      time: "Mon 3:15",
      messages: 5,
      status: "voice",
    },
    {
      title: "Sales Pipeline",
      type: "channel",
      time: "2 days ago",
      messages: 156,
      status: "pinned",
    },
  ];

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: colors.page,
        position: "relative",
        overflow: "hidden",
      }}
    >

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none"
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 60,
          paddingBottom: 80,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 18px",
            background: "rgba(59,130,246,.1)",
            border: "1px solid rgba(59,130,246,.2)",
            borderRadius: 30,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Lock size={11} color="#fff" />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              background: "linear-gradient(135deg,#60a5fa,#a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Locked Feature
          </span>
        </div>

        {/* Headline */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 900,
              color: colors.title,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
            }}
          >
            Collaborate seamlessly with
            <br />
            <span
              style={{
                background: "linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              real-time communication
            </span>
          </h2>
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: 15,
            color: colors.text,
            maxWidth: 480,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Connect with your team instantly through chat, video calls, voice
          messages, and organized channels.
        </p>

        {/* Feature grid */}
        <div
          style={{
            width: "100%",
            maxWidth: 860,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 56,
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: colors.panel,
                borderRadius: 16,
                border: `1px solid ${colors.panelBorder}`,
                padding: "20px 22px",
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                animation: `fadeUp 0.4s ease ${0.28 + i * 0.06}s both`,
                transition:
                  "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = dark
                  ? "0 4px 20px rgba(0,0,0,.4)"
                  : "0 4px 20px rgba(15,23,42,.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = dark ? "#374151" : "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.borderColor = colors.panelBorder;
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: f.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: f.color,
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: colors.title,
                    marginBottom: 5,
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={{ fontSize: 12, color: colors.text, lineHeight: 1.6 }}
                >
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sample preview */}
        <div
          style={{
            width: "100%",
            maxWidth: 600,
            animation: "fadeUp 0.4s ease 0.6s both",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colors.label,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Sample preview · what you'll see after upgrading
            </span>
          </div>
          <div
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 5,
                background: colors.overlay,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: colors.pillBg,
                  border: colors.pillBorder,
                }}
              >
                <Lock size={11} color={colors.text} />
                <span
                  style={{ fontSize: 11, fontWeight: 600, color: colors.text }}
                >
                  Upgrade to unlock
                </span>
              </div>
            </div>
            <div
              style={{
                filter: "blur(1.5px)",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {fakeConversations.map((c, i) => {
                const getColor = (s) => {
                  if (s === "active")
                    return {
                      dot: "#22c55e",
                      bg: "rgba(34,197,94,.1)",
                      text: "#22c55e",
                      border: "rgba(34,197,94,.2)",
                    };
                  if (s === "typing")
                    return {
                      dot: "#3b82f6",
                      bg: "rgba(59,130,246,.1)",
                      text: "#60a5fa",
                      border: "rgba(59,130,246,.2)",
                    };
                  if (s === "voice")
                    return {
                      dot: "#ef4444",
                      bg: "rgba(239,68,68,.1)",
                      text: "#ef4444",
                      border: "rgba(239,68,68,.2)",
                    };
                  return {
                    dot: dark ? "#374151" : "#94a3b8",
                    bg: dark ? "#1e1f25" : "#f1f5f9",
                    text: dark ? "#4b5563" : "#64748b",
                    border: dark ? "#2a2b31" : "#e2e8f0",
                  };
                };
                const color = getColor(c.status);
                return (
                  <div
                    key={i}
                    style={{
                      background: colors.panel,
                      padding: "16px 20px",
                      borderBottom:
                        i < fakeConversations.length - 1
                          ? `1px solid ${colors.rowBorder}`
                          : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: color.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${color.border}`,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: color.dot,
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: colors.title,
                          marginBottom: 2,
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: colors.text,
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: colors.subtle,
                          }}
                        >
                          {c.type === "channel" ? "#" : ""}
                          {c.type}
                        </span>
                        <span>--</span>
                        <span>{c.time}</span>
                        <span>--</span>
                        <span>{c.messages} messages</span>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        background: color.bg,
                        color: color.text,
                        border: `1px solid ${color.border}`,
                      }}
                    >
                      {c.status === "active"
                        ? "Open"
                        : c.status === "typing"
                          ? "Typing..."
                          : c.status === "voice"
                            ? "Voice"
                            : "New"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Trust line */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: 20,
            animation: "fadeUp 0.4s ease 0.7s both",
          }}
        >
          {[
            { icon: <Shield size={13} />, text: "14-day free trial" },
            { icon: <Zap size={13} />, text: "Instant activation" },
            { icon: <ArrowRight size={13} />, text: "Cancel anytime" },
          ].map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                color: colors.label,
              }}
            >
              {t.icon} {t.text}
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

/* Main Component */
const Communication = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const tenantId = profile?.tenant_id;
  const [dark, setDark] = useState(getIsDarkTheme);

  const [orgPlan, setOrgPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stagedFile, setStagedFile] = useState(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pendingCaption, setPendingCaption] = useState("");
  const [unread, setUnread] = useState({});
  const [mentions, setMentions] = useState({});
  const [presence, setPresence] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [channelModal, setChannelModal] = useState(false);
  const [membersDrawer, setMembersDrawer] = useState(false);
  const [channelSettingsTab, setChannelSettingsTab] = useState("members");
  const [deletingChannel, setDeletingChannel] = useState(false);
  const [editingChannel, setEditingChannel] = useState(false);
  const [editChannelName, setEditChannelName] = useState("");
  const [editChannelDesc, setEditChannelDesc] = useState("");
  const [addMemberDrawer, setAddMemberDrawer] = useState(false);
  const [channelMembers, setChannelMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionIdx, setMentionIdx] = useState(0);
  const [sideSearch, setSideSearch] = useState("");
  const [toasts, setToasts] = useState([]);
  const [viewerItem, setViewerItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const endRef = useRef(null),
    messageInputRef = useRef(null),
    recorderRef = useRef(null);
  const chunksRef = useRef([]),
    msgRefs = useRef({}),
    subRef = useRef(null);
  const updateDebounceRef = useRef(null),
    fileInputRef = useRef(null);
  const selUserRef = useRef(null),
    selChanRef = useRef(null);
  const usersRef = useRef([]),
    chansRef = useRef([]);
  const audioCtxRef = useRef(null);
  const shouldScrollRef = useRef(true);
  const profileIdRef = useRef(profile?.id);
  const profileNameRef = useRef(profile?.full_name);
  const profileRef = useRef(profile);
  const setMessagesRef = useRef(null);
  const fetchMessagesRef = useRef(null);
  const fetchUnreadRef = useRef(null);
  const addToastRef = useRef(null);
  const setMentionsRef = useRef(null);
  const playNotificationRef = useRef(null);
  const ryzentLocalByConvRef = useRef({});

  useLayoutEffect(() => {
    profileIdRef.current = profile?.id;
    profileNameRef.current = profile?.full_name;
    profileRef.current = profile;
  });

  useEffect(() => {
    setMessagesRef.current = setMessages;
  });

  const playNotification = useCallback(() => {
    try {
      if (!audioCtxRef.current)
        audioCtxRef.current = new (
          window.AudioContext || window.webkitAudioContext
        )();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const notes = [1046.5, 880];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator(),
          gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (_) {}
  }, []);

  const getConvKey = useCallback((channelId, receiverId) => {
    if (channelId) return `ch:${channelId}`;
    if (receiverId) return `dm:${receiverId}`;
    return "";
  }, []);

  const mergeWithLocalRyzent = useCallback(
    (baseMessages, channelId, receiverId) => {
      const key = getConvKey(channelId, receiverId);
      if (!key) return baseMessages;
      const local = ryzentLocalByConvRef.current[key] || [];
      if (!local.length) return baseMessages;
      const byId = new Map((baseMessages || []).map((m) => [m.id, m]));
      local.forEach((m) => {
        if (!byId.has(m.id)) byId.set(m.id, m);
      });
      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
    },
    [getConvKey],
  );

  useEffect(() => {
    selUserRef.current = selectedUser;
  }, [selectedUser]);
  useEffect(() => {
    selChanRef.current = selectedChannel;
  }, [selectedChannel]);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);
  useEffect(() => {
    chansRef.current = channels;
  }, [channels]);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const addToast = useCallback((t) => {
    const id = ++toastId;
    setToasts((p) => [...p.slice(-3), { ...t, id }]);
    setTimeout(() => {
      setToasts((p) =>
        p.map((x) => (x.id === id ? { ...x, leaving: true } : x)),
      );
      setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 250);
    }, 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((p) => p.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 250);
  }, []);

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    syncTheme();
    window.addEventListener("themeModeChanged", syncTheme);
    mq.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("themeModeChanged", syncTheme);
      mq.removeEventListener("change", syncTheme);
    };
  }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!profile) {
        setPlanLoading(true);
        return;
      }
      if (!profile?.tenant_id) {
        setOrgPlan(null);
        setPlanLoading(false);
        return;
      }
      setPlanLoading(true);
      try {
        const { data: org } = await supabase
          .from("tenants")
          .select("plan")
          .eq("id", profile.tenant_id)
          .single();
        setOrgPlan(org?.plan ?? null);
      } catch (_) {
        setOrgPlan(null);
      } finally {
        setPlanLoading(false);
      }
    };
    fetchPlan();
  }, [profile, profile?.tenant_id]);

  useEffect(() => {
    if (!tenantId) return;
    fetchUsers();
    fetchChannels();
    fetchUnread();
    if ("Notification" in window && Notification.permission === "default")
      Notification.requestPermission();
    return () => {
      subRef.current?.unsubscribe();
    };
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId || !profile?.id) return;
    const presenceChannel = supabase.channel(`presence-${tenantId}`, {
      config: { presence: { key: profile.id } },
    });
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const map = {};
        Object.keys(state).forEach((userId) => {
          map[userId] = "active";
        });
        setPresence(map);
      })
      .on("presence", { event: "join" }, ({ key }) => {
        setPresence((prev) => ({ ...prev, [key]: "active" }));
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setPresence((prev) => {
          const n = { ...prev };
          delete n[key];
          return n;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED")
          await presenceChannel.track({
            user_id: profile.id,
            online_at: new Date().toISOString(),
          });
      });
    return () => {
      presenceChannel.untrack();
      presenceChannel.unsubscribe();
    };
  }, [tenantId, profile?.id]);

  useEffect(() => {
    if (selectedUser || selectedChannel) {
      fetchMessages();
    }
  }, [selectedUser?.id, selectedChannel?.id]);
  useEffect(() => {
    if (shouldScrollRef.current)
      endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const markReadForMsgRef = useRef(null);
  markReadForMsgRef.current = async (msg) => {
    const myId = profileIdRef.current;
    if (!myId) return;
    try {
      await supabase
        .from("message_read_status")
        .upsert([{ message_id: msg.id, user_id: myId }], {
          onConflict: "message_id,user_id",
          ignoreDuplicates: true,
        });
      if (!msg.channel_id) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("id", msg.id);
        setMessagesRef.current?.((prev) =>
          prev.map((m) =>
            m.id === msg.id
              ? {
                  ...m,
                  is_read: true,
                  receiver_id:
                    m.receiver_id ?? msg.receiver_id ?? msg.sender_id,
                }
              : m,
          ),
        );
      }
    } catch (e) {
      console.error("markReadForMsg error:", e);
    }
  };

  useEffect(() => {
    if (!tenantId) return;
    const existingChannels = supabase.getChannels();
    const channelName = `realtime-comm-${tenantId}`;
    const existing = existingChannels.find(
      (c) => c.topic === `realtime:${channelName}`,
    );
    if (existing) {
      subRef.current = existing;
      return;
    }

    const ch = supabase
      .channel(channelName, { config: { broadcast: { self: false } } })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const msg = payload.new;
          const cu = selUserRef.current,
            cc = selChanRef.current,
            myId = profileIdRef.current,
            myName = profileNameRef.current;
          const isMyChannelMsg =
            !!msg.channel_id &&
            chansRef.current.some((c) => c.id === msg.channel_id);
          const isMyDmMsg =
            !msg.channel_id &&
            (msg.sender_id === myId || msg.receiver_id === myId);

          // Ignore messages outside my membership/DM scope.
          if (!isMyChannelMsg && !isMyDmMsg) return;

          const inConv =
            (cc && msg.channel_id === cc?.id) ||
            (cu &&
              ((msg.sender_id === cu.id && msg.receiver_id === myId) ||
                (msg.sender_id === myId && msg.receiver_id === cu.id)));
          if (inConv && msg.sender_id !== myId) {
            const newMsg = {
              ...msg,
              sender:
                usersRef.current.find((u) => u.id === msg.sender_id) || null,
              reactions: [],
              read_by: [],
              poll:
                typeof msg.poll === "string"
                  ? JSON.parse(msg.poll || "null")
                  : msg.poll,
            };
            setMessagesRef.current?.((prev) => [...prev, newMsg]);
            shouldScrollRef.current = true;
            markReadForMsgRef.current?.(msg);
          }
          if (msg.sender_id !== myId) {
            playNotificationRef.current?.();
            const sender = usersRef.current.find((u) => u.id === msg.sender_id);
            const channel = msg.channel_id
              ? chansRef.current.find((c) => c.id === msg.channel_id)
              : null;
            const isMention = msg.message?.includes(`@${myName}`);
            if (isMention)
              setMentionsRef.current?.((p) => ({
                ...p,
                [msg.channel_id || msg.sender_id]: true,
              }));
            const preview = msg.meeting_meta
              ? `📞 ${msg.meeting_meta.type === "video" ? "Video" : "Audio"} call started`
              : msg.message
                ? msg.message.slice(0, 80)
                : msg.file_type === "voice"
                  ? "🎤 Voice"
                  : msg.file_type === "image"
                    ? "🖼️ Image"
                    : msg.file_type === "video"
                      ? "🎬 Video"
                      : "📎 File";
            if (!inConv && sender)
              addToastRef.current?.({
                sender,
                preview,
                isMention,
                channelName: channel?.name,
                targetUser: msg.receiver_id ? sender : null,
                targetChannel: channel,
              });
          }
          fetchUnreadRef.current?.();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_reactions" },
        (payload) => {
          const r = payload.new;
          if (selUserRef.current || selChanRef.current)
            setMessagesRef.current?.((prev) =>
              prev.map((m) =>
                m.id !== r.message_id
                  ? m
                  : { ...m, reactions: [...(m.reactions || []), r] },
              ),
            );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "message_reactions" },
        (payload) => {
          const r = payload.old;
          if (selUserRef.current || selChanRef.current)
            setMessagesRef.current?.((prev) =>
              prev.map((m) =>
                m.id !== r.message_id
                  ? m
                  : {
                      ...m,
                      reactions: (m.reactions || []).filter(
                        (x) => x.id !== r.id,
                      ),
                    },
              ),
            );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          if (!(selUserRef.current || selChanRef.current)) return;
          const updated = payload.new;
          clearTimeout(updateDebounceRef.current);
          updateDebounceRef.current = setTimeout(() => {
            setMessagesRef.current?.((prev) =>
              prev.map((m) => {
                if (m.id !== updated.id) return m;
                let poll = updated.poll;
                if (typeof poll === "string") {
                  try {
                    poll = JSON.parse(poll);
                  } catch (_) {
                    poll = null;
                  }
                }
                const safeReceiverId =
                  updated.receiver_id != null
                    ? updated.receiver_id
                    : m.receiver_id;
                const safeIsRead = updated.is_read === true ? true : m.is_read;
                return {
                  ...m,
                  ...updated,
                  poll,
                  reactions: m.reactions,
                  read_by: m.read_by,
                  receiver_id: safeReceiverId,
                  is_read: safeIsRead,
                };
              }),
            );
          }, 80);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          const id = payload.old?.id;
          if (id && (selUserRef.current || selChanRef.current))
            setMessagesRef.current?.((prev) => prev.filter((m) => m.id !== id));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_read_status" },
        (payload) => {
          const rs = payload.new;
          if (selUserRef.current || selChanRef.current) {
            setMessagesRef.current?.((prev) =>
              prev.map((m) => {
                if (m.id !== rs.message_id) return m;
                const read_by = [...(m.read_by || [])];
                const exists = read_by.some((entry) => {
                  if (!entry) return false;
                  if (typeof entry === "string") return entry === rs.user_id;
                  return entry.user_id === rs.user_id;
                });
                if (!exists) {
                  read_by.push({
                    user_id: rs.user_id,
                    read_at: rs.read_at || rs.created_at || new Date().toISOString(),
                  });
                }
                const is_read =
                  m.is_read || rs.user_id === (m.receiver_id ?? rs.user_id);
                return { ...m, read_by, is_read };
              }),
            );
          }
        },
      )
      .subscribe((status, err) => {
        console.log("[Supabase Realtime]", status, err || "");
      });

    subRef.current = ch;
    return () => {
      ch.unsubscribe();
      subRef.current = null;
    };
  }, [tenantId]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,email,role,user_photo,tenant_id")
      .eq("tenant_id", tenantId)
      .neq("id", profile.id)
      .eq("suspended", false)
      .order("full_name");
    setUsers(data || []);
    setLoadingUsers(false);
  };

  const fetchChannels = async () => {
    setLoadingChannels(true);
    const { data } = await supabase
      .from("channels")
      .select("*, channel_members!inner(user_id)")
      .eq("tenant_id", tenantId)
      .eq("channel_members.user_id", profile.id)
      .order("name");
    const ownChannels = (data || []).map(({ channel_members, ...channel }) => channel);
    setChannels(ownChannels);
    if (selectedChannel && !ownChannels.some((c) => c.id === selectedChannel.id)) {
      setSelectedChannel(null);
      setMessages([]);
    }
    setLoadingChannels(false);
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    let q = supabase
      .from("messages")
      .select(
        `*,sender:profiles!messages_sender_id_fkey(id,full_name,user_photo),reactions:message_reactions(id,emoji,user_id,created_at),message_read_status(user_id,read_at,created_at)`,
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });
    if (selChanRef.current) q = q.eq("channel_id", selChanRef.current.id);
    else if (selUserRef.current)
      q = q.or(
        `and(sender_id.eq.${profile.id},receiver_id.eq.${selUserRef.current.id}),and(sender_id.eq.${selUserRef.current.id},receiver_id.eq.${profile.id})`,
      );
    const { data } = await q;
    const msgs = (data || []).map((m) => {
      let poll = m.poll;
      if (typeof poll === "string") {
        try {
          poll = JSON.parse(poll);
        } catch (_) {
          poll = null;
        }
      }
      return {
        ...m,
        poll,
        read_by: (m.message_read_status || [])
          .map((r) => ({
            user_id: r.user_id,
            read_at: r.read_at || r.created_at || null,
          }))
          .filter((r) => r.user_id !== profile.id),
      };
    });
    const convChannelId = selChanRef.current?.id || null;
    const convReceiverId = selUserRef.current?.id || null;
    setMessages(mergeWithLocalRyzent(msgs, convChannelId, convReceiverId));
    setLoadingMessages(false);
    shouldScrollRef.current = true;
    markRead();
  };

  const fetchUnread = async () => {
    try {
      const dmMap = {},
        dmM = {},
        chMap = {},
        chM = {};
      const { data: dmMsgs, error: dmErr } = await supabase
        .from("messages")
        .select("id,sender_id,message")
        .eq("tenant_id", tenantId)
        .eq("receiver_id", profile.id)
        .is("channel_id", null)
        .neq("sender_id", profile.id);
      if (!dmErr && dmMsgs?.length) {
        const dmIds = dmMsgs.map((m) => m.id);
        const { data: dmRead } = await supabase
          .from("message_read_status")
          .select("message_id")
          .eq("user_id", profile.id)
          .in("message_id", dmIds);
        const dmReadSet = new Set((dmRead || []).map((r) => r.message_id));
        dmMsgs.forEach((m) => {
          if (dmReadSet.has(m.id)) return;
          dmMap[m.sender_id] = (dmMap[m.sender_id] || 0) + 1;
          if (m.message?.includes(`@${profile?.full_name}`))
            dmM[m.sender_id] = true;
        });
      }
      const myChannelIds = channels.map((c) => c.id);
      if (myChannelIds.length) {
        const { data: chMsgs, error: chErr } = await supabase
          .from("messages")
          .select("id,channel_id,message,sender_id")
          .eq("tenant_id", tenantId)
          .in("channel_id", myChannelIds)
          .neq("sender_id", profile.id);
        if (!chErr && chMsgs?.length) {
          const chIds = chMsgs.map((m) => m.id);
          const { data: chRead } = await supabase
            .from("message_read_status")
            .select("message_id")
            .eq("user_id", profile.id)
            .in("message_id", chIds);
          const chReadSet = new Set((chRead || []).map((r) => r.message_id));
          chMsgs.forEach((m) => {
            if (chReadSet.has(m.id)) return;
            chMap[m.channel_id] = (chMap[m.channel_id] || 0) + 1;
            if (m.message?.includes(`@${profile?.full_name}`))
              chM[m.channel_id] = true;
          });
        }
      }
      setUnread({ ...dmMap, ...chMap });
      setMentions((p) => ({ ...p, ...dmM, ...chM }));
    } catch (e) {
      console.error("Error fetching unread count:", e);
    }
  };

  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
    fetchUnreadRef.current = fetchUnread;
    addToastRef.current = addToast;
    setMentionsRef.current = setMentions;
    playNotificationRef.current = playNotification;
  });

  const markRead = async () => {
    try {
      const cu = selUserRef.current,
        cc = selChanRef.current;
      if (!cu && !cc) return;
      let q = supabase
        .from("messages")
        .select("id")
        .eq("tenant_id", tenantId)
        .neq("sender_id", profile.id);
      if (cu)
        q = q
          .eq("sender_id", cu.id)
          .eq("receiver_id", profile.id)
          .is("channel_id", null);
      else q = q.eq("channel_id", cc.id);
      const { data } = await q;
      if (data?.length) {
        const ids = data.map((m) => m.id);
        await supabase.from("message_read_status").upsert(
          ids.map((id) => ({ message_id: id, user_id: profile.id })),
          { onConflict: "message_id,user_id", ignoreDuplicates: true },
        );
        if (cu) {
          await supabase
            .from("messages")
            .update({ is_read: true })
            .in("id", ids);
          setMessages((prev) =>
            prev.map((m) =>
              ids.includes(m.id)
                ? {
                    ...m,
                    is_read: true,
                    receiver_id: m.receiver_id ?? profile.id,
                  }
                : m,
            ),
          );
        }
      }
      if (cu)
        setMentions((p) => {
          const n = { ...p };
          delete n[cu.id];
          return n;
        });
      if (cc)
        setMentions((p) => {
          const n = { ...p };
          delete n[cc.id];
          return n;
        });
      fetchUnread();
    } catch (e) {
      console.error("markRead error:", e);
    }
  };

  const fetchChannelMembers = async (id) => {
    const { data } = await supabase
      .from("channel_members")
      .select(
        "id,user_id,joined_at,profiles:user_id(id,full_name,email,user_photo,role)",
      )
      .eq("channel_id", id);
    setChannelMembers(data || []);
  };

  const fetchAvailableUsers = async (id) => {
    const { data: mems } = await supabase
      .from("channel_members")
      .select("user_id")
      .eq("channel_id", id);
    const ids = (mems || []).map((m) => m.user_id);
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,email,user_photo,role")
      .eq("tenant_id", tenantId)
      .not("id", "in", `(${ids.join(",")})`)
      .eq("suspended", false)
      .order("full_name");
    setAvailableUsers(data || []);
  };

  const stageFile = (file) => {
    const isImg = file.type.startsWith("image/"),
      isVid = file.type.startsWith("video/");
    const fType = isImg ? "image" : isVid ? "video" : "document";
    const previewUrl = isImg || isVid ? URL.createObjectURL(file) : null;
    setStagedFile({ file, name: file.name, fileType: fType, previewUrl });
    setPendingCaption("");
    return false;
  };

  const clearStaged = () => {
    if (stagedFile?.previewUrl) URL.revokeObjectURL(stagedFile.previewUrl);
    setStagedFile(null);
    setPendingCaption("");
  };

  const formatDbError = (err) => {
    if (!err) return "Unknown database error";
    const parts = [
      err.code ? `code: ${err.code}` : null,
      err.message ? `message: ${err.message}` : null,
      err.details ? `details: ${err.details}` : null,
      err.hint ? `hint: ${err.hint}` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(" | ") : JSON.stringify(err);
  };

  const createCall = async (type) => {
    if (!selectedUser && !selectedChannel) return;
    try {
      const genRoomId = () => {
        const c = "abcdefghijklmnopqrstuvwxyz";
        const seg = () =>
          Array.from({ length: 3 }, () =>
            c[Math.floor(Math.random() * 26)],
          ).join("");
        return `${seg()}-${seg()}-${seg()}`;
      };
      const roomId = genRoomId();
      const title = selectedUser
        ? `${type === "video" ? "Video" : "Audio"} call with ${selectedUser.full_name}`
        : `${type === "video" ? "Video" : "Audio"} call in #${selectedChannel.name}`;
      const allEmails = selectedUser
        ? [profile.email, selectedUser.email].filter(Boolean)
        : [profile.email];
      const allIds = selectedUser ? [profile.id, selectedUser.id] : [profile.id];

      const baseMeetingPayload = {
        title,
        meeting_date: new Date().toISOString(),
        duration: 60,
        status: "live",
        attendee_emails: allEmails,
        attendees: JSON.stringify(allIds),
        agenda_items: "[]",
        created_by: profile.id,
        tenant_id: tenantId,
        is_recurring: false,
        meeting_room_id: roomId,
        meeting_url: `${window.location.origin}/meet/${roomId}`,
      };
      const typeCandidates =
        type === "audio"
          ? ["audio", "voice", "phone", "audio_call", "call"]
          : [type];
      const isMeetingTypeConstraintError = (err) =>
        err?.code === "23514" &&
        `${err?.message || ""} ${err?.details || ""}`
          .toLowerCase()
          .includes("meeting_type");
      let meeting = null;
      let meetingError = null;
      for (const meetingType of typeCandidates) {
        const { data, error } = await supabase
          .from("meetings")
          .insert([{ ...baseMeetingPayload, meeting_type: meetingType }])
          .select()
          .single();
        if (!error) {
          meeting = data;
          meetingError = null;
          break;
        }
        meetingError = error;
        if (!isMeetingTypeConstraintError(error)) break;
      }

      if (meetingError) {
        console.error("createCall meeting insert error:", {
          code: meetingError.code,
          message: meetingError.message,
          details: meetingError.details,
          hint: meetingError.hint,
          full: meetingError,
        });
        addToastRef.current?.({
          title: "Could not start call",
          msg: formatDbError(meetingError),
          kind: "danger",
        });
        return;
      }

      const meetingMeta = {
        type,
        title,
        room_id: roomId,
        meeting_id: meeting?.id ?? null,
        status: "live",
      };

      const payload = {
        tenant_id: tenantId,
        sender_id: profile.id,
        message: title,
        meeting_meta: meetingMeta,
        is_read: false,
      };
      if (selectedChannel) payload.channel_id = selectedChannel.id;
      else if (selectedUser) payload.receiver_id = selectedUser.id;

      let { data: ins, error: msgError } = await supabase
        .from("messages")
        .insert([payload])
        .select(
          "*,sender:profiles!messages_sender_id_fkey(id,full_name,user_photo)",
        )
        .single();

      if (msgError) {
        // Fallback for schemas where meeting_meta is a text column.
        const fallbackPayload = {
          ...payload,
          meeting_meta: JSON.stringify(meetingMeta),
        };
        const fallback = await supabase
          .from("messages")
          .insert([fallbackPayload])
          .select(
            "*,sender:profiles!messages_sender_id_fkey(id,full_name,user_photo)",
          )
          .single();
        ins = fallback.data;
        msgError = fallback.error;
      }

      if (msgError) {
        console.error("createCall message insert error:", {
          code: msgError.code,
          message: msgError.message,
          details: msgError.details,
          hint: msgError.hint,
          full: msgError,
        });
        addToastRef.current?.({
          title: "Call created, chat post failed",
          msg: formatDbError(msgError),
          kind: "danger",
        });
        return;
      }

      if (ins) {
        setMessages((prev) => [
          ...prev,
          {
            ...ins,
            meeting_meta:
              typeof ins.meeting_meta === "string"
                ? (() => {
                    try {
                      return JSON.parse(ins.meeting_meta);
                    } catch {
                      return meetingMeta;
                    }
                  })()
                : ins.meeting_meta,
            reactions: [],
            read_by: [],
            receiver_id: selectedUser?.id ?? ins.receiver_id ?? null,
          },
        ]);
        shouldScrollRef.current = true;
      }
    } catch (e) {
      console.error("createCall exception:", e);
      addToastRef.current?.({
        title: "Could not start call",
        msg: e?.message || "Unexpected error.",
        kind: "danger",
      });
    }
  };

  const askRyzentAI = useCallback(
    async (rawPrompt, target) => {
      const appendRyzentLocalReply = (text) => {
        const convKey = getConvKey(target?.channel_id || null, target?.receiver_id || null);
        if (!convKey) return;
        const localAiMsg = {
          id: `ryzent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          tenant_id: tenantId,
          channel_id: target?.channel_id || null,
          receiver_id: target?.receiver_id || null,
          sender_id: RYZENT_AI_USER.id,
          sender: RYZENT_AI_USER,
          message: `${RYZENT_AI_PREFIX} ${String(text || "").trim()}`,
          created_at: new Date().toISOString(),
          is_read: true,
          is_deleted: false,
          reactions: [],
          read_by: [],
        };
        const existing = ryzentLocalByConvRef.current[convKey] || [];
        ryzentLocalByConvRef.current[convKey] = [...existing, localAiMsg];
        const activeKey = getConvKey(
          selChanRef.current?.id || null,
          selUserRef.current?.id || null,
        );
        if (activeKey === convKey) {
          setMessages((prev) =>
            mergeWithLocalRyzent(
              prev || [],
              target?.channel_id || null,
              target?.receiver_id || null,
            ),
          );
        }
        shouldScrollRef.current = true;
      };

      try {
        if (!rawPrompt || !RYZENT_AI_MENTION_RE.test(rawPrompt)) return;

        const cleanedPrompt =
          rawPrompt.replace(/@ryzent\s*ai[\s,:-]*/gi, "").trim() ||
          "Summarize my important messages and assigned tasks for today.";
        if (!target?.channel_id && !target?.receiver_id) return;

        if (!GROQ_API_KEY) {
          appendRyzentLocalReply(
            formatRyzentReply(
              "I cannot run because the AI API key is missing. Set VITE_GROQ_API_KEY (or VITE_GROK_API_KEY) and try again.",
            ),
          );
          return;
        }

        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        const dayStartIso = dayStart.toISOString();
        const todayKey = dayStartIso.slice(0, 10);
        const meName = (profile.full_name || "").toLowerCase();
        const priorityWords =
          /(urgent|asap|important|deadline|today|blocker|action|follow\s*up)/i;

        let msgQuery = supabase
          .from("messages")
        .select(
          "id,message,created_at,sender_id,receiver_id,is_read,file_type,sender:profiles!messages_sender_id_fkey(full_name)",
        )
        .eq("tenant_id", tenantId)
        .gte("created_at", dayStartIso)
        .order("created_at", { ascending: false })
        .limit(120);

        if (target?.channel_id) {
          msgQuery = msgQuery.eq("channel_id", target.channel_id);
        } else if (target?.receiver_id) {
          msgQuery = msgQuery.or(
            `and(sender_id.eq.${profile.id},receiver_id.eq.${target.receiver_id}),and(sender_id.eq.${target.receiver_id},receiver_id.eq.${profile.id})`,
          );
        }

        const [msgRes, todoRes, ticketRes] = await Promise.all([
          msgQuery,
        supabase
          .from("todos")
          .select("id,title,priority,due_date,completed,created_at")
          .eq("user_id", profile.id)
          .eq("completed", false)
          .order("due_date", { ascending: true })
          .limit(30),
        supabase
          .from("tickets")
          .select("id,title,status,priority,due_date,created_at,assigned_to")
          .eq("assigned_to", profile.id)
          .neq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

        const todayMessages = msgRes?.data || [];
        const openTodos = todoRes?.data || [];
        const openTickets = ticketRes?.data || [];

        const importantMsgs = todayMessages
        .filter((x) => {
          const txt = String(x.message || "").trim();
          if (!txt) return false;
          const lower = txt.toLowerCase();
          const mentionedMe = meName && lower.includes(`@${meName}`);
          const flagged = priorityWords.test(lower);
          const unreadFromOthers = x.sender_id !== profile.id && x.is_read === false;
          return mentionedMe || flagged || unreadFromOthers;
        })
        .slice(0, 8)
        .map((x) => {
          const t = new Date(x.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `[${t}] ${x.sender?.full_name || "Someone"}: ${String(x.message || "").slice(0, 160)}`;
        });

        const todosToday = openTodos
        .filter((t) => t.due_date === todayKey)
        .slice(0, 10)
        .map((t) => `${t.title} (priority: ${t.priority || "n/a"})`);

        const ticketsToday = openTickets
        .filter((t) => {
          const due = String(t.due_date || "");
          const created = String(t.created_at || "").slice(0, 10);
          return due === todayKey || created === todayKey;
        })
        .slice(0, 10)
        .map((t) => `${t.title} (status: ${t.status || "open"}, priority: ${t.priority || "n/a"})`);

        const systemPrompt = `You are Ryzent AI inside a team chat.
Date: ${todayKey}
Answer only for the current user using the provided context.
Be concise, practical, and easy to scan.
Do not use markdown tables or code blocks.
Respond directly to what the user asked; do not force sections.
Only talk about tasks if they asked about tasks.
Only talk about important messages if they asked about messages/summary.
If they asked a general question, give a direct general answer.
If context is missing, say that clearly in one short line.
Keep the response to 2-8 short lines.`;

        const userContent = `User question:
${cleanedPrompt}

Context:
- Important messages today (${importantMsgs.length}):
${importantMsgs.length ? importantMsgs.map((x) => `  - ${x}`).join("\n") : "  - none"}
- Todos due today (${todosToday.length}):
${todosToday.length ? todosToday.map((x) => `  - ${x}`).join("\n") : "  - none"}
- Open assigned tickets relevant today (${ticketsToday.length}):
${ticketsToday.length ? ticketsToday.map((x) => `  - ${x}`).join("\n") : "  - none"}
- Total open todos: ${openTodos.length}
- Total open assigned tickets: ${openTickets.length}`;

        let aiText = "";
        try {
          aiText = formatRyzentReply(await groq(systemPrompt, userContent));
        } catch (err) {
          aiText = formatRyzentReply(
            "I could not process that right now. Please try again in a few seconds.",
          );
          console.error("Ryzent AI error:", err);
        }

        appendRyzentLocalReply(aiText);
      } catch (err) {
        console.error("askRyzentAI failed:", err);
      }
    },
    [profile, tenantId, getConvKey, mergeWithLocalRyzent],
  );

  const send = async () => {
    const hasText = newMessage.trim(),
      hasFile = !!stagedFile,
      hasAudio = !!audioURL;
    if (!hasText && !hasFile && !hasAudio) return;
    setLoading(true);
    setUploadProgress(hasFile ? 5 : 0);
    try {
      let fUrl = null,
        fType = null,
        fName = null;
      if (hasFile) {
        const { file } = stagedFile;
        const path = `${profile.id}/${Date.now()}-${file.name}`;
        setUploadProgress(20);
        await supabase.storage
          .from("chat-files")
          .upload(path, file, { contentType: file.type });
        setUploadProgress(90);
        const { data: ud } = supabase.storage
          .from("chat-files")
          .getPublicUrl(path);
        fUrl = ud.publicUrl;
        fType = stagedFile.fileType;
        fName = file.name;
      }
      if (hasAudio) {
        const res = await fetch(audioURL);
        const blob = await res.blob();
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        const path = `${profile.id}/${Date.now()}-${file.name}`;
        await supabase.storage.from("chat-files").upload(path, file);
        const { data: ud } = supabase.storage
          .from("chat-files")
          .getPublicUrl(path);
        fUrl = ud?.publicUrl;
        fType = "voice";
        fName = file.name;
      }
      const textToScan = hasFile ? pendingCaption : newMessage;
      const mentioned = [];
      const re = /@([\w][^\s@]*(?:\s[\w][^\s@]*)*)/g;
      let m;
      while ((m = re.exec(textToScan)) !== null) {
        const u = users.find(
          (u2) => u2.full_name?.toLowerCase() === m[1].trim().toLowerCase(),
        );
        if (u) mentioned.push(u.id);
      }
      const payload = {
        tenant_id: tenantId,
        sender_id: profile.id,
        message: hasFile
          ? pendingCaption.trim() || null
          : newMessage.trim() || null,
        file_url: fUrl,
        file_type: fType,
        file_name: fName,
        reply_to_id: replyTo?.id || null,
        reply_to_snapshot: replyTo
          ? {
              sender_name:
                replyTo.sender_id === profile.id
                  ? "You"
                  : replyTo.sender?.full_name || "Unknown",
              message_preview: (
                replyTo.message ||
                (replyTo.file_type === "image"
                  ? "🖼️ Image"
                  : replyTo.file_type === "voice"
                    ? "🎤 Voice"
                    : replyTo.file_type === "video"
                      ? "🎬 Video"
                      : "📎 File") ||
                ""
              ).slice(0, 80),
            }
          : null,
        is_read: false,
      };
      if (selectedChannel) payload.channel_id = selectedChannel.id;
      else if (selectedUser) payload.receiver_id = selectedUser.id;
      const aiTarget = {
        channel_id: payload.channel_id || null,
        receiver_id: payload.receiver_id || null,
      };
      const { data: ins } = await supabase
        .from("messages")
        .insert([payload])
        .select(
          "*,sender:profiles!messages_sender_id_fkey(id,full_name,user_photo)",
        )
        .single();
      if (ins && mentioned.length)
        await supabase
          .from("message_mentions")
          .insert(
            mentioned.map((uid) => ({
              tenant_id: tenantId,
              message_id: ins.id,
              mentioned_user_id: uid,
            })),
          );
      if (ins) {
        let poll = ins.poll;
        if (typeof poll === "string") {
          try {
            poll = JSON.parse(poll);
          } catch (_) {
            poll = null;
          }
        }
        setMessages((prev) => [
          ...prev,
          {
            ...ins,
            poll,
            reactions: [],
            read_by: [],
            receiver_id: selectedUser?.id ?? ins.receiver_id ?? null,
          },
        ]);
        shouldScrollRef.current = true;
      }
      setNewMessage("");
      setReplyTo(null);
      clearStaged();
      if (hasAudio) {
        URL.revokeObjectURL(audioURL);
        setAudioURL(null);
      }
      chunksRef.current = [];
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 600);

      // Trigger Ryzent AI only when explicitly mentioned in the sent text.
      if (payload.message && RYZENT_AI_MENTION_RE.test(payload.message)) {
        void askRyzentAI(payload.message, aiTarget);
      }
    } catch (e) {
      console.error(e);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const react = async (msgId, emoji) => {
    const msg = messages.find((m) => m.id === msgId);
    const ex = (msg?.reactions || []).find(
      (r) => r.user_id === profile.id && r.emoji === emoji,
    );
    if (ex) await supabase.from("message_reactions").delete().eq("id", ex.id);
    else
      await supabase
        .from("message_reactions")
        .insert([
          {
            tenant_id: tenantId,
            message_id: msgId,
            user_id: profile.id,
            emoji,
          },
        ]);
  };

  const del = async (msgId) => {
    await supabase
      .from("messages")
      .update({
        is_deleted: true,
        message: null,
        file_url: null,
        file_type: null,
        file_name: null,
      })
      .eq("id", msgId)
      .eq("sender_id", profile.id)
      .eq("tenant_id", tenantId);
  };

  const editMsg = async (msgId, newText) => {
    await supabase
      .from("messages")
      .update({ message: newText, edited_at: new Date().toISOString() })
      .eq("id", msgId)
      .eq("sender_id", profile.id)
      .eq("tenant_id", tenantId);
  };

  const voteOnPoll = async (msgId, optionIndex) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg?.poll) return;
    const poll = JSON.parse(JSON.stringify(msg.poll));
    poll.options.forEach((o) => {
      o.votes = (o.votes || []).filter((uid) => uid !== profile.id);
    });
    const alreadyVoted = msg.poll.options[optionIndex]?.votes?.includes(
      profile.id,
    );
    if (!alreadyVoted) {
      if (!poll.options[optionIndex].votes)
        poll.options[optionIndex].votes = [];
      poll.options[optionIndex].votes.push(profile.id);
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, poll } : m)),
    );
    const { data: saved, error } = await supabase
      .from("messages")
      .update({ poll: JSON.parse(JSON.stringify(poll)) })
      .eq("id", msgId)
      .select("id,poll")
      .maybeSingle();
    if (error) {
      console.error("voteOnPoll error:", error);
      fetchMessages();
      return;
    }
    if (!saved) {
      await supabase
        .from("messages")
        .update({ poll: JSON.parse(JSON.stringify(poll)) })
        .eq("id", msgId)
        .eq("tenant_id", tenantId);
      setTimeout(() => fetchMessages(), 400);
      return;
    }
    const savedPoll =
      typeof saved.poll === "string" ? JSON.parse(saved.poll) : saved.poll;
    if (savedPoll)
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, poll: savedPoll } : m)),
      );
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      recorderRef.current.ondataavailable = (e) =>
        chunksRef.current.push(e.data);
      recorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current.start();
      setRecording(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopRec = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const createChannel = async (vals) => {
    if (!canCreateChannels) {
      Modal.warning({
        title: "Not allowed",
        content: "Only company admins can create channels.",
      });
      return;
    }
    setLoading(true);
    try {
      let insertPayload = {
        name: vals.name,
        description: vals.description || null,
        tenant_id: tenantId,
      };
      if (profile?.id) insertPayload.created_by = profile.id;
      const { data: ch, error: chErr } = await supabase
        .from("channels")
        .insert([insertPayload])
        .select()
        .single();
      if (chErr || !ch) {
        console.error("createChannel error:", chErr);
        Modal.error({
          title: "Failed to create channel",
          content: chErr?.message || "Unknown error.",
        });
        return;
      }
      await supabase
        .from("channel_members")
        .upsert(
          [{ channel_id: ch.id, user_id: profile.id, tenant_id: tenantId }],
          { onConflict: "channel_id,user_id", ignoreDuplicates: true },
        );
      if (vals.members?.length) {
        await supabase.from("channel_members").upsert(
          vals.members.map((uid) => ({
            channel_id: ch.id,
            user_id: uid,
            tenant_id: tenantId,
          })),
          { onConflict: "channel_id,user_id", ignoreDuplicates: true },
        );
        const { data: memberProfiles } = await supabase
          .from("profiles")
          .select("id,full_name,email")
          .in("id", vals.members);
        (memberProfiles || []).forEach((u) => {
          if (!u.email) return;
          sendEmail({
            to: u.email,
            subject: `You've been added to #${vals.name}`,
            companyName: profile?.company_name || "Resosyncer",
            body: channelAddedEmail({
              memberName: u.full_name || u.email,
              channelName: vals.name,
              addedByName: profile?.full_name || "An admin",
              companyName: profile?.company_name || "Resosyncer",
              dashboardUrl: window.location.origin,
            }),
          });
        });
      }
      setChannelModal(false);
      form.resetFields();
      fetchChannels();
    } catch (e) {
      console.error("createChannel exception:", e);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (vals) => {
    const { error } = await supabase
      .from("channel_members")
      .upsert(
        [
          {
            channel_id: selectedChannel.id,
            user_id: vals.userId,
            tenant_id: tenantId,
          },
        ],
        { onConflict: "channel_id,user_id", ignoreDuplicates: true },
      );
    if (error) {
      console.error("addMember error:", error);
      return;
    }
    const { data: addedUser } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("id", vals.userId)
      .single();
    if (addedUser?.email)
      await sendEmail({
        to: addedUser.email,
        subject: `You've been added to #${selectedChannel.name}`,
        companyName: profile?.company_name || "Resosyncer",
        body: channelAddedEmail({
          memberName: addedUser.full_name || addedUser.email,
          channelName: selectedChannel.name,
          addedByName: profile?.full_name || "An admin",
          companyName: profile?.company_name || "Resosyncer",
          dashboardUrl: window.location.origin,
        }),
      });
    setAddMemberDrawer(false);
    addForm.resetFields();
    fetchChannelMembers(selectedChannel.id);
    fetchAvailableUsers(selectedChannel.id);
    fetchChannels();
  };

  const removeMember = (mem, name) => {
    Modal.confirm({
      title: "Remove Member",
      content: `Remove ${name} from #${selectedChannel?.name}?`,
      okText: "Remove",
      okType: "danger",
      onOk: async () => {
        const { error } = await supabase
          .from("channel_members")
          .delete()
          .eq("channel_id", selectedChannel.id)
          .eq("user_id", mem.user_id);
        if (error) {
          console.error("removeMember error:", error);
          return;
        }
        const removedUser = channelMembers.find(
          (m) => m.user_id === mem.user_id,
        );
        const email = removedUser?.profiles?.email,
          fullName = removedUser?.profiles?.full_name;
        if (email)
          sendEmail({
            to: email,
            subject: `You've been removed from #${selectedChannel.name}`,
            companyName: profile?.company_name || "Resosyncer",
            body: channelRemovedEmail({
              memberName: fullName || email,
              channelName: selectedChannel.name,
              removedByName: profile?.full_name || "An admin",
              companyName: profile?.company_name || "Resosyncer",
              dashboardUrl: window.location.origin,
            }),
          });
        fetchChannelMembers(selectedChannel.id);
        fetchChannels();
      },
    });
  };

  const deleteChannel = async () => {
    Modal.confirm({
      title: "Delete Channel",
      content: (
        <span>
          Permanently delete <strong>#{selectedChannel?.name}</strong>? All
          messages will be lost.
        </span>
      ),
      okText: "Delete Channel",
      okType: "danger",
      onOk: async () => {
        setDeletingChannel(true);
        try {
          await supabase
            .from("messages")
            .delete()
            .eq("channel_id", selectedChannel.id);
          await supabase
            .from("channel_members")
            .delete()
            .eq("channel_id", selectedChannel.id);
          const { error } = await supabase
            .from("channels")
            .delete()
            .eq("id", selectedChannel.id);
          if (error) {
            console.error("deleteChannel error:", error);
            return;
          }
          setMembersDrawer(false);
          setSelectedChannel(null);
          setMessages([]);
          fetchChannels();
        } catch (e) {
          console.error(e);
        } finally {
          setDeletingChannel(false);
        }
      },
    });
  };

  const updateChannel = async () => {
    if (!editChannelName.trim()) return;
    const { error } = await supabase
      .from("channels")
      .update({
        name: editChannelName.trim(),
        description: editChannelDesc.trim() || null,
      })
      .eq("id", selectedChannel.id);
    if (error) {
      console.error("updateChannel error:", error);
      return;
    }
    setEditingChannel(false);
    fetchChannels();
    setSelectedChannel((prev) => ({
      ...prev,
      name: editChannelName.trim(),
      description: editChannelDesc.trim() || null,
    }));
  };

  const createPoll = async () => {
    const question = pollQuestion.trim();
    const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!question || opts.length < 2) return;
    const poll = {
      question,
      options: opts.map((text) => ({ text, votes: [] })),
      closed: false,
    };
    const payload = {
      tenant_id: tenantId,
      sender_id: profile.id,
      message: null,
      poll,
    };
    if (selectedChannel) payload.channel_id = selectedChannel.id;
    else if (selectedUser) payload.receiver_id = selectedUser.id;
    await supabase.from("messages").insert([payload]);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPollCreator(false);
    fetchMessages();
  };

  const onInput = (val) => {
    const safeVal = val || "";
    setNewMessage(safeVal);
    const at = safeVal.lastIndexOf("@");
    if (at !== -1) {
      const q = safeVal.slice(at + 1);
      if (/^[\w\s]*$/.test(q) && q.length <= 30) {
        setMentionQuery(q);
        setShowMentions(true);
        setMentionIdx(0);
      } else setShowMentions(false);
    } else setShowMentions(false);
  };

  const onKey = useCallback((e) => {
    const mentionPool = [RYZENT_AI_USER, ...users];
    const currentText = newMessage;
    const at = currentText.lastIndexOf("@");
    const rawQuery = at !== -1 ? currentText.slice(at + 1) : mentionQuery;
    const query = String(rawQuery || "").trimStart().toLowerCase();
    const filt = mentionPool.filter((u) =>
      (u.full_name || "").toLowerCase().includes(query),
    );
    const hasMentionContext = showMentions || at !== -1;
    if (showMentions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIdx((i) => Math.min(i + 1, filt.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        if (filt[mentionIdx]) insMention(filt[mentionIdx]);
        return;
      }
      if (e.key === "Escape") {
        setShowMentions(false);
        return;
      }
    }
    if ((e.key === "Enter" || e.key === "Tab") && hasMentionContext) {
      if (filt.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        const safeIdx = Math.min(Math.max(mentionIdx, 0), filt.length - 1);
        insMention(filt[safeIdx] || filt[0]);
        return;
      }
    }
  }, [
    users,
    mentionQuery,
    showMentions,
    mentionIdx,
    newMessage,
    send,
  ]);

  const handleEnterAction = useCallback(() => {
    const mentionPool = [RYZENT_AI_USER, ...users];
    const currentText = newMessage;
    const at = currentText.lastIndexOf("@");
    const rawQuery = at !== -1 ? currentText.slice(at + 1) : mentionQuery;
    const query = String(rawQuery || "").trimStart().toLowerCase();
    const filt = mentionPool.filter((u) =>
      (u.full_name || "").toLowerCase().includes(query),
    );
    const hasMentionContext = showMentions || at !== -1;

    if (hasMentionContext && filt.length > 0) {
      const safeIdx = Math.min(Math.max(mentionIdx, 0), filt.length - 1);
      insMention(filt[safeIdx] || filt[0]);
      return;
    }
    send();
  }, [users, mentionQuery, showMentions, mentionIdx, newMessage, send]);

  const onInputKeyDown = useCallback(
    (e) => {
      onKey(e);
      if (e.defaultPrevented) return;
      if (e.key === "Enter") {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        handleEnterAction();
      }
    },
    [onKey, handleEnterAction],
  );

  const insMention = (u) => {
    const currentText = newMessage;
    const at = currentText.lastIndexOf("@");
    if (at === -1) return;
    const next = currentText.slice(0, at) + `@${u.full_name} `;
    setNewMessage(next);
    setShowMentions(false);
    setMentionQuery("");
    requestAnimationFrame(() => {
      const input = messageInputRef.current;
      if (!input) return;
      input.focus();
      const pos = next.length;
      if (typeof input.setSelectionRange === "function") {
        input.setSelectionRange(pos, pos);
      }
    });
  };

  const scrollTo = (id) => {
    msgRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    const el = msgRefs.current[id];
    if (el) {
      el.style.background = "rgba(245,158,11,.1)";
      setTimeout(() => (el.style.background = ""), 1500);
    }
  };

  const openConv = (ch, u) => {
    shouldScrollRef.current = true;
    if (ch) {
      setSelectedChannel(ch);
      setSelectedUser(null);
    } else {
      setSelectedUser(u);
      setSelectedChannel(null);
    }
    if (isMobile) setSidebarOpen(false);
  };

  const handleToastOpen = (t) => {
    if (t.targetChannel) {
      setSelectedChannel(t.targetChannel);
      setSelectedUser(null);
    } else if (t.targetUser) {
      setSelectedUser(t.targetUser);
      setSelectedChannel(null);
    }
    if (isMobile) setSidebarOpen(false);
  };

  const grouped = () => {
    const out = [];
    let lastDate = null;
    messages.forEach((msg, i) => {
      const ds = new Date(msg.created_at).toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      if (ds !== lastDate) {
        out.push({ type: "date", ds, key: `d-${msg.id}` });
        lastDate = ds;
      }
      out.push({ type: "msg", msg, prev: messages[i - 1], key: msg.id });
    });
    return out;
  };

  const fCh = channels.filter((c) =>
    c.name.toLowerCase().includes(sideSearch.toLowerCase()),
  );
  const fUs = users.filter((u) =>
    u.full_name?.toLowerCase().includes(sideSearch.toLowerCase()),
  );
  const convTitle = selectedChannel
    ? `# ${selectedChannel.name}`
    : selectedUser?.full_name || "";
  const convSub = selectedChannel
    ? selectedChannel.description
    : selectedUser?.email || "";
  const totalUnread = Object.values(unread).reduce((s, v) => s + v, 0);
  const canSend = newMessage.trim() || stagedFile || audioURL;
  const isStarterPlan = /free|starter/.test(
    String(orgPlan || "").toLowerCase(),
  );
  const canCreateChannels = profile?.role === "admin";

  if (planLoading) return <CommunicationAccessSkeleton dark={dark} />;
  if (isStarterPlan)
    return <FreePlanPaywall navigate={navigate} dark={dark} />;

  return (
    <>
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onOpen={handleToastOpen}
        dark={dark}
      />
      {viewerItem && (
        <MediaViewer item={viewerItem} onClose={() => setViewerItem(null)} />
      )}

      <div
        className={`comm ${dark ? "comm-dark" : "comm-light"}`}
        style={{
          display: "flex",
          height: "calc(100vh - 64px)",
          background: dark ? "#141416" : "#f8fafc",
          color: dark ? "#e5e7eb" : "#0f172a",
          "--sk1": dark ? "#1d1f24" : "#e2e8f0",
          "--sk2": dark ? "#252830" : "#f1f5f9",
          "--si-color": dark ? "#9ca3af" : "#475569",
          "--si-hover-bg": dark ? "#1e1f25" : "#f1f5f9",
          "--si-hover-color": dark ? "#e5e7eb" : "#0f172a",
          "--si-active-bg": dark
            ? "linear-gradient(135deg,#0f2f25,#123a2b)"
            : "linear-gradient(135deg,#e8f8ef,#f0fbf5)",
          "--si-active-color": dark ? "#4ade80" : "#15803d",
          "--msg-hover-bg": dark ? "#1a1b20" : "#f8fafc",
          "--mem-hover-bg": dark ? "#1e1f25" : "#f8fafc",
          "--mem-hover-border": dark ? "#2a2b31" : "#cbd5e1",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isMobile && sidebarOpen && (
          <div className="mob-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* -------------- SIDEBAR -------------- */}
        <div
          className={`comm-sidebar${isMobile && sidebarOpen ? " open" : ""}`}
          style={{
            width: isMobile ? "min(86vw, 300px)" : 256,
            flexShrink: 0,
            background: dark ? "#0f1011" : "#ffffff",
            borderRight: `1.5px solid ${dark ? "#1e1f25" : "#e2e8f0"}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            ...(isMobile
              ? {
                  position: "fixed",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  zIndex: 50,
                  transform: sidebarOpen
                    ? "translateX(0)"
                    : "translateX(-100%)",
                  transition: "transform .25s cubic-bezier(.4,0,.2,1)",
                }
              : {}),
          }}
        >
          <div
            style={{
              padding: "16px 16px 12px",
              borderBottom: `1.5px solid ${dark ? "#1e1f25" : "#e2e8f0"}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: dark ? "#f9fafb" : "#0f172a",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Workspace
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#22c55e",
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#22c55e",
                      display: "inline-block",
                    }}
                  />
                  {profile?.full_name}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {totalUnread > 0 && (
                  <span
                    className="unread-badge"
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: 99,
                      padding: "2px 7px",
                    }}
                  >
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
                {isMobile && (
                  <button className="tb" onClick={() => setSidebarOpen(false)}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderBottom: `1.5px solid ${dark ? "#1e1f25" : "#e2e8f0"}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: dark ? "#141416" : "#f8fafc",
                borderRadius: 10,
                padding: "7px 11px",
                border: `1.5px solid ${dark ? "#1e1f25" : "#dbe2ea"}`,
              }}
            >
              <Search size={13} color={dark ? "#6b7280" : "#94a3b8"} />
              <input
                value={sideSearch}
                onChange={(e) => setSideSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: dark ? "#e5e7eb" : "#0f172a",
                  fontSize: 13,
                  width: "100%",
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
            {/* Channels */}
            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 8px",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: dark ? "#6b7280" : "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Channels
                </span>
                {canCreateChannels && (
                  <button
                    className="tb"
                    style={{ width: 22, height: 22 }}
                    title="Create channel"
                    aria-label="Create channel"
                    onClick={() => setChannelModal(true)}
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>
              {loadingChannels ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonChannelItem key={i} dark={dark} />
                ))
              ) : fCh.length === 0 ? (
                <EmptyState
                  icon={Hash}
                  title="No channels yet"
                  subtitle={
                    canCreateChannels
                      ? "Create one or ask an admin to add you"
                      : "Ask your company admin to add you to a channel"
                  }
                  iconColor="#818cf8"
                  iconBg="rgba(129,140,248,.12)"
                />
              ) : (
                fCh.map((ch) => (
                  <div
                    key={ch.id}
                    className={`si${selectedChannel?.id === ch.id ? " active" : ""}`}
                    style={{ justifyContent: "space-between" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        flex: 1,
                      }}
                      onClick={() => openConv(ch, null)}
                    >
                      <Hash size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ch.name}
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      {mentions[ch.id] && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            background: "#2563eb",
                            color: "#fff",
                            borderRadius: 4,
                            padding: "1px 5px",
                          }}
                        >
                          @
                        </span>
                      )}
                      {(unread[ch.id] || 0) > 0 && (
                        <span
                          className="unread-badge"
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: "#ef4444",
                            color: "#fff",
                            borderRadius: 99,
                            padding: "0 5px",
                            minWidth: 18,
                            textAlign: "center",
                            lineHeight: "18px",
                          }}
                        >
                          {unread[ch.id] > 99 ? "99+" : unread[ch.id]}
                        </span>
                      )}
                      {profile?.role === "admin" && (
                        <button
                          className="tb"
                          style={{ width: 22, height: 22 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChannel(ch);
                            fetchChannelMembers(ch.id);
                            setChannelSettingsTab("members");
                            setEditingChannel(false);
                            setMembersDrawer(true);
                          }}
                        >
                          <Settings size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* DMs */}
            <div>
              <div style={{ padding: "0 8px", marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: dark ? "#6b7280" : "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Direct Messages
                </span>
              </div>
              {loadingUsers ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonSidebarItem key={i} dark={dark} />
                ))
              ) : fUs.length === 0 ? (
                <EmptyState
                  icon={UserCircle2}
                  title="No teammates found"
                  subtitle={
                    sideSearch
                      ? "Try a different search"
                      : "No other users in this workspace"
                  }
                  iconColor="#38bdf8"
                  iconBg="rgba(56,189,248,.1)"
                />
              ) : (
                fUs.map((u) => {
                  const isOnline = !!presence[u.id];
                  return (
                    <div
                      key={u.id}
                      className={`si${selectedUser?.id === u.id ? " active" : ""}`}
                      style={{ justifyContent: "space-between" }}
                      onClick={() => openConv(null, u)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Ava
                          user={u}
                          size={22}
                          dot={isOnline ? "active" : "off"}
                          variant="dm"
                        />
                        <span
                          style={{
                            fontSize: 12,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 118,
                          }}
                        >
                          {u.full_name}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {mentions[u.id] && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              background: "#2563eb",
                              color: "#fff",
                              borderRadius: 4,
                              padding: "1px 5px",
                            }}
                          >
                            @
                          </span>
                        )}
                        {(unread[u.id] || 0) > 0 && (
                          <span
                            className="unread-badge"
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              background: "#ef4444",
                              color: "#fff",
                              borderRadius: 99,
                              padding: "0 5px",
                              minWidth: 18,
                              textAlign: "center",
                              lineHeight: "18px",
                            }}
                          >
                            {unread[u.id] > 99 ? "99+" : unread[u.id]}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderTop: `1.5px solid ${dark ? "#1e1f25" : "#e2e8f0"}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Ava user={profile} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: dark ? "#f9fafb" : "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profile?.full_name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: dark ? "#6b7280" : "#64748b",
                  textTransform: "capitalize",
                }}
              >
                {profile?.role}
              </div>
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
                flexShrink: 0,
              }}
            />
          </div>
        </div>

        {/* -------------- CHAT -------------- */}
        {selectedUser || selectedChannel ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: dark ? "#141416" : "#f8fafc",
              minWidth: 0,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: isMobile ? "10px 12px" : "12px 16px",
                borderBottom: `1.5px solid ${dark ? "#1e1f25" : "#e2e8f0"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                background: dark ? "#0f1011" : "#ffffff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {isMobile && (
                  <button className="tb" onClick={() => setSidebarOpen(true)}>
                    <ArrowLeft size={18} />
                  </button>
                )}
                {selectedUser ? (
                  <Ava
                    user={selectedUser}
                    size={isMobile ? 32 : 38}
                    dot={presence[selectedUser.id] ? "active" : "off"}
                    variant="dm"
                  />
                ) : (
                  <div
                    style={{
                      width: isMobile ? 32 : 38,
                      height: isMobile ? 32 : 38,
                      borderRadius: isMobile ? 10 : 12,
                      background: "rgba(99,102,241,.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1.5px solid rgba(99,102,241,.25)",
                    }}
                  >
                    <Hash size={isMobile ? 15 : 17} color="#818cf8" />
                  </div>
                )}
                <div>
                  <div
                    style={{
                      fontSize: isMobile ? 14 : 15,
                      fontWeight: 800,
                      color: dark ? "#f9fafb" : "#0f172a",
                    }}
                  >
                    {convTitle}
                  </div>
                  {convSub && (
                    <div
                      style={{
                        fontSize: isMobile ? 11 : 12,
                        color: dark ? "#6b7280" : "#64748b",
                        marginTop: 1,
                      }}
                    >
                      {convSub}
                    </div>
                  )}
                  {selectedUser && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        marginTop: 1,
                        color: presence[selectedUser.id]
                          ? "#22c55e"
                          : dark
                            ? "#6b7280"
                            : "#64748b",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: presence[selectedUser.id]
                            ? "#22c55e"
                            : dark
                              ? "#6b7280"
                              : "#94a3b8",
                        }}
                      />
                      {presence[selectedUser.id] ? "Online" : "Offline"}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Tooltip title="Start video call">
                  <button
                    className="tb"
                    style={{
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      color: "#60a5fa",
                      background: "rgba(37,99,235,.12)",
                      border: "1.5px solid rgba(37,99,235,.2)",
                      borderRadius: 9,
                    }}
                    onClick={() => createCall("video")}
                  >
                    <Video size={isMobile ? 14 : 16} />
                  </button>
                </Tooltip>
                <Tooltip title="Start audio call">
                  <button
                    className="tb"
                    style={{
                      width: isMobile ? 32 : 36,
                      height: isMobile ? 32 : 36,
                      color: "#22c55e",
                      background: "rgba(34,197,94,.1)",
                      border: "1.5px solid rgba(34,197,94,.2)",
                      borderRadius: 9,
                    }}
                    onClick={() => createCall("audio")}
                  >
                    <PhoneCall size={isMobile ? 14 : 16} />
                  </button>
                </Tooltip>
                {selectedChannel && profile?.role === "admin" && (
                  <button
                    className="tb"
                    style={{ width: isMobile ? 32 : 36, height: isMobile ? 32 : 36 }}
                    onClick={() => {
                      fetchChannelMembers(selectedChannel.id);
                      setChannelSettingsTab("members");
                      setEditingChannel(false);
                      setMembersDrawer(true);
                    }}
                  >
                    <Users size={isMobile ? 14 : 16} />
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: 4 }}>
              {loadingMessages ? (
                <div style={{ paddingTop: 16 }}>
                  {[true, false, false, true, false, true, false].map(
                    (w, i) => (
                      <SkeletonMessage
                        key={i}
                        hasAvatar={i === 0 || i === 3 || i === 5}
                        wide={w}
                        dark={dark}
                      />
                    ),
                  )}
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    gap: 16,
                    padding: "60px 24px",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 22,
                      background: selectedChannel
                        ? "rgba(99,102,241,.12)"
                        : "rgba(34,197,94,.1)",
                      border: `1.5px solid ${selectedChannel ? "rgba(99,102,241,.25)" : "rgba(34,197,94,.2)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 8px 24px ${selectedChannel ? "rgba(99,102,241,.1)" : "rgba(34,197,94,.1)"}`,
                    }}
                  >
                    {selectedChannel ? (
                      <MessagesSquare
                        size={30}
                        color="#818cf8"
                        strokeWidth={1.5}
                      />
                    ) : (
                      <Inbox size={30} color="#22c55e" strokeWidth={1.5} />
                    )}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: dark ? "#f9fafb" : "#0f172a",
                        marginBottom: 6,
                      }}
                    >
                      {selectedChannel
                        ? `Welcome to #${selectedChannel.name}`
                        : "Start a conversation"}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: dark ? "#4b5563" : "#64748b",
                        lineHeight: 1.6,
                        maxWidth: 280,
                      }}
                    >
                      {selectedChannel
                        ? selectedChannel.description ||
                          "This is the beginning of the channel. Say hi!"
                        : `This is the beginning of your conversation with ${selectedUser?.full_name}.`}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {grouped().map((item) => {
                    if (item.type === "date")
                      return (
                        <div key={item.key} className="datediv">
                          {item.ds}
                        </div>
                      );
                    return (
                      <div
                        key={item.key}
                        ref={(el) => {
                          msgRefs.current[item.msg.id] = el;
                        }}
                      >
                        <MsgRow
                          msg={item.msg}
                          prev={item.prev}
                          dark={dark}
                          profile={profile}
                          users={users}
                          presence={presence}
                          onReact={react}
                          onReply={setReplyTo}
                          onEdit={editMsg}
                          onDelete={del}
                          onScrollTo={scrollTo}
                          onView={setViewerItem}
                          onVote={voteOnPoll}
                        />
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: "0 16px 16px", flexShrink: 0 }}>
              {showPollCreator &&
                profile?.role === "admin" &&
                selectedChannel && (
                  <div
                    style={{
                      background: dark ? "#1a1b20" : "#ffffff",
                      border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                      borderRadius: 14,
                      padding: "16px",
                      marginBottom: 10,
                      boxShadow: dark
                        ? "0 8px 24px rgba(0,0,0,.4)"
                        : "0 8px 24px rgba(15,23,42,.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: dark ? "#e5e7eb" : "#0f172a",
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <BarChart2 size={16} color="#60a5fa" /> New Poll
                      </span>
                      <button
                        className="tb"
                        onClick={() => {
                          setShowPollCreator(false);
                          setPollQuestion("");
                          setPollOptions(["", ""]);
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <input
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Ask a question..."
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                        fontSize: 14,
                        fontWeight: 600,
                        color: dark ? "#e5e7eb" : "#0f172a",
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                        outline: "none",
                        background: dark ? "#141416" : "#f8fafc",
                        boxSizing: "border-box",
                        marginBottom: 10,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginBottom: 10,
                      }}
                    >
                      {pollOptions.map((opt, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 700,
                              color: dark ? "#4b5563" : "#64748b",
                              flexShrink: 0,
                              background: dark ? "#1e1f25" : "#eef2f7",
                            }}
                          >
                            {i + 1}
                          </div>
                          <input
                            value={opt}
                            onChange={(e) => {
                              const o = [...pollOptions];
                              o[i] = e.target.value;
                              setPollOptions(o);
                            }}
                            placeholder={`Option ${i + 1}`}
                            style={{
                              flex: 1,
                              padding: "8px 11px",
                              borderRadius: 8,
                              border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                              fontSize: 13,
                              color: dark ? "#e5e7eb" : "#0f172a",
                              fontFamily: "'Plus Jakarta Sans',sans-serif",
                              outline: "none",
                              background: dark ? "#141416" : "#f8fafc",
                            }}
                          />
                          {pollOptions.length > 2 && (
                            <button
                              className="tb"
                              style={{ flexShrink: 0 }}
                              onClick={() =>
                                setPollOptions((p) =>
                                  p.filter((_, j) => j !== i),
                                )
                              }
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {pollOptions.length < 6 && (
                        <button
                          onClick={() => setPollOptions((p) => [...p, ""])}
                          style={{
                            flex: 1,
                            padding: "8px 0",
                            borderRadius: 8,
                            border: `1.5px dashed ${dark ? "#2a2b31" : "#dbe2ea"}`,
                            background: "transparent",
                            color: dark ? "#4b5563" : "#64748b",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                          }}
                        >
                          + Add Option
                        </button>
                      )}
                      <button
                        onClick={createPoll}
                        disabled={
                          !pollQuestion.trim() ||
                          pollOptions.filter((o) => o.trim()).length < 2
                        }
                        style={{
                          flex: 2,
                          padding: "8px 0",
                          borderRadius: 8,
                          border: "none",
                          background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: "'Plus Jakarta Sans',sans-serif",
                          boxShadow: "0 4px 12px rgba(37,99,235,.3)",
                          opacity:
                            !pollQuestion.trim() ||
                            pollOptions.filter((o) => o.trim()).length < 2
                              ? 0.5
                              : 1,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                      }}
                    >
                      <BarChart2 size={14} />
                      Launch Poll
                    </button>
                    </div>
                  </div>
                )}

              <div
                className="input-wrap"
                style={{
                  background: dark ? "#1a1b20" : "#ffffff",
                  borderColor: dark ? "#2a2b31" : "#dbe2ea",
                }}
              >
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="upload-bar">
                    <div
                      className="upload-bar-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                {showMentions && (
                  <MentionList
                    users={users}
                    query={mentionQuery}
                    activeIdx={mentionIdx}
                    onSelect={insMention}
                    dark={dark}
                  />
                )}

                {replyTo && (
                  <div
                    style={{
                      padding: "10px 12px 0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div className="rq-bar" style={{ flex: 1, marginRight: 8 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#60a5fa",
                          fontSize: 12,
                        }}
                      >
                        Replying to{" "}
                        {replyTo.sender_id === profile.id
                          ? "You"
                          : replyTo.sender?.full_name || ""}
                      </span>
                      <span
                        style={{
                          color: dark ? "#4b5563" : "#64748b",
                          marginLeft: 6,
                          fontSize: 12,
                        }}
                      >
                        {(replyTo.message || "").slice(0, 90) ||
                          (replyTo.file_type === "image"
                            ? "🖼️ Image"
                            : replyTo.file_type === "voice"
                              ? "🎤 Voice"
                              : replyTo.file_type === "video"
                                ? "🎬 Video"
                                : "📎 File")}
                      </span>
                    </div>
                    <button className="tb" onClick={() => setReplyTo(null)}>
                      <X size={13} />
                    </button>
                  </div>
                )}

                {stagedFile && (
                  <div style={{ padding: "10px 12px 0" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "10px 12px",
                        background: dark ? "#141416" : "#f8fafc",
                        border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                        borderRadius: 12,
                      }}
                    >
                      {stagedFile.fileType === "image" ? (
                        <img
                          src={stagedFile.previewUrl}
                          alt=""
                          style={{
                            width: 68,
                            height: 68,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                          }}
                        />
                      ) : stagedFile.fileType === "video" ? (
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <video
                            src={stagedFile.previewUrl}
                            style={{
                              width: 68,
                              height: 68,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 8,
                              background: "rgba(0,0,0,.5)",
                            }}
                          >
                            <Video size={20} color="#fff" />
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            flexShrink: 0,
                            background:
                              "linear-gradient(135deg,#3b82f6,#6366f1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FileText size={22} color="#fff" />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: dark ? "#e5e7eb" : "#0f172a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {stagedFile.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: dark ? "#4b5563" : "#64748b",
                            marginBottom: 6,
                          }}
                        >
                          {stagedFile.fileType === "image"
                            ? "🖼️ Image"
                            : stagedFile.fileType === "video"
                              ? `🎬 ${extOf(stagedFile.name)} Video`
                              : `📎 ${extOf(stagedFile.name)} Document`}
                        </div>
                        <input
                          value={pendingCaption}
                          onChange={(e) => setPendingCaption(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              send();
                            }
                          }}
                          placeholder="Add a caption... (optional)"
                          style={{
                            width: "100%",
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            fontSize: 13,
                            color: dark ? "#e5e7eb" : "#0f172a",
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                          }}
                        />
                      </div>
                      <button className="tb" onClick={clearStaged}>
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {audioURL && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 12px 0",
                    }}
                  >
                    <audio
                      controls
                      src={audioURL}
                      style={{ height: 36, flex: 1, borderRadius: 8 }}
                    />
                    <button
                      className="tb"
                      onClick={() => {
                        URL.revokeObjectURL(audioURL);
                        setAudioURL(null);
                        chunksRef.current = [];
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "4px 10px 6px",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) stageFile(f);
                      e.target.value = "";
                    }}
                  />
                  <Tooltip title="Attach file, image or video">
                    <button
                      className="tb"
                      style={{
                        marginRight: 4,
                        color: stagedFile ? "#60a5fa" : undefined,
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip size={17} />
                    </button>
                  </Tooltip>
                  <div style={{ flex: 1, position: "relative" }}>
                    <textarea
                      ref={messageInputRef}
                      className="comm-ta"
                      value={newMessage}
                      onChange={(e) => onInput(e.target.value)}
                      onKeyDown={onInputKeyDown}
                      rows={1}
                      placeholder={
                        stagedFile
                          ? "Add a caption or press send..."
                          : `Message ${convTitle}...`
                      }
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      marginLeft: 4,
                    }}
                  >
                    <Tooltip title="Mention someone">
                      <button
                        className="tb"
                        onClick={() => {
                          const input = messageInputRef.current;
                          if (input) {
                            const start =
                              typeof input.selectionStart === "number"
                                ? input.selectionStart
                                : newMessage.length;
                            const end =
                              typeof input.selectionEnd === "number"
                                ? input.selectionEnd
                                : start;
                            const next =
                              newMessage.slice(0, start) +
                              "@" +
                              newMessage.slice(end);
                            onInput(next);
                            requestAnimationFrame(() => {
                              input.focus();
                              input.setSelectionRange(start + 1, start + 1);
                            });
                          } else {
                            onInput(newMessage + "@");
                          }
                          setShowMentions(true);
                          setMentionQuery("");
                        }}
                      >
                        <AtSign size={16} />
                      </button>
                    </Tooltip>
                    {profile?.role === "admin" && selectedChannel && (
                      <Tooltip title="Create a poll">
                        <button
                          className="tb"
                          style={{
                            color: showPollCreator ? "#60a5fa" : undefined,
                          }}
                          onClick={() => setShowPollCreator((v) => !v)}
                        >
                          <BarChart2 size={16} />
                        </button>
                      </Tooltip>
                    )}
                    <Tooltip
                      title={recording ? "Stop recording" : "Record voice"}
                    >
                      <button
                        className="tb"
                        style={{ color: recording ? "#ef4444" : undefined }}
                        onClick={recording ? stopRec : startRec}
                      >
                        {recording ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    </Tooltip>
                    <button
                      onClick={send}
                      disabled={loading || !canSend}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        border: "none",
                        background: canSend
                          ? "linear-gradient(135deg,#2563eb,#4f46e5)"
                          : dark
                            ? "#1e1f25"
                            : "#e2e8f0",
                        color: canSend ? "#fff" : dark ? "#6b7280" : "#64748b",
                        cursor: canSend ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all .15s",
                        boxShadow: canSend
                          ? "0 4px 12px rgba(37,99,235,.35)"
                          : "none",
                      }}
                    >
                      {loading ? (
                        <div
                          style={{
                            width: 15,
                            height: 15,
                            border: "2px solid rgba(255,255,255,.3)",
                            borderTopColor: "#fff",
                            borderRadius: "50%",
                          }}
                          className="spin"
                        />
                      ) : (
                        <Send size={15} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 16,
              background: dark ? "#141416" : "#f8fafc",
            }}
          >
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  background: dark ? "#1a1b20" : "#ffffff",
                  border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: dark ? "#e5e7eb" : "#0f172a",
                  boxShadow: dark
                    ? "0 2px 8px rgba(0,0,0,.3)"
                    : "0 2px 8px rgba(15,23,42,.08)",
                }}
              >
                <Hash size={14} /> Open Chats
              </button>
            )}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "rgba(99,102,241,.12)",
                border: "1.5px solid rgba(99,102,241,.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(99,102,241,.1)",
              }}
            >
              <MessageSquare size={30} color="#818cf8" strokeWidth={1.5} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: dark ? "#f9fafb" : "#0f172a",
                  marginBottom: 6,
                }}
              >
                Jump back in
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: dark ? "#6b7280" : "#64748b",
                  maxWidth: 260,
                  lineHeight: 1.6,
                }}
              >
                {isMobile
                  ? "Tap 'Open Chats' to pick a conversation"
                  : "Pick a channel or person from the sidebar"}
              </div>
            </div>
          </div>
        )}

        {/* Create Channel Modal */}
        <Modal
          title={
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 800,
                color: dark ? "#e5e7eb" : "#0f172a",
              }}
            >
              Create a Channel
            </span>
          }
          open={channelModal && canCreateChannels}
          onCancel={() => {
            setChannelModal(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText="Create Channel"
          confirmLoading={loading}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={createChannel}
            style={{ marginTop: 14 }}
          >
            <Form.Item
              name="name"
              label="Channel Name"
              rules={[{ required: true, message: "Enter a name" }]}
            >
              <Input
                prefix={<Hash size={13} color="#374151" />}
                placeholder="e.g. general"
              />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea
                rows={2}
                placeholder="What's this channel about?"
              />
            </Form.Item>
            <Form.Item name="members" label="Add Members">
              <Select
                mode="multiple"
                placeholder="Select team members"
                options={users.map((u) => ({
                  label: u.full_name,
                  value: u.id,
                }))}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Channel Members Drawer */}
        <Drawer
          open={membersDrawer}
          onClose={() => {
            setMembersDrawer(false);
            setChannelMembers([]);
          }}
          width={Math.min(420, window.innerWidth)}
          placement="right"
          title={null}
          closable={false}
          styles={{
            body: {
              padding: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              background: dark ? "#1a1b20" : "#ffffff",
            },
          }}
        >
          <div
            style={{
              padding: "20px 24px 0",
              borderBottom: `1.5px solid ${dark ? "#1e1f25" : "#e2e8f0"}`,
              background: dark ? "#0f1011" : "#f8fafc",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(99,102,241,.3)",
                  }}
                >
                  <Hash size={18} color="#fff" />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: dark ? "#f9fafb" : "#0f172a",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {selectedChannel?.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: dark ? "#4b5563" : "#64748b",
                      fontWeight: 500,
                      marginTop: 1,
                    }}
                  >
                    {channelMembers.length} member
                    {channelMembers.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMembersDrawer(false);
                  setChannelMembers([]);
                  setChannelSettingsTab("members");
                  setEditingChannel(false);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: dark ? "rgba(255,255,255,.06)" : "#ffffff",
                  border: dark ? "none" : "1.5px solid #dbe2ea",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: dark ? "#6b7280" : "#64748b",
                }}
              >
                <X size={15} />
              </button>
            </div>
            {profile?.role === "admin" && (
              <div style={{ display: "flex", gap: 0, marginBottom: -1 }}>
                {[
                  { key: "members", label: "Members" },
                  { key: "settings", label: "Settings" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setChannelSettingsTab(tab.key);
                      setEditingChannel(false);
                    }}
                    style={{
                      padding: "8px 18px",
                      fontSize: 13,
                      fontWeight: 600,
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color:
                        channelSettingsTab === tab.key
                          ? "#60a5fa"
                          : dark
                            ? "#4b5563"
                            : "#64748b",
                      borderBottom: `2px solid ${channelSettingsTab === tab.key ? "#3b82f6" : "transparent"}`,
                      transition: "all .15s",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {channelSettingsTab === "members" && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {profile?.role === "admin" && (
                <div style={{ padding: "14px 24px 0" }}>
                  <button
                    onClick={() => {
                      fetchAvailableUsers(selectedChannel?.id);
                      setAddMemberDrawer(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                      boxShadow: "0 4px 12px rgba(37,99,235,.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <UserPlus size={15} /> Add Member
                  </button>
                </div>
              )}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 24px 24px",
                }}
              >
                {channelMembers.filter((m) => !!presence[m.user_id]).length >
                  0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#22c55e",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#22c55e",
                        }}
                      />
                      Online
                      {
                        channelMembers.filter((m) => !!presence[m.user_id])
                          .length
                      }
                    </div>
                    {channelMembers
                      .filter((m) => !!presence[m.user_id])
                      .map((m) => renderMemberCard(m))}
                  </div>
                )}
                {channelMembers.filter((m) => !presence[m.user_id]).length >
                  0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: dark ? "#374151" : "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: dark ? "#4b5563" : "#94a3b8",
                        }}
                      />
                      Offline
                      {
                        channelMembers.filter((m) => !presence[m.user_id])
                          .length
                      }
                    </div>
                    {channelMembers
                      .filter((m) => !presence[m.user_id])
                      .map((m) => renderMemberCard(m))}
                  </div>
                )}
              </div>
            </div>
          )}

          {channelSettingsTab === "settings" && profile?.role === "admin" && (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                background: dark ? "#1a1b20" : "#ffffff",
              }}
            >
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 14,
                  }}
                >
                  Channel Info
                </div>
                {!editingChannel ? (
                  <div
                    style={{
                      background: dark ? "#141416" : "#f8fafc",
                      border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                      borderRadius: 12,
                      padding: "16px",
                    }}
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
                            fontSize: 15,
                            fontWeight: 700,
                            color: dark ? "#f9fafb" : "#0f172a",
                          }}
                        >
                          #{selectedChannel?.name}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: dark ? "#4b5563" : "#64748b",
                            marginTop: 4,
                          }}
                        >
                          {selectedChannel?.description || (
                            <span
                              style={{
                                fontStyle: "italic",
                                color: dark ? "#374151" : "#94a3b8",
                              }}
                            >
                              No description
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingChannel(true);
                          setEditChannelName(selectedChannel?.name || "");
                          setEditChannelDesc(
                            selectedChannel?.description || "",
                          );
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "6px 12px",
                          background: dark ? "#1e1f25" : "#ffffff",
                          border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                          color: dark ? "#9ca3af" : "#475569",
                          flexShrink: 0,
                          marginLeft: 12,
                        }}
                      >
                        <Settings size={12} /> Edit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: dark ? "#141416" : "#ffffff",
                      border: "1.5px solid #3b82f6",
                      borderRadius: 12,
                      padding: "16px",
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#9ca3af",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Channel Name
                      </label>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: dark ? "#1a1b20" : "#f8fafc",
                          border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                          borderRadius: 8,
                          padding: "8px 12px",
                        }}
                      >
                        <Hash size={13} color="#374151" />
                        <input
                          value={editChannelName}
                          onChange={(e) => setEditChannelName(e.target.value)}
                          style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            fontSize: 14,
                            fontWeight: 600,
                            color: dark ? "#e5e7eb" : "#0f172a",
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                            background: "transparent",
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#9ca3af",
                          display: "block",
                          marginBottom: 6,
                        }}
                      >
                        Description
                      </label>
                      <textarea
                        value={editChannelDesc}
                        onChange={(e) => setEditChannelDesc(e.target.value)}
                        rows={2}
                        placeholder="What's this channel about?"
                        style={{
                          width: "100%",
                          border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 13,
                          color: dark ? "#e5e7eb" : "#0f172a",
                          fontFamily: "'Plus Jakarta Sans',sans-serif",
                          resize: "none",
                          outline: "none",
                          background: dark ? "#1a1b20" : "#ffffff",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setEditingChannel(false)}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: 8,
                          border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                          background: dark ? "#1e1f25" : "#ffffff",
                          color: dark ? "#4b5563" : "#64748b",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateChannel}
                        style={{
                          flex: 2,
                          padding: "8px 0",
                          borderRadius: 8,
                          border: "none",
                          background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 14,
                  }}
                >
                  Danger Zone
                </div>
                <div
                  style={{
                    background: "rgba(239,68,68,.06)",
                    border: "1.5px solid rgba(239,68,68,.2)",
                    borderRadius: 12,
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#fca5a5",
                          marginBottom: 4,
                        }}
                      >
                        Delete this channel
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#ef4444",
                          lineHeight: 1.5,
                          opacity: 0.7,
                        }}
                      >
                        Permanently deletes the channel and all its messages.
                        This action cannot be undone.
                      </div>
                    </div>
                    <button
                      onClick={deleteChannel}
                      disabled={deletingChannel}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        background: "rgba(239,68,68,.15)",
                        color: "#ef4444",
                        border: "1.5px solid rgba(239,68,68,.3)",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                        opacity: deletingChannel ? 0.6 : 1,
                      }}
                    >
                      <Trash2 size={13} />
                      {deletingChannel ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* Add Member Drawer */}
        <Drawer
          open={addMemberDrawer}
          onClose={() => {
            setAddMemberDrawer(false);
            addForm.resetFields();
          }}
          width={Math.min(400, window.innerWidth)}
          placement="right"
          title={null}
          closable={false}
          styles={{
            body: { padding: 0, background: dark ? "#1a1b20" : "#ffffff" },
          }}
        >
          <div
            style={{
              padding: "24px 24px 20px",
              borderBottom: `1.5px solid ${dark ? "#1e1f25" : "#e2e8f0"}`,
              background: dark ? "#0f1011" : "#f8fafc",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(37,99,235,.3)",
                }}
              >
                <UserPlus size={20} color="#fff" />
              </div>
              <button
                onClick={() => {
                  setAddMemberDrawer(false);
                  addForm.resetFields();
                }}
                style={{
                  background: dark ? "#1e1f25" : "#ffffff",
                  border: dark ? "none" : "1.5px solid #dbe2ea",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: dark ? "#4b5563" : "#64748b",
                }}
              >
                <X size={15} />
              </button>
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: dark ? "#f9fafb" : "#0f172a",
              }}
            >
              Add Member
            </div>
            <div
              style={{
                fontSize: 13,
                color: dark ? "#4b5563" : "#64748b",
                marginTop: 4,
              }}
            >
              Add to{" "}
              <span style={{ color: "#60a5fa", fontWeight: 700 }}>
                #{selectedChannel?.name}
              </span>
            </div>
          </div>
          <div
            style={{
              padding: "20px 24px",
              overflowY: "auto",
              maxHeight: "calc(100vh - 240px)",
            }}
          >
            <Form form={addForm} layout="vertical" onFinish={addMember}>
              <Form.Item
                name="userId"
                label={
                  <span
                    style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af" }}
                  >
                    Select member
                  </span>
                }
                rules={[{ required: true, message: "Select a user" }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  showSearch
                  placeholder="Search by name or email..."
                  filterOption={(inp, opt) =>
                    opt.label.toLowerCase().includes(inp.toLowerCase())
                  }
                  style={{ width: "100%" }}
                  size="large"
                  options={availableUsers.map((u) => ({
                    label: `${u.full_name} (${u.email})`,
                    value: u.id,
                  }))}
                />
              </Form.Item>
            </Form>
            {availableUsers.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 10,
                  }}
                >
                  Not in channel · {availableUsers.length}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {availableUsers.map((u) => {
                    const isOnline = !!presence[u.id];
                    return (
                      <div
                        key={u.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: `1.5px solid ${dark ? "#1e1f25" : "#dbe2ea"}`,
                          background: dark ? "#141416" : "#ffffff",
                          transition: "all .15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = dark
                            ? "#2a2b31"
                            : "#cbd5e1";
                          e.currentTarget.style.background = dark
                            ? "#1a1b20"
                            : "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = dark
                            ? "#1e1f25"
                            : "#dbe2ea";
                          e.currentTarget.style.background = dark
                            ? "#141416"
                            : "#ffffff";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <Ava
                            user={u}
                            size={36}
                            dot={isOnline ? "active" : "off"}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: dark ? "#e5e7eb" : "#0f172a",
                              }}
                            >
                              {u.full_name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: dark ? "#374151" : "#94a3b8",
                                marginTop: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span style={{ textTransform: "capitalize" }}>
                                {u.role}
                              </span>
                              {isOnline && (
                                <span
                                  style={{
                                    color: "#22c55e",
                                    fontWeight: 700,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: "#22c55e",
                                    }}
                                  />
                                  Online
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            addForm.setFieldsValue({ userId: u.id });
                            addForm.submit();
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 12px",
                            background: "rgba(37,99,235,.12)",
                            color: "#60a5fa",
                            border: "1.5px solid rgba(37,99,235,.2)",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                            whiteSpace: "nowrap",
                            transition: "all .15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "linear-gradient(135deg,#2563eb,#4f46e5)";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "rgba(37,99,235,.12)";
                            e.currentTarget.style.color = "#60a5fa";
                          }}
                        >
                          <Plus size={12} /> Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "16px 24px",
              borderTop: `1.5px solid ${dark ? "#1e1f25" : "#e2e8f0"}`,
              background: dark ? "#1a1b20" : "#ffffff",
              display: "flex",
              gap: 10,
            }}
          >
            <button
              onClick={() => {
                setAddMemberDrawer(false);
                addForm.resetFields();
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: `1.5px solid ${dark ? "#2a2b31" : "#dbe2ea"}`,
                background: dark ? "#141416" : "#f8fafc",
                color: dark ? "#4b5563" : "#64748b",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => addForm.submit()}
              style={{
                flex: 2,
                padding: "10px 0",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                boxShadow: "0 4px 14px rgba(37,99,235,.3)",
              }}
            >
              Add to Channel
            </button>
          </div>
        </Drawer>
      </div>
    </>
  );

  function renderMemberCard(m) {
    const isOnline = !!presence[m.user_id];
    return (
      <div
        key={m.id}
        className="mem-card"
        style={{
          background: dark ? "#18191e" : "#ffffff",
          border: `1.5px solid ${dark ? "#1e1f25" : "#dbe2ea"}`,
          "--mem-hover-bg": dark ? "#1e1f25" : "#f8fafc",
          "--mem-hover-border": dark ? "#2a2b31" : "#cbd5e1",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Ava user={m.profiles} size={42} dot={isOnline ? "active" : "off"} />
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: dark ? "#e5e7eb" : "#0f172a",
              }}
            >
              {m.profiles?.full_name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: dark ? "#4b5563" : "#64748b",
                marginTop: 1,
              }}
            >
              {m.profiles?.email}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginTop: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: dark ? "#1e1f25" : "#f1f5f9",
                  color: dark ? "#4b5563" : "#475569",
                  borderRadius: 4,
                  padding: "2px 7px",
                  textTransform: "capitalize",
                }}
              >
                {m.profiles?.role}
              </span>
              {isOnline ? (
                <span
                  style={{
                    fontSize: 11,
                    color: "#22c55e",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#22c55e",
                    }}
                  />
                  Online
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    color: dark ? "#374151" : "#94a3b8",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: dark ? "#4b5563" : "#94a3b8",
                    }}
                  />
                  Offline
                </span>
              )}
            </div>
          </div>
        </div>
        {profile?.role === "admin" && m.user_id !== profile.id && (
          <button
            onClick={() => removeMember(m, m.profiles?.full_name)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              background: "rgba(239,68,68,.1)",
              color: "#ef4444",
              border: "1.5px solid rgba(239,68,68,.2)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            <Trash2 size={12} /> Remove
          </button>
        )}
      </div>
    );
  }
};

export default Communication;
