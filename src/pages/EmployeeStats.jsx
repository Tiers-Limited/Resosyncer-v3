import { useState, useEffect, useCallback } from "react";
import { Progress, Spin, Empty, Select, Tooltip } from "antd";
import {
  CheckCheck,
  X,
  CalendarDays,
  HelpCircle,
  Users,
  TrendingUp,
  Calendar,
  Palmtree,
} from "lucide-react";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";

/* ── Fonts ──────────────────────────────────────────────────────────────── */
if (!document.getElementById("asp-fonts")) {
  const l = document.createElement("link");
  l.id = "asp-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
}

/* ── CSS ────────────────────────────────────────────────────────────────── */
if (!document.getElementById("asp-css")) {
  const s = document.createElement("style");
  s.id = "asp-css";
  s.textContent = `
    @keyframes aspFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .asp-fade  { animation: aspFadeUp 0.4s ease both; }
    .asp-card  { transition: box-shadow 0.2s, transform 0.18s; }
    .asp-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.1) !important; transform: translateY(-2px); }
    .asp-day:hover  { filter: brightness(0.88); }
    .asp-day  { transition: filter 0.12s; }
    .asp-kpi:hover .asp-kpi-icon { transform: scale(1.1); }
    .asp-kpi-icon { transition: transform 0.2s cubic-bezier(.34,1.56,.64,1); }
  `;
  document.head.appendChild(s);
}

/* ── Detect dark ────────────────────────────────────────────────────────── */
const isDark = () => {
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/* ── Constants ──────────────────────────────────────────────────────────── */
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

const DAY_NAME_TO_INDEX = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATS = [
  {
    key: "present",
    label: "Present",
    color: "#10b981",
    darkBg: "#052e16",
    lightBg: "#dcfce7",
    icon: <CheckCheck size={14} />,
  },
  {
    key: "absent",
    label: "Absent",
    color: "#ef4444",
    darkBg: "#3b0a0a",
    lightBg: "#fee2e2",
    icon: <X size={14} />,
  },
  {
    key: "leave",
    label: "On Leave",
    color: "#f59e0b",
    darkBg: "#451a03",
    lightBg: "#fef3c7",
    icon: <CalendarDays size={14} />,
  },
  {
    key: "notLogged",
    label: "No Login",
    color: "#64748b",
    darkBg: "#1c1c22",
    lightBg: "#f1f5f9",
    icon: <HelpCircle size={14} />,
  },
];

const DAY_COLOR = {
  present: { fill: "#10b981", text: "#fff" },
  absent: { fill: "#ef4444", text: "#fff" },
  leave: { fill: "#f59e0b", text: "#fff" },
  holiday: { fill: "#8b5cf6", text: "#fff" },
};

/* ── Helpers ────────────────────────────────────────────────────────────── */
const monthOptions = () => {
  const now = dayjs(),
    opts = [];
  for (let i = 0; i < 12; i++) {
    const d = now.subtract(i, "month");
    opts.push({
      value: `${d.year()}-${String(d.month() + 1).padStart(2, "0")}`,
      label: `${MONTHS[d.month()]} ${d.year()}`,
    });
  }
  return opts;
};

const parseWeekOffIndices = (weekOffDays = []) => {
  if (!Array.isArray(weekOffDays) || weekOffDays.length === 0) return [0, 6];
  const parsed = weekOffDays
    .map((d) => DAY_NAME_TO_INDEX[d.toLowerCase()])
    .filter((i) => i !== undefined);
  return parsed.length ? parsed : [0, 6];
};

/**
 * All non-week-off days up to today (or end of month).
 * Does NOT exclude holidays — that's done separately.
 */
const getWorkingDays = (ym, weekOffIndices) => {
  const [y, mo] = ym.split("-").map(Number);
  const now = dayjs();
  const isCur = now.year() === y && now.month() + 1 === mo;
  const last = isCur ? now.date() : dayjs(`${ym}-01`).daysInMonth();
  const days = [];
  for (let d = 1; d <= last; d++) {
    const ds = `${ym}-${String(d).padStart(2, "0")}`;
    if (!weekOffIndices.includes(dayjs(ds).day())) days.push(ds);
  }
  return days;
};

const rateColor = (pct) =>
  pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";

/* ── Avatar ─────────────────────────────────────────────────────────────── */
const Ava = ({ name = "", photo, size = 40 }) => {
  const [err, setErr] = useState(false);
  const COLS = [
    "#3b82f6",
    "#8b5cf6",
    "#10b981",
    "#f97316",
    "#ec4899",
    "#06b6d4",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const bg = COLS[Math.abs(h) % COLS.length];
  const initials = (() => {
    const p = name.trim().split(" ").filter(Boolean);
    return p.length >= 2
      ? `${p[0][0]}${p[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase() || "?";
  })();
  if (photo && !err)
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.max(10, size * 0.33),
        fontFamily: "'DM Sans',sans-serif",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

/* ── Mini heatmap calendar ───────────────────────────────────────────────── */
const HeatCalendar = ({
  yearMonth,
  records,
  wDays,
  weekOffIndices,
  holidaySet,
  holidayNames,
  dark,
}) => {
  const firstDow = dayjs(`${yearMonth}-01`).day();
  const totalD = dayjs(`${yearMonth}-01`).daysInMonth();
  const wSet = new Set(wDays);
  const todayStr = dayjs().format("YYYY-MM-DD");
  const cells = [];

  for (let i = 0; i < firstDow; i++) cells.push(<div key={`e${i}`} />);

  for (let d = 1; d <= totalD; d++) {
    const ds = `${yearMonth}-${String(d).padStart(2, "0")}`;
    const dow = dayjs(ds).day();
    const isWeekOff = weekOffIndices.includes(dow);
    const isHoliday = holidaySet.has(ds);
    const rec = records[ds];
    const isPast = wSet.has(ds);
    const isToday = todayStr === ds;
    const isFut = dayjs(ds).isAfter(dayjs(), "day");

    let bg = "transparent";
    let tc = dark ? "#2d3748" : "#e2e8f0";
    let ring = "none";

    if (isWeekOff) {
      bg = dark ? "#18181c" : "#f8fafc";
      tc = dark ? "#34343d" : "#e2e8f0";
    } else if (rec && DAY_COLOR[rec]) {
      bg = DAY_COLOR[rec].fill;
      tc = DAY_COLOR[rec].text;
    } else if (isHoliday) {
      bg = DAY_COLOR.holiday.fill;
      tc = DAY_COLOR.holiday.text;
    } else if (isPast && !isFut) {
      bg = dark ? "#1c1c22" : "#f1f5f9";
      tc = dark ? "#64748b" : "#94a3b8";
    }

    if (isToday)
      ring = `2px solid ${rec ? (dark ? "#fff" : "#1e40af") : dark ? "#3b82f6" : "#1e40af"}`;

    const tip = isWeekOff
      ? `${d} — Week off`
      : rec === "holiday"
        ? `${d} — 🎉 ${holidayNames[ds] || "Public Holiday"}`
        : rec
          ? `${d} — ${rec.charAt(0).toUpperCase() + rec.slice(1)}`
          : isHoliday
            ? `${d} — 🎉 ${holidayNames[ds] || "Public Holiday"}`
            : isPast && !isFut
              ? `${d} — No login`
              : isFut
                ? `${d} — Upcoming`
                : "";

    cells.push(
      <Tooltip key={d} title={tip} placement="top">
        <div
          className="asp-day"
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            fontSize: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontFamily: "'JetBrains Mono',monospace",
            background: bg,
            color: tc,
            outline: ring,
            outlineOffset: "-1px",
            opacity: isWeekOff || isFut ? 0.3 : 1,
            cursor: "default",
          }}
        >
          {d}
        </div>
      </Tooltip>,
    );
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 2,
          marginBottom: 4,
        }}
      >
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: 8,
              fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif",
              color: weekOffIndices.includes(i)
                ? dark
                  ? "#ef444430"
                  : "#ef444440"
                : dark
                  ? "#2d3748"
                  : "#d1d5db",
              letterSpacing: "0.05em",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 2,
        }}
      >
        {cells}
      </div>
      <div
        style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}
      >
        {[
          { color: "#10b981", label: "Present" },
          { color: "#ef4444", label: "Absent" },
          { color: "#f59e0b", label: "Leave" },
          { color: "#8b5cf6", label: "Holiday" },
          {
            color: dark ? "#1c1c22" : "#f1f5f9",
            label: "No login",
            text: dark ? "#64748b" : "#94a3b8",
          },
        ].map((l) => (
          <div
            key={l.label}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 2,
                background: l.color,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 9,
                fontFamily: "'DM Sans',sans-serif",
                color: l.text || l.color,
                opacity: l.text ? 1 : 0.8,
              }}
            >
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Employee card ───────────────────────────────────────────────────────── */
const EmpCard = ({
  emp,
  stats,
  wDays,
  weekOffIndices,
  holidaySet,
  holidayNames,
  ym,
  dark,
  delay,
}) => {
  const { present, absent, leave, holiday, notLogged, effectiveDays } = stats;
  // effectiveDays = working days minus public holidays → correct denominator
  const pct =
    effectiveDays > 0 ? Math.round((present / effectiveDays) * 100) : 0;
  const rc = rateColor(pct);

  return (
    <div
      className="asp-card asp-fade"
      style={{
        background: "var(--asp-card)",
        border: "1px solid var(--asp-border)",
        borderRadius: 16,
        padding: 20,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ position: "relative" }}>
          <Ava
            name={emp.full_name}
            photo={emp.user_photo || emp.profile_picture_url}
            size={42}
          />
          <div
            style={{
              position: "absolute",
              inset: -3,
              borderRadius: "50%",
              border: `2.5px solid ${rc}40`,
              pointerEvents: "none",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--asp-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {emp.full_name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--asp-muted)",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {emp.job_title || emp.role}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: rc,
              fontFamily: "'JetBrains Mono',monospace",
              lineHeight: 1,
            }}
          >
            {pct}%
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--asp-muted)",
              fontFamily: "'DM Sans',sans-serif",
              marginTop: 2,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            attendance
          </div>
        </div>
      </div>

      <Progress
        percent={pct}
        strokeColor={rc}
        trailColor={dark ? "#1c1c22" : "#f1f5f9"}
        showInfo={false}
        size="small"
        strokeLinecap="round"
        style={{ marginBottom: 14 }}
      />

      {/* Stat pills */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 6,
          marginBottom: 16,
        }}
      >
        {STATS.map((s) => (
          <Tooltip key={s.key} title={s.label} placement="top">
            <div
              style={{
                borderRadius: 10,
                padding: "8px 4px",
                textAlign: "center",
                cursor: "default",
                background: dark ? s.darkBg : s.lightBg,
                border: `1px solid ${s.color}20`,
              }}
            >
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: s.color,
                  fontFamily: "'JetBrains Mono',monospace",
                  lineHeight: 1,
                  marginBottom: 3,
                }}
              >
                {stats[s.key] ?? 0}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: s.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: "'DM Sans',sans-serif",
                  opacity: 0.9,
                }}
              >
                {s.label}
              </div>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Heatmap */}
      <div style={{ borderTop: `1px solid var(--asp-border)`, paddingTop: 14 }}>
        <HeatCalendar
          yearMonth={ym}
          records={stats.dailyRecords}
          wDays={wDays}
          weekOffIndices={weekOffIndices}
          holidaySet={holidaySet}
          holidayNames={holidayNames}
          dark={dark}
        />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function EmployeeStatsPage() {
  const now = dayjs();
  const [ym, setYm] = useState(
    `${now.year()}-${String(now.month() + 1).padStart(2, "0")}`,
  );
  const [employees, setEmployees] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState(null);
  const [dark, setDark] = useState(isDark);

  // These are set once from DB and don't change per-month
  const [weekOffIndices, setWeekOffIndices] = useState([0, 6]);
  const [allHolidays, setAllHolidays] = useState([]); // [{date, name}] full list

  // Derived from allHolidays filtered to current ym
  const holidaySet = new Set(
    allHolidays.filter((h) => h.date.startsWith(ym)).map((h) => h.date),
  );
  const holidayNames = Object.fromEntries(
    allHolidays
      .filter((h) => h.date.startsWith(ym))
      .map((h) => [h.date, h.name]),
  );
  const holidaysThisMonth = holidaySet.size;

  const wDays = getWorkingDays(ym, weekOffIndices);
  // Effective = working days minus public holidays
  const effectiveWDays = wDays.filter((d) => !holidaySet.has(d));

  const [y, m] = ym.split("-").map(Number);
  const monthLabel = `${MONTHS[m - 1]} ${y}`;
  const weekOffLabel = weekOffIndices.map((i) => DOW_LABELS[i]).join(" & ");

  /* ── Dark mode sync ─────────────────────────────────────────────────── */
  useEffect(() => {
    const applyTheme = () => {
      const d = isDark();
      setDark(d);
      const r = document.documentElement;
      if (d) {
        r.style.setProperty("--asp-bg", "#141416");
        r.style.setProperty("--asp-card", "#141416");
        r.style.setProperty("--asp-border", "#2a2a31");
        r.style.setProperty("--asp-text", "#e8edf5");
        r.style.setProperty("--asp-sub", "#cbd5e1");
        r.style.setProperty("--asp-muted", "#64748b");
        r.style.setProperty("--asp-hover", "#18181c");
        r.style.setProperty("--asp-thead", "#18181c");
      } else {
        r.style.setProperty("--asp-bg", "#f8fafc");
        r.style.setProperty("--asp-card", "#ffffff");
        r.style.setProperty("--asp-border", "#e2e8f0");
        r.style.setProperty("--asp-text", "#0f172a");
        r.style.setProperty("--asp-sub", "#475569");
        r.style.setProperty("--asp-muted", "#94a3b8");
        r.style.setProperty("--asp-hover", "#f1f5f9");
        r.style.setProperty("--asp-thead", "#f8fafc");
      }
    };

    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    applyTheme();
    window.addEventListener("themeModeChanged", applyTheme);
    mq.addEventListener("change", applyTheme);

    return () => {
      window.removeEventListener("themeModeChanged", applyTheme);
      mq.removeEventListener("change", applyTheme);
    };
  }, []);

  /* ── Step 1: get tenant ID ──────────────────────────────────────────── */
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
                                  
  useEffect(() => {
    if (!tenantId) return;
    const loadSettings = async () => {
      try {
        const [{ data: ws }, { data: holidays }] = await Promise.all([
          supabase
            .from("workspace_settings")
            .select("week_off_days")
            .eq("tenant_id", tenantId)
            .single(),
          supabase
            .from("public_holidays")
            .select("date, name")
            .eq("tenant_id", tenantId),
        ]);

        if (ws?.week_off_days) {
          setWeekOffIndices(parseWeekOffIndices(ws.week_off_days));
        }
        setAllHolidays(holidays || []);
      } catch (e) {
        console.error("Failed to load tenant settings:", e);
      }
    };
    loadSettings();
  }, [tenantId]);

  /* ── Step 3: fetch attendance — depends on ym, tenantId, AND settings ── */
  /* weekOffIndices + allHolidays are in deps so this re-runs after they     */
  /* load, eliminating the async race condition entirely.                    */
  const fetchStats = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      // Compute inside fetchStats using current closure values
      const woIndices = weekOffIndices;
      const hSet = new Set(
        allHolidays.filter((h) => h.date.startsWith(ym)).map((h) => h.date),
      );
      const wD = getWorkingDays(ym, woIndices);

      const startDate = `${ym}-01`;
      const endDate = wD.length > 0 ? wD[wD.length - 1] : startDate;

      /* 1. Profiles */
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,job_title,role,profile_picture_url,user_photo")
        .eq("tenant_id", tenantId)
        .eq("suspended", false)
        .not(
          "role",
          "in",
          '("admin","project_manager","superadmin","super_admin")',
        )
        .order("full_name");

      if (!profiles?.length) {
        setEmployees([]);
        setStatsMap({});
        return;
      }
      setEmployees(profiles);

      const ids = profiles.map((p) => p.id);

      /* 2. Attendance + time_logs */
      const [{ data: attRows }, { data: logRows }] = await Promise.all([
        supabase
          .from("attendance")
          .select("user_id,date,status")
          .in("user_id", ids)
          .gte("date", startDate)
          .lte("date", endDate),
        supabase
          .from("time_logs")
          .select("user_id,date")
          .in("user_id", ids)
          .gte("date", startDate)
          .lte("date", endDate),
      ]);

      /* 3. Build lookup maps */
      const attMap = {};
      (attRows || []).forEach((r) => {
        if (!attMap[r.user_id]) attMap[r.user_id] = {};
        attMap[r.user_id][r.date] = r.status;
      });

      const logSet = {};
      (logRows || []).forEach((l) => {
        if (!logSet[l.user_id]) logSet[l.user_id] = new Set();
        logSet[l.user_id].add(l.date);
      });

      /* 4. Per-employee stats */
      // effectiveDays = wD minus holidays (denominator for attendance %)
      const effDays = wD.filter((d) => !hSet.has(d)).length;

      const newStats = {};
      profiles.forEach((p) => {
        let present = 0,
          absent = 0,
          leave = 0,
          holiday = 0,
          notLogged = 0;
        const dailyRecords = {};

        wD.forEach((ds) => {
          const isHoliday = hSet.has(ds);
          const att = attMap[p.id]?.[ds];
          const hasLog = logSet[p.id]?.has(ds);

          if (att === "present") {
            present++;
            dailyRecords[ds] = "present";
          } else if (att === "absent") {
            absent++;
            dailyRecords[ds] = "absent";
          } else if (att === "leave") {
            leave++;
            dailyRecords[ds] = "leave";
          } else if (isHoliday) {
            // No explicit attendance on a holiday → mark as holiday
            holiday++;
            dailyRecords[ds] = "holiday";
          } else if (!hasLog) {
            notLogged++;
          }
        });

        newStats[p.id] = {
          present,
          absent,
          leave,
          holiday,
          notLogged,
          dailyRecords,
          effectiveDays: effDays, 
        };
      });

      setStatsMap(newStats);
    } finally {
      setLoading(false);
    }
  }, [ym, tenantId, weekOffIndices, allHolidays]); 

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totals = employees.reduce(
    (acc, e) => {
      const s = statsMap[e.id] || {};
      acc.present += s.present || 0;
      acc.absent += s.absent || 0;
      acc.leave += s.leave || 0;
      acc.holiday += s.holiday || 0;
      acc.notLogged += s.notLogged || 0;
      return acc;
    },
    { present: 0, absent: 0, leave: 0, holiday: 0, notLogged: 0 },
  );

  const overallRate = (() => {
    if (!employees.length || !effectiveWDays.length) return 0;
    const totalEffective = employees.reduce(
      (sum, e) =>
        sum + (statsMap[e.id]?.effectiveDays ?? effectiveWDays.length),
      0,
    );
    return totalEffective > 0
      ? Math.round((totals.present / totalEffective) * 100)
      : 0;
  })();

  /* ── KPIs ───────────────────────────────────────────────────────────── */
  const KPIs = [
    {
      label: "Employees",
      value: employees.length,
      icon: <Users size={15} />,
      color: "#1e40af",
    },
    {
      label: "Working Days",
      value: effectiveWDays.length,
      icon: <Calendar size={15} />,
      color: "#7c3aed",
    },
    {
      label: "Holidays",
      value: holidaysThisMonth,
      icon: <Palmtree size={15} />,
      color: "#8b5cf6",
    },
    {
      label: "Overall Rate",
      value: `${overallRate}%`,
      icon: <TrendingUp size={15} />,
      color: rateColor(overallRate),
    },
    ...STATS.map((s) => ({
      label: s.label,
      value: totals[s.key],
      icon: s.icon,
      color: s.color,
    })),
  ];

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        fontFamily: "'DM Sans',sans-serif",
        background: "var(--asp-bg)",
        minHeight: "100vh",
        color: "var(--asp-text)",
      }}
    >
      {/* Header */}
      <div
        className="asp-fade"
        style={{
          padding: "18px 28px 14px",
          background: "var(--asp-card)",
          borderBottom: "1px solid var(--asp-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 3,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: dark
                  ? "rgba(30,64,175,0.2)"
                  : "rgba(30,64,175,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1e40af",
              }}
            >
              <CalendarDays size={15} strokeWidth={2} />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: "var(--asp-text)",
                letterSpacing: "-0.03em",
              }}
            >
              Attendance Stats
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--asp-muted)",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {monthLabel} · {effectiveWDays.length} working days
            {holidaysThisMonth > 0 &&
              ` · ${holidaysThisMonth} public holiday${holidaysThisMonth > 1 ? "s" : ""}`}
            {" · "}
            {employees.length} employees
            {weekOffLabel && ` · ${weekOffLabel} off`}
          </p>
        </div>
        <Select
          value={ym}
          onChange={(v) => setYm(v)}
          options={monthOptions()}
          style={{ width: 175, borderRadius: 9 }}
        />
      </div>

      <div style={{ padding: "0 28px 32px" }}>
        {/* KPI row */}
        <div
          className="asp-fade"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${KPIs.length},1fr)`,
            gap: 12,
            marginBottom: 24,
            animationDelay: "50ms",
          }}
        >
          {KPIs.map((k, i) => (
            <div
              key={k.label}
              className="asp-card asp-kpi"
              style={{
                background: "var(--asp-card)",
                border: "1px solid var(--asp-border)",
                borderRadius: 13,
                padding: "14px 16px",
                animationDelay: `${i * 35}ms`,
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
                  className="asp-kpi-icon"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: k.color + "18",
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
                  fontWeight: 700,
                  color: "var(--asp-text)",
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {loading ? "—" : k.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  color: "var(--asp-muted)",
                }}
              >
                {k.label}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          className="asp-fade"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
            flexWrap: "wrap",
            animationDelay: "90ms",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--asp-sub)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Key:
          </span>
          {[
            { color: "#10b981", label: "Present" },
            { color: "#ef4444", label: "Absent" },
            { color: "#f59e0b", label: "On Leave" },
            { color: "#8b5cf6", label: "Holiday" },
            {
              color: dark ? "#1c1c22" : "#f1f5f9",
              label: "No Login",
              text: dark ? "#64748b" : "#94a3b8",
            },
            {
              color: dark ? "#18181c" : "#f8fafc",
              label: "Week Off",
              text: dark ? "#34343d" : "#e2e8f0",
            },
          ].map((l) => (
            <div
              key={l.label}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: l.color,
                  display: "inline-block",
                  flexShrink: 0,
                  border: `1px solid ${l.color}60`,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: l.text || l.color,
                  fontFamily: "'DM Sans',sans-serif",
                  fontWeight: 500,
                }}
              >
                {l.label}
              </span>
            </div>
          ))}
        </div>

        {/* Employee cards */}
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 300,
            }}
          >
            <Spin size="large" />
          </div>
        ) : employees.length === 0 ? (
          <Empty
            description={
              <span
                style={{
                  color: "var(--asp-muted)",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                No employees found for this tenant
              </span>
            }
          />
        ) : (
          <div
            className="asp-fade"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
              gap: 16,
              animationDelay: "130ms",
            }}
          >
            {employees.map((e, i) => (
              <EmpCard
                key={e.id}
                emp={e}
                stats={
                  statsMap[e.id] || {
                    present: 0,
                    absent: 0,
                    leave: 0,
                    holiday: 0,
                    notLogged: effectiveWDays.length,
                    dailyRecords: {},
                    effectiveDays: effectiveWDays.length, // ✅ always defined
                  }
                }
                wDays={wDays}
                weekOffIndices={weekOffIndices}
                holidaySet={holidaySet}
                holidayNames={holidayNames}
                ym={ym}
                dark={dark}
                delay={i * 30}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
