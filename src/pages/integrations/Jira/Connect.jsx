import { Button } from "antd";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getJiraBackendAuthUrl } from "./api";

export default function JiraIntegrationConnect() {
  const [params] = useSearchParams();
  const mode = params.get("mode") || "page";
  const returnToParam = params.get("returnTo");

  const callbackUrl = useMemo(() => {
    const u = new URL(`${window.location.origin}/integrations/jira/callback`);
    if (mode === "popup") u.searchParams.set("mode", "popup");
    if (returnToParam) u.searchParams.set("returnTo", returnToParam);
    return u.toString();
  }, [mode, returnToParam]);

  const startAuth = () => {
    window.location.assign(getJiraBackendAuthUrl(callbackUrl));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(1200px 620px at 10% 0%, rgba(56,189,248,0.2), transparent), #f8fafc",
        fontFamily: "'DM Sans', sans-serif",
        padding: 24,
      }}
    >
      {/* --- Logo row --- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          width: "100%",
          maxWidth: 580,
        }}
      >
        {/* Ryzent */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "linear-gradient(145deg, #0f172a, #1e3a5f)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(15,23,42,0.12)",
            }}
          >
            <img
              src="/Ryzent1.png"
              alt="Ryzent"
              style={{ width: 52, height: 52, objectFit: "contain" }}
            />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            Ryzent
          </span>
        </div>

        {/* Connector */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            padding: "0 8px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* Left line */}
            <div
              style={{
                width: 72,
                height: 2,
                background: "linear-gradient(90deg, #e2e8f0, #cbd5e1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <style>{`
                @keyframes travel {
                  0%   { left: 0%;   opacity: 0; }
                  10%  { opacity: 1; }
                  90%  { opacity: 1; }
                  100% { left: 100%; opacity: 0; }
                }
                @keyframes travel-right {
                  0%   { left: 100%; opacity: 0; }
                  10%  { opacity: 1; }
                  90%  { opacity: 1; }
                  100% { left: 0%;   opacity: 0; }
                }
                .dot-left {
                  position: absolute; top: 50%; transform: translateY(-50%);
                  width: 6px; height: 6px; border-radius: 50%;
                  background: #142b6f;
                  animation: travel 2s ease-in-out infinite;
                }
                .dot-right {
                  position: absolute; top: 50%; transform: translateY(-50%);
                  width: 6px; height: 6px; border-radius: 50%;
                  background: #142b6f;
                  animation: travel-right 2s ease-in-out infinite;
                  animation-delay: 0.3s;
                }
              `}</style>
              <div className="dot-left" />
            </div>

            {/* Plug icon */}
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                boxShadow: "0 2px 10px rgba(15,23,42,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 8h1a4 4 0 010 8h-1"
                  stroke="#142b6f"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M6 8H5a4 4 0 000 8h1"
                  stroke="#142b6f"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 12h8"
                  stroke="#142b6f"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Right line */}
            <div
              style={{
                width: 72,
                height: 2,
                background: "linear-gradient(90deg, #cbd5e1, #e2e8f0)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="dot-right" />
            </div>
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#94a3b8",
              letterSpacing: "0.8px",
              textTransform: "uppercase",
            }}
          >
            Connect
          </span>
        </div>

        {/* Jira */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(15,23,42,0.07)",
            }}
          >
            <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
              <path
                d="M16.47 2C16.09 5.86 13.73 8.27 10.27 8.27H7.63V10.74C7.63 13.37 9.8 15.4 12.43 15.4H14.44V19.02C14.44 21.65 16.61 23.68 19.24 23.68H19.7V21.26C19.7 18.63 17.53 16.6 14.9 16.6H12.89V13.08H15.52C18.55 13.08 21.1 10.64 21.1 7.53V2H16.47Z"
                fill="#0b66e4"
              />
              <path
                d="M22.18 8.27C21.8 12.13 19.44 14.54 15.98 14.54H13.34V17.01C13.34 19.64 15.51 21.67 18.14 21.67H20.15V25.29C20.15 27.92 22.32 29.95 24.95 29.95H25.41V27.53C25.41 24.9 23.24 22.87 20.61 22.87H18.6V19.35H21.23C24.26 19.35 26.81 16.91 26.81 13.8V8.27H22.18Z"
                fill="#2684FF"
                fillOpacity="0.7"
              />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            Jira
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        type="primary"
        size="large"
        onClick={startAuth}
        style={{
          marginTop: 48,
          height: 48,
          paddingInline: 32,
          borderRadius: 12,
          fontWeight: 700,
          background: "#142b6f",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 4px 14px rgba(20,43,111,0.32)",
        }}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8h1a4 4 0 010 8h-1M6 8H5a4 4 0 000 8h1M8 12h8"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        }
      >
        Connect to Jira
      </Button>

      <p
        style={{
          marginTop: 14,
          fontSize: 12,
          color: "#94a3b8",
          textAlign: "center",
        }}
      >
        Redirects to Atlassian OAuth — no password stored
      </p>
    </div>
  );
}
