import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Space, message } from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  BugOutlined,
  TableOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
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
  const [viewMode, setViewMode] = useState('kanban');
  const [draggedTicket, setDraggedTicket] = useState(null);

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
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        message.error('Project not found');
        navigate('/projects');
        return;
      }

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

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      message.success(`Ticket status updated to ${newStatus.replace('_', ' ')}`);
      await fetchTickets();
    } catch (error) {
      message.error('Failed to update ticket status');
      console.error('Error:', error);
    }
  };

  const handleDragStart = (e, ticket) => {
    setDraggedTicket(ticket);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();

    if (!draggedTicket) return;

    if (draggedTicket.status !== newStatus) {
      await handleUpdateTicketStatus(draggedTicket.id, newStatus);
    }

    setDraggedTicket(null);
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

  const kanbanColumns = [
    { key: 'open', title: 'Open', color: '#1890ff' },
    { key: 'in_progress', title: 'In Progress', color: '#fa8c16' },
    { key: 'completed', title: 'Completed', color: '#52c41a' },
    { key: 'closed', title: 'Closed', color: '#8c8c8c' },
  ];

  const getTicketsByStatus = (status) => {
    return filteredTickets.filter(ticket => ticket.status === status);
  };

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

        <Space>
          <Button
            icon={<AppstoreOutlined />}
            type={viewMode === 'kanban' ? 'primary' : 'default'}
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          <Button
            icon={<TableOutlined />}
            type={viewMode === 'table' ? 'primary' : 'default'}
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
        </Space>
      </div>

      {viewMode === 'table' && (
        <>
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

            <span className="ml-2">
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
                  <div className="p-4 rounded">
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
        </>
      )}

      {viewMode === 'kanban' && (
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {kanbanColumns.map((column) => {
              const columnTickets = getTicketsByStatus(column.key);

              return (
                <div
                  key={column.key}
                  className="flex-shrink-0 w-80"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.key)}
                >
                  <div
                    className="rounded-lg p-4"
                    style={{ minHeight: '600px' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                        {column.title}
                      </h3>
                      <Tag>{columnTickets.length}</Tag>
                    </div>

                    <div className="space-y-3">
                      {columnTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ticket)}
                          className="rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move border border-gray-200"
                          style={{
                            opacity: draggedTicket?.id === ticket.id ? 0.5 : 1,
                          }}
                        >
                          <div className="mb-2">
                            <h4 className="font-medium text-base mb-1">
                              {ticket.title}
                            </h4>
                            {ticket.description && (
                              <p className="text-sm line-clamp-2">
                                {ticket.description}
                              </p>
                            )}
                          </div>

                          <div className="mb-3 space-y-2">
                            <Tag color={getPriorityColor(ticket.priority)} className="m-0">
                              {ticket.priority?.toUpperCase()}
                            </Tag>
                            {ticket.due_date && (
                              <div className="text-xs flex items-center gap-1">
                                <ClockCircleOutlined />
                                Due: {new Date(ticket.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            {ticket.assigned_user && (
                              <div className="flex items-center gap-2 text-xs">
                                <UserOutlined />
                                <span>{ticket.assigned_user.full_name}</span>
                              </div>
                            )}
                            <Button
                              type="link"
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => handleViewTicket(ticket)}
                              className="p-0"
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
