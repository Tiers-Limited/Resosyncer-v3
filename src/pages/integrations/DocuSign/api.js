import { supabase } from "../../../lib/supabase";

const DOCUSIGN_BACKEND_BASE = (
  import.meta.env?.VITE_INTEGRATIONS_BACKEND_BASE || "http://localhost:3001"
)
  .trim()
  .replace(/\/+$/, "");
const DOCUSIGN_SEND_ENDPOINT =
  import.meta.env?.VITE_DOCUSIGN_SEND_ENDPOINT || "/api/docusign/envelopes/send";
const DOCUSIGN_SIGNED_DOC_ENDPOINT_TEMPLATE =
  import.meta.env?.VITE_DOCUSIGN_SIGNED_DOC_ENDPOINT_TEMPLATE ||
  "/api/docusign/envelopes/:envelopeId/document";
const DOCUSIGN_ENVELOPE_STATUS_ENDPOINT_TEMPLATE =
  import.meta.env?.VITE_DOCUSIGN_ENVELOPE_STATUS_ENDPOINT_TEMPLATE ||
  "/api/docusign/envelopes/:envelopeId/status";
const DOCUSIGN_SIGNED_DOC_EMAIL_ENDPOINT_TEMPLATE =
  import.meta.env?.VITE_DOCUSIGN_SIGNED_DOC_EMAIL_ENDPOINT_TEMPLATE ||
  "/api/docusign/envelopes/:envelopeId/email";

const parseJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const getAuthHeaders = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = String(session?.access_token || "").trim();
    const userId = String(session?.user?.id || "").trim();
    const headers = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (userId) headers["x-user-id"] = userId;
    return headers;
  } catch {
    return {};
  }
};

const throwApiError = (fallbackMessage, payload, status) => {
  const err = new Error(
    payload?.error ||
      payload?.message ||
      payload?.code ||
      fallbackMessage ||
      "Request failed",
  );
  err.status = status;
  err.code = payload?.code || payload?.error || "";
  err.details = payload?.details || null;
  err.consentUrl = payload?.consentUrl || payload?.details?.consentUrl || "";
  throw err;
};

export const getDocusignStatus = async () => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${DOCUSIGN_BACKEND_BASE}/api/docusign/status`, {
    method: "GET",
    credentials: "include",
    headers: authHeaders,
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throwApiError("Failed to fetch DocuSign status", payload, res.status);
  }
  return payload?.data ?? payload ?? {};
};

export const connectDocusignOAuth = (returnTo, options = {}) => {
  const callback = String(returnTo || "").trim();
  const userId = String(options?.userId || "").trim();
  const url = new URL(`${DOCUSIGN_BACKEND_BASE}/api/docusign/auth`);
  if (callback) url.searchParams.set("returnTo", callback);
  if (userId) url.searchParams.set("userId", userId);
  window.location.href = url.toString();
};

export const connectDocusignJwt = async () => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${DOCUSIGN_BACKEND_BASE}/api/docusign/jwt/connect`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({}),
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throwApiError("Failed to connect DocuSign via JWT", payload, res.status);
  }
  return payload?.data ?? payload ?? {};
};

export const getDocusignAccount = async () => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${DOCUSIGN_BACKEND_BASE}/api/docusign/account`, {
    method: "GET",
    credentials: "include",
    headers: authHeaders,
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throwApiError("Failed to fetch DocuSign account", payload, res.status);
  }
  return payload?.data ?? payload ?? {};
};

export const disconnectDocusign = async () => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${DOCUSIGN_BACKEND_BASE}/api/docusign/disconnect`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({}),
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throwApiError("Failed to disconnect DocuSign", payload, res.status);
  }
  return payload?.data ?? payload ?? {};
};

const resolveBackendUrl = (path) => {
  const p = String(path || "").trim();
  if (!p) return "";
  return p.startsWith("http")
    ? p
    : `${DOCUSIGN_BACKEND_BASE}${p.startsWith("/") ? p : `/${p}`}`;
};

const resolveEnvelopePath = (template, envelopeId) => {
  const id = encodeURIComponent(String(envelopeId || "").trim());
  return String(template || "").replace(":envelopeId", id);
};

const postJson = async (path, body, fallbackMessage) => {
  const url = resolveBackendUrl(path);
  if (!url) {
    const err = new Error(`${fallbackMessage || "Request failed"}: invalid URL`);
    err.code = "docusign_invalid_url";
    throw err;
  }
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify(body || {}),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throwApiError(fallbackMessage, data, res.status);
  }
  return data?.data ?? data ?? {};
};

export const createDocusignEnvelope = async (payload) =>
  postJson("/api/docusign/envelopes", payload, "Failed to create DocuSign envelope");

export const createDocusignRecipientView = async (envelopeId, payload) =>
  postJson(
    `/api/docusign/envelopes/${encodeURIComponent(String(envelopeId || "").trim())}/recipient-view`,
    payload,
    "Failed to create DocuSign recipient view",
  );

export const getDocusignSignedDocument = async (envelopeId) => {
  const path = resolveEnvelopePath(DOCUSIGN_SIGNED_DOC_ENDPOINT_TEMPLATE, envelopeId);
  const url = resolveBackendUrl(path);
  if (!url) {
    const err = new Error("Failed to fetch signed document: invalid URL");
    err.code = "docusign_invalid_url";
    throw err;
  }
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: authHeaders,
  });
  if (!res.ok) {
    const payload = await parseJson(res);
    throwApiError("Failed to fetch signed document", payload, res.status);
  }
  const contentType = String(res.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
    const blob = await res.blob();
    return {
      url: URL.createObjectURL(blob),
      source: "blob",
    };
  }
  const payload = await parseJson(res);
  const data = payload?.data ?? payload ?? {};
  const directUrl =
    data?.signedDocumentUrl ||
    data?.documentUrl ||
    data?.url ||
    data?.downloadUrl ||
    "";
  if (directUrl) {
    return { url: String(directUrl), source: "url" };
  }
  const base64 = data?.documentBase64 || data?.pdfBase64 || "";
  if (base64) {
    return { url: `data:application/pdf;base64,${base64}`, source: "data" };
  }
  throw new Error("Signed document is not available yet.");
};

export const getDocusignEnvelopeStatus = async (envelopeId) => {
  const path = resolveEnvelopePath(DOCUSIGN_ENVELOPE_STATUS_ENDPOINT_TEMPLATE, envelopeId);
  const url = resolveBackendUrl(path);
  if (!url) {
    const err = new Error("Failed to fetch envelope status: invalid URL");
    err.code = "docusign_invalid_url";
    throw err;
  }
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: authHeaders,
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throwApiError("Failed to fetch envelope status", payload, res.status);
  }
  return payload?.data ?? payload ?? {};
};

export const emailDocusignSignedDocument = async (envelopeId, payload) => {
  const path = resolveEnvelopePath(
    DOCUSIGN_SIGNED_DOC_EMAIL_ENDPOINT_TEMPLATE,
    envelopeId,
  );
  return postJson(path, payload, "Failed to send signed document email");
};

export const sendDocusignEnvelope = async (payload) => {
  const path = String(DOCUSIGN_SEND_ENDPOINT || "").trim();
  if (!path) {
    const err = new Error("DocuSign send endpoint is not configured.");
    err.code = "docusign_send_endpoint_missing";
    throw err;
  }
  return postJson(path, payload, "Failed to send DocuSign envelope");
};
