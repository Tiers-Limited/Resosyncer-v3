import { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === 'unauthorized') {
      message.error('This email is not registered in our system. Please contact your administrator.');
      window.history.replaceState({}, '', '/signin');
    }
  }, []);

  const handleSignIn = async (values) => {
    setLoading(true);
    try {
      const { error, data } = await signIn(values.email, values.password);
      if (error) {
        message.error(error.message);
      } else if (data?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('suspended')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          message.error('Failed to fetch user profile');
          await supabase.auth.signOut();
          return;
        }

        if (profile?.suspended) {
          message.error('Your account has been suspended. Please contact administrator.');
          await supabase.auth.signOut();
          return;
        }

        message.success('Successfully signed in!');
        navigate('/dashboard');
      }
    } catch (error) {
      message.error('An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (values) => {
    setLoading(true);
    try {
      const { error } = await resetPassword(values.email);
      if (error) {
        message.error(error.message);
      } else {
        message.success('Password reset email sent! Check your inbox.');
        setShowForgotPassword(false);
      }
    } catch (error) {
      message.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex w-full md:w-1/2 bg-[#001529] items-center justify-center p-6 md:p-12">
        <div className="max-w-lg text-white">
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Resosyncer</h1>
            <div className="h-1 w-20 bg-white"></div>
          </div>

          <h2 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6">
            Complete Company Management System
          </h2>

          <p className="text-base md:text-lg mb-4 md:mb-6 text-gray-300">
            Streamline your business operations with our comprehensive management platform designed for modern teams.
          </p>

          <div className="space-y-3 md:space-y-4 hidden md:block">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-white rounded-full mt-2 mr-3"></div>
              <div>
                <h3 className="font-semibold text-lg md:text-xl mb-1">Project Management</h3>
                <p className="text-gray-300 text-sm md:text-base">Track projects, milestones, and deliverables with ease</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-2 h-2 bg-white rounded-full mt-2 mr-3"></div>
              <div>
                <h3 className="font-semibold text-lg md:text-xl mb-1">Team Collaboration</h3>
                <p className="text-gray-300 text-sm md:text-base">Built-in communication and file sharing capabilities</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-2 h-2 bg-white rounded-full mt-2 mr-3"></div>
              <div>
                <h3 className="font-semibold text-lg md:text-xl mb-1">Resource Optimization</h3>
                <p className="text-gray-300 text-sm md:text-base">Efficient attendance tracking and resource allocation</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-2 h-2 bg-white rounded-full mt-2 mr-3"></div>
              <div>
                <h3 className="font-semibold text-lg md:text-xl mb-1">Lead Management</h3>
                <p className="text-gray-300 text-sm md:text-base">Comprehensive CRM to track and convert leads</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6 md:p-12 min-h-screen">
        <div className="w-full max-w-md">
          {!showForgotPassword ? (
            <>
              <h2 className="text-3xl font-bold mb-2 text-[#001529]">Welcome Back</h2>
              <p className="text-gray-600 mb-8">Sign in to access your dashboard</p>

              <Form
                name="signin"
                onFinish={handleSignIn}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Enter your email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, message: 'Please input your password!' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Enter your password"
                  />
                </Form.Item>

                <Form.Item>
                  <div className="flex justify-end mb-4">
                    <Button
                      type="link"
                      onClick={() => setShowForgotPassword(true)}
                      className="p-0"
                    >
                      Forgot Password?
                    </Button>
                  </div>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{ backgroundColor: '#001529', height: '45px' }}
                  >
                    Sign In
                  </Button>
                </Form.Item>
              </Form>

            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-2 text-[#001529]">Reset Password</h2>
              <p className="text-gray-600 mb-8">Enter your email to receive a password reset link</p>

              <Form
                name="forgot-password"
                onFinish={handleForgotPassword}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please input your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Enter your email"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{ backgroundColor: '#001529', height: '45px' }}
                    className="mb-3"
                  >
                    Send Reset Link
                  </Button>

                  <Button
                    type="link"
                    onClick={() => setShowForgotPassword(false)}
                    block
                  >
                    Back to Sign In
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignIn;
