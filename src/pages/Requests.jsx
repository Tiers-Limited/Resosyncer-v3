import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, message, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const { TextArea } = Input;

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [responseModal, setResponseModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const { profile } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('requests')
        .select(`
          *,
          profiles!requests_user_id_fkey (
            full_name,
            email
          )
        `);

      if (profile?.role === 'project_manager') {
        query = query.eq('user_id', profile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      message.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (values) => {
    if (!profile?.id) {
      message.error('Please wait for profile to load');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('requests')
        .insert([{
          user_id: profile.id,
          request_type: values.request_type,
          subject: values.subject,
          description: values.description,
          status: 'pending',
        }]);

      if (error) throw error;

      message.success('Request submitted successfully');
      setCreateModal(false);
      createForm.resetFields();
      fetchRequests();
    } catch (error) {
      message.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (values) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({
          status: values.status,
          response: values.response,
          responded_by: profile.id,
          responded_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      message.success('Response submitted successfully');
      setResponseModal(false);
      form.resetFields();
      fetchRequests();
    } catch (error) {
      message.error('Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['profiles', 'full_name'],
      key: 'employee',
    },
    {
      title: 'Type',
      dataIndex: 'request_type',
      key: 'request_type',
      render: (type) => <Tag color="blue">{type.toUpperCase()}</Tag>,
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        if (profile?.role === 'project_manager') {
          return <span className="text-gray-400">-</span>;
        }
        return record.status === 'pending' ? (
          <Button
            type="link"
            onClick={() => {
              setSelectedRequest(record);
              setResponseModal(true);
            }}
          >
            Respond
          </Button>
        ) : (
          <span className="text-gray-400">Responded</span>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Requests</h1>
        {profile?.role === 'project_manager' && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModal(true)}
            style={{ backgroundColor: '#001529' }}
          >
            New Request
          </Button>
        )}
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-4 bg-gray-50 rounded">
                <p className="mb-2"><strong>Description:</strong></p>
                <p className="mb-4">{record.description || 'No description provided'}</p>
                {record.response && (
                  <>
                    <p className="mb-2"><strong>Response:</strong></p>
                    <p>{record.response}</p>
                  </>
                )}
              </div>
            ),
          }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} requests`,
          }}
        />
      </Card>

      <Modal
        title="Create New Request"
        open={createModal}
        onCancel={() => {
          setCreateModal(false);
          createForm.resetFields();
        }}
        onOk={() => createForm.submit()}
        confirmLoading={loading}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateRequest}
        >
          <Form.Item
            name="request_type"
            label="Request Type"
            rules={[{ required: true, message: 'Please select request type' }]}
          >
            <Select placeholder="Select request type">
              <Select.Option value="advance_salary">Advance Salary</Select.Option>
              <Select.Option value="leave">Leave Request</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter subject' }]}
          >
            <Input placeholder="Enter subject" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={4} placeholder="Enter detailed description" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Respond to Request"
        open={responseModal}
        onCancel={() => {
          setResponseModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRespond}
        >
          <Form.Item
            name="status"
            label="Decision"
            rules={[{ required: true, message: 'Please select a decision' }]}
          >
            <Select placeholder="Select decision">
              <Select.Option value="approved">Approve</Select.Option>
              <Select.Option value="rejected">Reject</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="response"
            label="Response Message"
            rules={[{ required: true, message: 'Please enter a response' }]}
          >
            <TextArea rows={4} placeholder="Enter your response" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Requests;
