import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
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
  BugOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  useEffect(() => {
    if (profile?.id) {
      fetchUnreadCount();

      const channel = supabase
        .channel('unread-messages')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${profile.id}` },
          () => {
            fetchUnreadCount();
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'messages', filter: `sender_id=neq.${profile.id}` },
          () => {
            fetchUnreadCount();
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'message_read_status', filter: `user_id=eq.${profile.id}` },
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
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', profile.id)
        .eq('is_read', false);

      if (dmError) throw dmError;

      const { data: channelMessages, error: channelError } = await supabase
        .from('messages')
        .select('id')
        .not('channel_id', 'is', null)
        .neq('sender_id', profile.id);

      if (channelError) throw channelError;

      const messageIds = channelMessages?.map(m => m.id) || [];

      const { data: readStatus, error: readError } = await supabase
        .from('message_read_status')
        .select('message_id')
        .eq('user_id', profile.id)
        .in('message_id', messageIds.length > 0 ? messageIds : ['']);

      if (readError) throw readError;

      const readMessageIds = new Set(readStatus?.map(r => r.message_id) || []);
      const unreadChannelCount = channelMessages?.filter(msg => !readMessageIds.has(msg.id)).length || 0;

      setUnreadCount((dmCount || 0) + unreadChannelCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const getMenuItems = () => {
    const adminMenuItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      {
        key: '/projects',
        icon: <ProjectOutlined />,
        label: 'Projects',
      },
      {
        key: '/employees',
        icon: <UserOutlined />,
        label: 'Employees',
      },
      {
        key: '/teams',
        icon: <TeamOutlined />,
        label: 'Teams',
      },
      {
        key: '/requests',
        icon: <FileTextOutlined />,
        label: 'Requests',
      },
      {
        key: '/attendance',
        icon: <ClockCircleOutlined />,
        label: 'Attendance',
      },
      {
        key: '/leads',
        icon: <CustomerServiceOutlined />,
        label: 'Leads Tracker',
      },
      {
        key: '/payments',
        icon: <DollarOutlined />,
        label: 'Payments',
      },
      {
        key: '/documents',
        icon: <FolderOutlined />,
        label: 'Documents',
      },
      {
        key: '/communication',
        icon: <MessageOutlined />,
        label: 'Communication',
      },
      {
        key: '/letters',
        icon: <FileDoneOutlined />,
        label: 'Letter Generation',
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
      },
    ];

    const pmMenuItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      {
        key: '/projects',
        icon: <ProjectOutlined />,
        label: 'Projects',
      },
      {
        key: '/communication',
        icon: <MessageOutlined />,
        label: 'Communication',
      },
      {
        key: '/requests',
        icon: <FileTextOutlined />,
        label: 'Requests',
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Profile',
      },
    ];

    const employeeMenuItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      {
        key: '/projects',
        icon: <ProjectOutlined />,
        label: 'My Projects',
      },
      {
        key: '/attendance',
        icon: <ClockCircleOutlined />,
        label: 'Attendance',
      },
      {
        key: '/communication',
        icon: <MessageOutlined />,
        label: 'Communication',
      },
      {
        key: '/requests',
        icon: <FileTextOutlined />,
        label: 'Requests',
      },
      {
        key: '/profile',
        icon: <UserOutlined />,
        label: 'Profile',
      },
    ];

    if (profile?.role === 'project_manager') {
      return pmMenuItems;
    } else if (profile?.role === 'employee') {
      return employeeMenuItems;
    }

    return adminMenuItems;
  };

  const menuItems = getMenuItems();

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (window.innerWidth < 768) {
      setCollapsed(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleSignOut,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth={window.innerWidth < 768 ? 0 : 80}
        onBreakpoint={(broken) => {
          setCollapsed(broken);
        }}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: '#001529',
          zIndex: 1000,
        }}
      >
        <div className="flex items-center justify-center h-16 bg-[#001529]">
          <h1 className="text-white text-xl font-bold">
            {collapsed ? 'RS' : 'Resosyncer'}
          </h1>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ backgroundColor: '#001529' }}
        />
      </Sider>

      <Layout
        style={{
          marginLeft: window.innerWidth < 768 ? 0 : (collapsed ? 80 : 200),
          transition: 'all 0.2s'
        }}
      >
        <Header
          style={{
            padding: '0 16px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
          className="md:px-6"
        >
          <div>
            {collapsed ? (
              <MenuUnfoldOutlined
                className="text-xl cursor-pointer"
                onClick={() => setCollapsed(!collapsed)}
              />
            ) : (
              <MenuFoldOutlined
                className="text-xl cursor-pointer"
                onClick={() => setCollapsed(!collapsed)}
              />
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <Badge count={unreadCount} className="hidden sm:block">
              <BellOutlined
                className="text-xl cursor-pointer"
                onClick={() => navigate('/communication')}
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar
                  src={profile?.user_photo}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#001529' }}
                />
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-medium">{profile?.full_name || 'User'}</span>
                  <span className="text-xs text-gray-500 capitalize">{profile?.role || 'Admin'}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: '16px 8px',
            padding: 16,
            minHeight: 280,
            background: '#f0f2f5',
          }}
          className="md:m-6 md:p-6"
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
