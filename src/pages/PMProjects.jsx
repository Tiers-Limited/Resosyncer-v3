import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Space, Drawer, Form, Input, Select, DatePicker, message, Collapse } from 'antd';
import { PlusOutlined, BugOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Panel } = Collapse;

const PMProjects = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ticketDrawerVisible, setTicketDrawerVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketForm] = Form.useForm();

  useEffect(() => {
    if (profile?.id) {
      fetchProjects();
      fetchEmployees();
    }
  }, [profile]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_assignees (
            employee_id,
            profiles:employee_id (
              id,
              full_name,
              email
            )
          )
        `)
        .eq('project_manager_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      message.error('Failed to fetch projects');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'employee')
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchProjectTickets = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          profiles:assigned_to (
            full_name,
            email
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleAssignEmployee = async (projectId, employeeIds) => {
    try {
      const { data: currentAssignments } = await supabase
        .from('project_assignees')
        .select('employee_id')
        .eq('project_id', projectId);

      const currentEmployeeIds = currentAssignments?.map(a => a.employee_id) || [];
      const newEmployeeIds = employeeIds.filter(id => !currentEmployeeIds.includes(id));

      const { error: deleteError } = await supabase
        .from('project_assignees')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) throw deleteError;

      if (employeeIds && employeeIds.length > 0) {
        const assignments = employeeIds.map(empId => ({
          project_id: projectId,
          employee_id: empId,
          created_by: profile.id
        }));

        const { error: insertError } = await supabase
          .from('project_assignees')
          .insert(assignments);

        if (insertError) throw insertError;

        const { data: project } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (newEmployeeIds.length > 0 && project) {
          const { data: newEmployees } = await supabase
            .from('profiles')
            .select('email, full_name')
            .in('id', newEmployeeIds);

        }
      }

      message.success('Employees assigned successfully');
      fetchProjects();
    } catch (error) {
      message.error('Failed to assign employees');
      console.error('Error:', error);
    }
  };

  const handleCreateTicket = async (values) => {
    try {
      const ticketData = {
        project_id: selectedProject.id,
        title: values.title,
        description: values.description,
        status: values.status || 'open',
        priority: values.priority,
        assigned_to: values.assigned_to,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
      };

      if (selectedTicket) {
        const { error } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', selectedTicket.id);

        if (error) throw error;
        message.success('Ticket updated successfully');
      } else {
        const { error } = await supabase
          .from('tickets')
          .insert([{...ticketData, created_by: profile.id}]);

        if (error) throw error;

        if (values.assigned_to) {
          const { data: assignedUser } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', values.assigned_to)
            .single();

        }

        message.success('Ticket created successfully');
      }

      setTicketDrawerVisible(false);
      ticketForm.resetFields();
      setSelectedTicket(null);
      fetchProjectTickets(selectedProject.id);
    } catch (error) {
      message.error('Failed to save ticket');
      console.error('Error:', error);
    }
  };

  const openTicketDrawer = (project, ticket = null) => {
    setSelectedProject(project);
    setSelectedTicket(ticket);
    fetchProjectTickets(project.id);

    if (ticket) {
      ticketForm.setFieldsValue({
        ...ticket,
        due_date: ticket.due_date ? dayjs(ticket.due_date) : null,
      });
    } else {
      ticketForm.resetFields();
    }

    setTicketDrawerVisible(true);
  };

  const ticketColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => openTicketDrawer(selectedProject, record)}>{text}</a>
      ),
    },
    {
      title: 'Assigned To',
      dataIndex: ['profiles', 'full_name'],
      key: 'assigned_to',
      render: (text) => text || '-',
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
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
  ];

  const expandedRowRender = (project) => {
    const assignedEmployees = project.project_assignees?.map(pe => pe.profiles?.id) || [];

    return (
      <div className="p-4 bg-gray-50">
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Assign Employees:</h4>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select employees"
            value={assignedEmployees}
            onChange={(values) => handleAssignEmployee(project.id, values)}
          >
            {employees.map(emp => (
              <Select.Option key={emp.id} value={emp.id}>
                {emp.full_name} ({emp.email})
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="mb-2">
          <h4 className="font-semibold">Tickets:</h4>
        </div>
      </div>
    );
  };

  const columns = [
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
      title: 'Type',
      dataIndex: 'project_type',
      key: 'project_type',
      render: (type) => <Tag>{type?.toUpperCase()}</Tag>,
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
    {
      title: 'Assigned Employees',
      key: 'employees',
      render: (_, record) => record.project_assignees?.length || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/projects/${record.id}/tickets`)}
          style={{ backgroundColor: '#001529' }}
        >
          View Tickets
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender,
            rowExpandable: () => true,
          }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} projects`,
          }}
        />
      </Card>

      <Drawer
        title={selectedTicket ? 'Edit Ticket' : 'Create Ticket'}
        width={600}
        open={ticketDrawerVisible}
        onClose={() => {
          setTicketDrawerVisible(false);
          setSelectedTicket(null);
          ticketForm.resetFields();
        }}
        extra={
          <Space>
            <Button onClick={() => {
              setTicketDrawerVisible(false);
              setSelectedTicket(null);
              ticketForm.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => ticketForm.submit()} style={{ backgroundColor: '#001529' }}>
              {selectedTicket ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Project: {selectedProject?.name}</h3>

          <Form
            form={ticketForm}
            layout="vertical"
            onFinish={handleCreateTicket}
          >
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
            >
              <TextArea rows={4} placeholder="Enter ticket description" />
            </Form.Item>

            <Form.Item
              name="assigned_to"
              label="Assign To"
            >
              <Select placeholder="Select employee" allowClear>
                {selectedProject?.project_assignees?.map(pe => (
                  <Select.Option key={pe.profiles?.id} value={pe.profiles?.id}>
                    {pe.profiles?.full_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="priority"
              label="Priority"
              rules={[{ required: true, message: 'Please select priority' }]}
            >
              <Select placeholder="Select priority">
                <Select.Option value="low">Low</Select.Option>
                <Select.Option value="medium">Medium</Select.Option>
                <Select.Option value="high">High</Select.Option>
                <Select.Option value="urgent">Urgent</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
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
              name="due_date"
              label="Due Date"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </div>

        {tickets.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">All Tickets</h4>
            <Table
              columns={ticketColumns}
              dataSource={tickets}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default PMProjects;
