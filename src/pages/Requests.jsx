import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  message,
  Modal,
  Input,
  Select,
  Switch,
} from "antd";
import { PlusOutlined, BulbOutlined } from "@ant-design/icons";
import { theme } from "antd";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const { TextArea } = Input;

const Requests = () => {
  const { token } = theme.useToken();
  const isDark =
    token.colorBgContainer === "#1f2937" || token.colorBgLayout === "#111827";

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [responseModal, setResponseModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({ status: "", response: "" });
  const [createFormData, setCreateFormData] = useState({
    request_type: "",
    subject: "",
    description: "",
  });
  const { profile } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase.from("requests").select(`
          *,
          profiles!requests_user_id_fkey (
            full_name,
            email
          )
        `);

      if (profile?.role === "project_manager") {
        query = query.eq("user_id", profile.id);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      message.error("Failed to submit response");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Employee",
      dataIndex: ["profiles", "full_name"],
      key: "employee",
      render: (text) => (
        <span className={isDark ? "text-gray-200" : "text-gray-900"}>
          {text}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "request_type",
      key: "request_type",
      render: (type) => <Tag color="blue">{type.toUpperCase()}</Tag>,
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      render: (text) => (
        <span className={isDark ? "text-gray-200" : "text-gray-900"}>
          {text}
        </span>
      ),
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
      render: (date) => (
        <span className={isDark ? "text-gray-300" : "text-gray-600"}>
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        if (profile?.role === "project_manager") {
          return (
            <span className={isDark ? "text-gray-500" : "text-gray-400"}>
              -
            </span>
          );
        }
        return record.status === "pending" ? (
          <Button
            type="link"
            onClick={() => {
              setSelectedRequest(record);
              setResponseModal(true);
            }}
          >
            Respond
          </Button>
        ) : (
          <span className={isDark ? "text-gray-500" : "text-gray-400"}>
            Responded
          </span>
        );
      },
    },
  ];

  return (
    <div
      className={`min-h-screen p-6 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1
          className={`text-2xl font-bold ${
            isDark ? "text-gray-100" : "text-gray-900"
          }`}
        >
          Requests
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
          </div>
          {profile?.role === "project_manager" && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModal(true)}
              style={{ backgroundColor: "#2563eb" }}
            >
              New Request
            </Button>
          )}
        </div>
      </div>

      <Card
        className={isDark ? "dark-card" : ""}
        bodyStyle={{
          padding: 0,
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
        }}
      >
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          className={isDark ? "dark-table" : ""}
          expandable={{
            expandedRowRender: (record) => (
              <div
                className={`p-4 rounded ${
                  isDark ? "bg-gray-800" : "bg-gray-50"
                }`}
              >
                <p
                  className={`mb-2 ${
                    isDark ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  <strong>Description:</strong>
                </p>
                <p
                  className={`mb-4 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {record.description || "No description provided"}
                </p>
                {record.response && (
                  <>
                    <p
                      className={`mb-2 ${
                        isDark ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      <strong>Response:</strong>
                    </p>
                    <p className={isDark ? "text-gray-300" : "text-gray-700"}>
                      {record.response}
                    </p>
                  </>
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
        title={
          <span className={isDark ? "text-gray-100" : "text-gray-900"}>
            Create New Request
          </span>
        }
        open={createModal}
        onCancel={() => {
          setCreateModal(false);
          setCreateFormData({ request_type: "", subject: "", description: "" });
        }}
        onOk={handleCreateRequest}
        confirmLoading={loading}
        className={isDark ? "dark-modal" : ""}
      >
        <div className="space-y-4">
          <div>
            <label
              className={`block mb-2 text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Request Type *
            </label>
            <Select
              value={createFormData.request_type}
              onChange={(value) =>
                setCreateFormData({ ...createFormData, request_type: value })
              }
              placeholder="Select request type"
              className="w-full"
            >
              <Select.Option value="advance_salary">
                Advance Salary
              </Select.Option>
              <Select.Option value="leave">Leave Request</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </div>

          <div>
            <label
              className={`block mb-2 text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Subject *
            </label>
            <Input
              value={createFormData.subject}
              onChange={(e) =>
                setCreateFormData({
                  ...createFormData,
                  subject: e.target.value,
                })
              }
              placeholder="Enter subject"
            />
          </div>

          <div>
            <label
              className={`block mb-2 text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Description *
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
              placeholder="Enter detailed description"
            />
          </div>
        </div>
      </Modal>

      <Modal
        title={
          <span className={isDark ? "text-gray-100" : "text-gray-900"}>
            Respond to Request
          </span>
        }
        open={responseModal}
        onCancel={() => {
          setResponseModal(false);
          setFormData({ status: "", response: "" });
        }}
        onOk={handleRespond}
        confirmLoading={loading}
        className={isDark ? "dark-modal" : ""}
      >
        <div className="space-y-4">
          <div>
            <label
              className={`block mb-2 text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Decision *
            </label>
            <Select
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
              placeholder="Select decision"
              className="w-full"
            >
              <Select.Option value="approved">Approve</Select.Option>
              <Select.Option value="rejected">Reject</Select.Option>
            </Select>
          </div>

          <div>
            <label
              className={`block mb-2 text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Response Message *
            </label>
            <TextArea
              value={formData.response}
              onChange={(e) =>
                setFormData({ ...formData, response: e.target.value })
              }
              rows={4}
              placeholder="Enter your response"
            />
          </div>
        </div>
      </Modal>

      <style>{`
        ${
          isDark
            ? `
          .dark-card {
            background-color: #1f2937;
            border-color: #374151;
          }
          
          .dark-table .ant-table {
            background-color: #1f2937;
            color: #f3f4f6;
          }
          
          .dark-table .ant-table-thead > tr > th {
            background-color: #111827;
            color: #d1d5db;
            border-bottom-color: #374151;
          }
          
          .dark-table .ant-table-tbody > tr {
            background-color: #1f2937;
          }
          
          .dark-table .ant-table-tbody > tr:hover > td {
            background-color: #374151;
          }
          
          .dark-table .ant-table-tbody > tr > td {
            border-bottom-color: #374151;
            color: #f3f4f6;
          }
          
          .dark-table .ant-table-placeholder {
            background-color: #1f2937;
            color: #9ca3af;
          }
          
          .dark-table .ant-pagination-item {
            background-color: #374151;
            border-color: #4b5563;
          }
          
          .dark-table .ant-pagination-item a {
            color: #d1d5db;
          }
          
          .dark-table .ant-pagination-item-active {
            background-color: #2563eb;
            border-color: #2563eb;
          }
          
          .dark-table .ant-pagination-item-active a {
            color: #ffffff;
          }
          
          .dark-table .ant-pagination-prev button,
          .dark-table .ant-pagination-next button {
            color: #d1d5db;
          }
          
          .dark-table .ant-select-selector {
            background-color: #374151 !important;
            border-color: #4b5563 !important;
            color: #f3f4f6 !important;
          }
          
          .dark-table .ant-pagination-options-quick-jumper input {
            background-color: #374151;
            border-color: #4b5563;
            color: #f3f4f6;
          }
          
          .dark-table .ant-table-expanded-row > td {
            background-color: #1f2937;
          }
          
          .dark-modal .ant-modal-content {
            background-color: #1f2937;
            color: #f3f4f6;
          }
          
          .dark-modal .ant-modal-header {
            background-color: #1f2937;
            border-bottom-color: #374151;
          }
          
          .dark-modal .ant-modal-footer {
            background-color: #1f2937;
            border-top-color: #374151;
          }
          
          .dark-modal .ant-modal-close-x {
            color: #d1d5db;
          }
          
          .dark-modal .ant-input,
          .dark-modal .ant-input-textarea textarea {
            background-color: #374151;
            border-color: #4b5563;
            color: #f3f4f6;
          }
          
          .dark-modal .ant-input::placeholder,
          .dark-modal .ant-input-textarea textarea::placeholder {
            color: #6b7280;
          }
          
          .dark-modal .ant-select-selector {
            background-color: #374151 !important;
            border-color: #4b5563 !important;
            color: #f3f4f6 !important;
          }
          
          .dark-modal .ant-select-arrow {
            color: #9ca3af;
          }
        `
            : ""
        }
      `}</style>
    </div>
  );
};

export default Requests;
