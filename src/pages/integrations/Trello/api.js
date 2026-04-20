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

export const TRELLO_BACKEND_BASE = `${apiBase}/trello`;

export function getTrelloBackendAuthUrl(returnTo) {
  const authUrl = new URL(TRELLO_BACKEND_BASE + "/auth", window.location.origin);
  if (returnTo) authUrl.searchParams.set("returnTo", returnTo);
  return authUrl.toString();
}

async function trelloRequest(path, { method = "GET", query, body } = {}) {
  const url = new URL(`${TRELLO_BACKEND_BASE}${path}`, window.location.origin);
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
        `Trello request failed (${res.status})`,
    );
  }
  return payload?.data ?? payload;
}

const toArray = (v) => (Array.isArray(v) ? v : []);

const normalizeTicket = (t) => ({
  id: t?.id || t?.gid || "",
  title: t?.title || t?.name || "Untitled",
  description: t?.description || t?.desc || "",
  status: t?.status || "open",
  assignee_name: t?.assignee_name || t?.assigneeName || null,
  due_date: t?.due_date || t?.dueAt || null,
  section_name: t?.section_name || t?.sectionName || null,
  url: t?.url || null,
});

const normalizeProject = (p) => ({
  id: p?.id || p?.gid || "",
  name: p?.name || "Untitled",
  desc: p?.desc || p?.description || "",
  workspaceName: p?.workspaceName || "",
  url: p?.url || null,
  tickets: toArray(p?.tickets).map(normalizeTicket),
  ticketsCount:
    Number.isFinite(Number(p?.ticketsCount))
      ? Number(p.ticketsCount)
      : toArray(p?.tickets).length,
});

export async function listTrelloProjectsViaBackend() {
  const data = await trelloRequest("/projects");
  const projects = toArray(data?.projects || data).map(normalizeProject);
  return projects.filter((p) => p.id);
}

export async function fetchTrelloImportProjectsViaBackend() {
  const data = await trelloRequest("/import-projects");
  const projects = toArray(data?.projects || data).map(normalizeProject);
  return {
    source: "trello",
    count:
      Number.isFinite(Number(data?.count)) ? Number(data.count) : projects.length,
    ticketsCount:
      Number.isFinite(Number(data?.ticketsCount))
        ? Number(data.ticketsCount)
        : projects.reduce((n, p) => n + (p.ticketsCount || p.tickets.length), 0),
    projects,
  };
}

export async function fetchTrelloBundleViaBackend({ boardId }) {
  const imported = await fetchTrelloImportProjectsViaBackend();
  const project = imported.projects.find((p) => String(p.id) === String(boardId));
  if (!project) {
    throw new Error(`Trello board not found in import response (${boardId})`);
  }

  return {
    source: "trello",
    project: {
      name: project.name || "Imported Trello board",
      description: project.desc || "",
    },
    issues: toArray(project.tickets).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      assignee_name: t.assignee_name,
      due_date: t.due_date,
      section_name: t.section_name,
      url: t.url,
      comments: [],
      attachments: [],
    })),
  };
}

