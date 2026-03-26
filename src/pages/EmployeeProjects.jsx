import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message, Spin, Tooltip } from "antd";
import { Calendar } from "lucide-react";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

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

const fmtDate = (d) => (d ? dayjs(d).format("MMM D") : "—");

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

const normalizeProjectStatus = (status) => {
  if (PROJECT_STATUS.some((s) => s.key === status)) return status;
  if (status === "planning") return "not_started";
  if (status === "active") return "in_progress";
  return "not_started";
};

const UserAvatar = ({ name = "", image, size = 20 }) => (
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
        border: "2px solid #fff",
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

const ProjectCard = ({ project, onClick }) => {
  const normalized = normalizeProjectStatus(project.status);
  const ps = PROJECT_STATUS.find((s) => s.key === normalized) || PROJECT_STATUS[0];
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      style={{
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
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
        e.currentTarget.style.borderColor = ps.border;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,.04)";
        e.currentTarget.style.borderColor = "#e5e7eb";
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
          style={{ fontSize: 12, fontWeight: 700, color: "#172b4d", margin: 0 }}
        >
          {project.name}
        </h3>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            padding: "2px 6px",
            borderRadius: 99,
            color: ps.color,
            background: ps.bg,
            border: `1px solid ${ps.border}`,
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
          color: "#626f86",
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
              />
            </div>
          ))}
        </div>
        <span
          style={{
            fontSize: 10,
            color: "#9ca3af",
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
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.id) fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

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

  const openProject = (project) => {
    navigate(`/projects/${project.id}/tickets`);
  };

  return (
    <>
      <style>{`
        .pm-scroll::-webkit-scrollbar { height: 5px; width: 5px }
        .pm-scroll::-webkit-scrollbar-track { background: #f1f2f4; border-radius: 3px }
        .pm-scroll::-webkit-scrollbar-thumb { background: #c1c7d0; border-radius: 3px }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f5f7" }}>
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
                  color: "#172b4d",
                  margin: "0 0 2px",
                }}
              >
                Projects
              </h1>
              <p style={{ fontSize: 12, color: "#626f86", margin: 0 }}>
                Track your assigned projects and issues
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Total", val: stats.total, color: "#172b4d" },
                { label: "Active", val: stats.active, color: "#0c66e4" },
                { label: "Done", val: stats.done, color: "#22a06b" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "#fff",
                    border: "1px solid #dde3ec",
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
                      color: "#9ca3af",
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
              {PROJECT_STATUS.map((ps) => {
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
                          background: "#fff",
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
                        />
                      ))}
                      {cols.length === 0 && (
                        <div
                          style={{
                            border: "1.5px dashed #dde3ec",
                            borderRadius: 8,
                            padding: "28px 14px",
                            textAlign: "center",
                          }}
                        >
                          <p
                            style={{
                              fontSize: 11,
                              color: "#d1d5db",
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
    </>
  );
};

export default EmployeeProjects;
