import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
  Popover,
  ConfigProvider,
  theme as antdTheme,
} from "antd";
import {
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CustomerServiceOutlined,
  FolderOutlined,
  MessageOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FileDoneOutlined,
  DollarOutlined,
  SunOutlined,
  MoonOutlined,
  DownOutlined,
  CommentOutlined,
  DesktopOutlined,
  CheckOutlined,
  FileProtectOutlined,
  ReadOutlined,
  BarChartOutlined,
  UserAddOutlined,
  CrownOutlined,
  ApartmentOutlined,
  ApiOutlined,
  AlertOutlined,
  FundOutlined,
  SafetyCertificateOutlined,
  ExperimentOutlined,
  HddOutlined,
  KeyOutlined,
  MailOutlined,
  LineChartOutlined,
  CalendarOutlined,
  PieChartOutlined,
  IdcardOutlined,
  BankOutlined,
  VideoCameraOutlined,
  CreditCardOutlined,
  AuditOutlined,
  RadarChartOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import ReactCountryFlag from "country-flag-icons/react/3x2";

const { Header, Sider, Content } = Layout;

export const ThemeContext = createContext({ isDarkMode: false });
export const useTheme = () => useContext(ThemeContext);

const TRANSLATE_LANGUAGES = [
  {
    value: "es",
    label: "Spanish",
    native: "EspaÃ±ol",
    flag: "ES",
    country: "ES",
  },
  {
    value: "pt",
    label: "Portuguese",
    native: "PortuguÃªs",
    flag: "PT",
    country: "PT",
  },
  {
    value: "ru",
    label: "Russian",
    native: "Ð ÑƒÑÑÐºÐ¸Ð¹",
    flag: "RU",
    country: "RU",
  },
  {
    value: "en",
    label: "English",
    native: "English",
    flag: "EN",
    country: "US",
  },
  {
    value: "de",
    label: "German",
    native: "Deutsch",
    flag: "DE",
    country: "DE",
  },
  {
    value: "ar",
    label: "Arabic",
    native: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©",
    flag: "AR",
    country: "SA",
  },
  {
    value: "fr",
    label: "French",
    native: "FranÃ§ais",
    flag: "FR",
    country: "FR",
  },
  {
    value: "zh-CN",
    label: "Chinese",
    native: "ä¸­æ–‡",
    flag: "ZH",
    country: "CN",
  },
];

const FlagMark = ({ country, width = 16, height = 12 }) => {
  const FlagComponent = ReactCountryFlag[country];
  if (!FlagComponent) return null;
  return (
    <FlagComponent
      style={{
        width,
        height,
        borderRadius: 2,
        display: "inline-block",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
      }}
    />
  );
};

const parseDateValue = (value) => {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const ms = value > 1e12 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && String(value).trim() !== "") {
    const ms = numeric > 1e12 ? numeric : numeric * 1000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d;
  }
  let normalized = String(value).trim();
  // Supports DB format like "2026-04-01 17:10:31+00"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}$/.test(normalized)) {
    normalized = normalized.replace(" ", "T") + ":00";
  } else if (
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(normalized)
  ) {
    normalized = normalized.replace(" ", "T");
  } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}Z$/.test(normalized)) {
    normalized = normalized.replace(" ", "T");
  }
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getCookieDomains = () => {
  const host = window.location.hostname;
  const domains = [undefined];
  if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return domains;
  }
  const parts = host.split(".");
  if (parts.length >= 2) {
    domains.push(`.${parts.slice(-2).join(".")}`);
  }
  return domains;
};

const writeGoogTransCookie = (value, maxAgeSeconds) => {
  const attrsBase = `path=/; max-age=${maxAgeSeconds}`;
  getCookieDomains().forEach((domain) => {
    const domainAttr = domain ? `; domain=${domain}` : "";
    document.cookie = `googtrans=${encodeURIComponent(value)}; ${attrsBase}${domainAttr}`;
  });
};

const clearGoogTransCookie = () => {
  if (typeof document === "undefined") return;
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  getCookieDomains().forEach((domain) => {
    const domainAttr = domain ? `; domain=${domain}` : "";
    document.cookie = `googtrans=; path=/; expires=${expires}${domainAttr}`;
    document.cookie = `googtrans=${encodeURIComponent("/en/en")}; path=/; expires=${expires}${domainAttr}`;
  });
};

const setGoogTransCookie = (lang) => {
  if (typeof document === "undefined") return;
  clearGoogTransCookie();
  if (lang === "en") return;
  writeGoogTransCookie(`/en/${lang}`, 31536000);
};

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [activityItems, setActivityItems] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem("themeMode");
    return saved || "light";
  });
  const [uiLanguage, setUiLanguage] = useState(() => {
    const saved = localStorage.getItem("uiLanguage");
    return TRANSLATE_LANGUAGES.some((l) => l.value === saved) ? saved : "en";
  });
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [tenantSubscription, setTenantSubscription] = useState(null);
  const [tenantSubscriptionLoaded, setTenantSubscriptionLoaded] = useState(false);
  const pendingLanguageRef = useRef(uiLanguage);
  const translateInitRef = useRef(null);

  const applyLanguageToWidget = (lang, attempt = 0) => {
    const combo = document.querySelector(".goog-te-combo");
    const targetValue = lang === "en" ? "" : lang;
    if (combo) {
      if (combo.value !== targetValue) {
        combo.value = targetValue;
        combo.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }
    if (attempt === 0 && typeof translateInitRef.current === "function") {
      translateInitRef.current();
    }
    if (attempt < 100) {
      window.setTimeout(() => applyLanguageToWidget(lang, attempt + 1), 150);
    }
  };

  const forceHideTranslateBanner = () => {
    if (typeof document === "undefined") return;
    const nodes = document.querySelectorAll(
      "iframe.goog-te-banner-frame, .goog-te-banner-frame, .goog-te-balloon-frame, #goog-gt-tt, body > .skiptranslate",
    );
    nodes.forEach((node) => {
      node.style.setProperty("display", "none", "important");
      node.style.setProperty("visibility", "hidden", "important");
      node.style.setProperty("height", "0", "important");
      node.style.setProperty("min-height", "0", "important");
    });
    if (document.body) {
      document.body.style.setProperty("top", "0px", "important");
      document.body.style.setProperty("position", "static", "important");
    }
    if (document.documentElement) {
      document.documentElement.style.setProperty("top", "0px", "important");
    }
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const isSuperadmin = profile?.role === "superadmin";
  const EXPIRED_ALLOWED_ROUTES = new Set(["/subscription", "/subscription-expired"]);

  useEffect(() => {
    if (!profile?.tenant_id || isSuperadmin) {
      setTenantSubscription(null);
      setTenantSubscriptionLoaded(true);
      return;
    }
    let active = true;
    const loadTenantSubscription = async () => {
      setTenantSubscriptionLoaded(false);
      try {
        const { data, error } = await supabase
          .from("tenants")
          .select(
            "id, plan, status, current_period_end, subscription_end_date, subscription_end, trial_ends_at, auto_renew, plan_override",
          )
          .eq("id", profile.tenant_id)
          .maybeSingle();

        if (error) {
          console.error("Failed to load tenant subscription in MainLayout:", error);
        }

        if (active) {
          setTenantSubscription(data || null);
          setTenantSubscriptionLoaded(true);
        }
      } catch (error) {
        console.error("Unexpected error loading tenant subscription in MainLayout:", error);
        if (active) {
          setTenantSubscription(null);
          setTenantSubscriptionLoaded(true);
        }
      }
    };
    loadTenantSubscription();
    return () => {
      active = false;
    };
  }, [profile?.tenant_id, isSuperadmin]);

  const getSubscriptionLockState = () => {
    if (isSuperadmin || !profile?.tenant_id) {
      return { locked: false, message: "" };
    }
    if (!tenantSubscriptionLoaded) {
      return { locked: false, message: "" };
    }
    if (!tenantSubscription) {
      return {
        locked: true,
        message:
          "We could not verify your subscription. Please reactivate or upgrade to continue.",
      };
    }
    const now = Date.now();
    const status = String(tenantSubscription.status || "").toLowerCase();
    const isPlanOverride = tenantSubscription.plan_override === true;
    if (isPlanOverride) {
      return { locked: false, message: "" };
    }
    const endDate = parseDateValue(tenantSubscription.current_period_end);
    const trialEnd = parseDateValue(tenantSubscription.trial_ends_at);
    const isCancelled = status === "cancelled";
    const isInactiveStatus = ["expired", "inactive", "suspended"].includes(
      status,
    );
    const hasTrialEnded = !!trialEnd && trialEnd.getTime() < now;
    const didBillingAdvancePastTrial =
      !!(trialEnd && endDate && endDate.getTime() > trialEnd.getTime());
    const isTrialExpired =
      hasTrialEnded &&
      (["trial", "trialing", "on_trial"].includes(status) ||
        !didBillingAdvancePastTrial);
    const isPeriodEnded = endDate && endDate.getTime() < now;
    const isCancelledEnded = isCancelled && endDate && endDate.getTime() < now;
    const locked = !!(
      isInactiveStatus ||
      isTrialExpired ||
      isPeriodEnded ||
      isCancelledEnded
    );
    const message = isTrialExpired
      ? "Your trial has expired. Upgrade to continue."
      : "Your subscription has expired. Upgrade or reactivate to restore access.";
    return { locked, message };
  };

  const subscriptionLock = getSubscriptionLockState();
  const isPmOrEmployee =
    profile?.role === "project_manager" || profile?.role === "employee";
  const lockTargetRoute = isPmOrEmployee ? "/subscription-expired" : "/subscription";
  const isSidebarHardDisabled = subscriptionLock.locked && isPmOrEmployee;
  const showSubscriptionBanner = subscriptionLock.locked && !isPmOrEmployee;
  const isRouteLocked = (route) =>
    subscriptionLock.locked && !EXPIRED_ALLOWED_ROUTES.has(route);

  useEffect(() => {
    localStorage.setItem("themeMode", themeMode);
    window.dispatchEvent(
      new CustomEvent("themeModeChanged", { detail: { themeMode } }),
    );
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncViewport = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setCollapsed((prev) => (mobile ? true : prev));
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initTranslate = () => {
      if (!window.google?.translate?.TranslateElement) return;
      const el = document.getElementById("google_translate_element");
      if (!el || el.dataset.initialized === "true") return;
      // Hidden widget, we drive language changes from our own selector.
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
          includedLanguages: TRANSLATE_LANGUAGES.map((l) => l.value).join(","),
        },
        "google_translate_element",
      );
      el.dataset.initialized = "true";
      const target = pendingLanguageRef.current || "en";
      if (target !== "en") {
        applyLanguageToWidget(target);
      }
    };
    translateInitRef.current = initTranslate;

    if (window.google?.translate?.TranslateElement) {
      initTranslate();
      return;
    }

    window.__resosyncerTranslateInit = initTranslate;
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=__resosyncerTranslateInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    forceHideTranslateBanner();
    const obs = new MutationObserver(() => forceHideTranslateBanner());
    obs.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    const interval = window.setInterval(forceHideTranslateBanner, 500);
    return () => {
      obs.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("uiLanguage") || "en";
    const savedValid = TRANSLATE_LANGUAGES.some((l) => l.value === saved);
    const initial = savedValid ? saved : "en";
    setUiLanguage(initial);
    pendingLanguageRef.current = initial;
    setGoogTransCookie(initial);
    if (initial !== "en") {
      applyLanguageToWidget(initial);
    }
  }, []);

  const getEffectiveTheme = () => {
    if (themeMode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return themeMode;
  };

  const isDarkMode = getEffectiveTheme() === "dark";

  useEffect(() => {
    if (themeMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => setThemeMode("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [themeMode]);

  useEffect(() => {
    if (profile?.id) {
      fetchUnreadCount();
      const channel = supabase
        .channel("unread-messages")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${profile.id}`,
          },
          () => fetchUnreadCount(),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `sender_id=neq.${profile.id}`,
          },
          () => fetchUnreadCount(),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "message_read_status",
            filter: `user_id=eq.${profile.id}`,
          },
          () => fetchUnreadCount(),
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [profile]);

  const fetchUnreadCount = async () => {
    if (!profile?.id) {
      setUnreadCount(0);
      setActivityItems([]);
      return;
    }

    setActivityLoading(true);

    try {
      const tenantId = profile?.tenant_id || null;

      let dmUnreadQuery = supabase
        .from("messages")
        .select(
          "id,sender_id,message,file_type,created_at,sender:profiles!messages_sender_id_fkey(id,full_name,user_photo)",
        )
        .eq("receiver_id", profile.id)
        .is("channel_id", null)
        .neq("sender_id", profile.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false });
      if (tenantId) dmUnreadQuery = dmUnreadQuery.eq("tenant_id", tenantId);
      const { data: dmUnreadMessages, error: dmError } = await dmUnreadQuery;
      if (dmError) throw dmError;

      const dmCount = dmUnreadMessages?.length || 0;

      let channelMembershipQuery = supabase
        .from("channel_members")
        .select("channel_id")
        .eq("user_id", profile.id);
      if (tenantId) {
        channelMembershipQuery = channelMembershipQuery.eq(
          "tenant_id",
          tenantId,
        );
      }
      const { data: membershipRows, error: membershipError } =
        await channelMembershipQuery;
      if (membershipError) throw membershipError;

      const channelIds = Array.from(
        new Set(
          (membershipRows || []).map((row) => row.channel_id).filter(Boolean),
        ),
      );

      let unreadChannelMessages = [];
      let channelNameMap = {};

      if (channelIds.length > 0) {
        let channelNameQuery = supabase
          .from("channels")
          .select("id,name")
          .in("id", channelIds);
        if (tenantId)
          channelNameQuery = channelNameQuery.eq("tenant_id", tenantId);

        let channelMessagesQuery = supabase
          .from("messages")
          .select(
            "id,sender_id,channel_id,message,file_type,created_at,sender:profiles!messages_sender_id_fkey(id,full_name,user_photo)",
          )
          .in("channel_id", channelIds)
          .neq("sender_id", profile.id);
        if (tenantId)
          channelMessagesQuery = channelMessagesQuery.eq("tenant_id", tenantId);

        const [
          { data: channelRows, error: channelRowsError },
          { data: channelMessages, error: channelMessagesError },
        ] = await Promise.all([channelNameQuery, channelMessagesQuery]);

        if (channelRowsError) throw channelRowsError;
        if (channelMessagesError) throw channelMessagesError;

        channelNameMap = (channelRows || []).reduce((acc, row) => {
          acc[row.id] = row.name;
          return acc;
        }, {});

        const messageIds = (channelMessages || []).map((m) => m.id);
        let readMessageIds = new Set();

        if (messageIds.length > 0) {
          const { data: readStatus, error: readError } = await supabase
            .from("message_read_status")
            .select("message_id")
            .eq("user_id", profile.id)
            .in("message_id", messageIds);
          if (readError) throw readError;
          readMessageIds = new Set((readStatus || []).map((r) => r.message_id));
        }

        unreadChannelMessages = (channelMessages || []).filter(
          (msg) => !readMessageIds.has(msg.id),
        );
      }

      const makePreviewText = (msg) => {
        const text = msg?.message?.trim();
        if (text) return text;
        if (msg?.file_type === "voice") return "Voice message";
        if (msg?.file_type === "image") return "Image";
        if (msg?.file_type === "video") return "Video";
        if (msg?.file_type) return "File";
        return "New message";
      };

      const dmItems = (dmUnreadMessages || []).map((msg) => ({
        id: `dm-${msg.id}`,
        senderName: msg.sender?.full_name || "Unknown user",
        senderPhoto: msg.sender?.user_photo || null,
        preview: makePreviewText(msg),
        createdAt: msg.created_at,
        scopeLabel: "Direct message",
      }));

      const channelItems = unreadChannelMessages.map((msg) => ({
        id: `ch-${msg.id}`,
        senderName: msg.sender?.full_name || "Unknown user",
        senderPhoto: msg.sender?.user_photo || null,
        preview: makePreviewText(msg),
        createdAt: msg.created_at,
        scopeLabel: `#${channelNameMap[msg.channel_id] || "channel"}`,
      }));

      const previewItems = [...dmItems, ...channelItems]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 6);

      setActivityItems(previewItems);
      setUnreadCount(dmCount + unreadChannelMessages.length);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    } finally {
      setActivityLoading(false);
    }
  };

  const ALL_ADMIN_ROUTES = {
    "/dashboard": { icon: <DashboardOutlined />, label: "Dashboard" },
    "/projects": { icon: <ProjectOutlined />, label: "Projects" },
    "/employees": { icon: <IdcardOutlined />, label: "Employees" },
    "/teams": { icon: <TeamOutlined />, label: "Teams" },
    "/meetings": { icon: <VideoCameraOutlined />, label: "Meetings" },
    "/monitor": { icon: <CalendarOutlined />, label: "Attendance" },
    "/payroll": { icon: <PieChartOutlined />, label: "Payroll" },
    "/standups": { icon: <BarChartOutlined />, label: "Standup Stats" },
    "/requests": { icon: <FileTextOutlined />, label: "Requests" },
    "/leads": { icon: <CustomerServiceOutlined />, label: "Leads" },
    "/payments": { icon: <DollarOutlined />, label: "Payments" },
    "/recruitment": { icon: <UserAddOutlined />, label: "Recruitment" },
    "/contract-maker": { icon: <FileProtectOutlined />, label: "Contracts" },
    "/training-material": { icon: <ReadOutlined />, label: "Training" },
    "/documents": { icon: <FolderOutlined />, label: "Documents" },
    "/communication": { icon: <MessageOutlined />, label: "Communication" },
    "/support": {
      icon: <CustomerServiceOutlined />,
      label: "Customer Support",
    },
    "/report-problem": { icon: <AlertOutlined />, label: "Report a Problem" },
    "/subscription": { icon: <CreditCardOutlined />, label: "Subscription" },
    "/settings": { icon: <SettingOutlined />, label: "Settings" },
  };
  const ALWAYS_VISIBLE_ADMIN_ROUTES = new Set([
    "/meetings",
    "/support",
    "/report-problem",
  ]);

  const ADMIN_GROUPS = [
    {
      key: "main",
      label: "Workspace",
      routes: ["/dashboard", "/projects", "/employees", "/teams"],
    },
    {
      key: "operations",
      label: "Operations",
      routes: [
        "/meetings",
        "/monitor",
        "/payroll",
        "/standups",
        "/requests",
        "/leads",
        "/payments",
      ],
    },
    {
      key: "resources",
      label: "Resources",
      routes: [
        "/recruitment",
        "/contract-maker",
        "/training-material",
        "/documents",
        "/communication",
        "/subscription",
        "/settings",
      ],
    },
    {
      key: "support",
      label: "Support",
      routes: ["/support", "/report-problem"],
    },
  ];

  const getMenuItems = () => {
    const superadminMenuItems = [
      {
        key: "platform-overview",
        type: "group",
        label: collapsed ? null : "Platform",
        children: [
          { key: "/dashboard", icon: <DashboardOutlined />, label: "Overview" },
          { key: "/tenants", icon: <ApartmentOutlined />, label: "Tenants" },
          {
            key: "/subscription-plans",
            icon: <CrownOutlined />,
            label: "Subscription Plans",
          },
          { key: "/discounts", icon: <BankOutlined />, label: "Discounts" },
          {
            key: "/support",
            icon: <CustomerServiceOutlined />,
            label: "Support",
          },
        ],
      },
      {
        key: "platform-analytics",
        type: "group",
        label: collapsed ? null : "Analytics",
        children: [
          {
            key: "/analytics",
            icon: <LineChartOutlined />,
            label: "Analytics",
          },
          { key: "/usage", icon: <FundOutlined />, label: "Usage" },
          {
            key: "/audit-logs",
            icon: <SafetyCertificateOutlined />,
            label: "Audit Logs",
          },
        ],
      },
      {
        key: "platform-system",
        type: "group",
        label: collapsed ? null : "System",
        children: [
          {
            key: "/feature-flags",
            icon: <ExperimentOutlined />,
            label: "Feature Flags",
          },
          { key: "/api-keys", icon: <KeyOutlined />, label: "API Keys" },
          {
            key: "/integrations",
            icon: <ApiOutlined />,
            label: "Integrations",
          },
          {
            key: "/email-templates",
            icon: <MailOutlined />,
            label: "Email Templates",
          },
          { key: "/system-health", icon: <HddOutlined />, label: "Health" },
          { key: "/alerts", icon: <AlertOutlined />, label: "Alerts" },
          { key: "/settings", icon: <SettingOutlined />, label: "Settings" },
        ],
      },
    ];

    // â”€â”€ Admin menu â€” filtered by profile.permissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const adminPermissions = Array.isArray(profile?.permissions)
      ? new Set(profile.permissions)
      : null; // null = no restrictions (full access)

    const adminMenuItems = ADMIN_GROUPS.map((group) => {
      const children = group.routes
        .filter(
          (route) =>
            !adminPermissions ||
            adminPermissions.has(route) ||
            ALWAYS_VISIBLE_ADMIN_ROUTES.has(route),
        )
        .map((route) => ({
          key: route,
          icon: ALL_ADMIN_ROUTES[route].icon,
          label: ALL_ADMIN_ROUTES[route].label,
          disabled: isRouteLocked(route),
        }));

      // Skip the entire group if it has no visible children
      if (children.length === 0) return null;

      return {
        key: group.key,
        type: "group",
        label: collapsed ? null : group.label,
        children,
      };
    }).filter(Boolean);

    // â”€â”€ PM menu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const pmMenuItems = [
      {
        key: "main",
        type: "group",
        label: collapsed ? null : "Workspace",
        children: [
          {
            key: "/dashboard",
            icon: <DashboardOutlined />,
            label: "Dashboard",
            disabled: isRouteLocked("/dashboard"),
          },
          {
            key: "/projects",
            icon: <ProjectOutlined />,
            label: "Projects",
            disabled: isRouteLocked("/projects"),
          },
          {
            key: "/requests",
            icon: <FileTextOutlined />,
            label: "Requests",
            disabled: isRouteLocked("/requests"),
          },
        ],
      },
      {
        key: "operations",
        type: "group",
        label: collapsed ? null : "Operations",
        children: [
          {
            key: "/meetings",
            icon: <VideoCameraOutlined />,
            label: "Meetings",
            disabled: isRouteLocked("/meetings"),
          },
          {
            key: "/standups",
            icon: <CommentOutlined />,
            label: "Standups",
            disabled: isRouteLocked("/standups"),
          },
          {
            key: "/planning",
            icon: <AuditOutlined />,
            label: "Planning",
            disabled: isRouteLocked("/planning"),
          },
          {
            key: "/communication",
            icon: <MessageOutlined />,
            label: "Communication",
            disabled: isRouteLocked("/communication"),
          },
          {
            key: "/settings",
            icon: <SettingOutlined />,
            label: "Profile",
            disabled: isRouteLocked("/settings"),
          },
        ],
      },
      {
        key: "support",
        type: "group",
        label: collapsed ? null : "Support",
        children: [
          {
            key: "/report-problem",
            icon: <AlertOutlined />,
            label: "Report a Problem",
            disabled: isRouteLocked("/report-problem"),
          },
        ],
      },
    ];

    const employeeMenuItems = [
      {
        key: "main",
        type: "group",
        label: collapsed ? null : "Workspace",
        children: [
          {
            key: "/dashboard",
            icon: <DashboardOutlined />,
            label: "Dashboard",
            disabled: isRouteLocked("/dashboard"),
          },
          {
            key: "/projects",
            icon: <ProjectOutlined />,
            label: "My Projects",
            disabled: isRouteLocked("/projects"),
          },
          {
            key: "/requests",
            icon: <FileTextOutlined />,
            label: "Requests",
            disabled: isRouteLocked("/requests"),
          },
        ],
      },
      {
        key: "operations",
        type: "group",
        label: collapsed ? null : "Operations",
        children: [
          {
            key: "/meetings",
            icon: <VideoCameraOutlined />,
            label: "Meetings",
            disabled: isRouteLocked("/meetings"),
          },
          {
            key: "/standups",
            icon: <CommentOutlined />,
            label: "Standups",
            disabled: isRouteLocked("/standups"),
          },
          {
            key: "/attendance",
            icon: <CalendarOutlined />,
            label: "Attendance",
            disabled: isRouteLocked("/attendance"),
          },
          {
            key: "/communication",
            icon: <MessageOutlined />,
            label: "Communication",
            disabled: isRouteLocked("/communication"),
          },
        ],
      },
      {
        key: "resources",
        type: "group",
        label: collapsed ? null : "Resources",
        children: [
          {
            key: "/training-material",
            icon: <ReadOutlined />,
            label: "Training",
            disabled: isRouteLocked("/training-material"),
          },
          {
            key: "/profile",
            icon: <IdcardOutlined />,
            label: "Profile",
            disabled: isRouteLocked("/profile"),
          },
        ],
      },
      {
        key: "support",
        type: "group",
        label: collapsed ? null : "Support",
        children: [
          {
            key: "/report-problem",
            icon: <AlertOutlined />,
            label: "Report a Problem",
            disabled: isRouteLocked("/report-problem"),
          },
        ],
      },
    ];

    if (profile?.role === "superadmin") return superadminMenuItems;
    if (profile?.role === "project_manager") return pmMenuItems;
    if (profile?.role === "employee") return employeeMenuItems;
    return adminMenuItems;
  };

  const menuItems = getMenuItems();

  const handleMenuClick = ({ key }) => {
    if (key.startsWith("/")) {
      if (isRouteLocked(key)) {
        navigate(lockTargetRoute);
        return;
      }
      navigate(key);
      if (window.innerWidth < 768) setCollapsed(true);
    }
  };

  useEffect(() => {
    if (isRouteLocked(location.pathname)) {
      navigate(lockTargetRoute, { replace: true });
    }
  }, [location.pathname, navigate, subscriptionLock.locked, lockTargetRoute]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const applyLanguage = (lang) => {
    if (lang === uiLanguage) return;
    setUiLanguage(lang);
    localStorage.setItem("uiLanguage", lang);
    pendingLanguageRef.current = lang;
    setGoogTransCookie(lang);
    if (lang === "en") {
      const combo = document.querySelector(".goog-te-combo");
      if (combo) {
        combo.value = "";
        combo.dispatchEvent(new Event("change", { bubbles: true }));
      }
      document.body?.classList.remove("translated-ltr", "translated-rtl");
      document.documentElement?.removeAttribute("lang");
    } else {
      applyLanguageToWidget(lang);
    }
    forceHideTranslateBanner();
    window.location.reload();
  };

  // â”€â”€â”€ Color tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const t = isDarkMode
    ? {
        bg: "#0c0c0e",
        surface: "#141416",
        surfaceRaised: "#1c1c1f",
        border: "#242428",
        borderSubtle: "#1a1a1e",
        text: "#f2f2f5",
        textSub: "#8a8a96",
        textMuted: "#54545f",
        accent: "#5e6ad2",
        accentSubtle: "rgba(94,106,210,0.12)",
        accentHover: "rgba(94,106,210,0.18)",
        hover: "rgba(255,255,255,0.04)",
        activeItem: "rgba(94,106,210,0.14)",
        activeText: "#818cf8",
        shadow: "0 0 0 1px rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.4)",
      }
    : {
        bg: "#f5f5f7",
        surface: "#ffffff",
        surfaceRaised: "#ffffff",
        border: "#e8e8ed",
        borderSubtle: "#f0f0f5",
        text: "#1a1a1e",
        textSub: "#6e6e7a",
        textMuted: "#aeaeb8",
        accent: "#5e6ad2",
        accentSubtle: "rgba(94,106,210,0.08)",
        accentHover: "rgba(94,106,210,0.14)",
        hover: "rgba(0,0,0,0.03)",
        activeItem: "rgba(94,106,210,0.10)",
        activeText: "#5e6ad2",
        shadow: "0 0 0 1px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.06)",
      };

  const customTheme = {
    algorithm: isDarkMode
      ? antdTheme.darkAlgorithm
      : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: "#5e6ad2",
      borderRadius: 8,
      colorBgContainer: t.surface,
      colorBgElevated: t.surfaceRaised,
      colorBgLayout: t.bg,
      colorBorder: t.border,
      colorText: t.text,
      colorTextSecondary: t.textSub,
      fontFamily:
        "'Geist', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    components: {
      Layout: { headerBg: t.surface, siderBg: t.surface, bodyBg: t.bg },
      Menu: {
        itemBg: "transparent",
        itemSelectedBg: t.activeItem,
        itemHoverBg: t.hover,
        itemSelectedColor: t.activeText,
        itemColor: t.textSub,
        groupTitleColor: t.textMuted,
      },
    },
  };

  const pageTitles = {
    "/dashboard": isSuperadmin ? "Overview" : "Dashboard",
    "/projects": "Projects",
    "/employees": "Employees",
    "/teams": "Teams",
    "/requests": "Requests",
    "/attendance": "Attendance",
    "/monitor": "Attendance",
    "/payroll": "Payroll",
    "/standups": "Standup Stats",
    "/planning": "Planning",
    "/leads": "Leads",
    "/payments": "Payments",
    "/recruitment": "Recruitment",
    "/contract-maker": "Contracts",
    "/training-material": "Training",
    "/documents": "Documents",
    "/communication": "Communication",
    "/support": "Support",
    "/report-problem": "Report a Problem",
    "/letters": "Letters",
    "/profile": "Profile",
    "/settings": "Settings",
    "/tenants": "Tenants",
    "/users": "Users",
    "/subscription-plans": "Subscription Plans",
    "/billing": "Billing",
    "/analytics": "Analytics",
    "/usage": "Usage",
    "/audit-logs": "Audit Logs",
    "/feature-flags": "Feature Flags",
    "/api-keys": "API Keys",
    "/integrations": "Integrations",
    "/email-templates": "Email Templates",
    "/system-health": "System Health",
    "/alerts": "Alerts",
  };

  const roleLabel = {
    superadmin: "Super Admin",
    project_manager: "Project Manager",
    employee: "Employee",
    admin: "Admin",
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "My Profile",
      onClick: () => navigate("/settings"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sign out",
      onClick: handleSignOut,
      danger: true,
    },
  ];

  const themeMenuItems = [
    {
      key: "light",
      icon: <SunOutlined />,
      label: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          Light{" "}
          {themeMode === "light" && (
            <CheckOutlined style={{ fontSize: "11px", color: t.accent }} />
          )}
        </span>
      ),
      onClick: () => setThemeMode("light"),
    },
    {
      key: "dark",
      icon: <MoonOutlined />,
      label: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          Dark{" "}
          {themeMode === "dark" && (
            <CheckOutlined style={{ fontSize: "11px", color: t.accent }} />
          )}
        </span>
      ),
      onClick: () => setThemeMode("dark"),
    },
    {
      key: "system",
      icon: <DesktopOutlined />,
      label: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          System{" "}
          {themeMode === "system" && (
            <CheckOutlined style={{ fontSize: "11px", color: t.accent }} />
          )}
        </span>
      ),
      onClick: () => setThemeMode("system"),
    },
  ];

  const currentLanguage =
    TRANSLATE_LANGUAGES.find((lang) => lang.value === uiLanguage) ||
    TRANSLATE_LANGUAGES.find((lang) => lang.value === "en") ||
    TRANSLATE_LANGUAGES[0];
  const languageMenuItems = TRANSLATE_LANGUAGES.map((lang) => ({
    key: lang.value,
    label: (
      <span className="rs-lang-option">
        <span className="rs-lang-option-flag">
          <FlagMark country={lang.country} width={30} height={20} />
        </span>
        <span className="rs-lang-option-main">
          <span className="rs-lang-option-name">{lang.label}</span>
          <span className="rs-lang-option-code">({lang.flag})</span>
        </span>
        {uiLanguage === lang.value && (
          <span className="rs-lang-option-check">
            <CheckOutlined style={{ fontSize: 11 }} />
          </span>
        )}
      </span>
    ),
  }));

  const SIDER_WIDTH = 232;
  const SIDER_COLLAPSED = 64;
  const formatActivityTime = (timestamp) => {
    if (!timestamp) return "";
    const diffMs = Date.now() - new Date(timestamp).getTime();
    if (Number.isNaN(diffMs)) return "";
    const minutes = Math.max(0, Math.floor(diffMs / 60000));
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
  };
  const activityPopoverContent = (
    <div style={{ width: 336, maxWidth: "calc(100vw - 24px)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 620, color: t.text }}>
          Unread messages
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: t.activeText,
            background: t.activeItem,
            borderRadius: 999,
            padding: "2px 8px",
          }}
        >
          {unreadCount}
        </span>
      </div>

      <div style={{ maxHeight: 320, overflowY: "auto", padding: "6px" }}>
        {activityLoading ? (
          <div
            style={{ padding: "12px 10px", fontSize: 12.5, color: t.textSub }}
          >
            Loading unread activity...
          </div>
        ) : activityItems.length === 0 ? (
          <div
            style={{ padding: "12px 10px", fontSize: 12.5, color: t.textSub }}
          >
            No unread messages
          </div>
        ) : (
          activityItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate("/communication")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                textAlign: "left",
                border: "none",
                background: "transparent",
                borderRadius: 8,
                padding: "8px",
                cursor: "pointer",
              }}
            >
              <Avatar
                size={32}
                src={item.senderPhoto}
                icon={<UserOutlined />}
                style={{ flexShrink: 0, border: `1px solid ${t.border}` }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 610,
                      color: t.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.senderName}
                  </span>
                  <span
                    style={{ fontSize: 11, color: t.textMuted, flexShrink: 0 }}
                  >
                    {formatActivityTime(item.createdAt)}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 10.5,
                    fontWeight: 650,
                    color: t.activeText,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.scopeLabel}
                </div>
                <div
                  style={{
                    marginTop: 3,
                    fontSize: 12,
                    color: t.textSub,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.preview}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div style={{ padding: "8px", borderTop: `1px solid ${t.border}` }}>
        <button
          onClick={() => navigate("/communication")}
          style={{
            width: "100%",
            border: `1px solid ${t.border}`,
            background: t.surface,
            color: t.text,
            borderRadius: 8,
            height: 32,
            fontSize: 12.5,
            fontWeight: 580,
            cursor: "pointer",
          }}
        >
          Open Communication
        </button>
      </div>
    </div>
  );

  return (
    <ThemeContext.Provider value={{ isDarkMode }}>
      <div
        id="google_translate_element"
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
      />
      {/* Google Font: Geist */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body { background: ${t.bg} !important; }
        body { top: 0 !important; }
        iframe.goog-te-banner-frame,
        iframe.goog-te-banner-frame.skiptranslate,
        .goog-te-banner-frame,
        .goog-te-balloon-frame,
        body > .skiptranslate,
        #goog-gt-tt {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }
        html[lang] body {
          top: 0 !important;
        }

        /* â”€â”€ Scrollbar â”€â”€ */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 4px; }

        /* â”€â”€ Sidebar menu â”€â”€ */
        .rs-menu .ant-menu-item-group-title {
          padding: 16px 12px 4px !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          color: ${t.textMuted} !important;
          user-select: none;
        }
        .rs-menu .ant-menu-item {
          height: 36px !important;
          line-height: 36px !important;
          margin: 1px 8px !important;
          width: calc(100% - 16px) !important;
          border-radius: 7px !important;
          padding: 0 10px !important;
          font-size: 13.5px !important;
          font-weight: 450 !important;
          letter-spacing: -0.01em !important;
          transition: background 0.15s ease !important;
        }
        .rs-menu .ant-menu-item:hover { background: ${t.hover} !important; }
        .rs-menu .ant-menu-item-selected {
          background: ${t.activeItem} !important;
          font-weight: 520 !important;
        }
        .rs-menu .ant-menu-item-selected .ant-menu-item-icon,
        .rs-menu .ant-menu-item-selected .ant-menu-title-content {
          color: ${t.activeText} !important;
        }
        .rs-menu .ant-menu-item::after { display: none !important; }
        .rs-menu .ant-menu-item-icon { font-size: 15px !important; }

        /* Collapsed state â€” center icons */
        .rs-sider-collapsed .rs-menu .ant-menu-item {
          margin: 1px 4px !important;
          width: calc(100% - 8px) !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .rs-sider-collapsed .rs-menu .ant-menu-item-group-title {
          padding: 12px 0 4px !important;
          text-align: center !important;
          font-size: 0 !important;
        }

        /* â”€â”€ Hover utility â”€â”€ */
        .rs-icon-btn:hover { background: ${t.hover} !important; }
        .rs-user-btn:hover { background: ${t.hover} !important; }

        /* â”€â”€ Language selector â”€â”€ */
        .rs-lang-btn {
          height: 36px;
          min-width: 36px;
          border: 1px solid ${t.border};
          background: ${isDarkMode ? "#151b22" : "#f8fbff"};
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 ${isMobile ? "8px" : "10px"};
          cursor: pointer;
          transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
          color: ${t.textSub};
          box-shadow: none;
          outline: none;
        }
        .rs-lang-btn:hover {
          border-color: ${t.border};
          box-shadow: none;
          transform: translateY(-1px);
        }
        .rs-lang-btn.open { border-color: ${t.border}; }
        .rs-lang-btn:focus,
        .rs-lang-btn:focus-visible {
          outline: none;
          border-color: ${t.border};
          box-shadow: none;
        }
        .rs-lang-current {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          max-width: ${isMobile ? "84px" : "152px"};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rs-lang-current-flag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid ${isDarkMode ? "#2d3a48" : "#cfe0f6"};
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .rs-lang-current-main {
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          min-width: 0;
        }
        .rs-lang-current-name {
          font-size: 12px;
          font-weight: 540;
          color: ${t.text};
          max-width: 104px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rs-lang-current-code {
          font-size: 10px;
          color: ${t.textMuted};
          opacity: .9;
          max-width: 44px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rs-lang-current-mobile {
          font-size: 10px;
          font-weight: 700;
          color: ${t.text};
        }
        .rs-lang-caret {
          color: ${isDarkMode ? "#8ea8c5" : "#5f748f"};
          font-size: 10px;
          display: inline-flex;
          transition: transform .16s ease;
        }
        .rs-lang-btn.open .rs-lang-caret { transform: rotate(180deg); }
        .rs-lang-dropdown {
          min-width: 214px;
        }
        .rs-lang-dropdown .ant-dropdown-menu {
          padding: 6px !important;
          border-radius: 10px !important;
          background: ${isDarkMode ? "#151b22" : "#f8fbff"} !important;
          border-color: ${isDarkMode ? "#253142" : "#cfe0f6"} !important;
          box-shadow: 0 20px 36px ${isDarkMode ? "rgba(0,0,0,0.35)" : "rgba(29,84,145,0.18)"} !important;
        }
        .rs-lang-dropdown .ant-dropdown-menu-item {
          padding: 7px 8px !important;
          border-radius: 8px !important;
          margin: 2px !important;
        }
        .rs-lang-dropdown .ant-dropdown-menu-item:hover {
          background: ${isDarkMode ? "#1d2632" : "#eaf3ff"} !important;
        }
        .rs-lang-dropdown .ant-dropdown-menu-item-active,
        .rs-lang-dropdown .ant-dropdown-menu-item-selected {
          background: ${isDarkMode ? "#1f2f43" : "#e1eeff"} !important;
        }
        .rs-lang-option {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }
        .rs-lang-option-flag {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          border: 1px solid ${isDarkMode ? "#2d3a48" : "#cfe0f6"};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          background: ${isDarkMode ? "#121821" : "#ffffff"};
        }
        .rs-lang-option-main {
          display: inline-flex;
          align-items: baseline;
          gap: 6px;
          min-width: 0;
          flex: 1;
        }
        .rs-lang-option-name {
          font-size: 12px;
          font-weight: 530;
          color: ${t.text};
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rs-lang-option-code {
          font-size: 10px;
          color: ${t.textMuted};
          opacity: .9;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rs-lang-option-check {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          background: ${isDarkMode ? "rgba(83,164,255,0.18)" : "rgba(75,155,255,0.18)"};
          color: ${isDarkMode ? "#7ec0ff" : "#2e82f2"};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1px ${isDarkMode ? "rgba(126,192,255,0.35)" : "rgba(46,130,242,0.25)"};
        }
        .rs-activity-popover .ant-popover-inner {
          padding: 0 !important;
          border-radius: 12px !important;
          background: ${t.surfaceRaised} !important;
          border: 1px solid ${t.border} !important;
          box-shadow: ${t.shadow} !important;
          overflow: hidden;
        }
        .rs-activity-popover .ant-popover-inner-content {
          padding: 0 !important;
        }

        /* â”€â”€ Ant dropdown tweaks â”€â”€ */
        .ant-dropdown-menu {
          background: ${t.surfaceRaised} !important;
          border: 1px solid ${t.border} !important;
          box-shadow: ${t.shadow} !important;
          border-radius: 10px !important;
          padding: 4px !important;
          font-family: 'Geist', -apple-system, sans-serif !important;
          font-size: 13px !important;
        }
        .ant-dropdown-menu-item {
          border-radius: 6px !important;
          color: ${t.text} !important;
          font-size: 13px !important;
          padding: 6px 10px !important;
        }
        .ant-dropdown-menu-item:hover { background: ${t.hover} !important; }
        .ant-dropdown-menu-item-danger { color: #f87171 !important; }
        .ant-dropdown-menu-item-divider { background: ${t.border} !important; margin: 4px 0 !important; }

        /* â”€â”€ Badge â”€â”€ */
        .ant-badge-count {
          background: ${t.accent} !important;
          font-size: 10px !important;
          min-width: 16px !important;
          height: 16px !important;
          line-height: 16px !important;
          padding: 0 4px !important;
        }
      `}</style>

      <ConfigProvider theme={customTheme}>
        <Layout
          style={{
            minHeight: "100vh",
            background: t.bg,
            fontFamily: "'Geist', -apple-system, sans-serif",
          }}
        >
          {isMobile && !collapsed && (
            <div
              onClick={() => setCollapsed(true)}
              aria-hidden="true"
              style={{
                position: "fixed",
                inset: 0,
                background: isDarkMode
                  ? "rgba(15, 23, 42, 0.58)"
                  : "rgba(15, 23, 42, 0.24)",
                backdropFilter: "blur(2px)",
                zIndex: 999,
              }}
            />
          )}
          {/* â”€â”€ Sidebar â”€â”€ */}
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            breakpoint="lg"
            collapsedWidth={isMobile ? 0 : SIDER_COLLAPSED}
            onBreakpoint={(broken) => setCollapsed(broken)}
            width={SIDER_WIDTH}
            className={collapsed ? "rs-sider-collapsed" : ""}
            style={{
              height: "100vh",
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
              background: t.surface,
              borderRight: `1px solid ${t.border}`,
              zIndex: 1000,
              overflow: "hidden",
              transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* Brand */}
            <div
              style={{
                height: "56px",
                display: "flex",
                alignItems: "center",
                padding: collapsed ? "0" : "0 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderBottom: `1px solid ${t.borderSubtle}`,
                gap: "10px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={isDarkMode ? "/Ryzent1.png" : "/Ryzent.png"}
                    alt="Ryzent"
                    style={{
                      width: "18px",
                      height: "18px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>

                {!collapsed && (
                  <span
                    style={{
                      color: t.text,
                      fontSize: "15px",
                      fontWeight: "620",
                      letterSpacing: "-0.4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Ryzent
                  </span>
                )}
              </div>

              {isMobile && !collapsed && (
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  aria-label="Close sidebar"
                  className="rs-icon-btn"
                  style={{
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    border: "none",
                    background: "transparent",
                    color: t.textSub,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <CloseOutlined style={{ fontSize: "15px" }} />
                </button>
              )}
            </div>

            {/* Nav */}
            <div
              style={{
                overflowY: "auto",
                overflowX: "hidden",
                height: "calc(100vh - 56px)",
                padding: "4px 0 24px",
                pointerEvents: isSidebarHardDisabled ? "none" : "auto",
                opacity: isSidebarHardDisabled ? 0.52 : 1,
              }}
            >
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
                inlineIndent={0}
                style={{ background: "transparent", border: "none" }}
                className="rs-menu"
              />
            </div>
          </Sider>

          {/* â”€â”€ Main area â”€â”€ */}
          <Layout
            style={{
              marginLeft: isMobile
                ? 0
                : collapsed
                  ? SIDER_COLLAPSED
                  : SIDER_WIDTH,
              transition: "margin-left 0.2s cubic-bezier(0.4,0,0.2,1)",
              background: t.bg,
              minHeight: "100vh",
            }}
          >
            {/* â”€â”€ Header â”€â”€ */}
            <Header
              style={{
                padding: "0 20px 0 24px",
                height: "56px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: t.surface,
                borderBottom: `1px solid ${t.border}`,
                position: "sticky",
                top: 0,
                zIndex: 999,
              }}
            >
              {/* Left: toggle + page title */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="rs-icon-btn"
                  style={{
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "7px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: t.textSub,
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                >
                  {collapsed ? (
                    <MenuUnfoldOutlined style={{ fontSize: "16px" }} />
                  ) : (
                    <MenuFoldOutlined style={{ fontSize: "16px" }} />
                  )}
                </button>

                {!isMobile && (
                  <span
                    style={{
                      fontSize: "14.5px",
                      fontWeight: "580",
                      color: t.text,
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {pageTitles[location.pathname] || ""}
                  </span>
                )}
              </div>

              {/* Right: actions */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "2px" }}
              >
                <Dropdown
                  menu={{
                    items: languageMenuItems,
                    onClick: ({ key }) => applyLanguage(String(key)),
                  }}
                  placement="bottomRight"
                  trigger={["click"]}
                  overlayClassName="rs-lang-dropdown"
                  onOpenChange={setIsLangDropdownOpen}
                >
                  <button
                    className={`rs-lang-btn${isLangDropdownOpen ? " open" : ""}`}
                    style={{ marginRight: 8 }}
                    aria-label={`Language selector. Current language ${currentLanguage.label}`}
                  >
                    <span className="rs-lang-current">
                      <span className="rs-lang-current-flag" aria-hidden="true">
                        <FlagMark
                          country={currentLanguage.country}
                          width={30}
                          height={20}
                        />
                      </span>
                      {!isMobile && (
                        <span className="rs-lang-current-main">
                          <span className="rs-lang-current-name">
                            {currentLanguage.label}
                          </span>
                          <span className="rs-lang-current-code">
                            ({currentLanguage.flag})
                          </span>
                        </span>
                      )}
                      {isMobile && (
                        <span className="rs-lang-current-mobile">
                          {currentLanguage.flag}
                        </span>
                      )}
                    </span>
                    <span className="rs-lang-caret">
                      <DownOutlined />
                    </span>
                  </button>
                </Dropdown>

                {/* Theme */}
                <Dropdown
                  menu={{ items: themeMenuItems }}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <button
                    className="rs-icon-btn"
                    style={{
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "7px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: t.textSub,
                      transition: "background 0.15s",
                    }}
                  >
                    {themeMode === "light" && (
                      <SunOutlined style={{ fontSize: "15px" }} />
                    )}
                    {themeMode === "dark" && (
                      <MoonOutlined style={{ fontSize: "15px" }} />
                    )}
                    {themeMode === "system" && (
                      <DesktopOutlined style={{ fontSize: "15px" }} />
                    )}
                  </button>
                </Dropdown>

                {/* Bell */}
                {isSuperadmin ? (
                  <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                    <button
                      className="rs-icon-btn"
                      onClick={() => navigate("/alerts")}
                      style={{
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "7px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: t.textSub,
                        transition: "background 0.15s",
                      }}
                    >
                      <BellOutlined style={{ fontSize: "15px" }} />
                    </button>
                  </Badge>
                ) : (
                  <Popover
                    content={activityPopoverContent}
                    trigger={["hover"]}
                    placement="bottomRight"
                    overlayClassName="rs-activity-popover"
                    mouseEnterDelay={0.12}
                  >
                    <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                      <button
                        className="rs-icon-btn"
                        onClick={() => navigate("/communication")}
                        style={{
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "7px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: t.textSub,
                          transition: "background 0.15s",
                        }}
                      >
                        <BellOutlined style={{ fontSize: "15px" }} />
                      </button>
                    </Badge>
                  </Popover>
                )}

                {/* Divider */}
                <div
                  style={{
                    width: "1px",
                    height: "20px",
                    background: t.border,
                    margin: "0 6px",
                  }}
                />

                {/* User */}
                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <button
                    className="rs-user-btn"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "4px 8px 4px 4px",
                      borderRadius: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                  >
                    <Avatar
                      size={26}
                      src={profile?.user_photo}
                      icon={<UserOutlined />}
                      style={{
                        fontSize: "11px",
                        flexShrink: 0,
                        border: `1.5px solid ${t.border}`,
                      }}
                    />
                    {!isMobile && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "1px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: "540",
                            color: t.text,
                            letterSpacing: "-0.1px",
                            lineHeight: "1.25",
                          }}
                        >
                          {profile?.full_name || "User"}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: t.textMuted,
                            fontWeight: "400",
                            lineHeight: "1.25",
                          }}
                        >
                          {roleLabel[profile?.role] || "Admin"}
                        </span>
                      </div>
                    )}
                  </button>
                </Dropdown>
              </div>
            </Header>

            {/* â”€â”€ Content â”€â”€ */}
            <Content
              style={{
                margin: "20px",
                padding: "24px",
                background: t.surface,
                borderRadius: "10px",
                border: `1px solid ${t.border}`,
                minHeight: "calc(100vh - 96px)",
                overflow: "auto",
              }}
            >
              {showSubscriptionBanner && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: `1px solid ${isDarkMode ? "#5f1d1d" : "#fecaca"}`,
                    background: isDarkMode ? "#2b1515" : "#fef2f2",
                    color: isDarkMode ? "#fecaca" : "#991b1b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 560 }}>
                    {subscriptionLock.message}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => navigate("/subscription?action=reactivate")}
                      style={{
                        border: `1px solid ${isDarkMode ? "#15803d" : "#86efac"}`,
                        borderRadius: "8px",
                        padding: "8px 12px",
                        background: isDarkMode ? "rgba(21,128,61,0.22)" : "#f0fdf4",
                        color: isDarkMode ? "#86efac" : "#166534",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Reactivate
                    </button>
                    <button
                      onClick={() => navigate("/subscription?action=upgrade")}
                      style={{
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        background: "#0f172a",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Upgrade
                    </button>
                  </div>
                </div>
              )}
              {children}
            </Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export default MainLayout;
