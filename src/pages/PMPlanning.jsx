import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Empty,
  Input,
  Modal,
  Progress,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

dayjs.extend(isoWeek);

const { Title, Text } = Typography;
const PRIORITY_OPTIONS = ["low", "medium", "high"];

const startOfIsoWeek = (d = dayjs()) => d.startOf("isoWeek");

const normalizeWeeklyContent = (baseWeekStart, raw) => {
  const out = {};
  for (let i = 0; i < 7; i += 1) {
    const key = baseWeekStart.add(i, "day").format("YYYY-MM-DD");
    const row = raw?.[key];
    out[key] = Array.isArray(row) ? row : [];
  }
  return out;
};

const getPriorityColor = (priority) => {
  if (priority === "high") return "red";
  if (priority === "medium") return "gold";
  return "green";
};

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export default function PMPlanning() {
  const { profile } = useAuth();
  const [dark, setDark] = useState(getIsDarkTheme);
  const [authUserId, setAuthUserId] = useState(null);

  const [loadingTodos, setLoadingTodos] = useState(true);
  const [todos, setTodos] = useState([]);
  const [activeProjectCount, setActiveProjectCount] = useState(0);

  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [addingTodo, setAddingTodo] = useState(false);
  const [todoTitle, setTodoTitle] = useState("");
  const [todoDescription, setTodoDescription] = useState("");
  const [todoPriority, setTodoPriority] = useState("medium");
  const [todoDueDate, setTodoDueDate] = useState(null);
  const [quickTask, setQuickTask] = useState("");

  const [weekStart, setWeekStart] = useState(startOfIsoWeek());
  const [weeklyPlanId, setWeeklyPlanId] = useState(null);
  const [weeklyContent, setWeeklyContent] = useState({});
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [weeklyTableUnavailable, setWeeklyTableUnavailable] = useState(false);

  const [planModalDay, setPlanModalDay] = useState(null);
  const [planModalText, setPlanModalText] = useState("");
  const ownerId = profile?.id || authUserId;

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day")),
    [weekStart],
  );

  const pendingTodos = useMemo(
    () => todos.filter((t) => !t.completed),
    [todos],
  );

  const completedTodos = useMemo(
    () => todos.filter((t) => !!t.completed),
    [todos],
  );

  const todayKey = dayjs().format("YYYY-MM-DD");

  const dueTodayCount = useMemo(
    () => pendingTodos.filter((t) => t.due_date === todayKey).length,
    [pendingTodos, todayKey],
  );

  const completedToday = useMemo(
    () =>
      completedTodos.filter((t) => {
        const d = t.updated_at
          ? dayjs(t.updated_at).format("YYYY-MM-DD")
          : null;
        return d === todayKey;
      }).length,
    [completedTodos, todayKey],
  );

  const tasksThisWeek = useMemo(() => {
    const fromWeekly = Object.values(weeklyContent).reduce(
      (sum, arr) => sum + (arr?.length || 0),
      0,
    );
    const fromDue = pendingTodos.filter((t) => {
      if (!t.due_date) return false;
      const d = dayjs(t.due_date);
      return d.isSame(weekStart, "week");
    }).length;
    return fromWeekly + fromDue;
  }, [weeklyContent, pendingTodos, weekStart]);

  const completionPercent = useMemo(() => {
    if (!todos.length) return 0;
    return Math.round((completedTodos.length / todos.length) * 100);
  }, [todos.length, completedTodos.length]);

  const nextDeadline = useMemo(() => {
    const next = pendingTodos
      .filter((t) => !!t.due_date)
      .sort(
        (a, b) => dayjs(a.due_date).valueOf() - dayjs(b.due_date).valueOf(),
      )[0];
    return next ? dayjs(next.due_date).format("ddd") : "-";
  }, [pendingTodos]);

  const todaysFocus = useMemo(() => pendingTodos.slice(0, 5), [pendingTodos]);

  const upcoming = useMemo(() => {
    const out = [];

    weekDays.forEach((d) => {
      const key = d.format("YYYY-MM-DD");
      (weeklyContent[key] || []).forEach((line) => {
        out.push({
          dayLabel: d.format("ddd").toLowerCase(),
          dayNum: d.format("D"),
          title: line,
          sub: "Planned",
        });
      });
    });

    pendingTodos
      .filter((t) => !!t.due_date)
      .forEach((t) => {
        const d = dayjs(t.due_date);
        out.push({
          dayLabel: d.format("ddd").toLowerCase(),
          dayNum: d.format("D"),
          title: t.title,
          sub: t.due_date === todayKey ? "Today" : "End of day",
        });
      });

    return out.sort((a, b) => Number(a.dayNum) - Number(b.dayNum)).slice(0, 6);
  }, [weekDays, weeklyContent, pendingTodos, todayKey]);

  const fetchTodos = async () => {
    if (!ownerId) return;
    setLoadingTodos(true);

    const { data: todoData, error: todoError } = await supabase
      .from("todos")
      .select(
        "id,title,description,completed,priority,due_date,created_at,updated_at,user_id,created_by",
      )
      .or(`user_id.eq.${ownerId},created_by.eq.${ownerId}`)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (todoError) {
      message.error(`Failed to load todos: ${todoError.message}`);
    }

    console.log("Fetched todos:", todoData);

    setTodos(todoData || []);
    setLoadingTodos(false);
  };

  const fetchWeeklyPlan = async () => {
    if (!ownerId) return;
    setLoadingWeekly(true);
    setWeeklyTableUnavailable(false);

    const key = weekStart.format("YYYY-MM-DD");
    const { data, error } = await supabase
      .from("pm_weekly_plans")
      .select("id,week_start,content_json")
      .eq("user_id", ownerId)
      .eq("week_start", key)
      .maybeSingle();

    if (error) {
      if (
        String(error.message || "")
          .toLowerCase()
          .includes("pm_weekly_plans")
      ) {
        setWeeklyTableUnavailable(true);
      } else {
        message.error("Failed to load weekly plan");
      }
      setWeeklyPlanId(null);
      setWeeklyContent(normalizeWeeklyContent(weekStart, {}));
      setLoadingWeekly(false);
      return;
    }

    setWeeklyPlanId(data?.id || null);
    setWeeklyContent(
      normalizeWeeklyContent(weekStart, data?.content_json || {}),
    );
    setLoadingWeekly(false);
  };

  useEffect(() => {
    fetchTodos();
  }, [ownerId]);

  useEffect(() => {
    fetchWeeklyPlan();
  }, [ownerId, weekStart.valueOf()]);

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);
    mq.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      mq.removeEventListener("change", syncTheme);
    };
  }, []);

  useEffect(() => {
    const loadAuthUser = async () => {
      const { data } = await supabase.auth.getUser();
      setAuthUserId(data?.user?.id || null);
    };
    loadAuthUser();
  }, []);

  const resetTodoForm = () => {
    setTodoTitle("");
    setTodoDescription("");
    setTodoPriority("medium");
    setTodoDueDate(null);
  };

  const addTodo = async () => {
    if (!ownerId) return;
    const title = todoTitle.trim();
    if (!title) {
      message.warning("Please enter a task title.");
      return;
    }
    if (!todoPriority) {
      message.warning("Please select priority.");
      return;
    }
    if (!todoDueDate) {
      message.warning("Please select due date.");
      return;
    }

    setAddingTodo(true);
    const { error } = await supabase.from("todos").insert({
      title,
      description: todoDescription.trim() || null,
      priority: todoPriority,
      due_date: todoDueDate ? todoDueDate.format("YYYY-MM-DD") : null,
      completed: false,
      user_id: ownerId,
      created_by: ownerId,
    });

    if (error) {
      message.error("Failed to add todo");
    } else {
      message.success("Task added");
      setTodoModalOpen(false);
      resetTodoForm();
      fetchTodos();
    }

    setAddingTodo(false);
  };

  const addQuickTodo = async () => {
    const title = quickTask.trim();
    if (!title) return;
    setTodoTitle(title);
    setQuickTask("");
    setTodoModalOpen(true);
  };

  const updateTodo = async (id, patch) => {
    if (!ownerId) return;
    const { error } = await supabase
      .from("todos")
      .update(patch)
      .eq("id", id)
      .or(`user_id.eq.${ownerId},created_by.eq.${ownerId}`);

    if (error) message.error("Failed to update todo");
    fetchTodos();
  };

  const deleteTodo = async (id) => {
    if (!ownerId) return;
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .or(`user_id.eq.${ownerId},created_by.eq.${ownerId}`);

    if (error) message.error("Failed to delete todo");
    fetchTodos();
  };

  const addPlanLine = () => {
    if (!planModalDay || !planModalText.trim()) return;
    const key = planModalDay.format("YYYY-MM-DD");
    setWeeklyContent((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), planModalText.trim()],
    }));
    setPlanModalDay(null);
    setPlanModalText("");
  };

  const removePlanLine = (dayKey, idx) => {
    setWeeklyContent((prev) => {
      const clone = [...(prev[dayKey] || [])];
      clone.splice(idx, 1);
      return { ...prev, [dayKey]: clone };
    });
  };

  const saveWeeklyPlan = async () => {
    if (weeklyTableUnavailable || !ownerId) return;
    setSavingWeekly(true);

    const compact = Object.fromEntries(
      Object.entries(weeklyContent).map(([k, arr]) => [
        k,
        (arr || []).map((v) => v.trim()).filter(Boolean),
      ]),
    );

    const payload = {
      user_id: ownerId,
      week_start: weekStart.format("YYYY-MM-DD"),
      content_json: compact,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("pm_weekly_plans")
      .upsert(payload, { onConflict: "user_id,week_start" })
      .select("id")
      .single();

    if (error) {
      message.error("Failed to save weekly plan");
    } else {
      setWeeklyPlanId(data?.id || weeklyPlanId);
      message.success("Weekly plan saved");
    }

    setSavingWeekly(false);
  };

  return (
    <div
      className={`pm-planning-pro ${dark ? "dark" : "light"}`}
      style={{ minHeight: "100%", background: "var(--pp-bg)" }}
    >
      <style>{`
        .pm-planning-pro {
          --pp-bg: #f8fafc;
          --pp-card: #ffffff;
          --pp-border: #e5e7eb;
          --pp-text: #0f172a;
          --pp-sub: #64748b;
          --pp-muted: #94a3b8;
          --pp-day-bg: #f8fafc;
          --pp-day-border: #e2e8f0;
          --pp-pill-text: #1f2937;
          --pp-divider: #e5e7eb;
          --pp-sk1: #e5e7eb;
          --pp-sk2: #f1f5f9;
          color: var(--pp-text);
          font-size: 13px;
        }
        .pm-planning-pro.dark {
          --pp-bg: #0f0f10;
          --pp-card: #141416;
          --pp-border: #3a3a3a;
          --pp-text: #f8fafc;
          --pp-sub: #d1c3ad;
          --pp-muted: #b7a98f;
          --pp-day-bg: rgba(255,255,255,0.03);
          --pp-day-border: #3b3b3b;
          --pp-pill-text: #1f2937;
          --pp-divider: #3a3a3a;
          --pp-sk1: #1f2024;
          --pp-sk2: #2a2b31;
        }
        .pp-shell {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
          gap: 16px;
        }
        .pp-card {
          background: var(--pp-card);
          border: 1px solid var(--pp-border);
          border-radius: 14px;
          padding: 18px;
          box-shadow: none;
        }
        .pp-title { color: var(--pp-text) !important; margin: 0 !important; }
        .pp-sub { color: var(--pp-sub) !important; }
        .pp-week-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 8px;
          margin-top: 12px;
        }
        .pp-day {
          background: var(--pp-day-bg);
          border: 1px solid var(--pp-day-border);
          border-radius: 10px;
          padding: 8px;
          min-height: 140px;
        }
        .pp-day-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--pp-sub);
          font-size: 11px;
          margin-bottom: 8px;
        }
        .pp-date-dot {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          color: #111;
          font-weight: 700;
          font-size: 16px;
        }
        .pp-pill {
          padding: 6px 8px;
          border-radius: 8px;
          font-size: 11px;
          color: var(--pp-pill-text);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .pp-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        .pp-stat {
          background: var(--pp-card);
          border: 1px solid var(--pp-border);
          border-radius: 12px;
          padding: 16px;
        }
        .pp-stat h3 { margin: 0; font-size: 24px; line-height: 1; color: var(--pp-text); }
        .pp-stat p { margin: 6px 0 0; color: var(--pp-sub); font-size: 11px; }
        .pp-focus-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid var(--pp-divider);
        }
        .pp-up-item {
          display: grid;
          grid-template-columns: 42px 1fr;
          gap: 8px;
          padding: 8px 0;
        }
        .pp-up-day {
          color: var(--pp-sub);
          text-transform: lowercase;
          font-weight: 600;
          line-height: 1.1;
          font-size: 11px;
        }
        .pp-right-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pp-skeleton-line {
          border-radius: 8px;
          background: linear-gradient(90deg, var(--pp-sk1) 25%, var(--pp-sk2) 50%, var(--pp-sk1) 75%);
          background-size: 800px 100%;
          animation: ppShimmer 1.4s ease-in-out infinite;
        }
        @keyframes ppShimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @media (max-width: 1100px) {
          .pp-shell {
            grid-template-columns: 1fr;
          }
          .pp-week-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .pp-stats {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 640px) {
          .pp-week-grid, .pp-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="pp-shell">
        <div>
          <div className="pp-card" style={{ marginBottom: 16 }}>
            <Title level={2} className="pp-title" style={{ fontSize: 26 }}>
              Plan your week
            </Title>
            <Text className="pp-sub" style={{ fontSize: 11 }}>
              {dayjs().format("dddd, MMMM D")} - {dueTodayCount} tasks due today
            </Text>
          </div>

          <div className="pp-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <Title level={3} className="pp-title" style={{ fontSize: 16 }}>
                Week of {weekStart.format("MMM D")} -{" "}
                {weekStart.add(6, "day").format("D")}
              </Title>
              <Space>
                <Button
                  icon={<LeftOutlined />}
                  onClick={() => setWeekStart((p) => p.subtract(1, "week"))}
                />
                <Button
                  icon={<RightOutlined />}
                  onClick={() => setWeekStart((p) => p.add(1, "week"))}
                />
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={saveWeeklyPlan}
                  loading={savingWeekly}
                  disabled={loadingWeekly || weeklyTableUnavailable}
                >
                  Save
                </Button>
              </Space>
            </div>

            {weeklyTableUnavailable && (
              <Alert
                type="warning"
                showIcon
                message="Weekly plan table not found. Create pm_weekly_plans table first."
                style={{ marginBottom: 12 }}
              />
            )}

            {loadingWeekly ? (
              <div className="pp-week-grid">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div className="pp-day" key={`wk-sk-${i}`}>
                    <div
                      className="pp-skeleton-line"
                      style={{ height: 12, width: 48, marginBottom: 10 }}
                    />
                    <div
                      className="pp-skeleton-line"
                      style={{
                        height: 30,
                        width: 30,
                        borderRadius: 999,
                        marginBottom: 12,
                      }}
                    />
                    <div
                      className="pp-skeleton-line"
                      style={{ height: 26, marginBottom: 8 }}
                    />
                    <div
                      className="pp-skeleton-line"
                      style={{ height: 26, marginBottom: 8, width: "88%" }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="pp-week-grid">
                {weekDays.map((day) => {
                  const key = day.format("YYYY-MM-DD");
                  const items = weeklyContent[key] || [];
                  const itemColors = [
                    "#c9d7e5",
                    "#d7ede0",
                    "#f4e7c0",
                    "#dbe8f8",
                    "#d4efe9",
                    "#efe1d8",
                    "#e7e3dc",
                  ];

                  return (
                    <div className="pp-day" key={key}>
                      <div className="pp-day-head">
                        <span>{day.format("ddd").toLowerCase()}</span>
                        <Button
                          size="small"
                          type="text"
                          icon={<PlusOutlined />}
                          onClick={() => setPlanModalDay(day)}
                        />
                      </div>

                      {day.isSame(dayjs(), "day") ? (
                        <div className="pp-date-dot">{day.format("D")}</div>
                      ) : (
                        <div
                          style={{
                            fontSize: 18,
                            color: "var(--pp-sub)",
                            lineHeight: 1,
                            marginBottom: 8,
                          }}
                        >
                          {day.format("D")}
                        </div>
                      )}

                      {items.length > 0 &&
                        items.map((line, idx) => (
                          <div
                            className="pp-pill"
                            key={`${key}-${idx}`}
                            style={{
                              background: itemColors[idx % itemColors.length],
                            }}
                          >
                            <span
                              style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {line}
                            </span>
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => removePlanLine(key, idx)}
                              style={{ color: "#7c2d12" }}
                            />
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pp-stats">
            <div className="pp-stat">
              <h3>{completedToday}</h3>
              <p>completed today</p>
            </div>
            <div className="pp-stat">
              <h3>{tasksThisWeek}</h3>
              <p>tasks this week</p>
            </div>
            <div className="pp-stat">
              <h3>{activeProjectCount}</h3>
              <p>projects active</p>
            </div>
            <div className="pp-stat">
              <h3>{nextDeadline}</h3>
              <p>next deadline</p>
            </div>
          </div>
        </div>

        <div className="pp-right-stack">
          <div className="pp-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <Title
                level={4}
                className="pp-title"
                style={{ margin: 0, fontSize: 16 }}
              >
                Today's focus
              </Title>
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => setTodoModalOpen(true)}
              />
            </div>

            {loadingTodos ? (
              <Space direction="vertical" style={{ width: "100%" }} size={10}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`todo-sk-${i}`}
                    className="pp-focus-item"
                    style={{ borderBottom: "none", padding: 0 }}
                  >
                    <Skeleton.Avatar active size={18} shape="circle" />
                    <div style={{ flex: 1 }}>
                      <div
                        className="pp-skeleton-line"
                        style={{
                          height: 12,
                          marginBottom: 7,
                          width: i % 2 ? "78%" : "92%",
                        }}
                      />
                      <div
                        className="pp-skeleton-line"
                        style={{ height: 10, width: "42%" }}
                      />
                    </div>
                  </div>
                ))}
                <div
                  className="pp-skeleton-line"
                  style={{ height: 8, marginTop: 8 }}
                />
                <div
                  className="pp-skeleton-line"
                  style={{ height: 36, marginTop: 6 }}
                />
              </Space>
            ) : todaysFocus.length === 0 ? (
              <Empty
                description="No focus tasks"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              todaysFocus.map((todo) => (
                <div key={todo.id} className="pp-focus-item">
                  <Checkbox
                    checked={!!todo.completed}
                    onChange={(e) =>
                      updateTodo(todo.id, { completed: e.target.checked })
                    }
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        color: "var(--pp-text)",
                        fontSize: 11,
                        fontWeight: 600,
                        textDecoration: todo.completed
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {todo.title}
                    </div>
                    <Space size={6}>
                      <Tag color={getPriorityColor(todo.priority || "low")}>
                        {todo.priority || "set priority"}
                      </Tag>
                      <Tag color={todo.due_date ? "blue" : "red"}>
                        {todo.due_date
                          ? dayjs(todo.due_date).format("MMM D")
                          : "set due date"}
                      </Tag>
                    </Space>
                  </div>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteTodo(todo.id)}
                  />
                </div>
              ))
            )}

            <Text
              className="pp-sub"
              style={{ display: "block", marginTop: 12, marginBottom: 6 }}
            >
              {completedTodos.length} of {todos.length || 0} done
            </Text>
            <Progress
              percent={completionPercent}
              showInfo={false}
              strokeColor={dark ? "#e5e7eb" : "#334155"}
              trailColor={dark ? "#4b5563" : "#e2e8f0"}
            />

            {/* <Input
              value={quickTask}
              onChange={(e) => setQuickTask(e.target.value)}
              onPressEnter={addQuickTodo}
              placeholder="Add a task..."
              style={{ marginTop: 10 }}
              suffix={
                <PlusOutlined
                  onClick={addQuickTodo}
                  style={{ cursor: "pointer" }}
                />
              }
            /> */}
          </div>

          <div className="pp-card">
            <Title
              level={4}
              className="pp-title"
              style={{ marginBottom: 8, fontSize: 16 }}
            >
              Upcoming
            </Title>
            {upcoming.length === 0 ? (
              <Empty
                description="No upcoming items"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              upcoming.map((item, idx) => (
                <div key={`${item.dayLabel}-${idx}`} className="pp-up-item">
                  <div className="pp-up-day">
                    <div>{item.dayLabel}</div>
                    <div>{item.dayNum}</div>
                  </div>
                  <div>
                    <div
                      style={{
                        color: "var(--pp-text)",
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: 1.2,
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ color: "var(--pp-sub)", fontSize: 10 }}>
                      {item.sub}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        title="Add Task"
        open={todoModalOpen}
        onCancel={() => {
          setTodoModalOpen(false);
          resetTodoForm();
        }}
        onOk={addTodo}
        okText="Add"
        okButtonProps={{ loading: addingTodo }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={10}>
          <Input
            placeholder="Task title"
            value={todoTitle}
            onChange={(e) => setTodoTitle(e.target.value)}
          />
          <Input.TextArea
            rows={3}
            placeholder="Description"
            value={todoDescription}
            onChange={(e) => setTodoDescription(e.target.value)}
          />
          <Space>
            <Select
              value={todoPriority}
              onChange={setTodoPriority}
              style={{ width: 140 }}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <Select.Option key={p} value={p}>
                  {p}
                </Select.Option>
              ))}
            </Select>
            <DatePicker value={todoDueDate} onChange={setTodoDueDate} />
          </Space>
        </Space>
      </Modal>

      <Modal
        title={
          planModalDay
            ? `Add plan item - ${planModalDay.format("ddd, MMM D")}`
            : "Add plan item"
        }
        open={!!planModalDay}
        onCancel={() => {
          setPlanModalDay(null);
          setPlanModalText("");
        }}
        onOk={addPlanLine}
        okText="Add"
      >
        <Input
          value={planModalText}
          onChange={(e) => setPlanModalText(e.target.value)}
          placeholder="Design review, Sprint planning..."
          onPressEnter={addPlanLine}
        />
      </Modal>
    </div>
  );
}
