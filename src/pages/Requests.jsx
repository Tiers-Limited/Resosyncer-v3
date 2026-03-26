import { useState, useEffect } from "react";
import { Table, Button, Tag, message, Modal, Input, Select } from "antd";
import {
  PlusOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  MessageOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const { TextArea } = Input;

const STATUS_CONFIG = {
  pending: {
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: <ClockCircleOutlined />,
    label: "Pending",
  },
  approved: {
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    icon: <CheckCircleOutlined />,
    label: "Approved",
  },
  rejected: {
    color: "#e11d48",
    bg: "#fff1f2",
    border: "#fecdd3",
    icon: <CloseCircleOutlined />,
    label: "Rejected",
  },
};

const TYPE_CONFIG = {
  advance_salary: {
    label: "Advance Salary",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  leave: {
    label: "Leave Request",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#bae6fd",
  },
  other: { label: "Other", color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
};

const Requests = () => {
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

  // ── Fetch tenant_id from auth ──────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
        setTenantId(profile?.tenant_id ?? null);
      } catch (e) {
        console.error(e);
      }
    };
    init();
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
          `*, profiles!requests_user_id_fkey (full_name, email, user_photo)`,
        )
        .eq("tenant_id", tenantId); // 👈 tenant filter

      if (profile?.role === "project_manager") {
        query = query.eq("user_id", profile.id);
      }

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
      const { error } = await supabase.from("requests").insert([
        {
          user_id: profile.id,
          tenant_id: tenantId, // 👈 tenant_id on insert
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

  // ── Stats ──────────────────────────────────────────────────────────────
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
              background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
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
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              {rec.profiles?.full_name || "—"}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
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
        const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other;
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
        <span style={{ fontWeight: 500, fontSize: 13, color: "#1e293b" }}>
          {text}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
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
        <span style={{ fontSize: 12, color: "#64748b" }}>
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
              onClick={() => {
                setSelectedRequest(record);
                setResponseModal(true);
              }}
              style={{
                borderRadius: 8,
                height: 32,
                paddingInline: 14,
                fontWeight: 600,
                fontSize: 12,
                background: "#0f172a",
                border: "none",
                color: "#fff",
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
              color: "#94a3b8",
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 10 }} /> Done
          </span>
        );
      },
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "28px 32px",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Outfit', sans-serif !important; box-sizing: border-box; }

        .req-table .ant-table { background: transparent !important; }
        .req-table .ant-table-thead > tr > th {
          background: #f9fafb !important; color: #94a3b8 !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase; letter-spacing: 0.06em;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 11px 16px !important;
        }
        .req-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f9fafb !important;
          padding: 14px 16px !important;
          vertical-align: middle;
        }
        .req-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .req-table .ant-table-tbody > tr:hover > td { background: #f8fafc !important; }
        .req-table .ant-table-row { cursor: pointer; }
        .req-table .ant-table-expanded-row > td { background: #fafafa !important; padding: 0 !important; }
        .req-table .ant-pagination-item-active { border-color: #0f172a !important; }
        .req-table .ant-pagination-item-active a { color: #0f172a !important; }

        .req-input .ant-input,
        .req-input textarea,
        .req-select .ant-select-selector {
          border-radius: 9px !important;
          border-color: #e2e8f0 !important;
          font-size: 13px !important;
          padding: 9px 13px !important;
          background: #f8fafc !important;
          transition: all 0.15s;
        }
        .req-input .ant-input:focus,
        .req-input textarea:focus,
        .req-select .ant-select-focused .ant-select-selector {
          border-color: #6366f1 !important;
          background: #fff !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08) !important;
        }
        .req-select .ant-select-selector { height: auto !important; padding: 6px 13px !important; }

        .stat-card { transition: transform 0.15s, box-shadow 0.15s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(15,23,42,0.08) !important; }

        .req-modal .ant-modal-content { border-radius: 18px !important; overflow: hidden; padding: 0 !important; }
        .req-modal .ant-modal-header { padding: 22px 28px 18px !important; border-bottom: 1px solid #f1f5f9 !important; margin: 0 !important; }
        .req-modal .ant-modal-body { padding: 24px 28px !important; }
        .req-modal .ant-modal-footer { padding: 16px 28px !important; border-top: 1px solid #f1f5f9 !important; margin: 0 !important; }
        .req-modal .ant-modal-footer .ant-btn { border-radius: 9px !important; height: 38px !important; font-weight: 600 !important; font-size: 13px !important; }
        .req-modal .ant-modal-footer .ant-btn-primary { background: #0f172a !important; border-color: #0f172a !important; }
        .req-modal .ant-modal-footer .ant-btn-primary:hover { background: #1e293b !important; }
      `}</style>

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
              Management
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: "#0f172a",
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
              background: "#0f172a",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              boxShadow: "0 4px 12px rgba(15,23,42,0.25)",
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
            color: "#0f172a",
            bg: "#f8fafc",
            border: "#e2e8f0",
            icon: <InboxOutlined />,
          },
          {
            label: "Pending",
            value: stats.pending,
            ...STATUS_CONFIG.pending,
            icon: <ClockCircleOutlined />,
          },
          {
            label: "Approved",
            value: stats.approved,
            ...STATUS_CONFIG.approved,
            icon: <CheckCircleOutlined />,
          },
          {
            label: "Rejected",
            value: stats.rejected,
            ...STATUS_CONFIG.rejected,
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
              boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
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
                  color: "#94a3b8",
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

      {/* ── Table ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #f1f5f9",
          boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f9fafb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileTextOutlined style={{ color: "#94a3b8", fontSize: 14 }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
              All Requests
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#64748b",
                background: "#f1f5f9",
                borderRadius: 20,
                padding: "1px 10px",
              }}
            >
              {requests.length}
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
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
              const statusCfg =
                STATUS_CONFIG[record.status] || STATUS_CONFIG.pending;
              return (
                <div
                  style={{
                    padding: "20px 24px 20px 70px",
                    background: "#fafafa",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                    <div style={{ flex: 2, minWidth: 220 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#94a3b8",
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
                          color: "#1e293b",
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
                            color: "#94a3b8",
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
                            color: "#1e293b",
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
                          color: "#94a3b8",
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
                          border: `1px solid ${statusCfg.border}`,
                          background: statusCfg.bg,
                          fontSize: 12,
                          fontWeight: 700,
                          color: statusCfg.color,
                        }}
                      >
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                      {record.responded_at && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#94a3b8",
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
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
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
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlusOutlined style={{ color: "#475569", fontSize: 16 }} />
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
                New
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
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
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Request Type <span style={{ color: "#e11d48" }}>*</span>
            </label>
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
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Subject <span style={{ color: "#e11d48" }}>*</span>
            </label>
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
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Description <span style={{ color: "#e11d48" }}>*</span>
            </label>
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
                background: "#f0f9ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageOutlined style={{ color: "#0369a1", fontSize: 16 }} />
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
                Review
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
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
              background: "#f8fafc",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: "14px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
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
                color: "#0f172a",
                marginBottom: 2,
              }}
            >
              {selectedRequest.subject}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {selectedRequest.profiles?.full_name} ·{" "}
              {TYPE_CONFIG[selectedRequest.request_type]?.label}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="req-select">
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Decision <span style={{ color: "#e11d48" }}>*</span>
            </label>
            <Select
              value={formData.status || undefined}
              onChange={(v) => setFormData({ ...formData, status: v })}
              placeholder="Approve or reject…"
              style={{ width: "100%" }}
            >
              <Select.Option value="approved">
                <span style={{ color: "#059669", fontWeight: 600 }}>
                  ✓ Approve
                </span>
              </Select.Option>
              <Select.Option value="rejected">
                <span style={{ color: "#e11d48", fontWeight: 600 }}>
                  ✕ Reject
                </span>
              </Select.Option>
            </Select>
          </div>

          <div className="req-input">
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Response Message <span style={{ color: "#e11d48" }}>*</span>
            </label>
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
