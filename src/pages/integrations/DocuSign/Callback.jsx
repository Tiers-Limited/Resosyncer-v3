import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "antd";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getDocusignStatus } from "./api";

const decode = (val) => {
  try {
    return decodeURIComponent(String(val || ""));
  } catch {
    return String(val || "");
  }
};

const getThemeMode = () => {
  if (typeof window === "undefined") return "light";
  const mode = String(localStorage.getItem("themeMode") || "light").toLowerCase();
  if (mode === "dark") return "dark";
  if (mode === "white") return "white";
  if (mode === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function DocuSignCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying DocuSign connection...");
  const [kind, setKind] = useState("info");
  const [themeMode, setThemeMode] = useState(getThemeMode);

  const callbackError = useMemo(
    () => searchParams.get("error") || "",
    [searchParams],
  );
  const callbackErrorDescription = useMemo(
    () => searchParams.get("error_description") || "",
    [searchParams],
  );
  const flow = useMemo(() => searchParams.get("flow") || "", [searchParams]);
  const envelopeId = useMemo(
    () => searchParams.get("envelopeId") || "",
    [searchParams],
  );
  const event = useMemo(() => searchParams.get("event") || "", [searchParams]);
  const dark = themeMode === "dark";

  useEffect(() => {
    const syncTheme = () => setThemeMode(getThemeMode());
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);
    mediaQuery.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const finalize = async () => {
      if (callbackError) {
        if (!mounted) return;
        const detail = decode(callbackErrorDescription || callbackError);
        setKind("error");
        setMessage(`DocuSign callback error: ${detail}`);
        setTimeout(() => {
          navigate("/contract-maker", {
            replace: true,
            state: {
              docusignCallback: "error",
              docusignMessage: detail,
            },
          });
        }, 1000);
        return;
      }

      if (flow === "sign" && envelopeId) {
        if (!mounted) return;
        setKind("success");
        setMessage("Signing flow returned. Redirecting...");
        setTimeout(() => {
          navigate("/contract-maker", {
            replace: true,
            state: {
              docusignCallback: "signed_return",
              envelopeId,
              docusignEvent: event || "",
            },
          });
        }, 600);
        return;
      }

      try {
        const status = await getDocusignStatus();
        if (!mounted) return;
        const connected = Boolean(status?.connected);
        setKind(connected ? "success" : "warning");
        setMessage(
          connected
            ? "DocuSign connected. Redirecting..."
            : "DocuSign callback completed, but account is not connected. Redirecting...",
        );
        setTimeout(() => {
          navigate("/contract-maker", {
            replace: true,
            state: {
              docusignCallback: connected ? "connected" : "not_connected",
            },
          });
        }, 800);
      } catch (error) {
        if (!mounted) return;
        const msg = error?.message || "Could not verify DocuSign status.";
        setKind("error");
        setMessage(msg);
        setTimeout(() => {
          navigate("/contract-maker", {
            replace: true,
            state: {
              docusignCallback: "error",
              docusignMessage: msg,
            },
          });
        }, 1000);
      }
    };
    finalize();
    return () => {
      mounted = false;
    };
  }, [callbackError, callbackErrorDescription, flow, envelopeId, event, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: dark
          ? "radial-gradient(1200px 520px at 20% -20%, #1f2937 0%, #111216 45%, #0b0d12 100%)"
          : "radial-gradient(1200px 520px at 20% -20%, #e0e7ff 0%, #f7f9fc 45%, #ffffff 100%)",
        color: dark ? "#f8fafc" : "#0f172a",
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 760,
          width: "100%",
          borderRadius: 20,
          border: dark ? "1px solid #2a2b31" : "1px solid #e2e8f0",
          background: dark ? "rgba(26,27,31,0.92)" : "rgba(255,255,255,0.94)",
          boxShadow: dark
            ? "0 20px 50px rgba(0,0,0,0.35)"
            : "0 20px 50px rgba(15,23,42,0.08)",
          padding: "22px 20px",
          display: "grid",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: dark ? "rgba(59,130,246,0.22)" : "#e0e7ff",
              color: dark ? "#93c5fd" : "#3453b7",
            }}
          >
            {kind === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: dark ? "#f8fafc" : "#0f172a",
                marginBottom: 2,
              }}
            >
              DocuSign Flow
            </div>
            <div style={{ fontSize: 13, color: dark ? "#a1a1aa" : "#64748b" }}>
              {themeMode === "white" ? "White theme" : dark ? "Dark theme" : "Light theme"} active
            </div>
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{message}</div>
        <div>
          {kind === "error" && (
            <Alert type="error" showIcon message={message} style={{ borderRadius: 12 }} />
          )}
          {kind === "success" && (
            <Alert type="success" showIcon message={message} style={{ borderRadius: 12 }} />
          )}
          {kind === "warning" && (
            <Alert type="warning" showIcon message={message} style={{ borderRadius: 12 }} />
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
