import { useState, useEffect, useRef } from 'react';
import { Card, Button, Statistic, Row, Col, Modal, Form, Input, message, Tag } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BirthdayWidget from '../components/BirthdayWidget';

const { TextArea } = Input;

const EmployeeDashboard = () => {
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const [todayTimeLogs, setTodayTimeLogs] = useState([]);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [totalDayHours, setTotalDayHours] = useState(0);
  const [totalBreaks, setTotalBreaks] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [standupModal, setStandupModal] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [stats, setStats] = useState({
    projects: 0,
    tickets: 0,
    completed: 0,
    pendingRequests: 0,
  });
  const [form] = Form.useForm();
  const { profile } = useAuth();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (profile?.id) {
      fetchTodayTimeLog();
      fetchStats();
    }
  }, [profile]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const fetchTodayTimeLog = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: timeLogs, error: timeLogsError } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .order('created_at', { ascending: true });

      if (timeLogsError) throw timeLogsError;

      setTodayTimeLogs(timeLogs || []);

      // Count total sessions (completed + active/paused)
      const completedSessionsCount = timeLogs?.filter(log => log.status === 'completed').length || 0;
      const hasActiveOrPaused = timeLogs?.some(log => log.status === 'active' || log.status === 'paused') ? 1 : 0;
      setTotalSessions(completedSessionsCount + hasActiveOrPaused);

      // Count total breaks from all logs
      const allBreaks = timeLogs?.reduce((sum, log) => {
        return sum + (log.breaks?.length || 0);
      }, 0) || 0;
      setTotalBreaks(allBreaks);

      // Check if there's an active log
      const activeLog = timeLogs?.find(log => log.status === 'active');
      if (activeLog) {
        setActiveTimeLog(activeLog);
        const startTime = new Date(activeLog.start_time);
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        setCurrentSessionTime(elapsed);
        setIsRunning(true);
        setIsPaused(false);
      } else {
        // Check if there's a paused log
        const pausedLog = timeLogs?.find(log => log.status === 'paused');
        if (pausedLog) {
          setActiveTimeLog(pausedLog);
          setIsRunning(false);
          setIsPaused(true);
          setCurrentSessionTime(0); // Don't show time for paused sessions
        } else {
          setActiveTimeLog(null);
          setIsRunning(false);
          setIsPaused(false);
          setCurrentSessionTime(0);
        }
      }

      // Calculate total hours from completed logs only
      const completedLogs = timeLogs?.filter(log => log.status === 'completed') || [];
      const totalHours = completedLogs.reduce((sum, log) => sum + (parseFloat(log.total_hours) || 0), 0);
      setTotalDayHours(totalHours);

      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .maybeSingle();

      if (attendanceError && attendanceError.code !== 'PGRST116') throw attendanceError;
      setTodayAttendance(attendance);

      if (attendance?.standup_message) {
        form.setFieldsValue({ standup_message: attendance.standup_message });
      }
    } catch (error) {
      console.error('Error fetching time log:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [projectsRes, ticketsRes, completedRes, requestsRes] = await Promise.all([
        supabase
          .from('project_assignees')
          .select('id', { count: 'exact' })
          .eq('employee_id', profile.id),
        supabase
          .from('tickets')
          .select('id', { count: 'exact' })
          .eq('assigned_to', profile.id)
          .neq('status', 'completed'),
        supabase
          .from('tickets')
          .select('id', { count: 'exact' })
          .eq('assigned_to', profile.id)
          .eq('status', 'completed'),
        supabase
          .from('requests')
          .select('id', { count: 'exact' })
          .eq('user_id', profile.id)
          .eq('status', 'pending'),
      ]);

      setStats({
        projects: projectsRes.count || 0,
        tickets: ticketsRes.count || 0,
        completed: completedRes.count || 0,
        pendingRequests: requestsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStart = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('time_logs')
        .insert([{
          user_id: profile.id,
          date: today,
          start_time: new Date().toISOString(),
          status: 'active',
          total_hours: 0,
          breaks: [], // Initialize empty breaks array
        }])
        .select()
        .single();

      if (error) throw error;
      setActiveTimeLog(data);
      setCurrentSessionTime(0);
      setIsRunning(true);
      setIsPaused(false);
      message.success('Timer started');
      await fetchTodayTimeLog();
    } catch (error) {
      message.error('Failed to start timer');
      console.error('Error:', error);
    }
  };

  const handleResume = async () => {
    try {
      if (!activeTimeLog) return;

      // Get existing breaks
      const existingBreaks = activeTimeLog.breaks || [];
      
      // Find the last break and update its resume_time
      const updatedBreaks = [...existingBreaks];
      if (updatedBreaks.length > 0) {
        const lastBreakIndex = updatedBreaks.length - 1;
        updatedBreaks[lastBreakIndex] = {
          ...updatedBreaks[lastBreakIndex],
          resume_time: new Date().toISOString(),
        };
      }

      // Update the paused log to active with new start time
      const { data, error } = await supabase
        .from('time_logs')
        .update({
          status: 'active',
          start_time: new Date().toISOString(),
          breaks: updatedBreaks,
        })
        .eq('id', activeTimeLog.id)
        .select()
        .single();

      if (error) throw error;

      setActiveTimeLog(data);
      setCurrentSessionTime(0);
      setIsRunning(true);
      setIsPaused(false);
      message.success('Timer resumed');
      await fetchTodayTimeLog();
    } catch (error) {
      message.error('Failed to resume timer');
      console.error('Error:', error);
    }
  };

  const handlePause = async () => {
    try {
      // Calculate hours worked in this session
      const hours = currentSessionTime / 3600;
      
      // Get current total_hours from the log and add this session's hours
      const currentTotalHours = parseFloat(activeTimeLog.total_hours) || 0;
      const newTotalHours = currentTotalHours + hours;

      // Get existing breaks and add new break record
      const existingBreaks = activeTimeLog.breaks || [];
      const newBreak = {
        pause_time: new Date().toISOString(),
        resume_time: null, // Will be filled when resumed
      };

      // Update to paused status
      const { error } = await supabase
        .from('time_logs')
        .update({
          status: 'paused',
          end_time: new Date().toISOString(),
          total_hours: newTotalHours,
          breaks: [...existingBreaks, newBreak],
        })
        .eq('id', activeTimeLog.id);

      if (error) throw error;

      setIsRunning(false);
      setIsPaused(true);
      setCurrentSessionTime(0);
      message.success('Break started - click Resume to continue');

      // Refresh to update state
      await fetchTodayTimeLog();
    } catch (error) {
      message.error('Failed to pause timer');
      console.error('Error:', error);
    }
  };

  const handleStop = () => {
    const currentSessionHours = currentSessionTime / 3600;
    const currentLogHours = parseFloat(activeTimeLog?.total_hours) || 0;
    const projectedTotalHours = totalDayHours + currentLogHours + currentSessionHours;

    if (projectedTotalHours < 8) {
      Modal.confirm({
        title: 'Minimum working hours not met',
        content: `You have worked ${projectedTotalHours.toFixed(2)} hours today. Minimum working hours for present status is 8 hours. Are you sure you want to stop?`,
        onOk: () => {
          confirmStop();
        },
      });
    } else {
      confirmStop();
    }
  };

  const confirmStop = async () => {
    try {
      // If timer is running, calculate current session hours
      let finalTotalHours = parseFloat(activeTimeLog.total_hours) || 0;
      if (isRunning) {
        const hours = currentSessionTime / 3600;
        finalTotalHours += hours;
      }

      // Complete the log
      const { error } = await supabase
        .from('time_logs')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          total_hours: finalTotalHours,
        })
        .eq('id', activeTimeLog.id);

      if (error) throw error;

      setIsRunning(false);
      setIsPaused(false);
      setCurrentSessionTime(0);
      setActiveTimeLog(null);
      message.success('Timer stopped');

      await fetchTodayTimeLog();
      setStandupModal(true);
    } catch (error) {
      message.error('Failed to stop timer');
      console.error('Error:', error);
    }
  };

  const handleSubmitStandup = async (values) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: allTimeLogs, error: fetchError } = await supabase
        .from('time_logs')
        .select('total_hours')
        .eq('user_id', profile.id)
        .eq('date', today)
        .eq('status', 'completed');

      if (fetchError) throw fetchError;

      const totalHours = allTimeLogs?.reduce((sum, log) => sum + (parseFloat(log.total_hours) || 0), 0) || 0;

      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert([{
          user_id: profile.id,
          date: today,
          hours_worked: totalHours,
          status: totalHours >= 8 ? 'present' : totalHours >= 4 ? 'half_day' : 'absent',
          standup_message: values.standup_message,
        }], {
          onConflict: 'user_id,date'
        });

      if (attendanceError) throw attendanceError;

      message.success('Standup message saved successfully');
      setStandupModal(false);
      await fetchTodayTimeLog();
    } catch (error) {
      message.error('Failed to save standup message');
      console.error('Error:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const calculateBreakDuration = (pauseTime, resumeTime) => {
    if (!pauseTime || !resumeTime) return null;
    const pause = new Date(pauseTime);
    const resume = new Date(resumeTime);
    const duration = (resume - pause) / 1000 / 60; // in minutes
    return duration.toFixed(0);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card className="h-full">
            <div className="text-center">
              <ClockCircleOutlined style={{ fontSize: 48, color: isPaused ? '#faad14' : '#001529', marginBottom: 16 }} />
              <h2 className="text-xl font-semibold mb-4">Work Timer</h2>
              {isPaused && (
                <Tag color="warning" className="mb-2" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  ON BREAK
                </Tag>
              )}
              <div className="text-5xl font-bold mb-4" style={{ color: isPaused ? '#faad14' : '#001529' }}>
                {formatTime(currentSessionTime)}
              </div>
              
              {/* Today's Summary Stats */}
              <div className="mb-4 pb-3 border-b border-gray-200">
                <Row gutter={8}>
                  <Col xs={8}>
                    <div className="text-xs text-gray-500 mb-1">Sessions</div>
                    <div className="text-lg font-semibold text-blue-600">{totalSessions}</div>
                  </Col>
                  <Col xs={8}>
                    <div className="text-xs text-gray-500 mb-1">Total Hours</div>
                    <div className="text-lg font-semibold text-green-600">
                      {(totalDayHours + (activeTimeLog?.total_hours || 0) + (currentSessionTime / 3600)).toFixed(2)}h
                    </div>
                  </Col>
                  <Col xs={8}>
                    <div className="text-xs text-gray-500 mb-1">Breaks</div>
                    <div className="text-lg font-semibold text-orange-600">{totalBreaks}</div>
                  </Col>
                </Row>
              </div>

              {activeTimeLog?.total_hours > 0 && isPaused && (
                <div className="text-sm text-blue-600 mb-3">
                  Current session: {activeTimeLog.total_hours.toFixed(2)} hours
                </div>
              )}
              
              <div className="flex justify-center gap-3">
                {!isRunning && !isPaused && !todayAttendance?.standup_message && (
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStart}
                    style={{ backgroundColor: '#52c41a' }}
                  >
                    {totalDayHours > 0 ? 'Start New Session' : 'Start Work'}
                  </Button>
                )}
                {isPaused && !todayAttendance?.standup_message && (
                  <>
                    <Button
                      type="primary"
                      size="large"
                      icon={<PlayCircleOutlined />}
                      onClick={handleResume}
                      style={{ backgroundColor: '#52c41a' }}
                    >
                      Resume Work
                    </Button>
                    <Button
                      danger
                      size="large"
                      icon={<StopOutlined />}
                      onClick={handleStop}
                    >
                      End Day & Submit Standup
                    </Button>
                  </>
                )}
                {isRunning && (
                  <>
                    <Button
                      type="default"
                      size="large"
                      icon={<PauseCircleOutlined />}
                      onClick={handlePause}
                    >
                      Take Break
                    </Button>
                    <Button
                      danger
                      size="large"
                      icon={<StopOutlined />}
                      onClick={handleStop}
                    >
                      End Day & Submit Standup
                    </Button>
                  </>
                )}
              </div>
              {todayAttendance?.standup_message && (
                <div className="mt-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded text-left">
                    <div className="text-xs text-green-700 font-semibold mb-1">Today's Standup (Submitted):</div>
                    <div className="text-sm text-gray-700">{todayAttendance.standup_message}</div>
                  </div>
                  <div className="text-center mt-2 text-sm text-gray-600">
                    Hours worked: {todayAttendance.hours_worked?.toFixed(2)} hours
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Row gutter={[16, 16]}>
            <Col xs={12}>
              <Card>
                <Statistic
                  title="Active Projects"
                  value={stats.projects}
                  valueStyle={{ color: '#001529' }}
                />
              </Card>
            </Col>
            <Col xs={12}>
              <Card>
                <Statistic
                  title="Active Tickets"
                  value={stats.tickets}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={12}>
              <Card>
                <Statistic
                  title="Completed Tickets"
                  value={stats.completed}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12}>
              <Card>
                <Statistic
                  title="Pending Requests"
                  value={stats.pendingRequests}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24}>
          <BirthdayWidget />
        </Col>
      </Row>

      <Modal
        title="Submit Standup Message"
        open={standupModal}
        onCancel={() => {
          setStandupModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        closable={false}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitStandup}
        >
          <p className="mb-4">Total hours worked today: <strong>{totalDayHours.toFixed(2)} hours</strong></p>
          <Form.Item
            name="standup_message"
            label="What did you accomplish today?"
            rules={[{ required: true, message: 'Please enter your standup message' }]}
          >
            <TextArea
              rows={6}
              placeholder="What did you accomplish today? Any blockers?"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeDashboard;