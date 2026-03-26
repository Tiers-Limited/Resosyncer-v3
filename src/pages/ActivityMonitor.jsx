import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  DatePicker,
  Avatar,
  Tooltip,
  Progress,
  Drawer,
  Image,
  Dropdown,
  message,
  Empty,
} from "antd";
import {
  Clock,
  Activity,
  Users,
  CheckCheck,
  Pause,
  CalendarDays,
  UserX,
  RefreshCw,
  Camera,
  ChevronDown,
  Check,
  LayoutGrid,
  User,
  PartyPopper,
  Timer,
  LogIn,
  LogOut,
  MessageSquare,
  Coffee,
  AlertTriangle,
  TrendingUp,
  Zap,
} from "lucide-react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { supabase } from "../lib/supabase";

dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(isSameOrAfter);

/* ── Fonts ──────────────────────────────────────────────────────────────── */
if (!document.getElementById("ets-fonts")) {
  const l = document.createElement("link");
  l.id = "ets-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
}

/* ── CSS ────────────────────────────────────────────────────────────────── */
if (!document.getElementById("ets-css")) {
  const s = document.createElement("style");
  s.id = "ets-css";
  s.textContent = `
    @keyframes etsFadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
    @keyframes etsPulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes etsSpin    { to{transform:rotate(360deg)} }
    @keyframes etsShimmer { 0%{background-position:-700px 0} 100%{background-position:700px 0} }
    @keyframes etsFadeIn  { from{opacity:0} to{opacity:1} }

    .ets-fade   { animation: etsFadeUp 0.32s ease both; }
    .ets-fadein { animation: etsFadeIn 0.28s ease both; }
    .ets-spin   { animation: etsSpin 1.8s linear infinite; }
    .ets-live   { animation: etsPulse 1.8s ease-in-out infinite; }

    .ets-row:hover td { background: var(--ets-hover) !important; }
    .ets-row-dim { opacity: 0.4; }

    .ets-kpi:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06) !important; border-color: var(--ets-border-strong) !important; }
    .ets-kpi { transition: box-shadow 0.15s, border-color 0.15s; }

    .ets-att-btn { transition: background 0.12s; }
    .ets-att-btn:hover { background: var(--ets-hover) !important; }

    .ets-shot-btn { transition: background 0.12s; border-radius: 6px; }
    .ets-shot-btn:hover { background: var(--ets-hover) !important; }

    .ets-skel {
      background: linear-gradient(90deg,
        var(--ets-skel-base) 25%,
        var(--ets-skel-shine) 50%,
        var(--ets-skel-base) 75%
      );
      background-size: 700px 100%;
      animation: etsShimmer 1.5s ease-in-out infinite;
      border-radius: 5px;
      flex-shrink: 0;
    }

    .ets-table .ant-table-thead > tr > th {
      background: var(--ets-thead) !important;
      color: var(--ets-muted) !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      border-bottom: 1px solid var(--ets-border) !important;
      padding: 10px 14px !important;
      font-family: 'DM Sans', sans-serif !important;
    }
    .ets-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid var(--ets-border) !important;
      padding: 13px 14px !important;
      vertical-align: middle !important;
      background: var(--ets-card) !important;
    }
    .ets-table .ant-table { background: var(--ets-card) !important; }
    .ets-table .ant-pagination { padding: 12px 20px !important; margin: 0 !important; }
  `;
  document.head.appendChild(s);
}

const DEFAULT_WS = {
  tenant_id: "",
  working_model: "fixed",
  week_off_days: ["Saturday", "Sunday"],
  working_hours: 8,
  check_in_time: "09:00",
  check_out_time: "18:00",
  late_grace_minutes: 15,
  overtime_enabled: true,
  half_day_hours: 4,
};

/* ── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (s) => {
  if (!s) return "0m";
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
const fmtH = (ts) => (ts ? dayjs(ts).format("h:mm A") : "—");
const dayRange = (d) => ({
  from: dayjs(d).startOf("day").toISOString(),
  to: dayjs(d).endOf("day").toISOString(),
});
const breakSecs = (log, now) => {
  if (!log?.breaks?.length) return 0;
  return log.breaks.reduce((acc, b) => {
    const st = b.pause_time ? dayjs(b.pause_time) : null;
    const en = b.resume_time
      ? dayjs(b.resume_time)
      : log.status === "break"
        ? now
        : null;
    if (!st || !en) return acc;
    return acc + Math.max(0, en.diff(st, "second"));
  }, 0);
};
const netSecs = (log, now) => {
  if (!log) return 0;
  if ((log.status === "active" || log.status === "break") && log.start_time)
    return Math.max(
      0,
      now.diff(dayjs(log.start_time), "second") - breakSecs(log, now),
    );
  return (parseFloat(log.total_hours) || 0) * 3600;
};

/**
 * Get effective working hours for an employee:
 * use employee-level working_hours if set, else fall back to workspace default
 */
const getEffectiveWorkingHours = (employeeProfile, ws) => {
  const empHours = parseFloat(employeeProfile?.working_hours);
  if (!isNaN(empHours) && empHours > 0) return empHours;
  return parseFloat(ws?.working_hours) || 8;
};

/**
 * Overtime seconds for an employee (only if overtime_enabled in ws)
 */
const overtimeSecs = (log, now, effectiveHours, ws) => {
  if (!ws?.overtime_enabled) return 0;
  const worked = netSecs(log, now);
  const target = effectiveHours * 3600;
  return Math.max(0, worked - target);
};

const autoAtt = (log, now, ws, effectiveHours) => {
  if (!log) return "absent";
  if (log.status === "active") return "working";
  if (log.status === "break") return "paused";
  const hours = netSecs(log, now) / 3600;
  const target = effectiveHours || parseFloat(ws?.working_hours) || 8;
  const half = parseFloat(ws?.half_day_hours) || 4;
  if (hours >= target) return "present";
  if (hours >= half) return "present"; // half day still counts as present
  return "absent";
};

/**
 * Late check — only applies to fixed model
 */
const isLate = (log, ws) => {
  if (!log?.start_time || !ws) return false;
  if (ws.working_model === "flexible") return false;
  const checkIn = ws.check_in_time || "09:00";
  const grace = ws.late_grace_minutes || 15;
  const [h, m] = checkIn.split(":").map(Number);
  const logDate = dayjs(log.date || log.start_time).format("YYYY-MM-DD");
  const deadline = dayjs(logDate)
    .hour(h)
    .minute(m)
    .second(0)
    .add(grace, "minute");
  return dayjs(log.start_time).isAfter(deadline);
};

const isWeekOff = (dateStr, ws) => {
  if (!ws?.week_off_days?.length) return false;
  const dayName = dayjs(dateStr).format("dddd");
  return ws.week_off_days.includes(dayName);
};

const isDarkMode = () => {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--d-card")
    .trim();
  return v.startsWith("#1") || v.startsWith("#0");
};

/* ── Config maps ────────────────────────────────────────────────────────── */
const ATT = {
  working: {
    label: "Working",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    dot: "#3b82f6",
  },
  paused: {
    label: "Paused",
    color: "#6d28d9",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    dot: "#8b5cf6",
  },
  present: {
    label: "Present",
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    dot: "#22c55e",
  },
  absent: {
    label: "Absent",
    color: "#b91c1c",
    bg: "#fef2f2",
    border: "#fecaca",
    dot: "#ef4444",
  },
  leave: {
    label: "On Leave",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fed7aa",
    dot: "#f59e0b",
  },
};
const STATUS = {
  active: {
    label: "Active",
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  break: {
    label: "On Break",
    color: "#6d28d9",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  completed: {
    label: "Done",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
  },
};
const APP_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#6366f1",
];

/* ── Skeleton primitives ────────────────────────────────────────────────── */
const Skel = ({ w = "100%", h = 14, radius = 5, style = {} }) => (
  <div
    className="ets-skel"
    style={{ width: w, height: h, borderRadius: radius, ...style }}
  />
);

const KpiSkeletons = ({ count = 8 }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${count},1fr)`,
      gap: 10,
      marginBottom: 20,
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          background: "var(--ets-card)",
          border: "1px solid var(--ets-border)",
          borderRadius: 12,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Skel w={32} h={32} radius={8} />
        </div>
        <Skel w="48%" h={26} radius={5} style={{ marginBottom: 7 }} />
        <Skel w="70%" h={11} radius={4} />
      </div>
    ))}
  </div>
);

const TableSkeletons = ({ count = 8 }) => (
  <div
    style={{
      background: "var(--ets-card)",
      border: "1px solid var(--ets-border)",
      borderRadius: 12,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "220px 115px 135px 95px 105px 150px 130px 220px 85px 200px",
        padding: "10px 14px",
        borderBottom: "1px solid var(--ets-border)",
        background: "var(--ets-thead)",
      }}
    >
      {[
        "Employee",
        "Status",
        "Attendance",
        "Start",
        "End",
        "Net Hours",
        "Overtime",
        "App Activity",
        "Shots",
        "Standup",
      ].map((col, i) => (
        <div key={i} style={{ padding: "0 6px" }}>
          <Skel w={Math.min(col.length * 7, 88)} h={11} radius={4} />
        </div>
      ))}
    </div>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          display: "grid",
          gridTemplateColumns:
            "220px 115px 135px 95px 105px 150px 130px 220px 85px 200px",
          padding: "13px 14px",
          borderBottom: i < count - 1 ? "1px solid var(--ets-border)" : "none",
          opacity: i > 5 ? Math.max(0.3, 1 - (i - 5) * 0.15) : 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 6px",
          }}
        >
          <Skel w={36} h={36} radius={99} />
          <div>
            <Skel w={90} h={13} radius={4} style={{ marginBottom: 6 }} />
            <Skel w={65} h={10} radius={4} />
          </div>
        </div>
        {[72, 82, 55, 55].map((w, j) => (
          <div
            key={j}
            style={{ padding: "0 6px", display: "flex", alignItems: "center" }}
          >
            <Skel w={w} h={j < 2 ? 22 : 13} radius={j < 2 ? 99 : 4} />
          </div>
        ))}
        <div
          style={{
            padding: "0 6px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Skel w={38} h={13} radius={4} />
            <Skel w={22} h={11} radius={4} />
          </div>
          <Skel w="100%" h={4} radius={99} />
        </div>
        <div
          style={{ padding: "0 6px", display: "flex", alignItems: "center" }}
        >
          <Skel w={60} h={20} radius={6} />
        </div>
        <div
          style={{
            padding: "0 6px",
            display: "flex",
            flexDirection: "column",
            gap: 5,
            justifyContent: "center",
          }}
        >
          {[85, 65, 50].map((w, j) => (
            <div
              key={j}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <Skel w={6} h={6} radius={99} />
              <Skel w={w} h={10} radius={4} />
              <Skel w={28} h={15} radius={4} style={{ marginLeft: "auto" }} />
            </div>
          ))}
        </div>
        <div
          style={{ padding: "0 6px", display: "flex", alignItems: "center" }}
        >
          <Skel w={38} h={20} radius={6} />
        </div>
        <div
          style={{
            padding: "0 6px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Skel w="88%" h={10} radius={4} />
          <Skel w="60%" h={10} radius={4} />
        </div>
      </div>
    ))}
  </div>
);

/* ── Holiday Screen ─────────────────────────────────────────────────────── */
const HolidayScreen = ({ holiday, date }) => {
  const isToday = date === dayjs().format("YYYY-MM-DD");
  return (
    <div className="ets-fadein" style={{ margin: "0 28px 28px" }}>
      <div
        style={{
          background: "var(--ets-card)",
          border: "1px solid var(--ets-border)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "#f59e0b" }} />
        <div
          style={{
            padding: "52px 40px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#fffbeb",
              border: "1px solid #fde68a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <PartyPopper size={28} color="#d97706" strokeWidth={1.6} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#d97706",
              fontFamily: "'DM Sans',sans-serif",
              marginBottom: 10,
              display: "block",
            }}
          >
            {isToday ? "Public Holiday — Today" : "Public Holiday"}
          </span>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--ets-text)",
              fontFamily: "'DM Sans',sans-serif",
              letterSpacing: "-0.025em",
            }}
          >
            {holiday.name}
          </h2>
          <p
            style={{
              margin: "0 0 32px",
              fontSize: 13,
              color: "var(--ets-muted)",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {dayjs(date).format("dddd, MMMM D, YYYY")}
          </p>
          <div
            style={{
              width: 40,
              height: 1,
              background: "var(--ets-border)",
              marginBottom: 28,
            }}
          />
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {[
              {
                icon: <PartyPopper size={13} />,
                text: "Day off for all employees",
              },
              {
                icon: <Timer size={13} />,
                text: isToday
                  ? "Tracking paused today"
                  : "No tracking on this date",
              },
              { icon: <CalendarDays size={13} />, text: "Holiday pay applies" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 13px",
                  borderRadius: 8,
                  background: "var(--ets-hover)",
                  border: "1px solid var(--ets-border)",
                }}
              >
                <span style={{ color: "var(--ets-muted)", display: "flex" }}>
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--ets-sub)",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Week Off Screen ────────────────────────────────────────────────────── */
const WeekOffScreen = ({ date, dayName }) => {
  const isToday = date === dayjs().format("YYYY-MM-DD");
  return (
    <div className="ets-fadein" style={{ margin: "0 28px 28px" }}>
      <div
        style={{
          background: "var(--ets-card)",
          border: "1px solid var(--ets-border)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "#8b5cf6" }} />
        <div
          style={{
            padding: "52px 40px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#f5f3ff",
              border: "1px solid #ddd6fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Coffee size={28} color="#6d28d9" strokeWidth={1.6} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#6d28d9",
              fontFamily: "'DM Sans',sans-serif",
              marginBottom: 10,
              display: "block",
            }}
          >
            {isToday ? "Weekly Off — Today" : "Weekly Off Day"}
          </span>
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 26,
              fontWeight: 800,
              color: "var(--ets-text)",
              fontFamily: "'DM Sans',sans-serif",
              letterSpacing: "-0.025em",
            }}
          >
            {dayName}
          </h2>
          <p
            style={{
              margin: "0 0 32px",
              fontSize: 13,
              color: "var(--ets-muted)",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {dayjs(date).format("dddd, MMMM D, YYYY")}
          </p>
          <div
            style={{
              width: 40,
              height: 1,
              background: "var(--ets-border)",
              marginBottom: 28,
            }}
          />
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {[
              { icon: <Coffee size={13} />, text: "Scheduled weekly off" },
              {
                icon: <Timer size={13} />,
                text: isToday
                  ? "No tracking today"
                  : "No tracking on this date",
              },
              { icon: <CalendarDays size={13} />, text: "Regular day off" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 13px",
                  borderRadius: 8,
                  background: "var(--ets-hover)",
                  border: "1px solid var(--ets-border)",
                }}
              >
                <span style={{ color: "var(--ets-muted)", display: "flex" }}>
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--ets-sub)",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Attendance Dropdown ─────────────────────────────────────────────────── */
const AttCell = ({ value, onChange, disabled }) => {
  const cfg = ATT[value] || ATT.absent;
  const items = ["present", "absent", "leave"].map((k) => ({
    key: k,
    label: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "2px 0",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: ATT[k].dot,
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{ATT[k].label}</span>
        {k === value && (
          <Check size={11} style={{ marginLeft: "auto", color: ATT[k].dot }} />
        )}
      </div>
    ),
  }));
  return (
    <Dropdown
      menu={{ items, onClick: ({ key }) => !disabled && onChange(key) }}
      trigger={["click"]}
      disabled={disabled}
    >
      <button
        className="ets-att-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 9px",
          borderRadius: 6,
          background: cfg.bg,
          color: cfg.color,
          border: `1px solid ${cfg.border}`,
          fontSize: 11,
          fontWeight: 600,
          cursor: disabled ? "default" : "pointer",
          fontFamily: "'DM Sans',sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: cfg.dot,
            display: "inline-block",
            ...(value === "working"
              ? { animation: "etsPulse 1.8s ease-in-out infinite" }
              : {}),
          }}
        />
        {cfg.label}
        {!disabled && <ChevronDown size={11} style={{ opacity: 0.5 }} />}
      </button>
    </Dropdown>
  );
};

/* ── Hours Cell — per-employee effective hours + overtime ────────────────── */
const HoursCell = ({ log, effectiveHours, ws }) => {
  const targetHours = effectiveHours || 8;
  const overtimeEnabled = ws?.overtime_enabled ?? true;
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    if (log?.status !== "active" && log?.status !== "break") return;
    const t = setInterval(() => setNow(dayjs()), 30_000);
    return () => clearInterval(t);
  }, [log?.status]);

  if (!log)
    return <span style={{ color: "var(--ets-muted)", fontSize: 12 }}>—</span>;

  const workedSecs = netSecs(log, now);
  const h = workedSecs / 3600;
  const pct = Math.min((h / targetHours) * 100, 100);
  const bm = Math.round(breakSecs(log, now) / 60);
  const isLive = log.status === "active" || log.status === "break";
  const otSecs = overtimeEnabled
    ? Math.max(0, workedSecs - targetHours * 3600)
    : 0;

  const color =
    log.status === "break"
      ? "#8b5cf6"
      : pct >= 100
        ? "#22c55e"
        : pct >= 50
          ? "#3b82f6"
          : "#f59e0b";

  return (
    <div style={{ minWidth: 130 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 5,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ets-text)",
          }}
        >
          {h.toFixed(1)}h
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {isLive && (
            <span
              className="ets-live"
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: color,
                display: "inline-block",
              }}
            />
          )}
          <span
            style={{
              fontSize: 10,
              color: "var(--ets-muted)",
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            /{targetHours}h
          </span>
        </div>
      </div>
      <div
        style={{
          height: 3,
          borderRadius: 99,
          background: "var(--ets-border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 99,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 4,
          flexWrap: "wrap",
        }}
      >
        {bm > 0 && (
          <div
            style={{
              fontSize: 10,
              color: "#8b5cf6",
              fontFamily: "'DM Sans',sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Pause size={9} /> {bm}m break
          </div>
        )}
        {overtimeEnabled && otSecs > 0 && (
          <div
            style={{
              fontSize: 10,
              color: "#059669",
              fontFamily: "'DM Sans',sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 3,
              background: "#d1fae5",
              padding: "1px 5px",
              borderRadius: 4,
              border: "1px solid #6ee7b7",
            }}
          >
            <Zap size={9} /> +{fmt(otSecs)} OT
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Overtime Cell (standalone column) ─────────────────────────────────── */
const OvertimeCell = ({ log, effectiveHours, ws }) => {
  const [now, setNow] = useState(dayjs());
  useEffect(() => {
    if (log?.status !== "active" && log?.status !== "break") return;
    const t = setInterval(() => setNow(dayjs()), 30_000);
    return () => clearInterval(t);
  }, [log?.status]);

  if (!log || !ws?.overtime_enabled)
    return <span style={{ color: "var(--ets-muted)", fontSize: 12 }}>—</span>;

  const otSecs = overtimeSecs(log, now, effectiveHours, ws);
  if (otSecs <= 0)
    return (
      <span
        style={{
          color: "var(--ets-muted)",
          fontSize: 12,
          fontFamily: "'JetBrains Mono',monospace",
        }}
      >
        —
      </span>
    );

  const isLive = log.status === "active";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "#d1fae5",
          border: "1px solid #6ee7b7",
          padding: "3px 8px",
          borderRadius: 6,
        }}
      >
        <Zap size={11} color="#059669" />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#059669",
            fontFamily: "'JetBrains Mono',monospace",
          }}
        >
          {fmt(otSecs)}
        </span>
        {isLive && (
          <span
            className="ets-live"
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#059669",
              display: "inline-block",
            }}
          />
        )}
      </div>
    </div>
  );
};

/* ── App Mini ───────────────────────────────────────────────────────────── */
const AppMini = ({ apps, onViewAll }) => {
  if (!apps?.length)
    return (
      <span
        style={{
          fontSize: 11,
          color: "var(--ets-muted)",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        —
      </span>
    );
  const sorted = [...apps].sort(
    (a, b) => b.duration_seconds - a.duration_seconds,
  );
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 150,
      }}
    >
      {sorted.slice(0, 3).map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: APP_COLORS[i % APP_COLORS.length],
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: "var(--ets-sub)",
              fontFamily: "'DM Sans',sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              maxWidth: 88,
            }}
          >
            {a.app_name}
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono',monospace",
              fontWeight: 600,
              color: APP_COLORS[i % APP_COLORS.length],
              background: APP_COLORS[i % APP_COLORS.length] + "18",
              padding: "1px 5px",
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            {fmt(a.duration_seconds)}
          </span>
        </div>
      ))}
      {sorted.length > 3 && (
        <button
          onClick={onViewAll}
          style={{
            fontSize: 10,
            color: "var(--ets-accent)",
            fontWeight: 700,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            textAlign: "left",
            fontFamily: "'DM Sans',sans-serif",
            marginTop: 1,
          }}
        >
          +{sorted.length - 3} more
        </button>
      )}
    </div>
  );
};

/* ── App Sidebar ────────────────────────────────────────────────────────── */
const AppSidebar = ({ apps, loading }) => {
  const sorted = [...(apps || [])].sort(
    (a, b) => b.duration_seconds - a.duration_seconds,
  );
  const total = sorted.reduce((s, a) => s + (a.duration_seconds || 0), 0);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          paddingBottom: 14,
          borderBottom: "1px solid var(--ets-border)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--ets-hover)",
            border: "1px solid var(--ets-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LayoutGrid size={15} color="var(--ets-accent)" />
        </div>
        <div>
          <div
            style={{ fontSize: 13, fontWeight: 700, color: "var(--ets-text)" }}
          >
            App Usage
          </div>
          <div style={{ fontSize: 11, color: "var(--ets-muted)" }}>
            {loading ? "Loading…" : `${fmt(total)} total`}
          </div>
        </div>
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Skel w={7} h={7} radius={99} />
                  <Skel w={80} h={12} radius={4} />
                </div>
                <Skel w={40} h={18} radius={4} />
              </div>
              <Skel w="100%" h={4} radius={99} />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Empty description="No app data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {sorted.map((a, i) => {
            const pct =
              total > 0 ? Math.round((a.duration_seconds / total) * 100) : 0;
            const color = APP_COLORS[i % APP_COLORS.length];
            return (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--ets-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 100,
                      }}
                    >
                      {a.app_name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "'JetBrains Mono',monospace",
                      fontWeight: 600,
                      background: color + "18",
                      color,
                      padding: "1px 6px",
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  >
                    {fmt(a.duration_seconds)}
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 99,
                    background: "var(--ets-border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: color,
                      borderRadius: 99,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontSize: 10,
                    color: "var(--ets-muted)",
                    marginTop: 2,
                  }}
                >
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Screenshots Drawer ─────────────────────────────────────────────────── */
const ShotsDrawer = ({ open, onClose, employee, date }) => {
  const [shots, setShots] = useState([]);
  const [apps, setApps] = useState([]);
  const [loadShots, setLoadShots] = useState(false);
  const [loadApps, setLoadApps] = useState(false);
  const ivRef = useRef(null);

  const fetchDrawer = useCallback(async () => {
    if (!employee?.id) return;
    const { from, to } = dayRange(date);
    setLoadShots(true);
    const { data: sd } = await supabase
      .from("screenshots")
      .select("*")
      .eq("employee_id", employee.id)
      .gte("taken_at", from)
      .lte("taken_at", to)
      .order("taken_at", { ascending: true });
    setShots(sd || []);
    setLoadShots(false);
    setLoadApps(true);
    const { data: ad } = await supabase
      .from("app_usage")
      .select("app_name,duration_seconds")
      .eq("employee_id", employee.id)
      .gte("recorded_at", from)
      .lte("recorded_at", to);
    const agg = {};
    (ad || []).forEach((a) => {
      agg[a.app_name] = (agg[a.app_name] || 0) + a.duration_seconds;
    });
    setApps(
      Object.entries(agg).map(([app_name, duration_seconds]) => ({
        app_name,
        duration_seconds,
      })),
    );
    setLoadApps(false);
  }, [employee?.id, date]);

  useEffect(() => {
    if (!open) {
      clearInterval(ivRef.current);
      setShots([]);
      setApps([]);
      return;
    }
    fetchDrawer();
    ivRef.current = setInterval(fetchDrawer, 30_000);
    return () => clearInterval(ivRef.current);
  }, [open, fetchDrawer]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={1060}
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingRight: 16,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar
              src={employee?.user_photo || employee?.profile_picture_url}
              icon={<User size={16} />}
              size={38}
              style={{
                background: "var(--ets-hover)",
                color: "var(--ets-accent)",
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--ets-text)",
                }}
              >
                {employee?.full_name}
              </div>
              <div style={{ fontSize: 11, color: "var(--ets-muted)" }}>
                {dayjs(date).format("DD MMM YYYY")} · {shots.length} screenshot
                {shots.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              color: "#15803d",
              background: "#f0fdf4",
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #bbf7d0",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            <RefreshCw size={11} className="ets-spin" /> Live
          </div>
        </div>
      }
      styles={{
        body: {
          padding: 0,
          background: "var(--ets-bg)",
          display: "flex",
          overflow: "hidden",
          height: "100%",
        },
        header: {
          background: "var(--ets-card)",
          borderBottom: "1px solid var(--ets-border)",
        },
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {loadShots && shots.length === 0 ? (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid var(--ets-border)",
                  background: "var(--ets-card)",
                }}
              >
                <Skel w="100%" h={165} radius={0} />
                <div
                  style={{
                    padding: "8px 12px",
                    borderTop: "1px solid var(--ets-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Skel w={10} h={10} radius={99} />
                  <Skel w={80} h={10} radius={4} />
                </div>
              </div>
            ))}
          </div>
        ) : shots.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 300,
            }}
          >
            <Empty description="No screenshots for this day" />
          </div>
        ) : (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            {shots.map((s) => (
              <div
                key={s.id}
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid var(--ets-border)",
                  background: "var(--ets-card)",
                }}
              >
                <Image
                  src={s.cloudinary_url}
                  alt="screenshot"
                  style={{
                    width: "100%",
                    height: 165,
                    objectFit: "cover",
                    display: "block",
                  }}
                  placeholder={
                    <div
                      style={{ height: 165, background: "var(--ets-hover)" }}
                    >
                      <Skel w="100%" h={165} radius={0} />
                    </div>
                  }
                />
                <div
                  style={{
                    padding: "7px 12px",
                    borderTop: "1px solid var(--ets-border)",
                    fontSize: 11,
                    color: "var(--ets-muted)",
                    fontFamily: "'JetBrains Mono',monospace",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Clock size={10} />
                  {dayjs(s.taken_at).format("h:mm:ss A")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        style={{
          width: 240,
          flexShrink: 0,
          borderLeft: "1px solid var(--ets-border)",
          background: "var(--ets-card)",
          padding: 16,
          overflowY: "auto",
        }}
      >
        <AppSidebar apps={apps} loading={loadApps && apps.length === 0} />
      </div>
    </Drawer>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function EmployeeTimingStats() {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [attOver, setAttOver] = useState({});
  const [drawer, setDrawer] = useState({ open: false, employee: null });
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [holidayLoading, setHolidayLoading] = useState(true);
  const [ws, setWs] = useState(DEFAULT_WS);
  const [wsLoading, setWsLoading] = useState(true);
  const ivRef = useRef(null);

  /* ── Theme ──────────────────────────────────────────────────────────── */
  const [dark, setDark] = useState(isDarkMode);
  useEffect(() => {
    const apply = (d) => {
      setDark(d);
      const r = document.documentElement;
      if (d) {
        r.style.setProperty("--ets-bg", "#070c16");
        r.style.setProperty("--ets-card", "#0d1422");
        r.style.setProperty("--ets-thead", "#0a1020");
        r.style.setProperty("--ets-border", "#18232f");
        r.style.setProperty("--ets-border-strong", "#27384a");
        r.style.setProperty("--ets-text", "#dde4f0");
        r.style.setProperty("--ets-sub", "#7a8fa8");
        r.style.setProperty("--ets-muted", "#374860");
        r.style.setProperty("--ets-hover", "#111c2a");
        r.style.setProperty("--ets-accent", "#60a5fa");
        r.style.setProperty("--ets-skel-base", "#111c2a");
        r.style.setProperty("--ets-skel-shine", "#172030");
      } else {
        r.style.setProperty("--ets-bg", "#f5f7fa");
        r.style.setProperty("--ets-card", "#ffffff");
        r.style.setProperty("--ets-thead", "#f9fafb");
        r.style.setProperty("--ets-border", "#e4e9f0");
        r.style.setProperty("--ets-border-strong", "#cbd5e1");
        r.style.setProperty("--ets-text", "#0d1626");
        r.style.setProperty("--ets-sub", "#475569");
        r.style.setProperty("--ets-muted", "#94a3b8");
        r.style.setProperty("--ets-hover", "#f1f4f8");
        r.style.setProperty("--ets-accent", "#1d4ed8");
        r.style.setProperty("--ets-skel-base", "#eaecf0");
        r.style.setProperty("--ets-skel-shine", "#f4f5f8");
      }
    };
    apply(isDarkMode());
    const iv = setInterval(() => apply(isDarkMode()), 500);
    return () => clearInterval(iv);
  }, []);

  /* ── Bootstrap ──────────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: p } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
        setTenantId(p?.tenant_id ?? null);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  /* ── Workspace settings ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!tenantId) return;
    setWsLoading(true);
    supabase
      .from("workspace_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle()
      .then(({ data }) => {
        setWs(data ? { ...DEFAULT_WS, ...data } : DEFAULT_WS);
        setWsLoading(false);
      });
  }, [tenantId]);

  /* ── Holiday lookup ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!tenantId) return;
    setHolidayLoading(true);
    setSelectedHoliday(null);
    supabase
      .from("public_holidays")
      .select("id,name,date")
      .eq("tenant_id", tenantId)
      .eq("date", date)
      .maybeSingle()
      .then(({ data }) => {
        setSelectedHoliday(data || null);
        setHolidayLoading(false);
      });
  }, [date, tenantId]);

  /* ── Main fetch — includes working_hours from profiles ──────────────── */
  const fetchData = useCallback(async (d, tid) => {
    if (!tid) return;
    setLoading(true);
    try {
      const { from, to } = dayRange(d);

      // Fetch profiles WITH working_hours so per-employee hours work
      const { data: profiles } = await supabase
        .from("profiles")
        .select(
          "id,full_name,email,job_title,department,profile_picture_url,user_photo,role,working_hours",
        )
        .eq("tenant_id", tid)
        .eq("suspended", false)
        .not(
          "role",
          "in",
          '("admin","project_manager","superadmin","super_admin")',
        )
        .order("full_name");

      if (!profiles?.length) {
        setRows([]);
        return;
      }
      const ids = profiles.map((p) => p.id);

      const [
        { data: logs },
        { data: appUsage },
        { data: shots },
        { data: attRows },
      ] = await Promise.all([
        supabase
          .from("time_logs")
          .select(
            "id,user_id,date,start_time,end_time,total_hours,status,standup_message,breaks",
          )
          .in("user_id", ids)
          .eq("date", d),
        supabase
          .from("app_usage")
          .select("employee_id,app_name,duration_seconds")
          .in("employee_id", ids)
          .gte("recorded_at", from)
          .lte("recorded_at", to),
        supabase
          .from("screenshots")
          .select("employee_id,id")
          .in("employee_id", ids)
          .gte("taken_at", from)
          .lte("taken_at", to),
        supabase
          .from("attendance")
          .select("user_id,status")
          .in("user_id", ids)
          .eq("date", d),
      ]);

      if (attRows?.length) {
        const m = {};
        attRows.forEach((o) => {
          m[o.user_id] = o.status;
        });
        setAttOver(m);
      }

      const logMap = {};
      (logs || []).forEach((l) => {
        logMap[l.user_id] = l;
      });
      const appMap = {};
      (appUsage || []).forEach((a) => {
        if (!appMap[a.employee_id]) appMap[a.employee_id] = {};
        appMap[a.employee_id][a.app_name] =
          (appMap[a.employee_id][a.app_name] || 0) + a.duration_seconds;
      });
      const shotCount = {};
      (shots || []).forEach((s) => {
        shotCount[s.employee_id] = (shotCount[s.employee_id] || 0) + 1;
      });

      const result = profiles.map((p) => {
        const log = logMap[p.id];
        const apps = Object.entries(appMap[p.id] || {}).map(
          ([app_name, duration_seconds]) => ({ app_name, duration_seconds }),
        );
        return {
          key: p.id,
          ...p,
          log,
          apps,
          screenshotCount: shotCount[p.id] || 0,
          hasLog: !!log,
        };
      });

      result.sort((a, b) => {
        if (a.hasLog && !b.hasLog) return -1;
        if (!a.hasLog && b.hasLog) return 1;
        return (b.log?.total_hours || 0) - (a.log?.total_hours || 0);
      });

      setRows(result);
      setLastSync(dayjs());
      setDrawer((prev) => {
        if (!prev.open || !prev.employee) return prev;
        const u = result.find((r) => r.id === prev.employee.id);
        return u ? { ...prev, employee: u } : prev;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    setAttOver({});
    clearInterval(ivRef.current);
    fetchData(date, tenantId);
    if (date === dayjs().format("YYYY-MM-DD"))
      ivRef.current = setInterval(() => fetchData(date, tenantId), 30_000);
    return () => clearInterval(ivRef.current);
  }, [date, tenantId, fetchData]);

  /* ── Attendance save ────────────────────────────────────────────────── */
  const handleAtt = useCallback(
    async (uid, status) => {
      setAttOver((prev) => ({ ...prev, [uid]: status }));
      const { error } = await supabase
        .from("attendance")
        .upsert({ user_id: uid, date, status }, { onConflict: "user_id,date" });
      if (error) {
        message.error("Failed: " + error.message);
        setAttOver((prev) => {
          const n = { ...prev };
          delete n[uid];
          return n;
        });
      } else {
        message.success(`Marked ${ATT[status].label}`);
      }
    },
    [date],
  );

  /* ── Derived values ─────────────────────────────────────────────────── */
  const now = dayjs();
  const isToday = date === dayjs().format("YYYY-MM-DD");
  const dateIsWeekOff = isWeekOff(date, ws);
  const isFixed = ws.working_model === "fixed";
  const isFlexible = ws.working_model === "flexible";

  const getEffHours = (r) => getEffectiveWorkingHours(r, ws);

  const getAtt = (r) => {
    if (r.log?.status === "active") return "working";
    if (r.log?.status === "break") return "paused";
    return attOver[r.id] || autoAtt(r.log, now, ws, getEffHours(r));
  };

  const lateCount = isFixed
    ? rows.filter((r) => r.hasLog && isLate(r.log, ws)).length
    : 0;

  // Total overtime across all employees
  const totalOtSecs = ws.overtime_enabled
    ? rows.reduce(
        (sum, r) => sum + overtimeSecs(r.log, now, getEffHours(r), ws),
        0,
      )
    : 0;

  /* ── KPIs — overtime KPI only shown if enabled ──────────────────────── */
  const KPIs = [
    {
      label: "Total Staff",
      value: rows.length,
      icon: <Users size={15} />,
      color: "#1d4ed8",
      bg: "#eff6ff",
    },
    {
      label: "Logged In",
      value: rows.filter((r) => r.hasLog).length,
      icon: <LogIn size={15} />,
      color: "#0369a1",
      bg: "#e0f2fe",
    },
    {
      label: "Working",
      value: rows.filter((r) => getAtt(r) === "working").length,
      icon: <Activity size={15} />,
      color: "#15803d",
      bg: "#f0fdf4",
    },
    {
      label: "On Break",
      value: rows.filter((r) => getAtt(r) === "paused").length,
      icon: <Pause size={15} />,
      color: "#6d28d9",
      bg: "#f5f3ff",
    },
    {
      label: "Present",
      value: rows.filter((r) => getAtt(r) === "present").length,
      icon: <CheckCheck size={15} />,
      color: "#166534",
      bg: "#dcfce7",
    },
    // Late KPI only relevant for fixed model
    ...(isFixed
      ? [
          {
            label: "Late",
            value: lateCount,
            icon: <AlertTriangle size={15} />,
            color: "#c2410c",
            bg: "#fff7ed",
          },
        ]
      : []),
    {
      label: "Absent",
      value: rows.filter((r) => getAtt(r) === "absent").length,
      icon: <UserX size={15} />,
      color: "#b91c1c",
      bg: "#fef2f2",
    },
    // Overtime KPI only shown if overtime_enabled
    ...(ws.overtime_enabled
      ? [
          {
            label: "Overtime",
            value: fmt(totalOtSecs),
            icon: <Zap size={15} />,
            color: "#059669",
            bg: "#d1fae5",
          },
        ]
      : []),
  ];

  /* ── Table columns ──────────────────────────────────────────────────── */
  const columns = [
    {
      title: "Employee",
      key: "emp",
      width: 215,
      fixed: "left",
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Avatar
              src={r.user_photo || r.profile_picture_url}
              icon={<User size={15} />}
              size={36}
              style={{
                background: "var(--ets-hover)",
                color: "var(--ets-accent)",
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 9,
                height: 9,
                borderRadius: "50%",
                background:
                  r.log?.status === "active"
                    ? "#22c55e"
                    : r.log?.status === "break"
                      ? "#8b5cf6"
                      : r.hasLog
                        ? "#94a3b8"
                        : "var(--ets-border)",
                border: "2px solid var(--ets-card)",
              }}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ets-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "'DM Sans',sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {r.full_name}
              {/* Late indicator — only for fixed model */}
              {isFixed && r.hasLog && isLate(r.log, ws) && (
                <Tooltip
                  title={`Late — grace period: ${ws.late_grace_minutes}min after ${ws.check_in_time}`}
                >
                  <AlertTriangle
                    size={11}
                    color="#c2410c"
                    style={{ flexShrink: 0 }}
                  />
                </Tooltip>
              )}
              {/* Custom hours badge — show if employee has own working_hours */}
              {r.working_hours &&
                parseFloat(r.working_hours) !==
                  parseFloat(ws.working_hours) && (
                  <Tooltip title={`Custom hours: ${r.working_hours}h/day`}>
                    <span
                      style={{
                        fontSize: 9,
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        borderRadius: 4,
                        padding: "0 4px",
                        fontFamily: "'JetBrains Mono',monospace",
                        fontWeight: 700,
                      }}
                    >
                      {r.working_hours}h
                    </span>
                  </Tooltip>
                )}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ets-muted)",
                fontFamily: "'DM Sans',sans-serif",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.job_title || r.role}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 112,
      render: (_, r) => {
        if (!r.hasLog)
          return (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--ets-muted)",
                fontFamily: "'DM Sans',sans-serif",
                background: "var(--ets-hover)",
                border: "1px solid var(--ets-border)",
                padding: "3px 9px",
                borderRadius: 6,
              }}
            >
              Not in
            </span>
          );
        const cfg = STATUS[r.log?.status] || STATUS.completed;
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 9px",
              borderRadius: 6,
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {r.log?.status === "active" && (
              <span
                className="ets-live"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: cfg.color,
                  display: "inline-block",
                }}
              />
            )}
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: "Attendance",
      key: "att",
      width: 132,
      render: (_, r) => {
        const live = r.log?.status;
        const val =
          live === "active"
            ? "working"
            : live === "break"
              ? "paused"
              : attOver[r.id] || autoAtt(r.log, now, ws, getEffHours(r));
        return (
          <AttCell
            value={val}
            onChange={(s) => handleAtt(r.id, s)}
            disabled={live === "active" || live === "break"}
          />
        );
      },
    },
    {
      title: "Start",
      key: "start",
      width: 95,
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <LogIn size={11} color="var(--ets-muted)" />
          <span
            style={{
              fontSize: 12,
              fontFamily: "'JetBrains Mono',monospace",
              color: "var(--ets-sub)",
            }}
          >
            {fmtH(r.log?.start_time)}
          </span>
          {/* Late badge next to start time for fixed model */}
          {isFixed && r.hasLog && isLate(r.log, ws) && (
            <span
              style={{
                fontSize: 9,
                background: "#fff7ed",
                color: "#c2410c",
                border: "1px solid #fed7aa",
                borderRadius: 4,
                padding: "0 4px",
                fontWeight: 700,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              LATE
            </span>
          )}
        </div>
      ),
    },
    {
      title: "End",
      key: "end",
      width: 100,
      render: (_, r) => {
        if (!r.log)
          return (
            <span style={{ color: "var(--ets-muted)", fontSize: 12 }}>—</span>
          );
        if (r.log.end_time)
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <LogOut size={11} color="var(--ets-muted)" />
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono',monospace",
                  color: "var(--ets-sub)",
                }}
              >
                {fmtH(r.log.end_time)}
              </span>
            </div>
          );
        if (r.log.status === "active")
          return (
            <span
              style={{
                fontSize: 11,
                color: "#22c55e",
                fontWeight: 600,
                fontFamily: "'DM Sans',sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                className="ets-live"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
              Live
            </span>
          );
        return (
          <span style={{ color: "var(--ets-muted)", fontSize: 12 }}>—</span>
        );
      },
    },
    {
      title: "Net Hours",
      key: "hours",
      width: 150,
      render: (_, r) => (
        <HoursCell log={r.log} effectiveHours={getEffHours(r)} ws={ws} />
      ),
    },
    // Overtime column — only shown if overtime_enabled
    ...(ws.overtime_enabled
      ? [
          {
            title: "Overtime",
            key: "overtime",
            width: 120,
            render: (_, r) => (
              <OvertimeCell
                log={r.log}
                effectiveHours={getEffHours(r)}
                ws={ws}
              />
            ),
          },
        ]
      : []),
    {
      title: "App Activity",
      key: "apps",
      width: 215,
      render: (_, r) => (
        <AppMini
          apps={r.apps}
          onViewAll={() => setDrawer({ open: true, employee: r })}
        />
      ),
    },
    {
      title: "Shots",
      key: "shots",
      width: 82,
      render: (_, r) => (
        <button
          className="ets-shot-btn"
          onClick={() => setDrawer({ open: true, employee: r })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "5px 7px",
            color:
              r.screenshotCount > 0 ? "var(--ets-accent)" : "var(--ets-muted)",
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Camera size={13} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            {r.screenshotCount}
          </span>
        </button>
      ),
    },
    {
      title: "Standup",
      key: "standup",
      width: 200,
      render: (_, r) =>
        r.log?.standup_message ? (
          <Tooltip title={r.log.standup_message} placement="topLeft">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
              <MessageSquare
                size={11}
                color="var(--ets-muted)"
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ets-sub)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  fontFamily: "'DM Sans',sans-serif",
                  lineHeight: 1.5,
                }}
              >
                {r.log.standup_message}
              </span>
            </div>
          </Tooltip>
        ) : (
          <span
            style={{
              fontSize: 11,
              color: "var(--ets-muted)",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            —
          </span>
        ),
    },
  ];

  const kpiCount = KPIs.length;

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        fontFamily: "'DM Sans',sans-serif",
        color: "var(--ets-text)",
        background: "var(--ets-bg)",
        minHeight: "100vh",
      }}
    >
      {/* Top bar */}
      <div
        className="ets-fade"
        style={{
          padding: "14px 28px",
          background: "var(--ets-card)",
          borderBottom: "1px solid var(--ets-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "var(--ets-hover)",
              border: "1px solid var(--ets-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={16} color="var(--ets-accent)" strokeWidth={2} />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ets-text)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              Employee Activity
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "var(--ets-muted)",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {isToday ? "Today" : dayjs(date).format("DD MMMM YYYY")}
              </span>
              {isToday && lastSync && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#15803d",
                    background: "#f0fdf4",
                    padding: "2px 8px",
                    borderRadius: 5,
                    border: "1px solid #bbf7d0",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  <RefreshCw size={9} className="ets-spin" />
                  {lastSync.format("h:mm:ss A")}
                </span>
              )}
              {selectedHoliday && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#b45309",
                    background: "#fffbeb",
                    padding: "2px 8px",
                    borderRadius: 5,
                    border: "1px solid #fde68a",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  <PartyPopper size={10} />
                  {selectedHoliday.name}
                </span>
              )}
              {dateIsWeekOff && !selectedHoliday && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6d28d9",
                    background: "#f5f3ff",
                    padding: "2px 8px",
                    borderRadius: 5,
                    border: "1px solid #ddd6fe",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  <Coffee size={10} />
                  Weekly Off
                </span>
              )}
              {!wsLoading && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--ets-muted)",
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {isFixed
                    ? `Fixed · ${ws.check_in_time}–${ws.check_out_time} · ${ws.working_hours}h`
                    : `Flexible · ${ws.working_hours}h`}
                  {ws.overtime_enabled && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        color: "#059669",
                        background: "#d1fae5",
                        padding: "1px 5px",
                        borderRadius: 4,
                        border: "1px solid #6ee7b7",
                      }}
                    >
                      <Zap size={9} />
                      OT
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <DatePicker
          value={dayjs(date)}
          onChange={(d) => d && setDate(d.format("YYYY-MM-DD"))}
          disabledDate={(d) => d && d.isAfter(dayjs(), "day")}
          allowClear={false}
          format="DD MMM YYYY"
          style={{ borderRadius: 8, fontFamily: "'DM Sans',sans-serif" }}
        />
      </div>

      {/* Holiday / Week off / Main content */}
      {!holidayLoading && selectedHoliday ? (
        <HolidayScreen holiday={selectedHoliday} date={date} />
      ) : !holidayLoading && !wsLoading && dateIsWeekOff ? (
        <WeekOffScreen date={date} dayName={dayjs(date).format("dddd")} />
      ) : (
        <div style={{ padding: "0 28px 28px" }}>
          {/* KPIs */}
          {holidayLoading || wsLoading || (loading && rows.length === 0) ? (
            <KpiSkeletons count={kpiCount} />
          ) : (
            <div
              className="ets-fade"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${kpiCount},1fr)`,
                gap: 10,
                marginBottom: 20,
              }}
            >
              {KPIs.map((k, i) => (
                <div
                  key={k.label}
                  className="ets-kpi"
                  style={{
                    background: "var(--ets-card)",
                    border: "1px solid var(--ets-border)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    animationDelay: `${i * 30}ms`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: k.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: k.color,
                      }}
                    >
                      {k.icon}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 22,
                      fontWeight: 600,
                      color: "var(--ets-text)",
                      lineHeight: 1,
                      marginBottom: 5,
                    }}
                  >
                    {loading ? "—" : k.value}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--ets-muted)",
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    {k.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          {holidayLoading || wsLoading || (loading && rows.length === 0) ? (
            <TableSkeletons count={8} />
          ) : (
            <div
              className="ets-fade"
              style={{
                background: "var(--ets-card)",
                border: "1px solid var(--ets-border)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <Table
                className="ets-table"
                columns={columns}
                dataSource={rows}
                loading={loading && rows.length > 0}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  pageSizeOptions: ["15", "20", "50"],
                  style: { padding: "12px 20px" },
                }}
                scroll={{ x: ws.overtime_enabled ? 1500 : 1380 }}
                rowClassName={(r) =>
                  `ets-row${!r.hasLog ? " ets-row-dim" : ""}`
                }
                locale={{
                  emptyText: (
                    <Empty
                      description={
                        <span
                          style={{
                            color: "var(--ets-muted)",
                            fontFamily: "'DM Sans',sans-serif",
                          }}
                        >
                          No data for this date
                        </span>
                      }
                    />
                  ),
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Drawer */}
      <ShotsDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, employee: null })}
        employee={drawer.employee}
        date={date}
      />
    </div>
  );
}
