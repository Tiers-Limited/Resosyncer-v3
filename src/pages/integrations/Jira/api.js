import { getIntegrationAuthHeaders, getIntegrationUserIdSync } from "../authHeaders";

const JIRA_FIELDS =
  "summary,description,status,priority,issuetype,assignee,comment,attachment,created,updated,subtasks,parent";

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
    if (u.origin !== window.location.origin) {
      apiBase = "/api";
    }
  } catch {
    apiBase = "/api";
  }
}

export const JIRA_BACKEND_BASE = `${apiBase}/jira`;

export function getJiraBackendAuthUrl(returnTo) {
  const authUrl = new URL(JIRA_BACKEND_BASE + "/auth", window.location.origin);
  if (returnTo) authUrl.searchParams.set("returnTo", returnTo);
  const userId = getIntegrationUserIdSync();
  if (userId) authUrl.searchParams.set("userId", userId);
  return authUrl.toString();
}

async function jiraProxyRequest({ path, method = "GET", query, body } = {}) {
  const payloadBody = {
    path,
    endpoint: path,
    url: path,
    method,
    query: query || undefined,
    params: query || undefined,
    body: body || undefined,
    data: body || undefined,
    payload: body || undefined,
  };

  const res = await fetch(`${JIRA_BACKEND_BASE}/proxy`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(await getIntegrationAuthHeaders()) },
    body: JSON.stringify(payloadBody),
  });

  const payload = await res.json().catch(() => null);
  if (payload?.error) {
    throw new Error(
      payload?.message || payload?.error || "Jira proxy returned an error",
    );
  }
  if (!res.ok) {
    const msg =
      payload?.message ||
      payload?.error ||
      `Jira proxy request failed (${res.status})`;
    throw new Error(msg);
  }
  return payload?.data ?? payload;
}

function mapJiraStatusToTicket(statusName = "") {
  const s = statusName.toLowerCase();
  if (
    s.includes("done") ||
    s.includes("complete") ||
    s.includes("resolved") ||
    s.includes("closed")
  ) {
    return "completed";
  }
  if (s.includes("progress") || s.includes("doing")) return "in_progress";
  if (s.includes("close")) return "closed";
  return "open";
}

function mapJiraPriority(priority) {
  const n = (priority?.name || priority || "").toString().toLowerCase();
  if (n.includes("highest") || n.includes("blocker")) return "urgent";
  if (n.includes("high")) return "high";
  if (n.includes("low")) return "low";
  return "medium";
}

function mapJiraType(issueType) {
  const n = (issueType?.name || issueType || "").toString().toLowerCase();
  if (n.includes("epic")) return "epic";
  if (n.includes("story")) return "story";
  if (n.includes("bug")) return "bug";
  if (n.includes("sub")) return "subtask";
  return "task";
}

function extractJiraAdfText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.text) return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractJiraAdfText).join(" ");
  }
  return "";
}

export async function listJiraProjectsViaBackend() {
  let data;
  try {
    data = await jiraProxyRequest({
      path: "/rest/api/3/project/search",
      query: { maxResults: 100 },
    });
  } catch {
    // Some Jira plans/apps return project list on /project only.
    data = await jiraProxyRequest({
      path: "/rest/api/3/project",
    });
  }

  const projects = Array.isArray(data)
    ? data
    : Array.isArray(data?.values)
      ? data.values
      : Array.isArray(data?.projects)
        ? data.projects
        : [];

  return projects
    .map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name || p.key,
    }))
    .filter((p) => p.key);
}

export async function fetchJiraBundleViaBackend({ projectKey }) {
  const project = await jiraProxyRequest({
    path: `/rest/api/3/project/${encodeURIComponent(projectKey)}`,
  });

  const jql = `project = ${projectKey} ORDER BY created DESC`;
  const fieldsList = JIRA_FIELDS.split(",").map((f) => f.trim());
  let search = null;
  let lastSearchError = null;

  const searchAttempts = [
    () =>
      jiraProxyRequest({
        path: "/rest/api/3/search/jql",
        query: {
          jql,
          maxResults: 100,
          fields: JIRA_FIELDS,
        },
      }),
    () =>
      jiraProxyRequest({
        path: "/rest/api/3/search",
        query: {
          jql,
          maxResults: 100,
          fields: JIRA_FIELDS,
        },
      }),
    () =>
      jiraProxyRequest({
        path: "/rest/api/3/search",
        method: "POST",
        body: {
          jql,
          maxResults: 100,
          fields: fieldsList,
        },
      }),
  ];

  for (const run of searchAttempts) {
    try {
      const candidate = await run();
      if (candidate && Array.isArray(candidate.issues)) {
        search = candidate;
        break;
      }
    } catch (e) {
      lastSearchError = e;
    }
  }

  if (!search) {
    throw new Error(
      lastSearchError?.message ||
        "Could not query Jira issues (all search endpoints failed).",
    );
  }

  const issues = search?.issues || [];
  const commentsByIssue = {};

  for (const issue of issues.slice(0, 30)) {
    try {
      const commentsPayload = await jiraProxyRequest({
        path: `/rest/api/3/issue/${issue.id}/comment`,
      });
      commentsByIssue[issue.id] = commentsPayload?.comments || [];
    } catch {
      commentsByIssue[issue.id] = [];
    }
  }

  return {
    source: "jira",
    project: {
      key: project?.key || projectKey,
      name: project?.name || projectKey,
      description: project?.description || "",
    },
    issues: issues.map((issue) => {
      const f = issue.fields || {};
      const statusName = f.status?.name || "";
      return {
        id: issue.id,
        key: issue.key,
        title: f.summary || issue.key,
        description:
          typeof f.description === "string"
            ? f.description
            : extractJiraAdfText(f.description),
        status: mapJiraStatusToTicket(statusName),
        statusRaw: statusName,
        priority: mapJiraPriority(f.priority),
        ticket_type: mapJiraType(f.issuetype),
        comments: (commentsByIssue[issue.id] || []).map((c) => ({
          author: c.author?.displayName || "User",
          body:
            typeof c.body === "string"
              ? c.body
              : extractJiraAdfText(c.body) || "",
          created: c.created,
        })),
        assignee_name: f.assignee?.displayName || null,
        attachments: (f.attachment || []).map((a) => ({
          name: a.filename,
          url: a.content,
        })),
      };
    }),
  };
}
