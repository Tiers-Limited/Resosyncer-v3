import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Badge, Modal, Checkbox, Button, Input, DatePicker, Select, ConfigProvider } from 'antd';
const { TextArea } = Input;
import {
  ProjectOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { theme } from 'antd';
import { supabase } from '../lib/supabase';
import BirthdayWidget from '../components/BirthdayWidget';
import ClientWorldMap from '../components/ClientWorldMap';
import dayjs from 'dayjs';

const { useToken } = theme;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalEmployees: 0,
    totalTeams: 0,
    pendingRequests: 0,
    inProgressLeads: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [clientCountries, setClientCountries] = useState([]);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [standupModal, setStandupModal] = useState(false);
  const [selectedStandup, setSelectedStandup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', priority: 'medium', due_date: null });
  const [newMeeting, setNewMeeting] = useState({ title: '', meeting_date: null, description: '', email_reminders: [], attendee_type: 'individual', attendee_emails: [] });
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const { token } = useToken();

  // Get theme mode from localStorage
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved || 'system';
  });

  const getEffectiveTheme = () => {
    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeMode;
  };

  const darkMode = getEffectiveTheme() === 'dark';

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('themeMode');
      setThemeMode(saved || 'system');
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchActiveEmployees();
    fetchTodos();
    fetchAdminUsers();
    getCurrentUser();
    fetchMeetings();

    const interval = setInterval(() => {
      fetchActiveEmployees();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchTodos();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId && currentUserEmail) {
      fetchMeetings();
    }
  }, [currentUserId, currentUserEmail]);

  const fetchDashboardData = async () => {
    try {
      const [
        projectsRes,
        employeesRes,
        teamsRes,
        requestsRes,
        leadsRes,
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact' }).eq('role', 'employee'),
        supabase.from('teams').select('*', { count: 'exact' }),
        supabase.from('requests').select('*', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('leads').select('*', { count: 'exact' }).eq('status', 'in_progress'),
      ]);

      const activeProjects = projectsRes.data?.filter(p => p.status === 'in_progress').length || 0;

      setStats({
        totalProjects: projectsRes.count || 0,
        activeProjects,
        totalEmployees: employeesRes.count || 0,
        totalTeams: teamsRes.count || 0,
        pendingRequests: requestsRes.count || 0,
        inProgressLeads: leadsRes.count || 0,
      });

      const recent = projectsRes.data
        ?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5) || [];
      setRecentProjects(recent);

      const countries = projectsRes.data
        ?.filter(p => p.client_country)
        .reduce((acc, project) => {
          const country = project.client_country;
          const existing = acc.find(c => c.country === country);
          if (existing) {
            existing.count += 1;
          } else {
            acc.push({ country, count: 1 });
          }
          return acc;
        }, []) || [];
      setClientCountries(countries.sort((a, b) => b.count - a.count).slice(0, 10));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveEmployees = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('time_logs')
        .select(`
          *,
          profiles (full_name, email, user_photo)
        `)
        .eq('date', today)
        .in('status', ['active', 'paused']);

      if (error) throw error;
      setActiveEmployees(data || []);
    } catch (error) {
      console.error('Error fetching active employees:', error);
    }
  };

  const handleViewStandup = (employee) => {
    setSelectedStandup(employee);
    setStandupModal(true);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getElapsedTime = (timeLog) => {
    if (timeLog.status === 'active') {
      const startTime = new Date(timeLog.start_time);
      const now = new Date();
      return Math.floor((now - startTime) / 1000);
    } else if (timeLog.status === 'paused') {
      return Math.floor(timeLog.total_hours * 3600);
    }
    return 0;
  };

  const fetchTodos = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', currentUserId)
        .order('completed', { ascending: true })
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'admin')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setCurrentUserEmail(user.email);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchMeetings = async () => {
    if (!currentUserId || !currentUserEmail) return;

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', currentUserId)
        .gte('meeting_date', new Date().toISOString())
        .order('meeting_date', { ascending: true })
        .limit(10);

      if (error) throw error;

      const filteredMeetings = (data || []).filter(meeting => {
        if (meeting.attendee_type === 'individual') {
          return true;
        } else {
          return meeting.attendee_emails && meeting.attendee_emails.includes(currentUserEmail);
        }
      });

      setMeetings(filteredMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.title.trim()) return;

    try {
      const { error } = await supabase
        .from('todos')
        .insert([{ ...newTodo, created_by: currentUserId, user_id: currentUserId }]);

      if (error) throw error;
      setNewTodo({ title: '', description: '', priority: 'medium', due_date: null });
      setTodoModalVisible(false);
      fetchTodos();
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const handleToggleTodo = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleDeleteMeeting = async (id) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  const projectColumns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          not_started: 'default',
          in_progress: 'processing',
          testing: 'warning',
          completed: 'success',
        };
        return <Tag color={colors[status]}>{status?.replace('_', ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Client',
      dataIndex: 'client_name',
      key: 'client_name',
    },
    {
      title: 'Type',
      dataIndex: 'project_type',
      key: 'project_type',
      render: (type) => type?.toUpperCase(),
    },
  ];

  const textColor = darkMode ? '#f9fafb' : '#111827';
  const secondaryTextColor = darkMode ? '#9ca3af' : '#6b7280';
  const hoverBg = darkMode ? '#374151' : '#f3f4f6';
  const borderColor = darkMode ? '#374151' : '#e5e7eb';

  return (
    <div style={{ color: textColor }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: textColor }}>Dashboard Overview</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Projects"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: darkMode ? '#f9fafb' : '#001529' }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: secondaryTextColor }}>
              <span style={{ color: '#52c41a' }}>
                <RiseOutlined /> {stats.activeProjects} active
              </span>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Employees"
              value={stats.totalEmployees}
              prefix={<UserOutlined />}
              valueStyle={{ color: darkMode ? '#f9fafb' : '#001529' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Teams"
              value={stats.totalTeams}
              prefix={<TeamOutlined />}
              valueStyle={{ color: darkMode ? '#f9fafb' : '#001529' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending Requests"
              value={stats.pendingRequests}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="In Progress Leads"
              value={stats.inProgressLeads}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Active Projects"
              value={stats.activeProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClockCircleOutlined />
                <span>Active Employees Today</span>
                <Badge count={activeEmployees.length} style={{ backgroundColor: '#52c41a' }} />
              </div>
            }
          >
            {activeEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', color: secondaryTextColor, padding: '16px 0' }}>No employees working currently</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {activeEmployees.map((emp) => (
                  <Card
                    key={emp.id}
                    size="small"
                    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                        {emp.status === 'active' ? (
                          <PlayCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                        ) : (
                          <PauseCircleOutlined style={{ color: '#fa8c16', fontSize: '18px' }} />
                        )}
                        <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{emp.profiles?.full_name}</span>
                      </div>
                      <div style={{ width: '100%' }}>
                        <Tag color={emp.status === 'active' ? 'green' : 'orange'} style={{ width: '100%', textAlign: 'center' }}>
                          {emp.status === 'active' ? 'Working' : 'Paused'}
                        </Tag>
                      </div>
                      <div style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 'bold', color: '#1890ff' }}>
                        {formatTime(getElapsedTime(emp))}
                      </div>
                      {emp.standup_message && (
                        <button
                          onClick={() => handleViewStandup(emp)}
                          style={{ fontSize: '12px', color: '#1890ff', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          View Standup
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={14}>
          <Card title="Recent Projects" loading={loading}>
            <Table
              columns={projectColumns}
              dataSource={recentProjects}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <BirthdayWidget />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card
            title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircleOutlined /> To-Do List</div>}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setNewTodo({ title: '', description: '', priority: 'medium', due_date: null });
                setTodoModalVisible(true);
              }}>
                Add Task
              </Button>
            }
            style={{ height: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '384px', overflowY: 'auto' }}>
              {todos.length === 0 ? (
                <div style={{ textAlign: 'center', color: secondaryTextColor, padding: '32px 0' }}>No tasks yet</div>
              ) : (
                todos.map((todo) => (
                  <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <Checkbox
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id, todo.completed)}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? secondaryTextColor : textColor }}>
                          {todo.title}
                        </span>
                        {todo.priority && (
                          <Tag color={todo.priority === 'high' ? 'red' : todo.priority === 'medium' ? 'orange' : 'default'} style={{ fontSize: '12px' }}>
                            {todo.priority}
                          </Tag>
                        )}
                      </div>
                      {todo.due_date && (
                        <div style={{ fontSize: '12px', color: secondaryTextColor, marginTop: '4px' }}>
                          Due: {dayjs(todo.due_date).format('MMM DD, YYYY')}
                        </div>
                      )}
                      {todo.description && (
                        <div style={{ fontSize: '12px', color: secondaryTextColor, marginTop: '4px' }}>
                          {todo.description}
                        </div>
                      )}
                    </div>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteTodo(todo.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarOutlined /> Meeting Reminders</div>}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setNewMeeting({ title: '', meeting_date: null, description: '', email_reminders: [], attendee_type: 'individual', attendee_emails: [] });
                setMeetingModalVisible(true);
              }}>
                Add Meeting
              </Button>
            }
            style={{ height: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '384px', overflowY: 'auto' }}>
              {meetings.length === 0 ? (
                <div style={{ textAlign: 'center', color: secondaryTextColor, padding: '32px 0' }}>No meetings scheduled</div>
              ) : (
                meetings.map((meeting) => (
                  <div key={meeting.id} style={{ padding: '12px', border: `1px solid ${borderColor}`, borderRadius: '4px', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 500, color: textColor }}>{meeting.title}</span>
                          {meeting.attendee_type === 'individual' ? (
                            <Tag color="default" style={{ fontSize: '12px' }}>Only Me</Tag>
                          ) : (
                            <Tag color="blue" style={{ fontSize: '12px' }}>
                              {meeting.attendee_emails?.length || 0} Attendees
                            </Tag>
                          )}
                        </div>
                        <div style={{ fontSize: '14px', color: secondaryTextColor, marginTop: '4px' }}>
                          {dayjs(meeting.meeting_date).format('MMM DD, YYYY - h:mm A')}
                        </div>
                        {meeting.description && (
                          <div style={{ fontSize: '14px', color: secondaryTextColor, marginTop: '4px' }}>{meeting.description}</div>
                        )}
                        {meeting.email_reminders && meeting.email_reminders.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                            {meeting.email_reminders.map((reminder, idx) => (
                              <Tag key={idx} color="blue" style={{ fontSize: '12px' }}>
                                {reminder === '30min' && '30 min'}
                                {reminder === '1hour' && '1 hr'}
                                {reminder === '2hours' && '2 hrs'}
                                {reminder === '4hours' && '4 hrs'}
                                {reminder === '8hours' && '8 hrs'}
                                {reminder === '24hours' && '24 hrs'}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteMeeting(meeting.id)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <ClientWorldMap countries={clientCountries} />
        </Col>
      </Row>

      <Modal
        title="Standup Message"
        open={standupModal}
        onCancel={() => setStandupModal(false)}
        footer={null}
      >
        {selectedStandup && (
          <div>
            <p style={{ color: secondaryTextColor, marginBottom: '8px' }}>
              <strong>Employee:</strong> {selectedStandup.profiles?.full_name}
            </p>
            <p style={{ color: secondaryTextColor, marginBottom: '8px' }}>
              <strong>Date:</strong> {selectedStandup.date}
            </p>
            <p style={{ color: secondaryTextColor, marginBottom: '16px' }}>
              <strong>Total Hours:</strong> {selectedStandup.total_hours?.toFixed(2) || 0} hours
            </p>
            <div style={{ background: darkMode ? '#374151' : '#f9fafb', padding: '16px', borderRadius: '4px' }}>
              <p style={{ fontWeight: 500, marginBottom: '8px' }}>Message:</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{selectedStandup.standup_message}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Add Meeting"
        open={meetingModalVisible}
        onCancel={() => {
          setMeetingModalVisible(false);
          setNewMeeting({ title: '', meeting_date: null, description: '', email_reminders: [], attendee_type: 'individual', attendee_emails: [] });
        }}
        onOk={async () => {
          if (!newMeeting.title || !newMeeting.meeting_date) {
            return;
          }
          try {
            const { error } = await supabase
              .from('meetings')
              .insert([{ ...newMeeting, created_by: currentUserId, user_id: currentUserId }]);

            if (error) throw error;
            setMeetingModalVisible(false);
            setNewMeeting({ title: '', meeting_date: null, description: '', email_reminders: [], attendee_type: 'individual', attendee_emails: [] });
            fetchMeetings();
          } catch (error) {
            console.error('Error adding meeting:', error);
          }
        }}
        okText="Add Meeting"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: secondaryTextColor, marginBottom: '4px' }}>Title *</label>
            <Input
              value={newMeeting.title}
              onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
              placeholder="Meeting title"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: secondaryTextColor, marginBottom: '4px' }}>Date & Time *</label>
            <DatePicker
              showTime
              value={newMeeting.meeting_date ? dayjs(newMeeting.meeting_date) : null}
              onChange={(date) => setNewMeeting({ ...newMeeting, meeting_date: date ? date.toISOString() : null })}
              style={{ width: '100%' }}
              format="MMM DD, YYYY h:mm A"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: secondaryTextColor, marginBottom: '4px' }}>Attendees *</label>
            <Select
              value={newMeeting.attendee_type}
              onChange={(value) => {
                setNewMeeting({
                  ...newMeeting,
                  attendee_type: value,
                  attendee_emails: value === 'individual' ? [] : (currentUserEmail ? [currentUserEmail] : [])
                });
              }}
              style={{ width: '100%' }}
              options={[
                { label: 'Individual (Only Me)', value: 'individual' },
                { label: 'Multiple Admins', value: 'multiple' },
              ]}
            />
          </div>
          {newMeeting.attendee_type === 'multiple' && (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: secondaryTextColor, marginBottom: '4px' }}>Select Admins *</label>
              <div style={{ marginBottom: '8px' }}>
                <Tag color="green">You (Included by default)</Tag>
              </div>
              <Select
                mode="multiple"
                placeholder="Select additional admins to invite"
                value={newMeeting.attendee_emails.filter(email => email !== currentUserEmail)}
                onChange={(value) => {
                  setNewMeeting({ ...newMeeting, attendee_emails: currentUserEmail ? [currentUserEmail, ...value] : value });
                }}
                style={{ width: '100%' }}
                options={adminUsers.filter(admin => admin.email !== currentUserEmail).map(admin => ({
                  label: `${admin.full_name} (${admin.email})`,
                  value: admin.email,
                }))}
              />
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: secondaryTextColor, marginBottom: '4px' }}>Email Reminders</label>
            <Select
              mode="multiple"
              placeholder="Select reminder times"
              value={newMeeting.email_reminders}
              onChange={(value) => setNewMeeting({ ...newMeeting, email_reminders: value })}
              style={{ width: '100%' }}
              options={[
                { label: '30 Minutes Before', value: '30min' },
                { label: '1 Hour Before', value: '1hour' },
                { label: '2 Hours Before', value: '2hours' },
                { label: '4 Hours Before', value: '4hours' },
                { label: '8 Hours Before', value: '8hours' },
                { label: '24 Hours Before', value: '24hours' },
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: secondaryTextColor, marginBottom: '4px' }}>Description</label>
            <TextArea
              rows={3}
              value={newMeeting.description}
              onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
              placeholder="Meeting description or agenda"
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Add To-Do Task"
        open={todoModalVisible}
        onCancel={() => {
          setTodoModalVisible(false);
          setNewTodo({ title: '', description: '', priority: 'medium', due_date: null });
        }}
        onOk={handleAddTodo}
        okText="Add Task"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: secondaryTextColor, marginBottom: '4px' }}>Title *</label>
            <Input
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              placeholder="Task title"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: secondaryTextColor, marginBottom: '4px' }}>Priority</label>
            <Select
              value={newTodo.priority}
              onChange={(value) => setNewTodo({ ...newTodo, priority: value })}
              style={{ width: '100%' }}
              options={[
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' },
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: secondaryTextColor, marginBottom: '4px' }}>Due Date</label>
            <DatePicker
              value={newTodo.due_date ? dayjs(newTodo.due_date) : null}
              onChange={(date) => setNewTodo({ ...newTodo, due_date: date ? date.format('YYYY-MM-DD') : null })}
              style={{ width: '100%' }}
              format="MMM DD, YYYY"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: secondaryTextColor, marginBottom: '4px' }}>Description</label>
            <TextArea
              rows={3}
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              placeholder="Task description"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;