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
  FolderKanban,
  PlayCircle,
  CheckCircle2,
  Ticket,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import BirthdayWidget from "../components/BirthdayWidget";

const { Title, Text } = Typography;

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const PMDashboard = () => {
  const { profile } = useAuth();
  const [dark, setDark] = useState(getIsDarkTheme);
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

  const t = dark
    ? {
        page: "#141416",
        pageAlt: "#17181c",
        card: "#1a1b1f",
        cardAlt: "#202127",
        border: "#2a2b31",
        text: "#f3f4f6",
        textMuted: "#9ca3af",
        textSubtle: "#818897",
      }
    : {
        page: "#f7f9fc",
        pageAlt: "#f3f5f9",
        card: "#ffffff",
        cardAlt: "#f8fafc",
        border: "#f0f2f5",
        text: "#111827",
        textMuted: "#6b7280",
        textSubtle: "#8c8c8c",
      };

  const metricCardStyle = {
    borderRadius: 16,
    borderColor: t.border,
    background: t.card,
    boxShadow: dark
      ? "0 0 0 1px rgba(255,255,255,0.02), 0 8px 24px rgba(0,0,0,0.3)"
      : "0 0 0 1px #f5f5f5, 0 8px 24px rgba(15, 23, 42, 0.03)",
  };

  const sectionCardStyle = {
    borderRadius: 16,
    borderColor: t.border,
    background: t.card,
    boxShadow: dark
      ? "0 0 0 1px rgba(255,255,255,0.02), 0 8px 24px rgba(0,0,0,0.28)"
      : "0 0 0 1px #f5f5f5, 0 8px 24px rgba(15, 23, 42, 0.03)",
  };

  const iconBubble = (children, color = "#5567ff") => (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        background: dark ? `${color}1f` : "#f5f7fb",
        border: dark ? `1px solid ${color}55` : "1px solid transparent",
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
      className="pm-row"
      style={{
        padding: "12px 10px",
        borderBottom: `1px solid ${t.border}`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
      }}
    >
      <div>
        <Text style={{ fontWeight: 600, color: t.text }}>{project.name}</Text>
        <br />
        <Text style={{ fontSize: 12, color: t.textMuted }}>
          {project.client_name || "Client / Owner"}
        </Text>
      </div>
      <Space align="center" size={16}>
        <Text style={{ fontSize: 12, color: t.textMuted }}>
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
      className="pm-row"
      style={{
        padding: "10px 10px",
        borderBottom: `1px solid ${t.border}`,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <Text style={{ fontWeight: 600, color: t.text }}>{ticket.title}</Text>
        <br />
        <Text style={{ fontSize: 12, color: t.textMuted }}>
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
      className={`pm-dashboard-root ${dark ? "dark" : ""}`}
      style={{
        padding: 24,
        background: t.page,
        minHeight: "100vh",
      }}
    >
      <style>{`
        .pm-dashboard-root .ant-card-head {
          border-bottom-color: ${t.border} !important;
          min-height: 56px !important;
        }
        .pm-dashboard-root .ant-card-head-title {
          color: ${t.text} !important;
        }
        .pm-dashboard-root .ant-typography {
          color: ${t.text};
        }
        .pm-dashboard-root .ant-skeleton-title,
        .pm-dashboard-root .ant-skeleton-paragraph > li {
          background: ${dark ? "#2a2b31 !important" : "#eef2f7 !important"};
        }
        .pm-dashboard-root .ant-empty-description {
          color: ${t.textMuted} !important;
        }
        .pm-dashboard-root .pm-row {
          transition: background-color 0.15s ease;
        }
        .pm-dashboard-root .pm-row:hover {
          background: ${dark ? t.cardAlt : t.pageAlt};
        }
      `}</style>
      <div
        style={{
          marginBottom: 20,
          padding: "14px 18px",
          borderRadius: 14,
          background: dark
            ? "linear-gradient(135deg, #1a1b1f 0%, #202127 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: `1px solid ${t.border}`,
        }}
      >
        <Title
          level={4}
          style={{ margin: 0, color: t.text, fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          Project Manager Dashboard
        </Title>
        <Text style={{ color: t.textMuted, fontSize: 13 }}>
          Snapshot of projects, tickets, and team activity.
        </Text>
      </div>
      {/* Top metric cards with lucide icons */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card style={metricCardStyle} bodyStyle={{ padding: 20 }}>
            <Space direction="vertical" size={6}>
              <Space>
                {iconBubble(<FolderKanban size={18} />)}
                <Text style={{ color: t.textMuted }}>Projects</Text>
              </Space>
              {loading ? (
                <Skeleton active paragraph={false} />
              ) : (
                <>
                  <Title level={3} style={{ margin: 0, color: t.text }}>
                    {stats.totalProjects}
                  </Title>
                  <Text style={{ fontSize: 12, color: t.textMuted }}>
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
                <Text style={{ color: t.textMuted }}>In Progress</Text>
              </Space>
              {loading ? (
                <Skeleton active paragraph={false} />
              ) : (
                <>
                  <Title level={3} style={{ margin: 0, color: t.text }}>
                    {stats.inProgressProjects}
                  </Title>
                  <Text style={{ fontSize: 12, color: t.textMuted }}>
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
                <Text style={{ color: t.textMuted }}>Completed</Text>
              </Space>
              {loading ? (
                <Skeleton active paragraph={false} />
              ) : (
                <>
                  <Title level={3} style={{ margin: 0, color: t.text }}>
                    {stats.completedProjects}
                  </Title>
                  <Text style={{ fontSize: 12, color: t.textMuted }}>
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
                <Text style={{ color: t.textMuted }}>Tickets</Text>
              </Space>
              {loading ? (
                <Skeleton active paragraph={false} />
              ) : (
                <>
                  <Title level={3} style={{ margin: 0, color: t.text }}>
                    {stats.totalTickets}
                  </Title>
                  <Text style={{ fontSize: 12, color: t.textMuted }}>
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
                <Text style={{ color: t.textMuted }}>Open Tickets</Text>
              </Space>
              {loading ? (
                <Skeleton active paragraph={false} />
              ) : (
                <>
                  <Title level={3} style={{ margin: 0, color: t.text }}>
                    {
                      recentTickets.filter(
                        (t) =>
                          t.status === "open" || t.status === "in_progress",
                      ).length
                    }
                  </Title>
                  <Text style={{ fontSize: 12, color: t.textMuted }}>
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
                <div
                  style={{ fontSize: 12, color: t.textSubtle, marginTop: 2 }}
                >
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
                <div
                  style={{ fontSize: 12, color: t.textSubtle, marginTop: 2 }}
                >
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
          <BirthdayWidget tenantId={profile?.tenant_id} />
        </Col>
      </Row>
    </div>
  );
};

export default PMDashboard;
