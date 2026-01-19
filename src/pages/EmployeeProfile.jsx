import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Upload, message, Avatar, Tabs, Modal, DatePicker } from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { TextArea } = Input;

const EmployeeProfile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const { profile, refreshProfile } = useAuth();

  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        full_name: profile.full_name,
        email: profile.email,
        contact: profile.contact,
        address: profile.address,
        bio: profile.bio,
        cnic: profile.cnic,
        dob: profile.dob ? dayjs(profile.dob) : null,
        bank_name: profile.bank_name,
        bank_account_number: profile.bank_account_number,
        bank_account_name: profile.bank_account_name,
      });
      setProfilePicUrl(profile.user_photo);
    }
  }, [profile, form]);

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      const updateData = {
        full_name: values.full_name,
        contact: values.contact,
        address: values.address,
        bio: values.bio,
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
      refreshProfile();
    } catch (error) {
      message.error('Failed to update profile');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.new_password,
      });

      if (error) throw error;

      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      message.error('Failed to change password');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProfilePicture = async (file) => {
    setUploading(true);
    try {
      if (profilePicUrl) {
        const oldPath = profilePicUrl.split('/').pop();
        await supabase.storage
          .from('profile-pictures')
          .remove([`${profile.id}/${oldPath}`]);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

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
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfilePicUrl(data.publicUrl);
      message.success('Profile picture updated successfully');
      refreshProfile();
    } catch (error) {
      message.error('Failed to upload profile picture');
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const tabItems = [
    {
      key: 'profile',
      label: 'Profile Information',
      children: (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <div className="flex justify-center mb-6">
            <div className="text-center">
              <Avatar
                size={120}
                src={profilePicUrl}
                icon={<UserOutlined />}
                className="mb-3"
              />
              <Upload
                beforeUpload={handleUploadProfilePicture}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  Upload Picture
                </Button>
              </Upload>
            </div>
          </div>

          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="contact"
            label="Contact Number"
          >
            <Input placeholder="Enter contact number" />
          </Form.Item>

          <Form.Item
            name="cnic"
            label="CNIC"
          >
            <Input placeholder="e.g., 12345-1234567-1" />
          </Form.Item>

          <Form.Item
            name="dob"
            label="Date of Birth"
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

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

          <Form.Item
            name="bank_name"
            label="Bank Name"
          >
            <Input placeholder="e.g., Bank Alfalah, HBL, etc." />
          </Form.Item>

          <Form.Item
            name="bank_account_name"
            label="Account Title"
          >
            <Input placeholder="Account holder name" />
          </Form.Item>

          <Form.Item
            name="bank_account_number"
            label="Account Number"
          >
            <Input placeholder="e.g., 1234567890" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
          >
            <TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          <Form.Item
            name="bio"
            label="Bio"
          >
            <TextArea rows={4} placeholder="Tell us about yourself..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: '#001529' }}>
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'password',
      label: 'Change Password',
      children: (
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
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
            />
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
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: '#001529' }}>
              Change Password
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
      </div>

      <Card>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
};

export default EmployeeProfile;
