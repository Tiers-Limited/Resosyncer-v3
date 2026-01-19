import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  DatePicker,
  message,
  Select,
  Switch,
  Collapse,
} from "antd";
import { BulbOutlined, CalendarOutlined } from "@ant-design/icons";
import { supabase } from "../lib/supabase";
import { theme } from "antd";
import dayjs from "dayjs";

const { Panel } = Collapse;

const Attendance = () => {
  const { token } = theme.useToken();
  const isDark =
    token.colorBgContainer === "#1f2937" || token.colorBgLayout === "#111827";

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
        .from("profiles")
        .select("id, full_name")
        .eq("role", "employee");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const startDate = selectedMonth.startOf("month").format("YYYY-MM-DD");
      const endDate = selectedMonth.endOf("month").format("YYYY-MM-DD");

      let query = supabase
        .from("attendance")
        .select(
          `
          *,
          profiles (
            full_name,
            email
          )
        `
        )
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (selectedEmployee) {
        query = query.eq("user_id", selectedEmployee);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      message.error("Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (recordId, newStatus) => {
    try {
      const { error } = await supabase
        .from("attendance")
        .update({ status: newStatus })
        .eq("id", recordId);

      if (error) throw error;

      message.success("Status updated successfully");
      fetchAttendance();
    } catch (error) {
      message.error("Failed to update status");
      console.error("Error:", error);
    }
  };

  // Group attendance by date
  const groupedAttendance = attendance.reduce((acc, record) => {
    const date = record.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedAttendance).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const getStatusColor = (status) => {
    const colors = {
      present: "green",
      half_day: "blue",
      absent: "red",
      leave: "orange",
    };
    return colors[status] || "default";
  };

  const getDateStats = (records) => {
    const stats = {
      present: 0,
      half_day: 0,
      absent: 0,
      leave: 0,
    };
    records.forEach((record) => {
      stats[record.status] = (stats[record.status] || 0) + 1;
    });
    return stats;
  };

  const columns = [
    {
      title: "Employee",
      dataIndex: ["profiles", "full_name"],
      key: "employee",
      render: (text) => (
        <span className={isDark ? "text-gray-200" : "text-gray-900"}>
          {text}
        </span>
      ),
    },
    {
      title: "Hours Worked",
      dataIndex: "hours_worked",
      key: "hours_worked",
      render: (hours) => (
        <span className={isDark ? "text-gray-300" : "text-gray-700"}>
          {parseFloat(hours || 0).toFixed(2)} hrs
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          value={status}
          onChange={(value) => handleStatusChange(record.id, value)}
          style={{ width: 130 }}
          className={isDark ? "dark-select-inline" : ""}
        >
          <Select.Option value="present">
            <Tag color="green">PRESENT</Tag>
          </Select.Option>
          <Select.Option value="half_day">
            <Tag color="blue">HALF DAY</Tag>
          </Select.Option>
          <Select.Option value="absent">
            <Tag color="red">ABSENT</Tag>
          </Select.Option>
          <Select.Option value="leave">
            <Tag color="orange">LEAVE</Tag>
          </Select.Option>
        </Select>
      ),
    },
  ];

  return (
    <div
      className={`min-h-screen p-6 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1
          className={`text-2xl font-bold ${
            isDark ? "text-gray-100" : "text-gray-900"
          }`}
        >
          Attendance
        </h1>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
          </div>
          <Select
            placeholder="All Employees"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => setSelectedEmployee(value)}
            options={employees.map((emp) => ({
              label: emp.full_name,
              value: emp.id,
            }))}
            className={isDark ? "dark-select" : ""}
          />
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(date) => setSelectedMonth(date)}
            className={isDark ? "dark-datepicker" : ""}
          />
        </div>
      </div>

      {loading ? (
        <Card
          className={isDark ? "dark-card" : ""}
          bodyStyle={{
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
          }}
        >
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Loading attendance records...
          </div>
        </Card>
      ) : sortedDates.length === 0 ? (
        <Card
          className={isDark ? "dark-card" : ""}
          bodyStyle={{
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
          }}
        >
          <div
            className={`text-center py-8 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No attendance records found for this month
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const records = groupedAttendance[date];
            const stats = getDateStats(records);
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString("en-US", {
              weekday: "long",
            });
            const formattedDate = dateObj.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <Card
                key={date}
                className={isDark ? "dark-card" : ""}
                bodyStyle={{
                  padding: 0,
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                }}
              >
                <Collapse
                  className={isDark ? "dark-collapse" : ""}
                  defaultActiveKey={[date]}
                >
                  <Panel
                    header={
                      <div className="flex items-center justify-between pr-4">
                        <div className="flex items-center gap-3">
                          <CalendarOutlined
                            className={
                              isDark ? "text-blue-400" : "text-blue-600"
                            }
                          />
                          <div>
                            <div
                              className={`font-semibold ${
                                isDark ? "text-gray-100" : "text-gray-900"
                              }`}
                            >
                              {formattedDate}
                            </div>
                            <div
                              className={`text-sm ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {dayName}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {stats.present > 0 && (
                            <Tag color="green">{stats.present} Present</Tag>
                          )}
                          {stats.half_day > 0 && (
                            <Tag color="blue">{stats.half_day} Half Day</Tag>
                          )}
                          {stats.absent > 0 && (
                            <Tag color="red">{stats.absent} Absent</Tag>
                          )}
                          {stats.leave > 0 && (
                            <Tag color="orange">{stats.leave} Leave</Tag>
                          )}
                          <Tag
                            className={
                              isDark ? "bg-gray-700 text-gray-200" : ""
                            }
                          >
                            Total: {records.length}
                          </Tag>
                        </div>
                      </div>
                    }
                    key={date}
                  >
                    <Table
                      columns={columns}
                      dataSource={records}
                      rowKey="id"
                      pagination={false}
                      className={isDark ? "dark-table" : ""}
                      expandable={{
                        expandedRowRender: (record) =>
                          record.standup_message ? (
                            <div
                              className={`p-4 rounded ${
                                isDark ? "bg-gray-800" : "bg-gray-50"
                              }`}
                            >
                              <p
                                className={`mb-2 ${
                                  isDark ? "text-gray-200" : "text-gray-900"
                                }`}
                              >
                                <strong>Standup Message:</strong>
                              </p>
                              <p
                                className={
                                  isDark ? "text-gray-300" : "text-gray-700"
                                }
                              >
                                {record.standup_message}
                              </p>
                            </div>
                          ) : null,
                      }}
                    />
                  </Panel>
                </Collapse>
              </Card>
            );
          })}
        </div>
      )}

      <style>{`
        ${
          isDark
            ? `
          .dark-card {
            background-color: #1f2937;
            border-color: #374151;
          }
          
          .dark-select .ant-select-selector {
            background-color: #374151 !important;
            border-color: #4b5563 !important;
            color: #f3f4f6 !important;
          }
          
          .dark-select .ant-select-arrow {
            color: #9ca3af;
          }
          
          .dark-select-inline .ant-select-selector {
            background-color: #374151 !important;
            border-color: #4b5563 !important;
          }
          
          .dark-datepicker .ant-picker {
            background-color: #374151;
            border-color: #4b5563;
          }
          
          .dark-datepicker .ant-picker input {
            color: #f3f4f6;
          }
          
          .dark-datepicker .ant-picker-suffix {
            color: #9ca3af;
          }
          
          .dark-collapse {
            background-color: #1f2937;
            border-color: #374151;
          }
          
          .dark-collapse .ant-collapse-item {
            border-color: #374151;
          }
          
          .dark-collapse .ant-collapse-header {
            background-color: #1f2937;
            color: #f3f4f6;
          }
          
          .dark-collapse .ant-collapse-content {
            background-color: #1f2937;
            border-color: #374151;
          }
          
          .dark-collapse .ant-collapse-content-box {
            padding: 0;
          }
          
          .dark-table .ant-table {
            background-color: #1f2937;
            color: #f3f4f6;
          }
          
          .dark-table .ant-table-thead > tr > th {
            background-color: #111827;
            color: #d1d5db;
            border-bottom-color: #374151;
          }
          
          .dark-table .ant-table-tbody > tr {
            background-color: #1f2937;
          }
          
          .dark-table .ant-table-tbody > tr:hover > td {
            background-color: #374151;
          }
          
          .dark-table .ant-table-tbody > tr > td {
            border-bottom-color: #374151;
            color: #f3f4f6;
          }
          
          .dark-table .ant-table-expanded-row > td {
            background-color: #1f2937;
          }
          
          .dark-table .ant-table-placeholder {
            background-color: #1f2937;
            color: #9ca3af;
          }
        `
            : ""
        }
      `}</style>
    </div>
  );
};

export default Attendance;
