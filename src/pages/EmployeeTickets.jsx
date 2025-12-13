import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Space, message } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, BugOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TicketDetailsDrawer from '../components/TicketDetailsDrawer';

const EmployeeTickets = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (profile?.id && projectId) {
      fetchCurrentProject();
      fetchTickets();
    }
  }, [profile, projectId]);

  const fetchCurrentProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      const { data: assigneeData, error: assigneeError } = await supabase
        .from('project_assignees')
        .select('id')
        .eq('project_id', projectId)
        .eq('employee_id', profile.id)
        .maybeSingle();

      if (assigneeError) throw assigneeError;

      if (!assigneeData) {
        message.error('You do not have access to this project');
        navigate('/projects');
        return;
      }

      setCurrentProject(data);
    } catch (error) {
      message.error('Project not found or access denied');
      navigate('/projects');
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          assigned_user:assigned_to (
            id,
            full_name,
            user_photo
          ),
          projects (
            id,
            name
          )
        `)
        .eq('project_id', projectId)
        .eq('assigned_to', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      message.error('Failed to fetch tickets');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setDetailsDrawerVisible(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'blue',
      in_progress: 'orange',
      completed: 'green',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      medium: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colors[priority] || 'default';
  };

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    return true;
  });

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: '30%',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: '15%',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '15%',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewTicket(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/projects')}
            className="mb-2"
          >
            Back to Projects
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BugOutlined />
            {currentProject?.name} - My Tickets
          </h1>
        </div>
      </div>

      <div className="mb-4 flex gap-3 items-center">
        <Space>
          <Button
            type={statusFilter === 'all' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            type={statusFilter === 'open' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('open')}
          >
            Open
          </Button>
          <Button
            type={statusFilter === 'in_progress' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress
          </Button>
          <Button
            type={statusFilter === 'completed' ? 'primary' : 'default'}
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </Button>
        </Space>

        <span className="text-gray-500 ml-2">
          {filteredTickets.length} tickets
        </span>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredTickets}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-4 bg-gray-50 rounded">
                <p><strong>Description:</strong></p>
                <p>{record.description || 'No description'}</p>
              </div>
            ),
          }}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} tickets`,
          }}
        />
      </Card>

      <TicketDetailsDrawer
        visible={detailsDrawerVisible}
        onClose={() => {
          setDetailsDrawerVisible(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        onUpdate={fetchTickets}
      />
    </div>
  );
};

export default EmployeeTickets;
