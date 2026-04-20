import { useEffect, useRef, useState } from "react";
import { Alert, Spin } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { providerTitle, readCallbackResult } from "./providerCallbackUtils.js";
import {
  getGoogleWorkspaceEmployees,
  getGoogleWorkspaceStatus,
} from "./providers/api.js";

const googleWorkspaceCallbackLog = (stage, details = {}) => {
  if (typeof window === "undefined") return;
  console.log("[GoogleWorkspace Callback]", stage, {
    ...details,
    localFlags: {
      connectedAt: localStorage.getItem("googleworkspace_connected_at") || null,
      selectedProvider:
        localStorage.getItem("integrations_selected_provider") || null,
    },
  });
};

export default function ProviderCallback({ provider = "asana" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const hasRunRef = useRef(false);
  const { error, errorDescription } = readCallbackResult(location.search || "");
  const [resultType, setResultType] = useState(error ? "error" : "success");
  const [resultMessage, setResultMessage] = useState(
    error
      ? decodeURIComponent(errorDescription || error)
      : "Connection received. Verifying account access...",
  );

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    let timeoutId;
    const run = async () => {
      localStorage.setItem("integrations_selected_provider", provider);
      if (error) {
        setResultType("error");
        setResultMessage(decodeURIComponent(errorDescription || error));
      } else if (provider === "googleworkspace") {
        const clearLocalConnectedFlag = () => {
          localStorage.removeItem("googleworkspace_connected_at");
        };

        try {
          googleWorkspaceCallbackLog("verify:start");
          const status = await getGoogleWorkspaceStatus();
          googleWorkspaceCallbackLog("verify:status", {
            connected: Boolean(status?.connected),
            email: status?.email || null,
          });
          if (!status?.connected) {
            clearLocalConnectedFlag();
            googleWorkspaceCallbackLog("verify:notConnected");
            setResultType("warning");
            setResultMessage(
              "Google Workspace is not connected yet. Please click Connect again in the import modal.",
            );
          } else {
            await getGoogleWorkspaceEmployees();
            googleWorkspaceCallbackLog("verify:employeesProbe:success");
            localStorage.setItem("googleworkspace_connected_at", String(Date.now()));
            setResultType("success");
            setResultMessage("Google Workspace verified successfully.");
          }
        } catch (err) {
          googleWorkspaceCallbackLog("verify:error", {
            status: Number(err?.status) || null,
            message: err?.message || "Unknown",
            connectUrl: err?.connectUrl || null,
          });
          clearLocalConnectedFlag();
          setResultType("error");
          setResultMessage(
            "We could not verify Google Workspace right now. Please reconnect from the import modal.",
          );
        }
      } else {
        localStorage.setItem(`${provider}_connected_at`, String(Date.now()));
        setResultType("success");
        setResultMessage(`${providerTitle(provider)} connected successfully.`);
      }

      timeoutId = window.setTimeout(() => {
        if (provider === "googleworkspace") {
          navigate("/employees?import=googleworkspace", { replace: true });
        } else {
          navigate("/projects", { replace: true });
        }
      }, 1000);
    };

    run();
    return () => clearTimeout(timeoutId);
  }, [provider, error, errorDescription, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8fafc",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Spin size="small" />
          <strong>{providerTitle(provider)} OAuth callback</strong>
        </div>
        {error ? (
          <Alert
            type="error"
            showIcon
            title={decodeURIComponent(error)}
            description={decodeURIComponent(errorDescription || "")}
          />
        ) : (
          <Alert
            type={resultType}
            showIcon
            title={
              resultType === "warning"
                ? `${providerTitle(provider)} needs reconnect`
                : `${providerTitle(provider)} connected`
            }
            description={resultMessage}
          />
        )}
      </div>
    </div>
  );
}
