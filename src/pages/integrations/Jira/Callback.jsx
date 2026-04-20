import { Spin, message } from "antd";
import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

const JIRA_CONNECTED_STORAGE_KEY = "jira_backend_connected_at";

export default function JiraIntegrationCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const error = params.get("error");
    const errorDescription = params.get("error_description");
    const mode = params.get("mode");
    const returnTo = params.get("returnTo");
    const callbackPrefix = "/integrations/jira/callback/";
    const tail = location.pathname.startsWith(callbackPrefix)
      ? location.pathname.slice(callbackPrefix.length)
      : "";
    const malformedReturnTo = tail.startsWith("http:/") || tail.startsWith("https:/")
      ? `${tail.replace("http:/", "http://").replace("https:/", "https://")}${location.search || ""}`
      : null;

    if (error) {
      const text = errorDescription || error;
      message.error(`Jira auth failed: ${text}`);
      if (mode === "popup" && window.opener) {
        window.opener.postMessage(
          { type: "RESOSYNCER_JIRA_CONNECTED", ok: false, error: text },
          window.location.origin,
        );
        window.close();
        return;
      }
      navigate("/projects", { replace: true });
      return;
    }

    localStorage.setItem(JIRA_CONNECTED_STORAGE_KEY, String(Date.now()));
    window.dispatchEvent(new Event("jiraConnected"));

    if (mode === "popup" && window.opener) {
      window.opener.postMessage(
        { type: "RESOSYNCER_JIRA_CONNECTED", ok: true },
        window.location.origin,
      );
      window.close();
      return;
    }

    if (malformedReturnTo) {
      window.location.assign(malformedReturnTo);
      return;
    }

    const target = returnTo || "/projects?jira_connected=1";
    navigate(target, { replace: true });
  }, [location.pathname, location.search, navigate, params]);

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
      <Spin size="large" tip="Finalizing Jira connection..." />
    </div>
  );
}
