import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, message, Modal, Drawer, Form, Input, DatePicker, Select, InputNumber, Switch, Upload, Avatar } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const { TextArea } = Input;

const BANKS = [
  'National Bank of Pakistan',
  'Habib Bank Limited',
  'MCB Bank Limited',
  'United Bank Limited',
  'Allied Bank Limited',
  'Bank Alfalah',
  'Meezan Bank',
  'Bank of Punjab',
  'Bank of Khyber',
  'Summit Bank',
  'JS Bank',
  'Askari Bank',
  'Sindh Bank',
  'Zarai Taraqiati Bank Limited',
  'First Women Bank Limited',
  'Al Baraka Bank Pakistan',
  'Dubai Islamic Bank Pakistan',
  'BankIslami Pakistan',
  'MCB Islamic Bank',
  'Standard Chartered Bank',
  'Industrial and Commercial Bank of China',
  'Deutsche Bank',
  'Bank of China',
  'Samba Bank',
  'Khushhali Microfinance Bank',
  'U Microfinance Bank',
  'Mobilink Microfinance Bank',
  'Telenor Microfinance Bank',
  'NRSP Microfinance Bank',
  'FINCA Microfinance Bank',
  'Apna Microfinance Bank',
  'First Microfinance Bank',
  'Advans Pakistan',
  'Pak Oman Microfinance Bank',
  'Pakistan Development Fund',
  'House Building Finance Company',
  'Pak Oman Investment Company',
  'Pakistan Kuwait Investment Company',
  'JazzCash',
  'Easypaisa',
  'SadaPay',
  'NayaPay',
  'Other'
];

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [credentialsModal, setCredentialsModal] = useState(false);
  const [newUserCredentials, setNewUserCredentials] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
    fetchTeams();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          teams (
            id,
            name
          )
        `)
        .in('role', ['employee', 'project_manager'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      message.error('Failed to fetch employees');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleAddEmployee = async (values) => {
    setLoading(true);
    try {
      if (editingEmployee) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: values.full_name,
            role: values.role || 'employee',
            contact: values.contact,
            cnic: values.cnic,
            dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
            address: values.address,
            github_username: values.github_username,
            team_id: values.team_id,
            salary_type: values.salary_type,
            salary_amount: values.salary_type === 'fixed' ? values.salary_amount : null,
            base_salary: values.salary_type === 'base_commission' ? values.base_salary : null,
            commission_rate: values.salary_type === 'base_commission' ? values.commission_rate : null,
            bank_account_name: values.bank_account_name,
            bank_account_number: values.bank_account_number,
            bank_name: values.bank_name === 'Other' ? values.custom_bank_name : values.bank_name,
          })
          .eq('id', editingEmployee.id);

        if (profileError) throw profileError;
        message.success('Employee updated successfully');
      } else {
        const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: generatedPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/signin`,
          }
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('Failed to create user');

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email: values.email,
            full_name: values.full_name,
            role: values.role || 'employee',
            contact: values.contact,
            cnic: values.cnic,
            dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
            address: values.address,
            github_username: values.github_username,
            team_id: values.team_id,
            salary_type: values.salary_type,
            salary_amount: values.salary_type === 'fixed' ? values.salary_amount : null,
            base_salary: values.salary_type === 'base_commission' ? values.base_salary : null,
            commission_rate: values.salary_type === 'base_commission' ? values.commission_rate : null,
            bank_account_name: values.bank_account_name,
            bank_account_number: values.bank_account_number,
            bank_name: values.bank_name === 'Other' ? values.custom_bank_name : values.bank_name,
          }]);

        if (profileError) throw profileError;

        setNewUserCredentials({
          email: values.email,
          password: generatedPassword,
          name: values.full_name,
          role: values.role || 'employee',
        });
        setCredentialsModal(true);
        message.success('Employee created successfully');
      }

      if (editingEmployee) {
        setDrawerVisible(false);
        setEditingEmployee(null);
        form.resetFields();
        setSelectedBank('');
      } else {
        setDrawerVisible(false);
        form.resetFields();
        setSelectedBank('');
      }
      fetchEmployees();
    } catch (error) {
      message.error(editingEmployee ? 'Failed to update employee' : 'Failed to add employee');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setProfilePicUrl(employee.user_photo);
    const bankName = employee.bank_name || '';
    const isKnownBank = bankName && BANKS.includes(bankName);
    setSelectedBank(isKnownBank ? bankName : (bankName ? 'Other' : ''));

    form.setFieldsValue({
      ...employee,
      dob: employee.dob ? dayjs(employee.dob) : null,
      bank_name: isKnownBank ? bankName : (bankName ? 'Other' : undefined),
      custom_bank_name: isKnownBank ? '' : bankName,
    });
    setDrawerVisible(true);
  };

  const handleUploadProfilePicture = async (file) => {
    if (!editingEmployee) {
      message.warning('Please save the employee first before uploading a profile picture');
      return false;
    }

    setUploading(true);
    try {
      if (profilePicUrl) {
        const oldPath = profilePicUrl.split('/').pop();
        await supabase.storage
          .from('profile-pictures')
          .remove([`${editingEmployee.id}/${oldPath}`]);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${editingEmployee.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ user_photo: data.publicUrl })
        .eq('id', editingEmployee.id);

      if (updateError) throw updateError;

      setProfilePicUrl(data.publicUrl);
      message.success('Profile picture updated successfully');
      fetchEmployees();
    } catch (error) {
      message.error('Failed to upload profile picture');
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleSuspendToggle = async (employeeId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ suspended: !currentStatus })
        .eq('id', employeeId);

      if (error) throw error;
      message.success(`Employee ${!currentStatus ? 'suspended' : 'activated'} successfully`);
      fetchEmployees();
    } catch (error) {
      message.error('Failed to update employee status');
      console.error('Error:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      message.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error) {
      message.error('Failed to delete employee');
      console.error('Error:', error);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text, record) => (
        <a onClick={() => navigate(`/employees/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
      render: (text) => text || '-',
    },
    {
      title: 'Team',
      dataIndex: ['teams', 'name'],
      key: 'team',
      render: (team) => team || 'Not Assigned',
    },
    {
      title: 'Salary Type',
      dataIndex: 'salary_type',
      key: 'salary_type',
      render: (type) => type ? <Tag>{type.toUpperCase()}</Tag> : '-',
    },
    {
      title: 'Status',
      dataIndex: 'suspended',
      key: 'suspended',
      render: (suspended) => (
        <Tag color={suspended ? 'red' : 'green'}>
          {suspended ? 'SUSPENDED' : 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/employees/${record.id}`)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditEmployee(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            icon={record.suspended ? <CheckCircleOutlined /> : <StopOutlined />}
            onClick={() => handleSuspendToggle(record.id, record.suspended)}
            style={{ color: record.suspended ? 'green' : 'orange' }}
          >
            {record.suspended ? 'Activate' : 'Suspend'}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Delete Employee',
                content: 'Are you sure you want to delete this employee?',
                onOk: () => handleDeleteEmployee(record.id),
              });
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setDrawerVisible(true)}
          style={{ backgroundColor: '#001529' }}
        >
          Add Employee
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={employees}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} employees`,
          }}
        />
      </Card>

      <Drawer
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        placement="right"
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setEditingEmployee(null);
          setSelectedBank('');
          setProfilePicUrl(null);
          form.resetFields();
        }}
        width={700}
        extra={
          <Space>
            <Button onClick={() => {
              setDrawerVisible(false);
              setEditingEmployee(null);
              setSelectedBank('');
              setProfilePicUrl(null);
              form.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => form.submit()} loading={loading} style={{ backgroundColor: '#001529' }}>
              {editingEmployee ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddEmployee}
        >
          {editingEmployee && (
            <div className="flex justify-center mb-6">
              <div className="text-center">
                <Avatar
                  size={100}
                  src={profilePicUrl}
                  icon={<UserOutlined />}
                  className="mb-3"
                />
                <Upload
                  beforeUpload={handleUploadProfilePicture}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />} loading={uploading} size="small">
                    Upload Picture
                  </Button>
                </Upload>
              </div>
            </div>
          )}

          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input placeholder="Enter email" disabled={editingEmployee} />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
            initialValue="employee"
          >
            <Select placeholder="Select role">
              <Select.Option value="employee">Employee</Select.Option>
              <Select.Option value="project_manager">Project Manager</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="contact" label="Contact">
            <Input placeholder="Enter contact number" />
          </Form.Item>

          <Form.Item name="bank_account_name" label="Bank Account Name">
            <Input placeholder="Enter account holder name" />
          </Form.Item>

          <Form.Item name="bank_account_number" label="Bank Account Number">
            <Input placeholder="Enter account number" />
          </Form.Item>

          <Form.Item name="bank_name" label="Bank Name">
            <Select
              placeholder="Select bank"
              showSearch
              onChange={(value) => setSelectedBank(value)}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {BANKS.map(bank => (
                <Select.Option key={bank} value={bank}>
                  {bank}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {selectedBank === 'Other' && (
            <Form.Item
              name="custom_bank_name"
              label="Custom Bank Name"
              rules={[{ required: true, message: 'Please enter bank name' }]}
            >
              <Input placeholder="Enter bank name" />
            </Form.Item>
          )}

          <Form.Item name="cnic" label="CNIC">
            <Input placeholder="Enter CNIC" />
          </Form.Item>

          <Form.Item name="dob" label="Date of Birth">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <TextArea rows={2} placeholder="Enter address" />
          </Form.Item>

          <Form.Item name="github_username" label="Github Username">
            <Input placeholder="Enter github username" />
          </Form.Item>

          <Form.Item name="team_id" label="Team">
            <Select placeholder="Select team" allowClear>
              {teams.map(team => (
                <Select.Option key={team.id} value={team.id}>
                  {team.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="salary_type"
            label="Salary Type"
          >
            <Select placeholder="Select salary type">
              <Select.Option value="fixed">Fixed Salary</Select.Option>
              <Select.Option value="base_commission">Base Salary + Commission</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.salary_type !== currentValues.salary_type
            }
          >
            {({ getFieldValue }) => {
              const salaryType = getFieldValue('salary_type');

              if (salaryType === 'fixed') {
                return (
                  <Form.Item name="salary_amount" label="Salary Amount">
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="Enter salary amount"
                      min={0}
                    />
                  </Form.Item>
                );
              }

              if (salaryType === 'base_commission') {
                return (
                  <>
                    <Form.Item name="base_salary" label="Base Salary">
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Enter base salary"
                        min={0}
                      />
                    </Form.Item>
                    <Form.Item name="commission_rate" label="Commission Rate (%)">
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Enter commission rate"
                        min={0}
                        max={100}
                      />
                    </Form.Item>
                  </>
                );
              }

              return null;
            }}
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title="User Created Successfully"
        open={credentialsModal}
        onOk={() => {
          setCredentialsModal(false);
          setNewUserCredentials(null);
        }}
        onCancel={() => {
          setCredentialsModal(false);
          setNewUserCredentials(null);
        }}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              setCredentialsModal(false);
              setNewUserCredentials(null);
            }}
          >
            OK
          </Button>
        ]}
      >
        <div className="space-y-4">
          <p className="text-green-600 font-semibold">
            {newUserCredentials?.role === 'project_manager' ? 'Project Manager' : 'Employee'} account created successfully!
          </p>
          <div className="bg-gray-50 p-4 rounded border">
            <p className="font-semibold mb-2">Login Credentials:</p>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Name:</span> {newUserCredentials?.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {newUserCredentials?.email}
              </div>
              <div>
                <span className="font-medium">Password:</span> <code className="bg-gray-200 px-2 py-1 rounded">{newUserCredentials?.password}</code>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Please save these credentials and share them with the user. The user can change the password after logging in.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;
