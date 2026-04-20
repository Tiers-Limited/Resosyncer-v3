import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, message } from "antd";
import { supabase } from "../lib/supabase";
import {
  saveJiraSession,
  getRedirectUri,
} from "../lib/jiraOAuth";

export default function JiraOAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const err = params.get("error");

      if (err) {
        message.error(
          `Jira: ${params.get("error_description") || err}`,
        );
        navigate("/projects", { replace: true });
        return;
      }

      if (!code || !state) {
        message.error("Missing OAuth parameters.");
        navigate("/projects", { replace: true });
        return;
      }

      const saved = sessionStorage.getItem("jira_oauth_state");
      const verifier = sessionStorage.getItem("jira_oauth_code_verifier");
      if (!verifier || state !== saved) {
        message.error("Invalid session — open Import and click Connect Jira again.");
        navigate("/projects", { replace: true });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke(
          "jira-oauth-exchange",
          {
            body: {
              code,
              redirect_uri: getRedirectUri(),
              code_verifier: verifier,
            },
          },
        );

        if (error) throw error;
        if (data?.error) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : JSON.stringify(data.error),
          );
        }

        const resources = data.resources || [];
        const me = data.me;
        const first = resources[0];

        saveJiraSession({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
          obtainedAt: Date.now(),
          resources,
          me,
          cloudId: first?.id,
          siteUrl: first?.url,
          siteName: first?.name,
          accountEmail: me?.email,
          accountName: me?.name,
        });

        sessionStorage.removeItem("jira_oauth_state");
        sessionStorage.removeItem("jira_oauth_code_verifier");

        if (!cancelled) message.success("Jira connected");
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          message.error(e?.message || "Could not complete Jira sign-in");
        }
      }

      if (!cancelled) {
        navigate("/projects?jira_oauth=1", { replace: true });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
      }}
    >
      <Spin size="large" tip="Completing Jira connection…" />
    </div>
  );
}
