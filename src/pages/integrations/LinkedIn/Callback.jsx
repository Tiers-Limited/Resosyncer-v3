import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getLinkedinStatus } from "./api";

export default function LinkedInCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying LinkedIn connection...");

  useEffect(() => {
    let mounted = true;
    const verify = async () => {
      try {
        const status = await getLinkedinStatus();
        if (!mounted) return;
        const connected = Boolean(status?.connected);
        setMessage(
          connected
            ? "LinkedIn connected. Redirecting..."
            : "LinkedIn verification completed. Redirecting...",
        );
        navigate("/recruitment", {
          replace: true,
          state: {
            linkedinCallback: connected ? "connected" : "not_connected",
          },
        });
      } catch (error) {
        if (!mounted) return;
        navigate("/recruitment", {
          replace: true,
          state: {
            linkedinCallback: "error",
            linkedinMessage: error?.message || "Could not verify LinkedIn status.",
            linkedinDetails: error?.details || null,
          },
        });
      }
    };
    verify();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#141416",
        color: "#f8fafc",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15 }}>
        <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        <span>{message}</span>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
