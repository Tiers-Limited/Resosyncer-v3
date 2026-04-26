import { useState, useEffect } from "react";
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, message, Spin } from "antd";
import {
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  BellOutlined,
  BarChartOutlined,
  SyncOutlined,
  TeamOutlined,
  InboxOutlined,
  LockOutlined,
  UsergroupAddOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const { TextArea } = Input;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const tableTypeChipStyle = (dark) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  border: `1px solid ${dark ? "rgba(147,197,253,.4)" : "#93c5fd"}`,
  color: dark ? "#bfdbfe" : "#0369a1",
  background: dark ? "rgba(59,130,246,.15)" : "#e0f2fe",
});

const tableStatusChipStyle = (status, dark) => {
  if (status === "approved") {
    return {
      color: dark ? "#86efac" : "#059669",
      background: dark ? "rgba(34,197,94,.16)" : "#ecfdf5",
      border: `1px solid ${dark ? "rgba(34,197,94,.38)" : "#6ee7b7"}`,
    };
  }
  if (status === "rejected") {
    return {
      color: dark ? "#fda4af" : "#e11d48",
      background: dark ? "rgba(244,63,94,.14)" : "#fff1f2",
      border: `1px solid ${dark ? "rgba(244,63,94,.38)" : "#fecdd3"}`,
    };
  }
  return {
    color: dark ? "#fcd34d" : "#b45309",
    background: dark ? "rgba(245,158,11,.15)" : "#fffbeb",
    border: `1px solid ${dark ? "rgba(245,158,11,.35)" : "#fde68a"}`,
  };
};

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const normalizePlanTier = (planName) => {
  const value = String(planName || "").trim().toLowerCase();
  if (value.includes("starter")) return "starter";
  if (value.includes("growth")) return "growth";
  if (value.includes("pro")) return "pro";
  if (value.includes("enterprise")) return "enterprise";
  return "unknown";
};

const RequestsLockedPaywall = ({ dark = false, planName, role }) => {
  const isNonOwnerRole = role === "employee" || role === "project_manager";
  const helperText = isNonOwnerRole
    ? "Ask your company owner to upgrade to unlock Requests"
    : "Upgrade your workspace plan to unlock Requests.";

  const features = [
    {
      icon: <FileTextOutlined />,
      title: "Employee Requests",
      desc: "Handle employee requests in one place with full context and history.",
    },
    {
      icon: <CheckCircleOutlined />,
      title: "Approve or Reject",
      desc: "Review requests quickly and respond with clear decisions.",
    },
    {
      icon: <BellOutlined />,
      title: "Smart Follow-ups",
      desc: "Keep every request moving with status visibility and response trails.",
    },
    {
      icon: <BarChartOutlined />,
      title: "Request Insights",
      desc: "Track pending, approved, and rejected requests across teams.",
    },
    {
      icon: <SyncOutlined />,
      title: "Workflow Consistency",
      desc: "Use a structured process for salary advances, leave, and custom cases.",
    },
    {
      icon: <TeamOutlined />,
      title: "Team Management",
      desc: "Support managers and HR with one shared request workflow.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark ? "#141416" : "#f8fafc",
        color: dark ? "#f1f5f9" : "#0f172a",
      }}
    >
      <div
        style={{
          background: dark ? "#141416" : "#fff",
          borderBottom: `1px solid ${dark ? "#2a2a31" : "#e2e8f0"}`,
          padding: "20px 28px",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800 }}>Requests</h1>
        <p style={{ margin: 0, color: dark ? "#94a3b8" : "#64748b", fontSize: 13 }}>
          Employee requests -- approvals -- response history
        </p>
      </div>

      <div style={{ padding: "0 28px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 12,
            marginBottom: 24,
            filter: "blur(6px)",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.45,
          }}
        >
          {[
            ["#3b82f6", "24", "Total Requests"],
            ["#f59e0b", "7", "Pending"],
            ["#22c55e", "13", "Approved"],
            ["#ef4444", "4", "Rejected"],
          ].map(([color, val, label]) => (
            <div
              key={label}
              style={{
                background: dark ? "#1a1b1f" : "#fff",
                border: `1px solid ${dark ? "#2a2a31" : "#e2e8f0"}`,
                borderRadius: 14,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color,
                }}
              >
                <InboxOutlined style={{ fontSize: 18 }} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 12, color: dark ? "#94a3b8" : "#64748b", marginTop: 3, fontWeight: 500 }}>
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "relative",
            background: dark ? "#1a1b1f" : "#fff",
            border: `1px solid ${dark ? "#2a2a31" : "#e2e8f0"}`,
            borderRadius: 20,
            overflow: "hidden",
            padding: "44px 40px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 14px",
                background: dark ? "rgba(99,102,241,0.18)" : "#eef2ff",
                border: `1px solid ${dark ? "rgba(129,140,248,0.35)" : "#c7d2fe"}`,
                borderRadius: 30,
              }}
            >
              <LockOutlined style={{ color: dark ? "#818cf8" : "#4f46e5" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: dark ? "#818cf8" : "#4f46e5" }}>
                Locked Feature
              </span>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 30, fontWeight: 900, lineHeight: 1.15 }}>
              Manage employee requests
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                in one workflow
              </span>
            </h2>
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: 15,
              color: dark ? "#94a3b8" : "#64748b",
              maxWidth: 520,
              margin: "0 auto 28px",
              lineHeight: 1.6,
            }}
          >
            Your current plan is <strong>{planName || "Starter"}</strong>. Upgrade
            to handle employee requests, approve or reject decisions, and keep a
            full response history in one place.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 12,
              maxWidth: 760,
              margin: "0 auto 28px",
            }}
          >
            {features.map((f) => (
              <div
                key={f.title}
                style={{
                  padding: "16px 18px",
                  background: dark ? "#17181c" : "#f9fafb",
                  border: `1px solid ${dark ? "#2a2a31" : "#e2e8f0"}`,
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: dark ? "#141416" : "#fff",
                    border: `1px solid ${dark ? "#2a2a31" : "#e2e8f0"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: dark ? "#818cf8" : "#4f46e5",
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: dark ? "#94a3b8" : "#64748b", lineHeight: 1.5 }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <p
              style={{
                margin: "0 0 12px",
                color: dark ? "#94a3b8" : "#64748b",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {helperText}
            </p>

            {!isNonOwnerRole && (
              <a
                href="/subscription"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 32px",
                  background: "linear-gradient(135deg,#1e40af 0%,#7c3aed 100%)",
                  color: "#fff",
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 15,
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
                }}
              >
                <UsergroupAddOutlined />
                Upgrade to unlock Requests
                <ArrowRightOutlined />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [dark, setDark] = useState(getIsDarkTheme);
  const [planLoading, setPlanLoading] = useState(true);
  const [orgPlan, setOrgPlan] = useState(null);
  const [form] = Form.useForm();
  const { profile } = useAuth();

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);
    if (typeof media.addEventListener === "function") media.addEventListener("change", syncTheme);
    else if (typeof media.addListener === "function") media.addListener(syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      if (typeof media.removeEventListener === "function") media.removeEventListener("change", syncTheme);
      else if (typeof media.removeListener === "function") media.removeListener(syncTheme);
    };
  }, []);

  useEffect(() => {
    if (profile?.id) {
      fetchPlan();
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const fetchPlan = async () => {
    setPlanLoading(true);
    try {
      const tenantId = profile?.tenant_id;
      if (!tenantId) {
        setOrgPlan(null);
        return;
      }
      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("plan")
        .eq("id", tenantId)
        .maybeSingle();
      if (error) throw error;
      setOrgPlan(tenant?.plan || null);
    } catch (err) {
      console.error("Failed to load plan:", err);
      setOrgPlan(null);
    } finally {
      setPlanLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      message.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (values) => {
    if (!profile?.tenant_id) {
      message.error("Tenant not found. Please relogin and try again.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("requests").insert([
        {
          user_id: profile.id,
          tenant_id: profile.tenant_id,
          request_type: values.request_type,
          subject: values.subject,
          description: values.description,
          leave_date:
            values.request_type === "leave" && values.leave_date
              ? values.leave_date.format("YYYY-MM-DD")
              : null,
          status: "pending",
        },
      ]);

      if (error) throw error;

      message.success("Request submitted successfully");
      setModalVisible(false);
      form.resetFields();
      fetchRequests();
    } catch (error) {
      message.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Type",
      dataIndex: "request_type",
      key: "request_type",
      render: (type) => {
        const labels = {
          advance_salary: "Advance Salary",
          leave: "Leave Request",
          other: "Other",
        };
        return <span style={tableTypeChipStyle(dark)}>{labels[type] || type.toUpperCase()}</span>;
      },
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      render: (subject) => (
        <span style={{ fontWeight: 600, color: dark ? "#f8fafc" : "#0f172a" }}>{subject || "Untitled request"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const chip = tableStatusChipStyle(status, dark);
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              ...chip,
            }}
          >
            {status === "approved" ? (
              <CheckCircleOutlined />
            ) : status === "rejected" ? (
              <CloseCircleOutlined />
            ) : (
              <ClockCircleOutlined />
            )}
            {status ? `${status.charAt(0).toUpperCase()}${status.slice(1)}` : "Pending"}
          </span>
        );
      },
    },
    {
      title: "Leave Date",
      dataIndex: "leave_date",
      key: "leave_date",
      render: (leaveDate, record) =>
        record.request_type === "leave" && leaveDate
          ? formatDate(leaveDate)
          : "-",
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => formatDate(date),
    },
    {
      title: "",
      key: "state",
      width: 120,
      render: (_, record) => {
        const isDone = record.status === "approved";
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: isDone
                ? dark
                  ? "#86efac"
                  : "#10b981"
                : dark
                ? "#94a3b8"
                : "#64748b",
            }}
          >
            {isDone ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
            {isDone ? "Done" : "Open"}
          </span>
        );
      },
    },
  ];

  const isRequestsLocked = normalizePlanTier(orgPlan) === "starter";
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  if (planLoading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin />
      </div>
    );
  }

  if (isRequestsLocked) {
    return (
      <RequestsLockedPaywall
        dark={dark}
        planName={orgPlan}
        role={profile?.role}
      />
    );
  }

  return (
    <div
      style={{
        background: dark ? "#141416" : "#f8fafc",
        minHeight: "100vh",
        padding: "22px 20px 28px",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                lineHeight: 1.08,
                fontWeight: 800,
                color: dark ? "#f8fafc" : "#0f172a",
              }}
            >
              Requests
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: dark ? "#94a3b8" : "#64748b",
              }}
            >
              Track your requests, approvals, and response history
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            style={{ backgroundColor: "#001529" }}
          >
            New Request
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          {
            key: "total",
            label: "Total",
            value: stats.total,
            color: dark ? "#93c5fd" : "#1d4ed8",
            bg: dark ? "rgba(59,130,246,.14)" : "#eff6ff",
            border: dark ? "rgba(59,130,246,.35)" : "#bfdbfe",
            icon: <InboxOutlined />,
          },
          {
            key: "pending",
            label: "Pending",
            value: stats.pending,
            color: dark ? "#fcd34d" : "#d97706",
            bg: dark ? "rgba(245,158,11,.14)" : "#fffbeb",
            border: dark ? "rgba(245,158,11,.35)" : "#fde68a",
            icon: <SyncOutlined />,
          },
          {
            key: "approved",
            label: "Approved",
            value: stats.approved,
            color: dark ? "#86efac" : "#059669",
            bg: dark ? "rgba(34,197,94,.14)" : "#ecfdf5",
            border: dark ? "rgba(34,197,94,.35)" : "#86efac",
            icon: <CheckCircleOutlined />,
          },
          {
            key: "rejected",
            label: "Rejected",
            value: stats.rejected,
            color: dark ? "#fda4af" : "#e11d48",
            bg: dark ? "rgba(244,63,94,.14)" : "#fff1f2",
            border: dark ? "rgba(244,63,94,.35)" : "#fecdd3",
            icon: <BellOutlined />,
          },
        ].map((item) => (
          <div
            key={item.key}
            style={{
              border: `1px solid ${item.border}`,
              background: item.bg,
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 10,
                textTransform: "uppercase",
                fontWeight: 700,
                color: dark ? "#94a3b8" : "#64748b",
                letterSpacing: 0.6,
              }}
            >
              {item.icon}
              {item.label}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 30,
                lineHeight: 1,
                fontWeight: 800,
                color: item.color,
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <Card
        style={{
          borderRadius: 12,
          borderColor: dark ? "#2a2a31" : "#e2e8f0",
          background: dark ? "#1a1b1f" : "#ffffff",
        }}
        bodyStyle={{ padding: 14 }}
      >
        <style>{`
          .employee-requests-table-wrap {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 6px;
          }
          .employee-requests-table-hint {
            font-size: 12px;
            color: ${dark ? "#94a3b8" : "#64748b"};
          }
          .employee-requests-table .ant-table {
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid ${dark ? "#2a2a31" : "#e2e8f0"};
          }
          .employee-requests-table .ant-table-thead > tr > th {
            font-size: 11px !important;
            text-transform: uppercase;
            letter-spacing: .07em;
            font-weight: 700;
            color: ${dark ? "#94a3b8" : "#64748b"} !important;
            background: ${dark ? "#16171b" : "#f8fafc"} !important;
            border-bottom: 1px solid ${dark ? "#2a2a31" : "#e2e8f0"} !important;
          }
          .employee-requests-table .ant-table-tbody > tr > td {
            padding-top: 16px !important;
            padding-bottom: 16px !important;
            border-bottom: 1px solid ${dark ? "#2a2a31" : "#e2e8f0"} !important;
            font-size: 13px;
          }
          .employee-requests-table .ant-table-tbody > tr.ant-table-row:hover > td {
            background: ${dark ? "rgba(148,163,184,.08)" : "#f8fafc"} !important;
          }
          .employee-requests-table .ant-table-expanded-row > td {
            background: ${dark ? "#15161a" : "#f8fafc"} !important;
          }
          .employee-requests-table .ant-pagination {
            margin-top: 14px !important;
          }
          .employee-requests-table .ant-pagination .ant-pagination-item,
          .employee-requests-table .ant-pagination .ant-pagination-prev,
          .employee-requests-table .ant-pagination .ant-pagination-next {
            border-radius: 10px;
          }
          .employee-requests-table .ant-pagination .ant-pagination-total-text {
            font-size: 12px;
            color: ${dark ? "#94a3b8" : "#64748b"};
          }
          .employee-requests-table .ant-empty-description {
            font-size: 13px;
            color: ${dark ? "#94a3b8" : "#64748b"};
          }
        `}</style>
        <div className="employee-requests-table-wrap">
          <span className="employee-requests-table-hint">Click a row to expand details</span>
        </div>
        <Table
          className="employee-requests-table"
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          size="middle"
          expandable={{
            expandedRowRender: (record) => (
              <div
                style={{
                  border: `1px solid ${dark ? "#2a2a31" : "#e2e8f0"}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  background: dark ? "#1a1b1f" : "#ffffff",
                }}
              >
                <div style={{ marginBottom: record.response ? 12 : 0 }}>
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: ".03em",
                      textTransform: "uppercase",
                      color: dark ? "#94a3b8" : "#64748b",
                    }}
                  >
                    Description
                  </p>
                  <p style={{ margin: 0, color: dark ? "#e2e8f0" : "#334155" }}>
                    {record.description || "No description provided"}
                  </p>
                </div>
                {record.response && (
                  <div>
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: ".03em",
                        textTransform: "uppercase",
                        color: dark ? "#94a3b8" : "#64748b",
                      }}
                    >
                      Admin Response
                    </p>
                    <p style={{ margin: 0, color: dark ? "#e2e8f0" : "#334155" }}>{record.response}</p>
                    {record.responded_at && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: 12,
                          color: dark ? "#94a3b8" : "#64748b",
                        }}
                      >
                        Responded on {new Date(record.responded_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ),
          }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `${total} requests`,
            size: "small",
          }}
        />
      </Card>

      <Modal
        title="Create New Request"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRequest}>
          <Form.Item
            name="request_type"
            label="Request Type"
            rules={[{ required: true, message: "Please select request type" }]}
          >
            <Select placeholder="Select request type">
              <Select.Option value="advance_salary">Advance Salary</Select.Option>
              <Select.Option value="leave">Leave Request</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: "Please enter subject" }]}
          >
            <Input placeholder="Enter subject" />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.request_type !== curr.request_type}>
            {({ getFieldValue }) =>
              getFieldValue("request_type") === "leave" ? (
                <Form.Item
                  name="leave_date"
                  label="Leave Date"
                  rules={[{ required: true, message: "Please select leave date" }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format="YYYY-MM-DD"
                    placeholder="Select leave date"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <TextArea rows={4} placeholder="Enter detailed description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeRequests;
