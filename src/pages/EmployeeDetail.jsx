import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tabs, Table, Button, message, Tag, Skeleton } from 'antd';
import { ArrowLeftOutlined, BankOutlined, UserOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [id]);

  const fetchEmployeeDetails = async () => {
    setLoading(true);
    try {
      const { data: empData, error: empError } = await supabase
        .from('profiles')
        .select(`
          *,
          teams (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (empError) throw empError;
      setEmployee(empData);

      const { data: projectsData, error: projectsError } = await supabase
        .from('project_assignees')
        .select(`
          project_id,
          created_at,
          projects (
            id,
            name,
            status,
            start_date,
            end_date
          )
        `)
        .eq('employee_id', id);

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_to', id)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);

      const { data: payslipsData, error: payslipsError } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (payslipsError) throw payslipsError;
      setPayslips(payslipsData || []);

    } catch (error) {
      message.error('Failed to fetch employee details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const projectColumns = [
    {
      title: 'Project Name',
      dataIndex: ['projects', 'name'],
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: ['projects', 'status'],
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
      dataIndex: ['projects', 'start_date'],
      key: 'start_date',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Assigned Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  const ticketColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
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
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  const payslipColumns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (month) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[month - 1];
      },
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: 'Base Salary',
      dataIndex: 'base_salary',
      key: 'base_salary',
      render: (amount) => `PKR ${amount?.toLocaleString() || 0}`,
    },
    {
      title: 'Commission',
      dataIndex: 'commission',
      key: 'commission',
      render: (amount) => `PKR ${amount?.toLocaleString() || 0}`,
    },
    {
      title: 'Deductions',
      dataIndex: 'deductions',
      key: 'deductions',
      render: (amount) => `PKR ${amount?.toLocaleString() || 0}`,
    },
    {
      title: 'Net Salary',
      dataIndex: 'net_salary',
      key: 'net_salary',
      render: (amount) => <strong>PKR {amount?.toLocaleString() || 0}</strong>,
    },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Details',
      children: (
        <div className="space-y-6">
          <Card title={<span><UserOutlined className="mr-2" />Personal Information</span>}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Full Name">{employee?.full_name}</Descriptions.Item>
              <Descriptions.Item label="Email">{employee?.email}</Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color={employee?.role === 'project_manager' ? 'blue' : 'default'}>
                  {employee?.role === 'project_manager' ? 'Project Manager' : 'Employee'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Contact">{employee?.contact || '-'}</Descriptions.Item>
              <Descriptions.Item label="CNIC">{employee?.cnic || '-'}</Descriptions.Item>
              <Descriptions.Item label="Date of Birth">
                {employee?.dob ? new Date(employee.dob).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>{employee?.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="Github">
                {employee?.github_username ? (
                  <a href={`https://github.com/${employee.github_username}`} target="_blank" rel="noopener noreferrer">
                    {employee.github_username}
                  </a>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={<span><TeamOutlined className="mr-2" />Team & Work</span>}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Team">{employee?.teams?.name || 'Not Assigned'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={<span><DollarOutlined className="mr-2" />Salary Information</span>}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Salary Type">
                {employee?.salary_type ? <Tag color="green">{employee.salary_type.toUpperCase()}</Tag> : '-'}
              </Descriptions.Item>
              {employee?.salary_type === 'fixed' && (
                <Descriptions.Item label="Salary Amount">PKR {employee?.salary_amount?.toLocaleString() || 0}</Descriptions.Item>
              )}
              {employee?.salary_type === 'base_commission' && (
                <>
                  <Descriptions.Item label="Base Salary">PKR {employee?.base_salary?.toLocaleString() || 0}</Descriptions.Item>
                  <Descriptions.Item label="Commission Rate">{employee?.commission_rate || 0}%</Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>

          <Card title={<span><BankOutlined className="mr-2" />Bank Details</span>}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Account Name">{employee?.bank_account_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Account Number">{employee?.bank_account_number || '-'}</Descriptions.Item>
              <Descriptions.Item label="Bank Name" span={2}>{employee?.bank_name || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      ),
    },
    {
      key: 'projects',
      label: 'Projects',
      children: (
        <Card>
          <Table
            columns={projectColumns}
            dataSource={projects}
            rowKey="project_id"
            loading={loading}
            pagination={{ pageSize: 5 }}
          />
        </Card>
      ),
    },
    {
      key: 'tickets',
      label: 'Work History',
      children: (
        <Card>
          <Table
            columns={ticketColumns}
            dataSource={tickets}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'payslips',
      label: 'Pay Slips',
      children: (
        <Card>
          <Table
            columns={payslipColumns}
            dataSource={payslips}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
  ];

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton.Button active size="default" className="mb-4" />
          <Skeleton.Input active size="large" className="w-64" />
        </div>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
        <Card className="mt-4">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <div>
        <div className="mb-6">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/employees')}
            className="mb-4"
          >
            Back to Employees
          </Button>
        </div>
        <Card>
          <div className="text-center py-12">
            <h3 className="text-xl text-gray-500">Employee not found</h3>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/employees')}
          className="mb-4"
        >
          Back to Employees
        </Button>
        <h1 className="text-2xl font-bold">Employee Details</h1>
      </div>

      <Tabs items={tabItems} />
    </div>
  );
};

export default EmployeeDetail;
