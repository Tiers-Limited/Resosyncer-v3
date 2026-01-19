import { useState, useEffect } from "react";
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
  DesktopOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

const { Header, Sider, Content } = Layout;

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

  // Listen for system theme changes
  useEffect(() => {
    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => {
        // Force re-render when system theme changes
        setThemeMode("system");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
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
          () => {
            fetchUnreadCount();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `sender_id=neq.${profile.id}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "message_read_status",
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
        readStatus?.map((r) => r.message_id) || []
      );
      const unreadChannelCount =
        channelMessages?.filter((msg) => !readMessageIds.has(msg.id)).length ||
        0;

      setUnreadCount((dmCount || 0) + unreadChannelCount);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const getMenuItems = () => {
    const adminMenuItems = [
      {
        key: "main",
        type: "group",
        label: collapsed ? null : "MAIN",
        children: [
          {
            key: "/dashboard",
            icon: <DashboardOutlined />,
            label: "Dashboard",
          },
          {
            key: "/projects",
            icon: <ProjectOutlined />,
            label: "Projects",
          },
          {
            key: "/employees",
            icon: <UserOutlined />,
            label: "Employees",
          },
          {
            key: "/teams",
            icon: <TeamOutlined />,
            label: "Teams",
          },
        ],
      },
      {
        key: "operations",
        type: "group",
        label: collapsed ? null : "OPERATIONS",
        children: [
          {
            key: "/requests",
            icon: <FileTextOutlined />,
            label: "Requests",
          },
          {
            key: "/attendance",
            icon: <ClockCircleOutlined />,
            label: "Attendance",
          },
          {
            key: "/leads",
            icon: <CustomerServiceOutlined />,
            label: "Leads",
          },
          {
            key: "/payments",
            icon: <DollarOutlined />,
            label: "Payments",
          },
        ],
      },
      {
        key: "resources",
        type: "group",
        label: collapsed ? null : "RESOURCES",
        children: [
          {
            key: "/documents",
            icon: <FolderOutlined />,
            label: "Documents",
          },
          {
            key: "/communication",
            icon: <MessageOutlined />,
            label: "Communication",
          },
          {
            key: "/letters",
            icon: <FileDoneOutlined />,
            label: "Letters",
          },
          {
            key: "/settings",
            icon: <SettingOutlined />,
            label: "Settings",
          },
        ],
      },
    ];

    const pmMenuItems = [
      {
        key: "main",
        type: "group",
        label: collapsed ? null : "MAIN",
        children: [
          {
            key: "/dashboard",
            icon: <DashboardOutlined />,
            label: "Dashboard",
          },
          {
            key: "/projects",
            icon: <ProjectOutlined />,
            label: "Projects",
          },
          {
            key: "/requests",
            icon: <FileTextOutlined />,
            label: "Requests",
          },
        ],
      },
      {
        key: "operations",
        type: "group",
        label: collapsed ? null : "OPERARIONS",
        children: [
          {
            key: "/communication",
            icon: <MessageOutlined />,
            label: "Communication",
          },
          {
            key: "/settings",
            icon: <SettingOutlined />,
            label: "Profile",
          },
        ],
      },
    ];

    const employeeMenuItems = [
      {
        key: "main",
        type: "group",
        label: collapsed ? null : "MAIN",
        children: [
          {
            key: "/dashboard",
            icon: <DashboardOutlined />,
            label: "Dashboard",
          },
          {
            key: "/projects",
            icon: <ProjectOutlined />,
            label: "My Projects",
          },
          {
            key: "/attendance",
            icon: <ClockCircleOutlined />,
            label: "Attendance",
          },
          {
            key: "/requests",
            icon: <FileTextOutlined />,
            label: "Requests",
          },
        ],
      },
      {
        key: "operations",
        type: "group",
        label: collapsed ? null : "OPERATIONS",
        children: [
          {
            key: "/communication",
            icon: <MessageOutlined />,
            label: "Communication",
          },
        ],
      },
       {
        key: "operations",
        type: "group",
        label: collapsed ? null : "OPERATIONS",
        children: [
          {
            key: "/profile",
            icon: <UserOutlined />,
            label: "Profile",
          },
        ],
      },
    ];

    if (profile?.role === "project_manager") {
      return pmMenuItems;
    } else if (profile?.role === "employee") {
      return employeeMenuItems;
    }

    return adminMenuItems;
  };

  const menuItems = getMenuItems();

  const handleMenuClick = ({ key }) => {
    if (key.startsWith("/")) {
      navigate(key);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "My Profile",
      onClick: () => navigate("/settings"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Sign Out",
      onClick: handleSignOut,
    },
  ];

  const themeMenuItems = [
    {
      key: "light",
      icon: <SunOutlined />,
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span>Light</span>
          {themeMode === "light" && (
            <CheckOutlined style={{ fontSize: "12px" }} />
          )}
        </div>
      ),
      onClick: () => setThemeMode("light"),
    },
    {
      key: "dark",
      icon: <MoonOutlined />,
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span>Dark</span>
          {themeMode === "dark" && (
            <CheckOutlined style={{ fontSize: "12px" }} />
          )}
        </div>
      ),
      onClick: () => setThemeMode("dark"),
    },
    {
      key: "system",
      icon: <DesktopOutlined />,
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span>System</span>
          {themeMode === "system" && (
            <CheckOutlined style={{ fontSize: "12px" }} />
          )}
        </div>
      ),
      onClick: () => setThemeMode("system"),
    },
  ];

  const customTheme = {
    algorithm: isDarkMode
      ? antdTheme.darkAlgorithm
      : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: "#3b82f6",
      borderRadius: 8,
      colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff",
      colorBgElevated: isDarkMode ? "#1f2937" : "#ffffff",
      colorBgLayout: isDarkMode ? "#111827" : "#f9fafb",
      colorBorder: isDarkMode ? "#374151" : "#e5e7eb",
      colorText: isDarkMode ? "#f9fafb" : "#111827",
      colorTextSecondary: isDarkMode ? "#9ca3af" : "#6b7280",
    },
    components: {
      Layout: {
        headerBg: isDarkMode ? "#111827" : "#ffffff",
        siderBg: isDarkMode ? "#1f2937" : "#ffffff",
        bodyBg: isDarkMode ? "#111827" : "#f9fafb",
      },
      Menu: {
        itemBg: "transparent",
        itemSelectedBg: isDarkMode ? "#001529" : "#f3f4f6",
        itemHoverBg: isDarkMode ? "#374151" : "#f3f4f6",
        itemSelectedColor: isDarkMode ? "#ffffff" : "#001529",
        itemColor: isDarkMode ? "#d1d5db" : "#374151",
        groupTitleColor: isDarkMode ? "#6b7280" : "#9ca3af",
      },
      Card: {
        colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff",
      },
      Table: {
        headerBg: isDarkMode ? "#374151" : "#f9fafb",
      },
      Input: {
        colorBgContainer: isDarkMode ? "#374151" : "#ffffff",
      },
      Select: {
        colorBgContainer: isDarkMode ? "#374151" : "#ffffff",
      },
    },
  };

  const colors = {
    sidebarBorder: isDarkMode ? "#374151" : "#e5e7eb",
    headerBorder: isDarkMode ? "#374151" : "#e5e7eb",
    cardBorder: isDarkMode ? "#374151" : "#e5e7eb",
    textPrimary: isDarkMode ? "#f9fafb" : "#111827",
    textSecondary: isDarkMode ? "#9ca3af" : "#6b7280",
    menuHover: isDarkMode ? "#374151" : "#f3f4f6",
    iconColor: isDarkMode ? "#9ca3af" : "#6b7280",
    logoBg: isDarkMode ? "#f9fafb" : "#111827",
    logoText: isDarkMode ? "#1f2937" : "#ffffff",
    groupLabel: isDarkMode ? "#6b7280" : "#9ca3af",
  };

  return (
    <ConfigProvider theme={customTheme}>
      <Layout
        style={{ minHeight: "100vh", maxWidth: "100vw", overflow: "hidden" }}
      >
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          breakpoint="lg"
          collapsedWidth={window.innerWidth < 768 ? 0 : 80}
          onBreakpoint={(broken) => {
            setCollapsed(broken);
          }}
          width={260}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            borderRight: `1px solid ${colors.sidebarBorder}`,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              height: "72px",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              padding: collapsed ? "0" : "0 20px",
              borderBottom: `1px solid ${colors.sidebarBorder}`,
            }}
          >
            {collapsed ? (
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: colors.logoBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    color: colors.logoText,
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  R
                </span>
              </div>
            ) : (
              <span
                style={{
                  color: colors.textPrimary,
                  fontSize: "20px",
                  fontWeight: "700",
                  letterSpacing: "-0.5px",
                }}
              >
                Resosyncer
              </span>
            )}
          </div>

          <div style={{ padding: collapsed ? "12px 8px" : "12px 16px" }}>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={handleMenuClick}
              style={{
                background: "transparent",
                border: "none",
              }}
              className="custom-menu"
            />
          </div>

          <style>{`
            .custom-menu {
              font-size: 14px;
            }
            
            .custom-menu .ant-menu-item-group-title {
              color: ${colors.groupLabel};
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 0.5px;
              padding: ${collapsed ? "8px 0" : "8px 12px"};
              text-align: ${collapsed ? "center" : "left"};
            }
            
            .custom-menu .ant-menu-item {
              margin: 2px 0;
              border-radius: 8px;
              height: 40px;
              line-height: 40px;
              padding: ${
                collapsed ? "0 calc(50% - 16px)" : "0 12px"
              } !important;
            }
            
            .custom-menu .ant-menu-item-selected::after {
              display: none;
            }
            
            .custom-menu .ant-menu-item-icon {
              font-size: 18px;
            }
            
            .toggle-btn:hover,
            .icon-btn:hover {
              background: ${colors.menuHover};
            }
            
            .user-menu:hover {
              background: ${colors.menuHover};
            }
          `}</style>
        </Sider>

        <Layout
          style={{
            marginLeft: window.innerWidth < 768 ? 0 : collapsed ? 80 : 260,
            transition: "margin-left 0.2s",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <Header
            style={{
              padding: "0 32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${colors.headerBorder}`,
              height: "64px",
              position: "sticky",
              top: 0,
              zIndex: 999,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                className="toggle-btn"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? (
                  <MenuUnfoldOutlined
                    style={{ fontSize: "20px", color: colors.textPrimary }}
                  />
                ) : (
                  <MenuFoldOutlined
                    style={{ fontSize: "20px", color: colors.textPrimary }}
                  />
                )}
              </div>

              <div
                style={{ display: window.innerWidth < 768 ? "none" : "block" }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "600",
                    color: colors.textPrimary,
                    letterSpacing: "-0.3px",
                  }}
                >
                  {location.pathname === "/dashboard" && "Dashboard"}
                  {location.pathname === "/projects" && "Projects"}
                  {location.pathname === "/employees" && "Employees"}
                  {location.pathname === "/teams" && "Teams"}
                  {location.pathname === "/requests" && "Requests"}
                  {location.pathname === "/attendance" && "Attendance"}
                  {location.pathname === "/leads" && "Leads Tracker"}
                  {location.pathname === "/payments" && "Payments"}
                  {location.pathname === "/documents" && "Documents"}
                  {location.pathname === "/communication" && "Communication"}
                  {location.pathname === "/letters" && "Letter Generation"}
                  {location.pathname === "/settings" && "Settings"}
                  {location.pathname === "/profile" && "Profile"}
                </h1>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Dropdown
                menu={{ items: themeMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                  className="icon-btn"
                >
                  {themeMode === "light" && (
                    <SunOutlined
                      style={{ fontSize: "18px", color: colors.textPrimary }}
                    />
                  )}
                  {themeMode === "dark" && (
                    <MoonOutlined
                      style={{ fontSize: "18px", color: colors.textPrimary }}
                    />
                  )}
                  {themeMode === "system" && (
                    <DesktopOutlined
                      style={{ fontSize: "18px", color: colors.textPrimary }}
                    />
                  )}
                </div>
              </Dropdown>

              <Badge
                count={unreadCount}
                style={{ display: window.innerWidth < 640 ? "none" : "block" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                  className="icon-btn"
                  onClick={() => navigate("/communication")}
                >
                  <BellOutlined
                    style={{ fontSize: "18px", color: colors.textPrimary }}
                  />
                </div>
              </Badge>

              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "6px 12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                  className="user-menu"
                >
                  <Avatar
                    size={32}
                    src={profile?.user_photo}
                    icon={<UserOutlined />}
                    style={{
                      background: "#3b82f6",
                    }}
                  />
                  <div
                    style={{
                      display: window.innerWidth < 640 ? "none" : "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: colors.textPrimary,
                        lineHeight: "1.3",
                      }}
                    >
                      {profile?.full_name || "User"}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: colors.textSecondary,
                        textTransform: "capitalize",
                        lineHeight: "1.3",
                      }}
                    >
                      {profile?.role === "project_manager"
                        ? "IT Project Managere"
                        : profile?.role?.replace("_", " ") || "Admin"}
                    </span>
                  </div>
                </div>
              </Dropdown>
            </div>
          </Header>

          <Content
            style={{
              margin: "24px",
              padding: "24px",
              minHeight: "calc(100vh - 112px)",
              borderRadius: "8px",
              border: `1px solid ${colors.cardBorder}`,
              maxWidth: "100%",
              overflow: "auto",
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
