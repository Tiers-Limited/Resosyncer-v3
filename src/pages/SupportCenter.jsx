import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Input,
  List,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  MessageOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SendOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  BellOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const { Text, Title } = Typography;
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

/* ─── design tokens ─────────────────────────────────────── */
const LIGHT_COLORS = {
  bg: "#ffffff",
  surface: "#f8f9fb",
  surfaceHover: "#f1f3f7",
  border: "#e8eaed",
  borderLight: "#f0f2f5",
  text: "#0d0f12",
  textSec: "#6b7280",
  textTer: "#9ca3af",
  accent: "#001529",
  accentLight: "#e8eef8",
  accentHover: "#001f3d",
  onAccent: "#ffffff",
  onAccentMuted: "rgba(255,255,255,.8)",
  green: "#059669",
  greenLight: "#ecfdf5",
  amber: "#d97706",
  amberLight: "#fffbeb",
  red: "#dc2626",
  redLight: "#fef2f2",
  purple: "#7c3aed",
  purpleLight: "#f5f3ff",
  shadow: "0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.04)",
  shadowMd: "0 4px 12px rgba(0,0,0,.08)",
  shadowLg: "0 12px 32px rgba(0,0,0,.1)",
  radius: 10,
  radiusSm: 6,
  radiusLg: 16,
};

const DARK_COLORS = {
  bg: "#141416",
  surface: "#1b1c21",
  surfaceHover: "#23262d",
  border: "#2b2f38",
  borderLight: "#242730",
  text: "#f3f4f6",
  textSec: "#d1d5db",
  textTer: "#9ca3af",
  accent: "#ffffff",
  accentLight: "rgba(255,255,255,0.16)",
  accentHover: "#f3f4f6",
  onAccent: "#141416",
  onAccentMuted: "rgba(20,20,22,.72)",
  green: "#10b981",
  greenLight: "rgba(16,185,129,0.16)",
  amber: "#f59e0b",
  amberLight: "rgba(245,158,11,0.18)",
  red: "#ef4444",
  redLight: "rgba(239,68,68,0.18)",
  purple: "#8b5cf6",
  purpleLight: "rgba(139,92,246,0.18)",
  shadow: "0 1px 3px 0 rgba(0,0,0,.45), 0 1px 2px -1px rgba(0,0,0,.35)",
  shadowMd: "0 10px 24px rgba(0,0,0,.35)",
  shadowLg: "0 18px 48px rgba(0,0,0,.45)",
  radius: 10,
  radiusSm: 6,
  radiusLg: 16,
};

const getIsDarkTheme = () => {
  if (typeof window === "undefined") return false;
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const buildStatusConfig = (palette) => ({
  open: { color: palette.accent, bg: palette.accentLight, label: "Open", dot: "#2563eb" },
  in_progress: { color: palette.amber, bg: palette.amberLight, label: "In Progress", dot: "#d97706" },
  resolved: { color: palette.green, bg: palette.greenLight, label: "Resolved", dot: "#059669" },
  closed: { color: palette.textSec, bg: palette.surface, label: "Closed", dot: "#6b7280" },
});

const buildPriorityConfig = (palette) => ({
  low: { color: palette.textSec, bg: palette.surface, icon: "↓", label: "Low" },
  medium: { color: palette.accent, bg: palette.accentLight, icon: "→", label: "Medium" },
  high: { color: palette.amber, bg: palette.amberLight, icon: "↑", label: "High" },
  urgent: { color: palette.red, bg: palette.redLight, icon: "⚡", label: "Urgent" },
});

let C = LIGHT_COLORS;
let statusConfig = buildStatusConfig(C);
let priorityConfig = buildPriorityConfig(C);

const fileNameFromUrl = (url) => {
  if (!url) return "attachment";
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "attachment");
  } catch { return "attachment"; }
};

const formatBytes = (n) => {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const sendEmail = async ({ to, subject, body, companyName }) => {
  if (!EMAIL_API || !to) return { success: false, error: "Email API or recipient missing" };
  try {
    const res = await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html: body, companyName }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err?.message || "Email send failed" };
  }
};

/* ─── reusable small components ─────────────────────────── */
const StatusPill = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.open;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg, letterSpacing: ".02em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cfg = priorityConfig[priority] || priorityConfig.medium;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

const MetricCard = ({ icon, label, value, sub }) => (
  <div style={{
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: C.radius,
    padding: "18px 22px", boxShadow: C.shadow,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
      <span style={{ fontSize: 15, color: C.textSec }}>{icon}</span>
      <Text style={{ fontSize: 11, fontWeight: 600, color: C.textSec, letterSpacing: ".04em", textTransform: "uppercase" }}>{label}</Text>
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ marginTop: 5, fontSize: 12, color: C.textTer }}>{sub}</div>}
  </div>
);

const AttachmentChip = ({ url, name, size }) => (
  <a href={url} target="_blank" rel="noreferrer" style={{
    display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px",
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
    fontSize: 12, color: C.accent, textDecoration: "none", marginTop: 6,
  }}>
    <DownloadOutlined style={{ fontSize: 11 }} />
    <span style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name || fileNameFromUrl(url)}</span>
    {size ? <span style={{ color: C.textTer }}>· {formatBytes(size)}</span> : null}
  </a>
);

/* ─── global styles injection ────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    .sc-sidebar-item:hover { background: ${C.surfaceHover} !important; }
    .sc-sidebar-item.active { background: ${C.accentLight} !important; }
    .sc-msg-input .ant-input { border: none !important; box-shadow: none !important; background: transparent !important; }
    .sc-msg-input .ant-input:focus { box-shadow: none !important; }
    .sc-tab-seg .ant-segmented-item-selected { background: ${C.accent} !important; color: ${C.onAccent} !important; border-radius: 6px !important; }
    .sc-tab-seg .ant-segmented { background: ${C.surface} !important; border: 1px solid ${C.border} !important; border-radius: 8px !important; }
    .sc-pri-seg .ant-segmented-item-selected { background: ${C.accent} !important; color: ${C.onAccent} !important; border-radius: 6px !important; }
    .sc-pri-seg .ant-segmented { background: ${C.surface} !important; border: 1px solid ${C.border} !important; border-radius: 8px !important; }
    .sc-status-seg .ant-segmented-item-selected { background: ${C.accent} !important; color: ${C.onAccent} !important; border-radius: 6px !important; }
    .sc-status-seg .ant-segmented { background: ${C.surface} !important; border: 1px solid ${C.border} !important; border-radius: 8px !important; padding: 2px !important; }
    .sc-table .ant-table { background: transparent !important; }
    .sc-table .ant-table-thead > tr > th { background: ${C.surface} !important; border-bottom: 1px solid ${C.border} !important; font-size: 11px !important; font-weight: 600 !important; color: ${C.textSec} !important; text-transform: uppercase !important; letter-spacing: .04em !important; }
    .sc-table .ant-table-tbody > tr > td { border-bottom: 1px solid ${C.borderLight} !important; }
    .sc-table .ant-table-tbody > tr:hover > td { background: ${C.surface} !important; }
    .sc-table .ant-table-row { cursor: pointer; }
    .sc-input .ant-input, .sc-input .ant-input-affix-wrapper { background: ${C.surface} !important; border-color: ${C.border} !important; border-radius: 8px !important; }
    .sc-input .ant-input:focus, .sc-input .ant-input-affix-wrapper:focus-within { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px ${C.accentLight} !important; background: ${C.bg} !important; }
    .sc-textarea textarea { background: ${C.surface} !important; border-color: ${C.border} !important; border-radius: 8px !important; }
    .sc-textarea textarea:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px ${C.accentLight} !important; background: ${C.bg} !important; }
    .sc-modal .ant-modal-content { border-radius: 16px !important; overflow: hidden !important; padding: 0 !important; box-shadow: ${C.shadowLg} !important; background: ${C.bg} !important; border: 1px solid ${C.border} !important; }
    .sc-modal .ant-modal-header { padding: 20px 24px 16px !important; border-bottom: 1px solid ${C.border} !important; margin: 0 !important; background: ${C.bg} !important; }
    .sc-modal .ant-modal-title { font-size: 16px !important; font-weight: 700 !important; color: ${C.text} !important; }
    .sc-modal .ant-modal-body { padding: 0 !important; }
    .sc-modal .ant-modal-close { top: 18px !important; right: 20px !important; color: ${C.textSec} !important; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const SupportCenter = () => {
  const { profile } = useAuth();
  const [dark, setDark] = useState(getIsDarkTheme);

  C = dark ? DARK_COLORS : LIGHT_COLORS;
  statusConfig = buildStatusConfig(C);
  priorityConfig = buildPriorityConfig(C);

  const isSuperadmin = profile?.role === "superadmin" || profile?.role === "super_admin";
  const isAdmin = profile?.role === "admin";
  const canAccessSupport = isSuperadmin || isAdmin;
  const tenantId = profile?.tenant_id || null;

  const [view, setView] = useState("chat");
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messagesState, setMessagesState] = useState([]);
  const [chatText, setChatText] = useState("");
  const [chatAttachment, setChatAttachment] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const chatBoxRef = useRef(null);
  const adminWidgetBoxRef = useRef(null);
  const hasInitializedMessageFeedRef = useRef(false);
  const lastMessageIdRef = useRef(null);
  const audioContextRef = useRef(null);
  const [adminChatWidgetOpen, setAdminChatWidgetOpen] = useState(false);
  const [adminWidgetUnreadCount, setAdminWidgetUnreadCount] = useState(0);

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [updatingTicket, setUpdatingTicket] = useState(null);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [ticketAttachment, setTicketAttachment] = useState(null);
  const [ticketSearch, setTicketSearch] = useState("");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailOpen, setTicketDetailOpen] = useState(false);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [loadingTicketMessages, setLoadingTicketMessages] = useState(false);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketReplyAttachment, setTicketReplyAttachment] = useState(null);
  const [sendingTicketReply, setSendingTicketReply] = useState(false);

  const [liveChatEnabled, setLiveChatEnabled] = useState(true);
  const [loadingLiveChatSetting, setLoadingLiveChatSetting] = useState(false);
  const [savingLiveChatSetting, setSavingLiveChatSetting] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [tenantNameById, setTenantNameById] = useState({});

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

  const isLiveChatDisabled = !isSuperadmin && !liveChatEnabled;
  const selectedConversation = useMemo(() => conversations.find((c) => c.id === selectedConversationId) || null, [conversations, selectedConversationId]);
  const openChatCount = conversations.filter((c) => c.status === "open").length;
  const openTicketsCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedTicketsCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  const filteredTickets = useMemo(() => {
    if (!ticketSearch) return tickets;
    const q = ticketSearch.toLowerCase();
    return tickets.filter((t) => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
  }, [tickets, ticketSearch]);

  const getTenantName = useCallback((id) => {
    if (!id) return "N/A";
    return tenantNameById[id] || id;
  }, [tenantNameById]);

  const playIncomingMessageSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 840;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {
      // no-op
    }
  }, []);

  /* ─── helpers ─────────────────────────────────────────── */
  const uploadSupportFile = useCallback(async (file, scope) => {
    const cleanName = (file.name || "file").replace(/[^\w.\-]/g, "_");
    const path = `${profile?.id || "user"}/${scope}/${Date.now()}-${cleanName}`;
    const { error: uploadError } = await supabase.storage.from("chat-files").upload(path, file, { contentType: file.type || undefined });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("chat-files").getPublicUrl(path);
    return { attachment_url: data?.publicUrl || null, attachment_name: file.name || cleanName, attachment_size: file.size || null, attachment_type: file.type || null };
  }, [profile?.id]);

  const resolveSubmitterContact = useCallback(async (ticket) => {
    if (!ticket) return { email: null, name: "User" };
    const knownEmail = ticket.submitted_by_profile?.email || null;
    const knownName = ticket.submitted_by_profile?.full_name || "User";
    if (knownEmail) return { email: knownEmail, name: knownName };
    if (!ticket.submitted_by) return { email: null, name: knownName };
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", ticket.submitted_by)
        .maybeSingle();
      if (error) throw error;
      return { email: data?.email || null, name: data?.full_name || knownName };
    } catch {
      return { email: null, name: knownName };
    }
  }, []);

  const notifySuperadminsTicketSubmitted = useCallback(async ({ ticket, description, attachmentUrl, attachmentName }) => {
    if (!EMAIL_API || !ticket?.id) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("email")
        .in("role", ["superadmin", "super_admin"])
        .not("email", "is", null);
      if (error) throw error;
      const recipients = [...new Set((data || []).map((p) => p.email).filter(Boolean))];
      if (!recipients.length) return;

      const subject = `New support ticket: ${ticket.title}`;
      const tenantLabel = getTenantName(ticket.tenant_id);
      const fileUrl = attachmentUrl || ticket?.attachment_url || null;
      const fileName = attachmentName || ticket?.attachment_name || "Attachment";
      const body = `
        <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">
          <h2 style="margin:0 0 12px;">New Support Ticket Submitted</h2>
          <p style="margin:0 0 8px;"><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p style="margin:0 0 8px;"><strong>Title:</strong> ${ticket.title || "-"}</p>
          <p style="margin:0 0 8px;"><strong>Priority:</strong> ${ticket.priority || "medium"}</p>
          <p style="margin:0 0 8px;"><strong>Tenant:</strong> ${tenantLabel}</p>
          <p style="margin:0 0 8px;"><strong>Submitted by:</strong> ${profile?.full_name || "Admin"}</p>
          <p style="margin:0 0 12px;"><strong>Description:</strong><br/>${description || "-"}</p>
          ${fileUrl ? `<p style="margin:0 0 8px;"><strong>Attachment:</strong> <a href="${fileUrl}" target="_blank" rel="noreferrer">${fileName}</a></p>` : ""}
        </div>
      `.trim();

      await Promise.all(
        recipients.map((to) =>
          sendEmail({
            to,
            subject,
            body,
            companyName: profile?.company_name || "Resosyncer",
          })
        )
      );
    } catch {
      // Do not block ticket flow if email notifications fail
    }
  }, [getTenantName, profile?.company_name, profile?.full_name]);

  const notifySubmitterTicketUpdated = useCallback(async ({ ticket, status, replyText, replyAttachmentName, replyAttachmentUrl }) => {
    if (!EMAIL_API || !ticket?.id) return;
    try {
      const { email: submitterEmail, name: submitterName } = await resolveSubmitterContact(ticket);
      if (!submitterEmail) return;
      if (profile?.email && submitterEmail.toLowerCase() === profile.email.toLowerCase()) return;

      const changeBits = [];
      if (status) changeBits.push(`Status changed to <strong>${status.replaceAll("_", " ")}</strong>`);
      if (replyText) changeBits.push("A new reply was added");
      if (replyAttachmentName) changeBits.push(`Attachment: ${replyAttachmentName}`);
      const summary = changeBits.length ? changeBits.join(" · ") : "Your ticket was updated";

      const ticketAttachmentUrl = ticket?.attachment_url || null;
      const ticketAttachmentName = ticket?.attachment_name || "Ticket attachment";
      const subject = `Ticket updated: ${ticket.title || ticket.id}`;
      const body = `
        <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">
          <h2 style="margin:0 0 12px;">Your Support Ticket Was Updated</h2>
          <p style="margin:0 0 8px;">Hi ${submitterName},</p>
          <p style="margin:0 0 8px;"><strong>Ticket:</strong> ${ticket.title || "-"}</p>
          <p style="margin:0 0 8px;"><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p style="margin:0 0 12px;">${summary}</p>
          ${ticketAttachmentUrl ? `<p style="margin:0 0 8px;"><strong>Ticket attachment:</strong> <a href="${ticketAttachmentUrl}" target="_blank" rel="noreferrer">${ticketAttachmentName}</a></p>` : ""}
          ${replyText ? `<p style="margin:0 0 12px;"><strong>Reply:</strong><br/>${replyText}</p>` : ""}
          ${replyAttachmentUrl ? `<p style="margin:0 0 8px;"><strong>Reply attachment:</strong> <a href="${replyAttachmentUrl}" target="_blank" rel="noreferrer">${replyAttachmentName || "Attachment"}</a></p>` : ""}
        </div>
      `.trim();

      await sendEmail({
        to: submitterEmail,
        subject,
        body,
        companyName: profile?.company_name || "Resosyncer",
      });
    } catch {
      // Do not block support actions if email notifications fail
    }
  }, [profile?.company_name, profile?.email, resolveSubmitterContact]);

  const loadLiveChatSetting = useCallback(async () => {
    setLoadingLiveChatSetting(true);
    try {
      const { data, error } = await supabase
        .from("support_platform_settings")
        .select("customer_support_live_chat_enabled")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      setLiveChatEnabled(data?.customer_support_live_chat_enabled ?? true);
    } catch { setLiveChatEnabled(true); } finally { setLoadingLiveChatSetting(false); }
  }, []);

  const loadTenantNames = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name");
      if (error) throw error;
      const map = {};
      (data || []).forEach((t) => {
        map[t.id] = t.name || t.id;
      });
      setTenantNameById(map);
    } catch {
      setTenantNameById({});
    }
  }, []);

  const toggleLiveChatSetting = async (enabled) => {
    setSavingLiveChatSetting(true);
    try {
      const { error } = await supabase
        .from("support_platform_settings")
        .upsert({ id: 1, customer_support_live_chat_enabled: enabled }, { onConflict: "id" });
      if (error) throw error;
      setLiveChatEnabled(enabled);
      message.success(`Live chat ${enabled ? "enabled" : "disabled"} for all users`);
    } catch (e) { message.error(e.message || "Failed"); } finally { setSavingLiveChatSetting(false); }
  };

  const loadConversations = useCallback(async ({ silent = false } = {}) => {
    if (!profile?.id) return;
    if (!silent) setLoadingChat(true);
    try {
      let query = supabase.from("support_conversations").select("*").order("last_message_at", { ascending: false });
      if (!isSuperadmin) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      const rows = data || [];
      setConversations(rows);
      setSelectedConversationId((prev) => {
        if (!prev && rows.length > 0) return rows[0].id;
        if (prev && rows.length > 0 && !rows.some((r) => r.id === prev)) return rows[0].id;
        return prev;
      });
    } catch (e) { message.error(e.message || "Failed to load chats"); } finally { if (!silent) setLoadingChat(false); }
  }, [isSuperadmin, profile?.id, tenantId]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) { setMessagesState([]); return; }
    const { data, error } = await supabase.from("support_messages").select("id, conversation_id, sender_id, content, attachment_url, attachment_name, attachment_size, created_at, sender:profiles!support_messages_sender_id_fkey(id, full_name, role)").eq("conversation_id", conversationId).order("created_at", { ascending: true });
    if (error) { message.error(error.message || "Failed to load messages"); return; }
    setMessagesState(data || []);
  }, []);

  const loadTickets = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingTickets(true);
    try {
      let query = supabase.from("support_tickets").select("id, title, description, priority, status, source, created_at, tenant_id, submitted_by, attachment_url, attachment_name, attachment_size, submitted_by_profile:profiles!support_tickets_submitted_by_fkey(full_name, email)").order("created_at", { ascending: false });
      if (!isSuperadmin) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      const rows = data || [];
      setTickets(rows);
      if (selectedTicket?.id) { const fresh = rows.find((t) => t.id === selectedTicket.id); if (fresh) setSelectedTicket(fresh); }
    } catch (e) { message.error(e.message || "Failed to load tickets"); } finally { setLoadingTickets(false); }
  }, [isSuperadmin, profile?.id, selectedTicket?.id, tenantId]);

  const loadTicketMessages = useCallback(async (ticketId) => {
    if (!ticketId) { setTicketMessages([]); return; }
    setLoadingTicketMessages(true);
    try {
      const { data, error } = await supabase.from("support_ticket_messages").select("id, ticket_id, sender_id, message, attachment_url, attachment_name, attachment_size, created_at, sender:profiles!support_ticket_messages_sender_id_fkey(id, full_name, role)").eq("ticket_id", ticketId).order("created_at", { ascending: true });
      if (error) throw error;
      setTicketMessages(data || []);
    } catch (e) { message.error(e.message || "Failed to load replies"); } finally { setLoadingTicketMessages(false); }
  }, []);

  const createOrGetConversation = async () => {
    if (isSuperadmin) return selectedConversationId;
    if (isLiveChatDisabled) return null;
    if (!tenantId) { message.error("No tenant found"); return null; }
    const openConversation = conversations.find((c) => c.status === "open");
    if (openConversation) { setSelectedConversationId(openConversation.id); return openConversation.id; }
    const { data, error } = await supabase.from("support_conversations").insert([{ tenant_id: tenantId, initiated_by: profile.id, subject: "General Support", status: "open", channel_type: "live_chat", last_message_at: new Date().toISOString() }]).select().single();
    if (error) { message.error(error.message || "Failed to create conversation"); return null; }
    setConversations((prev) => [data, ...prev]);
    setSelectedConversationId(data.id);
    return data.id;
  };

  const sendMessage = async () => {
    const body = chatText.trim();
    if (!body && !chatAttachment) return;
    if (!profile?.id || isLiveChatDisabled) return;
    let conversationId = selectedConversationId;
    if (!conversationId) { conversationId = await createOrGetConversation(); if (!conversationId) return; }
    setSendingChat(true);
    try {
      let attachment = { attachment_url: null, attachment_name: null, attachment_size: null, attachment_type: null };
      if (chatAttachment) attachment = await uploadSupportFile(chatAttachment, "support-chat");
      const { error } = await supabase.from("support_messages").insert([{ conversation_id: conversationId, sender_id: profile.id, content: body || null, ...attachment }]);
      if (error) throw error;
      await supabase.from("support_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
      setChatText(""); setChatAttachment(null);
      await Promise.all([loadConversations(), loadMessages(conversationId)]);
    } catch (e) { message.error(e.message || "Failed to send"); } finally { setSendingChat(false); }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDescription.trim() || !profile?.id) return;
    setCreatingTicket(true);
    try {
      let attachment = { attachment_url: null, attachment_name: null, attachment_size: null, attachment_type: null };
      if (ticketAttachment) attachment = await uploadSupportFile(ticketAttachment, "support-ticket");
      const { data: createdTicket, error } = await supabase
        .from("support_tickets")
        .insert([{ tenant_id: tenantId, submitted_by: profile.id, title: ticketTitle, description: ticketDescription, priority: ticketPriority, status: "open", source: "customer_support", ...attachment }])
        .select("id, title, priority, tenant_id, submitted_by, submitted_by_profile:profiles!support_tickets_submitted_by_fkey(full_name, email)")
        .single();
      if (error) throw error;
      notifySuperadminsTicketSubmitted({
        ticket: createdTicket,
        description: ticketDescription,
        attachmentUrl: attachment?.attachment_url || null,
        attachmentName: attachment?.attachment_name || null,
      }).catch(() => {});
      setTicketTitle(""); setTicketDescription(""); setTicketPriority("medium"); setTicketAttachment(null);
      setShowNewTicket(false);
      await loadTickets();
      message.success("Ticket submitted successfully");
    } catch (e2) { message.error(e2.message || "Failed to submit"); } finally { setCreatingTicket(false); }
  };

  const updateTicketStatus = async (ticketRecord, status) => {
    const ticketId = ticketRecord?.id || ticketRecord;
    setUpdatingTicket(ticketId);
    try {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
      if (error) throw error;
      notifySubmitterTicketUpdated({
        ticket: typeof ticketRecord === "object" ? ticketRecord : tickets.find((t) => t.id === ticketId),
        status,
      }).catch(() => {});
      await loadTickets();
      if (selectedTicket?.id === ticketId) setSelectedTicket((prev) => ({ ...(prev || {}), status }));
      message.success("Status updated");
    } catch (e) { message.error(e.message || "Failed"); } finally { setUpdatingTicket(null); }
  };

  const openTicketDetails = async (ticket) => {
    setSelectedTicket(ticket); setTicketReply(""); setTicketReplyAttachment(null); setTicketDetailOpen(true);
    await loadTicketMessages(ticket.id);
  };

  const sendTicketReply = async () => {
    if (!selectedTicket?.id || !profile?.id) return;
    const body = ticketReply.trim();
    if (!body && !ticketReplyAttachment) return;
    setSendingTicketReply(true);
    try {
      let attachment = { attachment_url: null, attachment_name: null, attachment_size: null, attachment_type: null };
      if (ticketReplyAttachment) attachment = await uploadSupportFile(ticketReplyAttachment, "support-ticket-reply");
      const { error } = await supabase.from("support_ticket_messages").insert([{ ticket_id: selectedTicket.id, sender_id: profile.id, message: body || null, ...attachment }]);
      if (error) throw error;
      notifySubmitterTicketUpdated({
        ticket: selectedTicket,
        replyText: body,
        replyAttachmentName: attachment?.attachment_name || null,
        replyAttachmentUrl: attachment?.attachment_url || null,
      }).catch(() => {});
      setTicketReply(""); setTicketReplyAttachment(null);
      await Promise.all([loadTicketMessages(selectedTicket.id), loadTickets()]);
    } catch (e) { message.error(e.message || "Failed"); } finally { setSendingTicketReply(false); }
  };

  /* ─── effects ─────────────────────────────────────────── */
  useEffect(() => {
    if (!canAccessSupport) return;
    loadConversations(); loadTickets();
    loadLiveChatSetting().catch(() => {});
    loadTenantNames().catch(() => {});
  }, [canAccessSupport, loadConversations, loadLiveChatSetting, loadTenantNames, loadTickets]);

  useEffect(() => {
    if (!liveChatEnabled && view === "chat") {
      setView("tickets");
    }
  }, [liveChatEnabled, view]);

  useEffect(() => { if (!canAccessSupport) return; loadMessages(selectedConversationId).catch(() => {}); }, [canAccessSupport, loadMessages, selectedConversationId]);

  useEffect(() => {
    if (!canAccessSupport || !profile?.id) return;
    const channel = supabase.channel(`support-center-${profile.id}-${selectedConversationId || "none"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations" }, () => loadConversations({ silent: true }))
      .on("postgres_changes", { event: "*", schema: "public", table: "support_messages" }, (payload) => {
        const cid = payload.new?.conversation_id || payload.old?.conversation_id;
        if (selectedConversationId && cid === selectedConversationId) loadMessages(selectedConversationId).catch(() => {});
        loadConversations({ silent: true });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => loadTickets())
      .on("postgres_changes", { event: "*", schema: "public", table: "support_ticket_messages" }, (payload) => {
        const tid = payload.new?.ticket_id || payload.old?.ticket_id;
        if (ticketDetailOpen && selectedTicket?.id && tid === selectedTicket.id) loadTicketMessages(selectedTicket.id).catch(() => {});
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "support_platform_settings" }, () => { loadLiveChatSetting().catch(() => {}); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [canAccessSupport, loadConversations, loadLiveChatSetting, loadMessages, loadTicketMessages, loadTickets, profile?.id, selectedConversationId, selectedTicket?.id, ticketDetailOpen]);

  // Fallback live polling for chat when active (helps if realtime events are delayed/missed)
  useEffect(() => {
    if (!canAccessSupport) return;
    // Keep silent polling for active chat views as a safety net if realtime delivery is delayed.
    const isChatActive = (isSuperadmin && view === "chat") || (!isSuperadmin && adminChatWidgetOpen);
    if (!isChatActive) return;

    const timer = setInterval(() => {
      loadConversations({ silent: true });
      if (selectedConversationId) {
        loadMessages(selectedConversationId).catch(() => {});
      }
    }, 1800);

    return () => clearInterval(timer);
  }, [
    adminChatWidgetOpen,
    canAccessSupport,
    isSuperadmin,
    loadConversations,
    loadMessages,
    selectedConversationId,
    view,
  ]);

  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    if (adminWidgetBoxRef.current) adminWidgetBoxRef.current.scrollTop = adminWidgetBoxRef.current.scrollHeight;
  }, [messagesState]);

  // Small incoming message tone for new messages from others
  useEffect(() => {
    if (!messagesState.length) return;
    const latest = messagesState[messagesState.length - 1];
    if (!latest?.id) return;

    if (!hasInitializedMessageFeedRef.current) {
      hasInitializedMessageFeedRef.current = true;
      lastMessageIdRef.current = latest.id;
      return;
    }

    if (latest.id !== lastMessageIdRef.current) {
      if (latest.sender_id !== profile?.id) {
        playIncomingMessageSound();
        if (!isSuperadmin && !adminChatWidgetOpen) {
          setAdminWidgetUnreadCount((prev) => prev + 1);
        }
      }
      lastMessageIdRef.current = latest.id;
    }
  }, [adminChatWidgetOpen, isSuperadmin, messagesState, playIncomingMessageSound, profile?.id]);

  useEffect(() => {
    if (!isSuperadmin) setView("tickets");
  }, [isSuperadmin]);

  const openAdminChatWidget = async () => {
    setAdminChatWidgetOpen(true);
    setAdminWidgetUnreadCount(0);
    if (!selectedConversationId) await createOrGetConversation();
  };

  if (!canAccessSupport) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.amberLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>⚠️</div>
          <Title level={4} style={{ marginBottom: 8 }}>Access Restricted</Title>
          <Text style={{ color: C.textSec }}>The Support Center is available for administrators only. Contact your superadmin for access.</Text>
        </div>
      </div>
    );
  }

  /* ─── ticket table columns ───────────────────────────── */
  const ticketColumns = [
    {
      title: "Ticket",
      key: "title",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, color: C.text, fontSize: 13, marginBottom: 2 }}>{r.title}</div>
          <div style={{ fontSize: 11, color: C.textTer }}>{String(r.source || "ticket").replaceAll("_", " ")}{r.attachment_url ? " · has attachment" : ""}</div>
        </div>
      ),
    },
    { title: "Priority", dataIndex: "priority", render: (v) => <PriorityBadge priority={v} />, width: 110 },
    { title: "Status", dataIndex: "status", render: (v) => <StatusPill status={v} />, width: 120 },
    {
      title: "Tenant",
      key: "tenant",
      render: (_, r) => (
        <span style={{ fontSize: 12, color: C.textSec }}>
          {getTenantName(r.tenant_id)}
        </span>
      ),
      width: 180,
    },
    { title: "Submitted by", key: "by", render: (_, r) => (
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.accentLight, color: C.accent, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {(r.submitted_by_profile?.full_name || "U")[0].toUpperCase()}
        </div>
        <span style={{ fontSize: 13, color: C.text }}>{r.submitted_by_profile?.full_name || "User"}</span>
      </div>
    ), width: 160 },
    { title: "Date", dataIndex: "created_at", render: (v) => <span style={{ fontSize: 12, color: C.textSec }}>{timeAgo(v)}</span>, width: 100 },
    { title: "", key: "details", render: (_, r) => (
      <button onClick={() => openTicketDetails(r)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", fontSize: 12, fontWeight: 500, color: C.text, whiteSpace: "nowrap" }}>
        View <ArrowRightOutlined style={{ fontSize: 10 }} />
      </button>
    ), width: 80 },
  ];

  if (isSuperadmin) {
    ticketColumns.push({
      title: "Change Status",
      key: "action",
      render: (_, r) => (
        <div className="sc-status-seg">
          <Segmented size="small"
            options={[{ label: "Open", value: "open" }, { label: "In Progress", value: "in_progress" }, { label: "Resolved", value: "resolved" }, { label: "Closed", value: "closed" }]}
            value={r.status} onChange={(next) => updateTicketStatus(r, next)} disabled={updatingTicket === r.id}
          />
        </div>
      ),
      width: 340,
    });
  }

  /* ─── render ─────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "inherit" }}>
      <GlobalStyles />

      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.bg, padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CustomerServiceOutlined style={{ color: C.onAccent, fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, lineHeight: 1.2 }}>Support Center</div>
              <div style={{ fontSize: 11, color: C.textSec }}>{isSuperadmin ? "Superadmin view · all tenants" : "Admin workspace"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isSuperadmin && view === "tickets" && (
              <button onClick={() => setShowNewTicket(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: C.accent, color: C.onAccent, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                <PlusOutlined style={{ fontSize: 12 }} /> New Ticket
              </button>
            )}
          </div>
        </div>

        {/* ── Nav tabs ── */}
        <div style={{ display: "flex", gap: 0, marginTop: 0 }}>
          {[
            ...(isSuperadmin && liveChatEnabled ? [{ key: "chat", icon: <MessageOutlined />, label: "Live Chat", count: openChatCount }] : []),
            { key: "tickets", icon: <FileTextOutlined />, label: "Tickets", count: openTicketsCount },
            ...(isSuperadmin ? [{ key: "settings", icon: <SettingOutlined />, label: "Settings" }] : []),
          ].map((tab) => (
            <button key={tab.key} onClick={() => setView(tab.key)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", border: "none", background: "transparent", cursor: "pointer",
              fontSize: 13, fontWeight: view === tab.key ? 600 : 400,
              color: view === tab.key ? C.accent : C.textSec,
              borderBottom: `2px solid ${view === tab.key ? C.accent : "transparent"}`,
              marginBottom: -1, transition: "all .15s",
            }}>
              {tab.icon} {tab.label}
              {tab.count > 0 && <span style={{ padding: "1px 6px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: view === tab.key ? C.accent : C.surface, color: view === tab.key ? C.onAccent : C.textSec }}>{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Metrics strip ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: C.surface, padding: "16px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, maxWidth: 800 }}>
          <MetricCard icon={<MessageOutlined />} label="Active Chats" value={openChatCount} sub="Live conversations" />
          <MetricCard icon={<ClockCircleOutlined />} label="Open Tickets" value={openTicketsCount} sub="Awaiting response" />
          <MetricCard icon={<ThunderboltOutlined />} label="In Progress" value={inProgressCount} sub="Being handled" />
          <MetricCard icon={<CheckCircleOutlined />} label="Resolved" value={resolvedTicketsCount} sub="Closed tickets" />
        </div>
      </div>


      {/* ════ CHAT VIEW ════════════════════════════════════ */}
      {view === "chat" && isSuperadmin && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", height: "calc(100vh - 220px)", maxHeight: "calc(100vh - 220px)", margin: "0", minHeight: 0, overflow: "hidden" }}>

          {/* Sidebar */}
          <div style={{ borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", background: C.bg, minHeight: 0 }}>
            <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontWeight: 700, fontSize: 13, color: C.text }}>Conversations</Text>
              {!isSuperadmin && (
                <button onClick={createOrGetConversation} disabled={isLiveChatDisabled} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.textSec }}>
                  <PlusOutlined style={{ fontSize: 11 }} />
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
              {loadingChat ? (
                <div style={{ padding: 20, textAlign: "center" }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ marginBottom: 8, padding: 12, borderRadius: 8, background: C.surface, height: 68, animation: "pulse 1.5s ease-in-out infinite" }} />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <MessageOutlined style={{ fontSize: 28, color: C.textTer, marginBottom: 8, display: "block" }} />
                  <Text style={{ color: C.textSec, fontSize: 13 }}>No conversations yet</Text>
                </div>
              ) : conversations.map((item) => (
                <div key={item.id} className={`sc-sidebar-item ${selectedConversationId === item.id ? "active" : ""}`}
                  onClick={() => setSelectedConversationId(item.id)}
                  style={{ padding: "12px 16px", cursor: "pointer", borderBottom: `1px solid ${C.borderLight}`, transition: "background .1s" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: item.status === "open" ? C.accentLight : C.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CustomerServiceOutlined style={{ color: item.status === "open" ? C.accent : C.textSec, fontSize: 16 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                        <Text style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{item.subject || "Support Chat"}</Text>
                        <StatusPill status={item.status} />
                      </div>
                      {item.tenant_id && <Text style={{ fontSize: 11, color: C.textTer }}>Tenant: {getTenantName(item.tenant_id)}</Text>}
                      {item.last_message_at && <div style={{ fontSize: 11, color: C.textTer, marginTop: 2 }}>{timeAgo(item.last_message_at)}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div style={{ display: "flex", flexDirection: "column", background: C.bg, minHeight: 0, overflow: "hidden" }}>
            {!selectedConversationId ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>💬</div>
                <Text style={{ color: C.textSec, fontSize: 14 }}>Select a conversation to start</Text>
                {!isSuperadmin && !isLiveChatDisabled && (
                  <button onClick={createOrGetConversation} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: C.accent, color: C.onAccent, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                    Start a new chat
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CustomerServiceOutlined style={{ color: C.accent, fontSize: 16 }} />
                  </div>
                  <div>
                    <Text style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{selectedConversation?.subject || "Live Support"}</Text>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <StatusPill status={selectedConversation?.status || "open"} />
                      {selectedConversation?.tenant_id && (
                        <Text style={{ fontSize: 11, color: C.textTer }}>
                          {getTenantName(selectedConversation.tenant_id)}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div ref={chatBoxRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {messagesState.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontSize: 32 }}>👋</div>
                      <Text style={{ color: C.textSec }}>Send a message to start the conversation</Text>
                    </div>
                  ) : messagesState.map((m) => {
                    const mine = m.sender_id === profile?.id;
                    return (
                      <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                        {!mine && (
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.textSec, flexShrink: 0 }}>
                            {(m.sender?.full_name || "S")[0].toUpperCase()}
                          </div>
                        )}
                        <div style={{ maxWidth: "68%" }}>
                          <div style={{ fontSize: 11, color: C.textTer, marginBottom: 3, textAlign: mine ? "right" : "left" }}>
                            {m.sender?.full_name || "User"}
                          </div>
                          <div style={{
                            padding: "10px 14px", borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                            background: mine ? C.accent : C.surface,
                            color: mine ? C.onAccent : C.text,
                            fontSize: 13, lineHeight: 1.5,
                            border: mine ? "none" : `1px solid ${C.border}`,
                          }}>
                            {m.content && <div>{m.content}</div>}
                            {m.attachment_url && <AttachmentChip url={m.attachment_url} name={m.attachment_name} size={m.attachment_size} />}
                          </div>
                          <div style={{ fontSize: 10, color: C.textTer, marginTop: 3, textAlign: mine ? "right" : "left" }}>{timeAgo(m.created_at)}</div>
                        </div>
                        {mine && (
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.onAccent, flexShrink: 0 }}>
                            {(profile?.full_name || "Y")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Input area */}
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px", background: C.bg }}>
                  {chatAttachment && (
                    <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: C.accentLight, borderRadius: 6, width: "fit-content" }}>
                      <PaperClipOutlined style={{ color: C.accent, fontSize: 11 }} />
                      <span style={{ fontSize: 12, color: C.accent }}>{chatAttachment.name}</span>
                      <button onClick={() => setChatAttachment(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSec, padding: 0, fontSize: 12, lineHeight: 1 }}>×</button>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 14px", background: C.surface, borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <Upload beforeUpload={(file) => { setChatAttachment(file); return false; }} showUploadList={false} maxCount={1} disabled={isLiveChatDisabled || sendingChat}>
                      <button disabled={isLiveChatDisabled} style={{ background: "none", border: "none", cursor: isLiveChatDisabled ? "not-allowed" : "pointer", color: C.textSec, padding: "2px 4px", borderRadius: 4, display: "flex", alignItems: "center" }}>
                        <PaperClipOutlined style={{ fontSize: 16 }} />
                      </button>
                    </Upload>
                    <div className="sc-msg-input" style={{ flex: 1 }}>
                      <Input.TextArea
                        value={chatText} onChange={(e) => setChatText(e.target.value)}
                        placeholder="Type your message…"
                        disabled={isLiveChatDisabled} autoSize={{ minRows: 1, maxRows: 4 }}
                        onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        style={{ border: "none", background: "transparent", boxShadow: "none", resize: "none", padding: 0, fontSize: 13 }}
                      />
                    </div>
                    <button onClick={sendMessage} disabled={isLiveChatDisabled || sendingChat || (!chatText.trim() && !chatAttachment)}
                      style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: (!chatText.trim() && !chatAttachment) ? C.border : C.accent, color: (!chatText.trim() && !chatAttachment) ? C.textSec : C.onAccent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", flexShrink: 0 }}>
                      <SendOutlined style={{ fontSize: 14 }} />
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: C.textTer, marginTop: 6, textAlign: "center" }}>Press Enter to send · Shift+Enter for new line</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════ TICKETS VIEW ════════════════════════════════ */}
      {view === "tickets" && (
        <div style={{ padding: "24px 32px" }}>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
            <div>
              <Title level={5} style={{ margin: 0, color: C.text }}>{isSuperadmin ? "All Support Tickets" : "Your Tickets"}</Title>
              <Text style={{ fontSize: 12, color: C.textSec }}>{filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""}</Text>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="sc-input" style={{ width: 240 }}>
                <Input prefix={<SearchOutlined style={{ color: C.textTer }} />} placeholder="Search tickets…" value={ticketSearch} onChange={(e) => setTicketSearch(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="sc-table" style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: C.radiusLg, overflow: "hidden", boxShadow: C.shadow }}>
            <Table
              rowKey="id"
              columns={ticketColumns}
              dataSource={filteredTickets}
              loading={loadingTickets}
              pagination={{ pageSize: 10, style: { padding: "12px 20px" } }}
              onRow={(r) => ({ onClick: () => {} })}
              locale={{ emptyText: (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <FileTextOutlined style={{ fontSize: 32, color: C.textTer, marginBottom: 12, display: "block" }} />
                  <Text style={{ color: C.textSec }}>No tickets found</Text>
                </div>
              )}}
            />
          </div>
        </div>
      )}

      {/* ════ SETTINGS VIEW (superadmin) ═════════════════ */}
      
      {!isSuperadmin && (
        <Modal
          open={showNewTicket}
          onCancel={() => setShowNewTicket(false)}
          footer={null}
          title="Create New Ticket"
          width={720}
          className="sc-modal"
          destroyOnClose
        >
          <div style={{ padding: "16px 20px 22px" }}>
            <Text style={{ fontSize: 12, color: C.textSec, display: "block", marginBottom: 16 }}>
              Describe your issue and we'll get back to you.
            </Text>
            <form onSubmit={createTicket}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: "block", marginBottom: 6 }}>SUBJECT</label>
                  <div className="sc-input">
                    <Input value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} placeholder="Brief description of your issue" required size="large" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: "block", marginBottom: 6 }}>DESCRIPTION</label>
                  <div className="sc-textarea">
                    <Input.TextArea rows={4} value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)} placeholder="Provide as much detail as possible..." required />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: "block", marginBottom: 8 }}>PRIORITY</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["low", "medium", "high", "urgent"].map((p) => {
                      const cfg = priorityConfig[p];
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTicketPriority(p)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: `1.5px solid ${ticketPriority === p ? cfg.color : C.border}`,
                            background: ticketPriority === p ? cfg.bg : C.bg,
                            color: ticketPriority === p ? cfg.color : C.textSec,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            transition: "all .15s",
                          }}
                        >
                          {cfg.icon} {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <Upload beforeUpload={(file) => { setTicketAttachment(file); return false; }} showUploadList={false} maxCount={1}>
                    <button type="button" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", fontSize: 12, fontWeight: 500, color: C.textSec }}>
                      <PaperClipOutlined /> Attach file
                    </button>
                  </Upload>
                  {ticketAttachment && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: C.accentLight, borderRadius: 6 }}>
                      <PaperClipOutlined style={{ color: C.accent, fontSize: 11 }} />
                      <span style={{ fontSize: 12, color: C.accent }}>{ticketAttachment.name}</span>
                      <button type="button" onClick={() => setTicketAttachment(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSec }}>x</button>
                    </div>
                  )}
                  <button type="submit" disabled={creatingTicket} style={{ marginLeft: "auto", padding: "8px 20px", borderRadius: 8, border: "none", background: C.accent, color: C.onAccent, cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    {creatingTicket ? "Submitting..." : <><CheckOutlined /> Submit Ticket</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}
      {view === "settings" && isSuperadmin && (
        <div style={{ padding: "24px 32px", maxWidth: 600 }}>
          <Title level={5} style={{ marginBottom: 4 }}>Platform Settings</Title>
          <Text style={{ color: C.textSec, display: "block", marginBottom: 24, fontSize: 13 }}>Control live chat availability across the entire platform.</Text>

          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: C.radiusLg, overflow: "hidden", boxShadow: C.shadow }}>
            {/* Toggle row */}
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <MessageOutlined style={{ color: liveChatEnabled ? C.accent : C.textSec, fontSize: 16 }} />
                  <Text style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>Live Chat</Text>
                </div>
                <Text style={{ color: C.textSec, fontSize: 13, lineHeight: 1.5 }}>
                  When enabled, all admin users across every workspace can use live chat to contact support. Disabling this turns off live chat for everyone.
                </Text>
              </div>
              <Switch
                checked={liveChatEnabled}
                onChange={toggleLiveChatSetting}
                loading={savingLiveChatSetting || loadingLiveChatSetting}
                style={{ flexShrink: 0 }}
              />
            </div>

            {/* Status bar */}
            <div style={{
              padding: "14px 24px",
              background: liveChatEnabled ? C.greenLight : C.surface,
              borderTop: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: liveChatEnabled ? C.green : C.textTer,
                boxShadow: liveChatEnabled ? `0 0 0 3px ${C.greenLight}` : "none",
              }} />
              <Text style={{ fontSize: 13, color: liveChatEnabled ? C.green : C.textSec, fontWeight: 500 }}>
                Live chat is <strong>{liveChatEnabled ? "enabled" : "disabled"}</strong> for all users platform-wide
              </Text>
            </div>
          </div>

          {/* Info note */}
          <div style={{ marginTop: 16, padding: "14px 18px", background: C.surface, borderRadius: C.radius, border: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
            <ExclamationCircleOutlined style={{ color: C.textSec, fontSize: 14, marginTop: 1, flexShrink: 0 }} />
            <Text style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
              This is a global setting that affects all tenants and admin accounts simultaneously. Changes take effect immediately without requiring any action from individual users.
            </Text>
          </div>
        </div>
      )}

      {/* Admin Floating Chat Widget */}
      {!isSuperadmin && liveChatEnabled && (
        <>
          <button
            onClick={openAdminChatWidget}
            style={{
              position: "fixed",
              right: 24,
              bottom: 24,
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "none",
              background: C.accent,
              color: C.onAccent,
              boxShadow: C.shadowLg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1200,
              overflow: "visible",
            }}
            title="Open live chat"
          >
            <MessageOutlined style={{ fontSize: 22 }} />
            {adminWidgetUnreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -2,
                  minWidth: 20,
                  height: 20,
                  padding: "0 6px",
                  borderRadius: 999,
                  background: C.red,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: "20px",
                  textAlign: "center",
                  boxShadow: C.shadow,
                }}
              >
                {adminWidgetUnreadCount > 99 ? "99+" : adminWidgetUnreadCount}
              </span>
            )}
          </button>

          {adminChatWidgetOpen && (
            <div
              style={{
                position: "fixed",
                right: 24,
                bottom: 90,
                width: 360,
                maxWidth: "calc(100vw - 32px)",
                height: 520,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                boxShadow: C.shadowLg,
                zIndex: 1201,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Space>
                  <Avatar
                    size={26}
                    icon={<CustomerServiceOutlined />}
                    style={{ background: C.accent, color: C.onAccent }}
                  />
                  <div>
                    <Text style={{ fontWeight: 700, fontSize: 13 }}>
                      Live Support
                    </Text>
                    <div style={{ fontSize: 11, color: C.textSec }}>
                      {selectedConversation?.subject || "General Support"}
                    </div>
                  </div>
                </Space>
                <button
                  onClick={() => setAdminChatWidgetOpen(false)}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: C.textSec,
                    fontSize: 16,
                  }}
                >
                  ×
                </button>
              </div>

              <div
                ref={adminWidgetBoxRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: 12,
                  background: C.surface,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {messagesState.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <Text style={{ color: C.textSec, fontSize: 12 }}>
                      Start conversation with support
                    </Text>
                  </div>
                ) : (
                  messagesState.map((m) => {
                    const mine = m.sender_id === profile?.id;
                    return (
                      <div
                        key={m.id}
                        style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}
                      >
                        <div
                          style={{
                            maxWidth: "80%",
                            padding: "8px 10px",
                            borderRadius: mine ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                            background: mine ? C.accent : C.bg,
                            color: mine ? C.onAccent : C.text,
                            border: mine ? "none" : `1px solid ${C.border}`,
                            fontSize: 12.5,
                            lineHeight: 1.5,
                          }}
                        >
                          {m.content && <div>{m.content}</div>}
                          {m.attachment_url && (
                            <AttachmentChip
                              url={m.attachment_url}
                              name={m.attachment_name}
                              size={m.attachment_size}
                            />
                          )}
                          <div
                            style={{
                              fontSize: 10,
                              marginTop: 4,
                              color: mine ? C.onAccentMuted : C.textTer,
                              textAlign: "right",
                            }}
                          >
                            {timeAgo(m.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ padding: 10, borderTop: `1px solid ${C.border}`, background: C.bg }}>
                {chatAttachment && (
                  <div
                    style={{
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      background: C.accentLight,
                      borderRadius: 6,
                      width: "fit-content",
                    }}
                  >
                    <PaperClipOutlined style={{ color: C.accent, fontSize: 11 }} />
                    <span style={{ fontSize: 12, color: C.accent }}>{chatAttachment.name}</span>
                    <button
                      onClick={() => setChatAttachment(null)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.textSec, padding: 0 }}
                    >
                      ×
                    </button>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    padding: "8px 10px",
                    background: C.surface,
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <Upload
                    beforeUpload={(file) => {
                      setChatAttachment(file);
                      return false;
                    }}
                    showUploadList={false}
                    maxCount={1}
                    disabled={sendingChat}
                  >
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.textSec,
                        padding: "2px 4px",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <PaperClipOutlined style={{ fontSize: 15 }} />
                    </button>
                  </Upload>
                  <div className="sc-msg-input" style={{ flex: 1 }}>
                    <Input.TextArea
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Type your message…"
                      autoSize={{ minRows: 1, maxRows: 3 }}
                      onPressEnter={(e) => {
                        if (!e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        boxShadow: "none",
                        resize: "none",
                        padding: 0,
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={sendingChat || (!chatText.trim() && !chatAttachment)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "none",
                      background:
                        !chatText.trim() && !chatAttachment ? C.border : C.accent,
                      color:
                        !chatText.trim() && !chatAttachment ? C.textSec : C.onAccent,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SendOutlined style={{ fontSize: 13 }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════ TICKET DETAIL MODAL ═══════════════════════ */}
      <Modal
        open={ticketDetailOpen} onCancel={() => setTicketDetailOpen(false)}
        footer={null} title={null} width={760} className="sc-modal" destroyOnClose
      >
        {selectedTicket && (
          <div>
            {/* Modal header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 700, fontSize: 16, color: C.text, display: "block", marginBottom: 8 }}>{selectedTicket.title}</Text>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <PriorityBadge priority={selectedTicket.priority} />
                    <StatusPill status={selectedTicket.status} />
                    <span style={{ fontSize: 12, color: C.textTer }}>Created {timeAgo(selectedTicket.created_at)}</span>
                    {selectedTicket.submitted_by_profile?.full_name && (
                      <span style={{ fontSize: 12, color: C.textSec }}>by <strong>{selectedTicket.submitted_by_profile.full_name}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status changer for superadmin */}
              {isSuperadmin && (
                <div style={{ display: "flex", gap: 6 }}>
                  {["open", "in_progress", "resolved", "closed"].map((s) => {
                    const cfg = statusConfig[s];
                    const active = selectedTicket.status === s;
                    return (
                      <button key={s} onClick={() => updateTicketStatus(selectedTicket.id, s)} disabled={updatingTicket === selectedTicket.id} style={{
                        padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                        border: `1.5px solid ${active ? cfg.color : C.border}`,
                        background: active ? cfg.bg : C.bg, color: active ? cfg.color : C.textSec,
                      }}>
                        {active && <CheckOutlined style={{ marginRight: 4, fontSize: 10 }} />}{cfg.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Two-column body */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", minHeight: 480 }}>
              {/* Main: replies */}
              <div style={{ borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, maxHeight: 360 }}>
                  {loadingTicketMessages ? (
                    <div style={{ textAlign: "center", padding: 20 }}><Text style={{ color: C.textSec }}>Loading replies…</Text></div>
                  ) : ticketMessages.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, padding: 40 }}>
                      <div style={{ fontSize: 28 }}>💬</div>
                      <Text style={{ color: C.textSec, fontSize: 13 }}>No replies yet. Add the first reply below.</Text>
                    </div>
                  ) : ticketMessages.map((r) => {
                    const mine = r.sender_id === profile?.id;
                    return (
                      <div key={r.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
                        {!mine && <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.textSec, flexShrink: 0 }}>{(r.sender?.full_name || "S")[0].toUpperCase()}</div>}
                        <div style={{ maxWidth: "72%" }}>
                          <div style={{ fontSize: 11, color: C.textTer, marginBottom: 3, textAlign: mine ? "right" : "left" }}>{r.sender?.full_name || "User"}</div>
                          <div style={{ padding: "10px 14px", borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: mine ? C.accent : C.surface, color: mine ? C.onAccent : C.text, fontSize: 13, lineHeight: 1.5, border: mine ? "none" : `1px solid ${C.border}` }}>
                            {r.message && <div>{r.message}</div>}
                            {r.attachment_url && <AttachmentChip url={r.attachment_url} name={r.attachment_name} size={r.attachment_size} />}
                          </div>
                          <div style={{ fontSize: 10, color: C.textTer, marginTop: 3, textAlign: mine ? "right" : "left" }}>{timeAgo(r.created_at)}</div>
                        </div>
                        {mine && <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.onAccent, flexShrink: 0 }}>{(profile?.full_name || "Y")[0].toUpperCase()}</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Reply input */}
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 20px" }}>
                  {ticketReplyAttachment && (
                    <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: C.accentLight, borderRadius: 6, width: "fit-content" }}>
                      <PaperClipOutlined style={{ color: C.accent, fontSize: 11 }} />
                      <span style={{ fontSize: 12, color: C.accent }}>{ticketReplyAttachment.name}</span>
                      <button onClick={() => setTicketReplyAttachment(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSec }}>×</button>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 14px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <Upload beforeUpload={(file) => { setTicketReplyAttachment(file); return false; }} showUploadList={false} maxCount={1}>
                      <button style={{ background: "none", border: "none", cursor: "pointer", color: C.textSec, padding: "2px 4px" }}><PaperClipOutlined style={{ fontSize: 15 }} /></button>
                    </Upload>
                    <div className="sc-msg-input" style={{ flex: 1 }}>
                      <Input.TextArea value={ticketReply} onChange={(e) => setTicketReply(e.target.value)} placeholder="Write a reply…" autoSize={{ minRows: 1, maxRows: 4 }}
                        onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); sendTicketReply(); } }}
                        style={{ border: "none", background: "transparent", boxShadow: "none", resize: "none", padding: 0, fontSize: 13 }}
                      />
                    </div>
                    <button onClick={sendTicketReply} disabled={sendingTicketReply || (!ticketReply.trim() && !ticketReplyAttachment)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: (!ticketReply.trim() && !ticketReplyAttachment) ? C.border : C.accent, color: (!ticketReply.trim() && !ticketReplyAttachment) ? C.textSec : C.onAccent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SendOutlined style={{ fontSize: 13 }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar: ticket info */}
              <div style={{ padding: "16px 20px", overflowY: "auto" }}>
                <div style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, color: C.textTer, textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 12 }}>Description</Text>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: "pre-wrap", background: C.surface, borderRadius: 8, padding: "10px 12px" }}>{selectedTicket.description}</div>
                  {selectedTicket.attachment_url && (
                    <div style={{ marginTop: 8 }}>
                      <AttachmentChip url={selectedTicket.attachment_url} name={selectedTicket.attachment_name} size={selectedTicket.attachment_size} />
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { label: "Status", value: <StatusPill status={selectedTicket.status} /> },
                    { label: "Priority", value: <PriorityBadge priority={selectedTicket.priority} /> },
                    { label: "Tenant", value: <span style={{ fontSize: 12, color: C.textSec }}>{getTenantName(selectedTicket.tenant_id)}</span> },
                    { label: "Source", value: <span style={{ fontSize: 12, color: C.textSec }}>{String(selectedTicket.source || "—").replaceAll("_", " ")}</span> },
                    { label: "Created", value: <span style={{ fontSize: 12, color: C.textSec }}>{new Date(selectedTicket.created_at).toLocaleString()}</span> },
                    ...(selectedTicket.submitted_by_profile?.email ? [{ label: "Email", value: <span style={{ fontSize: 12, color: C.textSec }}>{selectedTicket.submitted_by_profile.email}</span> }] : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <Text style={{ fontSize: 11, fontWeight: 600, color: C.textTer, textTransform: "uppercase", letterSpacing: ".04em", display: "block", marginBottom: 4 }}>{label}</Text>
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupportCenter;










