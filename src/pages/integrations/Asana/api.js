import { getIntegrationAuthHeaders, getIntegrationUserIdSync } from "../authHeaders";

const normalizeApiBase = (value) => {
  const v = (value || "").trim().replace(/\/+$/, "");
  if (!v) return "/api";
  return v.endsWith("/api") ? v : `${v}/api`;
};

const envApiBase = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);
let apiBase = envApiBase;

if (typeof window !== "undefined" && import.meta.env.DEV) {
  try {
    const u = new URL(envApiBase, window.location.origin);
    if (u.origin !== window.location.origin) apiBase = "/api";
  } catch {
    apiBase = "/api";
  }
}

export const ASANA_BACKEND_BASE = `${apiBase}/asana`;

export function getAsanaBackendAuthUrl(returnTo) {
  const authUrl = new URL(ASANA_BACKEND_BASE + "/auth", window.location.origin);
  if (returnTo) authUrl.searchParams.set("returnTo", returnTo);
  const userId = getIntegrationUserIdSync();
  if (userId) authUrl.searchParams.set("userId", userId);
  return authUrl.toString();
}

async function asanaRequest(path, { method = "GET", query, body } = {}) {
  const url = new URL(`${ASANA_BACKEND_BASE}${path}`, window.location.origin);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(await getIntegrationAuthHeaders()) },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `Asana request failed (${res.status})`,
    );
  }
  return payload?.data ?? payload;
}

export async function listAsanaProjectsViaBackend() {
  const data = await asanaRequest("/projects");
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.projects)
      ? data.projects
      : Array.isArray(data?.data)
        ? data.data
        : [];

  return list
    .map((p) => ({
      gid: p.gid || p.id,
      name: p.name || "Untitled",
      workspaceName:
        p.workspaceName ||
        p.workspace?.name ||
        p.workspace?.display_name ||
        "",
    }))
    .filter((p) => p.gid);
}

function collectTaskCandidates(payload) {
  const found = [];
  const seen = new Set();
  const stack = [payload];

  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (seen.has(node)) continue;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) stack.push(item);
      continue;
    }

    const hasId = Boolean(node.gid || node.id);
    const hasName = typeof node.name === "string" && node.name.trim().length > 0;
    const resourceType = String(
      node.resource_type || node.resource_subtype || node.type || "",
    )
      .trim()
      .toLowerCase();
    const nonTaskTypes = new Set([
      "project",
      "workspace",
      "team",
      "user",
      "section",
      "tag",
      "story",
      "attachment",
      "portfolio",
    ]);
    const isExplicitTaskType = resourceType.includes("task");
    const looksTaskLike =
      typeof node.completed === "boolean" ||
      typeof node.notes === "string" ||
      Boolean(node.assignee) ||
      Boolean(node.assignee_name) ||
      Array.isArray(node.memberships);
    const looksLikeTask =
      hasId &&
      hasName &&
      !nonTaskTypes.has(resourceType) &&
      (isExplicitTaskType || looksTaskLike);
    if (looksLikeTask) found.push(node);

    for (const v of Object.values(node)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }

  return found;
}

const normalizeAsanaTask = (t) => ({
  id: t.gid || t.id,
  title: t.name || "Untitled",
  description: t.notes || t.description || "",
  assignee_name:
    t.assignee_name ||
    t.assignee?.name ||
    t.assignee?.display_name ||
    t.assignee?.displayName ||
    t.assigneeName ||
    "",
  assignee_email:
    t.assignee_email ||
    t.assignee?.email ||
    t.assignee?.mail ||
    t.assigneeEmail ||
    "",
  status:
    t.status ||
    (t.completed ? "completed" : "open"),
  priority: t.priority || "medium",
  ticket_type: t.ticket_type || "task",
  comments: Array.isArray(t.comments || t.stories)
    ? (t.comments || t.stories).map((c) => ({
        author: c.author || c.created_by?.name || "User",
        body: c.body || c.text || "",
        created: c.created || c.created_at || null,
      }))
    : [],
  attachments: Array.isArray(t.attachments)
    ? t.attachments
        .map((a) => ({
          name: a.name || "attachment",
          url: a.url || a.download_url || a.view_url || "",
        }))
        .filter((a) => a.url)
    : [],
});

export async function fetchAsanaBundleViaBackend({ projectGid }) {
  const isMissingTasksReadScopeError = (err) => {
    const msg = String(err?.message || "").toLowerCase();
    return msg.includes("tasks:read") || msg.includes("one of the following scopes must be present");
  };

  const extractCandidateTasks = (payload) => {
    const directTasks =
      payload?.tasks ||
      payload?.issues ||
      payload?.tickets ||
      payload?.data?.tasks ||
      payload?.data?.issues ||
      payload?.data?.tickets ||
      (Array.isArray(payload?.data) ? payload.data : null);

    if (Array.isArray(directTasks)) return directTasks;
    return collectTaskCandidates(payload);
  };

  const extractSections = (payload, tasks = []) => {
    const direct =
      payload?.sections ||
      payload?.data?.sections ||
      payload?.project?.sections ||
      payload?.data?.project?.sections;
    if (Array.isArray(direct)) return direct;

    const byTask = new Set();
    for (const t of Array.isArray(tasks) ? tasks : []) {
      const names = [];
      if (t?.section?.name) names.push(t.section.name);
      if (t?.section_name) names.push(t.section_name);
      const memberships = Array.isArray(t?.memberships) ? t.memberships : [];
      for (const m of memberships) {
        if (m?.section?.name) names.push(m.section.name);
      }
      for (const n of names) {
        if (typeof n === "string" && n.trim()) byTask.add(n.trim());
      }
    }
    return [...byTask].map((name) => ({ name }));
  };

  const attempts = [
    {
      label: "GET /projects/:projectGid",
      run: () => asanaRequest(`/projects/${encodeURIComponent(projectGid)}`),
    },
    {
      label: "GET /projects?includeTasks=1",
      run: () =>
        asanaRequest("/projects", {
          query: { projectGid, includeTasks: 1 },
        }),
    },
    {
      label: "GET /projects/:projectGid/tasks",
      run: () =>
        asanaRequest(`/projects/${encodeURIComponent(projectGid)}/tasks`),
    },
    {
      label: "GET /tasks?projectGid={value}",
      run: () =>
        asanaRequest("/tasks", {
          query: { projectGid },
        }),
    },
    {
      label: "GET /projects/details?projectGid={value}",
      run: () =>
        asanaRequest("/projects/details", {
          query: { projectGid, includeSections: 1 },
        }),
    },
    {
      label: "GET /import-projects?includeSections=1",
      run: () =>
        asanaRequest("/import-projects", {
          query: { includeSections: 1 },
        }),
    },
  ];

  let payload = null;
  let fallbackPayload = null;
  let lastErr = null;
  let missingTasksReadScope = false;
  for (const attempt of attempts) {
    try {
      const candidate = await attempt.run();
      if (!candidate) continue;
      if (!fallbackPayload) fallbackPayload = candidate;
      const candidateTasks = extractCandidateTasks(candidate);
      console.log("[Asana][Attempt]", {
        projectGid,
        endpoint: attempt.label,
        queryProjectGid: projectGid,
        tasksFound: Array.isArray(candidateTasks) ? candidateTasks.length : 0,
        topLevelKeys:
          candidate && typeof candidate === "object"
            ? Object.keys(candidate).slice(0, 12)
            : [],
      });
      if (Array.isArray(candidateTasks) && candidateTasks.length > 0) {
        payload = candidate;
        break;
      }
    } catch (e) {
      lastErr = e;
      if (isMissingTasksReadScopeError(e)) {
        missingTasksReadScope = true;
      }
      console.warn("[Asana][Attempt failed]", {
        projectGid,
        endpoint: attempt.label,
        queryProjectGid: projectGid,
        error: e?.message || String(e),
      });
    }
  }

  if (!payload && fallbackPayload) payload = fallbackPayload;

  if (!payload) {
    throw new Error(lastErr?.message || "Could not fetch Asana project bundle");
  }

  const project =
    payload.project ||
    payload.data?.project ||
    payload.data ||
    payload;

  const tasks = extractCandidateTasks(payload);
  const sections = extractSections(payload, tasks);
  const sectionsCount =
    Number.isFinite(Number(payload?.sectionsCount))
      ? Number(payload.sectionsCount)
      : Number.isFinite(Number(payload?.data?.sectionsCount))
        ? Number(payload.data.sectionsCount)
        : sections.length;
  if ((!Array.isArray(tasks) || tasks.length === 0) && missingTasksReadScope) {
    throw new Error(
      "Asana permissions are missing task access (`tasks:read`). Please reconnect Asana and approve task permissions, then try again.",
    );
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.warn("[Asana] No tasks found in backend responses for project", {
      projectGid,
      projectName: project?.name || null,
      payloadKeys:
        payload && typeof payload === "object" ? Object.keys(payload).slice(0, 20) : [],
    });
  }

  return {
    source: "asana",
    project: {
      name: project.name || "",
      description: project.notes || project.description || "",
      sections,
      sectionsCount,
    },
    issues: Array.isArray(tasks) ? tasks.map(normalizeAsanaTask) : [],
  };
}
