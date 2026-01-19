import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import {
  Button,
  message,
  Select,
  Input,
  Avatar,
  Drawer,
  DatePicker,
  Tag,
  Popover,
  Skeleton,
  Segmented,
  Badge,
  Modal,
  Switch,
} from "antd";
const { TextArea } = Input;
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  FolderOutlined,
  CloseOutlined,
  SmileOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  TableOutlined,
  CalendarOutlined,
  CommentOutlined,
  DeleteOutlined,
  InboxOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";
import { theme } from 'antd';
import debounce from "lodash.debounce";
import CountrySelect from "../components/CountrySelect";
import IconPicker from "../components/IconPicker";
import * as flags from "country-flag-icons/react/3x2";

// Theme Context
const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

const Projects = () => {
  const { token } = theme.useToken();
  const isDark =
    token.colorBgContainer === "#1f2937" || token.colorBgLayout === "#111827";

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [viewMode, setViewMode] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [teams, setTeams] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchTeams();
    fetchProjectManagers();
    fetchEmployees();
  }, [showArchived]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchText, statusFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          teams (
            id,
            name
          ),
          project_manager:project_manager_id (
            id,
            full_name,
            user_photo
          )
        `
        )
        .eq("is_archived", showArchived)
        .order("created_at", { ascending: false })
        .order("position", { ascending: true });

      if (error) throw error;

      const projectsWithAssignees = await Promise.all(
        (data || []).map(async (project) => {
          const { data: assignees } = await supabase
            .from("project_assignees")
            .select(
              `
              employee_id,
              profiles:employee_id (
                id,
                full_name,
                user_photo
              )
            `
            )
            .eq("project_id", project.id);

          return {
            ...project,
            assignees: assignees?.map((a) => a.profiles) || [],
          };
        })
      );

      setProjects(projectsWithAssignees);
    } catch (error) {
      message.error("Failed to fetch projects");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const fetchProjectManagers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_photo")
        .eq("role", "project_manager")
        .order("full_name");

      if (error) throw error;
      setProjectManagers(data || []);
    } catch (error) {
      console.error("Error fetching project managers:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, user_photo")
        .eq("role", "employee")
        .order("full_name");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (searchText) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchText.toLowerCase()) ||
          p.client_name?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter.length > 0) {
      filtered = filtered.filter((p) => statusFilter.includes(p.status));
    }

    setFilteredProjects(filtered);
  };

  const debouncedUpdate = useCallback(
    debounce(async (projectId, field, value) => {
      try {
        const { error } = await supabase
          .from("projects")
          .update({ [field]: value })
          .eq("id", projectId);

        if (error) throw error;
      } catch (error) {
        message.error("Failed to update project");
        console.error("Error:", error);
      }
    }, 800),
    []
  );

  const handleInlineEdit = (projectId, field, value) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, [field]: value } : p))
    );
    debouncedUpdate(projectId, field, value);
  };

  const handleAssigneeChange = async (projectId, employeeIds) => {
    try {
      const { error: deleteError } = await supabase
        .from("project_assignees")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) throw deleteError;

      if (employeeIds && employeeIds.length > 0) {
        const assignments = employeeIds.map((empId) => ({
          project_id: projectId,
          employee_id: empId,
        }));

        const { error: insertError } = await supabase
          .from("project_assignees")
          .insert(assignments);

        if (insertError) throw insertError;
      }

      const assignedEmployees = employees.filter((emp) =>
        employeeIds.includes(emp.id)
      );
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, assignees: assignedEmployees } : p
        )
      );

      message.success("Assignees updated successfully");
    } catch (error) {
      message.error("Failed to update assignees");
      console.error("Error:", error);
    }
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setDrawerVisible(true);
  };

  const handleUnarchiveProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_archived: false })
        .eq("id", projectId);

      if (error) throw error;

      message.success("Project restored successfully");
      setDrawerVisible(false);
      fetchProjects();
    } catch (error) {
      message.error("Failed to restore project");
      console.error("Error:", error);
    }
  };

  const handleArchiveProject = async (projectId) => {
    Modal.confirm({
      title: "Archive Project",
      content:
        "Are you sure you want to archive this project? It will be hidden from the main view but can be restored later.",
      okText: "Archive",
      onOk: async () => {
        try {
          const { error } = await supabase
            .from("projects")
            .update({ is_archived: true })
            .eq("id", projectId);

          if (error) throw error;

          message.success("Project archived successfully");
          setDrawerVisible(false);
          fetchProjects();
        } catch (error) {
          message.error("Failed to archive project");
          console.error("Error:", error);
        }
      },
    });
  };

  const handleDeleteProject = async (projectId) => {
    Modal.confirm({
      title: "Delete Project",
      content:
        "Are you sure you want to permanently delete this project? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const { error } = await supabase
            .from("projects")
            .delete()
            .eq("id", projectId);

          if (error) throw error;

          message.success("Project deleted successfully");
          setDrawerVisible(false);
          fetchProjects();
        } catch (error) {
          message.error("Failed to delete project");
          console.error("Error:", error);
        }
      },
    });
  };

  const handleRowClick = (project) => {
    setEditingProject(project);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setEditingProject(null);
    fetchProjects();
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/html"));

    if (dragIndex === dropIndex) return;

    const newProjects = [...filteredProjects];
    const draggedProject = newProjects[dragIndex];
    newProjects.splice(dragIndex, 1);
    newProjects.splice(dropIndex, 0, draggedProject);

    setFilteredProjects(newProjects);
    setProjects(newProjects);

    try {
      const updates = newProjects.map((project, index) => ({
        id: project.id,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from("projects")
          .update({ position: update.position })
          .eq("id", update.id);
      }

      message.success("Project order updated");
    } catch (error) {
      console.error("Error updating positions:", error);
      message.error("Failed to update order");
      fetchProjects();
    }
  };

  const KanbanView = () => {
    const statusColumns = [
      { key: "not_started", label: "Not started", color: "#6b7280" },
      { key: "revision", label: "Revision", color: "#3b82f6" },
      { key: "testing", label: "Testing", color: "#06b6d4" },
      { key: "in_progress", label: "In progress", color: "#3b82f6" },
      { key: "completed", label: "Completed", color: "#10b981" },
    ];

    const handleDragStart = (e, project) => {
      e.dataTransfer.setData("projectId", project.id);
      e.dataTransfer.setData("currentStatus", project.status);
      e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e, newStatus) => {
      e.preventDefault();
      const projectId = e.dataTransfer.getData("projectId");
      const currentStatus = e.dataTransfer.getData("currentStatus");

      if (currentStatus === newStatus) return;

      try {
        const { error } = await supabase
          .from("projects")
          .update({ status: newStatus })
          .eq("id", projectId);

        if (error) throw error;

        message.success("Project status updated");
        fetchProjects();
      } catch (error) {
        message.error("Failed to update project status");
        console.error("Error:", error);
      }
    };

    return (
      <div
        className={`flex gap-4 p-6 h-full overflow-x-auto ${
          isDark ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        {statusColumns.map((column) => {
          const columnProjects = filteredProjects.filter(
            (p) => p.status === column.key
          );
          return (
            <div
              key={column.key}
              className="flex-shrink-0"
              style={{ width: 340 }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.key)}
            >
              <div className="mb-4 flex items-center gap-2">
                <Badge
                  count={columnProjects.length}
                  style={{ backgroundColor: column.color }}
                >
                  <div
                    className={`text-sm font-semibold pr-2 ${
                      isDark ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {column.label}
                  </div>
                </Badge>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {columnProjects.map((project) => (
                  <div
                    key={project.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, project)}
                    className={`rounded-lg p-4 cursor-move hover:shadow-md transition-all border ${
                      isDark
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                    onClick={() => handleRowClick(project)}
                  >
                    <div className="flex items-start gap-2 mb-3">
                      {project.country_flag &&
                        (() => {
                          const isFlag =
                            project.country_flag.startsWith("FLAG:");
                          if (isFlag) {
                            const flagCode = project.country_flag.replace(
                              "FLAG:",
                              ""
                            );
                            const FlagComponent = flags[flagCode];
                            return FlagComponent ? (
                              <FlagComponent
                                style={{ width: 24, height: 18 }}
                              />
                            ) : null;
                          }
                          return (
                            <span style={{ fontSize: "18px" }}>
                              {project.country_flag}
                            </span>
                          );
                        })()}
                      <h3
                        className={`font-medium flex-1 ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {project.name}
                      </h3>
                    </div>
                    {project.project_manager && (
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar
                          src={project.project_manager.user_photo}
                          icon={<UserOutlined />}
                          size={20}
                          shape="circle"
                          style={{ flexShrink: 0 }}
                        />
                        <span
                          className={`text-sm ${
                            isDark ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {project.project_manager.full_name}
                        </span>
                      </div>
                    )}
                    {project.assignees && project.assignees.length > 0 && (
                      <div className="flex items-center gap-1 mt-3">
                        <CommentOutlined
                          className={isDark ? "text-gray-500" : "text-gray-400"}
                          style={{ fontSize: 12 }}
                        />
                        <span
                          className={`text-xs ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {project.assignees.length}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  className={`w-full text-left text-sm py-2 px-2 rounded transition-colors ${
                    isDark
                      ? "text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                      : "text-blue-600 hover:text-blue-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleAddProject()}
                >
                  + New project
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const GanttView = () => {
    const today = dayjs();
    const [currentMonth, setCurrentMonth] = useState(today);

    const daysInMonth = currentMonth.daysInMonth();
    const monthStart = currentMonth.startOf("month");
    const days = Array.from({ length: daysInMonth }, (_, i) =>
      monthStart.add(i, "day")
    );

    const statusGroups = [
      {
        key: "not_started",
        label: "Not started",
        projects: filteredProjects.filter((p) => p.status === "not_started"),
      },
      {
        key: "revision",
        label: "Revision",
        projects: filteredProjects.filter((p) => p.status === "revision"),
      },
      {
        key: "testing",
        label: "Testing",
        projects: filteredProjects.filter((p) => p.status === "testing"),
      },
      {
        key: "in_progress",
        label: "In progress",
        projects: filteredProjects.filter((p) => p.status === "in_progress"),
      },
      {
        key: "planning",
        label: "Planning",
        projects: filteredProjects.filter((p) => p.status === "planning"),
      },
      {
        key: "completed",
        label: "Completed",
        projects: filteredProjects.filter((p) => p.status === "completed"),
      },
      {
        key: "on_hold",
        label: "On Hold",
        projects: filteredProjects.filter((p) => p.status === "on_hold"),
      },
    ];

    const getProjectPosition = (project) => {
      if (!project.start_date || !project.end_date) return null;

      const start = dayjs(project.start_date);
      const end = dayjs(project.end_date);
      const monthStart = currentMonth.startOf("month");
      const monthEnd = currentMonth.endOf("month");

      if (end.isBefore(monthStart) || start.isAfter(monthEnd)) return null;

      const startDay = start.isBefore(monthStart) ? 0 : start.date() - 1;
      const endDay = end.isAfter(monthEnd) ? daysInMonth - 1 : end.date() - 1;

      return { startDay, endDay };
    };

    return (
      <div className={`flex h-full ${isDark ? "bg-gray-900" : "bg-white"}`}>
        <div
          className={`w-80 border-r overflow-y-auto ${
            isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"
          }`}
        >
          <div
            className={`p-4 border-b sticky top-0 z-10 ${
              isDark
                ? "border-gray-700 bg-gray-900"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <Button
                size="small"
                onClick={() =>
                  setCurrentMonth(currentMonth.subtract(1, "month"))
                }
              >
                ←
              </Button>
              <h3
                className={`font-semibold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {currentMonth.format("MMMM YYYY")}
              </h3>
              <Button
                size="small"
                onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
              >
                →
              </Button>
            </div>
            <div
              className={`flex items-center gap-2 text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <span>Aa</span>
              <span>Project name</span>
            </div>
          </div>

          {statusGroups.map((group) => (
            <div
              key={group.key}
              className={`border-b ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div
                className={`px-4 py-3 flex items-center gap-2 ${
                  isDark ? "bg-gray-800" : "bg-gray-50"
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span
                  className={`font-medium ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {group.label}
                </span>
                <span
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {group.projects.length}
                </span>
              </div>
              {group.projects.map((project) => (
                <div
                  key={project.id}
                  className={`px-4 py-3 cursor-pointer border-b flex items-center gap-2 ${
                    isDark
                      ? "hover:bg-gray-800 border-gray-700"
                      : "hover:bg-gray-50 border-gray-100"
                  }`}
                  onClick={() => handleRowClick(project)}
                >
                  {project.country_flag &&
                    (() => {
                      const isFlag = project.country_flag.startsWith("FLAG:");
                      if (isFlag) {
                        const flagCode = project.country_flag.replace(
                          "FLAG:",
                          ""
                        );
                        const FlagComponent = flags[flagCode];
                        return FlagComponent ? (
                          <FlagComponent style={{ width: 20, height: 15 }} />
                        ) : null;
                      }
                      return (
                        <span style={{ fontSize: "16px" }}>
                          {project.country_flag}
                        </span>
                      );
                    })()}
                  <span
                    className={`text-sm ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {project.name}
                  </span>
                </div>
              ))}
              <button
                className={`w-full text-left px-4 py-2 text-sm ${
                  isDark
                    ? "text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
                onClick={() => handleAddProject()}
              >
                + New
              </button>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto">
          <div
            className={`border-b sticky top-0 z-10 ${
              isDark
                ? "border-gray-700 bg-gray-900"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 text-center py-3 border-r text-xs ${
                    isDark
                      ? "border-gray-700 text-gray-400"
                      : "border-gray-200 text-gray-600"
                  }`}
                  style={{ width: 40 }}
                >
                  <div>{day.format("DD")}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {statusGroups.map((group) => (
              <div key={group.key}>
                <div
                  className={`h-12 border-b ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-gray-50 border-gray-200"
                  }`}
                ></div>
                {group.projects.map((project) => {
                  const position = getProjectPosition(project);
                  return (
                    <div
                      key={project.id}
                      className={`relative h-12 border-b ${
                        isDark ? "border-gray-700" : "border-gray-100"
                      }`}
                    >
                      <div className="absolute inset-0 flex">
                        {days.map((_, i) => (
                          <div
                            key={i}
                            className={`flex-shrink-0 border-r ${
                              isDark ? "border-gray-700" : "border-gray-200"
                            }`}
                            style={{ width: 40 }}
                          ></div>
                        ))}
                      </div>
                      {position && (
                        <div
                          className="absolute h-8 top-2 bg-blue-600 rounded flex items-center px-2 cursor-pointer hover:bg-blue-500"
                          style={{
                            left: position.startDay * 40,
                            width:
                              (position.endDay - position.startDay + 1) * 40,
                          }}
                          onClick={() => handleRowClick(project)}
                        >
                          <span className="text-white text-xs truncate">
                            {project.name}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div
                  className={`h-10 border-b ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ThemeContext.Provider value={{ isDark }}>
      <div className={`h-full ${isDark ? "bg-gray-900" : "bg-white"}`}>
        <div
          className={`border-b px-6 py-4 ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FolderOutlined
                className={`text-2xl ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              />
              <h1
                className={`text-2xl font-semibold m-0 ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Projects
              </h1>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                icon={<InboxOutlined />}
                onClick={() => setShowArchived(!showArchived)}
                size="large"
                style={{
                  borderRadius: "6px",
                  height: "38px",
                  fontWeight: 500,
                }}
              >
                {showArchived ? "Show Active" : "Show Archived"}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddProject}
                size="large"
                style={{
                  backgroundColor: "#2563eb",
                  borderRadius: "6px",
                  height: "38px",
                  fontWeight: 500,
                }}
              >
                New
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                size="large"
                options={[
                  {
                    label: (
                      <div className="flex items-center gap-2 px-2">
                        <AppstoreOutlined />
                        <span>By Status</span>
                      </div>
                    ),
                    value: "status",
                  },
                  {
                    label: (
                      <div className="flex items-center gap-2 px-2">
                        <TableOutlined />
                        <span>All Projects</span>
                      </div>
                    ),
                    value: "all",
                  },
                  {
                    label: (
                      <div className="flex items-center gap-2 px-2">
                        <BarChartOutlined />
                        <span>Gantt</span>
                      </div>
                    ),
                    value: "gantt",
                  },
                ]}
              />
            </div>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search projects..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: 300,
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                }}
                size="large"
              />
              <Select
                mode="multiple"
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter by status"
                style={{ width: 250, borderRadius: "6px" }}
                size="large"
                maxTagCount="responsive"
                options={[
                  { label: "Not Started", value: "not_started" },
                  { label: "Planning", value: "planning" },
                  { label: "In Progress", value: "in_progress" },
                  { label: "Testing", value: "testing" },
                  { label: "Revision", value: "revision" },
                  { label: "Completed", value: "completed" },
                  { label: "On Hold", value: "on_hold" },
                ]}
              />
              <span
                className={isDark ? "text-gray-400 ml-2" : "text-gray-500 ml-2"}
              >
                {filteredProjects.length} projects
              </span>
            </div>
          </div>
        </div>

        {viewMode === "status" && <KanbanView />}
        {viewMode === "gantt" && <GanttView />}
        {viewMode === "all" && (
          <div
            className="overflow-auto"
            style={{ height: "calc(100vh - 250px)" }}
          >
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton.Avatar active size={40} />
                    <Skeleton
                      active
                      paragraph={{ rows: 1 }}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center h-64 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                <FolderOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>No projects found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead
                  className={`sticky top-0 z-10 ${
                    isDark ? "bg-gray-800" : "bg-gray-50"
                  }`}
                >
                  <tr
                    className={`border-b ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <th
                      className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                      style={{ width: "22%" }}
                    >
                      Project name
                    </th>
                    <th
                      className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                      style={{ width: "11%" }}
                    >
                      Project Manager
                    </th>
                    <th
                      className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                      style={{ width: "11%" }}
                    >
                      Assignees
                    </th>
                    <th
                      className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                      style={{ width: "10%" }}
                    >
                      Status
                    </th>
                    <th
                      className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                      style={{ width: "10%" }}
                    >
                      Client
                    </th>
                    <th
                      className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                      style={{ width: "18%" }}
                    >
                      Remarks
                    </th>
                    <th
                      className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                      style={{ width: "9%" }}
                    >
                      Start date
                    </th>
                    <th
                      className={`text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                      style={{ width: "9%" }}
                    >
                      End date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project, index) => (
                    <tr
                      key={project.id}
                      className={`border-b cursor-move transition-colors group ${
                        isDark
                          ? "border-gray-700 hover:bg-gray-800"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                      onClick={() => handleRowClick(project)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <td className="px-6 py-4">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconPicker
                            value={project.country_flag}
                            onChange={(icon) =>
                              handleInlineEdit(project.id, "country_flag", icon)
                            }
                            onRemove={() =>
                              handleInlineEdit(project.id, "country_flag", null)
                            }
                          />
                          <Input
                            value={project.name}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleInlineEdit(
                                project.id,
                                "name",
                                e.target.value
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            bordered={false}
                            className={`font-medium px-2 -mx-2 ${
                              isDark
                                ? "text-gray-100 hover:bg-gray-700"
                                : "text-gray-900 hover:bg-gray-100"
                            }`}
                            style={{ cursor: "text" }}
                          />
                        </div>
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={project.project_manager_id}
                          onChange={(value) =>
                            handleInlineEdit(
                              project.id,
                              "project_manager_id",
                              value
                            )
                          }
                          bordered={false}
                          className={`w-full ${
                            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                          }`}
                          style={{ marginLeft: -11 }}
                          suffixIcon={null}
                          options={[
                            { label: "Unassigned", value: null },
                            ...projectManagers.map((pm) => ({
                              label: (
                                <div className="flex items-center gap-2">
                                  <Avatar
                                    src={pm.user_photo}
                                    icon={<UserOutlined />}
                                    size={20}
                                    shape="circle"
                                    style={{ flexShrink: 0 }}
                                  />
                                  <span>{pm.full_name}</span>
                                </div>
                              ),
                              value: pm.id,
                            })),
                          ]}
                        ></Select>
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          mode="multiple"
                          value={project.assignees?.map((a) => a.id) || []}
                          onChange={(value) =>
                            handleAssigneeChange(project.id, value)
                          }
                          bordered={false}
                          className={`w-full ${
                            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                          }`}
                          style={{ marginLeft: -11 }}
                          suffixIcon={null}
                          placeholder="Assign employees"
                          maxTagCount={2}
                          options={employees.map((emp) => ({
                            label: (
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={emp.user_photo}
                                  icon={<UserOutlined />}
                                  size={20}
                                  shape="circle"
                                  style={{ flexShrink: 0 }}
                                />
                                <span>{emp.full_name}</span>
                              </div>
                            ),
                            value: emp.id,
                          }))}
                        />
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Select
                          value={project.status}
                          onChange={(value) =>
                            handleInlineEdit(project.id, "status", value)
                          }
                          bordered={false}
                          style={{ width: "100%", marginLeft: -11 }}
                          className={
                            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                          }
                          suffixIcon={null}
                        >
                          <Select.Option value="not_started">
                            <Tag color="default">Not Started</Tag>
                          </Select.Option>
                          <Select.Option value="planning">
                            <Tag color="purple">Planning</Tag>
                          </Select.Option>
                          <Select.Option value="in_progress">
                            <Tag color="blue">In Progress</Tag>
                          </Select.Option>
                          <Select.Option value="testing">
                            <Tag color="cyan">Testing</Tag>
                          </Select.Option>
                          <Select.Option value="revision">
                            <Tag color="orange">Revision</Tag>
                          </Select.Option>
                          <Select.Option value="completed">
                            <Tag color="green">Completed</Tag>
                          </Select.Option>
                          <Select.Option value="on_hold">
                            <Tag color="red">On Hold</Tag>
                          </Select.Option>
                        </Select>
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          value={project.client_name || ""}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleInlineEdit(
                              project.id,
                              "client_name",
                              e.target.value
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Add client..."
                          bordered={false}
                          className={`text-sm px-2 -mx-2 ${
                            isDark
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          style={{ cursor: "text" }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <TextArea
                          value={project.remarks || ""}
                          onChange={(e) => {
                            e.stopPropagation();
                            const newValue = e.target.value;
                            setProjects((prev) =>
                              prev.map((p) =>
                                p.id === project.id
                                  ? { ...p, remarks: newValue }
                                  : p
                              )
                            );
                            debouncedUpdate(project.id, "remarks", newValue);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Add remarks..."
                          bordered={false}
                          autoSize={{ minRows: 1, maxRows: 3 }}
                          className={`text-sm px-2 -mx-2 ${
                            isDark
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          style={{ cursor: "text" }}
                        />
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DatePicker
                          value={
                            project.start_date
                              ? dayjs(project.start_date)
                              : null
                          }
                          onChange={(date) =>
                            handleInlineEdit(
                              project.id,
                              "start_date",
                              date ? date.format("YYYY-MM-DD") : null
                            )
                          }
                          bordered={false}
                          className={`w-full ${
                            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                          }`}
                          style={{ marginLeft: -11 }}
                          suffixIcon={null}
                          format="MM/DD/YYYY"
                          placeholder="Select date"
                        />
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DatePicker
                          value={
                            project.end_date ? dayjs(project.end_date) : null
                          }
                          onChange={(date) =>
                            handleInlineEdit(
                              project.id,
                              "end_date",
                              date ? date.format("YYYY-MM-DD") : null
                            )
                          }
                          bordered={false}
                          className={`w-full ${
                            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
                          }`}
                          style={{ marginLeft: -11 }}
                          suffixIcon={null}
                          format="MM/DD/YYYY"
                          placeholder="Select date"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <Drawer
          title={
            <div className="flex items-center justify-between">
              <span
                className={`text-xl font-semibold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {editingProject ? "Project Details" : "New Project"}
              </span>
              {editingProject && (
                <div className="flex gap-2">
                  {showArchived ? (
                    <Button
                      icon={<InboxOutlined />}
                      onClick={() => handleUnarchiveProject(editingProject.id)}
                      size="small"
                      type="primary"
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      icon={<InboxOutlined />}
                      onClick={() => handleArchiveProject(editingProject.id)}
                      size="small"
                    >
                      Archive
                    </Button>
                  )}
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDeleteProject(editingProject.id)}
                    size="small"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          }
          placement="right"
          onClose={handleDrawerClose}
          open={drawerVisible}
          width={600}
          closeIcon={<CloseOutlined />}
        >
          <ProjectForm
            project={editingProject}
            teams={teams}
            projectManagers={projectManagers}
            employees={employees}
            onClose={handleDrawerClose}
          />
        </Drawer>
      </div>
    </ThemeContext.Provider>
  );
};

const ProjectForm = ({
  project,
  teams,
  projectManagers,
  employees,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    name: project?.name || "",
    project_type: project?.project_type || "single",
    status: project?.status || "planning",
    team_id: project?.team_id || null,
    project_manager_id: project?.project_manager_id || null,
    client_name: project?.client_name || "",
    client_email: project?.client_email || "",
    client_phone: project?.client_phone || "",
    client_country: project?.client_country || "",
    country_flag: project?.country_flag || null,
    github_repo: project?.github_repo || "",
    figma_link: project?.figma_link || "",
    start_date: project?.start_date || null,
    end_date: project?.end_date || null,
  });
  const [assignees, setAssignees] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setAssignees(project.assignees?.map((a) => a.id) || []);
    }
  }, [project]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      message.error("Project name is required");
      return;
    }

    setSaving(true);
    try {
      let projectId = project?.id;

      if (project) {
        const { error } = await supabase
          .from("projects")
          .update(formData)
          .eq("id", project.id);

        if (error) throw error;
      } else {
        const { data: newProject, error } = await supabase
          .from("projects")
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        projectId = newProject.id;
      }

      if (project) {
        await supabase
          .from("project_assignees")
          .delete()
          .eq("project_id", projectId);
      }

      if (assignees.length > 0) {
        const assigneeRecords = assignees.map((employeeId) => ({
          project_id: projectId,
          employee_id: employeeId,
        }));

        const { error: assignError } = await supabase
          .from("project_assignees")
          .insert(assigneeRecords);

        if (assignError) throw assignError;
      }

      message.success(
        project
          ? "Project updated successfully"
          : "Project created successfully"
      );
      onClose();
    } catch (error) {
      message.error("Failed to save project");
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Project Name *
        </label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Enter project name"
          size="large"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Project Type
          </label>
          <Select
            value={formData.project_type}
            onChange={(value) => handleChange("project_type", value)}
            className="w-full"
            size="large"
          >
            <Select.Option value="single">Single</Select.Option>
            <Select.Option value="milestone">Milestone</Select.Option>
          </Select>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Status
          </label>
          <Select
            value={formData.status}
            onChange={(value) => handleChange("status", value)}
            className="w-full"
            size="large"
          >
            <Select.Option value="not_started">Not Started</Select.Option>
            <Select.Option value="planning">Planning</Select.Option>
            <Select.Option value="in_progress">In Progress</Select.Option>
            <Select.Option value="testing">Testing</Select.Option>
            <Select.Option value="revision">Revision</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
            <Select.Option value="on_hold">On Hold</Select.Option>
          </Select>
        </div>
      </div>

      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Project Manager
        </label>
        <Select
          value={formData.project_manager_id}
          onChange={(value) => handleChange("project_manager_id", value)}
          className="w-full"
          size="large"
          placeholder="Select project manager"
        >
          {projectManagers.map((pm) => (
            <Select.Option key={pm.id} value={pm.id}>
              <div className="flex items-center gap-2">
                <Avatar
                  src={pm.user_photo}
                  icon={<UserOutlined />}
                  size={24}
                  shape="circle"
                  style={{ flexShrink: 0 }}
                />
                <span>{pm.full_name}</span>
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>

      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Assignees (Employees)
        </label>
        <Select
          mode="multiple"
          value={assignees}
          onChange={setAssignees}
          className="w-full"
          size="large"
          placeholder="Select employees to assign"
          maxTagCount="responsive"
        >
          {employees.map((emp) => (
            <Select.Option key={emp.id} value={emp.id}>
              <div className="flex items-center gap-2">
                <Avatar
                  src={emp.user_photo}
                  icon={<UserOutlined />}
                  size={24}
                  shape="circle"
                  style={{ flexShrink: 0 }}
                />
                <span>{emp.full_name}</span>
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>

      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Team
        </label>
        <Select
          value={formData.team_id}
          onChange={(value) => handleChange("team_id", value)}
          className="w-full"
          size="large"
          placeholder="Select team"
        >
          {teams.map((team) => (
            <Select.Option key={team.id} value={team.id}>
              {team.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      <div
        className={`border-t pt-6 ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${
            isDark ? "text-gray-100" : "text-gray-900"
          }`}
        >
          Client Information
        </h3>

        <div className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Client Name
            </label>
            <Input
              value={formData.client_name}
              onChange={(e) => handleChange("client_name", e.target.value)}
              placeholder="Enter client name"
              size="large"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Client Email
            </label>
            <Input
              value={formData.client_email}
              onChange={(e) => handleChange("client_email", e.target.value)}
              placeholder="client@example.com"
              size="large"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Phone
              </label>
              <Input
                value={formData.client_phone}
                onChange={(e) => handleChange("client_phone", e.target.value)}
                placeholder="+1 234 567 8900"
                size="large"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Country
              </label>
              <CountrySelect
                value={formData.client_country}
                onChange={(value) => handleChange("client_country", value)}
                placeholder="Select country"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`border-t pt-6 ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${
            isDark ? "text-gray-100" : "text-gray-900"
          }`}
        >
          Project Details
        </h3>

        <div className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Figma Link
            </label>
            <Input
              value={formData.figma_link}
              onChange={(e) => handleChange("figma_link", e.target.value)}
              placeholder="https://figma.com/..."
              size="large"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              GitHub Repository
            </label>
            <Input
              value={formData.github_repo}
              onChange={(e) => handleChange("github_repo", e.target.value)}
              placeholder="https://github.com/..."
              size="large"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Start Date
              </label>
              <DatePicker
                value={formData.start_date ? dayjs(formData.start_date) : null}
                onChange={(date) =>
                  handleChange(
                    "start_date",
                    date ? date.format("YYYY-MM-DD") : null
                  )
                }
                className="w-full"
                size="large"
                format="MM/DD/YYYY"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                End Date
              </label>
              <DatePicker
                value={formData.end_date ? dayjs(formData.end_date) : null}
                onChange={(date) =>
                  handleChange(
                    "end_date",
                    date ? date.format("YYYY-MM-DD") : null
                  )
                }
                className="w-full"
                size="large"
                format="MM/DD/YYYY"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`flex justify-end gap-3 pt-6 border-t ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <Button onClick={onClose} size="large">
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleSave}
          loading={saving}
          size="large"
          style={{ backgroundColor: "#2563eb" }}
        >
          {project ? "Update" : "Create"} Project
        </Button>
      </div>
    </div>
  );
};

export default Projects;
