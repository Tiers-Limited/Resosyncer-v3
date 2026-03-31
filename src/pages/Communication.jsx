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

if (!document.getElementById("comm-css")) {
  const s = document.createElement("style");
  s.id = "comm-css";
  s.textContent = `
    .comm * { box-sizing:border-box; font-family:'Plus Jakarta Sans',sans-serif; }
    .comm ::-webkit-scrollbar { width:4px; }
    .comm ::-webkit-scrollbar-track { background:transparent; }
    .comm ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:99px; }
    .si { display:flex;align-items:center;gap:8px;padding:5px 10px;border-radius:8px;
      cursor:pointer;transition:all .15s;color:#64748b;font-size:13.5px;font-weight:500;
      user-select:none;margin-bottom:1px; }
    .si:hover { background:#f1f5f9;color:#1e293b; }
    .si.active { background:linear-gradient(135deg,#eff6ff,#eef2ff);color:#2563eb;font-weight:600;
      box-shadow:0 1px 3px rgba(37,99,235,.08); }
    .msg-row { position:relative;padding:3px 24px 3px 72px;transition:background .12s; }
    .msg-row:hover { background:#f8fafc; }
    .msg-row.first { padding-top:14px; }
    .msg-row.mention-hl { background:linear-gradient(90deg,#eff6ff,#f0f9ff);
      border-left:3px solid #3b82f6;padding-left:69px; }
    @media(max-width:640px){
      .msg-row { padding:3px 12px 3px 52px; }
      .msg-row.first { padding-top:12px; }
      .msg-row.mention-hl { padding-left:49px; }
    }
    .msg-toolbar { display:none;position:absolute;top:-18px;right:12px;z-index:20;
      background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:4px 6px;
      gap:2px;align-items:center;box-shadow:0 8px 24px rgba(0,0,0,.1); }
    .msg-row:hover .msg-toolbar { display:flex; }
    .tb { display:flex;align-items:center;justify-content:center;width:30px;height:30px;
      border-radius:8px;border:none;background:none;cursor:pointer;color:#64748b;
      transition:background .1s,color .1s; }
    .tb:hover { background:#f1f5f9;color:#1e293b; }
    .tb.danger:hover { background:#fef2f2;color:#ef4444; }
    .rpill { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;
      border-radius:99px;background:#f8fafc;border:1.5px solid #e2e8f0;
      cursor:pointer;font-size:13px;transition:all .12s; }
    .rpill:hover { border-color:#93c5fd;background:#eff6ff;transform:scale(1.05); }
    .rpill.own { background:linear-gradient(135deg,#eff6ff,#eef2ff);border-color:#3b82f6; }
    .rq-bar { background:#f8fafc;border-left:3px solid #3b82f6;border-radius:0 8px 8px 0;
      padding:6px 12px;margin-bottom:6px;font-size:12px;cursor:pointer; }
    .rq-bar:hover { background:#eff6ff; }
    .comm-ta { background:transparent;border:none;outline:none;color:#1e293b;
      font-size:15px;resize:none;width:100%;padding:10px 0;line-height:1.6;
      font-family:'Plus Jakarta Sans',sans-serif;max-height:160px;overflow-y:auto; }
    .comm-ta::placeholder { color:#94a3b8; }
    .mlist { background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:6px;
      min-width:220px;max-height:260px;overflow-y:auto;
      box-shadow:0 16px 40px rgba(0,0,0,.12); }
    .mitem { display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;cursor:pointer;transition:background .1s; }
    .mitem:hover,.mitem.active { background:#eff6ff; }
    .dot-active { background:#22c55e;box-shadow:0 0 0 2px #fff,0 0 0 3px rgba(34,197,94,.25); }
    .dot-break  { background:#f59e0b;box-shadow:0 0 0 2px #fff; }
    .dot-off    { background:#cbd5e1;box-shadow:0 0 0 2px #fff; }
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
    .datediv { display:flex;align-items:center;gap:12px;margin:18px 24px 8px;
      color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase; }
    .datediv::before,.datediv::after { content:'';flex:1;height:1px;background:#f1f5f9; }
    .input-wrap { background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;
      transition:border-color .15s,box-shadow .15s;position:relative;overflow:visible; }
    .input-wrap:focus-within { border-color:#93c5fd;box-shadow:0 0 0 3px rgba(59,130,246,.08); }
    .upload-bar { position:absolute;bottom:0;left:0;right:0;height:3px;
      background:#e2e8f0;border-radius:0 0 14px 14px;overflow:hidden; }
    .upload-bar-fill { height:100%;background:linear-gradient(90deg,#2563eb,#4f46e5);transition:width .3s; }
    .mem-card { display:flex;align-items:center;justify-content:space-between;
      padding:12px 14px;border:1.5px solid #f1f5f9;border-radius:12px;
      transition:border-color .15s,background .15s;margin-bottom:8px; }
    .mem-card:hover { border-color:#e0e7ff;background:#fafbff; }
    .comm-viewer-portal {
      position:fixed;inset:0;z-index:999999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,.88);
      backdrop-filter:blur(6px);
    }
    @keyframes viewerIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
    .comm-viewer-inner { animation:viewerIn .2s cubic-bezier(.34,1.2,.64,1) both; }
    .mv-bar { position:absolute;top:0;left:0;right:0;padding:18px 24px;
      display:flex;align-items:center;justify-content:space-between;
      background:linear-gradient(180deg,rgba(0,0,0,.6) 0%,transparent 100%);
      z-index:2; }
    .mv-btn { display:flex;align-items:center;justify-content:center;width:38px;height:38px;
      border-radius:10px;border:none;background:rgba(255,255,255,.15);color:#fff;
      cursor:pointer;transition:background .15s; }
    .mv-btn:hover { background:rgba(255,255,255,.28); }
    .edit-ta { background:#fff;border:1.5px solid #93c5fd;border-radius:10px;outline:none;
      color:#1e293b;font-size:15px;resize:none;width:100%;padding:8px 12px;line-height:1.6;
      font-family:'Plus Jakarta Sans',sans-serif;max-height:200px;overflow-y:auto;
      box-shadow:0 0 0 3px rgba(59,130,246,.08); }
    .msg-deleted { font-style:italic;color:#94a3b8;font-size:14px;display:flex;align-items:center;gap:6px; }
    .poll-card { background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px 18px;max-width:340px;margin-bottom:4px; }
    @keyframes shimmer {
      0% { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    .skeleton {
      background: linear-gradient(90deg, #f1f5f9 25%, #e8eef4 50%, #f1f5f9 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s ease-in-out infinite;
      border-radius: 6px;
    }
    .skeleton-circle {
      background: linear-gradient(90deg, #f1f5f9 25%, #e8eef4 50%, #f1f5f9 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s ease-in-out infinite;
      border-radius: 50%;
    }
    @media(max-width:768px){
      .comm-sidebar { position:fixed!important;left:0;top:0;bottom:0;z-index:50;width:280px!important;
        transform:translateX(-100%);transition:transform .25s cubic-bezier(.4,0,.2,1); }
      .comm-sidebar.open { transform:translateX(0)!important;box-shadow:8px 0 40px rgba(0,0,0,.15); }
      .mob-overlay { display:block!important; }
    }
    .mob-overlay { display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:40; }
    .dm-tick { display:flex;align-items:center;gap:3px;margin-top:4px;transition:all .2s; }
  `;
  document.head.appendChild(s);
}

const QUICK = ["👍", "❤️", "😂", "🎉", "🔥", "👀"];
const ALL_EMOJI = [
  "👍",
  "👎",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🎉",
  "🔥",
  "✅",
  "👀",
  "🙏",
  "💯",
  "🚀",
  "⭐",
  "💡",
  "🎯",
  "👏",
  "😎",
  "🤔",
  "💪",
  "🤝",
  "👋",
  "❌",
  "⚠️",
  "😍",
  "🥳",
  "😅",
  "🤣",
  "😊",
  "🙌",
  "💎",
  "🌟",
];
let toastId = 0;

/* ─────────────────────────────────────────────────────────────────────────
   DM tick:
   • Single grey  → sent (receiver offline)
   • Double grey  → delivered (receiver online, not yet read)
   • Double blue  → seen (is_read = true)
───────────────────────────────────────────────────────────────────────── */
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
          <CheckCheck size={14} color="#94a3b8" strokeWidth={2} />
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>
            Delivered
          </span>
        </div>
      </Tooltip>
    );
  }
  return (
    <Tooltip title="Sent" placement="right">
      <div className="dm-tick">
        <Check size={13} color="#94a3b8" strokeWidth={2} />
        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>
          Sent
        </span>
      </div>
    </Tooltip>
  );
};

const SkeletonSidebarItem = () => (
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
      style={{ width: 28, height: 28, flexShrink: 0 }}
    />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
      <div
        className="skeleton"
        style={{ height: 11, width: "65%", borderRadius: 4 }}
      />
      <div
        className="skeleton"
        style={{ height: 9, width: "40%", borderRadius: 4 }}
      />
    </div>
  </div>
);

const SkeletonChannelItem = () => (
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
      style={{ width: 14, height: 14, flexShrink: 0, borderRadius: 3 }}
    />
    <div
      className="skeleton"
      style={{ height: 11, width: "55%", borderRadius: 4 }}
    />
  </div>
);

const SkeletonMessage = ({ wide = false, hasAvatar = true }) => (
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
          style={{ position: "absolute", left: -50, width: 36, height: 36 }}
        />
        <div
          className="skeleton"
          style={{ height: 11, width: 80, borderRadius: 4 }}
        />
        <div
          className="skeleton"
          style={{ height: 9, width: 44, borderRadius: 4 }}
        />
      </div>
    )}
    <div
      className="skeleton"
      style={{ height: 14, width: wide ? "72%" : "45%", borderRadius: 5 }}
    />
    {wide && (
      <div
        className="skeleton"
        style={{ height: 14, width: "55%", borderRadius: 5 }}
      />
    )}
  </div>
);

const EmptyState = ({
  icon: Icon,
  title,
  subtitle,
  iconColor = "#94a3b8",
  iconBg = "#f1f5f9",
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
    <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
      {title}
    </div>
    {subtitle && (
      <div
        style={{
          fontSize: 11.5,
          color: "#94a3b8",
          lineHeight: 1.5,
          maxWidth: 180,
        }}
      >
        {subtitle}
      </div>
    )}
  </div>
);

const Ava = ({ user, size = 34, dot }) => {
  const dc =
    dot === "active"
      ? "dot-active"
      : dot === "break"
        ? "dot-break"
        : dot === "off"
          ? "dot-off"
          : null;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <Avatar
        src={user?.user_photo}
        size={size}
        style={{
          background: "linear-gradient(135deg,#e0e7ff,#dbeafe)",
          color: "#4f46e5",
          fontSize: size * 0.38,
          fontWeight: 700,
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
            width: 10,
            height: 10,
            borderRadius: "50%",
            border: "2px solid #fff",
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

const renderText = (text) => {
  if (!text) return null;
  return text.split(/(@\S[^@]*?\b)/g).map((p, i) =>
    p.startsWith("@") ? (
      <span
        key={i}
        style={{
          color: "#2563eb",
          fontWeight: 700,
          background: "#dbeafe",
          borderRadius: 4,
          padding: "1px 4px",
        }}
      >
        {p}
      </span>
    ) : (
      p
    ),
  );
};

const extOf = (name = "") => name.split(".").pop()?.toUpperCase() || "FILE";

/* ══ MEDIA VIEWER ══════════════════════════════════════════════════════ */
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
              boxShadow: "0 40px 100px rgba(0,0,0,.7)",
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
            boxShadow: "0 40px 100px rgba(0,0,0,.8)",
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
              background: "rgba(0,0,0,.85)",
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
                    color: "rgba(255,255,255,.5)",
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
                    background: "rgba(255,255,255,.12)",
                    border: "1px solid rgba(255,255,255,.2)",
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
                  background: "rgba(239,68,68,.25)",
                  border: "1px solid rgba(239,68,68,.4)",
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
            background: "#fff",
            borderRadius: 20,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 40px 100px rgba(0,0,0,.6)",
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1.5px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#fff",
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
                  color: "#1e293b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.file_name}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
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
                  background: "#f1f5f9",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
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
                background: "#fef2f2",
                border: "1.5px solid #fecaca",
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

const EmojiPicker = ({ onSelect }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 3,
      width: 224,
      padding: 4,
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
          ev.target.style.background = "#f1f5f9";
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

const ReactionViewer = ({ reacts, users, profile }) => {
  const [active, setActive] = useState(null);
  const entries = Object.values(reacts);
  const cur = active || entries[0]?.emoji;
  return (
    <div style={{ width: 240, padding: "2px 0" }}>
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
              borderColor: cur === r.emoji ? "#3b82f6" : "#e2e8f0",
              background: cur === r.emoji ? "#eff6ff" : "#f8fafc",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              color: cur === r.emoji ? "#2563eb" : "#64748b",
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
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
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
                  color: "#1e293b",
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

const Toolbar = ({ msg, isOwn, onReact, onReply, onEdit, onDelete }) => (
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
      content={<EmojiPicker onSelect={(e) => onReact(msg.id, e)} />}
      trigger="click"
      placement="topRight"
    >
      <button className="tb">
        <Smile size={14} />
      </button>
    </Popover>
    <div
      style={{ width: 1, height: 18, background: "#f1f5f9", margin: "0 2px" }}
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

const PollCard = ({ msg, profile, onVote }) => {
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
        background: "#fff",
        border: "1.5px solid #e2e8f0",
        borderRadius: 16,
        padding: "18px 20px",
        maxWidth: 360,
        marginBottom: 6,
        boxShadow: "0 2px 12px rgba(0,0,0,.06)",
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
              color: "#0f172a",
              lineHeight: 1.4,
            }}
          >
            {poll.question}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {poll.closed
              ? "🔒 Poll closed"
              : hasVoted
                ? `✓ You voted · ${totalVotes} vote${totalVotes !== 1 ? "s" : ""}`
                : `${totalVotes} vote${totalVotes !== 1 ? "s" : ""} · Tap to vote`}
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: "#f1f5f9", margin: "12px 0" }} />
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
                border: `1.5px solid ${isMyVote ? "#2563eb" : isWinner && hasVoted ? "#22c55e" : "#e2e8f0"}`,
                background: isMyVote
                  ? "#eff6ff"
                  : isWinner && hasVoted
                    ? "#f0fdf4"
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
                    ? "rgba(37,99,235,.1)"
                    : isWinner && hasVoted
                      ? "rgba(34,197,94,.1)"
                      : "rgba(0,0,0,.03)",
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
                    border: `2px solid ${isMyVote ? "#2563eb" : isWinner && hasVoted ? "#22c55e" : "#cbd5e1"}`,
                    background: isMyVote
                      ? "#2563eb"
                      : isWinner && hasVoted
                        ? "#22c55e"
                        : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isMyVote && (
                    <span
                      style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}
                    >
                      ✓
                    </span>
                  )}
                  {!isMyVote && isWinner && hasVoted && (
                    <span
                      style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}
                    >
                      ★
                    </span>
                  )}
                </div>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: isMyVote ? 700 : 500,
                    color: "#1e293b",
                  }}
                >
                  {opt.text}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isMyVote
                      ? "#2563eb"
                      : isWinner && hasVoted
                        ? "#16a34a"
                        : "#94a3b8",
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
        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
        </span>
        {hasVoted && !poll.closed && (
          <button
            onClick={() => onVote(msg.id, myVoteIdx)}
            style={{
              fontSize: 11,
              color: "#94a3b8",
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

/* ── MeetingCard ─────────────────────────────────────────────────────────── */
const MeetingCard = ({ msg }) => {
  const meta = msg.meeting_meta;
  if (!meta) return null;
  const isVideo = meta.type === "video";
  const isLive = meta.status === "live";

  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #e2e8f0",
        borderRadius: 14,
        padding: "14px 16px",
        maxWidth: 320,
        marginBottom: 4,
        boxShadow: "0 2px 12px rgba(0,0,0,.06)",
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
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            {meta.title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: isLive ? "#22c55e" : "#94a3b8",
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
            window.open(
              `/meet/${meta.room_id}${meta.meeting_id ? `?meetingId=${meta.meeting_id}` : ""}`,
              "_blank",
              "noopener,noreferrer",
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
            boxShadow: "0 3px 10px rgba(37,99,235,.25)",
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
            border: "1.5px solid #e2e8f0",
            background: "#f8fafc",
            color: "#64748b",
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

/* ── MsgRow ──────────────────────────────────────────────────────────── */
const MsgRow = ({
  msg,
  prev,
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
  const isOwn = msg.sender_id === profile.id;
  const sender = msg.sender || users.find((u) => u.id === msg.sender_id) || {};
  const name = isOwn
    ? profile.full_name || "You"
    : sender.full_name || "Unknown";
  const isFirst =
    !prev ||
    prev.sender_id !== msg.sender_id ||
    new Date(msg.created_at) - new Date(prev.created_at) > 300000;
  const isMention = msg.message?.includes(`@${profile.full_name}`);
  const isOnline = !isOwn && !!presence[msg.sender_id];
  const dot = isOwn ? null : isOnline ? "active" : "off";

  const isDm = !msg.channel_id;
  const showDmStatus = isOwn && isDm && !msg.is_deleted;
  const receiverOnline = isDm && !!presence[msg.receiver_id];

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
      />
      {isFirst && (
        <div style={{ position: "absolute", left: 22, top: 14 }}>
          <Ava user={isOwn ? profile : sender} size={36} dot={dot} />
        </div>
      )}
      {msg.reply_to_snapshot && (
        <div className="rq-bar" onClick={() => onScrollTo(msg.reply_to_id)}>
          <span style={{ fontWeight: 700, color: "#2563eb", fontSize: 12 }}>
            {msg.reply_to_snapshot.sender_name}{" "}
          </span>
          <span style={{ color: "#64748b" }}>
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
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
            {name}
          </span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
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
                color: isOnline ? "#16a34a" : "#94a3b8",
              }}
            >
              {isOnline ? "● Online" : "○ Offline"}
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
            {/* Meeting card */}
            {msg.meeting_meta && <MeetingCard msg={msg} />}

            {msg.poll && (
              <PollCard msg={msg} profile={profile} onVote={onVote} />
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
                  border: "1.5px solid #f1f5f9",
                  boxShadow: "0 2px 12px rgba(0,0,0,.08)",
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
                    border: "1.5px solid #f1f5f9",
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
                      background: "rgba(0,0,0,.35)",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,.92)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 16px rgba(0,0,0,.3)",
                      }}
                    >
                      <div
                        style={{
                          width: 0,
                          height: 0,
                          marginLeft: 4,
                          borderTop: "10px solid transparent",
                          borderBottom: "10px solid transparent",
                          borderLeft: "18px solid #1e293b",
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
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
                  <span style={{ color: "#cbd5e1", flexShrink: 0 }}>
                    · Click to play
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
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 12,
                  color: "#374151",
                  marginBottom: 4,
                  maxWidth: 280,
                  cursor: "pointer",
                  transition: "all .15s",
                  boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#93c5fd";
                  e.currentTarget.style.background = "#eff6ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.background = "#f8fafc";
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
                    }}
                  >
                    {msg.file_name}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                    {extOf(msg.file_name)} · Click to view
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
                        border: "1.5px solid #e2e8f0",
                        background: "#fff",
                        color: "#64748b",
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
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    Enter to save · Esc to cancel
                  </div>
                </div>
              ) : (
                msg.message && (
                  <div
                    style={{
                      fontSize: 15,
                      color: "#1e293b",
                      lineHeight: 1.65,
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      marginTop: msg.file_url ? 4 : 0,
                    }}
                  >
                    {renderText(msg.message)}
                    {msg.edited_at && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "#94a3b8",
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
                />
              }
              title={
                <span style={{ fontSize: 13, fontWeight: 700 }}>Reactions</span>
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
                    color: r.own ? "#2563eb" : "#475569",
                  }}
                >
                  {r.count}
                </span>
              </button>
            </Popover>
          ))}
          <Popover
            content={<EmojiPicker onSelect={(e) => onReact(msg.id, e)} />}
            trigger="click"
          >
            <button className="rpill">
              <Smile size={11} color="#94a3b8" />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>+</span>
            </button>
          </Popover>
        </div>
      )}

      {/* DM tick — fixed: show as soon as is_read is true regardless of receiverOnline */}
      {showDmStatus && (
        <DmStatusTick isRead={!!msg.is_read} receiverOnline={receiverOnline} />
      )}

      {/* Channel read receipts */}
      {isOwn && !isDm && msg.read_by && msg.read_by.length > 0 && (
        <Tooltip
          title={`Seen by: ${msg.read_by
            .map((uid) => {
              const u = users.find((x) => x.id === uid);
              return u?.full_name || "Someone";
            })
            .join(", ")}`}
          placement="right"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 4,
            }}
          >
            <div style={{ display: "flex" }}>
              {msg.read_by.slice(0, 4).map((uid, i) => {
                const u = users.find((x) => x.id === uid);
                return (
                  <div
                    key={uid}
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
                color: "#94a3b8",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <CheckCheck size={12} color="#22c55e" />
              {msg.read_by.length === 1
                ? "Seen"
                : `Seen by ${msg.read_by.length}`}
            </span>
          </div>
        </Tooltip>
      )}
    </div>
  );
};

const MentionList = ({ users, query, activeIdx, onSelect }) => {
  const list = users
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
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
              {u.full_name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#94a3b8",
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

const ToastContainer = ({ toasts, onDismiss, onOpen }) => {
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
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,.14)",
            border: "1.5px solid #f1f5f9",
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
                  border: "2px solid #fff",
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
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                {t.sender?.full_name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>now</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(t.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
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
                  color: "#64748b",
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
                color: "#475569",
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

/* ── Free Plan Paywall ── */
const getStatusColor = (status) => {
  if (status === "live")
    return {
      dot: "#10b981",
      bg: "#dcfce7",
      text: "#166534",
      border: "#bbf7d0",
    };
  if (status === "scheduled")
    return {
      dot: "#3b82f6",
      bg: "#dbeafe",
      text: "#1e40af",
      border: "#bfdbfe",
    };
  if (status === "ended")
    return {
      dot: "#6b7280",
      bg: "#f3f4f6",
      text: "#374151",
      border: "#d1d5db",
    };
};

function FreePlanPaywall({ navigate }) {
  const features = [
    {
      icon: <MessageCircle size={20} />,
      color: "#3b82f6",
      bg: "#eff6ff",
      title: "Real-time Chat",
      desc: "Instant messaging with rich text formatting, emojis, mentions, and threaded replies.",
    },
    {
      icon: <Video size={20} />,
      color: "#8b5cf6",
      bg: "#f5f3ff",
      title: "HD Video Calls",
      desc: "Crystal-clear video calls with up to 100 participants, screen sharing, and virtual backgrounds.",
    },
    {
      icon: <Phone size={20} />,
      color: "#22c55e",
      bg: "#f0fdf4",
      title: "Audio Calls",
      desc: "High-quality audio calls with noise cancellation and call recording options.",
    },
    {
      icon: <ThumbsUp size={20} />,
      color: "#f59e0b",
      bg: "#fffbeb",
      title: "Message Reactions",
      desc: "Quick emoji reactions, custom stickers, and reaction analytics for engagement.",
    },
    {
      icon: <Mic size={20} />,
      color: "#ef4444",
      bg: "#fef2f2",
      title: "Voice Messages",
      desc: "Send and receive voice messages with transcription and playback controls.",
    },
    {
      icon: <Paperclip size={20} />,
      color: "#0891b2",
      bg: "#ecfeff",
      title: "Document Sharing",
      desc: "Upload and share documents, images, PDFs with preview and download tracking.",
    },
    {
      icon: <Hash size={20} />,
      color: "#7c3aed",
      bg: "#f3e8ff",
      title: "Communication Channels",
      desc: "Organized channels for teams, projects, and topics with permissions and search.",
    },
  ];

  // Fake blurred conversations for the preview behind the paywall
  const fakeConversations = [
    {
      title: "Design Team",
      type: "channel",
      time: "2 min ago",
      messages: 47,
      people: 12,
      status: "active",
    },
    {
      title: "Sarah Johnson",
      type: "direct",
      time: "10:00 AM",
      messages: 8,
      people: 1,
      status: "typing",
    },
    {
      title: "Product Updates",
      type: "channel",
      time: "Yesterday",
      messages: 23,
      people: 28,
      status: "muted",
    },
    {
      title: "John Smith",
      type: "direct",
      time: "Mon 3:15",
      messages: 5,
      people: 1,
      status: "voice",
    },
    {
      title: "Sales Pipeline",
      type: "channel",
      time: "2 days ago",
      messages: 156,
      people: 8,
      status: "pinned",
    },
  ];

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: "#f8fafc",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Blurred ghost conversations behind everything ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: "blur(3px)",
          opacity: 0.35,
          pointerEvents: "none",
          padding: "24px 28px",
          userSelect: "none",
        }}
      >
        {/* Ghost conversations header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#e2e8f0",
            }}
          />
          <div
            style={{
              height: 24,
              width: 160,
              borderRadius: 8,
              background: "#e2e8f0",
            }}
          />
          <div
            style={{
              height: 28,
              width: 56,
              borderRadius: 8,
              background: "#e2e8f0",
              marginLeft: "auto",
            }}
          />
        </div>
        {/* Ghost conversations list */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #f1f5f9",
            overflow: "hidden",
            maxHeight: "80vh",
          }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                padding: "16px 20px",
                borderBottom: i < 7 ? "1px solid #f8fafc" : "none",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "#f1f5f9",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    height: 16,
                    width: "70%",
                    borderRadius: 4,
                    background: "#e2e8f0",
                    marginBottom: 4,
                  }}
                />
                <div
                  style={{
                    height: 12,
                    width: "50%",
                    borderRadius: 3,
                    background: "#f1f5f9",
                  }}
                />
              </div>
              <div
                style={{
                  height: 20,
                  width: 60,
                  borderRadius: 6,
                  background: "#e2e8f0",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Gradient overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, rgba(248,250,252,0.5) 0%, rgba(248,250,252,0.85) 30%, rgba(248,250,252,0.97) 60%, #f8fafc 100%)",
        }}
      />

      {/* ── Main paywall content ── */}
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
        {/* Pro Feature Badge */}
        <div
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 18px",
            background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
            border: "1px solid #ddd6fe",
            borderRadius: 30,
            backdropFilter: "blur(2px)",
            boxShadow: "0 4px 16px rgba(99,102,241,0.15)",
            whiteSpace: "nowrap",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
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
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Pro Feature
          </span>
        </div>

        {/* Headline */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 900,
              color: "#0f172a",
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
            }}
          >
            Collaborate seamlessly with
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
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
            color: "#64748b",
            maxWidth: 480,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Connect with your team instantly through chat, video calls, voice
          messages, and organized channels. Share documents, react to
          messages, and keep everyone on the same page in one unified
          platform.
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
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #f1f5f9",
                padding: "20px 22px",
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                animation: `fadeUp 0.4s ease ${0.28 + i * 0.06}s both`,
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "none";
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
                    color: "#0f172a",
                    marginBottom: 5,
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}
                >
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Conversation preview list (blurred sample) */}
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
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Sample — what you'll see after upgrading
            </span>
          </div>
          <div
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* Blur + lock overlay on the sample */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 5,
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(248,250,252,0.6) 60%, rgba(248,250,252,0.97) 100%)",
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
                  background: "rgba(15,23,42,0.85)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Lock size={11} color="#94a3b8" />
                <span
                  style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}
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
                const getStatusColor = (status) => {
                  if (status === "active")
                    return {
                      dot: "#22c55e",
                      bg: "#f0fdf4",
                      text: "#166534",
                      border: "#bbf7d0",
                    };
                  if (status === "typing")
                    return {
                      dot: "#3b82f6",
                      bg: "#eff6ff",
                      text: "#1e40af",
                      border: "#bfdbfe",
                    };
                  if (status === "voice")
                    return {
                      dot: "#ef4444",
                      bg: "#fef2f2",
                      text: "#dc2626",
                      border: "#fecaca",
                    };
                  return {
                    dot: "#94a3b8",
                    bg: "#f1f5f9",
                    text: "#64748b",
                    border: "#e2e8f0",
                  };
                };
                const color = getStatusColor(c.status);
                return (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      padding: "16px 20px",
                      borderBottom:
                        i < fakeConversations.length - 1
                          ? "1px solid #f8fafc"
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
                        background: `linear-gradient(135deg, ${color.dot}, ${color.dot}dd)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#fff",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#0f172a",
                          marginBottom: 2,
                        }}
                      >
                        {c.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          {c.type === "channel" ? "#" : ""}
                          {c.type}
                        </span>
                        <span>·</span>
                        <span>{c.time}</span>
                        <span>·</span>
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
                            ? "🎤"
                            : "New"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom trust line */}
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
                color: "#94a3b8",
              }}
            >
              {t.icon} {t.text}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes popIn { from { opacity:0; transform:scale(0.7); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const Communication = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const tenantId = profile?.tenant_id;

  const [orgPlan, setOrgPlan] = useState(null);

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
    inputRef = useRef(null),
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
    const fetchPlan = async () => {
      const { data: org } = await supabase
        .from("tenants")
        .select("plan")
        .eq("id", profile.tenant_id)
        .single();
      setOrgPlan(org?.plan ?? null);
    };
    if (profile?.tenant_id) fetchPlan();
  }, [profile?.tenant_id]);

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

  /* ── Presence ── */
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
      markRead();
    }
  }, [selectedUser?.id, selectedChannel?.id]);

  useEffect(() => {
    if (shouldScrollRef.current)
      endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── markReadForMsg — stable ref ── */
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
        // Patch local state — preserve receiver_id so tick renders correctly
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

  /* ── Realtime subscription ── */
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
      /* ── INSERT ── */
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
          } else if (!inConv) {
            fetchUnreadRef.current?.();
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
              ? `📹 ${msg.meeting_meta.type === "video" ? "Video" : "Audio"} call started`
              : msg.message
                ? msg.message.slice(0, 80)
                : msg.file_type === "voice"
                  ? "🎤 Voice"
                  : msg.file_type === "image"
                    ? "🖼 Image"
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
      /* ── Reactions INSERT ── */
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message_reactions" },
        (payload) => {
          const r = payload.new;
          if (selUserRef.current || selChanRef.current) {
            setMessagesRef.current?.((prev) =>
              prev.map((m) =>
                m.id !== r.message_id
                  ? m
                  : { ...m, reactions: [...(m.reactions || []), r] },
              ),
            );
          }
        },
      )
      /* ── Reactions DELETE ── */
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "message_reactions" },
        (payload) => {
          const r = payload.old;
          if (selUserRef.current || selChanRef.current) {
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
          }
        },
      )
      /* ── Message UPDATE — never overwrite receiver_id / is_read with null ── */
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
                // Never downgrade receiver_id or is_read — Supabase partial payloads may omit these
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
      /* ── Message DELETE ── */
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        (payload) => {
          const id = payload.old?.id;
          if (id && (selUserRef.current || selChanRef.current)) {
            setMessagesRef.current?.((prev) => prev.filter((m) => m.id !== id));
          }
        },
      )
      /* ── Read status INSERT ── */
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
                if (!read_by.includes(rs.user_id)) read_by.push(rs.user_id);
                // Flip is_read when the actual receiver reads it
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
    const { data: memberRows } = await supabase
      .from("channel_members")
      .select("channel_id")
      .eq("user_id", profile.id)
      .eq("tenant_id", tenantId);
    const memberChannelIds = (memberRows || []).map((r) => r.channel_id);
    if (!memberChannelIds.length) {
      setChannels([]);
      setLoadingChannels(false);
      return;
    }
    const { data } = await supabase
      .from("channels")
      .select("*")
      .in("id", memberChannelIds)
      .eq("tenant_id", tenantId)
      .order("name");
    setChannels(data || []);
    setLoadingChannels(false);
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    let q = supabase
      .from("messages")
      .select(
        `*,sender:profiles!messages_sender_id_fkey(id,full_name,user_photo),reactions:message_reactions(id,emoji,user_id,created_at),message_read_status(user_id)`,
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
          .map((r) => r.user_id)
          .filter((uid) => uid !== profile.id),
      };
    });
    setMessages(msgs);
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
          // Always fire the UPDATE so sender's tick flips to blue
          await supabase
            .from("messages")
            .update({ is_read: true })
            .in("id", ids);
          // Immediately patch local state — preserve receiver_id
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
    const isImg = file.type.startsWith("image/");
    const isVid = file.type.startsWith("video/");
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

  /* ── createCall — creates meeting + sends card message ── */
  const createCall = async (type) => {
    if (!selectedUser && !selectedChannel) return;
    const genRoomId = () => {
      const c = "abcdefghijklmnopqrstuvwxyz";
      const seg = () =>
        Array.from({ length: 3 }, () => c[Math.floor(Math.random() * 26)]).join(
          "",
        );
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

    // Create meeting record
    const { data: meeting } = await supabase
      .from("meetings")
      .insert([
        {
          title,
          meeting_date: new Date().toISOString(),
          duration: 60,
          status: "live",
          meeting_type: type,
          attendee_emails: allEmails,
          attendees: JSON.stringify(allIds),
          agenda_items: "[]",
          created_by: profile.id,
          tenant_id: tenantId,
          is_recurring: false,
          meeting_room_id: roomId,
          meeting_url: `${window.location.origin}/meet/${roomId}`,
        },
      ])
      .select()
      .single();

    // Insert meeting card message
    const payload = {
      tenant_id: tenantId,
      sender_id: profile.id,
      message: null,
      meeting_meta: {
        type,
        title,
        room_id: roomId,
        meeting_id: meeting?.id ?? null,
        status: "live",
      },
      is_read: false,
    };
    if (selectedChannel) payload.channel_id = selectedChannel.id;
    else if (selectedUser) payload.receiver_id = selectedUser.id;

    const { data: ins } = await supabase
      .from("messages")
      .insert([payload])
      .select(
        "*,sender:profiles!messages_sender_id_fkey(id,full_name,user_photo)",
      )
      .single();

    if (ins) {
      const optimisticMsg = {
        ...ins,
        reactions: [],
        read_by: [],
        receiver_id: selectedUser?.id ?? ins.receiver_id ?? null,
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      shouldScrollRef.current = true;
    }

    // Open the room immediately for the caller
    window.open(
      `/meet/${roomId}${meeting?.id ? `?meetingId=${meeting.id}` : ""}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

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
              sender_name: replyTo.sender?.full_name || "Unknown",
              message_preview: (
                replyTo.message ||
                (replyTo.file_type === "image"
                  ? "🖼 Image"
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

      const { data: ins } = await supabase
        .from("messages")
        .insert([payload])
        .select(
          "*,sender:profiles!messages_sender_id_fkey(id,full_name,user_photo)",
        )
        .single();

      if (ins && mentioned.length)
        await supabase.from("message_mentions").insert(
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
        const optimisticMsg = {
          ...ins,
          poll,
          reactions: [],
          read_by: [],
          receiver_id: selectedUser?.id ?? ins.receiver_id ?? null,
        };
        setMessages((prev) => [...prev, optimisticMsg]);
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
      await supabase.from("message_reactions").insert([
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
    const { error } = await supabase.from("channel_members").upsert(
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

  const onInput = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    const at = val.lastIndexOf("@");
    if (at !== -1) {
      const q = val.slice(at + 1);
      if (/^[\w\s]*$/.test(q) && q.length <= 30) {
        setMentionQuery(q);
        setShowMentions(true);
        setMentionIdx(0);
      } else setShowMentions(false);
    } else setShowMentions(false);
  };

  const onKey = (e) => {
    const filt = users.filter((u) =>
      u.full_name?.toLowerCase().includes(mentionQuery.toLowerCase()),
    );
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
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filt[mentionIdx]) insMention(filt[mentionIdx]);
        return;
      }
      if (e.key === "Escape") {
        setShowMentions(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const insMention = (u) => {
    const at = newMessage.lastIndexOf("@");
    setNewMessage(newMessage.slice(0, at) + `@${u.full_name} `);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const scrollTo = (id) => {
    msgRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    const el = msgRefs.current[id];
    if (el) {
      el.style.background = "#fef3c7";
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

  if (orgPlan === "Free" || orgPlan === null)
    return <FreePlanPaywall navigate={navigate} />;

  return (
    <>
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onOpen={handleToastOpen}
      />
      {viewerItem && (
        <MediaViewer item={viewerItem} onClose={() => setViewerItem(null)} />
      )}

      <div
        className="comm"
        style={{
          display: "flex",
          height: "calc(100vh - 64px)",
          background: "#fff",
          color: "#1e293b",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isMobile && sidebarOpen && (
          <div className="mob-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ══ SIDEBAR ══ */}
        <div
          className={`comm-sidebar${isMobile && sidebarOpen ? " open" : ""}`}
          style={{
            width: 256,
            flexShrink: 0,
            background: "#fcfcfd",
            borderRight: "1.5px solid #f1f5f9",
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
              borderBottom: "1.5px solid #f1f5f9",
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
                    color: "#0f172a",
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
              borderBottom: "1.5px solid #f1f5f9",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "#f8fafc",
                borderRadius: 10,
                padding: "7px 11px",
                border: "1.5px solid #f1f5f9",
              }}
            >
              <Search size={13} color="#94a3b8" />
              <input
                value={sideSearch}
                onChange={(e) => setSideSearch(e.target.value)}
                placeholder="Search…"
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#374151",
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
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Channels
                </span>
                <button
                  className="tb"
                  style={{ width: 22, height: 22 }}
                  onClick={() => setChannelModal(true)}
                >
                  <Plus size={13} />
                </button>
              </div>
              {loadingChannels ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonChannelItem key={i} />
                ))
              ) : fCh.length === 0 ? (
                <EmptyState
                  icon={Hash}
                  title="No channels yet"
                  subtitle="Create one or ask an admin to add you"
                  iconColor="#6366f1"
                  iconBg="linear-gradient(135deg,#eef2ff,#ede9fe)"
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
                      <Hash size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
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

            {/* Direct Messages */}
            <div>
              <div style={{ padding: "0 8px", marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Direct Messages
                </span>
              </div>
              {loadingUsers ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonSidebarItem key={i} />
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
                  iconColor="#0ea5e9"
                  iconBg="linear-gradient(135deg,#e0f2fe,#e0e7ff)"
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
                          size={26}
                          dot={isOnline ? "active" : "off"}
                        />
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 128,
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
              borderTop: "1.5px solid #f1f5f9",
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
                  color: "#0f172a",
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
                  color: "#94a3b8",
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

        {/* ══ CHAT ══ */}
        {selectedUser || selectedChannel ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "#fff",
              minWidth: 0,
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1.5px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
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
                    size={38}
                    dot={presence[selectedUser.id] ? "active" : "off"}
                  />
                ) : (
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: "linear-gradient(135deg,#eff6ff,#eef2ff)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1.5px solid #e0e7ff",
                    }}
                  >
                    <Hash size={17} color="#6366f1" />
                  </div>
                )}
                <div>
                  <div
                    style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}
                  >
                    {convTitle}
                  </div>
                  {convSub && (
                    <div
                      style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}
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
                          ? "#16a34a"
                          : "#94a3b8",
                      }}
                    >
                      {presence[selectedUser.id] ? "● Online" : "○ Offline"}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Call buttons + channel settings ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Tooltip title="Start video call">
                  <button
                    className="tb"
                    style={{
                      width: 36,
                      height: 36,
                      color: "#2563eb",
                      background: "#eff6ff",
                      border: "1.5px solid #bfdbfe",
                      borderRadius: 9,
                    }}
                    onClick={() => createCall("video")}
                  >
                    <Video size={16} />
                  </button>
                </Tooltip>
                <Tooltip title="Start audio call">
                  <button
                    className="tb"
                    style={{
                      width: 36,
                      height: 36,
                      color: "#16a34a",
                      background: "#f0fdf4",
                      border: "1.5px solid #bbf7d0",
                      borderRadius: 9,
                    }}
                    onClick={() => createCall("audio")}
                  >
                    <PhoneCall size={16} />
                  </button>
                </Tooltip>
                {selectedChannel && profile?.role === "admin" && (
                  <button
                    className="tb"
                    style={{ width: 36, height: 36 }}
                    onClick={() => {
                      fetchChannelMembers(selectedChannel.id);
                      setChannelSettingsTab("members");
                      setEditingChannel(false);
                      setMembersDrawer(true);
                    }}
                  >
                    <Users size={16} />
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
                        ? "linear-gradient(135deg,#eff6ff,#eef2ff)"
                        : "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                      border: `1.5px solid ${selectedChannel ? "#c7d2fe" : "#bbf7d0"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 8px 24px ${selectedChannel ? "rgba(99,102,241,.12)" : "rgba(34,197,94,.12)"}`,
                    }}
                  >
                    {selectedChannel ? (
                      <MessagesSquare
                        size={30}
                        color="#6366f1"
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
                        color: "#0f172a",
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
                        color: "#94a3b8",
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
                      background: "#fff",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "16px",
                      marginBottom: 10,
                      boxShadow: "0 8px 24px rgba(0,0,0,.08)",
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
                          color: "#1e293b",
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <BarChart2 size={16} color="#2563eb" /> New Poll
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
                      placeholder="Ask a question…"
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #e2e8f0",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#0f172a",
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                        outline: "none",
                        background: "#f8fafc",
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
                              border: "1.5px solid #e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#94a3b8",
                              flexShrink: 0,
                              background: "#f8fafc",
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
                              border: "1.5px solid #e2e8f0",
                              fontSize: 13,
                              color: "#374151",
                              fontFamily: "'Plus Jakarta Sans',sans-serif",
                              outline: "none",
                              background: "#fff",
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
                            border: "1.5px dashed #cbd5e1",
                            background: "transparent",
                            color: "#64748b",
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
                          boxShadow: "0 4px 12px rgba(37,99,235,.25)",
                          opacity:
                            !pollQuestion.trim() ||
                            pollOptions.filter((o) => o.trim()).length < 2
                              ? 0.5
                              : 1,
                        }}
                      >
                        🚀 Launch Poll
                      </button>
                    </div>
                  </div>
                )}

              <div className="input-wrap">
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
                          color: "#2563eb",
                          fontSize: 12,
                        }}
                      >
                        Replying to {replyTo.sender?.full_name || ""}
                      </span>
                      <span
                        style={{
                          color: "#64748b",
                          marginLeft: 6,
                          fontSize: 12,
                        }}
                      >
                        {(replyTo.message || "").slice(0, 90) ||
                          (replyTo.file_type === "image"
                            ? "🖼 Image"
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
                        background: "#f8fafc",
                        border: "1.5px solid #e2e8f0",
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
                            border: "1.5px solid #e2e8f0",
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
                              border: "1.5px solid #e2e8f0",
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
                              background: "rgba(0,0,0,.3)",
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
                            color: "#1e293b",
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
                            color: "#94a3b8",
                            marginBottom: 6,
                          }}
                        >
                          {stagedFile.fileType === "image"
                            ? "🖼 Image"
                            : stagedFile.fileType === "video"
                              ? `🎬 ${extOf(stagedFile.name)} Video`
                              : `📄 ${extOf(stagedFile.name)} document`}
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
                          placeholder="Add a caption… (optional)"
                          style={{
                            width: "100%",
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            fontSize: 13,
                            color: "#1e293b",
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
                        color: stagedFile ? "#2563eb" : undefined,
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip size={17} />
                    </button>
                  </Tooltip>
                  <div style={{ flex: 1, position: "relative" }}>
                    <textarea
                      ref={inputRef}
                      className="comm-ta"
                      value={newMessage}
                      onChange={onInput}
                      onKeyDown={onKey}
                      placeholder={
                        stagedFile
                          ? "Add a caption or press send…"
                          : `Message ${convTitle}…`
                      }
                      rows={1}
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
                          setNewMessage((p) => p + "@");
                          setShowMentions(true);
                          setMentionQuery("");
                          inputRef.current?.focus();
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
                            color: showPollCreator ? "#2563eb" : undefined,
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
                          : "#f1f5f9",
                        color: canSend ? "#fff" : "#94a3b8",
                        cursor: canSend ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all .15s",
                        boxShadow: canSend
                          ? "0 4px 12px rgba(37,99,235,.3)"
                          : "none",
                      }}
                    >
                      {loading ? (
                        <div
                          style={{
                            width: 15,
                            height: 15,
                            border: "2px solid rgba(255,255,255,.4)",
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
              background: "#f8fafc",
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
                  background: "#fff",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1e293b",
                  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
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
                background: "linear-gradient(135deg,#eff6ff,#eef2ff)",
                border: "1.5px solid #c7d2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(99,102,241,.12)",
              }}
            >
              <MessageSquare size={30} color="#4f46e5" strokeWidth={1.5} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: 6,
                }}
              >
                Jump back in
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
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
              }}
            >
              Create a Channel
            </span>
          }
          open={channelModal}
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
                prefix={<Hash size={13} color="#94a3b8" />}
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
            },
          }}
        >
          <div
            style={{
              padding: "20px 24px 0",
              borderBottom: "1.5px solid #f1f5f9",
              background: "linear-gradient(135deg,#f8faff,#f5f3ff)",
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
                      color: "#0f172a",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {selectedChannel?.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
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
                  background: "rgba(0,0,0,.06)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
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
                        channelSettingsTab === tab.key ? "#2563eb" : "#64748b",
                      borderBottom: `2px solid ${channelSettingsTab === tab.key ? "#2563eb" : "transparent"}`,
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
                      boxShadow: "0 4px 12px rgba(37,99,235,.25)",
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
                      }}
                    >
                      ● Online —{" "}
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
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 10,
                      }}
                    >
                      ○ Offline —{" "}
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
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#94a3b8",
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
                      background: "#f8fafc",
                      border: "1.5px solid #e2e8f0",
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
                            color: "#0f172a",
                          }}
                        >
                          #{selectedChannel?.name}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#64748b",
                            marginTop: 4,
                          }}
                        >
                          {selectedChannel?.description || (
                            <span
                              style={{ fontStyle: "italic", color: "#94a3b8" }}
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
                          background: "#fff",
                          border: "1.5px solid #e2e8f0",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#374151",
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
                      background: "#f8fafc",
                      border: "1.5px solid #93c5fd",
                      borderRadius: 12,
                      padding: "16px",
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <label
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#374151",
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
                          background: "#fff",
                          border: "1.5px solid #e2e8f0",
                          borderRadius: 8,
                          padding: "8px 12px",
                        }}
                      >
                        <Hash size={13} color="#94a3b8" />
                        <input
                          value={editChannelName}
                          onChange={(e) => setEditChannelName(e.target.value)}
                          style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#0f172a",
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
                          color: "#374151",
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
                          border: "1.5px solid #e2e8f0",
                          borderRadius: 8,
                          padding: "8px 12px",
                          fontSize: 13,
                          color: "#374151",
                          fontFamily: "'Plus Jakarta Sans',sans-serif",
                          resize: "none",
                          outline: "none",
                          background: "#fff",
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
                          border: "1.5px solid #e2e8f0",
                          background: "#fff",
                          color: "#64748b",
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
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 14,
                  }}
                >
                  Danger Zone
                </div>
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1.5px solid #fecaca",
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
                          color: "#991b1b",
                          marginBottom: 4,
                        }}
                      >
                        Delete this channel
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#b91c1c",
                          lineHeight: 1.5,
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
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
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
                      {deletingChannel ? "Deleting…" : "Delete"}
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
          styles={{ body: { padding: 0 } }}
        >
          <div
            style={{
              padding: "24px 24px 20px",
              borderBottom: "1.5px solid #f1f5f9",
              background: "linear-gradient(135deg,#f8faff,#f5f3ff)",
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
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              Add Member
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              Add to{" "}
              <span style={{ color: "#2563eb", fontWeight: 700 }}>
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
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    Select member
                  </span>
                }
                rules={[{ required: true, message: "Select a user" }]}
                style={{ marginBottom: 0 }}
              >
                <Select
                  showSearch
                  placeholder="Search by name or email…"
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
                    color: "#94a3b8",
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
                          border: "1.5px solid #f1f5f9",
                          background: "#fff",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#e0e7ff";
                          e.currentTarget.style.background = "#fafbff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#f1f5f9";
                          e.currentTarget.style.background = "#fff";
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
                                color: "#1e293b",
                              }}
                            >
                              {u.full_name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#94a3b8",
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
                                  style={{ color: "#16a34a", fontWeight: 700 }}
                                >
                                  ● Online
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
                            background:
                              "linear-gradient(135deg,#eff6ff,#eef2ff)",
                            color: "#2563eb",
                            border: "1.5px solid #c7d2fe",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "'Plus Jakarta Sans',sans-serif",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "linear-gradient(135deg,#2563eb,#4f46e5)";
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "linear-gradient(135deg,#eff6ff,#eef2ff)";
                            e.currentTarget.style.color = "#2563eb";
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
              borderTop: "1.5px solid #f1f5f9",
              background: "#fff",
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
                border: "1.5px solid #e2e8f0",
                background: "#fff",
                color: "#64748b",
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
      <div key={m.id} className="mem-card">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Ava user={m.profiles} size={42} dot={isOnline ? "active" : "off"} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
              {m.profiles?.full_name}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
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
                  background: "#f1f5f9",
                  color: "#64748b",
                  borderRadius: 4,
                  padding: "2px 7px",
                  textTransform: "capitalize",
                }}
              >
                {m.profiles?.role}
              </span>
              {isOnline ? (
                <span
                  style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}
                >
                  ● Online
                </span>
              ) : (
                <span
                  style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}
                >
                  ○ Offline
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
              background: "#fef2f2",
              color: "#ef4444",
              border: "1.5px solid #fecaca",
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
