import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Space,
  Avatar,
  Empty,
  Skeleton,
} from "antd";
import {
  UserOutlined,
  ClockCircleFilled,
  BugOutlined,
} from "@ant-design/icons";
import {
  FolderKanban,
  PlayCircle,
  CheckCircle2,
  Ticket,
  AlertTriangle,
  UserCircle2,
} from "lucide-react"; // <-- lucide-react icons
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import BirthdayWidget from "../components/BirthdayWidget";

const { Title, Text } = Typography;

const PMDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalTickets: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeEmployees = [
    {
      id: 1,
      name: profile?.full_name || "You",
      status: "Working",
      avatar: null,
      time: "14:17:04",
    },
  ];

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("project_manager_id", profile.id);

      if (projectsError) throw projectsError;

      const totalProjects = projects?.length || 0;
      const inProgressProjects =
        projects?.filter((p) => p.status === "in_progress").length || 0;
      const completedProjects =
        projects?.filter((p) => p.status === "completed").length || 0;

      const projectIds = projects?.map((p) => p.id) || [];

      let totalTickets = 0;
      if (projectIds.length > 0) {
        const { data: tickets, error: ticketsError } = await supabase
          .from("tickets")
          .select("*, projects(name)", { count: "exact" })
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
          .limit(5);

        if (ticketsError) throw ticketsError;

        const { count } = await supabase
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .in("project_id", projectIds);

        totalTickets = count || 0;
        setRecentTickets(tickets || []);
      }

      setStats({
        totalProjects,
        inProgressProjects,
        completedProjects,
        totalTickets,
      });

      setRecentProjects(projects?.slice(0, 5) || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const metricCardStyle = {
    borderRadius: 16,
    borderColor: "#f0f2f5",
    boxShadow: "0 0 0 1px #f5f5f5",
  };

  const sectionCardStyle = {
    borderRadius: 16,
    borderColor: "#f0f2f5",
  };

  const iconBubble = (children, color = "#5567ff") => (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 999,
        background: "#f5f7fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
      }}
    >
      {children}
    </div>
  );

  const ProjectRow = ({ project }) => (
    <div
      style={{
        padding: "12px 0",
        borderBottom: "1px solid #f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
      }}
    >
      <div>
        <Text style={{ fontWeight: 500 }}>{project.name}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {project.client_name || "Client / Owner"}
        </Text>
      </div>
      <Space align="center" size={16}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {project.type || "single"}
        </Text>
        <Tag
          style={{ borderRadius: 999 }}
          color={
            project.status === "completed"
              ? "success"
              : project.status === "testing"
                ? "gold"
                : project.status === "in_progress"
                  ? "blue"
                  : "default"
          }
        >
          {project.status?.replace("_", " ") || "In Progress"}
        </Tag>
      </Space>
    </div>
  );

  const TicketRow = ({ ticket }) => (
    <div
      style={{
        padding: "10px 0",
        borderBottom: "1px solid #f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <Text style={{ fontWeight: 500 }}>{ticket.title}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {ticket.projects?.name || "Project"}
        </Text>
      </div>
      <Space>
        <Tag
          style={{ borderRadius: 999 }}
          color={
            ticket.status === "completed"
              ? "green"
              : ticket.status === "in_progress"
                ? "blue"
                : ticket.status === "open"
                  ? "orange"
                  : "default"
          }
        >
          {ticket.status?.toUpperCase()}
        </Tag>
        <Tag
          style={{ borderRadius: 999 }}
          color={
            ticket.priority === "urgent"
              ? "red"
              : ticket.priority === "high"
                ? "orange"
                : ticket.priority === "medium"
                  ? "blue"
                  : "default"
          }
        >
          {ticket.priority?.toUpperCase()}
        </Tag>
      </Space>
    </div>
  );

  return (
    <div
      style={{
        padding: 24,
        background: "#f7f9fc",
        minHeight: "100vh",
      }}
    >
      {/* Top metric cards with lucide icons */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
            <Space direction="vertical" size={6}>
              <Space>
                {iconBubble(<FolderKanban size={18} />)}
                <Text type="secondary">Projects</Text>
              </Space>
              {loading ? (
                <Skeleton active paragraph={false} />
              ) : (
                <>
                  <Title level={3} style={{ margin: 0 }}>
                    {stats.totalProjects}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stats.inProgressProjects} active
                  </Text>
                </>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={4}>
          <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
            <Space direction="vertical" size={6}>
              <Space>
                {iconBubble(<PlayCircle size={18} />)}
                <Text type="secondary">In Progress</Text>
              </Space>
              {loading ? (
                <Skeleton active paragraph={false} />
              ) : (
                <>
                  <Title level={3} style={{ margin: 0 }}>
                    {stats.inProgressProjects}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Running now
                  </Text>
                </>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={4}>
          <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
            <Space direction="vertical" size={6}>
              <Space>
                {iconBubble(<CheckCircle2 size={18} />, "#52c41a")}
                <Text type="secondary">Completed</Text>
              </Space>
              {loading ? (
                <Skeleton active paragraph={false} />
              ) : (
                <>
                  <Title level={3} style={{ margin: 0 }}>
                    {stats.completedProjects}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Finished projects
                  </Text>
                </>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={4}>
          <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
            <Space direction="vertical" size={6}>
              <Space>
                {iconBubble(<Ticket size={18} />, "#fa8c16")}
                <Text type="secondary">Tickets</Text>
              </Space>
              {loading ? (
                <Skeleton active paragraph={false} />
              ) : (
                <>
                  <Title level={3} style={{ margin: 0 }}>
                    {stats.totalTickets}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Across all projects
                  </Text>
                </>
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8} lg={4}>
          <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
            <Space direction="vertical" size={6}>
              <Space>
                {iconBubble(<AlertTriangle size={18} />, "#faad14")}
                <Text type="secondary">Open Tickets</Text>
              </Space>
              {loading ? (
                <Skeleton active paragraph={false} />
              ) : (
                <>
                  <Title level={3} style={{ margin: 0 }}>
                    {
                      recentTickets.filter(
                        (t) =>
                          t.status === "open" || t.status === "in_progress",
                      ).length
                    }
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    From recent list
                  </Text>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Bottom sections with aligned titles (extra top padding) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card
            style={sectionCardStyle}
            bodyStyle={{ padding: 20 }}
            title={
              <div
                style={{
                  lineHeight: 1.3,
                  margin: 0,
                  paddingTop: 10,
                  paddingBottom: 10,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  Recent Projects
                </div>
                <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
                  5 most recent
                </div>
              </div>
            }
          >
            {loading ? (
              <Skeleton active />
            ) : recentProjects.length === 0 ? (
              <Empty description="No projects yet." />
            ) : (
              recentProjects.map((p) => <ProjectRow key={p.id} project={p} />)
            )}
          </Card>

          <div style={{ height: 16 }} />

          <Card
            style={sectionCardStyle}
            bodyStyle={{ padding: 20 }}
            title={
              <div
                style={{
                  lineHeight: 1.3,
                  margin: 0,
                  paddingTop: 10,
                  paddingBottom: 10,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  Recent Tickets
                </div>
                <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
                  5 most recent
                </div>
              </div>
            }
          >
            {loading ? (
              <Skeleton active />
            ) : recentTickets.length === 0 ? (
              <Empty description="No tickets yet." />
            ) : (
              recentTickets.map((t) => <TicketRow key={t.id} ticket={t} />)
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <BirthdayWidget />
        </Col>
      </Row>
    </div>
  );
};

export default PMDashboard;
