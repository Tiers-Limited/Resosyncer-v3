import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const { TextArea } = Input;

const EmployeeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { profile } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      message.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (values) => {
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

      const { data: admins } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'admin')
        .eq('suspended', false);


      message.success('Request submitted successfully');
      setModalVisible(false);
      form.resetFields();
      fetchRequests();
    } catch (error) {
      message.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'request_type',
      key: 'request_type',
      render: (type) => {
        const labels = {
          advance_salary: 'Advance Salary',
          leave: 'Leave Request',
          other: 'Other',
        };
        return <Tag color="blue">{labels[type] || type.toUpperCase()}</Tag>;
      },
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
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Requests</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
          style={{ backgroundColor: '#001529' }}
        >
          New Request
        </Button>
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
                <div className="mb-4">
                  <p className="mb-2"><strong>Description:</strong></p>
                  <p>{record.description || 'No description provided'}</p>
                </div>
                {record.response && (
                  <div>
                    <p className="mb-2"><strong>Admin Response:</strong></p>
                    <p className="text-gray-700">{record.response}</p>
                    {record.responded_at && (
                      <p className="text-sm text-gray-500 mt-2">
                        Responded on: {new Date(record.responded_at).toLocaleString()}
                      </p>
                    )}
                  </div>
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
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form
          form={form}
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
    </div>
  );
};

export default EmployeeRequests;
