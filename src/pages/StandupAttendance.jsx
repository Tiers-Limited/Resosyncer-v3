import { useState, useEffect } from "react";
import {
  Table, Button, DatePicker, Modal, Tag, Avatar, Space,
  Typography, Tooltip, Radio, Empty, Row, Col, message,
  Input, Spin, Divider, Badge, Progress,
} from "antd";
import {
  CheckOutlined, CloseOutlined, ClockCircleOutlined,
  SaveOutlined, FileTextOutlined, EditOutlined,
  CheckCircleFilled, TeamOutlined, ArrowLeftOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ── Constants ──────────────────────────────────────────────────────────────
const ATTENDANCE_STATUS = {
  present: { label: "Present", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: <CheckOutlined /> },
  absent:  { label: "Absent",  color: "#e11d48", bg: "#fff1f2", border: "#fecdd3", icon: <CloseOutlined /> },
  late:    { label: "Late",    color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: <ClockCircleOutlined /> },
};

const PROJECT_STATUS_TAG = {
  active:       { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", dot: "#059669" },
  "in progress":{ color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", dot: "#2563eb" },
  planning:     { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", dot: "#7c3aed" },
  review:       { color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "#d97706" },
};

const EXCLUDED_STATUSES = ["completed", "on hold"];
const AVATAR_COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6"];

const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const capitalize = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

// ── Main Component ─────────────────────────────────────────────────────────
export default function StandupAttendance() {
  const [currentUser, setCurrentUser]         = useState(null);
  const [selectedDate, setSelectedDate]       = useState(dayjs());

  // Projects list view
  const [projects, setProjects]               = useState([]);
  const [projectSessions, setProjectSessions] = useState({}); // { project_id: session }
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Mark attendance view
  const [activeProject, setActiveProject]     = useState(null); // project object
  const [employees, setEmployees]             = useState([]);
  const [attendance, setAttendance]           = useState({});
  const [summary, setSummary]                 = useState("");
  const [existingSessionId, setExistingSessionId] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingSession, setLoadingSession]   = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [summaryOpen, setSummaryOpen]         = useState(false);

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data?.user ?? null));
  }, []);

  // Load PM's active projects
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status, client_name, country_flag, priority, start_date, end_date")
        .eq("project_manager_id", currentUser.id)
        .eq("is_archived", false)
        .neq("status","on_hold")
        .neq("status","completed")
        .neq("status","planning")
        .order("position");
      if (error) { message.error("Failed to load projects"); }
      else {
        const filtered = (data ?? []).filter(
          (p) => !EXCLUDED_STATUSES.includes((p.status ?? "").toLowerCase())
        );
        setProjects(filtered);
      }
      setLoadingProjects(false);
    };
    load();
  }, [currentUser]);

  // Load today's sessions for all projects (to show status in table)
  useEffect(() => {
    if (!projects.length || !selectedDate) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("standup_sessions")
        .select("id, project_id, attendance, summary, date")
        .in("project_id", projects.map((p) => p.id))
        .eq("date", selectedDate.format("YYYY-MM-DD"));
      if (!error && data) {
        const map = {};
        data.forEach((s) => { map[s.project_id] = s; });
        setProjectSessions(map);
      }
    };
    load();
  }, [projects, selectedDate, saving]);

  // Open Mark view for a project
  const openMarkView = async (project) => {
    setActiveProject(project);
    setLoadingEmployees(true);
    setLoadingSession(true);

    // Load employees
    const { data: assignees } = await supabase
      .from("project_assignees")
      .select("employee_id")
      .eq("project_id", project.id);

    const ids = (assignees ?? []).map((a) => a.employee_id);
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, job_title, department, user_photo, email")
        .in("id", ids)
        .eq("suspended", false);
      setEmployees(profiles ?? []);
    } else {
      setEmployees([]);
    }
    setLoadingEmployees(false);

    // Load existing session
    const existing = projectSessions[project.id];
    if (existing) {
      setAttendance(existing.attendance ?? {});
      setSummary(existing.summary ?? "");
      setExistingSessionId(existing.id);
    } else {
      setAttendance({});
      setSummary("");
      setExistingSessionId(null);
    }
    setLoadingSession(false);
  };

  const closeMarkView = () => {
    setActiveProject(null);
    setEmployees([]);
    setAttendance({});
    setSummary("");
    setExistingSessionId(null);
  };

  // Save / update session
  const handleSave = async () => {
    const unmarked = employees.filter((e) => !attendance[e.id]);
    if (unmarked.length)
      return message.warning(`Mark attendance for all ${unmarked.length} remaining member(s).`);

    setSaving(true);
    const payload = {
      project_id: activeProject.id,
      date: selectedDate.format("YYYY-MM-DD"),
      attendance,
      summary,
      created_by: currentUser?.id,
    };
    let error;
    if (existingSessionId) {
      ({ error } = await supabase.from("standup_sessions").update(payload).eq("id", existingSessionId));
    } else {
      const { data, error: ie } = await supabase.from("standup_sessions").insert(payload).select().single();
      error = ie;
      if (data) setExistingSessionId(data.id);
    }
    if (error) message.error("Save failed: " + error.message);
    else { message.success("Session saved!"); }
    setSaving(false);
  };

  // Derived stats for mark view
  const stats = {
    present:  employees.filter((e) => attendance[e.id] === "present").length,
    absent:   employees.filter((e) => attendance[e.id] === "absent").length,
    late:     employees.filter((e) => attendance[e.id] === "late").length,
    unmarked: employees.filter((e) => !attendance[e.id]).length,
  };
  const markedCount = employees.length - stats.unmarked;
  const progress = employees.length ? Math.round((markedCount / employees.length) * 100) : 0;

  // ── Projects table columns ─────────────────────────────────────────────
  const projectColumns = [
    {
      title: "Project",
      key: "project",
      render: (_, rec) => (
        <Space size={10}>
          <div>
            <Text strong style={{ fontSize: 14, color: "#0f172a", display: "block", lineHeight: 1.3 }}>
              {rec.name}
            </Text>
            <Text style={{ fontSize: 12, color: "#94a3b8" }}>{rec.client_name || "—"}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const key = (status || "").toLowerCase();
        const cfg = PROJECT_STATUS_TAG[key] || { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", dot: "#64748b" };
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "3px 10px", borderRadius: 20,
            border: `1px solid ${cfg.border}`, background: cfg.bg,
            fontSize: 12, fontWeight: 600, color: cfg.color,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
            {capitalize(status)}
          </span>
        );
      },
    },
    {
      title: `Standup (${selectedDate.format("MMM DD")})`,
      key: "standup",
      width: 180,
      render: (_, rec) => {
        const session = projectSessions[rec.id];
        if (!session) {
          return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#e2e8f0", display: "inline-block" }} />
              Not marked
            </span>
          );
        }
        const att = session.attendance ?? {};
        const p = Object.values(att).filter((v) => v === "present").length;
        const a = Object.values(att).filter((v) => v === "absent").length;
        const l = Object.values(att).filter((v) => v === "late").length;
        return (
          <Space size={6}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{p}P</span>
            <span style={{ color: "#e2e8f0", fontSize: 10 }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#e11d48" }}>{a}A</span>
            <span style={{ color: "#e2e8f0", fontSize: 10 }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>{l}L</span>
            {session.summary && (
              <Tooltip title="Has summary">
                <FileTextOutlined style={{ color: "#d97706", fontSize: 12 }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 130,
      render: (_, rec) => {
        const session = projectSessions[rec.id];
        const marked = !!session;
        return (
          <Button
            onClick={() => openMarkView(rec)}
            icon={marked ? <EditOutlined /> : <CheckCircleFilled />}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              height: 34,
              paddingInline: 16,
              border: marked ? "1.5px solid #e2e8f0" : "none",
              background: marked ? "#fff" : "#0f172a",
              color: marked ? "#475569" : "#fff",
              boxShadow: marked ? "none" : "0 2px 8px rgba(15,23,42,0.18)",
              transition: "all 0.15s",
            }}
          >
            {marked ? "Edit" : "Mark"}
          </Button>
        );
      },
    },
  ];

  // ── Attendance table columns ───────────────────────────────────────────
  const attendanceColumns = [
    {
      title: "Member",
      key: "member",
      render: (_, rec, i) => (
        <Space size={10}>
          <Avatar
            size={34}
            src={rec.user_photo}
            style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length], fontWeight: 700, fontSize: 12, flexShrink: 0 }}
          >
            {!rec.user_photo && getInitials(rec.full_name)}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 13, color: "#0f172a", display: "block", lineHeight: 1.3 }}>{rec.full_name}</Text>
            <Text style={{ fontSize: 12, color: "#94a3b8" }}>{rec.job_title || rec.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: (
        <Space size={6}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>Attendance</span>
          <span style={{ color: "#e2e8f0" }}>·</span>
          {Object.entries(ATTENDANCE_STATUS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => {
                const all = {};
                employees.forEach((e) => (all[e.id] = key));
                setAttendance(all);
              }}
              style={{
                padding: "2px 10px", borderRadius: 20, cursor: "pointer",
                border: `1px solid ${cfg.border}`, background: cfg.bg,
                color: cfg.color, fontSize: 11, fontWeight: 600,
                transition: "opacity 0.15s",
              }}
            >
              All {cfg.label}
            </button>
          ))}
        </Space>
      ),
      key: "status",
      render: (_, rec) => (
        <Radio.Group
          value={attendance[rec.id] ?? null}
          onChange={(e) => setAttendance((prev) => ({ ...prev, [rec.id]: e.target.value }))}
          style={{ display: "flex", gap: 6 }}
        >
          {Object.entries(ATTENDANCE_STATUS).map(([key, cfg]) => {
            const active = attendance[rec.id] === key;
            return (
              <Radio.Button
                key={key}
                value={key}
                style={{
                  borderRadius: 8, height: 32, lineHeight: "30px",
                  paddingInline: 14, fontSize: 12, fontWeight: 600,
                  border: active ? `1.5px solid ${cfg.color}` : "1.5px solid #e2e8f0",
                  background: active ? cfg.bg : "#fafafa",
                  color: active ? cfg.color : "#94a3b8",
                  boxShadow: "none", transition: "all 0.15s",
                }}
              >
                <Space size={4}>{cfg.icon}{cfg.label}</Space>
              </Radio.Button>
            );
          })}
        </Radio.Group>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Outfit', sans-serif !important; }
        .ant-radio-button-wrapper::before { display: none !important; }
        .ant-table { background: transparent !important; }
        .ant-table-thead > tr > th {
          background: #f8fafc !important; color: #94a3b8 !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase; letter-spacing: 0.06em;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 10px 16px !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f8fafc !important;
          padding: 12px 16px !important;
        }
        .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .ant-table-tbody > tr:hover > td { background: #f8fafc !important; }
        .ant-table-wrapper .ant-table { border-radius: 0 !important; }
        .ant-select-selector { border-radius: 8px !important; border-color: #e2e8f0 !important; background: #fff !important; }
        .ant-picker { border-radius: 8px !important; border-color: #e2e8f0 !important; background: #fff !important; }
        .project-row:hover { background: #f8fafc !important; }
        .mark-btn:hover { opacity: 0.85 !important; }
        .back-btn:hover { background: #f1f5f9 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{padding: "0 40px" }}>
        <div style={{margin: "0 auto" }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 16px", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {activeProject && (
                <button
                  className="back-btn"
                  onClick={closeMarkView}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#64748b", fontSize: 13, fontWeight: 600, transition: "background 0.15s" }}
                >
                  <ArrowLeftOutlined style={{ fontSize: 12 }} /> Back
                </button>
              )}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0f172a" }} />
                  <Text style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {activeProject ? `${activeProject.name} · Standup` : "Standup Attendance"}
                  </Text>
                </div>
                <Title level={4} style={{ margin: 0, color: "#0f172a", fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2, marginTop: 2 }}>
                  {activeProject
                    ? `Mark Attendance · ${selectedDate.format("MMM DD, YYYY")}`
                    : `${selectedDate.format("dddd, MMMM DD YYYY")}`
                  }
                </Title>
              </div>
            </div>

            <Space wrap>
              <DatePicker
                value={selectedDate}
                onChange={(d) => { if (d) setSelectedDate(d); }}
                disabledDate={(d) => d && d > dayjs().endOf("day")}
                format="MMM DD, YYYY"
                style={{ width: 155 }}
                allowClear={false}
                suffixIcon={<CalendarOutlined style={{ color: "#94a3b8" }} />}
              />
              {activeProject && (
                <>
                  <Button
                    icon={<FileTextOutlined />}
                    onClick={() => setSummaryOpen(true)}
                    style={{
                      borderRadius: 8, height: 36,
                      border: summary ? "1.5px solid #6366f1" : "1.5px solid #e2e8f0",
                      color: summary ? "#6366f1" : "#64748b",
                      fontWeight: 600, background: "#fff",
                    }}
                  >
                    {summary ? "Edit Summary" : "Add Summary"}
                  </Button>
                  <Button
                    type="primary" icon={<SaveOutlined />}
                    loading={saving} onClick={handleSave}
                    style={{ borderRadius: 8, height: 36, background: "#0f172a", border: "none", fontWeight: 700, boxShadow: "0 2px 8px rgba(15,23,42,0.2)" }}
                  >
                    {existingSessionId ? "Update" : "Save Session"}
                  </Button>
                </>
              )}
            </Space>
          </div>

          {/* Sub stats bar — only in mark view */}
          {activeProject && (
            <div style={{ display: "flex", gap: 0, borderTop: "1px solid #f1f5f9", paddingBottom: 0 }}>
              {[
                { key: "present",  label: "Present",  color: "#059669" },
                { key: "absent",   label: "Absent",   color: "#e11d48" },
                { key: "late",     label: "Late",     color: "#d97706" },
                { key: "unmarked", label: "Unmarked", color: "#94a3b8" },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ padding: "12px 24px 12px 0", display: "flex", alignItems: "baseline", gap: 6 }}>
                  <Text style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{stats[key]}</Text>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{label}</Text>
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0" }}>
                <Progress
                  percent={progress}
                  size="small"
                  style={{ width: 120, margin: 0 }}
                  strokeColor="#0f172a"
                  trailColor="#f1f5f9"
                  showInfo={false}
                />
                <Text style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{markedCount}/{employees.length} marked</Text>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{margin: "0 auto", padding: "28px 40px" }}>

        {/* ── Projects table view ── */}
        {!activeProject && (
          <>
            {/* Summary chips */}
            {!loadingProjects && projects.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Total Projects", value: projects.length, color: "#0f172a", bg: "#f8fafc", border: "#e2e8f0" },
                  { label: "Marked Today",   value: Object.keys(projectSessions).length, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
                  { label: "Pending",        value: projects.length - Object.keys(projectSessions).length, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                ].map(({ label, value, color, bg, border }) => (
                  <div key={label} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${border}`, background: bg, display: "flex", alignItems: "baseline", gap: 8 }}>
                    <Text style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{label}</Text>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space>
                  <TeamOutlined style={{ color: "#94a3b8" }} />
                  <Text strong style={{ fontSize: 14, color: "#0f172a" }}>Active Projects</Text>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", background: "#f1f5f9", borderRadius: 20, padding: "1px 10px" }}>
                    {projects.length}
                  </span>
                </Space>
                <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                  Excluding Completed &amp; On Hold
                </Text>
              </div>

              {loadingProjects ? (
                <div style={{ textAlign: "center", padding: 64 }}><Spin size="large" /></div>
              ) : projects.length === 0 ? (
                <Empty description={<Text type="secondary">No active projects found for today</Text>} style={{ padding: 64 }} />
              ) : (
                <Table
                  dataSource={projects}
                  columns={projectColumns}
                  rowKey="id"
                  pagination={false}
                  rowClassName="project-row"
                  style={{ borderRadius: 0 }}
                  onRow={(rec) => ({ style: { cursor: "default" } })}
                />
              )}
            </div>
          </>
        )}

        {/* ── Mark attendance view ── */}
        {activeProject && (
          <>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#059669" }} />
                  <Text strong style={{ fontSize: 14, color: "#0f172a" }}>{activeProject.name}</Text>
                  {existingSessionId && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 20, padding: "1px 10px" }}>
                      ✓ Saved
                    </span>
                  )}
                </Space>
                <Text style={{ fontSize: 12, color: "#94a3b8" }}>{employees.length} team members</Text>
              </div>

              {loadingEmployees || loadingSession ? (
                <div style={{ textAlign: "center", padding: 64 }}><Spin /></div>
              ) : employees.length === 0 ? (
                <Empty description="No team members assigned to this project" style={{ padding: 64 }} />
              ) : (
                <Table
                  dataSource={employees}
                  columns={attendanceColumns}
                  rowKey="id"
                  pagination={false}
                  style={{ borderRadius: 0 }}
                />
              )}

              {/* Summary preview strip */}
              {summary && (
                <div style={{ padding: "14px 20px", background: "#fffbeb", borderTop: "1px solid #fde68a", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <FileTextOutlined style={{ color: "#d97706", marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: "#92400e", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Summary
                    </Text>
                    <Text style={{ fontSize: 13, color: "#78350f", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{summary}</Text>
                  </div>
                  <Button type="text" icon={<EditOutlined />} size="small" onClick={() => setSummaryOpen(true)} style={{ color: "#d97706", flexShrink: 0 }} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Summary modal ── */}
      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: "#6366f1" }} />
            <Text strong style={{ fontSize: 15 }}>Standup Summary</Text>
          </Space>
        }
        open={summaryOpen}
        onCancel={() => setSummaryOpen(false)}
        onOk={() => setSummaryOpen(false)}
        okText="Done"
        okButtonProps={{ style: { background: "#0f172a", border: "none", borderRadius: 8, fontWeight: 700 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        width={560}
      >
        <Divider style={{ marginTop: 0 }} />
        <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 12, lineHeight: 1.7 }}>
          Capture blockers, decisions, and action items from today's standup.
        </Text>
        <TextArea
          rows={9}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={"• What did the team complete yesterday?\n• What is everyone working on today?\n• Any blockers or dependencies?\n• Key decisions made..."}
          style={{ borderRadius: 10, fontSize: 13, lineHeight: 1.8, resize: "none", border: "1.5px solid #e2e8f0" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{summary.length} chars</Text>
        </div>
      </Modal>
    </div>
  );
}