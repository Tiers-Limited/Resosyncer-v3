import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

const STATUS_LABEL = {
  open: "Open",
  in_progress: "In progress",
  completed: "Completed",
  closed: "Closed",
};

const STATUS_DOT = {
  open: "#378ADD",
  in_progress: "#BA7517",
  completed: "#1D9E75",
  closed: "#888780",
};

const STATUS_PILL = {
  open: { bg: "#E6F1FB", text: "#0C447C", border: "#B5D4F4" },
  in_progress: { bg: "#FAEEDA", text: "#633806", border: "#FAC775" },
  completed: { bg: "#E1F5EE", text: "#085041", border: "#9FE1CB" },
  closed: { bg: "#F1EFE8", text: "#444441", border: "#D3D1C7" },
};

const TASK_FILTERS = ["all", "open", "in_progress", "completed", "closed"];

const C = {
  page: "#F7F6F3",
  card: "#FFFFFF",
  border: "rgba(0,0,0,0.08)",
  text: "#1A1A18",
  sub: "#6B6A65",
  muted: "#A8A79F",
  accent: "#1A1A18",
};

const font = "'DM Sans', sans-serif";

const card = {
  background: C.card,
  border: `0.5px solid ${C.border}`,
  borderRadius: 16,
};

const isMissingColumnError = (error, columnName = "") => {
  if (!error) return false;
  const msg = String(error.message || "").toLowerCase();
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    (columnName ? msg.includes(columnName.toLowerCase()) : false)
  );
};

const formatBytes = (bytes) => {
  if (bytes === null || bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isAllowedAttachment = (file) => {
  if (!file) return false;
  const t = String(file.type || "").toLowerCase();
  const n = String(file.name || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  if (t === "application/pdf") return true;
  if (t === "application/msword") return true;
  if (t === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return true;
  return n.endsWith(".pdf") || n.endsWith(".doc") || n.endsWith(".docx");
};

const isImageAttachment = (attachmentType, attachmentName) => {
  const type = String(attachmentType || "").toLowerCase();
  const name = String(attachmentName || "").toLowerCase();
  return type.startsWith("image/") || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name);
};

const sendEmail = async ({ to, subject, body, companyName }) => {
  if (!EMAIL_API || !to) return { success: false, error: "EMAIL_API_NOT_CONFIGURED" };
  try {
    const res = await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html: body, companyName }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err?.message || "send_failed" };
  }
};

export default function ClientProjectProgress() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [errorText, setErrorText] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");

  const [messages, setMessages] = useState([]);
  const [senderPhotoMap, setSenderPhotoMap] = useState({});
  const [viewerProfile, setViewerProfile] = useState(null);
  const [viewerRole, setViewerRole] = useState(null);
  const [senderName, setSenderName] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [messageSending, setMessageSending] = useState(false);
  const [messageFeatureUnavailable, setMessageFeatureUnavailable] = useState(false);
  const [inlineError, setInlineError] = useState("");

  const threadRef = useRef(null);
  const fileInputRef = useRef(null);
  const isTeamSender = viewerRole === "admin" || viewerRole === "project_manager";

  const snapshot = invite?.snapshot || {};
  const project = snapshot.project || {};
  const tickets = Array.isArray(snapshot.tickets) ? snapshot.tickets : [];

  const grouped = useMemo(
    () => ({
      open: tickets.filter((t) => t.status === "open"),
      in_progress: tickets.filter((t) => t.status === "in_progress"),
      completed: tickets.filter((t) => t.status === "completed"),
      closed: tickets.filter((t) => t.status === "closed"),
    }),
    [tickets],
  );

  const filteredTickets = useMemo(
    () => (taskFilter === "all" ? tickets : tickets.filter((t) => t.status === taskFilter)),
    [tickets, taskFilter],
  );

  const doneCount = grouped.completed.length + grouped.closed.length;
  const totalCount = tickets.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const scrollThread = () => {
    setTimeout(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, 60);
  };

  const hydrateSenderPhotos = async (rows = []) => {
    try {
      const senderIds = [...new Set(rows.map((r) => r?.sender_id).filter(Boolean))];
      if (!senderIds.length) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_photo")
        .in("id", senderIds);
      if (error) throw error;
      setSenderPhotoMap((prev) => {
        const next = { ...prev };
        (data || []).forEach((p) => {
          next[p.id] = p.user_photo || null;
        });
        return next;
      });
    } catch (err) {
      console.error("Failed to load sender photos:", err);
    }
  };

  const loadMessages = async (inviteId, silent = false) => {
    if (!inviteId) return;
    try {
      const { data, error } = await supabase
        .from("project_client_messages")
        .select(
          "id, client_name, client_email, message, created_at, sender_role, sender_id, attachment_url, attachment_name, attachment_size, attachment_type",
        )
        .eq("invite_id", inviteId)
        .order("created_at", { ascending: true })
        .limit(60);

      if (error) {
        if (error.code === "42P01") {
          setMessageFeatureUnavailable(true);
          return;
        }

        if (
          isMissingColumnError(error, "sender_id") ||
          isMissingColumnError(error, "sender_role") ||
          isMissingColumnError(error, "attachment_url")
        ) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("project_client_messages")
            .select("id, client_name, client_email, message, created_at")
            .eq("invite_id", inviteId)
            .order("created_at", { ascending: true })
            .limit(60);
          if (fallbackError) throw fallbackError;
          const normalized = (fallbackData || []).map((m) => ({
            ...m,
            sender_role: null,
            sender_id: null,
            attachment_url: null,
            attachment_name: null,
            attachment_size: null,
            attachment_type: null,
          }));
          setMessages(normalized);
          if (!silent) scrollThread();
          return;
        }

        throw error;
      }

      setMessages(data || []);
      await hydrateSenderPhotos(data || []);
      if (!silent) scrollThread();
    } catch (err) {
      console.error("Failed to load client messages:", err);
    }
  };

  useEffect(() => {
    const loadViewer = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("id", user.id)
          .maybeSingle();
        if (!profile) return;
        setViewerProfile(profile);
        setViewerRole(profile.role || null);
      } catch (err) {
        console.error("Failed to load viewer profile:", err);
      }
    };
    loadViewer();
  }, []);

  useEffect(() => {
    let intervalId;
    const run = async () => {
      if (!token) {
        setErrorText("Invalid link.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setErrorText("");
      try {
        const { data, error } = await supabase
          .from("project_client_invites")
          .select("id, client_name, client_email, invite_message, snapshot, updated_at")
          .eq("share_token", token)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setErrorText("This progress link is invalid or has expired.");
          return;
        }

        setInvite(data);
        setSenderName(isTeamSender ? viewerProfile?.full_name || "Team" : data.client_name || "");
        await loadMessages(data.id);
        intervalId = setInterval(() => loadMessages(data.id, true), 10000);
      } catch (err) {
        console.error(err);
        setErrorText("Unable to load project progress right now.");
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [token, isTeamSender, viewerProfile?.full_name]);

  const uploadMessageAttachment = async (file) => {
    if (!file) return null;
    if (!isAllowedAttachment(file)) {
      throw new Error("Only image, PDF, DOC, and DOCX files are allowed.");
    }

    const maxSize = 12 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("Attachment must be smaller than 12MB.");
    }

    const safeName = String(file.name || "file")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);
    const path = `project-client/${project?.id || "unknown"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-files")
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("chat-files").getPublicUrl(path);
    return {
      attachment_url: data?.publicUrl || null,
      attachment_name: file.name || safeName,
      attachment_size: file.size || null,
      attachment_type: file.type || null,
    };
  };

  const notifyCounterparty = async ({ messageText, attachment }) => {
    try {
      if (!invite) return;

      const attachmentHtml = attachment?.attachment_url
        ? `<p style="margin:10px 0 0;font-size:13px;color:#475569;">Attachment: <a href="${attachment.attachment_url}" target="_blank" rel="noopener noreferrer">${attachment.attachment_name || "Open file"}</a></p>`
        : "";

      if (isTeamSender) {
        if (!invite.client_email) return;

        const senderDisplay = viewerRole === "admin" ? "Admin" : "Project Manager";
        const html = `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px;">
            <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;">New project update from ${senderDisplay}</h2>
            <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.6;">Project: <strong>${project?.name || "Project"}</strong></p>
            <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;color:#334155;font-size:14px;line-height:1.6;">
              ${messageText || "(No text)"}
            </div>
            ${attachmentHtml}
          </div>
        `;

        await sendEmail({
          to: invite.client_email,
          subject: `New update on ${project?.name || "your project"}`,
          body: html,
          companyName: "Your Company",
        });
        return;
      }

      let pmEmail = null;
      let pmName = "Project Manager";

      if (project?.id) {
        const { data: projectRow } = await supabase
          .from("projects")
          .select("project_manager_id, tenant_id")
          .eq("id", project.id)
          .maybeSingle();

        if (projectRow?.project_manager_id) {
          const { data: pmProfile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", projectRow.project_manager_id)
            .maybeSingle();
          pmEmail = pmProfile?.email || null;
          pmName = pmProfile?.full_name || pmName;
        }

        if (!pmEmail && projectRow?.tenant_id) {
          const { data: adminFallback } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("tenant_id", projectRow.tenant_id)
            .eq("role", "admin")
            .limit(1)
            .maybeSingle();
          pmEmail = adminFallback?.email || null;
          pmName = adminFallback?.full_name || "Admin";
        }
      }

      if (!pmEmail) return;

      const sender = senderName?.trim() || invite.client_name || invite.client_email || "Client";
      const html = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px;">
          <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;">New client message on ${project?.name || "project"}</h2>
          <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.6;">Hi ${pmName}, <strong>${sender}</strong> left a new message.</p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;color:#334155;font-size:14px;line-height:1.6;">
            ${messageText || "(No text)"}
          </div>
          ${attachmentHtml}
        </div>
      `;

      await sendEmail({
        to: pmEmail,
        subject: `Client message: ${project?.name || "Project"}`,
        body: html,
        companyName: "Your Company",
      });
    } catch (err) {
      console.error("Notification email failed:", err);
    }
  };

  const submitMessage = async () => {
    if (!invite?.id || messageFeatureUnavailable) return;

    const body = msgBody.trim();
    const name = senderName.trim();
    if (!body && !attachmentFile) return;

    setInlineError("");
    setMessageSending(true);

    try {
      let attachment = {
        attachment_url: null,
        attachment_name: null,
        attachment_size: null,
        attachment_type: null,
      };
      if (attachmentFile) attachment = await uploadMessageAttachment(attachmentFile);

      const payload = {
        invite_id: invite.id,
        project_id: project.id || null,
        share_token: token,
        client_name: isTeamSender ? viewerProfile?.full_name || name || "Team" : name || null,
        client_email: isTeamSender ? viewerProfile?.email || null : invite?.client_email || null,
        message: body || null,
        sender_role: isTeamSender ? viewerRole : "client",
        sender_id: isTeamSender ? viewerProfile?.id || null : null,
        ...attachment,
      };

      let { error } = await supabase.from("project_client_messages").insert([payload]);

      if (isMissingColumnError(error, "sender_id") || isMissingColumnError(error, "sender_role")) {
        const fallbackPayload = {
          invite_id: invite.id,
          project_id: project.id || null,
          share_token: token,
          client_name: isTeamSender
            ? `${viewerProfile?.full_name || name || "Team"} (${viewerRole === "admin" ? "Admin" : "Project Manager"})`
            : name || null,
          client_email: isTeamSender ? viewerProfile?.email || null : invite?.client_email || null,
          message: body || null,
          ...attachment,
        };
        const fallback = await supabase.from("project_client_messages").insert([fallbackPayload]);
        error = fallback.error;
      }

      if (isMissingColumnError(error, "attachment_url")) {
        const fallbackNoAttachment = {
          invite_id: invite.id,
          project_id: project.id || null,
          share_token: token,
          client_name: isTeamSender
            ? `${viewerProfile?.full_name || name || "Team"} (${viewerRole === "admin" ? "Admin" : "Project Manager"})`
            : name || null,
          client_email: isTeamSender ? viewerProfile?.email || null : invite?.client_email || null,
          message: body || null,
        };
        const fallback = await supabase.from("project_client_messages").insert([fallbackNoAttachment]);
        error = fallback.error;
      }

      if (error) {
        if (error.code === "42P01") {
          setMessageFeatureUnavailable(true);
          return;
        }
        throw error;
      }

      setMsgBody("");
      setAttachmentFile(null);
      await loadMessages(invite.id);
      await notifyCounterparty({ messageText: body, attachment });
    } catch (err) {
      console.error(err);
      setInlineError(err?.message || "Failed to send message");
    } finally {
      setMessageSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitMessage();
  };

  const onPickAttachment = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAllowedAttachment(file)) {
      setInlineError("Only image, PDF, DOC, and DOCX files are allowed.");
      return;
    }
    setAttachmentFile(file);
    setInlineError("");
  };

  if (loading)
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.page, fontFamily: font }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.sub, fontSize: 14 }}>
          <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
          Loading project...
        </div>
      </div>
    );

  if (errorText)
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.page, padding: 20, fontFamily: font }}>
        <div style={{ ...card, maxWidth: 480, padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#A32D2D", fontWeight: 500, fontSize: 14, marginBottom: 8 }}>
            <AlertCircle size={15} /> Link unavailable
          </div>
          <div style={{ color: C.sub, fontSize: 14, lineHeight: 1.6 }}>{errorText}</div>
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: "100vh", background: C.page, fontFamily: font, padding: "32px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input, textarea, button { font-family: ${font}; }
        input::placeholder, textarea::placeholder { color: #B0AFA8; }
        input:focus, textarea:focus { outline: none; border-color: rgba(0,0,0,0.25) !important; }
        button:hover { opacity: 0.9; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .task-row:hover { background: #F7F6F3; }
        .filter-pill { transition: all 0.15s; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ ...card, padding: "32px 36px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 32, alignItems: "start" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>Project update</p>
              <h1 style={{ margin: "0 0 4px", fontSize: 30, fontWeight: 500, color: C.text, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{project.name || "Project"}</h1>
              <p style={{ margin: "0 0 16px", fontSize: 14, color: C.sub }}>Prepared for {invite?.client_name || invite?.client_email || "Client"}</p>
              {invite?.invite_message && <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.7, color: C.sub, maxWidth: 560 }}>{invite.invite_message}</p>}
              <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                Last updated: {invite?.updated_at ? dayjs(invite.updated_at).format("MMM D, YYYY [at] h:mm A") : "N/A"}
              </p>
            </div>

            <div style={{ background: "#F7F6F3", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em" }}>Progress</span>
                <span style={{ fontSize: 28, fontWeight: 500, color: C.text, letterSpacing: "-0.02em" }}>{progress}%</span>
              </div>
              <div style={{ height: 3, background: "rgba(0,0,0,0.1)", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: `${progress}%`, height: "100%", background: C.accent, borderRadius: 2, transition: "width 0.6s ease" }} />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.sub }}>{doneCount} of {totalCount} tasks completed</p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }}>
          {[
            { key: "open", count: grouped.open.length },
            { key: "in_progress", count: grouped.in_progress.length },
            { key: "completed", count: grouped.completed.length },
            { key: "closed", count: grouped.closed.length },
          ].map(({ key, count }) => (
            <div key={key} style={{ ...card, padding: "18px 20px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_DOT[key], marginBottom: 14 }} />
              <div style={{ fontSize: 30, fontWeight: 500, color: C.text, letterSpacing: "-0.02em", lineHeight: 1 }}>{count}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: C.sub }}>{STATUS_LABEL[key]}</div>
            </div>
          ))}
        </div>

        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: C.text }}>Tasks</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TASK_FILTERS.map((key) => {
                const active = taskFilter === key;
                return (
                  <button
                    key={key}
                    className="filter-pill"
                    onClick={() => setTaskFilter(key)}
                    style={{
                      borderRadius: 20,
                      padding: "5px 14px",
                      border: `0.5px solid ${active ? C.text : C.border}`,
                      background: active ? C.text : "transparent",
                      color: active ? "#fff" : C.sub,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    {key === "all" ? "All" : STATUS_LABEL[key]}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div style={{ padding: "32px 24px", fontSize: 13, color: C.muted, textAlign: "center" }}>No tasks in this category yet.</div>
          ) : (
            filteredTickets.map((t) => {
              const tone = STATUS_PILL[t.status] || STATUS_PILL.open;
              const done = t.status === "completed" || t.status === "closed";
              return (
                <div key={t.id} className="task-row" style={{ display: "grid", gridTemplateColumns: "12px 1fr auto", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: `0.5px solid ${C.border}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_DOT[t.status] || STATUS_DOT.open }} />
                  <div style={{ fontSize: 14, color: done ? C.muted : C.text, textDecoration: done ? "line-through" : "none", textDecorationColor: C.muted, lineHeight: 1.4 }}>{t.title || "Untitled task"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20, background: tone.bg, color: tone.text, border: `0.5px solid ${tone.border}`, whiteSpace: "nowrap" }}>
                      {STATUS_LABEL[t.status] || "Open"}
                    </span>
                    <span style={{ fontSize: 12, color: C.muted, minWidth: 44, textAlign: "right" }}>{t.updated_at ? dayjs(t.updated_at).format("MMM D") : "-"}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: `0.5px solid ${C.border}` }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: C.text }}>Activity</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: C.muted }}>
              {messages.length > 0 ? `${messages.length} message${messages.length !== 1 ? "s" : ""}` : "No messages yet"}
            </span>
          </div>

          {messageFeatureUnavailable ? (
            <div style={{ padding: "16px 24px", fontSize: 13, color: "#854F0B", background: "#FAEEDA" }}>
              Message feature is not enabled. Ask admin to run SQL setup.
            </div>
          ) : (
            <>
              <div ref={threadRef} style={{ maxHeight: 380, overflowY: "auto", padding: messages.length ? "16px 24px" : 0, display: "flex", flexDirection: "column", gap: 20 }}>
                {messages.length === 0 && (
                  <div style={{ padding: "28px 24px", textAlign: "center", fontSize: 13, color: C.muted }}>
                    No messages yet. Be the first to leave a note.
                  </div>
                )}

                {messages.map((m) => {
                  const initials = (m.client_name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  const isTeam =
                    m.sender_role === "admin" ||
                    m.sender_role === "project_manager" ||
                    m.client_name?.toLowerCase().includes("(admin)") ||
                    m.client_name?.toLowerCase().includes("(project manager)");

                  return (
                    <div key={m.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: isTeam ? "#E1F5EE" : "#E6F1FB", color: isTeam ? "#085041" : "#0C447C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, letterSpacing: "0.02em" }}>
                        {m.sender_id && senderPhotoMap[m.sender_id] ? (
                          <img src={senderPhotoMap[m.sender_id]} alt={m.client_name || "User"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          initials
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
                            {m.client_name || "Client"}
                            {m.sender_role === "admin" ? " (Admin)" : ""}
                            {m.sender_role === "project_manager" ? " (Project Manager)" : ""}
                          </span>
                          <span style={{ fontSize: 11, color: C.muted }} title={dayjs(m.created_at).format("MMM D, YYYY h:mm A")}>{dayjs(m.created_at).fromNow()}</span>
                        </div>

                        <div style={{ background: "#F7F6F3", border: `0.5px solid ${C.border}`, borderRadius: "4px 12px 12px 12px", padding: "10px 14px", fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
                          {m.message || "(Attachment only)"}
                          {m.attachment_url && (
                            <div style={{ marginTop: 8 }}>
                              {isImageAttachment(m.attachment_type, m.attachment_name) && (
                                <a href={m.attachment_url} target="_blank" rel="noreferrer">
                                  <img src={m.attachment_url} alt={m.attachment_name || "Attachment"} style={{ maxWidth: 260, maxHeight: 200, borderRadius: 8, border: `0.5px solid ${C.border}`, display: "block", marginBottom: 6 }} />
                                </a>
                              )}
                              <a href={m.attachment_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#0C447C", textDecoration: "none", display: "inline-flex", gap: 6, alignItems: "center" }}>
                                <Paperclip size={12} />
                                {m.attachment_name || "Open attachment"}
                                {m.attachment_size ? ` (${formatBytes(Number(m.attachment_size))})` : ""}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: `0.5px solid ${C.border}`, padding: "16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                {!isTeamSender && !invite?.client_name && (
                  <input
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Your name"
                    style={{ border: `0.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.text, background: "#FAFAF8", width: "50%" }}
                  />
                )}

                {isTeamSender && (
                  <div style={{ fontSize: 12, color: C.sub }}>
                    Sending as <span style={{ color: C.text, fontWeight: 500 }}>{viewerProfile?.full_name || "Team"}</span> ({viewerRole === "admin" ? "Admin" : "Project Manager"})
                  </div>
                )}

                {attachmentFile && (
                  <div style={{ border: `0.5px solid ${C.border}`, background: "#F7F6F3", borderRadius: 8, padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 8, width: "fit-content" }}>
                    <Paperclip size={12} />
                    <span style={{ fontSize: 12, color: C.sub }}>{attachmentFile.name} ({formatBytes(attachmentFile.size)})</span>
                    <button onClick={() => setAttachmentFile(null)} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", display: "inline-flex" }}>
                      <X size={12} color={C.muted} />
                    </button>
                  </div>
                )}

                {inlineError && (
                  <div style={{ fontSize: 12, color: "#A32D2D" }}>{inlineError}</div>
                )}

                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  <textarea
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a message... (Ctrl/Cmd + Enter to send)"
                    rows={2}
                    style={{ flex: 1, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, color: C.text, resize: "none", background: "#FAFAF8", lineHeight: 1.6, fontFamily: font }}
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={onPickAttachment}
                    style={{ display: "none" }}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: `0.5px solid ${C.border}`, background: "#fff", color: C.sub, borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0, height: 40 }}
                  >
                    <Paperclip size={13} /> File
                  </button>

                  <button
                    onClick={submitMessage}
                    disabled={messageSending || (!msgBody.trim() && !attachmentFile)}
                    style={{ border: "none", background: C.accent, color: "#fff", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6, cursor: messageSending || (!msgBody.trim() && !attachmentFile) ? "not-allowed" : "pointer", opacity: messageSending || (!msgBody.trim() && !attachmentFile) ? 0.4 : 1, flexShrink: 0, height: 40 }}
                  >
                    {messageSending ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "4px 0 8px", fontSize: 12, color: C.muted }}>
          {progress >= 100 ? <CheckCircle2 size={13} color="#1D9E75" /> : <Clock3 size={13} color={C.muted} />}
          This page updates whenever the team syncs project progress.
        </div>
      </div>
    </div>
  );
}
