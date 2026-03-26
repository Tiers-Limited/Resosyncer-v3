import { useState, useEffect, createContext, useContext } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
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
  AuditOutlined,
  RadarChartOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

const { Header, Sider, Content } = Layout;

export const ThemeContext = createContext({ isDarkMode: false });
export const useTheme = () => useContext(ThemeContext);

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem("themeMode");
    return saved || "system";
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  useEffect(() => {
    localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);

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
    try {
      const { count: dmCount, error: dmError } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", profile.id)
        .eq("is_read", false);
      if (dmError) throw dmError;

      const { data: channelMessages, error: channelError } = await supabase
        .from("messages")
        .select("id")
        .not("channel_id", "is", null)
        .neq("sender_id", profile.id);
      if (channelError) throw channelError;

      const messageIds = channelMessages?.map((m) => m.id) || [];
      const { data: readStatus, error: readError } = await supabase
        .from("message_read_status")
        .select("message_id")
        .eq("user_id", profile.id)
        .in("message_id", messageIds.length > 0 ? messageIds : [""]);
      if (readError) throw readError;

      const readMessageIds = new Set(
        readStatus?.map((r) => r.message_id) || [],
      );
      const unreadChannelCount =
        channelMessages?.filter((msg) => !readMessageIds.has(msg.id)).length ||
        0;
      setUnreadCount((dmCount || 0) + unreadChannelCount);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const ALL_ADMIN_ROUTES = {
    "/dashboard": { icon: <DashboardOutlined />, label: "Dashboard" },
    "/projects": { icon: <ProjectOutlined />, label: "Projects" },
    "/employees": { icon: <IdcardOutlined />, label: "Employees" },
    "/teams": { icon: <TeamOutlined />, label: "Teams" },
    "/meetings": { icon: <VideoCameraOutlined />, label: "Meetings" },
    "/monitor": { icon: <CalendarOutlined />, label: "Attendance" },
    "/stats": { icon: <PieChartOutlined />, label: "Attendance Stats" },
    "/standups": { icon: <BarChartOutlined />, label: "Standup Stats" },
    "/requests": { icon: <FileTextOutlined />, label: "Requests" },
    "/leads": { icon: <CustomerServiceOutlined />, label: "Leads" },
    "/payments": { icon: <DollarOutlined />, label: "Payments" },
    "/recruitment": { icon: <UserAddOutlined />, label: "Recruitment" },
    "/contract-maker": { icon: <FileProtectOutlined />, label: "Contracts" },
    "/training-material": { icon: <ReadOutlined />, label: "Training" },
    "/documents": { icon: <FolderOutlined />, label: "Documents" },
    "/communication": { icon: <MessageOutlined />, label: "Communication" },
    "/settings": { icon: <SettingOutlined />, label: "Settings" },
  };

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
        "/stats",
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
        "/settings",
      ],
    },
  ];

  const getMenuItems = () => {
    // ── Superadmin menu (no permission filtering needed) ─────────────────────
    const superadminMenuItems = [
      {
        key: "platform-overview",
        type: "group",
        label: collapsed ? null : "Platform",
        children: [
          { key: "/dashboard", icon: <DashboardOutlined />, label: "Overview" },
          { key: "/tenants", icon: <ApartmentOutlined />, label: "Tenants" },
          {
            key: "/subscriptions",
            icon: <CrownOutlined />,
            label: "Subscriptions",
          },
          { key: "/billing", icon: <BankOutlined />, label: "Billing" },
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

    // ── Admin menu — filtered by profile.permissions ──────────────────────────
    const adminPermissions = Array.isArray(profile?.permissions)
      ? new Set(profile.permissions)
      : null; // null = no restrictions (full access)

    const adminMenuItems = ADMIN_GROUPS.map((group) => {
      const children = group.routes
        .filter((route) => !adminPermissions || adminPermissions.has(route))
        .map((route) => ({
          key: route,
          icon: ALL_ADMIN_ROUTES[route].icon,
          label: ALL_ADMIN_ROUTES[route].label,
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

    // ── PM menu ───────────────────────────────────────────────────────────────
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
          },
          { key: "/projects", icon: <ProjectOutlined />, label: "Projects" },
          { key: "/requests", icon: <FileTextOutlined />, label: "Requests" },
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
          },
          { key: "/standups", icon: <CommentOutlined />, label: "Standups" },
          {
            key: "/communication",
            icon: <MessageOutlined />,
            label: "Communication",
          },
          { key: "/settings", icon: <SettingOutlined />, label: "Profile" },
        ],
      },
    ];

    // ── Employee menu ─────────────────────────────────────────────────────────
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
          },
          { key: "/projects", icon: <ProjectOutlined />, label: "My Projects" },
          { key: "/requests", icon: <FileTextOutlined />, label: "Requests" },
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
          },
          { key: "/standups", icon: <CommentOutlined />, label: "Standups" },
          {
            key: "/attendance",
            icon: <CalendarOutlined />,
            label: "Attendance",
          },
          {
            key: "/communication",
            icon: <MessageOutlined />,
            label: "Communication",
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
          },
          { key: "/profile", icon: <IdcardOutlined />, label: "Profile" },
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
      navigate(key);
      if (window.innerWidth < 768) setCollapsed(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const isSuperadmin = profile?.role === "superadmin";

  // ─── Color tokens ──────────────────────────────────────────────────────────
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
    "/stats": "Attendance Stats",
    "/standups": "Standup Stats",
    "/leads": "Leads",
    "/payments": "Payments",
    "/recruitment": "Recruitment",
    "/contract-maker": "Contracts",
    "/training-material": "Training",
    "/documents": "Documents",
    "/communication": "Communication",
    "/letters": "Letters",
    "/profile": "Profile",
    "/settings": "Settings",
    "/tenants": "Tenants",
    "/users": "Users",
    "/subscriptions": "Subscriptions",
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

  const SIDER_WIDTH = 232;
  const SIDER_COLLAPSED = 64;
  const isMobile = window.innerWidth < 768;

  return (
    <ThemeContext.Provider value={{ isDarkMode }}>
      {/* Google Font: Geist */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body { background: ${t.bg} !important; }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 4px; }

        /* ── Sidebar menu ── */
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

        /* Collapsed state — center icons */
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

        /* ── Hover utility ── */
        .rs-icon-btn:hover { background: ${t.hover} !important; }
        .rs-user-btn:hover { background: ${t.hover} !important; }

        /* ── Ant dropdown tweaks ── */
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

        /* ── Badge ── */
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
          {/* ── Sidebar ── */}
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
                  width: "28px",
                  height: "28px",
                  flexShrink: 0,
                  borderRadius: "8px",
                  background: t.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "13px",
                    letterSpacing: "-0.5px",
                  }}
                >
                  R
                </span>
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
                  Resosyncer
                </span>
              )}
            </div>

            {/* Nav */}
            <div
              style={{
                overflowY: "auto",
                overflowX: "hidden",
                height: "calc(100vh - 56px)",
                padding: "4px 0 24px",
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

          {/* ── Main area ── */}
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
            {/* ── Header ── */}
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
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                  <button
                    className="rs-icon-btn"
                    onClick={() =>
                      navigate(isSuperadmin ? "/alerts" : "/communication")
                    }
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

            {/* ── Content ── */}
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
              {children}
            </Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export default MainLayout;
