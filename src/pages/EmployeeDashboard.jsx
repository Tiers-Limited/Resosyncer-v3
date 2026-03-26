import { useState, useEffect, useRef } from 'react';
import { Card, Statistic, Row, Col, Tag } from 'antd';
import { 
  ClockCircleOutlined, DownloadOutlined, DesktopOutlined,
  CheckCircleOutlined, ThunderboltOutlined, CameraOutlined,
} from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BirthdayWidget from '../components/BirthdayWidget';

const EmployeeDashboard = () => {
  const [todayTimeLogs, setTodayTimeLogs] = useState([]);
  const [activeTimeLog, setActiveTimeLog] = useState(null);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [totalDayHours, setTotalDayHours] = useState(0);
  const [totalBreaks, setTotalBreaks] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [stats, setStats] = useState({ projects: 0, tickets: 0, completed: 0, pendingRequests: 0 });
  const { profile } = useAuth();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (profile?.id) {
      fetchTodayTimeLog();
      fetchStats();
    }
  }, [profile]);

  // Live tick for active session
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused]);

  const fetchTodayTimeLog = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: timeLogs, error } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTodayTimeLogs(timeLogs || []);

      const completed = timeLogs?.filter(l => l.status === 'completed').length || 0;
      const hasActiveOrPaused = timeLogs?.some(l => l.status === 'active' || l.status === 'paused') ? 1 : 0;
      setTotalSessions(completed + hasActiveOrPaused);

      const allBreaks = timeLogs?.reduce((s, l) => s + (l.breaks?.length || 0), 0) || 0;
      setTotalBreaks(allBreaks);

      const activeLog = timeLogs?.find(l => l.status === 'active');
      if (activeLog) {
        setActiveTimeLog(activeLog);
        const elapsed = Math.floor((new Date() - new Date(activeLog.start_time)) / 1000);
        setCurrentSessionTime(elapsed);
        setIsRunning(true);
        setIsPaused(false);
      } else {
        const pausedLog = timeLogs?.find(l => l.status === 'paused');
        if (pausedLog) {
          setActiveTimeLog(pausedLog);
          setIsRunning(false);
          setIsPaused(true);
          setCurrentSessionTime(0);
        } else {
          setActiveTimeLog(null);
          setIsRunning(false);
          setIsPaused(false);
          setCurrentSessionTime(0);
        }
      }

      const completedLogs = timeLogs?.filter(l => l.status === 'completed') || [];
      setTotalDayHours(completedLogs.reduce((s, l) => s + (parseFloat(l.total_hours) || 0), 0));

      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .maybeSingle();

      setTodayAttendance(attendance);
    } catch (error) {
      console.error('Error fetching time log:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [projectsRes, ticketsRes, completedRes, requestsRes] = await Promise.all([
        supabase.from('project_assignees').select('id', { count: 'exact' }).eq('employee_id', profile.id),
        supabase.from('tickets').select('id', { count: 'exact' }).eq('assigned_to', profile.id).neq('status', 'completed'),
        supabase.from('tickets').select('id', { count: 'exact' }).eq('assigned_to', profile.id).eq('status', 'completed'),
        supabase.from('requests').select('id', { count: 'exact' }).eq('user_id', profile.id).eq('status', 'pending'),
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

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalLiveHours = totalDayHours + (parseFloat(activeTimeLog?.total_hours) || 0) + (currentSessionTime / 3600);

  const statusTag = isRunning
    ? { color: '#10b981', bg: '#d1fae5', text: '● Active' }
    : isPaused
    ? { color: '#f59e0b', bg: '#fef3c7', text: '⏸ On Break' }
    : totalDayHours > 0
    ? { color: '#6366f1', bg: '#ede9fe', text: '✓ Done for today' }
    : { color: '#94a3b8', bg: '#f1f5f9', text: '○ Not started' };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <Row gutter={[16, 16]}>
        {/* ── Timer Display Card ─────────────────────────────────────── */}
        <Col xs={24} lg={12}>
          <Card
            className="h-full rounded-2xl border-0 shadow-sm"
            bodyStyle={{ padding: '28px 24px' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-indigo-500 text-lg" />
                <span className="font-semibold text-gray-800">Today's Work</span>
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ color: statusTag.color, background: statusTag.bg }}
              >
                {statusTag.text}
              </span>
            </div>

            {/* Big timer */}
            <div className="text-center mb-6">
              <div
                className="text-6xl font-bold tracking-tight mb-1"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  color: isRunning ? '#10b981' : isPaused ? '#f59e0b' : '#1e293b',
                }}
              >
                {formatTime(currentSessionTime)}
              </div>
              <div className="text-xs text-gray-400">current session time</div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total Hours', value: `${totalLiveHours.toFixed(2)}h`, color: '#6366f1' },
                { label: 'Sessions',    value: totalSessions,                   color: '#10b981' },
                { label: 'Breaks',      value: totalBreaks,                     color: '#f59e0b' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-slate-50 p-3 text-center">
                  <div className="text-xl font-bold" style={{ color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Standup message if submitted */}
            {todayAttendance?.standup_message && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                <div className="text-xs font-semibold text-emerald-600 mb-1 flex items-center gap-1">
                  <CheckCircleOutlined /> Standup submitted
                </div>
                <p className="text-sm text-gray-600 leading-relaxed m-0">{todayAttendance.standup_message}</p>
                <div className="text-xs text-gray-400 mt-1.5">
                  {todayAttendance.hours_worked?.toFixed(2)} hours worked · Status:{' '}
                  <span className="font-medium capitalize">{todayAttendance.status}</span>
                </div>
              </div>
            )}

            {/* Desktop app hint */}
            {!isRunning && !isPaused && !todayAttendance?.standup_message && (
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-center">
                <DesktopOutlined className="text-indigo-400 text-lg mb-1" />
                <p className="text-xs text-indigo-500 m-0">Open the <strong>Resosyncer Desktop App</strong> to start your work timer</p>
              </div>
            )}
          </Card>
        </Col>

        {/* ── Stats Cards ────────────────────────────────────────────── */}
        <Col xs={24} lg={12}>
          <Row gutter={[16, 16]}>
            {[
              { title: 'Active Projects',   value: stats.projects,       color: '#001529' },
              { title: 'Active Tickets',    value: stats.tickets,        color: '#fa8c16' },
              { title: 'Completed Tickets', value: stats.completed,      color: '#52c41a' },
              { title: 'Pending Requests',  value: stats.pendingRequests, color: '#1890ff' },
            ].map((s) => (
              <Col xs={12} key={s.title}>
                <Card className="rounded-2xl border-0 shadow-sm">
                  <Statistic title={s.title} value={s.value} valueStyle={{ color: s.color }} />
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* ── Download Desktop App Banner ─────────────────────────────── */}
      <div className="mt-6">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <DesktopOutlined style={{ fontSize: 24, color: '#6366f1' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-gray-900 font-bold text-base m-0">Resosyncer Desktop</h2>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500">v1.0</span>
                </div>
                <p className="text-gray-400 text-sm m-0">
                  Track work hours, and monitor app usage — automatically.
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  {[
                    { icon: <ClockCircleOutlined />, text: 'Auto time tracking' },
                    { icon: <ThunderboltOutlined />,  text: 'App usage analytics' },
                  ].map((f) => (
                    <div key={f.text} className="flex items-center gap-1 text-gray-400 text-xs">
                      {f.icon}
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href="/Resosyncer Setup 1.0.0.exe"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all no-underline border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
              >
                <DownloadOutlined />
                Windows
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Birthday Widget ─────────────────────────────────────────── */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24}>
          <BirthdayWidget />
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeDashboard;