import { useState, useEffect } from "react";
import {
  Plus,
  Users,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  XCircle,
  Edit2,
} from "lucide-react";
import {
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Tag,
  Badge,
  Empty,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Avatar,
  message,
} from "antd";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const PMProjects = () => {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTicketDrawer, setShowTicketDrawer] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    getProfile();
  }, []);

  useEffect(() => {
    if (profile?.id) {
      fetchProjects();
    }
  }, [profile]);

  const getProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        setProfile(data);
      }
    } catch (err) {
      console.error("Error getting profile:", err);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          project_assignees (
            employee_id,
            profiles:employee_id (
              id,
              full_name,
              email
            )
          )
        `
        )
        .eq("project_manager_id", profile?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      message.error("Failed to fetch projects");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTickets = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          `
          *,
          profiles:assigned_to (
            full_name,
            email
          )
        `
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      message.error("Failed to fetch tickets");
      console.error("Error fetching tickets:", err);
    }
  };

  const projectStatuses = [
    {
      key: "not_started",
      label: "Not Started",
      icon: Circle,
      color: "border-slate-300",
      textColor: "text-slate-700",
    },
    {
      key: "in_progress",
      label: "In Progress",
      icon: Play,
      color: "border-blue-300",
      textColor: "text-blue-700",
    },
    {
      key: "testing",
      label: "Testing",
      icon: AlertCircle,
      color: "border-amber-300",
      textColor: "text-amber-700",
    },
    {
      key: "completed",
      label: "Completed",
      icon: CheckCircle2,
      color: "border-emerald-300",
      textColor: "text-emerald-700",
    },
  ];

  const ticketStatuses = [
    {
      key: "open",
      label: "Open",
      icon: Circle,
      color: "default",
      badge: "bg-slate-500",
    },
    {
      key: "in_progress",
      label: "In Progress",
      icon: Play,
      color: "processing",
      badge: "bg-blue-500",
    },
    {
      key: "completed",
      label: "Completed",
      icon: CheckCircle2,
      color: "success",
      badge: "bg-emerald-500",
    },
    {
      key: "closed",
      label: "Closed",
      icon: XCircle,
      color: "default",
      badge: "bg-gray-500",
    },
  ];

  const priorityConfig = {
    low: {
      color: "bg-gray-100 text-gray-700 border-gray-300",
      antdColor: "default",
    },
    medium: {
      color: "bg-blue-100 text-blue-700 border-blue-300",
      antdColor: "processing",
    },
    high: {
      color: "bg-orange-100 text-orange-700 border-orange-300",
      antdColor: "warning",
    },
    urgent: {
      color: "bg-red-100 text-red-700 border-red-300",
      antdColor: "error",
    },
  };

  const handleSaveTicket = async (values) => {
    try {
      const ticketData = {
        project_id: selectedProject?.id,
        title: values.title,
        description: values.description || "",
        status: values.status,
        priority: values.priority,
        assigned_to: values.assigned_to || null,
        due_date: values.due_date ? values.due_date.format("YYYY-MM-DD") : null,
      };

      if (editingTicket) {
        const { error: err } = await supabase
          .from("tickets")
          .update(ticketData)
          .eq("id", editingTicket.id);
        if (err) throw err;
        message.success("Ticket updated successfully");
      } else {
        const { error: err } = await supabase
          .from("tickets")
          .insert([{ ...ticketData, created_by: profile?.id }]);
        if (err) throw err;
        message.success("Ticket created successfully");
      }

      await fetchProjectTickets(selectedProject.id);
      setShowTicketForm(false);
      form.resetFields();
      setEditingTicket(null);
    } catch (err) {
      message.error("Failed to save ticket: " + err.message);
      console.error("Error:", err);
    }
  };

  const openTicketForm = (ticket = null) => {
    if (ticket) {
      setEditingTicket(ticket);
      form.setFieldsValue({
        title: ticket.title,
        description: ticket.description || "",
        priority: ticket.priority,
        status: ticket.status,
        assigned_to: ticket.assigned_to || undefined,
        due_date: ticket.due_date ? dayjs(ticket.due_date) : undefined,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: "open",
        priority: "medium",
      });
      setEditingTicket(null);
    }
    setShowTicketForm(true);
  };

  const openProjectTickets = (project) => {
    setSelectedProject(project);
    fetchProjectTickets(project.id);
    setShowTicketDrawer(true);
  };

  const closeTicketDrawer = () => {
    setShowTicketDrawer(false);
    setShowTicketForm(false);
    setSelectedProject(null);
    form.resetFields();
    setEditingTicket(null);
  };

  const getProjectsByStatus = (status) => {
    return projects.filter((p) => p.status === status);
  };

  const getTicketsByStatus = (status) => {
    if (!selectedProject) return [];
    return tickets.filter(
      (t) => t.project_id === selectedProject.id && t.status === status
    );
  };

  const ProjectCard = ({ project }) => (
    <div
      className="rounded-lg border border-gray-200 p-4 mb-3 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={() => openProjectTickets(project)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-base group-hover:text-blue-600 transition-colors">
          {project.name}
        </h3>
        <Tag color="blue">{project.project_type?.toUpperCase()}</Tag>
      </div>

      <p className="text-sm mb-4 line-clamp-2">{project.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-xs">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          <span>
            {new Date(project.start_date).toLocaleDateString()} -{" "}
            {new Date(project.end_date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center text-xs">
          <Users className="w-3.5 h-3.5 mr-1.5" />
          <span>{project.project_assignees?.length || 0} members</span>
        </div>
      </div>

      <Avatar.Group maxCount={3} size="small">
        {project.project_assignees?.map((assignee, idx) => (
          <Avatar
            key={idx}
            style={{ backgroundColor: "#3b82f6" }}
            title={assignee.profiles?.full_name}
          >
            {assignee.profiles?.full_name?.charAt(0)}
          </Avatar>
        ))}
      </Avatar.Group>
    </div>
  );

  const TicketCard = ({ ticket }) => {
    const statusConfig = ticketStatuses.find((s) => s.key === ticket.status);
    const StatusIcon = statusConfig?.icon || Circle;

    return (
      <Card
        size="small"
        className="mb-3 hover:shadow-md transition-all duration-200 group"
        bodyStyle={{ padding: "12px" }}
        style={{
          border: "1px solid #e5e7eb", // grey border
          borderRadius: "8px",
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <Text
            strong
            className="text-sm group-hover:text-blue-600 transition-colors flex-1"
          >
            {ticket.title}
          </Text>
          <Button
            type="text"
            size="small"
            icon={<Edit2 className="w-3.5 h-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              openTicketForm(ticket);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>

        {ticket.description && (
          <Paragraph
            ellipsis={{ rows: 2 }}
            className="text-xs text-gray-600 mb-3"
            style={{ marginBottom: 12 }}
          >
            {ticket.description}
          </Paragraph>
        )}

        <div className="flex items-center justify-between mb-3">
          <Tag color={priorityConfig[ticket.priority]?.antdColor || "default"}>
            {ticket.priority?.toUpperCase()}
          </Tag>
          {ticket.due_date && (
            <Space size={4}>
              <Clock className="w-3 h-3 text-gray-500" />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(ticket.due_date).toLocaleDateString()}
              </Text>
            </Space>
          )}
        </div>

        {ticket.profiles && (
          <Space size={8}>
            <Avatar size="small" style={{ backgroundColor: "#9333ea" }}>
              {ticket.profiles.full_name?.charAt(0)}
            </Avatar>
            <Text style={{ fontSize: 12 }} type="secondary">
              {ticket.profiles.full_name}
            </Text>
          </Space>
        )}
      </Card>
    );
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Project Management</h1>
          <p className="text-gray-600">
            Track and manage your projects with ease
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading projects...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            {projectStatuses.map((status) => {
              const statusProjects = getProjectsByStatus(status.key);
              const StatusIcon = status.icon;

              return (
                <div key={status.key} className="flex flex-col">
                  <div
                    className={`${status.color} rounded-xl border-2 p-4 mb-4 shadow-sm`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-5 h-5 ${status.textColor}`} />
                        <h2
                          className={`font-bold text-base ${status.textColor}`}
                        >
                          {status.label}
                        </h2>
                      </div>
                      <Badge
                        count={statusProjects.length}
                        showZero
                        style={{
                          backgroundColor: "#fff",
                          color: "#1f2937",
                          fontWeight: 600,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 min-h-[400px]">
                    {statusProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                    {statusProjects.length === 0 && (
                      <div className="bg-opacity-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                        <Circle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm font-medium">
                          No projects
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Drawer
        title={
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>
              {selectedProject?.name}
            </Title>
            <Text type="secondary">{selectedProject?.description}</Text>
          </div>
        }
        placement="right"
        width="80%"
        onClose={closeTicketDrawer}
        open={showTicketDrawer}
        extra={
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => openTicketForm()}
          >
            New Ticket
          </Button>
        }
      >
        <Row gutter={16}>
          {ticketStatuses.map((status) => {
            const statusTickets = getTicketsByStatus(status.key);
            const StatusIcon = status.icon;

            return (
              <Col span={6} key={status.key}>
                <Card
                  size="small"
                  style={{ marginBottom: 16 }}
                  bodyStyle={{ padding: "12px 16px" }}
                >
                  <Space>
                    <StatusIcon className="w-4 h-4 text-gray-700" />
                    <Text strong>{status.label}</Text>
                    <Badge count={statusTickets.length} />
                  </Space>
                </Card>

                <div className="space-y-3">
                  {statusTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                  {statusTickets.length === 0 && (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No tickets"
                      style={{ padding: "40px 0" }}
                    />
                  )}
                </div>
              </Col>
            );
          })}
        </Row>
      </Drawer>

      <Drawer
        title={editingTicket ? "Edit Ticket" : "Create New Ticket"}
        placement="right"
        width={600}
        onClose={() => {
          setShowTicketForm(false);
          form.resetFields();
          setEditingTicket(null);
        }}
        open={showTicketForm}
        footer={
          <div style={{ textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setShowTicketForm(false);
                  form.resetFields();
                  setEditingTicket(null);
                }}
              >
                Cancel
              </Button>
              <Button type="primary" onClick={() => form.submit()}>
                {editingTicket ? "Update" : "Create"} Ticket
              </Button>
            </Space>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTicket}
          initialValues={{
            status: "open",
            priority: "medium",
          }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please enter ticket title" }]}
          >
            <Input placeholder="Enter ticket title" size="large" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={4}
              placeholder="Enter ticket description"
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: "Please select priority" }]}
              >
                <Select size="large" placeholder="Select priority">
                  <Option value="low">
                    <Tag color="default">Low</Tag>
                  </Option>
                  <Option value="medium">
                    <Tag color="processing">Medium</Tag>
                  </Option>
                  <Option value="high">
                    <Tag color="warning">High</Tag>
                  </Option>
                  <Option value="urgent">
                    <Tag color="error">Urgent</Tag>
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select size="large" placeholder="Select status">
                  <Option value="open">Open</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="closed">Closed</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assigned_to" label="Assign To">
                <Select size="large" placeholder="Select employee" allowClear>
                  {selectedProject?.project_assignees?.map((assignee) => (
                    <Option
                      key={assignee.profiles.id}
                      value={assignee.profiles.id}
                    >
                      <Space>
                        <Avatar
                          size="small"
                          style={{ backgroundColor: "#3b82f6" }}
                        >
                          {assignee.profiles.full_name?.charAt(0)}
                        </Avatar>
                        {assignee.profiles.full_name}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="due_date" label="Due Date">
                <DatePicker
                  size="large"
                  style={{ width: "100%" }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
};

export default PMProjects;
