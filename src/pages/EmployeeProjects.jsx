import { useEffect, useMemo, useState } from "react";
import { Drawer, message, Spin, Tooltip } from "antd";
import { Calendar, Search, X } from "lucide-react";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import TicketDetailsModal from "../components/TicketDetailsModal";

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const avatarColor = (str = "") => {
  const colors = [
    "#003467",
    "#7c3aed",
    "#db2777",
    "#dc2626",
    "#ea580c",
    "#059669",
    "#2563eb",
    "#0891b2",
  ];
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
};

const fmtDate = (d) => (d ? dayjs(d).format("MMM D") : "--------");

const PROJECT_STATUS = [
  {
    key: "not_started",
    label: "Not Started",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
  },
  {
    key: "in_progress",
    label: "In Progress",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    key: "testing",
    label: "Testing",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  {
    key: "completed",
    label: "Completed",
    color: "#059669",
    bg: "#f0fdf4",
    border: "#a7f3d0",
  },
];

const PROJECT_STATUS_DARK_TAG = {
  not_started: { bg: "#20242b", border: "#2f3642", color: "#94a3b8" },
  in_progress: { bg: "#1c2d47", border: "#2d4d7a", color: "#60a5fa" },
  testing: { bg: "#3a2c18", border: "#6a4a1f", color: "#f59e0b" },
  completed: { bg: "#163329", border: "#1f5a43", color: "#34d399" },
};

const normalizeProjectStatus = (status) => {
  if (PROJECT_STATUS.some((s) => s.key === status)) return status;
  if (status === "planning") return "not_started";
  if (status === "active") return "in_progress";
  return "not_started";
};

const UserAvatar = ({ name = "", image, size = 20, dark = false }) => (
  <Tooltip title={name}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: avatarColor(name),
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 800,
        border: `2px solid ${dark ? "#141416" : "#fff"}`,
        boxShadow: "0 1px 3px rgba(0,0,0,.15)",
        overflow: "hidden",
      }}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials(name)
      )}
    </div>
  </Tooltip>
);

const ProjectCard = ({ project, onClick, dark = false }) => {
  const normalized = normalizeProjectStatus(project.status);
  const ps = PROJECT_STATUS.find((s) => s.key === normalized) || PROJECT_STATUS[0];
  const statusTone = dark
    ? PROJECT_STATUS_DARK_TAG[normalized] || PROJECT_STATUS_DARK_TAG.not_started
    : { bg: ps.bg, border: ps.border, color: ps.color };
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      style={{
        background: dark ? "#1a1a1c" : "#fff",
        borderRadius: 8,
        border: `1px solid ${dark ? "#2a2a2d" : "#e5e7eb"}`,
        padding: "12px 14px",
        marginBottom: 8,
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,.04)",
        transition: "all .2s",
        position: "relative",
        overflow: "hidden",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)";
        e.currentTarget.style.borderColor = statusTone.border;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)";
        e.currentTarget.style.borderColor = dark ? "#2a2a2d" : "#e5e7eb";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: ps.color,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 5,
        }}
      >
        <h3
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: dark ? "#e5e7eb" : "#172b4d",
            margin: 0,
          }}
        >
          {project.name}
        </h3>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            padding: "2px 6px",
            borderRadius: 99,
            color: statusTone.color,
            background: statusTone.bg,
            border: `1px solid ${statusTone.border}`,
            textTransform: "uppercase",
            letterSpacing: 0.4,
            whiteSpace: "nowrap",
            marginLeft: 6,
          }}
        >
          {ps.label}
        </span>
      </div>
      <p
        style={{
          fontSize: 11,
          color: dark ? "#9ca3af" : "#626f86",
          margin: "0 0 8px",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {project.description || "No description"}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: -4 }}>
          {project.project_assignees?.slice(0, 4).map((a, i) => (
            <div key={a.employee_id || i} style={{ marginLeft: i > 0 ? -5 : 0 }}>
              <UserAvatar
                name={a.profiles?.full_name || "?"}
                image={a?.profiles?.user_photo}
                size={20}
                dark={dark}
              />
            </div>
          ))}
        </div>
        <span
          style={{
            fontSize: 10,
            color: dark ? "#8b95a7" : "#9ca3af",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Calendar size={9} />
          {fmtDate(project.end_date)}
        </span>
      </div>
    </div>
  );
};

const EmployeeProjects = () => {
  const [dark, setDark] = useState(getIsDarkTheme);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDrawer, setShowProjectDrawer] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [projectSprints, setProjectSprints] = useState([]);
  const [activeTab, setActiveTab] = useState("board");
  const [searchQ, setSearchQ] = useState("");
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.id) fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", syncTheme);
    } else if (typeof media.addListener === "function") {
      media.addListener(syncTheme);
    }
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", syncTheme);
      } else if (typeof media.removeListener === "function") {
        media.removeListener(syncTheme);
      }
    };
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("project_assignees")
        .select(
          `
          projects:projects(
            *,
            project_assignees(
              employee_id,
              profiles:employee_id(id,full_name,email,user_photo)
            )
          )
        `,
        )
        .eq("employee_id", profile.id);

      if (error) throw error;
      const mapped = (data || []).map((r) => r.projects).filter(Boolean);
      const uniq = new Map(mapped.map((p) => [p.id, p]));
      setProjects(Array.from(uniq.values()));
    } catch (error) {
      message.error("Failed to fetch projects");
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(
      (p) => normalizeProjectStatus(p.status) === "in_progress",
    ).length;
    const done = projects.filter(
      (p) => normalizeProjectStatus(p.status) === "completed",
    ).length;
    return { total, active, done };
  }, [projects]);

  const fetchProjectTickets = async (projectId) => {
    setLoadingData(true);
    try {
      const [{ data: ticketData, error: ticketError }, { data: sprintData, error: sprintError }] =
        await Promise.all([
          supabase
            .from("tickets")
            .select(
              `
              *,
              assigned_user:assigned_to (
                id,
                full_name,
                user_photo
              ),
              projects (
                id,
                name
              )
            `,
            )
            .eq("project_id", projectId)
            .eq("assigned_to", profile.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("sprints")
            .select("id,name,status,start_date,end_date")
            .eq("project_id", projectId)
            .order("created_at", { ascending: true }),
        ]);

      if (ticketError) throw ticketError;
      if (sprintError) throw sprintError;
      setTickets(ticketData || []);
      setProjectSprints(sprintData || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch project tickets");
      setTickets([]);
      setProjectSprints([]);
    } finally {
      setLoadingData(false);
    }
  };

  const openProject = async (project) => {
    setSelectedProject(project);
    setShowProjectDrawer(true);
    setActiveTab("board");
    setSearchQ("");
    await fetchProjectTickets(project.id);
  };

  const closeProjectDrawer = () => {
    setShowProjectDrawer(false);
    setSelectedProject(null);
    setTickets([]);
    setProjectSprints([]);
    setSearchQ("");
    setActiveTab("board");
    setDetailTicket(null);
    setDetailsModalOpen(false);
  };

  const filteredTickets = useMemo(() => {
    if (!searchQ.trim()) return tickets;
    const q = searchQ.toLowerCase();
    return tickets.filter((t) => (t.title || "").toLowerCase().includes(q));
  }, [tickets, searchQ]);

  const boardColumns = useMemo(
    () =>
      dark
        ? [
            { key: "open", label: "To Do", color: "#9ca3af", bg: "#1a1a1c", border: "#2a2a2d", headerBg: "#202024" },
            { key: "in_progress", label: "In Progress", color: "#60a5fa", bg: "#16243a", border: "#274061", headerBg: "#1f3553" },
            { key: "completed", label: "Done", color: "#34d399", bg: "#132820", border: "#205040", headerBg: "#1a3a2f" },
            { key: "closed", label: "Closed", color: "#a1a1aa", bg: "#1a1a1c", border: "#2a2a2d", headerBg: "#202024" },
          ]
        : [
            { key: "open", label: "To Do", color: "#44546f", bg: "#f0f4f8", border: "#dde3ec", headerBg: "#e4ecf5" },
            { key: "in_progress", label: "In Progress", color: "#0c66e4", bg: "#e9f2ff", border: "#b8d0f5", headerBg: "#cce0ff" },
            { key: "completed", label: "Done", color: "#22a06b", bg: "#dcfff1", border: "#abe5c7", headerBg: "#baf3db" },
            { key: "closed", label: "Closed", color: "#626f86", bg: "#f1f2f4", border: "#d1d5db", headerBg: "#e2e4e9" },
          ],
    [dark],
  );

  const backlogTickets = useMemo(
    () => filteredTickets.filter((t) => !t.sprint_id),
    [filteredTickets],
  );

  const ui = {
    pageBg: dark ? "#141416" : "#f4f5f7",
    cardBg: dark ? "#1a1a1c" : "#fff",
    border: dark ? "#2a2a2d" : "#dde3ec",
    text: dark ? "#e5e7eb" : "#172b4d",
    sub: dark ? "#9ca3af" : "#626f86",
    muted: dark ? "#6b7280" : "#9ca3af",
    tabBg: dark ? "#202024" : "#f1f2f4",
  };

  const projectStatusColumns = dark
    ? PROJECT_STATUS.map((ps) => ({
        ...ps,
        bg: "#1a1a1c",
        border: "#2a2a2d",
      }))
    : PROJECT_STATUS;

  return (
    <>
      <style>{`
        .pm-scroll::-webkit-scrollbar { height: 5px; width: 5px }
        .pm-scroll::-webkit-scrollbar-track { background: ${dark ? "#1a1a1c" : "#f1f2f4"}; border-radius: 3px }
        .pm-scroll::-webkit-scrollbar-thumb { background: ${dark ? "#3b3b40" : "#c1c7d0"}; border-radius: 3px }
      `}</style>

      <div style={{ minHeight: "100vh", background: ui.pageBg }}>
        <div style={{ margin: "0 auto", padding: "24px 20px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: ui.text,
                  margin: "0 0 2px",
                }}
              >
                Projects
              </h1>
              <p style={{ fontSize: 12, color: ui.sub, margin: 0 }}>
                Track your assigned projects and issues
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Total", val: stats.total, color: ui.text },
                { label: "Active", val: stats.active, color: "#0c66e4" },
                { label: "Done", val: stats.done, color: "#22a06b" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: ui.cardBg,
                    border: `1px solid ${ui.border}`,
                    borderRadius: 8,
                    padding: "7px 14px",
                    textAlign: "center",
                    minWidth: 60,
                  }}
                >
                  <div
                    style={{ fontSize: 18, fontWeight: 800, color: s.color }}
                  >
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: ui.muted,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects grid */}
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 300,
              }}
            >
              <Spin size="large" />
            </div>
          ) : (
            <div
              className="pm-scroll"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 16,
                overflowX: "auto",
              }}
            >
              {projectStatusColumns.map((ps) => {
                const cols = projects.filter(
                  (p) => normalizeProjectStatus(p.status) === ps.key,
                );
                return (
                  <div key={ps.key}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 6,
                        marginBottom: 10,
                        background: ps.bg,
                        border: `1.5px solid ${ps.border}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: ps.color,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: ps.color,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {ps.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: ps.color,
                          background: ui.cardBg,
                          padding: "1px 7px",
                          borderRadius: 99,
                          border: `1px solid ${ps.border}`,
                        }}
                      >
                        {cols.length}
                      </span>
                    </div>
                    <div style={{ minHeight: 140 }}>
                      {cols.map((p) => (
                        <ProjectCard
                          key={p.id}
                          project={p}
                          onClick={() => openProject(p)}
                          dark={dark}
                        />
                      ))}
                      {cols.length === 0 && (
                        <div
                          style={{
                            border: `1.5px dashed ${ui.border}`,
                            borderRadius: 8,
                            padding: "28px 14px",
                            textAlign: "center",
                          }}
                        >
                          <p
                            style={{
                              fontSize: 11,
                              color: ui.muted,
                              margin: 0,
                            }}
                          >
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
      </div>

      {/* --------------------- PROJECT DRAWER (PM-like flow) --------------------- */}
      <Drawer
        open={showProjectDrawer}
        onClose={closeProjectDrawer}
        width="96%"
        styles={{
          header: {
            padding: "12px 18px",
            borderBottom: `1px solid ${ui.border}`,
            background: ui.cardBg,
          },
          body: { padding: 0, background: ui.pageBg },
        }}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: "linear-gradient(135deg,#003467,#0c66e4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 13 }}>
                  P
                </span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: ui.text }}>
                  {selectedProject?.name}
                </div>
                <div style={{ fontSize: 10, color: ui.muted }}>
                  {selectedProject?.description}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 7, marginRight: 40 }}>
              {[
                { label: "Tickets", val: tickets.length, color: "#003467" },
                {
                  label: "Open",
                  val: tickets.filter((t) => t.status === "open").length,
                  color: "#f97316",
                },
                {
                  label: "Done",
                  val: tickets.filter(
                    (t) => t.status === "completed" || t.status === "closed",
                  ).length,
                  color: "#22a06b",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: ui.pageBg,
                    border: `1px solid ${ui.border}`,
                    borderRadius: 6,
                    padding: "4px 10px",
                    textAlign: "center",
                    minWidth: 52,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: ui.muted,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <div style={{ padding: "0 18px 24px" }}>
          {/* Tabs + search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 0",
              borderBottom: `1px solid ${ui.border}`,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 0,
                background: ui.tabBg,
                padding: 3,
                borderRadius: 6,
              }}
            >
              {["board", "backlog"].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "all .15s",
                    background: activeTab === t ? ui.cardBg : "transparent",
                    color: activeTab === t ? ui.text : ui.sub,
                    boxShadow:
                      activeTab === t ? "0 1px 3px rgba(0,0,0,.1)" : "none",
                  }}
                >
                  {t === "board" ? "Board" : "Backlog"}
                  {t === "backlog" && backlogTickets.length > 0 && (
                    <span
                      style={{
                        marginLeft: 4,
                        background:
                          activeTab === t
                            ? dark
                              ? "#24354f"
                              : "#e0e7ff"
                            : dark
                              ? "#2a2a2d"
                              : "#e5e7eb",
                        color:
                          activeTab === t
                            ? dark
                              ? "#93c5fd"
                              : "#4338ca"
                            : ui.sub,
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 4px",
                        borderRadius: 99,
                      }}
                    >
                      {backlogTickets.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: ui.cardBg,
                border: `1px solid ${ui.border}`,
                borderRadius: 6,
                padding: "5px 10px",
              }}
            >
              <Search size={12} color={ui.muted} />
              <input
                placeholder="Search issues-------"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: 12,
                  color: ui.text,
                  width: 150,
                  background: "transparent",
                }}
              />
              {searchQ && (
                <button
                  onClick={() => setSearchQ("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: ui.muted,
                    display: "flex",
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {loadingData ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 240,
              }}
            >
              <Spin size="large" />
            </div>
          ) : activeTab === "board" ? (
            <div
              className="pm-scroll"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 12,
                overflowX: "auto",
              }}
            >
              {boardColumns.map((col) => {
                const items = filteredTickets.filter((t) => t.status === col.key);
                return (
                  <div
                    key={col.key}
                    style={{
                      background: col.bg,
                      border: `1.5px solid ${col.border}`,
                      borderRadius: 10,
                      padding: 10,
                      minHeight: 240,
                    }}
                  >
                    <div
                      style={{
                        background: col.headerBg,
                        border: `1px solid ${col.border}`,
                        borderRadius: 8,
                        padding: "8px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: col.color,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {col.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: col.color,
                          background: ui.cardBg,
                          padding: "1px 7px",
                          borderRadius: 99,
                          border: `1px solid ${col.border}`,
                        }}
                      >
                        {items.length}
                      </span>
                    </div>

                    {items.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setDetailTicket(t);
                          setDetailsModalOpen(true);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setDetailTicket(t);
                            setDetailsModalOpen(true);
                          }
                        }}
                        style={{
                          background: ui.cardBg,
                          border: `1px solid ${ui.border}`,
                          borderRadius: 8,
                          padding: "10px 10px",
                          marginBottom: 8,
                          cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,.04)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 4px 14px rgba(0,0,0,.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow =
                            "0 1px 2px rgba(0,0,0,.04)";
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 650,
                            color: ui.text,
                            marginBottom: 6,
                            lineHeight: 1.3,
                          }}
                        >
                          {t.title}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 10, color: ui.muted }}>
                            {t.priority ? `Priority: ${t.priority}` : "Priority: --------"}
                          </span>
                          <span style={{ fontSize: 10, color: ui.muted }}>
                            {t.due_date ? `Due ${fmtDate(t.due_date)}` : ""}
                          </span>
                        </div>
                      </div>
                    ))}

                    {items.length === 0 && (
                      <div
                        style={{
                          border: `1.5px dashed ${ui.border}`,
                          borderRadius: 8,
                          padding: "22px 10px",
                          textAlign: "center",
                          background: ui.cardBg,
                        }}
                      >
                        <p style={{ fontSize: 11, color: ui.muted, margin: 0 }}>
                          No issues
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                background: ui.cardBg,
                border: `1px solid ${ui.border}`,
                borderRadius: 10,
                padding: 12,
              }}
            >
              {backlogTickets.length === 0 ? (
                <div
                  style={{
                    border: `1.5px dashed ${ui.border}`,
                    borderRadius: 8,
                    padding: "28px 14px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: 12, color: ui.muted, margin: 0 }}>
                    No backlog issues
                  </p>
                </div>
              ) : (
                backlogTickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setDetailTicket(t);
                      setDetailsModalOpen(true);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setDetailTicket(t);
                        setDetailsModalOpen(true);
                      }
                    }}
                    style={{
                      padding: "10px 10px",
                      borderBottom: `1px solid ${ui.border}`,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 650, color: ui.text }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 11, color: ui.muted, marginTop: 2 }}>
                      {t.ticket_type ? t.ticket_type.toUpperCase() : ""}{" "}
                      {t.priority ? `------- ${t.priority.toUpperCase()}` : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Drawer>

      <TicketDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        ticket={detailTicket}
        projectAssignees={selectedProject?.project_assignees || []}
        sprints={projectSprints}
        lockFieldsForPM
        onRefresh={() => {
          if (selectedProject?.id) fetchProjectTickets(selectedProject.id);
        }}
      />
    </>
  );
};

export default EmployeeProjects;



