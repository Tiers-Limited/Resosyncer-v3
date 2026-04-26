const LINKEDIN_BACKEND_BASE = (
  import.meta.env?.VITE_INTEGRATIONS_BACKEND_BASE || "http://localhost:3001"
)
  .trim()
  .replace(/\/+$/, "");

const parseJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const throwApiError = (fallbackMessage, payload, status) => {
  const err = new Error(
    payload?.error || payload?.message || fallbackMessage || "Request failed",
  );
  err.status = status;
  err.details = payload?.details || null;
  throw err;
};

export const getLinkedinStatus = async () => {
  const res = await fetch(`${LINKEDIN_BACKEND_BASE}/api/linkedin/status`, {
    method: "GET",
    credentials: "include",
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throwApiError("Failed to fetch LinkedIn status", payload, res.status);
  }
  return payload?.data ?? payload ?? {};
};

export const getLinkedinPages = async () => {
  const res = await fetch(`${LINKEDIN_BACKEND_BASE}/api/linkedin/pages`, {
    method: "GET",
    credentials: "include",
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throwApiError("Failed to fetch LinkedIn pages", payload, res.status);
  }
  return payload?.data ?? payload ?? {};
};

export const connectLinkedin = (returnTo) => {
  const callback = String(returnTo || "").trim();
  const url = new URL(`${LINKEDIN_BACKEND_BASE}/api/linkedin/auth`);
  url.searchParams.set("returnTo", callback);
  window.location.href = url.toString();
};

export const createLinkedinPost = async ({
  text,
  visibility = "PUBLIC",
  imageUrl = "",
  mediaUrl = "",
  imageData = "",
  imageMimeType = "",
  authorUrn = "",
  organizationUrn = "",
  pageId = "",
  pageUrn = "",
}) => {
  const body = { text, visibility };
  if (imageUrl || mediaUrl) {
    body.imageUrl = imageUrl || mediaUrl;
    body.mediaUrl = mediaUrl || imageUrl;
  }
  if (imageData) {
    body.imageData = imageData;
    body.imageBase64 = imageData;
    if (imageMimeType) body.imageMimeType = imageMimeType;
  }
  if (authorUrn) body.authorUrn = authorUrn;
  if (organizationUrn) body.organizationUrn = organizationUrn;
  if (pageId) body.pageId = pageId;
  if (pageUrn) body.pageUrn = pageUrn;
  const res = await fetch(`${LINKEDIN_BACKEND_BASE}/api/linkedin/post`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throwApiError("Failed to publish LinkedIn post", payload, res.status);
  }
  return payload?.data ?? payload ?? {};
};

export const disconnectLinkedin = async () => {
  const res = await fetch(`${LINKEDIN_BACKEND_BASE}/api/linkedin/disconnect`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throwApiError("Failed to disconnect LinkedIn", payload, res.status);
  }
  return payload?.data ?? payload ?? {};
};
