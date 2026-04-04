import { useState, useEffect, useMemo } from "react";
import { Table, Button, message, Modal, Input, Select } from "antd";
import {
  PlusOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  MessageOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const { TextArea } = Input;

// ─── Theme styles (CSS variables) ────────────────────────────────────────────
const THEME_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

  .rq-root {
    /* Backgrounds */
    --bg-page:       #f8fafc;
    --bg-card:       #ffffff;
    --bg-card-alt:   #f9fafb;
    --bg-card-hover: #f8fafc;
    --bg-subtle:     #f1f5f9;
    --bg-input:      #f8fafc;
    --bg-input-focus:#ffffff;

    /* Borders */
    --border:        #e2e8f0;
    --border-subtle: #f1f5f9;
    --border-faint:  #f9fafb;

    /* Text */
    --text-primary:  #0f172a;
    --text-secondary:#1e293b;
    --text-tertiary: #475569;
    --text-muted:    #64748b;
    --text-faint:    #94a3b8;

    /* Semantic status */
    --pending-color:  #d97706; --pending-bg:  #fffbeb; --pending-border:  #fde68a;
    --approved-color: #059669; --approved-bg: #ecfdf5; --approved-border: #a7f3d0;
    --rejected-color: #e11d48; --rejected-bg: #fff1f2; --rejected-border: #fecdd3;

    /* Request type */
    --type-advance-color: #7c3aed; --type-advance-bg: #f5f3ff; --type-advance-border: #ddd6fe;
    --type-leave-color:   #0369a1; --type-leave-bg:   #f0f9ff; --type-leave-border:   #bae6fd;
    --type-other-color:   #475569; --type-other-bg:   #f8fafc; --type-other-border:   #e2e8f0;

    /* Misc */
    --accent:        #6366f1;
    --shadow-card:   0 1px 3px rgba(15,23,42,0.04);
    --shadow-btn:    0 4px 12px rgba(15,23,42,0.25);
  }

  /* ══ DARK ══ */
  .rq-root.dark {
    --bg-page:       #141416;
    --bg-card:       #141416;
    --bg-card-alt:   #18181c;
    --bg-card-hover: #18181c;
    --bg-subtle:     #1c1c22;
    --bg-input:      #1c1c22;
    --bg-input-focus:#141416;

    --border:        #2a2a31;
    --border-subtle: #2a2a31;
    --border-faint:  #23232b;

    --text-primary:  #f1f5f9;
    --text-secondary:#e2e8f0;
    --text-tertiary: #cbd5e1;
    --text-muted:    #94a3b8;
    --text-faint:    #64748b;

    --pending-color:  #fbbf24; --pending-bg:  rgba(217,119,6,0.16);  --pending-border:  rgba(251,191,36,0.35);
    --approved-color: #4ade80; --approved-bg: rgba(34,197,94,0.16);  --approved-border: rgba(74,222,128,0.35);
    --rejected-color: #fb7185; --rejected-bg: rgba(225,29,72,0.16);  --rejected-border: rgba(251,113,133,0.35);

    --type-advance-color: #c4b5fd; --type-advance-bg: rgba(124,58,237,0.16); --type-advance-border: rgba(196,181,253,0.35);
    --type-leave-color:   #7dd3fc; --type-leave-bg:   rgba(3,105,161,0.16);  --type-leave-border:   rgba(125,211,252,0.35);
    --type-other-color:   #94a3b8; --type-other-bg:   rgba(148,163,184,0.14);--type-other-border:   rgba(148,163,184,0.28);

    --shadow-card:   0 1px 3px rgba(0,0,0,0.3);
    --shadow-btn:    0 4px 12px rgba(0,0,0,0.4);
  }

  /* ── Font reset ── */
  .rq-root * { font-family: 'Outfit', sans-serif !important; box-sizing: border-box; }

  /* ── Table ── */
  .rq-root .req-table .ant-table { background: transparent !important; }
  .rq-root .req-table .ant-table-thead > tr > th {
    background: var(--bg-card-alt) !important;
    color: var(--text-faint) !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid var(--border) !important;
    padding: 11px 16px !important;
  }
  .rq-root .req-table .ant-table-tbody > tr > td {
    background: var(--bg-card) !important;
    border-bottom: 1px solid var(--border-faint) !important;
    padding: 14px 16px !important;
    vertical-align: middle;
  }
  .rq-root .req-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
  .rq-root .req-table .ant-table-tbody > tr:hover > td { background: var(--bg-card-hover) !important; }
  .rq-root .req-table .ant-table-row { cursor: pointer; }
  .rq-root .req-table .ant-table-expanded-row > td {
    background: var(--bg-card-alt) !important;
    padding: 0 !important;
  }
  .rq-root .req-table .ant-pagination-item { border-color: var(--border) !important; background: var(--bg-card) !important; }
  .rq-root .req-table .ant-pagination-item a { color: var(--text-tertiary) !important; }
  .rq-root .req-table .ant-pagination-item-active { border-color: var(--text-primary) !important; }
  .rq-root .req-table .ant-pagination-item-active a { color: var(--text-primary) !important; }
  .rq-root .req-table .ant-pagination-prev button,
  .rq-root .req-table .ant-pagination-next button { color: var(--text-tertiary) !important; border-color: var(--border) !important; background: var(--bg-card) !important; }
  .rq-root .req-table .ant-spin-dot-item { background: var(--accent) !important; }

  /* ── Inputs ── */
  .rq-root .req-input .ant-input,
  .rq-root .req-input textarea,
  .rq-root .req-select .ant-select-selector {
    border-radius: 9px !important;
    border-color: var(--border) !important;
    font-size: 13px !important;
    padding: 9px 13px !important;
    background: var(--bg-input) !important;
    color: var(--text-primary) !important;
    transition: all 0.15s;
  }
  .rq-root .req-input .ant-input:focus,
  .rq-root .req-input textarea:focus {
    border-color: var(--accent) !important;
    background: var(--bg-input-focus) !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.08) !important;
  }
  .rq-root .req-input .ant-input::placeholder,
  .rq-root .req-input textarea::placeholder { color: var(--text-faint) !important; }
  .rq-root .req-select .ant-select-selector { height: auto !important; padding: 6px 13px !important; }
  .rq-root .req-select .ant-select-selection-placeholder { color: var(--text-faint) !important; }
  .rq-root .req-select .ant-select-selection-item { color: var(--text-primary) !important; }
  .rq-root .req-select .ant-select-arrow { color: var(--text-faint) !important; }

  /* ── Modal ── */
  .rq-root .req-modal .ant-modal-content {
    border-radius: 18px !important;
    overflow: hidden;
    padding: 0 !important;
    background: var(--bg-card) !important;
  }
  .rq-root .req-modal .ant-modal-header {
    padding: 22px 28px 18px !important;
    border-bottom: 1px solid var(--border) !important;
    margin: 0 !important;
    background: var(--bg-card) !important;
  }
  .rq-root .req-modal .ant-modal-body  { padding: 24px 28px !important; background: var(--bg-card) !important; }
  .rq-root .req-modal .ant-modal-footer {
    padding: 16px 28px !important;
    border-top: 1px solid var(--border) !important;
    margin: 0 !important;
    background: var(--bg-card) !important;
  }
  .rq-root .req-modal .ant-modal-footer .ant-btn { border-radius: 9px !important; height: 38px !important; font-weight: 600 !important; font-size: 13px !important; }
  .rq-root .req-modal .ant-modal-footer .ant-btn-default { border-color: var(--border) !important; background: var(--bg-card) !important; color: var(--text-primary) !important; }
  .rq-root .req-modal .ant-modal-footer .ant-btn-primary { background: var(--text-primary) !important; border-color: var(--text-primary) !important; color: var(--bg-page) !important; }
  .rq-root .req-modal .ant-modal-close-x { color: var(--text-faint) !important; }
  .rq-root .req-modal .ant-modal-title { color: var(--text-primary) !important; }

  /* ── Stat card hover ── */
  .rq-root .stat-card { transition: transform 0.15s, box-shadow 0.15s; }
  .rq-root .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(15,23,42,0.08) !important; }
`;

// ─── Token accessors ─────────────────────────────────────────────────────────
const STATUS_KEYS = ["pending", "approved", "rejected"];
const TYPE_KEYS = ["advance_salary", "leave", "other"];

const VAR_MAP = {
  pending: {
    color: "--pending-color",
    bg: "--pending-bg",
    border: "--pending-border",
  },
  approved: {
    color: "--approved-color",
    bg: "--approved-bg",
    border: "--approved-border",
  },
  rejected: {
    color: "--rejected-color",
    bg: "--rejected-bg",
    border: "--rejected-border",
  },
  advance_salary: {
    color: "--type-advance-color",
    bg: "--type-advance-bg",
    border: "--type-advance-border",
  },
  leave: {
    color: "--type-leave-color",
    bg: "--type-leave-bg",
    border: "--type-leave-border",
  },
  other: {
    color: "--type-other-color",
    bg: "--type-other-bg",
    border: "--type-other-border",
  },
};

const STATUS_META = {
  pending: { label: "Pending", icon: <ClockCircleOutlined /> },
  approved: { label: "Approved", icon: <CheckCircleOutlined /> },
  rejected: { label: "Rejected", icon: <CloseCircleOutlined /> },
};

const TYPE_META = {
  advance_salary: { label: "Advance Salary" },
  leave: { label: "Leave Request" },
  other: { label: "Other" },
};

const readTokens = (el, keys) => {
  const cs = el ? getComputedStyle(el) : { getPropertyValue: () => "" };
  const g = (v) => cs.getPropertyValue(v).trim();
  return Object.fromEntries(
    keys.map((k) => [
      k,
      {
        color: g(VAR_MAP[k].color),
        bg: g(VAR_MAP[k].bg),
        border: g(VAR_MAP[k].border),
        ...(STATUS_META[k] || TYPE_META[k] || {}),
      },
    ]),
  );
};

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

// ─── Component ────────────────────────────────────────────────────────────────
const Requests = () => {
  const [dark, setDark] = useState(getIsDarkTheme);
  const [rootEl, setRootEl] = useState(null);

  const statusConfig = useMemo(
    () => readTokens(rootEl, STATUS_KEYS),
    [rootEl, dark],
  );
  const typeConfig = useMemo(
    () => readTokens(rootEl, TYPE_KEYS),
    [rootEl, dark],
  );

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseModal, setResponseModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [formData, setFormData] = useState({ status: "", response: "" });
  const [createFormData, setCreateFormData] = useState({
    request_type: "",
    subject: "",
    description: "",
  });

  const { profile } = useAuth();

  // Theme listener
  useEffect(() => {
    const sync = () => setDark(getIsDarkTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("themeModeChanged", sync);
    mq.addEventListener("change", sync);
    return () => {
      window.removeEventListener("themeModeChanged", sync);
      mq.removeEventListener("change", sync);
    };
  }, []);

  // Auth init
  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  useEffect(() => {
    if (tenantId) fetchRequests();
  }, [tenantId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("requests")
        .select(
          "*, profiles!requests_user_id_fkey (full_name, email, user_photo)",
        )
        .eq("tenant_id", tenantId);
      if (profile?.role === "project_manager")
        query = query.eq("user_id", profile.id);
      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      setRequests(data || []);
    } catch {
      message.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!profile?.id) {
      message.error("Please wait for profile to load");
      return;
    }
    if (
      !createFormData.request_type ||
      !createFormData.subject ||
      !createFormData.description
    ) {
      message.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("requests")
        .insert([
          {
            user_id: profile.id,
            tenant_id: tenantId,
            request_type: createFormData.request_type,
            subject: createFormData.subject,
            description: createFormData.description,
            status: "pending",
          },
        ]);
      if (error) throw error;
      message.success("Request submitted successfully");
      setCreateModal(false);
      setCreateFormData({ request_type: "", subject: "", description: "" });
      fetchRequests();
    } catch {
      message.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!formData.status || !formData.response) {
      message.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          status: formData.status,
          response: formData.response,
          responded_by: profile.id,
          responded_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);
      if (error) throw error;
      message.success("Response submitted successfully");
      setResponseModal(false);
      setFormData({ status: "", response: "" });
      fetchRequests();
    } catch {
      message.error("Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  // ── Columns ────────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_, rec) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {rec.profiles?.user_photo ? (
              <img
                src={rec.profiles.user_photo}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              (rec.profiles?.full_name || "?")[0].toUpperCase()
            )}
          </div>
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: "var(--text-primary)",
                lineHeight: 1.2,
              }}
            >
              {rec.profiles?.full_name || "—"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
              {rec.profiles?.email || ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "request_type",
      key: "request_type",
      render: (type) => {
        const cfg = typeConfig[type] || typeConfig.other;
        return (
          <span
            style={{
              display: "inline-block",
              padding: "3px 10px",
              borderRadius: 20,
              border: `1px solid ${cfg.border}`,
              background: cfg.bg,
              fontSize: 11,
              fontWeight: 700,
              color: cfg.color,
              letterSpacing: "0.03em",
            }}
          >
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      render: (text) => (
        <span
          style={{
            fontWeight: 500,
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const cfg = statusConfig[status] || statusConfig.pending;
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
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
        );
      },
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 140,
      render: (_, record) => {
        if (profile?.role === "project_manager") return null;
        if (record.status === "pending") {
          return (
            <Button
              icon={<MessageOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRequest(record);
                setResponseModal(true);
              }}
              style={{
                borderRadius: 8,
                height: 32,
                paddingInline: 14,
                fontWeight: 600,
                fontSize: 12,
                background: "var(--text-primary)",
                border: "none",
                color: "var(--bg-page)",
                boxShadow: "0 2px 6px rgba(15,23,42,0.2)",
              }}
            >
              Respond
            </Button>
          );
        }
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-faint)",
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 10 }} /> Done
          </span>
        );
      },
    },
  ];

  // ── Shared label helper ────────────────────────────────────────────────
  const FieldLabel = ({ children, required }) => (
    <label
      style={{
        display: "block",
        marginBottom: 6,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-tertiary)",
      }}
    >
      {children}{" "}
      {required && <span style={{ color: "var(--rejected-color)" }}>*</span>}
    </label>
  );

  return (
    <div
      ref={setRootEl}
      className={`rq-root${dark ? " dark" : ""}`}
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        padding: "28px 32px",
      }}
    >
      <style>{THEME_STYLES}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--text-primary)",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-faint)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Management
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: -0.5,
            }}
          >
            Requests
          </h1>
        </div>
        {profile?.role === "project_manager" && (
          <Button
            icon={<PlusOutlined />}
            onClick={() => setCreateModal(true)}
            style={{
              height: 40,
              paddingInline: 20,
              borderRadius: 10,
              background: "var(--text-primary)",
              border: "none",
              color: "var(--bg-page)",
              fontWeight: 700,
              fontSize: 13,
              boxShadow: "var(--shadow-btn)",
            }}
          >
            New Request
          </Button>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div
        style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}
      >
        {[
          {
            label: "Total",
            value: stats.total,
            color: "var(--text-primary)",
            bg: "var(--bg-card-alt)",
            border: "var(--border)",
            icon: <InboxOutlined />,
          },
          {
            label: "Pending",
            value: stats.pending,
            color: statusConfig.pending?.color,
            bg: statusConfig.pending?.bg,
            border: statusConfig.pending?.border,
            icon: <ClockCircleOutlined />,
          },
          {
            label: "Approved",
            value: stats.approved,
            color: statusConfig.approved?.color,
            bg: statusConfig.approved?.bg,
            border: statusConfig.approved?.border,
            icon: <CheckCircleOutlined />,
          },
          {
            label: "Rejected",
            value: stats.rejected,
            color: statusConfig.rejected?.color,
            bg: statusConfig.rejected?.bg,
            border: statusConfig.rejected?.border,
            icon: <CloseCircleOutlined />,
          },
        ].map(({ label, value, color, bg, border, icon }) => (
          <div
            key={label}
            className="stat-card"
            style={{
              flex: "1 1 120px",
              minWidth: 110,
              padding: "16px 18px",
              borderRadius: 14,
              border: `1px solid ${border}`,
              background: bg,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span style={{ color, fontSize: 13 }}>{icon}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {label}
              </span>
            </div>
            <div
              style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Table card ── */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-faint)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileTextOutlined
              style={{ color: "var(--text-faint)", fontSize: 14 }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
              }}
            >
              All Requests
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-muted)",
                background: "var(--bg-subtle)",
                borderRadius: 20,
                padding: "1px 10px",
              }}
            >
              {requests.length}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
            Click a row to expand details
          </span>
        </div>

        <Table
          className="req-table"
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          onRow={(rec) => ({
            onClick: () =>
              setExpandedRow(expandedRow === rec.id ? null : rec.id),
          })}
          expandable={{
            expandedRowKeys: expandedRow ? [expandedRow] : [],
            showExpandColumn: false,
            expandedRowRender: (record) => {
              const sCfg = statusConfig[record.status] || statusConfig.pending;
              return (
                <div
                  style={{
                    padding: "20px 24px 20px 70px",
                    background: "var(--bg-card-alt)",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                    <div style={{ flex: 2, minWidth: 220 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--text-faint)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 6,
                        }}
                      >
                        Description
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          lineHeight: 1.7,
                        }}
                      >
                        {record.description || "No description provided"}
                      </p>
                    </div>
                    {record.response && (
                      <div style={{ flex: 2, minWidth: 220 }}>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--text-faint)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 6,
                          }}
                        >
                          Response
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: "var(--text-secondary)",
                            lineHeight: 1.7,
                          }}
                        >
                          {record.response}
                        </p>
                      </div>
                    )}
                    <div style={{ minWidth: 140 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--text-faint)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 6,
                        }}
                      >
                        Status
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 14px",
                          borderRadius: 20,
                          border: `1px solid ${sCfg.border}`,
                          background: sCfg.bg,
                          fontSize: 12,
                          fontWeight: 700,
                          color: sCfg.color,
                        }}
                      >
                        {sCfg.icon} {sCfg.label}
                      </span>
                      {record.responded_at && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-faint)",
                            marginTop: 6,
                          }}
                        >
                          {new Date(record.responded_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            },
          }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => (
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                {total} requests
              </span>
            ),
          }}
          style={{ borderRadius: 0 }}
        />
      </div>

      {/* ── Create Modal ── */}
      <Modal
        className="req-modal"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "var(--bg-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlusOutlined
                style={{ color: "var(--text-tertiary)", fontSize: 16 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                New
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Submit a Request
              </div>
            </div>
          </div>
        }
        open={createModal}
        onCancel={() => {
          setCreateModal(false);
          setCreateFormData({ request_type: "", subject: "", description: "" });
        }}
        onOk={handleCreateRequest}
        confirmLoading={loading}
        okText={
          <span>
            <SendOutlined style={{ marginRight: 6 }} />
            Submit Request
          </span>
        }
        cancelText="Cancel"
        width={500}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="req-select">
            <FieldLabel required>Request Type</FieldLabel>
            <Select
              value={createFormData.request_type || undefined}
              onChange={(v) =>
                setCreateFormData({ ...createFormData, request_type: v })
              }
              placeholder="Select a type…"
              style={{ width: "100%" }}
            >
              <Select.Option value="advance_salary">
                💰 Advance Salary
              </Select.Option>
              <Select.Option value="leave">🏖️ Leave Request</Select.Option>
              <Select.Option value="other">📋 Other</Select.Option>
            </Select>
          </div>
          <div className="req-input">
            <FieldLabel required>Subject</FieldLabel>
            <Input
              value={createFormData.subject}
              onChange={(e) =>
                setCreateFormData({
                  ...createFormData,
                  subject: e.target.value,
                })
              }
              placeholder="Brief subject line…"
            />
          </div>
          <div className="req-input">
            <FieldLabel required>Description</FieldLabel>
            <TextArea
              value={createFormData.description}
              onChange={(e) =>
                setCreateFormData({
                  ...createFormData,
                  description: e.target.value,
                })
              }
              rows={4}
              placeholder="Describe your request in detail…"
              style={{ resize: "none" }}
            />
          </div>
        </div>
      </Modal>

      {/* ── Respond Modal ── */}
      <Modal
        className="req-modal"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "var(--type-leave-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageOutlined
                style={{ color: "var(--type-leave-color)", fontSize: 16 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Review
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                Respond to Request
              </div>
            </div>
          </div>
        }
        open={responseModal}
        onCancel={() => {
          setResponseModal(false);
          setFormData({ status: "", response: "" });
        }}
        onOk={handleRespond}
        confirmLoading={loading}
        okText={
          <span>
            <SendOutlined style={{ marginRight: 6 }} />
            Submit Response
          </span>
        }
        cancelText="Cancel"
        width={500}
      >
        {selectedRequest && (
          <div
            style={{
              background: "var(--bg-input)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              padding: "14px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-faint)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Request
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "var(--text-primary)",
                marginBottom: 2,
              }}
            >
              {selectedRequest.subject}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {selectedRequest.profiles?.full_name} ·{" "}
              {typeConfig[selectedRequest.request_type]?.label}
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="req-select">
            <FieldLabel required>Decision</FieldLabel>
            <Select
              value={formData.status || undefined}
              onChange={(v) => setFormData({ ...formData, status: v })}
              placeholder="Approve or reject…"
              style={{ width: "100%" }}
            >
              <Select.Option value="approved">
                <span
                  style={{ color: "var(--approved-color)", fontWeight: 600 }}
                >
                  ✓ Approve
                </span>
              </Select.Option>
              <Select.Option value="rejected">
                <span
                  style={{ color: "var(--rejected-color)", fontWeight: 600 }}
                >
                  ✕ Reject
                </span>
              </Select.Option>
            </Select>
          </div>
          <div className="req-input">
            <FieldLabel required>Response Message</FieldLabel>
            <TextArea
              value={formData.response}
              onChange={(e) =>
                setFormData({ ...formData, response: e.target.value })
              }
              rows={4}
              placeholder="Write your response here…"
              style={{ resize: "none" }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Requests;
