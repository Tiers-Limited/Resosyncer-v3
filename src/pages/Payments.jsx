import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Drawer,
  Input,
  message,
  Modal,
  Select,
  Tag,
  Upload,
} from "antd";
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  RiseOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";

const { TextArea } = Input;

const INVOICE_STATUSES = ["paid", "pending", "overdue"];
const PAYMENT_METHODS = [
  "bank_transfer",
  "cash",
  "card",
  "paypal",
  "wise",
  "crypto",
  "other",
];
const EXPENSE_CATEGORIES = ["salaries", "tools", "marketing", "ops", "other"];
const PAYOUT_STATUSES = ["scheduled", "paid", "cancelled"];
const CHART_COLORS = ["#0c66e4", "#22a06b", "#f97316", "#ef4444", "#7c3aed"];
const BRAND_COLOR = "#3453b7";
const FX_USD = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  PKR: 0.0036,
  INR: 0.012,
  AED: 0.272,
  SAR: 0.267,
  CAD: 0.74,
  AUD: 0.66,
  CNY: 0.138,
  UAH: 0.025,
  TRY: 0.031,
};
const SECTION_TABS = [
  { key: "overview", label: "Overview" },
  { key: "analytics", label: "Analytics" },
  { key: "invoices", label: "Invoices" },
  { key: "operations", label: "Operations" },
  { key: "projects", label: "Project Intelligence" },
];

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};
const getIsMobileView = () =>
  typeof window !== "undefined" ? window.innerWidth < 768 : false;

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const fmtMoney = (value, currency = "USD") => {
  const amount = toNumber(value);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const normalizeInvoiceStatus = (status) => {
  if (status === "not_paid") return "pending";
  return INVOICE_STATUSES.includes(status) ? status : "pending";
};

const monthKey = (date) => dayjs(date).format("YYYY-MM");
const monthLabel = (k) => dayjs(`${k}-01`).format("MMM YYYY");
const isInMonth = (date, targetMonthKey) =>
  Boolean(date) && monthKey(date) === targetMonthKey;
const humanizeLabel = (value) =>
  String(value || "-")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const safeMilestoneSum = (milestonePlan) => {
  const list = Array.isArray(milestonePlan) ? milestonePlan : [];
  return list.reduce((sum, item) => sum + toNumber(item?.amount), 0);
};

const deriveProjectRevenue = (project) => {
  const total = toNumber(project?.project_total_amount);
  if (total > 0) return total;

  const fixed = toNumber(project?.fixed_price);
  const hourly = toNumber(project?.hourly_rate) * toNumber(project?.estimated_units);
  const milestone = safeMilestoneSum(project?.milestone_plan);

  let base = fixed;
  if (project?.budget_model === "hourly") base = hourly;
  if (project?.budget_model === "milestone_based") base = milestone || fixed;

  if (project?.billing_type === "recurring") {
    const cycles = Math.max(1, toNumber(project?.recurring_cycles));
    return base * cycles;
  }
  return base;
};

const deriveEmployeeCost = (profile) => {
  const salaryAmount = toNumber(profile?.salary_amount);
  const baseSalary = toNumber(profile?.base_salary);
  if (salaryAmount > 0) return salaryAmount;
  if (baseSalary > 0) return baseSalary;
  return 0;
};

const deriveEmployeeMonthlyDeduction = (profile) => {
  const items = Array.isArray(profile?.tax_deduction_items)
    ? profile.tax_deduction_items
    : [];
  if (items.length > 0) {
    return items.reduce((sum, item) => sum + toNumber(item?.amount), 0);
  }
  return toNumber(profile?.tax_deductions);
};

const deriveEmployeeNetMonthly = (profile) => {
  const gross = deriveEmployeeCost(profile);
  const deduction = deriveEmployeeMonthlyDeduction(profile);
  return Math.max(0, gross - deduction);
};

const convertAmount = (
  amount,
  fromCurrency = "USD",
  toCurrency = "USD",
  rates = FX_USD,
) => {
  const from = String(fromCurrency || "USD").toUpperCase();
  const to = String(toCurrency || "USD").toUpperCase();
  if (from === to) return toNumber(amount);
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return toNumber(amount);
  const usdValue = toNumber(amount) / fromRate;
  return usdValue * toRate;
};

const estimateProjectMonths = (project) => {
  const start = project?.start_date ? dayjs(project.start_date) : null;
  const end = project?.end_date ? dayjs(project.end_date) : null;

  if (start && end && end.isAfter(start)) {
    const days = end.diff(start, "day") + 1;
    return Math.max(1, days / 30);
  }

  if (end) {
    const daysToDeadline = Math.max(1, end.diff(dayjs(), "day"));
    return Math.max(1, daysToDeadline / 30);
  }

  return 1;
};

const loadImageAsDataUrl = async (url) => {
  if (!url) return null;
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const makeLastMonthKeys = (count = 6) => {
  const now = dayjs().startOf("month");
  return Array.from({ length: count }).map((_, index) =>
    now.subtract(count - index - 1, "month").format("YYYY-MM"),
  );
};

const queryMaybeTenantScoped = async ({
  table,
  select,
  tenantId,
  orderBy,
  ascending = false,
  extraEq = [],
}) => {
  let query = supabase.from(table).select(select);
  if (tenantId) query = query.eq("tenant_id", tenantId);
  extraEq.forEach(([k, v]) => {
    query = query.eq(k, v);
  });
  if (orderBy) query = query.order(orderBy, { ascending });

  let result = await query;

  if (
    result.error &&
    tenantId &&
    String(result.error.message || "").toLowerCase().includes("tenant_id")
  ) {
    let fallback = supabase.from(table).select(select);
    extraEq.forEach(([k, v]) => {
      fallback = fallback.eq(k, v);
    });
    if (orderBy) fallback = fallback.order(orderBy, { ascending });
    result = await fallback;
  }

  return result;
};

const StatusTag = ({ status, dark }) => {
  const map = {
    paid: {
      label: "Paid",
      fg: dark ? "#86efac" : "#047857",
      bg: dark ? "#052e16" : "#ecfdf5",
      border: dark ? "#166534" : "#a7f3d0",
      icon: <CheckCircleFilled />,
    },
    pending: {
      label: "Pending",
      fg: dark ? "#93c5fd" : "#1d4ed8",
      bg: dark ? "#172554" : "#eff6ff",
      border: dark ? "#1e40af" : "#bfdbfe",
      icon: <ClockCircleFilled />,
    },
    overdue: {
      label: "Overdue",
      fg: dark ? "#fca5a5" : "#b91c1c",
      bg: dark ? "#450a0a" : "#fff1f2",
      border: dark ? "#991b1b" : "#fecdd3",
      icon: <CloseCircleFilled />,
    },
  };
  const s = map[normalizeInvoiceStatus(status)] || map.pending;

  return (
    <Tag
      style={{
        margin: 0,
        borderRadius: 99,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {s.icon} {s.label}
    </Tag>
  );
};

const ChartTooltip = ({ active, payload, label, dark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: dark ? "rgba(20,20,24,0.95)" : "rgba(255,255,255,0.97)",
        border: `1px solid ${dark ? "#34343d" : "#dbe3ef"}`,
        borderRadius: 10,
        padding: "8px 10px",
        minWidth: 120,
        boxShadow: dark
          ? "0 10px 24px rgba(0,0,0,0.35)"
          : "0 10px 24px rgba(15,23,42,0.12)",
      }}
    >
      {label !== undefined && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: dark ? "#cbd5e1" : "#334155",
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      )}
      {payload.map((item) => (
        <div
          key={`${item.dataKey}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 2,
          }}
        >
          <span style={{ fontSize: 11, color: item.color, fontWeight: 600 }}>
            {item.name || item.dataKey}
          </span>
          <span style={{ fontSize: 11, color: dark ? "#f1f5f9" : "#0f172a", fontWeight: 700 }}>
            {typeof item.value === "number" ? fmtMoney(item.value) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ title, value, sub, dark }) => (
  <div
    style={{
      background: dark ? "#17181c" : "#ffffff",
      border: `1px solid ${dark ? "#2a2a31" : "#e2e8f0"}`,
      borderRadius: 14,
      padding: "16px 18px",
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: dark ? "#94a3b8" : "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {title}
    </div>
    <div
      style={{
        marginTop: 6,
        fontSize: 24,
        fontWeight: 800,
        color: dark ? "#f1f5f9" : "#0f172a",
      }}
    >
      {value}
    </div>
    <div style={{ marginTop: 4, fontSize: 12, color: dark ? "#94a3b8" : "#64748b" }}>
      {sub}
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children, dark }) => (
  <div
    style={{
      background: dark
        ? "linear-gradient(180deg,#111318 0%, #0f1117 100%)"
        : "linear-gradient(180deg,#ffffff 0%, #f9fbff 100%)",
      border: `1px solid ${dark ? "#232734" : "#dde6f5"}`,
      borderRadius: 18,
      padding: "16px 18px",
      minHeight: 300,
      boxShadow: dark
        ? "0 16px 34px rgba(0,0,0,0.34)"
        : "0 14px 34px rgba(15,23,42,0.08)",
    }}
  >
    <div style={{ fontSize: 16, fontWeight: 800, color: dark ? "#f8fafc" : "#0f172a", marginBottom: 2 }}>
      {title}
    </div>
    {subtitle && (
      <div style={{ fontSize: 12, color: dark ? "#7f8ea8" : "#64748b", marginBottom: 10 }}>{subtitle}</div>
    )}
    <div style={{ width: "100%", height: 250 }}>{children}</div>
  </div>
);

export default function Payments() {
  const [dark, setDark] = useState(getIsDarkTheme);
  const [isMobile, setIsMobile] = useState(getIsMobileView);
  const [activeSection, setActiveSection] = useState("overview");
  const [tenantId, setTenantId] = useState(null);
  const [fxRates, setFxRates] = useState(FX_USD);
  const [fxMeta, setFxMeta] = useState({ source: "fallback", asOf: null });
  const [orgBrand, setOrgBrand] = useState({
    name: "Organization",
    logoUrl: "",
  });
  const [loading, setLoading] = useState(true);

  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectAssignees, setProjectAssignees] = useState([]);

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().startOf("month"));

  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [payoutDrawerOpen, setPayoutDrawerOpen] = useState(false);

  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingPayout, setEditingPayout] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState({
    client_name: "",
    amount: "",
    currency: "USD",
    status: "pending",
    payment_method: "bank_transfer",
    due_date: null,
    paid_date: null,
    project_id: null,
    remarks: "",
  });
  const [invoiceProofFile, setInvoiceProofFile] = useState(null);

  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "tools",
    spent_at: dayjs().format("YYYY-MM-DD"),
    project_id: null,
    notes: "",
  });

  const [payoutForm, setPayoutForm] = useState({
    payee_name: "",
    amount: "",
    payout_date: dayjs().format("YYYY-MM-DD"),
    status: "scheduled",
    payment_method: "bank_transfer",
    notes: "",
  });

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("themeModeChanged", syncTheme);
    mq.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("themeModeChanged", syncTheme);
      mq.removeEventListener("change", syncTheme);
    };
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(getIsMobileView());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setTenantId(profile?.tenant_id || null);
      setOrgBrand({
        name:
          profile?.company_name ||
          profile?.full_name ||
          "Organization",
        logoUrl:
          profile?.company_logo_url ||
          profile?.logo_url ||
          profile?.user_photo ||
          "",
      });
    };
    init();
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [invoiceRes, expenseRes, payoutRes, projectRes, assigneeRes] = await Promise.all([
        queryMaybeTenantScoped({
          table: "payments",
          select: "*",
          tenantId,
          orderBy: "created_at",
          ascending: false,
        }),
        queryMaybeTenantScoped({
          table: "finance_expenses",
          select: "*",
          tenantId,
          orderBy: "spent_at",
          ascending: false,
        }),
        queryMaybeTenantScoped({
          table: "finance_manual_payouts",
          select: "*",
          tenantId,
          orderBy: "payout_date",
          ascending: false,
        }),
        queryMaybeTenantScoped({
          table: "projects",
          select:
            "id,name,client_name,start_date,end_date,currency,budget_model,billing_type,fixed_price,hourly_rate,estimated_units,recurring_cycles,milestone_plan,project_total_amount,project_manager_id,is_archived",
          tenantId,
          orderBy: "created_at",
          ascending: false,
          extraEq: [["is_archived", false]],
        }),
        queryMaybeTenantScoped({
          table: "project_assignees",
          select:
            "project_id,employee_id,profiles:employee_id(id,full_name,salary_type,salary_amount,base_salary,currency,tax_deductions,tax_deduction_items)",
          tenantId,
        }),
      ]);

      if (invoiceRes.error) throw invoiceRes.error;
      if (
        expenseRes.error &&
        !String(expenseRes.error.message || "").toLowerCase().includes("relation")
      ) {
        throw expenseRes.error;
      }
      if (
        payoutRes.error &&
        !String(payoutRes.error.message || "").toLowerCase().includes("relation")
      ) {
        throw payoutRes.error;
      }
      if (projectRes.error) throw projectRes.error;
      if (assigneeRes.error) throw assigneeRes.error;

      setInvoices(
        (invoiceRes.data || []).map((row) => ({
          ...row,
          status: normalizeInvoiceStatus(row.status),
        })),
      );
      setExpenses(expenseRes.data || []);
      setPayouts(payoutRes.data || []);
      setProjects(projectRes.data || []);
      setProjectAssignees(assigneeRes.data || []);
    } catch (error) {
      console.error(error);
      message.error("Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId !== undefined) {
      fetchAll();
    }
  }, [tenantId, fetchAll]);

  useEffect(() => {
    const codes = new Set(["USD"]);
    projects.forEach((p) => {
      if (p?.currency) codes.add(String(p.currency).toUpperCase());
    });
    projectAssignees.forEach((row) => {
      if (row?.profiles?.currency) {
        codes.add(String(row.profiles.currency).toUpperCase());
      }
    });
    invoices.forEach((inv) => {
      if (inv?.currency) codes.add(String(inv.currency).toUpperCase());
    });

    const quotes = Array.from(codes).filter((c) => c !== "USD");
    if (quotes.length === 0) {
      setFxRates(FX_USD);
      setFxMeta({ source: "fallback", asOf: null });
      return;
    }

    let cancelled = false;
    const loadFx = async () => {
      try {
        const url = `https://api.frankfurter.dev/v2/rates?base=USD&quotes=${quotes.join(",")}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`FX API failed with ${res.status}`);
        const payload = await res.json();
        const nextRates = { USD: 1 };

        if (Array.isArray(payload)) {
          payload.forEach((row) => {
            if (row?.quote && row?.rate) {
              nextRates[String(row.quote).toUpperCase()] = toNumber(row.rate);
            }
          });
        } else if (payload?.rates && typeof payload.rates === "object") {
          Object.entries(payload.rates).forEach(([code, rate]) => {
            nextRates[String(code).toUpperCase()] = toNumber(rate);
          });
        }

        Object.entries(FX_USD).forEach(([code, rate]) => {
          if (!nextRates[code]) nextRates[code] = rate;
        });

        if (!cancelled) {
          setFxRates(nextRates);
          setFxMeta({
            source: "frankfurter",
            asOf: payload?.[0]?.date || payload?.date || dayjs().format("YYYY-MM-DD"),
          });
        }
      } catch (error) {
        console.error("FX fetch failed, using fallback rates:", error);
        if (!cancelled) {
          setFxRates(FX_USD);
          setFxMeta({ source: "fallback", asOf: null });
        }
      }
    };
    loadFx();
    return () => {
      cancelled = true;
    };
  }, [projects, projectAssignees, invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((row) => {
      const status = normalizeInvoiceStatus(row.status);
      const q = invoiceSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(row.client_name || "").toLowerCase().includes(q) ||
        String(row.remarks || "").toLowerCase().includes(q) ||
        String(row.payment_method || "").toLowerCase().includes(q);
      const matchesStatus =
        !invoiceStatusFilter.length || invoiceStatusFilter.includes(status);
      return matchesSearch && matchesStatus;
    });
  }, [invoices, invoiceSearch, invoiceStatusFilter]);

  const selectedMonthKey = useMemo(
    () => selectedMonth.format("YYYY-MM"),
    [selectedMonth],
  );

  const monthlySnapshot = useMemo(() => {
    const revenue = invoices.reduce((sum, inv) => {
      const invoiceDate = inv.created_at || inv.updated_at;
      if (!isInMonth(invoiceDate, selectedMonthKey)) return sum;
      const invoiceAmountUsd = convertAmount(
        toNumber(inv.amount),
        inv.currency || "USD",
        "USD",
        fxRates,
      );
      return sum + invoiceAmountUsd;
    }, 0);

    const totalExpensesOnly = expenses.reduce((sum, exp) => {
      const expenseDate = exp.spent_at || exp.created_at;
      if (!isInMonth(expenseDate, selectedMonthKey)) return sum;
      return sum + toNumber(exp.amount);
    }, 0);

    const totalPayouts = payouts.reduce((sum, payout) => {
      if (payout.status === "cancelled") return sum;
      const payoutDate = payout.payout_date || payout.created_at;
      if (!isInMonth(payoutDate, selectedMonthKey)) return sum;
      return sum + toNumber(payout.amount);
    }, 0);

    const pendingInvoices = invoices.filter((inv) => {
      const invoiceDate = inv.created_at || inv.updated_at;
      return (
        isInMonth(invoiceDate, selectedMonthKey) &&
        normalizeInvoiceStatus(inv.status) === "pending"
      );
    }).length;

    return {
      revenue,
      expensesOnly: totalExpensesOnly,
      payouts: totalPayouts,
      totalExpenses: totalExpensesOnly + totalPayouts,
      pendingInvoices,
      net: revenue - totalExpensesOnly - totalPayouts,
    };
  }, [invoices, expenses, payouts, selectedMonthKey, fxRates]);

  const cashFlowSeries = useMemo(() => {
    const keys = makeLastMonthKeys(8);
    const map = new Map(
      keys.map((k) => [
        k,
        { key: k, month: monthLabel(k), income: 0, expenses: 0, payouts: 0, outflow: 0, net: 0 },
      ]),
    );

    invoices.forEach((inv) => {
      const d = inv.created_at || inv.updated_at;
      if (!d) return;
      const k = monthKey(d);
      if (!map.has(k)) return;
      map.get(k).income += convertAmount(
        toNumber(inv.amount),
        inv.currency || "USD",
        "USD",
        fxRates,
      );
    });

    expenses.forEach((exp) => {
      const d = exp.spent_at || exp.created_at;
      if (!d) return;
      const k = monthKey(d);
      if (!map.has(k)) return;
      map.get(k).expenses += toNumber(exp.amount);
    });

    payouts.forEach((p) => {
      if (p.status === "cancelled") return;
      const d = p.payout_date || p.created_at;
      if (!d) return;
      const k = monthKey(d);
      if (!map.has(k)) return;
      map.get(k).payouts += toNumber(p.amount);
    });

    return keys.map((k) => {
      const row = map.get(k);
      row.outflow = row.expenses + row.payouts;
      row.net = row.income - row.expenses - row.payouts;
      return row;
    });
  }, [invoices, expenses, payouts, fxRates]);

  const invoiceStatusChart = useMemo(() => {
    const counters = { paid: 0, pending: 0, overdue: 0 };
    invoices.forEach((inv) => {
      counters[normalizeInvoiceStatus(inv.status)] += 1;
    });
    return [
      { name: "Paid", value: counters.paid },
      { name: "Pending", value: counters.pending },
      { name: "Overdue", value: counters.overdue },
    ];
  }, [invoices]);

  const expenseBreakdownChart = useMemo(() => {
    const map = new Map();
    expenses.forEach((exp) => {
      const key = exp.category || "other";
      map.set(key, (map.get(key) || 0) + toNumber(exp.amount));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const revenueByClientChart = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => {
      const invoiceDate = inv.created_at || inv.updated_at;
      if (!isInMonth(invoiceDate, selectedMonthKey)) return;
      const key = inv.client_name || "Unknown";
      const amountUsd = convertAmount(
        toNumber(inv.amount),
        inv.currency || "USD",
        "USD",
        fxRates,
      );
      map.set(key, (map.get(key) || 0) + amountUsd);
    });
    return Array.from(map.entries())
      .map(([client, revenue], idx) => ({
        rank: idx + 1,
        client,
        shortClient: client.length > 18 ? `${client.slice(0, 16)}..` : client,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [invoices, selectedMonthKey, fxRates]);

  const projectBreakdown = useMemo(() => {
    const assigneesByProject = new Map();
    projectAssignees.forEach((row) => {
      const list = assigneesByProject.get(row.project_id) || [];
      list.push(row.profiles);
      assigneesByProject.set(row.project_id, list.filter(Boolean));
    });

    return projects.map((project) => {
      const members = assigneesByProject.get(project.id) || [];
      const months = estimateProjectMonths(project);
      const estimatedLabor = members.reduce((sum, p) => {
        const monthly = deriveEmployeeNetMonthly(p);
        const monthlyInProjectCurrency = convertAmount(
          monthly,
          p?.currency || "USD",
          project.currency || "USD",
          fxRates,
        );
        return sum + monthlyInProjectCurrency * months;
      }, 0);
      const revenue = deriveProjectRevenue(project);
      const margin = revenue - estimatedLabor;
      return {
        id: project.id,
        name: project.name,
        currency: project.currency || "USD",
        membersCount: members.length,
        durationMonths: months,
        estimatedLabor,
        revenue,
        margin,
      };
    });
  }, [projects, projectAssignees, fxRates]);

  const trackedRevenue = monthlySnapshot.revenue;
  const totalExpenses = monthlySnapshot.totalExpenses;
  const pendingInvoicesCount = monthlySnapshot.pendingInvoices;

  const upcomingPayouts = useMemo(() => {
    const monthStart = selectedMonth.startOf("month");
    const monthEnd = selectedMonth.endOf("month");
    return payouts
      .filter(
        (p) =>
          p.status === "scheduled" &&
          p.payout_date &&
          dayjs(p.payout_date).isAfter(monthStart.subtract(1, "day")) &&
          dayjs(p.payout_date).isBefore(monthEnd.add(1, "day")),
      )
      .reduce((sum, row) => sum + toNumber(row.amount), 0);
  }, [payouts, selectedMonth]);

  const netProfit = monthlySnapshot.net;
  const payoutsInSelectedMonth = useMemo(
    () =>
      payouts.filter((p) => {
        const d = p.payout_date || p.created_at;
        return isInMonth(d, selectedMonthKey);
      }),
    [payouts, selectedMonthKey],
  );
  const selectedInvoiceProject = useMemo(
    () => projects.find((p) => p.id === invoiceForm.project_id) || null,
    [projects, invoiceForm.project_id],
  );
  const computedInvoiceAmount = useMemo(() => {
    if (!selectedInvoiceProject) return null;
    return deriveProjectRevenue(selectedInvoiceProject);
  }, [selectedInvoiceProject]);

  const resetInvoiceForm = () => {
    setInvoiceForm({
      client_name: "",
      amount: "",
      currency: "USD",
      status: "pending",
      payment_method: "bank_transfer",
      due_date: null,
      paid_date: null,
      project_id: null,
      remarks: "",
    });
    setInvoiceProofFile(null);
    setEditingInvoice(null);
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      title: "",
      amount: "",
      category: "tools",
      spent_at: dayjs().format("YYYY-MM-DD"),
      project_id: null,
      notes: "",
    });
    setEditingExpense(null);
  };

  const resetPayoutForm = () => {
    setPayoutForm({
      payee_name: "",
      amount: "",
      payout_date: dayjs().format("YYYY-MM-DD"),
      status: "scheduled",
      payment_method: "bank_transfer",
      notes: "",
    });
    setEditingPayout(null);
  };

  const openCreatePayout = () => {
    const now = dayjs();
    const inCurrentMonth = selectedMonth.isSame(now, "month");
    const presetDate = inCurrentMonth
      ? now.format("YYYY-MM-DD")
      : selectedMonth.startOf("month").format("YYYY-MM-DD");
    setEditingPayout(null);
    setPayoutForm({
      payee_name: "",
      amount: "",
      payout_date: presetDate,
      status: "scheduled",
      payment_method: "bank_transfer",
      notes: "",
    });
    setPayoutDrawerOpen(true);
  };

  const uploadInvoiceProof = async (invoiceId, file) => {
    if (!file) return null;

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const fileName = `${invoiceId}_${Date.now()}.${ext}`;
    const path = `finance-proofs/${tenantId || "global"}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(path, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: pub } = supabase.storage.from("attachments").getPublicUrl(path);
    return { proof_url: pub?.publicUrl || null, proof_path: path };
  };

  const saveInvoice = async () => {
    const resolvedAmount = selectedInvoiceProject
      ? toNumber(computedInvoiceAmount)
      : toNumber(invoiceForm.amount);
    if (!invoiceForm.client_name.trim() || resolvedAmount <= 0) {
      message.error("Client name and valid amount are required");
      return;
    }

    try {
      const payload = {
        client_name: invoiceForm.client_name.trim(),
        amount: resolvedAmount,
        currency:
          (selectedInvoiceProject?.currency || invoiceForm.currency || "USD"),
        status: normalizeInvoiceStatus(invoiceForm.status),
        payment_method: invoiceForm.payment_method,
        due_date: invoiceForm.due_date || null,
        paid_date: invoiceForm.paid_date || null,
        project_id: invoiceForm.project_id || null,
        remarks: invoiceForm.remarks || null,
        tenant_id: tenantId || null,
        updated_at: new Date().toISOString(),
      };

      if (editingInvoice) {
        const { error } = await supabase
          .from("payments")
          .update(payload)
          .eq("id", editingInvoice.id);
        if (error) throw error;

        if (invoiceProofFile) {
          const proof = await uploadInvoiceProof(editingInvoice.id, invoiceProofFile);
          if (proof) {
            const { error: proofErr } = await supabase
              .from("payments")
              .update(proof)
              .eq("id", editingInvoice.id);
            if (proofErr) throw proofErr;
          }
        }

        message.success("Invoice updated");
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from("payments")
          .insert([{ ...payload, created_by: user?.id || null }])
          .select("id")
          .single();

        if (error) throw error;

        if (invoiceProofFile && data?.id) {
          const proof = await uploadInvoiceProof(data.id, invoiceProofFile);
          if (proof) {
            const { error: proofErr } = await supabase
              .from("payments")
              .update(proof)
              .eq("id", data.id);
            if (proofErr) throw proofErr;
          }
        }

        message.success("Invoice created");
      }

      setInvoiceDrawerOpen(false);
      resetInvoiceForm();
      fetchAll();
    } catch (error) {
      console.error(error);
      message.error("Failed to save invoice");
    }
  };

  const saveExpense = async () => {
    if (!expenseForm.title.trim() || !expenseForm.amount) {
      message.error("Expense title and amount are required");
      return;
    }

    const payload = {
      title: expenseForm.title.trim(),
      amount: toNumber(expenseForm.amount),
      category: expenseForm.category,
      spent_at: expenseForm.spent_at || dayjs().format("YYYY-MM-DD"),
      project_id: expenseForm.project_id || null,
      notes: expenseForm.notes || null,
      tenant_id: tenantId || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingExpense) {
        const { error } = await supabase
          .from("finance_expenses")
          .update(payload)
          .eq("id", editingExpense.id);
        if (error) throw error;
        message.success("Expense updated");
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("finance_expenses")
          .insert([{ ...payload, created_by: user?.id || null }]);
        if (error) throw error;
        message.success("Expense added");
      }
      setExpenseDrawerOpen(false);
      resetExpenseForm();
      fetchAll();
    } catch (error) {
      console.error(error);
      message.error("Failed to save expense");
    }
  };

  const savePayout = async () => {
    if (!payoutForm.payee_name.trim() || !payoutForm.amount) {
      message.error("Payee and amount are required");
      return;
    }

    const payload = {
      payee_name: payoutForm.payee_name.trim(),
      amount: toNumber(payoutForm.amount),
      payout_date: payoutForm.payout_date || dayjs().format("YYYY-MM-DD"),
      status: payoutForm.status,
      payment_method: payoutForm.payment_method,
      notes: payoutForm.notes || null,
      tenant_id: tenantId || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingPayout) {
        const { error } = await supabase
          .from("finance_manual_payouts")
          .update(payload)
          .eq("id", editingPayout.id);
        if (error) throw error;
        message.success("Payout updated");
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("finance_manual_payouts")
          .insert([{ ...payload, created_by: user?.id || null }]);
        if (error) throw error;
        message.success("Payout added");
      }
      setPayoutDrawerOpen(false);
      resetPayoutForm();
      fetchAll();
    } catch (error) {
      console.error(error);
      message.error("Failed to save payout");
    }
  };

  const markInvoicePaid = async (invoiceId) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_date: dayjs().format("YYYY-MM-DD"),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);
      if (error) throw error;
      message.success("Invoice marked as paid");
      fetchAll();
    } catch (error) {
      console.error(error);
      message.error("Failed to mark invoice as paid");
    }
  };

  const downloadInvoicePdf = async (invoice) => {
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 40;
      const top = 40;

      if (orgBrand.logoUrl) {
        try {
          const logoData = await loadImageAsDataUrl(orgBrand.logoUrl);
          if (logoData) doc.addImage(logoData, "PNG", margin, top - 6, 56, 56);
        } catch {
          // ignore logo load errors and continue
        }
      }

      doc.setTextColor(20, 20, 20);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(String(orgBrand.name || "Organization"), margin, top + 70);
      doc.setFont(undefined, "normal");
      doc.setTextColor(31, 41, 55);
      const project = projects.find((p) => p.id === invoice.project_id);
      const status = normalizeInvoiceStatus(invoice.status).toUpperCase();
      const amountText = fmtMoney(invoice.amount, invoice.currency || "USD");
      const invoiceNo = String(invoice.id).slice(0, 8).toUpperCase();

      doc.setFont(undefined, "bold");
      doc.setFontSize(18);
      doc.text("INVOICE", pageW - margin, top + 2, { align: "right" });
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.text(`# ${invoiceNo}`, pageW - margin, top + 22, { align: "right" });

      const issueDate = dayjs(invoice.created_at).format("MMM D, YYYY");
      const dueDate = invoice.due_date ? dayjs(invoice.due_date).format("MMM D, YYYY") : "-";
      doc.setFontSize(10);
      doc.text("Date:", pageW - 210, top + 54);
      doc.text(issueDate, pageW - margin, top + 54, { align: "right" });
      doc.text("Due Date:", pageW - 210, top + 74);
      doc.text(dueDate, pageW - margin, top + 74, { align: "right" });

      doc.setFillColor(244, 246, 248);
      doc.roundedRect(pageW - 290, top + 88, 250, 28, 4, 4, "F");
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.text("Balance Due:", pageW - 190, top + 106);
      doc.text(amountText, pageW - 56, top + 106, { align: "right" });

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      const billTo = project?.client_name || invoice.client_name || "-";
      doc.text(`Bill To:`, margin, top + 124);
      doc.setFont(undefined, "bold");
      doc.text(String(billTo), margin, top + 140);
      doc.setFont(undefined, "normal");
      doc.text(`Project: ${project?.name || "-"}`, margin, top + 156);
      doc.text(`Status: ${status}`, margin, top + 172);

      autoTable(doc, {
        startY: top + 196,
        margin: { left: margin, right: margin },
        head: [["Item", "Quantity", "Rate", "Amount"]],
        body: [[project?.name || "Service", "1", amountText, amountText]],
        theme: "grid",
        headStyles: {
          fillColor: [52, 52, 52],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
        },
        bodyStyles: { fontSize: 10, textColor: [15, 23, 42] },
        columnStyles: {
          0: { cellWidth: 300 },
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
        },
      });

      const tableEndY = doc.lastAutoTable?.finalY || top + 250;
      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      doc.text("Subtotal:", pageW - 180, tableEndY + 26);
      doc.text(amountText, pageW - margin, tableEndY + 26, { align: "right" });
      doc.text("Tax (0%):", pageW - 180, tableEndY + 44);
      doc.text(fmtMoney(0, invoice.currency || "USD"), pageW - margin, tableEndY + 44, {
        align: "right",
      });
      doc.setFont(undefined, "bold");
      doc.text("Total:", pageW - 180, tableEndY + 64);
      doc.text(amountText, pageW - margin, tableEndY + 64, { align: "right" });
      doc.setFont(undefined, "normal");

      let notesY = tableEndY + 98;
      if (invoice.remarks) {
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text("Notes:", margin, notesY);
        doc.setTextColor(31, 41, 55);
        const wrapped = doc.splitTextToSize(String(invoice.remarks), pageW - margin * 2);
        doc.text(wrapped, margin, notesY + 16);
        notesY += 34 + wrapped.length * 11;
      }

      doc.setTextColor(107, 114, 128);
      doc.text("Payment Method:", margin, notesY);
      doc.setTextColor(31, 41, 55);
      doc.text(
        humanizeLabel(invoice.payment_method || "-"),
        margin + 80,
        notesY,
      );

      doc.setTextColor(107, 114, 128);
      doc.text("Terms:", margin, notesY + 24);
      doc.setTextColor(31, 41, 55);
      doc.text(
        "- Additional requests outside agreed scope are billed separately.",
        margin,
        notesY + 40,
      );

      doc.save(`invoice-${String(invoice.id).slice(0, 8)}.pdf`);
    } catch (error) {
      console.error(error);
      message.error("Failed to generate invoice PDF");
    }
  };

  const deleteRow = (table, id, label) => {
    Modal.confirm({
      title: `Delete ${label}`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) {
          message.error(`Failed to delete ${label.toLowerCase()}`);
          return;
        }
        message.success(`${label} deleted`);
        fetchAll();
      },
    });
  };

  const textColor = dark ? "#f1f5f9" : "#0f172a";
  const mutedText = dark ? "#94a3b8" : "#64748b";
  const borderColor = dark ? "#2a2a31" : "#e2e8f0";
  const cardBg = dark ? "#17181c" : "#ffffff";
  const topActionBtnStyle = {
    height: isMobile ? 36 : 40,
    borderRadius: 12,
    fontSize: isMobile ? 13 : 14,
    fontWeight: 700,
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const twoColGrid = isMobile ? "1fr" : "1fr 1fr";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark ? "#141416" : "#f8fafc",
        padding: isMobile ? "14px 12px" : "24px 28px",
      }}
    >
      <style>{`
        .finance-root .ant-input,
        .finance-root .ant-select-selector,
        .finance-root .ant-picker { border-radius: 9px !important; }
        .finance-root.dark .ant-input,
        .finance-root.dark .ant-input-affix-wrapper,
        .finance-root.dark .ant-select-selector,
        .finance-root.dark .ant-picker,
        .finance-root.dark textarea.ant-input {
          background: #1c1c22 !important;
          border-color: #34343d !important;
          color: #f1f5f9 !important;
        }
        .finance-root.dark .ant-input::placeholder,
        .finance-root.dark textarea.ant-input::placeholder,
        .finance-root.dark .ant-select-selection-placeholder { color: #64748b !important; }
        .finance-root.dark .ant-select-arrow,
        .finance-root.dark .ant-picker-suffix,
        .finance-root.dark .ant-picker-clear { color: #94a3b8 !important; }
        .finance-root .ant-btn-primary {
          background: ${BRAND_COLOR} !important;
          border-color: ${BRAND_COLOR} !important;
          box-shadow: none !important;
        }
        .finance-root .ant-btn-primary:hover,
        .finance-root .ant-btn-primary:focus {
          background: ${BRAND_COLOR} !important;
          border-color: ${BRAND_COLOR} !important;
          filter: brightness(1.06);
        }
        .finance-root.dark .ant-btn.invoice-cta {
          background: #ffffff !important;
          border-color: #ffffff !important;
          color: #0f172a !important;
        }
        .finance-root.dark .ant-btn.invoice-cta:hover,
        .finance-root.dark .ant-btn.invoice-cta:focus {
          background: #f8fafc !important;
          border-color: #f8fafc !important;
          color: #0f172a !important;
          filter: none !important;
        }
        .section-rail {
          display: inline-flex;
          gap: 8px;
          padding: 6px;
          border-radius: 14px;
          background: ${dark ? "rgba(17,19,24,0.9)" : "rgba(241,245,249,0.85)"};
          border: 1px solid ${dark ? "#262b37" : "#dbe4f0"};
          box-shadow: ${dark ? "0 8px 22px rgba(0,0,0,0.26)" : "0 8px 22px rgba(15,23,42,0.08)"};
        }
      `}</style>

      <div className={`finance-root${dark ? " dark" : ""}`}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <h1 style={{ margin: "4px 0 0", color: textColor, fontSize: isMobile ? 22 : 28, fontWeight: 800 }}>
              Finance Overview
            </h1>
            <p style={{ margin: "4px 0 0", color: mutedText, fontSize: 13 }}>
              Manual tracking only. Records are tracked, not auto-paid.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <DatePicker
              picker="month"
              allowClear={false}
              value={selectedMonth}
              onChange={(d) => setSelectedMonth(d || dayjs().startOf("month"))}
            />
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchAll}
              style={topActionBtnStyle}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div style={{ marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
          <div className="section-rail">
            {SECTION_TABS.map((tab) => {
              const active = activeSection === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveSection(tab.key)}
                  style={{
                    border: `1px solid ${active ? BRAND_COLOR : dark ? "#2a2f3a" : "#d8e2f0"}`,
                    background: active
                      ? dark
                        ? "linear-gradient(135deg,rgba(52,83,183,0.32),rgba(124,58,237,0.24))"
                        : "linear-gradient(135deg,#e9edff,#ede9ff)"
                      : dark
                        ? "rgba(21,24,31,0.92)"
                        : "#ffffff",
                    color: active ? BRAND_COLOR : dark ? "#cbd5e1" : "#334155",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {["operations", "invoices"].includes(activeSection) && (
          <div
            style={{
              marginBottom: 14,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {activeSection === "operations" && (
              <>
                <Button icon={<RiseOutlined />} onClick={openCreatePayout} style={topActionBtnStyle}>
                  Add Payout
                </Button>
                <Button
                  icon={<PlusOutlined />}
                  type="default"
                  style={topActionBtnStyle}
                  onClick={() => {
                    resetExpenseForm();
                    setExpenseDrawerOpen(true);
                  }}
                >
                  Add Expense
                </Button>
              </>
            )}
            {activeSection === "invoices" && (
              <Button
                icon={<PlusOutlined />}
                type="primary"
                className="invoice-cta"
                style={topActionBtnStyle}
                onClick={() => {
                  resetInvoiceForm();
                  setInvoiceDrawerOpen(true);
                }}
              >
                Create Invoice
              </Button>
            )}
          </div>
        )}

        {activeSection === "overview" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 160 : 220}px, 1fr))`,
            gap: 12,
            marginBottom: 16,
          }}
        >
          <StatCard
            title="Total Revenue (Tracked)"
            value={fmtMoney(trackedRevenue)}
            sub={`Invoices generated in ${selectedMonth.format("MMM YYYY")}`}
            dark={dark}
          />
          <StatCard
            title="Total Expenses"
            value={fmtMoney(totalExpenses)}
            sub={`${fmtMoney(monthlySnapshot.expensesOnly)} expenses + ${fmtMoney(monthlySnapshot.payouts)} payouts`}
            dark={dark}
          />
          <StatCard
            title="Net Profit"
            value={fmtMoney(netProfit)}
            sub={`${selectedMonth.format("MMM YYYY")} formula: invoices - expenses - payouts`}
            dark={dark}
          />
          <StatCard
            title="Pending Invoices"
            value={String(pendingInvoicesCount)}
            sub={`Pending invoices generated in ${selectedMonth.format("MMM YYYY")}`}
            dark={dark}
          />
          <StatCard
            title="Upcoming Payouts (Manual)"
            value={fmtMoney(upcomingPayouts)}
            sub={`Scheduled in ${selectedMonth.format("MMM YYYY")}`}
            dark={dark}
          />
        </div>
        )}

        {(activeSection === "overview" || activeSection === "analytics") && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 280 : 420}px, 1fr))`,
            gap: 14,
            marginBottom: 16,
          }}
        >
          <ChartCard
            title="Cash Flow"
            subtitle="Monthly generated invoices vs expenses vs payouts"
            dark={dark}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowSeries}>
                <defs>
                  <linearGradient id="incomeLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22a06b" />
                    <stop offset="100%" stopColor="#0c66e4" />
                  </linearGradient>
                  <linearGradient id="expenseLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={dark ? "#273043" : "#e2e8f0"} />
                <XAxis
                  dataKey="month"
                  stroke={mutedText}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  stroke={mutedText}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip content={<ChartTooltip dark={dark} />} cursor={false} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="url(#incomeLine)"
                  strokeWidth={2.6}
                  dot={{ r: 3.8, fill: "#0c66e4", strokeWidth: 2, stroke: dark ? "#111318" : "#fff" }}
                  activeDot={{ r: 6.2, fill: "#0c66e4", strokeWidth: 2, stroke: dark ? "#111318" : "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="url(#expenseLine)"
                  strokeWidth={2.6}
                  dot={{ r: 3.8, fill: "#ef4444", strokeWidth: 2, stroke: dark ? "#111318" : "#fff" }}
                  activeDot={{ r: 6.2, fill: "#ef4444", strokeWidth: 2, stroke: dark ? "#111318" : "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="payouts"
                  stroke="#fbbf24"
                  strokeWidth={2.4}
                  dot={{ r: 3.6, fill: "#fbbf24", strokeWidth: 2, stroke: dark ? "#111318" : "#fff" }}
                  activeDot={{ r: 6, fill: "#fbbf24", strokeWidth: 2, stroke: dark ? "#111318" : "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Monthly Trend"
            subtitle="Net outcome per month (Revenue - Expenses - Payouts)"
            dark={dark}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowSeries}>
                <defs>
                  <linearGradient id="incomeBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0c66e4" stopOpacity="1" />
                    <stop offset="100%" stopColor="#5b8dff" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="expenseBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.85" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={dark ? "#273043" : "#e2e8f0"} />
                <XAxis
                  dataKey="month"
                  stroke={mutedText}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  stroke={mutedText}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip content={<ChartTooltip dark={dark} />} cursor={false} />
                <Legend />
                <Bar dataKey="income" name="Revenue" fill="url(#incomeBar)" radius={[7, 7, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="url(#expenseBar)" radius={[7, 7, 0, 0]} />
                <Bar dataKey="payouts" name="Payouts" fill="#fbbf24" radius={[7, 7, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="Net"
                  stroke={BRAND_COLOR}
                  strokeWidth={2.3}
                  dot={{ r: 3.4, fill: BRAND_COLOR, stroke: dark ? "#111318" : "#fff", strokeWidth: 2 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Invoice Status"
            subtitle="Paid / pending / overdue distribution"
            dark={dark}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={invoiceStatusChart}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={88}
                  innerRadius={48}
                  paddingAngle={5}
                  label
                >
                  {invoiceStatusChart.map((entry, idx) => (
                    <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip dark={dark} />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Expense Breakdown"
            subtitle="Salaries, tools, marketing and operations"
            dark={dark}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdownChart}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={88}
                  innerRadius={48}
                  paddingAngle={4}
                  label
                >
                  {expenseBreakdownChart.map((entry, idx) => (
                    <Cell key={entry.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip dark={dark} />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Revenue by Client"
            subtitle={`Top clients for ${selectedMonth.format("MMM YYYY")} (USD normalized)`}
            dark={dark}
          >
            {revenueByClientChart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueByClientChart}
                  layout="vertical"
                  margin={{ top: 8, right: 54, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="clientBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#0c66e4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 5"
                    horizontal={false}
                    stroke={dark ? "#273043" : "#e2e8f0"}
                  />
                  <XAxis
                    type="number"
                    stroke={mutedText}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fontWeight: 600 }}
                    tickFormatter={(v) => `$${Math.round(v)}`}
                  />
                  <YAxis
                    dataKey="shortClient"
                    type="category"
                    width={104}
                    stroke={mutedText}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fontWeight: 700 }}
                  />
                  <Tooltip content={<ChartTooltip dark={dark} />} cursor={false} />
                  <Bar dataKey="revenue" fill="url(#clientBar)" radius={[0, 10, 10, 0]} barSize={20}>
                    <LabelList
                      dataKey="revenue"
                      position="right"
                      formatter={(v) => fmtMoney(v, "USD")}
                      style={{ fill: dark ? "#cbd5e1" : "#334155", fontSize: 11, fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: 250,
                  borderRadius: 12,
                  border: `1px dashed ${dark ? "#2a3242" : "#d1d9e6"}`,
                  display: "grid",
                  placeItems: "center",
                  color: mutedText,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                No client revenue for {selectedMonth.format("MMM YYYY")}
              </div>
            )}
          </ChartCard>
        </div>
        )}

        {activeSection === "projects" && (
        <div
          style={{
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 10 }}>
            Project Financial Summary
          </div>
          <div style={{ fontSize: 12, color: mutedText, marginBottom: 8 }}>
            Revenue, team size, and timeline by project.
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Project", "Revenue", "Duration (Months)", "Employees"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 8px",
                        fontSize: 11,
                        color: mutedText,
                        borderBottom: `1px solid ${borderColor}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectBreakdown.map((row) => (
                  <tr key={row.id}>
                    <td style={{ padding: "10px 8px", color: textColor, fontWeight: 600 }}>{row.name}</td>
                    <td style={{ padding: "10px 8px", color: textColor }}>
                      {fmtMoney(row.revenue, row.currency)}
                    </td>
                    <td style={{ padding: "10px 8px", color: mutedText }}>
                      {row.durationMonths.toFixed(1)}
                    </td>
                    <td style={{ padding: "10px 8px", color: mutedText }}>{row.membersCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {activeSection === "invoices" && (
        <div
          style={{
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>
              Invoices (Manual Payment Tracking)
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Input
                placeholder="Search invoices"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                style={{ width: 220 }}
              />
              <Select
                mode="multiple"
                placeholder="Status"
                value={invoiceStatusFilter}
                onChange={setInvoiceStatusFilter}
                style={{ minWidth: 180 }}
                options={INVOICE_STATUSES.map((s) => ({ value: s, label: s.toUpperCase() }))}
              />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "Client",
                    "Project",
                    "Amount",
                    "Status",
                    "Payment Method",
                    "Due",
                    "Paid",
                    "Proof",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 8px",
                        fontSize: 11,
                        color: mutedText,
                        borderBottom: `1px solid ${borderColor}`,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((row) => {
                  const project = projects.find((p) => p.id === row.project_id);
                  const status = normalizeInvoiceStatus(row.status);

                  return (
                    <tr key={row.id}>
                      <td style={{ padding: "10px 8px", color: textColor, minWidth: 160 }}>
                        {row.client_name}
                      </td>
                      <td style={{ padding: "10px 8px", color: mutedText, minWidth: 150 }}>
                        {project?.name || "-"}
                      </td>
                      <td style={{ padding: "10px 8px", color: textColor, fontWeight: 700 }}>
                        {fmtMoney(row.amount, row.currency || "USD")}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <StatusTag status={status} dark={dark} />
                      </td>
                      <td style={{ padding: "10px 8px", color: mutedText }}>
                        {humanizeLabel(row.payment_method)}
                      </td>
                      <td style={{ padding: "10px 8px", color: mutedText }}>
                        {row.due_date ? dayjs(row.due_date).format("MMM D, YYYY") : "-"}
                      </td>
                      <td style={{ padding: "10px 8px", color: mutedText }}>
                        {row.paid_date ? dayjs(row.paid_date).format("MMM D, YYYY") : "-"}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        {row.proof_url ? (
                          <a
                            href={row.proof_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#0c66e4", fontWeight: 600, fontSize: 12 }}
                          >
                            View
                          </a>
                        ) : (
                          <span style={{ color: mutedText, fontSize: 12 }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {status !== "paid" && (
                            <Button size="small" type="primary" onClick={() => markInvoicePaid(row.id)}>
                              Mark as Paid
                            </Button>
                          )}
                          <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => downloadInvoicePdf(row)}
                          />
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingInvoice(row);
                              setInvoiceForm({
                                client_name: row.client_name || "",
                                amount: String(row.amount || ""),
                                currency: row.currency || "USD",
                                status: normalizeInvoiceStatus(row.status),
                                payment_method: row.payment_method || "bank_transfer",
                                due_date: row.due_date || null,
                                paid_date: row.paid_date || null,
                                project_id: row.project_id || null,
                                remarks: row.remarks || "",
                              });
                              setInvoiceProofFile(null);
                              setInvoiceDrawerOpen(true);
                            }}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => deleteRow("payments", row.id, "Invoice")}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {activeSection === "operations" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 280 : 560}px, 1fr))`,
            gap: 12,
          }}
        >
          <div
            style={{
              background: cardBg,
              border: `1px solid ${borderColor}`,
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>
                Expenses
              </div>
            </div>
            <div style={{ fontSize: 12, color: mutedText, marginBottom: 10 }}>
              {payoutsInSelectedMonth.length} payout record(s) in {selectedMonth.format("MMMM YYYY")}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Title", "Category", "Amount", "Date", "Actions"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 6px",
                          fontSize: 11,
                          color: mutedText,
                          borderBottom: `1px solid ${borderColor}`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((row) => (
                    <tr key={row.id}>
                      <td style={{ padding: "9px 6px", color: textColor }}>{row.title}</td>
                      <td style={{ padding: "9px 6px", color: mutedText }}>{row.category}</td>
                      <td style={{ padding: "9px 6px", color: textColor, fontWeight: 700 }}>
                        {fmtMoney(row.amount)}
                      </td>
                      <td style={{ padding: "9px 6px", color: mutedText }}>
                        {row.spent_at ? dayjs(row.spent_at).format("MMM D, YYYY") : "-"}
                      </td>
                      <td style={{ padding: "9px 6px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingExpense(row);
                              setExpenseForm({
                                title: row.title || "",
                                amount: String(row.amount || ""),
                                category: row.category || "tools",
                                spent_at: row.spent_at || dayjs().format("YYYY-MM-DD"),
                                project_id: row.project_id || null,
                                notes: row.notes || "",
                              });
                              setExpenseDrawerOpen(true);
                            }}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => deleteRow("finance_expenses", row.id, "Expense")}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            style={{
              background: cardBg,
              border: `1px solid ${borderColor}`,
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 8 }}>
              Payouts
            </div>
            <div style={{ fontSize: 12, color: mutedText, marginBottom: 10 }}>
              Showing payouts for {selectedMonth.format("MMMM YYYY")}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Payee", "Status", "Amount", "Payout Date", "Method", "Actions"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 6px",
                          fontSize: 11,
                          color: mutedText,
                          borderBottom: `1px solid ${borderColor}`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payoutsInSelectedMonth.map((row) => (
                    <tr key={row.id}>
                      <td style={{ padding: "9px 6px", color: textColor }}>{row.payee_name}</td>
                      <td style={{ padding: "9px 6px", color: mutedText }}>
                        {String(row.status || "").toUpperCase()}
                      </td>
                      <td style={{ padding: "9px 6px", color: textColor, fontWeight: 700 }}>
                        {fmtMoney(row.amount)}
                      </td>
                      <td style={{ padding: "9px 6px", color: mutedText }}>
                        {row.payout_date ? dayjs(row.payout_date).format("MMM D, YYYY") : "-"}
                      </td>
                      <td style={{ padding: "9px 6px", color: mutedText }}>
                        {humanizeLabel(row.payment_method)}
                      </td>
                      <td style={{ padding: "9px 6px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingPayout(row);
                              setPayoutForm({
                                payee_name: row.payee_name || "",
                                amount: String(row.amount || ""),
                                payout_date: row.payout_date || dayjs().format("YYYY-MM-DD"),
                                status: row.status || "scheduled",
                                payment_method: row.payment_method || "bank_transfer",
                                notes: row.notes || "",
                              });
                              setPayoutDrawerOpen(true);
                            }}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => deleteRow("finance_manual_payouts", row.id, "Payout")}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!payoutsInSelectedMonth.length && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ padding: "12px 6px", color: mutedText, textAlign: "center" }}
                      >
                        No payouts recorded in this month.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}
      </div>

      <Drawer
        title={editingInvoice ? "Edit Invoice" : "Create Invoice"}
        open={invoiceDrawerOpen}
        onClose={() => {
          setInvoiceDrawerOpen(false);
          resetInvoiceForm();
        }}
        width={isMobile ? "92vw" : 440}
        extra={
          <Button icon={<InboxOutlined />} onClick={fetchAll}>
            Reload
          </Button>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Input
            placeholder="Client Name"
            value={invoiceForm.client_name}
            onChange={(e) =>
              setInvoiceForm((prev) => ({ ...prev, client_name: e.target.value }))
            }
          />
          <Select
            allowClear
            placeholder="Linked Project (optional)"
            value={invoiceForm.project_id}
            onChange={(v) => {
              const project = projects.find((p) => p.id === v);
              setInvoiceForm((prev) => ({
                ...prev,
                project_id: v || null,
                currency: project?.currency || prev.currency,
                client_name: prev.client_name || project?.client_name || prev.client_name,
              }));
            }}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
          <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: 8, alignItems: "center" }}>
            <div>
              {selectedInvoiceProject ? (
                <div
                  style={{
                    height: 38,
                    borderRadius: 9,
                    border: `1px solid ${dark ? "#34343d" : "#dbe4f0"}`,
                    background: dark ? "#1c1c22" : "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 10px",
                    fontSize: 12,
                    color: dark ? "#cbd5e1" : "#334155",
                    fontWeight: 700,
                  }}
                >
                  Auto Amount: {fmtMoney(computedInvoiceAmount || 0, selectedInvoiceProject.currency || invoiceForm.currency || "USD")}
                </div>
              ) : (
                <Input
                  type="number"
                  placeholder="Amount"
                  value={invoiceForm.amount}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              )}
            </div>
            <Input
              placeholder="Currency"
              value={invoiceForm.currency}
              onChange={(e) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  currency: e.target.value.toUpperCase() || "USD",
                }))
              }
              disabled={!!selectedInvoiceProject}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: 8 }}>
            <Select
              value={invoiceForm.status}
              onChange={(v) => setInvoiceForm((prev) => ({ ...prev, status: v }))}
              options={INVOICE_STATUSES.map((s) => ({ value: s, label: s.toUpperCase() }))}
            />
            <Select
              value={invoiceForm.payment_method}
              onChange={(v) => setInvoiceForm((prev) => ({ ...prev, payment_method: v }))}
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: humanizeLabel(m) }))}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: 8 }}>
            <DatePicker
              placeholder="Due Date"
              value={invoiceForm.due_date ? dayjs(invoiceForm.due_date) : null}
              style={{ width: "100%" }}
              onChange={(d) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  due_date: d ? d.format("YYYY-MM-DD") : null,
                }))
              }
            />
            <DatePicker
              placeholder="Paid Date"
              value={invoiceForm.paid_date ? dayjs(invoiceForm.paid_date) : null}
              style={{ width: "100%" }}
              onChange={(d) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  paid_date: d ? d.format("YYYY-MM-DD") : null,
                }))
              }
            />
          </div>
          <Upload
            beforeUpload={(file) => {
              setInvoiceProofFile(file);
              return false;
            }}
            maxCount={1}
            accept="image/*,.pdf"
          >
            <Button icon={<UploadOutlined />}>
              Upload Payment Proof (Screenshot/Receipt)
            </Button>
          </Upload>
          <TextArea
            rows={4}
            placeholder="Remarks"
            value={invoiceForm.remarks}
            onChange={(e) =>
              setInvoiceForm((prev) => ({ ...prev, remarks: e.target.value }))
            }
          />
          <Button type="primary" onClick={saveInvoice} icon={<RiseOutlined />}>
            {editingInvoice ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </Drawer>

      <Drawer
        title={editingExpense ? "Edit Expense" : "Add Expense"}
        open={expenseDrawerOpen}
        onClose={() => {
          setExpenseDrawerOpen(false);
          resetExpenseForm();
        }}
        width={isMobile ? "92vw" : 420}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Input
            placeholder="Expense Title"
            value={expenseForm.title}
            onChange={(e) =>
              setExpenseForm((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: 8 }}>
            <Input
              type="number"
              placeholder="Amount"
              value={expenseForm.amount}
              onChange={(e) =>
                setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))
              }
            />
            <Select
              value={expenseForm.category}
              onChange={(v) => setExpenseForm((prev) => ({ ...prev, category: v }))}
              options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </div>
          <DatePicker
            value={expenseForm.spent_at ? dayjs(expenseForm.spent_at) : null}
            style={{ width: "100%" }}
            onChange={(d) =>
              setExpenseForm((prev) => ({
                ...prev,
                spent_at: d ? d.format("YYYY-MM-DD") : null,
              }))
            }
          />
          <Select
            allowClear
            placeholder="Linked Project (optional)"
            value={expenseForm.project_id}
            onChange={(v) => setExpenseForm((prev) => ({ ...prev, project_id: v || null }))}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
          <TextArea
            rows={4}
            placeholder="Notes"
            value={expenseForm.notes}
            onChange={(e) =>
              setExpenseForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
          <Button type="primary" onClick={saveExpense}>
            {editingExpense ? "Update Expense" : "Save Expense"}
          </Button>
        </div>
      </Drawer>

      <Drawer
        title={editingPayout ? "Edit Manual Payout" : "Add Manual Payout"}
        open={payoutDrawerOpen}
        onClose={() => {
          setPayoutDrawerOpen(false);
          resetPayoutForm();
        }}
        width={isMobile ? "92vw" : 420}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Input
            placeholder="Payee Name"
            value={payoutForm.payee_name}
            onChange={(e) =>
              setPayoutForm((prev) => ({ ...prev, payee_name: e.target.value }))
            }
          />
          <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: 8 }}>
            <Input
              type="number"
              placeholder="Amount"
              value={payoutForm.amount}
              onChange={(e) =>
                setPayoutForm((prev) => ({ ...prev, amount: e.target.value }))
              }
            />
            <DatePicker
              value={payoutForm.payout_date ? dayjs(payoutForm.payout_date) : null}
              style={{ width: "100%" }}
              onChange={(d) =>
                setPayoutForm((prev) => ({
                  ...prev,
                  payout_date: d ? d.format("YYYY-MM-DD") : null,
                }))
              }
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: twoColGrid, gap: 8 }}>
            <Select
              value={payoutForm.status}
              onChange={(v) => setPayoutForm((prev) => ({ ...prev, status: v }))}
              options={PAYOUT_STATUSES.map((s) => ({ value: s, label: s }))}
            />
            <Select
              value={payoutForm.payment_method}
              onChange={(v) =>
                setPayoutForm((prev) => ({ ...prev, payment_method: v }))
              }
              options={PAYMENT_METHODS.map((m) => ({ value: m, label: humanizeLabel(m) }))}
            />
          </div>
          <TextArea
            rows={4}
            placeholder="Notes"
            value={payoutForm.notes}
            onChange={(e) =>
              setPayoutForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
          <Button type="primary" onClick={savePayout}>
            {editingPayout ? "Update Payout" : "Save Payout"}
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
