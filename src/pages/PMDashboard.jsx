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
  Play,
  Pause,
  Eye,
  Clock3,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import BirthdayWidget from "../components/BirthdayWidget";

const { Title, Text } = Typography;

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const fmtTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const getBreakSeconds = (log, nowMs) => {
  if (!Array.isArray(log?.breaks) || log.breaks.length === 0) return 0;
  return log.breaks.reduce((acc, br) => {
    if (!br?.pause_time) return acc;
    const st = new Date(br.pause_time).getTime();
    if (!Number.isFinite(st)) return acc;
    const en = br.resume_time ? new Date(br.resume_time).getTime() : nowMs;
    if (!Number.isFinite(en) || en <= st) return acc;
    return acc + Math.floor((en - st) / 1000);
  }, 0);
};

const getElapsed = (log) => {
  const nowMs = Date.now();
  if (log.status === "active" || log.status === "break" || log.status === "paused") {
    const startMs = new Date(log.start_time).getTime();
    const derived = Number.isFinite(startMs)
      ? Math.max(0, Math.floor((nowMs - startMs) / 1000) - getBreakSeconds(log, nowMs))
      : 0;
    if (log.status === "paused") {
      const fromTotal = Math.floor((log.total_hours || 0) * 3600);
      return Math.max(fromTotal, derived);
    }
    return derived;
  }
  return 0;
};

const initials = (name = "") => {
  const p = name.trim().split(" ").filter(Boolean);
  return p.length >= 2
    ? `${p[0][0]}${p[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase() || "??";
};

const avatarBg = (name = "") => {
  const list = ["#3b82f6", "#8b5cf6", "#10b981", "#f97316", "#ec4899", "#06b6d4", "#f59e0b", "#6366f1"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return list[Math.abs(h) % list.length];
};

const Ava = ({ name = "", photo, size = 34 }) => {
  const [err, setErr] = useState(false);
  const bg = avatarBg(name);
  if (photo && !err) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: bg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(9, size * 0.33),
        fontWeight: 700,
      }}
    >
      {initials(name)}
    </div>
  );
};

const LiveTimer = ({ log, color }) => {
  const [elapsed, setElapsed] = useState(() => getElapsed(log));
  useEffect(() => {
    setElapsed(getElapsed(log));
  }, [log]);
  useEffect(() => {
    if (log.status !== "active") return;
    const id = setInterval(() => setElapsed(getElapsed(log)), 1000);
    return () => clearInterval(id);
  }, [log]);
  return (
    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 13, fontWeight: 600, color }}>
      {fmtTime(elapsed)}
    </span>
  );
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
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [activeEmpLoading, setActiveEmpLoading] = useState(false);
  const [loading, setLoading] = useState(true);

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

      setActiveEmpLoading(true);
      if (projectIds.length > 0) {
        const { data: assigneesRows, error: assigneesError } = await supabase
          .from("project_assignees")
          .select("employee_id, project_id")
          .in("project_id", projectIds);
        if (assigneesError) throw assigneesError;

        const employeeIds = Array.from(
          new Set((assigneesRows || []).map((r) => r.employee_id).filter(Boolean)),
        );

        if (employeeIds.length > 0) {
          const now = new Date();
          const pad = (n) => String(n).padStart(2, "0");
          const localToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
          const localYesterdayDate = new Date(now);
          localYesterdayDate.setDate(now.getDate() - 1);
          const localYesterday = `${localYesterdayDate.getFullYear()}-${pad(localYesterdayDate.getMonth() + 1)}-${pad(localYesterdayDate.getDate())}`;
          const utcToday = new Date().toISOString().split("T")[0];
          const candidateDates = Array.from(new Set([utcToday, localToday, localYesterday]));

          const { data: logs, error: logsError } = await supabase
            .from("time_logs")
            .select(
              "id,user_id,date,start_time,end_time,total_hours,status,standup_message,breaks,profiles(full_name,email,user_photo,profile_picture_url,tenant_id)",
            )
            .in("date", candidateDates)
            .in("status", ["active", "break", "paused"])
            .in("user_id", employeeIds);
          if (logsError) throw logsError;

          const byUser = {};
          (logs || []).forEach((l) => {
            if (profile?.tenant_id && l.profiles?.tenant_id !== profile.tenant_id) return;
            const prev = byUser[l.user_id];
            if (!prev) {
              byUser[l.user_id] = l;
              return;
            }
            const prevLive = prev.status === "active" || prev.status === "break";
            const currLive = l.status === "active" || l.status === "break";
            if (currLive && !prevLive) {
              byUser[l.user_id] = l;
              return;
            }
            if (currLive === prevLive) {
              const prevTs = new Date(prev.start_time || prev.created_at || 0).getTime();
              const currTs = new Date(l.start_time || l.created_at || 0).getTime();
              if (currTs > prevTs) byUser[l.user_id] = l;
            }
          });

          setActiveEmployees(Object.values(byUser));
        } else {
          setActiveEmployees([]);
        }
      } else {
        setActiveEmployees([]);
      }
      setActiveEmpLoading(false);

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
      setActiveEmployees([]);
      setActiveEmpLoading(false);
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
        .pm-dashboard-root .pm-active-emp:hover {
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
          <Card
            style={sectionCardStyle}
            bodyStyle={{ padding: 16 }}
            title={
              <div style={{ lineHeight: 1.3, margin: 0, paddingTop: 10, paddingBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  Active Employees
                </div>
                <div style={{ fontSize: 12, color: t.textSubtle, marginTop: 2 }}>
                  {activeEmpLoading
                    ? "Loading..."
                    : `${activeEmployees.length} active on your assigned projects`}
                </div>
              </div>
            }
          >
            {activeEmpLoading ? (
              <Skeleton active />
            ) : activeEmployees.length === 0 ? (
              <Empty description="No active employees right now." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="pm-active-emp"
                    style={{
                      padding: "10px 10px",
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      background: t.cardAlt,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Ava
                        name={emp.profiles?.full_name}
                        photo={emp.profiles?.user_photo || emp.profiles?.profile_picture_url}
                        size={34}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                          {emp.profiles?.full_name || "Employee"}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                          {emp.status === "active" ? (
                            <Play size={10} color="#10b981" fill="#10b981" />
                          ) : (
                            <Pause size={10} color="#f59e0b" fill="#f59e0b" />
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              color: emp.status === "active" ? "#10b981" : "#f59e0b",
                            }}
                          >
                            {emp.status === "active" ? "Working" : "Paused"}
                          </span>
                          {emp.standup_message ? <Eye size={11} color={t.textMuted} /> : null}
                        </div>
                      </div>
                    </div>
                    <LiveTimer log={emp} color={t.text} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div style={{ height: 16 }} />
          <BirthdayWidget tenantId={profile?.tenant_id} />
        </Col>
      </Row>
    </div>
  );
};

export default PMDashboard;
