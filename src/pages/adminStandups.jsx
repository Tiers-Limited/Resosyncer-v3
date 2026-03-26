import { useState, useEffect, useMemo } from "react";
import {
  DatePicker,
  Avatar,
  Space,
  Typography,
  Spin,
  Input,
  Empty,
  Tooltip,
  Progress,
  Table,
  Button,
  Select,
  Modal,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  MinusOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
  BarChartOutlined,
  TeamOutlined,
  SearchOutlined,
  FolderOutlined,
  RiseOutlined,
  FileTextOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { supabase } from "../lib/supabase";

dayjs.extend(isoWeek);

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_CFG = {
  present: {
    label: "Present",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    icon: <CheckOutlined style={{ fontSize: 9 }} />,
  },
  absent: {
    label: "Absent",
    color: "#e11d48",
    bg: "#fff1f2",
    border: "#fecdd3",
    icon: <CloseOutlined style={{ fontSize: 9 }} />,
  },
  late: {
    label: "Late",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: <ClockCircleOutlined style={{ fontSize: 9 }} />,
  },
  none: {
    label: "No Standup",
    color: "#cbd5e1",
    bg: "#f8fafc",
    border: "#e2e8f0",
    icon: <MinusOutlined style={{ fontSize: 9 }} />,
  },
};

const PROJ_STATUS_CFG = {
  active: { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  "in progress": { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  planning: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  review: { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  completed: { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

const AVATAR_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
];
const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

function getWeekdaysInMonth(year, month) {
  const days = [];
  const start = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const end = start.endOf("month");
  let cur = start;
  while (cur.isBefore(end) || cur.isSame(end, "day")) {
    if (cur.day() !== 0 && cur.day() !== 6) days.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(1, "day");
  }
  return days;
}

const VIEW = { PROJECTS: "projects", PROJECT_DETAIL: "project_detail" };

export default function AdminStandupStats() {
  const [tenantId, setTenantId] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
        setTenantId(profile?.tenant_id ?? null);
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  const [selectedMonth, setMonth] = useState(dayjs());
  const [view, setView] = useState(VIEW.PROJECTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectSummaries, setProjectSummaries] = useState({});

  const [activeProject, setActiveProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [summaryModal, setSummaryModal] = useState(null);

  // ── Load projects (scoped to tenant) ──────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;

    let isMounted = true;

    (async () => {
      try {
        setLoadingProjects(true);

        const { data, error } = await supabase
          .from("projects")
          .select("id, name, status, priority, client_name, project_manager_id")
          .eq("tenant_id", tenantId)
          .eq("is_archived", false)
          .order("name");

        if (!isMounted) return;

        if (error) {
          console.error(error.message);
        } else {
          console.log(data);
          setProjects(data ?? []);
        }
      } finally {
        if (isMounted) setLoadingProjects(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  useEffect(() => {
    if (!projects.length || !tenantId) return;
    (async () => {
      const start = selectedMonth.startOf("month").format("YYYY-MM-DD");
      const end = selectedMonth.endOf("month").format("YYYY-MM-DD");

      // standup_sessions and project_assignees don't have tenant_id —
      // they're implicitly scoped via project_id which is already tenant-filtered
      const { data: sessData } = await supabase
        .from("standup_sessions")
        .select("project_id, date, attendance")
        .in(
          "project_id",
          projects.map((p) => p.id),
        )
        .gte("date", start)
        .lte("date", end);

      const { data: assigneeData } = await supabase
        .from("project_assignees")
        .select("project_id, employee_id")
        .in(
          "project_id",
          projects.map((p) => p.id),
        );

      const teamSizes = {};
      (assigneeData ?? []).forEach((a) => {
        teamSizes[a.project_id] = (teamSizes[a.project_id] || 0) + 1;
      });

      const summaries = {};
      (sessData ?? []).forEach((s) => {
        if (!summaries[s.project_id])
          summaries[s.project_id] = { sessions: 0, p: 0, a: 0, l: 0 };
        summaries[s.project_id].sessions++;
        Object.values(s.attendance ?? {}).forEach((v) => {
          if (v === "present") summaries[s.project_id].p++;
          else if (v === "absent") summaries[s.project_id].a++;
          else if (v === "late") summaries[s.project_id].l++;
        });
      });
      projects.forEach((p) => {
        if (!summaries[p.id])
          summaries[p.id] = { sessions: 0, p: 0, a: 0, l: 0 };
        summaries[p.id].teamSize = teamSizes[p.id] || 0;
      });
      setProjectSummaries(summaries);
    })();
  }, [projects, selectedMonth, tenantId]);

  // ── Open detail ────────────────────────────────────────────────────────
  const openDetail = async (project) => {
    setActiveProject(project);
    setView(VIEW.PROJECT_DETAIL);
    setLoadingDetail(true);
    setEmployees([]);
    setSessions([]);

    const { data: assigneeRows } = await supabase
      .from("project_assignees")
      .select("employee_id")
      .eq("project_id", project.id);
    // project_assignees is scoped implicitly via project_id (already tenant-filtered)

    const ids = (assigneeRows ?? []).map((r) => r.employee_id);
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, job_title, department, user_photo")
        .in("id", ids)
        .eq("tenant_id", tenantId) // 👈 tenant filter
        .eq("suspended", false);
      setEmployees(profiles ?? []);
    }

    const start = selectedMonth.startOf("month").format("YYYY-MM-DD");
    const end = selectedMonth.endOf("month").format("YYYY-MM-DD");
    const { data: sess } = await supabase
      .from("standup_sessions")
      .select("id, date, attendance, summary")
      .eq("project_id", project.id)
      .gte("date", start)
      .lte("date", end)
      .order("date");
    setSessions(sess ?? []);
    setLoadingDetail(false);
  };

  const goBack = () => {
    setView(VIEW.PROJECTS);
    setActiveProject(null);
    setEmployees([]);
    setSessions([]);
  };

  // ── Derived ────────────────────────────────────────────────────────────
  const today = dayjs().format("YYYY-MM-DD");
  const weekdays = useMemo(
    () => getWeekdaysInMonth(selectedMonth.year(), selectedMonth.month() + 1),
    [selectedMonth],
  );

  const sessionMap = useMemo(() => {
    const m = {};
    sessions.forEach((s) => {
      m[s.date] = {
        attendance: s.attendance ?? {},
        summary: s.summary || null,
        id: s.id,
      };
    });
    return m;
  }, [sessions]);

  const employeeStats = useMemo(
    () =>
      employees.map((emp) => {
        let present = 0,
          absent = 0,
          late = 0,
          noStandup = 0;
        weekdays.forEach((d) => {
          if (d > today) return;
          const sess = sessionMap[d];
          if (!sess) {
            noStandup++;
            return;
          }
          const s = sess.attendance[emp.id];
          if (s === "present") present++;
          else if (s === "absent") absent++;
          else if (s === "late") late++;
          else noStandup++;
        });
        const marked = present + absent + late;
        return {
          ...emp,
          present,
          absent,
          late,
          noStandup,
          rate: marked > 0 ? Math.round(((present + late) / marked) * 100) : 0,
        };
      }),
    [employees, weekdays, sessionMap, today],
  );

  const sortedStats = useMemo(
    () => [...employeeStats].sort((a, b) => b.rate - a.rate),
    [employeeStats],
  );

  const overall = useMemo(() => {
    let p = 0,
      a = 0,
      l = 0;
    sessions.forEach((s) => {
      Object.values(s.attendance ?? {}).forEach((v) => {
        if (v === "present") p++;
        else if (v === "absent") a++;
        else if (v === "late") l++;
      });
    });
    return {
      totalSessions: sessions.length,
      pastDays: weekdays.filter((d) => d <= today).length,
      p,
      a,
      l,
    };
  }, [sessions, weekdays, today]);

  const weeks = useMemo(() => {
    const g = [];
    let w = [];
    weekdays.forEach((d, i) => {
      w.push(d);
      if (dayjs(d).day() === 5 || i === weekdays.length - 1) {
        g.push(w);
        w = [];
      }
    });
    return g;
  }, [weekdays]);

  const allPastSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.date <= today)
        .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix()),
    [sessions, today],
  );

  const sessionsWithSummary = useMemo(
    () => allPastSessions.filter((s) => s.summary?.trim()),
    [allPastSessions],
  );

  const globalStats = useMemo(() => {
    const totalSessions = Object.values(projectSummaries).reduce(
      (s, c) => s + c.sessions,
      0,
    );
    const totalP = Object.values(projectSummaries).reduce((s, c) => s + c.p, 0);
    const totalA = Object.values(projectSummaries).reduce((s, c) => s + c.a, 0);
    const totalL = Object.values(projectSummaries).reduce((s, c) => s + c.l, 0);
    const marked = totalP + totalA + totalL;
    return {
      totalSessions,
      totalP,
      totalA,
      totalL,
      overallRate:
        marked > 0 ? Math.round(((totalP + totalL) / marked) * 100) : 0,
      projectsWithStandups: Object.values(projectSummaries).filter(
        (c) => c.sessions > 0,
      ).length,
    };
  }, [projectSummaries]);

  const filteredProjects = useMemo(
    () =>
      projects.filter((p) => {
        const matchSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.client_name || "").toLowerCase().includes(search.toLowerCase());
        const matchStatus =
          !statusFilter || (p.status || "").toLowerCase() === statusFilter;
        return matchSearch && matchStatus;
      }),
    [projects, search, statusFilter],
  );

  // ── Calendar columns ───────────────────────────────────────────────────
  const calendarColumns = useMemo(
    () => [
      {
        title: (
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Member
          </Text>
        ),
        key: "member",
        fixed: "left",
        width: 230,
        render: (_, rec, i) => (
          <Space size={10} style={{ padding: "2px 0" }}>
            <Avatar
              size={32}
              src={rec.user_photo}
              style={{
                background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {!rec.user_photo && getInitials(rec.full_name)}
            </Avatar>
            <div>
              <Text
                strong
                style={{
                  fontSize: 13,
                  color: "#0f172a",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  display: "block",
                }}
              >
                {rec.full_name}
              </Text>
              <Text style={{ fontSize: 11, color: "#94a3b8" }}>
                {rec.job_title || rec.department || "—"}
              </Text>
            </div>
          </Space>
        ),
      },
      ...weekdays.map((date) => {
        const d = dayjs(date);
        const isFuture = date > today;
        const isToday = date === today;
        const sessData = sessionMap[date];
        const hasSummary = !!sessData?.summary?.trim();

        return {
          title: (
            <Tooltip
              title={
                hasSummary ? (
                  <div style={{ maxWidth: 260 }}>
                    <div
                      style={{ fontWeight: 700, marginBottom: 4, fontSize: 11 }}
                    >
                      {d.format("dddd, MMM DD")}
                    </div>
                    <div
                      style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.9 }}
                    >
                      {sessData.summary}
                    </div>
                  </div>
                ) : (
                  d.format("dddd, MMM DD")
                )
              }
              mouseEnterDelay={0.3}
            >
              <div
                onClick={
                  hasSummary
                    ? () =>
                        setSummaryModal({
                          date,
                          summary: sessData.summary,
                          attendance: sessData.attendance,
                        })
                    : undefined
                }
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  padding: "4px 2px",
                  borderRadius: 6,
                  background: isToday ? "#0f172a" : "transparent",
                  minWidth: 26,
                  cursor: hasSummary ? "pointer" : "default",
                  position: "relative",
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    lineHeight: 1,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: isToday ? "#fff" : "#94a3b8",
                  }}
                >
                  {d.format("dd")[0]}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isToday ? 800 : 600,
                    lineHeight: 1,
                    color: isToday ? "#fff" : "#475569",
                  }}
                >
                  {d.format("D")}
                </Text>
                {hasSummary && (
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: isToday ? "#a5b4fc" : "#6366f1",
                      marginTop: 1,
                    }}
                  />
                )}
              </div>
            </Tooltip>
          ),
          key: date,
          width: 34,
          align: "center",
          render: (_, rec) => {
            if (isFuture)
              return (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: "#f8fafc",
                    margin: "0 auto",
                  }}
                />
              );
            if (!sessData)
              return (
                <Tooltip title="No standup held">
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{ fontSize: 8, color: "#cbd5e1", fontWeight: 700 }}
                    >
                      —
                    </Text>
                  </div>
                </Tooltip>
              );
            const status = sessData.attendance[rec.id];
            const cfg = STATUS_CFG[status] || STATUS_CFG.none;
            return (
              <Tooltip
                title={
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        marginBottom: hasSummary ? 6 : 0,
                      }}
                    >
                      {d.format("MMM DD")} · {cfg.label}
                    </div>
                    {hasSummary && (
                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.85,
                          lineHeight: 1.5,
                          maxWidth: 220,
                        }}
                      >
                        {sessData.summary}
                      </div>
                    )}
                  </div>
                }
                mouseEnterDelay={0.2}
              >
                <div
                  onClick={
                    hasSummary
                      ? () =>
                          setSummaryModal({
                            date,
                            summary: sessData.summary,
                            attendance: sessData.attendance,
                          })
                      : undefined
                  }
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: cfg.color,
                    cursor: hasSummary ? "pointer" : "default",
                  }}
                >
                  {cfg.icon}
                </div>
              </Tooltip>
            );
          },
        };
      }),
      {
        title: (
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Rate
          </Text>
        ),
        key: "rate",
        width: 100,
        fixed: "right",
        align: "center",
        sorter: (a, b) => a.rate - b.rate,
        defaultSortOrder: "descend",
        render: (_, rec) => {
          const color =
            rec.rate >= 80 ? "#059669" : rec.rate >= 60 ? "#d97706" : "#e11d48";
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Text
                style={{ fontSize: 15, fontWeight: 800, color, lineHeight: 1 }}
              >
                {rec.rate}%
              </Text>
              <Progress
                percent={rec.rate}
                size="small"
                showInfo={false}
                strokeColor={color}
                trailColor="#f1f5f9"
                style={{ width: 58, margin: 0 }}
              />
            </div>
          );
        },
      },
      {
        title: (
          <Text
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            P · A · L
          </Text>
        ),
        key: "pal",
        width: 90,
        fixed: "right",
        align: "center",
        render: (_, rec) => (
          <Space size={3}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>
              {rec.present}
            </Text>
            <Text style={{ color: "#e2e8f0", fontSize: 10 }}>·</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "#e11d48" }}>
              {rec.absent}
            </Text>
            <Text style={{ color: "#e2e8f0", fontSize: 10 }}>·</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>
              {rec.late}
            </Text>
          </Space>
        ),
      },
    ],
    [weekdays, sessionMap, today],
  );

  // ── Projects table columns ─────────────────────────────────────────────
  const projectColumns = [
    {
      title: "Project",
      key: "project",
      render: (_, rec) => (
        <div>
          <Text
            strong
            style={{
              fontSize: 14,
              color: "#0f172a",
              display: "block",
              lineHeight: 1.3,
            }}
          >
            {rec.name}
          </Text>
          {rec.client_name && (
            <Text style={{ fontSize: 12, color: "#94a3b8" }}>
              {rec.client_name}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const k = (status || "").toLowerCase();
        const cfg = PROJ_STATUS_CFG[k] || {
          color: "#64748b",
          bg: "#f8fafc",
          border: "#e2e8f0",
        };
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              borderRadius: 20,
              border: `1px solid ${cfg.border}`,
              background: cfg.bg,
              fontSize: 12,
              fontWeight: 600,
              color: cfg.color,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: cfg.color,
                display: "inline-block",
              }}
            />
            {capitalize(status || "—")}
          </span>
        );
      },
    },
    {
      title: "Team",
      key: "team",
      width: 80,
      align: "center",
      render: (_, rec) => {
        const s = projectSummaries[rec.id];
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              justifyContent: "center",
            }}
          >
            <TeamOutlined style={{ color: "#94a3b8", fontSize: 12 }} />
            <Text style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>
              {s?.teamSize ?? 0}
            </Text>
          </div>
        );
      },
    },
    {
      title: `Standups (${selectedMonth.format("MMM YY")})`,
      key: "sessions",
      width: 140,
      align: "center",
      render: (_, rec) => {
        const s = projectSummaries[rec.id];
        const pastDays = weekdays.filter((d) => d <= today).length;
        if (!s || s.sessions === 0)
          return (
            <Text style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600 }}>
              0 / {pastDays}
            </Text>
          );
        const pct =
          pastDays > 0 ? Math.round((s.sessions / pastDays) * 100) : 0;
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: 700,
                color:
                  pct >= 80 ? "#059669" : pct >= 50 ? "#d97706" : "#e11d48",
              }}
            >
              {s.sessions}{" "}
              <Text style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>
                / {pastDays}
              </Text>
            </Text>
            <Progress
              percent={pct}
              size="small"
              showInfo={false}
              strokeColor={
                pct >= 80 ? "#059669" : pct >= 50 ? "#d97706" : "#e11d48"
              }
              trailColor="#f1f5f9"
              style={{ width: 70, margin: 0 }}
            />
          </div>
        );
      },
      sorter: (a, b) =>
        (projectSummaries[a.id]?.sessions || 0) -
        (projectSummaries[b.id]?.sessions || 0),
    },
    {
      title: "Attendance",
      key: "attendance",
      width: 200,
      render: (_, rec) => {
        const s = projectSummaries[rec.id];
        if (!s || s.sessions === 0)
          return (
            <Text style={{ fontSize: 12, color: "#cbd5e1" }}>No standups</Text>
          );
        const marked = s.p + s.a + s.l;
        const rate = marked > 0 ? Math.round(((s.p + s.l) / marked) * 100) : 0;
        const rateColor =
          rate >= 80 ? "#059669" : rate >= 60 ? "#d97706" : "#e11d48";
        return (
          <Space size={8}>
            <Space size={4}>
              <Text style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>
                {s.p}P
              </Text>
              <Text style={{ color: "#e2e8f0" }}>·</Text>
              <Text style={{ fontSize: 12, fontWeight: 700, color: "#e11d48" }}>
                {s.a}A
              </Text>
              <Text style={{ color: "#e2e8f0" }}>·</Text>
              <Text style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>
                {s.l}L
              </Text>
            </Space>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: rateColor,
                background:
                  rate >= 80 ? "#ecfdf5" : rate >= 60 ? "#fffbeb" : "#fff1f2",
                padding: "1px 8px",
                borderRadius: 20,
              }}
            >
              {rate}%
            </span>
          </Space>
        );
      },
      sorter: (a, b) => {
        const sa = projectSummaries[a.id];
        const sb = projectSummaries[b.id];
        return (
          (sa
            ? Math.round(
                ((sa.p + sa.l) / Math.max(sa.p + sa.a + sa.l, 1)) * 100,
              )
            : 0) -
          (sb
            ? Math.round(
                ((sb.p + sb.l) / Math.max(sb.p + sb.a + sb.l, 1)) * 100,
              )
            : 0)
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 140,
      render: (_, rec) => (
        <Button
          icon={<BarChartOutlined />}
          onClick={() => openDetail(rec)}
          style={{
            borderRadius: 8,
            height: 34,
            paddingInline: 16,
            fontWeight: 600,
            fontSize: 13,
            background: "#0f172a",
            border: "none",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(15,23,42,0.15)",
          }}
        >
          View Stats
        </Button>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Outfit', sans-serif !important; }
        .ant-table { background: transparent !important; }
        .ant-table-thead > tr > th { background: #f9fafb !important; color: #94a3b8 !important; font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9 !important; padding: 10px 14px !important; white-space: nowrap; }
        .ant-table-tbody > tr > td { border-bottom: 1px solid #f9fafb !important; padding: 13px 14px !important; }
        .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .ant-table-tbody > tr:hover > td { background: #f8fafc !important; }
        .heatmap-table .ant-table-thead > tr > th { padding: 10px 5px !important; }
        .heatmap-table .ant-table-tbody > tr > td { padding: 9px 5px !important; }
        .ant-table-cell-fix-left { background: #fff !important; }
        .ant-table-cell-fix-right { background: #fff !important; }
        .ant-table-tbody > tr:hover .ant-table-cell-fix-left,
        .ant-table-tbody > tr:hover .ant-table-cell-fix-right { background: #f8fafc !important; }
        .ant-picker { border-radius: 8px !important; border-color: #e2e8f0 !important; }
        .ant-input { border-radius: 8px !important; }
        .ant-select-selector { border-radius: 8px !important; border-color: #e2e8f0 !important; }
        .ant-table-body { overflow-x: auto !important; }
        .ant-table-sticky-scroll { display: none !important; }
        .proj-row:hover > td { background: #f8fafc !important; }
        .ant-modal-content { border-radius: 16px !important; overflow: hidden; }
        .ant-modal-header { padding: 20px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .ant-modal-body { padding: 0 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ borderBottom: "1px solid #f1f5f9", padding: "0 40px" }}>
        <div style={{ margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 0",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {view === VIEW.PROJECT_DETAIL && (
                <button
                  onClick={goBack}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "transparent",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "6px 12px",
                    cursor: "pointer",
                    color: "#64748b",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <ArrowLeftOutlined style={{ fontSize: 11 }} /> Back
                </button>
              )}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#0f172a",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {view === VIEW.PROJECT_DETAIL
                      ? `${activeProject?.name} · Detail`
                      : "Admin · Standup Stats"}
                  </Text>
                </div>
                <Title
                  level={4}
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontWeight: 800,
                    letterSpacing: -0.5,
                  }}
                >
                  {view === VIEW.PROJECT_DETAIL
                    ? `Attendance · ${selectedMonth.format("MMMM YYYY")}`
                    : "Standup Overview"}
                </Title>
              </div>
            </div>
            <Space wrap>
              {view === VIEW.PROJECTS && (
                <>
                  <Input
                    placeholder="Search projects…"
                    prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: 200,
                      borderRadius: 8,
                      borderColor: "#e2e8f0",
                    }}
                    allowClear
                  />
                  <Select
                    placeholder="All statuses"
                    style={{ width: 150 }}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    allowClear
                  >
                    {[
                      "active",
                      "in progress",
                      "planning",
                      "review",
                      "completed",
                    ].map((s) => (
                      <Option key={s} value={s}>
                        {capitalize(s)}
                      </Option>
                    ))}
                  </Select>
                </>
              )}
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={(d) => {
                  if (d) {
                    setMonth(d);
                    if (view === VIEW.PROJECT_DETAIL && activeProject)
                      openDetail(activeProject);
                  }
                }}
                disabledDate={(d) => d && d > dayjs().endOf("month")}
                format="MMMM YYYY"
                style={{ width: 155 }}
                allowClear={false}
                suffixIcon={<CalendarOutlined style={{ color: "#94a3b8" }} />}
              />
            </Space>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ margin: "0 auto", padding: "28px 40px" }}>
        {/* PROJECTS VIEW */}
        {view === VIEW.PROJECTS && (
          <>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 24,
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  icon: <FolderOutlined />,
                  label: "Total Projects",
                  value: projects.length,
                  sub: `${globalStats.projectsWithStandups} with standups this month`,
                  color: "#0f172a",
                  bg: "#f8fafc",
                  border: "#e2e8f0",
                },
                {
                  icon: <CalendarOutlined />,
                  label: "Total Standups",
                  value: globalStats.totalSessions,
                  sub: selectedMonth.format("MMMM YYYY"),
                  color: "#6366f1",
                  bg: "#eef2ff",
                  border: "#c7d2fe",
                },
                {
                  icon: <CheckOutlined />,
                  label: "Total Present",
                  value: globalStats.totalP,
                  sub:
                    globalStats.totalP +
                      globalStats.totalA +
                      globalStats.totalL >
                    0
                      ? `${Math.round((globalStats.totalP / (globalStats.totalP + globalStats.totalA + globalStats.totalL)) * 100)}% of marked`
                      : "No data",
                  color: "#059669",
                  bg: "#ecfdf5",
                  border: "#a7f3d0",
                },
                {
                  icon: <CloseOutlined />,
                  label: "Total Absent",
                  value: globalStats.totalA,
                  sub:
                    globalStats.totalP +
                      globalStats.totalA +
                      globalStats.totalL >
                    0
                      ? `${Math.round((globalStats.totalA / (globalStats.totalP + globalStats.totalA + globalStats.totalL)) * 100)}% of marked`
                      : "No data",
                  color: "#e11d48",
                  bg: "#fff1f2",
                  border: "#fecdd3",
                },
                {
                  icon: <RiseOutlined />,
                  label: "Overall Attend. Rate",
                  value: `${globalStats.overallRate}%`,
                  sub: "present + late / total marked",
                  color:
                    globalStats.overallRate >= 80
                      ? "#059669"
                      : globalStats.overallRate >= 60
                        ? "#d97706"
                        : "#e11d48",
                  bg:
                    globalStats.overallRate >= 80
                      ? "#ecfdf5"
                      : globalStats.overallRate >= 60
                        ? "#fffbeb"
                        : "#fff1f2",
                  border:
                    globalStats.overallRate >= 80
                      ? "#a7f3d0"
                      : globalStats.overallRate >= 60
                        ? "#fde68a"
                        : "#fecdd3",
                },
              ].map(({ icon, label, value, sub, color, bg, border }) => (
                <div
                  key={label}
                  style={{
                    flex: "1 1 150px",
                    minWidth: 140,
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: `1px solid ${border}`,
                    background: bg,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 7,
                    }}
                  >
                    <span style={{ color, fontSize: 12 }}>{icon}</span>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {label}
                    </Text>
                  </div>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color,
                      display: "block",
                      lineHeight: 1,
                      marginBottom: 3,
                    }}
                  >
                    {value}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</Text>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #f1f5f9",
                overflow: "hidden",
                boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f9fafb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Space>
                  <FolderOutlined style={{ color: "#94a3b8" }} />
                  <Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                    All Projects
                  </Text>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#64748b",
                      background: "#f1f5f9",
                      borderRadius: 20,
                      padding: "1px 10px",
                    }}
                  >
                    {filteredProjects.length}
                  </span>
                </Space>
                <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                  Click "View Stats" to drill into any project
                </Text>
              </div>
              {loadingProjects ? (
                <div style={{ textAlign: "center", padding: 64 }}>
                  <Spin size="large" />
                </div>
              ) : filteredProjects.length === 0 ? (
                <Empty
                  description={<Text type="secondary">No projects found</Text>}
                  style={{ padding: 64 }}
                />
              ) : (
                <Table
                  dataSource={filteredProjects}
                  columns={projectColumns}
                  rowKey="id"
                  pagination={{
                    pageSize: 15,
                    showSizeChanger: false,
                    showTotal: (t) => `${t} projects`,
                  }}
                  rowClassName="proj-row"
                  style={{ borderRadius: 0 }}
                />
              )}
            </div>
          </>
        )}

        {/* PROJECT DETAIL VIEW */}
        {view === VIEW.PROJECT_DETAIL && (
          <>
            {loadingDetail ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Spin size="large" />
              </div>
            ) : (
              <>
                {/* Project strip */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #f1f5f9",
                    padding: "16px 20px",
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 20,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FolderOutlined
                        style={{ color: "#475569", fontSize: 18 }}
                      />
                    </div>
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: 15,
                          color: "#0f172a",
                          display: "block",
                          lineHeight: 1.2,
                        }}
                      >
                        {activeProject?.name}
                      </Text>
                      {activeProject?.client_name && (
                        <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                          {activeProject.client_name}
                        </Text>
                      )}
                    </div>
                  </div>
                  <div
                    style={{ height: 32, width: 1, background: "#f1f5f9" }}
                  />
                  {[
                    {
                      label: "Status",
                      value: capitalize(activeProject?.status || "—"),
                      color:
                        PROJ_STATUS_CFG[
                          (activeProject?.status || "").toLowerCase()
                        ]?.color || "#64748b",
                    },
                    {
                      label: "Team Size",
                      value: `${employees.length} members`,
                    },
                    {
                      label: "Standups Held",
                      value: `${overall.totalSessions} / ${overall.pastDays}`,
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          display: "block",
                          marginBottom: 2,
                        }}
                      >
                        {label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: color || "#0f172a",
                        }}
                      >
                        {value}
                      </Text>
                    </div>
                  ))}
                </div>

                {/* Summary stat cards */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 22,
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    {
                      icon: <CalendarOutlined />,
                      label: "Standups Held",
                      value: overall.totalSessions,
                      sub: `of ${overall.pastDays} weekdays`,
                      color: "#0f172a",
                      bg: "#f8fafc",
                      border: "#e2e8f0",
                    },
                    {
                      icon: <CheckOutlined />,
                      label: "Present",
                      value: overall.p,
                      sub:
                        overall.p + overall.a + overall.l > 0
                          ? `${Math.round((overall.p / (overall.p + overall.a + overall.l)) * 100)}% of marked`
                          : "No data",
                      color: "#059669",
                      bg: "#ecfdf5",
                      border: "#a7f3d0",
                    },
                    {
                      icon: <CloseOutlined />,
                      label: "Absent",
                      value: overall.a,
                      sub:
                        overall.p + overall.a + overall.l > 0
                          ? `${Math.round((overall.a / (overall.p + overall.a + overall.l)) * 100)}% of marked`
                          : "No data",
                      color: "#e11d48",
                      bg: "#fff1f2",
                      border: "#fecdd3",
                    },
                    {
                      icon: <ClockCircleOutlined />,
                      label: "Late",
                      value: overall.l,
                      sub:
                        overall.p + overall.a + overall.l > 0
                          ? `${Math.round((overall.l / (overall.p + overall.a + overall.l)) * 100)}% of marked`
                          : "No data",
                      color: "#d97706",
                      bg: "#fffbeb",
                      border: "#fde68a",
                    },
                    {
                      icon: <RiseOutlined />,
                      label: "Attend. Rate",
                      value: `${overall.p + overall.a + overall.l > 0 ? Math.round(((overall.p + overall.l) / (overall.p + overall.a + overall.l)) * 100) : 0}%`,
                      sub: "team avg (present + late)",
                      color: "#0ea5e9",
                      bg: "#f0f9ff",
                      border: "#bae6fd",
                    },
                  ].map(({ icon, label, value, sub, color, bg, border }) => (
                    <div
                      key={label}
                      style={{
                        flex: "1 1 130px",
                        minWidth: 120,
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: `1px solid ${border}`,
                        background: bg,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 7,
                        }}
                      >
                        <span style={{ color, fontSize: 12 }}>{icon}</span>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {label}
                        </Text>
                      </div>
                      <Text
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color,
                          display: "block",
                          lineHeight: 1,
                          marginBottom: 3,
                        }}
                      >
                        {value}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#94a3b8" }}>
                        {sub}
                      </Text>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {activeProject?.name} · {selectedMonth.format("MMMM YYYY")}
                  </Text>
                  <div
                    style={{ height: 12, width: 1, background: "#e2e8f0" }}
                  />
                  {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                    <div
                      key={key}
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <div
                        style={{
                          width: 13,
                          height: 13,
                          borderRadius: 3,
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: cfg.color,
                        }}
                      >
                        {cfg.icon}
                      </div>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        {cfg.label}
                      </Text>
                    </div>
                  ))}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <div
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: 3,
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        fontWeight: 500,
                      }}
                    >
                      Future
                    </Text>
                  </div>
                  {sessionsWithSummary.length > 0 && (
                    <>
                      <div
                        style={{ height: 12, width: 1, background: "#e2e8f0" }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#6366f1",
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            fontWeight: 500,
                          }}
                        >
                          Has summary — click to read
                        </Text>
                      </div>
                    </>
                  )}
                </div>

                {/* Heatmap */}
                {employees.length === 0 ? (
                  <Empty
                    description="No team members assigned"
                    style={{
                      padding: 64,
                      background: "#fff",
                      borderRadius: 14,
                      border: "1px solid #f1f5f9",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      border: "1px solid #f1f5f9",
                      overflow: "hidden",
                      boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 20px 0",
                        borderBottom: "1px solid #f8fafc",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ width: 230, flexShrink: 0 }} />
                      <div
                        style={{
                          display: "flex",
                          flex: 1,
                          overflowX: "auto",
                          paddingBottom: 6,
                        }}
                      >
                        {weeks.map((week, wi) => (
                          <div
                            key={wi}
                            style={{
                              minWidth: week.length * 34,
                              textAlign: "center",
                              padding: "0 2px",
                              borderLeft: wi > 0 ? "1px solid #f1f5f9" : "none",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#cbd5e1",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                              }}
                            >
                              W{dayjs(week[0]).isoWeek()}
                            </Text>
                          </div>
                        ))}
                      </div>
                      <div style={{ width: 190, flexShrink: 0 }} />
                    </div>
                    <Table
                      className="heatmap-table"
                      dataSource={employeeStats}
                      columns={calendarColumns}
                      rowKey="id"
                      pagination={false}
                      scroll={{ x: "max-content" }}
                      size="small"
                      style={{ borderRadius: 0 }}
                    />
                  </div>
                )}

                {/* Daily Standup Summaries Timeline */}
                <div style={{ marginTop: 28 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Daily Standup Summaries
                      </Text>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#6366f1",
                          background: "#eef2ff",
                          borderRadius: 20,
                          padding: "1px 10px",
                          border: "1px solid #c7d2fe",
                        }}
                      >
                        {sessionsWithSummary.length} / {allPastSessions.length}{" "}
                        have notes
                      </span>
                    </div>
                    <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                      {selectedMonth.format("MMMM YYYY")} · most recent first
                    </Text>
                  </div>

                  {allPastSessions.length === 0 ? (
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        border: "1px solid #f1f5f9",
                        padding: "48px 24px",
                        textAlign: "center",
                      }}
                    >
                      <MessageOutlined
                        style={{
                          fontSize: 32,
                          color: "#e2e8f0",
                          display: "block",
                          marginBottom: 10,
                        }}
                      />
                      <Text style={{ color: "#94a3b8" }}>
                        No standups recorded this month yet
                      </Text>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        border: "1px solid #f1f5f9",
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                      }}
                    >
                      {allPastSessions.map((sess, idx) => {
                        const d = dayjs(sess.date);
                        const isToday = sess.date === today;
                        const hasSumm = !!sess.summary?.trim();
                        const att = sess.attendance ?? {};
                        const pCount = Object.values(att).filter(
                          (v) => v === "present",
                        ).length;
                        const aCount = Object.values(att).filter(
                          (v) => v === "absent",
                        ).length;
                        const lCount = Object.values(att).filter(
                          (v) => v === "late",
                        ).length;
                        const total = pCount + aCount + lCount;
                        const rate =
                          total > 0
                            ? Math.round(((pCount + lCount) / total) * 100)
                            : null;
                        const rateColor =
                          rate === null
                            ? "#94a3b8"
                            : rate >= 80
                              ? "#059669"
                              : rate >= 60
                                ? "#d97706"
                                : "#e11d48";

                        return (
                          <div
                            key={sess.id}
                            style={{
                              display: "flex",
                              borderBottom:
                                idx < allPastSessions.length - 1
                                  ? "1px solid #f9fafb"
                                  : "none",
                            }}
                          >
                            <div
                              style={{
                                width: 88,
                                flexShrink: 0,
                                padding: "18px 12px",
                                borderRight: "1px solid #f4f4f5",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                gap: 2,
                                background: isToday ? "#f8faff" : "transparent",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "#94a3b8",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.08em",
                                }}
                              >
                                {d.format("ddd")}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 24,
                                  fontWeight: 800,
                                  color: isToday ? "#6366f1" : "#0f172a",
                                  lineHeight: 1,
                                }}
                              >
                                {d.format("D")}
                              </Text>
                              <Text style={{ fontSize: 11, color: "#94a3b8" }}>
                                {d.format("MMM")}
                              </Text>
                              {isToday && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: "#6366f1",
                                    background: "#eef2ff",
                                    borderRadius: 20,
                                    padding: "1px 6px",
                                    border: "1px solid #c7d2fe",
                                    marginTop: 3,
                                  }}
                                >
                                  TODAY
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                flex: 1,
                                padding: "18px 22px",
                                minWidth: 0,
                              }}
                            >
                              {hasSumm ? (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 7,
                                      marginBottom: 9,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        background: "#6366f1",
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "#6366f1",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                      }}
                                    >
                                      Summary
                                    </Text>
                                  </div>
                                  <Text
                                    style={{
                                      fontSize: 13.5,
                                      color: "#1e293b",
                                      lineHeight: 1.75,
                                      display: "block",
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {sess.summary}
                                  </Text>
                                </>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    paddingTop: 4,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: "#e2e8f0",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Text
                                    style={{
                                      fontSize: 13,
                                      color: "#cbd5e1",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    No summary recorded
                                  </Text>
                                </div>
                              )}
                            </div>

                            <div
                              style={{
                                width: 130,
                                flexShrink: 0,
                                padding: "18px 16px",
                                borderLeft: "1px solid #f4f4f5",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                justifyContent: "flex-start",
                                gap: 7,
                              }}
                            >
                              {total > 0 ? (
                                <>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 5,
                                      flexWrap: "wrap",
                                      justifyContent: "flex-end",
                                    }}
                                  >
                                    {pCount > 0 && (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "#059669",
                                          background: "#ecfdf5",
                                          borderRadius: 6,
                                          padding: "2px 7px",
                                        }}
                                      >
                                        {pCount}P
                                      </span>
                                    )}
                                    {aCount > 0 && (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "#e11d48",
                                          background: "#fff1f2",
                                          borderRadius: 6,
                                          padding: "2px 7px",
                                        }}
                                      >
                                        {aCount}A
                                      </span>
                                    )}
                                    {lCount > 0 && (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: "#d97706",
                                          background: "#fffbeb",
                                          borderRadius: 6,
                                          padding: "2px 7px",
                                        }}
                                      >
                                        {lCount}L
                                      </span>
                                    )}
                                  </div>
                                  {rate !== null && (
                                    <Text
                                      style={{
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: rateColor,
                                        lineHeight: 1,
                                      }}
                                    >
                                      {rate}%
                                    </Text>
                                  )}
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      color: "#94a3b8",
                                      fontWeight: 600,
                                    }}
                                  >
                                    attendance
                                  </Text>
                                </>
                              ) : (
                                <Text
                                  style={{ fontSize: 11, color: "#e2e8f0" }}
                                >
                                  —
                                </Text>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Team breakdown */}
                {sortedStats.length > 0 && (
                  <div style={{ marginTop: 28 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        display: "block",
                        marginBottom: 14,
                      }}
                    >
                      Team Breakdown
                    </Text>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(255px, 1fr))",
                        gap: 12,
                      }}
                    >
                      {sortedStats.map((emp, i) => {
                        const rc =
                          emp.rate >= 80
                            ? "#059669"
                            : emp.rate >= 60
                              ? "#d97706"
                              : "#e11d48";
                        const rb =
                          emp.rate >= 80
                            ? "#ecfdf5"
                            : emp.rate >= 60
                              ? "#fffbeb"
                              : "#fff1f2";
                        const rd =
                          emp.rate >= 80
                            ? "#a7f3d0"
                            : emp.rate >= 60
                              ? "#fde68a"
                              : "#fecdd3";
                        return (
                          <div
                            key={emp.id}
                            style={{
                              background: "#fff",
                              borderRadius: 12,
                              border: "1px solid #f1f5f9",
                              padding: "16px 18px",
                              boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 12,
                              }}
                            >
                              <Space size={10}>
                                <Avatar
                                  size={36}
                                  src={emp.user_photo}
                                  style={{
                                    background:
                                      AVATAR_COLORS[i % AVATAR_COLORS.length],
                                    fontSize: 12,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                  }}
                                >
                                  {!emp.user_photo &&
                                    getInitials(emp.full_name)}
                                </Avatar>
                                <div>
                                  <Text
                                    strong
                                    style={{
                                      fontSize: 13,
                                      color: "#0f172a",
                                      display: "block",
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {emp.full_name}
                                  </Text>
                                  <Text
                                    style={{ fontSize: 11, color: "#94a3b8" }}
                                  >
                                    {emp.job_title || emp.department || "—"}
                                  </Text>
                                </div>
                              </Space>
                              <div
                                style={{
                                  padding: "3px 10px",
                                  borderRadius: 20,
                                  border: `1px solid ${rd}`,
                                  background: rb,
                                  flexShrink: 0,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: rc,
                                  }}
                                >
                                  {emp.rate}%
                                </Text>
                              </div>
                            </div>
                            <Progress
                              percent={emp.rate}
                              showInfo={false}
                              strokeColor={rc}
                              trailColor="#f1f5f9"
                              size="small"
                              style={{ marginBottom: 12 }}
                            />
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 6,
                              }}
                            >
                              {[
                                {
                                  label: "Present",
                                  value: emp.present,
                                  color: "#059669",
                                  bg: "#ecfdf5",
                                },
                                {
                                  label: "Absent",
                                  value: emp.absent,
                                  color: "#e11d48",
                                  bg: "#fff1f2",
                                },
                                {
                                  label: "Late",
                                  value: emp.late,
                                  color: "#d97706",
                                  bg: "#fffbeb",
                                },
                              ].map(({ label, value, color, bg }) => (
                                <div
                                  key={label}
                                  style={{
                                    textAlign: "center",
                                    padding: "8px 4px",
                                    borderRadius: 8,
                                    background: bg,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 18,
                                      fontWeight: 800,
                                      color,
                                      display: "block",
                                      lineHeight: 1,
                                    }}
                                  >
                                    {value}
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 600,
                                      color,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.04em",
                                    }}
                                  >
                                    {label}
                                  </Text>
                                </div>
                              ))}
                            </div>
                            {i === 0 && (
                              <div
                                style={{
                                  marginTop: 10,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  paddingTop: 10,
                                  borderTop: "1px solid #f8fafc",
                                }}
                              >
                                <TrophyOutlined
                                  style={{ color: "#d97706", fontSize: 12 }}
                                />
                                <Text
                                  style={{
                                    fontSize: 11,
                                    color: "#d97706",
                                    fontWeight: 700,
                                  }}
                                >
                                  Top Attendee this month
                                </Text>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Summary Detail Modal */}
      <Modal
        open={!!summaryModal}
        onCancel={() => setSummaryModal(null)}
        footer={null}
        width={520}
        title={
          summaryModal && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileTextOutlined style={{ color: "#6366f1", fontSize: 18 }} />
              </div>
              <div>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "block",
                  }}
                >
                  Standup Summary
                </Text>
                <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
                  {dayjs(summaryModal.date).format("dddd, MMMM D, YYYY")}
                </Text>
              </div>
            </div>
          )
        }
      >
        {summaryModal && (
          <div style={{ padding: "20px 24px 24px" }}>
            <div
              style={{
                background: "#f8faff",
                border: "1px solid #e0e7ff",
                borderRadius: 10,
                padding: "16px 18px",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#1e293b",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {summaryModal.summary}
              </Text>
            </div>
            {summaryModal.attendance &&
              Object.keys(summaryModal.attendance).length > 0 && (
                <>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      display: "block",
                      marginBottom: 12,
                    }}
                  >
                    Attendance
                  </Text>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[
                      {
                        key: "present",
                        label: "Present",
                        color: "#059669",
                        bg: "#ecfdf5",
                        border: "#a7f3d0",
                      },
                      {
                        key: "absent",
                        label: "Absent",
                        color: "#e11d48",
                        bg: "#fff1f2",
                        border: "#fecdd3",
                      },
                      {
                        key: "late",
                        label: "Late",
                        color: "#d97706",
                        bg: "#fffbeb",
                        border: "#fde68a",
                      },
                    ].map(({ key, label, color, bg, border }) => {
                      const count = Object.values(
                        summaryModal.attendance,
                      ).filter((v) => v === key).length;
                      return (
                        <div
                          key={key}
                          style={{
                            flex: 1,
                            textAlign: "center",
                            padding: "12px 8px",
                            borderRadius: 10,
                            background: bg,
                            border: `1px solid ${border}`,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 24,
                              fontWeight: 800,
                              color,
                              display: "block",
                              lineHeight: 1,
                            }}
                          >
                            {count}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {label}
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
