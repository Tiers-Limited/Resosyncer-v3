import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const EmployeeProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_assignees')
        .select(`
          *,
          projects (
            id,
            name,
            status,
            start_date,
            end_date
          )
        `)
        .eq('employee_id', profile.id);

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      message.error('Failed to fetch projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTickets = (project) => {
    navigate(`/projects/${project.projects.id}/tickets`);
  };

  const columns = [
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
          active: 'green',
          planning: 'blue',
          on_hold: 'orange',
          completed: 'default',
        };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Start Date',
      dataIndex: ['projects', 'start_date'],
      key: 'start_date',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewTickets(record)}
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
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} projects`,
          }}
        />
      </Card>
    </div>
  );
};

export default EmployeeProjects;
