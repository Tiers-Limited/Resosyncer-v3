import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Checkbox, Empty, Input, Table, Tag } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { useProviderIntegration } from "../providers/useProviderIntegration";

const providerMeta = {
  asana: { title: "Asana", accent: "#f06a6a", subtitle: "Workspaces & projects" },
  trello: { title: "Trello", accent: "#0079bf", subtitle: "Boards & cards" },
  clickup: { title: "ClickUp", accent: "#7b68ee", subtitle: "Spaces, lists & tasks" },
  bamboohr: {
    title: "BambooHR",
    accent: "#2f855a",
    subtitle: "Employees & directory sync",
  },
};

const sectionCard = (dark) => ({
  border: `1px solid ${dark ? "#2b2f38" : "#e2e8f0"}`,
  background: dark ? "#17181c" : "#ffffff",
  borderRadius: 12,
});

const ProviderCard = ({
  dark,
  provider,
  selected,
  connected,
  loadingProjects,
  loadingImport,
  companyDomain,
  selectedEmployeeIds,
  onSelect,
  onConnect,
  onLoadProjects,
  onImportProjects,
  onImportSelectedEmployees,
  onDisconnect,
  onCompanyDomainChange,
}) => {
  const meta = providerMeta[provider];
  const isBamboo = provider === "bamboohr";
  const selectedCount = Array.isArray(selectedEmployeeIds)
    ? selectedEmployeeIds.length
    : 0;
  return (
    <div
      style={{
        ...sectionCard(dark),
        padding: 14,
        boxShadow: selected ? `0 0 0 2px ${meta.accent}33` : "none",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-slate-800">{meta.title}</div>
          <div className="text-xs text-slate-400 mt-0.5">{meta.subtitle}</div>
        </div>
        <Tag color={connected ? "green" : "default"}>
          {connected ? "Connected" : "Not Connected"}
        </Tag>
      </div>

      {isBamboo ? (
        <div className="mt-3">
          <div className="text-[11px] text-slate-500 mb-1">BambooHR subdomain</div>
          <Input
            size="small"
            value={companyDomain}
            placeholder="e.g. acme"
            addonAfter=".bamboohr.com"
            onChange={(e) => onCompanyDomainChange?.(e.target.value)}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mt-3">
        <Button
          size="small"
          onClick={() => onSelect(provider)}
          type={selected ? "primary" : "default"}
        >
          {selected ? "Selected" : "Select"}
        </Button>
        <Button size="small" onClick={() => onConnect(provider)}>
          Connect
        </Button>
        <Button
          size="small"
          loading={loadingProjects}
          onClick={() => onLoadProjects(provider)}
        >
          {isBamboo ? "Load Employees" : "Load Projects"}
        </Button>
        {isBamboo ? (
          <>
            <Button
              size="small"
              loading={loadingImport}
              disabled={!selectedCount}
              onClick={() => onImportSelectedEmployees(provider)}
            >
              Import Selected
            </Button>
            <Button
              size="small"
              loading={loadingImport}
              onClick={() => onImportProjects(provider)}
            >
              Import All
            </Button>
            <Button
              size="small"
              danger={connected}
              onClick={() => onDisconnect(provider)}
            >
              {connected ? "Disconnect" : "Clear"}
            </Button>
          </>
        ) : (
          <Button
            size="small"
            loading={loadingImport}
            onClick={() => onImportProjects(provider)}
          >
            Import Projects
          </Button>
        )}
      </div>
      {isBamboo && selected ? (
        <div className="text-[11px] text-slate-500 mt-2">
          {selectedCount} employee(s) selected
        </div>
      ) : null}
    </div>
  );
};

const TicketRow = ({ ticket }) => (
  <div
    className="rounded-lg px-3 py-2 text-xs"
    style={{ border: "1px solid #e2e8f0", background: "#f8fafc" }}
  >
    <div className="font-semibold text-slate-700">{ticket.name}</div>
    <div className="text-slate-500 mt-0.5">
      {ticket.status || "open"}
      {ticket.assigneeName ? ` • ${ticket.assigneeName}` : ""}
      {ticket.sectionName ? ` • ${ticket.sectionName}` : ""}
      {ticket.dueAt ? ` • Due ${ticket.dueAt}` : ""}
      {ticket.url ? (
        <>
          {" "}
          •{" "}
          <a href={ticket.url} target="_blank" rel="noreferrer" className="text-blue-600">
            Open <LinkOutlined />
          </a>
        </>
      ) : null}
    </div>
  </div>
);

const ProjectRow = ({ project, dark }) => (
  <details
    style={{
      ...sectionCard(dark),
      padding: 10,
    }}
  >
    <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800 truncate">{project.name}</div>
        <div className="text-xs text-slate-500 mt-0.5">
          {project.workspaceName || "No workspace"} • {project.ticketsCount || 0} ticket(s)
          {Number.isFinite(Number(project.sectionsCount))
            ? ` • ${project.sectionsCount} section(s)`
            : ""}
          {project.url ? (
            <>
              {" "}
              •{" "}
              <a href={project.url} target="_blank" rel="noreferrer" className="text-blue-600">
                Open <LinkOutlined />
              </a>
            </>
          ) : null}
        </div>
      </div>
    </summary>
    <div className="mt-3 grid gap-2">
      {Array.isArray(project.tickets) && project.tickets.length > 0 ? (
        project.tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)
      ) : (
        <div className="text-xs text-slate-500">No tickets.</div>
      )}
    </div>
  </details>
);

const employeeColumns = [
  {
    title: "Name",
    dataIndex: "fullName",
    key: "fullName",
    render: (_, row) =>
      row.fullName ||
      [row.firstName, row.lastName].filter(Boolean).join(" ") ||
      "Unknown",
  },
  {
    title: "Work Email",
    dataIndex: "workEmail",
    key: "workEmail",
    render: (value) => value || "-",
  },
  {
    title: "Department",
    dataIndex: "department",
    key: "department",
    render: (value) => value || "-",
  },
  {
    title: "Job Title",
    dataIndex: "jobTitle",
    key: "jobTitle",
    render: (value) => value || "-",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (value) => value || "-",
  },
];

const EmployeeGrid = ({
  employees,
  selectedEmployeeIds,
  onToggleEmployee,
  onToggleAll,
}) => {
  const selectedSet = useMemo(
    () => new Set(selectedEmployeeIds || []),
    [selectedEmployeeIds],
  );
  const allSelected =
    employees.length > 0 &&
    employees.every((employee) => selectedSet.has(String(employee.id)));
  const hasSome =
    employees.some((employee) => selectedSet.has(String(employee.id))) &&
    !allSelected;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Checkbox
          checked={allSelected}
          indeterminate={hasSome}
          onChange={(e) => onToggleAll?.(e.target.checked)}
        >
          Select all
        </Checkbox>
        <div className="text-xs text-slate-500">
          {selectedEmployeeIds.length} selected / {employees.length}
        </div>
      </div>
      <Table
        rowKey={(row) => String(row.id)}
        size="small"
        pagination={{ pageSize: 10, showSizeChanger: false }}
        columns={[
          {
            title: "",
            key: "select",
            width: 40,
            render: (_, row) => (
              <Checkbox
                checked={selectedSet.has(String(row.id))}
                onChange={(e) =>
                  onToggleEmployee?.(String(row.id), e.target.checked)
                }
              />
            ),
          },
          ...employeeColumns,
        ]}
        dataSource={employees}
        scroll={{ x: 760 }}
      />
    </div>
  );
};

export default function IntegrationsPanel({
  dark = false,
  providers = ["asana", "trello", "clickup", "bamboohr"],
  title = "Integrations",
  subtitle = "Connect providers to sync projects and employees into your workspace.",
}) {
  const {
    selectedProvider,
    providerState,
    selectedData,
    selectProvider,
    connect,
    loadProjects,
    importProjects,
    disconnect,
    setBambooHrCompanyDomain,
  } = useProviderIntegration();

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const effectiveSelectedProvider = providers.includes(selectedProvider)
    ? selectedProvider
    : providers[0];
  const effectiveSelectedData =
    providerState[effectiveSelectedProvider] || selectedData;

  useEffect(() => {
    if (!providers.includes(selectedProvider) && providers[0]) {
      selectProvider(providers[0]);
    }
  }, [providers, selectedProvider, selectProvider]);

  const effectiveResponse =
    effectiveSelectedData.importResponse || effectiveSelectedData.projectsResponse;
  const projects = effectiveResponse?.projects || [];
  const totalProjects = effectiveResponse?.count || projects.length || 0;
  const totalTickets =
    effectiveResponse?.ticketsCount ||
    projects.reduce((n, p) => n + (p.ticketsCount || p.tickets?.length || 0), 0);

  const effectiveEmployeesResponse =
    effectiveSelectedData.importEmployeesResponse ||
    effectiveSelectedData.employeesResponse;
  const employees = effectiveEmployeesResponse?.employees || [];
  const totalEmployees = effectiveEmployeesResponse?.count || employees.length || 0;

  useEffect(() => {
    if (selectedProvider !== "bamboohr") return;
    const available = new Set(employees.map((employee) => String(employee.id)));
    setSelectedEmployeeIds((prev) =>
      prev.filter((id) => available.has(String(id))),
    );
  }, [selectedProvider, employees]);

  const handleConnect = (provider) => {
    if (provider === "bamboohr") {
      connect(provider, {
        companyDomain: providerState?.bamboohr?.companyDomain || "",
      });
      return;
    }
    connect(provider);
  };

  const handleImportSelectedEmployees = (provider) =>
    importProjects(provider, { employeeIds: selectedEmployeeIds });

  const handleToggleEmployee = (employeeId, checked) => {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev.map(String));
      if (checked) next.add(String(employeeId));
      else next.delete(String(employeeId));
      return [...next];
    });
  };

  const handleToggleAllEmployees = (checked) => {
    if (!checked) {
      setSelectedEmployeeIds([]);
      return;
    }
    setSelectedEmployeeIds(employees.map((employee) => String(employee.id)));
  };

  return (
    <div className="pt-2">
      <div className="mb-5">
        <h3 className="text-[13px] font-bold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {providers.map((provider) => (
          <ProviderCard
            key={provider}
            dark={dark}
            provider={provider}
            selected={selectedProvider === provider}
            connected={providerState[provider]?.connected}
            loadingProjects={providerState[provider]?.loadingProjects}
            loadingImport={providerState[provider]?.loadingImport}
            companyDomain={providerState?.bamboohr?.companyDomain || ""}
            selectedEmployeeIds={selectedEmployeeIds}
            onSelect={selectProvider}
            onConnect={handleConnect}
            onLoadProjects={loadProjects}
            onImportProjects={importProjects}
            onImportSelectedEmployees={handleImportSelectedEmployees}
            onDisconnect={disconnect}
            onCompanyDomainChange={setBambooHrCompanyDomain}
          />
        ))}
      </div>

      {effectiveSelectedData.error ? (
        <Alert
          type="error"
          showIcon
          className="mt-4"
          message={effectiveSelectedData.error}
          action={
            effectiveSelectedData.needsReconnect ? (
              <Button
                size="small"
                onClick={() => handleConnect(effectiveSelectedProvider)}
              >
                Reconnect
              </Button>
            ) : null
          }
        />
      ) : null}

      <div className="mt-5">
        {effectiveSelectedProvider === "bamboohr" ? (
          <>
            <div className="text-xs text-slate-500 mb-2">
              <strong>{providerMeta[effectiveSelectedProvider].title}</strong> • {totalEmployees} employee(s)
            </div>
            {employees.length === 0 ? (
              <div style={{ ...sectionCard(dark), padding: 18 }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No employees yet. Connect and load employees first."
                />
              </div>
            ) : (
              <EmployeeGrid
                employees={employees}
                selectedEmployeeIds={selectedEmployeeIds}
                onToggleEmployee={handleToggleEmployee}
                onToggleAll={handleToggleAllEmployees}
              />
            )}
          </>
        ) : (
          <>
            <div className="text-xs text-slate-500 mb-2">
              <strong>{providerMeta[effectiveSelectedProvider].title}</strong> • {totalProjects} project(s) •{" "}
              {totalTickets} ticket(s)
            </div>
            {projects.length === 0 ? (
              <div style={{ ...sectionCard(dark), padding: 18 }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No projects yet. Connect and load projects first."
                />
              </div>
            ) : (
              <div className="grid gap-2">
                {projects.map((project) => (
                  <ProjectRow key={project.id} project={project} dark={dark} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
