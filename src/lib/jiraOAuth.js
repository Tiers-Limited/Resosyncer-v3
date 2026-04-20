/**
 * Atlassian OAuth 2.0 (3LO) + PKCE — browser starts flow; token exchange runs on Edge Function.
 */

const STORAGE = {
  state: "jira_oauth_state",
  verifier: "jira_oauth_code_verifier",
  session: "jira_oauth_session",
};

const CLIENT_ID = import.meta.env.VITE_JIRA_OAUTH_CLIENT_ID || "";

const SCOPES = ["read:jira-user", "read:jira-work", "offline_access"].join(" ");

function randomString(len = 64) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => ("0" + b.toString(16)).slice(-2)).join("");
}

async function sha256Base64Url(verifier) {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const b64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isJiraOAuthConfigured() {
  return Boolean(CLIENT_ID);
}

export function getRedirectUri() {
  return `${window.location.origin}/oauth/jira-callback`;
}

/**
 * Redirect the browser to Atlassian login (full page navigation).
 */
export async function startJiraOAuthRedirect() {
  if (!CLIENT_ID) {
    throw new Error("VITE_JIRA_OAUTH_CLIENT_ID is not set");
  }
  const codeVerifier = randomString(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = randomString(32);

  sessionStorage.setItem(STORAGE.verifier, codeVerifier);
  sessionStorage.setItem(STORAGE.state, state);

  const u = new URL("https://auth.atlassian.com/authorize");
  u.searchParams.set("audience", "api.atlassian.com");
  u.searchParams.set("client_id", CLIENT_ID);
  u.searchParams.set("scope", SCOPES);
  u.searchParams.set("redirect_uri", getRedirectUri());
  u.searchParams.set("state", state);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("prompt", "consent");
  u.searchParams.set("code_challenge", codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");

  window.location.assign(u.toString());
}

export function getStoredJiraSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE.session);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearStoredJiraSession() {
  sessionStorage.removeItem(STORAGE.session);
}

export function saveJiraSession(payload) {
  sessionStorage.setItem(STORAGE.session, JSON.stringify(payload));
}
