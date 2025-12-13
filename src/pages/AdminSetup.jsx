import { useState } from 'react';
import { Card, Form, Input, Button, message, Result } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSetup = async (values) => {
    setLoading(true);
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
        }]);

      if (profileError) throw profileError;

      message.success('Admin account created successfully!');
      setSuccess(true);
    } catch (error) {
      message.error(error.message || 'Failed to create admin account');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#001529] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <Result
            status="success"
            title="Admin Account Created!"
            subTitle="You can now sign in with your credentials."
            extra={
              <Button type="primary" href="/signin" style={{ backgroundColor: '#001529' }}>
                Go to Sign In
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001529] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Resosyncer</h1>
          <h2 className="text-xl text-gray-600">Admin Setup</h2>
          <p className="text-sm text-gray-500 mt-2">Create your admin account</p>
        </div>

        <Form
          layout="vertical"
          onFinish={handleSetup}
        >
          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your full name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter admin email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ backgroundColor: '#001529' }}
            >
              Create Admin Account
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AdminSetup;
