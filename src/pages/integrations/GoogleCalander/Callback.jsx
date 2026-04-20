import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Spin, message } from "antd";
import { useNavigate } from "react-router-dom";
import {
  INTEGRATIONS_BACKEND_BASE,
  GOOGLE_CALANDER_CALLBACK_PATH,
  getGoogleCalanderAuthUrl,
  getGoogleCalanderEvents,
  getGoogleCalanderStatus,
} from "./api";

const resolveConnectUrl = (connectUrl) => {
  if (!connectUrl) return null;
  return new URL(connectUrl, INTEGRATIONS_BACKEND_BASE).toString();
};

export default function GoogleCalanderCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  const fallbackAuthUrl = useMemo(
    () => getGoogleCalanderAuthUrl(`${window.location.origin}${GOOGLE_CALANDER_CALLBACK_PATH}`),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const status = await getGoogleCalanderStatus();
        if (cancelled) return;
        setConnected(Boolean(status?.connected));
        if (!status?.connected) {
          setEvents([]);
          return;
        }
        message.success("Google Calendar connected successfully.");
        const list = await getGoogleCalanderEvents({ calendarId: "primary" });
        if (cancelled) return;
        setEvents(list.events || []);
      } catch (err) {
        if (cancelled) return;
        if (Number(err?.status) === 401) {
          message.warning("Reconnect Google Calendar");
          const connectHref = resolveConnectUrl(err?.connectUrl) || fallbackAuthUrl;
          window.location.assign(connectHref);
          return;
        }
        setError(err?.message || "Failed to verify Google Calendar callback.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [fallbackAuthUrl]);

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
          maxWidth: 620,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          {loading ? <Spin size="small" /> : null}
          <strong>Google Calendar callback</strong>
        </div>

        {error ? (
          <Alert type="error" showIcon message={error} />
        ) : connected ? (
          <Alert
            type="success"
            showIcon
            message="Google Calendar connected"
            description={`Loaded ${events.length} event(s) from primary calendar.`}
          />
        ) : (
          <Alert
            type="warning"
            showIcon
            message="Google Calendar is not connected"
            description="Please reconnect to continue."
          />
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/meetings", { replace: true })}>
            Back to Meetings
          </Button>
          {!connected ? (
            <Button
              type="primary"
              onClick={() => window.location.assign(fallbackAuthUrl)}
            >
              Connect Google Calendar
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
