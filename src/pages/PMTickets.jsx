import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Space, Drawer, Form, Input, Select, message, Modal } from 'antd';
import { PlusOutlined, BugOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import TicketDetailsDrawer from '../components/TicketDetailsDrawer';

const { TextArea } = Input;

const PMTickets = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [form] = Form.useForm();
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    if (profile?.id && projectId) {
      fetchCurrentProject();
      fetchTickets();
      fetchProjects();
      fetchEmployees();
    }
  }, [profile, projectId]);

  const fetchCurrentProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .eq('project_manager_id', profile.id)
        .single();

      if (error) throw error;
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
          projects (
            id,
            name
          ),
          assigned_user:assigned_to (
            id,
            full_name,
            email,
            user_photo
          ),
          creator:created_by (
            id,
            full_name
          )
        `)
        .eq('project_id', projectId)
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

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('project_manager_id', profile.id)
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['employee', 'project_manager'])
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddTicket = () => {
    setEditingTicket(null);
    form.resetFields();
    form.setFieldsValue({ project_id: projectId });
    setDrawerVisible(true);
  };

  const handleEditTicket = (ticket) => {
    setEditingTicket(ticket);
    form.setFieldsValue({
      project_id: ticket.project_id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assigned_to: ticket.assigned_to,
    });
    setDrawerVisible(true);
  };

  const handleDeleteTicket = (ticketId) => {
    Modal.confirm({
      title: 'Delete Ticket',
      content: 'Are you sure you want to delete this ticket?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('tickets')
            .delete()
            .eq('id', ticketId);

          if (error) throw error;

          message.success('Ticket deleted successfully');
          fetchTickets();
        } catch (error) {
          message.error('Failed to delete ticket');
          console.error('Error:', error);
        }
      },
    });
  };

  const handleSaveTicket = async (values) => {
    setLoading(true);
    try {
      if (editingTicket) {
        const { error } = await supabase
          .from('tickets')
          .update({
            project_id: values.project_id,
            title: values.title,
            description: values.description,
            status: values.status,
            priority: values.priority,
            assigned_to: values.assigned_to,
          })
          .eq('id', editingTicket.id);

        if (error) throw error;


        message.success('Ticket updated successfully');
      } else {
        const { error } = await supabase
          .from('tickets')
          .insert([{
            project_id: values.project_id,
            title: values.title,
            description: values.description,
            status: values.status,
            priority: values.priority,
            assigned_to: values.assigned_to,
            created_by: profile.id,
          }]);

        if (error) throw error;


        message.success('Ticket created successfully');
      }

      setDrawerVisible(false);
      form.resetFields();
      fetchTickets();
    } catch (error) {
      message.error('Failed to save ticket');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
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
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    return true;
  });

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: '25%',
    },
    {
      title: 'Assigned To',
      dataIndex: ['assigned_user', 'full_name'],
      key: 'assigned_to',
      width: '20%',
      render: (text) => text || 'Unassigned',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
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
      width: '12%',
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
      width: '12%',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedTicket(record);
              setDetailsDrawerVisible(true);
            }}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTicket(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTicket(record.id)}
          >
            Delete
          </Button>
        </Space>
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
            {currentProject?.name} - Tickets
          </h1>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddTicket}
          style={{ backgroundColor: '#001529' }}
        >
          Create Ticket
        </Button>
      </div>

      <div className="mb-4 flex gap-3">

        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 150 }}
          placeholder="Filter by status"
        >
          <Select.Option value="all">All Status</Select.Option>
          <Select.Option value="open">Open</Select.Option>
          <Select.Option value="in_progress">In Progress</Select.Option>
          <Select.Option value="completed">Completed</Select.Option>
          <Select.Option value="closed">Closed</Select.Option>
        </Select>

        <Select
          value={priorityFilter}
          onChange={setPriorityFilter}
          style={{ width: 150 }}
          placeholder="Filter by priority"
        >
          <Select.Option value="all">All Priority</Select.Option>
          <Select.Option value="low">Low</Select.Option>
          <Select.Option value="medium">Medium</Select.Option>
          <Select.Option value="high">High</Select.Option>
          <Select.Option value="urgent">Urgent</Select.Option>
        </Select>

        <span className="text-gray-500 ml-2 self-center">
          {filteredTickets.length} tickets
        </span>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredTickets}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} tickets`,
          }}
        />
      </Card>

      <Drawer
        title={editingTicket ? 'Edit Ticket' : 'Create New Ticket'}
        placement="right"
        onClose={() => {
          setDrawerVisible(false);
          setEditingTicket(null);
          form.resetFields();
        }}
        open={drawerVisible}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveTicket}
        >
          <Form.Item
            name="project_id"
            label="Project"
            rules={[{ required: true, message: 'Please select a project' }]}
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter ticket title' }]}
          >
            <Input placeholder="Enter ticket title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={4} placeholder="Enter ticket description" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
            initialValue="open"
          >
            <Select placeholder="Select status">
              <Select.Option value="open">Open</Select.Option>
              <Select.Option value="in_progress">In Progress</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="closed">Closed</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select priority' }]}
            initialValue="medium"
          >
            <Select placeholder="Select priority">
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="urgent">Urgent</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="assigned_to"
            label="Assign To"
          >
            <Select placeholder="Select assignee" allowClear>
              {employees.map(emp => (
                <Select.Option key={emp.id} value={emp.id}>
                  {emp.full_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: '#001529' }}>
                {editingTicket ? 'Update Ticket' : 'Create Ticket'}
              </Button>
              <Button onClick={() => setDrawerVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

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

export default PMTickets;
