import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Segmented,
  Typography,
  message,
} from "antd";
import { BugOutlined, ThunderboltOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const { Title, Text } = Typography;
const { TextArea } = Input;

const getIsDarkTheme = () => {
  if (typeof window === "undefined") return false;
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const ReportProblem = () => {
  const { profile } = useAuth();
  const [dark, setDark] = useState(getIsDarkTheme);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

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

  const handleSubmit = async (values) => {
    if (!profile?.id) return;
    setSubmitting(true);
    try {
      const payload = {
        tenant_id: profile?.tenant_id || null,
        submitted_by: profile.id,
        title: values.title,
        description: values.description,
        priority: values.priority || "medium",
        source: "report_problem",
        status: "open",
      };

      const { error } = await supabase.from("support_tickets").insert([payload]);
      if (error) throw error;

      message.success("Problem reported successfully");
      form.resetFields();
    } catch (error) {
      message.error(error.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`report-problem ${dark ? "rp-dark" : ""}`}
      style={{ display: "grid", gap: 16 }}
    >
      <style>{`
        .report-problem.rp-dark .ant-card {
          background: #16171b !important;
          border: 1px solid #2b2f38 !important;
        }
        .report-problem.rp-dark .ant-card-head {
          border-bottom-color: #2b2f38 !important;
        }
        .report-problem.rp-dark .ant-card-head-title,
        .report-problem.rp-dark .ant-typography,
        .report-problem.rp-dark .ant-form-item-label > label {
          color: #f3f4f6 !important;
        }
        .report-problem.rp-dark .ant-typography-secondary {
          color: #9ca3af !important;
        }
        .report-problem.rp-dark .ant-input,
        .report-problem.rp-dark .ant-input-affix-wrapper,
        .report-problem.rp-dark .ant-input-affix-wrapper > input,
        .report-problem.rp-dark .ant-segmented {
          background: #1b1c21 !important;
          border-color: #2b2f38 !important;
          color: #f3f4f6 !important;
        }
        .report-problem.rp-dark .ant-input::placeholder,
        .report-problem.rp-dark textarea.ant-input::placeholder {
          color: #6b7280 !important;
        }
        .report-problem.rp-dark .ant-input-affix-wrapper .anticon {
          color: #9ca3af !important;
        }
        .report-problem.rp-dark .ant-segmented-item-label {
          color: #d1d5db !important;
        }
        .report-problem.rp-dark .ant-segmented-item-selected {
          background: #ffffff !important;
        }
        .report-problem.rp-dark .ant-segmented-item-selected .ant-segmented-item-label {
          color: #141416 !important;
          font-weight: 600;
        }
        .report-problem.rp-dark .ant-alert {
          border: 1px solid #2b2f38 !important;
        }
        .report-problem.rp-dark .ant-alert-info {
          background: rgba(59,130,246,0.12) !important;
        }
        .report-problem.rp-dark .ant-alert-warning {
          background: rgba(245,158,11,0.14) !important;
        }
        .report-problem.rp-dark .ant-alert-success {
          background: rgba(16,185,129,0.12) !important;
        }
        .report-problem.rp-dark .ant-alert-message,
        .report-problem.rp-dark .ant-alert-description {
          color: #e5e7eb !important;
        }
      `}</style>
      <Card
        bordered={false}
        style={{
          background: dark
            ? "linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)"
            : "linear-gradient(120deg, #fff7e6 0%, #f0f5ff 100%)",
          border: `1px solid ${dark ? "#2b2f38" : "#faead1"}`,
        }}
      >
        <Title level={3} style={{ marginBottom: 4, color: dark ? "#f3f4f6" : undefined }}>
          Report a Problem
        </Title>
        <Text type="secondary" style={{ color: dark ? "#9ca3af" : undefined }}>
          Share issues quickly and we will convert them into a tracked support ticket.
        </Text>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card style={dark ? { borderColor: "#2b2f38" } : undefined}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ priority: "medium" }}
            >
              <Form.Item
                label="Problem Title"
                name="title"
                rules={[{ required: true, message: "Please add a short title" }]}
              >
                <Input
                  prefix={<BugOutlined />}
                  placeholder="Example: Dashboard data not loading"
                />
              </Form.Item>

              <Form.Item
                label="Describe the Problem"
                name="description"
                rules={[{ required: true, message: "Please describe the problem" }]}
              >
                <TextArea
                  rows={7}
                  placeholder="What were you doing, what happened, and what did you expect?"
                />
              </Form.Item>

              <Form.Item label="Priority" name="priority">
                <Segmented
                  options={[
                    { label: "Low", value: "low" },
                    { label: "Medium", value: "medium" },
                    { label: "High", value: "high" },
                    { label: "Urgent", value: "urgent" },
                  ]}
                />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={submitting}>
                Submit Report
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="Before You Submit"
            style={dark ? { borderColor: "#2b2f38" } : undefined}
          >
            <div style={{ display: "grid", gap: 10 }}>
              <Alert
                showIcon
                type="info"
                icon={<InfoCircleOutlined />}
                message="Add exact page and action steps."
              />
              <Alert
                showIcon
                type="warning"
                icon={<ThunderboltOutlined />}
                message="Use High/Urgent for blocking issues."
              />
              <Alert
                showIcon
                type="success"
                message="Your report goes directly to support ticketing."
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportProblem;
