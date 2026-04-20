import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Input, message, Spin } from "antd";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { normalizeMappedPayload } from "../lib/externalProjectImport";

const { TextArea } = Input;

const font = "'DM Sans', sans-serif";

export default function ClientImportReview() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payload, setPayload] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setPayload(null);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.rpc(
          "get_project_import_for_client",
          { p_token: token },
        );
        if (error) throw error;
        if (cancelled) return;
        setPayload(data && Object.keys(data).length ? data : null);
      } catch (e) {
        console.error(e);
        if (!cancelled) setPayload(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const mapped = payload?.mapped_payload || {};
  const { projects: mappedProjects } = normalizeMappedPayload(mapped);
  const legacyProject = mapped.project || {};
  const legacyTickets = Array.isArray(mapped.tickets) ? mapped.tickets : [];
  const reviewTitle =
    mappedProjects.length > 1
      ? `${mappedProjects.length} projects`
      : mappedProjects[0]?.project?.name ||
        legacyProject.name ||
        "Project import";

  const approve = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc(
        "client_approve_project_import",
        { p_token: token },
      );
      if (error) throw error;
      if (!data?.ok) {
        message.error("Could not approve (link may be expired or already used).");
        return;
      }
      message.success(
        "Thank you. Your team will see the import complete in Resosyncer shortly.",
      );
      setPayload((p) => (p ? { ...p, status: "approved" } : p));
    } catch (e) {
      console.error(e);
      message.error("Approval failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const reject = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc(
        "client_reject_project_import",
        { p_token: token, p_reason: rejectReason.trim() || null },
      );
      if (error) throw error;
      if (!data?.ok) {
        message.error("Could not reject (link may be invalid).");
        return;
      }
      message.info("Feedback recorded.");
      setPayload((p) => (p ? { ...p, status: "rejected" } : p));
    } catch (e) {
      console.error(e);
      message.error("Could not save rejection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: font,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!payload) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: font,
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            textAlign: "center",
            color: "#64748b",
            fontSize: 14,
          }}
        >
          This review link is invalid or has expired.
        </div>
      </div>
    );
  }

  if (payload.status === "imported" || payload.status === "importing") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: font,
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <CheckCircle2 size={40} color="#16a34a" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
            Import completed
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>
            {mappedProjects.length > 1
              ? "These projects have already been imported into Resosyncer."
              : "This project has already been imported into Resosyncer."}
          </div>
        </div>
      </div>
    );
  }

  if (payload.status === "rejected") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: font,
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", color: "#64748b", fontSize: 14 }}>
          This import was rejected.
        </div>
      </div>
    );
  }

  if (payload.status === "approved") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: font,
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 440 }}>
          <CheckCircle2 size={40} color="#16a34a" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
            Thank you
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 8, lineHeight: 1.5 }}>
            Your approval was recorded. The project will appear in Resosyncer
            automatically when your team has the Projects page open, or they can
            refresh the page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: font,
        padding: "32px 20px 48px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          border: "1px solid rgba(15,23,42,0.08)",
          padding: "28px 24px 32px",
          boxShadow: "0 8px 30px rgba(15,23,42,0.06)",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em" }}>
          RESOSYNCER · IMPORT REVIEW
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#0f172a",
            margin: "8px 0 6px",
            lineHeight: 1.25,
          }}
        >
          {reviewTitle}
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.55 }}>
          {(mappedProjects.length === 1
            ? mappedProjects[0]?.project?.description
            : null) ||
            legacyProject.description ||
            "Review the AI-mapped summary below. Approve to import into Resosyncer, or reject to send feedback."}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Client</div>
            <div style={{ color: "#0f172a" }}>
              {mappedProjects[0]?.project?.client_name ||
                legacyProject.client_name ||
                "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Email</div>
            <div style={{ color: "#0f172a" }}>
              {mappedProjects[0]?.project?.client_email ||
                legacyProject.client_email ||
                payload.client_email ||
                "—"}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
          {mappedProjects.length > 0
            ? `Projects & tickets (${mappedProjects.reduce((n, b) => n + (b.tickets?.length || 0), 0)} tickets)`
            : `Tickets (${legacyTickets.length})`}
        </div>
        <div
          style={{
            maxHeight: 280,
            overflow: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 10,
          }}
          className="custom-scrollbar"
        >
          {mappedProjects.length > 0 ? (
            mappedProjects.map((block, bi) => {
              const tickets = block.tickets || [];
              return (
                <div key={bi} style={{ marginBottom: bi < mappedProjects.length - 1 ? 16 : 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#1e40af",
                      marginBottom: 8,
                    }}
                  >
                    {block.project?.name || `Project ${bi + 1}`} ({tickets.length} tickets)
                  </div>
                  {tickets.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>No tickets</div>
                  ) : (
                    tickets.slice(0, 40).map((t, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "6px 0",
                          borderBottom:
                            i < Math.min(tickets.length, 40) - 1
                              ? "1px solid #f1f5f9"
                              : "none",
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
                          {t.title || "Untitled"}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          {(t.description || "").slice(0, 120)}
                          {(t.description || "").length > 120 ? "…" : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })
          ) : legacyTickets.length === 0 ? (
            <div style={{ fontSize: 13, color: "#94a3b8" }}>No tickets in mapping.</div>
          ) : (
            legacyTickets.slice(0, 80).map((t, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 0",
                  borderBottom:
                    i < legacyTickets.length - 1 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>
                  {t.title || "Untitled"}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {(t.description || "").slice(0, 160)}
                  {(t.description || "").length > 160 ? "…" : ""}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
            Rejection note (optional)
          </div>
          <TextArea
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="What should change before import?"
            style={{ marginBottom: 14 }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircle2 size={16} />}
            onClick={approve}
            loading={submitting}
            style={{ fontWeight: 700 }}
          >
            Approve import
          </Button>
          <Button
            danger
            size="large"
            icon={<XCircle size={16} />}
            onClick={reject}
            loading={submitting}
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
