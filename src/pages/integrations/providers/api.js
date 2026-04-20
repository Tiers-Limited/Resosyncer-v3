/** @typedef {import("./types").IntegrationProject} IntegrationProject */
/** @typedef {import("./types").IntegrationProjectsResponse} IntegrationProjectsResponse */
import { normalizeProvider } from "./providerUtils.js";
import { supabase } from "../../../lib/supabase";

export const INTEGRATIONS_BACKEND_BASE = (
  import.meta.env?.VITE_INTEGRATIONS_BACKEND_BASE || "http://localhost:3001"
)
  .trim()
  .replace(/\/+$/, "");

const bambooDebug = (...args) => {
  if (typeof window === "undefined") return;
  console.log("[BambooHR Frontend]", ...args);
};

const getSupabaseBearerFromStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    const key = Object.keys(localStorage).find((k) =>
      k.startsWith("sb-") && k.endsWith("-auth-token"),
    );
    if (!key) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const token = parsed?.access_token;
    return token ? `Bearer ${token}` : null;
  } catch {
    return null;
  }
};

const getSupabaseSessionAccessToken = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || null;
    if (token) return token;
  } catch {
    // fall through to storage fallback below
  }
  // Fallback: old behavior in case session bootstrap is delayed.
  const bearer = getSupabaseBearerFromStorage();
  if (!bearer) return null;
  return bearer.replace(/^Bearer\s+/i, "").trim() || null;
};

const decodeJwtPayload = (jwt) => {
  const raw = String(jwt || "").trim();
  if (!raw || !raw.includes(".")) return null;
  const parts = raw.split(".");
  if (parts.length < 2) return null;
  if (typeof atob !== "function") return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = atob(padded);
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

const getSupabaseUserIdFromStorage = () => {
  const bearer = getSupabaseBearerFromStorage();
  if (!bearer) return null;
  const token = bearer.replace(/^Bearer\s+/i, "").trim();
  const payload = decodeJwtPayload(token);
  const userId = String(
    payload?.sub || payload?.user_id || payload?.id || "",
  ).trim();
  return userId || null;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeTicket = (ticket) => ({
  id: String(ticket?.id || ""),
  name: String(ticket?.name || "Untitled"),
  status: ticket?.status || null,
  url: ticket?.url || null,
  assigneeName: ticket?.assigneeName || null,
  dueAt: ticket?.dueAt || null,
  sectionName: ticket?.sectionName || null,
});

const normalizeEmployee = (employee) => ({
  id: String(employee?.id || employee?.employeeId || ""),
  employeeId: employee?.employeeId || null,
  firstName: employee?.firstName || "",
  lastName: employee?.lastName || "",
  fullName:
    employee?.fullName ||
    [employee?.firstName, employee?.lastName].filter(Boolean).join(" ") ||
    "Unknown",
  preferredName: employee?.preferredName || "",
  workEmail: employee?.workEmail || "",
  homeEmail: employee?.homeEmail || "",
  jobTitle: employee?.jobTitle || "",
  department: employee?.department || "",
  division: employee?.division || "",
  location: employee?.location || "",
  mobilePhone: employee?.mobilePhone || "",
  workPhone: employee?.workPhone || "",
  status: employee?.status || "",
  source: employee?.source || "bamboohr",
  raw: employee?.raw ?? null,
});

const normalizeProject = (project) => {
  const tickets = toArray(project?.tickets).map(normalizeTicket);
  const sections = toArray(project?.sections)
    .map((s) => (typeof s === "string" ? s : s?.name || ""))
    .filter(Boolean);
  return {
    id: String(project?.id || ""),
    name: String(project?.name || "Untitled"),
    url: project?.url || null,
    workspaceName: project?.workspaceName || null,
    sections,
    sectionsCount:
      Number.isFinite(Number(project?.sectionsCount))
        ? Number(project.sectionsCount)
        : sections.length,
    ticketsCount:
      Number.isFinite(Number(project?.ticketsCount))
        ? Number(project.ticketsCount)
        : tickets.length,
    tickets,
  };
};

/**
 * @param {"asana" | "trello" | "clickup" | "bamboohr"} provider
 * @param {string} returnTo
 * @param {{ companyDomain?: string, userId?: string }} [options]
 */
export const getProviderAuthUrl = (provider, returnTo, options = {}) => {
  const p = normalizeProvider(provider);
  const u = new URL(`${INTEGRATIONS_BACKEND_BASE}/api/${p}/auth`);
  if (returnTo) u.searchParams.set("returnTo", returnTo);
  if (p === "bamboohr" && options?.companyDomain) {
    u.searchParams.set("companyDomain", String(options.companyDomain).trim());
  }
  if (p === "bamboohr") {
    const userId = String(
      options?.userId || getSupabaseUserIdFromStorage() || "",
    ).trim();
    if (userId) u.searchParams.set("userId", userId);
  }
  return u.toString();
};

/**
 * @param {"asana" | "trello" | "clickup"} provider
 * @param {string} endpoint
 * @returns {Promise<any>}
 */
const providerGet = async (provider, endpoint) => {
  const p = normalizeProvider(provider);
  const res = await fetch(`${INTEGRATIONS_BACKEND_BASE}/api/${p}/${endpoint}`, {
    method: "GET",
    credentials: "include",
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(
      payload?.message || payload?.error || `${p} ${endpoint} failed (${res.status})`,
    );
    err.status = res.status;
    throw err;
  }
  return payload;
};

/**
 * @param {"asana" | "trello" | "clickup"} provider
 * @param {any} payload
 * @returns {IntegrationProjectsResponse}
 */
const normalizeProjectsPayload = (provider, payload) => {
  const data = payload?.data ?? payload ?? {};
  const projects = toArray(data?.projects).map(normalizeProject).filter((p) => p.id);
  const ticketsCount =
    Number.isFinite(Number(data?.ticketsCount))
      ? Number(data.ticketsCount)
      : projects.reduce((n, p) => n + (p.ticketsCount || p.tickets?.length || 0), 0);

  return {
    source: normalizeProvider(data?.source || provider),
    count: Number.isFinite(Number(data?.count)) ? Number(data.count) : projects.length,
    ticketsCount,
    projects,
  };
};

/**
 * @param {"asana" | "trello" | "clickup"} provider
 * @returns {Promise<IntegrationProjectsResponse>}
 */
export const getProviderProjects = async (provider) => {
  const endpoint =
    normalizeProvider(provider) === "asana"
      ? "projects?includeSections=true"
      : "projects";
  const payload = await providerGet(provider, endpoint);
  return normalizeProjectsPayload(provider, payload);
};

/**
 * @param {"asana" | "trello" | "clickup"} provider
 * @returns {Promise<IntegrationProjectsResponse>}
 */
export const importProviderProjects = async (provider) => {
  const endpoint =
    normalizeProvider(provider) === "asana"
      ? "import-projects?includeSections=true"
      : "import-projects";
  const payload = await providerGet(provider, endpoint);
  return normalizeProjectsPayload(provider, payload);
};

export const asanaIntegrationApi = {
  getAuthUrl: (returnTo) => getProviderAuthUrl("asana", returnTo),
  getProjects: () => getProviderProjects("asana"),
  importProjects: () => importProviderProjects("asana"),
};

export const trelloIntegrationApi = {
  getAuthUrl: (returnTo) => getProviderAuthUrl("trello", returnTo),
  getProjects: () => getProviderProjects("trello"),
  importProjects: () => importProviderProjects("trello"),
};

export const clickUpIntegrationApi = {
  getAuthUrl: (returnTo) => getProviderAuthUrl("clickup", returnTo),
  getProjects: () => getProviderProjects("clickup"),
  getProjectDetails: (projectId) =>
    providerGet("clickup", `projects/details?projectId=${encodeURIComponent(projectId)}`),
  importProjects: () => importProviderProjects("clickup"),
  proxyRequest: async (payload) => {
    const res = await fetch(`${INTEGRATIONS_BACKEND_BASE}/api/clickup/proxy`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(
        data?.message || data?.error || `clickup proxy failed (${res.status})`,
      );
      err.status = res.status;
      throw err;
    }
    return data?.data ?? data;
  },
};

const bambooHrRequest = async (path, { method = "GET", query, body } = {}) => {
  const url = new URL(`${INTEGRATIONS_BACKEND_BASE}/api/bamboohr/${path}`);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const supabaseAccessToken = await getSupabaseSessionAccessToken();
  const supabaseBearer = supabaseAccessToken
    ? `Bearer ${supabaseAccessToken}`
    : null;

  bambooDebug("request:start", {
    path,
    method,
    url: url.toString(),
    hasBody: Boolean(body),
    query: query || null,
    localFlags: {
      connectedAt: localStorage.getItem("bamboohr_connected_at") || null,
      companyDomain: localStorage.getItem("bamboohr_company_domain") || null,
      selectedProvider:
        localStorage.getItem("integrations_selected_provider") || null,
      hasSupabaseBearer: Boolean(supabaseBearer),
      hasSupabaseAccessToken: Boolean(supabaseAccessToken),
    },
  });

  const headers = { "Content-Type": "application/json" };
  if (supabaseBearer) {
    headers.Authorization = supabaseBearer;
  }
  if (supabaseAccessToken) {
    headers["x-access-token"] = supabaseAccessToken;
    headers["x-supabase-access-token"] = supabaseAccessToken;
  }

  const res = await fetch(url.toString(), {
    method,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await res.json().catch(() => null);
  bambooDebug("request:response", {
    path,
    method,
    status: res.status,
    ok: res.ok,
    payload:
      payload && typeof payload === "object"
        ? {
            connected: payload?.connected ?? payload?.data?.connected ?? null,
            message: payload?.message || payload?.error || payload?.hint || null,
            hasData: Boolean(payload?.data),
            keys: Object.keys(payload).slice(0, 8),
          }
        : payload,
  });
  if (!res.ok) {
    if (res.status === 401) {
      const err = new Error(
        payload?.hint ||
          "BambooHR session expired or unauthorized. Please reconnect BambooHR.",
      );
      err.status = 401;
      err.connectUrl = payload?.connectUrl || null;
      bambooDebug("request:error:401", {
        path,
        connectUrl: err.connectUrl,
        message: err.message,
      });
      throw err;
    }

    const err = new Error(
      payload?.message || payload?.error || `bamboohr ${path} failed (${res.status})`,
    );
    err.status = res.status;
    bambooDebug("request:error", { path, status: err.status, message: err.message });
    throw err;
  }
  bambooDebug("request:success", { path, status: res.status });
  return payload?.data ?? payload ?? {};
};

const normalizeEmployeesPayload = (payload) => {
  const data = payload?.data ?? payload ?? {};
  const employees = toArray(data?.employees || data).map(normalizeEmployee);
  return {
    source: "bamboohr",
    count:
      Number.isFinite(Number(data?.count)) ? Number(data.count) : employees.length,
    employees: employees.filter((e) => e.id),
  };
};

export const getBambooHrAuthUrl = (companyDomain, returnTo) =>
  getProviderAuthUrl("bamboohr", returnTo, { companyDomain });

export const getBambooHrStatus = async () => {
  const data = await bambooHrRequest("status");
  return {
    connected: Boolean(data?.connected),
    companyDomain: data?.companyDomain || data?.company_domain || "",
    source: "bamboohr",
  };
};

export const getBambooHrEmployees = async () => {
  const payload = await bambooHrRequest("employees");
  return normalizeEmployeesPayload(payload);
};

export const importBambooHrEmployees = async ({ employeeIds } = {}) => {
  const query =
    Array.isArray(employeeIds) && employeeIds.length > 0
      ? { employeeIds: employeeIds.join(",") }
      : undefined;
  const payload = await bambooHrRequest("import-employees", { query });
  return normalizeEmployeesPayload(payload);
};

export const disconnectBambooHr = async () => {
  const data = await bambooHrRequest("disconnect", { method: "POST" });
  return {
    ok: data?.ok !== false,
    disconnected: true,
  };
};

export const bambooHrProxyRequest = async (payload) =>
  bambooHrRequest("proxy", { method: "POST", body: payload || {} });

export const bambooHrIntegrationApi = {
  getAuthUrl: (companyDomain, returnTo) =>
    getBambooHrAuthUrl(companyDomain, returnTo),
  getStatus: () => getBambooHrStatus(),
  getEmployees: () => getBambooHrEmployees(),
  importEmployees: (options) => importBambooHrEmployees(options),
  disconnect: () => disconnectBambooHr(),
  proxyRequest: (payload) => bambooHrProxyRequest(payload),
};

const googleWorkspaceDebug = (...args) => {
  if (typeof window === "undefined") return;
  console.log("[GoogleWorkspace Frontend]", ...args);
};

const googleWorkspaceRequest = async (path, { method = "GET", query, body } = {}) => {
  const url = new URL(`${INTEGRATIONS_BACKEND_BASE}/api/googleworkspace/${path}`);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const supabaseAccessToken = await getSupabaseSessionAccessToken();
  const headers = { "Content-Type": "application/json" };
  if (supabaseAccessToken) {
    headers.Authorization = `Bearer ${supabaseAccessToken}`;
    headers["x-access-token"] = supabaseAccessToken;
    headers["x-supabase-access-token"] = supabaseAccessToken;
  }

  googleWorkspaceDebug("request:start", { path, method, url: url.toString() });
  const res = await fetch(url.toString(), {
    method,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await res.json().catch(() => null);
  googleWorkspaceDebug("request:response", {
    path,
    method,
    status: res.status,
    ok: res.ok,
    payload,
  });

  if (!res.ok) {
    if (res.status === 401) {
      const err = new Error(
        payload?.hint ||
          payload?.message ||
          "Google Workspace session expired or unauthorized. Please reconnect.",
      );
      err.status = 401;
      err.connectUrl = payload?.connectUrl || null;
      throw err;
    }
    const err = new Error(
      payload?.message ||
        payload?.error ||
        `googleworkspace ${path} failed (${res.status})`,
    );
    err.status = res.status;
    throw err;
  }

  return payload?.data ?? payload ?? {};
};

export const getGoogleWorkspaceAuthUrl = (returnTo) => {
  const u = new URL(`${INTEGRATIONS_BACKEND_BASE}/api/googleworkspace/auth`);
  if (returnTo) u.searchParams.set("returnTo", returnTo);
  return u.toString();
};

export const getGoogleWorkspaceStatus = async () => {
  const data = await googleWorkspaceRequest("status");
  return {
    connected: Boolean(data?.connected),
    email: data?.email || "",
    source: "googleworkspace",
  };
};

const normalizeGoogleWorkspaceEmployeesPayload = (payload) => {
  const data = payload?.data ?? payload ?? {};
  const employees = toArray(data?.employees || data).map((employee) => ({
    ...normalizeEmployee(employee),
    source: "googleworkspace",
  }));
  return {
    source: "googleworkspace",
    count:
      Number.isFinite(Number(data?.count)) ? Number(data.count) : employees.length,
    employees: employees.filter((e) => e.id),
  };
};

export const getGoogleWorkspaceEmployees = async () => {
  const payload = await googleWorkspaceRequest("employees");
  return normalizeGoogleWorkspaceEmployeesPayload(payload);
};

export const importGoogleWorkspaceEmployees = async ({ employeeIds } = {}) => {
  const query =
    Array.isArray(employeeIds) && employeeIds.length > 0
      ? { employeeIds: employeeIds.join(",") }
      : undefined;
  const payload = await googleWorkspaceRequest("import-employees", { query });
  return normalizeGoogleWorkspaceEmployeesPayload(payload);
};

export const disconnectGoogleWorkspace = async () => {
  const data = await googleWorkspaceRequest("disconnect", { method: "POST" });
  return {
    ok: data?.ok !== false,
    disconnected: true,
  };
};
