import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const { TextArea } = Input;

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [form] = Form.useForm();
  const { profile } = useAuth();

  useEffect(() => {
    fetchTeams();
    fetchEmployees();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          profiles:profiles(id, full_name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      message.error('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['employee', 'project_manager']);

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddTeam = async (values) => {
    if (!profile?.id && !editingTeam) {
      message.error('Please wait for profile to load');
      return;
    }

    setLoading(true);
    try {
      if (editingTeam) {
        const { error: teamError } = await supabase
          .from('teams')
          .update({
            name: values.name,
            description: values.description,
          })
          .eq('id', editingTeam.id);

        if (teamError) throw teamError;

        const { error: clearError } = await supabase
          .from('profiles')
          .update({ team_id: null })
          .eq('team_id', editingTeam.id);

        if (clearError) throw clearError;

        if (values.members && values.members.length > 0) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ team_id: editingTeam.id })
            .in('id', values.members);

          if (updateError) throw updateError;
        }

        message.success('Team updated successfully');
      } else {
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .insert([{
            name: values.name,
            description: values.description,
            created_by: profile.id,
          }])
          .select()
          .single();

        if (teamError) throw teamError;

        if (values.members && values.members.length > 0) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ team_id: teamData.id })
            .in('id', values.members);

          if (updateError) throw updateError;
        }

        message.success('Team created successfully');
      }

      setModalVisible(false);
      setEditingTeam(null);
      form.resetFields();
      fetchTeams();
    } catch (error) {
      message.error(editingTeam ? 'Failed to update team' : 'Failed to create team');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    const memberIds = team.profiles?.map(p => p.id) || [];
    form.setFieldsValue({
      name: team.name,
      description: team.description,
      members: memberIds,
    });
    setModalVisible(true);
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      const { error: clearError } = await supabase
        .from('profiles')
        .update({ team_id: null })
        .eq('team_id', teamId);

      if (clearError) throw clearError;

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      message.success('Team deleted successfully');
      fetchTeams();
    } catch (error) {
      message.error('Failed to delete team');
      console.error('Error:', error);
    }
  };

  const columns = [
    {
      title: 'Team Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTeam(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Delete Team',
                content: 'Are you sure you want to delete this team? Team members will be unassigned.',
                onOk: () => handleDeleteTeam(record.id),
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
        <h1 className="text-2xl font-bold">Teams</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
          style={{ backgroundColor: '#001529' }}
        >
          Create Team
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={teams}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-4 bg-gray-50 rounded">
                <p className="font-semibold mb-3">Team Members:</p>
                {record.profiles && record.profiles.length > 0 ? (
                  <div className="space-y-2">
                    {record.profiles.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                        <span className="font-medium">{member.full_name}</span>
                        <span className="text-gray-500">({member.email})</span>
                        <span className="ml-auto">
                          {member.role === 'project_manager' ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Project Manager</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Employee</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No members in this team</p>
                )}
              </div>
            ),
          }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} teams`,
          }}
        />
      </Card>

      <Modal
        title={editingTeam ? 'Edit Team' : 'Create New Team'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTeam(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddTeam}
        >
          <Form.Item
            name="name"
            label="Team Name"
            rules={[{ required: true, message: 'Please enter team name' }]}
          >
            <Input placeholder="Enter team name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter team description" />
          </Form.Item>

          <Form.Item name="members" label="Team Members">
            <Select
              mode="multiple"
              placeholder="Select team members"
              options={employees.map(emp => ({
                label: `${emp.full_name} (${emp.email})`,
                value: emp.id,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Teams;
