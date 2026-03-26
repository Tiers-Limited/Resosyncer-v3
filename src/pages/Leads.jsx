import { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  message,
  Select,
  Input,
  Avatar,
  Drawer,
  Modal,
  Popover,
  Skeleton,
  Switch,
  TimePicker,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  GlobalOutlined,
  CloseOutlined,
  DeleteOutlined,
  InboxOutlined,
  EyeOutlined,
  RiseOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  SyncOutlined,
  FireOutlined,
  SettingOutlined,
  BellOutlined,
} from "@ant-design/icons";
import {
  Globe,
  Users,
  Smartphone,
  Phone,
  Mail,
  Briefcase,
  Monitor,
  MessageCircle,
  ClipboardList,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const { TextArea } = Input;

// ── Env ───────────────────────────────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

// ── Groq ──────────────────────────────────────────────────────────────────
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
  return data.choices[0].message.content.trim();
};

// ── Email ─────────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, body, companyName }) => {
  try {
    const res = await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html: body, companyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Email failed:", data);
      return { success: false, error: data };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Email error:", err);
    return { success: false, error: err.message };
  }
};

// ── Simple clean followup email template ─────────────────────────────────
const followupEmailTemplate = ({
  leadName,
  message,
  senderName,
  companyName,
  dashboardUrl,
}) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Follow-up Reminder</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">
        <tr><td style="padding:0 0 24px;">
          <span style="font-size:14px;font-weight:700;color:#111827;letter-spacing:-0.2px;">${companyName || "Resosyncer"}</span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:6px;border:1px solid #e5e7eb;padding:36px 40px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">Follow-up Reminder</p>
          <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">${leadName}</h2>
          <div style="height:1px;background:#f3f4f6;margin:0 0 20px;"></div>
          <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-line;">${message}</p>
          <div style="height:1px;background:#f3f4f6;margin:0 0 24px;"></div>
          <a href="${dashboardUrl}" style="display:inline-block;background:#111827;color:#ffffff;font-size:13px;font-weight:600;padding:10px 22px;border-radius:5px;text-decoration:none;">View Lead</a>
        </td></tr>
        <tr><td style="padding:24px 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Sent by ${senderName} · ${companyName || "Resosyncer"}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Config ────────────────────────────────────────────────────────────────
const AVAILABLE_ICONS = [
  "👤",
  "👨",
  "👩",
  "👔",
  "💼",
  "🏢",
  "🏭",
  "🏪",
  "🏬",
  "🛍️",
  "💻",
  "📱",
  "🖥️",
  "⌨️",
  "🖱️",
  "🎯",
  "📊",
  "📈",
  "💰",
  "💵",
  "🌐",
  "🌍",
  "🌎",
  "🌏",
  "🗺️",
  "📍",
  "🚀",
  "✈️",
  "🎨",
  "🎭",
  "⭐",
  "🌟",
  "💫",
  "✨",
  "🔥",
  "💡",
  "🎪",
  "🎬",
  "📺",
  "📻",
  "📞",
  "☎️",
  "📧",
  "✉️",
  "📮",
  "🔔",
  "🎁",
  "🎉",
  "🎊",
  "🎈",
];

const STATUS_CFG = {
  in_progress: {
    label: "In Progress",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: <SyncOutlined style={{ fontSize: 10 }} />,
  },
  closed: {
    label: "Closed",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    icon: <CheckCircleFilled style={{ fontSize: 10 }} />,
  },
  not_closed: {
    label: "Not Closed",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
    icon: <CloseCircleFilled style={{ fontSize: 10 }} />,
  },
};
const SOURCE_CFG = {
  website: { label: "Website", icon: <Globe size={13} /> },
  referral: { label: "Referral", icon: <Users size={13} /> },
  social_media: { label: "Social Media", icon: <Smartphone size={13} /> },
  cold_call: { label: "Cold Call", icon: <Phone size={13} /> },
  email: { label: "Email", icon: <Mail size={13} /> },
  fiverr: { label: "Fiverr", icon: <Briefcase size={13} /> },
  upwork: { label: "Upwork", icon: <Monitor size={13} /> },
  whatsapp: { label: "WhatsApp", icon: <MessageCircle size={13} /> },
  other: { label: "Other", icon: <ClipboardList size={13} /> },
};

const pctColor = (v) => (v >= 75 ? "#059669" : v >= 40 ? "#d97706" : "#e11d48");
const pctBg = (v) => (v >= 75 ? "#ecfdf5" : v >= 40 ? "#fffbeb" : "#fff1f2");
const pctBord = (v) => (v >= 75 ? "#a7f3d0" : v >= 40 ? "#fde68a" : "#fecdd3");

// ── Main Component ────────────────────────────────────────────────────────
const Leads = () => {
  const { profile } = useAuth();
  const [tenantId, setTenantId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  // Local optimistic state for inline edits — keyed by lead.id
  const [localEdits, setLocalEdits] = useState({});
  const saveTimers = useRef({});

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: p } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
        setTenantId(p?.tenant_id ?? null);
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (tenantId) fetchLeads();
  }, [tenantId, showArchived]);

  useEffect(() => {
    const merged = leads.map((l) => ({ ...l, ...(localEdits[l.id] || {}) }));
    let res = [...merged];
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.remarks?.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all")
      res = res.filter((l) => l.status === statusFilter);
    setFiltered(res);
    setCurrentPage(1); // reset to page 1 on any filter change
  }, [leads, localEdits, search, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_archived", showArchived)
        .order("closing_percentage", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLeads(data || []);
      setLocalEdits({}); // clear local overrides on fresh fetch
    } catch {
      message.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  // Optimistic inline edit — updates UI immediately, debounces DB write per field per lead
  const handleInlineEdit = (id, field, value) => {
    // 1. Update local optimistic state immediately (instant UI)
    setLocalEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));

    // 2. Debounce the actual DB save (300ms per lead+field combo)
    const key = `${id}__${field}`;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      const { error } = await supabase
        .from("leads")
        .update({ [field]: value })
        .eq("id", id);
      if (error) {
        message.error("Failed to save");
        // Roll back on error
        setLocalEdits((prev) => {
          const next = { ...prev };
          if (next[id]) {
            delete next[id][field];
            if (!Object.keys(next[id]).length) delete next[id];
          }
          return next;
        });
      }
    }, 300);
  };

  const handleArchive = async (id, archive) => {
    if (archive) {
      Modal.confirm({
        title: "Archive Lead",
        content: "Hidden from main view but can be restored.",
        okText: "Archive",
        onOk: async () => {
          await supabase
            .from("leads")
            .update({ is_archived: true })
            .eq("id", id);
          message.success("Archived");
          setDrawerOpen(false);
          fetchLeads();
        },
      });
    } else {
      await supabase.from("leads").update({ is_archived: false }).eq("id", id);
      message.success("Restored");
      setDrawerOpen(false);
      fetchLeads();
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Lead",
      content: "This is permanent and cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        await supabase.from("leads").delete().eq("id", id);
        message.success("Deleted");
        setDrawerOpen(false);
        fetchLeads();
      },
    });
  };

  // Get merged lead value (local edit takes priority)
  const getVal = (lead, field) =>
    localEdits[lead.id]?.[field] !== undefined
      ? localEdits[lead.id][field]
      : lead[field];

  const stats = {
    total: filtered.length,
    inProgress: filtered.filter((l) => l.status === "in_progress").length,
    closed: filtered.filter((l) => l.status === "closed").length,
    avgPct: filtered.length
      ? Math.round(
          filtered.reduce((s, l) => s + (l.closing_percentage || 0), 0) /
            filtered.length,
        )
      : 0,
    hot: filtered.filter((l) => (l.closing_percentage || 0) >= 75).length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.2s ease forwards; }
        .lead-row { transition: background 0.1s; }
        .lead-row:hover { background: #f8fafc !important; }
        .lead-row td { vertical-align:middle; border-bottom:1px solid #f1f5f9; }
        .lead-row:last-child td { border-bottom:none; }
        .ghost-input { border:none!important;background:transparent!important;box-shadow:none!important;padding:4px 6px!important;font-size:13px!important;color:#0f172a!important;border-radius:6px!important;transition:background 0.1s; }
        .ghost-input:hover,.ghost-input:focus { background:#f1f5f9!important; }
        .ghost-textarea { border:none!important;background:transparent!important;box-shadow:none!important;padding:4px 6px!important;font-size:12px!important;color:#475569!important;border-radius:6px!important;resize:none!important;transition:background 0.1s; }
        .ghost-textarea:hover,.ghost-textarea:focus { background:#f1f5f9!important; }
        .ghost-select .ant-select-selector { border:none!important;background:transparent!important;box-shadow:none!important;padding:0!important; }
        .ghost-select:hover .ant-select-selector { background:#f1f5f9!important;border-radius:6px!important; }
        .stat-tile { transition:transform 0.12s,box-shadow 0.12s; }
        .stat-tile:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(15,23,42,0.08)!important; }
        .ld-drawer .ant-drawer-content { border-radius:20px 0 0 20px!important; }
        .ld-drawer .ant-drawer-header { padding:20px 26px 16px!important;border-bottom:1px solid #f1f5f9!important; }
        .ld-drawer .ant-drawer-body { padding:22px 26px!important; }
        .form-field .ant-input,.form-field textarea,.form-select .ant-select-selector { border-radius:9px!important;border:1.5px solid #e2e8f0!important;background:#f8fafc!important;font-size:13px!important;transition:all 0.15s; }
        .form-field .ant-input:focus,.form-field textarea:focus { border-color:#0f172a!important;background:#fff!important;box-shadow:0 0 0 3px rgba(15,23,42,0.05)!important; }
        .form-select .ant-select-selector { height:auto!important;padding:7px 12px!important; }
        .search-wrap .ant-input-affix-wrapper { border-radius:10px!important;border:1.5px solid #e2e8f0!important;background:#fff!important;padding:8px 14px!important;font-size:13px!important; }
        .search-wrap .ant-input-affix-wrapper:focus-within { border-color:#0f172a!important;box-shadow:0 0 0 3px rgba(15,23,42,0.05)!important; }
        .filter-sel .ant-select-selector { border-radius:10px!important;border:1.5px solid #e2e8f0!important;background:#fff!important;height:auto!important;padding:7px 12px!important; }
        .pct-bar { height:3px;background:#e2e8f0;border-radius:99px;margin-top:3px;overflow:hidden; }
        .pct-fill { height:100%;border-radius:99px;transition:width 0.4s ease; }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ai-shimmer { animation:shimmer 1.4s ease infinite; }
        .ai-panel { background:#f8faff;border:1.5px solid #c7d2fe;border-radius:12px;padding:16px;margin-top:4px; }
        .ai-action-btn { display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;border:1.5px solid #c7d2fe;background:#fff;cursor:pointer;font-size:12px;font-weight:700;color:#4338ca;transition:all 0.15s; }
        .ai-action-btn:hover { background:#4338ca;color:#fff;border-color:#4338ca; }
        .ai-action-btn:disabled { opacity:0.5;cursor:not-allowed; }
        .ai-action-btn.secondary { color:#64748b;border-color:#e2e8f0;background:#f8fafc; }
        .ai-action-btn.secondary:hover { background:#0f172a;color:#fff;border-color:#0f172a; }
        .followup-box { background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:14px;font-size:13px;color:#1e293b;line-height:1.75;white-space:pre-wrap;position:relative;margin-top:10px; }
        .copy-btn { position:absolute;top:10px;right:10px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:7px;padding:4px 10px;font-size:11px;font-weight:700;color:#64748b;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.1s; }
        .copy-btn:hover { background:#0f172a;color:#fff;border-color:#0f172a; }
        .insight-chip { display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700; }
        .settings-row { display:flex;align-items:flex-start;justify-content:space-between;padding:18px 0;border-bottom:1px solid #f1f5f9; }
        .settings-row:last-child { border-bottom:none; }
      `}</style>

      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #f1f5f9",
          padding: "20px 32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 18,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 3,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#0f172a",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Sales
              </span>
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: -0.5,
              }}
            >
              Leads Pipeline
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {profile?.role === "admin" && (
              <Button
                icon={<SettingOutlined />}
                onClick={() => setSettingsOpen(true)}
                style={{
                  height: 38,
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 13,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                }}
              >
                Settings
              </Button>
            )}
            <Button
              icon={<InboxOutlined />}
              onClick={() => setShowArchived(!showArchived)}
              style={{
                height: 38,
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 13,
                border: "1.5px solid #e2e8f0",
                background: showArchived ? "#0f172a" : "#fff",
                color: showArchived ? "#fff" : "#475569",
              }}
            >
              {showArchived ? "Active" : "Archived"}
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingLead(null);
                setDrawerOpen(true);
              }}
              style={{
                height: 38,
                paddingInline: 20,
                borderRadius: 10,
                background: "#0f172a",
                border: "none",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                boxShadow: "0 4px 14px rgba(15,23,42,0.22)",
              }}
            >
              New Lead
            </Button>
          </div>
        </div>

        {/* Stat tiles */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              label: "Total",
              value: stats.total,
              color: "#0f172a",
              bg: "#f8fafc",
              border: "#e2e8f0",
              icon: <GlobalOutlined />,
            },
            {
              label: "In Progress",
              value: stats.inProgress,
              ...STATUS_CFG.in_progress,
              icon: <SyncOutlined />,
            },
            {
              label: "Closed",
              value: stats.closed,
              ...STATUS_CFG.closed,
              icon: <CheckCircleFilled />,
            },
            {
              label: "Hot Leads",
              value: stats.hot,
              color: "#dc2626",
              bg: "#fff1f2",
              border: "#fecdd3",
              icon: <FireOutlined />,
            },
            {
              label: "Avg Close %",
              value: `${stats.avgPct}%`,
              color: pctColor(stats.avgPct),
              bg: pctBg(stats.avgPct),
              border: pctBord(stats.avgPct),
              icon: <RiseOutlined />,
            },
          ].map(({ label, value, color, bg, border, icon }) => (
            <div
              key={label}
              className="stat-tile"
              style={{
                flex: "1 1 110px",
                minWidth: 100,
                padding: "12px 16px",
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: bg,
                boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 6,
                }}
              >
                <span style={{ color, fontSize: 11 }}>{icon}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {label}
                </span>
              </div>
              <div
                style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Search leads…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>
          <Select
            className="filter-sel"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 168 }}
            options={[
              { label: "All Statuses", value: "all" },
              { label: "↻ In Progress", value: "in_progress" },
              { label: "✓ Closed", value: "closed" },
              { label: "✕ Not Closed", value: "not_closed" },
            ]}
          />
          <span
            style={{
              fontSize: 12,
              color: "#94a3b8",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: "20px 32px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #f1f5f9",
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
          }}
        >
          {loading ? (
            <div style={{ padding: 28 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    marginBottom: 18,
                  }}
                >
                  <Skeleton.Avatar active size={34} />
                  <Skeleton
                    active
                    paragraph={{ rows: 1 }}
                    style={{ flex: 1 }}
                  />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 0" }}>
              <GlobalOutlined
                style={{
                  fontSize: 30,
                  color: "#e2e8f0",
                  display: "block",
                  margin: "0 auto 10px",
                }}
              />
              <span style={{ color: "#94a3b8", fontSize: 14 }}>
                No leads found
              </span>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background: "#f9fafb",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    {[
                      "",
                      "Lead",
                      "Remarks",
                      "Last Followup",
                      "Status",
                      "Source",
                      "Close %",
                      "Added",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice(
                      (currentPage - 1) * PAGE_SIZE,
                      currentPage * PAGE_SIZE,
                    )
                    .map((lead, idx) => {
                      const sc =
                        STATUS_CFG[getVal(lead, "status")] ||
                        STATUS_CFG.not_closed;
                      const src =
                        SOURCE_CFG[getVal(lead, "source")] || SOURCE_CFG.other;
                      const pct = getVal(lead, "closing_percentage") || 0;
                      return (
                        <tr
                          key={lead.id}
                          className="lead-row fade-up"
                          style={{ animationDelay: `${idx * 0.025}s` }}
                        >
                          {/* Eye */}
                          <td
                            style={{ padding: "10px 8px 10px 14px", width: 36 }}
                          >
                            <button
                              onClick={() => {
                                setEditingLead(lead);
                                setDrawerOpen(true);
                              }}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                border: "1px solid #e2e8f0",
                                background: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#94a3b8",
                                transition: "all 0.1s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#0f172a";
                                e.currentTarget.style.color = "#fff";
                                e.currentTarget.style.borderColor = "#0f172a";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#fff";
                                e.currentTarget.style.color = "#94a3b8";
                                e.currentTarget.style.borderColor = "#e2e8f0";
                              }}
                            >
                              <EyeOutlined style={{ fontSize: 11 }} />
                            </button>
                          </td>

                          {/* Lead name */}
                          <td style={{ padding: "10px 14px", minWidth: 190 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                              }}
                            >
                              <Popover
                                trigger="click"
                                title={
                                  <span
                                    style={{ fontSize: 12, fontWeight: 700 }}
                                  >
                                    Pick Icon
                                  </span>
                                }
                                content={
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(8,1fr)",
                                      gap: 4,
                                      width: 252,
                                    }}
                                  >
                                    {AVAILABLE_ICONS.map((ic) => (
                                      <button
                                        key={ic}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleInlineEdit(lead.id, "icon", ic);
                                        }}
                                        style={{
                                          width: 28,
                                          height: 28,
                                          borderRadius: 6,
                                          border: "none",
                                          background:
                                            getVal(lead, "icon") === ic
                                              ? "#f1f5f9"
                                              : "transparent",
                                          cursor: "pointer",
                                          fontSize: 16,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        {ic}
                                      </button>
                                    ))}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleInlineEdit(lead.id, "icon", "");
                                      }}
                                      style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 6,
                                        border: "1px dashed #e2e8f0",
                                        background: "transparent",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#94a3b8",
                                      }}
                                    >
                                      <CloseOutlined style={{ fontSize: 9 }} />
                                    </button>
                                  </div>
                                }
                              >
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 9,
                                    flexShrink: 0,
                                    background: getVal(lead, "icon")
                                      ? "#f1f5f9"
                                      : "linear-gradient(135deg,#0f172a,#334155)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    fontSize: 17,
                                    border: "1.5px solid #e8edf4",
                                  }}
                                >
                                  {getVal(lead, "icon") ? (
                                    getVal(lead, "icon")
                                  ) : (
                                    <UserOutlined
                                      style={{ fontSize: 13, color: "#fff" }}
                                    />
                                  )}
                                </div>
                              </Popover>
                              <Input
                                className="ghost-input"
                                value={getVal(lead, "name") || ""}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    lead.id,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                                bordered={false}
                                style={{
                                  fontWeight: 700,
                                  fontSize: 13,
                                  color: "#0f172a",
                                  padding: "3px 6px",
                                }}
                              />
                            </div>
                          </td>

                          {/* Remarks */}
                          <td
                            style={{
                              padding: "10px 14px",
                              minWidth: 200,
                              maxWidth: 260,
                            }}
                          >
                            <TextArea
                              className="ghost-textarea"
                              value={getVal(lead, "remarks") || ""}
                              onChange={(e) =>
                                handleInlineEdit(
                                  lead.id,
                                  "remarks",
                                  e.target.value,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Add note…"
                              bordered={false}
                              autoSize={{ minRows: 1, maxRows: 3 }}
                            />
                          </td>

                          {/* Last followup */}
                          <td style={{ padding: "10px 14px", minWidth: 140 }}>
                            <input
                              type="date"
                              value={getVal(lead, "last_followup_date") || ""}
                              onChange={(e) =>
                                handleInlineEdit(
                                  lead.id,
                                  "last_followup_date",
                                  e.target.value,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                border: "none",
                                background: "transparent",
                                fontSize: 12,
                                color: getVal(lead, "last_followup_date")
                                  ? "#1e293b"
                                  : "#94a3b8",
                                cursor: "text",
                                outline: "none",
                                borderRadius: 6,
                                padding: "3px 6px",
                                transition: "background 0.1s",
                                width: "100%",
                              }}
                              onFocus={(e) =>
                                (e.target.style.background = "#f1f5f9")
                              }
                              onBlur={(e) =>
                                (e.target.style.background = "transparent")
                              }
                            />
                            {getVal(lead, "last_followup_date") && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#94a3b8",
                                  paddingLeft: 6,
                                }}
                              >
                                {dayjs(
                                  getVal(lead, "last_followup_date"),
                                ).fromNow()}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td
                            style={{ padding: "10px 14px", minWidth: 140 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Select
                              className="ghost-select"
                              value={getVal(lead, "status")}
                              onChange={(v) =>
                                handleInlineEdit(lead.id, "status", v)
                              }
                              bordered={false}
                              suffixIcon={null}
                              dropdownStyle={{ borderRadius: 10 }}
                              style={{ width: "100%" }}
                            >
                              {Object.entries(STATUS_CFG).map(([val, cfg]) => (
                                <Select.Option key={val} value={val}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      padding: "3px 9px",
                                      borderRadius: 20,
                                      border: `1px solid ${cfg.border}`,
                                      background: cfg.bg,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: cfg.color,
                                    }}
                                  >
                                    {cfg.icon} {cfg.label}
                                  </span>
                                </Select.Option>
                              ))}
                            </Select>
                          </td>

                          {/* Source */}
                          <td
                            style={{ padding: "10px 14px", minWidth: 130 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Select
                              className="ghost-select"
                              value={getVal(lead, "source")}
                              onChange={(v) =>
                                handleInlineEdit(lead.id, "source", v)
                              }
                              bordered={false}
                              suffixIcon={null}
                              dropdownStyle={{ borderRadius: 10 }}
                              style={{ width: "100%" }}
                            >
                              {Object.entries(SOURCE_CFG).map(([val, cfg]) => (
                                <Select.Option key={val} value={val}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 7,
                                      color: "#475569",
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        color: "#64748b",
                                      }}
                                    >
                                      {cfg.icon}
                                    </span>
                                    <span style={{ fontSize: 12 }}>
                                      {cfg.label}
                                    </span>
                                  </span>
                                </Select.Option>
                              ))}
                            </Select>
                          </td>

                          {/* Closing % */}
                          <td
                            style={{ padding: "10px 14px", minWidth: 90 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div>
                              <Input
                                className="ghost-input"
                                type="number"
                                value={pct}
                                onChange={(e) =>
                                  handleInlineEdit(
                                    lead.id,
                                    "closing_percentage",
                                    Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        parseInt(e.target.value) || 0,
                                      ),
                                    ),
                                  )
                                }
                                suffix={
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: "#94a3b8",
                                      fontWeight: 700,
                                    }}
                                  >
                                    %
                                  </span>
                                }
                                bordered={false}
                                min={0}
                                max={100}
                                style={{
                                  width: 72,
                                  fontWeight: 700,
                                  color: pctColor(pct),
                                  padding: "3px 6px",
                                }}
                              />
                              <div
                                className="pct-bar"
                                style={{ width: 64, marginLeft: 6 }}
                              >
                                <div
                                  className="pct-fill"
                                  style={{
                                    width: `${pct}%`,
                                    background: pctColor(pct),
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Created */}
                          <td
                            style={{
                              padding: "10px 14px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>
                              {dayjs(lead.created_at).format("MMM D, YY")}
                            </span>
                          </td>

                          {/* Delete */}
                          <td style={{ padding: "10px 14px 10px 4px" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(lead.id);
                              }}
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 7,
                                border: "1px solid transparent",
                                background: "transparent",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#cbd5e1",
                                transition: "all 0.1s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#fff1f2";
                                e.currentTarget.style.color = "#e11d48";
                                e.currentTarget.style.borderColor = "#fecdd3";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                                e.currentTarget.style.color = "#cbd5e1";
                                e.currentTarget.style.borderColor =
                                  "transparent";
                              }}
                            >
                              <DeleteOutlined style={{ fontSize: 11 }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderTop: "1px solid #f1f5f9",
              background: "#fff",
              borderRadius: "0 0 16px 16px",
            }}
          >
            {/* Left: result range info */}
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
              Showing{" "}
              <span style={{ color: "#0f172a", fontWeight: 700 }}>
                {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)}
              </span>
              {" – "}
              <span style={{ color: "#0f172a", fontWeight: 700 }}>
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>
              {" of "}
              <span style={{ color: "#0f172a", fontWeight: 700 }}>
                {filtered.length}
              </span>
              {" leads"}
            </span>

            {/* Right: page controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {/* Prev */}
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: currentPage === 1 ? "#cbd5e1" : "#475569",
                  transition: "all .12s",
                  fontSize: 13,
                  fontWeight: 700,
                }}
                onMouseEnter={(e) => {
                  if (currentPage > 1) {
                    e.currentTarget.style.background = "#0f172a";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.borderColor = "#0f172a";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color =
                    currentPage === 1 ? "#cbd5e1" : "#475569";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                ‹
              </button>

              {/* Page numbers */}
              {(() => {
                const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                const pages = [];
                let start = Math.max(1, currentPage - 2);
                let end = Math.min(totalPages, start + 4);
                if (end - start < 4) start = Math.max(1, end - 4);

                if (start > 1) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => setCurrentPage(1)}
                      style={{
                        minWidth: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1.5px solid #e2e8f0",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#475569",
                        padding: "0 6px",
                        transition: "all .12s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      1
                    </button>,
                  );
                  if (start > 2)
                    pages.push(
                      <span
                        key="s1"
                        style={{
                          color: "#cbd5e1",
                          fontSize: 13,
                          padding: "0 2px",
                        }}
                      >
                        …
                      </span>,
                    );
                }

                for (let i = start; i <= end; i++) {
                  const isActive = i === currentPage;
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      style={{
                        minWidth: 32,
                        height: 32,
                        borderRadius: 8,
                        border: `1.5px solid ${isActive ? "#0f172a" : "#e2e8f0"}`,
                        background: isActive ? "#0f172a" : "#fff",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 600,
                        color: isActive ? "#fff" : "#475569",
                        padding: "0 6px",
                        transition: "all .12s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "#f1f5f9";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "#fff";
                        }
                      }}
                    >
                      {i}
                    </button>,
                  );
                }

                if (end < totalPages) {
                  if (end < totalPages - 1)
                    pages.push(
                      <span
                        key="s2"
                        style={{
                          color: "#cbd5e1",
                          fontSize: 13,
                          padding: "0 2px",
                        }}
                      >
                        …
                      </span>,
                    );
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      style={{
                        minWidth: 32,
                        height: 32,
                        borderRadius: 8,
                        border: "1.5px solid #e2e8f0",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#475569",
                        padding: "0 6px",
                        transition: "all .12s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      {totalPages}
                    </button>,
                  );
                }
                return pages;
              })()}

              {/* Next */}
              <button
                disabled={currentPage >= Math.ceil(filtered.length / PAGE_SIZE)}
                onClick={() => setCurrentPage((p) => p + 1)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  cursor:
                    currentPage >= Math.ceil(filtered.length / PAGE_SIZE)
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color:
                    currentPage >= Math.ceil(filtered.length / PAGE_SIZE)
                      ? "#cbd5e1"
                      : "#475569",
                  transition: "all .12s",
                  fontSize: 13,
                  fontWeight: 700,
                }}
                onMouseEnter={(e) => {
                  if (currentPage < Math.ceil(filtered.length / PAGE_SIZE)) {
                    e.currentTarget.style.background = "#0f172a";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.borderColor = "#0f172a";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color =
                    currentPage >= Math.ceil(filtered.length / PAGE_SIZE)
                      ? "#cbd5e1"
                      : "#475569";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Drawer */}
      <Drawer
        className="ld-drawer"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingLead(null);
          fetchLeads();
        }}
        width={480}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: editingLead
                    ? "#f1f5f9"
                    : "linear-gradient(135deg,#0f172a,#334155)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                {editingLead?.icon || (
                  <GlobalOutlined
                    style={{
                      fontSize: 16,
                      color: editingLead ? "#475569" : "#fff",
                    }}
                  />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {editingLead ? "Lead Details" : "New Lead"}
                </div>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}
                >
                  {editingLead?.name || "Create Lead"}
                </div>
              </div>
            </div>
            {editingLead && (
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="small"
                  icon={<InboxOutlined />}
                  onClick={() => handleArchive(editingLead.id, !showArchived)}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 12,
                    height: 30,
                  }}
                >
                  {showArchived ? "Restore" : "Archive"}
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(editingLead.id)}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 12,
                    height: 30,
                    border: "1px solid #fecdd3",
                    background: "#fff1f2",
                    color: "#e11d48",
                  }}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        }
        footer={null}
      >
        <LeadForm
          lead={editingLead}
          profile={profile}
          tenantId={tenantId}
          onClose={() => {
            setDrawerOpen(false);
            setEditingLead(null);
            fetchLeads();
          }}
        />
      </Drawer>

      {/* Settings Drawer */}
      <Drawer
        className="ld-drawer"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={460}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#0f172a,#334155)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SettingOutlined style={{ fontSize: 16, color: "#fff" }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Leads
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                Pipeline Settings
              </div>
            </div>
          </div>
        }
        footer={null}
      >
        <LeadsSettings profile={profile} tenantId={tenantId} leads={leads} />
      </Drawer>
    </div>
  );
};

// ── LeadForm ──────────────────────────────────────────────────────────────
const LeadForm = ({ lead, profile, tenantId, onClose }) => {
  const [form, setForm] = useState({
    name: lead?.name || "",
    status: lead?.status || "in_progress",
    source: lead?.source || "website",
    remarks: lead?.remarks || "",
    last_followup_date: lead?.last_followup_date || "",
    icon: lead?.icon || "",
    closing_percentage: lead?.closing_percentage || 0,
  });
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [followupText, setFollowupText] = useState("");
  const [copied, setCopied] = useState(false);
  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleAnalyze = async () => {
    if (!form.name) {
      message.error("Add a lead name first");
      return;
    }
    setAiLoading("analyze");
    setAiInsights(null);
    try {
      const SYSTEM = `You are a sales intelligence assistant. Respond ONLY with valid JSON, no markdown.
Return exactly: {"closing_percentage":<int 0-100>,"status":"in_progress"|"closed"|"not_closed","summary":"<2 sentence max>","actions":["<action 1>","<action 2>","<action 3>"]}`;
      const raw = await groq(
        SYSTEM,
        `Lead: ${form.name}\nSource: ${form.source}\nStatus: ${form.status}\nRemarks: ${form.remarks || "none"}\nLast followup: ${form.last_followup_date || "never"}\nClose %: ${form.closing_percentage}`,
      );
      const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
      set("closing_percentage", json.closing_percentage);
      set("status", json.status);
      setAiInsights({ summary: json.summary, actions: json.actions });
      message.success("AI analysis complete");
    } catch (e) {
      console.error(e);
      message.error("AI analysis failed");
    } finally {
      setAiLoading(null);
    }
  };

  const handleFollowup = async () => {
    if (!form.name) {
      message.error("Add a lead name first");
      return;
    }
    setAiLoading("followup");
    setFollowupText("");
    try {
      const SYSTEM = `You are an expert sales rep. Write a short, warm, professional follow-up message for a lead. Under 120 words. No subject line. No placeholders. Sound human.`;
      const text = await groq(
        SYSTEM,
        `Lead: ${form.name}\nSource: ${form.source}\nStatus: ${form.status}\nRemarks: ${form.remarks || "none"}\nLast followup: ${form.last_followup_date || "never"}\nClose %: ${form.closing_percentage}%`,
      );
      setFollowupText(text);
    } catch (e) {
      console.error(e);
      message.error("Failed to generate follow-up");
    } finally {
      setAiLoading(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(followupText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!form.name) {
      message.error("Lead name is required");
      return;
    }
    setSaving(true);
    try {
      if (lead) {
        const { error } = await supabase
          .from("leads")
          .update(form)
          .eq("id", lead.id);
        if (error) throw error;
        message.success("Lead updated");
      } else {
        const { error } = await supabase
          .from("leads")
          .insert([{ ...form, tenant_id: tenantId, created_by: profile?.id }]);
        if (error) throw error;
        message.success("Lead created");
      }
      onClose();
    } catch {
      message.error("Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  const pct = form.closing_percentage || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="form-field">
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 7,
          }}
        >
          Name <span style={{ color: "#e11d48" }}>*</span>
        </label>
        <Input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Acme Corp"
        />
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 7,
          }}
        >
          Icon
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: "1.5px solid #e2e8f0",
              background: form.icon
                ? "#f8fafc"
                : "linear-gradient(135deg,#0f172a,#334155)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            {form.icon || (
              <UserOutlined style={{ color: "#fff", fontSize: 18 }} />
            )}
          </div>
          <Popover
            trigger="click"
            title={
              <span style={{ fontSize: 12, fontWeight: 700 }}>Select Icon</span>
            }
            content={
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(8,1fr)",
                  gap: 5,
                  width: 268,
                }}
              >
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => set("icon", ic)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      border:
                        form.icon === ic
                          ? "2px solid #0f172a"
                          : "1px solid transparent",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 17,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {ic}
                  </button>
                ))}
                <button
                  onClick={() => set("icon", "")}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    border: "1px dashed #e2e8f0",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                  }}
                >
                  <CloseOutlined style={{ fontSize: 10 }} />
                </button>
              </div>
            }
          >
            <Button
              style={{
                borderRadius: 9,
                fontWeight: 600,
                fontSize: 12,
                height: 34,
              }}
            >
              {form.icon ? "Change Icon" : "Pick Icon"}
            </Button>
          </Popover>
          {form.icon && (
            <button
              onClick={() => set("icon", "")}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="form-select">
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 7,
            }}
          >
            Status
          </label>
          <Select
            value={form.status}
            onChange={(v) => set("status", v)}
            style={{ width: "100%" }}
          >
            {Object.entries(STATUS_CFG).map(([val, cfg]) => (
              <Select.Option key={val} value={val}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontWeight: 600,
                    color: cfg.color,
                  }}
                >
                  {cfg.icon} {cfg.label}
                </span>
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="form-select">
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 7,
            }}
          >
            Source
          </label>
          <Select
            value={form.source}
            onChange={(v) => set("source", v)}
            style={{ width: "100%" }}
          >
            {Object.entries(SOURCE_CFG).map(([val, cfg]) => (
              <Select.Option key={val} value={val}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    color: "#475569",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      color: "#64748b",
                    }}
                  >
                    {cfg.icon}
                  </span>
                  <span style={{ fontSize: 13 }}>{cfg.label}</span>
                </span>
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 7,
          }}
        >
          Closing Probability
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="form-field" style={{ flex: 1 }}>
            <Input
              type="number"
              min={0}
              max={100}
              value={pct}
              onChange={(e) =>
                set(
                  "closing_percentage",
                  Math.max(0, Math.min(100, parseInt(e.target.value) || 0)),
                )
              }
              suffix={
                <span style={{ color: pctColor(pct), fontWeight: 700 }}>%</span>
              }
            />
          </div>
          <div style={{ flex: 2 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span
                style={{ fontSize: 11, color: pctColor(pct), fontWeight: 700 }}
              >
                {pct >= 75 ? "🔥 Hot" : pct >= 40 ? "🌤 Warm" : "🧊 Cold"}
              </span>
              <span
                style={{ fontSize: 12, fontWeight: 700, color: pctColor(pct) }}
              >
                {pct}%
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "#f1f5f9",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: pctColor(pct),
                  borderRadius: 99,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="form-field">
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 7,
          }}
        >
          Remarks
        </label>
        <Input.TextArea
          value={form.remarks}
          onChange={(e) => set("remarks", e.target.value)}
          placeholder="Notes, context, next steps…"
          rows={3}
          style={{ resize: "none" }}
        />
      </div>

      <div className="form-field">
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 7,
          }}
        >
          Last Followup Date
        </label>
        <Input
          type="date"
          value={form.last_followup_date}
          onChange={(e) => set("last_followup_date", e.target.value)}
        />
        {form.last_followup_date && (
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>
            {dayjs(form.last_followup_date).fromNow()}
          </div>
        )}
      </div>

      {/* AI Panel */}
      <div className="ai-panel">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Sparkles size={14} color="#4338ca" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#4338ca",
                letterSpacing: "0.04em",
              }}
            >
              AI Assistant
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="ai-action-btn"
              onClick={handleAnalyze}
              disabled={!!aiLoading}
            >
              {aiLoading === "analyze" ? (
                <span
                  className="ai-shimmer"
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <Sparkles size={12} /> Analyzing…
                </span>
              ) : (
                <>
                  <Sparkles size={12} /> Analyze Lead
                </>
              )}
            </button>
            <button
              className="ai-action-btn secondary"
              onClick={handleFollowup}
              disabled={!!aiLoading}
            >
              {aiLoading === "followup" ? (
                <span
                  className="ai-shimmer"
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <MessageCircle size={12} /> Writing…
                </span>
              ) : (
                <>
                  <MessageCircle size={12} /> Draft Follow-up
                </>
              )}
            </button>
          </div>
        </div>
        {aiInsights && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#1e293b",
                lineHeight: 1.65,
              }}
            >
              {aiInsights.summary}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span
                className="insight-chip"
                style={{
                  background: pctBg(form.closing_percentage),
                  border: `1px solid ${pctBord(form.closing_percentage)}`,
                  color: pctColor(form.closing_percentage),
                }}
              >
                <Sparkles size={10} /> {form.closing_percentage}% close
                probability
              </span>
              <span
                className="insight-chip"
                style={{
                  background: STATUS_CFG[form.status]?.bg,
                  border: `1px solid ${STATUS_CFG[form.status]?.border}`,
                  color: STATUS_CFG[form.status]?.color,
                }}
              >
                {STATUS_CFG[form.status]?.label}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Suggested Next Steps
              </span>
              {aiInsights.actions.map((action, i) => (
                <div
                  key={i}
                  style={{ display: "flex", gap: 9, alignItems: "flex-start" }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#e0e7ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <span
                      style={{ fontSize: 9, fontWeight: 800, color: "#4338ca" }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <span
                    style={{ fontSize: 12, color: "#374151", lineHeight: 1.55 }}
                  >
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {followupText && (
          <div className="followup-box">
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check size={10} /> Copied
                </>
              ) : (
                <>
                  <Copy size={10} /> Copy
                </>
              )}
            </button>
            {followupText}
          </div>
        )}
        {!aiInsights && !followupText && !aiLoading && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "#94a3b8",
              fontStyle: "italic",
            }}
          >
            Analyze to get closing probability, status suggestion & next steps —
            or draft an instant follow-up message.
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          paddingTop: 8,
          borderTop: "1px solid #f1f5f9",
          marginTop: 4,
        }}
      >
        <Button
          onClick={onClose}
          style={{ borderRadius: 9, height: 38, fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          loading={saving}
          onClick={handleSave}
          style={{
            borderRadius: 9,
            height: 38,
            paddingInline: 24,
            background: "#0f172a",
            border: "none",
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(15,23,42,0.2)",
          }}
        >
          {lead ? "Update" : "Create"} Lead
        </Button>
      </div>
    </div>
  );
};

// ── LeadsSettings ─────────────────────────────────────────────────────────
const LeadsSettings = ({ profile, tenantId, leads }) => {
  const [settings, setSettings] = useState({
    followup_reminders_enabled: false,
    reminder_days_overdue: 7, // remind if no followup in N days
    reminder_email: profile?.email || "",
    reminder_include_ai_message: true,
    notify_hot_leads: true,
    hot_lead_threshold: 75,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [runningReminders, setRunningReminders] = useState(false);
  const set = (k, v) => setSettings((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("lead_settings")
          .select("*")
          .eq("tenant_id", tenantId)
          .maybeSingle();
        if (data) setSettings((s) => ({ ...s, ...data }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (tenantId) load();
  }, [tenantId]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("lead_settings")
        .upsert(
          { ...settings, tenant_id: tenantId },
          { onConflict: "tenant_id" },
        );
      if (error) throw error;
      message.success("Settings saved");
    } catch (e) {
      console.error(e);
      message.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Send a test reminder email
  const sendTestEmail = async () => {
    if (!settings.reminder_email) {
      message.error("Enter a recipient email first");
      return;
    }
    setTestSending(true);
    try {
      const testMessage = `This is a test reminder from your Leads Pipeline.\n\nYou have configured follow-up reminders for leads that haven't been contacted in ${settings.reminder_days_overdue} days.\n\nEverything is working correctly.`;
      await sendEmail({
        to: settings.reminder_email,
        subject: "Test: Leads Follow-up Reminder",
        companyName: "Resosyncer",
        body: followupEmailTemplate({
          leadName: "Test Lead",
          message: testMessage,
          senderName: profile?.full_name || "Admin",
          companyName: "Resosyncer",
          dashboardUrl: window.location.origin,
        }),
      });
      message.success("Test email sent");
    } catch (e) {
      message.error("Failed to send test email");
    } finally {
      setTestSending(false);
    }
  };

  // Run reminders now — AI triages overdue leads, sends ONE digest email
  const runRemindersNow = async () => {
    if (!settings.reminder_email) {
      message.error("Enter a recipient email first");
      return;
    }
    setRunningReminders(true);
    try {
      const cutoff = dayjs()
        .subtract(settings.reminder_days_overdue, "day")
        .format("YYYY-MM-DD");
      const overdue = leads.filter((l) => {
        if (l.status === "closed" || l.status === "not_closed" || l.is_archived)
          return false;
        if (!l.last_followup_date) return true;
        return l.last_followup_date <= cutoff;
      });

      if (!overdue.length) {
        message.info("No overdue leads found. All up to date!");
        setRunningReminders(false);
        return;
      }

      // Step 1: AI triage — one call to filter which leads actually need attention
      let toNotify = overdue;
      try {
        const TRIAGE_SYSTEM = `You are a sales prioritization assistant. Given a list of overdue leads, decide which ones genuinely need a follow-up reminder. Skip leads that are clearly dead, very low priority, or where a reminder adds no value. Be selective. Respond ONLY with valid JSON: {"recommend": [<id>, ...]}`;
        const raw = await groq(
          TRIAGE_SYSTEM,
          `Overdue leads:\n${JSON.stringify(
            overdue.map((l) => ({
              id: l.id,
              name: l.name,
              status: l.status,
              closing_percentage: l.closing_percentage || 0,
              remarks: l.remarks || "",
              days_since_followup: l.last_followup_date
                ? dayjs().diff(dayjs(l.last_followup_date), "day")
                : null,
            })),
            null,
            2,
          )}`,
        );
        const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
        if (Array.isArray(json.recommend) && json.recommend.length > 0) {
          const recommended = new Set(json.recommend);
          toNotify = overdue.filter((l) => recommended.has(l.id));
        }
      } catch (e) {
        console.warn("AI triage failed, using all overdue leads:", e);
      }

      if (!toNotify.length) {
        message.info(
          `AI reviewed ${overdue.length} overdue lead${overdue.length !== 1 ? "s" : ""} and found none that need attention right now.`,
        );
        setRunningReminders(false);
        return;
      }

      // Step 2: Optionally generate one AI summary for the whole digest
      let aiSummary = "";
      if (settings.reminder_include_ai_message) {
        try {
          const SYSTEM = `You are a sales assistant. Write a brief 2-3 sentence overall summary for a sales rep about their overdue leads that need attention today. Be direct and motivating. No lists, no lead names — just a high-level nudge.`;
          aiSummary = await groq(
            SYSTEM,
            `${toNotify.length} leads need follow-up out of ${overdue.length} overdue. Top priorities by close %: ${toNotify
              .sort(
                (a, b) =>
                  (b.closing_percentage || 0) - (a.closing_percentage || 0),
              )
              .slice(0, 3)
              .map((l) => `${l.name} (${l.closing_percentage || 0}%)`)
              .join(", ")}`,
          );
        } catch (e) {
          /* skip */
        }
      }

      // Step 3: Build one digest email
      const digestHtml = buildDigestEmail({
        leads: toNotify,
        totalOverdue: overdue.length,
        aiSummary,
        senderName: profile?.full_name || "Admin",
        companyName: "Resosyncer",
        dashboardUrl: window.location.origin,
        reminderDays: settings.reminder_days_overdue,
      });

      await sendEmail({
        to: settings.reminder_email,
        subject: `Follow-up Digest: ${toNotify.length} lead${toNotify.length !== 1 ? "s" : ""} need attention`,
        companyName: "Resosyncer",
        body: digestHtml,
      });

      const skipped = overdue.length - toNotify.length;
      message.success(
        `Digest sent for ${toNotify.length} lead${toNotify.length !== 1 ? "s" : ""}${skipped > 0 ? ` · AI skipped ${skipped} low-priority` : ""}`,
      );
    } catch (e) {
      console.error(e);
      message.error("Failed to run reminders");
    } finally {
      setRunningReminders(false);
    }
  };

  const buildDigestEmail = ({
    leads,
    totalOverdue,
    aiSummary,
    senderName,
    companyName,
    dashboardUrl,
    reminderDays,
  }) => {
    const pctLabel = (v) =>
      v >= 75 ? "🔥 Hot" : v >= 40 ? "🌤 Warm" : "🧊 Cold";

    const leadItems = leads
      .sort((a, b) => (b.closing_percentage || 0) - (a.closing_percentage || 0))
      .map((l) => {
        const daysSince = l.last_followup_date
          ? dayjs().diff(dayjs(l.last_followup_date), "day")
          : null;
        const statusLabel = STATUS_CFG[l.status]?.label || l.status;
        const pct = l.closing_percentage || 0;

        return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
              <div>
                <span style="font-size:14px;font-weight:700;color:#0f172a;">
                  ${l.icon ? l.icon + " " : ""}${l.name}
                </span>
                <span style="margin-left:8px;font-size:11px;font-weight:700;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:20px;">${statusLabel}</span>
              </div>
              <span style="font-size:12px;font-weight:700;color:#64748b;">${pctLabel(pct)} · ${pct}%</span>
            </div>
            ${l.remarks ? `<div style="margin-top:4px;font-size:12px;color:#64748b;line-height:1.5;">${l.remarks}</div>` : ""}
            <div style="margin-top:4px;font-size:11px;color:#94a3b8;">
              Last contact: ${daysSince !== null ? `${daysSince} days ago` : "<span style='color:#e11d48;font-weight:700;'>Never contacted</span>"}
            </div>
          </td>
        </tr>`;
      })
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <tr><td style="padding:0 0 20px;">
          <span style="font-size:13px;font-weight:700;color:#0f172a;">${companyName || "Resosyncer"}</span>
        </td></tr>

        <tr><td style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;padding:28px 32px;">

          <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;">Follow-up Digest</p>
          <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#0f172a;">
            ${leads.length} lead${leads.length !== 1 ? "s" : ""} need attention
          </h2>
          <p style="margin:0 0 24px;font-size:12px;color:#94a3b8;">
            ${totalOverdue} overdue · ${leads.length} prioritized by AI · ${reminderDays}+ days without contact
          </p>

          ${
            aiSummary
              ? `
          <div style="background:#f8faff;border:1px solid #e0e7ff;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#4338ca;text-transform:uppercase;letter-spacing:0.06em;">✦ AI Summary</p>
            <p style="margin:0;font-size:13px;color:#1e293b;line-height:1.65;">${aiSummary}</p>
          </div>`
              : ""
          }

          <table width="100%" cellpadding="0" cellspacing="0">
            <tbody>${leadItems}</tbody>
          </table>

          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:11px;color:#94a3b8;">Sent by ${senderName} · ${companyName}</span>
          </div>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  };

  if (loading)
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Section: Follow-up Reminders */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 16,
            paddingBottom: 10,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          Follow-up Reminders
        </div>

        {/* Enable toggle */}
        <div className="settings-row">
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
              Enable Reminders
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
              Get notified about leads that haven't been contacted recently
            </div>
          </div>
          <Switch
            checked={settings.followup_reminders_enabled}
            onChange={(v) => set("followup_reminders_enabled", v)}
          />
        </div>

        {/* Recipient email */}
        <div className="settings-row">
          <div style={{ flex: 1, marginRight: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
              Reminder Email
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
              Who receives the reminder emails
            </div>
          </div>
          <Input
            value={settings.reminder_email}
            onChange={(e) => set("reminder_email", e.target.value)}
            placeholder="you@company.com"
            style={{
              width: 220,
              borderRadius: 8,
              border: "1.5px solid #e2e8f0",
              fontSize: 13,
            }}
          />
        </div>

        {/* Days overdue */}
        <div className="settings-row">
          <div style={{ flex: 1, marginRight: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
              Remind After
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
              Send reminder if no followup within this many days
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Input
              type="number"
              min={1}
              max={90}
              value={settings.reminder_days_overdue}
              onChange={(e) =>
                set(
                  "reminder_days_overdue",
                  Math.max(1, parseInt(e.target.value) || 7),
                )
              }
              style={{
                width: 72,
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                textAlign: "center",
              }}
            />
            <span style={{ fontSize: 12, color: "#64748b" }}>days</span>
          </div>
        </div>

        {/* AI message */}
        <div className="settings-row">
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#0f172a",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Sparkles size={13} color="#4338ca" /> Include AI Suggestions
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
              Attach an AI-generated follow-up suggestion to each reminder
            </div>
          </div>
          <Switch
            checked={settings.reminder_include_ai_message}
            onChange={(v) => set("reminder_include_ai_message", v)}
          />
        </div>
      </div>

      {/* Section: Hot Lead Alerts */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: 16,
            paddingBottom: 10,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          Hot Lead Alerts
        </div>

        <div className="settings-row">
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
              Notify on Hot Leads
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
              Send an alert when a lead crosses the hot threshold
            </div>
          </div>
          <Switch
            checked={settings.notify_hot_leads}
            onChange={(v) => set("notify_hot_leads", v)}
          />
        </div>

        <div className="settings-row">
          <div style={{ flex: 1, marginRight: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
              Hot Lead Threshold
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
              Leads above this closing % are considered hot 🔥
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Input
              type="number"
              min={1}
              max={100}
              value={settings.hot_lead_threshold}
              onChange={(e) =>
                set(
                  "hot_lead_threshold",
                  Math.max(1, Math.min(100, parseInt(e.target.value) || 75)),
                )
              }
              style={{
                width: 72,
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                textAlign: "center",
              }}
            />
            <span style={{ fontSize: 12, color: "#64748b" }}>%</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          paddingTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Run reminders now */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: 4,
            }}
          >
            Run Reminders Now
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginBottom: 12,
              lineHeight: 1.6,
            }}
          >
            Immediately scan all active leads and send follow-up reminder emails
            for any that are overdue.
            {settings.reminder_include_ai_message &&
              " Each reminder will include an AI-generated suggestion."}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              loading={runningReminders}
              onClick={runRemindersNow}
              icon={<BellOutlined />}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                height: 36,
                background: "#0f172a",
                border: "none",
                color: "#fff",
              }}
            >
              {runningReminders ? "Sending…" : "Run Now"}
            </Button>
            <Button
              loading={testSending}
              onClick={sendTestEmail}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                height: 36,
                border: "1.5px solid #e2e8f0",
              }}
            >
              Send Test Email
            </Button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            paddingTop: 8,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <Button
            type="primary"
            loading={saving}
            onClick={saveSettings}
            style={{
              borderRadius: 9,
              height: 38,
              paddingInline: 24,
              background: "#0f172a",
              border: "none",
              fontWeight: 700,
            }}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Leads;
