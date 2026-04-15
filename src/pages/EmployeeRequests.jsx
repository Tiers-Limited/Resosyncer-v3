import { useState, useEffect } from "react";
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message, Spin } from "antd";
import {
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
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

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "system";
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
          Employee requests · approvals · response history
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
    setLoading(true);
    try {
      const { error } = await supabase.from("requests").insert([
        {
          user_id: profile.id,
          request_type: values.request_type,
          subject: values.subject,
          description: values.description,
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
        return <Tag color="blue">{labels[type] || type.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colors = {
          pending: "orange",
          approved: "green",
          rejected: "red",
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  const isRequestsLocked = normalizePlanTier(orgPlan) === "starter";

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Requests</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
          style={{ backgroundColor: "#001529" }}
        >
          New Request
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-4 bg-gray-50 rounded">
                <div className="mb-4">
                  <p className="mb-2">
                    <strong>Description:</strong>
                  </p>
                  <p>{record.description || "No description provided"}</p>
                </div>
                {record.response && (
                  <div>
                    <p className="mb-2">
                      <strong>Admin Response:</strong>
                    </p>
                    <p className="text-gray-700">{record.response}</p>
                    {record.responded_at && (
                      <p className="text-sm text-gray-500 mt-2">
                        Responded on: {new Date(record.responded_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ),
          }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} requests`,
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
