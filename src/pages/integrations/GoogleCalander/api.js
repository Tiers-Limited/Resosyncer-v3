import { INTEGRATIONS_BACKEND_BASE } from "../providers/api";
import { getIntegrationAuthHeaders, getIntegrationUserIdSync } from "../authHeaders";
export { INTEGRATIONS_BACKEND_BASE };

export const GOOGLE_CALANDER_BACKEND_BASE = `${INTEGRATIONS_BACKEND_BASE}/api/googleCalander`;
export const GOOGLE_CALANDER_CALLBACK_PATH = "/integrations/googleCalander/callback";

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeEvent = (event) => ({
  id: String(event?.id || ""),
  summary: String(event?.summary || "Untitled event"),
  description: event?.description || "",
  htmlLink: event?.htmlLink || null,
  start:
    event?.start?.dateTime ||
    event?.start?.date ||
    event?.startTime ||
    event?.start ||
    null,
  end:
    event?.end?.dateTime ||
    event?.end?.date ||
    event?.endTime ||
    event?.end ||
    null,
  raw: event || null,
});

const googleCalanderRequest = async (
  path,
  { method = "GET", query, body } = {},
) => {
  const url = new URL(`${GOOGLE_CALANDER_BACKEND_BASE}/${path}`);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) {
        url.searchParams.set(k, String(v));
      }
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
    if (res.status === 401) {
      const err = new Error(
        payload?.hint ||
          payload?.message ||
          "Reconnect Google Calendar",
      );
      err.status = 401;
      err.connectUrl = payload?.connectUrl || payload?.authUrl || null;
      throw err;
    }
    if (res.status === 403) {
      const err = new Error(
        payload?.hint ||
          payload?.message ||
          "Google Calendar access forbidden. Reconnect and grant calendar permissions.",
      );
      err.status = 403;
      err.connectUrl = payload?.connectUrl || payload?.authUrl || null;
      throw err;
    }
    const err = new Error(
      payload?.message ||
        payload?.error ||
        `googleCalander ${path} failed (${res.status})`,
    );
    err.status = res.status;
    throw err;
  }

  return payload?.data ?? payload ?? {};
};

export const getGoogleCalanderAuthUrl = (returnTo) => {
  const url = new URL(`${GOOGLE_CALANDER_BACKEND_BASE}/auth`);
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  const userId = getIntegrationUserIdSync();
  if (userId) url.searchParams.set("userId", userId);
  return url.toString();
};

export const getGoogleCalanderStatus = async () => {
  const data = await googleCalanderRequest("status");
  return {
    connected: Boolean(data?.connected),
    email: data?.email || data?.accountEmail || "",
    calendarsCount: Number(data?.calendarsCount || 0) || 0,
    raw: data,
  };
};

export const getGoogleCalanderEvents = async ({ calendarId = "primary" } = {}) => {
  const data = await googleCalanderRequest("events", {
    query: { calendarId },
  });
  const list = toArray(data?.events || data?.items || data).map(normalizeEvent);
  return {
    calendarId,
    count: Number.isFinite(Number(data?.count)) ? Number(data.count) : list.length,
    events: list.filter((event) => event.id),
    raw: data,
  };
};

export const createGoogleCalanderEvent = async ({
  calendarId = "primary",
  event,
} = {}) =>
  googleCalanderRequest("events", {
    method: "POST",
    query: { calendarId },
    body: {
      calendarId,
      event: event || {},
    },
  });

export const disconnectGoogleCalander = async () =>
  googleCalanderRequest("disconnect", { method: "POST" });
