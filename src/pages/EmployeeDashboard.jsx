import { useState, useEffect, useRef } from "react";
import {
  Card,
  Statistic,
  Row,
  Col,
  Input,
  Button,
  Checkbox,
  Select,
  DatePicker,
  Empty,
  message,
  Modal,
} from "antd";
import {
  ClockCircleOutlined,
  DownloadOutlined,
  DesktopOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import BirthdayWidget from "../components/BirthdayWidget";

const TODO_TABLE = "todos";

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

const getNetSessionSeconds = (log, nowMs = Date.now()) => {
  const fromTotal = Math.floor((parseFloat(log?.total_hours) || 0) * 3600);
  if (!log?.start_time) return fromTotal;
  const st = new Date(log.start_time).getTime();
  if (!Number.isFinite(st)) return fromTotal;
  const derived = Math.max(
    0,
    Math.floor((nowMs - st) / 1000) - getBreakSeconds(log, nowMs),
  );
  return Math.max(fromTotal, derived);
};

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const EmployeeDashboard = () => {
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [totalDayHours, setTotalDayHours] = useState(0);
  const [totalBreaks, setTotalBreaks] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [stats, setStats] = useState({
    projects: 0,
    tickets: 0,
    completed: 0,
    pendingRequests: 0,
  });

  const [dark, setDark] = useState(getIsDarkTheme);
  const [todos, setTodos] = useState([]);
  const [todoLoading, setTodoLoading] = useState(false);
  const [todoSaving, setTodoSaving] = useState(false);
  const [todoTitle, setTodoTitle] = useState("");
  const [todoDescription, setTodoDescription] = useState("");
  const [todoPriority, setTodoPriority] = useState("medium");
  const [todoDueDate, setTodoDueDate] = useState(null);
  const [todoModalOpen, setTodoModalOpen] = useState(false);

  const { profile } = useAuth();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (profile?.id) {
      fetchTodayTimeLog();
      fetchStats();
      fetchTodos();
    }
  }, [profile]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused]);

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

  const fetchTodayTimeLog = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: timeLogs, error } = await supabase
        .from("time_logs")
        .select("*")
        .eq("user_id", profile.id)
        .eq("date", today)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const completed =
        timeLogs?.filter((l) => l.status === "completed").length || 0;
      const hasActiveOrPaused = timeLogs?.some(
        (l) =>
          l.status === "active" ||
          l.status === "paused" ||
          l.status === "break",
      )
        ? 1
        : 0;
      setTotalSessions(completed + hasActiveOrPaused);

      const allBreaks =
        timeLogs?.reduce((s, l) => s + (l.breaks?.length || 0), 0) || 0;
      setTotalBreaks(allBreaks);

      const activeLog = timeLogs?.find((l) => l.status === "active");
      if (activeLog) {
        setCurrentSessionTime(getNetSessionSeconds(activeLog));
        setIsRunning(true);
        setIsPaused(false);
      } else {
        const pausedLog = timeLogs?.find(
          (l) => l.status === "paused" || l.status === "break",
        );
        if (pausedLog) {
          setIsRunning(false);
          setIsPaused(true);
          setCurrentSessionTime(getNetSessionSeconds(pausedLog));
        } else {
          setIsRunning(false);
          setIsPaused(false);
          setCurrentSessionTime(0);
        }
      }

      const completedLogs =
        timeLogs?.filter((l) => l.status === "completed") || [];
      setTotalDayHours(
        completedLogs.reduce((s, l) => s + (parseFloat(l.total_hours) || 0), 0),
      );

      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", profile.id)
        .eq("date", today)
        .maybeSingle();
      setTodayAttendance(attendance);
    } catch (error) {
      console.error("Error fetching time log:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const [projectsRes, ticketsRes, completedRes, requestsRes] =
        await Promise.all([
          supabase
            .from("project_assignees")
            .select("id", { count: "exact" })
            .eq("employee_id", profile.id),
          supabase
            .from("tickets")
            .select("id", { count: "exact" })
            .eq("assigned_to", profile.id)
            .neq("status", "completed"),
          supabase
            .from("tickets")
            .select("id", { count: "exact" })
            .eq("assigned_to", profile.id)
            .eq("status", "completed"),
          supabase
            .from("requests")
            .select("id", { count: "exact" })
            .eq("user_id", profile.id)
            .eq("status", "pending"),
        ]);

      setStats({
        projects: projectsRes.count || 0,
        tickets: ticketsRes.count || 0,
        completed: completedRes.count || 0,
        pendingRequests: requestsRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchTodos = async () => {
    if (!profile?.id) return;
    setTodoLoading(true);
    try {
      const { data, error } = await supabase
        .from(TODO_TABLE)
        .select("*")
        .eq("user_id", profile.id)
        .order("completed", { ascending: true })
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error("Error fetching todo list:", error);
      message.error("Failed to load todo list");
    } finally {
      setTodoLoading(false);
    }
  };

  const addTodo = async () => {
    const title = todoTitle.trim();
    if (!title) {
      message.warning("Title is required");
      return false;
    }

    setTodoSaving(true);
    try {
      const payload = {
        title,
        description: todoDescription.trim() || null,
        completed: false,
        priority: todoPriority || "medium",
        due_date: todoDueDate ? dayjs(todoDueDate).format("YYYY-MM-DD") : null,
        user_id: profile.id,
        created_by: profile.id,
      };

      const { error } = await supabase.from(TODO_TABLE).insert([payload]);
      if (error) throw error;

      setTodoTitle("");
      setTodoDescription("");
      setTodoPriority("medium");
      setTodoDueDate(null);
      await fetchTodos();
      return true;
    } catch (error) {
      console.error("Error adding todo:", error);
      message.error("Failed to add todo");
      return false;
    } finally {
      setTodoSaving(false);
    }
  };

  const toggleTodo = async (todo) => {
    try {
      const { error } = await supabase
        .from(TODO_TABLE)
        .update({
          completed: !todo.completed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", todo.id)
        .eq("user_id", profile.id);

      if (error) throw error;

      setTodos((prev) =>
        prev.map((t) =>
          t.id === todo.id ? { ...t, completed: !todo.completed } : t,
        ),
      );
    } catch (error) {
      console.error("Error updating todo:", error);
      message.error("Failed to update todo");
    }
  };

  const removeTodo = async (todo) => {
    try {
      const { error } = await supabase
        .from(TODO_TABLE)
        .delete()
        .eq("id", todo.id)
        .eq("user_id", profile.id);

      if (error) throw error;

      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } catch (error) {
      console.error("Error deleting todo:", error);
      message.error("Failed to delete todo");
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const totalLiveHours = totalDayHours + currentSessionTime / 3600;

  const statusTag = isRunning
    ? { color: "#10b981", bg: dark ? "#16332c" : "#d1fae5", text: "Active" }
    : isPaused
      ? { color: "#f59e0b", bg: dark ? "#3a2f16" : "#fef3c7", text: "On Break" }
      : totalDayHours > 0
        ? {
            color: "#818cf8",
            bg: dark ? "#2d2a4a" : "#ede9fe",
            text: "Done for today",
          }
        : {
            color: "#94a3b8",
            bg: dark ? "#1f2937" : "#f1f5f9",
            text: "Not started",
          };

  const ui = {
    text: dark ? "#e5e7eb" : "#111827",
    sub: dark ? "#9ca3af" : "#6b7280",
    card: dark ? "#141416" : "#ffffff",
    border: dark ? "#1f2937" : "#e5e7eb",
    soft: dark ? "#1a1a1c" : "#f8fafc",
  };

  const priorityTone = (priority) => {
    const p = String(priority || "medium").toLowerCase();
    if (p === "high")
      return { bg: dark ? "#3f1b1b" : "#fee2e2", color: "#ef4444" };
    if (p === "low")
      return { bg: dark ? "#133229" : "#d1fae5", color: "#10b981" };
    return { bg: dark ? "#3a2f16" : "#fef3c7", color: "#f59e0b" };
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        color: ui.text,
        background: dark ? "#141416" : "transparent",
      }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            className="h-full rounded-2xl border-0 shadow-sm"
            bodyStyle={{ padding: "28px 24px" }}
            style={{ background: ui.card, border: `1px solid ${ui.border}` }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-indigo-500 text-lg" />
                <span className="font-semibold" style={{ color: ui.text }}>
                  Today's Work
                </span>
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: statusTag.color, background: statusTag.bg }}
              >
                {statusTag.text}
              </span>
            </div>

            <div className="text-center mb-6">
              <div
                className="text-6xl font-bold tracking-tight mb-1"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  color: isRunning ? "#10b981" : isPaused ? "#f59e0b" : ui.text,
                }}
              >
                {formatTime(currentSessionTime)}
              </div>
              <div className="text-xs" style={{ color: ui.sub }}>
                current session time
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                {
                  label: "Total Hours",
                  value: `${totalLiveHours.toFixed(2)}h`,
                  color: "#6366f1",
                },
                { label: "Sessions", value: totalSessions, color: "#10b981" },
                { label: "Breaks", value: totalBreaks, color: "#f59e0b" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: ui.soft }}
                >
                  <div
                    className="text-xl font-bold"
                    style={{
                      color: s.color,
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: ui.sub }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {todayAttendance?.standup_message && (
              <div
                className="rounded-xl p-3"
                style={{
                  background: dark ? "#0f2f23" : "#ecfdf5",
                  border: `1px solid ${dark ? "#1f5542" : "#a7f3d0"}`,
                }}
              >
                <div className="text-xs font-semibold text-emerald-600 mb-1 flex items-center gap-1">
                  <CheckCircleOutlined /> Standup submitted
                </div>
                <p
                  className="text-sm leading-relaxed m-0"
                  style={{ color: dark ? "#d1fae5" : "#374151" }}
                >
                  {todayAttendance.standup_message}
                </p>
                <div className="text-xs mt-1.5" style={{ color: ui.sub }}>
                  {todayAttendance.hours_worked?.toFixed(2)} hours worked --
                  Status:{" "}
                  <span className="font-medium capitalize">
                    {todayAttendance.status}
                  </span>
                </div>
              </div>
            )}

            {!isRunning && !isPaused && !todayAttendance?.standup_message && (
              <div
                className="rounded-xl p-3 text-center"
                style={{
                  background: dark ? "#16213d" : "#eef2ff",
                  border: `1px solid ${dark ? "#2a3b65" : "#c7d2fe"}`,
                }}
              >
                <DesktopOutlined className="text-indigo-400 text-lg mb-1" />
                <p
                  className="text-xs m-0"
                  style={{ color: dark ? "#c7d2fe" : "#4f46e5" }}
                >
                  Open the <strong>Ryzent AI Desktop App</strong> to start your
                  work timer
                </p>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Row gutter={[16, 16]}>
            {[
              {
                title: "Active Projects",
                value: stats.projects,
                color: dark ? "#cbd5e1" : "#001529",
              },
              {
                title: "Active Tickets",
                value: stats.tickets,
                color: "#fa8c16",
              },
              {
                title: "Completed Tickets",
                value: stats.completed,
                color: "#52c41a",
              },
              {
                title: "Pending Requests",
                value: stats.pendingRequests,
                color: "#1890ff",
              },
            ].map((s) => (
              <Col xs={12} key={s.title}>
                <Card
                  className="rounded-2xl border-0 shadow-sm"
                  style={{
                    background: ui.card,
                    border: `1px solid ${ui.border}`,
                  }}
                >
                  <Statistic
                    title={<span style={{ color: ui.sub }}>{s.title}</span>}
                    value={s.value}
                    valueStyle={{ color: s.color }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      <div className="mt-6">
        <div
          className="rounded-2xl shadow-sm p-6"
          style={{ background: ui.card, border: `1px solid ${ui.border}` }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: dark ? "#16213d" : "#eef2ff" }}
              >
                <DesktopOutlined style={{ fontSize: 24, color: "#6366f1" }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2
                    className="font-bold text-base m-0"
                    style={{ color: ui.text }}
                  >
                    Ryzent AI Desktop
                  </h2>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: dark ? "#1f2937" : "#eef2ff",
                      color: "#6366f1",
                    }}
                  >
                    v1.0
                  </span>
                </div>
                <p className="text-sm m-0" style={{ color: ui.sub }}>
                  Track work hours, and monitor app usage automatically.
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  {[
                    {
                      icon: <ClockCircleOutlined />,
                      text: "Auto time tracking",
                    },
                    {
                      icon: <ThunderboltOutlined />,
                      text: "App usage analytics",
                    },
                  ].map((f) => (
                    <div
                      key={f.text}
                      className="flex items-center gap-1 text-xs"
                      style={{ color: ui.sub }}
                    >
                      {f.icon}
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href="/Ryzent Setup 1.0.0.exe"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline border hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                style={{ borderColor: ui.border, color: ui.text }}
              >
                <DownloadOutlined />
                Windows
              </a>
            </div>
          </div>
        </div>
      </div>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} xl={12}>
          <BirthdayWidget />
        </Col>

        <Col xs={24} xl={12}>
          <div
            className="rounded-2xl p-6 h-full"
            style={{ background: ui.card, border: `1px solid ${ui.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-base font-bold m-0"
                style={{ color: ui.text }}
              >
                To Do List
              </h2>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, color: ui.sub }}>
                  {todos.filter((t) => !t.completed).length} open
                </span>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setTodoModalOpen(true)}
                >
                  Add
                </Button>
              </div>
            </div>

            {todoLoading ? (
              <div style={{ color: ui.sub, fontSize: 13 }}>
                Loading todos...
              </div>
            ) : todos.length === 0 ? (
              <Empty
                description={
                  <span style={{ color: ui.sub }}>No todos yet</span>
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                {todos.map((todo) => {
                  const tone = priorityTone(todo.priority);
                  return (
                    <div
                      key={todo.id}
                      className="rounded-xl p-3"
                      style={{
                        background: ui.soft,
                        border: `1px solid ${ui.border}`,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                          flex: 1,
                        }}
                      >
                        <Checkbox
                          checked={!!todo.completed}
                          onChange={() => toggleTodo(todo)}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: ui.text,
                              textDecoration: todo.completed
                                ? "line-through"
                                : "none",
                              opacity: todo.completed ? 0.75 : 1,
                            }}
                          >
                            {todo.title}
                          </div>
                          {todo.description && (
                            <div
                              style={{
                                color: ui.sub,
                                fontSize: 12,
                                marginTop: 2,
                              }}
                            >
                              {todo.description}
                            </div>
                          )}
                          <div
                            style={{
                              marginTop: 6,
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 999,
                                color: tone.color,
                                background: tone.bg,
                              }}
                            >
                              {String(todo.priority || "medium").toUpperCase()}
                            </span>
                            {todo.due_date && (
                              <span style={{ fontSize: 11, color: ui.sub }}>
                                Due {dayjs(todo.due_date).format("MMM D, YYYY")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeTodo(todo)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Modal
        title="Add To Do"
        open={todoModalOpen}
        onCancel={() => setTodoModalOpen(false)}
        onOk={async () => {
          const ok = await addTodo();
          if (ok) setTodoModalOpen(false);
        }}
        okText="Create"
        confirmLoading={todoSaving}
      >
        <div className="grid gap-3">
          <Input
            value={todoTitle}
            onChange={(e) => setTodoTitle(e.target.value)}
            placeholder="Todo title"
          />
          <Input.TextArea
            value={todoDescription}
            onChange={(e) => setTodoDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={4}
          />
          <Select
            value={todoPriority}
            onChange={setTodoPriority}
            options={[
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
            ]}
          />
          <DatePicker
            value={todoDueDate}
            onChange={setTodoDueDate}
            placeholder="Due date"
            style={{ width: "100%" }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeDashboard;
