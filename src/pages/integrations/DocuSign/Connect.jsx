import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Alert, Button, Card, Empty, Space, Spin, Tag } from "antd";
import {
  Link as LinkIcon,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  connectDocusignJwt,
  connectDocusignOAuth,
  disconnectDocusign,
  getDocusignAccount,
  getDocusignStatus,
} from "./api";

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const pick = (...vals) => vals.find((v) => String(v || "").trim()) || "";

const normalizeStatus = (raw) => ({
  connected: Boolean(raw?.connected),
  authMode: pick(raw?.authMode, raw?.mode, raw?.method, "unknown"),
  userName: pick(
    raw?.user?.name,
    raw?.userName,
    raw?.profile?.name,
    raw?.name,
    "",
  ),
  userEmail: pick(raw?.user?.email, raw?.email, ""),
  userId: pick(raw?.user?.id, raw?.userId, ""),
  accounts: Array.isArray(raw?.accounts) ? raw.accounts : [],
});

export default function DocuSignIntegrationConnect() {
  const location = useLocation();
  const callbackState = location.state || {};
  const [dark, setDark] = useState(getIsDarkTheme);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [status, setStatus] = useState(normalizeStatus({}));
  const [account, setAccount] = useState(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [jwtConsentUrl, setJwtConsentUrl] = useState("");
  const [responseMsg, setResponseMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const returnTo = useMemo(
    () => "http://localhost:5173/integrations/docusign/callback",
    [],
  );

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("themeModeChanged", syncTheme);
    mq.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("themeModeChanged", syncTheme);
      mq.removeEventListener("change", syncTheme);
    };
  }, []);

  const fetchAccount = useCallback(async () => {
    setAccountLoading(true);
    try {
      const data = await getDocusignAccount();
      setAccount(data || {});
    } catch (error) {
      setAccount(null);
      setErrorMsg(
        error?.details
          ? `${error.message} (${JSON.stringify(error.details)})`
          : error?.message || "Failed to fetch DocuSign account.",
      );
    } finally {
      setAccountLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    setErrorMsg("");
    try {
      const data = await getDocusignStatus();
      const normalized = normalizeStatus(data);
      setStatus(normalized);
      setJwtConsentUrl("");
      if (normalized.connected) {
        await fetchAccount();
      } else {
        setAccount(null);
      }
    } catch (error) {
      setStatus(normalizeStatus({ connected: false }));
      setAccount(null);
      setErrorMsg(
        error?.details
          ? `${error.message} (${JSON.stringify(error.details)})`
          : error?.message || "Failed to fetch DocuSign status.",
      );
    } finally {
      setLoadingStatus(false);
    }
  }, [fetchAccount]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (callbackState?.docusignCallback === "connected") {
      setResponseMsg("DocuSign connected successfully.");
    } else if (callbackState?.docusignCallback === "error") {
      setErrorMsg(
        callbackState?.docusignMessage || "DocuSign callback returned an error.",
      );
    }
  }, [callbackState]);

  const onConnectOAuth = () => {
    connectDocusignOAuth(returnTo);
  };

  const onConnectJwt = async () => {
    setBusyAction("jwt");
    setErrorMsg("");
    setResponseMsg("");
    setJwtConsentUrl("");
    try {
      const res = await connectDocusignJwt();
      setResponseMsg(
        res?.message || "DocuSign JWT connection succeeded.",
      );
      await fetchStatus();
    } catch (error) {
      const code = String(error?.code || error?.message || "").toLowerCase();
      if (code.includes("docusign_jwt_consent_required")) {
        const consentUrl = error?.consentUrl || "";
        setJwtConsentUrl(consentUrl);
        setErrorMsg(
          "DocuSign JWT consent is required before connecting.",
        );
      } else {
        setErrorMsg(
          error?.details
            ? `${error.message} (${JSON.stringify(error.details)})`
            : error?.message || "Failed to connect DocuSign via JWT.",
        );
      }
    } finally {
      setBusyAction("");
    }
  };

  const onDisconnect = async () => {
    setBusyAction("disconnect");
    setErrorMsg("");
    setResponseMsg("");
    setJwtConsentUrl("");
    try {
      await disconnectDocusign();
      setResponseMsg("DocuSign disconnected successfully.");
      await fetchStatus();
    } catch (error) {
      setErrorMsg(
        error?.details
          ? `${error.message} (${JSON.stringify(error.details)})`
          : error?.message || "Failed to disconnect DocuSign.",
      );
    } finally {
      setBusyAction("");
    }
  };

  const cardStyle = {
    background: dark ? "#17181c" : "#fff",
    border: `1px solid ${dark ? "#2a2a31" : "#e2e8f0"}`,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark ? "#141416" : "#f8fafc",
        padding: "20px 16px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, color: dark ? "#f8fafc" : "#0f172a", fontSize: 26, fontWeight: 800 }}>
            DocuSign Integration
          </h1>
          <p style={{ margin: "6px 0 0", color: dark ? "#94a3b8" : "#64748b" }}>
            Connect DocuSign via OAuth or JWT, inspect connection state, and manage session.
          </p>
        </div>

        <Card style={cardStyle} bodyStyle={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: dark ? "#f8fafc" : "#0f172a" }}>
              Connection Status
            </div>
            <Space>
              <Button
                icon={<RefreshCw size={16} />}
                onClick={fetchStatus}
                loading={loadingStatus}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<LinkIcon size={16} />}
                onClick={onConnectOAuth}
                disabled={busyAction === "disconnect"}
              >
                Connect via OAuth
              </Button>
              <Button
                icon={busyAction === "jwt" ? <Loader2 size={16} /> : <Zap size={16} />}
                onClick={onConnectJwt}
                loading={busyAction === "jwt"}
                disabled={busyAction === "disconnect"}
              >
                Connect via JWT
              </Button>
              <Button
                danger
                icon={<LogOut size={16} />}
                onClick={onDisconnect}
                loading={busyAction === "disconnect"}
              >
                Disconnect
              </Button>
            </Space>
          </div>

          <Space size={[8, 8]} wrap>
            <Tag color={status.connected ? "green" : "default"}>
              Connected: {status.connected ? "Yes" : "No"}
            </Tag>
            <Tag color={status.authMode !== "unknown" ? "blue" : "default"}>
              Auth Mode: {status.authMode || "unknown"}
            </Tag>
            <Tag color={status.userName ? "purple" : "default"}>
              User: {status.userName || "Not available"}
            </Tag>
          </Space>

          {loadingStatus ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Spin size="small" />
              <span style={{ color: dark ? "#cbd5e1" : "#334155", fontSize: 13 }}>
                Loading DocuSign status...
              </span>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontSize: 13, color: dark ? "#cbd5e1" : "#334155" }}>
                {status.userEmail ? `Email: ${status.userEmail}` : "Email: Not available"}
              </div>
              <div style={{ fontSize: 13, color: dark ? "#cbd5e1" : "#334155" }}>
                {status.userId ? `User ID: ${status.userId}` : "User ID: Not available"}
              </div>
              <div style={{ fontSize: 13, color: dark ? "#cbd5e1" : "#334155" }}>
                Linked Accounts: {status.accounts.length}
              </div>
              {status.accounts.length > 0 ? (
                <div style={{ display: "grid", gap: 6 }}>
                  {status.accounts.map((acc, idx) => {
                    const name = pick(acc?.accountName, acc?.name, acc?.baseUri, `Account ${idx + 1}`);
                    const id = pick(acc?.accountId, acc?.id, "");
                    return (
                      <div
                        key={`${name}-${idx}`}
                        style={{
                          border: `1px solid ${dark ? "#2a2a31" : "#e2e8f0"}`,
                          borderRadius: 8,
                          padding: "8px 10px",
                          fontSize: 12,
                          color: dark ? "#d1d5db" : "#334155",
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{name}</div>
                        {id ? <div style={{ opacity: 0.8 }}>ID: {id}</div> : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: dark ? "#94a3b8" : "#64748b" }}>
                  No linked accounts returned in status.
                </div>
              )}
            </div>
          )}
        </Card>

        <Card style={cardStyle} bodyStyle={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={16} />
            <div style={{ fontSize: 16, fontWeight: 700, color: dark ? "#f8fafc" : "#0f172a" }}>
              Account Details
            </div>
          </div>

          {status.connected ? (
            accountLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Spin size="small" />
                <span style={{ color: dark ? "#cbd5e1" : "#334155", fontSize: 13 }}>
                  Loading account details...
                </span>
              </div>
            ) : account ? (
              <div style={{ display: "grid", gap: 8 }}>
                {Object.entries(account).map(([key, value]) => (
                  <div key={key} style={{ fontSize: 13, color: dark ? "#cbd5e1" : "#334155" }}>
                    <strong>{key}:</strong> {typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No account details found." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )
          ) : (
            <Empty description="Connect DocuSign to load account details." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>

        {!!jwtConsentUrl && (
          <Alert
            type="warning"
            showIcon
            message="DocuSign JWT consent required"
            description={
              <a href={jwtConsentUrl} target="_blank" rel="noreferrer">
                Open consent URL
              </a>
            }
          />
        )}

        {!!responseMsg && (
          <Alert type="success" showIcon message={responseMsg} />
        )}

        {!!errorMsg && (
          <Alert type="error" showIcon message={errorMsg} />
        )}
      </div>
    </div>
  );
}
