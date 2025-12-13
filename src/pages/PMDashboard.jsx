import { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tag, Statistic } from 'antd';
import { ProjectOutlined, CheckCircleOutlined, ClockCircleOutlined, BugOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BirthdayWidget from '../components/BirthdayWidget';

const PMDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalTickets: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('project_manager_id', profile.id);

      if (projectsError) throw projectsError;

      const totalProjects = projects?.length || 0;
      const inProgressProjects = projects?.filter(p => p.status === 'in_progress').length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;

      const projectIds = projects?.map(p => p.id) || [];

      let totalTickets = 0;
      if (projectIds.length > 0) {
        const { data: tickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('*, projects(name)', { count: 'exact' })
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (ticketsError) throw ticketsError;

        const { count } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds);

        totalTickets = count || 0;
        setRecentTickets(tickets || []);
      }

      setStats({
        totalProjects,
        inProgressProjects,
        completedProjects,
        totalTickets,
      });

      setRecentProjects(projects?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const projectColumns = [
    {
      title: 'Project Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/projects/${record.id}`)}>{text}</a>
      ),
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
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
  ];

  const ticketColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Project',
      dataIndex: ['projects', 'name'],
      key: 'project',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          open: 'blue',
          in_progress: 'orange',
          completed: 'green',
          closed: 'default',
        };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colors = {
          low: 'default',
          medium: 'blue',
          high: 'orange',
          urgent: 'red',
        };
        return <Tag color={colors[priority]}>{priority?.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#001529' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={stats.inProgressProjects}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completedProjects}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Tickets"
              value={stats.totalTickets}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Projects" className="h-full">
            <Table
              columns={projectColumns}
              dataSource={recentProjects}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Tickets" className="h-full">
            <Table
              columns={ticketColumns}
              dataSource={recentTickets}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24}>
          <BirthdayWidget />
        </Col>
      </Row>
    </div>
  );
};

export default PMDashboard;
