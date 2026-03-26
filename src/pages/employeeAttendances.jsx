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

// ── Calendar ──────────────────────────────────────────────────────────────────
const CalendarHeatmap = ({ yearMonth, dailyRecords, workingDays }) => {
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
      textColor = "#cbd5e1";
    if (isSunday) {
      bg = "#f8fafc";
      textColor = "#e2e8f0";
    } else if (rec) {
      bg = colorMap[rec] + "25";
      textColor = colorMap[rec];
    } else if (isPast) {
      bg = "#f1f5f9";
      textColor = "#94a3b8";
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
              : "1px solid transparent",
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
            style={{ fontSize: 10, color: i === 0 ? "#fca5a5" : "#cbd5e1" }}
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
            <span className="text-xs text-gray-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Stat Box ──────────────────────────────────────────────────────────────────
const StatBox = ({ icon, label, value, color, bg, tip }) => (
  <Tooltip title={tip}>
    <div className="rounded-2xl p-4 cursor-default" style={{ background: bg }}>
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

  return (
    <div
      className="min-h-screen bg-slate-50 p-6"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

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
            bodyStyle={{ padding: "24px 28px" }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar
                  src={employee?.user_photo || employee?.user_photo}
                  icon={<UserOutlined />}
                  size={64}
                  style={{
                    background: "#e0e7ff",
                    color: "#6366f1",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 m-0">
                    {employee?.full_name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm text-gray-400">
                      {employee?.job_title || employee?.role}
                    </span>
                    {employee?.department && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-sm text-gray-400">
                          {employee.department}
                        </span>
                      </>
                    )}
                    {employee?.email && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-sm text-gray-400">
                          {employee.email}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Tag
                      className="rounded-full text-xs font-semibold border-0"
                      style={{
                        background: rateColor + "15",
                        color: rateColor,
                      }}
                    >
                      {attendanceRate}% attendance
                    </Tag>
                    {stats?.streak > 1 && (
                      <Tag
                        className="rounded-full text-xs font-semibold border-0"
                        style={{ background: "#fef3c7", color: "#d97706" }}
                      >
                        🔥 {stats.streak} day streak
                      </Tag>
                    )}
                    {isCritical && (
                      <Tag
                        className="rounded-full text-xs font-semibold border-0"
                        style={{ background: "#fee2e2", color: "#dc2626" }}
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
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
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
                trailColor="#f1f5f9"
                showInfo={false}
                strokeLinecap="round"
              />
              {/* threshold line marker */}
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-300">0%</span>
                <span className="text-amber-400 font-medium">90% required</span>
                <span className="text-gray-300">100%</span>
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
              bg="#eef2ff"
              tip="Total working days this month (excl. Sundays)"
            />
            <StatBox
              icon={<CheckCircleOutlined />}
              label="Present"
              value={stats?.present ?? "—"}
              color="#10b981"
              bg="#d1fae5"
              tip="Days marked present"
            />
            <StatBox
              icon={<CloseCircleOutlined />}
              label="Absent"
              value={stats?.absent ?? "—"}
              color="#ef4444"
              bg="#fee2e2"
              tip="Days marked absent"
            />
            <StatBox
              icon={<CalendarOutlined />}
              label="Leave"
              value={stats?.leave ?? "—"}
              color="#f59e0b"
              bg="#fef3c7"
              tip="Days on leave"
            />
            <StatBox
              icon={<QuestionCircleOutlined />}
              label="Not Logged"
              value={stats?.notLogged ?? "—"}
              color="#94a3b8"
              bg="#f1f5f9"
              tip="Days with no session recorded"
            />
            <StatBox
              icon={<ClockCircleOutlined />}
              label="Hours Worked"
              value={stats ? fmtHours(stats.totalHoursWorked) : "—"}
              color="#3b82f6"
              bg="#eff6ff"
              tip="Total hours across completed sessions"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── Calendar ──────────────────────────────────────────── */}
            <div className="lg:col-span-2">
              <Card
                className="rounded-2xl border-0 shadow-sm h-full"
                bodyStyle={{ padding: "24px" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-gray-800 m-0 text-sm">
                    Monthly Overview
                  </h3>
                  <span className="text-xs text-gray-400">{monthLabel}</span>
                </div>
                {stats ? (
                  <CalendarHeatmap
                    yearMonth={yearMonth}
                    dailyRecords={stats.dailyRecords}
                    workingDays={workingDays}
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
                bodyStyle={{ padding: "24px" }}
              >
                <h3 className="font-semibold text-gray-800 m-0 text-sm mb-4">
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
                          className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              {dayjs(l.date).format("DD MMM")}
                            </div>
                            <div className="text-xs text-gray-400">
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
