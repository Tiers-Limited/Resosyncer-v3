import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Input,
  Spin,
  Tooltip,
  Select,
  DatePicker,
  message,
  Space,
} from "antd";
import {
  MessageSquare,
  Paperclip,
  History,
  Send,
  X,
  CheckCircle2,
  Users,
  Flag,
  Calendar,
  Edit2,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

dayjs.extend(relativeTime);

const { TextArea } = Input;

const initials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const avatarColor = (str = "") => {
  const colors = [
    "#003467",
    "#7c3aed",
    "#db2777",
    "#dc2626",
    "#ea580c",
    "#059669",
    "#2563eb",
    "#0891b2",
  ];
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
};

const UserAvatar = ({ name = "", image, size = 28 }) => (
  <Tooltip title={name}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: avatarColor(name),
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 800,
        border: "2px solid #fff",
        boxShadow: "0 1px 3px rgba(0,0,0,.12)",
        overflow: "hidden",
      }}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials(name)
      )}
    </div>
  </Tooltip>
);

const fmtTime = (d) => (d ? dayjs(d).fromNow() : "");

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
const POINTS_OPTIONS = [0, 1, 2, 3, 5, 8, 13, 21];
const STATUS_OPTIONS = ["open", "in_progress", "completed", "closed"];

const getAssigneeIds = (ticket) => {
  if (
    ticket?.assigned_to_ids !== undefined &&
    ticket?.assigned_to_ids !== null
  ) {
    let ids = ticket.assigned_to_ids;
    if (typeof ids === "string") {
      try {
        ids = JSON.parse(ids);
      } catch {
        ids = [];
      }
    }
    if (Array.isArray(ids) && ids.length > 0) return ids;
  }
  if (ticket?.assigned_to) return [ticket.assigned_to];
  return [];
};

const prettyStatus = (s) => (s ? s.replaceAll("_", " ").toUpperCase() : "—");
const prettyPriority = (p) => (p ? p[0].toUpperCase() + p.slice(1) : "—");

export default function TicketDetailsModal({
  open,
  ticket,
  onClose,
  onRefresh,
  projectAssignees = [],
  sprints = [],
  lockFieldsForPM = true,
}) {
  const { profile } = useAuth();
  const fileInputRef = useRef(null);

  const isPM = profile?.role === "project_manager";
  const isEmployee = profile?.role === "employee";
  const fieldLocked = isEmployee;

  const [activeTab, setActiveTab] = useState("comments");
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [completionRequest, setCompletionRequest] = useState(null);
  const [loadingRequestAction, setLoadingRequestAction] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const assigneeOptions = useMemo(
    () =>
      (projectAssignees || [])
        .map((a) => a?.profiles)
        .filter(Boolean)
        .map((p) => ({
          value: p.id,
          label: p.full_name || p.email || "User",
          photo: p.user_photo,
        })),
    [projectAssignees],
  );

  const [currentAssigneeIds, setCurrentAssigneeIds] = useState(
    getAssigneeIds(ticket),
  );
  const [currentPriority, setCurrentPriority] = useState(
    ticket?.priority || "medium",
  );
  const [currentStatus, setCurrentStatus] = useState(ticket?.status || "open");
  const [currentSprintId, setCurrentSprintId] = useState(ticket?.sprint_id || null);
  const [currentPoints, setCurrentPoints] = useState(ticket?.story_points || 0);
  const [currentDueDate, setCurrentDueDate] = useState(ticket?.due_date || null);

  const fetchComments = async () => {
    if (!ticket?.id) return;
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("ticket_comments")
        .select("*, profiles:user_id(id,full_name,user_photo)")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      if (!error) setComments(data || []);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchCompletionRequest = async () => {
    if (!ticket?.id) return;
    try {
      const { data, error } = await supabase
        .from("ticket_completion_requests")
        .select(
          `
          *,
          requester:requested_by(id,full_name,user_photo),
          reviewer:reviewed_by(id,full_name,user_photo)
        `,
        )
        .eq("ticket_id", ticket.id)
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error) setCompletionRequest(data || null);
    } catch (e) {
      console.error(e);
      setCompletionRequest(null);
    }
  };

  useEffect(() => {
    if (!open || !ticket?.id) return;
    setActiveTab("comments");
    setCurrentAssigneeIds(getAssigneeIds(ticket));
    setCurrentPriority(ticket.priority || "medium");
    setCurrentStatus(ticket.status || "open");
    setCurrentSprintId(ticket.sprint_id || null);
    setCurrentPoints(ticket.story_points || 0);
    setCurrentDueDate(ticket.due_date || null);
    setReviewNotes("");
  }, [open, ticket?.id]);

  useEffect(() => {
    if (!open || !ticket?.id) return;

    const fetchAttachments = async () => {
      try {
        const { data, error } = await supabase
          .from("ticket_attachments")
          .select("*, profiles:uploaded_by(id,full_name,user_photo)")
          .eq("ticket_id", ticket.id)
          .order("created_at", { ascending: false });
        if (!error) setAttachments(data || []);
      } catch (e) {
        console.error(e);
      }
    };

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("ticket_history")
          .select("*, profiles:changed_by(id,full_name,user_photo)")
          .eq("ticket_id", ticket.id)
          .order("created_at", { ascending: false });
        if (!error) setHistory(data || []);
      } catch (e) {
        console.error(e);
      }
    };

    fetchComments();
    fetchCompletionRequest();
    fetchAttachments();
    fetchHistory();
  }, [open, ticket?.id, profile?.id]);

  const canRequestCompletion =
    isEmployee &&
    ticket?.assigned_to === profile?.id &&
    ticket?.status !== "completed" &&
    ticket?.status !== "closed" &&
    (!completionRequest || completionRequest.status === "rejected");

  const canReviewCompletion = isPM && completionRequest?.status === "pending";

  const logHistory = async (field, oldVal, newVal) => {
    try {
      await supabase.from("ticket_history").insert([
        {
          ticket_id: ticket.id,
          changed_by: profile?.id,
          field_name: field,
          old_value: String(oldVal ?? ""),
          new_value: String(newVal ?? ""),
        },
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const updateTicketField = async (field, value, oldValue) => {
    if (!ticket?.id) return;
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ [field]: value })
        .eq("id", ticket.id);
      if (error) throw error;
      await logHistory(field, oldValue, value);
      onRefresh?.();
      message.success("Updated");
    } catch (e) {
      message.error("Update failed");
      console.error(e);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !ticket?.id) return;
    setSubmittingComment(true);
    try {
      const { error } = await supabase.from("ticket_comments").insert([
        {
          ticket_id: ticket.id,
          message: newComment.trim(),
          user_id: profile?.id,
        },
      ]);
      if (error) throw error;
      setNewComment("");
      await logHistory("comment_added", "", "Added a comment");
      onRefresh?.();
      fetchComments();
    } catch (e) {
      message.error("Failed to add comment");
      console.error(e);
    } finally {
      setSubmittingComment(false);
    }
  };

  const requestCompletion = async () => {
    if (!ticket?.id) return;
    setLoadingRequestAction(true);
    try {
      const { error } = await supabase.from("ticket_completion_requests").insert([
        {
          ticket_id: ticket.id,
          requested_by: profile?.id,
          status: "pending",
        },
      ]);
      if (error) throw error;
      await logHistory("completion_request", "", "Requested completion");
      message.success("Completion request submitted");
      await fetchCompletionRequest();
      onRefresh?.();
    } catch (e) {
      message.error("Failed to submit completion request");
      console.error(e);
    } finally {
      setLoadingRequestAction(false);
    }
  };

  const reviewCompletionRequest = async (approved) => {
    if (!completionRequest?.id || !ticket?.id) return;
    setLoadingRequestAction(true);
    try {
      const nextStatus = approved ? "approved" : "rejected";
      const { error: requestError } = await supabase
        .from("ticket_completion_requests")
        .update({
          status: nextStatus,
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes.trim() || null,
        })
        .eq("id", completionRequest.id);

      if (requestError) throw requestError;

      // Business rule:
      // - Approve => ticket closed
      // - Request changes => move back to in progress
      const targetTicketStatus = approved ? "closed" : "in_progress";
      const { error: ticketError } = await supabase
        .from("tickets")
        .update({ status: targetTicketStatus })
        .eq("id", ticket.id);

      if (ticketError) throw ticketError;

      setCurrentStatus(targetTicketStatus);
      await logHistory(
        "completion_review",
        completionRequest.status,
        approved ? "approved_closed" : "rejected_changes_requested",
      );
      message.success(
        approved
          ? "Completion approved. Ticket moved to Closed."
          : "Changes requested. Ticket moved to In Progress.",
      );
      setReviewNotes("");
      await fetchCompletionRequest();
      onRefresh?.();
    } catch (e) {
      message.error("Failed to review completion request");
      console.error(e);
    } finally {
      setLoadingRequestAction(false);
    }
  };

  const sprintOptions = useMemo(
    () =>
      (sprints || []).map((s) => ({
        value: s.id,
        label: s.name || "Sprint",
      })),
    [sprints],
  );

  const sprintMap = useMemo(
    () => new Map((sprints || []).map((s) => [s.id, s.name || "Sprint"])),
    [sprints],
  );
  const assigneeText = useMemo(() => {
    const names = currentAssigneeIds
      .map((id) => assigneeOptions.find((a) => a.value === id)?.label)
      .filter(Boolean);
    if (names.length > 0) return names.join(", ");
    if (ticket?.assigned_user?.full_name) return ticket.assigned_user.full_name;
    return "Unassigned";
  }, [assigneeOptions, currentAssigneeIds, ticket?.assigned_user?.full_name]);
  const selectedAssigneeProfiles = useMemo(() => {
    if (!currentAssigneeIds?.length) return [];
    return currentAssigneeIds
      .map((id) => {
        const profileEntry = (projectAssignees || []).find(
          (a) => a?.profiles?.id === id,
        );
        return profileEntry?.profiles || null;
      })
      .filter(Boolean);
  }, [currentAssigneeIds, projectAssignees]);
  const sprintText = useMemo(() => {
    if (!currentSprintId) return "—";
    return sprintMap.get(currentSprintId) || "—";
  }, [currentSprintId, sprintMap]);

  const historyIcon = (field) => {
    if (field === "comment_added") return <MessageSquare size={12} />;
    if (field === "attachment_added") return <Paperclip size={12} />;
    if (field === "status") return <CheckCircle2 size={12} />;
    if (field === "priority") return <Flag size={12} />;
    if (field === "assigned_to" || field === "assigned_to_ids")
      return <Users size={12} />;
    if (field === "due_date") return <Calendar size={12} />;
    return <Edit2 size={12} />;
  };

  const historyLabel = (item) => {
    if (item.field_name === "comment_added") return "added a comment";
    if (item.field_name === "attachment_added")
      return `attached "${item.new_value}"`;
    if (item.field_name === "status")
      return `changed status from "${item.old_value || "—"}" to "${item.new_value || "—"}"`;
    if (item.field_name === "priority")
      return `changed priority from "${item.old_value || "—"}" to "${item.new_value || "—"}"`;
    if (
      item.field_name === "assigned_to" ||
      item.field_name === "assigned_to_ids"
    ) {
      return "updated assignees";
    }
    return `updated ${item.field_name}`;
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1040}
      styles={{
        content: { padding: 0, borderRadius: 12, overflow: "hidden" },
      }}
      closeIcon={<X size={16} />}
    >
      <div style={{ display: "flex", minHeight: 620, background: "#fff" }}>
        {/* Left */}
        <div style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>
              {ticket?.ticket_type ? ticket.ticket_type.toUpperCase() : "TASK"}{" "}
              {ticket?.id ? `• #${String(ticket.id).slice(0, 6)}` : ""}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 850,
                color: "#0f172a",
                marginTop: 2,
                lineHeight: 1.2,
              }}
            >
              {ticket?.title || "Untitled"}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#111827",
                letterSpacing: 0.2,
                marginBottom: 6,
              }}
            >
              DESCRIPTION
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#334155",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
                background: "#fff",
              }}
            >
              {ticket?.description || "—"}
            </div>
          </div>

          {(completionRequest || canRequestCompletion || canReviewCompletion) && (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#f8fafc",
                padding: "12px 12px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#334155",
                  marginBottom: 6,
                }}
              >
                Completion Workflow
              </div>

              {completionRequest ? (
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
                  <strong>Status:</strong>{" "}
                  {completionRequest.status?.toUpperCase() || "—"}
                  {completionRequest.requester?.full_name
                    ? ` • Requested by ${completionRequest.requester.full_name}`
                    : ""}
                  {completionRequest.requested_at
                    ? ` ${fmtTime(completionRequest.requested_at)}`
                    : ""}
                  {completionRequest.reviewer?.full_name
                    ? ` • Reviewed by ${completionRequest.reviewer.full_name}`
                    : ""}
                  {completionRequest.review_notes
                    ? ` • Notes: ${completionRequest.review_notes}`
                    : ""}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                  No completion request yet.
                </div>
              )}

              {canRequestCompletion && (
                <button
                  onClick={requestCompletion}
                  disabled={loadingRequestAction}
                  style={{
                    background: "#0c66e4",
                    border: "none",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "7px 12px",
                    borderRadius: 8,
                    cursor: loadingRequestAction ? "not-allowed" : "pointer",
                    opacity: loadingRequestAction ? 0.7 : 1,
                  }}
                >
                  {loadingRequestAction ? "Submitting..." : "Request Completion"}
                </button>
              )}

              {canReviewCompletion && (
                <div>
                  <TextArea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    placeholder="Add notes (optional for approve, recommended for request changes)"
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => reviewCompletionRequest(true)}
                      disabled={loadingRequestAction}
                      style={{
                        background: "#16a34a",
                        border: "none",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "7px 12px",
                        borderRadius: 8,
                        cursor: loadingRequestAction ? "not-allowed" : "pointer",
                        opacity: loadingRequestAction ? 0.7 : 1,
                      }}
                    >
                      Approve & Close
                    </button>
                    <button
                      onClick={() => reviewCompletionRequest(false)}
                      disabled={loadingRequestAction}
                      style={{
                        background: "#f97316",
                        border: "none",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "7px 12px",
                        borderRadius: 8,
                        cursor: loadingRequestAction ? "not-allowed" : "pointer",
                        opacity: loadingRequestAction ? 0.7 : 1,
                      }}
                    >
                      Request Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div
            style={{
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              gap: 0,
              marginBottom: 16,
            }}
          >
            {[
              {
                key: "comments",
                label: "Comments",
                icon: <MessageSquare size={13} />,
                count: comments.length,
              },
              {
                key: "attachments",
                label: "Attachments",
                icon: <Paperclip size={13} />,
                count: attachments.length,
              },
              {
                key: "history",
                label: "History",
                icon: <History size={13} />,
                count: history.length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  border: "none",
                  borderBottom:
                    activeTab === tab.key
                      ? "2px solid #0c66e4"
                      : "2px solid transparent",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 650,
                  color: activeTab === tab.key ? "#0c66e4" : "#64748b",
                  marginBottom: -1,
                }}
              >
                {tab.icon} {tab.label}
                {tab.count > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background:
                        activeTab === tab.key ? "#e9f2ff" : "#f1f5f9",
                      color: activeTab === tab.key ? "#0c66e4" : "#64748b",
                      padding: "1px 6px",
                      borderRadius: 99,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "comments" && (
            <div>
              {loadingComments ? (
                <Spin size="small" />
              ) : comments.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "18px 0",
                    color: "#9ca3af",
                    fontSize: 12,
                  }}
                >
                  No comments yet. Be the first!
                </div>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      style={{ display: "flex", gap: 10, marginBottom: 14 }}
                    >
                      <UserAvatar
                        name={c.profiles?.full_name || "?"}
                        image={c.profiles?.user_photo}
                        size={28}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: "#0f172a",
                            }}
                          >
                            {c.profiles?.full_name || "Unknown"}
                          </span>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>
                            {fmtTime(c.created_at)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#334155",
                            background: "#f8fafc",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: "10px 12px",
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.6,
                          }}
                        >
                          {c.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <UserAvatar
                  name={profile?.full_name || "Me"}
                  image={profile?.user_photo}
                  size={28}
                />
                <div style={{ flex: 1 }}>
                  <TextArea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment… (Ctrl+Enter to submit)"
                    rows={3}
                    style={{
                      fontSize: 13,
                      borderRadius: 8,
                      borderColor: "#e5e7eb",
                      resize: "none",
                    }}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter")
                        addComment();
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 8,
                    }}
                  >
                    <button
                      onClick={addComment}
                      disabled={submittingComment || !newComment.trim()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: newComment.trim() ? "#0c66e4" : "#e5e7eb",
                        border: "none",
                        color: newComment.trim() ? "#fff" : "#9ca3af",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "7px 14px",
                        borderRadius: 8,
                        cursor: newComment.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      <Send size={13} />
                      {submittingComment ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attachments" && (
            <div style={{ color: "#64748b", fontSize: 13 }}>
              <div style={{ marginBottom: 10, fontSize: 12, color: "#94a3b8" }}>
                Attachments are visible here. (Upload UI can be enabled if you
                want.)
              </div>
              {attachments.length === 0 ? "No attachments yet" : null}
              {attachments.map((att) => (
                <div
                  key={att.id}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    marginBottom: 8,
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>
                    {att.file_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    {att.profiles?.full_name || "Unknown"} •{" "}
                    {fmtTime(att.created_at)}
                  </div>
                </div>
              ))}
              {/* keep ref for future upload enablement */}
              <input ref={fileInputRef} type="file" style={{ display: "none" }} />
            </div>
          )}

          {activeTab === "history" && (
            <div>
              {history.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px 0",
                    color: "#9ca3af",
                    fontSize: 12,
                  }}
                >
                  No activity yet
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 13,
                      top: 0,
                      bottom: 0,
                      width: 1.5,
                      background: "#e5e7eb",
                    }}
                  />
                  {history.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        gap: 10,
                        marginBottom: 14,
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "#f1f5f9",
                          border: "2px solid #e5e7eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: "#64748b",
                        }}
                      >
                        {historyIcon(item.field_name)}
                      </div>
                      <div style={{ flex: 1, paddingTop: 4 }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#1e293b",
                          }}
                        >
                          {item.profiles?.full_name || "Someone"}
                        </span>{" "}
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          {historyLabel(item)}
                        </span>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#9ca3af",
                            marginTop: 2,
                          }}
                        >
                          {fmtTime(item.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div
          style={{
            width: 320,
            borderLeft: "1px solid #e5e7eb",
            background: "#fbfbfc",
            padding: "18px 16px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>
            ASSIGNEES
          </div>
          {isEmployee ? (
            <div style={{ marginTop: 6 }}>
              {selectedAssigneeProfiles.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {selectedAssigneeProfiles.map((p) => (
                    <div
                      key={p.id}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <UserAvatar
                        name={p.full_name || "?"}
                        image={p.user_photo}
                        size={22}
                      />
                      <span
                        style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}
                      >
                        {p.full_name || p.email || "User"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{ marginTop: 6, fontSize: 13, color: "#0f172a", fontWeight: 600 }}
                >
                  {assigneeText}
                </div>
              )}
            </div>
          ) : (
            <Select
              mode="multiple"
              value={currentAssigneeIds}
              onChange={(ids) => {
                setCurrentAssigneeIds(ids);
                if (fieldLocked) return;
                updateTicketField(
                  "assigned_to_ids",
                  ids,
                  getAssigneeIds(ticket).join(","),
                );
                updateTicketField("assigned_to", ids[0] || null, ticket?.assigned_to);
              }}
              options={assigneeOptions.map((o) => ({
                value: o.value,
                label: (
                  <Space size={8}>
                    <UserAvatar name={o.label} image={o.photo} size={20} />
                    <span>{o.label}</span>
                  </Space>
                ),
              }))}
              placeholder="Select assignees"
              style={{ width: "100%", marginTop: 6 }}
              disabled={fieldLocked}
              tagRender={({ value, closable, onClose }) => {
                const p = (projectAssignees || []).find(
                  (a) => a?.profiles?.id === value,
                )?.profiles;
                return (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: 999,
                      padding: "2px 6px",
                      marginRight: 4,
                    }}
                  >
                    <UserAvatar
                      name={p?.full_name || "?"}
                      image={p?.user_photo}
                      size={16}
                    />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#334155" }}>
                      {p?.full_name || value}
                    </span>
                    {closable && (
                      <button
                        type="button"
                        onClick={onClose}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: 0,
                          lineHeight: 1,
                          fontSize: 12,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              }}
            />
          )}

          <div style={{ height: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>
            PRIORITY
          </div>
          {isEmployee ? (
            <div style={{ marginTop: 6, fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
              {prettyPriority(currentPriority)}
            </div>
          ) : (
            <Select
              value={currentPriority}
              onChange={(val) => {
                setCurrentPriority(val);
                if (fieldLocked) return;
                updateTicketField("priority", val, ticket?.priority);
              }}
              options={PRIORITY_OPTIONS.map((p) => ({
                value: p,
                label: p[0].toUpperCase() + p.slice(1),
              }))}
              style={{ width: "100%", marginTop: 6 }}
              disabled={fieldLocked}
            />
          )}

          <div style={{ height: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>
            STATUS
          </div>
          {isEmployee ? (
            <div style={{ marginTop: 6, fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
              {prettyStatus(currentStatus)}
            </div>
          ) : (
            <Select
              value={currentStatus}
              onChange={(val) => {
                setCurrentStatus(val);
                if (fieldLocked) return;
                updateTicketField("status", val, ticket?.status);
              }}
              options={STATUS_OPTIONS.map((s) => ({
                value: s,
                label: s.replace("_", " ").toUpperCase(),
              }))}
              style={{ width: "100%", marginTop: 6 }}
              disabled={fieldLocked}
            />
          )}

          <div style={{ height: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>
            SPRINT
          </div>
          {isEmployee ? (
            <div style={{ marginTop: 6, fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
              {sprintText}
            </div>
          ) : (
            <Select
              value={currentSprintId}
              onChange={(val) => {
                setCurrentSprintId(val);
                if (fieldLocked) return;
                updateTicketField("sprint_id", val || null, ticket?.sprint_id);
              }}
              options={[{ value: null, label: "—" }, ...sprintOptions]}
              style={{ width: "100%", marginTop: 6 }}
              disabled={fieldLocked}
            />
          )}

          <div style={{ height: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>
            STORY POINTS
          </div>
          {isEmployee ? (
            <div style={{ marginTop: 6, fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
              {currentPoints} pts
            </div>
          ) : (
            <Select
              value={currentPoints}
              onChange={(val) => {
                setCurrentPoints(val);
                if (fieldLocked) return;
                updateTicketField("story_points", val, ticket?.story_points || 0);
              }}
              options={POINTS_OPTIONS.map((p) => ({
                value: p,
                label: `${p} pts`,
              }))}
              style={{ width: "100%", marginTop: 6 }}
              disabled={fieldLocked}
            />
          )}

          <div style={{ height: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>
            DUE DATE
          </div>
          {isEmployee ? (
            <div style={{ marginTop: 6, fontSize: 13, color: "#0f172a", fontWeight: 600 }}>
              {currentDueDate ? dayjs(currentDueDate).format("MMM D, YYYY") : "—"}
            </div>
          ) : (
            <DatePicker
              value={currentDueDate ? dayjs(currentDueDate) : null}
              onChange={(d) => {
                const iso = d ? d.format("YYYY-MM-DD") : null;
                setCurrentDueDate(iso);
                if (fieldLocked) return;
                updateTicketField("due_date", iso, ticket?.due_date);
              }}
              style={{ width: "100%", marginTop: 6 }}
              disabled={fieldLocked}
            />
          )}

          <div style={{ height: 14 }} />
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            Created {ticket?.created_at ? fmtTime(ticket.created_at) : "—"}
            <br />
            Updated {ticket?.updated_at ? fmtTime(ticket.updated_at) : "—"}
          </div>
        </div>
      </div>
    </Modal>
  );
}

