import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Avatar,
  Progress,
  Spin,
  Empty,
  Select,
  Tag,
  Tooltip,
  Alert,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  FireOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getMonthOptions = () => {
  const now = dayjs();
  return Array.from({ length: 6 }, (_, i) => {
    const d = now.subtract(i, "month");
    return {
      value: `${d.year()}-${String(d.month() + 1).padStart(2, "0")}`,
      label: `${MONTHS[d.month()]} ${d.year()}`,
    };
  });
};

const getWorkingDays = (yearMonth) => {
  const [y, m] = yearMonth.split("-").map(Number);
  const now = dayjs();
  const isCurrentMonth = now.year() === y && now.month() + 1 === m;
  const lastDay = isCurrentMonth
    ? now.date()
    : dayjs(`${yearMonth}-01`).daysInMonth();
  const days = [];
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${yearMonth}-${String(d).padStart(2, "0")}`;
    if (dayjs(dateStr).day() !== 0) days.push(dateStr);
  }
  return days;
};

const fmtHours = (h) => {
  if (!h) return "0h 0m";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
};

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

// ── Calendar ──────────────────────────────────────────────────────────────────
const CalendarHeatmap = ({ yearMonth, dailyRecords, workingDays, dark = false }) => {
  const firstDay = dayjs(`${yearMonth}-01`).day();
  const totalDays = dayjs(`${yearMonth}-01`).daysInMonth();
  const workingSet = new Set(workingDays);
  const colorMap = { present: "#10b981", absent: "#ef4444", leave: "#f59e0b" };
  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${yearMonth}-${String(d).padStart(2, "0")}`;
    const isSunday = dayjs(dateStr).day() === 0;
    const rec = dailyRecords[dateStr];
    const isPast = workingSet.has(dateStr);
    const isToday = dayjs().format("YYYY-MM-DD") === dateStr;

    let bg = "transparent",
      textColor = dark ? "#64748b" : "#cbd5e1";
    if (isSunday) {
      bg = dark ? "#1b1d23" : "#f8fafc";
      textColor = dark ? "#3f485a" : "#e2e8f0";
    } else if (rec) {
      bg = colorMap[rec] + "25";
      textColor = colorMap[rec];
    } else if (isPast) {
      bg = dark ? "#1f2430" : "#f1f5f9";
      textColor = dark ? "#8b97ab" : "#94a3b8";
    }

    cells.push(
      <Tooltip
        key={d}
        title={
          isSunday
            ? `${d}: Sunday (off)`
            : rec
              ? `${d}: ${rec}`
              : isPast
                ? `${d}: not logged`
                : ""
        }
      >
        <div
          className="rounded-lg flex items-center justify-center font-medium cursor-default select-none"
          style={{
            width: 32,
            height: 32,
            fontSize: 12,
            background: bg,
            color: textColor,
            border: isToday
              ? `2px solid ${rec ? colorMap[rec] : "#6366f1"}`
              : `1px solid ${dark ? "#232833" : "transparent"}`,
            opacity: isSunday ? 0.35 : 1,
            transition: "all 0.15s",
          }}
        >
          {d}
        </div>
      </Tooltip>,
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
          <div
            key={i}
            className="text-center font-medium"
            style={{
              fontSize: 10,
              color: i === 0 ? "#fca5a5" : dark ? "#748094" : "#cbd5e1",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          { color: "#10b981", label: "Present" },
          { color: "#ef4444", label: "Absent" },
          { color: "#f59e0b", label: "Leave" },
          { color: "#94a3b8", label: "Not Logged" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{
                background: l.color + "60",
                border: `1.5px solid ${l.color}`,
              }}
            />
            <span className="text-xs" style={{ color: dark ? "#94a3b8" : "#94a3b8" }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Stat Box ──────────────────────────────────────────────────────────────────
const StatBox = ({ icon, label, value, color, bg, tip, borderColor }) => (
  <Tooltip title={tip}>
    <div
      className="rounded-2xl p-4 cursor-default"
      style={{ background: bg, border: `1px solid ${borderColor || "transparent"}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium" style={{ color }}>
          {label}
        </span>
        <span style={{ color, opacity: 0.7, fontSize: 16 }}>{icon}</span>
      </div>
      <div
        className="text-3xl font-bold"
        style={{ color, fontFamily: "'DM Mono', monospace" }}
      >
        {value}
      </div>
    </div>
  </Tooltip>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployeeAttendanceProfile() {
  const { profile } = useAuth();
  const employeeId = profile?.id;

  const now = dayjs();
  const [yearMonth, setYearMonth] = useState(
    `${now.year()}-${String(now.month() + 1).padStart(2, "0")}`,
  );
  const [employee, setEmployee] = useState(null);
  const [stats, setStats] = useState(null);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(getIsDarkTheme);

  const workingDays = getWorkingDays(yearMonth);
  const [y, m] = yearMonth.split("-").map(Number);
  const monthLabel = `${MONTHS[m - 1]} ${y}`;

  const fetchData = useCallback(
    async (ym) => {
      if (!employeeId) return;
      setLoading(true);
      try {
        const wDays = getWorkingDays(ym);
        const startDate = `${ym}-01`;
        const endDate = wDays[wDays.length - 1] ?? startDate;

        // Employee profile
        const { data: emp } = await supabase
          .from("profiles")
          .select(
            "id, full_name, job_title, role, department, email, user_photo, created_at",
          )
          .eq("id", employeeId)
          .single();
        setEmployee(emp);

        // Attendance
        const { data: attRecords } = await supabaseAdmin
          .from("attendance")
          .select("user_id, date, status")
          .eq("user_id", employeeId)
          .gte("date", startDate)
          .lte("date", endDate);

        // Time logs
        const { data: logs } = await supabaseAdmin
          .from("time_logs")
          .select("user_id, date, total_hours, start_time, end_time, status")
          .eq("user_id", employeeId)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false });
        setTimeLogs(logs || []);

        // Build attMap
        const attMap = {};
        (attRecords || []).forEach((r) => {
          attMap[r.date] = r.status;
        });

        // loggedDays
        const loggedDays = new Set((logs || []).map((l) => l.date));

        // Build stats
        let present = 0,
          absent = 0,
          leave = 0,
          notLogged = 0;
        const dailyRecords = {};
        let totalHoursWorked = 0;

        wDays.forEach((dateStr) => {
          const att = attMap[dateStr];
          const hasLog = loggedDays.has(dateStr);
          if (att === "present") {
            present++;
            dailyRecords[dateStr] = "present";
          } else if (att === "absent") {
            absent++;
            dailyRecords[dateStr] = "absent";
          } else if (att === "leave") {
            leave++;
            dailyRecords[dateStr] = "leave";
          } else if (!hasLog) {
            notLogged++;
          }
        });

        // Total hours from completed logs
        (logs || []).forEach((l) => {
          if (l.status === "completed")
            totalHoursWorked += parseFloat(l.total_hours) || 0;
        });

        // Streak
        let streak = 0;
        for (let i = wDays.length - 1; i >= 0; i--) {
          if (dailyRecords[wDays[i]] === "present") streak++;
          else break;
        }

        setStats({
          present,
          absent,
          leave,
          notLogged,
          dailyRecords,
          totalHoursWorked,
          streak,
          total: wDays.length,
        });
      } finally {
        setLoading(false);
      }
    },
    [employeeId],
  );

  useEffect(() => {
    fetchData(yearMonth);
  }, [yearMonth, fetchData]);

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);
    if (typeof media.addEventListener === "function")
      media.addEventListener("change", syncTheme);
    else if (typeof media.addListener === "function")
      media.addListener(syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      if (typeof media.removeEventListener === "function")
        media.removeEventListener("change", syncTheme);
      else if (typeof media.removeListener === "function")
        media.removeListener(syncTheme);
    };
  }, []);

  if (!employeeId) return <Empty description="Not logged in" />;

  const attendanceRate =
    stats && stats.total > 0
      ? Math.round((stats.present / stats.total) * 100)
      : 0;

  const rateColor =
    attendanceRate >= 90
      ? "#10b981"
      : attendanceRate >= 75
        ? "#f59e0b"
        : "#ef4444";
  const isLow = attendanceRate < 90 && stats?.total > 3;
  const isCritical = attendanceRate < 75 && stats?.total > 3;
  const ui = dark
    ? {
        pageBg: "#111318",
        cardBg: "#171a21",
        cardBorder: "#2a2f3a",
        text: "#e5e7eb",
        textMuted: "#94a3b8",
        textSoft: "#73829a",
        divider: "#2a2f3a",
        trail: "#242b37",
        avatarBg: "#1e293b",
      }
    : {
        pageBg: "#f8fafc",
        cardBg: "#ffffff",
        cardBorder: "#ffffff",
        text: "#111827",
        textMuted: "#9ca3af",
        textSoft: "#d1d5db",
        divider: "#f8fafc",
        trail: "#f1f5f9",
        avatarBg: "#e0e7ff",
      };

  return (
    <div
      className={`emp-attendance-page min-h-screen p-6${dark ? " dark" : ""}`}
      style={{ fontFamily: "'DM Sans', sans-serif", background: ui.pageBg }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .emp-attendance-page.dark .ant-select-selector {
          background: #141821 !important;
          border-color: #2a2f3a !important;
          color: #e5e7eb !important;
        }
        .emp-attendance-page.dark .ant-select-arrow {
          color: #94a3b8 !important;
        }
        .emp-attendance-page.dark .ant-progress-inner {
          background: #242b37 !important;
        }
        .emp-attendance-page.dark .ant-empty-description {
          color: #94a3b8 !important;
        }
        .emp-attendance-page.dark .ant-alert {
          background: #1a1f2b !important;
          border-color: #334155 !important;
          color: #e5e7eb !important;
        }
      `}</style>

      {loading && !stats ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* ── Low Attendance Warning ──────────────────────────────── */}
          {isLow && (
            <Alert
              className="mb-5 rounded-2xl border-0"
              type={isCritical ? "error" : "warning"}
              icon={isCritical ? <FireOutlined /> : <WarningOutlined />}
              showIcon
              message={
                <span className="font-semibold">
                  {isCritical
                    ? "Your attendance is critically low"
                    : "Your attendance is below the required threshold"}
                </span>
              }
              description={
                isCritical
                  ? `Your attendance is at ${attendanceRate}% for ${monthLabel}. The minimum required is 90%. Please contact HR immediately to discuss your attendance.`
                  : `Your attendance is at ${attendanceRate}% for ${monthLabel}. You need at least 90% to meet the company requirement. Please make sure to log in consistently.`
              }
            />
          )}

          {/* ── Employee Header ─────────────────────────────────────── */}
          <Card
            className="rounded-2xl border-0 shadow-sm mb-5"
            style={{ background: ui.cardBg, border: `1px solid ${ui.cardBorder}` }}
            bodyStyle={{ padding: "24px 28px" }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={employee?.user_photo || employee?.user_photo}
                  icon={<UserOutlined />}
                  size={64}
                  style={{
                    background: ui.avatarBg,
                    color: "#6366f1",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <h1 className="text-xl font-bold m-0" style={{ color: ui.text }}>
                    {employee?.full_name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm" style={{ color: ui.textMuted }}>
                      {employee?.job_title || employee?.role}
                    </span>
                    {employee?.department && (
                      <>
                        <span style={{ color: ui.textSoft }}>·</span>
                        <span className="text-sm" style={{ color: ui.textMuted }}>
                          {employee.department}
                        </span>
                      </>
                    )}
                    {employee?.email && (
                      <>
                        <span style={{ color: ui.textSoft }}>·</span>
                        <span className="text-sm" style={{ color: ui.textMuted }}>
                          {employee.email}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Tag
                      className="rounded-full text-xs font-semibold"
                      style={{
                        background: dark ? rateColor + "26" : rateColor + "15",
                        color: rateColor,
                        border: `1px solid ${dark ? rateColor + "66" : "transparent"}`,
                        paddingInline: 10,
                        height: 24,
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                    >
                      {attendanceRate}% attendance
                    </Tag>
                    {stats?.streak > 1 && (
                      <Tag
                        className="rounded-full text-xs font-semibold"
                        style={{
                          background: dark ? "rgba(245,158,11,0.20)" : "#fef3c7",
                          color: dark ? "#fbbf24" : "#d97706",
                          border: `1px solid ${dark ? "rgba(245,158,11,0.4)" : "transparent"}`,
                          paddingInline: 10,
                          height: 24,
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        🔥 {stats.streak} day streak
                      </Tag>
                    )}
                    {isCritical && (
                      <Tag
                        className="rounded-full text-xs font-semibold"
                        style={{
                          background: dark ? "rgba(239,68,68,0.20)" : "#fee2e2",
                          color: dark ? "#fca5a5" : "#dc2626",
                          border: `1px solid ${dark ? "rgba(239,68,68,0.45)" : "transparent"}`,
                          paddingInline: 10,
                          height: 24,
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        Critical
                      </Tag>
                    )}
                  </div>
                </div>
              </div>

              <Select
                value={yearMonth}
                onChange={setYearMonth}
                options={getMonthOptions()}
                size="middle"
                style={{ width: 160 }}
              />
            </div>

            {/* Attendance progress bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: ui.textMuted }}>
                <span>
                  {monthLabel} · {workingDays.length} working days
                </span>
                <span style={{ color: rateColor, fontWeight: 600 }}>
                  {attendanceRate}%
                </span>
              </div>
              <Progress
                percent={attendanceRate}
                strokeColor={rateColor}
                trailColor={ui.trail}
                showInfo={false}
                strokeLinecap="round"
              />
              {/* threshold line marker */}
              <div className="flex justify-between text-xs mt-1">
                <span style={{ color: ui.textSoft }}>0%</span>
                <span className="text-amber-400 font-medium">90% required</span>
                <span style={{ color: ui.textSoft }}>100%</span>
              </div>
            </div>
          </Card>

          {/* ── Stats Grid ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            <StatBox
              icon={<CalendarOutlined />}
              label="Working Days"
              value={workingDays.length}
              color="#6366f1"
              bg={dark ? "rgba(99,102,241,0.14)" : "#eef2ff"}
              borderColor={dark ? "rgba(99,102,241,0.3)" : "transparent"}
              tip="Total working days this month (excl. Sundays)"
            />
            <StatBox
              icon={<CheckCircleOutlined />}
              label="Present"
              value={stats?.present ?? "—"}
              color="#10b981"
              bg={dark ? "rgba(16,185,129,0.14)" : "#d1fae5"}
              borderColor={dark ? "rgba(16,185,129,0.3)" : "transparent"}
              tip="Days marked present"
            />
            <StatBox
              icon={<CloseCircleOutlined />}
              label="Absent"
              value={stats?.absent ?? "—"}
              color="#ef4444"
              bg={dark ? "rgba(239,68,68,0.16)" : "#fee2e2"}
              borderColor={dark ? "rgba(239,68,68,0.3)" : "transparent"}
              tip="Days marked absent"
            />
            <StatBox
              icon={<CalendarOutlined />}
              label="Leave"
              value={stats?.leave ?? "—"}
              color="#f59e0b"
              bg={dark ? "rgba(245,158,11,0.16)" : "#fef3c7"}
              borderColor={dark ? "rgba(245,158,11,0.3)" : "transparent"}
              tip="Days on leave"
            />
            <StatBox
              icon={<QuestionCircleOutlined />}
              label="Not Logged"
              value={stats?.notLogged ?? "—"}
              color="#94a3b8"
              bg={dark ? "rgba(148,163,184,0.16)" : "#f1f5f9"}
              borderColor={dark ? "rgba(148,163,184,0.3)" : "transparent"}
              tip="Days with no session recorded"
            />
            <StatBox
              icon={<ClockCircleOutlined />}
              label="Hours Worked"
              value={stats ? fmtHours(stats.totalHoursWorked) : "—"}
              color="#3b82f6"
              bg={dark ? "rgba(59,130,246,0.16)" : "#eff6ff"}
              borderColor={dark ? "rgba(59,130,246,0.3)" : "transparent"}
              tip="Total hours across completed sessions"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── Calendar ──────────────────────────────────────────── */}
            <div className="lg:col-span-2">
              <Card
                className="rounded-2xl border-0 shadow-sm h-full"
                style={{ background: ui.cardBg, border: `1px solid ${ui.cardBorder}` }}
                bodyStyle={{ padding: "24px" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold m-0 text-sm" style={{ color: ui.text }}>
                    Monthly Overview
                  </h3>
                  <span className="text-xs" style={{ color: ui.textMuted }}>
                    {monthLabel}
                  </span>
                </div>
                {stats ? (
                  <CalendarHeatmap
                    yearMonth={yearMonth}
                    dailyRecords={stats.dailyRecords}
                    workingDays={workingDays}
                    dark={dark}
                  />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </div>

            {/* ── Recent Sessions ───────────────────────────────────── */}
            <div>
              <Card
                className="rounded-2xl border-0 shadow-sm"
                style={{ background: ui.cardBg, border: `1px solid ${ui.cardBorder}` }}
                bodyStyle={{ padding: "24px" }}
              >
                <h3 className="font-semibold m-0 text-sm mb-4" style={{ color: ui.text }}>
                  Recent Sessions
                </h3>
                {timeLogs.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No sessions"
                  />
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {timeLogs.slice(0, 20).map((l) => {
                      const h = parseFloat(l.total_hours) || 0;
                      const statusColor =
                        l.status === "completed"
                          ? "#10b981"
                          : l.status === "active"
                            ? "#6366f1"
                            : "#f59e0b";
                      return (
                        <div
                          key={l.date + l.status}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                          style={{ borderColor: ui.divider }}
                        >
                          <div>
                            <div className="text-sm font-medium" style={{ color: ui.text }}>
                              {dayjs(l.date).format("DD MMM")}
                            </div>
                            <div className="text-xs" style={{ color: ui.textMuted }}>
                              {l.start_time
                                ? dayjs(l.start_time).format("hh:mm A")
                                : "—"}
                              {" → "}
                              {l.end_time
                                ? dayjs(l.end_time).format("hh:mm A")
                                : l.status === "active"
                                  ? "ongoing"
                                  : "—"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className="text-sm font-bold"
                              style={{
                                color: statusColor,
                                fontFamily: "'DM Mono', monospace",
                              }}
                            >
                              {h.toFixed(1)}h
                            </div>
                            <div
                              className="text-xs font-medium capitalize"
                              style={{ color: statusColor }}
                            >
                              {l.status}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
