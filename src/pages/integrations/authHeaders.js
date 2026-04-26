import { supabase } from "../../lib/supabase";

export const getIntegrationAuthHeaders = async () => {
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

export const getIntegrationUserId = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return String(session?.user?.id || "").trim();
  } catch {
    return "";
  }
};

export const getIntegrationUserIdSync = () => {
  try {
    const keys = Object.keys(localStorage || {});
    const authKey = keys.find(
      (key) => key.startsWith("sb-") && key.endsWith("-auth-token"),
    );
    if (!authKey) return "";
    const raw = localStorage.getItem(authKey);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    const session = Array.isArray(parsed) ? parsed[0] : parsed;
    return String(session?.user?.id || session?.currentSession?.user?.id || "").trim();
  } catch {
    return "";
  }
};
