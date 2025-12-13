import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Badge, Modal, Checkbox, Button, Input, DatePicker, Select } from 'antd';
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
import { supabase } from '../lib/supabase';
import BirthdayWidget from '../components/BirthdayWidget';
import ClientWorldMap from '../components/ClientWorldMap';
import dayjs from 'dayjs';

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Projects"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#001529' }}
            />
            <div className="mt-2 text-xs text-gray-500">
              <span className="text-green-600">
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
              valueStyle={{ color: '#001529' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Teams"
              value={stats.totalTeams}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#001529' }}
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

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <ClockCircleOutlined />
                <span>Active Employees Today</span>
                <Badge count={activeEmployees.length} style={{ backgroundColor: '#52c41a' }} />
              </div>
            }
          >
            {activeEmployees.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No employees working currently</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {activeEmployees.map((emp) => (
                  <Card
                    key={emp.id}
                    size="small"
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 w-full">
                        {emp.status === 'active' ? (
                          <PlayCircleOutlined className="text-green-500 text-lg" />
                        ) : (
                          <PauseCircleOutlined className="text-orange-500 text-lg" />
                        )}
                        <span className="font-medium truncate flex-1">{emp.profiles?.full_name}</span>
                      </div>
                      <div className="w-full">
                        <Tag color={emp.status === 'active' ? 'green' : 'orange'} className="w-full text-center">
                          {emp.status === 'active' ? 'Working' : 'Paused'}
                        </Tag>
                      </div>
                      <div className="text-xl font-mono font-bold text-blue-600">
                        {formatTime(getElapsedTime(emp))}
                      </div>
                      {emp.standup_message && (
                        <button
                          onClick={() => handleViewStandup(emp)}
                          className="text-xs text-blue-500 hover:text-blue-700 underline"
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

      <Row gutter={[16, 16]} className="mt-6">
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

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card
            title={<div className="flex items-center gap-2"><CheckCircleOutlined /> To-Do List</div>}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setNewTodo({ title: '', description: '', priority: 'medium', due_date: null });
                setTodoModalVisible(true);
              }}>
                Add Task
              </Button>
            }
            className="h-full"
          >
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {todos.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No tasks yet</div>
              ) : (
todos.map((todo) => (
                  <div key={todo.id} className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id, todo.completed)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {todo.title}
                        </span>
                        {todo.priority && (
                          <Tag color={todo.priority === 'high' ? 'red' : todo.priority === 'medium' ? 'orange' : 'default'} className="text-xs">
                            {todo.priority}
                          </Tag>
                        )}
                      </div>
                      {todo.due_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Due: {dayjs(todo.due_date).format('MMM DD, YYYY')}
                        </div>
                      )}
                      {todo.description && (
                        <div className="text-xs text-gray-600 mt-1">
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
            title={<div className="flex items-center gap-2"><CalendarOutlined /> Meeting Reminders</div>}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setNewMeeting({ title: '', meeting_date: null, description: '', email_reminders: [], attendee_type: 'individual', attendee_emails: [] });
                setMeetingModalVisible(true);
              }}>
                Add Meeting
              </Button>
            }
            className="h-full"
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {meetings.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No meetings scheduled</div>
              ) : (
meetings.map((meeting) => (
                  <div key={meeting.id} className="p-3 border rounded hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{meeting.title}</span>
                          {meeting.attendee_type === 'individual' ? (
                            <Tag color="default" className="text-xs">Only Me</Tag>
                          ) : (
                            <Tag color="blue" className="text-xs">
                              {meeting.attendee_emails?.length || 0} Attendees
                            </Tag>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {dayjs(meeting.meeting_date).format('MMM DD, YYYY - h:mm A')}
                        </div>
                        {meeting.description && (
                          <div className="text-sm text-gray-500 mt-1">{meeting.description}</div>
                        )}
                        {meeting.email_reminders && meeting.email_reminders.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {meeting.email_reminders.map((reminder, idx) => (
                              <Tag key={idx} color="blue" className="text-xs">
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

      <Row gutter={[16, 16]} className="mt-6">
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
            <p className="text-gray-600 mb-2">
              <strong>Employee:</strong> {selectedStandup.profiles?.full_name}
            </p>
            <p className="text-gray-600 mb-2">
              <strong>Date:</strong> {selectedStandup.date}
            </p>
            <p className="text-gray-600 mb-4">
              <strong>Total Hours:</strong> {selectedStandup.total_hours?.toFixed(2) || 0} hours
            </p>
            <div className="bg-gray-50 p-4 rounded">
              <p className="font-medium mb-2">Message:</p>
              <p className="whitespace-pre-wrap">{selectedStandup.standup_message}</p>
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <Input
              value={newMeeting.title}
              onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
              placeholder="Meeting title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <DatePicker
              showTime
              value={newMeeting.meeting_date ? dayjs(newMeeting.meeting_date) : null}
              onChange={(date) => setNewMeeting({ ...newMeeting, meeting_date: date ? date.toISOString() : null })}
              className="w-full"
              format="MMM DD, YYYY h:mm A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attendees *</label>
            <Select
              value={newMeeting.attendee_type}
              onChange={(value) => {
                setNewMeeting({
                  ...newMeeting,
                  attendee_type: value,
                  attendee_emails: value === 'individual' ? [] : (currentUserEmail ? [currentUserEmail] : [])
                });
              }}
              className="w-full"
              options={[
                { label: 'Individual (Only Me)', value: 'individual' },
                { label: 'Multiple Admins', value: 'multiple' },
              ]}
            />
          </div>
          {newMeeting.attendee_type === 'multiple' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Admins *</label>
              <div className="mb-2">
                <Tag color="green">You (Included by default)</Tag>
              </div>
              <Select
                mode="multiple"
                placeholder="Select additional admins to invite"
                value={newMeeting.attendee_emails.filter(email => email !== currentUserEmail)}
                onChange={(value) => {
                  setNewMeeting({ ...newMeeting, attendee_emails: currentUserEmail ? [currentUserEmail, ...value] : value });
                }}
                className="w-full"
                options={adminUsers.filter(admin => admin.email !== currentUserEmail).map(admin => ({
                  label: `${admin.full_name} (${admin.email})`,
                  value: admin.email,
                }))}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Reminders</label>
            <Select
              mode="multiple"
              placeholder="Select reminder times"
              value={newMeeting.email_reminders}
              onChange={(value) => setNewMeeting({ ...newMeeting, email_reminders: value })}
              className="w-full"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <Input
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <Select
              value={newTodo.priority}
              onChange={(value) => setNewTodo({ ...newTodo, priority: value })}
              className="w-full"
              options={[
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <DatePicker
              value={newTodo.due_date ? dayjs(newTodo.due_date) : null}
              onChange={(date) => setNewTodo({ ...newTodo, due_date: date ? date.format('YYYY-MM-DD') : null })}
              className="w-full"
              format="MMM DD, YYYY"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
