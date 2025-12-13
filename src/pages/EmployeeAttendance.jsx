import { useState, useEffect } from 'react';
import { Card, Calendar, Badge, Tag, Modal, Descriptions } from 'antd';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const EmployeeAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.id) {
      fetchAttendance();
      fetchHolidays();
    }
  }, [profile]);

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('public_holidays')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  };

  const getAttendanceForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return attendance.find(record => record.date === dateStr);
  };

  const getHolidayForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return holidays.find(holiday => holiday.date === dateStr);
  };

  const dateCellRender = (value) => {
    const holiday = getHolidayForDate(value);
    const record = getAttendanceForDate(value);

    if (holiday) {
      return (
        <div className="text-center">
          <Tag color="red" className="text-xs">{holiday.name}</Tag>
        </div>
      );
    }

    if (!record) return null;

    let status = 'default';
    let text = record.status?.toUpperCase();

    switch (record.status) {
      case 'present':
        status = 'success';
        break;
      case 'absent':
        status = 'error';
        break;
      case 'half_day':
        status = 'warning';
        text = 'HALF DAY';
        break;
      case 'leave':
        status = 'processing';
        break;
      default:
        status = 'default';
    }

    return (
      <div className="text-center">
        <Badge status={status} text={text} />
      </div>
    );
  };

  const handleDateSelect = (date) => {
    const record = getAttendanceForDate(date);
    if (record) {
      setSelectedDate(date);
      setSelectedRecord(record);
      setDetailModal(true);
    }
  };

  const getMonthStats = (date) => {
    const monthStart = date.startOf('month');
    const monthEnd = date.endOf('month');

    const monthAttendance = attendance.filter(record => {
      const recordDate = dayjs(record.date);
      return recordDate.isAfter(monthStart.subtract(1, 'day')) &&
             recordDate.isBefore(monthEnd.add(1, 'day'));
    });

    const present = monthAttendance.filter(r => r.status === 'present').length;
    const halfDay = monthAttendance.filter(r => r.status === 'half_day').length;
    const absent = monthAttendance.filter(r => r.status === 'absent').length;
    const leave = monthAttendance.filter(r => r.status === 'leave').length;

    return { present, halfDay, absent, leave, total: monthAttendance.length };
  };

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const stats = getMonthStats(currentMonth);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Attendance</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.present}</div>
            <div className="text-sm text-gray-600">Present Days</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">{stats.halfDay}</div>
            <div className="text-sm text-gray-600">Half Days</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.absent}</div>
            <div className="text-sm text-gray-600">Absent Days</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.leave}</div>
            <div className="text-sm text-gray-600">Leave Days</div>
          </div>
        </Card>
      </div>

      <Card>
        <Calendar
          cellRender={dateCellRender}
          onSelect={handleDateSelect}
          onPanelChange={(date) => setCurrentMonth(date)}
        />
      </Card>

      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Legend:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Badge status="success" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge status="warning" />
            <span>Half Day</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge status="error" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge status="processing" />
            <span>Leave</span>
          </div>
        </div>
      </div>

      <Modal
        title={`Attendance Details - ${selectedDate?.format('MMMM D, YYYY')}`}
        open={detailModal}
        onCancel={() => {
          setDetailModal(false);
          setSelectedDate(null);
          setSelectedRecord(null);
        }}
        footer={null}
      >
        {selectedRecord && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Status">
              <Tag color={
                selectedRecord.status === 'present' ? 'green' :
                selectedRecord.status === 'absent' ? 'red' :
                selectedRecord.status === 'half_day' ? 'orange' : 'blue'
              }>
                {selectedRecord.status?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Check In">
              {selectedRecord.check_in ? new Date(selectedRecord.check_in).toLocaleTimeString() : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Check Out">
              {selectedRecord.check_out ? new Date(selectedRecord.check_out).toLocaleTimeString() : '-'}
            </Descriptions.Item>
            {selectedRecord.notes && (
              <Descriptions.Item label="Notes">
                {selectedRecord.notes}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default EmployeeAttendance;
