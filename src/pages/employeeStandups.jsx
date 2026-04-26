import { useState, useEffect, useMemo } from "react";
import {
  DatePicker, Avatar, Space, Typography, Spin,
  Empty, Tooltip, Progress, Table, Button, Tag,
} from "antd";
import {
  CheckOutlined, CloseOutlined, ClockCircleOutlined,
  MinusOutlined, CalendarOutlined, ArrowLeftOutlined,
  TrophyOutlined, BarChartOutlined, TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

dayjs.extend(isoWeek);

const { Title, Text } = Typography;

// ---------------- Constants ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const STATUS_CFG = {
  present: { label: "Present",    color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: <CheckOutlined style={{ fontSize: 9 }} /> },
  absent:  { label: "Absent",     color: "#e11d48", bg: "#fff1f2", border: "#fecdd3", icon: <CloseOutlined style={{ fontSize: 9 }} /> },
  late:    { label: "Late",       color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: <ClockCircleOutlined style={{ fontSize: 9 }} /> },
  leave:   { label: "Leave",      color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: <CalendarOutlined style={{ fontSize: 9 }} /> },
  none:    { label: "No Standup", color: "#cbd5e1", bg: "#f8fafc", border: "#e2e8f0", icon: <MinusOutlined style={{ fontSize: 9 }} /> },
};

const PROJECT_STATUS_CFG = {
  active:         { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  "in progress":  { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  planning:       { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  review:         { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
};

const AVATAR_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6","#14b8a6","#f97316"];
const getInitials = (name = "") => name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);
const formatStatusLabel = (s = "") =>
  String(s || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
const getIsDarkTheme = () => {
  if (typeof window === "undefined") return false;
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

function getWeekdaysInMonth(year, month) {
  const days = [];
  const start = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const end = start.endOf("month");
  let cur = start;
  while (cur.isBefore(end) || cur.isSame(end, "day")) {
    const dow = cur.day();
    if (dow !== 0 && dow !== 6) days.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(1, "day");
  }
  return days;
}

// ---------------- Component ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default function StandupStats() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const [dark, setDark] = useState(getIsDarkTheme);
  const [isMobile, setIsMobile] = useState(
    () => (typeof window !== "undefined" ? window.innerWidth <= 768 : false),
  );

  const [selectedMonth, setMonth]           = useState(dayjs());

  // Projects list
  const [projects, setProjects]             = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  // Quick session counts per project for the table column
  const [projectSessionCounts, setProjectSessionCounts] = useState({});

  // Stats view
  const [activeProject, setActiveProject]   = useState(null);
  const [sessions, setSessions]             = useState([]);
  const [employees, setEmployees]           = useState([]);
  const [loadingData, setLoadingData]       = useState(false);

  useEffect(() => {
    const applyTheme = () => setDark(getIsDarkTheme());
    window.addEventListener("storage", applyTheme);
    window.addEventListener("themeModeChanged", applyTheme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener?.("change", applyTheme);
    return () => {
      window.removeEventListener("storage", applyTheme);
      window.removeEventListener("themeModeChanged", applyTheme);
      media.removeEventListener?.("change", applyTheme);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ---------------- Load projects assigned to this employee --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoadingProjects(true);

      const { data: assigneeRows, error: aErr } = await supabase
        .from("project_assignees")
        .select("project_id")
        .eq("employee_id", userId);

      if (aErr || !assigneeRows?.length) {
        setProjects([]);
        setLoadingProjects(false);
        return;
      }

      const projectIds = assigneeRows.map((r) => r.project_id);

      const { data: projectData, error: pErr } = await supabase
        .from("projects")
        .select("id, name, status, priority, start_date, end_date, client_name")
        .in("id", projectIds)
        .eq("is_archived", false)
        .order("name");

      if (!pErr) setProjects(projectData ?? []);
      setLoadingProjects(false);
    })();
  }, [userId]);

  // ---------------- Load session counts for each project (current month) ----------------------------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    if (!projects.length || !selectedMonth) return;
    (async () => {
      const start = selectedMonth.startOf("month").format("YYYY-MM-DD");
      const end   = selectedMonth.endOf("month").format("YYYY-MM-DD");

      const { data } = await supabase
        .from("standup_sessions")
        .select("project_id, date, attendance")
        .in("project_id", projects.map((p) => p.id))
        .gte("date", start)
        .lte("date", end);

      const counts = {};
      (data ?? []).forEach((s) => {
        if (!counts[s.project_id]) counts[s.project_id] = { sessions: 0, present: 0, absent: 0, late: 0, leave: 0 };
        counts[s.project_id].sessions++;
        const att = s.attendance ?? {};
        if (att[userId] === "present")     counts[s.project_id].present++;
        else if (att[userId] === "absent") counts[s.project_id].absent++;
        else if (att[userId] === "late")   counts[s.project_id].late++;
        else if (att[userId] === "leave")  counts[s.project_id].leave++;
      });
      setProjectSessionCounts(counts);
    })();
  }, [projects, selectedMonth, userId]);

  // ---------------- Open stats view for a project --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const openStats = async (project) => {
    setActiveProject(project);
    setLoadingData(true);
    setSessions([]);
    setEmployees([]);

    // All assignees
    const { data: assigneeRows } = await supabase
      .from("project_assignees")
      .select("employee_id")
      .eq("project_id", project.id);

    const ids = (assigneeRows ?? []).map((r) => r.employee_id);
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, job_title, department, user_photo")
        .in("id", ids)
        .eq("suspended", false);
      setEmployees(profiles ?? []);
    }

    // Sessions for the month
    const start = selectedMonth.startOf("month").format("YYYY-MM-DD");
    const end   = selectedMonth.endOf("month").format("YYYY-MM-DD");
    const { data: sess } = await supabase
      .from("standup_sessions")
      .select("id, date, attendance, summary")
      .eq("project_id", project.id)
      .gte("date", start)
      .lte("date", end)
      .order("date");

    setSessions(sess ?? []);
    setLoadingData(false);
  };

  const closeStats = () => {
    setActiveProject(null);
    setEmployees([]);
    setSessions([]);
  };

  // ---------------- Derived ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const today = dayjs().format("YYYY-MM-DD");

  const weekdays = useMemo(
    () => getWeekdaysInMonth(selectedMonth.year(), selectedMonth.month() + 1),
    [selectedMonth]
  );

  const sessionMap = useMemo(() => {
    const m = {};
    sessions.forEach((s) => { m[s.date] = s.attendance ?? {}; });
    return m;
  }, [sessions]);

  const employeeStats = useMemo(() => {
    return employees.map((emp) => {
      let present = 0, absent = 0, late = 0, leave = 0, noStandup = 0;
      weekdays.forEach((d) => {
        if (d > today) return;
        if (!sessionMap[d]) { noStandup++; return; }
        const s = sessionMap[d][emp.id];
        if (s === "present")     present++;
        else if (s === "absent") absent++;
        else if (s === "late")   late++;
        else if (s === "leave")  leave++;
        else                     noStandup++;
      });
      const marked = present + absent + late + leave;
      const rate = marked > 0 ? Math.round(((present + late + leave) / marked) * 100) : 0;
      return { ...emp, present, absent, late, leave, noStandup, rate, isMe: emp.id === userId };
    });
  }, [employees, weekdays, sessionMap, today, userId]);

  const sortedStats = useMemo(
    () => [...employeeStats].sort((a, b) => b.rate - a.rate),
    [employeeStats]
  );

  const myStats = useMemo(() => employeeStats.find((e) => e.isMe) ?? null, [employeeStats]);

  const overall = useMemo(() => {
    let p = 0, a = 0, l = 0, lv = 0;
    sessions.forEach((s) => {
      Object.values(s.attendance ?? {}).forEach((v) => {
        if (v === "present")     p++;
        else if (v === "absent") a++;
        else if (v === "late")   l++;
        else if (v === "leave")  lv++;
      });
    });
    const pastWeekdays = weekdays.filter((d) => d <= today).length;
    return { totalSessions: sessions.length, pastWeekdays, p, a, l, lv };
  }, [sessions, weekdays, today]);

  const weeks = useMemo(() => {
    const grouped = [];
    let week = [];
    weekdays.forEach((d, i) => {
      week.push(d);
      if (dayjs(d).day() === 5 || i === weekdays.length - 1) { grouped.push(week); week = []; }
    });
    return grouped;
  }, [weekdays]);

  // ---------------- Projects table columns ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const projectColumns = [
    {
      title: "Project",
      key: "project",
      render: (_, rec) => (
        <div>
          <Text strong style={{ fontSize: 14, color: dark ? "#f3f4f6" : "#0f172a", display: "block", lineHeight: 1.3 }}>{rec.name}</Text>
          {rec.client_name && <Text style={{ fontSize: 12, color: "#94a3b8" }}>{rec.client_name}</Text>}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const key = (status || "").toLowerCase();
        const cfg = PROJECT_STATUS_CFG[key] || { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" };
        const darkCfg = {
          color: "#cbd5e1",
          bg: "rgba(226,232,240,0.14)",
          border: "rgba(148,163,184,0.35)",
        };
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 20,
            border: `1px solid ${dark ? darkCfg.border : cfg.border}`,
            background: dark ? darkCfg.bg : cfg.bg,
            fontSize: 12, fontWeight: 600, color: dark ? darkCfg.color : cfg.color,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: dark ? darkCfg.color : cfg.color, display: "inline-block" }} />
            {formatStatusLabel(status) || "N/A"}
          </span>
        );
      },
    },
    {
      title: `My Attendance (${selectedMonth.format("MMM YYYY")})`,
      key: "myAttendance",
      width: 220,
      render: (_, rec) => {
        const c = projectSessionCounts[rec.id];
        if (!c || c.sessions === 0) {
          return (
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e2e8f0", display: "inline-block" }} />
              No standups held
            </span>
          );
        }
        const marked = c.present + c.absent + c.late + (c.leave || 0);
        const rate   = marked > 0 ? Math.round(((c.present + c.late + (c.leave || 0)) / marked) * 100) : 0;
        const rateColor = rate >= 80 ? "#059669" : rate >= 60 ? "#d97706" : "#e11d48";
        return (
          <Space size={10}>
            <Space size={5}>
              <Text style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{c.present}P</Text>
              <Text style={{ color: dark ? "#475569" : "#e2e8f0" }}>|</Text>
              <Text style={{ fontSize: 12, fontWeight: 700, color: "#e11d48" }}>{c.absent}A</Text>
              <Text style={{ color: dark ? "#475569" : "#e2e8f0" }}>|</Text>
              <Text style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>{c.late}L</Text>
              <Text style={{ color: dark ? "#475569" : "#e2e8f0" }}>|</Text>
              <Text style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{c.leave || 0}Lv</Text>
            </Space>
            <span style={{
              fontSize: 12, fontWeight: 800, color: rateColor,
              background: dark
                ? (rate >= 80 ? "rgba(16,185,129,0.18)" : rate >= 60 ? "rgba(245,158,11,0.18)" : "rgba(244,63,94,0.18)")
                : (rate >= 80 ? "#ecfdf5" : rate >= 60 ? "#fffbeb" : "#fff1f2"),
              border: `1px solid ${
                dark
                  ? (rate >= 80 ? "rgba(16,185,129,0.35)" : rate >= 60 ? "rgba(245,158,11,0.35)" : "rgba(244,63,94,0.35)")
                  : "transparent"
              }`,
              padding: "1px 8px", borderRadius: 20,
            }}>
              {rate}%
            </span>
          </Space>
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
          onClick={() => openStats(rec)}
          style={{
            borderRadius: 8, height: 34, paddingInline: 16,
            fontWeight: 600, fontSize: 13,
            background: dark ? "#ffffff" : "#0f172a",
            border: dark ? "1px solid #ffffff" : "none",
            color: dark ? "#0f172a" : "#fff",
            boxShadow: dark ? "none" : "0 2px 8px rgba(15,23,42,0.15)",
          }}
        >
          View Stats
        </Button>
      ),
    },
  ];

  const memberColWidth = isMobile ? 170 : 220;
  const rateColWidth = isMobile ? 84 : 100;
  const palColWidth = isMobile ? 80 : 90;
  const dayColWidth = isMobile ? 30 : 34;

  // ---------------- Calendar heatmap columns --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const calendarColumns = useMemo(() => [
    {
      title: <Text style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Member</Text>,
      key: "member",
      fixed: "left",
      width: memberColWidth,
      render: (_, rec, i) => (
        <Space size={10} style={{ padding: "2px 0" }}>
          <Avatar
            size={32}
            src={rec.user_photo}
            style={{
              background: AVATAR_COLORS[i % AVATAR_COLORS.length],
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              outline: rec.isMe ? "2px solid #6366f1" : "none",
              outlineOffset: 2,
            }}
          >
            {!rec.user_photo && getInitials(rec.full_name)}
          </Avatar>
          <div>
            <Space size={4}>
              <Text strong style={{ fontSize: 13, color: dark ? "#f3f4f6" : "#0f172a", lineHeight: 1.2, whiteSpace: "nowrap" }}>{rec.full_name}</Text>
              {rec.isMe && (
                <span style={{ fontSize: 10, fontWeight: 700, color: dark ? "#c7d2fe" : "#6366f1", background: dark ? "rgba(99,102,241,0.2)" : "#eef2ff", border: `1px solid ${dark ? "rgba(129,140,248,0.45)" : "#c7d2fe"}`, borderRadius: 20, padding: "1px 7px" }}>
                  You
                </span>
              )}
            </Space>
            <Text style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>{rec.job_title || rec.department || "N/A"}</Text>
          </div>
        </Space>
      ),
    },
    ...weekdays.map((date) => {
      const d = dayjs(date);
      const isFuture = date > today;
      const isToday  = date === today;
      return {
        title: (
          <Tooltip title={d.format("dddd, MMM DD")} mouseEnterDelay={0.3}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
              padding: "4px 2px", borderRadius: 6,
              background: isToday ? (dark ? "#0b1224" : "#0f172a") : "transparent", minWidth: 26,
            }}>
              <Text style={{ fontSize: 9, fontWeight: 700, lineHeight: 1, textTransform: "uppercase", letterSpacing: "0.04em", color: isToday ? "#fff" : "#94a3b8" }}>
                {d.format("dd")[0]}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: isToday ? 800 : 600, lineHeight: 1, color: isToday ? "#fff" : "#475569" }}>
                {d.format("D")}
              </Text>
            </div>
          </Tooltip>
        ),
        key: date,
        width: dayColWidth,
        align: "center",
        render: (_, rec) => {
          if (isFuture) return <div style={{ width: 20, height: 20, borderRadius: 5, background: dark ? "#2a2f3a" : "#f8fafc", margin: "0 auto" }} />;
          const sess = sessionMap[date];
          if (!sess) return (
            <Tooltip title="No standup held">
              <div style={{ width: 20, height: 20, borderRadius: 5, background: dark ? "#252a34" : "#f1f5f9", border: `1px solid ${dark ? "#3a4456" : "#e2e8f0"}`, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 8, color: dark ? "#94a3b8" : "#cbd5e1", fontWeight: 700 }}>NA</Text>
              </div>
            </Tooltip>
          );
          const status = sess[rec.id];
          const cfg = STATUS_CFG[status] || STATUS_CFG.none;
          return (
            <Tooltip title={`${d.format("MMM DD")} - ${cfg.label}`} mouseEnterDelay={0.2}>
              <div style={{
                width: 20, height: 20, borderRadius: 5,
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                color: cfg.color, cursor: "default",
              }}>
                {cfg.icon}
              </div>
            </Tooltip>
          );
        },
      };
    }),
    {
      title: <Text style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rate</Text>,
      key: "rate",
      width: rateColWidth,
      fixed: "right",
      align: "center",
      sorter: (a, b) => a.rate - b.rate,
      defaultSortOrder: "descend",
      render: (_, rec) => {
        const color = rec.rate >= 80 ? "#059669" : rec.rate >= 60 ? "#d97706" : "#e11d48";
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <Text style={{ fontSize: 15, fontWeight: 800, color, lineHeight: 1 }}>{rec.rate}%</Text>
            <Progress percent={rec.rate} size="small" showInfo={false} strokeColor={color} trailColor={dark ? "#374151" : "#f1f5f9"} style={{ width: 58, margin: 0 }} />
          </div>
        );
      },
    },
    {
      title: <Text style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>P | A | L | LV</Text>,
      key: "pal",
      width: palColWidth,
      fixed: "right",
      align: "center",
      render: (_, rec) => (
        <Space size={3}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{rec.present}</Text>
          <Text style={{ color: "#e2e8f0", fontSize: 10 }}>|</Text>
          <Text style={{ fontSize: 12, fontWeight: 700, color: "#e11d48" }}>{rec.absent}</Text>
          <Text style={{ color: "#e2e8f0", fontSize: 10 }}>|</Text>
          <Text style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>{rec.late}</Text>
          <Text style={{ color: "#e2e8f0", fontSize: 10 }}>|</Text>
          <Text style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{rec.leave || 0}</Text>
        </Space>
      ),
    },
  ], [weekdays, sessionMap, today, userId, isMobile, memberColWidth, dayColWidth, rateColWidth, palColWidth]);

  // ---------------- Render ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  return (
    <div
      className={dark ? "standups-dark" : ""}
      style={{ minHeight: "100vh", background: dark ? "#141416" : "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'DM Sans', sans-serif !important; }
        .ant-table { background: transparent !important; }
        .ant-table-thead > tr > th {
          background: #f9fafb !important; color: #94a3b8 !important;
          font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase;
          letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9 !important;
          padding: 10px 14px !important; white-space: nowrap;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f9fafb !important;
          padding: 13px 14px !important;
        }
        .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .ant-table-tbody > tr:hover > td { background: #f8fafc !important; }
        /* Heatmap table overrides -------- tighter padding */
        .heatmap-table .ant-table-thead > tr > th { padding: 10px 5px !important; }
        .heatmap-table .ant-table-tbody > tr > td  { padding: 9px 5px !important; }
        .ant-table-cell-fix-left  { background: #fff !important; }
        .ant-table-cell-fix-right { background: #fff !important; }
        .ant-table-tbody > tr:hover .ant-table-cell-fix-left,
        .ant-table-tbody > tr:hover .ant-table-cell-fix-right { background: #f8fafc !important; }
        .row-me > td { background: #fafaff !important; }
        .row-me:hover > td { background: #f3f4ff !important; }
        .row-me .ant-table-cell-fix-left,
        .row-me .ant-table-cell-fix-right { background: #fafaff !important; }
        .ant-picker { border-radius: 8px !important; border-color: #e2e8f0 !important; }
        .ant-table-body { overflow-x: auto !important; }
        .ant-table-sticky-scroll { display: none !important; }

        .standups-dark { color: #e5e7eb !important; }
        .standups-dark .standups-header {
          border-bottom-color: #2a2b31 !important;
        }
        .standups-dark .standups-card {
          background: #1a1b1f !important;
          border-color: #2a2b31 !important;
          box-shadow: none !important;
        }
        .standups-dark .standups-highlight {
          background: #1a1b1f !important;
          border-color: #3b4267 !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18) !important;
        }
        .standups-dark .ant-empty-description {
          color: #d1d5db !important;
        }
        .standups-dark .ant-picker {
          background: #17181c !important;
          border-color: #2a2b31 !important;
        }
        .standups-dark .ant-picker input,
        .standups-dark .ant-picker .ant-picker-suffix {
          color: #d1d5db !important;
        }
        .standups-dark .ant-table-thead > tr > th {
          background: #202127 !important;
          color: #9ca3af !important;
          border-bottom: none !important;
          border-inline-end: none !important;
        }
        .standups-dark .ant-table-thead > tr > th::before {
          display: none !important;
        }
        .standups-dark .ant-table-tbody > tr > td {
          color: #e5e7eb !important;
          border-bottom: none !important;
          border-inline-end: none !important;
          background: #1a1b1f !important;
        }
        .standups-dark .ant-table-tbody > tr:hover > td,
        .standups-dark .ant-table-tbody > tr:hover .ant-table-cell-fix-left,
        .standups-dark .ant-table-tbody > tr:hover .ant-table-cell-fix-right {
          background: #202127 !important;
        }
        .standups-dark .ant-table-cell-fix-left,
        .standups-dark .ant-table-cell-fix-right {
          background: #1a1b1f !important;
        }
        .standups-dark .row-me > td,
        .standups-dark .row-me .ant-table-cell-fix-left,
        .standups-dark .row-me .ant-table-cell-fix-right {
          background: #1f2230 !important;
        }
        .standups-dark .row-me:hover > td {
          background: #242838 !important;
        }
        @media (max-width: 768px) {
          .standups-header-row {
            flex-direction: column;
            align-items: stretch !important;
          }
          .standups-header-left {
            width: 100%;
          }
          .standups-month-picker {
            width: 100% !important;
          }
          .standups-summary-card {
            flex: 1 1 100% !important;
            min-width: 100% !important;
          }
          .standups-breakdown-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ---------------- Header ---------------- */}
      <div className="standups-header" style={{  borderBottom: dark ? "none" : "1px solid #f1f5f9", padding: isMobile ? "0 14px" : "0 40px" }}>
        <div style={{ margin: "0 auto" }}>
          <div className="standups-header-row" style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", padding: isMobile ? "16px 0" : "20px 0", flexWrap: "wrap", gap: isMobile ? 12 : 16 }}>
            <div className="standups-header-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {activeProject && (
                <button
                  onClick={closeStats}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: dark ? "#ffffff" : "transparent",
                    border: dark ? "1px solid #ffffff" : "1px solid #e2e8f0",
                    borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                    color: dark ? "#0f172a" : "#64748b", fontSize: 13, fontWeight: 600,
                  }}
                >
                  <ArrowLeftOutlined style={{ fontSize: 11 }} /> Back
                </button>
              )}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: dark ? "#93c5fd" : "#0f172a" }} />
                  <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {activeProject ? `${activeProject.name} - Stats` : "My Standups"}
                  </Text>
                </div>
                <Title level={4} style={{ margin: 0, color: dark ? "#f3f4f6" : "#0f172a", fontWeight: 800, letterSpacing: -0.5 }}>
                  {activeProject
                    ? `Attendance - ${selectedMonth.format("MMMM YYYY")}`
                    : "Standup Attendance"
                  }
                </Title>
              </div>
            </div>

            <DatePicker
              className="standups-month-picker"
              picker="month"
              value={selectedMonth}
              onChange={(d) => {
                if (d) {
                  setMonth(d);
                  // re-fetch stats if we're in a project view
                  if (activeProject) openStats(activeProject);
                }
              }}
              disabledDate={(d) => d && d > dayjs().endOf("month")}
              format="MMMM YYYY"
              style={{ width: isMobile ? "100%" : 160 }}
              allowClear={false}
              suffixIcon={<CalendarOutlined style={{ color: "#94a3b8" }} />}
            />
          </div>
        </div>
      </div>

      {/* ---------------- Body ---------------- */}
      <div style={{ margin: "0 auto", padding: isMobile ? "20px 14px" : "28px 40px" }}>

        {/* Auth loading */}
        {!userId && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Spin size="large" />
            <Text style={{ display: "block", marginTop: 16, color: "#94a3b8" }}>Loading session...</Text>
          </div>
        )}

        {/* -------------- PROJECTS TABLE VIEW -------------- */}
        {userId && !activeProject && (
          <>
            {/* Quick summary chips */}
            {!loadingProjects && projects.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Assigned Projects", value: projects.length, color: dark ? "#f3f4f6" : "#0f172a", bg: dark ? "rgba(148,163,184,0.14)" : "#f8fafc", border: dark ? "rgba(148,163,184,0.3)" : "#e2e8f0" },
                  {
                    label: "Avg My Rate",
                    value: (() => {
                      const rates = projects
                        .map((p) => {
                          const c = projectSessionCounts[p.id];
                          if (!c) return null;
                          const marked = c.present + c.absent + c.late + (c.leave || 0);
                          return marked > 0 ? Math.round(((c.present + c.late + (c.leave || 0)) / marked) * 100) : null;
                        })
                        .filter((r) => r !== null);
                      return rates.length ? `${Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)}%` : "N/A";
                    })(),
                    color: dark ? "#4ade80" : "#059669", bg: dark ? "rgba(34,197,94,0.16)" : "#ecfdf5", border: dark ? "rgba(74,222,128,0.35)" : "#a7f3d0",
                  },
                  {
                    label: "Standups This Month",
                    value: Object.values(projectSessionCounts).reduce((a, c) => a + (c.sessions || 0), 0),
                    color: dark ? "#93c5fd" : "#6366f1", bg: dark ? "rgba(37,99,235,0.16)" : "#eef2ff", border: dark ? "rgba(147,197,253,0.35)" : "#c7d2fe",
                  },
                ].map(({ label, value, color, bg, border }) => (
                  <div
                    className="standups-summary-card"
                    key={label}
                    style={{
                      flex: isMobile ? "1 1 100%" : "1 1 220px",
                      minWidth: isMobile ? "100%" : 220,
                      padding: "10px 18px",
                      borderRadius: 10,
                      border: dark ? "none" : `1px solid ${border}`,
                      background: dark ? "rgba(32,33,39,0.95)" : bg,
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: dark ? "#cbd5e1" : "#94a3b8" }}>{label}</Text>
                  </div>
                ))}
              </div>
            )}

            <div className="standups-card" style={{ background: "#fff", borderRadius: 14, border: dark ? "none" : "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
              <div style={{ padding: "16px 20px", borderBottom: dark ? "none" : "1px solid #f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <Space>
                  <TeamOutlined style={{ color: "#94a3b8" }} />
                  <Text strong style={{ fontSize: 14, color: dark ? "#f3f4f6" : "#0f172a" }}>My Projects</Text>
                  <span style={{ fontSize: 12, fontWeight: 700, color: dark ? "#cbd5e1" : "#64748b", background: dark ? "#232630" : "#f1f5f9", borderRadius: 20, padding: "1px 10px" }}>
                    {projects.length}
                  </span>
                </Space>
                <Text style={{ fontSize: 12, color: "#94a3b8" }}>{selectedMonth.format("MMMM YYYY")}</Text>
              </div>

              {loadingProjects ? (
                <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
              ) : projects.length === 0 ? (
                <Empty description={<Text type="secondary">You are not assigned to any active projects</Text>} style={{ padding: 64 }} />
              ) : (
                <Table
                  dataSource={projects}
                  columns={projectColumns}
                  rowKey="id"
                  pagination={false}
                  scroll={isMobile ? { x: 760 } : undefined}
                  style={{ borderRadius: 0 }}
                />
              )}
            </div>
          </>
        )}

        {/* -------------- STATS VIEW -------------- */}
        {userId && activeProject && (
          <>
            {loadingData ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}><Spin size="large" /></div>
            ) : (
              <>
                {/* My personal summary strip */}
                {myStats && (
                  <div className="standups-highlight" style={{
                    background: "#fff", borderRadius: 12,
                    border: "1.5px solid #c7d2fe",
                    padding: "16px 20px", marginBottom: 20,
                    display: "flex", alignItems: "center", flexWrap: "wrap", gap: 20,
                    boxShadow: "0 0 0 3px #eef2ff",
                  }}>
                    <Space size={10}>
                      <Avatar
                        size={40} src={myStats.user_photo}
                        style={{ background: "#6366f1", fontSize: 14, fontWeight: 700, outline: "2px solid #6366f1", outlineOffset: 2 }}
                      >
                        {!myStats.user_photo && getInitials(myStats.full_name)}
                      </Avatar>
                      <div>
                        <Text strong style={{ fontSize: 14, color: dark ? "#f3f4f6" : "#0f172a", display: "block", lineHeight: 1.2 }}>{myStats.full_name}</Text>
                        <Text style={{ fontSize: 12, color: "#94a3b8" }}>Your attendance - {selectedMonth.format("MMM YYYY")}</Text>
                      </div>
                    </Space>

                    <div style={{ height: 32, width: 1, background: dark ? "#374151" : "#e2e8f0" }} />

                    <div>
                      <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 2 }}>Rate</Text>
                      <Text style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: myStats.rate >= 80 ? "#059669" : myStats.rate >= 60 ? "#d97706" : "#e11d48" }}>
                        {myStats.rate}%
                      </Text>
                    </div>

                    {[
                      {
                        label: "Present",
                        value: myStats.present,
                        color: dark ? "#4ade80" : "#059669",
                        bg: dark ? "rgba(34,197,94,0.16)" : "#ecfdf5",
                        border: dark ? "rgba(74,222,128,0.35)" : "#a7f3d0",
                      },
                      {
                        label: "Absent",
                        value: myStats.absent,
                        color: dark ? "#fb7185" : "#e11d48",
                        bg: dark ? "rgba(225,29,72,0.16)" : "#fff1f2",
                        border: dark ? "rgba(251,113,133,0.35)" : "#fecdd3",
                      },
                      {
                        label: "Late",
                        value: myStats.late,
                        color: dark ? "#fbbf24" : "#d97706",
                        bg: dark ? "rgba(217,119,6,0.16)" : "#fffbeb",
                        border: dark ? "rgba(251,191,36,0.35)" : "#fde68a",
                      },
                      {
                        label: "Leave",
                        value: myStats.leave || 0,
                        color: dark ? "#93c5fd" : "#2563eb",
                        bg: dark ? "rgba(37,99,235,0.16)" : "#eff6ff",
                        border: dark ? "rgba(147,197,253,0.35)" : "#bfdbfe",
                      },
                    ].map(({ label, value, color, bg, border }) => (
                      <div key={label} style={{ textAlign: "center", padding: "8px 16px", borderRadius: 10, background: bg, border: `1px solid ${border}` }}>
                        <Text style={{ fontSize: 20, fontWeight: 800, color, display: "block", lineHeight: 1 }}>{value}</Text>
                        <Text style={{ fontSize: 11, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</Text>
                      </div>
                    ))}

                    <div style={{ marginLeft: isMobile ? 0 : "auto", width: isMobile ? "100%" : "auto" }}>
                      <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 2 }}>Rank</Text>
                      <Space>
                        {sortedStats.findIndex((e) => e.id === userId) === 0 && <TrophyOutlined style={{ color: "#d97706" }} />}
                        <Text style={{ fontSize: 20, fontWeight: 800, color: dark ? "#f3f4f6" : "#0f172a" }}>#{sortedStats.findIndex((e) => e.id === userId) + 1}</Text>
                        <Text style={{ fontSize: 12, color: "#94a3b8" }}>of {employees.length}</Text>
                      </Space>
                    </div>
                  </div>
                )}

                {/* Summary cards */}
                <div style={{ display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
                  {[
                    { icon: <CalendarOutlined />, label: "Standups Held", value: overall.totalSessions, sub: `of ${overall.pastWeekdays} weekdays`, color: dark ? "#f3f4f6" : "#0f172a", bg: dark ? "#202127" : "#f8fafc", border: dark ? "#2a2b31" : "#e2e8f0" },
                    { icon: <CheckOutlined />,    label: "Team Present",  value: overall.p, sub: overall.p + overall.a + overall.l + overall.lv > 0 ? `${Math.round((overall.p / (overall.p + overall.a + overall.l + overall.lv)) * 100)}% of marked` : "No data", color: dark ? "#4ade80" : "#059669", bg: dark ? "rgba(34,197,94,0.16)" : "#ecfdf5", border: dark ? "rgba(74,222,128,0.35)" : "#a7f3d0" },
                    { icon: <CloseOutlined />,    label: "Team Absent",   value: overall.a, sub: overall.p + overall.a + overall.l + overall.lv > 0 ? `${Math.round((overall.a / (overall.p + overall.a + overall.l + overall.lv)) * 100)}% of marked` : "No data", color: dark ? "#fb7185" : "#e11d48", bg: dark ? "rgba(225,29,72,0.16)" : "#fff1f2", border: dark ? "rgba(251,113,133,0.35)" : "#fecdd3" },
                    { icon: <ClockCircleOutlined />, label: "Joined Late", value: overall.l, sub: overall.p + overall.a + overall.l + overall.lv > 0 ? `${Math.round((overall.l / (overall.p + overall.a + overall.l + overall.lv)) * 100)}% of marked` : "No data", color: dark ? "#fbbf24" : "#d97706", bg: dark ? "rgba(217,119,6,0.16)" : "#fffbeb", border: dark ? "rgba(251,191,36,0.35)" : "#fde68a" },
                                        { icon: <CalendarOutlined />, label: "On Leave", value: overall.lv, sub: overall.p + overall.a + overall.l + overall.lv > 0 ? `${Math.round((overall.lv / (overall.p + overall.a + overall.l + overall.lv)) * 100)}% of marked` : "No data", color: dark ? "#93c5fd" : "#2563eb", bg: dark ? "rgba(37,99,235,0.16)" : "#eff6ff", border: dark ? "rgba(147,197,253,0.35)" : "#bfdbfe" },
                  ].map(({ icon, label, value, sub, color, bg, border }) => (
                    <div key={label} style={{ flex: isMobile ? "1 1 calc(50% - 12px)" : "1 1 140px", minWidth: isMobile ? 145 : 130, padding: "14px 16px", borderRadius: 12, border: `1px solid ${border}`, background: bg }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                        <span style={{ color, fontSize: 12 }}>{icon}</span>
                        <Text style={{ fontSize: 10, fontWeight: 700, color: dark ? "#9ca3af" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</Text>
                      </div>
                      <Text style={{ fontSize: 22, fontWeight: 800, color, display: "block", lineHeight: 1, marginBottom: 3 }}>{value}</Text>
                      <Text style={{ fontSize: 11, color: dark ? "#9ca3af" : "#94a3b8" }}>{sub}</Text>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {activeProject.name} - {selectedMonth.format("MMMM YYYY")}
                  </Text>
                  <div style={{ height: 12, width: 1, background: dark ? "#374151" : "#e2e8f0" }} />
                  {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 13, height: 13, borderRadius: 3, background: cfg.bg, border: `1px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color }}>
                        {cfg.icon}
                      </div>
                      <Text style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{cfg.label}</Text>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 13, height: 13, borderRadius: 3, background: dark ? "#2a2f3a" : "#f1f5f9", border: `1px solid ${dark ? "#3a4456" : "#e2e8f0"}` }} />
                    <Text style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Future</Text>
                  </div>
                </div>

                {/* Heatmap */}
                {employees.length === 0 ? (
                  <Empty description="No team members found" style={{ padding: 64, background: dark ? "#1a1b1f" : "#fff", borderRadius: 14, border: dark ? "1px solid #2a2b31" : "1px solid #f1f5f9" }} />
                ) : (
                  <div className="standups-card" style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
                    {/* Week strip */}
                    <div style={{ padding: "10px 20px 0", borderBottom: `1px solid ${dark ? "#2a2b31" : "#f8fafc"}`, display: "flex", alignItems: "center" }}>
                      <div style={{ width: memberColWidth, flexShrink: 0 }} />
                      <div style={{ display: "flex", flex: 1, overflowX: "auto", paddingBottom: 6 }}>
                        {weeks.map((week, wi) => (
                          <div key={wi} style={{ minWidth: week.length * dayColWidth, textAlign: "center", padding: "0 2px", borderLeft: wi > 0 ? `1px solid ${dark ? "#2a2b31" : "#f1f5f9"}` : "none" }}>
                            <Text style={{ fontSize: 10, fontWeight: 700, color: dark ? "#64748b" : "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              W{dayjs(week[0]).isoWeek()}
                            </Text>
                          </div>
                        ))}
                      </div>
                      <div style={{ width: rateColWidth + palColWidth, flexShrink: 0 }} />
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
                      rowClassName={(rec) => rec.isMe ? "row-me" : ""}
                    />
                  </div>
                )}

                {/* Breakdown cards */}
                {sortedStats.length > 0 && (
                  <div style={{ marginTop: 28 }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 14 }}>
                      Team Breakdown
                    </Text>
                    <div className="standups-breakdown-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(255px, 1fr))", gap: 12 }}>
                      {sortedStats.map((emp, i) => {
                        const rateColor  = emp.rate >= 80 ? "#059669" : emp.rate >= 60 ? "#d97706" : "#e11d48";
                        const rateBg     = emp.rate >= 80
                          ? dark ? "rgba(34,197,94,0.16)" : "#ecfdf5"
                          : emp.rate >= 60
                            ? dark ? "rgba(217,119,6,0.16)" : "#fffbeb"
                            : dark ? "rgba(225,29,72,0.16)" : "#fff1f2";
                        const rateBorder = emp.rate >= 80
                          ? dark ? "rgba(74,222,128,0.35)" : "#a7f3d0"
                          : emp.rate >= 60
                            ? dark ? "rgba(251,191,36,0.35)" : "#fde68a"
                            : dark ? "rgba(251,113,133,0.35)" : "#fecdd3";
                        return (
                          <div key={emp.id} className="standups-card" style={{
                            background: dark ? "#1a1b1f" : "#fff", borderRadius: 12,
                            border: emp.isMe ? `1.5px solid ${dark ? "#4f5d86" : "#c7d2fe"}` : `1px solid ${dark ? "#2a2b31" : "#f1f5f9"}`,
                            padding: "16px 18px",
                            boxShadow: emp.isMe ? (dark ? "0 0 0 2px rgba(99,102,241,0.16)" : "0 0 0 3px #eef2ff") : (dark ? "none" : "0 1px 3px rgba(15,23,42,0.04)"),
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                              <Space size={10}>
                                <Avatar size={36} src={emp.user_photo}
                                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], fontSize: 12, fontWeight: 700, flexShrink: 0, outline: emp.isMe ? "2px solid #6366f1" : "none", outlineOffset: 2 }}
                                >
                                  {!emp.user_photo && getInitials(emp.full_name)}
                                </Avatar>
                                <div>
                                  <Space size={4}>
                                    <Text strong style={{ fontSize: 13, color: dark ? "#f3f4f6" : "#0f172a", lineHeight: 1.2 }}>{emp.full_name}</Text>
                                    {emp.isMe && <span style={{ fontSize: 10, fontWeight: 700, color: dark ? "#c7d2fe" : "#6366f1", background: dark ? "rgba(99,102,241,0.2)" : "#eef2ff", border: `1px solid ${dark ? "rgba(129,140,248,0.45)" : "#c7d2fe"}`, borderRadius: 20, padding: "1px 7px" }}>You</span>}
                                  </Space>
                                  <Text style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>{emp.job_title || emp.department || "N/A"}</Text>
                                </div>
                              </Space>
                              <div style={{ padding: "3px 10px", borderRadius: 20, border: `1px solid ${rateBorder}`, background: rateBg, flexShrink: 0 }}>
                                <Text style={{ fontSize: 14, fontWeight: 800, color: rateColor }}>{emp.rate}%</Text>
                              </div>
                            </div>

                            <Progress percent={emp.rate} showInfo={false} strokeColor={rateColor} trailColor={dark ? "#374151" : "#f1f5f9"} size="small" style={{ marginBottom: 12 }} />

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                              {[
                                { label: "Present", value: emp.present, color: dark ? "#4ade80" : "#059669", bg: dark ? "rgba(34,197,94,0.16)" : "#ecfdf5" },
                                { label: "Absent",  value: emp.absent,  color: dark ? "#fb7185" : "#e11d48", bg: dark ? "rgba(225,29,72,0.16)" : "#fff1f2" },
                                { label: "Late",    value: emp.late,    color: dark ? "#fbbf24" : "#d97706", bg: dark ? "rgba(217,119,6,0.16)" : "#fffbeb" },
                                { label: "Leave",   value: emp.leave || 0, color: dark ? "#93c5fd" : "#2563eb", bg: dark ? "rgba(37,99,235,0.16)" : "#eff6ff" },
                              ].map(({ label, value, color, bg }) => (
                                <div key={label} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, background: bg }}>
                                  <Text style={{ fontSize: 18, fontWeight: 800, color, display: "block", lineHeight: 1 }}>{value}</Text>
                                  <Text style={{ fontSize: 10, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</Text>
                                </div>
                              ))}
                            </div>
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
    </div>
  );
}









