import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Tag,
  Tooltip,
  Statistic,
  Badge,
  Spin,
  Button,
  Typography,
  Progress,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  CrownOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ApartmentOutlined,
  TeamOutlined,
  DollarOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { useTheme } from "../../../components/Layout/MainLayout";
import { supabase } from "../../../lib/supabase";

const { Text } = Typography;

const Sparkline = ({ data, color, height = 32 }) => {
  if (!data?.length) return null;
  const w = 100;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h * 0.8 - h * 0.1;
    return `${x},${y}`;
  });
  const fillPath = `M${pts[0]} L${pts.slice(1).join(" L")} L${w},${h} L0,${h} Z`;
  const id = `sp-${color.replace("#", "")}`;
  return (
    <svg width={w} height={h} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${id})`} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={w}
        cy={pts[pts.length - 1].split(",")[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
};

const Donut = ({ segments, size = 80 }) => {
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size}>
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="10"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
};

const PLAN_COLOR = {
  Enterprise: "#7c3aed",
  Pro: "#3b82f6",
  Starter: "#10b981",
  Free: "#6b7280",
};
const STATUS_MAP = {
  active: { color: "success", label: "Active" },
  trial: { color: "warning", label: "Trial" },
  past_due: { color: "error", label: "Past Due" },
  suspended: { color: "default", label: "Suspended" },
  inactive: { color: "default", label: "Inactive" },
};

const ALERT_ICON = {
  error: <ExclamationCircleOutlined className="text-red-500 text-sm" />,
  warning: <WarningOutlined className="text-amber-500 text-sm" />,
  info: <CheckCircleOutlined className="text-blue-500 text-sm" />,
};

const SVC_COLOR = {
  operational: "#10b981",
  degraded: "#f59e0b",
  down: "#ef4444",
};

const SuperadminDashboard = () => {
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const [animIn, setAnimIn] = useState(false);

  // Data from Supabase
  const [tenants, setTenants] = useState([]);
  const [kpiData, setKpiData] = useState({
    mrr: 0,
    tenants: 0,
    users: 0,
    apiCalls: 0,
  });
  const [mrrHistory, setMrrHistory] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [signupHistory, setSignupHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [services, setServices] = useState([]);
  const [planDist, setPlanDist] = useState([]);

  const tk = {
    cardBg: isDarkMode ? "#1f2937" : "#ffffff",
    border: isDarkMode ? "#374151" : "#e5e7eb",
    divider: isDarkMode ? "#374151" : "#f3f4f6",
    textPri: isDarkMode ? "#f9fafb" : "#111827",
    textSec: isDarkMode ? "#9ca3af" : "#6b7280",
    textMuted: isDarkMode ? "#6b7280" : "#9ca3af",
    theadBg: isDarkMode ? "#374151" : "#f9fafb",
    rowHover: isDarkMode ? "#2d3748" : "#fafafa",
    statBg: isDarkMode ? "#374151" : "#f9fafb",
  };

  useEffect(() => {
    const clk = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clk);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: tenantRows } = await supabase
        .from("tenants")
        .select("id, name, plan, status, created_at, mrr, health_score")
        .order("created_at", { ascending: false });

      if (tenantRows) {
        setTenants(
          tenantRows.map((t) => ({
            key: t.id,
            id: t.id,
            name: t.name,
            plan: t.plan || "Starter",
            status: t.status || "active",
            mrr: t.mrr || 0,
            health: t.health_score || 100,
            joined: new Date(t.created_at).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            av: t.name?.slice(0, 2).toUpperCase() || "??",
          })),
        );

        // Plan distribution
        const counts = tenantRows.reduce((acc, t) => {
          const plan = t.plan || "Starter";
          acc[plan] = (acc[plan] || 0) + 1;
          return acc;
        }, {});
        setPlanDist(
          [
            {
              label: "Enterprise",
              value: counts.Enterprise || 0,
              color: "#7c3aed",
            },
            { label: "Pro", value: counts.Pro || 0, color: "#3b82f6" },
            { label: "Starter", value: counts.Starter || 0, color: "#10b981" },
            { label: "Free", value: counts.Free || 0, color: "#6b7280" },
          ].filter((p) => p.value > 0),
        );
      }

      // 2. Total users across all tenants
      const { count: userCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      // 3. Total MRR (sum from tenants)
      const totalMrr = tenantRows?.reduce((s, t) => s + (t.mrr || 0), 0) || 0;

      // 4. API calls today (from an api_logs table --- adjust to yours)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: apiCount } = await supabase
        .from("api_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      setKpiData({
        mrr: totalMrr,
        tenants: tenantRows?.length || 0,
        users: userCount || 0,
        apiCalls: apiCount || 0,
      });

      // 5. MRR history --- last 14 data points from mrr_snapshots (adjust to yours)
      const { data: mrrSnaps } = await supabase
        .from("mrr_snapshots")
        .select("value")
        .order("created_at", { ascending: true })
        .limit(14);
      setMrrHistory(mrrSnaps?.map((r) => r.value) || [totalMrr]);

      // 6. User signups last 14 days
      const { data: signupRows } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString());

      // Bucket into 14 daily counts
      const buckets = Array(14).fill(0);
      signupRows?.forEach((r) => {
        const daysAgo = Math.floor(
          (Date.now() - new Date(r.created_at).getTime()) / 86400000,
        );
        if (daysAgo < 14) buckets[13 - daysAgo]++;
      });
      setSignupHistory(buckets);
      setUserHistory(buckets);

      // 7. Alerts --- from a platform_alerts table (adjust to yours)
      const { data: alertRows } = await supabase
        .from("platform_alerts")
        .select("id, level, message, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      setAlerts(
        alertRows?.map((a) => ({
          id: a.id,
          level: a.level || "info",
          msg: a.message,
          time: formatTimeAgo(a.created_at),
        })) || [],
      );

      // 8. Service health --- from service_health table (adjust to yours)
      const { data: svcRows } = await supabase
        .from("service_health")
        .select("name, status, latency_ms, uptime_pct")
        .order("name");

      setServices(
        svcRows?.map((s) => ({
          name: s.name,
          status: s.status || "operational",
          latency: `${s.latency_ms || 0}ms`,
          uptime: `${s.uptime_pct || 100}%`,
        })) || [],
      );
    } catch (err) {
      console.error("SuperadminDashboard fetch error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimIn(true), 60);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setAnimIn(false);
    await fetchData();
    setRefreshing(false);
  };

  // ------ Helpers ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const formatTimeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const fmt = (n) =>
    n >= 1000000
      ? `${(n / 1000000).toFixed(1)}M`
      : n >= 1000
        ? `${(n / 1000).toFixed(1)}k`
        : String(n);

  // ------ KPI definitions ---------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const kpis = [
    {
      label: "Monthly Recurring Revenue",
      value: `$${fmt(kpiData.mrr)}`,
      delta: "+12.4%",
      up: true,
      color: "#7c3aed",
      icon: <DollarOutlined />,
      spark: mrrHistory,
    },
    {
      label: "Total Tenants",
      value: String(kpiData.tenants),
      delta: "+2 this month",
      up: true,
      color: "#3b82f6",
      icon: <ApartmentOutlined />,
      spark: signupHistory,
    },
    {
      label: "Active Users",
      value: fmt(kpiData.users),
      delta: "+8.1%",
      up: true,
      color: "#10b981",
      icon: <TeamOutlined />,
      spark: userHistory,
    },
    {
      label: "API Calls / Day",
      value: fmt(kpiData.apiCalls),
      delta: "---3.2%",
      up: false,
      color: "#f59e0b",
      icon: <ApiOutlined />,
      spark: Array(14).fill(kpiData.apiCalls || 0),
    },
  ];

  // ------ Ant Design table columns ------------------------------------------------------------------------------------------------------------------------------------------
  const tenantColumns = [
    {
      title: "Tenant",
      dataIndex: "name",
      render: (name, row) => (
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold flex-shrink-0"
            style={{
              background:
                row.status === "past_due"
                  ? isDarkMode
                    ? "#450a0a"
                    : "#fef2f2"
                  : isDarkMode
                    ? "#2e1065"
                    : "#f5f3ff",
              color: row.status === "past_due" ? "#ef4444" : "#7c3aed",
            }}
          >
            {row.av}
          </div>
          <div>
            <div
              className="text-sm font-semibold"
              style={{ color: tk.textPri }}
            >
              {name}
            </div>
            <div className="text-xs" style={{ color: tk.textMuted }}>
              since {row.joined}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      render: (plan) => (
        <span
          className="text-xs font-semibold"
          style={{ color: PLAN_COLOR[plan] || "#6b7280" }}
        >
          {plan}
        </span>
      ),
    },
    {
      title: "MRR",
      dataIndex: "mrr",
      render: (mrr) => (
        <span
          className="text-sm font-medium font-mono"
          style={{ color: tk.textPri }}
        >
          ${mrr.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Health",
      dataIndex: "health",
      render: (health) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={health}
            size="small"
            showInfo={false}
            strokeColor={
              health > 90 ? "#10b981" : health > 70 ? "#f59e0b" : "#ef4444"
            }
            trailColor={tk.border}
            style={{ width: 60, margin: 0 }}
          />
          <span className="text-xs" style={{ color: tk.textMuted }}>
            {health}%
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const s = STATUS_MAP[status] || STATUS_MAP.inactive;
        return (
          <Badge
            status={s.color}
            text={<span className="text-xs font-semibold">{s.label}</span>}
          />
        );
      },
    },
  ];

  // ------ Ant Design card style helper ------------------------------------------------------------------------------------------------------------------------------
  const cardStyle = (delay = 0) => ({
    background: tk.cardBg,
    border: `1px solid ${tk.border}`,
    borderRadius: 10,
    opacity: animIn ? 1 : 0,
    transform: animIn ? "translateY(0)" : "translateY(10px)",
    transition: `opacity 0.35s ease ${delay}s, transform 0.35s ease ${delay}s`,
  });

  const cardBodyStyle = { padding: 0 };

  // ------ Render ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ color: tk.textPri, fontFamily: "inherit" }}>
      {/* ------ Top bar ------------------------------------------------------------------------------------------------------------------------------------------------------------ */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm" style={{ color: tk.textMuted }}>
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-sm"
            style={{ color: "#7c3aed", letterSpacing: 1 }}
          >
            {now.toLocaleTimeString("en-US", { hour12: false })}
          </span>
          <Button
            size="small"
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={handleRefresh}
            loading={refreshing}
            style={{
              borderColor: tk.border,
              color: tk.textSec,
              background: "transparent",
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ------ KPI cards --------------------------------------------------------------------------------------------------------------------------------------------------------- */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {kpis.map((k, i) => (
          <Card
            key={i}
            style={cardStyle(i * 0.06)}
            styles={{ body: { padding: "16px 18px" } }}
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-start">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: tk.textMuted }}
                >
                  {k.label}
                </span>
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-sm"
                  style={{ background: `${k.color}18`, color: k.color }}
                >
                  {k.icon}
                </div>
              </div>
              <div
                className="text-2xl font-bold leading-none tracking-tight"
                style={{ color: tk.textPri }}
              >
                {k.value}
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="text-[11px] font-semibold flex items-center gap-1"
                  style={{ color: k.up ? "#10b981" : "#ef4444" }}
                >
                  {k.up ? (
                    <ArrowUpOutlined style={{ fontSize: 9 }} />
                  ) : (
                    <ArrowDownOutlined style={{ fontSize: 9 }} />
                  )}
                  {k.delta}
                </span>
                {k.spark?.length > 1 && (
                  <Sparkline data={k.spark} color={k.color} height={30} />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ------ Main grid --------------------------------------------------------------------------------------------------------------------------------------------------------- */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 296px" }}>
        {/* LEFT */}
        <div className="flex flex-col gap-3">
          {/* Tenant table */}
          <Card
            style={cardStyle(0.2)}
            styles={{ body: cardBodyStyle }}
            title={
              <span
                className="text-sm font-semibold"
                style={{ color: tk.textPri }}
              >
                Tenants
              </span>
            }
            extra={
              <span
                className="text-xs font-semibold cursor-pointer"
                style={{ color: "#7c3aed" }}
              >
                View All ---
              </span>
            }
          >
            <Table
              dataSource={tenants}
              columns={tenantColumns}
              pagination={false}
              size="small"
              rowKey="id"
              style={{ background: "transparent" }}
              onRow={() => ({
                style: { cursor: "pointer" },
                onMouseEnter: (e) =>
                  (e.currentTarget.style.background = tk.rowHover),
                onMouseLeave: (e) => (e.currentTarget.style.background = ""),
              })}
            />
          </Card>

          {/* Signup bar chart */}
          <Card
            style={cardStyle(0.28)}
            styles={{ body: { padding: "16px 18px 12px" } }}
            title={
              <span
                className="text-sm font-semibold"
                style={{ color: tk.textPri }}
              >
                New Signups --- Last 14 Days
              </span>
            }
            extra={
              <span
                className="text-xs font-semibold"
                style={{ color: "#10b981" }}
              >
                +{signupHistory.slice(-7).reduce((a, b) => a + b, 0)} this week
              </span>
            }
          >
            <div className="flex items-end gap-1" style={{ height: 72 }}>
              {signupHistory.map((v, i) => {
                const maxV = Math.max(...signupHistory, 1);
                const barH = Math.max((v / maxV) * 72, 3);
                const isLast = i === signupHistory.length - 1;
                return (
                  <Tooltip key={i} title={`Day ${i + 1}: ${v} signups`}>
                    <div
                      className="flex-1 rounded-t-sm cursor-pointer transition-opacity hover:opacity-70"
                      style={{
                        height: barH,
                        background: isLast
                          ? "#7c3aed"
                          : isDarkMode
                            ? "#4c1d95"
                            : "#ede9fe",
                      }}
                    />
                  </Tooltip>
                );
              })}
            </div>
            <div
              className="flex justify-between mt-2 text-xs"
              style={{ color: tk.textMuted }}
            >
              <span>14d ago</span>
              <span>Today</span>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-3">
          {/* Plan distribution */}
          <Card
            style={cardStyle(0.22)}
            styles={{ body: { padding: 0 } }}
            title={
              <span
                className="text-sm font-semibold"
                style={{ color: tk.textPri }}
              >
                Plan Distribution
              </span>
            }
            extra={<CrownOutlined style={{ color: "#7c3aed", fontSize: 13 }} />}
          >
            <div className="flex items-center gap-4 px-4 py-4">
              <Donut segments={planDist} size={80} />
              <div className="flex-1 flex flex-col gap-2">
                {planDist.map((p) => (
                  <div
                    key={p.label}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ background: p.color }}
                    />
                    <span style={{ color: tk.textSec }}>{p.label}</span>
                    <span
                      className="ml-auto font-semibold"
                      style={{ color: tk.textPri }}
                    >
                      {p.value}
                    </span>
                  </div>
                ))}
                <div className="border-t" style={{ borderColor: tk.divider }} />
                <div className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ background: tk.border }}
                  />
                  <span style={{ color: tk.textSec }}>Total</span>
                  <span
                    className="ml-auto font-semibold"
                    style={{ color: tk.textPri }}
                  >
                    {planDist.reduce((s, p) => s + p.value, 0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 pb-4">
              {[
                {
                  l: "Avg MRR",
                  v: kpiData.tenants
                    ? `$${Math.round(kpiData.mrr / kpiData.tenants).toLocaleString()}`
                    : "---",
                },
                { l: "Churn", v: "1.4%" },
                { l: "Conv.", v: "62%" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-lg p-2.5"
                  style={{
                    background: tk.statBg,
                    border: `1px solid ${tk.border}`,
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-wide"
                    style={{ color: tk.textMuted }}
                  >
                    {s.l}
                  </div>
                  <div
                    className="text-sm font-bold mt-0.5"
                    style={{ color: tk.textPri }}
                  >
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* System health */}
          <Card
            style={cardStyle(0.28)}
            styles={{ body: cardBodyStyle }}
            title={
              <span
                className="text-sm font-semibold"
                style={{ color: tk.textPri }}
              >
                System Health
              </span>
            }
            extra={
              <Tag
                color="success"
                style={{ fontSize: 10, fontWeight: 700, margin: 0 }}
              >
                {services.filter((s) => s.status === "operational").length}/
                {services.length} OK
              </Tag>
            }
          >
            {services.length === 0 ? (
              <div
                className="px-4 py-3 text-xs"
                style={{ color: tk.textMuted }}
              >
                No service data available
              </div>
            ) : (
              services.map((s, i) => {
                const sc = SVC_COLOR[s.status] || "#6b7280";
                return (
                  <div
                    key={s.name}
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{
                      borderBottom:
                        i < services.length - 1
                          ? `1px solid ${tk.divider}`
                          : "none",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          background: sc,
                          boxShadow:
                            s.status === "operational"
                              ? `0 0 5px ${sc}`
                              : "none",
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: tk.textPri }}
                      >
                        {s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-mono"
                        style={{ color: tk.textMuted }}
                      >
                        {s.latency}
                      </span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: tk.textMuted }}
                      >
                        {s.uptime}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </Card>

          {/* Alerts */}
          <Card
            style={cardStyle(0.34)}
            styles={{ body: cardBodyStyle }}
            title={
              <span
                className="text-sm font-semibold"
                style={{ color: tk.textPri }}
              >
                Recent Alerts
              </span>
            }
            extra={
              <div className="flex items-center gap-2">
                {alerts.filter((a) => a.level === "error").length > 0 && (
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{
                      background: isDarkMode ? "#450a0a" : "#fef2f2",
                      color: "#ef4444",
                    }}
                  >
                    {alerts.filter((a) => a.level === "error").length}
                  </span>
                )}
                <span
                  className="text-xs font-semibold cursor-pointer"
                  style={{ color: "#7c3aed" }}
                >
                  View All ---
                </span>
              </div>
            }
          >
            {alerts.length === 0 ? (
              <div
                className="px-4 py-3 text-xs"
                style={{ color: tk.textMuted }}
              >
                No recent alerts
              </div>
            ) : (
              alerts.map((a, i) => (
                <div
                  key={a.id}
                  className="flex items-start gap-2.5 px-4 py-2.5"
                  style={{
                    borderBottom:
                      i < alerts.length - 1
                        ? `1px solid ${tk.divider}`
                        : "none",
                  }}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {ALERT_ICON[a.level]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[12.5px] leading-snug"
                      style={{ color: tk.textPri }}
                    >
                      {a.msg}
                    </div>
                    <div
                      className="text-[11px] mt-0.5"
                      style={{ color: tk.textMuted }}
                    >
                      {a.time}
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      <style>{`@keyframes sa-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SuperadminDashboard;

