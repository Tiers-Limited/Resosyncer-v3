import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Input, Spin, Tooltip, Select, DatePicker, message } from "antd";
import { MessageSquare, Paperclip, History, Send, X } from "lucide-react";
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
  const fieldLocked = lockFieldsForPM && isPM;

  const [activeTab, setActiveTab] = useState("comments");
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

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

  useEffect(() => {
    if (!open || !ticket?.id) return;
    setActiveTab("comments");
    setCurrentAssigneeIds(getAssigneeIds(ticket));
    setCurrentPriority(ticket.priority || "medium");
    setCurrentStatus(ticket.status || "open");
    setCurrentSprintId(ticket.sprint_id || null);
    setCurrentPoints(ticket.story_points || 0);
    setCurrentDueDate(ticket.due_date || null);
  }, [open, ticket?.id]);

  useEffect(() => {
    if (!open || !ticket?.id) return;

    const fetchComments = async () => {
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
    fetchAttachments();
    fetchHistory();
  }, [open, ticket?.id, profile?.id]);

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
    } catch (e) {
      message.error("Failed to add comment");
      console.error(e);
    } finally {
      setSubmittingComment(false);
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
            <div style={{ color: "#64748b", fontSize: 13 }}>
              {history.length === 0 ? "No history yet" : null}
              {history.map((h) => (
                <div
                  key={h.id}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    marginBottom: 8,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                    {h.field_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {h.old_value ? `"${h.old_value}" → ` : ""}
                    "{h.new_value}"
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                    {h.profiles?.full_name || "Unknown"} • {fmtTime(h.created_at)}
                  </div>
                </div>
              ))}
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
              label: o.label,
            }))}
            placeholder="Select assignees"
            style={{ width: "100%", marginTop: 6 }}
            disabled={fieldLocked}
          />

          <div style={{ height: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>
            PRIORITY
          </div>
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

          <div style={{ height: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>
            STATUS
          </div>
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

          <div style={{ height: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>
            SPRINT
          </div>
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

          <div style={{ height: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>
            STORY POINTS
          </div>
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

          <div style={{ height: 14 }} />

          <div style={{ fontSize: 11, fontWeight: 900, color: "#94a3b8" }}>
            DUE DATE
          </div>
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

