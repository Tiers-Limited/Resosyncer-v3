import { useState, useEffect } from 'react';
import { Card, Table, Tag, DatePicker, message, Select } from 'antd';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, [selectedMonth, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'employee');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const startDate = selectedMonth.startOf('month').format('YYYY-MM-DD');
      const endDate = selectedMonth.endOf('month').format('YYYY-MM-DD');

      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (selectedEmployee) {
        query = query.eq('user_id', selectedEmployee);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      message.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (recordId, newStatus) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({ status: newStatus })
        .eq('id', recordId);

      if (error) throw error;

      message.success('Status updated successfully');
      fetchAttendance();
    } catch (error) {
      message.error('Failed to update status');
      console.error('Error:', error);
    }
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['profiles', 'full_name'],
      key: 'employee',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Hours Worked',
      dataIndex: 'hours_worked',
      key: 'hours_worked',
      render: (hours) => `${parseFloat(hours || 0).toFixed(2)} hrs`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          onChange={(value) => handleStatusChange(record.id, value)}
          style={{ width: 120 }}
          options={[
            { value: 'present', label: <Tag color="green">PRESENT</Tag> },
            { value: 'half_day', label: <Tag color="blue">HALF DAY</Tag> },
            { value: 'absent', label: <Tag color="red">ABSENT</Tag> },
            { value: 'leave', label: <Tag color="orange">LEAVE</Tag> },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <div className="flex gap-3">
          <Select
            placeholder="All Employees"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => setSelectedEmployee(value)}
            options={employees.map(emp => ({
              label: emp.full_name,
              value: emp.id,
            }))}
          />
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(date) => setSelectedMonth(date)}
          />
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={attendance}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 15,
            showTotal: (total) => `Total ${total} records`,
          }}
          expandable={{
            expandedRowRender: (record) => record.standup_message ? (
              <div className="p-4 bg-gray-50 rounded">
                <p><strong>Standup Message:</strong></p>
                <p>{record.standup_message}</p>
              </div>
            ) : null,
          }}
        />
      </Card>

    </div>
  );
};

export default Attendance;
