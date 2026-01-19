import { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, message, Avatar, Table, Modal, Space, Tag, DatePicker, Upload } from 'antd';
import { UserOutlined, PlusOutlined, DeleteOutlined, CalendarOutlined, CameraOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const Settings = () => {
  const { profile } = useAuth();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [adminForm] = Form.useForm();
  const [holidayForm] = Form.useForm();
  const [admins, setAdmins] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleUpdateProfile = async (values) => {
    try {
      const updateData = {
        full_name: values.full_name,
        contact: values.contact,
        address: values.address,
      };

      if (values.cnic) updateData.cnic = values.cnic;
      if (values.dob) updateData.dob = values.dob.format('YYYY-MM-DD');
      if (values.bank_name) updateData.bank_name = values.bank_name;
      if (values.bank_account_number) updateData.bank_account_number = values.bank_account_number;
      if (values.bank_account_name) updateData.bank_account_name = values.bank_account_name;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) throw error;

      message.success('Profile updated successfully');
    } catch (error) {
      message.error('Failed to update profile');
    }
  };

  const handlePhotoUpload = async (file) => {
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ user_photo: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      message.success('Profile photo updated successfully');
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
    return false;
  };

  const handleChangePassword = async (values) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.new_password,
      });

      if (error) throw error;

      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      message.error('Failed to change password');
    }
  };

  const fetchHolidays = async () => {
    setLoadingHolidays(true);
    try {
      const { data, error } = await supabase
        .from('public_holidays')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoadingHolidays(false);
    }
  };

  const handleAddHoliday = async (values) => {
    setLoadingHolidays(true);
    try {
      const { error } = await supabase
        .from('public_holidays')
        .insert([{
          name: values.name,
          date: values.date.format('YYYY-MM-DD'),
          created_by: profile.id,
        }]);

      if (error) throw error;

      message.success('Holiday added successfully');
      setHolidayModalVisible(false);
      holidayForm.resetFields();
      fetchHolidays();
    } catch (error) {
      message.error('Failed to add holiday');
      console.error('Error adding holiday:', error);
    } finally {
      setLoadingHolidays(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      const { error } = await supabase
        .from('public_holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;

      message.success('Holiday deleted successfully');
      fetchHolidays();
    } catch (error) {
      message.error('Failed to delete holiday');
      console.error('Error deleting holiday:', error);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAdmins();
      fetchHolidays();
    }
  }, [profile]);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async (values) => {
    setLoadingAdmins(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: values.email,
          full_name: values.full_name,
          role: 'admin',
          contact: values.contact,
        }]);

      if (profileError) throw profileError;

      message.success('Admin added successfully');
      setAdminModalVisible(false);
      adminForm.resetFields();
      fetchAdmins();
    } catch (error) {
      message.error('Failed to add admin: ' + error.message);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (adminId === profile.id) {
      message.error('You cannot delete your own account');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      message.success('Admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      message.error('Failed to delete admin');
    }
  };

  const adminColumns = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
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
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color="green">{record.id === profile.id ? 'You' : 'Active'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.id !== profile.id && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: 'Delete Admin',
                  content: 'Are you sure you want to delete this admin?',
                  onOk: () => handleDeleteAdmin(record.id),
                });
              }}
            >
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const holidayColumns = [
    {
      title: 'Holiday Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Day',
      dataIndex: 'date',
      key: 'day',
      render: (date) => dayjs(date).format('dddd'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            Modal.confirm({
              title: 'Delete Holiday',
              content: 'Are you sure you want to delete this holiday?',
              onOk: () => handleDeleteHoliday(record.id),
            });
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'profile',
      label: 'Profile',
      children: (
        <Card>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Avatar
                size={100}
                src={profile?.user_photo}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#001529' }}
              />
              <Upload
                showUploadList={false}
                beforeUpload={handlePhotoUpload}
                accept="image/*"
              >
                <Button
                  shape="circle"
                  icon={uploadingPhoto ? <LoadingOutlined /> : <CameraOutlined />}
                  size="small"
                  className="absolute bottom-0 right-0 shadow-md"
                  style={{ backgroundColor: '#fff' }}
                  loading={uploadingPhoto}
                />
              </Upload>
            </div>
          </div>

          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleUpdateProfile}
            initialValues={{
              full_name: profile?.full_name,
              email: profile?.email,
              contact: profile?.contact,
              address: profile?.address,
              cnic: profile?.cnic,
              dob: profile?.dob ? dayjs(profile.dob) : null,
              bank_name: profile?.bank_name,
              bank_account_number: profile?.bank_account_number,
              bank_account_name: profile?.bank_account_name,
            }}
          >
            <Form.Item
              name="full_name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
            >
              <Input disabled />
            </Form.Item>

            <Form.Item name="contact" label="Contact">
              <Input />
            </Form.Item>

            <Form.Item name="cnic" label="CNIC">
              <Input placeholder="e.g., 12345-1234567-1" />
            </Form.Item>

            <Form.Item name="dob" label="Date of Birth">
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>

            {profile?.role !== 'admin' && (
              <>
                <Form.Item label="Salary" className="mb-0">
                  <div className="p-3 rounded">
                    <div className="text-lg font-semibold text-green-600">
                      {profile?.salary_type === 'fixed' && profile?.salary_amount
                        ? `PKR ${parseFloat(profile.salary_amount).toLocaleString()}/month`
                        : profile?.salary_type === 'commission'
                        ? `Base: PKR ${parseFloat(profile?.base_salary || 0).toLocaleString()} + ${profile?.commission_rate || 0}% Commission`
                        : 'Not Set'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Contact admin to update salary</div>
                  </div>
                </Form.Item>

                <div className="mt-4 mb-2">
                  <h3 className="font-semibold text-gray-700">Bank Account Details</h3>
                </div>

                <Form.Item name="bank_name" label="Bank Name">
                  <Input placeholder="e.g., Bank Alfalah, HBL, etc." />
                </Form.Item>

                <Form.Item name="bank_account_name" label="Account Title">
                  <Input placeholder="Account holder name" />
                </Form.Item>

                <Form.Item name="bank_account_number" label="Account Number">
                  <Input placeholder="e.g., 1234567890" />
                </Form.Item>
              </>
            )}

            <Form.Item name="address" label="Address">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#001529' }}>
                Update Profile
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: 'password',
      label: 'Change Password',
      children: (
        <Card>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="new_password"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter new password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              name="confirm_password"
              label="Confirm Password"
              dependencies={['new_password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ backgroundColor: '#001529' }}>
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ];

  if (profile?.role === 'admin') {
    tabItems.push({
      key: 'admins',
      label: 'Admin Management',
      children: (
        <Card
          title="Manage Administrators"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAdminModalVisible(true)}
              style={{ backgroundColor: '#001529' }}
            >
              Add Admin
            </Button>
          }
        >
          <Table
            columns={adminColumns}
            dataSource={admins}
            rowKey="id"
            loading={loadingAdmins}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} admins`,
            }}
          />

          <Modal
            title="Add New Admin"
            open={adminModalVisible}
            onCancel={() => {
              setAdminModalVisible(false);
              adminForm.resetFields();
            }}
            onOk={() => adminForm.submit()}
            confirmLoading={loadingAdmins}
          >
            <Form
              form={adminForm}
              layout="vertical"
              onFinish={handleAddAdmin}
            >
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
                <Input placeholder="Enter email" />
              </Form.Item>

              <Form.Item
                name="contact"
                label="Contact"
              >
                <Input placeholder="Enter contact number" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      ),
    });

    tabItems.push({
      key: 'holidays',
      label: 'Public Holidays',
      children: (
        <Card
          title="Manage Public Holidays"
          extra={
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={() => setHolidayModalVisible(true)}
              style={{ backgroundColor: '#001529' }}
            >
              Add Holiday
            </Button>
          }
        >
          <Table
            columns={holidayColumns}
            dataSource={holidays}
            rowKey="id"
            loading={loadingHolidays}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} holidays`,
            }}
          />

          <Modal
            title="Add Public Holiday"
            open={holidayModalVisible}
            onCancel={() => {
              setHolidayModalVisible(false);
              holidayForm.resetFields();
            }}
            onOk={() => holidayForm.submit()}
            confirmLoading={loadingHolidays}
          >
            <Form
              form={holidayForm}
              layout="vertical"
              onFinish={handleAddHoliday}
            >
              <Form.Item
                name="name"
                label="Holiday Name"
                rules={[{ required: true, message: 'Please enter holiday name' }]}
              >
                <Input placeholder="e.g., Christmas, New Year" />
              </Form.Item>

              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      ),
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Tabs items={tabItems} />
    </div>
  );
};

export default Settings;
