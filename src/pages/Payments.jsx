import { useState, useEffect, useCallback } from "react";
import { Button, message, Select, Input, Drawer, Modal } from "antd";
const { TextArea } = Input;
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  InboxOutlined,
  ArrowUpOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DollarOutlined,
  EditOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS = {
  paid: {
    label: "Paid",
    color: "#059669",
    darkColor: "#34d399",
    bg: "#ecfdf5",
    darkBg: "#052e16",
    border: "#a7f3d0",
    darkBorder: "#065f46",
    icon: <CheckCircleFilled style={{ fontSize: 11 }} />,
  },
  not_paid: {
    label: "Not Paid",
    color: "#e11d48",
    darkColor: "#fb7185",
    bg: "#fff1f2",
    darkBg: "#4c0519",
    border: "#fecdd3",
    darkBorder: "#9f1239",
    icon: <CloseCircleFilled style={{ fontSize: 11 }} />,
  },
};

const fmt = (n, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `${currency} ${parseFloat(n).toFixed(2)}`;
  }
};

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

// ── All world currencies ───────────────────────────────────────────────────
const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "PLN", name: "Polish Złoty", symbol: "zł" },
  { code: "TWD", name: "Taiwan Dollar", symbol: "NT$" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
  { code: "CLP", name: "Chilean Peso", symbol: "$" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "COP", name: "Colombian Peso", symbol: "$" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "EGP", name: "Egyptian Pound", symbol: "£" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD" },
  { code: "QAR", name: "Qatari Riyal", symbol: "QR" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв" },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn" },
  { code: "ISK", name: "Icelandic Króna", symbol: "kr" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "₨" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br" },
  { code: "DZD", name: "Algerian Dinar", symbol: "DA" },
  { code: "TND", name: "Tunisian Dinar", symbol: "DT" },
  { code: "LYD", name: "Libyan Dinar", symbol: "LD" },
  { code: "SDG", name: "Sudanese Pound", symbol: "SD" },
  { code: "MZN", name: "Mozambican Metical", symbol: "MT" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "CFA" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "JD" },
  { code: "LBP", name: "Lebanese Pound", symbol: "L£" },
  { code: "IQD", name: "Iraqi Dinar", symbol: "ID" },
  { code: "IRR", name: "Iranian Rial", symbol: "﷼" },
  { code: "OMR", name: "Omani Rial", symbol: "OR" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "BD" },
  { code: "YER", name: "Yemeni Rial", symbol: "﷼" },
  { code: "AFN", name: "Afghan Afghani", symbol: "؋" },
  { code: "UZS", name: "Uzbekistani Som", symbol: "so'm" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸" },
  { code: "GEL", name: "Georgian Lari", symbol: "₾" },
  { code: "AMD", name: "Armenian Dram", symbol: "֏" },
  { code: "AZN", name: "Azerbaijani Manat", symbol: "₼" },
  { code: "BYN", name: "Belarusian Ruble", symbol: "Br" },
  { code: "MDL", name: "Moldovan Leu", symbol: "L" },
  { code: "MKD", name: "Macedonian Denar", symbol: "den" },
  { code: "ALL", name: "Albanian Lek", symbol: "L" },
  { code: "BAM", name: "Bosnia Mark", symbol: "KM" },
  { code: "RSD", name: "Serbian Dinar", symbol: "din" },
  { code: "MNT", name: "Mongolian Tögrög", symbol: "₮" },
  { code: "KHR", name: "Cambodian Riel", symbol: "៛" },
  { code: "LAK", name: "Lao Kip", symbol: "₭" },
  { code: "MMK", name: "Myanmar Kyat", symbol: "K" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "₨" },
  { code: "BTN", name: "Bhutanese Ngultrum", symbol: "Nu" },
  { code: "MVR", name: "Maldivian Rufiyaa", symbol: "Rf" },
  { code: "PGK", name: "Papua New Guinean Kina", symbol: "K" },
  { code: "FJD", name: "Fijian Dollar", symbol: "FJ$" },
  { code: "SBD", name: "Solomon Islands Dollar", symbol: "SI$" },
  { code: "VUV", name: "Vanuatu Vatu", symbol: "VT" },
  { code: "WST", name: "Samoan Tālā", symbol: "T" },
  { code: "TOP", name: "Tongan Paʻanga", symbol: "T$" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/." },
  { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs." },
  { code: "PYG", name: "Paraguayan Guaraní", symbol: "₲" },
  { code: "UYU", name: "Uruguayan Peso", symbol: "$U" },
  { code: "VES", name: "Venezuelan Bolívar", symbol: "Bs.S" },
  { code: "GYD", name: "Guyanese Dollar", symbol: "G$" },
  { code: "SRD", name: "Surinamese Dollar", symbol: "Sr$" },
  { code: "TTD", name: "Trinidad Dollar", symbol: "TT$" },
  { code: "JMD", name: "Jamaican Dollar", symbol: "J$" },
  { code: "BBD", name: "Barbadian Dollar", symbol: "Bds$" },
  { code: "BSD", name: "Bahamian Dollar", symbol: "B$" },
  { code: "HTG", name: "Haitian Gourde", symbol: "G" },
  { code: "CUP", name: "Cuban Peso", symbol: "$MN" },
  { code: "DOP", name: "Dominican Peso", symbol: "RD$" },
  { code: "GTQ", name: "Guatemalan Quetzal", symbol: "Q" },
  { code: "HNL", name: "Honduran Lempira", symbol: "L" },
  { code: "NIO", name: "Nicaraguan Córdoba", symbol: "C$" },
  { code: "CRC", name: "Costa Rican Colón", symbol: "₡" },
  { code: "PAB", name: "Panamanian Balboa", symbol: "B/." },
  { code: "AWG", name: "Aruban Florin", symbol: "ƒ" },
  { code: "ANG", name: "Netherlands Antillean Guilder", symbol: "ƒ" },
  { code: "XCD", name: "East Caribbean Dollar", symbol: "EC$" },
  { code: "BMD", name: "Bermudian Dollar", symbol: "$" },
  { code: "KYD", name: "Cayman Islands Dollar", symbol: "CI$" },
];

// ── Component ──────────────────────────────────────────────────────────────
const Payments = () => {
  const [dark, setDark] = useState(getIsDarkTheme);
  const [tenantId, setTenantId] = useState(null);
  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const [form, setForm] = useState({
    client_name: "",
    amount: "",
    status: "not_paid",
    remarks: "",
    currency: "USD",
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
    if (tenantId) fetchPayments();
  }, [tenantId, showArchived]);

  useEffect(() => {
    let result = [...payments];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.client_name?.toLowerCase().includes(q) ||
          p.remarks?.toLowerCase().includes(q),
      );
    }
    if (statusFilter.length) {
      result = result.filter((p) => statusFilter.includes(p.status));
    }
    setFiltered(result);
  }, [payments, search, statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_archived", showArchived)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPayments(data || []);
    } catch {
      message.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.client_name || !form.amount) {
      message.error("Client name and amount are required");
      return;
    }
    try {
      if (editingPayment) {
        const { error } = await supabase
          .from("payments")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", editingPayment.id);
        if (error) throw error;
        message.success("Payment updated");
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("payments")
          .insert([{ ...form, tenant_id: tenantId, created_by: user.id }]);
        if (error) throw error;
        message.success("Payment added");
      }
      setDrawerOpen(false);
      resetForm();
      fetchPayments();
    } catch {
      message.error("Failed to save payment");
    }
  };

  const handleInlineEdit = useCallback(async (id, field, value) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
    setSavingId(id);
    try {
      const { error } = await supabase
        .from("payments")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    } catch {
      message.error("Failed to update");
      fetchPayments();
    } finally {
      setSavingId(null);
    }
  }, []);

  const handleArchive = async (id, archive) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ is_archived: archive })
        .eq("id", id);
      if (error) throw error;
      message.success(archive ? "Archived" : "Restored");
      fetchPayments();
    } catch {
      message.error("Failed");
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Payment",
      content: "This action is permanent and cannot be undone.",
      okText: "Delete",
      okType: "danger",
      icon: <DeleteOutlined style={{ color: "#e11d48" }} />,
      onOk: async () => {
        const { error } = await supabase.from("payments").delete().eq("id", id);
        if (error) {
          message.error("Failed to delete");
          return;
        }
        message.success("Deleted");
        fetchPayments();
      },
    });
  };

  const resetForm = () => {
    setForm({
      client_name: "",
      amount: "",
      status: "not_paid",
      remarks: "",
      currency: "USD",
    });
    setEditingPayment(null);
  };

  // ── Stats ──────────────────────────────────────────────────────────────
  const total = filtered.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const paid = filtered
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const unpaid = filtered
    .filter((p) => p.status === "not_paid")
    .reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;

  // ── Theme-aware values ─────────────────────────────────────────────────
  const t = {
    bgPage: dark ? "#141416" : "#f8fafc",
    bgCard: dark ? "#141416" : "#ffffff",
    bgSubtle: dark ? "#18181c" : "#f8fafc",
    bgMuted: dark ? "#1c1c22" : "#f1f5f9",
    bgHover: dark ? "#18181c" : "#f8fafc",
    border: dark ? "#2a2a31" : "#f1f5f9",
    borderStrong: dark ? "#34343d" : "#e2e8f0",
    textPrimary: dark ? "#f1f5f9" : "#0f172a",
    textSecondary: dark ? "#cbd5e1" : "#475569",
    textMuted: dark ? "#94a3b8" : "#94a3b8",
    textFaint: dark ? "#64748b" : "#cbd5e1",
    accent: dark ? "#f1f5f9" : "#0f172a",
    accentContrast: dark ? "#141416" : "#ffffff",
    dangerBg: dark ? "#4c0519" : "#fff1f2",
    dangerBorder: dark ? "#9f1239" : "#fecdd3",
    dangerText: dark ? "#fb7185" : "#e11d48",
    tableBg: dark ? "#141416" : "#ffffff",
    tableHeadBg: dark ? "#18181c" : "#f9fafb",
    tableRowBorder: dark ? "#2a2a31" : "#f9fafb",
    inputBg: dark ? "#1c1c22" : "#f8fafc",
    dotColor: dark ? "#94a3b8" : "#0f172a",
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`payments-page${dark ? " dark" : ""}`}
      style={{
        minHeight: "100vh",
        background: t.bgPage,
        padding: "28px 32px",
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.2s, color 0.2s",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
        .mono { font-family: 'DM Mono', monospace !important; }

        /* ── Ant Design dark overrides scoped to our wrapper ── */
        .payments-page.dark .ant-select-selector,
        .payments-page.dark .ant-input,
        .payments-page.dark textarea.ant-input {
          background: #1c1c22 !important;
          border-color: #34343d !important;
          color: #f1f5f9 !important;
        }
        .payments-page.dark .ant-select-arrow,
        .payments-page.dark .ant-input-prefix,
        .payments-page.dark .ant-input-suffix {
          color: #94a3b8 !important;
        }
        .payments-page.dark .ant-input::placeholder,
        .payments-page.dark textarea.ant-input::placeholder { color: #64748b !important; }
        .payments-page.dark .ant-input:focus,
        .payments-page.dark textarea.ant-input:focus {
          border-color: #94a3b8 !important;
          box-shadow: 0 0 0 2px rgba(148,163,184,0.15) !important;
        }
        .payments-page.dark .ant-select-focused .ant-select-selector {
          border-color: #94a3b8 !important;
          box-shadow: 0 0 0 2px rgba(148,163,184,0.15) !important;
        }
        .payments-page.dark .ant-select-selection-item { color: #f1f5f9 !important; }
        .payments-page.dark .ant-select-selection-placeholder { color: #64748b !important; }
        .payments-page.dark .ant-input-affix-wrapper {
          background: #1c1c22 !important;
          border-color: #34343d !important;
        }
        .payments-page.dark .ant-input-affix-wrapper input { background: transparent !important; color: #f1f5f9 !important; }
        .payments-page.dark .ant-input-affix-wrapper:focus-within {
          border-color: #94a3b8 !important;
          box-shadow: 0 0 0 2px rgba(148,163,184,0.15) !important;
        }
        .payments-page.dark .ant-select-clear { background: #1c1c22 !important; color: #94a3b8 !important; }
        .payments-page.dark .ant-tag { background: #1c1c22 !important; border-color: #34343d !important; color: #f1f5f9 !important; }

        /* Dropdown portal — must be global since it's outside DOM tree */
        .pay-dropdown-dark {
          background: #141416 !important;
          border: 1px solid #34343d !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        }
        .pay-dropdown-dark .ant-select-item {
          color: #cbd5e1 !important;
          background: transparent !important;
        }
        .pay-dropdown-dark .ant-select-item:hover,
        .pay-dropdown-dark .ant-select-item-option-active { background: #22222a !important; }
        .pay-dropdown-dark .ant-select-item-option-selected { background: #1e3a5f !important; color: #93c5fd !important; }
        .pay-dropdown-dark .ant-select-item-empty { color: #64748b !important; }

        /* Drawer dark */
        .pay-drawer-dark .ant-drawer-content {
          background: #141416 !important;
          border-left: 1px solid #2a2a31 !important;
        }
        .pay-drawer-dark .ant-drawer-header {
          background: #141416 !important;
          border-bottom: 1px solid #2a2a31 !important;
        }
        .pay-drawer-dark .ant-drawer-body { background: #141416 !important; }
        .pay-drawer-dark .ant-drawer-footer {
          background: #141416 !important;
          border-top: 1px solid #2a2a31 !important;
        }
        .pay-drawer-dark .ant-drawer-title { color: #f1f5f9 !important; }
        .pay-drawer-dark .ant-drawer-close { color: #94a3b8 !important; }
        .pay-drawer-dark .ant-drawer-close:hover { color: #f1f5f9 !important; }
        .pay-drawer-dark .ant-select-selector { background: #1c1c22 !important; border-color: #34343d !important; color: #f1f5f9 !important; }
        .pay-drawer-dark .ant-input { background: #1c1c22 !important; border-color: #34343d !important; color: #f1f5f9 !important; }
        .pay-drawer-dark textarea.ant-input { background: #1c1c22 !important; border-color: #34343d !important; color: #f1f5f9 !important; }
        .pay-drawer-dark .ant-input::placeholder,
        .pay-drawer-dark textarea.ant-input::placeholder { color: #64748b !important; }
        .pay-drawer-dark .ant-select-selection-item { color: #f1f5f9 !important; }
        .pay-drawer-dark .ant-select-selection-placeholder { color: #64748b !important; }
        .pay-drawer-dark .ant-select-arrow { color: #94a3b8 !important; }
        .pay-drawer-dark .ant-input-prefix { color: #94a3b8 !important; }

        /* Inline table inputs */
        .pay-row:hover { background: var(--pay-row-hover) !important; }
        .pay-row td { vertical-align: middle; }

        .inline-input { border: none !important; outline: none !important; padding: 0 !important; box-shadow: none !important; font-size: 13px !important; width: 100%; cursor: text; }
        .inline-input.dark-inp { background: transparent !important; color: #f1f5f9 !important; }
        .inline-input.light-inp { background: transparent !important; color: #0f172a !important; }
        .inline-input.dark-inp:focus { background: #1c1c22 !important; border-radius: 6px !important; padding: 3px 7px !important; }
        .inline-input.light-inp:focus { background: #f1f5f9 !important; border-radius: 6px !important; padding: 3px 7px !important; }
        .inline-input .ant-input-prefix { margin-right: 2px; }

        .inline-textarea { border: none !important; outline: none !important; padding: 0 !important; box-shadow: none !important; font-size: 12px !important; width: 100%; resize: none !important; cursor: text; }
        .inline-textarea.dark-inp { background: transparent !important; color: #cbd5e1 !important; }
        .inline-textarea.light-inp { background: transparent !important; color: #475569 !important; }
        .inline-textarea.dark-inp:focus { background: #1c1c22 !important; border-radius: 6px !important; padding: 4px 7px !important; }
        .inline-textarea.light-inp:focus { background: #f1f5f9 !important; border-radius: 6px !important; padding: 4px 7px !important; }

        /* Borderless selects in table */
        .dark .ant-select-borderless .ant-select-selector { background: transparent !important; color: #f1f5f9 !important; }
        .dark .ant-select-borderless .ant-select-selection-item { color: #f1f5f9 !important; }

        .stat-card { transition: transform 0.15s ease, box-shadow 0.15s ease; cursor: default; }
        .stat-card:hover { transform: translateY(-2px); }

        .progress-bar { height: 4px; border-radius: 99px; overflow: hidden; margin-top: 8px; }
        .progress-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #059669, #34d399); transition: width 0.6s ease; }

        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeInUp 0.25s ease forwards; }
        .saving-pulse { animation: pulse 1s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* Scrollbar dark */
        .payments-page.dark ::-webkit-scrollbar { width: 6px; height: 6px; }
        .payments-page.dark ::-webkit-scrollbar-track { background: #141416; }
        .payments-page.dark ::-webkit-scrollbar-thumb { background: #34343d; border-radius: 3px; }
        .payments-page.dark ::-webkit-scrollbar-thumb:hover { background: #4a4a56; }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: t.dotColor,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: t.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Finance
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: t.textPrimary,
              letterSpacing: -0.5,
            }}
          >
            Payments Tracker
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: t.textMuted }}>
            Track client invoices and payment status
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button
            icon={<InboxOutlined />}
            onClick={() => setShowArchived(!showArchived)}
            style={{
              height: 38,
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              border: `1px solid ${t.borderStrong}`,
              background: showArchived ? t.accent : t.bgCard,
              color: showArchived ? t.accentContrast : t.textSecondary,
              transition: "all 0.15s",
            }}
          >
            {showArchived ? "Active" : "Archived"}
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              resetForm();
              setDrawerOpen(true);
            }}
            style={{
              height: 38,
              paddingInline: 20,
              borderRadius: 10,
              background: t.accent,
              border: "none",
              color: t.accentContrast,
              fontWeight: 700,
              fontSize: 13,
              boxShadow: dark
                ? "0 4px 12px rgba(0,0,0,0.4)"
                : "0 4px 12px rgba(15,23,42,0.22)",
              transition: "all 0.15s",
            }}
          >
            Add Payment
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {/* Total */}
        <div
          className="stat-card fade-in"
          style={{
            background: t.bgCard,
            borderRadius: 16,
            border: `1px solid ${t.border}`,
            padding: "20px 22px",
            boxShadow: dark
              ? "0 1px 8px rgba(0,0,0,0.3)"
              : "0 1px 4px rgba(15,23,42,0.04)",
            transition: "background 0.2s, border-color 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: t.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Total Volume
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: t.bgMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarOutlined
                style={{ fontSize: 13, color: t.textSecondary }}
              />
            </div>
          </div>
          <div
            className="mono"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: t.textPrimary,
              letterSpacing: -0.5,
            }}
          >
            {fmt(total)}
          </div>
          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
            {filtered.length} entries · mixed currencies
          </div>
        </div>

        {/* Paid */}
        <div
          className="stat-card fade-in"
          style={{
            background: dark ? "#052e16" : "#ecfdf5",
            borderRadius: 16,
            border: `1px solid ${dark ? "#065f46" : "#a7f3d0"}`,
            padding: "20px 22px",
            boxShadow: dark
              ? "0 1px 8px rgba(0,0,0,0.3)"
              : "0 1px 4px rgba(5,150,105,0.06)",
            animationDelay: "0.05s",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: dark ? "#34d399" : "#059669",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Collected
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: dark ? "#064e3b" : "#d1fae5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleFilled
                style={{ fontSize: 13, color: dark ? "#34d399" : "#059669" }}
              />
            </div>
          </div>
          <div
            className="mono"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: dark ? "#34d399" : "#059669",
              letterSpacing: -0.5,
            }}
          >
            {fmt(paid)}
          </div>
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: dark ? "#34d399" : "#059669",
                  fontWeight: 600,
                }}
              >
                {paidPct}% of total
              </span>
            </div>
            <div
              className="progress-bar"
              style={{ background: dark ? "#064e3b" : "#d1fae5" }}
            >
              <div className="progress-fill" style={{ width: `${paidPct}%` }} />
            </div>
          </div>
        </div>

        {/* Unpaid */}
        <div
          className="stat-card fade-in"
          style={{
            background: dark ? "#4c0519" : "#fff1f2",
            borderRadius: 16,
            border: `1px solid ${dark ? "#9f1239" : "#fecdd3"}`,
            padding: "20px 22px",
            boxShadow: dark
              ? "0 1px 8px rgba(0,0,0,0.3)"
              : "0 1px 4px rgba(225,29,72,0.06)",
            animationDelay: "0.1s",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: dark ? "#fb7185" : "#e11d48",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Outstanding
            </span>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: dark ? "#881337" : "#ffe4e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CloseCircleFilled
                style={{ fontSize: 13, color: dark ? "#fb7185" : "#e11d48" }}
              />
            </div>
          </div>
          <div
            className="mono"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: dark ? "#fb7185" : "#e11d48",
              letterSpacing: -0.5,
            }}
          >
            {fmt(unpaid)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: dark ? "#fb7185" : "#e11d48",
              marginTop: 4,
              fontWeight: 600,
            }}
          >
            {filtered.filter((p) => p.status === "not_paid").length} unpaid
            invoices
          </div>
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <Input
            prefix={<SearchOutlined style={{ color: t.textMuted }} />}
            placeholder="Search client name or remarks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{
              borderRadius: 10,
              height: 38,
              background: t.bgCard,
              borderColor: t.borderStrong,
              color: t.textPrimary,
            }}
          />
        </div>
        <Select
          mode="multiple"
          placeholder="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ minWidth: 180 }}
          dropdownClassName={dark ? "pay-dropdown-dark" : ""}
          options={[
            { label: "✓ Paid", value: "paid" },
            { label: "✕ Not Paid", value: "not_paid" },
          ]}
        />
        <Button
          icon={<ReloadOutlined spin={loading} />}
          onClick={fetchPayments}
          style={{
            height: 38,
            borderRadius: 10,
            border: `1px solid ${t.borderStrong}`,
            background: t.bgCard,
            color: t.textSecondary,
            fontWeight: 600,
          }}
        >
          Refresh
        </Button>
      </div>

      {/* ── Table ── */}
      <div
        style={{
          background: t.tableBg,
          borderRadius: 16,
          border: `1px solid ${t.border}`,
          boxShadow: dark
            ? "0 1px 8px rgba(0,0,0,0.3)"
            : "0 1px 4px rgba(15,23,42,0.04)",
          overflow: "hidden",
          transition: "background 0.2s",
        }}
      >
        {/* Table header bar */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DollarOutlined style={{ color: t.textMuted }} />
            <span
              style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}
            >
              {showArchived ? "Archived" : "Active"} Payments
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: t.textSecondary,
                background: t.bgMuted,
                borderRadius: 20,
                padding: "1px 10px",
              }}
            >
              {filtered.length}
            </span>
          </div>
          <span style={{ fontSize: 12, color: t.textMuted }}>
            Click cells to edit inline
          </span>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: t.textMuted,
            }}
          >
            <ReloadOutlined
              spin
              style={{ fontSize: 24, marginBottom: 10, display: "block" }}
            />
            Loading payments…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <DollarOutlined
              style={{
                fontSize: 32,
                color: t.borderStrong,
                display: "block",
                margin: "0 auto 10px",
              }}
            />
            <span style={{ color: t.textMuted, fontSize: 14 }}>
              No payments found
            </span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: t.tableHeadBg,
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  {[
                    "Client",
                    "Amount",
                    "Currency",
                    "Status",
                    "Remarks",
                    "Created",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 18px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 700,
                        color: t.textMuted,
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
                {filtered.map((payment, idx) => {
                  const sc = STATUS[payment.status] || STATUS.not_paid;
                  return (
                    <tr
                      key={payment.id}
                      className="pay-row fade-in"
                      style={{
                        "--pay-row-hover": t.bgHover,
                        borderBottom:
                          idx < filtered.length - 1
                            ? `1px solid ${t.tableRowBorder}`
                            : "none",
                        background: t.tableBg,
                        animationDelay: `${idx * 0.03}s`,
                        transition: "background 0.1s",
                      }}
                    >
                      {/* Client */}
                      <td style={{ padding: "12px 18px", minWidth: 160 }}>
                        <Input
                          className={`inline-input ${dark ? "dark-inp" : "light-inp"}`}
                          value={payment.client_name}
                          onChange={(e) =>
                            handleInlineEdit(
                              payment.id,
                              "client_name",
                              e.target.value,
                            )
                          }
                          bordered={false}
                        />
                        {savingId === payment.id && (
                          <span
                            className="saving-pulse"
                            style={{ fontSize: 10, color: t.textMuted }}
                          >
                            saving…
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: "12px 18px", minWidth: 140 }}>
                        <Input
                          className={`inline-input mono ${dark ? "dark-inp" : "light-inp"}`}
                          prefix={
                            <span
                              style={{
                                color: t.textMuted,
                                fontSize: 11,
                                fontWeight: 600,
                                minWidth: 20,
                              }}
                            >
                              {CURRENCIES.find(
                                (c) => c.code === (payment.currency || "USD"),
                              )?.symbol || "$"}
                            </span>
                          }
                          type="number"
                          value={payment.amount}
                          onChange={(e) =>
                            handleInlineEdit(
                              payment.id,
                              "amount",
                              e.target.value,
                            )
                          }
                          bordered={false}
                          style={{ fontWeight: 700 }}
                        />
                      </td>

                      {/* Currency */}
                      <td style={{ padding: "12px 18px", minWidth: 130 }}>
                        <Select
                          value={payment.currency || "USD"}
                          onChange={(v) =>
                            handleInlineEdit(payment.id, "currency", v)
                          }
                          bordered={false}
                          style={{ marginLeft: -10, width: 110 }}
                          suffixIcon={null}
                          showSearch
                          optionFilterProp="label"
                          dropdownStyle={{ borderRadius: 10, minWidth: 260 }}
                          popupClassName={dark ? "pay-dropdown-dark" : ""}
                          options={CURRENCIES.map((c) => ({
                            value: c.code,
                            label: `${c.code} – ${c.name}`,
                            code: c.code,
                            symbol: c.symbol,
                          }))}
                          optionRender={(opt) => (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  width: 28,
                                  fontWeight: 700,
                                  fontSize: 12,
                                  fontFamily: "DM Mono, monospace",
                                  color: dark ? "#f1f5f9" : "#0f172a",
                                }}
                              >
                                {opt.data.symbol}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: dark ? "#94a3b8" : "#475569",
                                }}
                              >
                                <strong>{opt.data.code}</strong> —{" "}
                                {
                                  CURRENCIES.find(
                                    (c) => c.code === opt.data.code,
                                  )?.name
                                }
                              </span>
                            </div>
                          )}
                        />
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 18px", minWidth: 140 }}>
                        <Select
                          value={payment.status}
                          onChange={(v) =>
                            handleInlineEdit(payment.id, "status", v)
                          }
                          bordered={false}
                          style={{ marginLeft: -10 }}
                          suffixIcon={null}
                          dropdownStyle={{ borderRadius: 10 }}
                          popupClassName={dark ? "pay-dropdown-dark" : ""}
                        >
                          {Object.entries(STATUS).map(([val, cfg]) => (
                            <Select.Option key={val} value={val}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  padding: "3px 10px",
                                  borderRadius: 20,
                                  border: `1px solid ${dark ? cfg.darkBorder : cfg.border}`,
                                  background: dark ? cfg.darkBg : cfg.bg,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: dark ? cfg.darkColor : cfg.color,
                                }}
                              >
                                {cfg.icon} {cfg.label}
                              </span>
                            </Select.Option>
                          ))}
                        </Select>
                      </td>

                      {/* Remarks */}
                      <td
                        style={{
                          padding: "12px 18px",
                          minWidth: 200,
                          maxWidth: 280,
                        }}
                      >
                        <TextArea
                          className={`inline-textarea ${dark ? "dark-inp" : "light-inp"}`}
                          value={payment.remarks || ""}
                          onChange={(e) =>
                            handleInlineEdit(
                              payment.id,
                              "remarks",
                              e.target.value,
                            )
                          }
                          placeholder="Add note…"
                          bordered={false}
                          autoSize={{ minRows: 1, maxRows: 3 }}
                        />
                      </td>

                      {/* Date */}
                      <td
                        style={{ padding: "12px 18px", whiteSpace: "nowrap" }}
                      >
                        <span style={{ fontSize: 12, color: t.textSecondary }}>
                          {dayjs(payment.created_at).format("MMM D, YYYY")}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        style={{ padding: "12px 18px", whiteSpace: "nowrap" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            alignItems: "center",
                          }}
                        >
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingPayment(payment);
                              setForm({
                                client_name: payment.client_name,
                                amount: payment.amount,
                                status: payment.status,
                                remarks: payment.remarks || "",
                                currency: payment.currency || "USD",
                              });
                              setDrawerOpen(true);
                            }}
                            style={{
                              borderRadius: 7,
                              border: `1px solid ${t.borderStrong}`,
                              background: t.bgCard,
                              color: t.textSecondary,
                              fontWeight: 600,
                              fontSize: 12,
                              height: 30,
                              paddingInline: 10,
                            }}
                          />
                          {showArchived ? (
                            <Button
                              size="small"
                              icon={<ArrowUpOutlined />}
                              onClick={() => handleArchive(payment.id, false)}
                              style={{
                                borderRadius: 7,
                                border: `1px solid ${dark ? "#1e3a5f" : "#bae6fd"}`,
                                background: dark ? "#0c1a2e" : "#f0f9ff",
                                color: dark ? "#60a5fa" : "#0369a1",
                                fontWeight: 600,
                                fontSize: 12,
                                height: 30,
                                paddingInline: 10,
                              }}
                            >
                              Restore
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              icon={<InboxOutlined />}
                              onClick={() => handleArchive(payment.id, true)}
                              style={{
                                borderRadius: 7,
                                border: `1px solid ${t.borderStrong}`,
                                background: t.bgCard,
                                color: t.textMuted,
                                fontWeight: 600,
                                fontSize: 12,
                                height: 30,
                                paddingInline: 10,
                              }}
                            />
                          )}
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(payment.id)}
                            style={{
                              borderRadius: 7,
                              border: `1px solid ${t.dangerBorder}`,
                              background: t.dangerBg,
                              color: t.dangerText,
                              height: 30,
                              paddingInline: 10,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Drawer ── */}
      <Drawer
        rootClassName={dark ? "pay-drawer-dark" : "pay-drawer-light"}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: t.bgMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarOutlined
                style={{ color: t.textSecondary, fontSize: 16 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: t.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {editingPayment ? "Edit" : "New"}
              </div>
              <div
                style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary }}
              >
                {editingPayment ? "Update Payment" : "Add Payment"}
              </div>
            </div>
          </div>
        }
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          resetForm();
        }}
        width={460}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button
              onClick={() => {
                setDrawerOpen(false);
                resetForm();
              }}
              style={{
                borderRadius: 9,
                height: 38,
                fontWeight: 600,
                border: `1px solid ${t.borderStrong}`,
                background: t.bgCard,
                color: t.textPrimary,
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              style={{
                borderRadius: 9,
                height: 38,
                paddingInline: 22,
                background: t.accent,
                border: "none",
                color: t.accentContrast,
                fontWeight: 700,
                boxShadow: dark
                  ? "0 4px 12px rgba(0,0,0,0.4)"
                  : "0 4px 12px rgba(15,23,42,0.2)",
              }}
            >
              {editingPayment ? "Update" : "Add"} Payment
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Field label helper */}
          {[
            {
              label: "Client Name",
              required: true,
              content: (
                <Input
                  value={form.client_name}
                  onChange={(e) =>
                    setForm({ ...form, client_name: e.target.value })
                  }
                  placeholder="e.g. Acme Corporation"
                  style={{
                    borderRadius: 9,
                    height: 40,
                    background: t.inputBg,
                    borderColor: t.borderStrong,
                    color: t.textPrimary,
                  }}
                />
              ),
            },
          ].map(({ label, required, content }) => (
            <div key={label}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: t.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 7,
                }}
              >
                {label}{" "}
                {required && <span style={{ color: t.dangerText }}>*</span>}
              </label>
              {content}
            </div>
          ))}

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: t.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 7,
                }}
              >
                Amount <span style={{ color: t.dangerText }}>*</span>
              </label>
              <Input
                type="number"
                prefix={
                  <span
                    style={{
                      color: t.textMuted,
                      fontWeight: 700,
                      fontFamily: "DM Mono, monospace",
                      minWidth: 20,
                    }}
                  >
                    {CURRENCIES.find((c) => c.code === form.currency)?.symbol ||
                      "$"}
                  </span>
                }
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                style={{
                  borderRadius: 9,
                  height: 40,
                  fontFamily: "'DM Mono', monospace",
                  background: t.inputBg,
                  borderColor: t.borderStrong,
                  color: t.textPrimary,
                }}
              />
            </div>
            <div style={{ width: 160 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: t.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 7,
                }}
              >
                Currency <span style={{ color: t.dangerText }}>*</span>
              </label>
              <Select
                value={form.currency}
                onChange={(v) => setForm({ ...form, currency: v })}
                style={{ width: "100%" }}
                showSearch
                optionFilterProp="label"
                dropdownStyle={{ borderRadius: 10, minWidth: 280 }}
                popupClassName={dark ? "pay-dropdown-dark" : ""}
                options={CURRENCIES.map((c) => ({
                  value: c.code,
                  label: `${c.code} – ${c.name}`,
                  symbol: c.symbol,
                }))}
                optionRender={(opt) => (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "2px 0",
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        fontWeight: 700,
                        color: dark ? "#f1f5f9" : "#0f172a",
                        fontSize: 12,
                        fontFamily: "DM Mono, monospace",
                        flexShrink: 0,
                      }}
                    >
                      {opt.data.symbol}
                    </span>
                    <div>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          color: dark ? "#f1f5f9" : "#0f172a",
                        }}
                      >
                        {opt.data.value}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: dark ? "#94a3b8" : "#94a3b8",
                          marginLeft: 6,
                        }}
                      >
                        {
                          CURRENCIES.find((c) => c.code === opt.data.value)
                            ?.name
                        }
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: t.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 7,
              }}
            >
              Status <span style={{ color: t.dangerText }}>*</span>
            </label>
            <Select
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              style={{ width: "100%" }}
              popupClassName={dark ? "pay-dropdown-dark" : ""}
            >
              {Object.entries(STATUS).map(([val, cfg]) => (
                <Select.Option key={val} value={val}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      color: dark ? cfg.darkColor : cfg.color,
                      fontWeight: 600,
                    }}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: t.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 7,
              }}
            >
              Remarks
            </label>
            <TextArea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              rows={4}
              placeholder="Invoice number, notes, payment terms…"
              style={{
                resize: "none",
                borderRadius: 9,
                background: t.inputBg,
                borderColor: t.borderStrong,
                color: t.textPrimary,
              }}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default Payments;
