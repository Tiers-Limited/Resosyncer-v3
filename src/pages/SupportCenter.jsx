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
  CloseOutlined,
  MinusOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const { Text, Title } = Typography;
const GROQ_API_KEY =
  import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

/* ─── design tokens ─────────────────────────────────────── */
const C = {
  bg: "#ffffff",
  surface: "#f8f9fb",
  surfaceHover: "#f1f3f7",
  border: "#e8eaed",
  borderLight: "#f0f2f5",
  text: "#0d0f12",
  textSec: "#6b7280",
  textTer: "#9ca3af",
  accent: "#102a43",
  accentLight: "#e9eff7",
  accentHover: "#163a5f",
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
  shadowXl: "0 20px 60px rgba(0,0,0,.15)",
  radius: 10,
  radiusSm: 6,
  radiusLg: 16,
};

const statusConfig = {
  open: { color: C.accent, bg: C.accentLight, label: "Open", dot: "#102a43" },
  in_progress: {
    color: C.amber,
    bg: C.amberLight,
    label: "In Progress",
    dot: "#d97706",
  },
  resolved: {
    color: C.green,
    bg: C.greenLight,
    label: "Resolved",
    dot: "#059669",
  },
  closed: { color: C.textSec, bg: C.surface, label: "Closed", dot: "#6b7280" },
};

const priorityConfig = {
  low: { color: C.textSec, bg: C.surface, icon: "↓", label: "Low" },
  medium: { color: C.accent, bg: C.accentLight, icon: "→", label: "Medium" },
  high: { color: C.amber, bg: C.amberLight, icon: "↑", label: "High" },
  urgent: { color: C.red, bg: C.redLight, icon: "⚡", label: "Urgent" },
};

const fileNameFromUrl = (url) => {
  if (!url) return "attachment";
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "attachment");
  } catch {
    return "attachment";
  }
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

const AI_SYSTEM_PROMPT = `You are Ryzent Support AI. Keep answers short, practical, and calm.
Help with product usage, troubleshooting, and next steps.
If user asks for a human or uses abusive language, do not argue. Say you are escalating to a live agent.`;

const LIVE_AGENT_REGEX =
  /\b(live agent|human|real person|support agent|representative|talk to (someone|human)|connect me)\b/i;
const OFFENSIVE_REGEX =
  /\b(stupid|idiot|dumb|shit|fuck|bitch|asshole|moron|useless)\b/i;

/* ─── small components ───────────────────────────────────── */
const StatusPill = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.open;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        letterSpacing: ".02em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cfg = priorityConfig[priority] || priorityConfig.medium;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
};

const MetricCard = ({ icon, label, value, sub, accent }) => (
  <div
    style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: C.radiusLg,
      padding: "22px 24px",
      boxShadow: C.shadow,
      position: "relative",
      overflow: "hidden",
      transition: "box-shadow .2s, transform .2s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = C.shadowMd;
      e.currentTarget.style.transform = "translateY(-1px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = C.shadow;
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 80,
        height: 80,
        borderRadius: "0 0 0 80px",
        background: accent || C.accentLight,
        opacity: 0.5,
      }}
    />
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: accent || C.accentLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          color: C.accent,
          zIndex: 1,
        }}
      >
        {icon}
      </div>
      <Text
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: C.textSec,
          letterSpacing: ".05em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </div>
    <div
      style={{
        fontSize: 32,
        fontWeight: 800,
        color: C.text,
        lineHeight: 1,
        letterSpacing: "-.02em",
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ marginTop: 6, fontSize: 12, color: C.textTer }}>{sub}</div>
    )}
  </div>
);

const AttachmentChip = ({ url, name, size }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 10px",
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 6,
      fontSize: 12,
      color: C.accent,
      textDecoration: "none",
      marginTop: 6,
    }}
  >
    <DownloadOutlined style={{ fontSize: 11 }} />
    <span
      style={{
        maxWidth: 200,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {name || fileNameFromUrl(url)}
    </span>
    {size ? (
      <span style={{ color: C.textTer }}>· {formatBytes(size)}</span>
    ) : null}
  </a>
);

/* ─── global styles ──────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    .sc-sidebar-item:hover { background: ${C.surfaceHover} !important; }
    .sc-sidebar-item.active { background: ${C.accentLight} !important; }
    .sc-msg-input .ant-input { border: none !important; box-shadow: none !important; background: transparent !important; }
    .sc-msg-input .ant-input:focus { box-shadow: none !important; }
    .sc-tab-seg .ant-segmented-item-selected { background: ${C.accent} !important; color: #fff !important; border-radius: 6px !important; }
    .sc-tab-seg .ant-segmented { background: ${C.surface} !important; border: 1px solid ${C.border} !important; border-radius: 8px !important; }
    .sc-status-seg .ant-segmented-item-selected { background: ${C.accent} !important; color: #fff !important; border-radius: 6px !important; }
    .sc-status-seg .ant-segmented { background: ${C.surface} !important; border: 1px solid ${C.border} !important; border-radius: 8px !important; padding: 2px !important; }
    .sc-table .ant-table { background: transparent !important; }
    .sc-table .ant-table-thead > tr > th { background: ${C.surface} !important; border-bottom: 1px solid ${C.border} !important; font-size: 11px !important; font-weight: 700 !important; color: ${C.textSec} !important; text-transform: uppercase !important; letter-spacing: .05em !important; padding: 12px 16px !important; }
    .sc-table .ant-table-tbody > tr > td { border-bottom: 1px solid ${C.borderLight} !important; padding: 14px 16px !important; }
    .sc-table .ant-table-tbody > tr:hover > td { background: ${C.surface} !important; }
    .sc-table .ant-table-row { cursor: pointer; }
    .sc-input .ant-input, .sc-input .ant-input-affix-wrapper { background: ${C.surface} !important; border-color: ${C.border} !important; border-radius: 8px !important; }
    .sc-input .ant-input:focus, .sc-input .ant-input-affix-wrapper:focus-within { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px ${C.accentLight} !important; background: ${C.bg} !important; }
    .sc-textarea textarea { background: ${C.surface} !important; border-color: ${C.border} !important; border-radius: 8px !important; }
    .sc-textarea textarea:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px ${C.accentLight} !important; background: ${C.bg} !important; }
    .sc-modal .ant-modal-content { border-radius: 20px !important; overflow: hidden !important; padding: 0 !important; box-shadow: ${C.shadowXl} !important; }
    .sc-modal .ant-modal-body { padding: 0 !important; }
    .sc-modal .ant-modal-close { top: 20px !important; right: 22px !important; }
    .sc-chat-scroll {
      scrollbar-width: thin;
      scrollbar-color: #526987 rgba(16,42,67,.08);
      scrollbar-gutter: stable both-edges;
    }
    .sc-chat-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
    .sc-chat-scroll::-webkit-scrollbar-track {
      background: linear-gradient(180deg, rgba(16,42,67,.04), rgba(16,42,67,.08));
      border-radius: 999px;
    }
    .sc-chat-scroll::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, #6c809b 0%, #4b6281 100%);
      border-radius: 999px;
      border: 2px solid transparent;
      background-clip: padding-box;
      min-height: 36px;
    }
    .sc-chat-scroll::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, #7f93ad 0%, #5a7190 100%);
      background-clip: padding-box;
    }
    .sc-chat-scroll::-webkit-scrollbar-thumb:active {
      background: linear-gradient(180deg, #3f5675 0%, #2d4668 100%);
      background-clip: padding-box;
    }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }

    /* Chat widget animations */
    @keyframes chatSlideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes chatSlideDown {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(20px) scale(0.95); }
    }
    @keyframes bubblePop {
      0% { transform: scale(1); }
      50% { transform: scale(1.12); }
      100% { transform: scale(1); }
    }
    @keyframes typingDot {
      0%, 80%, 100% { transform: scale(0.6); opacity: .4; }
      40% { transform: scale(1); opacity: 1; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .5; }
    }
    @keyframes unreadBadge {
      0% { transform: scale(0); }
      60% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    .chat-widget-open { animation: chatSlideUp .25s cubic-bezier(.34,1.56,.64,1) forwards; }
    .chat-bubble-btn:hover { transform: scale(1.08) !important; box-shadow: 0 8px 30px rgba(16,42,67,.45) !important; }
    .chat-bubble-btn:active { transform: scale(0.96) !important; }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════
   FLOATING CHAT WIDGET
   ═══════════════════════════════════════════════════════════ */
const FloatingChatWidget = ({
  profile,
  isSuperadmin,
  isLiveChatDisabled,
  tenantId,
  conversations,
  selectedConversationId,
  setSelectedConversationId,
  messagesState,
  combinedThreadMessages,
  chatBoxRef,
  chatText,
  setChatText,
  chatAttachment,
  setChatAttachment,
  sendingChat,
  sendMessage,
  createOrGetConversation,
  loadConversations,
}) => {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const prevMsgCount = useRef(combinedThreadMessages.length);

  useEffect(() => {
    if (!open && combinedThreadMessages.length > prevMsgCount.current) {
      setUnread(
        (u) => u + (combinedThreadMessages.length - prevMsgCount.current),
      );
    }
    prevMsgCount.current = combinedThreadMessages.length;
  }, [combinedThreadMessages.length, open]);

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
  };
  const handleClose = () => setOpen(false);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId,
  );

  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999 }}>
      {/* Chat Panel */}
      {open && (
        <div
          className="chat-widget-open"
          style={{
            position: "absolute",
            bottom: 70,
            right: 0,
            width: 380,
            height: 580,
            background: C.bg,
            borderRadius: 20,
            boxShadow: C.shadowXl,
            border: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Widget Header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentHover} 100%)`,
              padding: "18px 20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "rgba(255,255,255,.08)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -30,
                right: 40,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(255,255,255,.06)",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "rgba(255,255,255,.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <RobotOutlined style={{ color: "#fff", fontSize: 18 }} />
                </div>
                <div>
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      lineHeight: 1.3,
                    }}
                  >
                    Ryzent Support
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 2,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#4ade80",
                      }}
                    />
                    <span
                      style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}
                    >
                      AI + Live agents online
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(255,255,255,.15)",
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(4px)",
                  transition: "background .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,.15)")
                }
              >
                <CloseOutlined style={{ fontSize: 12 }} />
              </button>
            </div>
          </div>

          {/* Conversation selector (if multiple) — superadmin only or multi-conv admin */}
          {isSuperadmin && conversations.length > 1 && (
            <div
              style={{
                borderBottom: `1px solid ${C.border}`,
                padding: "8px 12px",
                background: C.surface,
                maxHeight: 130,
                overflowY: "auto",
              }}
            >
              {conversations.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedConversationId(c.id)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background:
                      selectedConversationId === c.id
                        ? C.accentLight
                        : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color:
                        selectedConversationId === c.id ? C.accent : C.text,
                    }}
                  >
                    {c.subject || "Support Chat"}
                  </span>
                  <StatusPill status={c.status} />
                </div>
              ))}
            </div>
          )}

          {/* Messages Area */}
          <div
            ref={chatBoxRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              background: "#fafbfc",
            }}
          >
            {/* Welcome message */}
            {combinedThreadMessages.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 16px" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: C.accentLight,
                    margin: "0 auto 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}
                >
                  👋
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: C.text,
                    fontSize: 14,
                    marginBottom: 6,
                  }}
                >
                  Hi there!
                </div>
                <div
                  style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}
                >
                  Ask me anything — I'm Ryzent's AI assistant.
                  <br />
                  For a live agent, just type "live agent".
                </div>
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                  }}
                >
                  {[
                    "How do I get started?",
                    "I found a bug",
                    "Talk to a human",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setChatText(q);
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        border: `1px solid ${C.border}`,
                        background: C.bg,
                        cursor: "pointer",
                        fontSize: 12,
                        color: C.text,
                        transition: "all .15s",
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = C.accent;
                        e.currentTarget.style.color = C.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = C.border;
                        e.currentTarget.style.color = C.text;
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {combinedThreadMessages.map((m) => {
              const isAi = !!m.is_ai;
              const mine = !isAi && m.sender_id === profile?.id;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: mine ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                    gap: 7,
                  }}
                >
                  {!mine && (
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: isAi ? C.accent : C.surface,
                        border: `1px solid ${isAi ? C.accent : C.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: isAi ? "#fff" : C.textSec,
                        flexShrink: 0,
                      }}
                    >
                      {isAi ? (
                        <RobotOutlined style={{ fontSize: 11 }} />
                      ) : (
                        (m.sender?.full_name || "S")[0].toUpperCase()
                      )}
                    </div>
                  )}
                  <div style={{ maxWidth: "76%" }}>
                    <div
                      style={{
                        padding: "9px 13px",
                        borderRadius: mine
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                        background: mine ? C.accent : isAi ? "#fff" : "#fff",
                        color: mine ? "#fff" : C.text,
                        fontSize: 13,
                        lineHeight: 1.55,
                        border: mine
                          ? "none"
                          : `1px solid ${isAi ? C.border : C.border}`,
                        boxShadow: mine ? "none" : "0 1px 4px rgba(0,0,0,.06)",
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
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: C.textTer,
                        marginTop: 3,
                        textAlign: mine ? "right" : "left",
                        paddingLeft: 2,
                        paddingRight: 2,
                      }}
                    >
                      {isAi ? "AI · " : ""}
                      {timeAgo(m.created_at)}
                    </div>
                  </div>
                  {mine && (
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: C.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {(profile?.full_name || "Y")[0].toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Input Bar */}
          <div
            style={{
              borderTop: `1px solid ${C.border}`,
              padding: "12px 14px",
              background: C.bg,
            }}
          >
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
                <span style={{ fontSize: 12, color: C.accent }}>
                  {chatAttachment.name}
                </span>
                <button
                  onClick={() => setChatAttachment(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.textSec,
                    padding: 0,
                    fontSize: 14,
                  }}
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
                padding: "9px 12px",
                background: C.surface,
                borderRadius: 14,
                border: `1.5px solid ${C.border}`,
                transition: "border-color .15s",
              }}
              onFocusCapture={(e) =>
                (e.currentTarget.style.borderColor = C.accent)
              }
              onBlurCapture={(e) =>
                (e.currentTarget.style.borderColor = C.border)
              }
            >
              <Upload
                beforeUpload={(file) => {
                  setChatAttachment(file);
                  return false;
                }}
                showUploadList={false}
                maxCount={1}
                disabled={isLiveChatDisabled || sendingChat}
              >
                <button
                  disabled={isLiveChatDisabled}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: isLiveChatDisabled ? "not-allowed" : "pointer",
                    color: C.textSec,
                    padding: "2px 3px",
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
                  placeholder={
                    isLiveChatDisabled ? "Live chat is disabled" : "Message…"
                  }
                  disabled={isLiveChatDisabled}
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
                disabled={
                  isLiveChatDisabled ||
                  sendingChat ||
                  (!chatText.trim() && !chatAttachment)
                }
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: "none",
                  background:
                    !chatText.trim() && !chatAttachment ? C.border : C.accent,
                  color:
                    !chatText.trim() && !chatAttachment ? C.textSec : "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all .15s",
                  flexShrink: 0,
                }}
              >
                <SendOutlined style={{ fontSize: 13 }} />
              </button>
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.textTer,
                marginTop: 5,
                textAlign: "center",
              }}
            >
              Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      )}

      {/* Floating Bubble Button */}
      <button
        className="chat-bubble-btn"
        onClick={open ? handleClose : handleOpen}
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          border: "none",
          background: open
            ? "#374151"
            : `linear-gradient(135deg, ${C.accent} 0%, ${C.accentHover} 100%)`,
          boxShadow: open
            ? "0 4px 20px rgba(0,0,0,.2)"
            : "0 4px 20px rgba(16,42,67,.35)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all .2s cubic-bezier(.34,1.56,.64,1)",
          position: "relative",
        }}
      >
        {open ? (
          <CloseOutlined style={{ color: "#fff", fontSize: 18 }} />
        ) : (
          <CustomerServiceOutlined style={{ color: "#fff", fontSize: 22 }} />
        )}
        {!open && unread > 0 && (
          <div
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: C.red,
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
              animation:
                "unreadBadge .3s cubic-bezier(.34,1.56,.64,1) forwards",
            }}
          >
            {unread}
          </div>
        )}
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const SupportCenter = () => {
  const { profile } = useAuth();
  const isSuperadmin =
    profile?.role === "superadmin" || profile?.role === "super_admin";
  const isAdmin = profile?.role === "admin";
  const canAccessSupport = isSuperadmin || isAdmin;
  const tenantId = profile?.tenant_id || null;

  const [view, setView] = useState("chats");
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messagesState, setMessagesState] = useState([]);
  const [chatText, setChatText] = useState("");
  const [chatAttachment, setChatAttachment] = useState(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const chatBoxRef = useRef(null);

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [updatingTicket, setUpdatingTicket] = useState(null);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [ticketAttachment, setTicketAttachment] = useState(null);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");

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
  const [superadmins, setSuperadmins] = useState([]);
  const [aiMessagesByConversation, setAiMessagesByConversation] = useState({});

  const isLiveChatDisabled = !isSuperadmin && !liveChatEnabled;

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const openChatCount = conversations.filter((c) => c.status === "open").length;
  const openTicketsCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "in_progress",
  ).length;
  const resolvedTicketsCount = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed",
  ).length;

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (ticketSearch) {
      const q = ticketSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }
    if (ticketStatusFilter !== "all") {
      result = result.filter((t) => t.status === ticketStatusFilter);
    }
    return result;
  }, [tickets, ticketSearch, ticketStatusFilter]);

  const aiThreadMessages = useMemo(
    () => aiMessagesByConversation[selectedConversationId] || [],
    [aiMessagesByConversation, selectedConversationId],
  );

  const combinedThreadMessages = useMemo(() => {
    const merged = [...(messagesState || []), ...aiThreadMessages];
    merged.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return merged;
  }, [aiThreadMessages, messagesState]);

  /* ─── helpers ─────────────────────────────────────────── */
  const uploadSupportFile = useCallback(
    async (file, scope) => {
      const cleanName = (file.name || "file").replace(/[^\w.\-]/g, "_");
      const path = `${profile?.id || "user"}/${scope}/${Date.now()}-${cleanName}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(path, file, { contentType: file.type || undefined });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("chat-files").getPublicUrl(path);
      return {
        attachment_url: data?.publicUrl || null,
        attachment_name: file.name || cleanName,
        attachment_size: file.size || null,
        attachment_type: file.type || null,
      };
    },
    [profile?.id],
  );

  const groq = useCallback(async (systemPrompt, userContent) => {
    if (!GROQ_API_KEY) throw new Error("Missing GROQ API key");
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
        max_tokens: 450,
      }),
    });
    if (!res.ok) throw new Error("Groq failed");
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || "";
  }, []);

  const sendEmail = useCallback(async ({ to, subject, body, companyName }) => {
    if (!EMAIL_API || !to)
      return { success: false, error: "EMAIL_API_NOT_CONFIGURED" };
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
      return { success: false, error: err?.message || "EMAIL_SEND_FAILED" };
    }
  }, []);

  const addAiMessage = useCallback((conversationId, content) => {
    if (!conversationId || !content) return;
    const aiMsg = {
      id: `ai-${conversationId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      conversation_id: conversationId,
      sender_id: null,
      content,
      created_at: new Date().toISOString(),
      is_ai: true,
      sender: { full_name: "Ryzent AI Assistant", role: "assistant" },
      attachment_url: null,
      attachment_name: null,
      attachment_size: null,
    };
    setAiMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), aiMsg],
    }));
  }, []);

  const isEscalationTrigger = useCallback(
    (text) =>
      LIVE_AGENT_REGEX.test(text || "") || OFFENSIVE_REGEX.test(text || ""),
    [],
  );

  const loadSuperadmins = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["superadmin", "super_admin"]);
    if (!error) setSuperadmins(data || []);
  }, []);

  const escalateConversation = useCallback(
    async (conversationId, userMessage) => {
      const current = conversations.find((c) => c.id === conversationId);
      const alreadyEscalated =
        !!current?.assigned_superadmin_id ||
        (current?.subject || "").startsWith("[LIVE AGENT]");
      const firstSuperadmin = superadmins[0] || null;
      const updates = { last_message_at: new Date().toISOString() };
      if (!alreadyEscalated) {
        updates.subject = (current?.subject || "Support Chat").startsWith(
          "[LIVE AGENT]",
        )
          ? current?.subject
          : `[LIVE AGENT] ${current?.subject || "Support Chat"}`;
        if (firstSuperadmin?.id)
          updates.assigned_superadmin_id = firstSuperadmin.id;
      }
      await supabase
        .from("support_conversations")
        .update(updates)
        .eq("id", conversationId);
      const recipients = (superadmins || [])
        .map((sa) => sa.email)
        .filter(Boolean);
      if (recipients.length > 0) {
        const html = `<div style="font-family:Arial,sans-serif;line-height:1.6"><h3>Live Agent Escalation</h3><p><strong>Tenant:</strong> ${tenantId || "N/A"}</p><p><strong>Conversation:</strong> ${conversationId}</p><p><strong>User:</strong> ${profile?.full_name || profile?.id || "Unknown"}</p><p><strong>Message:</strong> ${userMessage || "(no text provided)"}</p></div>`;
        await Promise.allSettled(
          recipients.map((to) =>
            sendEmail({
              to,
              subject: "Ryzent Support: Live Agent Escalation",
              body: html,
              companyName: "Ryzent AI",
            }),
          ),
        );
      }
      addAiMessage(
        conversationId,
        "I am connecting you with a live support agent now. A superadmin has been notified and will continue this thread.",
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                ...updates,
                subject: updates.subject || c.subject,
                assigned_superadmin_id:
                  updates.assigned_superadmin_id || c.assigned_superadmin_id,
              }
            : c,
        ),
      );
    },
    [
      addAiMessage,
      conversations,
      profile?.full_name,
      profile?.id,
      sendEmail,
      superadmins,
      tenantId,
    ],
  );

  const loadLiveChatSetting = useCallback(async () => {
    setLoadingLiveChatSetting(true);
    try {
      const { data, error } = await supabase
        .from("workspace_settings")
        .select("customer_support_live_chat_enabled")
        .eq("tenant_id", "global")
        .maybeSingle();
      if (error) throw error;
      setLiveChatEnabled(data?.customer_support_live_chat_enabled ?? true);
    } catch {
      setLiveChatEnabled(true);
    } finally {
      setLoadingLiveChatSetting(false);
    }
  }, []);

  const toggleLiveChatSetting = async (enabled) => {
    setSavingLiveChatSetting(true);
    try {
      const { error } = await supabase
        .from("workspace_settings")
        .upsert(
          { tenant_id: "global", customer_support_live_chat_enabled: enabled },
          { onConflict: "tenant_id" },
        );
      if (error) throw error;
      setLiveChatEnabled(enabled);
      message.success(
        `Live chat ${enabled ? "enabled" : "disabled"} for all users`,
      );
    } catch (e) {
      message.error(e.message || "Failed");
    } finally {
      setSavingLiveChatSetting(false);
    }
  };

  const loadConversations = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingChat(true);
    try {
      let query = supabase
        .from("support_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (!isSuperadmin) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      const rows = data || [];
      setConversations(rows);
      if (!selectedConversationId && rows.length > 0)
        setSelectedConversationId(rows[0].id);
      if (
        selectedConversationId &&
        rows.length > 0 &&
        !rows.some((r) => r.id === selectedConversationId)
      )
        setSelectedConversationId(rows[0].id);
    } catch (e) {
      message.error(e.message || "Failed to load chats");
    } finally {
      setLoadingChat(false);
    }
  }, [isSuperadmin, profile?.id, selectedConversationId, tenantId]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessagesState([]);
      return;
    }
    const { data, error } = await supabase
      .from("support_messages")
      .select(
        "id, conversation_id, sender_id, content, attachment_url, attachment_name, attachment_size, created_at, sender:profiles!support_messages_sender_id_fkey(id, full_name, role)",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) {
      message.error(error.message || "Failed to load messages");
      return;
    }
    setMessagesState(data || []);
  }, []);

  const loadTickets = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingTickets(true);
    try {
      let query = supabase
        .from("support_tickets")
        .select(
          "id, title, description, priority, status, source, created_at, tenant_id, submitted_by, attachment_url, attachment_name, attachment_size, submitted_by_profile:profiles!support_tickets_submitted_by_fkey(full_name, email)",
        )
        .order("created_at", { ascending: false });
      if (!isSuperadmin) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query;
      if (error) throw error;
      const rows = data || [];
      setTickets(rows);
      if (selectedTicket?.id) {
        const fresh = rows.find((t) => t.id === selectedTicket.id);
        if (fresh) setSelectedTicket(fresh);
      }
    } catch (e) {
      message.error(e.message || "Failed to load tickets");
    } finally {
      setLoadingTickets(false);
    }
  }, [isSuperadmin, profile?.id, selectedTicket?.id, tenantId]);

  const loadTicketMessages = useCallback(async (ticketId) => {
    if (!ticketId) {
      setTicketMessages([]);
      return;
    }
    setLoadingTicketMessages(true);
    try {
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .select(
          "id, ticket_id, sender_id, message, attachment_url, attachment_name, attachment_size, created_at, sender:profiles!support_ticket_messages_sender_id_fkey(id, full_name, role)",
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setTicketMessages(data || []);
    } catch (e) {
      message.error(e.message || "Failed to load replies");
    } finally {
      setLoadingTicketMessages(false);
    }
  }, []);

  const createOrGetConversation = async () => {
    if (isSuperadmin) return selectedConversationId;
    if (isLiveChatDisabled) {
      message.warning("Live chat is disabled by your administrator");
      return null;
    }
    if (!tenantId) {
      message.error("No tenant found");
      return null;
    }
    const openConversation = conversations.find((c) => c.status === "open");
    if (openConversation) {
      setSelectedConversationId(openConversation.id);
      return openConversation.id;
    }
    const { data, error } = await supabase
      .from("support_conversations")
      .insert([
        {
          tenant_id: tenantId,
          initiated_by: profile.id,
          subject: "General Support",
          status: "open",
          channel_type: "live_chat",
          last_message_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    if (error) {
      message.error(error.message || "Failed to create conversation");
      return null;
    }
    setConversations((prev) => [data, ...prev]);
    setSelectedConversationId(data.id);
    return data.id;
  };

  const sendMessage = async () => {
    const body = chatText.trim();
    if (!body && !chatAttachment) return;
    if (!profile?.id || isLiveChatDisabled) return;
    let conversationId = selectedConversationId;
    if (!conversationId) {
      conversationId = await createOrGetConversation();
      if (!conversationId) return;
    }
    setSendingChat(true);
    try {
      let attachment = {
        attachment_url: null,
        attachment_name: null,
        attachment_size: null,
        attachment_type: null,
      };
      if (chatAttachment)
        attachment = await uploadSupportFile(chatAttachment, "support-chat");
      const { error } = await supabase
        .from("support_messages")
        .insert([
          {
            conversation_id: conversationId,
            sender_id: profile.id,
            content: body || null,
            ...attachment,
          },
        ]);
      if (error) throw error;
      await supabase
        .from("support_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
      setChatText("");
      setChatAttachment(null);
      await Promise.all([loadConversations(), loadMessages(conversationId)]);
      if (!isSuperadmin && body) {
        if (isEscalationTrigger(body)) {
          await escalateConversation(conversationId, body);
        } else {
          try {
            const aiReply = await groq(AI_SYSTEM_PROMPT, body);
            addAiMessage(
              conversationId,
              aiReply ||
                "Thanks for your message. I can help troubleshoot this. If you want a live agent at any time, just ask for one.",
            );
          } catch {
            addAiMessage(
              conversationId,
              "I am here to help. If you want a live support agent right now, type 'live agent' and I will escalate this conversation.",
            );
          }
        }
      }
    } catch (e) {
      message.error(e.message || "Failed to send");
    } finally {
      setSendingChat(false);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDescription.trim() || !profile?.id)
      return;
    setCreatingTicket(true);
    try {
      let attachment = {
        attachment_url: null,
        attachment_name: null,
        attachment_size: null,
        attachment_type: null,
      };
      if (ticketAttachment)
        attachment = await uploadSupportFile(
          ticketAttachment,
          "support-ticket",
        );
      const { error } = await supabase
        .from("support_tickets")
        .insert([
          {
            tenant_id: tenantId,
            submitted_by: profile.id,
            title: ticketTitle,
            description: ticketDescription,
            priority: ticketPriority,
            status: "open",
            source: "customer_support",
            ...attachment,
          },
        ]);
      if (error) throw error;
      setTicketTitle("");
      setTicketDescription("");
      setTicketPriority("medium");
      setTicketAttachment(null);
      setShowNewTicket(false);
      await loadTickets();
      message.success("Ticket submitted successfully");
    } catch (e2) {
      message.error(e2.message || "Failed to submit");
    } finally {
      setCreatingTicket(false);
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    setUpdatingTicket(ticketId);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", ticketId);
      if (error) throw error;
      await loadTickets();
      if (selectedTicket?.id === ticketId)
        setSelectedTicket((prev) => ({ ...(prev || {}), status }));
      message.success("Status updated");
    } catch (e) {
      message.error(e.message || "Failed");
    } finally {
      setUpdatingTicket(null);
    }
  };

  const closeSelectedConversation = async () => {
    if (!selectedConversationId) return;
    try {
      const { error } = await supabase
        .from("support_conversations")
        .update({ status: "closed", last_message_at: new Date().toISOString() })
        .eq("id", selectedConversationId);
      if (error) throw error;
      await Promise.all([
        loadConversations(),
        loadMessages(selectedConversationId),
      ]);
      message.success("Chat closed");
    } catch (e) {
      message.error(e.message || "Failed to close chat");
    }
  };

  const openTicketDetails = async (ticket) => {
    setSelectedTicket(ticket);
    setTicketReply("");
    setTicketReplyAttachment(null);
    setTicketDetailOpen(true);
    await loadTicketMessages(ticket.id);
  };

  const sendTicketReply = async () => {
    if (!selectedTicket?.id || !profile?.id) return;
    const body = ticketReply.trim();
    if (!body && !ticketReplyAttachment) return;
    setSendingTicketReply(true);
    try {
      let attachment = {
        attachment_url: null,
        attachment_name: null,
        attachment_size: null,
        attachment_type: null,
      };
      if (ticketReplyAttachment)
        attachment = await uploadSupportFile(
          ticketReplyAttachment,
          "support-ticket-reply",
        );
      const { error } = await supabase
        .from("support_ticket_messages")
        .insert([
          {
            ticket_id: selectedTicket.id,
            sender_id: profile.id,
            message: body || null,
            ...attachment,
          },
        ]);
      if (error) throw error;
      setTicketReply("");
      setTicketReplyAttachment(null);
      await Promise.all([loadTicketMessages(selectedTicket.id), loadTickets()]);
    } catch (e) {
      message.error(e.message || "Failed");
    } finally {
      setSendingTicketReply(false);
    }
  };

  /* ─── effects ─────────────────────────────────────────── */
  useEffect(() => {
    if (!canAccessSupport) return;
    loadConversations();
    loadTickets();
    loadLiveChatSetting().catch(() => {});
    loadSuperadmins().catch(() => {});
  }, [
    canAccessSupport,
    loadConversations,
    loadLiveChatSetting,
    loadSuperadmins,
    loadTickets,
  ]);

  useEffect(() => {
    if (!canAccessSupport) return;
    loadMessages(selectedConversationId).catch(() => {});
  }, [canAccessSupport, loadMessages, selectedConversationId]);

  useEffect(() => {
    if (!canAccessSupport || !profile?.id) return;
    const channel = supabase
      .channel(
        `support-center-${profile.id}-${selectedConversationId || "none"}`,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_conversations" },
        () => loadConversations(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        (payload) => {
          const cid =
            payload.new?.conversation_id || payload.old?.conversation_id;
          if (selectedConversationId && cid === selectedConversationId)
            loadMessages(selectedConversationId).catch(() => {});
          loadConversations();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => loadTickets(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_ticket_messages" },
        (payload) => {
          const tid = payload.new?.ticket_id || payload.old?.ticket_id;
          if (
            ticketDetailOpen &&
            selectedTicket?.id &&
            tid === selectedTicket.id
          )
            loadTicketMessages(selectedTicket.id).catch(() => {});
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_settings" },
        () => {
          loadLiveChatSetting().catch(() => {});
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    canAccessSupport,
    loadConversations,
    loadLiveChatSetting,
    loadMessages,
    loadTicketMessages,
    loadTickets,
    profile?.id,
    selectedConversationId,
    selectedTicket?.id,
    ticketDetailOpen,
  ]);

  useEffect(() => {
    if (chatBoxRef.current)
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [combinedThreadMessages]);

  if (!canAccessSupport) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: C.amberLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 24,
            }}
          >
            ⚠️
          </div>
          <Title level={4} style={{ marginBottom: 8 }}>
            Access Restricted
          </Title>
          <Text style={{ color: C.textSec }}>
            The Support Center is available for administrators only.
          </Text>
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
          <div
            style={{
              fontWeight: 600,
              color: C.text,
              fontSize: 13,
              marginBottom: 2,
            }}
          >
            {r.title}
          </div>
          <div style={{ fontSize: 11, color: C.textTer }}>
            {String(r.source || "ticket").replaceAll("_", " ")}
            {r.attachment_url ? " · has attachment" : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      render: (v) => <PriorityBadge priority={v} />,
      width: 110,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) => <StatusPill status={v} />,
      width: 120,
    },
    {
      title: "Submitted by",
      key: "by",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: C.accentLight,
              color: C.accent,
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {(r.submitted_by_profile?.full_name || "U")[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 13, color: C.text }}>
            {r.submitted_by_profile?.full_name || "User"}
          </span>
        </div>
      ),
      width: 160,
    },
    {
      title: "Date",
      dataIndex: "created_at",
      render: (v) => (
        <span style={{ fontSize: 12, color: C.textSec }}>{timeAgo(v)}</span>
      ),
      width: 100,
    },
    {
      title: "",
      key: "details",
      render: (_, r) => (
        <button
          onClick={() => openTicketDetails(r)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 12px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.bg,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            color: C.text,
            transition: "all .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.accent;
            e.currentTarget.style.color = C.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.text;
          }}
        >
          View <ArrowRightOutlined style={{ fontSize: 10 }} />
        </button>
      ),
      width: 80,
    },
  ];

  if (isSuperadmin) {
    ticketColumns.push({
      title: "Change Status",
      key: "action",
      render: (_, r) => (
        <div className="sc-status-seg">
          <Segmented
            size="small"
            options={[
              { label: "Open", value: "open" },
              { label: "In Progress", value: "in_progress" },
              { label: "Resolved", value: "resolved" },
              { label: "Closed", value: "closed" },
            ]}
            value={r.status}
            onChange={(next) => updateTicketStatus(r.id, next)}
            disabled={updatingTicket === r.id}
          />
        </div>
      ),
      width: 340,
    });
  }

  /* ─── render ─────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.surface,
        fontFamily: "inherit",
      }}
    >
      <GlobalStyles />

      {/* ── Header ── */}
      <div
        style={{
          borderBottom: `1px solid ${C.border}`,
          background: C.bg,
          padding: "0 32px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 0 rgba(0,0,0,.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 62,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accentHover} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(16,42,67,.3)",
              }}
            >
              <CustomerServiceOutlined
                style={{ color: "#fff", fontSize: 16 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: C.text,
                  lineHeight: 1.2,
                  letterSpacing: "-.01em",
                }}
              >
                Support Center
              </div>
              <div style={{ fontSize: 11, color: C.textSec }}>
                {isSuperadmin
                  ? "Superadmin view · all tenants"
                  : "Admin workspace"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isSuperadmin && view === "tickets" && (
              <button
                onClick={() => setShowNewTicket(!showNewTicket)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 16px",
                  borderRadius: 9,
                  border: "none",
                  background: C.accent,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(16,42,67,.25)",
                  transition: "all .15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.accentHover;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.accent;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <PlusOutlined style={{ fontSize: 12 }} /> New Ticket
              </button>
            )}
          </div>
        </div>

        {/* ── Nav tabs ── */}
        <div style={{ display: "flex", gap: 0 }}>
          {[
            {
              key: "chats",
              icon: <MessageOutlined />,
              label: "Chats",
              count: openChatCount,
            },
            {
              key: "tickets",
              icon: <FileTextOutlined />,
              label: "Tickets",
              count: openTicketsCount,
            },
            ...(isSuperadmin
              ? [
                  {
                    key: "settings",
                    icon: <SettingOutlined />,
                    label: "Settings",
                  },
                ]
              : []),
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: view === tab.key ? 700 : 400,
                color: view === tab.key ? C.accent : C.textSec,
                borderBottom: `2px solid ${view === tab.key ? C.accent : "transparent"}`,
                marginBottom: -1,
                transition: "all .15s",
              }}
            >
              {tab.icon} {tab.label}
              {tab.count > 0 && (
                <span
                  style={{
                    padding: "1px 7px",
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 700,
                    background: view === tab.key ? C.accent : C.surface,
                    color: view === tab.key ? "#fff" : C.textSec,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Metrics strip ── */}
      <div style={{ padding: "24px 32px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
          }}
        >
          <MetricCard
            icon={<MessageOutlined />}
            label="Active Chats"
            value={openChatCount}
            sub="Live conversations"
            accent={C.accentLight}
          />
          <MetricCard
            icon={<ClockCircleOutlined />}
            label="Open Tickets"
            value={openTicketsCount}
            sub="Awaiting response"
            accent={C.amberLight}
          />
          <MetricCard
            icon={<ThunderboltOutlined />}
            label="In Progress"
            value={inProgressCount}
            sub="Being handled"
            accent={C.purpleLight}
          />
          <MetricCard
            icon={<CheckCircleOutlined />}
            label="Resolved"
            value={resolvedTicketsCount}
            sub="Closed tickets"
            accent={C.greenLight}
          />
        </div>
      </div>

      {/* ── Disabled banner ── */}
      {isLiveChatDisabled && (
        <div
          style={{
            margin: "16px 32px 0",
            padding: "12px 16px",
            borderRadius: C.radius,
            background: C.amberLight,
            border: `1px solid #fcd34d`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ExclamationCircleOutlined style={{ color: C.amber, fontSize: 16 }} />
          <Text style={{ color: "#92400e", fontSize: 13 }}>
            Live chat is disabled for your workspace by your administrator.
            Submit a ticket instead.
          </Text>
        </div>
      )}

      {/* ════ TICKETS VIEW ════════════════════════════════ */}
      {view === "chats" && (
        <div style={{ padding: "20px 32px 100px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "330px minmax(0,1fr)",
              gap: 14,
              height: "calc(100vh - 210px)",
              minHeight: 560,
            }}
          >
            <div
              style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: C.radiusLg,
                boxShadow: C.shadow,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <div
                style={{
                  padding: "14px 14px 10px",
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  Live Conversations
                </Text>
                {!isSuperadmin && (
                  <button
                    onClick={async () => {
                      const id = await createOrGetConversation();
                      if (id) {
                        setSelectedConversationId(id);
                        loadConversations();
                      }
                    }}
                    disabled={isLiveChatDisabled}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      color: C.text,
                      fontSize: 12,
                      cursor: isLiveChatDisabled ? "not-allowed" : "pointer",
                      opacity: isLiveChatDisabled ? 0.6 : 1,
                    }}
                  >
                    + New Chat
                  </button>
                )}
              </div>
              <div
                className="sc-chat-scroll"
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  padding: 8,
                }}
              >
                {conversations.length === 0 ? (
                  <div style={{ padding: 16, color: C.textSec, fontSize: 12 }}>
                    No conversations yet.
                  </div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConversationId(c.id)}
                      className="sc-sidebar-item"
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        background:
                          selectedConversationId === c.id
                            ? C.accentLight
                            : "transparent",
                        borderRadius: 10,
                        padding: "10px 12px",
                        cursor: "pointer",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: C.text,
                            fontWeight: 600,
                            fontSize: 12,
                            maxWidth: 210,
                          }}
                          ellipsis
                        >
                          {c.subject || "Support Chat"}
                        </Text>
                        <StatusPill status={c.status} />
                      </div>
                      <Text style={{ color: C.textTer, fontSize: 11 }}>
                        {timeAgo(c.last_message_at || c.created_at)}
                      </Text>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div
              style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: C.radiusLg,
                boxShadow: C.shadow,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <div
                style={{
                  borderBottom: `1px solid ${C.border}`,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <Text style={{ color: C.textTer, fontSize: 11 }}>
                    Active thread
                  </Text>
                  <div style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>
                    {selectedConversation?.subject || "Select a conversation"}
                  </div>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {selectedConversation ? (
                    <StatusPill status={selectedConversation.status} />
                  ) : null}
                  {isSuperadmin ? (
                    <button
                      type="button"
                      onClick={closeSelectedConversation}
                      disabled={!selectedConversationId || selectedConversation?.status === "closed"}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.bg,
                        color: C.textSec,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor:
                          !selectedConversationId || selectedConversation?.status === "closed"
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          !selectedConversationId || selectedConversation?.status === "closed"
                            ? 0.6
                            : 1,
                      }}
                    >
                      Close Chat
                    </button>
                  ) : null}
                </div>
              </div>
              <div
                ref={chatBoxRef}
                className="sc-chat-scroll"
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  background: "#fafbfc",
                  padding: "14px 16px",
                }}
              >
                {!selectedConversationId ? (
                  <div style={{ color: C.textSec, fontSize: 12 }}>
                    Select a conversation to view messages.
                  </div>
                ) : combinedThreadMessages.length === 0 ? (
                  <div style={{ color: C.textSec, fontSize: 12 }}>
                    No messages yet. Send the first message.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {combinedThreadMessages.map((m) => {
                      const isAi = !!m.is_ai;
                      const mine = !isAi && m.sender_id === profile?.id;
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            justifyContent: mine ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "78%",
                              borderRadius: mine
                                ? "14px 14px 6px 14px"
                                : "14px 14px 14px 6px",
                              padding: "10px 12px",
                              background: mine ? C.accent : "#fff",
                              color: mine ? "#fff" : C.text,
                              border: mine ? "none" : `1px solid ${C.border}`,
                              fontSize: 12,
                              lineHeight: 1.55,
                            }}
                          >
                            {m.content}
                            {m.attachment_url ? (
                              <AttachmentChip
                                url={m.attachment_url}
                                name={m.attachment_name}
                                size={m.attachment_size}
                              />
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, padding: 12 }}>
                {chatAttachment && (
                  <div
                    style={{
                      marginBottom: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      background: C.accentLight,
                      borderRadius: 6,
                    }}
                  >
                    <PaperClipOutlined style={{ color: C.accent, fontSize: 11 }} />
                    <span style={{ fontSize: 12, color: C.accent }}>
                      {chatAttachment.name}
                    </span>
                    <button
                      onClick={() => setChatAttachment(null)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.textSec,
                      }}
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
                    padding: "9px 12px",
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
                    disabled={!selectedConversationId || sendingChat}
                  >
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.textSec,
                        padding: "2px 4px",
                      }}
                    >
                      <PaperClipOutlined style={{ fontSize: 15 }} />
                    </button>
                  </Upload>
                  <div className="sc-msg-input" style={{ flex: 1 }}>
                    <Input.TextArea
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder={
                        selectedConversationId
                          ? "Write a message…"
                          : "Select or start a conversation"
                      }
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      disabled={!selectedConversationId || sendingChat}
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
                    disabled={
                      !selectedConversationId ||
                      sendingChat ||
                      (!chatText.trim() && !chatAttachment)
                    }
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: "none",
                      background:
                        !chatText.trim() && !chatAttachment ? C.border : C.accent,
                      color:
                        !chatText.trim() && !chatAttachment ? C.textSec : "#fff",
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
          </div>
        </div>
      )}

      {view === "tickets" && (
        <div style={{ padding: "20px 32px 100px" }}>
          {/* New ticket form */}
          {!isSuperadmin && showNewTicket && false && (
            <div
              style={{
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: C.radiusLg,
                padding: 24,
                marginBottom: 20,
                boxShadow: C.shadowMd,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div>
                  <Title level={5} style={{ margin: 0, color: C.text }}>
                    Create New Ticket
                  </Title>
                  <Text style={{ fontSize: 12, color: C.textSec }}>
                    Describe your issue and we'll get back to you
                  </Text>
                </div>
                <button
                  onClick={() => setShowNewTicket(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.textSec,
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={createTicket}>
                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.textSec,
                        display: "block",
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                      }}
                    >
                      Subject
                    </label>
                    <div className="sc-input">
                      <Input
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                        placeholder="Brief description of your issue"
                        required
                        size="large"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.textSec,
                        display: "block",
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                      }}
                    >
                      Description
                    </label>
                    <div className="sc-textarea">
                      <Input.TextArea
                        rows={4}
                        value={ticketDescription}
                        onChange={(e) => setTicketDescription(e.target.value)}
                        placeholder="Provide as much detail as possible…"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.textSec,
                        display: "block",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: ".05em",
                      }}
                    >
                      Priority
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
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
                              color:
                                ticketPriority === p ? cfg.color : C.textSec,
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
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <Upload
                      beforeUpload={(file) => {
                        setTicketAttachment(file);
                        return false;
                      }}
                      showUploadList={false}
                      maxCount={1}
                    >
                      <button
                        type="button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "7px 14px",
                          borderRadius: 8,
                          border: `1px solid ${C.border}`,
                          background: C.surface,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500,
                          color: C.textSec,
                        }}
                      >
                        <PaperClipOutlined /> Attach file
                      </button>
                    </Upload>
                    {ticketAttachment && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 10px",
                          background: C.accentLight,
                          borderRadius: 6,
                        }}
                      >
                        <PaperClipOutlined
                          style={{ color: C.accent, fontSize: 11 }}
                        />
                        <span style={{ fontSize: 12, color: C.accent }}>
                          {ticketAttachment.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTicketAttachment(null)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: C.textSec,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={creatingTicket}
                      style={{
                        marginLeft: "auto",
                        padding: "8px 20px",
                        borderRadius: 8,
                        border: "none",
                        background: C.accent,
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {creatingTicket ? (
                        "Submitting…"
                      ) : (
                        <>
                          <CheckOutlined /> Submit Ticket
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              gap: 12,
            }}
          >
            <div>
              <Title
                level={5}
                style={{ margin: 0, color: C.text, fontWeight: 700 }}
              >
                {isSuperadmin ? "All Support Tickets" : "Your Tickets"}
              </Title>
              <Text style={{ fontSize: 12, color: C.textSec }}>
                {filteredTickets.length} ticket
                {filteredTickets.length !== 1 ? "s" : ""}
              </Text>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* Status filter pills */}
              <div style={{ display: "flex", gap: 4 }}>
                {[
                  { value: "all", label: "All" },
                  { value: "open", label: "Open" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "resolved", label: "Resolved" },
                  { value: "closed", label: "Closed" },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setTicketStatusFilter(f.value)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 7,
                      border: `1px solid ${ticketStatusFilter === f.value ? C.accent : C.border}`,
                      background:
                        ticketStatusFilter === f.value ? C.accentLight : C.bg,
                      color:
                        ticketStatusFilter === f.value ? C.accent : C.textSec,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: ticketStatusFilter === f.value ? 600 : 400,
                      transition: "all .15s",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="sc-input" style={{ width: 220 }}>
                <Input
                  prefix={<SearchOutlined style={{ color: C.textTer }} />}
                  placeholder="Search tickets…"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div
            className="sc-table"
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusLg,
              overflow: "hidden",
              boxShadow: C.shadow,
            }}
          >
            <Table
              rowKey="id"
              columns={ticketColumns}
              dataSource={filteredTickets}
              loading={loadingTickets}
              pagination={{ pageSize: 10, style: { padding: "12px 20px" } }}
              onRow={() => ({})}
              locale={{
                emptyText: (
                  <div style={{ padding: "48px 20px", textAlign: "center" }}>
                    <FileTextOutlined
                      style={{
                        fontSize: 36,
                        color: C.textTer,
                        marginBottom: 12,
                        display: "block",
                      }}
                    />
                    <Text
                      style={{
                        color: C.textSec,
                        fontSize: 14,
                        fontWeight: 500,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      No tickets found
                    </Text>
                    <Text style={{ color: C.textTer, fontSize: 12 }}>
                      Create a new ticket using the button above
                    </Text>
                  </div>
                ),
              }}
            />
          </div>
        </div>
      )}

      {/* ════ SETTINGS VIEW (superadmin) ═════════════════ */}
      {view === "settings" && isSuperadmin && (
        <div style={{ padding: "24px 32px", maxWidth: 580 }}>
          <Title level={5} style={{ marginBottom: 4, fontWeight: 800 }}>
            Platform Settings
          </Title>
          <Text
            style={{
              color: C.textSec,
              display: "block",
              marginBottom: 24,
              fontSize: 13,
            }}
          >
            Control live chat availability across the entire platform.
          </Text>

          <div
            style={{
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusLg,
              overflow: "hidden",
              boxShadow: C.shadow,
            }}
          >
            <div
              style={{
                padding: "22px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 4,
                  }}
                >
                  <MessageOutlined
                    style={{
                      color: liveChatEnabled ? C.accent : C.textSec,
                      fontSize: 16,
                    }}
                  />
                  <Text
                    style={{ fontWeight: 700, color: C.text, fontSize: 14 }}
                  >
                    Live Chat
                  </Text>
                </div>
                <Text
                  style={{ color: C.textSec, fontSize: 13, lineHeight: 1.5 }}
                >
                  When enabled, all admin users across every workspace can use
                  live chat to contact support.
                </Text>
              </div>
              <Switch
                checked={liveChatEnabled}
                onChange={toggleLiveChatSetting}
                loading={savingLiveChatSetting || loadingLiveChatSetting}
                style={{ flexShrink: 0 }}
              />
            </div>
            <div
              style={{
                padding: "14px 24px",
                background: liveChatEnabled ? C.greenLight : C.surface,
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: liveChatEnabled ? C.green : C.textTer,
                  boxShadow: liveChatEnabled
                    ? `0 0 0 3px ${C.greenLight}`
                    : "none",
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  color: liveChatEnabled ? C.green : C.textSec,
                  fontWeight: 500,
                }}
              >
                Live chat is{" "}
                <strong>{liveChatEnabled ? "enabled" : "disabled"}</strong> for
                all users platform-wide
              </Text>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              padding: "14px 18px",
              background: C.surface,
              borderRadius: C.radius,
              border: `1px solid ${C.border}`,
              display: "flex",
              gap: 10,
            }}
          >
            <ExclamationCircleOutlined
              style={{
                color: C.textSec,
                fontSize: 14,
                marginTop: 1,
                flexShrink: 0,
              }}
            />
            <Text style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
              This is a global setting that affects all tenants and admin
              accounts simultaneously. Changes take effect immediately.
            </Text>
          </div>
        </div>
      )}

      {!isSuperadmin && (
        <Modal
          open={showNewTicket}
          onCancel={() => setShowNewTicket(false)}
          footer={null}
          title={null}
          width={760}
          destroyOnClose={false}
        >
          <div style={{ padding: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div>
                <Title level={5} style={{ margin: 0, color: C.text }}>
                  Create New Ticket
                </Title>
                <Text style={{ fontSize: 12, color: C.textSec }}>
                  Describe your issue and we&apos;ll get back to you
                </Text>
              </div>
            </div>

            <form onSubmit={createTicket}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.textSec,
                      display: "block",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                    }}
                  >
                    Subject
                  </label>
                  <div className="sc-input">
                    <Input
                      value={ticketTitle}
                      onChange={(e) => setTicketTitle(e.target.value)}
                      placeholder="Brief description of your issue"
                      required
                      size="large"
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.textSec,
                      display: "block",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                    }}
                  >
                    Description
                  </label>
                  <div className="sc-textarea">
                    <Input.TextArea
                      rows={5}
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Provide as much detail as possible..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.textSec,
                      display: "block",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                    }}
                  >
                    Priority
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
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

                <div
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <Upload
                    beforeUpload={(file) => {
                      setTicketAttachment(file);
                      return false;
                    }}
                    showUploadList={false}
                    maxCount={1}
                  >
                    <button
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.surface,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                        color: C.textSec,
                      }}
                    >
                      <PaperClipOutlined /> Attach file
                    </button>
                  </Upload>
                  {ticketAttachment && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 10px",
                        background: C.accentLight,
                        borderRadius: 6,
                      }}
                    >
                      <PaperClipOutlined
                        style={{ color: C.accent, fontSize: 11 }}
                      />
                      <span style={{ fontSize: 12, color: C.accent }}>
                        {ticketAttachment.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTicketAttachment(null)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: C.textSec,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowNewTicket(false)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                      background: C.bg,
                      color: C.textSec,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTicket}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: C.accent,
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {creatingTicket ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ════ TICKET DETAIL MODAL ═══════════════════════ */}
      <Modal
        open={ticketDetailOpen}
        onCancel={() => setTicketDetailOpen(false)}
        footer={null}
        title={null}
        width={780}
        className="sc-modal"
        destroyOnClose
      >
        {selectedTicket && (
          <div>
            {/* Modal header */}
            <div
              style={{
                padding: "22px 26px 18px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: 800,
                      fontSize: 16,
                      color: C.text,
                      display: "block",
                      marginBottom: 10,
                      letterSpacing: "-.01em",
                    }}
                  >
                    {selectedTicket.title}
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <PriorityBadge priority={selectedTicket.priority} />
                    <StatusPill status={selectedTicket.status} />
                    <span style={{ fontSize: 12, color: C.textTer }}>
                      Created {timeAgo(selectedTicket.created_at)}
                    </span>
                    {selectedTicket.submitted_by_profile?.full_name && (
                      <span style={{ fontSize: 12, color: C.textSec }}>
                        by{" "}
                        <strong>
                          {selectedTicket.submitted_by_profile.full_name}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isSuperadmin && (
                <div style={{ display: "flex", gap: 6 }}>
                  {["open", "in_progress", "resolved", "closed"].map((s) => {
                    const cfg = statusConfig[s];
                    const active = selectedTicket.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => updateTicketStatus(selectedTicket.id, s)}
                        disabled={updatingTicket === selectedTicket.id}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 7,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all .15s",
                          border: `1.5px solid ${active ? cfg.color : C.border}`,
                          background: active ? cfg.bg : C.bg,
                          color: active ? cfg.color : C.textSec,
                        }}
                      >
                        {active && (
                          <CheckOutlined
                            style={{ marginRight: 4, fontSize: 10 }}
                          />
                        )}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Two-column body */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 260px",
                minHeight: 480,
              }}
            >
              {/* Replies */}
              <div
                style={{
                  borderRight: `1px solid ${C.border}`,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    maxHeight: 360,
                    background: "#fafbfc",
                  }}
                >
                  {loadingTicketMessages ? (
                    <div style={{ textAlign: "center", padding: 20 }}>
                      <Text style={{ color: C.textSec }}>Loading replies…</Text>
                    </div>
                  ) : ticketMessages.length === 0 ? (
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 8,
                        padding: 40,
                      }}
                    >
                      <div style={{ fontSize: 28 }}>💬</div>
                      <Text style={{ color: C.textSec, fontSize: 13 }}>
                        No replies yet. Add the first reply below.
                      </Text>
                    </div>
                  ) : (
                    ticketMessages.map((r) => {
                      const mine = r.sender_id === profile?.id;
                      return (
                        <div
                          key={r.id}
                          style={{
                            display: "flex",
                            justifyContent: mine ? "flex-end" : "flex-start",
                            alignItems: "flex-end",
                            gap: 8,
                          }}
                        >
                          {!mine && (
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: C.surface,
                                border: `1px solid ${C.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                                color: C.textSec,
                                flexShrink: 0,
                              }}
                            >
                              {(r.sender?.full_name || "S")[0].toUpperCase()}
                            </div>
                          )}
                          <div style={{ maxWidth: "72%" }}>
                            <div
                              style={{
                                fontSize: 11,
                                color: C.textTer,
                                marginBottom: 3,
                                textAlign: mine ? "right" : "left",
                              }}
                            >
                              {r.sender?.full_name || "User"}
                            </div>
                            <div
                              style={{
                                padding: "10px 14px",
                                borderRadius: mine
                                  ? "14px 14px 4px 14px"
                                  : "14px 14px 14px 4px",
                                background: mine ? C.accent : "#fff",
                                color: mine ? "#fff" : C.text,
                                fontSize: 13,
                                lineHeight: 1.5,
                                border: mine ? "none" : `1px solid ${C.border}`,
                                boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                              }}
                            >
                              {r.message && <div>{r.message}</div>}
                              {r.attachment_url && (
                                <AttachmentChip
                                  url={r.attachment_url}
                                  name={r.attachment_name}
                                  size={r.attachment_size}
                                />
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: C.textTer,
                                marginTop: 3,
                                textAlign: mine ? "right" : "left",
                              }}
                            >
                              {timeAgo(r.created_at)}
                            </div>
                          </div>
                          {mine && (
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: C.accent,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#fff",
                                flexShrink: 0,
                              }}
                            >
                              {(profile?.full_name || "Y")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply input */}
                <div
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    padding: "12px 20px",
                    background: C.bg,
                  }}
                >
                  {ticketReplyAttachment && (
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
                      <PaperClipOutlined
                        style={{ color: C.accent, fontSize: 11 }}
                      />
                      <span style={{ fontSize: 12, color: C.accent }}>
                        {ticketReplyAttachment.name}
                      </span>
                      <button
                        onClick={() => setTicketReplyAttachment(null)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: C.textSec,
                        }}
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
                      padding: "9px 12px",
                      background: C.surface,
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <Upload
                      beforeUpload={(file) => {
                        setTicketReplyAttachment(file);
                        return false;
                      }}
                      showUploadList={false}
                      maxCount={1}
                    >
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: C.textSec,
                          padding: "2px 4px",
                        }}
                      >
                        <PaperClipOutlined style={{ fontSize: 15 }} />
                      </button>
                    </Upload>
                    <div className="sc-msg-input" style={{ flex: 1 }}>
                      <Input.TextArea
                        value={ticketReply}
                        onChange={(e) => setTicketReply(e.target.value)}
                        placeholder="Write a reply…"
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        onPressEnter={(e) => {
                          if (!e.shiftKey) {
                            e.preventDefault();
                            sendTicketReply();
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
                      onClick={sendTicketReply}
                      disabled={
                        sendingTicketReply ||
                        (!ticketReply.trim() && !ticketReplyAttachment)
                      }
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "none",
                        background:
                          !ticketReply.trim() && !ticketReplyAttachment
                            ? C.border
                            : C.accent,
                        color:
                          !ticketReply.trim() && !ticketReplyAttachment
                            ? C.textSec
                            : "#fff",
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

              {/* Ticket info sidebar */}
              <div
                style={{
                  padding: "18px 20px",
                  overflowY: "auto",
                  background: C.bg,
                }}
              >
                <div style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.textTer,
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                      display: "block",
                      marginBottom: 10,
                    }}
                  >
                    Description
                  </Text>
                  <div
                    style={{
                      fontSize: 13,
                      color: C.text,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      background: C.surface,
                      borderRadius: 10,
                      padding: "12px 14px",
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    {selectedTicket.description}
                  </div>
                  {selectedTicket.attachment_url && (
                    <div style={{ marginTop: 8 }}>
                      <AttachmentChip
                        url={selectedTicket.attachment_url}
                        name={selectedTicket.attachment_name}
                        size={selectedTicket.attachment_size}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 14 }}>
                  {[
                    {
                      label: "Status",
                      value: <StatusPill status={selectedTicket.status} />,
                    },
                    {
                      label: "Priority",
                      value: (
                        <PriorityBadge priority={selectedTicket.priority} />
                      ),
                    },
                    {
                      label: "Source",
                      value: (
                        <span style={{ fontSize: 12, color: C.textSec }}>
                          {String(selectedTicket.source || "—").replaceAll(
                            "_",
                            " ",
                          )}
                        </span>
                      ),
                    },
                    {
                      label: "Created",
                      value: (
                        <span style={{ fontSize: 12, color: C.textSec }}>
                          {new Date(selectedTicket.created_at).toLocaleString()}
                        </span>
                      ),
                    },
                    ...(selectedTicket.submitted_by_profile?.email
                      ? [
                          {
                            label: "Email",
                            value: (
                              <span style={{ fontSize: 12, color: C.textSec }}>
                                {selectedTicket.submitted_by_profile.email}
                              </span>
                            ),
                          },
                        ]
                      : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.textTer,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                          display: "block",
                          marginBottom: 5,
                        }}
                      >
                        {label}
                      </Text>
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ════ FLOATING CHAT WIDGET ═══════════════════════ */}
    </div>
  );
};

export default SupportCenter;
