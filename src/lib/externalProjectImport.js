/**
 * Fetch external PM data (Jira / Asana / Trello) and normalize for AI.
 * Browser calls may hit CORS — use JSON paste fallback or a server proxy.
 */

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

const JIRA_BACKEND_BASE = `${apiBase}/jira`;
const ASANA_BACKEND_BASE = `${apiBase}/asana`;

function mapJiraStatusToTicket(statusName = "") {
  const s = statusName.toLowerCase();
  if (doneLike(s)) return "completed";
  if (s.includes("progress") || s.includes("doing")) return "in_progress";
  if (s.includes("close") || s.includes("done")) return "closed";
  return "open";
}

function doneLike(s) {
  return (
    s.includes("done") ||
    s.includes("complete") ||
    s.includes("resolved") ||
    s.includes("closed")
  );
}

function mapJiraPriority(p) {
  const n = (p?.name || p || "").toString().toLowerCase();
  if (n.includes("highest") || n.includes("blocker")) return "urgent";
  if (n.includes("high")) return "high";
  if (n.includes("low")) return "low";
  return "medium";
}

function mapJiraType(t) {
  const n = (t?.name || t || "").toString().toLowerCase();
  if (n.includes("epic")) return "epic";
  if (n.includes("story")) return "story";
  if (n.includes("bug")) return "bug";
  if (n.includes("sub")) return "subtask";
  return "task";
}

export async function fetchJiraBundle({
  baseUrl,
  email,
  apiToken,
  projectKey,
}) {
  const root = trimSlash(baseUrl);
  const basic = btoa(
    unescape(encodeURIComponent(`${email}:${apiToken}`)),
  );
  const headers = {
    Authorization: `Basic ${basic}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const projRes = await fetch(
    `${root}/rest/api/3/project/${encodeURIComponent(projectKey)}`,
    { headers },
  );
  if (!projRes.ok) throw new Error(`Jira project: ${projRes.status}`);
  const project = await projRes.json();

  const searchUrl = new URL(`${root}/rest/api/3/search`);
  searchUrl.searchParams.set(
    "jql",
    `project = ${projectKey} ORDER BY created DESC`,
  );
  searchUrl.searchParams.set("maxResults", "100");
  searchUrl.searchParams.set("fields", JIRA_FIELDS);

  const searchRes = await fetch(searchUrl.toString(), { headers });
  if (!searchRes.ok) throw new Error(`Jira search: ${searchRes.status}`);
  const search = await searchRes.json();

  const issues = search.issues || [];
  const commentsByIssue = {};
  for (const issue of issues.slice(0, 30)) {
    const cUrl = `${root}/rest/api/3/issue/${issue.id}/comment`;
    const cRes = await fetch(cUrl, { headers });
    if (cRes.ok) {
      const cj = await cRes.json();
      commentsByIssue[issue.id] = cj.comments || [];
    }
  }

  return {
    source: "jira",
    project: {
      key: project.key,
      name: project.name,
      description: project.description || "",
    },
    issues: issues.map((issue) => {
      const f = issue.fields || {};
      const statusName = f.status?.name || "";
      const attachments = (f.attachment || []).map((a) => ({
        name: a.filename,
        url: a.content,
      }));
      const desc =
        typeof f.description === "string"
          ? f.description
          : extractJiraAdfText(f.description);
      return {
        id: issue.id,
        key: issue.key,
        title: f.summary,
        description: desc || "",
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
        attachments,
      };
    }),
  };
}

function extractJiraAdfText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.text) return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractJiraAdfText).join("");
  }
  return "";
}

export async function fetchAsanaBundle({ token, projectGid }) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const pRes = await fetch(
    `https://app.asana.com/api/1.0/projects/${projectGid}`,
    { headers },
  );
  if (!pRes.ok) throw new Error(`Asana project: ${pRes.status}`);
  const pj = await pRes.json();
  const project = pj.data;

  const tUrl = new URL(
    `https://app.asana.com/api/1.0/projects/${projectGid}/tasks`,
  );
  tUrl.searchParams.set("limit", "100");
  tUrl.searchParams.set(
    "opt_fields",
    "name,notes,completed,due_on,created_at,permalink_url,attachments",
  );

  const tRes = await fetch(tUrl.toString(), { headers });
  if (!tRes.ok) throw new Error(`Asana tasks: ${tRes.status}`);
  const tj = await tRes.json();
  const tasks = tj.data || [];

  const detailed = [];
  for (const t of tasks.slice(0, 25)) {
    const dRes = await fetch(
      `https://app.asana.com/api/1.0/tasks/${t.gid}?opt_fields=name,notes,completed,stories,attachments`,
      { headers },
    );
    if (!dRes.ok) continue;
    const dj = await dRes.json();
    const td = dj.data;
    const stories = (td.stories || []).filter(
      (s) => s.type === "comment" || s.resource_subtype === "comment_added",
    );
    detailed.push({
      id: td.gid,
      title: td.name,
      description: td.notes || "",
      status: td.completed ? "completed" : "open",
      priority: "medium",
      ticket_type: "task",
      comments: stories.map((s) => ({
        author: s.created_by?.name || "User",
        body: s.text || "",
        created: s.created_at,
      })),
      attachments: (td.attachments || []).map((a) => ({
        name: a.name || "file",
        url: a.download_url || a.view_url || "",
      })),
    });
  }

  return {
    source: "asana",
    project: {
      name: project.name,
      description: project.notes || "",
    },
    issues: detailed,
  };
}

export async function fetchTrelloBundle({ apiKey, token, boardId }) {
  const qs = (extra) => {
    const u = new URLSearchParams({ key: apiKey, token });
    extra.forEach(([k, v]) => u.append(k, v));
    return u.toString();
  };

  const bRes = await fetch(
    `https://api.trello.com/1/boards/${boardId}?${qs([["fields", "name,desc"]])}`,
  );
  if (!bRes.ok) throw new Error(`Trello board: ${bRes.status}`);
  const board = await bRes.json();

  const cRes = await fetch(
    `https://api.trello.com/1/boards/${boardId}/cards?${qs([
      ["fields", "name,desc,dateLastActivity"],
      ["attachments", "true"],
      ["actions", "commentCard"],
      ["actions_limit", "50"],
    ])}`,
  );
  if (!cRes.ok) throw new Error(`Trello cards: ${cRes.status}`);
  const cards = await cRes.json();

  return {
    source: "trello",
    project: {
      name: board.name,
      description: board.desc || "",
    },
    issues: cards.map((c) => {
      const comments = (c.actions || [])
        .filter((a) => a.type === "commentCard")
        .map((a) => ({
          author: a.memberCreator?.fullName || "User",
          body: a.data?.text || "",
          created: a.date,
        }));
      const attachments = (c.attachments || []).map((a) => ({
        name: a.name || "file",
        url: a.url || "",
      }));
      return {
        id: c.id,
        title: c.name,
        description: c.desc || "",
        status: "open",
        priority: "medium",
        ticket_type: "task",
        comments,
        attachments,
      };
    }),
  };
}

export function normalizeRawPayload(raw) {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("Invalid JSON");
    }
  }
  return raw;
}

export function buildAiPromptForMapping(sourceLabel, compactJson) {
  return `You map external project data into our product schema.

Source: ${sourceLabel}

INPUT JSON (compact):
${JSON.stringify(compactJson).slice(0, 48000)}

The INPUT uses "project" and "issues" (external tasks). Map "issues" into "tickets".

Return ONLY valid JSON (no markdown) with this shape:
{
  "project": {
    "name": string,
    "description": string,
    "client_name": string|null,
    "client_email": string|null,
    "status": "planning"|"not_started"|"in_progress"
  },
  "tickets": [
    {
      "title": string,
      "description": string,
      "status": "open"|"in_progress"|"completed"|"closed",
      "priority": "low"|"medium"|"high"|"urgent",
      "ticket_type": "task"|"story"|"bug"|"epic"|"subtask",
      "comments": [{"author": string, "body": string}],
      "attachments": [{"name": string, "url": string}]
    }
  ]
}

Rules:
- At most 120 tickets; merge or drop the rest.
- Preserve attachment URLs when present.
- Summarize long descriptions to under 4000 chars per ticket.
- Map client-facing fields from the project name and context when available.`;
}

export function parseAiJsonResponse(text) {
  console.log(text);
  const t = (text || "").trim();
  const cleaned = t
    .replace(/^\uFEFF/, "")
    .replace(/^```[\w-]*\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall back to extracting the first balanced JSON object/array
    const start = cleaned.search(/[\[{]/);
    if (start === -1) throw new Error("AI output did not contain JSON");

    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;

    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
          continue;
        }
        if (ch === '"') inString = false;
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === "{" || ch === "[") depth++;
      if (ch === "}" || ch === "]") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end === -1) throw new Error("Could not find complete JSON in AI output");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function normalizeTicketStatus(s) {
  const v = (s || "open").toLowerCase();
  if (["open", "in_progress", "completed", "closed"].includes(v)) return v;
  if (v.includes("progress")) return "in_progress";
  if (v.includes("complete") || v.includes("done")) return "completed";
  if (v.includes("close")) return "closed";
  return "open";
}

function guessFileExtension(fileName = "", contentType = "") {
  const fromName = String(fileName).split(".").pop();
  if (fromName && fromName !== fileName) {
    return fromName.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  }
  const ct = String(contentType).toLowerCase();
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("pdf")) return "pdf";
  if (ct.includes("json")) return "json";
  if (ct.includes("csv")) return "csv";
  if (ct.includes("plain")) return "txt";
  if (ct.includes("zip")) return "zip";
  return "bin";
}

function sanitizeFileName(name = "") {
  const cleaned = String(name || "attachment")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "attachment";
}

function normalizePersonName(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeHandle(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function buildProfileMatcher(profiles = []) {
  const exactByName = new Map();
  const byFirstName = new Map();
  const byEmail = new Map();
  const byHandle = new Map();

  for (const p of profiles) {
    const id = p?.id;
    if (!id) continue;

    const fullName = normalizePersonName(p?.full_name);
    if (fullName) exactByName.set(fullName, id);

    const email = String(p?.email || "")
      .trim()
      .toLowerCase();
    if (email) {
      byEmail.set(email, id);
      const local = email.split("@")[0] || "";
      const localHandle = normalizeHandle(local);
      if (localHandle) byHandle.set(localHandle, id);
    }

    const first = fullName.split(" ")[0] || "";
    if (first) {
      const arr = byFirstName.get(first) || [];
      arr.push(id);
      byFirstName.set(first, arr);
    }

    const nameHandle = normalizeHandle(fullName);
    if (nameHandle) byHandle.set(nameHandle, id);
  }

  return (rawNameOrEmail) => {
    const raw = String(rawNameOrEmail || "").trim();
    if (!raw) return null;

    const emailLike = raw.toLowerCase();
    if (byEmail.has(emailLike)) return byEmail.get(emailLike);
    const emailLocal = emailLike.includes("@") ? emailLike.split("@")[0] : "";
    const emailLocalHandle = normalizeHandle(emailLocal);
    if (emailLocalHandle && byHandle.has(emailLocalHandle)) {
      return byHandle.get(emailLocalHandle);
    }

    const n = normalizePersonName(raw);
    if (!n) return null;
    if (exactByName.has(n)) return exactByName.get(n);

    const handle = normalizeHandle(raw);
    if (handle && byHandle.has(handle)) return byHandle.get(handle);

    const first = n.split(" ")[0] || "";
    const firstMatches = first ? byFirstName.get(first) || [] : [];
    if (firstMatches.length === 1) return firstMatches[0];

    return null;
  };
}

function parseNameFromUrl(url = "") {
  try {
    const pathname = new URL(url).pathname;
    const raw = pathname.split("/").pop() || "attachment";
    return sanitizeFileName(decodeURIComponent(raw));
  } catch {
    return "attachment";
  }
}

function normalizeSyncedAttachments(payload) {
  const root = payload?.data ?? payload ?? {};
  const list = Array.isArray(root?.attachments)
    ? root.attachments
    : Array.isArray(root?.files)
      ? root.files
      : [];
  const urls = Array.isArray(root?.urls) ? root.urls : [];
  const out = [];
  const seen = new Set();
  const pushUnique = (row) => {
    const key = String(
      row?.storage_path || row?.file_url || `${row?.file_name || ""}:${row?.file_size || ""}`,
    )
      .trim()
      .toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(row);
  };

  for (const a of list) {
    const fileUrl =
      a?.file_url || a?.url || a?.publicUrl || a?.public_url || null;
    if (!fileUrl) continue;
    pushUnique({
      file_name: sanitizeFileName(a?.file_name || a?.name || parseNameFromUrl(fileUrl)),
      file_url: fileUrl,
      file_size: Number(a?.file_size ?? a?.size) || null,
      file_type: a?.file_type || a?.type || null,
      storage_path: a?.storage_path || a?.path || null,
    });
  }

  for (const url of urls) {
    if (!url) continue;
    pushUnique({
      file_name: parseNameFromUrl(url),
      file_url: url,
      file_size: null,
      file_type: null,
      storage_path: null,
    });
  }

  return {
    attachments: out,
    failedAttachments: Array.isArray(root?.failedAttachments)
      ? root.failedAttachments
      : [],
  };
}

async function syncJiraAttachmentsViaBackend({ issueKey, ticketId, uploadedBy }) {
  const res = await fetch(`${JIRA_BACKEND_BASE}/sync-attachments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      issueKey,
      ticketId,
      uploadedBy,
    }),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      payload?.message ||
      payload?.error ||
      `Jira attachment sync failed (${res.status})`;
    throw new Error(msg);
  }

  return normalizeSyncedAttachments(payload);
}

async function syncAsanaAttachmentsViaBackend({ taskId, ticketId, uploadedBy }) {
  const res = await fetch(`${ASANA_BACKEND_BASE}/sync-attachments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      taskGid: taskId,
      taskId,
      sourceTaskId: taskId,
      ticketId,
      uploadedBy,
    }),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      payload?.message ||
      payload?.error ||
      `Asana attachment sync failed (${res.status})`;
    throw new Error(msg);
  }

  return normalizeSyncedAttachments(payload);
}

async function uploadImportedAttachmentToStorage({
  supabase,
  ticketId,
  attachment,
}) {
  if (!attachment?.url) {
    throw new Error("Attachment URL missing");
  }

  const res = await fetch(attachment.url);
  if (!res.ok) {
    throw new Error(`Attachment download failed (${res.status})`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error("Attachment URL returned HTML instead of file content");
  }

  const blob = await res.blob();
  if (!blob || blob.size <= 0) {
    throw new Error("Attachment file content was empty");
  }

  const safeName = sanitizeFileName(attachment?.name || "attachment");
  const ext = guessFileExtension(safeName, blob.type || contentType);
  const path = `tickets/${ticketId}/import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("attachments")
    .upload(path, blob, {
      contentType: blob.type || contentType || undefined,
    });

  if (uploadErr) {
    throw new Error(uploadErr.message || "Storage upload failed");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("attachments").getPublicUrl(path);

  if (!publicUrl) {
    throw new Error("Could not get public URL for uploaded attachment");
  }

  return {
    file_name: safeName,
    file_url: publicUrl,
    file_size: blob.size,
    file_type: blob.type || contentType || null,
    storage_path: path,
  };
}

/**
 * Insert mapped project + tickets + comments + attachments (external URLs).
 */
/** List Jira projects the token can access */
export async function listJiraProjects({ baseUrl, email, apiToken }) {
  const root = trimSlash(baseUrl);
  const basic = btoa(
    unescape(encodeURIComponent(`${email}:${apiToken}`)),
  );
  const res = await fetch(`${root}/rest/api/3/project`, {
    headers: {
      Authorization: `Basic ${basic}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Could not list Jira projects (${res.status})`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name || p.key,
  }));
}

/** Jira Cloud REST through OAuth gateway (needs cloudId from accessible-resources). */
export function jiraCloudRestBase(cloudId) {
  return `https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3`;
}

export async function listJiraProjectsOAuth({ accessToken, cloudId }) {
  const root = jiraCloudRestBase(cloudId);
  const res = await fetch(`${root}/project`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Could not list Jira projects (${res.status})`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name || p.key,
  }));
}

export async function fetchJiraBundleOAuth({
  accessToken,
  cloudId,
  projectKey,
}) {
  const root = jiraCloudRestBase(cloudId);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const projRes = await fetch(
    `${root}/project/${encodeURIComponent(projectKey)}`,
    { headers },
  );
  if (!projRes.ok) throw new Error(`Jira project: ${projRes.status}`);
  const project = await projRes.json();

  const searchUrl = new URL(`${root}/search`);
  searchUrl.searchParams.set(
    "jql",
    `project = ${projectKey} ORDER BY created DESC`,
  );
  searchUrl.searchParams.set("maxResults", "100");
  searchUrl.searchParams.set("fields", JIRA_FIELDS);

  const searchRes = await fetch(searchUrl.toString(), { headers });
  if (!searchRes.ok) throw new Error(`Jira search: ${searchRes.status}`);
  const search = await searchRes.json();

  const issues = search.issues || [];
  const commentsByIssue = {};
  for (const issue of issues.slice(0, 30)) {
    const cUrl = `${root}/issue/${issue.id}/comment`;
    const cRes = await fetch(cUrl, { headers });
    if (cRes.ok) {
      const cj = await cRes.json();
      commentsByIssue[issue.id] = cj.comments || [];
    }
  }

  return {
    source: "jira",
    project: {
      key: project.key,
      name: project.name,
      description: project.description || "",
    },
    issues: issues.map((issue) => {
      const f = issue.fields || {};
      const statusName = f.status?.name || "";
      const attachments = (f.attachment || []).map((a) => ({
        name: a.filename,
        url: a.content,
      }));
      const desc =
        typeof f.description === "string"
          ? f.description
          : extractJiraAdfText(f.description);
      return {
        id: issue.id,
        key: issue.key,
        title: f.summary,
        description: desc || "",
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
        attachments,
      };
    }),
  };
}

/** All Asana projects across workspaces (for bulk pick) */
export async function listAllAsanaProjects(token) {
  const headers = { Authorization: `Bearer ${token}` };
  const wr = await fetch("https://app.asana.com/api/1.0/workspaces", {
    headers,
  });
  if (!wr.ok) throw new Error(`Asana workspaces (${wr.status})`);
  const wj = await wr.json();
  const workspaces = wj.data || [];
  const out = [];
  for (const w of workspaces) {
    const pr = await fetch(
      `https://app.asana.com/api/1.0/projects?workspace=${w.gid}&limit=100&archived=false`,
      { headers },
    );
    if (!pr.ok) continue;
    const pj = await pr.json();
    for (const p of pj.data || []) {
      out.push({
        gid: p.gid,
        name: p.name,
        workspaceName: w.name,
      });
    }
  }
  return out;
}

export async function listTrelloBoards(apiKey, token) {
  const url = new URL("https://api.trello.com/1/members/me/boards");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("token", token);
  url.searchParams.set("fields", "name,desc,shortLink");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Trello boards (${res.status})`);
  const boards = await res.json();
  return (Array.isArray(boards) ? boards : []).map((b) => ({
    id: b.id,
    name: b.name,
    desc: b.desc || "",
  }));
}

export function normalizeMappedPayload(mapped) {
  if (!mapped || typeof mapped !== "object") return { projects: [] };
  if (Array.isArray(mapped.projects) && mapped.projects.length) {
    return { projects: mapped.projects };
  }
  if (mapped.project) {
    return {
      projects: [
        {
          project: mapped.project,
          tickets: Array.isArray(mapped.tickets) ? mapped.tickets : [],
        },
      ],
    };
  }
  return { projects: [] };
}

/**
 * Import one or many mapped projects (same shape as single + optional `projects` array).
 */
export async function executeBulkMappedImport({
  supabase,
  tenantId,
  userId,
  mapped,
}) {
  const { projects } = normalizeMappedPayload(mapped);
  if (!projects.length) throw new Error("Nothing to import");
  const projectIds = [];
  const warnings = [];
  for (const item of projects) {
    const result = await executeMappedImport({
      supabase,
      tenantId,
      userId,
      mapped: {
        project: item.project || {},
        tickets: item.tickets || [],
      },
    });
    projectIds.push(result.projectId);
    if (Array.isArray(result.warnings) && result.warnings.length) {
      warnings.push(...result.warnings);
    }
  }
  return { projectIds, projectId: projectIds[0], warnings };
}

export async function executeMappedImport({
  supabase,
  tenantId,
  userId,
  mapped,
}) {
  const proj = mapped.project || {};
  const tickets = Array.isArray(mapped.tickets) ? mapped.tickets : [];
  const { data: tenantProfiles } = await supabase
    .from("profiles")
    .select("id,full_name,email,tenant_id")
    .eq("tenant_id", tenantId);
  const matchProfileId = buildProfileMatcher(tenantProfiles || []);

  const { data: row, error: pErr } = await supabase
    .from("projects")
    .insert([
      {
        tenant_id: tenantId,
        name: proj.name || "Imported project",
        project_type: "single",
        status: proj.status || "planning",
        client_name: proj.client_name || null,
        client_email: proj.client_email || null,
        client_phone: proj.client_phone || null,
        client_country: proj.client_country || "",
        country_flag: proj.country_flag || null,
        requirements: proj.description || proj.requirements || "",
        remarks: "",
        created_by: userId,
        is_archived: false,
      },
    ])
    .select()
    .single();

  if (pErr) throw pErr;
  const projectId = row.id;
  const matchedAssigneeIds = new Set();
  const warnings = [];

  const idMap = {};
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    const externalId = t.external_id || t.id || `idx-${i}`;
    const matchedAssigneeId = matchProfileId(
      t.assignee_email || t.assignee_username || t.assignee_name || t.assignee,
    );
    if (matchedAssigneeId) matchedAssigneeIds.add(matchedAssigneeId);
    const { data: ticketRow, error: tErr } = await supabase
      .from("tickets")
      .insert([
        {
          project_id: projectId,
          title: (t.title || "Untitled").slice(0, 500),
          description: (t.description || "").slice(0, 12000),
          status: normalizeTicketStatus(t.status),
          priority: ["low", "medium", "high", "urgent"].includes(
            (t.priority || "").toLowerCase(),
          )
            ? t.priority.toLowerCase()
            : "medium",
          ticket_type: ["epic", "story", "task", "bug", "subtask"].includes(
            (t.ticket_type || "").toLowerCase(),
          )
            ? t.ticket_type.toLowerCase()
            : "task",
          created_by: userId,
          assigned_to: matchedAssigneeId || null,
          assigned_to_ids: matchedAssigneeId ? [matchedAssigneeId] : [],
          story_points: Math.min(
            21,
            Math.max(0, Number(t.story_points) || 0),
          ),
        },
      ])
      .select()
      .single();

    if (tErr) throw tErr;
    idMap[externalId] = ticketRow.id;

    const comments = Array.isArray(t.comments) ? t.comments : [];
    for (const c of comments.slice(0, 200)) {
      const authorProfileId = matchProfileId(c.author);
      const msg = authorProfileId
        ? `[Import] ${(c.body || "").slice(0, 8000)}`
        : `[Import] ${c.author || "User"}: ${(c.body || "").slice(0, 8000)}`;
      await supabase.from("ticket_comments").insert([
        {
          ticket_id: ticketRow.id,
          user_id: authorProfileId || userId,
          message: msg,
        },
      ]);
    }

    const sourceName = String(t.source || mapped?.source || "").toLowerCase();
    const externalIdString = String(externalId || "");
    const guessedIssueKey = /^[A-Z][A-Z0-9]+-\d+$/i.test(externalIdString)
      ? externalIdString.toUpperCase()
      : null;
    const issueKey =
      t.source_issue_key || t.issue_key || t.key || guessedIssueKey || null;
    const isJiraTicket = sourceName === "jira" && Boolean(issueKey);

    if (isJiraTicket) {
      const { attachments: synced, failedAttachments } = await syncJiraAttachmentsViaBackend({
        issueKey,
        ticketId: ticketRow.id,
        uploadedBy: userId,
      });
      if (Array.isArray(failedAttachments) && failedAttachments.length) {
        warnings.push({
          source: "jira",
          ticketTitle: ticketRow.title,
          count: failedAttachments.length,
        });
      }
      if (synced.length) {
        await supabase.from("ticket_attachments").insert(
          synced.map((a) => ({
            ticket_id: ticketRow.id,
            uploaded_by: userId,
            file_name: (a.file_name || "attachment").slice(0, 255),
            file_url: a.file_url,
            file_size: a.file_size ?? null,
            file_type: a.file_type ?? null,
            storage_path: a.storage_path ?? null,
          })),
        );
      }
      continue;
    }

    const isAsanaTicket = sourceName === "asana";
    if (isAsanaTicket) {
      const taskId = String(t.external_id || t.id || "").trim();
      if (taskId) {
        const { attachments: synced, failedAttachments } = await syncAsanaAttachmentsViaBackend({
          taskId,
          ticketId: ticketRow.id,
          uploadedBy: userId,
        });
        if (Array.isArray(failedAttachments) && failedAttachments.length) {
          warnings.push({
            source: "asana",
            ticketTitle: ticketRow.title,
            count: failedAttachments.length,
          });
        }
        if (synced.length) {
          await supabase.from("ticket_attachments").insert(
            synced.map((a) => ({
              ticket_id: ticketRow.id,
              uploaded_by: userId,
              file_name: (a.file_name || "attachment").slice(0, 255),
              file_url: a.file_url,
              file_size: a.file_size ?? null,
              file_type: a.file_type ?? null,
              storage_path: a.storage_path ?? null,
            })),
          );
        }
        continue;
      }
    }

    const attachments = Array.isArray(t.attachments) ? t.attachments : [];
    const seenAttachmentUrls = new Set();
    for (const a of attachments) {
      if (!a?.url) continue;
      const dedupKey = String(a.url).trim().toLowerCase();
      if (!dedupKey || seenAttachmentUrls.has(dedupKey)) continue;
      seenAttachmentUrls.add(dedupKey);
      let uploaded;
      try {
        uploaded = await uploadImportedAttachmentToStorage({
          supabase,
          ticketId: ticketRow.id,
          attachment: a,
        });
      } catch (err) {
        const attachmentName = a?.name || "attachment";
        throw new Error(
          `Failed to import attachment "${attachmentName}" for ticket "${ticketRow.title}": ${err.message}`,
        );
      }
      await supabase.from("ticket_attachments").insert([
        {
          ticket_id: ticketRow.id,
          uploaded_by: userId,
          file_name: (uploaded.file_name || "attachment").slice(
            0,
            255,
          ),
          file_url: uploaded.file_url,
          file_size: uploaded.file_size ?? null,
          file_type: uploaded.file_type ?? null,
          storage_path: uploaded.storage_path ?? null,
        },
      ]);
    }
  }

  if (matchedAssigneeIds.size) {
    await supabase.from("project_assignees").upsert(
      [...matchedAssigneeIds].map((employeeId) => ({
        project_id: projectId,
        employee_id: employeeId,
      })),
      {
        onConflict: "project_id,employee_id",
        ignoreDuplicates: true,
      },
    );
  }

  // Second pass: parent_id links (optional)
  for (let i = 0; i < tickets.length; i++) {
    const t = tickets[i];
    const pid = t.parent_external_id || t.parent_id;
    if (!pid) continue;
    const childKey = t.external_id || t.id || `idx-${i}`;
    const childId = idMap[childKey];
    const parentId = idMap[pid];
    if (childId && parentId) {
      await supabase
        .from("tickets")
        .update({ parent_id: parentId, ticket_type: "subtask" })
        .eq("id", childId);
    }
  }

  return { projectId, warnings };
}

export async function executeImportRequest({
  supabase,
  requestId,
  actorUserId,
}) {
  const { data: req, error: rErr } = await supabase
    .from("project_import_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (rErr || !req) throw rErr || new Error("Request not found");
  if (req.created_project_id) {
    return { projectId: req.created_project_id, skipped: true };
  }
  if (req.status !== "approved") {
    throw new Error("Import not ready");
  }

  const userId = req.created_by || actorUserId;
  if (!userId) throw new Error("Missing user for import");

  const { data: lockRow, error: lockErr } = await supabase
    .from("project_import_requests")
    .update({ status: "importing", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "approved")
    .select()
    .maybeSingle();

  if (lockErr) throw lockErr;
  if (!lockRow) {
    return { projectId: null, skipped: true };
  }

  try {
    const mp = req.mapped_payload;
    const mapped =
      mp && typeof mp === "object" ? mp : JSON.parse(mp || "{}");
    const { projects } = normalizeMappedPayload(mapped);
    if (!projects.length) throw new Error("Invalid or empty mapping payload");
    const { projectId } = await executeBulkMappedImport({
      supabase,
      tenantId: req.tenant_id,
      userId,
      mapped,
    });

    await supabase
      .from("project_import_requests")
      .update({
        status: "imported",
        created_project_id: projectId,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    return { projectId };
  } catch (e) {
    await supabase
      .from("project_import_requests")
      .update({
        status: "failed",
        error_message: e?.message || "Import failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    throw e;
  }
}

function trimSlash(u) {
  return (u || "").replace(/\/+$/, "");
}
