const normalizeApiBase = (value) => {
  const v = (value || "").trim().replace(/\/+$/, "");
  if (!v) return "/api";
  return v.endsWith("/api") ? v : `${v}/api`;
};

const envApiBase = normalizeApiBase(import.meta.env?.VITE_API_BASE_URL);
let apiBase = envApiBase;

if (typeof window !== "undefined" && import.meta.env?.DEV) {
  try {
    const u = new URL(envApiBase, window.location.origin);
    if (u.origin !== window.location.origin) apiBase = "/api";
  } catch {
    apiBase = "/api";
  }
}

export const CLICKUP_BACKEND_BASE = `${apiBase}/clickup`;

const toArray = (v) => (Array.isArray(v) ? v : []);

const normalizeTicket = (task) => ({
  id: String(task?.id || task?.gid || ""),
  title: String(task?.title || task?.name || "Untitled"),
  description: String(task?.description || task?.text_content || ""),
  status:
    task?.status?.status ||
    task?.status?.name ||
    task?.status ||
    (task?.archived ? "archived" : "open"),
  assignee_name:
    task?.assignee_name ||
    task?.assignee?.username ||
    task?.assignee?.name ||
    task?.assignees?.[0]?.username ||
    task?.assignees?.[0]?.name ||
    "",
  assignee_username:
    task?.assignee_username ||
    task?.assignee?.username ||
    task?.assignees?.[0]?.username ||
    "",
  assignee_email:
    task?.assignee_email ||
    task?.assignee?.email ||
    task?.assignees?.[0]?.email ||
    "",
  priority:
    task?.priority?.priority ||
    task?.priority?.name ||
    task?.priority ||
    "medium",
  ticket_type: task?.ticket_type || "task",
  due_date:
    task?.due_date ||
    task?.dueDate ||
    task?.due_at ||
    null,
  url: task?.url || task?.task_url || null,
  comments: toArray(task?.comments).map((c) => ({
    author: c?.author?.username || c?.author || "User",
    body: c?.body || c?.comment || c?.text || "",
    created: c?.date || c?.created_at || null,
  })),
  attachments: toArray(task?.attachments)
    .map((a) => ({
      name: a?.title || a?.name || "attachment",
      url: a?.url || a?.download_url || "",
    }))
    .filter((a) => a.url),
});

const normalizeProject = (project) => {
  const tasks = toArray(project?.tasks || project?.tickets).map(normalizeTicket);
  return {
    id: String(project?.id || project?.list_id || project?.gid || ""),
    name: String(project?.name || "Untitled"),
    workspaceName:
      project?.workspaceName ||
      project?.space?.name ||
      project?.folder?.name ||
      "",
    url: project?.url || project?.list_url || null,
    desc: project?.description || project?.desc || "",
    tickets: tasks,
    ticketsCount:
      Number.isFinite(Number(project?.ticketsCount))
        ? Number(project.ticketsCount)
        : Number.isFinite(Number(project?.tasksCount))
          ? Number(project.tasksCount)
          : tasks.length,
  };
};

export function getClickUpBackendAuthUrl(returnTo) {
  const authUrl = new URL(CLICKUP_BACKEND_BASE + "/auth", window.location.origin);
  if (returnTo) authUrl.searchParams.set("returnTo", returnTo);
  return authUrl.toString();
}

async function clickUpRequest(path, { method = "GET", query, body } = {}) {
  const url = new URL(`${CLICKUP_BACKEND_BASE}${path}`, window.location.origin);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `ClickUp request failed (${res.status})`,
    );
  }
  return payload?.data ?? payload;
}

export async function fetchClickUpProjects() {
  const data = await clickUpRequest("/projects");
  const projects = toArray(data?.projects || data).map(normalizeProject);
  return {
    source: "clickup",
    count:
      Number.isFinite(Number(data?.count)) ? Number(data.count) : projects.length,
    ticketsCount:
      Number.isFinite(Number(data?.ticketsCount))
        ? Number(data.ticketsCount)
        : projects.reduce((n, p) => n + (p.ticketsCount || p.tickets.length), 0),
    projects: projects.filter((p) => p.id),
  };
}

export async function fetchClickUpProjectDetails(projectId) {
  const data = await clickUpRequest("/projects/details", {
    query: { projectId },
  });
  const projectSource = data?.project || data?.list || data;
  const project = normalizeProject(projectSource);
  const tasks = toArray(data?.tasks || data?.tickets || projectSource?.tasks).map(normalizeTicket);
  return {
    source: "clickup",
    project: {
      id: project.id,
      name: project.name,
      description: project.desc || "",
      workspaceName: project.workspaceName || "",
      url: project.url || null,
    },
    issues: tasks,
  };
}

export async function importClickUpProjects() {
  const data = await clickUpRequest("/import-projects");
  const projects = toArray(data?.projects || data).map(normalizeProject);
  return {
    source: "clickup",
    count:
      Number.isFinite(Number(data?.count)) ? Number(data.count) : projects.length,
    ticketsCount:
      Number.isFinite(Number(data?.ticketsCount))
        ? Number(data.ticketsCount)
        : projects.reduce((n, p) => n + (p.ticketsCount || p.tickets.length), 0),
    projects: projects.filter((p) => p.id),
  };
}

export async function clickUpProxyRequest(payload) {
  return clickUpRequest("/proxy", {
    method: "POST",
    body: payload || {},
  });
}

export async function listClickUpProjectsViaBackend() {
  const { projects } = await fetchClickUpProjects();
  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    workspaceName: p.workspaceName || "",
    url: p.url || null,
    ticketsCount: p.ticketsCount || 0,
  }));
}

export async function fetchClickUpBundleViaBackend({ projectId }) {
  const details = await fetchClickUpProjectDetails(projectId);
  return {
    source: "clickup",
    project: {
      name: details?.project?.name || "Imported ClickUp list",
      description: details?.project?.description || "",
    },
    issues: toArray(details?.issues).map((task) => ({
      ...task,
      id: task.id,
      title: task.title || task.name || "Untitled",
      description: task.description || "",
      status: task.status || "open",
      priority: task.priority || "medium",
      ticket_type: task.ticket_type || "task",
      comments: toArray(task.comments),
      attachments: toArray(task.attachments),
    })),
  };
}
